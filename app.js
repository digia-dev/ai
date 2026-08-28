const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const nodeModules = path.join(__dirname, 'node_modules');

const needsInstall = !fs.existsSync(nodeModules) ||
  !fs.existsSync(path.join(nodeModules, 'express')) ||
  !fs.existsSync(path.join(nodeModules, 'pg'));

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end('<html><body><h1>Tara AI</h1><p>Loading...</p></body></html>');
});

server.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);

  if (!needsInstall) {
    console.log('Dependencies OK, loading server...');
    server.close(() => require('./server.js'));
    return;
  }

  console.log('Installing dependencies...');
  const { spawn } = require('child_process');
  const npm = path.join('/home/giantar1/nodevenv/ai/22/bin/npm');
  const proc = spawn(npm, ['install', '--production'], {
    cwd: __dirname,
    stdio: 'inherit'
  });

  proc.on('close', (code) => {
    console.log(`npm install exited with code ${code}`);
    server.close(() => require('./server.js'));
  });

  proc.on('error', (err) => {
    console.error('npm install error:', err.message);
    server.close(() => require('./server.js'));
  });
});
