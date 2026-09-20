const startPanels = document.querySelectorAll(".start-panel");
startPanels.forEach(panel => panel.addEventListener("toggle", () => {
  if (!panel.open) return;
  startPanels.forEach(otherPanel => {
    if (otherPanel !== panel) otherPanel.open = false;
  });
}));

const faqSearchInput = document.querySelector("#faq-search-input");
if (faqSearchInput) {
  const faqEmpty = document.querySelector(".faq-empty");
  faqSearchInput.addEventListener("input", () => {
    const query = faqSearchInput.value.trim().toLowerCase();
    let visibleCount = 0;
    startPanels.forEach(panel => {
      const matches = !query || panel.textContent.toLowerCase().includes(query);
      panel.classList.toggle("is-hidden", !matches);
      if (matches) visibleCount++;
    });
    if (faqEmpty) faqEmpty.classList.toggle("is-visible", visibleCount === 0);
  });
}

const topbar = document.querySelector(".topbar");
const scrollProgress = document.querySelector(".scroll-progress");
function updateScrollUi() {
  const scrollTop = window.scrollY;
  topbar.classList.toggle("scrolled", scrollTop > 40);
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  scrollProgress.style.width = `${scrollable > 0 ? (scrollTop / scrollable) * 100 : 0}%`;
}
addEventListener("scroll", updateScrollUi, { passive: true });
updateScrollUi();

const hero = document.querySelector(".hero");
if (hero && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
  hero.addEventListener("pointermove", event => {
    const bounds = hero.getBoundingClientRect();
    hero.style.setProperty("--gx", `${((event.clientX - bounds.left) / bounds.width) * 100}%`);
    hero.style.setProperty("--gy", `${((event.clientY - bounds.top) / bounds.height) * 100}%`);
  });
}

const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
document.documentElement.classList.add("motion-ready");
const revealItems = document.querySelectorAll(".reveal");
if (reducedMotion || !("IntersectionObserver" in window)) {
  revealItems.forEach(item => item.classList.add("is-visible"));
} else {
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: .13 });
  revealItems.forEach((item, index) => {
    item.style.transitionDelay = `${Math.min(index % 3, 2) * 90}ms`;
    revealObserver.observe(item);
  });
}

const canvas = document.querySelector("#graph-canvas");
if (canvas) {
  const context = canvas.getContext("2d");
  const nodes = Array.from({ length: 22 }, (_, index) => ({
    x: .08 + ((index * 47) % 88) / 100,
    y: .10 + ((index * 31) % 80) / 100,
    radius: index % 5 === 0 ? 7 : 4,
    phase: index * .72
  }));

  const resize = () => {
    const scale = Math.min(devicePixelRatio, 2);
    canvas.width = canvas.clientWidth * scale;
    canvas.height = canvas.clientHeight * scale;
    context.setTransform(scale, 0, 0, scale, 0, 0);
  };

  const draw = (time = 0) => {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    context.clearRect(0, 0, width, height);
    const points = nodes.map(node => ({
      ...node,
      px: node.x * width + Math.sin(time / 1900 + node.phase) * 8,
      py: node.y * height + Math.cos(time / 2300 + node.phase) * 8
    }));
    context.lineWidth = 1;
    for (let first = 0; first < points.length; first++) {
      for (let second = first + 1; second < points.length; second++) {
        const distance = Math.hypot(points[first].px - points[second].px, points[first].py - points[second].py);
        if (distance > 175) continue;
        context.strokeStyle = `rgba(166,176,191,${(1 - distance / 175) * .35})`;
        context.beginPath(); context.moveTo(points[first].px, points[first].py); context.lineTo(points[second].px, points[second].py); context.stroke();
      }
    }
    points.forEach(point => {
      context.fillStyle = point.radius > 5 ? "#ff514f" : "#cbd1da";
      context.beginPath(); context.arc(point.px, point.py, point.radius, 0, Math.PI * 2); context.fill();
    });
    if (!reducedMotion) requestAnimationFrame(draw);
  };

  addEventListener("resize", resize);
  resize();
  draw();
}
