// Electron 메인 프로세스: 창을 만들고, 화면(React)에서 요청하는 OS 기능을 처리합니다.
const { app, BrowserWindow, ipcMain, powerMonitor, shell, dialog, globalShortcut } = require('electron');
const path = require('path');
const fs = require('fs');
const { exec, spawn } = require('child_process');

// 예전 이름(Planner Personal, Planner 등)의 데이터 폴더가 있으면 그중 가장 최근에 쓴 곳을 찾아서,
// Daterbase 폴더가 아직 없으면 이름을 Daterbase 로 바꿔 씁니다. (바꾸지 못하면 예전 폴더를 그대로 써요)
(() => {
  const appData = app.getPath('appData');
  const lastUsed = (dir) => {
    try {
      return fs.statSync(path.join(dir, 'Local Storage')).mtimeMs;
    } catch (e) {
      return -1;
    }
  };
  const best = ['Daterbase', 'Planner Personal', 'Planner', 'Yeonkki Planner', 'Cherish Planner', 'Petal Planner']
    .map((n) => path.join(appData, n))
    .filter((d) => lastUsed(d) >= 0)
    .sort((a, b) => lastUsed(b) - lastUsed(a))[0];
  let use = best;
  const dst = path.join(appData, 'Daterbase');
  if (best && best !== dst && !fs.existsSync(dst)) {
    try { fs.renameSync(best, dst); use = dst; } catch (e) {}
  }
  if (use) app.setPath('userData', use);
})();


/* ───────── 프로그램은 하나만 실행 ─────────
   이미 켜져 있는데(위젯·자동 실행 등) 또 실행하면, 두 번째 프로그램은 데이터 저장소가 잠겨 있어 빈 화면(초기화된 것처럼)으로 떠요.
   그래서 두 번째 실행은 바로 끝내고, 이미 켜진 프로그램의 창을 앞으로 가져와요. */
// 작업 표시줄·점프 목록 이름을 설치 바로가기(Daterbase)와 맞춤
if (process.platform === 'win32') app.setAppUserModelId('com.yeonkki.daterbase');
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
  process.exit(0);
}
app.on('second-instance', () => {
  try {
    if (!win || win.isDestroyed()) createWindow();
    else {
      if (win.isMinimized()) win.restore();
      win.show();
      win.focus();
    }
  } catch (e) {}
});

/* ───────── 자동 업데이트: 설치 파일을 다시 받지 않아도 화면(웹앱)이 최신으로 바뀝니다 ─────────
   실행할 때 웹 주소의 version.json 을 확인 → 새 버전이면 파일을 내려받아 userData/live 에 저장 →
   "지금 적용할까요?" 물어보고, 적용하면 그 화면으로 다시 불러옵니다. (데이터는 그대로예요)
   인터넷이 없거나 실패해도 기존 화면으로 그냥 실행돼요. */
