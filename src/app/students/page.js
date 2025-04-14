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
import { toast } from 'sonner';
import { ObjectiveFormModal } from '@/components/ObjectiveFormModal';
import { Users, Plus, Filter, MoreHorizontal, Check, X, Activity } from 'lucide-react';
import { StudentView } from '@/components/StudentView';
import ObjectiveView from '@/components/ObjectiveView';

// View types for state management
const VIEW_TYPES = {
  LIST: 'list',
  STUDENT: 'student',
  OBJECTIVE: 'objective'
};

export default function StudentsPage() {
  const { session, loading } = useAuth();
  const router = useRouter();
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // View state management
  const [currentView, setCurrentView] = useState(VIEW_TYPES.LIST);
  const [viewStack, setViewStack] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedObjective, setSelectedObjective] = useState(null);

  // Modal states
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [showObjectiveModal, setShowObjectiveModal] = useState(false);
  const [selectedStudentForEdit, setSelectedStudentForEdit] = useState(null);
  const [selectedObjectiveForEdit, setSelectedObjectiveForEdit] = useState(null);

  // Modal handlers
  const handleOpenStudentModal = (student = null) => {
    setSelectedStudentForEdit(student);
    setShowStudentModal(true);
  };

  const handleOpenObjectiveModal = (objective = null, student = null) => {
    console.log("objective", objective);
    console.log("student", student);
    setSelectedObjectiveForEdit(objective);
    if (student) {
      setSelectedStudentForEdit(student);
    } else {
      setSelectedStudentForEdit(null);
    }
    setShowObjectiveModal(true);
  };

  const handleCloseStudentModal = () => {
    setShowStudentModal(false);
    setSelectedStudentForEdit(null);
  };

  const handleCloseObjectiveModal = () => {
    setShowObjectiveModal(false);
    setSelectedObjectiveForEdit(null);
  };

  // Navigation handlers
  const navigateToView = (viewType, data = null) => {
    setViewStack(prev => [...prev, { type: currentView, data: { student: selectedStudent, objective: selectedObjective } }]);
    setCurrentView(viewType);
    
    if (viewType === VIEW_TYPES.STUDENT) {
      setSelectedStudent(data);
      setSelectedObjective(null);
    } else if (viewType === VIEW_TYPES.OBJECTIVE) {
      setSelectedObjective(data);
    }
  };

  const navigateBack = () => {
    if (viewStack.length === 0) return;
    
    const previousView = viewStack[viewStack.length - 1];
    setViewStack(prev => prev.slice(0, -1));
    setCurrentView(previousView.type);
    
    if (previousView.type === VIEW_TYPES.STUDENT) {
      setSelectedStudent(previousView.data.student);
      setSelectedObjective(null);
    } else if (previousView.type === VIEW_TYPES.OBJECTIVE) {
      setSelectedObjective(previousView.data.objective);
    } else {
      setSelectedStudent(null);
      setSelectedObjective(null);
    }
  };

  // Data fetching
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
      setStudents(data);

      // Update selected student and objective if they exist
      if (selectedStudent) {
        const updatedStudent = data.find(s => s.id === selectedStudent.id);
        setSelectedStudent(updatedStudent);
      }
      
      if (selectedObjective) {
        const updatedStudent = data.find(s => s.id === selectedObjective.student_id);
        if (updatedStudent) {
          const updatedObjective = updatedStudent.objectives?.find(o => o.id === selectedObjective.id);
          setSelectedObjective(updatedObjective);
        }
      }
    } catch (err) {
      console.error('Error fetching students:', err);
      setError('Failed to load students. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [session]);

  // Action handlers
  const handleStudentAdded = () => {
    fetchStudents();
  };

  const handleObjectiveAdded = () => {
    fetchStudents();
  };

  const handleDeleteStudent = async (student) => {
    if (!confirm(`Are you sure you want to delete ${student.name}?`)) return;

    try {
      const response = await authorizedFetch(`/students/student/${student.id}`, session?.access_token, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete student');

      if (selectedStudent?.id === student.id) {
        navigateBack();
      }
      
      await fetchStudents();
      toast.success('Student deleted successfully');
    } catch (err) {
      console.error('Error deleting student:', err);
      toast.error('Failed to delete student. Please try again later.');
    }
  };

  const handleDeleteObjective = async (objective) => {
    if (!confirm(`Are you sure you want to delete this objective?`)) return;

    try {
      const response = await authorizedFetch(`/objectives/objective/${objective.id}`, session?.access_token, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete objective');

      if (selectedObjective?.id === objective.id) {
        navigateBack();
      }

      await fetchStudents();
      toast.success('Objective deleted successfully');
    } catch (err) {
      console.error('Error deleting objective:', err);
      toast.error('Failed to delete objective. Please try again later.');
    }
  };

  if (loading) return <LoadingSpinner />;

  // Render the appropriate view based on currentView
  const renderView = () => {
    switch (currentView) {
      case VIEW_TYPES.STUDENT:
        return (
          <StudentView
            student={selectedStudent}
            onBack={navigateBack}
            onAddObjective={() => handleOpenObjectiveModal(null, selectedStudent)}
            onEdit={(student) => handleOpenStudentModal(student)}
            onDelete={handleDeleteStudent}
            onObjectiveClick={(objective) => navigateToView(VIEW_TYPES.OBJECTIVE, objective)}
          />
        );
      case VIEW_TYPES.OBJECTIVE:
        return (
          <ObjectiveView
            objective={selectedObjective}
            onBack={navigateBack}
          />
        );
      default:
        return (
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
                  <Button
                    variant="outline"
                    onClick={() => handleOpenStudentModal()}
                    className="bg-white/10 text-white/80 hover:bg-white/20"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Student
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleOpenObjectiveModal()}
                    className="bg-white/10 text-white/80 hover:bg-white/20"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Objective
                  </Button>
                  <Button variant="ghost" size="icon" className="rounded-full bg-white/10 text-white/80">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
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
                      onAddObjective={() => handleOpenObjectiveModal(null, student)}
                      onClick={() => navigateToView(VIEW_TYPES.STUDENT, student)}
                      onEdit={(student) => handleOpenStudentModal(student)}
                      onDelete={handleDeleteStudent}
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
                    onClick={() => handleOpenStudentModal()}
                    className="bg-white/10 text-white/80 hover:bg-white/20"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Student
                  </Button>
                </div>
              )}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background relative">
      {renderView()}
      {/* Modals */}
      <StudentFormModal
        student={selectedStudentForEdit}
        onSuccess={() => {
          handleStudentAdded();
          handleCloseStudentModal();
        }}
        open={showStudentModal}
        onOpenChange={handleCloseStudentModal}
      />
      <ObjectiveFormModal
        objective={selectedObjectiveForEdit}
        selectedStudentForEdit={selectedStudentForEdit}
        onSuccess={() => {
          handleObjectiveAdded();
          handleCloseObjectiveModal();
        }}
        students={students}
        open={showObjectiveModal}
        onOpenChange={handleCloseObjectiveModal}
        onStudentOpenChange={setShowStudentModal}
      />
    </div>
  );
}
