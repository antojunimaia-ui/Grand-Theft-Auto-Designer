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
  const objs = canvas.getObjects().filter(o => typeof o._gtaText === 'string' || o._isChar || o._isAsset);
  return objs.map(o => {
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
  try {
    // Tenta thumbnail pequeno; se tainted retorna null
    const dataUrl = canvas.toDataURL({ format: 'png', multiplier: 0.12, enableRetinaScaling: false });
    // Limita tamanho ~ 30kb se muito grande, corta
    if (dataUrl && dataUrl.length < 300000) return dataUrl;
    return null;
  } catch (e) {
    return null;
  }
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
  // Se já existe projeto com mesmo nome, atualiza em vez de duplicar? Vamos criar novo e avisar
  const payload = buildCurrentProjectPayload(rawName);
  const list = getProjects();
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
  canvas.getObjects().filter(o => typeof o._gtaText === 'string' || o._isChar || o._isAsset).forEach(o => canvas.remove(o));
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
    if (item._isAsset) {
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
          glowIntensity: item.glowIntensity ?? 0
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
        imgObj._gtaId = ++objCounter;
        imgObj._gtaLabel = ((item.type === 'normal' ? 'Subtítulo: ' : 'Logo: ') + (imgObj._gtaText || '(vazio)'));
        slots[idx] = imgObj;
      } catch (e) { console.warn('Falha ao restaurar texto', e); hasError = true; slots[idx] = null; }
      checkDone();
    }
  });
}

// ── UI DO MODAL ──

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
    const thumb = proj.thumbnail ? `<img src="${proj.thumbnail}" alt="thumb" class="project-thumb" />` : `<div class="project-thumb placeholder">🎨</div>`;
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
