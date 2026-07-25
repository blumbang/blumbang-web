// ============================================================
// LIB-STATS.JS
// PEMILIK TUNGGAL rumus Living Garment.
//
// Semua yang menghitung angka atau mengelompokkan kota WAJIB
// mengambilnya dari sini. Jangan menyalin ulang logikanya ke file lain
// — itu yang dulu membuat homepage dan /sparks menampilkan angka berbeda
// padahal sumbernya sama-sama Sheet.
//
// KONSUMEN (per 25 Juli 2026):
//   - inject-stats.js  → angka di index.html (homepage)
//   - build-sparks.js  → halaman kota, /sparks/kota, /sparks/hof
//
// CATATAN PERILAKU getCellVal:
// Memakai cek truthy (cell.v), BUKAN (cell.v != null). Ini mengikuti
// build-sparks.js yang sudah berjalan di produksi, supaya penyatuan ini
// tidak mengubah isi 39 halaman kota yang sudah ada.
// Konsekuensinya sel bernilai angka 0 atau boolean false dibaca sebagai
// string kosong. Untuk kolom yang dipakai (ID, nama, kota) selalu teks,
// jadi tidak berdampak.
// ============================================================

// Ambil nilai sel gviz dengan aman.
// Perilaku disamakan dengan build-sparks.js (cek truthy).
function getCellVal(cell) {
  return cell && cell.v ? cell.v.toString().trim() : '';
}

// Ubah nama kota jadi slug URL.
function slugify(str) {
  return str.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

// Baris SPARKS yang sah: punya ID, dan bukan baris header.
function filterScanRows(barisS) {
  return (barisS || []).filter(r =>
    r.c && r.c[0] && getCellVal(r.c[0]) && getCellVal(r.c[0]) !== 'GARMENT_ID'
  );
}

// Baris GARMENTS yang sah: punya ID di kolom 0.
// Sengaja TIDAK memfilter baris header, mengikuti perilaku build-sparks.js
// yang sudah berjalan. Kalau suatu saat mau difilter, ubah di sini saja
// dan semua konsumen ikut berubah bersamaan.
function filterGarmentRows(barisG) {
  return (barisG || []).filter(r => r.c && r.c[0] && getCellVal(r.c[0]));
}

// Kelompokkan baris scan per kota, memakai slug sebagai kunci
// supaya "Yogyakarta", "yogyakarta", dan "Yogyakarta " jadi satu.
// Mengembalikan objek: { slug: { nama, slug, scans: [] } }
// Klaten TIDAK dibuang di sini — pembuangannya urusan pemanggil,
// karena build-sparks perlu tahu Klaten ada untuk keperluan lain.
function groupKota(scanRows) {
  const kotaMap = {};
  (scanRows || []).forEach(r => {
    const city = getCellVal(r.c[2]);
    if (!city) return;
    const kotaNama = city.split(',')[0].trim();
    const kotaSlug = slugify(kotaNama);
    if (!kotaSlug) return;
    if (!kotaMap[kotaSlug]) kotaMap[kotaSlug] = { nama: kotaNama, slug: kotaSlug, scans: [] };
    kotaMap[kotaSlug].scans.push(r);
  });
  return kotaMap;
}

// Daftar slug kota TANPA Klaten (Klaten = origin, dihitung terpisah).
function slugKotaTanpaKlaten(kotaMap) {
  return Object.keys(kotaMap).filter(slug => slug !== 'klaten');
}

// Hitung seluruh statistik ringkas dari baris SPARKS dan GARMENTS.
//
// Dibangun di atas fungsi-fungsi di atas, jadi dijamin memakai definisi
// yang sama persis dengan yang dipakai build-sparks.js untuk membuat
// halaman kota.
//
// @param {Array} barisS - rows mentah dari Sheet SPARKS
// @param {Array} barisG - rows mentah dari Sheet GARMENTS
// @returns {Object} {
//   totalGarment,   // kaos terdaftar
//   totalBerjalan,  // garment unik yang pernah dipindai
//   totalScan,      // baris scan sah (perjalanan tersimpan)
//   totalKota,      // kota unik termasuk Klaten sebagai origin
//   totalNegara,    // negara unik (Indonesia selalu dihitung)
//   kotaSet,        // Set slug kota, TANPA klaten
//   negaraSet       // Set nama negara
// }
function hitungStatistik(barisS, barisG) {
  const scanRows = filterScanRows(barisS);
  const garmentRows = filterGarmentRows(barisG);
  const kotaMap = groupKota(scanRows);
  const slugKota = slugKotaTanpaKlaten(kotaMap);

  const negaraSet = new Set(['Indonesia']);
  const garmentJalan = new Set();

  scanRows.forEach(r => {
    const id = getCellVal(r.c[0]);
    if (id) garmentJalan.add(id);
    const city = getCellVal(r.c[2]);
    if (city && city.includes(',')) {
      negaraSet.add(city.split(',').pop().trim());
    }
  });

  return {
    totalGarment: garmentRows.length,
    totalBerjalan: garmentJalan.size,
    totalScan: scanRows.length,
    totalKota: slugKota.length + 1,   // +1 untuk Klaten sebagai origin
    totalNegara: negaraSet.size,
    kotaSet: new Set(slugKota),
    negaraSet,
  };
}

module.exports = {
  getCellVal,
  slugify,
  filterScanRows,
  filterGarmentRows,
  groupKota,
  slugKotaTanpaKlaten,
  hitungStatistik,
};
