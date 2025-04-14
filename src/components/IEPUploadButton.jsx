'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { authorizedFetch } from '@/services/api';
import { useAuth } from '@/app/context/auth-context';
import { toast } from 'sonner';
import { Upload, FileText, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { IEPPreviewModal } from '@/components/IEPPreviewModal';

export function IEPUploadButton() {
  const { session } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [parsedIEPData, setParsedIEPData] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Check if file is a PDF
    if (file.type !== 'application/pdf') {
      toast.error('Please upload a PDF file');
      return;
    }

    setIsDialogOpen(true);
    await uploadFile(file);
  };

  const uploadFile = async (file) => {
    if (!session) {
      toast.error('You must be logged in to upload files');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

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
      formData.append('file', file);

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
      
      // Store the parsed data and show preview
      setParsedIEPData(data);
      setShowPreview(true);
      setIsDialogOpen(false);
      
    } catch (error) {
      clearInterval(progressInterval);
      console.error('Error parsing IEP:', error);
      toast.error(`Parsing failed: ${error.message}`);
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
  };

  const handleBack = () => {
    setShowPreview(false);
    setIsDialogOpen(true);
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
      
      <Button 
        variant="outline" 
        onClick={handleButtonClick}
        className="flex items-center gap-2"
      >
        <Upload className="h-4 w-4" />
        Upload IEP
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Uploading IEP</DialogTitle>
            <DialogDescription>
              Please wait while we process your IEP document.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col items-center justify-center py-6 space-y-4">
            {isUploading ? (
              <>
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <div className="w-full max-w-xs bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-primary h-2.5 rounded-full transition-all duration-300" 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-muted-foreground">
                  {uploadProgress < 30 ? 'Uploading file...' : 
                   uploadProgress < 70 ? 'Processing document...' : 
                   'Finalizing...'}
                </p>
              </>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <FileText className="h-12 w-12 text-primary" />
                <p className="text-sm font-medium">Upload Complete</p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDialogOpen(false)}
              disabled={isUploading}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Modal */}
      <IEPPreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        iepData={parsedIEPData}
        onSave={handleSaveSuccess}
        onBack={handleBack}
      />
    </>
  );
} 