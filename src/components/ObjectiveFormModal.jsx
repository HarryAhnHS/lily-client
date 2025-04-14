'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { authorizedFetch } from '@/services/api';
import { useAuth } from '@/app/context/auth-context';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

// Form schema for objective
const objectiveFormSchema = z.object({
  studentId: z.string({ 
    required_error: 'Please select a student.' 
  }).min(1, 'Please select a student.'),
  subjectArea: z.string({ 
    required_error: 'Please select a subject area.' 
  }).min(1, 'Please select a subject area.'),
  goal: z.string({ 
    required_error: 'Please select a goal.' 
  }).min(1, 'Please select a goal.'),
  objectiveDescription: z.string().min(10, {
    message: 'Objective description must be at least 10 characters.',
  }),
  objectiveType: z.enum(['binary', 'trial'], {
    required_error: 'Please select an objective type.',
  }),
  targetAccuracy: z.number().min(0).max(100).optional(),
  targetConsistencyTrials: z.number().int().positive({
    required_error: 'Please enter the number of consistency trials.',
  }),
  targetConsistencySuccesses: z.number().int().positive({
    required_error: 'Please enter the number of consistency successes.',
  }),
});

export function ObjectiveFormModal({ objective, onSuccess, students, open, onOpenChange, onStudentOpenChange, selectedStudentForEdit }) {
  const { session } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const [subjectAreas, setSubjectAreas] = useState([]);
  const [isLoadingSubjectAreas, setIsLoadingSubjectAreas] = useState(false);
  const [newSubjectArea, setNewSubjectArea] = useState('');
  const [isAddingSubjectArea, setIsAddingSubjectArea] = useState(false);
  const [isCreatingSubjectArea, setIsCreatingSubjectArea] = useState(false);

  const [goals, setGoals] = useState([]);
  const [isLoadingGoals, setIsLoadingGoals] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [isCreatingGoal, setIsCreatingGoal] = useState(false);
  const isEditing = !!objective;

  const form = useForm({
    resolver: zodResolver(objectiveFormSchema),
    defaultValues: {
      studentId: '',
      subjectArea: '',
      goal: '',
      objectiveDescription: '',
      objectiveType: 'binary',
      targetAccuracy: 0.8,
      targetConsistencyTrials: 4,
      targetConsistencySuccesses: 5
    }
  });

  // Reset form and populate with objective data when modal opens or objective changes
  useEffect(() => {
    if (open) {
      if (objective) {
        const student = students.find(s => s.id === objective.student_id);
        setSelectedStudent(student);
        form.reset({
          studentId: objective.student_id,
          subjectArea: objective.subject_area_id,
          goal: objective.goal_id,
          objectiveDescription: objective.description,
          objectiveType: objective.objective_type,
          targetAccuracy: objective.target_accuracy,
          targetConsistencyTrials: objective.target_consistency_trials,
          targetConsistencySuccesses: objective.target_consistency_successes
        });
      } else if (selectedStudentForEdit) {
        // If no objective but student is provided, preselect the student
        setSelectedStudent(selectedStudentForEdit);
        form.reset({
          studentId: selectedStudentForEdit.id,
          subjectArea: '',
          goal: '',
          objectiveDescription: '',
          objectiveType: 'binary',
          targetAccuracy: 0.8,
          targetConsistencyTrials: 4,
          targetConsistencySuccesses: 5
        });
      } else {
        setSelectedStudent(null);
        form.reset({
          studentId: '',
          subjectArea: '',
          goal: '',
          objectiveDescription: '',
          objectiveType: 'binary',
          targetAccuracy: 0.8,
          targetConsistencyTrials: 4,
          targetConsistencySuccesses: 5
        });
      }
    }
  }, [open, objective, form, students, selectedStudentForEdit]);

  console.log("selectedStudentForEdit", selectedStudentForEdit);

  // Fetch subject areas when modal opens
  useEffect(() => {
    if (open) {
      fetchSubjectAreas();
    }
  }, [open]);

  const fetchSubjectAreas = async () => {
    if (!session) return;
    
    setIsLoadingSubjectAreas(true);
    
    try {
      const response = await authorizedFetch('/subject-areas/subject-areas', session?.access_token, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch subject areas: ${response.status}`);
      }
      
      const data = await response.json();
      setSubjectAreas(data);
    } catch (error) {
      console.error('Error fetching subject areas:', error);
      toast.error('Failed to load subject areas. Please try again.');
    } finally {
      setIsLoadingSubjectAreas(false);
    }
  };

  // Update the useEffect for goals fetching
  useEffect(() => {
    const subjectId = form.watch('subjectArea');
    const studentId = form.watch('studentId');
    if (subjectId && studentId) {
      fetchGoals(studentId, subjectId);
    } else {
      setGoals([]);
    }
  }, [form.watch('subjectArea'), form.watch('studentId')]);

  const fetchGoals = async (studentId, subjectAreaId) => {
    if (!session || !subjectAreaId || !studentId) return;

    setIsLoadingGoals(true);
    try {
      const response = await authorizedFetch(
        `/goals/student/${studentId}/subject-area/${subjectAreaId}`, 
        session?.access_token
      );
      if (!response.ok) throw new Error('Failed to fetch goals');
      const data = await response.json();
      setGoals(data);
    } catch (err) {
      console.error('Error fetching goals:', err);
      toast.error('Failed to load goals');
    } finally {
      setIsLoadingGoals(false);
    }
  };

  const onSubmit = async (data) => {
    if (!session) return;
    
    // Additional validation to ensure all dropdowns are selected
    if (!data.studentId || !data.subjectArea || !data.goal || !data.objectiveType) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const url = isEditing 
        ? `/objectives/objective/${objective.id}`
        : '/objectives/objective';

      const payload = {
        student_id: data.studentId,
        goal_id: data.goal,
        subject_area_id: data.subjectArea,
        description: data.objectiveDescription,
        objective_type: data.objectiveType,
        target_accuracy: data.objectiveType === 'trial' && data.targetAccuracy ? data.targetAccuracy : 1,
        target_consistency_trials: data.targetConsistencyTrials,
        target_consistency_successes: data.targetConsistencySuccesses
      };

      const response = await authorizedFetch(url, session?.access_token, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to ${isEditing ? 'update' : 'create'} objective: ${response.status}`);
      }
      
      toast.success(`Objective ${isEditing ? 'updated' : 'added'} successfully`);
      form.reset();
      onOpenChange(false);   
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error(`Error ${isEditing ? 'updating' : 'creating'} objective:`, error);
      toast.error(`Failed to ${isEditing ? 'update' : 'add'} objective. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const handleAddSubjectArea = async () => {
    if (!newSubjectArea.trim() || !session) return;
    
    setIsCreatingSubjectArea(true);
    
    try {
      const response = await authorizedFetch('/subject-areas/subject-area', session?.access_token, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newSubjectArea.trim() }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create subject area: ${response.status}`);
      }
      
      const newArea = await response.json();
      // Fetch subject areas again to update the list
      await fetchSubjectAreas();
      form.setValue('subjectArea', newArea.id);
      setNewSubjectArea('');
      setIsAddingSubjectArea(false);


      toast.success('Subject area added successfully');
    } catch (error) {
      console.error('Error creating subject area:', error);
      toast.error('Failed to add subject area. Please try again.');
    } finally {
      setIsCreatingSubjectArea(false);
    }
  };

  const handleAddGoal = async () => {
    if (!newGoalTitle.trim() || !session) return;
    const studentId = form.getValues('studentId');
    const subjectAreaId = form.getValues('subjectArea');

    if (!studentId || !subjectAreaId) {
      toast.error('Please select both student and subject area first');
      return;
    }

    setIsCreatingGoal(true);
    try {
      const response = await authorizedFetch('/goals/goal', session.access_token, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: studentId,
          subject_area_id: subjectAreaId,
          title: newGoalTitle.trim()
        }),
      });

      if (!response.ok) throw new Error('Failed to create goal');
      const newGoal = await response.json();
      await fetchGoals(studentId, subjectAreaId);
      form.setValue('goal', newGoal.id);
      setNewGoalTitle('');
      setIsAddingGoal(false);
      toast.success('Goal added');
    } catch (err) {
      console.error('Error creating goal:', err);
      toast.error('Could not create goal');
    } finally {
      setIsCreatingGoal(false);
    }
  };
  

  const toggleStudentForm = () => {
    onOpenChange(false);
    onStudentOpenChange(true);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Plus className="h-4 w-4" />
          {isEditing ? 'Edit Objective' : 'Add Objective'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Objective' : 'Add New Objective'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update the learning objective.' : 'Create a new learning objective for a student.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="studentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Student <span className="text-red-500">*</span></FormLabel>
                    <div className="flex gap-2">
                      <Select 
                        onValueChange={(value) => {
                          field.onChange(value);
                          const student = students.find(s => s.id === value);
                          setSelectedStudent(student);
                          // Reset dependent fields
                          form.setValue('subjectArea', '');
                          form.setValue('goal', '');
                        }}
                        value={field.value}
                        disabled={isLoadingStudents}
                        className="flex-1"
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a student" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {students?.map((student) => (
                            <SelectItem key={`student-${student.id}`} value={student.id}>
                              {student.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={toggleStudentForm}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="subjectArea"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Subject Area
                      {selectedStudent && (
                        <span className="text-muted-foreground ml-1 text-sm">
                          for {selectedStudent.name}
                        </span>
                      )}
                    </FormLabel>
                    {isAddingSubjectArea ? (
                      <div className="flex gap-2">
                        <FormControl>
                          <Input
                            placeholder={selectedStudent 
                              ? `Add new subject area for ${selectedStudent.name}` 
                              : "Select a student first"}
                            value={newSubjectArea}
                            onChange={(e) => setNewSubjectArea(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddSubjectArea();
                              }
                            }}
                            disabled={!selectedStudent}
                          />
                        </FormControl>
                        <Button 
                          type="button" 
                          variant="outline"
                          onClick={handleAddSubjectArea}
                          disabled={isCreatingSubjectArea || !selectedStudent}
                        >
                          {isCreatingSubjectArea ? 'Adding...' : 'Add'}
                        </Button>
                        <Button 
                          type="button" 
                          variant="ghost"
                          onClick={() => {
                            setIsAddingSubjectArea(false);
                            setNewSubjectArea('');
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Select 
                          onValueChange={(value) => {
                            field.onChange(value);
                            form.setValue('goal', '');
                          }}
                          value={field.value}
                          className="flex-1"
                          disabled={isLoadingSubjectAreas || !selectedStudent}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue 
                                placeholder={
                                  !selectedStudent 
                                    ? "Select a student first" 
                                    : `Select a subject area for ${selectedStudent.name}`
                                } 
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {subjectAreas?.map((area) => (
                              <SelectItem key={`subject-${area.id}`} value={area.id}>
                                {area.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button 
                          type="button" 
                          variant="outline"
                          onClick={() => setIsAddingSubjectArea(true)}
                          disabled={!selectedStudent}
                          className="relative group"
                        >
                          <Plus className="h-4 w-4" />
                          {!selectedStudent && (
                            <span className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 whitespace-nowrap bg-black/80 text-white text-xs rounded px-2 py-1 hidden group-hover:block">
                              Select a student first
                            </span>
                          )}
                        </Button>
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Goal */}
              <FormField
                control={form.control}
                name="goal"
                render={({ field }) => {
                  const selectedSubjectArea = subjectAreas.find(
                    area => area.id === form.getValues('subjectArea')
                  );

                  return (
                    <FormItem>
                      <FormLabel>
                        Goal
                        {selectedSubjectArea && selectedStudent && (
                          <span className="text-muted-foreground ml-1 text-sm">
                            for {selectedSubjectArea.name} for {selectedStudent.name}
                          </span>
                        )}
                      </FormLabel>
                      {isAddingGoal ? (
                        <div className="flex gap-2">
                          <FormControl>
                            <Input
                              placeholder={selectedSubjectArea 
                                ? `Add new goal for ${selectedSubjectArea.name}` 
                                : "Select a subject area first"}
                              value={newGoalTitle}
                              onChange={(e) => setNewGoalTitle(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleAddGoal();
                                }
                              }}
                              disabled={!selectedSubjectArea}
                            />
                          </FormControl>
                          <Button
                            type="button"
                            onClick={handleAddGoal}
                            disabled={isCreatingGoal || !selectedSubjectArea}
                          >
                            {isCreatingGoal ? 'Adding...' : 'Add'}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => {
                              setIsAddingGoal(false);
                              setNewGoalTitle('');
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                            disabled={isLoadingGoals || !selectedSubjectArea}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue 
                                  placeholder={
                                    !selectedSubjectArea 
                                      ? "Select a subject area first" 
                                      : `Select a goal for ${selectedSubjectArea.name}`
                                  } 
                                />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {goals?.map((goal) => (
                                <SelectItem key={`goal-${goal.id}`} value={goal.id}>
                                  {goal.title}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsAddingGoal(true)}
                            disabled={!selectedSubjectArea}
                            className="relative group"
                          >
                            <Plus className="h-4 w-4" />
                            {!selectedSubjectArea && (
                              <span className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 whitespace-nowrap bg-black/80 text-white text-xs rounded px-2 py-1 hidden group-hover:block">
                                Select a subject area first
                              </span>
                            )}
                          </Button>
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />

              <FormField
                control={form.control}
                name="objectiveDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Objective</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe the specific objective in detail" 
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="objectiveType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Objective Type <span className="text-red-500">*</span></FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an objective type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="binary">Binary</SelectItem>
                        <SelectItem value="trial">Trial</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Binary: Simple yes/no or correct/incorrect outcomes. Trial: Multiple attempts with accuracy tracking.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {form.watch('objectiveType') === 'trial' && (
                <FormField
                  control={form.control}
                  name="targetAccuracy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Accuracy (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="1"
                          min="0"
                          max="100"
                          {...field}
                          value={field.value ? Math.round(field.value * 100) : ''}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === '') {
                              field.onChange('');
                            } else {
                              const percentage = parseFloat(value);
                              if (!isNaN(percentage)) {
                                field.onChange(percentage / 100);
                              }
                            }
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        The minimum accuracy percentage required for success (e.g., 80 for 80%).
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="targetConsistencyTrials"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Consistency Trials</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      Number of consecutive trials required to demonstrate consistency.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="targetConsistencySuccesses"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Consistency Successes</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      Number of successful trials required within the consistency period.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleCancel}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 
                  (isEditing ? 'Updating...' : 'Adding...') 
                : 
                  (isEditing ? 'Update Objective' : 'Add Objective')
                }
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 