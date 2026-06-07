import {
  AlignmentType,
  BorderStyle,
  Document,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx'
import { T } from './supabaseClient.js'

const CELL_BORDER = {
  top: { style: BorderStyle.SINGLE, size: 1, color: 'AAAAAA' },
  bottom: { style: BorderStyle.SINGLE, size: 1, color: 'AAAAAA' },
  left: { style: BorderStyle.SINGLE, size: 1, color: 'AAAAAA' },
  right: { style: BorderStyle.SINGLE, size: 1, color: 'AAAAAA' },
}

function fmtDate(iso) {
  if (!iso) return '–'
  const [y, m, d] = iso.split('-')
  return d && m && y ? `${d}.${m}.${y}` : iso
}

function para(text, opts = {}) {
  return new Paragraph({
    alignment: opts.align,
    spacing: { after: opts.after ?? 120, before: opts.before ?? 0 },
    children: [new TextRun({
      text: String(text ?? ''),
      font: 'Arial',
      size: opts.size ?? 20,
      bold: !!opts.bold,
      color: opts.color,
    })],
  })
}

function cell(content, opts = {}) {
  return new TableCell({
    borders: CELL_BORDER,
    shading: opts.shading ? { fill: opts.shading } : undefined,
    width: opts.width ? { size: opts.width, type: WidthType.DXA } : undefined,
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    verticalAlign: opts.vAlign,
    children: [para(content, { align: opts.align, bold: opts.bold, size: opts.size })],
  })
}

export function kundeAdresse(k) {
  const lines = []
  const name = [k.firma, k.vorname].filter(Boolean).join(' · ')
  if (name) lines.push(name)
  if (k.strasse) lines.push(k.strasse)
  const ort = [k.plz, k.ort].filter(Boolean).join(' ')
  if (ort) lines.push(ort)
  if (k.ortsteil) lines.push(`Ortsteil: ${k.ortsteil}`)
  return lines.join('\n')
}

export function kundeName(k) {
  return k.firma || k.vorname || '–'
}

export async function fetchPflanzenCounts(client, kundeIds, demoPositionen = null) {
  const counts = Object.fromEntries(kundeIds.map(id => [id, 0]))
  if (!kundeIds.length) return counts

  if (demoPositionen) {
    for (const id of kundeIds) {
      const pos = demoPositionen[id] || []
      counts[id] = pos
        .filter(p => p.art || p.cm)
        .reduce((s, p) => s + (parseFloat(p.anzahl) || 1), 0)
    }
    return counts
  }

  const { data, error } = await client
    .from(T.positionen)
    .select('kunde_id,anzahl,art,cm')
    .in('kunde_id', kundeIds)
  if (error) throw error
  for (const p of data || []) {
    if (!p.art && !p.cm) continue
    counts[p.kunde_id] = (counts[p.kunde_id] || 0) + (parseFloat(p.anzahl) || 1)
  }
  return counts
}

function kundenTable(stops) {
  const header = new TableRow({
    tableHeader: true,
    children: [
      cell('Nr.', { bold: true, shading: 'E8E8E8', width: 600, align: AlignmentType.CENTER }),
      cell('Kunde', { bold: true, shading: 'E8E8E8', width: 2200 }),
      cell('Adresse', { bold: true, shading: 'E8E8E8', width: 3600 }),
      cell('Pflanzen', { bold: true, shading: 'E8E8E8', width: 900, align: AlignmentType.CENTER }),
    ],
  })

  const rows = stops.length
    ? stops.map((s, i) =>
        new TableRow({
          children: [
            cell(String(i + 1), { align: AlignmentType.CENTER, width: 600 }),
            cell(s.name, { width: 2200 }),
            cell(s.adresse, { width: 3600 }),
            cell(String(s.pflanzen), { align: AlignmentType.CENTER, width: 900, bold: true }),
          ],
        })
      )
    : [
        new TableRow({
          children: [
            new TableCell({
              columnSpan: 4,
              borders: CELL_BORDER,
              margins: { top: 60, bottom: 60, left: 100, right: 100 },
              children: [para('Keine Kunden auf dieser Tour', { align: AlignmentType.CENTER })],
            }),
          ],
        }),
      ]

  const total = stops.reduce((s, x) => s + x.pflanzen, 0)
  const footer = new TableRow({
    children: [
      cell('', { width: 600 }),
      cell('Gesamt', { bold: true, width: 2200 }),
      cell(`${stops.length} Stopps`, { bold: true, width: 3600 }),
      cell(String(total), { bold: true, align: AlignmentType.CENTER, width: 900 }),
    ],
  })

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [header, ...rows, footer],
  })
}

