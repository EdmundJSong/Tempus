import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useMetronome, useTapTempo } from "./metronome";
import { C, mkM, mkT, buildTL, pG, pM } from "./utils";
import { I, SecEd, NoteSVG } from "./components";

// ============ MINI SECTION CARD (compact for narrow panels) ============
function MiniSec({ section: s, index: i, onClick, onDelete, onStartHere, canDelete, isCurrent }) {
  const isT = s.type === "timed";
  return (
    <div onClick={onClick} style={{
      background: isCurrent ? C.downbeat + "15" : C.surface, borderRadius: 6, padding: "6px 8px",
      border: `1px solid ${isCurrent ? C.downbeat + "66" : C.border}`, cursor: "pointer",
      display: "flex", alignItems: "center", gap: 5, transition: "all 0.15s", minHeight: 34
    }}>
      <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: C.textMuted, minWidth: 12, textAlign: "center" }}>{i + 1}</span>
      {isT ? (
        <><span style={{ fontFamily: "'DM Mono',monospace", fontSize: 12, color: C.text, flex: 1 }}>{s.duration}s</span></>
      ) : (
        <>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, fontWeight: 700, color: C.text, lineHeight: 1, textAlign: "center", minWidth: 18, display: "flex", flexDirection: "column", alignItems: "center" }}>
            <span>{s.tsNum}</span><div style={{ height: 1, width: "100%", background: C.textMuted + "66" }} /><span>{s.tsDen}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 2, flex: 1, minWidth: 0 }}>
            <NoteSVG type={s.beatUnit} dotted={s.dotted} size={10} />
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: C.textMuted }}>=</span>
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 12, color: C.text }}>{s.tempo}</span>
          </div>
          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: s.loop ? C.downbeat : C.textMuted, flexShrink: 0 }}>{s.loop ? "∞" : `${s.bars}b`}</span>
        </>
      )}
      <button onClick={e => { e.stopPropagation(); onStartHere(); }} style={{ background: "none", border: "none", color: C.textMuted, cursor: "pointer", padding: 1, display: "flex", flexShrink: 0 }}>{I.play(10)}</button>
      {canDelete && <button onClick={e => { e.stopPropagation(); onDelete(); }} style={{ background: "none", border: "none", color: C.danger + "88", cursor: "pointer", padding: 1, display: "flex", flexShrink: 0 }}>{I.trash(10)}</button>}
    </div>
  );
}

// ============ BEAT DISPLAY ============
function BeatDisplay({ ps, color }) {
  if (!ps) return (
    <div style={{ textAlign: "center", padding: "10px 4px", color: C.textMuted, fontFamily: "'DM Mono',monospace", fontSize: 11 }}>Ready</div>
  );
  if (ps.ended) return (
    <div style={{ textAlign: "center", padding: "10px 4px", color: C.textMuted, fontFamily: "'DM Mono',monospace", fontSize: 12 }}>Ended</div>
  );
  if (ps.countIn) return (
    <div style={{ textAlign: "center", padding: "8px 4px" }}>
      <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 16, color: C.textMuted, opacity: ps.flash ? 1 : 0.5, transition: "opacity 0.05s" }}>Count-in</span>
    </div>
  );
  if (ps.isTimed) return (
    <div style={{ textAlign: "center", padding: "6px 4px" }}>
      <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 22, color, opacity: ps.flash ? 1 : 0.6, transition: "opacity 0.05s" }}>{ps.remaining != null ? ps.remaining.toFixed(1) + "s" : "—"}</span>
    </div>
  );
  const dots = ps.allBeatTypes || [];
  return (
    <div style={{ textAlign: "center", padding: "6px 4px" }}>
      <div style={{ display: "flex", justifyContent: "center", gap: 4, marginBottom: 4, flexWrap: "wrap" }}>
        {dots.map((bt, idx) => {
          const active = idx === ps.beatIndex;
          const dotColor = bt === 0 ? C.downbeat : bt === 1 ? C.accent : C.textMuted;
          return <div key={idx} style={{
            width: active ? 12 : 6, height: active ? 12 : 6, borderRadius: "50%",
            background: active ? dotColor : dotColor + "44",
            boxShadow: active && ps.flash ? `0 0 10px ${dotColor}` : "none",
            transition: "all 0.05s", alignSelf: "center"
          }} />;
        })}
      </div>
      <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, color, opacity: ps.flash ? 1 : 0.7, transition: "opacity 0.05s", letterSpacing: 1 }}>{ps.tempo}</div>
      <div style={{ display: "flex", justifyContent: "center", gap: 6 }}>
        <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: C.textMuted }}>bar {ps.absoluteBar}</span>
        <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: C.textMuted }}>{ps.tsNum}/{ps.tsDen}</span>
      </div>
    </div>
  );
}

