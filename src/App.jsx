import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useSync, SyncLobby, SyncStatusBar, SyncToast } from "./SyncMode";

// ============ i18n ============
// Supported: en, zh-CN, zh-TW (ja, ko planned)
let _lang = "en";
export function setAppLang(l) { _lang = l; }

const S = {
  // --- General units ---
  "unit.sec": { en: "section", "zh-CN": "段落", "zh-TW": "段落" },
  "unit.bar": { en: "bar", "zh-CN": "小节", "zh-TW": "小節" },
  "unit.cue": { en: "cue", "zh-CN": "提示", "zh-TW": "提示" },
  "unit.member": { en: "member", "zh-CN": "成员", "zh-TW": "成員" },
  "unit.device": { en: "device", "zh-CN": "设备", "zh-TW": "設備" },
  "sec": { en: "sec", "zh-CN": "段", "zh-TW": "段" },
  "bpm": { en: "BPM", "zh-CN": "BPM", "zh-TW": "BPM" },

  // --- Toolbar ---
  "toolbar.new": { en: "New", "zh-CN": "新建", "zh-TW": "新建" },
  "toolbar.tapAgain": { en: "Tap again", "zh-CN": "再点一次", "zh-TW": "再點一次" },
  "toolbar.clearQ": { en: "Clear?", "zh-CN": "清除?", "zh-TW": "清除?" },
  "toolbar.video": { en: "Video", "zh-CN": "视频", "zh-TW": "影片" },
  "toolbar.library": { en: "Library", "zh-CN": "曲库", "zh-TW": "曲庫" },
  "toolbar.save": { en: "Save", "zh-CN": "保存", "zh-TW": "儲存" },
  "toolbar.sync": { en: "Sync", "zh-CN": "同步", "zh-TW": "同步" },
  "toolbar.settings": { en: "Settings", "zh-CN": "设置", "zh-TW": "設定" },
  "toolbar.record": { en: "Record", "zh-CN": "录制", "zh-TW": "錄製" },
  "toolbar.play": { en: "Play", "zh-CN": "播放", "zh-TW": "播放" },
  "toolbar.syncStart": { en: "Sync Start", "zh-CN": "同步开始", "zh-TW": "同步開始" },
  "toolbar.connecting": { en: "Connecting...", "zh-CN": "连接中...", "zh-TW": "連接中..." },
  "toolbar.practiceMode": { en: "Practice Mode", "zh-CN": "练习模式", "zh-TW": "練習模式" },

  // --- Section Editor ---
  "secEd.new": { en: "New Section", "zh-CN": "新段落", "zh-TW": "新段落" },
  "secEd.edit": { en: "Edit Section", "zh-CN": "编辑段落", "zh-TW": "編輯段落" },
  "secEd.metered": { en: "Metered", "zh-CN": "有拍号", "zh-TW": "有拍號" },
  "secEd.timed": { en: "Timed", "zh-CN": "自由计时", "zh-TW": "自由計時" },
  "secEd.bars": { en: "Bars", "zh-CN": "小节数", "zh-TW": "小節數" },
  "secEd.grouping": { en: "Grouping", "zh-CN": "分组", "zh-TW": "分組" },
  "secEd.curve": { en: "Curve", "zh-CN": "速度曲线", "zh-TW": "速度曲線" },
  "secEd.expressive": { en: "Expressive", "zh-CN": "表情", "zh-TW": "表情" },
  "secEd.on": { en: "On", "zh-CN": "开", "zh-TW": "開" },
  "secEd.off": { en: "Off", "zh-CN": "关", "zh-TW": "關" },
  "secEd.duration": { en: "Duration", "zh-CN": "时长", "zh-TW": "時長" },
  "secEd.markers": { en: "Markers", "zh-CN": "标记", "zh-TW": "標記" },
  "secEd.markersPlaceholder": { en: "e.g. 3, 7.5, 12", "zh-CN": "如 3, 7.5, 12", "zh-TW": "如 3, 7.5, 12" },
  "secEd.add": { en: "Add", "zh-CN": "添加", "zh-TW": "新增" },
  "secEd.save": { en: "Save", "zh-CN": "保存", "zh-TW": "儲存" },
  "secEd.delete": { en: "Delete", "zh-CN": "删除", "zh-TW": "刪除" },
  "secEd.duplicate": { en: "Duplicate", "zh-CN": "复制", "zh-TW": "複製" },
  "secEd.loop": { en: "Loop", "zh-CN": "循环", "zh-TW": "循環" },
  "secEd.beatUnit": { en: "Beat Unit", "zh-CN": "拍号单位", "zh-TW": "拍號單位" },
  "secEd.fermata": { en: "Fermata", "zh-CN": "Fermata", "zh-TW": "Fermata" },

  // --- PlayView ---
  "play.countIn": { en: "Count-in", "zh-CN": "预备拍", "zh-TW": "預備拍" },
  "play.bar": { en: "Bar", "zh-CN": "小节", "zh-TW": "小節" },
  "play.free": { en: "FREE", "zh-CN": "自由", "zh-TW": "自由" },
  "play.end": { en: "END", "zh-CN": "结束", "zh-TW": "結束" },
  "play.upNext": { en: "Up Next:", "zh-CN": "下一段:", "zh-TW": "下一段:" },
  "play.synced": { en: "Synced", "zh-CN": "已同步", "zh-TW": "已同步" },
  "play.tapToMark": { en: "Tap anywhere to mark section", "zh-CN": "点击任意处标记段落", "zh-TW": "點擊任意處標記段落" },
  "play.accent": { en: "Accent", "zh-CN": "重音", "zh-TW": "重音" },
  "play.flat": { en: "Flat", "zh-CN": "平均", "zh-TW": "平均" },
  "play.pitch": { en: "Pitch", "zh-CN": "音高", "zh-TW": "音高" },
  "play.noise": { en: "Noise", "zh-CN": "噪声", "zh-TW": "噪音" },
  "play.noCountIn": { en: "No Count-in", "zh-CN": "无预备拍", "zh-TW": "無預備拍" },
  "play.1countIn": { en: "1 Count-in", "zh-CN": "1小节预备", "zh-TW": "1小節預備" },
  "play.2countIn": { en: "2 Count-in", "zh-CN": "2小节预备", "zh-TW": "2小節預備" },
  "play.tap": { en: "TAP", "zh-CN": "TAP", "zh-TW": "TAP" },
  "play.rec": { en: "REC", "zh-CN": "录制", "zh-TW": "錄製" },
  "play.barHash": { en: "Bar #", "zh-CN": "小节 #", "zh-TW": "小節 #" },
  "play.mute": { en: "Mute", "zh-CN": "静音", "zh-TW": "靜音" },
  "play.unmute": { en: "Unmute", "zh-CN": "取消静音", "zh-TW": "取消靜音" },
  "play.exit": { en: "Exit", "zh-CN": "退出", "zh-TW": "退出" },
  "play.previous": { en: "Previous", "zh-CN": "上一段", "zh-TW": "上一段" },
  "play.next": { en: "Next", "zh-CN": "下一段", "zh-TW": "下一段" },
  "play.restart": { en: "Restart", "zh-CN": "重新开始", "zh-TW": "重新開始" },
  "play.pause": { en: "Pause", "zh-CN": "暂停", "zh-TW": "暫停" },

  // --- VideoView ---
  "video.start": { en: "START", "zh-CN": "起点", "zh-TW": "起點" },
  "video.end": { en: "END", "zh-CN": "终点", "zh-TW": "終點" },
  "video.set": { en: "Set", "zh-CN": "设定", "zh-TW": "設定" },
  "video.sync": { en: "Sync", "zh-CN": "同步", "zh-TW": "同步" },
  "video.countIn": { en: "Count-in", "zh-CN": "预备拍", "zh-TW": "預備拍" },
  "video.starting": { en: "Starting...", "zh-CN": "开始中...", "zh-TW": "開始中..." },
  "video.endTitle": { en: "END", "zh-CN": "结束", "zh-TW": "結束" },
  "video.tapRestart": { en: "Tap restart or go back to sections", "zh-CN": "点击重新开始或返回段落", "zh-TW": "點擊重新開始或返回段落" },
  "video.backToSections": { en: "Back to sections", "zh-CN": "返回段落", "zh-TW": "返回段落" },
  "video.secTempo": { en: "Section", "zh-CN": "段落", "zh-TW": "段落" },
  "video.tempo": { en: "Tempo", "zh-CN": "速度", "zh-TW": "速度" },
  "video.go": { en: "Go", "zh-CN": "跳转", "zh-TW": "跳轉" },
  "video.off": { en: "Off", "zh-CN": "关", "zh-TW": "關" },
  "video.1bar": { en: "1 Bar", "zh-CN": "1小节", "zh-TW": "1小節" },
  "video.2bars": { en: "2 Bars", "zh-CN": "2小节", "zh-TW": "2小節" },
  "video.syncAvailable": { en: "Sync is available for YouTube, Vimeo, and SoundCloud.", "zh-CN": "同步功能支持 YouTube、Vimeo 和 SoundCloud。", "zh-TW": "同步功能支援 YouTube、Vimeo 和 SoundCloud。" },
  "video.unsaved": { en: "Unsaved Changes", "zh-CN": "未保存的更改", "zh-TW": "未儲存的變更" },
  "video.unsavedDesc": { en: "You have unsaved changes in this session.", "zh-CN": "当前会话中有未保存的更改。", "zh-TW": "目前的工作階段有未儲存的變更。" },
  "video.saveChanges": { en: "Save Changes", "zh-CN": "保存更改", "zh-TW": "儲存變更" },
  "video.discard": { en: "Discard", "zh-CN": "放弃", "zh-TW": "捨棄" },
  "video.cancel": { en: "Cancel", "zh-CN": "取消", "zh-TW": "取消" },
  "video.openInBrowser": { en: "Open in browser", "zh-CN": "在浏览器中打开", "zh-TW": "在瀏覽器中開啟" },
  "video.invalidUrl": { en: "Invalid URL Format", "zh-CN": "无效的 URL 格式", "zh-TW": "無效的 URL 格式" },

  // --- Settings ---
  "settings.title": { en: "Settings", "zh-CN": "设置", "zh-TW": "設定" },
  "settings.language": { en: "Language", "zh-CN": "语言", "zh-TW": "語言" },
  "settings.mode": { en: "Mode", "zh-CN": "模式", "zh-TW": "模式" },
  "settings.click": { en: "Click", "zh-CN": "节拍器音色", "zh-TW": "節拍器音色" },
  "settings.accented": { en: "Accented", "zh-CN": "重音", "zh-TW": "重音" },
  "settings.flatTip": { en: "Flat", "zh-CN": "平均", "zh-TW": "平均" },
  "settings.pitched": { en: "Pitched", "zh-CN": "音高", "zh-TW": "音高" },
  "settings.unpitched": { en: "Unpitched", "zh-CN": "噪声", "zh-TW": "噪音" },
  "settings.beats": { en: "Beats", "zh-CN": "节拍", "zh-TW": "節拍" },
  "settings.visual": { en: "Visual", "zh-CN": "视觉", "zh-TW": "視覺" },
  "settings.pulse": { en: "Pulse", "zh-CN": "脉冲", "zh-TW": "脈衝" },
  "settings.full": { en: "Full", "zh-CN": "完整", "zh-TW": "完整" },
  "settings.flash": { en: "Flash", "zh-CN": "闪烁", "zh-TW": "閃爍" },
  "settings.countIn": { en: "Count-in", "zh-CN": "预备拍", "zh-TW": "預備拍" },
  "settings.countInOff": { en: "Off", "zh-CN": "关", "zh-TW": "關" },
  "settings.countIn1": { en: "1 bar", "zh-CN": "1小节", "zh-TW": "1小節" },
  "settings.countIn2": { en: "2 bars", "zh-CN": "2小节", "zh-TW": "2小節" },
  "settings.silentCycle": { en: "Silent Cycle", "zh-CN": "静音循环", "zh-TW": "靜音循環" },
  "settings.alwaysAudible": { en: "Always audible", "zh-CN": "始终有声", "zh-TW": "始終有聲" },
  "settings.silentTip": { en: "on", "zh-CN": "响", "zh-TW": "響" },
  "settings.silentTip2": { en: "off, repeating", "zh-CN": "静, 循环", "zh-TW": "靜, 循環" },
  "settings.deviceId": { en: "Device ID:", "zh-CN": "设备 ID:", "zh-TW": "裝置 ID:" },
  "settings.basic": { en: "Basic", "zh-CN": "基础", "zh-TW": "基礎" },
  "settings.default": { en: "Default", "zh-CN": "默认", "zh-TW": "預設" },
  "settings.advanced": { en: "Advanced", "zh-CN": "高级", "zh-TW": "進階" },
  "off": { en: "Off", "zh-CN": "关", "zh-TW": "關" },
  "settings.privacy": { en: "Your data is stored locally and backed up anonymously.", "zh-CN": "您的数据存储在本地并匿名备份。", "zh-TW": "您的資料儲存在本機並匿名備份。" },

  // --- Save ---
  "save.savePiece": { en: "Save Piece", "zh-CN": "保存曲目", "zh-TW": "儲存曲目" },
  "save.updatePiece": { en: "Update Piece", "zh-CN": "更新曲目", "zh-TW": "更新曲目" },
  "save.title": { en: "Title", "zh-CN": "标题", "zh-TW": "標題" },
  "save.composer": { en: "Composer / Arranger", "zh-CN": "作曲家 / 编曲家", "zh-TW": "作曲家 / 編曲家" },
  "save.performer": { en: "Performer / Ensemble (optional)", "zh-CN": "演奏者 / 团体（可选）", "zh-TW": "演奏者 / 團體（可選）" },
  "save.videoUrl": { en: "Video URL (optional)", "zh-CN": "视频链接（可选）", "zh-TW": "影片連結（可選）" },
  "save.update": { en: "Update", "zh-CN": "更新", "zh-TW": "更新" },
  "save.saveNew": { en: "Save New", "zh-CN": "另存为新", "zh-TW": "另存為新" },
  "save.save": { en: "Save", "zh-CN": "保存", "zh-TW": "儲存" },
  "close": { en: "Close", "zh-CN": "关闭", "zh-TW": "關閉" },

  // --- Library ---
  "lib.title": { en: "Library", "zh-CN": "曲库", "zh-TW": "曲庫" },
  "lib.import": { en: "Import", "zh-CN": "导入", "zh-TW": "匯入" },
  "lib.export": { en: "Export", "zh-CN": "导出", "zh-TW": "匯出" },
  "lib.search": { en: "Search...", "zh-CN": "搜索...", "zh-TW": "搜尋..." },
  "lib.empty": { en: "Your Library is empty", "zh-CN": "曲库为空", "zh-TW": "曲庫為空" },
  "lib.noResults": { en: "No pieces found", "zh-CN": "未找到曲目", "zh-TW": "未找到曲目" },
  "lib.emptyDesc": { en: "Save your sections into profiles to quickly load them later.", "zh-CN": "将段落保存为曲目，以便快速加载。", "zh-TW": "將段落儲存為曲目，以便快速載入。" },
  "lib.noResultsDesc": { en: "Try adjusting your search query.", "zh-CN": "请尝试调整搜索关键词。", "zh-TW": "請嘗試調整搜尋關鍵字。" },
  "lib.deleteQ": { en: "Delete?", "zh-CN": "删除?", "zh-TW": "刪除?" },

  // --- Practice ---
  "prac.title": { en: "Practice Mode", "zh-CN": "练习模式", "zh-TW": "練習模式" },
  "prac.start": { en: "Start", "zh-CN": "起始", "zh-TW": "起始" },
  "prac.target": { en: "Target", "zh-CN": "目标", "zh-TW": "目標" },
  "prac.increment": { en: "Increment", "zh-CN": "递增", "zh-TW": "遞增" },
  "prac.repeats": { en: "Repeats", "zh-CN": "重复", "zh-TW": "重複" },
  "prac.startBtn": { en: "Start", "zh-CN": "开始", "zh-TW": "開始" },

  // --- Undo ---
  "undo.cleared": { en: "Sections cleared", "zh-CN": "段落已清除", "zh-TW": "段落已清除" },
  "undo.deleted": { en: "Section deleted", "zh-CN": "段落已删除", "zh-TW": "段落已刪除" },
  "undo.undo": { en: "Undo", "zh-CN": "撤销", "zh-TW": "復原" },

  // --- Sync (used in SyncMode.jsx) ---
  "sync.mode": { en: "Sync Mode", "zh-CN": "同步模式", "zh-TW": "同步模式" },
  "sync.createRoom": { en: "Create Room", "zh-CN": "创建房间", "zh-TW": "建立房間" },
  "sync.joinRoom": { en: "Join Room", "zh-CN": "加入房间", "zh-TW": "加入房間" },
  "sync.maxDevices": { en: "devices can sync together.", "zh-CN": "台设备可同步。", "zh-TW": "台裝置可同步。" },
  "sync.displayName": { en: "Your display name", "zh-CN": "您的显示名称", "zh-TW": "您的顯示名稱" },
  "sync.roomCode": { en: "Room code", "zh-CN": "房间代码", "zh-TW": "房間代碼" },
  "sync.creating": { en: "Creating...", "zh-CN": "创建中...", "zh-TW": "建立中..." },
  "sync.joining": { en: "Joining...", "zh-CN": "加入中...", "zh-TW": "加入中..." },
  "sync.waitingRoom": { en: "Waiting Room", "zh-CN": "等候室", "zh-TW": "等候室" },
  "sync.waitingForHost": { en: "Waiting for the host to let you in...", "zh-CN": "等待主持人允许进入...", "zh-TW": "等待主持人允許進入..." },
  "sync.room": { en: "Room", "zh-CN": "房间", "zh-TW": "房間" },
  "sync.performanceInProgress": { en: "Performance in progress", "zh-CN": "演出进行中", "zh-TW": "演出進行中" },
  "sync.waitingForNext": { en: "Waiting for next start...", "zh-CN": "等待下一次开始...", "zh-TW": "等待下一次開始..." },
  "sync.leave": { en: "Leave", "zh-CN": "离开", "zh-TW": "離開" },
  "sync.leaveRoom": { en: "Leave Room", "zh-CN": "离开房间", "zh-TW": "離開房間" },
  "sync.pending": { en: "Pending", "zh-CN": "等候中", "zh-TW": "等候中" },
  "sync.admitAll": { en: "Admit All", "zh-CN": "全部允许", "zh-TW": "全部允許" },
  "sync.admit": { en: "Admit", "zh-CN": "允许", "zh-TW": "允許" },
  "sync.decline": { en: "Decline", "zh-CN": "拒绝", "zh-TW": "拒絕" },
  "sync.members": { en: "Members", "zh-CN": "成员", "zh-TW": "成員" },
  "sync.host": { en: "HOST", "zh-CN": "主持人", "zh-TW": "主持人" },
  "sync.unknown": { en: "Unknown", "zh-CN": "未知", "zh-TW": "未知" },
  "sync.kickQ": { en: "Kick?", "zh-CN": "移除?", "zh-TW": "移除?" },
  "sync.removeAll": { en: "Remove all members", "zh-CN": "移除所有成员", "zh-TW": "移除所有成員" },
  "sync.removeAllConfirm": { en: "Tap again to remove everyone", "zh-CN": "再点一次以移除所有人", "zh-TW": "再點一次以移除所有人" },
  "sync.backToSections": { en: "Back to sections", "zh-CN": "返回段落", "zh-TW": "返回段落" },
  "sync.roomClosed": { en: "Room closed by host", "zh-CN": "房间已被主持人关闭", "zh-TW": "房間已被主持人關閉" },
  "sync.removed": { en: "You were removed by the host", "zh-CN": "您已被主持人移除", "zh-TW": "您已被主持人移除" },
  "sync.resetAll": { en: "Sync reset — all devices reloaded", "zh-CN": "同步重置 — 所有设备已重载", "zh-TW": "同步重置 — 所有裝置已重載" },
  "sync.enterName": { en: "Enter your display name", "zh-CN": "请输入显示名称", "zh-TW": "請輸入顯示名稱" },
  "sync.enter4Digit": { en: "Enter a 4-digit room code", "zh-CN": "请输入4位房间代码", "zh-TW": "請輸入4位房間代碼" },
  "sync.couldNotJoin": { en: "Could not join room", "zh-CN": "无法加入房间", "zh-TW": "無法加入房間" },
  "sync.syncReset": { en: "Sync Reset", "zh-CN": "同步重置", "zh-TW": "同步重置" },
  "sync.confirmQ": { en: "Confirm?", "zh-CN": "确认?", "zh-TW": "確認?" },
  "sync.stop": { en: "Stop", "zh-CN": "停止", "zh-TW": "停止" },
  "sync.resume": { en: "Resume", "zh-CN": "继续", "zh-TW": "繼續" },
  "sync.restart": { en: "Restart", "zh-CN": "重新开始", "zh-TW": "重新開始" },
  "sync.manage": { en: "Manage", "zh-CN": "管理", "zh-TW": "管理" },
  "sync.leaveQ": { en: "Leave?", "zh-CN": "离开?", "zh-TW": "離開?" },
  "sync.upTo": { en: "Up to", "zh-CN": "最多", "zh-TW": "最多" },
};
export function t(key) { const e = S[key]; if (!e) return key; return e[_lang] || e.en || key; }
export function tp(key, n) { const v = S[key]?.[_lang] || S[key]?.en || key; return _lang === "en" && n !== 1 ? v + "s" : v; }



