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
        const successValue = formData[objective.id]?.success === 'yes';
        
        return {
          student_id: objective.student_id,
          objective_id: objective.id,
          memo: formData[objective.id]?.memo || '',
          created_at: new Date().toISOString(),
          trials_completed: isBinary
            ? (successValue ? 1 : 0)
            : parseInt(formData[objective.id]?.successes || 0),
          trials_total: isBinary
            ? 1
            : parseInt(formData[objective.id]?.trials || objective.target_consistency_trials)
        };
      });

      const response = await authorizedFetch('/sessions/session/log', session?.access_token, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sessionsPayload),
      });

      if (!response.ok) throw new Error('Failed to log progress');
      
      // Reset form data for all objectives
      const resetFormData = {};
      objectives.forEach(objective => {
        resetFormData[objective.id] = {
          type: objective.objective_type,
          target_accuracy: objective.target_accuracy,
          memo: '',
          ...(objective.objective_type === 'trial' ? {
            trials: objective.target_consistency_trials,
            successes: 0
          } : {
            success: ''
          })
        };
      });
      setFormData(resetFormData);
      
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

  const TrialInput = ({ objective }) => (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Input
          type="number"
          min="0"
          max={formData[objective.id]?.trials || objective.target_consistency_trials}
          value={formData[objective.id]?.successes || ''}
          onChange={(e) => handleInputChange(objective.id, 'successes', e.target.value)}
          className="w-20"
        />
        <span>out of</span>
        <Input
          type="number"
          min={objective.target_consistency_trials}
          value={formData[objective.id]?.trials || objective.target_consistency_trials}
          onChange={(e) => handleInputChange(objective.id, 'trials', e.target.value)}
          className="w-20"
        />
        <span>trials</span>
      </div>
    </div>
  );

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
        {objectives.map((objective) => {
          // Initialize form data for this objective if not exists
          if (!formData[objective.id]) {
            setFormData(prev => ({
              ...prev,
              [objective.id]: {
                type: objective.objective_type,
                target_accuracy: objective.target_accuracy,
                memo: '',
                ...(objective.objective_type === 'trial' ? {
                  trials: objective.target_consistency_trials,
                  successes: 0
                } : {
                  success: ''
                })
              }
            }));
          }

          return (
            <div key={objective.id} className="border rounded-lg p-4">
              <div className="space-y-4">
                <div className="flex flex-col gap-1">
                  <span className="text-sm text-muted-foreground">Student</span>
                  <h3 className="font-medium">{objective.student_name}</h3>
                </div>
                
                <div className="flex flex-col gap-1">
                  <span className="text-sm text-muted-foreground">Subject Area</span>
                  <h4 className="font-medium">{objective.subject_area_name}</h4>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-sm text-muted-foreground">Objective</span>
                  <p>{objective.description}</p>
                </div>

                <div className="pt-4">
                  {objective.objective_type === 'binary' ? (
                    <BinaryInput objective={objective} />
                  ) : (
                    <TrialInput objective={objective} />
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Notes (optional)</Label>
                  <Textarea
                    placeholder="Add any memo..."
                    value={formData[objective.id]?.memo || ''}
                    onChange={(e) => handleInputChange(objective.id, 'memo', e.target.value)}
                  />
                </div>
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
          onClick={handleSubmit}
          disabled={isSubmitting || Object.keys(formData).length === 0}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Logs'}
        </Button>
      </div>
    </div>
  );
} 