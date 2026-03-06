import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";

// ============ ICONS ============
const Icon = ({ d, size = 18, fill = "none", strokeWidth = 2, viewBox = "0 0 24 24" }) => (
  <svg width={size} height={size} viewBox={viewBox} fill={fill} stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {Array.isArray(d) ? d.map((p, i) => React.isValidElement(p) ? React.cloneElement(p, { key: i }) : <path key={i} d={p} vectorEffect="non-scaling-stroke" />)
      : React.isValidElement(d) ? d : <path d={d} vectorEffect="non-scaling-stroke" />}
  </svg>
);
const I = {
  play: s => <Icon size={s || 18} d="M5 3l14 9-14 9V3z" fill="currentColor" strokeWidth={2} />,
  pause: s => <Icon size={s || 18} d={[<rect x="6" y="4" width="4" height="16" rx="1" fill="currentColor" stroke="none" />, <rect x="14" y="4" width="4" height="16" rx="1" fill="currentColor" stroke="none" />]} />,
  chevL: s => <Icon size={s || 18} d="M15 18l-6-6 6-6" />,
  chevR: s => <Icon size={s || 18} d="M9 18l6-6-6-6" />,
  plus: s => <Icon size={s || 20} d={["M12 5v14", "M5 12h14"]} />,
  trash: s => <Icon size={s || 16} d={["M3 6h18", "M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2", "M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"]} />,
  copy: s => <Icon size={s || 16} d={["M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2", "M12 8h6a2 2 0 012 2v8a2 2 0 01-2 2h-6a2 2 0 01-2-2v-8a2 2 0 012-2z"]} />,
  arrowUp: s => <Icon size={s || 16} d="M12 19V5M5 12l7-7 7 7" />,
  arrowDown: s => <Icon size={s || 16} d="M12 5v14M5 12l7 7 7-7" />,
  x: s => <Icon size={s || 18} d={["M18 6L6 18", "M6 6l12 12"]} />,
  volOn: s => <Icon size={s || 18} d={["M11 5L6 9H2v6h4l5 4V5z", "M19.07 4.93a10 10 0 010 14.14", "M15.54 8.46a5 5 0 010 7.07"]} />,
  volOff: s => <Icon size={s || 18} d={["M11 5L6 9H2v6h4l5 4V5z", "M23 9l-6 6", "M17 9l6 6"]} />,
  clock: s => (<svg width={s || 18} height={s || 18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>),
  music: s => <Icon size={s || 14} d={["M9 18V5l12-2v13", "M9 18a3 3 0 11-6 0 3 3 0 016 0z", "M21 16a3 3 0 11-6 0 3 3 0 016 0z"]} />,
  gear: s => (<svg width={s || 18} height={s || 18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" /></svg>),
  arrow: s => <Icon size={s || 14} d="M5 12h14m-7-7l7 7-7 7" />,
  restart: s => <Icon size={s || 18} d={["M1 4v6h6", "M3.51 15a9 9 0 102.13-9.36L1 10"]} />,
  save: s => <Icon size={s || 18} d={["M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z", "M17 21v-8H7v8", "M7 3v5h8"]} />,
  folder: s => <Icon size={s || 18} d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />,
  search: s => <Icon size={s || 18} d={["M11 17a6 6 0 100-12 6 6 0 000 12z", "M21 21l-4.35-4.35"]} />,
  rec: s => (<svg width={s || 18} height={s || 18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="4" fill="currentColor" stroke="none" /></svg>),
  target: s => <Icon size={s || 18} d={["M12 22a10 10 0 100-20 10 10 0 000 20z", "M12 18a6 6 0 100-12 6 6 0 000 12z", "M12 14a2 2 0 100-4 2 2 0 000 4z"]} />,
  loop: s => <Icon size={s || 16} d={["M17 1l4 4-4 4", "M3 11V9a4 4 0 014-4h14", "M7 23l-4-4 4-4", "M21 13v2a4 4 0 01-4 4H3"]} />,
  fileNew: s => <Icon size={s || 18} d={["M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z", "M14 2v6h6", "M12 18v-6", "M9 15h6"]} />,
};

// ============ CONSTANTS ============
const BU = [{ id: "w", q: 4 }, { id: "h", q: 2 }, { id: "q", q: 1 }, { id: "e", q: 0.5 }, { id: "16", q: 0.25 }, { id: "32", q: 0.125 }];
const D2Q = { 1: 4, 2: 2, 4: 1, 8: 0.5, 16: 0.25, 32: 0.125 };
const C = { bg: "#07070a", surface: "#111116", surfaceHover: "#1a1a22", border: "#25252e", text: "#eeeef0", textMuted: "#848492", downbeat: "#f0a030", accent: "#8b7cf6", sub: "#3a3a45", danger: "#ef4444", record: "#ef4444", practice: "#22c55e", glowDownbeat: "rgba(240, 160, 48, 0.4)", glowPractice: "rgba(34, 197, 94, 0.4)", glowRecord: "rgba(239, 68, 68, 0.4)" };
const mkM = () => ({ id: Date.now() + Math.random(), type: "metered", tsNum: 4, tsDen: 4, beatUnit: "q", dotted: false, tempo: 120, bars: 4, grouping: "1+1+1+1", curve: "constant", endTempo: 120, loop: false, expressive: false, beatMap: null });
const mkT = () => ({ id: Date.now() + Math.random(), type: "timed", duration: 10, markers: "" });
const SK = "tempus_profiles";
const _memStore = {};
function _getLS(k) { try { return localStorage.getItem(k); } catch { return _memStore[k] || null; } }
function _setLS(k, v) { try { localStorage.setItem(k, v); } catch { _memStore[k] = v; } }
function ldP() { try { return JSON.parse(_getLS(SK)) || []; } catch { return []; } }
function svP(p) { _setLS(SK, JSON.stringify(p)); }

// ============ SVG NOTE ============
function NoteSVG({ type, dotted, size = 24 }) {
  const w = size, h = size * 1.6, hY = h * 0.72, hX = w * 0.38, sT = h * 0.15, sX = hX + 3.8;
  const op = type === "w" || type === "h", hs = type !== "w", uf = type === "e", bm = type === "16" ? 2 : type === "32" ? 3 : 0;
  const np = `M${hX - 4.5},${hY + 1} C${hX - 4.5},${hY + 3.5} ${hX - 1},${hY + 4} ${hX + 1.5},${hY + 2.5} C${hX + 4},${hY + 1} ${hX + 4.5},${hY - 1.5} ${hX + 4.5},${hY - 3.5} C${hX + 4.5},${hY - 6} ${hX + 1},${hY - 6.5} ${hX - 1.5},${hY - 5} C${hX - 4},${hY - 3.5} ${hX - 4.5},${hY - 1} ${hX - 4.5},${hY + 1} Z`;
  return (<svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: "block" }} aria-hidden="true">
    {op ? <path d={np} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" transform={`rotate(-15,${hX},${hY})`} /> : <path d={np} fill="currentColor" stroke="currentColor" strokeWidth={0.5} strokeLinejoin="round" strokeLinecap="round" transform={`rotate(-15,${hX},${hY})`} />}
    {hs && <line x1={sX} y1={hY} x2={sX} y2={sT} stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />}
    {uf && <path d={`M${sX},${sT} C${sX + 4},${sT + 2} ${sX + 7},${sT + 8} ${sX + 5},${sT + 14} C${sX + 5},${sT + 12} ${sX + 3},${sT + 8} ${sX},${sT + 6}`} fill="currentColor" />}
    {bm > 0 && Array.from({ length: bm }).map((_, i) => <line key={i} x1={sX} y1={sT + i * 4} x2={sX + 8} y2={sT + i * 4 + 2} stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" />)}
    {dotted && <circle cx={hX + 8.5} cy={hY} r={1.5} fill="currentColor" />}
  </svg>);
}

// ============ UTILITIES ============
function gCD(tempo, bu, dot, den) { const b = BU.find(x => x.id === bu); if (!b) return 0.5; let q = b.q; if (dot) q *= 1.5; return (60 / tempo) * ((D2Q[den] || 1) / q); }
function pG(s) { if (!s || !s.trim()) return [1]; return s.split("+").map(x => parseInt(x.trim())).filter(n => !isNaN(n) && n > 0); }
function sG(n, d) { if (d >= 8 && n % 3 === 0 && n > 3) return Array(n / 3).fill(3).join("+"); return Array(n).fill(1).join("+"); }
function gBT(g) { const t = []; g.forEach((v, gi) => { for (let i = 0; i < v; i++)t.push(gi === 0 && i === 0 ? 0 : i === 0 ? 1 : 2); }); return t; }
function pM(s) { if (!s || !s.trim()) return []; return s.split(",").map(x => parseFloat(x.trim())).filter(n => !isNaN(n) && n >= 0).sort((a, b) => a - b); }
function mkBeatMap(n, tempo) { return Array.from({ length: n }, () => ({ tempo, fermata: false, fermataHold: 0, fermataUnit: "beats" })); }

function buildTL(sections) {
  const bars = []; let at = 0, ab = 1;
  sections.forEach((s, si) => {
    if (s.type === "timed") { bars.push({ si, bin: 1, ab: ab, st: at, dur: s.duration, cd: s.duration, tempo: 0, tsN: 0, tsD: 0, bts: [0], cpb: 1, isT: true, tDur: s.duration, mk: pM(s.markers) }); at += s.duration; ab++; return; }
    const grp = pG(s.grouping), cpb = s.tsNum;
    const loopFirstIdx = bars.length;
    const totalBeats = s.bars * cpb;
    for (let b = 0; b < s.bars; b++) {
      const bm = s.expressive && s.beatMap && s.beatMap.length === cpb ? s.beatMap : null;
      let perBeatCd = null, totalDur = 0;
      if (bm) {
        perBeatCd = bm.map(beat => {
          const cd = gCD(beat.tempo, s.beatUnit, s.dotted, s.tsDen);
          const hold = beat.fermata ? (beat.fermataUnit === "sec" ? beat.fermataHold : beat.fermataHold * cd) : 0;
          return { cd, hold, fermata: beat.fermata };
        });
        totalDur = perBeatCd.reduce((sum, x) => sum + x.cd + x.hold, 0);
      } else if (s.curve !== "constant" && totalBeats > 1) {
        // Per-beat staircase interpolation
        perBeatCd = [];
        for (let i = 0; i < cpb; i++) {
          const beatNum = b * cpb + i;
          const t = beatNum / (totalBeats - 1);
          const tempo = s.tempo + (s.endTempo - s.tempo) * t;
          const cd = gCD(tempo, s.beatUnit, s.dotted, s.tsDen);
          perBeatCd.push({ cd, hold: 0, fermata: false });
        }
        totalDur = perBeatCd.reduce((sum, x) => sum + x.cd, 0);
      } else {
        const cd = gCD(s.tempo, s.beatUnit, s.dotted, s.tsDen);
        totalDur = cpb * cd;
      }
      const barTempo = s.curve !== "constant" && totalBeats > 1 ? s.tempo + (s.endTempo - s.tempo) * (b * cpb / Math.max(1, totalBeats - 1)) : s.tempo;
      bars.push({ si, bin: b + 1, ab, st: at, dur: totalDur, cd: perBeatCd ? null : gCD(s.tempo, s.beatUnit, s.dotted, s.tsDen), tempo: barTempo, tsN: s.tsNum, tsD: s.tsDen, bts: gBT(grp), cpb, isT: false, loop: !!s.loop, loopTo: loopFirstIdx, perBeatCd });
      at += totalDur; ab++;
    }
  }); return bars;
}

// Scale sections for practice mode
function scaleSections(sections, pct) {
  return sections.map(s => {
    if (s.type === "timed") return { ...s, id: Date.now() + Math.random() };
    const ratio = pct / 100;
    const scaled = { ...s, id: Date.now() + Math.random(), tempo: Math.round(s.tempo * ratio), endTempo: Math.round(s.endTempo * ratio) };
    if (s.beatMap) scaled.beatMap = s.beatMap.map(b => ({ ...b, tempo: Math.round(b.tempo * ratio) }));
    return scaled;
  });
}

// ============ AUDIO ENGINE ============
function useMetronome() {
  const actx = useRef(null), tmr = useRef(null), nb = useRef(0), bi = useRef(0), bei = useRef(0), pl = useRef(false), tlR = useRef([]), cbR = useRef(null), sR = useRef({ accented: true, pitched: true, muted: false }), ciL = useRef(0), wl = useRef(null), sa = useRef(null), tsS = useRef(0), tsM = useRef(0), tsF = useRef(false);
  const fermS = useRef(0), fermD = useRef(0), inFerm = useRef(false);
  const init = useCallback(() => { if (!actx.current) actx.current = new (window.AudioContext || window.webkitAudioContext)(); return actx.current; }, []);
  const rwl = useCallback(async () => { try { if ("wakeLock" in navigator) wl.current = await navigator.wakeLock.request("screen"); } catch { } if (!sa.current) { const a = document.createElement("audio"); a.setAttribute("loop", "true"); a.setAttribute("playsinline", "true"); a.src = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA="; sa.current = a; } try { await sa.current.play(); } catch { } }, []);
  const rlwl = useCallback(() => { if (wl.current) { wl.current.release().catch(() => { }); wl.current = null; } if (sa.current) sa.current.pause(); }, []);
  const prime = useCallback(async () => { const ctx = init(); if (ctx.state === "suspended") await ctx.resume(); const buf = ctx.createBuffer(1, ctx.sampleRate * 0.05, ctx.sampleRate), src = ctx.createBufferSource(); src.buffer = buf; src.connect(ctx.destination); src.start(); await new Promise(r => setTimeout(r, 200)); return ctx; }, [init]);
  const clk = useCallback((ctx, time, bt) => {
    const { accented, pitched, muted } = sR.current; if (muted) return; const e = accented ? bt : 2;
    if (typeof navigator !== "undefined" && "vibrate" in navigator) { try { navigator.vibrate(e === 0 ? [30] : [15]); } catch (err) { } }
    if (pitched) { const f = e === 0 ? 1000 : e === 1 ? 750 : 500, v = e === 0 ? 0.8 : e === 1 ? 0.5 : 0.25, o = ctx.createOscillator(), g = ctx.createGain(); o.type = "sine"; o.frequency.value = f; g.gain.setValueAtTime(v, time); g.gain.exponentialRampToValueAtTime(0.001, time + 0.06); o.connect(g); g.connect(ctx.destination); o.start(time); o.stop(time + 0.08); }
    else { const l = Math.floor(ctx.sampleRate * 0.015), buf = ctx.createBuffer(1, l, ctx.sampleRate), d = buf.getChannelData(0); for (let i = 0; i < l; i++)d[i] = Math.random() * 2 - 1; const v = e === 0 ? 0.7 : e === 1 ? 0.4 : 0.2, src = ctx.createBufferSource(), g = ctx.createGain(); src.buffer = buf; g.gain.setValueAtTime(v, time); g.gain.exponentialRampToValueAtTime(0.001, time + 0.04); const fl = ctx.createBiquadFilter(); fl.type = "bandpass"; fl.frequency.value = e === 0 ? 4000 : e === 1 ? 3000 : 2000; fl.Q.value = 1.5; src.connect(fl); fl.connect(g); g.connect(ctx.destination); src.start(time); src.stop(time + 0.05); }
  }, []);
  const sched = useCallback(() => {
    const ctx = actx.current; if (!ctx || !pl.current) return; const tl = tlR.current;
    while (nb.current < ctx.currentTime + 0.12) {
      if (ciL.current > 0) { const bar = tl[bi.current]; if (!bar || bar.isT) { ciL.current = 0; continue; } const ciCd = bar.cd ?? (bar.perBeatCd?.[0]?.cd ?? 0.5); clk(ctx, nb.current, ciL.current % bar.cpb === 0 ? 0 : 2); if (cbR.current) cbR.current({ type: "countIn", beatsLeft: ciL.current, beatInBar: bar.cpb - ((ciL.current - 1) % bar.cpb), totalBeats: bar.cpb }); nb.current += ciCd; ciL.current--; continue; }
      const bar = tl[bi.current]; if (!bar) { if (cbR.current) cbR.current({ type: "ended" }); stop(); return; }
      if (bar.isT) {
        if (tsS.current === 0) { tsS.current = nb.current; tsF.current = false; } const el = nb.current - tsS.current;
        if (!tsF.current) { clk(ctx, nb.current, 0); if (cbR.current) cbR.current({ type: "timedStart", ab: bar.ab, si: bar.si, dur: bar.tDur }); tsF.current = true; }
        if (bar.mk && tsM.current < bar.mk.length && el >= bar.mk[tsM.current] - 0.02) { clk(ctx, nb.current, 0); if (cbR.current) cbR.current({ type: "timedMarker", ab: bar.ab, si: bar.si, el, dur: bar.tDur, mt: bar.mk[tsM.current], mi: tsM.current, tm: bar.mk.length }); tsM.current++; }
        if (cbR.current) cbR.current({ type: "timedTick", ab: bar.ab, si: bar.si, el, rem: Math.max(0, bar.tDur - el), dur: bar.tDur });
        if (el >= bar.tDur) { tsS.current = 0; tsM.current = 0; tsF.current = false; bi.current++; continue; } nb.current += 0.05; return;
      }
      // Fermata hold in progress
      if (inFerm.current) {
        const el = nb.current - fermS.current;
        if (cbR.current) cbR.current({ type: "fermataHold", ab: bar.ab, si: bar.si, rem: Math.max(0, fermD.current - el), dur: fermD.current, beatIdx: bei.current });
        if (el >= fermD.current) {
          inFerm.current = false; bei.current++; if (bei.current >= bar.cpb) {
            bei.current = 0; bi.current++;
            const nextBar = tl[bi.current]; if (!nextBar || (nextBar.si !== bar.si)) { if (bar.loop && bar.loopTo != null) { bi.current = bar.loopTo; } }
          }
          continue;
        }
        nb.current += 0.05; return;
      }
      const pbc = bar.perBeatCd;
      const bt = bar.bts[bei.current] ?? 2; clk(ctx, nb.current, bt);
      const beatCd = pbc ? (pbc[bei.current]?.cd ?? pbc[0]?.cd ?? 0.5) : (bar.cd ?? 0.5);
      const beatTempo = pbc ? pbc[bei.current]?.cd ? Math.round(60 / (pbc[bei.current].cd / ((D2Q[bar.tsD] || 1) / (BU.find(x => x.id === "q")?.q || 1)))) : bar.tempo : bar.tempo;
      if (cbR.current) cbR.current({ type: "beat", barIdx: bi.current, beatIdx: bei.current, bt, ab: bar.ab, tsN: bar.tsN, tsD: bar.tsD, tempo: beatTempo, si: bar.si });
      nb.current += beatCd;
      // Check for fermata on this beat
      if (pbc && pbc[bei.current]?.fermata && pbc[bei.current]?.hold > 0) {
        inFerm.current = true; fermS.current = nb.current; fermD.current = pbc[bei.current].hold;
        continue;
      }
      bei.current++; if (bei.current >= bar.cpb) {
        bei.current = 0; bi.current++;
        const nextBar = tl[bi.current];
        if (!nextBar || (nextBar.si !== bar.si)) { if (bar.loop && bar.loopTo != null) { bi.current = bar.loopTo; } }
      }
    }
  }, [clk]);
  const stop = useCallback(() => { pl.current = false; if (tmr.current) { clearInterval(tmr.current); tmr.current = null; } tsS.current = 0; tsM.current = 0; tsF.current = false; inFerm.current = false; rlwl(); }, [rlwl]);
  const start = useCallback(async (tl, from = 0, ci = 0, s = {}) => { stop(); sR.current = { accented: true, pitched: true, muted: false, ...s }; tlR.current = tl; bi.current = from; bei.current = 0; tsS.current = 0; tsM.current = 0; tsF.current = false; const ctx = await prime(); await rwl(); const bar = tl[from]; if (!bar) return; ciL.current = bar.isT ? 0 : ci * bar.cpb; pl.current = true; nb.current = ctx.currentTime + 0.05; tmr.current = setInterval(sched, 20); }, [stop, prime, rwl, sched]);
  const updS = useCallback(s => { sR.current = { ...sR.current, ...s }; }, []);
  const setCb = useCallback(cb => { cbR.current = cb; }, []);
  useEffect(() => () => { stop(); if (actx.current) actx.current.close().catch(() => { }); }, [stop]);
  return { start, stop, setCb, pl, updS };
}

// ============ STYLES ============
const nI = { width: 56, height: 44, background: C.surface, border: `1px solid ${C.border}`, color: C.text, textAlign: "center", fontSize: 18, borderRadius: 8, fontFamily: "'DM Mono',monospace", outline: "none", margin: "0 4px" };
const sB = { width: 44, height: 44, background: C.surface, border: `1px solid ${C.border}`, color: C.textMuted, cursor: "pointer", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" };
const oB = on => ({ padding: "8px 16px", borderRadius: 8, border: `1px solid ${on ? C.downbeat : C.border}`, background: on ? C.downbeat + "15" : "transparent", color: on ? C.downbeat : C.textMuted, fontSize: 13, cursor: "pointer", fontFamily: "'Outfit',sans-serif" });

// ============ INPUTS ============
function NI({ value, onChange, min, max, style = {}, step = 1, validate }) { const [d, setD] = useState(String(value)); const drg = useRef({ on: false, active: false, stY: 0, stV: 0 }); useEffect(() => setD(String(value)), [value]); const cm = v => { const n = typeof v === "number" ? v : parseFloat(d); if (!isNaN(n) && n >= min && n <= max) { if (validate && !validate(n)) { setD(String(value)); return; } onChange(n); setD(String(n)); } else setD(String(value)); }; const pD = e => { drg.current = { on: true, active: false, stY: e.clientY, stV: value }; }; const pM = e => { if (!drg.current.on) return; const dY = drg.current.stY - e.clientY; if (!drg.current.active && Math.abs(dY) < 8) return; if (!drg.current.active) { drg.current.active = true; e.target.setPointerCapture(e.pointerId); } const nv = Math.min(max, Math.max(min, drg.current.stV + Math.round(dY / 5) * step)); setD(String(nv)); }; const pU = e => { if (drg.current.active) { drg.current.on = false; drg.current.active = false; try { e.target.releasePointerCapture(e.pointerId); } catch { } cm(parseFloat(d)); } else { drg.current.on = false; } }; return <input type="text" inputMode="decimal" value={d} onChange={e => setD(e.target.value)} onBlur={() => cm()} onKeyDown={e => { if (e.key === "Enter") { cm(); e.target.blur(); } }} onPointerDown={pD} onPointerMove={pM} onPointerUp={pU} onPointerCancel={pU} style={{ ...nI, cursor: "ns-resize", ...style }} />; }
function Stp({ value, onChange, min = 1, max = 999 }) { return (<div style={{ display: "flex", alignItems: "center" }}><button onClick={() => onChange(Math.max(min, value - 1))} style={sB}>{I.chevL(16)}</button><NI value={value} onChange={onChange} min={min} max={max} /><button onClick={() => onChange(Math.min(max, value + 1))} style={sB}>{I.chevR(16)}</button></div>); }
function StpF({ value, onChange, min = 0, max = 999, step = 0.5 }) { return (<div style={{ display: "flex", alignItems: "center" }}><button onClick={() => onChange(Math.max(min, +(value - step).toFixed(1)))} style={sB}>{I.chevL(16)}</button><NI value={value} onChange={onChange} min={min} max={max} step={step} style={{ width: 72 }} /><button onClick={() => onChange(Math.min(max, +(value + step).toFixed(1)))} style={sB}>{I.chevR(16)}</button></div>); }
function Row({ label, children }) { return (<div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}><span style={{ color: C.textMuted, fontSize: 13, fontFamily: "'Outfit',sans-serif", width: 70, flexShrink: 0, display: "flex", alignItems: "center" }}>{label}</span><div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>{children}</div></div>); }

// ============ TAP TEMPO ============
function useTapTempo(onChange) {
  const taps = useRef([]);
  const resetTimer = useRef(null);
  const tap = useCallback(() => {
    const now = performance.now();
    taps.current.push(now);
    // Keep last 8 taps or taps within 4 seconds
    const cutoff = now - 4000;
    taps.current = taps.current.filter(t => t > cutoff).slice(-8);
    if (taps.current.length >= 3) {
      const intervals = [];
      for (let i = 1; i < taps.current.length; i++) intervals.push(taps.current[i] - taps.current[i - 1]);
      const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const bpm = Math.round(60000 / avg);
      if (bpm >= 10 && bpm <= 400) onChange(bpm);
    }
    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => { taps.current = []; }, 2000);
  }, [onChange]);
  return tap;
}

function TapBtn({ onTap, size = "sm" }) {
  const isSm = size === "sm";
  return (<button onClick={onTap} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: isSm ? 8 : 10, padding: isSm ? "6px 10px" : "8px 14px", cursor: "pointer", color: C.textMuted, fontFamily: "'DM Mono',monospace", fontSize: isSm ? 11 : 13, display: "flex", alignItems: "center", justifyContent: "center", userSelect: "none" }}>TAP</button>);
}

// ============ BEAT UNIT PICKER ============
function BUP({ beatUnit, dotted, onSelect }) { const [open, setOpen] = useState(false); const all = BU.flatMap(u => [{ ...u, dotted: false }, { ...u, dotted: true }]); return (<div style={{ position: "relative" }}><button onClick={() => setOpen(!open)} data-tip="Beat Unit" style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 8, padding: "4px 6px", cursor: "pointer", color: C.text, display: "flex", alignItems: "center", justifyContent: "center", minWidth: 38, minHeight: 42 }}><NoteSVG type={beatUnit} dotted={dotted} size={20} /></button>{open && <><div style={{ position: "fixed", inset: 0, zIndex: 200 }} onClick={() => setOpen(false)} /><div style={{ position: "absolute", top: "100%", left: 0, zIndex: 201, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 8, marginTop: 4, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, minWidth: 120 }}>{all.map((u, i) => <button key={i} onClick={() => { onSelect(u.id, u.dotted); setOpen(false); }} style={{ background: u.id === beatUnit && u.dotted === dotted ? C.downbeat + "22" : "transparent", border: u.id === beatUnit && u.dotted === dotted ? `1px solid ${C.downbeat}` : "1px solid transparent", borderRadius: 6, padding: "6px 4px", cursor: "pointer", color: C.text, display: "flex", alignItems: "center", justifyContent: "center" }}><NoteSVG type={u.id} dotted={u.dotted} size={18} /></button>)}</div></>}</div>); }

// ============ SECTION EDITOR ============
function SecEd({ section, onSave, onClose, onDelete, appMode = "default" }) {
  const [s, setS] = useState({ ...section }); const upd = (k, v) => setS(p => ({ ...p, [k]: v })); const isMet = s.type === "metered";
  const tapTempo = useTapTempo(bpm => upd("tempo", bpm));
  const isAdv = appMode === "advanced", isBas = appMode === "basic";
  // Auto-enable expressive in advanced mode
  useEffect(() => { if (isAdv && isMet && !s.expressive) upd("expressive", true); }, [isAdv, isMet]);
  useEffect(() => { if (!isMet) return; const sum = pG(s.grouping).reduce((a, b) => a + b, 0); if (sum !== s.tsNum) upd("grouping", sG(s.tsNum, s.tsDen)); }, [s.tsNum, s.tsDen]);
  const gV = useMemo(() => { if (!isMet) return true; return pG(s.grouping).reduce((a, b) => a + b, 0) === s.tsNum; }, [s.grouping, s.tsNum, isMet]);
  useEffect(() => { if (s.curve === "accel" && s.endTempo <= s.tempo) upd("endTempo", s.tempo + 1); if (s.curve === "rit" && s.endTempo >= s.tempo) upd("endTempo", Math.max(10, s.tempo - 1)); }, [s.curve, s.tempo]);
  const sET = v => { if (s.curve === "accel") upd("endTempo", Math.max(s.tempo + 1, v)); else if (s.curve === "rit") upd("endTempo", Math.min(s.tempo - 1, Math.max(10, v))); else upd("endTempo", v); };
  const swT = t => { if (t === s.type) return; setS(p => (t === "timed" ? { ...mkT(), id: p.id } : { ...mkM(), id: p.id })); };
  // Expressive: init/update beatMap when toggled or tsNum changes
  useEffect(() => { if (s.expressive && (!s.beatMap || s.beatMap.length !== s.tsNum)) upd("beatMap", mkBeatMap(s.tsNum, s.tempo)); }, [s.expressive, s.tsNum]);
  const updBeat = (idx, k, v) => { if (!s.beatMap) return; const bm = [...s.beatMap]; bm[idx] = { ...bm[idx], [k]: v }; upd("beatMap", bm); };

  // Grouping presets
  const gPresets = useMemo(() => { const n = s.tsNum, d = s.tsDen, p = []; if (n <= 6) p.push(Array(n).fill(1).join("+")); if (n > 1 && n % 2 === 0) p.push(Array(n / 2).fill(2).join("+")); if (n >= 6 && n % 3 === 0) p.push(Array(n / 3).fill(3).join("+")); if (n === 5) { p.push("2+3", "3+2"); } if (n === 7) { p.push("2+2+3", "3+2+2", "2+3+2"); } if (n === 8 && d >= 8) { p.push("3+3+2", "3+2+3"); } return [...new Set(p)]; }, [s.tsNum, s.tsDen]);

  return (
    <div className="modal-bg" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div className="modal-content" style={{ width: "100%", maxWidth: 440, background: C.bg, borderTop: `1px solid ${C.border}`, borderRadius: "16px 16px 0 0", padding: "20px 20px 32px", maxHeight: "85vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}><button onClick={onClose} data-tip-b="Close" style={{ background: "none", border: "none", color: C.textMuted, cursor: "pointer", display: "flex" }}>{I.x(18)}</button></div>
        {/* Type toggle - hidden in basic */}
        {!isBas && <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
          <button onClick={() => swT("metered")} style={{ ...oB(isMet), display: "flex", alignItems: "center", gap: 6, flex: 1, justifyContent: "center" }}>{I.music(14)} Metered</button>
          <button onClick={() => swT("timed")} style={{ ...oB(!isMet), display: "flex", alignItems: "center", gap: 6, flex: 1, justifyContent: "center" }}>{I.clock(14)} Timed</button>
        </div>}
        {isMet ? (<>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 18 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <NI value={s.tsNum} onChange={v => upd("tsNum", v)} min={1} max={32} style={{ width: 56, height: 48, fontSize: 24, fontWeight: 700 }} />
              <div style={{ height: 1, width: 44, background: C.textMuted }} />
              <NI value={s.tsDen} onChange={v => upd("tsDen", v)} min={1} max={32} validate={v => [1, 2, 4, 8, 16, 32].includes(v)} style={{ width: 56, height: 48, fontSize: 24, fontWeight: 700 }} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1, justifyContent: "center" }}>
              <BUP beatUnit={s.beatUnit} dotted={s.dotted} onSelect={(id, d) => setS(p => ({ ...p, beatUnit: id, dotted: d }))} />
              <span style={{ color: C.textMuted, fontSize: 20, fontFamily: "'DM Mono',monospace" }}>=</span>
              <Stp value={s.tempo} onChange={v => upd("tempo", v)} min={10} max={400} />
              <TapBtn onTap={tapTempo} />
            </div>
          </div>
          {/* Bars + Loop */}
          <Row label="Bars">
            <button onClick={() => upd("loop", !s.loop)} data-tip="Loop" style={{ background: s.loop ? C.downbeat + "22" : "transparent", border: `1px solid ${s.loop ? C.downbeat : C.border}`, borderRadius: 8, padding: "6px 8px", cursor: "pointer", color: s.loop ? C.downbeat : C.textMuted, display: "flex", alignItems: "center" }}>{I.loop(16)}</button>
            {!s.loop && <Stp value={s.bars} onChange={v => upd("bars", v)} min={1} max={999} />}
            {s.loop && <span style={{ color: C.downbeat, fontSize: 13, fontFamily: "'DM Mono',monospace" }}>∞</span>}
          </Row>

          {/* Grouping - pills always, number builder in advanced */}
          {!isBas && <Row label="Grouping">
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {gPresets.map(p => <button key={p} onClick={() => upd("grouping", p)} style={{ padding: "4px 8px", borderRadius: 6, border: `1px solid ${s.grouping === p ? C.downbeat : C.border}`, background: s.grouping === p ? C.downbeat + "22" : "transparent", color: s.grouping === p ? C.downbeat : C.textMuted, fontSize: 12, fontFamily: "'DM Mono',monospace", cursor: "pointer" }}>{p}</button>)}
              </div>
              {isAdv && <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                {[1, 2, 3, 4, 5].map(n => { const cur = pG(s.grouping); const sum = cur.reduce((a, b) => a + b, 0); const canAdd = sum + n <= s.tsNum; return <button key={n} disabled={!canAdd} onClick={() => { if (!s.grouping || s.grouping.trim() === "" || sum === 0) upd("grouping", String(n)); else upd("grouping", s.grouping + "+" + n); }} style={{ width: 36, height: 36, borderRadius: 8, border: `1px solid ${C.border}`, background: canAdd ? C.surface : "transparent", color: canAdd ? C.text : C.border, fontSize: 15, fontFamily: "'DM Mono',monospace", cursor: canAdd ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center" }}>{n}</button>; })}
                <button onClick={() => { const cur = pG(s.grouping); if (cur.length > 1) { cur.pop(); upd("grouping", cur.join("+")); } else { upd("grouping", ""); } }} style={{ width: 36, height: 36, borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, color: C.textMuted, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>⌫</button>
              </div>}
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 14, color: gV ? C.text : C.danger }}>{s.grouping || "—"}</span>
                {!gV && <span style={{ color: C.danger, fontSize: 12 }}>({pG(s.grouping).reduce((a, b) => a + b, 0)}/{s.tsNum})</span>}
                {gV && <span style={{ color: C.practice, fontSize: 11 }}>✓</span>}
              </div>
            </div>
          </Row>}

          {/* Curve - hidden in basic */}
          {!isBas && <Row label="Curve">{["constant", "accel", "rit"].map(c => <button key={c} onClick={() => upd("curve", c)} style={{ padding: "8px 14px", borderRadius: 8, border: `1px solid ${s.curve === c ? C.downbeat : C.border}`, background: s.curve === c ? C.downbeat + "22" : "transparent", color: s.curve === c ? C.downbeat : C.textMuted, fontSize: 13, fontFamily: "'Outfit',sans-serif", cursor: "pointer" }}>{c === "constant" ? "—" : c === "accel" ? "accel." : "rit."}</button>)}</Row>}
          {!isBas && s.curve !== "constant" && <Row label={I.arrow(14)}><div style={{ display: "flex", alignItems: "center", gap: 8 }}><div style={{ color: C.text, display: "flex", alignItems: "center", minWidth: 30 }}><NoteSVG type={s.beatUnit} dotted={s.dotted} size={18} /></div><span style={{ color: C.textMuted, fontSize: 18, fontFamily: "'DM Mono',monospace" }}>=</span><Stp value={s.endTempo} onChange={sET} min={10} max={400} /></div></Row>}

          {/* Expressive - advanced only */}
          {isAdv && <Row label="Expressive">
            <button onClick={() => upd("expressive", !s.expressive)} style={{ background: s.expressive ? C.accent + "22" : "transparent", border: `1px solid ${s.expressive ? C.accent : C.border}`, borderRadius: 8, padding: "6px 12px", cursor: "pointer", color: s.expressive ? C.accent : C.textMuted, fontSize: 12, fontFamily: "'Outfit',sans-serif" }}>{s.expressive ? "On" : "Off"}</button>
          </Row>}
          {isAdv && s.expressive && s.beatMap && <div style={{ marginBottom: 14, padding: 12, background: C.surface, borderRadius: 10, border: `1px solid ${C.accent}33` }}>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {s.beatMap.map((b, idx) => (
                <div key={idx} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, minWidth: 56, marginBottom: 6 }}>
                  <div style={{ fontSize: 10, color: C.textMuted, fontFamily: "'DM Mono',monospace" }}>{idx + 1}</div>
                  <NI value={b.tempo} onChange={v => updBeat(idx, "tempo", v)} min={10} max={400} step={1} style={{ width: 52, height: 36, fontSize: 14 }} />
                  <button onClick={() => updBeat(idx, "fermata", !b.fermata)} data-tip="Fermata" style={{ background: b.fermata ? C.downbeat + "22" : "transparent", border: `1px solid ${b.fermata ? C.downbeat : C.border}`, borderRadius: 6, padding: "2px 6px", cursor: "pointer", color: b.fermata ? C.downbeat : C.textMuted, fontSize: 14 }}>𝄐</button>
                  {b.fermata && <>
                    <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <NI value={b.fermataHold} onChange={v => updBeat(idx, "fermataHold", v)} min={0} max={16} step={0.5} style={{ width: 40, height: 24, fontSize: 11 }} />
                      <span style={{ color: C.textMuted + "55", fontSize: 9, fontFamily: "'DM Mono',monospace" }}>{b.fermataUnit || "beats"}</span>
                    </div>
                    <button onClick={() => updBeat(idx, "fermataUnit", (b.fermataUnit || "beats") === "beats" ? "sec" : "beats")} style={{ background: "transparent", border: `1px solid ${C.border}`, borderRadius: 4, padding: "1px 4px", cursor: "pointer", color: C.textMuted, fontSize: 8, fontFamily: "'DM Mono',monospace" }}>{(b.fermataUnit || "beats") === "beats" ? "→sec" : "→beats"}</button>
                  </>}
                </div>
              ))}
            </div>
          </div>}
        </>) : (<>
          <Row label="Duration"><StpF value={s.duration} onChange={v => upd("duration", v)} min={0.5} max={600} /><span style={{ color: C.textMuted, fontSize: 15, fontFamily: "'DM Mono',monospace", marginLeft: 6 }}>s</span></Row>
          <Row label="Markers"><input inputMode="decimal" value={s.markers} onChange={e => upd("markers", e.target.value)} style={{ ...nI, width: 200, textAlign: "left", padding: "0 12px", fontSize: 14 }} placeholder="e.g. 3, 7.5, 12" /></Row>
          <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 14, marginLeft: 82, fontFamily: "'DM Mono',monospace" }}>{pM(s.markers).length} cue{pM(s.markers).length !== 1 ? "s" : ""}</div>
        </>)}
        <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
          {onDelete && <button onClick={() => { onDelete(s.id); onClose(); }} data-tip="Delete" style={{ flex: 0, padding: "10px 16px", borderRadius: 8, border: `1px solid ${C.danger}33`, background: `${C.danger}11`, color: C.danger, cursor: "pointer", display: "flex", alignItems: "center" }}>{I.trash(16)}</button>}
          <button onClick={() => { onSave({ ...s, id: Date.now() + Math.random(), type: s.type }, true); onClose(); }} data-tip="Duplicate" style={{ flex: 0, padding: "10px 16px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, color: C.text, cursor: "pointer", display: "flex", alignItems: "center" }}>{I.copy(16)}</button>
          <div style={{ flex: 1 }} />
          <button onClick={() => { if (gV) { onSave(s); onClose(); } }} style={{ flex: 0, padding: "12px 24px", borderRadius: 8, border: "none", background: gV ? C.downbeat : C.sub, color: gV ? "#000" : C.textMuted, fontSize: 14, fontWeight: 600, cursor: gV ? "pointer" : "default", fontFamily: "'Outfit',sans-serif" }}>Add</button>
        </div>
      </div>
    </div>);
}

// ============ SECTION CARD ============
function SecCard({ section: s, index: i, total: t, onClick, onStartHere, onMove, onDelete, onDragStart, onDragEnter, onDragOver, onDragEnd, onDrop, dragIdx, dropIdx }) {
  const isT = s.type === "timed";
  const isTouch = typeof window !== "undefined" && window.matchMedia?.("(pointer: coarse)")?.matches;
  const [revealed, setRevealed] = useState(false);
  const [swX, setSwX] = useState(0);
  const swRef = useRef({ startX: 0, swiping: false });
  const onTouchStart = e => { if (e.target.closest && e.target.closest("button")) return; swRef.current = { startX: e.touches[0].clientX, swiping: true }; };
  const onTouchMove = e => { if (!swRef.current.swiping) return; const dx = e.touches[0].clientX - swRef.current.startX; if (revealed) { setSwX(Math.min(0, Math.max(-80, dx - 80))); } else { setSwX(Math.min(0, dx)); } };
  const onTouchEnd = () => { if (!swRef.current.swiping) return; swRef.current.swiping = false; if (swX < -40) { setSwX(-80); setRevealed(true); } else { setSwX(0); setRevealed(false); } };
  const handleCardClick = () => { if (revealed) { setSwX(0); setRevealed(false); } else { onClick(); } };
  const handleDelete = e => { e.stopPropagation(); if (onDelete) onDelete(s.id); };
  return (<div style={{ position: "relative", overflow: "hidden", borderRadius: 10 }}>
    {(revealed || swX < 0) && <div onClick={handleDelete} data-tip="Delete" style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 80, background: C.danger, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "0 10px 10px 0", cursor: "pointer", color: "#fff" }}>{I.trash(20)}</div>}
    <div className="sec-card" draggable={!isTouch} onDragStart={!isTouch && onDragStart ? e => onDragStart(e, i) : undefined} onDragEnter={!isTouch && onDragEnter ? e => onDragEnter(e, i) : undefined} onDragOver={!isTouch ? onDragOver : undefined} onDragEnd={!isTouch ? onDragEnd : undefined} onDrop={!isTouch && onDrop ? e => onDrop(e, i) : undefined} onClick={handleCardClick} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd} style={{ background: C.surface, borderRadius: 10, padding: "12px 14px", border: `1px solid ${dropIdx === i ? C.accent : (s.capturedDuration ? C.record + "44" : C.border)}`, cursor: "pointer", display: "flex", alignItems: "center", gap: 12, transform: `translateX(${swX}px)`, transition: swRef.current.swiping ? "none" : "transform 0.3s ease", position: "relative", zIndex: 1, opacity: dragIdx === i ? 0.5 : 1 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 24, alignItems: "center" }}>
        <button disabled={i === 0} onClick={e => { e.stopPropagation(); onMove(-1); }} data-tip="Move Up" style={{ background: "none", border: "none", color: i === 0 ? C.border : C.textMuted, cursor: i === 0 ? "default" : "pointer", padding: 2, display: "flex" }}>{I.arrowUp(14)}</button>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: C.textMuted, textAlign: "center", lineHeight: 1 }}>{i + 1}</div>
        <button disabled={i === t - 1} onClick={e => { e.stopPropagation(); onMove(1); }} data-tip="Move Down" style={{ background: "none", border: "none", color: i === t - 1 ? C.border : C.textMuted, cursor: i === t - 1 ? "default" : "pointer", padding: 2, display: "flex" }}>{I.arrowDown(14)}</button>
      </div>
      {isT ? (<>{I.clock(16)}<div style={{ flex: 1, fontFamily: "'DM Mono',monospace", fontSize: 15, color: C.text }}>{s.duration}s</div><div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: C.textMuted }}>{pM(s.markers).length} cue{pM(s.markers).length !== 1 ? "s" : ""}</div></>) : (<>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 18, fontWeight: 700, color: C.text, lineHeight: 1, textAlign: "center", minWidth: 30, display: "flex", flexDirection: "column", alignItems: "center" }}><span>{s.tsNum}</span><div style={{ height: 1, width: "100%", background: C.textMuted, margin: "1px 0" }} /><span>{s.tsDen}</span></div>
        <div style={{ display: "flex", alignItems: "center", gap: 3, color: C.text, flex: 1 }}><NoteSVG type={s.beatUnit} dotted={s.dotted} size={16} /><span style={{ fontFamily: "'DM Mono',monospace", fontSize: 13, color: C.textMuted }}>=</span><span style={{ fontFamily: "'DM Mono',monospace", fontSize: 15 }}>{s.tempo}</span>{s.curve !== "constant" && <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: C.accent, marginLeft: 4 }}>{s.curve === "accel" ? "→" : "←"}{s.endTempo}</span>}</div>
        <div style={{ textAlign: "right" }}><div style={{ fontFamily: "'DM Mono',monospace", fontSize: 14, color: s.loop ? C.downbeat : C.text }}>{s.loop ? "∞" : `${s.bars} bar${s.bars !== 1 ? "s" : ""}`}</div><div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: C.textMuted }}>{s.grouping}</div></div>
      </>)}
      <button onClick={e => { e.stopPropagation(); onStartHere(); }} data-tip="Play From Here" style={{ background: "none", border: "none", color: C.textMuted, cursor: "pointer", padding: 4, display: "flex" }}>{I.play(14)}</button>
    </div></div>);
}

