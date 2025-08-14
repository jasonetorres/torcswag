const sdk = require('node-appwrite');

module.exports = async ({ req, res, log, error }) => {
  // Set CORS headers for all responses
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400'
  };

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    log('Handling OPTIONS request');
    return res.empty(200, corsHeaders);
  }

  // Add Content-Type for JSON responses
  corsHeaders['Content-Type'] = 'application/json';

  try {
    log('=== TORC Swag Order Function Started ===');
    log('Request method:', req.method);
    log('Request headers:', JSON.stringify(req.headers, null, 2));
    log('Raw request body:', req.body);

    // Parse form data
    let formData;
    try {
      formData = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      log('Parsed form data:', JSON.stringify(formData, null, 2));
    } catch (parseError) {
      error('Error parsing request body:', parseError);
      return res.json(
        { success: false, error: 'Invalid JSON in request body' },
        400,
        corsHeaders
      );
    }
    
    // Add timestamp
    formData.submittedAt = new Date().toISOString();
    log('Form data with timestamp added');

    // Check environment variables
    const GOOGLE_SHEETS_URL = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    const NOTIFICATION_EMAILS = process.env.NOTIFICATION_EMAILS;
    
    log('Environment check:');
    log('- Google Sheets URL:', GOOGLE_SHEETS_URL ? 'SET' : 'NOT SET');
    log('- Resend API Key:', RESEND_API_KEY ? 'SET' : 'NOT SET');
    log('- Notification Emails:', NOTIFICATION_EMAILS ? 'SET' : 'NOT SET');

    let sheetsSuccess = false;
    let emailSuccess = false;

    // Send to Google Sheets
    try {
      log('=== Attempting Google Sheets submission ===');
      await sendToGoogleSheets(formData, log, error);
      sheetsSuccess = true;
      log('✅ Google Sheets submission successful');
    } catch (sheetsError) {
      error('❌ Google Sheets submission failed:', sheetsError);
    }
    
    // Send email notifications
    try {
      log('=== Attempting email notifications ===');
      await sendEmailNotifications(formData, log, error);
      emailSuccess = true;
      log('✅ Email notifications successful');
    } catch (emailError) {
      error('❌ Email notifications failed:', emailError);
    }

    // Return success if at least one method worked
    if (sheetsSuccess || emailSuccess) {
      log('=== Function completed successfully ===');
      return res.json(
        { 
          success: true, 
          message: 'Order submitted successfully',
          details: {
            sheets: sheetsSuccess,
            email: emailSuccess
          }
        },
        200,
        corsHeaders
      );
    } else {
      log('=== Function failed - no successful submissions ===');
      return res.json(
        { success: false, error: 'Failed to submit to any service' },
        500,
        corsHeaders
      );
    }

  } catch (err) {
    error('=== Unexpected error in main function ===');
    error('Error details:', err);
    error('Error stack:', err.stack);
    return res.json(
      { success: false, error: 'Unexpected error: ' + err.message },
      500,
      corsHeaders
    );
  }
};

async function sendToGoogleSheets(data, log, error) {
  const GOOGLE_SHEETS_URL = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
  
  if (!GOOGLE_SHEETS_URL) {
    throw new Error('Google Sheets webhook URL not configured');
  }

  log('Sending to Google Sheets URL:', GOOGLE_SHEETS_URL);
  log('Data being sent:', JSON.stringify(data, null, 2));

  try {
    const response = await fetch(GOOGLE_SHEETS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    log('Google Sheets response status:', response.status);
    log('Google Sheets response headers:', JSON.stringify([...response.headers.entries()]));
    
    const responseText = await response.text();
    log('Google Sheets response body:', responseText);
    
    if (!response.ok) {
      throw new Error(`Google Sheets API error: ${response.status} ${response.statusText} - ${responseText}`);
    }

    log('Google Sheets submission completed successfully');
    return responseText;

  } catch (fetchError) {
    error('Fetch error to Google Sheets:', fetchError);
    throw fetchError;
  }
}

async function sendEmailNotifications(data, log, error) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const NOTIFICATION_EMAILS = process.env.NOTIFICATION_EMAILS;
  
  if (!RESEND_API_KEY) {
    log('Resend API key not configured, skipping email notifications');
    return;
  }
  
  if (!NOTIFICATION_EMAILS) {
    log('Notification emails not configured, skipping email notifications');
    return;
  }

  const emailList = NOTIFICATION_EMAILS.split(',').map(email => email.trim());
  log('Sending emails to:', emailList);
  
  const emailContent = `
    <h2>New TORC Swag Order Submitted</h2>
    <p><strong>Submitted:</strong> ${new Date(data.submittedAt).toLocaleString()}</p>
    
    <h3>Personal Information</h3>
    <p><strong>Name:</strong> ${data.name}</p>
    <p><strong>Email:</strong> ${data.email}</p>
    
    <h3>Shipping Address</h3>
    <p><strong>Address:</strong> ${data.address}</p>
    <p><strong>State/Province:</strong> ${data.stateProvince}</p>
    <p><strong>Country:</strong> ${data.country}</p>
    
    <h3>Sizing</h3>
    <p><strong>T-Shirt Size:</strong> ${data.tshirtSize}</p>
    <p><strong>Hoodie Size:</strong> ${data.hoodieSize}</p>
    
    <h3>Employment</h3>
    <p><strong>TORC Employee:</strong> ${data.isEmployee ? 'Yes' : 'No'}</p>
    ${data.isEmployee ? `<p><strong>Manager:</strong> ${data.manager}</p>` : ''}
    
    <h3>Merchandise Preferences</h3>
    <p><strong>First Choice:</strong> ${data.firstChoice}</p>
    <p><strong>Second Choice:</strong> ${data.secondChoice}</p>
  `;

  const emailPayload = {
    from: 'TORC Swag Store <noreply@resend.dev>',
    to: emailList,
    subject: `New Swag Order from ${data.name}`,
    html: emailContent,
  };

  log('Email payload:', JSON.stringify(emailPayload, null, 2));

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailPayload),
    });

    log('Resend response status:', response.status);
    
    const responseText = await response.text();
    log('Resend response body:', responseText);

    if (!response.ok) {
      throw new Error(`Resend API error: ${response.status} ${response.statusText} - ${responseText}`);
    }

    log('Email notifications sent successfully');
    return responseText;

  } catch (fetchError) {
    error('Fetch error to Resend:', fetchError);
    throw fetchError;
  }
}