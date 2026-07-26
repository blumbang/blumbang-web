// build-sparks.js
// Generate sparks/kota/[kota].html dan sparks/index.html
// PENTING: Tidak menyentuh sparks.html sama sekali
//
// RUMUS: seluruh logika hitung & pengelompokan kota diambil dari
// lib-stats.js — pemilik tunggal. Jangan menyalin ulang logikanya ke sini,
// karena itu yang dulu membuat homepage dan /sparks berbeda angkanya.

const fs = require('fs');
const path = require('path');
const {
  getCellVal: getVal,
  slugify,
  filterScanRows,
  filterGarmentRows,
  groupKota,
  hitungStatistik,
} = require('./lib-stats.js');

const SHEET_ID = '1J9SVJGQb7msPTEOpUgsJ2TWWvQ4TntIjrkHZ9nbKgbw';
const BASE_URL = 'https://blumbang.id';
const KLATEN = [110.6, -7.7];

// Pastikan folder ada
const SPARKS_DIR = path.join(__dirname, 'sparks');
const KOTA_DIR = path.join(SPARKS_DIR, 'kota');
if (!fs.existsSync(SPARKS_DIR)) fs.mkdirSync(SPARKS_DIR, { recursive: true });
if (!fs.existsSync(KOTA_DIR)) fs.mkdirSync(KOTA_DIR, { recursive: true });

