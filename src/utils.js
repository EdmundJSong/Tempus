// ============ CONSTANTS ============
export const BU = [{ id: "w", q: 4 }, { id: "h", q: 2 }, { id: "q", q: 1 }, { id: "e", q: 0.5 }, { id: "16", q: 0.25 }, { id: "32", q: 0.125 }];
export const D2Q = { 1: 4, 2: 2, 4: 1, 8: 0.5, 16: 0.25, 32: 0.125 };
export const C = { bg: "#050508", surface: "#111116", surfaceHover: "#1A1A24", border: "#282833", text: "#f8f8f8", textMuted: "#a1a1b5", downbeat: "#FFB300", accent: "#8B6CEF", sub: "#2d2d38", danger: "#ff453a", record: "#ff453a", practice: "#32d74b", glowDownbeat: "rgba(255, 179, 0, 0.4)", glowPractice: "rgba(50, 215, 75, 0.4)", glowRecord: "rgba(255, 69, 58, 0.4)" };
export const SK = "tempus_profiles";

// ============ LOCAL STORAGE ============
const _memStore = {};
export function _getLS(k) { try { return localStorage.getItem(k); } catch { return _memStore[k] || null; } }
export function _setLS(k, v) { try { localStorage.setItem(k, v); } catch { _memStore[k] = v; } }
export function ldP() { try { return JSON.parse(_getLS(SK)) || []; } catch { return []; } }
export function svP(p) { _setLS(SK, JSON.stringify(p)); try { const sec = JSON.parse(_getLS("tempus_sections")) || []; fbSyncDebounced(sec, p); } catch {} }

// ============ TEMPO HISTORY ============
export function getTempoHistory(profileId) {
  if (!profileId) return [];
  const profiles = ldP();
  const p = profiles.find(x => x.id === profileId);
  return p?.tempoHistory || [];
}
export function saveTempoHistory(profileId, history) {
  if (!profileId) return;
  const profiles = ldP();
  const idx = profiles.findIndex(x => x.id === profileId);
  if (idx < 0) return;
  profiles[idx] = { ...profiles[idx], tempoHistory: history, tempoHistoryUpdated: new Date().toISOString() };
  svP(profiles);
}

// ============ COOKIES ============
function _getCookie(k) { const m = document.cookie.match(new RegExp("(?:^|; )" + k + "=([^;]*)")); return m ? decodeURIComponent(m[1]) : null; }
function _setCookie(k, v) { const d = new Date(); d.setFullYear(d.getFullYear() + 2); document.cookie = k + "=" + encodeURIComponent(v) + ";expires=" + d.toUTCString() + ";path=/;SameSite=Lax"; }
export function getDeviceId() {
  let id = _getLS("tempus_device_id") || _getCookie("tempus_device_id");
  if (!id) { id = "t_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8); }
  _setLS("tempus_device_id", id); _setCookie("tempus_device_id", id);
  return id;
}

// ============ FIREBASE SILENT BACKUP ============
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyA9LAg1iywIxG1KEbrwNQhrpfqELK3SOeY",
  authDomain: "tempus-acc0e.firebaseapp.com",
  projectId: "tempus-acc0e",
  storageBucket: "tempus-acc0e.firebasestorage.app",
  messagingSenderId: "290765368525",
  appId: "1:290765368525:web:cc481f657d9e7ae7e18d84"
};
const FB_ENABLED = FIREBASE_CONFIG.apiKey !== "YOUR_API_KEY" && FIREBASE_CONFIG.apiKey !== "disabled";

let _fb = null, _fbDb = null;
export function fbApp() { return _fb; }
export async function fbInit() {
  if (_fb) return _fbDb;
  if (!FB_ENABLED) return null;
  try {
    const { initializeApp } = await import("https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js");
    const { getFirestore } = await import("https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js");
    _fb = initializeApp(FIREBASE_CONFIG);
    _fbDb = getFirestore(_fb);
    return _fbDb;
  } catch { return null; }
}

