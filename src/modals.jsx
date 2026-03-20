import React, { useState, useRef, useMemo } from "react";
import { C, getDeviceId, ldP, svP } from "./utils";
import { I, nI, oB, NI, Stp, Row, SR } from "./components";

// ============ SETTINGS ============
// AGENT NOTE: Do NOT add inline description text beneath settings rows.
// All setting explanations should use data-tip or data-tip-b tooltip attributes only.
// Keep the settings UI clean and minimal — no prose descriptions.
export function SetP({ settings: s, onChange, onClose, isLinked, onOpenDevices, linkColor }) {
  const u = (k, v) => onChange({ ...s, [k]: v }); const LC = linkColor || "#ec4899"; return (<div className="modal-bg" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={onClose}><div className="modal-content" style={{ width: "100%", maxWidth: 440, background: C.bg, borderTop: `1px solid ${C.border}`, borderRadius: "16px 16px 0 0", padding: "20px 20px 32px" }} onClick={e => e.stopPropagation()}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}><div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 16, color: C.text, fontWeight: 600 }}>Settings</div><button className="close-btn" onClick={onClose} data-tip-b="Close">{I.x(18)}</button></div>
    <SR l="Mode">{[["basic", "Simple"], ["default", "Standard"], ["advanced", "Pro"]].map(([v, label]) => <button key={v} onClick={() => u("appMode", v)} style={oB(s.appMode === v)}>{label}</button>)}</SR>
    <SR l="Click">{["accented", "flat"].map(v => <button key={v} onClick={() => u("accented", v === "accented")} data-tip={v === "accented" ? "Accented" : "Flat"} style={oB(s.accented === (v === "accented"))}>{v === "accented" ? <span style={{ letterSpacing: 2 }}>● <span style={{ fontSize: 8 }}>· · ·</span></span> : <span style={{ letterSpacing: 2, fontSize: 8 }}>· · · ·</span>}</button>)}{["pitched", "unpitched"].map(v => <button key={v} onClick={() => u("pitched", v === "pitched")} data-tip={v === "pitched" ? "Pitched" : "Unpitched"} style={oB(s.pitched === (v === "pitched"))}>{v === "pitched" ? "♪" : "✕"}</button>)}</SR><SR l="Beats">{[false, true].map(v => <button key={String(v)} onClick={() => u("downbeatOnly", v)} style={oB(s.downbeatOnly === v)}>{v ? <span style={{ letterSpacing: 3 }}>● ○ ○ ○</span> : <span style={{ letterSpacing: 3 }}>● ● ● ●</span>}</button>)}</SR><SR l="Visual">{[["dots", "●", "Pulse"], ["dots+flash", "● ◻", "Full"], ["flash", "◻", "Flash"]].map(([v, l, tip]) => <button key={v} onClick={() => u("visualMode", v)} data-tip={tip} style={{ ...oB(s.visualMode === v), fontSize: 11 }}>{l}</button>)}</SR><SR l="Count-in">{[0, 1, 2].map(v => <button key={v} onClick={() => u("countIn", v)} style={oB(s.countIn === v)}>{v === 0 ? "○" : v}</button>)}</SR>
    {s.appMode === "advanced" && <SR l="Silent Cycle"><div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{[0, 4, 8, 12, 16].map(v => <button key={v} onClick={() => u("silentInterval", v)} data-tip={v === 0 ? "Always audible" : `${v}s on, ${v}s off, repeating`} style={{ ...oB(s.silentInterval === v), fontSize: 11 }}>{v === 0 ? "○" : `${v}s`}</button>)}</div></SR>}
    {s.appMode === "advanced" && <SR l="Dual Tempo"><button onClick={() => u("dualTempo", !s.dualTempo)} data-tip="Side-by-side metronomes" style={oB(!!s.dualTempo)}>{s.dualTempo ? "●" : "○"}</button></SR>}
    <div style={{ marginTop: 16, paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontSize: 10, color: C.textMuted + "88", fontFamily: "'DM Mono',monospace" }}>Device ID: {getDeviceId()}</div>
        {s.appMode === "advanced" && onOpenDevices && <button onClick={() => { onClose(); setTimeout(onOpenDevices, 150); }} style={{ background: isLinked ? LC + "18" : "none", border: `1px solid ${isLinked ? LC : C.border}`, borderRadius: 8, color: isLinked ? LC : C.textMuted, padding: "4px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontFamily: "'Outfit',sans-serif", transition: "all 0.15s", boxShadow: isLinked ? `0 0 8px ${LC}33` : "none" }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: isLinked ? LC : C.textMuted, boxShadow: isLinked ? `0 0 4px ${LC}` : "none", transition: "all 0.2s" }} />
          {I.desktop(14)}
        </button>}
      </div>
      <div style={{ fontSize: 9, color: C.textMuted + "55", fontFamily: "'Outfit',sans-serif", marginTop: 4 }}>Your data is stored locally and backed up anonymously.</div>
    </div></div></div>);
}

