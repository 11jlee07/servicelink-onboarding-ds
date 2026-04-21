import React, { useState, useRef } from 'react';
import { Camera, Upload, CheckCircle, Edit2 } from 'lucide-react';
import { parseDL } from '../utils/mockApi';

const inputCls = 'w-full border border-slate-200 rounded-exos-sm py-3 px-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm';

const DLUpload = ({ state, setState, onNext, onBack }) => {
  const [status, setStatus] = useState('idle'); // idle | parsing | confirm | editing
  const [parsed, setParsed] = useState(null);
  const [preview, setPreview] = useState(null);
  const [edited, setEdited] = useState({});
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setStatus('parsing');
    const result = await parseDL(file);
    setParsed(result);
    setEdited(result);
    setStatus('confirm');
  };

  const onFileChange = (e) => handleFile(e.target.files?.[0]);

  const handleConfirm = () => {
    const data = status === 'editing' ? edited : parsed;
    setState((prev) => ({
      ...prev,
      basicInfo: {
        ...prev.basicInfo,
        firstName: data.firstName,
        lastName: data.lastName,
        address: {
          ...prev.basicInfo.address,
          street: data.street,
          city: data.city,
          state: data.state,
          zip: data.zip,
          validated: true,
        },
      },
    }));
    onNext();
  };

  const field = (key, label, placeholder) => (
    <div>
      <label className="block text-xs font-medium text-slate-500 mb-1">{label}</label>
      <input
        type="text"
        value={edited[key] || ''}
        onChange={(e) => setEdited((p) => ({ ...p, [key]: e.target.value }))}
        placeholder={placeholder}
        className={inputCls}
      />
    </div>
  );

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <button type="button" onClick={onBack} className="text-sm text-slate-500 hover:text-slate-700 mb-6 flex items-center gap-1">
        ← Back
      </button>

      {/* ── IDLE ── */}
      {status === 'idle' && (
        <>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Upload your driver's license</h1>
          <p className="text-slate-500 text-sm mb-8">
            We'll use it to verify your identity and pre-fill your profile.
          </p>

          <div className="space-y-3">
            {/* Camera — mobile primary */}
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="w-full flex items-center gap-4 p-5 border-2 border-blue-400 bg-blue-50/40 hover:bg-blue-50 rounded-exos transition-all"
            >
              <div className="w-12 h-12 bg-blue-100 rounded-exos flex items-center justify-center flex-shrink-0">
                <Camera className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-slate-900 text-sm">Take a photo</p>
                <p className="text-xs text-slate-500 mt-0.5">Use your camera to capture your ID</p>
              </div>
            </button>
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={onFileChange}
            />

            {/* File upload */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center gap-4 p-5 border-2 border-slate-200 hover:border-blue-300 hover:bg-slate-50 rounded-exos transition-all"
            >
              <div className="w-12 h-12 bg-slate-100 rounded-exos flex items-center justify-center flex-shrink-0">
                <Upload className="w-6 h-6 text-slate-500" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-slate-900 text-sm">Upload from device</p>
                <p className="text-xs text-slate-500 mt-0.5">JPG, PNG, or PDF</p>
              </div>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              onChange={onFileChange}
            />
          </div>

          <p className="text-xs text-slate-400 text-center mt-6">
            Your ID is encrypted and never stored permanently.
          </p>
        </>
      )}

      {/* ── PARSING ── */}
      {status === 'parsing' && (
        <div className="text-center py-16">
          {preview && (
            <div className="w-48 h-28 mx-auto mb-8 rounded-exos overflow-hidden border border-slate-200">
              <img src={preview} alt="" className="w-full h-full object-cover" />
            </div>
          )}
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-5" />
          <p className="font-semibold text-slate-900 mb-1">Reading your ID...</p>
          <p className="text-sm text-slate-500">This takes just a moment</p>
        </div>
      )}

      {/* ── CONFIRM ── */}
      {status === 'confirm' && parsed && (
        <>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">We found your info</h1>
              <p className="text-slate-500 text-sm">Does this look right?</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-exos p-5 mb-6 space-y-3">
            {[
              { label: 'Name', value: `${parsed.firstName} ${parsed.lastName}` },
              { label: 'Address', value: `${parsed.street}, ${parsed.city}, ${parsed.state} ${parsed.zip}` },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between items-start gap-4">
                <span className="text-xs text-slate-500 font-medium w-16 flex-shrink-0 pt-0.5">{label}</span>
                <span className="text-sm text-slate-900 font-medium text-right">{value}</span>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <button
              type="button"
              onClick={handleConfirm}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 rounded-exos transition-colors text-sm"
            >
              Yes, that's correct →
            </button>
            <button
              type="button"
              onClick={() => setStatus('editing')}
              className="w-full flex items-center justify-center gap-2 border-2 border-slate-200 hover:border-slate-300 text-slate-700 font-semibold py-3 rounded-exos transition-colors text-sm"
            >
              <Edit2 className="w-4 h-4" />
              No, let me update it
            </button>
          </div>
        </>
      )}

      {/* ── EDITING ── */}
      {status === 'editing' && (
        <>
          <h1 className="text-xl font-bold text-slate-900 mb-1">Update your info</h1>
          <p className="text-slate-500 text-sm mb-6">Fix anything that doesn't look right.</p>

          <div className="space-y-4 mb-6">
            <div className="grid grid-cols-2 gap-3">
              {field('firstName', 'First Name', 'First name')}
              {field('lastName', 'Last Name', 'Last name')}
            </div>
            {field('street', 'Street Address', '123 Main St')}
            <div className="grid grid-cols-5 gap-3">
              <div className="col-span-2">{field('city', 'City', 'City')}</div>
              <div className="col-span-1">{field('state', 'State', 'TX')}</div>
              <div className="col-span-2">{field('zip', 'ZIP', '75201')}</div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleConfirm}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 rounded-exos transition-colors text-sm"
          >
            Confirm & Continue →
          </button>
        </>
      )}
    </div>
  );
};

export default DLUpload;
