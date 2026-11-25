import React from 'react';
import { Star, MessageSquare, Globe, Sparkles, Check } from 'lucide-react';
import { Professional } from './teletherapyTypes';

interface BookingCardProps {
  professional: Professional;
  isSelected: boolean;
  isMember: boolean;
  onSelect: () => void;
}

export const BookingCard: React.FC<BookingCardProps> = ({
  professional,
  isSelected,
  isMember,
  onSelect,
}) => {
  const currentPrice = isMember ? professional.memberPrice : professional.nonMemberPrice;

  return (
    <div
      id={`booking-card-${professional.id}`}
      onClick={onSelect}
      className={`border rounded-2xl p-5 cursor-pointer transition-all ${
        isSelected
          ? 'border-primary bg-primary/5 shadow-md shadow-primary/5 scale-[1.01]'
          : 'border-slate-100 hover:border-slate-200 hover:shadow-sm bg-white'
      }`}
    >
      <div className="flex gap-4 items-start">
        {/* Therapist Avatar */}
        <div id="therapist-avatar-container" className="text-4xl bg-slate-50 w-16 h-16 rounded-2xl flex items-center justify-center border border-slate-100 shadow-inner">
          {professional.avatar}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <h4 className="text-md font-black text-slate-900 tracking-tight">
              {professional.name}
            </h4>
            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-black uppercase tracking-wider rounded-md">
              {professional.title}
            </span>
          </div>

          <p className="text-slate-500 text-xs font-medium leading-relaxed mb-3 line-clamp-2">
            {professional.bio}
          </p>

          <div className="flex items-center gap-3 mb-3 flex-wrap">
            <span className="flex items-center gap-1 text-[11px] font-bold text-amber-500">
              <Star className="w-3.5 h-3.5 fill-current" />
              {professional.rating} <span className="text-slate-400 font-medium">({professional.reviewsCount} reviews)</span>
            </span>
            <span className="flex items-center gap-1 text-[11px] font-bold text-slate-500">
              <Globe className="w-3.5 h-3.5 text-slate-400" />
              {professional.languages.join(' / ')}
            </span>
          </div>

          {/* Specialties pills */}
          <div className="flex gap-1.5 flex-wrap mb-4">
            {professional.specialties.map((spec) => (
              <span
                key={spec}
                className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[9px] font-black uppercase tracking-wider rounded"
              >
                {spec}
              </span>
            ))}
          </div>

          {/* Pricing area */}
          <div className="flex items-center justify-between border-t border-slate-50 pt-3">
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-black text-slate-900">${currentPrice}</span>
              <span className="text-[10px] text-slate-500 font-bold uppercase">/Session</span>
            </div>
            
            {isSelected ? (
              <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-primary">
                <Check className="w-3.5 h-3.5" /> Selected
              </span>
            ) : (
              <button
                type="button"
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-primary hover:text-white text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"
              >
                Select Slot
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