// ============ SAVE MODAL ============
export function SaveM({ sections, onClose, onSaved, onVideoUrl, videoUrl: savedVideoUrl, videoSync: savedVideoSync, loadedProfileId }) {
  const existing = useMemo(() => { if (!loadedProfileId) return null; const p = ldP(); return p.find(x => x.id === loadedProfileId) || null; }, [loadedProfileId]);
  const [t, sT] = useState(existing?.title || ""), [c, sC] = useState(existing?.composer || ""), [perf, setPerf] = useState(existing?.performer || ""), [vUrl, setVUrl] = useState(savedVideoUrl || existing?.videoUrl || "");
  const ok = t.trim() && c.trim();
  const saveNew = () => { if (!ok) return; const p = ldP(); const id = Date.now(); const profile = { id, title: t.trim(), composer: c.trim(), sections, createdAt: new Date().toISOString() }; if (perf.trim()) profile.performer = perf.trim(); if (vUrl.trim()) profile.videoUrl = vUrl.trim(); if (savedVideoSync) profile.videoSync = savedVideoSync; p.push(profile); svP(p); if (onVideoUrl) onVideoUrl(vUrl.trim() || null); onSaved(id); onClose(); };
  const overwrite = () => { if (!ok || !loadedProfileId) return; const p = ldP(); const idx = p.findIndex(x => x.id === loadedProfileId); if (idx < 0) { saveNew(); return; } p[idx] = { ...p[idx], title: t.trim(), composer: c.trim(), performer: perf.trim() || undefined, videoUrl: vUrl.trim() || undefined, videoSync: savedVideoSync || p[idx].videoSync, sections, updatedAt: new Date().toISOString() }; svP(p); if (onVideoUrl) onVideoUrl(vUrl.trim() || null); onSaved(loadedProfileId); onClose(); };
  return (<div className="modal-bg" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center" }}><div className="modal-content" style={{ width: "100%", maxWidth: 440, background: C.bg, borderTop: `1px solid ${C.border}`, borderRadius: "16px 16px 0 0", padding: "20px 20px 32px" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}><div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 16, color: C.text, fontWeight: 600 }}>{existing ? "Update Piece" : "Save Piece"}</div><button className="close-btn" onClick={onClose} data-tip-b="Close">{I.x(18)}</button></div>
    <input value={t} onChange={e => sT(e.target.value)} placeholder="Title" style={{ ...nI, width: "100%", textAlign: "left", padding: "0 12px", marginBottom: 10, fontSize: 15 }} />
    <input value={c} onChange={e => sC(e.target.value)} placeholder="Composer / Arranger" style={{ ...nI, width: "100%", textAlign: "left", padding: "0 12px", marginBottom: 10, fontSize: 15 }} />
    <input value={perf} onChange={e => setPerf(e.target.value)} placeholder="Performer / Ensemble (optional)" style={{ ...nI, width: "100%", textAlign: "left", padding: "0 12px", marginBottom: 10, fontSize: 13, color: C.textMuted }} />
    <input value={vUrl} onChange={e => setVUrl(e.target.value)} placeholder="Video URL (optional)" style={{ ...nI, width: "100%", textAlign: "left", padding: "0 12px", marginBottom: 20, fontSize: 13, color: C.textMuted }} />
    {existing ? (<div style={{ display: "flex", gap: 8 }}>
      <button onClick={overwrite} style={{ flex: 1, padding: "12px", borderRadius: 8, border: "none", background: ok ? C.accent : C.sub, color: ok ? "#fff" : C.textMuted, fontSize: 14, fontWeight: 600, cursor: ok ? "pointer" : "default", fontFamily: "'Outfit',sans-serif" }}>Update</button>
      <button onClick={saveNew} style={{ flex: 1, padding: "12px", borderRadius: 8, border: `1px solid ${ok ? C.downbeat : C.sub}`, background: "transparent", color: ok ? C.downbeat : C.textMuted, fontSize: 14, fontWeight: 600, cursor: ok ? "pointer" : "default", fontFamily: "'Outfit',sans-serif" }}>Save New</button>
    </div>) : (
      <button onClick={saveNew} style={{ width: "100%", padding: "12px", borderRadius: 8, border: "none", background: ok ? C.downbeat : C.sub, color: ok ? "#000" : C.textMuted, fontSize: 14, fontWeight: 600, cursor: ok ? "pointer" : "default", fontFamily: "'Outfit',sans-serif" }}>Save</button>
    )}
  </div></div>);
}

