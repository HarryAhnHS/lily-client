import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { authorizedFetch } from '@/services/api';
import { ChevronRight, CheckCircle2, XCircle, CircleDot, ArrowLeft, Target, Calendar, Clock, BarChart3, Layers, Activity, FileCheck, ChevronDown, ChevronUp, Info, Users, X } from 'lucide-react';
import { toast } from 'sonner';
import { SortFilterSessionsTable } from '@/components/SortFilterSessionsTable';
import { useAuth } from '@/app/context/auth-context';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import PerformanceCharts from '@/components/PerformanceCharts';

export default function ObjectiveView({ objective, isOpen, onClose, previewMode = false }) {
  const { session } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [objectiveData, setObjectiveData] = useState(null);
  const [subjectArea, setSubjectArea] = useState(null);
  const [goal, setGoal] = useState(null);
  const [showSessions, setShowSessions] = useState(false);

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
    setIsLoading(true);
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
        month: 'long', 
        day: 'numeric',
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
      return <CircleDot className="h-5 w-5 text-amber-500" />;
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

  // Toggle sessions view
  const toggleSessions = () => {
    setShowSessions(!showSessions);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-background w-full max-w-5xl mx-auto p-0 h-[800px] overflow-hidden border border-border/50 sm:rounded-xl rounded-none shadow-lg">
        <VisuallyHidden>
          <DialogTitle>Objective Assessment</DialogTitle>
        </VisuallyHidden>
        <motion.div 
          className="flex flex-col h-full w-full relative"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3 }}
        >
          {/* Clipboard Top Bar */}
          <div className="bg-primary/10 p-4 border-b border-border/30 flex flex-wrap justify-between items-center gap-2">
            <div className="flex items-center gap-3">
              <div className="bg-background h-7 w-7 rounded-full border border-border/50 flex items-center justify-center">
                <Target className="h-4 w-4 text-primary" />
              </div>
              <h3 className="text-sm font-medium">Objective Assessment</h3>
            </div>
            
            {/* Student Information - Responsive */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <div className="bg-primary/5 px-3 py-1.5 rounded-full border border-border/30 flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-primary/80" />
                <span className="font-medium">{objectiveData?.student?.name || 'Student'}</span>
              </div>
              {objectiveData?.student?.grade_level && (
                <div className="bg-primary/5 px-3 py-1.5 rounded-full border border-border/30">
                  Grade {objectiveData?.student?.grade_level}
                </div>
              )}
              {objectiveData?.student?.disability_type && (
                <div className="bg-primary/5 px-3 py-1.5 rounded-full border border-border/30 max-w-[200px] truncate">
                  {objectiveData?.student?.disability_type}
                </div>
              )}
            </div>
          </div>
          
          {/* Main Content */}
          <div className="h-[calc(100%-50px)] relative overflow-hidden">
            {isLoading && objectiveData === null ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin h-10 w-10 border-4 border-primary border-opacity-25 rounded-full border-t-primary"></div>
              </div>
            ) : (
              <>
                {/* Main Content Area - Objective Details - Scrollable */}
                <div className="absolute inset-0 overflow-y-auto">
                  <div className="p-4">
                    {/* Content Area */}
                    <div className="p-2">
                        <motion.h2 
                          className="text-lg text-emphasis-high leading-snug font-medium mb-4"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.1, duration: 0.3 }}
                        >
                          <span className="text-lg font-light mb-4">Objective:&nbsp;</span>
                          {safeDescription}
                        </motion.h2>
                        
                        {/* Hierarchical Path - Styled more elegantly */}
                        <motion.div 
                          className="flex items-center flex-wrap gap-3 p-3 bg-primary/5 rounded-lg text-sm mb-5 border border-border/30"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.3 }}
                        >
                          <div className="flex items-center gap-2">
                            <div className="bg-primary/10 p-1.5 rounded-md">
                              <Activity className="w-3.5 h-3.5 text-primary" />
                            </div>
                            <div>
                              <div className="text-xs text-emphasis-medium mb-0.5">Area of Need</div>
                              <div className="font-medium">{safeSubjectArea}</div>
                            </div>
                          </div>
                          
                          <ChevronRight className="w-4 h-4 text-emphasis-low" />
                          
                          <div className="flex items-center gap-2">
                            <div className="bg-primary/10 p-1.5 rounded-md">
                              <Layers className="w-3.5 h-3.5 text-primary" />
                            </div>
                            <div>
                              <div className="text-xs text-emphasis-medium mb-0.5">Goal</div>
                              <div className="font-medium">{safeGoal}</div>
                            </div>
                          </div>
                        </motion.div>
                      
                      {/* Objective Info */}
                      <div className="mb-6">
                        {/* Target Criteria */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                          <div className="bg-primary/5 p-3 rounded-lg border border-border/30 transition-colors hover:bg-primary/10">
                            <div className="text-xs text-emphasis-medium mb-1 flex items-center gap-1">
                              <Info className="w-3 h-3 text-primary" />
                              Type
                            </div>
                            <div className="font-medium">{safeObjectiveType === 'binary' ? 'Yes/No (Binary)' : 'Trial Based'}</div>
                          </div>
                          
                          
                          <div className="bg-primary/5 p-3 rounded-lg border border-border/30 transition-colors hover:bg-primary/10">
                            <div className="text-xs text-emphasis-medium mb-1 flex items-center gap-1">
                              <Target className="w-3 h-3 text-primary" />
                              Target Success
                            </div>
                            <div className="font-medium">
                              {safeTargetSuccesses} out of {safeTargetTrials}
                            </div>
                          </div>
                          
                          {safeObjectiveType === 'trial' && safeTargetAccuracy > 0 && (
                            <div className="bg-primary/5 p-3 rounded-lg border border-border/30 transition-colors hover:bg-primary/10">
                              <div className="text-xs text-emphasis-medium mb-1 flex items-center gap-1">
                                <BarChart3 className="w-3 h-3 text-primary" />
                                Accuracy Target
                              </div>
                              <div className="font-medium">{Math.round(safeTargetAccuracy * 100)}%</div>
                            </div>
                          )}
                          
                          <div className="bg-primary/5 p-3 rounded-lg border border-border/30 transition-colors hover:bg-primary/10">
                            <div className="text-xs text-emphasis-medium mb-1 flex items-center gap-1">
                              <Users className="w-3 h-3 text-primary" />
                              Sessions
                            </div>
                            <div className="font-medium">{sessions.length || 0} total</div>
                          </div>
                        </div>
                        
                        {/* Performance Charts - Show even with no sessions */}
                        {!previewMode && (
                          <PerformanceCharts 
                            sessions={sessions}
                            objectiveType={safeObjectiveType}
                            trialBased={safeObjectiveType === 'trial'} 
                          />
                        )}
                        
                        {/* Recent Sessions Quick View - Enhanced styling */}
                        {!previewMode && sessions.length > 0 && recentSessions.length > 0 && (
                          <div className="bg-primary/5 p-4 rounded-xl border border-border/30 mb-6">
                            <h4 className="font-medium mb-4 flex items-center gap-2">
                              <div className="bg-primary/10 p-1 rounded-md">
                                <Clock className="h-4 w-4 text-primary" />
                              </div>
                              <span>Recent Sessions</span>
                            </h4>
                            
                            <div className="space-y-2">
                              {recentSessions.map((session, index) => (
                                <motion.div 
                                  key={session.id || index}
                                  className="flex items-center justify-between text-sm p-3 rounded-lg bg-background transition-colors border border-border/30 hover:bg-accent/5"
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: 0.1 * index, duration: 0.3 }}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="flex-shrink-0">
                                      {getStatusIcon(session)}
                                    </div>
                                    <div className="flex flex-col">
                                      <span className="font-medium">{formatDate(session.created_at)}</span>
                                      <span className="text-xs text-emphasis-medium">
                                        {formatTime(session.created_at)}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="px-3 py-1 bg-primary/5 rounded-full text-xs font-medium">
                                    {getTrialText(session)}
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Sessions Panel with Integrated Button - On Top Layer */}
                {!previewMode && (
                  <motion.div 
                    className="absolute inset-0 flex flex-col pointer-events-none z-10 bg-background"
                    initial={{ y: "calc(100% - 50px)" }}
                    animate={{ y: showSessions ? 0 : "calc(100% - 50px)" }}
                    transition={{ 
                      type: "spring",
                      stiffness: 300,
                      damping: 30,
                      mass: 0.8
                    }}
                  >
                    {/* Integrated Toggle Button */}
                    <div className="pointer-events-auto relative z-20 h-[50px]">
                      <Button 
                        variant="outline" 
                        onClick={toggleSessions} 
                        className="w-full h-full justify-center gap-2 hover:bg-primary/10 relative z-10 border-none rounded-none shadow-none"
                      >
                        {showSessions ? "Hide Sessions" : "View All Sessions"}
                        <motion.div
                          animate={{ rotate: showSessions ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronUp className="h-4 w-4" />
                        </motion.div>
                      </Button>
                    </div>
                    
                    {/* Sessions Content Panel */}
                    <div className="flex-1 overflow-hidden pointer-events-auto">
                      <div className="overflow-y-auto h-full p-5">
                        {sessions.length > 0 ? (
                          <SortFilterSessionsTable sessions={sessions} />
                        ) : (
                          <div className="h-full flex flex-col items-center justify-center text-center p-6">
                            <div className="bg-primary/10 rounded-full p-4 mb-4">
                              <FileCheck className="h-6 w-6 text-primary" />
                            </div>
                            <h3 className="text-lg font-medium mb-2">No Sessions Yet</h3>
                            <p className="text-emphasis-medium text-sm max-w-md">
                              No sessions have been recorded for this objective. 
                              Log some progress to start tracking performance.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </>
            )}
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
} 