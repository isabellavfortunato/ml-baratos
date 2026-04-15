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

    const netlifyRes = await fetch(
      `https://api.netlify.com/api/v1/sites/${process.env.NETLIFY_SITE_ID}/env`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.NETLIFY_TOKEN}`,
        },
        body: JSON.stringify([
          {
            key: "ML_ACCESS_TOKEN",
            values: [{ value: tokenData.access_token, context: "production" }],
          },
          {
            key: "ML_REFRESH_TOKEN",
            values: [{ value: tokenData.refresh_token, context: "production" }],
          },
          {
            key: "ML_TOKEN_EXPIRES_AT",
            values: [{ value: String(Date.now() + tokenData.expires_in * 1000), context: "production" }],
          },
        ]),
      }
    );

    console.log("NETLIFY ENV UPDATE:", netlifyRes.status);

    return {
      statusCode: 200,
      headers: { "Content-Type": "text/html" },
      body: "<html><body><h2>Autorizacao concluida com sucesso. Pode fechar esta aba.</h2></body></html>",
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
