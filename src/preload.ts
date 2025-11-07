import { contextBridge, ipcRenderer } from "electron";

// フロントエンドからアプリ操作を要求するための安全な API を公開
contextBridge.exposeInMainWorld("appAPI", {
  // アプリを終了する
  closeApp: () => ipcRenderer.invoke("app-quit"),

  // ウィンドウを最小化する
  minimize: () => ipcRenderer.invoke("app-minimize"),

  // 最大化（最大化されていれば最大化解除、されていなければ最大化）
  toggleMaximize: () => ipcRenderer.invoke("app-toggle-maximize"),

  // フルスクリーンの切替
  toggleFullScreen: () => ipcRenderer.invoke("app-toggle-fullscreen"),
});
