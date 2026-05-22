old = """  const staticPages = [
    { loc: `${BASE_URL}/`,       lastmod: today, changefreq: 'weekly',  priority: '1.0' },
    { loc: `${BASE_URL}/karya`,  lastmod: today, changefreq: 'weekly',  priority: '0.9' },
    { loc: `${BASE_URL}/sparks`, lastmod: today, changefreq: 'daily',   priority: '0.9' },
    { loc: `${BASE_URL}/about`,  lastmod: today, changefreq: 'monthly', priority: '0.8' },
    { loc: `${BASE_URL}/blog`,   lastmod: today, changefreq: 'weekly',  priority: '0.8' },
    { loc: `${BASE_URL}/ria`,    lastmod: today, changefreq: 'monthly', priority: '0.5' },
  ];"""

new = """  const staticPages = [
    { loc: `${BASE_URL}/`,                      lastmod: today, changefreq: 'weekly',  priority: '1.0' },
    { loc: `${BASE_URL}/karya`,                 lastmod: today, changefreq: 'weekly',  priority: '0.9' },
    { loc: `${BASE_URL}/sparks`,                lastmod: today, changefreq: 'daily',   priority: '0.9' },
    { loc: `${BASE_URL}/about`,                 lastmod: today, changefreq: 'monthly', priority: '0.8' },
    { loc: `${BASE_URL}/blog`,                  lastmod: today, changefreq: 'weekly',  priority: '0.8' },
    { loc: `${BASE_URL}/ria`,                   lastmod: today, changefreq: 'monthly', priority: '0.5' },
    { loc: `${BASE_URL}/sablon-klaten`,         lastmod: today, changefreq: 'monthly', priority: '0.8' },
    { loc: `${BASE_URL}/sablon-solo`,           lastmod: today, changefreq: 'monthly', priority: '0.8' },
    { loc: `${BASE_URL}/sablon-jogja`,          lastmod: today, changefreq: 'monthly', priority: '0.8' },
    { loc: `${BASE_URL}/sablon-banjarbaru`,     lastmod: today, changefreq: 'monthly', priority: '0.8' },
    { loc: `${BASE_URL}/konveksi-klaten`,       lastmod: today, changefreq: 'monthly', priority: '0.8' },
    { loc: `${BASE_URL}/kaos-sekolah-klaten`,   lastmod: today, changefreq: 'monthly', priority: '0.8' },
    { loc: `${BASE_URL}/sablon-satuan-klaten`,  lastmod: today, changefreq: 'monthly', priority: '0.8' },
  ];"""

content = open('generate-posts.js').read()
if 'sablon-klaten' in content:
    print('skip — sudah ada')
else:
    content = content.replace(old, new, 1)
    open('generate-posts.js', 'w').write(content)
    print('ok generate-posts.js')
