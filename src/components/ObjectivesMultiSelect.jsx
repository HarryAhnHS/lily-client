import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ObjectivesMultiSelect({ 
  students, 
  selectedSubjectAreasMap, 
  onBack,
  onContinue 
}) {
  const [selectedObjectives, setSelectedObjectives] = useState({});

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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack}>
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
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button
          disabled={Object.values(selectedObjectives).every(arr => arr.length === 0)}
          onClick={() => onContinue(selectedObjectives)}
        >
          Continue
        </Button>
      </div>
    </div>
  );
} 