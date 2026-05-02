export async function onRequest(context) {
  return context.env.ASSETS.fetch(
    new URL('/blog/post.html', context.request.url)
  );
}
