async function refreshToken() {
  const tokenRes = await fetch("https://api.mercadolibre.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: process.env.ML_CLIENT_ID,
      client_secret: process.env.ML_CLIENT_SECRET,
      refresh_token: process.env.ML_REFRESH_TOKEN,
    }),
  });

  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) throw new Error("Falha ao renovar token");

  await fetch(
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
          values: [{ value: tokenData.refresh_token || process.env.ML_REFRESH_TOKEN, context: "production" }],
        },
        {
          key: "ML_TOKEN_EXPIRES_AT",
          values: [{ value: String(Date.now() + tokenData.expires_in * 1000), context: "production" }],
        },
      ]),
    }
  );

  return tokenData.access_token;
}

export const handler = async function(event) {
  const q = event.queryStringParameters?.q;
  if (!q) return { statusCode: 400, body: JSON.stringify({ error: "q obrigatorio" }) };

  try {
    let token = process.env.ML_ACCESS_TOKEN;

    if (!token) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: "Token nao encontrado. Acesse /authorize para autenticar." }),
      };
    }

    const expiresAt = parseInt(process.env.ML_TOKEN_EXPIRES_AT || "0");
    if (Date.now() > expiresAt - 60000) {
      token = await refreshToken();
    }

    const url = new URL("https://api.mercadolibre.com/sites/MLB/search");
    url.searchParams.set("q", q);
    url.searchParams.set("sort", "price_asc");
    url.searchParams.set("limit", "50");

    const searchRes = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });

    console.log("SEARCH STATUS:", searchRes.status);
    const text = await searchRes.text();
    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" },
      body: text,
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
