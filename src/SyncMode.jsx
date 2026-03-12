import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";

// These will be imported from App.jsx (exported there)
import { fbInit, getDeviceId, C, I, buildTL, nI } from "./App";

// ============ SYNC CONSTANTS ============
const SYNC_COLOR = "#06b6d4"; // cyan
const SYNC_GLOW = "rgba(6, 182, 212, 0.4)";
const MAX_MEMBERS = 20;
const HEARTBEAT_MS = 5000;
const STALE_MS = 15000;

// ============ SYNC ICON ============
export const SyncIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
  </svg>
);

// ============ FIRESTORE HELPERS ============
let _fsModule = null;
async function getFS() {
  if (!_fsModule) _fsModule = await import("https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js");
  return _fsModule;
}

function genRoomCode() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

async function createRoom(sections, settings) {
  const db = await fbInit();
  if (!db) throw new Error("Firebase not available");
  const fs = await getFS();
  const code = genRoomCode();
  const deviceId = getDeviceId();
  // Check code not taken
  const existing = await fs.getDoc(fs.doc(db, "tempus_rooms", code));
  if (existing.exists()) {
    const data = existing.data();
    // Allow reuse if room is older than 1 hour
    if (data.createdAt && (Date.now() - data.createdAt) < 3600000) {
      return createRoom(sections, settings); // retry with new code
    }
  }
  const roomData = {
    code,
    hostId: deviceId,
    hostName: "",
    status: "lobby",
    sections: JSON.parse(JSON.stringify(sections)),
    commandSeq: 0,
    command: null,
    startAtMs: null,
    resumeFromBar: 1,
    countInBars: settings.countIn || 1,
    members: {
      [deviceId]: { name: "", joinedAt: Date.now(), lastSeen: Date.now() }
    },
    pending: {},
    kicked: [],
    createdAt: Date.now()
  };
  await fs.setDoc(fs.doc(db, "tempus_rooms", code), roomData);
  return code;
}

async function joinRoomPending(code, displayName) {
  const db = await fbInit();
  if (!db) throw new Error("Firebase not available");
  const fs = await getFS();
  const ref = fs.doc(db, "tempus_rooms", code);
  const snap = await fs.getDoc(ref);
  if (!snap.exists()) throw new Error("Room not found");
  const data = snap.data();
  const deviceId = getDeviceId();
  if (data.kicked && data.kicked.includes(deviceId)) throw new Error("You were removed from this room");
  const memberCount = Object.keys(data.members || {}).length;
  const pendingCount = Object.keys(data.pending || {}).length;
  if (memberCount + pendingCount >= MAX_MEMBERS) throw new Error("Room is full");
  // If already a member, just rejoin
  if (data.members && data.members[deviceId]) {
    await fs.updateDoc(ref, {
      [`members.${deviceId}.name`]: displayName,
      [`members.${deviceId}.lastSeen`]: Date.now()
    });
    return { admitted: true, data };
  }
  // Add to pending
  await fs.updateDoc(ref, {
    [`pending.${deviceId}`]: { name: displayName, requestedAt: Date.now() }
  });
  return { admitted: false, data };
}

async function admitMember(code, memberId) {
  const db = await fbInit();
  if (!db) return;
  const fs = await getFS();
  const ref = fs.doc(db, "tempus_rooms", code);
  const snap = await fs.getDoc(ref);
  if (!snap.exists()) return;
  const data = snap.data();
  const pending = data.pending?.[memberId];
  if (!pending) return;
  await fs.updateDoc(ref, {
    [`members.${memberId}`]: { name: pending.name, joinedAt: Date.now(), lastSeen: Date.now() },
    [`pending.${memberId}`]: fs.deleteField()
  });
}

async function admitAll(code) {
  const db = await fbInit();
  if (!db) return;
  const fs = await getFS();
  const ref = fs.doc(db, "tempus_rooms", code);
  const snap = await fs.getDoc(ref);
  if (!snap.exists()) return;
  const data = snap.data();
  const updates = {};
  for (const [id, info] of Object.entries(data.pending || {})) {
    updates[`members.${id}`] = { name: info.name, joinedAt: Date.now(), lastSeen: Date.now() };
    updates[`pending.${id}`] = fs.deleteField();
  }
  if (Object.keys(updates).length > 0) await fs.updateDoc(ref, updates);
}

