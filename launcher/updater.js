const fs = require("fs");
const path = require("path");
const https = require("https");
const extract = require("extract-zip");
const { exec } = require("child_process");

const ROOT = path.dirname(process.execPath);

const VERSION_FILE = path.join(ROOT, "version.json");

const UPDATE_DIR = path.join(ROOT, ".update");
const ZIP_FILE = path.join(UPDATE_DIR, "app.zip");
const EXTRACT_DIR = path.join(UPDATE_DIR, "extract");
const UPDATE_BAT = path.join(ROOT, "update.bat");

const OWNER = "efemsepci";
const REPO = "siebel-healthy-dashboard";

function getLocalVersion() {
  if (!fs.existsSync(VERSION_FILE)) {
    return "0.0.0";
  }

  const data = JSON.parse(fs.readFileSync(VERSION_FILE, "utf8"));

  return data.version;
}

function request(url) {
  return new Promise((resolve, reject) => {
    https
      .get(
        url,
        {
          headers: {
            "User-Agent": "SiebelHealthyDashboard",
          },
        },
        (response) => {
          let data = "";

          response.on("data", (chunk) => (data += chunk));

          response.on("end", () => {
            try {
              resolve(JSON.parse(data));
            } catch (err) {
              reject(err);
            }
          });
        },
      )
      .on("error", reject);
  });
}

function download(url, destination) {
  return new Promise((resolve, reject) => {
    function startDownload(downloadUrl) {
      https
        .get(
          downloadUrl,
          {
            headers: {
              "User-Agent": "SiebelHealthyDashboard",
            },
          },
          (response) => {
            if (
              response.statusCode >= 300 &&
              response.statusCode < 400 &&
              response.headers.location
            ) {
              return startDownload(response.headers.location);
            }

            if (response.statusCode !== 200) {
              return reject(
                new Error(`Download failed ${response.statusCode}`),
              );
            }

            const file = fs.createWriteStream(destination);

            response.pipe(file);

            file.on("finish", () => {
              file.close(resolve);
            });
          },
        )
        .on("error", reject);
    }

    startDownload(url);
  });
}

function remove(target) {
  if (fs.existsSync(target)) {
    fs.rmSync(target, {
      recursive: true,
      force: true,
    });
  }
}

function createUpdateBat() {
  const bat = `
@echo off

cd /d "${ROOT}"

echo Current directory:
cd


echo Updating application...


timeout /t 2 > nul


echo Backend updating...

xcopy ".update\\extract\\backend" "backend" /E /Y /I

echo Backend updated.


echo Frontend updating...

xcopy ".update\\extract\\frontend" "frontend" /E /Y /I

echo Frontend updated.


echo Version updating...

copy ".update\\extract\\version.json" "version.json" /Y

echo Version updated.


echo Cleaning...

rmdir /S /Q ".update"


echo Update completed. Run .exe again.


pause

`;

  fs.writeFileSync(UPDATE_BAT, bat.trim(), "utf8");
}

async function check() {
  console.log("Update kontrol ediliyor...");

  const localVersion = getLocalVersion();

  const release = await request(
    `https://api.github.com/repos/${OWNER}/${REPO}/releases/latest`,
  );

  if (!release.tag_name) {
    throw new Error("GitHub release bulunamadı.");
  }

  const remoteVersion = release.tag_name.replace(/^v/, "");

  console.log("Local Version:", localVersion);

  console.log("Remote Version:", remoteVersion);

  if (localVersion === remoteVersion) {
    console.log("Uygulama güncel.");

    return false;
  }

  console.log("Yeni sürüm bulundu.");

  remove(UPDATE_DIR);

  fs.mkdirSync(EXTRACT_DIR, {
    recursive: true,
  });

  const asset = release.assets.find((x) => x.name === "app.zip");

  if (!asset) {
    throw new Error("app.zip bulunamadı.");
  }

  console.log("Download başlıyor...");

  await download(asset.browser_download_url, ZIP_FILE);

  console.log("Zip açılıyor...");

  await extract(ZIP_FILE, {
    dir: EXTRACT_DIR,
  });

  console.log("Update script hazırlanıyor...");

  createUpdateBat();

  console.log("Update hazır.");

  return true;
}

module.exports = {
  check,
};
