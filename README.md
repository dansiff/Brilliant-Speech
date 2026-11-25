# Brilliant: Language & Cognitive Learning Platform

Brilliant is a high-performance, accessible learning application designed for language acquisition and cognitive development. It features a modern, "brutalist-chic" design language and a robust full-stack architecture powered by React, Tailwind CSS, and Firebase.

## 🚀 Key Features

- **Personalized Learning**: Dynamically generated exercises based on user preferences and goals.
- **Cognitive Tools**: Specialized "Autism Tools" including social story builders, visual schedules, and focus aids.
- **Marketplace**: A creator economy where users can share and sell custom learning sets.
- **Bilingual Focus**: Multi-language support with specialized matching games for vocabulary retention.
- **Cross-Platform**: PWA support for offline use and "home screen" installation.
- **Command Center (CMS)**: A fully functional administrative board for managing content, users, and marketplace health.

## 🛠 Tech Stack

- **Frontend**: React 18, Vite, TypeScript.
- **Styling**: Tailwind CSS (custom design system).
- **Animations**: Motion (f.k.a. Framer Motion).
- **Backend/Database**: Cloud Firestore.
- **Authentication**: Firebase Auth (Google Login).
- **Icons**: Lucide React.
- **State Management**: React Context & Hooks.

## 📁 Architecture

The application is structured into five cohesive architectural layers to separate concerns, enable high-performance client state management, and support rapid functional scalability.

```text
┌────────────────────────────────────────────────────────┐
│                   PRESENTATION LAYER                   │
│         React 18  •  Tailwind CSS  •  Motion           │
└───────────────────────────┬────────────────────────────┘
                            ▼
┌────────────────────────────────────────────────────────┐
│                    CLINICAL MODULES                    │
│      AAC  •  Voice  •  Language  •  Motor Speech       │
└───────────────────────────┬────────────────────────────┘
                            ▼
┌────────────────────────────────────────────────────────┐
│                    SHARED SERVICES                     │
│    Speech  •  Audio  •  Storage  •  Achievements       │
└───────────────────────────┬────────────────────────────┘
                            ▼
┌────────────────────────────────────────────────────────┐
│                      BROWSER APIs                      │
│      Audio  •  Speech  •  Canvas  •  Storage           │
└───────────────────────────┬────────────────────────────┘
                            ▼
┌────────────────────────────────────────────────────────┐
│                   PERSISTENCE LAYER                    │
│         IndexedDB  •  Cloud Firestore Database         │
└────────────────────────────────────────────────────────┘
```

For a comprehensive breakdown of each layer, detailed module responsibilities, and the complete **Module Dependency Graph**, refer to the [System Architecture Guide](./ARCHITECTURE.md).

### 📂 Directory Structure

```text
src/
├── components/          # UI Components & Clinical View Modules
│   ├── cms/             # Command Center Sub-components & CRM admin portals
│   ├── ui/              # Reusable UI layout blocks & feedback cues
│   └── ...
├── services/            # Shared business logic, notifications, story generators, and AI services
├── hooks/               # Custom lifecycle state hooks (offline-sync, auth context)
├── constants.ts         # App-wide static definitions and clinical target databases
├── types.ts             # Strict, shared TypeScript definitions and schema interfaces
└── App.tsx              # Unified root routing, tab layouts, and state management orchestrator
```

## 🔐 Administration

The application includes a restricted **Command Center** accessible only to authorized administrators (`danielSand711@gmail.com`). Access is managed through `Settings > System Command Center`.

### Security Invariants (Firestore Rules)
- Only authorized admins can list all users.
- Only creators can modify their own marketplace items.
- Public exercises are read-only for standard users but writable for admins.

## 📝 Development

### Build Commands
- `npm run dev`: Start local development server.
- `npm run build`: Production build.
- `npm run lint`: Typescript & ESLint verification.

### Environment Variables
Required variables are defined in `.env.example`. Ensure `GEMINI_API_KEY` is set for AI-powered features.