// ═══════════════════════════════════════════════════════════════
// GEOCODING SERVER-SIDE — ditambahkan 26 Juli 2026.
//
// TUJUAN: menghilangkan geocoding Nominatim dari browser pengunjung.
// Sebelumnya sparks.html memanggil Nominatim satu-per-satu dengan jeda
// 1,1 detik PER PENGUNJUNG untuk tiap kota yang belum dikenal — bisa
// menambah beberapa detik loading, dan makin lambat kalau kota baru
// terus bertambah (persis situasi yang diantisipasi saat volume order
// naik menjelang Agustus 2026).
//
// SEKARANG: geocoding dilakukan SEKALI di sini, tiap build harian,
// untuk kota yang belum dikenal. Hasilnya disimpan di
// sparks/geo-cache.json. sparks.html cukup fetch file itu (statis,
// cepat, dari Cloudflare Pages) alih-alih memanggil Nominatim sendiri.
// Nominatim langsung dari browser tetap ada sebagai jaring pengaman
// PALING TERAKHIR, untuk kota yang baru saja masuk dan belum sempat
// ter-build semalam.
//
// CITY_COORDS di bawah ini adalah SALINAN PERSIS dari kamus yang sama
// di sparks.html (364 kota, diekstrak otomatis dari file asli, bukan
// diketik ulang). Ini lapis pertama — paling cepat, tidak perlu
// panggilan apa pun. Kalau kamus di sparks.html diperbarui manual,
// salinan ini perlu ikut diperbarui juga (lihat catatan di README kalau
// ada, atau tanya ke sesi yang menambahkannya).
const CITY_COORDS = {
  'abu dhabi': { lonlat: [54.367, 24.453], label: 'Abu Dhabi' },
  'accra': { lonlat: [-0.186, 5.556], label: 'Accra' },
  'addis ababa': { lonlat: [38.747, 8.996], label: 'Addis Ababa' },
  'adelaide': { lonlat: [138.6, -34.929], label: 'Adelaide' },
  'ahmedabad': { lonlat: [72.587, 23.023], label: 'Ahmedabad' },
  'ambon': { lonlat: [128.192, -3.695], label: 'Ambon' },
  'amman': { lonlat: [35.945, 31.963], label: 'Amman' },
  'amsterdam': { lonlat: [4.905, 52.37], label: 'Amsterdam' },
  'ankara': { lonlat: [32.859, 39.92], label: 'Ankara' },
  'athens': { lonlat: [23.728, 37.984], label: 'Athens' },
  'atlanta':{lonlat:[-84.388,33.749],label:'Atlanta'},
  'auckland':{lonlat:[174.763,-36.848],label:'Auckland'},
  'baghdad':{lonlat:[44.361,33.341],label:'Baghdad'},
  'balikpapan':{lonlat:[116.854,-1.268],label:'Balikpapan'},
  'banda aceh':{lonlat:[95.323,5.548],label:'Banda Aceh'},
  'bandar lampung':{lonlat:[105.261,-5.454],label:'Bandar Lampung'},
  'bandar seri begawan':{lonlat:[114.941,4.89],label:'Bandar Seri Begawan'},
  'bandung':{lonlat:[107.608,-6.917],label:'Bandung'},
  'bangalore':{lonlat:[77.594,12.972],label:'Bangalore'},
  'bangkalan':{lonlat:[112.73,-7.044],label:'Bangkalan'},
  'bangkok':{lonlat:[100.501,13.756],label:'Bangkok'},
  'banjar':{lonlat:[108.54,-7.368],label:'Banjar'},
  'bali':{lonlat:[115.092,-8.34],label:'Bali'},
  'bulakamba':{lonlat:[108.988,-6.867],label:'Bulakamba'},
  'kijang':{lonlat:[104.633,0.917],label:'Kijang'},
  'selogiri':{lonlat:[110.895,-7.783],label:'Selogiri'},
  'trucuk':{lonlat:[110.617,-7.713],label:'Trucuk'},
  'victoria, seychelles':{lonlat:[55.455,-4.62],label:'Victoria'},
  'kota banjarmasin':{lonlat:[114.592,-3.317],label:'Banjarmasin'},
  'banjarbaru':{lonlat:[114.831,-3.442],label:'Banjarbaru'},
  'banjarmasin':{lonlat:[114.592,-3.317],label:'Banjarmasin'},
  'banjarnegara':{lonlat:[109.693,-7.388],label:'Banjarnegara'},
  'bantul':{lonlat:[110.328,-7.888],label:'Bantul'},
  'banyumas':{lonlat:[109.215,-7.513],label:'Banyumas'},
  'banyuwangi':{lonlat:[114.37,-8.219],label:'Banyuwangi'},
  'barcelona':{lonlat:[2.154,41.389],label:'Barcelona'},
  'batam':{lonlat:[104.03,1.136],label:'Batam'},
  'batang':{lonlat:[109.729,-6.915],label:'Batang'},
  'batu':{lonlat:[122.516,-7.871],label:'Batu'},
  'bau-bau':{lonlat:[122.626,-5.467],label:'Bau-bau'},
  'beijing':{lonlat:[116.407,39.904],label:'Beijing'},
  'beirut':{lonlat:[35.502,33.889],label:'Beirut'},
  'bekasi':{lonlat:[107.017,-6.234],label:'Bekasi'},
  'bengkulu':{lonlat:[102.261,-3.8],label:'Bengkulu'},
  'berlin':{lonlat:[13.405,52.52],label:'Berlin'},
  'bima':{lonlat:[118.689,-8.458],label:'Bima'},
  'binjai':{lonlat:[98.485,3.6],label:'Binjai'},
  'bitung':{lonlat:[125.192,1.44],label:'Bitung'},
  'blitar':{lonlat:[112.168,-8.096],label:'Blitar'},
  'blora':{lonlat:[111.407,-6.962],label:'Blora'},
  'bogor':{lonlat:[106.8,-6.6],label:'Bogor'},
  'bogota':{lonlat:[-74.085,4.711],label:'Bogota'},
  'bojonegoro':{lonlat:[111.881,-7.151],label:'Bojonegoro'},
  'bondowoso':{lonlat:[113.823,-7.912],label:'Bondowoso'},
  'bontang':{lonlat:[117.5,0.132],label:'Bontang'},
  'boston':{lonlat:[-71.058,42.36],label:'Boston'},
  'boyolali':{lonlat:[110.593,-7.53],label:'Boyolali'},
  'brebes':{lonlat:[108.754,-6.873],label:'Brebes'},
  'brisbane':{lonlat:[153.028,-27.468],label:'Brisbane'},
  'brunei':{lonlat:[114.941,4.89],label:'Brunei'},
  'brussels':{lonlat:[4.352,50.85],label:'Brussels'},
  'bucharest':{lonlat:[26.097,44.44],label:'Bucharest'},
  'budapest':{lonlat:[19.04,47.498],label:'Budapest'},
  'buenos aires':{lonlat:[-58.382,-34.614],label:'Buenos Aires'},
  'bukit tinggi':{lonlat:[100.372,-0.308],label:'Bukit Tinggi'},
  'busan':{lonlat:[129.075,35.18],label:'Busan'},
  'cairo':{lonlat:[31.235,30.045],label:'Cairo'},
  'calgary':{lonlat:[-114.066,51.045],label:'Calgary'},
  'canberra':{lonlat:[149.128,-35.282],label:'Canberra'},
  'cape town':{lonlat:[18.424,-33.925],label:'Cape Town'},
  'caracas':{lonlat:[-66.914,10.48],label:'Caracas'},
  'casablanca':{lonlat:[-7.59,33.573],label:'Casablanca'},
  'cebu':{lonlat:[123.892,10.317],label:'Cebu'},
  'chengdu':{lonlat:[104.066,30.572],label:'Chengdu'},
  'chennai':{lonlat:[80.27,13.083],label:'Chennai'},
  'chiang mai':{lonlat:[98.993,18.788],label:'Chiang Mai'},
  'chiba':{lonlat:[140.116,35.605],label:'Chiba'},
  'chicago':{lonlat:[-87.63,41.878],label:'Chicago'},
  'chittagong':{lonlat:[91.832,22.335],label:'Chittagong'},
  'chongqing':{lonlat:[106.553,29.563],label:'Chongqing'},
  'christchurch':{lonlat:[172.637,-43.531],label:'Christchurch'},
  'ciamis':{lonlat:[108.349,-7.332],label:'Ciamis'},
  'cianjur':{lonlat:[107.139,-6.82],label:'Cianjur'},
  'cilacap':{lonlat:[108.83,-7.719],label:'Cilacap'},
  'cilegon':{lonlat:[106.052,-5.988],label:'Cilegon'},
  'cirebon':{lonlat:[108.552,-6.732],label:'Cirebon'},
  'colombo':{lonlat:[79.862,6.927],label:'Colombo'},
  'copenhagen':{lonlat:[12.568,55.676],label:'Copenhagen'},
  'da nang':{lonlat:[108.22,16.054],label:'Da Nang'},
  'dallas':{lonlat:[-96.797,32.781],label:'Dallas'},
  'dar es salaam':{lonlat:[39.289,-6.813],label:'Dar Es Salaam'},
  'davao':{lonlat:[125.613,7.073],label:'Davao'},
  'demak':{lonlat:[110.639,-6.894],label:'Demak'},
  'denpasar':{lonlat:[115.217,-8.65],label:'Denpasar'},
  'depok':{lonlat:[106.776,-6.385],label:'Depok'},
  'dhaka':{lonlat:[90.407,23.724],label:'Dhaka'},
  'dili':{lonlat:[125.575,-8.559],label:'Dili'},
  'doha':{lonlat:[51.531,25.286],label:'Doha'},
  'dubai':{lonlat:[55.296,25.276],label:'Dubai'},
  'dumai':{lonlat:[101.454,1.672],label:'Dumai'},
  'ende':{lonlat:[121.66,-8.843],label:'Ende'},
  'frankfurt':{lonlat:[8.682,50.111],label:'Frankfurt'},
  'fukuoka':{lonlat:[130.402,33.589],label:'Fukuoka'},
  'garut':{lonlat:[107.905,-7.22],label:'Garut'},
  'gianyar':{lonlat:[115.331,-8.538],label:'Gianyar'},
  'gold coast':{lonlat:[153.431,-28.002],label:'Gold Coast'},
  'gorontalo':{lonlat:[123.062,0.544],label:'Gorontalo'},
  'gresik':{lonlat:[112.655,-7.157],label:'Gresik'},
  'grobogan':{lonlat:[110.895,-7.042],label:'Grobogan'},
  'guadalajara':{lonlat:[-103.344,20.659],label:'Guadalajara'},
  'guangzhou':{lonlat:[113.264,23.129],label:'Guangzhou'},
  'gunungkidul':{lonlat:[110.614,-7.97],label:'Gunungkidul'},
  'gunungsitoli':{lonlat:[97.613,1.289],label:'Gunungsitoli'},
  'hamamatsu':{lonlat:[137.727,34.711],label:'Hamamatsu'},
  'hamburg':{lonlat:[9.993,53.551],label:'Hamburg'},
  'hanoi':{lonlat:[105.804,21.028],label:'Hanoi'},
  'helsinki':{lonlat:[24.941,60.17],label:'Helsinki'},
  'hiroshima':{lonlat:[132.46,34.385],label:'Hiroshima'},
  'ho chi minh':{lonlat:[106.66,10.823],label:'Ho Chi Minh'},
  'hong kong':{lonlat:[114.109,22.397],label:'Hong Kong'},
  'hongkong':{lonlat:[114.109,22.397],label:'Hongkong'},
  'houston':{lonlat:[-95.37,29.76],label:'Houston'},
  'hyderabad':{lonlat:[78.474,17.385],label:'Hyderabad'},
  'ile au cerf':{lonlat:[55.508,-4.64],label:'Ile Au Cerf'},
  'incheon':{lonlat:[126.705,37.456],label:'Incheon'},
  'indramayu':{lonlat:[108.316,-6.325],label:'Indramayu'},
  'ipoh':{lonlat:[101.083,4.597],label:'Ipoh'},
  'islamabad':{lonlat:[73.048,33.725],label:'Islamabad'},
  'istanbul':{lonlat:[28.979,41.015],label:'Istanbul'},
  'jakarta':{lonlat:[106.845,-6.208],label:'Jakarta'},
  'jakarta barat':{lonlat:[106.754,-6.168],label:'Jakarta Barat'},
  'jakarta pusat':{lonlat:[106.83,-6.186],label:'Jakarta Pusat'},
  'jakarta selatan':{lonlat:[106.814,-6.261],label:'Jakarta Selatan'},
  'jakarta timur':{lonlat:[106.9,-6.225],label:'Jakarta Timur'},
  'jakarta utara':{lonlat:[106.938,-6.121],label:'Jakarta Utara'},
  'jambi':{lonlat:[103.612,-1.61],label:'Jambi'},
  'jayapura':{lonlat:[140.717,-2.534],label:'Jayapura'},
  'jeddah':{lonlat:[39.192,21.543],label:'Jeddah'},
  'jember':{lonlat:[113.7,-8.172],label:'Jember'},
  'jepara':{lonlat:[110.668,-6.587],label:'Jepara'},
  'jogja':{lonlat:[110.364,-7.803],label:'Jogja'},
  'johannesburg':{lonlat:[28.045,-26.202],label:'Johannesburg'},
  'johor bahru':{lonlat:[103.758,1.492],label:'Johor Bahru'},
  'jombang':{lonlat:[112.23,-7.547],label:'Jombang'},
  'kagoshima':{lonlat:[130.558,31.56],label:'Kagoshima'},
  'kanazawa':{lonlat:[136.626,36.561],label:'Kanazawa'},
  'kandangan':{lonlat:[115.267,-2.78],label:'Kandangan'},
  'kaohsiung':{lonlat:[120.312,22.621],label:'Kaohsiung'},
  'karachi':{lonlat:[67.011,24.861],label:'Karachi'},
  'karanganyar':{lonlat:[111.024,-7.601],label:'Karanganyar'},
  'karawang':{lonlat:[107.302,-6.321],label:'Karawang'},
  'kathmandu':{lonlat:[85.314,27.717],label:'Kathmandu'},
  'kawasaki':{lonlat:[139.703,35.53],label:'Kawasaki'},
  'kebumen':{lonlat:[109.652,-7.668],label:'Kebumen'},
  'kediri':{lonlat:[112.008,-7.816],label:'Kediri'},
  'kendal':{lonlat:[110.196,-6.921],label:'Kendal'},
  'kendari':{lonlat:[122.515,-3.972],label:'Kendari'},
  'kiev':{lonlat:[30.523,50.45],label:'Kiev'},
  'kinshasa':{lonlat:[15.322,-4.324],label:'Kinshasa'},
  'kitakyushu':{lonlat:[130.842,33.883],label:'Kitakyushu'},
  'kl':{lonlat:[101.687,3.139],label:'Kl'},
  'klaten':{lonlat:[110.61,-7.706],label:'Klaten'},
  'kobe':{lonlat:[135.195,34.69],label:'Kobe'},
  'kolkata':{lonlat:[88.363,22.573],label:'Kolkata'},
  'kota kinabalu':{lonlat:[116.075,5.979],label:'Kota Kinabalu'},
  'kotabaru':{lonlat:[116.182,-3.297],label:'Kotabaru'},
  'kotamobagu':{lonlat:[124.317,0.728],label:'Kotamobagu'},
  'kuala lumpur':{lonlat:[101.687,3.139],label:'Kuala Lumpur'},
  'kuching':{lonlat:[110.33,1.55],label:'Kuching'},
  'kudus':{lonlat:[110.836,-6.805],label:'Kudus'},
  'kulonprogo':{lonlat:[110.155,-7.828],label:'Kulonprogo'},
  'kumamoto':{lonlat:[130.742,32.79],label:'Kumamoto'},
  'kuningan':{lonlat:[108.479,-6.976],label:'Kuningan'},
  'kupang':{lonlat:[123.607,-10.169],label:'Kupang'},
  'kuwait city':{lonlat:[47.978,29.375],label:'Kuwait City'},
  'kyiv':{lonlat:[30.523,50.45],label:'Kyiv'},
  'kyoto':{lonlat:[135.768,35.012],label:'Kyoto'},
  'lagos':{lonlat:[3.379,6.455],label:'Lagos'},
  'lahore':{lonlat:[74.344,31.549],label:'Lahore'},
  'lamongan':{lonlat:[112.413,-7.117],label:'Lamongan'},
  'langsa':{lonlat:[97.968,4.47],label:'Langsa'},
  'lebak':{lonlat:[106.25,-6.56],label:'Lebak'},
  'lhokseumawe':{lonlat:[97.14,5.181],label:'Lhokseumawe'},
  'lima':{lonlat:[-77.028,-12.046],label:'Lima'},
  'lisbon':{lonlat:[-9.139,38.722],label:'Lisbon'},
  'london':{lonlat:[-0.128,51.507],label:'London'},
  'los angeles':{lonlat:[-118.244,34.052],label:'Los Angeles'},
  'lubuklinggau':{lonlat:[102.861,-3.3],label:'Lubuklinggau'},
  'lumajang':{lonlat:[113.222,-8.131],label:'Lumajang'},
  'macau':{lonlat:[113.549,22.199],label:'Macau'},
  'madinah':{lonlat:[39.612,24.469],label:'Madinah'},
  'madiun':{lonlat:[111.524,-7.63],label:'Madiun'},
  'madrid':{lonlat:[-3.703,40.417],label:'Madrid'},
  'magelang':{lonlat:[110.217,-7.47],label:'Magelang'},
  'magetan':{lonlat:[111.343,-7.642],label:'Magetan'},
  'majalengka':{lonlat:[108.227,-6.836],label:'Majalengka'},
  'makassar':{lonlat:[119.419,-5.147],label:'Makassar'},
  'malang':{lonlat:[112.616,-7.983],label:'Malang'},
  'mamuju':{lonlat:[118.889,-2.681],label:'Mamuju'},
  'manado':{lonlat:[124.842,1.48],label:'Manado'},
  'manama':{lonlat:[50.586,26.215],label:'Manama'},
  'manila':{lonlat:[120.984,14.599],label:'Manila'},
  'manokwari':{lonlat:[134.062,-0.861],label:'Manokwari'},
  'mataram':{lonlat:[116.117,-8.583],label:'Mataram'},
  'matsuyama':{lonlat:[132.765,33.839],label:'Matsuyama'},
  'maumere':{lonlat:[122.212,-8.623],label:'Maumere'},
  'mecca':{lonlat:[39.826,21.423],label:'Mecca'},
  'medan':{lonlat:[98.679,3.595],label:'Medan'},
  'medina':{lonlat:[39.612,24.469],label:'Medina'},
  'mekkah':{lonlat:[39.826,21.423],label:'Mekkah'},
  'melbourne':{lonlat:[144.963,-37.814],label:'Melbourne'},
  'merauke':{lonlat:[140.362,-8.494],label:'Merauke'},
  'metro':{lonlat:[105.307,-5.113],label:'Metro'},
  'mexico city':{lonlat:[-99.133,19.433],label:'Mexico City'},
  'miami':{lonlat:[-80.192,25.775],label:'Miami'},
  'milan':{lonlat:[9.19,45.465],label:'Milan'},
  'mojokerto':{lonlat:[112.434,-7.471],label:'Mojokerto'},
  'montreal':{lonlat:[-73.554,45.509],label:'Montreal'},
  'moscow':{lonlat:[37.618,55.755],label:'Moscow'},
  'mumbai':{lonlat:[72.878,19.076],label:'Mumbai'},
  'munich':{lonlat:[11.582,48.135],label:'Munich'},
  'muscat':{lonlat:[58.405,23.614],label:'Muscat'},
  'nagasaki':{lonlat:[129.873,32.749],label:'Nagasaki'},
  'nagoya':{lonlat:[136.907,35.181],label:'Nagoya'},
  'naha':{lonlat:[127.681,26.212],label:'Naha'},
  'nairobi':{lonlat:[36.817,-1.286],label:'Nairobi'},
  'naypyidaw':{lonlat:[96.129,19.745],label:'Naypyidaw'},
  'new delhi':{lonlat:[77.209,28.614],label:'New Delhi'},
  'new york':{lonlat:[-74.006,40.713],label:'New York'},
  'newcastle':{lonlat:[151.776,-32.927],label:'Newcastle'},
  'nganjuk':{lonlat:[111.905,-7.605],label:'Nganjuk'},
  'ngawi':{lonlat:[111.451,-7.408],label:'Ngawi'},
  'niigata':{lonlat:[139.044,37.916],label:'Niigata'},
  'nunukan':{lonlat:[117.666,4.136],label:'Nunukan'},
  'okayama':{lonlat:[133.935,34.662],label:'Okayama'},
  'osaka':{lonlat:[135.502,34.694],label:'Osaka'},
  'oslo':{lonlat:[10.752,59.914],label:'Oslo'},
  'pacitan':{lonlat:[111.099,-8.198],label:'Pacitan'},
  'padang':{lonlat:[100.354,-0.947],label:'Padang'},
  'padang panjang':{lonlat:[100.408,-0.455],label:'Padang Panjang'},
  'padang sidempuan':{lonlat:[99.27,1.379],label:'Padang Sidempuan'},
  'pagar alam':{lonlat:[103.264,-4.025],label:'Pagar Alam'},
  'palangka raya':{lonlat:[113.921,-2.208],label:'Palangka Raya'},
  'palembang':{lonlat:[104.745,-2.916],label:'Palembang'},
  'palopo':{lonlat:[120.198,-3.004],label:'Palopo'},
  'palu':{lonlat:[119.872,-0.9],label:'Palu'},
  'pamekasan':{lonlat:[113.47,-7.157],label:'Pamekasan'},
  'pandeglang':{lonlat:[106.108,-6.298],label:'Pandeglang'},
  'pangandaran':{lonlat:[108.65,-7.69],label:'Pangandaran'},
  'pangkalpinang':{lonlat:[106.118,-2.131],label:'Pangkalpinang'},
  'parepare':{lonlat:[119.623,-4.014],label:'Parepare'},
  'paris':{lonlat:[2.349,48.864],label:'Paris'},
  'pasuruan':{lonlat:[112.907,-7.644],label:'Pasuruan'},
  'pati':{lonlat:[111.035,-6.748],label:'Pati'},
  'payakumbuh':{lonlat:[100.625,-0.22],label:'Payakumbuh'},
  'pekalongan':{lonlat:[109.675,-6.889],label:'Pekalongan'},
  'pekanbaru':{lonlat:[101.447,0.507],label:'Pekanbaru'},
  'pemalang':{lonlat:[109.378,-6.889],label:'Pemalang'},
  'pematang siantar':{lonlat:[99.069,2.958],label:'Pematang Siantar'},
  'penang':{lonlat:[100.33,5.414],label:'Penang'},
  'perth':{lonlat:[115.861,-31.953],label:'Perth'},
  'philadelphia':{lonlat:[-75.165,39.952],label:'Philadelphia'},
  'phnom penh':{lonlat:[104.916,11.562],label:'Phnom Penh'},
  'phoenix':{lonlat:[-112.074,33.448],label:'Phoenix'},
  'phuket':{lonlat:[98.392,7.879],label:'Phuket'},
  'ponorogo':{lonlat:[111.463,-7.866],label:'Ponorogo'},
  'pontianak':{lonlat:[109.332,-0.022],label:'Pontianak'},
  'prabumulih':{lonlat:[104.236,-3.432],label:'Prabumulih'},
  'prague':{lonlat:[14.421,50.088],label:'Prague'},
  'probolinggo':{lonlat:[113.215,-7.755],label:'Probolinggo'},
  'pune':{lonlat:[73.857,18.521],label:'Pune'},
  'purbalingga':{lonlat:[109.362,-7.389],label:'Purbalingga'},
  'purwakarta':{lonlat:[107.444,-6.552],label:'Purwakarta'},
  'purworejo':{lonlat:[110.018,-7.714],label:'Purworejo'},
  'rembang':{lonlat:[111.34,-6.708],label:'Rembang'},
  'rio de janeiro':{lonlat:[-43.172,-22.909],label:'Rio De Janeiro'},
  'riyadh':{lonlat:[46.675,24.687],label:'Riyadh'},
  'rome':{lonlat:[12.496,41.903],label:'Rome'},
  'sabang':{lonlat:[95.321,5.893],label:'Sabang'},
  'sagamihara':{lonlat:[139.397,35.573],label:'Sagamihara'},
  'saint petersburg':{lonlat:[30.316,59.939],label:'Saint Petersburg'},
  'saitama':{lonlat:[139.649,35.861],label:'Saitama'},
  'sakai':{lonlat:[135.553,34.573],label:'Sakai'},
  'salatiga':{lonlat:[110.501,-7.331],label:'Salatiga'},
  'samarinda':{lonlat:[117.136,-0.502],label:'Samarinda'},
  'sampang':{lonlat:[113.249,-7.197],label:'Sampang'},
  'sampit':{lonlat:[112.953,-2.535],label:'Sampit'},
  'san antonio':{lonlat:[-98.494,29.424],label:'San Antonio'},
  'san diego':{lonlat:[-117.157,32.716],label:'San Diego'},
  'san francisco':{lonlat:[-122.419,37.775],label:'San Francisco'},
  'san jose':{lonlat:[-121.886,37.339],label:'San Jose'},
  'santiago':{lonlat:[-70.667,-33.457],label:'Santiago'},
  'sao paulo':{lonlat:[-46.633,-23.55],label:'Sao Paulo'},
  'sapporo':{lonlat:[141.354,43.061],label:'Sapporo'},
  'sawahlunto':{lonlat:[100.776,-0.682],label:'Sawahlunto'},
  'seattle':{lonlat:[-122.333,47.607],label:'Seattle'},
  'semarang':{lonlat:[110.438,-6.967],label:'Semarang'},
  'sendai':{lonlat:[140.882,38.268],label:'Sendai'},
  'seoul':{lonlat:[126.978,37.566],label:'Seoul'},
  'serang':{lonlat:[106.152,-6.11],label:'Serang'},
  'shanghai':{lonlat:[121.474,31.23],label:'Shanghai'},
  'sharjah':{lonlat:[55.382,25.357],label:'Sharjah'},
  'shenzhen':{lonlat:[114.058,22.543],label:'Shenzhen'},
  'shizuoka':{lonlat:[138.383,34.977],label:'Shizuoka'},
  'sibolga':{lonlat:[98.779,1.742],label:'Sibolga'},
  'sidoarjo':{lonlat:[112.718,-7.447],label:'Sidoarjo'},
  'singapore':{lonlat:[103.82,1.352],label:'Singapore'},
  'singapura':{lonlat:[103.82,1.352],label:'Singapura'},
  'singaraja':{lonlat:[115.088,-8.112],label:'Singaraja'},
  'singkawang':{lonlat:[108.995,0.908],label:'Singkawang'},
  'situbondo':{lonlat:[114.003,-7.706],label:'Situbondo'},
  'sleman':{lonlat:[110.354,-7.716],label:'Sleman'},
  'solo':{lonlat:[110.831,-7.576],label:'Solo'},
  'solok':{lonlat:[100.654,-0.789],label:'Solok'},
  'sorong':{lonlat:[131.255,-0.876],label:'Sorong'},
  'sragen':{lonlat:[111.027,-7.424],label:'Sragen'},
  'stockholm':{lonlat:[18.068,59.33],label:'Stockholm'},
  'subang':{lonlat:[107.758,-6.57],label:'Subang'},
  'sukabumi':{lonlat:[106.93,-6.92],label:'Sukabumi'},
  'sukoharjo':{lonlat:[110.838,-7.686],label:'Sukoharjo'},
  'sumedang':{lonlat:[107.921,-6.854],label:'Sumedang'},
  'sumenep':{lonlat:[113.862,-6.99],label:'Sumenep'},
  'sungai penuh':{lonlat:[101.397,-2.06],label:'Sungai Penuh'},
  'surabaya':{lonlat:[112.752,-7.257],label:'Surabaya'},
  'surakarta':{lonlat:[110.831,-7.576],label:'Surakarta'},
  'sydney':{lonlat:[151.209,-33.869],label:'Sydney'},
  'tabanan':{lonlat:[115.124,-8.541],label:'Tabanan'},
  'taipei':{lonlat:[121.565,25.033],label:'Taipei'},
  'tangerang':{lonlat:[106.64,-6.178],label:'Tangerang'},
  'tangerang selatan':{lonlat:[106.744,-6.289],label:'Tangerang Selatan'},
  'tanjung balai':{lonlat:[99.801,2.966],label:'Tanjung Balai'},
  'tanjung selor':{lonlat:[117.374,2.841],label:'Tanjung Selor'},
  'tanjungpinang':{lonlat:[104.444,0.918],label:'Tanjungpinang'},
  'tarakan':{lonlat:[117.637,3.3],label:'Tarakan'},
  'tasikmalaya':{lonlat:[108.22,-7.327],label:'Tasikmalaya'},
  'tebing tinggi':{lonlat:[99.162,3.328],label:'Tebing Tinggi'},
  'tegal':{lonlat:[109.126,-6.869],label:'Tegal'},
  'tehran':{lonlat:[51.388,35.69],label:'Tehran'},
  'tel aviv':{lonlat:[34.781,32.085],label:'Tel Aviv'},
  'temanggung':{lonlat:[110.18,-7.317],label:'Temanggung'},
  'ternate':{lonlat:[127.38,0.78],label:'Ternate'},
  'tianjin':{lonlat:[117.19,39.125],label:'Tianjin'},
  'timika':{lonlat:[136.887,-4.528],label:'Timika'},
  'tokyo':{lonlat:[139.692,35.689],label:'Tokyo'},
  'tomohon':{lonlat:[124.833,1.33],label:'Tomohon'},
  'toronto':{lonlat:[-79.383,43.653],label:'Toronto'},
  'trenggalek':{lonlat:[111.708,-8.047],label:'Trenggalek'},
  'tuban':{lonlat:[111.905,-6.9],label:'Tuban'},
  'tulungagung':{lonlat:[111.903,-8.065],label:'Tulungagung'},
  'ulaanbaatar':{lonlat:[106.921,47.887],label:'Ulaanbaatar'},
  'vancouver':{lonlat:[-123.121,49.283],label:'Vancouver'},
  'vienna':{lonlat:[16.373,48.209],label:'Vienna'},
  'vientiane':{lonlat:[102.6,17.967],label:'Vientiane'},
  'warsaw':{lonlat:[21.012,52.23],label:'Warsaw'},
  'washington':{lonlat:[-77.037,38.907],label:'Washington'},
  'wellington':{lonlat:[174.776,-41.286],label:'Wellington'},
  'wonogiri':{lonlat:[110.923,-7.813],label:'Wonogiri'},
  'wonosobo':{lonlat:[109.905,-7.361],label:'Wonosobo'},
  'wuhan':{lonlat:[114.305,30.593],label:'Wuhan'},
  'xian':{lonlat:[108.94,34.342],label:'Xian'},
  'yangon':{lonlat:[96.157,16.805],label:'Yangon'},
  'yogyakarta':{lonlat:[110.364,-7.803],label:'Yogyakarta'},
  'yokohama':{lonlat:[139.638,35.444],label:'Yokohama'},
  'zurich':{lonlat:[8.541,47.376],label:'Zurich'}
};

