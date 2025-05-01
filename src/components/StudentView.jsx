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
    if (!session || !student?.id) return;
    
    setIsLoadingAreas(true);
    try {
      console.log("Fetching subject areas for student ID:", student.id);
      
      const response = await authorizedFetch(
        `/subject-areas/student/${student.id}`,
        session?.access_token
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch subject areas');
      }
      
      const data = await response.json();
      console.log("Subject areas response:", JSON.stringify(data, null, 2));
      
      // Process the data structure from the API
      let processedAreas = [];
      
      // Handle the possible structure that comes from the API
      if (Array.isArray(data)) {
        processedAreas = data.map(area => {
          // Check if objectives is an array on the area
          if (area.objective && Array.isArray(area.objective)) {
            // Map the objectives structure to match what we need
            return {
              ...area,
              objectives: area.objective.map(obj => ({
                ...obj,
                // Ensure required fields for display exist
                id: obj.id,
                description: obj.description || 'No description available',
                subject_area_id: area.id,
                goal_id: obj.goal_id
              }))
            };
          } else if (area.objectives && Array.isArray(area.objectives)) {
            // Use the existing objectives array
            return area;
          } else {
            // No objectives found, return the area with empty objectives
            return {
              ...area,
              objectives: []
            };
          }
        });
      } else if (data && typeof data === 'object') {
        // Handle case where it might not be an array
        console.log("Data is not an array, converting to array");
        processedAreas = [data].map(area => {
          if (area.objective && Array.isArray(area.objective)) {
            return {
              ...area,
              objectives: area.objective
            };
          }
          return area;
        });
      }
      
      // Log all areas before any filtering
      console.log("All processed areas (before filtering):", processedAreas.map(a => a.name));
      
      // Instead of filtering out areas, keep all of them but check if they have objectives
      processedAreas.forEach(area => {
        const hasObjectives = 
          (area.objectives && area.objectives.length > 0) || 
          (area.objective && area.objective.length > 0);
        
        if (!hasObjectives) {
          console.log(`Area ${area.name} (${area.id}) has no objectives, but we'll still display it`);
        }
      });
      
      console.log("Total areas count:", processedAreas.length);
      setSubjectAreas(processedAreas);
      
      // Initialize all areas as deselected
      const initialSelectedAreas = {};
      processedAreas.forEach(area => {
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
    if (student && student.id && session) {
      console.log("Calling fetchSubjectAreas for student:", student.id);
      fetchSubjectAreas();
    }
  }, [student?.id, session]);

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
    <div className="w-full h-[calc(100vh-200px)] flex flex-col max-w-7xl mx-auto bg-[var(--soft-primary)] rounded-[20px] p-5 m-12">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <div className="rounded-md p-1">
            <Users className="w-5 h-5" />
          </div>
          <span className="text-foreground font-medium">Students</span>
        </div>
        <div className="flex items-center gap-4">
          <Button
            onClick={() => onAddObjective(student)}
            variant="outline"
            className="flex items-center gap-2 transition-transform"
          >
            <Plus className="w-4 h-4" />
            Add Objective
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="text-foreground p-1 hover:bg-accent rounded-md">
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={() => onEditStudent(student)}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive hover:bg-destructive/10" onClick={() => onDeleteStudent(student)}>
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
          className="text-emphasis-medium flex items-center gap-1 hover:text-emphasis-high transition-colors duration-200 hover:scale-105 transform p-1 rounded-md"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>
      </div>

      <div className="bg-[var(--soft-secondary)] rounded-[16px] p-4 mb-6 flex-1 overflow-y-auto border border-border">
        <div className="mb-4">
          <h2 className="text-xl font-medium text-emphasis-high">{studentName}</h2>
          <div className="mt-2 grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-emphasis-medium">Grade Level</span>
              <p className="text-emphasis-high">Grade {gradeLevel || 'N/A'}</p>
            </div>
            <div>
              <span className="text-sm text-emphasis-medium">Disability Type</span>
              <p className="text-emphasis-high">{disabilityType || 'Not specified'}</p>
            </div>
          </div>
        </div>

        <div className="overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
          <div className="mb-6">
            <h3 className="font-medium text-emphasis-high mb-2">Student Summary</h3>
            <p className="text-sm text-emphasis-medium">{summary && summary !== "" ? summary : 'Add sessions to dynamically generate an updating summary of the student.'}</p>
          </div>

          <div className="mb-6">
            <div className="mb-4">
              <h3 className="font-medium text-emphasis-high">Areas of Need</h3>
              <p className="text-sm text-emphasis-medium mt-1">Select areas to view objectives</p>
            </div>

            <div className="mb-4">
              <div className="flex flex-wrap gap-2 mb-4">
                {subjectAreas.map((area) => (
                  <button
                    key={area.id}
                    onClick={() => toggleArea(area.id)}
                    className={`px-4 py-2 rounded-md ${
                      selectedAreas[area.id] 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-accent text-emphasis-high hover:bg-primary/10"
                    } transition-colors`}
                  >
                    {area.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4 overflow-y-auto hide-scrollbar">
              {subjectAreas.map((area) => (
                selectedAreas[area.id] && (
                  <div key={area.id} className="mb-4">
                    <h4 className="text-emphasis-high font-medium mb-2">{area.name}</h4>
                    <div className="space-y-2">
                      {(area.objectives || area.objective || []).length > 0 ? (
                        (area.objectives || area.objective || []).map((objective) => (
                          <div
                            key={objective.id}
                            className="bg-[var(--surface-subtle)] rounded-md p-3 text-sm text-emphasis-high mb-2 flex justify-between items-center group cursor-pointer hover:bg-primary/10 hover:shadow-sm transition-all border border-border"
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log("Objective clicked:", objective.id, objective);
                              
                              // Enhance objective with area and goal info if needed
                              const enhancedObjective = {
                                ...objective,
                                subject_area_id: objective.subject_area_id || area.id,
                                subject_area: objective.subject_area || { 
                                  id: area.id, 
                                  name: area.name 
                                }
                              };
                              
                              if (objective.goal) {
                                enhancedObjective.goal = objective.goal;
                              } else if (area.goals && area.goals.length > 0) {
                                // Try to find the goal from the area's goals array
                                const matchingGoal = area.goals.find(g => g.id === objective.goal_id);
                                if (matchingGoal) {
                                  enhancedObjective.goal = matchingGoal;
                                }
                              }
                              
                              onObjectiveClick(enhancedObjective);
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
                                    className="text-destructive hover:bg-destructive/10"
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
                        ))
                      ) : (
                        <div className="bg-[var(--surface-subtle)] rounded-md p-3 text-sm text-emphasis-low mb-2 border border-border">
                          No objectives found for this area of need. Click "Add Objective" to create one.
                        </div>
                      )}
                    </div>
                  </div>
                )
              ))}
            </div>

            {(!subjectAreas || subjectAreas.length === 0) && (
              <div className="text-center py-8 text-emphasis-medium">
                No areas of need found for this student. Use "Add Objective" to create objectives which will be organized by area of need.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sessions Table */}
      <div className="h-68 overflow-y-auto hide-scrollbar">
        <SortFilterSessionsTable 
          sessions={sessions}
          showActions={true}
          onSuccess={fetchSessions}
        />
      </div>
    </div>
  );
} 