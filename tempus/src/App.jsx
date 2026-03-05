import { useState, useRef, useEffect, useCallback, useMemo } from "react";

// ============ INLINE ICONS ============
const Icon = ({ d, size = 18, fill = "none", strokeWidth = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
);

const Icons = {
  play: (s = 18) => <Icon size={s} d="M5 3l14 9-14 9V3z" fill="currentColor" stroke="none" />,
  pause: (s = 18) => <Icon size={s} d={["M6 4h4v16H6z", "M14 4h4v16H14z"]} fill="currentColor" stroke="none" />,
  stop: (s = 16) => <Icon size={s} d="M4 4h16v16H4z" fill="currentColor" stroke="none" />,
  chevLeft: (s = 18) => <Icon size={s} d="M15 18l-6-6 6-6" />,
  chevRight: (s = 18) => <Icon size={s} d="M9 18l6-6-6-6" />,
  plus: (s = 20) => <Icon size={s} d={["M12 5v14", "M5 12h14"]} />,
  trash: (s = 16) => <Icon size={s} d={["M3 6h18", "M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2", "M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"]} />,
  x: (s = 18) => <Icon size={s} d={["M18 6L6 18", "M6 6l12 12"]} />,
  volOn: (s = 18) => <Icon size={s} d={["M11 5L6 9H2v6h4l5 4V5z", "M19.07 4.93a10 10 0 010 14.14", "M15.54 8.46a5 5 0 010 7.07"]} />,
  volOff: (s = 18) => <Icon size={s} d={["M11 5L6 9H2v6h4l5 4V5z", "M23 9l-6 6", "M17 9l6 6"]} />,
  clock: (s = 18) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
    </svg>
  ),
  music: (s = 14) => <Icon size={s} d={["M9 18V5l12-2v13", "M9 18a3 3 0 11-6 0 3 3 0 016 0z", "M21 16a3 3 0 11-6 0 3 3 0 016 0z"]} />,
  gear: (s = 18) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  ),
  arrow: (s = 14) => <Icon size={s} d="M5 12h14m-7-7l7 7-7 7" />,
};

// ============ CONSTANTS ============
const BEAT_UNITS = [
  { id: "w", quarters: 4 }, { id: "h", quarters: 2 }, { id: "q", quarters: 1 },
  { id: "e", quarters: 0.5 }, { id: "16", quarters: 0.25 },
  { id: "32", quarters: 0.125 }, { id: "64", quarters: 0.0625 },
];
const DEN_TO_QUARTERS = { 1: 4, 2: 2, 4: 1, 8: 0.5, 16: 0.25, 32: 0.125, 64: 0.0625 };

const C = {
  bg: "#07070a", surface: "#111116", surfaceHover: "#1a1a22",
  border: "#25252e", text: "#eeeef0", textMuted: "#6e6e7a",
  downbeat: "#f0a030", accent: "#8b7cf6", sub: "#3a3a45", danger: "#ef4444",
};

const mkMetered = () => ({
  id: Date.now() + Math.random(), type: "metered",
  tsNum: 4, tsDen: 4, beatUnit: "q", dotted: false,
  tempo: 120, bars: 4, grouping: "1+1+1+1",
  curve: "constant", endTempo: 120,
});

const mkTimed = () => ({
  id: Date.now() + Math.random(), type: "timed", duration: 10, markers: "",
});

// ============ SVG NOTE ============
function NoteSVG({ type, dotted, size = 24 }) {
  const w = size, h = size * 1.6;
  const headY = h * 0.72, headX = w * 0.38;
  const stemTop = h * 0.15, stemX = headX + 2.8;
  const isOpen = type === "w" || type === "h";
  const hasStem = type !== "w";
  const flags = type === "e" ? 1 : type === "16" ? 2 : type === "32" ? 3 : type === "64" ? 4 : 0;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: "block" }}>
      {isOpen ? (
        <ellipse cx={headX} cy={headY} rx={3.2} ry={2.4} fill="none" stroke="currentColor" strokeWidth={1.2} transform={`rotate(-20,${headX},${headY})`} />
      ) : (
        <ellipse cx={headX} cy={headY} rx={3.2} ry={2.4} fill="currentColor" transform={`rotate(-20,${headX},${headY})`} />
      )}
      {hasStem && <line x1={stemX} y1={headY - 1.5} x2={stemX} y2={stemTop} stroke="currentColor" strokeWidth={1.2} />}
      {flags > 0 && Array.from({ length: flags }).map((_, i) => (
        <path key={i} d={`M${stemX},${stemTop + i * 5} Q${stemX + 6},${stemTop + i * 5 + 3} ${stemX + 4},${stemTop + i * 5 + 8}`}
          fill="none" stroke="currentColor" strokeWidth={1.2} />
      ))}
      {dotted && <circle cx={headX + 6.5} cy={headY} r={1.2} fill="currentColor" />}
    </svg>
  );
}

