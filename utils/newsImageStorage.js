function toDataUrl(file) {
  if (!file || !file.buffer) {
    throw new Error('No file buffer available');
  }

  const base64 = file.buffer.toString('base64');
  return `data:${file.mimetype || 'image/png'};base64,${base64}`;
}

module.exports = {
  toDataUrl
};
