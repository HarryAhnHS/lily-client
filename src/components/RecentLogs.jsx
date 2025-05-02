'use client';

import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Bell, ArrowUpRight } from "lucide-react";
import { authorizedFetch } from "@/services/api";
import { formatDate } from "@/lib/utils";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function RecentLogs({ session }) {
  const [recentLogs, setRecentLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [students, setStudents] = useState({});

  // Fetch students data to get names
  useEffect(() => {
    const fetchStudents = async () => {
      if (!session) return;
      
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
        const studentMap = {};
        
        data.forEach(student => {
          studentMap[student.id] = student.name;
        });
        
        setStudents(studentMap);
      } catch (err) {
        console.error("Error fetching students:", err);
      }
    };
    
    fetchStudents();
  }, []);

  // Fetch recent logs
  useEffect(() => {
    const fetchRecentLogs = async () => {
      if (!session) return;
      setIsLoading(true);
      setError(null);

      try {
        const response = await authorizedFetch('/sessions/recent', session?.access_token, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch recent logs: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Recent logs:', data);
        setRecentLogs(data);
      } catch (err) {
        console.error("Error fetching recent logs:", err);
        setError("Failed to load recent logs. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRecentLogs();
  }, []);

  // Get student name from ID
  const getStudentName = (studentId) => {
    return students[studentId] || 'Unknown Student';
  };

  // Format memo for display
  const formatMemo = (memo) => {
    if (!memo) return '';
    return memo.length > 30 ? `${memo.substring(0, 27)}...` : memo;
  };

  return (
    <Card className="backdrop-blur-sm bg-primary/10 h-full rounded-4xl flex flex-col">
      {isLoading ? (
        <div className="flex items-center justify-center h-full">
          <LoadingSpinner />
        </div>
      ) : (
        <>
          <CardHeader>
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <div className="w-5 h-5 flex items-center justify-center rounded-full bg-primary/20">
                <Bell className="w-3 h-3 text-primary" />
              </div>
              <span>View Recent Logs</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-grow overflow-y-auto">
            {error ? (
              <div className="text-center py-4 text-red-500">{error}</div>
            ) : recentLogs.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">No recent logs found</div>
            ) : (
              <div className="h-full overflow-y-auto pr-1 pb-2 rounded-sm bg-primary/5">
                {recentLogs.map((log) => (
                  <div key={log.id} className="px-2 flex items-center justify-between h-[60px] border border-border/40">
                    <div className="flex flex-col">
                      <span className="font-medium">{getStudentName(log.student_id)}</span>
                      <span className="text-xs text-muted-foreground">{formatMemo(log.memo)}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground">
                        {formatDate(log.created_at)}
                      </span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 flex-shrink-0"
                      >
                        <ArrowUpRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </>
      )}
    </Card>
  );
} 