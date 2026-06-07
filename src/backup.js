import { T } from './supabaseClient.js'

const BACKUP_VERSION = 1
const PAGE_SIZE = 1000

export const BACKUP_TABLES = [
  { key: 'stammblatt_kunden', table: T.kunden, required: true },
  { key: 'stammblatt_positionen', table: T.positionen, required: true },
  { key: 'stammblatt_touren', table: T.touren, required: true },
  { key: 'stammblatt_tour_kunden', table: T.tour_kunden, required: true },
  { key: 'stammblatt_formular_felder', table: T.formular_felder, required: true },
  { key: 'stammblatt_kunden_felder', table: T.kunden_felder, required: true },
  { key: 'kunden', table: T.gaertnerei_kunden, required: false },
  { key: 'fahrplan', table: 'fahrplan', required: false },
  { key: 'lkw_config', table: 'lkw_config', required: false },
]

async function fetchAllRows(client, table) {
  const rows = []
  let from = 0
  while (true) {
    const { data, error } = await client
      .from(table)
      .select('*')
      .range(from, from + PAGE_SIZE - 1)
    if (error) throw error
    if (!data?.length) break
    rows.push(...data)
    if (data.length < PAGE_SIZE) break
    from += PAGE_SIZE
  }
  return rows
}

export async function exportSupabaseBackup(client) {
  const data = {}
  const tables = {}
  const warnings = []

  for (const { key, table, required } of BACKUP_TABLES) {
    try {
      const rows = await fetchAllRows(client, table)
      data[key] = rows
      tables[key] = rows.length
    } catch (e) {
      if (required) throw new Error(`${key}: ${e.message}`)
      warnings.push(`${key}: ${e.message}`)
      data[key] = []
      tables[key] = 0
    }
  }

  const recordCount = Object.values(tables).reduce((s, n) => s + n, 0)

  return {
    meta: {
      version: BACKUP_VERSION,
      exportedAt: new Date().toISOString(),
      app: 'botanikum-stammblatt',
      mode: 'supabase',
      tables,
      recordCount,
      warnings,
    },
    data,
  }
}

export function exportDemoBackup({ kunden, positionenByKunde, touren, schema }) {
  const positionen = Object.values(positionenByKunde || {}).flat()
  const tourKunden = (touren || []).flatMap(t =>
    (t.kundenIds || []).map((kundeId, sortOrder) => ({
      tour_id: t.id,
      kunde_id: kundeId,
      sort_order: sortOrder,
    }))
  )
  const tours = (touren || []).map(({ kundenIds, ...t }) => t)

  const tables = {
    stammblatt_kunden: kunden.length,
    stammblatt_positionen: positionen.length,
    stammblatt_touren: tours.length,
    stammblatt_tour_kunden: tourKunden.length,
    stammblatt_formular_felder: (schema || []).length,
    stammblatt_kunden_felder: 0,
  }

  return {
    meta: {
      version: BACKUP_VERSION,
      exportedAt: new Date().toISOString(),
      app: 'botanikum-stammblatt',
      mode: 'demo',
      tables,
      recordCount: Object.values(tables).reduce((s, n) => s + n, 0),
      warnings: ['Demo-Modus: nur lokale Beispieldaten, keine Gärtnerei-Tabellen'],
    },
    data: {
      stammblatt_kunden: kunden,
      stammblatt_positionen: positionen,
      stammblatt_touren: tours,
      stammblatt_tour_kunden: tourKunden,
      stammblatt_formular_felder: schema || [],
      stammblatt_kunden_felder: [],
    },
  }
}

export function downloadBackupFile(payload) {
  const stamp = payload.meta.exportedAt.slice(0, 10)
  const filename = `botanikum-backup-${stamp}.json`
  const json = JSON.stringify(payload, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
  return filename
}
