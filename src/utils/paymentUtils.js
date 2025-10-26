export const PAYMENT_METHODS = {
  CARD: 'card',
  NET_BANKING: 'netbanking',
  UPI: 'upi',
  WALLET: 'wallet'
};

// Available banks for net banking
export const BANKS = [
  { code: 'SBI', name: 'State Bank of India' },
  { code: 'HDFC', name: 'HDFC Bank' },
  { code: 'ICICI', name: 'ICICI Bank' },
  { code: 'AXIS', name: 'Axis Bank' },
  { code: 'BOB', name: 'Bank of Baroda' },
  { code: 'PNB', name: 'Punjab National Bank' },
  { code: 'CANARA', name: 'Canara Bank' },
  { code: 'BOI', name: 'Bank of India' },
  { code: 'UBI', name: 'Union Bank of India' },
  { code: 'IOB', name: 'Indian Overseas Bank' },
  { code: 'CBI', name: 'Central Bank of India' },
  { code: 'BOB', name: 'Bank of Baroda' },
  { code: 'IDBI', name: 'IDBI Bank' },
  { code: 'YES', name: 'Yes Bank' },
  { code: 'INDUS', name: 'IndusInd Bank' }
];

// Available UPI apps
export const UPI_APPS = [
  { id: 'gpay', name: 'Google Pay' },
  { id: 'phonepe', name: 'PhonePe' },
  { id: 'paytm', name: 'Paytm' },
  { id: 'bhim', name: 'BHIM' },
  { id: 'amazonpay', name: 'Amazon Pay' },
  { id: 'whatsapp', name: 'WhatsApp Pay' },
  { id: 'cred', name: 'CRED Pay' },
  { id: 'mobikwik', name: 'MobiKwik' },
  { id: 'airtel', name: 'Airtel Payments Bank' },
  { id: 'freecharge', name: 'Freecharge' }
];

// Currency and payment status constants
export const CURRENCY = {
  CODE: 'INR',
  SYMBOL: '₹',
  DECIMALS: 2,
  LOCALE: 'en-IN'
};

export const PAYMENT_STATUS = {
  PENDING: 'PENDING',
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
  REFUNDED: 'REFUNDED',
  PROCESSING: 'PROCESSING'
};

export const TRANSACTION_FEES = {
  CREDIT_CARD: 1.5,  // 1.5% for credit cards
  DEBIT_CARD: 0.5,   // 0.5% for debit cards
  NET_BANKING: 0.2,  // 0.2% for net banking
  UPI: 0,            // 0% for UPI
  WALLET: 0.3        // 0.3% for wallet
};

// Card types with their validation patterns
export const CARD_TYPES = {
  VISA: {
    pattern: /^4[0-9]{12}(?:[0-9]{3})?$/,
    name: 'Visa',
    cvvLength: 3,
    logo: 'visa.png',
    maxLength: 16
  },
  MASTERCARD: {
    pattern: /^5[1-5][0-9]{14}$/,
    name: 'Mastercard',
    cvvLength: 3,
    logo: 'mastercard.png',
    maxLength: 16
  },
  AMEX: {
    pattern: /^3[47][0-9]{13}$/,
    name: 'American Express',
    cvvLength: 4,
    logo: 'amex.png',
    maxLength: 15
  },
  RUPAY: {
    pattern: /^(508[5-9][0-9]{12})|(6069[8-9][0-9]{11})|(607[0-9]{14})|(6[0-9]{15})$/,
    name: 'RuPay',
    cvvLength: 3,
    logo: 'rupay.png',
    maxLength: 16
  },
  MAESTRO: {
    pattern: /^(5018|5020|5038|6304|6759|6761|6762|6763)[0-9]{8,15}$/,
    name: 'Maestro',
    cvvLength: 3,
    logo: 'maestro.png',
    maxLength: 19
  }
};


/**
 * Format card number with spaces for better readability
 * @param {string} cardNumber - Raw card number
 * @returns {string} Formatted card number (e.g., '4111 1111 1111 1111')
 */
export const formatCardNumber = (cardNumber) => {
  if (!cardNumber) return '';
  return cardNumber
    .replace(/\s+/g, '')
    .replace(/(\d{4})(?=\d)/g, '$1 ')
    .trim();
};

/**
 * Format expiry date with slash (MM/YY)
 * @param {string} expiryDate - Raw expiry date
 * @returns {string} Formatted expiry date (MM/YY)
 */
export const formatExpiryDate = (expiryDate) => {
  if (!expiryDate) return '';
  return expiryDate
    .replace(/\D/g, '')
    .replace(/^(\d{2})/, '$1/')
    .substring(0, 5);
};

/**
 * Get card type from card number
 * @param {string} cardNumber - Card number
 * @returns {Object} Card type info or null if unknown
 */
export const getCardType = (cardNumber) => {
  if (!cardNumber) return null;
  
  const number = cardNumber.replace(/\s+/g, '');
  
  for (const [type, data] of Object.entries(CARD_TYPES)) {
    if (data.pattern.test(number)) {
      return { type, ...data };
    }
  }
  
  return null;
};


