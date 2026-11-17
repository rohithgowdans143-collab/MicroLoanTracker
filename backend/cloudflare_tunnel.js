const { startTunnel } = require('untun');
const fs = require('fs');
const path = require('path');

const PORT = 5001;
const URL_FILE = path.join(__dirname, 'cloudflare_url.txt');

(async () => {
  try {
    console.log(`Starting Cloudflare Quick Tunnel on port ${PORT}...`);
    const tunnel = await startTunnel({ port: PORT });
    const url = await tunnel.getURL();

    console.log(`===============================================`);
    console.log(`🚀 CLOUDFLARE LIVE DEPLOYED URL:`);
    console.log(`${url}`);
    console.log(`===============================================`);

    fs.writeFileSync(URL_FILE, url, 'utf-8');

    // Keep process alive indefinitely
    setInterval(() => {}, 1000 * 60 * 60);
  } catch (err) {
    console.error('Failed to create Cloudflare tunnel:', err);
  }
})();
