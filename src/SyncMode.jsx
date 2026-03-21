import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { fbInit, getDeviceId, C, buildTL } from "./utils";
import { I, nI, SyncIcon } from "./components";
import { t } from "./i18n";

// ============ SYNC CONSTANTS ============
const SYNC_COLOR = "#06b6d4";
const SYNC_GLOW = "rgba(6, 182, 212, 0.4)";
const MAX_MEMBERS = 20;
const HEARTBEAT_MS = 10000;
const STALE_MS = 15000;

// ============ DEVICE LINK CONSTANTS ============
const LINK_COLOR = "#ec4899";
const LINK_GLOW = "rgba(236, 72, 153, 0.4)";
const LINK_CODE_TTL = 5 * 60 * 1000; // 5 minutes
const RTDB_URL = "https://tempus-acc0e-default-rtdb.firebaseio.com";

// ============ FIRESTORE HELPERS ============
let _fsModule = null;
async function getFS() {
  if (!_fsModule) _fsModule = await import("https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js");
  return _fsModule;
}
// Pre-warm Firestore module on import
getFS().catch(() => {});

function genRoomCode() { return String(Math.floor(1000 + Math.random() * 9000)); }

async function createRoom(sections, settings, displayName, _retries = 0) {
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
      return createRoom(sections, settings, displayName, _retries + 1);
    }
  }
  await fs.setDoc(fs.doc(db, "tempus_rooms", code), {
    code, hostId: deviceId, hostName: displayName, status: "lobby",
    sections: JSON.parse(JSON.stringify(sections)),
    commandSeq: 0, command: null, startAtMs: null,
    resumeFromBar: 1, countInBars: settings.countIn || 1,
    members: { [deviceId]: { name: displayName, joinedAt: Date.now(), lastSeen: Date.now() } },
    pending: {}, createdAt: Date.now()
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
  if (Object.keys(data.members || {}).length + Object.keys(data.pending || {}).length >= MAX_MEMBERS) throw new Error("Room is full");
  if (data.members?.[deviceId]) {
    await fs.updateDoc(ref, { [`members.${deviceId}.name`]: displayName, [`members.${deviceId}.lastSeen`]: Date.now() });
    return { admitted: true };
  }
  await fs.updateDoc(ref, { [`pending.${deviceId}`]: { name: displayName, requestedAt: Date.now() } });
  return { admitted: false };
}

async function admitMember(code, memberId) {
  const db = await fbInit(); if (!db) return; const fs = await getFS();
  const snap = await fs.getDoc(fs.doc(db, "tempus_rooms", code)); if (!snap.exists()) return;
  const p = snap.data().pending?.[memberId]; if (!p) return;
  await fs.updateDoc(fs.doc(db, "tempus_rooms", code), { [`members.${memberId}`]: { name: p.name, joinedAt: Date.now(), lastSeen: Date.now() }, [`pending.${memberId}`]: fs.deleteField() });
}

async function admitAll(code) {
  const db = await fbInit(); if (!db) return; const fs = await getFS();
  const snap = await fs.getDoc(fs.doc(db, "tempus_rooms", code)); if (!snap.exists()) return;
  const updates = {};
  for (const [id, info] of Object.entries(snap.data().pending || {})) {
    updates[`members.${id}`] = { name: info.name, joinedAt: Date.now(), lastSeen: Date.now() };
    updates[`pending.${id}`] = fs.deleteField();
  }
  if (Object.keys(updates).length > 0) await fs.updateDoc(fs.doc(db, "tempus_rooms", code), updates);
}

async function kickMember(code, memberId) {
  const db = await fbInit(); if (!db) return; const fs = await getFS();
  await fs.updateDoc(fs.doc(db, "tempus_rooms", code), { [`members.${memberId}`]: fs.deleteField() });
}

async function kickAll(code) {
  const db = await fbInit(); if (!db) return; const fs = await getFS();
  const snap = await fs.getDoc(fs.doc(db, "tempus_rooms", code)); if (!snap.exists()) return;
  const data = snap.data(); const updates = {};
  for (const id of Object.keys(data.members || {})) { if (id !== data.hostId) { updates[`members.${id}`] = fs.deleteField(); } }
  for (const id of Object.keys(data.pending || {})) { updates[`pending.${id}`] = fs.deleteField(); }
  if (Object.keys(updates).length > 0) await fs.updateDoc(fs.doc(db, "tempus_rooms", code), updates);
}

async function sendCommand(code, command, extra = {}) {
  try {
    const t0 = Date.now();
    console.log(`[SYNC-DIAG] sendCommand START | cmd=${command} | t=${t0} | code=${code}`);
    const status = command === "start" || command === "restart" ? "playing" : command === "pause" ? "paused" : command === "stop" || command === "sync-reset" ? "stopped" : undefined;

    // FAST PATH: Write command to RTDB (~50-150ms vs Firestore ~800-1400ms)
    const { mod, db: rtdb } = await getRTDB();
    const cmdData = { command, seq: t0, ...extra };
    if (status) cmdData.status = status;
    await mod.set(mod.ref(rtdb, `sync_commands/${code}`), cmdData);
    console.log(`[SYNC-DIAG] sendCommand RTDB DONE | cmd=${command} | wrote in ${Date.now() - t0}ms`);

    // SLOW PATH (fire-and-forget): Update Firestore status for room metadata UI
    if (status) {
      fbInit().then(async db => {
        if (!db) return; const fs = await getFS();
        fs.updateDoc(fs.doc(db, "tempus_rooms", code), { status }).catch(() => {});
      }).catch(() => {});
    }
  } catch (e) { console.error("[SYNC-DIAG] sendCommand FAILED:", command, e); }
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
    await fs.setDoc(fs.doc(db, "tempus_rooms", code, "presence", deviceId), { lastSeen: Date.now() }, { merge: true });
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
    if (snap.data().hostId === deviceId) {
      await fs.deleteDoc(ref);
      // Host also cleans up RTDB command channel
      try { const { mod, db: rtdb } = await getRTDB(); await mod.remove(mod.ref(rtdb, `sync_commands/${code}`)); } catch {}
    }
    else await fs.updateDoc(ref, { [`members.${deviceId}`]: fs.deleteField(), [`pending.${deviceId}`]: fs.deleteField() });
  } catch {}
}

// ============ CLOCK CALIBRATION ============
// Timeout wrapper — prevents indefinite hangs when Firestore rules block writes
function withTimeout(promise, ms, fallback) {
  let timer;
  return Promise.race([
    promise,
    new Promise(resolve => { timer = setTimeout(() => resolve(fallback), ms); })
  ]).finally(() => clearTimeout(timer));
}

