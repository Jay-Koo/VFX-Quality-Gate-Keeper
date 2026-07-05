import React, { useEffect, useMemo, useState } from 'react';
import './Library.css';
import { LENS_PILLARS, ALL_QUESTIONS } from '../data/lensQuestions';
import { computeAAR, countLensAnswers, thumbKey } from '../utils/eyeStore';
import { getImageFromDB } from '../utils/indexedDB';

// The library is the browsing surface where patterns emerge — the tool only
// lays the cards out; spotting the pattern (and writing it into My Criteria)
// stays a human act.
const Library = ({ cards, onNewCard, onOpenCard, onDeleteCard }) => {
  const [thumbs, setThumbs] = useState({});
  const [tagFilter, setTagFilter] = useState(null);
  const [pillarFilter, setPillarFilter] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const loaded = {};
      for (const card of cards) {
        try {
          const img = await getImageFromDB(thumbKey(card.id));
          if (img) loaded[card.id] = img;
        } catch {
          // thumbnail is decoration — ignore load failures
        }
      }
      if (!cancelled) setThumbs(loaded);
    })();
    return () => {
      cancelled = true;
    };
  }, [cards]);

  const allTags = useMemo(
    () => [...new Set(cards.flatMap((c) => c.distill.tags))].sort(),
    [cards]
  );

  const answeredPillars = (card) => {
    const answered = new Set(
      ALL_QUESTIONS.filter((q) => card.lens[q.id] && card.lens[q.id].trim() !== '').map((q) => q.pillar)
    );
    return answered;
  };

  const filtered = cards.filter((card) => {
    if (tagFilter && !card.distill.tags.includes(tagFilter)) return false;
    if (pillarFilter && !answeredPillars(card).has(pillarFilter)) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));

  const answerColor = (n) =>
    n >= ALL_QUESTIONS.length ? 'var(--phase-resolution)' : n >= 8 ? 'var(--text-primary)' : 'rgba(255,255,255,0.6)';

  return (
    <div className="library">
      <div className="lib-header">
        <div>
          <h1>Analysis Library</h1>
          <p className="lib-count">
            {cards.length} cards{filtered.length !== cards.length ? ` · ${filtered.length} shown` : ''} — 패턴이 보이면 My Criteria에 명문화한다
          </p>
        </div>
        <button className="btn btn-primary" onClick={onNewCard}>+ New Analysis</button>
      </div>

      {cards.length > 0 && (
        <div className="lib-filters">
          <div className="lib-filter-row">
            <span className="lib-filter-label">Pillar</span>
            {LENS_PILLARS.map((p) => {
              const active = pillarFilter === p.key;
              return (
                <button
                  key={p.key}
                  className={`lib-chip ${active ? 'active' : ''}`}
                  style={active ? { borderColor: p.color, color: p.color } : {}}
                  onClick={() => setPillarFilter(active ? null : p.key)}
                >
                  <span className="lib-chip-dot" style={{ background: p.color }}></span>
                  {p.name}
                </button>
              );
            })}
          </div>
          {allTags.length > 0 && (
            <div className="lib-filter-row">
              <span className="lib-filter-label">Tag</span>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  className={`lib-chip lib-chip-tag ${tagFilter === tag ? 'active' : ''}`}
                  onClick={() => setTagFilter(tagFilter === tag ? null : tag)}
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {cards.length === 0 ? (
        <div className="lib-empty glass-panel">
          <p>아직 카드가 없다. 좋은 이펙트를 발견했을 때가 시작점이다 —</p>
          <p><strong>+ New Analysis</strong>로 첫 해부를 시작한다 (15~20분).</p>
        </div>
      ) : (
        <div className="lib-grid">
          {sorted.map((card) => {
            const aar = computeAAR(card.media, card.measure);
            const answers = countLensAnswers(card);
            return (
              <div key={card.id} className="lib-card" onClick={() => onOpenCard(card.id)}>
                <button
                  className="lib-delete"
                  title="Delete card"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteCard(card.id);
                  }}
                >
                  ×
                </button>
                <div className="lib-thumb">
                  {thumbs[card.id] ? (
                    <img src={thumbs[card.id]} alt={card.title || 'card thumbnail'} />
                  ) : (
                    <span className="lib-thumb-empty">no media</span>
                  )}
                  <span className="lib-answers" style={{ color: answerColor(answers) }}>
                    {answers}/{ALL_QUESTIONS.length}
                  </span>
                </div>
                {aar && (
                  <div className="lib-aar-strip">
                    <div style={{ background: 'var(--phase-anticipation)', flexGrow: aar.anticipation.pct }}></div>
                    <div style={{ background: 'var(--phase-action)', flexGrow: aar.action.pct }}></div>
                    <div style={{ background: 'var(--phase-resolution)', flexGrow: aar.resolution.pct }}></div>
                  </div>
                )}
                <div className="lib-body">
                  <div className="lib-title-row">
                    <h4>{card.title || 'Untitled'}</h4>
                    {aar && (
                      <span className="lib-aar-label" title="A-A-R %">
                        {aar.anticipation.pct}·{aar.action.pct}·{aar.resolution.pct}
                      </span>
                    )}
                  </div>
                  {card.source && <p className="lib-source">{card.source}</p>}
                  {card.distill.takeaway && <p className="lib-takeaway">“{card.distill.takeaway}”</p>}
                  {card.distill.tags.length > 0 && (
                    <div className="lib-tags">
                      {card.distill.tags.map((tag) => (
                        <span key={tag} className="lib-tag">#{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Library;
