# Brilliant Systems Architecture & Module Dependency Guide

This document outlines the expanded, multi-layered architecture of the **Brilliant Language & Cognitive Learning Platform**. By decoupling core presentation from business logic, shared utilities, and low-level web capabilities, the platform remains highly modular, robust, and horizontally scalable.

---

## 🏗️ Multi-Layered Architectural Diagram

```text
┌────────────────────────────────────────────────────────────────────────┐
│                          PRESENTATION LAYER                            │
│                                                                        │
│               React 18  •  Tailwind CSS  •  Motion                     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                          CLINICAL MODULES                              │
│                                                                        │
│     [AAC]             [Voice]            [Language]      [Motor Speech]│
│  Grid Boards     Onset & Decibel Meters   Exercises       Pacing Board │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                          SHARED SERVICES                               │
│                                                                        │
│     Speech            Audio              Storage         Achievements  │
│  (TTS/Recognition)  (Analyser/Tones)   (Client Cache)    (XP/Streaks)  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                          BROWSER APIs                                  │
│                                                                        │
│     Audio             Speech             Canvas            Storage     │
│ (AudioContext)   (SpeechSynthesis)   (Render Loops)    (localStorage)  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                          PERSISTENCE LAYER                             │
│                                                                        │
│                 IndexedDB        •        Cloud Firestore              │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 📂 Detailed Layer Breakdown

### 1. Presentation Layer
- **Technologies**: React 18, Vite (bundler), Tailwind CSS (styling), Motion (fluid transitions).
- **Responsibility**: Manages client view-state, routes (active tabs, sensory profiles), and renders responsive components. The presentation layer strictly consumes the underlying clinical modules and is free of raw data manipulations or database queries.

### 2. Clinical Modules
This layer contains highly specialized tools designed for speech-language therapy, autism intervention, and cognitive training:
- **AAC (Augmentative & Alternative Communication)**: Handlers for expressive PECS (Picture Exchange Communication System) grid boards, visual sentence formulation, and category-based navigation.
- **Voice**: Active meters analyzing voice onset and vocal volume dynamics.
- **Language**: Interactive tasks covering vocabulary expansion, receptive/expressive semantic logic, and bilingual pairing.
- **Motor Speech**: Syllabic visual/tactile pacing boards and rhythmic vocal guides to support speech coordination.

### 3. Shared Services
An abstraction layer providing specialized utilities for speech, sound, local tracking, and rewards:
- **Speech Service**: Encapsulates Text-to-Speech (TTS) configuration and handles dynamic language translation/voice lookup parameters.
- **Audio Service**: Manages audio synthesis, sound triggers, pacing metronome tones, and decibel computation.
- **Storage Service**: Controls local caching mechanisms, offline queuing, and synchronization state.
- **Achievements**: Evaluates user activity to award XP, track daily streaks, and record clinical progress benchmarks.

### 4. Browser APIs
Direct system abstractions interacting with low-level web browser interfaces:
- **Audio**: Web Audio API (`AudioContext`, `AnalyserNode`, `BiquadFilterNode`) for real-time microphone stream interception and frequency analysis.
- **Speech**: `SpeechSynthesis` and `SpeechRecognition` interfaces for native voice output and vocalization assessment.
- **Canvas**: High-performance Canvas rendering context for real-time wave drawing and pacing visualizations.
- **Storage**: `localStorage` and `IndexedDB` for low-latency offline cache management.

### 5. Persistence Layer
- **Local Cache (IndexedDB/State)**: Serves as a local-first store to support active exercises offline.
- **Cloud Database (Firestore)**: Persistent, secure remote storage of personalized target profiles, progress logs, user lessons, and shared marketplace assets.

---

## 🔗 Module Dependency Graph

The following graph maps the flow of dependencies across layers. Modules only depend on components within their layer or those directly below them to prevent tight coupling.

```text
 ┌──────────────────────────────────────────────────────────────┐
 │                      CLINICAL MODULES                        │
 └──────┬───────────────┬──────────────────────┬─────────────┬──┘
        │               │                      │             │
        ▼ [Depends on]  ▼ [Depends on]         ▼ [Depends on]▼ [Depends on]
 ┌─────────────┐ ┌─────────────┐        ┌─────────────┐ ┌─────────────┐
 │    [AAC]    │ │   [Voice]   │        │ [Language]  │ │[Motor Speech]
 └──────┬──────┘ └──────┬──────┘        └──────┬──────┘ └──────┬──────┘
        │               │                      │               │
        │               ├──────────────┐       │               │
        │               │              │       │               ├──────────────┐
        ▼               ▼              ▼       ▼               ▼              ▼
 ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
 │   Speech    │ │    Audio    │ │   Canvas    │ │Achievements │ │   Storage   │
 │   Service   │ │   Service   │ │    API      │ │   Service   │ │   Service   │
 └──────┬──────┘ └──────┬──────┘ └──────┬──────┘ └──────┬──────┘ └──────┬──────┘
        │               │               │               │               │
        ▼               ▼               ▼               ▼               ▼
 ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
 │SpeechSynth  │ │AudioContext │ │2D Context   │ │localStorage │ │  Firestore  │
 │    API      │ │AnalyserNode │ │Render Loop  │ │  IndexedDB  │ │  Database   │
 └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘
