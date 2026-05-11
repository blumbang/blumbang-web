// generate-posts.js
// Jalankan: node generate-posts.js
// Script ini membaca semua file .md di folder _posts
// dan menggenerate:
//   1. blog/posts.json  — untuk halaman blog
//   2. sitemap.xml      — untuk Google Search Console (include /karya/)

const fs = require('fs');
const path = require('path');

const POSTS_DIR = path.join(__dirname, '_posts');
const OUTPUT_JSON = path.join(__dirname, 'blog', 'posts.json');
const OUTPUT_SITEMAP = path.join(__dirname, 'sitemap.xml');
const BASE_URL = 'https://blumbang.id';

function parseFrontmatter(content) {
  const result = { body: content, meta: {} };
  if (!content.startsWith('---')) return result;

  const end = content.indexOf('---', 3);
  if (end === -1) return result;

  const frontmatter = content.slice(3, end).trim();
  result.body = content.slice(end + 3).trim();

  frontmatter.split('\n').forEach(line => {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) return;
    const key = line.slice(0, colonIdx).trim();
    let val = line.slice(colonIdx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (val === 'true') val = true;
    if (val === 'false') val = false;
    result.meta[key] = val;
  });

  return result;
}

function slugFromFilename(filename) {
  const name = filename.replace('.md', '');
  const match = name.match(/^\d{4}-\d{2}-\d{2}-(.+)$/);
  const raw = match ? match[1] : name;
  return raw.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-');
}

async function fetchSeriSlugs() {
  // Slug seri yang sudah published di D1
  // Update array ini setiap kali ada seri baru ditambah via admin panel
  return [
    'gemoy',
    'lpk-ooita',
    'twelve-society'
  ];
}

function generateSitemap(posts, seriSlugs) {
  const today = new Date().toISOString().split('T')[0];

  // Halaman statis
  const staticPages = [
    { loc: `${BASE_URL}/`,        lastmod: today, changefreq: 'weekly',  priority: '1.0' },
    { loc: `${BASE_URL}/catalog`, lastmod: today, changefreq: 'weekly',  priority: '0.9' },
    { loc: `${BASE_URL}/sparks`,  lastmod: today, changefreq: 'daily',   priority: '0.9' },
    { loc: `${BASE_URL}/about`,   lastmod: today, changefreq: 'monthly', priority: '0.8' },
    { loc: `${BASE_URL}/blog`,    lastmod: today, changefreq: 'weekly',  priority: '0.8' },
    { loc: `${BASE_URL}/ria`,     lastmod: today, changefreq: 'monthly', priority: '0.5' },
  ];

  // Halaman seri /karya/
  const seriPages = seriSlugs.map(slug => ({
    loc: `${BASE_URL}/karya/${slug}`,
    lastmod: today,
    changefreq: 'weekly',
    priority: '0.85'
  }));

  // Halaman artikel blog
  const blogPages = posts.map(p => ({
    loc: `${BASE_URL}/blog/post.html?slug=${p.slug}`,
    lastmod: p.date || today,
    changefreq: 'monthly',
    priority: '0.7'
  }));

  const allPages = [...staticPages, ...seriPages, ...blogPages];

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
    console.log('📁 Folder _posts dibuat');
  }

  const files = fs.readdirSync(POSTS_DIR)
    .filter(f => f.endsWith('.md'))
    .sort()
    .reverse();

  const posts = files.map(filename => {
    const content = fs.readFileSync(path.join(POSTS_DIR, filename), 'utf8');
    const { meta } = parseFrontmatter(content);
    const slug = meta.slug || slugFromFilename(filename);

    return {
      slug,
      filename,
      title: meta.title || 'Tanpa Judul',
      date: meta.date || '',
      category: meta.category || '',
      description: meta.description || '',
      cover: meta.cover || '',
      published: meta.published !== false
    };
  }).filter(p => p.published !== false);

  // Pastikan folder blog ada
  const blogDir = path.join(__dirname, 'blog');
  if (!fs.existsSync(blogDir)) {
    fs.mkdirSync(blogDir, { recursive: true });
  }

  // 1. Generate posts.json
  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(posts, null, 2));
  console.log(`✅ ${posts.length} artikel ditulis ke blog/posts.json`);
  posts.forEach(p => console.log(`   · ${p.slug} — ${p.title}`));

  // 2. Fetch slug seri dari Worker
  const seriSlugs = await fetchSeriSlugs();
  console.log(`✅ ${seriSlugs.length} seri ditemukan untuk sitemap`);

  // 3. Generate sitemap.xml
  const sitemap = generateSitemap(posts, seriSlugs);
  fs.writeFileSync(OUTPUT_SITEMAP, sitemap);
  console.log(`✅ sitemap.xml diupdate (6 statis + ${seriSlugs.length} seri + ${posts.length} blog = ${6 + seriSlugs.length + posts.length} URL)`);
}

generate();
