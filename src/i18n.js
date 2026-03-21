// ============================================================
// TEMPUS i18n — Internationalisation Module
// ============================================================
// Languages: EN (default), 简体中文, 繁體中文, 日本語, 한국어
//
// ⚠️  JAPANESE (ja) AND KOREAN (ko) ARE PLACEHOLDERS ONLY.
// ⚠️  All ja/ko values are currently null and fall back to English.
// ⚠️  When translations are complete:
// ⚠️    1. Fill in all null values for ja and/or ko below
// ⚠️    2. Move "ja" and/or "ko" into ACTIVE_LANGS
// ⚠️    3. Delete this warning block
// ============================================================

import { _getLS, _setLS } from "./utils";

// ---- Language config ----

// Add "ja" or "ko" here to activate them in the dropdown.
// That's the ONLY change needed — no structural work required.
export const ACTIVE_LANGS = [
  "en",
  "zh-CN",
  "zh-TW",
  // "ja",  // ← uncomment when Japanese translations are complete
  // "ko",  // ← uncomment when Korean translations are complete
];

// All supported languages (for reference / iteration)
export const ALL_LANGS = ["en", "zh-CN", "zh-TW", "ja", "ko"];

// Dropdown labels — single character or short code
export const LANG_LABELS = {
  en: "EN",
  "zh-CN": "简体",
  "zh-TW": "繁體",
  ja: "あ",
  ko: "한",
};

// ---- State ----

let _lang = _getLS("tempus_lang") || "en";

export function getLang() { return _lang; }

export function setLang(l) {
  if (ALL_LANGS.includes(l)) {
    _lang = l;
    _setLS("tempus_lang", l);
  }
}

// ---- Translator ----

export function t(key) {
  const entry = S[key];
  if (!entry) return key; // fallback: show the key itself (debug aid)
  const val = entry[_lang];
  if (val != null && val !== "") return val;
  return entry.en || key; // fallback to English
}

// ============================================================
// DICTIONARY — ~165 keys
// ============================================================
// Structure per key:
//   key: { en, "zh-CN", "zh-TW", ja, ko }
//
// Conventions:
//   - Musical Italian terms (fermata, accel., rit., Clave) stay untranslated
//   - BPM, TAP stay universal
//   - Brand names (TEMPUS, Dual Tempus) stay English
//   - zh-TW follows Taiwan software conventions (儲存, 設定, 裝置, 資料, 網路, 搜尋)
//   - ja/ko: null = falls back to EN at runtime
// ============================================================

