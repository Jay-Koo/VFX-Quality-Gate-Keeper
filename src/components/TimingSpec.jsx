import React, { useState, useEffect } from 'react';
import './TimingSpec.css';

const TimingSpec = ({ data, update }) => {
    // Initialize phaseRatios if not present (for existing data)
    useEffect(() => {
        if (!data.phaseRatios) {
            update({
                phaseRatios: {
                    anticipation: 15,
                    action: 25,
                    resolution: 60
                }
            });
        }
    }, [data.phaseRatios, update]);

    // Use dynamic phase ratios from state with fallback
    const phaseRatios = data.phaseRatios || { anticipation: 15, action: 25, resolution: 60 };

    const phases = [
        { key: 'anticipation', name: 'Anticipation', color: '#ffea00', pct: phaseRatios.anticipation },
        { key: 'action', name: 'Action (Peak)', color: '#ff1744', pct: phaseRatios.action },
        { key: 'resolution', name: 'Resolution', color: '#00e676', pct: phaseRatios.resolution },
    ];

    // Drag state
    const [dragging, setDragging] = useState(null);

    // Update phase ratio with auto-balancing
    const updatePhaseRatio = (key, newValue) => {
        const value = Math.max(5, Math.min(90, parseInt(newValue)));

        // Calculate remaining percentage for other phases
        const remaining = 100 - value;

        // Get other phases
        const otherKeys = Object.keys(phaseRatios).filter(k => k !== key);

        // Calculate current total of other phases
        const otherCurrentTotal = otherKeys.reduce((sum, k) => sum + phaseRatios[k], 0);

        // If other phases total is 0, distribute evenly
        if (otherCurrentTotal === 0) {
            const evenSplit = Math.floor(remaining / otherKeys.length);
            const newRatios = { [key]: value };
            otherKeys.forEach((k, i) => {
                newRatios[k] = i === 0 ? remaining - evenSplit * (otherKeys.length - 1) : evenSplit;
            });
            update({ phaseRatios: newRatios });
            return;
        }

        // Distribute remaining percentage proportionally to other phases
        const newRatios = { [key]: value };
        let distributedTotal = 0;

        otherKeys.forEach((k, index) => {
            if (index === otherKeys.length - 1) {
                // Last phase gets the remainder to ensure exact 100%
                newRatios[k] = remaining - distributedTotal;
            } else {
                const proportion = phaseRatios[k] / otherCurrentTotal;
                const newVal = Math.round(remaining * proportion);
                newRatios[k] = Math.max(5, newVal);
                distributedTotal += newRatios[k];
            }
        });

        update({ phaseRatios: newRatios });
    };

    // Handle drag on timeline bar
    const handleBarMouseDown = (e, phaseIndex) => {
        e.preventDefault();
        setDragging({ phaseIndex, startX: e.clientX });
    };

    const handleMouseMove = (e) => {
        if (!dragging) return;

        const container = e.currentTarget;
        const rect = container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const percentage = Math.max(0, Math.min(100, (mouseX / rect.width) * 100));

        if (dragging.phaseIndex === 0) {
            // Dragging between Anticipation and Action
            updatePhaseRatio('anticipation', Math.round(percentage));
        } else if (dragging.phaseIndex === 1) {
            // Dragging between Action and Resolution
            const anticipationPct = phaseRatios.anticipation;
            const actionPct = Math.round(percentage - anticipationPct);
            if (actionPct >= 5 && actionPct <= 90) {
                updatePhaseRatio('action', actionPct);
            }
        }
    };

    const handleMouseUp = () => {
        setDragging(null);
    };

    const totalPct = Object.values(phaseRatios).reduce((sum, v) => sum + v, 0);

    return (
        <div className="timing-spec">
            <div className="spec-header glass-panel">
                <div className="main-input">
                    <label>Total Duration (seconds)</label>
                    <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={data.totalTime / 1000}
                        onChange={(e) => {
                            const value = parseFloat(e.target.value);
                            if (!isNaN(value) && value >= 0) {
                                update({ totalTime: Math.round(value * 1000) });
                            }
                        }}
                        onBlur={(e) => {
                            if (e.target.value === '' || isNaN(parseFloat(e.target.value))) {
                                update({ totalTime: 0 });
                            }
                        }}
                        style={{ fontSize: '1.2rem', fontWeight: 'bold' }}
                    />
                    <div className="time-conversions" style={{ display: 'flex', gap: '12px', marginTop: '8px', fontSize: '0.9rem', color: '#aaa' }}>
                        <span>⏱️ {data.totalTime}ms</span>
                        <span>🎞️ ~{(data.totalTime * 60 / 1000).toFixed(1)} frames @60fps</span>
                    </div>
                </div>
                <div className="curve-selector">
                    <label>Tension Curve (Non-linear)</label>
                    <select value={data.curve} onChange={(e) => update({ curve: e.target.value })}>
                        <option value="Slow-Fast">Slow-Fast (Acceleration)</option>
                        <option value="Fast-Slow">Fast-Slow (Snap)</option>
                        <option value="Pulse">Pulse (2-Peak)</option>
                        <option value="Linear">Linear (NOT RECOMMENDED)</option>
                    </select>
                    {data.curve === 'Linear' && <span className="warning">⚠ Linear curve reduces impact!</span>}
                </div>
            </div>

            <div className="timeline-container glass-panel">
                <h5 style={{ marginBottom: '12px', color: '#00f2ff' }}>Phase Breakdown (A-A-R) - Drag to Adjust</h5>

                {/* Draggable Timeline Visualization */}
                <div
                    style={{
                        position: 'relative',
                        height: '80px',
                        display: 'flex',
                        marginBottom: '16px',
                        cursor: dragging ? 'ew-resize' : 'default',
                        userSelect: 'none'
                    }}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                >
                    {phases.map((phase, index) => {
                        return (
                            <div
                                key={phase.key}
                                style={{
                                    width: `${phase.pct}%`,
                                    backgroundColor: phase.color + '33',
                                    borderLeft: `3px solid ${phase.color}`,
                                    borderRight: index === phases.length - 1 ? `3px solid ${phase.color}` : 'none',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    position: 'relative',
                                    transition: dragging ? 'none' : 'width 0.2s ease'
                                }}
                            >
                                <span style={{ fontWeight: 'bold', color: phase.color, fontSize: '0.9rem' }}>
                                    {phase.name}
                                </span>
                                <span style={{ fontSize: '0.85rem', color: '#ccc' }}>
                                    {phase.pct}%
                                </span>
                                <span style={{ fontSize: '0.75rem', color: '#888' }}>
                                    {((data.totalTime * phase.pct / 100) / 1000).toFixed(2)}s
                                </span>

                                {/* Drag Handle */}
                                {index < phases.length - 1 && (
                                    <div
                                        onMouseDown={(e) => handleBarMouseDown(e, index)}
                                        style={{
                                            position: 'absolute',
                                            right: '-6px',
                                            top: 0,
                                            bottom: 0,
                                            width: '12px',
                                            cursor: 'ew-resize',
                                            backgroundColor: 'rgba(255,255,255,0.1)',
                                            borderLeft: '2px solid rgba(255,255,255,0.3)',
                                            borderRight: '2px solid rgba(255,255,255,0.3)',
                                            zIndex: 10,
                                            transition: 'background-color 0.2s'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.3)'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                                    >
                                        <div style={{
                                            position: 'absolute',
                                            top: '50%',
                                            left: '50%',
                                            transform: 'translate(-50%, -50%)',
                                            color: '#fff',
                                            fontSize: '16px',
                                            pointerEvents: 'none'
                                        }}>
                                            ⋮
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className="timeline-labels" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <span>0s</span>
                    <span>{(data.totalTime / 1000).toFixed(1)}s</span>
                </div>

                {/* Total Indicator */}
                <div style={{ padding: '8px', background: totalPct === 100 ? 'rgba(0,230,118,0.1)' : 'rgba(255,23,68,0.1)', borderRadius: '4px', textAlign: 'center', marginBottom: '16px' }}>
                    <span style={{ color: totalPct === 100 ? '#00e676' : '#ff1744', fontWeight: 'bold' }}>
                        Total: {totalPct}%
                    </span>
                    {totalPct !== 100 && <span style={{ color: '#ff1744', marginLeft: '8px' }}>⚠ Must equal 100%</span>}
                </div>

                {/* Phase Details Table */}
                <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px' }}>
                    <table style={{ width: '100%', fontSize: '0.9rem', color: '#ccc' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid #444' }}>
                                <th style={{ textAlign: 'left', padding: '8px' }}>Phase</th>
                                <th style={{ textAlign: 'right', padding: '8px' }}>Duration (s)</th>
                                <th style={{ textAlign: 'right', padding: '8px' }}>Duration (ms)</th>
                                <th style={{ textAlign: 'right', padding: '8px' }}>Percentage</th>
                            </tr>
                        </thead>
                        <tbody>
                            {phases.map(phase => {
                                const durationMs = (data.totalTime * phase.pct / 100);
                                const durationS = (durationMs / 1000);
                                return (
                                    <tr key={phase.name} style={{ borderBottom: '1px solid #333' }}>
                                        <td style={{ padding: '8px', color: phase.color }}>{phase.name}</td>
                                        <td style={{ textAlign: 'right', padding: '8px', fontWeight: 'bold' }}>{durationS.toFixed(2)}s</td>
                                        <td style={{ textAlign: 'right', padding: '8px', color: '#888' }}>{durationMs.toFixed(0)}ms</td>
                                        <td style={{ textAlign: 'right', padding: '8px' }}>{phase.pct}%</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="timing-notes">
                <div className="note-card glass-panel">
                    <h5>[v3.0] Resolution Checklist</h5>
                    <label>
                        <input
                            type="checkbox"
                            checked={data.resolutionChecklist.aftereffect}
                            onChange={(e) => update({
                                resolutionChecklist: { ...data.resolutionChecklist, aftereffect: e.target.checked }
                            })}
                        /> Aftereffect defined (Smoke/Ember/etc.)
                    </label>
                    <label>
                        <input
                            type="checkbox"
                            checked={data.resolutionChecklist.gpuKill}
                            onChange={(e) => update({
                                resolutionChecklist: { ...data.resolutionChecklist, gpuKill: e.target.checked }
                            })}
                        /> GPU Kill condition set (Alpha/Scale)
                    </label>
                </div>
                <div className="note-card glass-panel">
                    <h5>[v3.0] Action Peak Info</h5>
                    <input
                        type="text"
                        placeholder="Primary element to be read in this phase"
                        value={data.actionPeakInfo}
                        onChange={(e) => update({ actionPeakInfo: e.target.value })}
                    />
                </div>
            </div>
        </div>
    );
};

export default TimingSpec;
