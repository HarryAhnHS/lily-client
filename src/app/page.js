"use client";

import { useAuth } from "@/app/context/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Bell } from "lucide-react";
import { authorizedFetch } from "@/services/api";
import { Progress } from "@/components/ui/progress";
import { ManualLogForm } from "@/components/ManualLogForm";
import { SessionRecorder } from "@/components/SessionRecorder";

// Import from @google/genai
import {
  GoogleGenAI,
} from "@google/genai";

// Direct client usage of Gemini
// Replace with your real API key
const ai = new GoogleGenAI({
  apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY,
});

export default function Home() {
  const { session, loading } = useAuth() || { session: true, loading: false };
  const router = useRouter();

  const [students, setStudents] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState(null);

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
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
        {/* <ManualLogForm students={students}/> */}

        {/* Recording Section */}
        <div className="space-y-6">
          <SessionRecorder />
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
    </div>
  );
}