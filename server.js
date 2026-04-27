const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { URL } = require("url");

const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, "public");
const DATA_DIR = path.join(ROOT, "data");
const STORE_FILE = path.join(DATA_DIR, "store.json");
const UPLOAD_DIR = path.join(PUBLIC_DIR, "uploads");
loadEnvFile(path.join(ROOT, ".env"));

const PORT = Number(process.env.PORT || 3000);
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
const TOKEN_SECRET = process.env.TOKEN_SECRET || crypto.createHash("sha256").update(ADMIN_PASSWORD).digest("hex");
const MAX_BODY_BYTES = 8 * 1024 * 1024;

const currency = new Intl.NumberFormat("zh-CN", {
  style: "currency",
  currency: "CNY",
  maximumFractionDigits: 0
});

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8"
};

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, "utf8");
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#") || !line.includes("=")) continue;
    const index = line.indexOf("=");
    const key = line.slice(0, index).trim();
    let value = line.slice(index + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (key && process.env[key] == null) process.env[key] = value;
  }
}

function ensureStore() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  if (!fs.existsSync(STORE_FILE)) {
    const now = new Date().toISOString();
    writeStore({
      settings: {
        siteName: "云享代充",
        headline: "AI 工具、数字会员与流媒体订阅代充咨询站",
        subheadline: "首页负责解释服务方式、保障和流程；商品页单独承接价格、套餐、使用说明和咨询转化。",
        wechatId: "daichong-kefu",
        contactQr: "/assets/contact-qr.svg",
        notice: "所有商品以下单前人工确认为准，价格、库存和到账时效会随渠道变化。"
      },
      products: seedProducts(now)
    });
  }
}

function seedProducts(now) {
  return [
    {
      id: crypto.randomUUID(),
      slug: "chatgpt-plus",
      name: "ChatGPT Plus",
      category: "AI 工具",
      image: "/assets/product-ai.svg",
      shortDescription: "适合个人写作、编程、学习和日常效率场景的 ChatGPT Plus 代充咨询。",
      description: "适合需要稳定使用 ChatGPT Plus 的个人用户。商品页展示参考价格、套餐和使用说明，最终以下单前人工确认的账号条件、地区限制和到账时间为准。",
      price: 78,
      originalPrice: 98,
      unit: "月",
      stockStatus: "现货",
      sortOrder: 10,
      featured: true,
      published: true,
      options: [
        { label: "1 个月", price: 78, note: "常规月卡，适合先体验" },
        { label: "3 个月", price: 225, note: "适合持续高频使用" },
        { label: "6 个月", price: 438, note: "适合长期稳定续费" }
      ],
      highlights: ["中文客服确认", "到账提醒", "使用说明", "售后协助"],
      usage: [
        "先联系客服确认账号状态、地区条件和当前可用渠道。",
        "按客服指引提交完成服务所需的信息，不发送无关隐私内容。",
        "完成后重新登录并核对会员状态、有效期和入口权限。"
      ],
      delivery: "人工处理，通常 10-60 分钟内完成，高峰期以客服二次确认为准。",
      getMethod: "扫码联系客服，发送“ChatGPT Plus + 套餐时长”即可确认是否可下单。",
      createdAt: now,
      updatedAt: now
    },
    {
      id: crypto.randomUUID(),
      slug: "midjourney",
      name: "Midjourney",
      category: "AI 绘画",
      image: "/assets/product-creative.svg",
      shortDescription: "适合视觉草图、海报创意和灵感探索的 Midjourney 订阅咨询与代充。",
      description: "适合设计、内容和创意相关用户。商品页会说明套餐方向、使用方式和咨询要点，具体版本、价格和账号条件要在联系客服后确认。",
      price: 118,
      originalPrice: 138,
      unit: "月",
      stockStatus: "咨询",
      sortOrder: 20,
      featured: true,
      published: true,
      options: [
        { label: "基础版", price: 118, note: "适合轻量探索与偶发使用" },
        { label: "标准版", price: 198, note: "适合高频生成和团队协作" }
      ],
      highlights: ["套餐咨询", "渠道报价", "使用提醒", "人工售后"],
      usage: [
        "先说明目标套餐、使用强度和是否需要长期续费。",
        "客服确认渠道价格和账号条件后，再进入处理流程。",
        "到账后检查订阅状态、可用额度和常用工作流入口。"
      ],
      delivery: "通常按客服确认的排单顺序处理，实际时效以沟通记录为准。",
      getMethod: "添加客服后发送“Midjourney + 目标套餐 + 使用频率”。",
      createdAt: now,
      updatedAt: now
    },
    {
      id: crypto.randomUUID(),
      slug: "streaming-member",
      name: "流媒体会员",
      category: "影音娱乐",
      image: "/assets/product-media.svg",
      shortDescription: "适合家庭观影与个人娱乐的流媒体会员代充咨询，支持多平台方案核对。",
      description: "不同平台、账号类型和使用地区的差异较大，因此商品页会把常见方案、参考价格和使用方式拆开写清楚，最终仍以客服确认可用方案为准。",
      price: 35,
      originalPrice: 49,
      unit: "月",
      stockStatus: "多渠道",
      sortOrder: 30,
      featured: false,
      published: true,
      options: [
        { label: "月卡", price: 35, note: "适合短期使用和灵活选择" },
        { label: "季卡", price: 96, note: "适合常用账号续费" }
      ],
      highlights: ["平台多选", "参考价格透明", "售前确认", "到期提醒"],
      usage: [
        "先说明需要的平台、所在地区和期望时长。",
        "确认是独享、共享、礼品卡还是代开通形式。",
        "到账后核对权益、生效时间和登录方式。"
      ],
      delivery: "通常当天处理，具体平台和地区不同会有差异。",
      getMethod: "联系客服发送平台名称、地区和希望开通的时长。",
      createdAt: now,
      updatedAt: now
    }
  ];
}

function readStore() {
  ensureStore();
  return JSON.parse(fs.readFileSync(STORE_FILE, "utf8"));
}