const GEO_CACHE_PATH = path.join(SPARKS_DIR, 'geo-cache.json');

function bacaGeoCache() {
  if (!fs.existsSync(GEO_CACHE_PATH)) return {};
  try {
    return JSON.parse(fs.readFileSync(GEO_CACHE_PATH, 'utf-8'));
  } catch (e) {
    console.log(`[geocode] geo-cache.json rusak (${e.message}) — mulai dari cache kosong.`);
    return {};
  }
}

function getCityCoordServer(cityStr) {
  if (!cityStr) return null;
  const lower = cityStr.toLowerCase();
  const keys = Object.keys(CITY_COORDS).sort((a, b) => b.length - a.length);
  for (const key of keys) {
    if (lower.includes(key)) return CITY_COORDS[key];
  }
  return null;
}

// Geocode satu kota lewat Nominatim. Dipanggil HANYA untuk kota yang
// tidak ada di CITY_COORDS maupun geo-cache.json.
async function geocodeCityServer(cityStr) {
  const query = cityStr.split(',')[0].trim();
  const url = 'https://nominatim.openstreetmap.org/search?q=' + encodeURIComponent(query) + '&format=json&limit=1&accept-language=en';
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'blumbang.id-build/1.0 (github actions, contact via blumbang.id)' } });
    const data = await res.json();
    if (data && data[0]) {
      const lon = parseFloat(data[0].lon);
      const lat = parseFloat(data[0].lat);
      const label = data[0].display_name.split(',')[0].trim();
      return { lonlat: [lon, lat], label };
    }
  } catch (e) {
    console.log(`[geocode] gagal geocode "${cityStr}": ${e.message}`);
  }
  return null;
}

