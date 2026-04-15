export const handler = async function(event) {
  const q = event.queryStringParameters?.q;
  if (!q) return { statusCode: 400, body: JSON.stringify({ error: "q obrigatorio" }) };

  try {
    const tokenRes = await fetch("https://api.mercadolibre.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: process.env.ML_CLIENT_ID,
        client_secret: process.env.ML_CLIENT_SECRET,
      }),
    });

    const tokenData = await tokenRes.json();
    console.log("TOKEN RESPONSE:", JSON.stringify(tokenData).slice(0, 200));

    const token = tokenData.access_token;

    if (!token) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Falha ao obter token", detail: tokenData }),
      };
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
    console.log("SEARCH RESPONSE (primeiros 300 chars):", text.slice(0, 300));

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
