import React, { useState, useRef, useEffect, useMemo } from "react";
import { C, BU, pG, sG, pM, mkM, mkT, mkBeatMap } from "./utils";
import { useTapTempo } from "./metronome";

// ============ ICONS ============
const Icon = ({ d, size = 18, fill = "none", strokeWidth = 1.5, viewBox = "0 0 24 24" }) => (
  <svg width={size} height={size} viewBox={viewBox} fill={fill} stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {Array.isArray(d) ? d.map((p, i) => React.isValidElement(p) ? React.cloneElement(p, { key: i }) : <path key={i} d={p} vectorEffect="non-scaling-stroke" />)
      : React.isValidElement(d) ? d : <path d={d} vectorEffect="non-scaling-stroke" />}
  </svg>
);

export const SyncIcon = ({ size = 18 }) => (
  <Icon size={size} d={["M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71", "M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"]} />
);
export const I = {
  play: s => <Icon size={s || 18} d="M5 3l14 9-14 9V3z" fill="none" strokeWidth={1.5} />,
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
  clock: s => <Icon size={s || 18} d={[<circle cx="12" cy="12" r="10" />, <path d="M12 6v6l4 2" />]} />,
  music: s => <Icon size={s || 14} d={["M9 18V5l12-2v13", "M9 18a3 3 0 11-6 0 3 3 0 016 0z", "M21 16a3 3 0 11-6 0 3 3 0 016 0z"]} />,
  gear: s => <Icon size={s || 18} d={[<circle cx="12" cy="12" r="3" />, <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />]} />,
  arrow: s => <Icon size={s || 14} d="M5 12h14m-7-7l7 7-7 7" />,
  restart: s => <Icon size={s || 18} d={["M1 4v6h6", "M3.51 15a9 9 0 102.13-9.36L1 10"]} />,
  save: s => <Icon size={s || 18} d={["M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z", "M17 21v-8H7v8", "M7 3v5h8"]} />,
  folder: s => <Icon size={s || 18} d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />,
  search: s => <Icon size={s || 18} d={["M11 17a6 6 0 100-12 6 6 0 000 12z", "M21 21l-4.35-4.35"]} />,
  rec: s => <Icon size={s || 18} d={[<circle cx="12" cy="12" r="10" />, <circle cx="12" cy="12" r="4" fill="currentColor" stroke="none" />]} />,
  target: s => <Icon size={s || 18} d={["M12 22a10 10 0 100-20 10 10 0 000 20z", "M12 18a6 6 0 100-12 6 6 0 000 12z", "M12 14a2 2 0 100-4 2 2 0 000 4z"]} />,
  loop: s => <Icon size={s || 16} d={["M17 1l4 4-4 4", "M3 11V9a4 4 0 014-4h14", "M7 23l-4-4 4-4", "M21 13v2a4 4 0 01-4 4H3"]} />,
  sync: s => <SyncIcon size={s || 18} />,
  fileNew: s => <Icon size={s || 18} d={["M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z", "M14 2v6h6", "M12 18v-6", "M9 15h6"]} />,
};

