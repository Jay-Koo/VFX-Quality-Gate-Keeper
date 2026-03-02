import React from 'react';
import './DesignBrief.css';

const DesignBrief = ({ data, update }) => {
    return (
        <div className="design-brief">
            <div className="brief-grid">
                {/* Basic Info Section */}
                <div className="brief-section glass-panel">
                    <h3>1. Basic Information</h3>
                    <div className="form-group">
                        <label>Effect Purpose</label>
                        <select
                            value={data.purpose}
                            onChange={(e) => update({ purpose: e.target.value })}
                        >
                            <option>Clarity (Readability)</option>
                            <option>Gratification (Feedback)</option>
                            <option>Threat (Warning)</option>
                            <option>World-building</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Effect Name / Skill</label>
                        <input
                            type="text"
                            placeholder="e.g., Fireball, Shield Break, Dash Trail..."
                            value={data.context}
                            onChange={(e) => update({ context: e.target.value })}
                        />
                    </div>
                    <div className="form-group">
                        <label>Camera Distance</label>
                        <div className="radio-group">
                            {['Close', 'Mid', 'Far'].map(dist => (
                                <label key={dist}>
                                    <input
                                        type="radio"
                                        name="camera"
                                        checked={data.camera === dist}
                                        onChange={() => update({ camera: dist })}
                                    /> {dist}
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Performance & Constraints */}
                <div className="brief-section glass-panel">
                    <h3>2. Performance & Constraints</h3>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Draw Call (Max)</label>
                            <input
                                type="number"
                                value={data.drawCall}
                                onChange={(e) => update({ drawCall: parseInt(e.target.value) || 0 })}
                            />
                        </div>
                        <div className="form-group">
                            <label>Particle Count (Max)</label>
                            <input
                                type="number"
                                value={data.particleCount}
                                onChange={(e) => update({ particleCount: parseInt(e.target.value) || 0 })}
                            />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Screen Occupancy (%)</label>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={data.occupancy}
                            onChange={(e) => update({ occupancy: parseInt(e.target.value) })}
                        />
                        <span className="value-display">Max {data.occupancy}%</span>
                    </div>
                    <div className="form-group checkbox-group">
                        <label>
                            <input
                                type="checkbox"
                                checked={data.uiInterfere}
                                onChange={(e) => update({ uiInterfere: e.target.checked })}
                            /> UI Interfere Check (HP/Skill Slots)
                        </label>
                    </div>
                </div>

                {/* v3.0 Quality Targets */}
                <div className="brief-section glass-panel full-width">
                    <h3>3. [v3.0] Quality Targets</h3>
                    <div className="targets-grid">
                        <div className="target-card clarity">
                            <h4>Clarity Goals</h4>
                            <textarea
                                placeholder="What feedback should the player understand? (e.g., Hit confirmed, Critical damage, Skill ready, Danger zone)"
                                value={data.clarityGoals}
                                onChange={(e) => update({ clarityGoals: e.target.value })}
                            ></textarea>
                            <label>
                                <input
                                    type="checkbox"
                                    checked={data.aoeAlignment}
                                    onChange={(e) => update({ aoeAlignment: e.target.checked })}
                                /> AoE/Hitbox Alignment Required
                            </label>
                            <div className="telegraph-input">
                                <label>
                                    Telegraph Time (ms)
                                    <span className="hint" title="Warning time before the effect activates (e.g., enemy attack warning)">ℹ️</span>
                                </label>
                                <input
                                    type="number"
                                    placeholder="400"
                                    value={data.telegraphTime}
                                    onChange={(e) => update({ telegraphTime: parseInt(e.target.value) || 0 })}
                                />
                                <small style={{ color: '#888', fontSize: '0.85rem', marginTop: '4px', display: 'block' }}>Time to warn player before effect hits (0 = instant)</small>
                            </div>
                        </div>

                        <div className="target-card art">
                            <h4>Artistic Goals</h4>
                            <div className="form-group">
                                <label>Primary Element (Hierarchy)</label>
                                <input
                                    type="text"
                                    placeholder="The most readable element at peak"
                                    value={data.primaryElement}
                                    onChange={(e) => update({ primaryElement: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Core Color (Primary)</label>
                                <div className="color-inputs">
                                    <input
                                        type="color"
                                        value={data.coreColor}
                                        onChange={(e) => update({ coreColor: e.target.value })}
                                        style={{ width: '60px', height: '40px' }}
                                    />
                                    <span style={{ marginLeft: '8px', color: '#aaa' }}>{data.coreColor}</span>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Sub Color (Secondary)</label>
                                <div className="color-inputs">
                                    <input
                                        type="color"
                                        value={data.subColor}
                                        onChange={(e) => update({ subColor: e.target.value })}
                                        style={{ width: '60px', height: '40px' }}
                                    />
                                    <span style={{ marginLeft: '8px', color: '#aaa' }}>{data.subColor}</span>
                                </div>
                            </div>
                        </div>

                        <div className="target-card tech">
                            <h4>Technical Goals</h4>
                            <div className="form-group">
                                <label>Integration Method</label>
                                <select
                                    value={data.integration}
                                    onChange={(e) => update({ integration: e.target.value })}
                                >
                                    <option>Depth Fade</option>
                                    <option>Contact Decal</option>
                                    <option>Light Wrap</option>
                                    <option>Mobile Fake Light</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Aftereffect Component</label>
                                <input
                                    type="text"
                                    placeholder="Smoke / Ember / Residual Glow"
                                    value={data.aftereffect}
                                    onChange={(e) => update({ aftereffect: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DesignBrief;
