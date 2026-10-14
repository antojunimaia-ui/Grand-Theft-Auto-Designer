// ──────────────────────────────────────────────────────────
// HISTÓRICO UNDO / REDO
// ──────────────────────────────────────────────────────────

const history = [];
let historyIndex = -1;
let ignoreHistory = false;

function pushHistory() {
  if (ignoreHistory) return;
  const state = canvas.getObjects().filter(o => typeof o._gtaText === 'string' || o._isChar || o._isAsset || o._isOpacityMask).map(o => {
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
      type: o._gtaType,
      text: o._gtaText,
      style: o._gtaStyle,
      coverArt: o._gtaCoverArt,
      palmTree: o._gtaPalmTree,
      palmOffsetX: o._gtaPalmOffsetX ?? 0,
      palmOffsetY: o._gtaPalmOffsetY ?? 0,
      fontSize: o._gtaFontSize,
      letterSpacing: o._gtaLetterSpacing,
      fontFamily: o._gtaFontFamily,
      fontColor: o._gtaFontColor,
      shadowIntensity: o._gtaShadowIntensity ?? 50,
      glowIntensity: o._gtaGlowIntensity ?? 0,
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
  canvas.getObjects().filter(o => typeof o._gtaText === 'string' || o._isChar || o._isAsset || o._isOpacityMask).forEach(o => canvas.remove(o));
  data.forEach(item => {
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
        canvas.add(poly);
      } catch {}
    } else if (item._isAsset) {
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
      const el = createGTAVIElement(item.text, {
        type: item.type, style: item.style, coverArt: item.coverArt, palmTree: item.palmTree,
        palmOffsetX: item.palmOffsetX ?? 0, palmOffsetY: item.palmOffsetY ?? 0,
        fontSize: item.fontSize, letterSpacing: item.letterSpacing, fontFamily: item.fontFamily, fontColor: item.fontColor,
        shadowIntensity: item.shadowIntensity, glowIntensity: item.glowIntensity,
        cornersEnabled: item.cornersEnabled, cornerTL: item.cornerTL, cornerTR: item.cornerTR, cornerBL: item.cornerBL, cornerBR: item.cornerBR,
        linearEnabled: item.linearEnabled, linearIntensity: item.linearIntensity, linearAngle: item.linearAngle,
        radialEnabled: item.radialEnabled, radialIntensity: item.radialIntensity, radialRadius: item.radialRadius
      });
      el.set({ left: item.left, top: item.top, angle: item.angle, scaleX: item.scaleX, scaleY: item.scaleY, opacity: item.opacity });
      el.setCoords();
    }
  });
  canvas.requestRenderAll();
  // Reaplica máscaras após restaurar
  if (typeof applyOpacityMasks === 'function') setTimeout(applyOpacityMasks, 50);
  updateLayerList();
  updateStatusCount();
  ignoreHistory = false;
  updateUndoRedo();
}

function updateUndoRedo() {
  document.getElementById('btn-undo').disabled = historyIndex <= 0;
  document.getElementById('btn-redo').disabled = historyIndex >= history.length - 1;
}