// ============ SVG NOTE ============
export function NoteSVG({ type, dotted, size = 24 }) {
  const w = size, h = size * 1.6, hY = h * 0.72, hX = w * 0.38, sT = h * 0.15, sX = hX + 3.8;
  const op = type === "w" || type === "h", hs = type !== "w", uf = type === "e", bm = type === "16" ? 2 : type === "32" ? 3 : 0;
  const np = `M${hX - 4.5},${hY + 1} C${hX - 4.5},${hY + 3.5} ${hX - 1},${hY + 4} ${hX + 1.5},${hY + 2.5} C${hX + 4},${hY + 1} ${hX + 4.5},${hY - 1.5} ${hX + 4.5},${hY - 3.5} C${hX + 4.5},${hY - 6} ${hX + 1},${hY - 6.5} ${hX - 1.5},${hY - 5} C${hX - 4},${hY - 3.5} ${hX - 4.5},${hY - 1} ${hX - 4.5},${hY + 1} Z`;
  return (<svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: "block" }} aria-hidden="true">
    {op ? <path d={np} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" transform={`rotate(-15,${hX},${hY})`} /> : <path d={np} fill="currentColor" stroke="currentColor" strokeWidth={0.5} strokeLinejoin="round" strokeLinecap="round" transform={`rotate(-15,${hX},${hY})`} />}
    {hs && <line x1={sX} y1={hY} x2={sX} y2={sT} stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />}
    {uf && <path d={`M${sX},${sT} C${sX + 4},${sT + 2} ${sX + 7},${sT + 8} ${sX + 5},${sT + 14} C${sX + 5},${sT + 12} ${sX + 3},${sT + 8} ${sX},${sT + 6}`} fill="currentColor" />}
    {bm > 0 && Array.from({ length: bm }).map((_, i) => <line key={i} x1={sX} y1={sT + i * 4} x2={sX + 8} y2={sT + i * 4 + 2} stroke="currentColor" strokeWidth={2} strokeLinecap="round" />)}
    {dotted && <circle cx={hX + 8.5} cy={hY} r={1.5} fill="currentColor" />}
  </svg>);
}

// ============ STYLES ============
export const nI = { width: 62, height: 48, background: C.surface, border: `1px solid ${C.border}`, color: C.text, textAlign: "center", fontSize: 18, borderRadius: 8, fontFamily: "'DM Mono',monospace", outline: "none", margin: "0 6px" };
const sB = { width: 48, height: 48, background: C.surface, border: `1px solid ${C.border}`, color: C.textMuted, cursor: "pointer", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" };
export const oB = on => ({ padding: "8px 16px", borderRadius: 8, border: `1px solid ${on ? C.downbeat : C.border}`, background: on ? C.downbeat + "15" : "transparent", color: on ? C.downbeat : C.textMuted, fontSize: 13, cursor: "pointer", fontFamily: "'Outfit',sans-serif" });

// ============ INPUTS ============
export function NI({ value, onChange, min, max, style = {}, step = 1, validate }) { const [d, setD] = useState(String(value)); const drg = useRef({ on: false, active: false, stY: 0, stV: 0 }); useEffect(() => setD(String(value)), [value]); const cm = v => { const n = typeof v === "number" ? v : parseFloat(d); if (!isNaN(n) && n >= min && n <= max) { if (validate && !validate(n)) { setD(String(value)); return; } onChange(n); setD(String(n)); } else setD(String(value)); }; const pD = e => { drg.current = { on: true, active: false, stY: e.clientY, stV: value }; }; const pM = e => { if (!drg.current.on) return; const dY = drg.current.stY - e.clientY; if (!drg.current.active && Math.abs(dY) < 8) return; if (!drg.current.active) { drg.current.active = true; e.target.setPointerCapture(e.pointerId); } const nv = Math.min(max, Math.max(min, drg.current.stV + Math.round(dY / 5) * step)); setD(String(nv)); }; const pU = e => { if (drg.current.active) { drg.current.on = false; drg.current.active = false; try { e.target.releasePointerCapture(e.pointerId); } catch { } cm(parseFloat(d)); } else { drg.current.on = false; } }; return <input type="text" inputMode="decimal" value={d} onChange={e => setD(e.target.value)} onBlur={() => cm()} onKeyDown={e => { if (e.key === "Enter") { cm(); e.target.blur(); } }} onPointerDown={pD} onPointerMove={pM} onPointerUp={pU} onPointerCancel={pU} style={{ ...nI, cursor: "ns-resize", ...style }} />; }
export function Stp({ value, onChange, min = 1, max = 999 }) { return (<div style={{ display: "flex", alignItems: "center" }}><button onClick={() => onChange(Math.max(min, value - 1))} style={sB}>{I.chevL(16)}</button><NI value={value} onChange={onChange} min={min} max={max} /><button onClick={() => onChange(Math.min(max, value + 1))} style={sB}>{I.chevR(16)}</button></div>); }
export function StpF({ value, onChange, min = 0, max = 999, step = 0.5 }) { return (<div style={{ display: "flex", alignItems: "center" }}><button onClick={() => onChange(Math.max(min, +(value - step).toFixed(1)))} style={sB}>{I.chevL(16)}</button><NI value={value} onChange={onChange} min={min} max={max} step={step} style={{ width: 72 }} /><button onClick={() => onChange(Math.min(max, +(value + step).toFixed(1)))} style={sB}>{I.chevR(16)}</button></div>); }
export function Row({ label, children }) { return (<div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}><span style={{ color: C.textMuted, fontSize: 13, fontFamily: "'Outfit',sans-serif", width: 70, flexShrink: 0, display: "flex", alignItems: "center" }}>{label}</span><div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>{children}</div></div>); }
export function SR({ l, children }) { return (<div style={{ marginBottom: 16 }}><div style={{ fontSize: 12, color: C.textMuted, marginBottom: 8, fontFamily: "'Outfit',sans-serif" }}>{l}</div><div style={{ display: "flex", gap: 8 }}>{children}</div></div>); }

