import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { axiosPrivate } from '../../api/axios';
import { connect, createLocalVideoTrack } from 'twilio-video';
import useAuthStore from '../../store/authStore';

const TeleconsultationRoom = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    
    // WAITING, CONNECTING, ADMITTED, DISCONNECTED, ERROR
    const [status, setStatus] = useState('WAITING'); 
    const [micEnabled, setMicEnabled] = useState(true);
    const [cameraEnabled, setCameraEnabled] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    
    const [room, setRoom] = useState(null);
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);

    useEffect(() => {
        const fetchSession = async () => {
            try {
                // Fetch the teleconsult session for this appointment ID
                const res = await axiosPrivate.get(`/v1/teleconsultations/encounter/${id}`);
                const session = res.data;
                
                if (session.providerType === 'TWILIO') {
                    connectToTwilio(session);
                } else {
                    // Fallback to mock behavior
                    const timer = setTimeout(() => {
                        setStatus('ADMITTED');
                    }, 3000);
                    return () => clearTimeout(timer);
                }
            } catch (err) {
                console.error("Failed to fetch teleconsult session", err);
                setStatus('ERROR');
                setErrorMessage('Could not find or join the teleconsultation room.');
            }
        };
        fetchSession();
        
        return () => {
            if (room) {
                room.disconnect();
            }
        };
    }, [id]);

    const connectToTwilio = async (session) => {
        setStatus('CONNECTING');
        try {
            // Determine which token to use based on user role (assume PATIENT if not DOCTOR)
            const token = user?.role === 'DOCTOR' ? session.doctorToken : session.patientToken;
            
            const twilioRoom = await connect(token, {
                name: session.roomId,
                audio: true,
                video: { width: 640 }
            });
            
            setRoom(twilioRoom);
            setStatus('ADMITTED');

            // Attach local video track
            createLocalVideoTrack().then(track => {
                const localMediaContainer = localVideoRef.current;
                if (localMediaContainer) {
                    localMediaContainer.appendChild(track.attach());
                }
            });

            // Handle remote participants
            twilioRoom.on('participantConnected', participant => {
                participant.tracks.forEach(publication => {
                    if (publication.isSubscribed) {
                        attachTrack(publication.track);
                    }
                });

                participant.on('trackSubscribed', track => {
                    attachTrack(track);
                });
            });

            twilioRoom.participants.forEach(participant => {
                participant.tracks.forEach(publication => {
                    if (publication.isSubscribed) {
                        attachTrack(publication.track);
                    }
                });
                participant.on('trackSubscribed', track => {
                    attachTrack(track);
                });
            });
            
        } catch (error) {
            console.error('Error joining Twilio room:', error);
            setStatus('ERROR');
            setErrorMessage('Failed to connect to video provider.');
        }
    };

    const attachTrack = (track) => {
        if (remoteVideoRef.current) {
            remoteVideoRef.current.appendChild(track.attach());
        }
    };

    const handleEndCall = () => {
        if (room) {
            room.disconnect();
        }
        setStatus('DISCONNECTED');
        setTimeout(() => navigate(user?.role === 'DOCTOR' ? '/doctor/workspace' : '/patient/dashboard'), 2000);
    };

    const toggleMic = () => {
        if (room) {
            room.localParticipant.audioTracks.forEach(publication => {
                if (micEnabled) {
                    publication.track.disable();
                } else {
                    publication.track.enable();
                }
            });
        }
        setMicEnabled(!micEnabled);
    };

    const toggleCamera = () => {
        if (room) {
            room.localParticipant.videoTracks.forEach(publication => {
                if (cameraEnabled) {
                    publication.track.disable();
                } else {
                    publication.track.enable();
                }
            });
        }
        setCameraEnabled(!cameraEnabled);
    };

    if (status === 'WAITING' || status === 'CONNECTING') {
        return (
            <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center p-4">
                <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-8 rounded-2xl max-w-md w-full text-center shadow-lg">
                    <Video size={48} className="mx-auto text-[var(--color-primary)] mb-4 animate-pulse" />
                    <h2 className="text-xl font-bold mb-2">Virtual Waiting Room</h2>
                    <p className="text-[var(--color-text-muted)] mb-6">
                        {status === 'CONNECTING' ? 'Connecting to video provider...' : 'Your doctor has been notified and will admit you shortly. Please do not close this window.'}
                    </p>
                    <div className="flex justify-center gap-4">
                        <Button variant="secondary" onClick={toggleMic}>
                            {micEnabled ? <Mic size={20} /> : <MicOff size={20} className="text-red-500" />}
                        </Button>
                        <Button variant="secondary" onClick={toggleCamera}>
                            {cameraEnabled ? <Video size={20} /> : <VideoOff size={20} className="text-red-500" />}
                        </Button>
                    </div>
                </div>
            </div>
        );
    }
    
    if (status === 'ERROR') {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
                <div className="bg-gray-800 p-8 rounded-2xl max-w-md w-full text-center shadow-lg">
                    <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
                    <h2 className="text-xl font-bold text-white mb-2">Connection Error</h2>
                    <p className="text-gray-400 mb-6">{errorMessage}</p>
                    <Button onClick={() => navigate(user?.role === 'DOCTOR' ? '/doctor/workspace' : '/patient/dashboard')}>
                        Return to Dashboard
                    </Button>
                </div>
            </div>
        );
    }

    if (status === 'DISCONNECTED') {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-center text-white">
                    <CheckSquare size={48} className="mx-auto text-green-500 mb-4" />
                    <h2 className="text-2xl font-bold">Consultation Ended</h2>
                    <p className="mt-2 text-gray-400">Returning to dashboard...</p>
                </div>
            </div>
        );
    }

    // Admitted state
    return (
        <div className="min-h-screen bg-gray-900 flex flex-col">
            <div className="flex-1 p-4 flex gap-4">
                {/* Video Grid */}
                <div className="flex-1 bg-black rounded-xl overflow-hidden relative">
                    {/* Doctor Video / Remote Video */}
                    <div ref={remoteVideoRef} className="absolute inset-0 flex items-center justify-center text-gray-500 [&>video]:w-full [&>video]:h-full [&>video]:object-cover">
                        {!room && (
                            <>
                                <Video size={64} opacity={0.3} />
                                <span className="absolute bottom-4 left-4 text-white font-semibold">Remote Participant</span>
                            </>
                        )}
                    </div>
                    {/* Patient PIP / Local Video */}
                    <div ref={localVideoRef} className="absolute top-4 right-4 w-48 h-32 bg-gray-800 rounded-lg overflow-hidden border-2 border-gray-700 shadow-xl [&>video]:w-full [&>video]:h-full [&>video]:object-cover">
                         {!room && (
                            <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                                {cameraEnabled ? <Video size={32} /> : <VideoOff size={32} className="text-red-500"/>}
                            </div>
                         )}
                    </div>
                </div>
                
                {/* Clinical Tools Panel (Only visible to doctor typically, shown here for structural demo) */}
                <div className="w-80 bg-gray-800 rounded-xl p-4 flex flex-col hidden sm:flex">
                    <h3 className="text-white font-bold mb-4 flex items-center gap-2"><FileText size={18} /> Shared Context</h3>
                    <div className="flex-1 text-sm text-gray-400">
                        <p>Patient: John Doe</p>
                        <p>Reason: Follow-up on hypertension.</p>
                        <hr className="border-gray-700 my-4" />
                        <p>No files shared yet.</p>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="h-20 bg-gray-800 flex items-center justify-center gap-6 px-4">
                <button onClick={toggleMic} className={`p-4 rounded-full ${micEnabled ? 'bg-gray-700 text-white' : 'bg-red-500 text-white'}`}>
                    {micEnabled ? <Mic size={24} /> : <MicOff size={24} />}
                </button>
                <button onClick={toggleCamera} className={`p-4 rounded-full ${cameraEnabled ? 'bg-gray-700 text-white' : 'bg-red-500 text-white'}`}>
                    {cameraEnabled ? <Video size={24} /> : <VideoOff size={24} />}
                </button>
                <button className="p-4 rounded-full bg-gray-700 text-white hidden sm:block">
                    <MonitorUp size={24} />
                </button>
                <button onClick={handleEndCall} className="p-4 rounded-full bg-red-600 text-white hover:bg-red-700">
                    <PhoneOff size={24} />
                </button>
            </div>
        </div>
    );
};
export default TeleconsultationRoom;
