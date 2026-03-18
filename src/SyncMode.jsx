import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { fbInit, getDeviceId, getAuthUid, C, I, buildTL, nI, SyncIcon, t, tp, getClusterId, unlinkDeviceForSync } from "./App";

// ============ SYNC CONSTANTS ============
const SYNC_COLOR = "#06b6d4";
const SYNC_GLOW = "rgba(6, 182, 212, 0.4)";
const MAX_MEMBERS = 20;
const HEARTBEAT_MS = 10000;
const STALE_MS = 15000;

// ============ FIRESTORE HELPERS ============
let _fsModule = null;
async function getFS() {
  if (!_fsModule) _fsModule = await import("https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js");
  return _fsModule;
}

// 6-char alphanumeric code, excludes ambiguous chars: 0/O, 1/I/L
const ROOM_CODE_CHARS = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
const ROOM_CODE_LEN = 6;
function genRoomCode() {
  let code = "";
  for (let i = 0; i < ROOM_CODE_LEN; i++) code += ROOM_CODE_CHARS[Math.floor(Math.random() * ROOM_CODE_CHARS.length)];
  return code;
}

async function createRoom(sections, settings, _retries = 0) {
  if (_retries >= 10) throw new Error("Could not generate a unique room code");
  const db = await fbInit(); if (!db) throw new Error("Firebase not available");
  const fs = await getFS();
  const code = genRoomCode();
  const deviceId = getDeviceId();
  const existing = await fs.getDoc(fs.doc(db, "tempus_rooms", code));
  if (existing.exists()) {
    const d = existing.data();
    const isRecent = d.createdAt && (Date.now() - d.createdAt) < 3600000;
    const hasActiveMembers = d.members && Object.values(d.members).some(m => m.lastSeen && (Date.now() - m.lastSeen) < STALE_MS * 2);
    if (isRecent || hasActiveMembers) {
      return createRoom(sections, settings, _retries + 1);
    }
  }
  const authUid = getAuthUid();
  await fs.setDoc(fs.doc(db, "tempus_rooms", code), {
    code, hostId: deviceId, hostAuthUid: authUid, hostName: "", status: "lobby",
    sections: JSON.parse(JSON.stringify(sections)),
    commandSeq: 0, command: null, startAtMs: null,
    resumeFromBar: 1, countInBars: settings.countIn || 1,
    members: { [deviceId]: { name: "", authUid: authUid, joinedAt: Date.now(), lastSeen: Date.now() } },
    pending: {}, kicked: [], createdAt: Date.now()
  });
  return code;
}

async function joinRoomPending(code, displayName) {
  const db = await fbInit(); if (!db) throw new Error("Firebase not available");
  const fs = await getFS();
  const ref = fs.doc(db, "tempus_rooms", code);
  const snap = await fs.getDoc(ref);
  if (!snap.exists()) throw new Error("Room not found");
  const data = snap.data();
  const deviceId = getDeviceId();
  if (data.kicked?.includes(deviceId)) throw new Error("You were removed from this room");
  if (Object.keys(data.members || {}).length + Object.keys(data.pending || {}).length >= MAX_MEMBERS) throw new Error("Room is full");
  if (data.members?.[deviceId]) {
    await fs.updateDoc(ref, { [`members.${deviceId}.name`]: displayName, [`members.${deviceId}.lastSeen`]: Date.now(), [`members.${deviceId}.authUid`]: getAuthUid() });
    return { admitted: true };
  }
  await fs.updateDoc(ref, { [`pending.${deviceId}`]: { name: displayName, authUid: getAuthUid(), requestedAt: Date.now() } });
  return { admitted: false };
}

async function admitMember(code, memberId) {
  const db = await fbInit(); if (!db) return; const fs = await getFS();
  const snap = await fs.getDoc(fs.doc(db, "tempus_rooms", code)); if (!snap.exists()) return;
  const p = snap.data().pending?.[memberId]; if (!p) return;
  await fs.updateDoc(fs.doc(db, "tempus_rooms", code), { [`members.${memberId}`]: { name: p.name, authUid: p.authUid || null, joinedAt: Date.now(), lastSeen: Date.now() }, [`pending.${memberId}`]: fs.deleteField() });
}

async function admitAll(code) {
  const db = await fbInit(); if (!db) return; const fs = await getFS();
  const snap = await fs.getDoc(fs.doc(db, "tempus_rooms", code)); if (!snap.exists()) return;
  const updates = {};
  for (const [id, info] of Object.entries(snap.data().pending || {})) {
    updates[`members.${id}`] = { name: info.name, authUid: info.authUid || null, joinedAt: Date.now(), lastSeen: Date.now() };
    updates[`pending.${id}`] = fs.deleteField();
  }
  if (Object.keys(updates).length > 0) await fs.updateDoc(fs.doc(db, "tempus_rooms", code), updates);
}

async function kickMember(code, memberId) {
  const db = await fbInit(); if (!db) return; const fs = await getFS();
  const snap = await fs.getDoc(fs.doc(db, "tempus_rooms", code)); if (!snap.exists()) return;
  await fs.updateDoc(fs.doc(db, "tempus_rooms", code), { [`members.${memberId}`]: fs.deleteField(), kicked: [...(snap.data().kicked || []), memberId] });
}

async function kickAll(code) {
  const db = await fbInit(); if (!db) return; const fs = await getFS();
  const snap = await fs.getDoc(fs.doc(db, "tempus_rooms", code)); if (!snap.exists()) return;
  const data = snap.data(); const updates = {}; const kicked = [...(data.kicked || [])];
  for (const id of Object.keys(data.members || {})) { if (id !== data.hostId) { updates[`members.${id}`] = fs.deleteField(); kicked.push(id); } }
  for (const id of Object.keys(data.pending || {})) { updates[`pending.${id}`] = fs.deleteField(); kicked.push(id); }
  updates.kicked = kicked;
  if (Object.keys(updates).length > 0) await fs.updateDoc(fs.doc(db, "tempus_rooms", code), updates);
}

