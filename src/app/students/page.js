'use client';

import { useAuth } from '@/app/context/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { authorizedFetch } from '@/services/api';
import { StudentFormModal } from '@/components/StudentFormModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { ObjectiveFormModal } from '@/components/ObjectiveFormModal';
import { Users, Plus, Filter, MoreHorizontal, Check, X, Activity } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function StudentsPage() {
  const { session, loading } = useAuth();
  const router = useRouter();
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [showObjectiveModal, setShowObjectiveModal] = useState(false);

  useEffect(() => {
    if (!loading && !session) {
      router.replace('/login');
    }
  }, [loading, session, router]);

  const fetchStudents = async () => {
    if (!session) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await authorizedFetch('/students/students', session?.access_token, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch students: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Students data", data);
      setStudents(data);
    } 
    catch (err) {
      console.error('Error fetching students:', err);
      setError('Failed to load students. Please try again later.');
    } 
    finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [session]);

  const formatDate = (dateString) => {
    if (!dateString) return 'No sessions yet';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  const handleStudentAdded = () => {
    fetchStudents();
    toast.success('Student added successfully');
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-background">
      <div className="rounded-3xl overflow-hidden bg-gradient-to-br from-green-950/50 via-yellow-950/50 to-black backdrop-blur-xl">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-white/80" />
              </div>
              <h1 className="text-2xl font-semibold text-white/80">Students</h1>
            </div>

            <div className="flex items-center gap-2">
              <Select defaultValue="this-week">
                <SelectTrigger className="bg-white/10 border-white/10 text-white/80">
                  <SelectValue placeholder="This Week" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="this-week">This Week</SelectItem>
                  <SelectItem value="last-week">Last Week</SelectItem>
                  <SelectItem value="this-month">This Month</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="ghost" size="icon" className="rounded-full bg-white/10 text-white/80">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="bg-white/10 border-white/10 text-white/80 hover:bg-white/20"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filter By
            </Button>
            {/* Example filters - these would be dynamic based on your data */}
            <Badge 
              variant="secondary" 
              className="bg-white/10 text-white/80 hover:bg-white/20 cursor-pointer flex items-center gap-1"
            >
              3rd Grade
              <X className="h-3 w-3" />
            </Badge>
            <Badge 
              variant="secondary" 
              className="bg-white/10 text-white/80 hover:bg-white/20 cursor-pointer flex items-center gap-1"
            >
              Maths
              <X className="h-3 w-3" />
            </Badge>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 rounded-md bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}

          {/* Loading State */}
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <LoadingSpinner />
            </div>
          ) : students.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {students.map((student) => {
                const objectives = student.objectives || [];
                return (
                  <div
                    key={student.id}
                    className="bg-black/40 rounded-xl p-6 space-y-4"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-semibold text-white/90">{student.name}</h3>
                        <p className="text-sm text-white/60">{formatDate(student.last_session_date)}</p>
                      </div>
                      <Button variant="ghost" size="icon" className="text-white/60 hover:text-white/80">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-white/60">Overall Progress:</span>
                        <span className="text-sm font-medium text-white/80">
                          {student.progress || 65}%
                        </span>
                      </div>
                      <Progress 
                        value={student.progress || 65} 
                        className="h-2 bg-white/10"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-white/60">Objectives:</span>
                        <span className="text-sm text-white/60">
                          {objectives.filter(o => o.completed).length}/{objectives.length}
                        </span>
                      </div>
                      {objectives.map((objective) => (
                        <div
                          key={objective.id}
                          className="bg-white/5 rounded-lg p-3 flex items-center justify-between"
                        >
                          <span className="text-sm text-white/80">{objective.description}</span>
                          {objective.completed ? (
                            <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                              <Check className="w-3 h-3 text-green-500" />
                            </div>
                          ) : (
                            <div className="w-5 h-5">
                              <Activity className="w-3 h-3 text-white/40" />
                            </div>
                          )}
                        </div>
                      ))}
                      <Button
                        variant="ghost"
                        className="w-full bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/80"
                        onClick={() => setShowObjectiveModal(true)}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Objective
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-white/60">
              <h3 className="text-lg font-medium mb-2">No students found</h3>
              <p className="mb-4">
                You don&apos;t have any students assigned to you yet.
              </p>
              <Button
                onClick={() => setShowStudentModal(true)}
                className="bg-white/10 text-white/80 hover:bg-white/20"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Student
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <ObjectiveFormModal
        onSuccess={handleStudentAdded}
        students={students}
        open={showObjectiveModal}
        onOpenChange={setShowObjectiveModal}
        onStudentOpenChange={setShowStudentModal}
      />
      <StudentFormModal
        onSuccess={handleStudentAdded}
        open={showStudentModal}
        onOpenChange={setShowStudentModal}
      />
    </div>
  );
}