let _fbSyncTimer = null;
function _buildBackupPayload(sections, profiles) {
  const deviceId = getDeviceId();
  return {
    deviceId,
    sections,
    profiles: profiles || ldP(),
    settings: (() => { try { return JSON.parse(_getLS("tempus_settings")) || {}; } catch { return {}; } })(),
    videoUrl: (() => { try { return _getLS("tempus_videoUrl") || null; } catch { return null; } })(),
    videoSync: (() => { try { return JSON.parse(_getLS("tempus_videoSync")) || null; } catch { return null; } })(),
    lastUpdated: new Date().toISOString(),
    userAgent: navigator.userAgent || ""
  };
}
async function _flushBackup(payload) {
  try {
    const db = await fbInit();
    if (!db) return false;
    const { doc, setDoc } = await import("https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js");
    await setDoc(doc(db, "tempus_backups", payload.deviceId), payload, { merge: true });
    return true;
  } catch { return false; }
}
export function fbSyncDebounced(sections, profiles) {
  if (!FB_ENABLED) return;
  if (_fbSyncTimer) clearTimeout(_fbSyncTimer);
  _fbSyncTimer = setTimeout(async () => {
    const payload = _buildBackupPayload(sections, profiles);
    if (!navigator.onLine) {
      try { _setLS("tempus_backup_queue", JSON.stringify(payload)); } catch {}
      return;
    }
    const ok = await _flushBackup(payload);
    if (!ok) { try { _setLS("tempus_backup_queue", JSON.stringify(payload)); } catch {} }
  }, 5000);
}
// Flush queued backup on reconnect
if (typeof window !== "undefined") {
  window.addEventListener("online", async () => {
    try {
      const queued = _getLS("tempus_backup_queue");
      if (!queued) return;
      const payload = JSON.parse(queued);
      payload.lastUpdated = new Date().toISOString();
      const ok = await _flushBackup(payload);
      if (ok) { try { localStorage.removeItem("tempus_backup_queue"); } catch {} }
    } catch {}
  });
}

// ============ SECTION FACTORIES ============
export const mkM = () => ({ id: Date.now() + Math.random(), type: "metered", tsNum: 4, tsDen: 4, beatUnit: "q", dotted: false, tempo: 120, bars: 8, grouping: "1+1+1+1", curve: "constant", endTempo: 120, loop: false, expressive: false, beatMap: null });
export const mkT = () => ({ id: Date.now() + Math.random(), type: "timed", duration: 10, markers: "" });

// ============ UTILITIES ============
export function gCD(tempo, bu, dot, den) { const t = Math.max(1, tempo || 120); const b = BU.find(x => x.id === bu); if (!b) return 0.5; let q = b.q; if (dot) q *= 1.5; return (60 / t) * ((D2Q[den] || 1) / q); }
export function pG(s) { if (!s || !s.trim()) return [1]; return s.split("+").map(x => parseInt(x.trim())).filter(n => !isNaN(n) && n > 0); }
export function sG(n, d) { if (d >= 8 && n % 3 === 0 && n > 3) return Array(n / 3).fill(3).join("+"); return Array(n).fill(1).join("+"); }
export function gBT(g) { const t = []; g.forEach((v, gi) => { for (let i = 0; i < v; i++)t.push(gi === 0 && i === 0 ? 0 : i === 0 ? 1 : 2); }); return t; }
export function pM(s) { if (!s || !s.trim()) return []; return s.split(",").map(x => parseFloat(x.trim())).filter(n => !isNaN(n) && n >= 0).sort((a, b) => a - b); }
export function mkBeatMap(n, tempo) { return Array.from({ length: n }, () => ({ tempo, fermata: false, fermataHold: 0, fermataUnit: "beats" })); }

export function isSafeUrl(url) { try { const u = new URL(url); return u.protocol === 'http:' || u.protocol === 'https:'; } catch { return false; } }

