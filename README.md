# CrashCare – Emergency Assistant

A full-stack mobile application (Expo + React Native) designed to assist car crash victims, offering real-time AI assistance, offline first-aid information, emergency contacts, offline facility coordination, and proximity-based local navigation.

---

## 📂 Project Structure & Folder Brief

The repository is organized as a monorepo workspace managed by `pnpm`. Below is a breakdown of the primary directories and their contributions to the application:

```
crashcare/
├── artifacts/
│   ├── mobile/               ← Expo React Native Mobile Application
│   │   ├── app/
│   │   │   └── (tabs)/
│   │   │       ├── index.tsx       ← Emergency / SOS Screen: One-tap 911 & 112 calling + step guides
│   │   │       ├── assistant.tsx   ← AI Help Screen: Real-time emergency guidance powered by Google Gemini
│   │   │       ├── nearby.tsx      ← Nearby Services: Maps-based locator for towing, body shops, rentals
│   │   │       ├── firstaid.tsx    ← First Aid Guide: Offline index of 14 essential emergency medical guides
│   │   │       ├── contacts.tsx    ← Emergency Contacts: Directory of 46 authority numbers + customizable personal contacts
│   │   │       └── offline.tsx     ← Offline Facilities: Distance-sorted local hospital & authority locator
│   │   ├── constants/
│   │   │   └── colors.ts           ← Dark emergency color palette (Deep navy, ruby red, vibrant teal)
│   │   └── hooks/
│   │       └── useColors.ts        ← Color scheme mapping hook
│   │
│   └── api-server/           ← Backend Express Server
│       └── src/
│           ├── routes/
│           │   ├── emergency.ts    ← POST /api/emergency-chat: Google Gemini streaming completions endpoint
│           │   ├── facilities.ts   ← GET /api/facilities/nearby: GPS proximity-based facility locator (50km)
│           │   └── health.ts       ← GET /api/healthz: Server status check
│           ├── app.ts              ← Express configuration (CORS, body-parser, routes mounting)
│           └── index.ts            ← Server runner (listens on port 8080)
│
├── lib/                      ← Monorepo Shared Libraries
│   ├── integrations-google-gemini-ai-server/ ← Server-side Google Gemini client connection wrappers
│   ├── integrations-google-gemini-ai-react/  ← Client-side React hooks for AI chat messaging & streaming
│   ├── api-spec/                             ← Shared OpenAPI Specification
│   ├── api-client-react/                     ← Auto-generated React Query hooks for the API
│   ├── api-zod/                              ← Shared API payload validation schemas
│   └── db/                                   ← Database access configurations
│
├── package.json              ← Root workspace configuration
├── pnpm-workspace.yaml       ← PNPM workspace monorepo layout configuration
└── tsconfig.base.json        ← Common TypeScript compilation defaults
```

---

## 🔑 API Keys Configuration

To run the AI assistant and the sync locator features, configure the following environment keys in your `artifacts/api-server/.env` file:

