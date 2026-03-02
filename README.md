# VFX Quality Gate Keeper v3.0

> **Game VFX Planning Stage Digital System**  
> A web-based verification program based on the "Game VFX Planning Stage Guide v3.0"

---

## 📋 Overview

**VFX Quality Gate Keeper** is a web-based tool for systematically managing the planning stage of game VFX production. It helps VFX artists and designers establish clear guidelines before production, automate quality verification, and generate standardized documentation.

### Key Features

- ✅ **Design Brief**: Define clear objectives and constraints
- ✅ **Reference Pack**: Image-based reference management system
- ✅ **Timing Spec**: Visualize Anticipation-Action-Resolution structure
- ✅ **Quality Gates**: 4-pillar checklist (Clarity, Art, Tech, Performance)
- ✅ **Export**: Automated documentation generation

---

## 🚀 Quick Start

### Prerequisites

- **Node.js**: v18 or higher
- **npm**: Installed with Node.js

### Installation

```bash
# 1. Clone the repository
git clone <repository-url>
cd VFX_QualityGate

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

### 1. Design Brief
Define VFX purpose, constraints, and performance budget
- Purpose, Context, Camera Distance
- Performance Budget (Draw Call, Particle Count, Occupancy)
- Color Palette, Integration Plan, Aftereffect

### 2. Reference Pack
Manage visual references with image uploads
- Multiple reference cards
- Main image + AAR frame uploads
- Platform and pillar tagging

### 3. Timing Spec
Visualize and manage VFX time structure
- Total duration (ms) with frame conversion
- Tension curve selection
- A-A-R phase visualization (15%-25%-60%)

### 4. Quality Gates
Quality verification through 4-pillar checklist
- 🎯 **Clarity**: Feedback, AoE, Telegraph
- 🎨 **Art**: A-A-R flow, Primary element, Palette
- ⚙️ **Tech**: Integration, Aftereffect, Energy flow
- ⚡ **Performance**: Draw Call, GPU Kill, Deactivate timing

### 5. Export
Integrated document viewer with print/PDF export

---

## 🛠️ Tech Stack

- **React 19.2.0**: UI framework
- **Vite 7.2.4**: Build tool and dev server
- **Vanilla CSS**: Custom design system
- **localStorage**: Auto-save app state
- **IndexedDB**: Local image storage

---

## 📁 Project Structure

```
VFX_QualityGate/
├── src/
│   ├── components/          # React components
│   │   ├── DesignBrief.jsx
│   │   ├── ReferencePack.jsx
│   │   ├── TimingSpec.jsx
│   │   ├── QualityGates.jsx
│   │   └── Export.jsx
│   ├── App.jsx              # Main app component
│   └── main.jsx             # Entry point
├── public/                  # Static assets
├── .gitignore              # Git ignore rules
├── package.json            # Dependencies
├── vite.config.js          # Vite configuration
└── Run_VFX_Gate.bat        # Windows launcher
```

---

## 💾 Data Persistence

### localStorage
- **Key**: `vfx_gate_data`
- **Content**: All form data (Brief, Timing, Gates)
- **Auto-save**: Immediate on data change

### IndexedDB
- **Database**: `VFXGateDB`
- **Store**: `images`
- **Content**: Reference images (Base64)

### Reset Data
Click the **Reset** button in the top bar to restore initial state.

---

## 📝 Workflow

1. **Design Brief**: Define purpose and constraints
2. **Reference Pack**: Upload and organize references
3. **Timing Spec**: Set duration and tension curve
4. **Quality Gates**: Verify 4-pillar checklist
5. **Export**: Generate PDF documentation (Ctrl+P)

---

## 🔧 Development

```bash
# Development server
npm run dev

# Production build
npm run build

# Preview build
npm run preview

# Lint code
npm run lint
```

---

## 📄 License

Internal tool for VFX production workflow.  
Commercial use requires separate agreement.

---

## 📞 Support

For issues or questions:
- Open an issue on GitHub
- Contact project maintainer

---

**Version**: 3.0  
**Last Updated**: 2026-01-30  
**Status**: Production Ready ✅
