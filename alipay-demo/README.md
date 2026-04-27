# 支付宝支付 Demo 调试指南

本指南将帮助您从零开始，在本地环境搭建并跑通支付宝“电脑网站支付”的完整链路。

## 1. 准备工作：获取沙箱账号
由于正式环境需要企业资质，开发阶段我们统一使用**沙箱环境**。

1.  **登录控制台**：使用支付宝账号登录 [支付宝开放平台 - 沙箱控制台](https://open.alipay.com/develop/sandbox/app)。
2.  **获取信息**：在“沙箱应用”页面，记录下：
    *   **APPID**
    *   **支付宝网关**：`https://openapi-sandbox.dl.alipaydev.com/gateway.do`
3.  **配置密钥**：
    *   点击“接口加签方式”中的“设置”。
    *   推荐选择“自定义密钥”。
    *   使用 [支付宝密钥生成器](https://opendocs.alipay.com/common/02kiql) 生成“应用私钥”和“应用公钥”。
    *   将**应用公钥**填入网页，保存后会生成**支付宝公钥**。
    *   **保存好：你的应用私钥、支付宝生成的支付宝公钥。**

## 2. 快速开始

### 安装依赖
```bash
npm install
```

### 配置环境变量
在项目根目录创建 `.env` 文件（参考 `.env.example`）：
```ini
ALIPAY_APP_ID=202100xxxxxx  # 你的沙箱APPID
ALIPAY_PRIVATE_KEY=MIIEvA... # 你的应用私钥
ALIPAY_PUBLIC_KEY=MIIBIj...  # 支付宝公钥（注意不是你生成的应用公钥）
PORT=3000
```

### 启动服务
```bash
node app.js
```

## 3. 调试流程

1.  **发起下单**：访问 `http://localhost:3000`，填写金额并点击“去支付”。
2.  **页面跳转**：系统会自动生成支付表单并跳转至支付宝收银台。
3.  **登录沙箱买家账号**：
    *   在沙箱控制台找到 [沙箱账号](https://open.alipay.com/develop/sandbox/account)。
    *   使用“买家账号”和“登录密码”在支付页面登录。
    *   使用“支付密码”完成付款。
4.  **同步回跳**：支付完成后，支付宝会自动跳转回 `http://localhost:3000/return.html`，你可以看到 URL 中携带的支付结果参数。
5.  **异步通知（关键）**：
    *   由于 `localhost` 外网无法访问，支付宝后端无法直接调用你的 `/api/notify` 接口。
    *   **方案 A**：使用内网穿透工具（如 `ngrok` 或 `localtunnel`）将本地 3000 端口映射到外网，并修改 `app.js` 中的 `notifyUrl`。
    *   **方案 B**：查看控制台日志，模拟接收到的数据进行验签测试。

## 4. 关键接口说明

| 接口 | 说明 | 对应 SDK 方法 |
| :--- | :--- | :--- |
| `alipay.trade.page.pay` | 统一收单下单并支付页面接口 | `alipaySdk.exec` |
| `alipay.trade.query` | 查询交易状态（异步通知未收到时手动补偿） | `alipaySdk.execute` |
| `alipay.trade.refund` | 交易退款 | `alipaySdk.execute` |

## 5. 注意事项
*   **金额限制**：沙箱环境订单金额请保持在合理范围，金额不能为 0。
*   **验签失败**：请检查 `ALIPAY_PUBLIC_KEY` 是否误填成了“应用公钥”。必须使用支付宝页面上显示的“支付宝公钥”。
*   **浏览器限制**：建议在 Chrome 浏览器中调试。
