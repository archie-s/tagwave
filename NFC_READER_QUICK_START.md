# Quick Start: NFC Reader & Attendee Assignment

## Setup Instructions

### 1. Database Update (Optional but Recommended)

The NFCTag model has been updated to support attendee information. Existing tags will work fine with null values, but you may want to verify your MongoDB collections are ready.

```bash
# No migration script needed - the schema changes are backward compatible
# Existing tags will simply have empty assignedTo and bulkReadGroup fields
```

### 2. Frontend Dependencies

The main features work with existing dependencies. For optional Excel (.xlsx) support:

```bash
cd frontend
npm install xlsx  # Optional - for Excel parsing support
```

### 3. Start Your Application

```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend
cd frontend
npm start
```

## First-Time Use

### Enable NFC Reader

1. Navigate to **Tag Management** page
2. Look for "NFC Reader & Attendance Tracking" section
3. Click the toggle switch to enable NFC reading
4. You'll see: "NFC Reader Active - Hold a tag near the device..."

### Scan Your First Tag

**Requirements:**
- Android device with NFC capability
- Chrome/Edge browser (v62+)
- NFC enabled in device settings

**Steps:**
1. With NFC Reader enabled, hold an NFC tag near your device
2. The tag data will be detected automatically
3. A modal will pop up asking for attendee details
4. Enter the attendee's name (required), email (optional), phone (optional)
5. Click "Assign Attendee"
6. The tag now appears in your table with attendee info

### Import from Excel/CSV

**Create your file with these columns:**
```
Tag ID    | Name        | Email              | Phone
TAG-001   | John Doe    | john@example.com   | 555-0001
TAG-002   | Jane Smith  | jane@example.com   | 555-0002
TAG-003   | Bob Johnson | bob@example.com    | 555-0003
```

**Upload steps:**
1. Click the file upload area under "Bulk Attendee Assignment"
2. Select your CSV or Excel file
3. Review the preview (shows first 5 rows)
4. Click "Confirm & Assign"
5. Watch the progress bar
6. See success message when complete

### Download CSV Template

1. Scroll to "Bulk Attendee Assignment" section
2. Click "📥 Download CSV Template"
3. Opens as `attendees_template.csv`
4. Fill it with your data
5. Upload it back

## Common Tasks

### Assign Attendee to Existing Tag

1. Find the tag in the table
2. Click the 👤 icon in the Actions column
3. Fill in attendee details
4. Click "Assign Attendee"

### Edit Tag Details

1. Find the tag in the table
2. Click the ✏️ icon
3. Update tag information
4. Click "Update Tag"

### Change Tag Status

1. Find the tag in the table
2. Click ⏸️ (active) or ▶️ (inactive) icon
3. Tag status toggles immediately

### Delete a Tag

1. Find the tag in the table
2. Click 🗑️ icon
3. Confirm deletion
4. Tag is removed

## Troubleshooting

### "NFC is not supported on this device"

**Solution:** You need:
- Android device (iOS not supported)
- Chrome/Edge browser v62+
- Device NFC enabled in settings

### "Tag not found in the system"

**Solution:** 
- Create the tag first before scanning
- Make sure tag ID matches (case-sensitive)
- Verify tag ID format (typically TAG-001, TAG-002, etc.)

### "Unable to read NFC tag"

**Solution:**
- Check device NFC settings are enabled
- Hold tag closer to device
- Try a different tag
- Restart the browser

### CSV Upload Shows "Invalid Format"

**Solution:**
- Make sure first column is Tag ID
- Make sure second column is Name
- Remove any extra spaces in headers
- Use commas as separators (not semicolons)
- Save as .csv, not .xlsx

### Bulk Upload Shows Errors

**Solution:**
- Review error message for specific row
- Check that each row has Tag ID and Name
- Verify Tag IDs exist in the system
- See error details at bottom of confirmation

## Features at a Glance

| Feature | Location | How to Use |
|---------|----------|-----------|
| **NFC Reader** | Top of Tag Management | Toggle switch to enable/disable |
| **Quick Assign** | Action column in table | Click 👤 icon |
| **Bulk Import** | Middle section | Upload CSV/Excel file |
| **Download Template** | Bulk Import section | Click "📥 Download CSV Template" |
| **View Attendees** | "Assigned To" column | See assigned attendee info |
| **Edit Tag** | Action column | Click ✏️ icon |
| **Toggle Status** | Action column | Click ⏸️ or ▶️ |
| **Delete Tag** | Action column | Click 🗑️ icon |

## Tips & Best Practices

1. **Use Tag IDs Consistently**: Format like TAG-001, TAG-002 for easy recognition

2. **Test with CSV First**: CSV files don't require additional libraries and are easier to troubleshoot

3. **Prepare Bulk Data**: Create your attendee list in Excel, export as CSV, then upload

4. **Check NFC Compatibility**: Test on your Android device before an event

5. **Have Fallback**: Keep manual assignment option available in case NFC has issues

6. **Monitor Success**: Check the alerts for confirmation after bulk imports

7. **Group Imports**: Each bulk import gets a unique ID for tracking

## API Reference (For Developers)

### Assign Attendee to Tag
```bash
PUT /api/tags/:tagId/assign-attendee
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "555-0001"
}
```

### Bulk Assign Attendees
```bash
POST /api/tags/bulk-assign
Content-Type: application/json
Authorization: Bearer <token>

{
  "assignments": [
    {"tagId": "TAG-001", "name": "John Doe", "email": "john@example.com"},
    {"tagId": "TAG-002", "name": "Jane Smith", "email": "jane@example.com"}
  ],
  "groupId": "bulk-1234567890"
}
```

## Support Files

- **Documentation**: See `NFC_READER_FEATURES.md`
- **Implementation Details**: See `IMPLEMENTATION_SUMMARY.md`
- **This Guide**: `NFC_READER_QUICK_START.md`

## Version Info

- **Implementation Date**: January 21, 2026
- **Features**: NFC Reader (Web NFC API), CSV/Excel Import, Single & Bulk Assignment
- **Browser Support**: Chrome/Edge 62+, Firefox (experimental), Safari (not supported)
