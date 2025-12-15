import { io } from "socket.io-client";

export const aiSocket = io(
  import.meta.env.VITE_AI_SOCKET_URL,
  {
    transports: ["websocket"],
  }
);