async function sendCommand(code, command, extra = {}) {
  const db = await fbInit(); if (!db) return; const fs = await getFS();
  const status = command === "start" || command === "restart" ? "playing" : command === "pause" ? "paused" : command === "stop" || command === "sync-reset" ? "stopped" : undefined;
  const updates = { command, commandSeq: fs.increment(1), ...extra };
  if (status) updates.status = status;
  await fs.updateDoc(fs.doc(db, "tempus_rooms", code), updates);
}

async function updateRoomSections(code, sections) {
  const db = await fbInit(); if (!db) return; const fs = await getFS();
  await fs.updateDoc(fs.doc(db, "tempus_rooms", code), { sections: JSON.parse(JSON.stringify(sections)) });
}

// Heartbeats write to a SEPARATE subcollection to avoid triggering room snapshot on every tick
async function heartbeat(code) {
  const db = await fbInit(); if (!db) return; const fs = await getFS();
  const deviceId = getDeviceId();
  try {
    await fs.setDoc(fs.doc(db, "tempus_rooms", code, "presence", deviceId), { lastSeen: Date.now(), authUid: getAuthUid() }, { merge: true });
  } catch {}
}

// Read presence for stale detection (one-time read, not a listener)
async function readPresence(code) {
  try {
    const db = await fbInit(); if (!db) return {};
    const fs = await getFS();
    const snap = await fs.getDocs(fs.collection(db, "tempus_rooms", code, "presence"));
    const result = {};
    snap.forEach(doc => { result[doc.id] = doc.data(); });
    return result;
  } catch { return {}; }
}

async function leaveRoom(code) {
  const db = await fbInit(); if (!db) return; const fs = await getFS();
  const ref = fs.doc(db, "tempus_rooms", code);
  const deviceId = getDeviceId();
  try {
    // Clean up presence subcollection doc
    try { await fs.deleteDoc(fs.doc(db, "tempus_rooms", code, "presence", deviceId)); } catch {}
    const snap = await fs.getDoc(ref); if (!snap.exists()) return;
    if (snap.data().hostId === deviceId) await fs.deleteDoc(ref);
    else await fs.updateDoc(ref, { [`members.${deviceId}`]: fs.deleteField(), [`pending.${deviceId}`]: fs.deleteField() });
  } catch {}
}

// ============ CLOCK CALIBRATION ============
// Multi-ping: 7 Firestore round-trips, discard worst RTTs, take median offset.
// offset = localTime - serverTime. To get server-equivalent time: Date.now() - offset
async function calibrateClock() {
  try {
    const db = await fbInit(); if (!db) return 0;
    const fs = await getFS();
    const deviceId = getDeviceId();
    const calRef = fs.doc(db, "tempus_clock_cal", deviceId);
    const PINGS = 7;
    const samples = [];
    for (let p = 0; p < PINGS; p++) {
      const localBefore = Date.now();
      await fs.setDoc(calRef, { t: fs.serverTimestamp(), authUid: getAuthUid() });
      const localAfter = Date.now();
      const snap = await fs.getDoc(calRef);
      const serverMs = snap.data()?.t?.toMillis?.();
      if (serverMs) {
        const rtt = localAfter - localBefore;
        const offset = ((localBefore + localAfter) / 2) - serverMs;
        samples.push({ rtt, offset });
      }
    }
    try { await fs.deleteDoc(calRef); } catch {}
    if (samples.length === 0) return 0;
    // Discard highest and lowest RTT samples (outliers from network jitter)
    if (samples.length >= 5) {
      samples.sort((a, b) => a.rtt - b.rtt);
      samples.splice(-1, 1); // remove worst RTT
      samples.splice(0, 1);  // remove best RTT (can also be anomalous)
    }
    // Return median offset from remaining samples
    samples.sort((a, b) => a.offset - b.offset);
    return samples[Math.floor(samples.length / 2)].offset;
  } catch { return 0; }
}

// Lightweight single-ping recalibration (for periodic refresh, not initial setup)
async function recalibrateSingle() {
  try {
    const db = await fbInit(); if (!db) return null;
    const fs = await getFS();
    const deviceId = getDeviceId();
    const calRef = fs.doc(db, "tempus_clock_cal", deviceId);
    const localBefore = Date.now();
    await fs.setDoc(calRef, { t: fs.serverTimestamp(), authUid: getAuthUid() });
    const localAfter = Date.now();
    const snap = await fs.getDoc(calRef);
    const serverMs = snap.data()?.t?.toMillis?.();
    try { await fs.deleteDoc(calRef); } catch {}
    if (serverMs) return ((localBefore + localAfter) / 2) - serverMs;
    return null;
  } catch { return null; }
}

