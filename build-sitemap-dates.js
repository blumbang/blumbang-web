// ============================================================
// build-sitemap-dates.js
// Membuat sitemap-dates.json — tanggal perubahan NYATA tiap halaman statis,
// diambil dari riwayat git (bukan mtime, bukan tanggal hari ini).
//
// KENAPA ADA: sebelumnya generate-posts.js menstempel `lastmod: today`
// ke SEMUA halaman, tiap kali deploy. Google jadi diberi tahu "seluruh situs
// berubah hari ini" setiap hari — dan berhenti mempercayai lastmod kita.
//
// JALAN DI MANA: GitHub Actions saja. Di sana `fetch-depth: 0` sudah dipasang
// di workflow, jadi riwayat git lengkap dijamin ada. TIDAK dijalankan saat
// Cloudflare Pages build — kedalaman clone di sana tidak kita kendalikan.
//
// HASILNYA di-commit, lalu generate-posts.js tinggal membacanya.
//
// Halaman yang SENGAJA tidak ada di sini karena tanggalnya sudah jujur
// dari sumber lain:
//   /                    -> 'today' (inject-stats.js menulis ulang tiap malam)
//   /sparks              -> 'today' (build-sparks.js membangun ulang tiap malam)
//   /sparks/kota/*, /hof -> 'today' (idem)
//   /karya               -> diturunkan dari updated_at seri terbaru
//   /karya/*             -> updated_at masing-masing seri
//   /blog, /blog/*       -> tanggal artikel itu sendiri
// ============================================================

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const OUTPUT = path.join(__dirname, 'sitemap-dates.json');

// Peta URL -> file fisik di repo.
// Kalau menambah landing page baru, tambahkan barisnya di sini
// DAN di daftar staticPages generate-posts.js.
const PETA = {
  '/about':                    'about.html',
  '/ria':                      'ria/index.html',
  '/sablon-klaten':            'sablon-klaten.html',
  '/sablon-trucuk':            'sablon-trucuk.html',
  '/sablon-bayat':             'sablon-bayat.html',
  '/sablon-pedan':             'sablon-pedan.html',
  '/sablon-cawas':             'sablon-cawas.html',
  '/sablon-solo':              'sablon-solo.html',
  '/sablon-jogja':             'sablon-jogja.html',
  '/sablon-banjarbaru':        'sablon-banjarbaru.html',
  '/sablon-brand-klaten':      'sablon-brand-klaten.html',
  '/apa-itu-living-garment':   'apa-itu-living-garment.html',
  '/living-garment-indonesia': 'living-garment-indonesia.html',
  '/kemitraan':                'kemitraan.html',
  '/konveksi-klaten':          'konveksi-klaten.html',
  '/kaos-sekolah-klaten':      'kaos-sekolah-klaten.html',
  '/sablon-satuan-klaten':     'sablon-satuan-klaten.html',
};

const FALLBACK = '2026-07-04';

function tanggalCommitTerakhir(file) {
  try {
    const out = execFileSync(
      'git',
      ['log', '-1', '--format=%cs', '--', file],
      { cwd: __dirname, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }
    ).trim();
    // %cs menghasilkan YYYY-MM-DD. Kosong = file belum pernah di-commit.
    return /^\d{4}-\d{2}-\d{2}$/.test(out) ? out : null;
  } catch (e) {
    return null;
  }
}

function build() {
  // Kalau riwayat git tidak tersedia, JANGAN tulis file berisi tanggal palsu.
  // Lebih baik pertahankan manifest lama daripada menerbitkan tanggal karangan.
  let cek;
  try {
    cek = execFileSync('git', ['rev-parse', '--is-inside-work-tree'],
      { cwd: __dirname, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch (e) {
    cek = '';
  }
  if (cek !== 'true') {
    console.log('⛔ Bukan repo git / riwayat tidak tersedia — sitemap-dates.json TIDAK ditulis.');
    return;
  }

  const hasil = {};
  let dariGit = 0, dariFallback = 0, hilang = 0;

  for (const [url, file] of Object.entries(PETA)) {
    const adaFile = fs.existsSync(path.join(__dirname, file));
    if (!adaFile) {
      console.log(`   ⚠️  ${file} tidak ada di repo — ${url} dilewati`);
      hilang++;
      continue;
    }
    const tgl = tanggalCommitTerakhir(file);
    if (tgl) {
      hasil[url] = tgl;
      dariGit++;
    } else {
      hasil[url] = FALLBACK;
      dariFallback++;
      console.log(`   ⚠️  ${file} tidak punya riwayat commit — pakai fallback ${FALLBACK}`);
    }
  }

  if (Object.keys(hasil).length === 0) {
    console.log('⛔ Tidak ada satu pun halaman terpetakan — file TIDAK ditulis.');
    return;
  }

  // Urutkan key supaya diff-nya stabil dan tidak menghasilkan commit palsu.
  const terurut = {};
  Object.keys(hasil).sort().forEach(k => { terurut[k] = hasil[k]; });

  fs.writeFileSync(OUTPUT, JSON.stringify(terurut, null, 2) + '\n');
  console.log(`✅ sitemap-dates.json ditulis — ${dariGit} dari git, ${dariFallback} fallback, ${hilang} dilewati`);
}

build();
