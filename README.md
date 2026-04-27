# 云享代充网站

一个无构建依赖的中文代充商品中转站，包含商品列表、商品详情、微信客服二维码、后台商品管理、站点设置和图片上传。

## 本地运行

```bash
ADMIN_USERNAME=admin ADMIN_PASSWORD=admin123 TOKEN_SECRET=change-me PORT=3000 node server.js
```

访问：

- 前台：http://localhost:3000
- 后台：http://localhost:3000/admin

首次启动会自动创建 `data/store.json`，商品和站点配置都保存在这个文件中。上传图片会保存到 `public/uploads/`。

也可以复制 `.env.example` 为 `.env`，修改账号、密码、端口和密钥后重启网站生效：

```bash
cp .env.example .env
node server.js
```

## 后台能力

- 编辑站点名称、首页标题、说明、微信号、客服二维码和提示语
- 新增、编辑、删除商品
- 设置商品分类、价格、原价、单位、排序、状态、推荐、上下架
- 配置商品套餐 JSON、卖点、使用方式、到账时效和获取方式
- 上传商品图和客服二维码

套餐 JSON 示例：

```json
[
  { "label": "1 个月", "price": 78, "note": "常规月卡" },
  { "label": "3 个月", "price": 225, "note": "更省心" }
]
```

## 阿里云 ECS 部署

以下步骤以 Ubuntu 22.04 为例。

1. 安装 Node.js 18+

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs nginx
```

2. 上传代码到服务器

```bash
scp -r ./daichong root@你的服务器公网IP:/opt/daichong
ssh root@你的服务器公网IP
cd /opt/daichong
```

3. 设置后台账号密码并用 PM2 托管

```bash
sudo npm install -g pm2
ADMIN_USERNAME='请换成后台账号' ADMIN_PASSWORD='请换成强密码' TOKEN_SECRET='请换成随机长字符串' PORT=3000 pm2 start server.js --name daichong
pm2 save
pm2 startup
```

如果更希望通过配置文件维护，也可以在 `/opt/daichong/.env` 写入：

```bash
PORT=3000
ADMIN_USERNAME=admin
ADMIN_PASSWORD=请换成强密码
TOKEN_SECRET=请换成随机长字符串
```

修改 `.env` 后需要重启：

```bash
pm2 restart daichong
```

4. 配置 Nginx 反向代理

```nginx
server {
    listen 80;
    server_name your-domain.com;

    client_max_body_size 10m;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

保存到 `/etc/nginx/sites-available/daichong` 后启用：

```bash
sudo ln -s /etc/nginx/sites-available/daichong /etc/nginx/sites-enabled/daichong
sudo nginx -t
sudo systemctl reload nginx
```

5. HTTPS

如果域名已解析到 ECS，可以安装证书：

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## 可选：Docker 部署

```bash
docker build -t daichong-market .
docker run -d --name daichong \
  -p 3000:3000 \
  -e ADMIN_USERNAME='请换成后台账号' \
  -e ADMIN_PASSWORD='请换成强密码' \
  -e TOKEN_SECRET='请换成随机长字符串' \
  -v "$(pwd)/data:/app/data" \
  -v "$(pwd)/public/uploads:/app/public/uploads" \
  daichong-market
```

## 上线前检查

- 修改 `ADMIN_USERNAME` 和 `ADMIN_PASSWORD`，不要使用默认账号密码
- 设置稳定的 `TOKEN_SECRET`
- 备份 `data/store.json` 和 `public/uploads/`
- 在阿里云安全组开放 80/443 端口
- 根据实际业务补充备案、服务条款、隐私政策和售后说明