// Pastikan semua kota di kotaMap punya koordinat: cek CITY_COORDS dulu,
// lalu geo-cache.json, baru panggil Nominatim untuk yang benar-benar baru.
// Menulis ulang geo-cache.json HANYA kalau ada entri baru yang ditambahkan.
async function pastikanGeoCache(kotaMap) {
  const cache = bacaGeoCache();
  let adaBaru = false;
  let dipanggilNominatim = 0;

  for (const data of Object.values(kotaMap)) {
    if (data.slug === 'klaten') continue;
    const nama = data.nama;
    const cacheKey = nama.toLowerCase().trim();

    if (getCityCoordServer(nama)) continue;         // lapis 1: sudah di kamus tetap
    if (cache[cacheKey] !== undefined) continue;      // lapis 2: sudah di cache

    // lapis 3: belum dikenal sama sekali — geocode sekarang
    const coord = await geocodeCityServer(nama);
    cache[cacheKey] = coord; // simpan meski null, supaya tidak dicoba ulang tiap malam
    adaBaru = true;
    dipanggilNominatim++;
    console.log(`[geocode] "${nama}" -> ${coord ? coord.label + ' ' + JSON.stringify(coord.lonlat) : 'TIDAK DITEMUKAN'}`);

    // Hormati rate limit Nominatim: 1 request/detik
    await new Promise(r => setTimeout(r, 1100));
  }

  if (adaBaru) {
    fs.writeFileSync(GEO_CACHE_PATH, JSON.stringify(cache, null, 2));
    console.log(`[geocode] geo-cache.json diperbarui — ${dipanggilNominatim} kota baru di-geocode.`);
  } else {
    console.log('[geocode] Tidak ada kota baru — geo-cache.json tidak disentuh.');
  }
}
// ═══════════════════════════════════════════════════════════════

function formatTanggal(str) {
  if (!str) return '';
  try {
    // Format: "10/3/2026, 12.10.58" → parse manual
    const bagian = str.split(',')[0].trim(); // "10/3/2026"
    const parts = bagian.split('/');
    if (parts.length === 3) {
      const d = new Date(parts[2], parts[1]-1, parts[0]);
      return d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    }
    return str;
  } catch(e) { return str; }
}

