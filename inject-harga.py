files = ['sablon-klaten.html','sablon-solo.html','sablon-jogja.html','sablon-banjarbaru.html']
harga = '''<div class="harga-bar">
  <div class="harga-item">
    <div class="harga-num">Rp 65.000</div>
    <div class="harga-lbl">Mulai dari / pcs satuan</div>
  </div>
  <div class="harga-item">
    <div class="harga-num">Rp 60.000</div>
    <div class="harga-lbl">Mulai dari / pcs lusinan</div>
  </div>
  <div class="harga-item">
    <div class="harga-num">Gratis</div>
    <div class="harga-lbl">Konsultasi dan estimasi</div>
  </div>
  <div class="harga-item">
    <div class="harga-num">7-14</div>
    <div class="harga-lbl">Hari kerja produksi</div>
  </div>
</div>'''
css = '''
.harga-bar{display:grid;grid-template-columns:repeat(4,1fr);background:#141414;border-top:1px solid #2a2a2a;border-bottom:1px solid #2a2a2a;}
.harga-item{padding:20px 8px;text-align:center;border-right:1px solid #2a2a2a;}
.harga-item:last-child{border-right:none;}
.harga-num{font-family:"Bebas Neue",sans-serif;font-size:clamp(1.4rem,3vw,2rem);letter-spacing:.06em;color:#C9A84C;line-height:1;}
.harga-lbl{font-family:"Inter",sans-serif;font-size:.52rem;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:#888;margin-top:5px;}
@media(max-width:768px){.harga-bar{grid-template-columns:repeat(2,1fr);}.harga-item:nth-child(2){border-right:none;}.harga-item:nth-child(3){border-top:1px solid #2a2a2a;}.harga-item:nth-child(4){border-right:none;border-top:1px solid #2a2a2a;}}
'''
for f in files:
    content = open(f).read()
    if 'harga-bar' in content:
        print('skip ' + f)
        continue
    content = content.replace('</style>', css + '</style>', 1)
    content = content.replace('<!-- KENAPA BLUMBANG -->', harga + '\n<!-- KENAPA BLUMBANG -->', 1)
    open(f,'w').write(content)
    print('ok ' + f)
