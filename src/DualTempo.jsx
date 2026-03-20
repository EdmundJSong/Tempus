import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useMetronome, useTapTempo } from "./metronome";
import { C, mkM, mkT, buildTL, pG, pM, _getLS, _setLS, gCD } from "./utils";
import { I, SecEd, NoteSVG } from "./components";

// ============ LANDSCAPE PROMPT ============
const LS_KEY = "tempus_dual_landscape_dismissed";

function LandscapePrompt({ onDismiss, onDontShowAgain }) {
  // Show on small screens (phones) regardless of orientation
  const isLargeScreen = typeof window !== "undefined" && Math.min(window.innerWidth, window.innerHeight) > 600;
  if (isLargeScreen) return null;
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.75)",
      display: "flex", alignItems: "center", justifyContent: "center",
      backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)"
    }} onClick={onDismiss}>
      <div style={{
        background: C.bg, border: `1px solid ${C.border}`, borderRadius: 16,
        padding: "28px 24px", maxWidth: 300, textAlign: "center",
        boxShadow: "0 20px 60px rgba(0,0,0,0.5)"
      }} onClick={e => e.stopPropagation()}>
        <div style={{ marginBottom: 16, lineHeight: 1, display: "flex", justifyContent: "center", color: C.textMuted }}>
          {I.desktop(48)}
        </div>
        <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 15, color: C.text, fontWeight: 600, marginBottom: 6 }}>
          Best on a larger screen
        </div>
        <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 12, color: C.textMuted, marginBottom: 20, lineHeight: 1.5 }}>
          Two side-by-side panels need room. Use portrait on mobile.
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <button onClick={onDismiss} style={{
            width: "100%", padding: 11, borderRadius: 8, border: "none",
            background: C.downbeat, color: "#000", fontSize: 13, fontWeight: 600,
            cursor: "pointer", fontFamily: "'Outfit',sans-serif"
          }}>Got it</button>
          <button onClick={onDontShowAgain} style={{
            width: "100%", padding: 9, borderRadius: 8,
            border: `1px solid ${C.border}`, background: "transparent",
            color: C.textMuted, fontSize: 11, cursor: "pointer",
            fontFamily: "'Outfit',sans-serif"
          }}>Don't show this again</button>
        </div>
      </div>
    </div>
  );
}

// ============ TOAST ============
function DualToast({ message }) {
  if (!message) return null;
  return (
    <div style={{
      position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", zIndex: 150,
      background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10,
      padding: "10px 18px", boxShadow: "0 8px 30px rgba(0,0,0,0.5)",
      fontSize: 12, color: C.text, fontFamily: "'Outfit',sans-serif",
      animation: "dualToastUp 0.25s ease-out", whiteSpace: "nowrap"
    }}>
      {message}
      <style>{`
        @keyframes dualToastUp { from { transform: translate(-50%, 20px); opacity: 0; } to { transform: translate(-50%, 0); opacity: 1; } }
      `}</style>
    </div>
  );
}

// ============ SECTION DURATION CALC ============
function getSectionDuration(sec) {
  if (sec.type === "timed") return sec.duration || 10;
  const cpb = sec.tsNum || 4;
  const bars = sec.loop ? 8 : (sec.bars || 1);
  const cd = gCD(sec.tempo || 120, sec.beatUnit || "q", sec.dotted || false, sec.tsDen || 4);
  return bars * cpb * cd;
}

// ============ PROPORTIONAL HEIGHTS ============
function useProportionalHeights(secA, secB) {
  return useMemo(() => {
    const allSections = [...secA, ...secB];
    if (!allSections.length) return { heightsA: [], heightsB: [] };
    const durA = secA.map(getSectionDuration);
    const durB = secB.map(getSectionDuration);
    const maxDur = Math.max(...durA, ...durB, 1);
    const MIN_H = 40, MAX_H = 110, SCALE_BASE = 55;
    const toH = d => Math.max(MIN_H, Math.min(MAX_H, MIN_H + (d / maxDur) * SCALE_BASE));
    return { heightsA: durA.map(toH), heightsB: durB.map(toH) };
  }, [secA, secB]);
}

