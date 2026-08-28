const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const nodeModules = path.join(__dirname, 'node_modules');
if (!fs.existsSync(nodeModules) || !fs.existsSync(path.join(nodeModules, 'express'))) {
  console.log('Installing dependencies...');
  execSync('npm install --production', { cwd: __dirname, stdio: 'inherit' });
}

require('./server.js');
