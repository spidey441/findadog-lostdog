import { cp, mkdir, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const dist = path.join(root, "dist");
const required = ["index.html", "styles.css", "app.js", "assets"];

for (const item of required) {
  if (!existsSync(path.join(root, item))) {
    throw new Error(`Missing required site file: ${item}`);
  }
}

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });

for (const item of required) {
  await cp(path.join(root, item), path.join(dist, item), { recursive: true });
}

console.log(`Built FindADog at Lost Dog site to ${dist}`);
