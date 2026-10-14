// ──────────────────────────────────────────────────────────
// MOTOR DE RENDERIZAÇÃO COMPLETO DO GTA VI
// ──────────────────────────────────────────────────────────

let palmColorImg = null;
let palmMonoImg = null;
let fontLoaded = false;

// Remove bordas 100% transparentes para a caixa de seleção colar no desenho
function trimTransparentCanvas(src, margin = 3) {
  if (!src || !src.width || !src.height) return src;
  const sCtx = src.getContext('2d');
  if (!sCtx) return src;
  const w = src.width, h = src.height;
  let img;
  try { img = sCtx.getImageData(0, 0, w, h); } catch { return src; }
  const d = img.data;
  let minX = w, minY = h, maxX = -1, maxY = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (d[(y * w + x) * 4 + 3] > 5) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return src;
  minX = Math.max(0, minX - margin);
  minY = Math.max(0, minY - margin);
  maxX = Math.min(w - 1, maxX + margin);
  maxY = Math.min(h - 1, maxY + margin);
  const cw = maxX - minX + 1, ch = maxY - minY + 1;
  if (cw >= w && ch >= h) return src;
  const out = document.createElement('canvas');
  out.width = cw;
  out.height = ch;
  out.getContext('2d').drawImage(src, minX, minY, cw, ch, 0, 0, cw, ch);
  return out;
}

// Tile da palmeira escalado junto com a fonte (REF = tamanho padrão do logo).
// Como pad e métricas dos glifos também escalam linearmente com fontSize,
// a fase da textura em relação às letras fica constante: a palmeira cresce
// junto e não "anda" ao redimensionar.
const PALM_REF_SIZE = 260;function makeScaledPalmTile(img, fontSize) {
  if (!img || !img.width || !img.height) return null;
  const s = fontSize / PALM_REF_SIZE;
  const tw = Math.max(1, Math.round(img.width * s));
  const th = Math.max(1, Math.round(img.height * s));
  const tile = document.createElement('canvas');
  tile.width = tw;
  tile.height = th;
  const tCtx = tile.getContext('2d');
  if (!tCtx) return null;
  tCtx.drawImage(img, 0, 0, tw, th);
  return tile;
}

// Desloca a fase do pattern (sliders -100..100 = ±1 tile, com wrap do repeat).
// 0/0 = posição padrão.
function shiftPalmPattern(pattern, tile, ox, oy) {
  if (!pattern || !tile) return;
  const dx = ((ox || 0) / 100) * tile.width;
  const dy = ((oy || 0) / 100) * tile.height;
  if (!dx && !dy) return;
  try {
    if (typeof pattern.setTransform === 'function') pattern.setTransform(new DOMMatrix().translate(dx, dy));
  } catch {}
}

