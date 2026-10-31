import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { createHash } from 'node:crypto'
import { readFile, mkdir, writeFile, rename, rm } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { createDataset, assertHistoryPreserved, NASA_CSV_URL } from '../src/features/climate/parse.ts'
import { getParisThresholds } from '../src/features/climate/math.ts'

const output = new URL('../src/data/gistemp.json', import.meta.url)
const temporary = new URL(`../src/data/gistemp.${process.pid}.tmp`, import.meta.url)

async function download() {
  try {
    const response = await fetch(NASA_CSV_URL, { signal: AbortSignal.timeout(30000) })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    return await response.text()
  } catch (error) {
    console.warn(`Descarga con Node fallida: ${error.message}. Intentando curl con validación TLS.`)
    const { stdout } = await promisify(execFile)(process.platform === 'win32' ? 'curl.exe' : 'curl', [
      '--fail', '--silent', '--show-error', '--location', '--proto', '=https', '--proto-redir', '=https',
      '--max-time', '30', NASA_CSV_URL,
    ], { encoding: 'utf8', maxBuffer: 2 * 1024 * 1024, timeout: 35000, windowsHide: true })
    return stdout
  }
}

try {
  const csv = await download()
  const dataset = createDataset(csv, new Date().toISOString(), createHash('sha256').update(csv).digest('hex'))
  let previous
  try { previous = JSON.parse(await readFile(output, 'utf8')) }
  catch (error) { if (error.code !== 'ENOENT') throw error }
  if (previous) assertHistoryPreserved(previous, dataset)
  await mkdir(new URL('../src/data/', import.meta.url), { recursive: true })
  await writeFile(temporary, `${JSON.stringify(dataset)}\n`, 'utf8')
  await rename(temporary, output)
  console.log(JSON.stringify({ file: fileURLToPath(output), years: dataset.yearCount, months: dataset.monthCount,
    first: dataset.firstDate, last: dataset.lastDate, downloadedAt: dataset.downloadedAt,
    thresholds: getParisThresholds(dataset.years) }, null, 2))
} catch (error) {
  console.error(`No se pudo actualizar NASA GISTEMP: ${error.message}. No se reemplazó el conjunto anterior.`)
  process.exitCode = 1
} finally {
  await rm(temporary, { force: true }).catch(() => {})
}
