import sharp from "sharp";
import { statSync, existsSync } from "fs";
import { join } from "path";

const ASSETS_DIR = "public/assets/generated";
const QUALITY = 88;

const files = [
  "bg_hall_illustrated-v3-clean.png",
  "pandal_ganesha-v2.png",
  "steamer_brass-v1.png",
  "steamer_input_table-v1.png",
  "steamer_output_table-v1.png",
  "station_supply_shelf-v2.png",
  "station_upgrade_desk-v1.png",
  "station_packing_bench-v1.png",
  "station_service_counter-v1.png",
  "modak_platter-v1.png",
];

let totalBefore = 0;
let totalAfter = 0;

console.log("\nConverting PNGs to WebP using sharp...\n");
console.log("File".padEnd(44), "Before".padStart(10), "After".padStart(10), "Saved%".padStart(10));
console.log("-".repeat(80));

for (const file of files) {
  const pngPath = join(ASSETS_DIR, file);
  const webpPath = join(ASSETS_DIR, file.replace(".png", ".webp"));

  if (!existsSync(pngPath)) {
    console.warn("  SKIP (not found): " + file);
    continue;
  }

  const before = statSync(pngPath).size;

  try {
    await sharp(pngPath).webp({ quality: QUALITY }).toFile(webpPath);
  } catch (err) {
    console.error("  ERROR converting " + file + ":", err.message);
    continue;
  }

  const after = statSync(webpPath).size;
  const saved = before - after;
  const pct = ((saved / before) * 100).toFixed(1);

  totalBefore += before;
  totalAfter += after;

  const kb = (n) => (n / 1024).toFixed(0) + " KB";
  console.log(
    file.padEnd(44),
    kb(before).padStart(10),
    kb(after).padStart(10),
    (pct + "%").padStart(10)
  );
}

console.log("-".repeat(80));
const totalSaved = totalBefore - totalAfter;
const totalPct = ((totalSaved / totalBefore) * 100).toFixed(1);
const mb = (n) => (n / 1048576).toFixed(2) + " MB";
console.log(
  "TOTAL".padEnd(44),
  mb(totalBefore).padStart(10),
  mb(totalAfter).padStart(10),
  (totalPct + "%").padStart(10)
);
console.log("\nDone. Originals (.png) kept as local backups.\n");
