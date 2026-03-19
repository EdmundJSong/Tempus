import { useRef, useCallback, useEffect, useState } from "react";
import { BU, D2Q } from "./utils";

// ============ AUDIO ENGINE ============
export function useMetronome(externalCtx) {
  const actx = useRef(null), tmr = useRef(null), nb = useRef(0), bi = useRef(0), bei = useRef(0), pl = useRef(false), tlR = useRef([]), cbR = useRef(null), sR = useRef({ accented: true, pitched: true, muted: false }), ciL = useRef(0), wl = useRef(null), sa = useRef(null), tsS = useRef(0), tsM = useRef(0), tsF = useRef(false);
  const fermS = useRef(0), fermD = useRef(0), inFerm = useRef(false);
  const init = useCallback(() => { if (externalCtx) { actx.current = externalCtx; return actx.current; } if (!actx.current) actx.current = new (window.AudioContext || window.webkitAudioContext)(); return actx.current; }, [externalCtx]);
  const rwl = useCallback(async () => { try { if ("wakeLock" in navigator) wl.current = await navigator.wakeLock.request("screen"); } catch { } if (sa.current && sa.current.paused) { try { await sa.current.play(); } catch { } } }, []);
  const rlwl = useCallback(() => { if (wl.current) { wl.current.release().catch(() => { }); wl.current = null; } if (sa.current) { sa.current.pause(); sa.current.currentTime = 0; } }, []);
  const prime = useCallback(async () => { const ctx = init(); if (ctx.state === "suspended") await ctx.resume(); return ctx; }, [init]);
  const silentStart = useRef(0);
  const clk = useCallback((ctx, time, bt) => {
    const { accented, pitched, muted, downbeatOnly, silentInterval } = sR.current; if (muted) return;
    // Downbeat-only: skip non-downbeats
    if (downbeatOnly && bt !== 0) return;
    // Silent interval: alternate audible/silent in equal durations
    if (silentInterval > 0) {
      if (silentStart.current === 0) silentStart.current = ctx.currentTime;
      const elapsed = ctx.currentTime - silentStart.current;
      const phase = elapsed % (silentInterval * 2);
      if (phase >= silentInterval) return; // in silent phase
    }
    const e = accented ? bt : 2;
    if (typeof navigator !== "undefined" && "vibrate" in navigator) { try { navigator.vibrate(e === 0 ? [30] : [15]); } catch (err) { } }
    if (pitched) { const f = e === 0 ? 1000 : e === 1 ? 750 : 500, v = e === 0 ? 0.8 : e === 1 ? 0.5 : 0.25, o = ctx.createOscillator(), g = ctx.createGain(); o.type = "sine"; o.frequency.value = f; g.gain.setValueAtTime(v, time); g.gain.exponentialRampToValueAtTime(0.001, time + 0.06); o.connect(g); g.connect(ctx.destination); o.start(time); o.stop(time + 0.08); }
    else { const l = Math.floor(ctx.sampleRate * 0.025), buf = ctx.createBuffer(1, l, ctx.sampleRate), d = buf.getChannelData(0); for (let i = 0; i < l; i++)d[i] = Math.random() * 2 - 1; const v = e === 0 ? 0.7 : e === 1 ? 0.4 : 0.2, src = ctx.createBufferSource(), g = ctx.createGain(); src.buffer = buf; g.gain.setValueAtTime(v, time); g.gain.exponentialRampToValueAtTime(0.001, time + 0.05); const fl = ctx.createBiquadFilter(); fl.type = "bandpass"; fl.frequency.value = e === 0 ? 1200 : e === 1 ? 900 : 700; fl.Q.value = 0.8; src.connect(fl); fl.connect(g); g.connect(ctx.destination); src.start(time); src.stop(time + 0.06); }
  }, []);
  const sched = useCallback(() => {
    const ctx = actx.current; if (!ctx || !pl.current) return; const tl = tlR.current;
    let _guard = 0;
    while (nb.current < ctx.currentTime + 0.12 && _guard++ < 200) {
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
      const beatCd = Math.max(0.01, pbc ? (pbc[bei.current]?.cd ?? pbc[0]?.cd ?? 0.5) : (bar.cd ?? 0.5));
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
  const stop = useCallback(() => { pl.current = false; if (tmr.current) { clearInterval(tmr.current); tmr.current = null; } tsS.current = 0; tsM.current = 0; tsF.current = false; inFerm.current = false; silentStart.current = 0; rlwl(); }, [rlwl]);
  const start = useCallback((tl, from = 0, ci = 0, s = {}) => {
    stop(); const { syncDelayMs, ...audioSettings } = s; sR.current = { accented: true, pitched: true, muted: false, downbeatOnly: false, silentInterval: 0, ...sR.current, ...audioSettings }; tlR.current = tl; bi.current = from; bei.current = 0; tsS.current = 0; tsM.current = 0; tsF.current = false;
    const ctx = init(); if (ctx.state === "suspended") ctx.resume();
    if (!sa.current) { const a = document.createElement("audio"); a.setAttribute("loop", "true"); a.setAttribute("playsinline", "true"); a.src = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA="; sa.current = a; } try { sa.current.play().catch(() => {}); } catch {}
    try { if ("wakeLock" in navigator) navigator.wakeLock.request("screen").then(l => { wl.current = l; }).catch(() => {}); } catch {}
    const bar = tl[from]; if (!bar) return; ciL.current = bar.isT ? 0 : ci * bar.cpb; pl.current = true; nb.current = ctx.currentTime + (syncDelayMs != null ? Math.max(0.05, syncDelayMs / 1000) : 0.1); tmr.current = setInterval(sched, 20);
  }, [stop, init, sched]);
  const updS = useCallback(s => { sR.current = { ...sR.current, ...s }; }, []);
  const setCb = useCallback(cb => { cbR.current = cb; }, []);
  useEffect(() => () => { stop(); if (!externalCtx && actx.current) actx.current.close().catch(() => { }); }, [stop, externalCtx]);
  const tap = useCallback(() => { const ctx = init(); if (ctx.state === "suspended") ctx.resume(); const buf = ctx.createBuffer(1, 1, ctx.sampleRate), src = ctx.createBufferSource(); src.buffer = buf; src.connect(ctx.destination); src.start(0); if (!sa.current) { const a = document.createElement("audio"); a.setAttribute("loop", "true"); a.setAttribute("playsinline", "true"); a.src = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA="; sa.current = a; } try { sa.current.play().catch(() => {}); } catch {} return ctx; }, [init]);
  const hotSwapTL = useCallback(newTL => { tlR.current = newTL; }, []);
  return { start, stop, setCb, pl, updS, tap, hotSwapTL };
}

// ============ TAP TEMPO ============
export function useTapTempo(onChange) {
  const taps = useRef([]);
  const resetTimer = useRef(null);
  const [tapBpm, setTapBpm] = useState(null);
  const [tapFlash, setTapFlash] = useState(false);
  const tap = useCallback(() => {
    const now = performance.now();
    taps.current.push(now);
    const cutoff = now - 4000;
    taps.current = taps.current.filter(t => t > cutoff).slice(-8);
    setTapFlash(true); setTimeout(() => setTapFlash(false), 150);
    if (taps.current.length >= 3) {
      const intervals = [];
      for (let i = 1; i < taps.current.length; i++) intervals.push(taps.current[i] - taps.current[i - 1]);
      const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const bpm = Math.round(60000 / avg);
      if (bpm >= 10 && bpm <= 400) { onChange(bpm); setTapBpm(bpm); }
    }
    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => { taps.current = []; setTapBpm(null); }, 2000);
  }, [onChange]);
  return { tap, tapBpm, tapFlash };
}
