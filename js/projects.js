// ──────────────────────────────────────────────────────────
// GERENCIADOR DE PROJETOS (Salvar / Carregar)
// ──────────────────────────────────────────────────────────

const PROJECTS_LS_KEY = 'gta_vi_projects_v1';

function getProjects() {
  try {
    const raw = localStorage.getItem(PROJECTS_LS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch (e) {
    console.warn('Falha ao ler projetos do localStorage', e);
    return [];
  }
}

function setProjects(arr) {
  localStorage.setItem(PROJECTS_LS_KEY, JSON.stringify(arr));
}

function serializeCanvasObjects() {
  // Mesmo formato do history.js + preservação da ordem (bottom -> top)
  const objs = canvas.getObjects().filter(o => typeof o._gtaText === 'string' || o._isChar || o._isAsset || o._isOpacityMask);
  return objs.map(o => {
    if (o._isOpacityMask) {
      return {
        _isOpacityMask: true,
        id: o._opacityMaskId,
        label: o._label,
        isLine: !!o._isOpacityLine,
        points: o.get('points') ? o.get('points').map(p => ({ x: p.x, y: p.y })) : [],
        x1: o.x1, y1: o.y1, x2: o.x2, y2: o.y2,
        left: o.left, top: o.top, angle: o.angle, scaleX: o.scaleX, scaleY: o.scaleY, opacity: o.opacity,
        opacityLevel: o._opacityLevel ?? 50, fade: o._fade ?? 40,
        targetIds: Array.isArray(o._targetIds) ? o._targetIds.slice() : []
      };
    }
    if (o._isAsset) {
      return {
        _isAsset: true,
        file: o._assetFile,
        key: o._assetKey,
        label: o._assetLabel,
        left: o.left,
        top: o.top,
        angle: o.angle,
        scaleX: o.scaleX,
        scaleY: o.scaleY,
        opacity: o.opacity
      };
    }
    if (o._isChar) {
      return {
        _isChar: true,
        file: o._charFile,
        key: o._charKey,
        label: o._charLabel,
        left: o.left,
        top: o.top,
        angle: o.angle,
        scaleX: o.scaleX,
        scaleY: o.scaleY,
        opacity: o.opacity
      };
    }
    return {
      _isGTA: true,
      type: o._gtaType,
      text: o._gtaText,
      style: o._gtaStyle,
      coverArt: o._gtaCoverArt,
      palmTree: o._gtaPalmTree,
      fontSize: o._gtaFontSize,
      letterSpacing: o._gtaLetterSpacing,
      fontFamily: o._gtaFontFamily,
      fontColor: o._gtaFontColor,
      shadowIntensity: o._gtaShadowIntensity,
      glowIntensity: o._gtaGlowIntensity,
      cornersEnabled: !!o._gtaCornersEnabled, cornerTL: o._gtaCornerTL ?? 100, cornerTR: o._gtaCornerTR ?? 100, cornerBL: o._gtaCornerBL ?? 100, cornerBR: o._gtaCornerBR ?? 100,
      linearEnabled: !!o._gtaLinearEnabled, linearIntensity: o._gtaLinearIntensity ?? 0, linearAngle: o._gtaLinearAngle ?? 0,
      radialEnabled: !!o._gtaRadialEnabled, radialIntensity: o._gtaRadialIntensity ?? 0, radialRadius: o._gtaRadialRadius ?? 50,
      left: o.left,
      top: o.top,
      angle: o.angle,
      scaleX: o.scaleX,
      scaleY: o.scaleY,
      opacity: o.opacity
    };
  });
}

function tryMakeThumbnail() {
  const tryCapture = () => {
    try {
      const url = canvas.toDataURL({ format: 'png', multiplier: 0.12, enableRetinaScaling: false });
      if (url && url.length < 300000) return url;
    } catch {}
    return null;
  };
  let thumb = tryCapture();
  if (thumb) return thumb;
  // Fallback file:// : tenta sem background (principal fonte de taint)
  const bg = canvas.backgroundImage;
  const bgColor = canvas.backgroundColor;
  const hasBg = !!bg || (bgColor && bgColor !== '' && bgColor !== 'transparent');
  if (hasBg) {
    const savedBg = bg;
    const savedColor = bgColor;
    canvas.backgroundImage = null;
    canvas.backgroundColor = '';
    try { canvas.requestRenderAll(); } catch {}
    thumb = tryCapture();
    // Restaura
    canvas.backgroundImage = savedBg;
    canvas.backgroundColor = savedColor;
    try { canvas.requestRenderAll(); } catch {}
    if (thumb) return thumb;
  }
  // Segundo fallback: remove também imagens file:// (chars/assets) e tenta só textos (não tainted)
  const all = canvas.getObjects().slice();
  const tainted = all.filter(o => o._isChar || o._isAsset);
  if (tainted.length) {
    tainted.forEach(o => canvas.remove(o));
    try { canvas.requestRenderAll(); } catch {}
    thumb = tryCapture();
    // Restaura
    tainted.forEach(o => canvas.add(o));
    try { canvas.requestRenderAll(); } catch {}
    if (thumb) return thumb;
  }
  return null;
}

function buildCurrentProjectPayload(name) {
  const bg = (typeof getCurrentBackgroundKey === 'function') ? getCurrentBackgroundKey() : 'transparent';
  const objects = serializeCanvasObjects();
  return {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    name: (name || '').trim() || `Projeto ${new Date().toLocaleString('pt-BR')}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    background: bg,
    objects: objects,
    canvasW: (typeof CANVAS_W !== 'undefined' ? CANVAS_W : 1920),
    canvasH: (typeof CANVAS_H !== 'undefined' ? CANVAS_H : 1080),
    thumbnail: tryMakeThumbnail()
  };
}

function saveCurrentProject() {
  const input = document.getElementById('project-name-input');
  const rawName = input ? input.value.trim() : '';
  const list = getProjects();

  // Se já existe projeto com mesmo nome, avisa e pergunta se quer substituir
  if (rawName) {
    const existingIdx = list.findIndex(p => p.name.trim().toLowerCase() === rawName.toLowerCase());
    if (existingIdx !== -1) {
      const existing = list[existingIdx];
      const wantsReplace = confirm(`Já existe um projeto salvo com o nome "${existing.name}".\nDeseja substituir?`);
      if (!wantsReplace) {
        toast('Salvamento cancelado — use outro nome.');
        return null;
      }
      // Substitui mantendo ID, atualizando conteúdo
      const updated = buildCurrentProjectPayload(rawName);
      updated.id = existing.id;
      updated.createdAt = existing.createdAt;
      // Move para o topo
      list.splice(existingIdx, 1);
      list.unshift(updated);
      if (list.length > 50) list.length = 50;
      setProjects(list);
      if (input) input.value = '';
      renderProjectsList();
      toast(`Projeto "${updated.name}" substituído!`);
      return updated;
    }
  }

  const payload = buildCurrentProjectPayload(rawName);
  list.unshift(payload);
  // Limita a 50 projetos para não estourar localStorage (cada ~50-200kb)
  if (list.length > 50) list.length = 50;
  setProjects(list);
  if (input) input.value = '';
  renderProjectsList();
  toast(`Projeto "${payload.name}" salvo!`);
  return payload;
}

function deleteProject(id) {
  const list = getProjects().filter(p => p.id !== id);
  setProjects(list);
  renderProjectsList();
  toast('Projeto removido.');
}

function duplicateProject(id) {
  const list = getProjects();
  const orig = list.find(p => p.id === id);
  if (!orig) return;
  const copy = JSON.parse(JSON.stringify(orig));
  copy.id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  copy.name = orig.name + ' (cópia)';
  copy.createdAt = new Date().toISOString();
  copy.updatedAt = new Date().toISOString();
  list.unshift(copy);
  setProjects(list);
  renderProjectsList();
  toast('Projeto duplicado!');
}

function exportProjectJSON(id) {
  const list = getProjects();
  const proj = list.find(p => p.id === id);
  if (!proj) return;
  const blob = new Blob([JSON.stringify(proj, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = proj.name.replace(/[^a-z0-9-_ ]/gi, '_') + '.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast('JSON exportado!');
}

function exportCurrentProjectJSON() {
  const bg = (typeof getCurrentBackgroundKey === 'function') ? getCurrentBackgroundKey() : 'transparent';
  const objects = serializeCanvasObjects();
  const payload = {
    id: 'export-' + Date.now(),
    name: (document.getElementById('project-name-input')?.value.trim() || 'projeto-atual'),
    createdAt: new Date().toISOString(),
    background: bg,
    objects: objects,
    canvasW: (typeof CANVAS_W !== 'undefined' ? CANVAS_W : 1920),
    canvasH: (typeof CANVAS_H !== 'undefined' ? CANVAS_H : 1080)
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = payload.name.replace(/[^a-z0-9-_ ]/gi, '_') + '.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast('Projeto atual exportado!');
}

function importProjectFromFile(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      // Aceita tanto formato de projeto único quanto array
      const toImport = Array.isArray(data) ? data : [data];
      const list = getProjects();
      let added = 0;
      toImport.forEach(item => {
        if (!item || !item.objects || !Array.isArray(item.objects)) return;
        const proj = {
          id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6) + added,
          name: (item.name || 'Projeto importado') + (added ? ` ${added+1}` : ''),
          createdAt: item.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          background: item.background || 'transparent',
          objects: item.objects,
          canvasW: item.canvasW || 1920,
          canvasH: item.canvasH || 1080,
          thumbnail: item.thumbnail || null
        };
        list.unshift(proj);
        added++;
      });
      if (added === 0) throw new Error('JSON inválido ou sem projetos');
      if (list.length > 50) list.length = 50;
      setProjects(list);
      renderProjectsList();
      toast(`${added} projeto(s) importado(s)!`);
    } catch (e) {
      console.error('Import falhou', e);
      toast('Falha ao importar JSON: ' + e.message);
    }
  };
  reader.readAsText(file);
}

// Restauração: limpa canvas e recria objetos
function loadProject(id) {
  const list = getProjects();
  const proj = list.find(p => p.id === id);
  if (!proj) { toast('Projeto não encontrado'); return; }
  if (!confirm(`Carregar "${proj.name}"? O canvas atual será substituído.`)) return;
  restoreProjectData(proj);
  closeProjectsModal();
}

function restoreProjectData(proj) {
  // Limpa seleção
  canvas.discardActiveObject();
  // Remove apenas objetos de projeto (mantém background handling separado)
  canvas.getObjects().filter(o => typeof o._gtaText === 'string' || o._isChar || o._isAsset || o._isOpacityMask).forEach(o => canvas.remove(o));
  canvas.requestRenderAll();

  // Restaura background
  const bgKey = proj.background || 'transparent';
  setBackground(bgKey);
  // Atualiza UI de thumbs
  setTimeout(() => {
    document.querySelectorAll('.bg-thumb').forEach(x => x.classList.remove('active'));
    document.querySelectorAll(`.bg-thumb[data-bg="${bgKey}"]`).forEach(x => x.classList.add('active'));
  }, 100);

  const objects = proj.objects || [];
  if (!objects.length) {
    updateLayerList();
    updateStatusCount();
    syncPanel(null);
    pushHistory();
    toast(`Projeto "${proj.name}" carregado (vazio).`);
    return;
  }

  // Preserva ordem exata (bottom -> top) mesmo com carregamento assíncrono
  // Slots garante que canvas.add seja feito na ordem original, não na ordem de resposta
  const slots = new Array(objects.length);
  let loaded = 0;
  let hasError = false;
  const wasIgnore = (typeof ignoreHistory !== 'undefined') ? ignoreHistory : false;
  if (typeof ignoreHistory !== 'undefined') ignoreHistory = true;

  function checkDone() {
    loaded++;
    if (loaded < objects.length) return;
    // Todos os slots preenchidos (com img ou null) -> adiciona em ordem
    slots.forEach(obj => {
      if (obj) canvas.add(obj);
    });
    canvas.requestRenderAll();
    // Garante z-index exato via moveTo (0 = fundo)
    slots.forEach((obj, idx) => {
      if (obj) {
        try { obj.moveTo(idx); } catch {}
      }
    });
    canvas.requestRenderAll();
    updateLayerList();
    updateStatusCount();
    syncPanel(null);
    if (typeof ignoreHistory !== 'undefined') ignoreHistory = wasIgnore;
    pushHistory();
    if (hasError) toast(`Projeto "${proj.name}" carregado com alguns erros de imagem.`);
    else toast(`Projeto "${proj.name}" carregado!`);
  }

  objects.forEach((item, idx) => {
    if (item._isOpacityMask) {
      try {
        let poly;
        if (item.isLine) {
          poly = new fabric.Line([item.x1 ?? 0, item.y1 ?? 0, item.x2 ?? (Math.round((typeof CANVAS_W!=='undefined'?CANVAS_W:1920)*0.65)), item.y2 ?? 0], {
            left: item.left || 0, top: item.top || 0,
            stroke: '#ff9aa8', strokeWidth: 6, strokeLineCap: 'round', strokeDashArray: [12,8],
            selectable: true, hasControls: true, hasBorders: true, transparentCorners: false,
            cornerColor: '#ffffff', cornerStrokeColor: '#ff8192', borderColor: '#ff8192', cornerSize: 10,
            angle: item.angle || 0, scaleX: item.scaleX || 1, scaleY: item.scaleY || 1, opacity: item.opacity ?? 1
          });
          poly._isOpacityLine = true;
        } else {
          poly = new fabric.Polygon(item.points || [], {
            left: item.left || 0, top: item.top || 0,
            fill: 'rgba(255,154,168,0.18)', stroke: '#ff9aa8', strokeWidth: 2, strokeDashArray: [6,4],
            selectable: true, hasControls: true, hasBorders: true, transparentCorners: false,
            cornerColor: '#ffffff', cornerStrokeColor: '#ff8192', borderColor: '#ff8192', cornerSize: 10,
            angle: item.angle || 0, scaleX: item.scaleX || 1, scaleY: item.scaleY || 1, opacity: item.opacity ?? 1
          });
        }
        poly._isOpacityMask = true; poly._opacityMaskId = item.id || ++opacityMaskIdCounter;
        poly._label = item.label || ('Opacitador #' + poly._opacityMaskId);
        poly._opacityLevel = item.opacityLevel ?? 50;
        poly._fade = item.fade ?? 40;
        poly._targetIds = Array.isArray(item.targetIds) ? item.targetIds.slice() : [];
        if (poly._opacityMaskId > opacityMaskIdCounter) opacityMaskIdCounter = poly._opacityMaskId;
        slots[idx] = poly;
      } catch { slots[idx] = null; hasError = true; }
      checkDone();
    } else if (item._isAsset) {
      const optsA = (typeof getFabricLoadOptions === 'function') ? getFabricLoadOptions(item.file) : (window.location.protocol === 'file:' ? null : { crossOrigin: 'anonymous' });
      fabric.Image.fromURL(item.file, img => {
        if (!img || !img.width) { hasError = true; slots[idx] = null; checkDone(); return; }
        img.set({
          left: item.left, top: item.top, originX: 'center', originY: 'center',
          angle: item.angle || 0, scaleX: item.scaleX ?? 1, scaleY: item.scaleY ?? 1, opacity: item.opacity ?? 1,
          selectable: true, hasControls: true, hasBorders: true, transparentCorners: false,
          cornerColor: '#ffffff', cornerStrokeColor: '#ff8192', borderColor: '#ff8192', cornerSize: 14
        });
        img._assetKey = item.key; img._assetLabel = item.label; img._assetFile = item.file; img._isAsset = true;
        slots[idx] = img;
        checkDone();
      }, optsA);
    } else if (item._isChar) {
      const src = (typeof resolveCharSrc === 'function') ? resolveCharSrc(item.file) : item.file;
      const optsC = (typeof getFabricLoadOptions === 'function') ? getFabricLoadOptions(src) : ((typeof src === 'string' && src.indexOf('data:') === 0) || window.location.protocol === 'file:' ? null : { crossOrigin: 'anonymous' });
      fabric.Image.fromURL(src, img => {
        if (!img || !img.width) { hasError = true; slots[idx] = null; checkDone(); return; }
        img.set({
          left: item.left, top: item.top, originX: 'center', originY: 'center',
          angle: item.angle || 0, scaleX: item.scaleX ?? 1, scaleY: item.scaleY ?? 1, opacity: item.opacity ?? 1,
          selectable: true, hasControls: true, hasBorders: true, transparentCorners: false,
          cornerColor: '#ffffff', cornerStrokeColor: '#ff8192', borderColor: '#ff8192', cornerSize: 14
        });
        img._charKey = item.key; img._charLabel = item.label; img._charFile = item.file; img._isChar = true;
        slots[idx] = img;
        checkDone();
      }, optsC);
    } else {
      // GTA text: cria sem usar createGTAVIElement (que já dá canvas.add fora de ordem)
      try {
        const renderedCanvas = renderGTAVIText(item.text ?? '', {
          type: item.type || 'logo',
          style: item.style || 'colorful',
          coverArt: item.coverArt !== false,
          palmTree: item.palmTree !== false,
          fontSize: item.fontSize || 220,
          letterSpacing: item.letterSpacing || 0,
          fontFamily: item.fontFamily || 'GTA Art Deco Medium',
          fontColor: item.fontColor || '#ffffff',
          shadowIntensity: item.shadowIntensity ?? 50,
          glowIntensity: item.glowIntensity ?? 0,
          cornersEnabled: !!item.cornersEnabled, cornerTL: item.cornerTL ?? 100, cornerTR: item.cornerTR ?? 100, cornerBL: item.cornerBL ?? 100, cornerBR: item.cornerBR ?? 100,
          linearEnabled: !!item.linearEnabled, linearIntensity: item.linearIntensity ?? 0, linearAngle: item.linearAngle ?? 0,
          radialEnabled: !!item.radialEnabled, radialIntensity: item.radialIntensity ?? 0, radialRadius: item.radialRadius ?? 50
        });
        const imgObj = new fabric.Image(renderedCanvas, {
          left: item.left, top: item.top, originX: 'center', originY: 'center',
          selectable: true, hasControls: true, hasBorders: true, transparentCorners: false,
          cornerColor: '#ffffff', cornerStrokeColor: '#ff8192', borderColor: '#ff8192', cornerSize: 14,
          angle: item.angle || 0, scaleX: item.scaleX ?? 1, scaleY: item.scaleY ?? 1, opacity: item.opacity ?? 1
        });
        imgObj._gtaType = item.type || 'logo';
        imgObj._gtaText = item.text ?? '';
        imgObj._gtaStyle = item.style || 'colorful';
        imgObj._gtaCoverArt = item.coverArt !== false;
        imgObj._gtaPalmTree = item.palmTree !== false;
        imgObj._gtaFontSize = item.fontSize || 220;
        imgObj._gtaLetterSpacing = item.letterSpacing || 0;
        imgObj._gtaFontFamily = item.fontFamily || 'GTA Art Deco Medium';
        imgObj._gtaFontColor = item.fontColor || '#ffffff';
        imgObj._gtaShadowIntensity = item.shadowIntensity ?? 50;
        imgObj._gtaGlowIntensity = item.glowIntensity ?? 0;
        imgObj._gtaCornersEnabled = !!item.cornersEnabled; imgObj._gtaCornerTL = item.cornerTL ?? 100; imgObj._gtaCornerTR = item.cornerTR ?? 100; imgObj._gtaCornerBL = item.cornerBL ?? 100; imgObj._gtaCornerBR = item.cornerBR ?? 100;
        imgObj._gtaLinearEnabled = !!item.linearEnabled; imgObj._gtaLinearIntensity = item.linearIntensity ?? 0; imgObj._gtaLinearAngle = item.linearAngle ?? 0;
        imgObj._gtaRadialEnabled = !!item.radialEnabled; imgObj._gtaRadialIntensity = item.radialIntensity ?? 0; imgObj._gtaRadialRadius = item.radialRadius ?? 50;
        imgObj._gtaId = ++objCounter;
        imgObj._gtaLabel = ((item.type === 'normal' ? 'Subtítulo: ' : 'Logo: ') + (imgObj._gtaText || '(vazio)'));
        slots[idx] = imgObj;
      } catch (e) { console.warn('Falha ao restaurar texto', e); hasError = true; slots[idx] = null; }
      checkDone();
    }
  });
}

// ── UI DO MODAL ──

function renderMiniPreview(proj, canvasId) {
  const el = document.getElementById(canvasId);
  if (!el) return;
  // Usa o mesmo tamanho lógico do canvas principal, mas com zoom reduzido para caber no thumb 16/9
  const MINI_W = 320, MINI_H = 180;
  const factor = MINI_W / (typeof CANVAS_W !== 'undefined' ? CANVAS_W : 1920);
  try {
    const mini = new fabric.StaticCanvas(canvasId, {
      width: MINI_W,
      height: MINI_H,
      backgroundColor: 'transparent',
      renderOnAddRemove: false,
      selection: false
    });
    // Background igual ao main
    const bgKey = proj.background || 'transparent';
    if (bgKey === 'black') {
      mini.setBackgroundColor('#000', mini.renderAll.bind(mini));
    } else if (bgKey === 'dark') {
      mini.setBackgroundColor('#11111A', mini.renderAll.bind(mini));
    } else if (bgKey !== 'transparent') {
      const bg = (typeof BG_LIST !== 'undefined') ? BG_LIST.find(b => b.key === bgKey) : null;
      if (bg && bg.path) {
        const opts = (typeof getFabricLoadOptions === 'function') ? getFabricLoadOptions(bg.path) : null;
        fabric.Image.fromURL(bg.path, img => {
          if (!img || !img.width) { mini.requestRenderAll(); return; }
          const s = Math.max(MINI_W / img.width, MINI_H / img.height);
          img.set({ scaleX: s, scaleY: s, left: (MINI_W - img.width * s)/2, top: (MINI_H - img.height * s)/2, selectable:false, evented:false });
          mini.setBackgroundImage(img, mini.renderAll.bind(mini));
        }, opts);
      }
    }
    // Objetos: preserva ordem exata (bottom→top) mesmo com loads assíncronos — igual ao fix do restore
    const objs = proj.objects || [];
    if (!objs.length) { mini.requestRenderAll(); return; }
    const slots = new Array(objs.length);
    let loaded = 0;
    function checkMiniDone() {
      loaded++;
      if (loaded < objs.length) return;
      // Adiciona na ordem original para manter z-index correto
      slots.forEach(o => { if (o) mini.add(o); });
      // Garante ordem via moveTo
      slots.forEach((o, idx) => { if (o) try { o.moveTo(idx); } catch {} });
      mini.requestRenderAll();
    }
    objs.forEach((item, idx) => {
      if (item._isOpacityMask) {
        try {
          let poly;
          if (item.isLine) {
            poly = new fabric.Line([item.x1 ?? 0, item.y1 ?? 0, item.x2 ?? 320*0.65, item.y2 ?? 0], {
              left: (item.left || 0) * factor, top: (item.top || 0) * factor,
              stroke: '#ff9aa8', strokeWidth: 3, strokeLineCap: 'round', strokeDashArray: [6,4],
              selectable: false, evented: false, angle: item.angle || 0, scaleX: (item.scaleX||1), scaleY: (item.scaleY||1), opacity: item.opacity ?? 1
            });
            poly._isOpacityMask = true;
          } else {
            const pts = (item.points || []).map(p => ({ x: p.x * factor, y: p.y * factor }));
            poly = new fabric.Polygon(pts, {
              left: (item.left || 0) * factor, top: (item.top || 0) * factor,
              fill: 'rgba(255,154,168,0.18)', stroke: '#ff9aa8', strokeWidth: 1, strokeDashArray: [4,3],
              selectable: false, evented: false, angle: item.angle || 0, scaleX: (item.scaleX||1), scaleY: (item.scaleY||1), opacity: item.opacity ?? 1
            });
            poly._isOpacityMask = true;
          }
          slots[idx] = poly;
        } catch { slots[idx] = null; }
        checkMiniDone();
      } else if (item._isAsset) {
        const opts = (typeof getFabricLoadOptions === 'function') ? getFabricLoadOptions(item.file) : null;
        fabric.Image.fromURL(item.file, img => {
          if (!img || !img.width) { slots[idx] = null; checkMiniDone(); return; }
          img.set({
            left: (item.left || 0) * factor,
            top: (item.top || 0) * factor,
            originX: 'center', originY: 'center',
            angle: item.angle || 0,
            scaleX: (item.scaleX || 1) * factor,
            scaleY: (item.scaleY || 1) * factor,
            opacity: item.opacity ?? 1,
            selectable: false, evented: false
          });
          img._isAsset = true;
          slots[idx] = img;
          checkMiniDone();
        }, opts);
      } else if (item._isChar) {
        const src = (typeof resolveCharSrc === 'function') ? resolveCharSrc(item.file) : item.file;
        const opts = (typeof getFabricLoadOptions === 'function') ? getFabricLoadOptions(src) : null;
        fabric.Image.fromURL(src, img => {
          if (!img || !img.width) { slots[idx] = null; checkMiniDone(); return; }
          img.set({
            left: (item.left || 0) * factor,
            top: (item.top || 0) * factor,
            originX: 'center', originY: 'center',
            angle: item.angle || 0,
            scaleX: (item.scaleX || 1) * factor,
            scaleY: (item.scaleY || 1) * factor,
            opacity: item.opacity ?? 1,
            selectable: false, evented: false
          });
          img._isChar = true;
          slots[idx] = img;
          checkMiniDone();
        }, opts);
      } else {
        try {
          const c = renderGTAVIText(item.text || '', {
            type: item.type || 'logo',
            style: item.style || 'colorful',
            coverArt: item.coverArt !== false,
            palmTree: item.palmTree !== false,
            fontSize: (item.fontSize || 220) * factor,
            letterSpacing: item.letterSpacing || 0,
            fontFamily: item.fontFamily || 'GTA Art Deco Medium',
            fontColor: item.fontColor || '#ffffff',
            shadowIntensity: item.shadowIntensity ?? 50,
            glowIntensity: item.glowIntensity ?? 0
          });
          const imgObj = new fabric.Image(c, {
            left: (item.left || 0) * factor,
            top: (item.top || 0) * factor,
            originX: 'center', originY: 'center',
            angle: item.angle || 0,
            scaleX: (item.scaleX || 1),
            scaleY: (item.scaleY || 1),
            opacity: item.opacity ?? 1,
            selectable: false, evented: false
          });
          slots[idx] = imgObj;
        } catch { slots[idx] = null; }
        checkMiniDone();
      }
    });
  } catch (e) { console.warn('Mini preview falhou', e); }
}

function formatDate(iso) {
  try { return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }); } catch { return iso; }
}

function renderProjectsList() {
  const listEl = document.getElementById('projects-list');
  const emptyEl = document.getElementById('projects-empty');
  const countEl = document.getElementById('projects-count');
  if (!listEl) return;
  const projects = getProjects();
  if (countEl) countEl.textContent = projects.length;
  listEl.innerHTML = '';
  if (!projects.length) {
    if (emptyEl) emptyEl.style.display = '';
    return;
  }
  if (emptyEl) emptyEl.style.display = 'none';

  projects.forEach(proj => {
    const card = document.createElement('div');
    card.className = 'project-card';
    // Miniatura VIVA: renderiza as artes reais numa mini Fabric canvas (não depende de toDataURL/tainted)
    const thumbId = 'proj-thumb-' + proj.id;
    const thumb = `<div class="project-thumb--canvas"><canvas id="${thumbId}" width="320" height="180"></canvas></div>`;
    const bgLabel = (() => {
      if (!proj.background || proj.background === 'transparent') return 'Transparente';
      if (proj.background === 'black') return 'Preto';
      if (proj.background === 'dark') return 'Escuro';
      const bg = (typeof BG_LIST !== 'undefined') ? BG_LIST.find(b => b.key === proj.background) : null;
      return bg ? bg.label : proj.background;
    })();
    const layers = proj.objects ? proj.objects.length : 0;
    card.innerHTML = `
      <div class="project-card-main">
        ${thumb}
        <div class="project-card-info">
          <div class="project-card-name" title="${proj.name.replace(/"/g, '&quot;')}">${proj.name}</div>
          <div class="project-card-meta">${layers} camada(s) • BG: ${bgLabel} • ${formatDate(proj.updatedAt || proj.createdAt)}</div>
        </div>
      </div>
      <div class="project-card-actions">
        <button class="btn primary small" data-act="load" title="Carregar (substitui canvas atual)">Carregar</button>
        <button class="btn small" data-act="export" title="Exportar JSON">Exportar</button>
        <button class="btn small" data-act="dup" title="Duplicar">Duplicar</button>
        <button class="btn small danger" data-act="del" title="Excluir">Excluir</button>
      </div>
    `;
    // Eventos
    card.querySelector('[data-act="load"]').onclick = () => loadProject(proj.id);
    card.querySelector('[data-act="export"]').onclick = () => exportProjectJSON(proj.id);
    card.querySelector('[data-act="dup"]').onclick = () => duplicateProject(proj.id);
    card.querySelector('[data-act="del"]').onclick = () => {
      if (confirm(`Excluir "${proj.name}" permanentemente?`)) deleteProject(proj.id);
    };
    listEl.appendChild(card);
    // Renderiza miniatura viva após inserir no DOM
    setTimeout(() => renderMiniPreview(proj, thumbId), 0);
  });
}

function openProjectsModal() {
  const m = document.getElementById('projects-modal');
  if (!m) return;
  renderProjectsList();
  m.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  setTimeout(() => document.getElementById('project-name-input')?.focus(), 100);
}
function closeProjectsModal() {
  const m = document.getElementById('projects-modal');
  if (!m) return;
  m.style.display = 'none';
  document.body.style.overflow = '';
}

function initProjectsModal() {
  const modal = document.getElementById('projects-modal');
  if (!modal) return;
  document.getElementById('projects-modal-close')?.addEventListener('click', closeProjectsModal);
  modal.addEventListener('click', e => { if (e.target === modal) closeProjectsModal(); });

  document.getElementById('tool-projects')?.addEventListener('click', openProjectsModal);

  document.getElementById('btn-save-project')?.addEventListener('click', () => {
    const input = document.getElementById('project-name-input');
    const name = input ? input.value.trim() : '';
    const objs = serializeCanvasObjects();
    if (!objs.length && (typeof getCurrentBackgroundKey === 'function' ? getCurrentBackgroundKey() : 'transparent') === 'transparent') {
      if (!confirm('Canvas vazio. Salvar mesmo assim?')) return;
    }
    saveCurrentProject(name);
  });

  // Enter no input salva
  document.getElementById('project-name-input')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      document.getElementById('btn-save-project')?.click();
    }
  });

  document.getElementById('btn-export-project-json')?.addEventListener('click', exportCurrentProjectJSON);

  document.getElementById('project-import-file')?.addEventListener('change', e => {
    const f = e.target.files && e.target.files[0];
    if (f) importProjectFromFile(f);
    e.target.value = '';
  });

  // Atalho: Ctrl+S salva projeto (previne save do navegador)
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
      const tag = document.activeElement.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') {
        // Se estiver no input de nome do projeto, deixa o Enter salvar; mas Ctrl+S também salva
        if (document.activeElement.id === 'project-name-input') {
          e.preventDefault();
          document.getElementById('btn-save-project')?.click();
          return;
        }
      }
      // Se modal de projetos aberto, salva
      const pm = document.getElementById('projects-modal');
      if (pm && pm.style.display !== 'none') {
        e.preventDefault();
        document.getElementById('btn-save-project')?.click();
        return;
      }
      // Caso geral: Ctrl+S abre modal de projetos
      if (tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT') {
        e.preventDefault();
        openProjectsModal();
      }
    }
    if (e.key === 'Escape') {
      const pm = document.getElementById('projects-modal');
      if (pm && pm.style.display === 'flex') closeProjectsModal();
    }
  });
}
