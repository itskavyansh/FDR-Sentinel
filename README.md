# FDR Sentinel — AICTE Security Deposit Portal

Frontend-only demonstration platform for the **All India Council for Technical Education (AICTE)** Security Deposit / Fixed Deposit Receipt (FDR) monitoring, governance, and fraud prevention framework (Smart India Hackathon).

---

## 🚀 Quick Run Instructions

### 1. Prerequisites
- **Node.js**: v18+ or v20+ recommended
- **Package Manager**: npm

### 2. Install Dependencies
```bash
npm install
```

### 3. Run Development Server
```bash
npm run dev
```
Open **`http://localhost:5173/`** in your browser.

### 4. Build for Production
```bash
npm run build
```

---

## 🏛️ Application Architecture & Core Technologies
- **Framework**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS v4 (Tailwind Vite Plugin) + Navy Government Aesthetics (`#0b2e4f`, `#0072c6`)
- **State Management**: Client-side Zustand store with `localStorage` persistence and 0 backend dependencies
- **Data Visualizations**: Recharts
- **Icons**: Lucide React
- **Cryptographic Security**: Browser native `crypto.subtle` SHA-256 Merkle-style audit hashing

---

## 🗺️ Final Application Routes

| Route | View | Description |
|---|---|---|
| `/` | **Dashboard** | 6 live KPI cards, Recharts 6-month maturity pipeline, urgent needs-action queue, and Ask Sentinel NLP search |
| `/institution` | **Institution Portal** | Portfolio overview, footer stats, and 4-step Document AI OCR scanner (Genuine / Edited / Duplicate presets) |
| `/instruments` | **All Instruments** | Filterable master inventory of 40 FDRs across 12 institutions with masked numbers and trust badges |
| `/instruments/:id` | **Instrument Review** | Scanned FDR certificate viewer with visual highlight overlays, Trust Ladder (L0–L3), Fraud Guard breakdown, and officer action links |
| `/queue` | **Verification Queue** | Priority-ranked queue of high-risk and pending FDRs sorted by risk score |
| `/bank/:token` | **Bank Confirmation** | Mobile-responsive bank nodal portal with 2FA OTP simulation, L2 authenticity confirmation, and mismatch discrepancy reporting |
| `/radar` | **Maturity Radar** | Monthly timeline, T-90 to Overdue+7 escalation schedule, institutional coverage gap deficit tracking, and renewal linking modal |
| `/releases` | **Release Requests** | 3-tier governance (Maker scrutiny → Checker concurrence → Approver e-sign), statutory checklist blocking, and printable e-signed letters |
| `/reports` | **Reports** | 6 saved compliance tables with real CSV downloads, print-to-PDF styles, and 5 Before-vs-After impact measures |
| `/audit` | **Audit Trail** | Tamper-evident ledger with crypto.subtle SHA-256 chain verification, demo tamper simulation, and chain repair |
| `/settings` | **Settings / Admin** | Editable statutory deposit thresholds, configurable Fraud Guard weights table, simulation clock, and users table |

---

## 🎯 8-Step Walkthrough Guide

Use the **"8-Step Demo Script Guide"** collapsed in the bottom-left corner or test manually:
1. **Load Demo Scenario**: Click *"Load Demo Scenario"* in the guide to reset to `2026-10-30`.
2. **Institution Upload**: Upload the edited FDR sample; observe Document AI flagging low confidence fields with `CHECK` and identifying maturity before issue.
3. **Fraud Guard & Submission**: Submit to AICTE; notice high-risk score (>60) and generation of a bank verification token.
4. **Bank Portal**: Open `/bank/:token`, enter any 6-digit OTP, and test confirming or flagging a mismatch (+50 risk).
5. **Time Machine**: Advance clock `+60d` to trigger automated maturity alerts and reveal institutional coverage gaps.
6. **Renewal Linking**: Link a replacement FDR to close coverage gaps and promote status to Active.
7. **Release Governance**: Test `rel-002` checklist failure blocking and approve `rel-001` to generate a cryptographic e-signed release order.
8. **Audit Verification**: Verify the intact SHA-256 chain, simulate tampering to catch broken integrity at `#ae-003`, and repair the chain.
