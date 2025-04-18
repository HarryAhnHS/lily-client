'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Mic, ClipboardEdit } from 'lucide-react';
import { SessionManualStudentSelect } from './SessionManualLogForm';
import { SessionManualObjectiveSelect } from './ObjectivesMultiSelect';
import { SessionManualProgressForm } from './ObjectiveProgressForm';
import { TranscriptObjectiveProgressForm } from './TranscriptObjectiveProgressForm';
import { SessionRecorder } from './SessionRecorder';

// Enum for tracking which form to display
const FORM_TYPES = {
  NONE: 'none',
  MANUAL_STUDENT: 'manual_student',
  MANUAL_OBJECTIVE: 'manual_objective',
  MANUAL_PROGRESS: 'manual_progress',
  VOICE: 'voice'
};

export function SessionFormController({ students, open, onOpenChange }) {
  // Form state management
  const [currentForm, setCurrentForm] = useState(FORM_TYPES.NONE);
  const [dialogOpen, setDialogOpen] = useState(open || false);
  
  // Form data state
  const [selectedSubjectAreasMap, setSelectedSubjectAreasMap] = useState({});
  const [selectedObjectives, setSelectedObjectives] = useState({});
  const [analyzedSessions, setAnalyzedSessions] = useState(null);

  // Reset all form states
  const resetAllFormStates = () => {
    setCurrentForm(FORM_TYPES.NONE);
    setSelectedSubjectAreasMap({});
    setSelectedObjectives({});
    setAnalyzedSessions(null);
  };

  // Handle dialog state
  const handleOpenChange = (isOpen) => {
    setDialogOpen(isOpen);
    if (!isOpen) {
      // Reset state when dialog is closed
      resetAllFormStates();
      
      // Notify parent
      if (onOpenChange) {
        onOpenChange(false);
      }
    }
  };

  // Open a specific form
  const openForm = (formType) => {
    setCurrentForm(formType);
    setDialogOpen(true);
    
    if (onOpenChange) {
      onOpenChange(true);
    }
  };

  // Handler for student selection completion
  const handleStudentSelectionComplete = (subjectAreasMap) => {
    setSelectedSubjectAreasMap(subjectAreasMap);
    setCurrentForm(FORM_TYPES.MANUAL_OBJECTIVE);
  };

  // Handler for objective selection completion
  const handleObjectiveSelectionComplete = (objectives) => {
    setSelectedObjectives(objectives);
    setCurrentForm(FORM_TYPES.MANUAL_PROGRESS);
  };

  // Handler for form submission success
  const handleFormSuccess = () => {
    // First reset all form states to prevent any rendering with stale data
    resetAllFormStates();
    // Then close the dialog
    setDialogOpen(false);
    
    // Notify parent
    if (onOpenChange) {
      onOpenChange(false);
    }
  };

  // Get the title and description based on the current form
  const getDialogMeta = () => {
    switch (currentForm) {
      case FORM_TYPES.MANUAL_STUDENT:
        return {
          title: "Manual Progress Entry",
          description: "Select students and subject areas to log progress"
        };
      case FORM_TYPES.MANUAL_OBJECTIVE:
        return {
          title: "Select Objectives",
          description: "Choose objectives to track progress for each student"
        };
      case FORM_TYPES.MANUAL_PROGRESS:
        return {
          title: "Log Progress",
          description: "Record progress for each selected objective"
        };
      case FORM_TYPES.VOICE:
        return {
          title: "Voice Session Recording",
          description: "Record or type notes from your session"
        };
      default:
        return {
          title: "Session Progress",
          description: "Log progress for your students"
        };
    }
  };

  // Render the current form based on state
  const renderForm = () => {
    // If we have analyzed sessions, show the transcript form regardless of current form type
    if (analyzedSessions) {
      return (
        <TranscriptObjectiveProgressForm
          sessions={analyzedSessions}
          inDialog={true}
          onBack={() => setAnalyzedSessions(null)}
          onSuccess={handleFormSuccess}
        />
      );
    }
    
    // Otherwise show the appropriate form based on currentForm
    switch (currentForm) {
      case FORM_TYPES.MANUAL_STUDENT:
        return (
          <SessionManualStudentSelect
            students={students}
            onComplete={handleStudentSelectionComplete}
          />
        );
      case FORM_TYPES.MANUAL_OBJECTIVE:
        return (
          <SessionManualObjectiveSelect
            students={students}
            selectedSubjectAreasMap={selectedSubjectAreasMap}
            onBack={() => setCurrentForm(FORM_TYPES.MANUAL_STUDENT)}
            onContinue={handleObjectiveSelectionComplete}
          />
        );
      case FORM_TYPES.MANUAL_PROGRESS:
        return (
          <SessionManualProgressForm
            objectives={Object.values(selectedObjectives).flat()}
            onBack={() => setCurrentForm(FORM_TYPES.MANUAL_OBJECTIVE)}
            onSuccess={handleFormSuccess}
          />
        );
      case FORM_TYPES.VOICE:
        return (
          <SessionRecorder
            inDialog={true}
            onBack={() => handleOpenChange(false)}
            onSuccess={handleFormSuccess}
            onShowAnalyzedSessions={(sessions) => {
              console.log("Received analyzed sessions:", sessions);
              setAnalyzedSessions(sessions);
            }}
          />
        );
      default:
        return (
          <div className="p-6 space-y-6">
            <p>No form selected</p>
          </div>
        );
    }
  };

  // Dialog metadata
  const { title, description } = getDialogMeta();

  return (
    <>
      {/* Input Selection Buttons */}
      <div className="flex items-center gap-4">
        <Button 
          onClick={() => openForm(FORM_TYPES.VOICE)}
          className="h-48 flex-1 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-secondary/20 to-secondary/5 hover:from-secondary/30 hover:to-secondary/10 border border-secondary/20"
          variant="outline"
        >
          <Mic className="h-8 w-8 mb-2" />
          <span className="text-lg font-medium">Voice</span>
        </Button>
        
        <Button 
          onClick={() => openForm(FORM_TYPES.MANUAL_STUDENT)}
          className="h-48 flex-1 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-secondary/20 to-secondary/5 hover:from-secondary/30 hover:to-secondary/10 border border-secondary/20"
          variant="outline"
        >
          <ClipboardEdit className="h-8 w-8 mb-2" />
          <span className="text-lg font-medium">Manual</span>
        </Button>
      </div>

      {/* Dialog Container for all forms */}
      <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[600px] w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>

          {renderForm()}
        </DialogContent>
      </Dialog>
    </>
  );
}

// Also export individual components for direct use
export { 
  SessionManualStudentSelect,
  SessionManualObjectiveSelect, 
  SessionManualProgressForm,
  TranscriptObjectiveProgressForm
}; 