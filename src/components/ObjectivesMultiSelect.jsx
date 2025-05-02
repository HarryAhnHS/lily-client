import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Check, ChevronLeft, ChevronRight, Search, BookOpen, Filter, X, CheckCircle2, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

export function SessionManualObjectiveSelect({ 
  students, 
  selectedSubjectAreasMap = {}, // Provide default empty object
  onBack,
  onContinue 
}) {
  const [selectedObjectives, setSelectedObjectives] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [activeStudent, setActiveStudent] = useState(null);
  const [activeSubjectArea, setActiveSubjectArea] = useState(null);
  const [filters, setFilters] = useState({ binary: true, trial: true });
  const containerRef = useRef(null);
  const [commonGoalIds, setCommonGoalIds] = useState([]);

  // Find common goals across students on initial load
  useEffect(() => {
    // Only run if we have students and subject areas
    if (Object.keys(selectedSubjectAreasMap).length === 0) return;

    // Extract all goals from all students
    const allGoalsByStudent = {};
    
    Object.entries(selectedSubjectAreasMap).forEach(([studentId, subjectAreas]) => {
      const studentGoals = new Set();
      
      subjectAreas.forEach(area => {
        if (area.objective) {
          area.objective.forEach(obj => {
            if (obj.goal && obj.goal.id) {
              studentGoals.add(obj.goal.id);
            }
          });
        }
      });
      
      allGoalsByStudent[studentId] = Array.from(studentGoals);
    });
    
    // Find goals that appear for all students (intersection)
    if (Object.keys(allGoalsByStudent).length > 0) {
      const studentIds = Object.keys(allGoalsByStudent);
      let commonGoals = allGoalsByStudent[studentIds[0]] || [];
      
      for (let i = 1; i < studentIds.length; i++) {
        commonGoals = commonGoals.filter(goalId => 
          allGoalsByStudent[studentIds[i]].includes(goalId)
        );
      }
      
      setCommonGoalIds(commonGoals);
    }
  }, [selectedSubjectAreasMap]);

  // Initialize active student when component mounts
  useEffect(() => {
    const studentIds = Object.keys(selectedSubjectAreasMap);
    if (studentIds.length > 0 && !activeStudent) {
      setActiveStudent(studentIds[0]);
    }
  }, [selectedSubjectAreasMap, activeStudent]);

  // Initialize active subject area when active student changes
  useEffect(() => {
    if (activeStudent) {
      const subjectAreas = selectedSubjectAreasMap[activeStudent] || [];
      if (subjectAreas.length > 0 && !activeSubjectArea) {
        setActiveSubjectArea(subjectAreas[0].id);
      } else if (subjectAreas.length === 0) {
        setActiveSubjectArea(null);
      }
    }
  }, [activeStudent, selectedSubjectAreasMap, activeSubjectArea]);

  // Scroll to top when active student or subject area changes
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, [activeStudent, activeSubjectArea]);

  // Pre-select common objectives for new students
  useEffect(() => {
    // Only run this if we have common goals and when selectedObjectives changes
    if (commonGoalIds.length === 0) return;
    
    // Find students that don't have any selections yet
    Object.keys(selectedSubjectAreasMap).forEach(studentId => {
      // Skip if student already has selections
      if (selectedObjectives[studentId] && selectedObjectives[studentId].length > 0) return;
      
      // Build set of all objectives for this student that belong to common goals
      const newSelections = [];
      
      (selectedSubjectAreasMap[studentId] || []).forEach(area => {
        if (area.objective) {
          area.objective.forEach(objective => {
            if (objective.goal && commonGoalIds.includes(objective.goal.id)) {
              // Check if another student already selected this objective
              const isSelectedByOthers = Object.entries(selectedObjectives)
                .some(([otherId, objectives]) => {
                  if (otherId === studentId) return false;
                  return objectives.some(obj => 
                    obj.goal && obj.goal.id === objective.goal.id && 
                    obj.description === objective.description
                  );
                });
              
              if (isSelectedByOthers) {
                newSelections.push(objective);
              }
            }
          });
        }
      });
      
      // Add these objectives to selections if we found any
      if (newSelections.length > 0) {
        setSelectedObjectives(prev => ({
          ...prev,
          [studentId]: newSelections
        }));
      }
    });
  }, [selectedObjectives, selectedSubjectAreasMap, commonGoalIds]);

  const toggleObjective = (studentId, objective) => {
    setSelectedObjectives(prev => {
      const currentSelected = prev[studentId] || [];
      const isSelected = currentSelected.some(obj => obj.id === objective.id);

      return {
        ...prev,
        [studentId]: isSelected
          ? currentSelected.filter(obj => obj.id !== objective.id)
          : [...currentSelected, objective]
      };
    });
  };

  // Select all objectives from a goal
  const toggleGoal = (studentId, goalId) => {
    // Get all objectives for this goal from the active subject area
    const subjectArea = getActiveSubjectAreaData();
    if (!subjectArea || !subjectArea.objective) return;
    
    const goalObjectives = subjectArea.objective.filter(
      obj => obj.goal && obj.goal.id === goalId
    );
    
    if (goalObjectives.length === 0) return;
    
    // Check if all objectives from this goal are already selected
    const selectedIds = (selectedObjectives[studentId] || []).map(obj => obj.id);
    const allSelected = goalObjectives.every(obj => selectedIds.includes(obj.id));
    
    setSelectedObjectives(prev => {
      const currentSelected = prev[studentId] || [];
      
      if (allSelected) {
        // Deselect all objectives from this goal
        return {
          ...prev,
          [studentId]: currentSelected.filter(
            obj => !(obj.goal && obj.goal.id === goalId)
          )
        };
      } else {
        // Select all objectives from this goal
        const newSelected = [...currentSelected];
        
        goalObjectives.forEach(obj => {
          if (!selectedIds.includes(obj.id)) {
            newSelected.push(obj);
          }
        });
        
        return {
          ...prev,
          [studentId]: newSelected
        };
      }
    });
  };

  const isObjectiveSelected = (studentId, objectiveId) => {
    const selectedForStudent = selectedObjectives[studentId] || [];
    return selectedForStudent.some(obj => obj.id === objectiveId);
  };

  // Check if all objectives from a goal are selected
  const isGoalSelected = (studentId, goalId) => {
    const subjectArea = getActiveSubjectAreaData();
    if (!subjectArea || !subjectArea.objective) return false;
    
    const goalObjectives = subjectArea.objective.filter(
      obj => obj.goal && obj.goal.id === goalId
    );
    
    if (goalObjectives.length === 0) return false;
    
    const selectedIds = (selectedObjectives[studentId] || []).map(obj => obj.id);
    return goalObjectives.every(obj => selectedIds.includes(obj.id));
  };

  // Check if some (but not all) objectives from a goal are selected
  const isGoalPartiallySelected = (studentId, goalId) => {
    const subjectArea = getActiveSubjectAreaData();
    if (!subjectArea || !subjectArea.objective) return false;
    
    const goalObjectives = subjectArea.objective.filter(
      obj => obj.goal && obj.goal.id === goalId
    );
    
    if (goalObjectives.length === 0) return false;
    
    const selectedIds = (selectedObjectives[studentId] || []).map(obj => obj.id);
    const selectedCount = goalObjectives.filter(obj => selectedIds.includes(obj.id)).length;
    
    return selectedCount > 0 && selectedCount < goalObjectives.length;
  };

  // Get selected objectives count
  const getSelectedCount = (studentId) => {
    return (selectedObjectives[studentId] || []).length;
  };

  const getTotalSelectedCount = () => {
    return Object.values(selectedObjectives).reduce((sum, arr) => sum + arr.length, 0);
  };

  // Filter objectives by search term and type
  const filterObjectives = (objectives) => {
    if (!objectives) return [];
    
    return objectives.filter(objective => {
      // Filter by search term
      const matchesSearch = !searchTerm || 
        objective.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Filter by objective type
      const matchesType = 
        (objective.objective_type === 'binary' && filters.binary) || 
        (objective.objective_type !== 'binary' && filters.trial);
      
      return matchesSearch && matchesType;
    });
  };

  // Ensure selectedSubjectAreasMap is always an object
  const safeSubjectAreasMap = selectedSubjectAreasMap || {};
  
  // Get current active student's data
  const getActiveStudentData = () => {
    if (!activeStudent) return null;
    
    const student = students.find(s => s.id === activeStudent);
    if (!student) return null;
    
    const subjectAreas = safeSubjectAreasMap[activeStudent] || [];
    return { student, subjectAreas };
  };
  
  // Get current active subject area's data
  const getActiveSubjectAreaData = () => {
    const studentData = getActiveStudentData();
    if (!studentData || !activeSubjectArea) return null;
    
    const subjectArea = studentData.subjectAreas.find(area => area.id === activeSubjectArea);
    return subjectArea;
  };

  return (
    <div className="h-[800px] flex flex-col overflow-hidden">
      {/* Top navigation */}
      <div className="border-b px-6 py-3 flex justify-between items-center flex-shrink-0 bg-gradient-to-r from-muted/80 to-muted">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={onBack} className="p-2 h-9 w-9">
            <ChevronLeft className="h-5 w-5" />
        </Button>
          <h2 className="text-lg font-semibold">Select Objectives</h2>
        </div>
        <div className="text-sm text-muted-foreground">
          <span className="font-medium text-primary">{getTotalSelectedCount()}</span> objectives selected
        </div>
      </div>

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar - Student & Subject selection */}
        <div className="w-64 border-r border-muted-foreground/10 flex flex-col">
          {/* Student tabs */}
          <div className="p-3 border-b bg-muted/30">
            <h3 className="text-xs uppercase text-muted-foreground mb-2 font-medium">Students</h3>
            <div className="space-y-1.5">
              {Object.keys(safeSubjectAreasMap).map(studentId => {
          const student = students.find(s => s.id === studentId);
          if (!student) return null;
                const isActive = activeStudent === studentId;
                
                return (
                  <button
                    key={studentId}
                    onClick={() => setActiveStudent(studentId)}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-md flex items-center gap-2 text-sm transition-colors",
                      isActive 
                        ? "bg-primary text-primary-foreground" 
                        : "hover:bg-muted text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <span className={cn(
                      "h-6 w-6 rounded-full flex items-center justify-center",
                      isActive ? "bg-primary-foreground text-primary" : "bg-muted-foreground/20 text-muted-foreground"
                    )}>
                      <User className="h-3.5 w-3.5" />
                    </span>
                    <span className="truncate flex-1">{student.name}</span>
                    <Badge 
                      className={cn(
                        "text-xs ml-1",
                        isActive 
                          ? "bg-primary-foreground text-primary" 
                          : "bg-muted-foreground/10 text-muted-foreground"
                      )}
                    >
                      {getSelectedCount(studentId)}
                    </Badge>
                  </button>
                );
              })}
            </div>
          </div>
          
          {/* Subject areas */}
          <div className="p-3 flex-1 overflow-y-auto">
            <h3 className="text-xs uppercase text-muted-foreground mb-2 font-medium">Subject Areas</h3>
            {activeStudent ? (
              <div className="space-y-1.5">
                {(safeSubjectAreasMap[activeStudent] || []).map(area => {
                  const isActive = activeSubjectArea === area.id;
          
          return (
                    <button
                      key={area.id}
                      onClick={() => setActiveSubjectArea(area.id)}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-md flex items-center gap-2 text-sm transition-colors",
                        isActive 
                          ? "bg-secondary text-secondary-foreground" 
                          : "hover:bg-muted text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <span className={cn(
                        "h-6 w-6 rounded-full flex items-center justify-center",
                        isActive ? "bg-secondary-foreground/90 text-secondary" : "bg-muted-foreground/20 text-muted-foreground"
                      )}>
                        <BookOpen className="h-3.5 w-3.5" />
                </span>
                      <span className="truncate">{area.name}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground py-4 text-center">
                Select a student first
              </div>
            )}
          </div>
        </div>
        
        {/* Main content - Objectives */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Search and filter bar */}
          <div className="p-3 border-b flex items-center gap-3 bg-muted/30">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search objectives..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9"
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
              
            <div className="flex items-center gap-2">
              <Badge 
                variant="outline" 
                className={cn(
                  "cursor-pointer",
                  filters.binary ? "bg-primary/10 text-primary border-primary/30" : "bg-muted"
                )}
                onClick={() => setFilters(prev => ({ ...prev, binary: !prev.binary }))}
              >
                Yes/No {filters.binary && <Check className="h-3 w-3 ml-1" />}
              </Badge>
              <Badge 
                variant="outline" 
                className={cn(
                  "cursor-pointer",
                  filters.trial ? "bg-primary/10 text-primary border-primary/30" : "bg-muted"
                )}
                onClick={() => setFilters(prev => ({ ...prev, trial: !prev.trial }))}
              >
                Trial {filters.trial && <Check className="h-3 w-3 ml-1" />}
              </Badge>
            </div>
          </div>
          
          {/* Objectives list */}
          <div ref={containerRef} className="flex-1 overflow-y-auto p-4">
            {activeStudent && activeSubjectArea ? (
              (() => {
                const subjectArea = getActiveSubjectAreaData();
                if (!subjectArea) return (
                  <div className="text-center p-8 text-muted-foreground">
                    Subject area not found
                  </div>
                );
                
                const objectives = subjectArea.objective || [];
                const filteredObjectives = filterObjectives(objectives);
                
                if (filteredObjectives.length === 0) {
                  if (objectives.length === 0) {
                    return (
                      <div className="text-center p-8 text-muted-foreground bg-muted/10 rounded-lg border border-muted">
                        No objectives available for this subject area
                      </div>
                    );
                  } else {
                    return (
                      <div className="text-center p-8 text-muted-foreground bg-muted/10 rounded-lg border border-muted">
                        No objectives match your search criteria
                      </div>
                    );
                  }
                }
                
                // Group objectives by goal
                const goalGroups = filteredObjectives.reduce((acc, obj) => {
                            const goalId = obj.goal ? obj.goal.id : 'unknown';
                            if (!acc[goalId]) {
                              acc[goalId] = {
                                goal: obj.goal || { id: goalId, title: 'Unknown Goal' },
                                objectives: []
                              };
                            }
                            acc[goalId].objectives.push(obj);
                            return acc;
                }, {});
                
                return (
                  <div className="space-y-6">
                    {Object.entries(goalGroups).map(([goalId, { goal, objectives }]) => {
                      const isGoalFullySelected = isGoalSelected(activeStudent, goalId);
                      const isGoalPartial = isGoalPartiallySelected(activeStudent, goalId);
                      
                      return (
                        <div key={goalId} className="border border-muted rounded-lg overflow-hidden shadow-sm">
                          <div 
                            className={cn(
                              "p-3 border-b flex justify-between items-center cursor-pointer",
                              isGoalFullySelected 
                                ? "bg-primary/10" 
                                : isGoalPartial 
                                  ? "bg-primary/5"
                                  : "bg-muted/50"
                            )}
                            onClick={() => toggleGoal(activeStudent, goalId)}
                          >
                            <h5 className="font-medium">
                              {goal.title}
                              </h5>
                            <div className={cn(
                              "flex h-5 w-5 items-center justify-center rounded-full border",
                              isGoalFullySelected
                                ? "bg-primary text-primary-foreground border-primary"
                                : isGoalPartial
                                  ? "bg-primary/20 border-primary/30"
                                  : "border-muted-foreground/30 bg-muted/30"
                            )}>
                              {isGoalFullySelected && <Check className="h-3 w-3" />}
                              {isGoalPartial && <div className="h-1.5 w-1.5 rounded-full bg-primary" />}
                            </div>
                          </div>
                          <div className="divide-y divide-muted">
                            {objectives.map((objective) => {
                              const isSelected = isObjectiveSelected(activeStudent, objective.id);
                              
                              return (
                                <div
                                  key={objective.id}
                                  onClick={() => toggleObjective(activeStudent, objective)}
                                  className={cn(
                                    "flex items-start gap-3 p-4 cursor-pointer transition-colors",
                                    isSelected
                                      ? "bg-primary/5"
                                      : "hover:bg-muted/50"
                                  )}
                                >
                                  <div className={cn(
                                    "mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border",
                                    isSelected
                                      ? "bg-primary text-primary-foreground border-primary"
                                      : "border-muted-foreground/30"
                                  )}>
                                    {isSelected && <Check className="h-3 w-3" />}
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-sm leading-relaxed">{objective.description}</p>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                      <Badge variant="outline" className={cn(
                                        "text-xs",
                                        objective.objective_type === 'binary' 
                                          ? "bg-blue-50 text-blue-700 border-blue-200" 
                                          : "bg-purple-50 text-purple-700 border-purple-200"
                                      )}>
                                        {objective.objective_type === 'binary' ? 'Yes/No' : 'Trial based'}
                                      </Badge>
                                      {objective.target_accuracy && (
                                        <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                          {Math.round(objective.target_accuracy * 100)}% accuracy
                                        </Badge>
                                      )}
                                      {objective.target_consistency_trials && (
                                        <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                                          {objective.target_consistency_trials} trials
                                        </Badge>
                                      )}
                                      {objective.target_consistency_successes && (
                                        <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                                          {objective.target_consistency_successes} successes
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                      </div>
                      );
                    })}
                  </div>
                );
              })()
            ) : (
              <div className="text-center p-8 text-muted-foreground bg-muted/10 rounded-lg border border-muted">
                {!activeStudent 
                  ? "Select a student to view objectives" 
                  : "Select a subject area to view objectives"}
              </div>
                )}
              </div>
            </div>
      </div>

      {/* Bottom bar */}
      <div className="h-[120px] border-t px-6 bg-gradient-to-r from-muted/80 to-muted flex flex-col justify-center flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <div className="text-xs text-muted-foreground mr-1">Selected:</div>
          
          <div className="flex items-center py-4">
            {getTotalSelectedCount() > 0 ? (
              <div className="flex items-center gap-1.5 bg-primary/10 text-primary text-sm px-3 py-1 rounded-full font-medium">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>{getTotalSelectedCount()}</span> objectives in <span className="font-medium">{Object.keys(selectedObjectives).filter(id => selectedObjectives[id]?.length > 0).length}</span> students
              </div>
            ) : (
              <div className="text-xs text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
                No objectives selected
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <div className="flex gap-3">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button
          disabled={Object.values(selectedObjectives).every(arr => arr.length === 0)}
          onClick={() => onContinue(selectedObjectives)}
              className="flex items-center gap-1"
              size="sm"
        >
              Continue <ChevronRight className="h-4 w-4" />
        </Button>
          </div>
        </div>
      </div>
    </div>
  );
}