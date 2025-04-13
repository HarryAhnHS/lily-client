import { Button } from '@/components/ui/button';
import { MoreHorizontal, Check, Activity, Pencil, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from 'react';
import { ObjectiveView } from './ObjectiveView';

export function ObjectiveItem({ objective, onEdit, onDelete }) {
  const [showView, setShowView] = useState(false);

  const handleClick = (e) => {
    e.stopPropagation();
    setShowView(true);
  };

  return (
    <>
      <div
        key={objective.id}
        className="bg-white/5 rounded-lg p-3 flex items-center justify-between group cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          handleClick(e);
        }}
      >
        <span className="text-sm text-white/80">{objective.description}</span>
        <div className="flex items-center gap-2">
          {objective.completed ? (
            <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
              <Check className="w-3 h-3 text-green-500" />
            </div>
          ) : (
            <div className="w-5 h-5">
              <Activity className="w-3 h-3 text-white/40" />
            </div>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="opacity-0 group-hover:opacity-100 transition-opacity text-white/60 hover:text-white/80"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40 bg-black/90 border-white/10">
              <DropdownMenuItem 
                className="text-white/80 focus:text-white focus:bg-white/10 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(objective);
                }}
              >
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-red-400 focus:text-red-400 focus:bg-white/10 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(objective);
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {showView && (
        <ObjectiveView
          objective={objective}
          onBack={() => setShowView(false)}
          onEdit={() => {
            setShowView(false);
            onEdit(objective);
          }}
          onDelete={() => {
            setShowView(false);
            onDelete(objective);
          }}
        />
      )}
    </>
  );
} 