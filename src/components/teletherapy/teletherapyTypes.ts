export interface Professional {
  id: string;
  name: string;
  title: string;
  avatar: string;
  rating: number;
  reviewsCount: number;
  specialties: string[];
  bio: string;
  languages: string[];
  availability: string[]; // e.g. ["Mon", "Wed", "Fri"]
  memberPrice: number; // e.g., 45
  nonMemberPrice: number; // e.g., 85
}

export interface TimeSlot {
  id: string;
  time: string; // e.g. "09:00 AM"
  isAvailable: boolean;
}

export interface Booking {
  id: string;
  professionalId: string;
  professionalName: string;
  professionalTitle: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM AM/PM
  pricePaid: number;
  isMemberRate: boolean;
  notes?: string;
  status: 'upcoming' | 'completed' | 'cancelled';
  meetUrl: string;
  telehealthConsentSigned?: boolean;
  telehealthConsentTimestamp?: string;
  clientIpHash?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'professional' | 'system';
  text: string;
  timestamp: string;
}
