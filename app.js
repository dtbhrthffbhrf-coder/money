const state = { articles: [], category: "ทั้งหมด", query: "" };

const $ = (selector) => document.querySelector(selector);

/* ===== Skeleton Loading ===== */
function showSkeleton() {
  const grid = $("[data-article-grid]");
  const count = 6;
  let html = "";
  for (let i = 0; i < count; i++) {
    html += `<div class="skeleton-card"><div class="skeleton-image"></div><div class="skeleton-body"><div class="skeleton-line medium"></div><div class="skeleton-line short"></div><div class="skeleton-line"></div></div></div>`;
  }
  grid.innerHTML = html;
}

/* ===== Load Articles ===== */
async function loadArticles() {
  showSkeleton();
  const response = await fetch("data/articles.json");
  if (!response.ok) throw new Error("ไม่สามารถโหลดบทความได้");
  state.articles = await response.json();
  renderArticles();
}

/* ===== Render Articles ===== */
function renderArticles(animate = true) {
  const query = state.query.trim().toLowerCase();
  const results = state.articles.filter((article) => {
    const matchesCategory = state.category === "ทั้งหมด" || article.category === state.category;
    const searchable = [article.title, article.description, article.category, ...article.content.map((item) => item.text || ""), ...article.content.flatMap((item) => item.items || [])].join(" ").toLowerCase();
    return matchesCategory && (!query || searchable.includes(query));
  });
  const grid = $("[data-article-grid]");
  grid.innerHTML = results.map(createArticleCard).join("");
  $("[data-article-count]").textContent = `${results.length} บทความ`;
  $("[data-empty-state]").hidden = results.length > 0;
  if (animate) observeCards();
}

/* ===== Category Fade Transition ===== */
function renderWithFade() {
  const grid = $("[data-article-grid]");
  grid.classList.add("is-fading");
  setTimeout(() => {
    renderArticles();
    grid.classList.remove("is-fading");
  }, 220);
}

/* ===== Create Article Card ===== */
function createArticleCard(article, index) {
  const delay = Math.min(index * 80, 400);
  return `<a class="article-card fade-up" href="article.html?id=${encodeURIComponent(article.id)}" style="transition-delay:${delay}ms">
    <img class="card-image img-reveal" src="${article.image}" alt="ภาพประกอบบทความ ${article.title}" loading="lazy">
    <div class="card-body"><span class="category-pill">${article.category}</span><h3>${article.title}</h3><p>${article.description}</p><div class="card-footer"><span>${article.readTime}</span><span class="read-link">อ่านบทความ →</span></div></div>
  </a>`;
}

/* ===== Controls ===== */
function setupControls() {
  $("#search-input").addEventListener("input", (event) => {
    state.query = event.target.value;
    renderArticles();
  });
  document.querySelectorAll(".category-button").forEach((button) => button.addEventListener("click", () => {
    state.category = button.dataset.category;
    document.querySelectorAll(".category-button").forEach((item) => {
      item.classList.toggle("active", item === button);
      item.setAttribute("aria-selected", item === button ? "true" : "false");
    });
    renderWithFade();
  }));
}

/* ===== Settings ===== */
function setupSettings() {
  document.querySelectorAll("[data-discord-link]").forEach((link) => link.href = SETTINGS.discordLink);
  document.querySelectorAll("[data-ad]").forEach((slot) => {
    const ad = SETTINGS.ads[slot.dataset.ad];
    if (!ad || !ad.enabled) { slot.remove(); return; }
    slot.setAttribute("aria-label", ad.title);
    if (ad.image) {
      slot.classList.add("has-image");
      slot.innerHTML = `<a href="${ad.link || "#"}" target="_blank" rel="noopener"><img src="${ad.image}" alt="${ad.title}"></a>`;
    } else {
      slot.textContent = ad.title;
    }
  });
}

/* ===== Scroll Reveal Observer ===== */
function observeCards() {
  const elements = document.querySelectorAll(".fade-up:not(.is-visible), .img-reveal:not(.img-visible)");
  if (!("IntersectionObserver" in window)) {
    elements.forEach((el) => {
      el.classList.add("is-visible");
      el.classList.add("img-visible");
    });
    return;
  }
  const observer = new IntersectionObserver((entries, instance) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        entry.target.classList.add("img-visible");
        instance.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });
  elements.forEach((el) => observer.observe(el));
}

/* ===== Header Scroll Effect ===== */
function setupHeaderScroll() {
  const header = $(".site-header");
  let ticking = false;
  window.addEventListener("scroll", () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        header.classList.toggle("scrolled", window.scrollY > 10);
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
}

/* ===== Observe Ad Slots & Sections ===== */
function observeSections() {
  if (!("IntersectionObserver" in window)) return;
  const observer = new IntersectionObserver((entries, instance) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        instance.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });
  document.querySelectorAll(".ad-slot, .section-heading, .discover").forEach((el) => {
    el.classList.add("fade-up");
    observer.observe(el);
  });
}

/* ===== Error State ===== */
function showError() {
  const grid = $("[data-article-grid]");
  grid.innerHTML = `<div class="error-state fade-up is-visible"><div class="error-icon">!</div><h3>ไม่สามารถโหลดบทความได้</h3><p>กรุณาตรวจสอบไฟล์ data/articles.json</p></div>`;
  $("[data-article-count]").textContent = "";
}


/* ===== Init ===== */
setupSettings();
setupControls();
setupHeaderScroll();
loadArticles()
  .then(() => { observeSections(); })
  .catch(() => { showError(); });
