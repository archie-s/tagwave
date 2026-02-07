/**
 * Excel file parsing utility
 * Supports .xlsx files using a lightweight parser
 */

/**
 * Parse Excel file and extract attendee data
 * Expected columns: Tag ID, Name, Email (optional), Phone (optional)
 * @param {File} file - The Excel file to parse
 * @returns {Promise<Array>} Array of attendee objects with tagId, name, email, phone
 */
export const parseExcelFile = async (file) => {
  // Check file type
  if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls') && !file.name.endsWith('.csv')) {
    throw new Error('Please upload an Excel (.xlsx) or CSV file');
  }

  // For CSV files, parse directly
  if (file.name.endsWith('.csv')) {
    return parseCSVFile(file);
  }

  // For Excel files, we'll use a simple approach
  // In production, you might want to use a library like 'xlsx' or 'exceljs'
  return parseXLSXFile(file);
};

/**
 * Parse CSV file
 */
const parseCSVFile = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const csv = event.target.result;
        const lines = csv.split('\n');
        const attendees = [];

        // Skip header row if present
        let startRow = 0;
        if (lines[0].toLowerCase().includes('tag') || lines[0].toLowerCase().includes('name')) {
          startRow = 1;
        }

        for (let i = startRow; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          const columns = line.split(',').map((col) => col.trim());
          if (columns.length < 2) continue;

          const attendee = {
            tagId: columns[0] || '',
            name: columns[1] || '',
            email: columns[2] || '',
            phone: columns[3] || '',
          };

          if (attendee.tagId && attendee.name) {
            attendees.push(attendee);
          }
        }

        if (attendees.length === 0) {
          throw new Error('No valid attendee records found in CSV file');
        }

        resolve(attendees);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error('Error reading file'));
    };

    reader.readAsText(file);
  });
};

/**
 * Parse XLSX file using SheetJS or basic approach
 * This is a simplified version - for production use a library like 'xlsx'
 */
const parseXLSXFile = async (file) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Try to load SheetJS library if available
      if (typeof window !== 'undefined' && window.XLSX) {
        const reader = new FileReader();

        reader.onload = (event) => {
          try {
            const data = new Uint8Array(event.target.result);
            const workbook = window.XLSX.read(data, { type: 'array' });
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = window.XLSX.utils.sheet_to_json(worksheet);

            const attendees = jsonData
              .map((row) => {
                // Handle various possible column names
                const tagId =
                  row['Tag ID'] ||
                  row['TagID'] ||
                  row['Tag'] ||
                  row['tag_id'] ||
                  row['tagId'] ||
                  '';
                const name =
                  row['Name'] ||
                  row['name'] ||
                  row['Attendee'] ||
                  row['attendee'] ||
                  '';
                const email =
                  row['Email'] ||
                  row['email'] ||
                  row['E-mail'] ||
                  '';
                const phone =
                  row['Phone'] ||
                  row['phone'] ||
                  row['Mobile'] ||
                  row['mobile'] ||
                  '';

                return {
                  tagId: String(tagId).trim(),
                  name: String(name).trim(),
                  email: String(email).trim(),
                  phone: String(phone).trim(),
                };
              })
              .filter((item) => item.tagId && item.name);

            if (attendees.length === 0) {
              throw new Error('No valid attendee records found in Excel file');
            }

            resolve(attendees);
          } catch (error) {
            reject(error);
          }
        };

        reader.onerror = () => {
          reject(new Error('Error reading file'));
        };

        reader.readAsArrayBuffer(file);
      } else {
        throw new Error(
          'Excel parsing library not loaded. Please include SheetJS library or use CSV format.'
        );
      }
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Validate attendee data
 */
export const validateAttendeeData = (attendees) => {
  const errors = [];

  if (!Array.isArray(attendees) || attendees.length === 0) {
    errors.push('No attendee data provided');
    return errors;
  }

  attendees.forEach((attendee, index) => {
    if (!attendee.tagId) {
      errors.push(`Row ${index + 1}: Tag ID is required`);
    }
    if (!attendee.name) {
      errors.push(`Row ${index + 1}: Name is required`);
    }
    if (attendee.email && !isValidEmail(attendee.email)) {
      errors.push(`Row ${index + 1}: Invalid email format`);
    }
  });

  return errors;
};

/**
 * Simple email validation
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Generate CSV template
 */
export const generateCSVTemplate = () => {
  const template = 'Tag ID,Name,Email,Phone\nTAG-001,John Doe,john@example.com,555-0001\nTAG-002,Jane Smith,jane@example.com,555-0002';
  const blob = new Blob([template], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'attendees_template.csv';
  link.click();
  window.URL.revokeObjectURL(url);
};

/**
 * Parse Excel/CSV file for bulk tag creation
 * Expected columns: Tag ID, Name, Description, Destination URL, Location
 * @param {File} file - The Excel or CSV file to parse
 * @returns {Promise<Array>} Array of tag objects
 */
export const parseBulkTagFile = async (file) => {
  // Check file type
  if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls') && !file.name.endsWith('.csv')) {
    throw new Error('Please upload an Excel (.xlsx) or CSV file');
  }

  // For CSV files, parse directly
  if (file.name.endsWith('.csv')) {
    return parseTagCSVFile(file);
  }

  // For Excel files
  return parseTagXLSXFile(file);
};