async function kickMember(code, memberId) {
  const db = await fbInit();
  if (!db) return;
  const fs = await getFS();
  const ref = fs.doc(db, "tempus_rooms", code);
  const snap = await fs.getDoc(ref);
  if (!snap.exists()) return;
  const data = snap.data();
  const kicked = data.kicked || [];
  await fs.updateDoc(ref, {
    [`members.${memberId}`]: fs.deleteField(),
    kicked: [...kicked, memberId]
  });
}

async function kickAll(code) {
  const db = await fbInit();
  if (!db) return;
  const fs = await getFS();
  const ref = fs.doc(db, "tempus_rooms", code);
  const snap = await fs.getDoc(ref);
  if (!snap.exists()) return;
  const data = snap.data();
  const hostId = data.hostId;
  const updates = {};
  const kicked = [...(data.kicked || [])];
  for (const id of Object.keys(data.members || {})) {
    if (id !== hostId) {
      updates[`members.${id}`] = fs.deleteField();
      kicked.push(id);
    }
  }
  // Also clear pending
  for (const id of Object.keys(data.pending || {})) {
    updates[`pending.${id}`] = fs.deleteField();
    kicked.push(id);
  }
  updates.kicked = kicked;
  if (Object.keys(updates).length > 0) await fs.updateDoc(ref, updates);
}

async function sendCommand(code, command, extra = {}) {
  const db = await fbInit();
  if (!db) return;
  const fs = await getFS();
  const ref = fs.doc(db, "tempus_rooms", code);
  const snap = await fs.getDoc(ref);
  if (!snap.exists()) return;
  const data = snap.data();
  await fs.updateDoc(ref, {
    command,
    commandSeq: (data.commandSeq || 0) + 1,
    status: command === "start" || command === "restart" ? "playing" : command === "pause" ? "paused" : command === "stop" ? "stopped" : data.status,
    ...extra
  });
}

async function updateRoomSections(code, sections) {
  const db = await fbInit();
  if (!db) return;
  const fs = await getFS();
  await fs.updateDoc(fs.doc(db, "tempus_rooms", code), {
    sections: JSON.parse(JSON.stringify(sections))
  });
}

async function heartbeat(code) {
  const db = await fbInit();
  if (!db) return;
  const fs = await getFS();
  const deviceId = getDeviceId();
  try {
    await fs.updateDoc(fs.doc(db, "tempus_rooms", code), {
      [`members.${deviceId}.lastSeen`]: Date.now()
    });
  } catch {}
}

async function leaveRoom(code) {
  const db = await fbInit();
  if (!db) return;
  const fs = await getFS();
  const deviceId = getDeviceId();
  const ref = fs.doc(db, "tempus_rooms", code);
  try {
    const snap = await fs.getDoc(ref);
    if (!snap.exists()) return;
    const data = snap.data();
    // If host is leaving, delete the room
    if (data.hostId === deviceId) {
      await fs.deleteDoc(ref);
    } else {
      await fs.updateDoc(ref, {
        [`members.${deviceId}`]: fs.deleteField(),
        [`pending.${deviceId}`]: fs.deleteField()
      });
    }
  } catch {}
}

async function destroyRoom(code) {
  const db = await fbInit();
  if (!db) return;
  const fs = await getFS();
  try { await fs.deleteDoc(fs.doc(db, "tempus_rooms", code)); } catch {}
}