```

### Module Dependency Details:

1. **AAC Module**
   - **Depends On**:
     - `Speech Service` for dynamic vocal playback of PECS symbols and structured sentences.
     - `Storage Service` to fetch customized grid sets and save dynamic user boards.

2. **Voice Module**
   - **Depends On**:
     - `Audio Service` to process microphone amplitude levels, sound thresholds, and pitch inputs.
     - `Canvas API` to render real-time audio wave graphics and decibel visualization.

3. **Language Module**
   - **Depends On**:
     - `Speech Service` to read out translated targets during bilingual matching exercises.
     - `Achievements Service` to trigger XP awards, log accuracy scores, and update user practice progress upon task completion.
     - `Storage Service` to retrieve curated custom target decks and personalized exercises.

4. **Motor Speech Module**
   - **Depends On**:
     - `Audio Service` to play metronome click cues and rhythmically timed tone prompts.
     - `Achievements Service` to log syllabic pacing accuracy and pace consistency metrics.
     - `Storage Service` to save clinical pacing exercises and user performance feedback.

---

## 🎯 Architectural Scaling Principles

To guarantee that adding new modules or scaling existing components is seamless, development must comply with the following invariants:

1. **Strict Upstream Flow**: Presentation structures do not touch storage nodes directly. Component views communicate with clinical wrappers, which invoke Shared Services to execute persistence.
2. **Failure Isolation**: If a Browser API (e.g., SpeechRecognition) is unavailable or restricted by frame permissions, the corresponding Shared Service must mock a standard callback or fail gracefully without halting other active modules.
3. **PWA Offline Integrity**: Storage Services must first write to the Client Cache (`IndexedDB`/`localStorage`) and queues, then sync asynchronously with Cloud Firestore when network connectivity is verified.

---

## 💾 8. Offline & Synchronization Architecture

For therapeutic applications designed for clinical, classroom, or on-the-go pediatric environments, consistent uptime is a functional requirement. The platform implements an offline-first transactional pipeline to insulate users from intermittent cellular or Wi-Fi connectivity.

### Synchronous & Asynchronous Replication Pipeline

```text
       ┌────────────────────────┐
       │      React App         │
       │  (Component/UX State)  │
       └───────────┬────────────┘
                   │  1. Dispatches Write Action
                   ▼
       ┌────────────────────────┐
       │     Offline Queue      │
       │ (Memory Queue & Log)   │
       └───────────┬────────────┘
                   │  2. Serializes Transaction Log
                   ▼
       ┌────────────────────────┐
       │       IndexedDB        │
       │ (Local Durable Cache)  │
       └───────────┬────────────┘
                   │
                   │  3. Network Link Restored
                   ▼
       ┌────────────────────────┐
       │      Sync Manager      │
       │ (Offline-to-Online Sync)│
       └───────────┬────────────┘
                   │  4. Pushes Transaction Batches
                   ▼
       ┌────────────────────────┐
       │    Cloud Firestore     │
       │ (Distributed Remote DB)│
       └───────────┬────────────┘
                   │
                   │  5. Overlapping Changes Detected
                   ▼
       ┌────────────────────────┐
       │   Conflict Resolver    │
       │ (CRDT / Last-Write-Wins)│
       └───────────┬────────────┘
                   │  6. Generates Audit Backups
                   ▼
       ┌────────────────────────┐
       │      Cloud Backup      │
       │  (Archival Snapshots)  │
       └────────────────────────┘
