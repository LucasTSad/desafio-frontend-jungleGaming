import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import os from 'node:os'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'
import { getCertificate } from '@vitejs/plugin-basic-ssl'
import { preview, version as viteVersion } from 'vite'
import { CATEGORIES, METRICS, PAGES, PORT, PROFILES, RUNS } from '../lighthouse/audit.config.mjs'

const REPORTS_DIR = 'lighthouse/reports'
const SUMMARY_FILE = 'lighthouse/RESULTADOS.md'
const CERT_DIR = 'node_modules/.cache/kurio-lighthouse'
const LIGHTHOUSE_CLI = fileURLToPath(import.meta.resolve('lighthouse/cli/index.js'))
// Chromium fixado pela versão do Playwright do projeto; CHROME_PATH troca por outro navegador.
const CHROME_PATH = process.env.CHROME_PATH ?? chromium.executablePath()
// O certificado local é autoassinado: sem aceitá-lo, o Chrome abre a página mas não registra o
// service worker do MSW, e o app não monta.
const CHROME_FLAGS = '--headless=new --ignore-certificate-errors --allow-insecure-localhost'
const require = createRequire(import.meta.url)

const formatNumber = (value, digits = 0) =>
  value.toLocaleString('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits })
const formatDecimal = (value) => value.toLocaleString('pt-BR', { maximumFractionDigits: 2 })

const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2
}

function formatMetric(metric, value) {
  if (!metric.unit) return formatNumber(value, 3)
  if (metric.id === 'total-blocking-time') return `${formatNumber(Math.round(value))} ms`
  return `${formatNumber(value / 1000, 1)} s`
}

/** Uma medição = um processo do Lighthouse com um Chrome novo (perfil temporário, sem cache nem dados). */
function runLighthouse(url, profile, outputPath) {
  const args = [
    LIGHTHOUSE_CLI,
    url,
    `--config-path=${profile.config}`,
    '--output=json',
    '--output=html',
    `--output-path=${outputPath}`,
    `--chrome-flags=${CHROME_FLAGS}`,
    '--quiet',
  ]
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, {
      env: { ...process.env, CHROME_PATH },
      stdio: ['ignore', 'inherit', 'inherit'],
    })
    child.on('error', reject)
    child.on('exit', (code) =>
      code === 0 ? resolve() : reject(new Error(`Lighthouse saiu com código ${code} em ${url}`)),
    )
  })
}

/** O Chrome headless às vezes fecha no meio da carga: a medição é refeita uma vez antes de desistir. */
async function measure(url, profile, outputPath) {
  try {
    await runLighthouse(url, profile, outputPath)
  } catch (error) {
    console.warn(`${error.message}. Repetindo a medição.`)
    await runLighthouse(url, profile, outputPath)
  }
}

function readRun(lhr, file) {
  if (lhr.runtimeError) throw new Error(`${file}: ${lhr.runtimeError.message}`)
  return {
    file,
    scores: Object.fromEntries(
      CATEGORIES.map(({ id }) => [id, Math.round(lhr.categories[id].score * 100)]),
    ),
    metrics: Object.fromEntries(METRICS.map(({ id }) => [id, lhr.audits[id].numericValue])),
    benchmarkIndex: lhr.environment.benchmarkIndex,
    warnings: lhr.runWarnings,
  }
}

function summarize(runs) {
  return {
    scores: Object.fromEntries(
      CATEGORIES.map(({ id }) => [id, median(runs.map((run) => run.scores[id]))]),
    ),
    metrics: Object.fromEntries(
      METRICS.map(({ id }) => [id, median(runs.map((run) => run.metrics[id]))]),
    ),
  }
}

async function chromiumVersion() {
  const browser = await chromium.launch({ executablePath: CHROME_PATH })
  const version = browser.version()
  await browser.close()
  return version
}

async function describeEnvironment(lhr, benchmarkIndexes) {
  const cpus = os.cpus()
  const documentRequest = lhr.audits['network-requests'].details.items.find(
    (request) => request.resourceType === 'Document',
  )
  return {
    lighthouse: lhr.lighthouseVersion,
    axeCore: lhr.environment.credits?.['axe-core'],
    chromium: await chromiumVersion(),
    chromiumPath: CHROME_PATH,
    playwright: require('@playwright/test/package.json').version,
    vite: viteVersion,
    node: process.version,
    os: `${os.version()} ${os.release()} (${os.arch()})`,
    cpu: `${cpus[0].model.trim()} (${cpus.length} threads)`,
    memory: `${Math.round(os.totalmem() / 1024 ** 3)} GB`,
    benchmarkIndex: Math.round(median(benchmarkIndexes)),
    protocol: documentRequest?.protocol ?? 'desconhecido',
  }
}

