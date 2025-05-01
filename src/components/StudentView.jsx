import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Check, Plus, Activity, MoreHorizontal, X, ChevronLeft, ChevronDown, ChevronUp, Users, CalendarDays, Bookmark, Clock, CircleCheck, Target, BarChart3, Layers, FileCheck, AlertCircle, Clipboard, User } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Pencil, Trash2 } from 'lucide-react';
import { SortFilterSessionsTable } from '@/components/SortFilterSessionsTable';
import { useState, useEffect, useMemo, useRef } from 'react';
import { authorizedFetch } from '@/services/api';
import { useAuth } from '@/app/context/auth-context';
import { toast } from 'sonner';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { motion, AnimatePresence } from 'framer-motion';

export function StudentView({ 
  student, 
  onBack, 
  onAddObjective, 
  onEditStudent, 
  onDeleteStudent, 
  onEditObjective, 
  onDeleteObjective, 
  onObjectiveClick 
}) {
  const { session } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedAreas, setSelectedAreas] = useState({});
  const [subjectAreas, setSubjectAreas] = useState([]);
  const [isLoadingAreas, setIsLoadingAreas] = useState(true);
  const [showSessions, setShowSessions] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const sessionsRef = useRef(null);

  // Early return if no student data
  if (!student) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <div className="text-red-500 mb-4">No student data available</div>
        <Button onClick={onBack} variant="outline">
          Go Back
        </Button>
      </div>
    );
  }

  // Process and group objectives by goals
  const groupedObjectivesByArea = useMemo(() => {
    const result = {};
    
    subjectAreas.forEach(area => {
      // Get objectives for this area
      const objectives = area.objectives || area.objective || [];
      
      // Group by goal_id
      const goalGroups = objectives.reduce((acc, obj) => {
        const goalId = obj.goal_id || 'unknown';
        if (!acc[goalId]) {
          acc[goalId] = {
            id: goalId,
            title: obj.goal?.title || 'Unknown Goal',
            objectives: []
          };
        }
        acc[goalId].objectives.push(obj);
        return acc;
      }, {});
      
      result[area.id] = {
        area: area,
        goalGroups: Object.values(goalGroups)
      };
    });
    
    return result;
  }, [subjectAreas]);

  // Stats for dashboard
  const stats = useMemo(() => {
    // Count total objectives
    let totalObjectives = 0;
    subjectAreas.forEach(area => {
      const objectives = area.objectives || area.objective || [];
      totalObjectives += objectives.length;
    });
    
    // Mock data for now (will be replaced with real data later)
    const lastSession = sessions && sessions.length > 0 
      ? sessions[0] 
      : { created_at: new Date().toISOString() };
    
    return {
      totalObjectives,
      objectivesNotLogged: Math.floor(totalObjectives * 0.3), // Mock: 30% not logged yet
      lastSessionDate: lastSession.created_at,
      progressPercentage: 68, // Mock percentage
    };
  }, [subjectAreas, sessions]);

  // Fetch subject areas and their goals
  const fetchSubjectAreas = async () => {
    if (!session || !student?.id) return;
    
    setIsLoadingAreas(true);
    try {
      console.log("Fetching subject areas for student ID:", student.id);
      
      const response = await authorizedFetch(
        `/subject-areas/student/${student.id}`,
        session?.access_token
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch subject areas');
      }
      
      const data = await response.json();
      console.log("Subject areas response:", JSON.stringify(data, null, 2));
      
      // Process the data structure from the API
      let processedAreas = [];
      
      // Handle the possible structure that comes from the API
      if (Array.isArray(data)) {
        processedAreas = data.map(area => {
          // Check if objectives is an array on the area
          if (area.objective && Array.isArray(area.objective)) {
            // Map the objectives structure to match what we need
            return {
              ...area,
              objectives: area.objective.map(obj => ({
                ...obj,
                // Ensure required fields for display exist
                id: obj.id,
                description: obj.description || 'No description available',
                subject_area_id: area.id,
                goal_id: obj.goal_id
              }))
            };
          } else if (area.objectives && Array.isArray(area.objectives)) {
            // Use the existing objectives array
            return area;
          } else {
            // No objectives found, return the area with empty objectives
            return {
              ...area,
              objectives: []
            };
          }
        });
      } else if (data && typeof data === 'object') {
        // Handle case where it might not be an array
        console.log("Data is not an array, converting to array");
        processedAreas = [data].map(area => {
          if (area.objective && Array.isArray(area.objective)) {
            return {
              ...area,
              objectives: area.objective
            };
          }
          return area;
        });
      }
      
      // Log all areas before any filtering
      console.log("All processed areas (before filtering):", processedAreas.map(a => a.name));
      
      // Instead of filtering out areas, keep all of them but check if they have objectives
      processedAreas.forEach(area => {
        const hasObjectives = 
          (area.objectives && area.objectives.length > 0) || 
          (area.objective && area.objective.length > 0);
        
        if (!hasObjectives) {
          console.log(`Area ${area.name} (${area.id}) has no objectives, but we'll still display it`);
        }
      });
      
      console.log("Total areas count:", processedAreas.length);
      setSubjectAreas(processedAreas);
      
      // Initialize all areas as deselected
      const initialSelectedAreas = {};
      processedAreas.forEach(area => {
        initialSelectedAreas[area.id] = false;
      });
      
      setSelectedAreas(initialSelectedAreas);
      setInitialized(true);
    } catch (error) {
      console.error('Error fetching subject areas:', error);
      toast.error('Failed to load areas of need');
      setInitialized(true);
    } finally {
      setIsLoadingAreas(false);
    }
  };

  useEffect(() => {
    if (student && student.id && session) {
      console.log("Calling fetchSubjectAreas for student:", student.id);
      fetchSubjectAreas();
    }
  }, [student?.id, session]);

  useEffect(() => {
    if (showSessions && sessionsRef.current) {
      setTimeout(() => {
        sessionsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    }
  }, [showSessions]);

  const fetchSessions = async () => {
    if (!session) return;
    
    setIsLoading(true);
    try {
      const response = await authorizedFetch(`/sessions/student/${student.id}`, session?.access_token);
      if (!response.ok) {
        console.warn('Sessions not available:', response.status);
        setSessions([]);
        return;
      }
      const data = await response.json();
      setSessions(data || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      setSessions([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [session, student.id]);

  const formatDate = (dateString) => {
    if (!dateString) return 'Not available';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Toggle area selection
  const toggleArea = (areaId) => {
    setSelectedAreas(prev => ({
      ...prev,
      [areaId]: !prev[areaId]
    }));
  };

  // Toggle sessions view
  const toggleSessions = () => {
    setShowSessions(!showSessions);
  };

  // Safe access to student properties with defaults
  const studentName = student.name;
  const gradeLevel = student.grade_level;
  const disabilityType = student.disability_type;
  const reviewDate = student.review_date;
  const supervisorName = student.supervisor_name;
  const createdAt = student.created_at;
  const summary = student.summary;

  return (
    <div className="w-full h-[calc(100vh-200px)] flex flex-col max-w-7xl mx-auto bg-[var(--soft-primary)] rounded-[24px] p-5 m-12 shadow-sm overflow-hidden">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <button 
            onClick={onBack} 
            className="text-emphasis-medium flex items-center gap-1 hover:text-emphasis-high transition-colors duration-200 p-2 rounded-md hover:bg-accent/60"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="font-medium">Back to Students</span>
          </button>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => onAddObjective(student)}
            variant="outline"
            className="flex items-center gap-2 transition-transform hover:bg-accent hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            Add Objective
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-accent">
                <MoreHorizontal className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={() => onEditStudent(student)}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive hover:bg-destructive/10" onClick={() => onDeleteStudent(student)}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 overflow-y-auto">
          {/* Left Column: Student Info */}
          <div className="lg:col-span-3 bg-[var(--soft-secondary)] rounded-[20px] flex flex-col overflow-hidden border border-border shadow-sm">
            {/* Student Info Card */}
            <div className="p-6 border-b border-border/50 bg-gradient-to-r from-primary/5 to-transparent">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16 bg-primary/20 border border-primary/10">
                    <AvatarFallback className="text-xl font-semibold text-primary">
                      {studentName?.charAt(0) || "S"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="text-2xl font-semibold text-emphasis-high">{studentName}</h2>
                    <div className="flex items-center gap-3 mt-1">
                      {gradeLevel && (
                        <div className="flex items-center text-sm text-emphasis-medium">
                          <Bookmark className="w-3.5 h-3.5 mr-1 text-primary/70" />
                          Grade {gradeLevel}
                        </div>
                      )}
                      {disabilityType && (
                        <div className="flex items-center text-sm text-emphasis-medium">
                          <span className="h-1 w-1 bg-emphasis-medium/30 rounded-full mx-1"></span>
                          {disabilityType}
                        </div>
                      )}
                      {createdAt && (
                        <div className="flex items-center text-sm text-emphasis-medium">
                          <span className="h-1 w-1 bg-emphasis-medium/30 rounded-full mx-1"></span>
                          <Clock className="w-3.5 h-3.5 mr-1 text-primary/70" />
                          Added {formatDate(createdAt)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {summary && summary !== "" && (
                <div className="mt-4 p-3 bg-accent/30 rounded-xl border border-border/30">
                  <h3 className="font-medium text-emphasis-high mb-1 text-sm">Summary</h3>
                  <p className="text-sm text-emphasis-medium leading-relaxed">{summary}</p>
                </div>
              )}
            </div>

            {/* Areas of Need */}
            <div className="p-6 overflow-y-auto flex-1">
              <div className="mb-4">
                <h3 className="font-medium text-emphasis-high mb-1 text-lg flex items-center">
                  <Activity className="w-4 h-4 mr-2 text-primary" />
                  Areas of Need
                </h3>
                <p className="text-sm text-emphasis-medium">Select areas to view objectives</p>
              </div>

              <div className="mb-5">
                <div className="flex flex-wrap gap-2 mb-4">
                  {subjectAreas.map((area) => {
                    const hasObjectives = 
                      (area.objectives && area.objectives.length > 0) || 
                      (area.objective && area.objective.length > 0);
                    
                    return (
                      <button
                        key={area.id}
                        onClick={() => toggleArea(area.id)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                          selectedAreas[area.id] 
                            ? "bg-primary text-primary-foreground shadow-sm transform scale-105" 
                            : "bg-accent/60 text-emphasis-high hover:bg-primary/20"
                        }`}
                      >
                        {area.name}
                        {hasObjectives && <span className="ml-1 opacity-70">({(area.objectives || area.objective || []).length})</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-5 overflow-y-auto">
                <AnimatePresence>
                  {subjectAreas.map((area) => (
                    selectedAreas[area.id] && (
                      <motion.div 
                        key={area.id} 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="mb-6">
                          <h4 className="text-emphasis-high font-medium mb-3 flex items-center">
                            <span className="h-2 w-2 rounded-full bg-primary mr-2"></span>
                            {area.name}
                          </h4>
                          
                          {/* Goals and Objectives */}
                          <div className="space-y-4">
                            {groupedObjectivesByArea[area.id]?.goalGroups.map((goalGroup) => (
                              <div key={goalGroup.id} className="space-y-2">
                                <div className="flex items-center mb-1 gap-1.5">
                                  <Layers className="w-3.5 h-3.5 text-primary/70" />
                                  <h5 className="text-sm font-medium text-emphasis-high">{goalGroup.title}</h5>
                                </div>
                                
                                <div className="space-y-2 pl-3 border-l-2 border-primary/10">
                                  {goalGroup.objectives.map((objective) => (
                                    <motion.div
                                      key={objective.id}
                                      initial={{ x: -10, opacity: 0 }}
                                      animate={{ x: 0, opacity: 1 }}
                                      transition={{ duration: 0.2 }}
                                      className="bg-background rounded-xl overflow-hidden shadow-sm transition-all border border-border/50 group hover:shadow-md hover:border-primary/30"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        // Enhance objective with area and goal info if needed
                                        const enhancedObjective = {
                                          ...objective,
                                          subject_area_id: objective.subject_area_id || area.id,
                                          subject_area: objective.subject_area || { 
                                            id: area.id, 
                                            name: area.name 
                                          },
                                          goal: objective.goal || {
                                            id: goalGroup.id,
                                            title: goalGroup.title
                                          }
                                        };
                                        
                                        onObjectiveClick(enhancedObjective);
                                      }}
                                    >
                                      <div className="p-4 cursor-pointer">
                                        <div className="flex items-start justify-between gap-2">
                                          <div className="flex-1">
                                            <p className="text-sm text-emphasis-high line-clamp-2">{objective.description}</p>
                                            <div className="flex items-center mt-2 text-xs text-emphasis-medium gap-2">
                                              <span className={`px-2 py-0.5 rounded-full ${objective.objective_type === 'binary' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                                                {objective.objective_type === 'binary' ? 'Yes/No' : 'Trial Based'}
                                              </span>
                                              {objective.target_consistency_trials > 0 && (
                                                <span className="flex items-center">
                                                  <Target className="w-3 h-3 mr-1 opacity-70" />
                                                  {objective.target_consistency_successes}/{objective.target_consistency_trials}
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                          <div onClick={(e) => e.stopPropagation()}>
                                            <DropdownMenu>
                                              <DropdownMenuTrigger asChild>
                                                <Button 
                                                  variant="ghost" 
                                                  size="icon"
                                                  className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 rounded-full"
                                                  onClick={(e) => e.stopPropagation()}
                                                >
                                                  <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                              </DropdownMenuTrigger>
                                              <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={(e) => {
                                                  e.stopPropagation();
                                                  onEditObjective(objective);
                                                }}>
                                                  <Pencil className="h-4 w-4 mr-2" />
                                                  Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem 
                                                  className="text-destructive hover:bg-destructive/10"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    onDeleteObjective(objective);
                                                  }}
                                                >
                                                  <Trash2 className="h-4 w-4 mr-2" />
                                                  Delete
                                                </DropdownMenuItem>
                                              </DropdownMenuContent>
                                            </DropdownMenu>
                                          </div>
                                        </div>
                                      </div>
                                    </motion.div>
                                  ))}
                                </div>
                              </div>
                            ))}
                            
                            {(!groupedObjectivesByArea[area.id]?.goalGroups.length || 
                              groupedObjectivesByArea[area.id]?.goalGroups.every(g => !g.objectives.length)) && (
                              <div className="bg-background rounded-xl p-4 text-sm text-emphasis-medium mb-2 border border-border/30 shadow-sm">
                                No objectives found for this area of need. Click "Add Objective" to create one.
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )
                  ))}
                </AnimatePresence>

                {initialized && (!subjectAreas || subjectAreas.length === 0) && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="text-center py-8 bg-accent/20 rounded-xl border border-border/30 text-emphasis-medium"
                  >
                    No areas of need found for this student. Use "Add Objective" to create objectives which will be organized by area of need.
                  </motion.div>
                )}
              </div>
            </div>
          </div>
          
          {/* Right Column: Stats Dashboard */}
          <div className="lg:col-span-1 space-y-4 h-fit">
            <div className="bg-[var(--soft-secondary)] rounded-[20px] p-5 border border-border shadow-sm">
              {/* Clipboard style header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="bg-background h-7 w-7 rounded-full border border-border/50 flex items-center justify-center">
                    <Clipboard className="h-4 w-4 text-primary" />
                  </div>
                  <h3 className="font-medium text-emphasis-high text-sm">Progress Report</h3>
                </div>
              </div>
              
              {/* Combined Progress Section */}
              <div className="bg-background rounded-xl p-4 border border-border/40 mb-4">
                <div className="flex justify-between items-center mb-3">
                  <div className="text-sm font-medium flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-primary" />
                    Weekly Progress
                  </div>
                  <div className="text-2xl font-semibold">{stats.progressPercentage}%</div>
                </div>
                
                <Progress 
                  value={stats.progressPercentage} 
                  className="h-2 mb-2" 
                />
                
                <div className="flex justify-between items-center text-xs text-emphasis-medium mt-1">
                  <span>0%</span>
                  <span>Target: 100%</span>
                </div>
                
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="flex items-center gap-3 p-3 bg-accent/10 rounded-lg border border-border/30">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Target className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="text-lg font-semibold">{stats.totalObjectives}</div>
                      <div className="text-xs text-emphasis-medium">Objectives</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-accent/10 rounded-lg border border-border/30">
                    <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center">
                      <AlertCircle className="h-4 w-4 text-amber-700" />
                    </div>
                    <div>
                      <div className="text-lg font-semibold">{stats.objectivesNotLogged}</div>
                      <div className="text-xs text-emphasis-medium">Not Logged</div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Student Info Block */}
              {(supervisorName || reviewDate) && (
                <div className="bg-background rounded-xl p-4 border border-border/40 mb-4">
                  <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" />
                    Student Info
                  </h4>
                  
                  <div className="space-y-3 text-sm">
                    {supervisorName && (
                      <div className="flex justify-between">
                        <div className="text-emphasis-medium">Supervisor:</div>
                        <div className="font-medium">{supervisorName}</div>
                      </div>
                    )}
                    
                    {reviewDate && (
                      <div className="flex justify-between">
                        <div className="text-emphasis-medium">Review Date:</div>
                        <div className="font-medium">{formatDate(reviewDate)}</div>
                      </div>
                    )}
                    
                    <div className="flex justify-between">
                      <div className="text-emphasis-medium">Last Session:</div>
                      <div className="font-medium">{formatDate(stats.lastSessionDate)}</div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* View Sessions Button */}
              <Button 
                variant="outline" 
                onClick={toggleSessions} 
                className="w-full justify-center gap-2 bg-accent/50 shadow-sm border-border/50"
              >
                {showSessions ? 'Hide Sessions' : 'View All Sessions'}
                {showSessions ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
        
        {/* Sessions Table with Animation */}
        <div ref={sessionsRef}>
          <AnimatePresence>
            {showSessions && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden bg-background rounded-xl border border-border shadow-sm mt-4 mb-2"
              >
                <div className="p-5">
                  <h3 className="font-medium mb-4 flex items-center gap-2">
                    <FileCheck className="h-4 w-4 text-primary" />
                    Session History
                  </h3>
                  <SortFilterSessionsTable 
                    sessions={sessions}
                    showActions={true}
                    onSuccess={fetchSessions}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
} 