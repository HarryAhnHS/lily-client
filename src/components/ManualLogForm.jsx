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
import { ObjectiveProgressForm } from './ObjectiveProgressForm';

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
  const [showProgressForm, setShowProgressForm] = useState(false);
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

  // page 1 -> page 2
  const handleNext = () => {
    setShowObjectives(true);
  };

  // page 2 -> page 3
  const handleObjectivesContinue = (objectives) => {
    setSelectedObjectives(objectives);
    setShowProgressForm(true);
  };

  if (showProgressForm) {
    return (
      <ObjectiveProgressForm
        objectives={Object.values(selectedObjectives).flat()}
        onBack={() => {
          setShowProgressForm(false);
          setShowObjectives(true);
        }}
      />
    );
  }

  if (showObjectives) {
    return (
      <ObjectivesMultiSelect
        students={students}
        selectedSubjectAreasMap={selectedSubjectAreasMap}
        onBack={() => setShowObjectives(false)}
        onContinue={handleObjectivesContinue}
      />
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
