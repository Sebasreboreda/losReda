const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const projectRoot = path.resolve(__dirname, '..');
const distDir = path.join(projectRoot, 'dist');
const sqliteBindingJsPath = path.join(projectRoot, 'node_modules', 'sqlite3', 'lib', 'sqlite3-binding.js');
const sqliteNativeBinaryPath = path.join(projectRoot, 'node_modules', 'sqlite3', 'build', 'Release', 'node_sqlite3.node');
const exeOutputPath = path.join(distDir, 'tfg-app.exe');
const sqliteBinaryDistPath = path.join(distDir, 'node_sqlite3.node');
const portableZipPath = path.join(distDir, 'tfg-app-portable.zip');
const ZIP_STORE_METHOD = 0;

function runCommand(command, args) {
  const result = spawnSync(command, args, {
    cwd: projectRoot,
    stdio: 'inherit',
    shell: process.platform === 'win32'
  });

  if (result.status !== 0) {
    throw new Error(`Command failed: ${command} ${args.join(' ')}`);
  }
}

function ensureFileExists(filePath, label) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`${label} not found at: ${filePath}`);
  }
}

function patchSqliteBindingLoader() {
  ensureFileExists(sqliteBindingJsPath, 'sqlite3 binding loader');

  const patchedContent = `const path = require('path');

if (process.pkg) {
  module.exports = require(path.join(path.dirname(process.execPath), 'node_sqlite3.node'));
} else {
  module.exports = require('bindings')('node_sqlite3.node');
}
`;

  fs.writeFileSync(sqliteBindingJsPath, patchedContent, 'utf8');
}

function buildExecutable() {
  runCommand('npx', ['pkg', '.', '--targets', 'node18-win-x64', '--output', exeOutputPath]);
}

function copySqliteBinary() {
  ensureFileExists(sqliteNativeBinaryPath, 'sqlite3 native binary');
  fs.mkdirSync(distDir, { recursive: true });
  fs.copyFileSync(sqliteNativeBinaryPath, sqliteBinaryDistPath);
}

function getCrc32(buffer) {
  let crc = -1;
  for (const byte of buffer) {
    crc ^= byte;
    for (let i = 0; i < 8; i += 1) {
      const mask = -(crc & 1);
      crc = (crc >>> 1) ^ (0xEDB88320 & mask);
    }
  }
  return (crc ^ -1) >>> 0;
}

function toDosDateTime() {
  const now = new Date();
  const year = Math.max(1980, now.getFullYear());
  const dosTime =
    (now.getHours() << 11) |
    (now.getMinutes() << 5) |
    Math.floor(now.getSeconds() / 2);
  const dosDate =
    ((year - 1980) << 9) |
    ((now.getMonth() + 1) << 5) |
    now.getDate();
  return { dosTime, dosDate };
}

function buildPortableZip() {
  const files = [
    { name: 'tfg-app.exe', path: exeOutputPath },
    { name: 'node_sqlite3.node', path: sqliteBinaryDistPath }
  ];

  files.forEach((file) => ensureFileExists(file.path, file.name));

  const { dosDate, dosTime } = toDosDateTime();
  const localParts = [];
  const centralParts = [];
  let offset = 0;

  for (const file of files) {
    const data = fs.readFileSync(file.path);
    const fileName = Buffer.from(file.name, 'utf8');
    const crc32 = getCrc32(data);
    const size = data.length;

    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0); // local file header signature
    localHeader.writeUInt16LE(20, 4); // version needed to extract
    localHeader.writeUInt16LE(0, 6); // general purpose bit flag
    localHeader.writeUInt16LE(ZIP_STORE_METHOD, 8); // compression method (store)
    localHeader.writeUInt16LE(dosTime, 10);
    localHeader.writeUInt16LE(dosDate, 12);
    localHeader.writeUInt32LE(crc32, 14);
    localHeader.writeUInt32LE(size, 18); // compressed size
    localHeader.writeUInt32LE(size, 22); // uncompressed size
    localHeader.writeUInt16LE(fileName.length, 26);
    localHeader.writeUInt16LE(0, 28); // extra field length

    localParts.push(localHeader, fileName, data);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0); // central dir signature
    centralHeader.writeUInt16LE(20, 4); // version made by
    centralHeader.writeUInt16LE(20, 6); // version needed to extract
    centralHeader.writeUInt16LE(0, 8); // flags
    centralHeader.writeUInt16LE(ZIP_STORE_METHOD, 10); // method
    centralHeader.writeUInt16LE(dosTime, 12);
    centralHeader.writeUInt16LE(dosDate, 14);
    centralHeader.writeUInt32LE(crc32, 16);
    centralHeader.writeUInt32LE(size, 20);
    centralHeader.writeUInt32LE(size, 24);
    centralHeader.writeUInt16LE(fileName.length, 28);
    centralHeader.writeUInt16LE(0, 30); // extra length
    centralHeader.writeUInt16LE(0, 32); // comment length
    centralHeader.writeUInt16LE(0, 34); // disk number
    centralHeader.writeUInt16LE(0, 36); // internal attributes
    centralHeader.writeUInt32LE(0, 38); // external attributes
    centralHeader.writeUInt32LE(offset, 42); // offset of local header

    centralParts.push(centralHeader, fileName);
    offset += localHeader.length + fileName.length + size;
  }

  const centralDirectory = Buffer.concat(centralParts);
  const endRecord = Buffer.alloc(22);
  endRecord.writeUInt32LE(0x06054b50, 0); // end of central directory signature
  endRecord.writeUInt16LE(0, 4); // disk number
  endRecord.writeUInt16LE(0, 6); // start disk number
  endRecord.writeUInt16LE(files.length, 8); // entries on this disk
  endRecord.writeUInt16LE(files.length, 10); // total entries
  endRecord.writeUInt32LE(centralDirectory.length, 12); // central directory size
  endRecord.writeUInt32LE(offset, 16); // central directory offset
  endRecord.writeUInt16LE(0, 20); // zip comment length

  const zipBuffer = Buffer.concat([...localParts, centralDirectory, endRecord]);
  fs.writeFileSync(portableZipPath, zipBuffer);
}

function main() {
  patchSqliteBindingLoader();
  buildExecutable();
  copySqliteBinary();
  buildPortableZip();
  console.log('Build complete: dist/tfg-app.exe + dist/node_sqlite3.node + dist/tfg-app-portable.zip');
}

main();
