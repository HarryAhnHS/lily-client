'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, ChevronLeft, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ObjectivesMultiSelect({ data, onBack }) {
  const [selectedObjectives, setSelectedObjectives] = useState({});

  const toggleObjective = (studentId, subjectAreaId, goalId, objective) => {
    setSelectedObjectives(prev => {
      const key = `${studentId}-${subjectAreaId}-${goalId}`;
      const currentSelected = prev[key] || [];
      const isSelected = currentSelected.some(obj => obj.id === objective.id);

      const newSelected = isSelected
        ? currentSelected.filter(obj => obj.id !== objective.id)
        : [...currentSelected, objective];

      return {
        ...prev,
        [key]: newSelected
      };
    });
  };

  const isObjectiveSelected = (studentId, subjectAreaId, goalId, objectiveId) => {
    const key = `${studentId}-${subjectAreaId}-${goalId}`;
    const selectedForKey = selectedObjectives[key] || [];
    return selectedForKey.some(obj => obj.id === objectiveId);
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
        {data.map((student) => (
          <div key={student.student_id} className="border rounded-lg p-4">
            <h3 className="text-xl font-semibold mb-4">{student.student_name}</h3>
            
            <div className="space-y-6">
              {student.subject_areas.map((subjectArea) => (
                <div key={subjectArea.subject_area_id} className="border-l-2 pl-4">
                  <h4 className="text-lg font-medium mb-3">{subjectArea.name}</h4>
                  
                  <div className="space-y-4">
                    {subjectArea.goals.map((goal) => (
                      <div key={goal.goal_id} className="bg-muted/50 rounded-lg p-4">
                        <h5 className="font-medium mb-2">{goal.title}</h5>
                        
                        <div className="space-y-2">
                          {goal.objectives.map((objective) => (
                            <div
                              key={objective.id}
                              onClick={() => toggleObjective(
                                student.student_id,
                                subjectArea.subject_area_id,
                                goal.goal_id,
                                objective
                              )}
                              className={cn(
                                "flex items-start gap-3 p-2 rounded-md cursor-pointer transition-colors",
                                isObjectiveSelected(
                                  student.student_id,
                                  subjectArea.subject_area_id,
                                  goal.goal_id,
                                  objective.id
                                )
                                  ? "bg-primary/10"
                                  : "hover:bg-muted"
                              )}
                            >
                              <div className={cn(
                                "mt-1 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                isObjectiveSelected(
                                  student.student_id,
                                  subjectArea.subject_area_id,
                                  goal.goal_id,
                                  objective.id
                                )
                                  ? "bg-primary text-primary-foreground"
                                  : "opacity-50"
                              )}>
                                {isObjectiveSelected(
                                  student.student_id,
                                  subjectArea.subject_area_id,
                                  goal.goal_id,
                                  objective.id
                                ) && <Check className="h-3 w-3" />}
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
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={onBack}>
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