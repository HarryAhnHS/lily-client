'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const sessionFormSchema = z.object({
  date: z.date({
    required_error: "A date is required",
  }),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: "Please enter a valid time in HH:MM format",
  }),
  objective_id: z.string({
    required_error: "Please select an objective",
  }),
  memo: z.string().optional(),
  trials_completed: z.number().int().min(0),
  trials_total: z.number().int().min(0),
});

export function SessionFormModal({ session, open, onOpenChange, onSuccess }) {
  const { session: authSession } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [objectives, setObjectives] = useState([]);
  const [isLoadingObjectives, setIsLoadingObjectives] = useState(false);
  const [selectedObjectiveType, setSelectedObjectiveType] = useState('binary');

  const form = useForm({
    resolver: zodResolver(sessionFormSchema),
    defaultValues: {
      date: new Date(),
      time: '12:00',
      objective_id: '',
      memo: '',
      trials_completed: 0,
      trials_total: 1,
    },
  });

  // Fetch objectives when the modal opens
  useEffect(() => {
    if (session && open) {
      fetchObjectives(session.student.id);
    }
  }, [session, open]);

  const fetchObjectives = async (studentId) => {
    if (!authSession) return;
    
    setIsLoadingObjectives(true);
    try {
      const response = await authorizedFetch(
        `/objectives/student/${studentId}`,
        authSession.access_token
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch objectives');
      }
      
      const data = await response.json();
      setObjectives(data);
    } catch (error) {
      console.error('Error fetching objectives:', error);
      toast.error('Failed to load objectives');
    } finally {
      setIsLoadingObjectives(false);
    }
  };

  // Reset form when session changes
  useEffect(() => {
    if (session && open) {
      const date = new Date(session.created_at);
      form.reset({
        date: date,
        time: format(date, 'HH:mm'),
        objective_id: session.objective.id,
        memo: session.memo || '',
        trials_completed: session.objective_progress.trials_completed,
        trials_total: session.objective_progress.trials_total,
      });
      setSelectedObjectiveType(session.objective.objective_type);
    }
  }, [session, open, form]);

  const onSubmit = async (data) => {
    if (!authSession || !session) return;
    
    setIsSubmitting(true);
    try {
      const datetime = new Date(data.date);
      const [hours, minutes] = data.time.split(':');
      datetime.setHours(parseInt(hours, 10), parseInt(minutes, 10));

      const payload = {
        student_id: session.student.id,
        objective_id: data.objective_id,
        memo: data.memo,
        created_at: datetime.toISOString(),
        objective_progress: {
          trials_completed: data.trials_completed,
          trials_total: data.trials_total,
        },
      };

      const response = await authorizedFetch(`/sessions/${session.id}`, authSession.access_token, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to update session');
      }

      toast.success('Session updated successfully');
      onOpenChange(false);
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error updating session:', error);
      toast.error('Failed to update session. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleObjectiveChange = (objectiveId) => {
    const selectedObjective = objectives.find(obj => obj.id === objectiveId);
    if (selectedObjective) {
      setSelectedObjectiveType(selectedObjective.objective_type);
      form.setValue('objective_id', objectiveId);
      
      // Reset progress fields based on objective type
      if (selectedObjective.objective_type === 'binary') {
        form.setValue('trials_completed', 0);
        form.setValue('trials_total', 1);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Session</DialogTitle>
          <DialogDescription>
            Update the session details and progress information.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4 w-full">
              {/* Date and Time */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date > new Date() || date < new Date("1900-01-01")
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} className="w-full" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Objective Selection with fixed width */}
              <FormField
                control={form.control}
                name="objective_id"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>Objective</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={handleObjectiveChange}
                      disabled={isLoadingObjectives}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue 
                            placeholder="Select an objective"
                            className="w-full truncate pr-2"
                          >
                            {field.value && (
                              <div className="w-[380px] truncate">
                                {objectives.find(obj => obj.id === field.value)?.description}
                              </div>
                            )}
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent 
                        className="w-[400px]"
                        position="popper"
                        side="bottom"
                        align="start"
                      >
                        {objectives.map((objective) => (
                          <SelectItem 
                            key={objective.id} 
                            value={objective.id}
                            className="py-2"
                          >
                            <div className="flex flex-col gap-1.5">
                              <div className="flex items-center">
                                <span className="text-xs font-medium bg-secondary/50 px-2 py-0.5 rounded">
                                  {objective.objective_type}
                                </span>
                              </div>
                              <p className="text-sm whitespace-normal pr-4 leading-normal">
                                {objective.description}
                              </p>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Progress Section */}
              {selectedObjectiveType === 'trial' ? (
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="trials_completed"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Successful Trials</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                            className="w-full"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="trials_total"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Trials</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                            className="w-full"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              ) : (
                <FormField
                  control={form.control}
                  name="trials_completed"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Success</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={(value) => {
                            field.onChange(value === 'yes' ? 1 : 0);
                            form.setValue('trials_total', 1);
                          }}
                          value={field.value === 1 ? 'yes' : 'no'}
                          className="flex gap-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="yes" id="success-yes" />
                            <Label htmlFor="success-yes">Yes</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="no" id="success-no" />
                            <Label htmlFor="success-no">No</Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Memo */}
              <FormField
                control={form.control}
                name="memo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add any additional notes..."
                        className="min-h-[100px] w-full"
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
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 