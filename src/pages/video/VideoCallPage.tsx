import React, { useState, useRef, useEffect } from 'react';
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff, Monitor, X, Users } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardBody } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';
import { findUserById } from '../../data/users';
import toast from 'react-hot-toast';

type CallType = 'audio' | 'video';

export const VideoCallPage: React.FC = () => {
  const { user } = useAuth();
  const [isCallActive, setIsCallActive] = useState(false);
  const [callType, setCallType] = useState<CallType>('video');
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [remoteParticipant, setRemoteParticipant] = useState<string | null>(null);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Mock participants - in real app, this would come from props or state
  const [participants] = useState([
    { id: 'user-2', name: 'Michael Rodriguez', avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg' },
    { id: 'user-3', name: 'Jennifer Lee', avatar: 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg' },
  ]);

  useEffect(() => {
    if (isCallActive) {
      // Start call timer
      callTimerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);

      // Mock video stream setup (only for video calls)
      if (callType === 'video') {
        if (localVideoRef.current) {
          // Create a mock video stream (colored canvas as placeholder)
          const canvas = document.createElement('canvas');
          canvas.width = 640;
          canvas.height = 480;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = '#1E40AF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '24px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(user?.name || 'You', canvas.width / 2, canvas.height / 2);
          }
          const stream = canvas.captureStream(30);
          localVideoRef.current.srcObject = stream;
        }

        if (remoteVideoRef.current && remoteParticipant) {
          // Mock remote video stream
          const canvas = document.createElement('canvas');
          canvas.width = 640;
          canvas.height = 480;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            const participant = participants.find(p => p.id === remoteParticipant);
            ctx.fillStyle = '#059669';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '24px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(participant?.name || 'Remote User', canvas.width / 2, canvas.height / 2);
          }
          const stream = canvas.captureStream(30);
          remoteVideoRef.current.srcObject = stream;
        }
      }
    } else {
      // Clean up
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
        callTimerRef.current = null;
      }
      setCallDuration(0);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null;
      }
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }
    }

    return () => {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
      }
    };
  }, [isCallActive, callType, remoteParticipant, user, participants]);

  const handleStartCall = (participantId: string, type: CallType) => {
    setCallType(type);
    setRemoteParticipant(participantId);
    setIsCallActive(true);
    setIsVideoEnabled(type === 'video');
    toast.success(`${type === 'video' ? 'Video' : 'Audio'} call started`);
  };

  const handleEndCall = () => {
    setIsCallActive(false);
    setRemoteParticipant(null);
    setIsScreenSharing(false);
    setCallType('video'); // Reset to default
    toast.success('Call ended');
  };

  const toggleVideo = () => {
    setIsVideoEnabled(!isVideoEnabled);
    if (localVideoRef.current) {
      localVideoRef.current.style.opacity = isVideoEnabled ? '0.5' : '1';
    }
    toast.success(isVideoEnabled ? 'Video disabled' : 'Video enabled');
  };

  const toggleAudio = () => {
    setIsAudioEnabled(!isAudioEnabled);
    toast.success(isAudioEnabled ? 'Audio muted' : 'Audio unmuted');
  };

  const toggleScreenShare = () => {
    if (!isScreenSharing) {
      // Mock screen share - in real app, would use getDisplayMedia()
      toast.success('Screen sharing started');
      setIsScreenSharing(true);
    } else {
      toast.success('Screen sharing stopped');
      setIsScreenSharing(false);
    }
  };

  const formatCallDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!user) return null;

  const currentParticipant = remoteParticipant 
    ? participants.find(p => p.id === remoteParticipant)
    : null;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calls</h1>
          <p className="text-gray-600">Connect with your business partners via audio or video</p>
        </div>
      </div>

      {!isCallActive ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {participants.map(participant => (
            <Card key={participant.id} className="card-interactive">
              <CardBody className="p-6">
                <div className="flex flex-col items-center text-center space-y-4">
                  <Avatar
                    src={participant.avatar}
                    alt={participant.name}
                    size="lg"
                    className="w-24 h-24"
                  />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{participant.name}</h3>
                    <Badge variant="success" className="mt-2">
                      Available
                    </Badge>
                  </div>
                  <div className="flex gap-2 w-full">
                    <Button
                      leftIcon={<Phone size={18} />}
                      onClick={() => handleStartCall(participant.id, 'audio')}
                      variant="outline"
                      className="flex-1"
                    >
                      Audio Call
                    </Button>
                    <Button
                      leftIcon={<Video size={18} />}
                      onClick={() => handleStartCall(participant.id, 'video')}
                      className="flex-1"
                    >
                      Video Call
                    </Button>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      ) : (
        <div className="relative">
          {/* Call Interface */}
          <Card className="overflow-hidden">
            <CardBody className="p-0">
              {callType === 'video' ? (
                <div className="relative bg-gray-900 aspect-video">
                  {/* Remote Video */}
                  <div className="absolute inset-0">
                    {isVideoEnabled ? (
                      <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover"
                        muted={!isAudioEnabled}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-800">
                        <div className="text-center">
                          <Avatar
                            src={currentParticipant?.avatar}
                            alt={currentParticipant?.name || 'Participant'}
                            size="xl"
                            className="w-32 h-32 mx-auto mb-4"
                          />
                          <p className="text-white text-xl font-semibold">
                            {currentParticipant?.name || 'Participant'}
                          </p>
                          <p className="text-gray-400 mt-2">Video is off</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Local Video (Picture-in-Picture) */}
                  <div className="absolute bottom-4 right-4 w-48 h-36 rounded-lg overflow-hidden border-2 border-white shadow-lg bg-gray-800">
                    {isVideoEnabled ? (
                      <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="text-center">
                          <Avatar
                            src={user.avatarUrl}
                            alt={user.name}
                            size="md"
                            className="w-16 h-16 mx-auto mb-2"
                          />
                          <p className="text-white text-sm">You</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Call Info Overlay */}
                  <div className="absolute top-4 left-4 bg-black bg-opacity-50 rounded-lg px-4 py-2">
                    <div className="flex items-center space-x-2 text-white">
                      <Users size={16} />
                      <span className="text-sm font-medium">
                        {currentParticipant?.name || 'Participant'}
                      </span>
                      <Badge variant="success" className="ml-2">
                        {formatCallDuration(callDuration)}
                      </Badge>
                    </div>
                  </div>
                </div>
              ) : (
                // Audio Call Interface
                <div className="relative bg-gradient-to-br from-primary-600 to-primary-800 aspect-video">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="mb-8">
                        <Avatar
                          src={currentParticipant?.avatar}
                          alt={currentParticipant?.name || 'Participant'}
                          size="xl"
                          className="w-40 h-40 mx-auto mb-6 border-4 border-white shadow-xl"
                        />
                        <h3 className="text-white text-2xl font-semibold mb-2">
                          {currentParticipant?.name || 'Participant'}
                        </h3>
                        <p className="text-primary-100">Audio Call</p>
                      </div>
                      
                      {/* Call Info */}
                      <div className="bg-black bg-opacity-30 rounded-lg px-6 py-3 inline-block">
                        <div className="flex items-center space-x-3 text-white">
                          <Phone size={20} />
                          <span className="font-medium">
                            {formatCallDuration(callDuration)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Call Controls */}
          <div className="flex justify-center items-center space-x-4 mt-6">
            <Button
              variant={isAudioEnabled ? 'outline' : 'error'}
              size="lg"
              onClick={toggleAudio}
              className="rounded-full w-14 h-14 p-0"
            >
              {isAudioEnabled ? <Mic size={24} /> : <MicOff size={24} />}
            </Button>

            {callType === 'video' && (
              <>
                <Button
                  variant={isVideoEnabled ? 'outline' : 'error'}
                  size="lg"
                  onClick={toggleVideo}
                  className="rounded-full w-14 h-14 p-0"
                >
                  {isVideoEnabled ? <Video size={24} /> : <VideoOff size={24} />}
                </Button>

                <Button
                  variant={isScreenSharing ? 'secondary' : 'outline'}
                  size="lg"
                  onClick={toggleScreenShare}
                  className="rounded-full w-14 h-14 p-0"
                >
                  <Monitor size={24} />
                </Button>
              </>
            )}

            <Button
              variant="error"
              size="lg"
              onClick={handleEndCall}
              className="rounded-full w-16 h-16 p-0"
            >
              <PhoneOff size={28} />
            </Button>
          </div>

          {/* Call Status */}
          <div className="text-center mt-4">
            <p className="text-sm text-gray-600">
              {callType === 'audio' && <span className="text-primary-600">● Audio Call</span>}
              {callType === 'video' && (
                <>
                  {isScreenSharing && <span className="text-primary-600">● Screen Sharing Active</span>}
                  {!isVideoEnabled && <span className="ml-2 text-gray-500">● Video Off</span>}
                </>
              )}
              {!isAudioEnabled && <span className="ml-2 text-gray-500">● Audio Muted</span>}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