// ============ useSync HOOK ============
export function useSync({ sections, settings, met, go, exitPlay }) {
  const [syncState, setSyncState] = useState(null);
  // syncState: null | { code, role: "host"|"member", status, members, pending, sections, commandSeq, ... }
  const [showLobby, setShowLobby] = useState(false);
  const [toast, setToast] = useState(null);
  const unsubRef = useRef(null);
  const heartbeatRef = useRef(null);
  const lastCmdSeq = useRef(0);
  const originalSections = useRef(null);
  const toastTimer = useRef(null);
  // Refs for latest values (avoids stale closures in Firestore listeners/timeouts)
  const goRef = useRef(go);
  const metRef = useRef(met);
  const exitPlayRef = useRef(exitPlay);
  const sectionsRef = useRef(sections);
  useEffect(() => { goRef.current = go; }, [go]);
  useEffect(() => { metRef.current = met; }, [met]);
  useEffect(() => { exitPlayRef.current = exitPlay; }, [exitPlay]);
  useEffect(() => { sectionsRef.current = sections; }, [sections]);

  const deviceId = useMemo(() => getDeviceId(), []);
  const isHost = syncState?.role === "host";
  const isInRoom = syncState !== null;
  const roomCode = syncState?.code || null;

  const showToast = useCallback((msg, duration = 3000) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), duration);
  }, []);

  // Subscribe to room updates
  const subscribeToRoom = useCallback(async (code, role) => {
    const db = await fbInit();
    if (!db) return;
    const fs = await getFS();
    const ref = fs.doc(db, "tempus_rooms", code);
    if (unsubRef.current) unsubRef.current();
    unsubRef.current = fs.onSnapshot(ref, (snap) => {
      if (!snap.exists()) {
        // Room deleted (host left or kicked)
        setSyncState(null);
        if (unsubRef.current) { unsubRef.current(); unsubRef.current = null; }
        if (originalSections.current) {
          showToast("Room closed by host");
        }
        return;
      }
      const data = snap.data();
      const myDeviceId = getDeviceId();

      // Check if kicked
      if (data.kicked && data.kicked.includes(myDeviceId)) {
        setSyncState(null);
        if (unsubRef.current) { unsubRef.current(); unsubRef.current = null; }
        showToast("You were removed by the host");
        return;
      }

      // Check if still pending (not yet admitted)
      const isPending = data.pending && data.pending[myDeviceId];
      const isMember = data.members && data.members[myDeviceId];

      setSyncState(prev => ({
        ...prev,
        code,
        role,
        hostId: data.hostId,
        hostName: data.hostName || "Host",
        status: data.status,
        members: data.members || {},
        pending: data.pending || {},
        sections: data.sections,
        commandSeq: data.commandSeq || 0,
        command: data.command,
        startAtMs: data.startAtMs,
        resumeFromBar: data.resumeFromBar,
        countInBars: data.countInBars,
        isPending: !!isPending && !isMember,
        isAdmitted: !!isMember
      }));
    });
  }, [showToast]);

  // Handle incoming commands (member side)
  useEffect(() => {
    if (!syncState || isHost) return;
    if (!syncState.isAdmitted) return;
    const { commandSeq, command, startAtMs } = syncState;
    if (commandSeq <= lastCmdSeq.current) return;
    lastCmdSeq.current = commandSeq;

    if (command === "start" || command === "restart") {
      if (!startAtMs) return;
      const delay = startAtMs - Date.now();
      if (delay > 0 && delay < 10000) {
        setTimeout(() => { goRef.current(0); }, delay);
      } else if (delay <= 0) {
        goRef.current(0);
      }
    } else if (command === "pause") {
      metRef.current.stop();
    } else if (command === "resume") {
      const fromBar = syncState.resumeFromBar || 1;
      const tl = buildTL(syncState.sections || sectionsRef.current);
      const idx = tl.findIndex(b => b.ab === fromBar);
      if (idx >= 0) goRef.current(idx);
    } else if (command === "stop") {
      exitPlayRef.current();
    }
  }, [syncState?.commandSeq, syncState?.command, syncState?.isAdmitted]);

  // Handle section updates from host (member side)
  const lastSectionsJson = useRef(null);
  useEffect(() => {
    if (!syncState || isHost || !syncState.isAdmitted) return;
    const newJson = JSON.stringify(syncState.sections);
    if (lastSectionsJson.current && lastSectionsJson.current !== newJson) {
      showToast("Host updated sections");
    }
    lastSectionsJson.current = newJson;
  }, [syncState?.sections, isHost, syncState?.isAdmitted, showToast]);

  // Heartbeat
  useEffect(() => {
    if (!roomCode) return;
    heartbeatRef.current = setInterval(() => heartbeat(roomCode), HEARTBEAT_MS);
    return () => { if (heartbeatRef.current) clearInterval(heartbeatRef.current); };
  }, [roomCode]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (unsubRef.current) unsubRef.current();
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  // Host: create room
  const doCreateRoom = useCallback(async (displayName) => {
    try {
      const code = await createRoom(sectionsRef.current, settings);
      // Update host name
      const db = await fbInit();
      const fs = await getFS();
      await fs.updateDoc(fs.doc(db, "tempus_rooms", code), {
        hostName: displayName,
        [`members.${deviceId}.name`]: displayName
      });
      lastCmdSeq.current = 0;
      originalSections.current = null; // host doesn't need to restore
      setSyncState({
        code,
        role: "host",
        hostId: deviceId,
        hostName: displayName,
        status: "lobby",
        members: { [deviceId]: { name: displayName, joinedAt: Date.now(), lastSeen: Date.now() } },
        pending: {},
        sections: sectionsRef.current,
        commandSeq: 0,
        command: null,
        startAtMs: null,
        resumeFromBar: 1,
        countInBars: settings.countIn || 1,
        isPending: false,
        isAdmitted: true
      });
      await subscribeToRoom(code, "host");
      return code;
    } catch (err) {
      showToast(err.message || "Failed to create room");
      return null;
    }
  }, [settings, deviceId, subscribeToRoom, showToast]);

  // Member: join room
  const doJoinRoom = useCallback(async (code, displayName) => {
    try {
      const { admitted } = await joinRoomPending(code, displayName);
      lastCmdSeq.current = 0;
      originalSections.current = [...sectionsRef.current]; // save for restore on leave
      setSyncState({
        code,
        role: "member",
        status: "lobby",
        members: {},
        pending: {},
        sections: [],
        commandSeq: 0,
        command: null,
        isPending: !admitted,
        isAdmitted: admitted
      });
      await subscribeToRoom(code, "member");
      return true;
    } catch (err) {
      showToast(err.message || "Failed to join room");
      return false;
    }
  }, [subscribeToRoom, showToast]);

  // Leave room
  const doLeaveRoom = useCallback(async () => {
    if (roomCode) await leaveRoom(roomCode);
    if (unsubRef.current) { unsubRef.current(); unsubRef.current = null; }
    if (heartbeatRef.current) { clearInterval(heartbeatRef.current); heartbeatRef.current = null; }
    const restore = originalSections.current;
    setSyncState(null);
    lastCmdSeq.current = 0;
    originalSections.current = null;
    lastSectionsJson.current = null;
    return restore; // caller restores sections
  }, [roomCode]);

  // Host: admit / kick
  const doAdmit = useCallback((memberId) => roomCode && admitMember(roomCode, memberId), [roomCode]);
  const doAdmitAll = useCallback(() => roomCode && admitAll(roomCode), [roomCode]);
  const doKick = useCallback((memberId) => roomCode && kickMember(roomCode, memberId), [roomCode]);
  const doKickAll = useCallback(() => roomCode && kickAll(roomCode), [roomCode]);

  // Host: send commands
  const doStart = useCallback(async () => {
    if (!roomCode) return;
    const startAtMs = Date.now() + 1500;
    await sendCommand(roomCode, "start", { startAtMs });
    // Host also schedules its own start
    const delay = startAtMs - Date.now();
    setTimeout(() => { goRef.current(0); }, Math.max(0, delay));
  }, [roomCode]);

  const doPause = useCallback(async () => {
    if (!roomCode) return;
    await sendCommand(roomCode, "pause");
    metRef.current.stop();
  }, [roomCode]);

  const doResume = useCallback(async (barNum = 1) => {
    if (!roomCode) return;
    const startAtMs = Date.now() + 1500;
    await sendCommand(roomCode, "resume", { startAtMs, resumeFromBar: barNum });
    const tl = buildTL(sectionsRef.current);
    const idx = tl.findIndex(b => b.ab === barNum);
    const delay = startAtMs - Date.now();
    setTimeout(() => { if (idx >= 0) goRef.current(idx); else goRef.current(0); }, Math.max(0, delay));
  }, [roomCode]);

  const doStop = useCallback(async () => {
    if (!roomCode) return;
    await sendCommand(roomCode, "stop");
    exitPlayRef.current();
  }, [roomCode]);

  const doRestart = useCallback(async () => {
    if (!roomCode) return;
    const startAtMs = Date.now() + 1500;
    await sendCommand(roomCode, "restart", { startAtMs });
    const delay = startAtMs - Date.now();
    setTimeout(() => { goRef.current(0); }, Math.max(0, delay));
  }, [roomCode]);

  // Host: update sections in room
  const doUpdateSections = useCallback(async () => {
    if (!roomCode || !isHost) return;
    await updateRoomSections(roomCode, sectionsRef.current);
  }, [roomCode, isHost]);

  // Auto-push section changes when host edits (debounced)
  const sectionPushTimer = useRef(null);
  useEffect(() => {
    if (!isHost || !roomCode) return;
    if (sectionPushTimer.current) clearTimeout(sectionPushTimer.current);
    sectionPushTimer.current = setTimeout(() => {
      updateRoomSections(roomCode, sections);
    }, 1500);
    return () => { if (sectionPushTimer.current) clearTimeout(sectionPushTimer.current); };
  }, [sections, isHost, roomCode]);

  return {
    syncState,
    showLobby, setShowLobby,
    toast,
    isHost, isInRoom, roomCode, deviceId,
    doCreateRoom, doJoinRoom, doLeaveRoom,
    doAdmit, doAdmitAll, doKick, doKickAll,
    doStart, doPause, doResume, doStop, doRestart,
    doUpdateSections,
    SYNC_COLOR, SYNC_GLOW
  };
}