/**
 * Parse CSV file for tag creation
 */
const parseTagCSVFile = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const csv = event.target.result;
        const lines = csv.split('\n');
        const tags = [];

        // Skip header row if present
        let startRow = 0;
        if (lines[0].toLowerCase().includes('tag') || lines[0].toLowerCase().includes('name')) {
          startRow = 1;
        }

        for (let i = startRow; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          const columns = line.split(',').map((col) => col.trim());
          if (columns.length < 2) continue;

          const tag = {
            tagId: columns[0] || '',
            name: columns[1] || '',
            description: columns[2] || '',
            destinationUrl: columns[3] || '',
            location: columns[4] || '',
            isActive: true,
          };

          if (tag.tagId && tag.name && tag.destinationUrl) {
            tags.push(tag);
          }
        }

        if (tags.length === 0) {
          throw new Error('No valid tag records found in CSV file. Ensure Tag ID, Name, and Destination URL are provided.');
        }

        resolve(tags);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error('Error reading file'));
    };

    reader.readAsText(file);
  });
};

/**
 * Parse XLSX file for tag creation
 */
const parseTagXLSXFile = async (file) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Try to load SheetJS library if available
      if (typeof window !== 'undefined' && window.XLSX) {
        const reader = new FileReader();

        reader.onload = (event) => {
          try {
            const data = new Uint8Array(event.target.result);
            const workbook = window.XLSX.read(data, { type: 'array' });
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = window.XLSX.utils.sheet_to_json(worksheet);

            const tags = jsonData
              .map((row) => {
                // Handle various possible column names
                const tagId =
                  row['Tag ID'] ||
                  row['TagID'] ||
                  row['Tag'] ||
                  row['tag_id'] ||
                  row['tagId'] ||
                  '';
                const name =
                  row['Name'] ||
                  row['name'] ||
                  row['Tag Name'] ||
                  '';
                const description =
                  row['Description'] ||
                  row['description'] ||
                  '';
                const destinationUrl =
                  row['Destination URL'] ||
                  row['URL'] ||
                  row['url'] ||
                  row['destinationUrl'] ||
                  row['Link'] ||
                  '';
                const location =
                  row['Location'] ||
                  row['location'] ||
                  '';

                return {
                  tagId: String(tagId).trim(),
                  name: String(name).trim(),
                  description: String(description).trim(),
                  destinationUrl: String(destinationUrl).trim(),
                  location: String(location).trim(),
                  isActive: true,
                };
              })
              .filter((item) => item.tagId && item.name && item.destinationUrl);

            if (tags.length === 0) {
              throw new Error('No valid tag records found in Excel file. Ensure Tag ID, Name, and Destination URL are provided.');
            }

            resolve(tags);
          } catch (error) {
            reject(error);
          }
        };

        reader.onerror = () => {
          reject(new Error('Error reading file'));
        };

        reader.readAsArrayBuffer(file);
      } else {
        throw new Error(
          'Excel parsing library not loaded. Please include SheetJS library or use CSV format.'
        );
      }
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Validate tag data for bulk creation
 */
export const validateTagData = (tags) => {
  const errors = [];

  if (!Array.isArray(tags) || tags.length === 0) {
    errors.push('No tag data provided');
    return errors;
  }

  const tagIds = new Set();

  tags.forEach((tag, index) => {
    if (!tag.tagId) {
      errors.push(`Row ${index + 1}: Tag ID is required`);
    } else if (tagIds.has(tag.tagId)) {
      errors.push(`Row ${index + 1}: Duplicate Tag ID "${tag.tagId}"`);
    } else {
      tagIds.add(tag.tagId);
    }

    if (!tag.name) {
      errors.push(`Row ${index + 1}: Name is required`);
    }

    if (!tag.destinationUrl) {
      errors.push(`Row ${index + 1}: Destination URL is required`);
    } else if (!isValidURL(tag.destinationUrl)) {
      errors.push(`Row ${index + 1}: Invalid URL format for "${tag.destinationUrl}"`);
    }
  });

  return errors;
};

/**
 * Simple URL validation
 */
const isValidURL = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Generate CSV template for bulk tag creation
 */
export const generateTagCSVTemplate = () => {
  const template = 'Tag ID,Name,Description,Destination URL,Location\nTAG-001,Product Demo,Main product demo tag,https://example.com/demo,Store Front\nTAG-002,Special Offer,Summer promotion,https://example.com/promo,Window Display\nTAG-003,Event Info,Event information,https://example.com/event,Reception Desk';
  const blob = new Blob([template], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'bulk_tags_template.csv';
  link.click();
  window.URL.revokeObjectURL(url);
};
