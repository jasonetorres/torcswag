function doPost(e) {
  try {
    // Parse the incoming JSON data
    const data = JSON.parse(e.postData.contents);
    
    // Get the active spreadsheet (make sure to create a Google Sheet first)
    const sheet = SpreadsheetApp.getActiveSheet();
    
    // If this is the first submission, add headers
    if (sheet.getLastRow() === 0) {
      const headers = [
        'Timestamp',
        'Name',
        'Email', 
        'Address',
        'State/Province',
        'Country',
        'T-Shirt Size',
        'Hoodie Size',
        'Is Employee',
        'Manager',
        'First Choice',
        'Second Choice'
      ];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      
      // Format headers
      const headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#4285f4');
      headerRange.setFontColor('white');
    }
    
    // Prepare the row data
    const rowData = [
      new Date(data.submittedAt),
      data.name,
      data.email,
      data.address,
      data.stateProvince,
      data.country,
      data.tshirtSize,
      data.hoodieSize,
      data.isEmployee ? 'Yes' : 'No',
      data.manager || '',
      data.firstChoice,
      data.secondChoice
    ];
    
    // Add the new row
    sheet.appendRow(rowData);
    
    // Auto-resize columns for better readability
    sheet.autoResizeColumns(1, rowData.length);
    
    // Return success response
    return ContentService
      .createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('Error processing form submission:', error);
    
    return ContentService
      .createTextOutput(JSON.stringify({ 
        success: false, 
        error: error.toString() 
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Optional: Function to set up the sheet with proper formatting
function setupSheet() {
  const sheet = SpreadsheetApp.getActiveSheet();
  
  // Set sheet name
  sheet.setName('TORC Swag Orders');
  
  // Freeze the header row
  sheet.setFrozenRows(1);
  
  // Set column widths for better display
  const columnWidths = [150, 200, 250, 300, 150, 150, 100, 100, 100, 200, 250, 250];
  columnWidths.forEach((width, index) => {
    sheet.setColumnWidth(index + 1, width);
  });
}