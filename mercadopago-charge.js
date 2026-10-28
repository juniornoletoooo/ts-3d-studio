exports.handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    try {
        const { type, paymentData, cart, totalAmount } = JSON.parse(event.body);
        const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;

        if (!MP_ACCESS_TOKEN) {
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: 'Token do Mercado Pago não configurado no Netlify.' })
            };
        }

        let bodyData = {};

        if (type === 'pix') {
            bodyData = {
                transaction_amount: Number(totalAmount),
                description: "Pedido TS 3D STUDIO",
                payment_method_id: "pix",
                payer: {
                    email: "cliente@ts3dstudio.com",
                    first_name: paymentData.name ? paymentData.name.split(' ')[0] : "Cliente",
                    last_name: paymentData.name ? paymentData.name.split(' ').slice(1).join(' ') || "TS" : "3D"
                }
            };
        } else if (type === 'card') {
            bodyData = {
                transaction_amount: Number(paymentData.transaction_amount || totalAmount),
                token: paymentData.token,
                description: "Pedido TS 3D STUDIO",
                installments: Number(paymentData.installments || 1),
                payment_method_id: paymentData.payment_method_id,
                issuer_id: paymentData.issuer_id ? Number(paymentData.issuer_id) : undefined,
                payer: {
                    email: paymentData.payer?.email || "cliente@ts3dstudio.com",
                    identification: paymentData.payer?.identification || { type: "CPF", number: "00000000000" }
                }
            };
        }

        const response = await fetch('https://api.mercadopago.com/v1/payments', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(bodyData)
        });

        const result = await response.json();

        return {
            statusCode: response.status,
            headers,
            body: JSON.stringify(result)
        };

    } catch (err) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: err.message })
        };
    }
};