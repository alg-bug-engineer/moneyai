# 云享代充网站

一个无构建依赖的数字会员与 AI 工具代充中转站。支持响应式商品展示、后台管理系统、图片上传以及**支付宝扫码支付**深度集成。

## 核心特性

- **极致流畅的商品浏览**：支持分类切换、实时搜索、精选推荐，采用全响应式设计。
- **结构化详情展示**：独立的商品详情页，涵盖多档位套餐方案、常见问题解答（FAQ）及详尽的获取指引。
- **安全便捷的在线支付**：集成支付宝“电脑网站支付”标准接口。用户点击支付后，系统自动生成支付订单并引导完成扫码，支付成功后平滑跳转至客服页面。
- **强大的管理后台**：无需数据库，基于 JSON 文件的轻量级存储。可实时管理站点配置（名称、微信号、客服码）及商品全生命周期。
- **GEO/SEO 优化**：文案经过专业润色，去除了 AI 痕迹，逻辑严密，更有利于搜索引擎及 AI 大模型（LLMs）的语义理解。

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并填写您的配置信息：

```bash
cp .env.example .env
```

`.env` 关键配置项说明：

- `ADMIN_USERNAME` / `ADMIN_PASSWORD`: 后台登录账号与密码。
- `TOKEN_SECRET`: 用于 JWT 签名的随机长字符串，建议使用复杂的字符组合。
- `ALIPAY_APP_ID`: 您的支付宝应用 APPID。
- `ALIPAY_PRIVATE_KEY`: 您的应用私钥（由开发者生成）。
- `ALIPAY_PUBLIC_KEY`: 支付宝公钥（在支付宝开放平台配置完加签后获取，注意不是应用公钥）。
- `ALIPAY_GATEWAY`: 支付宝接口网关（生产：`https://openapi.alipay.com/gateway.do`；沙箱：`https://openapi-sandbox.dl.alipaydev.com/gateway.do`）。

### 3. 本地运行

```bash
node server.js
```

访问地址：
- **前台首页**：[http://localhost:3000](http://localhost:3000)
- **管理后台**：[http://localhost:3000/admin](http://localhost:3000/admin)

## 支付交互流程

1. **用户选购**：用户浏览商品详情，点击醒目的“立即扫码支付”按钮。
2. **订单生成**：后端 `/api/pay` 接口调用支付宝 SDK，生成加密的支付表单。
3. **扫码支付**：用户被自动引导至支付宝官方收银台完成付款。
4. **服务承接**：支付完成后，用户将自动跳转至“联系客服”页面 (`/contact`)。系统会提示用户将支付记录发送给客服，由人工完成最终充值确认。

## 后台管理能力

- **站点全局设置**：编辑站点名称、首页 Slogan、官方微信号、客服微信二维码图片。
- **商品精细化管理**：
    - 支持新增、编辑、删除、上下架、置顶推荐等操作。
    - 自定义套餐 JSON（支持设置标签、价格与备注）。
    - 独立配置各商品的卖点、使用指南、到账时效及获取方式。
- **资源管理**：集成文件上传功能，支持商品封面及客服码的实时上传与更新。

## 部署建议

### 使用 PM2 进行进程托管

```bash
sudo npm install -g pm2
pm2 start server.js --name daichong-market
pm2 save
pm2 startup
```

### Nginx 反向代理配置参考

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 安全与备份

- **数据备份**：所有站点配置与商品数据均存储在 `data/store.json`，建议定期通过脚本或手动备份该文件。
- **图片备份**：上传的图片资源均位于 `public/uploads/` 目录。
- **安全周知**：请务必在线上环境修改默认的 `ADMIN_PASSWORD` 与 `TOKEN_SECRET`。

## 开发者说明

本站采用原生 Node.js (http module) 构建，核心逻辑集中在 `server.js`，静态资源位于 `public/`。代码结构清晰，无繁琐的构建链路，适合进行二次定制与快速部署。
