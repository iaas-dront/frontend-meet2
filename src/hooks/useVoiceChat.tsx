import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getAuth } from "firebase/auth";

import "../styles/room.sass";

// Socket normal
import { socket } from "../services/socket";
// Socket IA
import { aiSocket } from "../services/aiSocket";

// Hooks
import { useVoiceChat } from "../hooks/useVoiceChat";
import { useVideoChat } from "../hooks/useVideoChat";

import {
  Camera,
  CameraOut,
  Share,
  Sharex,
  Hand,
  Mic,
  MicOff,
} from "../icons";

/* ================= TYPES ================= */
interface ChatMessage {
  sender: string;
  message: string;
  time?: number;
}

/* ================= COMPONENT ================= */
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

  /* ================= IA ================= */
  const [summary, setSummary] = useState<string | null>(null);

  /* ================= FOCUS VIDEO ================= */
  const [focusedPeer, setFocusedPeer] = useState<string | null>(null);

  /* ================= CONTROLS ================= */
  const [muted, setMuted] = useState(false);
  const [camera, setCamera] = useState(false);
  const [hand, setHand] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [cameraConfirmed, setCameraConfirmed] = useState(false);
  const [micConfirmed, setMicConfirmed] = useState(false);

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

  /* ================= SOCKET CHAT ================= */
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

  /* ================= IA JOIN ================= */
  useEffect(() => {
    if (!username) return;

    aiSocket.emit("ai:join", {
      username,
      email: user?.email || "no-email@test.com",
    });

    aiSocket.on("ai:summary", (data: string) => {
      setSummary(data);
    });

    return () => {
      aiSocket.off("ai:summary");
    };
  }, [username, user]);

  /* ================= SEND MESSAGE ================= */
  const sendMessage = () => {
    if (!message.trim() || !id) return;

    socket.emit("send_message", {
      roomId: id,
      sender: username,
      message,
      time: Date.now(),
    });

    // 👉 IA también recibe el chat
    aiSocket.emit("ai:chat", { username, message });

    setMessage("");
  };

  /* ================= AUDIO ================= */
  useEffect(() => {
    if (!audioStream) return;
    audioStream.getAudioTracks().forEach((t) => (t.enabled = !muted));
  }, [audioStream, muted]);

  /* ================= VIDEO PRINCIPAL ================= */
  useEffect(() => {
    if (!myMainVideoRef.current) return;

    if (!focusedPeer) {
      myMainVideoRef.current.srcObject = videoStream ?? null;
      return;
    }

    const remote = remoteStreams[focusedPeer];
    if (remote) myMainVideoRef.current.srcObject = remote;
  }, [focusedPeer, videoStream, remoteStreams]);

  /* ================= MI VIDEO GRID ================= */
  useEffect(() => {
    if (videoStream && myGridVideoRef.current) {
      myGridVideoRef.current.srcObject = videoStream;
    }
  }, [videoStream]);

  /* ================= REMOTE VIDEOS ================= */
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
  const stopAllMedia = () => {
    videoStream?.getTracks().forEach((t) => t.stop());
    audioStream?.getTracks().forEach((t) => t.stop());
  };

  /* ================= UI ================= */
  return (
    <main className="room">
      <section className="room__main">
        <h2 className="room__title">Meeting: {id}</h2>

        {/* ===== VIDEO ===== */}
        <div className="room__video-grid">
          {videoStream && (
            <video
              ref={myMainVideoRef}
              autoPlay
              playsInline
              muted
              onClick={() => setFocusedPeer(null)}
              className="room__video-self"
              style={{ display: camera ? "block" : "none" }}
            />
          )}

          {Object.entries(remoteStreams).map(([peerId]) => (
            <video
              key={peerId}
              ref={(el) => {
  remoteVideoRefs.current[peerId] = el;
}}

              autoPlay
              playsInline
              className="room__video-user"
              onClick={() => setFocusedPeer(peerId)}
            />
          ))}
        </div>

        {/* ===== CONTROLES ===== */}
        <div className="room__controls">
          <button className="room__btn" onClick={() => setMuted(!muted)}>
            {muted ? <MicOff /> : <Mic />}
          </button>

          <button className="room__btn" onClick={() => setCamera(!camera)}>
            {camera ? <Camera /> : <CameraOut />}
          </button>

          <button className="room__btn" onClick={() => setSharing(!sharing)}>
            {sharing ? <Sharex /> : <Share />}
          </button>

          <button className="room__btn" onClick={() => setHand(!hand)}>
            <Hand />
          </button>

          <button
            className="room__btn room__btn--hangup"
            onClick={() => {
              aiSocket.emit("ai:end-meeting"); // 🔥 IA
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
        {participants.map((p) => (
          <div
            key={p.peerId}
            className={`room__grid-item ${p.talking ? "is-speaking" : ""}`}
          >
            <div className="room__small-avatar">
              {p.username.charAt(0).toUpperCase()}
            </div>
            <div className="room__name-tag">{p.username}</div>
          </div>
        ))}
      </aside>

      {/* ===== CHAT ===== */}
      <button
        className="room__chat-button"
        onClick={() => setChatOpen(!chatOpen)}
      >
        💬
      </button>

      {chatOpen && (
        <>
          <div className="chat-overlay" onClick={() => setChatOpen(false)} />
          <div className="room__chat-panel" ref={chatRef}>
            <div className="room__chat-messages">
              {messages.map((m, i) => (
                <p key={i}>
                  <strong>{m.sender}:</strong> {m.message}
                </p>
              ))}
            </div>

            <div className="room__chat-input">
              <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Mensaje..."
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              />
              <button onClick={sendMessage}>Enviar</button>
            </div>
          </div>
        </>
      )}

      {/* ===== SUMMARY IA ===== */}
      {summary && (
        <div className="summary-modal">
          <h2>📄 Resumen de la reunión</h2>
          <pre>{summary}</pre>
          <button onClick={() => setSummary(null)}>Cerrar</button>
        </div>
      )}
    </main>
  );
}
