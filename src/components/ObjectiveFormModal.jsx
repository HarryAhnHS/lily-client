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
      targetConsistencyTrials: 5,
      targetConsistencySuccesses: 4
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

  // Fetch subject areas when modal opens or student changes
  useEffect(() => {
    if (open && selectedStudent) {
      fetchSubjectAreas();
    }
  }, [open, selectedStudent]);

  const fetchSubjectAreas = async () => {
    if (!session || !selectedStudent) return;
    
    setIsLoadingSubjectAreas(true);
    
    try {
      // First fetch all subject areas for the student
      const response = await authorizedFetch(
        `/subject-areas/subject-areas`, 
        session?.access_token
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch subject areas: ${response.status}`);
      }
      
      const allSubjectAreas = await response.json();

      // Then fetch student objectives to find which areas have objectives
      const objectivesResponse = await authorizedFetch(
        `/objectives/student/${selectedStudent.id}`,
        session?.access_token
      );

      if (!objectivesResponse.ok) {
        throw new Error(`Failed to fetch student objectives: ${objectivesResponse.status}`);
      }

      const studentObjectives = await objectivesResponse.json();
      
      // Get unique subject area IDs from student's objectives
      const studentSubjectAreaIds = new Set();
      studentObjectives.forEach(objective => {
        studentSubjectAreaIds.add(objective.subject_area_id);
      });
      
      // Filter subject areas to only those that have objectives for this student
      const relevantAreas = allSubjectAreas.filter(area => 
        studentSubjectAreaIds.has(area.id)
      );
      
      setSubjectAreas(relevantAreas);
    } catch (error) {
      console.error('Error fetching subject areas:', error);
      toast.error('Failed to load areas of need. Please try again.');
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
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle className="text-gray-900">
            {isEditing ? 'Edit Objective' : 'Add New Objective'}
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            {isEditing ? 'Update the objective details below.' : 'Fill in the objective details below.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="studentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-900">Student <span className="text-red-500">*</span></FormLabel>
                  <Select
                    disabled={isEditing || !!selectedStudentForEdit}
                    onValueChange={(value) => {
                      field.onChange(value);
                      const student = students.find(s => s.id === value);
                      setSelectedStudent(student);
                      // Reset dependent fields
                      form.setValue('subjectArea', '');
                      form.setValue('goal', '');
                    }}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                        <SelectValue placeholder="Select a student" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-white border border-gray-300 shadow-md">
                      {students.map((student) => (
                        <SelectItem 
                          key={student.id} 
                          value={student.id}
                          className="text-gray-900 hover:bg-gray-100 focus:bg-gray-100 focus:text-gray-900"
                        >
                          {student.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="subjectArea"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-900">Area of Need <span className="text-red-500">*</span></FormLabel>
                  <Select
                    disabled={!selectedStudent || isLoadingSubjectAreas}
                    onValueChange={(value) => {
                      field.onChange(value);
                      form.setValue('goal', '');
                    }}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                        <SelectValue placeholder={
                          isLoadingSubjectAreas 
                            ? "Loading..." 
                            : !selectedStudent 
                            ? "Select a student first"
                            : "Select an area of need"
                        } />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-white border border-gray-300 shadow-md">
                      {subjectAreas.map((area) => (
                        <SelectItem 
                          key={area.id} 
                          value={area.id}
                          className="text-gray-900 hover:bg-gray-100 focus:bg-gray-100 focus:text-gray-900"
                        >
                          {area.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                    <FormLabel className="text-gray-900">
                      Goal
                      {selectedSubjectArea && selectedStudent && (
                        <span className="text-gray-500 ml-1 text-sm">
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
                            className="border-gray-300 text-gray-900"
                          />
                        </FormControl>
                        <Button
                          type="button"
                          onClick={handleAddGoal}
                          disabled={isCreatingGoal || !selectedSubjectArea}
                          className="bg-black text-white hover:bg-gray-800"
                        >
                          {isCreatingGoal ? 'Adding...' : 'Add'}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setIsAddingGoal(false);
                            setNewGoalTitle('');
                          }}
                          className="border-gray-300"
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
                            <SelectTrigger className="bg-white border-gray-300 text-gray-900 w-full">
                              <SelectValue 
                                placeholder={
                                  !selectedSubjectArea 
                                    ? "Select a subject area first" 
                                    : `Select a goal for ${selectedSubjectArea.name}`
                                } 
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="max-w-[500px] bg-white">
                            {goals?.map((goal) => (
                              <SelectItem 
                                key={`goal-${goal.id}`} 
                                value={goal.id}
                                className="text-gray-900 break-normal whitespace-normal"
                              >
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
                          className="border-gray-300"
                        >
                          <Plus className="h-4 w-4" />
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
                  <FormLabel className="text-gray-900">Objective</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe the specific objective in detail" 
                      className="min-h-[100px] border-gray-300 text-gray-900"
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
                  <FormLabel className="text-gray-900">Objective Type <span className="text-red-500">*</span></FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                        <SelectValue placeholder="Select an objective type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-white">
                      <SelectItem value="binary" className="text-gray-900 hover:bg-gray-100">Binary</SelectItem>
                      <SelectItem value="trial" className="text-gray-900 hover:bg-gray-100">Trial</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription className="text-gray-600">
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
                    <FormLabel className="text-gray-900">Target Accuracy (%)</FormLabel>
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
                        className="border-gray-300 text-gray-900"
                      />
                    </FormControl>
                    <FormDescription className="text-gray-600">
                      The minimum accuracy percentage required for success (e.g., 80 for 80%).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="targetConsistencySuccesses"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-900">Consistency Successes</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      {...field}
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                      className="border-gray-300 text-gray-900"
                    />
                  </FormControl>
                  <FormDescription className="text-gray-600">
                    Number of successful trials required within the consistency period.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="targetConsistencyTrials"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-900">Consistency Trials</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      {...field}
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                      className="border-gray-300 text-gray-900"
                    />
                  </FormControl>
                  <FormDescription className="text-gray-600">
                    Number of consecutive trials required to demonstrate consistency.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-4 sm:gap-2">
              <Button
                type="button"
                variant="default"
                onClick={handleCancel}
                className="bg-black text-white hover:bg-gray-800 border-none ml-auto"
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={isSubmitting}
                className="bg-black text-white hover:bg-gray-800"
              >
                {isSubmitting ? (
                  'Saving...'
                ) : isEditing ? (
                  'Save Changes'
                ) : (
                  'Add Objective'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 