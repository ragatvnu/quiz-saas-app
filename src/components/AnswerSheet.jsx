// src/components/AnswerSheet.jsx
import React from "react";
import WordSearch from "./WordSearch.jsx";
import PageFrame from "../pages/PageFrame.jsx";

export default function AnswerSheet({ batch = [], perPage = 4, title = "Answer Key" }) {
  const groups = [];
  for (let i=0; i<batch.length; i+=perPage) groups.push(batch.slice(i, i+perPage));

  return (
    <>
      {groups.map((items, pageIdx) => (
        <PageFrame key={pageIdx} title={title} footer="Created with HMQUIZ Studio">
          <div className="grid grid-cols-2 gap-4">
            {items.map((it, i) => (
              <div key={i} className="border rounded-lg p-2">
                <WordSearch
                  data={{ words: it.words }}
                  showAnswers={true}
                  rows={it.rows} cols={it.cols}
                  seed={it.seed}
                  cellPx={20}
                  showWordList={false}
                />
              </div>
            ))}
          </div>
        </PageFrame>
      ))}
    </>
  );
}
