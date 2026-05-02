export async function onRequest(context) {
  const url = new URL(context.request.url);
  url.pathname = '/blog/post.html';
  return fetch(url.toString());
}