// ============ PANEL ============
function Panel({ label, color, sections, tl, ps, isP, met, soundSettings, onSoundToggle,
  onPlay, onStop, onStartHere, onAddSec, onEditSec, onDeleteSec, linked }) {
  const totalBars = tl.length;
  const currentSi = ps?.sectionIndex ?? -1;
  return (
    <div style={{
      flex: 1, minWidth: 0, display: "flex", flexDirection: "column",
      background: C.surface + "44", borderRadius: 10, border: `1px solid ${color}33`,
      overflow: "hidden"
    }}>
      {/* Panel header */}
      <div style={{
        display: "flex", alignItems: "center", gap: 4, padding: "6px 8px",
        borderBottom: `1px solid ${C.border}`, background: color + "08", flexShrink: 0
      }}>
        <div style={{
          width: 22, height: 22, borderRadius: 5, background: color + "22",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, color, letterSpacing: 1, flexShrink: 0
        }}>{label}</div>
        <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: C.textMuted, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {sections.length}s · {totalBars}b
        </span>
        <button onClick={onSoundToggle} style={{
          background: "none", border: `1px solid ${C.border}`, borderRadius: 5,
          padding: "2px 5px", cursor: "pointer", color: C.textMuted,
          fontSize: 9, fontFamily: "'DM Mono',monospace", flexShrink: 0
        }}>{soundSettings.pitched ? "♪" : "◌"}</button>
        <button onClick={() => isP ? onStop() : onPlay(0)} disabled={!totalBars} style={{
          width: 28, height: 28, borderRadius: "50%", border: "none",
          background: isP ? C.danger : color, color: isP ? "#fff" : "#000",
          cursor: totalBars ? "pointer" : "default", display: "flex",
          alignItems: "center", justifyContent: "center", flexShrink: 0,
          opacity: totalBars ? 1 : 0.3,
          boxShadow: isP ? `0 0 8px ${C.danger}44` : `0 0 8px ${color}33`,
          transition: "all 0.2s"
        }}>{isP ? I.pause(12) : I.play(12)}</button>
      </div>

      {/* Beat display */}
      <div style={{ flexShrink: 0 }}>
        <BeatDisplay ps={ps} color={color} />
      </div>

      {/* Section list */}
      <div style={{ flex: 1, overflowY: "auto", padding: "4px 6px 6px", display: "flex", flexDirection: "column", gap: 3, minHeight: 0 }}>
        {sections.map((sec, i) => (
          <MiniSec key={sec.id} section={sec} index={i} onClick={() => onEditSec(sec.id)}
            onDelete={() => onDeleteSec(sec.id)} onStartHere={() => onStartHere(i)}
            canDelete={sections.length > 1 && !linked} isCurrent={currentSi === i} />
        ))}
        {!linked && <button onClick={onAddSec} style={{
          width: "100%", padding: 6, borderRadius: 6, border: `1px dashed ${C.border}`,
          background: "transparent", color: C.textMuted, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10
        }}>{I.plus(12)}</button>}
      </div>
    </div>
  );
}

