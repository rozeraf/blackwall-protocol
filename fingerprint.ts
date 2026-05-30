import { hash } from "./src/index";
import { renderFingerprint } from "./fp/render";

async function main() {
  const files = process.argv.slice(2);
  
  if (files.length === 0) {
    console.log("Usage: bun fingerprint.ts <file1> [file2...]");
    process.exit(1);
  }

  for (const path of files) {
    try {
      const file = Bun.file(path);
      if (!(await file.exists())) {
        console.error(`✗ ${path}: File not found`);
        continue;
      }
      
      const arrayBuffer = await file.arrayBuffer();
      const fileBuffer = Buffer.from(arrayBuffer);
      
      const hashBuf = hash(fileBuffer);
      const result = await renderFingerprint(hashBuf);
      
      const outPath = `${path}.fingerprint.png`;
      await Bun.write(outPath, result.png);
      
      console.log(`✓ ${path}`);
      console.log(`  rule:    ${result.rule}`);
      console.log(`  palette: ${result.paletteName}`);
      console.log(`  hash:    ${result.hex}`);
      console.log(`  saved:   ${outPath}\n`);
    } catch (err) {
      console.error(`✗ ${path}: Error processing file`, err);
    }
  }
}

main();
