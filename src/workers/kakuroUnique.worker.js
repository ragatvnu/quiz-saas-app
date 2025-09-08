// src/workers/kakuroUnique.worker.js
/* eslint-disable no-restricted-globals */
import { generateKakuro, validateKakuro, solveCount } from "../utils/kakuroCore.js";

function pickBudgetByName(name, base){
  const s=String(name||"");
  if (s.includes("9x9") || s==="RANDOM-9" || s==="AUTO") return Math.max(base, 1200);
  return Math.max(base, 600);
}
function* fallbackPlans(opts){
  const base = { ...opts };
  const firstBudget = pickBudgetByName(base.patternName, base.timeBudgetMs|0);
  yield { ...base, timeBudgetMs: firstBudget, maxAttempts: Math.max(100, base.maxAttempts|0) };
  yield { ...base, requireUnique: true,  timeBudgetMs: firstBudget+400, maxAttempts: 180 };
  yield { ...base, requireUnique: true,  timeBudgetMs: firstBudget+800, maxAttempts: 260 };
  yield { ...base, requireUnique: false, timeBudgetMs: firstBudget+800, maxAttempts: 260 };
  yield { ...base, requireUnique: false, timeBudgetMs: firstBudget+1200, maxAttempts: 360 };
}
function tryOnce(opts){
  try{
    const p = generateKakuro(opts);
    if (!p) return null;
    const valid = validateKakuro(p);
    if (!valid.ok) return { puzzle: p, valid, uniq: 0 };
    const uniq = solveCount(p, 2);
    return { puzzle: p, valid, uniq };
  }catch(err){
    return { puzzle:null, valid:{ok:false, issues:[String(err)]}, uniq:0, error:true };
  }
}
self.onmessage = (e) => {
  const { type, opts, batch } = e.data || {};
  if (type === "generate"){
    let best = null;
    for (const plan of fallbackPlans(opts||{})){
      const res = tryOnce(plan);
      if (!res) continue;
      best = res;
      if (plan.requireUnique && res.uniq===1) break;
      if (!plan.requireUnique) break;
    }
    if (!best){
      self.postMessage({ type:"error", message:"Failed to generate puzzle within budget." });
    } else {
      self.postMessage({ type:"result", ...best });
    }
  } else if (type === "batch"){
    const n = Math.max(1, Math.min(50, (batch?.n|0) || 10));
    const bopts = batch?.opts || {};
    const out = [];
    for (let i=0;i<n;i++){
      let got = null;
      for (const plan of fallbackPlans({ ...bopts, seed: (bopts.seed==null? null : (bopts.seed+i)) })){
        const res = tryOnce(plan);
        if (!res) continue;
        got = res;
        if (plan.requireUnique && res.uniq===1) break;
        if (!plan.requireUnique) break;
      }
      out.push(got || { puzzle:null, valid:{ok:false, issues:["timeout"]}, uniq:0 });
    }
    self.postMessage({ type:"result", puzzles: out });
  } else {
    self.postMessage({ type:"error", message:"Unknown worker command" });
  }
};
