'use client';

import { useAuth } from '@/app/context/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { authorizedFetch } from '@/services/api';
import { StudentFormModal } from '@/components/StudentFormModal';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ObjectiveFormModal } from '@/components/ObjectiveFormModal';
import { Users, Plus, MoreHorizontal } from 'lucide-react';
import { StudentView } from '@/components/StudentView';

export default function StudentsPage() {
  const { session, loading } = useAuth();
  const router = useRouter();
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [showObjectiveModal, setShowObjectiveModal] = useState(false);
  const [selectedStudentForEdit, setSelectedStudentForEdit] = useState(null);
  const [selectedObjectiveForEdit, setSelectedObjectiveForEdit] = useState(null);
  const [loadingStudentIds, setLoadingStudentIds] = useState(new Set());

  useEffect(() => {
    if (!loading && !session) {
      router.replace('/login');
    }
  }, [loading, session, router]);

  const isLoadingDetails = (studentId) => loadingStudentIds.has(studentId);

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
    } catch (err) {
      console.error('Error fetching students:', err);
      setError('Failed to load students. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStudentDetails = async (studentId) => {
    if (!session || isLoadingDetails(studentId)) return;
    
    setLoadingStudentIds(prev => new Set([...prev, studentId]));
    
    try {
      // First get the basic student details
      const response = await authorizedFetch(`/students/student/${studentId}`, session?.access_token);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch student details: ${response.status}`);
      }
      
      const studentData = await response.json();
      console.log('Student details response:', studentData);
      
      // Then get the student's objectives
      const objectivesResponse = await authorizedFetch(
        `/objectives/student/${studentId}`,
        session?.access_token
      );
      
      if (!objectivesResponse.ok) {
        throw new Error(`Failed to fetch student objectives: ${objectivesResponse.status}`);
      }
      
      const objectivesData = await objectivesResponse.json();
      console.log('Objectives response:', objectivesData);
      
      // Find the student in the current students list to get all fields
      const currentStudent = students.find(s => s.id === studentId);
      
      // Combine the data, preserving all student fields
      const combinedData = {
        ...currentStudent, // Base data from the students list
        ...studentData,    // Detailed data from the student endpoint
        objectives: objectivesData || [] // Add objectives
      };
      
      console.log('Combined student data:', combinedData);
      setSelectedStudent(combinedData);
    } catch (err) {
      console.error('Error fetching student details:', err);
      toast.error('Failed to load student details. Please try again later.');
      setSelectedStudent(null);
    } finally {
      setLoadingStudentIds(prev => {
        const next = new Set(prev);
        next.delete(studentId);
        return next;
      });
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [session]);

  const handleOpenStudentModal = (student = null) => {
    setSelectedStudentForEdit(student);
    setShowStudentModal(true);
  };

  const handleCloseStudentModal = () => {
    setShowStudentModal(false);
    setSelectedStudentForEdit(null);
  };

  const handleOpenObjectiveModal = (objective = null, student = null) => {
    setSelectedObjectiveForEdit(objective);
    setSelectedStudentForEdit(student);
    setShowObjectiveModal(true);
  };

  const handleCloseObjectiveModal = () => {
    setShowObjectiveModal(false);
    setSelectedObjectiveForEdit(null);
  };

  const handleStudentAdded = () => {
    fetchStudents();
    handleCloseStudentModal();
  };

  const handleObjectiveAdded = async () => {
    await fetchStudents();
    if (selectedStudent) {
      await fetchStudentDetails(selectedStudent.id);
    }
    handleCloseObjectiveModal();
  };

  const handleDeleteStudent = async (student) => {
    if (!confirm(`Are you sure you want to delete ${student.name}?`)) return;

    try {
      const response = await authorizedFetch(`/students/student/${student.id}`, session?.access_token, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete student');
      
      await fetchStudents();
      setSelectedStudent(null);
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

      if (selectedStudent) {
        await fetchStudentDetails(selectedStudent.id);
      }
      toast.success('Objective deleted successfully');
    } catch (err) {
      console.error('Error deleting objective:', err);
      toast.error('Failed to delete objective. Please try again later.');
    }
  };

  if (loading || isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-background relative">
      {selectedStudent ? (
        <StudentView
          student={selectedStudent}
          onBack={() => setSelectedStudent(null)}
          onAddObjective={(student) => handleOpenObjectiveModal(null, student)}
          onEditStudent={handleOpenStudentModal}
          onDeleteStudent={handleDeleteStudent}
          onEditObjective={(objective) => handleOpenObjectiveModal(objective, selectedStudent)}
          onDeleteObjective={handleDeleteObjective}
          onObjectiveClick={() => {}}
        />
      ) : (
        <div className="w-full max-w-5xl mx-auto bg-[#e0e0e0] rounded-[20px] p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <div className="bg-black rounded-md p-1">
                <Users className="w-5 h-5 text-white" />
              </div>
              <span className="text-[#1a1a1a] font-medium">Students</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => handleOpenStudentModal()}
                className="bg-black text-white hover:bg-gray-900 flex items-center gap-2 transition-transform hover:scale-105"
              >
                <Plus className="w-4 h-4" />
                Add Student
              </Button>
            </div>
          </div>

          <div className="bg-white rounded-[16px] overflow-hidden">
            <div className="grid grid-cols-4 gap-4 p-4 border-b border-[#e0e0e0] font-medium text-[#1a1a1a]">
              <div>Student Name</div>
              <div>Disability Type</div>
              <div>Date of Review</div>
              <div>Supervisor Name</div>
            </div>
            
            {students.map((student) => (
              <div
                key={student.id}
                className="grid grid-cols-4 gap-4 p-4 border-b border-[#e0e0e0] hover:bg-[#f0f0f0] transition-colors"
              >
                <div className="text-[#1a1a1a]">{student.name}</div>
                <div className="text-[#1a1a1a]">{student.disability_type || 'N/A'}</div>
                <div className="text-[#1a1a1a]">{new Date(student.review_date).toLocaleDateString() || 'N/A'}</div>
                <div className="flex items-center justify-between">
                  <span className="text-[#1a1a1a]">{student.supervisor_name || 'N/A'}</span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      className="text-[#1a1a1a] hover:bg-[#e0e0e0] flex items-center gap-2 transition-all hover:scale-105"
                      onClick={() => fetchStudentDetails(student.id)}
                      disabled={isLoadingDetails(student.id)}
                    >
                      {isLoadingDetails(student.id) ? (
                        <>
                          <LoadingSpinner className="w-4 h-4" />
                          Loading...
                        </>
                      ) : (
                        'View Details'
                      )}
                    </Button>
                    <button className="text-[#1a1a1a] p-1 hover:bg-[#e0e0e0] rounded-md">
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <StudentFormModal
        open={showStudentModal}
        onOpenChange={handleCloseStudentModal}
        onSuccess={handleStudentAdded}
        student={selectedStudentForEdit}
      />
      <ObjectiveFormModal
        objective={selectedObjectiveForEdit}
        selectedStudentForEdit={selectedStudentForEdit}
        onSuccess={handleObjectiveAdded}
        students={students}
        open={showObjectiveModal}
        onOpenChange={handleCloseObjectiveModal}
      />
    </div>
  );
}
