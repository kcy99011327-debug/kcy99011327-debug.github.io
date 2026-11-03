// 화면(React) 쪽에 안전하게 열어 주는 기능 목록. 화면에서는 window.planner 로 사용합니다.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('planner', {
  isElectron: true,
  // window.prompt 대신 (Electron엔 없음)
  promptSync: (m, d) => { try { return ipcRenderer.sendSync('db-prompt', m, d); } catch (e) { return null; } },
  // 유튜브 임베드용 내 컴퓨터 주소 (없으면 null)
  embedBase: (() => { try { return ipcRenderer.sendSync('embed-base'); } catch (e) { return null; } })(),
  // 구글 캘린더 연동 (로그인/호출은 메인 프로세스에서)
  gcalToken: (o) => ipcRenderer.invoke('gcal-token', o),
  gcSrv: true, // 0.9.14~: 기본 클라이언트 토큰을 제보 서버로 받음
  gcalFetch: (o) => ipcRenderer.invoke('gcal-fetch', o),
  gdOk: true, // 0.9.15~: 구글 드라이브 동기화
  auOk: true, // 0.9.16~: 프로그램 자동 업데이트 (이게 없으면 화면이 '새 PC 프로그램 받기'를 띄움)
  gdFetch: (o) => ipcRenderer.invoke('gd-fetch', o),
  gcalLogout: () => ipcRenderer.invoke('gcal-logout'),
  listProcesses: () => ipcRenderer.invoke('list-processes'),
  setMini: (on) => ipcRenderer.invoke('set-mini', on),
  setTop: (on) => ipcRenderer.invoke('set-top', on),
  // 컴퓨터 켤 때 자동 실행
  getLogin: () => ipcRenderer.invoke('get-login'),
  setLogin: (on) => ipcRenderer.invoke('set-login', on),
  // 바탕화면 위젯
  wgList: () => ipcRenderer.invoke('wg-list'),
  wgGet: (id) => ipcRenderer.invoke('wg-get', id),
  wgOpen: (kind) => ipcRenderer.invoke('wg-open', kind),
  wgSet: (id, p) => ipcRenderer.invoke('wg-set', id, p),
  wgClose: (id) => ipcRenderer.invoke('wg-close', id),
  wgSize: (id, w, h) => ipcRenderer.invoke('wg-size', id, w, h),
  wgMain: () => ipcRenderer.invoke('wg-main'),
  wgFocus: (id) => ipcRenderer.invoke('wg-focus', id),
  wgMini: (id, on) => ipcRenderer.invoke('wg-mini', id, on),
  wgMove: (id, x, y) => ipcRenderer.send('wg-move', id, x, y),
  // 메모지: 창 돌려보기, Ctrl+Alt+N 새 메모
  wgCycle: (d) => ipcRenderer.invoke('wg-cycle', d),
  memoKey: () => ipcRenderer.invoke('memo-key'),
  onMemoNew: (cb) => {
    const h = () => cb();
    ipcRenderer.on('memo-new', h);
    return () => ipcRenderer.removeListener('memo-new', h);
  },
  // PC 자동 백업
  bkSave: (json) => ipcRenderer.invoke('bk-save', json),
  bkList: () => ipcRenderer.invoke('bk-list'),
  bkRead: (n) => ipcRenderer.invoke('bk-read', n),
  bkOpen: () => ipcRenderer.invoke('bk-open'),
  // 개발 메모 위젯
  devMemo: (txt) => ipcRenderer.invoke('dm-add', txt),
  devMemoOpen: () => ipcRenderer.invoke('dm-open'),
  devMemoPick: () => ipcRenderer.invoke('dm-pick'),
  devShot: (r) => ipcRenderer.invoke('dev-shot', r),
  devImg: (dataUrl) => ipcRenderer.invoke('dm-img', dataUrl),
  openExt: (url) => ipcRenderer.invoke('open-ext', url),
  // 내 아이콘으로 바꾸기: 256×256 PNG 바이트(Uint8Array), 기본으로 되돌릴 땐 null
  setAppIcon: (bytes) => ipcRenderer.invoke('set-app-icon', bytes),
  // 1초마다 { foreground: 맨 앞 프로그램 이름, idle: 마지막 입력 후 지난 초 } 를 받음
  onActivity: (cb) => {
    const handler = (_e, data) => cb(data);
    ipcRenderer.on('activity', handler);
    return () => ipcRenderer.removeListener('activity', handler);
  },
});
