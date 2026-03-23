// api/restaurants.js
// Vercel serverless function — proxies Google Places Nearby Search.
// Environment variables required (set in Vercel dashboard):
//   GOOGLE_PLACES_KEY — your Google Places API key

export default async function handler(req, res) {
  // CORS headers so the browser app can call this endpoint
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const { lat, lng, radius = 5000, pagetoken = "", limit = "20" } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({ error: "lat and lng query params are required" });
  }

  const key = process.env.GOOGLE_PLACES_KEY;
  if (!key) {
    return res.status(500).json({ error: "Google Places API key not configured on server" });
  }

  try {
    const url = new URL("https://maps.googleapis.com/maps/api/place/nearbysearch/json");
    if (pagetoken) {
      // When a pagetoken is provided, only key + pagetoken are needed
      url.searchParams.set("pagetoken", pagetoken);
    } else {
      url.searchParams.set("location", `${lat},${lng}`);
      url.searchParams.set("radius", String(radius));
      url.searchParams.set("type", "restaurant");
    }
    url.searchParams.set("key", key);

    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.status === "REQUEST_DENIED") {
      return res.status(403).json({ error: data.error_message || "Google API key invalid or Places API not enabled" });
    }

    if (data.status === "ZERO_RESULTS" || !data.results?.length) {
      return res.status(200).json({ results: [] });
    }

    // Shape the results — only send what the app needs, no raw key exposure
    const results = data.results.slice(0, parseInt(limit)).map(place => ({
      id: place.place_id,
      name: place.name,
      vicinity: place.vicinity || "",
      rating: place.rating || null,
      priceLevel: place.price_level || null,
      types: place.types || [],
      photoRef: place.photos?.[0]?.photo_reference || null,
    }));

    return res.status(200).json({
      results,
      nextPageToken: data.next_page_token || null,
    });
  } catch (err) {
    console.error("Places API error:", err);
    return res.status(500).json({ error: "Failed to fetch restaurants" });
  }
}
