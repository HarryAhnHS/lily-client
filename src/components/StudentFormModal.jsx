'use client';

import { useState, useEffect, useRef } from 'react';
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
import { Plus, FileText, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { IEPUploadButton } from '@/components/IEPUploadButton';
import { IEPPreviewModal } from '@/components/IEPPreviewModal';

// Form schema for student
const studentFormSchema = z.object({
  name: z.string().min(2, {
    message: 'Name must be at least 2 characters.',
  }),
  grade_level: z.string().min(1, {
    message: 'Please select a grade level.',
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
          grade_level: student.grade_level?.toString() || '',
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
      <DialogContent className="sm:max-w-[850px] max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-center text-xl font-semibold text-black">{isEditing ? 'Edit Student' : 'Add New Student'}</DialogTitle>
          <DialogDescription className="text-center text-black">
            {isEditing ? 'Update the student\'s information.' : 'Enter the student\'s information or upload an IEP.'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col md:flex-row gap-6">
          {/* Left Panel - Manual Entry */}
          <div className="flex-1 border border-gray-200 rounded-md p-4">
            <h3 className="text-lg font-medium mb-4 text-center text-black">Manual Entry</h3>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-black">Student Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter student name" {...field} className="border-gray-300 text-black" />
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
                        <FormLabel className="text-black">Grade Level</FormLabel>
                        <Select 
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="border-gray-300 text-black">
                              <SelectValue placeholder="Select grade level" className="text-black" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-white">
                            {Array.from({ length: 12 }, (_, i) => (
                              <SelectItem key={i + 1} value={(i + 1).toString()} className="text-black hover:bg-gray-100">
                                Grade {i + 1}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-red-500" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="disability_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-black">Disability Type (optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., ADHD, Dyslexia" {...field} className="border-gray-300 text-black" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="bg-black text-white hover:bg-gray-800 border border-black"
                  >
                    {isSubmitting ? (isEditing ? 'Updating...' : 'Adding...') : (isEditing ? 'Update Student' : 'Add Student')}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
          
          {/* Right Panel - IEP Upload */}
          <div className="flex-1 border border-gray-200 rounded-md p-4">
            <h3 className="text-lg font-medium mb-4 text-center text-black">Upload IEP</h3>
            <div className="flex flex-col items-center justify-center h-[calc(100%-90px)]">
              <FileUploadArea />
            </div>
          </div>
        </div>
        
        {/* Centered Cancel Button */}
        <div className="flex justify-center mt-6">
          <Button 
            type="button" 
            onClick={handleCancel}
            className="bg-black text-white hover:bg-gray-800 border border-black px-8 transition-transform hover:scale-105"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// File upload area component to match the design in the image
function FileUploadArea() {
  const { session } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [parsedIEPData, setParsedIEPData] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Check if file is a PDF
    if (file.type !== 'application/pdf') {
      toast.error('Please upload a PDF file');
      return;
    }

    setSelectedFile(file);
  };

  const uploadFile = async () => {
    if (!session) {
      toast.error('You must be logged in to upload files');
      return;
    }

    if (!selectedFile) {
      toast.error('Please select a PDF file first');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setIsDialogOpen(true);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + Math.random() * 10;
      });
    }, 500);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await authorizedFetch('/iep-upload/parse', session.access_token, {
        method: 'POST',
        body: formData,
      });

      // Complete the progress
      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to parse IEP');
      }

      const data = await response.json();
      console.log('Parsed IEP data:', data);
      
      // Store the parsed data
      setParsedIEPData(data);
      
      // First close the dialog, then show the preview after a short delay
      setIsDialogOpen(false);
      
      // Wait for dialog to close before showing preview
      setTimeout(() => {
        setShowPreview(true);
      }, 300);
      
    } catch (error) {
      clearInterval(progressInterval);
      console.error('Error parsing IEP:', error);
      toast.error(`Parsing failed: ${error.message}`);
      setIsDialogOpen(false);
    } finally {
      setIsUploading(false);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleSaveSuccess = (data) => {
    // Reset state after successful save
    setParsedIEPData(null);
    setShowPreview(false);
    setIsUploading(false);
    setUploadProgress(0);
    setSelectedFile(null);
  };

  const handleBack = () => {
    // Make sure preview is fully closed before reopening the dialog
    setShowPreview(false);
    setTimeout(() => {
      setIsDialogOpen(true);
    }, 300);
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".pdf"
        className="hidden"
      />
      
      <div className="flex flex-col items-center w-full">
        <div 
          onClick={handleButtonClick}
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 w-full mb-6 cursor-pointer hover:border-gray-400 transition-colors"
        >
          <div className="flex flex-col items-center justify-center text-center">
            <FileText className="h-12 w-12 text-gray-400 mb-2" />
            <p className="text-sm font-medium text-black mb-1">
              {selectedFile ? selectedFile.name : "Click to select a PDF"}
            </p>
            <p className="text-xs text-black">
              {selectedFile ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB` : "or drag and drop here"}
            </p>
          </div>
        </div>
        
        <Button 
          onClick={uploadFile}
          disabled={isUploading}
          className="bg-black text-white hover:bg-gray-800 border border-black w-full"
        >
          {isUploading ? 'Processing...' : 'Upload IEP'}
        </Button>
      </div>

      {/* Only show one dialog at a time */}
      {isDialogOpen && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-md bg-white">
            <DialogHeader>
              <div className="flex justify-between items-center">
                <DialogTitle className="text-black font-semibold">Uploading IEP</DialogTitle>
                <Button 
                  variant="ghost" 
                  className="h-8 w-8 p-0 rounded-full border border-gray-300 hover:bg-gray-100" 
                  onClick={() => setIsDialogOpen(false)}
                  disabled={isUploading}
                >
                  <X className="h-4 w-4 text-black" />
                  <span className="sr-only">Close</span>
                </Button>
              </div>
              <DialogDescription className="text-black">
                Please wait while we process your IEP document.
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex flex-col items-center justify-center py-6 space-y-4">
              {isUploading ? (
                <>
                  <Loader2 className="h-12 w-12 animate-spin text-black" />
                  <div className="w-full max-w-xs bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-black h-2.5 rounded-full transition-all duration-300" 
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-black">
                    {uploadProgress < 30 ? 'Uploading file...' : 
                     uploadProgress < 70 ? 'Processing document...' : 
                     'Finalizing...'}
                  </p>
                </>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <FileText className="h-12 w-12 text-black" />
                  <p className="text-base font-semibold text-black">Upload Complete</p>
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsDialogOpen(false)}
                disabled={isUploading}
                className="text-black bg-white hover:bg-gray-100 border border-gray-300"
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Preview Modal - Only show when showPreview is true and isDialogOpen is false */}
      {showPreview && !isDialogOpen && (
        <IEPPreviewModal
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
          iepData={parsedIEPData}
          onSave={handleSaveSuccess}
          onBack={handleBack}
        />
      )}
    </>
  );
} 