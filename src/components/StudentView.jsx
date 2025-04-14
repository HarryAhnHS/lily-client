import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Check, Plus, Activity, MoreHorizontal, X, ChevronRight } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Pencil, Trash2 } from 'lucide-react';
import { SortFilterSessionsTable } from '@/components/SortFilterSessionsTable';
import { useState, useEffect } from 'react';
import { authorizedFetch } from '@/services/api';
import { useAuth } from '@/app/context/auth-context';
import { toast } from 'sonner';

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
  const [isLoading, setIsLoading] = useState(true);

  const fetchSessions = async () => {
    if (!session) return;
    
    setIsLoading(true);
    try {
      const response = await authorizedFetch(`/sessions/student/${student.id}`, session?.access_token);
      if (!response.ok) throw new Error('Failed to fetch sessions');
      const data = await response.json();
      setSessions(data);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast.error('Failed to load sessions');
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

  // Group objectives by subject area and goals
  const groupedObjectives = student.objectives?.reduce((acc, objective) => {
    const subjectArea = objective.subject_area;
    const goal = objective.goal;
    
    if (!acc[subjectArea.id]) {
      acc[subjectArea.id] = {
        name: subjectArea.name,
        goals: {}
      };
    }
    
    if (!acc[subjectArea.id].goals[goal.id]) {
      acc[subjectArea.id].goals[goal.id] = {
        title: goal.title,
        objectives: []
      };
    }
    
    acc[subjectArea.id].goals[goal.id].objectives.push(objective);
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="relative w-full max-w-6xl bg-gradient-to-br from-green-950/50 via-yellow-950/50 to-black backdrop-blur-xl rounded-3xl overflow-hidden">
        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="absolute right-4 top-4 rounded-full bg-white/10 text-white/80 hover:bg-white/20 z-10"
        >
          <X className="h-4 w-4" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="absolute right-14 top-4 rounded-full bg-white/10 text-white/80 hover:bg-white/20">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40 bg-black/90 border-white/10">
            <DropdownMenuItem 
              className="text-white/80 focus:text-white focus:bg-white/10 cursor-pointer"
              onClick={() => onEditStudent(student)}
            >
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="text-red-400 focus:text-red-400 focus:bg-white/10 cursor-pointer"
              onClick={() => onDeleteStudent(student)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="max-h-[90vh] overflow-auto">
          <div className="p-6 space-y-6">
            {/* Header with Student Details */}
            <div className="bg-black/40 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                  <span className="text-xl font-semibold text-white/80">
                    {student.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <h1 className="text-2xl font-semibold text-white/80">{student.name}</h1>
                  <p className="text-sm text-white/60">Created on {formatDate(student.created_at)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-white/60">Grade Level</p>
                  <p className="text-white/90">Grade {student.grade_level}</p>
                </div>
                <div>
                  <p className="text-sm text-white/60">Disability Type</p>
                  <p className="text-white/90">{student.disability_type || 'None specified'}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-white/60 mb-2">Summary</p>
                <p className="text-white/90 bg-white/5 rounded-lg p-4">
                  {student.summary || 'No summary available'}
                </p>
              </div>
            </div>

            {/* Goals and Objectives Hierarchy */}
            <div className="bg-black/40 rounded-xl p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-white/80">Goals & Objectives</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onAddObjective(student)}
                  className="bg-white/5 text-white/80 hover:bg-white/10"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Objective
                </Button>
              </div>

              <div className="space-y-6">
                {Object.entries(groupedObjectives || {}).map(([subjectAreaId, subjectArea]) => (
                  <div key={subjectAreaId} className="space-y-2">
                    <h3 className="text-md font-medium text-white/80 mb-2">{subjectArea.name}</h3>
                    <div className="space-y-4 pl-4">
                      {Object.entries(subjectArea.goals).map(([goalId, goal]) => (
                        <div key={goalId} className="space-y-2">
                          <h4 className="text-sm font-medium text-white/70 flex items-center">
                            <ChevronRight className="h-4 w-4 mr-1" />
                            {goal.title}
                          </h4>
                          <div className="space-y-2 pl-6">
                            {goal.objectives.map((objective) => (
                              <div
                                key={objective.id}
                                className="bg-white/5 rounded-lg p-3 flex items-center justify-between group cursor-pointer hover:bg-white/10"
                                onClick={() => onObjectiveClick(objective)}
                              >
                                <span className="text-sm text-white/80">{objective.description}</span>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="h-6 w-6 rounded-full bg-white/10 text-white/80 hover:bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <MoreHorizontal className="h-3 w-3" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-40 bg-black/90 border-white/10">
                                    <DropdownMenuItem 
                                      className="text-white/80 focus:text-white focus:bg-white/10 cursor-pointer"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onEditObjective(objective);
                                      }}
                                    >
                                      <Pencil className="h-4 w-4 mr-2" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                      className="text-red-400 focus:text-red-400 focus:bg-white/10 cursor-pointer"
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
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                
                {(!student.objectives || student.objectives.length === 0) && (
                  <div className="text-center py-8 text-white/60">
                    No objectives yet. Click "Add Objective" to get started.
                  </div>
                )}
              </div>
            </div>

            {/* Sessions Table */}
            <div className="bg-black/40 rounded-xl p-6 space-y-4">
              <h2 className="text-lg font-medium text-white/80">Sessions</h2>
              <SortFilterSessionsTable 
                sessions={sessions}
                showActions={true}
                onSuccess={fetchSessions}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 