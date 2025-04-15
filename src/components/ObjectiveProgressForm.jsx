'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/app/context/auth-context';
import { authorizedFetch } from '@/services/api';
import { toast } from 'sonner';
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import { Label } from '@/components/ui/label';

export function ObjectiveProgressForm({ objectives, onBack, onSuccess }) {
  const { session } = useAuth();
  const [formData, setFormData] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  console.log("objectives", objectives);

  const handleInputChange = (objectiveId, field, value) => {
    setFormData(prev => ({
      ...prev,
      [objectiveId]: {
        ...prev[objectiveId],
        [field]: value
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!session) return;
    setIsSubmitting(true);

    try {
      // Transform formData object into array of sessions with the exact payload structure
      const sessionsPayload = objectives.map(objective => {
        const isBinary = objective.objective_type === 'binary';
        const objectiveData = formData[objective.id] || {};
        
        const basePayload = {
          student_id: objective.student_id,
          objective_id: objective.id,
          memo: objectiveData.memo || '',
          created_at: new Date().toISOString(),
        };

        if (isBinary) {
          // For binary: trials_completed is 1 for 'yes', 0 for 'no', trials_total always 1
          return {
            ...basePayload,
            objective_progress: {
                trials_completed: objectiveData.success === 'yes' ? 1 : 0,
                trials_total: 1
            }
          };
        } else {
          // For trial: use the direct input values from the form
          const trialsCompleted = parseInt(objectiveData.trials_completed) || 0;
          const trialsTotal = parseInt(objectiveData.trials_total) || 0;
          
          return {
            ...basePayload,
            objective_progress: {
              trials_completed: trialsCompleted,
              trials_total: trialsTotal
            }
          };
        }
      });

      console.log("sessionsPayload", sessionsPayload);

      const response = await authorizedFetch('/sessions/session/log', session?.access_token, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sessionsPayload),
      });

      if (!response.ok) throw new Error('Failed to log progress');
      
      toast.success('Progress logged successfully', {
        duration: 3000,
        position: 'top-right',
      });
      
      if (onSuccess) {
        onSuccess();
      }
      
    } catch (error) {
      console.error('Error logging progress:', error);
      toast.error('Failed to log progress');
    } finally {
      setIsSubmitting(false);
    }
  };

  const BinaryInput = ({ objective }) => (
    <div className="space-y-4">
      <RadioGroup
        value={formData[objective.id]?.success || ''}
        onValueChange={(value) => handleInputChange(objective.id, 'success', value)}
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="yes" id={`yes-${objective.id}`} />
          <Label htmlFor={`yes-${objective.id}`}>Yes</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="no" id={`no-${objective.id}`} />
          <Label htmlFor={`no-${objective.id}`}>No</Label>
        </div>
      </RadioGroup>
    </div>
  );

  const TrialInput = ({ objective }) => {
    const [localSuccesses, setLocalSuccesses] = useState(formData[objective.id]?.trials_completed || '');
    const [localTrials, setLocalTrials] = useState(formData[objective.id]?.trials_total || '');

    const handleBlur = () => {
      handleInputChange(objective.id, 'trials_completed', localSuccesses);
      handleInputChange(objective.id, 'trials_total', localTrials);
    };

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min="0"
            value={localSuccesses}
            onChange={(e) => setLocalSuccesses(e.target.value)}
            onBlur={handleBlur}
            className="w-20"
          />
          <span>out of</span>
          <Input
            type="number"
            min="1"
            value={localTrials}
            onChange={(e) => setLocalTrials(e.target.value)}
            onBlur={handleBlur}
            className="w-20"
          />
          <span>trials</span>
        </div>
      </div>
    );
  };

  // Group objectives by student and goal
  const groupedObjectives = objectives.reduce((acc, obj) => {
    const studentId = obj.student.id;
    const goalId = obj.goal.id;
    
    if (!acc[studentId]) {
      acc[studentId] = {
        student: obj.student,
        goals: {}
      };
    }
    if (!acc[studentId].goals[goalId]) {
      acc[studentId].goals[goalId] = {
        goal: obj.goal,
        objectives: []
      };
    }
    acc[studentId].goals[goalId].objectives.push(obj);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack}>
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h2 className="text-lg font-semibold">Log Progress</h2>
      </div>

      <div className="space-y-8">
        {Object.entries(groupedObjectives).map(([studentId, { student, goals }]) => (
          <div key={studentId} className="space-y-6">
            <div className="border rounded-lg p-4">
              <div className="space-y-4">
                <div className="flex flex-col gap-1">
                  <span className="text-sm text-muted-foreground">Student</span>
                  <div>
                    <h3 className="font-medium">{student.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Grade {student.grade_level} • {student.disability_type}
                    </p>
                  </div>
                </div>

                {Object.entries(goals).map(([goalId, { goal, objectives }]) => (
                  <div key={goalId} className="border-t pt-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm text-muted-foreground">Goal</span>
                      <p className="text-sm">{goal.title}</p>
                    </div>

                    <div className="space-y-4 mt-4">
                      {objectives.map((objective) => (
                        <div key={objective.id} className="border-t pt-4">
                          <div className="flex flex-col gap-1">
                            <span className="text-sm text-muted-foreground">Objective</span>
                            <p className="text-sm">{objective.description}</p>
                          </div>

                          <div className="pt-4">
                            {objective.objective_type === 'binary' ? (
                              <BinaryInput objective={objective} />
                            ) : (
                              <TrialInput objective={objective} />
                            )}
                          </div>

                          <div className="space-y-2 pt-4">
                            <Label>Notes (optional)</Label>
                            <Textarea
                              placeholder="Add any memo..."
                              value={formData[objective.id]?.memo || ''}
                              onChange={(e) => handleInputChange(objective.id, 'memo', e.target.value)}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button 
          onClick={handleSubmit}
          disabled={isSubmitting || Object.keys(formData).length === 0}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Logs'}
        </Button>
      </div>
    </div>
  );
} 