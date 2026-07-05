// Eye-training data store: analysis cards + personal criteria.
// Lives in its own localStorage key, separate from the legacy planning data
// (vfx_gate_data) — the card library is a long-lived asset with its own
// backup lifecycle. Images/GIFs go to IndexedDB (see mediaKey/thumbKey).

const STORAGE_KEY = 'vfx_eye_data';
export const SCHEMA_VERSION = 1;

export const EMPTY_EYE_DATA = Object.freeze({
  schemaVersion: SCHEMA_VERSION,
  cards: [],
  criteria: [],
});

export const isValidEyeData = (data) =>
  !!data &&
  typeof data === 'object' &&
  Array.isArray(data.cards) &&
  Array.isArray(data.criteria);

export const loadEyeData = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...EMPTY_EYE_DATA };
    const data = JSON.parse(raw);
    return isValidEyeData(data) ? data : { ...EMPTY_EYE_DATA };
  } catch {
    return { ...EMPTY_EYE_DATA };
  }
};

export const saveEyeData = (data) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const getRawEyeData = () => localStorage.getItem(STORAGE_KEY);
export const setRawEyeData = (json) => localStorage.setItem(STORAGE_KEY, json);

// IndexedDB key namespace for card media (original GIF/image) and thumbnail.
export const mediaKey = (cardId) => `card_media_${cardId}`;
export const thumbKey = (cardId) => `card_thumb_${cardId}`;

export const createCard = () => {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
    title: '',
    source: '',
    media: {
      type: null, // 'gif' | 'image' | null
      frameCount: 0,
      durationMs: 0,
      frameDelays: [], // per-frame delay in ms — needed to derive per-phase ms
    },
    measure: {
      actionStartFrame: null, // Anticipation → Action boundary (frame index)
      resolutionStartFrame: null, // Action → Resolution boundary (frame index)
      peakFrame: null, // highest-impact frame (thumbnail source)
      note: '',
    },
    lens: {}, // { questionId: answer text }
    distill: {
      takeaway: '',
      tags: [],
    },
  };
};

export const createCriterion = () => {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
    text: '',
    pillar: 'clarity', // clarity | art | tech | perf
    evidenceCardIds: [],
    note: '',
  };
};

// Derive A-A-R segments from marked boundaries. Returns null until both
// boundaries are set and consistent. Ratios/ms are always derived, never stored.
export const computeAAR = (media, measure) => {
  const frameCount = media?.frameCount || 0;
  const a = measure?.actionStartFrame;
  const r = measure?.resolutionStartFrame;
  if (!frameCount || a == null || r == null) return null;
  if (a < 0 || r <= a || r > frameCount) return null;

  const delays =
    media.frameDelays && media.frameDelays.length === frameCount
      ? media.frameDelays
      : null;
  const msRange = (from, to) =>
    delays ? delays.slice(from, to).reduce((sum, d) => sum + (d || 100), 0) : null;
  const segment = (from, to) => ({
    frames: to - from,
    pct: Math.round(((to - from) / frameCount) * 100),
    ms: msRange(from, to),
  });

  return {
    anticipation: segment(0, a),
    action: segment(a, r),
    resolution: segment(r, frameCount),
  };
};

export const countLensAnswers = (card) =>
  Object.values(card.lens || {}).filter((v) => v && v.trim() !== '').length;
