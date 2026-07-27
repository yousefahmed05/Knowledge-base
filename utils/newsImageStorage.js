const fs = require('fs');
const path = require('path');

function toDataUrl(file) {
  if (!file || !file.buffer) {
    throw new Error('No file buffer available');
  }

  const base64 = file.buffer.toString('base64');
  return `data:${file.mimetype || 'image/png'};base64,${base64}`;
}

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const types = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp'
  };

  return types[ext] || 'image/png';
}

function toDataUrlFromFilePath(filePath) {
  if (!filePath) {
    throw new Error('No file path provided');
  }

  const resolvedPath = path.isAbsolute(filePath)
    ? filePath
    : path.join(process.cwd(), filePath);

  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`File not found: ${resolvedPath}`);
  }

  const buffer = fs.readFileSync(resolvedPath);
  const base64 = buffer.toString('base64');
  return `data:${getMimeType(resolvedPath)};base64,${base64}`;
}

module.exports = {
  toDataUrl,
  toDataUrlFromFilePath
};
