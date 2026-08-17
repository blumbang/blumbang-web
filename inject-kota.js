// ============================================================
// INJECT-KOTA.JS
// Mengisi angka bukti PER KOTA di halaman layanan (marker LGS).
// Rumus diambil dari lib-stats.js — sumber tunggal, sama dengan
// yang dipakai build-sparks.js dan inject-stats.js.
//
// PRINSIP KESELAMATAN (sama persis dengan inject-stats.js):
// - Anomali apapun → keluar TANPA menyentuh file. Build tidak boleh gagal.
// - Kegagalan pada satu file tidak membatalkan file lain.
// ============================================================

const fs = require('fs');
const path = require('path');
const { getCellVal, filterScanRows, groupKota } = require('./lib-stats.js');

const SHEET_ID = '1J9SVJGQb7msPTEOpUgsJ2TWWvQ4TntIjrkHZ9nbKgbw';

// Menambah halaman baru: tambahkan entri di sini + pasang penanda di HTML-nya
// + tambahkan nama filenya ke `git add` pada sparks-build.yml.
const TARGETS = [
  { file: 'sablon-jogja.html', marker: 'KOTA_JOGJA', kotaSlug: 'yogyakarta' },
];

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

function prosesFile(target, jumlah) {
  const fullPath = path.join(__dirname, target.file);

  if (!fs.existsSync(fullPath)) {
    console.log(`[inject-kota] ${target.file} tidak ditemukan — skip.`);
    return false;
  }
  let html = fs.readFileSync(fullPath, 'utf-8');

  const sebelum = (html.match(markerRegex(target.marker)) || []).length;
  if (sebelum !== 1) {
    console.log(`[inject-kota] ${target.file}: marker LGS:${target.marker} = ${sebelum}, harusnya 1 — SKIP tanpa menyentuh file.`);
    return false;
  }

  const isi = `${jumlah} kaos`;
  html = html.replace(markerRegex(target.marker), `<!--LGS:${target.marker}-->${isi}<!--/LGS:${target.marker}-->`);

  const sesudah = (html.match(markerRegex(target.marker)) || []).length;
  if (sesudah !== 1) {
    console.log(`[inject-kota] ${target.file}: verifikasi pasca-replace gagal — BATAL, file tidak ditulis.`);
    return false;
  }

  fs.writeFileSync(fullPath, html, 'utf-8');
  console.log(`[inject-kota] ${target.file} OK — ${target.marker} = ${isi}`);
  return true;
}

async function main() {
  let barisS;
  try {
    barisS = await fetchSheet('SPARKS');
  } catch (e) {
    console.log(`[inject-kota] Gagal ambil data Sheet (${e.message}) — SKIP tanpa menyentuh file.`);
    return;
  }

  const kotaMap = groupKota(filterScanRows(barisS));

  let sukses = 0;
  for (const target of TARGETS) {
    const data = kotaMap[target.kotaSlug];
    if (!data) {
      console.log(`[inject-kota] Kota "${target.kotaSlug}" tidak ada di data — skip ${target.file}.`);
      continue;
    }

    const unik = new Set(data.scans.map(r => getCellVal(r.c[0])).filter(Boolean));
    const jumlah = unik.size;

    if (!Number.isInteger(jumlah) || jumlah < 1) {
      console.log(`[inject-kota] Jumlah kaos "${target.kotaSlug}" = ${jumlah} tidak masuk akal — skip.`);
      continue;
    }

    if (prosesFile(target, jumlah)) sukses++;
  }

  console.log(`[inject-kota] Selesai: ${sukses}/${TARGETS.length} file diperbarui.`);
}

main().catch(e => {
  console.log(`[inject-kota] Error tak terduga: ${e.message} — skip.`);
});
