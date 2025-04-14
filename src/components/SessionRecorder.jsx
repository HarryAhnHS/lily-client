import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Mic, MicOff, Send, Play } from "lucide-react";
import { toast } from "sonner";
import LoadingSpinner from "@/components/LoadingSpinner";
import { GoogleGenAI, createUserContent, createPartFromUri } from "@google/genai";

// Initialize Google Gemini AI
const ai = new GoogleGenAI({
  apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY,
});

export function SessionRecorder({ access_token }) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    
    try {
      const response = await fetch('/analyze-transcript', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${access_token}`
        },
        body: JSON.stringify({
          raw_text: transcript
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to submit session: ${response.status}`);
      }

      console.log(response)
      
      toast.success("Session logged successfully");
      setTranscript("");
      
    } catch (err) {
      console.error("Error submitting session:", err);
      setError("Failed to submit session. Please try again later.");
      toast.error("Failed to submit session. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
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
              disabled={!transcript.trim() || isSubmitting}
              className="w-full bg-white/20 hover:bg-white/30 text-white/80 disabled:bg-white/10 disabled:text-white/40"
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner size="small" className="mr-2" />
                  <span>Submitting...</span>
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
  );
} 