// ──────────────────────────────────────────────────────────
// HISTÓRICO UNDO / REDO
// ──────────────────────────────────────────────────────────

const history = [];
let historyIndex = -1;
let ignoreHistory = false;

function pushHistory() {
  if (ignoreHistory) return;
  const state = canvas.getObjects().filter(o => typeof o._gtaText === 'string' || o._isChar || o._isAsset).map(o => {
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
      type: o._gtaType,
      text: o._gtaText,
      style: o._gtaStyle,
      coverArt: o._gtaCoverArt,
      palmTree: o._gtaPalmTree,
      fontSize: o._gtaFontSize,
      letterSpacing: o._gtaLetterSpacing,
      fontFamily: o._gtaFontFamily,
      fontColor: o._gtaFontColor,
      shadowIntensity: o._gtaShadowIntensity ?? 50,
      glowIntensity: o._gtaGlowIntensity ?? 0,
      left: o.left,
      top: o.top,
      angle: o.angle,
      scaleX: o.scaleX,
      scaleY: o.scaleY,
      opacity: o.opacity
    };
  });

  const json = JSON.stringify(state);
  if (history[historyIndex] === json) return;
  history.splice(historyIndex + 1);
  history.push(json);
  if (history.length > 50) history.shift();
  historyIndex = history.length - 1;
  updateUndoRedo();
}

function undo() {
  if (historyIndex <= 0) return;
  historyIndex--;
  restoreHistory(history[historyIndex]);
}

function redo() {
  if (historyIndex >= history.length - 1) return;
  historyIndex++;
  restoreHistory(history[historyIndex]);
}

function restoreHistory(json) {
  ignoreHistory = true;
  const data = JSON.parse(json);
  canvas.getObjects().filter(o => typeof o._gtaText === 'string' || o._isChar || o._isAsset).forEach(o => canvas.remove(o));
  data.forEach(item => {
    if (item._isAsset) {
      const optsA = (typeof getFabricLoadOptions === 'function') ? getFabricLoadOptions(item.file) : (window.location.protocol === 'file:' ? null : { crossOrigin: 'anonymous' });
      fabric.Image.fromURL(item.file, img => {
        if (!img) return;
        img.set({
          left: item.left,
          top: item.top,
          originX: 'center',
          originY: 'center',
          angle: item.angle,
          scaleX: item.scaleX,
          scaleY: item.scaleY,
          opacity: item.opacity,
          selectable: true,
          hasControls: true,
          hasBorders: true,
          transparentCorners: false,
          cornerColor: '#ffffff',
          cornerStrokeColor: '#ff8192',
          borderColor: '#ff8192',
          cornerSize: 14
        });
        img._assetKey = item.key;
        img._assetLabel = item.label;
        img._assetFile = item.file;
        img._isAsset = true;
        canvas.add(img);
        canvas.requestRenderAll();
        updateLayerList();
        updateStatusCount();
      }, optsA);
    } else if (item._isChar) {
      const imgSrc = (typeof resolveCharSrc === 'function') ? resolveCharSrc(item.file) : ((typeof CHAR_DATA !== 'undefined' && CHAR_DATA[item.file]) ? CHAR_DATA[item.file] : item.file);
      const optsC = (typeof getFabricLoadOptions === 'function') ? getFabricLoadOptions(imgSrc) : ((typeof imgSrc === 'string' && imgSrc.indexOf('data:') === 0) || window.location.protocol === 'file:' ? null : { crossOrigin: 'anonymous' });
      fabric.Image.fromURL(imgSrc, img => {
        img.set({
          left: item.left,
          top: item.top,
          originX: 'center',
          originY: 'center',
          angle: item.angle,
          scaleX: item.scaleX,
          scaleY: item.scaleY,
          opacity: item.opacity,
          selectable: true,
          hasControls: true,
          hasBorders: true,
          transparentCorners: false,
          cornerColor: '#ffffff',
          cornerStrokeColor: '#ff8192',
          borderColor: '#ff8192',
          cornerSize: 14
        });
        img._charKey = item.key;
        img._charLabel = item.label;
        img._charFile = item.file;
        img._isChar = true;
        canvas.add(img);
        canvas.requestRenderAll();
        updateLayerList();
        updateStatusCount();
      }, optsC);
    } else {
      const el = createGTAVIElement(item.text, item);
      el.set({ angle: item.angle, scaleX: item.scaleX, scaleY: item.scaleY, opacity: item.opacity });
    }
  });
  canvas.requestRenderAll();
  updateLayerList();
  updateStatusCount();
  ignoreHistory = false;
  updateUndoRedo();
}

function updateUndoRedo() {
  document.getElementById('btn-undo').disabled = historyIndex <= 0;
  document.getElementById('btn-redo').disabled = historyIndex >= history.length - 1;
}
