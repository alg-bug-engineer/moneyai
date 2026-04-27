const state = {
  products: Array.isArray(window.__PRODUCTS__) ? window.__PRODUCTS__ : [],
  activeCategory: "全部",
  search: ""
};

const currency = new Intl.NumberFormat("zh-CN", {
  style: "currency",
  currency: "CNY",
  maximumFractionDigits: 0
});

const els = {
  grid: document.querySelector("#productGrid"),
  tabs: document.querySelector("#categoryTabs"),
  search: document.querySelector("#searchInput"),
  count: document.querySelector("#catalogCount")
};

function text(value, fallback = "") {
  return value == null || value === "" ? fallback : String(value);
}

function escapeHtml(value) {
  return text(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function safeSrc(value, fallback = "/assets/product-ai.svg") {
  const raw = text(value, fallback);
  if (raw.startsWith("/") || raw.startsWith("http://") || raw.startsWith("https://") || raw.startsWith("data:image/")) return raw;
  return fallback;
}

function formatPrice(value) {
  return currency.format(Number(value || 0));
}

function productCard(product) {
  const highlights = (product.highlights || []).slice(0, 4).map((item) => `<span>${escapeHtml(item)}</span>`).join("");
  const href = `/product/${encodeURIComponent(product.slug)}`;

  return `
    <article class="product-card product-archive-card">
      <a class="product-main" href="${href}" aria-label="查看 ${escapeHtml(product.name)} 详情">
        <img src="${safeSrc(product.image)}" alt="${escapeHtml(product.name)}" loading="lazy" />
        <span class="stock">${escapeHtml(text(product.stockStatus, "咨询"))}</span>
      </a>
      <div class="product-body">
        <div class="product-title">
          <div>
            <p>${escapeHtml(text(product.category, "数字服务"))}</p>
            <h3>${escapeHtml(product.name)}</h3>
          </div>
          ${product.featured ? '<span class="featured">推荐</span>' : ""}
        </div>
        <p class="product-desc">${escapeHtml(text(product.shortDescription, product.description))}</p>
        <div class="tag-row">${highlights}</div>
        <div class="card-bottom">
          <div class="card-price">
            <strong>${formatPrice(product.price)}</strong>
            <span>/${escapeHtml(text(product.unit, "月"))} 起</span>
          </div>
          <div style="display: flex; gap: 0.5rem; width: 100%;">
            <a class="small-button" href="/api/pay?slug=${encodeURIComponent(product.slug)}" 
               onclick="this.innerText='处理中...';"
               style="background: #1677ff; color: white; border-color: #1677ff; flex: 1; text-align: center; font-weight: 600;">立即支付</a>
            <a class="small-button ghost-button" href="${href}" style="flex: 1; text-align: center;">查看详情</a>
          </div>
        </div>
      </div>
    </article>
  `;
}

function filteredProducts() {
  const keyword = state.search.trim().toLowerCase();
  return state.products.filter((product) => {
    const categoryMatch = state.activeCategory === "全部" || product.category === state.activeCategory;
    if (!categoryMatch) return false;
    if (!keyword) return true;
    const content = [product.name, product.category, product.shortDescription, product.description, ...(product.highlights || [])]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return content.includes(keyword);
  });
}

function renderTabs() {
  const categories = ["全部", ...new Set(state.products.map((item) => item.category).filter(Boolean))];
  els.tabs.innerHTML = categories
    .map((category) => {
      const active = category === state.activeCategory ? "active" : "";
      return `<button class="${active}" type="button" data-category="${escapeHtml(category)}">${escapeHtml(category)}</button>`;
    })
    .join("");
}

function renderProducts() {
  const products = filteredProducts();
  els.grid.innerHTML = products.length
    ? products.map(productCard).join("")
    : `<div class="empty-state"><strong>暂无匹配商品</strong><p>请更换关键词或直接联系客服说明目标平台、地区和时长。</p></div>`;
  if (els.count) els.count.textContent = String(products.length);
}

async function loadProducts() {
  if (state.products.length) return;
  const response = await fetch("/api/products");
  if (!response.ok) throw new Error("商品数据加载失败");
  state.products = await response.json();
}

function bindEvents() {
  els.search.addEventListener("input", (event) => {
    state.search = event.target.value;
    renderProducts();
  });

  els.tabs.addEventListener("click", (event) => {
    const button = event.target.closest("[data-category]");
    if (!button) return;
    state.activeCategory = button.dataset.category || "全部";
    renderTabs();
    renderProducts();
  });
}

async function init() {
  if (!els.grid || !els.tabs || !els.search) return;
  try {
    await loadProducts();
    renderTabs();
    renderProducts();
    bindEvents();

    // Handle modal pay button update
    const modal = document.querySelector("#productModal");
    const modalPayBtn = document.querySelector("#modalPayBtn");
    const modalOptions = document.querySelector("#modalOptions");

    if (modalPayBtn) {
      document.addEventListener("click", (e) => {
        const card = e.target.closest(".product-card");
        if (card) {
          const href = card.querySelector("a.product-main")?.getAttribute("href");
          if (href) {
            const slug = decodeURIComponent(href.split("/").pop());
            const product = state.products.find(p => p.slug === slug);
            
            if (product) {
              modalPayBtn.href = `/api/pay?slug=${slug}`;
              modalPayBtn.innerText = `立即购买全套 (￥${product.price.toFixed(2)})`;

              // Render options in modal
              if (modalOptions) {
                if (product.options && product.options.length > 0) {
                  modalOptions.innerHTML = `
                    <h3 style="margin: 2rem 0 1rem; font-size: 1.25rem; font-weight: bold; border-left: 4px solid #1677ff; padding-left: 0.75rem;">选择套餐方案</h3>
                    <div style="display: grid; gap: 1rem;">
                      ${product.options.map((opt, idx) => `
                        <div style="border: 2px solid var(--line); border-radius: 12px; padding: 1.25rem; display: flex; justify-content: space-between; align-items: center; background: #fff; transition: all 0.2s; cursor: pointer;"
                             onclick="window.location.href='/api/pay?slug=${product.slug}&optionIndex=${idx}'; this.style.borderColor='#1677ff';"
                             onmouseover="this.style.borderColor='#1677ff'; this.style.background='#f0f7ff';"
                             onmouseout="this.style.borderColor='var(--line)'; this.style.background='#fff';">
                          <div style="flex: 1;">
                            <div style="font-weight: bold; font-size: 1.1rem; margin-bottom: 0.25rem;">${escapeHtml(opt.label)}</div>
                            <div style="font-size: 0.85rem; color: var(--muted);">${escapeHtml(opt.note || "专业代充服务")}</div>
                          </div>
                          <div style="text-align: right; margin-left: 1.5rem;">
                            <div style="font-weight: 900; color: #1677ff; font-size: 1.25rem; margin-bottom: 0.5rem;">￥${(opt.price || product.price).toFixed(2)}</div>
                            <span style="background: #1677ff; color: white; padding: 6px 16px; border-radius: 6px; font-size: 0.9rem; font-weight: bold; display: inline-block;">立即订购</span>
                          </div>
                        </div>
                      `).join("")}
                    </div>
                  `;
                } else {
                  modalOptions.innerHTML = "";
                }
              }
            }
          }
        }
      });
    }
  } catch (error) {
    els.grid.innerHTML = `<div class="empty-state"><strong>商品加载失败</strong><p>${escapeHtml(error.message)}</p></div>`;
  }
}

init();
