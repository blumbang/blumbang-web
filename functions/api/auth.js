export async function onRequest(context) {
  const { GITHUB_CLIENT_ID } = context.env;
  const base = "https://github.com/login/oauth/authorize";
  const params = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID,
    scope: "repo,user",
  });
  return Response.redirect(`${base}?${params}`, 302);
}
