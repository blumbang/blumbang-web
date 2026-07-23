// generate-posts.js
// Jalankan: node generate-posts.js
// Script ini membaca semua file .md di folder _posts
// dan menggenerate:
//   1. blog/posts.json  — untuk halaman blog index
//   2. blog/[slug].html — static HTML per artikel (SEO-ready)
//   3. sitemap.xml      — untuk Google Search Console

const fs = require('fs');
const path = require('path');

const POSTS_DIR = path.join(__dirname, '_posts');
const OUTPUT_JSON = path.join(__dirname, 'blog', 'posts.json');
const OUTPUT_SITEMAP = path.join(__dirname, 'sitemap.xml');
const BLOG_DIR = path.join(__dirname, 'blog');
const BASE_URL = 'https://blumbang.id';

function parseFrontmatter(content) {
  const result = { body: content, meta: {} };
  if (!content.startsWith('---')) return result;
  const end = content.indexOf('---', 3);
  if (end === -1) return result;
  const frontmatter = content.slice(3, end).trim();
  result.body = content.slice(end + 3).trim();

  const lines = frontmatter.split('\n');
  let currentKey = null;
  let currentVal = null;

  const commitCurrent = () => {
    if (currentKey === null) return;
    let val = currentVal.trim();
    if ((val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (val === 'true') val = true;
    if (val === 'false') val = false;
    result.meta[currentKey] = val;
    currentKey = null;
    currentVal = null;
  };

  lines.forEach(line => {
    // Baris lanjutan multiline (diawali spasi/tab)
    if (currentKey && (line.startsWith(' ') || line.startsWith('\t'))) {
      currentVal += ' ' + line.trim();
      return;
    }
    // Baris baru — commit yang sebelumnya
    commitCurrent();
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) return;
    currentKey = line.slice(0, colonIdx).trim();
    currentVal = line.slice(colonIdx + 1).trim();
  });
  commitCurrent();

  return result;
}

function slugFromFilename(filename) {
  const name = filename.replace('.md', '');
  const match = name.match(/^\d{4}-\d{2}-\d{2}-(.+)$/);
  const raw = match ? match[1] : name;
  return raw.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-');
}

// Markdown to HTML — simpel tapi cukup untuk SEO
function markdownToHtml(md) {
  let html = md
    // Heading
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // Bold & italic
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Blockquote
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    // Image
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">')
    // Link
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    // Horizontal rule
    .replace(/^---$/gm, '<hr>')
    // Paragraf — bungkus baris yang bukan tag HTML
    .split('\n\n')
    .map(block => {
      block = block.trim();
      if (!block) return '';
      if (block.startsWith('<h') || block.startsWith('<blockquote') || 
          block.startsWith('<img') || block.startsWith('<hr')) return block;
      return '<p>' + block.replace(/\n/g, ' ') + '</p>';
    })
    .join('\n');
  return html;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch(e) { return dateStr; }
}

function generateArticleHtml(post, bodyHtml) {
  const canonical = `${BASE_URL}/blog/${post.slug}`;
  const metaDesc = post.description ? post.description.replace(/\n/g, ' ').slice(0, 160) : '';
  const coverHtml = post.cover ? `<img class="article-cover" src="${post.cover}" alt="${post.title}" onclick="bukaLightbox(this.src)">` : '';
  const catHtml = post.category ? `<span class="article-cat">${post.category}</span>` : '';
  const dateHtml = post.date ? `<span class="article-date">${formatDate(post.date)}</span>` : '';

  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${post.title} — Blumbang</title>
<meta name="description" content="${metaDesc}">
<meta property="og:title" content="${post.title} — Blumbang">
<meta property="og:description" content="${metaDesc}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="Blumbang.id">
<meta property="og:url" content="${canonical}">
${post.cover ? `<meta property="og:image" content="${post.cover}">` : '<meta property="og:image" content="https://blumbang.id/og-image.jpg">'}
<link rel="canonical" href="${canonical}">
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Montserrat:wght@300;400;500;600&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<script async src="https://www.googletagmanager.com/gtag/js?id=G-39SRRM5GKK"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag("js",new Date());gtag("config","G-39SRRM5GKK");</script>
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "${post.title.replace(/"/g, '\\"')}",
  "description": "${metaDesc.replace(/"/g, '\\"')}",
  "datePublished": "${post.date}",
  "author": {"@type": "Organization", "name": "Blumbang ID"},
  "publisher": {"@type": "Organization", "name": "Blumbang ID", "url": "https://blumbang.id"},
  "url": "${canonical}"
}
</script>
<style>
:root{--black:#080808;--charcoal:#141414;--grey:#1e1e1e;--border:#2a2a2a;--muted:#666;--dim:#888;--light:#ccc;--white:#F5F0E8;--gold:#C9A84C;--gold-dim:#7a6028;--gold-bg:#140f02;--font-logo:'Bebas Neue',sans-serif;--font-body:'Montserrat',sans-serif;--font-ui:'Inter',sans-serif;}
*,*::before,*::after{margin:0;padding:0;box-sizing:border-box;}
html{scroll-behavior:smooth;}
body{background:var(--black);color:var(--white);font-family:var(--font-body);min-height:100vh;}
a{text-decoration:none;color:inherit;}
nav{position:fixed;top:0;left:0;right:0;z-index:100;display:flex;align-items:center;justify-content:space-between;padding:18px 40px;background:rgba(8,8,8,0.98);border-bottom:1px solid var(--border);}
.nav-brand{font-family:var(--font-logo);font-size:1.6rem;letter-spacing:0.15em;color:var(--gold);}
.nav-links{display:flex;gap:32px;}
.nav-links a{font-family:var(--font-ui);font-size:0.75rem;font-weight:500;letter-spacing:0.12em;color:var(--light);transition:color 0.2s;text-transform:uppercase;}
.nav-links a:hover{color:var(--gold);}
.nav-order{font-family:var(--font-ui);font-size:0.72rem;font-weight:700;letter-spacing:0.2em;color:var(--black);background:var(--gold);padding:9px 20px;text-transform:uppercase;}
.nav-order:hover{background:var(--white);}
.nav-ham{display:none;background:none;border:none;color:var(--gold);font-size:1.4rem;cursor:pointer;}
.nav-mob{display:none;position:fixed;top:64px;left:0;right:0;background:var(--charcoal);border-bottom:1px solid var(--border);z-index:99;flex-direction:column;padding:20px;}
.nav-mob.open{display:flex;}
.nav-mob a{font-family:var(--font-ui);font-size:0.85rem;font-weight:500;letter-spacing:0.12em;color:var(--light);padding:12px 0;border-bottom:1px solid var(--border);text-transform:uppercase;}
.nav-mob a:last-child{border-bottom:none;color:var(--gold);font-weight:700;}
.article-cover{width:100%;aspect-ratio:3/2;object-fit:cover;object-position:center top;display:block;filter:grayscale(15%);cursor:zoom-in;transition:filter 0.2s;margin-top:64px;}
.article-cover:hover{filter:grayscale(0%);}
.article-wrap{max-width:720px;margin:0 auto;padding:48px 40px 80px;}
.lightbox{position:fixed;inset:0;z-index:999;background:rgba(0,0,0,0.95);display:flex;align-items:center;justify-content:center;opacity:0;pointer-events:none;transition:opacity 0.3s;cursor:zoom-out;}
.lightbox.on{opacity:1;pointer-events:all;}
.lightbox img{max-width:92vw;max-height:92vh;object-fit:contain;}
.article-back{display:inline-flex;align-items:center;gap:8px;font-family:var(--font-ui);font-size:0.65rem;font-weight:600;letter-spacing:0.15em;text-transform:uppercase;color:var(--dim);text-decoration:none;margin-bottom:32px;transition:color 0.2s;}
.article-back:hover{color:var(--gold);}
.article-meta{display:flex;align-items:center;gap:12px;margin-bottom:20px;}
.article-cat{font-family:var(--font-ui);font-size:0.6rem;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:var(--gold);padding:3px 10px;border:1px solid var(--gold-dim);background:var(--gold-bg);}
.article-date{font-family:var(--font-ui);font-size:0.68rem;color:var(--muted);}
.article-title{font-family:var(--font-logo);font-size:clamp(2rem,5vw,3.5rem);letter-spacing:0.04em;line-height:1.1;margin-bottom:16px;}
.article-desc{font-family:var(--font-body);font-size:1rem;font-weight:300;color:var(--dim);line-height:1.7;margin-bottom:40px;padding-bottom:40px;border-bottom:1px solid var(--border);}
.article-content{font-family:var(--font-body);font-size:0.95rem;font-weight:300;line-height:1.9;color:var(--light);}
.article-content h1,.article-content h2{font-family:var(--font-logo);letter-spacing:0.05em;color:var(--white);margin:40px 0 16px;}
.article-content h1{font-size:2rem;}.article-content h2{font-size:1.6rem;}
.article-content h3{font-family:var(--font-ui);font-size:0.85rem;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:var(--gold);margin:32px 0 12px;}
.article-content p{margin-bottom:20px;}
.article-content strong{color:var(--white);font-weight:600;}
.article-content em{color:var(--dim);font-style:italic;}
.article-content img{width:100%;margin:32px 0;border:1px solid var(--border);cursor:zoom-in;}
.article-content blockquote{border-left:2px solid var(--gold-dim);padding:16px 24px;margin:32px 0;background:var(--charcoal);}
.article-content a{color:var(--gold);text-decoration:underline;}
.article-cta{margin-top:60px;padding:32px;background:var(--charcoal);border:1px solid var(--border);text-align:center;}
.article-cta-title{font-family:var(--font-logo);font-size:1.4rem;letter-spacing:0.1em;color:var(--white);margin-bottom:8px;}
.article-cta-sub{font-family:var(--font-ui);font-size:0.75rem;color:var(--muted);margin-bottom:20px;}
.article-cta-btn{display:inline-block;font-family:var(--font-ui);font-size:0.72rem;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:var(--black);background:var(--gold);padding:12px 28px;}
footer{border-top:1px solid var(--border);padding:32px 40px;display:flex;align-items:center;justify-content:space-between;}
.footer-brand{font-family:var(--font-logo);font-size:1.2rem;letter-spacing:0.15em;color:var(--gold-dim);}
.footer-link{font-family:var(--font-ui);font-size:0.68rem;color:var(--muted);letter-spacing:0.1em;}
.footer-link:hover{color:var(--gold);}
@media(max-width:768px){nav{padding:14px 18px;}.nav-links,.nav-order{display:none;}.nav-ham{display:block;}.article-wrap{padding:32px 20px 60px;}footer{padding:24px 18px;flex-direction:column;gap:12px;text-align:center;}}
</style>
</head>
<body>
<nav>
  <a href="/" class="nav-brand">BLUMB✦NG</a>
  <div class="nav-links">
    <a href="/karya">Karya</a>
    <a href="/sparks">Perjalanan</a>
    <a href="/blog">Blog</a>
    <a href="/about">Tentang</a>
  </div>
  <a href="https://wa.me/6281234561146" class="nav-order">✦ ORDER</a>
  <button class="nav-ham" onclick="toggleNav()" id="nav-ham">☰</button>
</nav>
<div class="nav-mob" id="nav-mob">
  <a href="/karya">Karya</a>
  <a href="/sparks">Perjalanan</a>
  <a href="/blog">Blog</a>
  <a href="/about">Tentang</a>
  <a href="https://wa.me/6281234561146">✦ ORDER SEKARANG</a>
</div>

${coverHtml}

<div class="article-wrap">
  <a href="/blog" class="article-back">← Kembali ke Blog</a>
  <div class="article-meta">${catHtml}${dateHtml}</div>
  <h1 class="article-title">${post.title}</h1>
  ${metaDesc ? `<div class="article-desc">${metaDesc}</div>` : ''}
  <div class="article-content">${bodyHtml}</div>

  <div class="article-cta">
    <div class="article-cta-title">TERTARIK BIKIN KAOS?</div>
    <div class="article-cta-sub">Workshop Blumbang di Jeto, Klaten. Sat set, tidak bertele-tele.</div>
    <a href="https://wa.me/6281234561146" class="article-cta-btn">✦ Hubungi Kami</a>
  </div>
</div>

<div class="lightbox" id="lightbox" onclick="tutupLightbox()">
  <img id="lb-img" src="" alt="">
</div>

<footer>
  <a href="/" class="footer-brand">BLUMB✦NG</a>
  <a href="https://wa.me/6281234561146" class="footer-link">Order via WhatsApp →</a>
</footer>

<script>
function toggleNav(){var m=document.getElementById('nav-mob'),h=document.getElementById('nav-ham');m.classList.toggle('open');h.textContent=m.classList.contains('open')?'✕':'☰';}
function bukaLightbox(src){var lb=document.getElementById('lightbox');document.getElementById('lb-img').src=src;lb.classList.add('on');}
function tutupLightbox(){document.getElementById('lightbox').classList.remove('on');}
</script>
</body>
</html>`;
}

async function fetchSeriSlugs() {
  try {
    const res = await fetch('https://catalog-builder.blmbng-id.workers.dev/seri/list');
    const data = await res.json();
    if (data.ok && Array.isArray(data.data)) {
      return data.data
        .filter(s => s.status === 'published')
        .map(s => ({ id: s.id, ts: s.updated_at || s.created_at || null }));
    }
    console.log('⚠️  Respons /seri/list tidak sesuai bentuk yang diharapkan');
  } catch(e) {
    console.log('⚠️  Gagal fetch seri dari Worker:', e.message);
  }
  return null;   // null = GAGAL (beda dari [] yang berarti "memang nol seri")
}

// Tanggal (YYYY-MM-DD) dari epoch milidetik. Balik ke fallback kalau tidak masuk akal.
function tglDariEpoch(ms, fallback) {
  if (!ms || typeof ms !== 'number' || ms <= 0) return fallback;
  const d = new Date(ms);
  if (isNaN(d.getTime())) return fallback;
  return d.toISOString().split('T')[0];
}

// Manifest tanggal halaman statis. Dibuat build-sitemap-dates.js di GitHub Actions.
// Kalau file belum ada / rusak → objek kosong, semua halaman statis pakai fallback.
// TIDAK BOLEH melempar error: script ini juga jalan saat Cloudflare Pages build.
function bacaManifestTanggal() {
  try {
    const p = path.join(__dirname, 'sitemap-dates.json');
    if (!fs.existsSync(p)) {
      console.log('⚠️  sitemap-dates.json belum ada — halaman statis pakai tanggal fallback');
      return {};
    }
    const m = JSON.parse(fs.readFileSync(p, 'utf8'));
    return (m && typeof m === 'object') ? m : {};
  } catch(e) {
    console.log('⚠️  sitemap-dates.json tidak terbaca:', e.message);
    return {};
  }
}

function generateSitemap(posts, seriList) {
  const today = new Date().toISOString().split('T')[0];
  const manifest = bacaManifestTanggal();
  const FALLBACK = '2026-07-04';   // tanggal generate terverifikasi terakhir

  // tgl(): tanggal halaman statis dari manifest, fallback kalau belum tercatat.
  const tgl = (key) => manifest[key] || FALLBACK;

  // Halaman yang MEMANG dibangun ulang tiap malam -> 'today' itu jujur:
  //   /          -> inject-stats.js menulis ulang angka statistik
  //   /sparks    -> build-sparks.js membangun ulang dari scan terbaru
  //   /sparks/kota/*, /sparks/hof -> idem
  // Sisanya TIDAK boleh pakai 'today'.

  // Halaman turunan: tanggalnya ikut isi terbaru, otomatis tanpa manifest.
  const tglKarya = seriList.length
    ? seriList.map(s => tglDariEpoch(s.ts, FALLBACK)).sort().pop()
    : FALLBACK;
  const tglBlog = posts.length
    ? posts.map(p => p.date || FALLBACK).sort().pop()
    : FALLBACK;

  const staticPages = [
    { loc: `${BASE_URL}/`,                      lastmod: today, changefreq: 'weekly',  priority: '1.0' },
    { loc: `${BASE_URL}/karya`,                 lastmod: tglKarya, changefreq: 'weekly',  priority: '0.9' },
    { loc: `${BASE_URL}/sparks`,                lastmod: today, changefreq: 'daily',   priority: '0.9' },
    { loc: `${BASE_URL}/about`,                 lastmod: tgl('/about'), changefreq: 'monthly', priority: '0.9' },
    { loc: `${BASE_URL}/blog`,                  lastmod: tglBlog, changefreq: 'weekly',  priority: '0.8' },
    { loc: `${BASE_URL}/ria`,                   lastmod: tgl('/ria'), changefreq: 'monthly', priority: '0.5' },
    { loc: `${BASE_URL}/sablon-klaten`,         lastmod: tgl('/sablon-klaten'), changefreq: 'monthly', priority: '0.8' },
    { loc: `${BASE_URL}/sablon-trucuk`,         lastmod: tgl('/sablon-trucuk'), changefreq: 'monthly', priority: '0.8' },
    { loc: `${BASE_URL}/sablon-bayat`,          lastmod: tgl('/sablon-bayat'), changefreq: 'monthly', priority: '0.8' },
    { loc: `${BASE_URL}/sablon-pedan`,          lastmod: tgl('/sablon-pedan'), changefreq: 'monthly', priority: '0.8' },
    { loc: `${BASE_URL}/sablon-cawas`,          lastmod: tgl('/sablon-cawas'), changefreq: 'monthly', priority: '0.8' },
    { loc: `${BASE_URL}/sablon-solo`,           lastmod: tgl('/sablon-solo'), changefreq: 'monthly', priority: '0.8' },
    { loc: `${BASE_URL}/sablon-jogja`,          lastmod: tgl('/sablon-jogja'), changefreq: 'monthly', priority: '0.8' },
    { loc: `${BASE_URL}/sablon-banjarbaru`,     lastmod: tgl('/sablon-banjarbaru'), changefreq: 'monthly', priority: '0.8' },
    { loc: `${BASE_URL}/sablon-brand-klaten`,   lastmod: tgl('/sablon-brand-klaten'), changefreq: 'monthly', priority: '0.8' },
    { loc: `${BASE_URL}/apa-itu-living-garment`, lastmod: tgl('/apa-itu-living-garment'), changefreq: 'monthly', priority: '0.85' },
    { loc: `${BASE_URL}/living-garment-indonesia`, lastmod: tgl('/living-garment-indonesia'), changefreq: 'monthly', priority: '0.8' },
    { loc: `${BASE_URL}/kemitraan`,             lastmod: tgl('/kemitraan'), changefreq: 'monthly', priority: '0.8' },
    { loc: `${BASE_URL}/konveksi-klaten`,       lastmod: tgl('/konveksi-klaten'), changefreq: 'monthly', priority: '0.8' },
    { loc: `${BASE_URL}/kaos-sekolah-klaten`,   lastmod: tgl('/kaos-sekolah-klaten'), changefreq: 'monthly', priority: '0.8' },
    { loc: `${BASE_URL}/sablon-satuan-klaten`,  lastmod: tgl('/sablon-satuan-klaten'), changefreq: 'monthly', priority: '0.8' },
  ];
  const seriPages = seriList.map(s => ({
    loc: `${BASE_URL}/karya/${s.id}`,
    lastmod: tglDariEpoch(s.ts, FALLBACK),
    changefreq: 'weekly', priority: '0.85'
  }));
  const blogPages = posts.map(p => ({
    loc: `${BASE_URL}/blog/${p.slug}`,
    lastmod: p.date || today, changefreq: 'monthly', priority: '0.7'
  }));

  // Halaman sparks kota
  const kotaDir = path.join(__dirname, 'sparks', 'kota');
  const kotaPages = [];
  if (fs.existsSync(kotaDir)) {
    fs.readdirSync(kotaDir).filter(f => f.endsWith('.html')).forEach(f => {
      const slug = f.replace('.html', '');
      kotaPages.push({ loc: BASE_URL + '/sparks/kota/' + slug, lastmod: today, changefreq: 'daily', priority: '0.7' });
    });
  }
  if (fs.existsSync(path.join(__dirname, 'sparks', 'hof.html'))) {
    kotaPages.push({ loc: BASE_URL + '/sparks/hof', lastmod: today, changefreq: 'daily', priority: '0.7' });
  }

  const allPages = [...staticPages, ...seriPages, ...blogPages, ...kotaPages];
  const urls = allPages.map(p => `  <url>
    <loc>${p.loc}</loc>
    <lastmod>${p.lastmod}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}

