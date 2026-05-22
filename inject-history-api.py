history_js = """
// HISTORY API — drawer
function bukaDrawer(tipe){
  const label={berjalan:'Kaos yang Sudah Berjalan',kota:'Kota yang Sudah Discan',negara:'Negara yang Sudah Discan'};
  document.getElementById('drawer-judul').textContent=label[tipe]||tipe;
  document.getElementById('drawer-list').innerHTML='<div class="drawer-kosong">Memuat...</div>';
  document.getElementById('drawer-overlay').classList.add('aktif');
  document.getElementById('drawer').classList.add('aktif');
  document.body.style.overflow='hidden';
  history.pushState({drawer:tipe},'','#'+tipe);
  isiDrawer(tipe);
}
function tutupDrawer(){
  document.getElementById('drawer-overlay').classList.remove('aktif');
  document.getElementById('drawer').classList.remove('aktif');
  document.body.style.overflow='';
  if(location.hash)history.pushState({},'',location.pathname);
}
window.addEventListener('popstate',function(e){
  const overlay=document.getElementById('drawer-overlay');
  if(overlay&&overlay.classList.contains('aktif')){
    document.getElementById('drawer-overlay').classList.remove('aktif');
    document.getElementById('drawer').classList.remove('aktif');
    document.body.style.overflow='';
  }
});
"""

old_buka = """function bukaDrawer(tipe){
  const label={berjalan:'Kaos yang Sudah Berjalan',kota:'Kota yang Sudah Discan',negara:'Negara yang Sudah Discan'};
  document.getElementById('drawer-judul').textContent=label[tipe]||tipe;
  document.getElementById('drawer-list').innerHTML='<div class="drawer-kosong">Memuat...</div>';
  document.getElementById('drawer-overlay').classList.add('aktif');
  document.getElementById('drawer').classList.add('aktif');
  document.body.style.overflow='hidden';
  isiDrawer(tipe);
}
function tutupDrawer(){
  document.getElementById('drawer-overlay').classList.remove('aktif');
  document.getElementById('drawer').classList.remove('aktif');
  document.body.style.overflow='';
}"""

content = open('index.html').read()
if 'popstate' in content:
    print('skip — History API sudah ada')
else:
    content = content.replace(old_buka, history_js, 1)
    open('index.html', 'w').write(content)
    print('ok index.html')
