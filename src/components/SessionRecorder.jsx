import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Mic, MicOff, Send, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import LoadingSpinnerClear from "@/components/LoadingSpinnerClear";
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
        if (analysisResponse.status === 422) {
          // Handle validation/processing errors gracefully
          setError("No session data could be found in your notes. Please try recording or typing more detailed session information.");
          toast.error("No session data found. Please try with more detailed notes.");
          return;
        }
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
      <DialogContent className="sm:max-w-[450px] flex flex-col items-center justify-center p-8 bg-background/95 border-border/30">
        <DialogHeader className="text-center space-y-3 mb-4">
          <DialogTitle className="text-xl font-semibold">Processing Your Notes</DialogTitle>
          <DialogDescription id="loading-description" className="text-sm text-muted-foreground leading-relaxed">
            We're analyzing your session notes and extracting key information about students, objectives, and progress. 
            <br /><br />
            <span className="font-medium">This may take a couple of minutes</span> depending on the length and complexity of your notes.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center space-y-6 py-6">
          <LoadingSpinnerClear size="large" className="text-primary" inline={true} />
          <p className="text-sm text-muted-foreground text-center max-w-xs">
            Please keep this tab open while we process your session data...
          </p>
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
    <div className="h-[700px] flex flex-col overflow-hidden bg-gradient-to-br from-background via-background to-muted/20">
      {/* Loading Modal */}
      <LoadingModal />
      
      {/* Header Section */}
      <div className="border-b px-6 py-3 flex justify-between items-center flex-shrink-0 bg-gradient-to-r from-muted/80 to-muted">
        <div className="flex items-center gap-3">
          {inDialog && onBack && (
            <Button variant="ghost" onClick={onBack} className="p-2 h-9 w-9">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          )}
          <h2 className="text-lg font-semibold">Session Notes</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-xs text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
            {transcript.length} characters
          </div>
          {isRecording && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-full px-4 py-2 flex items-center gap-2">
              <div className="relative">
                <span className="absolute inset-0 animate-ping size-3 bg-destructive rounded-full opacity-75"></span>
                <span className="relative size-3 bg-destructive rounded-full"></span>
              </div>
              <span className="font-semibold text-destructive text-sm">Recording</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Main Content with Card Layout */}
      <div className="flex-1 overflow-hidden p-8">
        <form ref={formRef} onSubmit={handleSubmit} className="h-full flex flex-col">
          {/* Error Alert - Enhanced */}
          {error && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-destructive/10 to-destructive/5 text-destructive text-sm mb-6 border border-destructive/20 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="size-2 bg-destructive rounded-full"></div>
                {error}
              </div>
            </div>
          )}
          
          <Textarea
            placeholder="Start recording or type your session notes here... 🎙️"
            className="flex-1 min-h-[400px] resize-none bg-background border border-border rounded-lg p-4 text-base leading-relaxed placeholder:text-muted-foreground focus-visible:ring-primary/20 focus-visible:ring-offset-0"
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            required
          />
          
          {/* Action Bar */}
          <div className="mt-8 flex items-center justify-between">
            {/* Recording Button - Hero Style */}
            <div className="flex items-center gap-4">
              <Button
                type="button"
                onClick={toggleRecording}
                variant={isRecording ? "destructive" : "outline"}
                className={cn(
                  "h-14 w-14 rounded-full p-0 flex items-center justify-center transition-all duration-300 shadow-lg",
                  isRecording 
                    ? "bg-gradient-to-br from-destructive to-destructive/80 text-white hover:shadow-destructive/25 hover:shadow-xl scale-110" 
                    : "bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 text-primary hover:bg-gradient-to-br hover:from-primary/20 hover:to-primary/10 hover:border-primary/40 hover:shadow-primary/20 hover:shadow-lg hover:scale-105"
                )}
              >
                {isRecording ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
              </Button>
              <div className="text-sm text-muted-foreground">
                {isRecording ? "Click to stop recording" : "Click to start recording"}
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              {inDialog && onBack && (
                <Button 
                  variant="outline" 
                  onClick={onBack} 
                  className="bg-gradient-to-br from-background to-muted/20 border-border hover:bg-gradient-to-br hover:from-muted/10 hover:to-muted/20 hover:border-primary/40 transition-all"
                >
                  Cancel
                </Button>
              )}
              <Button
                type="submit"
                disabled={!transcript.trim() || isSubmitting}
                className="bg-gradient-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl hover:shadow-primary/25 transition-all px-8 py-2.5"
              >
                
                    <Send className="h-4 w-4 mr-2" />
                    Process Notes

                
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
} 