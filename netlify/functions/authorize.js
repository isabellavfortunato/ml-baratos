export const handler = async function() {
  const clientId = process.env.ML_CLIENT_ID;
  const redirectUri = encodeURIComponent(process.env.ML_REDIRECT_URI);
  const url = `https://auth.mercadolivre.com.br/authorization?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}`;

  return {
    statusCode: 302,
    headers: { Location: url },
    body: "",
  };
};
