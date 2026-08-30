// ──────────────────────────────────────────────────────────
// INICIALIZAÇÃO DA APLICAÇÃO & ATALHOS GLOBAIS
// ──────────────────────────────────────────────────────────

let toastTimer = null;
function toast(msg) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2500);
}

function loadAssets() {
  // 1. Fonte do Logo GTA VI (Brother 1816 Black)
  const fontLogo = new FontFace(FONT_FAMILY_LOGO, `url(${FONT_URL})`);
  fontLogo.load().then(f => {
    document.fonts.add(f);
    fontLoaded = true;
    rerenderAllElements();
    if (typeof renderStyleSelectorThumbs === 'function') renderStyleSelectorThumbs();
  }).catch(err => console.warn('Erro ao carregar fonte logo:', err));

  // 2. Fontes Normais GTA Art Deco
  const fArtDecoMed = new FontFace('GTA Art Deco Medium', `url('Fonts/GTA Art Deco - Medium.ttf')`);
  fArtDecoMed.load().then(f => { document.fonts.add(f); rerenderAllElements(); }).catch(e => console.warn(e));

  const fArtDecoReg = new FontFace('GTA Art Deco Regular', `url('Fonts/GTA Art Deco - Regular.ttf')`);
  fArtDecoReg.load().then(f => { document.fonts.add(f); rerenderAllElements(); }).catch(e => console.warn(e));

  // 3. Fonte Clássica Pricedown
  const fPricedown = new FontFace('Pricedown', `url('Fonts/Pricedown Bl.otf')`);
  fPricedown.load().then(f => { document.fonts.add(f); rerenderAllElements(); }).catch(e => console.warn(e));

  // Imagens das palmeiras (usa Base64 para prevenir tainted canvas no protocolo file://)
  const img1 = new Image();
  img1.onload = () => {
    palmColorImg = img1;
    rerenderAllElements();
    if (typeof renderStyleSelectorThumbs === 'function') renderStyleSelectorThumbs();
  };
  img1.src = (typeof PALM_COLOR_DATA !== 'undefined') ? PALM_COLOR_DATA : PALM_COLOR_URL;

  const img2 = new Image();
  img2.onload = () => {
    palmMonoImg = img2;
    rerenderAllElements();
    if (typeof renderStyleSelectorThumbs === 'function') renderStyleSelectorThumbs();
  };
  img2.src = (typeof PALM_MONO_DATA !== 'undefined') ? PALM_MONO_DATA : PALM_MONO_URL;
}

function initKeyboardShortcuts() {
  document.addEventListener('keydown', e => {
    const tag = document.activeElement.tagName;
    if (tag === 'TEXTAREA' || tag === 'INPUT' || tag === 'SELECT') return;
    if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); deleteSelected(); }
    if (e.ctrlKey && e.key === 'z') { e.preventDefault(); undo(); }
    if (e.ctrlKey && (e.key === 'y' || e.key === 'Y')) { e.preventDefault(); redo(); }
    if (e.key === 't' || e.key === 'T') { createGTAVIElement('VICE CITY', { type: 'logo' }); }
    if (e.key === 'v' || e.key === 'V') { setActiveTool('select'); }
    if (e.key === 'Escape') { canvas.discardActiveObject(); canvas.requestRenderAll(); syncPanel(null); }
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      const obj = canvas.getActiveObject(); if (!obj) return;
      e.preventDefault();
      const step = e.shiftKey ? 15 : 2;
      const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0;
      const dy = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0;
      obj.set({ left: (obj.left || 0) + dx, top: (obj.top || 0) + dy });
      obj.setCoords();
      canvas.requestRenderAll();
    }
  });
}

// INICIALIZAÇÃO PRINCIPAL DO APP
function initApp() {
  loadAssets();
  initBackgroundGrid();
  initCharacterGrid();
  initAssetGrid();
  initUIEvents();
  initGalleryModal();
  if (typeof initProjectsModal === 'function') initProjectsModal();
  initKeyboardShortcuts();
  fitCanvas();

  // Lista de textos temáticos do GTA VI para sortear no início
  const INITIAL_TEXTS = [
    'JASON',
    'LUCIA',
    'LEONIDA',
    '19 NOVEMBER',
    'VICE CITY',
    'PORT GELLHORN',
    'AMBROSIA',
    'GRASSRIVERS',
    'LEONIDA KEYS',
    'MOUNT KALAGA',
    'VI'
  ];

  // Criação de apenas 1 elemento de texto sorteado no centro do canvas
  setTimeout(() => {
    const randomText = INITIAL_TEXTS[Math.floor(Math.random() * INITIAL_TEXTS.length)];
    const initObj = createGTAVIElement(randomText, {
      type: 'logo',
      fontSize: randomText.length <= 4 ? 320 : 220,
      top: CANVAS_H / 2,
      left: CANVAS_W / 2
    });
    canvas.setActiveObject(initObj);
    syncPanel(initObj);
    canvas.requestRenderAll();
  }, 350);
}

document.addEventListener('DOMContentLoaded', initApp);
