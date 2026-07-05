import React, { useState } from 'react';
import './Criteria.css';
import { LENS_PILLARS } from '../data/lensQuestions';

// "My Criteria" — hand-written judgment rules, each linked to the analysis
// cards that back it. The evidence link is the whole point: it is what
// separates a criterion from an unfounded declaration (the old app's flaw).
const Criteria = ({ criteria, cards, onAdd, onUpdate, onDelete, onOpenCard }) => {
  const [pickerFor, setPickerFor] = useState(null); // criterion id with evidence picker open

  const cardById = (id) => cards.find((c) => c.id === id);
  const patch = (criterion, partial) =>
    onUpdate({ ...criterion, ...partial, updatedAt: new Date().toISOString() });

  const toggleEvidence = (criterion, cardId) => {
    const has = criterion.evidenceCardIds.includes(cardId);
    patch(criterion, {
      evidenceCardIds: has
        ? criterion.evidenceCardIds.filter((id) => id !== cardId)
        : [...criterion.evidenceCardIds, cardId],
    });
  };

  const renderCriterion = (criterion) => (
    <div key={criterion.id} className="crit-item">
      <textarea
        className="crit-text"
        rows="1"
        value={criterion.text}
        placeholder='판단 규칙을 명문화한다 — e.g. "히트류 Action은 8프레임 이내"'
        onChange={(e) => patch(criterion, { text: e.target.value })}
      />
      <div className="crit-meta">
        <select
          value={criterion.pillar}
          onChange={(e) => patch(criterion, { pillar: e.target.value })}
        >
          {LENS_PILLARS.map((p) => (
            <option key={p.key} value={p.key}>{p.name}</option>
          ))}
        </select>
        <input
          type="text"
          className="crit-note"
          value={criterion.note}
          placeholder="예외·조건 메모 (optional)"
          onChange={(e) => patch(criterion, { note: e.target.value })}
        />
        <button
          className="crit-delete"
          title="Delete criterion"
          onClick={() => {
            if (confirm('Delete this criterion?')) onDelete(criterion.id);
          }}
        >
          Delete
        </button>
      </div>

      <div className="crit-evidence">
        <span className="crit-evidence-label">
          근거{criterion.evidenceCardIds.length === 0 && ' — 없음 (근거 없는 선언 주의)'}
        </span>
        {criterion.evidenceCardIds.map((cardId) => {
          const card = cardById(cardId);
          if (!card) return null;
          return (
            <span key={cardId} className="crit-chip">
              <button className="crit-chip-open" title="Open card" onClick={() => onOpenCard(cardId)}>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.2">
                  <rect x="1" y="1" width="8" height="8" rx="2" />
                </svg>
                <span>{card.title || 'Untitled'}</span>
              </button>
              <button
                className="crit-chip-remove"
                title="Unlink"
                onClick={() => toggleEvidence(criterion, cardId)}
              >
                ×
              </button>
            </span>
          );
        })}
        <button
          className="crit-link-btn"
          onClick={() => setPickerFor(pickerFor === criterion.id ? null : criterion.id)}
        >
          {pickerFor === criterion.id ? 'Close' : '+ Link card'}
        </button>
      </div>

      {pickerFor === criterion.id && (
        <div className="crit-picker">
          {cards.length === 0 ? (
            <p className="crit-picker-empty">카드가 없다 — Library에서 먼저 분석을 쌓는다.</p>
          ) : (
            cards.map((card) => (
              <label key={card.id} className="crit-picker-row">
                <input
                  type="checkbox"
                  checked={criterion.evidenceCardIds.includes(card.id)}
                  onChange={() => toggleEvidence(criterion, card.id)}
                />
                <span>{card.title || 'Untitled'}</span>
                {card.distill.takeaway && (
                  <span className="crit-picker-takeaway">— {card.distill.takeaway}</span>
                )}
              </label>
            ))
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="criteria">
      <div className="crit-header">
        <div>
          <h1>My Criteria</h1>
          <p className="crit-sub">
            카드가 쌓이면 패턴이 보인다 — 보인 패턴을 여기서 손으로 명문화한다. 각 기준은 근거 카드에 링크한다.
          </p>
        </div>
        <button className="btn btn-primary" onClick={onAdd}>+ New Criterion</button>
      </div>

      {criteria.length === 0 ? (
        <div className="crit-empty glass-panel">
          <p>아직 기준이 없다. 정상이다 — 기준은 카드보다 늦게 온다.</p>
          <p>같은 패턴을 3장 이상의 카드에서 봤다면, 그때 첫 기준을 쓴다.</p>
        </div>
      ) : (
        LENS_PILLARS.map((pillar) => {
          const group = criteria.filter((c) => c.pillar === pillar.key);
          if (group.length === 0) return null;
          return (
            <div key={pillar.key} className="crit-group">
              <div className="crit-group-head">
                <span className="crit-group-dot" style={{ background: pillar.color }}></span>
                <h3>{pillar.name}</h3>
                <span className="crit-group-count">{group.length}</span>
              </div>
              <div className="crit-group-items">
                {group.map(renderCriterion)}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default Criteria;
