import api from './api';
import logger from '../utils/logger';

// ====================
// Booking Operations
// ====================

export const getUserBookings = async (phoneNumber) => {
  if (!phoneNumber) {
    throw new Error('Phone number is required');
  }

  try {
    const formattedPhone = phoneNumber.replace(/[^\d+]/g, '');
    const response = await api.get('/tickets/my-bookings', {
      params: { phoneNumber: formattedPhone }
    });
    
    let responseData = response.data?.data || response.data || response;
    if (!responseData) {
      throw new Error('No data received from server');
    }
    const bookings = Array.isArray(responseData) ? responseData : [responseData];
    return bookings.map(booking => {
      if (!booking.fare) {
        const fareFields = ['fare', 'amount', 'totalFare', 'totalAmount', 'price', 'ticketPrice', 'bookingAmount'];
        for (const field of fareFields) {
          if (booking[field] !== undefined) {
            booking.fare = booking[field];
            break;
          }
        }
      }
      
      if (!booking.totalFare && booking.fare) {
        booking.totalFare = booking.fare;
      } else if (!booking.fare && booking.totalFare) {
        booking.fare = booking.totalFare;
      }
      
      return booking;
    });
    
  } catch (error) {
    console.error('Error in getUserBookings:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });

    if (error.response) {
      if (error.response.status === 401) {
        throw new Error('Your session has expired. Please log in again.');
      } else if (error.response.status === 404) {
        return []; // Return empty array for no bookings
      } else if (error.response.status >= 500) {
        throw new Error('Server error. Please try again later.');
      } else if (error.response.data?.message) {
        throw new Error(error.response.data.message);
      }
    }
    
    throw error;
  }
};

export const cancelBooking = async (bookingId) => {
  if (!bookingId) {
    throw new Error('Booking ID is required');
  }
  try {
    const cleanBookingId = String(bookingId).replace(/\D/g, '');
    if (!cleanBookingId) {
      throw new Error('Invalid booking ID after cleaning');
    }
    const requestInterceptor = api.interceptors.request.use(
      (config) => {
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );
    
    const responseInterceptor = api.interceptors.response.use(
      response => {
        return response;
      },
      error => {
        return Promise.reject(error);
      }
    );

    const response = await api.delete(`/tickets/${cleanBookingId}`, {
      validateStatus: status => status < 500
    });

    api.interceptors.request.eject(requestInterceptor);
    api.interceptors.response.eject(responseInterceptor);
    if (response.status >= 200 && response.status < 300) {
      if (!response.data) {
        console.warn('[BookingService] Empty response data received');
        return { success: true, message: 'Booking cancelled successfully' };
      }
      return response.data;
    }
    
    let errorMessage = 'Failed to cancel booking';
    
    if (response.status === 401) {
      errorMessage = 'Your session has expired. Please log in again.';
    } else if (response.status === 403) {
      errorMessage = 'You do not have permission to cancel this booking.';
    } else if (response.status === 404) {
      errorMessage = 'Booking not found or already cancelled.';
    } else if (response.status === 400) {
      errorMessage = response.data?.message || 'Cannot cancel this booking. It may be too close to departure time.';
    } else if (response.status >= 500) {
      errorMessage = 'Server error. Please try again later.';
    } else if (response.data?.message) {
      errorMessage = response.data.message;
    }
    
    // Create a custom error with the server response
    const error = new Error(errorMessage);
    error.response = response;
    throw error;
    
  } catch (error) {
    console.error('[BookingService] Error in cancelBooking:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      response: {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers
      },
      request: error.request,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers ? {
          ...error.config.headers,
          Authorization: error.config.headers.Authorization ? 'Bearer [token]' : 'No token'
        } : undefined
      }
    });
    
    if (error.response) {
      throw error;
    } else {
      const networkError = new Error('Unable to connect to the server. Please check your internet connection.');
      networkError.isNetworkError = true;
      throw networkError;
    }
  }
};

// ====================
// Ticket Operations
// ====================

const formatDateToDDMMYYYY = (dateString) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString; // Return original if invalid date
  
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  
  return `${day}/${month}/${year}`;
};

