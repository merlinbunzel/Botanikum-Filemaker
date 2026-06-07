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

const CELL_BORDER = {
  top: { style: BorderStyle.SINGLE, size: 1, color: 'AAAAAA' },
  bottom: { style: BorderStyle.SINGLE, size: 1, color: 'AAAAAA' },
  left: { style: BorderStyle.SINGLE, size: 1, color: 'AAAAAA' },
  right: { style: BorderStyle.SINGLE, size: 1, color: 'AAAAAA' },
}

function fmt2(n) {
  return isNaN(n) || n === null ? '0,00' : Number(n).toFixed(2).replace('.', ',')
}

function txt(text, opts = {}) {
  return new TextRun({
    text: String(text ?? ''),
    font: 'Arial',
    size: opts.size ?? 20,
    bold: !!opts.bold,
    color: opts.color,
  })
}

function para(children, opts = {}) {
  const runs = Array.isArray(children) ? children : [txt(children, opts)]
  return new Paragraph({
    alignment: opts.align,
    spacing: { after: opts.after ?? 120, before: opts.before ?? 0 },
    children: runs,
  })
}

function cell(content, opts = {}) {
  const children = Array.isArray(content)
    ? content
    : [para(content, { align: opts.align, size: opts.size, bold: opts.bold })]
  return new TableCell({
    borders: CELL_BORDER,
    shading: opts.shading ? { fill: opts.shading } : undefined,
    width: opts.width ? { size: opts.width, type: WidthType.DXA } : undefined,
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    children,
  })
}

export function buildRechnungData(data, formulaMap, preisPro10cm, effectivePreis) {
  const pos = (data.positionen || []).filter(
    p => p.art || p.cm || effectivePreis(p, formulaMap, preisPro10cm)
  )
  const rabattFak = parseFloat(data.rabatt_xf) || 1
  const sumPreis = pos.reduce((s, p) => s + effectivePreis(p, formulaMap, preisPro10cm), 0)
  const transPreis = parseFloat(data.trans_preis) || 0
  const duengerP = parseFloat(data.duenger_preis) || 0
  const zusatz = (data.zusatzposten || []).filter(z => z.aktiv)
  const zusatzSumme = zusatz.reduce((s, z) => s + (parseFloat(z.preis) || 0), 0)
  const netto = sumPreis / rabattFak + transPreis + duengerP + zusatzSumme
  const mwst = netto * 0.19
  const brutto = netto + mwst
  const kundeName = [data.firma, data.vorname].filter(Boolean).join(' · ') || '–'
  const addr = [data.strasse, [data.plz, data.ort].filter(Boolean).join(' ')].filter(Boolean)
  const jahr = data.jahr || new Date().getFullYear()
  const today = new Date().toISOString().split('T')[0]

  return {
    pos,
    sumPreis,
    rabattFak,
    transPreis,
    duengerP,
    zusatz,
    netto,
    mwst,
    brutto,
    kundeName,
    addr,
    jahr,
    today,
    data,
    rows: pos.map(p => {
      const preis = effectivePreis(p, formulaMap, preisPro10cm)
      return {
        label: p.label,
        art: p.art || '–',
        anzahl: p.anzahl || 1,
        cm: p.cm || '–',
        preis: preis > 0 ? fmt2(preis) : '–',
      }
    }),
  }
}

function positionsTable(rows) {
  const header = new TableRow({
    tableHeader: true,
    children: [
      cell('Pos', { bold: true, shading: 'E8E8E8', width: 900, align: AlignmentType.CENTER }),
      cell('Pflanzenart / Beschreibung', { bold: true, shading: 'E8E8E8', width: 5200 }),
      cell('Anz.', { bold: true, shading: 'E8E8E8', width: 900, align: AlignmentType.RIGHT }),
      cell('cm', { bold: true, shading: 'E8E8E8', width: 900, align: AlignmentType.RIGHT }),
      cell('Preis €', { bold: true, shading: 'E8E8E8', width: 1400, align: AlignmentType.RIGHT }),
    ],
  })

  const bodyRows = rows.length
    ? rows.map(r =>
        new TableRow({
          children: [
            cell(r.label, { align: AlignmentType.CENTER, width: 900 }),
            cell(r.art, { width: 5200 }),
            cell(String(r.anzahl), { align: AlignmentType.RIGHT, width: 900 }),
            cell(String(r.cm), { align: AlignmentType.RIGHT, width: 900 }),
            cell(r.preis, { align: AlignmentType.RIGHT, width: 1400 }),
          ],
        })
      )
    : [
        new TableRow({
          children: [
            new TableCell({
              columnSpan: 5,
              borders: CELL_BORDER,
              margins: { top: 60, bottom: 60, left: 100, right: 100 },
              children: [para('Keine Positionen erfasst', { align: AlignmentType.CENTER })],
            }),
          ],
        }),
      ]

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [header, ...bodyRows],
  })
}

