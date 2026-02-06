# 📊 Guest List Management with Excel/CSV

## Where Guest Data is Stored

Your guest lists are stored in **Supabase** in the `guests` table.

### Viewing Guest Data in Supabase:

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard/project/hrehaqqpxhlfpiszitos

2. **Open Table Editor**
   - Click **"Table Editor"** in the left sidebar
   - Find and click the **"guests"** table

3. **What You'll See:**
   ```
   Column Name              | Description
   ------------------------|------------------
   id                      | Unique guest ID
   event_id                | Which event this guest belongs to
   name                    | Guest name
   email                   | Email address
   phone                   | Phone number
   category                | VIP, Friends, or Family
   dietary_restrictions    | Special dietary needs
   special_requests        | Any special requests
   created_at              | When guest was added
   ```

## How to Import Guest Lists from Excel

### Method 1: Download Template

1. In your app, go to an event
2. Click **"Import Guests"**
3. Click **"Download Template"**
4. Open the downloaded `guest_list_template.xlsx`
5. Fill in your guest information:
   - **Name** (required)
   - **Email**
   - **Phone**
   - **Category** (VIP, Friends, or Family)
   - **Dietary Restrictions**
   - **Special Requests**

### Method 2: Use Your Own Excel File

Your Excel file should have these column headers:
```
Name | Email | Phone | Category | Dietary Restrictions | Special Requests
```

Example:
```
John Doe    | john@email.com  | +1234567890 | VIP      | Vegetarian | Window seat
Jane Smith  | jane@email.com  | +0987654321 | Friends  |            |
Bob Wilson  | bob@email.com   | +5551234567 | Family   | Gluten-free| Early check-in
```

### Import Steps:

1. Go to your event page
2. Click **"Import Guests"** button
3. Click **"Choose File"** and select your Excel or CSV file
4. Review the preview of guests
5. Click **"Import X Guests"** button
6. Done! ✅

## Supported File Formats

✅ **Excel Files**
- .xlsx (Excel 2007 and newer)
- .xls (Excel 97-2003)

✅ **CSV Files**
- .csv (Comma-separated values)

## Finding Your Guest Lists

### In the Application:
1. Log in as an Agent
2. Go to Dashboard
3. Click on an event
4. You'll see all guests for that event

### In Supabase Dashboard:
1. Go to **Table Editor** → **guests**
2. Filter by `event_id` to see guests for a specific event
3. You can:
   - View all guest data
   - Edit individual guests
   - Delete guests
   - Export to CSV
   - Run SQL queries

### Export Guests:
From Supabase Table Editor:
1. Select the **guests** table
2. Click the **"Export"** button (top right)
3. Choose format (CSV or JSON)
4. Download your guest list

## Guest Categories

The app supports three categories:

1. **VIP Guests** 👑
   - Close family and important people
   - Get premium perks and attention

2. **Friends** 🤝
   - Friends of the hosts
   - Standard event access

3. **Family** 👨‍👩‍👧‍👦
   - Extended family members
   - Family-specific arrangements

## Data Structure in Supabase

```sql
CREATE TABLE guests (
  id SERIAL PRIMARY KEY,
  event_id INTEGER REFERENCES events(id),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  category TEXT,  -- 'VIP', 'Friends', or 'Family'
  dietary_restrictions TEXT,
  special_requests TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## API Endpoints for Guests

- **GET** `/api/events/:eventId/guests` - Get all guests for an event
- **POST** `/api/events/:eventId/guests` - Add a new guest
- **PUT** `/api/events/:eventId/guests/:guestId` - Update a guest
- **DELETE** `/api/events/:eventId/guests/:guestId` - Delete a guest

## Tips for Excel Import

✅ **DO:**
- Use clear column headers (Name, Email, Phone, etc.)
- Keep one guest per row
- Use consistent category names (VIP, Friends, Family)
- Remove empty rows

❌ **DON'T:**
- Use merged cells
- Have duplicate column names
- Leave the Name column empty
- Use special characters in category names

## Bulk Operations

### Import Multiple Events:
Each Excel file should have guest lists for ONE event. To import for multiple events:
1. Create separate Excel files for each event
2. Import them one at a time to the correct event

### Update Existing Guests:
1. Export current guests from Supabase
2. Make changes in Excel
3. Delete old guests (optional)
4. Re-import the updated list

## Security & Privacy

✅ **Protected Data:**
- Only authenticated agents can view guests
- Guests data is filtered by event
- Email and phone are optional (not required)

✅ **Row Level Security:**
- Supabase RLS policies protect guest data
- Only authorized users can access

## Example Guest List Template

| Name | Email | Phone | Category | Dietary Restrictions | Special Requests |
|------|-------|-------|----------|---------------------|------------------|
| John Doe | john@example.com | +1234567890 | VIP | Vegetarian | Aisle seat |
| Jane Smith | jane@example.com | +0987654321 | Friends | None | None |
| Bob Wilson | bob@example.com | +5551234567 | Family | Gluten-free | Early check-in |

Save this as an Excel file and import! 🎉
