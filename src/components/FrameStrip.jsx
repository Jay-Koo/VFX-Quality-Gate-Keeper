import React, { useEffect, useMemo, useRef, useState } from 'react';
import './FrameStrip.css';
import { createFrameCompositor } from '../utils/gif';

// A-A-R phase colors, same scheme as the old TimingSpec.
const PHASE_COLORS = {
  anticipation: '#ffea00',
  action: '#ff1744',
  resolution: '#00e676',
  unmarked: 'rgba(255,255,255,0.25)',
};

const phaseOfFrame = (i, measure) => {
  const a = measure.actionStartFrame;
  const r = measure.resolutionStartFrame;
  if (r != null && i >= r) return 'resolution';
  if (a != null && i >= a) return 'action';
  if (a != null) return 'anticipation';
  return 'unmarked';
};

// Frame strip: the measuring instrument. Click a frame to inspect it,
// then pin the A-A-R boundaries and the peak frame on it.
const FrameStrip = ({ parsed, thumbnails, measure, onMeasureChange }) => {
  const [selected, setSelected] = useState(0);
  const previewRef = useRef(null);
  const selectedFrameRef = useRef(null);

  // Keep the selected frame visible when navigating with the slider.
  useEffect(() => {
    selectedFrameRef.current?.scrollIntoView({ inline: 'center', block: 'nearest' });
  }, [selected]);

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
    { key: 'actionStartFrame', badge: 'A', label: 'Action starts here', color: PHASE_COLORS.action },
    { key: 'resolutionStartFrame', badge: 'R', label: 'Resolution starts here', color: PHASE_COLORS.resolution },
    { key: 'peakFrame', badge: '★', label: 'Peak frame', color: '#00f2ff' },
  ];

  return (
    <div className="frame-strip">
      <div className="strip-scroll">
        {thumbnails.map((src, i) => {
          const phase = phaseOfFrame(i, measure);
          return (
            <button
              key={i}
              ref={selected === i ? selectedFrameRef : null}
              className={`strip-frame ${selected === i ? 'selected' : ''}`}
              style={{ borderBottomColor: PHASE_COLORS[phase] }}
              onClick={() => setSelected(i)}
              title={`Frame ${i} · ${(frameStartMs[i] / 1000).toFixed(2)}s`}
            >
              <img src={src} alt={`frame ${i}`} draggable={false} />
              <span className="strip-index">{i}</span>
              <span className="strip-badges">
                {markers.map(
                  (m) =>
                    measure[m.key] === i && (
                      <span key={m.key} className="strip-badge" style={{ backgroundColor: m.color }}>
                        {m.badge}
                      </span>
                    )
                )}
              </span>
            </button>
          );
        })}
      </div>

      <div className="strip-inspector">
        <div className="strip-preview">
          <canvas ref={previewRef} />
        </div>
        <div className="strip-controls">
          <div className="strip-readout">
            <strong>Frame {selected}</strong> / {parsed.frameCount - 1}
            <span className="strip-time">
              {(frameStartMs[selected] / 1000).toFixed(2)}s · {frameStartMs[selected]}ms
            </span>
          </div>
          <input
            type="range"
            min="0"
            max={parsed.frameCount - 1}
            value={selected}
            onChange={(e) => setSelected(parseInt(e.target.value))}
          />
          <div className="strip-marker-buttons">
            {markers.map((m) => (
              <button
                key={m.key}
                className="btn btn-tiny"
                style={{ borderColor: m.color, color: m.color }}
                onClick={() =>
                  onMeasureChange({ [m.key]: measure[m.key] === selected ? null : selected })
                }
              >
                {measure[m.key] === selected ? `✕ Unset ${m.badge}` : `${m.badge} ${m.label}`}
              </button>
            ))}
          </div>
          <p className="strip-hint">
            프레임을 고르고 경계를 찍는다: A = Anticipation→Action 경계, R = Action→Resolution 경계, ★ = 최고 임팩트 프레임(카드 썸네일).
          </p>
        </div>
      </div>
    </div>
  );
};

export default FrameStrip;
