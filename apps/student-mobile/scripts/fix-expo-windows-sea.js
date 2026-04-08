const fs = require("fs");
const path = require("path");

const targetFile = path.join(
  __dirname,
  "..",
  "node_modules",
  "@expo",
  "cli",
  "build",
  "src",
  "start",
  "server",
  "metro",
  "externals.js",
);

if (!fs.existsSync(targetFile)) {
  process.exit(0);
}

const original = fs.readFileSync(targetFile, "utf8");

if (original.includes('.map((x)=>x.replace(/^node:/, "")))).sort();')) {
  process.exit(0);
}

let patched = original;
patched = patched.replace(
  "const NODE_STDLIB_MODULES = [",
  "const NODE_STDLIB_MODULES = Array.from(new Set([",
);
patched = patched.replace(
  "].sort();",
  '].map((x)=>x.replace(/^node:/, "")))).sort();',
);

if (patched === original) {
  console.warn(
    "Expo externals patch was not applied: expected pattern not found.",
  );
  process.exit(0);
}

fs.writeFileSync(targetFile, patched);
console.log("Applied Expo Windows externals patch for node: builtins.");
