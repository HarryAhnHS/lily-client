'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/auth-context';
import { authorizedFetch } from '@/services/api';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { X, ChevronsUpDown, Check, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { ObjectivesMultiSelect } from '@/components/ObjectivesMultiSelect';

export function ManualLogForm({ students }) {
  const { session } = useAuth();
  
  // Track selected state per student
  const [selectedStudentMap, setSelectedStudentMap] = useState({});
  // Track subject areas per student
  const [studentSubjectAreas, setStudentSubjectAreas] = useState({});
  // Track selected subject areas per student
  const [selectedSubjectAreasMap, setSelectedSubjectAreasMap] = useState({});
  // Track loading state per student
  const [loadingSubjectAreasMap, setLoadingSubjectAreasMap] = useState({});
  // Track popover state per student
  const [subjectAreasOpenMap, setSubjectAreasOpenMap] = useState({});
  const [showObjectives, setShowObjectives] = useState(false);
  const [selectedObjectives, setSelectedObjectives] = useState({});

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

  console.log("studentSubjectAreas", selectedSubjectAreasMap);

  const StudentCard = ({ student }) => {
    const isSelected = selectedStudentMap[student.id];
    const subjectAreas = studentSubjectAreas[student.id] || [];
    const selectedSubjectAreas = selectedSubjectAreasMap[student.id] || [];
    const isLoading = loadingSubjectAreasMap[student.id];
    const isOpen = subjectAreasOpenMap[student.id] || false;

    return (
      <div className="border rounded-lg p-4">
        {/* Student header - always visible */}
        <div 
          onClick={() => toggleStudent(student)}
          className={cn(
            "flex items-center justify-between cursor-pointer p-2 rounded",
            isSelected ? "bg-primary/5" : "hover:bg-muted"
          )}
        >
          <h3 className="font-medium">{student.name}</h3>
          <div className="flex items-center gap-2">
            {isSelected && <Check className="h-4 w-4 text-primary" />}
          </div>
        </div>

        {/* Subject area selector - only visible when student is selected */}
        {isSelected && (
          <div className="mt-4 border-t pt-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">
                Subject Areas for {student.name}
              </label>
              <Popover 
                open={isOpen}
                onOpenChange={(open) => setSubjectAreasOpenMap(prev => ({ 
                  ...prev, 
                  [student.id]: open 
                }))}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={isOpen}
                    className="w-full justify-between"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      "Loading..."
                    ) : selectedSubjectAreas.length > 0 ? (
                      `${selectedSubjectAreas.length} selected`
                    ) : (
                      "Select subject areas"
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <Command>
                    <CommandInput placeholder={`Search ${student.name}'s subject areas...`} />
                    <CommandEmpty>No subject areas found.</CommandEmpty>
                    <CommandGroup className="max-h-64 overflow-auto">
                      {subjectAreas.map((area) => (
                        <CommandItem
                          key={area.id}
                          value={area.id}
                          onSelect={() => {
                            setSelectedSubjectAreasMap(prev => {
                              const currentSelected = prev[student.id] || [];
                              const isAreaSelected = currentSelected.some(a => a.id === area.id);
                              return {
                                ...prev,
                                [student.id]: isAreaSelected
                                  ? currentSelected.filter(a => a.id !== area.id)
                                  : [...currentSelected, area]
                              };
                            });
                          }}
                        >
                          <div className={cn(
                            "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                            selectedSubjectAreas.some(a => a.id === area.id)
                              ? "bg-primary text-primary-foreground"
                              : "opacity-50"
                          )}>
                            {selectedSubjectAreas.some(a => a.id === area.id) && (
                              <Check className="h-3 w-3" />
                            )}
                          </div>
                          {area.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>

              {/* Selected subject areas badges */}
              {selectedSubjectAreas.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedSubjectAreas.map((area) => (
                    <Badge
                      key={area.id}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      {area.name}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSubjectAreasMap(prev => ({
                            ...prev,
                            [student.id]: prev[student.id].filter(a => a.id !== area.id)
                          }));
                        }}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const handleNext = () => {
    setShowObjectives(true);
  };

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

  const isObjectiveSelected = (studentId, objectiveId) => {
    const selectedForStudent = selectedObjectives[studentId] || [];
    return selectedForStudent.some(obj => obj.id === objectiveId);
  };

  if (showObjectives) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => setShowObjectives(false)}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h2 className="text-lg font-semibold">Select Objectives</h2>
        </div>

        <div className="space-y-8">
          {Object.entries(selectedSubjectAreasMap).map(([studentId, subjectAreas]) => {
            const student = students.find(s => s.id === studentId);
            
            return (
              <div key={studentId} className="border rounded-lg p-4">
                <h3 className="text-xl font-semibold mb-4">{student.name}</h3>
                
                <div className="space-y-6">
                  {subjectAreas.map((subjectArea) => (
                    <div key={subjectArea.id} className="border-l-2 pl-4">
                      <h4 className="text-lg font-medium mb-3">{subjectArea.name}</h4>
                      
                      {subjectArea.objectives.length > 0 ? (
                        <div className="space-y-2">
                          {subjectArea.objectives.map((objective) => (
                            <div
                              key={objective.id}
                              onClick={() => toggleObjective(studentId, objective)}
                              className={cn(
                                "flex items-start gap-3 p-2 rounded-md cursor-pointer transition-colors",
                                isObjectiveSelected(studentId, objective.id)
                                  ? "bg-primary/10"
                                  : "hover:bg-muted"
                              )}
                            >
                              <div className={cn(
                                "mt-1 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                isObjectiveSelected(studentId, objective.id)
                                  ? "bg-primary text-primary-foreground"
                                  : "opacity-50"
                              )}>
                                {isObjectiveSelected(studentId, objective.id) && (
                                  <Check className="h-3 w-3" />
                                )}
                              </div>
                              <div>
                                <p className="text-sm">{objective.description}</p>
                                <div className="flex gap-2 mt-1">
                                  <Badge variant="outline" className="text-xs">
                                    {objective.objective_type}
                                  </Badge>
                                  {objective.target_accuracy && (
                                    <Badge variant="outline" className="text-xs">
                                      {objective.target_accuracy * 100}% accuracy
                                    </Badge>
                                  )}
                                  <Badge variant="outline" className="text-xs">
                                    {objective.target_consistency_trials} trials
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {objective.target_consistency_successes} successes
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">
                          No objectives for this subject area
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={() => setShowObjectives(false)}>
            Back
          </Button>
          <Button
            disabled={Object.values(selectedObjectives).every(arr => arr.length === 0)}
            onClick={() => {
              // Handle submission of selected objectives
              console.log('Selected objectives:', selectedObjectives);
            }}
          >
            Continue
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {students.map((student) => (
          <StudentCard key={student.id} student={student} />
        ))}
      </div>
      
      <div className="flex justify-end mt-6">
        <Button
          onClick={handleNext}
          disabled={Object.keys(selectedSubjectAreasMap).length === 0}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