| Environment Variable | Description | Default / Example Value | Where to Fetch / Create |
|---|---|---|---|
| `PORT` | Local server port for the Express backend. | `8080` | Local Configuration |
| `SESSION_SECRET` | Secret hash key for session management. | `change-this-to-a-long-random-secret-string` | Generated locally (any random characters) |
| `GOOGLE_GEMINI_API_KEY` | API Key for accessing the Google Gemini model. | `AIzaSy...` | [Google AI Studio Console](https://aistudio.google.com/) |
| `GOOGLE_GEMINI_MODEL` | Google Gemini LLM version used for completions. | `gemini-2.5-flash` | [Gemini Model Options](https://ai.google.dev/models/gemini) |

---

## 🌐 External Services & APIs

The application fetches information from and integrates with the following external endpoints:

| Service / Endpoint | Purpose | Trigger / Action | Offline Fallback? |
|---|---|---|---|
| **Google Gemini API**<br>`https://generativelanguage.googleapis.com` | Powers the conversational AI Help assistant. | User sends text query in the **AI Help** chat tab. | No (Requires active internet connection) |
| **Local Express API**<br>`http://localhost:8080/api/facilities/nearby` | Supplies extra facility coordinates within a 50km radius. | Triggers automatically in background when online + GPS is active, or via manual reload. | Yes (Loads previously synced results from local AsyncStorage) |
| **Browser/Device Geolocation API** | Obtains user's exact current latitude and longitude. | On tab focus (in **Offline** & **Nearby** screens) or when clicking `GPS / Refresh`. | Yes (Defaults to flat list if GPS is disabled or unavailable) |
| **Apple Maps Deep Links**<br>`maps://` | Launches native iOS maps with search parameters. | Tapping a service card in **Nearby Services** on iOS devices. | No (Needs internet to load map tiles) |
| **Google Maps Deep Links**<br>`https://maps.google.com` | Launches Google maps search. | Tapping a service card in **Nearby Services** on Android/Web. | No (Needs internet to load map tiles) |

---

## ⚙️ How it Works: Screen & File Mapping

### 1. SOS Emergency Screen (`app/(tabs)/index.tsx`)
* **Displays**: Huge one-tap calling buttons for **911** and **112** alongside immediate safety advice (hazard lights, engine shutdown, safe exit).
* **Behavior**: Uses React Native's `Linking` library to open the device dialer.

### 2. AI Emergency Help (`app/(tabs)/assistant.tsx`)
* **Displays**: A friendly, responsive chat interface featuring styled message bubbles, a typing indicator, and formatting tags.
* **Behavior**: Calls the Express `/api/emergency-chat` endpoint. Uses Gemini response filters to dynamically strip markdown syntax and render bold titles, structured steps, and final feedback boxes.

### 3. Offline Facilities Locator (`app/(tabs)/offline.tsx`)
* **Displays**: Local hospitals, police, and fire stations grouped by proximity range headers:
  * `0 - 15 km`
  * `15 - 30 km`
  * `30 - 100 km`
  * `100 - 500 km`
  * `500+ km (Closest)`
* **Auto-download (Sync)**: When online, it automatically queries the backend and downloads new coordinate locations within a 50 km radius of the user's location (strictly ignoring duplicates).
* **Refresh Button**: A dedicated button next to the search bar to reload the GPS position and force a fresh coordinate sync.

### 4. Nearby Services (`app/(tabs)/nearby.tsx`)
* **Displays**: Grid of buttons linking to active roadside utilities (Towing Centers, Auto Body Repair, Car Rentals, Hotels).
* **Behavior**: Detects device platform and redirects users directly into Apple Maps or Google Maps searches.

### 5. First Aid & Emergency Contacts (`app/(tabs)/firstaid.tsx`, `app/(tabs)/contacts.tsx`)
* **Displays**: Fully offline medical procedures and emergency agency phone directories.
* **Behavior**: Renders static local configuration files, with support for saving personal emergency contacts locally using `AsyncStorage`.

---

## 🚀 Quick Start Guide

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Set Up Environment Variables
Create `artifacts/api-server/.env` based on `artifacts/api-server/.env.example`, then fill in your `GOOGLE_GEMINI_API_KEY`.

### 3. Start the Backend API Server
```bash
pnpm --filter @workspace/api-server run dev
```

### 4. Launch the Mobile Application
```bash
cd artifacts/mobile
pnpm exec expo start
```
*Press `w` to run directly in your browser, or scan the QR code using the **Expo Go** application on your phone.*

### 5. Launch the Web Application (Go Live)
You can serve the static build directly from the root `index.html` file using any local web server (such as VS Code Live Server).

To serve it using Python in the workspace root:
```bash
python3 -m http.server 5500
```
Then visit **[http://localhost:5500](http://localhost:5500)** to view your live website.

### 6. Rebuilding & Re-exporting the Web Application
If you modify the mobile application source files under `artifacts/mobile/app` and want to update the static website files at the root, run:
```bash
pnpm run export:web
```
This compiles the web app using Expo Web and automatically copies the updated `index.html`, `_expo/` bundle, and assets to the root of the workspace.

