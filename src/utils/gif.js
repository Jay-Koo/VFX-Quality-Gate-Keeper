// GIF parsing/rendering utilities, extracted from ReferencePack.jsx so the
// analysis flow (Measure/FrameStrip) can reuse them. One improvement over the
// original: frames are composited onto the logical screen honoring patch
// offsets and disposal, so partial-frame GIFs render correctly in the strip.

import { parseGIF, decompressFrames } from 'gifuct-js';

// Parse a GIF ArrayBuffer → { frames, width, height, frameCount, frameDelays, durationMs }
export const parseGifBuffer = (arrayBuffer) => {
  const gif = parseGIF(arrayBuffer);
  const frames = decompressFrames(gif, true);
  if (!frames.length) throw new Error('GIF has no frames');
  const width = gif.lsd.width;
  const height = gif.lsd.height;
  // gifuct-js reports delay in ms; browsers treat 0 as ~100ms.
  const frameDelays = frames.map((f) => f.delay || 100);
  return {
    frames,
    width,
    height,
    frameCount: frames.length,
    frameDelays,
    durationMs: frameDelays.reduce((sum, d) => sum + d, 0),
  };
};

export const parseGifDataUrl = async (dataUrl) => {
  const response = await fetch(dataUrl);
  const arrayBuffer = await response.arrayBuffer();
  return parseGifBuffer(arrayBuffer);
};

// Sequential compositor. GIF frames can be partial patches with disposal
// modes, so frame N is only correct after drawing frames 0..N in order.
// Sequential access (the strip, a slider) is O(1) amortized; jumping
// backwards restarts from frame 0.
export const createFrameCompositor = ({ frames, width, height }) => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  const patchCanvas = document.createElement('canvas');
  const patchCtx = patchCanvas.getContext('2d');

  let nextIndex = 0;
  let prevFrame = null;

  const drawNext = () => {
    const frame = frames[nextIndex];
    if (prevFrame && prevFrame.disposalType === 2) {
      // Restore-to-background: clear the previous frame's patch area.
      const d = prevFrame.dims;
      ctx.clearRect(d.left, d.top, d.width, d.height);
    }
    const d = frame.dims;
    patchCanvas.width = d.width;
    patchCanvas.height = d.height;
    patchCtx.putImageData(new ImageData(frame.patch, d.width, d.height), 0, 0);
    ctx.drawImage(patchCanvas, d.left, d.top);
    prevFrame = frame;
    nextIndex++;
  };

  const renderFrame = (index) => {
    if (index < 0 || index >= frames.length) throw new Error(`Frame index out of range: ${index}`);
    if (index < nextIndex - 1) {
      ctx.clearRect(0, 0, width, height);
      nextIndex = 0;
      prevFrame = null;
    }
    while (nextIndex <= index) drawNext();
    return canvas; // live canvas — draw it elsewhere, don't keep the reference
  };

  return { renderFrame };
};

// Render every frame to a downscaled dataURL for the frame strip.
export const renderAllThumbnails = (parsed, maxHeight = 64) => {
  const compositor = createFrameCompositor(parsed);
  const scale = Math.min(1, maxHeight / parsed.height);
  const tw = Math.max(1, Math.round(parsed.width * scale));
  const th = Math.max(1, Math.round(parsed.height * scale));
  const thumb = document.createElement('canvas');
  thumb.width = tw;
  thumb.height = th;
  const tctx = thumb.getContext('2d');

  return parsed.frames.map((_, i) => {
    const full = compositor.renderFrame(i);
    tctx.clearRect(0, 0, tw, th);
    tctx.drawImage(full, 0, 0, tw, th);
    return thumb.toDataURL('image/png');
  });
};

// Render a single frame to a dataURL, optionally downscaled to maxWidth.
// Uses its own compositor — intended for one-off captures (e.g. card thumbnail).
export const frameToDataUrl = (parsed, index, { maxWidth = null, type = 'image/png', quality } = {}) => {
  const compositor = createFrameCompositor(parsed);
  const full = compositor.renderFrame(index);
  if (!maxWidth || full.width <= maxWidth) return full.toDataURL(type, quality);
  const scale = maxWidth / full.width;
  const out = document.createElement('canvas');
  out.width = maxWidth;
  out.height = Math.max(1, Math.round(full.height * scale));
  out.getContext('2d').drawImage(full, 0, 0, out.width, out.height);
  return out.toDataURL(type, quality);
};
