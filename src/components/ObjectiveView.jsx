import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { authorizedFetch } from '@/services/api';
import { ChevronRight, CheckCircle2, XCircle, CircleDot, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { SortFilterSessionsTable } from '@/components/SortFilterSessionsTable';
import { useAuth } from '@/app/context/auth-context';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function ObjectiveView({ objective, isOpen, onClose, previewMode = false }) {
  const { session } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [objectiveData, setObjectiveData] = useState(null);
  const [subjectArea, setSubjectArea] = useState(null);
  const [goal, setGoal] = useState(null);

  // Initialize with the objective data we already have
  useEffect(() => {
    if (objective) {
      console.log("Initial objective data:", objective);
      setObjectiveData(objective);
      
      // If the objective already has subject_area and goal data, use it
      if (objective.subject_area?.name) {
        setSubjectArea(objective.subject_area);
      }
      
      if (objective.goal?.title) {
        setGoal(objective.goal);
      }
    }
  }, [objective]);

  // Fetch complete objective data and sessions when modal opens
  useEffect(() => {
    if (isOpen && objective?.id && session && !previewMode) {
      fetchCompleteData();
    } else if (isOpen && previewMode) {
      // For preview mode, just use the data we already have
      setIsLoading(false);
    }
  }, [isOpen, objective?.id, session, previewMode]);

  const fetchCompleteData = async () => {
    setIsLoading(true);
    try {
      console.log("Fetching complete data for objective ID:", objective.id);
      
      // Create an array of promises to fetch all data in parallel
      const promises = [
        // 1. Get detailed objective data
        authorizedFetch(`/objectives/objective/${objective.id}`, session.access_token),
      ];
      
      // Execute initial promises
      const [objectiveResponse] = await Promise.all(promises);
      
      // Process objective data
      let objectiveDetails = null;
      let subject_area_id = null;
      let goal_id = null;

      if (objectiveResponse.ok) {
        const detailsData = await objectiveResponse.json();
        console.log("Fetched objective details:", detailsData);
        
        if (detailsData && detailsData.length > 0) {
          objectiveDetails = detailsData[0];
          subject_area_id = objectiveDetails.subject_area_id;
          goal_id = objectiveDetails.goal_id;
          
          // Set objective data with what we have so far
          setObjectiveData(prevData => ({
            ...prevData,
            ...objectiveDetails
          }));
        }
      } else {
        console.error("Error fetching objective:", objectiveResponse.status);
        toast.error("Failed to fetch objective details");
      }
      
      // Try to fetch sessions if we have the objective data
      if (objectiveDetails?.id) {
        try {
          const sessionsResponse = await authorizedFetch(
            `/sessions/objective/${objectiveDetails.id}`, 
            session.access_token
          );
          
          if (sessionsResponse.ok) {
            const sessionsData = await sessionsResponse.json();
            console.log("Fetched sessions:", sessionsData);
            setSessions(sessionsData || []);
          } else {
            console.warn("No sessions found for this objective");
            setSessions([]);
          }
        } catch (err) {
          console.error("Error fetching sessions:", err);
          setSessions([]);
        }
      }
      
      // Now fetch subject area if needed and we have an ID
      if (subject_area_id && (!subjectArea || !subjectArea.name)) {
        try {
          const subjectResponse = await authorizedFetch(
            `/subject-areas/subject-area/${subject_area_id}`,
            session.access_token
          );
          
          if (subjectResponse.ok) {
            const subjectData = await subjectResponse.json();
            console.log("Fetched subject area:", subjectData);
            
            if (subjectData && subjectData.length > 0) {
              setSubjectArea(subjectData[0]);
            }
          }
        } catch (err) {
          console.error("Error fetching subject area:", err);
        }
      }
      
      // Fetch goal if needed and we have an ID
      if (goal_id && (!goal || !goal.title)) {
        try {
          const goalResponse = await authorizedFetch(
            `/goals/goal/${goal_id}`,
            session.access_token
          );
          
          if (goalResponse.ok) {
            const goalData = await goalResponse.json();
            console.log("Fetched goal:", goalData);
            
            if (goalData && goalData.length > 0) {
              setGoal(goalData[0]);
            }
          }
        } catch (err) {
          console.error("Error fetching goal:", err);
        }
      }
      
    } catch (error) {
      console.error("Error in fetchCompleteData:", error);
      toast.error("Failed to load objective details");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        month: '2-digit', 
        day: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
      });
    } catch (error) {
      console.error('Error formatting time:', error);
      return '';
    }
  };

  const getStatusIcon = (session) => {
    const progress = session.objective_progress;
    if (!progress || progress.is_success === null) {
      return <CircleDot className="h-5 w-5 text-yellow-500" />;
    }
    return progress.is_success ? 
      <CheckCircle2 className="h-5 w-5 text-green-500" /> : 
      <XCircle className="h-5 w-5 text-red-500" />;
  };

  const getTrialText = (session) => {
    const progress = session?.objective_progress;
    if (!progress) return 'N/A';
    return `${progress.trials_completed || 0}/${progress.trials_total || 0}`;
  };

  // Get the most recent 5 sessions
  const recentSessions = sessions.slice(0, 5);
  
  // Safe access to objective properties
  const safeObjectiveType = objectiveData?.objective_type || 'binary';
  const safeTargetSuccesses = objectiveData?.target_consistency_successes || 0;
  const safeTargetTrials = objectiveData?.target_consistency_trials || 0;
  const safeTargetAccuracy = objectiveData?.target_accuracy || 0;
  const safeCreatedAt = objectiveData?.created_at || new Date().toISOString();
  const safeDescription = objectiveData?.description || 'No description available';
  
  // Use subject area and goal info - prioritize state values which contain fresh API data
  const safeSubjectArea = subjectArea?.name || objectiveData?.subject_area?.name || 'Unknown Area';
  const safeGoal = goal?.title || objectiveData?.goal?.title || 'Unknown Goal';

  // Calculate progress percentage based on available sessions data
  const calculateProgress = () => {
    if (!sessions || sessions.length === 0) return 0;
    
    // Count successful sessions
    const successfulSessions = sessions.filter(session => 
      session.objective_progress?.is_success === true
    ).length;
    
    // Calculate percentage
    return Math.round((successfulSessions / sessions.length) * 100);
  };
  
  const progressPercentage = calculateProgress();

  // Generate progress dots (5 total)
  const renderProgressDots = () => {
    const totalDots = 5;
    const filledDots = Math.round((progressPercentage / 100) * totalDots);
    
    return Array(totalDots).fill(0).map((_, index) => {
      const color = index < filledDots 
        ? index < 2 ? "bg-red-400" : "bg-green-600" 
        : "bg-gray-300";
      
      return (
        <div 
          key={index} 
          className={`w-6 h-6 rounded-full ${color}`}
        />
      );
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] w-[1100px] max-h-[90vh] p-0 overflow-hidden bg-gray-100">
        <div className="h-8 border-b border-gray-200 flex items-center pl-2">
          <DialogTitle className="sr-only">Objective Details</DialogTitle>
          <Button 
            variant="ghost" 
            className="inline-flex items-center h-7 px-2 text-black"
            onClick={onClose}
          >
            <ArrowLeft className="h-4 w-4 text-black mr-1" />
            <span className="font-medium">back</span>
          </Button>
        </div>
        
        <div className="overflow-y-auto max-h-[calc(90vh-32px)] px-4 pt-2 pb-4">
          {isLoading && objectiveData === null ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin h-10 w-10 border-4 border-black border-opacity-25 rounded-full border-t-black"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Main Objective Box */}
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                <div className="space-y-2">
                  <p className="text-lg text-gray-800 leading-snug font-medium">{safeDescription}</p>
                  <div className="flex items-center text-sm text-gray-600 gap-1">
                    <span className="font-medium">{safeSubjectArea}</span>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                    <span>{safeGoal}</span>
                  </div>
                  {safeObjectiveType !== 'binary' && (
                    <div className="text-sm text-gray-700">
                      Target: {safeTargetSuccesses} out of {safeTargetTrials} trials
                      {safeObjectiveType === 'trial' && (
                        <span className="ml-2">with {Math.round(safeTargetAccuracy * 100)}% accuracy</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Progress Section - Only shown when not in preview mode */}
              {!previewMode && (
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <div className="text-base font-medium text-gray-800">Total Progress:</div>
                    <div className="text-base font-medium text-gray-800">{progressPercentage}%</div>
                  </div>
                  <div className="flex space-x-2">
                    {renderProgressDots()}
                  </div>
                </div>
              )}
              
              {/* Moments of Progress - Shown differently in preview mode */}
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-2">
                  {previewMode ? 'Progress Tracking' : 'Moments of Progress'}
                </h2>
                
                <div className="bg-white rounded-lg overflow-hidden border border-gray-200">
                  {previewMode ? (
                    <div className="p-4 text-center text-gray-500">
                      <p>No sessions yet. Progress will be tracked here after adding the student.</p>
                    </div>
                  ) : (
                    <>
                      {/* Table Header */}
                      <div className="grid grid-cols-12 gap-3 border-b p-3 bg-gray-50 text-gray-800 font-medium">
                        <div className="col-span-3">Date</div>
                        <div className="col-span-2">Score</div>
                        <div className="col-span-7">Notes</div>
                      </div>
                      
                      {/* Table Content */}
                      <div className="divide-y divide-gray-100">
                        {recentSessions.length > 0 ? (
                          recentSessions.map((session) => (
                            <div key={session.id} className="grid grid-cols-12 gap-3 p-3 hover:bg-gray-50">
                              <div className="col-span-3">{formatDate(session.created_at)}</div>
                              <div className="col-span-2 flex items-center">
                                {getStatusIcon(session)}
                                <span className="ml-1">
                                  {session.objective_progress?.trials_completed || 0}/
                                  {session.objective_progress?.trials_total || 10}
                                </span>
                              </div>
                              <div className="col-span-7 text-gray-600">
                                {session.memo || "No notes recorded"}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-3 text-center text-gray-500">No progress moments recorded yet</div>
                        )}
                      </div>
                    </>
                  )}
                </div>
                
                {/* Additional Sessions Table - not shown in preview mode */}
                {!previewMode && sessions.length > 5 && (
                  <div className="bg-white rounded-lg overflow-hidden border border-gray-200 mt-3 p-4">
                    <h3 className="text-base font-medium text-gray-900 mb-2">All Progress History</h3>
                    <SortFilterSessionsTable 
                      sessions={sessions}
                      showActions={true}
                      onSuccess={() => fetchCompleteData()}
                    />
                  </div>
                )}
              </div>
              
              {/* Requirements & Details (hidden by default but expandable) */}
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <details>
                  <summary className="cursor-pointer text-base font-medium text-gray-800">
                    Additional Details
                  </summary>
                  <div className="mt-2 space-y-2 text-sm text-gray-600">
                    <p>Type: <span className="font-medium">{safeObjectiveType}</span></p>
                    {!previewMode && (
                      <p>Created: <span className="font-medium">{formatDate(safeCreatedAt)}</span></p>
                    )}
                    <div className="pt-2 border-t border-gray-100">
                      <p className="font-medium mb-1">Success Criteria:</p>
                      <p>{safeTargetSuccesses} out of {safeTargetTrials} trials successful</p>
                      {safeObjectiveType === 'trial' && (
                        <p className="mt-1">Target Accuracy: {Math.round(safeTargetAccuracy * 100)}%</p>
                      )}
                    </div>
                  </div>
                </details>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 