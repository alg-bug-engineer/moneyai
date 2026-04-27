const tokenKey = "daichong-admin-token";
let products = [];
let settings = {};
let activeProductId = "";

const loginPanel = document.querySelector("#loginPanel");
const dashboard = document.querySelector("#dashboard");
const loginForm = document.querySelector("#loginForm");
const settingsForm = document.querySelector("#settingsForm");
const productForm = document.querySelector("#productForm");
const productList = document.querySelector("#adminProductList");
const productMessage = document.querySelector("#productMessage");
const loginMessage = document.querySelector("#loginMessage");

function token() {
  return localStorage.getItem(tokenKey) || "";
}

function setMessage(el, message, ok = false) {
  el.textContent = message || "";
  el.classList.toggle("ok", ok);
}

function escapeHtml(value) {
  return String(value == null ? "" : value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function safeSrc(value, fallback = "/assets/product-ai.svg") {
  const raw = String(value || fallback);
  if (raw.startsWith("/") || raw.startsWith("http://") || raw.startsWith("https://") || raw.startsWith("data:image/")) return raw;
  return fallback;
}

async function api(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token() ? { Authorization: `Bearer ${token()}` } : {}),
      ...(options.headers || {})
    }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "请求失败");
  return data;
}

function listToText(value) {
  return Array.isArray(value) ? value.join("\n") : "";
}

function textToList(value) {
  return String(value || "")
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function optionText(product) {
  return JSON.stringify(product.options || [], null, 2);
}

function emptyProduct() {
  return {
    id: "",
    name: "",
    slug: "",
    category: "AI 工具",
    image: "/assets/product-ai.svg",
    shortDescription: "",
    description: "",
    price: 0,
    originalPrice: 0,
    unit: "月",
    stockStatus: "现货",
    sortOrder: 100,
    featured: false,
    published: true,
    options: [],
    highlights: [],
    usage: [],
    delivery: "",
    getMethod: ""
  };
}

function fillSettings() {
  for (const [key, value] of Object.entries(settings)) {
    if (settingsForm.elements[key]) settingsForm.elements[key].value = value || "";
  }
}

function readSettings() {
  return Object.fromEntries(new FormData(settingsForm).entries());
}

function fillProduct(product = emptyProduct()) {
  activeProductId = product.id || "";
  document.querySelector("#editorTitle").textContent = activeProductId ? `编辑：${product.name}` : "新增商品";
  document.querySelector("#deleteProductBtn").hidden = !activeProductId;
  const fields = productForm.elements;
  fields.id.value = product.id || "";
  fields.name.value = product.name || "";
  fields.slug.value = product.slug || "";
  fields.category.value = product.category || "";
  fields.stockStatus.value = product.stockStatus || "";
  fields.price.value = product.price || 0;
  fields.originalPrice.value = product.originalPrice || 0;
  fields.unit.value = product.unit || "月";
  fields.sortOrder.value = product.sortOrder || 100;
  fields.image.value = product.image || "";
  fields.featured.checked = Boolean(product.featured);
  fields.published.checked = product.published !== false;
  fields.shortDescription.value = product.shortDescription || "";
  fields.description.value = product.description || "";
  fields.optionsText.value = optionText(product);
  fields.highlightsText.value = listToText(product.highlights);
  fields.usageText.value = listToText(product.usage);
  fields.delivery.value = product.delivery || "";
  fields.getMethod.value = product.getMethod || "";
  setMessage(productMessage, "");
}

function readProduct() {
  const fields = productForm.elements;
  let options = [];
  const optionRaw = fields.optionsText.value.trim();
  if (optionRaw) {
    options = JSON.parse(optionRaw);
  }
  return {
    name: fields.name.value,
    slug: fields.slug.value,
    category: fields.category.value,
    stockStatus: fields.stockStatus.value,
    price: Number(fields.price.value || 0),
    originalPrice: Number(fields.originalPrice.value || 0),
    unit: fields.unit.value,
    sortOrder: Number(fields.sortOrder.value || 100),
    image: fields.image.value,
    featured: fields.featured.checked,
    published: fields.published.checked,
    shortDescription: fields.shortDescription.value,
    description: fields.description.value,
    options,
    highlights: textToList(fields.highlightsText.value),
    usage: textToList(fields.usageText.value),
    delivery: fields.delivery.value,
    getMethod: fields.getMethod.value
  };
}

function renderProductList() {
  productList.innerHTML = products.length
    ? products
        .map(
          (product) => `
        <button class="admin-product-row ${product.id === activeProductId ? "active" : ""}" type="button" data-id="${escapeHtml(product.id)}">
          <img src="${safeSrc(product.image)}" alt="" />
          <span>
            <strong>${escapeHtml(product.name)}</strong>
            <small>${escapeHtml(product.category || "未分类")} · ¥${Number(product.price || 0)} · ${product.published ? "已发布" : "未发布"}</small>
          </span>
        </button>`
        )
        .join("")
    : `<div class="empty-state">暂无商品，请新增。</div>`;
}

async function uploadFile(file) {
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  return api("/api/admin/upload", {
    method: "POST",
    body: JSON.stringify({ filename: file.name, dataUrl })
  });
}

async function loadAdmin() {
  const [config, list] = await Promise.all([api("/api/config"), api("/api/admin/products")]);
  settings = config;
  products = list;
  fillSettings();
  renderProductList();
  fillProduct(products[0] || emptyProduct());
}

function showDashboard() {
  loginPanel.hidden = true;
  dashboard.hidden = false;
}

function showLogin() {
  loginPanel.hidden = false;
  dashboard.hidden = true;
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  setMessage(loginMessage, "登录中...");
  try {
    const data = await api("/api/admin/login", {
      method: "POST",
      body: JSON.stringify({
        username: loginForm.elements.username.value,
        password: loginForm.elements.password.value
      })
    });
    localStorage.setItem(tokenKey, data.token);
    showDashboard();
    await loadAdmin();
    setMessage(loginMessage, "");
  } catch (error) {
    setMessage(loginMessage, error.message);
  }
});

