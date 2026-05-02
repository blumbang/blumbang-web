export async function onRequest(context) {
  const { request, env } = context;
  const { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET } = env;

  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  if (!code) {
    return new Response("Missing code", { status: 400 });
  }

  // Tukar code dengan access token
  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify({
      client_id: GITHUB_CLIENT_ID,
      client_secret: GITHUB_CLIENT_SECRET,
      code,
    }),
  });

  const tokenData = await tokenRes.json();

  if (tokenData.error) {
    return new Response(`Auth error: ${tokenData.error_description}`, { status: 400 });
  }

  const token = tokenData.access_token;

  // Kirim token ke Decap CMS via postMessage
  const script = `
    <script>
      (function() {
        function receiveMessage(e) {
          console.log("receiveMessage %o", e);
          window.opener.postMessage(
            'authorization:github:success:${JSON.stringify({ token, provider: "github" })}',
            e.origin
          );
        }
        window.addEventListener("message", receiveMessage, false);
        window.opener.postMessage("authorizing:github", "*");
      })()
    <\/script>
  `;

  return new Response(`<!DOCTYPE html><html><body>${script}</body></html>`, {
    headers: { "Content-Type": "text/html" },
  });
}
