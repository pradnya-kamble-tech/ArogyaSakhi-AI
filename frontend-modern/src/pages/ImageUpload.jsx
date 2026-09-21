import React, { useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import DashboardLayout, { NavItem } from '../components/DashboardLayout';
import {
  Camera, Save, Trash2, CheckCircle, AlertCircle, Info,
  Activity, ClipboardList, AlertTriangle, MapPin, X, Upload,
} from 'lucide-react';
import { uploadCaseImage } from '../services/api';

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_EXTS = ['.jpg', '.jpeg', '.png'];
const ALLOWED_MIME = ['image/jpeg', 'image/jpg', 'image/png'];

export default function ImageUpload() {
  const location = useLocation();
  // Case context may be passed via router state from AssessmentWizard
  const caseIdFromState = location.state?.caseId || null;

  const [file, setFile]               = useState(null);
  const [previewUrl, setPreviewUrl]   = useState('');
  const [description, setDescription] = useState('');
  const [caseId, setCaseId]           = useState(caseIdFromState || '');
  const [validationError, setValidationError] = useState('');
  const [uploading, setUploading]     = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [uploadError, setUploadError] = useState('');
  const [history, setHistory]         = useState(() => {
    try { return JSON.parse(localStorage.getItem('arogya_image_history') || '[]'); }
    catch { return []; }
  });

  const inputRef = useRef(null);

  // ── File selection & validation ───────────────────────────────────────────
  const handleSelect = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    reset();

    const ext = '.' + selected.name.split('.').pop().toLowerCase();
    const mime = selected.type.toLowerCase();

    if (!ALLOWED_EXTS.includes(ext) && !ALLOWED_MIME.includes(mime)) {
      setValidationError(
        `Unsupported file type "${selected.type || ext}". Please upload JPG, JPEG, or PNG.`
      );
      return;
    }
    if (selected.size > MAX_BYTES) {
      setValidationError(
        `File too large (${(selected.size / 1024 / 1024).toFixed(1)} MB). Maximum allowed: 10 MB.`
      );
      return;
    }

    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
  };

  const reset = () => {
    setFile(null);
    setPreviewUrl('');
    setValidationError('');
    setUploadResult(null);
    setUploadError('');
    setDescription('');
    if (inputRef.current) inputRef.current.value = '';
  };

  // ── Upload ────────────────────────────────────────────────────────────────
  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setUploadError('');
    setUploadResult(null);

    try {
      const res = await uploadCaseImage(caseId || null, file);
      setUploadResult(res);

      // Save a local record so the history panel shows something offline too
      const record = {
        id: res.image_id || Date.now(),
        filename: file.name,
        previewUrl,
        description,
        caseId: caseId || null,
        visual_analysis_available: res.visual_analysis_available,
        analysis_note: res.analysis_note,
        analysis: res.analysis,
        uploaded_at: new Date().toISOString(),
      };
      const next = [record, ...history];
      setHistory(next);
      localStorage.setItem('arogya_image_history', JSON.stringify(next));
    } catch (err) {
      setUploadError(err.message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const removeHistory = (id) => {
    const next = history.filter((h) => h.id !== id);
    setHistory(next);
    localStorage.setItem('arogya_image_history', JSON.stringify(next));
  };

  const nav = (
    <>
      <NavItem to="/worker" icon={Activity} label="Dashboard" />
      <NavItem to="/worker/assess" icon={ClipboardList} label="New Assessment" />
      <NavItem to="/image-upload" end icon={Camera} label="Clinical Images" />
      <NavItem to="/emergency-sos" icon={AlertTriangle} label="Emergency SOS" />
      <NavItem to="/hospital-finder" icon={MapPin} label="Hospital Finder" />
    </>
  );

  return (
    <DashboardLayout title="Clinical Image Pipeline" subtitle="Validated image capture and storage" nav={nav}>
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">

        {/* ── Upload form ──────────────────────────────────────────────────── */}
        <div className="bg-medical-white rounded-xl shadow-medical border border-medical-gray-200 p-8 space-y-6">
          <h2 className="text-xl font-serif text-medical-gray-900 border-b pb-4">Capture / Upload Image</h2>

          {/* Disclaimer */}
          <div className="flex items-start gap-2 rounded-lg bg-medical-amber/10 border border-medical-amber/20 px-4 py-3 text-xs text-medical-amber">
            <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span>
              Images are stored for clinical reference only.
              No validated diagnostic AI model is currently active.
              Any analysis output must be reviewed by a qualified clinician.
            </span>
          </div>

          {/* Drop / select zone */}
          <div
            onClick={() => inputRef.current?.click()}
            className="flex flex-col items-center justify-center border-2 border-dashed border-medical-gray-300 rounded-lg p-6 bg-medical-soft-white hover:bg-gray-50 transition-colors cursor-pointer"
          >
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Preview"
                className="max-h-56 rounded shadow-md object-contain mb-3"
              />
            ) : (
              <div className="flex flex-col items-center gap-3 text-medical-gray-400 py-4">
                <Camera className="w-14 h-14 opacity-40" />
                <p className="text-sm font-medium">Click to select JPG or PNG (max 10 MB)</p>
              </div>
            )}
            <input
              ref={inputRef}
              type="file"
              accept=".jpg,.jpeg,.png,image/jpeg,image/png"
              className="hidden"
              onChange={handleSelect}
            />
          </div>

          {/* Validation error */}
          {validationError && (
            <div className="flex items-start gap-2 rounded-lg bg-medical-red/10 border border-medical-red/20 px-4 py-3 text-sm text-medical-red">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              {validationError}
            </div>
          )}

          {file && !validationError && (
            <div className="space-y-4">
              {/* File info */}
              <div className="flex items-center gap-3 rounded-lg bg-medical-soft-white border border-medical-gray-200 px-4 py-3 text-sm">
                <CheckCircle className="h-4 w-4 text-medical-green flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-medical-gray-900 truncate">{file.name}</p>
                  <p className="text-xs text-medical-gray-500">{(file.size / 1024).toFixed(1)} KB · {file.type}</p>
                </div>
                <button onClick={reset} className="text-medical-gray-400 hover:text-medical-red">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Case ID field */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-medical-gray-500 mb-1">
                  Associate with Case ID (optional)
                </label>
                <input
                  type="text"
                  value={caseId}
                  onChange={(e) => setCaseId(e.target.value)}
                  placeholder="e.g. abc123-uuid-..."
                  className="w-full rounded-lg border border-medical-gray-200 bg-medical-soft-white px-3 py-2 text-sm outline-none focus:border-medical-blue-light"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-medical-gray-500 mb-1">
                  Clinical Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="e.g. Superficial wound on right forearm, approx 3 cm…"
                  className="w-full rounded-lg border border-medical-gray-200 bg-medical-soft-white px-3 py-2 text-sm resize-none outline-none focus:border-medical-blue-light"
                />
              </div>

              {/* Upload button */}
              <button
                onClick={handleUpload}
                disabled={uploading}
                className={`w-full py-3 rounded-lg font-bold shadow-md text-white flex items-center justify-center gap-2 transition ${
                  uploading
                    ? 'bg-medical-gray-300 cursor-not-allowed'
                    : 'bg-medical-blue-dark hover:brightness-110'
                }`}
              >
                {uploading ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-r-transparent rounded-full animate-spin" />
                    Uploading…
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Upload & Associate
                  </>
                )}
              </button>
            </div>
          )}

          {/* Upload error */}
          {uploadError && (
            <div className="flex items-start gap-2 rounded-lg bg-medical-red/10 border border-medical-red/20 px-4 py-3 text-sm text-medical-red">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              {uploadError}
            </div>
          )}

          {/* Upload success */}
          {uploadResult && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 rounded-lg bg-medical-green/10 border border-medical-green/20 px-4 py-3 text-sm text-medical-green font-semibold">
                <CheckCircle className="h-4 w-4" />
                Image uploaded and stored (ID: {uploadResult.image_id?.slice(0, 8)}…)
              </div>

              {/* Model availability notice — always shown, never hidden */}
              <div className={`flex items-start gap-2 rounded-lg px-4 py-3 text-xs border ${
                uploadResult.visual_analysis_available
                  ? 'bg-medical-amber/10 border-medical-amber/20 text-medical-amber'
                  : 'bg-medical-gray-100 border-medical-gray-200 text-medical-gray-600'
              }`}>
                <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
                {uploadResult.analysis_note}
              </div>

              {/* Only show analysis output if model ran AND result is not empty */}
              {uploadResult.visual_analysis_available && uploadResult.analysis && (
                <div className="rounded-lg bg-medical-soft-white border border-medical-gray-200 p-4 text-xs space-y-1">
                  <p className="font-bold text-medical-gray-700 mb-2">Heuristic Analysis Output</p>
                  <p>Condition: <span className="font-semibold">{uploadResult.analysis.condition || '—'}</span></p>
                  <p>Confidence: <span className="font-semibold">{uploadResult.analysis.confidence ? `${(uploadResult.analysis.confidence * 100).toFixed(0)}%` : '—'}</span></p>
                  <p>Severity: <span className="font-semibold">{uploadResult.analysis.severity || '—'}</span></p>
                </div>
              )}

              <button onClick={reset} className="w-full py-2 text-sm text-medical-blue-light hover:underline">
                Upload another image
              </button>
            </div>
          )}
        </div>

        {/* ── History panel ─────────────────────────────────────────────────── */}
        <div className="bg-medical-white rounded-xl shadow-medical border border-medical-gray-200 p-8">
          <h2 className="text-xl font-serif text-medical-gray-900 border-b pb-4 flex items-center justify-between">
            Upload History
            <span className="text-sm font-normal text-medical-gray-500">{history.length} images</span>
          </h2>

          <div className="mt-6 space-y-4 max-h-[540px] overflow-y-auto pr-1">
            {history.length === 0 ? (
              <div className="text-center py-10 text-medical-gray-400">
                <Camera className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm italic">No images uploaded yet.</p>
              </div>
            ) : (
              history.map((item) => (
                <div
                  key={item.id}
                  className="border border-medical-gray-200 rounded-lg p-4 flex gap-4 bg-medical-soft-white items-start"
                >
                  {item.previewUrl && (
                    <img
                      src={item.previewUrl}
                      className="w-20 h-20 object-cover rounded shadow border flex-shrink-0"
                      alt="Clinical"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-medical-gray-900 text-sm truncate">
                      {item.filename || 'Image'}
                    </p>
                    {item.description && (
                      <p className="text-xs text-medical-gray-600 mt-0.5 line-clamp-2">{item.description}</p>
                    )}
                    {item.caseId && (
                      <p className="text-xs text-medical-blue-light mt-0.5">
                        Case: {item.caseId.slice(0, 12)}…
                      </p>
                    )}
                    <p className="text-xs text-medical-gray-400 mt-1">
                      {new Date(item.uploaded_at).toLocaleString()}
                    </p>
                    {!item.visual_analysis_available && (
                      <p className="text-xs text-medical-gray-400 mt-1 italic">
                        Visual analysis model unavailable
                      </p>
                    )}
                    <button
                      onClick={() => removeHistory(item.id)}
                      className="mt-2 text-medical-red hover:bg-medical-red/10 text-xs px-2 py-1 rounded flex items-center gap-1 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" /> Remove
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