async function fetchSheet(sheetName) {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${sheetName}&_cb=${Date.now()}`;
  const res = await fetch(url, { cache: 'no-store' });
  const text = await res.text();
  const match = text.match(/setResponse\((.*)\)/s);
  if (!match) return [];
  const data = JSON.parse(match[1]);
  return data.table.rows || [];
}

// getVal diimpor dari lib-stats.js sebagai getCellVal (lihat require di atas).
// Perilakunya sengaja dipertahankan persis seperti versi lokal yang lama.

function navHTML(activePage = '') {
  return `<nav>
  <a href="/" class="nav-brand">BLUMB✦NG ID</a>
  <div class="nav-links">
    <a href="/karya"${activePage === 'karya' ? ' class="active"' : ''}>Karya</a>
    <a href="/sparks"${activePage === 'sparks' ? ' class="active"' : ''}>Perjalanan</a>
    <a href="/about"${activePage === 'about' ? ' class="active"' : ''}>Tentang</a>
  </div>
  <a href="https://wa.me/6281234561146" class="nav-order">✦ ORDER</a>
  <button class="nav-hamburger" onclick="document.getElementById('nav-mob').classList.toggle('open');this.textContent=document.getElementById('nav-mob').classList.contains('open')?'✕':'☰'" id="nav-ham">☰</button>
</nav>
<div class="nav-mobile" id="nav-mob">
  <a href="/karya">Karya</a>
  <a href="/sparks">Perjalanan</a>
  <a href="/about">Tentang</a>
  <a href="https://wa.me/6281234561146" class="mobile-order">✦ ORDER SEKARANG</a>
</div>`;
}

function baseCSS() {
  return `<style>
:root{--black:#080808;--charcoal:#141414;--grey:#1e1e1e;--border:#2a2a2a;--muted:#666;--dim:#888;--light:#ccc;--white:#F5F0E8;--gold:#C9A84C;--gold-dim:#7a6028;--font-logo:'Bebas Neue',sans-serif;--font-body:'Montserrat',sans-serif;--font-ui:'Inter',sans-serif;}
*,*::before,*::after{margin:0;padding:0;box-sizing:border-box;}
body{background:var(--black);color:var(--white);font-family:var(--font-body);min-height:100vh;}
a{text-decoration:none;color:inherit;}
nav{position:fixed;top:0;left:0;right:0;z-index:100;display:flex;align-items:center;justify-content:space-between;padding:18px 40px;background:rgba(8,8,8,0.98);border-bottom:1px solid var(--border);}
.nav-brand{font-family:var(--font-logo);font-size:1.6rem;letter-spacing:0.15em;color:var(--gold);}
.nav-links{display:flex;gap:32px;}
.nav-links a{font-family:var(--font-ui);font-size:0.75rem;font-weight:500;letter-spacing:0.12em;color:var(--light);transition:color 0.2s;text-transform:uppercase;}
.nav-links a:hover,.nav-links a.active{color:var(--gold);}
.nav-order{font-family:var(--font-ui);font-size:0.72rem;font-weight:700;letter-spacing:0.2em;color:var(--black);background:var(--gold);padding:9px 20px;text-transform:uppercase;}
.nav-order:hover{background:var(--white);}
.nav-hamburger{display:none;background:none;border:none;color:var(--gold);font-size:1.4rem;cursor:pointer;}
.nav-mobile{display:none;position:fixed;top:64px;left:0;right:0;background:var(--charcoal);border-bottom:1px solid var(--border);z-index:99;flex-direction:column;padding:20px;}
.nav-mobile.open{display:flex;}
.nav-mobile a{font-family:var(--font-ui);font-size:0.85rem;font-weight:500;letter-spacing:0.12em;color:var(--light);padding:12px 0;border-bottom:1px solid var(--border);text-transform:uppercase;}
.nav-mobile a:last-child{border-bottom:none;}
.mobile-order{color:var(--gold)!important;font-weight:700!important;}
footer{border-top:1px solid var(--border);padding:28px 40px;display:flex;align-items:center;justify-content:space-between;margin-top:60px;}
.footer-brand{font-family:var(--font-logo);font-size:1.2rem;letter-spacing:0.15em;color:var(--gold-dim);}
.footer-link{font-family:var(--font-ui);font-size:0.68rem;color:var(--muted);letter-spacing:0.1em;}
.footer-link:hover{color:var(--gold);}
@media(max-width:768px){nav{padding:14px 18px;}.nav-links,.nav-order{display:none;}.nav-hamburger{display:block;}footer{padding:20px 18px;flex-direction:column;gap:12px;}}
</style>`;
}

function generateKotaHTML(kota, slug, scans, garmentMap) {
  // Scan pertama di kota ini
  const pertama = scans[0];
  const pertamaId = pertama ? getVal(pertama.c[0]) : '';
  const pertamaTanggal = pertama ? formatTanggal(getVal(pertama.c[6])) : '';
  const pertamaNama = pertamaId && garmentMap[pertamaId] ? garmentMap[pertamaId] : pertamaId;

  // Hitung kaos unik
  const kaosUnik = [...new Set(scans.map(r => getVal(r.c[0])).filter(Boolean))];

  // List kaos unik — satu kaos satu baris, tanpa duplikat
  const kaosUnikMap = {};
  scans.forEach(r => {
    const id = getVal(r.c[0]);
    const ts = getVal(r.c[6]);
    if(!id) return;
    if(!kaosUnikMap[id] || ts > kaosUnikMap[id].ts) {
      kaosUnikMap[id] = { id, ts, nama: garmentMap[id] || id };
    }
  });
  const scanList = Object.values(kaosUnikMap).sort((a,b) => b.ts.localeCompare(a.ts)).map(r => {
    return `<a href="/id/${encodeURIComponent(r.id)}" class="scan-item">
      <div class="scan-id">${r.id}</div>
      <div class="scan-nama">${r.nama}</div>
      <div class="scan-ts">${r.ts.split(',')[0]}</div>
    </a>`;
  }).join('');

  const canonical = `${BASE_URL}/sparks/kota/${slug}`;
  const namaPembawa = pertamaNama || pertamaId || 'seseorang';
  const metaDesc = kaosUnik.length === 1
    ? `Satu kaos Blumbang ID Klaten sudah menyimpan jejaknya di ${kota} — dibawa pertama kali oleh ${namaPembawa}. Setiap yang sampai di sini punya cerita sendiri.`
    : `${kaosUnik.length} kaos Blumbang ID Klaten sudah menyimpan jejaknya di ${kota}. Yang pertama dibawa oleh ${namaPembawa}, ${pertamaTanggal || 'beberapa waktu lalu'}.`;

  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Sablon Kaos Sampai ${kota} · Peta Perjalanan Blumbang ID</title>
<meta name="description" content="${metaDesc}">
<meta property="og:title" content="Sablon Kaos Sampai ${kota} · Peta Perjalanan Blumbang ID">
<meta property="og:description" content="${metaDesc}">
<meta property="og:type" content="website">
<link rel="canonical" href="${canonical}">
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "ItemList",
  "name": "Kaos Blumbang ID yang sampai ke ${kota}",
  "description": "${metaDesc.replace(/"/g, '\\"')}",
  "numberOfItems": ${kaosUnik.length},
  "itemListElement": [
    ${Object.values(kaosUnikMap).map((r, i) => `{
      "@type": "ListItem",
      "position": ${i + 1},
      "name": "${(r.nama || r.id).replace(/"/g, '\\"')}",
      "url": "${BASE_URL}/id/${encodeURIComponent(r.id)}"
    }`).join(',\n    ')}
  ]
}
</script>
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Place",
  "name": "${kota}",
  "description": "${metaDesc.replace(/"/g, '\\"')}"
}
</script>
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Montserrat:wght@300;400;600&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
${baseCSS()}
<style>
.hero{padding:100px 40px 48px;border-bottom:1px solid var(--border);}
.hero-inner{max-width:900px;margin:0 auto;}
.hero-eyebrow{font-family:var(--font-ui);font-size:.6rem;font-weight:700;letter-spacing:.4em;color:var(--gold);text-transform:uppercase;margin-bottom:12px;}
.hero-kota{font-family:var(--font-logo);font-size:clamp(3rem,10vw,7rem);letter-spacing:.06em;line-height:.95;color:var(--white);margin-bottom:24px;}
.hero-kota-sub{font-family:var(--font-ui);font-size:.75rem;letter-spacing:.15em;text-transform:uppercase;color:var(--dim);margin-top:-16px;margin-bottom:24px;}
.tanda-tangan{background:var(--charcoal);border:1px solid var(--border);border-left:3px solid var(--gold);padding:20px 24px;margin-bottom:32px;}
.tt-label{font-family:var(--font-ui);font-size:.6rem;font-weight:700;letter-spacing:.3em;color:var(--gold);text-transform:uppercase;margin-bottom:8px;}
.tt-teks{font-family:var(--font-ui);font-size:.85rem;color:var(--light);line-height:1.6;}
.tt-teks strong{color:var(--white);}
.stats-row{display:flex;gap:32px;flex-wrap:wrap;}
.stat-box{text-align:center;}
.stat-num{font-family:var(--font-logo);font-size:2rem;letter-spacing:.1em;color:var(--gold);}
.stat-lbl{font-family:var(--font-ui);font-size:.6rem;letter-spacing:.2em;color:var(--muted);text-transform:uppercase;}
.section{max-width:900px;margin:0 auto;padding:48px 40px;}
.section-title{font-family:var(--font-logo);font-size:1.2rem;letter-spacing:.15em;color:var(--white);margin-bottom:24px;padding-bottom:12px;border-bottom:1px solid var(--border);}
.scan-item{display:grid;grid-template-columns:1fr 2fr auto;gap:12px;align-items:center;padding:14px 0;border-bottom:1px solid var(--border);color:inherit;}
.scan-item:hover{background:var(--charcoal);padding-left:8px;margin:0 -8px;}
.scan-id{font-family:var(--font-logo);font-size:.9rem;letter-spacing:.1em;color:var(--gold);}
.scan-nama{font-family:var(--font-ui);font-size:.75rem;color:var(--light);}
.scan-ts{font-family:var(--font-ui);font-size:.65rem;color:var(--muted);}
.back-link{display:inline-flex;align-items:center;gap:8px;font-family:var(--font-ui);font-size:.65rem;font-weight:600;letter-spacing:.15em;text-transform:uppercase;color:var(--dim);margin-bottom:32px;transition:color .2s;}
.back-link:hover{color:var(--gold);}
@media(max-width:768px){.hero{padding:80px 20px 32px;}.section{padding:32px 20px;}.stats-row{gap:20px;}}
</style>
</head>
<body>
${navHTML('sparks')}
<div class="hero">
  <div class="hero-inner">
    <a href="/sparks" class="back-link">← Peta Perjalanan</a>
    <div class="hero-eyebrow">✦ Peta Perjalanan · Blumbang ID</div>
    <h1 class="hero-kota">${kota}</h1>
    <p class="hero-kota-sub">Blumbang ID · Sablon Klaten · Living Garment</p>
    ${pertamaId ? `<div class="tanda-tangan">
      <div class="tt-label">Tanda Tangan Kota</div>
      <div class="tt-teks">Pertama dibawa ke sini oleh <strong><a href="/id/${encodeURIComponent(pertamaId)}" style="color:var(--gold)">${pertamaId}</a></strong> · ${pertamaTanggal}</div>
    </div>` : ''}
    <div class="stats-row">
      <div class="stat-box"><div class="stat-num">${kaosUnik.length}</div><div class="stat-lbl">Kaos Unik</div></div>
      <div class="stat-box"><div class="stat-num">${scans.length}</div><div class="stat-lbl">Total Scan</div></div>
    </div>
  </div>
</div>
<div class="section">
  <div class="section-title">KAOS YANG PERNAH SAMPAI KE SINI</div>
  ${scanList || '<div style="color:var(--muted);font-size:.8rem;">Belum ada data</div>'}
</div>
<footer>
  <a href="/" class="footer-brand">BLUMB✦NG ID</a>
  <a href="https://wa.me/6281234561146" class="footer-link">Order via WhatsApp →</a>
</footer>
</body>
</html>`;
}

