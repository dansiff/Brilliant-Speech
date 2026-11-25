import React from 'react';
import { ChevronDown } from 'lucide-react';

export const NavigationDropdown: React.FC<{
  label: string;
  children: React.ReactNode;
}> = ({ label, children }) => (
  <details className="relative cursor-pointer">
    <summary className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-slate-200 hover:bg-slate-50">
      <span>{label}</span>
      <ChevronDown className="w-4 h-4" />
    </summary>
    <div className="absolute left-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-slate-200 z-10">
      {children}
    </div>
  </details>
);