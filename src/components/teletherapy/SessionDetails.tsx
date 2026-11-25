import React from 'react';
import { Video, Clock, CheckCircle2, AlertCircle, Sparkles, ChevronRight, MessageSquareCode } from 'lucide-react';
import { Booking } from './teletherapyTypes';

interface SessionDetailsProps {
  bookings: Booking[];
  isMember: boolean;
  onJoinCall: (booking: Booking) => void;
  onUpgradeClick?: () => void;
}

export const SessionDetails: React.FC<SessionDetailsProps> = ({
  bookings,
  isMember,
  onJoinCall,
  onUpgradeClick,
}) => {
  const upcomingBookings = bookings.filter((b) => b.status === 'upcoming');
  const pastBookings = bookings.filter((b) => b.status === 'completed' || b.status === 'cancelled');

  const formatDate = (dateStr: string) => {
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const date = new Date(year, month, day);
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div id="session-details-panel" className="space-y-6">
      {/* Dynamic Membership Alert if not member */}
      {!isMember && (
        <div id="premium-booking-incentive" className="flex items-center justify-between p-4 bg-primary/5 border border-primary/20 rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-800">Save up to 40% on Live Calls</h4>
              <p className="text-[11px] text-slate-500 font-bold max-w-sm">Gain member priority booking rates, unlimited customized exercises, and automated voice analysis feedback today.</p>
            </div>
          </div>
          {onUpgradeClick && (
            <button
              onClick={onUpgradeClick}
              className="py-2 px-4 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all"
            >
              Learn More
            </button>
          )}
        </div>
      )}

      {/* Upcoming booking card */}
      <div>
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">
          Upcoming Teletherapy Sessions ({upcomingBookings.length})
        </h3>

        {upcomingBookings.length === 0 ? (
          <div className="p-6 text-center border-2 border-dashed border-slate-100 rounded-2xl bg-white text-slate-400">
            <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-xs font-bold uppercase tracking-wider">No Sessions Booked Yet</p>
            <p className="text-[10px] text-slate-400 mt-1">Select a specialist and time slot below to schedule a call.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingBookings.map((booking) => (
              <div
                key={booking.id}
                id={`upcoming-booking-${booking.id}`}
                className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm hover:border-slate-200 transition-all"
              >
                <div className="flex justify-between items-start flex-wrap gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl p-1 bg-slate-50 rounded-xl border border-slate-100">👩‍⚕️</span>
                    <div>
                      <h4 className="font-black text-slate-900 leading-tight">
                        {booking.professionalName}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                        {booking.professionalTitle}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-wider">
                      <Clock className="w-3.5 h-3.5" /> Booked
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-b border-slate-50 py-3.5 mb-4 text-xs font-bold text-slate-700">
                  <div>
                    <div className="text-[9px] uppercase tracking-widest text-slate-400 mb-0.5">Date</div>
                    <span>{formatDate(booking.date)}</span>
                  </div>
                  <div>
                    <div className="text-[9px] uppercase tracking-widest text-slate-400 mb-0.5">Scheduled Time</div>
                    <span>{booking.time} EST</span>
                  </div>
                </div>

                {booking.notes && (
                  <div className="p-3 bg-slate-50 border border-slate-100/50 rounded-xl mb-4 text-[11px] text-slate-600 font-medium">
                    <strong className="text-slate-900 block font-black uppercase tracking-widest text-[9px] text-slate-400 mb-1">Focus Notes:</strong>
                    "{booking.notes}"
                  </div>
                )}

                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="text-slate-400 text-[10px] font-medium">
                    Price paid: <strong className="text-slate-700 font-black">${booking.pricePaid}</strong> 
                    {booking.isMemberRate && <span className="text-emerald-500 font-black uppercase text-[8px] tracking-wider ml-1">(Member Rate)</span>}
                  </div>
                  <button
                    onClick={() => onJoinCall(booking)}
                    className="py-3 px-6 bg-primary text-white hover:bg-primary-hover shadow-md shadow-primary/20 hover:scale-[1.02] active:scale-95 text-xs font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 group"
                  >
                    <Video className="w-4 h-4 group-hover:rotate-6 transition-transform" />
                    Enter Meeting Room
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Historically completed booking card */}
      {pastBookings.length > 0 && (
        <div>
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">
            Session History
          </h3>
          <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden divide-y divide-slate-50">
            {pastBookings.map((booking) => (
              <div key={booking.id} className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  {booking.status === 'completed' ? (
                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  ) : (
                    <div className="p-2 bg-slate-50 text-slate-400 rounded-xl">
                      <AlertCircle className="w-4 h-4" />
                    </div>
                  )}
                  <div>
                    <h5 className="font-black text-xs text-slate-900">
                      {booking.professionalName}
                    </h5>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                      {formatDate(booking.date)} at {booking.time}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md ${
                    booking.status === 'completed' 
                      ? 'bg-emerald-50 text-emerald-700' 
                      : 'bg-rose-50 text-rose-700'
                  }`}>
                    {booking.status}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