function writeStore(store) {
  fs.writeFileSync(STORE_FILE, `${JSON.stringify(store, null, 2)}\n`);
}

function sendJson(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  res.end(body);
}

function sendText(res, status, body, contentType = "text/plain; charset=utf-8") {
  res.writeHead(status, {
    "Content-Type": contentType,
    "Cache-Control": "no-store"
  });
  res.end(body);
}

function sendHtml(res, status, html) {
  res.writeHead(status, {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-store"
  });
  res.end(html);
}

function sendError(res, status, message) {
  sendJson(res, status, { error: message });
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(Object.assign(new Error("请求体过大"), { status: 413 }));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8");
      if (!raw) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch (error) {
        reject(Object.assign(new Error("JSON 格式错误"), { status: 400 }));
      }
    });
    req.on("error", reject);
  });
}

function makeSlug(value) {
  const slug = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || `product-${Date.now()}`;
}

function normalizeStringList(value) {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  return String(value || "")
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeOptions(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => ({
        label: String(item.label || "").trim(),
        price: Number(item.price || 0),
        note: String(item.note || "").trim()
      }))
      .filter((item) => item.label);
  }
  return [];
}

function normalizeProduct(input, existing = {}) {
  const now = new Date().toISOString();
  const name = String(input.name || existing.name || "").trim();
  if (!name) {
    const error = new Error("商品名称不能为空");
    error.status = 422;
    throw error;
  }
  return {
    id: existing.id || crypto.randomUUID(),
    slug: makeSlug(input.slug || existing.slug || name),
    name,
    category: String(input.category || existing.category || "数字服务").trim(),
    image: String(input.image || existing.image || "/assets/product-ai.svg").trim(),
    shortDescription: String(input.shortDescription || existing.shortDescription || "").trim(),
    description: String(input.description || existing.description || "").trim(),
    price: Number(input.price ?? existing.price ?? 0),
    originalPrice: Number(input.originalPrice ?? existing.originalPrice ?? 0),
    unit: String(input.unit || existing.unit || "月").trim(),
    stockStatus: String(input.stockStatus || existing.stockStatus || "现货").trim(),
    sortOrder: Number(input.sortOrder ?? existing.sortOrder ?? 100),
    featured: Boolean(input.featured ?? existing.featured ?? false),
    published: Boolean(input.published ?? existing.published ?? true),
    options: normalizeOptions(input.options ?? existing.options ?? []),
    highlights: normalizeStringList(input.highlights ?? existing.highlights ?? []),
    usage: normalizeStringList(input.usage ?? existing.usage ?? []),
    delivery: String(input.delivery || existing.delivery || "").trim(),
    getMethod: String(input.getMethod || existing.getMethod || "").trim(),
    createdAt: existing.createdAt || now,
    updatedAt: now
  };
}

function publicProduct(product) {
  return { ...product };
}

function signToken(payload) {
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto.createHmac("sha256", TOKEN_SECRET).update(encoded).digest("base64url");
  return `${encoded}.${sig}`;
}

function verifyToken(token) {
  try {
    if (!token || !token.includes(".")) return false;
    const [encoded, sig] = token.split(".");
    const expected = crypto.createHmac("sha256", TOKEN_SECRET).update(encoded).digest("base64url");
    if (Buffer.byteLength(sig) !== Buffer.byteLength(expected)) return false;
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return false;
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
    return payload.exp && payload.exp > Date.now();
  } catch (error) {
    return false;
  }
}

function requireAdmin(req, res) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!verifyToken(token)) {
    sendError(res, 401, "请先登录后台");
    return false;
  }
  return true;
}

function safeJoinStatic(urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0]);
  const normalized = path.normalize(decoded).replace(/^(\.\.[/\\])+/, "");
  const requested = path.join(PUBLIC_DIR, normalized === "/" ? "index.html" : normalized);
  if (!requested.startsWith(PUBLIC_DIR)) return null;
  return requested;
}

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