function applyAdvancedOpacityMask(targetCanvas, opts) {
  const { cornersEnabled, cornerTL, cornerTR, cornerBL, cornerBR, linearEnabled, linearIntensity, linearAngle, radialEnabled, radialIntensity, radialRadius } = opts;
  const enabled = cornersEnabled || linearEnabled || radialEnabled;
  if (!enabled) return;
  const ctx = targetCanvas.getContext('2d');
  if (!ctx) return;
  const w = targetCanvas.width, h = targetCanvas.height;
  if (w === 0 || h === 0) return;
  try {
    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;
    const tl = (cornerTL ?? 100) / 100, tr = (cornerTR ?? 100) / 100, bl = (cornerBL ?? 100) / 100, br = (cornerBR ?? 100) / 100;
    const linInt = (linearIntensity ?? 0) / 100;
    const radInt = (radialIntensity ?? 0) / 100;
    const radR = (radialRadius ?? 50) / 100;
    const angleRad = (linearAngle ?? 0) * Math.PI / 180;
    const cosA = Math.cos(angleRad), sinA = Math.sin(angleRad);
    // Vetor projetado: para cobertura total, usa diagonal do canvas
    const diag = Math.sqrt(w*w + h*h);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        if (data[i+3] === 0) continue;
        let alphaMult = 1;
        if (cornersEnabled) {
          const ux = w > 1 ? x / (w - 1) : 0;
          const uy = h > 1 ? y / (h - 1) : 0;
          const cornerAlpha = tl * (1 - ux) * (1 - uy) + tr * ux * (1 - uy) + bl * (1 - ux) * uy + br * ux * uy;
          alphaMult *= cornerAlpha;
        }
        if (linearEnabled && linInt > 0) {
          // Projeta ponto no eixo do ângulo, normaliza 0..1
          const cx = w / 2, cy = h / 2;
          const dx = x - cx, dy = y - cy;
          const proj = (dx * cosA + dy * sinA) / (diag / 2);
          const t = (proj + 1) / 2; // 0..1
          const clamped = Math.max(0, Math.min(1, t));
          // Intensidade controla quão forte o fade: 0 = sem efeito, 1 = vai de 1 a 0
          const linAlpha = 1 - linInt * (1 - clamped);
          alphaMult *= linAlpha;
        }
        if (radialEnabled && radInt > 0) {
          const cx = w / 2, cy = h / 2;
          const dx = (x - cx) / (w / 2), dy = (y - cy) / (h / 2);
          const dist = Math.sqrt(dx*dx + dy*dy); // 0 centro, ~1.4 cantos
          const norm = Math.min(1, dist / (radR * 1.5 + 0.01));
          const radAlpha = 1 - radInt * norm;
          alphaMult *= Math.max(0, radAlpha);
        }
        data[i+3] = Math.round(data[i+3] * alphaMult);
      }
    }
    ctx.putImageData(imgData, 0, 0);
  } catch (e) { console.warn('applyAdvancedOpacityMask falhou', e); }
}