async function generate() {
  if (!fs.existsSync(POSTS_DIR)) {
    fs.mkdirSync(POSTS_DIR, { recursive: true });
  }
  if (!fs.existsSync(BLOG_DIR)) {
    fs.mkdirSync(BLOG_DIR, { recursive: true });
  }

  const files = fs.readdirSync(POSTS_DIR)
    .filter(f => f.endsWith('.md'))
    .sort().reverse();

  const posts = files.map(filename => {
    const content = fs.readFileSync(path.join(POSTS_DIR, filename), 'utf8');
    const { meta, body } = parseFrontmatter(content);
    const slug = meta.slug || slugFromFilename(filename);
    return {
      slug, filename, body,
      title: meta.title || 'Tanpa Judul',
      date: meta.date || '',
      category: meta.category || '',
      description: meta.description || '',
      cover: meta.cover || '',
      published: meta.published !== false
    };
  }).filter(p => p.published !== false);

  // 1. Generate posts.json
  const postsJson = posts.map(({body, ...rest}) => rest);
  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(postsJson, null, 2));
  console.log(`✅ ${posts.length} artikel ditulis ke blog/posts.json`);

  // 2. Generate static HTML per artikel
  posts.forEach(post => {
    const bodyHtml = markdownToHtml(post.body);
    const html = generateArticleHtml(post, bodyHtml);
    const outPath = path.join(BLOG_DIR, post.slug + '.html');
    fs.writeFileSync(outPath, html);
    console.log(`   ✦ blog/${post.slug}.html`);
  });
  console.log(`✅ ${posts.length} static HTML artikel di-generate`);

  // 3. Fetch seri dan generate sitemap
  const seriList = await fetchSeriSlugs();

  if (seriList === null) {
    console.log('⛔ Fetch seri GAGAL — sitemap.xml TIDAK ditulis ulang.');
    console.log('   File sitemap lama dipertahankan agar 46 halaman /karya tidak lenyap.');
    return;
  }

  console.log(`✅ ${seriList.length} seri ditemukan untuk sitemap`);
  const sitemap = generateSitemap(postsJson, seriList);
  fs.writeFileSync(OUTPUT_SITEMAP, sitemap);
  const totalUrl = (sitemap.match(/<loc>/g) || []).length;
  console.log(`✅ sitemap.xml diupdate — ${totalUrl} URL (${seriList.length} seri + ${posts.length} blog + statis & sparks)`);
}

generate();
