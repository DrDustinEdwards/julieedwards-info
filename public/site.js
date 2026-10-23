// Everything the page does in the browser, without a framework: the theme toggle, the nav's border once
// scrolled, the phone menu, and the sections that rise into view. The pre-paint theme choice is the
// inline script in app/lib/theme.ts.
(() => {
  const root = document.documentElement;

  document.querySelector(".theme-toggle")?.addEventListener("click", () => {
    const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try {
      localStorage.setItem("theme", next);
    } catch {}
  });

  const nav = document.querySelector("nav");
  const onScroll = () => nav?.classList.toggle("scrolled", window.scrollY > 10);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  const button = document.querySelector(".nav-menu-btn");
  const panel = document.getElementById("mobile-menu");
  if (button && panel) {
    let open = false;
    const setOpen = (next) => {
      if (next === open) return;
      open = next;
      button.setAttribute("aria-expanded", String(open));
      button.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      panel.dataset.open = String(open);
      panel.setAttribute("aria-hidden", String(!open));
      if (open) panel.querySelector("a")?.focus();
      else button.focus();
    };
    button.addEventListener("click", () => setOpen(!open));
    for (const link of panel.querySelectorAll("a")) link.addEventListener("click", () => setOpen(false));
    document.querySelector(".wordmark")?.addEventListener("click", () => setOpen(false));
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") setOpen(false);
    });
    window.addEventListener("mousedown", (e) => {
      if (open && !panel.contains(e.target) && !button.contains(e.target)) setOpen(false);
    });
  }

  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      }
    },
    { threshold: 0.12 },
  );
  for (const el of document.querySelectorAll(".reveal")) io.observe(el);
})();
