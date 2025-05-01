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
import LoadingSpinner from "@/components/LoadingSpinner";

export default function WeeklyObjectivesOverview({ session }) {
  const [period, setPeriod] = useState('this-week');
  const [error, setError] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
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
  }, [period]);

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
    <Card className="backdrop-blur-sm bg-[var(--soft-primary)] h-full rounded-4xl flex flex-col">
      <CardHeader>
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

      <CardContent className="pb-0 space-y-6 flex-1 flex flex-col">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <LoadingSpinner />
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500 h-full w-full">{error}</div>
        ) : (
          <>
            <div>
              <div className="text-[48px] font-semibold leading-none mb-2 tracking-tight">
                {data.completionPercentage}%
              </div>
              <div className="text-sm text-muted-foreground mb-2">
                {data.completedCount}/{data.totalCount} objectives logged this week
              </div>
              <Progress value={data.completionPercentage} className="h-2" />
              <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                <Bell className="w-4 h-4" />
                <span>{data.remainingCount} objectives left</span>
              </div>
            </div>

            {current && (
              <Card className="overflow-hidden bg-[var(--soft-secondary)] w-full">
                <CardHeader className="bg-secondary/10 py-3 border-b border-border/40">
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
                <CardContent className="px-2">
                  <p className="text-sm mb-3">
                    {current.description}
                  </p>
                  <div className="flex justify-between items-center text-sm text-muted-foreground">
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