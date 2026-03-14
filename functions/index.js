/**
 * Tempus — Scheduled Cleanup Cloud Functions
 *
 * Deploy:
 *   cd functions
 *   npm install
 *   npx firebase deploy --only functions
 *
 * Two scheduled jobs:
 *   1. cleanupStaleRooms  — every 30 min, deletes rooms with no recent heartbeat
 *   2. cleanupExpiredCodes — every 15 min, deletes expired RTDB link codes
 */

const { onSchedule } = require("firebase-functions/v2/scheduler");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getDatabase } = require("firebase-admin/database");

initializeApp();

const STALE_ROOM_MS = 30 * 60 * 1000;       // 30 minutes with no heartbeat
const STALE_ROOM_AGE_MS = 4 * 60 * 60 * 1000; // 4 hours absolute age fallback

// ── 1. Cleanup stale sync rooms ──────────────────────────────────────
exports.cleanupStaleRooms = onSchedule("every 30 minutes", async () => {
  const db = getFirestore();
  const now = Date.now();

  const roomsSnap = await db.collection("tempus_rooms").get();
  let deleted = 0;

  for (const roomDoc of roomsSnap.docs) {
    const data = roomDoc.data();
    const roomCode = roomDoc.id;

    // Check absolute age — if room is older than 4h, check heartbeats
    const roomAge = now - (data.createdAt || 0);
    if (roomAge < STALE_ROOM_MS) continue; // too young to reap

    // Read presence subcollection for latest heartbeat
    const presenceSnap = await db
      .collection("tempus_rooms")
      .doc(roomCode)
      .collection("presence")
      .get();

    let latestHeartbeat = 0;
    presenceSnap.forEach((doc) => {
      const ls = doc.data().lastSeen || 0;
      if (ls > latestHeartbeat) latestHeartbeat = ls;
    });

    // Also check member lastSeen in the room doc itself (fallback)
    const members = data.members || {};
    for (const m of Object.values(members)) {
      if ((m.lastSeen || 0) > latestHeartbeat) latestHeartbeat = m.lastSeen;
    }

    const timeSinceLastActivity = now - latestHeartbeat;

    // Delete if: no heartbeat ever and room is old, OR last heartbeat was > 30min ago
    const shouldDelete =
      (latestHeartbeat === 0 && roomAge > STALE_ROOM_AGE_MS) ||
      (latestHeartbeat > 0 && timeSinceLastActivity > STALE_ROOM_MS);

    if (shouldDelete) {
      // Delete presence subcollection first
      const batch = db.batch();
      presenceSnap.forEach((doc) => batch.delete(doc.ref));
      batch.delete(roomDoc.ref);
      await batch.commit();
      deleted++;
    }
  }

  console.log(`cleanupStaleRooms: deleted ${deleted} stale room(s)`);
});

// ── 2. Cleanup expired RTDB link codes ───────────────────────────────
exports.cleanupExpiredCodes = onSchedule("every 15 minutes", async () => {
  const rtdb = getDatabase();
  const now = Date.now();

  const codesSnap = await rtdb.ref("link_codes").once("value");
  if (!codesSnap.exists()) {
    console.log("cleanupExpiredCodes: no link codes found");
    return;
  }

  const updates = {};
  let count = 0;

  codesSnap.forEach((child) => {
    const data = child.val();
    // Delete if expired or if already joined (handshake complete)
    if (data.expiresAt < now || data.joinedDeviceId) {
      updates[child.key] = null; // null = delete in RTDB multi-path update
      count++;
    }
  });

  if (count > 0) {
    await rtdb.ref("link_codes").update(updates);
  }

  console.log(`cleanupExpiredCodes: deleted ${count} expired/used code(s)`);
});
