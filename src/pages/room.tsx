import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io, Socket } from "socket.io-client";


import "../styles/room.sass";

// Socket
import { socket } from "../services/socket";

// Hooks
import { useVoiceChat } from "../hooks/useVoiceChat";
import { useVideoChat } from "../hooks/useVideoChat";

import { getAuth } from "firebase/auth";

import {
  Camera,
  CameraOut,
  Share,
  Sharex,
  Hand,
  Mic,
  MicOff,
} from "../icons";

interface ChatMessage {
  sender: string;
  message: string;
  time?: number;
}

export default function Room() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  /* ================= USER ================= */
  const auth = getAuth();
  const user = auth.currentUser;

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
  const [focusedPeer, setFocusedPeer] = useState<string | null>(null);

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

  const sendMessage = () => {
  if (!message.trim() || !id) return;

  socket.emit("send_message", {
    roomId: id,
    sender: username,
    message,
    time: Date.now(),
  });

  // 👉 IA recibe el chat
  aiSocketRef.current?.emit("ai:chat", {
    username,
    message,
  });

  setMessage("");
};


  /* ================= CONTROLS ================= */
  const [muted, setMuted] = useState(false);

  const [camera, setCamera] = useState(false);
  const [hand, setHand] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [cameraConfirmed, setCameraConfirmed] = useState(false);
  const [micConfirmed, setMicConfirmed] = useState(false);
  const aiSocketRef = useRef<Socket | null>(null);
  const [aiSummary, setAiSummary] = useState("");


  /* ================= VOICE + VIDEO ================= */
  const {
    myStream: audioStream,
    isTalking,
    participants,
    endCall,
    peerRef: voicePeer,
  } = useVoiceChat(id!, username);

  const { myStream: videoStream, remoteStreams } = useVideoChat(id!);

  /* ================= VIDEO REFS ================= */
  const myMainVideoRef = useRef<HTMLVideoElement | null>(null);
  const myGridVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRefs = useRef<Record<string, HTMLVideoElement | null>>({});
useEffect(() => {
  if (!audioStream) return;

  audioStream.getAudioTracks().forEach((track) => {
    track.enabled = true;
  });
}, [audioStream]);

  /* ================= VIDEO PRINCIPAL (FOCO) ================= */
  useEffect(() => {
    if (!myMainVideoRef.current) return;

    // Sin foco → mi cámara
    if (!focusedPeer) {
      myMainVideoRef.current.srcObject = videoStream ?? null;
      return;
    }

    // Con foco → cámara remota
    const remoteStream = remoteStreams[focusedPeer];
    if (remoteStream) {
      myMainVideoRef.current.srcObject = remoteStream;
    }
  }, [focusedPeer, videoStream, remoteStreams]);

  /* ================= MI CAMARA EN EL GRID (MEJORA) ================= */
  useEffect(() => {
    if (!videoStream || !myGridVideoRef.current) return;

    if (myGridVideoRef.current.srcObject !== videoStream) {
      myGridVideoRef.current.srcObject = videoStream;
    }
  }, [videoStream]);

  /* ================= CAMARAS REMOTAS ================= */
  useEffect(() => {
    Object.entries(remoteStreams).forEach(([peerId, stream]) => {
      const video = remoteVideoRefs.current[peerId];
      if (video && video.srcObject !== stream) {
        video.srcObject = stream;
      }
    });
  }, [remoteStreams]);


 /* ================= ia ================= */

  useEffect(() => {
  if (!user) return;

  aiSocketRef.current = io(import.meta.env.VITE_AI_SERVER_URL);

  // 👉 usuario entra a la reunión IA
  aiSocketRef.current.emit("ai:join", {
    username,
    email: user.email,
  });

  // 👉 recibe resumen final
  aiSocketRef.current.on("ai:summary", (summary: string) => {
    setAiSummary(summary);
  });

  return () => {
    aiSocketRef.current?.disconnect();
  };
}, [user, username]);  






  
  /* ================= TOGGLE CAMARA ================= */
  useEffect(() => {
    if (!videoStream) return;
    videoStream.getVideoTracks().forEach((t) => (t.enabled = camera));
  }, [camera, videoStream]);

  /* ================= CLEANUP ================= */
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
    };
  }, []); 

  /* ================= UI ================= */
  return (
    <main className="room">
      <section className="room__main">
        <h2 className="room__title">Meeting: {id}</h2>

        {/* ===== VIDEO PRINCIPAL ===== */}
        <div className="room__video-grid">
          {videoStream && (
            <video
              ref={myMainVideoRef}
              autoPlay
              playsInline
              muted
              onClick={() => setFocusedPeer(null)} // ⭐ MEJORA
              className={`room__video-self ${
                focusedPeer ? "is-background" : ""
              }`}
              
              style={{
                display: camera ? "block" : "none",
                cursor: "pointer",
              }}
            />
            
          )}

          {Object.entries(remoteStreams).map(([peerId]) => {
  // 👉 Si hay un video enfocado, ocultar los demás
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

        {/* ===== CONTROLES ===== */}
        <div className="room__controls">
          <button
  className="room__btn"
  onClick={() => {
    if (!audioStream) return;

    const willMute = !muted; // nuevo estado

    // 👉 SOLO pregunta la primera vez que se VA A ENCENDER
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



          <button
  className="room__btn"
  onClick={() => {
    if (!videoStream) return;

    const willTurnOn = !camera; // nuevo estado

    // 👉 SOLO pregunta la primera vez que se VA A ENCENDER
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


          <button className="room__btn" onClick={() => setSharing(!sharing)}>
            {sharing ? <Sharex /> : <Share />}
          </button>

          <button className="room__btn" onClick={() => setHand(!hand)}>
            <span style={{ opacity: hand ? 1 : 0.4 }}>
              <Hand />
            </span>
          </button>

          <button
           
  
  className="room__btn room__btn--hangup"
  onClick={() => {
    aiSocketRef.current?.emit("ai:end-meeting");
    stopAllMedia();
    endCall();
    navigate("/home");
  }}
>
  End
</button>

</div>      
</section> 

      {/* ===== PARTICIPANTES ===== */}
      <aside className="room__grid">
        {/* YO */}
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

        {/* OTROS */}
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

    {/* 👇 AQUÍ */}
    {aiSummary && (
      <div className="ai-summary">
        <h3>🧠 Resumen de la reunión</h3>
        <pre>{aiSummary}</pre>
      </div>
    )}

  </main>
);}