export function TapBtn({ onTap, size = "sm", flash = false }) {
  const isSm = size === "sm";
  return (<button onClick={onTap} style={{ background: flash ? C.downbeat : C.surface, border: `1px solid ${C.border}`, borderRadius: isSm ? 8 : 10, padding: isSm ? "8px 12px" : "10px 16px", cursor: "pointer", color: flash ? "#000" : C.textMuted, fontFamily: "'DM Mono',monospace", fontSize: isSm ? 12 : 14, display: "flex", alignItems: "center", justifyContent: "center", userSelect: "none", transition: "background 0.1s ease, color 0.1s ease" }}>TAP</button>);
}

// ============ BEAT UNIT PICKER ============
export function BUP({ beatUnit, dotted, onSelect }) { const [open, setOpen] = useState(false); const all = BU.flatMap(u => [{ ...u, dotted: false }, { ...u, dotted: true }]); return (<div style={{ position: "relative" }}><button onClick={() => setOpen(!open)} data-tip="Beat Unit" style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 8, padding: "4px 6px", cursor: "pointer", color: C.text, display: "flex", alignItems: "center", justifyContent: "center", minWidth: 38, minHeight: 42 }}><NoteSVG type={beatUnit} dotted={dotted} size={20} /></button>{open && <><div style={{ position: "fixed", inset: 0, zIndex: 200 }} onClick={() => setOpen(false)} /><div style={{ position: "absolute", top: "100%", left: 0, zIndex: 201, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 8, marginTop: 4, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, minWidth: 120 }}>{all.map((u, i) => <button key={i} onClick={() => { onSelect(u.id, u.dotted); setOpen(false); }} style={{ background: u.id === beatUnit && u.dotted === dotted ? C.downbeat + "22" : "transparent", border: u.id === beatUnit && u.dotted === dotted ? `1px solid ${C.downbeat}` : "1px solid transparent", borderRadius: 6, padding: "6px 4px", cursor: "pointer", color: C.text, display: "flex", alignItems: "center", justifyContent: "center" }}><NoteSVG type={u.id} dotted={u.dotted} size={18} /></button>)}</div></>}</div>); }

