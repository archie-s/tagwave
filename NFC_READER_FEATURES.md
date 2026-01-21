# NFC Reader & Attendee Assignment Features

## Overview

The Tag Management page now includes advanced NFC reader capabilities and attendee assignment features, enabling efficient event check-in and tracking.

## Features

### 1. **NFC Reader Integration**

- **Web NFC API Support**: Uses the Web NFC standard (compatible with Chrome 62+, Android devices)
- **Real-time Tag Detection**: Automatically detects NFC tags when the reader is active
- **Status Indicator**: Visual indicator showing when the reader is active and waiting for tags
- **Scan History**: Displays a history of recently scanned tags with timestamps

#### How to Use:
1. Enable the NFC Reader toggle in the "NFC Reader & Attendance Tracking" section
2. Hold an NFC tag near the device
3. The tag details will appear automatically
4. Assign attendee information or skip to continue scanning

### 2. **Single Tag Attendee Assignment**

- **Quick Assign**: Click the 👤 icon in the actions column to assign an attendee to any tag
- **NFC Scanner Integration**: When using the NFC reader, scanned tags open an immediate assignment dialog
- **Flexible Input**: Name is required; email and phone are optional
- **Visual Feedback**: Tags with assigned attendees are highlighted in green

#### Assignment Modal Fields:
- **Attendee Name** (required): Full name of the attendee
- **Email** (optional): Attendee's email address
- **Phone** (optional): Attendee's phone number

### 3. **Bulk Attendee Assignment**

- **Excel/CSV Import**: Upload a spreadsheet with multiple attendee assignments
- **Template Download**: Download a CSV template to use as a starting point
- **Batch Processing**: Assign up to hundreds of attendees in one operation
- **Error Handling**: Detailed feedback on failed assignments with row numbers and reasons

#### Supported File Formats:
- **CSV** (.csv): Comma-separated values
- **Excel** (.xlsx, .xls): Microsoft Excel format

#### Required CSV/Excel Columns:
- **Tag ID**: Unique identifier for the NFC tag (e.g., TAG-001)
- **Name**: Attendee's full name

#### Optional Columns:
- **Email**: Attendee's email address
- **Phone**: Attendee's phone number

#### CSV Template Example:
```
Tag ID,Name,Email,Phone
TAG-001,John Doe,john@example.com,555-0001
TAG-002,Jane Smith,jane@example.com,555-0002
TAG-003,Bob Johnson,bob@example.com,555-0003
```

### 4. **Enhanced Tag Management Table**

- **Assigned To Column**: Shows attendee name and email for easy reference
- **Visual Highlighting**: Rows with assigned attendees are highlighted
- **Multiple Action Buttons**:
  - 👤 Assign Attendee
  - ✏️ Edit Tag Details
  - ⏸️/▶️ Toggle Active Status
  - 🗑️ Delete Tag

### 5. **Backend API Endpoints**

#### Assign Single Attendee
```
PUT /api/tags/:id/assign-attendee
Body: {
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "555-0001"
}
```

#### Bulk Assign Attendees
```
POST /api/tags/bulk-assign
Body: {
  "assignments": [
    {
      "tagId": "TAG-001",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "555-0001"
    },
    ...
  ],
  "groupId": "bulk-1234567890"
}
```

#### Get Tags by Group
```
GET /api/tags/group/:groupId
```

## Data Model Updates

### NFCTag Schema Changes
Added new fields to the NFCTag model:
```javascript
assignedTo: {
  name: String,
  email: String,
  phone: String
}
bulkReadGroup: String  // For tracking bulk import batches
```

## Browser Compatibility

### NFC Reader Features:
- **Chrome/Edge**: Version 62+ on Android devices
- **Firefox**: Limited support (experimental)
- **Safari**: Not supported (iOS doesn't allow Web NFC)

### Excel Parsing:
- Requires SheetJS library for .xlsx/.xls files, or
- CSV files work without additional dependencies

## Error Handling

- Invalid file format: User-friendly error message displayed
- Missing required columns: Detailed validation errors with row numbers
- Duplicate tag IDs: System validates and reports failures
- Failed bulk operations: Summary shows successful vs failed assignments

## Performance Considerations

- **Bulk Upload**: Handles 100-1000+ records efficiently
- **NFC Scanning**: Real-time processing with minimal latency
- **Database Indexing**: Tags are indexed for fast lookups
- **Batch Operations**: Concurrent processing for bulk assignments

## Security

- All endpoints require authentication (except public scan endpoint)
- Staff/Admin authorization required for assignments
- No sensitive data exposed in responses
- CSRF protection on form submissions

## Future Enhancements

Potential improvements:
- QR Code scanning as alternative to NFC
- Integration with calendar/event systems
- Automated email notifications to attendees
- Analytics dashboard for scan tracking
- Export attendance reports to PDF/Excel
- Real-time attendance counter
