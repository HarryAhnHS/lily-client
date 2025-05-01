'use client';

import { useAuth } from '@/app/context/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { authorizedFetch } from '@/services/api';
import { StudentFormModal } from '@/components/StudentFormModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { ObjectiveFormModal } from '@/components/ObjectiveFormModal';
import { Users, Plus, MoreHorizontal, Search, X, ArrowUpDown } from 'lucide-react';
import { StudentView } from '@/components/StudentView';
import ObjectiveView from '@/components/ObjectiveView';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';

export default function StudentsPage() {
  const { session, loading } = useAuth();
  const router = useRouter();
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedObjective, setSelectedObjective] = useState(null);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [showObjectiveModal, setShowObjectiveModal] = useState(false);
  const [selectedStudentForEdit, setSelectedStudentForEdit] = useState(null);
  const [selectedObjectiveForEdit, setSelectedObjectiveForEdit] = useState(null);
  const [loadingStudentIds, setLoadingStudentIds] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'updated_at', direction: 'desc' });
  const isLoadingDetails = (studentId) => loadingStudentIds.has(studentId);

  useEffect(() => {
    if (!loading && !session) {
      router.replace('/login');
    }
  }, [loading, session, router]);

  useEffect(() => {
    fetchStudents();
  }, [session]);

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

  // Helper function to format grade level
  const formatGradeLevel = (gradeLevel) => {
    if (!gradeLevel && gradeLevel !== 0) return 'N/A';
    
    const suffixes = ['th', 'st', 'nd', 'rd'];
    const suffix = gradeLevel % 10 < 4 && Math.floor(gradeLevel % 100 / 10) !== 1 
      ? suffixes[gradeLevel % 10] 
      : suffixes[0];
      
    return `${gradeLevel}${suffix} grade`;
  };

  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (err) {
      return 'N/A';
    }
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Filter students based on search query and sort them
  const filteredAndSortedStudents = students
    .filter(student => {
      if (!searchQuery.trim()) return true;
      
      const query = searchQuery.toLowerCase();
      return (
        student.name?.toLowerCase().includes(query) ||
        student.disability_type?.toLowerCase().includes(query) ||
        (student.grade_level !== undefined && formatGradeLevel(student.grade_level).toLowerCase().includes(query))
      );
    })
    .sort((a, b) => {
      if (sortConfig.key === 'name') {
        const nameA = (a.name || '').toLowerCase();
        const nameB = (b.name || '').toLowerCase();
        return sortConfig.direction === 'asc' 
          ? nameA.localeCompare(nameB)
          : nameB.localeCompare(nameA);
      } else if (sortConfig.key === 'updated_at') {
        const dateA = a.updated_at ? new Date(a.updated_at) : new Date(0);
        const dateB = b.updated_at ? new Date(b.updated_at) : new Date(0);
        return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;
      }
      return 0;
    });

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
      
      // Then get the student's objectives with subject areas and goals included
      const objectivesResponse = await authorizedFetch(
        `/objectives/student/${studentId}?include_details=true`,
        session?.access_token
      );
      
      if (!objectivesResponse.ok) {
        throw new Error(`Failed to fetch student objectives: ${objectivesResponse.status}`);
      }
      
      const objectivesData = await objectivesResponse.json();
      console.log('Objectives response:', objectivesData);
      
      // Find the student in the current students list to get all fields
      const currentStudent = students.find(s => s.id === studentId);
      
      // Ensure each objective has the required data for ObjectiveView
      const enhancedObjectives = objectivesData.map(objective => {
        // If subject_area and goal are already included, return as is
        if (objective.subject_area && objective.goal) {
          return objective;
        }
        
        // Otherwise, ensure we have placeholders to prevent errors in ObjectiveView
        return {
          ...objective,
          subject_area: objective.subject_area || { 
            id: objective.subject_area_id, 
            name: "Loading..." 
          },
          goal: objective.goal || { 
            id: objective.goal_id, 
            title: "Loading..." 
          }
        };
      });
      
      // Combine the data, preserving all student fields
      const combinedData = {
        ...currentStudent, // Base data from the students list
        ...studentData,    // Detailed data from the student endpoint
        objectives: enhancedObjectives || [] // Add enhanced objectives
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

  const handleStudentAdded = async () => {
    await fetchStudents();

    console.log("handleStudentAdded, students:", students);
    
    // If we were editing the currently selected student, refresh it
    if (selectedStudentForEdit && selectedStudent && selectedStudentForEdit.id === selectedStudent.id) {
      try {
        const response = await authorizedFetch(`/students/student/${selectedStudentForEdit.id}`, session?.access_token);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch updated student details: ${response.status}`);
        }
        
        const updatedStudentData = await response.json();
        
        const [updatedStudent] = updatedStudentData; // destructure first object
        console.log("handleStudentAdded, updated student data:", updatedStudent);
        setSelectedStudent(prev => ({
          ...prev,
          ...updatedStudent
        }));
        console.log("handleStudentAdded, in student view after call, selectedStudent:", selectedStudent);
      } catch (err) {
        console.error('Error refreshing student after edit:', err);
        toast.error('Failed to refresh student data. Please try again later.');
      }
    }
    
    handleCloseStudentModal();
  };

  const handleObjectiveAdded = async () => {
    await fetchStudents();
    
    // Refresh objectives if we have a selected student
    if (selectedStudent) {
      try {
        // Get the updated objectives
        const objectivesResponse = await authorizedFetch(
          `/objectives/student/${selectedStudent.id}?include_details=true`,
          session?.access_token
        );
        
        if (!objectivesResponse.ok) {
          throw new Error(`Failed to fetch updated objectives: ${objectivesResponse.status}`);
        }
        
        const updatedObjectives = await objectivesResponse.json();
        
        // Update the selected student with the new objectives
        setSelectedStudent(prevStudent => ({
          ...prevStudent,
          objectives: updatedObjectives
        }));
        
        // If we were editing the currently viewed objective, update that too
        if (selectedObjectiveForEdit && selectedObjective && selectedObjectiveForEdit.id === selectedObjective.id) {
          const updatedObjective = updatedObjectives.find(obj => obj.id === selectedObjective.id);
          if (updatedObjective) {
            setSelectedObjective(updatedObjective);
          }
        }
      } catch (err) {
        console.error('Error refreshing objectives after edit:', err);
        toast.error('Failed to refresh objective data. Please try again later.');
      }
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

  const handleObjectiveClick = (objective) => {
    console.log("Objective clicked:", objective.id);
    setSelectedObjective(objective);
  };

  const handleBackFromObjective = () => {
    setSelectedObjective(null);
  };

  useEffect(() => {
    console.log("selectedObjective state changed:", selectedObjective);
  }, [selectedObjective]);

  if (loading || isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="min-h-screen relative">
      {selectedStudent ? (
        <StudentView
          student={selectedStudent}
          onBack={() => setSelectedStudent(null)}
          onAddObjective={(student) => handleOpenObjectiveModal(null, student)}
          onEditStudent={handleOpenStudentModal}
          onDeleteStudent={handleDeleteStudent}
          onEditObjective={(objective) => handleOpenObjectiveModal(objective, selectedStudent)}
          onDeleteObjective={handleDeleteObjective}
          onObjectiveClick={handleObjectiveClick}
        />
      ) : (
        <div className="w-full h-[calc(100vh-200px)] flex flex-col max-w-7xl mx-auto bg-[var(--soft-primary)] rounded-[24px] p-5 m-12">
          <div className="flex justify-between items-center mb-5">
            <div className="flex items-center gap-2">
              <div className="rounded-md p-1">
                <Users className="w-5 h-5" />
              </div>
              <span className="font-medium">Students</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative w-64">
                <div className="relative flex items-center">
                  <Search className="h-4 w-4 absolute left-3 text-muted-foreground pointer-events-none" />
                  <Input
                    type="text"
                    placeholder="Search students..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-9 py-2 bg-background text-foreground shadow-sm focus-visible:ring-foreground"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
              <Button
                onClick={() => handleOpenStudentModal()}
                variant="outline"
                className="flex items-center gap-2 transition-transform"
              >
                <Plus className="w-4 h-4" />
                Add Student
              </Button>
            </div>
          </div>

          <div className="flex-1 bg-background rounded-[16px] flex flex-col overflow-hidden border border-border shadow-sm">
            <div className="grid grid-cols-4 gap-4 p-4 border-b border-border font-medium text-emphasis-high sticky top-0 bg-[var(--surface-raised)] z-10">
              <div className="col-span-1">
                <Button
                  variant="ghost"
                  onClick={() => handleSort('name')}
                  className="flex items-center gap-1 p-0 h-auto font-medium text-emphasis-high hover:bg-transparent"
                >
                  Student Name
                  <ArrowUpDown className="h-4 w-4 ml-1" />
                </Button>
              </div>
              <div className="col-span-1">Disability Type</div>
              <div className="col-span-1">Grade Level</div>
              <div className="col-span-1">
                <Button
                  variant="ghost"
                  onClick={() => handleSort('updated_at')}
                  className="flex items-center gap-1 p-0 h-auto font-medium text-emphasis-high hover:bg-transparent"
                >
                  Last Updated
                  <ArrowUpDown className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
            <div className="h-full overflow-y-auto hide-scrollbar flex-1">
              {filteredAndSortedStudents.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-muted-foreground">
                  {searchQuery ? 'No students match your search' : 'No students found'}
                </div>
              ) : (
                filteredAndSortedStudents.map((student) => (
                  <div
                    key={student.id}
                    onClick={() => !isLoadingDetails(student.id) && fetchStudentDetails(student.id)}
                    className={`grid grid-cols-4 gap-4 p-4 border-b border-border hover:bg-primary/10 transition-colors cursor-pointer ${isLoadingDetails(student.id) ? 'opacity-70 pointer-events-none' : ''}`}
                  >
                    <div className="col-span-1 text-emphasis-high font-medium">{student.name}</div>
                    <div className="col-span-1 text-emphasis-medium">{student.disability_type || 'N/A'}</div>
                    <div className="col-span-1 text-emphasis-medium">{formatGradeLevel(student.grade_level)}</div>
                    <div className="col-span-1 flex items-center justify-between">
                      <span className="text-emphasis-medium">{formatDate(student.updated_at)}</span>
                      <div className="flex items-center gap-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <button className="text-emphasis-high p-1 hover:bg-[var(--interactive-hover)] rounded-md">
                              <MoreHorizontal className="w-5 h-5" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenStudentModal(student);
                              }}
                              className="cursor-pointer"
                            >
                              Edit Student
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteStudent(student);
                              }}
                              className="cursor-pointer text-[var(--status-error)] hover:bg-[var(--status-error)]/10"
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
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
        onStudentOpenChange={handleOpenStudentModal}
      />
      <ObjectiveView
        objective={selectedObjective}
        isOpen={!!selectedObjective}
        onClose={handleBackFromObjective}
      />
    </div>
  );
}