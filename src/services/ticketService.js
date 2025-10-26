import api from './api';
import logger from '../utils/logger';

/**
 * Ticket Service
 * Handles all ticket-related API calls
 */

const TICKET_BASE_URL = '/tickets';

/**
 * Safely log ticket data without sensitive information
 * @param {string} message - Log message
 * @param {Object} data - Data to log
 */
const safeLogTicketData = (message, data) => {
  if (process.env.NODE_ENV !== 'production') {
    // Create a safe copy of the data without sensitive fields
    const safeData = Array.isArray(data) 
      ? data.map(ticket => ({
          ticketId: ticket.ticketId,
          ticketNumber: ticket.ticketNumber,
          seatNumber: ticket.seatNumber,
          type: ticket.type,
          journeyDate: ticket.journeyDate,
          source: ticket.source,
          destination: ticket.destination,
          price: ticket.price,
          status: ticket.status,
          busNumber: ticket.busNumber,
          // Omit sensitive fields:
          // profileUserPhone, passengerId, passengerName, passengerPhoneNumber
        }))
      : data; // If not an array, log as is to avoid breaking anything

    logger.debug(message, safeData);
  }
};

/**
 * Get all tickets with optional filters
 * @param {Object} filters - Filters for querying tickets
 * @returns {Promise<Array>} List of tickets
 */
export const getAllTickets = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams();
    
    // Add filters to query params if provided
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });
    
    const response = await api.get(`${TICKET_BASE_URL}?${queryParams}`);
    const tickets = Array.isArray(response.data) ? response.data : response.data?.data || [];
    
    // Log only non-sensitive data
    safeLogTicketData('Fetched tickets', tickets);
    
    return tickets;
  } catch (error) {
    logger.error('Error fetching tickets:', error.message);
    throw error;
  }
};

/**
 * Get ticket by ID
 * @param {string} ticketId - ID of the ticket to retrieve
 * @returns {Promise<Object>} Ticket details
 */
export const getTicketById = async (ticketId) => {
  try {
    const response = await api.get(`${TICKET_BASE_URL}/${ticketId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching ticket ${ticketId}:`, error);
    throw error;
  }
};

/**
 * Update ticket status
 * @param {string} ticketId - ID of the ticket to update
 * @param {Object} statusData - New status data
 * @returns {Promise<Object>} Updated ticket data
 */
export const updateTicketStatus = async (ticketId, statusData) => {
  try {
    const response = await api.put(`${TICKET_BASE_URL}/${ticketId}/status`, statusData);
    safeLogTicketData('Ticket status updated:', response.data);
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || 'Error updating ticket status';
    logger.error('Error updating ticket status:', errorMessage);
    throw new Error(errorMessage);
  }
};

/**
 * Update a ticket
 * @param {Object} ticketData - Ticket data to update
 * @returns {Promise<Object>} Updated ticket data
 */
export const updateTicket = async (ticketData) => {
  try {
    if (!ticketData || !ticketData.id) {
      throw new Error('Ticket ID is required for update');
    }
    
    logger.debug(`Updating ticket with ID: ${ticketData.id}`);
    const response = await api.put(TICKET_BASE_URL, ticketData);
    safeLogTicketData('Ticket updated successfully:', response.data);
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || 'Error updating ticket';
    logger.error('Error updating ticket:', errorMessage);
    throw new Error(errorMessage);
  }
};

/**
 * Cancel a ticket
 * @param {string} ticketId - ID of the ticket to cancel
 * @returns {Promise<Object>} Cancellation result
 */
export const cancelTicket = async (ticketId) => {
  try {
    const response = await api.put(`${TICKET_BASE_URL}/${ticketId}/cancel`);
    return response.data;
  } catch (error) {
    console.error(`Error cancelling ticket ${ticketId}:`, error);
    throw error;
  }
};

/**
 * Get tickets by passenger ID
 * @param {string} passengerId - ID of the passenger
 * @returns {Promise<Array>} List of passenger's tickets
 */
export const getTicketsByPassenger = async (passengerId) => {
  try {
    const response = await api.get(`${TICKET_BASE_URL}/passenger/${passengerId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching tickets for passenger ${passengerId}:`, error);
    throw error;
  }
};

/**
 * Get tickets by bus number
 * @param {string} busNumber - Bus number
 * @returns {Promise<Array>} List of tickets for the bus
 */
export const getTicketsByBus = async (busNumber) => {
  try {
    const response = await api.get(`${TICKET_BASE_URL}/bus/${busNumber}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching tickets for bus ${busNumber}:`, error);
    throw error;
  }
};

// For backward compatibility
/**
 * Delete a ticket
 * @param {string} ticketId - ID of the ticket to delete
 * @returns {Promise<Object>} Deletion result
 */
export const deleteTicket = async (ticketId) => {
  try {
    const response = await api.delete(`${TICKET_BASE_URL}/${ticketId}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting ticket ${ticketId}:`, error);
    throw error;
  }
};

/**
 * Create a new ticket with PAYMENT_PENDING status
 * @param {Object} ticketData - Ticket data including passenger and journey details
 * @returns {Promise<Object>} Created ticket data
 */
export const createTicket = async (ticketData) => {
  try {
    const response = await api.post('/tickets', ticketData);
    logger.debug('Ticket created successfully', response.data);
    return response.data;
  } catch (error) {
    logger.error('Error creating ticket:', error);
    throw error;
  }
};

export const getAllBookings = getAllTickets;
export const updateBookingStatus = updateTicketStatus;

const ticketService = {
  getAllTickets,
  getTicketById,
  updateTicketStatus,
  updateTicket, // Add the new updateTicket function
  cancelTicket,
  getTicketsByPassenger,
  getTicketsByBus,
  // Aliases for backward compatibility
  getAllBookings,
  updateBookingStatus,
};

export default ticketService;
