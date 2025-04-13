import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Check, Plus, Activity, MoreHorizontal, X } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Pencil, Trash2 } from 'lucide-react';

export function StudentView({ student, onBack, onAddObjective, onEdit, onDelete }) {
  const objectives = student.objectives || [];

  const formatDate = (dateString) => {
    if (!dateString) return 'No sessions yet';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="relative w-full max-w-4xl bg-gradient-to-br from-green-950/50 via-yellow-950/50 to-black backdrop-blur-xl rounded-3xl overflow-hidden">
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
              onClick={() => onEdit(student)}
            >
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="text-red-400 focus:text-red-400 focus:bg-white/10 cursor-pointer"
              onClick={() => onDelete(student)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="max-h-[90vh] overflow-auto">
          <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                <span className="text-xl font-semibold text-white/80">
                  {student.name.charAt(0)}
                </span>
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-white/80">{student.name}</h1>
                <p className="text-sm text-white/60">Last session: {formatDate(student.last_session_date)}</p>
              </div>
            </div>

            {/* Student Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column - Stats */}
              <div className="space-y-6">
                <div className="bg-black/40 rounded-xl p-6 space-y-4">
                  <h2 className="text-lg font-medium text-white/80">Overview</h2>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-white/60">Grade Level</p>
                      <p className="text-white/90">{student.grade || 'Not specified'}</p>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-white/60">Overall Progress</span>
                        <span className="text-sm font-medium text-white/80">
                          {student.progress || 65}%
                        </span>
                      </div>
                      <Progress value={student.progress || 65} className="h-2 bg-white/10" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Objectives */}
              <div className="bg-black/40 rounded-xl p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-medium text-white/80">Objectives</h2>
                  <span className="text-sm text-white/60">
                    {objectives.filter(o => o.completed).length}/{objectives.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {objectives.map((objective) => (
                    <div
                      key={objective.id}
                      className="bg-white/5 rounded-lg p-4 flex items-center justify-between"
                    >
                      <span className="text-sm text-white/80">{objective.description}</span>
                      {objective.completed ? (
                        <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                          <Check className="w-4 h-4 text-green-500" />
                        </div>
                      ) : (
                        <div className="w-6 h-6">
                          <Activity className="w-4 h-4 text-white/40" />
                        </div>
                      )}
                    </div>
                  ))}
                  <Button
                    variant="ghost"
                    className="w-full bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/80"
                    onClick={onAddObjective}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Objective
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 