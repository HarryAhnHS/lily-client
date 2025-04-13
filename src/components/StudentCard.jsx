import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { MoreHorizontal, Check, Plus, Activity, Pencil, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ObjectiveItem } from './ObjectiveItem';

export function StudentCard({ student, onAddObjective, onClick, onEdit, onDelete, onEditObjective, onDeleteObjective }) {
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

  const handleMoreClick = (e) => {
    // Prevent the card click event from firing when clicking the dropdown
    e.stopPropagation();
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={handleMoreClick}>
            <Button variant="ghost" size="icon" className="text-white/60 hover:text-white/80">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40 bg-black/90 border-white/10">
            <DropdownMenuItem 
              className="text-white/80 focus:text-white focus:bg-white/10 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(student);
              }}
            >
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="text-red-400 focus:text-red-400 focus:bg-white/10 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(student);
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
          <ObjectiveItem
            key={objective.id}
            objective={objective}
            onEdit={(objective) => onEditObjective(objective)}
            onDelete={(objective) => onDeleteObjective(objective)}
          />
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