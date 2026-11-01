(() => {
  // Content lives in data/projects.json and data/site.json (edited from /admin).
  const CATS = [
    { id: "textil", es: "Textil", en: "Textile" },
    { id: "escultura", es: "Escultura y cerámica", en: "Sculpture and ceramics" },
    { id: "fotografia", es: "Fotografía", en: "Photography" },
    { id: "instalacion", es: "Instalación", en: "Installation" },
    { id: "video", es: "Video y acción", en: "Video and action" },
  ];
  const catById = Object.fromEntries(CATS.map((c) => [c.id, c]));

  // ---------- Language (ES / EN) ----------
  // Content fields have an optional English twin ("title" / "title_en"); without it the Spanish shows.
  const T = {
    es: {
      work: "Obra", index: "Índice", bio: "Bio", contact: "Contacto", skip: "Saltar al contenido",
      rights: "© Rocío González Rosas · Todas las imágenes © la artista",
      close: "Cerrar ×", closeAria: "Cerrar", prevImg: "Imagen anterior", nextImg: "Imagen siguiente", lbAria: "Imagen ampliada",
      navAria: "Principal", langAria: "Idioma", filterAria: "Filtrar proyectos por técnica", projectsAria: "Proyectos",
      project: ["proyecto", "proyectos"], piece: ["pieza", "piezas"], showAll: "Ver todo",
      back: "← Obra", crumbs: "Ruta", medium: "Técnica", size: "Medidas", duration: "Duración", place: "Lugar", year: "Año",
      youtube: "Abrir en YouTube ↗", watch: "Ver video", enlarge: "Ampliar imagen", nextProject: "Siguiente proyecto",
      exhibitions: "Exposiciones y proyectos",
      notFound: 'No encontramos esa página. <a href="#inicio">Volver a la obra</a>.',
      loadError: "No se pudo cargar el contenido. Abre el sitio desde un servidor (no como archivo) e inténtalo de nuevo.",
      description: "Rocío González Rosas, artista visual. Textil, bordado, cerámica, escultura y fotografía.",
    },
    en: {
      work: "Work", index: "Index", bio: "Bio", contact: "Contact", skip: "Skip to content",
      rights: "© Rocío González Rosas · All images © the artist",
      close: "Close ×", closeAria: "Close", prevImg: "Previous image", nextImg: "Next image", lbAria: "Enlarged image",
      navAria: "Main", langAria: "Language", filterAria: "Filter projects by medium", projectsAria: "Projects",
      project: ["project", "projects"], piece: ["piece", "pieces"], showAll: "Show all",
      back: "← Work", crumbs: "Breadcrumb", medium: "Medium", size: "Dimensions", duration: "Duration", place: "Place", year: "Year",
      youtube: "Open on YouTube ↗", watch: "Watch video", enlarge: "Enlarge image", nextProject: "Next project",
      exhibitions: "Exhibitions and projects",
      notFound: 'This page doesn’t exist. <a href="#inicio">Back to the work</a>.',
      loadError: "The content couldn’t load. Open the site through a web server (not as a file) and try again.",
      description: "Rocío González Rosas, visual artist. Textile, embroidery, ceramics, sculpture and photography.",
    },
  };
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch {} },
  };
  const initialLang = () => {
    const q = new URLSearchParams(location.search).get("lang");
    if (q === "es" || q === "en") return q;
    const saved = store.get("rgr-lang");
    if (saved === "es" || saved === "en") return saved;
    // First visit: Spanish if the browser is in Spanish, otherwise English. Then the visitor's choice is remembered.
    return /^es\b/i.test((navigator.languages && navigator.languages[0]) || navigator.language || "es") ? "es" : "en";
  };
  let LANG = initialLang();
  const t = (k) => T[LANG][k];
  const catLabel = (id) => catById[id][LANG];
  let RAW_PROJECTS = [];
  let RAW_SITE = {};
  const DIMS = window.DIMS || {};
  const main = document.getElementById("main");
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const narrow = matchMedia("(max-width: 700px)");
  const NAME = "Rocío González Rosas";
  let PROJECTS = [];
  let SITE = {};

  // ---------- helpers ----------
  const esc = (s = "") =>
    String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const paras = (s) => (Array.isArray(s) ? s : String(s || "").split(/\n\s*\n/)).map((t) => t.trim()).filter(Boolean);
  const slugify = (s) => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const ytId = (u = "") => (String(u).match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([\w-]{11})/) || [])[1] || (/^[\w-]{11}$/.test(u) ? u : null);
  const clean = (src = "") => String(src).replace(/^\//, "");
  const dims = (src) => DIMS[clean(src)] || null;
  const size = (src) => { const d = dims(src); return d ? `width="${d[0]}" height="${d[1]}"` : ""; };
  const plural = (n, [one, many]) => `${n} ${n === 1 ? one : many}`;
  const titled = (p) => p.pieces.filter((x) => x.title);
  const mediaRow = (cats) =>
    `<div class="media">${cats.filter((c) => catById[c]).map((c) => `<span class="m-${c}"><i class="dot"></i>${esc(catLabel(c))}</span>`).join("")}</div>`;

  // Once hosted on Netlify, images are resized on the fly by its image CDN, so large
  // uploads stay fast. Locally (or if the CDN fails) the original file is used.
  const LOCAL = location.protocol === "file:" || /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
  const url = (src, w) =>
    LOCAL || /\.gif$/i.test(src) ? clean(src) : `/.netlify/images?url=${encodeURIComponent("/" + clean(src))}&w=${w}&q=82`;
  const imgTag = (src, w, attrs = "") =>
    `<img src="${url(src, w)}" ${size(src)} ${attrs} onerror="if(this.dataset.f!=='1'){this.dataset.f='1';this.src='${esc(clean(src))}'}">`;

  // Collage rhythm for the projects on the home page (repeats).
  const RHYTHM = [
    { w: 94, a: "", gap: 16 },
    { w: 80, a: "at-end", gap: 18 },
    { w: 86, a: "at-mid", gap: 14 },
    { w: 74, a: "", gap: 17 },
    { w: 100, a: "", gap: 15 },
    { w: 82, a: "at-end", gap: 18 },
    { w: 90, a: "at-mid", gap: 12 },
  ];
  const LANE = { textil: 0.22, escultura: 0.38, fotografia: 0.52, instalacion: 0.66, video: 0.8 };

  let page = null;
  let pull = null;
  let animateThreads = true;

  // ---------- Home ----------
  function renderHome() {
    page = "home";
    const filters = CATS.map((c) => {
      const n = PROJECTS.filter((p) => p.cats.includes(c.id)).length;
      return n ? `<button class="filter m-${c.id}" data-cat="${c.id}" aria-pressed="false">
        <i class="swatch" aria-hidden="true"></i><b>${esc(catLabel(c.id))}</b><small>${plural(n, t("project"))}</small>
      </button>` : "";
    }).join("");

    const cards = PROJECTS.map((p, i) => {
      const r = RHYTHM[i % RHYTHM.length];
      const n = titled(p).length;
      return `<a class="project ${r.a}" href="#obra-${p.slug}" data-cats="${p.cats.join(" ")}" style="--w:${r.w}%; --gap:${r.gap}vh">
        <div class="ph">${imgTag(p.cover, 1400, `alt="${esc(p.title)}" loading="eager"`)}</div>
        <div class="cap">
          <span class="yr">${esc(p.year)}${p.place ? " · " + esc(p.place) : ""}</span>
          <span class="ttl">${esc(p.title)}</span>
          ${n > 1 ? `<span class="sub">${plural(n, t("piece"))}</span>` : ""}
          ${mediaRow(p.cats)}
        </div>
      </a>`;
    }).join("");

    const index = PROJECTS.map((p) => {
      const names = titled(p).map((x) => x.title);
      return `<li data-cats="${p.cats.join(" ")}"><a href="#obra-${p.slug}">
        <span class="y">${esc(p.year)}</span>
        <span><span class="t">${esc(p.title)}</span>${names.length > 1 ? `<span class="pcs">${names.map(esc).join(" · ")}</span>` : ""}</span>
        ${mediaRow(p.cats)}
      </a></li>`;
    }).join("");

    main.innerHTML = `
      <div class="weave">
        <svg class="threads" aria-hidden="true"></svg>
        <section class="hero">
          <h1 class="name"><span>Rocío</span><span><em>González Rosas</em></span></h1>
          <p class="lede">${SITE.lede_bold ? `<b>${esc(SITE.lede_bold)}</b> ` : ""}${esc(SITE.lede || "")}</p>
          <div class="filters" role="group" aria-label="${t("filterAria")}">${filters}</div>
          <p class="pull-note" aria-live="polite"></p>
        </section>
        <section class="loom" aria-label="${t("projectsAria")}">
          <div class="col left"></div><div class="col right"></div><div class="col solo"></div>
          <div hidden class="stash">${cards}</div>
        </section>
      </div>
      <section class="index" id="indice" aria-labelledby="indice-h">
        <h2 class="section-h" id="indice-h">${t("index")}</h2>
        <ol>${index}</ol>
      </section>`;

    main.querySelectorAll(".filter").forEach((b) =>
      b.addEventListener("click", () => (location.hash = pull === b.dataset.cat ? "inicio" : b.dataset.cat))
    );
    placeCards();
    applyPull();
    requestAnimationFrame(drawThreads);
    document.fonts && document.fonts.ready.then(redraw);
  }

  function placeCards() {
    const loom = main.querySelector(".loom");
    if (!loom) return;
    const cards = [...loom.querySelectorAll(".project")];
    const [left, right, solo] = ["left", "right", "solo"].map((c) => loom.querySelector(`.${c}`));
    cards.forEach((el, i) => (narrow.matches ? solo : i % 2 ? right : left).appendChild(el));
  }

  function applyPull() {
    if (page !== "home") return;
    if (pull) main.dataset.pull = pull; else delete main.dataset.pull;
    main.querySelectorAll(".filter").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.cat === pull)));
    main.querySelectorAll(".project, .index li").forEach((el) => el.classList.toggle("on", el.dataset.cats.split(" ").includes(pull)));
    main.querySelectorAll(".threads g").forEach((g) => g.classList.toggle("on", g.dataset.cat === pull));
    const note = main.querySelector(".pull-note");
    if (pull) {
      const n = PROJECTS.filter((p) => p.cats.includes(pull)).length;
      note.innerHTML = `${esc(catLabel(pull))}: ${plural(n, t("project"))}. <button type="button">${t("showAll")}</button>`;
      note.querySelector("button").addEventListener("click", () => (location.hash = "inicio"));
    } else {
      note.textContent = "";
    }
  }

  // One thread per medium, from its label through every project that uses it.
  function drawThreads() {
    const weave = main.querySelector(".weave");
    if (!weave) return;
    const svg = weave.querySelector(".threads");
    const base = weave.getBoundingClientRect();
    const W = weave.clientWidth, H = weave.scrollHeight;
    const bottom = main.querySelector(".loom").getBoundingClientRect().bottom - base.top - 24;
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    svg.setAttribute("width", W);
    svg.setAttribute("height", H);
    svg.style.height = `${H}px`;
    const rel = (r) => ({ x: r.left - base.left, y: r.top - base.top, w: r.width, h: r.height });
    const f = (n) => n.toFixed(1);
    const seg = (p, q) => {
      const dy = Math.max(40, q.y - p.y) * 0.55;
      return ` C ${f(p.x)} ${f(p.y + dy)}, ${f(q.x)} ${f(q.y - dy)}, ${f(q.x)} ${f(q.y)}`;
    };

    // Each thread starts in its own colour and, image by image down the page, shifts to the
    // tone of that image closest to its hue (vertical gradient in page coordinates).
    const dark = isDark();
    const css = getComputedStyle(document.documentElement);
    const covers = [...main.querySelectorAll(".project img")]
      .map((img) => { const r = rel(img.getBoundingClientRect()); return { img, y: r.y + r.h / 2 }; })
      .sort((a, b) => a.y - b.y);
    const grads = CATS.map((c) => {
      const base = hexToHsl(css.getPropertyValue(`--${c.id}`));
      const stops = [{ y: 0, col: base }, ...covers.map((cv, k) => ({ y: cv.y, col: k === 0 ? base : toneFor(cv.img, base, dark) }))];
      return `<linearGradient id="tg-${c.id}" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="${H}">${stops
        .map((s) => `<stop offset="${Math.min(1, s.y / H).toFixed(4)}" stop-color="${hsl(s.col)}"/>`).join("")}</linearGradient>`;
    }).join("");

    svg.innerHTML = `<defs>${grads}</defs>` + CATS.map((c, ci) => {
      const sw = weave.querySelector(`.filter[data-cat="${c.id}"] .swatch`);
      if (!sw) return "";
      const s = rel(sw.getBoundingClientRect());
      const start = { x: s.x + s.w / 2, y: s.y + s.h };
      const pts = [...main.querySelectorAll(".project")]
        .filter((el) => el.dataset.cats.split(" ").includes(c.id))
        .map((el) => {
          const r = rel(el.querySelector("img").getBoundingClientRect());
          return { x: r.x + r.w * LANE[c.id], y: r.y + r.h * (0.3 + ci * 0.07) };
        })
        .sort((a, b) => a.y - b.y);
      const last = pts[pts.length - 1] || start;
      const end = { x: Math.min(W - 8, Math.max(8, last.x + (ci % 2 ? -1 : 1) * W * 0.06)), y: bottom };
      let d = `M ${f(start.x)} ${f(start.y)}`;
      [...pts, end].reduce((p, q) => ((d += seg(p, q)), q), start);
      return `<g class="m-${c.id}" data-cat="${c.id}"><path d="${d}" style="stroke:url(#tg-${c.id})"/></g>`;
    }).join("");
    applyPull();
    sampleThreads(svg);

    if (animateThreads && !reduceMotion) {
      animateThreads = false;
      const t0 = performance.now(), reach = scrollY + innerHeight + 200;
      const tick = (t) => {
        const k = Math.min(1, (t - t0) / 1400);
        const e = 1 - Math.pow(1 - k, 3);
        svg.style.clipPath = k < 1 ? `inset(0 0 ${Math.max(0, H - reach * e)}px 0)` : "";
        if (k < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }
  }
  let raf = 0;
  const redraw = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(drawThreads); };
  new ResizeObserver(() => page === "home" && redraw()).observe(main);
  narrow.addEventListener("change", () => { if (page === "home") { placeCards(); redraw(); } });
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => page === "home" && redraw());

  // ---------- Thread colours taken from the images ----------
  const isDark = () => {
    const t = document.documentElement.dataset.theme;
    return t === "dark" || (t !== "light" && matchMedia("(prefers-color-scheme: dark)").matches);
  };
  function rgbToHsl(r, g, b) {
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2;
    let h = 0, s = 0;
    if (mx !== mn) {
      const d = mx - mn;
      s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
      h = (mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4) * 60;
    }
    return [h, s, l];
  }
  const hexToHsl = (hex) => {
    const n = parseInt(String(hex).trim().replace("#", ""), 16) || 0;
    return rgbToHsl(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
  };
  const hsl = ([h, s, l]) => `hsl(${h.toFixed(0)} ${(s * 100).toFixed(0)}% ${(l * 100).toFixed(0)}%)`;
  const hueDist = (a, b) => { const d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; };

  // Tones of an image: average colour per 30° hue band (bands under 2% of the image are ignored).
  const palettes = new Map();
  function paletteOf(img) {
    const key = img.currentSrc || img.src;
    if (palettes.has(key)) return palettes.get(key);
    if (!img.complete || !img.naturalWidth) { img.addEventListener("load", redraw, { once: true }); return null; }
    let pal;
    try {
      const W = 48, H = Math.max(1, Math.round((48 * img.naturalHeight) / img.naturalWidth));
      const cv = Object.assign(document.createElement("canvas"), { width: W, height: H });
      const cx = cv.getContext("2d", { willReadFrequently: true });
      cx.drawImage(img, 0, 0, W, H);
      const d = cx.getImageData(0, 0, W, H).data;
      const bins = Array.from({ length: 12 }, () => ({ n: 0, x: 0, y: 0, s: 0, l: 0 }));
      let n = 0, R = 0, G = 0, B = 0;
      for (let i = 0; i < d.length; i += 4) {
        const r = d[i] / 255, g = d[i + 1] / 255, b = d[i + 2] / 255;
        n++; R += r; G += g; B += b;
        const [h, s, l] = rgbToHsl(r, g, b);
        if (s < 0.22 || l < 0.12 || l > 0.88) continue;
        const bin = bins[Math.floor(h / 30) % 12];
        bin.n++; bin.x += Math.cos((h * Math.PI) / 180) * s; bin.y += Math.sin((h * Math.PI) / 180) * s; bin.s += s; bin.l += l;
      }
      pal = {
        tones: bins.filter((b) => b.n >= n * 0.02).map((b) => [((Math.atan2(b.y, b.x) * 180) / Math.PI + 360) % 360, b.s / b.n, b.l / b.n]),
        avg: rgbToHsl(R / n, G / n, B / n),
      };
    } catch {
      pal = { tones: [], avg: null };   // image not readable (e.g. another domain): keep the base colour
    }
    palettes.set(key, pal);
    return pal;
  }
  // The image's tone nearest to the thread's own hue, kept within a readable lightness range.
  function toneFor(img, base, dark) {
    const pal = paletteOf(img);
    let t = base;
    if (pal) {
      const near = pal.tones.slice().sort((a, b) => hueDist(a[0], base[0]) - hueDist(b[0], base[0]))[0];
      t = near || pal.avg || base;
    }
    const s = Math.min(0.95, Math.max(0.35, t[1]));
    const l = dark ? Math.min(0.78, Math.max(0.6, t[2])) : Math.min(0.55, Math.max(0.32, t[2]));
    return [t[0], s, l];
  }

  // ---------- Thread motion ----------
  // Each thread is sampled into points that behave like a taut string: the pointer pushes
  // them aside, neighbours pull on each other, and a spring brings them back to rest.
  const PHYS = { R: 110, PUSH: 1.72, DRAG: 0.19, SPRING: 0.018, TENSION: 0.3, DAMP: 0.88, STEP: 14 };
  let lines = [];
  let physRaf = 0;
  const ptr = { x: -1e5, y: -1e5, vx: 0, vy: 0, seen: false };

  function sampleThreads(svg) {
    lines = [...svg.querySelectorAll("path")].map((path) => {
      const L = path.getTotalLength();
      const n = Math.max(2, Math.round(L / PHYS.STEP));
      const pts = [];
      for (let i = 0; i <= n; i++) {
        const p = path.getPointAtLength((L * i) / n);
        pts.push({ x: p.x, y: p.y, ox: 0, oy: 0, vx: 0, vy: 0 });
      }
      return { path, d0: path.getAttribute("d"), pts, cat: path.parentNode.dataset.cat, live: false };
    });
  }

  function kick() { if (!physRaf && !reduceMotion) physRaf = requestAnimationFrame(stepPhysics); }

  function stepPhysics() {
    physRaf = 0;
    const { R, PUSH, DRAG, SPRING, TENSION, DAMP } = PHYS;
    const R2 = R * R;
    let busy = false;
    for (const line of lines) {
      const pts = line.pts;
      let energy = 0;
      for (let i = 1; i < pts.length - 1; i++) {
        const p = pts[i], a = pts[i - 1], b = pts[i + 1];
        const dx = p.x + p.ox - ptr.x, dy = p.y + p.oy - ptr.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < R2) {
          const d = Math.sqrt(d2) || 1;
          const f = (1 - d / R) ** 2;
          p.vx += (dx / d) * f * PUSH + ptr.vx * f * DRAG;
          p.vy += (dy / d) * f * PUSH + ptr.vy * f * DRAG;
        }
        p.vx += -p.ox * SPRING + ((a.ox + b.ox) / 2 - p.ox) * TENSION;
        p.vy += -p.oy * SPRING + ((a.oy + b.oy) / 2 - p.oy) * TENSION;
        p.vx *= DAMP; p.vy *= DAMP;
      }
      for (let i = 1; i < pts.length - 1; i++) {
        const p = pts[i];
        p.ox += p.vx; p.oy += p.vy;
        energy += Math.abs(p.ox) + Math.abs(p.vx) + Math.abs(p.oy) + Math.abs(p.vy);
      }
      if (energy > 0.5) {
        busy = line.live = true;
        let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
        for (let i = 1; i < pts.length - 1; i++) {
          const p = pts[i], q = pts[i + 1];
          const px = p.x + p.ox, py = p.y + p.oy;
          const mx = (px + q.x + q.ox) / 2, my = (py + q.y + q.oy) / 2;
          d += ` Q ${px.toFixed(1)} ${py.toFixed(1)} ${mx.toFixed(1)} ${my.toFixed(1)}`;
        }
        const z = pts[pts.length - 1];
        d += ` L ${z.x.toFixed(1)} ${z.y.toFixed(1)}`;
        line.path.setAttribute("d", d);
      } else if (line.live) {
        line.live = false;
        pts.forEach((p) => (p.ox = p.oy = p.vx = p.vy = 0));
        line.path.setAttribute("d", line.d0);   // settle back onto the exact curve
      }
    }
    ptr.vx *= 0.7; ptr.vy *= 0.7;
    if (busy || Math.abs(ptr.vx) + Math.abs(ptr.vy) > 0.2) kick();
  }

  addEventListener("pointermove", (e) => {
    if (page !== "home" || !lines.length) return;
    const weave = main.querySelector(".weave");
    if (!weave) return;
    const r = weave.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    if (ptr.seen) { ptr.vx = x - ptr.x; ptr.vy = y - ptr.y; }
    ptr.x = x; ptr.y = y; ptr.seen = true;
    kick();
  }, { passive: true });
  document.addEventListener("pointerleave", () => { ptr.x = ptr.y = -1e5; ptr.seen = false; });

  // A gentle pluck runs down a thread when its medium is selected.
  function pluck(cat) {
    const line = lines.find((l) => l.cat === cat);
    if (!line || reduceMotion) return;
    line.pts.forEach((p, i) => { p.vx += Math.sin(i * 0.45) * 2.2 * Math.exp(-i / 60); });
    kick();
  }

  // ---------- Project ----------
  function renderProject(slug) {
    const i = PROJECTS.findIndex((p) => p.slug === slug);
    if (i < 0) return renderNotFound();
    page = "project";
    const p = PROJECTS[i];
    const next = PROJECTS[(i + 1) % PROJECTS.length];
    const all = [];

    const pieces = p.pieces.map((pc, k) => {
      const ficha = [
        [t("medium"), pc.medium], [t("size"), pc.size], [t("duration"), pc.duration],
        [t("place"), pc.place || p.place], [t("year"), pc.year],
      ].filter(([, v]) => v);
      const text = paras(pc.text).map((t) => `<p>${esc(t)}</p>`).join("");
      const label = pc.title || p.title;
      const vid = ytId(pc.video);
      const vlabel = pc.video_label || t("watch");

      let imgs = pc.images || [];
      let video = "";
      if (vid) {
        const poster = imgs[0];
        imgs = imgs.slice(1);
        video = `<figure class="wide"><div class="video" data-yt="${vid}">
            ${poster ? imgTag(poster.src, 1600, `alt="${esc(label)}" loading="lazy"`) : ""}
            <button type="button" aria-label="${esc(vlabel)}: ${esc(label)}"><span>▶&nbsp; ${esc(vlabel)}</span></button>
          </div></figure>`;
      }
      const figs = imgs.map((im, j) => {
        const n = all.push({ ...im, piece: label }) - 1;
        const d = dims(im.src);
        const portrait = d && d[1] > d[0] * 1.05;
        const wide = !video && j === 0 && (!portrait || imgs.length === 1);
        const odd = imgs.length - (wide ? 1 : 0);
        const lastWide = !wide && j === imgs.length - 1 && odd % 2 === 1 && !portrait && imgs.length > 1;
        return `<figure class="${wide || lastWide ? "wide" : ""}">
          <button class="zoom" type="button" data-n="${n}" aria-label="${t("enlarge")}: ${esc(label)}${im.cap ? ", " + esc(im.cap) : ""}">
            ${imgTag(im.src, wide || lastWide ? 1800 : 1100,
              `alt="${esc(label)}${im.cap ? " — " + esc(im.cap) : ""}" loading="${k === 0 && j < 2 ? "eager" : "lazy"}" ${wide && portrait ? 'style="max-height:86vh;width:auto"' : ""}`)}
          </button>
          ${im.cap ? `<figcaption>${esc(im.cap)}</figcaption>` : ""}
        </figure>`;
      }).join("");

      return `<section class="piece" id="pieza-${k + 1}" aria-label="${esc(label)}">
        <div class="piece-info">
          ${pc.title ? `<h2>${esc(pc.title)}</h2>` : ""}
          ${pc.subtitle ? `<p class="alt">${esc(pc.subtitle)}</p>` : ""}
          <dl class="ficha">${ficha.map(([a, b]) => `<dt>${a}</dt><dd>${esc(b)}</dd>`).join("")}</dl>
        </div>
        <div class="piece-imgs">${video}${figs}</div>
        ${text || vid ? `<div class="piece-text">${text}
          ${vid ? `<a class="ext" href="https://www.youtube.com/watch?v=${vid}" target="_blank" rel="noopener">${t("youtube")}</a>` : ""}
        </div>` : ""}
      </section>`;
    }).join("");

    const list = titled(p).length > 1
      ? `<ol class="pieces-list">${p.pieces.map((pc, k) => pc.title
          ? `<li><a href="#obra-${p.slug}" data-jump="pieza-${k + 1}"><span>${esc(pc.title)}${p.pieces.filter((x) => x.title === pc.title).length > 1 && pc.medium ? ` <em>(${esc(pc.medium.toLowerCase())})</em>` : ""}</span><span>${esc(pc.year || "")}</span></a></li>` : "").join("")}</ol>`
      : "";
    const facts = paras(p.facts).map((t) => `<p>${esc(t)}</p>`).join("");

    main.innerHTML = `
      <article class="proj">
        <nav class="crumbs" aria-label="${t("crumbs")}"><a href="#inicio">${t("back")}</a></nav>
        <header class="proj-head">
          <h1>${esc(p.title)}</h1>
          <div class="proj-meta">
            <span class="yr">${esc(p.year)}${p.place ? " · " + esc(p.place) : ""}</span>
            ${mediaRow(p.cats)}
          </div>
        </header>
        <div class="proj-intro">
          <div class="text">${paras(p.text).map((t) => `<p>${esc(t)}</p>`).join("")}</div>
          <div class="facts">${list}${facts}</div>
        </div>
        ${pieces}
        ${next !== p ? `<a class="next-proj" href="#obra-${next.slug}">
          <div><small>${t("nextProject")}</small><span>${esc(next.title)}</span></div>
          ${imgTag(next.cover, 400, 'alt="" loading="lazy"')}
        </a>` : ""}
      </article>`;

    main.querySelectorAll("[data-n]").forEach((b) => b.addEventListener("click", () => openLightbox(all, +b.dataset.n)));
    main.querySelectorAll("[data-jump]").forEach((a) =>
      a.addEventListener("click", (e) => { e.preventDefault(); document.getElementById(a.dataset.jump).scrollIntoView(); })
    );
    main.querySelectorAll(".video").forEach((v) =>
      v.querySelector("button").addEventListener("click", () => {
        v.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${v.dataset.yt}?autoplay=1&rel=0"
          title="Video" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
      })
    );
  }

  // ---------- Bio ----------
  function renderBio() {
    page = "bio";
    const cv = (SITE.cv || []).map((c) => {
      const label = c.label ? (c.project ? `<a href="#obra-${esc(c.project)}">${esc(c.label)}</a>` : esc(c.label)) : "";
      return `<li><span class="y">${esc(c.year)}</span><span>${label}${label && c.text ? ", " : ""}${esc(c.text || "")}</span></li>`;
    }).join("");
    main.innerHTML = `
      <section class="bio">
        <div>
          <h1>${t("bio")}</h1>
          ${SITE.bio_intro ? `<p class="big">${esc(SITE.bio_intro)}</p>` : ""}
          ${paras(SITE.bio).map((t) => `<p>${esc(t)}</p>`).join("")}
        </div>
        <div>
          ${SITE.bio_photo ? `<figure class="bio-photo">
            ${imgTag(SITE.bio_photo, 1000, `alt="${esc(NAME)}" loading="eager"`)}
            ${SITE.bio_photo_caption ? `<figcaption>${esc(SITE.bio_photo_caption)}</figcaption>` : ""}
          </figure>` : ""}
          ${cv ? `<h2>${t("exhibitions")}</h2><ul class="cv">${cv}</ul>` : ""}
        </div>
      </section>`;
  }

  function renderFooter() {
    const ig = (SITE.instagram || "").replace(/^@/, "");
    const links = [];
    if (ig) links.push(`<a href="https://www.instagram.com/${esc(ig)}/" target="_blank" rel="noopener">Instagram @${esc(ig)}</a>`);
    if (SITE.youtube) links.push(`<a href="${esc(SITE.youtube)}" target="_blank" rel="noopener">YouTube</a>`);
    document.getElementById("contact-links").innerHTML = `
      ${SITE.email ? `<p class="addr"><a href="#contacto" data-mail="${esc(SITE.email)}">${esc(SITE.email)}</a></p>` : ""}
      <p>${links.join(" · ")}</p>`;
  }

  // The address can be written as "name [arroba] gmail.com" so it isn't harvested from the page;
  // the real address is only put together when someone clicks it.
  document.addEventListener("click", (e) => {
    const a = e.target.closest("[data-mail]");
    if (!a) return;
    e.preventDefault();
    const addr = a.dataset.mail.replace(/\s*[\[(]\s*(arroba|at)\s*[\])]\s*/i, "@").replace(/\s+/g, "");
    location.href = "mailto:" + addr;
  });

  function renderNotFound() {
    page = "project";
    main.innerHTML = `<p style="padding:64px 0">${t("notFound")}</p>`;
  }

  // ---------- Lightbox ----------
  const lb = document.querySelector(".lightbox");
  const lbImg = lb.querySelector("img");
  const lbCap = lb.querySelector("figcaption");
  let lbList = [], lbK = 0;
  function showLb() {
    const im = lbList[lbK];
    const cap = `${im.piece}${im.cap ? " — " + im.cap : ""}`;
    lbImg.dataset.f = "";
    lbImg.onerror = () => { if (lbImg.dataset.f !== "1") { lbImg.dataset.f = "1"; lbImg.src = clean(im.src); } };
    lbImg.src = url(im.src, 2400);
    lbImg.alt = cap;
    lbCap.textContent = `${cap} · ${lbK + 1} / ${lbList.length}`;
  }
  function openLightbox(list, k) { lbList = list; lbK = k; showLb(); lb.showModal(); }
  const step = (d) => { lbK = (lbK + d + lbList.length) % lbList.length; showLb(); };
  lb.querySelector(".lb-prev").addEventListener("click", () => step(-1));
  lb.querySelector(".lb-next").addEventListener("click", () => step(1));
  lb.querySelector(".lb-close").addEventListener("click", () => lb.close());
  lb.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") step(-1);
    if (e.key === "ArrowRight") step(1);
  });
  let touchX = null;
  lb.addEventListener("touchstart", (e) => (touchX = e.touches[0].clientX), { passive: true });
  lb.addEventListener("touchend", (e) => {
    if (touchX == null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 40) step(dx < 0 ? 1 : -1);
    touchX = null;
  });

  // ---------- Router ----------
  // Hash tokens: #inicio, #<medium>, #indice, #obra-<slug>, #bio, #contacto
  function setNav(section) {
    document.querySelectorAll("[data-nav]").forEach((a) =>
      a.dataset.nav === section ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current")
    );
  }
  function route(keep = false) {
    const h = decodeURIComponent(location.hash.slice(1)) || "inicio";
    if (h === "contacto" || h === "main") {
      if (!page) { renderHome(); setNav("obra"); }
      return document.getElementById(h).scrollIntoView();
    }
    if (h === "inicio" || h === "indice" || catById[h]) {
      const fresh = page !== "home";
      pull = catById[h] ? h : null;
      if (fresh) { animateThreads = !keep; renderHome(); } else { applyPull(); if (pull) pluck(pull); }
      document.title = pull ? `${catLabel(pull)} — ${NAME}` : NAME;
      setNav(h === "indice" ? "indice" : "obra");
      if (h === "indice" && !keep) return requestAnimationFrame(() => document.getElementById("indice").scrollIntoView());
      if (fresh && !keep) { scrollTo(0, 0); main.focus({ preventScroll: true }); }
      return;
    }
    if (h.startsWith("obra-")) {
      const p = PROJECTS.find((x) => x.slug === h.slice(5));
      renderProject(h.slice(5));
      document.title = p ? `${p.title} — ${NAME}` : NAME;
      setNav("obra");
    } else if (h === "bio") {
      renderBio();
      document.title = `Bio — ${NAME}`;
      setNav("bio");
    } else {
      renderNotFound();
    }
    if (keep) return;
    scrollTo(0, 0);
    main.focus({ preventScroll: true });
  }

  // ---------- Boot ----------
  const load = (f) => fetch(f, { cache: "no-cache" }).then((r) => { if (!r.ok) throw new Error(f); return r.json(); });
  Promise.all([load("data/projects.json"), load("data/site.json")])
    .then(([pj, site]) => {
      RAW_SITE = site || {};
      RAW_PROJECTS = (pj.projects || [])
        .filter((p) => p.title && !p.hidden)
        .map((p) => ({
          ...p,
          slug: p.slug || slugify(p.title),
          cats: (p.cats || []).filter((c) => catById[c]),
          pieces: (p.pieces || []).map((pc) => ({ ...pc, images: pc.images || [] })),
          cover: p.cover || ((p.pieces || [])[0]?.images || [])[0]?.src || "",
        }));
      localize();
      applyStatic();
      renderFooter();
      addEventListener("hashchange", () => route());
      route();
    })
    .catch(() => {
      applyStatic();
      main.innerHTML = `<p style="padding:64px 0">${t("loadError")}</p>`;
    });

  // Resolve every text field to the current language (English falls back to Spanish).
  function localize() {
    const pick = (o, k) => (LANG === "en" && o[k + "_en"]) || o[k];
    SITE = { ...RAW_SITE };
    ["lede_bold", "lede", "bio_intro", "bio", "bio_photo_caption"].forEach((k) => (SITE[k] = pick(RAW_SITE, k)));
    SITE.cv = (RAW_SITE.cv || []).map((c) => ({ ...c, year: pick(c, "year"), label: pick(c, "label"), text: pick(c, "text") }));
    PROJECTS = RAW_PROJECTS.map((p) => ({
      ...p,
      title: pick(p, "title"), place: pick(p, "place"), text: pick(p, "text"), facts: pick(p, "facts"),
      pieces: p.pieces.map((pc) => ({
        ...pc,
        title: pick(pc, "title"), subtitle: pick(pc, "subtitle"), medium: pick(pc, "medium"),
        place: pick(pc, "place"), text: pick(pc, "text"), video_label: pick(pc, "video_label"),
        images: pc.images.map((im) => ({ ...im, cap: pick(im, "cap") })),
      })),
    }));
  }

  // Fixed texts in index.html (header, footer, lightbox) and the ES / EN switch.
  function applyStatic() {
    document.documentElement.lang = LANG;
    document.querySelector('meta[name="description"]').setAttribute("content", t("description"));
    document.querySelectorAll("[data-i18n]").forEach((el) => (el.textContent = t(el.dataset.i18n)));
    document.querySelectorAll("[data-i18n-aria]").forEach((el) => el.setAttribute("aria-label", t(el.dataset.i18nAria)));
    document.querySelectorAll("[data-lang]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === LANG)));
  }

  function setLang(l) {
    if (l === LANG || !T[l]) return;
    LANG = l;
    store.set("rgr-lang", l);
    const y = scrollY;
    localize();
    applyStatic();
    renderFooter();
    page = null;          // force a full re-render of the current view
    route(true);
    requestAnimationFrame(() => scrollTo(0, y));
  }
  document.querySelectorAll("[data-lang]").forEach((b) => b.addEventListener("click", () => setLang(b.dataset.lang)));
})();