// ============ PANEL DRAG HOOK ============
function usePanelDrag(sections, setSections, canEdit) {
  const [dragIdx, setDragIdx] = useState(null);
  const [dropIdx, setDropIdx] = useState(null);
  const [tDrag, setTDrag] = useState(null);
  const [tDropIdx, setTDropIdx] = useState(null);
  const cardRefs = useRef([]);
  const tDragTimer = useRef(null);

  const onGripTouchStart = useCallback((idx, e) => {
    if (!canEdit) return;
    const touch = e.touches[0];
    const startY = touch.clientY;
    tDragTimer.current = setTimeout(() => {
      if (navigator.vibrate) try { navigator.vibrate(20); } catch {}
      const positions = cardRefs.current.map(el => el ? el.getBoundingClientRect() : null);
      setTDrag({ idx, startY, offsetY: 0, positions });
      setTDropIdx(idx);
    }, 300);
  }, [canEdit]);

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
  }, [tDrag, tDropIdx, sections.length, setSections]);

  const cancelTouchDrag = useCallback(() => { if (tDragTimer.current) { clearTimeout(tDragTimer.current); tDragTimer.current = null; } }, []);

  const handleDragStart = useCallback((e, idx) => { if (!canEdit) return; setDragIdx(idx); e.dataTransfer.effectAllowed = "move"; }, [canEdit]);
  const handleDragEnter = useCallback((e, idx) => { setDropIdx(idx); e.preventDefault(); }, []);
  const handleDragOver = useCallback(e => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }, []);
  const handleDragEnd = useCallback(() => { setDragIdx(null); setDropIdx(null); }, []);
  const handleDrop = useCallback((e, idx) => {
    e.preventDefault(); if (dragIdx === null || dragIdx === idx) { setDragIdx(null); setDropIdx(null); return; }
    setSections(p => { const c = [...p]; const [m] = c.splice(dragIdx, 1); c.splice(idx, 0, m); return c; });
    setDragIdx(null); setDropIdx(null);
  }, [dragIdx, setSections]);

  return { dragIdx, dropIdx, tDrag, tDropIdx, cardRefs, onGripTouchStart, cancelTouchDrag, handleDragStart, handleDragEnter, handleDragOver, handleDragEnd, handleDrop };
}

