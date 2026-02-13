const { app, BrowserWindow } = require("electron");
const path = require("path");
const { spawn } = require("child_process");
const fs = require("fs");
const net = require("net");

const PORT = 3099;
const isDev = !app.isPackaged;

let mainWindow;
let serverProcess;

function getDataDir() {
  if (isDev) {
    return path.join(__dirname, "..", "data");
  }
  const userDataDir = path.join(app.getPath("userData"), "data");
  if (!fs.existsSync(userDataDir)) {
    fs.mkdirSync(userDataDir, { recursive: true });
  }
  // Copy initial database if it doesn't exist yet
  const dbDest = path.join(userDataDir, "scope.db");
  if (!fs.existsSync(dbDest)) {
    const bundledDb = path.join(process.resourcesPath, "data", "scope.db");
    if (fs.existsSync(bundledDb)) {
      fs.copyFileSync(bundledDb, dbDest);
    }
  }
  return userDataDir;
}

function getEnvFilePath() {
  if (isDev) {
    return path.join(__dirname, "..", ".env");
  }
  return path.join(process.resourcesPath, ".env");
}

function loadEnvFile(envPath) {
  const env = {};
  if (fs.existsSync(envPath)) {
    const contents = fs.readFileSync(envPath, "utf-8");
    for (const line of contents.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const value = trimmed.slice(eqIdx + 1).trim();
      env[key] = value;
    }
  }
  return env;
}

function startNextServer() {
  const dataDir = getDataDir();
  const envFile = loadEnvFile(getEnvFilePath());

  let serverPath;
  let cwd;
  if (isDev) {
    serverPath = path.join(__dirname, "..", ".next", "standalone", "server.js");
    cwd = path.join(__dirname, "..", ".next", "standalone");
  } else {
    serverPath = path.join(process.resourcesPath, "standalone", "server.js");
    cwd = path.join(process.resourcesPath, "standalone");
  }

  const env = {
    ...process.env,
    ...envFile,
    ELECTRON_RUN_AS_NODE: "1",
    PORT: String(PORT),
    HOSTNAME: "localhost",
    NEXTAUTH_URL: `http://localhost:${PORT}`,
    ELECTRON_DATA_DIR: dataDir,
  };

  serverProcess = spawn(process.execPath, [serverPath], {
    cwd,
    env,
    stdio: ["pipe", "pipe", "pipe"],
    windowsHide: true,
  });

  serverProcess.on("error", (err) => {
    console.error("Failed to start Next.js server:", err);
  });

  serverProcess.on("exit", (code) => {
    serverProcess = null;
  });
}

function waitForServer(maxRetries = 30) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const tryConnect = () => {
      attempts++;
      const socket = new net.Socket();
      socket.setTimeout(1000);
      socket.on("connect", () => {
        socket.destroy();
        resolve();
      });
      socket.on("timeout", () => {
        socket.destroy();
        if (attempts >= maxRetries) {
          reject(new Error("Server did not start in time"));
        } else {
          setTimeout(tryConnect, 500);
        }
      });
      socket.on("error", () => {
        socket.destroy();
        if (attempts >= maxRetries) {
          reject(new Error("Server did not start in time"));
        } else {
          setTimeout(tryConnect, 500);
        }
      });
      socket.connect(PORT, "localhost");
    };
    tryConnect();
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
    title: "Solution Scoping Platform",
    autoHideMenuBar: true,
  });

  mainWindow.loadURL(`http://localhost:${PORT}`);

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  startNextServer();
  try {
    await waitForServer();
  } catch (err) {
    console.error(err.message);
    app.quit();
    return;
  }
  createWindow();
});

app.on("window-all-closed", () => {
  app.quit();
});

app.on("before-quit", () => {
  if (serverProcess) {
    serverProcess.kill();
    serverProcess = null;
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});
