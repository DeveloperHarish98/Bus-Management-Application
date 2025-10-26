// Payment accounts data with balances
export const paymentAccounts = {
  // UPI Accounts
  upi: [
    { 
      id: '1',
      type: 'UPI',
      upiId: '8962385837@upi',
      app: 'Google Pay',
      balance: 100000,
      name: 'Primary UPI'
    },
    {
      id: '2',
      type: 'UPI',
      upiId: '8448724081@upi',
      app: 'PhonePe',
      balance: 100000,
      name: 'Secondary UPI'
    },
    {
      id: '3',
      type: 'UPI',
      upiId: '8074775861@upi',
      app: 'Paytm',
      balance: 100000,
      name: 'Paytm UPI'
    }
  ],
  
  // Credit/Debit Cards
  cards: [
    {
      id: '1',
      type: 'CARD',
      cardNumber: '4111111111111111',
      cardType: 'VISA',
      name: 'AISHWARYA MEHER',
      expiry: '12/25',
      cvv: '123',
      balance: 50000,
      bank: 'HDFC Bank'
    },
    {
      id: '2',
      type: 'CARD',
      cardNumber: '5555555555554444',
      cardType: 'MASTERCARD',
      name: 'AISHWARYA MEHER',
      expiry: '06/26',
      cvv: '456',
      balance: 75000,
      bank: 'ICICI Bank'
    }
  ],
  
  // Net Banking Accounts
  banks: [
    {
      id: '1',
      type: 'BANK',
      accountNumber: '1234567890',
      ifsc: 'HDFC0001234',
      name: 'AISHWARYA MEHER',
      bank: 'HDFC Bank',
      balance: 150000,
      branch: 'Mumbai Main'
    },
    {
      id: '2',
      type: 'BANK',
      accountNumber: '0987654321',
      ifsc: 'ICIC0005678',
      name: 'AISHWARYA MEHER',
      bank: 'ICICI Bank',
      balance: 200000,
      branch: 'Delhi Main'
    }
  ]
};

// Helper functions
export const getAccountById = (type, id) => {
  return paymentAccounts[type]?.find(account => account.id === id);
};

export const validateBalance = (type, id, amount) => {
  const account = getAccountById(type, id);
  if (!account) return false;
  return account.balance >= amount;
};

export const processPayment = (type, id, amount) => {
  const account = getAccountById(type, id);
  if (!account || account.balance < amount) {
    return { success: false, message: 'Insufficient balance' };
  }
  
  // In a real app, this would be an API call
  account.balance -= amount;
  return { 
    success: true, 
    transactionId: `TXN${Date.now()}`,
    remainingBalance: account.balance
  };
};