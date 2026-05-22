#!/usr/bin/env python3
# inject-sparks-hof.py
# Inject stats static + Hall of Fame ke sparks.html
# Jalankan: python3 inject-sparks-hof.py

import urllib.request
import json
import re
import math
from datetime import datetime

SHEET_ID = '1J9SVJGQb7msPTEOpUgsJ2TWWvQ4TntIjrkHZ9nbKgbw'
KLATEN = (-7.749626, 110.670888)

CITY_COORDS = {
    'klaten': (-7.706, 110.61),
    'yogyakarta': (-7.797, 110.364),
    'jogja': (-7.803, 110.364),
    'jakarta': (-6.208, 106.845),
    'surakarta': (-7.566, 110.826),
    'solo': (-7.566, 110.826),
    'bandung': (-6.917, 107.608),
    'semarang': (-6.967, 110.424),
    'surabaya': (-7.246, 112.752),
    'bali': (-8.34, 115.092),
    'denpasar': (-8.65, 115.217),
    'tokyo': (35.689, 139.691),
    'victoria': (-4.62, 55.455),
    'ile au cerf': (-4.64, 55.508),
    'pontianak': (-0.02, 109.342),
    'samarinda': (-0.502, 117.136),
    'banjarmasin': (-3.317, 114.592),
    'kota banjarmasin': (-3.317, 114.592),
    'banjarbaru': (-3.442, 114.831),
    'kediri': (-7.816, 112.008),
    'sleman': (-7.717, 110.355),
    'boyolali': (-7.532, 110.599),
    'wonosobo': (-7.361, 109.905),
    'banyumas': (-7.513, 109.215),
    'sukoharjo': (-7.682, 110.839),
    'bulakamba': (-6.867, 108.988),
    'selogiri': (-7.783, 110.895),
    'kijang': (0.917, 104.633),
    'trucuk': (-7.713, 110.617),
    'berbak': (-1.4, 103.5),
}

def haversine(lat1, lng1, lat2, lng2):
    R = 6371
    dLat = math.radians(lat2 - lat1)
    dLng = math.radians(lng2 - lng1)
    a = math.sin(dLat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dLng/2)**2
    return round(R * 2 * math.atan2(math.sqrt(a), math.sqrt(1-a)))

def fetch_sheet(sheet_name):
    url = f'https://docs.google.com/spreadsheets/d/{SHEET_ID}/gviz/tq?tqx=out:json&sheet={sheet_name}'
    req = urllib.request.Request(url, headers={'User-Agent': 'blumbang.id/1.0'})
    with urllib.request.urlopen(req) as res:
        txt = res.read().decode('utf-8')
    m = re.search(r'google\.visualization\.Query\.setResponse\(([\s\S]*)\)', txt)
    if not m:
        return []
    data = json.loads(m.group(1))
    return data.get('table', {}).get('rows', [])

def val(cell):
    if not cell:
        return ''
    v = cell.get('v')
    return str(v).strip() if v is not None else ''

def bulan_tahun(ts_str):
    if not ts_str:
        return ''
    try:
        parts = ts_str.split(',')[0].strip().split('/')
        if len(parts) == 3:
            d = datetime(int(parts[2]), int(parts[1]), int(parts[0]))
            bulan = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'][d.month-1]
            return f'{bulan} {d.year}'
    except:
        pass
    return ts_str

def get_coord(city_str):
    key = city_str.split(',')[0].strip().lower()
    return CITY_COORDS.get(key)

