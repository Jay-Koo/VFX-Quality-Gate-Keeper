import React from 'react';
import './Export.css';

// Export = the planning exit: Design Brief as markdown.
// The analysis library travels via the Backup tab (full JSON) instead —
// an analysis-card report export is deferred to v2.
const Export = ({ data }) => {
    const downloadFile = (content, filename) => {
        const blob = new Blob([content], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleExportBrief = () => {
        const { brief } = data;
        const md = `# VFX Design Brief: ${brief.context || 'Untitled Project'}

## 1. Basic Information
- **Purpose**: ${brief.purpose}
- **Context**: ${brief.context}
- **Camera**: ${brief.camera}

## 2. Performance & Constraints
- **Draw Calls (Max)**: ${brief.drawCall}
- **Particle Count (Max)**: ${brief.particleCount}
- **Screen Occupancy**: Max ${brief.occupancy}%
- **UI Interfere Check**: ${brief.uiInterfere ? 'Yes' : 'No'}

## 3. Quality Targets
- **Clarity Goals**: ${brief.clarityGoals}
- **AoE Alignment Required**: ${brief.aoeAlignment ? 'Yes' : 'No'}
- **Telegraph Time**: ${brief.telegraphTime}ms
- **Primary Element**: ${brief.primaryElement}
- **Colors**: Core: ${brief.coreColor}, Sub: ${brief.subColor}
- **Integration**: ${brief.integration}
- **Aftereffect Component**: ${brief.aftereffect}
`;
        downloadFile(md, 'VFX_DesignBrief.md');
    };

    return (
        <div className="export-view">
            <div className="export-header glass-panel">
                <div className="status-info">
                    <h3>📄 Export Documentation</h3>
                    <p>Download the Design Brief as a markdown file.</p>
                    <div className="path-info">
                        <strong>💾 Save Location:</strong> Files will be downloaded to your browser's <span style={{ color: '#00f2ff' }}>Downloads</span> folder.
                    </div>
                    <div style={{ marginTop: '12px', padding: '8px', background: 'rgba(0,242,255,0.1)', borderRadius: '4px', fontSize: '0.9rem' }}>
                        <strong>💡 Tip:</strong> To move or share your analysis library (cards, criteria, images), use the <strong>Backup</strong> tab — it exports everything as a single JSON file.
                    </div>
                </div>
            </div>

            <div className="quick-md-export">
                <h5 style={{ marginBottom: '12px', color: '#00f2ff' }}>📥 Download Files</h5>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <button className="btn glass-panel" onClick={handleExportBrief} style={{ flex: '1', minWidth: '200px' }}>
                        📝 Export Brief.md
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Export;
