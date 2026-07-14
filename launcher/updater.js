const fs = require("fs");
const path = require("path");
const https = require("https");
const extract = require("extract-zip");

const ROOT = path.resolve(__dirname, "..");

const VERSION_FILE = path.join(ROOT, "version.json");

const TEMP_DIR = path.join(ROOT, ".update");
const ZIP_FILE = path.join(TEMP_DIR, "app.zip");
const EXTRACT_DIR = path.join(TEMP_DIR, "extract");

// KENDİ BİLGİLERİNİ GİR
const OWNER = "GITHUB_USERNAME";
const REPO = "GITHUB_REPO";

function getLocalVersion() {
  if (!fs.existsSync(VERSION_FILE)) {
    return "0.0.0";
  }

  return JSON.parse(fs.readFileSync(VERSION_FILE, "utf8")).version;
}

function get(url) {
  return new Promise((resolve, reject) => {
    https
      .get(
        url,
        {
          headers: {
            "User-Agent": "Siebel-Healthy-Dashboard",
          },
        },
        (res) => {
          let data = "";

          res.on("data", (chunk) => {
            data += chunk;
          });

          res.on("end", () => {
            try {
              resolve(JSON.parse(data));
            } catch (e) {
              reject(e);
            }
          });
        },
      )
      .on("error", reject);
  });
}

function download(url, destination) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destination);

    https
      .get(
        url,
        {
          headers: {
            "User-Agent": "Siebel-Healthy-Dashboard",
          },
        },
        (response) => {
          response.pipe(file);

          file.on("finish", () => {
            file.close(resolve);
          });
        },
      )
      .on("error", (err) => {
        fs.unlink(destination, () => {});
        reject(err);
      });
  });
}

function removeIfExists(target) {
  if (fs.existsSync(target)) {
    fs.rmSync(target, {
      recursive: true,
      force: true,
    });
  }
}

function copyFolder(source, destination) {
  fs.cpSync(source, destination, {
    recursive: true,
  });
}

async function check() {
  console.log("Update kontrol ediliyor...");

  const localVersion = getLocalVersion();

  const release = await get(
    `https://api.github.com/repos/${OWNER}/${REPO}/releases/latest`,
  );

  const remoteVersion = release.tag_name.replace("v", "");

  console.log("Local Version :", localVersion);
  console.log("Remote Version:", remoteVersion);

  if (localVersion === remoteVersion) {
    console.log("Uygulama güncel.");
    return;
  }

  console.log("Yeni sürüm bulundu.");

  removeIfExists(TEMP_DIR);

  fs.mkdirSync(TEMP_DIR);
  fs.mkdirSync(EXTRACT_DIR);

  const asset = release.assets.find((a) => a.name === "app.zip");

  if (!asset) {
    throw new Error("Release içinde app.zip bulunamadı.");
  }

  console.log("app.zip indiriliyor...");

  await download(asset.browser_download_url, ZIP_FILE);

  console.log("Zip açılıyor...");

  await extract(ZIP_FILE, {
    dir: EXTRACT_DIR,
  });

  // backend
  removeIfExists(path.join(ROOT, "backend"));

  copyFolder(path.join(EXTRACT_DIR, "backend"), path.join(ROOT, "backend"));

  // frontend
  removeIfExists(path.join(ROOT, "frontend"));

  copyFolder(path.join(EXTRACT_DIR, "frontend"), path.join(ROOT, "frontend"));

  // version.json
  fs.copyFileSync(path.join(EXTRACT_DIR, "version.json"), VERSION_FILE);

  removeIfExists(TEMP_DIR);

  console.log("Uygulama güncellendi.");
}

module.exports = {
  check,
};
