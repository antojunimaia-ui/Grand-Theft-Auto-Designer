// ──────────────────────────────────────────────────────────
// INTERFACE DE USUÁRIO & SINCRONIZAÇÃO DE PAINEL
// ──────────────────────────────────────────────────────────

let draggedLayerObj = null;

function getActiveGTAObj() {
  const o = canvas.getActiveObject();
  if (o && (typeof o._gtaText === 'string' || o._isChar || o._isAsset)) return o;
  const sel = canvas.getActiveObjects();
  if (sel.length === 1 && (typeof sel[0]._gtaText === 'string' || sel[0]._isChar)) return sel[0];
  return null;
}

function syncPanel(obj) {
  const noSel = document.getElementById('panel-no-sel');
  const selPanel = document.getElementById('panel-selection');
  const statusSel = document.getElementById('status-sel');
  const dockTitle = document.getElementById('dock-active-title');
  
  if (!obj) {
    noSel.style.display = '';
    selPanel.style.display = 'none';
    statusSel.style.display = 'none';
    return;
  }
  noSel.style.display = 'none';
  selPanel.style.display = '';
  statusSel.style.display = '';

  const isChar = !!obj._isChar;
  const isAsset = !!obj._isAsset;
  const isNormal = obj._gtaType === 'normal';

  const displayName = isAsset ? `Asset: ${obj._assetLabel}` : isChar ? `Personagem: ${obj._charLabel}` : (obj._gtaText || '(vazio)');
  document.getElementById('status-selname').textContent = displayName;

  // Mostra/esconde seções baseadas no tipo de elemento selecionado
  document.getElementById('prop-text').parentElement.style.display = isChar ? 'none' : '';
  document.getElementById('section-logo-styles').style.display = (!isChar && !isNormal) ? '' : 'none';
  document.getElementById('section-normal-styles').style.display = (!isChar && isNormal) ? '' : 'none';
  document.getElementById('prop-spacing').parentElement.style.display = isChar ? 'none' : '';
  document.getElementById('prop-size').parentElement.style.display = isChar ? 'none' : '';

  if (!isChar && !isAsset) {
    document.getElementById('prop-text').value = obj._gtaText;
    document.getElementById('prop-size').value = obj._gtaFontSize;
    document.getElementById('prop-size-val').textContent = obj._gtaFontSize;
    
    const sp = obj._gtaLetterSpacing !== undefined ? obj._gtaLetterSpacing : 0;
    document.getElementById('prop-spacing').value = sp;
    document.getElementById('prop-spacing-val').textContent = sp;

    if (isNormal) {
      document.getElementById('prop-font-variant').value = obj._gtaFontFamily || 'GTA Art Deco Medium';
      document.getElementById('prop-normal-color').value = obj._gtaFontColor || '#ffffff';
      document.getElementById('prop-normal-color-val').textContent = (obj._gtaFontColor || '#ffffff').toUpperCase();
    } else {
      document.getElementById('opt-style-color').classList.toggle('active', obj._gtaStyle === 'colorful');
      document.getElementById('opt-style-mono').classList.toggle('active', obj._gtaStyle === 'mono');
      document.getElementById('opt-style-outline').classList.toggle('active', obj._gtaStyle === 'outline');
      document.getElementById('toggle-cover-art').classList.toggle('active', !!obj._gtaCoverArt);
      document.getElementById('toggle-palm-tree').classList.toggle('active', !!obj._gtaPalmTree);
      document.getElementById('row-palm-tree').style.opacity = obj._gtaStyle === 'mono' ? '1' : '0.3';
      document.getElementById('row-palm-tree').style.pointerEvents = obj._gtaStyle === 'mono' ? '' : 'none';
    }
  }

  // Controles de opacidade e rotação para todos os objetos
  const op = Math.round((obj.opacity ?? 1) * 100);
  document.getElementById('prop-opacity').value = op;
  document.getElementById('prop-opacity-val').textContent = op + '%';

  document.getElementById('prop-rotate').value = Math.round(obj.angle || 0);
  document.getElementById('prop-rotate-val').textContent = Math.round(obj.angle || 0) + '°';

  // Efeitos visuais (shadow / glow) — apenas em elementos GTA (não personagens)
  if (typeof obj._gtaText === 'string') {
    const shadow = obj._gtaShadowIntensity !== undefined ? obj._gtaShadowIntensity : 50;
    const glow   = obj._gtaGlowIntensity !== undefined ? obj._gtaGlowIntensity : 0;
    document.getElementById('prop-shadow').value = shadow;
    document.getElementById('prop-shadow-val').textContent = shadow;
    document.getElementById('prop-glow').value = glow;
    document.getElementById('prop-glow-val').textContent = glow;
  }
}

