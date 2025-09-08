// src/pages/PageFrame.jsx
import React from "react";
export default function PageFrame({ title, subtitle, footer, watermark = "", center = false, children }) {
  return (
    <div className="_a4 relative bg-white mx-auto my-4 shadow-sm border border-gray-200">
      <div className={`content px-[12mm] py-[12mm] ${center ? 'text-center' : ''}`}>
        {(title || subtitle || watermark) && (
          <div className={`${center ? 'mb-5' : 'mb-3'} headerbox border border-gray-200 rounded-xl bg-white/95 shadow-sm px-4 py-3`}>
            {title && <div className="title text-2xl font-extrabold">{title}</div>}
            {subtitle && <div className="text-sm opacity-80 mt-1">{subtitle}</div>}
            {watermark && <div className="text-xs opacity-60">{watermark}</div>}
          </div>
        )}
        <div className={center ? "mx-auto" : ""}>
          {children}
        </div>
      </div>
      {footer && (
        <div className="absolute left-0 right-0 bottom-[8mm] px-[12mm] text-xs text-center opacity-70 footerbox">
          {footer}
        </div>
      )}
      <style>{`
        ._a4 { width: 210mm; min-height: 297mm; box-sizing: border-box; background:#fff; }
        @media print { ._a4 { margin: 0 auto; box-shadow: none !important; border: none !important; } }
      `}</style>
    </div>
  );
}
