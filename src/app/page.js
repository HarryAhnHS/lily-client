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
import { Bell, ClipboardList, UserRoundCheck, ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import { authorizedFetch } from "@/services/api";
import { Progress } from "@/components/ui/progress";
import { SessionFormController } from "@/components/SessionForms";

import RecentLogs from "@/components/RecentLogs";
import WeeklyObjectivesOverview from "@/components/WeeklyObjectivesOverview";

// Import from @google/genai
import { GoogleGenAI } from "@google/genai";

// Direct client usage of Gemini
// Replace with your real API key
const ai = new GoogleGenAI({
  apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY,
});

export default function Home() {
  const { session, loading: authLoading } = useAuth() || { session: true, loading: false };
  const router = useRouter();

  const [students, setStudents] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [error, setError] = useState(null);

  // Optional login redirect
  useEffect(() => {
    if (!authLoading && !session) {
      router.replace("/login");
    }
  }, [authLoading, session, router]);

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
    
    console.log("fetching students, students:", students);
    fetchStudents();
  }, [session]);

  // Only auth and initial data fetch should block rendering
  const isInitialLoading = authLoading || isLoadingData;

  if (isInitialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col justify-center overflow-hidden">
      <div className="w-full sm:px-8 md:px-18 space-y-6 relative z-10 overflow-y-auto">
        {/* Header with greeting */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <UserRoundCheck className="w-4 h-4 text-primary" />
            </div>
            <h2 className="text-2xl font-semibold">Good evening, {session?.user?.user_metadata?.name}</h2>
          </div>
          <Button size="sm" variant="outline" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            <span>Reminders</span>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-y-auto">
          {/* Left column - Session Input Options */}
          <div className="lg:col-span-1 overflow-hidden h-[300px]">
            <SessionFormController students={students} />
          </div>

          {/* Right column - Recent Logs */}
          <div className="lg:col-span-1 overflow-hidden h-[300px]">
            <RecentLogs session={session} />
          </div>
          
          {/* Weekly Overview - Full Width */}
          <div className="lg:col-span-2 overflow-hidden h-[360px]">
            <WeeklyObjectivesOverview session={session} />
          </div>
        </div>
      </div>
    </div>
  );
}