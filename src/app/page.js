"use client";

import { useAuth } from "@/app/context/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown, Mic, MicOff, Send } from "lucide-react";
import { authorizedFetch } from "@/services/api";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { toast } from "sonner";
import { MultiAnalysisReviewModal } from "@/components/MultiAnalysisReviewModal";

// Import from @google/genai
import {
  GoogleGenAI,
  createUserContent,
  createPartFromUri,
} from "@google/genai";

// Direct client usage of Gemini
// Replace with your real API key
const ai = new GoogleGenAI({
  apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY,
});

export default function Home() {
  // If you have a real auth:
  const { session, loading } = useAuth() || { session: true, loading: false };
  const router = useRouter();

  // The same states from your original code
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [students, setStudents] = useState([]);
  const [objectives, setObjectives] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedObjectives, setSelectedObjectives] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState(null);
  const [openObjectives, setOpenObjectives] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [analysisResults, setAnalysisResults] = useState([]);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);

  // For recording
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const formRef = useRef(null);

  // Optional login redirect
  useEffect(() => {
    if (!loading && !session) {
      router.replace("/login");
    }
  }, [loading, session, router]);

  // Fetch students from API
  useEffect(() => {
    const fetchStudents = async () => {
      if (!session) return;
      setIsLoadingData(true);
      setError(null);

      try {
        const response = await authorizedFetch('/students', session?.access_token);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch students: ${response.status}`);
        }
        
        const data = await response.json();
        setStudents(data);
      } catch (err) {
        console.error("Error fetching students:", err);
        setError("Failed to load students. Please try again later.");
      } finally {
        setIsLoadingData(false);
      }
    };
    
    fetchStudents();
  }, [session]);

  // Fetch objectives when student changes
  useEffect(() => {
    const fetchObjectives = async () => {
      if (!session || !selectedStudent) {
        setObjectives([]);
        setSelectedObjectives([]);
        return;
      }
      
      setIsLoadingData(true);
      
      try {
        console.log("Fetching objectives for student:", selectedStudent);
        const response = await authorizedFetch(`/objectives/student/${selectedStudent.id}`, session?.access_token);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch objectives: ${response.status}`);
        }
        
        const data = await response.json();
        setObjectives(data);
        setSelectedObjectives([]);
      } catch (err) {
        console.error("Error fetching objectives:", err);
        setError("Failed to load objectives. Please try again later.");
        setObjectives([]);
      } finally {
        setIsLoadingData(false);
      }
    };
    
    fetchObjectives();
  }, [selectedStudent]);

  const toggleObjective = (objectiveId) => {
    const objective = objectives.find((obj) => obj.id === objectiveId);
    if (!objective) return;
  
    setSelectedObjectives((prev) => {
      const exists = prev.find((o) => o.id === objectiveId);
      return exists
        ? prev.filter((o) => o.id !== objectiveId)
        : [...prev, objective];
    });
  };

  const removeObjective = (objectiveId) => {
    console.log("Removing objective:", objectiveId);
    setSelectedObjectives((prev) =>
      prev.filter((o) => o.id !== objectiveId)
    );
  };
  /**
   * Record WAV with MediaRecorder, then call Gemini client:
   * 1. Upload the WAV file to Gemini's File API
   * 2. Request transcript from gemini-2.0-flash
   */
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // Collect audio data
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Combine chunks into a single WAV Blob
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/wav",
        });

        try {
          // Upload to Gemini's File API ( store it for up to 48 hours )
          const fileToUpload = new File([audioBlob], "recording.wav", {
            type: "audio/wav",
          });

          const myfile = await ai.files.upload({
            file: fileToUpload,
            config: { mimeType: "audio/wav" },
          });

          // Then request a transcript
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
          // Stop mic access
          stream.getTracks().forEach((track) => track.stop());
        }
      };

      // Start the recording
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

  /**
   * Toggle the recording state
   */
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
    
    if (!selectedStudent || selectedObjectives.length === 0 || !transcript.trim()) {
      toast.error("Please fill in all required fields before submitting.");
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const payload = {
        student: selectedStudent,
        objectives: selectedObjectives,
        raw_text: transcript,
      };
      
      const response = await authorizedFetch('/sessions/analyze', session?.access_token, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to analyze session: ${response.status}`);
      }
      
      const result = await response.json();

      setAnalysisResults(result["results"]);

      console.log("analysisResults", result["results"]);
      
      toast.success("Analysis complete");
      // Show the analysis modal
      setShowAnalysisModal(true);
      
    } catch (err) {
      console.error("Error analyzing session:", err);
      setError("Failed to analyze session. Please try again later.");
      toast.error("Failed to analyze session. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="h-full flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-3xl rounded-xl bg-card p-8 shadow-lg border border-border/50 space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Record Your Notes</h1>
          <p className="text-muted-foreground">Select a student and objectives, then start recording</p>
        </div>

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
          {/* Student/Objective row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Student</label>
              {isLoadingData ? (
                <div className="h-11 flex items-center justify-center">
                  <LoadingSpinner size="small" />
                </div>
              ) : students.length > 0 ? (
                <Select
                  value={selectedStudent?.id}
                  onValueChange={(id) => {
                    const student = students.find((s) => s.id === id);
                    setSelectedStudent(student || null);
                  }}
                >
                  <SelectTrigger className="h-11 w-full">
                    <SelectValue placeholder="Select a student" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="h-11 flex items-center justify-center text-muted-foreground bg-muted/30 rounded-md px-3">
                  No students available
                </div>
              )}
            </div>

            <div className="space-y-2 text-sm">
              <label>Objectives</label>
              {!selectedStudent ? (
                <div className="h-11 flex items-center justify-center text-muted-foreground bg-muted/30 rounded-md px-3">
                  Select a student first
                </div>
              ) : isLoadingData ? (
                <div className="h-11 flex items-center justify-center">
                  <LoadingSpinner size="small" />
                </div>
              ) : objectives.length > 0 ? (
                <div className="space-y-2">
                  <Popover open={openObjectives} onOpenChange={setOpenObjectives}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openObjectives}
                        className="w-full justify-between h-11"
                      >
                        {selectedObjectives.length > 0
                          ? `${selectedObjectives.length} selected`
                          : "Select objectives..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Search objectives..." className="h-11" />
                        <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
                          No objectives found.
                        </CommandEmpty>
                        <CommandGroup className="max-h-60 overflow-auto">
                          {objectives.map((obj) => (
                            <CommandItem
                              key={obj.id}
                              onSelect={() => toggleObjective(obj.id)}
                              className="h-11"
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedObjectives.includes(obj) ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {obj.description}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  
                  {selectedObjectives.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2"> 
                      {selectedObjectives.map((obj) =>
                        obj && obj.id ? (
                          <Badge
                            key={obj.id}
                            variant="secondary"
                            className="flex items-center gap-1 py-1 px-2"
                          >
                            {obj.description}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-3 w-3 cursor-pointer ml-1"
                              onClick={() => removeObjective(obj.id)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </Badge>
                        ) : null
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-11 flex items-center justify-center text-muted-foreground bg-muted/30 rounded-md px-3">
                  No objectives available
                </div>
              )}
            </div>
          </div>

          {/* Error alert */}
          {error && (
            <div className="p-4 rounded-md bg-destructive/10 text-destructive text-sm border border-destructive/20">
              {error}
            </div>
          )}

          {/* Transcript */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Notes</label>
            <Textarea
              placeholder="Your notes will appear here..."
              className="min-h-[250px] resize-none border-muted-foreground/20 focus:border-primary"
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              required
            />
          </div>

          {/* Record and Submit buttons */}
          <div className="flex justify-center gap-4 pt-4">
            <Button
              type="button"
              onClick={toggleRecording}
              variant={isRecording ? "destructive" : "default"}
              size="lg"
              className={`rounded-full w-20 h-20 p-0 flex items-center justify-center transition-all duration-300 ${
                isRecording 
                  ? "bg-destructive hover:bg-destructive/90 shadow-lg shadow-destructive/20" 
                  : "bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
              }`}
            >
              {isRecording ? <MicOff className="h-8 w-8" /> : <Mic className="h-8 w-8" />}
            </Button>
            
            <Button
              type="submit"
              disabled={!selectedStudent || selectedObjectives.length === 0 || !transcript.trim() || isSubmitting}
              size="lg"
              className="rounded-full px-8 h-20 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner size="small" />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <Send className="h-5 w-5" />
                  <span>Submit</span>
                </>
              )}
            </Button>
          </div>
        </form>
        
        {/* Analysis Result Modal */}
        {analysisResults.length > 0 && (  
          <MultiAnalysisReviewModal
            isOpen={showAnalysisModal}
            onClose={() => setShowAnalysisModal(false)}
            analysisResults={analysisResults}
            sessionMetadata={{
              student: selectedStudent,
              objectives: selectedObjectives,
              raw_text: transcript,
            }}
            access_token={session?.access_token}
          />
        )}
      </div>
    </div>
  );
}