// ============ SYNC LOBBY MODAL ============
export function SyncLobby({ sync, onLoadSections }) {
  const { syncState, isHost, isInRoom, deviceId,
    doCreateRoom, doJoinRoom, doLeaveRoom,
    doAdmit, doAdmitAll, doKick, doKickAll,
    doStart, doPause, doStop, doRestart,
    setShowLobby, SYNC_COLOR } = sync;

  const [view, setView] = useState(isInRoom ? "room" : "entry"); // "entry" | "create" | "join" | "room"
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [confirmKickId, setConfirmKickId] = useState(null);
  const [confirmKickAll, setConfirmKickAll] = useState(false);
  const confirmTimer = useRef(null);
  const confirmKickAllTimer = useRef(null);
  const [resumeBar, setResumeBar] = useState("");

  useEffect(() => {
    if (isInRoom) setView("room");
  }, [isInRoom]);

  // Clear kick confirmations on timer
  useEffect(() => {
    return () => {
      if (confirmTimer.current) clearTimeout(confirmTimer.current);
      if (confirmKickAllTimer.current) clearTimeout(confirmKickAllTimer.current);
    };
  }, []);

  const handleCreate = async () => {
    if (!name.trim()) { setError("Enter your display name"); return; }
    setLoading(true); setError(null);
    const c = await doCreateRoom(name.trim());
    setLoading(false);
    if (c) setView("room");
  };

  const handleJoin = async () => {
    if (!name.trim()) { setError("Enter your display name"); return; }
    if (code.length !== 4) { setError("Enter a 4-digit room code"); return; }
    setLoading(true); setError(null);
    const ok = await doJoinRoom(code, name.trim());
    setLoading(false);
    if (ok) setView("room");
    else setError("Could not join room");
  };

  const handleLeave = async () => {
    const restore = await doLeaveRoom();
    if (restore) onLoadSections(restore);
    setView("entry");
    setCode("");
  };

  const handleKick = (id) => {
    if (confirmKickId === id) {
      doKick(id);
      setConfirmKickId(null);
      if (confirmTimer.current) clearTimeout(confirmTimer.current);
    } else {
      setConfirmKickId(id);
      if (confirmTimer.current) clearTimeout(confirmTimer.current);
      confirmTimer.current = setTimeout(() => setConfirmKickId(null), 3000);
    }
  };

  const handleKickAll = () => {
    if (confirmKickAll) {
      doKickAll();
      setConfirmKickAll(false);
      if (confirmKickAllTimer.current) clearTimeout(confirmKickAllTimer.current);
    } else {
      setConfirmKickAll(true);
      if (confirmKickAllTimer.current) clearTimeout(confirmKickAllTimer.current);
      confirmKickAllTimer.current = setTimeout(() => setConfirmKickAll(false), 3000);
    }
  };

  const close = () => sync.setShowLobby(false);

  // Derive member/pending lists
  const members = syncState?.members || {};
  const pending = syncState?.pending || {};
  const memberList = Object.entries(members).filter(([id]) => id !== syncState?.hostId);
  const pendingList = Object.entries(pending);
  const memberCount = Object.keys(members).length;
  const status = syncState?.status || "lobby";
  const isPlaying = status === "playing";
  const isPaused = status === "paused";

  // Member: get sections from room
  useEffect(() => {
    if (!isInRoom || isHost) return;
    if (syncState?.isAdmitted && syncState?.sections?.length > 0) {
      onLoadSections(syncState.sections);
    }
  }, [syncState?.isAdmitted, syncState?.sections, isHost, isInRoom]);

  // Styles matching existing modal pattern
  const modalBg = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center" };
  const modalBox = { width: "100%", maxWidth: 440, background: C.bg, borderTop: `1px solid ${C.border}`, borderRadius: "16px 16px 0 0", padding: "20px 20px 32px", maxHeight: "85vh", overflowY: "auto" };
  const hdr = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 };
  const title = { fontFamily: "'Outfit',sans-serif", fontSize: 16, color: SYNC_COLOR, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 };
  const inputStyle = { ...nI, width: "100%", textAlign: "left", padding: "0 12px", marginBottom: 10, fontSize: 15 };
  const btnPrimary = { width: "100%", padding: "12px", borderRadius: 8, border: "none", background: SYNC_COLOR, color: "#000", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif" };
  const btnOutline = (clr = C.textMuted) => ({ width: "100%", padding: "10px", borderRadius: 8, border: `1px solid ${clr}55`, background: "transparent", color: clr, fontSize: 13, cursor: "pointer", fontFamily: "'Outfit',sans-serif" });

  // ---- ENTRY VIEW ----
  if (view === "entry") {
    return (<div className="modal-bg" style={modalBg} onClick={close}>
      <div className="modal-content" style={modalBox} onClick={e => e.stopPropagation()}>
        <div style={hdr}>
          <div style={title}><SyncIcon size={18} /> Sync Mode</div>
          <button className="close-btn" onClick={close} style={{ background: "none", border: "none", color: C.textMuted, cursor: "pointer", display: "flex" }}>{I.x(18)}</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button onClick={() => setView("create")} style={btnPrimary}>Create Room</button>
          <button onClick={() => setView("join")} style={btnOutline(SYNC_COLOR)}>Join Room</button>
        </div>
        <div style={{ marginTop: 16, fontSize: 11, color: C.textMuted + "88", fontFamily: "'Outfit',sans-serif", textAlign: "center" }}>
          Everyone must be on the same profile before syncing.
        </div>
      </div>
    </div>);
  }

  // ---- CREATE VIEW ----
  if (view === "create") {
    return (<div className="modal-bg" style={modalBg} onClick={close}>
      <div className="modal-content" style={modalBox} onClick={e => e.stopPropagation()}>
        <div style={hdr}>
          <div style={title}><SyncIcon size={18} /> Create Room</div>
          <button className="close-btn" onClick={() => setView("entry")} style={{ background: "none", border: "none", color: C.textMuted, cursor: "pointer", display: "flex" }}>{I.x(18)}</button>
        </div>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Your display name" autoFocus style={inputStyle} onKeyDown={e => { if (e.key === "Enter") handleCreate(); }} />
        {error && <div style={{ fontSize: 12, color: C.danger, marginBottom: 8, fontFamily: "'Outfit',sans-serif" }}>{error}</div>}
        <button onClick={handleCreate} disabled={loading} style={{ ...btnPrimary, opacity: loading ? 0.6 : 1 }}>
          {loading ? "Creating..." : "Create Room"}
        </button>
      </div>
    </div>);
  }

  // ---- JOIN VIEW ----
  if (view === "join") {
    return (<div className="modal-bg" style={modalBg} onClick={close}>
      <div className="modal-content" style={modalBox} onClick={e => e.stopPropagation()}>
        <div style={hdr}>
          <div style={title}><SyncIcon size={18} /> Join Room</div>
          <button className="close-btn" onClick={() => setView("entry")} style={{ background: "none", border: "none", color: C.textMuted, cursor: "pointer", display: "flex" }}>{I.x(18)}</button>
        </div>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Your display name" autoFocus style={inputStyle} />
        <input value={code} onChange={e => { const v = e.target.value.replace(/\D/g, "").slice(0, 4); setCode(v); }} placeholder="4-digit room code" inputMode="numeric" style={{ ...inputStyle, letterSpacing: 8, textAlign: "center", fontSize: 24, fontFamily: "'DM Mono',monospace" }} onKeyDown={e => { if (e.key === "Enter") handleJoin(); }} />
        {error && <div style={{ fontSize: 12, color: C.danger, marginBottom: 8, fontFamily: "'Outfit',sans-serif" }}>{error}</div>}
        <button onClick={handleJoin} disabled={loading} style={{ ...btnPrimary, opacity: loading ? 0.6 : 1 }}>
          {loading ? "Joining..." : "Join Room"}
        </button>
      </div>
    </div>);
  }

  // ---- ROOM VIEW (host + member) ----
  // Member waiting room
  if (!isHost && syncState?.isPending) {
    return (<div className="modal-bg" style={modalBg} onClick={close}>
      <div className="modal-content" style={modalBox} onClick={e => e.stopPropagation()}>
        <div style={hdr}>
          <div style={title}><SyncIcon size={18} /> Waiting Room</div>
          <button className="close-btn" onClick={close} style={{ background: "none", border: "none", color: C.textMuted, cursor: "pointer", display: "flex" }}>{I.x(18)}</button>
        </div>
        <div style={{ textAlign: "center", padding: "32px 0" }}>
          <div style={{ fontSize: 14, color: C.text, fontFamily: "'Outfit',sans-serif", marginBottom: 8 }}>Waiting for the host to let you in...</div>
          <div style={{ fontSize: 12, color: C.textMuted, fontFamily: "'DM Mono',monospace" }}>Room {syncState.code}</div>
          <div style={{ marginTop: 8 }}>
            <div className="sync-pulse" style={{ width: 8, height: 8, borderRadius: "50%", background: SYNC_COLOR, margin: "0 auto" }} />
          </div>
        </div>
        <button onClick={handleLeave} style={btnOutline(C.textMuted)}>Leave</button>
      </div>
    </div>);
  }

  // Member: performance in progress, joined late
  if (!isHost && syncState?.isAdmitted && (isPlaying || isPaused)) {
    // If performance is playing and they just joined, show waiting state
    if (isPlaying) {
      return (<div className="modal-bg" style={modalBg} onClick={close}>
        <div className="modal-content" style={modalBox} onClick={e => e.stopPropagation()}>
          <div style={hdr}>
            <div style={title}><SyncIcon size={18} /> Sync Mode</div>
            <button className="close-btn" onClick={close} style={{ background: "none", border: "none", color: C.textMuted, cursor: "pointer", display: "flex" }}>{I.x(18)}</button>
          </div>
          <div style={{ textAlign: "center", padding: "32px 0" }}>
            <div style={{ fontSize: 14, color: C.text, fontFamily: "'Outfit',sans-serif", marginBottom: 8 }}>Performance in progress</div>
            <div style={{ fontSize: 12, color: C.textMuted, fontFamily: "'Outfit',sans-serif" }}>Waiting for next start...</div>
            <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 16 }}>
              {Object.entries(members).map(([id]) => (
                <div key={id} style={{ width: 8, height: 8, borderRadius: "50%", background: SYNC_COLOR }} />
              ))}
            </div>
          </div>
          <button onClick={handleLeave} style={btnOutline(C.textMuted)}>Leave Room</button>
        </div>
      </div>);
    }
  }

  // Main room view
  return (<div className="modal-bg" style={modalBg} onClick={close}>
    <div className="modal-content" style={modalBox} onClick={e => e.stopPropagation()}>
      <div style={hdr}>
        <div style={title}><SyncIcon size={18} /> {isHost ? "Host" : "Sync"} Room</div>
        <button className="close-btn" onClick={close} style={{ background: "none", border: "none", color: C.textMuted, cursor: "pointer", display: "flex" }}>{I.x(18)}</button>
      </div>

      {/* Room code display */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 16 }}>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 32, color: SYNC_COLOR, letterSpacing: 8, fontWeight: 700 }}>{syncState?.code}</div>
        <button onClick={() => { navigator.clipboard?.writeText(syncState?.code || ""); sync.toast || sync.setShowLobby(true); }} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 6, color: C.textMuted, cursor: "pointer", padding: 6, display: "flex" }}>{I.copy(14)}</button>
      </div>

      {/* Member count */}
      <div style={{ textAlign: "center", fontSize: 12, color: C.textMuted, fontFamily: "'DM Mono',monospace", marginBottom: 16 }}>
        {memberCount}/{MAX_MEMBERS} members connected
      </div>

      {/* Pending requests (host only) */}
      {isHost && pendingList.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: C.textMuted, fontFamily: "'Outfit',sans-serif", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>Pending ({pendingList.length})</span>
            {pendingList.length > 1 && <button onClick={() => doAdmitAll()} style={{ background: "none", border: `1px solid ${SYNC_COLOR}55`, borderRadius: 6, color: SYNC_COLOR, fontSize: 11, cursor: "pointer", padding: "3px 8px", fontFamily: "'Outfit',sans-serif" }}>Admit All</button>}
          </div>
          {pendingList.map(([id, info]) => (
            <div key={id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#f59e0b", flexShrink: 0 }} />
              <div style={{ flex: 1, fontSize: 13, color: C.text, fontFamily: "'DM Mono',monospace" }}>{info.name || "Unknown"}</div>
              <button onClick={() => doAdmit(id)} style={{ background: SYNC_COLOR + "22", border: `1px solid ${SYNC_COLOR}55`, borderRadius: 6, color: SYNC_COLOR, fontSize: 11, cursor: "pointer", padding: "4px 10px", fontFamily: "'Outfit',sans-serif" }}>Admit</button>
              <button onClick={() => handleKick(id)} style={{ background: "none", border: `1px solid ${C.danger}44`, borderRadius: 6, color: C.danger, fontSize: 11, cursor: "pointer", padding: "4px 8px", fontFamily: "'Outfit',sans-serif", opacity: 0.7 }}>Decline</button>
            </div>
          ))}
        </div>
      )}

      {/* Members list */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: C.textMuted, fontFamily: "'Outfit',sans-serif", marginBottom: 8 }}>Members</div>
        {/* Host first */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: SYNC_COLOR, flexShrink: 0, boxShadow: `0 0 6px ${SYNC_COLOR}` }} />
          <div style={{ flex: 1, fontSize: 13, color: C.text, fontFamily: "'DM Mono',monospace" }}>
            {members[syncState?.hostId]?.name || "Host"}
            <span style={{ fontSize: 10, color: SYNC_COLOR, marginLeft: 6 }}>HOST</span>
          </div>
        </div>
        {/* Other members */}
        {memberList.map(([id, info]) => {
          const stale = info.lastSeen && (Date.now() - info.lastSeen) > STALE_MS;
          return (
            <div key={id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: stale ? C.textMuted : SYNC_COLOR, flexShrink: 0, boxShadow: stale ? "none" : `0 0 6px ${SYNC_COLOR}` }} />
              <div style={{ flex: 1, fontSize: 13, color: stale ? C.textMuted : C.text, fontFamily: "'DM Mono',monospace" }}>{info.name || "Unknown"}</div>
              {isHost && (
                <button onClick={() => handleKick(id)} style={{ background: confirmKickId === id ? C.danger + "22" : "none", border: `1px solid ${confirmKickId === id ? C.danger : C.border}`, borderRadius: 6, color: confirmKickId === id ? C.danger : C.textMuted, fontSize: 11, cursor: "pointer", padding: "4px 8px", fontFamily: "'DM Mono',monospace", transition: "all 0.15s" }}>
                  {confirmKickId === id ? "Kick?" : I.x(12)}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Host controls */}
      {isHost && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
          {status === "lobby" || status === "stopped" ? (
            <button onClick={doStart} disabled={memberCount < 1} style={{ ...btnPrimary, opacity: memberCount < 1 ? 0.5 : 1 }}>
              Start (synced count-in)
            </button>
          ) : status === "playing" ? (
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={doPause} style={{ ...btnOutline(SYNC_COLOR), flex: 1 }}>Pause</button>
              <button onClick={doStop} style={{ ...btnOutline(C.danger), flex: 1 }}>Stop</button>
            </div>
          ) : status === "paused" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={doRestart} style={{ ...btnPrimary, flex: 1 }}>Restart</button>
                <button onClick={doStop} style={{ ...btnOutline(C.danger), flex: 1 }}>Stop</button>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input value={resumeBar} onChange={e => setResumeBar(e.target.value.replace(/\D/g, ""))} placeholder="Bar #" inputMode="numeric" style={{ ...nI, width: 72, fontSize: 14, margin: 0 }} />
                <button onClick={() => { const b = parseInt(resumeBar); sync.doResume(b > 0 ? b : 1); }} style={{ ...btnOutline(SYNC_COLOR), flex: 1 }}>Resume from bar</button>
              </div>
            </div>
          ) : null}

          {memberList.length > 0 && (
            <button onClick={handleKickAll} style={{ ...btnOutline(confirmKickAll ? C.danger : C.textMuted), borderColor: confirmKickAll ? C.danger + "88" : C.border, color: confirmKickAll ? C.danger : C.textMuted, fontSize: 12 }}>
              {confirmKickAll ? "Tap again to remove everyone" : "Remove all members"}
            </button>
          )}
        </div>
      )}

      {/* Member controls */}
      {!isHost && syncState?.isAdmitted && (
        <button onClick={handleLeave} style={btnOutline(C.textMuted)}>Leave Room</button>
      )}
    </div>
  </div>);
}

// ============ SYNC TOAST ============
export function SyncToast({ message }) {
  if (!message) return null;
  return (
    <div className="toast" style={{
      position: "fixed", bottom: 90, left: "50%", zIndex: 60,
      background: C.surface, border: `1px solid ${SYNC_COLOR}44`,
      display: "flex", alignItems: "center", gap: 10,
      padding: "10px 18px", borderRadius: 12,
      boxShadow: `0 10px 40px rgba(0,0,0,0.5), 0 0 20px ${SYNC_COLOR}15`,
      transform: "translateX(-50%)"
    }}>
      <div style={{ width: 6, height: 6, borderRadius: "50%", background: SYNC_COLOR, flexShrink: 0 }} />
      <span style={{ fontSize: 13, color: C.text, fontFamily: "'Outfit',sans-serif" }}>{message}</span>
    </div>
  );
}
