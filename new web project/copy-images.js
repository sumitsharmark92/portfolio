const fs = require('fs');
const path = require('path');

const srcDir = 'C:\\Users\\Sumit\\.gemini\\antigravity-ide\\brain\\99fcee9a-9354-40b1-91f6-dea70d7969eb';
const destDir = 'd:\\NEW WEB PROJECT\\public\\images\\products';

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

const mediaFiles = [
  'media__1786139624097.jpg',
  'media__1786139624100.jpg',
  'media__1786139624106.jpg',
  'media__1786139624113.jpg',
  'media__1786139624121.jpg'
];

mediaFiles.forEach((file, index) => {
  const srcPath = path.join(srcDir, file);
  const destPath = path.join(destDir, `product-${index + 1}.jpg`);
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath);
    console.log(`Copied ${file} -> product-${index + 1}.jpg`);
  } else {
    console.log(`File not found: ${srcPath}`);
  }
});
