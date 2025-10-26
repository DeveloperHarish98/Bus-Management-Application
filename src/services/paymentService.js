import api from './api';
import logger from '../utils/logger';
import { UPI_DETAILS, BANK_DETAILS, CARD_DETAILS } from '../utils/Bank';

// Simulate network delay
const simulateNetworkDelay = () => new Promise(resolve => setTimeout(resolve, 1500));

/**
 * Validate UPI ID format
 * @param {string} upiId - UPI ID to validate
 * @returns {boolean} - True if valid, false otherwise
 */
const validateUpiId = (upiId) => {
  const upiRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$/;
  return upiRegex.test(upiId);
};

/**
 * Process payment for tickets
 * @param {Object} paymentData - Payment data including seat numbers, bus details, and payment method
 * @returns {Promise<Object>} Payment result
 */
export const processPayment = async (paymentData) => {
  const { 
    seatNumbers, 
    busNumber, 
    profileUserPhone, 
    amount, 
    paymentMethod,
    paymentDetails 
  } = paymentData;

  try {
    // Simulate network delay
    await simulateNetworkDelay();

    // Format the request according to the backend API
    const paymentRequest = {
      seatNumbers: Array.isArray(seatNumbers) 
        ? seatNumbers.map(s => s.toString()) 
        : [seatNumbers.toString()],
      busNumber: busNumber.toString(),
      profileUserPhone: profileUserPhone.toString(),
      price: parseFloat(amount),
      status: 'BOOKED' // Set status to BOOKED as payment is mandatory during creation
    };

    // Find test account for the payment method
    let account;
    
    if (paymentMethod === 'UPI') {
      // For UPI, check if the UPI ID matches any test account
      account = UPI_DETAILS.find(acc => 
        acc.upiId.toLowerCase() === paymentDetails.upiId?.toLowerCase()
      );
      if (account) {
        // Add type and id for consistency with the rest of the code
        account.type = 'UPI';
        account.id = account.upiId;
      }
    } else if (paymentMethod === 'CARD') {
      // For card, check if the card number matches any test card
      const cardNumber = paymentDetails.cardNumber?.replace(/\s/g, '');
      account = CARD_DETAILS.find(acc => 
        acc.number === cardNumber
      );
    } else if (paymentMethod === 'NETBANKING') {
      // For netbanking, check bank and username
      account = BANK_DETAILS.find(acc => 
        acc.bankCode === paymentDetails.bank && 
        acc.accountNumber === paymentDetails.username
      );
      if (account) {
        // Add username for consistency
        account.username = account.accountNumber;
        account.type = 'BANK';
      }
    }

    console.log('Payment details:', paymentDetails);
    console.log('Found test account:', account);

    if (!account) {
      throw new Error('Test account not found for payment method');
    }

    // Check if account has sufficient balance
    if (account.balance < parseFloat(amount)) {
      throw new Error('Insufficient balance in test account');
    }

    // Deduct amount from test account
    account.balance -= parseFloat(amount);
    logger.debug(`Deducted ${amount} from ${account.id || account.number}. New balance: ${account.balance}`);
    
    logger.debug('Sending payment request to backend:', paymentRequest);
    
    // Send payment request to the backend
    const response = await api.post('/payment/send', paymentRequest);
    
    logger.debug('Backend payment response:', response.data);
    
    return {
      success: true,
      message: 'Payment processed successfully',
      transactionId: `TXN${Date.now()}`,
      amount: parseFloat(amount),
      paymentMethod: paymentMethod,
      bookingId: response.data.tickets?.[0]?.ticketNumber || `B${Date.now()}`,
      data: response.data
    };
    
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || 'Payment processing failed';
    logger.error('Payment processing error:', errorMessage, error);
    
    return {
      success: false,
      error: errorMessage,
      message: errorMessage.includes('Network Error') 
        ? 'Unable to connect to payment server. Please check your internet connection.'
        : errorMessage
    };
  }
};

/**
 * Get payment details for a specific ticket
 * @param {string} ticketNumber - The ticket number to get payment details for
 * @returns {Promise<Object>} Payment details
 */
export const getTicketPaymentDetails = async (ticketNumber) => {
  try {
    const response = await api.get(`/payment/ticket/${ticketNumber}`);
    return {
      success: true,
      data: response.data,
      paymentStatus: response.data.status || 'UNKNOWN'
    };
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch payment details';
    logger.error('Error fetching payment details:', errorMessage, error);
    return {
      success: false,
      error: errorMessage,
      message: errorMessage
    };
  }
};

const paymentService = {
  processPayment,
  getTicketPaymentDetails,
  validateUpiId
};

export default paymentService;