// ============ ICONS ============
const Icon = ({ d, size = 18, fill = "none", strokeWidth = 1.5, viewBox = "0 0 24 24" }) => (
  <svg width={size} height={size} viewBox={viewBox} fill={fill} stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {Array.isArray(d) ? d.map((p, i) => React.isValidElement(p) ? React.cloneElement(p, { key: i }) : <path key={i} d={p} vectorEffect="non-scaling-stroke" />)
      : React.isValidElement(d) ? d : <path d={d} vectorEffect="non-scaling-stroke" />}
  </svg>
);

export const SyncIcon = ({ size = 18 }) => (
  <Icon size={size} d={["M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71", "M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"]} />
);
export const I = {
  play: s => <Icon size={s || 18} d="M5 3l14 9-14 9V3z" fill="none" strokeWidth={1.5} />,
  pause: s => <Icon size={s || 18} d={[<rect x="6" y="4" width="4" height="16" rx="1" fill="currentColor" stroke="none" />, <rect x="14" y="4" width="4" height="16" rx="1" fill="currentColor" stroke="none" />]} />,
  chevL: s => <Icon size={s || 18} d="M15 18l-6-6 6-6" />,
  chevR: s => <Icon size={s || 18} d="M9 18l6-6-6-6" />,
  plus: s => <Icon size={s || 20} d={["M12 5v14", "M5 12h14"]} />,
  trash: s => <Icon size={s || 16} d={["M3 6h18", "M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2", "M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"]} />,
  copy: s => <Icon size={s || 16} d={["M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2", "M12 8h6a2 2 0 012 2v8a2 2 0 01-2 2h-6a2 2 0 01-2-2v-8a2 2 0 012-2z"]} />,
  arrowUp: s => <Icon size={s || 16} d="M12 19V5M5 12l7-7 7 7" />,
  arrowDown: s => <Icon size={s || 16} d="M12 5v14M5 12l7 7 7-7" />,
  x: s => <Icon size={s || 18} d={["M18 6L6 18", "M6 6l12 12"]} />,
  volOn: s => <Icon size={s || 18} d={["M11 5L6 9H2v6h4l5 4V5z", "M19.07 4.93a10 10 0 010 14.14", "M15.54 8.46a5 5 0 010 7.07"]} />,
  volOff: s => <Icon size={s || 18} d={["M11 5L6 9H2v6h4l5 4V5z", "M23 9l-6 6", "M17 9l6 6"]} />,
  clock: s => <Icon size={s || 18} d={[<circle cx="12" cy="12" r="10" />, <path d="M12 6v6l4 2" />]} />,
  music: s => <Icon size={s || 14} d={["M9 18V5l12-2v13", "M9 18a3 3 0 11-6 0 3 3 0 016 0z", "M21 16a3 3 0 11-6 0 3 3 0 016 0z"]} />,
  gear: s => <Icon size={s || 18} d={[<circle cx="12" cy="12" r="3" />, <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />]} />,
  arrow: s => <Icon size={s || 14} d="M5 12h14m-7-7l7 7-7 7" />,
  restart: s => <Icon size={s || 18} d={["M1 4v6h6", "M3.51 15a9 9 0 102.13-9.36L1 10"]} />,
  save: s => <Icon size={s || 18} d={["M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z", "M17 21v-8H7v8", "M7 3v5h8"]} />,
  folder: s => <Icon size={s || 18} d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />,
  search: s => <Icon size={s || 18} d={["M11 17a6 6 0 100-12 6 6 0 000 12z", "M21 21l-4.35-4.35"]} />,
  rec: s => <Icon size={s || 18} d={[<circle cx="12" cy="12" r="10" />, <circle cx="12" cy="12" r="4" fill="currentColor" stroke="none" />]} />,
  target: s => <Icon size={s || 18} d={["M12 22a10 10 0 100-20 10 10 0 000 20z", "M12 18a6 6 0 100-12 6 6 0 000 12z", "M12 14a2 2 0 100-4 2 2 0 000 4z"]} />,
  loop: s => <Icon size={s || 16} d={["M17 1l4 4-4 4", "M3 11V9a4 4 0 014-4h14", "M7 23l-4-4 4-4", "M21 13v2a4 4 0 01-4 4H3"]} />,
  sync: s => <SyncIcon size={s || 18} />,
  fileNew: s => <Icon size={s || 18} d={["M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z", "M14 2v6h6", "M12 18v-6", "M9 15h6"]} />,
};

// ============ CONSTANTS ============
const BU = [{ id: "w", q: 4 }, { id: "h", q: 2 }, { id: "q", q: 1 }, { id: "e", q: 0.5 }, { id: "16", q: 0.25 }, { id: "32", q: 0.125 }];
const D2Q = { 1: 4, 2: 2, 4: 1, 8: 0.5, 16: 0.25, 32: 0.125 };
export const C = { bg: "#07070a", surface: "#111116", surfaceHover: "#1a1a22", border: "#25252e", text: "#eeeef0", textMuted: "#848492", downbeat: "#f0a030", accent: "#8b7cf6", sub: "#3a3a45", danger: "#ef4444", record: "#ef4444", practice: "#22c55e", glowDownbeat: "rgba(240, 160, 48, 0.4)", glowPractice: "rgba(34, 197, 94, 0.4)", glowRecord: "rgba(239, 68, 68, 0.4)" };
const mkM = () => ({ id: Date.now() + Math.random(), type: "metered", tsNum: 4, tsDen: 4, beatUnit: "q", dotted: false, tempo: 120, bars: 8, grouping: "1+1+1+1", curve: "constant", endTempo: 120, loop: false, expressive: false, beatMap: null });
const mkT = () => ({ id: Date.now() + Math.random(), type: "timed", duration: 10, markers: "" });
const SK = "tempus_profiles";
const _memStore = {};
function _getLS(k) { try { return localStorage.getItem(k); } catch { return _memStore[k] || null; } }
function _setLS(k, v) { try { localStorage.setItem(k, v); } catch { _memStore[k] = v; } }
function ldP() { try { return JSON.parse(_getLS(SK)) || []; } catch { return []; } }
function svP(p) { _setLS(SK, JSON.stringify(p)); try { const sec = JSON.parse(_getLS("tempus_sections")) || []; fbSyncDebounced(sec, p); } catch {} }

// ============ FIREBASE SILENT BACKUP ============
// TODO: Replace with your Firebase config
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

function _getCookie(k) { const m = document.cookie.match(new RegExp("(?:^|; )" + k + "=([^;]*)")); return m ? decodeURIComponent(m[1]) : null; }
function _setCookie(k, v) { const d = new Date(); d.setFullYear(d.getFullYear() + 2); document.cookie = k + "=" + encodeURIComponent(v) + ";expires=" + d.toUTCString() + ";path=/;SameSite=Lax"; }
export function getDeviceId() {
  let id = _getLS("tempus_device_id") || _getCookie("tempus_device_id");
  if (!id) { id = "t_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8); }
  _setLS("tempus_device_id", id); _setCookie("tempus_device_id", id);
  return id;
}

let _fbSyncTimer = null;
function fbSyncDebounced(sections, profiles) {
  if (!FB_ENABLED) return;
  if (_fbSyncTimer) clearTimeout(_fbSyncTimer);
  _fbSyncTimer = setTimeout(async () => {
    try {
      const db = await fbInit();
      if (!db) return;
      const { doc, setDoc } = await import("https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js");
      const deviceId = getDeviceId();
      await setDoc(doc(db, "tempus_backups", deviceId), {
        deviceId,
        sections,
        profiles: profiles || ldP(),
        settings: (() => { try { return JSON.parse(_getLS("tempus_settings")) || {}; } catch { return {}; } })(),
        videoUrl: (() => { try { return _getLS("tempus_videoUrl") || null; } catch { return null; } })(),
        videoSync: (() => { try { return JSON.parse(_getLS("tempus_videoSync")) || null; } catch { return null; } })(),
        lastUpdated: new Date().toISOString(),
        userAgent: navigator.userAgent || ""
      }, { merge: true });
    } catch {}
  }, 5000);
}

// ============ SVG NOTE ============
function NoteSVG({ type, dotted, size = 24 }) {
  const w = size, h = size * 1.6, hY = h * 0.72, hX = w * 0.38, sT = h * 0.15, sX = hX + 3.8;
  const op = type === "w" || type === "h", hs = type !== "w", uf = type === "e", bm = type === "16" ? 2 : type === "32" ? 3 : 0;
  const np = `M${hX - 4.5},${hY + 1} C${hX - 4.5},${hY + 3.5} ${hX - 1},${hY + 4} ${hX + 1.5},${hY + 2.5} C${hX + 4},${hY + 1} ${hX + 4.5},${hY - 1.5} ${hX + 4.5},${hY - 3.5} C${hX + 4.5},${hY - 6} ${hX + 1},${hY - 6.5} ${hX - 1.5},${hY - 5} C${hX - 4},${hY - 3.5} ${hX - 4.5},${hY - 1} ${hX - 4.5},${hY + 1} Z`;
  return (<svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: "block" }} aria-hidden="true">
    {op ? <path d={np} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" transform={`rotate(-15,${hX},${hY})`} /> : <path d={np} fill="currentColor" stroke="currentColor" strokeWidth={0.5} strokeLinejoin="round" strokeLinecap="round" transform={`rotate(-15,${hX},${hY})`} />}
    {hs && <line x1={sX} y1={hY} x2={sX} y2={sT} stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />}
    {uf && <path d={`M${sX},${sT} C${sX + 4},${sT + 2} ${sX + 7},${sT + 8} ${sX + 5},${sT + 14} C${sX + 5},${sT + 12} ${sX + 3},${sT + 8} ${sX},${sT + 6}`} fill="currentColor" />}
    {bm > 0 && Array.from({ length: bm }).map((_, i) => <line key={i} x1={sX} y1={sT + i * 4} x2={sX + 8} y2={sT + i * 4 + 2} stroke="currentColor" strokeWidth={2} strokeLinecap="round" />)}
    {dotted && <circle cx={hX + 8.5} cy={hY} r={1.5} fill="currentColor" />}
  </svg>);
}

// ============ UTILITIES ============
function gCD(tempo, bu, dot, den) { const t = Math.max(1, tempo || 120); const b = BU.find(x => x.id === bu); if (!b) return 0.5; let q = b.q; if (dot) q *= 1.5; return (60 / t) * ((D2Q[den] || 1) / q); }
function pG(s) { if (!s || !s.trim()) return [1]; return s.split("+").map(x => parseInt(x.trim())).filter(n => !isNaN(n) && n > 0); }
function sG(n, d) { if (d >= 8 && n % 3 === 0 && n > 3) return Array(n / 3).fill(3).join("+"); return Array(n).fill(1).join("+"); }
function gBT(g) { const t = []; g.forEach((v, gi) => { for (let i = 0; i < v; i++)t.push(gi === 0 && i === 0 ? 0 : i === 0 ? 1 : 2); }); return t; }
function pM(s) { if (!s || !s.trim()) return []; return s.split(",").map(x => parseFloat(x.trim())).filter(n => !isNaN(n) && n >= 0).sort((a, b) => a - b); }
function mkBeatMap(n, tempo) { return Array.from({ length: n }, () => ({ tempo, fermata: false, fermataHold: 0, fermataUnit: "beats" })); }

function isSafeUrl(url) { try { const u = new URL(url); return u.protocol === 'http:' || u.protocol === 'https:'; } catch { return false; } }

