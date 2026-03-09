import type { APIRoute } from "astro";

export const prerender = false;

const PLACE_ID = "ChIJA0U7ts7j2ogRQ49M5TWpsz4";
const PLACES_API_URL = `https://places.googleapis.com/v1/places/${PLACE_ID}?languageCode=en`;
const FIELD_MASK = "displayName,rating,userRatingCount,reviews";
const CACHE_TTL_MS = 1000 * 60 * 60 * 12;

interface GoogleReviewText {
  text?: string;
}

interface GoogleAuthor {
  displayName?: string;
  uri?: string;
}

interface GoogleReview {
  rating?: number;
  publishTime?: string;
  text?: GoogleReviewText;
  authorAttribution?: GoogleAuthor;
  googleMapsUri?: string;
}

interface GooglePlaceDetailsResponse {
  displayName?: {
    text?: string;
  };
  rating?: number;
  userRatingCount?: number;
  reviews?: GoogleReview[];
}

interface PublicReview {
  author: string;
  authorUrl: string;
  reviewUrl: string;
  rating: number;
  text: string;
  publishTime: string | null;
}

const jsonHeaders = { "Content-Type": "application/json" };
const cachedJsonHeaders = {
  "Content-Type": "application/json",
  "Cache-Control": "public, max-age=0, s-maxage=43200, stale-while-revalidate=86400",
};

let reviewsCache: { expiresAt: number; payload: string } | null = null;

const parseDate = (value?: string): number => {
  if (!value) return 0;
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? 0 : timestamp;
};

export const GET: APIRoute = async () => {
  const apiKey = import.meta.env.GOOGLE_MAPS_API_KEY;
  const now = Date.now();

  if (reviewsCache && reviewsCache.expiresAt > now) {
    return new Response(reviewsCache.payload, {
      status: 200,
      headers: cachedJsonHeaders,
    });
  }

  if (!apiKey) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: "GOOGLE_MAPS_API_KEY is not configured on the server.",
      }),
      { status: 500, headers: jsonHeaders },
    );
  }

  try {
    const googleResponse = await fetch(PLACES_API_URL, {
      method: "GET",
      headers: {
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": FIELD_MASK,
      },
    });

    if (!googleResponse.ok) {
      const detail = await googleResponse.text();
      return new Response(
        JSON.stringify({
          ok: false,
          error: "Could not fetch Google reviews.",
          detail,
        }),
        { status: 502, headers: jsonHeaders },
      );
    }

    const payload = (await googleResponse.json()) as GooglePlaceDetailsResponse;

    const reviews: PublicReview[] = (payload.reviews ?? [])
      .filter((review) => typeof review.rating === "number" && typeof review.text?.text === "string" && review.text.text.trim().length > 0)
      .sort((a, b) => parseDate(b.publishTime) - parseDate(a.publishTime))
      .slice(0, 6)
      .map((review) => ({
        author: review.authorAttribution?.displayName?.trim() || "Google user",
        authorUrl: review.authorAttribution?.uri || "",
        reviewUrl: review.googleMapsUri || "",
        rating: review.rating ?? 0,
        text: review.text?.text?.trim() || "",
        publishTime: review.publishTime || null,
      }));

    const responsePayload = JSON.stringify({
      ok: true,
      placeId: PLACE_ID,
      placeName: payload.displayName?.text || "Google Business Profile",
      rating: typeof payload.rating === "number" ? payload.rating : null,
      userRatingCount: typeof payload.userRatingCount === "number" ? payload.userRatingCount : null,
      reviews,
    });

    reviewsCache = {
      expiresAt: now + CACHE_TTL_MS,
      payload: responsePayload,
    };

    return new Response(responsePayload, { status: 200, headers: cachedJsonHeaders });
  } catch {
    if (reviewsCache) {
      return new Response(reviewsCache.payload, {
        status: 200,
        headers: cachedJsonHeaders,
      });
    }

    return new Response(
      JSON.stringify({
        ok: false,
        error: "Unexpected error while fetching Google reviews.",
      }),
      { status: 500, headers: jsonHeaders },
    );
  }
};
