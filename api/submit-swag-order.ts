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

    const GOOGLE_SHEETS_URL = process.env.GOOGLE_SHEETS_URL;

    if (!GOOGLE_SHEETS_URL) {
      console.error("Google Sheets URL not configured");
      return res.status(500).json({ success: false, error: 'Server configuration error.' });
    }
    
    await sendToGoogleSheets(formData, GOOGLE_SHEETS_URL);

    return res.status(200).json({ success: true, message: 'Order submitted successfully' });

  } catch (error) {
    console.error('Error in swag order function:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
    return res.status(500).json({ success: false, error: errorMessage });
  }
}

async function sendToGoogleSheets(data: SwagOrderData, sheetsUrl: string) {
  const response = await fetch(sheetsUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google Sheets API error: ${response.status} ${response.statusText} - ${errorText}`);
  }
}