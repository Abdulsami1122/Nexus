import { Transaction, Wallet } from '../types';

// Mock wallet data
let wallets: Wallet[] = [
  {
    userId: 'i1',
    balance: 5000000, // $5M
    currency: 'USD',
    updatedAt: new Date().toISOString(),
  },
  {
    userId: 'i2',
    balance: 3000000, // $3M
    currency: 'USD',
    updatedAt: new Date().toISOString(),
  },
  {
    userId: 'i3',
    balance: 8000000, // $8M
    currency: 'USD',
    updatedAt: new Date().toISOString(),
  },
  {
    userId: 'e1',
    balance: 150000, // $150K
    currency: 'USD',
    updatedAt: new Date().toISOString(),
  },
  {
    userId: 'e2',
    balance: 200000, // $200K
    currency: 'USD',
    updatedAt: new Date().toISOString(),
  },
  {
    userId: 'e3',
    balance: 80000, // $80K
    currency: 'USD',
    updatedAt: new Date().toISOString(),
  },
];

// Mock transactions
let transactions: Transaction[] = [
  {
    id: 'txn-1',
    userId: 'i1',
    type: 'deposit',
    amount: 1000000,
    currency: 'USD',
    status: 'completed',
    description: 'Bank transfer deposit',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'txn-2',
    userId: 'i1',
    type: 'funding',
    amount: 1500000,
    currency: 'USD',
    receiverId: 'e1',
    receiverName: 'Sarah Johnson',
    dealId: 'deal-1',
    dealName: 'TechWave AI',
    status: 'completed',
    description: 'Investment funding',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'txn-3',
    userId: 'e1',
    type: 'receipt',
    amount: 1500000,
    currency: 'USD',
    senderId: 'i1',
    senderName: 'Michael Rodriguez',
    dealId: 'deal-1',
    dealName: 'TechWave AI',
    status: 'completed',
    description: 'Investment received',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'txn-4',
    userId: 'i2',
    type: 'funding',
    amount: 2000000,
    currency: 'USD',
    receiverId: 'e2',
    receiverName: 'David Chen',
    dealId: 'deal-2',
    dealName: 'GreenLife Solutions',
    status: 'completed',
    description: 'Investment funding',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'txn-5',
    userId: 'e2',
    type: 'receipt',
    amount: 2000000,
    currency: 'USD',
    senderId: 'i2',
    senderName: 'Jennifer Lee',
    dealId: 'deal-2',
    dealName: 'GreenLife Solutions',
    status: 'completed',
    description: 'Investment received',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// Wallet Functions
export const getWallet = (userId: string): Wallet | null => {
  return wallets.find(w => w.userId === userId) || null;
};

export const updateWalletBalance = (userId: string, amount: number): Wallet | null => {
  const wallet = wallets.find(w => w.userId === userId);
  if (!wallet) return null;
  
  wallet.balance += amount;
  wallet.updatedAt = new Date().toISOString();
  return wallet;
};

// Transaction Functions
export const getTransactions = (userId: string): Transaction[] => {
  return transactions
    .filter(txn => txn.userId === userId || txn.senderId === userId || txn.receiverId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const createTransaction = (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Transaction => {
  const newTransaction: Transaction = {
    ...transaction,
    id: `txn-${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  transactions.unshift(newTransaction);
  return newTransaction;
};

export const deposit = (userId: string, amount: number, description?: string): { transaction: Transaction; wallet: Wallet } | null => {
  const wallet = updateWalletBalance(userId, amount);
  if (!wallet) return null;
  
  const transaction = createTransaction({
    userId,
    type: 'deposit',
    amount,
    currency: 'USD',
    status: 'completed',
    description: description || 'Deposit',
  });
  
  return { transaction, wallet };
};

export const withdraw = (userId: string, amount: number, description?: string): { transaction: Transaction; wallet: Wallet } | null => {
  const wallet = getWallet(userId);
  if (!wallet || wallet.balance < amount) return null;
  
  const updatedWallet = updateWalletBalance(userId, -amount);
  if (!updatedWallet) return null;
  
  const transaction = createTransaction({
    userId,
    type: 'withdraw',
    amount: -amount,
    currency: 'USD',
    status: 'completed',
    description: description || 'Withdrawal',
  });
  
  return { transaction, wallet: updatedWallet };
};

export const transfer = (senderId: string, receiverId: string, amount: number, description?: string): { transaction: Transaction; senderWallet: Wallet; receiverWallet: Wallet } | null => {
  const senderWallet = getWallet(senderId);
  if (!senderWallet || senderWallet.balance < amount) return null;
  
  const receiverWallet = getWallet(receiverId);
  if (!receiverWallet) return null;
  
  updateWalletBalance(senderId, -amount);
  updateWalletBalance(receiverId, amount);
  
  const senderUpdated = getWallet(senderId);
  const receiverUpdated = getWallet(receiverId);
  
  if (!senderUpdated || !receiverUpdated) return null;
  
  const transaction = createTransaction({
    userId: senderId,
    type: 'transfer',
    amount: -amount,
    currency: 'USD',
    receiverId,
    status: 'completed',
    description: description || 'Transfer',
  });
  
  // Create receipt transaction for receiver
  createTransaction({
    userId: receiverId,
    type: 'transfer',
    amount,
    currency: 'USD',
    senderId,
    status: 'completed',
    description: description || 'Transfer received',
  });
  
  return { transaction, senderWallet: senderUpdated, receiverWallet: receiverUpdated };
};

export const fundDeal = (investorId: string, entrepreneurId: string, dealId: string, dealName: string, amount: number): { transaction: Transaction; receipt: Transaction; investorWallet: Wallet; entrepreneurWallet: Wallet } | null => {
  const investorWallet = getWallet(investorId);
  if (!investorWallet || investorWallet.balance < amount) return null;
  
  const entrepreneurWallet = getWallet(entrepreneurId);
  if (!entrepreneurWallet) return null;
  
  updateWalletBalance(investorId, -amount);
  updateWalletBalance(entrepreneurId, amount);
  
  const investorUpdated = getWallet(investorId);
  const entrepreneurUpdated = getWallet(entrepreneurId);
  
  if (!investorUpdated || !entrepreneurUpdated) return null;
  
  const transaction = createTransaction({
    userId: investorId,
    type: 'funding',
    amount: -amount,
    currency: 'USD',
    receiverId: entrepreneurId,
    dealId,
    dealName,
    status: 'completed',
    description: `Funding for ${dealName}`,
  });
  
  const receipt = createTransaction({
    userId: entrepreneurId,
    type: 'receipt',
    amount,
    currency: 'USD',
    senderId: investorId,
    dealId,
    dealName,
    status: 'completed',
    description: `Investment received for ${dealName}`,
  });
  
  return { transaction, receipt, investorWallet: investorUpdated, entrepreneurWallet: entrepreneurUpdated };
};
