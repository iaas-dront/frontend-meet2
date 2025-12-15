import { useEffect, useState } from "react";
import { socket } from "../services/socket";

export default function Chat() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => {
    socket.on("receive_message", (data) => {
      setMessages((prev) => [...prev, data]);
    });

    return () => {
      socket.off("receive_message");
    };
  }, []);

  const sendMessage = () => {
    socket.emit("send_message", {
      roomId: "general",
      sender: "Camilo",
      message,
      time: Date.now(),
    });

    setMessage("");
  };

  return (
    <div>
      <h2>Chat</h2>

      <div>
        {messages.map((m, i) => (
          <p key={i}>
            <b>{m.sender}:</b> {m.message}
          </p>
        ))}
      </div>

      <input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />

      <button onClick={sendMessage}>Enviar</button>
    </div>
  );
}
