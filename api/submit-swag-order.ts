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
  console.log('API handler called with method:', req.method);
  console.log('Request body:', req.body);

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
    
    // Validate required fields
    if (!formData.name || !formData.email) {
      console.error('Missing required fields:', { name: formData.name, email: formData.email });
      return res.status(400).json({ success: false, error: 'Missing required fields: name and email are required' });
    }
    
    formData.submittedAt = new Date().toISOString();
    console.log('Processing form data:', formData);

    // Use the hardcoded Google Sheets URL
    const GOOGLE_SHEETS_URL = 'https://script.google.com/macros/s/AKfycbzY0TGrg-mwgelTyEUtNejiVW0dUwQ0J8TIYGQahvTRkGr3_QQEEk9q6aL2TqfgahU1/exec';
    console.log('Using Google Sheets URL:', GOOGLE_SHEETS_URL);

    const result = await sendToGoogleSheets(formData, GOOGLE_SHEETS_URL);
    console.log('Google Sheets result:', result);

    return res.status(200).json({ success: true, message: 'Order submitted successfully' });

  } catch (error) {
    console.error('Error in swag order function:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
    console.error('Returning error response:', errorMessage);
    return res.status(500).json({ success: false, error: errorMessage });
  }
}

async function sendToGoogleSheets(data: SwagOrderData, sheetsUrl: string) {
  try {
    console.log('Sending to Google Sheets:', sheetsUrl);
    console.log('Data being sent:', JSON.stringify(data, null, 2));
    
    // Google Apps Script expects form data, not JSON
    const formData = new URLSearchParams();
    
    // Convert all data to form fields
    Object.entries(data).forEach(([key, value]) => {
      formData.append(key, String(value));
    });
    
    console.log('Form data string:', formData.toString());

    const response = await fetch(sheetsUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json, text/plain, */*',
      },
      body: formData.toString(),
      redirect: 'follow'
    });

    console.log('Google Sheets response status:', response.status);
    console.log('Google Sheets response ok:', response.ok);
    
    const responseText = await response.text();
    console.log('Google Sheets response text length:', responseText.length);
    console.log('Google Sheets response text (first 500 chars):', responseText.substring(0, 500));
    
    if (!response.ok) {
      console.error('Google Sheets error response:', responseText);
      throw new Error(`Google Sheets API error: ${response.status} ${response.statusText} - ${responseText.substring(0, 200)}`);
    }

    // Try to parse as JSON, but don't fail if it's not JSON
    try {
      const jsonResponse = JSON.parse(responseText);
      console.log('Parsed JSON response:', jsonResponse);
      return jsonResponse;
    } catch (parseError) {
      console.log('Response was not JSON, treating as success. Parse error:', parseError);
      // Google Apps Script often returns plain text "success" or HTML
      return { message: responseText, success: true };
    }
  } catch (error) {
    console.error('Error sending to Google Sheets:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }
    throw error;
  }
}