import { app, BrowserWindow, Menu, ipcMain, clipboard } from "electron";
import path from "node:path";
import started from "electron-squirrel-startup";
import windowStateKeeper from "electron-window-state";

if (started) {
  app.quit();
}

const createWindow = () => {
  const mainWindowState = windowStateKeeper({
    defaultWidth: 800,
    defaultHeight: 600,
  });

  const mainWindow = new BrowserWindow({
    minHeight: 300,
    minWidth: 300,
    x: mainWindowState.x,
    y: mainWindowState.y,
    width: mainWindowState.width,
    height: mainWindowState.height,
    autoHideMenuBar: true,

    frame: false, // OSのウィンドウバーとボタンを全て消す

    /* タイトルバーを非表示にしてコンテンツを全面表示し、Windows/Linuxではシステムのウィンドウ操作ボタンをオーバーレイで重ねる設定
     * titleBarStyle: 'hidden',              // タイトルバー非表示
     * ...(isMac ? {} : { titleBarOverlay: true }), // Win/Linux: オーバーレイ有効
     * titleBarOverlay: { color: '#2f3241', symbolColor: '#ffffff', height: 48 }, // タイトルバーの色と高さを設定
     */

    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // ウィンドウの状態を追跡
  mainWindowState.manage(mainWindow);

  // フルスクリーン状態の変更を監視
  mainWindow.on("enter-full-screen", () => {
    mainWindow.webContents.send("fullscreen-changed", true);
  });

  mainWindow.on("leave-full-screen", () => {
    mainWindow.webContents.send("fullscreen-changed", false);
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
    // 開発中は DevTools を開く
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)
    );
  }
};

app.on("ready", () => {
  Menu.setApplicationMenu(null);
  createWindow();
});

ipcMain.handle("app-quit", () => {
  app.quit();
  return { ok: true };
});

// レンダラーからウィンドウ操作を受け付けるハンドラ
ipcMain.handle("app-minimize", () => {
  const win = BrowserWindow.getFocusedWindow();
  if (win) {
    win.minimize();
    return { ok: true };
  }
  return { ok: false, error: "no-window" };
});

ipcMain.handle("app-toggle-maximize", () => {
  const win = BrowserWindow.getFocusedWindow();
  if (win) {
    if (win.isMaximized()) {
      win.unmaximize();
    } else {
      win.maximize();
    }
    return { ok: true, maximized: win.isMaximized() };
  }
  return { ok: false, error: "no-window" };
});

ipcMain.handle("app-toggle-fullscreen", () => {
  const win = BrowserWindow.getFocusedWindow();
  if (win) {
    const isFull = win.isFullScreen();
    win.setFullScreen(!isFull);
    return { ok: true, isFullScreen: !isFull };
  }
  return { ok: false, error: "no-window" };
});

ipcMain.handle("app-write-clipboard", (_event, text: string) => {
  clipboard.writeText(text);
  return { ok: true };
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