// ============ UTILITIES ============
function getClickDur(tempo, beatUnit, dotted, tsDen) {
  const bu = BEAT_UNITS.find(b => b.id === beatUnit);
  let buQ = bu.quarters;
  if (dotted) buQ *= 1.5;
  return (60 / tempo) * ((DEN_TO_QUARTERS[tsDen] || 1) / buQ);
}
function parseGrouping(str) {
  if (!str || !str.trim()) return [1];
  return str.split("+").map(s => parseInt(s.trim())).filter(n => !isNaN(n) && n > 0);
}
function suggestGrouping(num, den) {
  if (den >= 8 && num % 3 === 0 && num > 3) return Array(num / 3).fill(3).join("+");
  return Array(num).fill(1).join("+");
}
function getBeatTypes(grouping) {
  const t = [];
  grouping.forEach((g, gi) => { for (let i = 0; i < g; i++) { t.push(gi === 0 && i === 0 ? 0 : i === 0 ? 1 : 2); } });
  return t;
}
function parseMarkers(str) {
  if (!str || !str.trim()) return [];
  return str.split(",").map(s => parseFloat(s.trim())).filter(n => !isNaN(n) && n >= 0).sort((a, b) => a - b);
}

function buildTimeline(sections) {
  const bars = [];
  let absTime = 0, absBar = 1;
  sections.forEach((sec, si) => {
    if (sec.type === "timed") {
      bars.push({
        sectionIndex: si, barInSection: 1, absoluteBar: absBar, startTime: absTime,
        duration: sec.duration, clickDur: sec.duration, tempo: 0, tsNum: 0, tsDen: 0,
        beatTypes: [0], clicksPerBar: 1, isTimed: true, timedDuration: sec.duration,
        markers: parseMarkers(sec.markers),
      });
      absTime += sec.duration; absBar++; return;
    }
    const grouping = parseGrouping(sec.grouping);
    const cpb = sec.tsNum;
    for (let b = 0; b < sec.bars; b++) {
      let tempo = sec.tempo;
      if (sec.curve !== "constant") {
        const t = sec.bars > 1 ? b / (sec.bars - 1) : 0;
        tempo = sec.tempo + (sec.endTempo - sec.tempo) * t;
      }
      const cd = getClickDur(tempo, sec.beatUnit, sec.dotted, sec.tsDen);
      bars.push({
        sectionIndex: si, barInSection: b + 1, absoluteBar: absBar, startTime: absTime,
        duration: cpb * cd, clickDur: cd, tempo, tsNum: sec.tsNum, tsDen: sec.tsDen,
        beatTypes: getBeatTypes(grouping), clicksPerBar: cpb, isTimed: false,
      });
      absTime += cpb * cd; absBar++;
    }
  });
  return bars;
}

