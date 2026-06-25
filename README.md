<div align="center">
  <img src="./assets/icon.png" alt="KisanSaathi Logo" width="120" style="border-radius: 24px; margin-bottom: 16px;" onerror="this.style.display='none'" />
  <h1>🌾 KisanSaathi (किसान साथी)</h1>
  <p><b>The Complete Farm-to-Fork Ecosystem: Empowering Farmers with GenAI, Managing Livestock, and Nourishing Consumers via D2C Marketplace</b></p>
  <br />

  [![React 19](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev)
  [![Firebase](https://img.shields.io/badge/Firebase_Firestore-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com)
  [![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS_v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](#)
  [![Google Gemini 2.5](https://img.shields.io/badge/Gemini_2.5_Flash-8E75B2?style=for-the-badge&logo=google&logoColor=white)](#)
  [![TypeScript 5.8](https://img.shields.io/badge/TypeScript_5.8-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](#)
  [![Node & Express](https://img.shields.io/badge/Express_API-000000?style=for-the-badge&logo=express&logoColor=white)](#)
</div>

---

## 📖 Introduction & Project Vision

**KisanSaathi** (meaning "Farmer's Companion") is a next-generation Agritech and Agri-Fintech platform. It is a highly optimized, dual-sided digital ecosystem designed to bridge the gap between Indian farmers and urban consumers. 

By delivering deep analytical farm-management tools, offline-resilient ledgers, and Gemini-powered visual crop diagnostics directly to **Farmers**, while offering a direct-to-consumer (D2C) fresh produce marketplace for **Consumers**, KisanSaathi removes predatory middlemen, maximizes agricultural crop yields, and simplifies logistics.

### 🌟 Core Value Propositions
*   **For Farmers:** Smart agronomy ledgers, dairy milk yield analytics, NPK soil logs, offline financial tracking, machinery lease management, and instant leaf disease diagnostics powered by Google's Gemini Vision models.
*   **For Consumers:** Direct access to verified regional farmers, chemical-free/organic produce marketplace, monthly/yearly subscription plans to secure fixed prices, and direct parcel logistics tracking.

---

## 🛠️ Unified Architecture & Technology Stack

The platform is built on a full-stack, local-first philosophy that ensures lightning-fast performance in urban centers and fully functional offline capability in low-connectivity rural agricultural zones.

```
                  +----------------------------------------------+
                  |            KisanSaathi React Client          |
                  |  (Tailwind CSS v4 / motion/react / Recharts) |
                  +----------------------+-----------------------+
                                         |
                       [ HTTP / JSON ]   |   [ Reactive Sync / Auth ]
                                         v
                  +----------------------+-----------------------+
                  |         Secure Node/Express Proxy Server     |
                  |   - Hides API Secrets (Gemini, Weather API)  |
                  |   - Compiles server.ts CJS Standalone        |
                  +---------+------------------------+-----------+
                            |                        |
             [ Secure Key ] |         [ API Proxy ]  | [ Secure Auth ]
                            v                        v
                     +------+------+          +------+------+
                     | Google AI   |          | Firebase    |
                     | Gemini API  |          | Firestore / |
                     | (GenAI SDK) |          | Auth Cloud  |
                     +-------------+          +-------------+
```

### 💻 Stack Breakdown
*   **Frontend Library:** **React 19** with strict **TypeScript 5.8** typing.
*   **Build Tooling & Bundling:** **Vite 6** + **ESBuild** (bundling the entire server into a standalone `dist/server.cjs` CJS file to bypass Node's strict ESM runtime requirements).
*   **Styling & Motion:** **Tailwind CSS v4** with **motion/react** delivering 60-FPS fluid layouts, transitions, and micro-interactions.
*   **Charts & Visualizations:** **Recharts** for rendering high-performance, responsive SVG dashboards (milking records, soil health parameters, and financial cashflow).
*   **Database & Persistency:** Dual storage layer:
    *   **Cloud Persistence:** **Firebase Firestore** with live snapshots and standard **Firebase Authentication**.
    *   **Local Caching:** **IndexedDB** (`idb-keyval`) and `localStorage` caching supporting a robust "Local-First" synchronization engine for seamless offline work.
*   **AI/LLM Engine:** Google's official `@google/genai` library pointing server-side to **Gemini 2.5 Flash** for quick diagnostic replies, advisory forecasts, and agricultural image vision.
*   **Report Generation:** **jsPDF** and **jsPDF-AutoTable** for compiling dynamic on-the-fly, offline agricultural performance charts and exporting them as clean PDFs.

---

## 📂 File Directory Structure

```filepath
kisan-saathi/
├── .github/                   # GitHub action CI/CD workflows
├── assets/                    # Project asset files, screens, and design mockups
├── public/                    # Static index files and manifest assets
├── src/                       # Client React application source
│   ├── components/            # Reusable core components
│   │   ├── BrandLogo.tsx      # Standardized KisanSaathi branding visual element
│   │   └── PremiumModal.tsx   # Premium features gate and payments dialog modal
│   ├── db/                    # Local schema definitions and optional relational mapping
│   ├── lib/                   # Utility scripts, hooks, API connectors, and contexts
│   │   ├── api.ts             # Backend proxy communications and weather hooks
│   │   ├── AuthContext.tsx    # Context managing login states, roles, and user caching
│   │   ├── firebase.ts        # Direct Firebase Core, Firestore, and Sync adapters
│   │   ├── i18n.ts            # Multilingual support bindings (English, Hindi, etc.)
│   │   ├── pdfLogo.ts         # Encoded base64 logo vectors for PDF invoice generators
│   │   ├── store.ts           # Shared context stores and UI parameters
│   │   ├── subscription.ts    # SaaS customer premium plans state managers
│   │   └── useNotifications.ts# Native-looking farm notification triggers
│   ├── screens/               # 28 screen files mapping to distinct views (see below)
│   ├── App.tsx                # Client application navigation and routing rules
│   ├── index.css              # Global Tailwind v4 style rules and typography definitions
│   └── main.tsx               # Main React bootstrap mount entrypoint
├── server.ts                  # Secure Monolithic Express Proxy gateway (Gemini & Weather API)
├── metadata.json              # Platform capabilities configuration and frame permissions
├── firestore.rules            # Granular security policies governing cloud Firestore
├── firebase-blueprint.json    # Base structure blueprints for database migrations
├── firebase-applet-config.json# Credentials for development Firebase projects
├── tsconfig.json              # Compilation rules governing TypeScript compilers
├── vite.config.ts             # Vite server configurations and React bundler plugins
└── package.json               # Defined NPM scripts, workspace libraries, and packages
```

---

## 📱 Detailed Tour of All 28 Screen Files

The client UI consists of **28 unique screens** (`src/screens/`), each targeted for specific use-cases within the dual Farmer-Consumer ecosystem.

### 🔐 Onboarding & Security Screens
1.  **`SplashScreen.tsx` (App Welcoming Intro)**  
    Greets users with an ambient greeting animation, showcases the KisanSaathi brand identity, and smooth-navigates towards the Login or Home views depending on active session state.
2.  **`LoginScreen.tsx` (Mobile-First Login)**  
    Supports quick authentication using a mobile phone number and security PIN. Implements robust fallback offline authentication by validating local credentials cached in IndexedDB.
3.  **`RegisterScreen.tsx` (Ecosystem Onboarding)**  
    Onboards new users into the platform. Prompts users for role selection (Farmer vs. Consumer), native language preference (English/Hindi), farm metrics (size, location, soil profile), or shipping addresses.
4.  **`InstallAppScreen.tsx` (PWA Installation Guide)**  
    Guides rural users step-by-step on how to add KisanSaathi to their phone's home screen for fast, offline accessibility.

### 🚜 Farmer Core Dashboards & Agronomy Screens
5.  **`HomeScreen.tsx` (Farmer Command Center)**  
    A beautiful bento-grid dashboard loaded with live crop alerts, upcoming tasks, daily weather indicators, milk yields, financial balances, and quick links to core farm tools.
6.  **`CropsScreen.tsx` (Crop Ledger)**  
    Acts as the digital field manager. Farmers record land area, seed variety, planting dates, and projected harvest dates for multiple parallel crops.
7.  **`CropLogScreen.tsx` (Chronological Growth Journal)**  
    Log events for specific crops (e.g., watering times, fertilizer inputs, weeding, harvest metrics) to build a historic performance log.
8.  **`SoilHealthScreen.tsx` (NPK & Soil Analysis Journal)**  
    Enables tracking of Nitrogen (N), Phosphorus (P), Potassium (K) levels, and pH balances. Displays comparative bar charts to analyze soil fertility over time.
9.  **`DiseaseDetectorScreen.tsx` (Gemini Leaf Pathology)**  
    Upload leaf images directly to identify crop pests and plant diseases. Uses Gemini Vision to parse leaf characteristics and provide targeted treatment recipes.
10. **`WeatherScreen.tsx` (Agro-Meteorological Advisory)**  
    Displays multi-day forecasts, rain probabilities, and custom agricultural advisory alerts (e.g., "Do not spray pesticide today, heavy wind/rain expected in 3 hours").

### 💼 Farmer Finances & Livestock Ledger
11. **`FinanceScreen.tsx` (Agri-Fintech Bookkeeping)**  
    A dual ledger tracking cash flow (revenue vs. expenses) and personal credit/debt loops. Displays intuitive pie charts representing categorical financial performance.
12. **`ReportsScreen.tsx` (PDF Analytics Compiler)**  
    Gathers farm data (financials, crop harvests, dairy yield logs) and builds detailed, downloadable month-end PDF reports for banks, crop insurers, or co-ops.
13. **`DairyScreen.tsx` (Smart Dairy & Livestock Manager)**  
    Digital herd manager. Log milk yields (liters per cow), SNF (Solids-Not-Fat) ratios, fat percentage metrics, and feeding histories.
14. **`InventoryScreen.tsx` (Supplies & Inputs Controller)**  
    Tracks quantities of seed sacks, fertilizers, pesticides, and tools. Triggers visual warning banners when stock fall below custom margins.

### 🚛 Farm Operations & Shared Assets
15. **`TasksScreen.tsx` (Daily Farm Chore Planner)**  
    A dynamic task planner. Farmers track chore categories, prioritize tasks, assign items to specific fields, and check off completed items.
16. **`LaborScreen.tsx` (Crew Management & Payroll)**  
    Manages farm laborers, tracks attendance, assigns field tasks, and records wages/payout ledgers.
17. **`MachineryScreen.tsx` (Equipment Fleet Management)**  
    Log tractor servicing timelines, fuel consumption, and track equipment sharing/rentals between local farm networks.
18. **`LogisticsScreen.tsx` (Supply Chain & Delivery Tracker)**  
    Tracks shipments of harvested yields from the farm gate to regional Mandis or direct consumers, displaying delivery status and carrier contact info.

### 🌐 Market Directories & Policy Directories
19. **`MarketScreen.tsx` (APMC Mandi Rate Tracker)**  
    Pulls live or simulated mandi (government market) commodity prices. Farmers can compare crop rates across regional markets to find the most profitable buyer.
20. **`FarmerDirectoryScreen.tsx` (Agrarian Community Directory)**  
    A directory of regional agriculturalists. Connect with neighbor farmers to share heavy machinery, hire logistics help, or share seeds.
21. **`SchemesScreen.tsx` (Government Subsidies Directory)**  
    A comprehensive directory of active state and national farming subsidies, detailing eligibility criteria and application guides.
22. **`ShopScreen.tsx` (Certified Ag-Input Store)**  
    Allows farmers to order premium, certified organic fertilizers, seeds, and tools directly from vetted suppliers.

### 🛒 Consumer Direct-to-Consumer (D2C) Marketplace
23. **`ConsumerHomeScreen.tsx` (D2C Market Hub)**  
    The primary consumer storefront. Browse organic fresh produce categories, view seasonal items, and locate the closest source farm.
24. **`D2CScreen.tsx` (D2C Storefront Configurator)**  
    The control panel where farmers list their harvested yields for direct-to-consumer sale, setting pricing, uploading photos, and describing cultivation styles.
25. **`SubscriptionsScreen.tsx` (Food Security Subscriptions)**  
    Enables consumers to sign up for monthly recurring baskets of fresh farm milk or crop yields at stable, pre-negotiated, middlemen-free rates.

### ⚙️ Utilities & Global Controllers
26. **`AIScreen.tsx` (AI Advisory Companion)**  
    A translation-ready chat interface. Farmers and consumers consult a dedicated Gemini advisor for agronomy assistance, marketing tips, or organic cooking advice.
27. **`ProfileScreen.tsx` (Digital Identity & Farm Passport)**  
    Manage personal records, verified bank credentials for D2C payouts, GPS farming coordinate configurations, and premium badge states.
28. **`SettingsScreen.tsx` (System Preferences Console)**  
    Control app-wide parameters including multilingual localization (English / Hindi), theme toggles, caching, and force-syncing the offline database.

---

## 🔒 Security & API Key Isolation

To prevent sensitive tokens and keys from being compiled into client-side bundles (which exposes them to client-side reverse engineering), KisanSaathi implements a strict **Express Server Proxy API Layer**:

1.  **No Client-Side Credentials:** Client browsers never see `GEMINI_API_KEY`, `OPENWEATHER_API_KEY`, or custom server tokens.
2.  **Proxy Routing:** The React app sends requests directly to the Node backend proxies:
    *   `POST /api/gemini/vision` -> For image diagnostics.
    *   `POST /api/gemini/chat` -> For agrarian query advisory.
    *   `GET /api/weather` -> Fetches external meteorological forecasts.
3.  **Strict Firebase Rules:** Built-in security policies inside `firestore.rules` isolate tenant user directories, ensuring a registered farmer can only update their own collection, while consumers are restricted to read-only paths inside public produce stores.

---

## ⚙️ Local Development Setup

Follow these simple steps to run KisanSaathi locally on your machine.

### Prerequisites
*   **Node.js:** version `20.0.0` or higher
*   **NPM:** version `10.0.0` or higher

### 1. Configure Environment Variables
Create a `.env` file in the root directory of the project. This is where your API keys live (they will be securely read by `server.ts`):

```env
# Google Gemini Key (Mandatory for AI features)
GEMINI_API_KEY=your_gemini_api_key_here

# Optional: OpenWeather API (For live meteorological advisories)
OPENWEATHER_API_KEY=your_open_weather_api_key_here

# Optional: Datagov.in API (For live APMC Mandi rates)
DATAGOVIN_API_KEY=your_mandi_api_key_here
```

### 2. Configure Firebase Credentials
Provide your Firebase configurations in the root file named `firebase-applet-config.json` (created automatically during Firebase setup).

### 3. Install Dependencies
Run the package installer from the project root:
```bash
npm install
```

### 4. Boot the Development Server
Launch the unified server proxy and Vite build pipeline:
```bash
npm run dev
```
The development environment boots on **Port 3000** (`http://localhost:3000`), serving the live Vite SPA on top of the Express API backend.

### 5. Production Compilation
To bundle the frontend assets and compile the Express proxy backend for production deployment:
```bash
# Clean previous builds and run compilations
npm run build

# Start the compiled bundle CJS server
npm start
```

### 6. Containerization (Docker)
KisanSaathi is fully containerized. To build and run the Docker container:
```bash
# Build the container image
docker build -t kisan-saathi .

# Spin up the container with your local .env configuration
docker run -p 3000:3000 --env-file .env kisan-saathi
```

---

## 🔄 Local-First Sync Engine & Offline Workflows

KisanSaathi's offline capability is built around a custom sync engine designed for low-connectivity environments:

1.  **Local Ledger Fallback:** If internet connectivity drops, all data entries (milk logs, finance, task checklist items) are saved directly inside client-side databases using `idb-keyval` or `localStorage`.
2.  **Delayed Firestore Synchronization:** Once the client detects a connection recovery (`window.ononline`), a background sync worker gathers unsynced queues, initiates Firebase write batches, and coordinates with Cloud Firestore to merge the local and remote tables smoothly.
3.  **Conflict Resolution:** Last-write-wins (timestamp-driven) merging ensures changes made offline remain consistent across multiple screens.

---

<p align="center">
  <i>Cultivated with passion for the global agricultural community. 🌾</i><br/>
  <b>KisanSaathi Team</b>
</p>
