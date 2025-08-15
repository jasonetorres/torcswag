import type { VercelRequest, VercelResponse } from '@vercel/node';

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
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers for all responses
  for (const key in corsHeaders) {
    res.setHeader(key, corsHeaders[key as keyof typeof corsHeaders]);
  }

  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ success: false, error: "Method Not Allowed" });
  }

  try {
    const formData: SwagOrderData = req.body;
    formData.submittedAt = new Date().toISOString();

    // Use the hardcoded URL since environment variables may not be available in development
    const GOOGLE_SHEETS_URL = process.env.GOOGLE_SHEETS_URL || 'https://script.google.com/macros/s/AKfycbzY0TGrg-mwgelTyEUtNejiVW0dUwQ0J8TIYGQahvTRkGr3_QQEEk9q6aL2TqfgahU1/exec';

    await sendToGoogleSheets(formData, GOOGLE_SHEETS_URL);

    return res.status(200).json({ success: true, message: 'Order submitted successfully' });

  } catch (error) {
    console.error('Error in swag order function:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
    return res.status(500).json({ success: false, error: errorMessage });
  }
}

async function sendToGoogleSheets(data: SwagOrderData, sheetsUrl: string) {
  try {
    // Google Apps Script expects form data, not JSON
    const formData = new URLSearchParams();
    
    // Convert all data to form fields
    Object.entries(data).forEach(([key, value]) => {
      formData.append(key, String(value));
    });

    const response = await fetch(sheetsUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Google Sheets API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    // Google Apps Script may return HTML instead of JSON, so handle both
    const responseText = await response.text();
    try {
      return JSON.parse(responseText);
    } catch {
      // If it's not JSON, return the text response
      return { message: responseText };
    }
  } catch (error) {
    console.error('Error sending to Google Sheets:', error);
    throw error;
  }
}