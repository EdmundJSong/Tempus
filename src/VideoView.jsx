import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { C, isSafeUrl, getEmbedUrl } from "./utils";
import { I, nI } from "./components";
import { tS } from "./PlayView";
import { useTapTempo } from "./metronome";
import { SaveM } from "./modals";

// ============ HELPERS ============
export function fmtTime(s) { if (s == null) return "--:--.-"; const m = Math.floor(s / 60), sec = s % 60; return `${m}:${sec < 10 ? "0" : ""}${sec.toFixed(1)}`; }

// ============ VIDEO VIEW ============
export default function VideoView({ videoUrl, sections, tl, onClose, onSyncPoints, met, settings, muted, onUpdateSections, videoSync: initSync, onEditSection, onAddSection, onDeleteSection, onMoveSection, loadedProfileId }) {
  const containerRef = useRef(null);
  const playerRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [vidPlaying, setVidPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [startPt, setStartPt] = useState(initSync?.start ?? null);
  const [endPt, setEndPt] = useState(initSync?.end ?? null);
  // Dirty tracking: snapshot initial state to detect unsaved changes
  const initSnap = useRef({ sections: JSON.stringify(sections), startPt: initSync?.start ?? null, endPt: initSync?.end ?? null });
  const isDirty = useCallback(() => {
    return JSON.stringify(sections) !== initSnap.current.sections || startPt !== initSnap.current.startPt || endPt !== initSnap.current.endPt;
  }, [sections, startPt, endPt]);
  const [showClosePrompt, setShowClosePrompt] = useState(false);
  const handleClose = () => {
    if (syncActive) { if (playerRef.current) playerRef.current.pauseVideo(); met.stop(); setSyncActive(false); syncActiveRef.current = false; }
    if (isDirty()) { setShowClosePrompt(true); return; }
    onClose();
  };
  const pollRef = useRef(null);
  const [syncActive, setSyncActive] = useState(false);
  const [syncBar, setSyncBar] = useState(null);
  const [syncEnded, setSyncEnded] = useState(false);
  const [syncCountIn, setSyncCountIn] = useState(false);
  const syncCbRef = useRef(null);
  const [vidCountIn, setVidCountIn] = useState(settings.countIn || 1);
  const [showVidSave, setShowVidSave] = useState(false);
  const syncActiveRef = useRef(false);
  const syncBarRef = useRef(null);
  const tlRef = useRef(tl);
  const metRef = useRef(met);
  const settingsRef = useRef(settings);
  const mutedRef = useRef(muted);
  useEffect(() => { syncActiveRef.current = syncActive; }, [syncActive]);
  useEffect(() => { syncBarRef.current = syncBar; }, [syncBar]);
  useEffect(() => { tlRef.current = tl; }, [tl]);
  useEffect(() => { metRef.current = met; }, [met]);
  useEffect(() => { settingsRef.current = settings; }, [settings]);
  useEffect(() => { mutedRef.current = muted; }, [muted]);

  const ytId = useMemo(() => {
    if (!videoUrl) return null;
    const m = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
    return m ? m[1] : null;
  }, [videoUrl]);
  const vimeoId = useMemo(() => {
    if (!videoUrl || ytId) return null;
    const m = videoUrl.match(/vimeo\.com\/(\d+)/);
    return m ? m[1] : null;
  }, [videoUrl, ytId]);
  const isSC = useMemo(() => {
    if (!videoUrl || ytId) return false;
    return /soundcloud\.com\/[^/]+\/[^/]+/.test(videoUrl);
  }, [videoUrl, ytId]);
  const isYT = !!ytId;
  const isVimeo = !!vimeoId;
  const hasSync = isYT || isVimeo || isSC;
  const embedUrl = useMemo(() => hasSync ? null : getEmbedUrl(videoUrl), [videoUrl, hasSync]);

  // Metronome callback
  const countingInRef = useRef(false);
  useEffect(() => {
    syncCbRef.current = evt => {
      try {
        if (evt.type === "countIn") {
          countingInRef.current = true;
          setSyncCountIn(true);
          setSyncBar({ ab: 0, bei: evt.beatInBar - 1, bt: evt.beatInBar === 1 ? 0 : 2, tsN: evt.totalBeats, tsD: 0, tempo: 0, si: 0, countIn: true, beatsLeft: evt.beatsLeft });
        } else if (evt.type === "beat") {
          if (countingInRef.current) {
            countingInRef.current = false;
            setSyncCountIn(false);
            try { if (playerRef.current?.playVideo) playerRef.current.playVideo(); } catch {}
          }
          const bar = { ab: evt.ab, bei: evt.beatIdx, bt: evt.bt, tsN: evt.tsN, tsD: evt.tsD, tempo: evt.tempo, si: evt.si };
          setSyncBar(bar); syncBarRef.current = bar;
        } else if (evt.type === "ended") { setSyncEnded(true); setSyncActive(false); syncActiveRef.current = false; met.stop(); try { if (playerRef.current?.pauseVideo) playerRef.current.pauseVideo(); } catch {} }
      } catch {}
    };
  }, [met]);

  // YouTube API
  useEffect(() => {
    if (!isYT) return;
    const loadApi = () => {
      if (window.YT && window.YT.Player) { initPlayer(); return; }
      if (document.querySelector('script[src*="youtube.com/iframe_api"]')) { window.onYouTubeIframeAPIReady = initPlayer; return; }
      const tag = document.createElement("script"); tag.src = "https://www.youtube.com/iframe_api"; document.head.appendChild(tag); window.onYouTubeIframeAPIReady = initPlayer;
    };
    const initPlayer = () => {
      if (!containerRef.current || playerRef.current) return;
      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId: ytId, playerVars: { rel: 0, modestbranding: 1, playsinline: 1 },
        events: {
          onReady: () => { setReady(true); setDuration(playerRef.current.getDuration() || 0); },
          onStateChange: e => {
            const isPlay = e.data === window.YT.PlayerState.PLAYING;
            const isPause = e.data === window.YT.PlayerState.PAUSED;
            setVidPlaying(isPlay);
            handleVidStateChange(isPlay, isPause);
          }
        }
      });
    };
    loadApi();
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [isYT, ytId]);

  // Vimeo API
  useEffect(() => {
    if (!isVimeo) return;
    const loadApi = () => {
      if (window.Vimeo && window.Vimeo.Player) { initPlayer(); return; }
      if (document.querySelector('script[src*="player.vimeo.com/api"]')) { const check = setInterval(() => { if (window.Vimeo?.Player) { clearInterval(check); initPlayer(); } }, 100); return; }
      const tag = document.createElement("script"); tag.src = "https://player.vimeo.com/api/player.js"; tag.onload = () => initPlayer(); document.head.appendChild(tag);
    };
    const initPlayer = () => {
      if (!containerRef.current || playerRef.current) return;
      const vp = new window.Vimeo.Player(containerRef.current, { id: parseInt(vimeoId), responsive: true });
      playerRef.current = vp;
      vp.playVideo = () => vp.play();
      vp.pauseVideo = () => vp.pause();
      vp.seekTo = (t) => vp.setCurrentTime(t);
      vp.getCurrentTime = () => vp._lastTime || 0;
      vp.getDuration = () => vp._dur || 0;
      vp.on("loaded", () => { vp.getDuration().then(d => { vp._dur = d; setDuration(d); }); setReady(true); });
      vp.on("timeupdate", data => { vp._lastTime = data.seconds; setCurrentTime(data.seconds); });
      vp.on("play", () => { setVidPlaying(true); handleVidStateChange(true, false); });
      vp.on("pause", () => { setVidPlaying(false); handleVidStateChange(false, true); });
    };
    loadApi();
    return () => { if (playerRef.current && isVimeo) { try { playerRef.current.destroy(); } catch {} playerRef.current = null; } };
  }, [isVimeo, vimeoId]);

  // SoundCloud Widget API
  useEffect(() => {
    if (!isSC) return;
    const loadApi = () => {
      if (window.SC && window.SC.Widget) { initWidget(); return; }
      if (document.querySelector('script[src*="api.soundcloud.com/sdk"]') || document.querySelector('script[src*="w.soundcloud.com/player/api"]')) {
        const check = setInterval(() => { if (window.SC?.Widget) { clearInterval(check); initWidget(); } }, 100); return;
      }
      const tag = document.createElement("script"); tag.src = "https://w.soundcloud.com/player/api.js"; tag.onload = () => initWidget(); document.head.appendChild(tag);
    };
    const initWidget = () => {
      if (!containerRef.current || playerRef.current) return;
      const iframe = document.createElement("iframe");
      iframe.src = `https://w.soundcloud.com/player/?url=${encodeURIComponent(videoUrl)}&color=%23f0a030&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false&visual=true`;
      iframe.style.cssText = "position:absolute;top:0;left:0;width:100%;height:100%;border:none;";
      iframe.allow = "autoplay";
      containerRef.current.innerHTML = "";
      containerRef.current.appendChild(iframe);
      const widget = window.SC.Widget(iframe);
      playerRef.current = widget;
      widget.playVideo = () => widget.play();
      widget.pauseVideo = () => widget.pause();
      const scSeek = widget.seekTo.bind(widget);
      widget.seekTo = (t) => scSeek(t * 1000);
      widget._lastTime = 0;
      widget.bind(window.SC.Widget.Events.READY, () => {
        widget.getDuration(d => { widget._dur = d / 1000; setDuration(d / 1000); });
        setReady(true);
      });
      widget.bind(window.SC.Widget.Events.PLAY_PROGRESS, data => {
        widget._lastTime = data.currentPosition / 1000;
        setCurrentTime(data.currentPosition / 1000);
      });
      widget.bind(window.SC.Widget.Events.PLAY, () => { setVidPlaying(true); handleVidStateChange(true, false); });
      widget.bind(window.SC.Widget.Events.PAUSE, () => { setVidPlaying(false); handleVidStateChange(false, true); });
      widget.bind(window.SC.Widget.Events.FINISH, () => { setVidPlaying(false); handleVidStateChange(false, true); });
    };
    loadApi();
    return () => { if (playerRef.current && isSC) { try { playerRef.current.unbind(window.SC.Widget.Events.PLAY); playerRef.current.unbind(window.SC.Widget.Events.PAUSE); playerRef.current.unbind(window.SC.Widget.Events.PLAY_PROGRESS); } catch {} playerRef.current = null; } };
  }, [isSC, videoUrl]);

  // Shared video state change handler
  const handleVidStateChange = (isPlay, isPause) => {
    try {
      const m = metRef.current, t = tlRef.current, st = settingsRef.current;
      if (!m || !t) return;
      if (isPlay && !syncActiveRef.current && !countingInRef.current && t.length > 0) {
        m.setCb(syncCbRef.current); m.tap();
        const bar = syncBarRef.current;
        const fromBar = bar ? t.findIndex(b => b.ab === bar.ab) : 0;
        m.start(t, Math.max(0, fromBar >= 0 ? fromBar : 0), 0, { accented: st.accented, clickSound: st.clickSound, muted: mutedRef.current });
        setSyncActive(true); syncActiveRef.current = true; setSyncEnded(false);
      } else if (isPause && syncActiveRef.current && !countingInRef.current) {
        m.stop(); setSyncActive(false); syncActiveRef.current = false;
        setSyncBar(null); syncBarRef.current = null;
      }
    } catch {}
  };

  // Poll time (YouTube only)
  useEffect(() => {
    if (!isYT) return;
    if (vidPlaying && playerRef.current) {
      pollRef.current = setInterval(() => { try { const t = playerRef.current.getCurrentTime(); if (typeof t === "number") setCurrentTime(t); } catch {} }, 100);
    } else { if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; } }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [vidPlaying, isYT]);

  // Auto-stop at END marker
  useEffect(() => {
    if (endPt == null || !syncActiveRef.current || !vidPlaying) return;
    if (currentTime >= endPt) {
      try { if (playerRef.current?.pauseVideo) playerRef.current.pauseVideo(); } catch {}
      met.stop(); setSyncActive(false); syncActiveRef.current = false;
      setSyncEnded(true);
    }
  }, [currentTime, endPt, vidPlaying, met]);

  const seekTo = useCallback(t => { try { if (playerRef.current?.seekTo) { playerRef.current.seekTo(t, true); setCurrentTime(t); } else if (playerRef.current?.setCurrentTime) { playerRef.current.setCurrentTime(t); setCurrentTime(t); } } catch {} }, []);

  const getElapsedToBar = useCallback((tlArr, barIdx) => {
    let t = 0;
    for (let i = 0; i < barIdx && i < tlArr.length; i++) {
      const b = tlArr[i];
      if (b.isT) { t += b.tDur || 0; } else {
        const pbc = b.perBeatCd;
        for (let j = 0; j < b.cpb; j++) t += pbc ? (pbc[j]?.cd ?? pbc[0]?.cd ?? 0.5) : (b.cd ?? 0.5);
      }
    }
    return t;
  }, []);

  const seekVideoToBar = useCallback((barIdx) => {
    if (!playerRef.current?.seekTo) return;
    const elapsed = getElapsedToBar(tl, barIdx);
    const videoTime = (startPt || 0) + elapsed;
    playerRef.current.seekTo(videoTime, true);
    setCurrentTime(videoTime);
  }, [tl, startPt, getElapsedToBar]);

  const syncPlayFromStart = () => {
    if (!hasSync || !tl.length) return;
    met.setCb(syncCbRef.current);
    seekTo(startPt || 0);
    setSyncBar(null); syncBarRef.current = null;
    countingInRef.current = vidCountIn > 0;
    setSyncCountIn(vidCountIn > 0);
    setTimeout(() => {
      if (vidCountIn === 0 && playerRef.current) playerRef.current.playVideo();
      met.tap(); met.start(tl, 0, vidCountIn, { accented: settings.accented, clickSound: settings.clickSound, muted });
      setSyncActive(true); syncActiveRef.current = true; setSyncEnded(false);
    }, 200);
  };

  const syncToggle = () => {
    if (syncActive) {
      if (playerRef.current) playerRef.current.pauseVideo();
      met.stop(); setSyncActive(false); syncActiveRef.current = false;
      setSyncBar(null); syncBarRef.current = null;
      countingInRef.current = false; setSyncCountIn(false);
    } else {
      if (!tl.length) return;
      met.setCb(syncCbRef.current);
      const fromBar = syncBar ? tl.findIndex(b => b.ab === syncBar.ab) : 0;
      const idx = Math.max(0, fromBar >= 0 ? fromBar : 0);
      seekVideoToBar(idx);
      const useCI = vidCountIn > 0;
      countingInRef.current = useCI;
      setSyncCountIn(useCI);
      setTimeout(() => {
        if (!useCI && playerRef.current) playerRef.current.playVideo();
        met.tap(); met.start(tl, idx, vidCountIn, { accented: settings.accented, clickSound: settings.clickSound, muted });
        setSyncActive(true); syncActiveRef.current = true; setSyncEnded(false);
      }, 150);
    }
  };

  const jumpSec = d => {
    const curSi = syncBar ? syncBar.si : 0;
    const ns = Math.max(0, Math.min(sections.length - 1, curSi + d));
    const i = tl.findIndex(b => b.si === ns);
    if (i >= 0) {
      const b = tl[i];
      const bar = { ab: b.ab, bei: 0, bt: 0, tsN: b.tsN, tsD: b.tsD, tempo: b.tempo, si: b.si };
      setSyncBar(bar); syncBarRef.current = bar;
      setSyncEnded(false);
      if (syncActive) { met.stop(); if (playerRef.current) playerRef.current.pauseVideo(); setSyncActive(false); syncActiveRef.current = false; }
      seekVideoToBar(i);
    }
  };

  const setStart = () => setStartPt(currentTime);
  const setEnd = () => setEndPt(currentTime);
  const NUDGE = 0.05;
  const nudge = (which, delta) => {
    if (which === "start") { const v = Math.max(0, (startPt || 0) + delta); setStartPt(v); seekTo(v); }
    else { const v = Math.max(0, (endPt || 0) + delta); setEndPt(v); seekTo(v); }
  };
  const handleSave = () => { if (onSyncPoints) onSyncPoints({ start: startPt, end: endPt }); };

  const adjustTempo = delta => {
    if (!syncBar || !onUpdateSections) return;
    const si = syncBar.si;
    onUpdateSections(prev => prev.map((s, i) => i === si && s.type === "metered" ? { ...s, tempo: Math.max(10, Math.min(400, s.tempo + delta)) } : s));
  };

  useEffect(() => () => { met.stop(); met.setCb(null); }, [met]);
  const curSec = syncBar != null ? sections[syncBar.si] : null;

  const [editMode, setEditMode] = useState(false);
  const [goBar, setGoBar] = useState("");

  const { tap: vidTap, tapBpm: vidTapBpm, tapFlash: vidTapFlash } = useTapTempo(useCallback(bpm => {
    if (!syncBar || !onUpdateSections) return;
    const si = syncBar.si;
    onUpdateSections(prev => prev.map((s, i) => i === si && s.type === "metered" ? { ...s, tempo: bpm } : s));
  }, [syncBar, onUpdateSections]));

  const handleGoToBar = () => {
    const v = parseInt(goBar);
    if (isNaN(v) || v < 1 || !tl.length) return;
    const i = tl.findIndex(b => b.ab === v);
    if (i < 0) return;
    const b = tl[i];
    const bar = { ab: b.ab, bei: 0, bt: 0, tsN: b.tsN, tsD: b.tsD, tempo: b.tempo, si: b.si };
    setSyncBar(bar); syncBarRef.current = bar;
    setSyncEnded(false);
    if (syncActive) { met.stop(); if (playerRef.current) playerRef.current.pauseVideo(); setSyncActive(false); syncActiveRef.current = false; }
    seekVideoToBar(i);
    setGoBar("");
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: C.bg, zIndex: 50, display: "flex", justifyContent: "center", fontFamily: "'DM Mono',monospace" }}>
      <div style={{ width: "100%", maxWidth: 540, display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 16px", flexShrink: 0 }}>
        <div style={{ fontSize: 11, color: C.textMuted }}>{fmtTime(currentTime)} / {fmtTime(duration)}</div>
        <div style={{ display: "flex", gap: 6 }}>
          {(startPt != null || endPt != null) && <button onClick={handleSave} style={{ padding: "3px 8px", borderRadius: 6, border: `1px solid ${C.downbeat}55`, background: C.downbeat + "15", color: C.downbeat, fontSize: 10, cursor: "pointer" }}>Sync</button>}
          <button onClick={() => setShowVidSave(true)} style={{ padding: "3px 8px", borderRadius: 6, border: `1px solid ${C.border}`, background: "transparent", color: C.textMuted, cursor: "pointer", display: "flex", alignItems: "center" }}>{I.save(14)}</button>
          <button className="close-btn" onClick={handleClose}>{I.x(18)}</button>
        </div>
      </div>

      {/* Video */}
      <div style={{ flexShrink: 0, padding: "0 12px", marginBottom: 6 }}>
        <div style={{ position: "relative", paddingBottom: "36%", borderRadius: 8, overflow: "hidden", background: "#000" }}>
          {isYT ? <div ref={containerRef} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }} />
            : isVimeo ? <div ref={containerRef} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }} />
            : isSC ? <div ref={containerRef} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }} />
            : embedUrl ? <iframe src={embedUrl} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
              : <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>{isSafeUrl(videoUrl) ? <a href={videoUrl} target="_blank" rel="noopener noreferrer" style={{ color: C.accent, fontSize: 11 }}>Open in browser</a> : <span style={{ color: C.danger, fontSize: 11 }}>Invalid URL Format</span>}</div>}
        </div>
      </div>

      {/* Start / End */}
      {hasSync && <div style={{ display: "flex", gap: 6, padding: "0 12px", marginBottom: 6, flexShrink: 0 }}>
        <div style={{ flex: 1, background: C.surface, borderRadius: 8, padding: "6px 8px", border: `1px solid ${startPt != null ? C.practice + "44" : C.border}` }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: startPt != null ? 4 : 0 }}>
            <span style={{ fontSize: 9, color: C.practice, fontWeight: 600 }}>START</span>
            <button onClick={setStart} style={{ padding: "2px 6px", borderRadius: 4, border: `1px solid ${C.practice}44`, background: "transparent", color: C.practice, fontSize: 9, cursor: "pointer" }}>Set</button>
          </div>
          {startPt != null && <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
            <button onClick={() => nudge("start", -NUDGE)} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 4, color: C.textMuted, cursor: "pointer", padding: "1px 4px", fontSize: 10 }}>←</button>
            <div style={{ fontSize: 12, color: C.text, flex: 1, textAlign: "center", cursor: "pointer" }} onClick={() => seekTo(startPt)}>{fmtTime(startPt)}</div>
            <button onClick={() => nudge("start", NUDGE)} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 4, color: C.textMuted, cursor: "pointer", padding: "1px 4px", fontSize: 10 }}>→</button>
          </div>}
        </div>
        <div style={{ flex: 1, background: C.surface, borderRadius: 8, padding: "6px 8px", border: `1px solid ${endPt != null ? C.record + "44" : C.border}` }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: endPt != null ? 4 : 0 }}>
            <span style={{ fontSize: 9, color: C.record, fontWeight: 600 }}>END</span>
            <button onClick={setEnd} style={{ padding: "2px 6px", borderRadius: 4, border: `1px solid ${C.record}44`, background: "transparent", color: C.record, fontSize: 9, cursor: "pointer" }}>Set</button>
          </div>
          {endPt != null && <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
            <button onClick={() => nudge("end", -NUDGE)} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 4, color: C.textMuted, cursor: "pointer", padding: "1px 4px", fontSize: 10 }}>←</button>
            <div style={{ fontSize: 12, color: C.text, flex: 1, textAlign: "center", cursor: "pointer" }} onClick={() => seekTo(endPt)}>{fmtTime(endPt)}</div>
            <button onClick={() => nudge("end", NUDGE)} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 4, color: C.textMuted, cursor: "pointer", padding: "1px 4px", fontSize: 10 }}>→</button>
          </div>}
        </div>
      </div>}

      {/* Middle: Sections or Metronome */}
      {syncCountIn && syncBar ? (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 16px" }}>
          <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 4 }}>Count-in</div>
          <div style={{ fontSize: 48, color: C.downbeat, fontFamily: "'Bebas Neue','DM Mono',monospace", letterSpacing: 2 }}>{syncBar.beatsLeft || ""}</div>
          {syncBar.tsN > 0 && <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 10 }}>
            {Array.from({ length: syncBar.tsN }).map((_, i) => {
              const on = i === syncBar.bei, c = i === 0 ? C.downbeat : C.sub;
              return <div key={i} style={{ width: on ? 14 : 8, height: on ? 14 : 8, borderRadius: "50%", background: on ? c : `${c}55`, transition: "all 0.06s", border: on ? `2px solid ${c}` : "2px solid transparent" }} />;
            })}
          </div>}
        </div>
      ) : (syncActive || (syncBar && !syncEnded)) && syncBar ? (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 16px", minHeight: 0, position: "relative" }}>
          <button onClick={() => setEditMode(e => !e)} style={{ position: "absolute", top: 4, right: 16, background: "none", border: `1px solid ${editMode ? C.accent + "55" : C.border}`, borderRadius: 6, color: editMode ? C.accent : C.textMuted, cursor: "pointer", padding: "3px 8px", fontSize: 10, fontFamily: "'DM Mono',monospace" }}>{editMode ? "🔓" : "🔒"}</button>

          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", lineHeight: 1.1 }}>
              <span style={{ fontSize: 16, color: C.textMuted, fontWeight: 700 }}>{syncBar.tsN}</span>
              <div style={{ height: 1, width: 24, background: C.textMuted }} />
              <span style={{ fontSize: 16, color: C.textMuted, fontWeight: 700 }}>{syncBar.tsD}</span>
            </div>
            <div style={{ fontSize: 64, fontWeight: 400, color: C.text, fontFamily: "'Bebas Neue','DM Mono',monospace", letterSpacing: 2, minWidth: 70, textAlign: "center" }}>{syncBar.ab}</div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
              <span style={{ fontSize: 24, color: C.downbeat, fontWeight: 700 }}>{syncBar.tempo}</span>
              <span style={{ fontSize: 9, color: C.textMuted }}>BPM</span>
            </div>
          </div>
          {syncBar.tsN > 0 && <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 10 }}>
            {Array.from({ length: syncBar.tsN }).map((_, i) => {
              const on = i === syncBar.bei, c = i === 0 ? C.downbeat : C.sub;
              return <div key={i} style={{ width: on ? 14 : 8, height: on ? 14 : 8, borderRadius: "50%", background: on ? c : `${c}55`, transition: "all 0.06s", border: on ? `2px solid ${c}` : "2px solid transparent" }} />;
            })}
          </div>}
          <div style={{ fontSize: 11, color: C.textMuted, marginTop: 6 }}>Sec {syncBar.si + 1}/{sections.length} · {fmtTime(currentTime)}</div>

          {editMode && (
            <div style={{ width: "100%", maxWidth: 300, marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
              {curSec && curSec.type === "metered" && (
                <div style={{ background: C.surface, borderRadius: 10, padding: 10, border: `1px solid ${C.accent}44` }}>
                  <div style={{ fontSize: 9, color: C.accent, fontWeight: 600, marginBottom: 6, textAlign: "center" }}>Section {syncBar.si + 1} Tempo</div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                    <button onClick={() => adjustTempo(-5)} style={{ ...tS, width: 34, height: 34, fontSize: 10 }}>-5</button>
                    <button onClick={() => adjustTempo(-1)} style={{ ...tS, width: 34, height: 34, fontSize: 10 }}>-1</button>
                    <div style={{ fontSize: 22, color: C.text, fontWeight: 700, minWidth: 50, textAlign: "center" }}>{curSec.tempo}</div>
                    <button onClick={() => adjustTempo(1)} style={{ ...tS, width: 34, height: 34, fontSize: 10 }}>+1</button>
                    <button onClick={() => adjustTempo(5)} style={{ ...tS, width: 34, height: 34, fontSize: 10 }}>+5</button>
                  </div>
                </div>
              )}
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                  {vidTapBpm && <span style={{ fontSize: 10, color: C.downbeat, fontFamily: "'DM Mono',monospace", fontWeight: 600 }}>{vidTapBpm}</span>}
                  <button onClick={vidTap} style={{ background: vidTapFlash ? C.downbeat : C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 14px", cursor: "pointer", color: vidTapFlash ? "#000" : C.textMuted, fontFamily: "'DM Mono',monospace", fontSize: 12, transition: "background 0.1s, color 0.1s" }}>TAP</button>
                </div>
                <div style={{ flex: 1, display: "flex", gap: 4, alignItems: "center" }}>
                  <input value={goBar} onChange={e => setGoBar(e.target.value)} onKeyDown={e => { if (e.key === "Enter") handleGoToBar(); }} placeholder="Bar #" inputMode="numeric" style={{ ...nI, flex: 1, textAlign: "center", padding: "0 8px", fontSize: 13, height: 38 }} />
                  <button onClick={handleGoToBar} style={{ ...tS, width: 38, height: 38, fontSize: 11, fontFamily: "'DM Mono',monospace" }}>Go</button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : syncActive && !syncBar ? (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontSize: 14, color: C.textMuted }}>Starting...</div>
        </div>
      ) : syncEnded ? (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 16px" }}>
          <div style={{ fontSize: 48, color: C.downbeat, fontFamily: "'Bebas Neue','DM Mono',monospace", letterSpacing: 2 }}>END</div>
          <div style={{ fontSize: 12, color: C.textMuted, marginTop: 8 }}>Tap restart or go back to sections</div>
          <button onClick={() => { setSyncBar(null); setSyncEnded(false); }} style={{ marginTop: 12, padding: "6px 14px", borderRadius: 6, border: `1px solid ${C.border}`, background: "transparent", color: C.textMuted, fontSize: 11, cursor: "pointer" }}>Back to sections</button>
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: "auto", padding: "4px 12px 16px", minHeight: 0 }}>
          <div style={{ display: "flex", gap: 8, fontSize: 11, color: C.textMuted, marginBottom: 6 }}><span>{sections.length} sec</span></div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {sections.map((sec, i) => {
              const isT = sec.type === "timed";
              return (<div key={sec.id} onClick={() => onEditSection && onEditSection(sec.id)} style={{ background: C.surface, borderRadius: 8, padding: "8px 10px", border: `1px solid ${C.border}`, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 20, alignItems: "center" }}>
                  <button onClick={e => { e.stopPropagation(); onMoveSection && onMoveSection(i, -1); }} disabled={i === 0} style={{ background: "none", border: "none", color: i === 0 ? C.border : C.textMuted, cursor: i === 0 ? "default" : "pointer", padding: 1, display: "flex", fontSize: 10 }}>▲</button>
                  <span style={{ fontSize: 9, color: C.textMuted }}>{i + 1}</span>
                  <button onClick={e => { e.stopPropagation(); onMoveSection && onMoveSection(i, 1); }} disabled={i === sections.length - 1} style={{ background: "none", border: "none", color: i === sections.length - 1 ? C.border : C.textMuted, cursor: i === sections.length - 1 ? "default" : "pointer", padding: 1, display: "flex", fontSize: 10 }}>▼</button>
                </div>
                {isT ? <div style={{ flex: 1, fontSize: 12, color: C.text }}>{sec.duration}s free</div> : (<>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.text, minWidth: 24, textAlign: "center", lineHeight: 1 }}><div>{sec.tsNum}</div><div style={{ height: 1, background: C.textMuted, margin: "1px 0" }} /><div>{sec.tsDen}</div></div>
                  <div style={{ flex: 1, fontSize: 12, color: C.text }}>{sec.tempo} BPM</div>
                  <div style={{ fontSize: 11, color: sec.loop ? C.downbeat : C.textMuted }}>{sec.loop ? "∞" : `${sec.bars}b`}</div>
                </>)}
                {onDeleteSection && sections.length > 1 && <button onClick={e => { e.stopPropagation(); onDeleteSection(sec.id); }} style={{ background: "none", border: "none", color: C.danger + "77", cursor: "pointer", padding: 2, display: "flex" }}>{I.trash(12)}</button>}
              </div>);
            })}
            <button onClick={() => onAddSection && onAddSection()} style={{ width: "100%", padding: 10, borderRadius: 8, border: `1px dashed ${C.border}`, background: "transparent", color: C.textMuted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>{I.plus(16)}</button>
          </div>
        </div>
      )}

      {/* Transport */}
      <div style={{ display: "flex", gap: 10, justifyContent: "center", alignItems: "center", padding: "8px 0 20px", flexShrink: 0 }}>
        <button onClick={syncPlayFromStart} style={{ ...tS, width: 40, height: 40, flexShrink: 0 }}>{I.restart(18)}</button>
        <button onClick={syncToggle} style={{ width: 52, height: 52, borderRadius: "50%", background: C.accent, border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{syncActive ? I.pause(20) : I.play(20)}</button>
        <button onClick={() => setVidCountIn(v => (v + 1) % 3)} style={{ padding: "4px 6px", borderRadius: 8, border: `1px solid ${vidCountIn > 0 ? C.accent + "55" : C.border}`, background: vidCountIn > 0 ? C.accent + "15" : "transparent", color: vidCountIn > 0 ? C.accent : C.textMuted, fontSize: 9, cursor: "pointer", fontFamily: "'DM Mono',monospace", width: 48, textAlign: "center", flexShrink: 0 }}>{vidCountIn === 0 ? "Off" : vidCountIn === 1 ? "1 Bar" : "2 Bars"}</button>
      </div>

      {!hasSync && <div style={{ position: "absolute", top: "50%", left: 16, right: 16, textAlign: "center", transform: "translateY(-50%)" }}><div style={{ fontSize: 12, color: C.textMuted }}>Sync is available for YouTube, Vimeo, and SoundCloud.</div></div>}
      </div>
      {showVidSave && <SaveM sections={sections} onClose={() => { setShowVidSave(false); }} onSaved={() => { initSnap.current = { sections: JSON.stringify(sections), startPt, endPt }; if (showClosePrompt) { setShowClosePrompt(false); onClose(); } }} videoUrl={videoUrl} videoSync={{ start: startPt, end: endPt }} loadedProfileId={loadedProfileId} />}
      {showClosePrompt && !showVidSave && <div className="modal-bg" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 110, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setShowClosePrompt(false)}>
        <div className="modal-content" style={{ width: "100%", maxWidth: 320, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 16, padding: "24px 20px", textAlign: "center" }} onClick={e => e.stopPropagation()}>
          <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 15, color: C.text, fontWeight: 600, marginBottom: 6 }}>Unsaved Changes</div>
          <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 20, fontFamily: "'Outfit',sans-serif" }}>You have unsaved changes in this session.</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <button onClick={() => { setShowClosePrompt(false); setShowVidSave(true); }} style={{ width: "100%", padding: 11, borderRadius: 8, border: "none", background: C.accent, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>Save Changes</button>
            <button onClick={() => { setShowClosePrompt(false); if (onUpdateSections) { try { onUpdateSections(JSON.parse(initSnap.current.sections)); } catch {} } onClose(); }} style={{ width: "100%", padding: 11, borderRadius: 8, border: `1px solid ${C.danger}55`, background: "transparent", color: C.danger, fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>Discard</button>
            <button onClick={() => setShowClosePrompt(false)} style={{ width: "100%", padding: 11, borderRadius: 8, border: `1px solid ${C.border}`, background: "transparent", color: C.textMuted, fontSize: 13, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>Cancel</button>
          </div>
        </div>
      </div>}
    </div>
  );
}
