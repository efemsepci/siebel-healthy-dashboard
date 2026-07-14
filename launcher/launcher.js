const { spawn, exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const waitOn = require("wait-on");

const updater = require("./updater");

const ROOT = path.dirname(process.execPath);
const BACKEND_DIR = path.join(ROOT, "backend");
const BACKEND_ENTRY = path.join(BACKEND_DIR, "index.js");

const LOCAL_NODE = path.join(ROOT, "runtime", "node.exe");

const NODE = fs.existsSync(LOCAL_NODE) ? LOCAL_NODE : "node";

async function start() {
  console.log("=================================");
  console.log("Siebel Healthy Dashboard");
  console.log("=================================");

  try {
    const updated = await updater.check();

    if (updated) {
      console.log("Yeni sürüm bulundu. Update başlatılıyor...");

      const updateBat = path.join(ROOT, "update.bat");

      if (fs.existsSync(updateBat)) {
        console.log("Update dosyası çalıştırılıyor:", updateBat);

        const { spawn } = require("child_process");

        console.log("Update başlatılıyor:", updateBat);

        spawn("cmd.exe", ["/c", "start", "", updateBat], {
          detached: true,
          windowsHide: false,
          stdio: "ignore",
        });

        console.log("Launcher kapanıyor...");

        process.exit(0);
      } else {
        console.error("update.bat bulunamadı.");

        process.exit(1);
      }
    }
  } catch (err) {
    console.log("Update kontrolü yapılamadı.");

    console.log(err.message);
  }

  console.log("Backend başlatılıyor...");

  const backend = spawn(NODE, [BACKEND_ENTRY], {
    cwd: BACKEND_DIR,
    shell: false,
    detached: false,
    windowsHide: false,
    stdio: "inherit",
  });

  backend.on("error", (err) => {
    console.error("Backend başlatılamadı.");

    console.error(err);

    process.exit(1);
  });

  try {
    await waitOn({
      resources: ["http://localhost:5000"],

      delay: 500,

      interval: 500,

      timeout: 30000,
    });

    console.log("Backend hazır.");

    exec('start "" "http://localhost:5000"');
  } catch (err) {
    console.error("Backend hazır olmadı.");

    console.error(err);

    backend.kill();

    process.exit(1);
  }

  backend.on("exit", (code) => {
    console.log(`Backend kapandı. Code: ${code}`);

    process.exit(code || 0);
  });

  process.on("SIGINT", () => {
    backend.kill();

    process.exit();
  });

  process.on("SIGTERM", () => {
    backend.kill();

    process.exit();
  });
}

start();
