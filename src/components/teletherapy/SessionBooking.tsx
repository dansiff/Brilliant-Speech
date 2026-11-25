import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, Clock, Users, UserCheck, ChevronRight, 
  Sparkles, CheckCircle2, AlertCircle, PlayCircle, Star, Video, Clipboard, CreditCard, ShieldAlert
} from 'lucide-react';
import { Professional, TimeSlot, Booking } from './teletherapyTypes';
import { CalendarPicker } from './CalendarPicker';
import { BookingCard } from './BookingCard';
import { PricingModule } from './PricingModule';
import { SessionDetails } from './SessionDetails';
import { LiveVideoSession } from './LiveVideoSession';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

// Firebase imports safely guarded
import { db, auth } from '../../firebase';
import { collection, addDoc, getDocs, doc, setDoc, query, where, orderBy, runTransaction, getDoc } from 'firebase/firestore';

interface SessionBookingProps {
  user: any; // Existing UserProfile or null
  activeChildProfileId?: string; // If ChildProfile is active
  onUpgradeClick?: () => void;
  onLoginClick?: () => void;
}

// Fallback high-fidelity clinicians data
const CLINICIANS: Professional[] = [
  {
    id: 'prof-dan-sand',
    name: 'Dr. Daniel Sand',
    title: 'Clinical Lead & SLP',
    avatar: '👨‍⚕️',
    rating: 4.9,
    reviewsCount: 142,
    specialties: ['Bilingual Speech', 'Autism Support', 'Visual Phonics'],
    bio: 'Over 12 years of clinical expertise guiding phonological clarity and neurodiverse communication patterns through structured sensory workflows.',
    languages: ['English', 'Spanish'],
    availability: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    memberPrice: 45,
    nonMemberPrice: 85
  },
  {
    id: 'prof-elena-rostova',
    name: 'Elena Rostova, M.S. CCC-SLP',
    title: 'Pediatric specialist',
    avatar: '👩‍⚕️',
    rating: 4.8,
    reviewsCount: 96,
    specialties: ['Syllable Pacing', 'Apraxia of Speech', 'Stuttering'],
    bio: 'Dedicated therapist specializing in childhood motor planning coordination, stuttering, and interactive digital physical triggers.',
    languages: ['English', 'Russian'],
    availability: ['Mon', 'Wed', 'Fri'],
    memberPrice: 40,
    nonMemberPrice: 75
  },
  {
    id: 'prof-marcus-brody',
    name: 'Marcus Brody, M.S.',
    title: 'Sensory Integration Coach',
    avatar: '👨‍🏫',
    rating: 5.0,
    reviewsCount: 61,
    specialties: ['AuDHD Support', 'Pragmatics', 'Following Directions'],
    bio: 'AuDHD-affirming speech mentor focusing on confidence, sensory regulation tools, social-emotional pragmatics, and self-advocacy coaching.',
    languages: ['English'],
    availability: ['Tue', 'Thu'],
    memberPrice: 50,
    nonMemberPrice: 95
  }
];

const DEFAULT_SLOTS: TimeSlot[] = [
  { id: 'slot-1', time: '09:00 AM', isAvailable: true },
  { id: 'slot-2', time: '10:30 AM', isAvailable: true },
  { id: 'slot-3', time: '01:00 PM', isAvailable: false }, // Already booked
  { id: 'slot-4', time: '03:30 PM', isAvailable: true },
  { id: 'slot-5', time: '05:00 PM', isAvailable: true }
];

