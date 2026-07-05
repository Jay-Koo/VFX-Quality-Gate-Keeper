import React from 'react';
import './DesignBrief.css';

const DesignBrief = ({ data, update }) => {
    const sectionHead = (num, title) => (
        <div className="db-sec-head">
            <span className="db-sec-num">{num}</span>
            <h2>{title}</h2>
        </div>
    );

    return (
        <div className="design-brief">
            <div className="db-grid">
                {/* 01 Basic Information */}
                <section className="db-section">
                    {sectionHead('01', 'Basic information')}
                    <div className="db-fields">
                        <div className="db-field">
                            <label>Effect purpose</label>
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
                        <div className="db-field">
                            <label>Effect name / skill</label>
                            <input
                                type="text"
                                placeholder="e.g. Fireball, Shield Break, Dash Trail…"
                                value={data.context}
                                onChange={(e) => update({ context: e.target.value })}
                            />
                        </div>
                        <div className="db-field">
                            <label>Camera distance</label>
                            <div className="db-segmented">
                                {['Close', 'Mid', 'Far'].map(dist => (
                                    <button
                                        key={dist}
                                        className={data.camera === dist ? 'active' : ''}
                                        onClick={() => update({ camera: dist })}
                                    >
                                        {dist}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* 02 Performance & Constraints */}
                <section className="db-section">
                    {sectionHead('02', 'Performance & constraints')}
                    <div className="db-row">
                        <div className="db-field">
                            <label>Draw call (max)</label>
                            <input
                                type="number"
                                value={data.drawCall}
                                onChange={(e) => update({ drawCall: parseInt(e.target.value) || 0 })}
                            />
                        </div>
                        <div className="db-field">
                            <label>Particle count (max)</label>
                            <input
                                type="number"
                                value={data.particleCount}
                                onChange={(e) => update({ particleCount: parseInt(e.target.value) || 0 })}
                            />
                        </div>
                    </div>
                    <div className="db-field db-occupancy">
                        <div className="db-occupancy-head">
                            <label>Screen occupancy</label>
                            <span className="db-occupancy-value">max {data.occupancy}%</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={data.occupancy}
                            onChange={(e) => update({ occupancy: parseInt(e.target.value) })}
                        />
                    </div>
                    <label className="db-check">
                        <input
                            type="checkbox"
                            checked={data.uiInterfere}
                            onChange={(e) => update({ uiInterfere: e.target.checked })}
                        />
                        <span>UI interfere check (HP / skill slots)</span>
                    </label>
                </section>
            </div>

            {/* 03 Quality Targets */}
            <section className="db-section">
                {sectionHead('03', 'Quality targets')}
                <div className="db-targets">
                    <div className="db-target" style={{ borderTopColor: 'var(--pillar-clarity)' }}>
                        <h3 style={{ color: 'var(--pillar-clarity)' }}>Clarity goals</h3>
                        <textarea
                            rows="3"
                            placeholder="플레이어가 이해해야 할 피드백은? (히트 확정, 크리티컬, 스킬 준비, 위험 지역…)"
                            value={data.clarityGoals}
                            onChange={(e) => update({ clarityGoals: e.target.value })}
                        ></textarea>
                        <label className="db-check">
                            <input
                                type="checkbox"
                                checked={data.aoeAlignment}
                                onChange={(e) => update({ aoeAlignment: e.target.checked })}
                            />
                            <span>AoE / hitbox alignment required</span>
                        </label>
                        <div className="db-telegraph">
                            <label title="Warning time before the effect activates (0 = instant)">Telegraph time (ms)</label>
                            <input
                                type="number"
                                placeholder="400"
                                value={data.telegraphTime}
                                onChange={(e) => update({ telegraphTime: parseInt(e.target.value) || 0 })}
                            />
                        </div>
                    </div>

                    <div className="db-target" style={{ borderTopColor: 'var(--pillar-art)' }}>
                        <h3 style={{ color: 'var(--pillar-art)' }}>Artistic goals</h3>
                        <input
                            type="text"
                            placeholder="Primary element — 피크에서 가장 잘 읽히는 요소"
                            value={data.primaryElement}
                            onChange={(e) => update({ primaryElement: e.target.value })}
                        />
                        <div className="db-colors">
                            <label className="db-color">
                                <input
                                    type="color"
                                    value={data.coreColor}
                                    onChange={(e) => update({ coreColor: e.target.value })}
                                />
                                <span>Core {data.coreColor}</span>
                            </label>
                            <label className="db-color">
                                <input
                                    type="color"
                                    value={data.subColor}
                                    onChange={(e) => update({ subColor: e.target.value })}
                                />
                                <span>Sub {data.subColor}</span>
                            </label>
                        </div>
                    </div>

                    <div className="db-target" style={{ borderTopColor: 'var(--pillar-tech)' }}>
                        <h3 style={{ color: 'var(--pillar-tech)' }}>Technical goals</h3>
                        <select
                            value={data.integration}
                            onChange={(e) => update({ integration: e.target.value })}
                        >
                            <option>Depth Fade</option>
                            <option>Contact Decal</option>
                            <option>Light Wrap</option>
                            <option>Mobile Fake Light</option>
                        </select>
                        <input
                            type="text"
                            placeholder="Aftereffect — Smoke / Ember / Residual glow"
                            value={data.aftereffect}
                            onChange={(e) => update({ aftereffect: e.target.value })}
                        />
                    </div>
                </div>
            </section>
        </div>
    );
};

export default DesignBrief;
