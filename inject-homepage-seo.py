css = '''
.seo-section{padding:56px 32px;border-top:1px solid #2a2a2a;background:#141414;}
.seo-inner{max-width:900px;margin:0 auto;}
.seo-tag{font-family:"Inter",sans-serif;font-size:.62rem;font-weight:600;letter-spacing:.4em;text-transform:uppercase;color:#C9A84C;display:block;margin-bottom:14px;}
.seo-h2{font-family:"Bebas Neue",sans-serif;font-size:clamp(2rem,5vw,3.5rem);letter-spacing:.04em;line-height:.95;color:#F5F0E8;margin-bottom:24px;}
.seo-body{font-size:.88rem;line-height:1.85;color:#ddd;margin-bottom:20px;}
.seo-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:#2a2a2a;margin-top:32px;}
.seo-item{background:#141414;padding:28px 24px;}
.seo-item h3{font-family:"Bebas Neue",sans-serif;font-size:1.2rem;letter-spacing:.08em;color:#F5F0E8;margin-bottom:10px;}
.seo-item p{font-size:.78rem;line-height:1.7;color:#aaa;}
.seo-links{display:flex;flex-wrap:wrap;gap:10px;margin-top:32px;}
.seo-links a{font-family:"Inter",sans-serif;font-size:.62rem;font-weight:600;letter-spacing:.14em;text-transform:uppercase;padding:8px 16px;border:1px solid #2a2a2a;color:#ddd;text-decoration:none;transition:all .2s;}
.seo-links a:hover{border-color:#C9A84C;color:#C9A84C;}
@media(max-width:768px){.seo-section{padding:40px 20px;}.seo-grid{grid-template-columns:1fr;}}
'''

section = '''<!-- SEO STATIC CONTENT -->
<section class="seo-section">
  <div class="seo-inner">
    <span class="seo-tag">Konveksi & Sablon · Klaten</span>
    <h2 class="seo-h2">STUDIO KAOS INDEPENDEN<br>DARI JETO, KLATEN.</h2>
    <p class="seo-body">Blumbang ID adalah workshop sablon dan konveksi kaos custom yang berdiri sejak 2022 di Jeto, Gaden, Trucuk, Klaten, Jawa Tengah. Bukan agen, bukan reseller — produksi langsung di tempat, dikerjakan oleh tim yang sama sejak hari pertama.</p>
    <p class="seo-body">Kami mengerjakan sablon plastisol, DTF, dan rubber untuk komunitas, sekolah, event, dan brand independen. Melayani order dari Klaten, Solo, Jogja, Banjarbaru, hingga seluruh Indonesia. Setiap kaos dilengkapi QR unik yang mencatat perjalanan pemiliknya di peta dunia — Living Garment System.</p>
    <div class="seo-grid">
      <div class="seo-item">
        <h3>SABLON PLASTISOL</h3>
        <p>Tinta solid, warna tajam, tahan lama. Standar industri untuk kaos komunitas dan event skala menengah ke atas.</p>
      </div>
      <div class="seo-item">
        <h3>SABLON DTF</h3>
        <p>Direct to Film — ideal untuk desain penuh warna dan gradasi. Fleksibel untuk jumlah kecil tanpa minimum order ketat.</p>
      </div>
      <div class="seo-item">
        <h3>SABLON RUBBER</h3>
        <p>Hasil matte dan elastis, harga lebih terjangkau untuk order massal. Cocok untuk kaos berwarna gelap dengan desain solid.</p>
      </div>
    </div>
    <div class="seo-links">
      <a href="/sablon-klaten">Sablon Klaten</a>
      <a href="/sablon-solo">Sablon Solo</a>
      <a href="/sablon-jogja">Sablon Jogja</a>
      <a href="/sablon-banjarbaru">Sablon Banjarbaru</a>
      <a href="/karya">Lihat Koleksi</a>
      <a href="/about">Tentang Tim</a>
    </div>
  </div>
</section>
<!-- END SEO STATIC CONTENT -->

<!-- FOOTER -->'''

content = open('index.html').read()
if 'seo-section' in content:
    print('skip — sudah ada')
else:
    content = content.replace('</style>', css + '</style>', 1)
    content = content.replace('<!-- FOOTER -->', section, 1)
    open('index.html', 'w').write(content)
    print('ok index.html')
