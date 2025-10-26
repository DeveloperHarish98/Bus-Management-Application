import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, TextField, MenuItem, Paper, Divider, FormControl, InputLabel, Select } from '@mui/material';
import { paymentAccounts, validateBalance, processPayment } from '../data/accounts';

const PaymentMethod = ({ amount, onPaymentSuccess, onPaymentError }) => {
  const [selectedMethod, setSelectedMethod] = useState('');
  const [selectedAccount, setSelectedAccount] = useState('');
  const [accounts, setAccounts] = useState([]);
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Update accounts when payment method changes
  useEffect(() => {
    if (selectedMethod && paymentAccounts[selectedMethod]) {
      setAccounts(paymentAccounts[selectedMethod]);
      setSelectedAccount('');
    }
  }, [selectedMethod]);

  const handlePayment = async () => {
    if (!selectedMethod || !selectedAccount) {
      setError('Please select a payment method and account');
      return;
    }

    if (!validateBalance(selectedMethod, selectedAccount, amount)) {
      setError('Insufficient balance for this transaction');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const result = processPayment(selectedMethod, selectedAccount, amount);
      
      if (result.success) {
        onPaymentSuccess({
          method: selectedMethod,
          transactionId: result.transactionId,
          amount,
          status: 'PAYMENT_DONE'
        });
      } else {
        throw new Error(result.message || 'Payment failed');
      }
    } catch (err) {
      setError(err.message || 'Payment processing failed');
      onPaymentError(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
      <Typography variant="h6" gutterBottom>Select Payment Method</Typography>
      
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Payment Method</InputLabel>
        <Select
          value={selectedMethod}
          onChange={(e) => setSelectedMethod(e.target.value)}
          label="Payment Method"
        >
          <MenuItem value="">Select a payment method</MenuItem>
          <MenuItem value="upi">UPI</MenuItem>
          <MenuItem value="cards">Credit/Debit Card</MenuItem>
          <MenuItem value="banks">Net Banking</MenuItem>
        </Select>
      </FormControl>

      {selectedMethod && (
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Select Account</InputLabel>
          <Select
            value={selectedAccount}
            onChange={(e) => setSelectedAccount(e.target.value)}
            label="Select Account"
          >
            <MenuItem value="">Select an account</MenuItem>
            {accounts.map((account) => (
              <MenuItem key={account.id} value={account.id}>
                {account.name} - {account.type === 'CARD' 
                  ? `•••• ${account.cardNumber.slice(-4)} (${account.cardType})` 
                  : account.upiId || `${account.bank} (${account.accountNumber})`}
                {' '}- ₹{account.balance.toLocaleString()}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      <Button
        fullWidth
        variant="contained"
        color="primary"
        onClick={handlePayment}
        disabled={!selectedAccount || isProcessing || amount <= 0}
        sx={{ mt: 2 }}
      >
        {isProcessing ? 'Processing...' : `Pay ₹${amount}`}
      </Button>

      <Box sx={{ mt: 2, textAlign: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          Your payment is secured with 256-bit SSL encryption
        </Typography>
      </Box>
    </Paper>
  );
};

export default PaymentMethod;
