import { useEffect, useRef, useState } from "react";
import Peer from "peerjs";
import { voiceSocket } from "../services/voiceSocket";

export interface Participant {
  peerId: string;
  username: string;
  talking?: boolean;
}

export function useVoiceChat(roomId: string, username: string) {
  const [myStream, setMyStream] = useState<MediaStream | null>(null);
  const [isTalking, setIsTalking] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);

  const peers = useRef<{ [key: string]: any }>({});
  const peerRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;
    let socketReady = false;

    // Ensure socket is connected and set a flag when it is
    if (!voiceSocket.connected) {
      voiceSocket.connect();
    }
    const onSocketConnect = () => {
      socketReady = true;
      console.debug("[voiceSocket] connected (useVoiceChat)");
    };
    voiceSocket.on("connect", onSocketConnect);

    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      if (cancelled) return;

      setMyStream(stream);

      /* --- Detect my voice --- */
      const ctx = new AudioContext();
      const analyser = ctx.createAnalyser();
      const src = ctx.createMediaStreamSource(stream);
      analyser.fftSize = 512;
      src.connect(analyser);

      const data = new Uint8Array(analyser.frequencyBinCount);

      const detectMyVoice = () => {
        analyser.getByteFrequencyData(data);
        const volume = data.reduce((a, b) => a + b, 0) / data.length;
        setIsTalking(volume > 25);
        requestAnimationFrame(detectMyVoice);
      };

      detectMyVoice();

      /* -------------------- Initialize PeerJS -------------------- */
      if (!peerRef.current) {
        const peer = new Peer({
          host: import.meta.env.VITE_PEER_HOST,
          port: Number(import.meta.env.VITE_PEER_PORT),
          secure: import.meta.env.VITE_PEER_SECURE === "true",
          path: import.meta.env.VITE_PEER_PATH,
          config: {
            iceServers: [
              { urls: [import.meta.env.VITE_STUN] },
              { urls: [import.meta.env.VITE_ICE] },
            ],
          },
        });

        peerRef.current = peer;

        // Wait for peer open. But only emit join when socket is ready.
        peer.on("open", (peerId) => {
          console.debug("[peer] open", peerId);
          // If socket is already connected, emit immediately; otherwise wait for socket connect
          if (socketReady || voiceSocket.connected) {
            voiceSocket.emit("join-voice-room", {
              roomId,
              peerId,
              username,
            });
          } else {
            // CHK: wait for socket to connect before emitting join
            const tryEmit = () => {
              if (voiceSocket.connected) {
                voiceSocket.emit("join-voice-room", {
                  roomId,
                  peerId,
                  username,
                });
                voiceSocket.off("connect", tryEmit);
              }
            };
            voiceSocket.on("connect", tryEmit);
            // safety: after 2s, if still not connected, try emit anyway (prevents stuck)
            setTimeout(() => {
              if (peerRef.current && !voiceSocket.connected) {
                console.warn("[useVoiceChat] socket still not connected after 2s, emitting join anyway");
                voiceSocket.emit("join-voice-room", {
                  roomId,
                  peerId,
                  username,
                });
              }
            }, 2000);
          }
        });

        /* --- Incoming call --- */
        peer.on("call", (call) => {
          call.answer(stream);

          call.on("stream", (userStream) => {
            addAudio(userStream, call.peer);
          });

          peers.current[call.peer] = call;
        });
      }

      /* -------------------- Socket events -------------------- */

      // When we receive the full list of users in the room (sent only to the new user)
      voiceSocket.on("voice-room-users", (users: Participant[]) => {
        console.debug("[voice-room-users] received", users);
        setParticipants(users);

        // CHK: Actively try to call existing users (helps when the peerConnected event race happens)
        // small delay to ensure peerRef and internal states are ready
        setTimeout(() => {
          if (!peerRef.current) return;
          users.forEach((u) => {
            if (u.peerId === peerRef.current.id) return;
            // Avoid duplicate attempts if we already have a connection
            if (!peers.current[u.peerId]) {
              try {
                connectToNewUser(u.peerId, stream);
              } catch (err) {
                console.warn("[useVoiceChat] connectToNewUser failed for", u.peerId, err);
              }
            }
          });
        }, 300); // 300ms is usually enough; increase if networks are flaky
      });

      const handleConnect = (data: Participant) => {
        console.debug("[user-connected] ", data);
        setParticipants((prev) => [...prev, data]);

        // Give a slight delay to let the newly-connected peer finish its setup
        setTimeout(() => connectToNewUser(data.peerId, stream), 400);
      };

      const handleDisconnect = (peerId: string) => {
        console.debug("[user-disconnected]", peerId);
        setParticipants((prev) => prev.filter((p) => p.peerId !== peerId));
        if (peers.current[peerId]) peers.current[peerId].close();
        delete peers.current[peerId];
      };

      voiceSocket.on("user-connected", handleConnect);
      voiceSocket.on("user-disconnected", handleDisconnect);

      /* -------------------- CLEANUP -------------------- */
      return () => {
        cancelled = true;

        voiceSocket.off("connect", onSocketConnect);
        voiceSocket.off("user-connected", handleConnect);
        voiceSocket.off("user-disconnected", handleDisconnect);
        voiceSocket.off("voice-room-users");

        Object.values(peers.current).forEach((c) => c.close());
        peers.current = {};

        if (peerRef.current) {
          peerRef.current.destroy();
          peerRef.current = null;
        }

        stream.getTracks().forEach((t) => t.stop());
      };
    });
  }, [roomId, username]); // <-- add deps to be safer if those change

  /* -------------------- CONNECT TO NEW USER -------------------- */
  const connectToNewUser = (peerId: string, streamOverride?: MediaStream) => {
    const stream = streamOverride || myStream;
    if (!stream || !peerRef.current) return;

    // If we already have this call active, ignore
    if (peers.current[peerId]) return;

    try {
      const call = peerRef.current.call(peerId, stream);

      call.on("stream", (userStream: MediaStream) => {
        addAudio(userStream, call.peer);
      });

      call.on("close", () => {
        // cleanup if remote closes
        if (peers.current[peerId]) delete peers.current[peerId];
      });

      peers.current[peerId] = call;
    } catch (err) {
      console.warn("[useVoiceChat] error calling peer", peerId, err);
    }
  };

  /* -------------------- ADD AUDIO STREAM -------------------- */
  /* -------------------- ADD AUDIO STREAM -------------------- */
