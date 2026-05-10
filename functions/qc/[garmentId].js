export async function onRequest(context) {
  const url = new URL(context.request.url);
  url.pathname = '/id.html';
  const response = await context.env.ASSETS.fetch(url.toString());
  return response;
}
