/// <reference types="vite/client" />

interface ElectronAPI {
  saveFile: (filename: string, content: string) => Promise<boolean>
}

declare interface Window {
  electronAPI: ElectronAPI
}