// ============ useSync HOOK ============
export function useSync({ sections, settings, met, go, exitPlay, pause }) {
  const [syncState, setSyncState] = useState(null);
  const [showLobby, setShowLobby] = useState(false);
  const [toast, setToast] = useState(null);
  const [syncReady, setSyncReady] = useState(false);
  const syncReadyRef = useRef(false);
  useEffect(() => { syncReadyRef.current = syncReady; }, [syncReady]);
  const unsubRef = useRef(null);
  const heartbeatRef = useRef(null);
  const lastCmdSeq = useRef(0);
  const originalSections = useRef(null);
  const toastTimer = useRef(null);
  const clockOffsetRef = useRef(0); // local - server (ms)
  const serverNow = useCallback(() => Date.now() - clockOffsetRef.current, []);
  const goRef = useRef(go); const metRef = useRef(met); const exitPlayRef = useRef(exitPlay); const pauseRef = useRef(pause); const sectionsRef = useRef(sections); const settingsRef = useRef(settings);
  useEffect(() => { goRef.current = go; }, [go]);
  useEffect(() => { metRef.current = met; }, [met]);
  useEffect(() => { exitPlayRef.current = exitPlay; }, [exitPlay]);
  useEffect(() => { pauseRef.current = pause; }, [pause]);
  useEffect(() => { sectionsRef.current = sections; }, [sections]);
  useEffect(() => { settingsRef.current = settings; }, [settings]);

  const deviceId = useMemo(() => getDeviceId(), []);
  const isHost = syncState?.role === "host";
  const isInRoom = syncState !== null;
  const roomCode = syncState?.code || null;

  const showToast = useCallback((msg, dur = 3000) => {
    setToast(msg); if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), dur);
  }, []);

  const roomSectionsJsonRef = useRef(null);
  const roleRef = useRef(null); // track role in refs for snapshot callback

  // Process command directly in snapshot callback (not useEffect) to avoid React batching issues
  const processCommand = useCallback((d, isAdmitted) => {
    if (!isAdmitted || roleRef.current === "host") return;
    const seq = d.commandSeq || 0;
    const cmd = d.command;
    const startAtMs = d.startAtMs;
    if (seq <= lastCmdSeq.current) return;
    lastCmdSeq.current = seq;
    const sNow = Date.now() - clockOffsetRef.current;
    if (cmd === "start" || cmd === "restart") {
      if (!startAtMs) return;
      const ci = d.countInBars ?? 0;
      const delay = startAtMs - sNow;
      if (delay > -2000 && delay < 10000) {
        goRef.current(0, ci, Math.max(50, delay));
      }
    } else if (cmd === "pause") {
      pauseRef.current();
    } else if (cmd === "resume") {
      const delay = (startAtMs || sNow) - sNow;
      const tl = buildTL(sectionsRef.current);
      const idx = tl.findIndex(b => b.ab === (d.resumeFromBar || 1));
      if (idx >= 0 && delay > -2000 && delay < 10000) {
        goRef.current(idx, 0, Math.max(50, delay));
      }
    } else if (cmd === "stop") exitPlayRef.current();
    else if (cmd === "sync-reset") { exitPlayRef.current(); }
  }, []);

  const subscribeToRoom = useCallback(async (code, role) => {
    const db = await fbInit(); if (!db) return; const fs = await getFS();
    if (unsubRef.current) unsubRef.current();
    roleRef.current = role;
    let firstSnapshot = true;
    unsubRef.current = fs.onSnapshot(fs.doc(db, "tempus_rooms", code), (snap) => {
      if (!snap.exists()) {
        setSyncState(null); if (unsubRef.current) { unsubRef.current(); unsubRef.current = null; }
        if (originalSections.current) showToast(t("sync.roomClosed"));
        return;
      }
      const d = snap.data(); const myId = getDeviceId();
      if (d.kicked?.includes(myId)) {
        setSyncState(null); if (unsubRef.current) { unsubRef.current(); unsubRef.current = null; }
        showToast(t("sync.removed")); return;
      }
      // On first snapshot, initialize lastCmdSeq and mark connection as ready
      if (firstSnapshot) {
        lastCmdSeq.current = d.commandSeq || 0;
        firstSnapshot = false;
        setSyncReady(true);
      }
      const isAdmitted = !!(d.members?.[myId]);
      // Process commands synchronously in the snapshot callback — not in useEffect
      processCommand(d, isAdmitted);
      // Update React state for UI
      const newSJ = JSON.stringify(d.sections);
      const sectionsChanged = newSJ !== roomSectionsJsonRef.current;
      if (sectionsChanged) roomSectionsJsonRef.current = newSJ;
      setSyncState(prev => ({
        ...prev, code, role, hostId: d.hostId, hostName: d.hostName || "Host", status: d.status,
        members: d.members || {}, pending: d.pending || {},
        sections: sectionsChanged ? d.sections : (prev?.sections || d.sections),
        commandSeq: d.commandSeq || 0, command: d.command, startAtMs: d.startAtMs,
        resumeFromBar: d.resumeFromBar, countInBars: d.countInBars,
        isPending: !!(d.pending?.[myId]) && !(d.members?.[myId]),
        isAdmitted
      }));
    });
  }, [showToast, processCommand]);

  // Section updates from host (member side) — pulse glow instead of toast
  const lastSectionsJson = useRef(null);
  const [syncGlowPulse, setSyncGlowPulse] = useState(false);
  const glowPulseTimer = useRef(null);
  useEffect(() => {
    if (!syncState || isHost || !syncState.isAdmitted) return;
    const j = JSON.stringify(syncState.sections);
    if (lastSectionsJson.current && lastSectionsJson.current !== j) {
      setSyncGlowPulse(true);
      if (glowPulseTimer.current) clearTimeout(glowPulseTimer.current);
      glowPulseTimer.current = setTimeout(() => setSyncGlowPulse(false), 1200);
    }
    lastSectionsJson.current = j;
  }, [syncState?.sections, isHost, syncState?.isAdmitted]);

  // Heartbeat + periodic clock recalibration
  const heartbeatCount = useRef(0);
  useEffect(() => {
    if (!roomCode) return;
    heartbeatCount.current = 0;
    heartbeatRef.current = setInterval(async () => {
      heartbeat(roomCode);
      heartbeatCount.current++;
      // Recalibrate every 3rd heartbeat (~30s) to combat clock drift
      if (heartbeatCount.current % 3 === 0) {
        const newOffset = await recalibrateSingle();
        if (newOffset != null) clockOffsetRef.current = newOffset;
      }
    }, HEARTBEAT_MS);
    return () => { if (heartbeatRef.current) clearInterval(heartbeatRef.current); };
  }, [roomCode]);

  useEffect(() => () => {
    if (unsubRef.current) unsubRef.current();
    if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    if (glowPulseTimer.current) clearTimeout(glowPulseTimer.current);
  }, []);

  const doCreateRoom = useCallback(async (displayName) => {
    try {
      setSyncReady(false);
      try { metRef.current.tap(); } catch {} // unlock AudioContext during user gesture
      clockOffsetRef.current = await calibrateClock();
      const code = await createRoom(sectionsRef.current, settingsRef.current);
      const db = await fbInit(); const fs = await getFS();
      await fs.updateDoc(fs.doc(db, "tempus_rooms", code), { hostName: displayName, [`members.${deviceId}.name`]: displayName });
      lastCmdSeq.current = 0; originalSections.current = null;
      setSyncState({ code, role: "host", hostId: deviceId, hostName: displayName, status: "lobby",
        members: { [deviceId]: { name: displayName, joinedAt: Date.now(), lastSeen: Date.now() } },
        pending: {}, sections: sectionsRef.current, commandSeq: 0, command: null,
        startAtMs: null, resumeFromBar: 1, countInBars: settingsRef.current.countIn || 1, isPending: false, isAdmitted: true });
      await subscribeToRoom(code, "host"); return code;
    } catch (err) { showToast(err.message || "Failed to create room"); return null; }
  }, [deviceId, subscribeToRoom, showToast]);

  const doJoinRoom = useCallback(async (code, displayName) => {
    try {
      setSyncReady(false);
      try { metRef.current.tap(); } catch {} // unlock AudioContext during user gesture
      clockOffsetRef.current = await calibrateClock();
      const { admitted } = await joinRoomPending(code, displayName);
      lastCmdSeq.current = 0; originalSections.current = JSON.parse(JSON.stringify(sectionsRef.current));
      setSyncState({ code, role: "member", status: "lobby", members: {}, pending: {},
        sections: [], commandSeq: 0, command: null, isPending: !admitted, isAdmitted: admitted });
      await subscribeToRoom(code, "member"); return true;
    } catch (err) { showToast(err.message || "Failed to join room"); return false; }
  }, [subscribeToRoom, showToast]);

  const doLeaveRoom = useCallback(async () => {
    if (roomCode) await leaveRoom(roomCode);
    if (unsubRef.current) { unsubRef.current(); unsubRef.current = null; }
    if (heartbeatRef.current) { clearInterval(heartbeatRef.current); heartbeatRef.current = null; }
    const restore = originalSections.current;
    setSyncState(null); setSyncReady(false); lastCmdSeq.current = 0; originalSections.current = null; lastSectionsJson.current = null; roomSectionsJsonRef.current = null; clockOffsetRef.current = 0; roleRef.current = null;
    return restore;
  }, [roomCode]);

  const doAdmit = useCallback((id) => roomCode && admitMember(roomCode, id), [roomCode]);
  const doAdmitAll = useCallback(() => roomCode && admitAll(roomCode), [roomCode]);
  const doKick = useCallback((id) => roomCode && kickMember(roomCode, id), [roomCode]);
  const doKickAll = useCallback(() => roomCode && kickAll(roomCode), [roomCode]);

  const SYNC_LEAD_MS = 1000; // buffer for Firestore propagation to members

  const doStart = useCallback(async () => {
    if (!roomCode || !syncReadyRef.current) return; try { metRef.current.tap(); } catch {}
    const ci = settingsRef.current.countIn ?? 1;
    const sNow = Date.now() - clockOffsetRef.current;
    const t = sNow + SYNC_LEAD_MS; // expressed in server time
    // Call go() immediately — audio scheduler handles precise timing via syncDelayMs
    goRef.current(0, ci, SYNC_LEAD_MS);
    // Write to Firestore for members (fire-and-forget)
    sendCommand(roomCode, "start", { startAtMs: t, countInBars: ci });
  }, [roomCode]);

  const doPause = useCallback(async () => {
    if (!roomCode || !syncReadyRef.current) return;
    pauseRef.current();
    sendCommand(roomCode, "pause");
  }, [roomCode]);

  const doResume = useCallback(async (barNum = 1) => {
    if (!roomCode || !syncReadyRef.current) return; try { metRef.current.tap(); } catch {}
    const sNow = Date.now() - clockOffsetRef.current;
    const t = sNow + SYNC_LEAD_MS;
    const tl = buildTL(sectionsRef.current);
    const idx = tl.findIndex(b => b.ab === barNum);
    if (idx >= 0) goRef.current(idx, 0, SYNC_LEAD_MS);
    sendCommand(roomCode, "resume", { startAtMs: t, resumeFromBar: barNum });
  }, [roomCode]);

  const doStop = useCallback(async () => {
    if (!roomCode || !syncReadyRef.current) return;
    exitPlayRef.current();
    sendCommand(roomCode, "stop");
  }, [roomCode]);

  const doRestart = useCallback(async () => {
    if (!roomCode || !syncReadyRef.current) return; try { metRef.current.tap(); } catch {}
    const ci = settingsRef.current.countIn ?? 1;
    const sNow = Date.now() - clockOffsetRef.current;
    const t = sNow + SYNC_LEAD_MS;
    goRef.current(0, ci, SYNC_LEAD_MS);
    sendCommand(roomCode, "restart", { startAtMs: t, countInBars: ci });
  }, [roomCode]);

  // Auto-send sections to Firestore with debounce when host edits (Fix 4)
  const autoSendTimer = useRef(null);
  const lastAutoSendJson = useRef(null);
  useEffect(() => {
    if (!roomCode || !isHost) return;
    const j = JSON.stringify(sections);
    if (j === lastAutoSendJson.current) return;
    lastAutoSendJson.current = j;
    if (autoSendTimer.current) clearTimeout(autoSendTimer.current);
    autoSendTimer.current = setTimeout(async () => {
      try { await updateRoomSections(roomCode, sections); } catch {}
    }, 2000);
    return () => { if (autoSendTimer.current) clearTimeout(autoSendTimer.current); };
  }, [sections, roomCode, isHost]);

  const doSyncReset = useCallback(async () => {
    if (!roomCode || !isHost) return;
    // Host stops locally immediately
    exitPlayRef.current();
    showToast(t("sync.resetAll"));
    // Write to Firestore for members
    updateRoomSections(roomCode, sectionsRef.current);
    sendCommand(roomCode, "sync-reset");
  }, [roomCode, isHost, showToast]);

  const isMemberLocked = isInRoom && !isHost;

  return {
    syncState, showLobby, setShowLobby, toast, syncGlowPulse, syncReady,
    isHost, isInRoom, isMemberLocked, roomCode, deviceId,
    doCreateRoom, doJoinRoom, doLeaveRoom,
    doAdmit, doAdmitAll, doKick, doKickAll,
    doStart, doPause, doResume, doStop, doRestart, doSyncReset,
    SYNC_COLOR, SYNC_GLOW
  };
}

