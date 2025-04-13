import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Check, Activity, MoreHorizontal, X } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Pencil, Trash2 } from 'lucide-react';

export function ObjectiveView({ objective, onBack, onEdit, onDelete }) {
  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-black/40 rounded-3xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full bg-white/10 text-white/80 hover:bg-white/20"
                onClick={onBack}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-2xl font-semibold text-white/80">{objective.title || 'Untitled Objective'}</h1>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full bg-white/10 text-white/80 hover:bg-white/20">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40 bg-black/90 border-white/10">
                <DropdownMenuItem 
                  className="text-white/80 focus:text-white focus:bg-white/10 cursor-pointer"
                  onClick={onEdit}
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-red-400 focus:text-red-400 focus:bg-white/10 cursor-pointer"
                  onClick={onDelete}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Content */}
        <div className="max-h-[90vh] overflow-auto">
          <div className="p-6 space-y-6">
            {/* Overview Section */}
            <div className="bg-black/40 rounded-xl p-6 space-y-4">
              <h2 className="text-lg font-medium text-white/80">Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-white/60">Subject Area</p>
                  <p className="text-white/90">{objective.subject_area?.name || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm text-white/60">Objective Type</p>
                  <p className="text-white/90">{objective.objective_type || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm text-white/60">Created</p>
                  <p className="text-white/90">{formatDate(objective.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-white/60">Status</p>
                  <div className="flex items-center gap-2">
                    {objective.completed ? (
                      <div className="w-4 h-4 rounded-full bg-green-500/20 flex items-center justify-center">
                        <Check className="w-3 h-3 text-green-500" />
                      </div>
                    ) : (
                      <div className="w-4 h-4">
                        <Activity className="w-3 h-3 text-white/40" />
                      </div>
                    )}
                    <span className="text-white/90">{objective.completed ? 'Completed' : 'In Progress'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Section */}
            <div className="bg-black/40 rounded-xl p-6 space-y-4">
              <h2 className="text-lg font-medium text-white/80">Progress</h2>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-white/60">Overall Progress</span>
                    <span className="text-sm font-medium text-white/80">
                      {objective.objective_progress || 0}%
                    </span>
                  </div>
                  <Progress value={objective.objective_progress || 0} className="h-2 bg-white/10" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-white/60">Target Accuracy</p>
                    <p className="text-white/90">{objective.target_accuracy || 'Not specified'}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-white/60">Consistency Target</p>
                    <p className="text-white/90">
                      {objective.target_consistency_successes || 0}/{objective.target_consistency_trials || 0} successes
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Description Section */}
            <div className="bg-black/40 rounded-xl p-6 space-y-4">
              <h2 className="text-lg font-medium text-white/80">Description</h2>
              <p className="text-white/90 whitespace-pre-wrap">{objective.description}</p>
            </div>

            {/* Goal Section */}
            <div className="bg-black/40 rounded-xl p-6 space-y-4">
              <h2 className="text-lg font-medium text-white/80">Goal</h2>
              <p className="text-white/90 whitespace-pre-wrap">{objective.goal}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 