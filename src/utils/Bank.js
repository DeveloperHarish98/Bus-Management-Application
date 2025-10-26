// Bank.js

const UPI_DETAILS = [
  {
    upiId: '###@upi',
    upiPin: '***',
    app: 'Google Pay',
    balance: 100000,
  },
  {
    upiId: '###@upi',
    upiPin: '***',
    app: 'PhonePe',
    balance: 100000,
  },
  {
    upiId: '###@upi',
    upiPin: '***',
    app: 'BHIM',
    balance: 100000,
  },
  {
    upiId: '###@upi',
    upiPin: '***',
    app: 'Amazon Pay',
    balance: 100000,
  },
];

const BANK_DETAILS = [
  {
    bankCode: 'SBI',
    bankName: 'State Bank of India',
    accountNumber: '###',
    accountHolderName: '***',
    password: '***',
    ifscCode: '###',
    balance: 100000,
  },
  {
    bankCode: 'HDFC',
    bankName: 'HDFC Bank',
    accountNumber: '###',
    accountHolderName: '***',
    password: '***',
    ifscCode: '###',
    balance: 500000,
  },
  {
    bankCode: 'ICICI',
    bankName: 'ICICI Bank',
    accountNumber: '###',
    accountHolderName: '***',
    password: '***',
    ifscCode: '###',
    balance: 500000,
  },
  {
    bankCode: 'AXIS',
    bankName: 'Axis Bank',
    accountNumber: '###',
    accountHolderName: '***',
    password: '***',
    ifscCode: '###',
    balance: 50000,
  },
  {
    bankCode: 'PNB',
    bankName: 'Punjab National Bank',
    accountNumber: '###',
    accountHolderName: '***',
    password: '***',
    ifscCode: '###',
    balance: 50000,
  },
];

const CARD_DETAILS = [
  {
    cardNumber: '#### #### #### ####',
    pin: '***',
    cardType: 'Visa',
    expiryDate: '##/##',
    cvv: '***',
    cardholderName: '***',
    balance: 50000,
  },
  {
    cardNumber: '#### #### #### ####',
    pin: '***',
    cardType: 'Mastercard',
    expiryDate: '##/##',
    cvv: '***',
    cardholderName: '***',
    balance: 50000,
  },
  {
    cardNumber: '#### #### #### ####',
    pin: '***',
    cardType: 'American Express',
    expiryDate: '##/##',
    cvv: '***',
    cardholderName: '***',
    balance: 50000,
  },
  {
    cardNumber: '#### #### #### ####',
    pin: '***',
    cardType: 'RuPay',
    expiryDate: '##/##',
    cvv: '***',
    cardholderName: '***',
    balance: 50000,
  },
  {
    cardNumber: '#### #### #### ####',
    pin: '***',
    cardType: 'Maestro',
    expiryDate: '##/##',
    cvv: '***',
    cardholderName: '***',
    balance: 50000,
  },
];

// Combine all test accounts
export const testAccounts = [
  ...UPI_DETAILS,
  ...BANK_DETAILS,
  ...CARD_DETAILS,
];

// Exporting the details for use in other parts of the application
export { UPI_DETAILS, BANK_DETAILS, CARD_DETAILS };
