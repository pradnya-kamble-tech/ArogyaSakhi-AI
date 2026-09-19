import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, X, AlertCircle, CheckCircle2, TrendingUp } from 'lucide-react';
import DashboardLayout, { NavItem } from '../components/DashboardLayout';
import { skinDetect, fetchPatientMe } from '../services/api';

export default function ImageUpload({ onLogout }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [patient, setPatient] = useState(null);

  useEffect(() => {
    fetchPatientMe().then(setPatient).catch(() => {});
  }, []);

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    setFile(selectedFile);
    setError('');
    setResult(null);

    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select an image first');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const data = await skinDetect(file, patient?.id);
      setResult(data.analysis);
      setFile(null);
      setPreview(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (level) => {
    const colors = {
      'Green': { bg: 'bg-medical-green/10', border: 'border-medical-green/30', text: 'text-medical-green', badge: 'bg-medical-green/20 text-medical-green' },
      'Yellow': { bg: 'bg-medical-amber/10', border: 'border-medical-amber/30', text: 'text-medical-amber', badge: 'bg-medical-amber/20 text-medical-amber' },
      'Red': { bg: 'bg-medical-red/10', border: 'border-medical-red/30', text: 'text-medical-red', badge: 'bg-medical-red/20 text-medical-red' }
    };
    return colors[level] || colors['Green'];
  };

  const nav = (
    <>
      <NavItem to="/patient" end icon={TrendingUp} label="Health Overview" />
      <NavItem to="/image-upload" icon={Upload} label="Image Diagnosis" />
      <NavItem to="/ai-reports" icon={Upload} label="Reports" />
      <NavItem to="/symptom-checker" icon={TrendingUp} label="Symptom Checker" />
    </>
  );

  return (
    <DashboardLayout title="Image Diagnosis" subtitle="Upload and analyze medical images" nav={nav} onLogout={onLogout}>
      <div className="space-y-8">
        {/* Upload Section */}
        {!result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-lg border-2 border-dashed border-medical-blue-light bg-medical-blue-light/5 p-12 text-center"
          >
            <Upload className="h-16 w-16 text-medical-blue-light mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-medical-gray-900 mb-2">Upload Medical Image</h2>
            <p className="text-medical-gray-600 mb-8">Upload a skin, wound, or other medical image for AI analysis</p>

            {error && (
              <div className="mb-6 rounded-lg bg-medical-red/10 border border-medical-red/20 px-4 py-3 inline-block">
                <p className="text-sm font-medium text-medical-red">{error}</p>
              </div>
            )}

            {preview ? (
              <div className="space-y-6">
                <div className="relative inline-block">
                  <img src={preview} alt="Preview" className="max-h-64 rounded-lg shadow-lg" />
                  <button
                    type="button"
                    onClick={() => { setFile(null); setPreview(null); }}
                    className="absolute top-2 right-2 rounded-full bg-medical-red p-2 text-white hover:bg-red-600 transition"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <p className="text-sm font-semibold text-medical-gray-700">File: {file?.name}</p>
                  <button
                    type="button"
                    onClick={handleUpload}
                    disabled={loading}
                    className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-medical-blue-light to-medical-blue-dark px-8 py-3 text-sm font-semibold text-white shadow-medical transition hover:shadow-lg disabled:opacity-70"
                  >
                    {loading ? 'Analyzing...' : 'Analyze Image'}
                  </button>
                </div>
              </div>
            ) : (
              <label className="cursor-pointer inline-block">
                <div className="rounded-lg bg-medical-white border-2 border-medical-blue-light p-8 transition hover:bg-medical-soft-white">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    disabled={loading}
                    className="hidden"
                  />
                  <p className="text-sm font-medium text-medical-blue-light hover:text-medical-blue-dark">
                    Click to select image or drag and drop
                  </p>
                </div>
              </label>
            )}
          </motion.div>
        )}

        {/* Results Section */}
        {result && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            {/* Condition Card */}
            <div className="rounded-lg border border-medical-gray-200 bg-medical-white p-8 shadow-medical">
              <h3 className="text-xl font-bold text-medical-gray-900 mb-6">AI Analysis Result</h3>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {/* Condition */}
                <div className="rounded-lg bg-medical-soft-white border border-medical-gray-200 p-6">
                  <p className="text-xs uppercase tracking-widest font-semibold text-medical-gray-600 mb-3">
                    Probable Condition
                  </p>
                  <p className="text-lg font-bold text-medical-gray-900">
                    {result.condition || 'Analysis pending'}
                  </p>
                </div>

                {/* Confidence */}
                <div className="rounded-lg bg-medical-soft-white border border-medical-gray-200 p-6">
                  <p className="text-xs uppercase tracking-widest font-semibold text-medical-gray-600 mb-3">
                    Confidence Score
                  </p>
                  <div className="flex items-baseline gap-1">
                    <p className="text-lg font-bold text-medical-gray-900">
                      {Math.round((result.confidence || 0) * 100)}%
                    </p>
                    <span className="text-xs text-medical-gray-500">confidence</span>
                  </div>
                </div>

                {/* Risk Level */}
                {result.severity && (
                  <div className="rounded-lg bg-medical-soft-white border border-medical-gray-200 p-6">
                    <p className="text-xs uppercase tracking-widest font-semibold text-medical-gray-600 mb-3">
                      Risk Level
                    </p>
                    <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                      result.severity === 'high' ? 'bg-medical-red/20 text-medical-red' :
                      result.severity === 'medium' ? 'bg-medical-amber/20 text-medical-amber' :
                      'bg-medical-green/20 text-medical-green'
                    }`}>
                      {result.severity === 'high' ? '🚨 High' : result.severity === 'medium' ? '⚠ Medium' : '✓ Low'}
                    </div>
                  </div>
                )}

                {/* Status */}
                <div className="rounded-lg bg-medical-soft-white border border-medical-gray-200 p-6">
                  <p className="text-xs uppercase tracking-widest font-semibold text-medical-gray-600 mb-3">
                    Status
                  </p>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-medical-green" />
                    <p className="text-sm font-medium text-medical-green">Analyzed</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Details Card */}
            <div className="rounded-lg border border-medical-gray-200 bg-medical-white p-8 shadow-medical">
              <h4 className="text-lg font-bold text-medical-gray-900 mb-6">Detailed Analysis</h4>

              <div className="space-y-4">
                {result.description && (
                  <div>
                    <p className="text-sm font-semibold text-medical-gray-700 mb-2">Description</p>
                    <p className="text-sm text-medical-gray-600 bg-medical-soft-white rounded-lg p-4 border border-medical-gray-200">
                      {result.description}
                    </p>
                  </div>
                )}

                {result.recommendations && result.recommendations.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-medical-gray-700 mb-3">Recommendations</p>
                    <ul className="space-y-2">
                      {result.recommendations.map((rec, i) => (
                        <li key={i} className="flex gap-3 p-3 rounded-lg bg-medical-blue-light/10 border border-medical-blue-light/20">
                          <span className="text-medical-blue-light font-bold mt-0.5">•</span>
                          <span className="text-sm text-medical-gray-700">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.next_steps && (
                  <div>
                    <p className="text-sm font-semibold text-medical-gray-700 mb-3">Next Steps</p>
                    <div className="p-4 rounded-lg bg-medical-amber/10 border border-medical-amber/20">
                      <p className="text-sm text-medical-gray-700">{result.next_steps}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-4">
              <button
                type="button"
                onClick={() => window.print()}
                className="rounded-lg bg-medical-gray-200 text-medical-gray-900 px-6 py-3 text-sm font-semibold hover:bg-medical-gray-300 transition"
              >
                Print Report
              </button>
              <button
                type="button"
                onClick={() => { setResult(null); setPreview(null); setFile(null); }}
                className="rounded-lg bg-medical-blue-light text-white px-6 py-3 text-sm font-semibold hover:bg-medical-blue-dark transition"
              >
                Upload Another Image
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
