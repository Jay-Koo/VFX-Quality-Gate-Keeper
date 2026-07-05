import React, { useEffect, useState } from 'react';
import './AnalysisCard.css';
import FrameStrip from './FrameStrip';
import { LENS_PILLARS, ALL_QUESTIONS, DISTILL_PRESET_TAGS } from '../data/lensQuestions';
import { computeAAR, countLensAnswers, mediaKey, thumbKey } from '../utils/eyeStore';
import { saveImageToDB, getImageFromDB } from '../utils/indexedDB';
import { parseGifBuffer, parseGifDataUrl, renderAllThumbnails, frameToDataUrl } from '../utils/gif';

const THUMB_MAX_WIDTH = 400;

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

const downscaleDataUrl = (dataUrl, maxWidth) =>
  new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width);
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    img.src = dataUrl;
  });

// One analysis card = one 15–20 min dissection loop, as a single vertical
// flow: ① Intake → ② Measure → ③ Lens → ④ Distill. The tool asks and
// measures; the writing stays human.
const AnalysisCard = ({ card, onChange, onBack }) => {
  const [parsed, setParsed] = useState(null); // gif parse result
  const [thumbnails, setThumbnails] = useState([]);
  const [imageUrl, setImageUrl] = useState(null); // still-image media
  const [mediaLoading, setMediaLoading] = useState(false);
  const [tagInput, setTagInput] = useState('');

  const patch = (partial) =>
    onChange({ ...card, ...partial, updatedAt: new Date().toISOString() });

  // Reload media from IndexedDB when opening an existing card.
  useEffect(() => {
    if (!card.media.type) return;
    if (card.media.type === 'gif' && parsed) return;
    if (card.media.type === 'image' && imageUrl) return;

    let cancelled = false;
    (async () => {
      setMediaLoading(true);
      try {
        const dataUrl = await getImageFromDB(mediaKey(card.id));
        if (cancelled || !dataUrl) return;
        if (card.media.type === 'gif') {
          const p = await parseGifDataUrl(dataUrl);
          if (cancelled) return;
          setParsed(p);
          setThumbnails(renderAllThumbnails(p));
        } else {
          setImageUrl(dataUrl);
        }
      } catch (err) {
        console.warn('Failed to load card media:', err);
      } finally {
        if (!cancelled) setMediaLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [card.id, card.media.type, parsed, imageUrl]);

  const handleMediaUpload = async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;

    setMediaLoading(true);
    try {
      const dataUrl = await readFileAsDataUrl(file);
      await saveImageToDB(mediaKey(card.id), dataUrl);

      if (file.type.includes('gif')) {
        const p = parseGifBuffer(await file.arrayBuffer());
        setParsed(p);
        setThumbnails(renderAllThumbnails(p));
        setImageUrl(null);
        // Default library thumbnail = middle frame, replaced when ★ peak is marked.
        const mid = Math.floor(p.frameCount / 2);
        await saveImageToDB(
          thumbKey(card.id),
          frameToDataUrl(p, mid, { maxWidth: THUMB_MAX_WIDTH, type: 'image/jpeg', quality: 0.8 })
        );
        patch({
          media: { type: 'gif', frameCount: p.frameCount, durationMs: p.durationMs, frameDelays: p.frameDelays },
          measure: { actionStartFrame: null, resolutionStartFrame: null, peakFrame: null, note: card.measure.note },
        });
      } else {
        setParsed(null);
        setThumbnails([]);
        setImageUrl(dataUrl);
        await saveImageToDB(thumbKey(card.id), await downscaleDataUrl(dataUrl, THUMB_MAX_WIDTH));
        patch({
          media: { type: 'image', frameCount: 0, durationMs: 0, frameDelays: [] },
          measure: { actionStartFrame: null, resolutionStartFrame: null, peakFrame: null, note: card.measure.note },
        });
      }
    } catch (err) {
      alert(`Failed to load media: ${err.message}`);
    } finally {
      setMediaLoading(false);
    }
  };

  const handleMeasureChange = (partial) => {
    if (partial.peakFrame != null && parsed) {
      saveImageToDB(
        thumbKey(card.id),
        frameToDataUrl(parsed, partial.peakFrame, { maxWidth: THUMB_MAX_WIDTH, type: 'image/jpeg', quality: 0.8 })
      ).catch((err) => console.warn('Thumbnail save failed:', err));
    }
    patch({ measure: { ...card.measure, ...partial } });
  };

  const setLensAnswer = (questionId, text) =>
    patch({ lens: { ...card.lens, [questionId]: text } });

  const toggleTag = (tag) => {
    const tags = card.distill.tags.includes(tag)
      ? card.distill.tags.filter((t) => t !== tag)
      : [...card.distill.tags, tag];
    patch({ distill: { ...card.distill, tags } });
  };

  const addFreeTag = () => {
    const tag = tagInput.trim().toLowerCase();
    setTagInput('');
    if (tag && !card.distill.tags.includes(tag)) {
      patch({ distill: { ...card.distill, tags: [...card.distill.tags, tag] } });
    }
  };

  const aar = computeAAR(card.media, card.measure);
  const boundariesSet =
    card.measure.actionStartFrame != null && card.measure.resolutionStartFrame != null;

  const totalQuestions = ALL_QUESTIONS.length;
  const answered = countLensAnswers(card);
  const pillarCount = (pillar) =>
    pillar.questions.filter((q) => card.lens[q.id] && card.lens[q.id].trim()).length;

  const sectionHead = (num, title, sub) => (
    <div className="ac-sec-head">
      <span className="ac-sec-num">{num}</span>
      <h2>{title}</h2>
      <span className="ac-sec-sub">{sub}</span>
    </div>
  );

  return (
    <div className="analysis-card">
      {/* Sub-header */}
      <div className="ac-topbar">
        <div className="ac-topbar-left">
          <button className="ac-back" onClick={onBack}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M8 1.5 L3.5 6 L8 10.5" />
            </svg>
            <span>Library</span>
          </button>
          <span className="ac-topbar-divider"></span>
          <span className="ac-topbar-title">{card.title || 'Untitled'}</span>
        </div>
        <div className="ac-topbar-right">
          <span className="ac-saved">Saved · {new Date(card.updatedAt).toLocaleTimeString()}</span>
          <div className="ac-progress">
            <div className="ac-progress-track">
              <div className="ac-progress-fill" style={{ width: `${Math.round((answered / totalQuestions) * 100)}%` }}></div>
            </div>
            <span className="ac-progress-count">{answered}/{totalQuestions}</span>
          </div>
        </div>
      </div>

      <div className="ac-layout">
        {/* Step rail */}
        <nav className="ac-rail">
          <a href="#sec-intake"><span className="ac-rail-num">01</span><span>Intake</span></a>
          <a href="#sec-measure"><span className="ac-rail-num">02</span><span>Measure</span></a>
          <a href="#sec-lens"><span className="ac-rail-num">03</span><span>Lens</span></a>
          <div className="ac-rail-pillars">
            {LENS_PILLARS.map((p) => (
              <a key={p.key} href={`#pillar-${p.key}`}>
                <span className="ac-rail-dot" style={{ background: p.color }}></span>
                <span>{p.name}</span>
                <span className="ac-rail-count">{pillarCount(p)}/{p.questions.length}</span>
              </a>
            ))}
          </div>
          <a href="#sec-distill"><span className="ac-rail-num">04</span><span>Distill</span></a>
        </nav>

        {/* Card body */}
        <div className="ac-body">
          {/* 01 Intake */}
          <section id="sec-intake" className="ac-section">
            {sectionHead('01', 'Intake', '레퍼런스 투입')}
            <div className="ac-intake-grid">
              <div className="ac-fields">
                <label>Title</label>
                <input
                  type="text"
                  value={card.title}
                  placeholder="e.g. Ahri R dash burst"
                  onChange={(e) => patch({ title: e.target.value })}
                />
                <label>Source</label>
                <input
                  type="text"
                  value={card.source}
                  placeholder="game / artist / URL / memo"
                  onChange={(e) => patch({ source: e.target.value })}
                />
              </div>
              <div className="ac-media">
                {mediaLoading ? (
                  <div className="ac-media-placeholder">Loading media…</div>
                ) : card.media.type === 'image' && imageUrl ? (
                  <img src={imageUrl} alt="reference" />
                ) : card.media.type === 'gif' && parsed ? (
                  <div className="ac-media-meta">
                    <span className="ac-media-badge">
                      GIF · {card.media.frameCount} frames · {(card.media.durationMs / 1000).toFixed(2)}s
                    </span>
                  </div>
                ) : (
                  <div className="ac-media-placeholder">GIF(권장) 또는 이미지를 올린다</div>
                )}
                <label className="btn btn-secondary ac-upload">
                  {card.media.type ? 'Replace media…' : 'Upload GIF / image…'}
                  <input type="file" accept="image/*" onChange={handleMediaUpload} style={{ display: 'none' }} />
                </label>
              </div>
            </div>
          </section>

          {/* 02 Measure */}
          <section id="sec-measure" className="ac-section">
            {sectionHead('02', 'Measure', 'A-A-R 측정')}
            {card.media.type === 'gif' && parsed ? (
              <>
                <p className="ac-hint">
                  프레임을 고르고 경계를 찍는다 — A = Action 시작, R = Resolution 시작, ★ = 피크(카드 썸네일).
                </p>
                <FrameStrip
                  parsed={parsed}
                  thumbnails={thumbnails}
                  measure={card.measure}
                  onMeasureChange={handleMeasureChange}
                />
                {aar ? (
                  <div className="ac-aar">
                    {[
                      { name: 'ANTICIPATION', seg: aar.anticipation, color: 'var(--phase-anticipation)' },
                      { name: 'ACTION', seg: aar.action, color: 'var(--phase-action)' },
                      { name: 'RESOLUTION', seg: aar.resolution, color: 'var(--phase-resolution)' },
                    ].map(({ name, seg, color }) => (
                      <div key={name} className="ac-aar-seg" style={{ borderTopColor: color, flexGrow: Math.max(seg.pct, 14) }}>
                        <div className="ac-aar-name" style={{ color }}>{name}</div>
                        <div className="ac-aar-vals">
                          <span className="ac-aar-pct">{seg.pct}%</span>
                          <span className="ac-aar-detail">{seg.frames}f{seg.ms != null ? ` · ${seg.ms}ms` : ''}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="ac-warn">
                    {boundariesSet
                      ? '⚠ 경계 순서가 맞지 않는다 — A(Action 시작)가 R(Resolution 시작)보다 앞이어야 한다.'
                      : '프레임 스트립에서 A와 R 경계를 찍으면 비율·프레임수·ms가 자동 계산된다.'}
                  </p>
                )}
                <div className="ac-field-block">
                  <label>Measure note — 측정하며 발견한 것</label>
                  <textarea
                    rows="2"
                    value={card.measure.note}
                    placeholder="e.g. Action이 3프레임뿐인데 임팩트가 크다 — 프레임당 변화량이 크기 때문"
                    onChange={(e) => handleMeasureChange({ note: e.target.value })}
                  />
                </div>
              </>
            ) : (
              <p className="ac-warn">GIF를 올리면 프레임 단위 측정이 열린다. (정지 이미지는 Lens/Distill만 진행)</p>
            )}
          </section>

          {/* 03 Lens */}
          <section id="sec-lens" className="ac-section">
            {sectionHead('03', 'Lens', '4필러 렌즈로 관찰')}
            <p className="ac-hint">빈 답 허용 — 질문은 백지 부담을 없애는 장치지 강제가 아니다. 단, 쓴 만큼 눈이 자란다.</p>
            {LENS_PILLARS.map((pillar) => (
              <div key={pillar.key} id={`pillar-${pillar.key}`} className="ac-pillar">
                <div className="ac-pillar-head">
                  <span className="ac-pillar-dot" style={{ background: pillar.color }}></span>
                  <h3>{pillar.name}</h3>
                  <span className="ac-pillar-sub">{pillar.sub}</span>
                  <span className="ac-pillar-count">{pillarCount(pillar)}/{pillar.questions.length} answered</span>
                </div>
                <div className="ac-questions">
                  {pillar.questions.map((q) => {
                    const hasAnswer = card.lens[q.id] && card.lens[q.id].trim();
                    return (
                      <div key={q.id} className="ac-question">
                        <span
                          className="ac-q-num"
                          style={{ color: hasAnswer ? pillar.color : 'rgba(255,255,255,0.3)' }}
                        >
                          {q.id.toUpperCase()}
                        </span>
                        <div className="ac-q-body">
                          <label>{q.text}</label>
                          <textarea
                            rows="2"
                            value={card.lens[q.id] || ''}
                            placeholder="관찰한 것을 적는다 — 프레임 번호·개수·위치로"
                            onChange={(e) => setLensAnswer(q.id, e.target.value)}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </section>

          {/* 04 Distill */}
          <section id="sec-distill" className="ac-section">
            {sectionHead('04', 'Distill', '훔칠 것 한 가지')}
            <div className="ac-field-block" style={{ marginTop: 0 }}>
              <label>Takeaway</label>
              <textarea
                rows="2"
                className="ac-takeaway"
                value={card.distill.takeaway}
                placeholder="이 레퍼런스에서 훔칠 것 한 가지 — 구체적으로"
                onChange={(e) => patch({ distill: { ...card.distill, takeaway: e.target.value } })}
              />
            </div>
            <div className="ac-field-block">
              <label>Tags</label>
              <div className="ac-tags">
                {DISTILL_PRESET_TAGS.map((tag) => (
                  <button
                    key={tag}
                    className={`ac-tag ${card.distill.tags.includes(tag) ? 'active' : ''}`}
                    onClick={() => toggleTag(tag)}
                  >
                    #{tag}
                  </button>
                ))}
                {card.distill.tags
                  .filter((t) => !DISTILL_PRESET_TAGS.includes(t))
                  .map((tag) => (
                    <button key={tag} className="ac-tag active" onClick={() => toggleTag(tag)} title="Click to remove">
                      #{tag} ✕
                    </button>
                  ))}
                <input
                  type="text"
                  className="ac-tag-input"
                  value={tagInput}
                  placeholder="+ tag"
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') addFreeTag();
                  }}
                />
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default AnalysisCard;