// ============ AUDIO ENGINE ============
function useMetronome() {
  const audioCtx = useRef(null);
  const timerRef = useRef(null);
  const nextBeat = useRef(0);
  const barIdx = useRef(0);
  const beatIdx = useRef(0);
  const playing = useRef(false);
  const tlRef = useRef([]);
  const cbRef = useRef(null);
  const sRef = useRef({ accented: true, pitched: true, muted: false });
  const ciLeft = useRef(0);
  const wlRef = useRef(null);
  const saRef = useRef(null);
  const tsStart = useRef(0);
  const tsMIdx = useRef(0);

  const init = useCallback(() => {
    if (!audioCtx.current) audioCtx.current = new (window.AudioContext || window.webkitAudioContext)();
    return audioCtx.current;
  }, []);

  const reqWL = useCallback(async () => {
    try { if ("wakeLock" in navigator) wlRef.current = await navigator.wakeLock.request("screen"); } catch (e) {}
    if (!saRef.current) {
      const a = document.createElement("audio");
      a.setAttribute("loop", "true"); a.setAttribute("playsinline", "true");
      a.src = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=";
      saRef.current = a;
    }
    try { await saRef.current.play(); } catch (e) {}
  }, []);

  const relWL = useCallback(() => {
    if (wlRef.current) { wlRef.current.release().catch(() => {}); wlRef.current = null; }
    if (saRef.current) saRef.current.pause();
  }, []);

  const prime = useCallback(async () => {
    const ctx = init();
    if (ctx.state === "suspended") await ctx.resume();
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.05, ctx.sampleRate);
    const src = ctx.createBufferSource();
    src.buffer = buf; src.connect(ctx.destination); src.start();
    await new Promise(r => setTimeout(r, 200));
    return ctx;
  }, [init]);

  const click = useCallback((ctx, time, bt) => {
    const { accented, pitched, muted } = sRef.current;
    if (muted) return;
    const eff = accented ? bt : 2;
    if (pitched) {
      const freq = eff === 0 ? 1000 : eff === 1 ? 750 : 500;
      const vol = eff === 0 ? 0.8 : eff === 1 ? 0.5 : 0.25;
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type = "sine"; o.frequency.value = freq;
      g.gain.setValueAtTime(vol, time); g.gain.exponentialRampToValueAtTime(0.001, time + 0.06);
      o.connect(g); g.connect(ctx.destination); o.start(time); o.stop(time + 0.08);
    } else {
      const len = Math.floor(ctx.sampleRate * 0.015);
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      const vol = eff === 0 ? 0.7 : eff === 1 ? 0.4 : 0.2;
      const src = ctx.createBufferSource(); const g = ctx.createGain();
      src.buffer = buf; g.gain.setValueAtTime(vol, time);
      g.gain.exponentialRampToValueAtTime(0.001, time + 0.04);
      const f = ctx.createBiquadFilter(); f.type = "bandpass";
      f.frequency.value = eff === 0 ? 4000 : eff === 1 ? 3000 : 2000; f.Q.value = 1.5;
      src.connect(f); f.connect(g); g.connect(ctx.destination);
      src.start(time); src.stop(time + 0.05);
    }
  }, []);

  const sched = useCallback(() => {
    const ctx = audioCtx.current;
    if (!ctx || !playing.current) return;
    const tl = tlRef.current;
    while (nextBeat.current < ctx.currentTime + 0.12) {
      if (ciLeft.current > 0) {
        const bar = tl[barIdx.current];
        if (!bar || bar.isTimed) { ciLeft.current = 0; continue; }
        const bt = ciLeft.current % bar.clicksPerBar === 0 ? 0 : 2;
        click(ctx, nextBeat.current, bt);
        if (cbRef.current) cbRef.current({
          type: "countIn", beatsLeft: ciLeft.current,
          beatInBar: bar.clicksPerBar - ((ciLeft.current - 1) % bar.clicksPerBar),
          totalBeats: bar.clicksPerBar,
        });
        nextBeat.current += bar.clickDur; ciLeft.current--; continue;
      }
      const bar = tl[barIdx.current];
      if (!bar) { stop(); return; }
      if (bar.isTimed) {
        if (tsStart.current === 0) tsStart.current = nextBeat.current;
        const el = nextBeat.current - tsStart.current;
        if (bar.markers && tsMIdx.current < bar.markers.length) {
          if (el >= bar.markers[tsMIdx.current] - 0.02) {
            click(ctx, nextBeat.current, 0);
            if (cbRef.current) cbRef.current({
              type: "timedMarker", absoluteBar: bar.absoluteBar, sectionIndex: bar.sectionIndex,
              elapsed: el, duration: bar.timedDuration, markerTime: bar.markers[tsMIdx.current],
              markerIdx: tsMIdx.current, totalMarkers: bar.markers.length,
            });
            tsMIdx.current++;
          }
        }
        if (cbRef.current) cbRef.current({
          type: "timedTick", absoluteBar: bar.absoluteBar, sectionIndex: bar.sectionIndex,
          elapsed: el, remaining: Math.max(0, bar.timedDuration - el), duration: bar.timedDuration,
        });
        if (el >= bar.timedDuration) { tsStart.current = 0; tsMIdx.current = 0; barIdx.current++; continue; }
        nextBeat.current += 0.05; return;
      }
      const bt = bar.beatTypes[beatIdx.current] || 2;
      click(ctx, nextBeat.current, bt);
      if (cbRef.current) cbRef.current({
        type: "beat", barIndex: barIdx.current, beatIndex: beatIdx.current, beatType: bt,
        absoluteBar: bar.absoluteBar, tsNum: bar.tsNum, tsDen: bar.tsDen,
        tempo: bar.tempo, sectionIndex: bar.sectionIndex,
      });
      nextBeat.current += bar.clickDur; beatIdx.current++;
      if (beatIdx.current >= bar.clicksPerBar) { beatIdx.current = 0; barIdx.current++; }
    }
  }, [click]);

  const stop = useCallback(() => {
    playing.current = false;
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    tsStart.current = 0; tsMIdx.current = 0; relWL();
  }, [relWL]);

  const start = useCallback(async (timeline, from = 0, ci = 0, settings = {}) => {
    stop();
    sRef.current = { accented: true, pitched: true, muted: false, ...settings };
    tlRef.current = timeline; barIdx.current = from; beatIdx.current = 0;
    tsStart.current = 0; tsMIdx.current = 0;
    const ctx = await prime(); await reqWL();
    const bar = timeline[from]; if (!bar) return;
    ciLeft.current = bar.isTimed ? 0 : ci * bar.clicksPerBar;
    playing.current = true; nextBeat.current = ctx.currentTime + 0.05;
    timerRef.current = setInterval(sched, 20);
  }, [stop, prime, reqWL, sched]);

  const updS = useCallback(s => { sRef.current = { ...sRef.current, ...s }; }, []);
  const setCb = useCallback(cb => { cbRef.current = cb; }, []);
  useEffect(() => () => { stop(); if (audioCtx.current) audioCtx.current.close().catch(() => {}); }, [stop]);
  return { start, stop, setCb, playing, updS };
}

// ============ SHARED STYLES ============
const numIn = {
  width: 56, height: 36, background: C.surface, border: `1px solid ${C.border}`,
  color: C.text, textAlign: "center", fontSize: 16, borderRadius: 4,
  fontFamily: "'DM Mono', monospace", outline: "none", margin: "0 2px",
};
const stepBtn = {
  width: 32, height: 28, background: C.surface, border: `1px solid ${C.border}`,
  color: C.textMuted, cursor: "pointer", borderRadius: 4,
  display: "flex", alignItems: "center", justifyContent: "center",
};
const sBtn = (on) => ({
  padding: "8px 16px", borderRadius: 8, border: `1px solid ${on ? C.downbeat : C.border}`,
  background: on ? C.downbeat + "15" : "transparent",
  color: on ? C.downbeat : C.textMuted, fontSize: 13, cursor: "pointer", fontFamily: "'Outfit', sans-serif",
});

