import "dotenv/config";
import fs from "fs";
import path from "path";

async function main() {
  const filePath = path.resolve("tests/e2e/fixtures/poster-with-logo.png");
  const b64 = fs.readFileSync(filePath).toString("base64");
  const dataUrl = `data:image/png;base64,${b64}`;

  const { extractPoster } = await import("../src/lib/ai/extract-poster");
  const result = await extractPoster(dataUrl);
  if (!result) {
    console.log("EXTRACTION: null (both AI providers unavailable/quota)");
    process.exit(2); // non-zero = quota still exhausted
  }
  console.log("name:", result.name);
  console.log("logoBox:", JSON.stringify(result.logoBox));
  if (result.logoBox) {
    // Expected logo region: x~660-760, y~60-160 on 800x1000 → x% 82-95, y% 6-16
    const ok =
      Math.abs(result.logoBox.x - 82) < 10 &&
      Math.abs(result.logoBox.y - 8) < 10;
    console.log("LOGO DETECTED:", ok ? "YES ✅ (close to expected 82,8)" : "found but off-target");
    process.exit(0);
  }
  console.log("NO LOGO BOX (AI ran but didn't find it)");
  process.exit(3);
}
main().catch((e) => { console.error(e.message); process.exit(1); });
