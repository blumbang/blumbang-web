#!/usr/bin/env python3
"""
inject-seo.py
Inject SEO meta lengkap ke semua halaman Blumbang ID.
Jalankan dari root repo: python3 inject-seo.py
"""

import re

# ─── Data per halaman ───────────────────────────────────────────────────────
PAGES = {
    "index.html": {
        "title": "Blumbang · Independent T-Shirt Studio · Klaten",
        "description": "Blumbang ID — studio kaos independen dari Klaten. Setiap kaos punya QR unik yang mencatat perjalananmu di peta dunia. Made Slowly. Felt Deeply.",
        "og_title": "Blumbang ID · Independent T-Shirt Studio · Klaten",
        "og_description": "Setiap kaos punya QR unik yang mencatat perjalananmu di peta dunia. Made Slowly. Felt Deeply.",
        "og_url": "https://blumbang.id",
        "twitter_title": "Blumbang ID · Independent T-Shirt Studio · Klaten",
        "twitter_description": "Setiap kaos punya QR unik yang mencatat perjalananmu di peta dunia. Made Slowly. Felt Deeply.",
        "hreflang_url": "https://blumbang.id",
        "schema": """<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "ClothingStore",
  "name": "Blumbang ID",
  "alternateName": "Blumbang",
  "description": "Studio kaos independen dari Klaten. Sablon dan konveksi custom dengan QR unik pada setiap kaos.",
  "url": "https://blumbang.id",
  "logo": "https://blumbang.id/og-image.webp",
  "image": "https://blumbang.id/og-image.webp",
  "telephone": "+6281234561146",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Jeto, RT.32/RW.10, Gaden",
    "addressLocality": "Trucuk",
    "addressRegion": "Klaten",
    "postalCode": "57467",
    "addressCountry": "ID"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": -7.749665,
    "longitude": 110.670930
  },
  "hasMap": "https://maps.app.goo.gl/gpCP83F1789JmFgQA",
  "priceRange": "Rp",
  "currenciesAccepted": "IDR",
  "paymentAccepted": "Cash, Transfer Bank",
  "areaServed": ["Klaten", "Solo", "Yogyakarta", "Indonesia"],
  "foundingDate": "2022",
  "slogan": "INI BUKAN KAOS BIASA",
  "sameAs": [
    "https://www.instagram.com/blumbang.id",
    "https://www.tiktok.com/@blumbang.id",
    "https://www.threads.net/@blumbang.id",
    "https://wa.me/6281234561146",
    "https://maps.app.goo.gl/gpCP83F1789JmFgQA"
  ]
}
</script>"""
    },
    "about.html": {
        "title": "Tentang Blumbang ID · Tim & Filosofi · Klaten",
        "description": "Berdiri karena terpaksa. Bertahan karena bermanfaat. Kenali tim di balik Blumbang ID — workshop sablon dan konveksi dari Jeto, Klaten.",
        "og_title": "Tentang Blumbang ID · Tim & Filosofi",
        "og_description": "Berdiri karena terpaksa. Bertahan karena bermanfaat. Kenali tim di balik Blumbang ID.",
        "og_url": "https://blumbang.id/about",
        "twitter_title": "Tentang Blumbang ID · Tim & Filosofi",
        "twitter_description": "Berdiri karena terpaksa. Bertahan karena bermanfaat. Kenali tim di balik Blumbang ID.",
        "hreflang_url": "https://blumbang.id/about",
        "schema": None
    },
    "catalog.html": {
        "title": "Koleksi Kaos · Blumbang ID · Studio Kaos Klaten",
        "description": "Semua koleksi kaos Blumbang ID — dari kaos komunitas, kaos sekolah, hingga apparel custom. Setiap kaos punya QR perjalanan unik.",
        "og_title": "Koleksi Kaos · Blumbang ID",
        "og_description": "Semua koleksi kaos Blumbang ID. Setiap kaos punya QR perjalanan unik dari Klaten ke dunia.",
        "og_url": "https://blumbang.id/karya",
        "twitter_title": "Koleksi Kaos · Blumbang ID",
        "twitter_description": "Semua koleksi kaos Blumbang ID. Setiap kaos punya QR perjalanan unik.",
        "hreflang_url": "https://blumbang.id/karya",
        "schema": None
    },
    "sparks.html": {
        "title": "Peta Perjalanan Kaos · Blumbang ID · Living Garment",
        "description": "Lihat peta perjalanan kaos Blumbang ID — dari Klaten ke seluruh dunia. Setiap scan mencatat jejak pemilik kaos secara real-time.",
        "og_title": "Peta Perjalanan Kaos · Blumbang ID",
        "og_description": "Dari Klaten ke seluruh dunia. Setiap kaos Blumbang ID mencatat perjalanannya di peta dunia.",
        "og_url": "https://blumbang.id/sparks",
        "twitter_title": "Peta Perjalanan Kaos · Blumbang ID",
        "twitter_description": "Dari Klaten ke seluruh dunia. Setiap kaos Blumbang ID mencatat perjalanannya.",
        "hreflang_url": "https://blumbang.id/sparks",
        "schema": None
    },
    "sablon-klaten.html": {
        "title": "Sablon Klaten · Blumbang ID — Konveksi & Sablon Kaos Custom",
        "description": "Sablon kaos custom di Klaten. Workshop nyata di Jeto, Gaden, Trucuk sejak 2022. Plastisol, DTF, rubber. Rating Google 4.9★.",
        "og_title": "Sablon Klaten · Blumbang ID",
        "og_description": "Workshop sablon nyata di Klaten. Plastisol, DTF, rubber. Rating 4.9★. Setiap kaos punya QR unik.",
        "og_url": "https://blumbang.id/sablon-klaten",
        "twitter_title": "Sablon Klaten · Blumbang ID",
        "twitter_description": "Workshop sablon nyata di Klaten. Plastisol, DTF, rubber. Rating 4.9★.",
        "hreflang_url": "https://blumbang.id/sablon-klaten",
        "schema": None
    },
    "sablon-solo.html": {
        "title": "Sablon Solo · Blumbang ID — Konveksi & Sablon Kaos Custom",
        "description": "Sablon kaos custom untuk Solo dan Surakarta. Workshop di Klaten — 30 menit dari Solo. Plastisol, DTF, rubber. Pengiriman ke seluruh Indonesia.",
        "og_title": "Sablon Solo · Blumbang ID",
        "og_description": "Workshop sablon di Klaten, melayani Solo dan Surakarta. Plastisol, DTF, rubber.",
        "og_url": "https://blumbang.id/sablon-solo",
        "twitter_title": "Sablon Solo · Blumbang ID",
        "twitter_description": "Workshop sablon di Klaten, melayani Solo dan Surakarta.",
        "hreflang_url": "https://blumbang.id/sablon-solo",
        "schema": None
    },
    "sablon-jogja.html": {
        "title": "Sablon Jogja · Blumbang ID — Konveksi & Sablon Kaos Custom",
        "description": "Sablon kaos custom untuk Jogja dan Yogyakarta. Workshop di Klaten — 45 menit dari Jogja. Plastisol, DTF, rubber. Pengiriman ke seluruh Indonesia.",
        "og_title": "Sablon Jogja · Blumbang ID",
        "og_description": "Workshop sablon di Klaten, melayani Jogja dan Yogyakarta. Plastisol, DTF, rubber.",
        "og_url": "https://blumbang.id/sablon-jogja",
        "twitter_title": "Sablon Jogja · Blumbang ID",
        "twitter_description": "Workshop sablon di Klaten, melayani Jogja dan Yogyakarta.",
        "hreflang_url": "https://blumbang.id/sablon-jogja",
        "schema": None
    },
    "sablon-banjarbaru.html": {
        "title": "Sablon Banjarbaru · Blumbang ID — Dari Banjarbaru, Blumbang Dimulai",
        "description": "Sablon kaos custom untuk Banjarbaru dan Kalimantan Selatan. Dari RSB Banjarbaru ke workshop Klaten — pengiriman ke seluruh Kalimantan.",
        "og_title": "Sablon Banjarbaru · Blumbang ID",
        "og_description": "Dari Banjarbaru, Blumbang ID dimulai. Sablon kaos custom, pengiriman ke Kalimantan.",
        "og_url": "https://blumbang.id/sablon-banjarbaru",
        "twitter_title": "Sablon Banjarbaru · Blumbang ID",
        "twitter_description": "Dari Banjarbaru, Blumbang ID dimulai. Sablon kaos custom untuk Kalimantan.",
        "hreflang_url": "https://blumbang.id/sablon-banjarbaru",
        "schema": None
    },
}