function generateIndexHTML(kotaList, totalKaosTerdaftar, totalScan, namaKotaTerbaru, tanggalTerbaru) {
  const totalKotaTermasukKlaten = kotaList.length + 1; // +1 untuk Klaten sebagai origin
  const narasi = `${totalKotaTermasukKlaten} kota telah menyimpan jejak kaos Blumbang ID Klaten — dari Klaten ke seluruh Indonesia dan dunia. ${totalKaosTerdaftar} kaos terdaftar, ${totalScan} perjalanan tercipta. Kota terbaru yang menyimpan jejak: ${namaKotaTerbaru}${tanggalTerbaru ? ', ' + tanggalTerbaru : ''}. Setiap kaos yang pergi, membawa cerita yang tidak pernah selesai. Blumbang ID berdiri 2022, Living Garment System baru lahir 2026 setelah bertahun-tahun menguji kualitas produksi.`;

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Kota yang telah disinggahi kaos Blumbang ID Klaten",
    "description": narasi,
    "numberOfItems": totalKotaTermasukKlaten,
    "additionalProperty": [
      { "@type": "PropertyValue", "name": "Blumbang ID berdiri", "value": "2022" },
      { "@type": "PropertyValue", "name": "Living Garment System diluncurkan", "value": "2026" }
    ],
    "itemListElement": kotaList.map((k, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "name": k.nama,
      "description": `${k.kaosUnik} kaos unik, ${k.scanCount} kali dipindai di ${k.nama}`,
      "url": `${BASE_URL}/sparks/kota/${k.slug}`
    }))
  };

  const cards = kotaList.map(k => `<a href="/sparks/kota/${k.slug}" class="kota-card">
    <div class="kota-nama">${k.nama}</div>
    <div class="kota-info">${k.scanCount} scan · ${k.kaosUnik} kaos</div>
    <div class="kota-first">Pertama: ${k.pertamaTanggal}</div>
  </a>`).join('') + `<a href="/sparks/hof" class="kota-card kota-card-hof">
    <div class="kota-nama">✦ Hall of Fame</div>
    <div class="kota-info">Kaos paling jauh & paling banyak kota</div>
    <div class="kota-first">Lihat peringkat →</div>
  </a>`;

  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Sablon Kaos & Peta Perjalanan Blumbang ID · Semua Kota</title>
<meta name="description" content="${totalKotaTermasukKlaten} kota yang pernah dikunjungi kaos Blumbang ID Klaten. ${totalKaosTerdaftar} kaos terdaftar, ${totalScan} perjalanan.">
<link rel="canonical" href="${BASE_URL}/sparks">
<script type="application/ld+json">
${JSON.stringify(itemListSchema, null, 2)}
</script>
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Montserrat:wght@300;400;600&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
${baseCSS()}
<style>
.hero{padding:100px 40px 48px;border-bottom:1px solid var(--border);}
.hero-inner{max-width:1100px;margin:0 auto;}
.hero-eyebrow{font-family:var(--font-ui);font-size:.6rem;font-weight:700;letter-spacing:.4em;color:var(--gold);text-transform:uppercase;margin-bottom:12px;}
.hero-title{font-family:var(--font-logo);font-size:clamp(2.5rem,7vw,5rem);letter-spacing:.06em;line-height:.95;color:var(--white);}
.grid{max-width:1100px;margin:0 auto;padding:40px;display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:1px;background:var(--border);}
.kota-card{display:block;background:var(--black);padding:24px;transition:background .2s;}
.kota-card:hover{background:var(--charcoal);}
.kota-nama{font-family:var(--font-logo);font-size:1.4rem;letter-spacing:.08em;color:var(--white);margin-bottom:8px;}
.kota-info{font-family:var(--font-ui);font-size:.7rem;color:var(--gold);margin-bottom:4px;}
.kota-first{font-family:var(--font-ui);font-size:.65rem;color:var(--muted);}
.kota-card-hof{background:#140f02;border:1px solid var(--gold-dim);}
.kota-card-hof .kota-nama{color:var(--gold);}
.kota-card-hof:hover{background:var(--charcoal);}
@media(max-width:768px){.hero{padding:80px 20px 32px;}.grid{padding:0;grid-template-columns:1fr 1fr;}}
</style>
</head>
<body>
<div style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;" aria-hidden="false">
  <p>${narasi}</p>
</div>
${navHTML('sparks')}
<div class="hero">
  <div class="hero-inner">
    <a href="/sparks" style="font-family:var(--font-ui);font-size:.65rem;font-weight:600;letter-spacing:.15em;text-transform:uppercase;color:var(--dim);display:inline-block;margin-bottom:20px;">← Peta Perjalanan</a>
    <div class="hero-eyebrow">✦ ${kotaList.length} Kota · Blumbang ID</div>
    <h1 class="hero-title">SEMUA KOTA</h1>
    <p class="hero-kota-sub">Blumbang ID · Sablon Klaten · Living Garment</p>
  </div>
</div>
<div class="grid">${cards}</div>
<footer>
  <a href="/" class="footer-brand">BLUMB✦NG ID</a>
  <a href="https://wa.me/6281234561146" class="footer-link">Order via WhatsApp →</a>
</footer>
</body>
</html>`;
}

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2-lat1)*Math.PI/180;
  const dLng = (lng2-lng1)*Math.PI/180;
  const a = Math.sin(dLat/2)*Math.sin(dLat/2)+Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)*Math.sin(dLng/2);
  return Math.round(R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a)));
}

function generateHOF(scanRows, garmentMap) {
  const KLATEN_LAT = -7.749626;
  const KLATEN_LNG = 110.670888;

  const CITY_COORDS = {
    'yogyakarta':[-7.803,110.364],'jakarta':[-6.208,106.845],'bandung':[-6.917,107.609],
    'surabaya':[-7.258,112.752],'semarang':[-6.966,110.423],'solo':[-7.574,110.827],
    'surakarta':[-7.574,110.827],'denpasar':[-8.67,115.212],'medan':[3.595,98.679],
    'pontianak':[-0.02,109.333],'samarinda':[-0.502,117.136],'balikpapan':[-1.268,116.854],
    'banjarmasin':[-3.317,114.592],'banjarbaru':[-3.442,114.831],'makassar':[-5.147,119.432],
    'tokyo':[35.69,139.69],'osaka':[34.694,135.502],'seychelles':[-4.679,55.492],
    'ile au cerf':[-4.683,55.533],'victoria':[-4.62,55.455],'singapore':[1.352,103.82],
    'kediri':[-7.816,112.018],'boyolali':[-7.534,110.593],'sleman':[-7.717,110.354],
    'wonosobo':[-7.361,109.9],'banyumas':[-7.513,109.215],'sukoharjo':[-7.686,110.838],
    'kijang':[0.917,104.633],'bulakamba':[-6.867,108.988],'trucuk':[-7.713,110.617],
  };

  function getCityCoord(cityStr) {
    if(!cityStr) return null;
    const lower = cityStr.toLowerCase();
    const keys = Object.keys(CITY_COORDS).sort((a,b)=>b.length-a.length);
    for(const key of keys) if(lower.includes(key)) return CITY_COORDS[key];
    return null;
  }

  // Hitung jarak dan kota unik per garment
  const garmentStats = {};
  scanRows.forEach(r => {
    const id = getVal(r.c[0]);
    const city = getVal(r.c[2]);
    if(!id || !city) return;
    if(!garmentStats[id]) garmentStats[id] = { id, kotaSet: new Set(), maxJarak: 0 };
    const kotaNama = city.split(',')[0].trim();
    garmentStats[id].kotaSet.add(kotaNama);
    const coord = getCityCoord(city);
    if(coord) {
      const jarak = haversine(KLATEN_LAT, KLATEN_LNG, coord[0], coord[1]);
      if(jarak > garmentStats[id].maxJarak) garmentStats[id].maxJarak = jarak;
    }
  });

  const semua = Object.values(garmentStats).map(g => ({
    id: g.id,
    nomor: g.id.split('-').pop(),
    nama: garmentMap[g.id] || g.id,
    jarak: g.maxJarak,
    kotaUnik: g.kotaSet.size
  }));

  const terjauh = semua.filter(g=>g.jarak>0).sort((a,b)=>b.jarak-a.jarak).slice(0,5);
  const terbanyak = semua.filter(g=>g.kotaUnik>0).sort((a,b)=>b.kotaUnik-a.kotaUnik).slice(0,5);

  // JSON yang ditanam di dalam <script>: < > & di-escape jadi \u003c \u003e \u0026.
  // Tetap JSON valid dan JSON.parse() menghasilkan nilai yang sama persis,
  // tapi tidak mungkin lagi memutus tag <script> kalau ada nama seri aneh.
  function jsonAman(obj, indent) {
    return JSON.stringify(obj, null, indent)
      .replace(/</g, '\\u003c')
      .replace(/>/g, '\\u003e')
      .replace(/&/g, '\\u0026');
  }

  const hofData = jsonAman({ terjauh, terbanyak });

  // Escape untuk teks yang masuk ke HTML. Nama seri bisa mengandung & < > " '
  function esc(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  const jarakTop = terjauh.length ? terjauh[0].jarak : 0;
  const kotaTop = terbanyak.length ? terbanyak[0].kotaUnik : 0;
  const namaTop = terjauh.length ? terjauh[0].nama : '';

  const narasi = `Hall of Fame Blumbang ID menyimpan kaos-kaos dengan perjalanan paling luar biasa dari Klaten. `
    + (jarakTop ? `Kaos terjauh sejauh ini adalah ${namaTop}, sejauh ${jarakTop} km dari workshop Blumbang ID di Jeto, Gaden, Trucuk, Klaten. ` : '')
    + (kotaTop ? `Kaos dengan sebaran terluas sudah menyimpan jejak di ${kotaTop} kota berbeda. ` : '')
    + `Peringkat disusun ulang setiap malam dari data pemindaian Living Garment. Setiap kaos Blumbang ID membawa QR unik di kerahnya yang menyimpan perjalanannya sendiri.`;

  const schemaJauh = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Kaos Blumbang ID dengan perjalanan terjauh dari Klaten",
    "description": narasi,
    "numberOfItems": terjauh.length,
    "itemListElement": terjauh.map((g, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "name": `${g.nama} · #${g.nomor}`,
      "description": `${g.jarak} km dari Blumbang ID Klaten`,
      "url": `${BASE_URL}/id/${encodeURIComponent(g.id)}`
    }))
  };

  const schemaKota = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Kaos Blumbang ID dengan sebaran kota terbanyak",
    "description": "Kaos Blumbang ID yang jejaknya tersimpan di paling banyak kota berbeda.",
    "numberOfItems": terbanyak.length,
    "itemListElement": terbanyak.map((g, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "name": `${g.nama} · #${g.nomor}`,
      "description": `${g.kotaUnik} kota unik`,
      "url": `${BASE_URL}/id/${encodeURIComponent(g.id)}`
    }))
  };

  function barisHOF(arr, satuanFn) {
    if (!arr.length) return `<div class="hof-empty">Belum ada data yang tersimpan.</div>`;
    return arr.map((g, i) => `<a href="/id/${encodeURIComponent(g.id)}" class="hof-item">
      <div class="hof-rank">#${i + 1}</div>
      <div class="hof-body">
        <div class="hof-nama">${esc(g.nama)} · #${esc(g.nomor)}</div>
        <div class="hof-info">${satuanFn(g)}</div>
      </div>
    </a>`).join('');
  }

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Hall of Fame · Kaos Blumbang ID dengan Perjalanan Terjauh</title>
<meta name="description" content="${esc(jarakTop ? `Kaos Blumbang ID terjauh sudah ${jarakTop} km dari Klaten. Peringkat kaos dengan perjalanan terpanjang dan sebaran kota terbanyak.` : 'Peringkat kaos Blumbang ID dengan perjalanan terpanjang dan sebaran kota terbanyak.')}">
<link rel="canonical" href="${BASE_URL}/sparks/hof">
<meta property="og:title" content="Hall of Fame · Kaos Blumbang ID">
<meta property="og:description" content="${esc(jarakTop ? `Kaos Blumbang ID terjauh sudah ${jarakTop} km dari Klaten.` : 'Peringkat perjalanan kaos Blumbang ID.')}">
<meta property="og:url" content="${BASE_URL}/sparks/hof">
<meta property="og:type" content="website">
<script type="application/ld+json">
${jsonAman(schemaJauh, 2)}
</script>
<script type="application/ld+json">
${jsonAman(schemaKota, 2)}
</script>
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Montserrat:wght@300;400;600&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
${baseCSS()}
<style>
.hero{padding:100px 40px 48px;border-bottom:1px solid var(--border);}
.hero-inner{max-width:1100px;margin:0 auto;}
.hero-eyebrow{font-family:var(--font-ui);font-size:.6rem;font-weight:700;letter-spacing:.4em;color:var(--gold);text-transform:uppercase;margin-bottom:12px;}
.hero-title{font-family:var(--font-logo);font-size:clamp(2.5rem,7vw,5rem);letter-spacing:.06em;line-height:.95;color:var(--white);}
.hero-sub{font-family:var(--font-ui);font-size:.72rem;letter-spacing:.06em;color:var(--dim);margin-top:14px;}
.hof-wrap{max-width:1100px;margin:0 auto;padding:48px 40px 0;display:grid;grid-template-columns:1fr 1fr;gap:48px;}
.hof-col-title{font-family:var(--font-ui);font-size:.62rem;font-weight:700;letter-spacing:.25em;color:var(--gold);text-transform:uppercase;margin-bottom:18px;}
.hof-item{display:flex;align-items:center;gap:14px;padding:14px 0;border-bottom:1px solid var(--border);transition:background .2s;}
.hof-item:hover .hof-nama{color:var(--gold);}
.hof-rank{font-family:var(--font-logo);font-size:1.3rem;color:var(--gold);min-width:32px;}
.hof-nama{font-family:var(--font-ui);font-size:.82rem;color:var(--white);transition:color .2s;}
.hof-info{font-family:var(--font-ui);font-size:.68rem;color:var(--dim);margin-top:3px;}
.hof-empty{font-family:var(--font-ui);font-size:.72rem;color:var(--muted);padding:14px 0;}
.hof-note{max-width:1100px;margin:0 auto;padding:40px;font-family:var(--font-ui);font-size:.72rem;line-height:1.9;color:var(--dim);}
@media(max-width:768px){.hero{padding:80px 20px 32px;}.hof-wrap{padding:32px 20px 0;grid-template-columns:1fr;gap:36px;}.hof-note{padding:28px 20px;}}
</style>
</head>
<body>
${navHTML('sparks')}
<div class="hero">
  <div class="hero-inner">
    <a href="/sparks" style="font-family:var(--font-ui);font-size:.65rem;font-weight:600;letter-spacing:.15em;text-transform:uppercase;color:var(--dim);display:inline-block;margin-bottom:20px;">← Peta Perjalanan</a>
    <div class="hero-eyebrow">✦ Hall of Fame · Blumbang ID</div>
    <h1 class="hero-title">HALL OF FAME</h1>
    <p class="hero-sub">Kaos Blumbang ID dengan perjalanan paling luar biasa</p>
  </div>
