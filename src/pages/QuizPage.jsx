// src/pages/QuizPage.jsx
import React, { useState } from "react";
import PageFrame from "./PageFrame.jsx";

const SAMPLE = [
  { q: "Largest land animal?", options: ["ELEPHANT","GIRAFFE","HORSE","HIPPO"], answer: 0 },
  { q: "Tallest land animal?", options: ["ELEPHANT","GIRAFFE","HORSE","HIPPO"], answer: 1 },
  { q: "Fastest land animal?", options: ["CHEETAH","LION","HORSE","WOLF"], answer: 0 },
];

export default function QuizPage() {
  const [showAnswers, setShowAnswers] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white text-gray-900">
      <PageFrame title="General Knowledge Quiz" subtitle="Choose the best answer for each question." footer="Created with HMQUIZ Studio" center>
        <details className="mb-6 border rounded-lg p-3 bg-white inline-block text-left">
          <summary className="font-semibold cursor-pointer">Instructions</summary>
          <ul className="list-disc ml-5 mt-2 text-sm space-y-1">
            <li>Read each question carefully and choose the best answer.</li>
            <li>One correct option per question.</li>
            <li>Toggle <b>Show Answers</b> to reveal the correct options for review.</li>
          </ul>
        </details>

        <div className="max-w-xl mx-auto text-left">
          {SAMPLE.map((item, idx) => (
            <div key={idx} className="mb-5">
              <div className="font-semibold text-lg text-center">{idx + 1}. {item.q}</div>
              <ul className="mt-2 grid grid-cols-2 gap-2">
                {item.options.map((op, i) => {
                  const correct = showAnswers && i === item.answer;
                  return <li key={i} className={`border rounded px-3 py-2 ${correct ? 'bg-green-100' : ''}`}>{op}</li>;
                })}
              </ul>
            </div>
          ))}
          <label className="text-sm flex gap-2 items-center mt-4 justify-center">
            <input type="checkbox" checked={showAnswers} onChange={e=>setShowAnswers(e.target.checked)} />
            Show answers
          </label>
        </div>
      </PageFrame>
    </div>
  );
}