export const generateTransactionId = () => {
  return `TXN${Date.now()}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
};

export const calculateTransactionFee = (paymentMethod, amount) => {
  if (!amount || amount <= 0) return 0;
  
  let feePercentage = 0;
  
  switch (paymentMethod) {
    case PAYMENT_METHODS.CARD:
      feePercentage = TRANSACTION_FEES.CREDIT_CARD; // Default to credit card
      break;
    case PAYMENT_METHODS.NET_BANKING:
      feePercentage = TRANSACTION_FEES.NET_BANKING;
      break;
    case PAYMENT_METHODS.UPI:
      feePercentage = TRANSACTION_FEES.UPI;
      break;
    case PAYMENT_METHODS.WALLET:
      feePercentage = TRANSACTION_FEES.WALLET;
      break;
    default:
      feePercentage = 0;
  }
  
  return parseFloat(((amount * feePercentage) / 100).toFixed(2));
};

export const formatAmount = (amount, withSymbol = true) => {
  if (isNaN(amount)) return withSymbol ? `${CURRENCY.SYMBOL}0.00` : '0.00';
  
  const formatted = parseFloat(amount).toFixed(CURRENCY.DECIMALS);
  return withSymbol 
    ? `${CURRENCY.SYMBOL}${formatted}` 
    : formatted;
};

export const validateCardDetails = (cardData) => {
  const { cardNumber, expiryDate, cvv, cardName } = cardData || {};
  
  if (!cardNumber || !expiryDate || !cvv || !cardName) {
    return { isValid: false, message: 'All card details are required' };
  }
  
  // Clean card number
  const cleanCardNumber = cardNumber.replace(/\s+/g, '');
  
  // Validate card number length and Luhn algorithm
  if (cleanCardNumber.length < 13 || cleanCardNumber.length > 19) {
    return { isValid: false, message: 'Invalid card number length' };
  }
  
  if (!luhnCheck(cleanCardNumber)) {
    return { isValid: false, message: 'Invalid card number' };
  }
  
  // Validate expiry date (MM/YY format)
  const [month, year] = expiryDate.split('/').map(Number);
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear() % 100;
  const currentMonth = currentDate.getMonth() + 1;
  
  if (
    isNaN(month) || isNaN(year) ||
    month < 1 || month > 12 ||
    year < currentYear || (year === currentYear && month < currentMonth)
  ) {
    return { isValid: false, message: 'Invalid or expired card' };
  }
  
  // Validate CVV
  const cardType = getCardType(cleanCardNumber);
  const expectedCvvLength = cardType?.cvvLength || 3;
  
  if (!cvv || !/^\d+$/.test(cvv) || cvv.length !== expectedCvvLength) {
    return { 
      isValid: false, 
      message: `CVV must be ${expectedCvvLength} digits` 
    };
  }
  
  return { isValid: true, message: 'Card details are valid' };
};

const validateUpiId = (upiId) => {
  if (!upiId) {
    return { isValid: false, message: 'UPI ID is required' };
  }
  
  // More permissive UPI ID validation to accept various formats including test UPI IDs
  const upiRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$|^[0-9]{10}@[a-zA-Z0-9]+$/;
  if (!upiRegex.test(upiId)) {
    return { 
      isValid: false, 
      message: 'Please enter a valid UPI ID (e.g., username@upi or 9876543210@ybl)' 
    };
  }
  
  return { isValid: true, message: '' };
};

const luhnCheck = (cardNumber) => {
  let sum = 0;
  let shouldDouble = false;
  
  for (let i = cardNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(cardNumber.charAt(i), 10);
    
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) {
        digit = (digit % 10) + 1;
      }
    }
    
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  
  return sum % 10 === 0;
};

export const processPayment = async (method, paymentData, amount) => {
  try {
    // Validate payment data based on method
    let validation;
    
    switch (method) {
      case PAYMENT_METHODS.CARD:
        validation = validateCardDetails(paymentData);
        if (!validation.isValid) {
          return {
            success: false,
            status: PAYMENT_STATUS.FAILED,
            message: validation.message,
            transactionId: null
          };
        }
        break;
        
      case PAYMENT_METHODS.UPI:
        if (!paymentData?.upiId || !/^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$/.test(paymentData.upiId)) {
          return {
            success: false,
            status: PAYMENT_STATUS.FAILED,
            message: 'Invalid UPI ID',
            transactionId: null
          };
        }
        break;
        
      case PAYMENT_METHODS.NET_BANKING:
        if (!paymentData?.bankCode || !BANKS.some(bank => bank.code === paymentData.bankCode)) {
          return {
            success: false,
            status: PAYMENT_STATUS.FAILED,
            message: 'Invalid bank selected',
            transactionId: null
          };
        }
        break;
        
      default:
        return {
          success: false,
          status: PAYMENT_STATUS.FAILED,
          message: 'Unsupported payment method',
          transactionId: null
        };
    }
    
    // In a real implementation, this would be an API call to your payment gateway
    const transactionId = generateTransactionId();
    const transactionFee = calculateTransactionFee(method, amount);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simulate random success/failure (90% success rate for demo)
    const isSuccess = Math.random() < 0.9;
    
    if (!isSuccess) {
      return {
        success: false,
        status: PAYMENT_STATUS.FAILED,
        message: 'Payment processing failed. Please try again or use a different payment method.',
        transactionId: null,
        amount,
        fee: transactionFee
      };
    }
    
    return {
      success: true,
      status: PAYMENT_STATUS.SUCCESS,
      message: 'Payment successful',
      transactionId,
      amount,
      fee: transactionFee,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('Payment processing error:', error);
    return {
      success: false,
      status: PAYMENT_STATUS.FAILED,
      message: 'An error occurred while processing your payment',
      transactionId: null,
      amount,
      fee: 0
    };
  }
};
// Create and export the paymentUtils object with all the necessary functions and constants
const paymentUtils = {
  // Constants
  PAYMENT_METHODS,
  BANKS,
  UPI_APPS,
  CARD_TYPES,
  CURRENCY,
  PAYMENT_STATUS,
  TRANSACTION_FEES,
  
  // Functions
  formatCardNumber,
  formatExpiryDate,
  getCardType,
  generateTransactionId,
  calculateTransactionFee,
  formatAmount,
  validateCardDetails,
  validateUpiId,
  luhnCheck,
  processPayment
};

export default paymentUtils;