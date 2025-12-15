import { io } from "socket.io-client";

export const socket = io("https://backend-chat-meet.onrender.com", {
  autoConnect: true
});

