export async function GET() {
  try {
    const response = await fetch(
      "https://www.dota2.com/datafeed/herolist?language=english",
      {
        headers: {
          "Accept": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch heroes");
    }

    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    console.error("Error fetching heroes:", error);
    return Response.json(
      { error: "Failed to fetch heroes" },
      { status: 500 }
    );
  }
}

