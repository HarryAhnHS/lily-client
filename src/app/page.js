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
import { Check, ChevronsUpDown, Mic, MicOff, Send, Play, Bell } from "lucide-react";
import { authorizedFetch } from "@/services/api";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { toast } from "sonner";
import { MultiAnalysisReviewModal } from "@/components/MultiAnalysisReviewModal";
import { Progress } from "@/components/ui/progress";
import { ManualLogForm } from "@/components/ManualLogForm";

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

  // Fetch students list
  useEffect(() => {
    const fetchStudents = async () => {
      if (!session) return;
      setIsLoadingData(true);
      setError(null);

      try {
        const response = await authorizedFetch('/students/students', session?.access_token, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
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
    return (
      <div className="min-h-screen flex items-center justify-center">

      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {/* Greeting */}
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
            <Bell className="w-4 h-4 text-white/80" />
          </div>
          <h2 className="text-xl text-white/80">Good morning, {session?.user?.email}</h2>
        </div>

        {/* Manual Log Form - prop students list */}
        <ManualLogForm students={students}/>

        {/* Recording Section */}
        <div className="space-y-6">
          <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-green-950/50 via-yellow-950/50 to-black backdrop-blur-xl">
            <div className="p-6">
              <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
                {/* Add New Session Button */}
                <Button
                  variant="ghost"
                  className="w-full flex items-center gap-2 justify-start hover:bg-white/10 text-white/80 h-12"
                  disabled={isRecording}
                >
                  <Play className="w-4 h-4" />
                  <span>Add New Session</span>
                </Button>

                {/* Student/Objective Selection */}
                <div className="grid grid-cols-2 gap-4">

                  {/* Student selection */}
                  <div className="flex flex-col gap-2 text-sm">
                    <label className="font-medium text-white/80">Student</label>
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
                        <SelectTrigger className="w-full">
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

                  {/* Objectives selection */}
                  <div className="flex flex-col gap-2 text-sm">
                    <label className="font-medium text-white/80">Objectives</label>
                    {!selectedStudent ? (
                      <div className="h-11 flex items-center justify-center text-muted-foreground bg-muted/30 rounded-md px-3">
                        Select a student first
                      </div>
                    ) : isLoadingData ? (
                      <div className="h-11 flex items-center justify-center">
                        <LoadingSpinner size="small" />
                      </div>
                    ) : objectives.length > 0 ? (
                      <div>
                        <Popover open={openObjectives} onOpenChange={setOpenObjectives}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={openObjectives}
                              className="w-full justify-between"
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
                            {selectedObjectives.map((obj) => (
                              <Badge
                                key={obj.id}
                                variant="secondary"
                                className="flex items-center gap-1 py-1 px-2"
                              >
                                {obj.description}
                                <X
                                  className="h-3 w-3 cursor-pointer"
                                  onClick={() => removeObjective(obj.id)}
                                />
                              </Badge>
                            ))}
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

                {/* Recording UI */}
                <div className="flex flex-col items-center justify-center py-4 space-y-4">
                  <Textarea
                    placeholder="Your notes will appear here..."
                    className="min-h-[150px] resize-none bg-white/10 border-white/10 focus:border-white/20 text-white/80 placeholder:text-white/40"
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                    required
                  />

                  <Button
                    type="submit"
                    disabled={!selectedStudent || selectedObjectives.length === 0 || !transcript.trim() || isSubmitting}
                    className="w-full bg-white/20 hover:bg-white/30 text-white/80 disabled:bg-white/10 disabled:text-white/40"
                  >
                    {isSubmitting ? (
                      <>
                        <LoadingSpinner size="small" className="mr-2" />
                        <span>Analyzing...</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        <span>Submit</span>
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    onClick={toggleRecording}
                    variant={isRecording ? "destructive" : "default"}
                    className={`rounded-full w-16 h-16 p-0 flex items-center justify-center transition-all duration-300 ${
                      isRecording 
                        ? "bg-destructive hover:bg-destructive/90 shadow-lg shadow-destructive/20" 
                        : "bg-white/20 hover:bg-white/30 shadow-lg text-white"
                    }`}
                  >
                    {isRecording ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Weekly Review Section */}
        <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-green-950/50 via-yellow-950/50 to-black backdrop-blur-xl">
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1 bg-white/10 rounded">
                  <svg
                    className="w-4 h-4 text-white/80"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                </div>
                <h3 className="font-medium text-white/80">Weekly Review</h3>
              </div>
              <Select defaultValue="this-week">
                <SelectTrigger className="w-[140px] bg-white/10 border-white/10 text-white/80">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="this-week">This Week</SelectItem>
                  <SelectItem value="last-week">Last Week</SelectItem>
                  <SelectItem value="this-month">This Month</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <div className="text-4xl font-bold mb-2 text-white">60%</div>
              <div className="text-sm text-white/60 mb-2">
                12/20 objectives logged this week
              </div>
              <Progress value={60} className="h-2 bg-white/10" />
              <div className="flex items-center gap-2 mt-2 text-sm text-white/60">
                <Bell className="w-4 h-4" />
                <span>8 objectives left</span>
              </div>
            </div>

            {/* Student Progress Card */}
            <div className="bg-white/10 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="font-medium text-white/80">Tyler Washington</div>
                  <div className="text-sm text-white/60">(Language)</div>
                </div>
                <Button variant="ghost" size="icon" className="hover:bg-white/10 text-white/60">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                    />
                  </svg>
                </Button>
              </div>
              <div className="text-sm text-white/60 mb-2">
                Help Tyler learn how to enunciate more clearly
              </div>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full ${
                      i === 3 ? "bg-primary" : "bg-white/10"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

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
  );
}