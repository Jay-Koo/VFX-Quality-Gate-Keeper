import React from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import './Export.css';

const Export = ({ data, getImageFromDB }) => {
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

    // Optimize image (resize & compress)
    const optimizeImage = async (dataUrl, maxWidth = 800, quality = 0.8) => {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                const optimized = canvas.toDataURL('image/jpeg', quality);
                resolve(optimized);
            };
            img.src = dataUrl;
        });
    };

    // Helpler to get base64 data for JSZip
    const getBase64Data = (dataUrl) => {
        return dataUrl.split(',')[1];
    }

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

    const handleExportTiming = () => {
        const { timing } = data;
        const phaseRatios = timing.phaseRatios || { anticipation: 15, action: 25, resolution: 60 };
        const md = `# VFX Timing Specification

- **Total Duration**: ${timing.totalTime}ms (~${(timing.totalTime * 60 / 1000).toFixed(1)} frames @60fps)
- **Tension Curve**: ${timing.curve}

## Phases
- Anticipation: ${phaseRatios.anticipation}% (${(timing.totalTime * phaseRatios.anticipation / 100).toFixed(0)}ms)
- Action (Peak): ${phaseRatios.action}% (${(timing.totalTime * phaseRatios.action / 100).toFixed(0)}ms)
- Resolution: ${phaseRatios.resolution}% (${(timing.totalTime * phaseRatios.resolution / 100).toFixed(0)}ms)

## Resolution Checklist
- Aftereffect defined: ${timing.resolutionChecklist.aftereffect ? 'Yes' : 'No'}
- GPU Kill condition set: ${timing.resolutionChecklist.gpuKill ? 'Yes' : 'No'}

## Action Peak Info
- ${timing.actionPeakInfo || 'N/A'}
`;
        downloadFile(md, 'VFX_TimingSpec.md');
    };

    const handleExportChecklist = () => {
        const { gates } = data;
        let md = `# VFX Quality Gate Checklist\n\n`;

        Object.entries(gates).forEach(([pillar, items]) => {
            md += `## ${pillar.toUpperCase()}\n`;
            items.forEach(item => {
                const status = item.pass === true ? '[x]' : (item.pass === false ? '[FAIL]' : '[ ]');
                md += `- ${status} ${item.label}\n`;
            });
            md += `\n`;
        });

        downloadFile(md, 'VFX_QualityGate_Checklist.md');
    };

    // Export Complete Report with Embedded Images (Single MD File)
    const handleExportCompleteReport = async () => {
        const { brief, refs, timing, gates } = data;

        let md = `# VFX Planning Report: ${brief.context || 'Untitled Project'}

**Generated**: ${new Date().toLocaleString()}

---

## 1. Design Brief
(Details omitted for brevity, verify in individual export or ZIP)
...
[Content identical to handleExportZIP logic but embedding images]
`;
        // Re-implementing simplified logic to avoid huge duplication, 
        // normally I'd refactor but for safety I'll copy the structure.

        md = `# VFX Planning Report: ${brief.context || 'Untitled Project'}

**Generated**: ${new Date().toLocaleString()}

---

## 1. Design Brief

### Basic Information
- **Purpose**: ${brief.purpose}
- **Context**: ${brief.context}
- **Camera**: ${brief.camera}

### Performance & Constraints
- **Draw Calls (Max)**: ${brief.drawCall}
- **Particle Count (Max)**: ${brief.particleCount}
- **Screen Occupancy**: Max ${brief.occupancy}%
- **UI Interfere Check**: ${brief.uiInterfere ? 'Yes' : 'No'}

### Quality Targets
- **Clarity Goals**: ${brief.clarityGoals}
- **AoE Alignment Required**: ${brief.aoeAlignment ? 'Yes' : 'No'}
- **Telegraph Time**: ${brief.telegraphTime}ms
- **Primary Element**: ${brief.primaryElement}
- **Colors**: Core: ${brief.coreColor}, Sub: ${brief.subColor}
- **Integration**: ${brief.integration}
- **Aftereffect Component**: ${brief.aftereffect}

---

## 2. Reference Pack

`;

        for (let i = 0; i < refs.length; i++) {
            const ref = refs[i];
            md += `### Reference ${String.fromCharCode(65 + i)}: ${ref.name}\n\n`;

            if (getImageFromDB) {
                try {
                    const mainImg = await getImageFromDB(`main_${ref.id}`);
                    if (mainImg) {
                        const optimized = await optimizeImage(mainImg);
                        md += `![${ref.name} Main Image](${optimized})\n\n`;
                    }
                } catch (err) {
                    console.warn(`Failed to load main image for ${ref.id}:`, err);
                }
            }

            md += `**Metadata**:\n`;
            md += `- Platform: ${ref.platform}\n`;
            md += `- Pillar: ${ref.pillar}\n`;
            md += `- Type: ${ref.type}\n`;
            md += `- Notes: ${ref.notes || 'N/A'}\n\n`;

            if (ref.frames && Object.values(ref.frames).some(v => v)) {
                md += `**Frame Analysis**:\n\n`;
                for (const [pct, exists] of Object.entries(ref.frames)) {
                    if (exists && getImageFromDB) {
                        try {
                            const frameImg = await getImageFromDB(`frame_${ref.id}_${pct}`);
                            if (frameImg) {
                                const optimized = await optimizeImage(frameImg, 600, 0.75);
                                md += `**Frame ${pct}%**\n\n`;
                                md += `![Frame ${pct}%](${optimized})\n\n`;
                                if (ref.frameMemos && ref.frameMemos[pct]) {
                                    md += `*Memo*: ${ref.frameMemos[pct]}\n\n`;
                                }
                            }
                        } catch (err) { console.warn(err); }
                    }
                }
            }
            md += `---\n\n`;
        }

        md += `## 3. Timing & Tension

### Duration
- **Total Duration**: ${timing.totalTime}ms (~${(timing.totalTime * 60 / 1000).toFixed(1)} frames @60fps)
- **Tension Curve**: ${timing.curve}

### Phase Breakdown
`;
        const phaseRatios = timing.phaseRatios || { anticipation: 15, action: 25, resolution: 60 };
        md += `- **Anticipation**: ${phaseRatios.anticipation}% (${(timing.totalTime * phaseRatios.anticipation / 100).toFixed(0)}ms)\n`;
        md += `- **Action (Peak)**: ${phaseRatios.action}% (${(timing.totalTime * phaseRatios.action / 100).toFixed(0)}ms)\n`;
        md += `- **Resolution**: ${phaseRatios.resolution}% (${(timing.totalTime * phaseRatios.resolution / 100).toFixed(0)}ms)\n\n`;

        md += `### Resolution Checklist
- Aftereffect defined: ${timing.resolutionChecklist.aftereffect ? '✅ Yes' : '❌ No'}
- GPU Kill condition set: ${timing.resolutionChecklist.gpuKill ? '✅ Yes' : '❌ No'}

### Action Peak Info
${timing.actionPeakInfo || 'N/A'}

---

## 4. Quality Gates

`;
        Object.entries(gates).forEach(([pillar, items]) => {
            md += `### ${pillar.toUpperCase()}\n\n`;
            items.forEach(item => {
                const status = item.pass === true ? '✅' : (item.pass === false ? '❌ FAIL' : '⬜');
                md += `- ${status} ${item.label}\n`;
            });
            md += `\n`;
        });

        md += `---
**Report End** - Generated by VFX Quality Gate Keeper
`;
        downloadFile(md, `VFX_Report_${brief.context || 'Project'}_${new Date().toISOString().split('T')[0]}.md`);
    };

    // NEW: Export as ZIP (Separate Images)
    const handleExportZIP = async () => {
        const { brief, refs, timing, gates } = data;
        const zip = new JSZip();
        const imgFolder = zip.folder("images");

        let md = `# VFX Planning Report: ${brief.context || 'Untitled Project'}

**Generated**: ${new Date().toLocaleString()}

---

## 1. Design Brief

### Basic Information
- **Purpose**: ${brief.purpose}
- **Context**: ${brief.context}
- **Camera**: ${brief.camera}

### Performance & Constraints
- **Draw Calls (Max)**: ${brief.drawCall}
- **Particle Count (Max)**: ${brief.particleCount}
- **Screen Occupancy**: Max ${brief.occupancy}%
- **UI Interfere Check**: ${brief.uiInterfere ? 'Yes' : 'No'}

### Quality Targets
- **Clarity Goals**: ${brief.clarityGoals}
- **AoE Alignment Required**: ${brief.aoeAlignment ? 'Yes' : 'No'}
- **Telegraph Time**: ${brief.telegraphTime}ms
- **Primary Element**: ${brief.primaryElement}
- **Colors**: Core: ${brief.coreColor}, Sub: ${brief.subColor}
- **Integration**: ${brief.integration}
- **Aftereffect Component**: ${brief.aftereffect}

---

## 2. Reference Pack

`;

        for (let i = 0; i < refs.length; i++) {
            const ref = refs[i];
            md += `### Reference ${String.fromCharCode(65 + i)}: ${ref.name}\n\n`;

            // Main Image
            if (getImageFromDB) {
                try {
                    const mainImg = await getImageFromDB(`main_${ref.id}`);
                    if (mainImg) {
                        const optimized = await optimizeImage(mainImg); // Still optimize for better file size
                        const filename = `main_${ref.id}.jpg`;
                        imgFolder.file(filename, getBase64Data(optimized), { base64: true });
                        md += `![${ref.name} Main Image](images/${filename})\n\n`;
                    }
                } catch (err) {
                    console.warn(`Failed to load main image for ${ref.id}:`, err);
                }
            }

            md += `**Metadata**:\n`;
            md += `- Platform: ${ref.platform}\n`;
            md += `- Pillar: ${ref.pillar}\n`;
            md += `- Type: ${ref.type}\n`;
            md += `- Notes: ${ref.notes || 'N/A'}\n\n`;

            // Frame Analysis
            if (ref.frames && Object.values(ref.frames).some(v => v)) {
                md += `**Frame Analysis**:\n\n`;
                for (const [pct, exists] of Object.entries(ref.frames)) {
                    if (exists && getImageFromDB) {
                        try {
                            const frameImg = await getImageFromDB(`frame_${ref.id}_${pct}`);
                            if (frameImg) {
                                const optimized = await optimizeImage(frameImg, 600, 0.75);
                                const filename = `frame_${ref.id}_${pct}.jpg`;
                                imgFolder.file(filename, getBase64Data(optimized), { base64: true });

                                md += `**Frame ${pct}%**\n\n`;
                                md += `![Frame ${pct}%](images/${filename})\n\n`;
                                if (ref.frameMemos && ref.frameMemos[pct]) {
                                    md += `*Memo*: ${ref.frameMemos[pct]}\n\n`;
                                }
                            }
                        } catch (err) { console.warn(err); }
                    }
                }
            }
            md += `---\n\n`;
        }

        md += `## 3. Timing & Tension

### Duration
- **Total Duration**: ${timing.totalTime}ms (~${(timing.totalTime * 60 / 1000).toFixed(1)} frames @60fps)
- **Tension Curve**: ${timing.curve}

### Phase Breakdown
`;
        const phaseRatios = timing.phaseRatios || { anticipation: 15, action: 25, resolution: 60 };
        md += `- **Anticipation**: ${phaseRatios.anticipation}% (${(timing.totalTime * phaseRatios.anticipation / 100).toFixed(0)}ms)\n`;
        md += `- **Action (Peak)**: ${phaseRatios.action}% (${(timing.totalTime * phaseRatios.action / 100).toFixed(0)}ms)\n`;
        md += `- **Resolution**: ${phaseRatios.resolution}% (${(timing.totalTime * phaseRatios.resolution / 100).toFixed(0)}ms)\n\n`;

        md += `### Resolution Checklist
- Aftereffect defined: ${timing.resolutionChecklist.aftereffect ? '✅ Yes' : '❌ No'}
- GPU Kill condition set: ${timing.resolutionChecklist.gpuKill ? '✅ Yes' : '❌ No'}

### Action Peak Info
${timing.actionPeakInfo || 'N/A'}

---

## 4. Quality Gates

`;
        Object.entries(gates).forEach(([pillar, items]) => {
            md += `### ${pillar.toUpperCase()}\n\n`;
            items.forEach(item => {
                const status = item.pass === true ? '✅' : (item.pass === false ? '❌ FAIL' : '⬜');
                md += `- ${status} ${item.label}\n`;
            });
            md += `\n`;
        });

        md += `---
**Report End** - Generated by VFX Quality Gate Keeper
`;

        // Add markdown to zip
        zip.file(`VFX_Report_${brief.context || 'Project'}.md`, md);

        // Generate and save ZIP
        zip.generateAsync({ type: "blob" }).then(function (content) {
            saveAs(content, `VFX_Report_Package_${brief.context || 'Project'}_${new Date().toISOString().split('T')[0]}.zip`);
        });
    };


    const structure = [
        { folder: '00_Brief/', file: 'VFX_DesignBrief.md' },
        { folder: '01_References/', files: ['Shape/', 'Motion/', 'Decay/', 'Notes/'] },
        { folder: '02_FrameAnalysis/', file: 'RefA_0-20-60-100.png + Memo' },
        { folder: '03_TimingSpec/', file: 'TimingSpec.md' },
        { folder: '04_ImplementationNotes/', files: ['Niagara_Spec.md', 'Emitter_Sketch.md'] },
        { folder: '05_ValidationChecklist/', files: ['PreProduction_Checklist.md', 'Handoff_Checklist.md'] },
    ];

    return (
        <div className="export-view">
            <div className="export-header glass-panel">
                <div className="status-info">
                    <h3>📄 Export Documentation</h3>
                    <p>Download individual markdown files or complete report.</p>
                    <div className="path-info">
                        <strong>💾 Save Location:</strong> Files will be downloaded to your browser's <span style={{ color: '#00f2ff' }}>Downloads</span> folder.
                    </div>
                    <div style={{ marginTop: '12px', padding: '8px', background: 'rgba(0,242,255,0.1)', borderRadius: '4px', fontSize: '0.9rem' }}>
                        <strong>💡 Tip:</strong> Use "Export as ZIP" for best compatibility with separate images.
                    </div>
                </div>
            </div>

            <div className="structure-preview glass-panel">
                <h5>Standardized Folder Structure (Section 8)</h5>
                <div className="tree-view">
                    {structure.map((item, idx) => (
                        <div key={idx} className="tree-item">
                            <span className="folder-icon">📁 {item.folder}</span>
                            <div className="tree-content">
                                {item.file && <span className="file-icon">📄 {item.file}</span>}
                                {item.files && item.files.map((f, fIdx) => (
                                    <span key={fIdx} className={f.endsWith('/') ? 'folder-icon' : 'file-icon'}>
                                        {f.endsWith('/') ? '📁' : '📄'} {f}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="quick-md-export">
                <h5 style={{ marginBottom: '12px', color: '#00f2ff' }}>📥 Download Files</h5>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <button className="btn glass-panel" onClick={handleExportZIP} style={{ flex: '1 1 100%', minWidth: '200px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', fontWeight: 'bold' }}>
                        📦 Export as ZIP (Images Separate)
                    </button>
                    <button className="btn glass-panel" onClick={handleExportCompleteReport} style={{ flex: '1 1 100%', minWidth: '200px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                        📄 Export Single MD (Embedded)
                    </button>
                    <button className="btn glass-panel" onClick={handleExportBrief} style={{ flex: '1', minWidth: '200px' }}>
                        📝 Export Brief.md
                    </button>
                    <button className="btn glass-panel" onClick={handleExportTiming} style={{ flex: '1', minWidth: '200px' }}>
                        ⏱️ Export Timing.md
                    </button>
                    <button className="btn glass-panel" onClick={handleExportChecklist} style={{ flex: '1', minWidth: '200px' }}>
                        ✅ Export Checklist.md
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Export;
