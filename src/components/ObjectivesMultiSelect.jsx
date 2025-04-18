import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

export function SessionManualObjectiveSelect({ 
  students, 
  selectedSubjectAreasMap = {}, // Provide default empty object
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

  // Ensure selectedSubjectAreasMap is always an object
  const safeSubjectAreasMap = selectedSubjectAreasMap || {};

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={onBack} className="flex items-center gap-2 p-2">
          <ChevronLeft className="h-4 w-4" />
          <span>Back</span>
        </Button>
        <div>
          <h2 className="text-xl font-semibold">Select Objectives</h2>
          <p className="text-sm text-muted-foreground">Choose objectives to track progress for each student</p>
        </div>
      </div>

      <div className="space-y-8">
        {Object.entries(safeSubjectAreasMap).map(([studentId, subjectAreas]) => {
          const student = students.find(s => s.id === studentId);
          if (!student) return null;
          
          return (
            <div key={studentId} className="border rounded-lg p-5 bg-card shadow-sm">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <span className="h-6 w-6 rounded-full bg-primary/20 text-xs flex items-center justify-center mr-2 text-primary font-bold">
                  {student.name.charAt(0)}
                </span>
                <span>{student.name}</span>
                <span className="text-xs ml-2 text-muted-foreground">
                  {student.grade_level ? `Grade ${student.grade_level}` : ''} 
                  {student.disability_type ? ` • ${student.disability_type}` : ''}
                </span>
              </h3>
              
              <div className="space-y-6">
                {Array.isArray(subjectAreas) ? subjectAreas.map((subjectArea) => (
                  <div key={subjectArea.id} className="border-l-2 border-primary/30 pl-4">
                    <h4 className="text-md font-medium mb-3 flex items-center">
                      <span className="bg-secondary/20 px-2 py-1 rounded text-sm">{subjectArea.name}</span>
                    </h4>
                    
                    {subjectArea.objective && subjectArea.objective.length > 0 ? (
                      <div className="space-y-4">
                        {/* Group objectives by goal */}
                        {Object.entries(
                          subjectArea.objective.reduce((acc, obj) => {
                            const goalId = obj.goal ? obj.goal.id : 'unknown';
                            if (!acc[goalId]) {
                              acc[goalId] = {
                                goal: obj.goal || { id: goalId, title: 'Unknown Goal' },
                                objectives: []
                              };
                            }
                            acc[goalId].objectives.push(obj);
                            return acc;
                          }, {})
                        ).map(([goalId, { goal, objectives }]) => (
                          <div key={goalId} className="space-y-3 mb-5">
                            <div className="bg-muted/50 p-3 rounded-md">
                              <h5 className="font-medium text-sm text-muted-foreground">
                                Goal: {goal.title}
                              </h5>
                            </div>
                            <div className="space-y-2 pl-4 max-w-3xl">
                              {objectives.map((objective) => (
                                <div
                                  key={objective.id}
                                  onClick={() => toggleObjective(studentId, objective)}
                                  className={cn(
                                    "flex items-start gap-3 p-3 rounded-md cursor-pointer transition-colors border",
                                    isObjectiveSelected(studentId, objective.id)
                                      ? "bg-primary/5 border-primary/20"
                                      : "hover:bg-muted border-transparent hover:border-muted-foreground/20"
                                  )}
                                >
                                  <div className={cn(
                                    "mt-1 flex h-5 w-5 items-center justify-center rounded-sm border border-primary",
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
                                    <div className="flex flex-wrap gap-2 mt-2">
                                      <Badge variant="outline" className="text-xs bg-secondary/10">
                                        {objective.objective_type === 'binary' ? 'Yes/No' : 'Trial based'}
                                      </Badge>
                                      {objective.target_accuracy && (
                                        <Badge variant="outline" className="text-xs bg-secondary/10">
                                          {Math.round(objective.target_accuracy * 100)}% accuracy
                                        </Badge>
                                      )}
                                      {objective.target_consistency_trials && (
                                        <Badge variant="outline" className="text-xs bg-secondary/10">
                                          {objective.target_consistency_trials} trials
                                        </Badge>
                                      )}
                                      {objective.target_consistency_successes && (
                                        <Badge variant="outline" className="text-xs bg-secondary/10">
                                          {objective.target_consistency_successes} successes
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic p-3 bg-muted/20 rounded-md">
                        No objectives available for this subject area
                      </p>
                    )}
                  </div>
                )) : (
                  <p className="text-sm text-muted-foreground italic p-3 bg-muted/20 rounded-md">
                    No subject areas available
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {Object.keys(safeSubjectAreasMap).length === 0 && (
        <div className="text-center p-8 bg-muted/10 rounded-lg border border-muted">
          <p className="text-muted-foreground">No students or subject areas selected</p>
          <Button 
            variant="outline" 
            onClick={onBack} 
            className="mt-4"
          >
            Go back to select students
          </Button>
        </div>
      )}

      <div className="flex justify-end gap-4 pt-4">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button
          disabled={Object.values(selectedObjectives).every(arr => arr.length === 0)}
          onClick={() => onContinue(selectedObjectives)}
          className="bg-primary hover:bg-primary/90"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}