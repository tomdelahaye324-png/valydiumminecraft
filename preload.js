const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('valydium', {
  play: () => ipcRenderer.invoke('play-minecraft'),
  close: () => ipcRenderer.invoke('close-window')
});
