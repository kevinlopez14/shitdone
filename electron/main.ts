import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import { fileURLToPath } from 'url'
import path from 'path'
import fs from 'fs/promises'
import * as vaultCrypto from './vault-crypto'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

let mainWindow: BrowserWindow | null = null

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#0F1117',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  mainWindow = win

  vaultCrypto.setLockCallback(() => {
    mainWindow?.webContents.send('vault:auto-locked');
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

ipcMain.handle('save-file', async (_event, filename: string, content: string) => {
  const { filePath, canceled } = await dialog.showSaveDialog({
    defaultPath: filename,
  })

  if (canceled || !filePath) {
    return false
  }

  await fs.writeFile(filePath, content, 'utf-8')
  return true
})

ipcMain.handle('vault:setup', (_event, password: string) => {
  return vaultCrypto.setup(password);
});

ipcMain.handle('vault:unlock', (_event, password: string, salt: string, verificationHash: string) => {
  return vaultCrypto.unlock(password, salt, verificationHash);
});

ipcMain.handle('vault:lock', () => {
  vaultCrypto.lock();
});

ipcMain.handle('vault:encrypt', (_event, plaintext: string) => {
  return vaultCrypto.encrypt(plaintext);
});

ipcMain.handle('vault:decrypt', (_event, encrypted: string, iv: string, authTag: string) => {
  return vaultCrypto.decrypt(encrypted, iv, authTag);
});

ipcMain.handle('vault:is-unlocked', () => {
  return vaultCrypto.isUnlocked();
});

ipcMain.handle('vault:change-password', (_event, oldPw: string, newPw: string, salt: string, hash: string) => {
  return vaultCrypto.changePassword(oldPw, newPw, salt, hash);
});

ipcMain.handle('vault:ping', () => {
  vaultCrypto.ping();
});

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
