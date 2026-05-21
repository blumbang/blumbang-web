#!/usr/bin/env node
// build-sparks.js — SSG generator untuk sparks.blumbang.id
// Jalankan: node build-sparks.js
// Output: folder sparks/ berisi index.html + kota/[nama].html

const https = require('https');
const fs = require('fs');
const path = require('path');

const SHEET_ID = '1J9SVJGQb7msPTEOpUgsJ2TWWvQ4TntIjrkHZ9nbKgbw';
const KLATEN = { lat: -7.749626, lng: 110.670888 };

// ── Helpers ──────────────────────────────────────────────────────────────────

function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve(d));
    }).on('error', reject);
  });
}

function slugify(str) {
  return str.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 +
    Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
}

function parseSheet(txt) {
  const m = txt.match(/google\.visualization\.Query\.setResponse\(([\s\S]*)\)/);
  if (!m) return [];
  return JSON.parse(m[1]).table.rows || [];
}

function val(cell) {
  return cell && cell.v != null ? cell.v.toString().trim() : '';
}

function bulanTahun(tsStr) {
  if (!tsStr) return '';
  try {
    const parts = tsStr.split(',')[0].trim().split('/');
    if (parts.length === 3) {
      const d = new Date(parseInt(parts[2]), parseInt(parts[1])-1, parseInt(parts[0]));
      return d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    }
  } catch(e) {}
  return tsStr;
}

// ── HTML Templates ────────────────────────────────────────────────────────────

const NAV = `
<nav>
  <a href="/" class="nav-brand">BLUMB<span class="spark-spin">✦</span>NG<span style="font-size:0.55rem;letter-spacing:0.3em;vertical-align:super;color:var(--gold-dim)"> ID</span></a>
  <div class="nav-links">
    <a href="/karya">Karya</a>
    <a href="/sparks" class="active">Perjalanan</a>
    <a href="/about">Tentang</a>
  </div>
  <a href="https://wa.me/6281234561146" class="nav-order">✦ ORDER</a>
  <button class="nav-hamburger" onclick="toggleMenu()" id="hamburger">☰</button>
</nav>
<div class="nav-mobile" id="nav-mobile">
  <a href="/karya" onclick="toggleMenu()">Karya</a>
  <a href="/sparks" onclick="toggleMenu()">Perjalanan</a>
  <a href="/about" onclick="toggleMenu()">Tentang</a>
  <a href="https://wa.me/6281234561146" class="mobile-order" onclick="toggleMenu()">✦ ORDER SEKARANG</a>
</div>`;