// ============ STEPPER ============
function Stepper({ value, onChange, min = 1, max = 999 }) {
  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      <button onClick={() => onChange(Math.max(min, value - 1))} style={stepBtn}>{Icons.chevLeft(12)}</button>
      <input type="number" value={value}
        onChange={e => { const v = parseInt(e.target.value); if (!isNaN(v)) onChange(Math.min(max, Math.max(min, v))); }}
        style={numIn} />
      <button onClick={() => onChange(Math.min(max, value + 1))} style={stepBtn}>{Icons.chevRight(12)}</button>
    </div>
  );
}
function StepperF({ value, onChange, min = 0, max = 999, step = 0.5 }) {
  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      <button onClick={() => onChange(Math.max(min, +(value - step).toFixed(1)))} style={stepBtn}>{Icons.chevLeft(12)}</button>
      <input type="number" value={value}
        onChange={e => { const v = parseFloat(e.target.value); if (!isNaN(v)) onChange(Math.min(max, Math.max(min, +v.toFixed(1)))); }}
        style={{ ...numIn, width: 64 }} />
      <button onClick={() => onChange(Math.min(max, +(value + step).toFixed(1)))} style={stepBtn}>{Icons.chevRight(12)}</button>
    </div>
  );
}

function Row({ label, children }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
      <span style={{ color: C.textMuted, fontSize: 13, fontFamily: "'Outfit', sans-serif", width: 70, flexShrink: 0, display: "flex", alignItems: "center" }}>{label}</span>
      {children}
    </div>
  );
}

// ============ SECTION EDITOR ============
function SectionEditor({ section, onSave, onClose, onDelete }) {
  const [s, setS] = useState({ ...section });
  const upd = (k, v) => setS(p => ({ ...p, [k]: v }));
  const isMet = s.type === "metered";

  useEffect(() => {
    if (!isMet) return;
    const sum = parseGrouping(s.grouping).reduce((a, b) => a + b, 0);
    if (sum !== s.tsNum) upd("grouping", suggestGrouping(s.tsNum, s.tsDen));
  }, [s.tsNum, s.tsDen]);

  const gValid = useMemo(() => {
    if (!isMet) return true;
    return parseGrouping(s.grouping).reduce((a, b) => a + b, 0) === s.tsNum;
  }, [s.grouping, s.tsNum, isMet]);

  const switchType = (t) => {
    if (t === s.type) return;
    setS(p => (t === "timed" ? { ...mkTimed(), id: p.id } : { ...mkMetered(), id: p.id }));
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 100,
      display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={onClose}>
      <div style={{
        width: "100%", maxWidth: 440, background: C.bg, borderTop: `1px solid ${C.border}`,
        borderRadius: "16px 16px 0 0", padding: "20px 20px 32px", maxHeight: "85vh", overflowY: "auto",
      }} onClick={e => e.stopPropagation()}>

        <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
          <button onClick={() => switchType("metered")} style={{
            ...sBtn(isMet), display: "flex", alignItems: "center", gap: 6, flex: 1, justifyContent: "center",
          }}>{Icons.music(14)} Metered</button>
          <button onClick={() => switchType("timed")} style={{
            ...sBtn(!isMet), display: "flex", alignItems: "center", gap: 6, flex: 1, justifyContent: "center",
          }}>{Icons.clock(14)} Timed</button>
        </div>

        {isMet ? (<>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 18 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
              <input type="number" value={s.tsNum}
                onChange={e => { const v = parseInt(e.target.value); if (v > 0 && v <= 32) upd("tsNum", v); }}
                style={{ ...numIn, width: 48, height: 42, fontSize: 22, fontWeight: 700 }} />
              <div style={{ height: 1, width: 36, background: C.textMuted }} />
              <input type="number" value={s.tsDen}
                onChange={e => { const v = parseInt(e.target.value); if ([1,2,4,8,16,32,64].includes(v)) upd("tsDen", v); }}
                style={{ ...numIn, width: 48, height: 42, fontSize: 22, fontWeight: 700 }} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1, justifyContent: "center" }}>
              <button onClick={() => {
                const units = BEAT_UNITS.flatMap(u => [{ ...u, dotted: false }, { ...u, dotted: true }]);
                const idx = units.findIndex(u => u.id === s.beatUnit && u.dotted === s.dotted);
                const next = units[(idx + 1) % units.length];
                setS(p => ({ ...p, beatUnit: next.id, dotted: next.dotted }));
              }} style={{
                background: "none", border: `1px solid ${C.border}`, borderRadius: 8,
                padding: "4px 6px", cursor: "pointer", color: C.text, display: "flex",
                alignItems: "center", justifyContent: "center", minWidth: 38, minHeight: 42,
              }}>
                <NoteSVG type={s.beatUnit} dotted={s.dotted} size={20} />
              </button>
              <span style={{ color: C.textMuted, fontSize: 20, fontFamily: "'DM Mono', monospace" }}>=</span>
              <Stepper value={s.tempo} onChange={v => upd("tempo", v)} min={10} max={400} />
            </div>
          </div>
          <Row label="Bars"><Stepper value={s.bars} onChange={v => upd("bars", v)} min={1} max={999} /></Row>
          <Row label="Grouping">
            <input value={s.grouping} onChange={e => upd("grouping", e.target.value)}
              style={{ ...numIn, width: 120, textAlign: "left", padding: "0 8px", fontSize: 14,
                borderColor: gValid ? C.border : C.danger }} placeholder="e.g. 2+3" />
            {!gValid && <span style={{ color: C.danger, fontSize: 11 }}>≠ {s.tsNum}</span>}
          </Row>
          <Row label="Curve">
            {["constant", "accel", "rit"].map(c => (
              <button key={c} onClick={() => upd("curve", c)} style={{
                padding: "6px 12px", borderRadius: 6, border: `1px solid ${s.curve === c ? C.downbeat : C.border}`,
                background: s.curve === c ? C.downbeat + "22" : "transparent",
                color: s.curve === c ? C.downbeat : C.textMuted,
                fontSize: 12, fontFamily: "'Outfit', sans-serif", cursor: "pointer",
              }}>{c === "constant" ? "—" : c === "accel" ? "accel." : "rit."}</button>
            ))}
          </Row>
          {s.curve !== "constant" && (
            <Row label={Icons.arrow(14)}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ color: C.text, display: "flex", alignItems: "center", minWidth: 30 }}>
                  <NoteSVG type={s.beatUnit} dotted={s.dotted} size={16} />
                </div>
                <span style={{ color: C.textMuted, fontSize: 16, fontFamily: "'DM Mono', monospace" }}>=</span>
                <Stepper value={s.endTempo} onChange={v => upd("endTempo", v)} min={10} max={400} />
              </div>
            </Row>
          )}
        </>) : (<>
          <Row label="Duration">
            <StepperF value={s.duration} onChange={v => upd("duration", v)} min={0.5} max={600} />
            <span style={{ color: C.textMuted, fontSize: 13, fontFamily: "'DM Mono', monospace", marginLeft: 4 }}>s</span>
          </Row>
          <Row label="Markers">
            <input value={s.markers} onChange={e => upd("markers", e.target.value)}
              style={{ ...numIn, width: 160, textAlign: "left", padding: "0 8px", fontSize: 13 }}
              placeholder="e.g. 3, 7.5, 12" />
          </Row>
          <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 14, marginLeft: 82, fontFamily: "'DM Mono', monospace" }}>
            {parseMarkers(s.markers).length} cue{parseMarkers(s.markers).length !== 1 ? "s" : ""}
          </div>
        </>)}

        <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
          {onDelete && (
            <button onClick={() => { onDelete(s.id); onClose(); }}
              style={{ flex: 0, padding: "10px 16px", borderRadius: 8, border: `1px solid ${C.danger}33`,
                background: `${C.danger}11`, color: C.danger, cursor: "pointer", display: "flex", alignItems: "center" }}>
              {Icons.trash(16)}
            </button>
          )}
          <button onClick={onClose} style={{
            flex: 1, padding: "12px", borderRadius: 8, border: `1px solid ${C.border}`,
            background: "transparent", color: C.textMuted, fontSize: 14, cursor: "pointer", fontFamily: "'Outfit', sans-serif",
          }}>Cancel</button>
          <button onClick={() => { if (gValid) { onSave(s); onClose(); } }} style={{
            flex: 1, padding: "12px", borderRadius: 8, border: "none",
            background: gValid ? C.downbeat : C.sub, color: gValid ? "#000" : C.textMuted,
            fontSize: 14, fontWeight: 600, cursor: gValid ? "pointer" : "default", fontFamily: "'Outfit', sans-serif",
          }}>Save</button>
        </div>
      </div>
    </div>
  );
}

