(function(){
  var canvas = document.getElementById('wave');
  var ctx = canvas.getContext('2d');
  var W = canvas.width, H = canvas.height;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function colors(){
    var cs = getComputedStyle(document.documentElement);
    return {
      electric: cs.getPropertyValue('--electric').trim() || '#0089ad',
      magnetic: cs.getPropertyValue('--magnetic').trim() || '#b05e08',
      rule: cs.getPropertyValue('--rule').trim() || '#ccc',
      ink: cs.getPropertyValue('--ink').trim() || '#171b26',
      inkFaint: cs.getPropertyValue('--ink-faint').trim() || '#888'
    };
  }
  var C = colors();
  new MutationObserver(function(){ C = colors(); }).observe(document.documentElement, {attributes:true, attributeFilter:['data-theme']});
  if (window.matchMedia){
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(){ C = colors(); });
  }

  var midY = H/2;
  var amp = H*0.30;
  var cycles = 3;
  var k = cycles * 2 * Math.PI / W;

  function drawAxis(){
    ctx.strokeStyle = C.rule;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(30, midY); ctx.lineTo(W-30, midY);
    ctx.stroke();
    // arrowhead
    ctx.beginPath();
    ctx.moveTo(W-30, midY);
    ctx.lineTo(W-44, midY-7);
    ctx.moveTo(W-30, midY);
    ctx.lineTo(W-44, midY+7);
    ctx.stroke();
    ctx.fillStyle = C.inkFaint;
    ctx.font = '22px ' + getComputedStyle(document.body).fontFamily;
    ctx.textAlign = 'right';
    ctx.fillText('z  (Ausbreitung, c)', W-50, midY-14);
  }

  function drawWave(phase){
    // E field: vertical plane, cyan
    ctx.beginPath();
    ctx.strokeStyle = C.electric;
    ctx.lineWidth = 3;
    for (var x=30; x<=W-30; x+=2){
      var y = midY - amp * Math.sin(k*(x-30) - phase);
      if (x===30) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    }
    ctx.stroke();

    // B field: horizontal "into page" plane, amber, perspective-skewed
    var skew = 0.42; // vertical compression to fake depth
    ctx.beginPath();
    ctx.strokeStyle = C.magnetic;
    ctx.lineWidth = 3;
    for (var x2=30; x2<=W-30; x2+=2){
      var v = amp * Math.sin(k*(x2-30) - phase);
      var y2 = midY - v*skew;
      if (x2===30) ctx.moveTo(x2,y2); else ctx.lineTo(x2,y2);
    }
    ctx.stroke();

    // sample vectors
    var step = W/16;
    for (var i=2;i<16;i++){
      var x3 = 30 + i*step*((W-60)/W);
      if (x3 > W-40) continue;
      var vE = amp * Math.sin(k*(x3-30) - phase);
      var yE = midY - vE;
      var vB = amp * Math.sin(k*(x3-30) - phase) * skew;
      var yB = midY - vB;

      ctx.strokeStyle = C.electric;
      ctx.lineWidth = 1.6;
      ctx.globalAlpha = 0.85;
      ctx.beginPath(); ctx.moveTo(x3, midY); ctx.lineTo(x3, yE); ctx.stroke();

      ctx.strokeStyle = C.magnetic;
      ctx.beginPath(); ctx.moveTo(x3, midY); ctx.lineTo(x3, yB); ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }

  function frame(t){
    ctx.clearRect(0,0,W,H);
    drawAxis();
    drawWave(reduced ? 0.6 : t*0.0016);
    if (!reduced) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();

(function(){
  var canvas = document.getElementById('fieldcanvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var W = canvas.width, H = canvas.height;
  var scale = 75; // px per data unit, both axes
  var tooltip = document.getElementById('fxTooltip');
  var descEl = document.getElementById('fxDesc');

  var FIELDS = {
    quelle: {
      name: 'Quelle', accent: 'electric',
      formula: 'F(x,y) = (x, y)',
      desc: 'Konstante Divergenz ∇·F = 2 überall, keine Rotation — jeder Punkt ist eine Quelle.',
      fn: function(x,y){ return [x, y]; }
    },
    wirbel: {
      name: 'Wirbel', accent: 'magnetic',
      formula: 'F(x,y) = (−y, x)',
      desc: 'Konstante Rotation ∇×F = 2, keine Divergenz — reine Zirkulation um jeden Punkt.',
      fn: function(x,y){ return [-y, x]; }
    },
    sattel: {
      name: 'Sattel', accent: 'electric',
      formula: 'F(x,y) = (x, −y)',
      desc: 'Divergenz und Rotation sind überall 0 — trotzdem kein uniformes Feld: Kompression entlang y, Expansion entlang x.',
      fn: function(x,y){ return [x, -y]; }
    },
    scher: {
      name: 'Scherung', accent: 'magnetic',
      formula: 'F(x,y) = (y, 0)',
      desc: 'Gerade, parallele Stromlinien — und trotzdem ∇×F = −1 überall. Rotation ist keine Frage der sichtbaren Form der Feldlinien.',
      fn: function(x,y){ return [y, 0]; }
    },
    ladung: {
      name: 'Punktladung', accent: 'electric',
      formula: 'F(x,y) = (x, y) / (x²+y²)',
      desc: 'Wie ein 2D-Ladungsfeld: ∇·F ≈ 0 überall außer im (geglätteten) Zentrum — genau das Bild hinter Gleichung I.',
      fn: function(x,y){ var r2 = x*x + y*y + 0.12; return [x/r2, y/r2]; }
    }
  };
  var current = 'quelle';

  function colors(){
    var cs = getComputedStyle(document.documentElement);
    return {
      ink: cs.getPropertyValue('--ink').trim(),
      inkFaint: cs.getPropertyValue('--ink-faint').trim(),
      rule: cs.getPropertyValue('--rule').trim(),
      electric: cs.getPropertyValue('--electric').trim(),
      magnetic: cs.getPropertyValue('--magnetic').trim()
    };
  }
  var C = colors();
  new MutationObserver(function(){ C = colors(); draw(); }).observe(document.documentElement, {attributes:true, attributeFilter:['data-theme']});
  if (window.matchMedia){
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(){ C = colors(); draw(); });
  }

  function dataToPx(x,y){ return [W/2 + x*scale, H/2 - y*scale]; }
  function pxToData(px,py){ return [(px-W/2)/scale, (H/2-py)/scale]; }

  function drawArrow(x0,y0,x1,y1,color){
    var ang = Math.atan2(y1-y0, x1-x0);
    ctx.strokeStyle = color; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(x0,y0); ctx.lineTo(x1,y1); ctx.stroke();
    var hs = 5;
    ctx.beginPath();
    ctx.moveTo(x1,y1);
    ctx.lineTo(x1 - hs*Math.cos(ang-0.4), y1 - hs*Math.sin(ang-0.4));
    ctx.lineTo(x1 - hs*Math.cos(ang+0.4), y1 - hs*Math.sin(ang+0.4));
    ctx.closePath();
    ctx.fillStyle = color; ctx.fill();
  }

  function draw(hover){
    ctx.clearRect(0,0,W,H);
    var field = FIELDS[current];
    var accent = field.accent === 'magnetic' ? C.magnetic : C.electric;

    ctx.strokeStyle = C.rule; ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0,H/2); ctx.lineTo(W,H/2);
    ctx.moveTo(W/2,0); ctx.lineTo(W/2,H);
    ctx.stroke();

    for (var gx=-6; gx<=6; gx+=1){
      for (var gy=-4; gy<=4; gy+=1){
        var v = field.fn(gx,gy);
        var mag = Math.hypot(v[0], v[1]);
        if (!isFinite(mag) || mag < 1e-6) continue;
        var len = Math.min(8 + 9*Math.sqrt(mag), 26);
        var ux = v[0]/mag, uy = v[1]/mag;
        var p0 = dataToPx(gx,gy);
        var p1 = [p0[0] + ux*len, p0[1] - uy*len];
        ctx.globalAlpha = 0.55;
        drawArrow(p0[0],p0[1],p1[0],p1[1], accent);
        ctx.globalAlpha = 1;
      }
    }

    if (hover){
      var p = dataToPx(hover.x, hover.y);
      ctx.strokeStyle = C.inkFaint; ctx.setLineDash([3,3]); ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(p[0],0); ctx.lineTo(p[0],H);
      ctx.moveTo(0,p[1]); ctx.lineTo(W,p[1]);
      ctx.stroke();
      ctx.setLineDash([]);

      var hv = hover.F;
      var hmag = Math.hypot(hv[0],hv[1]) || 1;
      var hlen = Math.min(14 + 10*Math.sqrt(hmag), 60);
      var hux = hv[0]/hmag, huy = hv[1]/hmag;
      drawArrow(p[0],p[1], p[0]+hux*hlen, p[1]-huy*hlen, C.ink);
      ctx.beginPath(); ctx.arc(p[0],p[1],3.5,0,Math.PI*2);
      ctx.fillStyle = accent; ctx.fill();
    }
  }

  function partials(fn,x,y){
    var h = 0.0015;
    var fx1 = fn(x+h,y), fx0 = fn(x-h,y);
    var fy1 = fn(x,y+h), fy0 = fn(x,y-h);
    var dFxdx = (fx1[0]-fx0[0])/(2*h);
    var dFydx = (fx1[1]-fx0[1])/(2*h);
    var dFxdy = (fy1[0]-fy0[0])/(2*h);
    var dFydy = (fy1[1]-fy0[1])/(2*h);
    return { div: dFxdx+dFydy, curl: dFydx-dFxdy };
  }

  function eventPos(e){
    var rect = canvas.getBoundingClientRect();
    var clientX = e.touches ? e.touches[0].clientX : e.clientX;
    var clientY = e.touches ? e.touches[0].clientY : e.clientY;
    var cx = clientX - rect.left, cy = clientY - rect.top;
    return { px: cx*(W/rect.width), py: cy*(H/rect.height), cx: cx, cy: cy, rectW: rect.width, rectH: rect.height };
  }

  function onMove(e){
    var pos = eventPos(e);
    var d = pxToData(pos.px, pos.py);
    var field = FIELDS[current];
    var Fv = field.fn(d[0], d[1]);
    var pd = partials(field.fn, d[0], d[1]);

    draw({ x:d[0], y:d[1], F:Fv });

    tooltip.innerHTML =
      '<div><span class="row-label">(x, y)</span><span>(' + d[0].toFixed(2) + ', ' + d[1].toFixed(2) + ')</span></div>' +
      '<div><span class="row-label">F</span><span>(' + Fv[0].toFixed(2) + ', ' + Fv[1].toFixed(2) + ')</span></div>' +
      '<div><span class="row-label">∇·F</span><span>' + pd.div.toFixed(2) + '</span></div>' +
      '<div><span class="row-label">∇×F</span><span>' + pd.curl.toFixed(2) + '</span></div>';
    tooltip.classList.add('show');

    var left = pos.cx + 16, top = pos.cy + 16;
    if (left + 150 > pos.rectW) left = pos.cx - 166;
    if (top + 96 > pos.rectH) top = pos.cy - 106;
    tooltip.style.left = left + 'px';
    tooltip.style.top = top + 'px';
  }

  function onLeave(){
    tooltip.classList.remove('show');
    draw();
  }

  canvas.addEventListener('mousemove', onMove);
  canvas.addEventListener('mouseleave', onLeave);
  canvas.addEventListener('touchmove', function(e){ onMove(e); e.preventDefault(); }, {passive:false});
  canvas.addEventListener('touchend', onLeave);

  var btns = Array.prototype.slice.call(document.querySelectorAll('.fx-btn'));
  function setActive(key){
    current = key;
    btns.forEach(function(b){
      var isActive = b.getAttribute('data-field') === key;
      b.classList.toggle('active', isActive);
      b.classList.remove('electric','magnetic');
      if (isActive) b.classList.add(FIELDS[key].accent);
    });
    descEl.innerHTML = '<span class="fx-formula">' + FIELDS[key].formula + '</span> — ' + FIELDS[key].desc;
    draw();
  }
  btns.forEach(function(b){
    b.addEventListener('click', function(){ setActive(b.getAttribute('data-field')); });
  });

  setActive('quelle');
})();

(function(){
  var canvas = document.getElementById('dipolecanvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var W = canvas.width, H = canvas.height;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var cx = W/2, cy = H/2;
  var maxR = Math.min(W,H)/2 - 20;

  function colors(){
    var cs = getComputedStyle(document.documentElement);
    return {
      electric: cs.getPropertyValue('--electric').trim(),
      ink: cs.getPropertyValue('--ink').trim(),
      rule: cs.getPropertyValue('--rule').trim()
    };
  }
  var C = colors();
  new MutationObserver(function(){ C = colors(); }).observe(document.documentElement, {attributes:true, attributeFilter:['data-theme']});
  if (window.matchMedia){
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(){ C = colors(); });
  }

  var period = 90; // frames per oscillation (visual, not to scale)
  var speed = maxR / (period*2.6);

  function drawDipole(phase){
    var amp = Math.sin(phase);
    var len = 34;
    ctx.strokeStyle = C.ink; ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx, cy-len); ctx.lineTo(cx, cy+len);
    ctx.stroke();

    var ah = amp*22;
    ctx.strokeStyle = C.electric; ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx, cy-ah);
    ctx.stroke();
    var dir = ah >= 0 ? -1 : 1;
    ctx.beginPath();
    ctx.moveTo(cx, cy-ah);
    ctx.lineTo(cx-5, cy-ah+dir*7);
    ctx.lineTo(cx+5, cy-ah+dir*7);
    ctx.closePath();
    ctx.fillStyle = C.electric; ctx.fill();
  }

  function drawRing(radius, ageFrac){
    if (radius <= 0) return;
    var segs = 90;
    var fade = Math.max(0, 1 - ageFrac);
    if (fade <= 0) return;
    for (var i=0; i<segs; i++){
      var t0 = (i/segs) * Math.PI*2;
      var t1 = ((i+1)/segs) * Math.PI*2;
      var tm = (t0+t1)/2;
      var alpha = Math.abs(Math.sin(tm)) * fade;
      if (alpha < 0.03) continue;
      var x0 = cx + radius*Math.sin(t0), y0 = cy - radius*Math.cos(t0);
      var x1 = cx + radius*Math.sin(t1), y1 = cy - radius*Math.cos(t1);
      ctx.strokeStyle = C.electric;
      ctx.globalAlpha = alpha;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x0,y0); ctx.lineTo(x1,y1);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  var pulses = [];
  var frame = 0;

  function renderFrame(){
    ctx.clearRect(0,0,W,H);
    pulses.forEach(function(p){
      var age = frame - p.born;
      var radius = age*speed;
      drawRing(radius, radius/maxR);
    });
    drawDipole((frame/period)*Math.PI*2);
  }

  if (reduced){
    pulses = [{born:-period*0.4},{born:-period*1.4},{born:-period*2.4}];
    frame = 0;
    renderFrame();
  } else {
    function tick(){
      if (frame % period === 0) pulses.push({ born: frame });
      pulses = pulses.filter(function(p){ return (frame-p.born)*speed < maxR+10; });
      renderFrame();
      frame++;
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
})();

(function(){
  var canvas = document.getElementById('donutcanvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var W = canvas.width, H = canvas.height;
  var cx = W/2, cy = H/2 + 30;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function colors(){
    var cs = getComputedStyle(document.documentElement);
    return {
      electric: cs.getPropertyValue('--electric').trim(),
      ink: cs.getPropertyValue('--ink').trim(),
      inkFaint: cs.getPropertyValue('--ink-faint').trim()
    };
  }
  var C = colors();
  new MutationObserver(function(){ C = colors(); draw(1); }).observe(document.documentElement, {attributes:true, attributeFilter:['data-theme']});
  if (window.matchMedia){
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(){ C = colors(); draw(1); });
  }

  // fixed viewing angles — the shape never rotates, only brightness pulses
  var beta = 35 * Math.PI/180;   // azimuth (fixed)
  var alpha = 20 * Math.PI/180;  // elevation tilt (fixed)
  var cosB = Math.cos(beta), sinB = Math.sin(beta);
  var cosA = Math.cos(alpha), sinA = Math.sin(alpha);
  var R0 = 210;
  var Lrod = R0 * 0.34;

  function project(x, y, z){
    var x1 = x*cosB - y*sinB;
    var y1 = x*sinB + y*cosB;
    var z1 = z;
    var y2 = y1*cosA - z1*sinA;
    var z2 = y1*sinA + z1*cosA;
    return { sx: cx + x1, sy: cy - z2, depth: y2 };
  }

  // precompute latitude rings and meridians once — static geometry
  var rings = [];
  var ringCount = 13;
  for (var i=1; i<ringCount+1; i++){
    var theta = i * Math.PI / (ringCount+1);
    var r = R0 * Math.sin(theta)*Math.sin(theta);
    var h = R0 * 0.5 * Math.sin(2*theta);
    var pts = [];
    var segs = 48;
    for (var s=0; s<=segs; s++){
      var phi = (s/segs) * Math.PI*2;
      pts.push(project(r*Math.cos(phi), r*Math.sin(phi), h));
    }
    rings.push(pts);
  }

  var meridians = [];
  var meridianCount = 8;
  for (var m=0; m<meridianCount; m++){
    var phi0 = (m/meridianCount) * Math.PI*2;
    var pts2 = [];
    var tsegs = 44;
    for (var t=0; t<=tsegs; t++){
      var th = 0.02 + (t/tsegs) * (Math.PI - 0.04);
      var rr = R0 * Math.sin(th)*Math.sin(th);
      var hh = R0 * 0.5 * Math.sin(2*th);
      pts2.push(project(rr*Math.cos(phi0), rr*Math.sin(phi0), hh));
    }
    meridians.push(pts2);
  }

  function depthAlpha(d, base, span){
    var t = (d + R0) / (2*R0);
    t = Math.max(0, Math.min(1, t));
    return base + span*t;
  }

  function drawPolyline(pts, closed, baseAlpha, span, lineWidth){
    for (var k=0; k<pts.length-1; k++){
      var a = pts[k], b = pts[k+1];
      var al = depthAlpha((a.depth+b.depth)/2, baseAlpha, span);
      ctx.globalAlpha = al;
      ctx.strokeStyle = C.electric;
      ctx.lineWidth = lineWidth;
      ctx.beginPath();
      ctx.moveTo(a.sx, a.sy);
      ctx.lineTo(b.sx, b.sy);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  function draw(pulse){
    ctx.clearRect(0,0,W,H);
    var baseA = 0.16*pulse, spanA = 0.42*pulse;
    rings.forEach(function(pts){ drawPolyline(pts, true, baseA, spanA, 1.2); });
    meridians.forEach(function(pts){ drawPolyline(pts, false, baseA*0.9, spanA*0.9, 1); });

    // antenna rod, drawn on top
    var p0 = project(0,0,-Lrod), p1 = project(0,0,Lrod);
    ctx.strokeStyle = C.ink;
    ctx.globalAlpha = 1;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(p0.sx, p0.sy); ctx.lineTo(p1.sx, p1.sy);
    ctx.stroke();
    ctx.beginPath(); ctx.arc(p1.sx, p1.sy, 3, 0, Math.PI*2); ctx.fillStyle = C.ink; ctx.fill();
    ctx.beginPath(); ctx.arc(p0.sx, p0.sy, 3, 0, Math.PI*2); ctx.fillStyle = C.ink; ctx.fill();
  }

  if (reduced){
    draw(1);
  } else {
    var start = null;
    function tick(ts){
      if (start === null) start = ts;
      var t = (ts - start) / 1000;
      var pulse = 0.72 + 0.28*Math.sin(t * 1.3);
      draw(pulse);
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
})();

(function(){
  var canvas = document.getElementById('packetcanvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var W = canvas.width, H = canvas.height;
  var midY = H/2;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function colors(){
    var cs = getComputedStyle(document.documentElement);
    return {
      electric: cs.getPropertyValue('--electric').trim(),
      ink: cs.getPropertyValue('--ink').trim(),
      inkFaint: cs.getPropertyValue('--ink-faint').trim(),
      rule: cs.getPropertyValue('--rule').trim()
    };
  }
  var C = colors();
  new MutationObserver(function(){ C = colors(); if (reduced) render(staticFrame); }).observe(document.documentElement, {attributes:true, attributeFilter:['data-theme']});
  if (window.matchMedia){
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(){ C = colors(); if (reduced) render(staticFrame); });
  }

  var senderX = 70;
  var rightEdge = W - 40;
  var xObs = 520;
  var v = 2.4;          // px per frame — the wave's speed (stands in for c)
  var TonFrames = 110;  // how long the sender stays on
  var packetLen = v * TonFrames;
  var lambda = packetLen / 7;
  var k = 2*Math.PI/lambda;
  var amp = H*0.24;
  var staticFrame = TonFrames + 40;

  function smoothstep(t){ t = Math.max(0, Math.min(1, t)); return t*t*(3-2*t); }

  function windowFactor(x, trailingX, leadingX){
    var m = Math.min(18, (leadingX - trailingX)/2);
    if (m <= 0) return 0;
    if (x < trailingX + m) return smoothstep((x-trailingX)/m);
    if (x > leadingX - m) return smoothstep((leadingX-x)/m);
    return 1;
  }

  function drawAxis(){
    ctx.strokeStyle = C.rule; ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(20, midY); ctx.lineTo(rightEdge+15, midY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(rightEdge+15, midY); ctx.lineTo(rightEdge+3, midY-6);
    ctx.moveTo(rightEdge+15, midY); ctx.lineTo(rightEdge+3, midY+6);
    ctx.stroke();
    ctx.fillStyle = C.inkFaint;
    ctx.font = '13px ' + getComputedStyle(document.body).fontFamily;
    ctx.textAlign = 'right';
    ctx.fillText('Ausbreitung, c', rightEdge+15, midY-12);
  }

  function drawMarker(x, label, sub, active){
    var col = active ? C.electric : C.inkFaint;
    ctx.strokeStyle = col; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x, midY-46); ctx.lineTo(x, midY+46); ctx.stroke();
    ctx.beginPath(); ctx.arc(x, midY-46, 4, 0, Math.PI*2); ctx.fillStyle = col; ctx.fill();
    ctx.fillStyle = C.ink;
    ctx.font = '13px ' + getComputedStyle(document.body).fontFamily;
    ctx.textAlign = 'center';
    ctx.fillText(label, x, midY-56);
    ctx.fillStyle = col;
    ctx.font = 'bold 12px ' + getComputedStyle(document.body).fontFamily;
    ctx.fillText(sub, x, midY+62);
  }

  function render(frame){
    var leadingX = senderX + v*frame;
    var trailingX = frame <= TonFrames ? senderX : senderX + v*(frame - TonFrames);
    var senderOn = frame <= TonFrames;
    var signalPresent = xObs >= trailingX && xObs <= leadingX;

    ctx.clearRect(0,0,W,H);
    drawAxis();

    if (leadingX > trailingX){
      ctx.beginPath();
      var started = false;
      for (var x = Math.max(20, trailingX); x <= Math.min(leadingX, rightEdge+15); x += 2){
        var wf = windowFactor(x, trailingX, leadingX);
        var y = midY - amp * wf * Math.sin(k*x - k*v*frame);
        if (!started){ ctx.moveTo(x,y); started = true; } else { ctx.lineTo(x,y); }
      }
      ctx.strokeStyle = C.electric;
      ctx.lineWidth = 2.4;
      ctx.stroke();
    }

    drawMarker(senderX, 'Sender', senderOn ? 'EIN' : 'AUS', senderOn);
    drawMarker(xObs, 'Beobachter', signalPresent ? 'Signal da' : 'Stille', signalPresent);
  }

  if (reduced){
    render(staticFrame);
  } else {
    var frame = 0;
    function tick(){
      render(frame);
      frame++;
      if (senderX + v*frame > rightEdge + 15) frame = 0;
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
})();

(function(){
  var canvas = document.getElementById('rxcanvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var W = canvas.width, H = canvas.height;
  var midY = H*0.40;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function colors(){
    var cs = getComputedStyle(document.documentElement);
    return {
      electric: cs.getPropertyValue('--electric').trim(),
      ink: cs.getPropertyValue('--ink').trim(),
      inkFaint: cs.getPropertyValue('--ink-faint').trim(),
      rule: cs.getPropertyValue('--rule').trim()
    };
  }
  var C = colors();
  new MutationObserver(function(){ C = colors(); }).observe(document.documentElement, {attributes:true, attributeFilter:['data-theme']});
  if (window.matchMedia){
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(){ C = colors(); });
  }

  var xStart = 40, xEnd = W-40;
  var rodX = W*0.74;
  var rodTop = midY - 80, rodBottom = midY + 80;
  var amp = H*0.14;
  var cycles = 4.5;
  var k = cycles * 2 * Math.PI / (xEnd - xStart);

  function drawAxis(){
    ctx.strokeStyle = C.rule; ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(xStart, midY); ctx.lineTo(xEnd, midY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(xEnd, midY); ctx.lineTo(xEnd-12, midY-6);
    ctx.moveTo(xEnd, midY); ctx.lineTo(xEnd-12, midY+6);
    ctx.stroke();
    ctx.fillStyle = C.inkFaint;
    ctx.font = '13px ' + getComputedStyle(document.body).fontFamily;
    ctx.textAlign = 'left';
    ctx.fillText('Ausbreitung, c', xStart, midY-52);
  }

  function localField(phase){
    return amp * Math.sin(k*(rodX-xStart) - phase);
  }

  function drawWave(phase){
    ctx.beginPath();
    ctx.strokeStyle = C.electric;
    ctx.lineWidth = 2.4;
    for (var x=xStart; x<=rodX+30; x+=2){
      var y = midY - amp * Math.sin(k*(x-xStart) - phase);
      if (x===xStart) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    }
    ctx.stroke();
  }

  function drawRod(phase){
    ctx.strokeStyle = C.ink; ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(rodX, rodTop); ctx.lineTo(rodX, rodBottom);
    ctx.stroke();

    var Elocal = localField(phase);
    var shift = (Elocal/amp) * 20;

    var n = 5;
    ctx.fillStyle = C.electric;
    for (var i=0;i<n;i++){
      var restY = rodTop + (i+0.5)*(rodBottom-rodTop)/n;
      var y = restY - shift;
      ctx.beginPath();
      ctx.arc(rodX, y, 4.5, 0, Math.PI*2);
      ctx.fill();
    }

    var ah = shift;
    ctx.strokeStyle = C.electric; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(rodX+18, midY);
    ctx.lineTo(rodX+18, midY-ah);
    ctx.stroke();
    var dir = ah >= 0 ? -1 : 1;
    ctx.beginPath();
    ctx.moveTo(rodX+18, midY-ah);
    ctx.lineTo(rodX+13, midY-ah+dir*6);
    ctx.lineTo(rodX+23, midY-ah+dir*6);
    ctx.closePath();
    ctx.fillStyle = C.electric;
    ctx.fill();
  }

  function frame(t){
    ctx.clearRect(0,0,W,H);
    drawAxis();
    var phase = reduced ? 0.6 : t*0.0016;
    drawWave(phase);
    drawRod(phase);
    if (!reduced) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();