'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { ChevronLeft, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/app/context/auth-context';
import { authorizedFetch } from '@/services/api';
import { toast } from 'sonner';
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export function SessionManualProgressForm({ objectives, onBack, onSuccess }) {
  const { session } = useAuth();
  const [formData, setFormData] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

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
              trials_total: trialsTotal > 0 ? trialsTotal : 1
            }
          };
        }
      });

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
    <RadioGroup
      value={formData[objective.id]?.success || ''}
      onValueChange={(value) => handleInputChange(objective.id, 'success', value)}
      className="flex gap-4"
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
  );

  const TrialInput = ({ objective }) => {
    const [localSuccesses, setLocalSuccesses] = useState(formData[objective.id]?.trials_completed || '');
    const [localTrials, setLocalTrials] = useState(formData[objective.id]?.trials_total || '');

    const handleBlur = () => {
      handleInputChange(objective.id, 'trials_completed', localSuccesses);
      handleInputChange(objective.id, 'trials_total', localTrials);
    };

    return (
      <div className="flex items-center gap-2">
        <Input
          type="number"
          min="0"
          value={localSuccesses}
          onChange={(e) => setLocalSuccesses(e.target.value)}
          onBlur={handleBlur}
          className="w-20"
          placeholder="0"
        />
        <span>out of</span>
        <Input
          type="number"
          min="1"
          value={localTrials}
          onChange={(e) => setLocalTrials(e.target.value)}
          onBlur={handleBlur}
          className="w-20"
          placeholder="1"
        />
        <span>trials</span>
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
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={onBack} className="flex items-center gap-2 p-2">
          <ChevronLeft className="h-4 w-4" />
          <span>Back</span>
        </Button>
        <div>
          <h2 className="text-xl font-semibold">Log Progress</h2>
          <p className="text-sm text-muted-foreground">Record progress for each selected objective</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {Object.entries(groupedObjectives).map(([studentId, { student, goals }]) => (
          <Card key={studentId} className="shadow-sm">
            <CardHeader className="bg-muted/30 pb-2">
              <CardTitle className="text-lg font-medium flex items-center">
                <span className="h-6 w-6 rounded-full bg-primary/20 text-xs flex items-center justify-center mr-2 text-primary font-bold">
                  {student.name.charAt(0)}
                </span>
                <span>{student.name}</span>
                <span className="text-xs ml-2 text-muted-foreground font-normal">
                  Grade {student.grade_level} • {student.disability_type}
                </span>
              </CardTitle>
            </CardHeader>

            <CardContent className="pt-4 space-y-6">
              {Object.entries(goals).map(([goalId, { goal, objectives }]) => (
                <div key={goalId} className="space-y-4">
                  <div className="bg-secondary/10 p-3 rounded-md">
                    <h4 className="text-sm font-medium">Goal: {goal.title}</h4>
                  </div>

                  {objectives.map((objective) => (
                    <Card key={objective.id} className="border-primary/10 overflow-hidden mb-4">
                      <CardHeader className="bg-primary/5 p-3">
                        <CardTitle className="text-sm font-medium flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center">
                              <CheckCircle className="h-3 w-3 text-primary" />
                            </div>
                            <span>Progress for Objective</span>
                          </div>
                          <div className="text-xs bg-primary/10 px-2 py-0.5 rounded">
                            {objective.objective_type === 'binary' ? 'Yes/No' : 'Trial Based'} 
                          </div>
                        </CardTitle>
                      </CardHeader>
                      
                      <CardContent className="p-4 space-y-4">
                        <div className="space-y-2">
                          <Label className="text-sm text-muted-foreground">Objective</Label>
                          <p className="text-sm border-l-2 border-primary/30 pl-3 py-1">{objective.description}</p>
                        </div>
                        
                        <div className="pt-2 space-y-2">
                          <Label className="text-sm">Record Progress</Label>
                          <div className="pl-3 border-l-2 border-primary/30 py-2">
                            {objective.objective_type === 'binary' ? (
                              <BinaryInput objective={objective} />
                            ) : (
                              <TrialInput objective={objective} />
                            )}
                          </div>
                        </div>

                        <div className="pt-2 space-y-2">
                          <Label className="text-sm">Notes (optional)</Label>
                          <Textarea
                            placeholder="Add any notes about this objective..."
                            value={formData[objective.id]?.memo || ''}
                            onChange={(e) => handleInputChange(objective.id, 'memo', e.target.value)}
                            className="resize-none min-h-[80px]"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ))}
            </CardContent>
          </Card>
        ))}

        <div className="flex justify-end gap-4 pt-4">
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button 
            type="submit"
            disabled={isSubmitting || Object.keys(formData).length === 0}
            className="bg-primary hover:bg-primary/90"
          >
            {isSubmitting ? 'Submitting...' : 'Submit All Logs'}
          </Button>
        </div>
      </form>
    </div>
  );
} 