```

### Architectural Pipeline Components

1. **React App (Presentation State)**: User actions (marking a card, earning an achievement, registering a speech scoring run) alter local UI state instantly. The presentation layer remains responsive and never blocks on database writes.
2. **Offline Queue (Command Log)**: Mutating actions are encapsulated into serialized transaction objects containing vector clocks, atomic sequence identifiers, and operations.
3. **IndexedDB (Local Durable Storage)**: The serialized action log and the active profile state are committed locally to IndexedDB using a lightweight key-value interface. This guarantees absolute data recovery even in the event of hardware power cycles or application crashes.
4. **Sync Manager**: Monitors telemetry changes via a custom hook (`useOnlineStatus`). When a stable network connection is re-established, the Sync Manager flushes outstanding queue operations in an sequential, transaction-safe batch.
5. **Cloud Firestore (Master Cloud DB)**: The remote repository storing master student data, curated marketplace modules, and teletherapy appointments.
6. **Conflict Resolver (CRDT & Last-Write-Wins)**: Uses logical vector clocks alongside UTC metadata timestamps. If a conflict occurs (e.g. a parent edits a profile's avatar offline while a clinician edits the same profile's spelling lists), changes are merged at the attribute level. If overlapping changes affect the same attribute, a deterministic Conflict Resolver applies clinical priority guidelines.
7. **Cloud Backup (Cold Storage)**: Nightly backups are automatically archived for HIPPA compliance, long-term diagnostic tracking, and disaster recovery.

---

## 🧪 9. Testing & Quality Engineering Strategy

To guarantee clinical reliability, safety, and a premium digital experience, the platform enforces a multi-tier automated and human-evaluated testing framework.

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        THERAPIST & UAT GATES                           │
│           Clinical Safety  •  Sensory Stimulus Compliance              │
└───────────────────────────────────▲────────────────────────────────────┘
                                    │
┌───────────────────────────────────┴────────────────────────────────────┐
│                        ACCESSIBILITY & AUDIT                           │
│        WCAG 2.1 AA Checklist  •  ARIA Screen-reader Landmarks          │
└───────────────────────────────────▲────────────────────────────────────┘
                                    │
┌───────────────────────────────────┴────────────────────────────────────┐
│                        END-TO-END AUTOMATION                           │
│          Playwright Workspace Runs  •  Offline Network Mimicry         │
└───────────────────────────────────▲────────────────────────────────────┘
                                    │
┌───────────────────────────────────┴────────────────────────────────────┐
│                    INTEGRATION & SPECIALIZED SIMS                      │
│        Audio Loop Synthesizers  •  Canvas visual-regression            │
└───────────────────────────────────▲────────────────────────────────────┘
                                    │
┌───────────────────────────────────┴────────────────────────────────────┐
│                          UNIT & COMPONENT                              │
│             Vitest Assertions  •  React Testing Library                │
└────────────────────────────────────────────────────────────────────────┘
```

### 1. Unit Testing (Vitest Engine)
- **Scope**: Validating pure utility functions, algorithmic signal calculations, score calculations, and logic blocks.
- **Key Targets**:
  - `audioService.detectPitch()`: Asserting frequency output values across controlled digital sine waves inputs.
  - `achievementService.calculateLevel()`: Verifying XP boundaries, streak increment parameters, and multiplier logic.
  - `storyService.generatePrompt()`: Confirming lexical safety limits and structure parameters of the prompt-building engine.

### 2. Component Testing (React Testing Library)
- **Scope**: Confirming rendering fidelity, state isolation, active theme styles, and internal event triggers.
- **Key Targets**:
  - `ClinicalEvidencePanel`: Mocking module props to verify correct academic reference citations populate under strict modular filters.
  - `DynamicVolumeMeter`: Testing live rendering of decibel thresholds without triggering real browser media microphone prompts.
  - `SettingsView`: Mocking local states to verify toggle switches trigger class modifications on HTML document nodes instantly.

