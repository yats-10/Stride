// Boots the production build, fetches /, asserts every in-page anchor has a target.
import { spawn } from "node:child_process";
import assert from "node:assert/strict";

const server = spawn("npm", ["start"], { stdio: ["ignore", "pipe", "pipe"] });
const kill = () => server.kill("SIGTERM");
process.on("exit", kill);

const html = await new Promise((resolve, reject) => {
  const t = setTimeout(() => reject(new Error("server never became ready")), 60_000);
  server.stdout.on("data", async (b) => {
    if (!/Ready|started server|Local:/i.test(String(b))) return;
    clearTimeout(t);
    try {
      const res = await fetch("http://localhost:3000/");
      resolve(await res.text());
    } catch (e) { reject(e); }
  });
});

const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
const hashes = [...html.matchAll(/href="#([^"]*)"/g)].map((m) => m[1]);

console.log(`anchors: ${hashes.length}`, hashes);
const dead = hashes.filter((h) => h === "" || !ids.has(h));
assert.deepEqual(dead, [], `dead in-page anchors: ${dead.join(", ")}`);
assert.ok(hashes.length >= 10, "expected the nav + footer anchors in the markup");
assert.ok(!/"@type":\s*"Organization"/.test(html), "fictional brand must not emit Organization schema");
assert.ok(/"@type":\s*"CreativeWork"/.test(html), "expected CreativeWork schema");
assert.ok(html.includes("Yatharth Madaan"), "expected the author credit in the footer");
console.log("\n✅ every in-page anchor resolves; schema + credit correct");
kill();