function getEmbedUrl(url) {
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
        // Per-beat staircase interpolation
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

// Scale sections for practice mode
function scaleSections(sections, pct) {
  return sections.map(s => {
    if (s.type === "timed") return { ...s, id: Date.now() + Math.random() };
    const ratio = pct / 100;
    const scaled = { ...s, id: Date.now() + Math.random(), tempo: Math.round(s.tempo * ratio), endTempo: Math.round(s.endTempo * ratio) };
    if (s.beatMap) scaled.beatMap = s.beatMap.map(b => ({ ...b, tempo: Math.round(b.tempo * ratio) }));
    return scaled;
  });
}

// ============ AUDIO ENGINE ============
function useMetronome() {
  const actx = useRef(null), tmr = useRef(null), nb = useRef(0), bi = useRef(0), bei = useRef(0), pl = useRef(false), tlR = useRef([]), cbR = useRef(null), sR = useRef({ accented: true, pitched: true, muted: false }), ciL = useRef(0), wl = useRef(null), sa = useRef(null), tsS = useRef(0), tsM = useRef(0), tsF = useRef(false);
  const fermS = useRef(0), fermD = useRef(0), inFerm = useRef(false);
  const init = useCallback(() => { if (!actx.current) actx.current = new (window.AudioContext || window.webkitAudioContext)(); return actx.current; }, []);
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
  useEffect(() => () => { stop(); if (actx.current) actx.current.close().catch(() => { }); }, [stop]);
  const tap = useCallback(() => { const ctx = init(); if (ctx.state === "suspended") ctx.resume(); const buf = ctx.createBuffer(1, 1, ctx.sampleRate), src = ctx.createBufferSource(); src.buffer = buf; src.connect(ctx.destination); src.start(0); if (!sa.current) { const a = document.createElement("audio"); a.setAttribute("loop", "true"); a.setAttribute("playsinline", "true"); a.src = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA="; sa.current = a; } try { sa.current.play().catch(() => {}); } catch {} return ctx; }, [init]);
  return { start, stop, setCb, pl, updS, tap };
}

// ============ STYLES ============
export const nI = { width: 62, height: 48, background: C.surface, border: `1px solid ${C.border}`, color: C.text, textAlign: "center", fontSize: 18, borderRadius: 8, fontFamily: "'DM Mono',monospace", outline: "none", margin: "0 6px" };
const sB = { width: 48, height: 48, background: C.surface, border: `1px solid ${C.border}`, color: C.textMuted, cursor: "pointer", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" };
const oB = on => ({ padding: "8px 16px", borderRadius: 8, border: `1px solid ${on ? C.downbeat : C.border}`, background: on ? C.downbeat + "15" : "transparent", color: on ? C.downbeat : C.textMuted, fontSize: 13, cursor: "pointer", fontFamily: "'Outfit',sans-serif" });

// ============ INPUTS ============
function NI({ value, onChange, min, max, style = {}, step = 1, validate }) { const [d, setD] = useState(String(value)); const drg = useRef({ on: false, active: false, stY: 0, stV: 0 }); useEffect(() => setD(String(value)), [value]); const cm = v => { const n = typeof v === "number" ? v : parseFloat(d); if (!isNaN(n) && n >= min && n <= max) { if (validate && !validate(n)) { setD(String(value)); return; } onChange(n); setD(String(n)); } else setD(String(value)); }; const pD = e => { drg.current = { on: true, active: false, stY: e.clientY, stV: value }; }; const pM = e => { if (!drg.current.on) return; const dY = drg.current.stY - e.clientY; if (!drg.current.active && Math.abs(dY) < 8) return; if (!drg.current.active) { drg.current.active = true; e.target.setPointerCapture(e.pointerId); } const nv = Math.min(max, Math.max(min, drg.current.stV + Math.round(dY / 5) * step)); setD(String(nv)); }; const pU = e => { if (drg.current.active) { drg.current.on = false; drg.current.active = false; try { e.target.releasePointerCapture(e.pointerId); } catch { } cm(parseFloat(d)); } else { drg.current.on = false; } }; return <input type="text" inputMode="decimal" value={d} onChange={e => setD(e.target.value)} onBlur={() => cm()} onKeyDown={e => { if (e.key === "Enter") { cm(); e.target.blur(); } }} onPointerDown={pD} onPointerMove={pM} onPointerUp={pU} onPointerCancel={pU} style={{ ...nI, cursor: "ns-resize", ...style }} />; }
function Stp({ value, onChange, min = 1, max = 999 }) { return (<div style={{ display: "flex", alignItems: "center" }}><button onClick={() => onChange(Math.max(min, value - 1))} style={sB}>{I.chevL(16)}</button><NI value={value} onChange={onChange} min={min} max={max} /><button onClick={() => onChange(Math.min(max, value + 1))} style={sB}>{I.chevR(16)}</button></div>); }
function StpF({ value, onChange, min = 0, max = 999, step = 0.5 }) { return (<div style={{ display: "flex", alignItems: "center" }}><button onClick={() => onChange(Math.max(min, +(value - step).toFixed(1)))} style={sB}>{I.chevL(16)}</button><NI value={value} onChange={onChange} min={min} max={max} step={step} style={{ width: 72 }} /><button onClick={() => onChange(Math.min(max, +(value + step).toFixed(1)))} style={sB}>{I.chevR(16)}</button></div>); }
function Row({ label, children }) { return (<div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}><span style={{ color: C.textMuted, fontSize: 13, fontFamily: "'Outfit',sans-serif", width: 70, flexShrink: 0, display: "flex", alignItems: "center" }}>{label}</span><div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>{children}</div></div>); }

// ============ TAP TEMPO ============
function useTapTempo(onChange) {
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

function TapBtn({ onTap, size = "sm", flash = false }) {
  const isSm = size === "sm";
  return (<button onClick={onTap} style={{ background: flash ? C.downbeat : C.surface, border: `1px solid ${C.border}`, borderRadius: isSm ? 8 : 10, padding: isSm ? "8px 12px" : "10px 16px", cursor: "pointer", color: flash ? "#000" : C.textMuted, fontFamily: "'DM Mono',monospace", fontSize: isSm ? 12 : 14, display: "flex", alignItems: "center", justifyContent: "center", userSelect: "none", transition: "background 0.1s ease, color 0.1s ease" }}>TAP</button>);
}

// ============ BEAT UNIT PICKER ============
function BUP({ beatUnit, dotted, onSelect }) { const [open, setOpen] = useState(false); const all = BU.flatMap(u => [{ ...u, dotted: false }, { ...u, dotted: true }]); return (<div style={{ position: "relative" }}><button onClick={() => setOpen(!open)} data-tip={t("secEd.beatUnit")} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 8, padding: "4px 6px", cursor: "pointer", color: C.text, display: "flex", alignItems: "center", justifyContent: "center", minWidth: 38, minHeight: 42 }}><NoteSVG type={beatUnit} dotted={dotted} size={20} /></button>{open && <><div style={{ position: "fixed", inset: 0, zIndex: 200 }} onClick={() => setOpen(false)} /><div style={{ position: "absolute", top: "100%", left: 0, zIndex: 201, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 8, marginTop: 4, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, minWidth: 120 }}>{all.map((u, i) => <button key={i} onClick={() => { onSelect(u.id, u.dotted); setOpen(false); }} style={{ background: u.id === beatUnit && u.dotted === dotted ? C.downbeat + "22" : "transparent", border: u.id === beatUnit && u.dotted === dotted ? `1px solid ${C.downbeat}` : "1px solid transparent", borderRadius: 6, padding: "6px 4px", cursor: "pointer", color: C.text, display: "flex", alignItems: "center", justifyContent: "center" }}><NoteSVG type={u.id} dotted={u.dotted} size={18} /></button>)}</div></>}</div>); }

// ============ SECTION EDITOR ============
function SecEd({ section, onSave, onClose, onDelete, appMode = "default", isNew = false, editIndex = 0 }) {
  const [s, setS] = useState({ ...section }); const upd = (k, v) => setS(p => ({ ...p, [k]: v })); const isMet = s.type === "metered";
  const { tap: tapTempo, tapFlash: secTapFlash } = useTapTempo(bpm => upd("tempo", bpm));
  const isAdv = appMode === "advanced", isBas = appMode === "basic";
  // Auto-enable expressive in advanced mode
  useEffect(() => { if (isAdv && isMet && !s.expressive) upd("expressive", true); }, [isAdv, isMet]);
  useEffect(() => { if (!isMet) return; const sum = pG(s.grouping).reduce((a, b) => a + b, 0); if (sum !== s.tsNum) upd("grouping", sG(s.tsNum, s.tsDen)); }, [s.tsNum, s.tsDen]);
  const gV = useMemo(() => { if (!isMet) return true; return pG(s.grouping).reduce((a, b) => a + b, 0) === s.tsNum; }, [s.grouping, s.tsNum, isMet]);
  useEffect(() => { if (s.curve === "accel" && s.endTempo <= s.tempo) upd("endTempo", s.tempo + 1); if (s.curve === "rit" && s.endTempo >= s.tempo) upd("endTempo", Math.max(10, s.tempo - 1)); }, [s.curve, s.tempo]);
  const sET = v => { if (s.curve === "accel") upd("endTempo", Math.max(s.tempo + 1, v)); else if (s.curve === "rit") upd("endTempo", Math.min(s.tempo - 1, Math.max(10, v))); else upd("endTempo", v); };
  const swT = t => { if (t === s.type) return; setS(p => (t === "timed" ? { ...mkT(), id: p.id } : { ...mkM(), id: p.id })); };
  // Expressive: init/update beatMap when toggled or tsNum changes
  useEffect(() => { if (s.expressive && (!s.beatMap || s.beatMap.length !== s.tsNum)) upd("beatMap", mkBeatMap(s.tsNum, s.tempo)); }, [s.expressive, s.tsNum]);
  const updBeat = (idx, k, v) => { if (!s.beatMap) return; const bm = [...s.beatMap]; bm[idx] = { ...bm[idx], [k]: v }; upd("beatMap", bm); };

  // Grouping presets
  const gPresets = useMemo(() => { const n = s.tsNum, d = s.tsDen, p = []; if (n <= 6) p.push(Array(n).fill(1).join("+")); if (n > 1 && n % 2 === 0) p.push(Array(n / 2).fill(2).join("+")); if (n >= 6 && n % 3 === 0) p.push(Array(n / 3).fill(3).join("+")); if (n === 5) { p.push("2+3", "3+2"); } if (n === 7) { p.push("2+2+3", "3+2+2", "2+3+2"); } if (n === 8 && d >= 8) { p.push("3+3+2", "3+2+3"); } return [...new Set(p)]; }, [s.tsNum, s.tsDen]);

  useEffect(() => {
    const hk = e => { if (e.key === "Enter") { e.preventDefault(); if (gV) { onSave(s); onClose(); } } };
    window.addEventListener("keydown", hk); return () => window.removeEventListener("keydown", hk);
  }, [s, gV, onSave, onClose]);

  return (
    <div className="modal-bg" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div className="modal-content" style={{ width: "100%", maxWidth: 440, background: C.bg, borderTop: `1px solid ${C.border}`, borderRadius: "16px 16px 0 0", padding: "20px 20px 32px", maxHeight: "85vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 16, color: C.text, fontWeight: 600 }}>{isNew ? t("secEd.new") : `${t("secEd.edit")} ${editIndex}`}</div>
          <button className="close-btn" onClick={onClose} data-tip-b={t("close")}>{I.x(18)}</button>
        </div>
        {/* Type toggle - hidden in basic */}
        {!isBas && <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
          <button onClick={() => swT("metered")} style={{ ...oB(isMet), display: "flex", alignItems: "center", gap: 6, flex: 1, justifyContent: "center" }}>{I.music(14)} {t("secEd.metered")}</button>
          <button onClick={() => swT("timed")} style={{ ...oB(!isMet), display: "flex", alignItems: "center", gap: 6, flex: 1, justifyContent: "center" }}>{I.clock(14)} {t("secEd.timed")}</button>
        </div>}
        {isMet ? (<>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 18 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <NI value={s.tsNum} onChange={v => upd("tsNum", v)} min={1} max={32} style={{ width: 56, height: 48, fontSize: 24, fontWeight: 700 }} />
              <div style={{ height: 1, width: 44, background: C.textMuted }} />
              <NI value={s.tsDen} onChange={v => upd("tsDen", v)} min={1} max={32} validate={v => [1, 2, 4, 8, 16, 32].includes(v)} style={{ width: 56, height: 48, fontSize: 24, fontWeight: 700 }} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1, justifyContent: "center" }}>
              <BUP beatUnit={s.beatUnit} dotted={s.dotted} onSelect={(id, d) => setS(p => ({ ...p, beatUnit: id, dotted: d }))} />
              <span style={{ color: C.textMuted, fontSize: 20, fontFamily: "'DM Mono',monospace" }}>=</span>
              <Stp value={s.tempo} onChange={v => upd("tempo", v)} min={10} max={400} />
              <TapBtn onTap={tapTempo} flash={secTapFlash} />
            </div>
          </div>
          {/* Bars + Loop */}
          <Row label={t("secEd.bars")}>
            <button onClick={() => upd("loop", !s.loop)} data-tip={t("secEd.loop")} style={{ background: s.loop ? C.downbeat + "22" : "transparent", border: `1px solid ${s.loop ? C.downbeat : C.border}`, borderRadius: 8, padding: "6px 8px", cursor: "pointer", color: s.loop ? C.downbeat : C.textMuted, display: "flex", alignItems: "center" }}>{I.loop(16)}</button>
            {!s.loop && <Stp value={s.bars} onChange={v => upd("bars", v)} min={1} max={999} />}
            {s.loop && <span style={{ color: C.downbeat, fontSize: 13, fontFamily: "'DM Mono',monospace" }}>∞</span>}
          </Row>

          {/* Grouping - pills always, number builder in advanced */}
          {!isBas && <Row label={t("secEd.grouping")}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {gPresets.map(p => <button key={p} onClick={() => upd("grouping", p)} style={{ padding: "4px 8px", borderRadius: 6, border: `1px solid ${s.grouping === p ? C.downbeat : C.border}`, background: s.grouping === p ? C.downbeat + "22" : "transparent", color: s.grouping === p ? C.downbeat : C.textMuted, fontSize: 12, fontFamily: "'DM Mono',monospace", cursor: "pointer" }}>{p}</button>)}
              </div>
              {isAdv && <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                {[1, 2, 3, 4, 5].map(n => { const cur = pG(s.grouping); const sum = cur.reduce((a, b) => a + b, 0); const canAdd = sum + n <= s.tsNum; return <button key={n} disabled={!canAdd} onClick={() => { if (!s.grouping || s.grouping.trim() === "" || sum === 0) upd("grouping", String(n)); else upd("grouping", s.grouping + "+" + n); }} style={{ width: 36, height: 36, borderRadius: 8, border: `1px solid ${C.border}`, background: canAdd ? C.surface : "transparent", color: canAdd ? C.text : C.border, fontSize: 15, fontFamily: "'DM Mono',monospace", cursor: canAdd ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center" }}>{n}</button>; })}
                <button onClick={() => { const cur = pG(s.grouping); if (cur.length > 1) { cur.pop(); upd("grouping", cur.join("+")); } else { upd("grouping", ""); } }} style={{ width: 36, height: 36, borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, color: C.textMuted, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>⌫</button>
              </div>}
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 14, color: gV ? C.text : C.danger }}>{s.grouping || "—"}</span>
                {!gV && <span style={{ color: C.danger, fontSize: 12 }}>({pG(s.grouping).reduce((a, b) => a + b, 0)}/{s.tsNum})</span>}
                {gV && <span style={{ color: C.practice, fontSize: 11 }}>✓</span>}
              </div>
            </div>
          </Row>}

          {/* Curve - hidden in basic */}
          {!isBas && <Row label={t("secEd.curve")}>{["constant", "accel", "rit"].map(c => <button key={c} onClick={() => upd("curve", c)} style={{ padding: "8px 14px", borderRadius: 8, border: `1px solid ${s.curve === c ? C.downbeat : C.border}`, background: s.curve === c ? C.downbeat + "22" : "transparent", color: s.curve === c ? C.downbeat : C.textMuted, fontSize: 13, fontFamily: "'Outfit',sans-serif", cursor: "pointer" }}>{c === "constant" ? "—" : c === "accel" ? "accel." : "rit."}</button>)}</Row>}
          {!isBas && s.curve !== "constant" && <Row label={I.arrow(14)}><div style={{ display: "flex", alignItems: "center", gap: 8 }}><div style={{ color: C.text, display: "flex", alignItems: "center", minWidth: 30 }}><NoteSVG type={s.beatUnit} dotted={s.dotted} size={18} /></div><span style={{ color: C.textMuted, fontSize: 18, fontFamily: "'DM Mono',monospace" }}>=</span><Stp value={s.endTempo} onChange={sET} min={10} max={400} /></div></Row>}

          {/* Expressive - advanced only */}
          {isAdv && <Row label={t("secEd.expressive")}>
            <button onClick={() => upd("expressive", !s.expressive)} style={{ background: s.expressive ? C.accent + "22" : "transparent", border: `1px solid ${s.expressive ? C.accent : C.border}`, borderRadius: 8, padding: "6px 12px", cursor: "pointer", color: s.expressive ? C.accent : C.textMuted, fontSize: 12, fontFamily: "'Outfit',sans-serif" }}>{s.expressive ? t("secEd.on") : t("secEd.off")}</button>
          </Row>}
          {isAdv && s.expressive && s.beatMap && <div style={{ marginBottom: 14, padding: 12, background: C.surface, borderRadius: 10, border: `1px solid ${C.accent}33` }}>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {s.beatMap.map((b, idx) => (
                <div key={idx} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, minWidth: 56, marginBottom: 6 }}>
                  <div style={{ fontSize: 10, color: C.textMuted, fontFamily: "'DM Mono',monospace" }}>{idx + 1}</div>
                  <NI value={b.tempo} onChange={v => updBeat(idx, "tempo", v)} min={10} max={400} step={1} style={{ width: 52, height: 36, fontSize: 14 }} />
                  <button onClick={() => updBeat(idx, "fermata", !b.fermata)} data-tip={t("secEd.fermata")} style={{ background: b.fermata ? C.downbeat + "22" : "transparent", border: `1px solid ${b.fermata ? C.downbeat : C.border}`, borderRadius: 6, padding: "2px 6px", cursor: "pointer", color: b.fermata ? C.downbeat : C.textMuted, fontSize: 14 }}>𝄐</button>
                  {b.fermata && <>
                    <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <NI value={b.fermataHold} onChange={v => updBeat(idx, "fermataHold", v)} min={0} max={16} step={0.5} style={{ width: 40, height: 24, fontSize: 11 }} />
                      <span style={{ color: C.textMuted + "55", fontSize: 9, fontFamily: "'DM Mono',monospace" }}>{b.fermataUnit || "beats"}</span>
                    </div>
                    <button onClick={() => updBeat(idx, "fermataUnit", (b.fermataUnit || "beats") === "beats" ? "sec" : "beats")} style={{ background: "transparent", border: `1px solid ${C.border}`, borderRadius: 4, padding: "1px 4px", cursor: "pointer", color: C.textMuted, fontSize: 8, fontFamily: "'DM Mono',monospace" }}>{(b.fermataUnit || "beats") === "beats" ? "→sec" : "→beats"}</button>
                  </>}
                </div>
              ))}
            </div>
          </div>}
        </>) : (<>
          <Row label={t("secEd.duration")}><StpF value={s.duration} onChange={v => upd("duration", v)} min={0.5} max={600} /><span style={{ color: C.textMuted, fontSize: 15, fontFamily: "'DM Mono',monospace", marginLeft: 6 }}>s</span></Row>
          <Row label={t("secEd.markers")}><input inputMode="decimal" value={s.markers} onChange={e => upd("markers", e.target.value)} style={{ ...nI, width: 200, textAlign: "left", padding: "0 12px", fontSize: 14 }} placeholder={t("secEd.markersPlaceholder")} /></Row>
          <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 14, marginLeft: 82, fontFamily: "'DM Mono',monospace" }}>{pM(s.markers).length} {tp("unit.cue", pM(s.markers).length)}</div>
        </>)}
        <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
          {onDelete && <button onClick={() => { onDelete(s.id); onClose(); }} data-tip={t("secEd.delete")} style={{ flex: 0, padding: "10px 16px", borderRadius: 8, border: `1px solid ${C.danger}33`, background: `${C.danger}11`, color: C.danger, cursor: "pointer", display: "flex", alignItems: "center" }}>{I.trash(16)}</button>}
          <button onClick={() => { onSave({ ...s, id: Date.now() + Math.random(), type: s.type }, true); onClose(); }} data-tip={t("secEd.duplicate")} style={{ flex: 0, padding: "10px 16px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, color: C.text, cursor: "pointer", display: "flex", alignItems: "center" }}>{I.copy(16)}</button>
          <div style={{ flex: 1 }} />
          <button onClick={() => { if (gV) { onSave(s); onClose(); } }} style={{ flex: 0, padding: "12px 24px", borderRadius: 8, border: "none", background: gV ? C.downbeat : C.sub, color: gV ? "#000" : C.textMuted, fontSize: 14, fontWeight: 600, cursor: gV ? "pointer" : "default", fontFamily: "'Outfit',sans-serif", whiteSpace: "nowrap" }}>{isNew ? t("secEd.add") : t("secEd.save")}</button>
        </div>
      </div>
    </div>);
}

// ============ SECTION CARD ============
const SecCard = React.forwardRef(function SecCard({ section: s, index: i, total: t, onClick, onStartHere, onMove, onDelete, onDragStart, onDragEnter, onDragOver, onDragEnd, onDrop, dragIdx, dropIdx, onGripTouchStart, cancelTouchDrag, tDrag, tDropIdx }, ref) {
  const isT = s.type === "timed";
  const isTouch = typeof window !== "undefined" && window.matchMedia?.("(pointer: coarse)")?.matches;
  const [revealed, setRevealed] = useState(false);
  const [showReorder, setShowReorder] = useState(false);
  const [swX, setSwX] = useState(0);
  const swRef = useRef({ startX: 0, swiping: false });
  const isDragged = tDrag && tDrag.idx === i;
  const onTouchStart = e => { if (e.target.closest && e.target.closest("button")) return; if (tDrag) return; swRef.current = { startX: e.touches[0].clientX, swiping: true }; };
  const onTouchMove = e => { if (tDrag) return; if (!swRef.current.swiping) return; const dx = e.touches[0].clientX - swRef.current.startX; if (revealed) { setSwX(Math.min(0, Math.max(-80, dx - 80))); } else { setSwX(Math.min(0, dx)); } };
  const onTouchEnd = () => { if (tDrag) return; if (!swRef.current.swiping) return; swRef.current.swiping = false; if (swX < -40) { setSwX(-80); setRevealed(true); } else { setSwX(0); setRevealed(false); } };
  const handleCardClick = () => { if (tDrag) return; if (revealed) { setSwX(0); setRevealed(false); } else if (showReorder) { setShowReorder(false); } else { onClick(); } };
  const handleDelete = e => { e.stopPropagation(); if (onDelete) onDelete(s.id); };
  // Calculate shift for non-dragged cards during touch drag
  let shiftY = 0;
  if (tDrag && !isDragged && tDropIdx !== null) {
    const from = tDrag.idx, to = tDropIdx;
    const cardH = tDrag.positions?.[tDrag.idx]?.height || 60;
    if (from < to && i > from && i <= to) shiftY = -(cardH + 6);
    else if (from > to && i < from && i >= to) shiftY = cardH + 6;
  }
  return (<div ref={ref} style={{ position: "relative", overflow: isDragged ? "visible" : "hidden", borderRadius: 10 }}>
    {(revealed || swX < 0) && <div onClick={handleDelete} data-tip="Delete" style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 80, background: C.danger, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "0 10px 10px 0", cursor: "pointer", color: "#fff" }}>{I.trash(20)}</div>}
    <div className="sec-card" draggable={!isTouch} onDragStart={!isTouch && onDragStart ? e => onDragStart(e, i) : undefined} onDragEnter={!isTouch && onDragEnter ? e => onDragEnter(e, i) : undefined} onDragOver={!isTouch ? onDragOver : undefined} onDragEnd={!isTouch ? onDragEnd : undefined} onDrop={!isTouch && onDrop ? e => onDrop(e, i) : undefined} onClick={handleCardClick} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd} style={{ background: C.surface, borderRadius: 10, padding: "12px 14px", border: `1px solid ${(tDropIdx === i && tDrag && tDrag.idx !== i) ? C.accent : dropIdx === i ? C.accent : (s.capturedDuration ? C.record + "44" : C.border)}`, cursor: "pointer", display: "flex", alignItems: "center", gap: 12, transform: isDragged ? `translateY(${tDrag.offsetY}px)` : `translateX(${swX}px) translateY(${shiftY}px)`, transition: isDragged ? "box-shadow 0.2s" : (swRef.current.swiping ? "none" : "transform 0.25s ease, border 0.15s"), position: "relative", zIndex: isDragged ? 10 : 1, opacity: dragIdx === i ? 0.5 : 1, boxShadow: isDragged ? "0 8px 30px rgba(0,0,0,0.5)" : undefined }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 24, alignItems: "center" }}>
        {isTouch && !showReorder ? (
          <button onTouchStart={e => { e.stopPropagation(); onGripTouchStart(i, e); }} onTouchEnd={e => { e.stopPropagation(); if (!tDrag) cancelTouchDrag(); }} onTouchMove={e => { if (!tDrag) cancelTouchDrag(); }} onClick={e => { e.stopPropagation(); if (!tDrag) setShowReorder(true); }} style={{ background: "none", border: "none", color: C.textMuted, cursor: "pointer", padding: 4, display: "flex", flexDirection: "column", gap: 1, touchAction: "none" }}>
            <span style={{ fontSize: 14, lineHeight: 1, letterSpacing: 2 }}>☰</span>
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: C.textMuted, lineHeight: 1 }}>{i + 1}</span>
          </button>
        ) : (
          <>
            <button disabled={i === 0} onClick={e => { e.stopPropagation(); onMove(-1); }} data-tip-b="Up" style={{ background: "none", border: "none", color: i === 0 ? C.border : C.textMuted, cursor: i === 0 ? "default" : "pointer", padding: 2, display: "flex" }}>{I.arrowUp(14)}</button>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: C.textMuted, textAlign: "center", lineHeight: 1 }}>{i + 1}</div>
            <button disabled={i === t - 1} onClick={e => { e.stopPropagation(); onMove(1); }} data-tip-b="Down" style={{ background: "none", border: "none", color: i === t - 1 ? C.border : C.textMuted, cursor: i === t - 1 ? "default" : "pointer", padding: 2, display: "flex" }}>{I.arrowDown(14)}</button>
          </>
        )}
      </div>
      {isT ? (<>{I.clock(16)}<div style={{ flex: 1, fontFamily: "'DM Mono',monospace", fontSize: 15, color: C.text }}>{s.duration}s</div><div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: C.textMuted }}>{pM(s.markers).length} cue{pM(s.markers).length !== 1 ? "s" : ""}</div></>) : (<>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 18, fontWeight: 700, color: C.text, lineHeight: 1, textAlign: "center", minWidth: 30, display: "flex", flexDirection: "column", alignItems: "center" }}><span>{s.tsNum}</span><div style={{ height: 1, width: "100%", background: C.textMuted, margin: "1px 0" }} /><span>{s.tsDen}</span><div style={{ fontSize: 9, color: C.textMuted, fontWeight: 400, marginTop: 3 }}>{s.grouping}</div></div>
        <div style={{ display: "flex", alignItems: "center", gap: 3, color: C.text, flex: 1 }}><NoteSVG type={s.beatUnit} dotted={s.dotted} size={16} /><span style={{ fontFamily: "'DM Mono',monospace", fontSize: 13, color: C.textMuted }}>=</span><span style={{ fontFamily: "'DM Mono',monospace", fontSize: 15 }}>{s.tempo}</span>{s.curve !== "constant" && <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: C.accent, marginLeft: 4 }}>{s.curve === "accel" ? "→" : "←"}{s.endTempo}</span>}</div>
        <div style={{ textAlign: "right" }}><div style={{ fontFamily: "'DM Mono',monospace", fontSize: 14, color: s.loop ? C.downbeat : C.text }}>{s.loop ? "∞" : `${s.bars} bar${s.bars !== 1 ? "s" : ""}`}</div></div>
      </>)}
      <button onClick={e => { e.stopPropagation(); onStartHere(); }} data-tip-b="Play here" style={{ background: "none", border: "none", color: C.textMuted, cursor: "pointer", padding: 4, display: "flex" }}>{I.play(14)}</button>
    </div></div>);
});

