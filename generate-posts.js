// generate-posts.js
// Jalankan: node generate-posts.js
// Script ini membaca semua file .md di folder _posts
// dan menggenerate blog/posts.json untuk dipakai halaman blog

const fs = require('fs');
const path = require('path');

const POSTS_DIR = path.join(__dirname, '_posts');
const OUTPUT = path.join(__dirname, 'blog', 'posts.json');

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
    // Hapus quote jika ada
    if ((val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    // Boolean
    if (val === 'true') val = true;
    if (val === 'false') val = false;
    result.meta[key] = val;
  });

  return result;
}

function slugFromFilename(filename) {
  // Format: YYYY-MM-DD-slug.md → slug
  const name = filename.replace('.md', '');
  const match = name.match(/^\d{4}-\d{2}-\d{2}-(.+)$/);
  return match ? match[1] : name;
}

function generate() {
  if (!fs.existsSync(POSTS_DIR)) {
    fs.mkdirSync(POSTS_DIR, { recursive: true });
    console.log('📁 Folder _posts dibuat');
  }

  const files = fs.readdirSync(POSTS_DIR)
    .filter(f => f.endsWith('.md'))
    .sort()
    .reverse(); // terbaru dulu

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

  fs.writeFileSync(OUTPUT, JSON.stringify(posts, null, 2));
  console.log(`✅ ${posts.length} artikel ditulis ke blog/posts.json`);
  posts.forEach(p => console.log(`   · ${p.slug} — ${p.title}`));
}

generate();
