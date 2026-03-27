import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  saveFile: (filename: string, content: string): Promise<boolean> => {
    return ipcRenderer.invoke('save-file', filename, content)
  },
})