function describeProfile(lhr) {
  const { throttling, screenEmulation, throttlingMethod } = lhr.configSettings
  return {
    throttlingMethod,
    width: screenEmulation.width,
    height: screenEmulation.height,
    deviceScaleFactor: screenEmulation.deviceScaleFactor,
    rttMs: throttling.rttMs,
    throughputKbps: throttling.throughputKbps,
    cpuSlowdownMultiplier: throttling.cpuSlowdownMultiplier,
  }
}

function renderMarkdown({ generatedAt, results, environment, profiles }) {
  const scoreCell = (category, value) =>
    value >= category.target ? `${value}` : `**${value}** (meta ${category.target})`
  const requiredMetrics = METRICS.slice(0, 3)
  const describeConditions = ({ profile, settings }) => {
    const cpu =
      settings.cpuSlowdownMultiplier === 1
        ? 'CPU sem desaceleração'
        : `CPU ${settings.cpuSlowdownMultiplier}x mais lenta`
    const throughput = formatDecimal(settings.throughputKbps / 1024)
    return `- ${profile.name} (\`${profile.config}\`): ${settings.width} × ${settings.height}, DPR ${formatDecimal(settings.deviceScaleFactor)}; throttling \`${settings.throttlingMethod}\` com RTT ${settings.rttMs} ms, ${throughput} Mbps e ${cpu}.`
  }

  const lines = [
    '# Resultados do Lighthouse',
    '',
    `Gerado por \`npm run lighthouse\` em ${generatedAt}. Cada valor é a mediana de ${RUNS} medições por página e perfil; cada medição abre um Chrome novo, sem cache, service worker nem dados salvos. Em negrito, o que ficou abaixo da meta. A análise dos resultados está em [docs/lighthouse.md](../../docs/lighthouse.md).`,
    '',
    '## Pontuações (mediana)',
    '',
    `| Página | Perfil | ${CATEGORIES.map((category) => `${category.name} (≥ ${category.target})`).join(' | ')} |`,
    `| --- | --- | ${CATEGORIES.map(() => '---:').join(' | ')} |`,
    ...results.map(
      ({ page, profile, median: values }) =>
        `| ${page.name} | ${profile.name} | ${CATEGORIES.map((category) => scoreCell(category, values.scores[category.id])).join(' | ')} |`,
    ),
    '',
    '## Métricas (mediana)',
    '',
    `| Página | Perfil | ${METRICS.map((metric) => metric.name).join(' | ')} |`,
    `| --- | --- | ${METRICS.map(() => '---:').join(' | ')} |`,
    ...results.map(
      ({ page, profile, median: values }) =>
        `| ${page.name} | ${profile.name} | ${METRICS.map((metric) => formatMetric(metric, values.metrics[metric.id])).join(' | ')} |`,
    ),
    '',
    '## Medições individuais',
    '',
    `| Página | Perfil | # | ${CATEGORIES.map((category) => category.name).join(' | ')} | ${requiredMetrics.map((metric) => metric.name).join(' | ')} | Relatórios |`,
    `| --- | --- | ---: | ${[...CATEGORIES, ...requiredMetrics].map(() => '---:').join(' | ')} | --- |`,
    ...results.flatMap(({ page, profile, runs }) =>
      runs.map((run, index) => {
        const scores = CATEGORIES.map((category) => run.scores[category.id]).join(' | ')
        const metrics = requiredMetrics
          .map((metric) => formatMetric(metric, run.metrics[metric.id]))
          .join(' | ')
        const reports = `[HTML](reports/${run.file}.report.html) · [JSON](reports/${run.file}.report.json)`
        return `| ${page.name} | ${profile.name} | ${index + 1} | ${scores} | ${metrics} | ${reports} |`
      }),
    ),
    '',
    '## Ferramentas e ambiente',
    '',
    `- Lighthouse ${environment.lighthouse} (axe-core ${environment.axeCore}), pela CLI.`,
    `- Chromium ${environment.chromium} em modo headless (\`${CHROME_FLAGS}\`), o mesmo navegador dos testes do Playwright ${environment.playwright}.`,
    `- Node ${environment.node} e Vite ${environment.vite}.`,
    `- ${environment.os}, ${environment.cpu}, ${environment.memory} de RAM. BenchmarkIndex do Lighthouse: ${environment.benchmarkIndex} (mediana).`,
    '',
    '## Condições de execução',
    '',
    `- Build de produção (\`vite build\`) servido por \`vite preview\` em \`https://localhost:${PORT}\` (protocolo ${environment.protocol}, gzip), com certificado local autoassinado gerado pelo \`@vitejs/plugin-basic-ssl\`.`,
    '- API e Socket.IO simulados pelo MSW, como na entrega (`VITE_API_MOCKING=enabled`), no cenário "Padrão" (latência de 120 a 400 ms por requisição, sorteada com semente fixa) e com as fixtures iniciais.',
    '- Imagens, fontes, painel de cenários e tempo real carregam como para qualquer visitante: nada é desligado para a auditoria.',
    ...profiles.map(describeConditions),
    '',
  ]
  const warnings = [...new Set(results.flatMap(({ runs }) => runs.flatMap((run) => run.warnings)))]
  if (warnings.length) {
    lines.push('## Avisos do Lighthouse', '', ...warnings.map((warning) => `- ${warning}`), '')
  }
  return lines.join('\n')
}

