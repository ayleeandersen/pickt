// api/place-photo.js
// Vercel serverless function — proxies Google Places Photo requests.
// This keeps the API key server-side while still serving images to the client.
// Environment variables required:
//   GOOGLE_PLACES_KEY

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  if (req.method === "OPTIONS") return res.status(200).end();

  const { ref, maxwidth = "400" } = req.query;
  if (!ref) return res.status(400).json({ error: "ref param required" });

  const key = process.env.GOOGLE_PLACES_KEY;
  if (!key) return res.status(500).json({ error: "API key not configured" });

  try {
    const url = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxwidth}&photoreference=${ref}&key=${key}`;
    const response = await fetch(url, { redirect: "follow" });

    if (!response.ok) return res.status(response.status).end();

    // Stream the image through — cache it aggressively since photo refs don't change
    res.setHeader("Content-Type", response.headers.get("content-type") || "image/jpeg");
    res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=86400");

    const buffer = await response.arrayBuffer();
    return res.send(Buffer.from(buffer));
  } catch (err) {
    console.error("Photo proxy error:", err);
    return res.status(500).end();
  }
}
