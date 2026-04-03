const fs = require("fs");
const apiUrl =
  process.env.API_URL || "https://quantitymeasurementappbackend.onrender.com";

const content = `(function (window) {
  window.__env = window.__env || {};
  window.__env.apiUrl = '${apiUrl}';
}(this));
`;

// Write to dist after build
const targetPath = "./dist/buildscale-angular/browser/assets/env.js";
fs.mkdirSync("./dist/buildscale-angular/browser/assets", { recursive: true });
fs.writeFileSync(targetPath, content);
console.log(`env.js written with apiUrl: ${apiUrl}`);
