// ──────────────────────────────────────────────────────────
// GERENCIADOR DE CANVAS (FABRIC.JS)
// ──────────────────────────────────────────────────────────

const canvas = new fabric.Canvas('main-canvas', {
  width: CANVAS_W,
  height: CANVAS_H,
  backgroundColor: 'transparent',
  preserveObjectStacking: true,
  selection: true,
});

let currentZoom = 1;
let objCounter = 0;
let currentBackgroundKey = 'transparent';

function getCurrentBackgroundKey() { return currentBackgroundKey; }

function fitCanvas() {
  const area = document.getElementById('canvas-area');
  const scaleW = (area.clientWidth - 80) / CANVAS_W;
  const scaleH = (area.clientHeight - 120) / CANVAS_H;
  currentZoom = Math.min(scaleW, scaleH, 1);
  applyZoom();
}

function applyZoom() {
  const w = document.getElementById('canvas-wrapper');
  w.style.width = (CANVAS_W * currentZoom) + 'px';
  w.style.height = (CANVAS_H * currentZoom) + 'px';
  canvas.setZoom(currentZoom);
  canvas.setWidth(CANVAS_W * currentZoom);
  canvas.setHeight(CANVAS_H * currentZoom);
  document.getElementById('zoom-label').textContent = Math.round(currentZoom * 100) + '%';
  canvas.requestRenderAll();
}

// CRIAÇÃO DE ELEMENTOS TIPOGRÁFICOS DO GTA VI
function createGTAVIElement(text = 'LUCIA', opts = {}) {
  const isNormal = opts.type === 'normal';
  const renderedCanvas = renderGTAVIText(text, {
    type: opts.type || 'logo',
    style: opts.style || 'colorful',
    coverArt: opts.coverArt !== false,
    palmTree: opts.palmTree !== false,
    fontSize: opts.fontSize || (isNormal ? 72 : 260),
    letterSpacing: opts.letterSpacing !== undefined ? opts.letterSpacing : 0,
    fontFamily: opts.fontFamily || 'GTA Art Deco Medium',
    fontColor: opts.fontColor || '#ffffff',
    shadowIntensity: opts.shadowIntensity !== undefined ? opts.shadowIntensity : 50,
    glowIntensity: opts.glowIntensity !== undefined ? opts.glowIntensity : 0
  });

  const imgObj = new fabric.Image(renderedCanvas, {
    left: (opts.left !== undefined && opts.left !== null) ? opts.left : CANVAS_W / 2,
    top: (opts.top !== undefined && opts.top !== null) ? opts.top : CANVAS_H / 2,
    originX: 'center',
    originY: 'center',
    selectable: true,
    hasControls: true,
    hasBorders: true,
    transparentCorners: false,
    cornerColor: '#ffffff',
    cornerStrokeColor: '#ff8192',
    borderColor: '#ff8192',
    cornerSize: 14,
  });

  // Metadados do texto
  imgObj._gtaType = opts.type || 'logo';
  imgObj._gtaText = (text || '');
  imgObj._gtaStyle = opts.style || 'colorful';
  imgObj._gtaCoverArt = opts.coverArt !== false;
  imgObj._gtaPalmTree = opts.palmTree !== false;
  imgObj._gtaFontSize = opts.fontSize || (isNormal ? 72 : 260);
  imgObj._gtaLetterSpacing = opts.letterSpacing !== undefined ? opts.letterSpacing : 0;
  imgObj._gtaFontFamily = opts.fontFamily || 'GTA Art Deco Medium';
  imgObj._gtaFontColor = opts.fontColor || '#ffffff';
  imgObj._gtaShadowIntensity = opts.shadowIntensity !== undefined ? opts.shadowIntensity : 50;
  imgObj._gtaGlowIntensity = opts.glowIntensity !== undefined ? opts.glowIntensity : 0;
  imgObj._gtaId = ++objCounter;
  imgObj._gtaLabel = (isNormal ? 'Subtítulo: ' : 'Logo: ') + (imgObj._gtaText || '(vazio)');

  canvas.add(imgObj);
  canvas.setActiveObject(imgObj);
  canvas.requestRenderAll();
  updateLayerList();
  updateStatusCount();
  pushHistory();
  return imgObj;
}

function updateGTAVIElement(obj) {
  if (!obj || typeof obj._gtaText !== 'string') return;
  const newCanvas = renderGTAVIText(obj._gtaText, {
    type: obj._gtaType || 'logo',
    style: obj._gtaStyle,
    coverArt: obj._gtaCoverArt,
    palmTree: obj._gtaPalmTree,
    fontSize: obj._gtaFontSize,
    letterSpacing: obj._gtaLetterSpacing || 0,
    fontFamily: obj._gtaFontFamily || 'GTA Art Deco Medium',
    fontColor: obj._gtaFontColor || '#ffffff',
    shadowIntensity: obj._gtaShadowIntensity !== undefined ? obj._gtaShadowIntensity : 50,
    glowIntensity: obj._gtaGlowIntensity !== undefined ? obj._gtaGlowIntensity : 0
  });

  obj.setElement(newCanvas);
  obj.setCoords();
  canvas.requestRenderAll();
}

