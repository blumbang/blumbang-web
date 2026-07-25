// ============================================================
// INJECT-STATS.JS
// Mengisi angka statistik statis di index.html DAN kemitraan.html
// (marker LGS)
// supaya bukti sosial terbaca crawler/AI tanpa JavaScript.
//
// Rumus hitung diambil dari lib-stats.js — SUMBER TUNGGAL,
// dipakai bersama oleh build-sparks.js dan inject-sparks-desc.js
// supaya angka di /sparks dan homepage dijamin identik secara
// struktural, bukan cuma dijaga manual lewat komentar.
//
// Dipanggil oleh: .github/workflows/sparks-build.yml (harian)
// Bisa juga dijalankan manual: node inject-stats.js
//
// PRINSIP KESELAMATAN:
// - Anomali apapun (fetch gagal, marker hilang, angka aneh)
//   → keluar dengan exit 0 TANPA menyentuh file.
//   Build sparks tidak boleh ikut gagal gara-gara script ini.
// - Hanya menyentuh file yang terdaftar di TARGETS. Kegagalan pada satu
//   file TIDAK membatalkan file lain.
// ============================================================

const fs = require('fs');
const path = require('path');
const { hitungStatistik } = require('./lib-stats.js');

const SHEET_ID = '1J9SVJGQb7msPTEOpUgsJ2TWWvQ4TntIjrkHZ9nbKgbw';

// Daftar file yang diisi angkanya.
// Tiap file punya jumlah penanda sendiri — kalau tidak cocok, file ITU SAJA
// yang dilewati. File lain tetap diproses normal.
//
// Menambah halaman baru: tambahkan entri di sini + pasang penanda di HTML-nya
// + tambahkan nama filenya ke `git add` pada sparks-build.yml.
const TARGETS = [
  {
    file: 'index.html',
    markers: {
      GARMENT: 1,
      BERJALAN: 1,
      SCAN: 1,
      KOTA: 4,     // stats-bar + kalimat peta HTML + kamus i18n ID + EN
      NEGARA: 4,
    },
  },
  {
    file: 'kemitraan.html',
    markers: {
      GARMENT: 1,  // section bukti
      KOTA: 1,
      NEGARA: 1,
    },
  },
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

// Proses satu file. Semua kegagalan bersifat lokal: return false,
// file lain di daftar TARGETS tetap diproses.
function prosesFile(target, nilai) {
  const fullPath = path.join(__dirname, target.file);

  if (!fs.existsSync(fullPath)) {
    console.log(`[inject-stats] ${target.file} tidak ditemukan — skip.`);
    return false;
  }
  let html = fs.readFileSync(fullPath, 'utf-8');

  // ── Verifikasi marker SEBELUM apa-apa ──
  for (const [name, expected] of Object.entries(target.markers)) {
    const found = (html.match(markerRegex(name)) || []).length;
    if (found !== expected) {
      console.log(`[inject-stats] ${target.file}: marker LGS:${name} = ${found}, harusnya ${expected}. Berubah tak terduga — SKIP tanpa menyentuh file.`);
      return false;
    }
  }

  // ── Replace isi marker (hanya yang terdaftar untuk file ini) ──
  for (const name of Object.keys(target.markers)) {
    html = html.replace(markerRegex(name), `<!--LGS:${name}-->${nilai[name]}<!--/LGS:${name}-->`);
  }

  // ── Verifikasi SESUDAH: jumlah marker harus tetap sama ──
  for (const [name, expected] of Object.entries(target.markers)) {
    const found = (html.match(markerRegex(name)) || []).length;
    if (found !== expected) {
      console.log(`[inject-stats] ${target.file}: verifikasi pasca-replace gagal (LGS:${name}) — BATAL, file tidak ditulis.`);
      return false;
    }
  }

  fs.writeFileSync(fullPath, html, 'utf-8');
  const dipakai = Object.keys(target.markers).map(n => `${n}=${nilai[n]}`).join(' ');
  console.log(`[inject-stats] ${target.file} ✔ ${dipakai}`);
  return true;
}

async function main() {
  // ── 1. Ambil data (kalau gagal → skip semua, jangan gagalkan build) ──
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

  // ── 2. Hitung — pakai lib-stats.js, sumber kebenaran tunggal ──
  const hasil = hitungStatistik(barisS, barisG);
  const nilai = {
    GARMENT: hasil.totalGarment,
    BERJALAN: hasil.totalBerjalan,
    SCAN: hasil.totalScan,
    KOTA: hasil.totalKota,
    NEGARA: hasil.totalNegara,
  };

  // ── 3. Sanity check — angka nol/aneh berarti data bermasalah ──
  for (const [name, v] of Object.entries(nilai)) {
    if (!Number.isInteger(v) || v < 1) {
      console.log(`[inject-stats] Nilai ${name}=${v} tidak masuk akal — SKIP tanpa menyentuh file apapun.`);
      return;
    }
  }

  // ── 4. Tulis ke tiap file, terisolasi ──
  let sukses = 0;
  for (const target of TARGETS) {
    if (prosesFile(target, nilai)) sukses++;
  }

  console.log(`[inject-stats] Selesai: ${sukses}/${TARGETS.length} file diperbarui. Angka terbaru:`);
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
