import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useSync, SyncLobby, SyncStatusBar, SyncToast, useDeviceLink, DeviceLinkModal } from "./SyncMode";
import { useMetronome } from "./metronome";
import { useTapTempo } from "./metronome";
import { C, _getLS, _setLS, mkM, buildTL, scaleSections, gCD, fbSyncDebounced, fbInit, getTempoHistory, saveTempoHistory } from "./utils";
import { I, SecCard, SecEd } from "./components";
import PlayView from "./PlayView";
import VideoView from "./VideoView";
import { SetP, SaveM, LibP, PracSetup } from "./modals";
import DualTempo from "./DualTempo";
import { t, setLang } from "./i18n";

// ============ OFFLINE PROMPT ============
function OfflinePrompt({ message, onClose }) {
  return (<div className="modal-bg" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
    <div className="modal-content" style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 16, padding: "28px 24px", maxWidth: 300, textAlign: "center" }} onClick={e => e.stopPropagation()}>
      <div style={{ marginBottom: 12 }}><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={C.textMuted} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M1 1l22 22" /><path d="M16.72 11.06A10.94 10.94 0 0119 12.55" /><path d="M5 12.55a10.94 10.94 0 015.17-2.39" /><path d="M10.71 5.05A16 16 0 0122.56 9" /><path d="M1.42 9a15.91 15.91 0 014.7-2.88" /><path d="M8.53 16.11a6 6 0 016.95 0" /><line x1="12" y1="20" x2="12.01" y2="20" /></svg></div>
      <div style={{ fontSize: 14, color: C.text, fontFamily: "'Outfit',sans-serif", marginBottom: 16 }}>{message}</div>
      <button onClick={onClose} style={{ padding: "8px 24px", borderRadius: 8, border: "none", background: C.surface, color: C.text, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>OK</button>
    </div>
  </div>);
}