// ============ MINI SECTION CARD (main-page style) ============
const MiniSec = React.forwardRef(function MiniSec({ section: s, index: i, total, onClick, onDelete, onStartHere, onMove,
  canDelete, canEdit, isCurrent, linked, heightPx,
  onDragStart, onDragEnter, onDragOver, onDragEnd, onDrop, dragIdx, dropIdx,
  onGripTouchStart, cancelTouchDrag, tDrag, tDropIdx }, ref) {
  const isT = s.type === "timed";
  const [confirmDel, setConfirmDel] = useState(false);
  const confirmTimer = useRef(null);

  useEffect(() => () => { if (confirmTimer.current) clearTimeout(confirmTimer.current); }, []);
  useEffect(() => { setConfirmDel(false); }, [linked]);

  const handleDelete = useCallback(e => {
    e.stopPropagation();
    if (!canDelete) return;
    if (!confirmDel) {
      setConfirmDel(true);
      if (confirmTimer.current) clearTimeout(confirmTimer.current);
      confirmTimer.current = setTimeout(() => setConfirmDel(false), 2000);
    } else {
      setConfirmDel(false);
      if (confirmTimer.current) clearTimeout(confirmTimer.current);
      onDelete();
    }
  }, [canDelete, confirmDel, onDelete]);

  const isDragging = tDrag?.idx === i;
  const isDropTarget = tDropIdx === i && tDrag && tDrag.idx !== i;
  const isDesktopDrag = dragIdx === i;
  const isDesktopDrop = dropIdx === i && dragIdx !== null && dragIdx !== i;

  return (
    <div ref={ref}
      draggable={canEdit}
      onDragStart={canEdit ? e => onDragStart(e, i) : undefined}
      onDragEnter={canEdit ? e => onDragEnter(e, i) : undefined}
      onDragOver={canEdit ? onDragOver : undefined}
      onDragEnd={canEdit ? onDragEnd : undefined}
      onDrop={canEdit ? e => onDrop(e, i) : undefined}
      onClick={canEdit ? onClick : undefined}
      style={{
        background: isCurrent ? C.downbeat + "12" : C.surface,
        borderRadius: 10, padding: "6px 8px",
        border: `1px solid ${isCurrent ? C.downbeat + "55" : (isDropTarget || isDesktopDrop) ? C.downbeat + "88" : C.border}`,
        cursor: canEdit ? "pointer" : "default",
        display: "flex", alignItems: "center", gap: 5, overflow: "hidden",
        transition: "all 0.15s", opacity: (isDragging || isDesktopDrag) ? 0.4 : (!canEdit && !linked ? 0.5 : 1),
        minHeight: Math.max(40, heightPx || 40), height: Math.max(40, heightPx || 40), flexShrink: 0,
        transform: isDragging ? `translateY(${tDrag.offsetY}px)` : undefined,
        zIndex: isDragging ? 10 : undefined,
        borderTop: (isDropTarget || isDesktopDrop) ? `2px solid ${C.downbeat}` : undefined
      }}>
      {/* Left: grip / reorder arrows + index */}
      <div
        onTouchStart={canEdit ? e => onGripTouchStart(i, e) : undefined}
        onTouchEnd={canEdit ? cancelTouchDrag : undefined}
        onTouchCancel={canEdit ? cancelTouchDrag : undefined}
        style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0, flexShrink: 0, minWidth: 14, touchAction: "none" }}>
        {canEdit && i > 0 ? (
          <button onClick={e => { e.stopPropagation(); onMove(-1); }} style={{ background: "none", border: "none", color: C.textMuted, cursor: "pointer", padding: 2, lineHeight: 1, display: "flex" }}>{I.arrowUp(10)}</button>
        ) : <span style={{ width: 14, height: 14 }}></span>}
        <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: C.textMuted, lineHeight: 1 }}>{i + 1}</span>
        {canEdit && i < total - 1 ? (
          <button onClick={e => { e.stopPropagation(); onMove(1); }} style={{ background: "none", border: "none", color: C.textMuted, cursor: "pointer", padding: 2, lineHeight: 1, display: "flex" }}>{I.arrowDown(10)}</button>
        ) : <span style={{ width: 14, height: 14 }}></span>}
      </div>

      {isT ? (
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 4, minWidth: 0, overflow: "hidden" }}>
          {I.clock(10)}
          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 13, color: C.text, fontWeight: 700 }}>{s.duration}s</span>
        </div>
      ) : (
        <>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, minWidth: 20 }}>
            <div style={{
              fontFamily: "'DM Mono',monospace", fontWeight: 700, color: C.text, lineHeight: 1,
              textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center"
            }}>
              <span style={{ fontSize: 14 }}>{s.tsNum}</span>
              <div style={{ height: 1, width: "100%", background: C.textMuted + "88", margin: "1px 0" }} />
              <span style={{ fontSize: 14 }}>{s.tsDen}</span>
            </div>
            {s.grouping && <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 6, color: C.textMuted + "88", marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", maxWidth: 30 }}>{Array.isArray(s.grouping) ? s.grouping.join("+") : s.grouping}</span>}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 2, flex: 1, minWidth: 0, overflow: "hidden" }}>
            <NoteSVG type={s.beatUnit} dotted={s.dotted} size={12} />
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: C.textMuted }}>=</span>
            <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 17, color: C.text, letterSpacing: 0.5 }}>{s.tempo}</span>
          </div>
        </>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
        {!isT && (
          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: s.loop ? C.downbeat : C.textMuted, whiteSpace: "nowrap" }}>
            {s.loop ? "∞" : `${s.bars}b`}
          </span>
        )}
        <button onClick={e => { e.stopPropagation(); onStartHere(); }} style={{
          background: "none", border: "none", color: C.textMuted, cursor: "pointer", padding: 1, display: "flex"
        }}>{I.play(10)}</button>
      </div>

      {canDelete && (
        <button onClick={handleDelete} style={{
          background: confirmDel ? C.danger + "22" : "none",
          border: confirmDel ? `1px solid ${C.danger}` : "none",
          borderRadius: 4, color: confirmDel ? C.danger : C.danger + "66",
          cursor: "pointer", padding: confirmDel ? "1px 4px" : 1,
          display: "flex", alignItems: "center", gap: 2, flexShrink: 0,
          fontSize: 8, fontFamily: "'DM Mono',monospace", transition: "all 0.15s"
        }}>
          {confirmDel ? <>{I.trash(9)}<span style={{ fontSize: 9 }}>?</span></> : I.trash(9)}
        </button>
      )}
    </div>
  );
});

