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
import { Users, Plus, MoreHorizontal, Search, X } from 'lucide-react';
import { StudentView } from '@/components/StudentView';
import ObjectiveView from '@/components/ObjectiveView';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import FlowerChain from "@/components/FlowerChain";

export default function StudentsPage() {
  const { session, loading } = useAuth();
  const router = useRouter();
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedObjective, setSelectedObjective] = useState(null);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [showObjectiveModal, setShowObjectiveModal] = useState(false);
  const [selectedStudentForEdit, setSelectedStudentForEdit] = useState(null);
  const [selectedObjectiveForEdit, setSelectedObjectiveForEdit] = useState(null);
  const [loadingStudentIds, setLoadingStudentIds] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!loading && !session) {
      router.replace('/login');
    }
  }, [loading, session, router]);

  const isLoadingDetails = (studentId) => loadingStudentIds.has(studentId);

  // Helper function to format grade level
  const formatGradeLevel = (gradeLevel) => {
    if (!gradeLevel && gradeLevel !== 0) return 'N/A';
    
    const suffixes = ['th', 'st', 'nd', 'rd'];
    const suffix = gradeLevel % 10 < 4 && Math.floor(gradeLevel % 100 / 10) !== 1 
      ? suffixes[gradeLevel % 10] 
      : suffixes[0];
      
    return `${gradeLevel}${suffix} grade`;
  };

  // Filter students based on search query
  const filteredStudents = students.filter(student => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      student.name?.toLowerCase().includes(query) ||
      student.disability_type?.toLowerCase().includes(query) ||
      (student.grade_level !== undefined && formatGradeLevel(student.grade_level).toLowerCase().includes(query))
    );
  });

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
    console.log("Fetching details for student ID:", studentId);
    
    try {
      // First get the basic student details
      const response = await authorizedFetch(`/students/student/${studentId}`, session?.access_token);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch student details: ${response.status}`);
      }
      
      const studentData = await response.json();
      console.log('Student details response:', JSON.stringify(studentData, null, 2));
      
      // Get subject areas with objectives for this student
      const subjectAreasResponse = await authorizedFetch(
        `/subject-areas/student/${studentId}`,
        session?.access_token
      );
      
      // Store subject area data if available for use in enhancing objectives
      let subjectAreasData = [];
      if (subjectAreasResponse.ok) {
        subjectAreasData = await subjectAreasResponse.json();
        console.log('Subject areas count:', Array.isArray(subjectAreasData) ? subjectAreasData.length : 'Not an array');
        console.log('Subject areas response (first few):', 
          JSON.stringify(
            Array.isArray(subjectAreasData) ? 
              subjectAreasData.slice(0, 3) : 
              subjectAreasData, 
            null, 2
          )
        );
      } else {
        console.error('Failed to fetch subject areas:', subjectAreasResponse.status);
      }
      
      // Make sure subject areas are in array format
      if (!Array.isArray(subjectAreasData) && subjectAreasData) {
        subjectAreasData = [subjectAreasData];
      }
      
      // Then get the student's objectives with subject areas and goals included
      const objectivesResponse = await authorizedFetch(
        `/objectives/student/${studentId}?include_details=true`,
        session?.access_token
      );
      
      if (!objectivesResponse.ok) {
        throw new Error(`Failed to fetch student objectives: ${objectivesResponse.status}`);
      }
      
      const objectivesData = await objectivesResponse.json();
      console.log('Objectives count:', Array.isArray(objectivesData) ? objectivesData.length : 'Not an array');
      
      // Find the student in the current students list to get all fields
      const currentStudent = students.find(s => s.id === studentId);
      
      // Ensure we have an array of objectives
      const objectivesArray = Array.isArray(objectivesData) ? objectivesData : [objectivesData].filter(Boolean);
      
      // Map subject areas for easy lookup by ID
      const subjectAreasMap = {};
      subjectAreasData.forEach(area => {
        if (area && area.id) {
          subjectAreasMap[area.id] = area;
        }
      });
      
      // Log area IDs to help with debugging
      console.log('Available subject area IDs:', Object.keys(subjectAreasMap));
      
      // Ensure each objective has the required data for ObjectiveView
      const enhancedObjectives = objectivesArray.map(objective => {
        // Start with the objective data
        const enhancedObj = { ...objective };
        
        // If subject_area and goal are already included, use them
        if (!enhancedObj.subject_area && enhancedObj.subject_area_id) {
          // Try to get subject area from our map
          const areaFromMap = subjectAreasMap[enhancedObj.subject_area_id];
          if (areaFromMap) {
            enhancedObj.subject_area = {
              id: areaFromMap.id,
              name: areaFromMap.name
            };
          } else {
            // Fallback to placeholder
            console.log(`Subject area ID ${enhancedObj.subject_area_id} not found for objective ${enhancedObj.id}`);
            enhancedObj.subject_area = { 
              id: enhancedObj.subject_area_id, 
              name: enhancedObj.subject_area_name || "Unknown Area" 
            };
          }
        }
        
        // Ensure goal info is available
        if (!enhancedObj.goal && enhancedObj.goal_id) {
          // Try to find goal in the subject area data
          let goalFound = false;
          for (const area of subjectAreasData) {
            if (area.goals && Array.isArray(area.goals)) {
              const matchingGoal = area.goals.find(g => g.id === enhancedObj.goal_id);
              if (matchingGoal) {
                enhancedObj.goal = {
                  id: matchingGoal.id,
                  title: matchingGoal.title || matchingGoal.description || "Unknown Goal"
                };
                goalFound = true;
                break;
              }
            }
          }
          
          // Fallback if not found
          if (!goalFound) {
            console.log(`Goal ID ${enhancedObj.goal_id} not found for objective ${enhancedObj.id}`);
            enhancedObj.goal = { 
              id: enhancedObj.goal_id, 
              title: enhancedObj.goal_title || "Unknown Goal" 
            };
          }
        }
        
        return enhancedObj;
      });
      
      // Combine the data, preserving all student fields
      const combinedData = {
        ...currentStudent, // Base data from the students list
        ...studentData,    // Detailed data from the student endpoint
        objectives: enhancedObjectives || [] // Add enhanced objectives
      };
      
      console.log('Combined objectives count:', enhancedObjectives.length);
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
    console.log("Opening student modal for editing:", student?.name || "New Student");
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
    if (!student || !student.id) {
      toast.error('Invalid student data');
      return;
    }

    if (!confirm(`Are you sure you want to delete ${student.name}? This action cannot be undone.`)) {
      return;
    }

    try {
      toast.loading('Deleting student...');
      
      const response = await authorizedFetch(`/students/student/${student.id}`, session?.access_token, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.detail || `Failed to delete student: ${response.status}`);
      }
      
      // If we had the student selected, clear the selection
      if (selectedStudent?.id === student.id) {
        setSelectedStudent(null);
      }
      
      // Refresh the student list
      await fetchStudents();
      
      toast.dismiss();
      toast.success(`Student ${student.name} deleted successfully`);
    } catch (err) {
      console.error('Error deleting student:', err);
      toast.dismiss();
      toast.error(`Failed to delete student: ${err.message}`);
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
    console.log("Objective clicked:", JSON.stringify(objective, null, 2));
    
    // Ensure objective has necessary data for ObjectiveView
    const enhancedObjective = {
      ...objective
    };
    
    if (!objective.subject_area && objective.subject_area_id) {
      // Try to find subject area name from existing data
      const subjectAreaName = objective.subject_area_name || "Unknown Area";
      enhancedObjective.subject_area = {
        id: objective.subject_area_id,
        name: subjectAreaName
      };
    }
    
    if (!objective.goal && objective.goal_id) {
      // Try to find goal title from existing data
      const goalTitle = objective.goal_title || "Unknown Goal";
      enhancedObjective.goal = {
        id: objective.goal_id,
        title: goalTitle
      };
    }
    
    setSelectedObjective(enhancedObjective);
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
      <FlowerChain />
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
        <div className="w-full h-[calc(100vh-200px)] flex flex-col max-w-7xl mx-auto bg-[#e0e0e0] rounded-[20px] p-5 m-12">
          <div className="flex justify-between items-center mb-5">
            <div className="flex items-center gap-2">
              <div className="bg-black rounded-md p-1">
                <Users className="w-5 h-5 text-white" />
              </div>
              <span className="text-[#1a1a1a] font-medium">Students</span>
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
                    className="pl-9 pr-9 py-2 bg-white text-[#1a1a1a] shadow-sm border-gray-200 focus-visible:ring-black placeholder:text-gray-500"
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
                className="bg-black text-white hover:bg-gray-900 flex items-center gap-2 transition-transform hover:scale-105"
              >
                <Plus className="w-4 h-4" />
                Add Student
              </Button>
            </div>
          </div>

          <div className="flex-1 bg-white rounded-[16px] flex flex-col overflow-hidden">
            <div className="grid grid-cols-3 gap-4 p-4 border-b border-[#e0e0e0] font-medium text-[#1a1a1a] sticky top-0 bg-white z-10">
              <div className="col-span-1">Student Name</div>
              <div className="col-span-1">Disability Type</div>
              <div className="col-span-1">Grade Level</div>
            </div>
            <div className="h-full overflow-y-auto hide-scrollbar flex-1">
              {filteredStudents.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-gray-500">
                  {searchQuery ? 'No students match your search' : 'No students found'}
                </div>
              ) : (
                filteredStudents.map((student) => (
                  <div
                    key={student.id}
                    className="grid grid-cols-3 gap-4 p-4 border-b border-[#e0e0e0] hover:bg-[#f0f0f0] transition-colors"
                  >
                    <div className="col-span-1 text-[#1a1a1a] font-medium">{student.name}</div>
                    <div className="col-span-1 text-[#1a1a1a]">{student.disability_type || 'N/A'}</div>
                    <div className="col-span-1 flex items-center justify-between">
                      <span className="text-[#1a1a1a]">{formatGradeLevel(student.grade_level)}</span>
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
      />
      <ObjectiveView
        objective={selectedObjective}
        isOpen={!!selectedObjective}
        onClose={handleBackFromObjective}
      />
    </div>
  );
}
