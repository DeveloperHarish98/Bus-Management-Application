// Bank.js

const UPI_DETAILS = [
    {
      upiId: '8962385837@upi',
      upiPin: '123456',
      app: 'Google Pay',
      balance: 100000,
    },
    {
      upiId: '8448724081@upi',
      upiPin: '123456',
      app: 'PhonePe',
      balance: 100000,
    },
    {
      upiId: '8074775861@upi',
      upiPin: '1',
      app: 'BHIM',
      balance: 100000,
    },
    {
      upiId: '1234567890@upi',
      upiPin: '123456',
      app: 'Amazon Pay',
      balance: 100000,
    },
  ];
  
  const BANK_DETAILS = [
    {
      bankCode: 'SBI',
      bankName: 'State Bank of India',
      accountNumber: '999988887777',
      accountHolderName: 'HARISH DUBEY',
      password: '123456',
      ifscCode: 'SBIN0000000',
      balance: 100000,
    },
    {
      bankCode: 'HDFC',
      bankName: 'HDFC Bank',
      accountNumber: '999988886666',
      accountHolderName: 'SHIVANI JOSHI',
      password: '123456',
      ifscCode: 'HDFC0000000',
      balance: 500000,
    },
    {
      bankCode: 'ICICI',
      bankName: 'ICICI Bank',
      accountNumber: '999988885555',
      accountHolderName: 'YAMAN SHARMA',
      password: '123456',
      ifscCode: 'ICIC0000000',
      balance: 500000,
    },
    {
      bankCode: 'AXIS',
      bankName: 'Axis Bank',
      accountNumber: '999988884444',
      accountHolderName: 'SHIVANI JOSHI',
      password: '123456',
      ifscCode: 'AXIS0000000',
      balance: 50000,
    },
    {
      bankCode: 'PNB',
      bankName: 'Punjab National Bank',
      accountNumber: '999988883333',
      accountHolderName: 'AISHWARYA MEHER',
      password: '123456',
      ifscCode: 'PNB0000000',
      balance: 50000,
    },
  ];
  
  const CARD_DETAILS = [
    {
      cardNumber: '4111 1111 1111 1111',
      pin: '123456',
      cardType: 'Visa',
      expiryDate: '12/25',
      cvv: '123',
      cardholderName: 'HARISH DUBEY',
      balance: 50000,
    },
    {
      cardNumber: '5111 1111 1111 1118',
      pin: '123456',
      cardType: 'Mastercard',
      expiryDate: '11/24',
      cvv: '456',
      cardholderName: 'SHIVANI JOSHI',
      balance: 50000,
    },
    {
      cardNumber: '3782 8224 6310 005',
      pin: '123456',
      cardType: 'American Express',
      expiryDate: '10/23',
      cvv: '7890',
      cardholderName: 'YAMAN SHARMA',
      balance: 50000,
    },
    {
      cardNumber: '5085 1234 5678 9010',
      pin: '123456',
      cardType: 'RuPay',
      expiryDate: '09/26',
      cvv: '321',
      cardholderName: 'MANISH SAHU',
      balance: 50000,
    },
    {
      cardNumber: '5018 1234 5678 9010',
      pin: '123456',
      cardType: 'Maestro',
      expiryDate: '08/27',
      cvv: '654',
      cardholderName: 'AISHWARYA MEHER',
      balance: 50000,
    },
  ];
  
// Combine all test accounts
export const testAccounts = [
  ...UPI_DETAILS,
  ...BANK_DETAILS,
  ...CARD_DETAILS
];

// Exporting the details for use in other parts of the application
export { UPI_DETAILS, BANK_DETAILS, CARD_DETAILS };