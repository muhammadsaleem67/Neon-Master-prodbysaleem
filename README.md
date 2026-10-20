# ⚡ NEON MASTER

> **Survive the endless synthwave onslaught in an intense, responsive 2D arcade survival shooter.**

![Neon Master Banner](https://img.shields.io/badge/Neon-Master-00f3ff?style=for-the-badge&logo=target&logoColor=060611)
![HTML5 Canvas](https://img.shields.io/badge/HTML5-Canvas-ff0055?style=for-the-badge&logo=html5&logoColor=white)
![Web Audio API](https://img.shields.io/badge/Web_Audio-Procedural_SFX-ffe600?style=for-the-badge&logo=audio&logoColor=black)
![React](https://img.shields.io/badge/React_19-TypeScript-00f3ff?style=for-the-badge&logo=react&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Firebase RTDB](https://img.shields.io/badge/Firebase-Leaderboard_%26_Stats-FFA611?style=for-the-badge&logo=firebase&logoColor=white)
![License](https://img.shields.io/badge/License-Apache_2.0-blue?style=for-the-badge)

---

## 🎮 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Gameplay Mechanics](#-gameplay-mechanics)
  - [Controls](#controls)
  - [Enemy Types & Boss Encounters](#enemy-types--boss-encounters)
  - [Power-Ups & Tactical Buffs](#power-ups--tactical-buffs)
  - [Wave Progression & Roguelite Upgrades](#wave-progression--roguelite-upgrades)
- [Dual Distribution Architecture](#-dual-distribution-architecture)
- [Project Directory Structure](#-project-directory-structure)
- [Quick Start Guide](#-quick-start-guide)
  - [Prerequisites](#prerequisites)
  - [Installation & Local Development](#installation--local-development)
  - [Running Unit Tests](#running-unit-tests)
  - [Production Build](#production-build)
  - [Running as Standalone Single-File HTML](#running-as-standalone-single-file-html)
- [Firebase Realtime Database Setup](#-firebase-realtime-database-setup)
  - [1. Create Firebase Project](#1-create-firebase-project)
  - [2. Enable Realtime Database](#2-enable-realtime-database)
  - [3. Configure Security Rules](#3-configure-security-rules)
  - [4. Add Web App Credentials](#4-add-web-app-credentials)
  - [5. Safe Offline Fallback](#5-safe-offline-fallback)
- [Developer Configuration](#-developer-configuration)
- [Procedural Audio System](#-procedural-audio-system)
- [Performance & Screen Polish](#-performance--screen-polish)
- [Future Expansion Roadmap](#-future-expansion-roadmap)
- [Credits & Author](#-credits--author)

---

## 🌌 Overview

**NEON MASTER** is a fast-paced, top-down arcade survival shooter set in a high-voltage cybernetic arena. Players pilot a sleek neon combat vessel, engaging escalating waves of hostile autonomous drones, tactical marksmen, armored juggernauts, and colossal phase bosses.

The project is built with **zero external image or audio assets**: every laser beam, shield shimmer, particle explosion, starfield parallax layer, and synthesizer sound effect is computed procedurally in real time using the **HTML5 Canvas 2D API** and the **Web Audio API**.

---

## ✨ Key Features

- **Fluid 60 FPS Canvas Engine**: Deterministic sub-pixel physics loop with `requestAnimationFrame`, delta-time smoothing, hitstop impact pauses, and screen shake.
- **Dual Deployment Ready**:
  1. Full **React 19 + TypeScript + Vite + Tailwind CSS** application with modular state and clean HUD.
  2. Single-file **`public/neon-master.html`** containing 100% self-contained HTML, CSS, and JS that runs directly in any browser with zero dependencies or build steps.
- **Procedural Synthwave Audio**: Custom Web Audio API synthesizer for lasers, collisions, shield deflections, level-up fanfares, chrono warps, and explosions.
- **Adaptive Input Scheme**:
  - Full desktop mouse + keyboard aiming and movement.
  - Responsive mobile touch controls with virtual analog joystick and action triggers.
- **Wave-Based Roguelite Upgrades**: After each cleared wave, choose 1 of 3 tactical perks to tailor your ship’s combat specialization.
- **Dynamic Combo System**: Rapid kills stack a combo multiplier (up to 8x+) with bonus scoring and exponential reward scaling.
- **Player Profiles & Identity**: Sanitized pilot name input, localStorage persistence, and customized game-over callouts.
- **Global Leaderboard (Firebase RTDB)**: Real-time high score rankings with highlighted personal bests, alongside safe local offline fallback.
- **Session-Aware Live Analytics**: Global view counter (1 increment per session) and total run counter with count-up animation.
- **Developer Showcase Modal**: Neon modal displaying creator details, GitHub, LinkedIn, portfolio, and email links.

---

## 🕹️ Gameplay Mechanics

### Controls

| Action | Desktop Controls | Mobile / Touch Controls |
| :--- | :--- | :--- |
| **Move** | `W, A, S, D` or `Arrow Keys` | Virtual Analog Thumbstick (Left side) |
| **Aim** | Mouse cursor position | Finger drag / direction indicator |
| **Fire** | Left Click or Auto-fire toggle (`F`) | Tap / Hold Right Screen or Auto-fire |
| **Dash (I-Frames)** | `Spacebar` (consumes stamina cooldown) | `DASH` button on bottom right |
| **Pause / Resume** | `Escape` or `P` | Pause icon `⏸` on top-right HUD |
| **Toggle Audio** | `M` key | Speaker icon `🔊` on top HUD |
| **Choose Upgrade** | Number keys `1`, `2`, `3` or Mouse click | Tap upgrade card on modal |

---

### Enemy Types & Boss Encounters

| Enemy | Visual Aura | Behavior & Threat Profile |
| :--- | :--- | :--- |
| **Chaser** | Neon Pink / Magenta | Fast swarmers that relentlessly steer toward your coordinates. Low HP, high threat in packs. |
| **Tank** | Neon Emerald Green | Heavily fortified juggernaut that absorbs heavy damage. Splits into mini-shards on defeat. |
| **Shooter** | Neon Amber / Orange | Keeps strategic distance from your vessel and unleashes predictive plasma projectiles. |
| **Boss (Every 5 Waves)** | Multi-ring Neon Violet | Massive dreadnought equipped with multi-phase radial bullet spirals, charge rushes, and escalating hitpoint pools. |

---

### Power-Ups & Tactical Buffs

Enemies have a chance to drop glowing cybernetic crates upon elimination:

- 🛡️ **Shield**: Generates a temporary barrier absorbing incoming projectile impacts.
- ⚡ **Rapid Fire**: Quadruples fire rate and reduces weapon spread for 8 seconds.
- 🔱 **Triple Shot**: Fires a wide tri-directional spread of concentrated plasma.
- 💖 **Nano Repair**: Restores +35 HP to the vessel's hull integrity.
- ⏳ **Chrono Warp**: Dilates time, slowing all enemy movements and hostile bullets by 60%.

---

### Wave Progression & Roguelite Upgrades

Clearing a wave grants XP and displays an upgrade selection screen offering 3 randomized perks:

- **Plasma Overcharge**: +25% Bullet Damage.
- **Hyper Thrusters**: +18% Maximum Vessel Velocity.
- **Overclocked Capacitor**: +25% Fire Rate.
- **Reinforced Hull**: +35 Maximum HP and partial emergency repair.
- **Phase Shift Coils**: -30% Dash Cooldown timer.
- **Magnet Core**: +75% Pickup Attraction Radius.
- **Piercing Rounds**: Laser bolts pierce through multiple enemy targets.
- **Ricochet Emitter**: Projectiles bounce off arena boundaries.

---

## 📦 Dual Distribution Architecture

This project is engineered in two complementary formats:

```
┌─────────────────────────────────────────────────────────────┐
│                        NEON MASTER                          │
├──────────────────────────────┬──────────────────────────────┤
│ 1. Modern Web Application    │ 2. Zero-Dependency File     │
│    (src/ + Vite + React 19)  │    (public/neon-master.html) │
├──────────────────────────────┼──────────────────────────────┤
│ • Strict TypeScript typing   │ • Single 100% self-contained │
│ • Tailwind CSS v4 styling    │   HTML + CSS + JS file       │
│ • Unit tests via node:test   │ • Runs by double clicking in │
│ • Modular architecture       │   any modern web browser     │
│ • Ready for Cloud Run / Vercel│ • Firebase RTDB via CDN ES   │
└──────────────────────────────┴──────────────────────────────┘
```

---

## 📁 Project Directory Structure

```plaintext
├── .env.example              # Environment variables template
├── index.html                # Entry point for Vite / React application
├── metadata.json             # Applet metadata, capabilities & description
├── package.json              # Scripts & dependency definitions
├── tsconfig.json             # TypeScript configuration
├── vite.config.ts            # Vite bundler & Tailwind configuration
│
├── public/
│   └── neon-master.html      # 🚀 FULL STANDALONE SINGLE-FILE VERSION
│
└── src/
    ├── main.tsx              # React entry root mounting
    ├── index.css             # Tailwind CSS global styles
    ├── App.tsx               # Main React UI Shell & Neon HUD overlay
    │
    └── game/
        ├── logic.ts          # Pure decoupled math, upgrade rules & collision logic
        ├── logic.test.ts     # Automated unit test suite run via `node --test`
        ├── audio.ts          # Procedural Web Audio API sound synthesizer
        └── engine.ts         # High-performance 60 FPS HTML5 Canvas engine
```

---

## 🚀 Quick Start Guide

### Prerequisites

- **Node.js**: v20+ recommended (or v18.17+)
- **npm** or **bun** / **yarn**

### Installation & Local Development

1. Clone the repository and install dependencies:
   ```bash
   git clone https://github.com/muhammadsaleem67/neon-master.git
   cd neon-master
   npm install
   ```

2. Start the local Vite development server:
   ```bash
   npm run dev
   ```
   Open your browser at `http://localhost:3000`.

### Running Unit Tests

The core mathematical game logic, collision detection, wave progression, and upgrade formulas are completely decoupled from the DOM and tested using Node's built-in test runner:

```bash
npm test
# or
node --test
```

### Production Build

To compile and bundle the React production application:

```bash
npm run build
npm run preview
```

### Running as Standalone Single-File HTML

No terminal, Node.js, or local web server is needed for the single-file edition:
1. Navigate to `public/neon-master.html`.
2. Double-click the file or open it directly in **Google Chrome**, **Firefox**, **Edge**, or **Safari**.
3. Everything (game engine, synthesizer, vector graphics, modals) executes out-of-the-box.

---

## 🔥 Firebase Realtime Database Setup

The game features an optional global leaderboard and live visitor counter powered by **Firebase Realtime Database**. If unconfigured, the game automatically switches to **Offline Mode** with local storage, ensuring zero crashes.

Follow these 5 steps to connect your own live Firebase database:

### 1. Create Firebase Project
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add project**, name it (e.g. `neon-master`), and click **Continue**.

### 2. Enable Realtime Database
1. In the left navigation menu, click **Build** > **Realtime Database**.
2. Click **Create Database**.
3. Choose your nearest Cloud region (e.g. `United States (us-central1)` or `Singapore (asia-southeast1)`).
4. Select **Start in test mode** for initial testing, then click **Enable**.

### 3. Configure Security Rules
Navigate to the **Rules** tab of your Realtime Database and paste the following security rules:

```json
{
  "rules": {
    "leaderboard": {
      ".read": true,
      ".write": true,
      ".indexOn": ["score"]
    },
    "stats": {
      "totalViews": {
        ".read": true,
        ".write": true
      },
      "totalPlays": {
        ".read": true,
        ".write": true
      }
    }
  }
}
```
*Click **Publish** to apply these rules.*

### 4. Add Web App Credentials
1. Click the **Project Overview gear icon ⚙️** > **Project Settings**.
2. Under **Your apps**, click the Web icon `</>`.
3. Register your app (e.g., `Neon Master Web`).
4. Copy your `firebaseConfig` keys.
5. In `public/neon-master.html` (around line 645) or `src/App.tsx`, paste your credentials:

```javascript
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyYourActualApiKeyHere",
  authDomain: "your-project.firebaseapp.com",
  databaseURL: "https://your-project-default-rtdb.firebaseio.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef123456"
};
```

### 5. Safe Offline Fallback
- If `FIREBASE_CONFIG.apiKey` contains `"YOUR_API_KEY"`, the game automatically detects this and engages **Offline Mode**.
- The leaderboard falls back to `localStorage.getItem('neon_leaderboard_v1')`.
- Total views and plays track locally in `localStorage`.
- An **"Offline mode"** badge is displayed gracefully on leaderboard tables.

---

## 👨‍💻 Developer Configuration

Customize developer details, portfolio, and social links in one central place. In `public/neon-master.html` (lines 660–670) or `src/App.tsx`:

```javascript
const DEVELOPER = {
  name: "Muhammad Saleem",
  title: "Game Developer",
  linkedin: "https://www.linkedin.com/in/muhammad-saleem-junejo",
  github: "https://github.com/muhammadsaleem67",
  email: "busiwithsaleem@gmail.com",
  website: "www.downloadpdf.sainazeemtech.com"
};
```

> **Tip**: Any field left as an empty string `""` will automatically be hidden from the in-game "About Developer" modal.

---

## 🔊 Procedural Audio System

All sound effects are synthesized on-the-fly using the Web Audio API without downloading external `.mp3` or `.wav` files:

- **Laser Blasts**: High-frequency sawtooth oscillator rapidly dropping down through an exponential frequency ramp.
- **Explosions**: White noise buffer routed through a low-pass biquad filter with exponential gain decay.
- **Hit Feedback**: Dual square wave blips for snappy tactile response.
- **Power-Up Fanfare**: Ascending arpeggio triangle wave sequence (`C5 -> E5 -> G5 -> C6`).
- **Chrono Warp**: Resonant low-pass filter sweep conveying temporal deceleration.
- **Mute Functionality**: Quick toggle via key `M` or the in-game speaker icon, muting the master gain node cleanly.

---

## ⚡ Performance & Screen Polish

- **Object Pooling**: Explosive debris, laser bolts, and floating damage numbers use recycle pools to avoid GC frame-rate stutter.
- **HiDPI / Retina Canvas Scaling**: The canvas resolution scales automatically with `window.devicePixelRatio` for razor-sharp rendering on 4K and mobile Retina screens.
- **Adaptive Touch Controls**: Virtual thumbstick smoothly registers touch gestures within any quadrant without causing layout shifts or virtual keyboard clipping.
- **XSS Sanitization**: User pilot names are strictly validated (alphanumeric, spaces, underscores, max 15 chars) and rendered exclusively through `textContent` and DOM nodes to eliminate injection vulnerabilities.

---

## 🗺️ Future Expansion Roadmap

1. **Vessel Hangar & Custom Ships**: Choose between unique ship chassis (e.g., *Vanguard* with dual cannons, *Phantom* with double dash distance, or *Titan* with auto-recharging shield).
2. **Procedural Synthwave Soundtrack**: Procedural chord progression generator using Web Audio oscillators and tempo escalation during boss encounters.
3. **Obstacle Hazards**: Dynamic arena hazards such as rotating laser barriers, EMP clouds, and bounce bumpers.
4. **Co-Op Survival Mode**: WebRTC peer-to-peer multiplayer enabling dual-pilot cooperative defense.
5. **Achievement Badges**: Unlockable cosmetic ship neon skins (Cyber Cyan, Solar Gold, Hyper Violet, Acid Green).

---

## 👤 Credits & Author

Developed by **Muhammad Saleem**

- **LinkedIn**: [muhammad-saleem-junejo](https://www.linkedin.com/in/muhammad-saleem-junejo)
- **GitHub**: [@muhammadsaleem67](https://github.com/muhammadsaleem67)
- **Email**: [busiwithsaleem@gmail.com](mailto:busiwithsaleem@gmail.com)
- **Website**: [DownloadPDF](https://www.downloadpdf.sainazeemtech.com)

---

<p align="center">
  <sub>Built with passion for arcade retro-gaming and synthwave aesthetics. © 2026 Neon Master.</sub>
</p>