function rerenderAllElements() {
  canvas.getObjects().forEach(o => {
    if (typeof o._gtaText === 'string') updateGTAVIElement(o);
  });
}

// Helper para resolver src evitando tainted canvas: tenta usar CHAR_DATA (base64) por basename
function resolveCharSrc(file) {
  if (typeof CHAR_DATA === 'undefined') return file;
  if (CHAR_DATA[file]) return CHAR_DATA[file];
  const base = file.split('/').pop();
  const key1 = 'characters/' + base;
  if (CHAR_DATA[key1]) return CHAR_DATA[key1];
  // tenta case-insensitive
  const lower = key1.toLowerCase();
  for (const k in CHAR_DATA) { if (k.toLowerCase() === lower) return CHAR_DATA[k]; }
  return file;
}

// Helper CORS: file:// não suporta crossOrigin (bloqueia), http(s) precisa de anonymous para exportar
function getFabricLoadOptions(src) {
  if (typeof src === 'string' && src.indexOf('data:') === 0) return null;
  if (window.location.protocol === 'file:') return null;
  return { crossOrigin: 'anonymous' };
}

// ADICIONAR PERSONAGENS AO CANVAS
function addCharacterToCanvas(ch) {
  const imgSrc = resolveCharSrc(ch.file);
  fabric.Image.fromURL(imgSrc, img => {
    if (!img || !img.width || !img.height) return;
    
    // Enquadra proporcionalmente no canvas 1920x1080
    const scale = Math.min(CANVAS_W / img.width, CANVAS_H / img.height);

    img.set({
      left: CANVAS_W / 2,
      top: CANVAS_H / 2,
      originX: 'center',
      originY: 'center',
      scaleX: scale,
      scaleY: scale,
      selectable: true,
      hasControls: true,
      hasBorders: true,
      transparentCorners: false,
      cornerColor: '#ffffff',
      cornerStrokeColor: '#ff8192',
      borderColor: '#ff8192',
      cornerSize: 14,
    });

    // Metadados para o layer list e histórico
    img._charKey = ch.key;
    img._charLabel = ch.label;
    img._charFile = ch.file;
    img._isChar = true;

    canvas.add(img);
    canvas.setActiveObject(img);
    canvas.requestRenderAll();
    updateLayerList();
    updateStatusCount();
    syncPanel(img);
    pushHistory();
    toast(`${ch.label} adicionado!`);
    setActiveTool('select');
  }, getFabricLoadOptions(imgSrc));
}


// ADICIONAR ASSETS (PALMEIRAS) AO CANVAS
function addAssetToCanvas(asset) {
  const imgSrc = asset.file;
  fabric.Image.fromURL(imgSrc, img => {
    if (!img || !img.width || !img.height) { console.error("Asset falhou", asset.file); return; }
    const maxH = CANVAS_H * 0.6;
    const scale = Math.min(maxH / img.height, CANVAS_W * 0.4 / img.width, 0.9);
    img.set({
      left: CANVAS_W / 2 + (Math.random()*40-20),
      top: CANVAS_H / 2 + (Math.random()*40-20),
      originX: "center",
      originY: "center",
      scaleX: scale,
      scaleY: scale,
      selectable: true,
      hasControls: true,
      hasBorders: true,
      transparentCorners: false,
      cornerColor: "#ffffff",
      cornerStrokeColor: "#ff8192",
      borderColor: "#ff8192",
      cornerSize: 14,
    });
    img._assetKey = asset.key;
    img._assetLabel = asset.label;
    img._assetFile = asset.file;
    img._isAsset = true;
    canvas.add(img);
    canvas.setActiveObject(img);
    canvas.requestRenderAll();
    updateLayerList();
    updateStatusCount();
    syncPanel(img);
    pushHistory();
    toast(asset.label + " adicionado!");
    setActiveTool("select");
  }, getFabricLoadOptions(imgSrc));
}

