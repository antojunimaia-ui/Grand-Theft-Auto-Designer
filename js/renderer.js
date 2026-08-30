// ──────────────────────────────────────────────────────────
// MOTOR DE RENDERIZAÇÃO COMPLETO DO GTA VI
// ──────────────────────────────────────────────────────────

let palmColorImg = null;
let palmMonoImg = null;
let fontLoaded = false;

function renderGTAVIText(text, options = {}) {
  const {
    type = 'logo', // 'logo' (Brother 1816) ou 'normal' (GTA Art Deco / Pricedown)
    style = 'colorful', // 'colorful', 'mono' ou 'outline'
    coverArt = true,
    palmTree = true,
    fontSize = 260,
    letterSpacing = 0,
    fontFamily = 'GTA Art Deco Medium',
    fontColor = '#ffffff',
    shadowIntensity = 50, // 0 = sem sombra, 100 = sombra máxima
    glowIntensity = 0     // 0 = sem glow, 100 = glow máximo
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
  const safeText = (text !== undefined && text !== null) ? String(text) : '';
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
    const pad = Math.round(fontSize * 0.2);
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
    return offCanvas;
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

        const pattern = pCtx.createPattern(palmColorImg, 'repeat-x');
        if (pattern) {
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
        const pattern = pCtx.createPattern(palmMonoImg, 'repeat-x');
        if (pattern) {
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

  return offCanvas;
}