// ============ CENTER CONTROLS ============
function CenterControls({ linked, toggleLink, copyAtoB, copyBtoA, isPA, isPB, linkedPlay, linkedStop, colorA, colorB }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      gap: 8, padding: "0 4px", flexShrink: 0, width: 44
    }}>
      {!linked && <button onClick={copyAtoB} style={{
        background: "none", border: `1px solid ${C.border}`, borderRadius: 5, padding: "3px 4px",
        color: C.textMuted, fontSize: 8, fontFamily: "'DM Mono',monospace", cursor: "pointer",
        whiteSpace: "nowrap", lineHeight: 1
      }}>A→B</button>}

      <button onClick={toggleLink} style={{
        background: linked ? colorA + "15" : C.surface, border: `1px solid ${linked ? colorA : C.border}`,
        borderRadius: 8, padding: "6px 4px", cursor: "pointer", width: 36, height: 36,
        color: linked ? colorA : C.textMuted, display: "flex",
        alignItems: "center", justifyContent: "center", transition: "all 0.2s"
      }}>
        {I.sync(14)}
      </button>

      {linked && <button onClick={() => { if (isPA || isPB) linkedStop(); else linkedPlay(0); }} style={{
        width: 36, height: 36, borderRadius: "50%", border: "none",
        background: (isPA || isPB) ? C.danger : `linear-gradient(135deg, ${colorA}, ${colorB})`,
        color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: `0 0 12px ${(isPA || isPB) ? C.danger + "44" : colorA + "33"}`,
        transition: "all 0.2s"
      }}>{(isPA || isPB) ? I.pause(14) : I.play(14)}</button>}

      {!linked && <button onClick={copyBtoA} style={{
        background: "none", border: `1px solid ${C.border}`, borderRadius: 5, padding: "3px 4px",
        color: C.textMuted, fontSize: 8, fontFamily: "'DM Mono',monospace", cursor: "pointer",
        whiteSpace: "nowrap", lineHeight: 1
      }}>B→A</button>}
    </div>
  );
}

