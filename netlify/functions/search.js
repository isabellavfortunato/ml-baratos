import { getStore } from "@netlify/blobs";

async function getValidToken() {
  const store = getStore({
    name: "ml-tokens",
    siteID: process.env.NETLIFY_SITE_ID,
    token: process.env.NETLIFY_TOKEN,
  });

  const tokens = await store.get("tokens", { type: "json" });

  if (!tokens) throw new Error("Token nao encontrado. Acesse /authorize para autenticar.");

  if (Date.now() < tokens.expires_at - 60000) {
    return tokens.access_token;
  }

  const tokenRes = await fetch("https://api.mercadolibre.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: process.env.ML_CLIENT_ID,
      client_secret: process.env.ML_CLIENT_SECRET,
      refresh_token: tokens.refresh_token,
    }),
  });

  const newTokens = await tokenRes.json();
  if (!newTokens.access_token) throw new Error("Falha ao renovar token");

  await store.setJSON("tokens", {
    access_token: newTokens.access_token,
    refresh_token: newTokens.refresh_token || tokens.refresh_token,
    expires_at: Date.now() + newTokens.expires_in * 1000,
  });

  return newTokens.access_token;
}

export const handler = async function(event) {
  const q = event.queryStringParameters?.q;
  if (!q) return { statusCode: 400, body: JSON.stringify({ error: "q obrigatorio" }) };

  try {
    const token = await getValidToken();

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
    console.log("ERRO:", e.message);
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