// ============ SECTION CARD ============
function SectionCard({ section, index, onClick, onStartHere }) {
  const isTimed = section.type === "timed";
  return (
    <div onClick={onClick} style={{
      background: C.surface, borderRadius: 10, padding: "12px 14px",
      border: `1px solid ${C.border}`, cursor: "pointer",
      display: "flex", alignItems: "center", gap: 12, transition: "background 0.15s",
    }}
    onMouseEnter={e => e.currentTarget.style.background = C.surfaceHover}
    onMouseLeave={e => e.currentTarget.style.background = C.surface}>
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: C.textMuted, minWidth: 18, textAlign: "center" }}>{index + 1}</div>
      {isTimed ? (<>
        {Icons.clock(16)}
        <div style={{ flex: 1, fontFamily: "'DM Mono', monospace", fontSize: 15, color: C.text }}>{section.duration}s</div>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: C.textMuted }}>
          {parseMarkers(section.markers).length} cue{parseMarkers(section.markers).length !== 1 ? "s" : ""}
        </div>
      </>) : (<>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 18, fontWeight: 700, color: C.text,
          lineHeight: 1, textAlign: "center", minWidth: 30, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <span>{section.tsNum}</span>
          <div style={{ height: 1, width: "100%", background: C.textMuted, margin: "1px 0" }} />
          <span>{section.tsDen}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 3, color: C.text, flex: 1 }}>
          <NoteSVG type={section.beatUnit} dotted={section.dotted} size={16} />
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: C.textMuted }}>=</span>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 15 }}>{section.tempo}</span>
          {section.curve !== "constant" && (
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: C.accent, marginLeft: 4 }}>
              {section.curve === "accel" ? "→" : "←"}{section.endTempo}
            </span>
          )}
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, color: C.text }}>{section.bars} bar{section.bars !== 1 ? "s" : ""}</div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: C.textMuted }}>{section.grouping}</div>
        </div>
      </>)}
      <button onClick={e => { e.stopPropagation(); onStartHere(); }}
        style={{ background: "none", border: "none", color: C.textMuted, cursor: "pointer", padding: 4, display: "flex" }}>
        {Icons.play(14)}
      </button>
    </div>
  );
}

