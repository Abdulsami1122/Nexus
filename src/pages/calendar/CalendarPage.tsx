import React, { useState, useEffect, useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Calendar, Clock, Plus, Trash2, X } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';
import { 
  getAvailabilitySlots, 
  addAvailabilitySlot, 
  updateAvailabilitySlot, 
  deleteAvailabilitySlot,
  getMeetings,
  getMeetingRequests,
  acceptMeetingRequest,
  declineMeetingRequest,
  sendMeetingRequest
} from '../../data/meetings';
import { AvailabilitySlot, Meeting, MeetingRequest } from '../../types';
import { findUserById, entrepreneurs, investors } from '../../data/users';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export const CalendarPage: React.FC = () => {
  const { user } = useAuth();
  const [availabilitySlots, setAvailabilitySlots] = useState<AvailabilitySlot[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [meetingRequests, setMeetingRequests] = useState<MeetingRequest[]>([]);
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [editingSlot, setEditingSlot] = useState<AvailabilitySlot | null>(null);
  const [requesteeId, setRequesteeId] = useState<string>('');

  // Form state for availability slot
  const [slotForm, setSlotForm] = useState({
    startTime: '',
    endTime: '',
    isRecurring: false,
    dayOfWeek: undefined as number | undefined,
  });

  // Form state for meeting request
  const [requestForm, setRequestForm] = useState({
    title: '',
    description: '',
    proposedStartTime: '',
    proposedEndTime: '',
  });

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = () => {
    if (!user) return;
    
    const slots = getAvailabilitySlots(user.id);
    const userMeetings = getMeetings(user.id);
    const requests = getMeetingRequests(user.id);
    
    setAvailabilitySlots(slots);
    setMeetings(userMeetings);
    setMeetingRequests(requests);
  };

  // Prepare calendar events
  const calendarEvents = useMemo(() => {
    const events: any[] = [];

    // Add availability slots
    availabilitySlots.forEach(slot => {
      events.push({
        id: slot.id,
        title: 'Available',
        start: slot.startTime,
        end: slot.endTime,
        backgroundColor: '#10B981',
        borderColor: '#059669',
        textColor: '#ffffff',
        extendedProps: { type: 'availability', slot },
      });
    });

    // Add confirmed meetings
    meetings.forEach(meeting => {
      events.push({
        id: meeting.id,
        title: meeting.title,
        start: meeting.startTime,
        end: meeting.endTime,
        backgroundColor: '#3B82F6',
        borderColor: '#2563EB',
        textColor: '#ffffff',
        extendedProps: { type: 'meeting', meeting },
      });
    });

    // Add pending meeting requests (as tentative)
    meetingRequests
      .filter(req => req.status === 'pending' && req.requesteeId === user?.id)
      .forEach(request => {
        events.push({
          id: request.id,
          title: `Pending: ${request.title}`,
          start: request.proposedStartTime,
          end: request.proposedEndTime,
          backgroundColor: '#F59E0B',
          borderColor: '#D97706',
          textColor: '#ffffff',
          extendedProps: { type: 'pending-request', request },
        });
      });

    return events;
  }, [availabilitySlots, meetings, meetingRequests, user]);

  const handleDateSelect = (selectInfo: any) => {
    setSlotForm({
      startTime: format(selectInfo.start, "yyyy-MM-dd'T'HH:mm"),
      endTime: format(selectInfo.end || new Date(selectInfo.start.getTime() + 60 * 60 * 1000), "yyyy-MM-dd'T'HH:mm"),
      isRecurring: false,
      dayOfWeek: undefined,
    });
    setEditingSlot(null);
    setShowSlotModal(true);
  };

  const handleEventClick = (clickInfo: any) => {
    const { type, slot, meeting, request } = clickInfo.event.extendedProps;
    
    if (type === 'availability' && slot) {
      setEditingSlot(slot);
      setSlotForm({
        startTime: format(new Date(slot.startTime), "yyyy-MM-dd'T'HH:mm"),
        endTime: format(new Date(slot.endTime), "yyyy-MM-dd'T'HH:mm"),
        isRecurring: slot.isRecurring,
        dayOfWeek: slot.dayOfWeek,
      });
      setShowSlotModal(true);
    } else if (type === 'meeting' && meeting) {
      // Show meeting details
      toast.success(`Meeting: ${meeting.title}`);
    } else if (type === 'pending-request' && request) {
      setSelectedRequest(request);
    }
  };

  const handleSaveSlot = () => {
    if (!user) return;

    if (!slotForm.startTime || !slotForm.endTime) {
      toast.error('Please fill in all required fields');
      return;
    }

    const startDate = new Date(slotForm.startTime);
    const endDate = new Date(slotForm.endTime);

    if (endDate <= startDate) {
      toast.error('End time must be after start time');
      return;
    }

    if (editingSlot) {
      const updated = updateAvailabilitySlot(editingSlot.id, {
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString(),
        isRecurring: slotForm.isRecurring,
        dayOfWeek: slotForm.dayOfWeek,
      });

      if (updated) {
        toast.success('Availability slot updated');
        loadData();
        setShowSlotModal(false);
        setEditingSlot(null);
      }
    } else {
      addAvailabilitySlot({
        userId: user.id,
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString(),
        isRecurring: slotForm.isRecurring,
        dayOfWeek: slotForm.dayOfWeek,
      });
      toast.success('Availability slot added');
      loadData();
      setShowSlotModal(false);
    }

    // Reset form
    setSlotForm({
      startTime: '',
      endTime: '',
      isRecurring: false,
      dayOfWeek: undefined,
    });
  };

  const handleDeleteSlot = () => {
    if (!editingSlot) return;

    if (window.confirm('Are you sure you want to delete this availability slot?')) {
      deleteAvailabilitySlot(editingSlot.id);
      toast.success('Availability slot deleted');
      loadData();
      setShowSlotModal(false);
      setEditingSlot(null);
    }
  };

  const handleSendRequest = () => {
    if (!user || !requesteeId) {
      toast.error('Please select a user to send request to');
      return;
    }

    if (!requestForm.title || !requestForm.proposedStartTime || !requestForm.proposedEndTime) {
      toast.error('Please fill in all required fields');
      return;
    }

    sendMeetingRequest({
      requesterId: user.id,
      requesteeId,
      title: requestForm.title,
      description: requestForm.description,
      proposedStartTime: new Date(requestForm.proposedStartTime).toISOString(),
      proposedEndTime: new Date(requestForm.proposedEndTime).toISOString(),
    });

    toast.success('Meeting request sent');
    loadData();
    setShowRequestModal(false);
    setRequestForm({
      title: '',
      description: '',
      proposedStartTime: '',
      proposedEndTime: '',
    });
    setRequesteeId('');
  };

  const handleAcceptRequest = (requestId: string) => {
    const result = acceptMeetingRequest(requestId);
    if (result) {
      toast.success('Meeting request accepted');
      loadData();
    }
  };

  const handleDeclineRequest = (requestId: string) => {
    if (window.confirm('Are you sure you want to decline this meeting request?')) {
      const result = declineMeetingRequest(requestId);
      if (result) {
        toast.success('Meeting request declined');
        loadData();
      }
    }
  };

  const pendingRequests = meetingRequests.filter(
    req => req.requesteeId === user?.id && req.status === 'pending'
  );

  const upcomingMeetings = meetings
    .filter(m => new Date(m.startTime) > new Date() && m.status === 'scheduled')
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    .slice(0, 5);

  if (!user) return null;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meeting Calendar</h1>
          <p className="text-gray-600">Manage your availability and meetings</p>
        </div>
        <div className="flex gap-2">
          <Button
            leftIcon={<Plus size={18} />}
            onClick={() => {
              setEditingSlot(null);
              setSlotForm({
                startTime: '',
                endTime: '',
                isRecurring: false,
                dayOfWeek: undefined,
              });
              setShowSlotModal(true);
            }}
          >
            Add Availability
          </Button>
          <Button
            variant="secondary"
            leftIcon={<Calendar size={18} />}
            onClick={() => setShowRequestModal(true)}
          >
            Request Meeting
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <Card>
            <CardBody className="p-0">
              <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView="timeGridWeek"
                headerToolbar={{
                  left: 'prev,next today',
                  center: 'title',
                  right: 'dayGridMonth,timeGridWeek,timeGridDay'
                }}
                editable={true}
                selectable={true}
                selectMirror={true}
                dayMaxEvents={true}
                weekends={true}
                select={handleDateSelect}
                eventClick={handleEventClick}
                events={calendarEvents}
                height="auto"
                slotMinTime="06:00:00"
                slotMaxTime="22:00:00"
              />
            </CardBody>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Pending Requests */}
          {pendingRequests.length > 0 && (
            <Card>
              <CardHeader>
                <h2 className="text-lg font-medium text-gray-900">Pending Requests</h2>
              </CardHeader>
              <CardBody className="space-y-3">
                {pendingRequests.map(request => {
                  const requester = findUserById(request.requesterId);
                  return (
                    <div key={request.id} className="p-3 bg-warning-50 rounded-lg border border-warning-200">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium text-gray-900">{request.title}</p>
                          <p className="text-sm text-gray-600">{requester?.name}</p>
                        </div>
                        <Badge variant="warning">Pending</Badge>
                      </div>
                      {request.description && (
                        <p className="text-sm text-gray-600 mb-2">{request.description}</p>
                      )}
                      <div className="flex items-center text-xs text-gray-500 mb-3">
                        <Clock size={14} className="mr-1" />
                        {format(new Date(request.proposedStartTime), 'MMM d, h:mm a')} - {format(new Date(request.proposedEndTime), 'h:mm a')}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="success"
                          onClick={() => handleAcceptRequest(request.id)}
                          className="flex-1"
                        >
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="error"
                          onClick={() => handleDeclineRequest(request.id)}
                          className="flex-1"
                        >
                          Decline
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </CardBody>
            </Card>
          )}

          {/* Upcoming Meetings */}
          {upcomingMeetings.length > 0 && (
            <Card>
              <CardHeader>
                <h2 className="text-lg font-medium text-gray-900">Upcoming Meetings</h2>
              </CardHeader>
              <CardBody className="space-y-3">
                {upcomingMeetings.map(meeting => {
                  const otherParticipants = meeting.participantIds
                    .filter(id => id !== user.id)
                    .map(id => findUserById(id))
                    .filter(Boolean);
                  
                  return (
                    <div key={meeting.id} className="p-3 bg-primary-50 rounded-lg border border-primary-200">
                      <p className="font-medium text-gray-900 mb-1">{meeting.title}</p>
                      <p className="text-sm text-gray-600 mb-2">
                        with {otherParticipants.map(p => p?.name).join(', ')}
                      </p>
                      <div className="flex items-center text-xs text-gray-500">
                        <Clock size={14} className="mr-1" />
                        {format(new Date(meeting.startTime), 'MMM d, h:mm a')} - {format(new Date(meeting.endTime), 'h:mm a')}
                      </div>
                      {meeting.meetingLink && (
                        <a
                          href={meeting.meetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary-600 hover:text-primary-700 mt-2 inline-block"
                        >
                          Join Meeting →
                        </a>
                      )}
                    </div>
                  );
                })}
              </CardBody>
            </Card>
          )}
        </div>
      </div>

      {/* Availability Slot Modal */}
      {showSlotModal && (
        <div className="modal-overlay" onClick={() => setShowSlotModal(false)}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingSlot ? 'Edit Availability' : 'Add Availability Slot'}
              </h2>
              <button
                onClick={() => setShowSlotModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="form-group">
                <label className="form-label">Start Time</label>
                <Input
                  type="datetime-local"
                  value={slotForm.startTime}
                  onChange={(e) => setSlotForm({ ...slotForm, startTime: e.target.value })}
                  fullWidth
                />
              </div>

              <div className="form-group">
                <label className="form-label">End Time</label>
                <Input
                  type="datetime-local"
                  value={slotForm.endTime}
                  onChange={(e) => setSlotForm({ ...slotForm, endTime: e.target.value })}
                  fullWidth
                />
              </div>

              <div className="form-group">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={slotForm.isRecurring}
                    onChange={(e) => setSlotForm({ ...slotForm, isRecurring: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="form-label">Recurring Weekly</span>
                </label>
              </div>

              {slotForm.isRecurring && (
                <div className="form-group">
                  <label className="form-label">Day of Week</label>
                  <select
                    value={slotForm.dayOfWeek ?? ''}
                    onChange={(e) => setSlotForm({ ...slotForm, dayOfWeek: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Select day</option>
                    <option value="0">Sunday</option>
                    <option value="1">Monday</option>
                    <option value="2">Tuesday</option>
                    <option value="3">Wednesday</option>
                    <option value="4">Thursday</option>
                    <option value="5">Friday</option>
                    <option value="6">Saturday</option>
                  </select>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                {editingSlot && (
                  <Button
                    variant="error"
                    onClick={handleDeleteSlot}
                    className="flex-1"
                  >
                    <Trash2 size={16} className="mr-2" />
                    Delete
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => setShowSlotModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveSlot}
                  className="flex-1"
                >
                  {editingSlot ? 'Update' : 'Add'} Slot
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Meeting Request Modal */}
      {showRequestModal && (
        <div className="modal-overlay" onClick={() => setShowRequestModal(false)}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Request Meeting</h2>
              <button
                onClick={() => setShowRequestModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="form-group">
                <label className="form-label">Select User</label>
                <select
                  value={requesteeId}
                  onChange={(e) => setRequesteeId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select a user...</option>
                  {user.role === 'entrepreneur' && (
                    <>
                      {investors.map((inv) => (
                        <option key={inv.id} value={inv.id}>{inv.name}</option>
                      ))}
                    </>
                  )}
                  {user.role === 'investor' && (
                    <>
                      {entrepreneurs.map((ent) => (
                        <option key={ent.id} value={ent.id}>{ent.name}</option>
                      ))}
                    </>
                  )}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Meeting Title *</label>
                <Input
                  value={requestForm.title}
                  onChange={(e) => setRequestForm({ ...requestForm, title: e.target.value })}
                  placeholder="e.g., Investment Discussion"
                  fullWidth
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  value={requestForm.description}
                  onChange={(e) => setRequestForm({ ...requestForm, description: e.target.value })}
                  placeholder="Optional meeting description..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Start Time *</label>
                <Input
                  type="datetime-local"
                  value={requestForm.proposedStartTime}
                  onChange={(e) => setRequestForm({ ...requestForm, proposedStartTime: e.target.value })}
                  fullWidth
                />
              </div>

              <div className="form-group">
                <label className="form-label">End Time *</label>
                <Input
                  type="datetime-local"
                  value={requestForm.proposedEndTime}
                  onChange={(e) => setRequestForm({ ...requestForm, proposedEndTime: e.target.value })}
                  fullWidth
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowRequestModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSendRequest}
                  className="flex-1"
                >
                  Send Request
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
