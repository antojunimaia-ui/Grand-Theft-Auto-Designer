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
  const isMask = !!obj._isOpacityMask;
  const isNormal = obj._gtaType === 'normal';

  const displayName = isMask ? (obj._label || `Opacitador #${obj._opacityMaskId||''}`) : isAsset ? `Asset: ${obj._assetLabel}` : isChar ? `Personagem: ${obj._charLabel}` : (obj._gtaText || '(vazio)');
  document.getElementById('status-selname').textContent = displayName;

  // Mostra/esconde seções baseadas no tipo de elemento selecionado
  document.getElementById('prop-text').parentElement.style.display = (isChar || isMask) ? 'none' : '';
  document.getElementById('section-logo-styles').style.display = (!isChar && !isMask && !isNormal) ? '' : 'none';
  document.getElementById('section-normal-styles').style.display = (!isChar && !isMask && isNormal) ? '' : 'none';
  document.getElementById('prop-spacing').parentElement.style.display = (isChar || isMask) ? 'none' : '';
  document.getElementById('prop-size').parentElement.style.display = (isChar || isMask) ? 'none' : '';
  // Opacitador
  const maskSec = document.getElementById('section-opacity-mask');
  if (maskSec) maskSec.style.display = isMask ? '' : 'none';
  // Opacidade avançada só para textos GTA (não mask/char)
  const advSec = document.getElementById('section-advanced-opacity');
  if (advSec) advSec.style.display = (!isChar && !isMask && typeof obj._gtaText === 'string') ? '' : 'none';

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
  if (typeof obj._gtaText === 'string' && !isMask) {
    const shadow = obj._gtaShadowIntensity !== undefined ? obj._gtaShadowIntensity : 50;
    const glow   = obj._gtaGlowIntensity !== undefined ? obj._gtaGlowIntensity : 0;
    document.getElementById('prop-shadow').value = shadow;
    document.getElementById('prop-shadow-val').textContent = shadow;
    document.getElementById('prop-glow').value = glow;
    document.getElementById('prop-glow-val').textContent = glow;
    // Opacidade avançada
    const tl = obj._gtaCornerTL ?? 100, tr = obj._gtaCornerTR ?? 100, bl = obj._gtaCornerBL ?? 100, br = obj._gtaCornerBR ?? 100;
    document.getElementById('prop-corner-tl').value = tl; document.getElementById('prop-corner-tl-val').textContent = tl + '%';
    document.getElementById('prop-corner-tr').value = tr; document.getElementById('prop-corner-tr-val').textContent = tr + '%';
    document.getElementById('prop-corner-bl').value = bl; document.getElementById('prop-corner-bl-val').textContent = bl + '%';
    document.getElementById('prop-corner-br').value = br; document.getElementById('prop-corner-br-val').textContent = br + '%';
    document.getElementById('prop-linear-intensity').value = obj._gtaLinearIntensity ?? 0; document.getElementById('prop-linear-intensity-val').textContent = (obj._gtaLinearIntensity ?? 0) + '%';
    document.getElementById('prop-linear-angle').value = obj._gtaLinearAngle ?? 0; document.getElementById('prop-linear-angle-val').textContent = (obj._gtaLinearAngle ?? 0) + '°';
    document.getElementById('prop-radial-intensity').value = obj._gtaRadialIntensity ?? 0; document.getElementById('prop-radial-intensity-val').textContent = (obj._gtaRadialIntensity ?? 0) + '%';
    document.getElementById('prop-radial-radius').value = obj._gtaRadialRadius ?? 50; document.getElementById('prop-radial-radius-val').textContent = (obj._gtaRadialRadius ?? 50) + '%';
    // Toggle panels visibilidade
    const cornersOn = !!obj._gtaCornersEnabled;
    const linearOn = !!obj._gtaLinearEnabled;
    const radialOn = !!obj._gtaRadialEnabled;
    document.getElementById('adv-corners-panel').style.display = cornersOn ? '' : 'none';
    document.getElementById('adv-linear-panel').style.display = linearOn ? '' : 'none';
    document.getElementById('adv-radial-panel').style.display = radialOn ? '' : 'none';
    document.getElementById('btn-adv-corners')?.classList.toggle('active', cornersOn);
    document.getElementById('btn-adv-linear')?.classList.toggle('active', linearOn);
    document.getElementById('btn-adv-radial')?.classList.toggle('active', radialOn);
  }
  // Opacitador: popula checklist, nível e fade
  if (isMask) {
    const lvl = obj._opacityLevel ?? 50;
    const fade = obj._fade ?? 40;
    document.getElementById('prop-mask-opacity').value = lvl;
    document.getElementById('prop-mask-opacity-val').textContent = lvl + '%';
    const fadeEl = document.getElementById('prop-mask-fade');
    if (fadeEl) { fadeEl.value = fade; document.getElementById('prop-mask-fade-val').textContent = fade + 'px'; }
    renderMaskTargetList(obj);
  }
}