function escapeJson(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

function escapeXml(value) {
  return text(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function safeSrc(value, fallback = "/assets/product-ai.svg") {
  const raw = text(value, fallback);
  if (raw.startsWith("/") || raw.startsWith("http://") || raw.startsWith("https://") || raw.startsWith("data:image/")) return raw;
  return fallback;
}

function formatPrice(value) {
  return currency.format(Number(value || 0));
}

function getBaseUrl(req) {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/$/, "");
  const proto = String(req.headers["x-forwarded-proto"] || "http").split(",")[0].trim() || "http";
  const host = String(req.headers["x-forwarded-host"] || req.headers.host || `localhost:${PORT}`).split(",")[0].trim();
  return `${proto}://${host}`;
}

function absoluteUrl(req, pathname) {
  if (/^https?:\/\//.test(pathname)) return pathname;
  return new URL(pathname, `${getBaseUrl(req)}/`).toString();
}

function sortProducts(products) {
  return products.slice().sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "zh-CN"));
}

function publicProducts(store) {
  return sortProducts(store.products.filter((item) => item.published));
}

function renderSchemas(items) {
  if (!items || !items.length) return "";
  return `<script type="application/ld+json">${escapeJson(items.length === 1 ? items[0] : items)}</script>`;
}

function renderHeader(siteName, pathname) {
  const isProducts = pathname === "/products" || pathname === "/products/" || pathname.startsWith("/product/");
  const navItems = [
    { href: "/", label: "首页", active: pathname === "/" || pathname === "/index.html" },
    { href: "/products", label: "商品页", active: isProducts },
    { href: "/assurance", label: "服务保障", active: pathname === "/assurance" || pathname === "/assurance/" },
    { href: "/guide", label: "下单流程", active: pathname === "/guide" || pathname === "/guide/" },
    { href: "/contact", label: "联系客服", active: pathname === "/contact" || pathname === "/contact/" }
  ];

  return `
    <header class="site-header">
      <a class="brand" href="/" aria-label="返回首页">
        <span class="brand-mark">云</span>
        <span>${escapeHtml(siteName)}</span>
      </a>
      <nav class="top-nav" aria-label="主导航">
        ${navItems
          .map((item) => `<a href="${item.href}"${item.active ? ' aria-current="page"' : ""}>${item.label}</a>`)
          .join("")}
      </nav>
    </header>
  `;
}

function renderFooter(siteName) {
  return `
    <footer class="site-footer">
      <span>© ${new Date().getFullYear()} ${escapeHtml(siteName)}</span>
      <nav class="footer-nav" aria-label="页脚导航">
        <a href="/">首页</a>
        <a href="/products">商品页</a>
        <a href="/assurance">服务保障</a>
        <a href="/guide">下单流程</a>
        <a href="/contact">联系客服</a>
      </nav>
    </footer>
  `;
}

function renderLayout({
  req,
  pathname,
  siteName,
  title,
  description,
  image,
  keywords = "",
  ogType = "website",
  bodyClass = "",
  content,
  schemas = []
}) {
  const canonical = absoluteUrl(req, pathname);
  const ogImage = absoluteUrl(req, image || "/assets/hero-pattern.svg");
  const fullTitle = title === siteName ? siteName : `${title} - ${siteName}`;

  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(fullTitle)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <meta name="robots" content="index,follow,max-image-preview:large" />
    ${keywords ? `<meta name="keywords" content="${escapeHtml(keywords)}" />` : ""}
    <link rel="canonical" href="${escapeHtml(canonical)}" />
    <meta property="og:locale" content="zh_CN" />
    <meta property="og:type" content="${escapeHtml(ogType)}" />
    <meta property="og:site_name" content="${escapeHtml(siteName)}" />
    <meta property="og:title" content="${escapeHtml(fullTitle)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:url" content="${escapeHtml(canonical)}" />
    <meta property="og:image" content="${escapeHtml(ogImage)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(fullTitle)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:image" content="${escapeHtml(ogImage)}" />
    <meta name="theme-color" content="#f4efe6" />
    <link rel="icon" href="/assets/hero-pattern.svg" type="image/svg+xml" />
    <link rel="stylesheet" href="/styles.css" />
    ${renderSchemas(schemas)}
  </head>
  <body class="${escapeHtml(bodyClass)}">
    ${content}
  </body>
</html>`;
}

function renderProductCard(product) {
  const highlights = (product.highlights || []).slice(0, 4).map((item) => `<span>${escapeHtml(item)}</span>`).join("");
  const href = `/product/${encodeURIComponent(product.slug)}`;
  const searchText = escapeHtml([product.name, product.category, product.shortDescription, product.description].join(" ").toLowerCase());

  return `
    <article class="product-card product-archive-card" data-category="${escapeHtml(text(product.category, "数字服务"))}" data-search="${searchText}">
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
          <a class="small-button" href="${href}">查看详情</a>
        </div>
      </div>
    </article>
  `;
}

function breadcrumbSchema(req, items) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(req, item.url)
    }))
  };
}

function faqSchema(items) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer
      }
    }))
  };
}

function renderFaqSection(title, intro, items) {
  return `
    <section class="page-section">
      <div class="section-head stacked-head">
        <div>
          <p class="eyebrow">常见问题</p>
          <h2>${escapeHtml(title)}</h2>
          <p class="section-intro">${escapeHtml(intro)}</p>
        </div>
      </div>
      <div class="faq-stack">
        ${items
          .map(
            (item) => `
              <article class="faq-item">
                <h3>${escapeHtml(item.question)}</h3>
                <p>${escapeHtml(item.answer)}</p>
              </article>
            `
          )
          .join("")}
      </div>
    </section>
  `;
}

function homeFaqs(siteName) {
  return [
    {
      question: `${siteName} 的商品价格是固定的吗？`,
      answer: "不是。商品页展示的是参考价格，最终以下单前客服结合渠道库存、地区规则、账号条件和套餐版本确认的报价为准。"
    },
    {
      question: "为什么首页不直接放完整商品详情？",
      answer: "首页负责解释服务方式、保障边界和下单流程，商品详情单独成页可以让搜索引擎和用户更清楚地区分品牌介绍与单个商品信息。"
    },
    {
      question: "代充前最需要确认什么？",
      answer: "先确认商品名称、套餐版本、账号限制、地区要求、预计到账时效和售后规则，再决定是否付款。"
    }
  ];
}

function catalogFaqs() {
  return [
    {
      question: "商品页适合解决什么问题？",
      answer: "商品页重点回答某个具体商品的参考价格、套餐差异、适用人群、下单前确认事项和联系客服方式，便于用户带着明确问题咨询。"
    },
    {
      question: "搜索不到想要的商品怎么办？",
      answer: "可以先按分类浏览，再直接联系客服说明目标平台、地区和期望时长，客服会确认是否有可用方案。"
    },
    {
      question: "参考价和最终成交价不一致正常吗？",
      answer: "正常。代充服务会受渠道、库存和账号条件影响，所以商品页提供的是决策参考，付款前要以人工确认记录为准。"
    }
  ];
}

function productFaqs(product) {
  return [
    {
      question: `${product.name} 的价格是固定的吗？`,
      answer: `${product.name} 商品页展示的是参考价格，当前参考起价为 ${formatPrice(product.price)} / ${text(product.unit, "月")}。最终价格要在联系客服并确认账号条件、地区和渠道库存后再确定。`
    },
    {
      question: `${product.name} 一般多久到账？`,
      answer: text(product.delivery, "到账时效会受排单和渠道状态影响，具体以客服沟通记录为准。")
    },
    {
      question: `咨询 ${product.name} 之前要准备什么？`,
      answer: `${product.getMethod || "先联系客服说明商品名称和套餐。"} 同时建议准备账号地区、目标套餐、期望时长和是否有特殊限制，客服会按需引导。`
    }
  ];
}

function productAudience(product) {
  if (product.category === "AI 工具") {
    return [
      { title: "适合高频对话与效率场景", desc: "如果你主要用来写作、编程、学习、翻译和日常信息整理，这类套餐更适合作为长期工具使用。" },
      { title: "适合先确认账号条件的用户", desc: "AI 工具类商品通常受地区、支付方式和账号状态影响较大，所以在咨询前先核对限制能减少返工。" },
      { title: "适合重视售后提醒的人", desc: "开通完成后需要及时核对入口、有效期和是否生效，客服协助会比只看商品标题更有价值。" }
    ];
  }

  if (product.category === "AI 绘画") {
    return [
      { title: "适合设计与创意探索", desc: "如果你需要海报草图、概念图或风格尝试，独立商品页比混在首页里更容易让人看懂套餐差异和咨询重点。" },
      { title: "适合对额度和版本敏感的人", desc: "AI 绘画商品往往不是只有一个固定套餐，所以页面会强调使用强度、额度和客服确认的重要性。" },
      { title: "适合先确认工作流的人", desc: "在咨询前说明你是偶发生成还是高频出图，客服更容易给出合适方案。" }
    ];
  }

  return [
    { title: "适合家庭观影与个人娱乐", desc: "流媒体类商品会受平台、地区、账号类型和开通形式影响，独立商品页能先把这些变量拆清楚。" },
    { title: "适合先确认平台方案的人", desc: "不同平台可能对应不同的共享、独享或礼品卡方案，所以咨询前先说清地区和时长最有效率。" },
    { title: "适合需要售后跟进的用户", desc: "这类商品完成后应立即核对会员权益、有效期和登录方式，有记录的售后入口更重要。" }
  ];
}

function renderHomePage(req, store) {
  const settings = store.settings;
  const siteName = text(settings.siteName, "云享代充");
  const products = publicProducts(store);
  const featured = products.filter((item) => item.featured).slice(0, 3);
  const faqs = homeFaqs(siteName);

  const schemas = [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: siteName,
      url: absoluteUrl(req, "/"),
      inLanguage: "zh-CN"
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: siteName,
      url: absoluteUrl(req, "/"),
      contactPoint: [
        {
          "@type": "ContactPoint",
          contactType: "customer support",
          availableLanguage: ["zh-CN"],
          description: "微信客服咨询"
        }
      ]
    },
    {
      "@context": "https://schema.org",
      "@type": "Service",
      name: `${siteName} 数字订阅代充咨询服务`,
      serviceType: "AI 工具、流媒体会员与数字订阅代充咨询",
      provider: {
        "@type": "Organization",
        name: siteName
      },
      areaServed: "CN",
      url: absoluteUrl(req, "/products"),
      description: "首页负责介绍服务方式、保障规则、下单流程和客服入口；商品页单独承接具体商品信息。"
    },
    faqSchema(faqs)
  ];

  const heroTitle = text(settings.headline, "AI 工具、数字会员与流媒体订阅代充咨询站");
  const heroText = text(
    settings.subheadline,
    "首页只负责讲清楚服务价值、规则边界和下单流程。具体商品、套餐、参考价格和使用说明全部拆到独立商品页，便于搜索引擎和用户准确理解。"
  );

  const content = `
    ${renderHeader(siteName, "/")}
    <main class="intro-shell">
      <section class="intro-hero">
        <div class="intro-grid">
          <div class="intro-copy">
            <p class="eyebrow">数字会员 / AI 工具 / 影音娱乐</p>
            <h1>${escapeHtml(heroTitle)}</h1>
            <p>${escapeHtml(heroText)}</p>
            <div class="page-actions">
              <a class="primary-button" href="/products">进入商品页</a>
              <a class="ghost-button" href="/contact">联系客服</a>
            </div>
            <div class="intro-stats" aria-label="核心服务原则">
              <article>
                <strong>先确认</strong>
                <span>商品、套餐、价格和到账时效先说清楚，再付款。</span>
              </article>
              <article>
                <strong>详情透明</strong>
                <span>每个商品均有独立详情页，提供价格、套餐与 FAQ 说明。</span>
              </article>
              <article>
                <strong>售后保障</strong>
                <span>所有沟通与处理节点均有记录，确保售后过程透明可追溯。</span>
              </article>
            </div>
          </div>
          <aside class="intro-aside">
            <p class="micro-note">服务摘要</p>
            <h2>首页负责解释为什么值得信任，商品页负责回答具体要不要买。</h2>
            <p>${escapeHtml(text(settings.notice, "扫码后发送商品名称和套餐。客服会先确认库存、价格、预计时效和售后规则，再引导下单。"))}</p>
            <ul class="editorial-list">
              <li>AI 工具代充</li>
              <li>流媒体会员咨询</li>
              <li>数字订阅套餐核对</li>
              <li>下单流程与售后规则说明</li>
            </ul>
          </aside>
        </div>
      </section>

      <section class="page-section surface-section">
        <div class="section-head stacked-head">
          <div>
            <p class="eyebrow">服务价值</p>
            <h2>更专业、更透明的代充咨询服务</h2>
            <p class="section-intro">我们坚持“规则先行”的原则，通过结构化的信息展示，为您提供更清晰的决策参考。</p>
          </div>
        </div>
        <div class="insight-grid">
          <article class="insight-card">
            <span>01</span>
            <h3>透明的服务规则</h3>
            <p>我们明确界定服务范围、处理流程与退款边界，确保您在咨询之初就对各项规则了然于胸。</p>
          </article>
          <article>
            <span>02</span>
            <h3>详尽的方案对比</h3>
            <p>每个商品均拥有独立的详情页面，详细列出不同套餐的差异、参考价格及适用场景。</p>
          </article>
          <article>
            <span>03</span>
            <h3>专业的售后支持</h3>
            <p>我们承诺所有服务环节均有记录，出现异常时，您可以凭借沟通记录获得快速、有效的协助与处理。</p>
          </article>
        </div>
      </section>

      <section class="page-section">
        <div class="featured-header">
          <div>
            <p class="eyebrow">精选服务</p>
            <h2>热门代充方案推荐</h2>
            <p class="section-intro">浏览精选服务类型与参考价格。点击进入详情页，查看更详尽的套餐说明与使用指南。</p>
          </div>
          <a class="secondary-button" href="/products">查看全部商品</a>
        </div>
        <div class="product-grid featured-grid">
          ${featured.map(renderProductCard).join("")}
        </div>
      </section>

      <section class="page-section surface-section">
        <div class="section-head stacked-head">
          <div>
            <p class="eyebrow">服务路径</p>
            <h2>简单高效的服务步骤</h2>
          </div>
        </div>
        <div class="timeline">
          <article>
            <span>1</span>
            <div>
              <h2>了解服务规则</h2>
              <p>明确服务价值、保障边界及下单前确认事项，确保您的每一步操作都清晰有保障。</p>
            </div>
          </article>
          <article>
            <span>2</span>
            <div>
              <h2>选定目标商品</h2>
              <p>在商品目录中找到您需要的服务，查看参考价格、套餐差异及常见问题说明。</p>
            </div>
          </article>
          <article>
            <span>3</span>
            <div>
              <h2>联系客服下单</h2>
              <p>将您的需求发送给客服，我们将在核对库存及最新价格后为您提供代充服务。</p>
            </div>
          </article>
        </div>
      </section>

      ${renderFaqSection("关于我们的服务", "针对您在咨询过程中可能遇到的疑问，我们整理了以下常见问题解答。", faqs)}
    </main>
    ${renderFooter(siteName)}
  `;

  return renderLayout({
    req,
    pathname: "/",
    siteName,
    title: `${siteName} 介绍页`,
    description: "首页是介绍页，解释 AI 工具、数字会员与流媒体订阅代充服务的方式、保障、流程和客服入口。具体商品与价格说明拆分到独立商品页。",
    image: "/assets/hero-pattern.svg",
    keywords: "AI工具代充,数字会员代充,流媒体会员代充,ChatGPT Plus代充,Midjourney订阅",
    bodyClass: "front-page",
    content,
    schemas
  });
}

function renderProductsPage(req, store) {
  const settings = store.settings;
  const siteName = text(settings.siteName, "云享代充");
  const products = publicProducts(store);
  const categories = ["全部", ...new Set(products.map((item) => item.category).filter(Boolean))];
  const faqs = catalogFaqs();

  const schemas = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: `${siteName} 商品页`,
      description: "独立商品页目录，集中展示 AI 工具、AI 绘画和流媒体会员代充商品。",
      url: absoluteUrl(req, "/products"),
      mainEntity: {
        "@type": "ItemList",
        itemListElement: products.map((product, index) => ({
          "@type": "ListItem",
          position: index + 1,
          url: absoluteUrl(req, `/product/${product.slug}`),
          name: product.name
        }))
      }
    },
    breadcrumbSchema(req, [
      { name: "首页", url: "/" },
      { name: "商品页", url: "/products" }
    ]),
    faqSchema(faqs)
  ];

  const content = `
    ${renderHeader(siteName, "/products")}
    <main>
      <section class="page-hero catalog-hero">
        <div class="page-hero-grid">
          <div>
            <p class="eyebrow">商品目录 / 搜索与筛选</p>
            <h1>AI 工具、数字会员与流媒体订阅服务</h1>
            <p>您可以按分类或关键词快速检索所需服务。每个商品均配有独立的详情说明，帮助您全面了解产品细节、套餐差异及使用指南。</p>
            <div class="page-actions">
              <a class="primary-button" href="/contact">联系客服确认</a>
              <a class="ghost-button" href="/guide">查看下单流程</a>
            </div>
          </div>
          <aside class="hero-note-card">
            <span>目录摘要</span>
            <h2>${products.length} 个公开商品，${categories.length - 1} 个分类入口</h2>
            <p>当前共有 ${products.length} 个服务项目可供咨询，点击卡片即可进入详情页查看更多细节。</p>
          </aside>
        </div>
      </section>

      <section class="page-section">
        <div class="section-head catalog-toolbar">
          <div>
            <p class="eyebrow">浏览目录</p>
            <h2>按分类和关键词检索商品</h2>
            <p class="section-intro">支持关键词及分类筛选。点击商品卡片可进入独立的详情页面，查看完整的套餐方案与服务细节。</p>
          </div>
          <label class="search-box">
            <span>搜索商品</span>
            <input id="searchInput" type="search" placeholder="ChatGPT / Midjourney / 流媒体" />
          </label>
        </div>
        <div class="catalog-meta">
          <div class="category-tabs" id="categoryTabs" aria-label="商品分类">
            ${categories
              .map((category, index) => `<button type="button" data-category="${escapeHtml(category)}"${index === 0 ? ' class="active"' : ""}>${escapeHtml(category)}</button>`)
              .join("")}
          </div>
          <p class="catalog-count"><strong id="catalogCount">${products.length}</strong> 个商品可浏览</p>
        </div>
        <div class="product-grid" id="productGrid">
          ${products.map(renderProductCard).join("")}
        </div>
      </section>

      <section class="page-section surface-section">
        <div class="two-column">
          <article>
            <p class="eyebrow">如何选择</p>
            <h2>快速锁定您的需求</h2>
            <ul class="clean-list">
              <li>如果您已有目标商品，请直接搜索具体平台或工具名称。</li>
              <li>如果不确定具体方案，可按分类进行浏览，并参考详情页的 FAQ。</li>
              <li>若商品页信息未能解答您的疑问，请随时联系客服进行人工咨询。</li>
            </ul>
          </article>
          <article>
            <p class="eyebrow">服务特色</p>
            <h2>为什么选择我们的代充咨询</h2>
            <ul class="clean-list">
              <li><strong>全方位的方案说明</strong>：我们为每个商品提供详尽的使用场景及常见问题解答。</li>
              <li><strong>清晰的价格边界</strong>：详情页明确标注参考价格与套餐差异，助您初步了解。</li>
              <li><strong>结构化的信息展示</strong>：从目录到详情，我们提供逻辑清晰的信息引导。</li>
            </ul>
          </article>
        </div>
      </section>

      ${renderFaqSection("商品浏览常见问题", "为了提高您的咨询效率，我们整理了以下关于商品浏览与选择的常见问题。", faqs)}
    </main>
    ${renderFooter(siteName)}
    <script>window.__PRODUCTS__ = ${escapeJson(products)};</script>
    <script src="/app.js" defer></script>
  `;

  return renderLayout({
    req,
    pathname: "/products",
    siteName,
    title: `${siteName} 商品页`,
    description: "独立商品目录页，集中展示 AI 工具、AI 绘画和流媒体会员代充商品，并通过独立详情页承接价格、套餐、FAQ 和客服咨询。",
    image: "/assets/product-ai.svg",
    keywords: "商品页,ChatGPT Plus代充,Midjourney订阅,流媒体会员代充,数字订阅目录",
    bodyClass: "catalog-page",
    content,
    schemas
  });
}

function renderProductPage(req, store, product) {
  const settings = store.settings;
  const siteName = text(settings.siteName, "云享代充");
  const products = publicProducts(store);
  const related = products.filter((item) => item.slug !== product.slug).slice(0, 3);
  const faqs = productFaqs(product);
  const audience = productAudience(product);

  const productUrl = `/product/${product.slug}`;
  const availability =
    product.stockStatus === "现货" ? "https://schema.org/InStock" : product.stockStatus === "咨询" ? "https://schema.org/PreOrder" : "https://schema.org/LimitedAvailability";

  const schemas = [
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.name,
      category: product.category,
      description: text(product.description, product.shortDescription),
      image: absoluteUrl(req, safeSrc(product.image)),
      brand: {
        "@type": "Brand",
        name: siteName
      },
      offers: {
        "@type": "Offer",
        priceCurrency: "CNY",
        price: Number(product.price || 0),
        availability,
        url: absoluteUrl(req, productUrl)
      }
    },
    breadcrumbSchema(req, [
      { name: "首页", url: "/" },
      { name: "商品页", url: "/products" },
      { name: product.name, url: productUrl }
    ]),
    faqSchema(faqs)
  ];

  const content = `
    ${renderHeader(siteName, productUrl)}
    <main>
      <section class="page-hero product-page-hero">
        <nav class="breadcrumb" aria-label="面包屑">
          <a href="/">首页</a>
          <span>/</span>
          <a href="/products">商品页</a>
          <span>/</span>
          <strong>${escapeHtml(product.name)}</strong>
        </nav>
        <div class="product-detail-layout">
          <div class="product-rich-text">
            <p class="eyebrow">${escapeHtml(text(product.category, "数字服务"))}</p>
            <h1>${escapeHtml(product.name)} 代充咨询与套餐说明</h1>
            <p>${escapeHtml(text(product.description, product.shortDescription))}</p>
            <div class="detail-pill-list">
              ${(product.highlights || []).slice(0, 5).map((item) => `<span>${escapeHtml(item)}</span>`).join("")}
            </div>
            <div class="page-actions">
              <a class="primary-button" href="/contact">联系客服确认</a>
              <a class="ghost-button" href="/products">返回商品页</a>
            </div>
          </div>
          <aside class="product-summary-card">
            <img class="product-summary-image" src="${safeSrc(product.image)}" alt="${escapeHtml(product.name)}" />
            <div class="price-line">
              <strong>${formatPrice(product.price)}</strong>
              ${product.originalPrice ? `<small>${formatPrice(product.originalPrice)}</small>` : ""}
            </div>
            <ul class="product-stat-list">
              <li><strong>参考单位</strong><span>${escapeHtml(text(product.unit, "月"))}</span></li>
              <li><strong>当前状态</strong><span>${escapeHtml(text(product.stockStatus, "咨询"))}</span></li>
              <li><strong>预计时效</strong><span>${escapeHtml(text(product.delivery, "联系客服确认"))}</span></li>
            </ul>
            <div class="contact-qr-card">
              <img src="${safeSrc(settings.contactQr, "/assets/contact-qr.svg")}" alt="微信客服二维码" />
              <p>发送 <strong>${escapeHtml(product.name)}</strong> 和目标套餐，客服会确认库存、价格及到账时效。</p>
            </div>
          </aside>
        </div>
      </section>

      <section class="page-section">
        <div class="section-head stacked-head">
          <div>
            <p class="eyebrow">套餐参考</p>
            <h2>${escapeHtml(product.name)} 常用套餐方案</h2>
            <p class="section-intro">以下展示当前常见方案，实际是否可下单仍需结合账号条件与客服确认为准。</p>
          </div>
        </div>
        <div class="product-option-grid">
          ${(product.options || [])
            .map(
              (option) => `
                <article class="option-card">
                  <h3>${escapeHtml(option.label)}</h3>
                  <strong>${formatPrice(option.price || product.price)}</strong>
                  <p>${escapeHtml(text(option.note, "联系客服确认具体适用条件。"))}</p>
                </article>
              `
            )
            .join("")}
        </div>
      </section>

      <section class="page-section surface-section">
        <div class="section-head stacked-head">
          <div>
            <p class="eyebrow">适用场景</p>
            <h2>为您解决以下使用需求</h2>
            <p class="section-intro">我们致力于为您提供最贴合实际使用场景的数字服务解决方案。</p>
          </div>
        </div>
        <div class="answer-grid">
          ${audience
            .map(
              (item) => `
                <article class="answer-card">
                  <h3>${escapeHtml(item.title)}</h3>
                  <p>${escapeHtml(item.desc)}</p>
                </article>
              `
            )
            .join("")}
        </div>
      </section>

      <section class="page-section">
        <div class="two-column">
          <article>
            <p class="eyebrow">使用方式</p>
            <h2>咨询与交付流程</h2>
            <ul class="clean-list">
              ${(product.usage || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
            </ul>
          </article>
          <article>
            <p class="eyebrow">下单前确认</p>
            <h2>关键注意事项</h2>
            <ul class="clean-list">
              <li>明确商品名称、套餐时长和期望版本。</li>
              <li>提前说明账号地区、限制条件等信息。</li>
              <li>付款前务必确认最终价格、预计时效与售后规则。</li>
              <li>到账后请立即核对会员状态、有效期及权益。</li>
            </ul>
          </article>
        </div>
      </section>

      ${renderFaqSection(`${product.name} 常见问题`, "针对您的疑问，我们整理了以下常见问题解答。", faqs)}

      ${
        related.length
          ? `
            <section class="page-section surface-section">
              <div class="featured-header">
                <div>
                  <p class="eyebrow">相关推荐</p>
                  <h2>您可能还感兴趣的商品</h2>
                </div>
                <a class="secondary-button" href="/products">查看全部商品</a>
              </div>
              <div class="product-grid related-grid">
                ${related.map(renderProductCard).join("")}
              </div>
            </section>
          `
          : ""
      }
    </main>
    ${renderFooter(siteName)}
  `;

  return renderLayout({
    req,
    pathname: productUrl,
    siteName,
    title: `${product.name} 代充咨询与套餐说明`,
    description: `${product.name} 商品页，展示参考价格、套餐选项、使用方式、到账说明和常见问题。下单前先联系客服确认账号条件、库存和时效。`,
    image: safeSrc(product.image),
    keywords: `${product.name},${product.category},${product.name}代充,${product.name}订阅,数字会员咨询`,
    ogType: "product",
    bodyClass: "product-page",
    content,
    schemas
  });
}

function renderNotFoundPage(req, pathname) {
  const store = readStore();
  const siteName = text(store.settings.siteName, "云享代充");
  const content = `
    ${renderHeader(siteName, pathname)}
    <main>
      <section class="page-hero">
        <p class="eyebrow">404</p>
        <h1>页面不存在或商品已下架</h1>
        <p>你访问的页面没有找到。可以返回介绍页重新浏览，也可以直接进入商品页查看当前公开商品。</p>
        <div class="page-actions">
          <a class="primary-button" href="/products">进入商品页</a>
          <a class="ghost-button" href="/">返回首页</a>
        </div>
      </section>
    </main>
    ${renderFooter(siteName)}
  `;

  return renderLayout({
    req,
    pathname,
    siteName,
    title: "页面不存在",
    description: "当前访问的页面不存在，可以返回首页或商品页继续浏览。",
    bodyClass: "not-found-page",
    content
  });
}

function sanitizeSettings(input, current) {
  return {
    siteName: String(input.siteName || current.siteName || "云享代充").trim(),
    headline: String(input.headline || current.headline || "").trim(),
    subheadline: String(input.subheadline || current.subheadline || "").trim(),
    wechatId: String(input.wechatId || current.wechatId || "").trim(),
    contactQr: String(input.contactQr || current.contactQr || "/assets/contact-qr.svg").trim(),
    notice: String(input.notice || current.notice || "").trim()
  };
}

function serveStaticFile(res, pathname) {
  let filePath = safeJoinStatic(pathname);
  if (!filePath) {
    sendText(res, 403, "Forbidden");
    return;
  }

  if (pathname === "/admin" || pathname === "/admin/") filePath = path.join(PUBLIC_DIR, "admin.html");
  if (pathname === "/assurance" || pathname === "/assurance/") filePath = path.join(PUBLIC_DIR, "assurance.html");
  if (pathname === "/guide" || pathname === "/guide/") filePath = path.join(PUBLIC_DIR, "guide.html");
  if (pathname === "/contact" || pathname === "/contact/") filePath = path.join(PUBLIC_DIR, "contact.html");

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    sendHtml(res, 404, renderNotFoundPage({ headers: {} }, pathname));
    return;
  }

  const ext = path.extname(filePath);
  res.writeHead(200, {
    "Content-Type": mimeTypes[ext] || "application/octet-stream",
    "Cache-Control": ext === ".html" ? "no-store" : "public, max-age=3600"
  });
  fs.createReadStream(filePath).pipe(res);
}

function sendRobots(req, res) {
  const body = `User-agent: *\nAllow: /\nSitemap: ${absoluteUrl(req, "/sitemap.xml")}\n`;
  sendText(res, 200, body, "text/plain; charset=utf-8");
}

function sendLlms(req, res) {
  const store = readStore();
  const siteName = text(store.settings.siteName, "云享代充");
  const products = publicProducts(store);
  const lines = [
    `# ${siteName}`,
    "",
    "> AI 工具、流媒体会员与数字订阅代充咨询站。首页负责解释服务方式，商品页提供独立商品详情，联系客服页提供统一咨询入口。",
    "",
    "## Main Pages",
    `- ${absoluteUrl(req, "/")} : 介绍页，说明服务方式、保障、流程与客服入口。`,
    `- ${absoluteUrl(req, "/products")} : 商品目录页，按分类浏览所有公开商品。`,
    `- ${absoluteUrl(req, "/assurance")} : 服务保障与退款边界说明。`,
    `- ${absoluteUrl(req, "/guide")} : 下单流程说明。`,
    `- ${absoluteUrl(req, "/contact")} : 客服入口与咨询指引。`,
    "",
    "## Product Pages"
  ];

  for (const product of products) {
    lines.push(`- ${absoluteUrl(req, `/product/${product.slug}`)} : ${product.name}，${text(product.shortDescription, product.description)}`);
  }

  lines.push(
    "",
    "## Service Rules",
    "- 商品页展示参考价格，付款前以人工确认记录为准。",
    "- 咨询前应先说明商品名称、套餐、账号地区和时效要求。",
    "- 售后保留沟通记录，异常处理按确认规则执行。"
  );

  sendText(res, 200, `${lines.join("\n")}\n`, "text/plain; charset=utf-8");
}

function sendSitemap(req, res) {
  const store = readStore();
  const products = publicProducts(store);
  const pages = [
    { url: "/", lastmod: new Date().toISOString() },
    { url: "/products", lastmod: new Date().toISOString() },
    { url: "/assurance", lastmod: new Date().toISOString() },
    { url: "/guide", lastmod: new Date().toISOString() },
    { url: "/contact", lastmod: new Date().toISOString() },
    ...products.map((product) => ({
      url: `/product/${product.slug}`,
      lastmod: product.updatedAt || product.createdAt || new Date().toISOString()
    }))
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages
  .map(
    (page) => `  <url>
    <loc>${escapeXml(absoluteUrl(req, page.url))}</loc>
    <lastmod>${escapeXml(new Date(page.lastmod).toISOString())}</lastmod>
  </url>`
  )
  .join("\n")}
</urlset>
`;

  sendText(res, 200, body, "application/xml; charset=utf-8");
}

async function handleApi(req, res, pathname) {
  try {
    if (req.method === "GET" && pathname === "/api/config") {
      const store = readStore();
      sendJson(res, 200, store.settings);
      return;
    }

    if (req.method === "GET" && pathname === "/api/products") {
      const store = readStore();
      sendJson(res, 200, publicProducts(store).map(publicProduct));
      return;
    }

    if (req.method === "GET" && pathname.startsWith("/api/products/")) {
      const slug = decodeURIComponent(pathname.replace("/api/products/", ""));
      const store = readStore();
      const product = store.products.find((item) => item.slug === slug && item.published);
      if (!product) return sendError(res, 404, "商品不存在或已下架");
      sendJson(res, 200, publicProduct(product));
      return;
    }

    if (req.method === "POST" && pathname === "/api/admin/login") {
      const body = await readBody(req);
      if (String(body.username || "") !== ADMIN_USERNAME || String(body.password || "") !== ADMIN_PASSWORD) {
        return sendError(res, 401, "账号或密码错误");
      }
      sendJson(res, 200, { token: signToken({ role: "admin", user: ADMIN_USERNAME, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 }) });
      return;
    }

    if (pathname.startsWith("/api/admin") && !requireAdmin(req, res)) return;

    if (req.method === "GET" && pathname === "/api/admin/products") {
      const store = readStore();
      sendJson(res, 200, sortProducts(store.products));
      return;
    }

    if (req.method === "POST" && pathname === "/api/admin/products") {
      const body = await readBody(req);
      const store = readStore();
      const product = normalizeProduct(body);
      if (store.products.some((item) => item.slug === product.slug)) return sendError(res, 409, "商品链接标识已存在");
      store.products.push(product);
      writeStore(store);
      sendJson(res, 201, product);
      return;
    }

    if (req.method === "PUT" && pathname.startsWith("/api/admin/products/")) {
      const id = pathname.replace("/api/admin/products/", "");
      const body = await readBody(req);
      const store = readStore();
      const index = store.products.findIndex((item) => item.id === id);
      if (index < 0) return sendError(res, 404, "商品不存在");
      const product = normalizeProduct(body, store.products[index]);
      if (store.products.some((item) => item.id !== id && item.slug === product.slug)) return sendError(res, 409, "商品链接标识已存在");
      store.products[index] = product;
      writeStore(store);
      sendJson(res, 200, product);
      return;
    }

    if (req.method === "DELETE" && pathname.startsWith("/api/admin/products/")) {
      const id = pathname.replace("/api/admin/products/", "");
      const store = readStore();
      const next = store.products.filter((item) => item.id !== id);
      if (next.length === store.products.length) return sendError(res, 404, "商品不存在");
      store.products = next;
      writeStore(store);
      sendJson(res, 200, { ok: true });
      return;
    }

    if (req.method === "PUT" && pathname === "/api/admin/settings") {
      const body = await readBody(req);
      const store = readStore();
      store.settings = sanitizeSettings(body, store.settings);
      writeStore(store);
      sendJson(res, 200, store.settings);
      return;
    }

    if (req.method === "POST" && pathname === "/api/admin/upload") {
      const body = await readBody(req);
      const match = String(body.dataUrl || "").match(/^data:(image\/(?:png|jpeg|webp|svg\+xml));base64,(.+)$/);
      if (!match) return sendError(res, 422, "仅支持 png、jpg、webp、svg 图片");
      const ext = match[1].includes("png") ? ".png" : match[1].includes("webp") ? ".webp" : match[1].includes("svg") ? ".svg" : ".jpg";
      const base = path.basename(String(body.filename || "upload")).replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/\.[^.]+$/, "");
      const filename = `${Date.now()}-${base || "image"}${ext}`;
      fs.writeFileSync(path.join(UPLOAD_DIR, filename), Buffer.from(match[2], "base64"));
      sendJson(res, 201, { url: `/uploads/${filename}` });
      return;
    }

    sendError(res, 404, "接口不存在");
  } catch (error) {
    sendError(res, error.status || 500, error.message || "服务器错误");
  }
}

ensureStore();

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname.startsWith("/api/")) {
    handleApi(req, res, url.pathname);
    return;
  }

  if (url.pathname === "/robots.txt") {
    sendRobots(req, res);
    return;
  }

  if (url.pathname === "/favicon.ico") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (url.pathname === "/sitemap.xml") {
    sendSitemap(req, res);
    return;
  }

  if (url.pathname === "/llms.txt") {
    sendLlms(req, res);
    return;
  }

  const store = readStore();

  if (url.pathname === "/" || url.pathname === "/index.html") {
    sendHtml(res, 200, renderHomePage(req, store));
    return;
  }

  if (url.pathname === "/products" || url.pathname === "/products/") {
    sendHtml(res, 200, renderProductsPage(req, store));
    return;
  }

  if (url.pathname.startsWith("/product/")) {
    const slug = decodeURIComponent(url.pathname.replace(/^\/product\//, "").replace(/\/$/, ""));
    const product = store.products.find((item) => item.slug === slug && item.published);
    if (!product) {
      sendHtml(res, 404, renderNotFoundPage(req, url.pathname));
      return;
    }
    sendHtml(res, 200, renderProductPage(req, store, product));
    return;
  }

  serveStaticFile(res, url.pathname);
});

server.listen(PORT, () => {
  console.log(`Daichong market running at http://localhost:${PORT}`);
  console.log(`Admin panel: http://localhost:${PORT}/admin`);
});
