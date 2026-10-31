(() => {
  // Content lives in data/projects.json and data/site.json (edited from /admin).
  const CATS = [
    { id: "textil", label: "Textil" },
    { id: "escultura", label: "Escultura y cerámica" },
    { id: "fotografia", label: "Fotografía" },
    { id: "instalacion", label: "Instalación" },
    { id: "video", label: "Video y acción" },
  ];
  const catById = Object.fromEntries(CATS.map((c) => [c.id, c]));
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
  const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
  const titled = (p) => p.pieces.filter((x) => x.title);
  const mediaRow = (cats) =>
    `<div class="media">${cats.filter((c) => catById[c]).map((c) => `<span class="m-${c}"><i class="dot"></i>${esc(catById[c].label)}</span>`).join("")}</div>`;

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
        <i class="swatch" aria-hidden="true"></i><b>${esc(c.label)}</b><small>${plural(n, "proyecto", "proyectos")}</small>
      </button>` : "";
    }).join("");

    const cards = PROJECTS.map((p, i) => {
      const r = RHYTHM[i % RHYTHM.length];
      const n = titled(p).length;
      return `<a class="project ${r.a}" href="#obra-${p.slug}" data-cats="${p.cats.join(" ")}" style="--w:${r.w}%; --gap:${r.gap}vh">
        <div class="ph">${imgTag(p.cover, 1400, `alt="${esc(p.title)}" loading="${i < 3 ? "eager" : "lazy"}"`)}</div>
        <div class="cap">
          <span class="yr">${esc(p.year)}${p.place ? " · " + esc(p.place) : ""}</span>
          <span class="ttl">${esc(p.title)}</span>
          ${n > 1 ? `<span class="sub">${plural(n, "pieza", "piezas")}</span>` : ""}
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
          <div class="filters" role="group" aria-label="Filtrar proyectos por técnica">${filters}</div>
          <p class="pull-note" aria-live="polite"></p>
        </section>
        <section class="loom" aria-label="Proyectos">
          <div class="col left"></div><div class="col right"></div><div class="col solo"></div>
          <div hidden class="stash">${cards}</div>
        </section>
      </div>
      <section class="index" id="indice" aria-labelledby="indice-h">
        <h2 class="section-h" id="indice-h">Índice</h2>
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
      note.innerHTML = `${esc(catById[pull].label)}: ${plural(n, "proyecto", "proyectos")}. <button type="button">Ver todo</button>`;
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

    svg.innerHTML = CATS.map((c, ci) => {
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
      return `<g class="m-${c.id}" data-cat="${c.id}"><path d="${d}"/></g>`;
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
        ["Técnica", pc.medium], ["Medidas", pc.size], ["Duración", pc.duration],
        ["Lugar", pc.place || p.place], ["Año", pc.year],
      ].filter(([, v]) => v);
      const text = paras(pc.text).map((t) => `<p>${esc(t)}</p>`).join("");
      const label = pc.title || p.title;
      const vid = ytId(pc.video);
      const vlabel = pc.video_label || "Ver video";

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
          <button class="zoom" type="button" data-n="${n}" aria-label="Ampliar imagen: ${esc(label)}${im.cap ? ", " + esc(im.cap) : ""}">
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
          ${vid ? `<a class="ext" href="https://www.youtube.com/watch?v=${vid}" target="_blank" rel="noopener">Abrir en YouTube ↗</a>` : ""}
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
        <nav class="crumbs" aria-label="Ruta"><a href="#inicio">← Obra</a></nav>
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
          <div><small>Siguiente proyecto</small><span>${esc(next.title)}</span></div>
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
          <h1>Bio</h1>
          ${SITE.bio_intro ? `<p class="big">${esc(SITE.bio_intro)}</p>` : ""}
          ${paras(SITE.bio).map((t) => `<p>${esc(t)}</p>`).join("")}
        </div>
        <div>
          ${cv ? `<h2>Exposiciones y proyectos</h2><ul class="cv">${cv}</ul>` : ""}
        </div>
      </section>`;
  }

  function renderFooter() {
    const ig = (SITE.instagram || "").replace(/^@/, "");
    const links = [];
    if (ig) links.push(`<a href="https://www.instagram.com/${esc(ig)}/" target="_blank" rel="noopener">Instagram @${esc(ig)}</a>`);
    if (SITE.youtube) links.push(`<a href="${esc(SITE.youtube)}" target="_blank" rel="noopener">YouTube</a>`);
    document.getElementById("contact-links").innerHTML = `
      ${SITE.email ? `<p class="addr"><a href="mailto:${esc(SITE.email)}">${esc(SITE.email)}</a></p>` : ""}
      <p>${links.join(" · ")}</p>`;
  }

  function renderNotFound() {
    page = "project";
    main.innerHTML = `<p style="padding:64px 0">No encontramos esa página. <a href="#inicio">Volver a la obra</a>.</p>`;
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
  function route() {
    const h = decodeURIComponent(location.hash.slice(1)) || "inicio";
    if (h === "contacto" || h === "main") {
      if (!page) { renderHome(); setNav("obra"); }
      return document.getElementById(h).scrollIntoView();
    }
    if (h === "inicio" || h === "indice" || catById[h]) {
      const fresh = page !== "home";
      pull = catById[h] ? h : null;
      if (fresh) { animateThreads = true; renderHome(); } else { applyPull(); if (pull) pluck(pull); }
      document.title = pull ? `${catById[pull].label} — ${NAME}` : NAME;
      setNav(h === "indice" ? "indice" : "obra");
      if (h === "indice") return requestAnimationFrame(() => document.getElementById("indice").scrollIntoView());
      if (fresh) { scrollTo(0, 0); main.focus({ preventScroll: true }); }
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
    scrollTo(0, 0);
    main.focus({ preventScroll: true });
  }

  // ---------- Boot ----------
  const load = (f) => fetch(f, { cache: "no-cache" }).then((r) => { if (!r.ok) throw new Error(f); return r.json(); });
  Promise.all([load("data/projects.json"), load("data/site.json")])
    .then(([pj, site]) => {
      SITE = site || {};
      PROJECTS = (pj.projects || [])
        .filter((p) => p.title && !p.hidden)
        .map((p) => ({
          ...p,
          slug: p.slug || slugify(p.title),
          cats: (p.cats || []).filter((c) => catById[c]),
          pieces: (p.pieces || []).map((pc) => ({ ...pc, images: pc.images || [] })),
          cover: p.cover || ((p.pieces || [])[0]?.images || [])[0]?.src || "",
        }));
      renderFooter();
      addEventListener("hashchange", route);
      route();
    })
    .catch(() => {
      main.innerHTML = `<p style="padding:64px 0">No se pudo cargar el contenido. Abre el sitio desde un servidor (no como archivo) e inténtalo de nuevo.</p>`;
    });
})();
