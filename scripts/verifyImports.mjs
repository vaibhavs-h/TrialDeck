import fs from 'node:fs';
import path from 'node:path';

function getImports(filePath) {
  const code = fs.readFileSync(filePath, 'utf8');
  const importRegex = /import\s+(?:\{([^}]+)\}|\*\s+as\s+\w+|\w+)\s+from\s+['"](\.[^'"]+)['"]/g;
  let match;
  const imports = [];
  while ((match = importRegex.exec(code)) !== null) {
    if (match[1]) {
      const names = match[1].split(',').map(s => s.trim().split(/\s+as\s+/)[0]).filter(Boolean);
      imports.push({ names, target: match[2], file: filePath });
    }
  }
  return imports;
}

function checkDir(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const f of files) {
    const full = path.join(dir, f.name);
    if (f.isDirectory()) {
      checkDir(full);
    } else if (f.name.endsWith('.js')) {
      const imps = getImports(full);
      for (const imp of imps) {
        let targetPath = path.resolve(path.dirname(full), imp.target);
        if (!fs.existsSync(targetPath)) {
          if (fs.existsSync(targetPath + '.js')) targetPath = targetPath + '.js';
        }
        if (!fs.existsSync(targetPath)) {
          console.error(`[ERROR] Target file not found: ${targetPath} imported in ${full}`);
          continue;
        }
        const targetCode = fs.readFileSync(targetPath, 'utf8');
        for (const name of imp.names) {
          const exportRegex = new RegExp(
            `export\\s+(?:async\\s+)?(?:function|const|let|var|class)\\s+${name}\\b|export\\s*\\{[^}]*\\b${name}\\b`
          );
          if (!exportRegex.test(targetCode)) {
            console.error(`[ERROR] Missing export: "${name}" from ${imp.target} (imported in ${full})`);
          }
        }
      }
    }
  }
}

checkDir('./src/backend');
console.log('Static import/export scan completed.');
