/* ==========================================================================
   GATELI ALACIADOS Y SPA — script.js
   Sin dependencias externas: si algo falla, la página se ve completa igual.
   Módulos (cada uno aislado con safe() para que un fallo no rompa a los demás):
     1. Configuración (número de WhatsApp: ÚNICO lugar donde vive)
     2. Utilidades y motor de animación (un solo requestAnimationFrame)
     3. WhatsApp · 4. Cargador · 5. Revelados · 6. Encabezado y menú
     7. Hero (hebras que se alacian con el scroll) · 8. Inclinación 3D
     9. Cinta · 10. Manifiesto · 11. Lupa · 12. Comparadores
    13. Proceso · 14. Gato curioso · 15. Formulario · 16. Extras
   ========================================================================== */
(function () {
  'use strict';

  /* Si este archivo llega a ejecutarse, avisa al HTML (que de lo contrario retira la clase "js") */
  window.__gateliOk = true;

  /* ---------- 1. Configuración ---------- */
  // Formato: 52 + 10 dígitos, sin signos. Si queda vacío, los botones y el formulario de WhatsApp se ocultan.
  var WHATSAPP_NUMERO = '529842355306';
  var NOMBRE_NEGOCIO = 'Gateli Alaciados y Spa';

  /* ---------- 2. Utilidades y motor ---------- */
  var doc = document;
  var root = doc.documentElement;

  function $(sel, ctx) { return (ctx || doc).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || doc).querySelectorAll(sel)); }
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function easeInOut(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function safe(nombre, fn) {
    try { fn(); } catch (e) { if (window.console && console.warn) console.warn('[Gateli] módulo "' + nombre + '":', e); }
  }

  var mq = window.matchMedia ? window.matchMedia.bind(window) : function () { return { matches: false }; };
  var reduce = mq('(prefers-reduced-motion: reduce)').matches;
  var tocando = mq('(hover: none), (pointer: coarse)').matches;
  if (reduce) root.classList.add('rm');

  var st = {
    y: window.pageYOffset || 0,
    ultimoY: window.pageYOffset || 0,
    vel: 0,
    velSuave: 0,
    vh: window.innerHeight,
    vw: window.innerWidth,
    max: 1
  };

  var actualizadores = [];
  var alRedimensionar = [];

  function registrar(nombre, fn) { actualizadores.push({ nombre: nombre, fn: fn, muerto: false }); }

  function medirDocumento() {
    st.vh = window.innerHeight;
    st.vw = window.innerWidth;
    st.max = Math.max(1, root.scrollHeight - st.vh);
  }

  function bucle(ahora) {
    window.requestAnimationFrame(bucle);
    var y = window.pageYOffset || 0;
    st.vel = y - st.ultimoY;
    st.ultimoY = y;
    st.y = y;
    st.velSuave = lerp(st.velSuave, st.vel, 0.12);
    for (var i = 0; i < actualizadores.length; i++) {
      var a = actualizadores[i];
      if (a.muerto) continue;
      try { a.fn(ahora, st); } catch (e) {
        a.muerto = true;
        if (window.console && console.warn) console.warn('[Gateli] animación "' + a.nombre + '" detenida:', e);
      }
    }
  }

  var temporizadorRedim = 0;
  window.addEventListener('resize', function () {
    window.clearTimeout(temporizadorRedim);
    temporizadorRedim = window.setTimeout(function () {
      medirDocumento();
      alRedimensionar.forEach(function (fn) { safe('redimensionar', fn); });
    }, 160);
  });

  /* ---------- 3. WhatsApp ---------- */
  function urlWhatsApp(mensaje) {
    if (!WHATSAPP_NUMERO) return '';
    return 'https://wa.me/' + WHATSAPP_NUMERO + (mensaje ? '?text=' + encodeURIComponent(mensaje) : '');
  }

  safe('whatsapp', function () {
    var enlaces = $$('[data-wa]');
    if (!WHATSAPP_NUMERO) {
      enlaces.forEach(function (a) { a.hidden = true; });
      var f = $('#form-cita');
      if (f) f.hidden = true;
      return;
    }
    enlaces.forEach(function (a) {
      a.setAttribute('href', urlWhatsApp(a.getAttribute('data-wa-msg') || ''));
      a.setAttribute('target', '_blank');
      a.setAttribute('rel', 'noopener noreferrer');
    });
    // El botón flotante saluda un momento para llamar la atención sin estorbar
    var flotante = $('#wa-flotante');
    if (flotante) {
      window.setTimeout(function () { flotante.classList.add('is-saluda'); }, 7000);
      window.setTimeout(function () { flotante.classList.remove('is-saluda'); }, 12500);
    }
  });

  /* ---------- 4. Cargador (la animación vive en CSS; aquí solo el contador y el arranque) ---------- */
  var paginaIniciada = false;
  var inicioHero = 0;

  function iniciarPagina() {
    if (paginaIniciada) return;
    paginaIniciada = true;
    inicioHero = window.performance ? performance.now() : Date.now();
    root.classList.add('listo');
    safe('revelados', iniciarRevelados);
  }

  safe('cargador', function () {
    var cargador = $('#cargador');
    var pct = $('#cargador-pct');
    if (!cargador || reduce) {
      window.setTimeout(iniciarPagina, 30);
      return;
    }
    var t0 = performance.now();
    function contar(ahora) {
      var t = clamp((ahora - t0 - 100) / 1500, 0, 1);
      if (pct) pct.textContent = String(Math.round(easeInOut(t) * 100));
      if (t < 1) window.requestAnimationFrame(contar);
    }
    window.requestAnimationFrame(contar);
    window.setTimeout(iniciarPagina, 1700);
    window.setTimeout(function () {
      if (cargador.parentNode) cargador.parentNode.removeChild(cargador);
    }, 2700);
  });

  /* ---------- 5. Revelados con scroll ---------- */
  function prepararTitulos() {
    $$('[data-split]').forEach(function (el) {
      var n = 0;
      (function envolver(nodo) {
        Array.prototype.slice.call(nodo.childNodes).forEach(function (hijo) {
          if (hijo.nodeType === 3) {
            var frag = doc.createDocumentFragment();
            hijo.textContent.split(/(\s+)/).forEach(function (parte) {
              if (!parte) return;
              if (/^\s+$/.test(parte)) { frag.appendChild(doc.createTextNode(' ')); return; }
              var w = doc.createElement('span');
              var wi = doc.createElement('span');
              w.className = 'w';
              wi.className = 'w__i';
              wi.style.setProperty('--i', String(n++));
              wi.textContent = parte;
              w.appendChild(wi);
              frag.appendChild(w);
            });
            nodo.replaceChild(frag, hijo);
          } else if (hijo.nodeType === 1) {
            envolver(hijo);
          }
        });
      })(el);
    });
  }

  function mostrar(el) {
    el.classList.add('is-in');
    window.setTimeout(function () { el.classList.add('is-done'); }, 2600);
  }

  function iniciarRevelados() {
    var items = $$('[data-reveal], [data-split]');
    if (!('IntersectionObserver' in window)) { items.forEach(mostrar); return; }
    var io = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en) {
        if (en.isIntersecting) { mostrar(en.target); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    items.forEach(function (el) { io.observe(el); });
  }

  safe('titulos', prepararTitulos);

  /* ---------- 6. Encabezado, menú móvil y barra de progreso ---------- */
  safe('cabecera', function () {
    var cab = $('#cabecera');
    var btn = $('#hamburguesa');
    var menu = $('#menu-movil');
    var barra = $('#barra-progreso');
    var abierto = false;

    function alternar(abrir) {
      abierto = abrir;
      if (!btn || !menu) return;
      btn.setAttribute('aria-expanded', abrir ? 'true' : 'false');
      btn.setAttribute('aria-label', abrir ? 'Cerrar menú' : 'Abrir menú');
      menu.classList.toggle('is-abierto', abrir);
      menu.setAttribute('aria-hidden', abrir ? 'false' : 'true');
    }
    if (btn && menu) {
      btn.addEventListener('click', function () { alternar(!abierto); });
      $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { alternar(false); }); });
      doc.addEventListener('keydown', function (e) { if (e.key === 'Escape' && abierto) { alternar(false); btn.focus(); } });
    }

    var ocultaEn = 0;
    registrar('cabecera', function (ahora, s) {
      if (barra) barra.style.transform = 'scaleX(' + clamp(s.y / s.max, 0, 1).toFixed(4) + ')';
      if (!cab) return;
      if (s.y > 160 && s.vel > 3 && !abierto) { if (!ocultaEn) { cab.classList.add('is-oculta'); ocultaEn = 1; } }
      else if (s.vel < -3 || s.y < 160 || abierto) { if (ocultaEn) { cab.classList.remove('is-oculta'); ocultaEn = 0; } }
    });

    // Enlace activo según la sección que se está viendo
    if ('IntersectionObserver' in window) {
      var enlaces = $$('.menu a');
      var obs = new IntersectionObserver(function (entradas) {
        entradas.forEach(function (en) {
          if (!en.isIntersecting) return;
          enlaces.forEach(function (a) { a.classList.toggle('is-activo', a.getAttribute('href') === '#' + en.target.id); });
        });
      }, { rootMargin: '-40% 0px -55% 0px' });
      ['servicios', 'resultados', 'comparar', 'experiencia', 'proceso', 'faq'].forEach(function (id) {
        var s = doc.getElementById(id);
        if (s) obs.observe(s);
      });
    }
  });

  /* ---------- 7. Hero: hebras de cabello que se alacian + partículas ---------- */
  safe('hero', function () {
    var canvas = $('#tejido');
    var hero = $('#inicio');
    if (!canvas || !hero || !canvas.getContext) return;
    var ctx = canvas.getContext('2d');
    if (!ctx) return;

    var ondita = $('#ondita');
    var medidor = $('#medidor-valor');
    var W = 0, H = 0, dpr = 1;
    var hebras = [];
    var particulas = [];
    var visible = true;
    var puntero = { x: -999, y: -999, activo: 0, objX: -999, objY: -999 };
    var rectoSuave = 0;
    var ultimoT = 0;
    var conParticulas = typeof Path2D !== 'undefined';

    var formas = null;
    if (conParticulas) {
      var corazon = new Path2D('M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z');
      var chispa = new Path2D('M12 1.5c.8 5.6 3.9 9 10.5 10.5-6.6 1.5-9.7 4.9-10.5 10.5-.8-5.6-3.9-9-10.5-10.5C8.1 10.5 11.2 7.1 12 1.5z');
      var huella = new Path2D();
      [[12, 16, 5.6, 4.6], [5.2, 10.6, 2.1, 2.9], [9.4, 6.4, 2.2, 3.1], [14.6, 6.4, 2.2, 3.1], [18.8, 10.6, 2.1, 2.9]].forEach(function (e) {
        huella.moveTo(e[0] + e[2], e[1]);
        huella.ellipse(e[0], e[1], e[2], e[3], 0, 0, Math.PI * 2);
      });
      formas = [corazon, chispa, huella];
    }

    var colores = ['rgba(255,255,255,0.55)', 'rgba(255,255,255,0.55)', 'rgba(255,255,255,0.4)', 'rgba(255,140,198,0.6)', 'rgba(212,22,111,0.24)', 'rgba(91,15,94,0.14)'];
    var coloresParticula = ['rgba(255,255,255,0.95)', 'rgba(212,22,111,0.5)', 'rgba(255,255,255,0.9)', 'rgba(91,15,94,0.35)', 'rgba(255,90,172,0.7)'];

    function medirLienzo() {
      var r = hero.getBoundingClientRect();
      W = Math.max(1, Math.round(r.width));
      H = Math.max(1, Math.round(r.height));
      dpr = Math.min(window.devicePixelRatio || 1, W < 700 ? 1.5 : 1.75);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      var n = W < 700 ? 30 : (W < 1100 ? 46 : 68);
      hebras = [];
      for (var i = 0; i < n; i++) {
        hebras.push({
          x: (i + 0.5) / n * W + (Math.random() - 0.5) * (W / n) * 0.7,
          fase: Math.random() * 6.283,
          fase2: Math.random() * 6.283,
          amp: 0.55 + Math.random() * 0.95,
          f1: 0.016 + Math.random() * 0.016,
          f2: 0.045 + Math.random() * 0.04,
          v: 0.35 + Math.random() * 0.6,
          ancho: 0.8 + Math.random() * 1.5,
          color: colores[Math.floor(Math.random() * colores.length)]
        });
      }
      particulas = [];
      if (conParticulas) {
        var np = W < 700 ? 12 : 24;
        for (var j = 0; j < np; j++) {
          particulas.push({
            x: Math.random() * W, y: Math.random() * H,
            s: 8 + Math.random() * 14, vy: 0.14 + Math.random() * 0.3,
            d: Math.random() * 6.283, rot: Math.random() * 6.283, vr: (Math.random() - 0.5) * 0.012,
            forma: j % 3, color: coloresParticula[j % coloresParticula.length]
          });
        }
      }
    }

    function dibujar(t, recto, dt) {
      ctx.clearRect(0, 0, W, H);
      var respira = 0.07 + 0.05 * Math.sin(t * 0.8);
      var A = (1 - recto) + respira;
      var escala = clamp(W / 1300, 0.55, 1.15);
      var pasos = 38;
      var dy = H / pasos;
      var brilloY = (((t * 0.13) % 1.6) - 0.3) * H;
      var grad = ctx.createLinearGradient(0, brilloY - H * 0.17, 0, brilloY + H * 0.17);
      grad.addColorStop(0, 'rgba(255,255,255,0)');
      grad.addColorStop(0.5, 'rgba(255,255,255,0.95)');
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      var sway = clamp(st.velSuave, -40, 40) * 0.9;
      var pActivo = puntero.activo > 0.01;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      for (var i = 0; i < hebras.length; i++) {
        var h = hebras[i];
        var trazo = new Path2D();
        for (var k = 0; k <= pasos; k++) {
          var y = k * dy;
          var env = 0.25 + 0.75 * (y / H);
          var onda = Math.sin(y * h.f1 + t * h.v + h.fase) + 0.5 * Math.sin(y * h.f2 - t * h.v * 0.7 + h.fase2);
          var x = h.x + A * h.amp * 30 * escala * env * onda + sway * (y / H) * 0.6;
          if (pActivo) {
            var ddx = x - puntero.x;
            var ddy = y - puntero.y;
            var d2 = ddx * ddx + ddy * ddy;
            if (d2 < 22500) {
              var f = 1 - Math.sqrt(d2) / 150;
              x += (ddx >= 0 ? 1 : -1) * f * f * 46 * puntero.activo;
            }
          }
          if (k === 0) trazo.moveTo(x, y); else trazo.lineTo(x, y);
        }
        ctx.strokeStyle = h.color;
        ctx.lineWidth = h.ancho;
        ctx.stroke(trazo);
        ctx.strokeStyle = grad;
        ctx.lineWidth = h.ancho + 0.9;
        ctx.stroke(trazo);
      }

      if (conParticulas && formas) {
        for (var p = 0; p < particulas.length; p++) {
          var pa = particulas[p];
          pa.y -= pa.vy * dt * 60;
          pa.x += Math.sin(t * 0.6 + pa.d) * 0.28;
          pa.rot += pa.vr;
          if (pa.y < -30) { pa.y = H + 30; pa.x = Math.random() * W; }
          ctx.save();
          ctx.translate(pa.x, pa.y);
          ctx.rotate(pa.rot);
          var sc = pa.s / 24;
          ctx.scale(sc, sc);
          ctx.translate(-12, -12);
          ctx.fillStyle = pa.color;
          ctx.fill(formas[pa.forma]);
          ctx.restore();
        }
      }
    }

    function actualizarTextos(t, recto) {
      if (ondita) {
        var A = (1 - recto) + 0.07 + 0.05 * Math.sin(t * 0.8);
        var d = 'M0 8';
        for (var x = 0; x <= 200; x += 10) {
          d += ' L' + x + ' ' + (8 + A * 5 * Math.sin(x * 0.09 + t * 3)).toFixed(2);
        }
        ondita.setAttribute('d', d);
      }
      if (medidor) medidor.textContent = Math.round(recto * 100) + '%';
    }

    medirLienzo();
    alRedimensionar.push(function () { medirLienzo(); if (reduce) dibujar(2, 0.85, 0.016); });

    if (reduce) {
      dibujar(2, 0.85, 0.016);
      actualizarTextos(2, 0.85);
      return;
    }

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (e) { visible = e[0].isIntersecting; }, { threshold: 0 }).observe(hero);
    }
    if ('ResizeObserver' in window) {
      var ro = new ResizeObserver(function () { medirLienzo(); });
      ro.observe(hero);
    }

    hero.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'touch') return;
      var r = hero.getBoundingClientRect();
      puntero.objX = e.clientX - r.left;
      puntero.objY = e.clientY - r.top;
      if (puntero.x < -500) { puntero.x = puntero.objX; puntero.y = puntero.objY; }
      puntero.activo = 1;
    }, { passive: true });
    hero.addEventListener('pointerleave', function () { puntero.activo = 0.0001; });

    registrar('hero', function (ahora, s) {
      if (!visible) return;
      var t = ahora / 1000;
      var dt = ultimoT ? Math.min(0.05, t - ultimoT) : 0.016;
      ultimoT = t;
      // 1) Al abrir la página las hebras se peinan solas hasta ~60 %; 2) con el scroll llegan al 100 %.
      var auto = inicioHero ? easeInOut(clamp((ahora - inicioHero) / 3400, 0, 1)) * 0.6 : 0;
      var porScroll = clamp(s.y / (H * 0.62), 0, 1);
      var objetivo = Math.max(auto, porScroll);
      rectoSuave = lerp(rectoSuave, objetivo, 0.08);
      puntero.x = lerp(puntero.x, puntero.objX, 0.2);
      puntero.y = lerp(puntero.y, puntero.objY, 0.2);
      if (puntero.activo > 0.0001) puntero.activo *= 0.985;
      dibujar(t, rectoSuave, dt);
      actualizarTextos(t, rectoSuave);
    });
  });

  /* ---------- 8. Inclinación 3D, brillo que sigue al cursor y parallax ---------- */
  safe('inclinacion', function () {
    $$('[data-tilt]').forEach(function (el) {
      var esHero = el.classList.contains('hero__visual');
      var max = esHero ? 9 : 6;
      var rx = 0, ry = 0, objRx = 0, objRy = 0;
      var manual = false;

      if (!tocando && !reduce) {
        el.addEventListener('pointermove', function (e) {
          if (e.pointerType === 'touch') return;
          var r = el.getBoundingClientRect();
          var px = (e.clientX - r.left) / r.width;
          var py = (e.clientY - r.top) / r.height;
          objRy = (px - 0.5) * 2 * max;
          objRx = -(py - 0.5) * 2 * max;
          el.style.setProperty('--gx', (px * 100).toFixed(1) + '%');
          el.style.setProperty('--gy', (py * 100).toFixed(1) + '%');
          manual = true;
        }, { passive: true });
        el.addEventListener('pointerleave', function () { objRx = 0; objRy = 0; manual = false; });
      }

      var ultimo = '';
      registrar('inclinacion', function (ahora) {
        if (reduce) return;
        if (esHero && tocando && !manual) {
          // En pantallas táctiles el arco se mece solo
          objRy = Math.sin(ahora / 1700) * 5;
          objRx = Math.cos(ahora / 2100) * 3;
        }
        rx = lerp(rx, objRx, 0.1);
        ry = lerp(ry, objRy, 0.1);
        var valor = (Math.abs(rx) + Math.abs(ry) < 0.02) ? '' : 'perspective(900px) rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg)';
        if (valor !== ultimo) {
          ultimo = valor;
          if (valor) el.style.setProperty('--tilt', valor); else el.style.removeProperty('--tilt');
        }
      });
    });

    // Parallax suave
    var paralax = $$('[data-parallax]');
    if (paralax.length && !reduce) {
      registrar('parallax', function (ahora, s) {
        paralax.forEach(function (el) {
          var r = el.parentNode.getBoundingClientRect();
          if (r.bottom < -200 || r.top > s.vh + 200) return;
          var v = (r.top + r.height / 2 - s.vh / 2) * parseFloat(el.getAttribute('data-parallax') || '0.05');
          el.style.transform = 'translate3d(0,' + v.toFixed(1) + 'px,0)';
        });
      });
    }
  });

  /* ---------- 9. Cinta: acelera con el scroll ---------- */
  safe('cinta', function () {
    var pista = $('#cinta-pista');
    if (!pista || !pista.getAnimations || reduce) return;
    var anim = null;
    registrar('cinta', function (ahora, s) {
      if (!anim) {
        var lista = pista.getAnimations();
        if (!lista.length) return;
        anim = lista[0];
      }
      var rate = 1 + clamp(Math.abs(s.velSuave) * 0.14, 0, 5);
      if (Math.abs(anim.playbackRate - rate) > 0.03) anim.playbackRate = rate;
    });
  });

  /* ---------- 10. Manifiesto: las palabras se iluminan con el scroll ---------- */
  safe('manifiesto', function () {
    var pista = $('#manif-pista');
    var texto = $('.manif__texto[data-scrub]');
    var seccion = $('#manifiesto');
    if (!pista || !texto || !seccion) return;
    var palabras = [];

    (function envolver(nodo) {
      Array.prototype.slice.call(nodo.childNodes).forEach(function (hijo) {
        if (hijo.nodeType === 3) {
          var frag = doc.createDocumentFragment();
          hijo.textContent.split(/(\s+)/).forEach(function (parte) {
            if (!parte) return;
            if (/^\s+$/.test(parte)) { frag.appendChild(doc.createTextNode(' ')); return; }
            var s = doc.createElement('span');
            s.className = 'ps';
            s.textContent = parte;
            palabras.push(s);
            frag.appendChild(s);
          });
          nodo.replaceChild(frag, hijo);
        } else if (hijo.nodeType === 1) {
          envolver(hijo);
        }
      });
    })(texto);

    if (reduce) { seccion.classList.add('is-listo'); return; }

    var ps = 0;
    var ultimo = -1;
    registrar('manifiesto', function (ahora, s) {
      var r = pista.getBoundingClientRect();
      if (r.bottom < -50 || r.top > s.vh + 50) return;
      var total = r.height - s.vh;
      var p = total > 0 ? clamp(-r.top / total, 0, 1) : 1;
      ps = lerp(ps, p, 0.14);
      if (Math.abs(ps - ultimo) < 0.0008) return;
      ultimo = ps;
      var n = palabras.length;
      var avance = clamp(ps / 0.8, 0, 1) * (n + 3);
      for (var i = 0; i < n; i++) {
        var a = clamp((avance - i) / 3, 0, 1);
        palabras[i].style.opacity = (0.16 + 0.84 * a).toFixed(3);
      }
      seccion.classList.toggle('is-listo', ps > 0.84);
    });
  });

  /* ---------- 11. Lupa: el collage se abre en grande con el scroll ---------- */
  safe('lupa', function () {
    var pista = $('#lupa-pista');
    var marco = $('#lupa-marco');
    var seccion = $('#resultados');
    if (!pista || !marco || !seccion) return;
    var escena = $('.lupa__escena', pista);
    if (reduce) { seccion.classList.add('is-abierta'); return; }

    var w = 0, h = 0;
    function medir() { w = marco.offsetWidth; h = marco.offsetHeight; }
    medir();
    alRedimensionar.push(medir);

    var ps = 0;
    var ultimo = -1;
    registrar('lupa', function (ahora, s) {
      var r = pista.getBoundingClientRect();
      if (r.bottom < -50 || r.top > s.vh + 50) return;
      if (!w || !h) medir();
      if (!w || !h) return;
      var total = r.height - s.vh;
      var p = total > 0 ? clamp(-r.top / total, 0, 1) : 1;
      ps = lerp(ps, p, 0.12);
      if (Math.abs(ps - ultimo) < 0.0006) return;
      ultimo = ps;

      var e = easeInOut(clamp(ps / 0.62, 0, 1));
      var d = Math.min(150, w * 0.6, h * 0.6);
      var ix = lerp((1 - d / w) * 50, 0, e);
      var iy = lerp((1 - d / h) * 50, 0, e);
      escena.style.setProperty('--p', ps.toFixed(4));
      marco.style.setProperty('--ix', ix.toFixed(3) + '%');
      marco.style.setProperty('--iy', iy.toFixed(3) + '%');
      marco.style.setProperty('--r', lerp(d / 2 + 20, 30, e).toFixed(1) + 'px');
      marco.style.setProperty('--rot', lerp(-8, 0, e).toFixed(2) + 'deg');
      marco.style.setProperty('--zoom', lerp(1.45, 1, e).toFixed(3));
      seccion.classList.toggle('is-abierta', e > 0.96);
    });
  });

  /* ---------- 12. Comparadores antes / después ---------- */
  safe('comparadores', function () {
    $$('[data-comparador]').forEach(function (el) {
      var asa = $('.comparador__asa', el);
      if (!asa) return;
      var pos = 50;
      var manual = false;
      var arrastrando = false;

      function poner(v) {
        pos = clamp(v, 0, 100);
        el.style.setProperty('--pos', pos.toFixed(2));
        asa.setAttribute('aria-valuenow', String(Math.round(pos)));
      }
      function desde(e) {
        var r = el.getBoundingClientRect();
        return clamp((e.clientX - r.left) / r.width * 100, 0, 100);
      }

      el.addEventListener('pointerdown', function (e) {
        arrastrando = true;
        manual = true;
        try { el.setPointerCapture(e.pointerId); } catch (err) { /* sin captura */ }
        poner(desde(e));
      });
      el.addEventListener('pointermove', function (e) { if (arrastrando) poner(desde(e)); });
      function soltar() { arrastrando = false; }
      el.addEventListener('pointerup', soltar);
      el.addEventListener('pointercancel', soltar);

      asa.addEventListener('keydown', function (e) {
        var paso = e.shiftKey ? 12 : 5;
        var k = e.key;
        if (k === 'ArrowLeft' || k === 'ArrowDown') { poner(pos - paso); }
        else if (k === 'ArrowRight' || k === 'ArrowUp') { poner(pos + paso); }
        else if (k === 'Home') { poner(0); }
        else if (k === 'End') { poner(100); }
        else { return; }
        manual = true;
        e.preventDefault();
      });

      if (reduce) return;
      registrar('comparador', function (ahora, s) {
        if (arrastrando || manual) return;
        var r = el.getBoundingClientRect();
        if (r.bottom < 0 || r.top > s.vh) return;
        // El deslizador sigue el scroll hasta que la persona lo toque
        var prog = clamp((s.vh * 0.92 - r.top) / (s.vh * 0.5 + r.height * 0.35), 0, 1);
        poner(lerp(pos, lerp(10, 90, easeInOut(prog)), 0.08));
      });
    });
  });

  /* ---------- 13. Proceso: la línea de huellitas se dibuja con el scroll ---------- */
  safe('proceso', function () {
    var cont = $('#pasos');
    if (!cont) return;
    var pasos = $$('.paso', cont);
    if (!pasos.length) return;
    var ps = 0;
    registrar('proceso', function (ahora, s) {
      var r = cont.getBoundingClientRect();
      if (r.bottom < -100 || r.top > s.vh + 100) return;
      var horizontal = s.vw >= 900;
      var p = horizontal
        ? clamp((s.vh * 0.85 - r.top) / (s.vh * 0.45), 0, 1)
        : clamp((s.vh * 0.6 - r.top) / Math.max(1, r.height), 0, 1);
      ps = lerp(ps, p, 0.1);
      cont.style.setProperty('--p', ps.toFixed(4));
      for (var i = 0; i < pasos.length; i++) {
        var umbral = (i / (pasos.length - 1)) * 0.92;
        pasos[i].classList.toggle('is-on', ps >= umbral - 0.0001);
      }
    });
  });

  /* ---------- 14. Gato curioso: los ojos siguen al cursor ---------- */
  safe('gato', function () {
    var gato = $('.gato');
    if (!gato || reduce) return;
    var pupilas = $$('.gato__pupila', gato);
    var objetivo = { x: 0, y: 0 };
    var actual = { x: 0, y: 0 };
    var ultimoMovimiento = 0;
    var visible = false;

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (e) { visible = e[0].isIntersecting; }, { threshold: 0 }).observe(gato);
    } else { visible = true; }

    window.addEventListener('pointermove', function (e) {
      if (!visible) return;
      var r = gato.getBoundingClientRect();
      var dx = e.clientX - (r.left + r.width * 0.5);
      var dy = e.clientY - (r.top + r.height * 0.55);
      var d = Math.sqrt(dx * dx + dy * dy) || 1;
      var m = Math.min(1, d / 260);
      objetivo.x = dx / d * 5 * m;
      objetivo.y = dy / d * 4.5 * m;
      ultimoMovimiento = performance.now();
    }, { passive: true });

    registrar('gato', function (ahora) {
      if (!visible) return;
      if (ahora - ultimoMovimiento > 2500) {
        objetivo.x = Math.sin(ahora / 1100) * 3.4;
        objetivo.y = 0.6;
      }
      actual.x = lerp(actual.x, objetivo.x, 0.18);
      actual.y = lerp(actual.y, objetivo.y, 0.18);
      var t = 'translate(' + actual.x.toFixed(2) + ' ' + actual.y.toFixed(2) + ')';
      pupilas.forEach(function (p) { p.setAttribute('transform', t); });
    });
  });

  /* ---------- 15. Formulario: arma el mensaje y abre WhatsApp ---------- */
  safe('formulario', function () {
    var form = $('#form-cita');
    if (!form || !WHATSAPP_NUMERO) return;
    var nombre = $('#f-nombre');
    var error = $('#f-nombre-error');
    var estado = $('#form-estado');

    function limpiar() {
      if (error) error.hidden = true;
      if (nombre) {
        nombre.removeAttribute('aria-invalid');
        if (nombre.parentNode) nombre.parentNode.classList.remove('campo--invalido');
      }
    }
    if (nombre) nombre.addEventListener('input', limpiar);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var quien = nombre ? nombre.value.replace(/\s+/g, ' ').trim() : '';
      if (!quien) {
        if (error) error.hidden = false;
        if (nombre) {
          nombre.setAttribute('aria-invalid', 'true');
          if (nombre.parentNode) nombre.parentNode.classList.add('campo--invalido');
          nombre.focus();
        }
        return;
      }
      limpiar();
      var ritual = form.elements.ritual ? form.elements.ritual.value : '';
      var largo = form.querySelector('input[name="largo"]:checked');
      var extra = form.elements.mensaje ? form.elements.mensaje.value.trim() : '';
      var partes = ['Hola ' + NOMBRE_NEGOCIO + ' 👋', 'Soy ' + quien + ' y me interesa: ' + ritual + '.'];
      if (largo) partes.push('Mi cabello es ' + largo.value + '.');
      if (extra) partes.push(extra);
      partes.push('¿Me ayudan a agendar mi cita?');
      var url = urlWhatsApp(partes.join('\n'));
      if (estado) estado.textContent = '¡Listo, ' + quien + '! Abriendo WhatsApp…';
      var ventana = window.open(url, '_blank');
      if (ventana) { ventana.opener = null; } else { window.location.href = url; }
    });
  });

  /* ---------- 16. Extras: botones magnéticos y preguntas frecuentes ---------- */
  safe('magneticos', function () {
    if (tocando || reduce) return;
    $$('[data-magnetico]').forEach(function (b) {
      b.addEventListener('pointermove', function (e) {
        var r = b.getBoundingClientRect();
        var x = (e.clientX - (r.left + r.width / 2)) * 0.18;
        var y = (e.clientY - (r.top + r.height / 2)) * 0.28;
        b.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)';
      });
      b.addEventListener('pointerleave', function () { b.style.transform = ''; });
    });
  });

  safe('faq', function () {
    var lista = $$('.pregunta');
    lista.forEach(function (d) {
      d.addEventListener('toggle', function () {
        if (!d.open) return;
        lista.forEach(function (o) { if (o !== d) o.open = false; });
      });
    });
  });

  /* ---------- Arranque ---------- */
  medirDocumento();
  window.addEventListener('load', medirDocumento);
  window.setTimeout(medirDocumento, 1200);
  window.requestAnimationFrame(bucle);
})();
