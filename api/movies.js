// api/movies.js
// Vercel serverless function — proxies TMDB Discover Movie requests.
// Environment variables required (set in Vercel dashboard):
//   TMDB_KEY — your TMDB API key (free at themoviedb.org/settings/api)

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const key = process.env.TMDB_KEY;
  if (!key) {
    return res.status(500).json({ error: "TMDB API key not configured on server" });
  }

  // Accept filter params from the client
  const {
    ratings = "",       // pipe-separated: "G|PG|PG-13"
    providers = "",     // pipe-separated provider IDs: "8|15|337"
    page = "1",
  } = req.query;

  try {
    const params = new URLSearchParams({
      api_key: key,
      language: "en-US",
      sort_by: "popularity.desc",
      page,
      certification_country: "US",
    });

    if (ratings) params.set("certification", ratings);
    if (providers) {
      params.set("with_watch_providers", providers);
      params.set("watch_region", "US");
    }

    const response = await fetch(
      `https://api.themoviedb.org/3/discover/movie?${params}`
    );
    const data = await response.json();

    if (data.status_code) {
      return res.status(400).json({ error: data.status_message || "TMDB error" });
    }

    if (!data.results?.length) {
      return res.status(200).json({ results: [] });
    }

    // Shape results — only send what the app needs
    const results = data.results.slice(0, 12).map(m => ({
      id: `tmdb_${m.id}`,
      name: m.title,
      year: m.release_date?.slice(0, 4) || null,
      rating: m.vote_average ? Math.round(m.vote_average * 10) / 10 : null,
      posterPath: m.poster_path || null,
      overview: m.overview || "",
    }));

    return res.status(200).json({ results });
  } catch (err) {
    console.error("TMDB API error:", err);
    return res.status(500).json({ error: "Failed to fetch movies" });
  }
}