// Single-ping calibration: 1 write + 1 read + 1 delete = ~300-500ms
// offset = localTime - serverTime. To get server-equivalent time: Date.now() - offset
async function _calibrateClockInner() {
  try {
    const db = await fbInit(); if (!db) return 0;
    const fs = await getFS();
    const deviceId = getDeviceId();
    const calRef = fs.doc(db, "tempus_clock_cal", deviceId);
    const localBefore = Date.now();
    await fs.setDoc(calRef, { t: fs.serverTimestamp() });
    const localAfter = Date.now();
    const snap = await fs.getDoc(calRef);
    const serverMs = snap.data()?.t?.toMillis?.();
    try { await fs.deleteDoc(calRef); } catch {}
    if (serverMs) return ((localBefore + localAfter) / 2) - serverMs;
    return 0;
  } catch (e) { console.error("calibrateClock error:", e); return 0; }
}
// Public wrapper: 5s timeout so UI never hangs
async function calibrateClock() {
  return withTimeout(_calibrateClockInner(), 5000, 0);
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
  const admittedRef = useRef(false); // track admission for kick detection

  // Process command from RTDB onValue callback (fast path)
  const processCommand = useCallback((d, isAdmitted) => {
    const seq = d.seq || 0;
    const cmd = d.command;
    console.log(`[SYNC-DIAG] processCommand | cmd=${cmd} | seq=${seq} | lastSeq=${lastCmdSeq.current} | isAdmitted=${isAdmitted} | role=${roleRef.current}`);
    if (!isAdmitted || roleRef.current === "host") { console.log(`[SYNC-DIAG] processCommand SKIPPED (host or not admitted)`); return; }
    const startAtMs = d.startAtMs;
    if (seq <= lastCmdSeq.current) { console.log(`[SYNC-DIAG] processCommand SKIPPED (seq ${seq} <= lastSeq ${lastCmdSeq.current})`); return; }
    lastCmdSeq.current = seq;
    console.log(`[SYNC-DIAG] processCommand EXECUTING | cmd=${cmd} | seq=${seq} | t=${Date.now()}`);
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

    // --- RTDB COMMAND LISTENER (fast path: ~50-150ms delivery) ---
    let rtdbUnsub = null;
    let firstRtdb = true;
    try {
      const { mod, db: rtdb } = await getRTDB();
      const cmdRef = mod.ref(rtdb, `sync_commands/${code}`);
      rtdbUnsub = mod.onValue(cmdRef, (snap) => {
        const d = snap.val();
        if (!d || !d.command) return; // no command yet
        console.log(`[SYNC-DIAG] RTDB onValue | cmd=${d.command} | seq=${d.seq} | t=${Date.now()}`);
        // First RTDB snapshot: initialize seq baseline, don't execute
        if (firstRtdb) {
          firstRtdb = false;
          lastCmdSeq.current = d.seq || 0;
          console.log(`[SYNC-DIAG] RTDB FIRST VALUE — initSeq=${d.seq || 0}`);
          return;
        }
        // Update syncState status immediately from RTDB (faster than Firestore)
        if (d.status) {
          setSyncState(prev => prev ? { ...prev, status: d.status, command: d.command,
            startAtMs: d.startAtMs, resumeFromBar: d.resumeFromBar, countInBars: d.countInBars } : prev);
        }
        processCommand(d, admittedRef.current);
      }, (err) => {
        console.error("[SYNC-DIAG] RTDB command listener error:", err);
      });
    } catch (e) {
      console.error("[SYNC-DIAG] RTDB command listener setup failed:", e);
    }

    // --- FIRESTORE ROOM METADATA LISTENER (members, sections, kick detection) ---
    const fsUnsub = fs.onSnapshot(fs.doc(db, "tempus_rooms", code), (snap) => {
      console.log(`[SYNC-DIAG] FS onSnapshot FIRED | t=${Date.now()} | exists=${snap.exists()} | role=${role}`);
      if (!snap.exists()) {
        setSyncState(null); if (unsubRef.current) { unsubRef.current(); unsubRef.current = null; }
        if (originalSections.current) showToast(t("toast_room_closed"));
        return;
      }
      const d = snap.data(); const myId = getDeviceId();
      const nowInMembers = !!(d.members?.[myId]);
      const nowInPending = !!(d.pending?.[myId]);
      // Detect removal: was admitted, now gone from both members and pending
      if (admittedRef.current && !nowInMembers && !nowInPending && !firstSnapshot) {
        admittedRef.current = false;
        setSyncState(null); if (unsubRef.current) { unsubRef.current(); unsubRef.current = null; }
        showToast(t("toast_removed")); return;
      }
      if (nowInMembers) admittedRef.current = true;
      // On first snapshot, mark connection as ready
      if (firstSnapshot) {
        console.log(`[SYNC-DIAG] FIRST FS SNAPSHOT — syncReady → true | t=${Date.now()}`);
        firstSnapshot = false;
        setSyncReady(true);
      }
      const isAdmitted = !!(d.members?.[myId]);
      // NOTE: processCommand removed from here — commands now arrive via RTDB (faster)
      // Update React state for room metadata UI
      const newSJ = JSON.stringify(d.sections);
      const sectionsChanged = newSJ !== roomSectionsJsonRef.current;
      if (sectionsChanged) roomSectionsJsonRef.current = newSJ;
      setSyncState(prev => ({
        ...prev, code, role, hostId: d.hostId, hostName: d.hostName || "♛",
        status: d.status || prev?.status, // prefer RTDB-updated status if already set
        members: d.members || {}, pending: d.pending || {},
        sections: sectionsChanged ? d.sections : (prev?.sections || d.sections),
        isPending: !!(d.pending?.[myId]) && !(d.members?.[myId]),
        isAdmitted
      }));
    }, (err) => {
      console.error("Sync onSnapshot error:", err);
      showToast("Connection lost — rejoin room");
    });

    // Combined unsubscribe
    unsubRef.current = () => {
      fsUnsub();
      if (rtdbUnsub) rtdbUnsub();
    };
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
      // Recalibrate every 6th heartbeat (~60s) to combat clock drift
      if (heartbeatCount.current % 6 === 0) {
        const newOffset = await calibrateClock();
        if (newOffset !== 0) clockOffsetRef.current = newOffset;
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
      // Calibrate in background — don't block room creation
      calibrateClock().then(offset => { clockOffsetRef.current = offset; });
      const code = await createRoom(sectionsRef.current, settingsRef.current, displayName);
      lastCmdSeq.current = 0; originalSections.current = null;
      setSyncState({ code, role: "host", hostId: deviceId, hostName: displayName, status: "lobby",
        members: { [deviceId]: { name: displayName, joinedAt: Date.now(), lastSeen: Date.now() } },
        pending: {}, sections: sectionsRef.current, commandSeq: 0, command: null,
        startAtMs: null, resumeFromBar: 1, countInBars: settingsRef.current.countIn || 1, isPending: false, isAdmitted: true });
      await subscribeToRoom(code, "host"); return code;
    } catch (err) { showToast(err.message || t("err_create_fail")); return null; }
  }, [deviceId, subscribeToRoom, showToast]);

  const doJoinRoom = useCallback(async (code, displayName) => {
    try {
      setSyncReady(false);
      try { metRef.current.tap(); } catch {} // unlock AudioContext during user gesture
      // Calibrate in background — don't block room join
      calibrateClock().then(offset => { clockOffsetRef.current = offset; });
      const { admitted } = await joinRoomPending(code, displayName);
      lastCmdSeq.current = 0; originalSections.current = JSON.parse(JSON.stringify(sectionsRef.current));
      setSyncState({ code, role: "member", status: "lobby", members: {}, pending: {},
        sections: [], commandSeq: 0, command: null, isPending: !admitted, isAdmitted: admitted });
      await subscribeToRoom(code, "member"); return true;
    } catch (err) { showToast(err.message || t("err_join_fail")); return false; }
  }, [subscribeToRoom, showToast]);

  const doLeaveRoom = useCallback(async () => {
    if (roomCode) await leaveRoom(roomCode);
    if (unsubRef.current) { unsubRef.current(); unsubRef.current = null; }
    if (heartbeatRef.current) { clearInterval(heartbeatRef.current); heartbeatRef.current = null; }
    const restore = originalSections.current;
    setSyncState(null); setSyncReady(false); lastCmdSeq.current = 0; originalSections.current = null; lastSectionsJson.current = null; roomSectionsJsonRef.current = null; clockOffsetRef.current = 0; roleRef.current = null; admittedRef.current = false;
    return restore;
  }, [roomCode]);

  const doAdmit = useCallback((id) => roomCode && admitMember(roomCode, id), [roomCode]);
  const doAdmitAll = useCallback(() => roomCode && admitAll(roomCode), [roomCode]);
  const doKick = useCallback((id) => roomCode && kickMember(roomCode, id), [roomCode]);
  const doKickAll = useCallback(() => roomCode && kickAll(roomCode), [roomCode]);

  const SYNC_LEAD_MS = 500; // RTDB propagation is ~50-150ms; 500ms gives comfortable margin

  const doStart = useCallback(async () => {
    console.log(`[SYNC-DIAG] doStart called | t=${Date.now()} | syncReady=${syncReadyRef.current} | roomCode=${roomCode}`);
    if (!roomCode || !syncReadyRef.current) { console.warn(`[SYNC-DIAG] doStart BLOCKED`); return; }
    try { metRef.current.tap(); } catch {}
    const ci = settingsRef.current.countIn ?? 1;
    const sNow = Date.now() - clockOffsetRef.current;
    const startMs = sNow + SYNC_LEAD_MS;
    goRef.current(0, ci, SYNC_LEAD_MS);
    await sendCommand(roomCode, "start", { startAtMs: startMs, countInBars: ci });
  }, [roomCode]);

  const doPause = useCallback(async () => {
    console.log(`[SYNC-DIAG] doPause called | t=${Date.now()} | syncReady=${syncReadyRef.current}`);
    if (!roomCode || !syncReadyRef.current) { console.warn(`[SYNC-DIAG] doPause BLOCKED`); return; }
    pauseRef.current();
    await sendCommand(roomCode, "pause");
  }, [roomCode]);

  const doResume = useCallback(async (barNum = 1) => {
    console.log(`[SYNC-DIAG] doResume called | t=${Date.now()} | syncReady=${syncReadyRef.current}`);
    if (!roomCode || !syncReadyRef.current) { console.warn(`[SYNC-DIAG] doResume BLOCKED`); return; }
    try { metRef.current.tap(); } catch {}
    const sNow = Date.now() - clockOffsetRef.current;
    const startMs = sNow + SYNC_LEAD_MS;
    const tl = buildTL(sectionsRef.current);
    const idx = tl.findIndex(b => b.ab === barNum);
    if (idx >= 0) goRef.current(idx, 0, SYNC_LEAD_MS);
    await sendCommand(roomCode, "resume", { startAtMs: startMs, resumeFromBar: barNum });
  }, [roomCode]);

  const doStop = useCallback(async () => {
    console.log(`[SYNC-DIAG] doStop called | t=${Date.now()} | syncReady=${syncReadyRef.current}`);
    if (!roomCode || !syncReadyRef.current) { console.warn(`[SYNC-DIAG] doStop BLOCKED`); return; }
    exitPlayRef.current();
    await sendCommand(roomCode, "stop");
  }, [roomCode]);

  const doRestart = useCallback(async () => {
    console.log(`[SYNC-DIAG] doRestart called | t=${Date.now()} | syncReady=${syncReadyRef.current}`);
    if (!roomCode || !syncReadyRef.current) { console.warn(`[SYNC-DIAG] doRestart BLOCKED`); return; }
    try { metRef.current.tap(); } catch {}
    const ci = settingsRef.current.countIn ?? 1;
    const sNow = Date.now() - clockOffsetRef.current;
    const startMs = sNow + SYNC_LEAD_MS;
    goRef.current(0, ci, SYNC_LEAD_MS);
    await sendCommand(roomCode, "restart", { startAtMs: startMs, countInBars: ci });
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
    exitPlayRef.current();
    showToast(t("toast_sync_reset"));
    await updateRoomSections(roomCode, sectionsRef.current);
    await sendCommand(roomCode, "sync-reset");
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
        {Object.keys(members).map(id => <div key={id} style={{ width: 6, height: 6, borderRadius: "50%", background: SYNC_COLOR, boxShadow: `0 0 4px ${SYNC_COLOR}` }} />)}
        {pendingCount > 0 && <span style={{ fontSize: 10, color: "#f59e0b", fontFamily: "'DM Mono',monospace", marginLeft: 2 }}>+{pendingCount}</span>}
      </div>
      <span style={{ fontSize: 10, color: C.textMuted, fontFamily: "'DM Mono',monospace" }}>{memberCount}</span>
      <div style={{ flex: 1 }} />

      {isHost && <button onClick={handleSyncReset} style={sb(confirmReset ? "#000" : SYNC_COLOR, confirmReset ? SYNC_COLOR : SYNC_COLOR + "15", SYNC_COLOR + (confirmReset ? "" : "55"))}>{confirmReset ? <>{I.restart(12)} <span style={{ fontWeight: 700 }}>?</span></> : I.restart(12)}</button>}
      {isHost && status === "playing" && <button onClick={doStop} style={sb(C.danger, C.danger + "15", C.danger + "55")}>{I.x(12)}</button>}
      {isHost && status === "paused" && <button onClick={() => doResume(syncState?.resumeFromBar || 1)} style={sb(SYNC_COLOR, SYNC_COLOR + "15", SYNC_COLOR + "55")}>{I.play(12)}</button>}
      {isHost && status === "paused" && <button onClick={doRestart} style={sb("#000", SYNC_COLOR, SYNC_COLOR)}>{I.restart(12)}</button>}
      {isHost && (pendingCount > 0 || memberCount > 1) && <button onClick={onOpenLobby} style={sb(SYNC_COLOR, "transparent", SYNC_COLOR + "55")}>{pendingCount > 0 ? `+${pendingCount}` : I.gear(12)}</button>}
      <button onClick={handleLeave} style={sb(confirmLeave ? C.danger : C.textMuted, confirmLeave ? C.danger + "15" : "transparent", confirmLeave ? C.danger + "55" : C.border)}>{confirmLeave ? <>{I.x(12)}<span style={{ fontWeight: 700 }}>?</span></> : I.x(12)}</button>
    </div>
  );
}

// ============ SYNC LOBBY (setup + member management only) ============
export function SyncLobby({ sync, onLoadSections, link }) {
  const { syncState, isHost, isInRoom, doCreateRoom, doJoinRoom, doLeaveRoom,
    doAdmit, doAdmitAll, doKick, doKickAll, setShowLobby, SYNC_COLOR } = sync;
  const isDeviceLinked = link?.isLinked;
  const unlinkForSync = link?.unlinkDeviceForSync;

  const [view, setView] = useState(isInRoom ? "room" : isDeviceLinked ? "unlink" : "entry");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [confirmKickId, setConfirmKickId] = useState(null);
  const [confirmKickAll, setConfirmKickAll] = useState(false);
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
    if (!name.trim()) { setError(t("err_enter_name")); return; }
    setLoading(true); setError(null);
    const c = await doCreateRoom(name.trim()); setLoading(false);
    if (c) { setView("room"); setTimeout(() => setShowLobby(false), 500); }
  };

  const handleJoin = async () => {
    if (!name.trim()) { setError(t("err_enter_name")); return; }
    if (code.length !== 4) { setError(t("err_enter_code")); return; }
    setLoading(true); setError(null);
    const ok = await doJoinRoom(code, name.trim()); setLoading(false);
    if (ok) setView("room"); else setError(t("err_join_fail_2"));
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

  // UNLINK PROMPT (device is linked to a cluster — must unlink before syncing)
  if (view === "unlink" && isDeviceLinked) return (
    <div className="modal-bg" style={mBg} onClick={close}><div className="modal-content" style={mBox} onClick={e => e.stopPropagation()}>
      <div style={hdr}><div style={ttl}><SyncIcon size={18} /> {t("sync_mode")}</div><button className="close-btn" onClick={close} style={closeBtn}>{I.x(18)}</button></div>
      <div style={{ textAlign: "center", padding: "16px 0" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 12, color: LINK_COLOR }}>{I.desktop(24)}</div>
        <div style={{ fontSize: 12, color: C.textMuted, fontFamily: "'Outfit',sans-serif", marginBottom: 16 }}>
          {t("unlink_to_sync")}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <button onClick={async () => { if (unlinkForSync) await unlinkForSync(); setView("entry"); }} style={bp}>{I.unlink(16)}</button>
        <button onClick={close} style={bo(C.textMuted)}>{I.x(14)}</button>
      </div>
    </div></div>
  );

  // ENTRY (Sync Lobby)
  if (view === "entry") return (
    <div className="modal-bg" style={mBg} onClick={close}><div className="modal-content" style={mBox} onClick={e => e.stopPropagation()}>
      <div style={hdr}><div style={ttl}><SyncIcon size={18} /> {t("sync_mode")}</div><button className="close-btn" onClick={close} style={closeBtn}>{I.x(18)}</button></div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <button onClick={() => setView("create")} style={bp}>{t("create_room")}</button>
        <button onClick={() => setView("join")} style={bo(SYNC_COLOR)}>{t("join_room")}</button>
      </div>
      <div style={{ marginTop: 16, fontSize: 11, color: C.textMuted + "88", fontFamily: "'Outfit',sans-serif", textAlign: "center" }}>{t("sync_hint").replace("{n}", MAX_MEMBERS)}</div>
    </div></div>
  );

  // CREATE
  if (view === "create") return (
    <div className="modal-bg" style={mBg} onClick={close}><div className="modal-content" style={mBox} onClick={e => e.stopPropagation()}>
      <div style={hdr}><div style={ttl}><SyncIcon size={18} /> {t("create_room")}</div><button className="close-btn" onClick={() => setView("entry")} style={closeBtn}>{I.x(18)}</button></div>
      <input value={name} onChange={e => setName(e.target.value)} placeholder={t("ph_display_name")} autoFocus style={inp} onKeyDown={e => { if (e.key === "Enter") handleCreate(); }} />
      {error && <div style={{ fontSize: 12, color: C.danger, marginBottom: 8, fontFamily: "'Outfit',sans-serif" }}>{error}</div>}
      <button onClick={handleCreate} disabled={loading} style={{ ...bp, opacity: loading ? 0.6 : 1 }}>{loading ? t("creating") : t("create_room")}</button>
    </div></div>
  );

  // JOIN
  if (view === "join") return (
    <div className="modal-bg" style={mBg} onClick={close}><div className="modal-content" style={mBox} onClick={e => e.stopPropagation()}>
      <div style={hdr}><div style={ttl}><SyncIcon size={18} /> {t("join_room")}</div><button className="close-btn" onClick={() => setView("entry")} style={closeBtn}>{I.x(18)}</button></div>
      <input value={name} onChange={e => setName(e.target.value)} placeholder={t("ph_display_name")} autoFocus style={inp} />
      <div style={{ fontSize: 12, color: C.textMuted, fontFamily: "'Outfit',sans-serif", marginBottom: 6 }}>{t("room_code")}</div>
      <input value={code} onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder={t("ph_room_code")} inputMode="numeric" style={{ ...inp, letterSpacing: code ? 6 : 2, textAlign: "center", fontSize: 22, fontFamily: "'DM Mono',monospace", maxWidth: "100%", boxSizing: "border-box", margin: 0, marginBottom: 10 }} onKeyDown={e => { if (e.key === "Enter") handleJoin(); }} />
      {error && <div style={{ fontSize: 12, color: C.danger, marginBottom: 8, fontFamily: "'Outfit',sans-serif" }}>{error}</div>}
      <button onClick={handleJoin} disabled={loading} style={{ ...bp, opacity: loading ? 0.6 : 1 }}>{loading ? t("joining") : t("join_room")}</button>
    </div></div>
  );

  // WAITING ROOM (member pending)
  if (!isHost && syncState?.isPending) return (
    <div className="modal-bg" style={mBg} onClick={close}><div className="modal-content" style={mBox} onClick={e => e.stopPropagation()}>
      <div style={hdr}><div style={ttl}><SyncIcon size={18} /> {t("waiting_room")}</div><button className="close-btn" onClick={close} style={closeBtn}>{I.x(18)}</button></div>
      <div style={{ textAlign: "center", padding: "32px 0" }}>
        <div style={{ fontSize: 14, color: C.text, fontFamily: "'Outfit',sans-serif", marginBottom: 8 }}>{t("waiting_host")}</div>
        <div style={{ fontSize: 12, color: C.textMuted, fontFamily: "'DM Mono',monospace" }}>{t("room_n")} {syncState.code}</div>
        <div style={{ marginTop: 8 }}><div className="sync-pulse" style={{ width: 8, height: 8, borderRadius: "50%", background: SYNC_COLOR, margin: "0 auto" }} /></div>
      </div>
      <button onClick={handleLeave} style={bo(C.textMuted)}>{I.x(14)}</button>
    </div></div>
  );

  // LATE JOIN during performance
  if (!isHost && syncState?.isAdmitted && syncState?.status === "playing") return (
    <div className="modal-bg" style={mBg} onClick={close}><div className="modal-content" style={mBox} onClick={e => e.stopPropagation()}>
      <div style={hdr}><div style={ttl}><SyncIcon size={18} /> {t("sync_mode")}</div><button className="close-btn" onClick={close} style={closeBtn}>{I.x(18)}</button></div>
      <div style={{ textAlign: "center", padding: "32px 0" }}>
        <div style={{ fontSize: 14, color: C.text, fontFamily: "'Outfit',sans-serif", marginBottom: 8 }}>{t("perf_in_progress")}</div>
        <div style={{ fontSize: 12, color: C.textMuted, fontFamily: "'Outfit',sans-serif" }}>{t("waiting_next_start")}</div>
        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 16 }}>
          {Object.keys(members).map(id => <div key={id} style={{ width: 8, height: 8, borderRadius: "50%", background: SYNC_COLOR }} />)}
        </div>
      </div>
      <button onClick={handleLeave} style={bo(C.textMuted)}>{I.x(14)}</button>
    </div></div>
  );

  // ROOM MANAGEMENT (host: manage members; anyone: view room)
  return (
    <div className="modal-bg" style={mBg} onClick={close}><div className="modal-content" style={mBox} onClick={e => e.stopPropagation()}>
      <div style={hdr}><div style={ttl}><SyncIcon size={18} /> {t("room_n")} {syncState?.code}</div><button className="close-btn" onClick={close} style={closeBtn}>{I.x(18)}</button></div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 16 }}>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 28, color: SYNC_COLOR, letterSpacing: 6, fontWeight: 700 }}>{syncState?.code}</div>
        <button onClick={() => navigator.clipboard?.writeText(syncState?.code || "")} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 6, color: C.textMuted, cursor: "pointer", padding: 6, display: "flex" }}>{I.copy(14)}</button>
      </div>
      <div style={{ textAlign: "center", fontSize: 12, color: C.textMuted, fontFamily: "'DM Mono',monospace", marginBottom: 16 }}>{memberCount}/{MAX_MEMBERS} {t("members_label")}</div>

      {/* Pending (host) */}
      {isHost && pendingList.length > 0 && <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: C.textMuted, fontFamily: "'Outfit',sans-serif", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>{t("pending_n")} ({pendingList.length})</span>
          {pendingList.length > 1 && <button onClick={() => doAdmitAll()} style={{ background: "none", border: `1px solid ${SYNC_COLOR}55`, borderRadius: 6, color: SYNC_COLOR, fontSize: 11, cursor: "pointer", padding: "3px 8px", fontFamily: "'Outfit',sans-serif" }}>✓ ×{pendingList.length}</button>}
        </div>
        {pendingList.map(([id, info]) => (
          <div key={id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#f59e0b", flexShrink: 0 }} />
            <div style={{ flex: 1, fontSize: 13, color: C.text, fontFamily: "'DM Mono',monospace" }}>{info.name || "—"}</div>
            <button onClick={() => doAdmit(id)} style={{ background: SYNC_COLOR + "22", border: `1px solid ${SYNC_COLOR}55`, borderRadius: 6, color: SYNC_COLOR, fontSize: 14, cursor: "pointer", padding: "4px 10px", display: "flex", alignItems: "center" }}>✓</button>
            <button onClick={() => handleKick(id)} style={{ background: "none", border: `1px solid ${C.danger}44`, borderRadius: 6, color: C.danger, fontSize: 11, cursor: "pointer", padding: "4px 8px", display: "flex", alignItems: "center", opacity: 0.7 }}>{I.x(12)}</button>
          </div>
        ))}
      </div>}

      {/* Members */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: C.textMuted, fontFamily: "'Outfit',sans-serif", marginBottom: 8 }}>{t("members")}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: SYNC_COLOR, flexShrink: 0, boxShadow: `0 0 6px ${SYNC_COLOR}` }} />
          <div style={{ flex: 1, fontSize: 13, color: C.text, fontFamily: "'DM Mono',monospace" }}>{members[syncState?.hostId]?.name || "♛"}<span style={{ fontSize: 10, color: SYNC_COLOR, marginLeft: 6 }}>♛</span></div>
        </div>
        {memberList.map(([id, info]) => {
          const pres = presence[id];
          const stale = pres?.lastSeen ? (Date.now() - pres.lastSeen) > STALE_MS : false;
          return (<div key={id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: stale ? C.textMuted : SYNC_COLOR, flexShrink: 0, boxShadow: stale ? "none" : `0 0 6px ${SYNC_COLOR}` }} />
            <div style={{ flex: 1, fontSize: 13, color: stale ? C.textMuted : C.text, fontFamily: "'DM Mono',monospace" }}>{info.name || "—"}</div>
            {isHost && <button onClick={() => handleKick(id)} style={{ background: confirmKickId === id ? C.danger + "22" : "none", border: `1px solid ${confirmKickId === id ? C.danger : C.border}`, borderRadius: 6, color: confirmKickId === id ? C.danger : C.textMuted, fontSize: 11, cursor: "pointer", padding: "4px 8px", fontFamily: "'DM Mono',monospace", transition: "all 0.15s" }}>{confirmKickId === id ? <>{I.x(12)}<span style={{ fontSize: 11, fontWeight: 700 }}>?</span></> : I.x(12)}</button>}
          </div>);
        })}
      </div>

      {isHost && memberList.length > 0 && <button onClick={handleKickAll} style={{ ...bo(confirmKickAll ? C.danger : C.textMuted), borderColor: confirmKickAll ? C.danger + "88" : C.border, color: confirmKickAll ? C.danger : C.textMuted, fontSize: 12, marginBottom: 8 }}>{confirmKickAll ? <>{I.x(12)} <span style={{ fontWeight: 700 }}>?</span></> : <>{I.x(12)} ×{memberList.length}</>}</button>}
      {!isHost && syncState?.isAdmitted && <button onClick={handleLeave} style={bo(C.textMuted)}>{I.x(14)}</button>}
      <button onClick={close} style={{ ...bo(SYNC_COLOR), marginTop: 8, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>{I.chevL(14)}</button>
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

// ============ RTDB MODULE ============
let _rtdbMod = null, _rtdbDb = null;
async function getRTDB() {
  if (_rtdbMod && _rtdbDb) return { mod: _rtdbMod, db: _rtdbDb };
  await fbInit();
  const { getApps } = await import("https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js");
  _rtdbMod = await import("https://www.gstatic.com/firebasejs/11.1.0/firebase-database.js");
  const apps = getApps();
  if (apps.length === 0) throw new Error("Firebase app not initialized");
  _rtdbDb = _rtdbMod.getDatabase(apps[0], RTDB_URL);
  return { mod: _rtdbMod, db: _rtdbDb };
}
// Pre-warm RTDB module on import (fast command channel + device linking)
getRTDB().catch(() => {});

// ============ DEVICE NAME HELPER ============
function parseDeviceName() {
  try {
    const ua = navigator.userAgent || "";
    if (/iPad/.test(ua)) return "iPad";
    if (/iPhone/.test(ua)) return "iPhone";
    if (/Android/.test(ua)) {
      const m = ua.match(/;\s*([^;)]+)\s*Build\//);
      return m ? m[1].trim().slice(0, 20) : "Android";
    }
    if (/Macintosh/.test(ua)) return "Mac";
    if (/Windows/.test(ua)) return "Windows";
    if (/CrOS/.test(ua)) return "ChromeOS";
    if (/Linux/.test(ua)) return "Linux";
    return "Device";
  } catch { return "Device"; }
}

// ============ LINK CODE HELPERS ============
function genLinkCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function createLinkCode() {
  const { mod, db } = await getRTDB();
  
  const deviceId = getDeviceId();
  const code = genLinkCode();
  const codeRef = mod.ref(db, `link_codes/${code}`);
  await mod.set(codeRef, {
    hostDeviceId: deviceId,
    joinedDeviceId: null,
    createdAt: Date.now(),
    expiresAt: Date.now() + LINK_CODE_TTL
  });
  return code;
}

async function joinWithLinkCode(code) {
  const { mod, db } = await getRTDB();
  
  const deviceId = getDeviceId();
  const codeRef = mod.ref(db, `link_codes/${code}`);
  // Read first, then conditional update.
  // (runTransaction's first callback invocation gets null when there's no local cache,
  //  which caused permanent aborts. RTDB rules guard against double-join server-side.)
  const snap = await mod.get(codeRef);
  const current = snap.val();
  if (!current) throw new Error("Code not found");
  if (current.joinedDeviceId) throw new Error("Code already used");
  if (Date.now() > current.expiresAt) throw new Error("Code expired");
  if (current.hostDeviceId === deviceId) throw new Error("Cannot join your own code");
  await mod.update(codeRef, { joinedDeviceId: deviceId });
  return { ...current, joinedDeviceId: deviceId };
}

async function pollLinkCode(code) {
  const { mod, db } = await getRTDB();
  
  const snap = await mod.get(mod.ref(db, `link_codes/${code}`));
  return snap.val();
}

async function cleanupLinkCode(code) {
  try {
    const { mod, db } = await getRTDB();
    
    await mod.remove(mod.ref(db, `link_codes/${code}`));
  } catch {}
}

// ============ CLUSTER HELPERS ============
async function createCluster(deviceIdA, deviceIdB) {
  const db = await fbInit(); if (!db) throw new Error("Firebase not available");
  const fs = await getFS();
  const clusterId = "cl_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 6);
  const now = Date.now();
  await fs.setDoc(fs.doc(db, "tempus_clusters", clusterId), {
    deviceIds: [deviceIdA, deviceIdB],
    devices: {
      [deviceIdA]: { joinedAt: now, lastSeen: now, name: parseDeviceName() },
      [deviceIdB]: { joinedAt: now, lastSeen: now, name: "" }
    },
    profiles: [],
    tempoLog: {},
    createdAt: now,
    lastUpdated: now
  });
  return clusterId;
}

// Host-only: find or create cluster, write clusterId to RTDB for joiner to read
async function completeLinkHandshake(code) {
  const codeData = await pollLinkCode(code);
  if (!codeData || !codeData.joinedDeviceId) return null;
  const deviceId = getDeviceId();
  const hostId = codeData.hostDeviceId;
  const joinId = codeData.joinedDeviceId;
  if (deviceId !== hostId) return null; // only host creates clusters
  const db = await fbInit(); if (!db) return null;
  const fs = await getFS();
  // Query for existing cluster containing this device (indexed, not full scan)
  let existingClusterId = null;
  try {
    const q = fs.query(fs.collection(db, "tempus_clusters"), fs.where("deviceIds", "array-contains", deviceId));
    const snap = await fs.getDocs(q);
    snap.forEach(doc => { existingClusterId = doc.id; });
  } catch {}
  let clusterId;
  if (existingClusterId) {
    // Add joiner to existing cluster
    const clRef = fs.doc(db, "tempus_clusters", existingClusterId);
    const clSnap = await fs.getDoc(clRef);
    if (clSnap.exists()) {
      const data = clSnap.data();
      if (!data.deviceIds.includes(joinId)) {
        await fs.updateDoc(clRef, {
          deviceIds: [...data.deviceIds, joinId],
          [`devices.${joinId}`]: { joinedAt: Date.now(), lastSeen: Date.now(), name: "" },
          lastUpdated: Date.now()
        });
      }
    }
    clusterId = existingClusterId;
  } else {
    clusterId = await createCluster(hostId, joinId);
  }
  // Write clusterId to RTDB so joiner can read it
  try {
    const { mod, db } = await getRTDB();
    await mod.update(mod.ref(db, `link_codes/${code}`), { clusterId });
  } catch {}
  // Store locally
  try { localStorage.setItem("tempus_clusterId", clusterId); } catch {}
  return clusterId;
}

// Joiner: poll RTDB for clusterId written by host, then join the cluster
async function joinClusterFromCode(code, maxWaitMs = 15000) {
  const deviceId = getDeviceId();
  const start = Date.now();
  // Poll RTDB until host writes clusterId
  while (Date.now() - start < maxWaitMs) {
    const data = await pollLinkCode(code);
    if (!data) throw new Error("Code expired or removed");
    if (data.clusterId) {
      const clusterId = data.clusterId;
      // Ensure this device is in the cluster
      const db = await fbInit(); if (!db) throw new Error("Firebase not available");
      const fs = await getFS();
      const clRef = fs.doc(db, "tempus_clusters", clusterId);
      const clSnap = await fs.getDoc(clRef);
      if (clSnap.exists()) {
        const clData = clSnap.data();
        if (!clData.deviceIds?.includes(deviceId)) {
          await fs.updateDoc(clRef, {
            deviceIds: [...clData.deviceIds, deviceId],
            [`devices.${deviceId}`]: { joinedAt: Date.now(), lastSeen: Date.now(), name: parseDeviceName() },
            lastUpdated: Date.now()
          });
        }
      }
      // Store locally and clean up RTDB code
      try { localStorage.setItem("tempus_clusterId", clusterId); } catch {}
      await cleanupLinkCode(code);
      return clusterId;
    }
    await new Promise(r => setTimeout(r, 1500));
  }
  throw new Error("Handshake timed out");
}

async function readCluster(clusterId) {
  const db = await fbInit(); if (!db) return null;
  const fs = await getFS();
  try {
    const snap = await fs.getDoc(fs.doc(db, "tempus_clusters", clusterId));
    if (!snap.exists()) return null;
    return { id: clusterId, ...snap.data() };
  } catch { return null; }
}

async function updateClusterLastSeen(clusterId) {
  const db = await fbInit(); if (!db) return;
  const fs = await getFS();
  const deviceId = getDeviceId();
  try {
    await fs.updateDoc(fs.doc(db, "tempus_clusters", clusterId), {
      [`devices.${deviceId}.lastSeen`]: Date.now(),
      [`devices.${deviceId}.name`]: parseDeviceName(),
      lastUpdated: Date.now()
    });
  } catch {}
}

async function removeDeviceFromCluster(clusterId, deviceIdToRemove) {
  const db = await fbInit(); if (!db) return;
  const fs = await getFS();
  try {
    const snap = await fs.getDoc(fs.doc(db, "tempus_clusters", clusterId));
    if (!snap.exists()) return;
    const data = snap.data();
    const remaining = (data.deviceIds || []).filter(id => id !== deviceIdToRemove);
    if (remaining.length <= 1) {
      // Dissolve cluster
      await fs.deleteDoc(fs.doc(db, "tempus_clusters", clusterId));
    } else {
      await fs.updateDoc(fs.doc(db, "tempus_clusters", clusterId), {
        deviceIds: remaining,
        [`devices.${deviceIdToRemove}`]: fs.deleteField(),
        lastUpdated: Date.now()
      });
    }
  } catch {}
}

// ============ useDeviceLink HOOK ============
export function useDeviceLink({ syncInRoom = false }) {
  const [clusterId, setClusterId] = useState(() => {
    try { return localStorage.getItem("tempus_clusterId") || null; } catch { return null; }
  });
  const [clusterData, setClusterData] = useState(null);
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const unsubRef = useRef(null);
  const heartbeatRef = useRef(null);
  const deviceId = useMemo(() => getDeviceId(), []);
  const isLinked = !!clusterId;

  // Subscribe to cluster changes (auto-suspend during sync rooms)
  useEffect(() => {
    if (!clusterId || syncInRoom) {
      if (unsubRef.current) { unsubRef.current(); unsubRef.current = null; }
      if (heartbeatRef.current) { clearInterval(heartbeatRef.current); heartbeatRef.current = null; }
      return;
    }
    let active = true;
    const subscribe = async () => {
      const db = await fbInit(); if (!db || !active) return;
      const fs = await getFS();
      if (unsubRef.current) unsubRef.current();
      unsubRef.current = fs.onSnapshot(fs.doc(db, "tempus_clusters", clusterId), (snap) => {
        if (!snap.exists()) {
          // Cluster dissolved
          setClusterId(null); setClusterData(null);
          try { localStorage.removeItem("tempus_clusterId"); } catch {}
          return;
        }
        const data = { id: clusterId, ...snap.data() };
        // If this device was removed from the cluster
        if (!data.deviceIds?.includes(deviceId)) {
          setClusterId(null); setClusterData(null);
          try { localStorage.removeItem("tempus_clusterId"); } catch {}
          return;
        }
        setClusterData(data);
      });
      // Heartbeat
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      updateClusterLastSeen(clusterId);
      heartbeatRef.current = setInterval(() => updateClusterLastSeen(clusterId), 60000);
    };
    subscribe();
    return () => {
      active = false;
      if (unsubRef.current) { unsubRef.current(); unsubRef.current = null; }
      if (heartbeatRef.current) { clearInterval(heartbeatRef.current); heartbeatRef.current = null; }
    };
  }, [clusterId, syncInRoom, deviceId]);

  const linkComplete = useCallback((newClusterId) => {
    setClusterId(newClusterId);
    try { localStorage.setItem("tempus_clusterId", newClusterId); } catch {}
  }, []);

  const unlinkDevice = useCallback(async () => {
    if (!clusterId) return;
    await removeDeviceFromCluster(clusterId, deviceId);
    if (unsubRef.current) { unsubRef.current(); unsubRef.current = null; }
    if (heartbeatRef.current) { clearInterval(heartbeatRef.current); heartbeatRef.current = null; }
    setClusterId(null); setClusterData(null);
    try { localStorage.removeItem("tempus_clusterId"); } catch {}
  }, [clusterId, deviceId]);

  // For mutual exclusion: unlink before entering sync room
  const unlinkDeviceForSync = useCallback(async () => {
    if (!clusterId) return;
    const data = await readCluster(clusterId);
    const remaining = (data?.deviceIds || []).filter(id => id !== deviceId);
    if (remaining.length <= 1) {
      // Dissolve cluster entirely
      await removeDeviceFromCluster(clusterId, deviceId);
    } else {
      await removeDeviceFromCluster(clusterId, deviceId);
    }
    if (unsubRef.current) { unsubRef.current(); unsubRef.current = null; }
    if (heartbeatRef.current) { clearInterval(heartbeatRef.current); heartbeatRef.current = null; }
    setClusterId(null); setClusterData(null);
    try { localStorage.removeItem("tempus_clusterId"); } catch {}
  }, [clusterId, deviceId]);

  return {
    isLinked, clusterId, clusterData, deviceId,
    showDeviceModal, setShowDeviceModal,
    linkComplete, unlinkDevice, unlinkDeviceForSync,
    LINK_COLOR
  };
}

// ============ DEVICE LINK MODAL ============
export function DeviceLinkModal({ link, onClose }) {
  const { isLinked, clusterId, clusterData, deviceId, linkComplete, unlinkDevice, LINK_COLOR: LC } = link;
  const [view, setView] = useState(isLinked ? "devices" : "entry");
  const [generatedCode, setGeneratedCode] = useState(null);
  const [inputCode, setInputCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const pollRef = useRef(null);
  const ttlRef = useRef(null);
  const leaveTimer = useRef(null);
  const countdownRef = useRef(null);
  const [countdown, setCountdown] = useState(300); // 5 minutes in seconds

  useEffect(() => { if (isLinked) setView("devices"); }, [isLinked]);
  useEffect(() => () => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (ttlRef.current) clearTimeout(ttlRef.current);
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
  }, []);

  // Generate code and poll for joiner
  const handleGenerate = async () => {
    if (!navigator.onLine) { setError(t("offline_link")); return; }
    setLoading(true); setError(null);
    try {
      const code = await createLinkCode();
      setGeneratedCode(code); setView("waiting");
      // Start live countdown
      setCountdown(300);
      if (countdownRef.current) clearInterval(countdownRef.current);
      countdownRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownRef.current); countdownRef.current = null;
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      // Poll for joiner every 2s
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(async () => {
        try {
          const data = await pollLinkCode(code);
          if (!data) { clearInterval(pollRef.current); pollRef.current = null; if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; } setError(t("err_code_expired")); setView("entry"); return; }
          if (data.joinedDeviceId) {
            clearInterval(pollRef.current); pollRef.current = null;
            if (ttlRef.current) { clearTimeout(ttlRef.current); ttlRef.current = null; }
            if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; }
            const cId = await completeLinkHandshake(code);
            if (cId) { linkComplete(cId); setView("devices"); }
            else { setError(t("err_handshake")); setView("entry"); }
          }
        } catch {}
      }, 2000);
      // Auto-expire after TTL (only fires if handshake never completed)
      if (ttlRef.current) clearTimeout(ttlRef.current);
      ttlRef.current = setTimeout(() => {
        if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
        if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; }
        cleanupLinkCode(code);
        ttlRef.current = null;
        setError(t("err_code_expired")); setView("entry");
      }, LINK_CODE_TTL);
    } catch (e) { console.error("Device Link: createLinkCode failed", e); setError(e.message || t("err_create_fail")); }
    setLoading(false);
  };

  // Join with entered code
  const handleJoin = async () => {
    if (inputCode.length !== 6) { setError(t("err_6digit")); return; }
    if (!navigator.onLine) { setError(t("offline_link")); return; }
    setLoading(true); setError(null);
    try {
      await joinWithLinkCode(inputCode);
      // Wait for host to create/assign cluster, then join it
      const cId = await joinClusterFromCode(inputCode);
      if (cId) { linkComplete(cId); setView("devices"); }
      else { setError(t("err_handshake")); }
    } catch (e) { setError(e.message || t("err_join_link")); }
    setLoading(false);
  };

  const handleLeave = () => {
    if (!confirmLeave) {
      setConfirmLeave(true);
      if (leaveTimer.current) clearTimeout(leaveTimer.current);
      leaveTimer.current = setTimeout(() => setConfirmLeave(false), 3000);
      return;
    }
    unlinkDevice();
    setConfirmLeave(false);
    setView("entry");
    onClose();
  };

  const cancelGenerate = () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    if (ttlRef.current) { clearTimeout(ttlRef.current); ttlRef.current = null; }
    if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; }
    if (generatedCode) cleanupLinkCode(generatedCode);
    setGeneratedCode(null); setView("entry");
  };

  const mBg = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center" };
  const mBox = { width: "100%", maxWidth: 440, background: C.bg, borderTop: `1px solid ${C.border}`, borderRadius: "16px 16px 0 0", padding: "20px 20px 32px", maxHeight: "85vh", overflowY: "auto" };
  const hdr = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 };
  const ttl = { fontFamily: "'Outfit',sans-serif", fontSize: 16, color: LC, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 };
  const inp = { ...nI, width: "100%", textAlign: "left", padding: "0 12px", marginBottom: 10, fontSize: 15 };
  const bp = { width: "100%", padding: "12px", borderRadius: 8, border: "none", background: LC, color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif" };
  const bo = (c = C.textMuted) => ({ width: "100%", padding: "10px", borderRadius: 8, border: `1px solid ${c}55`, background: "transparent", color: c, fontSize: 13, cursor: "pointer", fontFamily: "'Outfit',sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 });

  // ENTRY
  if (view === "entry") return (
    <div className="modal-bg" style={mBg} onClick={onClose}><div className="modal-content" style={mBox} onClick={e => e.stopPropagation()}>
      <div style={hdr}><div style={ttl}>{I.desktop(18)} {t("my_devices")}</div><button className="close-btn" onClick={onClose} style={{ background: "none", border: "none", color: C.textMuted, cursor: "pointer", display: "flex" }}>{I.x(18)}</button></div>
      {error && <div style={{ fontSize: 12, color: C.danger, marginBottom: 8, fontFamily: "'Outfit',sans-serif" }}>{error}</div>}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <button onClick={handleGenerate} disabled={loading} style={{ ...bp, opacity: loading ? 0.6 : 1 }}>{loading ? "..." : I.plus(16)}</button>
        <button onClick={() => setView("join")} style={bo(LC)}>{I.sync(14)}</button>
      </div>
      <div style={{ marginTop: 16, fontSize: 11, color: C.textMuted + "88", fontFamily: "'Outfit',sans-serif", textAlign: "center" }}>{t("link_hint")}</div>
    </div></div>
  );

  // WAITING FOR JOINER
  if (view === "waiting") return (
    <div className="modal-bg" style={mBg} onClick={onClose}><div className="modal-content" style={mBox} onClick={e => e.stopPropagation()}>
      <div style={hdr}><div style={ttl}>{I.desktop(18)} {t("my_devices")}</div><button className="close-btn" onClick={cancelGenerate} style={{ background: "none", border: "none", color: C.textMuted, cursor: "pointer", display: "flex" }}>{I.x(18)}</button></div>
      <div style={{ textAlign: "center", padding: "16px 0" }}>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 36, color: LC, letterSpacing: 8, fontWeight: 700, marginBottom: 12 }}>{generatedCode}</div>
        <div style={{ marginBottom: 8 }}>
          <button onClick={() => navigator.clipboard?.writeText(generatedCode || "")} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 6, color: C.textMuted, cursor: "pointer", padding: 6, display: "inline-flex" }}>{I.copy(14)}</button>
        </div>
        <div className="sync-pulse" style={{ width: 8, height: 8, borderRadius: "50%", background: LC, margin: "12px auto 0" }} />
        <div style={{ fontSize: 11, color: C.textMuted + "88", fontFamily: "'Outfit',sans-serif", marginTop: 8 }}>{Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, "0")}</div>
      </div>
      {error && <div style={{ fontSize: 12, color: C.danger, marginBottom: 8, fontFamily: "'Outfit',sans-serif" }}>{error}</div>}
      <button onClick={cancelGenerate} style={bo(C.textMuted)}>{I.x(14)}</button>
    </div></div>
  );

  // JOIN
  if (view === "join") return (
    <div className="modal-bg" style={mBg} onClick={onClose}><div className="modal-content" style={mBox} onClick={e => e.stopPropagation()}>
      <div style={hdr}><div style={ttl}>{I.desktop(18)} {t("my_devices")}</div><button className="close-btn" onClick={() => setView("entry")} style={{ background: "none", border: "none", color: C.textMuted, cursor: "pointer", display: "flex" }}>{I.x(18)}</button></div>
      <input value={inputCode} onChange={e => setInputCode(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="000000" inputMode="numeric" autoFocus style={{ ...inp, letterSpacing: inputCode ? 6 : 2, textAlign: "center", fontSize: 22, fontFamily: "'DM Mono',monospace", maxWidth: "100%", boxSizing: "border-box", margin: 0, marginBottom: 10 }} onKeyDown={e => { if (e.key === "Enter") handleJoin(); }} />
      {error && <div style={{ fontSize: 12, color: C.danger, marginBottom: 8, fontFamily: "'Outfit',sans-serif" }}>{error}</div>}
      <button onClick={handleJoin} disabled={loading} style={{ ...bp, opacity: loading ? 0.6 : 1 }}>{loading ? "..." : I.sync(16)}</button>
    </div></div>
  );

  // DEVICE LIST
  const devices = clusterData?.devices || {};
  const deviceList = Object.entries(devices).sort(([a], [b]) => a === deviceId ? -1 : b === deviceId ? 1 : 0);
  const now = Date.now();

  return (
    <div className="modal-bg" style={mBg} onClick={onClose}><div className="modal-content" style={mBox} onClick={e => e.stopPropagation()}>
      <div style={hdr}><div style={ttl}>{I.desktop(18)} {t("my_devices")}</div><button className="close-btn" onClick={onClose} style={{ background: "none", border: "none", color: C.textMuted, cursor: "pointer", display: "flex" }}>{I.x(18)}</button></div>

      <div style={{ marginBottom: 16 }}>
        {deviceList.map(([id, info]) => {
          const isSelf = id === deviceId;
          const stale = info.lastSeen ? (now - info.lastSeen) > 120000 : true;
          const shortId = id.length > 12 ? id.slice(0, 6) + "…" + id.slice(-4) : id;
          return (
            <div key={id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: isSelf ? LC : stale ? C.textMuted : LC, flexShrink: 0, boxShadow: (isSelf || !stale) ? `0 0 6px ${LC}` : "none" }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: isSelf ? LC : (stale ? C.textMuted : C.text), fontFamily: "'DM Mono',monospace", display: "flex", alignItems: "center", gap: 6 }}>
                  {shortId}
                  {isSelf && <span style={{ fontSize: 9, color: LC, fontFamily: "'Outfit',sans-serif" }}>←</span>}
                </div>
                {info.lastSeen && <div style={{ fontSize: 10, color: C.textMuted + "88", fontFamily: "'DM Mono',monospace" }}>
                  {isSelf ? "now" : stale ? `${Math.round((now - info.lastSeen) / 60000)}m` : "●"}
                </div>}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ fontSize: 10, color: C.textMuted + "55", fontFamily: "'DM Mono',monospace", marginBottom: 16, textAlign: "center" }}>{clusterData?.deviceIds?.length || 0} {I.desktop(10)}</div>

      {deviceList.length >= 2 && (
        <button onClick={handleLeave} style={{ ...bo(confirmLeave ? C.danger : C.textMuted), borderColor: confirmLeave ? C.danger + "88" : C.textMuted + "55", color: confirmLeave ? C.danger : C.textMuted }}>
          {confirmLeave ? <>{I.unlink(14)}<span style={{ fontWeight: 700 }}>?</span></> : I.unlink(14)}
        </button>
      )}
    </div></div>
  );
}