// ============ MAIN ============
export default function Tempus() {
  const [sections, setSections] = useState(() => { try { const saved = _getLS("tempus_sections"); if (saved) { const parsed = JSON.parse(saved); if (Array.isArray(parsed) && parsed.length > 0) return parsed; } } catch {} return [mkM()]; });
  useEffect(() => { _setLS("tempus_sections", JSON.stringify(sections)); fbSyncDebounced(sections); }, [sections]);
  const [editId, setEditId] = useState(null);
  const [editIsNew, setEditIsNew] = useState(false);
  const [showSet, setShowSet] = useState(false);
  const [showSave, setShowSave] = useState(false);
  const [showLib, setShowLib] = useState(false);
  const [videoUrl, setVideoUrl] = useState(() => _getLS("tempus_videoUrl") || null);
  const [videoSync, setVideoSync] = useState(() => { try { const s = _getLS("tempus_videoSync"); return s ? JSON.parse(s) : null; } catch { return null; } });
  const [showVideo, setShowVideo] = useState(false);
  const [loadedProfileId, setLoadedProfileId] = useState(null);
  useEffect(() => { if (videoUrl) _setLS("tempus_videoUrl", videoUrl); else { try { localStorage.removeItem("tempus_videoUrl"); } catch {} } }, [videoUrl]);
  useEffect(() => { if (videoSync) _setLS("tempus_videoSync", JSON.stringify(videoSync)); else { try { localStorage.removeItem("tempus_videoSync"); } catch {} } }, [videoSync]);
  const [showPrac, setShowPrac] = useState(false);
  const [showDual, setShowDual] = useState(false);
  const [settings, setSettings] = useState(() => { try { const saved = _getLS("tempus_settings"); if (saved) { const p = JSON.parse(saved); if (p.pitched !== undefined && !p.clickSound) { p.clickSound = p.pitched ? "sine" : "noise"; delete p.pitched; } return { accented: true, clickSound: "sine", visualMode: "dots+flash", countIn: 1, appMode: "default", downbeatOnly: false, silentInterval: 0, dualTempo: false, showTempoHistory: false, offlineMode: false, lang: "en", ...p }; } } catch {} return { accented: true, clickSound: "sine", visualMode: "dots+flash", countIn: 1, appMode: "default", downbeatOnly: false, silentInterval: 0, dualTempo: false, showTempoHistory: false, offlineMode: false, lang: "en" }; });
  useEffect(() => { _setLS("tempus_settings", JSON.stringify(settings)); }, [settings]);
  useEffect(() => { setLang(settings.lang || "en"); }, [settings.lang]);
  // Pre-warm Firebase SDK on mount so Sync/Link don't cold-start
  useEffect(() => { fbInit().catch(() => {}); }, []);
  const [offlinePrompt, setOfflinePrompt] = useState(null);
  // SW register/unregister based on offlineMode setting
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (settings.offlineMode) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    } else {
      navigator.serviceWorker.getRegistrations().then(regs => { regs.forEach(r => r.unregister()); });
    }
  }, [settings.offlineMode]);
  const [muted, setMuted] = useState(false);
  const [ps, setPs] = useState(null);
  const [isP, setIsP] = useState(false);
  const [mode, setMode] = useState("normal");
  const [pracSections, setPracSections] = useState(null);
  const [pracStep, setPracStep] = useState(0);
  const met = useMetronome();
  const flashFn = useRef(null);
  const splitPoints = useRef([]);
  const pracConfig = useRef(null);
  const transitioning = useRef(false);
  const [thVer, setThVer] = useState(0);
  const tempoHistory = useMemo(() => getTempoHistory(loadedProfileId), [loadedProfileId, thVer]);

  const [pracPending, setPracPending] = useState(false);

  const [undoToast, setUndoToast] = useState(null);
  const undoTimer = useRef(null);
  useEffect(() => () => { if (undoTimer.current) clearTimeout(undoTimer.current); }, []);
  const [dragIdx, setDragIdx] = useState(null);
  const [dropIdx, setDropIdx] = useState(null);
  // Touch drag reorder
  const [tDrag, setTDrag] = useState(null);
  const [tDropIdx, setTDropIdx] = useState(null);
  const cardRefs = useRef([]);
  const tDragTimer = useRef(null);
  const onGripTouchStart = useCallback((idx, e) => {
    const touch = e.touches[0];
    const startY = touch.clientY;
    tDragTimer.current = setTimeout(() => {
      if (navigator.vibrate) try { navigator.vibrate(20); } catch {}
      const positions = cardRefs.current.map(el => el ? el.getBoundingClientRect() : null);
      setTDrag({ idx, startY, offsetY: 0, positions });
      setTDropIdx(idx);
    }, 300);
  }, []);
  useEffect(() => {
    if (!tDrag) return;
    const onMove = e => {
      e.preventDefault();
      const y = e.touches[0].clientY;
      const offsetY = y - tDrag.startY;
      setTDrag(prev => prev ? { ...prev, offsetY } : null);
      const positions = tDrag.positions;
      let newDrop = tDrag.idx;
      for (let i = 0; i < positions.length; i++) {
        if (!positions[i]) continue;
        const midY = positions[i].top + positions[i].height / 2;
        if (y < midY) { newDrop = i; break; }
        newDrop = i + 1;
      }
      newDrop = Math.max(0, Math.min(sections.length - 1, newDrop));
      setTDropIdx(newDrop);
    };
    const onEnd = () => {
      if (tDrag && tDropIdx !== null && tDrag.idx !== tDropIdx) {
        setSections(p => { const c = [...p]; const [m] = c.splice(tDrag.idx, 1); c.splice(tDropIdx, 0, m); return c; });
      }
      setTDrag(null); setTDropIdx(null);
    };
    document.addEventListener("touchmove", onMove, { passive: false });
    document.addEventListener("touchend", onEnd);
    document.addEventListener("touchcancel", onEnd);
    return () => { document.removeEventListener("touchmove", onMove); document.removeEventListener("touchend", onEnd); document.removeEventListener("touchcancel", onEnd); };
  }, [tDrag, tDropIdx, sections.length]);
  const cancelTouchDrag = useCallback(() => { if (tDragTimer.current) { clearTimeout(tDragTimer.current); tDragTimer.current = null; } }, []);

  const activeSections = pracSections || sections;
  const tl = useMemo(() => buildTL(activeSections), [activeSections]);
  const totalBars = tl.length;

  useEffect(() => { met.updS({ muted }); }, [muted, met]);
  useEffect(() => { met.updS({ accented: settings.accented, clickSound: settings.clickSound, downbeatOnly: settings.downbeatOnly, silentInterval: settings.silentInterval }); }, [settings.accented, settings.clickSound, settings.downbeatOnly, settings.silentInterval]);
  useEffect(() => { if (isP) met.hotSwapTL(tl); }, [tl, isP, met]);

  useEffect(() => {
    met.setCb(evt => {
      if (evt.type === "beat") { if (evt.barIdx >= tl.length) return; const bar = tl[evt.barIdx]; setPs({ absoluteBar: evt.ab, beatIndex: evt.beatIdx, beatType: evt.bt, tsNum: evt.tsN, tsDen: evt.tsD, tempo: evt.tempo, sectionIndex: evt.si, allBeatTypes: bar?.bts || [], flash: false, countIn: false, isTimed: false, fermata: false, pctLabel: pracSections ? `${pracStep}%` : null }); flashFn.current?.(evt.bt); }
      else if (evt.type === "countIn") { const cbt = evt.beatInBar === 1 ? 0 : 2; setPs(p => ({ ...p || {}, countIn: true, beatsLeft: evt.beatsLeft, flash: false, isTimed: false, beatIndex: evt.beatInBar - 1, beatType: cbt, tsNum: evt.totalBeats, tsDen: 0, allBeatTypes: Array(evt.totalBeats).fill(2).map((_, i) => i === 0 ? 0 : 2) })); flashFn.current?.(cbt); }
      else if (evt.type === "timedStart") { setPs(p => ({ ...p || {}, isTimed: true, countIn: false, flash: false, beatType: 0, absoluteBar: evt.ab, sectionIndex: evt.si, remaining: evt.dur, tsNum: 0, tsDen: 0 })); flashFn.current?.(0); }
      else if (evt.type === "timedTick") { setPs(p => ({ ...p || {}, isTimed: true, countIn: false, absoluteBar: evt.ab, sectionIndex: evt.si, remaining: evt.rem, flash: false, tsNum: 0, tsDen: 0, beatType: 0, totalMarkers: p?.totalMarkers || 0, markerIdx: p?.markerIdx || 0 })); }
      else if (evt.type === "timedMarker") { setPs(p => ({ ...p || {}, flash: false, beatType: 0, totalMarkers: evt.tm, markerIdx: evt.mi })); flashFn.current?.(0); }
      else if (evt.type === "fermataHold") { setPs(p => ({ ...p || {}, fermata: true, fermataRem: evt.rem, fermataDur: evt.dur })); }
      else if (evt.type === "ended") { setPs(p => ({ ...p || {}, ended: true, flash: false, countIn: false, fermata: false })); setIsP(false); }
    });
  }, [met, tl, pracSections, pracStep]);

  const prePlayTempos = useRef(null);
  const go = useCallback((fi = 0, countInOverride, syncDelayMs) => { if (!tl.length) return; if (transitioning.current) return; transitioning.current = true; setTimeout(() => { transitioning.current = false; }, 300); if (!prePlayTempos.current) prePlayTempos.current = sections.map(s => s.tempo); const ci = countInOverride !== undefined ? countInOverride : settings.countIn; const i = Math.max(0, Math.min(fi, tl.length - 1)), b = tl[i]; setPs({ absoluteBar: b.ab, beatIndex: 0, beatType: 0, tsNum: b.tsN, tsDen: b.tsD, tempo: b.tempo, sectionIndex: b.si, allBeatTypes: b.bts, flash: false, countIn: false, isTimed: b.isT, remaining: b.isT ? b.tDur : undefined, pctLabel: pracSections ? `${pracStep}%` : null }); setIsP(true); met.start(tl, i, ci, { accented: settings.accented, clickSound: settings.clickSound, muted, ...(syncDelayMs != null ? { syncDelayMs } : {}) }); }, [tl, settings, met, muted, pracSections, pracStep, sections]);
  const moveTo = useCallback((fi = 0) => { if (!tl.length) return; const i = Math.max(0, Math.min(fi, tl.length - 1)), b = tl[i]; met.stop(); setIsP(false); setPs({ absoluteBar: b.ab, beatIndex: 0, beatType: 0, tsNum: b.tsN, tsDen: b.tsD, tempo: b.tempo, sectionIndex: b.si, allBeatTypes: b.bts, flash: false, countIn: false, isTimed: b.isT, remaining: b.isT ? b.tDur : undefined, pctLabel: pracSections ? `${pracStep}%` : null }); }, [tl, met, pracSections, pracStep]);
  useEffect(() => { if (pracPending && pracSections) { setPracPending(false); go(0); } }, [pracPending, pracSections, go]);
  const exitPlay = useCallback(() => {
    // Save tempo history on practice exit
    if (mode === "practice" && loadedProfileId && pracConfig.current && ps) {
      try {
        const cfg = pracConfig.current;
        const stepSize = cfg.sectionCount * cfg.pctReps;
        const stepBlock = stepSize > 0 ? Math.floor(ps.sectionIndex / stepSize) : 0;
        const reachedPct = Math.min(cfg.targetPct, cfg.startPct + stepBlock * cfg.pctInc);
        const completed = ps.ended || reachedPct >= cfg.targetPct;
        const existing = getTempoHistory(loadedProfileId);
        const updated = sections.map((s, i) => {
          if (s.type !== "metered") return null;
          const lastTempo = Math.round(s.tempo * reachedPct / 100);
          const prev = existing.find(h => h.sectionIndex === i);
          const bestTempo = completed ? Math.max(lastTempo, prev?.bestTempo || 0) : (prev?.bestTempo || null);
          return { sectionIndex: i, lastTempo, bestTempo, timestamp: new Date().toISOString() };
        }).filter(Boolean);
        // Merge: keep non-metered entries from existing, overwrite metered ones
        const merged = [...updated];
        existing.forEach(h => { if (!merged.find(m => m.sectionIndex === h.sectionIndex)) merged.push(h); });
        saveTempoHistory(loadedProfileId, merged);
        setThVer(v => v + 1);
      } catch {}
    }
    pracConfig.current = null;
    met.stop(); setIsP(false); setPs(null); setMode("normal"); setPracSections(null); try { if (prePlayTempos.current && prePlayTempos.current.length > 0) { const saved = prePlayTempos.current; setSections(prev => prev.map((s, i) => ({ ...s, tempo: i < saved.length ? (saved[i] ?? s.tempo) : s.tempo }))); } } catch {} prePlayTempos.current = null; }, [met, mode, loadedProfileId, ps, sections]);

  // ============ SYNC MODE ============
  const syncPause = useCallback(() => { met.stop(); setIsP(false); }, [met]);
  const sync = useSync({ sections, settings, met, go, exitPlay, pause: syncPause });
  const handleSyncLoadSections = useCallback((s) => { if (Array.isArray(s) && s.length > 0) setSections(s); }, []);

  // ============ DEVICE LINKING ============
  const link = useDeviceLink({ syncInRoom: sync.isInRoom });

  const lastSyncSectionsJson = useRef(null);
  useEffect(() => {
    if (!sync.isInRoom || sync.isHost) { lastSyncSectionsJson.current = null; return; }
    if (!sync.syncState?.isAdmitted || !sync.syncState?.sections?.length) return;
    const j = JSON.stringify(sync.syncState.sections);
    if (j === lastSyncSectionsJson.current) return;
    lastSyncSectionsJson.current = j;
    setSections(sync.syncState.sections);
  }, [sync.syncState?.sections, sync.isHost, sync.isInRoom, sync.syncState?.isAdmitted]);
  const goToBar = useCallback(n => { const i = tl.findIndex(b => b.ab === n); if (i >= 0) moveTo(i); }, [tl, moveTo]);
  const jumpSec = useCallback(d => { if (!ps) return; const ns = Math.max(0, Math.min(activeSections.length - 1, ps.sectionIndex + d)), i = tl.findIndex(b => b.si === ns); if (i >= 0) moveTo(i); }, [ps, activeSections, tl, moveTo]);

  const [showClearModal, setShowClearModal] = useState(false);
  const [showOverflow, setShowOverflow] = useState(false);
  useEffect(() => {
    const hkd = e => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      if (showDual) return; // DualTempo handles its own keys
      const anyModalOpen = editId !== null || showSet || showSave || showLib || showPrac || showVideo || showClearModal || sync.showLobby || link.showDeviceModal;
      if (e.code === "Space") {
        if (anyModalOpen || sync.isMemberLocked) return;
        if (sync.isInRoom && !sync.syncReady) return;
        e.preventDefault();
        if (sync.isInRoom && sync.isHost) {
          if (isP) { sync.doPause(); }
          else { met.tap(); sync.doStart(); }
        } else {
          if (isP) { met.stop(); setIsP(false); }
          else if (ps && (ps.ended || ps.countIn)) { met.tap(); go(0); }
          else if (ps) { met.tap(); const i = tl.findIndex(b => b.ab === ps.absoluteBar); if (i >= 0) { setIsP(true); met.start(tl, i, 0, { accented: settings.accented, clickSound: settings.clickSound, muted }); } }
          else { met.tap(); go(0); }
        }
      }
      else if (e.code === "Escape") { setEditId(null); setShowSet(false); setShowSave(false); setShowLib(false); setShowPrac(false); setShowVideo(false); setShowClearModal(false); setShowOverflow(false); sync.setShowLobby(false); }
      else if (isP && !sync.isMemberLocked && e.code === "ArrowLeft") jumpSec(-1);
      else if (isP && !sync.isMemberLocked && e.code === "ArrowRight") jumpSec(1);
    };
    window.addEventListener("keydown", hkd); return () => window.removeEventListener("keydown", hkd);
  }, [isP, exitPlay, go, jumpSec, met, tl, ps, settings, muted, editId, showSet, showSave, showLib, showPrac, showVideo, showDual, showClearModal, sync.showLobby, sync.isMemberLocked]);

  const lastSplitTime = useRef(0);
  const lastSplitBar = useRef(0);

  const handleSplit = useCallback(barNum => {
    if (mode !== "record") return;
    const now = Date.now();
    if (now - lastSplitTime.current < 800 || barNum === lastSplitBar.current) return;
    lastSplitTime.current = now;
    lastSplitBar.current = barNum;
    splitPoints.current.push(barNum);
    setSections(prev => {
      if (prev.length > 50) return prev;
      const tempTl = buildTL(prev);
      const barInfo = tempTl.find(b => b.ab === barNum);
      if (!barInfo) return prev;
      const secIdx = barInfo.si;
      const sec = prev[secIdx];
      if (!sec || sec.type === "timed") return prev;
      const barInSec = barInfo.bin;
      if (barInSec <= 1 || barInSec >= sec.bars) return prev;
      const elapsed1 = barInSec - 1, elapsed2 = sec.bars - (barInSec - 1);
      const s1 = { ...sec, id: Date.now() + Math.random(), bars: elapsed1, capturedDuration: elapsed1 * gCD(sec.tempo, sec.beatUnit, sec.dotted, sec.tsDen) * sec.tsNum };
      const s2 = { ...sec, id: Date.now() + Math.random() + 1, bars: elapsed2, capturedDuration: elapsed2 * gCD(sec.tempo, sec.beatUnit, sec.dotted, sec.tsDen) * sec.tsNum };
      return [...prev.slice(0, secIdx), s1, s2, ...prev.slice(secIdx + 1)];
    });
  }, [mode]);

  const startPractice = useCallback((_, profileOpts) => {
    if (!profileOpts) return;
    const { startPct, targetPct, pctInc, pctReps } = profileOpts;
    pracConfig.current = { startPct, targetPct, pctInc, pctReps, sectionCount: sections.length };
    let allSecs = [];
    for (let p = startPct; p <= targetPct; p += pctInc) {
      for (let r = 0; r < pctReps; r++) {
        allSecs = allSecs.concat(scaleSections(sections, Math.min(p, targetPct)));
      }
    }
    setPracSections(allSecs); setPracStep(startPct); setMode("practice");
    setPracPending(true);
  }, [sections]);

  const addSec = () => { const ns = mkM(); if (sections.length > 0) { const l = sections[sections.length - 1]; if (l.type === "metered") { ns.tsNum = l.tsNum; ns.tsDen = l.tsDen; ns.beatUnit = l.beatUnit; ns.dotted = l.dotted; ns.tempo = l.tempo; ns.grouping = l.grouping; } } setSections(p => [...p, ns]); setEditIsNew(true); setEditId(ns.id); };
  const moveSecTimer = useRef(null);
  const moveSec = (i, d) => { if (moveSecTimer.current) return; moveSecTimer.current = setTimeout(() => { moveSecTimer.current = null; }, 150); setSections(p => { const a = [...p]; if (i + d >= 0 && i + d < a.length) [a[i], a[i + d]] = [a[i + d], a[i]]; return a; }); };
  const editSec = sections.find(s => s.id === editId);

  const handleClear = () => {
    if (sections.length <= 1 && sections[0]?.tempo === 120 && sections[0]?.tsNum === 4) return;
    setShowClearModal(true);
  };
  const doClear = () => {
    setShowClearModal(false);
    const backup = [...sections];
    const backupMeta = { videoUrl, videoSync, loadedProfileId };
    setSections([mkM()]); setEditId(null); setVideoUrl(null); setVideoSync(null); setLoadedProfileId(null);
    setUndoToast({ section: backup, index: -1, meta: backupMeta });
    if (undoTimer.current) clearTimeout(undoTimer.current);
    undoTimer.current = setTimeout(() => setUndoToast(null), 8000);
  };

  const handleDelete = id => {
    if (sections.length <= 1) return;
    const idx = sections.findIndex(s => s.id === id);
    if (idx === -1) return;
    const sec = sections[idx];
    setSections(p => p.filter(s => s.id !== id));
    setUndoToast({ section: sec, index: idx });
    if (undoTimer.current) clearTimeout(undoTimer.current);
    undoTimer.current = setTimeout(() => setUndoToast(null), 8000);
  };
  const handleUndo = () => {
    if (!undoToast) return;
    if (undoToast.index === -1 && Array.isArray(undoToast.section)) {
      setSections(undoToast.section);
      if (undoToast.meta) { setVideoUrl(undoToast.meta.videoUrl); setVideoSync(undoToast.meta.videoSync); setLoadedProfileId(undoToast.meta.loadedProfileId); }
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

  const { tap: handleLiveTapTempo, tapBpm: liveTapBpm, tapFlash: liveTapFlash } = useTapTempo(useCallback(bpm => {
    if (!ps) return;
    const si = ps.sectionIndex;
    setSections(prev => prev.map((s, i) => i === si && s.type === "metered" ? { ...s, tempo: bpm } : s));
  }, [ps]));

  return (
    <div className={sync.syncGlowPulse ? "sync-glow-pulse" : ""} style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'Outfit',sans-serif", touchAction: "manipulation", position: "relative", boxShadow: sync.isInRoom ? `inset 0 0 0 3px ${sync.SYNC_COLOR}66, inset 0 0 30px ${sync.SYNC_COLOR}22` : link.isLinked ? `inset 0 0 0 2px ${link.LINK_COLOR}44, inset 0 0 20px ${link.LINK_COLOR}11` : undefined, transition: sync.syncGlowPulse ? undefined : "box-shadow 0.4s ease" }}>
      <div className="ambient-bg" style={{ background: `radial-gradient(circle at 50% 10%, ${sync.isInRoom ? sync.SYNC_COLOR + '15' : mode === 'record' ? C.record + '15' : mode === 'practice' ? C.practice + '15' : C.downbeat + '15'}, transparent 60%)` }} />
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&family=DM+Mono:wght@400;500&family=Bebas+Neue&display=swap" rel="stylesheet" />
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0} html{touch-action:manipulation;-webkit-tap-highlight-color:transparent;-webkit-user-select:none;user-select:none}
        input,textarea{-webkit-user-select:auto;user-select:auto}
        input[type=number]::-webkit-inner-spin-button,input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none;margin:0} input[type=number]{-moz-appearance:textfield}
        ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-thumb{background:${C.border};border-radius:2px}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
        @keyframes ripple { 0% { transform: scale(1); opacity: 0.6; } 100% { transform: scale(2); opacity: 0; } }
        .sec-card { transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), border-color 0.2s ease, background 0.15s; position: relative; overflow: hidden; }
        .sec-card::before { content: ''; position: absolute; inset: 0; background: linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 100%); opacity: 0; transition: opacity 0.3s; }
        .sec-card:active { transform: translateY(0) scale(0.98); }
        @media (hover: hover) {
          .sec-card:hover { transform: translateY(-3px) scale(1.01); box-shadow: 0 16px 40px rgba(0,0,0,0.6); border-color: ${C.textMuted}55; background: ${C.surfaceHover} !important; }
          .sec-card:hover::before { opacity: 1; }
        }
        .glass-pill { background: rgba(20, 20, 28, 0.85); border-radius: 40px; border: 1px solid rgba(255,255,255,0.12); padding: 8px 16px; box-shadow: 0 12px 40px rgba(0,0,0,0.5); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); }
        .ambient-bg { position: fixed; inset: 0; z-index: 0; pointer-events: none; transition: background 1s ease; }
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
        button { cursor: pointer; transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.15s ease, opacity 0.15s ease, border-color 0.15s ease; }
        button:active:not(:disabled) { opacity: 0.7; transform: scale(0.95); }
        .close-btn { background: none; border: none; color: ${C.textMuted}; cursor: pointer; display: flex; align-items: center; justify-content: center; width: 44px; height: 44px; border-radius: 8px; transition: background 0.15s ease, color 0.15s ease; }
        @media (hover: hover) {
          button:hover:not(:disabled) { opacity: 0.9; }
          .close-btn:hover { background: ${C.surfaceHover}; color: ${C.text}; }
          .transport-btn:hover:not(:disabled) { transform: translateY(-4px) scale(1.08) !important; box-shadow: 0 16px 40px rgba(0,0,0,0.7) !important; filter: brightness(1.1); }
        }
        .transport-btn:active:not(:disabled) { transform: scale(0.9) !important; filter: brightness(0.9); }
        @keyframes modalFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes modalSlideUp { from { opacity: 0; transform: translateY(24px) scale(0.96); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .modal-bg { animation: modalFadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; background: rgba(0,0,0,0.85) !important; }
        .modal-content { animation: modalSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; background: rgba(19, 19, 26, 0.97) !important; border: 1px solid rgba(255,255,255,0.1) !important; border-top: 1px solid rgba(255,255,255,0.2) !important; box-shadow: 0 -20px 50px rgba(139, 124, 246, 0.1), 0 -10px 40px rgba(0,0,0,0.7); }
        .grad-text { background: linear-gradient(135deg, #ffffff 0%, #848492 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.2)); }
        @keyframes toastUp { from { transform: translate(-50%, 100%); opacity: 0; } to { transform: translate(-50%, 0); opacity: 1; } }
        .toast { animation: toastUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes syncPulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(0.8); } }
        .sync-pulse { animation: syncPulse 1.5s ease-in-out infinite; }
        @keyframes syncGlowBright { 0% { box-shadow: inset 0 0 0 3px rgba(6,182,212,0.4), inset 0 0 30px rgba(6,182,212,0.13); } 50% { box-shadow: inset 0 0 0 4px rgba(6,182,212,0.9), inset 0 0 60px rgba(6,182,212,0.35); } 100% { box-shadow: inset 0 0 0 3px rgba(6,182,212,0.4), inset 0 0 30px rgba(6,182,212,0.13); } }
        .sync-glow-pulse { animation: syncGlowBright 1.2s ease-in-out; }
      `}</style>

      {/* TOOLBAR
         Mobile discoverability: long-press tooltips were considered but deferred —
         users can discover via the overflow menu labels instead.
         Always visible: New, Sync, Settings, ⋮ overflow.
         Overflow: Library, Save, Video (conditional), Dual (conditional). */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 16px 8px", maxWidth: 480, margin: "0 auto" }}>
        <div className="grad-text" style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, letterSpacing: 3 }}>TEMPUS</div>
        <div style={{ display: "flex", gap: 6 }}>
          {!sync.isMemberLocked && <button onClick={handleClear} data-tip-b={t("new_label")} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 8, color: C.textMuted, padding: "6px 10px", minWidth: 44, minHeight: 44, justifyContent: "center", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontFamily: "'Outfit',sans-serif", transition: "all 0.15s" }}>{I.fileNew(18)}</button>}
          {settings.appMode !== "basic" && <button onClick={() => { if (!navigator.onLine && !sync.isInRoom) { setOfflinePrompt(t("offline_sync")); return; } sync.setShowLobby(true); }} data-tip-b={t("sync")} style={{ background: sync.isInRoom ? sync.SYNC_COLOR + "22" : "none", border: `1px solid ${sync.isInRoom ? sync.SYNC_COLOR : C.border}`, borderRadius: 8, color: sync.isInRoom ? sync.SYNC_COLOR : C.textMuted, padding: "6px 10px", minWidth: 44, minHeight: 44, justifyContent: "center", cursor: "pointer", display: "flex", alignItems: "center" }}>{I.sync(18)}</button>}
          <button onClick={() => setShowSet(true)} data-tip-b={t("settings")} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 8, color: C.textMuted, padding: "6px 10px", minWidth: 44, minHeight: 44, justifyContent: "center", cursor: "pointer", display: "flex", alignItems: "center" }}>{I.gear(18)}</button>
          {settings.appMode !== "basic" && !sync.isMemberLocked && (() => {
            const hasOverflowItems = true; // Library + Save always present in non-basic mode
            if (!hasOverflowItems) return null;
            return (<div style={{ position: "relative" }}>
              <button onClick={() => setShowOverflow(v => !v)} data-tip-b={t("more")} style={{ background: showOverflow ? C.surface : "none", border: `1px solid ${showOverflow ? C.textMuted + "55" : C.border}`, borderRadius: 8, color: C.textMuted, padding: "6px 10px", minWidth: 44, minHeight: 44, justifyContent: "center", cursor: "pointer", display: "flex", alignItems: "center" }}>{I.more(18)}</button>
              {showOverflow && <>
                <div style={{ position: "fixed", inset: 0, zIndex: 200 }} onClick={() => setShowOverflow(false)} />
                <div style={{ position: "absolute", top: "100%", right: 0, zIndex: 201, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 6, marginTop: 4, minWidth: 160, boxShadow: "0 8px 30px rgba(0,0,0,0.5)" }}>
                  <button onClick={() => { setShowLib(true); setShowOverflow(false); }} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "none", border: "none", borderRadius: 6, color: C.text, cursor: "pointer", fontSize: 13, fontFamily: "'Outfit',sans-serif" }}>{I.folder(16)} {t("library")}</button>
                  <button onClick={() => { setShowSave(true); setShowOverflow(false); }} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "none", border: "none", borderRadius: 6, color: C.text, cursor: "pointer", fontSize: 13, fontFamily: "'Outfit',sans-serif" }}>{I.save(16)} {t("save")}</button>
                  {videoUrl && <button onClick={() => { if (!navigator.onLine) { setOfflinePrompt(t("offline_video")); setShowOverflow(false); return; } setShowVideo(true); setShowOverflow(false); }} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "none", border: "none", borderRadius: 6, color: C.accent, cursor: "pointer", fontSize: 13, fontFamily: "'Outfit',sans-serif" }}>▶ {t("video")}</button>}
                  {settings.appMode === "advanced" && settings.dualTempo && <button onClick={() => { setShowDual(true); setShowOverflow(false); }} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "none", border: "none", borderRadius: 6, color: C.accent, cursor: "pointer", fontSize: 13, fontFamily: "'Outfit',sans-serif" }}>A|B {t("dual")}</button>}
                </div>
              </>}
            </div>);
          })()}
        </div>
      </div>

      <div style={{ padding: "8px 16px", maxWidth: 480, margin: "0 auto", display: "flex", gap: 6, fontSize: 12, color: C.textMuted, fontFamily: "'DM Mono',monospace" }}>
        <span>{sections.length}</span><span style={{ opacity: 0.4 }}>·</span><span>{totalBars}b</span>
        {totalBars > 0 && <><span style={{ opacity: 0.4 }}>·</span><span>{(() => { const dur = Math.ceil(tl[tl.length - 1].st + tl[tl.length - 1].dur); const m = Math.floor(dur / 60); const s = dur % 60; return `${m}:${s < 10 ? "0" : ""}${s}`; })()}</span></>}
      </div>

      {sync.isInRoom && <SyncStatusBar sync={sync} onOpenLobby={() => sync.setShowLobby(true)} />}

      <div style={{ padding: "8px 16px 120px", maxWidth: 480, margin: "0 auto", display: "flex", flexDirection: "column", gap: 6 }}>
        {sections.map((sec, i) => { const locked = sync.isMemberLocked; const noop = () => {}; return <SecCard key={sec.id} ref={el => cardRefs.current[i] = el} section={sec} index={i} total={sections.length} onClick={locked ? noop : () => { setEditIsNew(false); setEditId(sec.id); }} onStartHere={locked ? noop : () => { met.tap(); const idx = tl.findIndex(b => b.si === i); if (idx >= 0) { setMode("normal"); go(idx); } }} onMove={locked ? noop : (d => moveSec(i, d))} onDelete={locked ? null : (sections.length > 1 ? handleDelete : null)} onDragStart={locked ? noop : handleDragStart} onDragEnter={locked ? noop : handleDragEnter} onDragOver={locked ? noop : handleDragOver} onDragEnd={locked ? noop : handleDragEnd} onDrop={locked ? noop : handleDrop} dragIdx={dragIdx} dropIdx={dropIdx} onGripTouchStart={locked ? noop : onGripTouchStart} cancelTouchDrag={locked ? noop : cancelTouchDrag} tDrag={tDrag} tDropIdx={tDropIdx} tempoHistory={settings.showTempoHistory && loadedProfileId ? tempoHistory.find(h => h.sectionIndex === i) : null} />; })}
        {sections.length === 1 && sections[0].type === "metered" && sections[0].tsNum === 4 && sections[0].tsDen === 4 && sections[0].tempo === 120 && sections[0].bars === 8 && !sync.isMemberLocked && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px 0 4px", animation: "pulse 2s infinite" }}>
            <span style={{ fontSize: 14, color: C.textMuted, transform: "rotate(-90deg)", display: "inline-block" }}>{I.chevR(14)}</span>
            <span style={{ fontSize: 11, color: C.textMuted + "88", fontFamily: "'Outfit',sans-serif" }}>{t("tap_to_edit")}</span>
          </div>
        )}
        {!sync.isMemberLocked && <button onClick={addSec} style={{ width: "100%", padding: 14, borderRadius: 10, border: `1px dashed ${C.border}`, background: "transparent", color: C.textMuted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>{I.plus(20)}</button>}
      </div>

      {/* Bottom buttons */}
      {!sync.isMemberLocked && <div style={{ position: "fixed", bottom: 24, left: 0, right: 0, display: "flex", justifyContent: "center", zIndex: 10, pointerEvents: "none" }}>
        <div className="glass-pill" style={{ display: "flex", gap: 20, alignItems: "center", pointerEvents: "auto", padding: "10px 24px" }}>
          {settings.appMode !== "basic" && !sync.isInRoom && <button className="transport-btn" onClick={() => { met.tap(); setMode("record"); splitPoints.current = []; go(0); }} disabled={!sections.length} data-tip={t("record")} style={{ width: 44, height: 44, borderRadius: "50%", background: C.record, border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 16px ${C.glowRecord}`, transition: "transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s" }}>{I.rec(18)}</button>}
          <button className="btn-ripple transport-btn" onClick={() => { if (sync.isInRoom && sync.isHost) { met.tap(); sync.doStart(); } else { met.tap(); setMode("normal"); go(0); } }} disabled={!sections.length || (sync.isInRoom && !sync.syncReady)} data-tip={sync.isInRoom ? (sync.syncReady ? t("sync_start") : t("connecting")) : t("play")} style={{ width: 64, height: 64, borderRadius: "50%", background: sync.isInRoom ? sync.SYNC_COLOR : C.downbeat, border: "none", color: "#000", cursor: (sync.isInRoom && !sync.syncReady) ? "wait" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: (sync.isInRoom && !sync.syncReady) ? 0.4 : 1, boxShadow: `0 0 24px ${sync.isInRoom ? sync.SYNC_GLOW : C.glowDownbeat}`, transition: "transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s, opacity 0.3s" }}>{(sync.isInRoom && !sync.syncReady) ? <span style={{ fontSize: 10, fontFamily: "'DM Mono',monospace", color: "#000" }}>...</span> : I.play(28)}</button>
          {settings.appMode !== "basic" && !sync.isInRoom && <button className="transport-btn" onClick={() => setShowPrac(true)} data-tip={t("practice_mode")} style={{ width: 44, height: 44, borderRadius: "50%", background: C.practice, border: "none", color: "#000", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 16px ${C.glowPractice}`, transition: "transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s" }}>{I.target(18)}</button>}
        </div>
      </div>}

      {ps && <PlayView ps={ps} sections={activeSections} tl={tl} flashFnRef={flashFn} onPause={() => { if (sync.isInRoom && sync.isHost) { sync.doPause(); } else { met.stop(); setIsP(false); } }} onResume={(barNum) => { if (sync.isInRoom && sync.isHost) { sync.doResume(barNum || 1); return; } met.tap(); if (!ps) return; if (ps.countIn) return; if (ps.ended) { go(0); return; } if (barNum) { const i = tl.findIndex(b => b.ab === barNum); if (i >= 0) { go(i); return; } } const i = tl.findIndex(b => b.ab === ps.absoluteBar); if (i >= 0) { setIsP(true); met.start(tl, i, settings.countIn, { accented: settings.accented, clickSound: settings.clickSound, muted }); } }} onRestart={() => { if (sync.isInRoom && sync.isHost) { sync.doRestart(); return; } met.tap(); go(0); }} onGoToBar={goToBar} onPrevSec={() => jumpSec(-1)} onNextSec={() => jumpSec(1)} vis={settings.visualMode} isP={isP} muted={muted} onMute={() => setMuted(m => !m)} onExit={() => { if (sync.isInRoom && sync.isHost) { sync.doStop(); } else { exitPlay(); } }} mode={sync.isInRoom ? "sync" : mode} onSplit={handleSplit} onTapTempo={sync.isInRoom ? null : handleLiveTapTempo} tapBpm={liveTapBpm} tapFlash={liveTapFlash} settings={settings} onSettings={setSettings} syncLocked={sync.isMemberLocked} />}
      {editSec && <SecEd section={editSec} appMode={settings.appMode} isNew={editIsNew} editIndex={sections.findIndex(s => s.id === editId) + 1} onSave={(u, isDup = false) => { if (isDup) { setSections(p => { const i = p.findIndex(s => s.id === editId); return [...p.slice(0, i + 1), u, ...p.slice(i + 1)]; }); } else { setSections(p => p.map(s => s.id === u.id ? u : s)); } }} onClose={() => setEditId(null)} onDelete={sections.length > 1 ? handleDelete : null} />}
      {showSet && <SetP settings={settings} onChange={setSettings} onClose={() => setShowSet(false)} isLinked={link.isLinked} onOpenDevices={() => { if (!navigator.onLine) { setOfflinePrompt(t("offline_link")); return; } link.setShowDeviceModal(true); }} linkColor={link.LINK_COLOR} />}
      {showSave && <SaveM sections={sections} onClose={() => setShowSave(false)} onSaved={(newId) => { if (newId) setLoadedProfileId(newId); }} onVideoUrl={setVideoUrl} videoUrl={videoUrl} videoSync={videoSync} loadedProfileId={loadedProfileId} />}
      {showLib && <LibP onLoad={(s, v, vs, pid) => { setSections(s); setVideoUrl(v || null); setVideoSync(vs || null); setLoadedProfileId(pid || null); }} onClose={() => setShowLib(false)} />}
      {showPrac && <PracSetup sections={sections} onStart={startPractice} onClose={() => setShowPrac(false)} tempoHistory={loadedProfileId ? tempoHistory : null} />}
      {sync.showLobby && <SyncLobby sync={sync} onLoadSections={handleSyncLoadSections} link={link} />}
      <SyncToast message={sync.toast} />
      {link.showDeviceModal && <DeviceLinkModal link={link} onClose={() => link.setShowDeviceModal(false)} />}
      {showVideo && videoUrl && <VideoView videoUrl={videoUrl} sections={sections} tl={tl} onClose={() => setShowVideo(false)} onSyncPoints={pts => { setVideoSync(pts); setShowVideo(false); }} met={met} settings={settings} muted={muted} onUpdateSections={setSections} videoSync={videoSync} onEditSection={id => { setEditIsNew(false); setEditId(id); }} onAddSection={addSec} onDeleteSection={handleDelete} onMoveSection={moveSec} loadedProfileId={loadedProfileId} />}
      {undoToast && <div className="toast" style={{ position: "fixed", bottom: 90, left: "50%", zIndex: 60, background: C.surface, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 16, padding: "12px 20px", borderRadius: 12, boxShadow: "0 10px 40px rgba(0,0,0,0.5)" }}>
        <span style={{ fontSize: 13, color: C.text, display: "flex", alignItems: "center", gap: 6 }}>{undoToast.index === -1 ? I.fileNew(14) : I.trash(14)}</span>
        <button onClick={handleUndo} style={{ background: "none", border: "none", color: C.accent, fontWeight: 600, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>{I.restart(14)}</button>
      </div>}
      {showDual && <DualTempo sections={sections} settings={settings} onExit={() => setShowDual(false)} />}
      {offlinePrompt && <OfflinePrompt message={offlinePrompt} onClose={() => setOfflinePrompt(null)} />}
      {showClearModal && <div className="modal-bg" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setShowClearModal(false)}>
        <div className="modal-content" style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 16, padding: "28px 24px", maxWidth: 300, textAlign: "center" }} onClick={e => e.stopPropagation()}>
          <div style={{ fontSize: 15, color: C.text, fontFamily: "'Outfit',sans-serif", fontWeight: 600, marginBottom: 8 }}>{t("new_label")}</div>
          <div style={{ fontSize: 13, color: C.textMuted, fontFamily: "'Outfit',sans-serif", marginBottom: 20 }}>{t("clear_confirm") || "Start a new piece? Current sections will be cleared."}</div>
          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            <button onClick={() => setShowClearModal(false)} style={{ padding: "8px 20px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>{t("cancel") || "Cancel"}</button>
            <button onClick={doClear} style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: C.danger, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>{t("confirm_clear") || "Clear"}</button>
          </div>
        </div>
      </div>}
    </div>
  );
}
