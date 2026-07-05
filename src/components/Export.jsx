import React from 'react';
import './Export.css';

// Export = the planning exit: Design Brief as markdown.
// The analysis library travels via the Backup tab (full JSON) instead —
// an analysis-card report export is deferred to v2.
const Export = ({ data, onGoBackup }) => {
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
            <section className="export-card">
                <h2>Export documentation</h2>
                <p className="export-copy">
                    Design Brief를 markdown 파일로 다운로드한다. 브라우저의 Downloads 폴더에 저장된다.
                </p>
                <p className="export-tip">
                    분석 라이브러리(카드·기준·이미지) 전체를 옮기거나 공유하려면{' '}
                    <button className="export-link" onClick={onGoBackup}>Backup 탭</button>을 사용한다 — 단일 JSON으로 내보낸다.
                </p>
                <button className="btn btn-primary export-btn" onClick={handleExportBrief}>
                    Export Brief.md
                </button>
            </section>
        </div>
    );
};

export default Export;
