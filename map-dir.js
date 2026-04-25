const fs = require("fs");
const path = require("path");

const IGNORE = new Set([
  "node_modules",
  ".next",
  ".git",
  "dist",
  "build",
  ".turbo",
  ".vercel",
  "coverage",
]);

const IGNORE_FILES = new Set([
  ".DS_Store",
  "Thumbs.db",
  "package-lock.json",
  "yarn.lock",
  "pnpm-lock.yaml",
]);

function mapDir(dirPath, prefix = "", isLast = true) {
  const entries = fs
    .readdirSync(dirPath, { withFileTypes: true })
    .filter((e) => !IGNORE.has(e.name) && !IGNORE_FILES.has(e.name))
    .sort((a, b) => {
      // Directories first, then files
      if (a.isDirectory() && !b.isDirectory()) return -1;
      if (!a.isDirectory() && b.isDirectory()) return 1;
      return a.name.localeCompare(b.name);
    });

  entries.forEach((entry, index) => {
    const isLastEntry = index === entries.length - 1;
    const connector = isLastEntry ? "└── " : "├── ";
    const icon = entry.isDirectory() ? "📁" : "📄";

    console.log(`${prefix}${connector}${icon} ${entry.name}`);

    if (entry.isDirectory()) {
      const newPrefix = prefix + (isLastEntry ? "    " : "│   ");
      mapDir(path.join(dirPath, entry.name), newPrefix, isLastEntry);
    }
  });
}

const target = process.argv[2]
  ? path.resolve(process.argv[2])
  : process.cwd();

console.log(`\n📁 ${path.basename(target)}`);
mapDir(target);
console.log();