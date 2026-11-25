import React, { useRef, useState, useEffect } from 'react';
import { 
  Video, VideoOff, Mic, MicOff, PhoneOff, Monitor, MessageSquare, 
  Send, Sparkles, AlertCircle, RefreshCw, Hand, ShieldAlert, BadgeInfo
} from 'lucide-react';
import { Booking, ChatMessage } from './teletherapyTypes';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

interface LiveVideoSessionProps {
  booking: Booking;
  isMember: boolean;
  onEndCall: () => void;
}

export const LiveVideoSession: React.FC<LiveVideoSessionProps> = ({
  booking,
  isMember,
  onEndCall,
}) => {
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [localPeer, setLocalPeer] = useState<RTCPeerConnection | null>(null);
  const [remotePeer, setRemotePeer] = useState<RTCPeerConnection | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [connectionState, setConnectionState] = useState<'connecting' | 'connected' | 'failed' | 'disconnected'>('connecting');
  
  // Media controls
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(true);

  // Time elapsed in session
  const [seconds, setSeconds] = useState(0);

  // Live WebRTC Network Diagnostic Parameters
  const [rtcStats, setRtcStats] = useState({
    codec: 'Opus / VP8 secure',
    latency: '31ms',
    packetLoss: '0.00%',
    resolution: '640x480 @ 30fps',
    sipTunnel: 'STUN (GCP us-east)',
  });

  // Chat messages
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'sys-1',
      sender: 'system',
      text: `Welcome, Tommy. You have successfully connected securely to ${booking.professionalName}'s room.`,
      timestamp: 'Just now'
    },
    {
      id: 'prof-1',
      sender: 'professional',
      text: `Hello! So glad you could make it to our teletherapy session today! Let me know when you are ready to begin our articulation practice.`,
      timestamp: '1 min ago'
    }
  ]);

  const [isTherapistTyping, setIsTherapistTyping] = useState(false);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isTherapistTyping, isChatOpen]);

  // Draw speech vocal visualizer onto canvas
  useEffect(() => {
    let animationId: number;
    let audioCtx: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let source: MediaStreamAudioSourceNode | null = null;
    let dataArray: Uint8Array = new Uint8Array(0);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (stream && isAudioEnabled) {
      try {
        const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
        audioCtx = new AudioCtxClass();
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 128;
        source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);
        const bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);
      } catch (err) {
        console.warn("Could not create Web Audio Context for visualizer:", err);
      }
    }

    let phase = 0;

    const draw = () => {
      animationId = requestAnimationFrame(draw);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const width = canvas.width;
      const height = canvas.height;

      // Draw horizontal baseline
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.1)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();

      // Get real audio volume if available, or generate mock vocal wave based on phase
      let audioVolumeSum = 0;
      let hasRealAudio = false;

      if (analyser && dataArray.length > 0 && isAudioEnabled) {
        analyser.getByteFrequencyData(dataArray);
        for (let i = 0; i < dataArray.length; i++) {
          audioVolumeSum += dataArray[i];
        }
        hasRealAudio = audioVolumeSum > 10;
      }

      phase += 0.15;

      // Draw primary glowing blue frequency sine wave
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.85)';
      ctx.lineWidth = 2.5;

      const slices = 60;
      for (let i = 0; i <= slices; i++) {
        const x = (i / slices) * width;
        
        let amplitude = 12; // default idle amplitude
        if (hasRealAudio && analyser) {
          // Map real volume to amplitude
          amplitude = Math.min(30, (audioVolumeSum / dataArray.length) * 0.85);
        } else if (!isAudioEnabled) {
          amplitude = 0;
        } else {
          // Generate active vocal simulation wave fluctuations
          const noise = Math.sin(phase * 0.5) * 5;
          amplitude = 10 + Math.max(0, noise);
        }

        // Apply a bell-curve envelope so waves pinch at the edges cleanly
        const envelope = Math.sin((i / slices) * Math.PI);
        const y = (height / 2) + Math.sin(i * 0.25 - phase) * amplitude * envelope;
        
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Draw secondary supporting purple wave (out of phase)
      if (isAudioEnabled) {
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(168, 85, 247, 0.45)';
        ctx.lineWidth = 1.5;

        for (let i = 0; i <= slices; i++) {
          const x = (i / slices) * width;
          let am = hasRealAudio ? (audioVolumeSum / dataArray.length) * 0.45 : 6;
          const envelope = Math.sin((i / slices) * Math.PI);
          const y = (height / 2) + Math.sin(i * 0.35 + phase * 1.2) * am * envelope;
          
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
      if (source) source.disconnect();
      if (audioCtx && audioCtx.state !== 'closed') {
        audioCtx.close().catch(() => {});
      }
    };
  }, [stream, isAudioEnabled]);

  // Articulation progress list
  const [speechTask, setSpeechTask] = useState({
    target: "S-Blends (Star, Smile, Sky)",
    attempts: 0,
    score: 0,
  });

  // Increment timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDuration = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Start media capturing and local peer WebRTC Web-Loopback simulation
  useEffect(() => {
    let activeStream: MediaStream | null = null;
    let localPC: RTCPeerConnection | null = null;
    let remotePC: RTCPeerConnection | null = null;

    async function setupMedia() {
      setIsLoading(true);
      try {
        // Request user media safely
        const userMedia = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: "user" },
          audio: true
        });
        
        activeStream = userMedia;
        setStream(userMedia);

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = userMedia;
        }

        // WebRTC Local Loopback Demonstration (Technically complete PeerConnection pipeline loop)
        const configuration = { iceServers: [] };
        localPC = new RTCPeerConnection(configuration);
        remotePC = new RTCPeerConnection(configuration);

        // Track listener for remote
        remotePC.ontrack = (event) => {
          if (remoteVideoRef.current && event.streams[0]) {
            remoteVideoRef.current.srcObject = event.streams[0];
          }
        };

        // Trickle ICE
        localPC.onicecandidate = (e) => {
          if (e.candidate && remotePC) remotePC.addIceCandidate(e.candidate).catch(err => {});
        };
        remotePC.onicecandidate = (e) => {
          if (e.candidate && localPC) localPC.addIceCandidate(e.candidate).catch(err => {});
        };

        // Add tracks to peer connection
        userMedia.getTracks().forEach((track) => {
          if (localPC && activeStream) localPC.addTrack(track, activeStream);
        });

        // Negotiate Offer/Answer
        const offer = await localPC.createOffer();
        await localPC.setLocalDescription(offer);
        await remotePC.setRemoteDescription(offer);

        const answer = await remotePC.createAnswer();
        await remotePC.setLocalDescription(answer);
        await localPC.setRemoteDescription(answer);

        setLocalPeer(localPC);
        setRemotePeer(remotePC);
        setConnectionState('connected');
        toast.success("WebRTC Secure Peer Connection Connected");
      } catch (err: any) {
        console.warn("Could not access camera/mic: ", err);
        // Fallback elegantly in UI if browser denies camera or running in secure environment constraints
        setConnectionState('failed');
        toast.info("Active camera not detected or blocked. Running session on simulated virtual space.");
      } finally {
        setIsLoading(false);
      }
    }

    setupMedia();

    // Clean up
    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
      if (localPC) localPC.close();
      if (remotePC) remotePC.close();
    };
  }, []);

  const handleToggleAudio = () => {
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !isAudioEnabled;
        setIsAudioEnabled(!isAudioEnabled);
        toast.success(isAudioEnabled ? "Microphone Muted" : "Microphone Active");
      }
    } else {
      setIsAudioEnabled(!isAudioEnabled);
    }
  };

  const handleToggleVideo = () => {
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !isVideoEnabled;
        setVideoEnabled(!isVideoEnabled);
        toast.success(isVideoEnabled ? "Camera Feed Muted" : "Camera Feed Active");
      }
    } else {
      setVideoEnabled(!isVideoEnabled);
    }
  };

  const handleToggleScreenShare = async () => {
    if (isScreenSharing) {
      // Revert screen share to camera
      if (stream && localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        setIsScreenSharing(false);
        toast.info("Screen sharing ended");
      }
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }
        setIsScreenSharing(true);
        toast.success("Sharing entire screen with therapist");
        
        screenStream.getVideoTracks()[0].onended = () => {
          if (localVideoRef.current && stream) {
            localVideoRef.current.srcObject = stream;
          }
          setIsScreenSharing(false);
        };
      } catch (err) {
        console.warn("Screen share denied or failed:", err);
      }
    }
  };

  // Automated therapeutic replies simulating expert therapist interactions
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg: ChatMessage = {
      id: `chat-${Date.now()}`,
      sender: 'user',
      text: chatInput,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, userMsg]);
    const currentInput = chatInput;
    setChatInput('');

    // Trigger structured therapist responses
    setIsTherapistTyping(true);

    setTimeout(() => {
      let therapistReply = "";
      const lower = currentInput.toLowerCase();

      if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
        therapistReply = "Hello! Ready for today's speech adventure? Let's take three deep breaths to prepare our throat and chest.";
      } else if (lower.includes('ready') || lower.includes('start') || lower.includes('begin')) {
        therapistReply = `Great! Today we are working on "${speechTask.target}". Try repeating after me: "STAR". Open your mouth, create the "S" friction whistle, then open wide for "TAR".`;
        setSpeechTask(prev => ({ ...prev, attempts: prev.attempts + 1 }));
      } else if (lower.includes('done') || lower.includes('did it') || lower.includes('star') || lower.includes('smile')) {
        const scores = [85, 90, 80, 95];
        const nextScore = scores[Math.floor(Math.random() * scores.length)];
        therapistReply = `Speechcraft AI analysis detects healthy tracking of the alveolar ridge! Score: ${nextScore}%. Incredible vocal strength, Tommy! Let's try saying "SKILL" next.`;
        setSpeechTask(prev => ({ 
          ...prev,
          attempts: prev.attempts + 1, 
          score: Math.round(((prev.score * (prev.attempts) + nextScore) / (prev.attempts + 1)))
        }));
      } else {
        therapistReply = "Very good attempt! Speech teletherapy is about coordination and rhythm. Keep repeating your target words, I'm watching your jaw movement closely.";
      }

      const replyMsg: ChatMessage = {
        id: `prof-${Date.now()}`,
        sender: 'professional',
        text: therapistReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setChatMessages(prev => [...prev, replyMsg]);
      setIsTherapistTyping(false);
    }, 1500);
  };

  return (
    <div id="meeting-room-wrapper" className="min-h-screen bg-slate-950 text-white flex flex-col md:flex-row rounded-3xl overflow-hidden border border-slate-800 shadow-2xl relative">
      
      {/* Call Main Stage */}
      <div className="flex-1 flex flex-col relative bg-slate-900 border-r border-slate-800">
        
        {/* Header Indicator Bar */}
        <div className="p-4 bg-slate-950/60 backdrop-blur-md flex items-center justify-between border-b border-slate-800 z-10">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
            <div>
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-100 flex items-center gap-1.5">
                Live Video Session
                <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-400 text-[8px] rounded font-black tracking-widest">SECURE WEBRTC</span>
              </h4>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{booking.professionalName} ({booking.professionalTitle})</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 tracking-wide text-slate-300">
              {formatDuration(seconds)}
            </span>
          </div>
        </div>

        {/* Video Grid Grid-systems */}
        <div className="flex-1 p-6 flex flex-col lg:flex-row gap-6 relative justify-center items-center overflow-y-auto">
          
          {/* Remote Specialist Video Feed */}
          <div className="flex-1 w-full aspect-video min-h-[220px] lg:min-h-[400px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center relative shadow-inner">
            {isLoading ? (
              <div className="flex flex-col items-center gap-2 text-slate-400">
                <RefreshCw className="w-8 h-8 animate-spin" />
                <p className="text-xs font-bold uppercase tracking-wider">Establishing Signaling Handshake...</p>
              </div>
            ) : connectionState === 'connected' ? (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover filter brightness-[1.05] contrast-[1.02]"
                style={{ transform: "scaleX(-1)" }} // Flip remote loopback to make it feel like another person
              />
            ) : (
              // Clean clinician placeholder illustration
              <div className="text-center p-6 flex flex-col items-center">
                <div className="w-24 h-24 rounded-full bg-indigo-500/10 border-2 border-dashed border-indigo-400 flex items-center justify-center text-4xl mb-4 shadow-lg animate-pulse">
                  👩‍⚕️
                </div>
                <h5 className="font-black text-sm text-slate-200 uppercase tracking-widest mb-1">{booking.professionalName}</h5>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest max-w-sm mb-3">
                  Securing peer connection. Ready to stream...
                </p>
                <div className="text-[9px] text-slate-500 max-w-xs leading-relaxed px-3 py-1 bg-slate-900 border border-slate-800 rounded-lg">
                  💡 This room falls back into an offline classroom simulator if secure camera handles are blocked in the test sandbox environment.
                </div>
              </div>
            )}

            {/* Float Overlay Indicator of Professional */}
            <div className="absolute top-4 left-4 py-1 px-2.5 bg-slate-950/80 backdrop-blur-sm border border-slate-800 rounded-lg flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full" />
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">THERAPIST FEED</span>
            </div>
          </div>

          {/* Local User Self-Preview Video Feed */}
          <div className="w-full lg:w-72 aspect-video lg:aspect-[4/3] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center relative shadow-lg">
            {isVideoEnabled && connectionState === 'connected' ? (
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                style={{ transform: "scaleX(-1)" }}
              />
            ) : (
              <div className="text-center p-4">
                <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center font-black text-slate-400 text-sm mx-auto mb-2">
                  ME
                </div>
                <p className="text-[9px] text-slate-500 font-black uppercase tracking-wider">Video Suspended</p>
              </div>
            )}

            <div className="absolute top-3 left-3 py-1 px-2 bg-slate-950/80 backdrop-blur-sm border border-slate-800 rounded-lg flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Child (Tommy)</span>
            </div>

            {/* Glowing translucent visualizer overlay feed */}
            <div className="absolute bottom-2 left-2 right-2 h-8 bg-slate-950/80 backdrop-blur-sm border border-slate-800 rounded-lg flex items-center justify-between px-3 gap-2">
              <span className="text-[8px] font-black tracking-widest text-[#6366f1] uppercase">Vocal Feed</span>
              <canvas
                ref={canvasRef}
                width={140}
                height={24}
                className="w-[140px] h-6 opacity-90"
              />
            </div>
          </div>
        </div>

        {/* Workspace Speecho-Metrics Panel */}
        <div className="p-4 mx-6 mb-4 bg-slate-950/40 border border-slate-800 rounded-2xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl">
                <Sparkles className="w-4 h-4 z-10" />
              </div>
              <div>
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Speech Focus Module</span>
                <h5 className="text-xs font-black text-slate-200 uppercase tracking-wider">{speechTask.target}</h5>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="text-right">
                <span className="text-[9px] font-black uppercase tracking-widest block text-slate-400">Total Drills</span>
                <span className="font-mono text-sm font-black text-white">{speechTask.attempts}</span>
              </div>
              <div className="text-right">
                <span className="text-[9px] font-black uppercase tracking-widest block text-slate-400">Classroom Accuracy</span>
                <span className="font-mono text-sm font-black text-emerald-400">
                  {speechTask.score > 0 ? `${speechTask.score}%` : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* WebRTC Live Telemetry Diagnostics Row */}
          <div className="mt-3 pt-3 border-t border-slate-800/60 grid grid-cols-2 md:grid-cols-5 gap-2 text-center">
            <div className="bg-slate-900/60 p-1.5 rounded-lg border border-slate-800/40">
              <p className="text-[8px] font-black uppercase tracking-widest text-slate-500">Secure Protocol</p>
              <p className="text-[9px] font-mono text-indigo-400 font-bold">{rtcStats.codec}</p>
            </div>
            <div className="bg-slate-900/60 p-1.5 rounded-lg border border-slate-800/40">
              <p className="text-[8px] font-black uppercase tracking-widest text-slate-500">Audio Latency</p>
              <p className="text-[9px] font-mono text-emerald-400 font-bold">{isAudioEnabled ? rtcStats.latency : 'Muted'}</p>
            </div>
            <div className="bg-slate-900/60 p-1.5 rounded-lg border border-slate-800/40">
              <p className="text-[8px] font-black uppercase tracking-widest text-slate-500">Jitter Buffer</p>
              <p className="text-[9px] font-mono text-slate-300 font-bold">1.2 ms</p>
            </div>
            <div className="bg-slate-900/60 p-1.5 rounded-lg border border-slate-800/40">
              <p className="text-[8px] font-black uppercase tracking-widest text-slate-500">Resolution</p>
              <p className="text-[9px] font-mono text-slate-300 font-bold">{isVideoEnabled ? rtcStats.resolution : 'Off'}</p>
            </div>
            <div className="bg-slate-900/60 p-1.5 rounded-lg border border-slate-800/40 col-span-2 md:col-span-1">
              <p className="text-[8px] font-black uppercase tracking-widest text-slate-500">Signaling Relay</p>
              <p className="text-[9px] font-mono text-teal-400 font-bold">{rtcStats.sipTunnel}</p>
            </div>
          </div>
        </div>

        {/* Media Control Tray Bar */}
        <div id="media-control-tray" className="p-5 bg-slate-950 flex items-center justify-center gap-3 border-t border-slate-800 z-10">
          <button
            onClick={handleToggleAudio}
            title={isAudioEnabled ? "Mute Microphone" : "Unmute Microphone"}
            className={`p-3.5 rounded-xl transition-all border ${
              isAudioEnabled 
                ? 'bg-slate-800/80 border-slate-700 hover:bg-slate-700/80 hover:text-white' 
                : 'bg-rose-500 border-rose-600 hover:bg-rose-600'
            }`}
          >
            {isAudioEnabled ? <Mic className="w-5 h-5 text-slate-100" /> : <MicOff className="w-5 h-5 text-white" />}
          </button>

          <button
            onClick={handleToggleVideo}
            title={isVideoEnabled ? "Disable Camera" : "Enable Camera"}
            className={`p-3.5 rounded-xl transition-all border ${
              isVideoEnabled 
                ? 'bg-slate-800/80 border-slate-700 hover:bg-slate-700/80 hover:text-white' 
                : 'bg-rose-500 border-rose-600 hover:bg-rose-600'
            }`}
          >
            {isVideoEnabled ? <Video className="w-5 h-5 text-slate-100" /> : <VideoOff className="w-5 h-5 text-white" />}
          </button>

          <button
            onClick={handleToggleScreenShare}
            title={isScreenSharing ? "Stop Sharing Screen" : "Share Entire Screen"}
            className={`p-3.5 rounded-xl transition-all border ${
              isScreenSharing 
                ? 'bg-emerald-600 border-emerald-700 text-white' 
                : 'bg-slate-800/80 border-slate-700 hover:bg-slate-700/80 hover:text-white'
            }`}
          >
            <Monitor className="w-5 h-5" />
          </button>

          <button
            onClick={() => setIsChatOpen(!isChatOpen)}
            title="Toggle Messaging Board"
            className={`p-3.5 rounded-xl transition-all border md:hidden ${
              isChatOpen 
                ? 'bg-primary border-primary/20 text-white' 
                : 'bg-slate-800/80 border-slate-700'
            }`}
          >
            <MessageSquare className="w-5 h-5" />
          </button>

          {/* End Call Separator */}
          <div className="h-6 w-[1px] bg-slate-800 mx-1" />

          <button
            onClick={onEndCall}
            className="py-3 px-5 bg-rose-500 border border-rose-600 hover:bg-rose-600 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-1.5 shadow-md shadow-rose-950/20 hover:scale-[1.02] active:scale-95 transition-all"
          >
            <PhoneOff className="w-4 h-4" />
            End Session
          </button>
        </div>

      </div>

      {/* Persistent Message Chat Sidebar */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            id="chat-messaging-sidebar"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="w-full md:w-80 bg-slate-950 flex flex-col h-[350px] md:h-auto border-t md:border-t-0 border-slate-800"
          >
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/40">
              <h5 className="text-xs font-black uppercase tracking-widest text-slate-100 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-primary" />
                Session Chat Board
              </h5>
              <button
                onClick={() => setIsChatOpen(false)}
                className="text-[10px] uppercase font-black tracking-wider text-slate-500 hover:text-slate-300 hidden md:block"
              >
                Close
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 p-4 overflow-y-auto scrollbar-none">
              <div className="space-y-3">
                {chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${
                      msg.sender === 'user'
                        ? 'items-end'
                        : msg.sender === 'system'
                          ? 'items-center'
                          : 'items-start'
                    }`}
                  >
                    {msg.sender === 'system' ? (
                      <div className="text-center py-1.5 px-3 bg-slate-900 border border-slate-800/80 rounded-xl max-w-full">
                        <p className="text-[10px] text-slate-500 font-bold leading-normal">
                          {msg.text}
                        </p>
                      </div>
                    ) : (
                      <>
                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 mb-0.5 px-1">
                          {msg.sender === 'user' ? 'You' : booking.professionalName} • {msg.timestamp}
                        </span>
                        <div
                          className={`py-2 px-3 rounded-2xl text-xs font-medium max-w-[85%] ${
                            msg.sender === 'user'
                              ? 'bg-primary text-white rounded-tr-none'
                              : 'bg-slate-800 border border-slate-700/60 text-slate-100 rounded-tl-none'
                          }`}
                        >
                          {msg.text}
                        </div>
                      </>
                    )}
                  </div>
                ))}

                {isTherapistTyping && (
                  <div className="flex flex-col items-start">
                    <span className="text-[8px] font-black uppercase tracking-widest text-indigo-400 mb-0.5">
                      {booking.professionalName} is typing...
                    </span>
                    <div className="px-3.5 py-2.5 bg-slate-800/40 rounded-2xl rounded-tl-none border border-slate-800 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                )}
                
                {/* Scrolling target element */}
                <div ref={chatEndRef} />
              </div>
            </div>

            {/* Message input */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-800 bg-slate-900/60 flex items-center gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type a word, star or ready..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary transition-all font-medium"
              />
              <button
                type="submit"
                className="p-2.5 bg-primary text-white hover:bg-primary-hover rounded-xl hover:scale-[1.02] active:scale-95 transition-all"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
