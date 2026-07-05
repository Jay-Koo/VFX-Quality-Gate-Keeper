import React, { useState } from 'react';
import { saveAs } from 'file-saver';
import './Backup.css';
import {
  getAllImagesFromDB,
  clearAllImagesFromDB,
  saveImageToDB,
} from '../utils/indexedDB';
import { isValidEyeData, loadEyeData } from '../utils/eyeStore';

const BACKUP_SCHEMA_VERSION = 1;
const EYE_KEY = 'vfx_eye_data';
const GATE_KEY = 'vfx_gate_data';

// Full backup = both localStorage stores + every IndexedDB image.
// The library is the asset; losing it is product failure — so export
// everything, and import is an explicit replace-all with confirmation.
const Backup = () => {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(null); // { ok: bool, message }
  const eyeData = loadEyeData(); // read-only stats; component remounts on tab switch

  const readJson = (key) => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };

  const handleExport = async () => {
    setBusy(true);
    setStatus(null);
    try {
      const images = await getAllImagesFromDB();
      const backup = {
        schemaVersion: BACKUP_SCHEMA_VERSION,
        exportedAt: new Date().toISOString(),
        eyeData: readJson(EYE_KEY),
        gateData: readJson(GATE_KEY),
        images,
      };
      const blob = new Blob([JSON.stringify(backup)], { type: 'application/json' });
      const date = new Date().toISOString().split('T')[0];
      saveAs(blob, `vfx_eye_backup_${date}.json`);
      setStatus({ ok: true, message: `Export complete — ${Object.keys(images).length} images included.` });
    } catch (err) {
      setStatus({ ok: false, message: `Export failed: ${err.message}` });
    } finally {
      setBusy(false);
    }
  };

  const validateBackup = (data) => {
    if (!data || typeof data !== 'object') return 'Not a backup file';
    if (typeof data.schemaVersion !== 'number') return 'Missing schemaVersion';
    if (data.schemaVersion > BACKUP_SCHEMA_VERSION)
      return `Backup schema v${data.schemaVersion} is newer than this app supports (v${BACKUP_SCHEMA_VERSION})`;
    if (data.eyeData !== null && !isValidEyeData(data.eyeData)) return 'Corrupt eyeData section';
    if (data.images !== null && typeof data.images !== 'object') return 'Corrupt images section';
    return null;
  };

  const handleImportFile = async (e) => {
    const file = e.target.files[0];
    e.target.value = ''; // allow re-selecting the same file
    if (!file) return;

    setBusy(true);
    setStatus(null);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const error = validateBackup(data);
      if (error) {
        setStatus({ ok: false, message: `Invalid backup: ${error}` });
        return;
      }

      const cards = data.eyeData?.cards?.length ?? 0;
      const criteria = data.eyeData?.criteria?.length ?? 0;
      const images = data.images ? Object.keys(data.images).length : 0;
      const confirmed = confirm(
        `Import backup from ${data.exportedAt || 'unknown date'}?\n\n` +
          `Contains: ${cards} cards, ${criteria} criteria, ${images} images.\n\n` +
          `⚠ This REPLACES ALL current data (cards, criteria, planning data, images).\n` +
          `Export your current data first if you haven't.`
      );
      if (!confirmed) {
        setStatus({ ok: false, message: 'Import cancelled.' });
        return;
      }

      if (data.eyeData) localStorage.setItem(EYE_KEY, JSON.stringify(data.eyeData));
      else localStorage.removeItem(EYE_KEY);
      if (data.gateData) localStorage.setItem(GATE_KEY, JSON.stringify(data.gateData));
      else localStorage.removeItem(GATE_KEY);

      await clearAllImagesFromDB();
      if (data.images) {
        for (const [key, value] of Object.entries(data.images)) {
          await saveImageToDB(key, value);
        }
      }

      alert('Import complete. The app will reload.');
      window.location.reload();
    } catch (err) {
      setStatus({ ok: false, message: `Import failed: ${err.message}` });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="backup-view">
      <div className="backup-card glass-panel">
        <h3>📤 Export Full Backup</h3>
        <p>
          Downloads a single JSON file with everything: analysis cards, criteria,
          planning data, and all stored images/GIFs. Your library is an asset —
          back it up regularly. This file is also how you share your library
          (send it, the other side imports it).
        </p>
        <p className="backup-stats">
          Current library: <strong>{eyeData.cards.length}</strong> cards · <strong>{eyeData.criteria.length}</strong> criteria
        </p>
        <button className="btn btn-primary" onClick={handleExport} disabled={busy}>
          {busy ? 'Working…' : '📦 Export Backup JSON'}
        </button>
      </div>

      <div className="backup-card glass-panel backup-danger">
        <h3>📥 Import Backup</h3>
        <p>
          Restores a backup file. <strong>Replaces all current data</strong> —
          export first if the current state matters.
        </p>
        <label className="btn btn-secondary import-label">
          Select Backup File…
          <input
            type="file"
            accept="application/json,.json"
            onChange={handleImportFile}
            disabled={busy}
            style={{ display: 'none' }}
          />
        </label>
      </div>

      {status && (
        <div className={`backup-status ${status.ok ? 'ok' : 'error'}`}>{status.message}</div>
      )}
    </div>
  );
};

export default Backup;
