// build-sparks.js
// Generate sparks/kota/[kota].html dan sparks/index.html
// PENTING: Tidak menyentuh sparks.html sama sekali

const fs = require('fs');
const path = require('path');

const SHEET_ID = '1J9SVJGQb7msPTEOpUgsJ2TWWvQ4TntIjrkHZ9nbKgbw';
const BASE_URL = 'https://blumbang.id';
const KLATEN = [110.6, -7.7];

// Pastikan folder ada
const SPARKS_DIR = path.join(__dirname, 'sparks');
const KOTA_DIR = path.join(SPARKS_DIR, 'kota');
if (!fs.existsSync(SPARKS_DIR)) fs.mkdirSync(SPARKS_DIR, { recursive: true });
if (!fs.existsSync(KOTA_DIR)) fs.mkdirSync(KOTA_DIR, { recursive: true });

function slugify(str) {
  return str.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function formatTanggal(str) {
  if (!str) return '';
  try {
    // Format: "10/3/2026, 12.10.58" → parse manual
    const bagian = str.split(',')[0].trim(); // "10/3/2026"
    const parts = bagian.split('/');
    if (parts.length === 3) {
      const d = new Date(parts[2], parts[1]-1, parts[0]);
      return d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    }
    return str;
  } catch(e) { return str; }
}

async function fetchSheet(sheetName) {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${sheetName}`;
  const res = await fetch(url);
  const text = await res.text();
  const match = text.match(/setResponse\((.*)\)/s);
  if (!match) return [];
  const data = JSON.parse(match[1]);
  return data.table.rows || [];
}

function getVal(cell) {
  return cell && cell.v ? cell.v.toString().trim() : '';
}

function navHTML(activePage = '') {
  return `<nav>
  <a href="/" class="nav-brand">BLUMB✦NG</a>
  <div class="nav-links">
    <a href="/karya"${activePage === 'karya' ? ' class="active"' : ''}>Karya</a>
    <a href="/sparks"${activePage === 'sparks' ? ' class="active"' : ''}>Perjalanan</a>
    <a href="/about"${activePage === 'about' ? ' class="active"' : ''}>Tentang</a>
  </div>
  <a href="https://wa.me/6281234561146" class="nav-order">✦ ORDER</a>
  <button class="nav-hamburger" onclick="document.getElementById('nav-mob').classList.toggle('open');this.textContent=document.getElementById('nav-mob').classList.contains('open')?'✕':'☰'" id="nav-ham">☰</button>
</nav>
<div class="nav-mobile" id="nav-mob">
  <a href="/karya">Karya</a>
  <a href="/sparks">Perjalanan</a>
  <a href="/about">Tentang</a>
  <a href="https://wa.me/6281234561146" class="mobile-order">✦ ORDER SEKARANG</a>
</div>`;
}

function baseCSS() {
  return `<style>
:root{--black:#080808;--charcoal:#141414;--grey:#1e1e1e;--border:#2a2a2a;--muted:#666;--dim:#888;--light:#ccc;--white:#F5F0E8;--gold:#C9A84C;--gold-dim:#7a6028;--font-logo:'Bebas Neue',sans-serif;--font-body:'Montserrat',sans-serif;--font-ui:'Inter',sans-serif;}
*,*::before,*::after{margin:0;padding:0;box-sizing:border-box;}
body{background:var(--black);color:var(--white);font-family:var(--font-body);min-height:100vh;}
a{text-decoration:none;color:inherit;}
nav{position:fixed;top:0;left:0;right:0;z-index:100;display:flex;align-items:center;justify-content:space-between;padding:18px 40px;background:rgba(8,8,8,0.98);border-bottom:1px solid var(--border);}
.nav-brand{font-family:var(--font-logo);font-size:1.6rem;letter-spacing:0.15em;color:var(--gold);}
.nav-links{display:flex;gap:32px;}
.nav-links a{font-family:var(--font-ui);font-size:0.75rem;font-weight:500;letter-spacing:0.12em;color:var(--light);transition:color 0.2s;text-transform:uppercase;}
.nav-links a:hover,.nav-links a.active{color:var(--gold);}
.nav-order{font-family:var(--font-ui);font-size:0.72rem;font-weight:700;letter-spacing:0.2em;color:var(--black);background:var(--gold);padding:9px 20px;text-transform:uppercase;}
.nav-order:hover{background:var(--white);}
.nav-hamburger{display:none;background:none;border:none;color:var(--gold);font-size:1.4rem;cursor:pointer;}
.nav-mobile{display:none;position:fixed;top:64px;left:0;right:0;background:var(--charcoal);border-bottom:1px solid var(--border);z-index:99;flex-direction:column;padding:20px;}
.nav-mobile.open{display:flex;}
.nav-mobile a{font-family:var(--font-ui);font-size:0.85rem;font-weight:500;letter-spacing:0.12em;color:var(--light);padding:12px 0;border-bottom:1px solid var(--border);text-transform:uppercase;}
.nav-mobile a:last-child{border-bottom:none;}
.mobile-order{color:var(--gold)!important;font-weight:700!important;}
footer{border-top:1px solid var(--border);padding:28px 40px;display:flex;align-items:center;justify-content:space-between;margin-top:60px;}
.footer-brand{font-family:var(--font-logo);font-size:1.2rem;letter-spacing:0.15em;color:var(--gold-dim);}
.footer-link{font-family:var(--font-ui);font-size:0.68rem;color:var(--muted);letter-spacing:0.1em;}
.footer-link:hover{color:var(--gold);}
@media(max-width:768px){nav{padding:14px 18px;}.nav-links,.nav-order{display:none;}.nav-hamburger{display:block;}footer{padding:20px 18px;flex-direction:column;gap:12px;}}
</style>`;
}

function generateKotaHTML(kota, slug, scans, garmentMap) {
  // Scan pertama di kota ini
  const pertama = scans[0];
  const pertamaId = pertama ? getVal(pertama.c[0]) : '';
  const pertamaTanggal = pertama ? formatTanggal(getVal(pertama.c[6])) : '';
  const pertamaNama = pertamaId && garmentMap[pertamaId] ? garmentMap[pertamaId] : pertamaId;

  // Hitung kaos unik
  const kaosUnik = [...new Set(scans.map(r => getVal(r.c[0])).filter(Boolean))];

  // List scan terbaru
  const scanList = scans.slice(-20).reverse().map(r => {
    const id = getVal(r.c[0]);
    const ts = getVal(r.c[6]);
    const nama = garmentMap[id] || id;
    return `<a href="/id/${encodeURIComponent(id)}" class="scan-item">
      <div class="scan-id">${id}</div>
      <div class="scan-nama">${nama}</div>
      <div class="scan-ts">${ts.split(',')[0]}</div>
    </a>`;
  }).join('');

  const canonical = `${BASE_URL}/sparks/kota/${slug}`;
  const metaDesc = `Kaos Blumbang yang pernah sampai ke ${kota}. ${kaosUnik.length} kaos, ${scans.length} scan tercatat.`;

  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${kota} · Peta Perjalanan Blumbang</title>
<meta name="description" content="${metaDesc}">
<meta property="og:title" content="${kota} · Peta Perjalanan Blumbang">
<meta property="og:description" content="${metaDesc}">
<meta property="og:type" content="website">
<link rel="canonical" href="${canonical}">
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Montserrat:wght@300;400;600&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
${baseCSS()}
<style>
.hero{padding:100px 40px 48px;border-bottom:1px solid var(--border);}
.hero-inner{max-width:900px;margin:0 auto;}
.hero-eyebrow{font-family:var(--font-ui);font-size:.6rem;font-weight:700;letter-spacing:.4em;color:var(--gold);text-transform:uppercase;margin-bottom:12px;}
.hero-kota{font-family:var(--font-logo);font-size:clamp(3rem,10vw,7rem);letter-spacing:.06em;line-height:.95;color:var(--white);margin-bottom:24px;}
.tanda-tangan{background:var(--charcoal);border:1px solid var(--border);border-left:3px solid var(--gold);padding:20px 24px;margin-bottom:32px;}
.tt-label{font-family:var(--font-ui);font-size:.6rem;font-weight:700;letter-spacing:.3em;color:var(--gold);text-transform:uppercase;margin-bottom:8px;}
.tt-teks{font-family:var(--font-ui);font-size:.85rem;color:var(--light);line-height:1.6;}
.tt-teks strong{color:var(--white);}
.stats-row{display:flex;gap:32px;flex-wrap:wrap;}
.stat-box{text-align:center;}
.stat-num{font-family:var(--font-logo);font-size:2rem;letter-spacing:.1em;color:var(--gold);}
.stat-lbl{font-family:var(--font-ui);font-size:.6rem;letter-spacing:.2em;color:var(--muted);text-transform:uppercase;}
.section{max-width:900px;margin:0 auto;padding:48px 40px;}
.section-title{font-family:var(--font-logo);font-size:1.2rem;letter-spacing:.15em;color:var(--white);margin-bottom:24px;padding-bottom:12px;border-bottom:1px solid var(--border);}
.scan-item{display:grid;grid-template-columns:1fr 2fr auto;gap:12px;align-items:center;padding:14px 0;border-bottom:1px solid var(--border);color:inherit;}
.scan-item:hover{background:var(--charcoal);padding-left:8px;margin:0 -8px;}
.scan-id{font-family:var(--font-logo);font-size:.9rem;letter-spacing:.1em;color:var(--gold);}
.scan-nama{font-family:var(--font-ui);font-size:.75rem;color:var(--light);}
.scan-ts{font-family:var(--font-ui);font-size:.65rem;color:var(--muted);}
.back-link{display:inline-flex;align-items:center;gap:8px;font-family:var(--font-ui);font-size:.65rem;font-weight:600;letter-spacing:.15em;text-transform:uppercase;color:var(--dim);margin-bottom:32px;transition:color .2s;}
.back-link:hover{color:var(--gold);}
@media(max-width:768px){.hero{padding:80px 20px 32px;}.section{padding:32px 20px;}.stats-row{gap:20px;}}
</style>
</head>
<body>
${navHTML('sparks')}
<div class="hero">
  <div class="hero-inner">
    <a href="/sparks" class="back-link">← Peta Perjalanan</a>
    <div class="hero-eyebrow">✦ Peta Perjalanan · Blumbang ID</div>
    <div class="hero-kota">${kota}</div>
    ${pertamaId ? `<div class="tanda-tangan">
      <div class="tt-label">Tanda Tangan Kota</div>
      <div class="tt-teks">Pertama dibawa ke sini oleh <strong><a href="/id/${encodeURIComponent(pertamaId)}" style="color:var(--gold)">${pertamaId}</a></strong> · ${pertamaTanggal}</div>
    </div>` : ''}
    <div class="stats-row">
      <div class="stat-box"><div class="stat-num">${kaosUnik.length}</div><div class="stat-lbl">Kaos Unik</div></div>
      <div class="stat-box"><div class="stat-num">${scans.length}</div><div class="stat-lbl">Total Scan</div></div>
    </div>
  </div>
</div>
<div class="section">
  <div class="section-title">KAOS YANG PERNAH SAMPAI KE SINI</div>
  ${scanList || '<div style="color:var(--muted);font-size:.8rem;">Belum ada data</div>'}
</div>
<footer>
  <a href="/" class="footer-brand">BLUMB✦NG</a>
  <a href="https://wa.me/6281234561146" class="footer-link">Order via WhatsApp →</a>
</footer>
</body>
</html>`;
}

function generateIndexHTML(kotaList) {
  const cards = kotaList.map(k => `<a href="/sparks/kota/${k.slug}" class="kota-card">
    <div class="kota-nama">${k.nama}</div>
    <div class="kota-info">${k.scanCount} scan · ${k.kaosUnik} kaos</div>
    <div class="kota-first">Pertama: ${k.pertamaTanggal}</div>
  </a>`).join('');

  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Semua Kota · Peta Perjalanan Blumbang</title>
<meta name="description" content="Semua kota yang pernah dikunjungi kaos Blumbang. ${kotaList.length} kota di seluruh dunia.">
<link rel="canonical" href="${BASE_URL}/sparks/kota">
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Montserrat:wght@300;400;600&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
${baseCSS()}
<style>
.hero{padding:100px 40px 48px;border-bottom:1px solid var(--border);}
.hero-inner{max-width:1100px;margin:0 auto;}
.hero-eyebrow{font-family:var(--font-ui);font-size:.6rem;font-weight:700;letter-spacing:.4em;color:var(--gold);text-transform:uppercase;margin-bottom:12px;}
.hero-title{font-family:var(--font-logo);font-size:clamp(2.5rem,7vw,5rem);letter-spacing:.06em;line-height:.95;color:var(--white);}
.grid{max-width:1100px;margin:0 auto;padding:40px;display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:1px;background:var(--border);}
.kota-card{display:block;background:var(--black);padding:24px;transition:background .2s;}
.kota-card:hover{background:var(--charcoal);}
.kota-nama{font-family:var(--font-logo);font-size:1.4rem;letter-spacing:.08em;color:var(--white);margin-bottom:8px;}
.kota-info{font-family:var(--font-ui);font-size:.7rem;color:var(--gold);margin-bottom:4px;}
.kota-first{font-family:var(--font-ui);font-size:.65rem;color:var(--muted);}
@media(max-width:768px){.hero{padding:80px 20px 32px;}.grid{padding:0;grid-template-columns:1fr 1fr;}}
</style>
</head>
<body>
${navHTML('sparks')}
<div class="hero">
  <div class="hero-inner">
    <a href="/sparks" style="font-family:var(--font-ui);font-size:.65rem;font-weight:600;letter-spacing:.15em;text-transform:uppercase;color:var(--dim);display:inline-block;margin-bottom:20px;">← Peta Perjalanan</a>
    <div class="hero-eyebrow">✦ ${kotaList.length} Kota · Blumbang ID</div>
    <div class="hero-title">SEMUA KOTA</div>
  </div>
</div>
<div class="grid">${cards}</div>
<footer>
  <a href="/" class="footer-brand">BLUMB✦NG</a>
  <a href="https://wa.me/6281234561146" class="footer-link">Order via WhatsApp →</a>
</footer>
</body>
</html>`;
}

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2-lat1)*Math.PI/180;
  const dLng = (lng2-lng1)*Math.PI/180;
  const a = Math.sin(dLat/2)*Math.sin(dLat/2)+Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)*Math.sin(dLng/2);
  return Math.round(R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a)));
}

function generateHOF(scanRows, garmentMap) {
  const KLATEN_LAT = -7.749626;
  const KLATEN_LNG = 110.670888;

  const CITY_COORDS = {
    'yogyakarta':[-7.803,110.364],'jakarta':[-6.208,106.845],'bandung':[-6.917,107.609],
    'surabaya':[-7.258,112.752],'semarang':[-6.966,110.423],'solo':[-7.574,110.827],
    'surakarta':[-7.574,110.827],'denpasar':[-8.67,115.212],'medan':[3.595,98.679],
    'pontianak':[-0.02,109.333],'samarinda':[-0.502,117.136],'balikpapan':[-1.268,116.854],
    'banjarmasin':[-3.317,114.592],'banjarbaru':[-3.442,114.831],'makassar':[-5.147,119.432],
    'tokyo':[35.69,139.69],'osaka':[34.694,135.502],'seychelles':[-4.679,55.492],
    'ile au cerf':[-4.683,55.533],'victoria':[-4.62,55.455],'singapore':[1.352,103.82],
    'kediri':[-7.816,112.018],'boyolali':[-7.534,110.593],'sleman':[-7.717,110.354],
    'wonosobo':[-7.361,109.9],'banyumas':[-7.513,109.215],'sukoharjo':[-7.686,110.838],
    'kijang':[0.917,104.633],'bulakamba':[-6.867,108.988],'trucuk':[-7.713,110.617],
  };

  function getCityCoord(cityStr) {
    if(!cityStr) return null;
    const lower = cityStr.toLowerCase();
    const keys = Object.keys(CITY_COORDS).sort((a,b)=>b.length-a.length);
    for(const key of keys) if(lower.includes(key)) return CITY_COORDS[key];
    return null;
  }

  // Hitung jarak dan kota unik per garment
  const garmentStats = {};
  scanRows.forEach(r => {
    const id = getVal(r.c[0]);
    const city = getVal(r.c[2]);
    if(!id || !city) return;
    if(!garmentStats[id]) garmentStats[id] = { id, kotaSet: new Set(), maxJarak: 0 };
    const kotaNama = city.split(',')[0].trim();
    garmentStats[id].kotaSet.add(kotaNama);
    const coord = getCityCoord(city);
    if(coord) {
      const jarak = haversine(KLATEN_LAT, KLATEN_LNG, coord[0], coord[1]);
      if(jarak > garmentStats[id].maxJarak) garmentStats[id].maxJarak = jarak;
    }
  });

  const semua = Object.values(garmentStats).map(g => ({
    id: g.id,
    nomor: g.id.split('-').pop(),
    nama: garmentMap[g.id] || g.id,
    jarak: g.maxJarak,
    kotaUnik: g.kotaSet.size
  }));

  const terjauh = semua.filter(g=>g.jarak>0).sort((a,b)=>b.jarak-a.jarak).slice(0,5);
  const terbanyak = semua.filter(g=>g.kotaUnik>0).sort((a,b)=>b.kotaUnik-a.kotaUnik).slice(0,5);

  const hofData = JSON.stringify({ terjauh, terbanyak });
  const html = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body>
<script id="hof-data" type="application/json">${hofData}</script>
</body>
</html>`;

  fs.writeFileSync(path.join(SPARKS_DIR, 'hof.html'), html);
  console.log('✅ sparks/hof.html — ' + terjauh.length + ' terjauh, ' + terbanyak.length + ' terbanyak kota');
}

async function main() {
  console.log('Fetching data dari Sheet...');
  const [spkRows, garRows] = await Promise.all([
    fetchSheet('SPARKS'),
    fetchSheet('GARMENTS')
  ]);

  const scanRows = spkRows.filter(r => r.c && r.c[0] && getVal(r.c[0]) && getVal(r.c[0]) !== 'GARMENT_ID');
  const garRows2 = garRows.filter(r => r.c && r.c[0] && getVal(r.c[0]));

  console.log(`Data: ${scanRows.length} scan, ${garRows2.length} garment`);

  // Build garment map: id → nama seri
  const garmentMap = {};
  garRows2.forEach(r => {
    const id = getVal(r.c[0]);
    const nama = getVal(r.c[1]);
    if (id) garmentMap[id] = nama;
  });

  // Group scan per kota
  const kotaMap = {};
  scanRows.forEach(r => {
    const city = getVal(r.c[2]);
    if (!city) return;
    const kotaNama = city.split(',')[0].trim();
    const kotaSlug = slugify(kotaNama);
    if (!kotaMap[kotaSlug]) kotaMap[kotaSlug] = { nama: kotaNama, slug: kotaSlug, scans: [] };
    kotaMap[kotaSlug].scans.push(r);
  });

  // Generate halaman per kota
  const kotaList = [];
  for (const [slug, data] of Object.entries(kotaMap)) {
    if (slug === 'klaten') continue; // Skip Klaten — origin
    const html = generateKotaHTML(data.nama, slug, data.scans, garmentMap);
    const outPath = path.join(KOTA_DIR, slug + '.html');
    fs.writeFileSync(outPath, html);

    const pertama = data.scans[0];
    const pertamaTanggal = pertama ? formatTanggal(getVal(pertama.c[6])) : '';
    const kaosUnik = new Set(data.scans.map(r => getVal(r.c[0])).filter(Boolean)).size;

    kotaList.push({ nama: data.nama, slug, scanCount: data.scans.length, kaosUnik, pertamaTanggal });
    console.log(`  ✦ sparks/kota/${slug}.html (${data.scans.length} scan)`);
  }

  // Sort by scan count
  kotaList.sort((a, b) => b.scanCount - a.scanCount);

  // Generate index
  const indexHtml = generateIndexHTML(kotaList);
  fs.writeFileSync(path.join(SPARKS_DIR, 'index.html'), indexHtml);
  console.log(`✅ sparks/index.html — ${kotaList.length} kota`);
  console.log(`✅ ${kotaList.length} halaman kota di-generate`);

  // Generate Hall of Fame
  generateHOF(scanRows, garmentMap);
}

main().catch(console.error);
