import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Check, Plus, Activity, MoreHorizontal, X, ChevronLeft, Users } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Pencil, Trash2 } from 'lucide-react';
import { SortFilterSessionsTable } from '@/components/SortFilterSessionsTable';
import { useState, useEffect, useMemo } from 'react';
import { authorizedFetch } from '@/services/api';
import { useAuth } from '@/app/context/auth-context';
import { toast } from 'sonner';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export function StudentView({ 
  student, 
  onBack, 
  onAddObjective, 
  onEditStudent, 
  onDeleteStudent, 
  onEditObjective, 
  onDeleteObjective, 
  onObjectiveClick 
}) {
  const { session } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedAreas, setSelectedAreas] = useState({});
  const [subjectAreas, setSubjectAreas] = useState([]);
  const [isLoadingAreas, setIsLoadingAreas] = useState(false);

  // Early return if no student data
  if (!student) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <div className="text-red-500 mb-4">No student data available</div>
        <Button onClick={onBack} variant="outline">
          Go Back
        </Button>
      </div>
    );
  }

  // Fetch subject areas and their goals
  const fetchSubjectAreas = async () => {
    if (!session) return;
    
    setIsLoadingAreas(true);
    try {
      const response = await authorizedFetch(
        `/subject-areas/student/${student.id}`,
        session?.access_token
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch subject areas');
      }
      
      const data = await response.json();
      // Filter to only include subject areas that have objectives
      const areasWithObjectives = data.filter(area => 
        area.objectives && area.objectives.length > 0
      );
      
      setSubjectAreas(areasWithObjectives);
      
      // Initialize all areas as deselected
      const initialSelectedAreas = {};
      areasWithObjectives.forEach(area => {
        initialSelectedAreas[area.id] = false;
      });
      setSelectedAreas(initialSelectedAreas);
    } catch (error) {
      console.error('Error fetching subject areas:', error);
      toast.error('Failed to load areas of need');
    } finally {
      setIsLoadingAreas(false);
    }
  };

  useEffect(() => {
    fetchSubjectAreas();
  }, [student.id, session]);

  const fetchSessions = async () => {
    if (!session) return;
    
    setIsLoading(true);
    try {
      const response = await authorizedFetch(`/sessions/student/${student.id}`, session?.access_token);
      if (!response.ok) {
        console.warn('Sessions not available:', response.status);
        setSessions([]);
        return;
      }
      const data = await response.json();
      setSessions(data || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      setSessions([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [session, student.id]);

  const formatDate = (dateString) => {
    if (!dateString) return 'Not available';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Toggle area selection
  const toggleArea = (areaId) => {
    setSelectedAreas(prev => ({
      ...prev,
      [areaId]: !prev[areaId]
    }));
  };

  // Safe access to student properties with defaults
  const studentName = student.name;
  const gradeLevel = student.grade_level;
  const disabilityType = student.disability_type;
  const reviewDate = student.review_date;
  const supervisorName = student.supervisor_name;
  const createdAt = student.created_at;
  const summary = student.summary;

  return (
    <div className="w-full max-w-4xl mx-auto bg-[#e0e0e0] rounded-[20px] p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <div className="bg-black rounded-md p-1">
            <Users className="w-5 h-5 text-white" />
          </div>
          <span className="text-[#1a1a1a] font-medium">Students</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => onAddObjective(student)}
            className="bg-black text-white hover:bg-gray-900 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Objective
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="text-[#1a1a1a] p-1 hover:bg-[#d0d0d0] rounded-md">
                <MoreHorizontal className="w-6 h-6" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={() => onEditStudent(student)}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem className="text-red-600" onClick={() => onDeleteStudent(student)}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="mb-4">
        <button 
          onClick={onBack} 
          className="text-[#595959] flex items-center gap-1 hover:text-black transition-colors duration-200 hover:scale-105 transform p-1 rounded-md"
        >
          <ChevronLeft className="w-4 h-4" />
          back
        </button>
      </div>

      <div className="bg-[#f0f0f0] rounded-[16px] p-4 mb-6">
        <div className="mb-4">
          <h2 className="text-xl font-medium text-[#1a1a1a]">{studentName}</h2>
          <div className="mt-2 grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-[#595959]">Grade Level</span>
              <p className="text-[#1a1a1a]">Grade {gradeLevel || 'N/A'}</p>
            </div>
            <div>
              <span className="text-sm text-[#595959]">Disability Type</span>
              <p className="text-[#1a1a1a]">{disabilityType || 'Not specified'}</p>
            </div>
          </div>
        </div>

        <div className="max-h-[400px] overflow-y-auto hide-scrollbar">
          <div className="mb-6">
            <h3 className="font-medium text-[#1a1a1a] mb-2">Student Summary</h3>
            <p className="text-sm text-[#1a1a1a]">{summary || 'No summary available'}</p>
          </div>

          <div className="mb-6">
            <div className="mb-4">
              <h3 className="font-medium text-[#1a1a1a]">Areas of Need</h3>
              <p className="text-sm text-[#595959] mt-1">Select areas to view objectives</p>
            </div>

            <div className="mb-4">
              <div className="flex flex-wrap gap-2 mb-4">
                {subjectAreas.map((area) => (
                  <button
                    key={area.id}
                    onClick={() => toggleArea(area.id)}
                    className={`px-4 py-2 rounded-md ${
                      selectedAreas[area.id] ? "bg-black text-white" : "bg-[#d0d0d0] text-[#1a1a1a]"
                    }`}
                  >
                    {area.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {subjectAreas.map((area) => (
                selectedAreas[area.id] && (
                  <div key={area.id} className="mb-4">
                    <h4 className="text-[#1a1a1a] font-medium mb-2">{area.name}</h4>
                    <div className="space-y-2">
                      {area.objectives?.map((objective) => (
                        <div
                          key={objective.id}
                          className="bg-white rounded-md p-3 text-sm text-[#1a1a1a] mb-2 flex justify-between items-center group cursor-pointer hover:bg-gray-100 hover:shadow-md transition-all relative"
                          onClick={(e) => {
                            e.stopPropagation();
                            console.log("Objective clicked:", objective.id);
                            onObjectiveClick(objective);
                          }}
                        >
                          <div className="flex-1 flex items-center">
                            <span>{objective.description}</span>
                          </div>
                          <div onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  className="opacity-0 group-hover:opacity-100"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  onEditObjective(objective);
                                }}>
                                  <Pencil className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="text-red-600"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteObjective(objective);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              ))}
            </div>

            {(!subjectAreas || subjectAreas.length === 0) && (
              <div className="text-center py-8 text-[#595959]">
                No areas of need defined yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sessions Table */}
      <div className="bg-[#f0f0f0] rounded-[16px] p-4">
        <h3 className="font-medium text-[#1a1a1a] mb-4">Sessions</h3>
        <SortFilterSessionsTable 
          sessions={sessions}
          showActions={true}
          onSuccess={fetchSessions}
        />
      </div>
    </div>
  );
} 