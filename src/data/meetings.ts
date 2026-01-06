import { AvailabilitySlot, MeetingRequest, Meeting } from '../types';

// Mock availability slots
let availabilitySlots: AvailabilitySlot[] = [
  {
    id: 'avail-1',
    userId: 'user-1',
    startTime: new Date('2024-01-15T09:00:00').toISOString(),
    endTime: new Date('2024-01-15T17:00:00').toISOString(),
    isRecurring: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'avail-2',
    userId: 'user-1',
    startTime: new Date('2024-01-16T10:00:00').toISOString(),
    endTime: new Date('2024-01-16T12:00:00').toISOString(),
    dayOfWeek: 2, // Tuesday
    isRecurring: true,
    createdAt: new Date().toISOString(),
  },
];

// Mock meeting requests
let meetingRequests: MeetingRequest[] = [
  {
    id: 'req-1',
    requesterId: 'user-2',
    requesteeId: 'user-1',
    title: 'Investment Discussion',
    description: 'Would like to discuss potential investment opportunities',
    proposedStartTime: new Date('2024-01-20T14:00:00').toISOString(),
    proposedEndTime: new Date('2024-01-20T15:00:00').toISOString(),
    status: 'pending',
    createdAt: new Date('2024-01-10T10:00:00').toISOString(),
    updatedAt: new Date('2024-01-10T10:00:00').toISOString(),
  },
  {
    id: 'req-2',
    requesterId: 'user-1',
    requesteeId: 'user-3',
    title: 'Startup Pitch Meeting',
    description: 'Presenting our startup idea and seeking feedback',
    proposedStartTime: new Date('2024-01-18T11:00:00').toISOString(),
    proposedEndTime: new Date('2024-01-18T12:00:00').toISOString(),
    status: 'accepted',
    createdAt: new Date('2024-01-08T09:00:00').toISOString(),
    updatedAt: new Date('2024-01-09T14:00:00').toISOString(),
  },
];

// Mock confirmed meetings
let meetings: Meeting[] = [
  {
    id: 'meeting-1',
    requestId: 'req-2',
    participantIds: ['user-1', 'user-3'],
    title: 'Startup Pitch Meeting',
    description: 'Presenting our startup idea and seeking feedback',
    startTime: new Date('2024-01-18T11:00:00').toISOString(),
    endTime: new Date('2024-01-18T12:00:00').toISOString(),
    location: 'Virtual',
    meetingLink: 'https://meet.example.com/abc123',
    status: 'scheduled',
    createdAt: new Date('2024-01-09T14:00:00').toISOString(),
  },
];

// Availability Slot Functions
export const getAvailabilitySlots = (userId: string): AvailabilitySlot[] => {
  return availabilitySlots.filter(slot => slot.userId === userId);
};

export const addAvailabilitySlot = (slot: Omit<AvailabilitySlot, 'id' | 'createdAt'>): AvailabilitySlot => {
  const newSlot: AvailabilitySlot = {
    ...slot,
    id: `avail-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  availabilitySlots.push(newSlot);
  return newSlot;
};

export const updateAvailabilitySlot = (slotId: string, updates: Partial<AvailabilitySlot>): AvailabilitySlot | null => {
  const index = availabilitySlots.findIndex(slot => slot.id === slotId);
  if (index === -1) return null;
  
  availabilitySlots[index] = { ...availabilitySlots[index], ...updates };
  return availabilitySlots[index];
};

export const deleteAvailabilitySlot = (slotId: string): boolean => {
  const index = availabilitySlots.findIndex(slot => slot.id === slotId);
  if (index === -1) return false;
  
  availabilitySlots.splice(index, 1);
  return true;
};

// Meeting Request Functions
export const getMeetingRequests = (userId: string): MeetingRequest[] => {
  return meetingRequests.filter(
    req => req.requesterId === userId || req.requesteeId === userId
  );
};

export const getPendingRequests = (userId: string): MeetingRequest[] => {
  return meetingRequests.filter(
    req => req.requesteeId === userId && req.status === 'pending'
  );
};

export const sendMeetingRequest = (request: Omit<MeetingRequest, 'id' | 'createdAt' | 'updatedAt' | 'status'>): MeetingRequest => {
  const newRequest: MeetingRequest = {
    ...request,
    id: `req-${Date.now()}`,
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  meetingRequests.push(newRequest);
  return newRequest;
};

export const acceptMeetingRequest = (requestId: string): { request: MeetingRequest; meeting: Meeting } | null => {
  const request = meetingRequests.find(req => req.id === requestId);
  if (!request || request.status !== 'pending') return null;
  
  request.status = 'accepted';
  request.updatedAt = new Date().toISOString();
  
  const meeting: Meeting = {
    id: `meeting-${Date.now()}`,
    requestId: request.id,
    participantIds: [request.requesterId, request.requesteeId],
    title: request.title,
    description: request.description,
    startTime: request.proposedStartTime,
    endTime: request.proposedEndTime,
    status: 'scheduled',
    createdAt: new Date().toISOString(),
  };
  
  meetings.push(meeting);
  return { request, meeting };
};

export const declineMeetingRequest = (requestId: string): MeetingRequest | null => {
  const request = meetingRequests.find(req => req.id === requestId);
  if (!request || request.status !== 'pending') return null;
  
  request.status = 'declined';
  request.updatedAt = new Date().toISOString();
  return request;
};

// Meeting Functions
export const getMeetings = (userId: string): Meeting[] => {
  return meetings.filter(meeting => meeting.participantIds.includes(userId));
};

export const getUpcomingMeetings = (userId: string): Meeting[] => {
  const now = new Date();
  return meetings.filter(
    meeting => 
      meeting.participantIds.includes(userId) &&
      meeting.status === 'scheduled' &&
      new Date(meeting.startTime) > now
  ).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
};

export const cancelMeeting = (meetingId: string): Meeting | null => {
  const meeting = meetings.find(m => m.id === meetingId);
  if (!meeting || meeting.status !== 'scheduled') return null;
  
  meeting.status = 'cancelled';
  
  // Also update the related request
  const request = meetingRequests.find(req => req.id === meeting.requestId);
  if (request) {
    request.status = 'cancelled';
    request.updatedAt = new Date().toISOString();
  }
  
  return meeting;
};