// SELEÇÃO DE BACKGROUNDS
function setBackground(key) {
  currentBackgroundKey = key || 'transparent';
  canvas.setBackgroundImage(null, () => {});
  if (key === 'transparent') { canvas.setBackgroundColor('', () => canvas.requestRenderAll()); return; }
  if (key === 'black') { canvas.setBackgroundColor('#000', () => canvas.requestRenderAll()); return; }
  if (key === 'dark') { canvas.setBackgroundColor('#11111A', () => canvas.requestRenderAll()); return; }
  const bg = BG_LIST.find(b => b.key === key);
  if (!bg) return;
  canvas.setBackgroundColor('', () => {});
  fabric.Image.fromURL(bg.path, img => {
    if (!img || !img.width || !img.height) { console.error('Background falhou', bg.path); return; }
    const sx = CANVAS_W / img.width, sy = CANVAS_H / img.height, s = Math.max(sx, sy);
    img.set({ scaleX: s, scaleY: s, left: (CANVAS_W - img.width * s) / 2, top: (CANVAS_H - img.height * s) / 2, selectable: false, evented: false });
    canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas));
  }, getFabricLoadOptions(bg.path));
}

// INICIALIZADORES DOS GRIDS LATERAIS
function initBackgroundGrid() {
  const grids = [document.getElementById('bg-grid'), document.getElementById('modal-bg-grid')].filter(Boolean);
  grids.forEach(bgGrid => {
    // clear transparent/black/dark are already in HTML for sidebar, but modal needs them too
    if (bgGrid.id === 'modal-bg-grid' && bgGrid.children.length===0) {
      const presets = [
        {key:'transparent', cls:'transparent-bg', title:'Transparente'},
        {key:'black', cls:'black-bg', title:'Preto'},
        {key:'dark', cls:'dark-bg', title:'Escuro'}
      ];
      presets.forEach(pr=>{
        const d=document.createElement('div'); d.className='bg-thumb '+pr.cls; d.dataset.bg=pr.key; d.title=pr.title;
        if(pr.key==='transparent') d.classList.add('active');
        bgGrid.appendChild(d);
      });
    }
    BG_LIST.forEach(bg => {
      const div = document.createElement('div');
      div.className = 'bg-thumb'; div.dataset.bg = bg.key; div.title = bg.label;
      const img = document.createElement('img'); img.src = bg.path; img.alt = bg.label;
      div.appendChild(img); bgGrid.appendChild(div);
    });
    bgGrid.querySelectorAll('.bg-thumb').forEach(el => {
      el.onclick = () => {
        document.querySelectorAll('.bg-thumb').forEach(x => x.classList.remove('active'));
        // mark active in both grids
        document.querySelectorAll(`.bg-thumb[data-bg="${el.dataset.bg}"]`).forEach(x=>x.classList.add('active'));
        setBackground(el.dataset.bg);
      };
    });
  });
}


function initAssetGrid() {
  const grids = [
    document.getElementById("asset-grid"),
    document.getElementById("asset-preview"),
    document.getElementById("modal-asset-grid")
  ].filter(Boolean);
  grids.forEach(assetGrid => {
    const isPreview = assetGrid.id === "asset-preview";
    const list = isPreview ? ASSET_LIST.slice(0,4) : ASSET_LIST;
    list.forEach(asset => {
      const div = document.createElement("div");
      div.className = "char-thumb asset-thumb";
      if (assetGrid.id === "modal-asset-grid") div.className = "modal-item";
      div.dataset.filter = asset.file.includes("_mono") ? "mono" : "color";
      div.title = asset.label;
      const img = document.createElement("img");
      img.src = asset.file;
      img.alt = asset.label;
      img.loading = "lazy";
      const label = document.createElement("div");
      label.className = assetGrid.id === "modal-asset-grid" ? "modal-item-label" : "char-name";
      label.textContent = asset.label;
      div.appendChild(img);
      div.appendChild(label);
      div.onclick = () => { addAssetToCanvas(asset); closeGallery(); };
      assetGrid.appendChild(div);
    });
  });
}
function initCharacterGrid() {
  const grids = [document.getElementById('char-grid'), document.getElementById('modal-char-grid')].filter(Boolean);
  grids.forEach(charGrid => {
  CHAR_LIST.forEach(ch => {
    const div = document.createElement('div');
    div.className = charGrid.id === 'modal-char-grid' ? 'modal-item' : 'char-thumb';
    div.title = ch.label;

    const img = document.createElement('img');
    img.src = ch.file;
    img.alt = ch.label;
    img.loading = 'lazy';

    const label = document.createElement('div');
    label.className = charGrid.id === 'modal-char-grid' ? 'modal-item-label' : 'char-name';
    label.textContent = ch.label.toUpperCase();

    div.appendChild(img);
    div.appendChild(label);
    div.onclick = () => { addCharacterToCanvas(ch); closeGallery(); };
    charGrid.appendChild(div);
  });
  });
}

