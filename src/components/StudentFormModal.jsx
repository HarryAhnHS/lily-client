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
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

// Form schema for student
const studentFormSchema = z.object({
  name: z.string().min(2, {
    message: 'Name must be at least 2 characters.',
  }),
  grade_level: z.coerce.number().int().min(1).max(12, {
    message: 'Grade must be between 1 and 12.',
  }),
  disability_type: z.string().optional(),
});

export function StudentFormModal({ student, onSuccess, open, onOpenChange }) {
  const { session } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!student;

  const form = useForm({
    resolver: zodResolver(studentFormSchema),
    defaultValues: {
      name: '',
      grade_level: '',
      disability_type: '',
    }
  });

  // Reset form and populate with student data when modal opens or student changes
  useEffect(() => {
    if (open) {
      if (student) {
        form.reset({
          name: student.name,
          grade_level: student.grade_level,
          disability_type: student.disability_type || '',
        });
      } else {
        form.reset({
          name: '',
          grade_level: '',
          disability_type: '',
        });
      }
    }
  }, [open, student, form]);

  const onSubmit = async (data) => {
    if (!session) return;
    
    setIsSubmitting(true);
    
    try {
      const url = isEditing 
        ? `/students/student/${student.id}`
        : '/students/student';
      
      const response = await authorizedFetch(url, session?.access_token, {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to ${isEditing ? 'update' : 'create'} student: ${response.status}`);
      }
      
      toast.success(`Student ${isEditing ? 'updated' : 'added'} successfully`);
      form.reset();
      onOpenChange(false);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error(`Error ${isEditing ? 'updating' : 'creating'} student:`, error);
      toast.error(`Failed to ${isEditing ? 'update' : 'add'} student. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Student' : 'Add New Student'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update the student\'s information.' : 'Enter the student\'s information.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Student Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter student name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="grade_level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Grade Level</FormLabel>
                    <Select 
                      onValueChange={(val) => field.onChange(parseInt(val))} 
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select grade level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Array.from({ length: 12 }, (_, i) => (
                          <SelectItem key={i + 1} value={(i + 1).toString()}>
                            Grade {i + 1}
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
                name="disability_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Disability Type (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., ADHD, Dyslexia" {...field} />
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
                {isSubmitting ? (isEditing ? 'Updating...' : 'Adding...') : (isEditing ? 'Update Student' : 'Add Student')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 