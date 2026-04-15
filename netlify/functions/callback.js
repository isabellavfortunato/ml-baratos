import { getStore } from "@netlify/blobs";

export const handler = async function(event) {
  const code = event.queryStringParameters?.code;

  if (!code) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Codigo de autorizacao ausente" }),
    };
  }

  try {
    const tokenRes = await fetch("https://api.mercadolibre.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: process.env.ML_CLIENT_ID,
        client_secret: process.env.ML_CLIENT_SECRET,
        code: code,
        redirect_uri: process.env.ML_REDIRECT_URI,
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Falha ao obter token", detail: tokenData }),
      };
    }

    const store = getStore({
      name: "ml-tokens",
      siteID: process.env.NETLIFY_SITE_ID,
      token: process.env.NETLIFY_TOKEN,
    });

    await store.setJSON("tokens", {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_at: Date.now() + tokenData.expires_in * 1000,
    });

    console.log("TOKEN SALVO COM SUCESSO");

    return {
      statusCode: 200,
      headers: { "Content-Type": "text/html" },
      body: "<html><body><h2>Autorizacao concluida com sucesso. Pode fechar esta aba.</h2></body></html>",
    };
  } catch (e) {
    console.log("ERRO:", e.message);
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
