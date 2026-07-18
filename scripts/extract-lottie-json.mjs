import fs from 'node:fs';
import path from 'node:path';
import { unzipSync, strFromU8 } from 'fflate';

const root = process.cwd();
const sourceDir = path.join(root, 'animations', 'lottie');
const outputDir = path.join(root, 'animations', 'lottie-json');

if (!fs.existsSync(sourceDir)) process.exit(0);
fs.mkdirSync(outputDir, { recursive: true });

const sources = fs.readdirSync(sourceDir)
  .filter(file => file.toLowerCase().endsWith('.lottie'))
  .sort();

for (const file of sources) {
  const archive = unzipSync(new Uint8Array(fs.readFileSync(path.join(sourceDir, file))));
  const animationPath = Object.keys(archive)
    .filter(name => /^animations\/.*\.json$/i.test(name))
    .sort()[0];
  if (!animationPath) throw new Error(`No animation JSON found in ${file}`);

  const parsed = JSON.parse(strFromU8(archive[animationPath]));
  const normalized = `${JSON.stringify(parsed)}\n`;
  const outputPath = path.join(outputDir, `${path.basename(file, '.lottie')}.json`);
  const current = fs.existsSync(outputPath) ? fs.readFileSync(outputPath, 'utf8') : null;
  if (current !== normalized) fs.writeFileSync(outputPath, normalized);
}

console.log(`✅ Extracted ${sources.length} Lottie JSON assets`);