const BASE_CSS = `
<style>
:root{
  --black:#080808;--charcoal:#141414;--grey:#1e1e1e;--border:#2a2a2a;
  --muted:#666;--dim:#888;--light:#ccc;--white:#F5F0E8;
  --gold:#C9A84C;--gold-dim:#7a6028;--gold-bg:#140f02;
  --font-logo:'Bebas Neue',sans-serif;
  --font-body:'Montserrat',sans-serif;
  --font-ui:'Inter',sans-serif;
}
*,*::before,*::after{margin:0;padding:0;box-sizing:border-box;}
html{scroll-behavior:smooth;}
body{background:var(--black);color:var(--white);font-family:var(--font-body);min-height:100vh;overflow-x:hidden;}
body::after{content:'';position:fixed;inset:0;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.025'/%3E%3C/svg%3E");pointer-events:none;z-index:9999;}
nav{position:fixed;top:0;left:0;right:0;z-index:100;display:flex;align-items:center;justify-content:space-between;padding:18px 40px;background:rgba(8,8,8,0.95);border-bottom:1px solid var(--border);}
.nav-brand{font-family:var(--font-logo);font-size:1.6rem;letter-spacing:0.15em;color:var(--gold);text-decoration:none;line-height:1;}
.spark-spin{display:inline-block;animation:spin 6s linear infinite;font-size:1rem;vertical-align:middle;}
.nav-links{display:flex;gap:32px;}
.nav-links a{font-family:var(--font-ui);font-size:0.75rem;font-weight:500;letter-spacing:0.12em;color:var(--light);text-decoration:none;transition:color 0.2s;text-transform:uppercase;}
.nav-links a:hover,.nav-links a.active{color:var(--gold);}
.nav-order{font-family:var(--font-ui);font-size:0.72rem;font-weight:700;letter-spacing:0.2em;color:var(--black);background:var(--gold);padding:9px 20px;text-decoration:none;transition:all 0.2s;text-transform:uppercase;}
.nav-order:hover{background:var(--white);}
.nav-hamburger{display:none;background:none;border:none;color:var(--gold);font-size:1.4rem;cursor:pointer;}
.nav-mobile{display:none;position:fixed;top:61px;left:0;right:0;background:var(--charcoal);border-bottom:1px solid var(--border);z-index:99;flex-direction:column;padding:20px;}
.nav-mobile.open{display:flex;}
.nav-mobile a{font-family:var(--font-ui);font-size:0.85rem;font-weight:500;letter-spacing:0.12em;color:var(--light);text-decoration:none;padding:12px 0;border-bottom:1px solid var(--border);text-transform:uppercase;}
.nav-mobile a:last-child{border-bottom:none;}
.mobile-order{color:var(--gold)!important;font-weight:700!important;}
footer{padding:36px 40px;border-top:1px solid var(--border);}
.footer-inner{max-width:1100px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px;}
.footer-brand{font-family:var(--font-logo);font-size:1.3rem;letter-spacing:0.15em;color:var(--gold);}
.footer-links{display:flex;gap:28px;}
.footer-links a{font-family:var(--font-ui);font-size:0.72rem;font-weight:500;letter-spacing:0.15em;color:var(--light);text-decoration:none;transition:color 0.2s;text-transform:uppercase;}
.footer-links a:hover{color:var(--gold);}
.footer-copy{font-family:var(--font-ui);font-size:0.68rem;letter-spacing:0.1em;color:var(--muted);}
@keyframes spin{0%,100%{transform:rotate(0deg)scale(1);}50%{transform:rotate(180deg)scale(0.8);}}
@keyframes denyut{0%,100%{opacity:1;}50%{opacity:0.3;}}
@media(max-width:768px){
  nav{padding:14px 18px;}
  .nav-links,.nav-order{display:none;}
  .nav-hamburger{display:block;}
  footer{padding:24px 20px;}
  .footer-inner{flex-direction:column;text-align:center;}
  .footer-links{justify-content:center;}
}
</style>`;

const BASE_JS = `
<script>
function toggleMenu(){
  const m=document.getElementById('nav-mobile');
  const h=document.getElementById('hamburger');
  m.classList.toggle('open');
  h.textContent=m.classList.contains('open')?'✕':'☰';
}
</script>`;

const FOOTER = `
<footer>
  <div class="footer-inner">
    <div class="footer-brand">BLUMB<span style="font-size:0.8rem;">✦</span>NG</div>
    <div class="footer-links">
      <a href="/karya">Karya</a>
      <a href="/sparks">Perjalanan</a>
      <a href="/about">Tentang</a>
      <a href="https://wa.me/6281234561146">WhatsApp</a>
    </div>
    <div class="footer-copy">© 2026 Blumbang · Jeto, Klaten, Jawa Tengah</div>
  </div>
</footer>`;

const GA = `
<script async src="https://www.googletagmanager.com/gtag/js?id=G-39SRRM5GKK"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag("js",new Date());gtag("config","G-39SRRM5GKK");</script>`;

// ── Generate index.html ───────────────────────────────────────────────────────