// 친구용 설치 파일은 package.json에 dbShare가 붙어서 만들어져요 (친구용 설치파일 만들기.bat). 그러면 친구용 주소와 dist-share 화면을 써요.
let DB_SHARE = false;
try { DB_SHARE = !!require('../package.json').dbShare; } catch (e) {}
// 주소 이전 때 DB_ORG만 바꿔 새 설치 파일을 만듦 (옛 설치본은 옛 주소 저장소에서 계속 업데이트 받음)
const DB_ORG = 'daterbase';
/*pc0918*/ // 2026-11 도메인 이사: 새 주소 먼저, 안 되면 옛 주소 (저장소 바꾸기 전까지)
const LIVE_URLS = DB_SHARE ? ['https://app.daterbase.net/share/', 'https://' + DB_ORG + '.github.io/daterbase/share/'] : ['https://me.daterbase.net/', 'https://' + DB_ORG + '.github.io/daterbase/'];
let LIVE_URL = LIVE_URLS[0];
// 개인용 새 주소는 잠겨 있어서 PC는 서비스 토큰으로 열어요. 값은 userData/cf-access.json 에만 있음.
let cfAcc = null;
const cfHdr = () => {
  if (cfAcc === null) {
    cfAcc = {};
    try { const j = JSON.parse(fs.readFileSync(path.join(app.getPath('userData'), 'cf-access.json'), 'utf8').replace(/^\uFEFF/, '')); if (j && j.id && j.secret) cfAcc = { 'CF-Access-Client-Id': String(j.id).trim(), 'CF-Access-Client-Secret': String(j.secret).trim() }; } catch (e) {}
  }
  return cfAcc;
};
/*pc0919*/ // Cloudflare는 .html 주소를 / 나 /m 으로 돌려보내요: 같은 주소 안이면 토큰 머리글을 붙인 채 따라가요
const liveFetch = async (u, o) => {
  let r;
  for (let i = 0; i < 4; i++) {
    r = await fetch(u, { ...(o || {}), redirect: 'manual', headers: { ...((o && o.headers) || {}), ...(/^https:\/\/me\.daterbase\.net\//.test(u) ? cfHdr() : {}) } });
    if (r.status < 300 || r.status >= 400) return r;
    const loc = r.headers.get('location');
    if (!loc) return r;
    let nu;
    try { nu = new URL(loc, u); } catch (e) { return r; }
    if (nu.origin !== new URL(u).origin) return r;
    u = nu.href;
  }
  return r;
};
const DIST = path.join(__dirname, DB_SHARE ? '../dist-share' : '../dist');
const readVer = (dir) => {
  try {
    return Number(JSON.parse(fs.readFileSync(path.join(dir, 'version.json'), 'utf8')).v) || 0;
  } catch (e) {
    return 0;
  }
};
const readApp = (dir) => {
  try {
    const j = JSON.parse(fs.readFileSync(path.join(dir, 'version.json'), 'utf8'));
    if (j.app) return String(j.app);
    const m = fs.readFileSync(path.join(dir, 'index.html'), 'utf8').match(/APP_VER="([^"]+)"/);
    return m ? m[1] : '';
  } catch (e) {
    return '';
  }
};
let updFrom = '';
let updNs = '';
let updTo = '';
const liveDir = () => path.join(app.getPath('userData'), 'live');
function startFile() {
  try {
    const dist = DIST;
    const live = liveDir();
    if (fs.existsSync(path.join(live, 'index.html')) && readVer(live) > readVer(dist)) return path.join(live, 'index.html');
  } catch (e) {}
  return path.join(DIST, 'index.html');
}
let updating = false;
let lastCheck = 0;
async function checkUpdate() {
  if (updating || typeof fetch !== 'function') return;
  updating = true;
  try {
    let info = null;
    for (const base of LIVE_URLS) {
      try {
        const r = await liveFetch(base + 'version.json?t=' + Date.now(), { cache: 'no-store', redirect: 'manual' });
        if (!r.ok) continue;
        const j = await r.json();
        if (j && j.v) { info = j; LIVE_URL = base; break; }
      } catch (e) {}
    }
    if (!info) return;
    const v = Number(info.v) || 0;
    const files = Array.isArray(info.files) ? info.files.filter((f) => /^[\w.\-]+$/.test(f)) : [];
    const dist = DIST;
    const live = liveDir();
    if (!v || !files.includes('index.html') || v <= Math.max(readVer(dist), readVer(live))) return;
    if (!updFrom) {
      const cur = fs.existsSync(path.join(live, 'index.html')) && readVer(live) > readVer(dist) ? live : dist;
      updFrom = readApp(cur);
    }
    const tmp = live + '.new';
    fs.rmSync(tmp, { recursive: true, force: true });
    fs.mkdirSync(tmp, { recursive: true });
    const H = info.h && typeof info.h === 'object' ? info.h : {};
    const sameAs = (fp, h) => {
      try {
        return require('crypto').createHash('sha1').update(fs.readFileSync(fp)).digest('hex').slice(0, 10) === h;
      } catch (e) {
        return false;
      }
    };
    for (const f of files) {
      // 내용이 그대로인 파일(글꼴·번역표 등)은 다시 받지 않고 갖고 있는 것을 복사
      const keep = H[f] && [path.join(live, f), path.join(dist, f)].find((fp) => sameAs(fp, H[f]));
      if (keep) {
        fs.copyFileSync(keep, path.join(tmp, f));
        continue;
      }
      let rr = null;
      for (const b of [LIVE_URL, ...LIVE_URLS.filter((x) => x !== LIVE_URL)]) {
        try { const x = await liveFetch(b + f + '?v=' + v, { cache: 'no-store' }); if (x.ok) { rr = x; break; } } catch (e) {}
      }
      if (!rr) throw new Error(f);
      fs.writeFileSync(path.join(tmp, f), Buffer.from(await rr.arrayBuffer()));
    }
    // 글꼴·아이콘처럼 잘 안 바뀌는 파일은 설치된 것을 그대로 복사
    for (const f of fs.readdirSync(dist)) {
      if (['main.js', 'main.css', 'index.html', 'sw.js'].includes(f) || files.includes(f)) continue;
      if (!fs.existsSync(path.join(tmp, f))) fs.copyFileSync(path.join(dist, f), path.join(tmp, f));
    }
    updTo = info.app ? String(info.app) : readApp(tmp);
    try { const cv = Math.max(readVer(dist), readVer(live)); updNs = (Array.isArray(info.ns) ? info.ns : []).filter((x) => Array.isArray(x) && Number(x[0]) > cv && x[1]).sort((a, b) => b[0] - a[0]).slice(0, 3).map((x) => String(x[1]).slice(0, 60)).join(' · '); } catch (e) { updNs = ''; }
    fs.writeFileSync(path.join(tmp, 'version.json'), JSON.stringify({ v, app: updTo }));
    fs.rmSync(live, { recursive: true, force: true });
    fs.renameSync(tmp, live);
    askUpdate();
  } catch (e) {
    /* 업데이트는 실패해도 앱 사용에는 영향 없음 */
  } finally {
    updating = false;
    lastCheck = Date.now();
  }
}
// 창이 숨겨져 있거나 최소화돼 있으면 알림 창이 안 보이니, 작업 표시줄을 깜빡이고 창을 열 때 물어봐요
let askPending = false;
let lastAsk = 0;
let askAbort = null;
async function askUpdate() {
  if (!win || win.isDestroyed()) return;
  // 같은 버전 안의 작은 수정은 묻지 않음: 다음 실행 때 live 폴더로 자동 적용돼요
  if (updFrom && updTo && updFrom === updTo && DB_SHARE) { askPending = false; return; }
  // 개인용은 자주 올라가서 3시간에 한 번만 물어요. 그 사이 받은 건 다음에 켤 때 자동으로 바뀌어요
  if (!DB_SHARE && Date.now() - lastAsk < 3 * 60 * 60 * 1000) { askPending = false; return; }
  if (!win.isVisible() || win.isMinimized()) { askPending = true; try { win.flashFrame(true); } catch (e) {} return; }
  askPending = false;
  try { win.flashFrame(false); } catch (e) {}
  const live = liveDir();
  // 오래 켜 두면 15분마다 새 버전을 받아 알림 창이 쌓였음 → 앞 창은 닫고 가장 최신 것 하나만
  if (askAbort) { try { askAbort.abort(); } catch (e) {} }
  const ac = new AbortController();
  askAbort = ac;
  lastAsk = Date.now();
  const { response } = await dialog.showMessageBox(win, {
    signal: ac.signal,
    type: 'info',
    buttons: ['지금 적용', '나중에'],
    defaultId: 0,
    cancelId: 1,
    title: 'Daterbase 업데이트',
    message: '새 버전을 받았어요.' + (updFrom && updTo && updFrom !== updTo ? `  (${updFrom} → ${updTo})` : updTo ? `  (${updTo})` : ''),
    detail: (updNs ? '바뀐 것: ' + updNs + '\n\n' : '') + '지금 적용하면 화면이 새로 고쳐져요. 데이터는 그대로예요. (나중에를 고르면 다음 실행 때 자동 적용돼요)',
  });
  if (askAbort !== ac) return;
  askAbort = null;
  if (response === 0 && win && !win.isDestroyed()) {
    updFrom = updTo;
    win.loadFile(path.join(live, 'index.html'));
    for (const [id, w] of wgWins) if (!w.isDestroyed()) w.loadFile(path.join(live, 'index.html'), { hash: 'wg=' + id });
  }
}

/* ───────── 프로그램 자동 업데이트 (0.9.16부터): 설치 파일을 다시 받지 않아도 프로그램 자체가 새 버전으로 바뀌어요 ─────────
   GitHub 릴리스의 latest.yml(친구용은 friend.yml)을 확인 → 새 버전이면 뒤에서 받아 둠 →
   "지금 다시 시작 / 나중에" 물어보고, 나중에를 고르면 프로그램을 끌 때 저절로 설치돼요. 실패해도 앱 사용에는 영향 없음. */
let appUpdAsked = '';
function setupAppUpdate() {
  if (!app.isPackaged) return;
  let au;
  try { au = require('electron-updater').autoUpdater; } catch (e) { return; }
  // 확인 기록: userData/app-update.log (문제 생기면 이 파일만 보면 돼요, 200KB 넘으면 새로 씀)
  const lf = path.join(app.getPath('userData'), 'app-update.log');
  const lg = (lv) => (...a) => { try { if (fs.existsSync(lf) && fs.statSync(lf).size > 200000) fs.rmSync(lf); fs.appendFileSync(lf, new Date().toISOString() + ' ' + lv + ' ' + a.map(String).join(' ') + '\n'); } catch (e) {} };
  au.logger = { info: lg('info'), warn: lg('warn'), error: lg('error'), debug: () => {} };
  au.autoDownload = true;
  au.autoInstallOnAppQuit = true;
  au.on('error', () => {});
  au.on('update-downloaded', async (info) => {
    const nv = String((info && info.version) || '');
    if (!win || win.isDestroyed() || appUpdAsked === nv) return;
    appUpdAsked = nv;
    try {
      const { response } = await dialog.showMessageBox(win, {
        type: 'info',
        buttons: ['지금 다시 시작', '나중에'],
        defaultId: 0,
        cancelId: 1,
        title: 'Daterbase 프로그램 업데이트',
        message: '새 프로그램을 받아 두었어요.' + (nv ? `  (${app.getVersion()} → ${nv})` : ''),
        detail: '지금 다시 시작하면 바로 바뀌어요. 나중에를 고르면 프로그램을 끌 때 저절로 설치돼요. 데이터는 그대로예요.',
      });
      if (response === 0) setImmediate(() => { try { au.quitAndInstall(true, true); } catch (e) {} });
    } catch (e) {}
  });
  const chk = () => { try { au.checkForUpdates().catch(() => {}); } catch (e) {} };
  setTimeout(chk, 20 * 1000);
  setInterval(chk, 6 * 60 * 60 * 1000);
}

let win = null;
let normalBounds = null;

/* 창 크기·위치 기억 (끄고 켜도 그대로) */
const wsFile = () => path.join(app.getPath('userData'), 'win-state.json');
function wsLoad() {
  try {
    const st = JSON.parse(fs.readFileSync(wsFile(), 'utf8'));
    if (!st || !(st.width >= 300) || !(st.height >= 360)) return null;
    const { screen } = require('electron');
    const ok = screen.getAllDisplays().some((d) => {
      const a = d.workArea;
      return st.x + 80 > a.x && st.x < a.x + a.width - 80 && st.y >= a.y - 10 && st.y < a.y + a.height - 60;
    });
    return ok ? st : { width: st.width, height: st.height, max: st.max };
  } catch (e) { return null; }
}
let wsT = 0;
function wsSave(now) {
  clearTimeout(wsT);
  const go = () => {
    try {
      if (!win || win.isDestroyed() || normalBounds || win.isMinimized() || win.isFullScreen()) return;
      const max = win.isMaximized();
      let prev = null; try { prev = JSON.parse(fs.readFileSync(wsFile(), 'utf8')); } catch (e) {}
      const b = max && prev ? { x: prev.x, y: prev.y, width: prev.width, height: prev.height } : win.getBounds();
      fs.writeFileSync(wsFile(), JSON.stringify({ ...b, max }));
    } catch (e) {}
  };
  if (now) go(); else wsT = setTimeout(go, 500);
}

function createWindow() {
  const ws = wsLoad();
  win = new BrowserWindow({
    width: (ws && ws.width) || 1440,
    height: (ws && ws.height) || 1000,
    ...(ws && ws.x != null ? { x: ws.x, y: ws.y } : {}),
    minWidth: 300,
    minHeight: 360,
    title: 'Daterbase',
    icon: currentIconPath(),
    backgroundColor: '#FBF3F5',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
    },
  });

  if (ws && ws.max) win.maximize();
  win.on('resize', () => wsSave());
  win.on('move', () => wsSave());
  win.on('maximize', () => wsSave());
  win.on('unmaximize', () => wsSave());
  win.on('close', () => wsSave(true));

  // 타임테이블 새 창: 메뉴 없이, '맨 위 고정'을 고른 경우 항상 위에 띄움
  win.webContents.setWindowOpenHandler(({ url, features }) => {
    if (String(url).includes('#rail')) {
      return {
        action: 'allow',
        overrideBrowserWindowOptions: {
          autoHideMenuBar: true,
          alwaysOnTop: /alwaysOnTop=yes/.test(String(features || '')),
          title: 'Daterbase 타임테이블',
          icon: currentIconPath(),
          minWidth: 280,
          minHeight: 320,
          webPreferences: { preload: path.join(__dirname, 'preload.cjs'), contextIsolation: true },
        },
      };
    }
    // 바깥 사이트(시트·문의 폼·링크)는 큰 새 창 대신 메인 창 오른쪽에 작은 위젯 창으로 띄움
    let wb = { x: undefined, y: undefined };
    try {
      const mb = win.getBounds();
      wb = { x: Math.max(0, mb.x + mb.width - 500), y: mb.y + 60 };
    } catch (e) {}
    return {
      action: 'allow',
      overrideBrowserWindowOptions: {
        width: Number((String(features || '').match(/width=(\d+)/) || [])[1]) || 460,
        height: Number((String(features || '').match(/height=(\d+)/) || [])[1]) || 680,
        x: wb.x,
        y: wb.y,
        minWidth: 280,
        minHeight: 240,
        autoHideMenuBar: true,
        alwaysOnTop: true,
        minimizable: false,
        skipTaskbar: true,
        title: 'Daterbase',
        icon: currentIconPath(),
      },
    };
  });
  win.on('page-title-updated', (e) => {
    e.preventDefault();
    win.setTitle('Daterbase');
  });
  win.webContents.on('did-create-window', (child, { url }) => {
    if (String(url).includes('#rail')) {
      try { child.removeMenu(); } catch (e) {}
      child.webContents.setWindowOpenHandler(() => ({ action: 'allow', overrideBrowserWindowOptions: { autoHideMenuBar: true } }));
    } else {
      try { child.removeMenu(); } catch (e) {}
    }
  });

  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (devUrl) win.loadURL(devUrl);
  else win.loadFile(startFile());
  // 최소화했다가 다시 열면 '항상 맨 위' 위젯도 같이 다시 띄움
  win.on('restore', () => wgWake());
  win.on('show', () => wgWake());
}

/* ───────── 작업 타이머용: 지금 맨 앞에 있는 창의 프로그램 이름 ─────────
   Windows: PowerShell을 하나 띄워 두고 1초마다 맨 앞 창의 프로세스 이름을 받아옵니다.
   Mac: osascript 로 맨 앞 앱 이름을 물어봅니다. (처음에 '손쉬운 사용/자동화' 권한을 물을 수 있어요) */
let foreground = '';
let fgWatcher = null;
let fgTimer = null;

const WIN_FG_SCRIPT = `
$sig = @'
using System;
using System.Runtime.InteropServices;
public class DaterbaseFG {
  [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr h, out uint pid);
}
'@
Add-Type -TypeDefinition $sig
while ($true) {
  $h = [DaterbaseFG]::GetForegroundWindow()
  $p = [uint32]0
  [void][DaterbaseFG]::GetWindowThreadProcessId($h, [ref]$p)
  $n = ''
  try { $n = (Get-Process -Id $p -ErrorAction Stop).ProcessName } catch {}
  [Console]::Out.WriteLine($n)
  [Console]::Out.Flush()
  Start-Sleep -Milliseconds 800
}
`;

function startForegroundWatcher() {
  if (process.platform === 'win32') {
    fgWatcher = spawn(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', WIN_FG_SCRIPT],
      { windowsHide: true }
    );
    let buf = '';
    fgWatcher.stdout.on('data', (chunk) => {
      buf += chunk.toString();
      const lines = buf.split(/\r?\n/);
      buf = lines.pop();
      const last = lines.filter(Boolean).pop();
      if (last !== undefined) foreground = last.trim();
    });
    fgWatcher.on('exit', () => (fgWatcher = null));
  } else if (process.platform === 'darwin') {
    const cmd = `osascript -e 'tell application "System Events" to get name of first application process whose frontmost is true'`;
    fgTimer = setInterval(() => exec(cmd, (err, out) => { if (!err) foreground = out.trim(); }), 1000);
  } else {
    // 리눅스: xdotool 이 설치되어 있으면 사용
    const cmd = 'ps -p $(xdotool getwindowpid $(xdotool getactivewindow)) -o comm=';
    fgTimer = setInterval(() => exec(cmd, (err, out) => { if (!err) foreground = out.trim(); }), 1000);
  }
}

// 1초마다 { 맨 앞 프로그램, 마지막 입력 후 지난 초 } 를 화면으로 보냄
// getSystemIdleTime: 키보드·마우스·타블렛 펜 입력이 마지막으로 있었던 뒤 지난 시간(초)
function startActivityTicker() {
  setInterval(() => {
    if (!win || win.isDestroyed()) return;
    win.webContents.send('activity', {
      foreground,
      idle: powerMonitor.getSystemIdleTime(),
    });
  }, 1000);
}

/* ───────── 내 아이콘으로 바꾸기 ─────────
   화면에서 256×256 PNG를 받아서
   1) 창·작업 표시줄 아이콘을 바꾸고
   2) Windows 바로가기(바탕화면·시작 메뉴·작업 표시줄 고정)의 아이콘도 바꿉니다.
   설치 파일 자체(.exe)의 아이콘은 만들 때 정해져서 바꿀 수 없어요. */
const DEFAULT_ICON = path.join(__dirname, 'icon.png');
const customPng = () => path.join(app.getPath('userData'), 'custom-icon.png');
const customIco = () => path.join(app.getPath('userData'), 'custom-icon.ico');
const currentIconPath = () => (fs.existsSync(customPng()) ? customPng() : DEFAULT_ICON);

// PNG 한 장을 그대로 담은 .ico 파일 만들기 (Windows Vista 이후 지원 형식)
function pngToIco(png) {
  const header = Buffer.alloc(22);
  header.writeUInt16LE(0, 0); // 예약
  header.writeUInt16LE(1, 2); // 종류: 아이콘
  header.writeUInt16LE(1, 4); // 이미지 1장
  header.writeUInt8(0, 6); // 너비 256 (0 = 256)
  header.writeUInt8(0, 7); // 높이 256
  header.writeUInt8(0, 8);
  header.writeUInt8(0, 9);
  header.writeUInt16LE(1, 10); // 색 평면
  header.writeUInt16LE(32, 12); // 32비트
  header.writeUInt32LE(png.length, 14);
  header.writeUInt32LE(22, 18); // 이미지가 시작하는 위치
  return Buffer.concat([header, png]);
}

function shortcutPaths() {
  const name = `${app.getName()}.lnk`;
  const roaming = app.getPath('appData');
  return [
    path.join(app.getPath('desktop'), name),
    path.join(roaming, 'Microsoft', 'Windows', 'Start Menu', 'Programs', name),
    path.join(roaming, 'Microsoft', 'Internet Explorer', 'Quick Launch', 'User Pinned', 'TaskBar', name),
  ];
}

// icoPath 가 없으면 원래 아이콘(프로그램 파일)으로 되돌림
function updateShortcuts(icoPath) {
  if (process.platform !== 'win32' || !app.isPackaged) return 0;
  let n = 0;
  for (const p of shortcutPaths()) {
    try {
      if (!fs.existsSync(p)) continue;
      shell.readShortcutLink(p);
      if (shell.writeShortcutLink(p, 'update', { icon: icoPath || process.execPath, iconIndex: 0 })) n++;
    } catch (e) {
      /* 바로가기를 못 바꿔도 계속 */
    }
  }
  return n;
}

ipcMain.handle('set-app-icon', (_e, bytes) => {
  try {
    if (bytes) {
      const png = Buffer.from(bytes);
      fs.writeFileSync(customPng(), png);
      fs.writeFileSync(customIco(), pngToIco(png));
    } else {
      fs.rmSync(customPng(), { force: true });
      fs.rmSync(customIco(), { force: true });
    }
    const iconPath = currentIconPath();
    if (win && !win.isDestroyed()) win.setIcon(iconPath);
    if (process.platform === 'darwin' && app.dock) app.dock.setIcon(iconPath);
    const shortcuts = updateShortcuts(bytes ? customIco() : null);
    return { ok: true, shortcuts, packaged: app.isPackaged };
  } catch (e) {
    return { ok: false, error: String(e.message || e) };
  }
});

// 지금 실행 중인 프로그램 이름 목록 (작업 타이머에 추가할 때 고르기용)
ipcMain.handle('list-processes', () =>
  new Promise((resolve) => {
    const isWin = process.platform === 'win32';
    const cmd = isWin ? 'tasklist /fo csv /nh' : 'ps -axco comm=';
    exec(cmd, { windowsHide: true, maxBuffer: 1024 * 1024 * 8 }, (err, out) => {
      if (err) return resolve([]);
      const names = out
        .split(/\r?\n/)
        .map((line) => (isWin ? (line.split('","')[0] || '').replace(/^"/, '') : line.trim()))
        .filter(Boolean);
      resolve([...new Set(names)].sort((a, b) => a.localeCompare(b)));
    });
  })
);

// 지금 창을 항상 위에 띄우기 / 풀기 (타임테이블 새 창의 '맨 위 고정')
ipcMain.handle('get-login', () => { try { return !!app.getLoginItemSettings().openAtLogin; } catch (e) { return false; } });
ipcMain.handle('set-login', (_e, on) => { try { app.setLoginItemSettings({ openAtLogin: !!on }); return !!app.getLoginItemSettings().openAtLogin === !!on; } catch (e) { return false; } });
ipcMain.handle('set-top', (e, on) => {
  const w = BrowserWindow.fromWebContents(e.sender);
  if (!w) return false;
  w.setAlwaysOnTop(!!on, 'floating');
  return !!on;
});

// 미니 모드: 창을 작게 줄이고 항상 위에 띄움
ipcMain.handle('set-mini', (_e, on) => {
  if (!win) return false;
  if (on) {
    normalBounds = win.getBounds();
    win.setSize(320, 440);
    win.setAlwaysOnTop(true, 'floating');
  } else {
    win.setAlwaysOnTop(false);
    if (normalBounds) win.setBounds(normalBounds);
  }
  return on;
});

/* ───────── 구글 캘린더 연동 (로그인·API 호출은 여기서 처리해요) ─────────
   로그인은 기본 브라우저에서 하고, 결과는 내 컴퓨터(127.0.0.1)로만 돌아와요. 로그인 정보(갱신 토큰)는 이 컴퓨터에만 저장돼요. */
const http = require('http');
const crypto = require('crypto');
const gcFile = () => path.join(app.getPath('userData'), 'gcal-token.json');
let gcAcc = null;
const gcRead = () => {
  try {
    return JSON.parse(fs.readFileSync(gcFile(), 'utf8'));
  } catch (e) {
    return {};
  }
};
const gcWrite = (o) => {
  try {
    fs.writeFileSync(gcFile(), JSON.stringify(o));
  } catch (e) {}
};
// 기본 클라이언트는 비밀값 없이 제보 서버(gctok)가 대신 토큰을 받아 줌 (srv = 화면 쪽이 넘겨 준 서버 주소)
async function gcTokenReq(params, srv) {
  if (srv && !params.client_secret && /^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(srv)) {
    const { client_secret, ...q } = params;
    try {
      const r = await fetch(srv, { method: 'POST', body: JSON.stringify({ a: 'gctok', ...q }) });
      const j = await r.json().catch(() => ({}));
      return { status: j && j.access_token ? 200 : 400, json: j || {} };
    } catch (e) {
      return { status: 0, json: { error: 'server', error_description: '로그인 서버에 연결할 수 없어요. 잠시 뒤 다시 시도해 주세요.' } };
    }
  }
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(params).toString(),
  });
  return { status: r.status, json: await r.json().catch(() => ({})) };
}
ipcMain.handle('gcal-token', async (_e, { cid, secret, interactive, scope, force, srv: gsrv }) => {
  try {
    const CAL = 'https://www.googleapis.com/auth/calendar';
    const OKS = [CAL, 'https://www.googleapis.com/auth/tasks', 'https://www.googleapis.com/auth/drive.file'];
    const SC = [CAL, ...String(scope || '').split(' ').filter((x) => x !== CAL && OKS.includes(x))].filter((x, i, a) => a.indexOf(x) === i).join(' ');
    if (force) gcAcc = null;
    if (gcAcc && gcAcc.cid === cid && gcAcc.exp > Date.now() + 60000) return { token: gcAcc.at };
    const saved = gcRead();
    if (saved.refresh && saved.cid === cid && !force) {
      const r = await gcTokenReq({ client_id: cid, client_secret: secret || '', grant_type: 'refresh_token', refresh_token: saved.refresh }, gsrv);
      if (r.status === 200 && r.json.access_token) {
        gcAcc = { at: r.json.access_token, exp: Date.now() + (r.json.expires_in || 3600) * 1000, cid };
        return { token: gcAcc.at };
      }
      if (r.json.error === 'invalid_grant') gcWrite({});
    }
    if (!interactive) return { token: null };
    const verifier = crypto.randomBytes(32).toString('base64url');
    const challenge = crypto.createHash('sha256').update(verifier).digest('base64url');
    const state = crypto.randomBytes(8).toString('hex');
    const got = await new Promise((resolve, reject) => {
      let port = 0;
      const timer = setTimeout(() => {
        srv.close();
        reject(new Error('로그인 시간이 지났어요. 다시 시도해 주세요.'));
      }, 180000);
      const srv = http.createServer((req, res) => {
        const u = new URL(req.url, 'http://127.0.0.1');
        if (u.pathname !== '/') {
          res.writeHead(404);
          res.end();
          return;
        }
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end('<meta charset="utf-8"><body style="font-family:sans-serif;text-align:center;margin-top:20vh"><h2>Daterbase 연결 완료</h2><p>이 창은 닫아도 돼요.</p></body>');
        clearTimeout(timer);
        srv.close();
        const code = u.searchParams.get('code');
        if (u.searchParams.get('state') !== state) reject(new Error('로그인 확인에 실패했어요.'));
        else if (code) resolve({ code, port });
        else reject(new Error(u.searchParams.get('error') || '로그인이 취소됐어요.'));
      });
      srv.listen(0, '127.0.0.1', () => {
        port = srv.address().port;
        const url =
          'https://accounts.google.com/o/oauth2/v2/auth?' +
          new URLSearchParams({
            client_id: cid,
            redirect_uri: `http://127.0.0.1:${port}`,
            response_type: 'code',
            scope: SC,
            code_challenge: challenge,
            code_challenge_method: 'S256',
            state,
            access_type: 'offline',
            prompt: 'consent',
          }).toString();
        shell.openExternal(url);
      });
    });
    const r = await gcTokenReq({
      client_id: cid,
      client_secret: secret || '',
      code: got.code,
      code_verifier: verifier,
      grant_type: 'authorization_code',
      redirect_uri: `http://127.0.0.1:${got.port}`,
    }, gsrv);
    if (r.status !== 200 || !r.json.access_token) return { error: r.json.error_description || r.json.error || '로그인에 실패했어요.' };
    gcAcc = { at: r.json.access_token, exp: Date.now() + (r.json.expires_in || 3600) * 1000, cid };
    if (r.json.refresh_token) gcWrite({ refresh: r.json.refresh_token, cid, sc: SC });
    return { token: gcAcc.at };
  } catch (e) {
    return { error: String((e && e.message) || e) };
  }
});
ipcMain.handle('gcal-fetch', async (_e, { url, method, token, body }) => {
  if (!/^https:\/\/www\.googleapis\.com\/(calendar\/v3|tasks\/v1)\//.test(String(url))) return { status: 400, json: null };
  try {
    const r = await fetch(url, {
      method: method || 'GET',
      headers: { Authorization: 'Bearer ' + token, ...(body ? { 'Content-Type': 'application/json' } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    return { status: r.status, json: r.status === 204 ? null : await r.json().catch(() => null) };
  } catch (e) {
    return { status: 0, json: { error: { message: '인터넷에 연결할 수 없어요.' } } };
  }
});
// 구글 드라이브 동기화: 드라이브 주소만, 글(문자열) 본문만
ipcMain.handle('gd-fetch', async (_e, { url, method, token, body, ct }) => {
  const u = String(url || '');
  if (!/^https:\/\/www\.googleapis\.com\/(drive\/v3|upload\/drive\/v3)\//.test(u)) return { status: 400, text: '' };
  try {
    const r = await fetch(u, { method: method || 'GET', headers: { Authorization: 'Bearer ' + token, ...(ct ? { 'Content-Type': ct } : {}) }, body: typeof body === 'string' ? body : undefined });
    return { status: r.status, text: await r.text().catch(() => ''), location: r.headers.get('location') || null };
  } catch (e) {
    return { status: 0, text: '' };
  }
});
ipcMain.handle('gcal-logout', () => {
  gcAcc = null;
  gcWrite({});
});


/* ───────── 바탕화면 위젯: 테두리 없는 작은 창 (위치·크기·맨 위 여부를 widgets.json 에 저장) ───────── */
const wgFile = () => path.join(app.getPath('userData'), 'widgets.json');
let wgs = [];
const wgWins = new Map();
const wgLoad = () => { try { wgs = JSON.parse(fs.readFileSync(wgFile(), 'utf8')) || []; } catch (e) { wgs = []; } };
const wgSave = () => { try { fs.writeFileSync(wgFile(), JSON.stringify(wgs)); } catch (e) {} };
const wgFind = (id) => wgs.find((w) => w.id === id);
function wgApplyTop(w, on) {
  try {
    if (on) w.setAlwaysOnTop(true, 'floating');
    else w.setAlwaysOnTop(false);
  } catch (e) {}
}
let mnKey = '', mnAt = 0;
ipcMain.handle('memo-key', () => mnKey);
function wgOpenWin(cfg) {
  const old = wgWins.get(cfg.id);
  if (old && !old.isDestroyed()) { old.show(); return old; }
  // 메모지 창은 작업표시줄의 Daterbase 아이콘 밑에 같이 묶여 보여요
  const memo = String(cfg.kind || '').startsWith('memo:');
  const w = new BrowserWindow({
    x: cfg.x, y: cfg.y, width: cfg.mini ? WG_MINI[0] : (cfg.w || 300), height: cfg.mini ? WG_MINI[1] : (cfg.h || 360),
    minWidth: cfg.mini ? 60 : memo ? 220 : 140, minHeight: cfg.mini ? 30 : 100,
    frame: false, transparent: true, backgroundColor: '#00000000', hasShadow: false,
    resizable: false, maximizable: false, minimizable: memo, fullscreenable: false,
    skipTaskbar: !memo, show: false,
    title: memo ? 'Daterbase 메모지' : 'Daterbase 위젯', icon: currentIconPath(),
    webPreferences: { preload: path.join(__dirname, 'preload.cjs'), contextIsolation: true, backgroundThrottling: true },
  });
  wgApplyTop(w, !!cfg.top);
  if (cfg.op && cfg.op < 1) w.setOpacity(cfg.op);
  w.loadFile(startFile(), { hash: 'wg=' + cfg.id });
  w.once('ready-to-show', () => {
    // 단축키로 만든 새 메모는 바로 앞에 띄우고 글쓰기 커서까지
    if (memo && Date.now() - mnAt < 6000) {
      mnAt = 0;
      w.show(); w.setAlwaysOnTop(true); w.focus(); w.moveTop();
      setTimeout(() => { if (!w.isDestroyed()) { wgApplyTop(w, !!cfg.top); w.focus(); } }, 400);
    } else w.showInactive();
  });
  let t = null;
  const keep = () => {
    clearTimeout(t);
    t = setTimeout(() => {
      if (w.isDestroyed()) return;
      const b = w.getBounds();
      if (cfg.mini) Object.assign(cfg, { x: b.x, y: b.y });
      else Object.assign(cfg, { x: b.x, y: b.y, w: b.width, h: b.height });
      wgSave();
    }, 400);
  };
  w.on('move', keep);
  w.on('resize', keep);
  w.on('closed', () => wgWins.delete(cfg.id));
  wgWins.set(cfg.id, w);
  return w;
}
function wgWake() {
  try {
    for (const cfg of wgs) {
      if (!cfg.top) continue;
      let w = wgWins.get(cfg.id);
      if (!w || w.isDestroyed()) w = wgOpenWin(cfg);
      else { if (w.isMinimized()) w.restore(); w.showInactive(); }
      wgApplyTop(w, true);
      try { w.moveTop(); } catch (e) {}
    }
  } catch (e) {}
}
const WG_MINI = [150, 40];
const WG_SIZE = { todo: [320, 420], pomo: [260, 300], cal: [440, 420], note: [260, 240], img: [240, 240], dev: [300, 380] };
ipcMain.handle('wg-list', () => wgs.map((w) => ({ id: w.id, kind: w.kind, top: !!w.top, op: w.op || 1 })));
ipcMain.handle('wg-get', (_e, id) => wgFind(id) || null);
// 메모지 창 돌려보기 (Alt+←/→): 지금 창 기준 앞뒤 메모지 창으로
ipcMain.handle('wg-cycle', (e, dir) => {
  const ids = wgs.filter((c) => String(c.kind).startsWith('memo:') && wgWins.has(c.id) && !wgWins.get(c.id).isDestroyed()).map((c) => c.id);
  if (!ids.length) return false;
  let cur = -1;
  for (const [id, w] of wgWins) if (w.webContents === e.sender) cur = ids.indexOf(id);
  const next = ids[((cur < 0 ? 0 : cur + (dir < 0 ? -1 : 1)) + ids.length) % ids.length];
  const w = wgWins.get(next);
  if (w.isMinimized()) w.restore();
  w.show(); w.focus();
  return true;
});
ipcMain.handle('wg-open', (_e, kind) => {
  const sz = WG_SIZE[kind] || (String(kind).startsWith('memo:') ? [250, 220] : [300, 300]);
  const { screen } = require('electron');
  const wa = screen.getPrimaryDisplay().workArea;
  const n = wgs.length;
  const cfg = { id: 'w' + Date.now().toString(36), kind: String(kind), top: false, op: 1, w: sz[0], h: sz[1], x: wa.x + wa.width - sz[0] - 40 - (n % 5) * 30, y: wa.y + 40 + (n % 5) * 30 };
  wgs.push(cfg);
  wgSave();
  wgOpenWin(cfg);
  return cfg;
});
ipcMain.handle('wg-set', (_e, id, p) => {
  const cfg = wgFind(id);
  if (!cfg) return null;
  if (p && 'top' in p) cfg.top = !!p.top;
  if (p && 'op' in p) cfg.op = Math.max(0.3, Math.min(1, Number(p.op) || 1));
  wgSave();
  const w = wgWins.get(id);
  if (w && !w.isDestroyed()) {
    wgApplyTop(w, !!cfg.top);
    w.setOpacity(cfg.op || 1);
    w.webContents.send('wg-cfg', cfg);
  }
  return cfg;
});
ipcMain.handle('wg-close', (_e, id) => {
  wgs = wgs.filter((w) => w.id !== id);
  wgSave();
  const w = wgWins.get(id);
  if (w && !w.isDestroyed()) w.close();
  return true;
});
ipcMain.handle('wg-size', (_e, id, ww, hh) => {
  const w = wgWins.get(id);
  if (!w || w.isDestroyed()) return false;
  const b = w.getBounds();
  w.setBounds({ x: b.x, y: b.y, width: Math.max(140, Math.round(ww)), height: Math.max(100, Math.round(hh)) });
  return true;
});
ipcMain.handle('wg-mini', (_e, id, on) => {
  const cfg = wgFind(id);
  if (!cfg) return null;
  cfg.mini = !!on;
  wgSave();
  const w = wgWins.get(id);
  if (w && !w.isDestroyed()) {
    const b = w.getBounds();
    if (on) { w.setMinimumSize(60, 30); w.setBounds({ x: b.x, y: b.y, width: WG_MINI[0], height: WG_MINI[1] }); }
    else { w.setBounds({ x: b.x, y: b.y, width: cfg.w || 300, height: cfg.h || 360 }); w.setMinimumSize(140, 100); }
  }
  return cfg;
});
// 끄는 동안 크기는 처음 잰 값으로 고정 (Windows 배율 125%·150%에서 getBounds→setBounds를 되풀이하면 1px씩 커지던 문제)
const wgDragSz = new Map();
ipcMain.on('wg-move', (_e, id, x, y) => {
  const w = wgWins.get(id);
  if (!w || w.isDestroyed()) return;
  let d = wgDragSz.get(id);
  if (!d) { const b = w.getBounds(); d = { width: b.width, height: b.height, t: 0 }; wgDragSz.set(id, d); }
  clearTimeout(d.t);
  d.t = setTimeout(() => wgDragSz.delete(id), 500);
  w.setBounds({ x: Math.round(x), y: Math.round(y), width: d.width, height: d.height });
});
// Electron에는 window.prompt()가 없어서 작은 입력 창으로 대신함 (화면 쪽은 동기 호출 그대로)
ipcMain.on('db-prompt', (e, msg, def) => {
  const parent = BrowserWindow.fromWebContents(e.sender);
  let done = false;
  const fin = (v) => { if (done) return; done = true; e.returnValue = v; if (pw && !pw.isDestroyed()) pw.destroy(); };
  const esc = (t) => String(t == null ? '' : t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const html = `<!doctype html><meta charset="utf-8"><title>-</title><style>
html,body{margin:0;height:100%;background:#fff;color:#222;font:14px/1.5 'Pretendard Variable',Pretendard,'Malgun Gothic',sans-serif}
form{box-sizing:border-box;height:100%;padding:18px;display:flex;flex-direction:column;gap:12px}
label{word-break:keep-all;white-space:pre-wrap}input{font:inherit;padding:8px 10px;border:1px solid #ccc;border-radius:8px;outline:none}input:focus{border-color:#555}
.b{display:flex;justify-content:flex-end;gap:8px;margin-top:auto}button{font:inherit;padding:6px 16px;border-radius:999px;border:1px solid #ccc;background:#fff;cursor:pointer}button[type=submit]{background:#222;color:#fff;border-color:#222}
</style><form id="f"><label for="i">${esc(msg)}</label><input id="i" value="${esc(def)}" autofocus><div class="b"><button type="button" id="c">취소</button><button type="submit">확인</button></div></form>
<script>const i=document.getElementById('i');i.select();document.getElementById('f').onsubmit=(ev)=>{ev.preventDefault();document.title='OK:'+encodeURIComponent(i.value)};document.getElementById('c').onclick=()=>{document.title='NO'};addEventListener('keydown',(ev)=>{if(ev.key==='Escape')document.title='NO'})</script>`;
  const pw = new BrowserWindow({ parent: parent || undefined, modal: !!parent, width: 380, height: 190, resizable: false, minimizable: false, maximizable: false, show: false, autoHideMenuBar: true, title: 'Daterbase', webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true } });
  pw.webContents.on('page-title-updated', (_ev, t) => { if (t === 'NO') fin(null); else if (t.startsWith('OK:')) fin(decodeURIComponent(t.slice(3))); });
  pw.webContents.on('will-navigate', (ev) => ev.preventDefault());
  pw.on('closed', () => fin(null));
  pw.once('ready-to-show', () => pw.show());
  pw.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));
});
ipcMain.handle('wg-focus', (_e, id) => {
  let w = wgWins.get(id);
  const cfg = wgFind(id);
  if ((!w || w.isDestroyed()) && cfg) w = wgOpenWin(cfg);
  if (!w || w.isDestroyed()) return false;
  w.show();
  w.moveTop();
  w.focus();
  if (!cfg || !cfg.top) { w.setAlwaysOnTop(true, 'floating'); setTimeout(() => { if (!w.isDestroyed() && !(wgFind(id) || {}).top) w.setAlwaysOnTop(false); }, 1500); }
  return true;
});
ipcMain.handle('wg-main', () => {
  if (!win || win.isDestroyed()) createWindow();
  else { if (win.isMinimized()) win.restore(); win.show(); win.focus(); }
  return true;
});


/* ───────── PC 자동 백업: 화면에서 보내 준 데이터(JSON)를 userData/backups 에 날짜별로 저장 (최근 14개) ───────── */
const bkDir = () => path.join(app.getPath('userData'), 'backups');
const bkSafe = (n) => /^auto-[\w-]+\.json$/.test(String(n));
ipcMain.handle('bk-save', (_e, json) => {
  try {
    const txt = String(json || '');
    if (txt.length < 50) return false;
    fs.mkdirSync(bkDir(), { recursive: true });
    const d = new Date();
    const day = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    let f = path.join(bkDir(), 'auto-' + day + '.json');
    // 오늘 백업보다 훨씬 작으면(데이터가 날아간 상태일 수 있음) 덮어쓰지 않고 따로 저장
    try { if (fs.statSync(f).size > txt.length * 2.5) f = path.join(bkDir(), 'auto-' + day + '-small.json'); } catch (e) {}
    fs.writeFileSync(f + '.tmp', txt);
    fs.renameSync(f + '.tmp', f);
    const all = fs.readdirSync(bkDir()).filter(bkSafe).sort().reverse();
    for (const old of all.slice(14)) fs.rmSync(path.join(bkDir(), old), { force: true });
    return true;
  } catch (e) {
    return false;
  }
});
ipcMain.handle('bk-list', () => {
  try {
    return fs.readdirSync(bkDir()).filter(bkSafe).map((n) => { const st = fs.statSync(path.join(bkDir(), n)); return { name: n, size: st.size, mtime: st.mtimeMs }; }).sort((a, b) => b.mtime - a.mtime);
  } catch (e) {
    return [];
  }
});
ipcMain.handle('bk-read', (_e, n) => {
  if (!bkSafe(n)) return null;
  try { return fs.readFileSync(path.join(bkDir(), n), 'utf8'); } catch (e) { return null; }
});
/* ───────── 개발 메모 위젯: 메모를 개발메모.md 에 쌓고, Claude 채팅은 기본 브라우저로 열기 ───────── */
const dmCfg = () => path.join(app.getPath('userData'), 'devmemo.json');
function dmDir() {
  try { const c = JSON.parse(fs.readFileSync(dmCfg(), 'utf8')); if (c.dir && fs.existsSync(c.dir)) return c.dir; } catch (e) {}
  const d = path.join(app.getPath('documents'), '클로드 제작', 'Daterbase');
  return fs.existsSync(d) ? d : app.getPath('userData');
}
const dmFile = () => path.join(dmDir(), '개발메모.md');
const dmEnsure = () => { const f = dmFile(); if (!fs.existsSync(f)) fs.writeFileSync(f, '# Daterbase 개발 메모\n\n'); return f; };
ipcMain.handle('dm-add', (_e, txt) => {
  try { fs.appendFileSync(dmEnsure(), String(txt || '').slice(0, 20000) + '\n'); return true; } catch (e) { return false; }
});
ipcMain.handle('dm-open', () => { try { shell.openPath(dmEnsure()); return true; } catch (e) { return false; } });
ipcMain.handle('dm-pick', async () => {
  const r = await dialog.showOpenDialog({ title: '개발메모.md 를 둘 폴더', properties: ['openDirectory'], defaultPath: dmDir() });
  if (r.canceled || !r.filePaths[0]) return null;
  try { fs.writeFileSync(dmCfg(), JSON.stringify({ dir: r.filePaths[0] })); return dmFile(); } catch (e) { return null; }
});
// 개발자 모드: 고칠 곳 캡처를 개발메모_캡처 폴더에 PNG로 저장하고 상대 경로를 돌려줌
ipcMain.handle('dev-shot', async (e, r) => {
  try {
    const rect = r && r.width > 0 && r.height > 0 ? { x: Math.max(0, r.x | 0), y: Math.max(0, r.y | 0), width: r.width | 0, height: r.height | 0 } : undefined;
    const img = await e.sender.capturePage(rect);
    const d = path.join(dmDir(), '개발메모_캡처');
    fs.mkdirSync(d, { recursive: true });
    const t = new Date(), p2 = (n) => String(n).padStart(2, '0');
    const n = t.getFullYear() + p2(t.getMonth() + 1) + p2(t.getDate()) + '-' + p2(t.getHours()) + p2(t.getMinutes()) + p2(t.getSeconds()) + '.png';
    fs.writeFileSync(path.join(d, n), img.toPNG());
    return '개발메모_캡처/' + n;
  } catch (err) { return null; }
});
// 개발 메모 이미지: data URL(jpeg/png)을 개발메모_캡처 폴더에 파일로 저장하고 상대 경로를 돌려줌
ipcMain.handle('dm-img', (_e, du) => {
  try {
    const m = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/.exec(String(du || ''));
    if (!m) return null;
    const d = path.join(dmDir(), '개발메모_캡처');
    fs.mkdirSync(d, { recursive: true });
    const t = new Date(), p2 = (n) => String(n).padStart(2, '0');
    const n = t.getFullYear() + p2(t.getMonth() + 1) + p2(t.getDate()) + '-' + p2(t.getHours()) + p2(t.getMinutes()) + p2(t.getSeconds()) + '-' + Math.random().toString(36).slice(2, 6) + '.' + (m[1] === 'jpeg' ? 'jpg' : m[1]);
    fs.writeFileSync(path.join(d, n), Buffer.from(m[2], 'base64'));
    return '개발메모_캡처/' + n;
  } catch (err) { return null; }
});
ipcMain.handle('open-ext', (_e, url) => {
  url = String(url);
  if (!/^https:\/\//.test(url)) return false;
  // claude.ai 주소는 Claude 데스크톱 앱이 깔려 있으면 앱으로 연다 (없으면 브라우저)
  if (/^https:\/\/claude\.ai\//.test(url)) {
    let hasApp = false;
    try { hasApp = !!app.getApplicationNameForProtocol('claude://'); } catch (e) {}
    if (hasApp) { shell.openExternal('claude://' + url.slice(8)).catch(() => shell.openExternal(url)); return 'app'; }
  }
  shell.openExternal(url);
  return true;
});

ipcMain.handle('bk-open', () => { try { fs.mkdirSync(bkDir(), { recursive: true }); shell.openPath(bkDir()); return true; } catch (e) { return false; } });

// /*wPcCache*/ 웹 캐시 상한 100MB (무게 점검 2026-11-03)
try { app.commandLine.appendSwitch('disk-cache-size', String(100 * 1024 * 1024)); } catch (e) {}
app.whenReady().then(() => {
  try {
    const f = path.join(app.getPath('userData'), 'cache-trim-1103');
    if (!fs.existsSync(f)) { require('electron').session.defaultSession.clearCache().then(() => { try { fs.writeFileSync(f, '1'); } catch (e) {} }).catch(() => {}); }
  } catch (e) {}
  // 화면 안에서 개인용 새 주소를 읽을 때(업데이트 알림 등)도 서비스 토큰을 붙여요
  try { const h = cfHdr(); if (h['CF-Access-Client-Id']) require('electron').session.defaultSession.webRequest.onBeforeSendHeaders({ urls: ['https://me.daterbase.net/*'] }, (d, cb) => cb({ requestHeaders: { ...d.requestHeaders, ...h } })); } catch (e) {}
  createWindow();
  // Ctrl+Alt+N: 어디서든 새 메모지 (다른 프로그램이 쓰고 있으면 Ctrl+Shift+Alt+N)
  const memoNew = () => {
    mnAt = Date.now();
    if (!win || win.isDestroyed()) createWindow();
    const go = () => { try { win.webContents.send('memo-new'); } catch (e) {} };
    if (win.webContents.isLoading()) win.webContents.once('did-finish-load', () => setTimeout(go, 800)); else go();
  };
  for (const k of ['Control+Alt+N', 'Control+Shift+Alt+N']) {
    try { if (globalShortcut.register(k, memoNew)) { mnKey = k; break; } } catch (e) {}
  }
  wgLoad();
  for (const c of wgs) { try { wgOpenWin(c); } catch (e) {} }
  setTimeout(checkUpdate, 6000);
  setupAppUpdate();
  // 15분마다, 그리고 창을 다시 볼 때(마지막 확인 5분 뒤부터) 새 버전을 확인해요
  setInterval(checkUpdate, 15 * 60 * 1000);
  app.on('browser-window-focus', (_e, w) => {
    if (w !== win) return;
    if (askPending) askUpdate();
    else if (Date.now() - lastCheck > 5 * 60 * 1000) checkUpdate();
  });
  // 업데이트 설치로 바로가기 아이콘이 기본으로 돌아갔을 수 있어서, 내 아이콘이 있으면 다시 적용
  if (fs.existsSync(customIco())) updateShortcuts(customIco());
  startForegroundWatcher();
  startActivityTicker();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('will-quit', () => {
  try { globalShortcut.unregisterAll(); } catch (e) {}
  if (fgWatcher) fgWatcher.kill();
  if (fgTimer) clearInterval(fgTimer);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

/* ───────── 유튜브 임베드용 작은 내 컴퓨터 서버 (127.0.0.1) ─────────
   영상을 GitHub 주소 대신 내 컴퓨터 주소(http://127.0.0.1:포트)를 거쳐 띄워요. 데이터는 그대로예요. */
const EMBED_HTML = "<!doctype html><meta charset=utf-8><meta name=viewport content=\"width=device-width,initial-scale=1\"><style>html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#000}iframe{display:block;position:absolute;inset:0;width:100%;height:100%;border:0}</style><script>var q=new URLSearchParams(location.search),v=q.get(\"v\"),l=q.get(\"list\"),s=q.get(\"start\"),p=[];if(l)p.push(\"list=\"+encodeURIComponent(l));if(s)p.push(\"start=\"+encodeURIComponent(s));if(q.get(\"api\")===\"1\"){p.push(\"enablejsapi=1\");p.push(\"playsinline=1\");p.push(\"rel=0\");p.push(\"origin=\"+encodeURIComponent(location.origin))}document.write('<iframe scrolling=\"no\" src=\"https://www.'+(q.get(\"ck\")===\"1\"?\"youtube.com\":\"youtube-nocookie.com\")+'/embed/'+(v?encodeURIComponent(v):\"videoseries\")+\"?\"+p.join(\"&\")+'\" allow=\"autoplay; encrypted-media; fullscreen; picture-in-picture\" allowfullscreen></iframe>')</script><script>(function(){var f=document.querySelector(\"iframe\");if(!f)return;window.addEventListener(\"message\",function(e){if(e.source===parent&&f.contentWindow){f.contentWindow.postMessage(e.data,\"*\")}else if(f&&e.source===f.contentWindow){parent.postMessage(e.data,\"*\")}})})()</script>\n";
let embedBase = null;
(() => {
  const srv = require('http').createServer((req, res) => {
    const u = String(req.url || '');
    if (u.startsWith('/embed.html')) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
      res.end(EMBED_HTML);
    } else {
      res.writeHead(404);
      res.end();
    }
  });
  let port = 47213, tries = 0;
  srv.on('error', () => {
    if (++tries > 15) return;
    port += 1;
    srv.listen(port, '127.0.0.1');
  });
  srv.on('listening', () => {
    embedBase = 'http://127.0.0.1:' + port + '/';
  });
  srv.listen(port, '127.0.0.1');
})();
ipcMain.on('embed-base', (e) => {
  e.returnValue = embedBase;
});
