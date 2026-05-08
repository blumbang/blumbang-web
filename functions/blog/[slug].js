export async function onRequest(context) {
  const { params, env } = context;
  const slug = params.slug;

  // Kalau ada ekstensi file (.html, .json, dll) — jangan handle, biarkan static asset
  if (slug.includes('.')) {
    return context.next();
  }

  // Fetch post.html dan return ke user
  const url = new URL(context.request.url);
  url.pathname = '/blog/post.html';
  const response = await env.ASSETS.fetch(url.toString());
  return response;
}
