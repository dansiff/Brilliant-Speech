import { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Plus, 
  Search, 
  Trash2, 
  Settings, 
  FileText, 
  ChevronRight,
  Database
} from 'lucide-react';
import { Exercise, Difficulty } from '../../types';
import { toast } from 'sonner';

interface ExerciseManagerProps {
  exercises: Exercise[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onEdit: (ex: Exercise) => void;
  onDelete: (id: string) => void;
  onSync: () => void;
  onAddNew: () => void;
  isSyncing: boolean;
}

export const CMSExerciseManager: React.FC<ExerciseManagerProps> = ({ 
  exercises, 
  searchQuery, 
  setSearchQuery, 
  onEdit, 
  onDelete, 
  onSync, 
  onAddNew,
  isSyncing
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 bg-slate-900/50 p-4 rounded-3xl border border-slate-800">
        <div className="flex items-center gap-4 flex-1">
          <div className="bg-slate-950 border border-slate-800 px-4 py-2 rounded-xl flex items-center gap-2 flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="Filter library..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-transparent text-xs text-slate-200 focus:outline-none w-full"
            />
          </div>
          <button 
            onClick={onSync}
            disabled={isSyncing}
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <Database className="w-4 h-4" />
            Sync Constants
          </button>
        </div>
        <button 
          onClick={onAddNew}
          className="bg-primary text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 flex items-center gap-2 hover:scale-105 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          Create New
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {exercises.map((ex) => (
          <motion.div 
            layout
            key={ex.id} 
            className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-6 group hover:border-primary/20 transition-all"
          >
            <div className="w-14 h-14 rounded-xl bg-slate-800 overflow-hidden shrink-0 border border-slate-700">
              <img 
                src={ex.imageUrl} 
                className="w-full h-full object-cover" 
                onError={(e) => (e.currentTarget.src = 'https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?auto=format&fit=crop&q=80&w=100')} 
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <h4 className="font-bold text-white truncate">{ex.title}</h4>
                <span className="text-[8px] font-black uppercase bg-slate-800 px-1.5 py-0.5 rounded text-slate-400 tracking-widest shrink-0">{ex.type}</span>
              </div>
              <p className="text-[10px] text-slate-500 line-clamp-1 font-medium">{ex.category} • {ex.language}</p>
            </div>
            <div className="flex items-center gap-4 shrink-0">
              <div className="text-right hidden sm:block">
                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">LEVEL</p>
                <p className={`text-[10px] font-black uppercase ${ex.difficulty === Difficulty.HARD ? 'text-rose-400' : 'text-emerald-400'}`}>{ex.difficulty}</p>
              </div>
              <div className="h-6 w-[1px] bg-slate-800" />
              <button 
                onClick={() => onEdit(ex)}
                className="p-2 text-slate-500 hover:text-primary transition-colors hover:bg-primary/5 rounded-lg"
              >
                <Settings className="w-4 h-4" />
              </button>
              <button 
                onClick={() => onDelete(ex.id)}
                className="p-2 text-slate-500 hover:text-rose-500 transition-colors hover:bg-rose-500/5 rounded-lg"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}

        {exercises.length === 0 && (
          <div className="py-20 text-center border-2 border-dashed border-slate-800 rounded-[32px]">
            <FileText className="w-12 h-12 text-slate-700 mx-auto mb-4" />
            <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest">No matching records</h3>
          </div>
        )}
      </div>
    </div>
  );
};