function openGallery(tab='bg') {
  const m=document.getElementById('gallery-modal');
  if(!m) return;
  m.style.display='flex';
  document.body.style.overflow='hidden';
  switchGalleryTab(tab);
}
function closeGallery(){
  const m=document.getElementById('gallery-modal');
  if(!m) return;
  m.style.display='none';
  document.body.style.overflow='';
}
function switchGalleryTab(tab){
  document.querySelectorAll('#gallery-tabs .modal-tab').forEach(b=>b.classList.toggle('active', b.dataset.tab===tab));
  document.querySelectorAll('.modal-pane').forEach(p=>p.style.display='none');
  const pane=document.getElementById('pane-'+tab);
  if(pane) pane.style.display='';
  if(pane) pane.classList.add('active');
}
function initGalleryModal(){
  const modal=document.getElementById('gallery-modal');
  if(!modal) return;
  document.getElementById('gallery-modal-close')?.addEventListener('click', closeGallery);
  modal.addEventListener('click', e=>{ if(e.target===modal) closeGallery(); });
  document.querySelectorAll('#gallery-tabs .modal-tab').forEach(b=>b.addEventListener('click', ()=>switchGalleryTab(b.dataset.tab)));
  // asset sub-filter
  document.querySelectorAll('#pane-assets .modal-tab.small').forEach(b=>{
    b.addEventListener('click', ()=>{
      document.querySelectorAll('#pane-assets .modal-tab.small').forEach(x=>x.classList.remove('active'));
      b.classList.add('active');
      const f=b.dataset.filter;
      document.querySelectorAll('#modal-asset-grid .modal-item').forEach(it=>{
        it.style.display = (f==='all' || it.dataset.filter===f) ? '' : 'none';
      });
    });
  });
  // sidebar buttons
  document.getElementById('btn-gallery-bg')?.addEventListener('click', ()=>openGallery('bg'));
  document.getElementById('btn-gallery-chars')?.addEventListener('click', ()=>openGallery('chars'));
  document.getElementById('btn-gallery-assets')?.addEventListener('click', ()=>openGallery('assets'));
  document.getElementById('btn-open-gallery')?.addEventListener('click', ()=>openGallery('bg'));
  document.getElementById('tool-gallery')?.addEventListener('click', ()=>openGallery('bg'));
  document.getElementById('tool-bg')?.addEventListener('click', ()=>openGallery('bg'));
  // legacy btn-open-assets
  document.getElementById('btn-open-assets')?.addEventListener('click', ()=>openGallery('assets'));
  document.addEventListener('keydown', e=>{ if(e.key==='Escape') closeGallery(); if(e.key==='g' && !e.ctrlKey && document.activeElement.tagName!=='TEXTAREA' && document.activeElement.tagName!=='INPUT') openGallery('bg'); });
}

// EXPORTAÇÃO EM ALTA RESOLUÇÃO
function exportPNG() {
  // Tenta exportar; se o canvas estiver tainted (file:// ou imagem sem CORS), mostra instrução útil
  try {
    // Garante render atualizado antes de exportar
    canvas.requestRenderAll();
    const mult = 1 / currentZoom;
    const url = canvas.toDataURL({ format: 'png', multiplier: mult, enableRetinaScaling: false });
    const a = document.createElement('a');
    a.href = url;
    a.download = 'gta-vi-artwork.png';
    document.body.appendChild(a);
    a.click();
    a.remove();
    toast('Arte baixada em alta resolução!');
  } catch (err) {
    console.error('Erro ao exportar canvas:', err);
    const isTainted = err && err.name === 'SecurityError' || /tainted|toDataURL/i.test(err.message || '');
    const isFileProtocol = window.location.protocol === 'file:';
    if (isTainted) {
      if (isFileProtocol) {
        toast('Export bloqueado: abra via servidor local (ex: VS Code Live Server ou npx serve .) — file:// contamina o canvas.');
        console.warn('Dica: rode `npx serve .` na pasta do projeto e acesse http://localhost:3000');
      } else {
        toast('Export bloqueado por imagem sem CORS. Remova background/personagem externo ou hospede imagens com CORS habilitado.');
      }
      // Tentativa de fallback: exportar sem background se houver (remove temporariamente a imagem tainted)
      try {
        const bg = canvas.backgroundImage;
        if (bg) {
          canvas.setBackgroundImage(null, () => {
            canvas.requestRenderAll();
            try {
              const url2 = canvas.toDataURL({ format: 'png', multiplier: 1 / currentZoom, enableRetinaScaling: false });
              const a2 = document.createElement('a');
              a2.href = url2;
              a2.download = 'gta-vi-artwork-sem-bg.png';
              document.body.appendChild(a2);
              a2.click();
              a2.remove();
              toast('Sem background foi possível exportar! Restaure o background após salvar.');
              canvas.setBackgroundImage(bg, canvas.renderAll.bind(canvas));
            } catch (e2) {
              console.error('Fallback sem background também falhou:', e2);
              canvas.setBackgroundImage(bg, canvas.renderAll.bind(canvas));
            }
          });
        }
      } catch (_) {}
    } else {
      toast('Erro ao exportar canvas: ' + (err.message || err));
    }
  }
}
