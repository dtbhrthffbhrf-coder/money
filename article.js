const $ = (selector) => document.querySelector(selector);

async function initArticlePage() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  setupSettings();
  setupHeaderScroll();
  try {
    const response = await fetch("data/articles.json");
    if (!response.ok) throw new Error("load failed");
    const articles = await response.json();
    const article = id ? articles.find((item) => item.id === id) : null;
    if (!article) return showNotFound();
    renderArticle(article);
  } catch (error) { showNotFound(); }
}

function renderArticle(article) {
  document.title = `${article.title} — MoneyWise`;
  $("[data-article-category]").textContent = article.category;
  $("[data-article-time]").textContent = article.readTime;
  $("[data-article-title]").textContent = article.title;
  $("[data-article-description]").textContent = article.description;
  const image = $("[data-article-image]");
  image.src = article.image;
  image.alt = `ภาพประกอบบทความ ${article.title}`;
  image.classList.add("img-reveal");
  image.addEventListener("load", () => image.classList.add("img-visible"), { once: true });
  $("[data-article-content]").innerHTML = article.content.map(renderContentBlock).join("");
  observeContent();
}

function renderContentBlock(block) {
  if (block.type === "paragraph") return `<p>${block.text}</p>`;
  if (block.type === "heading") return `<h2>${block.text}</h2>`;
  if (block.type === "list") return `<ul>${block.items.map((item) => `<li>${item}</li>`).join("")}</ul>`;
  if (block.type === "quote") return `<blockquote>"${block.text}"</blockquote>`;
  if (block.type === "tip") return `<div class="content-tip"><strong>✦ ${block.title || "ทิป"}</strong><span>${block.text}</span></div>`;
  if (block.type === "warning") return `<div class="content-warning"><strong>! ${block.title || "ข้อควรระวัง"}</strong><span>${block.text}</span></div>`;
  return "";
}

function showNotFound() {
  $("[data-article-container]").hidden = true;
  $("[data-not-found]").hidden = false;
  document.title = "ไม่พบบทความ — MoneyWise";
}

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

/* Section-level scroll reveal for article content */
function observeContent() {
  if (!("IntersectionObserver" in window)) return;
  const observer = new IntersectionObserver((entries, instance) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        instance.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });
  /* Observe headings, tips, warnings, quotes, and ad slots as section markers */
  document.querySelectorAll(".article-content h2, .content-tip, .content-warning, .article-content blockquote, .article-aside .ad-slot, .aside-note").forEach((element) => {
    element.classList.add("fade-up");
    observer.observe(element);
  });
}

/* Header scroll shadow */
function setupHeaderScroll() {
  const header = $(".site-header");
  if (!header) return;
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

initArticlePage();
