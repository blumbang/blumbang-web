pages = {
    'sablon-klaten.html': [
        ('Sablon Solo', '/sablon-solo'),
        ('Sablon Jogja', '/sablon-jogja'),
        ('Sablon Banjarbaru', '/sablon-banjarbaru'),
    ],
    'sablon-solo.html': [
        ('Sablon Klaten', '/sablon-klaten'),
        ('Sablon Jogja', '/sablon-jogja'),
        ('Sablon Banjarbaru', '/sablon-banjarbaru'),
    ],
    'sablon-jogja.html': [
        ('Sablon Klaten', '/sablon-klaten'),
        ('Sablon Solo', '/sablon-solo'),
        ('Sablon Banjarbaru', '/sablon-banjarbaru'),
    ],
    'sablon-banjarbaru.html': [
        ('Sablon Klaten', '/sablon-klaten'),
        ('Sablon Solo', '/sablon-solo'),
        ('Sablon Jogja', '/sablon-jogja'),
    ],
}

css = '''
.kota-lain{padding:32px;border-bottom:1px solid #2a2a2a;}
.kota-lain-label{font-family:"Inter",sans-serif;font-size:.58rem;font-weight:700;letter-spacing:.35em;text-transform:uppercase;color:#888;margin-bottom:16px;}
.kota-lain-links{display:flex;flex-wrap:wrap;gap:10px;}
.kota-lain-links a{font-family:"Inter",sans-serif;font-size:.65rem;font-weight:600;letter-spacing:.12em;text-transform:uppercase;padding:8px 16px;border:1px solid #2a2a2a;color:#ddd;text-decoration:none;transition:all .2s;}
.kota-lain-links a:hover{border-color:#C9A84C;color:#C9A84C;}
'''

anchor = '<!-- INTERNAL LINKS -->'

for f, links in pages.items():
    content = open(f).read()
    if 'kota-lain' in content:
        print('skip ' + f)
        continue
    link_html = ''.join([f'<a href="{url}">{label} →</a>' for label, url in links])
    section = f'''<div class="kota-lain">
  <div class="kota-lain-label">Kami juga melayani</div>
  <div class="kota-lain-links">{link_html}</div>
</div>\n'''
    content = content.replace('</style>', css + '</style>', 1)
    content = content.replace(anchor, section + anchor, 1)
    open(f, 'w').write(content)
    print('ok ' + f)