// ============ BEAT DISPLAY ============
function BeatDisplay({ ps, color, linkedCountIn }) {
  if (linkedCountIn && ps?.countIn) return (
    <div style={{ textAlign: "center", padding: "10px 4px", display: "flex", justifyContent: "center" }}><div className="sync-pulse" style={{ width: 8, height: 8, borderRadius: "50%", background: C.textMuted }} /></div>
  );
  if (!ps) return (
    <div style={{ textAlign: "center", padding: "10px 4px", color: C.textMuted, fontFamily: "'DM Mono',monospace", fontSize: 11 }}>—</div>
  );
  if (ps.ended) return (
    <div style={{ textAlign: "center", padding: "10px 4px", color: C.textMuted, fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, letterSpacing: 1 }}>END</div>
  );
  if (ps.countIn) return (
    <div style={{ textAlign: "center", padding: "8px 4px" }}>
      <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 16, color: C.textMuted, opacity: ps.flash ? 1 : 0.5, transition: "opacity 0.05s" }}>—</span>
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
        <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: C.textMuted }}>b{ps.absoluteBar}</span>
        <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: C.textMuted }}>{ps.tsNum}/{ps.tsDen}</span>
      </div>
    </div>
  );
}

// ============ PANEL ============
function Panel({ label, color, sections, tl, ps, isP, soundSettings, onSoundToggle,
  onPlay, onStop, onStartHere, onAddSec, onEditSec, onDeleteSec, onMoveSec,
  canAdd, canEdit, linked, heights, drag, linkedCountIn }) {
  const totalBars = tl.length;
  const currentSi = ps?.sectionIndex ?? -1;
  return (
    <div style={{
      flex: 1, minWidth: 0, display: "flex", flexDirection: "column",
      background: C.surface + "44", borderRadius: 10, border: `1px solid ${color}33`,
      overflow: "hidden"
    }}>
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
          {sections.length} sec · {totalBars}b
        </span>
        <button onClick={onSoundToggle} style={{
          background: "none", border: `1px solid ${C.border}`, borderRadius: 5,
          padding: "2px 5px", cursor: "pointer", color: C.textMuted,
          fontSize: 9, fontFamily: "'DM Mono',monospace", flexShrink: 0
        }}>{({ sine: "♪", noise: "◌", wood: "W", rim: "R", clave: "C", cowbell: "🔔" })[soundSettings.clickSound] || "♪"}</button>
        {!linked && (
          <button onClick={() => isP ? onStop() : onPlay(0)} disabled={!totalBars} style={{
            width: 28, height: 28, borderRadius: "50%", border: "none",
            background: isP ? C.danger : color, color: isP ? "#fff" : "#000",
            cursor: totalBars ? "pointer" : "default", display: "flex",
            alignItems: "center", justifyContent: "center", flexShrink: 0,
            opacity: totalBars ? 1 : 0.3,
            boxShadow: isP ? `0 0 8px ${C.danger}44` : `0 0 8px ${color}33`,
            transition: "all 0.2s"
          }}>{isP ? I.pause(12) : I.play(12)}</button>
        )}
      </div>

      <div style={{ flexShrink: 0 }}>
        <BeatDisplay ps={ps} color={color} linkedCountIn={linkedCountIn} />
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "4px 6px 6px", display: "flex", flexDirection: "column", gap: 4, minHeight: 0 }}>
        {sections.map((sec, i) => (
          <MiniSec key={sec.id} ref={el => drag.cardRefs.current[i] = el}
            section={sec} index={i} total={sections.length}
            onClick={() => onEditSec(sec.id)}
            onDelete={() => onDeleteSec(sec.id)}
            onStartHere={() => onStartHere(i)}
            onMove={d => onMoveSec(i, d)}
            canDelete={sections.length > 1 && canEdit}
            canEdit={canEdit}
            isCurrent={currentSi === i}
            linked={linked}
            heightPx={heights[i] || 44}
            onDragStart={drag.handleDragStart} onDragEnter={drag.handleDragEnter}
            onDragOver={drag.handleDragOver} onDragEnd={drag.handleDragEnd}
            onDrop={drag.handleDrop} dragIdx={drag.dragIdx} dropIdx={drag.dropIdx}
            onGripTouchStart={drag.onGripTouchStart} cancelTouchDrag={drag.cancelTouchDrag}
            tDrag={drag.tDrag} tDropIdx={drag.tDropIdx} />
        ))}
        {canAdd && <button onClick={onAddSec} style={{
          width: "100%", padding: 10, borderRadius: 10, border: `1px dashed ${C.border}`,
          background: "transparent", color: C.textMuted, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, flexShrink: 0
        }}>{I.plus(16)}</button>}
      </div>
    </div>
  );
}