export const createTicket = async (ticketData) => {
  try {
    if (!ticketData.profileUserPhone) {
      logger.error('Ticket creation failed: User phone number is required');
      throw new Error('User phone number is required for booking');
    }

    // Extract seat numbers - handle both string array and object array
    const extractSeatNumbers = (seats) => {
      if (!seats || !Array.isArray(seats)) return [];
      return seats.map(seat => {
        if (typeof seat === 'string') return seat;
        if (seat?.seatNumber) return String(seat.seatNumber);
        if (seat?.seat) return String(seat.seat);
        return null;
      }).filter(Boolean);
    };

    // Clean up passenger data by removing redundant fields
    const cleanedPassengers = (ticketData.passengers || []).map((passenger, index) => {
      // Create a new object with only the required fields
      return {
        name: passenger.name || `Passenger ${index + 1}`,
        age: parseInt(passenger.age, 10) || 25, // Default age 25 if not provided
        gender: (passenger.gender || 'MALE').toUpperCase(),
        phoneNumber: passenger.phoneNumber || ticketData.profileUserPhone || ''
      };
    });

    // Format the request payload to match the expected format
    const formattedData = {
      profileUserPhone: ticketData.profileUserPhone,
      busNumber: ticketData.busNumber,
      journeyDate: formatDateToDDMMYYYY(ticketData.journeyDate || new Date()),
      source: ticketData.source || '',
      destination: ticketData.destination || '',
      seatNumbers: extractSeatNumbers(ticketData.seatNumbers) || [],
      passengers: cleanedPassengers
    };
    
    // Ensure seatNumbers and passengers arrays are in sync
    if (formattedData.passengers.length > 0 && formattedData.seatNumbers.length === 0) {
      formattedData.seatNumbers = formattedData.passengers
        .map(p => p.seatNumber)
        .filter(Boolean);
    }

    const response = await api.post('/tickets', formattedData);
    const responseData = response.data?.data || response.data || response;

    // Ensure fare and totalFare are set first
    if (ticketData.totalFare) {
      responseData.fare = ticketData.totalFare;
      responseData.totalFare = ticketData.totalFare;
    } else if (responseData.totalFare && !responseData.fare) {
      responseData.fare = responseData.totalFare;
    } else if (responseData.fare && !responseData.totalFare) {
      responseData.totalFare = responseData.fare;
    }
    
    // Always set amountToPay to match totalFare
    if (responseData.totalFare && responseData.totalFare > 0) {
      responseData.amountToPay = responseData.totalFare;
    } else if (ticketData.totalFare) {
      responseData.amountToPay = ticketData.totalFare;
    } else if (responseData.amountToPay === undefined) {
      responseData.amountToPay = 0;
    }
    
    return responseData;
  } catch (error) {
    logger.error('Error in createTicket:', error.message);
    
    let errorMessage = 'Failed to create ticket';
    
    if (error.response) {
      if (error.response.status === 400) {
        errorMessage = error.response.data?.message || 'Invalid request data. Please check your booking details and try again.';
      } else if (error.response.status === 401) {
        errorMessage = 'Your session has expired. Please log in again.';
      } else if (error.response.status === 403) {
        errorMessage = 'You do not have permission to perform this action';
      } else if (error.response.status === 409) {
        // Extract seat number from error message if available
        const seatMatch = error.response.data?.message?.match(/Seat (\d+)/i);
        if (seatMatch && seatMatch[1]) {
          errorMessage = `Seat ${seatMatch[1]} is currently in pending payment. Please select a different seat or try again later.`;
          error.pendingSeat = seatMatch[1];
        } else {
          errorMessage = 'One or more seats are currently in pending payment. Please select different seats or try again later.';
        }
      } else if (error.response.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error.response.data?.message) {
        errorMessage = error.response.data.message;
      }
    } else if (error.request) {
      errorMessage = 'No response from server. Please check your connection.';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    const errorWithMessage = new Error(errorMessage);
    errorWithMessage.response = error.response;
    errorWithMessage.status = error.response?.status || 500;
    throw errorWithMessage;
  }
};

/**
 * Get ticket by ID
 * @param {string|number} ticketId - ID of the ticket to fetch
 * @returns {Promise<Object>} Ticket data
 */
export const getTicketById = async (ticketId) => {
  try {
    const response = await api.get(`/tickets/${ticketId}`);
    return response.data?.data || response.data;
  } catch (error) {
    console.error(`Error in getTicketById for ticket ${ticketId}:`, error);
    
    if (error.response?.status === 404) {
      throw new Error('Ticket not found');
    }
    
    throw error;
  }
};

/**
 * Get all tickets for a specific bus
 * @param {string} busNumber - Bus number to fetch tickets for
 * @returns {Promise<Array>} List of tickets
 */
export const getTicketsByBusNumber = async (busNumber) => {
  try {
    const response = await api.get(`/tickets/bus/${busNumber}`);
    return response.data?.data || response.data || [];
  } catch (error) {
    console.error(`Error in getTicketsByBusNumber for bus ${busNumber}:`, error);
    
    if (error.response?.status === 404) {
      return []; // Return empty array if no tickets found
    }
    
    throw error;
  }
};

/**
 * Get all tickets for the current user
 * @returns {Promise<Array>} List of user's tickets
 */
export const getUserTickets = async () => {
  try {
    const response = await api.get('/tickets/my-tickets');
    return response.data?.data || response.data || [];
  } catch (error) {
    console.error('Error in getUserTickets:', error);
    
    if (error.response?.status === 401) {
      throw new Error('Session expired. Please log in again.');
    }
    
    throw error;
  }
};

/**
 * Send ticket to email
 * @param {string} ticketId - Ticket/booking ID
 * @param {string} email - Email address to send to
 * @returns {Promise<Object>} Email sending status
 */
export const emailTicket = async (ticketId, email) => {
  try {
    const response = await api.post(`/tickets/${ticketId}/email`, { email });
    return response.data?.data || response.data;
  } catch (error) {
    console.error(`Error in emailTicket for ticket ${ticketId}:`, error);
    
    if (error.response?.status === 400) {
      throw new Error('Invalid email address');
    } else if (error.response?.status === 404) {
      throw new Error('Ticket not found');
    }
    
    throw error;
  }
};

// For backward compatibility
export const ticketService = {
  createTicket,
  getTicketById,
  getTicketsByBusNumber,
  getUserTickets,
  cancelTicket: cancelBooking,
  emailTicket
};

const bookingService = {
  // Booking operations
  getUserBookings,
  cancelBooking,
  
  // Ticket operations
  createTicket,
  getTicketById,
  getTicketsByBusNumber,
  getUserTickets,
  emailTicket,
  
  // Backward compatibility
  ticketService
};

export default bookingService;
