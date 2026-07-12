// inject-sparks-desc.js
// Update meta description di sparks.html dengan data terkini dari Sheet.
// PRINSIP KESELAMATAN:
// - Hanya replace SATU baris meta description
// - Anomali apapun → keluar dengan exit 0 TANPA menyentuh file
// - Tidak menyentuh JS, tidak menyentuh sparks/index.html

const fs = require('fs');
const path = require('path');

const SHEET_ID = '1J9SVJGQb7msPTEOpUgsJ2TWWvQ4TntIjrkHZ9nbKgbw';
const SPARKS_PATH = path.join(__dirname, 'sparks.html');

// Marker yang WAJIB ada — kalau tidak ada, skip
const MARKER = '<!--LGS-SPARKS-DESC-->';

async function fetchSheet(sheetName) {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${sheetName}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch ${sheetName} gagal: HTTP ${res.status}`);
  const text = await res.text();
  const m = text.match(/google\.visualization\.Query\.setResponse\(([\s\S]*)\)/);
  if (!m) throw new Error(`Format gviz tidak dikenali`);
  return JSON.parse(m[1]).table.rows || [];
}

function formatBulan(dateStr) {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split(',')[0].trim().split('/');
    if (parts.length !== 3) return '';
    const d = new Date(parts[2], parts[1]-1, parts[0]);
    return d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  } catch(e) { return ''; }
}

async function main() {
  if (!fs.existsSync(SPARKS_PATH)) {
    console.log('[inject-sparks-desc] sparks.html tidak ditemukan — skip.');
    return;
  }

  let html = fs.readFileSync(SPARKS_PATH, 'utf-8');

  // Cek marker ada
  if (!html.includes(MARKER)) {
    console.log('[inject-sparks-desc] Marker tidak ditemukan di sparks.html — skip.');
    return;
  }

  // Ambil data
  let barisS;
  try {
    barisS = await fetchSheet('SPARKS');
  } catch(e) {
    console.log(`[inject-sparks-desc] Gagal fetch Sheet (${e.message}) — skip.`);
    return;
  }

  // Hitung
  const kotaSet = new Set(['Klaten']);
  let totalScan = 0;
  let latestKota = '';
  let latestTs = '';

  barisS.forEach(r => {
    const c = r.c[2]?.v;
    const ts = r.c[6]?.v;
    if (c) {
      totalScan++;
      kotaSet.add(String(c).split(',')[0].trim());
      if (ts) { latestKota = String(c).split(',')[0].trim(); latestTs = String(ts); }
    }
  });

  const jumlahKota = kotaSet.size;
  const bulan = formatBulan(latestTs);

  // Sanity check
  if (jumlahKota < 1 || totalScan < 1 || !latestKota) {
    console.log('[inject-sparks-desc] Angka tidak masuk akal — skip.');
    return;
  }

  const desc = `${jumlahKota} kota telah menyimpan jejak kaos Blumbang ID Klaten — kota terbaru: ${latestKota}${bulan ? ', ' + bulan : ''}. ${totalScan} perjalanan tersimpan dari Klaten ke seluruh dunia.`;

  // Replace marker
  const markerRegex = /<!--LGS-SPARKS-DESC-->[\s\S]*?<!--\/LGS-SPARKS-DESC-->/;
  if (!markerRegex.test(html)) {
    console.log('[inject-sparks-desc] Marker closing tidak ditemukan — skip.');
    return;
  }

  html = html.replace(markerRegex, `<!--LGS-SPARKS-DESC-->${desc}<!--/LGS-SPARKS-DESC-->`);

  // Replace meta description
  html = html.replace(
    /<meta name="description" content="[^"]*">/,
    `<meta name="description" content="${desc}">`
  );

  fs.writeFileSync(SPARKS_PATH, html, 'utf-8');
  console.log(`[inject-sparks-desc] Sukses: ${jumlahKota} kota, ${totalScan} scan, terbaru: ${latestKota}`);
}

main().catch(e => {
  console.log(`[inject-sparks-desc] Error: ${e.message} — skip.`);
});