// ============ CENTER CONTROLS ============
function CenterControls({ linked, toggleLink, swapPanels, isPA, isPB, linkedPlay, linkedStop,
  colorA, colorB, linkedCountInPs }) {
  const showCountIn = linked && linkedCountInPs?.countIn;
  const isPlaying = isPA || isPB;
  // Visibility rules:
  // Link toggle + Swap: only when NOT playing
  // Central play: only when linked
  const showLink = !isPlaying;
  const showSwap = !isPlaying;
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: "0 4px", flexShrink: 0, width: 48
    }}>
      {/* Slot 1: Swap — hidden during playback */}
      <div style={{ height: 30, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
        {showSwap ? (
          <button onClick={swapPanels} title="Swap A ↔ B" style={{
            background: "none", border: `1px solid ${C.border}`, borderRadius: 6, padding: "4px 6px",
            color: C.textMuted, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s"
          }}>{I.swap(14)}</button>
        ) : <div style={{ width: 36, height: 30 }} />}
      </div>

      {/* Slot 2: Link/Unlink — hidden during playback */}
      <div style={{ height: 36, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
        {showLink ? (
          <button onClick={toggleLink} style={{
            background: linked ? colorA + "15" : C.surface, border: `1px solid ${linked ? colorA : C.border}`,
            borderRadius: 8, cursor: "pointer", width: 36, height: 36,
            color: linked ? colorA : C.textMuted, display: "flex",
            alignItems: "center", justifyContent: "center", transition: "all 0.2s"
          }}>
            {linked ? I.sync(14) : I.unlink(14)}
          </button>
        ) : <div style={{ width: 36, height: 36 }} />}
      </div>

      {/* Style for pulsing center button */}
      <style>{`
        @keyframes dtPulseCenter { 0% { box-shadow: 0 0 0 0px var(--dt-pulse-c, transparent); } 100% { box-shadow: 0 0 0 10px transparent; } }
      `}</style>
      
      {/* Slot 3: Central play — only when linked */}
      <div style={{ height: 36, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: showCountIn ? 8 : 0 }}>
        {linked ? (
          <button onClick={() => { if (isPlaying) linkedStop(); else linkedPlay(0); }} style={{
            width: 36, height: 36, borderRadius: "50%", border: "none",
            background: isPlaying ? C.danger : `linear-gradient(135deg, ${colorA}, ${colorB})`,
            color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: `0 0 12px ${isPlaying ? C.danger + "44" : colorA + "33"}`,
            transition: "all 0.2s",
            "--dt-pulse-c": isPlaying ? C.danger + "88" : colorA + "88",
            animation: (isPlaying || showCountIn) ? "dtPulseCenter 1.5s infinite" : "none"
          }}>{isPlaying ? I.pause(14) : I.play(14)}</button>
        ) : (
          <div style={{ width: 36, height: 36 }} />
        )}
      </div>

      {/* Slot 4: merged count-in indicator */}
      {showCountIn && (
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center", gap: 2
        }}>
          <div style={{
            fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: C.text,
            opacity: linkedCountInPs.flash ? 1 : 0.5, transition: "opacity 0.05s",
            textShadow: linkedCountInPs.flash ? `0 0 12px ${colorA}` : "none"
          }}>{(linkedCountInPs.beatIndex ?? 0) + 1}</div>
          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: C.textMuted }}>—</span>
        </div>
      )}
    </div>
  );
}

