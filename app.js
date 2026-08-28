const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const nodeModules = path.join(__dirname, 'node_modules');
if (!fs.existsSync(nodeModules) || !fs.existsSync(path.join(nodeModules, 'express'))) {
  console.log('Installing dependencies...');
  const npm = path.join('/home/giantar1/nodevenv/ai/22/bin/npm');
  execSync(`"${npm}" install --production`, { cwd: __dirname, stdio: 'inherit' });
}

require('./server.js');
