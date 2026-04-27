const Express = require('express');
const { AlipaySdk, AlipayFormData } = require('alipay-sdk');
const path = require('path');
require('dotenv').config();

const app = new Express();
app.use(Express.json());
app.use(Express.urlencoded({ extended: true }));
app.use(Express.static('public'));

/**
 * 支付宝配置说明：
 * 1. appId: 支付宝分配给开发者的应用ID
 * 2. privateKey: 开发者生成的私钥
 * 3. alipayPublicKey: 支付宝提供的公钥（在开放平台配置完加签后获取）
 * 4. gateway: 支付宝网关，沙箱环境为 https://openapi-sandbox.dl.alipaydev.com/gateway.do
 */
const alipaySdk = new AlipaySdk({
    appId: process.env.ALIPAY_APP_ID || '你的APPID',
    privateKey: process.env.ALIPAY_PRIVATE_KEY || '你的应用私钥',
    alipayPublicKey: process.env.ALIPAY_PUBLIC_KEY || '你的支付宝公钥',
    gateway: 'https://openapi.alipay.com/gateway.do', // 生产环境网关
});

// 发起支付接口
app.get('/api/pay', async (req, res) => {
    const { out_trade_no, total_amount, subject } = req.query;

    try {
        // 直接传递参数对象，sdk 会自动处理签名和序列化
        const result = await alipaySdk.pageExec('alipay.trade.page.pay', {
            bizContent: {
                out_trade_no: out_trade_no || `order_${Date.now()}`,
                product_code: 'FAST_INSTANT_TRADE_PAY',
                total_amount: total_amount || '0.01',
                subject: subject || '测试商品',
            },
            returnUrl: `http://localhost:3000/return.html`,
            // notifyUrl: `http://your-domain.com/api/notify`, // 暂时注释掉，本地测试不需要
        });

        // result 是一个完整的跳转 URL
        res.send(result);
    } catch (error) {
        console.error('支付发起失败', error);
        res.status(500).send('支付发起失败: ' + error.message);
    }
});

// 异步通知处理
app.post('/api/notify', async (req, res) => {
    const postData = req.body;
    console.log('收到支付宝异步通知:', postData);

    try {
        // 验签
        const isValid = alipaySdk.checkNotifySign(postData);
        if (isValid) {
            // TODO: 校验 app_id, out_trade_no, total_amount 是否一致
            // TODO: 处理业务逻辑（如更新订单状态）
            console.log('异步通知验签成功');
            res.send('success'); // 必须返回 success
        } else {
            console.error('异步通知验签失败');
            res.send('failure');
        }
    } catch (error) {
        console.error('异步通知处理异常', error);
        res.status(500).send('error');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Demo server running at http://localhost:${PORT}`);
    console.log(`请确保已在 .env 文件中配置了支付宝相关密钥`);
});
