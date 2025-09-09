'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/auth-context';
import { authorizedFetch } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { User, BookOpen, Check, Search, ArrowRight, ArrowLeft, ChevronRight, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { SessionManualObjectiveSelect, SessionManualProgressForm } from '@/components/SessionForms';
import { DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

export function SessionManualStudentSelect({ students, onComplete }) {
  const { session } = useAuth();
  
  // Track selected state per student
  const [selectedStudentMap, setSelectedStudentMap] = useState({});
  // Track subject areas per student
  const [studentSubjectAreas, setStudentSubjectAreas] = useState({});
  // Track selected subject areas per student
  const [selectedSubjectAreasMap, setSelectedSubjectAreasMap] = useState({});
  // Track loading state per student
  const [loadingSubjectAreasMap, setLoadingSubjectAreasMap] = useState({});
  const [showObjectives, setShowObjectives] = useState(false);
  const [showProgressForm, setShowProgressForm] = useState(false);
  const [selectedObjectives, setSelectedObjectives] = useState({});
  
  // New state for search and step navigation
  const [studentSearch, setStudentSearch] = useState('');
  const [subjectSearch, setSubjectSearch] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3; // Students -> Objectives -> Progress

  const toggleStudent = (student) => {
    setSelectedStudentMap(prev => {
      const newMap = { ...prev };
      if (prev[student.id]) {
        delete newMap[student.id];
        // Clean up associated data
        setStudentSubjectAreas(current => {
          const { [student.id]: _, ...rest } = current;
          return rest;
        });
        setSelectedSubjectAreasMap(current => {
          const { [student.id]: _, ...rest } = current;
          return rest;
        });
      } else {
        newMap[student.id] = true;
        // Fetch subject areas for newly selected student
        fetchSubjectAreasForStudent(student);
      }
      return newMap;
    });
  };

  const fetchSubjectAreasForStudent = async (student) => {
    if (!session) return;
    
    setLoadingSubjectAreasMap(prev => ({ ...prev, [student.id]: true }));
    
    try {
      const response = await authorizedFetch(
        `/subject-areas/student/${student.id}`,
        session.access_token
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch subject areas for ${student.name}`);
      }
      
      const data = await response.json();
      setStudentSubjectAreas(prev => ({
        ...prev,
        [student.id]: data
      }));
      // Initialize empty selection for this student
      setSelectedSubjectAreasMap(prev => ({
        ...prev,
        [student.id]: []
      }));
    } catch (error) {
      console.error('Error fetching subject areas:', error);
      toast.error(`Failed to load subject areas for ${student.name}`);
    } finally {
      setLoadingSubjectAreasMap(prev => ({ ...prev, [student.id]: false }));
    }
  };

  // page 1 -> page 2
  const handleNext = () => {
    setShowObjectives(true);
  };

  // page 2 -> page 3
  const handleObjectivesContinue = (objectives) => {
    setSelectedObjectives(objectives);
    setShowProgressForm(true);
  };

  // Handler for when the ObjectiveProgressForm completes successfully
  const handleFormSuccess = () => {
    console.log("SessionManualLogForm: handleFormSuccess called, resetting states");
    // Reset all form states
    setSelectedStudentMap({});
    setStudentSubjectAreas({});
    setSelectedSubjectAreasMap({});
    setLoadingSubjectAreasMap({});
    setShowObjectives(false);
    setShowProgressForm(false);
    setSelectedObjectives({});
    
    // Call the onComplete callback to close all parent forms
    if (onComplete) {
      console.log("SessionManualLogForm: Calling onComplete to notify parent");
      onComplete();
    }
  };

  // Helper function to get student name from ID
  const getSelectedStudentName = (studentId) => {
    const student = students.find(s => s.id === studentId);
    return student ? student.name : 'Unknown Student';
  };

  // Helper function to get step title
  const getStepTitle = (step) => {
    switch (step) {
      case 1: return 'Select Students & Subject Areas';
      case 2: return 'Select Objectives';
      case 3: return 'Log Progress';
      default: return '';
    }
  };

  // Get total count of subject areas selected across all students
  const getTotalSubjectAreasCount = () => {
    return Object.values(selectedSubjectAreasMap).reduce((sum, areas) => sum + areas.length, 0);
  };

  if (showProgressForm) {
    return (
      <SessionManualProgressForm
        objectives={Object.values(selectedObjectives).flat()}
        onBack={() => {
          setShowProgressForm(false);
          setShowObjectives(true);
        }}
        onSuccess={handleFormSuccess}
      />
    );
  }

  if (showObjectives) {
    return (
      <SessionManualObjectiveSelect
        students={students}
        selectedSubjectAreasMap={selectedSubjectAreasMap}
        onBack={() => setShowObjectives(false)}
        onContinue={handleObjectivesContinue}
      />
    );
  }
  
  // Toggle subject area for a student
  const toggleSubjectArea = (studentId, subjectArea) => {
    setSelectedSubjectAreasMap(prev => {
      const currentSelected = prev[studentId] || [];
      const isAreaSelected = currentSelected.some(a => a.id === subjectArea.id);
      
      return {
        ...prev,
        [studentId]: isAreaSelected
          ? currentSelected.filter(a => a.id !== subjectArea.id)
          : [...currentSelected, subjectArea]
      };
    });
  };
  
  // Check if a subject area is selected
  const isSubjectAreaSelected = (studentId, subjectAreaId) => {
    const selectedAreas = selectedSubjectAreasMap[studentId] || [];
    return selectedAreas.some(area => area.id === subjectAreaId);
  };

  return (
    <div className="h-[800px] flex flex-col overflow-hidden">  
      {/* Top navigation */}
      <div className="border-b px-6 py-3 flex justify-between items-center flex-shrink-0 bg-gradient-to-r from-muted/80 to-muted">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">Select Students & Subject Areas</h2>
        </div>
        <div className="text-sm text-muted-foreground">
          <span className="font-medium text-primary">{getTotalSubjectAreasCount()}</span> subject areas selected
        </div>
      </div>    
      {/* Main content wrapper - flex layout with scrollable content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Main content area */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full flex flex-col">
            <div className="px-6 py-3 flex flex-col h-full">
              {/* Fixed Search Area */}
              <div className="flex-shrink-0 mb-3">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search students..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="pl-8 h-9"
                  />
                </div>
              </div>
              
              {/* Scrollable Visual Selection */}
              <div className="flex-1 overflow-auto">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pb-4">
                    {students
                      ?.filter(student => 
                        student.name.toLowerCase().includes(studentSearch.toLowerCase())
                      )
                      .map((student) => {
                        const isSelected = selectedStudentMap[student.id];
                        const subjectAreas = studentSubjectAreas[student.id] || [];
                        const selectedSubjectAreas = selectedSubjectAreasMap[student.id] || [];
                        const isLoading = loadingSubjectAreasMap[student.id];
                        
                        return (
                          <div
                            key={`student-card-${student.id}`}
                            className="flex flex-col"
                          >
                          <div
                            className={cn(
                              "cursor-pointer relative h-[140px] p-3 rounded-xl transition-all flex flex-col gap-2 group overflow-hidden",
                              isSelected 
                                ? "bg-gradient-to-br from-primary/20 to-primary/10 border-primary border shadow-md" 
                                : "bg-gradient-to-br from-background/50 to-background border-border border hover:shadow-sm hover:border-primary/40"
                            )}
                          >
                            {/* Header area - compact when selected */}
                            <div
                              onClick={() => toggleStudent(student)}
                              className={cn(
                                "flex transition-all", 
                                isSelected 
                                  ? "flex-row items-center justify-start gap-2 h-[40px]" 
                                  : "flex-col items-center justify-center h-[120px]"
                              )}
                            >
                              <div className={cn(
                                "rounded-full transition-all flex-shrink-0",
                                isSelected
                                  ? "p-1.5 bg-primary/20 text-primary"
                                  : "p-2.5 bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                              )}>
                                <User className={isSelected ? "h-4 w-4" : "h-5 w-5"} />
                              </div>
                              <div className={cn(
                                "font-medium truncate",
                                isSelected ? "text-sm" : "text-center w-full text-sm mt-2"
                              )}>
                                {student.name}
                              </div>
                              {isSelected && (
                                <div className="absolute top-2 right-2 rounded-full bg-primary text-white p-0.5">
                                  <Check className="h-3 w-3" />
                                </div>
                              )}
                            </div>
                            
                            {/* Subject area selection within the card - only visible when selected */}
                            {isSelected && (
                              <div className="flex-1 flex flex-col min-h-0">
                                <div className="text-xs font-medium text-muted-foreground mb-1 flex-shrink-0">
                                  Subject areas:
                                </div>
                                
                                {isLoading ? (
                                  <div className="text-xs text-center py-1 flex-1 flex items-center justify-center">
                                    Loading...
                                  </div>
                                ) : subjectAreas.length > 0 ? (
                                  <div className="flex-1 min-h-0 overflow-hidden">
                                    <div className="h-full overflow-y-auto">
                                      <div className="flex flex-wrap gap-1 pb-1">
                                        {subjectAreas.map((area) => (
                                          <Badge
                                            key={area.id}
                                            variant="outline"
                                            className={cn(
                                              "cursor-pointer text-xs py-0.5 px-1.5 h-5 flex-shrink-0",
                                              isSubjectAreaSelected(student.id, area.id)
                                                ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30"
                                                : "bg-muted/20 text-foreground hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400"
                                            )}
                                            onClick={() => toggleSubjectArea(student.id, area)}
                                          >
                                            {area.name}
                                            {isSubjectAreaSelected(student.id, area.id) && (
                                              <Check className="h-2.5 w-2.5 ml-0.5" />
                                            )}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-xs text-center py-1 text-muted-foreground flex-1 flex items-center justify-center">
                                    No subject areas found
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {/* Select prompt for unselected cards */}
                            {!isSelected && (
                              <div 
                                onClick={() => toggleStudent(student)}
                                className="absolute bottom-3 left-0 right-0 text-xs text-center text-muted-foreground hover:text-primary transition-colors"
                              >
                                Click to select
                              </div>
                            )}
                          </div>
                          </div>
                        );
                      })}
                    
                    {/* Empty state when no students match search */}
                    {students?.filter(student => 
                      student.name.toLowerCase().includes(studentSearch.toLowerCase())
                    ).length === 0 && (
                      <div className="col-span-3 py-10 text-center text-muted-foreground">
                        No students found matching your search
                      </div>
                    )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Fixed bottom bar - outside the scrollable area */}
        <div className="h-[120px] border-t px-6 bg-gradient-to-r from-muted/80 to-muted flex flex-col justify-center flex-shrink-0">
          {/* Selection path */}
          <div className="flex items-center gap-1.5">
            <div className="text-xs text-muted-foreground mr-1">Selected:</div>
            
            <div className="flex items-center py-4">
              {Object.keys(selectedStudentMap).length > 0 ? (
                <>
                  {Object.keys(selectedStudentMap).map((studentId, index) => (
                    <div key={studentId} className="flex items-center">
                      {index > 0 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground mx-1" />}
                      <div className="flex items-center gap-1.5 bg-primary/10 text-primary text-sm px-3 py-1 rounded-full font-medium">
                        <User className="h-3.5 w-3.5" />
                        <span>{getSelectedStudentName(studentId)}</span>
                        <span className="text-xs text-primary/70">
                          ({(selectedSubjectAreasMap[studentId] || []).length} subjects)
                        </span>
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <div className="text-xs text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
                  No students selected
                </div>
              )}
            </div>
          </div>
          
          {/* Navigation buttons */}
          <div className="flex justify-end">
            <Button
              onClick={handleNext}
              disabled={Object.keys(selectedStudentMap).length === 0 || 
                Object.entries(selectedSubjectAreasMap).some(([studentId, areas]) => 
                  selectedStudentMap[studentId] && areas.length === 0
                )}
              className="flex items-center gap-1"
              size="sm"
            >
              Next <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}