function updateLayerList() {
  const list = document.getElementById('layer-list');
  const allObjects = canvas.getObjects();
  const objs = allObjects.filter(o => typeof o._gtaText === 'string' || o._isChar || o._isAsset);
  if (!objs.length) {
    list.innerHTML = '<div style="font-size:11px;color:var(--muted);text-align:center;padding:8px 0">Nenhuma camada</div>';
    return;
  }
  list.innerHTML = '';

  // Exibe as camadas do topo para o fundo
  [...objs].reverse().forEach((obj, visualIndex) => {
    const isActive = canvas.getActiveObject() === obj;
    const item = document.createElement('div');
    item.className = 'layer-item' + (isActive ? ' active' : '');
    item.draggable = true;

    const displayName = obj._isAsset
      ? `🌴 ${obj._assetLabel}`
      : obj._isChar
      ? `🧍 ${obj._charLabel}`
      : (obj._gtaLabel || obj._gtaText || '(vazio)');

    item.innerHTML = `
      <span class="drag-handle" title="Arraste para reordenar">&#10495;</span>
      <span class="layer-name">${displayName}</span>
      <button class="layer-del" title="Deletar camada">&#10005;</button>
    `;

    item.onclick = e => {
      if (e.target.classList.contains('layer-del')) {
        canvas.remove(obj);
        canvas.discardActiveObject();
        updateLayerList();
        updateStatusCount();
        syncPanel(null);
        pushHistory();
        return;
      }
      canvas.setActiveObject(obj);
      canvas.requestRenderAll();
      syncPanel(obj);
      updateLayerList();
    };

    // Eventos de Drag & Drop
    item.ondragstart = e => {
      draggedLayerObj = obj;
      item.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', '');
    };

    item.ondragend = () => {
      draggedLayerObj = null;
      document.querySelectorAll('.layer-item').forEach(el => {
        el.classList.remove('dragging', 'drag-over');
      });
    };

    item.ondragover = e => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      if (draggedLayerObj && draggedLayerObj !== obj) {
        item.classList.add('drag-over');
      }
    };

    item.ondragleave = () => {
      item.classList.remove('drag-over');
    };

    item.ondrop = e => {
      e.preventDefault();
      item.classList.remove('drag-over');
      if (!draggedLayerObj || draggedLayerObj === obj) return;

      const currentList = canvas.getObjects();
      const fromIndex = currentList.indexOf(draggedLayerObj);
      const toIndex = currentList.indexOf(obj);

      if (fromIndex !== -1 && toIndex !== -1) {
        draggedLayerObj.moveTo(toIndex);
        canvas.requestRenderAll();
        updateLayerList();
        pushHistory();
        toast('Camada reordenada!');
      }
    };

    list.appendChild(item);
  });
}

function updateStatusCount() {
  document.getElementById('status-count').textContent = canvas.getObjects().filter(o => typeof o._gtaText === 'string' || o._isChar || o._isAsset).length;
}

function setActiveTool(tool) {
  document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
  const btn = document.getElementById('tool-' + tool);
  if (btn) btn.classList.add('active');
}

function deleteSelected() {
  const objs = canvas.getActiveObjects();
  if (!objs.length) return;
  objs.forEach(o => canvas.remove(o));
  canvas.discardActiveObject();
  canvas.requestRenderAll();
  updateLayerList();
  updateStatusCount();
  syncPanel(null);
  pushHistory();
  toast('Deletado!');
}