// ============ SYNC STATUS BAR (persistent strip below header when in room) ============
export function SyncStatusBar({ sync, onOpenLobby }) {
  const { syncState, isHost, doSyncReset, doStop, doRestart, doResume, doLeaveRoom, SYNC_COLOR } = sync;
  const members = syncState?.members || {};
  const pending = syncState?.pending || {};
  const memberCount = Object.keys(members).length;
  const pendingCount = Object.keys(pending).length;
  const status = syncState?.status || "lobby";
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const lt = useRef(null);
  const rt = useRef(null);
  useEffect(() => () => { if (lt.current) clearTimeout(lt.current); if (rt.current) clearTimeout(rt.current); }, []);

  const handleLeave = () => {
    if (confirmLeave) { doLeaveRoom(); setConfirmLeave(false); }
    else { setConfirmLeave(true); if (lt.current) clearTimeout(lt.current); lt.current = setTimeout(() => setConfirmLeave(false), 3000); }
  };

  const handleSyncReset = () => {
    if (confirmReset) { doSyncReset(); setConfirmReset(false); if (rt.current) clearTimeout(rt.current); }
    else { setConfirmReset(true); if (rt.current) clearTimeout(rt.current); rt.current = setTimeout(() => setConfirmReset(false), 3000); }
  };

  const sb = (clr = C.textMuted, bg = "transparent", bdr = C.border) => ({
    padding: "4px 10px", borderRadius: 6, border: `1px solid ${bdr}`, background: bg,
    color: clr, fontSize: 11, cursor: "pointer", fontFamily: "'Outfit',sans-serif", whiteSpace: "nowrap"
  });

  return (
    <div style={{ padding: "8px 16px", maxWidth: 480, margin: "0 auto", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", borderTop: `1px solid ${SYNC_COLOR}33`, borderBottom: `1px solid ${SYNC_COLOR}33`, background: SYNC_COLOR + "08" }}>
      <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: SYNC_COLOR, fontWeight: 600, background: SYNC_COLOR + "18", padding: "2px 8px", borderRadius: 4, letterSpacing: 1 }}>{syncState?.code}</span>
      <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
        {Object.keys(members).map(id => <div key={id} style={{ width: 6, height: 6, borderRadius: "50%", background: SYNC_COLOR }} />)}
        {pendingCount > 0 && <span style={{ fontSize: 10, color: "#f59e0b", fontFamily: "'DM Mono',monospace", marginLeft: 2 }}>+{pendingCount}</span>}
      </div>
      <span style={{ fontSize: 10, color: C.textMuted, fontFamily: "'DM Mono',monospace" }}>{memberCount}</span>
      <div style={{ flex: 1 }} />

      {isHost && <button onClick={handleSyncReset} style={sb(confirmReset ? "#000" : SYNC_COLOR, confirmReset ? SYNC_COLOR : SYNC_COLOR + "15", SYNC_COLOR + (confirmReset ? "" : "55"))}>{confirmReset ? t("sync.confirmQ") : t("sync.syncReset")}</button>}
      {isHost && status === "playing" && <button onClick={doStop} style={sb(C.danger, C.danger + "15", C.danger + "55")}>{t("sync.stop")}</button>}
      {isHost && status === "paused" && <button onClick={() => doResume(syncState?.resumeFromBar || 1)} style={sb(SYNC_COLOR, SYNC_COLOR + "15", SYNC_COLOR + "55")}>{t("sync.resume")}</button>}
      {isHost && status === "paused" && <button onClick={doRestart} style={sb("#000", SYNC_COLOR, SYNC_COLOR)}>{t("sync.restart")}</button>}
      {isHost && (pendingCount > 0 || memberCount > 1) && <button onClick={onOpenLobby} style={sb(SYNC_COLOR, "transparent", SYNC_COLOR + "55")}>{pendingCount > 0 ? `${pendingCount} ${t("sync.pending").toLowerCase()}` : t("sync.manage")}</button>}
      <button onClick={handleLeave} style={sb(confirmLeave ? C.danger : C.textMuted, confirmLeave ? C.danger + "15" : "transparent", confirmLeave ? C.danger + "55" : C.border)}>{confirmLeave ? t("sync.leaveQ") : I.x(12)}</button>
    </div>
  );
}