function totalsTable(r) {
  const lines = [
    ['Pflanzen gesamt', `${fmt2(r.sumPreis)} €`],
  ]
  if (r.rabattFak !== 1) lines.push([`Rabatt (×${r.rabattFak})`, `${fmt2(r.sumPreis / r.rabattFak)} €`])
  if (r.data.rabatt_txt) lines.push([r.data.rabatt_txt, ''])
  if (r.transPreis > 0) {
    lines.push([
      `Transport${r.data.trans_txt ? `: ${r.data.trans_txt}` : ''}`,
      `${fmt2(r.transPreis)} €`,
    ])
  }
  if (r.duengerP > 0) {
    lines.push([
      `Dünger${r.data.duenger_txt ? `: ${r.data.duenger_txt}` : ''}`,
      `${fmt2(r.duengerP)} €`,
    ])
  }
  for (const z of r.zusatz) {
    lines.push([z.label, `${fmt2(parseFloat(z.preis) || 0)} €`])
  }
  lines.push(['Netto', `${fmt2(r.netto)} €`])
  lines.push(['MwSt. 19 %', `${fmt2(r.mwst)} €`])
  lines.push(['Gesamtbetrag', `${fmt2(r.brutto)} €`])

  return new Table({
    width: { size: 4200, type: WidthType.DXA },
    alignment: AlignmentType.RIGHT,
    rows: lines.map(([label, value], i) =>
      new TableRow({
        children: [
          cell(label, { bold: i === lines.length - 1, size: i === lines.length - 1 ? 24 : 20 }),
          cell(value, {
            bold: i === lines.length - 1,
            size: i === lines.length - 1 ? 24 : 20,
            align: AlignmentType.RIGHT,
          }),
        ],
      })
    ),
  })
}

export async function downloadRechnungDocx(rechnung) {
  const r = rechnung
  const meta = []
  if (r.data.code) meta.push(`Kunden-Nr.: ${r.data.code}`)
  if (r.data.auslieferung_abholung) meta.push(`Lieferung: ${r.data.auslieferung_abholung}`)
  meta.push(`Datum: ${r.today}`)

  const kundeLines = [
    para(r.kundeName, { bold: true, size: 26, after: 80 }),
    ...r.addr.map(line => para(line, { after: 60 })),
  ]
  if (r.data.ortsteil) kundeLines.push(para(`Ortsteil: ${r.data.ortsteil}`, { after: 60 }))
  if (r.data.telefon) kundeLines.push(para(`Tel.: ${r.data.telefon}`, { after: 60 }))

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: { top: 1200, right: 1200, bottom: 1200, left: 1200 },
        },
      },
      children: [
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.NONE, size: 0 },
            bottom: { style: BorderStyle.NONE, size: 0 },
            left: { style: BorderStyle.NONE, size: 0 },
            right: { style: BorderStyle.NONE, size: 0 },
            insideHorizontal: { style: BorderStyle.NONE, size: 0 },
            insideVertical: { style: BorderStyle.NONE, size: 0 },
          },
          rows: [new TableRow({
            children: [
              new TableCell({
                borders: {
                  top: { style: BorderStyle.NONE, size: 0 },
                  bottom: { style: BorderStyle.NONE, size: 0 },
                  left: { style: BorderStyle.NONE, size: 0 },
                  right: { style: BorderStyle.NONE, size: 0 },
                },
                width: { size: 60, type: WidthType.PERCENTAGE },
                children: [
                  para('Botanikum', { bold: true, size: 44, color: '166534', after: 60 }),
                  para(`Rechnung / Stammblatt ${r.jahr}`, { size: 20, after: 200 }),
                ],
              }),
              new TableCell({
                borders: {
                  top: { style: BorderStyle.NONE, size: 0 },
                  bottom: { style: BorderStyle.NONE, size: 0 },
                  left: { style: BorderStyle.NONE, size: 0 },
                  right: { style: BorderStyle.NONE, size: 0 },
                },
                width: { size: 40, type: WidthType.PERCENTAGE },
                children: meta.map(line =>
                  para(line, { align: AlignmentType.RIGHT, after: 60 })
                ),
              }),
            ],
          })],
        }),
        para('Kunde', { bold: true, size: 18, color: '666666', after: 80 }),
        ...kundeLines,
        para('', { after: 160 }),
        positionsTable(r.rows),
        para('', { after: 160 }),
        new Paragraph({ alignment: AlignmentType.RIGHT, children: [] }),
        totalsTable(r),
        ...(r.data.bemerkungen_aktuell
          ? [
              para('', { after: 240 }),
              para('Bemerkungen', { bold: true, size: 18, color: '666666', after: 80 }),
              para(r.data.bemerkungen_aktuell, { after: 120 }),
            ]
          : []),
        para('', { before: 400, after: 0 }),
        para(`Botanikum · Erstellt am ${r.today}`, { align: AlignmentType.CENTER, size: 16, color: '999999' }),
      ],
    }],
  })

  const blob = await Packer.toBlob(doc)
  const slug = (r.data.code || r.kundeName || 'Kunde')
    .replace(/[^\wäöüÄÖÜß\-]+/g, '_')
    .slice(0, 40)
  const filename = `Rechnung_${slug}_${r.today}.docx`

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
  return filename
}
