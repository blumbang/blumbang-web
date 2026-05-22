files = ['sablon-klaten.html','sablon-solo.html','sablon-jogja.html','sablon-banjarbaru.html']

css = '''
.foto-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:#2a2a2a;}
.foto-grid img{width:100%;aspect-ratio:1;object-fit:cover;display:block;filter:grayscale(20%);transition:filter .3s;}
.foto-grid img:hover{filter:grayscale(0%);}
@media(max-width:768px){.foto-grid{grid-template-columns:repeat(2,1fr);}}
'''

section = '''<section class="sec rv" id="foto-workshop">
  <div class="sec-head">
    <span class="sec-tag">Workshop & Hasil</span>
    <h2 class="sec-h2">DARI TANGAN<br>KAMI.</h2>
  </div>
  <div class="foto-grid">
    <img src="https://media.blumbang.id/1779158070223-nyablon.jpeg" alt="Proses sablon kaos di workshop Blumbang ID Klaten" loading="lazy">
    <img src="https://media.blumbang.id/1779005464990-insanak.webp" alt="Hasil kaos custom sablon Blumbang ID" loading="lazy">
    <img src="https://media.blumbang.id/1779005475094-paijo.webp" alt="Kaos custom konveksi Blumbang ID Klaten" loading="lazy">
    <img src="https://media.blumbang.id/1779006382911-dewastu.webp" alt="Kaos sablon plastisol Blumbang ID" loading="lazy">
  </div>
</section>
<!-- SOCIAL PROOF -->'''

anchor = '<!-- SOCIAL PROOF -->'

for f in files:
    content = open(f).read()
    if 'foto-workshop' in content:
        print('skip ' + f)
        continue
    content = content.replace('</style>', css + '</style>', 1)
    content = content.replace(anchor, section, 1)
    open(f, 'w').write(content)
    print('ok ' + f)
