# 云享代充网站

一个无构建依赖的数字会员与 AI 工具代充中转站。支持商品展示、后台管理、图片上传以及**支付宝扫码支付**集成。

## 核心特性

- **商品展示**：响应式布局，支持分类、搜索和精选推荐。
- **详情页**：独立的商品详情页，包含套餐方案、常见问题和获取方式。
- **在线支付**：集成支付宝“电脑网站支付”，支持用户扫码支付并自动跳转至客服页面。
- **后台管理**：便捷管理站点配置、商品信息及图片上传。
- **SEO/GEO 友好**：结构化文案，利于搜索引擎及大模型（LLMs）理解。

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并填写相关信息：

```bash
cp .env.example .env
```

`.env` 关键配置项说明：

- `ADMIN_USERNAME` / `ADMIN_PASSWORD`: 后台登录凭证。
- `TOKEN_SECRET`: 用于 JWT 签名的随机长字符串。
- `ALIPAY_APP_ID`: 支付宝应用 ID。
- `ALIPAY_PRIVATE_KEY`: 应用私钥。
- `ALIPAY_PUBLIC_KEY`: 支付宝公钥（注意是在支付宝开放平台获取的支付宝公钥，而非应用公钥）。
- `ALIPAY_GATEWAY`: 支付宝网关（正式环境：`https://openapi.alipay.com/gateway.do`；沙箱环境：`https://openapi-sandbox.dl.alipaydev.com/gateway.do`）。

### 3. 本地运行

```bash
node server.js
```

访问：
- 前台：http://localhost:3000
- 后台：http://localhost:3000/admin

## 支付流程

1. **用户选购**：用户在商品卡片或详情页点击“支付”按钮。
2. **跳转支付**：系统通过 `/api/pay` 接口生成支付宝支付 URL 并重定向。
3. **完成支付**：用户完成扫码支付。
4. **自动跳转**：支付成功后，支付宝将自动重定向用户至站点“联系客服”页面 (`/contact`)，引导用户提交充值信息。

## 后台管理能力

- 编辑站点名称、首页标题、微信号、客服二维码。
- 商品的全生命周期管理（新增、编辑、删除、上下架、推荐）。
- 配置商品套餐 JSON、使用方式、到账时效。
- 集成图片上传功能。

## 部署建议

### PM2 托管

```bash
sudo npm install -g pm2
pm2 start server.js --name daichong
```

### Nginx 反向代理

建议使用 Nginx 作为反向代理并配置 HTTPS。请确保 `client_max_body_size` 足够大以支持图片上传。

## 开发者说明

- **无构建步骤**：直接修改 `public/` 下的 HTML/JS 和根目录的 `server.js` 即可。
- **数据存储**：所有动态数据保存在 `data/store.json`，请注意定期备份。
- **图片存储**：上传的图片保存在 `public/uploads/`。

## 安全建议

- 严禁将 `.env` 文件提交至版本控制系统。
- 上线前请务必修改默认的后台管理密码。
- 建议配置防火墙，仅开放必要的 80/443 端口。
