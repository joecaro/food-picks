import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const apiKey = process.env.PLACES_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "API key for Google Places not configured." },
      { status: 500 }
    );
  }

  const { query } = await request.json();
  let latitude: number | undefined;
  let longitude: number | undefined;

  try {
    latitude = parseFloat(process.env.LATITUDE || "0");
    longitude = parseFloat(process.env.LONGITUDE || "0");

    if (typeof latitude !== "number" || typeof longitude !== "number") {
      throw new Error("Latitude and longitude must be numbers.");
    }
  } catch (error) {
    console.error("Error parsing request body:", error);
    return NextResponse.json(
      { error: "Invalid request body. Latitude and longitude are required." },
      { status: 400 }
    );
  }

  const placesApiUrl = "https://places.googleapis.com/v1/places:searchText";
  const fieldMask =
    "places.displayName,places.id,places.formattedAddress,places.googleMapsUri,places.primaryTypeDisplayName,places.types,places.reviews"; // Added more fields

  try {
    const response = await fetch(placesApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": fieldMask,
      },
      body: JSON.stringify({
        maxResultCount: 10,
        textQuery: query,
        locationBias: {
          circle: {
            center: {
              latitude: latitude,
              longitude: longitude,
            },
            radius: 100,
          },
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Google Places API Error:", errorData);
      return NextResponse.json(
        {
          error: "Failed to fetch data from Google Places API.",
          details: errorData,
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error calling Google Places API:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
