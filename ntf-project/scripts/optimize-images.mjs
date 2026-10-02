import { mkdir, readdir, rm } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const SOURCE_DIR = 'assets-src/nfts'
const OUTPUT_DIR = 'public/images/nfts'
const WIDTHS = [160, 320, 640, 960]

await rm(OUTPUT_DIR, { recursive: true, force: true })
await mkdir(OUTPUT_DIR, { recursive: true })

const sources = (await readdir(SOURCE_DIR)).filter((file) => /\.(png|jpe?g|webp)$/i.test(file))

for (const file of sources) {
  const name = path.parse(file).name
  const input = sharp(path.join(SOURCE_DIR, file))

  for (const width of WIDTHS) {
    const resized = input.clone().resize({ width, withoutEnlargement: true })
    await resized
      .clone()
      .avif({ quality: 55, effort: 6 })
      .toFile(`${OUTPUT_DIR}/${name}-${width}.avif`)
    await resized
      .clone()
      .webp({ quality: 78, effort: 6 })
      .toFile(`${OUTPUT_DIR}/${name}-${width}.webp`)
  }

  console.log(`${name}: ${WIDTHS.length * 2} arquivos gerados`)
}
