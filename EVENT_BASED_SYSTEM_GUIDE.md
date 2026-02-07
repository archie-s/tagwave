# Event-Based Tag Management System

## Overview
The Tag Management system has been restructured to be event-centric. Instead of managing tags directly, you now:
1. **Create an Event** first (conference, workshop, campaign, etc.)
2. **Add Tags to that Event** (individually or via bulk upload)
3. **Manage attendees** by assigning them to event tags

## Key Features

### Event Management
- **Create Events**: Set up events with details like name, date, location, organizer info, expected attendees
- **Event Types**: Conference, Workshop, Seminar, Exhibition, Festival, Campaign, Other
- **Event Status**: Upcoming, Ongoing, Completed, Cancelled
- **Event Statistics**: View total tags, scans, and assigned tags per event

### Bulk Tag Creation
- **CSV/Excel Upload**: Upload a file to create multiple tags at once for an event
- **Required Columns**: Tag ID, Name, Destination URL
- **Optional Columns**: Description, Location
- **Download Template**: Get a pre-formatted CSV template with example data

### Tag Management within Events
- Create individual tags manually
- Bulk create tags via CSV/Excel upload
- Edit tag details (name, URL, location, etc.)
- Activate/deactivate tags
- Assign attendees to tags
- Use NFC reader for real-time attendee check-in

## How to Use

### Step 1: Create an Event
1. Navigate to Tag Management (Admin or Staff only)
2. Click **"+ Create New Event"**
3. Fill in event details:
   - Event Name (required)
   - Event Date (required)
   - Event Type
   - Location
   - Expected Attendees
   - Organizer Information (optional)
4. Click **"Create Event"**

### Step 2: Add Tags to Your Event

#### Option A: Bulk Upload (Recommended for multiple tags)
1. Click on your event card to view event details
2. In the **"Bulk Tag Upload"** section, click **"📥 Download CSV Template"**
3. Open the template in Excel or any spreadsheet software
4. Fill in your tag data:
   ```
   Tag ID,Name,Description,Destination URL,Location
   CONF-001,VIP Badge,VIP attendee badge,https://example.com/vip,VIP Entrance
   CONF-002,Speaker Badge,Speaker access,https://example.com/speaker,Speaker Room
   ```
5. Save as CSV
6. Upload the file by clicking the upload area
7. Review the preview and click **"Confirm & Create Tags"**

#### Option B: Create Individual Tags
1. Click on your event card to view event details
2. Click **"+ Add Tag"**
3. Fill in tag details:
   - Tag ID (unique identifier)
   - Name
   - Destination URL (where users go when they scan)
   - Description (optional)
   - Location (optional)
4. Click **"Create Tag"**

### Step 3: Assign Attendees to Tags

#### Option A: Manual Assignment
1. In the event detail view, find the tag in the table
2. Click the 👤 icon next to the tag
3. Enter attendee details (name, email, phone)
4. Click **"Assign Attendee"**

#### Option B: NFC Reader (Real-time Check-in)
1. Enable the NFC Reader toggle switch
2. Scan an NFC tag with your device
3. Enter attendee details in the popup
4. Click **"Assign Attendee"**

## Database Structure

### New Models

#### Event Model
```javascript
{
  name: String,
  description: String,
  eventDate: Date,
  location: String,
  eventType: Enum,  // conference, workshop, seminar, etc.
  organizerName: String,
  organizerEmail: String,
  organizerPhone: String,
  expectedAttendees: Number,
  status: Enum,  // upcoming, ongoing, completed, cancelled
  tagCount: Number,  // Auto-calculated
  totalScans: Number,  // Auto-calculated
  createdBy: User reference
}
```

#### Updated NFCTag Model
- Now includes `event: Event reference` field
- Tags can be created independently or associated with an event
- Bulk creation automatically associates tags with the specified event

## API Endpoints

### Event Endpoints
- `GET /api/events` - Get all events (with filters)
- `GET /api/events/:id` - Get single event
- `POST /api/events` - Create event (Staff/Admin)
- `PUT /api/events/:id` - Update event (Staff/Admin)
- `DELETE /api/events/:id` - Delete event (Admin only)
- `GET /api/events/:id/tags` - Get all tags for an event
- `POST /api/events/:id/tags/bulk` - Bulk create tags for an event (Staff/Admin)
- `GET /api/events/:id/stats` - Get event statistics

### Existing Tag Endpoints
All existing tag endpoints remain functional:
- Individual tag CRUD operations
- Tag scanning
- Attendee assignment

## Sample Data
The seed file creates 3 sample events with tags:

1. **Tech Conference 2026** (3 tags)
   - TECH-001: VIP Registration
   - TECH-002: General Registration
   - TECH-003: Keynote Hall Access

2. **Product Launch Event** (3 tags)
   - PROD-001: Product Demo Station 1
   - PROD-002: Product Demo Station 2
   - PROD-003: Feedback Collection

3. **Summer Workshop Series** (2 tags)
   - WORK-001: Workshop Room A
   - WORK-002: Workshop Room B

## CSV Template Format

### For Bulk Tag Creation:
```csv
Tag ID,Name,Description,Destination URL,Location
TAG-001,Product Demo,Main product demo tag,https://example.com/demo,Store Front
TAG-002,Special Offer,Summer promotion,https://example.com/promo,Window Display
TAG-003,Event Info,Event information,https://example.com/event,Reception Desk
```

**Important Notes:**
- Tag ID must be unique
- Destination URL must be valid
- Description and Location are optional

## Testing the System

1. **Log in as Admin**: admin@tagwave.com / password123
2. **Navigate to Tag Management** (should now show Events view)
3. **View existing events** or create a new one
4. **Click on an event** to see its tags
5. **Try bulk upload** using the CSV template
6. **Assign attendees** to tags

## Backward Compatibility
- Tags without an event association will still work
- Existing tag management features remain functional
- Old tags can be associated with events later if needed

## Benefits of Event-Based System
✅ **Better Organization**: Group tags by event/campaign  
✅ **Bulk Operations**: Create multiple tags at once  
✅ **Event Analytics**: Track performance per event  
✅ **Scalability**: Manage hundreds of tags across multiple events  
✅ **Clear Context**: Know which tags belong to which event  
✅ **Easy Cleanup**: Delete entire events when done
