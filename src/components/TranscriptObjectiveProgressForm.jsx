'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useAuth } from '@/app/context/auth-context';
import { authorizedFetch } from '@/services/api';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export function TranscriptObjectiveProgressForm({ sessions, onBack, onSuccess, open = true, onOpenChange }) {
  const { session } = useAuth();
  const [formData, setFormData] = useState(() => {
    const initialData = {};
    sessions.forEach((s) => {
      initialData[s.parsed_session_id] = {
        trials_completed: s.objective_progress?.trials_completed || 0,
        trials_total: s.objective_progress?.trials_total || 0,
        success: s.objective_progress?.trials_completed === 1 ? 'yes' : 'no',
        memo: s.memo || '',
      };
    });
    return initialData;
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentSessionIndex, setCurrentSessionIndex] = useState(0);
  const currentSession = sessions[currentSessionIndex];
  const [selectedStudentId, setSelectedStudentId] = useState(currentSession.students[0].id);
  const [selectedObjectiveId, setSelectedObjectiveId] = useState(currentSession.objectives[0].id);

  const handleChange = (objectiveId, field, value) => {
    setFormData(prev => ({
      ...prev,
      [objectiveId]: {
        ...prev[objectiveId],
        [field]: value,
      },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!session) return;
    setIsSubmitting(true);

    try {
      const payload = sessions.map((session) => {
        const values = formData[session.parsed_session_id] || {};
        const selectedObjective = session.objectives[0]; // Default to first objective
        const isBinary = selectedObjective.objective_type === 'binary';

        const objective_progress = isBinary
          ? {
              trials_completed: values.success === 'yes' ? 1 : 0,
              trials_total: 1,
            }
          : {
              trials_completed: parseInt(values.trials_completed) || 0,
              trials_total: parseInt(values.trials_total) || 0,
            };

        return {
          student_id: session.students[0].id, // Default to first student
          objective_id: selectedObjective.id,
          memo: values.memo || '',
          raw_input: session.raw_input,
          objective_progress,
        };
      });

      const response = await authorizedFetch('/sessions/session/log', session?.access_token, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Failed to log progress');

      toast.success('Progress logged successfully');
      onSuccess?.();
    } catch (err) {
      console.error(err);
      toast.error('Failed to log progress');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStudentChange = (studentId) => {
    setSelectedStudentId(studentId);
  };

  const handleObjectiveChange = (objectiveId) => {
    setSelectedObjectiveId(objectiveId);
  };

  const handleNextSession = () => {
    if (currentSessionIndex < sessions.length - 1) {
      const nextIndex = currentSessionIndex + 1;
      setCurrentSessionIndex(nextIndex);
      
      // Reset selections to first entries in the next session
      const nextSession = sessions[nextIndex];
      setSelectedStudentId(nextSession.students[0].id);
      setSelectedObjectiveId(nextSession.objectives[0].id);
    }
  };

  const handlePreviousSession = () => {
    if (currentSessionIndex > 0) {
      const prevIndex = currentSessionIndex - 1;
      setCurrentSessionIndex(prevIndex);
      
      // Reset selections to first entries in the previous session
      const prevSession = sessions[prevIndex];
      setSelectedStudentId(prevSession.students[0].id);
      setSelectedObjectiveId(prevSession.objectives[0].id);
    }
  };

  const BinaryInput = ({ id }) => (
    <RadioGroup
      value={formData[id]?.success || ''}
      onValueChange={(val) => handleChange(id, 'success', val)}
      className="flex gap-4"
    >
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="yes" id={`yes-${id}`} />
        <Label htmlFor={`yes-${id}`}>Yes</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="no" id={`no-${id}`} />
        <Label htmlFor={`no-${id}`}>No</Label>
      </div>
    </RadioGroup>
  );

  const TrialInput = ({ id }) => {
    return (
      <div className="flex items-center gap-2">
        <Input
          type="number"
          min={0}
          className="w-20"
          placeholder="Successes"
          value={formData[id]?.trials_completed || ''}
          onChange={(e) => handleChange(id, 'trials_completed', e.target.value)}
        />
        <span>out of</span>
        <Input
          type="number"
          min={1}
          className="w-20"
          placeholder="Trials"
          value={formData[id]?.trials_total || ''}
          onChange={(e) => handleChange(id, 'trials_total', e.target.value)}
        />
      </div>
    );
  };

  // Get current selected objective
  const currentSelectedObjective = currentSession.objectives.find(obj => obj.id === selectedObjectiveId) || currentSession.objectives[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto" aria-describedby="form-description">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Session {currentSessionIndex + 1} of {sessions.length}</span>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="icon"
                onClick={handlePreviousSession} 
                disabled={currentSessionIndex === 0}
                aria-label="Previous session"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="icon"
                onClick={handleNextSession} 
                disabled={currentSessionIndex === sessions.length - 1}
                aria-label="Next session"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </DialogTitle>
          <DialogDescription id="form-description">
            Review and edit AI-generated session data
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Transcript Card */}
          <Card className="overflow-hidden border-muted-foreground/20">
            <CardHeader className="bg-muted/50 p-3">
              <CardTitle className="text-sm font-medium">Transcript</CardTitle>
            </CardHeader>
            <CardContent className="p-3 text-sm bg-muted/10">
              <p>{currentSession.raw_input}</p>
            </CardContent>
          </Card>

          {/* AI Analysis and Edit Section */}
          <div className="space-y-5">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle className="h-3.5 w-3.5 text-primary" />
              </div>
              <h3 className="font-medium text-md">AI Analysis</h3>
              <span className="text-xs text-muted-foreground">Review and edit as needed</span>
            </div>

            {/* Student Selection */}
            <div className="space-y-2">
              <Label htmlFor="student-select" className="text-sm flex items-center gap-2">
                Student
                <span className="text-xs text-muted-foreground font-normal">(Who was this session about?)</span>
              </Label>
              <Select 
                value={selectedStudentId} 
                onValueChange={handleStudentChange}
              >
                <SelectTrigger id="student-select" className="w-full">
                  <SelectValue placeholder="Select a student" className="w-full truncate pr-2" />
                </SelectTrigger>
                <SelectContent 
                  className="max-h-[300px] overflow-y-auto w-full min-w-[300px] max-w-[520px]"
                  side="bottom"
                  align="start"
                >
                  {currentSession.students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.name} {student.grade_level ? `(Grade ${student.grade_level})` : ''}
                      {student.disability_type && ` • ${student.disability_type}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Objective Selection */}
            <div className="space-y-2">
              <Label htmlFor="objective-select" className="text-sm flex items-center gap-2">
                Objective
                <span className="text-xs text-muted-foreground font-normal">(What was being worked on?)</span>
              </Label>
              <div className="text-xs text-muted-foreground pl-2 border-l-2 border-primary/30 mb-2">
                AI detected: {currentSession.objectives[0].queried_objective_description}
              </div>
              <Select 
                value={selectedObjectiveId} 
                onValueChange={handleObjectiveChange}
              >
                <SelectTrigger id="objective-select" className="w-full">
                  <SelectValue placeholder="Select an objective" className="w-full truncate pr-2" />
                </SelectTrigger>
                <SelectContent 
                  className="max-h-[300px] overflow-y-auto w-full min-w-[300px] max-w-[520px]"
                  side="bottom"
                  align="start"
                >
                  {currentSession.objectives.map((objective) => (
                    <SelectItem 
                      key={objective.id} 
                      value={objective.id}
                      className="py-2 whitespace-normal break-words text-sm"
                    >
                      {objective.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Progress Section with Hierarchy */}
            <Card className="overflow-hidden border-primary/20">
              <CardHeader className="bg-primary/5 p-3">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                  <span>Progress Tracking</span>
                  <div className="text-xs bg-primary/10 px-2 py-0.5 rounded">
                    {currentSelectedObjective.objective_type === 'binary' ? 'Yes/No' : 'Trial Based'}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                {/* Hierarchical Path Display */}
                <div className="text-sm space-y-2">
                  <div className="flex flex-col space-y-1">
                    <div className="flex items-center text-xs text-muted-foreground gap-2">
                      <span className="bg-secondary/30 px-1.5 py-0.5 rounded-sm">Subject Area</span>
                      <span>→</span>
                      <span className="bg-secondary/30 px-1.5 py-0.5 rounded-sm">Goal</span>
                      <span>→</span>
                      <span className="bg-primary/20 px-1.5 py-0.5 rounded-sm font-medium">Objective</span>
                    </div>
                    <div className="pl-3 border-l-2 border-secondary/30 space-y-1.5 mt-1">
                      <p className="text-sm">{currentSelectedObjective.subject_area.name}</p>
                      <div className="pl-3 border-l-2 border-secondary/30 space-y-1.5">
                        <p className="text-sm">{currentSelectedObjective.goal.title}</p>
                        <div className="pl-3 border-l-2 border-primary/30">
                          <p className="text-sm font-medium">{currentSelectedObjective.description}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Progress Input */}
                <div className="pt-3 border-t space-y-2">
                  <Label className="text-sm">Record Progress</Label>
                  <div className="pl-3 border-l-2 border-primary/30 py-2">
                    {currentSelectedObjective.objective_type === 'binary' ? (
                      <BinaryInput id={currentSession.parsed_session_id} />
                    ) : (
                      <TrialInput id={currentSession.parsed_session_id} />
                    )}
                  </div>
                </div>
                
                {/* Memo Input */}
                <div className="pt-3 border-t space-y-2">
                  <Label htmlFor={`memo-${currentSession.parsed_session_id}`} className="text-sm">Session Notes</Label>
                  <Textarea
                    id={`memo-${currentSession.parsed_session_id}`}
                    value={formData[currentSession.parsed_session_id]?.memo || ''}
                    onChange={(e) => handleChange(currentSession.parsed_session_id, 'memo', e.target.value)}
                    placeholder="Add any additional notes about this session..."
                    className="resize-none min-h-[80px] text-sm"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <DialogFooter>
            <Button variant="outline" type="button" onClick={onBack}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit All Sessions'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
