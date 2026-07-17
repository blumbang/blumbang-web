// ============================================================
// LIB-STATS.JS
// Sumber kebenaran TUNGGAL untuk menghitung statistik Living Garment.
// Dipakai bersama oleh build-sparks.js DAN inject-stats.js supaya
// angka yang tampil di /sparks dan homepage DIJAMIN identik secara
// struktural — bukan sekadar "dijaga manual lewat komentar".
//
// PRINSIP:
// - Rumus di sini adalah satu-satunya definisi resmi. Jangan duplikat
//   logic hitung di tempat lain; import dari sini.
// - Aman dipanggil dengan data mentah gviz (rows dari Sheet).
// ============================================================

// Ambil nilai sel gviz dengan aman (kompatibel dengan format Sheet).
function getCellVal(cell) {
  return cell && cell.v != null ? cell.v.toString().trim() : '';
}

// Hitung seluruh statistik ringkas dari baris SPARKS dan GARMENTS.
//
// @param {Array} barisS - rows mentah dari Sheet SPARKS (r.c[i].v)
// @param {Array} barisG - rows mentah dari Sheet GARMENTS
// @returns {Object} {
//   totalGarment,        // jumlah kaos terdaftar (baris GARMENTS berisi id)
//   totalBerjalan,       // jumlah garment unik yang pernah dipindai (punya scan)
//   totalScan,           // jumlah baris scan (perjalanan tersimpan)
//   totalKota,           // jumlah kota unik (Klaten selalu dihitung sebagai origin)
//   totalNegara,         // jumlah negara unik (Indonesia selalu dihitung)
//   kotaSet,             // Set nama kota (untuk keperluan lain bila perlu)
//   negaraSet            // Set nama negara
// }
function hitungStatistik(barisS, barisG) {
  // ── Kaos terdaftar: baris GARMENTS yang punya id di kolom 0 ──
  const totalGarment = (barisG || []).filter(r => getCellVal(r.c[0])).length;

  // ── Kota, negara, scan, garment berjalan: dari baris SPARKS ──
  const kotaSet = new Set(['Klaten']);        // Klaten = origin, selalu anggota
  const negaraSet = new Set(['Indonesia']);   // Indonesia selalu anggota
  const garmentJalan = new Set();
  let totalScan = 0;

  (barisS || []).forEach(r => {
    const id = getCellVal(r.c[0]);
    const city = getCellVal(r.c[2]);
    if (id) garmentJalan.add(id);
    if (city) {
      totalScan++;
      // Nama kota = bagian sebelum koma pertama (mis. "Surakarta, Indonesia" -> "Surakarta")
      kotaSet.add(city.split(',')[0].trim());
      // Negara = bagian setelah koma terakhir, bila ada
      if (city.includes(',')) {
        negaraSet.add(city.split(',').pop().trim());
      }
    }
  });

  return {
    totalGarment,
    totalBerjalan: garmentJalan.size,
    totalScan,
    totalKota: kotaSet.size,
    totalNegara: negaraSet.size,
    kotaSet,
    negaraSet,
  };
}

module.exports = { hitungStatistik, getCellVal };