// ============ PLAY VIEW ============
function PlayView({ playState, sections, onStop, onPause, onResume, onGoToBar, onPrevSec, onNextSec, vis, isPlaying, muted, onMute }) {
  const { absoluteBar, beatIndex, beatType, tsNum, tsDen, sectionIndex, flash, isTimed, countIn: isCI } = playState;
  const fc = beatType === 0 ? C.downbeat : beatType === 1 ? C.accent : C.text;
  const fo = flash ? (beatType === 0 ? 0.35 : beatType === 1 ? 0.2 : 0.08) : 0;
  const [goBar, setGoBar] = useState("");
  const showF = vis === "flash" || vis === "dots+flash";
  const showD = vis === "dots" || vis === "dots+flash";

  return (
    <div style={{ position: "fixed", inset: 0, background: C.bg, zIndex: 50,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      fontFamily: "'DM Mono', monospace" }}>
      {showF && flash && <div style={{ position: "absolute", inset: 0, background: fc, opacity: fo, transition: "opacity 0.05s", pointerEvents: "none" }} />}

      <div style={{ fontSize: 20, color: C.textMuted, fontWeight: 700, display: "flex", flexDirection: "column", alignItems: "center", lineHeight: 1.1, position: "relative", zIndex: 1, marginBottom: 8 }}>
        {isCI ? "Count-in" : isTimed ? (
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>{Icons.clock(18)} FREE</span>
        ) : (<>
          <span>{tsNum}</span>
          <div style={{ height: 1, width: 30, background: C.textMuted, margin: "2px 0" }} />
          <span>{tsDen}</span>
        </>)}
      </div>

      <div style={{ fontFamily: "'Bebas Neue', 'DM Mono', monospace", fontSize: 120, fontWeight: 400,
        color: C.text, lineHeight: 1, position: "relative", zIndex: 1, letterSpacing: 2 }}>
        {isCI ? "—" : isTimed ? (playState.remaining != null ? playState.remaining.toFixed(1) : "—") : absoluteBar}
      </div>

      {!isCI && <div style={{ fontSize: 12, color: C.textMuted, marginTop: 4, position: "relative", zIndex: 1 }}>
        {sectionIndex + 1}/{sections.length}{!isTimed && playState.tempo ? ` · ${Math.round(playState.tempo)}` : ""}
      </div>}

      {showD && !isTimed && !isCI && (
        <div style={{ display: "flex", gap: 8, marginTop: 24, position: "relative", zIndex: 1, flexWrap: "wrap", justifyContent: "center", maxWidth: 280, padding: "0 16px" }}>
          {(playState.allBeatTypes || []).map((bt, i) => {
            const on = i === beatIndex;
            const c = bt === 0 ? C.downbeat : bt === 1 ? C.accent : C.sub;
            return <div key={i} style={{ width: on ? 16 : 10, height: on ? 16 : 10, borderRadius: "50%",
              background: on ? c : `${c}55`, transition: "all 0.06s",
              border: on ? `2px solid ${c}` : "2px solid transparent" }} />;
          })}
        </div>
      )}

      {showD && isTimed && playState.totalMarkers > 0 && (
        <div style={{ display: "flex", gap: 8, marginTop: 24, position: "relative", zIndex: 1, flexWrap: "wrap", justifyContent: "center", maxWidth: 280 }}>
          {Array.from({ length: playState.totalMarkers }).map((_, i) => {
            const on = i === playState.markerIdx;
            const past = i < (playState.markerIdx || 0);
            return <div key={i} style={{ width: on ? 16 : 10, height: on ? 16 : 10, borderRadius: "50%",
              background: on ? C.downbeat : past ? `${C.downbeat}88` : `${C.sub}55`,
              transition: "all 0.06s", border: on ? `2px solid ${C.downbeat}` : "2px solid transparent" }} />;
          })}
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 36, position: "relative", zIndex: 1 }}>
        <button onClick={onPrevSec} style={navBtn}>{Icons.chevLeft(18)}</button>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <input type="number" value={goBar} onChange={e => setGoBar(e.target.value)} placeholder="Bar"
            style={{ ...numIn, width: 64, fontSize: 14 }}
            onKeyDown={e => { if (e.key === "Enter") { const v = parseInt(goBar); if (!isNaN(v) && v > 0) { onGoToBar(v); setGoBar(""); } } }} />
          <button onClick={() => { const v = parseInt(goBar); if (!isNaN(v) && v > 0) { onGoToBar(v); setGoBar(""); } }}
            style={{ ...navBtn, fontSize: 12, padding: "8px 10px" }}>GO</button>
        </div>
        <button onClick={onNextSec} style={navBtn}>{Icons.chevRight(18)}</button>
      </div>

      <div style={{ display: "flex", gap: 12, marginTop: 24, position: "relative", zIndex: 1, alignItems: "center" }}>
        <button onClick={onMute} style={tBtnS}>{muted ? Icons.volOff(18) : Icons.volOn(18)}</button>
        <button onClick={isPlaying ? onPause : onResume} style={tBtn}>
          {isPlaying ? Icons.pause(22) : Icons.play(22)}
        </button>
        <button onClick={onStop} style={tBtnS}>{Icons.stop(16)}</button>
      </div>
    </div>
  );
}

