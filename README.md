# VFX Quality Gate Keeper

> **A reference-dissection routine tool for game VFX artists.**
> Turn scattered impressions of great effects into accumulated analysis cards,
> and grow explicit, evidence-backed personal quality criteria from them.

---

## 📋 Overview

Watching a great effect a few times and moving on leaves nothing behind — the
observations fragment and no standard forms. This tool makes reference
analysis a **repeatable routine**: each dissection becomes an analysis card
(measurements + lens answers + takeaway), cards accumulate into a library,
and patterns you spot there get written down as **your own criteria, each
linked to the cards that prove it**.

The tool never analyzes for you. The eye grows only by writing yourself —
the tool is a **question sheet, a ruler, and a drawer**:

```
[Analysis Cards]  one dissection = one data point
       ↓ patterns emerge as cards accumulate (you spot them)
[My Criteria]     hand-written judgment rules, linked to evidence cards
       ↓ criteria accumulate
[Planning]        Design Brief consumes your criteria
```

### Key Features

- 🗂️ **Library** — analysis card grid with tag/pillar filters; where patterns surface
- 🔬 **Analysis flow** — Intake (GIF parsing) → Measure (A-A-R frame marking) → Lens (guided questions) → Distill (takeaway + tags)
- 📏 **My Criteria** — explicit judgment rules, each linked to evidence cards
- 📝 **Design Brief** — planning exit that consumes your criteria
- 💾 **Backup** — full library export/import as a single JSON file (also how you share it)

---

## 🚀 Quick Start

### Prerequisites

- **Node.js**: v18 or higher
- **npm**: Installed with Node.js

### Installation

```bash
# 1. Clone the repository
git clone <repository-url>
cd VFX-Quality-Gate-Keeper

# 2. Install dependencies
npm install

# 3. Run development server
npm run dev
```

### Windows One-Click Launch

Double-click `Run_VFX_Gate.bat` to automatically:
1. Set up Node.js path
2. Start development server
3. Open browser at `http://localhost:5173`

---

## 🎯 Main Modules

### 1. Library (home)
Your accumulated analysis cards
- Thumbnail grid with A-A-R ratio badge and lens-answer count
- Tag and pillar filters for pattern-hunting
- Entry point to every dissection

### 2. Analysis Card
One card = one dissection loop (15–20 min)
- **Intake**: title/source + GIF upload (parsed into frames) or still image
- **Measure**: mark Anticipation→Action and Action→Resolution boundaries and
  the peak frame on the full frame strip — ratios, frame counts and ms are
  derived automatically
- **Lens**: guided observation questions per pillar
  (👁️ Clarity · 🎨 Art · ⚙️ Tech · ⚡ Performance) — short written answers,
  blanks allowed
- **Distill**: "the one thing to steal from this reference" + tags

### 3. My Criteria
Judgment rules you write by hand
- Each criterion belongs to a pillar and links to its evidence cards
- Evidence chips jump straight to the cited card
- No auto-extraction — criteria without evidence are flagged, not generated

### 4. Design Brief
Planning exit for your own effects
- Purpose, context, camera distance
- Performance budget (draw call, particle count, occupancy)
- Palette, integration plan, aftereffect

### 5. Export / Backup
- **Export**: Design Brief as markdown
- **Backup**: everything (cards, criteria, planning data, all images) in one
  JSON file — restore or hand it to a teammate

---

## 🛠️ Tech Stack

- **React 19**: UI framework
- **Vite 7**: Build tool and dev server
- **Vanilla CSS**: Custom design system
- **gifuct-js**: GIF frame decoding
- **localStorage + IndexedDB**: local-first persistence, no server

---

## 📁 Project Structure

```
VFX-Quality-Gate-Keeper/
├── src/
│   ├── components/
│   │   ├── Library.jsx          # card grid + filters
│   │   ├── AnalysisCard.jsx     # Intake → Measure → Lens → Distill
│   │   ├── FrameStrip.jsx       # frame strip + A-A-R marking
│   │   ├── Criteria.jsx         # criteria with evidence links
│   │   ├── DesignBrief.jsx      # planning exit
│   │   ├── Export.jsx           # brief markdown export
│   │   ├── Backup.jsx           # full JSON backup/restore
│   │   └── ErrorBoundary.jsx
│   ├── data/
│   │   └── lensQuestions.js     # fixed v1 lens question set
│   ├── utils/
│   │   ├── eyeStore.js          # cards/criteria store + A-A-R derivation
│   │   ├── gif.js               # GIF parse + frame compositing
│   │   └── indexedDB.js         # image store helpers
│   ├── App.jsx
│   └── main.jsx
├── package.json
├── vite.config.js
└── Run_VFX_Gate.bat             # Windows launcher (deploy artifact)
```

---

## 💾 Data Persistence

Local-first — nothing leaves your machine.

### localStorage
- **`vfx_eye_data`**: analysis cards + criteria (versioned schema)
- **`vfx_gate_data`**: Design Brief planning data (legacy key)
- Auto-saved immediately on change

### IndexedDB
- **Database**: `VFXGateDB`, store `images`
- **`card_media_<id>`**: original GIF/image per card (frames are re-parsed on
  open — full frame dumps are never stored)
- **`card_thumb_<id>`**: card thumbnail (peak frame)

### Backup
The library is the asset — export it regularly from the **Backup** tab.
Import replaces all data after confirmation.

---

## 📝 Workflow

1. Found a great effect? Grab it as a GIF.
2. **Library → + New Analysis** — one card, 15–20 minutes:
   upload → mark A-A-R boundaries → answer the lens questions → write the takeaway.
3. Repeat. Patterns live in the library, not in your head.
4. Saw the same pattern in 3+ cards? Write it into **My Criteria** and link the cards.
5. Planning your own effect? **Design Brief** — with your criteria at hand.

---

## 🔧 Development

```bash
npm run dev      # development server
npm run build    # production build
npm run preview  # preview build
npm run lint     # ESLint
```

---

## 📄 License

Internal tool for VFX production workflow.
Commercial use requires separate agreement.

---

**Last Updated**: 2026-07-06
**Status**: v1 (eye-training pivot) ✅
