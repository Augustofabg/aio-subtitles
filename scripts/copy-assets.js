const fs = require('fs');
const path = require('path');

function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

const srcDir = path.join(__dirname, '..', 'src', 'web', 'public');
const destDir = path.join(__dirname, '..', 'dist', 'web', 'public');

if (fs.existsSync(srcDir)) {
  copyDir(srcDir, destDir);
  console.log(`Assets copied from ${srcDir} to ${destDir}`);
}
