import React, { useState, useRef, useEffect } from "react";
import { C } from "./utils";
import { I, nI } from "./components";
import { t } from "./i18n";

// ============ PLAY VIEW STYLES ============
const nv = { padding: "8px 14px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, color: C.text, cursor: "pointer", fontFamily: "'DM Mono',monospace", display: "flex", alignItems: "center", justifyContent: "center" };
const tB = { width: 56, height: 56, borderRadius: "50%", border: "none", background: C.downbeat, color: "#000", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 24px ${C.downbeat}33` };
export const tS = { width: 44, height: 44, borderRadius: 10, border: `1px solid ${C.border}`, background: C.surface, color: C.text, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" };
const qS = { padding: "4px 10px", borderRadius: 6, border: `1px solid ${C.border}`, background: "transparent", color: C.textMuted, cursor: "pointer", fontSize: 10, fontFamily: "'DM Mono',monospace", whiteSpace: "nowrap", minWidth: 44 };

// ============ PLAY VIEW ============
export default function PlayView({ ps, sections, tl, flashFnRef, onPause, onResume, onRestart, onGoToBar, onPrevSec, onNextSec, vis, isP, muted, onMute, onExit, mode, onSplit, onTapTempo, tapBpm, tapFlash, settings, onSettings, syncLocked }) {
  const SYNC_COLOR = "#06b6d4";
  const { absoluteBar: ab, beatIndex: bei, beatType: bt, tsNum: tsN, tsDen: tsD, sectionIndex: si, isTimed: isT, countIn: isCI, ended: isEnded } = ps;
  const [goBar, setGoBar] = useState("");
  const [splitMsg, setSplitMsg] = useState(null);
  const splitMsgTimer = useRef(null);
  const mountReady = useRef(false);
  const overlayRef = useRef(null);
  const numRef = useRef(null);
  const flashTimer = useRef(null);
  useEffect(() => {
    if (!flashFnRef) return;
    flashFnRef.current = (beatType) => {
      if (overlayRef.current) {
        const c = beatType === 0 ? C.downbeat : beatType === 1 ? C.accent : C.text;
        const o = beatType === 0 ? 0.35 : beatType === 1 ? 0.2 : 0.08;
        overlayRef.current.style.background = c;
        overlayRef.current.style.opacity = o;
      }
      if (numRef.current && beatType === 0) numRef.current.classList.add("pump");
      if (flashTimer.current) clearTimeout(flashTimer.current);
      flashTimer.current = setTimeout(() => {
        if (overlayRef.current) overlayRef.current.style.opacity = "0";
        if (numRef.current) numRef.current.classList.remove("pump");
      }, 80);
    };
    return () => { flashFnRef.current = null; if (flashTimer.current) clearTimeout(flashTimer.current); };
  }, [flashFnRef]);
  useEffect(() => { const tm = setTimeout(() => { mountReady.current = true; }, 600); return () => clearTimeout(tm); }, []);
  const lastAction = useRef(0);
  const guardedAction = fn => () => { const now = Date.now(); if (!mountReady.current || now - lastAction.current < 250) return; lastAction.current = now; fn(); };
  useEffect(() => () => { if (splitMsgTimer.current) clearTimeout(splitMsgTimer.current); }, []);
  const showF = vis === "flash" || vis === "dots+flash", showD = vis === "dots" || vis === "dots+flash";
  const borderColor = mode === "record" ? C.record : mode === "practice" ? C.practice : mode === "sync" ? SYNC_COLOR : null;
  const nxt = sections[si + 1]; let upN = null;
  if (nxt && !isCI) { if (isT) { if (ps.remaining != null && ps.remaining <= 10) upN = nxt.type === "timed" ? `${nxt.duration}s ${t("free_dur")}` : `${nxt.tsNum}/${nxt.tsDen} ${t("at_tempo")} ${nxt.tempo}`; } else { const bis = tl.filter(b => b.si === si); if (bis.length > 0 && bis[bis.length - 1].ab - ab <= 1) upN = nxt.type === "timed" ? `${nxt.duration}s ${t("free_dur")}` : `${nxt.tsNum}/${nxt.tsDen} ${t("at_tempo")} ${nxt.tempo}`; } }
  const isRec = mode === "record";

  const handleTap = e => { if (isRec && onSplit) { const el = e.target; if (el.closest && (el.closest("button") || el.closest("input"))) return; onSplit(ab); setSplitMsg(`${t("marked_bar")} ${ab}`); if (splitMsgTimer.current) clearTimeout(splitMsgTimer.current); splitMsgTimer.current = setTimeout(() => setSplitMsg(null), 1200); } };

  const cR = 120, cC = 2 * Math.PI * cR; let prg = 0;
  if (isEnded) prg = 1;
  else if (isCI) prg = tsN > 0 ? (bei + 1) / tsN : 0;
  else if (isT && ps.remaining != null) prg = 1 - (ps.remaining / (sections[si]?.duration || 1));
  else if (!isT) { const bs = tl.filter(b => b.si === si); if (bs.length) { const total = bs.length, c = ab - bs[0].ab, bp = bei / Math.max(1, tsN); prg = (c + bp) / total; } }
  const sDo = cC - (prg * cC);
  const showNav = !isP || isEnded;

  return (
    <div onClick={handleTap} style={{ position: "fixed", inset: 0, background: C.bg, zIndex: 50, fontFamily: "'DM Mono',monospace", boxShadow: borderColor ? `inset 0 0 0 4px ${borderColor}, inset 0 0 30px ${borderColor}44` : undefined }}>
      {showF && <div ref={overlayRef} style={{ position: "absolute", inset: 0, opacity: 0, transition: "opacity 0.05s", pointerEvents: "none" }} />}
      {splitMsg && <div style={{ position: "absolute", inset: 0, background: C.record, opacity: 0.15, pointerEvents: "none", transition: "opacity 0.3s" }} />}

      {/* TOP BAR */}
      <div style={{ position: "absolute", top: 16, left: 16, right: 16, display: "flex", justifyContent: "space-between", zIndex: 2 }}>
        <button onClick={onMute} data-tip-b={muted ? t("unmute") : t("mute")} style={tS}>{muted ? I.volOff(18) : I.volOn(18)}</button>
        <div style={{ display: "flex", gap: 8 }}>
          {isRec && <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: C.record, display: "flex", alignItems: "center", gap: 4, animation: "pulse 2s infinite" }}>{I.rec(12)} {t("rec")}</div>}
          {mode === "practice" && ps.pctLabel && !isEnded && <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 13, color: C.practice, fontWeight: 600 }}>{ps.pctLabel}</div>}
          <button onClick={onExit} data-tip-b={t("exit")} style={tS}>{I.x(18)}</button>
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
            {isEnded ? "" : isCI ? <><span style={{ fontSize: 14 }}>{t("count_in")}</span><span style={{ fontSize: 14, color: C.downbeat, fontWeight: 600 }}>{t("bar_n")} {ab}</span></> : isT ? <span style={{ display: "flex", alignItems: "center", gap: 6 }}>{I.clock(18)} {t("free")}</span> : (<><span>{tsN}</span><div style={{ height: 1, width: 30, background: C.textMuted, margin: "2px 0" }} /><span>{tsD}</span></>)}
          </div>
          <div ref={numRef} className="hdr-text" style={{ fontFamily: "'Bebas Neue','DM Mono',monospace", fontSize: isEnded ? 80 : 110, fontWeight: 400, color: isEnded ? C.downbeat : C.text, lineHeight: 1, position: "relative", zIndex: 1, letterSpacing: 2 }}>
            {isEnded ? t("end_label") : isCI ? "—" : ps.fermata ? (<><span style={{ fontSize: 24, position: "absolute", top: -10 }}>𝄐</span>{ps.fermataRem != null ? ps.fermataRem.toFixed(1) : "—"}</>) : isT ? (ps.remaining != null ? ps.remaining.toFixed(1) : "—") : ab}
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
            {upN && <div style={{ color: C.downbeat, fontSize: 13, fontWeight: 600, animation: "pulse 2s infinite" }}>{t("up_next")} {upN}</div>}
          </>}
        </div>
        <div style={{ height: 24, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 4 }}>
          {showD && !isT && !isCI && !isEnded && <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", maxWidth: 280 }}>{(ps.allBeatTypes || []).map((b, i) => { const on = i === bei, c = b === 0 ? C.downbeat : b === 1 ? C.accent : C.sub; return <div key={i} style={{ width: on ? 16 : 10, height: on ? 16 : 10, borderRadius: "50%", background: on ? c : `${c}55`, transition: "all 0.1s cubic-bezier(0.34, 1.56, 0.64, 1)", border: on ? `2px solid ${c}` : "2px solid transparent", transform: on ? "scale(1.1)" : "scale(1)", boxShadow: on ? `0 0 10px ${c}66` : "none" }} />; })}</div>}
          {showD && isT && !isEnded && ps.totalMarkers > 0 && <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", maxWidth: 280 }}>{Array.from({ length: ps.totalMarkers }).map((_, i) => { const on = i === ps.markerIdx, past = i < (ps.markerIdx || 0); return <div key={i} style={{ width: on ? 16 : 10, height: on ? 16 : 10, borderRadius: "50%", background: on ? C.downbeat : past ? `${C.downbeat}88` : `${C.sub}55`, transition: "all 0.1s cubic-bezier(0.34, 1.56, 0.64, 1)", border: on ? `2px solid ${C.downbeat}` : "2px solid transparent", transform: on ? "scale(1.1)" : "scale(1)", boxShadow: on ? `0 0 10px ${C.downbeat}66` : "none" }} />; })}</div>}
        </div>
        {/* Record hint - reserved height */}
        <div style={{ height: 20, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 4 }}>
          {isRec && isP && !isEnded && <span style={{ fontSize: 12, color: C.textMuted, fontFamily: "'Outfit',sans-serif", opacity: 0.8, animation: "pulse 3s infinite" }}>{t("tap_to_mark")}</span>}
        </div>
      </div>

      {/* BOTTOM CONTROLS - fixed */}
      {syncLocked ? (
        <div style={{ position: "absolute", bottom: 24, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, zIndex: 2 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 20, background: SYNC_COLOR + "15", border: `1px solid ${SYNC_COLOR}33` }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: SYNC_COLOR, boxShadow: `0 0 6px ${SYNC_COLOR}` }} />
            <span style={{ fontSize: 11, color: SYNC_COLOR, fontFamily: "'Outfit',sans-serif", fontWeight: 600 }}>{t("synced")}</span>
          </div>
        </div>
      ) : (
      <div style={{ position: "absolute", bottom: 24, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 12, zIndex: 2, pointerEvents: "none" }}>
        {/* Nav row - visibility hidden during play */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, visibility: showNav ? "visible" : "hidden", pointerEvents: showNav ? "auto" : "none", opacity: showNav ? 1 : 0, transition: "opacity 0.15s" }}>
          <button onClick={onPrevSec} data-tip={t("previous")} style={nv}>{I.chevL(18)}</button>
          <input type="text" inputMode="numeric" value={goBar} onChange={e => setGoBar(e.target.value)} placeholder={t("bar_hash")} style={{ ...nI, width: 64, fontSize: 14 }} onKeyDown={e => { if (e.key === "Enter") { const v = parseInt(goBar); if (!isNaN(v) && v > 0) { onGoToBar(v); } } }} />
          <button onClick={onNextSec} data-tip={t("next")} style={nv}>{I.chevR(18)}</button>
        </div>
        {/* Quick settings */}
        {settings && onSettings && <div style={{ display: "flex", gap: 6, justifyContent: "center", pointerEvents: "auto" }}>
          <button onClick={() => onSettings({ ...settings, accented: !settings.accented })} style={qS}>{settings.accented ? t("accent") : t("flat")}</button>
          <button onClick={() => { const all = settings.appMode === "advanced" ? ["sine", "noise", "wood", "rim", "clave", "cowbell"] : ["sine", "noise"]; const idx = Math.max(0, all.indexOf(settings.clickSound)); onSettings({ ...settings, clickSound: all[(idx + 1) % all.length] }); }} style={qS}>{{ sine: t("sound_sine"), noise: t("sound_noise"), wood: t("sound_wood"), rim: t("sound_rim"), clave: t("sound_clave"), cowbell: t("sound_cowbell") }[settings.clickSound] || t("sound_sine")}</button>
          <button onClick={() => { const m = ["dots", "dots+flash", "flash"]; const i = (m.indexOf(settings.visualMode) + 1) % m.length; onSettings({ ...settings, visualMode: m[i] }); }} style={qS}><span style={{ opacity: settings.visualMode.includes("dots") ? 1 : 0.25 }}>●</span> <span style={{ opacity: settings.visualMode.includes("flash") ? 1 : 0.25 }}>◻</span></button>
          <button onClick={() => onSettings({ ...settings, countIn: (settings.countIn + 1) % 3 })} style={qS}>{settings.countIn === 0 ? t("no_count_in") : `${settings.countIn} ${t("n_count_in")}`}</button>
        </div>}
        {/* Transport */}
        <div style={{ display: "flex", gap: 16, alignItems: "center", pointerEvents: "auto" }}>
          <div style={{ width: 44, display: "flex", justifyContent: "center" }}>
            {showNav && <button onClick={onRestart} data-tip={t("restart")} style={tS}>{I.restart(18)}</button>}
          </div>
          <button onClick={guardedAction(() => { const v = parseInt(goBar); if (isP) { onPause(); } else { onResume(!isNaN(v) && v > 0 ? v : null); setGoBar(""); } })} data-tip={isP ? t("pause") : t("play")} style={tB}>{isP ? I.pause(22) : I.play(22)}</button>
          <div style={{ width: 44, display: "flex", justifyContent: "center" }}>
            {mode === "normal" && onTapTempo ? <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, width: 44 }}>
              {tapBpm && <span style={{ fontSize: 10, color: C.downbeat, fontFamily: "'DM Mono',monospace", fontWeight: 600 }}>{tapBpm}</span>}
              <button onClick={onTapTempo} style={{ ...tS, background: tapFlash ? C.downbeat : C.surface, color: tapFlash ? "#000" : C.text, transition: "background 0.15s, color 0.15s" }}><span style={{ fontSize: 11, fontFamily: "'DM Mono',monospace" }}>{t("tap")}</span></button>
            </div> : null}
          </div>
        </div>
      </div>)}
    </div>);
}
