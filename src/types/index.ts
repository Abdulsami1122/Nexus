export type UserRole = 'entrepreneur' | 'investor';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl: string;
  bio: string;
  isOnline?: boolean;
  createdAt: string;
}

export interface Entrepreneur extends User {
  role: 'entrepreneur';
  startupName: string;
  pitchSummary: string;
  fundingNeeded: string;
  industry: string;
  location: string;
  foundedYear: number;
  teamSize: number;
}

export interface Investor extends User {
  role: 'investor';
  investmentInterests: string[];
  investmentStage: string[];
  portfolioCompanies: string[];
  totalInvestments: number;
  minimumInvestment: string;
  maximumInvestment: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  isRead: boolean;
}

export interface ChatConversation {
  id: string;
  participants: string[];
  lastMessage?: Message;
  updatedAt: string;
}

export interface CollaborationRequest {
  id: string;
  investorId: string;
  entrepreneurId: string;
  message: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export interface Document {
  id: string;
  name: string;
  type: string;
  size: string;
  lastModified: string;
  shared: boolean;
  url: string;
  ownerId: string;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role: UserRole) => Promise<void>;
  register: (name: string, email: string, password: string, role: UserRole) => Promise<void>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  updateProfile: (userId: string, updates: Partial<User>) => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface AvailabilitySlot {
  id: string;
  userId: string;
  startTime: string; // ISO date string
  endTime: string; // ISO date string
  dayOfWeek?: number; // 0-6 for recurring slots
  isRecurring: boolean;
  createdAt: string;
}

export interface MeetingRequest {
  id: string;
  requesterId: string;
  requesteeId: string;
  title: string;
  description?: string;
  proposedStartTime: string; // ISO date string
  proposedEndTime: string; // ISO date string
  status: 'pending' | 'accepted' | 'declined' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface Meeting {
  id: string;
  requestId: string;
  participantIds: string[];
  title: string;
  description?: string;
  startTime: string; // ISO date string
  endTime: string; // ISO date string
  location?: string;
  meetingLink?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  createdAt: string;
}

export interface DealDocument {
  id: string;
  dealId: string;
  name: string;
  type: string;
  size: number;
  url: string;
  status: 'draft' | 'in_review' | 'signed';
  uploadedBy: string;
  uploadedAt: string;
  signedBy?: string[];
  signedAt?: string;
  signatureData?: string; // Base64 encoded signature image
}

export interface Deal {
  id: string;
  entrepreneurId: string;
  investorId: string;
  startupName: string;
  amount: string;
  equity: string;
  stage: string;
  status: string;
  documents: DealDocument[];
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'deposit' | 'withdraw' | 'transfer' | 'funding' | 'receipt';
  amount: number;
  currency: string;
  senderId?: string;
  receiverId?: string;
  senderName?: string;
  receiverName?: string;
  dealId?: string;
  dealName?: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Wallet {
  userId: string;
  balance: number;
  currency: string;
  updatedAt: string;
}