const addAudio = (stream: MediaStream, peerId?: string) => {
  const audio = document.createElement("audio");
  audio.srcObject = stream;
  audio.autoplay = true;

  // FIX: soporte para móviles (Chrome / Safari)
  (audio as any).playsInline = true;
  audio.setAttribute("playsinline", "true");
  audio.setAttribute("webkit-playsinline", "true");
  audio.muted = false;

  // Necesario para permitir que Chrome Android lo reproduzca sin interacción
  audio.addEventListener("canplay", () => {
    audio.play().catch((e) => console.warn("Autoplay bloqueado:", e));
  });

  if (!peerId) return;

  const ctx = new AudioContext();
  const analyser = ctx.createAnalyser();
  const src = ctx.createMediaStreamSource(stream);

  analyser.fftSize = 256;
  src.connect(analyser);

  const data = new Uint8Array(analyser.frequencyBinCount);

  const detectVoice = () => {
    analyser.getByteFrequencyData(data);
    const volume = data.reduce((a, b) => a + b, 0) / data.length;

    setParticipants((prev) =>
      prev.map((p) =>
        p.peerId === peerId ? { ...p, talking: volume > 20 } : p
      )
    );

    requestAnimationFrame(detectVoice);
  };

  detectVoice();
};

  /* -------------------- END CALL -------------------- */
  const endCall = () => {
    if (myStream) myStream.getTracks().forEach((t) => t.stop());

    Object.values(peers.current).forEach((c) => c.close());
    peers.current = {};

    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }

    if (voiceSocket.connected) voiceSocket.disconnect();
  };

  return {
    myStream,
    isTalking,
    participants,
    connectToNewUser,
    endCall,
    peerRef,
  };
}
