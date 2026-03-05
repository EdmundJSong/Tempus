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
};

// ============ CONSTANTS ============
const BU = [{ id: "w", q: 4 }, { id: "h", q: 2 }, { id: "q", q: 1 }, { id: "e", q: 0.5 }, { id: "16", q: 0.25 }, { id: "32", q: 0.125 }];
const D2Q = { 1: 4, 2: 2, 4: 1, 8: 0.5, 16: 0.25, 32: 0.125 };
const C = { bg: "#07070a", surface: "#111116", surfaceHover: "#1a1a22", border: "#25252e", text: "#eeeef0", textMuted: "#6e6e7a", downbeat: "#f0a030", accent: "#8b7cf6", sub: "#3a3a45", danger: "#ef4444", record: "#ef4444", practice: "#22c55e", glowDownbeat: "rgba(240, 160, 48, 0.4)", glowPractice: "rgba(34, 197, 94, 0.4)", glowRecord: "rgba(239, 68, 68, 0.4)" };
const mkM = () => ({ id: Date.now() + Math.random(), type: "metered", tsNum: 4, tsDen: 4, beatUnit: "q", dotted: false, tempo: 120, bars: 4, grouping: "1+1+1+1", curve: "constant", endTempo: 120 });
const mkT = () => ({ id: Date.now() + Math.random(), type: "timed", duration: 10, markers: "" });
const SK = "tempus_profiles";
function ldP() { try { return JSON.parse(localStorage.getItem(SK)) || []; } catch { return []; } }
function svP(p) { localStorage.setItem(SK, JSON.stringify(p)); }

// ============ SVG NOTE ============
function NoteSVG({ type, dotted, size = 24 }) {
  const w = size, h = size * 1.6, hY = h * 0.72, hX = w * 0.38, sT = h * 0.15, sX = hX + 3.8;
  const op = type === "w" || type === "h", hs = type !== "w", uf = type === "e", bm = type === "16" ? 2 : type === "32" ? 3 : 0;
  const np = `M${hX - 4.5},${hY + 1} C${hX - 4.5},${hY + 3.5} ${hX - 1},${hY + 4} ${hX + 1.5},${hY + 2.5} C${hX + 4},${hY + 1} ${hX + 4.5},${hY - 1.5} ${hX + 4.5},${hY - 3.5} C${hX + 4.5},${hY - 6} ${hX + 1},${hY - 6.5} ${hX - 1.5},${hY - 5} C${hX - 4},${hY - 3.5} ${hX - 4.5},${hY - 1} ${hX - 4.5},${hY + 1} Z`;
  return (<svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: "block" }} aria-hidden="true">
    {op ? <path d={np} fill="none" stroke="currentColor" strokeWidth={1.5} transform={`rotate(-15,${hX},${hY})`} /> : <path d={np} fill="currentColor" transform={`rotate(-15,${hX},${hY})`} />}
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

function buildTL(sections) {
  const bars = []; let at = 0, ab = 1;
  sections.forEach((s, si) => {
    if (s.type === "timed") { bars.push({ si, bin: 1, ab: ab, st: at, dur: s.duration, cd: s.duration, tempo: 0, tsN: 0, tsD: 0, bts: [0], cpb: 1, isT: true, tDur: s.duration, mk: pM(s.markers) }); at += s.duration; ab++; return; }
    const grp = pG(s.grouping), cpb = s.tsNum;
    for (let b = 0; b < s.bars; b++) { let t = s.tempo; if (s.curve !== "constant") { const r = s.bars > 1 ? b / (s.bars - 1) : 0; t = s.tempo + (s.endTempo - s.tempo) * r; } const cd = gCD(t, s.beatUnit, s.dotted, s.tsDen); bars.push({ si, bin: b + 1, ab, st: at, dur: cpb * cd, cd, tempo: t, tsN: s.tsNum, tsD: s.tsDen, bts: gBT(grp), cpb, isT: false }); at += cpb * cd; ab++; }
  }); return bars;
}

// Scale sections for practice mode
function scaleSections(sections, pct) {
  return sections.map(s => {
    if (s.type === "timed") return { ...s, id: Date.now() + Math.random() };
    const ratio = pct / 100;
    return { ...s, id: Date.now() + Math.random(), tempo: Math.round(s.tempo * ratio), endTempo: Math.round(s.endTempo * ratio) };
  });
}