// ============ SECTION EDITOR ============
export function SecEd({ section, onSave, onClose, onDelete, appMode = "default", isNew = false, editIndex = 0 }) {
  const [s, setS] = useState({ ...section }); const upd = (k, v) => setS(p => ({ ...p, [k]: v })); const isMet = s.type === "metered";
  const { tap: tapTempo, tapFlash: secTapFlash } = useTapTempo(bpm => upd("tempo", bpm));
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

  useEffect(() => {
    const hk = e => { if (e.key === "Enter") { e.preventDefault(); if (gV) { onSave(s); onClose(); } } };
    window.addEventListener("keydown", hk); return () => window.removeEventListener("keydown", hk);
  }, [s, gV, onSave, onClose]);

  return (
    <div className="modal-bg" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div className="modal-content" style={{ width: "100%", maxWidth: 440, background: C.bg, borderTop: `1px solid ${C.border}`, borderRadius: "16px 16px 0 0", padding: "20px 20px 32px", maxHeight: "85vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 16, color: C.text, fontWeight: 600 }}>{isNew ? "New Section" : `Edit Section ${editIndex}`}</div>
          <button className="close-btn" onClick={onClose} data-tip-b="Close">{I.x(18)}</button>
        </div>
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
              <TapBtn onTap={tapTempo} flash={secTapFlash} />
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
          <button onClick={() => { if (gV) { onSave(s); onClose(); } }} style={{ flex: 0, padding: "12px 24px", borderRadius: 8, border: "none", background: gV ? C.downbeat : C.sub, color: gV ? "#000" : C.textMuted, fontSize: 14, fontWeight: 600, cursor: gV ? "pointer" : "default", fontFamily: "'Outfit',sans-serif" }}>{isNew ? "Add" : "Save"}</button>
        </div>
      </div>
    </div>);
}

// ============ SECTION CARD ============
export const SecCard = React.forwardRef(function SecCard({ section: s, index: i, total: t, onClick, onStartHere, onMove, onDelete, onDragStart, onDragEnter, onDragOver, onDragEnd, onDrop, dragIdx, dropIdx, onGripTouchStart, cancelTouchDrag, tDrag, tDropIdx }, ref) {
  const isT = s.type === "timed";
  const isTouch = typeof window !== "undefined" && window.matchMedia?.("(pointer: coarse)")?.matches;
  const [revealed, setRevealed] = useState(false);
  const [showReorder, setShowReorder] = useState(false);
  const [swX, setSwX] = useState(0);
  const swRef = useRef({ startX: 0, swiping: false });
  const isDragged = tDrag && tDrag.idx === i;
  const onTouchStart = e => { if (e.target.closest && e.target.closest("button")) return; if (tDrag) return; swRef.current = { startX: e.touches[0].clientX, swiping: true }; };
  const onTouchMove = e => { if (tDrag) return; if (!swRef.current.swiping) return; const dx = e.touches[0].clientX - swRef.current.startX; if (revealed) { setSwX(Math.min(0, Math.max(-80, dx - 80))); } else { setSwX(Math.min(0, dx)); } };
  const onTouchEnd = () => { if (tDrag) return; if (!swRef.current.swiping) return; swRef.current.swiping = false; if (swX < -40) { setSwX(-80); setRevealed(true); } else { setSwX(0); setRevealed(false); } };
  const handleCardClick = () => { if (tDrag) return; if (revealed) { setSwX(0); setRevealed(false); } else if (showReorder) { setShowReorder(false); } else { onClick(); } };
  const handleDelete = e => { e.stopPropagation(); if (onDelete) onDelete(s.id); };
  // Calculate shift for non-dragged cards during touch drag
  let shiftY = 0;
  if (tDrag && !isDragged && tDropIdx !== null) {
    const from = tDrag.idx, to = tDropIdx;
    const cardH = tDrag.positions?.[tDrag.idx]?.height || 60;
    if (from < to && i > from && i <= to) shiftY = -(cardH + 6);
    else if (from > to && i < from && i >= to) shiftY = cardH + 6;
  }
  return (<div ref={ref} style={{ position: "relative", overflow: isDragged ? "visible" : "hidden", borderRadius: 10 }}>
    {(revealed || swX < 0) && <div onClick={handleDelete} data-tip="Delete" style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 80, background: C.danger, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "0 10px 10px 0", cursor: "pointer", color: "#fff" }}>{I.trash(20)}</div>}
    <div className="sec-card" draggable={!isTouch} onDragStart={!isTouch && onDragStart ? e => onDragStart(e, i) : undefined} onDragEnter={!isTouch && onDragEnter ? e => onDragEnter(e, i) : undefined} onDragOver={!isTouch ? onDragOver : undefined} onDragEnd={!isTouch ? onDragEnd : undefined} onDrop={!isTouch && onDrop ? e => onDrop(e, i) : undefined} onClick={handleCardClick} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd} style={{ background: C.surface, borderRadius: 10, padding: "12px 14px", border: `1px solid ${(tDropIdx === i && tDrag && tDrag.idx !== i) ? C.accent : dropIdx === i ? C.accent : (s.capturedDuration ? C.record + "44" : C.border)}`, cursor: "pointer", display: "flex", alignItems: "center", gap: 12, transform: isDragged ? `translateY(${tDrag.offsetY}px)` : `translateX(${swX}px) translateY(${shiftY}px)`, transition: isDragged ? "box-shadow 0.2s" : (swRef.current.swiping ? "none" : "transform 0.25s ease, border 0.15s"), position: "relative", zIndex: isDragged ? 10 : 1, opacity: dragIdx === i ? 0.5 : 1, boxShadow: isDragged ? "0 8px 30px rgba(0,0,0,0.5)" : undefined }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 24, alignItems: "center" }}>
        {isTouch && !showReorder ? (
          <button onTouchStart={e => { e.stopPropagation(); onGripTouchStart(i, e); }} onTouchEnd={e => { e.stopPropagation(); if (!tDrag) cancelTouchDrag(); }} onTouchMove={e => { if (!tDrag) cancelTouchDrag(); }} onClick={e => { e.stopPropagation(); if (!tDrag) setShowReorder(true); }} style={{ background: "none", border: "none", color: C.textMuted, cursor: "pointer", padding: 4, display: "flex", flexDirection: "column", gap: 1, touchAction: "none" }}>
            <span style={{ fontSize: 14, lineHeight: 1, letterSpacing: 2 }}>☰</span>
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: C.textMuted, lineHeight: 1 }}>{i + 1}</span>
          </button>
        ) : (
          <>
            <button disabled={i === 0} onClick={e => { e.stopPropagation(); onMove(-1); }} data-tip-b="Up" style={{ background: "none", border: "none", color: i === 0 ? C.border : C.textMuted, cursor: i === 0 ? "default" : "pointer", padding: 2, display: "flex" }}>{I.arrowUp(14)}</button>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: C.textMuted, textAlign: "center", lineHeight: 1 }}>{i + 1}</div>
            <button disabled={i === t - 1} onClick={e => { e.stopPropagation(); onMove(1); }} data-tip-b="Down" style={{ background: "none", border: "none", color: i === t - 1 ? C.border : C.textMuted, cursor: i === t - 1 ? "default" : "pointer", padding: 2, display: "flex" }}>{I.arrowDown(14)}</button>
          </>
        )}
      </div>
      {isT ? (<>{I.clock(16)}<div style={{ flex: 1, fontFamily: "'DM Mono',monospace", fontSize: 15, color: C.text }}>{s.duration}s</div><div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: C.textMuted }}>{pM(s.markers).length} cue{pM(s.markers).length !== 1 ? "s" : ""}</div></>) : (<>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 18, fontWeight: 700, color: C.text, lineHeight: 1, textAlign: "center", minWidth: 30, display: "flex", flexDirection: "column", alignItems: "center" }}><span>{s.tsNum}</span><div style={{ height: 1, width: "100%", background: C.textMuted, margin: "1px 0" }} /><span>{s.tsDen}</span><div style={{ fontSize: 9, color: C.textMuted, fontWeight: 400, marginTop: 3 }}>{s.grouping}</div></div>
        <div style={{ display: "flex", alignItems: "center", gap: 3, color: C.text, flex: 1 }}><NoteSVG type={s.beatUnit} dotted={s.dotted} size={16} /><span style={{ fontFamily: "'DM Mono',monospace", fontSize: 13, color: C.textMuted }}>=</span><span style={{ fontFamily: "'DM Mono',monospace", fontSize: 15 }}>{s.tempo}</span>{s.curve !== "constant" && <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: C.accent, marginLeft: 4 }}>{s.curve === "accel" ? "→" : "←"}{s.endTempo}</span>}</div>
        <div style={{ textAlign: "right" }}><div style={{ fontFamily: "'DM Mono',monospace", fontSize: 14, color: s.loop ? C.downbeat : C.text }}>{s.loop ? "∞" : `${s.bars} bar${s.bars !== 1 ? "s" : ""}`}</div></div>
      </>)}
      <button onClick={e => { e.stopPropagation(); onStartHere(); }} data-tip-b="Play here" style={{ background: "none", border: "none", color: C.textMuted, cursor: "pointer", padding: 4, display: "flex" }}>{I.play(14)}</button>
    </div></div>);
});