// INICIALIZADOR DE EVENTOS DA INTERFACE
function initUIEvents() {
  canvas.on('selection:created', () => syncPanel(getActiveGTAObj()));
  canvas.on('selection:updated', () => syncPanel(getActiveGTAObj()));
  canvas.on('selection:cleared', () => syncPanel(null));
  canvas.on('object:modified', () => { syncPanel(getActiveGTAObj()); pushHistory(); });

  // Handlers de Mudança nas Propriedades
  document.getElementById('prop-text').oninput = e => {
    const obj = getActiveGTAObj(); if (!obj) return;
    obj._gtaText = e.target.value;
    obj._gtaLabel = (obj._gtaType === 'normal' ? 'Subtítulo: ' : 'Logo: ') + (obj._gtaText || '(vazio)');
    updateGTAVIElement(obj);
    updateLayerList();
    document.getElementById('status-selname').textContent = obj._gtaText || '(vazio)';
  };

  document.getElementById('prop-size').oninput = e => {
    const obj = getActiveGTAObj(); if (!obj) return;
    const v = parseInt(e.target.value);
    document.getElementById('prop-size-val').textContent = v;
    obj._gtaFontSize = v;
    updateGTAVIElement(obj);
  };

  document.getElementById('prop-spacing').oninput = e => {
    const obj = getActiveGTAObj(); if (!obj) return;
    const v = parseInt(e.target.value);
    document.getElementById('prop-spacing-val').textContent = v;
    obj._gtaLetterSpacing = v;
    updateGTAVIElement(obj);
  };

  document.getElementById('prop-font-variant').onchange = e => {
    const obj = getActiveGTAObj(); if (!obj) return;
    obj._gtaFontFamily = e.target.value;
    updateGTAVIElement(obj);
  };

  document.getElementById('prop-normal-color').oninput = e => {
    const obj = getActiveGTAObj(); if (!obj) return;
    obj._gtaFontColor = e.target.value;
    document.getElementById('prop-normal-color-val').textContent = e.target.value.toUpperCase();
    updateGTAVIElement(obj);
  };

  document.getElementById('prop-opacity').oninput = e => {
    const obj = getActiveGTAObj(); if (!obj) return;
    const v = parseInt(e.target.value);
    document.getElementById('prop-opacity-val').textContent = v + '%';
    obj.set('opacity', v / 100);
    canvas.requestRenderAll();
  };

  document.getElementById('prop-rotate').oninput = e => {
    const obj = getActiveGTAObj(); if (!obj) return;
    const v = parseInt(e.target.value);
    document.getElementById('prop-rotate-val').textContent = v + '°';
    obj.set('angle', v);
    canvas.requestRenderAll();
  };

  document.getElementById('prop-shadow').oninput = e => {
    const obj = getActiveGTAObj(); if (!obj || typeof obj._gtaText !== 'string') return;
    const v = parseInt(e.target.value);
    document.getElementById('prop-shadow-val').textContent = v;
    obj._gtaShadowIntensity = v;
    updateGTAVIElement(obj);
  };

  document.getElementById('prop-glow').oninput = e => {
    const obj = getActiveGTAObj(); if (!obj || typeof obj._gtaText !== 'string') return;
    const v = parseInt(e.target.value);
    document.getElementById('prop-glow-val').textContent = v;
    obj._gtaGlowIntensity = v;
    updateGTAVIElement(obj);
  };

  // Alternadores de Estilo GTA VI
  document.getElementById('opt-style-color').onclick = () => {
    const obj = getActiveGTAObj(); if (!obj) return;
    obj._gtaStyle = 'colorful';
    syncPanel(obj);
    updateGTAVIElement(obj);
    pushHistory();
  };

  document.getElementById('opt-style-mono').onclick = () => {
    const obj = getActiveGTAObj(); if (!obj) return;
    obj._gtaStyle = 'mono';
    syncPanel(obj);
    updateGTAVIElement(obj);
    pushHistory();
  };

  document.getElementById('opt-style-outline').onclick = () => {
    const obj = getActiveGTAObj(); if (!obj) return;
    obj._gtaStyle = 'outline';
    syncPanel(obj);
    updateGTAVIElement(obj);
    pushHistory();
  };

  document.getElementById('toggle-cover-art').onclick = function() {
    const obj = getActiveGTAObj(); if (!obj) return;
    obj._gtaCoverArt = !obj._gtaCoverArt;
    this.classList.toggle('active', obj._gtaCoverArt);
    updateGTAVIElement(obj);
    pushHistory();
  };

  document.getElementById('toggle-palm-tree').onclick = function() {
    const obj = getActiveGTAObj(); if (!obj) return;
    obj._gtaPalmTree = !obj._gtaPalmTree;
    this.classList.toggle('active', obj._gtaPalmTree);
    updateGTAVIElement(obj);
    pushHistory();
  };

  // Ações de Posição & Camadas
  document.getElementById('btn-center-h').onclick = () => {
    const o = getActiveGTAObj();
    if (o) { o.set('left', CANVAS_W / 2); o.setCoords(); canvas.requestRenderAll(); pushHistory(); }
  };
  document.getElementById('btn-center-v').onclick = () => {
    const o = getActiveGTAObj();
    if (o) { o.set('top', CANVAS_H / 2); o.setCoords(); canvas.requestRenderAll(); pushHistory(); }
  };
  document.getElementById('btn-bring-front').onclick = () => {
    const o = getActiveGTAObj();
    if (o) { canvas.bringToFront(o); canvas.requestRenderAll(); updateLayerList(); pushHistory(); }
  };
  document.getElementById('btn-send-back').onclick = () => {
    const o = getActiveGTAObj();
    if (o) { canvas.sendToBack(o); canvas.requestRenderAll(); updateLayerList(); pushHistory(); }
  };

  // Toolbar & Atalhos
  document.getElementById('tool-select').onclick = () => setActiveTool('select');
  document.getElementById('tool-addtext').onclick = () => {
    createGTAVIElement('VICE CITY', { type: 'logo', fontSize: 240, top: CANVAS_H / 2 });
    setActiveTool('select');
    toast('Logo GTA VI adicionado!');
  };
  document.getElementById('tool-addnormal').onclick = () => {
    createGTAVIElement('COMING 2026', { type: 'normal', fontSize: 72, fontFamily: 'GTA Art Deco Medium', fontColor: '#ffffff', top: CANVAS_H / 2 + 200 });
    setActiveTool('select');
    toast('Subtítulo GTA Art Deco adicionado!');
  };
  document.getElementById('tool-bg').onclick = () => {
    const el = document.getElementById('panel-bg');
    if (el && typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ behavior: 'smooth' });
      toast('Escolha um background');
    } else if (typeof openGallery === 'function') {
      openGallery('bg');
    } else {
      toast('Escolha um background');
    }
  };
  document.getElementById('tool-delete').onclick = deleteSelected;

  document.getElementById('btn-clear').onclick = () => {
    if (!confirm('Deseja limpar todo o canvas?')) return;
    canvas.getObjects().slice().forEach(o => canvas.remove(o));
    canvas.setBackgroundImage(null, canvas.renderAll.bind(canvas));
    setBackground('transparent');
    const bgGrid = document.getElementById('bg-grid');
    if (bgGrid) {
      bgGrid.querySelectorAll('.bg-thumb').forEach(t => t.classList.toggle('active', t.dataset.bg === 'transparent'));
    }
    updateLayerList();
    updateStatusCount();
    syncPanel(null);
    pushHistory();
    toast('Canvas limpo!');
  };

  document.getElementById('btn-undo').onclick = undo;
  document.getElementById('btn-redo').onclick = redo;
  document.getElementById('btn-export').onclick = exportPNG;

  // Zoom
  document.getElementById('zoom-in').onclick = () => { currentZoom = Math.min(currentZoom + 0.1, 3); applyZoom(); };
  document.getElementById('zoom-out').onclick = () => { currentZoom = Math.max(currentZoom - 0.1, 0.1); applyZoom(); };
  document.getElementById('zoom-reset').onclick = fitCanvas;

  window.addEventListener('resize', fitCanvas);
  
  // Renderiza miniaturas fiéis aos estilos reais nos botões seletores
  renderStyleSelectorThumbs();
}

