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
import { Plus, User, BookOpen, Target, Check, Search, ArrowRight, ArrowLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

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

  // New state for search and step navigation
  const [studentSearch, setStudentSearch] = useState('');
  const [subjectSearch, setSubjectSearch] = useState('');
  const [goalSearch, setGoalSearch] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  
  // Add new state to track if we're adding in the footer
  const [isAddingInFooter, setIsAddingInFooter] = useState(false);
  
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
          targetConsistencySuccesses: objective.target_consistency_successes,
          targetConsistencyTrials: objective.target_consistency_trials,
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
          targetConsistencySuccesses: 4,
          targetConsistencyTrials: 5
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
          targetConsistencySuccesses: 5,
          targetConsistencyTrials: 4
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
        target_consistency_successes: data.targetConsistencySuccesses,
        target_consistency_trials: data.targetConsistencyTrials
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
      setIsAddingInFooter(false);

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
      setIsAddingInFooter(false);
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

  // Reset current step when modal opens
  useEffect(() => {
    if (open) {
      setCurrentStep(1);
    }
  }, [open]);
  
  const totalSteps = 4; // Student -> Subject -> Goal -> Details
  
  const handleNext = () => {
    // Validate current step before proceeding
    switch (currentStep) {
      case 1: // Validate student selection
        if (!form.getValues('studentId')) {
          toast.error('Please select a student first');
          return;
        }
        break;
      case 2: // Validate subject area
        if (!form.getValues('subjectArea')) {
          toast.error('Please select a subject area first');
          return;
        }
        break;
      case 3: // Validate goal
        if (!form.getValues('goal')) {
          toast.error('Please select a goal first');
          return;
        }
        break;
      default:
        break;
    }
    
    setCurrentStep(prev => Math.min(prev + 1, totalSteps));
  };
  
  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  // Helper function to get step title
  const getStepTitle = (step) => {
    switch (step) {
      case 1: return 'Select Student';
      case 2: return 'Select Subject Area';
      case 3: return 'Select Goal';
      case 4: return 'Define Objective';
      default: return '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] h-[800px] p-0 overflow-hidden flex flex-col gap-0">
        {/* Fixed Header - Step Title */}
        <DialogHeader className="p-6 pb-3 h-[100px] flex-shrink-0">
          <DialogTitle className="text-xl flex items-center justify-between">
            <span>{isEditing ? 'Edit Objective' : 'Add New Objective'}</span>
            <div className="text-sm font-normal text-muted-foreground">
              Step {currentStep} of {totalSteps}
            </div>
          </DialogTitle>
          <DialogDescription>
            {getStepTitle(currentStep)}
          </DialogDescription>
        </DialogHeader>
        
        {/* Main content wrapper - flex layout with header, scrollable content, and footer */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Main content area */}
          <div className="flex-1 overflow-hidden">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} id="main-form" className="h-full flex flex-col">
                <div className="px-6 h-full flex flex-col">
                  
                  {/* Step 1: Student Selection */}
                  {currentStep === 1 && (
                    <FormField
                      control={form.control}
                      name="studentId"
                      className="h-full flex flex-col"
                      render={({ field }) => (
                        <FormItem className="flex flex-col h-full">
                          {/* Fixed Search Area */}
                          <div className="flex-shrink-0 mb-3 space-y-3">
                            {/* Search bar for students */}
                            <div className="relative">
                              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                              <Input
                                placeholder="Search students..."
                                value={studentSearch}
                                onChange={(e) => setStudentSearch(e.target.value)}
                                className="pl-8 h-9"
                              />
                            </div>
                            
                            <FormMessage />
                          </div>
                          
                          {/* Scrollable Visual Selection */}
                          <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
                            <FormControl className="flex-1 overflow-hidden">
                              <div className="h-full overflow-y-auto pb-4">
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
                                  {students
                                    ?.filter(student => 
                                      student.name.toLowerCase().includes(studentSearch.toLowerCase())
                                    )
                                    .map((student) => (
                                      <div
                                        key={`student-card-${student.id}`}
                                        onClick={() => {
                                          field.onChange(student.id);
                                          setSelectedStudent(student);
                                          form.setValue('subjectArea', '');
                                          form.setValue('goal', '');
                                        }}
                                        className={cn(
                                          "cursor-pointer relative h-24 p-3 rounded-xl transition-all flex flex-col justify-center items-center gap-2 group overflow-hidden",
                                          field.value === student.id 
                                            ? "bg-gradient-to-br from-primary/20 to-primary/10 border-primary border shadow-md" 
                                            : "bg-gradient-to-br from-gray-50 to-white border-muted border hover:shadow-sm hover:border-primary/40"
                                        )}
                                      >
                                        <div className={cn(
                                          "rounded-full p-2 transition-all",
                                          field.value === student.id
                                            ? "bg-primary/20 text-primary"
                                            : "bg-gray-100 text-gray-600 group-hover:bg-primary/10 group-hover:text-primary"
                                        )}>
                                          <User className="h-5 w-5" />
                                        </div>
                                        <div className="font-medium text-center truncate w-full text-sm">
                                          {student.name}
                                        </div>
                                        {field.value === student.id && (
                                          <div className="absolute top-2 right-2 rounded-full bg-primary text-white p-0.5">
                                            <Check className="h-3 w-3" />
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  {/* Empty state when no students match search */}
                                  {students?.filter(student => 
                                    student.name.toLowerCase().includes(studentSearch.toLowerCase())
                                  ).length === 0 && (
                                    <div className="col-span-3 py-10 text-center text-muted-foreground">
                                      No students found matching your search
                                    </div>
                                  )}
                                </div>
                              </div>
                            </FormControl>
                          </div>
                          
                          {/* Fixed bottom button */}
                          <div className="flex-shrink-0 mt-3 p-3 border-t border-muted/50 flex items-center">
                            <div className="flex-1">
                              <span className="text-xs text-muted-foreground">Can't find the student?</span>
                            </div>
                            <Button 
                              type="button" 
                              size="sm"
                              onClick={toggleStudentForm}
                              className="flex items-center gap-1.5 rounded-full h-8 px-3 bg-primary/10 hover:bg-primary/20 text-primary border-none shadow-none"
                            >
                              <Plus className="h-3.5 w-3.5" /> 
                              <span>Add New Student</span>
                            </Button>
                          </div>
                        </FormItem>
                      )}
                    />
                  )}
                  
                  {/* Step 2: Subject Area Selection */}
                  {currentStep === 2 && (
                    <FormField
                      control={form.control}
                      name="subjectArea"
                      className="h-full flex flex-col"
                      render={({ field }) => (
                        <FormItem className="flex flex-col h-full">
                          {isAddingSubjectArea ? (
                            <div className="flex gap-2">
                              <FormControl>
                                <Input
                                  placeholder={`Add new subject area for ${selectedStudent?.name}`}
                                  value={newSubjectArea}
                                  onChange={(e) => setNewSubjectArea(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      handleAddSubjectArea();
                                    }
                                  }}
                                  className="h-9"
                                />
                              </FormControl>
                              <Button 
                                type="button" 
                                variant="outline"
                                onClick={handleAddSubjectArea}
                                disabled={isCreatingSubjectArea}
                                className="whitespace-nowrap"
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
                            <>
                              {/* Fixed Search Area */}
                              <div className="flex-shrink-0 mb-3 space-y-3">
                                <div className="relative">
                                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                  <Input
                                    placeholder="Search subject areas..."
                                    value={subjectSearch}
                                    onChange={(e) => setSubjectSearch(e.target.value)}
                                    className="pl-8 h-9"
                                  />
                                </div>
                                
                                <FormMessage />
                              </div>
                              
                              {/* Scrollable Visual Selection */}
                              <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
                                <FormControl className="flex-1 overflow-hidden">
                                  <div className="h-full overflow-y-auto pb-4">
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
                                      {subjectAreas
                                        ?.filter(area => 
                                          area.name.toLowerCase().includes(subjectSearch.toLowerCase())
                                        )
                                        .map((area) => (
                                          <div
                                            key={`subject-card-${area.id}`}
                                            onClick={() => {
                                              field.onChange(area.id);
                                              form.setValue('goal', '');
                                            }}
                                            className={cn(
                                              "cursor-pointer relative h-24 p-3 rounded-xl transition-all flex flex-col justify-center items-center gap-2 group overflow-hidden",
                                              field.value === area.id 
                                                ? "bg-gradient-to-br from-blue-100 to-blue-50 border-blue-400 border shadow-md" 
                                                : "bg-gradient-to-br from-gray-50 to-white border-muted border hover:shadow-sm hover:border-blue-300"
                                            )}
                                          >
                                            <div className={cn(
                                              "rounded-full p-2 transition-all",
                                              field.value === area.id
                                                ? "bg-blue-200 text-blue-700"
                                                : "bg-gray-100 text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-600"
                                            )}>
                                              <BookOpen className="h-5 w-5" />
                                            </div>
                                            <div className="font-medium text-center truncate w-full text-sm">
                                              {area.name}
                                            </div>
                                            {field.value === area.id && (
                                              <div className="absolute top-2 right-2 rounded-full bg-blue-500 text-white p-0.5">
                                                <Check className="h-3 w-3" />
                                              </div>
                                            )}
                                          </div>
                                        ))}
                                      {/* Empty state */}
                                      {subjectAreas?.filter(area => 
                                        area.name.toLowerCase().includes(subjectSearch.toLowerCase())
                                      ).length === 0 && (
                                        <div className="col-span-3 py-10 text-center text-muted-foreground">
                                          No subject areas found matching your search
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </FormControl>
                              </div>
                              
                              {/* Fixed bottom button */}
                              <div className="flex-shrink-0 mt-3 p-3 border-t border-muted/50 flex items-center">
                                <div className="flex-1">
                                  <span className="text-xs text-muted-foreground">Need a new subject area?</span>
                                </div>
                                <Button 
                                  type="button" 
                                  size="sm"
                                  onClick={() => setIsAddingInFooter(true)}
                                  className="flex items-center gap-1.5 rounded-full h-8 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 border-none shadow-none"
                                >
                                  <Plus className="h-3.5 w-3.5" /> 
                                  <span>Add Subject Area</span>
                                </Button>
                              </div>
                            </>
                          )}
                        </FormItem>
                      )}
                    />
                  )}
                  
                  {/* Step 3: Goal Selection */}
                  {currentStep === 3 && (
                    <FormField
                      control={form.control}
                      name="goal"
                      className="h-full flex flex-col"
                      render={({ field }) => {
                        const selectedSubjectArea = subjectAreas.find(
                          area => area.id === form.getValues('subjectArea')
                        );

                        return (
                          <FormItem className="flex flex-col h-full">
                            {isAddingGoal ? (
                              <div className="flex gap-2">
                                <FormControl>
                                  <Input
                                    placeholder={`Add new goal for ${selectedSubjectArea?.name}`}
                                    value={newGoalTitle}
                                    onChange={(e) => setNewGoalTitle(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleAddGoal();
                                      }
                                    }}
                                    className="h-9"
                                  />
                                </FormControl>
                                <Button
                                  type="button"
                                  onClick={handleAddGoal}
                                  disabled={isCreatingGoal}
                                  className="whitespace-nowrap"
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
                              <>
                                {/* Fixed Search Area */}
                                <div className="flex-shrink-0 mb-3 space-y-3">
                                  <div className="relative">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                      placeholder="Search goals..."
                                      value={goalSearch}
                                      onChange={(e) => setGoalSearch(e.target.value)}
                                      className="pl-8 h-9"
                                    />
                                  </div>
                                  
                                  <FormMessage />
                                </div>
                                
                                {/* Scrollable Visual Selection */}
                                <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
                                  <FormControl className="flex-1 overflow-hidden">
                                    <div className="h-full overflow-y-auto pb-4">
                                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
                                        {goals
                                          ?.filter(goal => 
                                            goal.title.toLowerCase().includes(goalSearch.toLowerCase())
                                          )
                                          .map((goal) => (
                                            <div
                                              key={`goal-card-${goal.id}`}
                                              onClick={() => field.onChange(goal.id)}
                                              className={cn(
                                                "cursor-pointer relative h-24 p-3 rounded-xl transition-all flex flex-col justify-center items-center gap-2 group overflow-hidden",
                                                field.value === goal.id 
                                                  ? "bg-gradient-to-br from-green-100 to-green-50 border-green-400 border shadow-md" 
                                                  : "bg-gradient-to-br from-gray-50 to-white border-muted border hover:shadow-sm hover:border-green-300"
                                              )}
                                            >
                                              <div className={cn(
                                                "rounded-full p-2 transition-all",
                                                field.value === goal.id
                                                  ? "bg-green-200 text-green-700"
                                                  : "bg-gray-100 text-gray-600 group-hover:bg-green-100 group-hover:text-green-600"
                                              )}>
                                                <Target className="h-5 w-5" />
                                              </div>
                                              <div className="font-medium text-center truncate w-full text-sm">
                                                {goal.title}
                                              </div>
                                              {field.value === goal.id && (
                                                <div className="absolute top-2 right-2 rounded-full bg-green-500 text-white p-0.5">
                                                  <Check className="h-3 w-3" />
                                                </div>
                                              )}
                                            </div>
                                          ))}
                                        {isLoadingGoals && (
                                          <div className="col-span-3 py-10 text-center text-muted-foreground">
                                            Loading goals...
                                          </div>
                                        )}
                                        {!isLoadingGoals && goals?.filter(goal => 
                                          goal.title.toLowerCase().includes(goalSearch.toLowerCase())
                                        ).length === 0 && (
                                          <div className="col-span-3 py-10 text-center text-muted-foreground">
                                            No goals found matching your search
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </FormControl>
                                </div>
                                
                                {/* Fixed bottom button */}
                                <div className="flex-shrink-0 mt-3 p-3 border-t border-muted/50 flex items-center">
                                  <div className="flex-1">
                                    <span className="text-xs text-muted-foreground">Need a new goal?</span>
                                  </div>
                                  <Button 
                                    type="button" 
                                    size="sm"
                                    onClick={() => setIsAddingInFooter(true)}
                                    className="flex items-center gap-1.5 rounded-full h-8 px-3 bg-green-50 hover:bg-green-100 text-green-700 border-none shadow-none"
                                  >
                                    <Plus className="h-3.5 w-3.5" /> 
                                    <span>Add Goal</span>
                                  </Button>
                                </div>
                              </>
                            )}
                          </FormItem>
                        );
                      }}
                    />
                  )}
                  
                  {/* Step 4: Objective Details - Scrollable content */}
                  {currentStep === 4 && (
                    <div className="h-full flex flex-col">
                      <div className="flex-1 overflow-y-auto pb-4">
                        <div className="space-y-6">
                          {/* Instructions */}
                          <div className="bg-muted/30 rounded-lg p-4 border border-muted">
                            <h3 className="font-medium mb-2 flex items-center gap-2">
                              <span className="text-primary bg-primary/10 rounded-full p-1">
                                <Target className="h-4 w-4" />
                              </span>
                              Define Your Objective
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              Describe the specific learning objective in detail and set the measurement criteria.
                            </p>
                          </div>
                          
                          <FormField
                            control={form.control}
                            name="objectiveDescription"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-base">Objective Description <span className="text-red-500">*</span></FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="Describe the specific objective in detail" 
                                    className="min-h-[80px] resize-y"
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
                                <FormLabel className="text-base">Objective Type <span className="text-red-500">*</span></FormLabel>
                                <div className="grid grid-cols-2 gap-3">
                                  <div
                                    className={cn(
                                      "cursor-pointer rounded-lg border p-4 transition-all relative overflow-hidden",
                                      field.value === 'binary'
                                        ? "border-primary bg-primary/5 shadow-sm"
                                        : "hover:border-primary/50 hover:bg-primary/5"
                                    )}
                                    onClick={() => field.onChange('binary')}
                                  >
                                    {field.value === 'binary' && (
                                      <div className="absolute top-0 right-0 w-0 h-0 border-t-[30px] border-r-[30px] border-t-primary border-r-transparent" />
                                    )}
                                    <div className="font-medium mb-1 flex items-center gap-2">
                                      <div className={cn(
                                        "rounded-full p-1.5",
                                        field.value === 'binary' ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                                      )}>
                                        <Check className="h-4 w-4" />
                                      </div>
                                      Binary
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      Simple yes/no or correct/incorrect outcomes
                                    </div>
                                  </div>
                                  <div
                                    className={cn(
                                      "cursor-pointer rounded-lg border p-4 transition-all relative overflow-hidden",
                                      field.value === 'trial'
                                        ? "border-primary bg-primary/5 shadow-sm"
                                        : "hover:border-primary/50 hover:bg-primary/5"
                                    )}
                                    onClick={() => field.onChange('trial')}
                                  >
                                    {field.value === 'trial' && (
                                      <div className="absolute top-0 right-0 w-0 h-0 border-t-[30px] border-r-[30px] border-t-primary border-r-transparent" />
                                    )}
                                    <div className="font-medium mb-1 flex items-center gap-2">
                                      <div className={cn(
                                        "rounded-full p-1.5",
                                        field.value === 'trial' ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                                      )}>
                                        <Target className="h-4 w-4" />
                                      </div>
                                      Trial
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      Multiple attempts with accuracy tracking
                                    </div>
                                  </div>
                                </div>
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
                                  <FormLabel className="text-base">Target Accuracy (%)</FormLabel>
                                  <FormControl>
                                    <div className="relative">
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
                                        className="h-9 pr-8"
                                      />
                                      <div className="absolute right-3 top-2 text-muted-foreground">%</div>
                                    </div>
                                  </FormControl>
                                  <FormDescription className="text-sm">
                                    The minimum accuracy percentage required for success
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          )}

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="targetConsistencySuccesses"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-base">Successful Trials <span className="text-red-500">*</span></FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      min="1"
                                      {...field}
                                      value={field.value ?? ''}
                                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                                      className="h-9"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="targetConsistencyTrials"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-base">Total Trials <span className="text-red-500">*</span></FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      min="1"
                                      {...field}
                                      value={field.value ?? ''}
                                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                                      className="h-9"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </form>
            </Form>
          </div>
          
          {/* Fixed bottom bar - outside the scrollable area */}
          <div className="h-[120px] border-t px-6 py-3 bg-gradient-to-r from-muted/80 to-muted flex flex-col justify-center flex-shrink-0">
            {isAddingInFooter && currentStep === 2 ? (
              <div className="flex flex-col gap-2">
                <div className="text-sm font-medium flex items-center gap-1.5 text-blue-700">
                  <BookOpen className="h-4 w-4" />
                  <span>Add New Subject Area</span>
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder={`Add new subject area for ${selectedStudent?.name}`}
                    value={newSubjectArea}
                    onChange={(e) => setNewSubjectArea(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSubjectArea();
                      }
                    }}
                    className="h-9 flex-1"
                    autoFocus
                  />
                  <Button 
                    type="button" 
                    size="sm"
                    onClick={handleAddSubjectArea}
                    disabled={isCreatingSubjectArea}
                    className="whitespace-nowrap bg-blue-500 hover:bg-blue-600"
                  >
                    {isCreatingSubjectArea ? 'Adding...' : 'Add'}
                  </Button>
                  <Button 
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsAddingInFooter(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : isAddingInFooter && currentStep === 3 ? (
              <div className="flex flex-col gap-2">
                <div className="text-sm font-medium flex items-center gap-1.5 text-green-700">
                  <Target className="h-4 w-4" />
                  <span>Add New Goal</span>
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder={`Add new goal for ${subjectAreas.find(a => a.id === form.watch('subjectArea'))?.name}`}
                    value={newGoalTitle}
                    onChange={(e) => setNewGoalTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddGoal();
                      }
                    }}
                    className="h-9 flex-1"
                    autoFocus
                  />
                  <Button 
                    type="button" 
                    size="sm"
                    onClick={handleAddGoal}
                    disabled={isCreatingGoal}
                    className="whitespace-nowrap bg-green-500 hover:bg-green-600"
                  >
                    {isCreatingGoal ? 'Adding...' : 'Add'}
                  </Button>
                  <Button 
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsAddingInFooter(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {/* Selection path */}
                <div className="flex items-center gap-1.5">
                  <div className="text-xs text-muted-foreground mr-1">Selected:</div>
                  
                  <div className="flex items-center py-4">
                    {selectedStudent ? (
                      <button
                        type="button"
                        onClick={() => setCurrentStep(1)}
                        className="flex items-center gap-1.5 bg-primary/10 text-primary text-sm px-3 py-1 rounded-full font-medium hover:bg-primary/20 transition-colors"
                      >
                        <User className="h-3.5 w-3.5" />
                        <span>{selectedStudent.name}</span>
                      </button>
                    ) : (
                      <div className="text-xs text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
                        No student selected
                      </div>
                    )}
                    
                    {(selectedStudent && form.watch('subjectArea')) && (
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground mx-1" />
                    )}
                    
                    {form.watch('subjectArea') && (
                      <button
                        type="button"
                        onClick={() => setCurrentStep(2)}
                        className="flex items-center gap-1.5 bg-blue-50 text-blue-700 text-sm px-3 py-1 rounded-full font-medium border border-blue-100 hover:bg-blue-100 transition-colors"
                      >
                        <BookOpen className="h-3.5 w-3.5" />
                        <span>{subjectAreas.find(a => a.id === form.watch('subjectArea'))?.name}</span>
                      </button>
                    )}
                    
                    {(form.watch('subjectArea') && form.watch('goal')) && (
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground mx-1" />
                    )}
                    
                    {form.watch('goal') && (
                      <button
                        type="button"
                        onClick={() => setCurrentStep(3)}
                        className="flex items-center gap-1.5 bg-green-50 text-green-700 text-sm px-3 py-1 rounded-full font-medium border border-green-100 hover:bg-green-100 transition-colors"
                      >
                        <Target className="h-3.5 w-3.5" />
                        <span>{goals.find(g => g.id === form.watch('goal'))?.title}</span>
                      </button>
                    )}
                    
                    {(isEditing || (currentStep === 4 && form.watch('objectiveDescription')?.length >= 10)) && (
                      <>
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground mx-1" />
                        <button
                          type="button"
                          onClick={() => setCurrentStep(4)}
                          className="flex items-center gap-1.5 bg-purple-50 text-purple-700 text-sm px-3 py-1 rounded-full font-medium border border-purple-100 hover:bg-purple-100 transition-colors"
                        >
                          <Target className="h-3.5 w-3.5" />
                          <span>Objective Details</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
                
                {/* Navigation buttons */}
                <div className="flex justify-between">
                  <div>
                    {currentStep > 1 && (
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={handleBack}
                        className="flex items-center gap-1"
                        size="sm"
                      >
                        <ArrowLeft className="h-4 w-4" /> Back
                      </Button>
                    )}
                  </div>
                  <div>
                    {currentStep < totalSteps ? (
                      <Button 
                        type="button" 
                        onClick={handleNext}
                        className="flex items-center gap-1"
                        size="sm"
                      >
                        Next <ArrowRight className="h-4 w-4" />
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={handleCancel}
                          size="sm"
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit" 
                          form="main-form"
                          disabled={isSubmitting}
                          size="sm"
                        >
                          {isSubmitting ? 
                            (isEditing ? 'Updating...' : 'Adding...') 
                          : 
                            (isEditing ? 'Update Objective' : 'Add Objective')
                          }
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}