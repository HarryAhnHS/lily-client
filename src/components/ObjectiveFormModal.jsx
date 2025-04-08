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
import { StudentFormModal } from './StudentFormModal';

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

// Mock subject areas - replace with API call in production
const defaultSubjectAreas = [
  { id: '1', name: 'Mathematics' },
  { id: '2', name: 'Reading' },
  { id: '3', name: 'Writing' },
  { id: '4', name: 'Science' },
  { id: '5', name: 'Social Studies' },
];

export function ObjectiveFormModal({ onSuccess, students, open, setOpen }) {
  const { session } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [subjectAreas, setSubjectAreas] = useState(defaultSubjectAreas);
  const [newSubjectArea, setNewSubjectArea] = useState('');
  const [isAddingSubjectArea, setIsAddingSubjectArea] = useState(false);

  const form = useForm({
    resolver: zodResolver(objectiveFormSchema),
    defaultValues: {
      studentId: '',
      subjectArea: '',
      objectiveDescription: '',
    }
  });

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      form.reset();
    }
  }, [open, form]);

  const onSubmit = async (data) => {
    if (!session) return;
    
    setIsSubmitting(true);
    
    try {
      const response = await authorizedFetch('/objectives', session?.access_token, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create objective: ${response.status}`);
      }
      
      toast.success('Objective added successfully');
      form.reset();
      setOpen(false);
      
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
    setOpen(false);
  };

  const handleAddSubjectArea = () => {
    if (!newSubjectArea.trim()) return;
    
    const newId = (subjectAreas.length + 1).toString();
    const newArea = { id: newId, name: newSubjectArea.trim() };
    
    setSubjectAreas([...subjectAreas, newArea]);
    form.setValue('subjectArea', newId);
    setNewSubjectArea('');
    setIsAddingSubjectArea(false);
  };

  const handleStudentAdded = () => {
    setShowStudentForm(false);
    // Refresh the students list
    if (onSuccess) {
      onSuccess();
    }
    // Reopen the objective form
    setOpen(true);
  };

  if (showStudentForm) {
    return (
      <StudentFormModal 
        onSuccess={handleStudentAdded} 
        onCancel={handleCancel}
        onOpenChange={setOpen}
      />
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Plus className="mr-2 h-4 w-4" />
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
                          {students.map((student) => (
                            <SelectItem key={student.id} value={student.id}>
                              {student.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => setShowStudentForm(true)}
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
                        >
                          Add
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
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a subject area" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {subjectAreas.map((area) => (
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