document.querySelector("#logoutBtn").addEventListener("click", () => {
  localStorage.removeItem(tokenKey);
  showLogin();
});

document.querySelector("#saveSettingsBtn").addEventListener("click", async () => {
  try {
    settings = await api("/api/admin/settings", {
      method: "PUT",
      body: JSON.stringify(readSettings())
    });
    fillSettings();
    alert("站点设置已保存");
  } catch (error) {
    alert(error.message);
  }
});

document.querySelector("#qrUpload").addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  try {
    const result = await uploadFile(file);
    settingsForm.elements.contactQr.value = result.url;
  } catch (error) {
    alert(error.message);
  }
});

document.querySelector("#productImageUpload").addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  try {
    const result = await uploadFile(file);
    productForm.elements.image.value = result.url;
  } catch (error) {
    alert(error.message);
  }
});

productList.addEventListener("click", (event) => {
  const row = event.target.closest("[data-id]");
  if (!row) return;
  const product = products.find((item) => item.id === row.dataset.id);
  if (product) {
    fillProduct(product);
    renderProductList();
  }
});

document.querySelector("#newProductBtn").addEventListener("click", () => {
  fillProduct(emptyProduct());
  renderProductList();
});

document.querySelector("#resetFormBtn").addEventListener("click", () => {
  fillProduct(emptyProduct());
  renderProductList();
});

document.querySelector("#deleteProductBtn").addEventListener("click", async () => {
  if (!activeProductId || !confirm("确定删除这个商品？")) return;
  try {
    await api(`/api/admin/products/${activeProductId}`, { method: "DELETE" });
    products = products.filter((item) => item.id !== activeProductId);
    fillProduct(products[0] || emptyProduct());
    renderProductList();
  } catch (error) {
    setMessage(productMessage, error.message);
  }
});

productForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const payload = readProduct();
    const saved = activeProductId
      ? await api(`/api/admin/products/${activeProductId}`, { method: "PUT", body: JSON.stringify(payload) })
      : await api("/api/admin/products", { method: "POST", body: JSON.stringify(payload) });
    const index = products.findIndex((item) => item.id === saved.id);
    if (index >= 0) products[index] = saved;
    else products.push(saved);
    products.sort((a, b) => a.sortOrder - b.sortOrder);
    fillProduct(saved);
    renderProductList();
    setMessage(productMessage, "商品已保存", true);
  } catch (error) {
    setMessage(productMessage, error.message);
  }
});

async function init() {
  if (!token()) {
    showLogin();
    return;
  }
  showDashboard();
  try {
    await loadAdmin();
  } catch (error) {
    localStorage.removeItem(tokenKey);
    showLogin();
    setMessage(loginMessage, "登录已过期，请重新登录");
  }
}

init();
