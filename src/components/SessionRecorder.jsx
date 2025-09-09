import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Mic, MicOff, Send, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import LoadingSpinner from "@/components/LoadingSpinner";
import { GoogleGenAI, createUserContent, createPartFromUri } from "@google/genai";
import { TranscriptObjectiveProgressForm } from "@/components/TranscriptObjectiveProgressForm";
import { authorizedFetch } from "@/services/api";
import { useAuth } from "@/app/context/auth-context";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
  DialogDescription,
} from "@/components/ui/dialog";

// Initialize Google Gemini AI
const ai = new GoogleGenAI({
  apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY,
});

export function SessionRecorder({ inDialog = false, onBack, onSuccess, onShowAnalyzedSessions }) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingStage, setLoadingStage] = useState(null);
  const [analyzedSessions, setAnalyzedSessions] = useState(null);
  const { session } = useAuth();

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const formRef = useRef(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/wav",
        });

        try {
          const fileToUpload = new File([audioBlob], "recording.wav", {
            type: "audio/wav",
          });

          const myfile = await ai.files.upload({
            file: fileToUpload,
            config: { mimeType: "audio/wav" },
          });

          const result = await ai.models.generateContent({
            model: "gemini-2.0-flash",
            contents: createUserContent([
              createPartFromUri(myfile.uri, myfile.mimeType),
              "Generate a transcript of the speech.",
            ]),
          });

          setTranscript(result.text || "");
        } catch (err) {
          console.error("Transcription error:", err);
          setError("Could not transcribe audio. Check console for details.");
        } finally {
          stream.getTracks().forEach((track) => track.stop());
        }
      };

      mediaRecorder.start();
    } catch (err) {
      console.error("Mic error:", err);
      setError("Could not access microphone. Please check permissions.");
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }
  };

  const toggleRecording = () => {
    const newVal = !isRecording;
    setIsRecording(newVal);

    if (newVal) {
      setError(null);
      setTranscript("");
      startRecording();
    } else {
      stopRecording();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!transcript.trim()) {
      toast.error("Please enter some text before submitting.");
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    setLoadingStage(true);
    
    try {
      // Call to analyze the transcript
      const analysisResponse = await authorizedFetch('/transcript/analyze', session?.access_token, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcript
        }),
      });
      
      if (!analysisResponse.ok) {
        throw new Error(`Failed to analyze transcript: ${analysisResponse.status}`);
      }

      // Get the analysis data
      const analysisData = await analysisResponse.json();
      
      console.log("Analysis complete, data:", analysisData);
      
      if (inDialog && onShowAnalyzedSessions) {
        // When in dialog, we let the parent component handle the analyzed sessions
        onShowAnalyzedSessions(analysisData);
      } else {
        setAnalyzedSessions(analysisData);
      }
      
    } catch (err) {
      console.error("Error processing transcript:", err);
      setError("Failed to process transcript. Please try again later.");
      toast.error("Failed to process transcript. Please try again later.");
    } finally {
      setIsSubmitting(false);
      setLoadingStage(null);
    }
  };

  // Loading spinner modal component
  const LoadingModal = () => (
    <Dialog open={loadingStage === true} onOpenChange={() => {}} aria-describedby="loading-description">
      <DialogContent className="sm:max-w-[400px] flex flex-col items-center justify-center p-8 bg-background/95 border-border/30">
        <DialogHeader className="text-center space-y-2 mb-2">
          <DialogTitle className="text-lg font-medium">Analyzing Notes</DialogTitle>
          <DialogDescription id="loading-description" className="text-sm text-muted-foreground">
            Extracting key information from your session
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center space-y-4 py-6">
          <LoadingSpinner size="large" className="text-primary" />
        </div>
      </DialogContent>
    </Dialog>
  );

  // When analyzing is complete and we have sessions, render the TranscriptObjectiveProgressForm
  if (analyzedSessions && !inDialog) {
    return (
      <TranscriptObjectiveProgressForm 
        sessions={analyzedSessions}
        onBack={() => setAnalyzedSessions(null)}
        onSuccess={() => {
          setAnalyzedSessions(null);
          setTranscript("");
          if (onSuccess) {
            onSuccess();
          }
        }}
      />
    );
  }

  return (
    <div className="h-[600px] flex flex-col overflow-hidden">
      {/* Loading Modal */}
      <LoadingModal />
      
      {/* Top header */}
      <div className="border-b px-6 py-3 flex justify-between items-center flex-shrink-0 bg-gradient-to-r from-muted/80 to-muted">
        <div className="flex items-center gap-3">
          {inDialog && onBack && (
            <Button variant="ghost" onClick={onBack} className="p-2 h-9 w-9">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          )}
          <h2 className="text-lg font-semibold">Session Notes</h2>
        </div>
        {isRecording && (
          <span className="font-medium text-destructive flex items-center gap-1.5">
            <span className="animate-pulse size-2 bg-destructive rounded-full"></span> Recording...
          </span>
        )}
      </div>
      
      {/* Main content area */}
      <div className="flex-1 overflow-hidden">
        <form ref={formRef} onSubmit={handleSubmit} className="h-full flex flex-col">
          <div className="flex-1 overflow-y-auto p-6">
            {/* Error alert */}
            {error && (
              <div className="p-3 rounded-md bg-destructive/5 text-destructive text-sm mb-4 border border-destructive/10">
                {error}
              </div>
            )}
            
            <Textarea
              placeholder="Record or type your session notes here..."
              className="min-h-[240px] resize-none border-border bg-gradient-to-br from-background/50 to-background focus-visible:ring-primary/20 focus-visible:ring-offset-0"
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              required
            />
            
            {/* Action buttons */}
            <div className="mt-6 flex items-center justify-between">
              <Button
                type="button"
                onClick={toggleRecording}
                variant={isRecording ? "destructive" : "outline"}
                className={cn(
                  "rounded-full h-10 w-10 p-0 flex items-center justify-center transition-all",
                  isRecording 
                    ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" 
                    : "bg-gradient-to-br from-background/50 to-background border-border text-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/40"
                )}
              >
                {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </Button>
              
              <div className="flex items-center gap-3">
                {inDialog && onBack && (
                  <Button 
                    variant="outline" 
                    onClick={onBack} 
                    size="sm"
                    className="bg-gradient-to-br from-background/50 to-background border-border text-foreground hover:bg-muted/10 hover:border-primary/40"
                  >
                    Cancel
                  </Button>
                )}
                <Button
                  type="submit"
                  disabled={!transcript.trim() || isSubmitting}
                  className="flex items-center gap-1 bg-gradient-to-br from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80"
                  size="sm"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center">
                      <LoadingSpinner className="size-4 mr-2" />
                      Processing
                    </div>
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5 mr-1" />
                      Process
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
} 