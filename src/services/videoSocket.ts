import { io } from "socket.io-client";

export const videoSocket = io(
  import.meta.env.VITE_CAM_SERVER_URL,
  {
    autoConnect: false,
    transports: ["websocket"],
  }
);