function renderMaskTargetList(maskObj) {
  const container = document.getElementById('mask-target-list');
  if (!container || !maskObj) return;
  const targets = getAllTargetableObjects();
  container.innerHTML = '';
  if (!targets.length) {
    container.innerHTML = '<div style="font-size:11px;color:var(--muted);text-align:center;padding:8px">Nenhuma camada para afetar</div>';
    return;
  }
  targets.forEach(obj => {
    const key = getObjectKey(obj);
    const label = obj._isAsset ? `🌴 ${obj._assetLabel}` : obj._isChar ? `🧍 ${obj._charLabel}` : (obj._gtaLabel || obj._gtaText || '(vazio)');
    const checked = Array.isArray(maskObj._targetIds) && maskObj._targetIds.includes(key);
    const row = document.createElement('label');
    row.style.cssText = 'display:flex;align-items:center;gap:8px;padding:6px 8px;border-radius:6px;cursor:pointer;font-size:11px;transition:background .15s;';
    row.onmouseenter = () => row.style.background = 'rgba(255,255,255,0.06)';
    row.onmouseleave = () => row.style.background = '';
    row.innerHTML = `<input type="checkbox" ${checked ? 'checked' : ''} style="accent-color:#ff9aa8"><span style="flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${label}</span>`;
    const cb = row.querySelector('input');
    cb.onchange = () => {
      if (!Array.isArray(maskObj._targetIds)) maskObj._targetIds = [];
      if (cb.checked) { if (!maskObj._targetIds.includes(key)) maskObj._targetIds.push(key); }
      else { maskObj._targetIds = maskObj._targetIds.filter(k => k !== key); }
      applyOpacityMasks();
      pushHistory();
    };
    container.appendChild(row);
  });
}

