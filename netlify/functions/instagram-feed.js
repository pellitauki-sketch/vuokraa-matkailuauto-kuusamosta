// Netlify Function: read recent posts from the owner's Instagram professional account.
// Configure INSTAGRAM_ACCESS_TOKEN in Netlify environment variables (never in client code).
exports.handler = async () => {
  const headers = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=300, s-maxage=1800' };
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  if (!token) return { statusCode: 503, headers: { ...headers, 'Cache-Control': 'no-store' }, body: JSON.stringify({ error: 'Instagram integration is not configured' }) };
  try {
    const params = new URLSearchParams({ fields: 'id,media_type,media_url,thumbnail_url,permalink,timestamp,children{media_type,media_url,thumbnail_url}', limit: '18', access_token: token });
    const response = await fetch('https://graph.instagram.com/v25.0/me/media?' + params, { signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error('Instagram API status ' + response.status);
    const payload = await response.json();
    const posts = (payload.data || []).map(item => {
      const first = item.children?.data?.[0];
      const image = item.media_type === 'VIDEO' ? item.thumbnail_url : item.media_type === 'CAROUSEL_ALBUM' ? (first?.media_type === 'VIDEO' ? first?.thumbnail_url : first?.media_url) : item.media_url;
      if (!image || !/^https:\/\//.test(image) || !/^https:\/\/www\.instagram\.com\//.test(item.permalink || '')) return null;
      return { id: item.id, image, url: item.permalink, date: item.timestamp || '', video: item.media_type === 'VIDEO' };
    }).filter(Boolean).slice(0, 6);
    return { statusCode: 200, headers, body: JSON.stringify({ posts }) };
  } catch (error) {
    console.error('Instagram feed request failed:', error.message);
    return { statusCode: 502, headers: { ...headers, 'Cache-Control': 'no-store' }, body: JSON.stringify({ error: 'Instagram feed unavailable' }) };
  }
};