// ============ MAIN DUAL TEMPO ============
export default function DualTempo({ sections: initialSections, settings, onExit }) {
  const [showLandscape, setShowLandscape] = useState(() => {
    try { return _getLS(LS_KEY) !== "1"; } catch { return true; }
  });
  const dismissLandscape = useCallback(() => setShowLandscape(false), []);
  const dontShowLandscape = useCallback(() => { _setLS(LS_KEY, "1"); setShowLandscape(false); }, []);

  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);
  const showToast = useCallback(msg => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  }, []);

  const ctxRef = useRef(null);
  if (!ctxRef.current) { try { ctxRef.current = new (window.AudioContext || window.webkitAudioContext)(); } catch {} }
  useEffect(() => () => { if (ctxRef.current) { ctxRef.current.close().catch(() => {}); ctxRef.current = null; } }, []);

  const [secA, setSecA] = useState(() => initialSections.map(s => ({ ...s })));
  const [psA, setPsA] = useState(null);
  const [isPA, setIsPA] = useState(false);
  const metA = useMetronome(ctxRef.current);
  const [soundA, setSoundA] = useState({ clickSound: "sine", accented: true });

  const cloneForB = useCallback(secs => secs.map(s => ({ ...s, id: "b_" + String(s.id).replace(/^b_/, "") })), []);
  const [secB, setSecB] = useState(() => cloneForB(initialSections));
  const [psB, setPsB] = useState(null);
  const [isPB, setIsPB] = useState(false);
  const metB = useMetronome(ctxRef.current);
  const [soundB, setSoundB] = useState({ clickSound: "noise", accented: true });

  const [linked, setLinked] = useState(false);
  const [editPanel, setEditPanel] = useState(null);
  const [editId, setEditId] = useState(null);
  const [editIsNew, setEditIsNew] = useState(false);

  const tlA = useMemo(() => buildTL(secA), [secA]);
  const tlB = useMemo(() => buildTL(secB), [secB]);

  const { heightsA, heightsB } = useProportionalHeights(secA, secB);

  const canEdit = !linked;
  const dragA = usePanelDrag(secA, setSecA, canEdit);
  const dragB = usePanelDrag(secB, setSecB, canEdit);

  useEffect(() => { metA.updS({ ...soundA, muted: false }); }, [soundA, metA]);
  useEffect(() => { metB.updS({ ...soundB, muted: false }); }, [soundB, metB]);

  useEffect(() => { if (isPA) metA.hotSwapTL(tlA); }, [tlA, isPA, metA]);
  useEffect(() => { if (isPB) metB.hotSwapTL(tlB); }, [tlB, isPB, metB]);

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

  const goA = useCallback((fi = 0, syncDelayMs, ciOverride) => {
    if (!tlA.length) return;
    const i = Math.max(0, Math.min(fi, tlA.length - 1)), b = tlA[i];
    setPsA({ absoluteBar: b.ab, beatIndex: 0, beatType: 0, tsNum: b.tsN, tsDen: b.tsD, tempo: b.tempo, sectionIndex: b.si, allBeatTypes: b.bts, flash: false, countIn: false, isTimed: b.isT, remaining: b.isT ? b.tDur : undefined, ended: false });
    setIsPA(true);
    metA.start(tlA, i, ciOverride != null ? ciOverride : ci, { ...soundA, muted: false, ...(syncDelayMs != null ? { syncDelayMs } : {}) });
  }, [tlA, ci, metA, soundA]);

  const goB = useCallback((fi = 0, syncDelayMs, ciOverride) => {
    if (!tlB.length) return;
    const i = Math.max(0, Math.min(fi, tlB.length - 1)), b = tlB[i];
    setPsB({ absoluteBar: b.ab, beatIndex: 0, beatType: 0, tsNum: b.tsN, tsDen: b.tsD, tempo: b.tempo, sectionIndex: b.si, allBeatTypes: b.bts, flash: false, countIn: false, isTimed: b.isT, remaining: b.isT ? b.tDur : undefined, ended: false });
    setIsPB(true);
    metB.start(tlB, i, ciOverride != null ? ciOverride : ci, { ...soundB, muted: false, ...(syncDelayMs != null ? { syncDelayMs } : {}) });
  }, [tlB, ci, metB, soundB]);

  const stopA = useCallback(() => { metA.stop(); setIsPA(false); }, [metA]);
  const stopB = useCallback(() => { metB.stop(); setIsPB(false); }, [metB]);

  const linkedPlay = useCallback((fi = 0) => {
    const delay = 150;
    metA.tap(); metB.tap();
    const iA = Math.max(0, Math.min(fi, tlA.length - 1));
    const iB = Math.max(0, Math.min(fi, tlB.length - 1));
    const barA = tlA[iA], barB = tlB[iB];
    if (!barA || !barB) return;
    const cpbA = barA.cpb || 4, cpbB = barB.cpb || 4;
    const maxCpb = Math.max(cpbA, cpbB);
    const ciBarsA = (ci > 0 && !barA.isT) ? Math.ceil((maxCpb * ci) / cpbA) : 0;
    const ciBarsB = (ci > 0 && !barB.isT) ? Math.ceil((maxCpb * ci) / cpbB) : 0;
    // Wall-clock count-in duration per panel (ms)
    const cdA = barA.cd ?? (barA.perBeatCd?.[0]?.cd ?? 0.5);
    const cdB = barB.cd ?? (barB.perBeatCd?.[0]?.cd ?? 0.5);
    const ciMsA = ciBarsA * cpbA * cdA * 1000;
    const ciMsB = ciBarsB * cpbB * cdB * 1000;
    // Offset the shorter panel so both first downbeats land together
    const diff = Math.abs(ciMsA - ciMsB);
    const delayA = ciMsA >= ciMsB ? delay : delay + diff;
    const delayB = ciMsB >= ciMsA ? delay : delay + diff;
    goA(fi, delayA, ciBarsA);
    goB(fi, delayB, ciBarsB);
  }, [goA, goB, metA, metB, ci, tlA, tlB]);

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
    if (linked) { showToast("🔗 ✕"); return; }
    const ns = mkM();
    if (secA.length > 0) { const l = secA[secA.length - 1]; if (l.type === "metered") { ns.tsNum = l.tsNum; ns.tsDen = l.tsDen; ns.beatUnit = l.beatUnit; ns.dotted = l.dotted; ns.tempo = l.tempo; ns.grouping = l.grouping; } }
    setSecA(p => [...p, ns]); setEditPanel("A"); setEditIsNew(true); setEditId(ns.id);
  }, [secA, linked, showToast]);

  const addSecB = useCallback(() => {
    if (linked) { showToast("🔗 ✕"); return; }
    const ns = mkM();
    if (secB.length > 0) { const l = secB[secB.length - 1]; if (l.type === "metered") { ns.tsNum = l.tsNum; ns.tsDen = l.tsDen; ns.beatUnit = l.beatUnit; ns.dotted = l.dotted; ns.tempo = l.tempo; ns.grouping = l.grouping; } }
    setSecB(p => [...p, ns]); setEditPanel("B"); setEditIsNew(true); setEditId(ns.id);
  }, [secB, linked, showToast]);

  const deleteSecA = useCallback(id => {
    if (linked) { showToast("🔗 ✕"); return; }
    if (secA.length <= 1) return; setSecA(p => p.filter(s => s.id !== id));
  }, [secA, linked, showToast]);

  const deleteSecB = useCallback(id => {
    if (linked) { showToast("🔗 ✕"); return; }
    if (secB.length <= 1) return; setSecB(p => p.filter(s => s.id !== id));
  }, [secB, linked, showToast]);

  const moveSecA = useCallback((i, d) => {
    if (linked) return;
    setSecA(p => {
      const n = [...p]; const j = i + d;
      if (j < 0 || j >= n.length) return p;
      [n[i], n[j]] = [n[j], n[i]]; return n;
    });
  }, [linked]);

  const moveSecB = useCallback((i, d) => {
    if (linked) return;
    setSecB(p => {
      const n = [...p]; const j = i + d;
      if (j < 0 || j >= n.length) return p;
      [n[i], n[j]] = [n[j], n[i]]; return n;
    });
  }, [linked]);

  const editSecA = useCallback(id => {
    if (linked) { showToast("🔗 ✕"); return; }
    setEditPanel("A"); setEditIsNew(false); setEditId(id);
  }, [linked, showToast]);

  const editSecB = useCallback(id => {
    if (linked) { showToast("🔗 ✕"); return; }
    setEditPanel("B"); setEditIsNew(false); setEditId(id);
  }, [linked, showToast]);

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

  const swapPanels = useCallback(() => {
    if (isPA || isPB) { showToast("⏹ → ↔"); return; }
    const tmpA = secA.map(s => ({ ...s }));
    const tmpB = secB.map(s => ({ ...s }));
    setSecA(tmpB.map(s => ({ ...s, id: String(s.id).replace(/^b_/, "") || (Date.now() + Math.random()) })));
    setSecB(tmpA.map(s => ({ ...s, id: "b_" + String(s.id).replace(/^b_/, "") })));
    const sA = { ...soundA }, sB = { ...soundB };
    setSoundA(sB);
    setSoundB(sA);
    setPsA(null); setPsB(null);
    showToast("A ↔ B");
  }, [secA, secB, soundA, soundB, isPA, isPB, showToast]);

  const toggleLink = useCallback(() => {
    stopA(); stopB(); setPsA(null); setPsB(null);
    setEditId(null); setEditPanel(null);
    setLinked(l => {
      if (!l) showToast("🔗 ●");
      else showToast("🔗 ○");
      return !l;
    });
  }, [stopA, stopB, showToast]);

  // Merged count-in state for central display
  const linkedCountInPs = linked && psA?.countIn ? psA : null;

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
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px 4px", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="dt-grad" style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, letterSpacing: 2 }}>DUAL TEMPO</span>
          <span style={{
            padding: "2px 5px", borderRadius: 4, fontSize: 8, fontFamily: "'DM Mono',monospace",
            background: linked ? colorA + "22" : C.surface, color: linked ? colorA : C.textMuted,
            border: `1px solid ${linked ? colorA + "44" : C.border}`
          }}>{linked ? "●" : "○"}</span>
        </div>
        <button className="close-btn" onClick={onExit} style={{ width: 36, height: 36 }}>{I.x(18)}</button>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "row", gap: 0, padding: "0 6px 8px", minHeight: 0, overflow: "hidden" }}>
        <Panel label="A" color={colorA} sections={secA} tl={tlA} ps={psA} isP={isPA}
          soundSettings={soundA} onSoundToggle={() => setSoundA(p => { const all = ["sine", "noise", "wood", "rim", "clave", "cowbell"]; const idx = Math.max(0, all.indexOf(p.clickSound)); return { ...p, clickSound: all[(idx + 1) % all.length] }; })}
          onPlay={handlePlayA} onStop={handleStopA} onStartHere={startHereA}
          onAddSec={addSecA} onEditSec={editSecA} onDeleteSec={deleteSecA} onMoveSec={moveSecA}
          canAdd={canEdit} canEdit={canEdit} linked={linked} heights={heightsA} drag={dragA}
          linkedCountIn={!!linkedCountInPs} />

        <CenterControls linked={linked} toggleLink={toggleLink} swapPanels={swapPanels}
          isPA={isPA} isPB={isPB} linkedPlay={linkedPlay} linkedStop={linkedStop}
          colorA={colorA} colorB={colorB} linkedCountInPs={linkedCountInPs} />

        <Panel label="B" color={colorB} sections={secB} tl={tlB} ps={psB} isP={isPB}
          soundSettings={soundB} onSoundToggle={() => setSoundB(p => { const all = ["sine", "noise", "wood", "rim", "clave", "cowbell"]; const idx = Math.max(0, all.indexOf(p.clickSound)); return { ...p, clickSound: all[(idx + 1) % all.length] }; })}
          onPlay={handlePlayB} onStop={handleStopB} onStartHere={startHereB}
          onAddSec={addSecB} onEditSec={editSecB} onDeleteSec={deleteSecB} onMoveSec={moveSecB}
          canAdd={canEdit} canEdit={canEdit} linked={linked} heights={heightsB} drag={dragB}
          linkedCountIn={!!linkedCountInPs} />
      </div>

      {editSec && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "stretch", justifyContent: "stretch" }}>
          {/* Colour glow border for active panel */}
          <div style={{
            position: "absolute", inset: 0,
            boxShadow: `inset 0 0 0 2px ${editPanel === "A" ? colorA : colorB}44, inset 0 0 40px ${editPanel === "A" ? colorA : colorB}15`,
            pointerEvents: "none", zIndex: 101, borderRadius: 0
          }} />
          {/* A/B badge */}
          <div style={{
            position: "absolute", top: 8, left: "50%", transform: "translateX(-50%)", zIndex: 102,
            background: (editPanel === "A" ? colorA : colorB) + "22",
            border: `1px solid ${editPanel === "A" ? colorA : colorB}66`,
            borderRadius: 6, padding: "2px 10px",
            fontFamily: "'Bebas Neue',sans-serif", fontSize: 12, letterSpacing: 1,
            color: editPanel === "A" ? colorA : colorB, pointerEvents: "none"
          }}>{editPanel}</div>
          <SecEd section={editSec} appMode={settings.appMode} isNew={editIsNew}
            editIndex={(editPanel === "A" ? secA : secB).findIndex(s => s.id === editId) + 1}
            onSave={handleSaveEdit} onClose={() => { setEditId(null); setEditPanel(null); }}
            onDelete={((editPanel === "A" ? secA : secB).length > 1) ? handleDeleteFromEditor : null} />
        </div>
      )}

      {showLandscape && <LandscapePrompt onDismiss={dismissLandscape} onDontShowAgain={dontShowLandscape} />}

      <DualToast message={toast} />

      <style>{`
        .dt-grad { background: linear-gradient(135deg, #ffffff 0%, #848492 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
      `}</style>
    </div>
  );
}
