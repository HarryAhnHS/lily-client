'use client';

import { useAuth } from '@/app/context/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { authorizedFetch } from '@/services/api';
import { StudentFormModal } from '@/components/StudentFormModal';
import { StudentCard } from '@/components/StudentCard';
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
import { StudentView } from '@/components/StudentView';

export default function StudentsPage() {
  const { session, loading } = useAuth();
  const router = useRouter();
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [showObjectiveModal, setShowObjectiveModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

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
      {selectedStudent ? (
        <StudentView
          student={selectedStudent}
          onBack={() => setSelectedStudent(null)}
          onAddObjective={() => setShowObjectiveModal(true)}
        />
      ) : (
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
                  {/* Modal Buttons */}
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
                {students.map((student) => (
                  <StudentCard
                    key={student.id}
                    student={student}
                    onAddObjective={() => setShowObjectiveModal(true)}
                    onClick={() => setSelectedStudent(student)}
                  />
                ))}
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
      )}
    </div>
  );
}
