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
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 200,
        headers: corsHeaders,
      });
    }

    if (req.method !== "POST") {
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
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const NOTIFICATION_EMAILS = Deno.env.get("NOTIFICATION_EMAILS");

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
      console.error("❌ Email notifications failed:", emailError);
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
  if (!apiKey) {
    console.log("Resend API key not configured, skipping email notifications");
    return;
  }

  if (!emails) {
    console.log("Notification emails not configured, skipping email notifications");
    return;
  }

  const emailList = emails.split(",").map((email) => email.trim());
  console.log("Sending emails to:", emailList);

  const emailContent = `
    <h2>New TORC Swag Order Submitted</h2>
    <p><strong>Submitted:</strong> ${new Date(data.submittedAt!).toLocaleString()}</p>
    
    <h3>Personal Information</h3>
    <p><strong>Name:</strong> ${data.name}</p>
    <p><strong>Email:</strong> ${data.email}</p>
    
    <h3>Shipping Address</h3>
    <p><strong>Address:</strong> ${data.address}</p>
    <p><strong>City:</strong> ${data.city}</p>
    <p><strong>State/Province:</strong> ${data.stateProvince}</p>
    <p><strong>Zip Code:</strong> ${data.zipCode}</p>
    <p><strong>Country:</strong> ${data.country}</p>
    
    <h3>Sizing</h3>
    <p><strong>T-Shirt Size:</strong> ${data.tshirtSize}</p>
    <p><strong>Hoodie Size:</strong> ${data.hoodieSize}</p>
    
    <h3>Employment</h3>
    <p><strong>TORC Employee:</strong> ${data.isEmployee ? "Yes" : "No"}</p>
    ${data.isEmployee ? `<p><strong>Manager:</strong> ${data.manager}</p>` : ""}
    
    <h3>Merchandise Preferences</h3>
    <p><strong>First Choice:</strong> ${data.firstChoice}</p>
    <p><strong>Second Choice:</strong> ${data.secondChoice}</p>
  `;

  const emailPayload = {
    from: "TORC Swag Store <noreply@resend.dev>",
    to: emailList,
    subject: `New Swag Order from ${data.name}`,
    html: emailContent,
  };

  console.log("Email payload:", JSON.stringify(emailPayload, null, 2));

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailPayload),
    });

    console.log("Resend response status:", response.status);

    const responseText = await response.text();
    console.log("Resend response body:", responseText);

    if (!response.ok) {
      throw new Error(`Resend API error: ${response.status} ${response.statusText} - ${responseText}`);
    }

    console.log("Email notifications sent successfully");
    return responseText;
  } catch (fetchError) {
    console.error("Fetch error to Resend:", fetchError);
    throw fetchError;
  }
}