function parseEventFee(entryFee) {
  if (!entryFee) return 0;
  const raw = String(entryFee).trim().toLowerCase();
  if (raw === 'free' || raw === '0' || raw === '₹0') return 0;
  const match = raw.match(/\d+(?:\.\d+)?/);
  if (!match) return 0;
  const amount = Number(match[0]);
  return Number.isFinite(amount) && amount > 0 ? amount : 0;
}

function verifyPaymentDetails({ event, paymentMode, transactionId, clientAmount, existingRegistrations = [] }) {
  const expectedAmount = parseEventFee(event?.entry_fee);

  if (expectedAmount === 0) {
    if (clientAmount !== undefined && Number(clientAmount) !== 0) {
      return {
        valid: false,
        error: `Payment amount mismatch: Free event requires ₹0, received ₹${clientAmount}`
      };
    }
    return {
      valid: true,
      payment_status: 'free',
      payment_amount: 0,
      payment_mode: 'Free (Institute Sponsored)',
      transaction_id: 'INST-WAIVER-FREE'
    };
  }

  // Never trust client-supplied amount when it disagrees with the authoritative event fee
  if (clientAmount !== undefined && clientAmount !== null && clientAmount !== '') {
    const parsedClient = Number(clientAmount);
    if (!Number.isFinite(parsedClient) || parsedClient !== expectedAmount) {
      return {
        valid: false,
        error: `Payment amount verification failed: Event fee is ₹${expectedAmount}, but ₹${clientAmount} was submitted.`
      };
    }
  }

  const cleanMode = (paymentMode || 'UPI / QR Code').trim();
  const cleanTxn = (transactionId || '').trim().replace(/[\s-]/g, '');

  if (cleanMode === 'Cash at SAC Desk') {
    const deskRef = cleanTxn || `CASH-DESK-${Date.now().toString().slice(-6)}`;
    return {
      valid: true,
      payment_status: 'pending',
      payment_amount: expectedAmount,
      payment_mode: 'Cash at SAC Desk',
      transaction_id: deskRef
    };
  }

  const is12DigitUtr = /^\d{12}$/.test(cleanTxn);
  const isBankRef = /^[A-Za-z0-9/]{10,24}$/.test(cleanTxn);

  if (!cleanTxn || (!is12DigitUtr && !isBankRef)) {
    return {
      valid: false,
      error: 'Valid payment details required: Please provide a valid 12-digit UPI UTR number or Bank Reference ID (10-24 chars).'
    };
  }

  const duplicateUtr = existingRegistrations.find(
    r => r.transaction_id && r.transaction_id.toUpperCase() === cleanTxn.toUpperCase()
  );
  if (duplicateUtr) {
    return {
      valid: false,
      error: 'Duplicate payment reference: This UTR / Transaction ID has already been used for another registration.'
    };
  }

  return {
    valid: true,
    payment_status: 'paid',
    payment_amount: expectedAmount,
    payment_mode: cleanMode,
    transaction_id: cleanTxn.toUpperCase()
  };
}

module.exports = {
  parseEventFee,
  verifyPaymentDetails
};
