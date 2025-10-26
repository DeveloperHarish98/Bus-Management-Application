/**
 * Check if a date is valid
 * @param {string|Date|number} date - The date to validate
 * @returns {boolean} True if the date is valid
 */
export const isValidDate = (date) => {
  if (!date) return false;
  const d = new Date(date);
  return !isNaN(d.getTime());
};

/**
 * Safely format a date with a fallback
 * @param {string|Date} dateString - The date to format
 * @param {string} [format='dd/MM/yyyy'] - The format string
 * @param {Date} [fallback=null] - Fallback date if date is invalid
 * @returns {string} Formatted date string or fallback
 */
export const safeFormatDate = (dateString, format = 'dd/MM/yyyy', fallback = null) => {
  try {
    if (!dateString) throw new Error('No date provided');
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) throw new Error('Invalid date');
    
    // For MUI date picker compatibility
    if (format === 'yyyy-MM-dd') {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    
    // Default format
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return format
      .replace('dd', day)
      .replace('MM', month)
      .replace('yyyy', year);
  } catch (e) {
    if (fallback !== null) {
      return safeFormatDate(fallback, format);
    }
    const today = new Date();
    return safeFormatDate(today, format);
  }
};

/**
 * Format a date string to dd/MM/yyyy format
 * @param {string|Date} dateString - The date to format
 * @returns {string} Formatted date string in dd/MM/yyyy format
 */
export const formatJourneyDate = (dateString) => {
  return safeFormatDate(dateString, 'dd/MM/yyyy');
};

/**
 * Validate booking data before submission
 * @param {object} data - The booking data to validate
 * @returns {object} Object with isValid flag and error message if invalid
 */
export const validateBookingData = (data) => {
  const { passengers, selectedSeats } = data || {};
  
  if (!passengers || !Array.isArray(passengers) || passengers.length === 0) {
    return { isValid: false, message: 'At least one passenger is required' };
  }
  
  if (!selectedSeats || selectedSeats.length === 0) {
    return { isValid: false, message: 'At least one seat must be selected' };
  }
  
  if (passengers.length !== selectedSeats.length) {
    return { isValid: false, message: 'Number of passengers must match number of selected seats' };
  }
  
  for (let i = 0; i < passengers.length; i++) {
    const passenger = passengers[i] || {};
    if (!passenger.name || !passenger.name.trim()) {
      return { isValid: false, message: `Passenger ${i + 1}: Name is required` };
    }
    if (!passenger.age || isNaN(parseInt(passenger.age, 10)) || passenger.age < 1 || passenger.age > 120) {
      return { isValid: false, message: `Passenger ${i + 1}: Age must be between 1 and 120` };
    }
    if (!['MALE', 'FEMALE', 'OTHER'].includes((passenger.gender || '').toUpperCase())) {
      return { isValid: false, message: `Passenger ${i + 1}: Invalid gender` };
    }
  }
  
  return { isValid: true };
};

/**
 * Format seat numbers from various input formats to an array of strings
 * @param {Array<string|object>|string} seats - The seats to format
 * @returns {string[]} Array of formatted seat numbers
 */
export const formatSeatNumbers = (seats) => {
  if (!seats) return [];
  
  if (typeof seats === 'string') {
    return [seats.trim()].filter(Boolean);
  }
  
  if (!Array.isArray(seats)) {
    return [];
  }
  
  return seats
    .map(seat => {
      if (typeof seat === 'object' && seat !== null) {
        return String(seat.seatNumber || seat.number || seat.id || '').trim();
      }
      return String(seat).trim();
    })
    .filter(seat => seat); // Remove empty strings
};