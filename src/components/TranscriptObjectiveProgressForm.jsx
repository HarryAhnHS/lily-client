'use client';
// John and bobby took the same math test today and John got a 75% whereas bobby got only 2 wrong. John struggled with arithmetics. Both took about 60 minutes to complete the test.

import { useState, useMemo, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
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
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export function TranscriptObjectiveProgressForm({ sessions, onBack, onSuccess, open = true, onOpenChange }) {
  const { session } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentSessionIndex, setCurrentSessionIndex] = useState(0);

  // Initialize form data with proper defaults - using a simpler approach
  const [formData, setFormData] = useState(() => {
    return sessions.reduce((acc, s) => {
      const defaultStudentId = s.matches[0]?.student?.id;
      const match = s.matches.find(m => m.student.id === defaultStudentId);
      const defaultObjectiveId = match?.objectives?.[0]?.id;
      
      acc[s.parsed_session_id] = {
        student_id: defaultStudentId || null,
        objective_id: defaultObjectiveId || null,
        trials_completed: s.objective_progress?.trials_completed || 0,
        trials_total: s.objective_progress?.trials_total || 0,
        memo: s.memo || '',
      };
      return acc;
    }, {});
  });

  // Current session data
  const currentSession = sessions[currentSessionIndex];
  const currentSessionId = currentSession.parsed_session_id;
  const currentSessionData = formData[currentSessionId] || {
    student_id: null,
    objective_id: null,
    trials_completed: 0,
    trials_total: 0,
    memo: ''
  };

  // Get the currently selected student
  const currentStudentMatch = useMemo(() => {
    if (!currentSessionData.student_id) return null;
    return currentSession.matches.find(m => m.student.id === currentSessionData.student_id);
  }, [currentSession.matches, currentSessionData.student_id]);

  // Get objectives for the selected student
  const currentObjectives = useMemo(() => {
    return currentStudentMatch?.objectives || [];
  }, [currentStudentMatch]);

  // Get the selected objective
  const currentSelectedObjective = useMemo(() => {
    if (!currentSessionData.objective_id || !currentStudentMatch) return null;
    
    return currentObjectives.find(o => o.id === currentSessionData.objective_id) || null;
  }, [currentSessionData.objective_id, currentStudentMatch, currentObjectives]);

  // Update a field in the current session's form data
  const updateField = useCallback((field, value) => {
    // Prevent setting objective_id to empty values
    if (field === 'objective_id' && !value) {
      console.log("Prevented setting empty objective_id");
      return;
    }
    
    setFormData(prevData => {
      // Make sure we're working with a copy of the current session data
      const currentData = { ...(prevData[currentSessionId] || {
        student_id: null,
        objective_id: null,
        trials_completed: 0,
        trials_total: 0,
        memo: ''
      })};
      
      // Handle special case for student change - auto-select first objective
      if (field === 'student_id') {
        const newStudentMatch = currentSession.matches.find(m => m.student.id === value);
        
        // If student has objectives, select the first one
        if (newStudentMatch?.objectives?.length > 0) {
          currentData.objective_id = newStudentMatch.objectives[0].id;
          console.log(`Auto-selected objective ${currentData.objective_id} for new student`);
        }
      }
      
      // Update the field
      currentData[field] = value;
      
      console.log(`Updated form data for session ${currentSessionId}, field ${field}:`, currentData);
      
      return {
        ...prevData,
        [currentSessionId]: currentData
      };
    });
  }, [currentSessionId, currentSession.matches]);

  // Ensure current session data is valid
  const validateCurrentSession = useCallback(() => {
    console.log(`Validating session ${currentSessionId}`);
    
    setFormData(prevData => {
      // Get the current data, create it if it doesn't exist
      const sessionData = prevData[currentSessionId] || {
        student_id: null,
        objective_id: null,
        trials_completed: 0,
        trials_total: 0,
        memo: ''
      };
      
      // Make a copy to avoid direct mutation
      const updatedData = { ...sessionData };
      let dataChanged = false;
      
      // If no student is selected, select the first one
      if (!updatedData.student_id && currentSession.matches.length > 0) {
        updatedData.student_id = currentSession.matches[0].student.id;
        dataChanged = true;
        console.log(`Validated missing student_id, set to ${updatedData.student_id}`);
      }
      
      if (updatedData.student_id) {
        // Find the match for this student
        const match = currentSession.matches.find(m => m.student.id === updatedData.student_id);
        
        // If this student exists and has objectives
        if (match && match.objectives && match.objectives.length > 0) {
          // If no objective is selected or the current one is invalid, select the first one
          const validObjective = match.objectives.find(o => o.id === updatedData.objective_id);
          
          if (!updatedData.objective_id || !validObjective) {
            updatedData.objective_id = match.objectives[0].id;
            dataChanged = true;
            console.log(`Validated missing/invalid objective_id, set to ${updatedData.objective_id}`);
          }
        }
      }
      
      // Only update state if something changed
      if (dataChanged) {
        return {
          ...prevData,
          [currentSessionId]: updatedData
        };
      }
      
      return prevData;
    });
  }, [currentSessionId, currentSession.matches]);

  // Session navigation functions
  const handleNextSession = useCallback(() => {
    if (currentSessionIndex < sessions.length - 1) {
      // First ensure the current session's data is valid and persisted
      validateCurrentSession();
      
      // Force a synchronous update to ensure current session data is saved
      setFormData(prevData => {
        // Log the current state for debugging
        console.log(`Moving from session ${currentSessionIndex} to ${currentSessionIndex + 1}`);
        console.log(`Current form data for ${currentSessionId}:`, prevData[currentSessionId]);
        
        // Return the same state to avoid unnecessary re-renders
        return prevData;
      });
      
      // Then navigate
      setCurrentSessionIndex(prevIndex => prevIndex + 1);
    }
  }, [currentSessionIndex, sessions.length, currentSessionId]);

  const handlePreviousSession = useCallback(() => {
    if (currentSessionIndex > 0) {
      // First ensure the current session's data is valid and persisted
      validateCurrentSession();
      
      // Force a synchronous update to ensure current session data is saved
      setFormData(prevData => {
        // Log the current state for debugging
        console.log(`Moving from session ${currentSessionIndex} to ${currentSessionIndex - 1}`);
        console.log(`Current form data for ${currentSessionId}:`, prevData[currentSessionId]);
        
        // Return the same state to avoid unnecessary re-renders
        return prevData;
      });
      
      // Then navigate
      setCurrentSessionIndex(prevIndex => prevIndex - 1);
    }
  }, [currentSessionIndex, currentSessionId]);

  // Add effect to validate when session changes
  useEffect(() => {
    console.log(`Session changed to index ${currentSessionIndex}, id: ${currentSessionId}`);
    
    // Ensure we have valid data for this session
    validateCurrentSession();
    
    // Double-check that our data is valid after the state update
    const timer = setTimeout(() => {
      console.log(`Validating session ${currentSessionId} after navigation`);
      validateCurrentSession();
    }, 0);
    
    return () => clearTimeout(timer);
  }, [currentSessionIndex, currentSessionId]);

  // Submit all sessions
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!session) return;
    
    // Validate all sessions before submission
    const invalidSessions = sessions.filter(s => {
      const data = formData[s.parsed_session_id];
      if (!data?.student_id || !data?.objective_id) return true;
      
      const match = s.matches.find(m => m.student.id === data.student_id);
      if (!match) return true;
      
      const obj = match.objectives.find(o => o.id === data.objective_id);
      if (!obj) return true;
      
      const isBinary = obj.objective_type === 'binary';
      
      if (isBinary) {
        const trials = parseInt(data.trials_completed);
        return isNaN(trials) || (trials !== 0 && trials !== 1);
      } else {
        const completed = parseInt(data.trials_completed);
        const total = parseInt(data.trials_total);
        return isNaN(completed) || isNaN(total) || total <= 0;
      }
    });
    
    if (invalidSessions.length > 0) {
      const invalidIndex = sessions.findIndex(s => s.parsed_session_id === invalidSessions[0].parsed_session_id);
      if (invalidIndex !== currentSessionIndex) {
        setCurrentSessionIndex(invalidIndex);
      }
      toast.error("Please complete all required fields before submitting");
      return;
    }
    
    setIsSubmitting(true);

    try {
      const formattedSessions = sessions.map((sessionData) => {
        const id = sessionData.parsed_session_id;
        const values = formData[id] || {};
        const match = sessionData.matches.find(m => m.student.id === values.student_id);
        const obj = match?.objectives.find(o => o.id === values.objective_id);
        const isBinary = obj?.objective_type === 'binary';

        const trials_completed = parseInt(values.trials_completed);
        const trials_total = parseInt(values.trials_total);
        
        return {
          student_id: values.student_id,
          objective_id: values.objective_id,
          memo: values.memo || '',
          created_at: new Date().toISOString(),
          objective_progress: isBinary ? {
            trials_completed: isNaN(trials_completed) ? 0 : trials_completed,
            trials_total: 1
          } : {
            trials_completed: isNaN(trials_completed) ? 0 : trials_completed,
            trials_total: isNaN(trials_total) ? 1 : Math.max(1, trials_total)
          }
        };
      });

      const response = await authorizedFetch('/sessions/session/log', session.access_token, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formattedSessions)
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

  // Binary input component
  const BinaryInput = () => {
    const handleBinaryChange = (val) => {
      const intVal = parseInt(val);
      const value = isNaN(intVal) ? 0 : intVal;
      
      updateField('trials_completed', value);
      updateField('trials_total', 1);
    };
    
    const currentValue = parseInt(currentSessionData.trials_completed) || 0;
    
    return (
      <RadioGroup
        value={currentValue.toString()}
        onValueChange={handleBinaryChange}
        className="flex gap-4"
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="1" id={`yes-${currentSessionId}`} />
          <Label htmlFor={`yes-${currentSessionId}`}>Yes</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="0" id={`no-${currentSessionId}`} />
          <Label htmlFor={`no-${currentSessionId}`}>No</Label>
        </div>
      </RadioGroup>
    );
  };

  // Trial-based input component
  const TrialInput = () => {
    const [localCompleted, setLocalCompleted] = useState('');
    const [localTotal, setLocalTotal] = useState('');
    
    // Update local state when current session changes
    useEffect(() => {
      setLocalCompleted(currentSessionData.trials_completed?.toString() || '');
      setLocalTotal(currentSessionData.trials_total?.toString() || '');
    }, [currentSessionId, currentSessionData.trials_completed, currentSessionData.trials_total]);
    
    const handleBlur = () => {
      const completedValue = localCompleted === '' ? 0 : parseInt(localCompleted);
      const totalValue = localTotal === '' ? 0 : parseInt(localTotal);
      
      updateField('trials_completed', isNaN(completedValue) ? 0 : completedValue);
      updateField('trials_total', isNaN(totalValue) ? 0 : Math.max(1, totalValue));
    };
    
    return (
      <div className="flex items-center gap-2">
        <Input
          type="number"
          min={0}
          className="w-20"
          placeholder="Successes"
          value={localCompleted}
          onChange={(e) => setLocalCompleted(e.target.value)}
          onBlur={handleBlur}
        />
        <span>out of</span>
        <Input
          type="number"
          min={1}
          className="w-20"
          placeholder="Trials"
          value={localTotal}
          onChange={(e) => setLocalTotal(e.target.value)}
          onBlur={handleBlur}
        />
      </div>
    );
  };

  return (
    <Dialog 
      open={open} 
      onOpenChange={(isOpen) => {
        if (!isOpen && onOpenChange) {
          onOpenChange(false);
        }
      }}
    >
      <DialogContent 
        className="sm:max-w-[550px] w-[95vw] max-h-[90vh] overflow-y-auto" 
        onInteractOutside={(e) => {
          e.preventDefault();
          if (onOpenChange) {
            onOpenChange(false);
          }
        }}
        aria-describedby="form-description"
      >
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
                value={currentSessionData.student_id || ''} 
                onValueChange={(value) => updateField('student_id', value)}
              >
                <SelectTrigger id="student-select" className="w-full">
                  <SelectValue placeholder="Select a student" className="w-full truncate pr-2" />
                </SelectTrigger>
                <SelectContent 
                  className="max-h-[300px] overflow-y-auto w-full min-w-[300px] max-w-[520px]"
                  side="bottom"
                  align="start"
                >
                  {currentSession.matches.map((match) => (
                    <SelectItem key={match.student.id} value={match.student.id}>
                      {match.student.name} {match.student.grade_level ? `(Grade ${match.student.grade_level})` : ''}
                      {match.student.disability_type && ` • ${match.student.disability_type}`}
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
              {currentSession.matches[0]?.objectives[0]?.queried_objective_description && (
                <div className="text-xs text-muted-foreground pl-2 border-l-2 border-primary/30 mb-2">
                  AI detected: {currentSession.matches[0].objectives[0].queried_objective_description}
                </div>
              )}
              {currentObjectives.length > 0 ? (
                <Select 
                  value={currentSessionData.objective_id || ''} 
                  onValueChange={(value) => updateField('objective_id', value)}
                  disabled={!currentSessionData.student_id || currentObjectives.length === 0}
                >
                  <SelectTrigger id="objective-select" className="w-full">
                    <SelectValue 
                      placeholder={currentObjectives.length === 0 ? "No objectives found" : "Select an objective"} 
                      className="w-full truncate pr-2"
                    />
                  </SelectTrigger>
                  <SelectContent 
                    className="max-h-[300px] overflow-y-auto w-[calc(100vw-80px)] max-w-[520px]"
                    side="bottom"
                    align="start"
                  >
                    {currentObjectives.map((objective) => (
                      <SelectItem 
                        key={objective.id} 
                        value={objective.id}
                        className="py-2 whitespace-normal break-words text-sm"
                      >
                        <div className="truncate w-full max-w-[450px]">{objective.description}</div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="text-sm text-muted-foreground p-2 border rounded bg-muted/10">
                  No objectives available for selected student. Please add objectives first.
                </div>
              )}
            </div>

            {/* Progress Section with Hierarchy */}
            {currentSelectedObjective && (
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
                        <p className="text-sm">{currentSelectedObjective?.subject_area?.name}</p>
                        <div className="pl-3 border-l-2 border-secondary/30 space-y-1.5">
                          <p className="text-sm">{currentSelectedObjective?.goal?.title}</p>
                          <div className="pl-3 border-l-2 border-primary/30">
                            <p className="text-sm font-medium">{currentSelectedObjective?.description}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Progress Input */}
                  <div className="pt-3 border-t space-y-2">
                    <Label className="text-sm">Record Progress</Label>
                    <div className="pl-3 border-l-2 border-primary/30 py-2">
                      {currentSelectedObjective?.objective_type === 'binary' ? (
                        <BinaryInput />
                      ) : (
                        <TrialInput />
                      )}
                    </div>
                  </div>
                  
                  {/* Memo Input */}
                  <div className="pt-3 border-t space-y-2">
                    <Label htmlFor={`memo-${currentSessionId}`} className="text-sm">Session Notes</Label>
                    <Textarea
                      id={`memo-${currentSessionId}`}
                      value={currentSessionData.memo || ''}
                      onChange={(e) => updateField('memo', e.target.value)}
                      placeholder="Add any additional notes about this session..."
                      className="resize-none min-h-[80px] text-sm"
                    />
                  </div>
                </CardContent>
              </Card>
            )}
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