// ============ PLAY VIEW ============
function PlayView({ ps, sections, tl, onPause, onResume, onRestart, onGoToBar, onPrevSec, onNextSec, vis, isP, muted, onMute, onExit, mode, onSplit, onTapTempo, settings, onSettings }) {
  const { absoluteBar: ab, beatIndex: bei, beatType: bt, tsNum: tsN, tsDen: tsD, sectionIndex: si, flash, isTimed: isT, countIn: isCI, ended: isEnded } = ps;
  const fc = bt === 0 ? C.downbeat : bt === 1 ? C.accent : C.text, fo = flash ? (bt === 0 ? 0.35 : bt === 1 ? 0.2 : 0.08) : 0;
  const [goBar, setGoBar] = useState("");
  const [splitMsg, setSplitMsg] = useState(null);
  const splitMsgTimer = useRef(null);
  useEffect(() => () => { if (splitMsgTimer.current) clearTimeout(splitMsgTimer.current); }, []);
  const showF = vis === "flash" || vis === "dots+flash", showD = vis === "dots" || vis === "dots+flash";
  const borderColor = mode === "record" ? C.record : mode === "practice" ? C.practice : null;
  const nxt = sections[si + 1]; let upN = null;
  if (nxt && !isCI) { if (isT) { if (ps.remaining != null && ps.remaining <= 10) upN = nxt.type === "timed" ? `${nxt.duration}s Free` : `${nxt.tsNum}/${nxt.tsDen} at ${nxt.tempo}`; } else { const bis = tl.filter(b => b.si === si); if (bis.length > 0 && bis[bis.length - 1].ab - ab <= 1) upN = nxt.type === "timed" ? `${nxt.duration}s Free` : `${nxt.tsNum}/${nxt.tsDen} at ${nxt.tempo}`; } }
  const isRec = mode === "record";

  const handleTap = e => { if (isRec && onSplit) { const t = e.target; if (t.closest && (t.closest("button") || t.closest("input"))) return; onSplit(ab); setSplitMsg(`Marked bar ${ab}`); if (splitMsgTimer.current) clearTimeout(splitMsgTimer.current); splitMsgTimer.current = setTimeout(() => setSplitMsg(null), 1200); } };

  const cR = 120, cC = 2 * Math.PI * cR; let prg = 0;
  if (isEnded) prg = 1;
  else if (isCI) prg = tsN > 0 ? (bei + 1) / tsN : 0;
  else if (isT && ps.remaining != null) prg = 1 - (ps.remaining / (sections[si]?.duration || 1));
  else if (!isT) { const bs = tl.filter(b => b.si === si); if (bs.length) { const t = bs.length, c = ab - bs[0].ab, bp = bei / Math.max(1, tsN); prg = (c + bp) / t; } }
  const sDo = cC - (prg * cC);
  const showNav = !isP || isEnded;

  return (
    <div onClick={handleTap} style={{ position: "fixed", inset: 0, background: C.bg, zIndex: 50, fontFamily: "'DM Mono',monospace", boxShadow: borderColor ? `inset 0 0 0 4px ${borderColor}, inset 0 0 30px ${borderColor}44` : undefined }}>
      {showF && flash && <div style={{ position: "absolute", inset: 0, background: fc, opacity: fo, transition: "opacity 0.05s", pointerEvents: "none" }} />}
      {splitMsg && <div style={{ position: "absolute", inset: 0, background: C.record, opacity: 0.15, pointerEvents: "none", transition: "opacity 0.3s" }} />}

      {/* TOP BAR */}
      <div style={{ position: "absolute", top: 16, left: 16, right: 16, display: "flex", justifyContent: "space-between", zIndex: 2 }}>
        <button onClick={onMute} data-tip-b={muted ? "Unmute" : "Mute"} style={tS}>{muted ? I.volOff(18) : I.volOn(18)}</button>
        <div style={{ display: "flex", gap: 8 }}>
          {isRec && <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: C.record, display: "flex", alignItems: "center", gap: 4, animation: "pulse 2s infinite" }}>{I.rec(12)} REC</div>}
          {mode === "practice" && ps.pctLabel && !isEnded && <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 13, color: C.practice, fontWeight: 600 }}>{ps.pctLabel}</div>}
          <button onClick={onExit} data-tip-b="Exit" style={tS}>{I.x(18)}</button>
        </div>
      </div>

      {/* MIDDLE - centered */}
      <div style={{ position: "absolute", top: 70, left: 0, right: 0, bottom: 210, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 1 }}>
        <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: "min(260px, 45vh)", height: "min(260px, 45vh)" }}>
          <svg width="100%" height="100%" viewBox="0 0 280 280" style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)", pointerEvents: "none" }}>
            <circle cx={140} cy={140} r={cR} fill="none" stroke={C.border} strokeWidth={8} />
            <circle cx={140} cy={140} r={cR} fill="none" stroke={borderColor || C.downbeat} strokeWidth={8} strokeDasharray={cC} strokeDashoffset={sDo} strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.1s linear" }} />
          </svg>
          <div style={{ fontSize: 20, color: C.textMuted, fontWeight: 700, display: "flex", flexDirection: "column", alignItems: "center", lineHeight: 1.1, position: "relative", zIndex: 1, marginBottom: 8 }}>
            {isEnded ? "" : isCI ? "Count-in" : isT ? <span style={{ display: "flex", alignItems: "center", gap: 6 }}>{I.clock(18)} FREE</span> : (<><span>{tsN}</span><div style={{ height: 1, width: 30, background: C.textMuted, margin: "2px 0" }} /><span>{tsD}</span></>)}
          </div>
          <div className={`hdr-text ${ps.flash && ps.beatType === 0 ? 'pump' : ''}`} style={{ fontFamily: "'Bebas Neue','DM Mono',monospace", fontSize: isEnded ? 80 : 110, fontWeight: 400, color: isEnded ? C.downbeat : C.text, lineHeight: 1, position: "relative", zIndex: 1, letterSpacing: 2 }}>
            {isEnded ? "END" : isCI ? "—" : ps.fermata ? (<><span style={{ fontSize: 24, position: "absolute", top: -10 }}>𝄐</span>{ps.fermataRem != null ? ps.fermataRem.toFixed(1) : "—"}</>) : isT ? (ps.remaining != null ? ps.remaining.toFixed(1) : "—") : ab}
          </div>
        </div>
        {/* Split msg - reserved height */}
        <div style={{ height: 22, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 4 }}>
          {splitMsg && <span style={{ fontSize: 14, color: C.record, fontWeight: 600 }}>{splitMsg}</span>}
        </div>
        {/* Section info - reserved height */}
        <div style={{ height: 40, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          {!isCI && !isEnded && <>
            <div style={{ fontSize: 12, color: C.textMuted }}>{si + 1}/{sections.length}{!isT && ps.tempo ? ` · ${Math.round(ps.tempo)}` : ""}</div>
            {upN && <div style={{ color: C.downbeat, fontSize: 13, fontWeight: 600, animation: "pulse 2s infinite" }}>Up Next: {upN}</div>}
          </>}
        </div>
        {/* Beat dots - reserved height */}
        <div style={{ height: 24, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 4 }}>
          {showD && !isT && !isCI && !isEnded && <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", maxWidth: 280 }}>{(ps.allBeatTypes || []).map((b, i) => { const on = i === bei, c = b === 0 ? C.downbeat : b === 1 ? C.accent : C.sub; return <div key={i} style={{ width: on ? 16 : 10, height: on ? 16 : 10, borderRadius: "50%", background: on ? c : `${c}55`, transition: "all 0.06s", border: on ? `2px solid ${c}` : "2px solid transparent" }} />; })}</div>}
          {showD && isT && !isEnded && ps.totalMarkers > 0 && <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", maxWidth: 280 }}>{Array.from({ length: ps.totalMarkers }).map((_, i) => { const on = i === ps.markerIdx, past = i < (ps.markerIdx || 0); return <div key={i} style={{ width: on ? 16 : 10, height: on ? 16 : 10, borderRadius: "50%", background: on ? C.downbeat : past ? `${C.downbeat}88` : `${C.sub}55`, transition: "all 0.06s", border: on ? `2px solid ${C.downbeat}` : "2px solid transparent" }} />; })}</div>}
        </div>
        {/* Record hint - reserved height */}
        <div style={{ height: 20, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 4 }}>
          {isRec && isP && !isEnded && <span style={{ fontSize: 12, color: C.record, fontFamily: "'Outfit',sans-serif", opacity: 0.7 }}>Tap anywhere to mark section</span>}
        </div>
      </div>

      {/* BOTTOM CONTROLS - fixed */}
      <div style={{ position: "absolute", bottom: 24, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 12, zIndex: 2, pointerEvents: "none" }}>
        {/* Nav row - visibility hidden during play */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, visibility: showNav ? "visible" : "hidden", pointerEvents: showNav ? "auto" : "none", opacity: showNav ? 1 : 0, transition: "opacity 0.15s" }}>
          <button onClick={onPrevSec} data-tip="Previous" style={nv}>{I.chevL(18)}</button>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <input type="text" inputMode="numeric" value={goBar} onChange={e => setGoBar(e.target.value)} placeholder="Bar #" style={{ ...nI, width: 64, fontSize: 14 }} onKeyDown={e => { if (e.key === "Enter") { const v = parseInt(goBar); if (!isNaN(v) && v > 0) { onGoToBar(v); setGoBar(""); } } }} />
            <button onClick={() => { const v = parseInt(goBar); if (!isNaN(v) && v > 0) { onGoToBar(v); setGoBar(""); } }} style={{ ...nv, fontSize: 12, padding: "8px 10px" }}>GO</button>
          </div>
          <button onClick={onNextSec} data-tip="Next" style={nv}>{I.chevR(18)}</button>
        </div>
        {/* Quick settings */}
        {settings && onSettings && <div style={{ display: "flex", gap: 6, justifyContent: "center", pointerEvents: "auto" }}>
          <button onClick={() => onSettings({ ...settings, accented: !settings.accented })} style={qS}>{settings.accented ? "Accent" : "Flat"}</button>
          <button onClick={() => onSettings({ ...settings, pitched: !settings.pitched })} style={qS}>{settings.pitched ? "Pitch" : "Noise"}</button>
          <button onClick={() => { const m = ["dots", "dots+flash", "flash"]; const i = (m.indexOf(settings.visualMode) + 1) % m.length; onSettings({ ...settings, visualMode: m[i] }); }} style={qS}><span style={{ opacity: settings.visualMode.includes("dots") ? 1 : 0.25 }}>●</span> <span style={{ opacity: settings.visualMode.includes("flash") ? 1 : 0.25 }}>◻</span></button>
          <button onClick={() => onSettings({ ...settings, countIn: (settings.countIn + 1) % 3 })} style={qS}>{settings.countIn === 0 ? "No Count-in" : `${settings.countIn} Count-in`}</button>
        </div>}
        {/* Transport */}
        <div style={{ display: "flex", gap: 16, alignItems: "center", pointerEvents: "auto" }}>
          <div style={{ width: 44, display: "flex", justifyContent: "center" }}>
            {showNav && <button onClick={onRestart} data-tip="Restart" style={tS}>{I.restart(18)}</button>}
          </div>
          <button onClick={isP ? onPause : onResume} data-tip={isP ? "Pause" : "Play"} style={tB}>{isP ? I.pause(22) : I.play(22)}</button>
          <div style={{ width: 44, display: "flex", justifyContent: "center" }}>
            {mode === "normal" && onTapTempo ? <button onClick={onTapTempo} style={tS}><span style={{ fontSize: 11, fontFamily: "'DM Mono',monospace" }}>TAP</span></button> : null}
          </div>
        </div>
      </div>
    </div>);
}
const nv = { padding: "8px 14px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, color: C.text, cursor: "pointer", fontFamily: "'DM Mono',monospace", display: "flex", alignItems: "center", justifyContent: "center" };
const tB = { width: 56, height: 56, borderRadius: "50%", border: "none", background: C.downbeat, color: "#000", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 24px ${C.downbeat}33` };
const tS = { width: 44, height: 44, borderRadius: 10, border: `1px solid ${C.border}`, background: C.surface, color: C.text, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" };
const qS = { padding: "4px 10px", borderRadius: 6, border: `1px solid ${C.border}`, background: "transparent", color: C.textMuted, cursor: "pointer", fontSize: 10, fontFamily: "'DM Mono',monospace", whiteSpace: "nowrap" };

// ============ SETTINGS / SAVE / LIBRARY ============
function SetP({ settings: s, onChange, onClose }) {
  const u = (k, v) => onChange({ ...s, [k]: v }); return (<div className="modal-bg" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={onClose}><div className="modal-content" style={{ width: "100%", maxWidth: 440, background: C.bg, borderTop: `1px solid ${C.border}`, borderRadius: "16px 16px 0 0", padding: "20px 20px 32px" }} onClick={e => e.stopPropagation()}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}><div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 16, color: C.text, fontWeight: 600 }}>Settings</div><button onClick={onClose} data-tip-b="Close" style={{ background: "none", border: "none", color: C.textMuted, cursor: "pointer", display: "flex" }}>{I.x(18)}</button></div>
    <SR l="Mode">{["basic", "default", "advanced"].map(v => <button key={v} onClick={() => u("appMode", v)} style={{ ...oB(s.appMode === v), textTransform: "capitalize" }}>{v}</button>)}</SR>
    <SR l="Click">{["accented", "flat"].map(v => <button key={v} onClick={() => u("accented", v === "accented")} style={oB(s.accented === (v === "accented"))}>{v === "accented" ? "Accented" : "Flat"}</button>)}</SR><SR l="Sound">{["pitched", "unpitched"].map(v => <button key={v} onClick={() => u("pitched", v === "pitched")} style={oB(s.pitched === (v === "pitched"))}>{v === "pitched" ? "Pitched" : "Unpitched"}</button>)}</SR><SR l="Visual">{[["dots", "●", "Pulse"], ["dots+flash", "● ◻", "Full"], ["flash", "◻", "Flash"]].map(([v, l, tip]) => <button key={v} onClick={() => u("visualMode", v)} data-tip={tip} style={{ ...oB(s.visualMode === v), fontSize: 11 }}>{l}</button>)}</SR><SR l="Count-in">{[0, 1, 2].map(v => <button key={v} onClick={() => u("countIn", v)} style={oB(s.countIn === v)}>{v === 0 ? "Off" : `${v} bar${v > 1 ? "s" : ""}`}</button>)}</SR></div></div>);
}
function SR({ l, children }) { return (<div style={{ marginBottom: 16 }}><div style={{ fontSize: 12, color: C.textMuted, marginBottom: 8, fontFamily: "'Outfit',sans-serif" }}>{l}</div><div style={{ display: "flex", gap: 8 }}>{children}</div></div>); }
function SaveM({ sections, onClose, onSaved }) {
  const [t, sT] = useState(""), [c, sC] = useState(""); const ok = t.trim() && c.trim(); const go = () => { if (!ok) return; const p = ldP(); p.push({ id: Date.now(), title: t.trim(), composer: c.trim(), sections, createdAt: new Date().toISOString() }); svP(p); onSaved(); onClose(); }; return (<div className="modal-bg" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center" }}><div className="modal-content" style={{ width: "100%", maxWidth: 440, background: C.bg, borderTop: `1px solid ${C.border}`, borderRadius: "16px 16px 0 0", padding: "20px 20px 32px" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}><div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 16, color: C.text, fontWeight: 600 }}>Save Piece</div><button onClick={onClose} data-tip-b="Close" style={{ background: "none", border: "none", color: C.textMuted, cursor: "pointer", display: "flex" }}>{I.x(18)}</button></div>
    <input value={t} onChange={e => sT(e.target.value)} placeholder="Title" style={{ ...nI, width: "100%", textAlign: "left", padding: "0 12px", marginBottom: 10, fontSize: 15 }} />
    <input value={c} onChange={e => sC(e.target.value)} placeholder="Composer / Arranger" style={{ ...nI, width: "100%", textAlign: "left", padding: "0 12px", marginBottom: 20, fontSize: 15 }} />
    <button onClick={go} style={{ width: "100%", padding: "12px", borderRadius: 8, border: "none", background: ok ? C.downbeat : C.sub, color: ok ? "#000" : C.textMuted, fontSize: 14, fontWeight: 600, cursor: ok ? "pointer" : "default", fontFamily: "'Outfit',sans-serif" }}>Save</button>
  </div></div>);
}
function LibP({ onLoad, onClose }) {
  const [p, sP] = useState(ldP()), [s, sS] = useState("");
  const f = p.filter(x => x.title.toLowerCase().includes(s.toLowerCase()) || x.composer.toLowerCase().includes(s.toLowerCase()));
  const del = id => { const u = p.filter(x => x.id !== id); svP(u); sP(u); };
  const exportAll = () => {
    try {
      const json = JSON.stringify(p, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = "tempus-profiles.json"; a.click();
      URL.revokeObjectURL(url);
    } catch (e) { }
  };
  const importFile = () => {
    const input = document.createElement("input"); input.type = "file"; input.accept = ".json";
    input.onchange = e => {
      const file = e.target.files?.[0]; if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        try {
          const imported = JSON.parse(ev.target.result);
          if (Array.isArray(imported)) { const merged = [...p]; imported.forEach(ip => { if (!merged.find(x => x.title === ip.title && x.composer === ip.composer)) merged.push({ ...ip, id: Date.now() + Math.random() }); }); svP(merged); sP(merged); }
        } catch { }
      };
      reader.readAsText(file);
    };
    input.click();
  };
  return (<div className="modal-bg" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={onClose}><div className="modal-content" style={{ width: "100%", maxWidth: 440, background: C.bg, borderTop: `1px solid ${C.border}`, borderRadius: "16px 16px 0 0", padding: "20px 20px 32px", maxHeight: "80vh", display: "flex", flexDirection: "column" }} onClick={e => e.stopPropagation()}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}><div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 16, color: C.text, fontWeight: 600 }}>Library</div><div style={{ display: "flex", gap: 6 }}>
      <button onClick={importFile} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 6, color: C.textMuted, padding: "4px 8px", cursor: "pointer", fontSize: 11, fontFamily: "'DM Mono',monospace" }}>Import</button>
      <button onClick={exportAll} disabled={p.length === 0} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 6, color: p.length > 0 ? C.textMuted : C.border, padding: "4px 8px", cursor: p.length > 0 ? "pointer" : "default", fontSize: 11, fontFamily: "'DM Mono',monospace" }}>Export</button>
      <button onClick={onClose} data-tip-b="Close" style={{ background: "none", border: "none", color: C.textMuted, cursor: "pointer", display: "flex" }}>{I.x(18)}</button>
    </div></div>
    <div style={{ position: "relative", marginBottom: 12 }}>
      <input value={s} onChange={e => sS(e.target.value)} placeholder="Search..." style={{ ...nI, width: "100%", textAlign: "left", padding: "0 36px", fontSize: 14 }} />
      <div style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: C.textMuted }}>{I.search(14)}</div>
      {s.length > 0 && <button onClick={() => sS("")} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: C.textMuted, cursor: "pointer", display: "flex" }}>{I.x(14)}</button>}
    </div>
    <div style={{ overflowY: "auto", flex: 1 }}>{f.length === 0 && <div style={{ color: C.textMuted, fontSize: 14, fontFamily: "'Outfit',sans-serif", textAlign: "center", padding: "60px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}><div style={{ opacity: 0.2 }}>{I.folder(48)}</div><div>{p.length === 0 ? "No saved pieces yet" : "No results"}</div></div>}{f.map(x => (<div key={x.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: `1px solid ${C.border}` }}><div style={{ flex: 1, cursor: "pointer" }} onClick={() => { onLoad(x.sections); onClose(); }}><div style={{ fontFamily: "'DM Mono',monospace", fontSize: 14, color: C.text }}>{x.title}</div><div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 12, color: C.textMuted }}>{x.composer}</div></div><div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: C.textMuted, flexShrink: 0 }}>{x.sections?.length || 0} sec</div><button onClick={() => del(x.id)} data-tip="Delete" style={{ background: "none", border: "none", color: C.danger + "99", cursor: "pointer", padding: 4, display: "flex" }}>{I.trash(14)}</button></div>))}</div>
  </div></div>);
}

// ============ PRACTICE SETUP MODAL ============
function PracSetup({ sections, onStart, onClose }) {
  const refSec = sections.find(s => s.type === "metered");
  const refTempo = refSec?.tempo || 120;
  const [startBpm, setStartBpm] = useState(Math.round(refTempo * 0.7));
  const [inc, setInc] = useState(5);
  const [reps, setReps] = useState(2);
  const pct = Math.round((startBpm / refTempo) * 100);
  const doStart = () => {
    const startPct = Math.max(10, Math.min(100, pct));
    const pctInc = Math.max(1, Math.round((inc / refTempo) * 100));
    onStart(null, { startPct, targetPct: 100, pctInc, pctReps: reps });
    onClose();
  };
  return (<div className="modal-bg" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
    <div className="modal-content" style={{ width: "100%", maxWidth: 440, background: C.bg, borderTop: `1px solid ${C.border}`, borderRadius: "16px 16px 0 0", padding: "20px 20px 32px", maxHeight: "85vh", overflowY: "auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}><div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 16, color: C.practice, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>{I.target(18)} Practice Mode</div><button onClick={onClose} data-tip-b="Close" style={{ background: "none", border: "none", color: C.textMuted, cursor: "pointer", display: "flex" }}>{I.x(18)}</button></div>
      <Row label="Start">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Stp value={startBpm} onChange={setStartBpm} min={10} max={refTempo} />
          <span style={{ color: C.textMuted, fontSize: 12, fontFamily: "'DM Mono',monospace" }}>BPM</span>
          <span style={{ color: C.textMuted + "88", fontSize: 11, fontFamily: "'DM Mono',monospace" }}>{pct}%</span>
        </div>
      </Row>
      <Row label="Target">
        <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 16, color: C.text }}>{refTempo}</span>
        <span style={{ color: C.textMuted, fontSize: 12, fontFamily: "'DM Mono',monospace" }}>BPM</span>
        <span style={{ color: C.textMuted + "88", fontSize: 11, fontFamily: "'DM Mono',monospace" }}>100%</span>
      </Row>
      <Row label="Increment">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Stp value={inc} onChange={setInc} min={1} max={50} />
          <span style={{ color: C.textMuted, fontSize: 12, fontFamily: "'DM Mono',monospace" }}>BPM</span>
        </div>
      </Row>
      <Row label="Repeats"><Stp value={reps} onChange={setReps} min={1} max={20} /></Row>
      <div style={{ marginTop: 18 }}>
        <button onClick={doStart} style={{ width: "100%", padding: "12px", borderRadius: 8, border: "none", background: C.practice, color: "#000", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>Start</button>
      </div>
    </div>
  </div>);
}

// ============ MAIN ============
export default function Tempus() {
  const [sections, setSections] = useState([mkM()]);
  const [editId, setEditId] = useState(null);
  const [showSet, setShowSet] = useState(false);
  const [showSave, setShowSave] = useState(false);
  const [showLib, setShowLib] = useState(false);
  const [showPrac, setShowPrac] = useState(false);
  const [settings, setSettings] = useState({ accented: true, pitched: true, visualMode: "dots+flash", countIn: 1, appMode: "default" });
  const [muted, setMuted] = useState(false);
  const [ps, setPs] = useState(null);
  const [isP, setIsP] = useState(false);
  const [mode, setMode] = useState("normal"); // "normal"|"record"|"practice"
  const [pracSections, setPracSections] = useState(null);
  const [pracStep, setPracStep] = useState(0);
  const met = useMetronome();
  const fto = useRef(null);
  const splitPoints = useRef([]);

  const [pracPending, setPracPending] = useState(false);

  const [undoToast, setUndoToast] = useState(null);
  const undoTimer = useRef(null);
  useEffect(() => () => { if (undoTimer.current) clearTimeout(undoTimer.current); }, []);
  const [dragIdx, setDragIdx] = useState(null);
  const [dropIdx, setDropIdx] = useState(null);

  const activeSections = pracSections || sections;
  const tl = useMemo(() => buildTL(activeSections), [activeSections]);
  const totalBars = tl.length;

  useEffect(() => { met.updS({ muted }); }, [muted]);
  useEffect(() => { met.updS({ accented: settings.accented, pitched: settings.pitched }); }, [settings.accented, settings.pitched]);

  useEffect(() => {
    met.setCb(evt => {
      if (evt.type === "beat") { const bar = tl[evt.barIdx]; setPs({ absoluteBar: evt.ab, beatIndex: evt.beatIdx, beatType: evt.bt, tsNum: evt.tsN, tsDen: evt.tsD, tempo: evt.tempo, sectionIndex: evt.si, allBeatTypes: bar?.bts || [], flash: true, countIn: false, isTimed: false, fermata: false, pctLabel: pracSections ? `${pracStep}%` : null }); if (fto.current) clearTimeout(fto.current); fto.current = setTimeout(() => setPs(p => p ? { ...p, flash: false } : p), 80); }
      else if (evt.type === "countIn") { setPs(p => ({ ...p || {}, countIn: true, flash: true, isTimed: false, beatIndex: evt.beatInBar - 1, beatType: evt.beatInBar === 1 ? 0 : 2, tsNum: evt.totalBeats, tsDen: 0, allBeatTypes: Array(evt.totalBeats).fill(2).map((_, i) => i === 0 ? 0 : 2) })); if (fto.current) clearTimeout(fto.current); fto.current = setTimeout(() => setPs(p => p ? { ...p, flash: false } : p), 80); }
      else if (evt.type === "timedStart") { setPs(p => ({ ...p || {}, isTimed: true, countIn: false, flash: true, beatType: 0, absoluteBar: evt.ab, sectionIndex: evt.si, remaining: evt.dur, tsNum: 0, tsDen: 0 })); if (fto.current) clearTimeout(fto.current); fto.current = setTimeout(() => setPs(p => p ? { ...p, flash: false } : p), 80); }
      else if (evt.type === "timedTick") { setPs(p => ({ ...p || {}, isTimed: true, countIn: false, absoluteBar: evt.ab, sectionIndex: evt.si, remaining: evt.rem, flash: p?.flash || false, tsNum: 0, tsDen: 0, beatType: 0, totalMarkers: p?.totalMarkers || 0, markerIdx: p?.markerIdx || 0 })); }
      else if (evt.type === "timedMarker") { setPs(p => ({ ...p || {}, flash: true, beatType: 0, totalMarkers: evt.tm, markerIdx: evt.mi })); if (fto.current) clearTimeout(fto.current); fto.current = setTimeout(() => setPs(p => p ? { ...p, flash: false } : p), 80); }
      else if (evt.type === "fermataHold") { setPs(p => ({ ...p || {}, fermata: true, fermataRem: evt.rem, fermataDur: evt.dur })); }
      else if (evt.type === "ended") { setPs(p => ({ ...p || {}, ended: true, flash: false, countIn: false, fermata: false })); setIsP(false); }
    });
  }, [met, tl, pracSections, pracStep]);

  const go = useCallback((fi = 0) => { if (!tl.length) return; const i = Math.max(0, Math.min(fi, tl.length - 1)), b = tl[i]; setPs({ absoluteBar: b.ab, beatIndex: 0, beatType: 0, tsNum: b.tsN, tsDen: b.tsD, tempo: b.tempo, sectionIndex: b.si, allBeatTypes: b.bts, flash: false, countIn: false, isTimed: b.isT, remaining: b.isT ? b.tDur : undefined, pctLabel: pracSections ? `${pracStep}%` : null }); setIsP(true); met.start(tl, i, settings.countIn, { accented: settings.accented, pitched: settings.pitched, muted }); }, [tl, settings, met, muted, pracSections, pracStep]);
  useEffect(() => { if (pracPending && pracSections) { setPracPending(false); go(0); } }, [pracPending, pracSections, go]);
  const exitPlay = useCallback(() => { met.stop(); setIsP(false); setPs(null); setMode("normal"); setPracSections(null); }, [met]);
  const goToBar = useCallback(n => { const i = tl.findIndex(b => b.ab === n); if (i >= 0) go(i); }, [tl, go]);
  const jumpSec = useCallback(d => { if (!ps) return; const ns = Math.max(0, Math.min(activeSections.length - 1, ps.sectionIndex + d)), i = tl.findIndex(b => b.si === ns); if (i >= 0) go(i); }, [ps, activeSections, tl, go]);

  useEffect(() => {
    const hkd = e => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      if (e.code === "Space") { e.preventDefault(); if (isP) { met.stop(); setIsP(false); } else if (ps && (ps.ended || ps.countIn)) { go(0); } else if (ps) { const i = tl.findIndex(b => b.ab === ps.absoluteBar); if (i >= 0) { setIsP(true); met.start(tl, i, 0, { accented: settings.accented, pitched: settings.pitched, muted }); } } else { go(0); } }
      else if (e.code === "Escape") { setEditId(null); setShowSet(false); setShowSave(false); setShowLib(false); setShowPrac(false); }
      else if (isP && e.code === "ArrowLeft") jumpSec(-1);
      else if (isP && e.code === "ArrowRight") jumpSec(1);
    };
    window.addEventListener("keydown", hkd); return () => window.removeEventListener("keydown", hkd);
  }, [isP, exitPlay, go, jumpSec, met, tl, ps, settings, muted]);

  const lastSplitTime = useRef(0);
  const lastSplitBar = useRef(0);

  // Live capture split
  const handleSplit = useCallback(barNum => {
    if (mode !== "record") return;
    const now = Date.now();
    if (now - lastSplitTime.current < 500 || barNum === lastSplitBar.current) return;
    lastSplitTime.current = now;
    lastSplitBar.current = barNum;
    splitPoints.current.push(barNum);
    // Find which section this bar belongs to, split it
    setSections(prev => {
      const tempTl = buildTL(prev);
      const barInfo = tempTl.find(b => b.ab === barNum);
      if (!barInfo) return prev;
      const secIdx = barInfo.si;
      const sec = prev[secIdx];
      if (!sec || sec.type === "timed") return prev;
      const barInSec = barInfo.bin;
      if (barInSec <= 1 || barInSec >= sec.bars) return prev;
      // Split: first part = bars 1 to barInSec-1, second part = barInSec to end
      const elapsed1 = barInSec - 1, elapsed2 = sec.bars - (barInSec - 1);
      const s1 = { ...sec, id: Date.now() + Math.random(), bars: elapsed1, capturedDuration: elapsed1 * gCD(sec.tempo, sec.beatUnit, sec.dotted, sec.tsDen) * sec.tsNum };
      const s2 = { ...sec, id: Date.now() + Math.random() + 1, bars: elapsed2, capturedDuration: elapsed2 * gCD(sec.tempo, sec.beatUnit, sec.dotted, sec.tsDen) * sec.tsNum };
      return [...prev.slice(0, secIdx), s1, s2, ...prev.slice(secIdx + 1)];
    });
  }, [mode]);

  // Practice mode start
  const startPractice = useCallback((_, profileOpts) => {
    if (!profileOpts) return;
    const { startPct, targetPct, pctInc, pctReps } = profileOpts;
    let allSecs = [];
    for (let p = startPct; p <= targetPct; p += pctInc) {
      for (let r = 0; r < pctReps; r++) {
        allSecs = allSecs.concat(scaleSections(sections, Math.min(p, targetPct)));
      }
    }
    setPracSections(allSecs); setPracStep(startPct); setMode("practice");
    setPracPending(true);
  }, [sections, go]);

  const addSec = () => { const ns = mkM(); if (sections.length > 0) { const l = sections[sections.length - 1]; if (l.type === "metered") { ns.tsNum = l.tsNum; ns.tsDen = l.tsDen; ns.beatUnit = l.beatUnit; ns.dotted = l.dotted; ns.tempo = l.tempo; ns.grouping = l.grouping; } } setSections(p => [...p, ns]); setEditId(ns.id); };
  const moveSec = (i, d) => { setSections(p => { const a = [...p]; if (i + d >= 0 && i + d < a.length) [a[i], a[i + d]] = [a[i + d], a[i]]; return a; }); };
  const editSec = sections.find(s => s.id === editId);

  const handleClear = () => {
    if (sections.length <= 1 && sections[0]?.tempo === 120 && sections[0]?.tsNum === 4) return;
    const backup = [...sections];
    setSections([mkM()]); setEditId(null);
    setUndoToast({ section: backup, index: -1 });
    if (undoTimer.current) clearTimeout(undoTimer.current);
    undoTimer.current = setTimeout(() => setUndoToast(null), 5000);
  };

  const handleDelete = id => {
    if (sections.length <= 1) return;
    const idx = sections.findIndex(s => s.id === id);
    if (idx === -1) return;
    const sec = sections[idx];
    setSections(p => p.filter(s => s.id !== id));
    setUndoToast({ section: sec, index: idx });
    if (undoTimer.current) clearTimeout(undoTimer.current);
    undoTimer.current = setTimeout(() => setUndoToast(null), 5000);
  };
  const handleUndo = () => {
    if (!undoToast) return;
    if (undoToast.index === -1 && Array.isArray(undoToast.section)) {
      setSections(undoToast.section);
    } else {
      setSections(p => { const c = [...p]; c.splice(undoToast.index, 0, undoToast.section); return c; });
    }
    setUndoToast(null); if (undoTimer.current) clearTimeout(undoTimer.current);
  };

  const handleDragStart = (e, idx) => { setDragIdx(idx); e.dataTransfer.effectAllowed = "move"; };
  const handleDragEnter = (e, idx) => { setDropIdx(idx); e.preventDefault(); };
  const handleDragOver = e => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; };
  const handleDragEnd = () => { setDragIdx(null); setDropIdx(null); };
  const handleDrop = (e, idx) => {
    e.preventDefault(); if (dragIdx === null || dragIdx === idx) { handleDragEnd(); return; }
    setSections(p => { const c = [...p]; const [m] = c.splice(dragIdx, 1); c.splice(idx, 0, m); return c; });
    handleDragEnd();
  };

  // Tap tempo in performance mode - updates current section's tempo live
  const handleLiveTapTempo = useTapTempo(useCallback(bpm => {
    if (!ps) return;
    const si = ps.sectionIndex;
    setSections(prev => prev.map((s, i) => i === si && s.type === "metered" ? { ...s, tempo: bpm } : s));
  }, [ps]));

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'Outfit',sans-serif", touchAction: "manipulation", position: "relative" }}>
      <div className="ambient-bg" style={{ background: `radial-gradient(circle at 50% 10%, ${mode === 'record' ? C.record + '15' : mode === 'practice' ? C.practice + '15' : C.downbeat + '15'}, transparent 60%)` }} />
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&family=DM+Mono:wght@400;500&family=Bebas+Neue&display=swap" rel="stylesheet" />
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0} html{touch-action:manipulation;-webkit-tap-highlight-color:transparent;-webkit-user-select:none;user-select:none}
        input,textarea{-webkit-user-select:auto;user-select:auto}
        input[type=number]::-webkit-inner-spin-button,input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none;margin:0} input[type=number]{-moz-appearance:textfield}
        ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-thumb{background:${C.border};border-radius:2px}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
        @keyframes ripple { 0% { transform: scale(1); opacity: 0.5; } 100% { transform: scale(1.6); opacity: 0; } }
        .sec-card { transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease, background 0.15s; }
        .sec-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.4); border-color: ${C.textMuted}44; background: ${C.surfaceHover} !important; }
        .glass-pill { background: rgba(17, 17, 22, 0.65); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border-radius: 40px; border: 1px solid rgba(255,255,255,0.05); padding: 8px 16px; box-shadow: 0 10px 40px rgba(0,0,0,0.5); }
        .ambient-bg { position: fixed; inset: 0; z-index: 0; pointer-events: none; transition: background 1s ease; animation: breathe 8s ease-in-out infinite; }
        .hdr-text { text-shadow: 0 0 20px currentColor, 0 0 40px currentColor; transition: transform 0.05s ease; }
        .pump { transform: scale(1.05); }
        .btn-ripple { position: relative; }
        .btn-ripple::before { content: ''; position: absolute; inset: 0; border-radius: 50%; background: inherit; z-index: -1; animation: ripple 2.5s cubic-bezier(0.4, 0, 0.2, 1) infinite; }
        [data-tip], [data-tip-b] { position: relative; }
        [data-tip]::after, [data-tip-b]::after { position: absolute; left: 50%; transform: translateX(-50%); background: ${C.surface}; color: ${C.text}; font-size: 11px; font-family: 'Outfit',sans-serif; padding: 4px 8px; border-radius: 6px; white-space: nowrap; pointer-events: none; opacity: 0; transition: opacity 0.1s; border: 1px solid ${C.border}; z-index: 999; }
        [data-tip]::after { content: attr(data-tip); bottom: calc(100% + 6px); }
        [data-tip-b]::after { content: attr(data-tip-b); top: calc(100% + 8px); }
        [data-tip]:hover::after, [data-tip-b]:hover::after { opacity: 1; }
        @media (pointer: coarse) { [data-tip]::after, [data-tip-b]::after { display: none; } }
        button { cursor: pointer; transition: transform 0.15s ease, filter 0.15s ease, opacity 0.15s ease; }
        button:hover:not(:disabled) { filter: brightness(1.15); }
        button:active:not(:disabled) { filter: brightness(0.85); transform: scale(0.98); }

        @keyframes modalFadeIn { from { opacity: 0; backdrop-filter: blur(0px); } to { opacity: 1; backdrop-filter: blur(8px); } }
        @keyframes modalSlideUp { from { opacity: 0; transform: translateY(24px) scale(0.96); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .modal-bg { animation: modalFadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; background: rgba(0,0,0,0.4) !important; }
        .modal-content { animation: modalSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; background: rgba(17, 17, 22, 0.75) !important; backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); border: 1px solid rgba(255,255,255,0.06) !important; border-top: 1px solid rgba(255,255,255,0.12) !important; box-shadow: 0 -20px 60px rgba(0,0,0,0.6); }
        .grad-text { background: linear-gradient(135deg, #ffffff 0%, #848492 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.2)); }
        @keyframes breathe { 0%, 100%{ opacity: 0.6; transform: scale(1); } 50%{ opacity: 1; transform: scale(1.06); } }
        @keyframes toastUp { from { transform: translate(-50%, 100%); opacity: 0; } to { transform: translate(-50%, 0); opacity: 1; } }
        .toast { animation: toastUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 16px 8px", maxWidth: 480, margin: "0 auto" }}>
        <div className="grad-text" style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, letterSpacing: 3 }}>TEMPUS</div>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={handleClear} data-tip-b="New" style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 8, color: C.textMuted, padding: "6px 10px", cursor: "pointer", display: "flex", alignItems: "center" }}>{I.fileNew(18)}</button>
          {settings.appMode !== "basic" && <button onClick={() => setShowLib(true)} data-tip-b="Library" style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 8, color: C.textMuted, padding: "6px 10px", cursor: "pointer", display: "flex", alignItems: "center" }}>{I.folder(18)}</button>}
          {settings.appMode !== "basic" && <button onClick={() => setShowSave(true)} data-tip-b="Save" style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 8, color: C.textMuted, padding: "6px 10px", cursor: "pointer", display: "flex", alignItems: "center" }}>{I.save(18)}</button>}
          <button onClick={() => setShowSet(true)} data-tip-b="Settings" style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 8, color: C.textMuted, padding: "6px 10px", cursor: "pointer", display: "flex", alignItems: "center" }}>{I.gear(18)}</button>
        </div>
      </div>

      <div style={{ padding: "8px 16px", maxWidth: 480, margin: "0 auto", display: "flex", gap: 16, fontSize: 12, color: C.textMuted, fontFamily: "'DM Mono',monospace" }}>
        <span>{sections.length} section{sections.length !== 1 ? "s" : ""}</span><span>{totalBars} bar{totalBars !== 1 ? "s" : ""}</span>
        {totalBars > 0 && <span>{Math.ceil(tl[tl.length - 1].st + tl[tl.length - 1].dur)}s</span>}
      </div>

      <div style={{ padding: "8px 16px 120px", maxWidth: 480, margin: "0 auto", display: "flex", flexDirection: "column", gap: 6 }}>
        {sections.map((sec, i) => <SecCard key={sec.id} section={sec} index={i} total={sections.length} onClick={() => setEditId(sec.id)} onStartHere={() => { const idx = tl.findIndex(b => b.si === i); if (idx >= 0) { setMode("normal"); go(idx); } }} onMove={d => moveSec(i, d)} onDelete={sections.length > 1 ? handleDelete : null} onDragStart={handleDragStart} onDragEnter={handleDragEnter} onDragOver={handleDragOver} onDragEnd={handleDragEnd} onDrop={handleDrop} dragIdx={dragIdx} dropIdx={dropIdx} />)}
        <button onClick={addSec} style={{ width: "100%", padding: 14, borderRadius: 10, border: `1px dashed ${C.border}`, background: "transparent", color: C.textMuted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>{I.plus(20)}</button>
      </div>

      {/* Bottom buttons: Play / Record / Practice */}
      <div style={{ position: "fixed", bottom: 24, left: 0, right: 0, display: "flex", justifyContent: "center", zIndex: 10, pointerEvents: "none" }}>
        <div className="glass-pill" style={{ display: "flex", gap: 16, alignItems: "center", pointerEvents: "auto" }}>
          {settings.appMode !== "basic" && <button onClick={() => { setMode("record"); splitPoints.current = []; go(0); }} disabled={!sections.length} data-tip="Record" style={{ width: 44, height: 44, borderRadius: "50%", background: C.record, border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 16px ${C.glowRecord}` }}>{I.rec(18)}</button>}
          <button className="btn-ripple" onClick={() => { setMode("normal"); go(0); }} disabled={!sections.length} data-tip="Play" style={{ width: 56, height: 56, borderRadius: "50%", background: C.downbeat, border: "none", color: "#000", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 24px ${C.glowDownbeat}` }}>{I.play(24)}</button>
          {settings.appMode !== "basic" && <button onClick={() => setShowPrac(true)} data-tip="Practice" style={{ width: 44, height: 44, borderRadius: "50%", background: C.practice, border: "none", color: "#000", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 16px ${C.glowPractice}` }}>{I.target(18)}</button>}
        </div>
      </div>

      {ps && <PlayView ps={ps} sections={activeSections} tl={tl} onPause={() => { met.stop(); setIsP(false); }} onResume={() => { if (!ps) return; if (ps.countIn || ps.ended) { go(0); return; } const i = tl.findIndex(b => b.ab === ps.absoluteBar); if (i >= 0) { setIsP(true); met.start(tl, i, 0, { accented: settings.accented, pitched: settings.pitched, muted }); } }} onRestart={() => go(0)} onGoToBar={goToBar} onPrevSec={() => jumpSec(-1)} onNextSec={() => jumpSec(1)} vis={settings.visualMode} isP={isP} muted={muted} onMute={() => setMuted(m => !m)} onExit={exitPlay} mode={mode} onSplit={handleSplit} onTapTempo={handleLiveTapTempo} settings={settings} onSettings={setSettings} />}
      {editSec && <SecEd section={editSec} appMode={settings.appMode} onSave={(u, isDup = false) => { if (isDup) { setSections(p => { const i = p.findIndex(s => s.id === editId); return [...p.slice(0, i + 1), u, ...p.slice(i + 1)]; }); } else { setSections(p => p.map(s => s.id === u.id ? u : s)); } }} onClose={() => setEditId(null)} onDelete={sections.length > 1 ? handleDelete : null} />}
      {showSet && <SetP settings={settings} onChange={setSettings} onClose={() => setShowSet(false)} />}
      {showSave && <SaveM sections={sections} onClose={() => setShowSave(false)} onSaved={() => { }} />}
      {showLib && <LibP onLoad={s => setSections(s)} onClose={() => setShowLib(false)} />}
      {showPrac && <PracSetup sections={sections} onStart={startPractice} onClose={() => setShowPrac(false)} />}
      {undoToast && <div className="toast" style={{ position: "fixed", bottom: 90, left: "50%", zIndex: 60, background: C.surface, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 16, padding: "12px 20px", borderRadius: 12, boxShadow: "0 10px 40px rgba(0,0,0,0.5)" }}>
        <span style={{ fontSize: 13, color: C.text }}>{undoToast.index === -1 ? "Sections cleared" : "Section deleted"}</span>
        <button onClick={handleUndo} style={{ background: "none", border: "none", color: C.accent, fontWeight: 600, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>{I.restart(14)} Undo</button>
      </div>}
    </div>
  );
}
