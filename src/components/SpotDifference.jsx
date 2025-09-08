import React from "react"

export default function SpotDifference({ data, showAnswers }) {
  // expected shape (from your theme JSON):
  // data.images.left.src / right.src
  // data.answers.regions: [{shape:"rect", x,y,w,h}, ...]   // coordinates in px relative to the rendered image width
  const left = data.images?.left?.src
  const right = data.images?.right?.src
  const width = data.render?.width || 320

  return (
    <div className="mx-auto max-w-4xl">
      <h2 className="text-xl font-bold mb-3 text-center">{data.title || "Spot the Difference"}</h2>

      <div className="flex gap-4 justify-center">
        <ImageWithOverlays
          src={left}
          alt={data.images?.left?.alt || "Left"}
          width={width}
          regions={showAnswers ? (data.answers?.regions || []) : []}
        />
        <ImageWithOverlays
          src={right}
          alt={data.images?.right?.alt || "Right"}
          width={width}
          regions={showAnswers ? (data.answers?.regions || []) : []}
        />
      </div>

      {!showAnswers && (
        <p className="text-center text-sm text-gray-500 mt-2">
          Differences to find: <b>{data.differences_required ?? (data.answers?.regions?.length || 0)}</b>
        </p>
      )}
    </div>
  )
}

function ImageWithOverlays({ src, alt, width, regions }) {
  if (!src) return <div className="w-[320px] h-[200px] bg-gray-100 border rounded" />

  return (
    <div className="relative border rounded overflow-hidden" style={{ width: width }}>
      <img src={src} alt={alt || ""} style={{ width: width, height: "auto", display: "block" }} />
      {regions.map((r, i) =>
        r.shape === "rect" ? (
          <div
            key={i}
            className="absolute border-2 border-red-500"
            style={{ left: r.x, top: r.y, width: r.w, height: r.h }}
          />
        ) : null
      )}
    </div>
  )
}