# ─── Template meta yang akan diinject ───────────────────────────────────────
def build_meta(p):
    schema_block = f"\n{p['schema']}" if p.get("schema") else ""
    return f"""<meta property="og:locale" content="id_ID">
<meta property="og:image" content="https://blumbang.id/og-image.webp">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Blumbang ID — Studio Kaos Independen dari Klaten">
<meta property="og:image:type" content="image/webp">
<meta name="twitter:title" content="{p['twitter_title']}">
<meta name="twitter:description" content="{p['twitter_description']}">
<meta name="twitter:image" content="https://blumbang.id/og-image.webp">
<link rel="alternate" hreflang="id" href="{p['hreflang_url']}">
<link rel="alternate" hreflang="x-default" href="{p['hreflang_url']}">{schema_block}"""

# ─── Proses setiap file ──────────────────────────────────────────────────────
for filename, data in PAGES.items():
    try:
        with open(filename, "r", encoding="utf-8") as f:
            content = f.read()

        # 1. Ganti og:image jpg → webp jika masih pakai jpg
        content = content.replace(
            'content="https://blumbang.id/og-image.jpg"',
            'content="https://blumbang.id/og-image.webp"'
        )

        # 2. Hapus meta twitter:card yang lama (akan diganti)
        content = re.sub(r'\n?<meta name="twitter:card"[^>]*>', '', content)

        # 3. Hapus blok SEO yang sudah diinject sebelumnya (idempoten)
        content = re.sub(
            r'\n?<!-- SEO-INJECT-START -->.*?<!-- SEO-INJECT-END -->',
            '', content, flags=re.DOTALL
        )

        # 4. Inject setelah </title> atau setelah og:site_name
        inject_block = f'\n<!-- SEO-INJECT-START -->\n<meta name="twitter:card" content="summary_large_image">\n{build_meta(data)}\n<!-- SEO-INJECT-END -->'

        # Cari anchor inject: setelah og:site_name, kalau tidak ada setelah canonical
        if 'og:site_name' in content:
            content = re.sub(
                r'(<meta property="og:site_name"[^>]*>)',
                r'\1' + inject_block,
                content, count=1
            )
        elif 'rel="canonical"' in content:
            content = re.sub(
                r'(<link rel="canonical"[^>]*>)',
                r'\1' + inject_block,
                content, count=1
            )

        with open(filename, "w", encoding="utf-8") as f:
            f.write(content)

        print(f"✓ {filename}")

    except FileNotFoundError:
        print(f"✗ {filename} — tidak ditemukan, skip")
    except Exception as e:
        print(f"✗ {filename} — error: {e}")

print("\nSelesai.")
