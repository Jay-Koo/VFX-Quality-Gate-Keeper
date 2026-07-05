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

  return (
    <div className="library">
      <div className="lib-toolbar glass-panel">
        <div>
          <h3>Analysis Library</h3>
          <p className="lib-count">
            {cards.length} cards{filtered.length !== cards.length ? ` · ${filtered.length} shown` : ''}
          </p>
        </div>
        <button className="btn btn-primary" onClick={onNewCard}>+ New Analysis</button>
      </div>

      {(allTags.length > 0 || cards.length > 0) && (
        <div className="lib-filters">
          <div className="lib-filter-row">
            <span className="lib-filter-label">Pillar</span>
            {LENS_PILLARS.map((p) => (
              <button
                key={p.key}
                className={`lib-chip ${pillarFilter === p.key ? 'active' : ''}`}
                style={pillarFilter === p.key ? { borderColor: p.color, color: p.color } : {}}
                onClick={() => setPillarFilter(pillarFilter === p.key ? null : p.key)}
              >
                {p.icon} {p.name}
              </button>
            ))}
          </div>
          {allTags.length > 0 && (
            <div className="lib-filter-row">
              <span className="lib-filter-label">Tag</span>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  className={`lib-chip ${tagFilter === tag ? 'active' : ''}`}
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
              <div key={card.id} className="lib-card glass-panel" onClick={() => onOpenCard(card.id)}>
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
                </div>
                <div className="lib-body">
                  <h4>{card.title || 'Untitled'}</h4>
                  {card.source && <p className="lib-source">{card.source}</p>}
                  <div className="lib-badges">
                    {aar && (
                      <span className="lib-badge lib-badge-aar" title="A-A-R %">
                        {aar.anticipation.pct}·{aar.action.pct}·{aar.resolution.pct}
                      </span>
                    )}
                    <span className="lib-badge" title="Lens answers">
                      ✍ {answers}/{ALL_QUESTIONS.length}
                    </span>
                  </div>
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
