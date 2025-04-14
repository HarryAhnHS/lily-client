import { Button } from '@/components/ui/button';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function StudentCard({ student, onClick, onEdit, onDelete }) {
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
    e.stopPropagation();
  };

  return (
    <div 
      className="bg-black/40 rounded-xl p-6 space-y-4 cursor-pointer transition-all hover:bg-black/50"
      onClick={onClick}
    >
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <h3 className="text-xl font-semibold text-white/90">{student.name}</h3>
          <div className="flex items-center gap-2 text-sm text-white/60">
            <span>Grade {student.grade_level}</span>
            {student.disability_type && (
              <span>• {student.disability_type}</span>
            )}
          </div>
          <p className="text-sm text-white/60">
            {student.objectives?.length || 0} objectives
          </p>
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
    </div>
  );
} 