import React, { useState, useEffect } from 'react';
import { 
  Wallet, ArrowDownCircle, ArrowUpCircle, ArrowRightLeft, 
  DollarSign, TrendingUp, Clock, CheckCircle, X, 
  CreditCard, Building2, User, Search, Filter, Download
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';
import { Transaction, Wallet as WalletType } from '../../types';
import { 
  getWallet, 
  getTransactions, 
  deposit, 
  withdraw, 
  transfer,
  fundDeal
} from '../../data/payments';
import { findUserById, entrepreneurs, investors } from '../../data/users';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

type PaymentAction = 'deposit' | 'withdraw' | 'transfer' | 'fund';

export const PaymentPage: React.FC = () => {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<WalletType | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeAction, setActiveAction] = useState<PaymentAction | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  // Form states
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [selectedReceiver, setSelectedReceiver] = useState('');
  const [selectedDeal, setSelectedDeal] = useState('');

  // Mock deals for funding
  const mockDeals = [
    { id: 'deal-1', name: 'TechWave AI', entrepreneurId: 'e1', amount: '$1.5M' },
    { id: 'deal-2', name: 'GreenLife Solutions', entrepreneurId: 'e2', amount: '$2M' },
    { id: 'deal-3', name: 'HealthPulse', entrepreneurId: 'e3', amount: '$800K' },
  ];

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = () => {
    if (!user) return;
    
    const userWallet = getWallet(user.id);
    const userTransactions = getTransactions(user.id);
    
    setWallet(userWallet);
    setTransactions(userTransactions);
  };

  const handleDeposit = () => {
    if (!user || !amount) {
      toast.error('Please enter an amount');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    const result = deposit(user.id, amountNum, description || 'Deposit');
    if (result) {
      toast.success(`Successfully deposited $${amountNum.toLocaleString()}`);
      loadData();
      setActiveAction(null);
      setAmount('');
      setDescription('');
    }
  };

  const handleWithdraw = () => {
    if (!user || !amount) {
      toast.error('Please enter an amount');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    const wallet = getWallet(user.id);
    if (!wallet || wallet.balance < amountNum) {
      toast.error('Insufficient balance');
      return;
    }

    const result = withdraw(user.id, amountNum, description || 'Withdrawal');
    if (result) {
      toast.success(`Successfully withdrew $${amountNum.toLocaleString()}`);
      loadData();
      setActiveAction(null);
      setAmount('');
      setDescription('');
    }
  };

  const handleTransfer = () => {
    if (!user || !amount || !selectedReceiver) {
      toast.error('Please fill in all fields');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    const wallet = getWallet(user.id);
    if (!wallet || wallet.balance < amountNum) {
      toast.error('Insufficient balance');
      return;
    }

    const result = transfer(user.id, selectedReceiver, amountNum, description || 'Transfer');
    if (result) {
      const receiver = findUserById(selectedReceiver);
      toast.success(`Successfully transferred $${amountNum.toLocaleString()} to ${receiver?.name}`);
      loadData();
      setActiveAction(null);
      setAmount('');
      setDescription('');
      setSelectedReceiver('');
    }
  };

  const handleFundDeal = () => {
    if (!user || !amount || !selectedDeal) {
      toast.error('Please fill in all fields');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    const wallet = getWallet(user.id);
    if (!wallet || wallet.balance < amountNum) {
      toast.error('Insufficient balance');
      return;
    }

    const deal = mockDeals.find(d => d.id === selectedDeal);
    if (!deal) {
      toast.error('Invalid deal selected');
      return;
    }

    const result = fundDeal(user.id, deal.entrepreneurId, deal.id, deal.name, amountNum);
    if (result) {
      toast.success(`Successfully funded ${deal.name} with $${amountNum.toLocaleString()}`);
      loadData();
      setActiveAction(null);
      setAmount('');
      setSelectedDeal('');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getStatusBadge = (status: Transaction['status']) => {
    switch (status) {
      case 'completed':
        return <Badge variant="success"><CheckCircle size={12} className="mr-1" />Completed</Badge>;
      case 'pending':
        return <Badge variant="accent"><Clock size={12} className="mr-1" />Pending</Badge>;
      case 'failed':
        return <Badge variant="error"><X size={12} className="mr-1" />Failed</Badge>;
      case 'cancelled':
        return <Badge variant="gray">Cancelled</Badge>;
      default:
        return <Badge variant="gray">{status}</Badge>;
    }
  };

  const getTransactionIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'deposit':
        return <ArrowDownCircle className="text-success-600" size={20} />;
      case 'withdraw':
        return <ArrowUpCircle className="text-error-600" size={20} />;
      case 'transfer':
        return <ArrowRightLeft className="text-primary-600" size={20} />;
      case 'funding':
        return <Building2 className="text-secondary-600" size={20} />;
      case 'receipt':
        return <DollarSign className="text-success-600" size={20} />;
      default:
        return <DollarSign size={20} />;
    }
  };

  const filteredTransactions = transactions.filter(txn => {
    const matchesSearch = searchQuery === '' || 
      txn.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      txn.dealName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      txn.senderName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      txn.receiverName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || txn.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  if (!user) return null;

  const isInvestor = user.role === 'investor';
  const availableUsers = isInvestor ? entrepreneurs : investors;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payments & Wallet</h1>
          <p className="text-gray-600">Manage your transactions and wallet balance</p>
        </div>
      </div>

      {/* Wallet Balance Card */}
      <Card className="bg-gradient-to-br from-primary-600 to-primary-800 text-white">
        <CardBody className="p-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-primary-100 text-sm font-medium mb-2">Wallet Balance</p>
              <h2 className="text-4xl font-bold mb-1">
                {wallet ? formatCurrency(wallet.balance) : '$0'}
              </h2>
              <p className="text-primary-200 text-sm">
                Last updated {wallet ? format(new Date(wallet.updatedAt), 'MMM d, yyyy') : 'N/A'}
              </p>
            </div>
            <div className="p-4 bg-white bg-opacity-20 rounded-full">
              <Wallet size={48} className="text-white" />
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Button
          variant="outline"
          leftIcon={<ArrowDownCircle size={18} />}
          onClick={() => setActiveAction('deposit')}
          className="h-auto py-4 flex-col"
        >
          <span className="font-semibold">Deposit</span>
          <span className="text-xs text-gray-500 mt-1">Add funds</span>
        </Button>
        <Button
          variant="outline"
          leftIcon={<ArrowUpCircle size={18} />}
          onClick={() => setActiveAction('withdraw')}
          className="h-auto py-4 flex-col"
        >
          <span className="font-semibold">Withdraw</span>
          <span className="text-xs text-gray-500 mt-1">Remove funds</span>
        </Button>
        <Button
          variant="outline"
          leftIcon={<ArrowRightLeft size={18} />}
          onClick={() => setActiveAction('transfer')}
          className="h-auto py-4 flex-col"
        >
          <span className="font-semibold">Transfer</span>
          <span className="text-xs text-gray-500 mt-1">Send money</span>
        </Button>
        {isInvestor && (
          <Button
            variant="outline"
            leftIcon={<Building2 size={18} />}
            onClick={() => setActiveAction('fund')}
            className="h-auto py-4 flex-col"
          >
            <span className="font-semibold">Fund Deal</span>
            <span className="text-xs text-gray-500 mt-1">Invest in startup</span>
          </Button>
        )}
      </div>

      {/* Action Modals */}
      {activeAction && (
        <Card>
          <CardHeader className="flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">
              {activeAction === 'deposit' && 'Deposit Funds'}
              {activeAction === 'withdraw' && 'Withdraw Funds'}
              {activeAction === 'transfer' && 'Transfer Funds'}
              {activeAction === 'fund' && 'Fund Deal'}
            </h2>
            <button
              onClick={() => {
                setActiveAction(null);
                setAmount('');
                setDescription('');
                setSelectedReceiver('');
                setSelectedDeal('');
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              {activeAction === 'fund' && (
                <div className="form-group">
                  <label className="form-label">Select Deal</label>
                  <select
                    value={selectedDeal}
                    onChange={(e) => setSelectedDeal(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Select a deal...</option>
                    {mockDeals.map(deal => (
                      <option key={deal.id} value={deal.id}>
                        {deal.name} - {deal.amount}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              {activeAction === 'transfer' && (
                <div className="form-group">
                  <label className="form-label">Transfer To</label>
                  <select
                    value={selectedReceiver}
                    onChange={(e) => setSelectedReceiver(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Select a user...</option>
                    {availableUsers.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.name} {u.role === 'entrepreneur' ? `(${u.startupName})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Amount (USD)</label>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  fullWidth
                  startAdornment={<DollarSign size={18} />}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description (Optional)</label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add a note..."
                  fullWidth
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setActiveAction(null);
                    setAmount('');
                    setDescription('');
                    setSelectedReceiver('');
                    setSelectedDeal('');
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (activeAction === 'deposit') handleDeposit();
                    if (activeAction === 'withdraw') handleWithdraw();
                    if (activeAction === 'transfer') handleTransfer();
                    if (activeAction === 'fund') handleFundDeal();
                  }}
                  className="flex-1"
                >
                  {activeAction === 'deposit' && 'Deposit'}
                  {activeAction === 'withdraw' && 'Withdraw'}
                  {activeAction === 'transfer' && 'Transfer'}
                  {activeAction === 'fund' && 'Fund Deal'}
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <h2 className="text-lg font-medium text-gray-900">Transaction History</h2>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  placeholder="Search transactions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  startAdornment={<Search size={18} />}
                  className="w-full sm:w-64"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardBody>
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">No transactions found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {isInvestor ? 'Sent To' : 'Received From'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredTransactions.map(txn => (
                    <tr key={txn.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getTransactionIcon(txn.type)}
                          <span className="ml-2 text-sm font-medium text-gray-900 capitalize">
                            {txn.type}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-semibold ${
                          txn.amount > 0 ? 'text-success-600' : 'text-gray-900'
                        }`}>
                          {txn.amount > 0 ? '+' : ''}{formatCurrency(txn.amount)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {txn.type === 'funding' || txn.type === 'transfer' ? (
                            txn.receiverName || 'N/A'
                          ) : txn.type === 'receipt' ? (
                            txn.senderName || 'N/A'
                          ) : (
                            '-'
                          )}
                        </div>
                        {txn.dealName && (
                          <div className="text-xs text-gray-500">{txn.dealName}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{txn.description || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(txn.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(new Date(txn.createdAt), 'MMM d, yyyy HH:mm')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
};
