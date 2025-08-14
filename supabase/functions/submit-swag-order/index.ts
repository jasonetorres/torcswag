interface SwagOrderData {
  name: string;
  email: string;
  address: string;
  city: string;
  stateProvince: string;
  zipCode: string;
  country: string;
  tshirtSize: string;
  hoodieSize: string;
  isEmployee: boolean;
  manager: string;
  firstChoice: string;
  secondChoice: string;
  submittedAt?: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

Deno.serve(async (req: Request) => {
  try {
    console.log("Function called - Method:", req.method, "URL:", req.url);
    
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
      console.log("Handling CORS preflight");
      return new Response(null, {
        status: 200,
        headers: corsHeaders,
      });
    }

    if (req.method !== "POST") {
      console.log("Method not allowed:", req.method);
      return new Response(
        JSON.stringify({ success: false, error: "Method not allowed" }),
        {
          status: 405,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("TORC Swag Order Function Started");
    
    // Parse form data
    let formData: SwagOrderData;
    try {
      formData = await req.json();
      console.log("Parsed form data:", JSON.stringify(formData, null, 2));
    } catch (parseError) {
      console.error("Error parsing request body:", parseError);
      return new Response(
        JSON.stringify({ success: false, error: "Invalid JSON in request body" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Add timestamp
    formData.submittedAt = new Date().toISOString();

    // Get Google Sheets URL
    const GOOGLE_SHEETS_URL = "https://script.google.com/macros/s/AKfycbzY0TGrg-mwgelTyEUtNejiVW0dUwQ0J8TIYGQahvTRkGr3_QQEEk9q6aL2TqfgahU1/exec";

    console.log("Google Sheets URL:", GOOGLE_SHEETS_URL ? "SET" : "NOT SET");

    let sheetsSuccess = false;

    // Send to Google Sheets
    try {
      console.log("Attempting Google Sheets submission");
      await sendToGoogleSheets(formData, GOOGLE_SHEETS_URL);
      sheetsSuccess = true;
      console.log("Google Sheets submission successful");
    } catch (sheetsError) {
      console.error("Google Sheets submission failed:", sheetsError);
    }

    // Return success if sheets worked
    if (sheetsSuccess) {
      console.log("Function completed successfully");
      return new Response(
        JSON.stringify({
          success: true,
          message: "Order submitted successfully",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } else {
      console.log("Function failed - no successful submissions");
      return new Response(
        JSON.stringify({ success: false, error: "Failed to submit to Google Sheets" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  } catch (err) {
    console.error("Unexpected error in main function");
    console.error("Error details:", err);
    return new Response(
      JSON.stringify({ success: false, error: "Unexpected error: " + (err as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

async function sendToGoogleSheets(data: SwagOrderData, sheetsUrl?: string) {
  if (!sheetsUrl) {
    throw new Error("Google Sheets webhook URL not configured");
  }

  try {
    const response = await fetch(sheetsUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    console.log("Google Sheets response status:", response.status);

    const responseText = await response.text();
    console.log("Google Sheets response body:", responseText);

    if (!response.ok) {
      throw new Error(`Google Sheets API error: ${response.status} ${response.statusText} - ${responseText}`);
    }

    console.log("Google Sheets submission completed successfully");
    return responseText;
  } catch (fetchError) {
    console.error("Fetch error to Google Sheets:", fetchError);
    throw fetchError;
  }
}