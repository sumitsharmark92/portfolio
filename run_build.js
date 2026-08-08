const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('--- Starting E-Commerce Build & Export ---');
const projectDir = path.join(__dirname, 'new web project');
const outDir = path.join(projectDir, 'out');
const targetDir = path.join(__dirname, 'e-commerce');

try {
  console.log('1. Building Next.js app in ' + projectDir);
  execSync('npm run build', { cwd: projectDir, stdio: 'inherit' });
  console.log('2. Build succeeded!');

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  console.log('3. Copying out to e-commerce...');
  fs.cpSync(outDir, targetDir, { recursive: true });
  console.log('4. Successfully copied to d:\\my web\\e-commerce!');
} catch (err) {
  console.error('Build/Export failed:', err.message);
  process.exit(1);
}
