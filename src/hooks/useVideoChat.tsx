import { useEffect, useRef, useState } from "react";
import Peer from "peerjs";
import { videoSocket } from "../services/videoSocket";

export function useVideoChat(roomId: string) {
  const [myStream, setMyStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<{ [key: string]: MediaStream }>({});

  const peerRef = useRef<any>(null);
  const peers = useRef<{ [key: string]: any }>({});
  const [remoteScreenStream, setRemoteScreenStream] =
  useState<MediaStream | null>(null);

  // ------------------------------------------------
  // CREA UN STREAM FALSO (FAKE VIDEO TRACK)
  // ------------------------------------------------
  const createFakeVideoStream = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 480;

    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const fakeStream = canvas.captureStream(10); // 10 FPS
    return fakeStream;
  };

  useEffect(() => {
    let cancelled = false;

    if (!videoSocket.connected) videoSocket.connect();

    (async () => {
      let stream: MediaStream | null = null;

      // ------------------------------
      // INTENTAR OBTENER LA CÁMARA
      // ------------------------------
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      } catch (err) {
        console.warn("⚠ No hay cámara disponible. Usando video falso.");
      }

      // Si no hay cámara → crear fake stream
      if (!stream) {
        stream = createFakeVideoStream();
      }

      if (cancelled) return;

      setMyStream(stream);

      // ------------------------------------------------
      // INICIALIZAR PEERJS
      // ------------------------------------------------
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

      peer.on("open", (peerId) => {
        videoSocket.emit("join-video-room", { roomId, peerId });
      });

      // ------------------------------------------------
      // LLAMADAS ENTRANTES
      // ------------------------------------------------
      peer.on("call", (call) => {
  call.answer(stream);

  call.on("stream", (remoteStream: MediaStream) => {
    const videoTrack = remoteStream.getVideoTracks()[0];

    const isScreen =
      call.metadata?.type === "screen" ||
      videoTrack?.label.toLowerCase().includes("screen") ||
      videoTrack?.label.toLowerCase().includes("display");

    if (isScreen) {
      setRemoteScreenStream(remoteStream);
      return;
    }

    // 🎥 cámara normal
    setRemoteStreams((prev) => ({
      ...prev,
      [call.peer]: remoteStream,
    }));
  });

  call.on("close", () => {
    setRemoteStreams((prev) => {
      const copy = { ...prev };
      delete copy[call.peer];
      return copy;
    });

    setRemoteScreenStream(null);
  });

  peers.current[call.peer] = call;
});


      // ------------------------------------------------
      // NUEVO USUARIO
      // ------------------------------------------------
      videoSocket.off("user-connected");
      videoSocket.on("user-connected", ({ peerId }) => {
        connectToUser(peerId, stream!);
      });

      // ------------------------------------------------
      // USUARIO DESCONECTADO
      // ------------------------------------------------
      videoSocket.off("user-disconnected");
      videoSocket.on("user-disconnected", (peerId) => {
        if (peers.current[peerId]) peers.current[peerId].close();
        delete peers.current[peerId];

        setRemoteStreams((prev) => {
          const copy = { ...prev };
          delete copy[peerId];
          return copy;
        });
      });
    })();

    return () => {
      cancelled = true;

      Object.values(peers.current).forEach((call) => call.close());
      peers.current = {};

      peerRef.current?.destroy();
      peerRef.current = null;

      if (myStream) myStream.getTracks().forEach((t) => t.stop());

      videoSocket.disconnect();
    };
  }, [roomId]);

  // ------------------------------------------------
  // CONECTAR A UN USUARIO NUEVO
  // ------------------------------------------------
  const connectToUser = (peerId: string, stream: MediaStream) => {
    if (!peerRef.current) return;
    if (peers.current[peerId]) return;

    const call = peerRef.current.call(peerId, stream, {
  metadata: { type: "camera" },
});


    call.on("stream", (remoteStream: MediaStream) => {
      const id = call.peer;

      setRemoteStreams((prev) => ({
        ...prev,
        [id]: remoteStream,
      }));
    });

    call.on("close", () => {
      setRemoteStreams((prev) => {
        const copy = { ...prev };
        delete copy[peerId];
        return copy;
      });
    });

    peers.current[peerId] = call;
  };

  return {
  myStream,
  remoteStreams,
  remoteScreenStream, // 🔥
  peerRef,
};


}

