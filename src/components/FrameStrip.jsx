import React, { useEffect, useMemo, useRef, useState } from 'react';
import './FrameStrip.css';
import { createFrameCompositor } from '../utils/gif';

// A-A-R phase colors (see index.css tokens).
const PHASE_COLORS = {
  anticipation: 'var(--phase-anticipation)',
  action: 'var(--phase-action)',
  resolution: 'var(--phase-resolution)',
  unmarked: 'rgba(255,255,255,0.2)',
};

const PHASE_NAMES = {
  anticipation: 'Anticipation',
  action: 'Action',
  resolution: 'Resolution',
  unmarked: 'Unmarked',
};

const phaseOfFrame = (i, measure) => {
  const a = measure.actionStartFrame;
  const r = measure.resolutionStartFrame;
  if (r != null && i >= r) return 'resolution';
  if (a != null && i >= a) return 'action';
  if (a != null) return 'anticipation';
  return 'unmarked';
};

// Frame strip: the measuring instrument. Click a frame (or use ←/→,
// Shift = 10-frame jump) to inspect it, then pin the A-A-R boundaries
// and the peak frame on it.
const FrameStrip = ({ parsed, thumbnails, measure, onMeasureChange }) => {
  const [selected, setSelected] = useState(0);
  const previewRef = useRef(null);
  const selectedFrameRef = useRef(null);

  const frameCount = parsed ? parsed.frameCount : 0;

  // Keep the selected frame visible when navigating with slider/keyboard.
  useEffect(() => {
    selectedFrameRef.current?.scrollIntoView({ inline: 'center', block: 'nearest' });
  }, [selected]);

  // ←/→ frame navigation, Shift = 10-frame jump. Ignored while typing.
  useEffect(() => {
    if (!parsed) return;
    const onKey = (e) => {
      const t = e.target && e.target.tagName;
      if (t === 'TEXTAREA' || t === 'INPUT' || t === 'SELECT') return;
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      e.preventDefault();
      const step = (e.shiftKey ? 10 : 1) * (e.key === 'ArrowRight' ? 1 : -1);
      setSelected((s) => Math.max(0, Math.min(frameCount - 1, s + step)));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [parsed, frameCount]);

  const compositor = useMemo(
    () => (parsed ? createFrameCompositor(parsed) : null),
    [parsed]
  );

  // Cumulative start time (ms) of each frame, for the time readout.
  const frameStartMs = useMemo(() => {
    if (!parsed) return [];
    const starts = [];
    let acc = 0;
    for (const d of parsed.frameDelays) {
      starts.push(acc);
      acc += d;
    }
    return starts;
  }, [parsed]);

  useEffect(() => {
    if (!compositor || !previewRef.current) return;
    const index = Math.min(selected, parsed.frameCount - 1);
    const full = compositor.renderFrame(index);
    const canvas = previewRef.current;
    canvas.width = full.width;
    canvas.height = full.height;
    canvas.getContext('2d').drawImage(full, 0, 0);
  }, [compositor, parsed, selected]);

  if (!parsed) return null;

  const markers = [
    { key: 'actionStartFrame', badge: 'A', label: 'Action starts here', color: PHASE_COLORS.action, badgeBg: '#ff453a' },
    { key: 'resolutionStartFrame', badge: 'R', label: 'Resolution starts here', color: PHASE_COLORS.resolution, badgeBg: '#30d158' },
    { key: 'peakFrame', badge: '★', label: 'Peak frame', color: 'var(--text-primary)', badgeBg: '#ffffff' },
  ];

  // Overview bar proportions (falls back to a single unmarked band).
  const a = measure.actionStartFrame;
  const r = measure.resolutionStartFrame;
  const marked = a != null && r != null && r > a;
  const pct = (n) => Math.round((n / frameCount) * 100);
  const needleLeft = (i) => `calc(${(((i ?? 0) + 0.5) / frameCount) * 100}% - 1px)`;

  const phase = phaseOfFrame(selected, measure);

  return (
    <div className="frame-strip">
      <div className="strip-overview">
        <div className="strip-overview-bar">
          {marked ? (
            <>
              <div style={{ background: 'rgba(255,214,10,0.85)', flexGrow: pct(a) }}></div>
              <div style={{ background: 'rgba(255,69,58,0.9)', flexGrow: pct(r - a) }}></div>
              <div style={{ background: 'rgba(48,209,88,0.85)', flexGrow: pct(frameCount - r) }}></div>
            </>
          ) : (
            <div style={{ background: 'rgba(255,255,255,0.12)', flexGrow: 1 }}></div>
          )}
        </div>
        {measure.peakFrame != null && (
          <div className="strip-needle strip-needle-peak" style={{ left: needleLeft(measure.peakFrame) }}></div>
        )}
        <div className="strip-needle strip-needle-sel" style={{ left: needleLeft(selected) }}></div>
      </div>

      <div className="strip-scroll">
        {thumbnails.map((src, i) => (
          <button
            key={i}
            ref={selected === i ? selectedFrameRef : null}
            className={`strip-frame ${selected === i ? 'selected' : ''}`}
            style={{ boxShadow: `inset 0 -3px 0 ${PHASE_COLORS[phaseOfFrame(i, measure)]}` }}
            onClick={() => setSelected(i)}
            title={`Frame ${i} · ${(frameStartMs[i] / 1000).toFixed(2)}s`}
          >
            <img src={src} alt={`frame ${i}`} draggable={false} />
            <span className="strip-index">{i}</span>
            <span className="strip-badges">
              {markers.map(
                (m) =>
                  measure[m.key] === i && (
                    <span key={m.key} className="strip-badge" style={{ backgroundColor: m.badgeBg }}>
                      {m.badge}
                    </span>
                  )
              )}
            </span>
          </button>
        ))}
      </div>

      <div className="strip-inspector">
        <div className="strip-preview">
          <canvas ref={previewRef} />
        </div>
        <div className="strip-controls">
          <div className="strip-readout">
            <span className="strip-readout-frame">Frame {selected}</span>
            <span className="strip-readout-time">
              / {frameCount - 1} · {(frameStartMs[selected] / 1000).toFixed(2)}s · {frameStartMs[selected]}ms
            </span>
            <span
              className="strip-phase-pill"
              style={{
                borderColor: phase === 'unmarked' ? 'rgba(255,255,255,0.4)' : PHASE_COLORS[phase],
                color: phase === 'unmarked' ? 'rgba(255,255,255,0.4)' : PHASE_COLORS[phase],
              }}
            >
              {PHASE_NAMES[phase]}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max={frameCount - 1}
            value={selected}
            onChange={(e) => setSelected(parseInt(e.target.value))}
          />
          <div className="strip-marker-buttons">
            {markers.map((m) => {
              const isHere = measure[m.key] === selected;
              return (
                <button
                  key={m.key}
                  className={`strip-marker-btn ${isHere ? 'set' : ''}`}
                  style={{ borderColor: m.color, color: m.color }}
                  onClick={() => onMeasureChange({ [m.key]: isHere ? null : selected })}
                >
                  <span className="strip-marker-badge">{m.badge}</span>
                  <span>{isHere ? `Unset ${m.badge}` : m.label}</span>
                </button>
              );
            })}
          </div>
          <div className="strip-hints">
            <span><kbd>←</kbd> <kbd>→</kbd> 프레임 이동</span>
            <span><kbd>Shift</kbd> + 방향키 = 10프레임 점프</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FrameStrip;
