export async function onRequest(context) {
  const url = new URL(context.request.url);
  url.pathname = '/blog/post.html';
  const request = new Request(url.toString(), context.request);
  return fetch(request);
}
