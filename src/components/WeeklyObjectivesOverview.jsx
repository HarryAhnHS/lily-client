'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Bell, ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import { authorizedFetch } from "@/services/api";

export default function WeeklyObjectivesOverview({ session }) {
  const [period, setPeriod] = useState('this-week');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [data, setData] = useState({
    completionPercentage: 0,
    completedCount: 0,
    totalCount: 0,
    remainingCount: 0,
    objectives: []
  });

  // Fetch weekly data
  useEffect(() => {
    const fetchWeeklyData = async () => {
      if (!session) return;
      setIsLoading(true);
      setError(null);

      try {
        const apiPeriod = period === "this-week" ? "this" : "last";

        const response = await authorizedFetch(
          `/weekly-summary/weekly-summary?week=${apiPeriod}`,
          session?.access_token,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) throw new Error("Non-200 response");
        const result = await response.json();

        setData({
          completionPercentage: result.progress_percent,
          completedCount: result.objectives_logged,
          totalCount: result.objectives_total,
          remainingCount: result.objectives_left,
          objectives: result.objectives || [],
        });

        setCurrentIndex(0);
      } catch (err) {
        console.error("Error fetching weekly overview:", err);
        setError("Failed to load weekly overview. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchWeeklyData();
  }, [session, period]);

  const handlePeriodChange = (value) => {
    setPeriod(value);
  };

  const handlePrevStudent = () => {
    setCurrentIndex((prev) => (prev - 1 + data.objectives.length) % data.objectives.length);
  };

  const handleNextStudent = () => {
    setCurrentIndex((prev) => (prev + 1) % data.objectives.length);
  };

  const getInitial = (name) => name?.charAt(0).toUpperCase() || '?';

  const current = data.objectives[currentIndex];

  return (
    <Card className="shadow-md border border-border/40 backdrop-blur-sm bg-card/95 rounded-2xl">
      <CardHeader className="bg-muted/30 pb-3 rounded-t-2xl">
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
          <Select defaultValue={period} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-[120px] h-8 text-sm">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="this-week">This Week</SelectItem>
              <SelectItem value="last-week">Last Week</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-6">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">{error}</div>
        ) : (
          <>
            <div>
              <div className="text-[48px] font-semibold leading-none mb-2 tracking-tight">
                {data.completionPercentage}%
              </div>
              <div className="text-sm text-muted-foreground mb-2">
                {data.completedCount}/{data.totalCount} objectives logged this week
              </div>
              <Progress value={data.completionPercentage} className="h-2 bg-muted" />
              <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                <Bell className="w-4 h-4" />
                <span>{data.remainingCount} objectives left</span>
              </div>
            </div>

            {current && (
              <Card className="overflow-hidden shadow-sm border border-border/60 bg-muted/5 rounded-xl">
                <CardHeader className="bg-secondary/10 py-3 px-4 border-b border-border/40">
                  <CardTitle className="text-md font-medium flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="h-6 w-6 rounded-full bg-primary/20 text-xs flex items-center justify-center text-primary font-bold">
                        {getInitial(current.student_name)}
                      </span>
                      <div>
                        <span>{current.student_name}</span>
                        <span className="text-xs ml-2 text-muted-foreground">({current.subject_area})</span>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <ArrowUpRight className="h-4 w-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <p className="text-sm mb-3">
                    {current.description}
                  </p>
                  <div className="flex justify-between items-center text-sm text-muted-foreground">
                    <span>Not logged</span>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 px-1"
                        onClick={handlePrevStudent}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 px-1"
                        onClick={handleNextStudent}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