const S = {

  // ============ 1. GLOBAL / SHARED ============

  ok:              { en: "OK",        "zh-CN": "好",       "zh-TW": "好",       ja: null, ko: null },
  close:           { en: "Close",     "zh-CN": "关闭",     "zh-TW": "關閉",     ja: null, ko: null },
  cancel:          { en: "Cancel",    "zh-CN": "取消",     "zh-TW": "取消",     ja: null, ko: null },
  save:            { en: "Save",      "zh-CN": "保存",     "zh-TW": "儲存",     ja: null, ko: null },
  delete:          { en: "Delete",    "zh-CN": "删除",     "zh-TW": "刪除",     ja: null, ko: null },
  start:           { en: "Start",     "zh-CN": "开始",     "zh-TW": "開始",     ja: null, ko: null },
  end_label:       { en: "END",       "zh-CN": "结束",     "zh-TW": "結束",     ja: null, ko: null },
  bpm:             { en: "BPM",       "zh-CN": "BPM",     "zh-TW": "BPM",     ja: null, ko: null },
  bar_hash:        { en: "Bar #",     "zh-CN": "小节 #",   "zh-TW": "小節 #",   ja: null, ko: null },
  sec_unit:        { en: "sec",       "zh-CN": "节",       "zh-TW": "節",       ja: null, ko: null },
  bars_unit:       { en: "b",         "zh-CN": "小节",     "zh-TW": "小節",     ja: null, ko: null },
  on:              { en: "On",        "zh-CN": "开",       "zh-TW": "開",       ja: null, ko: null },
  off:             { en: "Off",       "zh-CN": "关",       "zh-TW": "關",       ja: null, ko: null },
  free:            { en: "FREE",      "zh-CN": "自由",     "zh-TW": "自由",     ja: null, ko: null },
  seconds_short:   { en: "s",         "zh-CN": "秒",       "zh-TW": "秒",       ja: null, ko: null },

  // ============ 2. NAVIGATION & TRANSPORT ============

  play:            { en: "Play",           "zh-CN": "播放",           "zh-TW": "播放",           ja: null, ko: null },
  pause:           { en: "Pause",          "zh-CN": "暂停",           "zh-TW": "暫停",           ja: null, ko: null },
  restart:         { en: "Restart",        "zh-CN": "重新开始",       "zh-TW": "重新開始",       ja: null, ko: null },
  previous:        { en: "Previous",       "zh-CN": "上一个",         "zh-TW": "上一個",         ja: null, ko: null },
  next:            { en: "Next",           "zh-CN": "下一个",         "zh-TW": "下一個",         ja: null, ko: null },
  exit:            { en: "Exit",           "zh-CN": "退出",           "zh-TW": "退出",           ja: null, ko: null },
  mute:            { en: "Mute",           "zh-CN": "静音",           "zh-TW": "靜音",           ja: null, ko: null },
  unmute:          { en: "Unmute",         "zh-CN": "取消静音",       "zh-TW": "取消靜音",       ja: null, ko: null },
  record:          { en: "Record",         "zh-CN": "录制",           "zh-TW": "錄製",           ja: null, ko: null },
  practice_mode:   { en: "Practice Mode",  "zh-CN": "练习模式",       "zh-TW": "練習模式",       ja: null, ko: null },
  rec:             { en: "REC",            "zh-CN": "录制",           "zh-TW": "錄製",           ja: null, ko: null },
  count_in:        { en: "Count-in",       "zh-CN": "预备拍",         "zh-TW": "預備拍",         ja: null, ko: null },
  bar_n:           { en: "Bar",            "zh-CN": "第",             "zh-TW": "第",             ja: null, ko: null }, // used as prefix: "Bar {n}" / "第{n}小节"
  up_next:         { en: "Up Next:",       "zh-CN": "下一段:",        "zh-TW": "下一段:",        ja: null, ko: null },
  free_dur:        { en: "Free",           "zh-CN": "自由",           "zh-TW": "自由",           ja: null, ko: null }, // "{n}s Free"
  at_tempo:        { en: "at",             "zh-CN": "速度",           "zh-TW": "速度",           ja: null, ko: null }, // "{ts} at {tempo}"
  tap_to_mark:     { en: "Tap anywhere to mark section",   "zh-CN": "点击任意位置标记段落",   "zh-TW": "點擊任意位置標記段落",   ja: null, ko: null },
  marked_bar:      { en: "Marked bar",     "zh-CN": "已标记第",       "zh-TW": "已標記第",       ja: null, ko: null }, // + bar number
  synced:          { en: "Synced",         "zh-CN": "已同步",         "zh-TW": "已同步",         ja: null, ko: null },
  tap:             { en: "TAP",            "zh-CN": "TAP",           "zh-TW": "TAP",           ja: null, ko: null },
  no_count_in:     { en: "No Count-in",    "zh-CN": "无预备拍",       "zh-TW": "無預備拍",       ja: null, ko: null },
  n_count_in:      { en: "Count-in",       "zh-CN": "拍预备",         "zh-TW": "拍預備",         ja: null, ko: null }, // "{n} Count-in" / "{n}拍预备"

  // ============ 3. CLICK SOUNDS ============

  sound_sine:         { en: "Sine",       "zh-CN": "正弦",   "zh-TW": "正弦",   ja: null, ko: null },
  sound_noise:        { en: "Noise",      "zh-CN": "噪音",   "zh-TW": "噪音",   ja: null, ko: null },
  sound_wood:         { en: "Wood",       "zh-CN": "木鱼",   "zh-TW": "木魚",   ja: null, ko: null },
  sound_rim:          { en: "Rim",        "zh-CN": "边击",   "zh-TW": "邊擊",   ja: null, ko: null },
  sound_clave:        { en: "Clave",      "zh-CN": "Clave", "zh-TW": "Clave", ja: null, ko: null },
  sound_cowbell:      { en: "Cow",        "zh-CN": "牛铃",   "zh-TW": "牛鈴",   ja: null, ko: null },
  sound_wood_full:    { en: "Wood Block", "zh-CN": "木鱼",   "zh-TW": "木魚",   ja: null, ko: null },
  sound_rim_full:     { en: "Rimshot",    "zh-CN": "边击",   "zh-TW": "邊擊",   ja: null, ko: null },
  sound_cowbell_full: { en: "Cowbell",    "zh-CN": "牛铃",   "zh-TW": "牛鈴",   ja: null, ko: null },

  // ============ 4. ACCENT LABELS ============

  accent:  { en: "Accent", "zh-CN": "强拍", "zh-TW": "強拍", ja: null, ko: null },
  flat:    { en: "Flat",   "zh-CN": "平均", "zh-TW": "平均", ja: null, ko: null },

  // ============ 5. SECTION EDITOR ============

  new_section:        { en: "New Section",       "zh-CN": "新段落",     "zh-TW": "新段落",     ja: null, ko: null },
  edit_section:       { en: "Edit Section",      "zh-CN": "编辑段落",   "zh-TW": "編輯段落",   ja: null, ko: null }, // + number
  metered:            { en: "Metered",           "zh-CN": "拍号",       "zh-TW": "拍號",       ja: null, ko: null },
  timed:              { en: "Timed",             "zh-CN": "计时",       "zh-TW": "計時",       ja: null, ko: null },
  row_bars:           { en: "Bars",              "zh-CN": "小节",       "zh-TW": "小節",       ja: null, ko: null },
  row_duration:       { en: "Duration",          "zh-CN": "时长",       "zh-TW": "時長",       ja: null, ko: null },
  row_markers:        { en: "Markers",           "zh-CN": "标记",       "zh-TW": "標記",       ja: null, ko: null },
  row_grouping:       { en: "Grouping",          "zh-CN": "组合",       "zh-TW": "組合",       ja: null, ko: null },
  row_curve:          { en: "Curve",             "zh-CN": "曲线",       "zh-TW": "曲線",       ja: null, ko: null },
  row_expressive:     { en: "Expressive",        "zh-CN": "表情",       "zh-TW": "表情",       ja: null, ko: null },
  markers_placeholder:{ en: "e.g. 3, 7.5, 12",  "zh-CN": "如 3, 7.5, 12", "zh-TW": "如 3, 7.5, 12", ja: null, ko: null },
  curve_constant:     { en: "—",                 "zh-CN": "—",         "zh-TW": "—",         ja: null, ko: null },
  curve_accel:        { en: "accel.",            "zh-CN": "accel.",    "zh-TW": "accel.",    ja: null, ko: null },
  curve_rit:          { en: "rit.",              "zh-CN": "rit.",      "zh-TW": "rit.",      ja: null, ko: null },
  duplicate:          { en: "Duplicate",         "zh-CN": "复制",       "zh-TW": "複製",       ja: null, ko: null },
  loop:               { en: "Loop",              "zh-CN": "循环",       "zh-TW": "循環",       ja: null, ko: null },
  beat_unit:          { en: "Beat Unit",         "zh-CN": "拍值",       "zh-TW": "拍值",       ja: null, ko: null },
  fermata:            { en: "Fermata",           "zh-CN": "Fermata",  "zh-TW": "Fermata",  ja: null, ko: null },
  up:                 { en: "Up",                "zh-CN": "上移",       "zh-TW": "上移",       ja: null, ko: null },
  down:               { en: "Down",              "zh-CN": "下移",       "zh-TW": "下移",       ja: null, ko: null },
  play_here:          { en: "Play here",         "zh-CN": "从此播放",   "zh-TW": "從此播放",   ja: null, ko: null },
  tap_to_edit:        { en: "tap to edit",       "zh-CN": "点击编辑",   "zh-TW": "點擊編輯",   ja: null, ko: null },

  // ============ 6. SETTINGS MODAL ============

  settings:          { en: "Settings",       "zh-CN": "设置",       "zh-TW": "設定",       ja: null, ko: null },
  mode_simple:       { en: "Simple",         "zh-CN": "简单",       "zh-TW": "簡單",       ja: null, ko: null },
  mode_standard:     { en: "Standard",       "zh-CN": "标准",       "zh-TW": "標準",       ja: null, ko: null },
  mode_pro:          { en: "Pro",            "zh-CN": "专业",       "zh-TW": "專業",       ja: null, ko: null },
  sr_mode:           { en: "Mode",           "zh-CN": "模式",       "zh-TW": "模式",       ja: null, ko: null },
  sr_click:          { en: "Click",          "zh-CN": "音色",       "zh-TW": "音色",       ja: null, ko: null },
  sr_sound:          { en: "Sound",          "zh-CN": "声音",       "zh-TW": "聲音",       ja: null, ko: null },
  sr_beats:          { en: "Beats",          "zh-CN": "节拍",       "zh-TW": "節拍",       ja: null, ko: null },
  sr_visual:         { en: "Visual",         "zh-CN": "视觉",       "zh-TW": "視覺",       ja: null, ko: null },
  sr_count_in:       { en: "Count-in",       "zh-CN": "预备拍",     "zh-TW": "預備拍",     ja: null, ko: null },
  sr_silent_cycle:   { en: "Silent Cycle",   "zh-CN": "静音循环",   "zh-TW": "靜音循環",   ja: null, ko: null },
  sr_dual_tempo:     { en: "Dual Tempo",     "zh-CN": "双速",       "zh-TW": "雙速",       ja: null, ko: null },
  vis_pulse:         { en: "Pulse",          "zh-CN": "脉冲",       "zh-TW": "脈衝",       ja: null, ko: null },
  vis_full:          { en: "Full",           "zh-CN": "完整",       "zh-TW": "完整",       ja: null, ko: null },
  vis_flash:         { en: "Flash",          "zh-CN": "闪烁",       "zh-TW": "閃爍",       ja: null, ko: null },
  tip_accented:      { en: "Accented",       "zh-CN": "强弱拍",     "zh-TW": "強弱拍",     ja: null, ko: null },
  tip_flat:          { en: "Flat",           "zh-CN": "均匀",       "zh-TW": "均勻",       ja: null, ko: null },
  tip_always_audible:{ en: "Always audible", "zh-CN": "始终有声",   "zh-TW": "始終有聲",   ja: null, ko: null },
  tip_silent_on:     { en: "on,",            "zh-CN": "秒响,",      "zh-TW": "秒響,",      ja: null, ko: null }, // "{n}s on,"
  tip_silent_off:    { en: "off, repeating", "zh-CN": "秒静, 循环", "zh-TW": "秒靜, 循環", ja: null, ko: null }, // "{n}s off, repeating"
  tip_dual:          { en: "Side-by-side metronomes", "zh-CN": "并列节拍器", "zh-TW": "並列節拍器", ja: null, ko: null },
  tempo_progress:    { en: "Tempo Progress",          "zh-CN": "速度进度",   "zh-TW": "速度進度",   ja: null, ko: null },
  tip_tempo_progress:{ en: "Show last/best tempo per section", "zh-CN": "显示每段上次/最佳速度", "zh-TW": "顯示每段上次/最佳速度", ja: null, ko: null },
  offline_mode:      { en: "Offline Mode",   "zh-CN": "离线模式",   "zh-TW": "離線模式",   ja: null, ko: null },
  tip_offline:       { en: "Cache app for offline use", "zh-CN": "缓存应用供离线使用", "zh-TW": "快取應用程式供離線使用", ja: null, ko: null },
  device_id:         { en: "Device ID:",     "zh-CN": "设备 ID:",   "zh-TW": "裝置 ID:",   ja: null, ko: null },
  data_local:        { en: "Your data is stored locally and backed up anonymously.", "zh-CN": "数据存储在本地并匿名备份。", "zh-TW": "資料儲存於本地並匿名備份。", ja: null, ko: null },
  sr_lang:           { en: "Language",       "zh-CN": "语言",       "zh-TW": "語言",       ja: null, ko: null },

  // ============ 7. SAVE / LIBRARY ============

  save_piece:         { en: "Save Piece",        "zh-CN": "保存作品",   "zh-TW": "儲存作品",   ja: null, ko: null },
  update_piece:       { en: "Update Piece",      "zh-CN": "更新作品",   "zh-TW": "更新作品",   ja: null, ko: null },
  ph_title:           { en: "Title",             "zh-CN": "标题",       "zh-TW": "標題",       ja: null, ko: null },
  ph_composer:        { en: "Composer / Arranger","zh-CN": "作曲 / 编曲","zh-TW": "作曲 / 編曲",ja: null, ko: null },
  ph_performer:       { en: "Performer / Ensemble (optional)", "zh-CN": "演奏者 / 乐团（可选）", "zh-TW": "演奏者 / 樂團（可選）", ja: null, ko: null },
  ph_video_url:       { en: "Video URL (optional)", "zh-CN": "视频链接（可选）", "zh-TW": "影片連結（可選）", ja: null, ko: null },
  btn_update:         { en: "Update",            "zh-CN": "更新",       "zh-TW": "更新",       ja: null, ko: null },
  btn_save_new:       { en: "Save New",          "zh-CN": "另存为新",   "zh-TW": "另存為新",   ja: null, ko: null },
  library:            { en: "Library",           "zh-CN": "曲库",       "zh-TW": "曲庫",       ja: null, ko: null },
  import_label:       { en: "Import",            "zh-CN": "导入",       "zh-TW": "匯入",       ja: null, ko: null },
  export_label:       { en: "Export",            "zh-CN": "导出",       "zh-TW": "匯出",       ja: null, ko: null },
  ph_search:          { en: "Search...",         "zh-CN": "搜索...",    "zh-TW": "搜尋...",    ja: null, ko: null },
  lib_empty:          { en: "Your Library is empty",       "zh-CN": "曲库为空",           "zh-TW": "曲庫為空",           ja: null, ko: null },
  lib_no_results:     { en: "No pieces found",             "zh-CN": "未找到作品",         "zh-TW": "未找到作品",         ja: null, ko: null },
  lib_empty_hint:     { en: "Save your sections into profiles to quickly load them later.", "zh-CN": "将段落保存为曲目以便快速加载。", "zh-TW": "將段落儲存為曲目以便快速載入。", ja: null, ko: null },
  lib_no_results_hint:{ en: "Try adjusting your search query.", "zh-CN": "请尝试调整搜索词。", "zh-TW": "請嘗試調整搜尋詞。", ja: null, ko: null },

  // ============ 8. PRACTICE SETUP ============

  practice_title:  { en: "Practice Mode",  "zh-CN": "练习模式", "zh-TW": "練習模式", ja: null, ko: null },
  row_start:       { en: "Start",          "zh-CN": "起始",     "zh-TW": "起始",     ja: null, ko: null },
  row_target:      { en: "Target",         "zh-CN": "目标",     "zh-TW": "目標",     ja: null, ko: null },
  row_increment:   { en: "Increment",      "zh-CN": "递增",     "zh-TW": "遞增",     ja: null, ko: null },
  row_repeats:     { en: "Repeats",        "zh-CN": "重复",     "zh-TW": "重複",     ja: null, ko: null },

  // ============ 9. SYNC MODE ============

  sync_mode:          { en: "Sync Mode",       "zh-CN": "同步模式",   "zh-TW": "同步模式",   ja: null, ko: null },
  sync:               { en: "Sync",            "zh-CN": "同步",       "zh-TW": "同步",       ja: null, ko: null },
  create_room:        { en: "Create Room",     "zh-CN": "创建房间",   "zh-TW": "建立房間",   ja: null, ko: null },
  join_room:          { en: "Join Room",       "zh-CN": "加入房间",   "zh-TW": "加入房間",   ja: null, ko: null },
  sync_hint:          { en: "Up to {n} devices can sync together.", "zh-CN": "最多{n}台设备可同步。", "zh-TW": "最多{n}台裝置可同步。", ja: null, ko: null },
  ph_display_name:    { en: "Your display name",  "zh-CN": "你的显示名称",  "zh-TW": "你的顯示名稱",  ja: null, ko: null },
  room_code:          { en: "Room code",       "zh-CN": "房间代码",   "zh-TW": "房間代碼",   ja: null, ko: null },
  ph_room_code:       { en: "0000",            "zh-CN": "0000",      "zh-TW": "0000",      ja: null, ko: null },
  creating:           { en: "Creating...",     "zh-CN": "创建中...", "zh-TW": "建立中...", ja: null, ko: null },
  joining:            { en: "Joining...",      "zh-CN": "加入中...", "zh-TW": "加入中...", ja: null, ko: null },
  waiting_room:       { en: "Waiting Room",    "zh-CN": "等待室",     "zh-TW": "等候室",     ja: null, ko: null },
  waiting_host:       { en: "Waiting for the host to let you in...", "zh-CN": "等待主持人允许进入...", "zh-TW": "等待主持人允許進入...", ja: null, ko: null },
  room_n:             { en: "Room",            "zh-CN": "房间",       "zh-TW": "房間",       ja: null, ko: null }, // + code
  perf_in_progress:   { en: "Performance in progress", "zh-CN": "演出进行中", "zh-TW": "演出進行中", ja: null, ko: null },
  waiting_next_start: { en: "Waiting for next start...", "zh-CN": "等待下一次开始...", "zh-TW": "等待下一次開始...", ja: null, ko: null },
  members_label:      { en: "members",         "zh-CN": "成员",       "zh-TW": "成員",       ja: null, ko: null }, // "{n}/{max} members"
  pending_n:          { en: "Pending",         "zh-CN": "待审核",     "zh-TW": "待審核",     ja: null, ko: null }, // + count
  members:            { en: "Members",         "zh-CN": "成员",       "zh-TW": "成員",       ja: null, ko: null },
  err_room_not_found: { en: "Room not found",  "zh-CN": "房间不存在", "zh-TW": "房間不存在", ja: null, ko: null },
  err_removed:        { en: "You were removed from this room", "zh-CN": "你已被移出此房间", "zh-TW": "你已被移出此房間", ja: null, ko: null },
  err_room_full:      { en: "Room is full",    "zh-CN": "房间已满",   "zh-TW": "房間已滿",   ja: null, ko: null },
  err_enter_name:     { en: "Enter your display name", "zh-CN": "请输入显示名称", "zh-TW": "請輸入顯示名稱", ja: null, ko: null },
  err_enter_code:     { en: "Enter a 4-digit room code", "zh-CN": "请输入4位房间代码", "zh-TW": "請輸入4位房間代碼", ja: null, ko: null },
  err_create_fail:    { en: "Failed to create room", "zh-CN": "创建房间失败", "zh-TW": "建立房間失敗", ja: null, ko: null },
  err_join_fail:      { en: "Failed to join room", "zh-CN": "加入房间失败", "zh-TW": "加入房間失敗", ja: null, ko: null },
  err_join_fail_2:    { en: "Could not join room", "zh-CN": "无法加入房间", "zh-TW": "無法加入房間", ja: null, ko: null },
  toast_room_closed:  { en: "Room closed by host", "zh-CN": "主持人已关闭房间", "zh-TW": "主持人已關閉房間", ja: null, ko: null },
  toast_removed:      { en: "You were removed by the host", "zh-CN": "你已被主持人移除", "zh-TW": "你已被主持人移除", ja: null, ko: null },
  toast_sync_reset:   { en: "Sync reset — all devices reloaded", "zh-CN": "同步重置 — 所有设备已重新加载", "zh-TW": "同步重置 — 所有裝置已重新載入", ja: null, ko: null },
  sync_start:         { en: "Sync Start",     "zh-CN": "同步开始",   "zh-TW": "同步開始",   ja: null, ko: null },
  connecting:         { en: "Connecting...",   "zh-CN": "连接中...", "zh-TW": "連線中...", ja: null, ko: null },
  unlink_to_sync:     { en: "Device linking active. Unlink to use Sync Mode.", "zh-CN": "设备链接已启用。取消链接以使用同步模式。", "zh-TW": "裝置連結已啟用。取消連結以使用同步模式。", ja: null, ko: null },

  // ============ 10. DEVICE LINK ============

  my_devices:      { en: "My Devices",     "zh-CN": "我的设备",   "zh-TW": "我的裝置",   ja: null, ko: null },
  link_hint:       { en: "Link devices to sync profiles & tempo history.", "zh-CN": "链接设备以同步资料和速度历史。", "zh-TW": "連結裝置以同步資料和速度歷史。", ja: null, ko: null },
  err_code_expired:{ en: "Code expired",   "zh-CN": "代码已过期", "zh-TW": "代碼已過期", ja: null, ko: null },
  err_handshake:   { en: "Handshake failed","zh-CN": "握手失败",   "zh-TW": "握手失敗",   ja: null, ko: null },
  err_6digit:      { en: "Enter a 6-digit code", "zh-CN": "请输入6位代码", "zh-TW": "請輸入6位代碼", ja: null, ko: null },
  err_join_link:   { en: "Could not join",  "zh-CN": "无法加入",   "zh-TW": "無法加入",   ja: null, ko: null },
  err_code_invalid:{ en: "Code invalid, expired, or already used", "zh-CN": "代码无效、已过期或已使用", "zh-TW": "代碼無效、已過期或已使用", ja: null, ko: null },

  // ============ 11. VIDEO VIEW ============

  video:             { en: "Video",          "zh-CN": "视频",       "zh-TW": "影片",       ja: null, ko: null },
  vid_sync_btn:      { en: "Sync",           "zh-CN": "同步",       "zh-TW": "同步",       ja: null, ko: null },
  vid_start:         { en: "START",          "zh-CN": "起点",       "zh-TW": "起點",       ja: null, ko: null },
  vid_end:           { en: "END",            "zh-CN": "终点",       "zh-TW": "終點",       ja: null, ko: null },
  vid_set:           { en: "Set",            "zh-CN": "设定",       "zh-TW": "設定",       ja: null, ko: null },
  vid_section_tempo: { en: "Section",        "zh-CN": "段落",       "zh-TW": "段落",       ja: null, ko: null }, // + "{n} Tempo"
  vid_tempo:         { en: "Tempo",          "zh-CN": "速度",       "zh-TW": "速度",       ja: null, ko: null },
  vid_go:            { en: "Go",             "zh-CN": "跳转",       "zh-TW": "跳轉",       ja: null, ko: null },
  vid_starting:      { en: "Starting...",    "zh-CN": "开始中...", "zh-TW": "開始中...", ja: null, ko: null },
  vid_tap_restart:   { en: "Tap restart or go back to sections", "zh-CN": "点击重新开始或返回段落", "zh-TW": "點擊重新開始或返回段落", ja: null, ko: null },
  vid_back_sections: { en: "Back to sections","zh-CN": "返回段落",   "zh-TW": "返回段落",   ja: null, ko: null },
  vid_free:          { en: "free",           "zh-CN": "自由",       "zh-TW": "自由",       ja: null, ko: null }, // "{n}s free"
  vid_1bar:          { en: "1 Bar",          "zh-CN": "1 小节",     "zh-TW": "1 小節",     ja: null, ko: null },
  vid_2bars:         { en: "2 Bars",         "zh-CN": "2 小节",     "zh-TW": "2 小節",     ja: null, ko: null },
  vid_sync_avail:    { en: "Sync is available for YouTube, Vimeo, and SoundCloud.", "zh-CN": "同步支持 YouTube、Vimeo 和 SoundCloud。", "zh-TW": "同步支援 YouTube、Vimeo 和 SoundCloud。", ja: null, ko: null },
  vid_open_browser:  { en: "Open in browser","zh-CN": "在浏览器中打开","zh-TW": "在瀏覽器中開啟", ja: null, ko: null },
  vid_invalid_url:   { en: "Invalid URL Format", "zh-CN": "链接格式无效", "zh-TW": "連結格式無效", ja: null, ko: null },
  vid_unsaved:       { en: "Unsaved Changes","zh-CN": "未保存的更改","zh-TW": "未儲存的更改", ja: null, ko: null },
  vid_unsaved_desc:  { en: "You have unsaved changes in this session.", "zh-CN": "本次操作有未保存的更改。", "zh-TW": "本次操作有未儲存的更改。", ja: null, ko: null },
  vid_save_changes:  { en: "Save Changes",  "zh-CN": "保存更改",   "zh-TW": "儲存更改",   ja: null, ko: null },
  vid_discard:       { en: "Discard",        "zh-CN": "丢弃",       "zh-TW": "捨棄",       ja: null, ko: null },

  // ============ 12. DUAL TEMPO ============

  dual_title:       { en: "DUAL TEMPUS",    "zh-CN": "DUAL TEMPUS","zh-TW": "DUAL TEMPUS",ja: null, ko: null },
  dual_best_screen: { en: "Best on a larger screen",  "zh-CN": "建议使用大屏",   "zh-TW": "建議使用大螢幕", ja: null, ko: null },
  dual_need_room:   { en: "Two side-by-side panels need room. Use portrait on mobile.", "zh-CN": "两个并列面板需要空间。移动端请用竖屏。", "zh-TW": "兩個並列面板需要空間。行動裝置請用直式。", ja: null, ko: null },
  dual_got_it:      { en: "Got it",         "zh-CN": "知道了",     "zh-TW": "知道了",     ja: null, ko: null },
  dual_dont_show:   { en: "Don't show this again", "zh-CN": "不再显示", "zh-TW": "不再顯示", ja: null, ko: null },

  // ============ 13. OFFLINE PROMPTS ============

  offline_sync:   { en: "Sync needs internet",           "zh-CN": "同步需要网络",       "zh-TW": "同步需要網路",       ja: null, ko: null },
  offline_link:   { en: "Device linking needs internet",  "zh-CN": "设备链接需要网络",   "zh-TW": "裝置連結需要網路",   ja: null, ko: null },
  offline_video:  { en: "Video needs internet",           "zh-CN": "视频需要网络",       "zh-TW": "影片需要網路",       ja: null, ko: null },

  // ============ 14. APP HEADER ============

  new_label:   { en: "New",   "zh-CN": "新建", "zh-TW": "新建", ja: null, ko: null },
  clear_confirm: { en: "Start a new piece? Current sections will be cleared.", "zh-CN": "开始新曲目？当前段落将被清除。", "zh-TW": "開始新曲目？目前段落將被清除。", ja: null, ko: null },
  confirm_clear: { en: "Clear", "zh-CN": "清除", "zh-TW": "清除", ja: null, ko: null },
  dual:        { en: "Dual",  "zh-CN": "双速", "zh-TW": "雙速", ja: null, ko: null },

};

export default S;