if (!existsSync('dist/index.html')) {
  console.error('Build não encontrado: rode `npm run build` antes (ou use `npm run lighthouse`).')
  process.exit(1)
}

await rm(REPORTS_DIR, { recursive: true, force: true })
await mkdir(REPORTS_DIR, { recursive: true })

// HTTPS para o preview servir HTTP/2, o protocolo do deploy na Vercel. Em HTTP/1.1, o Lighthouse
// simularia o limite de 6 conexões por origem para os chunks do build.
const certificate = await getCertificate(CERT_DIR)
const server = await preview({
  preview: {
    port: PORT,
    strictPort: true,
    open: false,
    https: { key: certificate, cert: certificate },
  },
  logLevel: 'warn',
})
const origin = `https://localhost:${PORT}`
const files = new Map()
const total = RUNS * PAGES.length * PROFILES.length
let done = 0

try {
  // As medições se alternam entre páginas e perfis para que uma oscilação da máquina não caia
  // toda sobre a mesma combinação.
  for (let run = 1; run <= RUNS; run++) {
    for (const page of PAGES) {
      for (const profile of PROFILES) {
        const file = `${page.id}-${profile.id}-${run}`
        console.log(`[${++done}/${total}] ${page.name} · ${profile.name} · medição ${run}`)
        await measure(`${origin}${page.path}`, profile, `${REPORTS_DIR}/${file}`)
        const key = `${page.id}:${profile.id}`
        files.set(key, [...(files.get(key) ?? []), file])
      }
    }
  }
} finally {
  await server.close()
}

const results = []
const profiles = []
let lastReport
for (const page of PAGES) {
  for (const profile of PROFILES) {
    const runs = []
    for (const file of files.get(`${page.id}:${profile.id}`)) {
      lastReport = JSON.parse(await readFile(`${REPORTS_DIR}/${file}.report.json`, 'utf8'))
      runs.push(readRun(lastReport, file))
      if (!profiles.some((entry) => entry.profile.id === profile.id)) {
        profiles.push({ profile, settings: describeProfile(lastReport) })
      }
    }
    results.push({ page, profile, runs, median: summarize(runs) })
  }
}

const summary = {
  generatedAt: new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(
    new Date(),
  ),
  environment: await describeEnvironment(
    lastReport,
    results.flatMap(({ runs }) => runs.map((run) => run.benchmarkIndex)),
  ),
  profiles,
  results,
}
await writeFile(`${REPORTS_DIR}/summary.json`, `${JSON.stringify(summary, null, 2)}\n`)
await writeFile(SUMMARY_FILE, renderMarkdown(summary))

console.log('')
for (const { page, profile, median: values } of results) {
  const scores = CATEGORIES.map((category) => {
    const value = values.scores[category.id]
    return `${category.name} ${value}${value < category.target ? ' (abaixo da meta)' : ''}`
  }).join(' · ')
  console.log(`${page.name} · ${profile.name}: ${scores}`)
}
console.log(`\nResumo em ${SUMMARY_FILE}, relatórios em ${REPORTS_DIR}/.`)
