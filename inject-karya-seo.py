css = '''
.karya-seo{padding:0 32px 40px;max-width:800px;}
.karya-seo p{font-size:.85rem;line-height:1.85;color:#aaa;margin-bottom:12px;}
.karya-seo-links{display:flex;flex-wrap:wrap;gap:8px;margin-top:16px;}
.karya-seo-links a{font-family:"Inter",sans-serif;font-size:.6rem;font-weight:600;letter-spacing:.14em;text-transform:uppercase;padding:6px 14px;border:1px solid #2a2a2a;color:#ddd;text-decoration:none;transition:all .2s;}
.karya-seo-links a:hover{border-color:#C9A84C;color:#C9A84C;}
'''

seo = '''<div class="karya-seo">
  <p>30 koleksi kaos custom dari workshop Blumbang ID di Jeto, Klaten. Dari kaos kelas sekolah, kaos wisata komunitas, apparel event, hingga kaos brand independen — semua dikerjakan di workshop yang sama dengan standar yang tidak berkompromi.</p>
  <p>Setiap kaos dilengkapi QR unik Living Garment System yang mencatat perjalanan pemiliknya di peta dunia. Sablon plastisol, DTF, dan rubber. Melayani order dari Klaten, Solo, Jogja, Banjarbaru, dan seluruh Indonesia.</p>
  <div class="karya-seo-links">
    <a href="/sablon-klaten">Sablon Klaten</a>
    <a href="/sablon-solo">Sablon Solo</a>
    <a href="/sablon-jogja">Sablon Jogja</a>
    <a href="/sablon-banjarbaru">Sablon Banjarbaru</a>
    <a href="/about">Tentang Tim</a>
  </div>
</div>'''

content = open('catalog.html').read()
if 'karya-seo' in content:
    print('skip')
else:
    content = content.replace('</style>', css + '</style>', 1)
    content = content.replace('<div class="seri-grid"', seo + '\n<div class="seri-grid"', 1)
    open('catalog.html', 'w').write(content)
    print('ok catalog.html')
