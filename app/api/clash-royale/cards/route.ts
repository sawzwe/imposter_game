import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.CLASH_ROYALE_API_KEY;

    if (!apiKey) {
      return Response.json(
        { error: "Clash Royale API key not configured" },
        { status: 500 }
      );
    }

    // Get query parameters for pagination/limiting
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit");
    const after = searchParams.get("after");
    const before = searchParams.get("before");

    // Build query string
    const queryParams = new URLSearchParams();
    if (limit) queryParams.append("limit", limit);
    if (after) queryParams.append("after", after);
    if (before) queryParams.append("before", before);

    const queryString = queryParams.toString();
    const url = `https://api.clashroyale.com/v1/cards${
      queryString ? `?${queryString}` : ""
    }`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      let errorMessage = `Clash Royale API error: ${response.status}`;

      // Try to get error details from response
      try {
        const errorData = await response.json();
        if (errorData.reason) {
          errorMessage += ` - ${errorData.reason}`;
        }
        if (errorData.message) {
          errorMessage += ` - ${errorData.message}`;
        }
      } catch (e) {
        // If JSON parsing fails, try text
        try {
          const errorText = await response.text();
          if (errorText) {
            errorMessage += ` - ${errorText}`;
          }
        } catch (e2) {
          // Ignore
        }
      }

      // Provide helpful message for 403
      if (response.status === 403) {
        errorMessage +=
          ". This usually means your IP address is not whitelisted. Go to developer.clashroyale.com → My Account → API Keys and add your server's IP address to 'Allowed IP Addresses'.";
      }

      console.error("Clash Royale API Error:", errorMessage);
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    console.error("Error fetching Clash Royale cards:", error);
    return Response.json(
      { error: "Failed to fetch Clash Royale cards" },
      { status: 500 }
    );
  }
}
