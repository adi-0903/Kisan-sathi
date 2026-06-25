# 🌾 KisanSaathi (किसान साथी)

<div align="center">
  <p align="center">
    <img src="https://images.unsplash.com/photo-1592982537447-6f2a6a0c7c18?auto=format&fit=crop&w=150&q=80" alt="KisanSaathi Logo" width="120" style="border-radius: 30px; box-shadow: 0 10px 25px rgba(0,0,0,0.2); margin-bottom: 20px;" />
  </p>
  <h1>The Complete Farm-to-Fork Ecosystem</h1>
  <p><b>Empowering Indian Farmers with GenAI, Smart Livestock Management, and Direct-to-Consumer Marketplaces</b></p>

  <br />

  [![React 19](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev)
  [![Firebase](https://img.shields.io/badge/Firebase_Auth-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com)
  [![Neon PostgreSQL](https://img.shields.io/badge/Neon_PostgreSQL-00e699?style=for-the-badge&logo=postgresql&logoColor=black)](https://neon.tech)
  [![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS_v4-38B2AC?style=for-the-badge&logo=tailwindcss&logoColor=white)](#)
  [![Google Gemini 2.5](https://img.shields.io/badge/Gemini_2.5_Flash-8E75B2?style=for-the-badge&logo=google&logoColor=white)](#)
  [![TypeScript 5.8](https://img.shields.io/badge/TypeScript_5.8-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](#)
</div>

---

## 📖 Table of Contents
1. [Project Vision & Dual Ecosystem](#-project-vision--dual-ecosystem)
2. [System Architecture](#%EF%B8%8F-system-architecture)
3. [Key Features & Tour of Screens](#-key-features--tour-of-screens)
4. [Session Isolation & Security Rules](#-session-isolation--security-rules)
5. [Database Architecture & Syncing](#-database-architecture--syncing)
6. [Local Development Setup](#%EF%B8%8F-local-development-setup)
7. [Production Deployment Guide](#-production-deployment-guide)

---

## 🌟 Project Vision & Dual Ecosystem

**KisanSaathi** ("Farmer's Companion") is a next-generation Agritech and Agri-Fintech platform. It is a full-stack, responsive web application engineered to solve two critical agricultural problems in India: the reliance on predatory middlemen and the lack of accessible, data-driven farming tools for rural landholders.

```
                  +----------------------------------------------+
                  |         KisanSaathi React SPA Client         |
                  +----------------------+-----------------------+
                                         |
                       [ HTTP / JSON ]   |   [ Session Auth ]
                                         v
                  +----------------------+-----------------------+
                  |       Secure Node/Express Proxy Server       |
                  |     (Vite Dev Server / Production CJS)       |
                  +---------+------------------------+-----------+
                            |                        |
             [ SQL Queries ]|                        | [ Gemini Prompts ]
                            v                        v
                     +------+------+          +------+------+
                     |   Neon DB   |          |  Google AI  |
                     | PostgreSQL  |          | Gemini API  |
                     +-------------+          +-------------+
```

### 🚜 For Farmers (The Supplier Command Center)
*   **Agronomy Ledgers:** Track crop growth cycles, sowing times, and projected harvest dates.
*   **Dairy Milk yields:** Log milk production charts per livestock animal (SNF and fat analytics).
*   **Agro-Fintech Logs:** Record income, operational costs, credit lines, and generate banking PDF reports.
*   **AI Leaf Pathology:** Snap photos of crop leaves to diagnose pests and diseases in real-time.

### 🛒 For Consumers (The Direct-to-Consumer Hub)
*   **Mandi Price Checks:** View real-time commodity prices across regional Mandis (APMC).
*   **Produce Marketplace:** Purchase fresh produce directly from regional farmers.
*   **Price-Lock Subscriptions:** Subscribe to monthly recurring baskets of dairy or crop harvests directly from local farms.

---

## ⚡ System Architecture

KisanSaathi is engineered for maximum security, fast loading times, and sandboxed user sessions:

```mermaid
graph TD
    User([Browser Client]) -->|React Router| SPA[Vite React SPA]
    SPA -->|Session State| SessionStore[(sessionStorage)]
    SPA -->|Real-time Poll / DB APIs| ExpressProxy[Express Proxy Server]
    ExpressProxy -->|Drizzle ORM| NeonDB[(Neon PostgreSQL)]
    SPA -->|Firebase Auth SDK| FirebaseAuth[Firebase Auth Cloud]
    ExpressProxy -->|Google GenAI SDK| Gemini[Gemini 2.5 Flash]
    ExpressProxy -->|Twilio SDK| Twilio[Twilio SMS Gateway]
    ExpressProxy -->|API Proxy Fetch| ExternalAPIs[OpenWeather & APMC Mandi APIs]
```

*   **Vite SPA Client:** React 19 single-page client rendering visual, interactive charts via Recharts and animations using motion/react.
*   **Monolithic Express Backend Proxy:** Serves static build files, manages API connections, handles rate-limiting, and routes database operations to PostgreSQL.
*   **Neon Serverless Postgres:** Drizzle-backed relational store housing all shared business models (products, orders, profiles).

---

## 📱 Key Features & Tour of Screens

The platform supports **28 specialized screens** structured for both Farmers and Consumers:

### 🔐 Security & Onboarding
*   `SplashScreen.tsx` — An elegant ambient green startup loading screen.
*   `LoginScreen.tsx` — Mobile-first authentication supporting **Security PIN** or **OTP (Twilio SMS)**.
*   `RegisterScreen.tsx` — Visual role picker (Farmer vs. Consumer) and onboarding wizard.
*   `InstallAppScreen.tsx` — Visual guide for installing KisanSaathi as a Progressive Web App (PWA).

### 🚜 Farmer Dashboards
*   `HomeScreen.tsx` — Bento grid containing weather bulletins, quick links, and dairy summaries.
*   `CropsScreen.tsx` / `CropLogScreen.tsx` — Digital field log detailing crop varieties, fertilization, and logs.
*   `SoilHealthScreen.tsx` — NPK balance journals and soil analysis charts.
*   `DiseaseDetectorScreen.tsx` — Gemini-powered diagnostic scanner for leaf diseases.
*   `WeatherScreen.tsx` — Live atmospheric forecasts and agricultural guidelines.
*   `FinanceScreen.tsx` — Income/Expense double-entry book and credit calculators.
*   `ReportsScreen.tsx` — One-click PDF compiler utilizing jsPDF.
*   `DairyScreen.tsx` — Milk yield logs, SNF fat rates, and feeding intervals.
*   `InventoryScreen.tsx` — Tracker for seeds, tools, and fertilizers with stock alert thresholds.
*   `TasksScreen.tsx` — Crop chore checklist.
*   `LaborScreen.tsx` — Crew attendance log and wage sheets.
*   `MachineryScreen.tsx` — Tractor fuel, service scheduler, and neighbor sharing list.

### 🛒 D2C Marketplace
*   `ConsumerHomeScreen.tsx` — Fresh organic storefront categories.
*   `D2CScreen.tsx` — Farmer configurator for listing yields, uploading photos, and setting prices.
*   `SubscriptionsScreen.tsx` — Multi-month direct farm produce and dairy subscription options.
*   `LogisticsScreen.tsx` — Delivery tracker from farm gate to Mandel or consumer doorstep.
*   `MarketScreen.tsx` — Live commodity rates parsed from APMC API endpoints.
*   `FarmerDirectoryScreen.tsx` — Regional contact directory to collaborate with nearby farmers.
*   `SchemesScreen.tsx` — Directory of active government agrarian subsidies and registration guides.
*   `ShopScreen.tsx` — Marketplace for buying verified fertilizers, seeds, and tools.

### ⚙️ Global Utilities
*   `AIScreen.tsx` — Translation-ready Gemini chat assistant.
*   `ProfileScreen.tsx` — Account settings, digital farm passport, and payout setup.
*   `SettingsScreen.tsx` — Language configurations (English/Hindi), dark mode, and system tools.

---

## 🔒 Session Isolation & Security Rules

To prevent session leaks and credentials exposures, KisanSaathi implements a multi-tiered security pattern:

1.  **Session-Scoped Auth:** The user session state is managed exclusively in `sessionStorage` (`ks_session_user` and `ks_is_local_only`). Closing the browser tab or opening the URL in a new device automatically wipes all session variables, forcing a clean login window.
2.  **Firebase Session Lifecycles:** Firebase Auth is initialized to enforce `browserSessionPersistence`. Auth tokens do not carry over to new tabs or system reboots.
3.  **Monolithic API Proxies:** No API keys are bundled inside client browser scripts. The client sends queries through Express backend controllers, which proxy the requests and attach keys server-side:
    *   `POST /api/gemini/vision` -> Proxies Gemini API leaf diagnostics.
    *   `GET /api/weather` -> Proxies OpenWeather queries.
    *   `POST /api/otp/send` -> Proxies Twilio verification codes.

---

## 🗄️ Database Architecture & Syncing

KisanSaathi operates a direct-to-database backend pipeline backed by **Neon Serverless PostgreSQL** and mapped using Drizzle ORM:

*   **Single Source of Truth:** `src/lib/firebase.ts` acts as the cloud query broker. All database calls write directly to your PostgreSQL instance in real-time.
*   **In-Memory UI State:** Client state uses a volatile, in-memory dictionary `inMemoryDb` that syncs instantly with backend data. **No database tables are stored in localStorage**, preventing local data leakage.
*   **Fail-Fast Error Handling:** If connection to PostgreSQL is lost, the wrapper propagates errors directly to the React layer, allowing forms to display alerts to the user immediately.

---

## ⚙️ Local Development Setup

Set up your local machine to run and inspect KisanSaathi:

### Prerequisites
*   **Node.js:** v20.0.0 or higher
*   **NPM:** v10.0.0 or higher

### 1. Set Up Environment Variables
Create a `.env` file in the root directory:
```env
# Twilio credentials (SMS OTP)
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number

# Google AI credentials
GROQ_API_KEY=your_groq_api_key
GEMINI_API_KEY=your_gemini_api_key

# Neon DB Connection String
NEON_DATABASE_URL=postgresql://your_user:your_password@your_neon_host/neondb?sslmode=require

# External APIs
OPENWEATHER_API_KEY=your_weather_key
DATAGOVIN_API_KEY=your_mandi_key
```

### 2. Configure Firebase Config Template
Ensure `firebase-applet-config.json` in the root contains your Firebase credentials:
```json
{
  "projectId": "your-project-id",
  "appId": "your-app-id",
  "apiKey": "your-api-key",
  "authDomain": "your-project.firebaseapp.com"
}
```

### 3. Install & Run
```bash
# Install dependencies
npm install

# Start Vite SPA + Node API Backend
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🚀 Production Deployment Guide

You can deploy the unified full-stack server to any Node-compatible platform (like **Render**, **Railway**, or **Google Cloud Run**).

### Deployment to Render (Recommended)
1.  **Push your code** to GitHub.
2.  Log in to [Render](https://render.com/) and click **New > Web Service**.
3.  Connect your GitHub repository.
4.  Configure the settings:
    *   **Runtime:** `Node`
    *   **Build Command:** `npm install && npm run build`
    *   **Start Command:** `npm start`
5.  Click **Advanced** and add your environment variables (`NEON_DATABASE_URL`, `TWILIO_ACCOUNT_SID`, `GROQ_API_KEY`, `OPENWEATHER_API_KEY`, etc.).
6.  Click **Create Web Service**. 

Once Render builds the Vite assets and spins up the Express server, your app will be live on a secure, public URL!

---

<p align="center">
  <i>Cultivated with passion for the global agricultural community. 🌾</i><br/>
  <b>KisanSaathi Team</b>
</p>