</div>
<div class="hof-wrap">
  <section>
    <h2 class="hof-col-title">Paling Jauh dari Blumbang ID</h2>
    ${barisHOF(terjauh, g => `${g.jarak} km dari Blumbang ID Klaten`)}
  </section>
  <section>
    <h2 class="hof-col-title">Paling Banyak Kota</h2>
    ${barisHOF(terbanyak, g => `${g.kotaUnik} kota unik`)}
  </section>
</div>
<p class="hof-note">${esc(narasi)}</p>
<footer>
  <a href="/" class="footer-brand">BLUMB✦NG ID</a>
  <a href="https://wa.me/6281234561146" class="footer-link">Order via WhatsApp →</a>
</footer>
<script id="hof-data" type="application/json">${hofData}</script>
</body>
</html>`;

  fs.writeFileSync(path.join(SPARKS_DIR, 'hof.html'), html);
  console.log('✅ sparks/hof.html — ' + terjauh.length + ' terjauh, ' + terbanyak.length + ' terbanyak kota');
}

// ============================================================
// SPARKS SNAPSHOT — suntik ringkasan statis ke sparks.html
// supaya AI/crawler bisa baca data tanpa render JavaScript.
// Menyentuh HANYA blok di antara marker SPARKS-SNAPSHOT.
// Kalau marker tidak ditemukan / rusak, BATAL menulis file.
// ============================================================
// Cari scan PALING BARU secara global (bukan "kota yang pertama kali muncul paling belakangan").
// Dipakai bersama oleh generateSparksSnapshot() dan generateIndexHTML().
function cariScanTerbaru(scanRows) {
  function parseTimestamp(raw) {
    if (!raw) return new Date(0);
    const tgl = raw.split(',')[0].trim(); // "10/3/2026"
    const parts = tgl.split('/');
    if (parts.length !== 3) return new Date(0);
    return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
  }
  let scanTerbaru = null;
  let scanTerbaruDate = new Date(0);
  scanRows.forEach(r => {
    const rawTs = getVal(r.c[6]);
    const city = getVal(r.c[2]);
    if (!rawTs || !city) return;
    const d = parseTimestamp(rawTs);
    if (d > scanTerbaruDate) {
      scanTerbaruDate = d;
      scanTerbaru = { nama: city.split(',')[0].trim(), tanggal: formatTanggal(rawTs) };
    }
  });
  return scanTerbaru;
}

function generateSparksSnapshot(kotaList, scanRows, totalScan, totalKaosTerdaftar, totalKotaTermasukKlaten) {
  const SPARKS_HTML_PATH = path.join(__dirname, 'sparks.html');

  if (!fs.existsSync(SPARKS_HTML_PATH)) {
    console.log('[sparks-snapshot] sparks.html tidak ditemukan — SKIP, tidak menyentuh apapun.');
    return;
  }

  let html = fs.readFileSync(SPARKS_HTML_PATH, 'utf-8');

  const totalKota = totalKotaTermasukKlaten;
  const scanTerbaru = cariScanTerbaru(scanRows);

  const namaKotaTerbaru = scanTerbaru ? scanTerbaru.nama : '';
  const tanggalTerbaru = scanTerbaru ? scanTerbaru.tanggal : '';

  // Narasi — "dingin tapi kejam", personal, singkat. Angka SAMA PERSIS dengan stat bar /sparks
  // supaya AI dan manusia melihat data yang identik.
  const narasi = `${totalKota} kota telah menyimpan jejak kaos Blumbang ID Klaten — dari Klaten ke seluruh Indonesia dan dunia. ${totalKaosTerdaftar} kaos terdaftar, ${totalScan} perjalanan tercipta. Kota terbaru yang menyimpan jejak: ${namaKotaTerbaru}${tanggalTerbaru ? ', ' + tanggalTerbaru : ''}. Setiap kaos yang pergi, membawa cerita yang tidak pernah selesai. Blumbang ID berdiri 2022, Living Garment System baru lahir 2026 setelah bertahun-tahun menguji kualitas produksi.`;

  // Schema JSON-LD — ItemList seluruh kota, untuk AI/Google
  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Kota yang telah disinggahi kaos Blumbang ID Klaten",
    "description": narasi,
    "numberOfItems": totalKota,
    "additionalProperty": [
      { "@type": "PropertyValue", "name": "Blumbang ID berdiri", "value": "2022" },
      { "@type": "PropertyValue", "name": "Living Garment System diluncurkan", "value": "2026" }
    ],
    "itemListElement": kotaList.map((k, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "name": k.nama,
      "description": `${k.kaosUnik} kaos unik, ${k.scanCount} kali dipindai di ${k.nama}`,
      "url": `${BASE_URL}/sparks/kota/${k.slug}`
    }))
  };

  const textBlock = `<!--SPARKS-SNAPSHOT-TEXT-START-->