export async function downloadTourDocx({ tour, kunden, pflanzenCounts }) {
  const today = new Date().toISOString().split('T')[0]
  const stops = (tour.kundenIds || [])
    .map(id => kunden.find(k => k.id === id))
    .filter(Boolean)
    .map(k => ({
      name: kundeName(k),
      adresse: kundeAdresse(k).split('\n').slice(1).join('\n') || kundeAdresse(k),
      pflanzen: pflanzenCounts[k.id] || 0,
    }))

  const doc = new Document({
    sections: [{
      properties: {
        page: { margin: { top: 1200, right: 1200, bottom: 1200, left: 1200 } },
      },
      children: [
        para('Botanikum – Fahrerliste', { bold: true, size: 36, color: '166534', after: 80 }),
        para(tour.name || 'Tour', { bold: true, size: 28, after: 60 }),
        para(`Datum: ${fmtDate(tour.datum)}`, { size: 22, after: 60 }),
        para(`Fahrer: ${tour.fahrer || '–'}`, { size: 22, after: 200 }),
        kundenTable(stops),
        para('', { before: 300 }),
        para(`Erstellt am ${fmtDate(today)}`, { align: AlignmentType.CENTER, size: 16, color: '999999' }),
      ],
    }],
  })

  const blob = await Packer.toBlob(doc)
  const slug = (tour.name || 'Tour').replace(/[^\wäöüÄÖÜß\-]+/g, '_').slice(0, 30)
  const dateSlug = (tour.datum || today).replace(/-/g, '')
  const filename = `Fahrerliste_${slug}_${dateSlug}.docx`

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
  return filename
}

export async function downloadAlleTourenDocx({ touren, kunden, pflanzenCounts }) {
  const today = new Date().toISOString().split('T')[0]
  const sorted = [...touren].sort((a, b) => (a.datum || '').localeCompare(b.datum || ''))

  const children = [
    para('Botanikum – Tourenübersicht', { bold: true, size: 36, color: '166534', after: 80 }),
    para(`Erstellt am ${fmtDate(today)}`, { size: 20, after: 240 }),
  ]

  for (const tour of sorted) {
    const stops = (tour.kundenIds || [])
      .map(id => kunden.find(k => k.id === id))
      .filter(Boolean)
      .map(k => ({
        name: kundeName(k),
        adresse: kundeAdresse(k).split('\n').slice(1).join('\n') || kundeAdresse(k),
        pflanzen: pflanzenCounts[k.id] || 0,
      }))

    children.push(
      para(`${tour.name || 'Tour'} · ${fmtDate(tour.datum)} · Fahrer: ${tour.fahrer || '–'}`, {
        bold: true,
        size: 24,
        before: 200,
        after: 120,
      }),
      kundenTable(stops),
    )
  }

  children.push(
    para('', { before: 300 }),
    para(`Botanikum · ${sorted.length} Tour${sorted.length !== 1 ? 'en' : ''}`, {
      align: AlignmentType.CENTER,
      size: 16,
      color: '999999',
    }),
  )

  const doc = new Document({ sections: [{ properties: { page: { margin: { top: 1200, right: 1200, bottom: 1200, left: 1200 } } }, children }] })
  const blob = await Packer.toBlob(doc)
  const filename = `Fahrerlisten_alle_${today.replace(/-/g, '')}.docx`
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
  return filename
}
