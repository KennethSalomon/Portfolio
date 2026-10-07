/* Kenneth Kpanou — portfolio. Aucun framework requis ; GSAP et Lenis sont optionnels. */
(function () {
  "use strict";
  var WA = "2290158593692";
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- Défilement doux (désactivé si mouvement réduit) ---------- */
  var lenis = null;
  if (!reduced && window.Lenis) {
    lenis = new window.Lenis({ duration: 1.1, smoothWheel: true });
    var raf = function (t) { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
    if (window.ScrollTrigger) lenis.on("scroll", window.ScrollTrigger.update);
  }
  function goTo(target) {
    if (!target) return;
    if (lenis) lenis.scrollTo(target, { offset: -84, duration: 1.2 });
    else target.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
  }
  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      var id = a.getAttribute("href");
      if (id.length < 2) return;
      var t = document.querySelector(id);
      if (!t) return;
      e.preventDefault();
      closeMenu();
      var subject = a.getAttribute("data-subject");
      if (subject) { var sel = $("#f-subject"); if (sel) sel.value = subject; }
      goTo(t);
      if (t.id === "contact") setTimeout(function () { var f = $("#f-name"); if (f) f.focus({ preventScroll: true }); }, 900);
    });
  });

  /* ---------- En-tête ---------- */
  var header = $(".site-header");
  /* ---------- Menu mobile ---------- */
  var menu = $("#mobile-menu"), openBtn = $("[data-menu-open]");
  function openMenu() {
    if (!menu) return;
    menu.classList.add("is-open"); menu.setAttribute("aria-hidden", "false");
    openBtn && openBtn.setAttribute("aria-expanded", "true");
    document.body.classList.add("no-scroll"); lenis && lenis.stop();
    var first = $("nav a", menu); first && first.focus();
  }
  function closeMenu() {
    if (!menu || !menu.classList.contains("is-open")) return;
    menu.classList.remove("is-open"); menu.setAttribute("aria-hidden", "true");
    openBtn && openBtn.setAttribute("aria-expanded", "false");
    document.body.classList.remove("no-scroll"); lenis && lenis.start();
    openBtn && openBtn.focus();
  }
  openBtn && openBtn.addEventListener("click", openMenu);
  $$("[data-menu-close]").forEach(function (b) { b.addEventListener("click", closeMenu); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeMenu(); });
  $$("#mobile-menu nav a").forEach(function (a) {
    if (!a.getAttribute("href").startsWith("#")) a.addEventListener("click", closeMenu);
  });

  /* ---------- Timeline : tête de lecture et timecode liés au défilement ---------- */
  var TOTAL = 80, FPS = 25; // la page « dure » 1:20, comme les vidéos
  var tcEls = $$("[data-tc]"), playhead = $("[data-playhead]"), lane = $("[data-lane]");
  var dock = $("[data-dock]"), bar = $("[data-bar]"), hero = $(".hero");
  var intro = reduced ? 1 : 0; // l'intro anime la tête de lecture jusqu'à sa position
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function tc(sec) {
    var f = Math.floor((sec % 1) * FPS), s = Math.floor(sec);
    return "00:" + pad(Math.floor(s / 60)) + ":" + pad(s % 60) + ":" + pad(f);
  }
  function progress() {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    return max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
  }
  function update() {
    var p = progress(), shown = p * intro;
    var t = tc(shown * TOTAL);
    for (var i = 0; i < tcEls.length; i++) tcEls[i].textContent = t;
    if (playhead && lane) playhead.style.transform = "translateX(" + (shown * lane.clientWidth) + "px)";
    if (bar) bar.style.width = (p * 100) + "%";
    if (header) header.classList.toggle("is-scrolled", window.scrollY > 24);
    if (dock && hero) dock.classList.toggle("is-visible", window.scrollY > hero.offsetHeight * 0.7);
  }
  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
  update();

  /* ---------- Une seule séquence d'ouverture : titre, clips, tête de lecture ---------- */
  if (window.gsap && hero && !reduced) {
    var g = window.gsap;
    var tl = g.timeline({ defaults: { ease: "power3.out" } });
    tl.from(".hero h1 .ln > span", { yPercent: 105, duration: 1, stagger: 0.09 })
      .from(".hero .lead, .hero-ctas", { opacity: 0, y: 16, duration: .7, stagger: .08 }, "-=.55")
      .from(".monitor", { clipPath: "inset(0 0 100% 0 round 14px)", duration: 1.1, ease: "power4.inOut" }, 0.15)
      .from(".clip", { scaleX: 0, opacity: 0, duration: .6, stagger: .05, ease: "power2.out" }, 0.55)
      .to({ v: 0 }, { v: 1, duration: 1.4, ease: "power2.inOut", onUpdate: function () { intro = this.targets()[0].v; update(); } }, 0.6);
  } else { intro = 1; update(); }

  /* ---------- Lecteur vidéo (Google Drive) ---------- */
  var player = $("#player");
  if (player) {
    var frame = $("iframe", player), title = $("#player-title"), link = $("[data-player-link]", player), lastBtn = null;
    $$("[data-video]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var id = btn.getAttribute("data-video");
        lastBtn = btn;
        title.textContent = btn.getAttribute("data-title") || "Vidéo";
        frame.src = "https://drive.google.com/file/d/" + id + "/preview";
        link.href = "https://drive.google.com/file/d/" + id + "/view";
        if (typeof player.showModal === "function") player.showModal(); else player.setAttribute("open", "");
        lenis && lenis.stop();
        if (window.gtag) window.gtag("event", "play_video", { video_title: title.textContent });
      });
    });
    var closePlayer = function () { if (player.open) player.close(); };
    $("[data-player-close]", player).addEventListener("click", closePlayer);
    player.addEventListener("click", function (e) { if (e.target === player) closePlayer(); });
    player.addEventListener("close", function () { frame.src = "about:blank"; lenis && lenis.start(); lastBtn && lastBtn.focus(); });
  }

  /* ---------- Formulaire : compose le message WhatsApp ---------- */
  var form = $("#brief");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var ok = true;
      ["name", "contact", "subject"].forEach(function (n) {
        var el = form.elements[n], field = el.closest(".field"), bad = !el.value.trim();
        field.classList.toggle("has-error", bad);
        el.setAttribute("aria-invalid", bad ? "true" : "false");
        if (bad && ok) { el.focus(); ok = false; }
      });
      if (!ok) return;
      var msg = "Bonjour Kenneth, je m'appelle " + form.elements.name.value.trim() + ".\n" +
        "Mon besoin : " + form.elements.subject.value + ".\n" +
        (form.elements.message.value.trim() ? form.elements.message.value.trim() + "\n" : "") +
        "Pour me recontacter : " + form.elements.contact.value.trim();
      if (window.gtag) window.gtag("event", "generate_lead", { method: "whatsapp", subject: form.elements.subject.value });
      window.open("https://wa.me/" + WA + "?text=" + encodeURIComponent(msg), "_blank", "noopener");
    });
    $$("input, select", form).forEach(function (el) {
      el.addEventListener("input", function () { el.closest(".field").classList.remove("has-error"); el.setAttribute("aria-invalid", "false"); });
    });
  }

  /* ---------- Réalisations : filtres ---------- */
  var filterBtns = $$("[data-filter]");
  if (filterBtns.length) {
    var rows = $$("[data-kind]"), status = $("[data-filter-status]");
    filterBtns.forEach(function (b) {
      b.addEventListener("click", function () {
        var f = b.getAttribute("data-filter"), n = 0;
        filterBtns.forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
        rows.forEach(function (r) { var show = f === "all" || r.getAttribute("data-kind") === f; r.hidden = !show; if (show) n++; });
        if (status) status.textContent = n + " projet" + (n > 1 ? "s" : "") + " affiché" + (n > 1 ? "s" : "");
      });
    });
  }
})();
