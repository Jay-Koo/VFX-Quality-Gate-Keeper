import React, { useState, useEffect } from 'react';
import './App.css';
import DesignBrief from './components/DesignBrief';
import ReferencePack from './components/ReferencePack';
import TimingSpec from './components/TimingSpec';
import QualityGates from './components/QualityGates';
import Export from './components/Export';

// Initial state for all modules
const INITIAL_STATE = {
  brief: {
    purpose: 'Clarity (Readability)',
    context: '',
    camera: 'Mid',
    drawCall: 5,
    particleCount: 100,
    occupancy: 30,
    uiInterfere: false,
    clarityGoals: '',
    aoeAlignment: false,
    telegraphTime: 400,
    primaryElement: '',
    coreColor: '#00f2ff',
    subColor: '#ff007a',
    integration: 'Depth Fade',
    aftereffect: ''
  },
  refs: [
    { id: 1, name: 'Core Burst Ref', platform: 'Mobile', pillar: 'Clarity', type: 'Shape', notes: '' }
  ],
  timing: {
    totalTime: 600,
    curve: 'Slow-Fast',
    resolutionChecklist: { aftereffect: false, gpuKill: false },
    actionPeakInfo: '',
    phaseRatios: {
      anticipation: 15,
      action: 25,
      resolution: 60
    }
  },
  gates: {
    clarity: [
      { id: 'c1', label: 'Feedback (Hit/Success) clearly defined', pass: null },
      { id: 'c2', label: 'AoE/Hitbox matches layout shape', pass: null },
      { id: 'c3', label: 'Telegraph timing specified (ms/frames)', pass: null },
    ],
    art: [
      { id: 'a1', label: 'A-A-R flow mapped in Timing Spec', pass: null },
      { id: 'a2', label: 'Primary element defined (Read first)', pass: null },
      { id: 'a3', label: 'Palette (2-3 colors) + Core/Edge plan', pass: null },
      { id: 'a4', label: 'Tension curve is non-linear', pass: null },
    ],
    tech: [
      { id: 't1', label: 'Integration (Depth Fade/etc.) plan exists', pass: null },
      { id: 't2', label: 'Aftereffect element defined (Mobile safe)', pass: null },
      { id: 't3', label: 'Energy flow (Direction) specified', pass: null },
    ],
    perf: [
      { id: 'p1', label: 'Draw Call / Particle count estimate', pass: null },
      { id: 'p2', label: 'GPU Kill condition specified', pass: null },
      { id: 'p3', label: 'System Deactivate timing specified', pass: null },
      { id: 'p4', label: 'Reference has Platform Tag (Mobile)', pass: null },
    ]
  }
};

// IndexedDB Helper
const DB_NAME = 'VFXGateDB';
const STORE_NAME = 'images';

const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const saveImageToDB = async (id, dataUrl) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(dataUrl, id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const getImageFromDB = async (id) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const deleteImageFromDB = async (id) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

function App() {
  const [activeTab, setActiveTab] = useState('brief');

  // Load state from localStorage or use initial
  const [vfxData, setVfxData] = useState(() => {
    const saved = localStorage.getItem('vfx_gate_data');
    return saved ? JSON.parse(saved) : INITIAL_STATE;
  });

  // Persist state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('vfx_gate_data', JSON.stringify(vfxData));
  }, [vfxData]);

  const updateBrief = (updates) => {
    setVfxData(prev => ({ ...prev, brief: { ...prev.brief, ...updates } }));
  };

  const updateRefs = (newRefs) => {
    setVfxData(prev => ({ ...prev, refs: newRefs }));
  };

  const updateTiming = (updates) => {
    setVfxData(prev => ({ ...prev, timing: { ...prev.timing, ...updates } }));
  };

  const updateGates = (pillar, id, status) => {
    setVfxData(prev => ({
      ...prev,
      gates: {
        ...prev.gates,
        [pillar]: prev.gates[pillar].map(g => g.id === id ? { ...g, pass: status } : g)
      }
    }));
  };

  const tabs = [
    { id: 'brief', label: 'Design Brief', icon: '📝' },
    { id: 'ref', label: 'Reference Pack', icon: '🖼️' },
    { id: 'timing', label: 'Timing Spec', icon: '⏱️' },
    { id: 'gates', label: 'Quality Gates', icon: '🛡️' },
    { id: 'export', label: 'Export', icon: '📦' },
  ];

  return (
    <div className="app-container">
      <aside className="sidebar glass-panel">
        <div className="brand">
          <h1>VFX GATE</h1>
          <span>v3.0 Keeper</span>
        </div>
        <nav className="nav-menu">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="icon">{tab.icon}</span>
              <span className="label">{tab.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <main className="main-content">
        <header className="top-bar glass-panel">
          <h2>{tabs.find(t => t.id === activeTab)?.label}</h2>
          <div className="user-info">
            <span className="project-name">Project: Neon Nexus</span>
            <button
              className="btn btn-secondary"
              style={{ padding: '4px 12px', marginLeft: '12px', fontSize: '0.8rem' }}
              onClick={() => { if (confirm('Reset all data?')) setVfxData(INITIAL_STATE); }}
            >Reset</button>
          </div>
        </header>

        <section className="view-container">
          <div className="glass-panel content-card">
            {activeTab === 'brief' && <DesignBrief data={vfxData.brief} update={updateBrief} />}
            {activeTab === 'ref' && <ReferencePack data={vfxData.refs} update={updateRefs} />}
            {activeTab === 'timing' && <TimingSpec data={vfxData.timing} update={updateTiming} />}
            {activeTab === 'gates' && <QualityGates data={vfxData.gates} update={updateGates} />}
            {activeTab === 'export' && <Export data={vfxData} getImageFromDB={getImageFromDB} />}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