def main():
    print('Fetching data...')
    spk_rows = [r for r in fetch_sheet('SPARKS') if val(r['c'][0])]
    gar_rows = [r for r in fetch_sheet('GARMENTS') if val(r['c'][0])]

    print(f'Data: {len(spk_rows)} scan, {len(gar_rows)} garment')

    # Garment names
    garment_names = {}
    for r in gar_rows:
        gid = val(r['c'][0])
        name = val(r['c'][1]) if len(r['c']) > 1 else ''
        if gid:
            garment_names[gid] = name or gid

    # Kota unik per garment
    garment_kota = {}
    garment_jarak = {}

    for r in spk_rows:
        gid = val(r['c'][0])
        city = val(r['c'][2])
        if not gid or not city:
            continue

        kota = city.split(',')[0].strip()

        if gid not in garment_kota:
            garment_kota[gid] = set()
        garment_kota[gid].add(kota.lower())

        # Jarak — dari kolom ke-10 kalau ada, fallback CITY_COORDS
        dist = 0
        if len(r['c']) > 10 and r['c'][10] and r['c'][10].get('v'):
            try:
                dist = float(r['c'][10]['v'])
            except:
                pass

        if not dist:
            coord = get_coord(city)
            if coord:
                dist = haversine(KLATEN[0], KLATEN[1], coord[0], coord[1])

        if dist > garment_jarak.get(gid, 0):
            garment_jarak[gid] = dist

    def make_display(gid):
        name = garment_names.get(gid, gid)
        m = re.search(r'-(\d+)$', gid)
        num = f' · #{m.group(1)}' if m else ''
        return name + num if name != gid else gid

    # Hall of Fame — top 5
    top_kota = sorted(garment_kota.items(), key=lambda x: len(x[1]), reverse=True)[:5]
    top_jarak = sorted(garment_jarak.items(), key=lambda x: x[1], reverse=True)[:5]

    # Generate HTML Hall of Fame
    def render_items_kota(items):
        html = ''
        for i, (gid, kota_set) in enumerate(items):
            rank_class = 'gold' if i == 0 else ''
            display = make_display(gid)
            html += f'''
    <div class="hof-item">
      <div class="hof-rank {rank_class}">#{i+1}</div>
      <a href="/id/{gid}" class="hof-name">{display}</a>
      <div class="hof-val">{len(kota_set)} kota</div>
    </div>'''
        return html

    def render_items_jarak(items):
        html = ''
        for i, (gid, dist) in enumerate(items):
            rank_class = 'gold' if i == 0 else ''
            display = make_display(gid)
            html += f'''
    <div class="hof-item">
      <div class="hof-rank {rank_class}">#{i+1}</div>
      <a href="/id/{gid}" class="hof-name">{display}</a>
      <div class="hof-val">{dist} km</div>
    </div>'''
        return html

    hof_html = f'''
<!-- HOF-START -->
<div class="hof-section">
  <div class="hof-title">HALL OF FAME</div>
  <div class="hof-sub">Kaos dengan perjalanan paling luar biasa</div>
  <div class="hof-grid">
    <div>
      <div class="hof-cat-title">✦ Paling Jauh dari Klaten</div>
      {render_items_jarak(top_jarak)}
    </div>
    <div>
      <div class="hof-cat-title">✦ Paling Banyak Kota</div>
      {render_items_kota(top_kota)}
    </div>
  </div>
  <div class="hof-updated">Diperbarui setiap pagi</div>
</div>
<!-- HOF-END -->'''

    # CSS Hall of Fame
    hof_css = '''
/* HOF */
.hof-section{padding:40px 24px;border-top:1px solid var(--border);background:var(--charcoal);}
.hof-title{font-family:var(--font-logo);font-size:1.6rem;letter-spacing:0.15em;color:var(--gold);margin-bottom:4px;}
.hof-sub{font-family:var(--font-ui);font-size:0.6rem;letter-spacing:0.25em;color:var(--dim);text-transform:uppercase;margin-bottom:32px;}
.hof-grid{display:grid;grid-template-columns:1fr 1fr;gap:32px;}
.hof-cat-title{font-family:var(--font-ui);font-size:0.6rem;font-weight:700;letter-spacing:0.25em;color:var(--gold);text-transform:uppercase;margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid var(--border);}
.hof-item{display:flex;align-items:baseline;gap:12px;padding:10px 0;border-bottom:1px solid rgba(42,42,42,0.5);}
.hof-rank{font-family:var(--font-logo);font-size:1.2rem;color:var(--gold-dim);letter-spacing:0.1em;min-width:24px;}
.hof-rank.gold{color:var(--gold);}
.hof-name{font-family:var(--font-ui);font-size:0.75rem;font-weight:500;color:var(--light);flex:1;text-decoration:none;}
.hof-name:hover{color:var(--gold);}
.hof-val{font-family:var(--font-logo);font-size:0.9rem;color:var(--gold);letter-spacing:0.08em;}
.hof-updated{font-family:var(--font-ui);font-size:0.58rem;letter-spacing:0.15em;color:var(--muted);text-align:right;margin-top:20px;}
@media(max-width:768px){.hof-section{padding:28px 20px;}.hof-grid{grid-template-columns:1fr;gap:24px;}}'''

    # Baca sparks.html
    with open('sparks.html', 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Inject CSS sebelum </style>
    if '/* HOF */' not in content:
        content = content.replace('</style>', hof_css + '\n</style>', 1)

    # 2. Inject/replace Hall of Fame setelah latest-section
    if '<!-- HOF-START -->' in content:
        # Replace existing
        content = re.sub(r'<!-- HOF-START -->[\s\S]*?<!-- HOF-END -->', hof_html.strip(), content)
    else:
        # Insert setelah latest-section closing div
        content = content.replace(
            '</div>\n\n</div>\n\n<footer>',
            f'</div>\n{hof_html}\n\n</div>\n\n<footer>'
        )

    # Tulis balik
    with open('sparks.html', 'w', encoding='utf-8') as f:
        f.write(content)

    print('✓ sparks.html diupdate dengan Hall of Fame')
    print(f'  Top jarak: {[gid for gid, _ in top_jarak]}')
    print(f'  Top kota: {[gid for gid, _ in top_kota]}')
    print('Done.')

if __name__ == '__main__':
    main()