<div style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;" aria-hidden="false">
  <p>${narasi}</p>
</div>
<!--SPARKS-SNAPSHOT-TEXT-END-->`;

  const schemaBlock = `<!--SPARKS-SNAPSHOT-SCHEMA-START-->
<script type="application/ld+json">
${JSON.stringify(itemListSchema, null, 2)}
</script>
<!--SPARKS-SNAPSHOT-SCHEMA-END-->`;

  // Meta description — versi ringkas dari narasi, ikut ter-update tiap build.
  // Sebelumnya hardcoded di sparks.html sehingga membeku di angka lama
  // (mesin pencari membaca angka basi walau snapshot & schema sudah benar).
  const escAttr = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const metaDescText = `${totalKota} kota telah menyimpan jejak kaos Blumbang ID Klaten${namaKotaTerbaru ? ' — kota terbaru: ' + namaKotaTerbaru + (tanggalTerbaru ? ', ' + tanggalTerbaru : '') : ''}. ${totalScan} perjalanan tersimpan dari Klaten ke seluruh dunia.`;
  const metaDescBlock = `<meta name="description" content="${escAttr(metaDescText)}">`;

  const textMarkerRegex = /<!--SPARKS-SNAPSHOT-TEXT-START-->[\s\S]*?<!--SPARKS-SNAPSHOT-TEXT-END-->/;
  const schemaMarkerRegex = /<!--SPARKS-SNAPSHOT-SCHEMA-START-->[\s\S]*?<!--SPARKS-SNAPSHOT-SCHEMA-END-->/;
  // Hanya menyasar <meta name="description">. og:description & twitter:description
  // pakai atribut "property"/nama berbeda, jadi tidak akan tersentuh.
  const metaDescRegex = /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i;

  let newHtml = html;
  let textInjected = false;
  let schemaInjected = false;
  let metaInjected = false;

  if (textMarkerRegex.test(html)) {
    newHtml = newHtml.replace(textMarkerRegex, textBlock);
    textInjected = true;
  } else if (html.includes('<body>')) {
    newHtml = newHtml.replace('<body>', `<body>\n${textBlock}\n`);
    textInjected = true;
  }

  if (schemaMarkerRegex.test(newHtml)) {
    newHtml = newHtml.replace(schemaMarkerRegex, schemaBlock);
    schemaInjected = true;
  } else if (newHtml.includes('</head>')) {
    newHtml = newHtml.replace('</head>', `${schemaBlock}\n</head>`);
    schemaInjected = true;
  }

  if (metaDescRegex.test(newHtml)) {
    newHtml = newHtml.replace(metaDescRegex, metaDescBlock);
    metaInjected = true;
  }

  if (!textInjected || !schemaInjected || !metaInjected) {
    console.log('[sparks-snapshot] Titik suntik tidak lengkap ditemukan — BATAL, sparks.html tidak ditulis.');
    console.log(`[sparks-snapshot] Detail: text=${textInjected} schema=${schemaInjected} meta=${metaInjected}`);
    return;
  }

  if (metaDescText.length > 160) {
    console.log(`[sparks-snapshot] ⚠️  Meta description ${metaDescText.length} karakter (>160) — kemungkinan dipotong di hasil pencarian.`);
  }

  // Validasi ringan: pastikan JSON-LD yang baru valid sebelum ditulis
  try {
    const schemaCheck = newHtml.match(schemaMarkerRegex)[0]
      .replace('<!--SPARKS-SNAPSHOT-SCHEMA-START-->', '')
      .replace('<!--SPARKS-SNAPSHOT-SCHEMA-END-->', '')
      .replace(/<script type="application\/ld\+json">|<\/script>/g, '')
      .trim();
    JSON.parse(schemaCheck);
  } catch (e) {
    console.log('[sparks-snapshot] JSON-LD hasil suntik tidak valid — BATAL, sparks.html tidak ditulis. Error:', e.message);
    return;
  }

  fs.writeFileSync(SPARKS_HTML_PATH, newHtml, 'utf-8');
  console.log(`✅ sparks.html — snapshot disuntik (${totalKota} kota, ${totalKaosTerdaftar} kaos terdaftar, ${totalScan} perjalanan)`);
  console.log(`✅ sparks.html — meta description diperbarui (${metaDescText.length} karakter)`);
}

async function main() {
  console.log('Fetching data dari Sheet...');
  const [spkRows, garRows] = await Promise.all([
    fetchSheet('SPARKS'),
    fetchSheet('GARMENTS')
  ]);

  const scanRows = filterScanRows(spkRows);
  const garRows2 = filterGarmentRows(garRows);

  console.log(`Data: ${scanRows.length} scan, ${garRows2.length} garment`);

  // Build garment map: id → nama seri
  const garmentMap = {};
  garRows2.forEach(r => {
    const id = getVal(r.c[0]);
    const nama = getVal(r.c[1]);
    if (id) garmentMap[id] = nama;
  });

  // Group scan per kota — memakai lib-stats.js supaya definisinya
  // sama persis dengan yang dipakai untuk menghitung angka homepage.
  const kotaMap = groupKota(scanRows);

  // Pastikan semua kota sudah punya koordinat di geo-cache.json SEBELUM
  // sparks.html dibaca pengunjung. Kota yang sudah ada di CITY_COORDS
  // atau cache lama dilewati — hanya kota benar-benar baru yang
  // memicu panggilan Nominatim (dengan jeda 1,1 detik per kota).
  console.log('Memastikan geo-cache untuk semua kota...');
  await pastikanGeoCache(kotaMap);

  // Generate halaman per kota
  const kotaList = [];
  for (const [slug, data] of Object.entries(kotaMap)) {
    if (slug === 'klaten') continue; // Skip Klaten — origin
    const html = generateKotaHTML(data.nama, slug, data.scans, garmentMap);
    const outPath = path.join(KOTA_DIR, slug + '.html');
    fs.writeFileSync(outPath, html);

    const pertama = data.scans[0];
    const pertamaTanggal = pertama ? formatTanggal(getVal(pertama.c[6])) : '';
    const kaosUnik = new Set(data.scans.map(r => getVal(r.c[0])).filter(Boolean)).size;

    kotaList.push({ nama: data.nama, slug, scanCount: data.scans.length, kaosUnik, pertamaTanggal });
    console.log(`  ✦ sparks/kota/${slug}.html (${data.scans.length} scan)`);
  }

  // Sort by scan count
  kotaList.sort((a, b) => b.scanCount - a.scanCount);

  // ─────────────────────────────────────────────────────────────
  // DIAKTIFKAN KEMBALI 25 Juli 2026.
  //
  // Sempat dinonaktifkan 23 Juli 2026 dengan alasan "sparks.html sudah
  // tidak dipakai karena /sparks di-serve dari sparks/index.html".
  // ALASAN ITU KELIRU — sudah diverifikasi 25 Juli 2026:
  //   - blumbang.id/sparks di-serve dari sparks.html (file root ini),
  //     bukan dari folder. Dibuktikan lewat pencocokan teks: frasa
  //     "Dari Klaten · Ke Dunia" dan "Kaos Terdaftar" hanya ada di
  //     sparks.html, dan itulah yang tampil di browser.
  //   - _redirects hanya mengatur /sparks/kota, tidak menyentuh /sparks.
  //   - sparks/index.html justru yang tampil di URL /sparks/kota.
  //
  // Akibat penonaktifan itu, angka di /sparks membeku sejak 23 Juli
  // (39 kota / 1244 kaos) sementara homepage menunjukkan angka terbaru —
  // membuat AI membaca data yang saling bertentangan antar halaman.
  //
  // KENAPA AMAN (diuji 25 Juli 2026 pada salinan sparks.html asli):
  //   - Fungsi ini TIDAK menulis ulang seluruh file. Ia membaca file,
  //     mengganti isi di antara penanda, lalu menulis kembali.
  //   - Hanya 33% pertama file yang tersentuh. 48.638 byte terakhir —
  //     tempat seluruh kode peta berada — terbukti identik byte-per-byte.
  //   - Jumlah penanda tetap 1 setelah suntik, tidak menggandakan diri.
  //   - Kalau salah satu penanda hilang, fungsi MEMBATALKAN DIRI dan
  //     tidak menulis apa pun (lihat pengaman di dalam fungsinya).
  //
  // CATATAN WORKFLOW: sparks.html harus ikut di baris `git add` pada
  // .github/workflows/sparks-build.yml, kalau tidak perubahan ini tidak
  // pernah ter-commit. `git add sparks/` TIDAK mencakup file root ini.
  // ─────────────────────────────────────────────────────────────
  const totalKotaTermasukKlaten = new Set(['klaten', ...Object.keys(kotaMap)]).size;
  generateSparksSnapshot(kotaList, scanRows, scanRows.length, garRows2.length, totalKotaTermasukKlaten);
  // ─────────────────────────────────────────────────────────────

  // Generate index — parameter sama persis dengan snapshot sparks.html, supaya kedua halaman konsisten
  const scanTerbaruUntukIndex = cariScanTerbaru(scanRows);
  const indexHtml = generateIndexHTML(
    kotaList,
    garRows2.length,
    scanRows.length,
    scanTerbaruUntukIndex ? scanTerbaruUntukIndex.nama : '',
    scanTerbaruUntukIndex ? scanTerbaruUntukIndex.tanggal : ''
  );
  fs.writeFileSync(path.join(SPARKS_DIR, 'index.html'), indexHtml);
  console.log(`✅ sparks/index.html — ${kotaList.length} kota`);
  console.log(`✅ ${kotaList.length} halaman kota di-generate`);

  // Generate Hall of Fame
  generateHOF(scanRows, garmentMap);
}

main().catch(console.error);
