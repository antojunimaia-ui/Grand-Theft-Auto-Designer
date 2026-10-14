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

// ── OPACITADOR: estado de desenho ──
let isDrawingOpacityMask = false;
let opacityMaskPoints = [];
let opacityMaskPreview = null;
let opacityMaskIdCounter = 0;

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
  // Vice City .otf é demo: bloqueia dígitos (disparam watermark)
  if (isNormal && (opts.fontFamily || 'GTA Art Deco Medium') === 'Vice City' && typeof text === 'string') text = text.replace(/[0-9]/g, '');
  const renderedCanvas = renderGTAVIText(text, {
    type: opts.type || 'logo',
    style: opts.style || 'colorful',
    coverArt: opts.coverArt !== false,
    palmTree: opts.palmTree !== false,
    palmOffsetX: opts.palmOffsetX ?? 0,
    palmOffsetY: opts.palmOffsetY ?? 0,
    fontSize: opts.fontSize || (isNormal ? 72 : 260),
    letterSpacing: opts.letterSpacing !== undefined ? opts.letterSpacing : 0,
    fontFamily: opts.fontFamily || 'GTA Art Deco Medium',
    fontColor: opts.fontColor || '#ffffff',
    shadowIntensity: opts.shadowIntensity !== undefined ? opts.shadowIntensity : 50,
    glowIntensity: opts.glowIntensity !== undefined ? opts.glowIntensity : 0,
    cornersEnabled: !!opts.cornersEnabled,
    cornerTL: opts.cornerTL ?? 100, cornerTR: opts.cornerTR ?? 100, cornerBL: opts.cornerBL ?? 100, cornerBR: opts.cornerBR ?? 100,
    linearEnabled: !!opts.linearEnabled, linearIntensity: opts.linearIntensity ?? 0, linearAngle: opts.linearAngle ?? 0,
    radialEnabled: !!opts.radialEnabled, radialIntensity: opts.radialIntensity ?? 0, radialRadius: opts.radialRadius ?? 50
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
  imgObj._gtaPalmOffsetX = opts.palmOffsetX ?? 0;
  imgObj._gtaPalmOffsetY = opts.palmOffsetY ?? 0;
  imgObj._gtaFontSize = opts.fontSize || (isNormal ? 72 : 260);
  imgObj._gtaLetterSpacing = opts.letterSpacing !== undefined ? opts.letterSpacing : 0;
  imgObj._gtaFontFamily = opts.fontFamily || 'GTA Art Deco Medium';
  imgObj._gtaFontColor = opts.fontColor || '#ffffff';
  imgObj._gtaShadowIntensity = opts.shadowIntensity !== undefined ? opts.shadowIntensity : 50;
  imgObj._gtaGlowIntensity = opts.glowIntensity !== undefined ? opts.glowIntensity : 0;
  imgObj._gtaCornersEnabled = !!opts.cornersEnabled;
  imgObj._gtaCornerTL = opts.cornerTL ?? 100; imgObj._gtaCornerTR = opts.cornerTR ?? 100; imgObj._gtaCornerBL = opts.cornerBL ?? 100; imgObj._gtaCornerBR = opts.cornerBR ?? 100;
  imgObj._gtaLinearEnabled = !!opts.linearEnabled; imgObj._gtaLinearIntensity = opts.linearIntensity ?? 0; imgObj._gtaLinearAngle = opts.linearAngle ?? 0;
  imgObj._gtaRadialEnabled = !!opts.radialEnabled; imgObj._gtaRadialIntensity = opts.radialIntensity ?? 0; imgObj._gtaRadialRadius = opts.radialRadius ?? 50;
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
    palmOffsetX: obj._gtaPalmOffsetX ?? 0,
    palmOffsetY: obj._gtaPalmOffsetY ?? 0,
    fontSize: obj._gtaFontSize,
    letterSpacing: obj._gtaLetterSpacing || 0,
    fontFamily: obj._gtaFontFamily || 'GTA Art Deco Medium',
    fontColor: obj._gtaFontColor || '#ffffff',
    shadowIntensity: obj._gtaShadowIntensity !== undefined ? obj._gtaShadowIntensity : 50,
    glowIntensity: obj._gtaGlowIntensity !== undefined ? obj._gtaGlowIntensity : 0,
    cornersEnabled: !!obj._gtaCornersEnabled,
    cornerTL: obj._gtaCornerTL ?? 100, cornerTR: obj._gtaCornerTR ?? 100, cornerBL: obj._gtaCornerBL ?? 100, cornerBR: obj._gtaCornerBR ?? 100,
    linearEnabled: !!obj._gtaLinearEnabled, linearIntensity: obj._gtaLinearIntensity ?? 0, linearAngle: obj._gtaLinearAngle ?? 0,
    radialEnabled: !!obj._gtaRadialEnabled, radialIntensity: obj._gtaRadialIntensity ?? 0, radialRadius: obj._gtaRadialRadius ?? 50
  });

  obj.setElement(newCanvas);
  obj.setCoords();
  // Limpa máscara anterior para não restaurar estilo antigo ao reaplicar opacitador
  obj._maskedOriginalElement = null;
  canvas.requestRenderAll();
  // Reaplica opacitadores se este objeto for alvo de algum
  if (typeof applyOpacityMasks === 'function' && canvas.getObjects().some(o => o._isOpacityMask)) {
    const key = (typeof getObjectKey === 'function') ? getObjectKey(obj) : '';
    const isTarget = canvas.getObjects().some(m => m._isOpacityMask && Array.isArray(m._targetIds) && (m._targetIds.includes(key) || m._targetIds.includes(obj._gtaId)));
    if (isTarget) applyOpacityMasks();
  }
}

