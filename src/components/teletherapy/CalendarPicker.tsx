import React, { useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarPickerProps {
  selectedDate: string; // YYYY-MM-DD
  onDateSelect: (date: string) => void;
}

export const CalendarPicker: React.FC<CalendarPickerProps> = ({
  selectedDate,
  onDateSelect,
}) => {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date(2026, 5, 1)); // Default June 2026 based on timestamp 2026-06

  const daysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const firstDayIndex = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const days = [];
  const totalDays = daysInMonth(currentMonth);
  const startDay = firstDayIndex(currentMonth);

  // Add blank spots for previous month
  for (let i = 0; i < startDay; i++) {
    days.push(null);
  }

  // Add days of the month
  for (let d = 1; d <= totalDays; d++) {
    days.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), d));
  }

  const formatISO = (d: Date) => {
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${month}-${day}`;
  };

  const todayStr = '2026-06-08'; // Grounded today based on environment timestamp

  return (
    <div id="calendar-picker-body" className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-primary/10 text-primary">
            <CalendarIcon className="w-4 h-4" />
          </div>
          <span className="font-black text-slate-800 uppercase tracking-wider text-sm">
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={handlePrevMonth}
            className="p-1.5 rounded-lg hover:bg-slate-50 border border-slate-100 text-slate-500 hover:text-slate-800 transition-all active:scale-90"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleNextMonth}
            className="p-1.5 rounded-lg hover:bg-slate-50 border border-slate-100 text-slate-500 hover:text-slate-800 transition-all active:scale-90"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
          <span key={day} className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
            {day}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => {
          if (!day) {
            return <div key={`empty-${index}`} className="aspect-square" />;
          }

          const isoStr = formatISO(day);
          const isSelected = isoStr === selectedDate;
          const isToday = isoStr === todayStr;
          
          // Custom availability: weekends are unavailable, some week days are available
          const dayOfWeek = day.getDay();
          const isPast = day.getTime() < new Date(2026, 5, 8).getTime(); // June 8th is today
          const isAvailable = !isPast && dayOfWeek !== 0 && dayOfWeek !== 6; 

          return (
            <button
              key={isoStr}
              type="button"
              disabled={!isAvailable}
              onClick={() => onDateSelect(isoStr)}
              className={`aspect-square flex flex-col items-center justify-center rounded-xl text-xs font-bold transition-all relative ${
                isSelected
                  ? 'bg-primary text-white shadow-md shadow-primary/20 scale-105 z-10'
                  : isAvailable
                    ? 'hover:bg-slate-100 text-slate-800'
                    : 'text-slate-200 cursor-not-allowed'
              }`}
            >
              <span>{day.getDate()}</span>
              {isToday && !isSelected && (
                <span className="absolute bottom-1 w-1 h-1 rounded-full bg-primary" />
              )}
              {isAvailable && !isSelected && (
                <span className="absolute top-1 right-1 w-1 h-1 rounded-full bg-emerald-400" />
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-center gap-4 text-[10px] text-slate-500 font-bold uppercase tracking-wider border-t border-slate-50 pt-3">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-emerald-50 border border-emerald-300 flex items-center justify-center">
            <span className="w-1 h-1 rounded-full bg-emerald-400" />
          </span>
          <span>Available</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-primary text-white" />
          <span>Selected</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-slate-50 text-slate-200 border border-slate-100" />
          <span>Unavailable</span>
        </div>
      </div>
    </div>
  );
};
