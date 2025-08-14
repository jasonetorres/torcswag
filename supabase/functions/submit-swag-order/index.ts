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
    console.log("🚀 FUNCTION CALLED - Method:", req.method, "URL:", req.url);
    console.log("🚀 Headers:", Object.fromEntries(req.headers.entries()));
    
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
      console.log("✅ Handling CORS preflight");
      return new Response(null, {
        status: 200,
        headers: corsHeaders,
      });
    }

    if (req.method !== "POST") {
      console.log("❌ Method not allowed:", req.method);
      return new Response(
        JSON.stringify({ success: false, error: "Method not allowed" }),
        {
          status: 405,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("=== TORC Swag Order Function Started ===");
    
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

    // Get environment variables
    const GOOGLE_SHEETS_URL = "https://script.google.com/macros/s/AKfycbzY0TGrg-mwgelTyEUtNejiVW0dUwQ0J8TIYGQahvTRkGr3_QQEEk9q6aL2TqfgahU1/exec";
    const RESEND_API_KEY = "re_iZF1qCWN_9fsQRXpjDGn3kbPsvcA5dmcY";
    const NOTIFICATION_EMAILS = "jasontorres585@icloud.com";

    console.log("Environment check:");
    console.log("- Google Sheets URL:", GOOGLE_SHEETS_URL ? "SET" : "NOT SET");
    console.log("- Resend API Key:", RESEND_API_KEY ? "SET" : "NOT SET");
    console.log("- Notification Emails:", NOTIFICATION_EMAILS ? "SET" : "NOT SET");

    let sheetsSuccess = false;
    let emailSuccess = false;

    // Send to Google Sheets
    try {
      console.log("=== Attempting Google Sheets submission ===");
      await sendToGoogleSheets(formData, GOOGLE_SHEETS_URL);
      sheetsSuccess = true;
      console.log("✅ Google Sheets submission successful");
    } catch (sheetsError) {
      console.error("❌ Google Sheets submission failed:", sheetsError);
    }

    // Send email notifications
    try {
      console.log("=== Attempting email notifications ===");
      await sendEmailNotifications(formData, RESEND_API_KEY, NOTIFICATION_EMAILS);
      emailSuccess = true;
      console.log("✅ Email notifications successful");
    } catch (emailError) {
      console.error("❌ Email notifications failed:");
      console.error("Error message:", emailError.message);
      console.error("Full error:", emailError);
      console.error("Stack trace:", emailError.stack);
    }

    // Return success if at least one method worked
    if (sheetsSuccess || emailSuccess) {
      console.log("=== Function completed successfully ===");
      return new Response(
        JSON.stringify({
          success: true,
          message: "Order submitted successfully",
          details: {
            sheets: sheetsSuccess,
            email: emailSuccess,
          },
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } else {
      console.log("=== Function failed - no successful submissions ===");
      return new Response(
        JSON.stringify({ success: false, error: "Failed to submit to any service" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  } catch (err) {
    console.error("=== Unexpected error in main function ===");
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

  console.log("Sending to Google Sheets URL:", sheetsUrl);
  console.log("Data being sent:", JSON.stringify(data, null, 2));

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

async function sendEmailNotifications(data: SwagOrderData, apiKey?: string, emails?: string) {
  console.log("=== EMAIL FUNCTION START ===");
  console.log("API Key provided:", !!apiKey);
  console.log("Emails provided:", !!emails);
  
  if (!apiKey) {
    console.log("Resend API key not configured, skipping email notifications");
    return { skipped: true, reason: "No API key" };
  }

  if (!emails) {
    console.log("Notification emails not configured, skipping email notifications");
    return { skipped: true, reason: "No email addresses" };
  }

  const emailList = emails.split(",").map((email) => email.trim());
  console.log("Sending emails to:", emailList);

  const emailPayload = {
    from: "onboarding@resend.dev",
    to: emailList,
    subject: "New Swag Order from " + data.name,
    text: `Someone submitted a swag order!\n\nName: ${data.name}\nEmail: ${data.email}\nFirst Choice: ${data.firstChoice}\nSecond Choice: ${data.secondChoice}`
  };

  console.log("Email payload created:", JSON.stringify(emailPayload, null, 2));
  console.log("About to make fetch request to Resend...");

  const emailResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(emailPayload),
  });

  console.log("Fetch completed. Response status:", emailResponse.status);
  console.log("Response headers:", Object.fromEntries(emailResponse.headers.entries()));

  const emailResult = await emailResponse.text();
  console.log("Response body:", emailResult);

  if (!emailResponse.ok) {
    console.error("Email response not OK. Status:", emailResponse.status);
    console.error("Response body:", emailResult);
    throw new Error(`Resend API error: ${emailResponse.status} - ${emailResult}`);
  }

  console.log("Email sent successfully!");
  return JSON.parse(emailResult);

  return JSON.parse(result);
}