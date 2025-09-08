// src/components/extras/PageFrame.jsx
// A4 page wrapper with header and bottom-right page number.

import React from "react";

export default function PageFrame(props) {
  const {
    headerLeft,
    headerRight,
    hideHeader,
    compact,
    children,
    pageNum,
    showPageNumber = true
  } = props;

  return (
    <div
      className="_a4"
      style={{
        width: "210mm",
        minHeight: "297mm",
        background: "#fff",
        color: "#111",
        margin: "10px auto",
        position: "relative",
        overflow: "hidden",
        border: "1px solid rgba(0,0,0,0.08)",
      }}
    >
      {/* Inner content area (gives natural white margin in preview) */}
      <div style={{ padding: compact ? "10mm 12mm 12mm 12mm" : "14mm 16mm 16mm 16mm" }}>
        {!hideHeader && (
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              gap: "8mm",
              marginBottom: compact ? "6mm" : "8mm",
              borderBottom: "1px solid rgba(0,0,0,0.08)",
              paddingBottom: "3mm"
            }}
          >
            <div style={{ fontWeight: 700 }}>{headerLeft}</div>
            <div style={{ opacity: 0.7 }}>{headerRight}</div>
          </div>
        )}

        {/* Page content */}
        <div>{children}</div>
      </div>

      {/* Fixed bottom-right page number */}
      {showPageNumber && (
        <div
          style={{
            position: "absolute",
            right: "10mm",
            bottom: "8mm",
            fontSize: "10pt",
            opacity: 0.8,
          }}
        >
          {pageNum}
        </div>
      )}
    </div>
  );
}