export function getEmbedUrl(url) {
  if (!url) return null;
  try {
    // YouTube
    let m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
    if (m) return `https://www.youtube.com/embed/${m[1]}?rel=0`;
    // Vimeo
    m = url.match(/vimeo\.com\/(\d+)/);
    if (m) return `https://player.vimeo.com/video/${m[1]}`;
    // Bilibili
    m = url.match(/bilibili\.com\/video\/(BV[a-zA-Z0-9]+)/);
    if (m) return `https://player.bilibili.com/player.html?bvid=${m[1]}&high_quality=1`;
    // Fallback - try as direct embed
    if (url.startsWith("http")) return url;
  } catch {}
  return null;
}

// ============ TIMELINE BUILDER ============
export function buildTL(sections) {
  const bars = []; let at = 0, ab = 1;
  sections.forEach((s, si) => {
    if (s.type === "timed") { bars.push({ si, bin: 1, ab: ab, st: at, dur: s.duration, cd: s.duration, tempo: 0, tsN: 0, tsD: 0, bts: [0], cpb: 1, isT: true, tDur: s.duration, mk: pM(s.markers) }); at += s.duration; ab++; return; }
    const grp = pG(s.grouping), cpb = s.tsNum;
    const loopFirstIdx = bars.length;
    const totalBeats = s.bars * cpb;
    for (let b = 0; b < s.bars; b++) {
      const bm = s.expressive && s.beatMap && s.beatMap.length === cpb ? s.beatMap : null;
      let perBeatCd = null, totalDur = 0;
      if (bm) {
        perBeatCd = bm.map(beat => {
          const cd = gCD(beat.tempo, s.beatUnit, s.dotted, s.tsDen);
          const hold = beat.fermata ? (beat.fermataUnit === "sec" ? beat.fermataHold : beat.fermataHold * cd) : 0;
          return { cd, hold, fermata: beat.fermata };
        });
        totalDur = perBeatCd.reduce((sum, x) => sum + x.cd + x.hold, 0);
      } else if (s.curve !== "constant" && totalBeats > 1) {
        perBeatCd = [];
        for (let i = 0; i < cpb; i++) {
          const beatNum = b * cpb + i;
          const t = beatNum / (totalBeats - 1);
          const tempo = s.tempo + (s.endTempo - s.tempo) * t;
          const cd = gCD(tempo, s.beatUnit, s.dotted, s.tsDen);
          perBeatCd.push({ cd, hold: 0, fermata: false });
        }
        totalDur = perBeatCd.reduce((sum, x) => sum + x.cd, 0);
      } else {
        const cd = gCD(s.tempo, s.beatUnit, s.dotted, s.tsDen);
        totalDur = cpb * cd;
      }
      const barTempo = s.curve !== "constant" && totalBeats > 1 ? s.tempo + (s.endTempo - s.tempo) * (b * cpb / Math.max(1, totalBeats - 1)) : s.tempo;
      bars.push({ si, bin: b + 1, ab, st: at, dur: totalDur, cd: perBeatCd ? null : gCD(s.tempo, s.beatUnit, s.dotted, s.tsDen), tempo: barTempo, tsN: s.tsNum, tsD: s.tsDen, bts: gBT(grp), cpb, isT: false, loop: !!s.loop, loopTo: loopFirstIdx, perBeatCd });
      at += totalDur; ab++;
    }
  }); return bars;
}

// ============ SCALE SECTIONS (PRACTICE MODE) ============
export function scaleSections(sections, pct) {
  return sections.map(s => {
    if (s.type === "timed") return { ...s, id: Date.now() + Math.random() };
    const ratio = pct / 100;
    const scaled = { ...s, id: Date.now() + Math.random(), tempo: Math.round(s.tempo * ratio), endTempo: Math.round(s.endTempo * ratio) };
    if (s.beatMap) scaled.beatMap = s.beatMap.map(b => ({ ...b, tempo: Math.round(b.tempo * ratio) }));
    return scaled;
  });
}