// ============ PLAY VIEW ============
function PlayView({ ps, sections, tl, onPause, onResume, onRestart, onGoToBar, onPrevSec, onNextSec, vis, isP, muted, onMute, onExit, mode, onSplit, onTapTempo, tapBpm, tapFlash, settings, onSettings, syncLocked }) {
  const SYNC_COLOR = "#06b6d4";
  const { absoluteBar: ab, beatIndex: bei, beatType: bt, tsNum: tsN, tsDen: tsD, sectionIndex: si, flash, isTimed: isT, countIn: isCI, ended: isEnded } = ps;
  const fc = bt === 0 ? C.downbeat : bt === 1 ? C.accent : C.text, fo = flash ? (bt === 0 ? 0.35 : bt === 1 ? 0.2 : 0.08) : 0;
  const [goBar, setGoBar] = useState("");
  const [splitMsg, setSplitMsg] = useState(null);
  const splitMsgTimer = useRef(null);
  const mountReady = useRef(false);
  useEffect(() => { const t = setTimeout(() => { mountReady.current = true; }, 600); return () => clearTimeout(t); }, []);
  const lastAction = useRef(0);
  const guardedAction = fn => () => { const now = Date.now(); if (!mountReady.current || now - lastAction.current < 250) return; lastAction.current = now; fn(); };
  useEffect(() => () => { if (splitMsgTimer.current) clearTimeout(splitMsgTimer.current); }, []);
  const showF = vis === "flash" || vis === "dots+flash", showD = vis === "dots" || vis === "dots+flash";
  const borderColor = mode === "record" ? C.record : mode === "practice" ? C.practice : mode === "sync" ? SYNC_COLOR : null;
  const nxt = sections[si + 1]; let upN = null;
  if (nxt && !isCI) { if (isT) { if (ps.remaining != null && ps.remaining <= 10) upN = nxt.type === "timed" ? `${nxt.duration}s Free` : `${nxt.tsNum}/${nxt.tsDen} at ${nxt.tempo}`; } else { const bis = tl.filter(b => b.si === si); if (bis.length > 0 && bis[bis.length - 1].ab - ab <= 1) upN = nxt.type === "timed" ? `${nxt.duration}s Free` : `${nxt.tsNum}/${nxt.tsDen} at ${nxt.tempo}`; } }
  const isRec = mode === "record";

  const handleTap = e => { if (isRec && onSplit) { const t = e.target; if (t.closest && (t.closest("button") || t.closest("input"))) return; onSplit(ab); setSplitMsg(`Marked bar ${ab}`); if (splitMsgTimer.current) clearTimeout(splitMsgTimer.current); splitMsgTimer.current = setTimeout(() => setSplitMsg(null), 1200); } };

  const cR = 120, cC = 2 * Math.PI * cR; let prg = 0;
  if (isEnded) prg = 1;
  else if (isCI) prg = tsN > 0 ? (bei + 1) / tsN : 0;
  else if (isT && ps.remaining != null) prg = 1 - (ps.remaining / (sections[si]?.duration || 1));
  else if (!isT) { const bs = tl.filter(b => b.si === si); if (bs.length) { const t = bs.length, c = ab - bs[0].ab, bp = bei / Math.max(1, tsN); prg = (c + bp) / t; } }
  const sDo = cC - (prg * cC);
  const showNav = !isP || isEnded;

  return (
    <div onClick={handleTap} style={{ position: "fixed", inset: 0, background: C.bg, zIndex: 50, fontFamily: "'DM Mono',monospace", boxShadow: borderColor ? `inset 0 0 0 4px ${borderColor}, inset 0 0 30px ${borderColor}44` : undefined }}>
      {showF && flash && <div style={{ position: "absolute", inset: 0, background: fc, opacity: fo, transition: "opacity 0.05s", pointerEvents: "none" }} />}
      {splitMsg && <div style={{ position: "absolute", inset: 0, background: C.record, opacity: 0.15, pointerEvents: "none", transition: "opacity 0.3s" }} />}

      {/* TOP BAR */}
      <div style={{ position: "absolute", top: 16, left: 16, right: 16, display: "flex", justifyContent: "space-between", zIndex: 2 }}>
        <button onClick={onMute} data-tip-b={muted ? t("play.unmute") : t("play.mute")} style={tS}>{muted ? I.volOff(18) : I.volOn(18)}</button>
        <div style={{ display: "flex", gap: 8 }}>
          {isRec && <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: C.record, display: "flex", alignItems: "center", gap: 4, animation: "pulse 2s infinite" }}>{I.rec(12)} {t("play.rec")}</div>}
          {mode === "practice" && ps.pctLabel && !isEnded && <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 13, color: C.practice, fontWeight: 600 }}>{ps.pctLabel}</div>}
          <button onClick={onExit} data-tip-b={t("play.exit")} style={tS}>{I.x(18)}</button>
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
            {isEnded ? "" : isCI ? <><span style={{ fontSize: 14 }}>{t("play.countIn")}</span><span style={{ fontSize: 14, color: C.downbeat, fontWeight: 600 }}>{t("play.bar")} {ab}</span></> : isT ? <span style={{ display: "flex", alignItems: "center", gap: 6 }}>{I.clock(18)} {t("play.free")}</span> : (<><span>{tsN}</span><div style={{ height: 1, width: 30, background: C.textMuted, margin: "2px 0" }} /><span>{tsD}</span></>)}
          </div>
          <div className={`hdr-text ${ps.flash && ps.beatType === 0 ? 'pump' : ''}`} style={{ fontFamily: "'Bebas Neue','DM Mono',monospace", fontSize: isEnded ? 80 : 110, fontWeight: 400, color: isEnded ? C.downbeat : C.text, lineHeight: 1, position: "relative", zIndex: 1, letterSpacing: 2 }}>
            {isEnded ? t("play.end") : isCI ? "—" : ps.fermata ? (<><span style={{ fontSize: 24, position: "absolute", top: -10 }}>𝄐</span>{ps.fermataRem != null ? ps.fermataRem.toFixed(1) : "—"}</>) : isT ? (ps.remaining != null ? ps.remaining.toFixed(1) : "—") : ab}
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
            {upN && <div style={{ color: C.downbeat, fontSize: 13, fontWeight: 600, animation: "pulse 2s infinite" }}>{t("play.upNext")} {upN}</div>}
          </>}
        </div>
        <div style={{ height: 24, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 4 }}>
          {showD && !isT && !isCI && !isEnded && <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", maxWidth: 280 }}>{(ps.allBeatTypes || []).map((b, i) => { const on = i === bei, c = b === 0 ? C.downbeat : b === 1 ? C.accent : C.sub; return <div key={i} style={{ width: on ? 16 : 10, height: on ? 16 : 10, borderRadius: "50%", background: on ? c : `${c}55`, transition: "all 0.1s cubic-bezier(0.34, 1.56, 0.64, 1)", border: on ? `2px solid ${c}` : "2px solid transparent", transform: on ? "scale(1.1)" : "scale(1)", boxShadow: on ? `0 0 10px ${c}66` : "none" }} />; })}</div>}
          {showD && isT && !isEnded && ps.totalMarkers > 0 && <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", maxWidth: 280 }}>{Array.from({ length: ps.totalMarkers }).map((_, i) => { const on = i === ps.markerIdx, past = i < (ps.markerIdx || 0); return <div key={i} style={{ width: on ? 16 : 10, height: on ? 16 : 10, borderRadius: "50%", background: on ? C.downbeat : past ? `${C.downbeat}88` : `${C.sub}55`, transition: "all 0.1s cubic-bezier(0.34, 1.56, 0.64, 1)", border: on ? `2px solid ${C.downbeat}` : "2px solid transparent", transform: on ? "scale(1.1)" : "scale(1)", boxShadow: on ? `0 0 10px ${C.downbeat}66` : "none" }} />; })}</div>}
        </div>
        {/* Record hint - reserved height */}
        <div style={{ height: 20, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 4 }}>
          {isRec && isP && !isEnded && <span style={{ fontSize: 12, color: C.textMuted, fontFamily: "'Outfit',sans-serif", opacity: 0.8, animation: "pulse 3s infinite" }}>{t("play.tapToMark")}</span>}
        </div>
      </div>

      {/* BOTTOM CONTROLS - fixed */}
      {syncLocked ? (
        <div style={{ position: "absolute", bottom: 24, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, zIndex: 2 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 20, background: SYNC_COLOR + "15", border: `1px solid ${SYNC_COLOR}33` }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: SYNC_COLOR, boxShadow: `0 0 6px ${SYNC_COLOR}` }} />
            <span style={{ fontSize: 11, color: SYNC_COLOR, fontFamily: "'Outfit',sans-serif", fontWeight: 600 }}>{t("play.synced")}</span>
          </div>
        </div>
      ) : (
      <div style={{ position: "absolute", bottom: 24, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 12, zIndex: 2, pointerEvents: "none" }}>
        {/* Nav row - visibility hidden during play */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, visibility: showNav ? "visible" : "hidden", pointerEvents: showNav ? "auto" : "none", opacity: showNav ? 1 : 0, transition: "opacity 0.15s" }}>
          <button onClick={onPrevSec} data-tip={t("play.previous")} style={nv}>{I.chevL(18)}</button>
          <input type="text" inputMode="numeric" value={goBar} onChange={e => setGoBar(e.target.value)} placeholder={t("play.barHash")} style={{ ...nI, width: 64, fontSize: 14 }} onKeyDown={e => { if (e.key === "Enter") { const v = parseInt(goBar); if (!isNaN(v) && v > 0) { onGoToBar(v); } } }} />
          <button onClick={onNextSec} data-tip={t("play.next")} style={nv}>{I.chevR(18)}</button>
        </div>
        {/* Quick settings */}
        {settings && onSettings && <div style={{ display: "flex", gap: 6, justifyContent: "center", pointerEvents: "auto" }}>
          <button onClick={() => onSettings({ ...settings, accented: !settings.accented })} style={qS}>{settings.accented ? t("play.accent") : t("play.flat")}</button>
          <button onClick={() => onSettings({ ...settings, pitched: !settings.pitched })} style={qS}>{settings.pitched ? t("play.pitch") : t("play.noise")}</button>
          <button onClick={() => { const m = ["dots", "dots+flash", "flash"]; const i = (m.indexOf(settings.visualMode) + 1) % m.length; onSettings({ ...settings, visualMode: m[i] }); }} style={qS}><span style={{ opacity: settings.visualMode.includes("dots") ? 1 : 0.25 }}>●</span> <span style={{ opacity: settings.visualMode.includes("flash") ? 1 : 0.25 }}>◻</span></button>
          <button onClick={() => onSettings({ ...settings, countIn: (settings.countIn + 1) % 3 })} style={qS}>{settings.countIn === 0 ? t("play.noCountIn") : settings.countIn === 1 ? t("play.1countIn") : t("play.2countIn")}</button>
        </div>}
        {/* Transport */}
        <div style={{ display: "flex", gap: 16, alignItems: "center", pointerEvents: "auto" }}>
          <div style={{ width: 44, display: "flex", justifyContent: "center" }}>
            {showNav && <button onClick={onRestart} data-tip={t("play.restart")} style={tS}>{I.restart(18)}</button>}
          </div>
          <button onClick={guardedAction(() => { const v = parseInt(goBar); if (isP) { onPause(); } else { onResume(!isNaN(v) && v > 0 ? v : null); setGoBar(""); } })} data-tip={isP ? t("play.pause") : t("toolbar.play")} style={tB}>{isP ? I.pause(22) : I.play(22)}</button>
          <div style={{ width: 44, display: "flex", justifyContent: "center" }}>
            {mode === "normal" && onTapTempo ? <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, width: 44 }}>
              {tapBpm && <span style={{ fontSize: 10, color: C.downbeat, fontFamily: "'DM Mono',monospace", fontWeight: 600 }}>{tapBpm}</span>}
              <button onClick={onTapTempo} style={{ ...tS, background: tapFlash ? C.downbeat : C.surface, color: tapFlash ? "#000" : C.text, transition: "background 0.15s, color 0.15s" }}><span style={{ fontSize: 11, fontFamily: "'DM Mono',monospace" }}>{t("play.tap")}</span></button>
            </div> : null}
          </div>
        </div>
      </div>)}
    </div>);
}
const nv = { padding: "8px 14px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, color: C.text, cursor: "pointer", fontFamily: "'DM Mono',monospace", display: "flex", alignItems: "center", justifyContent: "center" };
const tB = { width: 56, height: 56, borderRadius: "50%", border: "none", background: C.downbeat, color: "#000", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 24px ${C.downbeat}33` };
const tS = { width: 44, height: 44, borderRadius: 10, border: `1px solid ${C.border}`, background: C.surface, color: C.text, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" };
const qS = { padding: "4px 10px", borderRadius: 6, border: `1px solid ${C.border}`, background: "transparent", color: C.textMuted, cursor: "pointer", fontSize: 10, fontFamily: "'DM Mono',monospace", whiteSpace: "nowrap" };

// ============ VIDEO VIEW ============
function fmtTime(s) { if (s == null) return "--:--.-"; const m = Math.floor(s / 60), sec = s % 60; return `${m}:${sec < 10 ? "0" : ""}${sec.toFixed(1)}`; }

function VideoView({ videoUrl, sections, tl, onClose, onSyncPoints, met, settings, muted, onUpdateSections, videoSync: initSync, onEditSection, onAddSection, onDeleteSection, onMoveSection, loadedProfileId }) {
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
  const [syncCountIn, setSyncCountIn] = useState(false); // true during count-in
  const syncCbRef = useRef(null);
  const [vidCountIn, setVidCountIn] = useState(settings.countIn || 1); // 0, 1, 2 bars
  const [showVidSave, setShowVidSave] = useState(false);
  // Refs for YouTube callback (avoids stale closures)
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
          // First beat after count-in → start video
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
      // Adapt Vimeo API to match our interface
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
      // Create iframe for SC widget
      const iframe = document.createElement("iframe");
      iframe.src = `https://w.soundcloud.com/player/?url=${encodeURIComponent(videoUrl)}&color=%23f0a030&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false&visual=true`;
      iframe.style.cssText = "position:absolute;top:0;left:0;width:100%;height:100%;border:none;";
      iframe.allow = "autoplay";
      containerRef.current.innerHTML = "";
      containerRef.current.appendChild(iframe);
      const widget = window.SC.Widget(iframe);
      playerRef.current = widget;
      // Adapt SC Widget API to match our interface
      widget.playVideo = () => widget.play();
      widget.pauseVideo = () => widget.pause();
      const scSeek = widget.seekTo.bind(widget);
      widget.seekTo = (t) => scSeek(t * 1000); // SC uses milliseconds
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

  // Shared video state change handler (two-way sync)
  const handleVidStateChange = (isPlay, isPause) => {
    try {
      const m = metRef.current, t = tlRef.current, st = settingsRef.current;
      if (!m || !t) return;
      if (isPlay && !syncActiveRef.current && !countingInRef.current && t.length > 0) {
        m.setCb(syncCbRef.current); m.tap();
        const bar = syncBarRef.current;
        const fromBar = bar ? t.findIndex(b => b.ab === bar.ab) : 0;
        m.start(t, Math.max(0, fromBar >= 0 ? fromBar : 0), 0, { accented: st.accented, pitched: st.pitched, muted: mutedRef.current });
        setSyncActive(true); syncActiveRef.current = true; setSyncEnded(false);
      } else if (isPause && syncActiveRef.current && !countingInRef.current) {
        m.stop(); setSyncActive(false); syncActiveRef.current = false;
        setSyncBar(null); syncBarRef.current = null;
      }
    } catch {}
  };

  // Poll time (YouTube only — Vimeo uses timeupdate event)
  useEffect(() => {
    if (!isYT) return;
    if (vidPlaying && playerRef.current) {
      pollRef.current = setInterval(() => { try { const t = playerRef.current.getCurrentTime(); if (typeof t === "number") setCurrentTime(t); } catch {} }, 100);
    } else { if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; } }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [vidPlaying, isYT]);

  const seekTo = useCallback(t => { try { if (playerRef.current?.seekTo) { playerRef.current.seekTo(t, true); setCurrentTime(t); } else if (playerRef.current?.setCurrentTime) { playerRef.current.setCurrentTime(t); setCurrentTime(t); } } catch {} }, []);

  // Calculate elapsed time to a given bar index from tl
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

  // Seek video to match metronome position
  const seekVideoToBar = useCallback((barIdx) => {
    if (!playerRef.current?.seekTo) return;
    const elapsed = getElapsedToBar(tl, barIdx);
    const videoTime = (startPt || 0) + elapsed;
    playerRef.current.seekTo(videoTime, true);
    setCurrentTime(videoTime);
  }, [tl, startPt, getElapsedToBar]);

  // Sync play from start (restart) — count-in then video
  const syncPlayFromStart = () => {
    if (!hasSync || !tl.length) return;
    met.setCb(syncCbRef.current);
    seekTo(startPt || 0);
    setSyncBar(null); syncBarRef.current = null;
    countingInRef.current = vidCountIn > 0;
    setSyncCountIn(vidCountIn > 0);
    setTimeout(() => {
      // Don't start video yet — callback will start it after count-in
      if (vidCountIn === 0 && playerRef.current) playerRef.current.playVideo();
      met.tap(); met.start(tl, 0, vidCountIn, { accented: settings.accented, pitched: settings.pitched, muted });
      setSyncActive(true); syncActiveRef.current = true; setSyncEnded(false);
    }, 200);
  };

  // Toggle play/pause — Fix 2: clear syncBar on pause so sections reappear
  const syncToggle = () => {
    if (syncActive) {
      if (playerRef.current) playerRef.current.pauseVideo();
      met.stop(); setSyncActive(false); syncActiveRef.current = false;
      setSyncBar(null); syncBarRef.current = null;
      countingInRef.current = false; setSyncCountIn(false);
    } else {
      if (!tl.length) return;
      met.setCb(syncCbRef.current);
      // Fix 1: seek video to match bar position
      const fromBar = syncBar ? tl.findIndex(b => b.ab === syncBar.ab) : 0;
      const idx = Math.max(0, fromBar >= 0 ? fromBar : 0);
      seekVideoToBar(idx);
      const useCI = vidCountIn > 0;
      countingInRef.current = useCI;
      setSyncCountIn(useCI);
      setTimeout(() => {
        // Don't start video yet if counting in — callback will start it after count-in
        if (!useCI && playerRef.current) playerRef.current.playVideo();
        met.tap(); met.start(tl, idx, vidCountIn, { accented: settings.accented, pitched: settings.pitched, muted });
        setSyncActive(true); syncActiveRef.current = true; setSyncEnded(false);
      }, 150);
    }
  };

  // Section navigation — Fix 1: seek video to match section start
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

  // Set points
  const setStart = () => setStartPt(currentTime);
  const setEnd = () => setEndPt(currentTime);
  const NUDGE = 0.05;
  const nudge = (which, delta) => {
    if (which === "start") { const v = Math.max(0, (startPt || 0) + delta); setStartPt(v); seekTo(v); }
    else { const v = Math.max(0, (endPt || 0) + delta); setEndPt(v); seekTo(v); }
  };
  const handleSave = () => { if (onSyncPoints) onSyncPoints({ start: startPt, end: endPt }); };

  // Tempo adjust
  const adjustTempo = delta => {
    if (!syncBar || !onUpdateSections) return;
    const si = syncBar.si;
    onUpdateSections(prev => prev.map((s, i) => i === si && s.type === "metered" ? { ...s, tempo: Math.max(10, Math.min(400, s.tempo + delta)) } : s));
  };

  useEffect(() => () => { met.stop(); met.setCb(null); }, [met]);
  const curSec = syncBar != null ? sections[syncBar.si] : null;

  // Edit mode
  const [editMode, setEditMode] = useState(false);
  const [goBar, setGoBar] = useState("");

  // TAP tempo for video sync
  const { tap: vidTap, tapBpm: vidTapBpm, tapFlash: vidTapFlash } = useTapTempo(useCallback(bpm => {
    if (!syncBar || !onUpdateSections) return;
    const si = syncBar.si;
    onUpdateSections(prev => prev.map((s, i) => i === si && s.type === "metered" ? { ...s, tempo: bpm } : s));
  }, [syncBar, onUpdateSections]));

  // Go to bar
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
          {(startPt != null || endPt != null) && <button onClick={handleSave} style={{ padding: "3px 8px", borderRadius: 6, border: `1px solid ${C.downbeat}55`, background: C.downbeat + "15", color: C.downbeat, fontSize: 10, cursor: "pointer" }}>{t("video.sync")}</button>}
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
              : <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>{isSafeUrl(videoUrl) ? <a href={videoUrl} target="_blank" rel="noopener noreferrer" style={{ color: C.accent, fontSize: 11 }}>{t("video.openInBrowser")}</a> : <span style={{ color: C.danger, fontSize: 11 }}>{t("video.invalidUrl")}</span>}</div>}
        </div>
      </div>

      {/* Start / End — side by side */}
      {hasSync && <div style={{ display: "flex", gap: 6, padding: "0 12px", marginBottom: 6, flexShrink: 0 }}>
        {/* Start */}
        <div style={{ flex: 1, background: C.surface, borderRadius: 8, padding: "6px 8px", border: `1px solid ${startPt != null ? C.practice + "44" : C.border}` }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: startPt != null ? 4 : 0 }}>
            <span style={{ fontSize: 9, color: C.practice, fontWeight: 600 }}>{t("video.start")}</span>
            <button onClick={setStart} style={{ padding: "2px 6px", borderRadius: 4, border: `1px solid ${C.practice}44`, background: "transparent", color: C.practice, fontSize: 9, cursor: "pointer" }}>{t("video.set")}</button>
          </div>
          {startPt != null && <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
            <button onClick={() => nudge("start", -NUDGE)} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 4, color: C.textMuted, cursor: "pointer", padding: "1px 4px", fontSize: 10 }}>←</button>
            <div style={{ fontSize: 12, color: C.text, flex: 1, textAlign: "center", cursor: "pointer" }} onClick={() => seekTo(startPt)}>{fmtTime(startPt)}</div>
            <button onClick={() => nudge("start", NUDGE)} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 4, color: C.textMuted, cursor: "pointer", padding: "1px 4px", fontSize: 10 }}>→</button>
          </div>}
        </div>
        {/* End */}
        <div style={{ flex: 1, background: C.surface, borderRadius: 8, padding: "6px 8px", border: `1px solid ${endPt != null ? C.record + "44" : C.border}` }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: endPt != null ? 4 : 0 }}>
            <span style={{ fontSize: 9, color: C.record, fontWeight: 600 }}>{t("video.end")}</span>
            <button onClick={setEnd} style={{ padding: "2px 6px", borderRadius: 4, border: `1px solid ${C.record}44`, background: "transparent", color: C.record, fontSize: 9, cursor: "pointer" }}>{t("video.set")}</button>
          </div>
          {endPt != null && <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
            <button onClick={() => nudge("end", -NUDGE)} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 4, color: C.textMuted, cursor: "pointer", padding: "1px 4px", fontSize: 10 }}>←</button>
            <div style={{ fontSize: 12, color: C.text, flex: 1, textAlign: "center", cursor: "pointer" }} onClick={() => seekTo(endPt)}>{fmtTime(endPt)}</div>
            <button onClick={() => nudge("end", NUDGE)} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 4, color: C.textMuted, cursor: "pointer", padding: "1px 4px", fontSize: 10 }}>→</button>
          </div>}
        </div>
      </div>}

      {/* Middle: Sections (stopped) or Metronome (playing/paused-with-bar) */}
      {syncCountIn && syncBar ? (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 16px" }}>
          <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 4 }}>{t("video.countIn")}</div>
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
          {/* Edit toggle */}
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
              <span style={{ fontSize: 9, color: C.textMuted }}>{t("bpm")}</span>
            </div>
          </div>
          {syncBar.tsN > 0 && <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 10 }}>
            {Array.from({ length: syncBar.tsN }).map((_, i) => {
              const on = i === syncBar.bei, c = i === 0 ? C.downbeat : C.sub;
              return <div key={i} style={{ width: on ? 14 : 8, height: on ? 14 : 8, borderRadius: "50%", background: on ? c : `${c}55`, transition: "all 0.06s", border: on ? `2px solid ${c}` : "2px solid transparent" }} />;
            })}
          </div>}
          <div style={{ fontSize: 11, color: C.textMuted, marginTop: 6 }}>{t("sec")} {syncBar.si + 1}/{sections.length} · {fmtTime(currentTime)}</div>

          {/* Edit mode controls */}
          {editMode && (
            <div style={{ width: "100%", maxWidth: 300, marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
              {/* Tempo adjust */}
              {curSec && curSec.type === "metered" && (
                <div style={{ background: C.surface, borderRadius: 10, padding: 10, border: `1px solid ${C.accent}44` }}>
                  <div style={{ fontSize: 9, color: C.accent, fontWeight: 600, marginBottom: 6, textAlign: "center" }}>{t("video.secTempo")} {syncBar.si + 1} {t("video.tempo")}</div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                    <button onClick={() => adjustTempo(-5)} style={{ ...tS, width: 34, height: 34, fontSize: 10 }}>-5</button>
                    <button onClick={() => adjustTempo(-1)} style={{ ...tS, width: 34, height: 34, fontSize: 10 }}>-1</button>
                    <div style={{ fontSize: 22, color: C.text, fontWeight: 700, minWidth: 50, textAlign: "center" }}>{curSec.tempo}</div>
                    <button onClick={() => adjustTempo(1)} style={{ ...tS, width: 34, height: 34, fontSize: 10 }}>+1</button>
                    <button onClick={() => adjustTempo(5)} style={{ ...tS, width: 34, height: 34, fontSize: 10 }}>+5</button>
                  </div>
                </div>
              )}
              {/* TAP + Go to Bar row */}
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                  {vidTapBpm && <span style={{ fontSize: 10, color: C.downbeat, fontFamily: "'DM Mono',monospace", fontWeight: 600 }}>{vidTapBpm}</span>}
                  <button onClick={vidTap} style={{ background: vidTapFlash ? C.downbeat : C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 14px", cursor: "pointer", color: vidTapFlash ? "#000" : C.textMuted, fontFamily: "'DM Mono',monospace", fontSize: 12, transition: "background 0.1s, color 0.1s" }}>{t("play.tap")}</button>
                </div>
                <div style={{ flex: 1, display: "flex", gap: 4, alignItems: "center" }}>
                  <input value={goBar} onChange={e => setGoBar(e.target.value)} onKeyDown={e => { if (e.key === "Enter") handleGoToBar(); }} placeholder="Bar #" inputMode="numeric" style={{ ...nI, flex: 1, textAlign: "center", padding: "0 8px", fontSize: 13, height: 38 }} />
                  <button onClick={handleGoToBar} style={{ ...tS, width: 38, height: 38, fontSize: 11, fontFamily: "'DM Mono',monospace" }}>{t("video.go")}</button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : syncActive && !syncBar ? (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontSize: 14, color: C.textMuted }}>{t("video.starting")}</div>
        </div>
      ) : syncEnded ? (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 16px" }}>
          <div style={{ fontSize: 48, color: C.downbeat, fontFamily: "'Bebas Neue','DM Mono',monospace", letterSpacing: 2 }}>{t("video.endTitle")}</div>
          <div style={{ fontSize: 12, color: C.textMuted, marginTop: 8 }}>{t("video.tapRestart")}</div>
          <button onClick={() => { setSyncBar(null); setSyncEnded(false); }} style={{ marginTop: 12, padding: "6px 14px", borderRadius: 6, border: `1px solid ${C.border}`, background: "transparent", color: C.textMuted, fontSize: 11, cursor: "pointer" }}>{t("video.backToSections")}</button>
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: "auto", padding: "4px 12px 16px", minHeight: 0 }}>
          <div style={{ display: "flex", gap: 8, fontSize: 11, color: C.textMuted, marginBottom: 6 }}><span>{sections.length} {t("sec")}</span></div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {sections.map((sec, i) => {
              const isT = sec.type === "timed";
              return (<div key={sec.id} onClick={() => onEditSection && onEditSection(sec.id)} style={{ background: C.surface, borderRadius: 8, padding: "8px 10px", border: `1px solid ${C.border}`, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 20, alignItems: "center" }}>
                  <button onClick={e => { e.stopPropagation(); onMoveSection && onMoveSection(i, -1); }} disabled={i === 0} style={{ background: "none", border: "none", color: i === 0 ? C.border : C.textMuted, cursor: i === 0 ? "default" : "pointer", padding: 1, display: "flex", fontSize: 10 }}>▲</button>
                  <span style={{ fontSize: 9, color: C.textMuted }}>{i + 1}</span>
                  <button onClick={e => { e.stopPropagation(); onMoveSection && onMoveSection(i, 1); }} disabled={i === sections.length - 1} style={{ background: "none", border: "none", color: i === sections.length - 1 ? C.border : C.textMuted, cursor: i === sections.length - 1 ? "default" : "pointer", padding: 1, display: "flex", fontSize: 10 }}>▼</button>
                </div>
                {isT ? <div style={{ flex: 1, fontSize: 12, color: C.text }}>{sec.duration}s {t("play.free").toLowerCase()}</div> : (<>
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
        <button onClick={() => setVidCountIn(v => (v + 1) % 3)} style={{ padding: "4px 6px", borderRadius: 8, border: `1px solid ${vidCountIn > 0 ? C.accent + "55" : C.border}`, background: vidCountIn > 0 ? C.accent + "15" : "transparent", color: vidCountIn > 0 ? C.accent : C.textMuted, fontSize: 9, cursor: "pointer", fontFamily: "'DM Mono',monospace", width: 48, textAlign: "center", flexShrink: 0 }}>{vidCountIn === 0 ? t("video.off") : vidCountIn === 1 ? t("video.1bar") : t("video.2bars")}</button>
      </div>

      {!hasSync && <div style={{ position: "absolute", top: "50%", left: 16, right: 16, textAlign: "center", transform: "translateY(-50%)" }}><div style={{ fontSize: 12, color: C.textMuted }}>{t("video.syncAvailable")}</div></div>}
      </div>
      {showVidSave && <SaveM sections={sections} onClose={() => { setShowVidSave(false); initSnap.current = { sections: JSON.stringify(sections), startPt, endPt }; if (showClosePrompt) { setShowClosePrompt(false); onClose(); } }} onSaved={() => {}} videoUrl={videoUrl} videoSync={{ start: startPt, end: endPt }} loadedProfileId={loadedProfileId} />}
      {showClosePrompt && !showVidSave && <div className="modal-bg" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 110, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setShowClosePrompt(false)}>
        <div className="modal-content" style={{ width: "100%", maxWidth: 320, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 16, padding: "24px 20px", textAlign: "center" }} onClick={e => e.stopPropagation()}>
          <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 15, color: C.text, fontWeight: 600, marginBottom: 6 }}>{t("video.unsaved")}</div>
          <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 20, fontFamily: "'Outfit',sans-serif" }}>{t("video.unsavedDesc")}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <button onClick={() => { setShowClosePrompt(false); setShowVidSave(true); }} style={{ width: "100%", padding: 11, borderRadius: 8, border: "none", background: C.accent, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>{t("video.saveChanges")}</button>
            <button onClick={() => { setShowClosePrompt(false); onClose(); }} style={{ width: "100%", padding: 11, borderRadius: 8, border: `1px solid ${C.danger}55`, background: "transparent", color: C.danger, fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>{t("video.discard")}</button>
            <button onClick={() => setShowClosePrompt(false)} style={{ width: "100%", padding: 11, borderRadius: 8, border: `1px solid ${C.border}`, background: "transparent", color: C.textMuted, fontSize: 13, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>{t("video.cancel")}</button>
          </div>
        </div>
      </div>}
    </div>
  );
}

// ============ SETTINGS / SAVE / LIBRARY ============
// AGENT NOTE: Do NOT add inline description text beneath settings rows.
// All setting explanations should use data-tip or data-tip-b tooltip attributes only.
// Keep the settings UI clean and minimal — no prose descriptions.
function SetP({ settings: s, onChange, onClose }) {
  const u = (k, v) => onChange({ ...s, [k]: v }); return (<div className="modal-bg" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={onClose}><div className="modal-content" style={{ width: "100%", maxWidth: 440, background: C.bg, borderTop: `1px solid ${C.border}`, borderRadius: "16px 16px 0 0", padding: "20px 20px 32px" }} onClick={e => e.stopPropagation()}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}><div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 16, color: C.text, fontWeight: 600 }}>{t("settings.title")}</div><button className="close-btn" onClick={onClose} data-tip-b={t("close")}>{I.x(18)}</button></div>
    <SR l={t("settings.language")}>{[["en","English"],["zh-CN","简体中文"],["zh-TW","繁體中文"]].map(([v,l])=><button key={v} onClick={()=>{u("lang",v);setAppLang(v)}} style={oB(s.lang===v)}>{l}</button>)}</SR>
    <SR l={t("settings.mode")}>{[["basic",t("settings.basic")], ["default",t("settings.default")], ["advanced",t("settings.advanced")]].map(([v,l]) => <button key={v} onClick={() => u("appMode", v)} style={oB(s.appMode === v)}>{l}</button>)}</SR>
    <SR l={t("settings.click")}>{["accented", "flat"].map(v => <button key={v} onClick={() => u("accented", v === "accented")} data-tip={v === "accented" ? t("settings.accented") : t("settings.flatTip")} style={oB(s.accented === (v === "accented"))}>{v === "accented" ? <span style={{ letterSpacing: 2 }}>● <span style={{ fontSize: 8 }}>· · ·</span></span> : <span style={{ letterSpacing: 2, fontSize: 8 }}>· · · ·</span>}</button>)}{["pitched", "unpitched"].map(v => <button key={v} onClick={() => u("pitched", v === "pitched")} data-tip={v === "pitched" ? t("settings.pitched") : t("settings.unpitched")} style={oB(s.pitched === (v === "pitched"))}>{v === "pitched" ? "♪" : "✕"}</button>)}</SR><SR l={t("settings.beats")}>{[false, true].map(v => <button key={String(v)} onClick={() => u("downbeatOnly", v)} style={oB(s.downbeatOnly === v)}>{v ? <span style={{ letterSpacing: 3 }}>● ○ ○ ○</span> : <span style={{ letterSpacing: 3 }}>● ● ● ●</span>}</button>)}</SR><SR l={t("settings.visual")}>{[["dots", "●", t("settings.pulse")], ["dots+flash", "● ◻", t("settings.full")], ["flash", "◻", t("settings.flash")]].map(([v, l, tip]) => <button key={v} onClick={() => u("visualMode", v)} data-tip={tip} style={{ ...oB(s.visualMode === v), fontSize: 11 }}>{l}</button>)}</SR><SR l={t("settings.countIn")}>{[0, 1, 2].map(v => <button key={v} onClick={() => u("countIn", v)} style={oB(s.countIn === v)}>{v === 0 ? t("settings.countInOff") : v === 1 ? t("settings.countIn1") : t("settings.countIn2")}</button>)}</SR>
    {s.appMode === "advanced" && <SR l={t("settings.silentCycle")}><div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{[0, 4, 8, 12, 16].map(v => <button key={v} onClick={() => u("silentInterval", v)} data-tip={v === 0 ? t("settings.alwaysAudible") : `${v}s ${t("settings.silentTip")}, ${v}s ${t("settings.silentTip2")}`} style={{ ...oB(s.silentInterval === v), fontSize: 11 }}>{v === 0 ? t("off") : `${v}s`}</button>)}</div></SR>}
    <div style={{ marginTop: 16, paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
      <div style={{ fontSize: 10, color: C.textMuted + "88", fontFamily: "'DM Mono',monospace" }}>{t("settings.deviceId")} {getDeviceId()}</div>
      <div style={{ fontSize: 9, color: C.textMuted + "55", fontFamily: "'Outfit',sans-serif", marginTop: 4 }}>{t("settings.privacy")}</div>
    </div></div></div>);
}
function SR({ l, children }) { return (<div style={{ marginBottom: 16 }}><div style={{ fontSize: 12, color: C.textMuted, marginBottom: 8, fontFamily: "'Outfit',sans-serif" }}>{l}</div><div style={{ display: "flex", gap: 8 }}>{children}</div></div>); }
function SaveM({ sections, onClose, onSaved, videoUrl: savedVideoUrl, videoSync: savedVideoSync, loadedProfileId }) {
  const existing = useMemo(() => { if (!loadedProfileId) return null; const p = ldP(); return p.find(x => x.id === loadedProfileId) || null; }, [loadedProfileId]);
  const [ti, sTi] = useState(existing?.title || ""), [c, sC] = useState(existing?.composer || ""), [perf, setPerf] = useState(existing?.performer || ""), [vUrl, setVUrl] = useState(savedVideoUrl || existing?.videoUrl || "");
  const ok = ti.trim() && c.trim();
  const saveNew = () => { if (!ok) return; const p = ldP(); const id = Date.now(); const profile = { id, title: ti.trim(), composer: c.trim(), sections, createdAt: new Date().toISOString() }; if (perf.trim()) profile.performer = perf.trim(); if (vUrl.trim()) profile.videoUrl = vUrl.trim(); if (savedVideoSync) profile.videoSync = savedVideoSync; p.push(profile); svP(p); onSaved(id); onClose(); };
  const overwrite = () => { if (!ok || !loadedProfileId) return; const p = ldP(); const idx = p.findIndex(x => x.id === loadedProfileId); if (idx < 0) { saveNew(); return; } p[idx] = { ...p[idx], title: ti.trim(), composer: c.trim(), performer: perf.trim() || undefined, videoUrl: vUrl.trim() || undefined, videoSync: savedVideoSync || p[idx].videoSync, sections, updatedAt: new Date().toISOString() }; svP(p); onSaved(loadedProfileId); onClose(); };
  return (<div className="modal-bg" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center" }}><div className="modal-content" style={{ width: "100%", maxWidth: 440, background: C.bg, borderTop: `1px solid ${C.border}`, borderRadius: "16px 16px 0 0", padding: "20px 20px 32px" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}><div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 16, color: C.text, fontWeight: 600 }}>{existing ? t("save.updatePiece") : t("save.savePiece")}</div><button className="close-btn" onClick={onClose} data-tip-b={t("close")}>{I.x(18)}</button></div>
    <input value={ti} onChange={e => sTi(e.target.value)} placeholder={t("save.title")} style={{ ...nI, width: "100%", textAlign: "left", padding: "0 12px", marginBottom: 10, fontSize: 15 }} />
    <input value={c} onChange={e => sC(e.target.value)} placeholder={t("save.composer")} style={{ ...nI, width: "100%", textAlign: "left", padding: "0 12px", marginBottom: 10, fontSize: 15 }} />
    <input value={perf} onChange={e => setPerf(e.target.value)} placeholder={t("save.performer")} style={{ ...nI, width: "100%", textAlign: "left", padding: "0 12px", marginBottom: 10, fontSize: 13, color: C.textMuted }} />
    <input value={vUrl} onChange={e => setVUrl(e.target.value)} placeholder={t("save.videoUrl")} style={{ ...nI, width: "100%", textAlign: "left", padding: "0 12px", marginBottom: 20, fontSize: 13, color: C.textMuted }} />
    {existing ? (<div style={{ display: "flex", gap: 8 }}>
      <button onClick={overwrite} style={{ flex: 1, padding: "12px", borderRadius: 8, border: "none", background: ok ? C.accent : C.sub, color: ok ? "#fff" : C.textMuted, fontSize: 14, fontWeight: 600, cursor: ok ? "pointer" : "default", fontFamily: "'Outfit',sans-serif" }}>{t("save.update")}</button>
      <button onClick={saveNew} style={{ flex: 1, padding: "12px", borderRadius: 8, border: `1px solid ${ok ? C.downbeat : C.sub}`, background: "transparent", color: ok ? C.downbeat : C.textMuted, fontSize: 14, fontWeight: 600, cursor: ok ? "pointer" : "default", fontFamily: "'Outfit',sans-serif" }}>{t("save.saveNew")}</button>
    </div>) : (
      <button onClick={saveNew} style={{ width: "100%", padding: "12px", borderRadius: 8, border: "none", background: ok ? C.downbeat : C.sub, color: ok ? "#000" : C.textMuted, fontSize: 14, fontWeight: 600, cursor: ok ? "pointer" : "default", fontFamily: "'Outfit',sans-serif" }}>{t("save.save")}</button>
    )}
  </div></div>);
}
function LibP({ onLoad, onClose }) {
  const [p, sP] = useState(ldP()), [s, sS] = useState("");
  const f = p.filter(x => x.title.toLowerCase().includes(s.toLowerCase()) || x.composer.toLowerCase().includes(s.toLowerCase()) || (x.performer || "").toLowerCase().includes(s.toLowerCase()));
  const [confirmDelId, setConfirmDelId] = useState(null);
  const confirmDelTimer = useRef(null);
  const del = id => {
    if (confirmDelId !== id) { setConfirmDelId(id); if (confirmDelTimer.current) clearTimeout(confirmDelTimer.current); confirmDelTimer.current = setTimeout(() => setConfirmDelId(null), 3000); return; }
    setConfirmDelId(null);
    const u = p.filter(x => x.id !== id); svP(u); sP(u);
  };
  const exportAll = () => {
    try {
      const json = JSON.stringify(p, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = "tempus-profiles.json"; a.click();
      URL.revokeObjectURL(url);
    } catch (e) { }
  };
  const importFile = () => {
    const input = document.createElement("input"); input.type = "file"; input.accept = ".json";
    input.onchange = e => {
      const file = e.target.files?.[0]; if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        try {
          const imported = JSON.parse(ev.target.result);
          if (Array.isArray(imported)) { const merged = [...p]; imported.forEach(ip => { if (!merged.find(x => x.title === ip.title && x.composer === ip.composer)) merged.push({ ...ip, id: Date.now() + Math.random() }); }); svP(merged); sP(merged); }
        } catch { }
      };
      reader.readAsText(file);
    };
    input.click();
  };
  return (<div className="modal-bg" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={onClose}><div className="modal-content" style={{ width: "100%", maxWidth: 440, background: C.bg, borderTop: `1px solid ${C.border}`, borderRadius: "16px 16px 0 0", padding: "20px 20px 32px", maxHeight: "80vh", display: "flex", flexDirection: "column" }} onClick={e => e.stopPropagation()}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}><div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 16, color: C.text, fontWeight: 600 }}>{t("lib.title")}</div><div style={{ display: "flex", gap: 6 }}>
      <button onClick={importFile} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 6, color: C.textMuted, padding: "4px 8px", cursor: "pointer", fontSize: 11, fontFamily: "'DM Mono',monospace" }}>{t("lib.import")}</button>
      <button onClick={exportAll} disabled={p.length === 0} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 6, color: p.length > 0 ? C.textMuted : C.border, padding: "4px 8px", cursor: p.length > 0 ? "pointer" : "default", fontSize: 11, fontFamily: "'DM Mono',monospace" }}>{t("lib.export")}</button>
      <button onClick={onClose} data-tip-b={t("close")} style={{ background: "none", border: "none", color: C.textMuted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", width: 44, height: 44, borderRadius: 8 }}>{I.x(18)}</button>
    </div></div>
    <div style={{ position: "relative", marginBottom: 12 }}>
      <input value={s} onChange={e => sS(e.target.value)} placeholder={t("lib.search")} style={{ ...nI, width: "100%", textAlign: "left", padding: "0 36px", fontSize: 14 }} />
      <div style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: C.textMuted }}>{I.search(14)}</div>
      {s.length > 0 && <button onClick={() => sS("")} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: C.textMuted, cursor: "pointer", display: "flex" }}>{I.x(14)}</button>}
    </div>
    <div style={{ overflowY: "auto", flex: 1 }}>{f.length === 0 && <div style={{ color: C.textMuted, fontSize: 14, fontFamily: "'Outfit',sans-serif", textAlign: "center", padding: "60px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}><div style={{ opacity: 0.15, transform: "scale(1.2)" }}>{I.folder(48)}</div><div style={{ fontSize: 16, color: C.textMuted }}>{p.length === 0 ? t("lib.empty") : t("lib.noResults")}</div><div style={{ fontSize: 13, color: C.border, maxWidth: "80%" }}>{p.length === 0 ? t("lib.emptyDesc") : t("lib.noResultsDesc")}</div></div>}{f.map(x => (<div key={x.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: `1px solid ${C.border}` }}><div style={{ flex: 1, cursor: "pointer" }} onClick={() => { onLoad(x.sections, x.videoUrl || null, x.videoSync || null, x.id); onClose(); }}><div style={{ fontFamily: "'DM Mono',monospace", fontSize: 14, color: C.text, display: "flex", alignItems: "center", gap: 6 }}>{x.title}{x.videoUrl && <span style={{ fontSize: 11, color: C.accent }} title={x.videoUrl}>▶</span>}</div><div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 12, color: C.textMuted }}>{x.composer}{x.performer ? ` · ${x.performer}` : ""}</div></div><div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: C.textMuted, flexShrink: 0 }}>{x.sections?.length || 0} {t("sec")}</div><button onClick={() => del(x.id)} data-tip-b={confirmDelId === x.id ? "Tap again" : "Delete"} style={{ background: confirmDelId === x.id ? C.danger + "22" : "none", border: confirmDelId === x.id ? `1px solid ${C.danger}` : "1px solid transparent", borderRadius: 6, color: C.danger + (confirmDelId === x.id ? "ff" : "99"), cursor: "pointer", padding: 4, display: "flex", transition: "all 0.15s" }}>{confirmDelId === x.id ? <span style={{ fontSize: 10, fontFamily: "'DM Mono',monospace" }}>{t("lib.deleteQ")}</span> : I.trash(14)}</button></div>))}</div>
  </div></div>);
}

// ============ PRACTICE SETUP MODAL ============
function PracSetup({ sections, onStart, onClose }) {
  const refSec = sections.find(s => s.type === "metered");
  const refTempo = refSec?.tempo || 120;
  const [startBpm, setStartBpm] = useState(Math.round(refTempo * 0.7));
  const [inc, setInc] = useState(5);
  const [reps, setReps] = useState(2);
  const pct = Math.round((startBpm / refTempo) * 100);
  const doStart = () => {
    const startPct = Math.max(10, Math.min(100, pct));
    const pctInc = Math.max(1, Math.round((inc / refTempo) * 100));
    onStart(null, { startPct, targetPct: 100, pctInc, pctReps: reps });
    onClose();
  };
  return (<div className="modal-bg" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
    <div className="modal-content" style={{ width: "100%", maxWidth: 440, background: C.bg, borderTop: `1px solid ${C.border}`, borderRadius: "16px 16px 0 0", padding: "20px 20px 32px", maxHeight: "85vh", overflowY: "auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}><div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 16, color: C.practice, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>{I.target(18)} {t("prac.title")}</div><button className="close-btn" onClick={onClose} data-tip-b={t("close")}>{I.x(18)}</button></div>
      <Row label={t("prac.start")}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Stp value={startBpm} onChange={setStartBpm} min={10} max={refTempo} />
          <span style={{ color: C.textMuted, fontSize: 12, fontFamily: "'DM Mono',monospace" }}>BPM</span>
          <span style={{ color: C.textMuted + "88", fontSize: 11, fontFamily: "'DM Mono',monospace" }}>{pct}%</span>
        </div>
      </Row>
      <Row label={t("prac.target")}>
        <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 16, color: C.text }}>{refTempo}</span>
        <span style={{ color: C.textMuted, fontSize: 12, fontFamily: "'DM Mono',monospace" }}>BPM</span>
        <span style={{ color: C.textMuted + "88", fontSize: 11, fontFamily: "'DM Mono',monospace" }}>100%</span>
      </Row>
      <Row label={t("prac.increment")}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Stp value={inc} onChange={setInc} min={1} max={50} />
          <span style={{ color: C.textMuted, fontSize: 12, fontFamily: "'DM Mono',monospace" }}>BPM</span>
        </div>
      </Row>
      <Row label={t("prac.repeats")}><Stp value={reps} onChange={setReps} min={1} max={20} /></Row>
      <div style={{ marginTop: 18 }}>
        <button onClick={doStart} style={{ width: "100%", padding: "12px", borderRadius: 8, border: "none", background: C.practice, color: "#000", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>{t("prac.startBtn")}</button>
      </div>
    </div>
  </div>);
}

// ============ MAIN ============
export default function Tempus() {
  const [sections, setSections] = useState(() => { try { const saved = _getLS("tempus_sections"); if (saved) { const parsed = JSON.parse(saved); if (Array.isArray(parsed) && parsed.length > 0) return parsed; } } catch {} return [mkM()]; });
  useEffect(() => { _setLS("tempus_sections", JSON.stringify(sections)); fbSyncDebounced(sections); }, [sections]);
  const [editId, setEditId] = useState(null);
  const [editIsNew, setEditIsNew] = useState(false);
  const [showSet, setShowSet] = useState(false);
  const [showSave, setShowSave] = useState(false);
  const [showLib, setShowLib] = useState(false);
  const [videoUrl, setVideoUrl] = useState(() => _getLS("tempus_videoUrl") || null);
  const [videoSync, setVideoSync] = useState(() => { try { const s = _getLS("tempus_videoSync"); return s ? JSON.parse(s) : null; } catch { return null; } });
  const [showVideo, setShowVideo] = useState(false);
  const [loadedProfileId, setLoadedProfileId] = useState(null);
  useEffect(() => { if (videoUrl) _setLS("tempus_videoUrl", videoUrl); else { try { localStorage.removeItem("tempus_videoUrl"); } catch {} } }, [videoUrl]);
  useEffect(() => { if (videoSync) _setLS("tempus_videoSync", JSON.stringify(videoSync)); else { try { localStorage.removeItem("tempus_videoSync"); } catch {} } }, [videoSync]);
  const [showPrac, setShowPrac] = useState(false);
  const [settings, setSettings] = useState(() => { try { const saved = _getLS("tempus_settings"); if (saved) return { accented: true, pitched: true, visualMode: "dots+flash", countIn: 1, appMode: "default", downbeatOnly: false, silentInterval: 0, lang: "en", ...JSON.parse(saved) }; } catch {} return { accented: true, pitched: true, visualMode: "dots+flash", countIn: 1, appMode: "default", downbeatOnly: false, silentInterval: 0, lang: "en" }; });
  useEffect(() => { _setLS("tempus_settings", JSON.stringify(settings)); if (settings.lang) setAppLang(settings.lang); }, [settings]);
  const [muted, setMuted] = useState(false);
  const [ps, setPs] = useState(null);
  const [isP, setIsP] = useState(false);
  const [mode, setMode] = useState("normal"); // "normal"|"record"|"practice"
  const [pracSections, setPracSections] = useState(null);
  const [pracStep, setPracStep] = useState(0);
  const met = useMetronome();
  const fto = useRef(null);
  const splitPoints = useRef([]);

  const [pracPending, setPracPending] = useState(false);

  const [undoToast, setUndoToast] = useState(null);
  const undoTimer = useRef(null);
  useEffect(() => () => { if (undoTimer.current) clearTimeout(undoTimer.current); }, []);
  const [dragIdx, setDragIdx] = useState(null);
  const [dropIdx, setDropIdx] = useState(null);
  // Touch drag reorder
  const [tDrag, setTDrag] = useState(null); // { idx, startY, offsetY }
  const [tDropIdx, setTDropIdx] = useState(null);
  const cardRefs = useRef([]);
  const tDragTimer = useRef(null);
  const onGripTouchStart = useCallback((idx, e) => {
    const touch = e.touches[0];
    const startY = touch.clientY;
    tDragTimer.current = setTimeout(() => {
      if (navigator.vibrate) try { navigator.vibrate(20); } catch {}
      // Measure all card positions
      const positions = cardRefs.current.map(el => el ? el.getBoundingClientRect() : null);
      setTDrag({ idx, startY, offsetY: 0, positions });
      setTDropIdx(idx);
    }, 300);
  }, []);
  useEffect(() => {
    if (!tDrag) return;
    const onMove = e => {
      e.preventDefault();
      const y = e.touches[0].clientY;
      const offsetY = y - tDrag.startY;
      setTDrag(prev => prev ? { ...prev, offsetY } : null);
      // Calculate drop index from card positions
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
  }, [tDrag, tDropIdx, sections.length]);
  const cancelTouchDrag = useCallback(() => { if (tDragTimer.current) { clearTimeout(tDragTimer.current); tDragTimer.current = null; } }, []);

  const activeSections = pracSections || sections;
  const tl = useMemo(() => buildTL(activeSections), [activeSections]);
  const totalBars = tl.length;

  useEffect(() => { met.updS({ muted }); }, [muted]);
  useEffect(() => { met.updS({ accented: settings.accented, pitched: settings.pitched, downbeatOnly: settings.downbeatOnly, silentInterval: settings.silentInterval }); }, [settings.accented, settings.pitched, settings.downbeatOnly, settings.silentInterval]);

  useEffect(() => {
    met.setCb(evt => {
      if (evt.type === "beat") { const bar = tl[evt.barIdx]; setPs({ absoluteBar: evt.ab, beatIndex: evt.beatIdx, beatType: evt.bt, tsNum: evt.tsN, tsDen: evt.tsD, tempo: evt.tempo, sectionIndex: evt.si, allBeatTypes: bar?.bts || [], flash: true, countIn: false, isTimed: false, fermata: false, pctLabel: pracSections ? `${pracStep}%` : null }); if (fto.current) clearTimeout(fto.current); fto.current = setTimeout(() => setPs(p => p ? { ...p, flash: false } : p), 80); }
      else if (evt.type === "countIn") { setPs(p => ({ ...p || {}, countIn: true, flash: true, isTimed: false, beatIndex: evt.beatInBar - 1, beatType: evt.beatInBar === 1 ? 0 : 2, tsNum: evt.totalBeats, tsDen: 0, allBeatTypes: Array(evt.totalBeats).fill(2).map((_, i) => i === 0 ? 0 : 2) })); if (fto.current) clearTimeout(fto.current); fto.current = setTimeout(() => setPs(p => p ? { ...p, flash: false } : p), 80); }
      else if (evt.type === "timedStart") { setPs(p => ({ ...p || {}, isTimed: true, countIn: false, flash: true, beatType: 0, absoluteBar: evt.ab, sectionIndex: evt.si, remaining: evt.dur, tsNum: 0, tsDen: 0 })); if (fto.current) clearTimeout(fto.current); fto.current = setTimeout(() => setPs(p => p ? { ...p, flash: false } : p), 80); }
      else if (evt.type === "timedTick") { setPs(p => ({ ...p || {}, isTimed: true, countIn: false, absoluteBar: evt.ab, sectionIndex: evt.si, remaining: evt.rem, flash: p?.flash || false, tsNum: 0, tsDen: 0, beatType: 0, totalMarkers: p?.totalMarkers || 0, markerIdx: p?.markerIdx || 0 })); }
      else if (evt.type === "timedMarker") { setPs(p => ({ ...p || {}, flash: true, beatType: 0, totalMarkers: evt.tm, markerIdx: evt.mi })); if (fto.current) clearTimeout(fto.current); fto.current = setTimeout(() => setPs(p => p ? { ...p, flash: false } : p), 80); }
      else if (evt.type === "fermataHold") { setPs(p => ({ ...p || {}, fermata: true, fermataRem: evt.rem, fermataDur: evt.dur })); }
      else if (evt.type === "ended") { setPs(p => ({ ...p || {}, ended: true, flash: false, countIn: false, fermata: false })); setIsP(false); }
    });
  }, [met, tl, pracSections, pracStep]);

  const prePlayTempos = useRef(null);
  const go = useCallback((fi = 0, countInOverride, syncDelayMs) => { if (!tl.length) return; if (!prePlayTempos.current) prePlayTempos.current = sections.map(s => s.tempo); const ci = countInOverride !== undefined ? countInOverride : settings.countIn; const i = Math.max(0, Math.min(fi, tl.length - 1)), b = tl[i]; setPs({ absoluteBar: b.ab, beatIndex: 0, beatType: 0, tsNum: b.tsN, tsDen: b.tsD, tempo: b.tempo, sectionIndex: b.si, allBeatTypes: b.bts, flash: false, countIn: false, isTimed: b.isT, remaining: b.isT ? b.tDur : undefined, pctLabel: pracSections ? `${pracStep}%` : null }); setIsP(true); met.start(tl, i, ci, { accented: settings.accented, pitched: settings.pitched, muted, ...(syncDelayMs != null ? { syncDelayMs } : {}) }); }, [tl, settings, met, muted, pracSections, pracStep, sections]);
  const moveTo = useCallback((fi = 0) => { if (!tl.length) return; const i = Math.max(0, Math.min(fi, tl.length - 1)), b = tl[i]; met.stop(); setIsP(false); setPs({ absoluteBar: b.ab, beatIndex: 0, beatType: 0, tsNum: b.tsN, tsDen: b.tsD, tempo: b.tempo, sectionIndex: b.si, allBeatTypes: b.bts, flash: false, countIn: false, isTimed: b.isT, remaining: b.isT ? b.tDur : undefined, pctLabel: pracSections ? `${pracStep}%` : null }); }, [tl, met, pracSections, pracStep]);
  useEffect(() => { if (pracPending && pracSections) { setPracPending(false); go(0); } }, [pracPending, pracSections, go]);
  const exitPlay = useCallback(() => { met.stop(); setIsP(false); setPs(null); setMode("normal"); setPracSections(null); try { if (prePlayTempos.current && prePlayTempos.current.length > 0) { const saved = prePlayTempos.current; setSections(prev => prev.map((s, i) => ({ ...s, tempo: i < saved.length ? (saved[i] ?? s.tempo) : s.tempo }))); } } catch {} prePlayTempos.current = null; }, [met]);

  // ============ SYNC MODE ============
  const syncPause = useCallback(() => { met.stop(); setIsP(false); }, [met]);
  const sync = useSync({ sections, settings, met, go, exitPlay, pause: syncPause });
  const handleSyncLoadSections = useCallback((s) => { if (Array.isArray(s) && s.length > 0) setSections(s); }, []);

  // Member: always load sections from host (must be in App, not lobby — lobby unmounts after admit)
  const lastSyncSectionsJson = useRef(null);
  useEffect(() => {
    if (!sync.isInRoom || sync.isHost) { lastSyncSectionsJson.current = null; return; }
    if (!sync.syncState?.isAdmitted || !sync.syncState?.sections?.length) return;
    const j = JSON.stringify(sync.syncState.sections);
    if (j === lastSyncSectionsJson.current) return; // no actual change
    lastSyncSectionsJson.current = j;
    setSections(sync.syncState.sections);
  }, [sync.syncState?.sections, sync.isHost, sync.isInRoom, sync.syncState?.isAdmitted]);
  const goToBar = useCallback(n => { const i = tl.findIndex(b => b.ab === n); if (i >= 0) moveTo(i); }, [tl, moveTo]);
  const jumpSec = useCallback(d => { if (!ps) return; const ns = Math.max(0, Math.min(activeSections.length - 1, ps.sectionIndex + d)), i = tl.findIndex(b => b.si === ns); if (i >= 0) moveTo(i); }, [ps, activeSections, tl, moveTo]);

  const [confirmClear, setConfirmClear] = useState(false);
  const confirmTimer = useRef(null);
  useEffect(() => {
    const hkd = e => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      const anyModalOpen = editId !== null || showSet || showSave || showLib || showPrac || showVideo || confirmClear || sync.showLobby;
      if (e.code === "Space") {
        if (anyModalOpen || sync.isMemberLocked) return;
        if (sync.isInRoom && !sync.syncReady) return;
        e.preventDefault();
        if (sync.isInRoom && sync.isHost) {
          // Host in sync room: Space toggles start/pause for all devices
          if (isP) { sync.doPause(); }
          else { met.tap(); sync.doStart(); }
        } else {
          if (isP) { met.stop(); setIsP(false); }
          else if (ps && (ps.ended || ps.countIn)) { met.tap(); go(0); }
          else if (ps) { met.tap(); const i = tl.findIndex(b => b.ab === ps.absoluteBar); if (i >= 0) { setIsP(true); met.start(tl, i, 0, { accented: settings.accented, pitched: settings.pitched, muted }); } }
          else { met.tap(); go(0); }
        }
      }
      else if (e.code === "Escape") { setEditId(null); setShowSet(false); setShowSave(false); setShowLib(false); setShowPrac(false); setShowVideo(false); setConfirmClear(false); sync.setShowLobby(false); }
      else if (isP && !sync.isMemberLocked && e.code === "ArrowLeft") jumpSec(-1);
      else if (isP && !sync.isMemberLocked && e.code === "ArrowRight") jumpSec(1);
    };
    window.addEventListener("keydown", hkd); return () => window.removeEventListener("keydown", hkd);
  }, [isP, exitPlay, go, jumpSec, met, tl, ps, settings, muted, editId, showSet, showSave, showLib, showPrac, showVideo, confirmClear, sync.showLobby, sync.isMemberLocked]);

  const lastSplitTime = useRef(0);
  const lastSplitBar = useRef(0);

  // Live capture split
  const handleSplit = useCallback(barNum => {
    if (mode !== "record") return;
    const now = Date.now();
    if (now - lastSplitTime.current < 800 || barNum === lastSplitBar.current) return;
    lastSplitTime.current = now;
    lastSplitBar.current = barNum;
    splitPoints.current.push(barNum);
    setSections(prev => {
      if (prev.length > 50) return prev; // safety cap
      const tempTl = buildTL(prev);
      const barInfo = tempTl.find(b => b.ab === barNum);
      if (!barInfo) return prev;
      const secIdx = barInfo.si;
      const sec = prev[secIdx];
      if (!sec || sec.type === "timed") return prev;
      const barInSec = barInfo.bin;
      if (barInSec <= 1 || barInSec >= sec.bars) return prev;
      const elapsed1 = barInSec - 1, elapsed2 = sec.bars - (barInSec - 1);
      const s1 = { ...sec, id: Date.now() + Math.random(), bars: elapsed1, capturedDuration: elapsed1 * gCD(sec.tempo, sec.beatUnit, sec.dotted, sec.tsDen) * sec.tsNum };
      const s2 = { ...sec, id: Date.now() + Math.random() + 1, bars: elapsed2, capturedDuration: elapsed2 * gCD(sec.tempo, sec.beatUnit, sec.dotted, sec.tsDen) * sec.tsNum };
      return [...prev.slice(0, secIdx), s1, s2, ...prev.slice(secIdx + 1)];
    });
  }, [mode]);

  // Practice mode start
  const startPractice = useCallback((_, profileOpts) => {
    if (!profileOpts) return;
    const { startPct, targetPct, pctInc, pctReps } = profileOpts;
    let allSecs = [];
    for (let p = startPct; p <= targetPct; p += pctInc) {
      for (let r = 0; r < pctReps; r++) {
        allSecs = allSecs.concat(scaleSections(sections, Math.min(p, targetPct)));
      }
    }
    setPracSections(allSecs); setPracStep(startPct); setMode("practice");
    setPracPending(true);
  }, [sections, go]);

  const addSec = () => { const ns = mkM(); if (sections.length > 0) { const l = sections[sections.length - 1]; if (l.type === "metered") { ns.tsNum = l.tsNum; ns.tsDen = l.tsDen; ns.beatUnit = l.beatUnit; ns.dotted = l.dotted; ns.tempo = l.tempo; ns.grouping = l.grouping; } } setSections(p => [...p, ns]); setEditIsNew(true); setEditId(ns.id); };
  const moveSecTimer = useRef(null);
  const moveSec = (i, d) => { if (moveSecTimer.current) return; moveSecTimer.current = setTimeout(() => { moveSecTimer.current = null; }, 150); setSections(p => { const a = [...p]; if (i + d >= 0 && i + d < a.length) [a[i], a[i + d]] = [a[i + d], a[i]]; return a; }); };
  const editSec = sections.find(s => s.id === editId);

  const handleClear = () => {
    if (sections.length <= 1 && sections[0]?.tempo === 120 && sections[0]?.tsNum === 4) return;
    if (!confirmClear) { setConfirmClear(true); if (confirmTimer.current) clearTimeout(confirmTimer.current); confirmTimer.current = setTimeout(() => setConfirmClear(false), 3000); return; }
    setConfirmClear(false);
    const backup = [...sections];
    setSections([mkM()]); setEditId(null); setVideoUrl(null); setVideoSync(null); setLoadedProfileId(null);
    setUndoToast({ section: backup, index: -1 });
    if (undoTimer.current) clearTimeout(undoTimer.current);
    undoTimer.current = setTimeout(() => setUndoToast(null), 8000);
  };

  const handleDelete = id => {
    if (sections.length <= 1) return;
    const idx = sections.findIndex(s => s.id === id);
    if (idx === -1) return;
    const sec = sections[idx];
    setSections(p => p.filter(s => s.id !== id));
    setUndoToast({ section: sec, index: idx });
    if (undoTimer.current) clearTimeout(undoTimer.current);
    undoTimer.current = setTimeout(() => setUndoToast(null), 8000);
  };
  const handleUndo = () => {
    if (!undoToast) return;
    if (undoToast.index === -1 && Array.isArray(undoToast.section)) {
      setSections(undoToast.section);
    } else {
      setSections(p => { const c = [...p]; c.splice(undoToast.index, 0, undoToast.section); return c; });
    }
    setUndoToast(null); if (undoTimer.current) clearTimeout(undoTimer.current);
  };

  const handleDragStart = (e, idx) => { setDragIdx(idx); e.dataTransfer.effectAllowed = "move"; };
  const handleDragEnter = (e, idx) => { setDropIdx(idx); e.preventDefault(); };
  const handleDragOver = e => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; };
  const handleDragEnd = () => { setDragIdx(null); setDropIdx(null); };
  const handleDrop = (e, idx) => {
    e.preventDefault(); if (dragIdx === null || dragIdx === idx) { handleDragEnd(); return; }
    setSections(p => { const c = [...p]; const [m] = c.splice(dragIdx, 1); c.splice(idx, 0, m); return c; });
    handleDragEnd();
  };

  // Tap tempo in performance mode - updates current section's tempo live
  const { tap: handleLiveTapTempo, tapBpm: liveTapBpm, tapFlash: liveTapFlash } = useTapTempo(useCallback(bpm => {
    if (!ps) return;
    const si = ps.sectionIndex;
    setSections(prev => prev.map((s, i) => i === si && s.type === "metered" ? { ...s, tempo: bpm } : s));
  }, [ps]));

  return (
    <div className={sync.syncGlowPulse ? "sync-glow-pulse" : ""} style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'Outfit',sans-serif", touchAction: "manipulation", position: "relative", boxShadow: sync.isInRoom ? `inset 0 0 0 3px ${sync.SYNC_COLOR}66, inset 0 0 30px ${sync.SYNC_COLOR}22` : undefined, transition: sync.syncGlowPulse ? undefined : "box-shadow 0.4s ease" }}>
      <div className="ambient-bg" style={{ background: `radial-gradient(circle at 50% 10%, ${sync.isInRoom ? sync.SYNC_COLOR + '15' : mode === 'record' ? C.record + '15' : mode === 'practice' ? C.practice + '15' : C.downbeat + '15'}, transparent 60%)` }} />
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&family=DM+Mono:wght@400;500&family=Bebas+Neue&display=swap" rel="stylesheet" />
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0} html{touch-action:manipulation;-webkit-tap-highlight-color:transparent;-webkit-user-select:none;user-select:none}
        input,textarea{-webkit-user-select:auto;user-select:auto}
        input[type=number]::-webkit-inner-spin-button,input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none;margin:0} input[type=number]{-moz-appearance:textfield}
        ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-thumb{background:${C.border};border-radius:2px}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
        @keyframes ripple { 0% { transform: scale(1); opacity: 0.5; } 100% { transform: scale(1.6); opacity: 0; } }
        .sec-card { transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease, border-color 0.2s ease, background 0.15s; position: relative; overflow: hidden; }
        .sec-card::before { content: ''; position: absolute; inset: 0; background: linear-gradient(135deg, rgba(255,255,255,0.03) 0%, transparent 100%); opacity: 0; transition: opacity 0.3s; }
        .sec-card:hover { transform: translateY(-2px) scale(1.005); box-shadow: 0 12px 30px rgba(0,0,0,0.5); border-color: ${C.textMuted}66; background: ${C.surfaceHover} !important; }
        .sec-card:hover::before { opacity: 1; }
        .sec-card:active { transform: translateY(0) scale(0.995); }
        .glass-pill { background: rgba(20, 20, 28, 0.8); border-radius: 40px; border: 1px solid rgba(255,255,255,0.08); padding: 8px 16px; box-shadow: 0 8px 32px rgba(0,0,0,0.4); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); }
        .ambient-bg { position: fixed; inset: 0; z-index: 0; pointer-events: none; transition: background 1s ease; }
        .hdr-text { text-shadow: 0 0 20px currentColor, 0 0 40px currentColor; transition: transform 0.05s ease; }
        .pump { transform: scale(1.05); }
        .btn-ripple { position: relative; }
        .btn-ripple::before { content: ''; position: absolute; inset: 0; border-radius: 50%; background: inherit; z-index: -1; animation: ripple 2.5s cubic-bezier(0.4, 0, 0.2, 1) infinite; }
        [data-tip], [data-tip-b] { position: relative; }
        [data-tip]::after, [data-tip-b]::after { position: absolute; left: 50%; transform: translateX(-50%); background: ${C.surface}; color: ${C.text}; font-size: 11px; font-family: 'Outfit',sans-serif; padding: 4px 8px; border-radius: 6px; white-space: nowrap; pointer-events: none; opacity: 0; transition: opacity 0.1s; border: 1px solid ${C.border}; z-index: 999; }
        [data-tip]::after { content: attr(data-tip); bottom: calc(100% + 6px); }
        [data-tip-b]::after { content: attr(data-tip-b); top: calc(100% + 8px); }
        [data-tip]:hover::after, [data-tip-b]:hover::after { opacity: 1; }
        @media (pointer: coarse) { [data-tip]::after, [data-tip-b]::after { display: none; } }
        button { cursor: pointer; transition: transform 0.1s ease, background 0.15s ease, opacity 0.15s ease, border-color 0.15s ease; }
        button:hover:not(:disabled) { opacity: 0.85; }
        button:active:not(:disabled) { opacity: 0.7; transform: scale(0.98); }
        .close-btn { background: none; border: none; color: ${C.textMuted}; cursor: pointer; display: flex; align-items: center; justify-content: center; width: 44px; height: 44px; border-radius: 8px; transition: background 0.15s ease, color 0.15s ease; }
        .close-btn:hover { background: ${C.surfaceHover}; color: ${C.text}; }
        .transport-btn:hover:not(:disabled) { transform: translateY(-3px) scale(1.08) !important; box-shadow: 0 12px 36px rgba(0,0,0,0.6) !important; filter: brightness(1.1); }
        .transport-btn:active:not(:disabled) { transform: scale(0.92) !important; filter: brightness(0.9); }

        @keyframes modalFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes modalSlideUp { from { opacity: 0; transform: translateY(24px) scale(0.96); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .modal-bg { animation: modalFadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; background: rgba(0,0,0,0.7) !important; backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); }
        .modal-content { animation: modalSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; background: rgba(19, 19, 26, 0.85) !important; border: 1px solid rgba(255,255,255,0.1) !important; border-top: 1px solid rgba(255,255,255,0.2) !important; box-shadow: 0 -20px 50px rgba(139, 124, 246, 0.1), 0 -10px 40px rgba(0,0,0,0.7); backdrop-filter: blur(30px); -webkit-backdrop-filter: blur(30px); }
        .grad-text { background: linear-gradient(135deg, #ffffff 0%, #848492 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.2)); }
        @keyframes toastUp { from { transform: translate(-50%, 100%); opacity: 0; } to { transform: translate(-50%, 0); opacity: 1; } }
        .toast { animation: toastUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes syncPulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(0.8); } }
        .sync-pulse { animation: syncPulse 1.5s ease-in-out infinite; }
        @keyframes syncGlowBright { 0% { box-shadow: inset 0 0 0 3px rgba(6,182,212,0.4), inset 0 0 30px rgba(6,182,212,0.13); } 50% { box-shadow: inset 0 0 0 4px rgba(6,182,212,0.9), inset 0 0 60px rgba(6,182,212,0.35); } 100% { box-shadow: inset 0 0 0 3px rgba(6,182,212,0.4), inset 0 0 30px rgba(6,182,212,0.13); } }
        .sync-glow-pulse { animation: syncGlowBright 1.2s ease-in-out; }
      `}</style>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 16px 8px", maxWidth: 480, margin: "0 auto" }}>
        <div className="grad-text" style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, letterSpacing: 3 }}>TEMPUS</div>
        <div style={{ display: "flex", gap: 6 }}>
          {!sync.isMemberLocked && <button onClick={handleClear} data-tip-b={confirmClear ? t("toolbar.tapAgain") : t("toolbar.new")} style={{ background: confirmClear ? C.danger + "22" : "none", border: `1px solid ${confirmClear ? C.danger : C.border}`, borderRadius: 8, color: confirmClear ? C.danger : C.textMuted, padding: "6px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontFamily: "'Outfit',sans-serif", transition: "all 0.15s" }}>{confirmClear ? t("toolbar.clearQ") : I.fileNew(18)}</button>}
          {videoUrl && !sync.isMemberLocked && <button onClick={() => setShowVideo(true)} data-tip-b={t("toolbar.video")} style={{ background: "none", border: `1px solid ${C.accent}55`, borderRadius: 8, color: C.accent, padding: "6px 10px", cursor: "pointer", display: "flex", alignItems: "center", fontSize: 12, fontFamily: "'DM Mono',monospace" }}>▶</button>}
          {settings.appMode !== "basic" && !sync.isMemberLocked && <button onClick={() => setShowLib(true)} data-tip-b={t("toolbar.library")} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 8, color: C.textMuted, padding: "6px 10px", cursor: "pointer", display: "flex", alignItems: "center" }}>{I.folder(18)}</button>}
          {settings.appMode !== "basic" && !sync.isMemberLocked && <button onClick={() => setShowSave(true)} data-tip-b={t("toolbar.save")} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 8, color: C.textMuted, padding: "6px 10px", cursor: "pointer", display: "flex", alignItems: "center" }}>{I.save(18)}</button>}
          {settings.appMode !== "basic" && <button onClick={() => sync.setShowLobby(true)} data-tip-b={t("toolbar.sync")} style={{ background: sync.isInRoom ? sync.SYNC_COLOR + "22" : "none", border: `1px solid ${sync.isInRoom ? sync.SYNC_COLOR : C.border}`, borderRadius: 8, color: sync.isInRoom ? sync.SYNC_COLOR : C.textMuted, padding: "6px 10px", cursor: "pointer", display: "flex", alignItems: "center" }}>{I.sync(18)}</button>}
          <button onClick={() => setShowSet(true)} data-tip-b={t("toolbar.settings")} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 8, color: C.textMuted, padding: "6px 10px", cursor: "pointer", display: "flex", alignItems: "center" }}>{I.gear(18)}</button>
        </div>
      </div>

      <div style={{ padding: "8px 16px", maxWidth: 480, margin: "0 auto", display: "flex", gap: 16, fontSize: 12, color: C.textMuted, fontFamily: "'DM Mono',monospace" }}>
        <span>{sections.length} {tp("unit.sec", sections.length)}</span><span>{totalBars} {tp("unit.bar", totalBars)}</span>
        {totalBars > 0 && <span>{Math.ceil(tl[tl.length - 1].st + tl[tl.length - 1].dur)}s</span>}
      </div>

      {sync.isInRoom && <SyncStatusBar sync={sync} onOpenLobby={() => sync.setShowLobby(true)} />}

      <div style={{ padding: "8px 16px 120px", maxWidth: 480, margin: "0 auto", display: "flex", flexDirection: "column", gap: 6 }}>
        {sections.map((sec, i) => { const locked = sync.isMemberLocked; const noop = () => {}; return <SecCard key={sec.id} ref={el => cardRefs.current[i] = el} section={sec} index={i} total={sections.length} onClick={locked ? noop : () => { setEditIsNew(false); setEditId(sec.id); }} onStartHere={locked ? noop : () => { met.tap(); const idx = tl.findIndex(b => b.si === i); if (idx >= 0) { setMode("normal"); go(idx); } }} onMove={locked ? noop : (d => moveSec(i, d))} onDelete={locked ? null : (sections.length > 1 ? handleDelete : null)} onDragStart={locked ? noop : handleDragStart} onDragEnter={locked ? noop : handleDragEnter} onDragOver={locked ? noop : handleDragOver} onDragEnd={locked ? noop : handleDragEnd} onDrop={locked ? noop : handleDrop} dragIdx={dragIdx} dropIdx={dropIdx} onGripTouchStart={locked ? noop : onGripTouchStart} cancelTouchDrag={locked ? noop : cancelTouchDrag} tDrag={tDrag} tDropIdx={tDropIdx} />; })}
        {!sync.isMemberLocked && <button onClick={addSec} style={{ width: "100%", padding: 14, borderRadius: 10, border: `1px dashed ${C.border}`, background: "transparent", color: C.textMuted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>{I.plus(20)}</button>}
      </div>

      {/* Bottom buttons: Play / Record / Practice — hidden for members in sync room, host routes Play through sync */}
      {!sync.isMemberLocked && <div style={{ position: "fixed", bottom: 24, left: 0, right: 0, display: "flex", justifyContent: "center", zIndex: 10, pointerEvents: "none" }}>
        <div className="glass-pill" style={{ display: "flex", gap: 20, alignItems: "center", pointerEvents: "auto", padding: "10px 24px" }}>
          {settings.appMode !== "basic" && !sync.isInRoom && <button className="transport-btn" onClick={() => { met.tap(); setMode("record"); splitPoints.current = []; go(0); }} disabled={!sections.length} data-tip={t("toolbar.record")} style={{ width: 44, height: 44, borderRadius: "50%", background: C.record, border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 16px ${C.glowRecord}`, transition: "transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s" }}>{I.rec(18)}</button>}
          <button className="btn-ripple transport-btn" onClick={() => { if (sync.isInRoom && sync.isHost) { met.tap(); sync.doStart(); } else { met.tap(); setMode("normal"); go(0); } }} disabled={!sections.length || (sync.isInRoom && !sync.syncReady)} data-tip={sync.isInRoom ? (sync.syncReady ? t("toolbar.syncStart") : t("toolbar.connecting")) : t("toolbar.play")} style={{ width: 64, height: 64, borderRadius: "50%", background: sync.isInRoom ? sync.SYNC_COLOR : C.downbeat, border: "none", color: "#000", cursor: (sync.isInRoom && !sync.syncReady) ? "wait" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: (sync.isInRoom && !sync.syncReady) ? 0.4 : 1, boxShadow: `0 0 24px ${sync.isInRoom ? sync.SYNC_GLOW : C.glowDownbeat}`, transition: "transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s, opacity 0.3s" }}>{(sync.isInRoom && !sync.syncReady) ? <span style={{ fontSize: 10, fontFamily: "'DM Mono',monospace", color: "#000" }}>...</span> : I.play(28)}</button>
          {settings.appMode !== "basic" && !sync.isInRoom && <button className="transport-btn" onClick={() => setShowPrac(true)} data-tip={t("toolbar.practiceMode")} style={{ width: 44, height: 44, borderRadius: "50%", background: C.practice, border: "none", color: "#000", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 16px ${C.glowPractice}`, transition: "transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s" }}>{I.target(18)}</button>}
        </div>
      </div>}

      {ps && <PlayView ps={ps} sections={activeSections} tl={tl} onPause={() => { if (sync.isInRoom && sync.isHost) { sync.doPause(); } else { met.stop(); setIsP(false); } }} onResume={(barNum) => { if (sync.isInRoom && sync.isHost) { sync.doResume(barNum || 1); return; } met.tap(); if (!ps) return; if (ps.countIn || ps.ended) { go(0); return; } if (barNum) { const i = tl.findIndex(b => b.ab === barNum); if (i >= 0) { go(i); return; } } const i = tl.findIndex(b => b.ab === ps.absoluteBar); if (i >= 0) { setIsP(true); met.start(tl, i, settings.countIn, { accented: settings.accented, pitched: settings.pitched, muted }); } }} onRestart={() => { if (sync.isInRoom && sync.isHost) { sync.doRestart(); return; } met.tap(); go(0); }} onGoToBar={goToBar} onPrevSec={() => jumpSec(-1)} onNextSec={() => jumpSec(1)} vis={settings.visualMode} isP={isP} muted={muted} onMute={() => setMuted(m => !m)} onExit={() => { if (sync.isInRoom && sync.isHost) { sync.doStop(); } else { exitPlay(); } }} mode={sync.isInRoom ? "sync" : mode} onSplit={handleSplit} onTapTempo={sync.isInRoom ? null : handleLiveTapTempo} tapBpm={liveTapBpm} tapFlash={liveTapFlash} settings={settings} onSettings={setSettings} syncLocked={sync.isMemberLocked} />}
      {editSec && <SecEd section={editSec} appMode={settings.appMode} isNew={editIsNew} editIndex={sections.findIndex(s => s.id === editId) + 1} onSave={(u, isDup = false) => { if (isDup) { setSections(p => { const i = p.findIndex(s => s.id === editId); return [...p.slice(0, i + 1), u, ...p.slice(i + 1)]; }); } else { setSections(p => p.map(s => s.id === u.id ? u : s)); } }} onClose={() => setEditId(null)} onDelete={sections.length > 1 ? handleDelete : null} />}
      {showSet && <SetP settings={settings} onChange={setSettings} onClose={() => setShowSet(false)} />}
      {showSave && <SaveM sections={sections} onClose={() => setShowSave(false)} onSaved={(newId) => { if (newId) setLoadedProfileId(newId); }} videoUrl={videoUrl} videoSync={videoSync} loadedProfileId={loadedProfileId} />}
      {showLib && <LibP onLoad={(s, v, vs, pid) => { setSections(s); setVideoUrl(v || null); setVideoSync(vs || null); setLoadedProfileId(pid || null); }} onClose={() => setShowLib(false)} />}
      {showPrac && <PracSetup sections={sections} onStart={startPractice} onClose={() => setShowPrac(false)} />}
      {sync.showLobby && <SyncLobby sync={sync} onLoadSections={handleSyncLoadSections} />}
      <SyncToast message={sync.toast} />
      {showVideo && videoUrl && <VideoView videoUrl={videoUrl} sections={sections} tl={tl} onClose={() => setShowVideo(false)} onSyncPoints={pts => { setVideoSync(pts); setShowVideo(false); }} met={met} settings={settings} muted={muted} onUpdateSections={setSections} videoSync={videoSync} onEditSection={id => { setEditIsNew(false); setEditId(id); }} onAddSection={addSec} onDeleteSection={handleDelete} onMoveSection={moveSec} loadedProfileId={loadedProfileId} />}
      {undoToast && <div className="toast" style={{ position: "fixed", bottom: 90, left: "50%", zIndex: 60, background: C.surface, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 16, padding: "12px 20px", borderRadius: 12, boxShadow: "0 10px 40px rgba(0,0,0,0.5)" }}>
        <span style={{ fontSize: 13, color: C.text }}>{undoToast.index === -1 ? t("undo.cleared") : t("undo.deleted")}</span>
        <button onClick={handleUndo} style={{ background: "none", border: "none", color: C.accent, fontWeight: 600, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>{I.restart(14)} {t("undo.undo")}</button>
      </div>}
    </div>
  );
}
