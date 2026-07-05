// ============================================================
// INJECT-STATS.JS
// Mengisi angka statistik statis di index.html (marker LGS)
// supaya bukti sosial terbaca crawler/AI tanpa JavaScript.
//
// Rumus PERSIS sama dengan muatStats() di index.html —
// jangan ubah salah satu tanpa ubah keduanya.
//
// Dipanggil oleh: .github/workflows/sparks-build.yml (harian)
// Bisa juga dijalankan manual: node inject-stats.js
//
// PRINSIP KESELAMATAN:
// - Anomali apapun (fetch gagal, marker hilang, angka aneh)
//   → keluar dengan exit 0 TANPA menyentuh file.
//   Build sparks tidak boleh ikut gagal gara-gara script ini.
// - TIDAK PERNAH menyentuh sparks.html atau file lain.
// ============================================================

const fs = require('fs');
const path = require('path');

const SHEET_ID = '1J9SVJGQb7msPTEOpUgsJ2TWWvQ4TntIjrkHZ9nbKgbw';
const INDEX_PATH = path.join(__dirname, 'index.html');

// Jumlah marker yang WAJIB ada di index.html.
// Kalau tidak cocok = index.html sudah berubah tak terduga → jangan sentuh.
const EXPECTED_MARKERS = {
  GARMENT: 1,
  BERJALAN: 1,
  SCAN: 1,
  KOTA: 4,     // stats-bar + kalimat peta HTML + kamus i18n ID + EN
  NEGARA: 4,
};

function markerRegex(name) {
  return new RegExp(`<!--LGS:${name}-->[\\s\\S]*?<!--/LGS:${name}-->`, 'g');
}

async function fetchSheet(sheetName) {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${sheetName}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch ${sheetName} gagal: HTTP ${res.status}`);
  const text = await res.text();
  const m = text.match(/google\.visualization\.Query\.setResponse\(([\s\S]*)\)/);
  if (!m) throw new Error(`Format gviz ${sheetName} tidak dikenali`);
  return JSON.parse(m[1]).table.rows || [];
}

async function main() {
  // ── 1. Baca index.html & verifikasi marker SEBELUM apa-apa ──
  if (!fs.existsSync(INDEX_PATH)) {
    console.log('[inject-stats] index.html tidak ditemukan — skip.');
    return;
  }
  let html = fs.readFileSync(INDEX_PATH, 'utf-8');

  for (const [name, expected] of Object.entries(EXPECTED_MARKERS)) {
    const found = (html.match(markerRegex(name)) || []).length;
    if (found !== expected) {
      console.log(`[inject-stats] Marker LGS:${name} = ${found}, harusnya ${expected}. index.html berubah tak terduga — SKIP tanpa menyentuh file.`);
      return;
    }
  }

  // ── 2. Ambil data (kalau gagal → skip, jangan gagalkan build) ──
  let barisG, barisS;
  try {
    [barisG, barisS] = await Promise.all([
      fetchSheet('GARMENTS'),
      fetchSheet('SPARKS'),
    ]);
  } catch (e) {
    console.log(`[inject-stats] Gagal ambil data Sheet (${e.message}) — SKIP tanpa menyentuh file.`);
    return;
  }

  // ── 3. Hitung — rumus identik dengan muatStats() di index.html ──
  const totalGarment = barisG.filter(r => r.c[0]?.v).length;
  const kotaSet = new Set(['Klaten']);
  const negaraSet = new Set(['Indonesia']);
  const garmentJalan = new Set();
  let totalScan = 0;

  barisS.forEach(r => {
    const id = r.c[0]?.v, c = r.c[2]?.v;
    if (id) garmentJalan.add(id);
    if (c) {
      totalScan++;
      kotaSet.add(String(c).split(',')[0].trim());
      if (String(c).includes(',')) negaraSet.add(String(c).split(',').pop().trim());
    }
  });

  const nilai = {
    GARMENT: totalGarment,
    BERJALAN: garmentJalan.size,
    SCAN: totalScan,
    KOTA: kotaSet.size,
    NEGARA: negaraSet.size,
  };

  // ── 4. Sanity check — angka nol/aneh berarti data bermasalah ──
  for (const [name, v] of Object.entries(nilai)) {
    if (!Number.isInteger(v) || v < 1) {
      console.log(`[inject-stats] Nilai ${name}=${v} tidak masuk akal — SKIP tanpa menyentuh file.`);
      return;
    }
  }

  // ── 5. Replace isi marker ──
  for (const [name, v] of Object.entries(nilai)) {
    html = html.replace(markerRegex(name), `<!--LGS:${name}-->${v}<!--/LGS:${name}-->`);
  }

  // ── 6. Verifikasi SESUDAH: jumlah marker harus tetap sama ──
  for (const [name, expected] of Object.entries(EXPECTED_MARKERS)) {
    const found = (html.match(markerRegex(name)) || []).length;
    if (found !== expected) {
      console.log(`[inject-stats] Verifikasi pasca-replace gagal (LGS:${name}) — BATAL, file tidak ditulis.`);
      return;
    }
  }

  fs.writeFileSync(INDEX_PATH, html, 'utf-8');
  console.log('[inject-stats] Sukses. Angka terbaru:');
  console.log(`  Kaos Terdaftar      : ${nilai.GARMENT}`);
  console.log(`  Sudah Berjalan      : ${nilai.BERJALAN}`);
  console.log(`  Perjalanan Tersimpan: ${nilai.SCAN}`);
  console.log(`  Kota                : ${nilai.KOTA}`);
  console.log(`  Negara              : ${nilai.NEGARA}`);
}

main().catch(e => {
  // Error tak terduga pun tidak boleh menggagalkan build sparks
  console.log(`[inject-stats] Error tak terduga: ${e.message} — skip.`);
});
