import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";

import "../styles/room.sass";

// Socket for chat messaging
import { socket } from "../services/socket";

// Custom hooks for voice and video functionality
import { useVoiceChat } from "../hooks/useVoiceChat";
import { useVideoChat } from "../hooks/useVideoChat";

// Firebase authentication
import { getAuth } from "firebase/auth";

// UI icons
import {
  Camera,
  CameraOut,
  Share,
  Sharex,
  Hand,
  Mic,
  MicOff,
} from "../icons";

// Chat message structure
interface ChatMessage {
  sender: string;
  message: string;
  time?: number;
}

export default function Room() {
  // Room ID from URL params
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  /* ================= USER ================= */
  const auth = getAuth();
  const user = auth.currentUser;

  // Resolve username from display name, email, or fallback
  const username =
    user?.displayName ||
    user?.email?.split("@")[0] ||
    `User-${Math.floor(Math.random() * 9999)}`;

  /* ================= CHAT ================= */
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [message, setMessage] = useState("");
  const chatRef = useRef<HTMLDivElement | null>(null);
  
  /* ================= FOCUS VIDEO ================= */
  // Peer ID of the currently focused video
  const [focusedPeer, setFocusedPeer] = useState<string | null>(null);

  // Join chat room and listen for incoming messages
  useEffect(() => {
    if (!id) return;

    socket.emit("join_room", id, username);

    const handler = (data: ChatMessage) => {
      setMessages((prev) => [...prev, data]);
    };

    socket.on("receive_message", handler);

    return () => {
      socket.off("receive_message", handler);
    };
  }, [id, username]);

  // Send chat message to the room
  const sendMessage = () => {
    if (!message.trim() || !id) return;

    socket.emit("send_message", {
      roomId: id,
      sender: username,
      message,
      time: Date.now(),
    });

    setMessage("");
  };

  /* ================= CONTROLS ================= */
  const [muted, setMuted] = useState(false);
  const [camera, setCamera] = useState(false);
  const [hand, setHand] = useState(false);
  const [sharing, setSharing] = useState(false);

  // Confirmation flags (ask only once)
  const [cameraConfirmed, setCameraConfirmed] = useState(false);
  const [micConfirmed, setMicConfirmed] = useState(false);
  const stopScreenShare = () => {
  screenStream?.getTracks().forEach((t) => t.stop());
  setScreenStream(null);
  setSharing(false);
  setFocusedPeer(null);
};

  /* ================= VOICE + VIDEO ================= */
  const {
    myStream: audioStream,
    isTalking,
    participants,
    endCall,
    peerRef: voicePeer,
  } = useVoiceChat(id!, username);

  const {
  myStream: videoStream,
  remoteStreams,
  remoteScreenStream,
  peerRef, // 🔥 FALTABA ESTO
} = useVideoChat(id!);


  /* ================= VIDEO REFS ================= */
  // Main focused video
  const myMainVideoRef = useRef<HTMLVideoElement | null>(null);

  // Local user video in grid
  const myGridVideoRef = useRef<HTMLVideoElement | null>(null);

  // Remote users video refs indexed by peerId
  const remoteVideoRefs = useRef<Record<string, HTMLVideoElement | null>>({});
  /* ================= SCREEN SHARE ================= */
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  



  // Ensure audio tracks start enabled
  useEffect(() => {
    if (!audioStream) return;

    audioStream.getAudioTracks().forEach((track) => {
      track.enabled = true;
    });
  }, [audioStream]);

  /* ================= MAIN VIDEO (FOCUS) ================= */
  useEffect(() => {
  if (!myMainVideoRef.current) return;

  // 🔥 1. PANTALLA REMOTA (MÁXIMA PRIORIDAD)
  if (remoteScreenStream) {
    myMainVideoRef.current.srcObject = remoteScreenStream;
    return;
  }

  // 🔥 2. MI PANTALLA
  if (focusedPeer === "SCREEN" && screenStream) {
    myMainVideoRef.current.srcObject = screenStream;
    return;
  }

  // 3. SIN FOCO → CÁMARA LOCAL
  if (!focusedPeer) {
    myMainVideoRef.current.srcObject = videoStream ?? null;
    return;
  }

  // 4. FOCO EN USUARIO REMOTO
  const remoteStream = remoteStreams[focusedPeer];
  if (remoteStream) {
    myMainVideoRef.current.srcObject = remoteStream;
  }
}, [
  focusedPeer,
  videoStream,
  remoteStreams,
  screenStream,
  remoteScreenStream, // 🔥 IMPORTANTE
]);


  /* ================= LOCAL CAMERA IN GRID ================= */
  useEffect(() => {
    if (!videoStream || !myGridVideoRef.current) return;

    if (myGridVideoRef.current.srcObject !== videoStream) {
      myGridVideoRef.current.srcObject = videoStream;
    }
  }, [videoStream]);

  /* ================= REMOTE CAMERAS ================= */
  useEffect(() => {
    Object.entries(remoteStreams).forEach(([peerId, stream]) => {
      const video = remoteVideoRefs.current[peerId];
      if (video && video.srcObject !== stream) {
        video.srcObject = stream;
      }
    });
  }, [remoteStreams]);

  /* ================= TOGGLE CAMERA ================= */
  useEffect(() => {
    if (!videoStream) return;
    videoStream.getVideoTracks().forEach((t) => (t.enabled = camera));
  }, [camera, videoStream]);

  /* ================= CLEANUP ================= */
  // Stop all audio and video tracks and clear video elements
  const stopAllMedia = () => {
    videoStream?.getTracks().forEach((t) => t.stop());
    audioStream?.getTracks().forEach((t) => t.stop());

    if (myMainVideoRef.current) myMainVideoRef.current.srcObject = null;
    if (myGridVideoRef.current) myGridVideoRef.current.srcObject = null;

    Object.values(remoteVideoRefs.current).forEach((v) => {
      if (v) v.srcObject = null;
    });
  };

  useEffect(() => {
  return () => {
    stopAllMedia();
    stopScreenShare();
  };
}, []);

const startScreenShare = async () => {
  try {
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: { frameRate: 30 },
      audio: false,
    });

    setScreenStream(stream);
    setSharing(true);
    setFocusedPeer("SCREEN");

    Object.keys(remoteStreams).forEach((peerId) => {
      peerRef.current?.call(peerId, stream, {
        metadata: { type: "screen" },
      });
    });

    stream.getVideoTracks()[0].onended = stopScreenShare;
  } catch (err) {
    console.error("Screen share error:", err);
  }
};







  /* ================= UI ================= */
  return (
    <main className="room">
      <section className="room__main">
        <h2 className="room__title">Meeting: {id}</h2>

        {/* ===== MAIN VIDEO ===== */}
<div className="room__video-grid">

 
  {/* ===== MY CAMERA ===== */}
  {videoStream && (
    <video
      ref={myMainVideoRef}
      autoPlay
      playsInline
      muted
      onClick={() => setFocusedPeer(null)}
      className={`room__video-self ${
        focusedPeer ? "is-background" : ""
      }`}
      style={{
  display: "block",
  cursor: "pointer",
}}

    />
  )}

          {Object.entries(remoteStreams).map(([peerId]) => {
            // If a video is focused, hide others
            if (focusedPeer && focusedPeer !== peerId) return null;

            return (
              <video
                key={peerId}
                ref={(el) => {
                  remoteVideoRefs.current[peerId] = el;
                }}
                autoPlay
                playsInline
                className={`room__video-user ${
                  focusedPeer === peerId ? "is-focused" : ""
                }`}
              />
            );
          })}
        </div>

        {/* ===== CONTROLS ===== */}
        <div className="room__controls">
          {/* Microphone toggle */}
          <button
            className="room__btn"
            onClick={() => {
              if (!audioStream) return;

              const willMute = !muted;

              // Ask confirmation only the first time microphone is enabled
              if (!micConfirmed && !willMute) {
                const ok = window.confirm(
                  "¿Seguro que deseas encender el micrófono?"
                );
                if (!ok) return;
                setMicConfirmed(true);
              }

              setMuted(willMute);

              audioStream.getAudioTracks().forEach(
                (track) => (track.enabled = !willMute)
              );
            }}
          >
            {muted ? <MicOff /> : <Mic />}
          </button>

          {/* Camera toggle */}
          <button
            className="room__btn"
            onClick={() => {
              if (!videoStream) return;

              const willTurnOn = !camera;

              // Ask confirmation only the first time camera is enabled
              if (!cameraConfirmed && willTurnOn) {
                const ok = window.confirm(
                  "¿Seguro que deseas encender la cámara?"
                );
                if (!ok) return;
                setCameraConfirmed(true);
              }

              setCamera(willTurnOn);

              videoStream.getVideoTracks().forEach(
                (track) => (track.enabled = willTurnOn)
              );
            }}
          >
            {camera ? <Camera /> : <CameraOut />}
          </button>

          {/* Screen sharing toggle (UI only) */}
          <button
  className="room__btn"
  onClick={() => {
    if (!sharing) startScreenShare();
    else stopScreenShare();
  }}
>
  {sharing ? <Sharex /> : <Share />}
</button>


          {/* Raise hand toggle */}
          <button className="room__btn" onClick={() => setHand(!hand)}>
            <span style={{ opacity: hand ? 1 : 0.4 }}>
              <Hand />
            </span>
          </button>

          {/* End call */}
          <button
            className="room__btn room__btn--hangup"
            onClick={() => {
              stopAllMedia();
              endCall();
              navigate("/home");
            }}
          >
            End
          </button>
        </div>
      </section>

      {/* ===== PARTICIPANTS GRID ===== */}
      <aside className="room__grid">
        {/* LOCAL USER */}
        <div className="room__grid-item" onClick={() => setFocusedPeer(null)}>
          {videoStream && (
            <video
              ref={myGridVideoRef}
              autoPlay
              playsInline
              muted
              className="room__grid-video"
              style={{ display: camera ? "block" : "none" }}
            />
          )}

          {!camera && (
            <div className="room__small-avatar">
              <div className={`initial-badge ${isTalking ? "talking" : ""}`}>
                {username.charAt(0).toUpperCase()}
              </div>
              <div className="mic-status">
                {isTalking ? <Mic /> : <MicOff />}
              </div>
            </div>
          )}
        </div>

        {/* OTHER PARTICIPANTS */}
        {participants
          .filter((u) => u.peerId !== voicePeer.current?.id)
          .filter((u) => u.peerId !== focusedPeer)
          .map((u) => {
            const stream = remoteStreams[u.peerId];

            return (
              <div
                key={u.peerId}
                className="room__grid-item"
                onClick={() => {
                  if (!stream) return;
                  setFocusedPeer((prev) =>
                    prev === u.peerId ? null : u.peerId
                  );
                }}
                style={{ cursor: "pointer" }}
              >
                {stream ? (
                  <video
                    ref={(el) => {
                      if (el && el.srcObject !== stream) {
                        remoteVideoRefs.current[u.peerId] = el;
                        el.srcObject = stream;
                      }
                    }}
                    autoPlay
                    playsInline
                    className="room__grid-video"
                  />
                ) : (
                  <div className="room__small-avatar">
                    <div
                      className={`initial-badge ${
                        u.talking ? "talking" : ""
                      }`}
                    >
                      {u.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="mic-status">
                      {u.talking ? <Mic /> : <MicOff />}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
      </aside>

      {/* ===== CHAT ===== */}
      <button
        className="room__chat-button"
        onClick={() => setChatOpen(!chatOpen)}
      >
        <img src="/images/chat.png" alt="Chat" />
      </button>

      {chatOpen && (
        <>
          <div className="chat-overlay" onClick={() => setChatOpen(false)} />
          <div className="room__chat-panel" ref={chatRef}>
            <div className="room__chat-messages">
              {messages.map((m, i) => (
                <p key={i}>
                  <strong>{m.sender}: </strong>
                  {m.message}
                </p>
              ))}
            </div>

            <div className="room__chat-input">
              <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write a message..."
              />
              <button onClick={sendMessage}>Send</button>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
