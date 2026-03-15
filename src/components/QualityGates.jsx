import React from 'react';
import './QualityGates.css';

const QualityGates = ({ data, update }) => {
    const renderPillar = (pillar, title, icon, color) => {
        const items = data[pillar];
        const passed = items.filter(g => g.pass === true).length;
        const total = items.length;
        const progress = (passed / total) * 100;

        return (
            <div className="pillar-gate glass-panel" style={{ borderTop: `4px solid ${color}` }}>
                <div className="pillar-header">
                    <span className="pillar-icon">{icon}</span>
                    <h4>{title}</h4>
                    <span className="pillar-progress">{passed}/{total}</span>
                </div>
                <div className="progress-bar-bg">
                    <div className="progress-bar-fill" style={{ width: `${progress}%`, backgroundColor: color }}></div>
                </div>
                <div className="gate-items">
                    {items.map(item => (
                        <div key={item.id} className="gate-item">
                            <p>{item.label}</p>
                            <div className="gate-actions">
                                <button
                                    className={`gate-btn pass ${item.pass === true ? 'active' : ''}`}
                                    onClick={() => update(pillar, item.id, item.pass === true ? null : true)}
                                >PASS</button>
                                <button
                                    className={`gate-btn fail ${item.pass === false ? 'active' : ''}`}
                                    onClick={() => update(pillar, item.id, item.pass === false ? null : false)}
                                >FAIL</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="quality-gates">
            <div className="gates-grid">
                {renderPillar('clarity', 'Clarity Gate', '👁️', '#00f2ff')}
                {renderPillar('art', 'Art Gate', '🎨', '#ff007a')}
                {renderPillar('tech', 'Tech Gate', '⚙️', '#ccff00')}
                {renderPillar('perf', 'Performance Gate', '⚡', '#ff9d00')}
            </div>
        </div>
    );
};

export default QualityGates;
