# Virtual Teletherapy Integration Guide

This directory contains a complete, type-safe, and isolated modular prototype for a **HIPAA-compliant Live Video Session & Scheduling/Booking pipeline**. It was built without overwriting or modifying any of your existing files.

---

## 📅 Proposed Directory Structure

Your new feature is fully self-contained inside `/src/components/teletherapy/`:
```text
src/components/teletherapy/
├── teletherapyTypes.ts  # Shared Type definitions (Professionals, Slots, Bookings, Messages)
├── BookingCard.tsx       # Profile description card for individual therapists
├── CalendarPicker.tsx    # Interactive monthly calendar datepicker
├── PricingModule.tsx     # Double-tier membership pricing calculations and CTA
├── SessionDetails.tsx    # Details of upcoming & completed sessions
├── LiveVideoSession.tsx  # Immersive secure WebRTC layout, call control tray & speech coaching board
├── SessionBooking.tsx    # Orchestrated hub page managing routing state & local database caching
├── apiStubs.ts           # Copy-pasteable Express routes for backend integration
├── index.ts              # Single clean export barrel (barrel exports)
└── INTEGRATION.md        # This integration guideline manual
```

---

## ⚡ Integration Notes (React Client)

To connect this feature to your existing `src/App.tsx` navigation shell, follow these simple, non-destructive steps:

### Step 1: Register the new navigation state inside `src/App.tsx`
Add `'teletherapy'` to your `view` union state variable:
```typescript
// Look for this declaration around line 179 in /src/App.tsx:
const [view, setView] = useState<
  'practice' | 'stories' | 'progress' | 'pricing' | 'settings' | 
  'autism-tools' | 'matching-game' | 'bilingual-match' | 'focus-social' | 
  'lessons' | 'videos' | 'admin-builder' | 'marketplace' | 'privacy-policy' | 
  'admin-cms' | 'teletherapy' // <-- Add 'teletherapy' here!
>('practice');
```

### Step 2: Import the Booking Hub
At the top of `/src/App.tsx`, import your new modular hub:
```typescript
import { SessionBooking } from './components/teletherapy';
```

### Step 3: Render the component inside your view switcher
Find where views are rendered inside `/src/App.tsx` (e.g., around line 4800) and mount the view smoothly inside an animate wrapper:
```typescript
{view === 'teletherapy' && (
  <motion.div
    key="teletherapy"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0 }}
  >
    <SessionBooking 
      user={user} 
      activeChildProfileId={user?.activeProfileId}
      onUpgradeClick={() => setView('pricing')}
      onLoginClick={handleLogin}
    />
  </motion.div>
)}
```

### Step 4: Add landing link
Add a button in your Settings view, Dashboard panel, or Top Nav layout to select the view:
```typescript
<button onClick={() => setView('teletherapy')}>
  Schedule Teletherapy Call
</button>
```

---

## 🛣️ Backend API Integration Checklist (Express.js)

Your Express server file `server.ts` can easily mount the modular routes provided in `/src/components/teletherapy/apiStubs.ts`:

1. At the top of `server.ts`, import the router stub:
   ```typescript
   import { teletherapyApiRouter } from './src/components/teletherapy/apiStubs';
   ```
2. Mount the router underneath your other express API middleware endpoints:
   ```typescript
   app.use('/api/teletherapy', teletherapyApiRouter);
   ```

---

## 🎨 UI/UX Session Flow Description

1. **Clinician Directory**: The user views specialist cards showing titles, rating metrics, biographies, language capabilities, and direct rates.
2. **Access Control (Pricing Module)**:
   - **Members** (Subscribed premium accounts) see a priority rate of **$40 - $50** / session.
   - **Non-Members** see standard rates of **$75 - $95** / session with a persistent call to action explaining membership savings and automated coaching benefits.
3. **Interactive Calendar Picker**: Selecting a clinician updates the calendar dates where green dots label real-time slot vacancies. Choosing a slot locks in the scheduling form.
4. **Checkout and Clinical Memo**: The user submits custom therapeutic focus descriptions (e.g. "Tommy struggles forming alveolar blends"). Clicking Book schedules the session, syncing automatically with Firestore (if logged in) or LocalStorage backup.
5. **Real-time WebRTC Call Stage**: At session time, clicking "Enter Meeting Room" starts the WebRTC secure container. It captures local media feeds, mounts a secure full-stage video frame, displays dual-video feed overlays, establishes chat messengers with automated, responsive clinician coaching feedback, and tracks pronunciation metrics live.
