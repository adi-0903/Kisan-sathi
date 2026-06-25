<div align="center">
  <img src="https://images.unsplash.com/photo-1592982537447-6f2a6a0c7c18?auto=format&fit=crop&w=150&q=80" alt="KisanSaathi Logo" width="150" style="border-radius: 20px; box-shadow: 0 10px 25px rgba(0,0,0,0.2); margin-bottom: 20px;" />

  # 🌾 KisanSaathi (किसान साथी)
  
  **The Complete Farm-to-Fork Ecosystem empowering Indian Farmers with GenAI, Smart Livestock Management, and Direct-to-Consumer Marketplaces.**

  <br />

  [![React 19](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev)
  [![Firebase Auth](https://img.shields.io/badge/Firebase_Auth-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com)
  [![Neon PostgreSQL](https://img.shields.io/badge/Neon_PostgreSQL-00e699?style=for-the-badge&logo=postgresql&logoColor=black)](https://neon.tech)
  [![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS_v4-38B2AC?style=for-the-badge&logo=tailwindcss&logoColor=white)](#)
  [![Google Gemini 2.5](https://img.shields.io/badge/Gemini_2.5_Flash-8E75B2?style=for-the-badge&logo=google&logoColor=white)](#)
  [![TypeScript 5.8](https://img.shields.io/badge/TypeScript_5.8-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](#)

</div>

---

## 📖 Table of Contents
- [🌟 Project Vision](#-project-vision)
- [⚡ Architecture & Tech Stack](#-architecture--tech-stack)
- [🚜 Core Features for Farmers](#-core-features-for-farmers)
- [🛒 Core Features for Consumers](#-core-features-for-consumers)
- [🛡️ Security & Data Privacy](#%EF%B8%8F-security--data-privacy)
- [⚙️ Local Development Setup](#%EF%B8%8F-local-development-setup)
- [🚀 Production Deployment](#-production-deployment)

---

## 🌟 Project Vision

**KisanSaathi** ("Farmer's Companion") is a next-generation Agritech and Agri-Fintech platform. Designed from the ground up as a full-stack, highly responsive progressive web application, it bridges the gap between rural landholders and modern data-driven agriculture.

The platform eliminates predatory middlemen by connecting farmers directly to consumers, and empowers rural workers with Gemini AI-powered diagnostics, double-entry financial ledgers, and crop monitoring.

---

## ⚡ Architecture & Tech Stack

KisanSaathi uses a monolithic proxy architecture engineered for maximum security, instantaneous load times, and sandboxed user sessions:

```mermaid
graph TD
    User([Browser Client]) -->|React Router| SPA[Vite React SPA]
    SPA -->|Session State| SessionStore[(sessionStorage)]
    SPA -->|Real-time DB Events| ExpressProxy[Express Backend]
    ExpressProxy -->|Drizzle ORM| NeonDB[(Neon PostgreSQL)]
    SPA -->|Auth SDK| FirebaseAuth[Firebase Auth]
    ExpressProxy -->|GenAI Diagnostics| Gemini[Gemini 2.5 Flash]
    ExpressProxy -->|API Proxy Fetch| ExternalAPIs[OpenWeather & Market APIs]
```

- **Frontend:** React 19, TypeScript, Tailwind CSS v4, Lucide React, Recharts, Framer Motion.
- **Backend:** Node.js, Express.js proxy server.
- **Database:** Neon Serverless PostgreSQL with Drizzle ORM.
- **AI & External Services:** Google Gemini 2.5 Flash (for leaf disease diagnosis), Firebase Authentication (Mobile OTP & PIN), OpenWeather API.

---

## 🚜 Core Features for Farmers
Transform your mobile device into a digital farm command center:

- 📊 **Agronomy Ledgers:** Track crop growth cycles, sowing times, and projected harvest dates.
- 🐄 **Smart Dairy Management:** Log daily milk production charts per livestock animal (SNF and fat analytics).
- 💰 **Agro-Fintech Logs:** Maintain an income and expense double-entry book, calculate credit lines, and generate instant PDF banking reports.
- 🔬 **AI Leaf Pathology:** Snap and upload photos of crop leaves to receive real-time diagnosis of pests and diseases powered by Gemini AI.
- 🛠️ **Agri Input Store:** Buy verified fertilizers, seeds, and farming equipment dynamically updated by suppliers.
- ☁️ **Hyperlocal Weather:** Live atmospheric forecasts and agricultural guidelines based on regional API data.
- 📋 **Resource Tracking:** Manage your inventory, daily labor checklists, crew attendance, and machinery logs.

---

## 🛒 Core Features for Consumers
Connect directly to the source for fresher, cheaper, and more sustainable produce:

- 🍅 **Direct-to-Consumer Hub:** Purchase fresh organic produce directly from regional farmers.
- 📉 **Mandi Price Checker:** View real-time commodity prices across regional APMC Mandis to ensure fair trades.
- 📦 **Price-Lock Subscriptions:** Subscribe to monthly/yearly recurring baskets of dairy or crop harvests directly from local farms.
- 🚚 **Delivery Tracker:** Seamlessly track your incoming produce from the farm gate directly to your doorstep.
- 🏪 **Agri Input Marketplace Manager:** Verified businesses can list, update, and manage incoming orders for fertilizers, seeds, and equipment directly from farmers.

---

## 🛡️ Security & Data Privacy

KisanSaathi implements a rigorous, multi-tiered security pattern to prevent session leaks and credential exposures:

1. **Session-Scoped Auth:** The user session state is managed exclusively in volatile `sessionStorage`. Closing the browser wipes all session variables, forcing a clean login window.
2. **Firebase Auth Sandboxing:** Utilizes `browserSessionPersistence`. Auth tokens do not carry over across tabs or system reboots.
3. **Monolithic API Proxies:** No API keys are bundled inside client browser scripts. The Vite client routes all secure requests (like Gemini AI parsing or Twilio OTPs) through the Express backend controllers, which securely proxy the requests using server-side keys.
4. **Direct-to-Database Sync:** Client state uses an in-memory database wrapper that syncs instantly with the Neon PostgreSQL backend via an Express socket simulation. **No tables are cached in `localStorage`.**

---

## ⚙️ Local Development Setup

To test and run KisanSaathi locally:

### 1. Prerequisites
- **Node.js:** v20.0.0 or higher
- **NPM:** v10.0.0 or higher

### 2. Environment Variables
Create a `.env` file in the root directory and populate it with your service credentials:
```env
# Twilio credentials (SMS OTP verification)
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number

# Google AI credentials
GROQ_API_KEY=your_groq_api_key
GEMINI_API_KEY=your_gemini_api_key

# Database Connection
NEON_DATABASE_URL=postgresql://your_user:your_password@your_neon_host/neondb?sslmode=require

# External APIs
OPENWEATHER_API_KEY=your_weather_key
DATAGOVIN_API_KEY=your_mandi_key
```

### 3. Firebase Configuration
Ensure `firebase-applet-config.json` in the root contains your Firebase credentials:
```json
{
  "projectId": "your-project-id",
  "appId": "your-app-id",
  "apiKey": "your-api-key",
  "authDomain": "your-project.firebaseapp.com"
}
```

### 4. Install & Launch
Install the necessary dependencies and spin up both the Vite SPA and Node backend:
```bash
npm install
npm run dev
```
Navigate to [http://localhost:3000](http://localhost:3000) in your web browser.

---

## 🚀 Production Deployment

KisanSaathi is structurally designed to be deployed effortlessly on Node-compatible platforms like **Render**, **Railway**, or **Google Cloud Run**.

### Quick Deployment via Render
1. Push your latest code to your GitHub repository.
2. Log in to [Render.com](https://render.com/) and create a **New Web Service**.
3. Connect your repository.
4. Apply the following Configuration:
    - **Runtime:** `Node`
    - **Build Command:** `npm install && npm run build`
    - **Start Command:** `npm start`
5. Click **Advanced** and safely input all of your Environment Variables (`NEON_DATABASE_URL`, `GEMINI_API_KEY`, etc.).
6. Click **Create Web Service**.

Once deployed, Render automatically serves your static Vite frontend while keeping your Express API proxies secure and fully active.

---

<div align="center">
  <i>Cultivated with passion for the global agricultural community. 🌾</i><br/>
  <b>KisanSaathi Team</b>
</div>