// ============ AUDIO ENGINE ============
function useMetronome() {
  const actx = useRef(null), tmr = useRef(null), nb = useRef(0), bi = useRef(0), bei = useRef(0), pl = useRef(false), tlR = useRef([]), cbR = useRef(null), sR = useRef({ accented: true, pitched: true, muted: false }), ciL = useRef(0), wl = useRef(null), sa = useRef(null), tsS = useRef(0), tsM = useRef(0), tsF = useRef(false);
  const init = useCallback(() => { if (!actx.current) actx.current = new (window.AudioContext || window.webkitAudioContext)(); return actx.current; }, []);
  const rwl = useCallback(async () => { try { if ("wakeLock" in navigator) wl.current = await navigator.wakeLock.request("screen"); } catch { } if (!sa.current) { const a = document.createElement("audio"); a.setAttribute("loop", "true"); a.setAttribute("playsinline", "true"); a.src = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA="; sa.current = a; } try { await sa.current.play(); } catch { } }, []);
  const rlwl = useCallback(() => { if (wl.current) { wl.current.release().catch(() => { }); wl.current = null; } if (sa.current) sa.current.pause(); }, []);
  const prime = useCallback(async () => { const ctx = init(); if (ctx.state === "suspended") await ctx.resume(); const buf = ctx.createBuffer(1, ctx.sampleRate * 0.05, ctx.sampleRate), src = ctx.createBufferSource(); src.buffer = buf; src.connect(ctx.destination); src.start(); await new Promise(r => setTimeout(r, 200)); return ctx; }, [init]);
  const clk = useCallback((ctx, time, bt) => {
    const { accented, pitched, muted } = sR.current; if (muted) return; const e = accented ? bt : 2;
    if ("vibrate" in navigator) { try { navigator.vibrate(e === 0 ? [30] : [15]); } catch (err) { } }
    if (pitched) { const f = e === 0 ? 1000 : e === 1 ? 750 : 500, v = e === 0 ? 0.8 : e === 1 ? 0.5 : 0.25, o = ctx.createOscillator(), g = ctx.createGain(); o.type = "sine"; o.frequency.value = f; g.gain.setValueAtTime(v, time); g.gain.exponentialRampToValueAtTime(0.001, time + 0.06); o.connect(g); g.connect(ctx.destination); o.start(time); o.stop(time + 0.08); }
    else { const l = Math.floor(ctx.sampleRate * 0.015), buf = ctx.createBuffer(1, l, ctx.sampleRate), d = buf.getChannelData(0); for (let i = 0; i < l; i++)d[i] = Math.random() * 2 - 1; const v = e === 0 ? 0.7 : e === 1 ? 0.4 : 0.2, src = ctx.createBufferSource(), g = ctx.createGain(); src.buffer = buf; g.gain.setValueAtTime(v, time); g.gain.exponentialRampToValueAtTime(0.001, time + 0.04); const fl = ctx.createBiquadFilter(); fl.type = "bandpass"; fl.frequency.value = e === 0 ? 4000 : e === 1 ? 3000 : 2000; fl.Q.value = 1.5; src.connect(fl); fl.connect(g); g.connect(ctx.destination); src.start(time); src.stop(time + 0.05); }
  }, []);
  const sched = useCallback(() => {
    const ctx = actx.current; if (!ctx || !pl.current) return; const tl = tlR.current;
    while (nb.current < ctx.currentTime + 0.12) {
      if (ciL.current > 0) { const bar = tl[bi.current]; if (!bar || bar.isT) { ciL.current = 0; continue; } clk(ctx, nb.current, ciL.current % bar.cpb === 0 ? 0 : 2); if (cbR.current) cbR.current({ type: "countIn", beatsLeft: ciL.current, beatInBar: bar.cpb - ((ciL.current - 1) % bar.cpb), totalBeats: bar.cpb }); nb.current += bar.cd; ciL.current--; continue; }
      const bar = tl[bi.current]; if (!bar) { stop(); return; }
      if (bar.isT) {
        if (tsS.current === 0) { tsS.current = nb.current; tsF.current = false; } const el = nb.current - tsS.current;
        if (!tsF.current) { clk(ctx, nb.current, 0); if (cbR.current) cbR.current({ type: "timedStart", ab: bar.ab, si: bar.si, dur: bar.tDur }); tsF.current = true; }
        if (bar.mk && tsM.current < bar.mk.length && el >= bar.mk[tsM.current] - 0.02) { clk(ctx, nb.current, 0); if (cbR.current) cbR.current({ type: "timedMarker", ab: bar.ab, si: bar.si, el, dur: bar.tDur, mt: bar.mk[tsM.current], mi: tsM.current, tm: bar.mk.length }); tsM.current++; }
        if (cbR.current) cbR.current({ type: "timedTick", ab: bar.ab, si: bar.si, el, rem: Math.max(0, bar.tDur - el), dur: bar.tDur });
        if (el >= bar.tDur) { tsS.current = 0; tsM.current = 0; tsF.current = false; bi.current++; continue; } nb.current += 0.05; return;
      }
      const bt = bar.bts[bei.current] ?? 2; clk(ctx, nb.current, bt);
      if (cbR.current) cbR.current({ type: "beat", barIdx: bi.current, beatIdx: bei.current, bt, ab: bar.ab, tsN: bar.tsN, tsD: bar.tsD, tempo: bar.tempo, si: bar.si });
      nb.current += bar.cd; bei.current++; if (bei.current >= bar.cpb) { bei.current = 0; bi.current++; }
    }
  }, [clk]);
  const stop = useCallback(() => { pl.current = false; if (tmr.current) { clearInterval(tmr.current); tmr.current = null; } tsS.current = 0; tsM.current = 0; tsF.current = false; rlwl(); }, [rlwl]);
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
function NI({ value, onChange, min, max, style = {}, step = 1, validate }) { const [d, setD] = useState(String(value)); const drg = useRef({ on: false, active: false, stX: 0, stV: 0 }); useEffect(() => setD(String(value)), [value]); const cm = v => { const n = typeof v === "number" ? v : parseFloat(d); if (!isNaN(n) && n >= min && n <= max) { if (validate && !validate(n)) { setD(String(value)); return; } onChange(n); setD(String(n)); } else setD(String(value)); }; const pD = e => { drg.current = { on: true, active: false, stX: e.clientX, stV: value }; }; const pM = e => { if (!drg.current.on) return; const dX = e.clientX - drg.current.stX; if (!drg.current.active && Math.abs(dX) < 8) return; if (!drg.current.active) { drg.current.active = true; e.target.setPointerCapture(e.pointerId); } const nv = Math.min(max, Math.max(min, drg.current.stV + Math.round(dX / 5) * step)); setD(String(nv)); }; const pU = e => { if (drg.current.active) { drg.current.on = false; drg.current.active = false; try { e.target.releasePointerCapture(e.pointerId); } catch {} cm(parseFloat(d)); } else { drg.current.on = false; } }; return <input type="text" inputMode="decimal" value={d} onChange={e => setD(e.target.value)} onBlur={() => cm()} onKeyDown={e => { if (e.key === "Enter") { cm(); e.target.blur(); } }} onPointerDown={pD} onPointerMove={pM} onPointerUp={pU} onPointerCancel={pU} style={{ ...nI, cursor: "ew-resize", ...style }} />; }
function Stp({ value, onChange, min = 1, max = 999 }) { return (<div style={{ display: "flex", alignItems: "center" }}><button onClick={() => onChange(Math.max(min, value - 1))} style={sB}>{I.chevL(16)}</button><NI value={value} onChange={onChange} min={min} max={max} /><button onClick={() => onChange(Math.min(max, value + 1))} style={sB}>{I.chevR(16)}</button></div>); }
function StpF({ value, onChange, min = 0, max = 999, step = 0.5 }) { return (<div style={{ display: "flex", alignItems: "center" }}><button onClick={() => onChange(Math.max(min, +(value - step).toFixed(1)))} style={sB}>{I.chevL(16)}</button><NI value={value} onChange={onChange} min={min} max={max} step={step} style={{ width: 72 }} /><button onClick={() => onChange(Math.min(max, +(value + step).toFixed(1)))} style={sB}>{I.chevR(16)}</button></div>); }
function Row({ label, children }) { return (<div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}><span style={{ color: C.textMuted, fontSize: 13, fontFamily: "'Outfit',sans-serif", width: 70, flexShrink: 0, display: "flex", alignItems: "center" }}>{label}</span><div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>{children}</div></div>); }

// ============ BEAT UNIT PICKER ============
function BUP({ beatUnit, dotted, onSelect }) { const [open, setOpen] = useState(false); const all = BU.flatMap(u => [{ ...u, dotted: false }, { ...u, dotted: true }]); return (<div style={{ position: "relative" }}><button onClick={() => setOpen(!open)} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 8, padding: "4px 6px", cursor: "pointer", color: C.text, display: "flex", alignItems: "center", justifyContent: "center", minWidth: 38, minHeight: 42 }}><NoteSVG type={beatUnit} dotted={dotted} size={20} /></button>{open && <><div style={{ position: "fixed", inset: 0, zIndex: 200 }} onClick={() => setOpen(false)} /><div style={{ position: "absolute", top: "100%", left: 0, zIndex: 201, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 8, marginTop: 4, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, minWidth: 120 }}>{all.map((u, i) => <button key={i} onClick={() => { onSelect(u.id, u.dotted); setOpen(false); }} style={{ background: u.id === beatUnit && u.dotted === dotted ? C.downbeat + "22" : "transparent", border: u.id === beatUnit && u.dotted === dotted ? `1px solid ${C.downbeat}` : "1px solid transparent", borderRadius: 6, padding: "6px 4px", cursor: "pointer", color: C.text, display: "flex", alignItems: "center", justifyContent: "center" }}><NoteSVG type={u.id} dotted={u.dotted} size={18} /></button>)}</div></>}</div>); }

// ============ SECTION EDITOR ============
function SecEd({ section, onSave, onClose, onDelete }) {
  const [s, setS] = useState({ ...section }); const upd = (k, v) => setS(p => ({ ...p, [k]: v })); const isMet = s.type === "metered";
  useEffect(() => { if (!isMet) return; const sum = pG(s.grouping).reduce((a, b) => a + b, 0); if (sum !== s.tsNum) upd("grouping", sG(s.tsNum, s.tsDen)); }, [s.tsNum, s.tsDen]);
  const gV = useMemo(() => { if (!isMet) return true; return pG(s.grouping).reduce((a, b) => a + b, 0) === s.tsNum; }, [s.grouping, s.tsNum, isMet]);
  useEffect(() => { if (s.curve === "accel" && s.endTempo <= s.tempo) upd("endTempo", s.tempo + 1); if (s.curve === "rit" && s.endTempo >= s.tempo) upd("endTempo", Math.max(10, s.tempo - 1)); }, [s.curve, s.tempo]);
  const sET = v => { if (s.curve === "accel") upd("endTempo", Math.max(s.tempo + 1, v)); else if (s.curve === "rit") upd("endTempo", Math.min(s.tempo - 1, Math.max(10, v))); else upd("endTempo", v); };
  const swT = t => { if (t === s.type) return; setS(p => (t === "timed" ? { ...mkT(), id: p.id } : { ...mkM(), id: p.id })); };
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={onClose}>
      <div style={{ width: "100%", maxWidth: 440, background: C.bg, borderTop: `1px solid ${C.border}`, borderRadius: "16px 16px 0 0", padding: "20px 20px 32px", maxHeight: "85vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
          <button onClick={() => swT("metered")} style={{ ...oB(isMet), display: "flex", alignItems: "center", gap: 6, flex: 1, justifyContent: "center" }}>{I.music(14)} Metered</button>
          <button onClick={() => swT("timed")} style={{ ...oB(!isMet), display: "flex", alignItems: "center", gap: 6, flex: 1, justifyContent: "center" }}>{I.clock(14)} Timed</button>
        </div>
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
            </div>
          </div>
          <Row label="Bars"><Stp value={s.bars} onChange={v => upd("bars", v)} min={1} max={999} /></Row>
          <Row label="Grouping"><input inputMode="text" value={s.grouping} onChange={e => upd("grouping", e.target.value)} style={{ ...nI, width: "auto", minWidth: 100, maxWidth: 200, textAlign: "left", padding: "0 12px", fontSize: 15, borderColor: gV ? C.border : C.danger }} placeholder="e.g. 2+3" />{!gV && <span style={{ color: C.danger, fontSize: 13, flexShrink: 0 }}>≠ {s.tsNum}</span>}</Row>
          <Row label="Curve">{["constant", "accel", "rit"].map(c => <button key={c} onClick={() => upd("curve", c)} style={{ padding: "8px 14px", borderRadius: 8, border: `1px solid ${s.curve === c ? C.downbeat : C.border}`, background: s.curve === c ? C.downbeat + "22" : "transparent", color: s.curve === c ? C.downbeat : C.textMuted, fontSize: 13, fontFamily: "'Outfit',sans-serif", cursor: "pointer" }}>{c === "constant" ? "—" : c === "accel" ? "accel." : "rit."}</button>)}</Row>
          {s.curve !== "constant" && <Row label={I.arrow(14)}><div style={{ display: "flex", alignItems: "center", gap: 8 }}><div style={{ color: C.text, display: "flex", alignItems: "center", minWidth: 30 }}><NoteSVG type={s.beatUnit} dotted={s.dotted} size={18} /></div><span style={{ color: C.textMuted, fontSize: 18, fontFamily: "'DM Mono',monospace" }}>=</span><Stp value={s.endTempo} onChange={sET} min={10} max={400} /></div></Row>}
        </>) : (<>
          <Row label="Duration"><StpF value={s.duration} onChange={v => upd("duration", v)} min={0.5} max={600} /><span style={{ color: C.textMuted, fontSize: 15, fontFamily: "'DM Mono',monospace", marginLeft: 6 }}>s</span></Row>
          <Row label="Markers"><input inputMode="decimal" value={s.markers} onChange={e => upd("markers", e.target.value)} style={{ ...nI, width: 200, textAlign: "left", padding: "0 12px", fontSize: 14 }} placeholder="e.g. 3, 7.5, 12" /></Row>
          <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 14, marginLeft: 82, fontFamily: "'DM Mono',monospace" }}>{pM(s.markers).length} cue{pM(s.markers).length !== 1 ? "s" : ""}</div>
        </>)}
        <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
          {onDelete && <button onClick={() => { onDelete(s.id); onClose(); }} style={{ flex: 0, padding: "10px 16px", borderRadius: 8, border: `1px solid ${C.danger}33`, background: `${C.danger}11`, color: C.danger, cursor: "pointer", display: "flex", alignItems: "center" }}>{I.trash(16)}</button>}
          <button onClick={() => { onSave({ ...s, id: Date.now() + Math.random(), type: s.type }, true); onClose(); }} style={{ flex: 0, padding: "10px 16px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, color: C.text, cursor: "pointer", display: "flex", alignItems: "center" }}>{I.copy(16)}</button>
          <button onClick={onClose} style={{ flex: 1, padding: "12px", borderRadius: 8, border: `1px solid ${C.border}`, background: "transparent", color: C.textMuted, fontSize: 14, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>Cancel</button>
          <button onClick={() => { if (gV) { onSave(s); onClose(); } }} style={{ flex: 1, padding: "12px", borderRadius: 8, border: "none", background: gV ? C.downbeat : C.sub, color: gV ? "#000" : C.textMuted, fontSize: 14, fontWeight: 600, cursor: gV ? "pointer" : "default", fontFamily: "'Outfit',sans-serif" }}>Add</button>
        </div>
      </div>
    </div>);
}

// ============ SECTION CARD ============
function SecCard({ section: s, index: i, total: t, onClick, onStartHere, onMove }) {
  const isT = s.type === "timed";
  return (<div className="sec-card" onClick={onClick} style={{ background: C.surface, borderRadius: 10, padding: "12px 14px", border: `1px solid ${s.capturedDuration ? C.record + "44" : C.border}`, cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}>
    <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 24, alignItems: "center" }}>
      <button disabled={i === 0} onClick={e => { e.stopPropagation(); onMove(-1); }} style={{ background: "none", border: "none", color: i === 0 ? C.border : C.textMuted, cursor: i === 0 ? "default" : "pointer", padding: 2, display: "flex" }}>{I.arrowUp(14)}</button>
      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: C.textMuted, textAlign: "center", lineHeight: 1 }}>{i + 1}</div>
      <button disabled={i === t - 1} onClick={e => { e.stopPropagation(); onMove(1); }} style={{ background: "none", border: "none", color: i === t - 1 ? C.border : C.textMuted, cursor: i === t - 1 ? "default" : "pointer", padding: 2, display: "flex" }}>{I.arrowDown(14)}</button>
    </div>
    {isT ? (<>{I.clock(16)}<div style={{ flex: 1, fontFamily: "'DM Mono',monospace", fontSize: 15, color: C.text }}>{s.duration}s</div><div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: C.textMuted }}>{pM(s.markers).length} cue{pM(s.markers).length !== 1 ? "s" : ""}</div></>) : (<>
      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 18, fontWeight: 700, color: C.text, lineHeight: 1, textAlign: "center", minWidth: 30, display: "flex", flexDirection: "column", alignItems: "center" }}><span>{s.tsNum}</span><div style={{ height: 1, width: "100%", background: C.textMuted, margin: "1px 0" }} /><span>{s.tsDen}</span></div>
      <div style={{ display: "flex", alignItems: "center", gap: 3, color: C.text, flex: 1 }}><NoteSVG type={s.beatUnit} dotted={s.dotted} size={16} /><span style={{ fontFamily: "'DM Mono',monospace", fontSize: 13, color: C.textMuted }}>=</span><span style={{ fontFamily: "'DM Mono',monospace", fontSize: 15 }}>{s.tempo}</span>{s.curve !== "constant" && <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: C.accent, marginLeft: 4 }}>{s.curve === "accel" ? "→" : "←"}{s.endTempo}</span>}</div>
      <div style={{ textAlign: "right" }}><div style={{ fontFamily: "'DM Mono',monospace", fontSize: 14, color: C.text }}>{s.bars} bar{s.bars !== 1 ? "s" : ""}</div><div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: C.textMuted }}>{s.grouping}</div></div>
    </>)}
    <button onClick={e => { e.stopPropagation(); onStartHere(); }} style={{ background: "none", border: "none", color: C.textMuted, cursor: "pointer", padding: 4, display: "flex" }}>{I.play(14)}</button>
  </div>);
}

