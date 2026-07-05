import React, { useState, useEffect } from 'react';
import './App.css';
import DesignBrief from './components/DesignBrief';
import Export from './components/Export';
import Backup from './components/Backup';
import Library from './components/Library';
import AnalysisCard from './components/AnalysisCard';
import Criteria from './components/Criteria';
import ErrorBoundary from './components/ErrorBoundary';
import { deleteImageFromDB } from './utils/indexedDB';
import { loadEyeData, saveEyeData, createCard, createCriterion, mediaKey, thumbKey } from './utils/eyeStore';

// Stroke line icons from the redesign spec (16px, currentColor).
const NAV_ICONS = {
  library: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2">
      <rect x="1.5" y="1.5" width="5.4" height="5.4" rx="1.2" />
      <rect x="9.1" y="1.5" width="5.4" height="5.4" rx="1.2" />
      <rect x="1.5" y="9.1" width="5.4" height="5.4" rx="1.2" />
      <rect x="9.1" y="9.1" width="5.4" height="5.4" rx="1.2" />
    </svg>
  ),
  criteria: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2">
      <path d="M2 12.5 L12.5 2 L14 3.5 L3.5 14 L1.8 14.2 Z" />
      <path d="M9.5 5 L11 6.5" />
    </svg>
  ),
  brief: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2">
      <path d="M4 1.5 h6 l3 3 v10 h-9 z" />
      <path d="M10 1.5 v3 h3" />
      <path d="M5.8 8 h4.4 M5.8 10.5 h4.4" />
    </svg>
  ),
  export: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2">
      <path d="M8 10 V2 M5 4.6 L8 1.6 L11 4.6" />
      <path d="M2.5 8.5 v5 h11 v-5" />
    </svg>
  ),
  backup: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2">
      <path d="M2 3.5 a6 2.2 0 0 1 12 0 v9 a6 2.2 0 0 1 -12 0 z" />
      <path d="M2 3.5 a6 2.2 0 0 0 12 0 M2 8 a6 2.2 0 0 0 12 0" />
    </svg>
  ),
};

// Initial state for all modules
const INITIAL_STATE = {
  projectName: '',
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
  }
};

function App() {
  const [activeTab, setActiveTab] = useState('library');

  // Eye-training data (analysis cards + criteria) — separate store/lifecycle
  // from the legacy planning data below.
  const [eyeData, setEyeData] = useState(loadEyeData);
  const [openCardId, setOpenCardId] = useState(null);

  useEffect(() => {
    saveEyeData(eyeData);
  }, [eyeData]);

  const newCard = () => {
    const card = createCard();
    setEyeData(prev => ({ ...prev, cards: [...prev.cards, card] }));
    setOpenCardId(card.id);
  };

  const updateCard = (updated) => {
    setEyeData(prev => ({
      ...prev,
      cards: prev.cards.map(c => c.id === updated.id ? updated : c)
    }));
  };

  const deleteCard = async (id) => {
    if (!confirm('Delete this analysis card? Its media is removed too.')) return;
    try {
      await deleteImageFromDB(mediaKey(id));
      await deleteImageFromDB(thumbKey(id));
    } catch (err) {
      console.warn('Failed to delete card media:', err);
    }
    // Also drop the card from any criterion that cites it as evidence.
    setEyeData(prev => ({
      ...prev,
      cards: prev.cards.filter(c => c.id !== id),
      criteria: prev.criteria.map(cr => ({
        ...cr,
        evidenceCardIds: cr.evidenceCardIds.filter(cid => cid !== id)
      }))
    }));
    if (openCardId === id) setOpenCardId(null);
  };

  const openCard = eyeData.cards.find(c => c.id === openCardId) || null;

  const addCriterion = () => {
    setEyeData(prev => ({ ...prev, criteria: [...prev.criteria, createCriterion()] }));
  };

  const updateCriterion = (updated) => {
    setEyeData(prev => ({
      ...prev,
      criteria: prev.criteria.map(c => c.id === updated.id ? updated : c)
    }));
  };

  const deleteCriterion = (id) => {
    setEyeData(prev => ({ ...prev, criteria: prev.criteria.filter(c => c.id !== id) }));
  };

  // Jump from a criterion's evidence chip to the card it cites.
  const openCardFromCriteria = (cardId) => {
    setOpenCardId(cardId);
    setActiveTab('library');
  };

  // Load state from localStorage or use initial
  const [vfxData, setVfxData] = useState(() => {
    try {
      const saved = localStorage.getItem('vfx_gate_data');
      return saved ? JSON.parse(saved) : INITIAL_STATE;
    } catch {
      return INITIAL_STATE;
    }
  });

  // Persist state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('vfx_gate_data', JSON.stringify(vfxData));
  }, [vfxData]);

  const updateBrief = (updates) => {
    setVfxData(prev => ({ ...prev, brief: { ...prev.brief, ...updates } }));
  };

  const tabs = [
    { id: 'library', label: 'Library' },
    { id: 'criteria', label: 'My Criteria' },
    { id: 'brief', label: 'Design Brief' },
    { id: 'export', label: 'Export' },
    { id: 'backup', label: 'Backup' },
  ];

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="brand">
          <h1>VFX Gate</h1>
          <span>Eye-training</span>
        </div>
        <nav className="nav-menu">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {NAV_ICONS[tab.id]}
              <span className="label">{tab.label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          {eyeData.cards.length} cards · {eyeData.criteria.length} criteria
        </div>
      </aside>

      <main className="main-content">
        <header className="top-bar">
          <h2>{activeTab === 'library' && openCard ? 'Library · Analysis' : tabs.find(t => t.id === activeTab)?.label}</h2>
          <div className="user-info">
            <input
              className="project-name"
              value={vfxData.projectName}
              onChange={(e) => setVfxData(prev => ({ ...prev, projectName: e.target.value }))}
              placeholder="Project name"
            />
            <button
              className="btn btn-secondary"
              style={{ padding: '5px 14px', fontSize: '12px' }}
              onClick={() => { if (confirm('Reset all data?')) setVfxData(INITIAL_STATE); }}
            >Reset</button>
          </div>
        </header>

        <section className="view-container">
          <div className="view-inner">
            {activeTab === 'library' && (
              openCard ? (
                <ErrorBoundary name="AnalysisCard" key={`card-${openCard.id}`}>
                  <AnalysisCard card={openCard} onChange={updateCard} onBack={() => setOpenCardId(null)} />
                </ErrorBoundary>
              ) : (
                <ErrorBoundary name="Library" key="library">
                  <Library
                    cards={eyeData.cards}
                    onNewCard={newCard}
                    onOpenCard={setOpenCardId}
                    onDeleteCard={deleteCard}
                  />
                </ErrorBoundary>
              )
            )}
            {activeTab === 'criteria' && (
              <ErrorBoundary name="Criteria" key="criteria">
                <Criteria
                  criteria={eyeData.criteria}
                  cards={eyeData.cards}
                  onAdd={addCriterion}
                  onUpdate={updateCriterion}
                  onDelete={deleteCriterion}
                  onOpenCard={openCardFromCriteria}
                />
              </ErrorBoundary>
            )}
            {activeTab === 'brief' && <ErrorBoundary name="DesignBrief" key="brief"><DesignBrief data={vfxData.brief} update={updateBrief} /></ErrorBoundary>}
            {activeTab === 'export' && <ErrorBoundary name="Export" key="export"><Export data={vfxData} /></ErrorBoundary>}
            {activeTab === 'backup' && <ErrorBoundary name="Backup" key="backup"><Backup /></ErrorBoundary>}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
