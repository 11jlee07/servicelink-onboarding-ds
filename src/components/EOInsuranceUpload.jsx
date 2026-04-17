import React, { useState } from 'react';
import { Upload, CheckCircle, FileText, X, ShieldCheck, Sparkles } from 'lucide-react';
import { parseEOInsurance } from '../utils/mockApi';

const FIELDS = [
  { key: 'underwriter',      label: 'Underwriter (Company)',  placeholder: 'e.g. Berkley One Insurance',   type: 'text' },
  { key: 'policyNumber',     label: 'Binder / Policy #',      placeholder: 'e.g. EO-2024-884421-TX',      type: 'text' },
  { key: 'limitOfLiability', label: 'Limit of Liability',     placeholder: 'e.g. 1,000,000',              type: 'text' },
  { key: 'effectiveDate',    label: 'Effective Date',         placeholder: '',                             type: 'date' },
  { key: 'expirationDate',   label: 'Expiration Date',        placeholder: '',                             type: 'date' },
];

const EMPTY = { underwriter: '', policyNumber: '', limitOfLiability: '', effectiveDate: '', expirationDate: '' };

// Stagger delay per field index so they reveal one by one
const FIELD_DELAY = [0, 120, 240, 360, 480];

const EOInsuranceUpload = ({ state, setState, onNext, onBack }) => {
  const [file, setFile]           = useState(state.eoInsurance?.uploadedFile || null);
  const [parseState, setParseState] = useState(
    state.eoInsurance?.parsed ? 'confirmed' : 'idle'
  ); // idle | parsing | extracted | confirmed
  const [fields, setFields]       = useState(state.eoInsurance?.fields || EMPTY);
  const [visibleFields, setVisibleFields] = useState(
    state.eoInsurance?.parsed ? FIELDS.map((f) => f.key) : []
  );
  const [confirmed, setConfirmed] = useState(state.eoInsurance?.parsed || false);

  const formatSize = (bytes) =>
    bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(0)} KB` : `${(bytes / 1024 / 1024).toFixed(2)} MB`;

  const handleFile = async (f) => {
    if (!f) return;
    setFile(f);
    setParseState('parsing');
    setVisibleFields([]);
    setConfirmed(false);
    setFields(EMPTY);

    try {
      const result = await parseEOInsurance(f);
      setFields(result);
      setParseState('extracted');

      // Stagger field reveal
      FIELDS.forEach((field, i) => {
        setTimeout(() => {
          setVisibleFields((prev) => [...prev, field.key]);
        }, FIELD_DELAY[i]);
      });
    } catch {
      setParseState('idle');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleFile(e.dataTransfer.files[0]);
  };

  const remove = () => {
    setFile(null);
    setParseState('idle');
    setFields(EMPTY);
    setVisibleFields([]);
    setConfirmed(false);
    setState((prev) => ({ ...prev, eoInsurance: { uploadedFile: null } }));
  };

  const handleConfirm = () => {
    setConfirmed(true);
    setParseState('confirmed');
    setState((prev) => ({
      ...prev,
      eoInsurance: { uploadedFile: file, fields, parsed: true },
    }));
  };

  const handleFieldChange = (key, val) => {
    setFields((prev) => ({ ...prev, [key]: val }));
    if (confirmed) setConfirmed(false); // require re-confirm if edited
  };

  const allFilled = FIELDS.every((f) => fields[f.key]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="bg-white rounded-exos shadow-sm border border-slate-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">Step 4 of 6</p>
            <h1 className="text-2xl font-bold text-slate-900">E&amp;O Insurance</h1>
          </div>
        </div>

        <p className="text-slate-500 text-sm mb-6">
          Upload your certificate and we'll extract the details automatically.
        </p>

        {/* Requirements */}
        <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-exos-sm ">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-semibold text-slate-800">Required coverage</span>
          </div>
          <ul className="space-y-1.5 text-sm text-slate-600">
            <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-slate-400" />Minimum <strong>$1,000,000</strong> per occurrence</li>
            <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-slate-400" />Policy must be <strong>current</strong> (not expired)</li>
            <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-slate-400" />Certificate of Insurance (ACORD 25 or equivalent)</li>
          </ul>
        </div>

        {/* Upload zone — only shown when no file */}
        {!file && (
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => document.getElementById('eoFile').click()}
            className="border-2 border-dashed border-slate-300 hover:border-blue-400 rounded-exos p-12 text-center cursor-pointer transition-colors group mb-8"
          >
            <div className="w-16 h-16 bg-slate-100 group-hover:bg-blue-50 rounded-exos flex items-center justify-center mx-auto mb-4 transition-colors">
              <Upload className="w-7 h-7 text-slate-400 group-hover:text-blue-500 transition-colors" />
            </div>
            <p className="text-slate-700 font-medium mb-1">Drop your E&amp;O certificate here or click to browse</p>
            <p className="text-sm text-slate-400">PDF, JPG, or PNG · Max 10 MB</p>
            <input id="eoFile" type="file" accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => handleFile(e.target.files[0])} className="hidden" />
          </div>
        )}

        {/* File + parse state */}
        {file && (
          <div className="space-y-5">
            {/* File card */}
            <div className={`flex items-center justify-between p-4 border rounded-exos-sm transition-colors ${
              parseState === 'confirmed' ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-exos flex items-center justify-center flex-shrink-0 ${
                  parseState === 'confirmed' ? 'bg-emerald-100' : 'bg-slate-100'
                }`}>
                  <FileText className={`w-5 h-5 ${parseState === 'confirmed' ? 'text-emerald-600' : 'text-slate-500'}`} />
                </div>
                <div>
                  <p className="font-medium text-slate-900 text-sm">{file.name}</p>
                  <p className="text-xs text-slate-500">{formatSize(file.size)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {parseState === 'parsing' && (
                  <span className="text-xs text-blue-600 font-medium flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                    Analyzing…
                  </span>
                )}
                {parseState === 'confirmed' && <CheckCircle className="w-5 h-5 text-emerald-500" />}
                <button type="button" onClick={remove}
                  className="text-slate-400 hover:text-red-500 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Parsing skeleton */}
            {parseState === 'parsing' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                  <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Extracting policy details…</p>
                </div>
                {FIELDS.map((_, i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="h-3 w-28 bg-slate-100 rounded animate-pulse" />
                    <div className="h-10 bg-slate-100 rounded-exos animate-pulse" style={{ animationDelay: `${i * 80}ms` }} />
                  </div>
                ))}
              </div>
            )}

            {/* Extracted fields */}
            {(parseState === 'extracted' || parseState === 'confirmed') && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                  <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
                    {parseState === 'confirmed' ? 'Details confirmed' : 'Review extracted details'}
                  </p>
                </div>

                {FIELDS.map((field) => {
                  const visible = visibleFields.includes(field.key);
                  return (
                    <div
                      key={field.key}
                      style={{
                        opacity: visible ? 1 : 0,
                        transform: visible ? 'translateY(0)' : 'translateY(6px)',
                        transition: 'opacity 300ms ease, transform 300ms ease',
                      }}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-sm font-medium text-slate-700">{field.label}</label>
                        {visible && parseState !== 'confirmed' && (
                          <span className="flex items-center gap-1 text-xs text-blue-500 font-medium">
                            <Sparkles className="w-3 h-3" /> AI extracted
                          </span>
                        )}
                        {parseState === 'confirmed' && (
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                        )}
                      </div>
                      <input
                        type={field.type}
                        value={fields[field.key]}
                        onChange={(e) => handleFieldChange(field.key, e.target.value)}
                        placeholder={field.placeholder}
                        disabled={parseState === 'confirmed'}
                        className={`w-full border rounded-exos-sm py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                          parseState === 'confirmed'
                            ? 'border-slate-200 bg-slate-50 text-slate-600 cursor-default'
                            : 'border-blue-200 bg-blue-50/30 text-slate-900'
                        }`}
                      />
                    </div>
                  );
                })}

                {/* Confirm / edit actions */}
                {parseState === 'extracted' && (
                  <div className="pt-1 flex gap-2">
                    <button type="button"
                      onClick={() => document.getElementById('eoFileChange').click()}
                      className="px-4 py-2.5 border-2 border-slate-200 hover:border-slate-300 rounded-exos text-sm font-medium text-slate-600 transition-colors">
                      Upload different file
                    </button>
                    <button type="button" onClick={handleConfirm}
                      disabled={!allFilled}
                      className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold rounded-exos text-sm transition-colors">
                      Confirm details →
                    </button>
                  </div>
                )}

                {parseState === 'confirmed' && (
                  <button type="button"
                    onClick={() => { setParseState('extracted'); setConfirmed(false); }}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                    Edit details
                  </button>
                )}

                <input id="eoFileChange" type="file" accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFile(e.target.files[0])} className="hidden" />
              </div>
            )}
          </div>
        )}

        <div className="flex gap-3 mt-8">
          <button type="button" onClick={onBack}
            className="px-6 py-3 border-2 border-slate-200 rounded-exos font-medium text-slate-700 hover:border-slate-300 transition-colors">
            ← Back
          </button>
          <button type="button" onClick={onNext}
            disabled={parseState !== 'confirmed'}
            className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold rounded-exos transition-colors">
            Continue →
          </button>
        </div>
      </div>
    </div>
  );
};

export default EOInsuranceUpload;