const navBtn = {
  padding: "8px 14px", borderRadius: 8, border: `1px solid ${C.border}`,
  background: C.surface, color: C.text, cursor: "pointer",
  fontFamily: "'DM Mono', monospace", display: "flex", alignItems: "center", justifyContent: "center",
};
const tBtn = {
  width: 56, height: 56, borderRadius: "50%", border: "none",
  background: C.downbeat, color: "#000", cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center",
  boxShadow: `0 0 24px ${C.downbeat}33`,
};
const tBtnS = {
  width: 44, height: 44, borderRadius: 10, border: `1px solid ${C.border}`,
  background: C.surface, color: C.text, cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center",
};

// ============ SETTINGS ============
function SettingsPanel({ settings, onChange, onClose }) {
  const upd = (k, v) => onChange({ ...settings, [k]: v });
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 100,
      display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={onClose}>
      <div style={{ width: "100%", maxWidth: 440, background: C.bg, borderTop: `1px solid ${C.border}`,
        borderRadius: "16px 16px 0 0", padding: "20px 20px 32px" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 16, color: C.text, fontWeight: 600 }}>Settings</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.textMuted, cursor: "pointer", display: "flex" }}>{Icons.x(18)}</button>
        </div>
        <SRow label="Click">
          {["accented", "flat"].map(v => <button key={v} onClick={() => upd("accented", v === "accented")} style={sBtn(settings.accented === (v === "accented"))}>{v === "accented" ? "Accented" : "Flat"}</button>)}
        </SRow>
        <SRow label="Sound">
          {["pitched", "unpitched"].map(v => <button key={v} onClick={() => upd("pitched", v === "pitched")} style={sBtn(settings.pitched === (v === "pitched"))}>{v === "pitched" ? "Pitched" : "Unpitched"}</button>)}
        </SRow>
        <SRow label="Visual">
          {[["dots","●"],["dots+flash","● ◻"],["flash","◻"]].map(([v,l]) => <button key={v} onClick={() => upd("visualMode", v)} style={{...sBtn(settings.visualMode===v),fontSize:11}}>{l}</button>)}
        </SRow>
        <SRow label="Count-in">
          {[0,1,2].map(v => <button key={v} onClick={() => upd("countIn", v)} style={sBtn(settings.countIn === v)}>{v === 0 ? "Off" : `${v} bar${v>1?"s":""}`}</button>)}
        </SRow>
      </div>
    </div>
  );
}
function SRow({ label, children }) {
  return (<div style={{ marginBottom: 16 }}>
    <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 8, fontFamily: "'Outfit', sans-serif" }}>{label}</div>
    <div style={{ display: "flex", gap: 8 }}>{children}</div>
  </div>);
}

