'use node'

import { Sandbox } from '@vercel/sandbox'
import { v } from 'convex/values'
import { internal } from '../_generated/api'
import { action } from '../_generated/server'
import { scrapeMalawi24ArticlesScript } from '../scripts/main'
import type { ActionCtx } from '../_generated/server'

const SCRAPER_TOOL_KEY = 'scrapeMalawi24Articles'
const SCRAPER_RUNTIME = 'python3.13'

const PLAYWRIGHT_SYSTEM_DEPENDENCIES = [
  'nss',
  'nspr',
  'atk',
  'at-spi2-atk',
  'at-spi2-core',
  'libXcomposite',
  'libXdamage',
  'libXrandr',
  'libXfixes',
  'libXcursor',
  'libXi',
  'libXtst',
  'libXScrnSaver',
  'libXext',
  'libxkbcommon',
  'mesa-libgbm',
  'libdrm',
  'mesa-libGL',
  'mesa-libEGL',
  'cups-libs',
  'alsa-lib',
  'pango',
  'cairo',
  'gtk3',
  'dbus-libs',
] as const

type SandboxInstance = Awaited<ReturnType<typeof Sandbox.create>>

async function logCommandOutput(
  result: Awaited<ReturnType<Sandbox['runCommand']>>,
  label: string,
) {
  console.log(label)
  for await (const log of result.logs()) {
    if (log.stream === 'stdout') {
      console.log(log.data)
    } else {
      console.error(log.data)
    }
  }
}

function createSandbox(snapshotId?: string) {
  const options = {
    token: process.env.VERCEL_ACCESS_TOKEN,
    projectId: process.env.VERCEL_PROJECT_ID,
    teamId: process.env.VERCEL_TEAM_ID,
    ...(snapshotId
      ? {
          source: {
            type: 'snapshot' as const,
            snapshotId,
          },
        }
      : {
          runtime: SCRAPER_RUNTIME,
        }),
  }

  return Sandbox.create(options)
}

function normalizeSnapshotExpiresAt(value: unknown) {
  if (typeof value === 'number') {
    return value
  }

  if (typeof value === 'string') {
    const parsed = Date.parse(value)
    return Number.isNaN(parsed) ? undefined : parsed
  }

  if (value instanceof Date) {
    return value.getTime()
  }

  return undefined
}

async function installScraperDependencies(sandbox: SandboxInstance) {
  const systemDepsResult = await sandbox.runCommand('sudo', [
    'dnf',
    'install',
    '-y',
    ...PLAYWRIGHT_SYSTEM_DEPENDENCIES,
  ])
  await logCommandOutput(
    systemDepsResult,
    'INSTALLING PLAYWRIGHT SYSTEM DEPENDENCIES',
  )

  const pipResult = await sandbox.runCommand('pip', [
    'install',
    'pysqlite3-binary',
    'scrapling[fetchers]',
    'playwright',
  ])
  await logCommandOutput(pipResult, 'INSTALLING PYTHON DEPENDENCIES')

  const playwrightResult = await sandbox.runCommand('python', [
    '-m',
    'playwright',
    'install',
    'chromium',
  ])
  await logCommandOutput(playwrightResult, 'INSTALLING PLAYWRIGHT CHROMIUM')
}

async function runMalawi24Scraper(
  sandbox: SandboxInstance,
  args: {
    year: number
    month: number
    day: number
  },
) {
  const result = await sandbox.runCommand('python', [
    '-c',
    scrapeMalawi24ArticlesScript({
      year: args.year,
      month: args.month,
      day: args.day,
    }),
  ])
  await logCommandOutput(result, 'RUNNING SCRAPER')

  const stdout = await result.stdout()
  JSON.parse(stdout)
  return stdout
}

async function bootstrapScraperSnapshot(ctx: ActionCtx) {
  const sandbox = await createSandbox()
  let snapshotCreated = false

  try {
    console.log('SNAPSHOT MISS: bootstrapping fresh sandbox environment')
    await installScraperDependencies(sandbox)

    console.log('CREATING SANDBOX SNAPSHOT FOR MALAWI24 SCRAPER')
    const snapshot = await sandbox.snapshot()
    snapshotCreated = true

    if (!snapshot.snapshotId) {
      throw new Error('Snapshot creation did not return a snapshotId.')
    }
    const expiresAt = normalizeSnapshotExpiresAt(snapshot.expiresAt)

    await ctx.runMutation(
      internal.agents.sandboxSnapshots.upsertSandboxSnapshot,
      {
        toolKey: SCRAPER_TOOL_KEY,
        runtime: SCRAPER_RUNTIME,
        snapshotId: snapshot.snapshotId,
        status: 'ready',
        expiresAt,
      },
    )

    return snapshot.snapshotId
  } finally {
    if (!snapshotCreated) {
      await sandbox.stop()
    }
  }
}

async function ensureScraperSnapshot(ctx: ActionCtx) {
  const existingSnapshot = (await ctx.runQuery(
    internal.agents.sandboxSnapshots.getSandboxSnapshot,
    {
      toolKey: SCRAPER_TOOL_KEY,
      runtime: SCRAPER_RUNTIME,
    },
  )) as { snapshotId: string; expiresAt?: number } | null

  if (existingSnapshot?.snapshotId) {
    console.log(
      `SNAPSHOT HIT: using cached snapshot ${existingSnapshot.snapshotId}`,
    )
    return existingSnapshot.snapshotId
  }

  return bootstrapScraperSnapshot(ctx)
}

export const scrapeMalawi24Articles = action({
  args: v.object({
    year: v.number(),
    month: v.number(),
    day: v.number(),
  }),
  handler: async (ctx, args) => {
    const snapshotId = await ensureScraperSnapshot(ctx)
    let sandbox: Awaited<ReturnType<typeof Sandbox.create>> | null = null

    try {
      try {
        sandbox = await createSandbox(snapshotId)
      } catch (error) {
        console.error(
          `SNAPSHOT REBUILD: failed to start sandbox from snapshot ${snapshotId}`,
          error,
        )
        await ctx.runMutation(
          internal.agents.sandboxSnapshots.markSandboxSnapshotStale,
          {
            toolKey: SCRAPER_TOOL_KEY,
            runtime: SCRAPER_RUNTIME,
          },
        )

        const rebuiltSnapshotId = await bootstrapScraperSnapshot(ctx)
        sandbox = await createSandbox(rebuiltSnapshotId)
      }

      return await runMalawi24Scraper(sandbox, args)
    } finally {
      if (sandbox) {
        await sandbox.stop()
      }
    }
  },
})
