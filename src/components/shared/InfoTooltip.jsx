import React, { useState } from 'react';
import { Info } from 'lucide-react';

const InfoTooltip = ({ text }) => {
  const [show, setShow] = useState(false);

  return (
    <div
      className="relative inline-flex items-center"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <button
        type="button"
        aria-label="More information"
        className="text-slate-400 hover:text-slate-600 transition-colors focus:outline-none focus:text-blue-500"
      >
        <Info className="w-4 h-4" />
      </button>

      {show && (
        <div
          role="tooltip"
          className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-60 p-3 bg-slate-900 text-white text-xs rounded-xl shadow-xl z-50 leading-relaxed"
        >
          {text}
          <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-slate-900" />
        </div>
      )}
    </div>
  );
};

export default InfoTooltip;
