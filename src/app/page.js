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
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

// Import from @google/genai
import { GoogleGenAI } from "@google/genai";

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
      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        {/* Header with greeting */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <UserRoundCheck className="w-4 h-4 text-primary" />
            </div>
            <h2 className="text-2xl font-semibold">Good morning, {session?.user?.email}</h2>
          </div>
          <Button size="sm" variant="outline" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            <span>Reminders</span>
          </Button>
        </div>

        {/* Session Forms Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Session Input Options */}
          <div className="lg:col-span-1">
            <Card className="shadow-sm">
              <CardHeader className="bg-muted/30 pb-3">
                <CardTitle className="text-lg font-medium flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-primary" />
                  <span>Log Progress</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <SessionFormController students={students} />
              </CardContent>
            </Card>
          </div>

          {/* Right columns - Recent Logs & Weekly Overview */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recent Logs */}
            <Card className="shadow-sm">
              <CardHeader className="bg-muted/30 pb-3">
                <CardTitle className="text-lg font-medium flex items-center gap-2">
                  <div className="w-5 h-5 flex items-center justify-center rounded-full bg-primary/20">
                    <Bell className="w-3 h-3 text-primary" />
                  </div>
                  <span>View Recent Logs</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-3">
                  {['Alex Johnson', 'Max Limelion', 'Jonathan Hunt', 'Truce Daily', 'Eliza Chen'].map((name, index) => (
                    <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
                      <span className="font-medium">{name}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">
                          {`02/${(6 + Math.floor(index / 2)).toString().padStart(2, '0')}/2025`}
                        </span>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <ArrowUpRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Weekly Overview */}
            <Card className="shadow-sm">
              <CardHeader className="bg-muted/30 pb-3">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg font-medium flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-primary"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                    <span>Weekly Objectives Overview</span>
                  </CardTitle>
                  <Select defaultValue="this-week">
                    <SelectTrigger className="w-[120px] h-8 text-sm">
                      <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="this-week">This Week</SelectItem>
                      <SelectItem value="last-week">Last Week</SelectItem>
                      <SelectItem value="this-month">This Month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-6">
                <div>
                  <div className="text-5xl font-bold mb-2">60%</div>
                  <div className="text-sm text-muted-foreground mb-2">
                    12/20 objectives logged this week
                  </div>
                  <Progress value={60} className="h-2" />
                  <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                    <Bell className="w-4 h-4" />
                    <span>8 objectives left</span>
                  </div>
                </div>

                {/* Student Progress Card */}
                <Card className="overflow-hidden shadow-sm">
                  <CardHeader className="bg-secondary/10 py-3 px-4">
                    <CardTitle className="text-md font-medium flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="h-6 w-6 rounded-full bg-primary/20 text-xs flex items-center justify-center text-primary font-bold">
                          M
                        </span>
                        <div>
                          <span>Minusha Keys</span>
                          <span className="text-xs ml-2 text-muted-foreground">(Speech)</span>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <ArrowUpRight className="h-4 w-4" />
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <p className="text-sm mb-3">
                      Let Minusha speak clearly for three minutes
                    </p>
                    <div className="flex justify-between items-center text-sm text-muted-foreground">
                      <span>3/8 Sessions Completed</span>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" className="h-6 px-1">
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-6 px-1">
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}