import * as XLSX from 'xlsx';
import Papa from 'papaparse';

export interface GuestRow {
  name: string;
  email?: string;
  phone?: string;
  category?: string; // VIP, Friends, Family
  dietaryRestrictions?: string;
  specialRequests?: string;
}

/**
 * Parse Excel file (.xlsx, .xls) to guest data
 */
export function parseExcelFile(file: File): Promise<GuestRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        
        // Get first sheet
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(sheet);
        
        // Map to GuestRow format
        const guests = jsonData.map((row: any) => ({
          name: row.Name || row.name || '',
          email: row.Email || row.email || '',
          phone: row.Phone || row.phone || '',
          category: row.Category || row.category || '',
          dietaryRestrictions: row['Dietary Restrictions'] || row.dietary || '',
          specialRequests: row['Special Requests'] || row.requests || '',
        }));
        
        resolve(guests);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsBinaryString(file);
  });
}

/**
 * Parse CSV file to guest data
 */
export function parseCSVFile(file: File): Promise<GuestRow[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      complete: (results) => {
        const guests = results.data.map((row: any) => ({
          name: row.Name || row.name || '',
          email: row.Email || row.email || '',
          phone: row.Phone || row.phone || '',
          category: row.Category || row.category || '',
          dietaryRestrictions: row['Dietary Restrictions'] || row.dietary || '',
          specialRequests: row['Special Requests'] || row.requests || '',
        }));
        resolve(guests);
      },
      error: (error) => reject(error),
    });
  });
}

/**
 * Generate Excel template for guest list
 */
export function generateGuestListTemplate(): void {
  const templateData = [
    {
      Name: 'John Doe',
      Email: 'john@example.com',
      Phone: '+1234567890',
      Category: 'VIP',
      'Dietary Restrictions': 'Vegetarian',
      'Special Requests': 'Window seat preference'
    },
    {
      Name: 'Jane Smith',
      Email: 'jane@example.com',
      Phone: '+0987654321',
      Category: 'Friends',
      'Dietary Restrictions': '',
      'Special Requests': ''
    }
  ];
  
  const ws = XLSX.utils.json_to_sheet(templateData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Guest List');
  
  // Download file
  XLSX.writeFile(wb, 'guest_list_template.xlsx');
}

/**
 * Export guests to Excel
 */
export function exportGuestsToExcel(guests: GuestRow[], filename: string = 'guests.xlsx'): void {
  const ws = XLSX.utils.json_to_sheet(guests);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Guests');
  XLSX.writeFile(wb, filename);
}