function renderGTAVIText(text, options = {}) {
  const {
    type = 'logo', // 'logo' (Brother 1816) ou 'normal' (GTA Art Deco / Pricedown)
    style = 'colorful', // 'colorful', 'mono' ou 'outline'
    coverArt = true,
    palmTree = true,
    palmOffsetX = 0, // -100..100 (% do tile, 0 = posição padrão)
    palmOffsetY = 0, // -100..100 (% do tile, 0 = posição padrão)
    fontSize = 260,
    letterSpacing = 0,
    fontFamily = 'GTA Art Deco Medium',
    fontColor = '#ffffff',
    shadowIntensity = 50, // 0 = sem sombra, 100 = sombra máxima
    glowIntensity = 0,     // 0 = sem glow, 100 = glow máximo
    cornersEnabled = false, cornerTL = 100, cornerTR = 100, cornerBL = 100, cornerBR = 100,
    linearEnabled = false, linearIntensity = 0, linearAngle = 0,
    radialEnabled = false, radialIntensity = 0, radialRadius = 50
  } = options;

  const offCanvas = document.createElement('canvas');
  const ctx = offCanvas.getContext('2d');
  if (!ctx) return offCanvas;

  const isNormalText = type === 'normal';
  const usedFont = isNormalText ? `"${fontFamily}", sans-serif` : `900 ${fontSize}px "${FONT_FAMILY_LOGO}", ${FALLBACK_FONT}`;
  const letterFont = isNormalText ? `${fontSize}px "${fontFamily}", sans-serif` : usedFont;

  ctx.font = letterFont;
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';

  // Se o texto for vazio, desenha uma caixa mínima de seleção transparente para o Fabric.js não quebrar
  // Vice City .otf é demo: dígitos disparam o watermark, então remove 0-9 nessa fonte
  let safeText = (text !== undefined && text !== null) ? String(text) : '';
  if (isNormalText && fontFamily === 'Vice City') safeText = safeText.replace(/[0-9]/g, '');
  const displayText = isNormalText ? safeText : safeText.toUpperCase();

  if (displayText.trim() === '') {
    const minW = Math.max(40, Math.round(fontSize * 0.8));
    const minH = Math.max(40, Math.round(fontSize * 0.8));
    offCanvas.width = minW;
    offCanvas.height = minH;
    ctx.clearRect(0, 0, minW, minH);
    ctx.strokeStyle = 'rgba(255, 129, 146, 0.4)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.strokeRect(4, 4, minW - 8, minH - 8);
    return offCanvas;
  }

  // RENDERIZAÇÃO DE TEXTO NORMAL (GTA ART DECO / PRICEDOWN)
  if (isNormalText) {
    const isViceCityPad = fontFamily === 'Vice City';
    const pad = Math.round(fontSize * (isViceCityPad ? 0.35 : 0.2));
    ctx.font = letterFont;
    
    // Medição letra a letra com spacing
    const chars = Array.from(displayText);
    let runs = [];
    let currentOffset = 0;
    
    for (let i = 0; i < chars.length; i++) {
      const ch = chars[i];
      const subCurrent = displayText.slice(0, i + 1);
      const subPrev = displayText.slice(0, i);
      const wCurrent = ctx.measureText(subCurrent).width;
      const wPrev = i > 0 ? ctx.measureText(subPrev).width : 0;
      const charAdvance = (wCurrent - wPrev) + (letterSpacing * fontSize / 500);
      const metrics = ctx.measureText(ch);

      runs.push({ char: ch, width: metrics.width, advance: charAdvance, x: currentOffset });
      currentOffset += charAdvance;
    }

    const hMetrics = ctx.measureText('H');
    const capHeight = hMetrics.actualBoundingBoxAscent || fontSize * 0.75;
    const descent = hMetrics.actualBoundingBoxDescent || fontSize * 0.2;

    const width = Math.max(20, Math.ceil(currentOffset + pad * 2));
    const height = Math.max(20, Math.ceil(capHeight + descent + pad * 2));

    offCanvas.width = width;
    offCanvas.height = height;

    const startX = pad;
    const startY = pad + capHeight;

    ctx.font = letterFont;
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left';

    // Glow Branco puro focado na borda do texto
    if (glowIntensity > 0) {
      const gBlur = Math.round(fontSize * 0.18 * (glowIntensity / 100));
      const gAlpha = 0.5 + 0.5 * (glowIntensity / 100);
      ctx.save();
      ctx.shadowColor = `rgba(255, 255, 255, ${gAlpha})`;
      ctx.shadowBlur = gBlur;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      ctx.fillStyle = fontColor || '#ffffff';
      for (let i = 0; i < runs.length; i++) ctx.fillText(runs[i].char, startX + runs[i].x, startY);
      ctx.restore();
    }

    const isViceCity = fontFamily === 'Vice City';
    const VICE_PINK = '#f175b5';

    if (isViceCity) {
      // Estilo Vice City: miolo claro + contorno grosso rosa + sombra dura preta deslocada
      const strokeW = Math.max(2, Math.round(fontSize * 0.16));
      const shOff = Math.round(fontSize * 0.06);
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      if (shadowIntensity > 0) {
        const sAlpha = 0.4 + 0.6 * (shadowIntensity / 100);
        ctx.save();
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.lineWidth = strokeW;
        ctx.strokeStyle = `rgba(0, 0, 0, ${sAlpha})`;
        ctx.fillStyle = `rgba(0, 0, 0, ${sAlpha})`;
        for (let i = 0; i < runs.length; i++) {
          ctx.strokeText(runs[i].char, startX + runs[i].x + shOff, startY + shOff);
          ctx.fillText(runs[i].char, startX + runs[i].x + shOff, startY + shOff);
        }
        ctx.restore();
      }
      // Contorno grosso rosa
      ctx.save();
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      ctx.lineWidth = strokeW;
      ctx.strokeStyle = VICE_PINK;
      for (let i = 0; i < runs.length; i++) ctx.strokeText(runs[i].char, startX + runs[i].x, startY);
      ctx.restore();
      // Preenchimento (cor do picker, padrão branco)
      ctx.save();
      ctx.shadowColor = 'transparent';
      ctx.fillStyle = fontColor || '#ffffff';
      for (let i = 0; i < runs.length; i++) ctx.fillText(runs[i].char, startX + runs[i].x, startY);
      ctx.restore();
    } else {
      // Sombra direcional
      if (shadowIntensity > 0) {
        const sBlur  = Math.round(fontSize * 0.1 * (shadowIntensity / 100));
        const sAlpha = 0.3 + 0.6 * (shadowIntensity / 100);
        const sOff   = Math.round(fontSize * 0.04 * (shadowIntensity / 100));
        ctx.shadowColor = `rgba(0, 0, 0, ${sAlpha})`;
        ctx.shadowBlur = sBlur;
        ctx.shadowOffsetX = sOff;
        ctx.shadowOffsetY = sOff;
      } else {
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
      }

      ctx.fillStyle = fontColor || '#ffffff';
      for (let i = 0; i < runs.length; i++) {
        const r = runs[i];
        ctx.fillText(r.char, startX + r.x, startY);
      }
    }
    // Opacidade avançada direto no offCanvas
    applyAdvancedOpacityMask(offCanvas, { cornersEnabled, cornerTL, cornerTR, cornerBL, cornerBR, linearEnabled, linearIntensity, linearAngle, radialEnabled, radialIntensity, radialRadius });
    return trimTransparentCanvas(offCanvas, 3);
  }

  // RENDERIZAÇÃO DE LOGO COMPLETO (BROTHER 1816 COM SHADERS DO GTA VI)
  const pad = Math.round(fontSize * 0.25);
  ctx.font = letterFont;

  const chars = Array.from(displayText);
  let runs = [];
  let currentOffset = 0;
  
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    const subCurrent = displayText.slice(0, i + 1);
    const subPrev = displayText.slice(0, i);
    const wCurrent = ctx.measureText(subCurrent).width;
    const wPrev = i > 0 ? ctx.measureText(subPrev).width : 0;
    const charAdvance = (wCurrent - wPrev) + (letterSpacing * fontSize / 500);
    const metrics = ctx.measureText(ch);

    runs.push({ char: ch, width: metrics.width, advance: charAdvance, x: currentOffset });
    currentOffset += charAdvance;
  }

  const hMetrics = ctx.measureText('H');
  const capHeight = hMetrics.actualBoundingBoxAscent || fontSize * 0.72;
  const descent = hMetrics.actualBoundingBoxDescent || fontSize * 0.18;

  const width = Math.max(20, Math.ceil(currentOffset + pad * 2));
  const height = Math.max(20, Math.ceil(capHeight + descent + pad * 2));

  offCanvas.width = width;
  offCanvas.height = height;

  const startX = pad;
  const startY = pad + capHeight;

  ctx.font = letterFont;
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';

  const scaleRatio = fontSize / 500;

  function drawTextRuns(targetCtx, mode) {
    for (let i = 0; i < runs.length; i++) {
      const r = runs[i];
      const posX = startX + r.x;
      if (mode === 'stroke') targetCtx.strokeText(r.char, posX, startY);
      else targetCtx.fillText(r.char, posX, startY);
    }
  }

  function makeGradient(stops, yTop, yBottom) {
    const g = ctx.createLinearGradient(0, yTop, 0, yBottom);
    for (const s of stops) g.addColorStop(s.stop, s.color);
    return g;
  }

  const topY = startY - capHeight;
  const botY = startY;

  // ── GLOW BRANCO NAS BORDAS (Apenas para Colorful e Mono; Outline tem seu próprio renderizador vazado) ──────────
  if (glowIntensity > 0 && style !== 'outline') {
    const gBlur = Math.round(fontSize * 0.15 * (glowIntensity / 100));
    const gAlpha = 0.5 + 0.5 * (glowIntensity / 100);
    ctx.save();
    ctx.lineJoin = 'miter';
    ctx.miterLimit = 4;
    ctx.lineWidth = (28 * scaleRatio);
    ctx.shadowColor = `rgba(255, 255, 255, ${gAlpha})`;
    ctx.shadowBlur = gBlur;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.strokeStyle = `rgba(255, 255, 255, ${gAlpha * 0.7})`;
    drawTextRuns(ctx, 'stroke');
    ctx.restore();
  }

  if (style === 'colorful') {
    // 1. Sombra Escura Externa Grossa (intensidade controlada pelo slider)
    if (coverArt) {
      const sBlur  = shadowIntensity > 0 ? Math.round(fontSize * 0.12 * (shadowIntensity / 100)) : 0;
      const sAlpha = shadowIntensity > 0 ? (0.4 + 0.6 * (shadowIntensity / 100)) : 1;
      const sOff   = shadowIntensity > 0 ? Math.round(fontSize * 0.03 * (shadowIntensity / 100)) : 0;
      ctx.save();
      ctx.lineJoin = 'miter';
      ctx.miterLimit = 4;
      ctx.lineCap = 'butt';
      ctx.lineWidth = 42 * scaleRatio;
      ctx.strokeStyle = `rgba(29, 0, 46, ${sAlpha})`;
      ctx.shadowColor = `rgba(0, 0, 0, ${sAlpha})`;
      ctx.shadowBlur = sBlur;
      ctx.shadowOffsetX = sOff;
      ctx.shadowOffsetY = sOff;
      drawTextRuns(ctx, 'stroke');
      ctx.restore();
    }

    // 2. Stroke Roxo com Gradiente
    ctx.save();
    ctx.lineJoin = 'miter';
    ctx.miterLimit = 4;
    ctx.lineCap = 'butt';
    ctx.lineWidth = 28 * scaleRatio;
    ctx.strokeStyle = makeGradient(GRADIENT_STROKE_ROXO, topY, botY);
    drawTextRuns(ctx, 'stroke');
    ctx.restore();

    // 3. Stroke Branco ou Gradiente Secundário
    ctx.save();
    ctx.lineJoin = 'miter';
    ctx.miterLimit = 4;
    ctx.lineCap = 'butt';
    ctx.lineWidth = 12 * scaleRatio;
    ctx.strokeStyle = coverArt ? '#ffffff' : makeGradient(GRADIENT_STROKE_SECONDARY, topY, botY);
    drawTextRuns(ctx, 'stroke');
    ctx.restore();

    // 4. Preenchimento Gradiente Colorido (Laranja -> Rosa -> Azul)
    ctx.save();
    ctx.fillStyle = makeGradient(GRADIENT_COLORFUL, topY, botY);
    drawTextRuns(ctx, 'fill');
    ctx.restore();

    // 5. Textura de Palmeiras com Soft-Light
    if (palmTree && palmColorImg) {
      const palmCanvas = document.createElement('canvas');
      palmCanvas.width = width;
      palmCanvas.height = height;
      const pCtx = palmCanvas.getContext('2d');

      if (pCtx) {
        const maskCanvas = document.createElement('canvas');
        maskCanvas.width = width;
        maskCanvas.height = height;
        const mCtx = maskCanvas.getContext('2d');
        mCtx.font = letterFont;
        mCtx.fillStyle = '#fff';
        drawTextRuns(mCtx, 'fill');

        const palmTile = makeScaledPalmTile(palmColorImg, fontSize);
        const pattern = palmTile && pCtx.createPattern(palmTile, 'repeat');
        if (pattern) {
          shiftPalmPattern(pattern, palmTile, palmOffsetX, palmOffsetY);
          pCtx.save();
          pCtx.fillStyle = pattern;
          pCtx.fillRect(0, topY, width, capHeight + descent);
          pCtx.restore();

          pCtx.globalCompositeOperation = 'destination-in';
          pCtx.drawImage(maskCanvas, 0, 0);

          ctx.save();
          ctx.globalAlpha = 1;
          ctx.globalCompositeOperation = 'soft-light';
          ctx.drawImage(palmCanvas, 0, 0);
          ctx.restore();
        }
      }
    }

    // 6. Reflexo Angular de Luz (62 graus)
    const angle = (62 * Math.PI) / 180;
    const cosA = Math.cos(angle);
    const sinA = -Math.sin(angle);
    const rayDist = capHeight;

    for (let i = 0; i < runs.length; i++) {
      const r = runs[i];
      const cX = startX + r.x;
      if (r.char.trim() !== '') {
        const charCanvas = document.createElement('canvas');
        charCanvas.width = width;
        charCanvas.height = height;
        const cCtx = charCanvas.getContext('2d');

        const grad = cCtx.createLinearGradient(cX, startY, cX + cosA * rayDist, startY + sinA * rayDist);
        for (const st of GRADIENT_REFLEXO) grad.addColorStop(st.stop, st.color);

        cCtx.fillStyle = grad;
        cCtx.fillRect(cX - 10, topY - 10, r.width + 20, capHeight + descent + 20);

        cCtx.globalCompositeOperation = 'destination-in';
        cCtx.font = letterFont;
        cCtx.fillStyle = '#fff';
        cCtx.fillText(r.char, cX, startY);

        ctx.save();
        ctx.drawImage(charCanvas, 0, 0);
        ctx.restore();
      }
    }

  } else if (style === 'mono') {
    // ESTILO MONO BRANCO
    const monoSBlur  = shadowIntensity > 0 ? Math.round(fontSize * 0.1 * (shadowIntensity / 100)) : 0;
    const monoSAlpha = shadowIntensity > 0 ? (0.4 + 0.6 * (shadowIntensity / 100)) : 0;
    const monoSOff   = shadowIntensity > 0 ? Math.round(fontSize * 0.03 * (shadowIntensity / 100)) : 0;
    ctx.save();
    ctx.lineJoin = 'miter';
    ctx.miterLimit = 4;
    ctx.lineCap = 'butt';
    ctx.lineWidth = 28 * scaleRatio;
    ctx.strokeStyle = '#ffffff';
    ctx.shadowColor = `rgba(0, 0, 0, ${monoSAlpha})`;
    ctx.shadowBlur = monoSBlur;
    ctx.shadowOffsetX = monoSOff;
    ctx.shadowOffsetY = monoSOff;
    drawTextRuns(ctx, 'stroke');
    ctx.restore();

    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineJoin = 'miter';
    ctx.miterLimit = 4;
    ctx.lineCap = 'butt';
    ctx.lineWidth = 14 * scaleRatio;
    ctx.strokeStyle = '#000000';
    drawTextRuns(ctx, 'stroke');
    ctx.restore();

    ctx.save();
    ctx.fillStyle = '#ffffff';
    drawTextRuns(ctx, 'fill');
    ctx.restore();

    if (palmTree && palmMonoImg) {
      const palmCanvas = document.createElement('canvas');
      palmCanvas.width = width;
      palmCanvas.height = height;
      const pCtx = palmCanvas.getContext('2d');

      if (pCtx) {
        const palmTile = makeScaledPalmTile(palmMonoImg, fontSize);
        const pattern = palmTile && pCtx.createPattern(palmTile, 'repeat');
        if (pattern) {
          shiftPalmPattern(pattern, palmTile, palmOffsetX, palmOffsetY);
          pCtx.save();
          pCtx.fillStyle = pattern;
          pCtx.fillRect(0, topY, width, capHeight + descent);
          pCtx.restore();

          const maskCanvas = document.createElement('canvas');
          maskCanvas.width = width;
          maskCanvas.height = height;
          const mCtx = maskCanvas.getContext('2d');
          mCtx.font = letterFont;
          mCtx.fillStyle = '#fff';
          drawTextRuns(mCtx, 'fill');

          pCtx.globalCompositeOperation = 'destination-in';
          pCtx.drawImage(maskCanvas, 0, 0);

          ctx.save();
          ctx.globalCompositeOperation = 'destination-out';
          ctx.drawImage(palmCanvas, 0, 0);
          ctx.restore();
        }
      }
    }

  } else if (style === 'outline') {
    // ESTILO OUTLINE — 100% vazado com miolo limpo e transparente
    const ribbonCanvas = document.createElement('canvas');
    ribbonCanvas.width = width;
    ribbonCanvas.height = height;
    const rCtx = ribbonCanvas.getContext('2d');

    if (rCtx) {
      rCtx.font = letterFont;
      rCtx.textBaseline = 'alphabetic';
      rCtx.textAlign = 'left';

      // 1. Contorno Escuro Externo (Cover Art)
      if (coverArt) {
        const oSAlpha = shadowIntensity > 0 ? (0.4 + 0.6 * (shadowIntensity / 100)) : 1;
        rCtx.save();
        rCtx.lineJoin = 'miter';
        rCtx.miterLimit = 4;
        rCtx.lineCap = 'butt';
        rCtx.lineWidth = 42 * scaleRatio;
        rCtx.strokeStyle = `rgba(29, 0, 46, ${oSAlpha})`;
        for (let i = 0; i < runs.length; i++) {
          rCtx.strokeText(runs[i].char, startX + runs[i].x, startY);
        }
        rCtx.restore();
      }

      // 2. Fita Branca
      rCtx.save();
      rCtx.lineJoin = 'miter';
      rCtx.miterLimit = 4;
      rCtx.lineCap = 'butt';
      rCtx.lineWidth = 28 * scaleRatio;
      rCtx.strokeStyle = '#ffffff';
      for (let i = 0; i < runs.length; i++) {
        rCtx.strokeText(runs[i].char, startX + runs[i].x, startY);
      }
      rCtx.restore();

      // 3. Corte Interno (elimina 100% de qualquer resíduo, sombra ou traço no interior da letra)
      rCtx.save();
      rCtx.globalCompositeOperation = 'destination-out';
      rCtx.lineJoin = 'miter';
      rCtx.miterLimit = 4;
      rCtx.lineCap = 'butt';
      rCtx.lineWidth = 14 * scaleRatio;
      rCtx.strokeStyle = '#000000';
      for (let i = 0; i < runs.length; i++) {
        rCtx.strokeText(runs[i].char, startX + runs[i].x, startY);
      }
      rCtx.fillStyle = '#000000';
      for (let i = 0; i < runs.length; i++) {
        rCtx.fillText(runs[i].char, startX + runs[i].x, startY);
      }
      rCtx.restore();
    }

    // 4. Desenha a fita vazada final com Glow e Sombra
    if (rCtx) {
      ctx.save();
      if (glowIntensity > 0) {
        const glowBlur = Math.round(fontSize * 0.1 * (glowIntensity / 100));
        const glowAlpha = 0.5 + 0.5 * (glowIntensity / 100);
        ctx.shadowColor = `rgba(255, 255, 255, ${glowAlpha})`;
        ctx.shadowBlur = glowBlur;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
      }
      ctx.drawImage(ribbonCanvas, 0, 0);
      ctx.restore();
    }
  }

  applyAdvancedOpacityMask(offCanvas, { cornersEnabled, cornerTL, cornerTR, cornerBL, cornerBR, linearEnabled, linearIntensity, linearAngle, radialEnabled, radialIntensity, radialRadius });
  return trimTransparentCanvas(offCanvas, 3);
}