// ============ MAIN ============
export default function Tempus() {
  const [sections, setSections] = useState([mkMetered()]);
  const [editId, setEditId] = useState(null);
  const [showSet, setShowSet] = useState(false);
  const [settings, setSettings] = useState({ accented: true, pitched: true, visualMode: "dots+flash", countIn: 1 });
  const [muted, setMuted] = useState(false);
  const [ps, setPs] = useState(null);
  const [isP, setIsP] = useState(false);
  const met = useMetronome();
  const fto = useRef(null);

  const tl = useMemo(() => buildTimeline(sections), [sections]);
  const totalBars = tl.length;

  useEffect(() => { met.updS({ muted }); }, [muted]);

  useEffect(() => {
    met.setCb(evt => {
      if (evt.type === "beat") {
        const bar = tl[evt.barIndex];
        setPs({ absoluteBar: evt.absoluteBar, beatIndex: evt.beatIndex, beatType: evt.beatType,
          tsNum: evt.tsNum, tsDen: evt.tsDen, tempo: evt.tempo, sectionIndex: evt.sectionIndex,
          allBeatTypes: bar?.beatTypes || [], flash: true, countIn: false, isTimed: false });
        if (fto.current) clearTimeout(fto.current);
        fto.current = setTimeout(() => setPs(p => p ? { ...p, flash: false } : p), 80);
      } else if (evt.type === "countIn") {
        setPs(p => ({ ...p || {}, countIn: true, flash: true, isTimed: false,
          beatIndex: evt.beatInBar - 1, beatType: evt.beatInBar === 1 ? 0 : 2,
          tsNum: evt.totalBeats, tsDen: 0,
          allBeatTypes: Array(evt.totalBeats).fill(2).map((_, i) => i === 0 ? 0 : 2) }));
        if (fto.current) clearTimeout(fto.current);
        fto.current = setTimeout(() => setPs(p => p ? { ...p, flash: false } : p), 80);
      } else if (evt.type === "timedTick") {
        setPs(p => ({ ...p || {}, isTimed: true, countIn: false, absoluteBar: evt.absoluteBar,
          sectionIndex: evt.sectionIndex, remaining: evt.remaining, flash: p?.flash || false,
          tsNum: 0, tsDen: 0, beatType: 0, totalMarkers: p?.totalMarkers || 0, markerIdx: p?.markerIdx || 0 }));
      } else if (evt.type === "timedMarker") {
        setPs(p => ({ ...p || {}, flash: true, beatType: 0, totalMarkers: evt.totalMarkers, markerIdx: evt.markerIdx }));
        if (fto.current) clearTimeout(fto.current);
        fto.current = setTimeout(() => setPs(p => p ? { ...p, flash: false } : p), 80);
      }
    });
  }, [met, tl]);

  const go = useCallback((fi = 0) => {
    if (!tl.length) return;
    const i = Math.max(0, Math.min(fi, tl.length - 1));
    const b = tl[i];
    setPs({ absoluteBar: b.absoluteBar, beatIndex: 0, beatType: 0, tsNum: b.tsNum, tsDen: b.tsDen,
      tempo: b.tempo, sectionIndex: b.sectionIndex, allBeatTypes: b.beatTypes,
      flash: false, countIn: false, isTimed: b.isTimed, remaining: b.isTimed ? b.timedDuration : undefined });
    setIsP(true);
    met.start(tl, i, settings.countIn, { accented: settings.accented, pitched: settings.pitched, muted });
  }, [tl, settings, met, muted]);

  const stopP = useCallback(() => { met.stop(); setIsP(false); setPs(null); }, [met]);

  const goToBar = useCallback(n => { const i = tl.findIndex(b => b.absoluteBar === n); if (i >= 0) go(i); }, [tl, go]);

  const jumpSec = useCallback(d => {
    if (!ps) return;
    const ns = Math.max(0, Math.min(sections.length - 1, ps.sectionIndex + d));
    const i = tl.findIndex(b => b.sectionIndex === ns);
    if (i >= 0) go(i);
  }, [ps, sections, tl, go]);

  const addSec = () => {
    const ns = mkMetered();
    if (sections.length > 0) {
      const l = sections[sections.length - 1];
      if (l.type === "metered") {
        ns.tsNum = l.tsNum; ns.tsDen = l.tsDen; ns.beatUnit = l.beatUnit;
        ns.dotted = l.dotted; ns.tempo = l.tempo; ns.grouping = l.grouping;
      }
    }
    setSections(p => [...p, ns]); setEditId(ns.id);
  };

  const editSec = sections.find(s => s.id === editId);

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'Outfit', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&family=DM+Mono:wght@400;500&family=Bebas+Neue&display=swap" rel="stylesheet" />
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        input[type=number]::-webkit-inner-spin-button,input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none;margin:0}
        input[type=number]{-moz-appearance:textfield}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:${C.border};border-radius:2px}
      `}</style>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 16px 8px", maxWidth: 480, margin: "0 auto" }}>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, letterSpacing: 3, color: C.text }}>TEMPUS</div>
        <button onClick={() => setShowSet(true)} style={{
          background: "none", border: `1px solid ${C.border}`, borderRadius: 8,
          color: C.textMuted, padding: "6px 10px", cursor: "pointer", display: "flex", alignItems: "center",
        }}>{Icons.gear(18)}</button>
      </div>

      <div style={{ padding: "8px 16px", maxWidth: 480, margin: "0 auto", display: "flex", gap: 16, fontSize: 12, color: C.textMuted, fontFamily: "'DM Mono', monospace" }}>
        <span>{sections.length} section{sections.length !== 1 ? "s" : ""}</span>
        <span>{totalBars} bar{totalBars !== 1 ? "s" : ""}</span>
        {totalBars > 0 && <span>{Math.ceil(tl[tl.length - 1].startTime + tl[tl.length - 1].duration)}s</span>}
      </div>

      <div style={{ padding: "8px 16px 100px", maxWidth: 480, margin: "0 auto", display: "flex", flexDirection: "column", gap: 6 }}>
        {sections.map((sec, i) => (
          <SectionCard key={sec.id} section={sec} index={i} onClick={() => setEditId(sec.id)}
            onStartHere={() => { const idx = tl.findIndex(b => b.sectionIndex === i); if (idx >= 0) go(idx); }} />
        ))}
        <button onClick={addSec} style={{
          width: "100%", padding: 14, borderRadius: 10, border: `1px dashed ${C.border}`,
          background: "transparent", color: C.textMuted, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>{Icons.plus(20)}</button>
      </div>

      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, padding: "12px 16px 20px",
        background: `linear-gradient(transparent, ${C.bg} 20%)`, display: "flex", justifyContent: "center" }}>
        <button onClick={() => go(0)} disabled={!sections.length} style={{
          width: 64, height: 64, borderRadius: "50%", background: C.downbeat, border: "none",
          color: "#000", cursor: "pointer", boxShadow: `0 0 30px ${C.downbeat}44`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>{Icons.play(24)}</button>
      </div>

      {ps && <PlayView playState={ps} sections={sections} onStop={stopP}
        onPause={() => { met.stop(); setIsP(false); }}
        onResume={() => { if (ps && !ps.countIn) { const i = tl.findIndex(b => b.absoluteBar === ps.absoluteBar); if (i >= 0) { setIsP(true); met.start(tl, i, 0, { accented: settings.accented, pitched: settings.pitched, muted }); } } }}
        onGoToBar={goToBar} onPrevSec={() => jumpSec(-1)} onNextSec={() => jumpSec(1)}
        vis={settings.visualMode} isPlaying={isP} muted={muted} onMute={() => setMuted(m => !m)} />}

      {editSec && <SectionEditor section={editSec} onSave={u => setSections(p => p.map(s => s.id === u.id ? u : s))}
        onClose={() => setEditId(null)} onDelete={sections.length > 1 ? id => setSections(p => p.filter(s => s.id !== id)) : null} />}

      {showSet && <SettingsPanel settings={settings} onChange={setSettings} onClose={() => setShowSet(false)} />}
    </div>
  );
}