function rerenderAllElements() {
  canvas.getObjects().forEach(o => {
    if (typeof o._gtaText === 'string') updateGTAVIElement(o);
  });
}

// Rebake de nitidez: converte a escala aplicada pela alça em fontSize real.
// Texto é vetor re-renderizado — sem isso, esticar pela alça só amplia o bitmap e embaça.
function bakeTextScale(obj) {
  if (!obj || typeof obj._gtaText !== 'string') return false;
  const sx = obj.scaleX || 1, sy = obj.scaleY || 1;
  if (Math.abs(sx - 1) < 0.001 && Math.abs(sy - 1) < 0.001) return false;
  const newSize = Math.max(20, Math.min(2000, Math.round((obj._gtaFontSize || 260) * sx)));
  obj._gtaFontSize = newSize;
  obj.set({ scaleX: 1, scaleY: sy / sx });
  obj.setCoords();
  updateGTAVIElement(obj);
  const sizeEl = document.getElementById('prop-size');
  if (sizeEl) {
    if (newSize > parseInt(sizeEl.max || '600', 10)) sizeEl.max = String(newSize);
    sizeEl.value = newSize;
    const sizeVal = document.getElementById('prop-size-val');
    if (sizeVal) sizeVal.textContent = newSize;
  }
  return true;
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

// ──────────────────────────────────────────────────────────
// OPACITADOR — linha móvel que controla opacidade de alvos via checklist (sem precisar desenhar)
// ──────────────────────────────────────────────────────────
function startOpacityMaskMode() {
  // Cria direto uma linha horizontal centralizada que o usuário pode arrastar/redimensionar/rotacionar
  createOpacityLine();
  setActiveTool('select');
}

function updateOpacityMaskPreview() { /* legado — não usado no modo linha */ }
function finishOpacityMask() { /* legado */ }
function cancelOpacityMask() {
  isDrawingOpacityMask = false;
  opacityMaskPoints = [];
  if (opacityMaskPreview) { canvas.remove(opacityMaskPreview); opacityMaskPreview = null; }
  canvas.selection = true;
  canvas.defaultCursor = 'default';
  canvas.requestRenderAll();
  setActiveTool('select');
}

function createOpacityLine() {
  const lineW = Math.round(CANVAS_W * 0.65);
  const line = new fabric.Line([0, 0, lineW, 0], {
    left: CANVAS_W / 2,
    top: CANVAS_H / 2,
    originX: 'center',
    originY: 'center',
    stroke: '#ff9aa8',
    strokeWidth: 6,
    strokeLineCap: 'round',
    strokeDashArray: [12, 8],
    selectable: true,
    hasControls: true,
    hasBorders: true,
    transparentCorners: false,
    cornerColor: '#ffffff',
    cornerStrokeColor: '#ff8192',
    borderColor: '#ff8192',
    cornerSize: 10,
    objectCaching: false,
    perPixelTargetFind: false
  });
  // Fundo sutil para área de manuseio (hit area) — linha mais grossa transparente
  line._isOpacityMask = true;
  line._isOpacityLine = true;
  line._opacityMaskId = ++opacityMaskIdCounter;
  line._opacityLevel = 50;
  line._fade = 40;
  line._targetIds = [];
  line._label = 'Opacitador #' + line._opacityMaskId;
  canvas.add(line);
  canvas.setActiveObject(line);
  canvas.requestRenderAll();
  updateLayerList();
  updateStatusCount();
  syncPanel(line);
  pushHistory();
  toast('Linha opacitadora criada! Arraste/rotacione e escolha as camadas no painel');
}

function createOpacityMask(points) {
  // Normaliza pontos relativos a (0,0) para Polygon
  const poly = new fabric.Polygon(points, {
    left: 0, top: 0,
    fill: 'rgba(255,154,168,0.18)',
    stroke: '#ff9aa8',
    strokeWidth: 2,
    strokeDashArray: [6,4],
    selectable: true,
    hasControls: true,
    hasBorders: true,
    transparentCorners: false,
    cornerColor: '#ffffff',
    cornerStrokeColor: '#ff8192',
    borderColor: '#ff8192',
    cornerSize: 10,
    objectCaching: false,
    perPixelTargetFind: true
  });
  poly._isOpacityMask = true;
  poly._opacityMaskId = ++opacityMaskIdCounter;
  poly._opacityLevel = 50;
  poly._fade = 40;
  poly._targetIds = [];
  // Guarda bounding para checklist interseção opcional
  poly._label = 'Opacitador #' + poly._opacityMaskId;
  canvas.add(poly);
  canvas.setActiveObject(poly);
  canvas.requestRenderAll();
  updateLayerList();
  updateStatusCount();
  syncPanel(poly);
  pushHistory();
  toast('Opacitador criado! Selecione as camadas no painel');
}

function applyOpacityMasks() {
  const masks = canvas.getObjects().filter(o => o._isOpacityMask);
  const all = canvas.getObjects().filter(o => typeof o._gtaText === 'string' || o._isChar || o._isAsset);
  // Restaura alvos para estado sem máscara antes de reaplicar (evita acumular)
  all.forEach(obj => {
    // Restaura elemento original se foi mascarado por linha
    if (obj._maskedOriginalElement) {
      try { obj.setElement(obj._maskedOriginalElement); } catch {}
      obj._maskedOriginalElement = null;
    }
    if (obj._baseOpacity !== undefined) {
      obj.set('opacity', obj._baseOpacity);
    }
  });
  if (!masks.length) { canvas.requestRenderAll(); return; }

  // Para cada mask (linha), aplica percolado por pixel: só a parte ABAIXO da linha fica com opacidade reduzida
  masks.forEach(mask => {
    if (!Array.isArray(mask._targetIds) || !mask._targetIds.length) return;
    const level = (mask._opacityLevel ?? 50) / 100;
    const fade = mask._fade ?? 40; // px de transição suave
    // Posição Y da linha no canvas lógico (considera centro e angle 0 por enquanto; se linha rotacionada, usa top como referência)
    const lineY = mask.top; // linha horizontal -> tudo com y > lineY = abaixo
    const angle = mask.angle || 0;
    // Para linhas não horizontais, poderíamos calcular half-plane, mas por enquanto só horizontal
    const isHorizontal = Math.abs(angle) < 15 || Math.abs(angle - 180) < 15 || Math.abs(angle - 360) < 15;

    all.forEach(obj => {
      const key = getObjectKey(obj);
      const isTarget = mask._targetIds.includes(key) || mask._targetIds.includes(obj._gtaId);
      if (!isTarget) return;
      // Guarda base
      if (obj._baseOpacity === undefined) obj._baseOpacity = obj.opacity ?? 1;

      // Se for texto GTA (offCanvas), faz máscara por pixel recortando abaixo da linha
      if (typeof obj._gtaText === 'string') {
        const el = obj.getElement();
        if (!el || el.tagName !== 'CANVAS') return;
        const w = el.width, h = el.height;
        if (!w || !h) return;
        // Salva original para restauração
        if (!obj._maskedOriginalElement) {
          const orig = document.createElement('canvas');
          orig.width = w; orig.height = h;
          orig.getContext('2d').drawImage(el, 0, 0);
          obj._maskedOriginalElement = orig;
        } else {
          // Restaura original antes de reaplicar (evita dupla multiplicação)
          const ctxR = el.getContext('2d');
          ctxR.clearRect(0,0,w,h);
          ctxR.drawImage(obj._maskedOriginalElement, 0, 0);
        }
        const ctx = el.getContext('2d');
        try {
          const imgData = ctx.getImageData(0,0,w,h);
          const data = imgData.data;
          // Mapeia y do offCanvas para y no canvas principal
          // offCanvas y=0 -> mainY = obj.top - h*obj.scaleY/2 (assumindo origin center, sem rotação)
          // Para simplificar, considera scaleY e ignora rotação do texto para o recorte
          const scaleY = obj.scaleY || 1;
          const objTop = (obj.top || 0) - (h * scaleY / 2);
          for (let y = 0; y < h; y++) {
            let mult = 1;
            if (isHorizontal) {
              const pixelMainY = (obj.top || 0) + (y - h/2) * scaleY;
              const d = pixelMainY - lineY;
              if (fade <= 1) {
                if (d > 0) mult = level;
              } else {
                if (d <= 0) mult = 1;
                else if (d >= fade) mult = level;
                else {
                  let t = d / fade;
                  t = t*t*(3 - 2*t);
                  mult = 1 - (1 - level) * t;
                }
              }
            } else {
              const objBelow = (obj.top || 0) > lineY;
              mult = objBelow ? level : 1;
            }
            if (mult < 0.999) {
              for (let x = 0; x < w; x++) {
                const i = (y * w + x) * 4;
                if (data[i+3] === 0) continue;
                data[i+3] = Math.round(data[i+3] * mult);
              }
            }
          }
          ctx.putImageData(imgData, 0, 0);
          obj.setCoords(); obj.dirty = true;
        } catch {}
      } else {
        // Para imagens (char/asset): cria canvas temporário com a imagem e aplica mesmo recorte por pixel
        const el = obj.getElement();
        if (!el) return;
        const imgW = el.naturalWidth || el.width;
        const imgH = el.naturalHeight || el.height;
        if (!imgW || !imgH) return;
        // Cria offscreen para máscara
        const tmp = document.createElement('canvas');
        const tw = Math.max(1, Math.round(imgW * (obj.scaleX || 1)));
        // Mas para per-pixel precisamos mapear; mais simples: se objeto está abaixo da linha, aplica opacidade inteira
        // Para recorte parcial em imagens, faria similar ao texto: precisa mapear pixels
        // Simplificação: se objeto está abaixo, aplica opacidade total; se straddles, aplica per-pixel
        const objY = obj.top || 0;
        const halfH = (imgH * (obj.scaleY || 1)) / 2;
        const objTopY = objY - halfH, objBottomY = objY + halfH;
        if (objTopY > lineY) {
          // Totalmente abaixo -> aplica nível
          obj.set('opacity', (obj._baseOpacity ?? 1) * level);
        } else if (objBottomY < lineY) {
          // Totalmente acima -> mantém base
          obj.set('opacity', obj._baseOpacity ?? 1);
        } else {
          // Cruza a linha -> precisa per-pixel: converte imagem para canvas e recorta
          try {
            const c = document.createElement('canvas');
            c.width = imgW; c.height = imgH;
            const cctx = c.getContext('2d');
            cctx.drawImage(el, 0, 0, imgW, imgH);
            const imgData = cctx.getImageData(0,0,imgW,imgH);
            const data = imgData.data;
            const scaleY = obj.scaleY || 1;
            for (let y = 0; y < imgH; y++) {
              const mainY = (obj.top || 0) + (y - imgH/2) * scaleY;
              let mult = 1;
              if (fade <= 1) {
                if (mainY > lineY) mult = level;
              } else {
                const d = mainY - lineY;
                if (d <= 0) mult = 1;
                else if (d >= fade) mult = level;
                else {
                  let t = d / fade;
                  t = t*t*(3 - 2*t);
                  mult = 1 - (1 - level) * t;
                }
              }
              if (mult < 0.999) {
                for (let x = 0; x < imgW; x++) {
                  const i = (y * imgW + x) * 4;
                  if (data[i+3] === 0) continue;
                  data[i+3] = Math.round(data[i+3] * mult);
                }
              }
            }
            cctx.putImageData(imgData, 0, 0);
            if (!obj._maskedOriginalElement) obj._maskedOriginalElement = el;
            obj.setElement(c);
            obj.setCoords();
          } catch {
            // Fallback per-object
            obj.set('opacity', (obj._baseOpacity ?? 1) * level);
          }
        }
      }
    });
  });
  canvas.requestRenderAll();
}

function getAllTargetableObjects() {
  return canvas.getObjects().filter(o => typeof o._gtaText === 'string' || o._isChar || o._isAsset);
}

function getObjectKey(obj) {
  if (obj._gtaId) return 'gta-' + obj._gtaId;
  if (obj._charKey) return 'char-' + obj._charKey;
  if (obj._assetKey) return 'asset-' + obj._assetKey;
  return '';
}

function initOpacityMaskEvents() {
  canvas.on('mouse:down', function(opt) {
    if (!isDrawingOpacityMask) return;
    const evt = opt.e;
    // Evita clique com botão direito
    if (evt.button === 2) return;
    const pointer = canvas.getPointer(evt);
    opacityMaskPoints.push({ x: pointer.x, y: pointer.y });
    updateOpacityMaskPreview();
  });
  canvas.on('mouse:dblclick', function() {
    if (isDrawingOpacityMask) finishOpacityMask();
  });
  // Atalhos durante desenho: Enter fecha, Esc cancela
  document.addEventListener('keydown', function(e) {
    if (!isDrawingOpacityMask) return;
    if (e.key === 'Enter') { e.preventDefault(); finishOpacityMask(); }
    if (e.key === 'Escape') { e.preventDefault(); cancelOpacityMask(); }
  });
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
    toast('PNG baixado em alta resolução!');
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

// EXPORTAÇÃO PARA PDF
function exportPDF() {
  try {
    // Garante render atualizado
    canvas.requestRenderAll();
    const mult = 1 / currentZoom;
    const dataURL = canvas.toDataURL({ format: 'png', multiplier: mult, enableRetinaScaling: false });
    
    // jsPDF em landscape (1920x1080 = landscape)
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'px',
      format: [CANVAS_W, CANVAS_H],
      compress: true
    });
    
    // Adiciona imagem ao PDF (cobre página inteira)
    pdf.addImage(dataURL, 'PNG', 0, 0, CANVAS_W, CANVAS_H, '', 'FAST');
    
    // Metadados
    pdf.setProperties({
      title: 'GTA VI Artwork',
      subject: 'Created with GTA VI Canvas Designer',
      author: 'GTA VI Designer',
      keywords: 'gta, gta6, artwork, design',
      creator: 'https://github.com/antojunimaia-ui/Grand-Theft-Auto-Designer'
    });
    
    // Salva
    pdf.save('gta-vi-artwork.pdf');
    toast('PDF baixado! Pronto para impressão 🔥');
  } catch (err) {
    console.error('Erro ao exportar PDF:', err);
    const isTainted = err && err.name === 'SecurityError' || /tainted|toDataURL/i.test(err.message || '');
    if (isTainted) {
      toast('Export PDF bloqueado por CORS. Use servidor HTTP (não file://)');
    } else {
      toast('Erro ao gerar PDF: ' + (err.message || err));
    }
  }
}