// ============ SYNC LOBBY (setup + member management only) ============
export function SyncLobby({ sync, onLoadSections }) {
  const { syncState, isHost, isInRoom, doCreateRoom, doJoinRoom, doLeaveRoom,
    doAdmit, doAdmitAll, doKick, doKickAll, setShowLobby, SYNC_COLOR } = sync;

  const [view, setView] = useState(isInRoom ? "room" : "entry");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [confirmKickId, setConfirmKickId] = useState(null);
  const [confirmKickAll, setConfirmKickAll] = useState(false);
  const [unlinkAction, setUnlinkAction] = useState(null); // null | "create" | "join"
  const [unlinking, setUnlinking] = useState(false);
  const kt = useRef(null); const kat = useRef(null);
  const [presence, setPresence] = useState({});

  useEffect(() => { if (isInRoom) setView("room"); }, [isInRoom]);
  useEffect(() => () => { if (kt.current) clearTimeout(kt.current); if (kat.current) clearTimeout(kat.current); }, []);

  // Poll presence subcollection when viewing room (for stale detection)
  useEffect(() => {
    if (view !== "room" || !syncState?.code) return;
    let active = true;
    const poll = async () => { const p = await readPresence(syncState.code); if (active) setPresence(p); };
    poll();
    const iv = setInterval(poll, 12000);
    return () => { active = false; clearInterval(iv); };
  }, [view, syncState?.code]);

  const handleCreate = async () => {
    if (!name.trim()) { setError(t("sync.enterName")); return; }
    setLoading(true); setError(null);
    const c = await doCreateRoom(name.trim()); setLoading(false);
    if (c) { setView("room"); setTimeout(() => setShowLobby(false), 500); }
  };

  const handleJoin = async () => {
    if (!name.trim()) { setError(t("sync.enterName")); return; }
    if (code.length !== ROOM_CODE_LEN) { setError(t("sync.enter4Digit")); return; }
    setLoading(true); setError(null);
    const ok = await doJoinRoom(code, name.trim()); setLoading(false);
    if (ok) setView("room"); else setError(t("sync.couldNotJoin"));
  };

  const handleLeave = async () => {
    const restore = await doLeaveRoom();
    if (restore) onLoadSections(restore);
    setView("entry"); setCode(""); setShowLobby(false);
  };

  const handleKick = (id) => {
    if (confirmKickId === id) { doKick(id); setConfirmKickId(null); if (kt.current) clearTimeout(kt.current); }
    else { setConfirmKickId(id); if (kt.current) clearTimeout(kt.current); kt.current = setTimeout(() => setConfirmKickId(null), 3000); }
  };
  const handleKickAll = () => {
    if (confirmKickAll) { doKickAll(); setConfirmKickAll(false); if (kat.current) clearTimeout(kat.current); }
    else { setConfirmKickAll(true); if (kat.current) clearTimeout(kat.current); kat.current = setTimeout(() => setConfirmKickAll(false), 3000); }
  };

  const close = () => setShowLobby(false);
  const members = syncState?.members || {};
  const pending = syncState?.pending || {};
  const memberList = Object.entries(members).filter(([id]) => id !== syncState?.hostId);
  const pendingList = Object.entries(pending);
  const memberCount = Object.keys(members).length;

  // Member: auto-close lobby once admitted (fire only on pending→admitted transition)
  const admitClosedRef = useRef(false);
  useEffect(() => {
    if (!isInRoom || isHost) { admitClosedRef.current = false; return; }
    if (syncState?.isAdmitted && !admitClosedRef.current) {
      admitClosedRef.current = true;
      setTimeout(() => setShowLobby(false), 400);
    }
  }, [syncState?.isAdmitted, isHost, isInRoom]);

  const mBg = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center" };
  const mBox = { width: "100%", maxWidth: 440, background: C.bg, borderTop: `1px solid ${C.border}`, borderRadius: "16px 16px 0 0", padding: "20px 20px 32px", maxHeight: "85vh", overflowY: "auto" };
  const hdr = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 };
  const ttl = { fontFamily: "'Outfit',sans-serif", fontSize: 16, color: SYNC_COLOR, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 };
  const inp = { ...nI, width: "100%", textAlign: "left", padding: "0 12px", marginBottom: 10, fontSize: 15 };
  const bp = { width: "100%", padding: "12px", borderRadius: 8, border: "none", background: SYNC_COLOR, color: "#000", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif" };
  const bo = (c = C.textMuted) => ({ width: "100%", padding: "10px", borderRadius: 8, border: `1px solid ${c}55`, background: "transparent", color: c, fontSize: 13, cursor: "pointer", fontFamily: "'Outfit',sans-serif" });
  const closeBtn = { background: "none", border: "none", color: C.textMuted, cursor: "pointer", display: "flex" };

  const handleEntryCreate = () => {
    if (getClusterId()) { setUnlinkAction("create"); return; }
    setView("create");
  };
  const handleEntryJoin = () => {
    if (getClusterId()) { setUnlinkAction("join"); return; }
    setView("join");
  };
  const handleConfirmUnlink = async () => {
    setUnlinking(true);
    try { await unlinkDeviceForSync(); } catch {}
    setUnlinking(false);
    const target = unlinkAction;
    setUnlinkAction(null);
    setView(target);
  };

  // UNLINK CONFIRMATION
  if (view === "entry" && unlinkAction) return (
    <div className="modal-bg" style={mBg} onClick={close}><div className="modal-content" style={mBox} onClick={e => e.stopPropagation()}>
      <div style={hdr}><div style={ttl}><SyncIcon size={18} /> {t("sync.mode")}</div><button className="close-btn" onClick={() => { setUnlinkAction(null); }} style={closeBtn}>{I.x(18)}</button></div>
      <div style={{ textAlign: "center", padding: "16px 0 20px" }}>
        <div style={{ fontSize: 13, color: C.text, fontFamily: "'Outfit',sans-serif", lineHeight: 1.5 }}>
          {unlinkAction === "create" ? t("link.unlinkForSyncHost") : t("link.unlinkForSync")}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <button onClick={handleConfirmUnlink} disabled={unlinking} style={{ ...bp, opacity: unlinking ? 0.6 : 1 }}>{unlinking ? "..." : t("link.confirmUnlink")}</button>
        <button onClick={() => setUnlinkAction(null)} style={bo(C.textMuted)}>{t("link.cancelUnlink")}</button>
      </div>
    </div></div>
  );

  // ENTRY
  if (view === "entry") return (
    <div className="modal-bg" style={mBg} onClick={close}><div className="modal-content" style={mBox} onClick={e => e.stopPropagation()}>
      <div style={hdr}><div style={ttl}><SyncIcon size={18} /> {t("sync.mode")}</div><button className="close-btn" onClick={close} style={closeBtn}>{I.x(18)}</button></div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <button onClick={handleEntryCreate} style={bp}>{t("sync.createRoom")}</button>
        <button onClick={handleEntryJoin} style={bo(SYNC_COLOR)}>{t("sync.joinRoom")}</button>
      </div>
      <div style={{ marginTop: 16, fontSize: 11, color: C.textMuted + "88", fontFamily: "'Outfit',sans-serif", textAlign: "center" }}>{t("sync.upTo")} {MAX_MEMBERS} {t("sync.maxDevices")}</div>
    </div></div>
  );

  // CREATE
  if (view === "create") return (
    <div className="modal-bg" style={mBg} onClick={close}><div className="modal-content" style={mBox} onClick={e => e.stopPropagation()}>
      <div style={hdr}><div style={ttl}><SyncIcon size={18} /> {t("sync.createRoom")}</div><button className="close-btn" onClick={() => setView("entry")} style={closeBtn}>{I.x(18)}</button></div>
      <input value={name} onChange={e => setName(e.target.value)} placeholder={t("sync.displayName")} autoFocus style={inp} onKeyDown={e => { if (e.key === "Enter") handleCreate(); }} />
      {error && <div style={{ fontSize: 12, color: C.danger, marginBottom: 8, fontFamily: "'Outfit',sans-serif" }}>{error}</div>}
      <button onClick={handleCreate} disabled={loading} style={{ ...bp, opacity: loading ? 0.6 : 1 }}>{loading ? t("sync.creating") : t("sync.createRoom")}</button>
    </div></div>
  );

  // JOIN
  if (view === "join") return (
    <div className="modal-bg" style={mBg} onClick={close}><div className="modal-content" style={mBox} onClick={e => e.stopPropagation()}>
      <div style={hdr}><div style={ttl}><SyncIcon size={18} /> {t("sync.joinRoom")}</div><button className="close-btn" onClick={() => setView("entry")} style={closeBtn}>{I.x(18)}</button></div>
      <input value={name} onChange={e => setName(e.target.value)} placeholder={t("sync.displayName")} autoFocus style={inp} />
      <div style={{ fontSize: 12, color: C.textMuted, fontFamily: "'Outfit',sans-serif", marginBottom: 6 }}>{t("sync.roomCode")}</div>
      <input value={code} onChange={e => setCode(e.target.value.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, ROOM_CODE_LEN))} placeholder="ABC123" style={{ ...inp, letterSpacing: code ? 6 : 2, textAlign: "center", fontSize: 22, fontFamily: "'DM Mono',monospace", maxWidth: "100%", boxSizing: "border-box", margin: 0, marginBottom: 10 }} onKeyDown={e => { if (e.key === "Enter") handleJoin(); }} />
      {error && <div style={{ fontSize: 12, color: C.danger, marginBottom: 8, fontFamily: "'Outfit',sans-serif" }}>{error}</div>}
      <button onClick={handleJoin} disabled={loading} style={{ ...bp, opacity: loading ? 0.6 : 1 }}>{loading ? t("sync.joining") : t("sync.joinRoom")}</button>
    </div></div>
  );

  // WAITING ROOM (member pending)
  if (!isHost && syncState?.isPending) return (
    <div className="modal-bg" style={mBg} onClick={close}><div className="modal-content" style={mBox} onClick={e => e.stopPropagation()}>
      <div style={hdr}><div style={ttl}><SyncIcon size={18} /> {t("sync.waitingRoom")}</div><button className="close-btn" onClick={close} style={closeBtn}>{I.x(18)}</button></div>
      <div style={{ textAlign: "center", padding: "32px 0" }}>
        <div style={{ fontSize: 14, color: C.text, fontFamily: "'Outfit',sans-serif", marginBottom: 8 }}>{t("sync.waitingForHost")}</div>
        <div style={{ fontSize: 12, color: C.textMuted, fontFamily: "'DM Mono',monospace" }}>{t("sync.room")} {syncState.code}</div>
        <div style={{ marginTop: 8 }}><div style={{ width: 8, height: 8, borderRadius: "50%", background: SYNC_COLOR, margin: "0 auto", opacity: 0.8 }} /></div>
      </div>
      <button onClick={handleLeave} style={bo(C.textMuted)}>{t("sync.leave")}</button>
    </div></div>
  );

  // LATE JOIN during performance
  if (!isHost && syncState?.isAdmitted && syncState?.status === "playing") return (
    <div className="modal-bg" style={mBg} onClick={close}><div className="modal-content" style={mBox} onClick={e => e.stopPropagation()}>
      <div style={hdr}><div style={ttl}><SyncIcon size={18} /> {t("sync.mode")}</div><button className="close-btn" onClick={close} style={closeBtn}>{I.x(18)}</button></div>
      <div style={{ textAlign: "center", padding: "32px 0" }}>
        <div style={{ fontSize: 14, color: C.text, fontFamily: "'Outfit',sans-serif", marginBottom: 8 }}>{t("sync.performanceInProgress")}</div>
        <div style={{ fontSize: 12, color: C.textMuted, fontFamily: "'Outfit',sans-serif" }}>{t("sync.waitingForNext")}</div>
        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 16 }}>
          {Object.keys(members).map(id => <div key={id} style={{ width: 8, height: 8, borderRadius: "50%", background: SYNC_COLOR }} />)}
        </div>
      </div>
      <button onClick={handleLeave} style={bo(C.textMuted)}>{t("sync.leaveRoom")}</button>
    </div></div>
  );

  // ROOM MANAGEMENT (host: manage members; anyone: view room)
  return (
    <div className="modal-bg" style={mBg} onClick={close}><div className="modal-content" style={mBox} onClick={e => e.stopPropagation()}>
      <div style={hdr}><div style={ttl}><SyncIcon size={18} /> {t("sync.room")} {syncState?.code}</div><button className="close-btn" onClick={close} style={closeBtn}>{I.x(18)}</button></div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 16 }}>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 28, color: SYNC_COLOR, letterSpacing: 6, fontWeight: 700 }}>{syncState?.code}</div>
        <button onClick={() => navigator.clipboard?.writeText(syncState?.code || "")} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 6, color: C.textMuted, cursor: "pointer", padding: 6, display: "flex" }}>{I.copy(14)}</button>
      </div>
      <div style={{ textAlign: "center", fontSize: 12, color: C.textMuted, fontFamily: "'DM Mono',monospace", marginBottom: 16 }}>{memberCount}/{MAX_MEMBERS} {tp("unit.member", memberCount)}</div>

      {/* Pending (host) */}
      {isHost && pendingList.length > 0 && <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: C.textMuted, fontFamily: "'Outfit',sans-serif", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>{t("sync.pending")} ({pendingList.length})</span>
          {pendingList.length > 1 && <button onClick={() => doAdmitAll()} style={{ background: "none", border: `1px solid ${SYNC_COLOR}55`, borderRadius: 6, color: SYNC_COLOR, fontSize: 11, cursor: "pointer", padding: "3px 8px", fontFamily: "'Outfit',sans-serif" }}>{t("sync.admitAll")}</button>}
        </div>
        {pendingList.map(([id, info]) => (
          <div key={id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#f59e0b", flexShrink: 0 }} />
            <div style={{ flex: 1, fontSize: 13, color: C.text, fontFamily: "'DM Mono',monospace" }}>{info.name || t("sync.unknown")}</div>
            <button onClick={() => doAdmit(id)} style={{ background: SYNC_COLOR + "22", border: `1px solid ${SYNC_COLOR}55`, borderRadius: 6, color: SYNC_COLOR, fontSize: 11, cursor: "pointer", padding: "4px 10px", fontFamily: "'Outfit',sans-serif" }}>{t("sync.admit")}</button>
            <button onClick={() => handleKick(id)} style={{ background: "none", border: `1px solid ${C.danger}44`, borderRadius: 6, color: C.danger, fontSize: 11, cursor: "pointer", padding: "4px 8px", fontFamily: "'Outfit',sans-serif", opacity: 0.7 }}>{t("sync.decline")}</button>
          </div>
        ))}
      </div>}

      {/* Members */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: C.textMuted, fontFamily: "'Outfit',sans-serif", marginBottom: 8 }}>{t("sync.members")}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: SYNC_COLOR, flexShrink: 0 }} />
          <div style={{ flex: 1, fontSize: 13, color: C.text, fontFamily: "'DM Mono',monospace" }}>{members[syncState?.hostId]?.name || t("sync.host")}<span style={{ fontSize: 10, color: SYNC_COLOR, marginLeft: 6 }}>{t("sync.host")}</span></div>
        </div>
        {memberList.map(([id, info]) => {
          const pres = presence[id];
          const stale = pres?.lastSeen ? (Date.now() - pres.lastSeen) > STALE_MS : false;
          return (<div key={id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: stale ? C.textMuted : SYNC_COLOR, flexShrink: 0 }} />
            <div style={{ flex: 1, fontSize: 13, color: stale ? C.textMuted : C.text, fontFamily: "'DM Mono',monospace" }}>{info.name || t("sync.unknown")}</div>
            {isHost && <button onClick={() => handleKick(id)} style={{ background: confirmKickId === id ? C.danger + "22" : "none", border: `1px solid ${confirmKickId === id ? C.danger : C.border}`, borderRadius: 6, color: confirmKickId === id ? C.danger : C.textMuted, fontSize: 11, cursor: "pointer", padding: "4px 8px", fontFamily: "'DM Mono',monospace", transition: "all 0.15s" }}>{confirmKickId === id ? t("sync.kickQ") : I.x(12)}</button>}
          </div>);
        })}
      </div>

      {isHost && memberList.length > 0 && <button onClick={handleKickAll} style={{ ...bo(confirmKickAll ? C.danger : C.textMuted), borderColor: confirmKickAll ? C.danger + "88" : C.border, color: confirmKickAll ? C.danger : C.textMuted, fontSize: 12, marginBottom: 8 }}>{confirmKickAll ? t("sync.removeAllConfirm") : t("sync.removeAll")}</button>}
      {!isHost && syncState?.isAdmitted && <button onClick={handleLeave} style={bo(C.textMuted)}>{t("sync.leaveRoom")}</button>}
      <button onClick={close} style={{ ...bo(SYNC_COLOR), marginTop: 8 }}>{t("sync.backToSections")}</button>
    </div></div>
  );
}

// ============ SYNC TOAST ============
export function SyncToast({ message }) {
  if (!message) return null;
  return (<div className="toast" style={{ position: "fixed", bottom: 90, left: "50%", zIndex: 60, background: C.surface, border: `1px solid ${SYNC_COLOR}44`, display: "flex", alignItems: "center", gap: 10, padding: "10px 18px", borderRadius: 12, boxShadow: `0 10px 40px rgba(0,0,0,0.5), 0 0 20px ${SYNC_COLOR}15`, transform: "translateX(-50%)" }}>
    <div style={{ width: 6, height: 6, borderRadius: "50%", background: SYNC_COLOR, flexShrink: 0 }} />
    <span style={{ fontSize: 13, color: C.text, fontFamily: "'Outfit',sans-serif" }}>{message}</span>
  </div>);
}
