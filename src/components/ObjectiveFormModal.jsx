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
    required_error: 'Please select a student.',
  }),
  subjectArea: z.string({
    required_error: 'Please select or enter a subject area.',
  }),
  objectiveDescription: z.string().min(10, {
    message: 'Objective description must be at least 10 characters.',
  }),
});

export function ObjectiveFormModal({ onSuccess, students, open, onOpenChange, onStudentOpenChange }) {
  const { session } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [subjectAreas, setSubjectAreas] = useState([]);
  const [isLoadingSubjectAreas, setIsLoadingSubjectAreas] = useState(false);
  const [newSubjectArea, setNewSubjectArea] = useState('');
  const [isAddingSubjectArea, setIsAddingSubjectArea] = useState(false);
  const [isCreatingSubjectArea, setIsCreatingSubjectArea] = useState(false);

  const form = useForm({
    resolver: zodResolver(objectiveFormSchema),
    defaultValues: {
      studentId: '',
      subjectArea: '',
      objectiveDescription: '',
    }
  });

  // Fetch subject areas when modal opens
  useEffect(() => {
    if (open) {
      fetchSubjectAreas();
    }
  }, [open]);

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      form.reset();
    }
  }, [open, form]);

  const fetchSubjectAreas = async () => {
    if (!session) return;
    
    setIsLoadingSubjectAreas(true);
    
    try {
      const response = await authorizedFetch('/objectives/subject-areas', session?.access_token, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch subject areas: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("subject areas", data);
      setSubjectAreas(data);
    } catch (error) {
      console.error('Error fetching subject areas:', error);
      toast.error('Failed to load subject areas. Please try again.');
    } finally {
      setIsLoadingSubjectAreas(false);
    }
  };

  const onSubmit = async (data) => {
    if (!session) return;
    
    setIsSubmitting(true);
    
    try {
      const response = await authorizedFetch('/objectives/objective', session?.access_token, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          student_id: data.studentId,
          subject_area_id: data.subjectArea,
          description: data.objectiveDescription
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create objective: ${response.status}`);
      }
      
      toast.success('Objective added successfully');
      form.reset();
      onOpenChange(false);   
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error creating objective:', error);
      toast.error('Failed to add objective. Please try again.');
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
      const response = await authorizedFetch('/objectives/subject-area', session?.access_token, {
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
      setSubjectAreas([...subjectAreas, newArea]);
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

  const toggleStudentForm = () => {
    onOpenChange(false);
    onStudentOpenChange(true);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Plus className="h-4 w-4" />
          Add Objective
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Objective</DialogTitle>
          <DialogDescription>
            Create a new learning objective for a student.
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
                    <FormLabel>Student</FormLabel>
                    <div className="flex gap-2">
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        disabled={isLoadingStudents}
                        className="flex-1"
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a student" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {students && students.map((student) => (
                            <SelectItem key={student.id} value={student.id}>
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
                    <FormLabel>Subject Area</FormLabel>
                    {isAddingSubjectArea ? (
                      <div className="flex gap-2">
                        <FormControl>
                          <Input
                            placeholder="Enter new subject area"
                            value={newSubjectArea}
                            onChange={(e) => setNewSubjectArea(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddSubjectArea();
                              }
                            }}
                          />
                        </FormControl>
                        <Button 
                          type="button" 
                          variant="outline"
                          onClick={handleAddSubjectArea}
                          disabled={isCreatingSubjectArea}
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
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                          className="flex-1"
                          disabled={isLoadingSubjectAreas}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a subject area" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {subjectAreas && subjectAreas.map((area) => (
                              <SelectItem key={area.id} value={area.id}>
                                {area.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button 
                          type="button" 
                          variant="outline"
                          onClick={() => setIsAddingSubjectArea(true)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="objectiveDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Objective Description</FormLabel>
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
                {isSubmitting ? 'Adding...' : 'Add Objective'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 