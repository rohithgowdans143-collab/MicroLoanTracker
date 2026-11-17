const localtunnel = require('localtunnel');
const fs = require('fs');
const path = require('path');

const PORT = 5001;
const URL_FILE = path.join(__dirname, 'public_url.txt');

(async () => {
  try {
    console.log(`Connecting localtunnel on port ${PORT}...`);
    const tunnel = await localtunnel({ port: PORT });

    console.log(`===============================================`);
    console.log(`🎉 LIVE DEPLOYED PUBLIC URL:`);
    console.log(`${tunnel.url}`);
    console.log(`===============================================`);

    fs.writeFileSync(URL_FILE, tunnel.url, 'utf-8');

    // Keep event loop alive
    setInterval(() => {}, 1000 * 60 * 60);

    tunnel.on('close', () => {
      console.log('Tunnel closed');
      process.exit(0);
    });

    tunnel.on('error', (err) => {
      console.error('Tunnel error:', err);
    });
  } catch (err) {
    console.error('Failed to create tunnel:', err);
  }
})();