function generateIndex(stats, kotaList, scanTerbaru) {
  const kotaTags = kotaList.map(k =>
    `<a href="/sparks/kota/${k.slug}" class="city-tag"><span class="dot"></span>${k.label}</a>`
  ).join('\n    ');

  const latestHtml = scanTerbaru
    ? `<div class="latest-section"><div class="latest-dot"></div><div class="latest-text">Terbaru dari <span class="latest-city">${scanTerbaru}</span></div></div>`
    : '';

  const kotaJsonLd = kotaList.map((k, i) => ({
    '@type': 'ListItem',
    position: i + 2,
    name: k.label,
    item: `https://sparks.blumbang.id/kota/${k.slug}`
  }));

  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Peta Perjalanan Kaos · Blumbang ID — ${stats.kota} Kota, ${stats.negara} Negara</title>
<meta name="description" content="${stats.garment} kaos Blumbang sudah menjelajah ${stats.kota} kota di ${stats.negara} negara. Dari Klaten ke seluruh dunia — setiap perjalanan tercatat.">
<link rel="canonical" href="https://sparks.blumbang.id/">
<meta property="og:title" content="Peta Perjalanan Kaos · Blumbang ID">
<meta property="og:description" content="${stats.garment} kaos. ${stats.kota} kota. ${stats.negara} negara. Setiap titik adalah orang yang pernah pakai kaos Blumbang.">
<meta property="og:image" content="https://blumbang.id/og-image.webp">
<meta property="og:url" content="https://sparks.blumbang.id/">
<meta property="og:type" content="website">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="https://blumbang.id/og-image.webp">
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Montserrat:ital,wght@0,300;0,400;0,600&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<script src="https://cdnjs.cloudflare.com/ajax/libs/d3/7.9.0/d3.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/topojson/3.0.2/topojson.min.js"></script>
${GA}
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "ItemList",
  "name": "Kota Perjalanan Kaos Blumbang",
  "description": "Daftar kota yang pernah dikunjungi kaos Blumbang ID",
  "itemListElement": [
    {"@type":"ListItem","position":1,"name":"Klaten · Origin","item":"https://sparks.blumbang.id/"},
    ${kotaJsonLd.map(i => JSON.stringify(i)).join(',\n    ')}
  ]
}
</script>
${BASE_CSS}
<style>
.page{padding-top:61px;}
.sparks-header{padding:48px 40px 24px;text-align:center;border-bottom:1px solid var(--border);}
.sparks-title{font-family:var(--font-logo);font-size:clamp(2.5rem,6vw,5rem);letter-spacing:0.08em;color:var(--white);line-height:1;margin-bottom:8px;}
.sparks-sub{font-family:var(--font-ui);font-size:0.7rem;font-weight:500;letter-spacing:0.3em;color:var(--gold);text-transform:uppercase;margin-bottom:16px;}
.sparks-desc{font-family:var(--font-ui);font-size:0.85rem;color:var(--dim);line-height:1.8;max-width:480px;margin:0 auto;}
.stats-bar{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:var(--border);border-bottom:1px solid var(--border);}
.stat-item{background:var(--charcoal);padding:20px 16px;text-align:center;}
.stat-num{font-family:var(--font-logo);font-size:clamp(1.8rem,4vw,2.8rem);color:var(--gold);letter-spacing:0.08em;line-height:1;}
.stat-lbl{font-family:var(--font-ui);font-size:0.6rem;font-weight:600;letter-spacing:0.25em;color:var(--dim);text-transform:uppercase;margin-top:5px;}
.map-section{background:#0a1628;position:relative;}
.map-loading{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:#0a1628;z-index:10;}
.map-loading-text{font-family:var(--font-ui);font-size:0.72rem;font-weight:600;letter-spacing:0.4em;color:var(--gold);text-transform:uppercase;animation:denyut 2s ease-in-out infinite;}
#d3-world-map{display:block;width:100%;}
.map-tooltip{position:fixed;background:rgba(8,8,8,0.92);border:1px solid var(--gold);color:var(--white);font-family:var(--font-ui);font-size:0.7rem;font-weight:600;letter-spacing:0.1em;padding:5px 12px;pointer-events:none;z-index:200;display:none;white-space:nowrap;transform:translate(-50%,-130%);}
.map-tooltip.on{display:block;}
.cities-section{border-top:1px solid var(--border);border-bottom:1px solid var(--border);padding:20px 24px;display:flex;flex-wrap:wrap;gap:8px;background:var(--charcoal);}
.city-tag{display:inline-flex;align-items:center;gap:5px;font-family:var(--font-ui);font-size:0.65rem;font-weight:500;color:var(--light);background:var(--black);border:1px solid var(--border);padding:5px 12px;text-decoration:none;transition:border-color .2s,color .2s;}
.city-tag:hover{border-color:var(--gold-dim);color:var(--gold);}
.city-tag .dot{width:5px;height:5px;border-radius:50%;background:var(--gold);animation:denyut 2s ease-in-out infinite;flex-shrink:0;}
.city-tag.origin{border-color:var(--gold-dim);color:var(--gold);}
.latest-section{padding:20px 24px;display:flex;align-items:center;gap:12px;}
.latest-dot{width:7px;height:7px;border-radius:50%;background:var(--gold);animation:denyut 1.5s ease-in-out infinite;flex-shrink:0;}
.latest-text{font-family:var(--font-ui);font-size:0.75rem;font-weight:500;letter-spacing:0.08em;color:var(--light);}
.latest-city{color:var(--gold);font-weight:600;}
@media(max-width:768px){
  .sparks-header{padding:32px 20px 20px;}
  .stats-bar{grid-template-columns:repeat(2,1fr);}
  .cities-section{padding:16px 20px;}
  .latest-section{padding:16px 20px;}
}
</style>
</head>
<body>
${NAV}
<div class="map-tooltip" id="map-tooltip"></div>
<div class="page">
  <div class="sparks-header">
    <div class="sparks-title">PETA PERJALANAN</div>
    <div class="sparks-sub">Dari Klaten · Ke Dunia</div>
    <div class="sparks-desc">${stats.garment} kaos. ${stats.kota} kota. ${stats.negara} negara.<br>Setiap titik adalah orang yang pernah pakai kaos Blumbang.</div>
  </div>
  <div class="stats-bar">
    <div class="stat-item"><div class="stat-num">${stats.garment}</div><div class="stat-lbl">Kaos Terdaftar</div></div>
    <div class="stat-item"><div class="stat-num">${stats.scan}</div><div class="stat-lbl">Perjalanan</div></div>
    <div class="stat-item"><div class="stat-num">${stats.kota}</div><div class="stat-lbl">Kota</div></div>
    <div class="stat-item"><div class="stat-num">${stats.negara}</div><div class="stat-lbl">Negara</div></div>
  </div>
  <div class="map-section" id="map-section">
    <div class="map-loading" id="map-loading"><div class="map-loading-text">Memuat peta perjalanan...</div></div>
    <svg id="d3-world-map"></svg>
  </div>
  <div class="cities-section">
    <span class="city-tag origin"><span class="dot"></span>Klaten · Origin</span>
    ${kotaTags}
  </div>
  ${latestHtml}
</div>
${FOOTER}
${BASE_JS}
<script src="https://cdnjs.cloudflare.com/ajax/libs/d3/7.9.0/d3.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/topojson/3.0.2/topojson.min.js"></script>
<script>
// Peta D3 — progressive enhancement, konten sudah ada tanpa ini
const SHEET_ID='1J9SVJGQb7msPTEOpUgsJ2TWWvQ4TntIjrkHZ9nbKgbw';
const CITY_COORDS=${generateCityCoords()};

function showTip(evt, text) {
  const t = document.getElementById('map-tooltip');
  t.textContent = text; t.classList.add('on');
  t.style.left = evt.clientX + 'px'; t.style.top = evt.clientY + 'px';
}
function hideTip() { document.getElementById('map-tooltip').classList.remove('on'); }

requestAnimationFrame(function(){
  Promise.all([
    fetch('https://docs.google.com/spreadsheets/d/'+SHEET_ID+'/gviz/tq?tqx=out:json&sheet=SPARKS').then(r=>r.text()),
    fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json').then(r=>r.json())
  ]).then(function([txt, worldData]){
    const m = txt.match(/google\\.visualization\\.Query\\.setResponse\\(([\\s\\S]*)\\)/);
    if(!m) return;
    const rows = JSON.parse(m[1]).table.rows||[];
    buildMap(rows, worldData);
  }).catch(()=>{ document.getElementById('map-loading').style.display='none'; });
});

function buildMap(rows, worldData) {
  const section = document.getElementById('map-section');
  const w = section.clientWidth || window.innerWidth;
  const h = Math.round(w * 0.52);
  const svg = d3.select('#d3-world-map').attr('viewBox','0 0 '+w+' '+h).attr('width',w).attr('height',h);
  const projection = d3.geoNaturalEarth1().scale(w/6.5).translate([w/2, h/2]);
  const path = d3.geoPath().projection(projection);
  const countries = topojson.feature(worldData, worldData.objects.countries);
  svg.append('rect').attr('width',w).attr('height',h).attr('fill','#0a1628');
  svg.append('g').selectAll('path').data(countries.features).join('path')
    .attr('d',path).attr('fill','#0d2040').attr('stroke','#162a4a').attr('stroke-width','0.4');

  const cityMap = {};
  rows.forEach(function(r){
    const c = r.c[2]&&r.c[2].v ? r.c[2].v.toString().trim() : '';
    if(!c) return;
    const key = c.split(',')[0].trim().toLowerCase();
    const coord = CITY_COORDS[key];
    if(!coord) return;
    cityMap[coord.label] = cityMap[coord.label] || { coord, count: 0 };
    cityMap[coord.label].count++;
  });

  const kPx = projection([110.61,-7.706]);

  Object.values(cityMap).forEach(function(item){
    const px = projection(item.coord.lonlat);
    if(!px) return;
    svg.append('circle').attr('cx',px[0]).attr('cy',px[1]).attr('r',2)
      .attr('fill','none').attr('stroke','rgba(201,168,76,0.6)').attr('stroke-width','0.8')
      .transition().duration(1600).ease(d3.easeLinear).attr('r',11).attr('stroke-opacity',0);
    svg.append('circle').attr('cx',px[0]).attr('cy',px[1]).attr('r',2.5)
      .attr('fill','#C9A84C').attr('stroke','rgba(255,255,255,0.6)').attr('stroke-width','0.5')
      .style('cursor','pointer')
      .on('mouseover', evt => showTip(evt, item.coord.label + ' · ' + item.count + ' scan'))
      .on('mouseout', hideTip);
  });

  svg.append('circle').attr('cx',kPx[0]).attr('cy',kPx[1]).attr('r',4)
    .attr('fill','#C9A84C').attr('stroke','#fff').attr('stroke-width','1')
    .style('cursor','pointer')
    .on('mouseover', evt => showTip(evt,'Klaten · Origin'))
    .on('mouseout', hideTip);

  document.getElementById('map-loading').style.display='none';
}
</script>
</body>
</html>`;
}

// ── Generate halaman kota ─────────────────────────────────────────────────────

function generateKotaPage(kotaLabel, scans, slug) {
  const scanItems = scans.map(s => {
    const bulan = bulanTahun(s.ts);
    const isPertama = s.isPertama;
    const baseName = s.name && s.name !== s.garment_id ? s.name : s.garment_id;
    const numMatch = s.garment_id.match(/-(\d+)$/);
    const num = numMatch ? ' · #' + numMatch[1] : '';
    const displayName = baseName + num;
    return `<div class="scan-item${isPertama ? ' pertama' : ''}">
      <div class="scan-id"><a href="https://blumbang.id/id/${s.garment_id}">${displayName}</a></div>
      <div class="scan-meta">${bulan}${isPertama ? ' <span class="badge-pertama">✦ Pertama di sini</span>' : ''}</div>
    </div>`;
  }).join('\n');

  const pertama = scans.find(s => s.isPertama);
  const pertamaBase = pertama ? (pertama.name && pertama.name !== pertama.garment_id ? pertama.name : pertama.garment_id) : '';
  const pertamaNum = pertama ? (pertama.garment_id.match(/-(\d+)$/) ? ' · #' + pertama.garment_id.match(/-(\d+)$/)[1] : '') : '';
  const pertamaName = pertamaBase + pertamaNum;
  const pertamaText = pertama
    ? `Pertama dibawa ke sini oleh <strong>${pertamaName}</strong> · ${bulanTahun(pertama.ts)}`
    : '';

  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Kaos Blumbang di ${kotaLabel} · Sparks</title>
<meta name="description" content="${scans.length} kaos Blumbang pernah mampir ke ${kotaLabel}. ${pertamaText}">
<link rel="canonical" href="https://sparks.blumbang.id/kota/${slug}">
<meta property="og:title" content="Kaos Blumbang di ${kotaLabel}">
<meta property="og:description" content="${scans.length} kaos Blumbang pernah mampir ke ${kotaLabel}.">
<meta property="og:image" content="https://blumbang.id/og-image.webp">
<meta property="og:url" content="https://sparks.blumbang.id/kota/${slug}">
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Montserrat:ital,wght@0,300;0,400;0,600&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
${GA}
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "ItemList",
  "name": "Kaos Blumbang yang pernah di ${kotaLabel}",
  "description": "${scans.length} kaos Blumbang pernah mampir ke ${kotaLabel}",
  "itemListElement": [
    ${scans.map((s,i) => JSON.stringify({"@type":"ListItem","position":i+1,"name":s.garment_id,"url":`https://blumbang.id/id/${s.garment_id}`})).join(',\n    ')}
  ]
}
</script>
${BASE_CSS}
<style>
.page{padding-top:61px;max-width:720px;margin:0 auto;padding-left:24px;padding-right:24px;}
.kota-header{padding:48px 0 32px;border-bottom:1px solid var(--border);margin-bottom:32px;}
.kota-back{font-family:var(--font-ui);font-size:0.65rem;letter-spacing:0.2em;color:var(--dim);text-decoration:none;text-transform:uppercase;display:inline-block;margin-bottom:20px;}
.kota-back:hover{color:var(--gold);}
.kota-title{font-family:var(--font-logo);font-size:clamp(2.5rem,8vw,4rem);letter-spacing:0.06em;color:var(--white);line-height:1;margin-bottom:8px;}
.kota-meta{font-family:var(--font-ui);font-size:0.72rem;color:var(--dim);letter-spacing:0.1em;}
.kota-pertama{margin-bottom:32px;padding:20px 24px;border-left:2px solid var(--gold);background:var(--gold-bg);font-family:var(--font-ui);font-size:0.8rem;color:var(--light);line-height:1.7;}
.kota-pertama strong{color:var(--gold);}
.scan-list{display:flex;flex-direction:column;gap:1px;background:var(--border);margin-bottom:48px;}
.scan-item{background:var(--charcoal);padding:16px 20px;display:flex;align-items:center;justify-content:space-between;}
.scan-item.pertama{background:#0d1a08;border-left:2px solid var(--gold);}
.scan-id a{font-family:var(--font-logo);font-size:1rem;letter-spacing:0.15em;color:var(--gold);text-decoration:none;}
.scan-id a:hover{color:var(--white);}
.scan-meta{font-family:var(--font-ui);font-size:0.65rem;color:var(--dim);letter-spacing:0.08em;}
.badge-pertama{color:var(--gold);font-weight:600;margin-left:8px;}
.kota-cta{text-align:center;padding:32px;border:1px solid var(--border);background:var(--charcoal);margin-bottom:48px;}
.kota-cta-title{font-family:var(--font-logo);font-size:1.4rem;letter-spacing:0.1em;margin-bottom:8px;}
.kota-cta-sub{font-family:var(--font-ui);font-size:0.75rem;color:var(--dim);margin-bottom:20px;line-height:1.6;}
.kota-cta-btn{display:inline-flex;align-items:center;gap:8px;font-family:var(--font-ui);font-size:0.72rem;font-weight:700;letter-spacing:0.2em;color:var(--black);background:var(--gold);padding:12px 28px;text-decoration:none;text-transform:uppercase;}
.kota-cta-btn:hover{background:var(--white);}
</style>
</head>
<body>
${NAV}
<div class="page">
  <div class="kota-header">
    <a href="/sparks" class="kota-back">← Semua Perjalanan</a>
    <div class="kota-title">${kotaLabel.toUpperCase()}</div>
    <div class="kota-meta">${scans.length} kaos Blumbang pernah mampir ke sini</div>
  </div>
  ${pertamaText ? `<div class="kota-pertama">✦ &nbsp; ${pertamaText}</div>` : ''}
  <div class="scan-list">
    ${scanItems}
  </div>
  <div class="kota-cta">
    <div class="kota-cta-title">Sedang di ${kotaLabel}?</div>
    <div class="kota-cta-sub">Scan QR di label bagian dalam kaos Blumbang kamu.<br>Perjalananmu akan tercatat di halaman ini selamanya.</div>
    <a href="https://wa.me/6281234561146" class="kota-cta-btn">✦ &nbsp; Tanya via WhatsApp</a>
  </div>
</div>
${FOOTER}
${BASE_JS}
</body>
</html>`;
}

// ── City coords (diambil dari sparks.html yang ada) ───────────────────────────

function generateCityCoords() {
  return JSON.stringify({
    'klaten':{lonlat:[110.61,-7.706],label:'Klaten'},
    'yogyakarta':{lonlat:[110.364,-7.797],label:'Yogyakarta'},
    'jakarta':{lonlat:[106.845,-6.208],label:'Jakarta'},
    'surakarta':{lonlat:[110.826,-7.566],label:'Surakarta'},
    'solo':{lonlat:[110.826,-7.566],label:'Solo'},
    'bandung':{lonlat:[107.608,-6.917],label:'Bandung'},
    'semarang':{lonlat:[110.424,-6.967],label:'Semarang'},
    'surabaya':{lonlat:[112.752,-7.246],label:'Surabaya'},
    'bali':{lonlat:[115.092,-8.34],label:'Bali'},
    'denpasar':{lonlat:[115.217,-8.65],label:'Denpasar'},
    'tokyo':{lonlat:[139.691,35.689],label:'Tokyo'},
    'victoria':{lonlat:[55.455,-4.62],label:'Victoria'},
    'victoria, seychelles':{lonlat:[55.455,-4.62],label:'Victoria'},
    'ile au cerf':{lonlat:[55.508,-4.64],label:'Ile Au Cerf'},
    'pontianak':{lonlat:[109.342,-0.02],label:'Pontianak'},
    'samarinda':{lonlat:[117.136,-0.502],label:'Samarinda'},
    'banjarmasin':{lonlat:[114.592,-3.317],label:'Banjarmasin'},
    'banjarbaru':{lonlat:[114.831,-3.442],label:'Banjarbaru'},
    'kediri':{lonlat:[112.008,-7.816],label:'Kediri'},
    'sleman':{lonlat:[110.355,-7.717],label:'Sleman'},
    'boyolali':{lonlat:[110.599,-7.532],label:'Boyolali'},
    'wonosobo':{lonlat:[109.905,-7.361],label:'Wonosobo'},
    'banyumas':{lonlat:[109.215,-7.513],label:'Banyumas'},
    'sukoharjo':{lonlat:[110.839,-7.682],label:'Sukoharjo'},
    'bulakamba':{lonlat:[108.988,-6.867],label:'Bulakamba'},
    'selogiri':{lonlat:[110.895,-7.783],label:'Selogiri'},
    'kijang':{lonlat:[104.633,0.917],label:'Kijang'},
    'trucuk':{lonlat:[110.617,-7.713],label:'Trucuk'},
    'berbak':{lonlat:[103.5,-1.4],label:'Berbak'}
  });
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Fetching data dari Google Sheets...');

  const [spkTxt, garTxt] = await Promise.all([
    fetch(`https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=SPARKS`),
    fetch(`https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=GARMENTS`)
  ]);

  const spkRows = parseSheet(spkTxt).filter(r => r.c[0] && val(r.c[0]));
  const garRows = parseSheet(garTxt).filter(r => r.c[0] && val(r.c[0]));

  console.log(`Data: ${spkRows.length} scan, ${garRows.length} garment`);

  // Buat lookup garment_id -> name
  const garmentNames = {};
  garRows.forEach(r => {
    const id = val(r.c[0]);
    const name = val(r.c[1]);
    if (id) garmentNames[id] = name || id;
  });

  // Hitung stats
  const kotaSet = new Set(['Klaten']);
  const negaraSet = new Set(['Indonesia']);
  const kotaMap = {}; // label -> [{garment_id, ts, isPertama}]

  spkRows.forEach(r => {
    const city = val(r.c[2]);
    if (!city) return;
    const parts = city.split(',');
    const kota = parts[0].trim();
    const negara = parts[1] ? parts[1].trim() : 'Indonesia';
    const garmentId = val(r.c[0]);
    const ts = val(r.c[6]);

    kotaSet.add(kota);
    negaraSet.add(negara);

    if (!kotaMap[kota]) kotaMap[kota] = [];
    kotaMap[kota].push({ garment_id: garmentId, name: garmentNames[garmentId] || garmentId, ts, isPertama: false });
  });

  // Tandai yang pertama per kota
  Object.keys(kotaMap).forEach(kota => {
    if (kotaMap[kota].length > 0) kotaMap[kota][0].isPertama = true;
  });

  const scanTerbaru = spkRows.length > 0
    ? val(spkRows[spkRows.length-1].c[2]).split(',')[0].trim()
    : null;

  const stats = {
    garment: garRows.length,
    scan: spkRows.length,
    kota: kotaSet.size,
    negara: negaraSet.size
  };

  // Buat list kota untuk tags (exclude Klaten)
  const kotaList = Object.keys(kotaMap).map(label => ({
    label,
    slug: slugify(label),
    count: kotaMap[label].length
  })).sort((a,b) => b.count - a.count);

  // Buat folder output
  const outDir = path.join(__dirname, 'sparks');
  const kotaDir = path.join(outDir, 'kota');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  if (!fs.existsSync(kotaDir)) fs.mkdirSync(kotaDir, { recursive: true });

  // Generate index
  console.log('Generating sparks/index.html...');
  fs.writeFileSync(path.join(outDir, 'index.html'), generateIndex(stats, kotaList, scanTerbaru));

  // Generate halaman kota
  let kotaCount = 0;
  for (const [label, scans] of Object.entries(kotaMap)) {
    const slug = slugify(label);
    if (!slug) continue;
    const filePath = path.join(kotaDir, `${slug}.html`);
    fs.writeFileSync(filePath, generateKotaPage(label, scans, slug));
    kotaCount++;
  }

  console.log(`✓ Generated sparks/index.html`);
  console.log(`✓ Generated ${kotaCount} halaman kota di sparks/kota/`);
  console.log('Done.');
}

main().catch(err => { console.error('Error:', err); process.exit(1); });
