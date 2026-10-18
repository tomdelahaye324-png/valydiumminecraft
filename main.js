const { app, BrowserWindow, ipcMain, shell, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

const SERVER_ADDRESS = 'join1.severoo.com:55230';

function createWindow() {
  const win = new BrowserWindow({
    width: 1180,
    height: 760,
    minWidth: 900,
    minHeight: 620,
    backgroundColor: '#080711',
    autoHideMenuBar: true,
    title: 'VALYDIUM Launcher',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  win.loadFile(path.join(__dirname, 'index.html'));
}

function getSavedLauncherPath() {
  try {
    const configPath = path.join(app.getPath('userData'), 'launcher-config.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    if (config.launcherPath && fs.existsSync(config.launcherPath)) return config.launcherPath;
  } catch (_) {}
  return null;
}

function saveLauncherPath(launcherPath) {
  const configPath = path.join(app.getPath('userData'), 'launcher-config.json');
  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  fs.writeFileSync(configPath, JSON.stringify({ launcherPath }, null, 2), 'utf8');
}

function findMinecraftLauncher() {
  if (process.platform !== 'win32') return null;
  const local = process.env.LOCALAPPDATA || '';
  const programFiles = process.env.ProgramFiles || 'C:\\Program Files';
  const programFilesX86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';
  const candidates = [
    path.join(local, 'Programs', 'Minecraft Launcher', 'MinecraftLauncher.exe'),
    path.join(programFiles, 'Minecraft Launcher', 'MinecraftLauncher.exe'),
    path.join(programFilesX86, 'Minecraft Launcher', 'MinecraftLauncher.exe'),
    path.join(local, 'Microsoft', 'WindowsApps', 'Minecraft.exe')
  ];
  return candidates.find(p => p && fs.existsSync(p)) || null;
}

async function chooseMinecraftLauncher() {
  const result = await dialog.showOpenDialog({
    title: 'Sélectionne Minecraft Launcher',
    message: 'Le launcher Minecraft n’a pas été détecté. Choisis MinecraftLauncher.exe (ou Minecraft.exe si tu utilises la version Microsoft Store).',
    properties: ['openFile'],
    filters: [{ name: 'Application Windows', extensions: ['exe'] }],
    defaultPath: process.env.ProgramFiles || 'C:\\Program Files'
  });
  if (result.canceled || !result.filePaths || !result.filePaths[0]) return null;
  const selected = result.filePaths[0];
  if (!fs.existsSync(selected)) return null;
  saveLauncherPath(selected);
  return selected;
}

function startLauncher(launcherPath) {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (result) => {
      if (settled) return;
      settled = true;
      resolve(result);
    };
    try {
      const child = spawn(launcherPath, [], { detached: true, stdio: 'ignore' });
      child.once('error', (error) => finish({ ok: false, error: error.message }));
      child.once('spawn', () => {
        child.unref();
        finish({ ok: true });
      });
    } catch (error) {
      finish({ ok: false, error: error.message });
    }
  });
}

async function launchMinecraft() {
  // Use a path the user selected previously; otherwise try common install locations.
  let launcherPath = getSavedLauncherPath() || findMinecraftLauncher();
  if (!launcherPath) {
    launcherPath = await chooseMinecraftLauncher();
    if (!launcherPath) {
      return { ok: false, message: 'Aucun launcher sélectionné. Clique sur JOUER puis choisis MinecraftLauncher.exe pour réessayer.' };
    }
  }

  let result = await startLauncher(launcherPath);
  if (result.ok) {
    return {
      ok: true,
      message: 'Minecraft Launcher a été démarré. Si Microsoft te demande de te connecter, fais-le dans le launcher officiel. La connexion automatique au serveur n’est pas encore garantie par ce projet.'
    };
  }

  // If an automatically detected or saved path no longer works, let the user choose another one.
  const retryPath = await chooseMinecraftLauncher();
  if (!retryPath) {
    return { ok: false, message: 'Impossible de lancer ce fichier. Sélectionne le vrai MinecraftLauncher.exe et réessaie.' };
  }
  result = await startLauncher(retryPath);
  if (result.ok) {
    return {
      ok: true,
      message: 'Minecraft Launcher a été démarré avec le chemin que tu as sélectionné. La connexion automatique au serveur n’est pas encore garantie par ce projet.'
    };
  }
  return { ok: false, message: 'Windows n’a pas pu démarrer ce fichier. Sélectionne MinecraftLauncher.exe depuis son dossier d’installation.' };
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('close-window', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) win.close();
  return { ok: true };
});

ipcMain.handle('play-minecraft', async () => launchMinecraft());