// ============ LIBRARY ============
export function LibP({ onLoad, onClose }) {
  const [p, sP] = useState(ldP);
  const [s, sS] = useState("");
  const f = useMemo(() => { if (!s.trim()) return p; const q = s.toLowerCase(); return p.filter(x => (x.title + " " + x.composer + " " + (x.performer || "")).toLowerCase().includes(q)); }, [p, s]);
  const [confirmDelId, setConfirmDelId] = useState(null);
  const confirmDelTimer = useRef(null);
  const del = id => {
    if (confirmDelId !== id) { setConfirmDelId(id); if (confirmDelTimer.current) clearTimeout(confirmDelTimer.current); confirmDelTimer.current = setTimeout(() => setConfirmDelId(null), 3000); return; }
    setConfirmDelId(null);
    const u = p.filter(x => x.id !== id); svP(u); sP(u);
  };
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
      <button onClick={importFile} data-tip-b="Import" style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 6, color: C.textMuted, padding: "4px 8px", cursor: "pointer", display: "flex", alignItems: "center" }}>{I.arrowUp(14)}</button>
      <button onClick={exportAll} disabled={p.length === 0} data-tip-b="Export" style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 6, color: p.length > 0 ? C.textMuted : C.border, padding: "4px 8px", cursor: p.length > 0 ? "pointer" : "default", display: "flex", alignItems: "center" }}>{I.arrowDown(14)}</button>
      <button onClick={onClose} data-tip-b="Close" style={{ background: "none", border: "none", color: C.textMuted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", width: 44, height: 44, borderRadius: 8 }}>{I.x(18)}</button>
    </div></div>
    <div style={{ position: "relative", marginBottom: 12 }}>
      <input value={s} onChange={e => sS(e.target.value)} placeholder="Search..." style={{ ...nI, width: "100%", textAlign: "left", padding: "0 36px", fontSize: 14 }} />
      <div style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: C.textMuted }}>{I.search(14)}</div>
      {s.length > 0 && <button onClick={() => sS("")} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: C.textMuted, cursor: "pointer", display: "flex" }}>{I.x(14)}</button>}
    </div>
    <div style={{ overflowY: "auto", flex: 1 }}>{f.length === 0 && <div style={{ color: C.textMuted, fontSize: 14, fontFamily: "'Outfit',sans-serif", textAlign: "center", padding: "60px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}><div style={{ opacity: 0.15, transform: "scale(1.2)" }}>{I.folder(48)}</div><div style={{ fontSize: 16, color: C.textMuted }}>{p.length === 0 ? "Your Library is empty" : "No pieces found"}</div><div style={{ fontSize: 13, color: C.border, maxWidth: "80%" }}>{p.length === 0 ? "Save your sections into profiles to quickly load them later." : "Try adjusting your search query."}</div></div>}{f.map(x => (<div key={x.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: `1px solid ${C.border}` }}><div style={{ flex: 1, cursor: "pointer" }} onClick={() => { onLoad(x.sections, x.videoUrl || null, x.videoSync || null, x.id); onClose(); }}><div style={{ fontFamily: "'DM Mono',monospace", fontSize: 14, color: C.text, display: "flex", alignItems: "center", gap: 6 }}>{x.title}{x.videoUrl && <span style={{ fontSize: 11, color: C.accent }} title={x.videoUrl}>▶</span>}</div><div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 12, color: C.textMuted }}>{x.composer}{x.performer ? ` · ${x.performer}` : ""}</div></div><div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: C.textMuted, flexShrink: 0 }}>{x.sections?.length || 0} sec</div><button onClick={() => del(x.id)} data-tip-b={confirmDelId === x.id ? "?" : "Delete"} style={{ background: confirmDelId === x.id ? C.danger + "22" : "none", border: confirmDelId === x.id ? `1px solid ${C.danger}` : "1px solid transparent", borderRadius: 6, color: C.danger + (confirmDelId === x.id ? "ff" : "99"), cursor: "pointer", padding: 4, display: "flex", alignItems: "center", gap: 2, transition: "all 0.15s" }}>{I.trash(14)}{confirmDelId === x.id && <span style={{ fontSize: 12, fontWeight: 700 }}>?</span>}</button></div>))}</div>
  </div></div>);
}

// ============ PRACTICE SETUP ============
export function PracSetup({ sections, onStart, onClose }) {
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}><div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 16, color: C.practice, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>{I.target(18)} Practice Mode</div><button className="close-btn" onClick={onClose} data-tip-b="Close">{I.x(18)}</button></div>
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