### 3. Audio & Signal Processing Simulation
- **Mechanism**: Standard browser test environments lack physical microphones. To bypass this, the integration test suite instantiates virtual Mock Node Pipelines using the standard Web Audio API.
- **Workflow**:
  1. A virtual oscillator is configured to emit standard sine wave sweeps (e.g., progressive 120Hz to 350Hz sweeps).
  2. The output stream is connected to a virtual `AudioContext` mimicking live microphone captures.
  3. The test suite monitors `VoiceOnsetDecibelMeter` to verify that vocal onset is registered within the exact bounds of the synthetic frequency.

### 4. Canvas Visual Regression & Snapshot Testing
- **Mechanism**: The scrolling Spectrogram and motor-speech pacing boards render content on high-frequency HTML5 canvases.
- **Workflow**:
  1. Automated test tasks mock high-frequency time intervals (e.g., 60 FPS pacing metronome ticks).
  2. Canvas state snapshots are parsed or exported to base64 images at precise timestamp marks.
  3. Visual regression algorithms compare baseline target snapshots against runtime renderings to catch layout overlap, visual flickering, or draw-loop leaks.

### 5. End-to-End Automation (Playwright Suite)
- **Scope**: Evaluating full cross-tab workflows, teletherapy bookings, CRM administration updates, and client onboarding pathways.
- **Key Targets**:
  - **Full-Journey Workflows**: Onboarding a new pediatric client, configuring custom AAC panels, running an articulation module, and verifying clinical achievements log correctly.
  - **Offline Flight Simulation**: Playwright disables browser network adapters mid-exercise to assert that the offline queues hold pending writes and transparently sync them to the server on connection restoration.

### 6. Accessibility & Inclusive Auditing (WCAG 2.1 AA)
- **Scope**: Ensuring students with visual, motor, and cognitive diverse abilities can navigate the system easily.
- **Execution**:
  - Strict keyboard tab indexes are configured on interactive cards, buttons, and items.
  - Screen reader announcements (`aria-live="polite"`) notify users when voice meters reach positive targets or AAC speech triggers playback.
  - Standard automated color contrast checkers ensure all text parameters maintain a robust contrast ratio of at least 4.5:1.

### 7. Clinical & Therapist Acceptance Testing (UAT)
- **Scope**: Final quality gates managed directly by pediatric SLPs and special education professionals.
- **Focus**:
  - **Sensory Safety**: Confirming that turning on "Sensory-Friendly Mode" dampens sudden volume peaks and halts flashing animations to prevent overstimulation.
  - **Cognitive Clarity**: Evaluating PECS grids, language modules, and feedback triggers to confirm cognitive scaffolding is intuitive for developing minds.

---

## ⚡ 10. Performance & Rendering Optimization

To deliver high-frequency, jitter-free therapeutic tools (e.g., real-time audio spectrographs, high-frequency pacing boards, and interactive AAC grids) on standard mobile devices and classroom tablets, the application utilizes specialized performance optimization patterns.

### React Rendering & Memoization Strategy
- **Isolation of High-Frequency State Updates**: Components that experience rapid state changes—such as decibel counters, speech-recognition countdowns, and voice meters—are split into separate leaf nodes. High-frequency state stays local to these nodes to prevent full-tree re-rendering of large layouts like `App.tsx`.
- **Targeted Memoization**: Expensive lists (such as PECS collections or historical session logs) utilize React's `useMemo` hook, referencing primitive dependency arrays. Individual list cards are wrapped with `React.memo` using strict customized comparison functions, ensuring cards only re-render if their content, category, or active state directly transitions.
- **Callback Stabilization**: Interactive callbacks passed down to subcomponents are bound using the `useCallback` hook to guarantee stable reference identities across successive parent render cycles.

### Bundle Sizing & Lazy Loading
- **Dynamic Route-Splitting**: Secondary views and heavy clinical panels (including the administration CRM, clinical evidence reference boards, and comprehensive analytical tables) are decoupled from the core application bundle via standard dynamic imports (`React.lazy`).
- **Suspense Transitions**: Route and panel state changes are wrapped in React `Suspense` containers with high-contrast, sensory-safe skeletons to maintain steady visual pacing.
- **Tree-Shaking**: Heavy external analytical libraries (such as D3, Recharts, and Framer Motion) are imported with selective, named references to enable clean tree-shaking during the production compilation phase (`npm run build`).