function updateLayerList() {
  const list = document.getElementById('layer-list');
  const allObjects = canvas.getObjects();
  const objs = allObjects.filter(o => typeof o._gtaText === 'string' || o._isChar || o._isAsset || o._isOpacityMask);
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

    const displayName = obj._isOpacityMask
      ? `◧ ${obj._label || 'Opacitador'}`
      : obj._isAsset
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
  document.getElementById('status-count').textContent = canvas.getObjects().filter(o => typeof o._gtaText === 'string' || o._isChar || o._isAsset || o._isOpacityMask).length;
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
  function syncActive() {
    const raw = canvas.getActiveObject();
    if (raw && raw._isOpacityMask) { syncPanel(raw); return; }
    syncPanel(getActiveGTAObj());
  }
  canvas.on('selection:created', syncActive);
  canvas.on('selection:updated', syncActive);
  canvas.on('selection:cleared', () => syncPanel(null));
  canvas.on('object:modified', () => { syncActive(); pushHistory(); if (canvas.getObjects().some(o=>o._isOpacityMask) && typeof applyOpacityMasks === 'function') applyOpacityMasks(); });
  canvas.on('object:moving', () => { if (canvas.getObjects().some(o=>o._isOpacityMask) && typeof applyOpacityMasks === 'function') { clearTimeout(window._maskMoveTimer); window._maskMoveTimer = setTimeout(applyOpacityMasks, 30); } });

  // Handlers de Mudança nas Propriedades
  document.getElementById('prop-text').oninput = e => {
    const obj = getActiveGTAObj(); if (!obj) return;
    let v = e.target.value;
    // Vice City .otf é demo: dígitos disparam watermark
    if (obj._gtaType === 'normal' && obj._gtaFontFamily === 'Vice City' && /[0-9]/.test(v)) {
      v = v.replace(/[0-9]/g, '');
      e.target.value = v;
      toast('Vice City não suporta números (fonte demo)');
    }
    obj._gtaText = v;
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
    if (obj._gtaType === 'normal' && obj._gtaFontFamily === 'Vice City' && /[0-9]/.test(obj._gtaText || '')) {
      obj._gtaText = (obj._gtaText || '').replace(/[0-9]/g, '');
      document.getElementById('prop-text').value = obj._gtaText;
      toast('Números removidos: Vice City não suporta dígitos (fonte demo)');
    }
    updateGTAVIElement(obj);
  };

  document.getElementById('prop-normal-color').oninput = e => {
    const obj = getActiveGTAObj(); if (!obj) return;
    obj._gtaFontColor = e.target.value;
    document.getElementById('prop-normal-color-val').textContent = e.target.value.toUpperCase();
    updateGTAVIElement(obj);
  };

  document.getElementById('prop-opacity').oninput = e => {
    const obj = getActiveGTAObj() || canvas.getActiveObject();
    if (!obj) return;
    const v = parseInt(e.target.value);
    document.getElementById('prop-opacity-val').textContent = v + '%';
    obj.set('opacity', v / 100);
    obj._baseOpacity = v / 100;
    canvas.requestRenderAll();
    if (typeof applyOpacityMasks === 'function' && canvas.getObjects().some(o=>o._isOpacityMask)) applyOpacityMasks();
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

  // Opacitador
  document.getElementById('tool-opacity')?.addEventListener('click', () => {
    if (typeof startOpacityMaskMode === 'function') startOpacityMaskMode();
  });
  document.getElementById('prop-mask-opacity')?.addEventListener('input', e => {
    const mask = canvas.getActiveObject();
    if (!mask || !mask._isOpacityMask) return;
    const v = parseInt(e.target.value);
    document.getElementById('prop-mask-opacity-val').textContent = v + '%';
    mask._opacityLevel = v;
    applyOpacityMasks();
  });
  document.getElementById('prop-mask-fade')?.addEventListener('input', e => {
    const mask = canvas.getActiveObject();
    if (!mask || !mask._isOpacityMask) return;
    const v = parseInt(e.target.value);
    document.getElementById('prop-mask-fade-val').textContent = v + 'px';
    mask._fade = v;
    applyOpacityMasks();
  });
  document.getElementById('btn-mask-select-all')?.addEventListener('click', () => {
    const mask = canvas.getActiveObject();
    if (!mask || !mask._isOpacityMask) return;
    mask._targetIds = getAllTargetableObjects().map(o => getObjectKey(o));
    renderMaskTargetList(mask);
    applyOpacityMasks(); pushHistory();
  });
  document.getElementById('btn-mask-clear')?.addEventListener('click', () => {
    const mask = canvas.getActiveObject();
    if (!mask || !mask._isOpacityMask) return;
    mask._targetIds = [];
    renderMaskTargetList(mask);
    if (typeof applyOpacityMasks === 'function') applyOpacityMasks();
    pushHistory();
  });
  document.getElementById('btn-mask-edit')?.addEventListener('click', () => {
    const mask = canvas.getActiveObject();
    if (!mask || !mask._isOpacityMask) return;
    // Reentra em modo desenho editando pontos atuais
    const pts = mask.get('points') || [];
    // Converte pontos relativos para absolutos
    const abs = pts.map(p => ({ x: p.x + mask.left, y: p.y + mask.top }));
    canvas.remove(mask);
    opacityMaskPoints = abs;
    isDrawingOpacityMask = true;
    canvas.selection = false;
    canvas.defaultCursor = 'crosshair';
    setActiveTool('opacity');
    updateOpacityMaskPreview();
    toast('Editando forma — clique para adicionar pontos, Enter para concluir');
  });
  document.getElementById('btn-mask-delete')?.addEventListener('click', () => {
    const mask = canvas.getActiveObject();
    if (!mask || !mask._isOpacityMask) return;
    canvas.remove(mask);
    canvas.discardActiveObject();
    updateLayerList(); updateStatusCount(); syncPanel(null);
    if (typeof applyOpacityMasks === 'function') applyOpacityMasks();
    else canvas.requestRenderAll();
    pushHistory(); toast('Opacitador removido');
  });

  // Opacidade avançada — textos
  function bindAdvSlider(id, prop, isAngle) {
    document.getElementById(id)?.addEventListener('input', e => {
      const obj = getActiveGTAObj(); if (!obj || typeof obj._gtaText !== 'string') return;
      const v = parseInt(e.target.value);
      obj[prop] = v;
      document.getElementById(id + '-val').textContent = v + (isAngle ? '°' : '%');
      updateGTAVIElement(obj);
    });
  }
  bindAdvSlider('prop-corner-tl', '_gtaCornerTL');
  bindAdvSlider('prop-corner-tr', '_gtaCornerTR');
  bindAdvSlider('prop-corner-bl', '_gtaCornerBL');
  bindAdvSlider('prop-corner-br', '_gtaCornerBR');
  bindAdvSlider('prop-linear-intensity', '_gtaLinearIntensity');
  bindAdvSlider('prop-linear-angle', '_gtaLinearAngle', true);
  bindAdvSlider('prop-radial-intensity', '_gtaRadialIntensity');
  bindAdvSlider('prop-radial-radius', '_gtaRadialRadius');
  document.getElementById('btn-adv-corners')?.addEventListener('click', function() {
    const obj = getActiveGTAObj(); if (!obj) return;
    obj._gtaCornersEnabled = !obj._gtaCornersEnabled;
    this.classList.toggle('active', obj._gtaCornersEnabled);
    document.getElementById('adv-corners-panel').style.display = obj._gtaCornersEnabled ? '' : 'none';
    updateGTAVIElement(obj); pushHistory();
  });
  document.getElementById('btn-adv-linear')?.addEventListener('click', function() {
    const obj = getActiveGTAObj(); if (!obj) return;
    obj._gtaLinearEnabled = !obj._gtaLinearEnabled;
    this.classList.toggle('active', obj._gtaLinearEnabled);
    document.getElementById('adv-linear-panel').style.display = obj._gtaLinearEnabled ? '' : 'none';
    updateGTAVIElement(obj); pushHistory();
  });
  document.getElementById('btn-adv-radial')?.addEventListener('click', function() {
    const obj = getActiveGTAObj(); if (!obj) return;
    obj._gtaRadialEnabled = !obj._gtaRadialEnabled;
    this.classList.toggle('active', obj._gtaRadialEnabled);
    document.getElementById('adv-radial-panel').style.display = obj._gtaRadialEnabled ? '' : 'none';
    updateGTAVIElement(obj); pushHistory();
  });
  document.getElementById('btn-adv-reset')?.addEventListener('click', () => {
    const obj = getActiveGTAObj(); if (!obj) return;
    obj._gtaCornersEnabled = false; obj._gtaLinearEnabled = false; obj._gtaRadialEnabled = false;
    obj._gtaCornerTL = obj._gtaCornerTR = obj._gtaCornerBL = obj._gtaCornerBR = 100;
    obj._gtaLinearIntensity = 0; obj._gtaLinearAngle = 0;
    obj._gtaRadialIntensity = 0; obj._gtaRadialRadius = 50;
    syncPanel(obj); updateGTAVIElement(obj); pushHistory(); toast('Opacidade avançada resetada');
  });

  document.getElementById('btn-undo').onclick = undo;
  document.getElementById('btn-redo').onclick = redo;
  
  // Export dropdown
  document.getElementById('btn-export-png').onclick = exportPNG;
  document.getElementById('btn-export-pdf').onclick = exportPDF;
  
  // Toggle dropdown ao clicar no botão principal
  document.getElementById('btn-export').onclick = (e) => {
    e.stopPropagation();
    const dropdown = document.querySelector('.export-dropdown');
    dropdown.classList.toggle('active');
  };
  
  // Fecha dropdown ao clicar fora
  document.addEventListener('click', () => {
    document.querySelector('.export-dropdown')?.classList.remove('active');
  });

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