// ============ PLAY VIEW ============
function PlayView({ ps, sections, tl, onPause, onResume, onRestart, onGoToBar, onPrevSec, onNextSec, vis, isP, muted, onMute, onExit, mode, onSplit }) {
  const { absoluteBar: ab, beatIndex: bei, beatType: bt, tsNum: tsN, tsDen: tsD, sectionIndex: si, flash, isTimed: isT, countIn: isCI } = ps;
  const fc = bt === 0 ? C.downbeat : bt === 1 ? C.accent : C.text, fo = flash ? (bt === 0 ? 0.35 : bt === 1 ? 0.2 : 0.08) : 0;
  const [goBar, setGoBar] = useState("");
  const showF = vis === "flash" || vis === "dots+flash", showD = vis === "dots" || vis === "dots+flash";
  const borderColor = mode === "record" ? C.record : mode === "practice" ? C.practice : null;
  const nxt = sections[si + 1]; let upN = null;
  if (nxt && !isCI) { if (isT) { if (ps.remaining != null && ps.remaining <= 10) upN = nxt.type === "timed" ? `${nxt.duration}s Free` : `${nxt.tsNum}/${nxt.tsDen} at ${nxt.tempo}`; } else { const bis = tl.filter(b => b.si === si); if (bis.length > 0 && bis[bis.length - 1].ab - ab <= 1) upN = nxt.type === "timed" ? `${nxt.duration}s Free` : `${nxt.tsNum}/${nxt.tsDen} at ${nxt.tempo}`; } }

  const handleTap = e => { if (mode === "record" && onSplit) { const t = e.target; if (t.closest && (t.closest("button") || t.closest("input"))) return; onSplit(ab); } };

  const cR = 120, cC = 2 * Math.PI * cR; let prg = 0;
  if (isCI) prg = tsN > 0 ? (bei + 1) / tsN : 0;
  else if (isT && ps.remaining != null) prg = 1 - (ps.remaining / (sections[si]?.duration || 1));
  else if (!isT) { const bs = tl.filter(b => b.si === si); if (bs.length) { const t = bs.length, c = ab - bs[0].ab, bp = bei / Math.max(1, tsN); prg = (c + bp) / t; } }
  const sDo = cC - (prg * cC);

  return (
    <div onClick={handleTap} style={{ position: "fixed", inset: 0, background: C.bg, zIndex: 50, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'DM Mono',monospace", boxShadow: borderColor ? `inset 0 0 0 4px ${borderColor}, inset 0 0 30px ${borderColor}44` : undefined }}>
      {showF && flash && <div style={{ position: "absolute", inset: 0, background: fc, opacity: fo, transition: "opacity 0.05s", pointerEvents: "none" }} />}
      <div style={{ position: "absolute", top: 16, left: 16, right: 16, display: "flex", justifyContent: "space-between", zIndex: 2 }}>
        <button onClick={onMute} style={tS}>{muted ? I.volOff(18) : I.volOn(18)}</button>
        <div style={{ display: "flex", gap: 8 }}>
          {mode === "record" && <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: C.record, display: "flex", alignItems: "center", gap: 4, animation: "pulse 2s infinite" }}>{I.rec(12)} REC</div>}
          {mode === "practice" && ps.pctLabel && <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 13, color: C.practice, fontWeight: 600 }}>{ps.pctLabel}</div>}
          <button onClick={onExit} style={tS}>{I.x(18)}</button>
        </div>
      </div>
      <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: 280, height: 280, marginBottom: 16 }}>
        <svg width={280} height={280} style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)", pointerEvents: "none" }}>
          <circle cx={140} cy={140} r={cR} fill="none" stroke={C.border} strokeWidth={8} />
          <circle cx={140} cy={140} r={cR} fill="none" stroke={borderColor || C.downbeat} strokeWidth={8} strokeDasharray={cC} strokeDashoffset={sDo} strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.1s linear" }} />
        </svg>
        <div style={{ fontSize: 20, color: C.textMuted, fontWeight: 700, display: "flex", flexDirection: "column", alignItems: "center", lineHeight: 1.1, position: "relative", zIndex: 1, marginBottom: 8 }}>
          {isCI ? "Count-in" : isT ? <span style={{ display: "flex", alignItems: "center", gap: 6 }}>{I.clock(18)} FREE</span> : (<><span>{tsN}</span><div style={{ height: 1, width: 30, background: C.textMuted, margin: "2px 0" }} /><span>{tsD}</span></>)}
        </div>
        <div className="hdr-text" style={{ fontFamily: "'Bebas Neue','DM Mono',monospace", fontSize: 110, fontWeight: 400, color: C.text, lineHeight: 1, position: "relative", zIndex: 1, letterSpacing: 2 }}>
          {isCI ? "—" : isT ? (ps.remaining != null ? ps.remaining.toFixed(1) : "—") : ab}
        </div>
      </div>
      {!isCI && <div style={{ fontSize: 12, color: C.textMuted, marginTop: 4, position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
        <div>{si + 1}/{sections.length}{!isT && ps.tempo ? ` · ${Math.round(ps.tempo)}` : ""}</div>
        {upN && <div style={{ color: C.downbeat, fontSize: 14, fontWeight: 600, animation: "pulse 2s infinite" }}>Up Next: {upN}</div>}
      </div>}
      {showD && !isT && !isCI && <div style={{ display: "flex", gap: 8, marginTop: 24, position: "relative", zIndex: 1, flexWrap: "wrap", justifyContent: "center", maxWidth: 280, padding: "0 16px" }}>{(ps.allBeatTypes || []).map((b, i) => { const on = i === bei, c = b === 0 ? C.downbeat : b === 1 ? C.accent : C.sub; return <div key={i} style={{ width: on ? 16 : 10, height: on ? 16 : 10, borderRadius: "50%", background: on ? c : `${c}55`, transition: "all 0.06s", border: on ? `2px solid ${c}` : "2px solid transparent" }} />; })}</div>}
      {showD && isT && ps.totalMarkers > 0 && <div style={{ display: "flex", gap: 8, marginTop: 24, position: "relative", zIndex: 1, flexWrap: "wrap", justifyContent: "center", maxWidth: 280 }}>{Array.from({ length: ps.totalMarkers }).map((_, i) => { const on = i === ps.markerIdx, past = i < (ps.markerIdx || 0); return <div key={i} style={{ width: on ? 16 : 10, height: on ? 16 : 10, borderRadius: "50%", background: on ? C.downbeat : past ? `${C.downbeat}88` : `${C.sub}55`, transition: "all 0.06s", border: on ? `2px solid ${C.downbeat}` : "2px solid transparent" }} />; })}</div>}
      {mode === "record" && <div style={{ marginTop: 20, fontSize: 12, color: C.record, fontFamily: "'Outfit',sans-serif", position: "relative", zIndex: 1, opacity: 0.7 }}>Tap screen to mark section</div>}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: mode === "record" ? 16 : 36, position: "relative", zIndex: 1 }}>
        <button onClick={onPrevSec} style={nv}>{I.chevL(18)}</button>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <input type="text" inputMode="numeric" value={goBar} onChange={e => setGoBar(e.target.value)} placeholder="Bar" style={{ ...nI, width: 64, fontSize: 14 }} onKeyDown={e => { if (e.key === "Enter") { const v = parseInt(goBar); if (!isNaN(v) && v > 0) { onGoToBar(v); setGoBar(""); } } }} />
          <button onClick={() => { const v = parseInt(goBar); if (!isNaN(v) && v > 0) { onGoToBar(v); setGoBar(""); } }} style={{ ...nv, fontSize: 12, padding: "8px 10px" }}>GO</button>
        </div>
        <button onClick={onNextSec} style={nv}>{I.chevR(18)}</button>
      </div>
      <div style={{ display: "flex", gap: 16, marginTop: 24, position: "relative", zIndex: 1, alignItems: "center" }}>
        <button onClick={onRestart} style={tS}>{I.restart(18)}</button>
        <button onClick={isP ? onPause : onResume} style={tB}>{isP ? I.pause(22) : I.play(22)}</button>
        <div style={{ width: 44 }} />
      </div>
    </div>);
}
const nv = { padding: "8px 14px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, color: C.text, cursor: "pointer", fontFamily: "'DM Mono',monospace", display: "flex", alignItems: "center", justifyContent: "center" };
const tB = { width: 56, height: 56, borderRadius: "50%", border: "none", background: C.downbeat, color: "#000", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 24px ${C.downbeat}33` };
const tS = { width: 44, height: 44, borderRadius: 10, border: `1px solid ${C.border}`, background: C.surface, color: C.text, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" };

// ============ SETTINGS / SAVE / LIBRARY ============
function SetP({ settings: s, onChange, onClose }) { const u = (k, v) => onChange({ ...s, [k]: v }); return (<div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={onClose}><div style={{ width: "100%", maxWidth: 440, background: C.bg, borderTop: `1px solid ${C.border}`, borderRadius: "16px 16px 0 0", padding: "20px 20px 32px" }} onClick={e => e.stopPropagation()}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}><div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 16, color: C.text, fontWeight: 600 }}>Settings</div><button onClick={onClose} style={{ background: "none", border: "none", color: C.textMuted, cursor: "pointer", display: "flex" }}>{I.x(18)}</button></div><SR l="Click">{["accented", "flat"].map(v => <button key={v} onClick={() => u("accented", v === "accented")} style={oB(s.accented === (v === "accented"))}>{v === "accented" ? "Accented" : "Flat"}</button>)}</SR><SR l="Sound">{["pitched", "unpitched"].map(v => <button key={v} onClick={() => u("pitched", v === "pitched")} style={oB(s.pitched === (v === "pitched"))}>{v === "pitched" ? "Pitched" : "Unpitched"}</button>)}</SR><SR l="Visual">{[["dots", "●"], ["dots+flash", "● ◻"], ["flash", "◻"]].map(([v, l]) => <button key={v} onClick={() => u("visualMode", v)} style={{ ...oB(s.visualMode === v), fontSize: 11 }}>{l}</button>)}</SR><SR l="Count-in">{[0, 1, 2].map(v => <button key={v} onClick={() => u("countIn", v)} style={oB(s.countIn === v)}>{v === 0 ? "Off" : `${v} bar${v > 1 ? "s" : ""}`}</button>)}</SR></div></div>); }
function SR({ l, children }) { return (<div style={{ marginBottom: 16 }}><div style={{ fontSize: 12, color: C.textMuted, marginBottom: 8, fontFamily: "'Outfit',sans-serif" }}>{l}</div><div style={{ display: "flex", gap: 8 }}>{children}</div></div>); }
function SaveM({ sections, onClose, onSaved }) { const [t, sT] = useState(""), [c, sC] = useState(""); const ok = t.trim() && c.trim(); const go = () => { if (!ok) return; const p = ldP(); p.push({ id: Date.now(), title: t.trim(), composer: c.trim(), sections, createdAt: new Date().toISOString() }); svP(p); onSaved(); onClose(); }; return (<div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={onClose}><div style={{ width: "100%", maxWidth: 440, background: C.bg, borderTop: `1px solid ${C.border}`, borderRadius: "16px 16px 0 0", padding: "20px 20px 32px" }} onClick={e => e.stopPropagation()}><div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 16, color: C.text, fontWeight: 600, marginBottom: 18 }}>Save Piece</div><input value={t} onChange={e => sT(e.target.value)} placeholder="Title" style={{ ...nI, width: "100%", textAlign: "left", padding: "0 12px", marginBottom: 10, fontSize: 15 }} /><input value={c} onChange={e => sC(e.target.value)} placeholder="Composer / Arranger" style={{ ...nI, width: "100%", textAlign: "left", padding: "0 12px", marginBottom: 20, fontSize: 15 }} /><div style={{ display: "flex", gap: 10 }}><button onClick={onClose} style={{ flex: 1, padding: "12px", borderRadius: 8, border: `1px solid ${C.border}`, background: "transparent", color: C.textMuted, fontSize: 14, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>Cancel</button><button onClick={go} style={{ flex: 1, padding: "12px", borderRadius: 8, border: "none", background: ok ? C.downbeat : C.sub, color: ok ? "#000" : C.textMuted, fontSize: 14, fontWeight: 600, cursor: ok ? "pointer" : "default", fontFamily: "'Outfit',sans-serif" }}>Save</button></div></div></div>); }
function LibP({ onLoad, onClose }) { const [p, sP] = useState(ldP()), [s, sS] = useState(""); const f = p.filter(x => x.title.toLowerCase().includes(s.toLowerCase()) || x.composer.toLowerCase().includes(s.toLowerCase())); const del = id => { const u = p.filter(x => x.id !== id); svP(u); sP(u); }; return (<div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={onClose}><div style={{ width: "100%", maxWidth: 440, background: C.bg, borderTop: `1px solid ${C.border}`, borderRadius: "16px 16px 0 0", padding: "20px 20px 32px", maxHeight: "80vh", display: "flex", flexDirection: "column" }} onClick={e => e.stopPropagation()}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}><div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 16, color: C.text, fontWeight: 600 }}>Library</div><button onClick={onClose} style={{ background: "none", border: "none", color: C.textMuted, cursor: "pointer", display: "flex" }}>{I.x(18)}</button></div><div style={{ position: "relative", marginBottom: 12 }}><input value={s} onChange={e => sS(e.target.value)} placeholder="Search..." style={{ ...nI, width: "100%", textAlign: "left", padding: "0 12px 0 36px", fontSize: 14 }} /><div style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: C.textMuted }}>{I.search(14)}</div></div><div style={{ overflowY: "auto", flex: 1 }}>{f.length === 0 && <div style={{ color: C.textMuted, fontSize: 13, fontFamily: "'Outfit',sans-serif", textAlign: "center", padding: "40px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}><svg width={64} height={64} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1} style={{ opacity: 0.2 }}><path d="M12 2L4 22h16L12 2z" /><circle cx={12} cy={16} r={2} fill="currentColor" /><line x1={12} y1={16} x2={16} y2={6} strokeWidth={2} strokeLinecap="round" /></svg><div>{p.length === 0 ? "No saved pieces yet" : "No results found"}</div></div>}{f.map(x => (<div key={x.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: `1px solid ${C.border}` }}><div style={{ flex: 1, cursor: "pointer" }} onClick={() => { onLoad(x.sections); onClose(); }}><div style={{ fontFamily: "'DM Mono',monospace", fontSize: 14, color: C.text }}>{x.title}</div><div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 12, color: C.textMuted }}>{x.composer}</div></div><div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: C.textMuted, flexShrink: 0 }}>{x.sections?.length || 0} sec</div><button onClick={() => del(x.id)} style={{ background: "none", border: "none", color: C.danger + "88", cursor: "pointer", padding: 4, display: "flex" }}>{I.trash(14)}</button></div>))}</div></div></div>); }

// ============ PRACTICE SETUP MODAL ============
function PracSetup({ sections, onStart, onClose }) {
  const hasProfile = sections.length > 0 && sections.some(s => s.type === "metered");
  const [mode, setMode] = useState(hasProfile ? "profile" : "standalone");
  const [tsN, setTsN] = useState(4); const [tsD, setTsD] = useState(4); const [bu, setBu] = useState("q"); const [dot, setDot] = useState(false);
  const [bars, setBars] = useState(4); const [startT, setStartT] = useState(80); const [targetT, setTargetT] = useState(120);
  const [inc, setInc] = useState(5); const [reps, setReps] = useState(2);
  const [pct, setPct] = useState(70); const [pctInc, setPctInc] = useState(5); const [pctReps, setPctReps] = useState(2);
  const doStart = () => {
    if (mode === "standalone") {
      const sec = { ...mkM(), tsNum: tsN, tsDen: tsD, beatUnit: bu, dotted: dot, bars, grouping: sG(tsN, tsD) };
      const steps = []; for (let t = startT; t <= targetT; t += inc) { for (let r = 0; r < reps; r++)steps.push({ ...sec, id: Date.now() + Math.random(), tempo: Math.min(t, targetT) }); }
      onStart(steps, null);
    } else {
      onStart(null, { startPct: pct, targetPct: 100, pctInc, pctReps });
    }
    onClose();
  };
  return (<div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={onClose}>
    <div style={{ width: "100%", maxWidth: 440, background: C.bg, borderTop: `1px solid ${C.border}`, borderRadius: "16px 16px 0 0", padding: "20px 20px 32px", maxHeight: "85vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
      <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 16, color: C.practice, fontWeight: 600, marginBottom: 18, display: "flex", alignItems: "center", gap: 8 }}>{I.target(18)} Practice Mode</div>
      {hasProfile && <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
        <button onClick={() => setMode("profile")} style={{ ...oB(mode === "profile"), borderColor: mode === "profile" ? C.practice : C.border, color: mode === "profile" ? C.practice : C.textMuted, background: mode === "profile" ? C.practice + "15" : "transparent", flex: 1, textAlign: "center", display: "flex", justifyContent: "center" }}>Profile</button>
        <button onClick={() => setMode("standalone")} style={{ ...oB(mode === "standalone"), borderColor: mode === "standalone" ? C.practice : C.border, color: mode === "standalone" ? C.practice : C.textMuted, background: mode === "standalone" ? C.practice + "15" : "transparent", flex: 1, textAlign: "center", display: "flex", justifyContent: "center" }}>Standalone</button>
      </div>}
      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 8, marginBottom: 16 }}>
        <button onClick={() => { setMode("standalone"); setStartT(60); setTargetT(120); setInc(10); setReps(1); }} style={{ ...oB(false), whiteSpace: "nowrap", flexShrink: 0 }}>🚀 Warmup</button>
        <button onClick={() => { setMode("standalone"); setStartT(120); setTargetT(160); setInc(2); setReps(4); }} style={{ ...oB(false), whiteSpace: "nowrap", flexShrink: 0 }}>🔥 Endurance</button>
        <button onClick={() => { setMode("standalone"); setStartT(160); setTargetT(200); setInc(5); setReps(2); }} style={{ ...oB(false), whiteSpace: "nowrap", flexShrink: 0 }}>⚡ Speed</button>
      </div>
      {mode === "standalone" ? (<>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 18 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <NI value={tsN} onChange={setTsN} min={1} max={32} style={{ width: 48, height: 42, fontSize: 20, fontWeight: 700 }} />
            <div style={{ height: 1, width: 36, background: C.textMuted }} />
            <NI value={tsD} onChange={v => setTsD(v)} min={1} max={32} validate={v => [1, 2, 4, 8, 16, 32].includes(v)} style={{ width: 48, height: 42, fontSize: 20, fontWeight: 700 }} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1 }}>
            <BUP beatUnit={bu} dotted={dot} onSelect={(id, d) => { setBu(id); setDot(d); }} />
          </div>
        </div>
        <Row label="Bars"><Stp value={bars} onChange={setBars} min={1} max={32} /></Row>
        <Row label="Start"><Stp value={startT} onChange={setStartT} min={10} max={400} /></Row>
        <Row label="Target"><Stp value={targetT} onChange={setTargetT} min={10} max={400} /></Row>
        <Row label="+ BPM"><Stp value={inc} onChange={setInc} min={1} max={50} /></Row>
        <Row label="Repeats"><Stp value={reps} onChange={setReps} min={1} max={20} /></Row>
      </>) : (<>
        <Row label="Start %"><Stp value={pct} onChange={setPct} min={10} max={100} /></Row>
        <Row label="+ %"><Stp value={pctInc} onChange={setPctInc} min={1} max={25} /></Row>
        <Row label="Repeats"><Stp value={pctReps} onChange={setPctReps} min={1} max={20} /></Row>
        <div style={{ fontSize: 12, color: C.textMuted, fontFamily: "'DM Mono',monospace", marginBottom: 14, marginLeft: 82 }}>
          {Math.ceil((100 - pct) / pctInc) + 1} steps × {pctReps} loops
        </div>
      </>)}
      <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
        <button onClick={onClose} style={{ flex: 1, padding: "12px", borderRadius: 8, border: `1px solid ${C.border}`, background: "transparent", color: C.textMuted, fontSize: 14, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>Cancel</button>
        <button onClick={doStart} style={{ flex: 1, padding: "12px", borderRadius: 8, border: "none", background: C.practice, color: "#000", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>Start</button>
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
  const [settings, setSettings] = useState({ accented: true, pitched: true, visualMode: "dots+flash", countIn: 1 });
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

  const activeSections = pracSections || sections;
  const tl = useMemo(() => buildTL(activeSections), [activeSections]);
  const totalBars = tl.length;

  useEffect(() => { met.updS({ muted }); }, [muted]);

  // Bug 2 fix: Start practice mode after re-render so go() has fresh timeline
  useEffect(() => { if (pracPending && pracSections) { setPracPending(false); go(0); } }, [pracPending, pracSections, go]);

  useEffect(() => {
    met.setCb(evt => {
      if (evt.type === "beat") { const bar = tl[evt.barIdx]; setPs({ absoluteBar: evt.ab, beatIndex: evt.beatIdx, beatType: evt.bt, tsNum: evt.tsN, tsDen: evt.tsD, tempo: evt.tempo, sectionIndex: evt.si, allBeatTypes: bar?.bts || [], flash: true, countIn: false, isTimed: false, pctLabel: pracSections ? `${pracStep}%` : null }); if (fto.current) clearTimeout(fto.current); fto.current = setTimeout(() => setPs(p => p ? { ...p, flash: false } : p), 80); }
      else if (evt.type === "countIn") { setPs(p => ({ ...p || {}, countIn: true, flash: true, isTimed: false, beatIndex: evt.beatInBar - 1, beatType: evt.beatInBar === 1 ? 0 : 2, tsNum: evt.totalBeats, tsDen: 0, allBeatTypes: Array(evt.totalBeats).fill(2).map((_, i) => i === 0 ? 0 : 2) })); if (fto.current) clearTimeout(fto.current); fto.current = setTimeout(() => setPs(p => p ? { ...p, flash: false } : p), 80); }
      else if (evt.type === "timedStart") { setPs(p => ({ ...p || {}, isTimed: true, countIn: false, flash: true, beatType: 0, absoluteBar: evt.ab, sectionIndex: evt.si, remaining: evt.dur, tsNum: 0, tsDen: 0 })); if (fto.current) clearTimeout(fto.current); fto.current = setTimeout(() => setPs(p => p ? { ...p, flash: false } : p), 80); }
      else if (evt.type === "timedTick") { setPs(p => ({ ...p || {}, isTimed: true, countIn: false, absoluteBar: evt.ab, sectionIndex: evt.si, remaining: evt.rem, flash: p?.flash || false, tsNum: 0, tsDen: 0, beatType: 0, totalMarkers: p?.totalMarkers || 0, markerIdx: p?.markerIdx || 0 })); }
      else if (evt.type === "timedMarker") { setPs(p => ({ ...p || {}, flash: true, beatType: 0, totalMarkers: evt.tm, markerIdx: evt.mi })); if (fto.current) clearTimeout(fto.current); fto.current = setTimeout(() => setPs(p => p ? { ...p, flash: false } : p), 80); }
    });
  }, [met, tl, pracSections, pracStep]);

  const go = useCallback((fi = 0) => { if (!tl.length) return; const i = Math.max(0, Math.min(fi, tl.length - 1)), b = tl[i]; setPs({ absoluteBar: b.ab, beatIndex: 0, beatType: 0, tsNum: b.tsN, tsDen: b.tsD, tempo: b.tempo, sectionIndex: b.si, allBeatTypes: b.bts, flash: false, countIn: false, isTimed: b.isT, remaining: b.isT ? b.tDur : undefined, pctLabel: pracSections ? `${pracStep}%` : null }); setIsP(true); met.start(tl, i, settings.countIn, { accented: settings.accented, pitched: settings.pitched, muted }); }, [tl, settings, met, muted, pracSections, pracStep]);
  const exitPlay = useCallback(() => { met.stop(); setIsP(false); setPs(null); setMode("normal"); setPracSections(null); }, [met]);
  const goToBar = useCallback(n => { const i = tl.findIndex(b => b.ab === n); if (i >= 0) go(i); }, [tl, go]);
  const jumpSec = useCallback(d => { if (!ps) return; const ns = Math.max(0, Math.min(activeSections.length - 1, ps.sectionIndex + d)), i = tl.findIndex(b => b.si === ns); if (i >= 0) go(i); }, [ps, activeSections, tl, go]);

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
  const startPractice = useCallback((standaloneSecs, profileOpts) => {
    if (standaloneSecs) {
      setPracSections(standaloneSecs); setPracStep(standaloneSecs[0]?.tempo || 0); setMode("practice");
      setPracPending(true);
    } else if (profileOpts) {
      const { startPct, targetPct, pctInc, pctReps } = profileOpts;
      let allSecs = [];
      for (let p = startPct; p <= targetPct; p += pctInc) {
        for (let r = 0; r < pctReps; r++) {
          allSecs = allSecs.concat(scaleSections(sections, Math.min(p, targetPct)));
        }
      }
      setPracSections(allSecs); setPracStep(startPct); setMode("practice");
      setPracPending(true);
    }
  }, [sections, go]);

  const addSec = () => { const ns = mkM(); if (sections.length > 0) { const l = sections[sections.length - 1]; if (l.type === "metered") { ns.tsNum = l.tsNum; ns.tsDen = l.tsDen; ns.beatUnit = l.beatUnit; ns.dotted = l.dotted; ns.tempo = l.tempo; ns.grouping = l.grouping; } } setSections(p => [...p, ns]); setEditId(ns.id); };
  const moveSec = (i, d) => { setSections(p => { const a = [...p]; if (i + d >= 0 && i + d < a.length) [a[i], a[i + d]] = [a[i + d], a[i]]; return a; }); };
  const editSec = sections.find(s => s.id === editId);

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'Outfit',sans-serif", touchAction: "manipulation", position: "relative" }}>
      <div className="ambient-bg" style={{ background: `radial-gradient(circle at 50% 10%, ${mode === 'record' ? C.record + '15' : mode === 'practice' ? C.practice + '15' : C.downbeat + '15'}, transparent 60%)` }} />
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&family=DM+Mono:wght@400;500&family=Bebas+Neue&display=swap" rel="stylesheet" />
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0} html{touch-action:manipulation}
        input[type=number]::-webkit-inner-spin-button,input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none;margin:0} input[type=number]{-moz-appearance:textfield}
        ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-thumb{background:${C.border};border-radius:2px}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
        @keyframes ripple { 0% { transform: scale(1); opacity: 0.5; } 100% { transform: scale(1.6); opacity: 0; } }
        .sec-card { transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease, background 0.15s; }
        .sec-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.4); border-color: ${C.textMuted}44; background: ${C.surfaceHover} !important; }
        .glass-pill { background: rgba(17, 17, 22, 0.65); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border-radius: 40px; border: 1px solid rgba(255,255,255,0.05); padding: 8px 16px; box-shadow: 0 10px 40px rgba(0,0,0,0.5); }
        .ambient-bg { position: fixed; inset: 0; z-index: 0; pointer-events: none; transition: background 1s ease; }
        .hdr-text { text-shadow: 0 0 20px currentColor, 0 0 40px currentColor; }
        .btn-ripple { position: relative; }
        .btn-ripple::before { content: ''; position: absolute; inset: 0; border-radius: 50%; background: inherit; z-index: -1; animation: ripple 2.5s cubic-bezier(0.4, 0, 0.2, 1) infinite; }
      `}</style>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 16px 8px", maxWidth: 480, margin: "0 auto" }}>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, letterSpacing: 3, color: C.text }}>TEMPUS</div>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={() => setShowLib(true)} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 8, color: C.textMuted, padding: "6px 10px", cursor: "pointer", display: "flex", alignItems: "center" }}>{I.folder(18)}</button>
          <button onClick={() => setShowSave(true)} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 8, color: C.textMuted, padding: "6px 10px", cursor: "pointer", display: "flex", alignItems: "center" }}>{I.save(18)}</button>
          <button onClick={() => setShowSet(true)} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 8, color: C.textMuted, padding: "6px 10px", cursor: "pointer", display: "flex", alignItems: "center" }}>{I.gear(18)}</button>
        </div>
      </div>

      <div style={{ padding: "8px 16px", maxWidth: 480, margin: "0 auto", display: "flex", gap: 16, fontSize: 12, color: C.textMuted, fontFamily: "'DM Mono',monospace" }}>
        <span>{sections.length} section{sections.length !== 1 ? "s" : ""}</span><span>{totalBars} bar{totalBars !== 1 ? "s" : ""}</span>
        {totalBars > 0 && <span>{Math.ceil(tl[tl.length - 1].st + tl[tl.length - 1].dur)}s</span>}
      </div>

      <div style={{ padding: "8px 16px 120px", maxWidth: 480, margin: "0 auto", display: "flex", flexDirection: "column", gap: 6 }}>
        {sections.map((sec, i) => <SecCard key={sec.id} section={sec} index={i} total={sections.length} onClick={() => setEditId(sec.id)} onStartHere={() => { const idx = tl.findIndex(b => b.si === i); if (idx >= 0) { setMode("normal"); go(idx); } }} onMove={d => moveSec(i, d)} />)}
        <button onClick={addSec} style={{ width: "100%", padding: 14, borderRadius: 10, border: `1px dashed ${C.border}`, background: "transparent", color: C.textMuted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>{I.plus(20)}</button>
      </div>

      {/* Three bottom buttons: Play / Record / Practice */}
      <div style={{ position: "fixed", bottom: 24, left: 0, right: 0, display: "flex", justifyContent: "center", zIndex: 10, pointerEvents: "none" }}>
        <div className="glass-pill" style={{ display: "flex", gap: 16, alignItems: "center", pointerEvents: "auto" }}>
          <button onClick={() => { setMode("record"); splitPoints.current = []; go(0); }} disabled={!sections.length} style={{ width: 44, height: 44, borderRadius: "50%", background: C.record, border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 16px ${C.glowRecord}` }}>{I.rec(18)}</button>
          <button className="btn-ripple" onClick={() => { setMode("normal"); go(0); }} disabled={!sections.length} style={{ width: 56, height: 56, borderRadius: "50%", background: C.downbeat, border: "none", color: "#000", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 24px ${C.glowDownbeat}` }}>{I.play(24)}</button>
          <button onClick={() => setShowPrac(true)} style={{ width: 44, height: 44, borderRadius: "50%", background: C.practice, border: "none", color: "#000", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 16px ${C.glowPractice}` }}>{I.target(18)}</button>
        </div>
      </div>

      {ps && <PlayView ps={ps} sections={activeSections} tl={tl} onPause={() => { met.stop(); setIsP(false); }} onResume={() => { if (ps && !ps.countIn) { const i = tl.findIndex(b => b.ab === ps.absoluteBar); if (i >= 0) { setIsP(true); met.start(tl, i, 0, { accented: settings.accented, pitched: settings.pitched, muted }); } } }} onRestart={() => go(0)} onGoToBar={goToBar} onPrevSec={() => jumpSec(-1)} onNextSec={() => jumpSec(1)} vis={settings.visualMode} isP={isP} muted={muted} onMute={() => setMuted(m => !m)} onExit={exitPlay} mode={mode} onSplit={handleSplit} />}
      {editSec && <SecEd section={editSec} onSave={(u, isDup = false) => { if (isDup) { setSections(p => { const i = p.findIndex(s => s.id === editId); return [...p.slice(0, i + 1), u, ...p.slice(i + 1)]; }); } else { setSections(p => p.map(s => s.id === u.id ? u : s)); } }} onClose={() => setEditId(null)} onDelete={sections.length > 1 ? id => setSections(p => p.filter(s => s.id !== id)) : null} />}
      {showSet && <SetP settings={settings} onChange={setSettings} onClose={() => setShowSet(false)} />}
      {showSave && <SaveM sections={sections} onClose={() => setShowSave(false)} onSaved={() => { }} />}
      {showLib && <LibP onLoad={s => setSections(s)} onClose={() => setShowLib(false)} />}
      {showPrac && <PracSetup sections={sections} onStart={startPractice} onClose={() => setShowPrac(false)} />}
    </div>
  );
}