// Recorta bordas transparentes para miniaturas perfeitas
function trimCanvasTransparent(srcCanvas) {
  const ctx = srcCanvas.getContext('2d');
  if (!ctx) return srcCanvas;
  const w = srcCanvas.width;
  const h = srcCanvas.height;
  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;

  let minX = w, minY = h, maxX = 0, maxY = 0;
  let found = false;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const alpha = data[(y * w + x) * 4 + 3];
      if (alpha > 5) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        found = true;
      }
    }
  }

  if (!found) return srcCanvas;

  const pad = 2;
  minX = Math.max(0, minX - pad);
  minY = Math.max(0, minY - pad);
  maxX = Math.min(w - 1, maxX + pad);
  maxY = Math.min(h - 1, maxY + pad);

  const cropW = maxX - minX + 1;
  const cropH = maxY - minY + 1;

  const cropped = document.createElement('canvas');
  cropped.width = cropW;
  cropped.height = cropH;
  const cCtx = cropped.getContext('2d');
  cCtx.drawImage(srcCanvas, minX, minY, cropW, cropH, 0, 0, cropW, cropH);
  return cropped;
}

function renderStyleSelectorThumbs() {
  const btn = document.getElementById('opt-style-outline');
  if (!btn) return;
  try {
    const fullCanvas = renderGTAVIText('VI', {
      type: 'logo',
      style: 'outline',
      fontSize: 240,
      coverArt: true,
      shadowIntensity: 0,
      glowIntensity: 0
    });
    const trimmed = trimCanvasTransparent(fullCanvas);
    btn.innerHTML = '';
    trimmed.style.height = '30px';
    trimmed.style.width = 'auto';
    trimmed.style.maxWidth = '100%';
    trimmed.style.display = 'block';
    trimmed.style.margin = 'auto';
    btn.appendChild(trimmed);
  } catch (e) {
    console.warn('Aguardando fonte para renderizar miniatura do outline', e);
  }
}