// ============ MAIN DUAL TEMPO ============
export default function DualTempo({ sections: initialSections, settings, onExit }) {
  const ctxRef = useRef(null);
  if (!ctxRef.current) ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
  useEffect(() => () => { if (ctxRef.current) { ctxRef.current.close().catch(() => {}); ctxRef.current = null; } }, []);

  const [secA, setSecA] = useState(() => initialSections.map(s => ({ ...s })));
  const [psA, setPsA] = useState(null);
  const [isPA, setIsPA] = useState(false);
  const metA = useMetronome(ctxRef.current);
  const [soundA, setSoundA] = useState({ pitched: true, accented: true });

  const cloneForB = useCallback(secs => secs.map(s => ({ ...s, id: "b_" + String(s.id).replace(/^b_/, "") })), []);
  const [secB, setSecB] = useState(() => cloneForB(initialSections));
  const [psB, setPsB] = useState(null);
  const [isPB, setIsPB] = useState(false);
  const metB = useMetronome(ctxRef.current);
  const [soundB, setSoundB] = useState({ pitched: false, accented: true });

  const [linked, setLinked] = useState(true);
  const [editPanel, setEditPanel] = useState(null);
  const [editId, setEditId] = useState(null);
  const [editIsNew, setEditIsNew] = useState(false);

  const tlA = useMemo(() => buildTL(secA), [secA]);
  const tlB = useMemo(() => buildTL(secB), [secB]);

  const prevSecAJson = useRef(null);
  useEffect(() => {
    if (!linked) { prevSecAJson.current = null; return; }
    const json = JSON.stringify(secA);
    if (json === prevSecAJson.current) return;
    prevSecAJson.current = json;
    setSecB(cloneForB(secA));
  }, [linked, secA, cloneForB]);

  useEffect(() => { metA.updS({ ...soundA, muted: false }); }, [soundA, metA]);
  useEffect(() => { metB.updS({ ...soundB, muted: false }); }, [soundB, metB]);

  const ftoA = useRef(null);
  useEffect(() => {
    metA.setCb(evt => {
      if (evt.type === "beat") {
        const bar = tlA[evt.barIdx];
        setPsA({ absoluteBar: evt.ab, beatIndex: evt.beatIdx, beatType: evt.bt, tsNum: evt.tsN, tsDen: evt.tsD, tempo: evt.tempo, sectionIndex: evt.si, allBeatTypes: bar?.bts || [], flash: true, countIn: false, isTimed: false, ended: false });
        if (ftoA.current) clearTimeout(ftoA.current);
        ftoA.current = setTimeout(() => setPsA(p => p ? { ...p, flash: false } : p), 80);
      } else if (evt.type === "countIn") {
        setPsA(p => ({ ...p || {}, countIn: true, flash: true, isTimed: false, ended: false, beatIndex: evt.beatInBar - 1, beatType: evt.beatInBar === 1 ? 0 : 2, tsNum: evt.totalBeats, tsDen: 0, allBeatTypes: Array(evt.totalBeats).fill(2).map((_, i) => i === 0 ? 0 : 2) }));
        if (ftoA.current) clearTimeout(ftoA.current);
        ftoA.current = setTimeout(() => setPsA(p => p ? { ...p, flash: false } : p), 80);
      } else if (evt.type === "timedStart" || evt.type === "timedTick") {
        setPsA(p => ({ ...p || {}, isTimed: true, countIn: false, ended: false, absoluteBar: evt.ab, sectionIndex: evt.si, remaining: evt.rem ?? evt.dur, flash: evt.type === "timedStart" }));
        if (evt.type === "timedStart") { if (ftoA.current) clearTimeout(ftoA.current); ftoA.current = setTimeout(() => setPsA(p => p ? { ...p, flash: false } : p), 80); }
      } else if (evt.type === "fermataHold") {
        setPsA(p => ({ ...p || {}, fermata: true, fermataRem: evt.rem }));
      } else if (evt.type === "ended") {
        setPsA(p => ({ ...p || {}, ended: true, flash: false })); setIsPA(false);
      }
    });
  }, [metA, tlA]);

  const ftoB = useRef(null);
  useEffect(() => {
    metB.setCb(evt => {
      if (evt.type === "beat") {
        const bar = tlB[evt.barIdx];
        setPsB({ absoluteBar: evt.ab, beatIndex: evt.beatIdx, beatType: evt.bt, tsNum: evt.tsN, tsDen: evt.tsD, tempo: evt.tempo, sectionIndex: evt.si, allBeatTypes: bar?.bts || [], flash: true, countIn: false, isTimed: false, ended: false });
        if (ftoB.current) clearTimeout(ftoB.current);
        ftoB.current = setTimeout(() => setPsB(p => p ? { ...p, flash: false } : p), 80);
      } else if (evt.type === "countIn") {
        setPsB(p => ({ ...p || {}, countIn: true, flash: true, isTimed: false, ended: false, beatIndex: evt.beatInBar - 1, beatType: evt.beatInBar === 1 ? 0 : 2, tsNum: evt.totalBeats, tsDen: 0, allBeatTypes: Array(evt.totalBeats).fill(2).map((_, i) => i === 0 ? 0 : 2) }));
        if (ftoB.current) clearTimeout(ftoB.current);
        ftoB.current = setTimeout(() => setPsB(p => p ? { ...p, flash: false } : p), 80);
      } else if (evt.type === "timedStart" || evt.type === "timedTick") {
        setPsB(p => ({ ...p || {}, isTimed: true, countIn: false, ended: false, absoluteBar: evt.ab, sectionIndex: evt.si, remaining: evt.rem ?? evt.dur, flash: evt.type === "timedStart" }));
        if (evt.type === "timedStart") { if (ftoB.current) clearTimeout(ftoB.current); ftoB.current = setTimeout(() => setPsB(p => p ? { ...p, flash: false } : p), 80); }
      } else if (evt.type === "fermataHold") {
        setPsB(p => ({ ...p || {}, fermata: true, fermataRem: evt.rem }));
      } else if (evt.type === "ended") {
        setPsB(p => ({ ...p || {}, ended: true, flash: false })); setIsPB(false);
      }
    });
  }, [metB, tlB]);

  const ci = settings.countIn || 0;

  const goA = useCallback((fi = 0, syncDelayMs) => {
    if (!tlA.length) return;
    const i = Math.max(0, Math.min(fi, tlA.length - 1)), b = tlA[i];
    setPsA({ absoluteBar: b.ab, beatIndex: 0, beatType: 0, tsNum: b.tsN, tsDen: b.tsD, tempo: b.tempo, sectionIndex: b.si, allBeatTypes: b.bts, flash: false, countIn: false, isTimed: b.isT, remaining: b.isT ? b.tDur : undefined, ended: false });
    setIsPA(true);
    metA.start(tlA, i, ci, { ...soundA, muted: false, ...(syncDelayMs != null ? { syncDelayMs } : {}) });
  }, [tlA, ci, metA, soundA]);

  const goB = useCallback((fi = 0, syncDelayMs) => {
    if (!tlB.length) return;
    const i = Math.max(0, Math.min(fi, tlB.length - 1)), b = tlB[i];
    setPsB({ absoluteBar: b.ab, beatIndex: 0, beatType: 0, tsNum: b.tsN, tsDen: b.tsD, tempo: b.tempo, sectionIndex: b.si, allBeatTypes: b.bts, flash: false, countIn: false, isTimed: b.isT, remaining: b.isT ? b.tDur : undefined, ended: false });
    setIsPB(true);
    metB.start(tlB, i, ci, { ...soundB, muted: false, ...(syncDelayMs != null ? { syncDelayMs } : {}) });
  }, [tlB, ci, metB, soundB]);

  const stopA = useCallback(() => { metA.stop(); setIsPA(false); }, [metA]);
  const stopB = useCallback(() => { metB.stop(); setIsPB(false); }, [metB]);

  const linkedPlay = useCallback((fi = 0) => {
    const delay = 150;
    metA.tap();
    goA(fi, delay);
    goB(fi, delay);
  }, [goA, goB, metA]);

  const linkedStop = useCallback(() => { stopA(); stopB(); }, [stopA, stopB]);

  const handlePlayA = useCallback((fi = 0) => {
    metA.tap();
    if (linked) linkedPlay(fi); else goA(fi);
  }, [linked, linkedPlay, goA, metA]);

  const handlePlayB = useCallback((fi = 0) => {
    metB.tap();
    if (linked) linkedPlay(fi); else goB(fi);
  }, [linked, linkedPlay, goB, metB]);

  const handleStopA = useCallback(() => {
    if (linked) linkedStop(); else stopA();
  }, [linked, linkedStop, stopA]);

  const handleStopB = useCallback(() => {
    if (linked) linkedStop(); else stopB();
  }, [linked, linkedStop, stopB]);

  const startHereA = useCallback(secIdx => {
    const fi = tlA.findIndex(b => b.si === secIdx);
    if (fi >= 0) handlePlayA(fi);
  }, [tlA, handlePlayA]);

  const startHereB = useCallback(secIdx => {
    const fi = tlB.findIndex(b => b.si === secIdx);
    if (fi >= 0) handlePlayB(fi);
  }, [tlB, handlePlayB]);

  const addSecA = useCallback(() => {
    const ns = mkM();
    if (secA.length > 0) { const l = secA[secA.length - 1]; if (l.type === "metered") { ns.tsNum = l.tsNum; ns.tsDen = l.tsDen; ns.beatUnit = l.beatUnit; ns.dotted = l.dotted; ns.tempo = l.tempo; ns.grouping = l.grouping; } }
    setSecA(p => [...p, ns]); setEditPanel("A"); setEditIsNew(true); setEditId(ns.id);
  }, [secA]);

  const addSecB = useCallback(() => {
    const ns = mkM();
    if (secB.length > 0) { const l = secB[secB.length - 1]; if (l.type === "metered") { ns.tsNum = l.tsNum; ns.tsDen = l.tsDen; ns.beatUnit = l.beatUnit; ns.dotted = l.dotted; ns.tempo = l.tempo; ns.grouping = l.grouping; } }
    setSecB(p => [...p, ns]); setEditPanel("B"); setEditIsNew(true); setEditId(ns.id);
  }, [secB]);

  const deleteSecA = useCallback(id => { if (secA.length <= 1) return; setSecA(p => p.filter(s => s.id !== id)); }, [secA]);
  const deleteSecB = useCallback(id => { if (secB.length <= 1) return; setSecB(p => p.filter(s => s.id !== id)); }, [secB]);

  const editSecA = useCallback(id => { setEditPanel("A"); setEditIsNew(false); setEditId(id); }, []);
  const editSecB = useCallback(id => { setEditPanel("B"); setEditIsNew(false); setEditId(id); }, []);

  const editSec = editPanel === "A" ? secA.find(s => s.id === editId) : editPanel === "B" ? secB.find(s => s.id === editId) : null;

  const handleSaveEdit = useCallback((u, isDup = false) => {
    const setter = editPanel === "A" ? setSecA : setSecB;
    if (isDup) {
      setter(p => { const i = p.findIndex(s => s.id === editId); return [...p.slice(0, i + 1), u, ...p.slice(i + 1)]; });
    } else {
      setter(p => p.map(s => s.id === u.id ? u : s));
    }
  }, [editPanel, editId]);

  const handleDeleteFromEditor = useCallback(id => {
    if (editPanel === "A") deleteSecA(id); else deleteSecB(id);
  }, [editPanel, deleteSecA, deleteSecB]);

  const copyAtoB = useCallback(() => { setSecB(cloneForB(secA)); }, [secA, cloneForB]);
  const copyBtoA = useCallback(() => { setSecA(secB.map(s => ({ ...s, id: String(s.id).replace(/^b_/, "") || (Date.now() + Math.random()) }))); }, [secB]);

  const toggleLink = useCallback(() => {
    stopA(); stopB(); setPsA(null); setPsB(null);
    setLinked(l => !l);
  }, [stopA, stopB]);

  useEffect(() => {
    const hk = e => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      if (editId) return;
      if (e.code === "Space") {
        e.preventDefault();
        if (isPA || isPB) { if (linked) linkedStop(); else { stopA(); stopB(); } }
        else { if (linked) linkedPlay(0); else { goA(0); goB(0); } }
      } else if (e.code === "Escape") {
        if (editId) { setEditId(null); setEditPanel(null); }
        else onExit();
      }
    };
    window.addEventListener("keydown", hk);
    return () => window.removeEventListener("keydown", hk);
  }, [isPA, isPB, linked, linkedStop, linkedPlay, stopA, stopB, goA, goB, editId, onExit]);

  const colorA = C.downbeat;
  const colorB = C.accent;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 90, background: C.bg, color: C.text, fontFamily: "'Outfit',sans-serif", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px 4px", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="grad-text" style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, letterSpacing: 2 }}>DUAL TEMPO</span>
          <span style={{
            padding: "2px 5px", borderRadius: 4, fontSize: 8, fontFamily: "'DM Mono',monospace",
            background: linked ? colorA + "22" : C.surface, color: linked ? colorA : C.textMuted,
            border: `1px solid ${linked ? colorA + "44" : C.border}`
          }}>{linked ? "LINKED" : "UNLINKED"}</span>
        </div>
        <button className="close-btn" onClick={onExit} style={{ width: 36, height: 36 }}>{I.x(18)}</button>
      </div>

      {/* Main area: Panel A | Center Controls | Panel B — side by side */}
      <div style={{ flex: 1, display: "flex", flexDirection: "row", gap: 0, padding: "0 6px 8px", minHeight: 0, overflow: "hidden" }}>
        <Panel label="A" color={colorA} sections={secA} tl={tlA} ps={psA} isP={isPA} met={metA}
          soundSettings={soundA} onSoundToggle={() => setSoundA(p => ({ ...p, pitched: !p.pitched }))}
          onPlay={handlePlayA} onStop={handleStopA} onStartHere={startHereA}
          onAddSec={addSecA} onEditSec={editSecA} onDeleteSec={deleteSecA} linked={linked} />

        <CenterControls linked={linked} toggleLink={toggleLink} copyAtoB={copyAtoB} copyBtoA={copyBtoA}
          isPA={isPA} isPB={isPB} linkedPlay={linkedPlay} linkedStop={linkedStop} colorA={colorA} colorB={colorB} />

        <Panel label="B" color={colorB} sections={secB} tl={tlB} ps={psB} isP={isPB} met={metB}
          soundSettings={soundB} onSoundToggle={() => setSoundB(p => ({ ...p, pitched: !p.pitched }))}
          onPlay={handlePlayB} onStop={handleStopB} onStartHere={startHereB}
          onAddSec={addSecB} onEditSec={editSecB} onDeleteSec={deleteSecB} linked={linked} />
      </div>

      {/* Section editor */}
      {editSec && <SecEd section={editSec} appMode={settings.appMode} isNew={editIsNew}
        editIndex={(editPanel === "A" ? secA : secB).findIndex(s => s.id === editId) + 1}
        onSave={handleSaveEdit} onClose={() => { setEditId(null); setEditPanel(null); }}
        onDelete={((editPanel === "A" ? secA : secB).length > 1 && !linked) ? handleDeleteFromEditor : null} />}

      <style>{`
        .grad-text { background: linear-gradient(135deg, #ffffff 0%, #848492 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
      `}</style>
    </div>
  );
}
