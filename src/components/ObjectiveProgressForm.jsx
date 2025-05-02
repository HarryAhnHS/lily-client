'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { ChevronLeft, CheckCircle, ArrowRight } from 'lucide-react';
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
import { DialogTitle, DialogHeader, DialogDescription } from '@/components/ui/dialog';

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
      
      // Success notification
      toast.success('Progress logged successfully', {
        duration: 3000,
        position: 'top-right',
      });
      
      // Reset form data 
      setFormData({});
      
      // Ensure the onSuccess callback is properly called to close all parent forms
      console.log("ObjectiveProgressForm: calling onSuccess callback to close all forms");
      if (typeof onSuccess === 'function') {
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
    // Use formData directly instead of local state to ensure form controls work correctly with tab navigation
    const objectiveData = formData[objective.id] || {};

    return (
      <div className="flex items-center gap-2">
        <Input
          type="number"
          min="0"
          value={objectiveData.trials_completed || ''}
          onChange={(e) => handleInputChange(objective.id, 'trials_completed', e.target.value)}
          className="w-20"
          placeholder="0"
        />
        <span>out of</span>
        <Input
          type="number"
          min="1"
          value={objectiveData.trials_total || ''}
          onChange={(e) => handleInputChange(objective.id, 'trials_total', e.target.value)}
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

  // Count the number of objectives that have data
  const getCompletedObjectivesCount = () => {
    let count = 0;
    for (const objective of objectives) {
      const data = formData[objective.id];
      if (data) {
        if (objective.objective_type === 'binary' && data.success) {
          count++;
        } else if (objective.objective_type !== 'binary' && 
                  (data.trials_completed || data.trials_total)) {
          count++;
        }
      }
    }
    return count;
  };

  const completedCount = getCompletedObjectivesCount();

  return (
    <div className="h-[800px] flex flex-col overflow-hidden">
      {/* Top navigation */}
      <div className="border-b px-6 py-3 flex justify-between items-center flex-shrink-0 bg-gradient-to-r from-muted/80 to-muted">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={onBack} className="p-2 h-9 w-9">
            <ChevronLeft className="h-5 w-5" />
        </Button>
          <h2 className="text-lg font-semibold">Log Progress</h2>
        </div>
        <div className="text-sm text-muted-foreground">
          <span className="font-medium text-primary">{completedCount}</span> of {objectives.length} objectives completed
        </div>
      </div>

      {/* Main content area with scrolling */}
      <div className="flex-1 overflow-hidden">
        <form onSubmit={handleSubmit} className="h-full flex flex-col">
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="space-y-6">
        {Object.entries(groupedObjectives).map(([studentId, { student, goals }]) => (
                <Card key={studentId} className="shadow-none">
            <CardHeader className="bg-muted/30 pb-2">
              <CardTitle className="text-lg font-medium flex items-center">
                <span className="h-6 w-6 rounded-full bg-primary/20 text-xs flex items-center justify-center mr-2 text-primary font-bold">
                  {student.name.charAt(0)}
                </span>
                <span>{student.name}</span>
                <span className="text-xs ml-2 text-muted-foreground font-normal">
                        {student.grade_level ? `Grade ${student.grade_level}` : ''} 
                        {student.disability_type ? ` • ${student.disability_type}` : ''}
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
                          <Card key={objective.id} className="border-primary/10 overflow-hidden mb-4 shadow-none">
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
                                <Label className="text-sm">Did {student.name} successfully complete the objective?</Label>
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
            </div>
          </div>
          
          {/* Fixed bottom bar */}
          <div className="h-[120px] border-t px-6 bg-gradient-to-r from-muted/80 to-muted flex flex-col justify-center flex-shrink-0">
            <div className="flex items-center gap-1.5">
              <div className="text-xs text-muted-foreground mr-1">Progress:</div>
              
              <div className="flex items-center py-4">
                {completedCount > 0 ? (
                  <div className="flex items-center gap-1.5 bg-primary/10 text-primary text-sm px-3 py-1 rounded-full font-medium">
                    <CheckCircle className="h-3.5 w-3.5" />
                    <span>{completedCount}</span> of {objectives.length} objectives filled
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
                    No progress recorded yet
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex justify-end">
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={onBack}
                  type="button"
                >
            Back
          </Button>
          <Button 
            type="submit"
                  disabled={isSubmitting || completedCount === 0}
                  className="flex items-center gap-1"
                  size="sm"
          >
                  {isSubmitting ? 'Submitting...' : 'Submit Logs'} {!isSubmitting && <ArrowRight className="h-4 w-4" />}
          </Button>
              </div>
            </div>
        </div>
      </form>
      </div>
    </div>
  );
} 