### Canvas & Animation Optimization
- **Ramp-Speed Frame Scheduling**: Animation render loops on motor-speech pacing boards and wave visualization containers utilize standard browser `requestAnimationFrame` hooks to lock redraws to native monitor refresh rates.
- **Offscreen Canvas Rendering**: Complex canvas background frames, layout grids, and static guidelines are pre-rendered onto hidden, offscreen canvas instances and copied using `drawImage` during live active cycles. This completely bypasses expensive canvas context recalculations.
- **Sizing Refinement**: Canvas sizes avoid reliance on fluctuating viewport values (`window.innerWidth`) and are instead bound dynamically to the container element via active `ResizeObserver` instances, incorporating light debouncing to safeguard performance during rapid UI resizes.

### Audio Latency Mitigation
- **Context Lazy-Initialization**: Standard browser environments block microphone streams and audio context instantiation on load. The `AudioContext` is lazily instantiated only upon user initiation (e.g., clicking the start button of a verbal exercise).
- **Circular Data Buffering**: For real-time signal analysis (autocorrelation pitch tracking and spectral energy computations), raw floats are written directly to static, circular `Float32Array` buffers. This mitigates memory garbage collection overheads and prevents audio pops or dropouts caused by garbage-collection halts.

---

## 🔒 11. Security, Privacy & Pediatric Compliance

As a pediatric therapeutic and teletherapy system, the platform establishes strong, defense-in-depth safety boundaries protecting sensitive student information, speech audio files, and customized AAC symbols.

### Authentication & Authorization
- **Firebase Auth Configuration**: Client-side authentication uses secure Firebase Authentication flows, validating clinician, educator, and parent credentials. Session states are persisted securely using encrypted local session keys.
- **Document-Level Security Rules**: Firestore read and write actions are protected by granular, user-scoped Security Rules (`firestore.rules`). Clinicians can only query records of patients directly assigned to their sub-clinics, and children can only load profiles associated with their registered guardian accounts.

### Data Storage & IndexedDB Encryption
- **Client Cache Isolation**: All local offline data committed to IndexedDB is stored in scoped tables separated by profile identifiers.
- **In-Memory Encryption**: For enterprise environments requesting high-security compliance, sensitive personal parameters (such as clinical narrative logs and homework diagnostics) undergo localized cryptographic encryption/decryption cycles prior to writing to IndexedDB, using robust client-side key schemes.

### Web Threat & Cross-Site Scripting (XSS) Prevention
- **PECS Input Sanitization**: Custom labels created by parents or clinicians for custom PECS cards are strictly sanitized using character filtering to purge active script blocks, dangerous HTML elements, or executable markup.
- **IFrame Integrity and CSP Headers**: The system operates behind secure Content Security Policy (CSP) configurations restricting document loading, script injection, and iframe frames to authorized secure domains.
- **Error Boundary Sandboxing**: Cross-origin script errors and external frame permissions (such as microphone access constraints) are handled gracefully inside robust global boundaries to prevent complete client termination or diagnostic leaks.

### Secure File Uploads
- **Secure Object Storage**: Custom child profile images and recorded verbal attempts are pushed directly to secure, restricted Cloud Storage buckets.
- **Signed URL Access**: Files are accessed exclusively via temporary, time-bound Signed URLs. Public unauthenticated access is strictly disabled on all clinical storage roots.

### Pediatric Regulatory Compliance
- **HIPAA (Health Insurance Portability and Accountability Act)**:
  - All electronic Protected Health Information (ePHI)—including speech recordings, intelligibility metrics, clinical notes, and patient diagnosis arrays—is encrypted both in transit (using TLS 1.3) and at rest (using AES-256).
  - Clean audit trails track all record creation, modification, and access attempts by clinician profiles.
- **COPPA (Children's Online Privacy Protection Act)**:
  - The application operates with strict parental or school consent checkpoints. No personal identifier data is collected from pediatric patients without verified guardian or school administrator approval.
  - The platform provides parents with the absolute right to review, edit, or request the complete deletion of their child's profile and behavioral data.


