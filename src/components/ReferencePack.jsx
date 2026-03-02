import React, { useState, useEffect, useRef } from 'react';
import './ReferencePack.css';
import { saveImageToDB, getImageFromDB, deleteImageFromDB } from '../App';
import { parseGIF, decompressFrames } from 'gifuct-js';

const ReferencePack = ({ data, update }) => {
    // Local state to store actual images (blobs/dataURLs) loaded from IndexedDB
    const [loadedImages, setLoadedImages] = useState({});

    // Load images from IndexedDB whenever data changes or on mount
    useEffect(() => {
        const loadAll = async () => {
            const newLoaded = {};
            for (const ref of data) {
                if (ref.hasImage) {
                    const img = await getImageFromDB(`main_${ref.id}`);
                    if (img) newLoaded[`main_${ref.id}`] = img;
                }
                if (ref.frames) {
                    for (const frame of Object.keys(ref.frames)) {
                        if (ref.frames[frame]) {
                            const img = await getImageFromDB(`frame_${ref.id}_${frame}`);
                            if (img) newLoaded[`frame_${ref.id}_${frame}`] = img;
                        }
                    }
                }
            }
            setLoadedImages(newLoaded);
        };
        loadAll();
    }, [data]);

    const addRef = () => {
        const newRef = {
            id: Date.now(),
            name: 'New Reference',
            platform: 'Mobile',
            pillar: 'Clarity',
            type: 'Shape',
            notes: '',
            hasImage: false,
            frames: { '0%': false, '20%': false, '60%': false, '100%': false }
        };
        update([...data, newRef]);
    };

    const removeRef = async (id) => {
        if (confirm('Remove this reference?')) {
            await deleteImageFromDB(`main_${id}`);
            ['0%', '20%', '60%', '100%'].forEach(async f => await deleteImageFromDB(`frame_${id}_${f}`));
            update(data.filter(ref => ref.id !== id));
        }
    };

    const updateRef = (id, field, value) => {
        update(data.map(ref => ref.id === id ? { ...ref, [field]: value } : ref));
    };

    const handleImageUpload = async (id, e, frameKey = null) => {
        const file = e.target.files[0];
        if (!file) return;

        // Visual feedback: show loading state or immediately start processing
        const reader = new FileReader();
        reader.onloadend = async () => {
            const dataUrl = reader.result;
            const dbKey = frameKey ? `frame_${id}_${frameKey}` : `main_${id}`;

            await saveImageToDB(dbKey, dataUrl);

            if (frameKey) {
                const updatedRefs = data.map(ref => {
                    if (ref.id === id) {
                        return { ...ref, frames: { ...ref.frames, [frameKey]: true } };
                    }
                    return ref;
                });
                update(updatedRefs);
            } else {
                updateRef(id, 'hasImage', true);

                // Auto-detect GIF and activate frame extractor
                if (file.type.includes('gif')) {
                    setGifFrameExtractor({ refId: id, gifDataUrl: dataUrl, totalFrames: 0 });
                }
            }
        };
        reader.readAsDataURL(file);
    };

    const clearImage = async (id, frameKey = null) => {
        const dbKey = frameKey ? `frame_${id}_${frameKey}` : `main_${id}`;
        await deleteImageFromDB(dbKey);

        if (frameKey) {
            const updatedRefs = data.map(ref => {
                if (ref.id === id) {
                    return { ...ref, frames: { ...ref.frames, [frameKey]: false } };
                }
                return ref;
            });
            update(updatedRefs);
        } else {
            updateRef(id, 'hasImage', false);
        }
    };

    // GIF Frame Extraction with gifuct-js
    const [gifFrames, setGifFrames] = useState(null); // Parsed GIF frames
    const [gifFrameExtractor, setGifFrameExtractor] = useState({ refId: null, totalFrames: 0 });
    const [frameCapture, setFrameCapture] = useState({ active: false, refId: null, targetFrame: null, currentFrameIndex: 0 });
    const previewCanvasRef = useRef(null);

    const handleGifUpload = async (id, e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.includes('gif')) {
            alert('Please upload a GIF file');
            return;
        }

        try {
            console.log('🎬 Parsing GIF file...');

            // Read file as ArrayBuffer for gifuct-js
            const arrayBuffer = await file.arrayBuffer();

            // Parse GIF structure
            const gif = parseGIF(arrayBuffer);

            // Decompress all frames
            const frames = decompressFrames(gif, true);

            console.log(`✅ GIF parsed: ${frames.length} frames`);
            console.log('First frame dims:', frames[0].dims);

            // Store parsed frames
            setGifFrames(frames);
            setGifFrameExtractor({ refId: id, totalFrames: frames.length });

            // Also save GIF as main image for display
            const reader = new FileReader();
            reader.onloadend = async () => {
                await saveImageToDB(`main_${id}`, reader.result);
                updateRef(id, 'hasImage', true);
            };
            reader.readAsDataURL(file);

        } catch (error) {
            console.error('❌ Error parsing GIF:', error);
            alert(`Error parsing GIF: ${error.message}`);
        }
    };

    const openFrameCapture = (refId, framePercentage) => {
        if (!gifFrames || gifFrames.length === 0) {
            alert('Please upload a GIF first to extract frames');
            return;
        }

        // Calculate initial frame index from percentage
        const pct = parseInt(framePercentage) / 100;
        const frameIndex = Math.floor(pct * (gifFrames.length - 1));

        console.log(`Opening frame capture for ${framePercentage} → frame ${frameIndex}/${gifFrames.length}`);

        setFrameCapture({
            active: true,
            refId: refId,
            targetFrame: framePercentage,
            currentFrameIndex: frameIndex
        });
    };

    const captureCurrentFrame = async () => {
        console.log('🎬 Starting frame capture...');
        console.log('Frame capture state:', frameCapture);
        console.log('Current frame index:', frameCapture.currentFrameIndex);

        if (!gifFrames || gifFrames.length === 0) {
            console.error('❌ No GIF frames available!');
            alert('No GIF frames found. Please upload a GIF first.');
            return;
        }

        try {
            const frameData = gifFrames[frameCapture.currentFrameIndex];
            console.log('✅ Frame data:', frameData.dims);

            // Create canvas
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            canvas.width = frameData.dims.width;
            canvas.height = frameData.dims.height;

            console.log('Canvas created:', canvas.width, 'x', canvas.height);

            // Create ImageData from frame patch
            const imageData = new ImageData(
                frameData.patch,
                frameData.dims.width,
                frameData.dims.height
            );

            // Draw frame to canvas
            ctx.putImageData(imageData, 0, 0);
            console.log('✅ Frame rendered to canvas');

            // Convert to data URL
            const frameDataUrl = canvas.toDataURL('image/png');
            console.log('✅ Frame converted to PNG, size:', frameDataUrl.length, 'bytes');

            // Save to IndexedDB
            const dbKey = `frame_${frameCapture.refId}_${frameCapture.targetFrame}`;
            console.log('Saving to IndexedDB with key:', dbKey);
            await saveImageToDB(dbKey, frameDataUrl);
            console.log('✅ Saved to IndexedDB');

            // Update loadedImages immediately for instant UI update
            setLoadedImages(prev => {
                const updated = {
                    ...prev,
                    [dbKey]: frameDataUrl
                };
                console.log('✅ Updated loadedImages state');
                return updated;
            });

            // Update state
            const updatedRefs = data.map(ref => {
                if (ref.id === frameCapture.refId) {
                    return { ...ref, frames: { ...ref.frames, [frameCapture.targetFrame]: true } };
                }
                return ref;
            });
            update(updatedRefs);
            console.log('✅ Updated refs state');

            // Close modal
            setFrameCapture({ active: false, refId: null, targetFrame: null, currentFrameIndex: 0 });
            console.log('✅ Frame capture complete!');
            alert(`Frame ${frameCapture.targetFrame} (frame ${frameCapture.currentFrameIndex + 1}/${gifFrames.length}) captured successfully!`);
        } catch (error) {
            console.error('❌ Error during frame capture:', error);
            alert(`Error capturing frame: ${error.message}`);
        }
    };

    const closeGifExtractor = () => {
        setGifFrameExtractor({ refId: null, gifDataUrl: null, totalFrames: 0 });
    };

    const activateFrameExtractorFromExisting = async (refId) => {
        try {
            console.log('🔄 Activating frame extractor for existing GIF...');

            // Load the existing main image from IndexedDB
            const existingGif = await getImageFromDB(`main_${refId}`);
            if (!existingGif) {
                alert('No image found. Please upload a GIF first.');
                return;
            }

            // Convert data URL to ArrayBuffer
            const response = await fetch(existingGif);
            const blob = await response.blob();
            const arrayBuffer = await blob.arrayBuffer();

            // Parse GIF structure
            const gif = parseGIF(arrayBuffer);

            // Decompress all frames
            const frames = decompressFrames(gif, true);

            console.log(`✅ Existing GIF parsed: ${frames.length} frames`);

            // Store parsed frames
            setGifFrames(frames);
            setGifFrameExtractor({ refId: refId, totalFrames: frames.length });

        } catch (error) {
            console.error('❌ Error parsing existing GIF:', error);
            alert(`Error parsing GIF: ${error.message}`);
        }
    };

    return (
        <div className="reference-pack">
            <div className="ref-controls glass-panel">
                <div className="title-group">
                    <h3>Reference Pack Management</h3>
                    <p className="hint">Large resources (GIFs/High-res) are stored securely in IndexedDB.</p>
                </div>
                <button className="btn btn-primary" onClick={addRef}>+ Add Reference</button>
            </div>

            <div className="ref-list">
                {data.map(ref => (
                    <div key={ref.id} className="ref-card glass-panel">
                        <button className="remove-btn" onClick={() => removeRef(ref.id)} title="Remove Reference">×</button>
                        <div className="ref-preview-section">
                            <div className="ref-preview">
                                {ref.hasImage ? (
                                    <img src={loadedImages[`main_${ref.id}`]} alt="Preview" />
                                ) : (
                                    <div className="placeholder-uploader">
                                        <span>Click to upload main ref (GIF Supported)</span>
                                        <input type="file" onChange={(e) => handleImageUpload(ref.id, e)} accept="image/*" />
                                    </div>
                                )}
                            </div>
                            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                                {ref.hasImage && (
                                    <>
                                        <button className="btn btn-tiny" onClick={() => clearImage(ref.id)}>Clear Image</button>
                                        <button
                                            className="btn btn-tiny"
                                            onClick={() => activateFrameExtractorFromExisting(ref.id)}
                                            style={{ background: 'rgba(0,242,255,0.2)' }}
                                        >
                                            🎬 Use for Frames
                                        </button>
                                    </>
                                )}
                                <label className="btn btn-tiny" style={{ cursor: 'pointer', margin: 0 }}>
                                    🎬 Upload GIF
                                    <input type="file" onChange={(e) => handleGifUpload(ref.id, e)} accept="image/gif" style={{ display: 'none' }} />
                                </label>
                            </div>
                        </div>

                        <div className="ref-info">
                            <input
                                type="text"
                                value={ref.name}
                                className="ref-name-input"
                                onChange={(e) => updateRef(ref.id, 'name', e.target.value)}
                            />
                            <div className="ref-selectors">
                                <div className="selector-group">
                                    <label>Platform</label>
                                    <select value={ref.platform} onChange={(e) => updateRef(ref.id, 'platform', e.target.value)}>
                                        <option>Mobile</option>
                                        <option>PC/Console</option>
                                        <option>Cross-platform</option>
                                    </select>
                                </div>
                                <div className="selector-group">
                                    <label>Pillar</label>
                                    <select value={ref.pillar} onChange={(e) => updateRef(ref.id, 'pillar', e.target.value)}>
                                        <option>Clarity</option>
                                        <option>Art</option>
                                        <option>Tech</option>
                                        <option>Performance</option>
                                    </select>
                                </div>
                                <div className="selector-group">
                                    <label>Type</label>
                                    <select value={ref.type} onChange={(e) => updateRef(ref.id, 'type', e.target.value)}>
                                        <option>Shape</option>
                                        <option>Motion</option>
                                        <option>Decay</option>
                                        <option>Timing</option>
                                        <option>Color</option>
                                    </select>
                                </div>
                            </div>
                            <div className="ref-notes">
                                <label>Analysis Notes</label>
                                <textarea
                                    placeholder="Reason for adoption / Learning points..."
                                    value={ref.notes}
                                    onChange={(e) => updateRef(ref.id, 'notes', e.target.value)}
                                ></textarea>
                            </div>
                        </div>

                        <div className="frame-analysis">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <h5>Frame Analysis (v3.0)</h5>
                                {gifFrameExtractor.refId === ref.id && gifFrameExtractor.gifDataUrl && (
                                    <span style={{ fontSize: '0.85rem', color: '#00f2ff' }}>🎬 GIF loaded - Click frames to extract</span>
                                )}
                            </div>
                            <div className="frames-grid">
                                {['0%', '20%', '60%', '100%'].map(frame => (
                                    <div key={frame} className="frame-box">
                                        {ref.frames?.[frame] ? (
                                            <img src={loadedImages[`frame_${ref.id}_${frame}`]} alt={frame} onClick={() => {
                                                if (confirm('Clear frame image?')) {
                                                    clearImage(ref.id, frame);
                                                }
                                            }} />
                                        ) : (
                                            <>
                                                <span className="frame-label">{frame}</span>
                                                {gifFrameExtractor.refId === ref.id && gifFrameExtractor.gifDataUrl ? (
                                                    <button
                                                        className="btn btn-tiny"
                                                        onClick={() => openFrameCapture(ref.id, frame)}
                                                        style={{ position: 'absolute', bottom: '4px', fontSize: '0.7rem', padding: '2px 6px' }}
                                                    >
                                                        Select
                                                    </button>
                                                ) : (
                                                    <input type="file" onChange={(e) => handleImageUpload(ref.id, e, frame)} accept="image/*" />
                                                )}
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Frame Capture Modal */}
            {frameCapture.active && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.9)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999
                }}>
                    <div style={{
                        background: '#1a1a2e',
                        padding: '24px',
                        borderRadius: '12px',
                        maxWidth: '800px',
                        maxHeight: '90vh',
                        overflow: 'auto',
                        border: '2px solid #00f2ff'
                    }}>
                        <h3 style={{ color: '#00f2ff', marginBottom: '16px' }}>🎬 Select Frame: {frameCapture.targetFrame}</h3>
                        <p style={{ color: '#aaa', marginBottom: '16px' }}>
                            Use the slider to select the exact frame you want to capture. Total frames: {gifFrames?.length || 0}
                        </p>

                        {/* Frame Slider */}
                        <div style={{ marginBottom: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span style={{ color: '#00f2ff', fontWeight: 'bold' }}>
                                    Frame {frameCapture.currentFrameIndex + 1} / {gifFrames?.length || 0}
                                </span>
                                <span style={{ color: '#888', fontSize: '0.9rem' }}>
                                    {frameCapture.targetFrame}
                                </span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max={(gifFrames?.length || 1) - 1}
                                value={frameCapture.currentFrameIndex}
                                onChange={(e) => {
                                    const newIndex = parseInt(e.target.value);
                                    setFrameCapture(prev => ({ ...prev, currentFrameIndex: newIndex }));
                                }}
                                style={{
                                    width: '100%',
                                    height: '8px',
                                    borderRadius: '4px',
                                    background: 'linear-gradient(to right, #00f2ff, #ff007a)',
                                    outline: 'none',
                                    cursor: 'pointer'
                                }}
                            />
                        </div>

                        {/* Canvas Preview */}
                        <div style={{
                            background: '#000',
                            padding: '16px',
                            borderRadius: '8px',
                            marginBottom: '16px',
                            display: 'flex',
                            justifyContent: 'center',
                            minHeight: '300px',
                            alignItems: 'center'
                        }}>
                            <FramePreview
                                gifFrames={gifFrames}
                                frameIndex={frameCapture.currentFrameIndex}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                            <button
                                className="btn glass-panel"
                                onClick={() => setFrameCapture({ active: false, refId: null, targetFrame: null, currentFrameIndex: 0 })}
                                style={{ background: 'rgba(255,0,0,0.2)' }}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={captureCurrentFrame}
                            >
                                📸 Capture Frame {frameCapture.currentFrameIndex + 1}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Frame Preview Component
const FramePreview = ({ gifFrames, frameIndex }) => {
    const canvasRef = useRef(null);

    useEffect(() => {
        if (!gifFrames || !canvasRef.current || frameIndex >= gifFrames.length) return;

        const frameData = gifFrames[frameIndex];
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        // Set canvas size
        canvas.width = frameData.dims.width;
        canvas.height = frameData.dims.height;

        // Create ImageData from frame patch
        const imageData = new ImageData(
            frameData.patch,
            frameData.dims.width,
            frameData.dims.height
        );

        // Render frame
        ctx.putImageData(imageData, 0, 0);
    }, [gifFrames, frameIndex]);

    if (!gifFrames || gifFrames.length === 0) {
        return <div style={{ color: '#888' }}>No frames loaded</div>;
    }

    return (
        <canvas
            ref={canvasRef}
            style={{
                maxWidth: '100%',
                maxHeight: '60vh',
                objectFit: 'contain',
                imageRendering: 'pixelated'
            }}
        />
    );
};

export default ReferencePack;
