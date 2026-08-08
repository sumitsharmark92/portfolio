const fs = require('fs');
const path = require('path');

// 1. Remove middleware.ts if present (breaks output: export)
const middlewarePath = path.join(__dirname, 'src', 'middleware.ts');
if (fs.existsSync(middlewarePath)) {
  console.log('[prepare-build] Removing src/middleware.ts for static export...');
  fs.unlinkSync(middlewarePath);
}

// 2. Rename src/app/api to src/app/_api if present (breaks output: export due to POST / dynamic handlers)
const apiPath = path.join(__dirname, 'src', 'app', 'api');
const disabledApiPath = path.join(__dirname, 'src', 'app', '_api');
if (fs.existsSync(apiPath)) {
  console.log('[prepare-build] Hiding src/app/api as src/app/_api for static export...');
  if (fs.existsSync(disabledApiPath)) {
    fs.rmSync(disabledApiPath, { recursive: true, force: true });
  }
  fs.renameSync(apiPath, disabledApiPath);
}

console.log('[prepare-build] Ready for Next.js static build!');