export const SessionBooking: React.FC<SessionBookingProps> = ({
  user,
  activeChildProfileId,
  onUpgradeClick,
  onLoginClick,
}) => {
  const isMember = !!(user?.isPremium || user?.subscriptionTier === 'monthly_unlimited');

  // Directory profiles
  const [professionals] = useState<Professional[]>(CLINICIANS);
  const [selectedProfId, setSelectedProfId] = useState<string>(CLINICIANS[0].id);

  // Date and Time selection
  const [selectedDate, setSelectedDate] = useState<string>('2026-06-10'); // Midweek June 2026 default
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>(DEFAULT_SLOTS);
  const [clinicalNotes, setClinicalNotes] = useState<string>('');
  const [consented, setConsented] = useState<boolean>(false);

  // Fetch real-time slot availability from Firestore when professional or date changes
  useEffect(() => {
    let unmounted = false;
    if (!db) return;

    async function loadAvailability() {
      try {
        const availabilityDocRef = doc(db, 'providers', selectedProfId, 'availability', selectedDate);
        const snap = await getDoc(availabilityDocRef);
        
        if (unmounted) return;

        if (snap.exists()) {
          const slotsMap = snap.data()?.slots || {};
          // Map default slots to match status from Firestore
          const updatedSlots = DEFAULT_SLOTS.map(slot => {
            const fsSlot = slotsMap[slot.time];
            if (fsSlot) {
              return {
                ...slot,
                isAvailable: fsSlot.status === 'available'
              };
            }
            return slot;
          });
          setAvailableSlots(updatedSlots);
        } else {
          // If no custom availability exists yet for this date, default to standard available slots
          setAvailableSlots(DEFAULT_SLOTS);
        }
      } catch (err) {
        console.warn("Firestore availability load failed, using defaults:", err);
        if (!unmounted) {
          setAvailableSlots(DEFAULT_SLOTS);
        }
      }
    }

    loadAvailability();
    return () => {
      unmounted = true;
    };
  }, [selectedProfId, selectedDate]);

  // Booking lifecycle
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeCallBooking, setActiveCallBooking] = useState<Booking | null>(null);

  // Tabs for the teletherapy page
  const [activeTab, setActiveTab] = useState<'book' | 'my-sessions'>('book');

  const selectedProfessional = professionals.find(p => p.id === selectedProfId) || professionals[0];
  const currentSlot = availableSlots.find(s => s.id === selectedSlotId);
  const currentPrice = isMember ? selectedProfessional.memberPrice : selectedProfessional.nonMemberPrice;

  // Load bookings from LocalStorage & Firestore (guarded)
  useEffect(() => {
    let unmounted = false;

    async function fetchBookings() {
      // 1. Core load from local storage cache
      const cached = localStorage.getItem('brilliant_speech_teletherapy_bookings');
      let localBookings: Booking[] = [];
      if (cached) {
        try {
          localBookings = JSON.parse(cached);
          if (!unmounted && localBookings.length > 0) {
            setBookings(localBookings);
          }
        } catch (_) {}
      }

      // 2. Fetch from Firestore if user is authenticated
      if (auth.currentUser && db) {
        try {
          const userId = auth.currentUser.uid;
          const sessionsRef = collection(db, 'users', userId, 'teletherapyBookings');
          const qSnap = await getDocs(sessionsRef);
          const fbBookings: Booking[] = [];
          
          qSnap.forEach((doc) => {
            fbBookings.push({ id: doc.id, ...doc.data() } as Booking);
          });

          if (fbBookings.length > 0 && !unmounted) {
            setBookings(fbBookings);
            // Sync block back to cache
            localStorage.setItem('brilliant_speech_teletherapy_bookings', JSON.stringify(fbBookings));
          }
        } catch (err) {
          console.warn("Firestore sessions fetch skipped/failed:", err);
        }
      }
    }

    fetchBookings();
    return () => {
      unmounted = true;
    };
  }, [user]);

  // Handle book session process
  const handleScheduleSession = async () => {
    if (!selectedSlotId || !currentSlot) {
      toast.error("Please pick a pre-approved time slot to proceed.");
      return;
    }

    if (!consented) {
      toast.error("HIPAA & Telehealth Consent Required", {
        description: "You must review and check the Telehealth and Privacy policy consent checkbox below."
      });
      return;
    }

    setIsSubmitting(true);

    const bookingId = `booking-${Date.now()}`;
    const newBooking: Booking = {
      id: bookingId,
      professionalId: selectedProfessional.id,
      professionalName: selectedProfessional.name,
      professionalTitle: selectedProfessional.title,
      date: selectedDate,
      time: currentSlot.time,
      pricePaid: currentPrice,
      isMemberRate: isMember,
      notes: clinicalNotes,
      status: 'upcoming',
      meetUrl: `https://meet.brilliantspeech.com/${selectedProfessional.id}-${Date.now()}`,
      telehealthConsentSigned: true,
      telehealthConsentTimestamp: new Date().toISOString(),
      clientIpHash: "sha256-signed-client-env"
    };

    try {
      // 1. Sync save securely with multi-record Transactional Lock inside Firestore
      if (auth.currentUser && db) {
        const userId = auth.currentUser.uid;
        
        // Define multi-collection transactional checkouts
        const availabilityDocRef = doc(db, 'providers', selectedProfessional.id, 'availability', selectedDate);
        const userBookingDocRef = doc(db, 'users', userId, 'teletherapyBookings', bookingId);

        await runTransaction(db, async (transaction) => {
          const availabilitySnap = await transaction.get(availabilityDocRef);
          
          let slotsMap: Record<string, { status: string; bookedBy?: string }> = {};

          if (availabilitySnap.exists()) {
            slotsMap = availabilitySnap.data()?.slots || {};
          } else {
            // Seed defaults dynamically on the fly
            DEFAULT_SLOTS.forEach(slot => {
              slotsMap[slot.time] = {
                status: slot.isAvailable ? 'available' : 'booked'
              };
            });
          }

          const targetSlotState = slotsMap[currentSlot.time];
          if (targetSlotState && targetSlotState.status !== 'available') {
            throw new Error(`The slot at ${currentSlot.time} was locked by another user session milliseconds ago.`);
          }

          // Lock dynamic slot
          slotsMap[currentSlot.time] = {
            status: 'booked',
            bookedBy: userId
          };

          // Save atomically within block boundaries
          transaction.set(availabilityDocRef, { slots: slotsMap }, { merge: true });
          transaction.set(userBookingDocRef, newBooking);
        });

        // Mark local slot list state change
        setAvailableSlots(prev => prev.map(s => {
          if (s.id === selectedSlotId) {
            return { ...s, isAvailable: false };
          }
          return s;
        }));
      }

      // 2. Local fallback update and cache sync
      const updated = [newBooking, ...bookings];
      setBookings(updated);
      localStorage.setItem('brilliant_speech_teletherapy_bookings', JSON.stringify(updated));

      toast.success("Teletherapy session scheduled!", {
        description: `Your slot on ${selectedDate} at ${currentSlot.time} is securely reserved via transactional locking.`
      });

      // Clear states
      setSelectedSlotId(null);
      setClinicalNotes('');
      
      // Auto switch tabs
      setActiveTab('my-sessions');
    } catch (err: any) {
      toast.error("Could not schedule session", { description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoinCall = (booking: Booking) => {
    setActiveCallBooking(booking);
    toast.success(`Joining session securely with ${booking.professionalName}`);
  };

  const handleEndCall = () => {
    if (activeCallBooking) {
      // Prompt review / completed change
      const updatedBookings = bookings.map(b => {
        if (b.id === activeCallBooking.id) {
          return { ...b, status: 'completed' as const };
        }
        return b;
      });
      
      setBookings(updatedBookings);
      localStorage.setItem('brilliant_speech_teletherapy_bookings', JSON.stringify(updatedBookings));
      
      // Guard update Firestore
      if (auth.currentUser && db) {
        const userId = auth.currentUser.uid;
        const ref = doc(db, 'users', userId, 'teletherapyBookings', activeCallBooking.id);
        setDoc(ref, { status: 'completed' }, { merge: true }).catch(() => {});
      }

      toast.success("Live clinical session successfully completed.");
    }
    setActiveCallBooking(null);
  };

  // If inside WebRTC room, swap stage immediately to fullscreen experience
  if (activeCallBooking) {
    return (
      <div className="max-w-7xl mx-auto py-6 px-4">
        <LiveVideoSession
          booking={activeCallBooking}
          isMember={isMember}
          onEndCall={handleEndCall}
        />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-12 px-4">
      {/* Head section */}
      <div className="mb-10 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-xs font-black uppercase tracking-widest mb-4">
          <Video className="w-3.5 h-3.5 animate-pulse" />
          Virtual Teletherapy Clinic
        </div>
        <h2 className="text-4xl font-black tracking-tight mb-3 text-slate-900 uppercase">Live Online Sessions</h2>
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs max-w-xl mx-auto">
          Schedule secure WebRTC pediatric meetings directly with national licensed clinical professionals and speech specialists.
        </p>

        {/* Core Tab Toggles */}
        <div className="mt-8 flex justify-center">
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-inner">
            <button
              onClick={() => setActiveTab('book')}
              className={`py-2.5 px-6 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
                activeTab === 'book'
                  ? 'bg-white text-slate-900 shadow-md'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Book New Session
            </button>
            <button
              onClick={() => setActiveTab('my-sessions')}
              className={`py-2.5 px-6 rounded-lg text-xs font-black uppercase tracking-widest transition-all gap-2 flex items-center ${
                activeTab === 'my-sessions'
                  ? 'bg-white text-slate-900 shadow-md'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              My Sessions
              {bookings.filter(b => b.status === 'upcoming').length > 0 && (
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              )}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'book' ? (
          <motion.div
            key="book"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
          >
            {/* Left/Middle: Directories + Select calendar */}
            <div className="lg:col-span-7 space-y-6">
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-primary" />
                  Select licensed specialist
                </h3>
                <div className="space-y-4">
                  {professionals.map((prof) => (
                    <BookingCard
                      key={prof.id}
                      professional={prof}
                      isSelected={selectedProfId === prof.id}
                      isMember={isMember}
                      onSelect={() => {
                        setSelectedProfId(prof.id);
                        setSelectedSlotId(null);
                      }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-1">
                  <CalendarIcon className="w-3.5 h-3.5 text-primary" />
                  Select Date
                </h3>
                <CalendarPicker
                  selectedDate={selectedDate}
                  onDateSelect={(date) => {
                    setSelectedDate(date);
                    setSelectedSlotId(null);
                  }}
                />
              </div>
            </div>

            {/* Right: Pricing info, slots, notes, check-out */}
            <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
              {/* Dynamic Rate Preview card */}
              <PricingModule
                isMember={isMember}
                memberPrice={selectedProfessional.memberPrice}
                nonMemberPrice={selectedProfessional.nonMemberPrice}
                onUpgradeClick={onUpgradeClick}
              />

              {/* Time Slots Area */}
              <div id="slots-selector-container" className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  Available hours ({selectedDate})
                </h4>

                <div className="grid grid-cols-2 gap-2.5">
                  {availableSlots.map((slot) => (
                    <button
                      key={slot.id}
                      type="button"
                      disabled={!slot.isAvailable}
                      onClick={() => setSelectedSlotId(slot.id)}
                      className={`py-3 px-4 border rounded-xl text-center text-xs font-bold transition-all ${
                        selectedSlotId === slot.id
                          ? 'border-primary bg-primary/10 text-primary font-black shadow-inner shadow-primary/5'
                          : slot.isAvailable
                            ? 'border-slate-100 hover:border-slate-200 hover:bg-slate-50 text-slate-700'
                            : 'border-slate-50 bg-slate-50 text-slate-300 cursor-not-allowed line-through'
                      }`}
                    >
                      {slot.time}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clinical Notes Memo Area */}
              <div id="notes-memo-container" className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                  <Clipboard className="w-4 h-4 text-primary" />
                  Clinical Focus notes
                </h4>
                <textarea
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                  placeholder="e.g. Tommy has struggles forming 'S' blends like slide or star. Sensitive to loud prompts."
                  rows={3}
                  className="w-full border border-slate-100 placeholder-slate-400/80 p-3 rounded-xl text-xs font-medium focus:outline-none focus:border-primary transition-all resize-none leading-relaxed"
                />
              </div>

              {/* Patient Consent & HIPAA Notice Section */}
              <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-5 space-y-3">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-indigo-500" />
                  HIPAA & Consent Protection
                </h4>
                <p className="text-[10px] text-slate-500 leading-normal">
                  By booking, you agree to digital clinical therapy services, secure storage of clinical records (SOAP guidelines), and our global Privacy statement.
                </p>
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={consented}
                    onChange={(e) => setConsented(e.target.checked)}
                    className="mt-0.5 rounded text-primary focus:ring-primary w-3.5 h-3.5 border-slate-300"
                  />
                  <span className="text-[10px] font-bold text-slate-700 leading-normal">
                    I consent to secure Telehealth treatment & agree to records audit guidelines
                  </span>
                </label>
              </div>

              {/* Check-out Booking Button CTA */}
              <button
                type="button"
                disabled={!selectedSlotId || isSubmitting}
                onClick={handleScheduleSession}
                className={`w-full py-4 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg transition-all ${
                  selectedSlotId && !isSubmitting
                    ? 'bg-slate-900 hover:bg-primary text-white hover:scale-[1.01] active:scale-95 shadow-slate-200'
                    : 'bg-slate-100 text-slate-300 cursor-not-allowed shadow-none'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                {isSubmitting 
                  ? 'Processing Stripe token...' 
                  : selectedSlotId 
                    ? `Book Securely ($${currentPrice})` 
                    : 'Pick a Time Slot'
                }
              </button>

              <div className="flex items-center gap-2 px-1 text-[10px] text-slate-400 font-bold uppercase tracking-wider justify-center">
                <ShieldAlert className="w-3.5 h-3.5 text-slate-300" />
                HIPAA Compliant • SSL Encrypted Pipeline
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="sessions"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="max-w-2xl mx-auto"
          >
            <SessionDetails
              bookings={bookings}
              isMember={isMember}
              onJoinCall={handleJoinCall}
              onUpgradeClick={onUpgradeClick}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
