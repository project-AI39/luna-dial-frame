import { contextBridge, ipcRenderer } from "electron";

// フロントエンドからアプリ終了を要求するための安全な API を公開
contextBridge.exposeInMainWorld("appAPI", {
  closeApp: () => ipcRenderer.invoke("app-quit"),
});
