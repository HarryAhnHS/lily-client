import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { MoreHorizontal, Check, Plus, Activity } from 'lucide-react';

export function StudentCard({ student, onAddObjective, onClick }) {
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
    <div 
      className="bg-black/40 rounded-xl p-6 space-y-4 cursor-pointer transition-all hover:bg-black/50"
      onClick={onClick}
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-xl font-semibold text-white/90">{student.name}</h3>
          <p className="text-sm text-white/60">{formatDate(student.last_session_date)}</p>
        </div>
        <Button variant="ghost" size="icon" className="text-white/60 hover:text-white/80">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-white/60">Overall Progress:</span>
          <span className="text-sm font-medium text-white/80">
            {student.progress || 65}%
          </span>
        </div>
        <Progress 
          value={student.progress || 65} 
          className="h-2 bg-white/10"
        />
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-white/60">Objectives:</span>
          <span className="text-sm text-white/60">
            {objectives.filter(o => o.completed).length}/{objectives.length}
          </span>
        </div>
        {objectives.map((objective) => (
          <div
            key={objective.id}
            className="bg-white/5 rounded-lg p-3 flex items-center justify-between"
          >
            <span className="text-sm text-white/80">{objective.description}</span>
            {objective.completed ? (
              <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                <Check className="w-3 h-3 text-green-500" />
              </div>
            ) : (
              <div className="w-5 h-5">
                <Activity className="w-3 h-3 text-white/40" />
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
  );
} 