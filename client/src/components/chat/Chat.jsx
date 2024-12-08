import { useContext, useEffect, useRef, useState } from "react";
import "./chat.scss";
import { AuthContext } from "../../context/AuthContext";
import apiRequest from "../../lib/apiRequest";
import { format } from "timeago.js";
import { SocketContext } from "../../context/SocketContext";
import { useNotificationStore } from "../../lib/notificationStore";

function Chat({ chats }) {
  const [chat, setChat] = useState(null);
  const [chatsState, setChatsState] = useState(chats);
  const { currentUser } = useContext(AuthContext);
  const { socket } = useContext(SocketContext);

  const messageEndRef = useRef();

  const decrease = useNotificationStore((state) => state.decrease);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  useEffect(() => {
    setChatsState(chats);
  }, [chats]);

  const handleOpenChat = async (id, receiver) => {
    try {
      const res = await apiRequest("/chats/" + id);
      if (!res.data.data.seenBy.includes(currentUser.id)) {
        decrease();
      }
      setChat({ ...res.data.data, receiver });
    } catch (err) {
      console.log(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const text = formData.get("text");

    if (!text) return;
    try {
      const res = await apiRequest.post("/messages/" + chat.id, { text });
      console.log("handlesubmit res:", res);

      // Store the message ID that we just sent
      lastSentMessageRef.current = res.data.data.id;

      setChat((prev) => ({
        ...prev,
        Message: [...prev.Message, res.data.data],
      }));
      e.target.reset();
      socket.emit("sendMessage", {
        receiverId: chat.receiver.id,
        data: res.data.data,
      });
    } catch (err) {
      console.log(err);
    }
  };

  const chatRef = useRef();
  const lastSentMessageRef = useRef(null);
  // Keep chatRef in sync with chat state
  useEffect(() => {
    chatRef.current = chat;
  }, [chat]);

  useEffect(() => {
    const read = async () => {
      try {
        await apiRequest.put("/chats/read/" + chatRef.current.id);
      } catch (err) {
        console.log(err);
      }
    };

    if (!socket) return;

    const handleMessage = (data) => {
      console.log('Received message:', data);
      
      // Skip if this is a message we just sent (for non-self messages)
      if (!data.fromSelf && lastSentMessageRef.current === data.id) {
        console.log('Skipping already handled message');
        return;
      }
      
      // Update the current chat if we're in it
      if (chatRef.current?.id === data.chatId) {
        console.log('Chat IDs match, updating chat');
        setChat((prev) => {
          if (!prev) return null;
          // Check if message already exists to prevent duplicates
          if (prev.Message.some(msg => msg.id === data.id)) {
            return prev;
          }
          return { ...prev, Message: [...prev.Message, data] };
        });
        
        // Only mark as read if we're receiving a message (not sending)
        if (!data.fromSelf) {
          read();
        }
      }

      // Update the chats list to show latest message
      setChatsState((prevChats) => {
        return prevChats.map((c) => {
          if (c.id === data.chatId) {
            return {
              ...c,
              lastMessage: data.text,
              // Keep seenBy as is for sender's own messages
              seenBy: data.fromSelf ? c.seenBy : c.seenBy.filter(id => id !== currentUser.id)
            };
          }
          return c;
        });
      });
    };

    console.log('Setting up socket listener');
    socket.on("getMessage", handleMessage);
    
    return () => {
      console.log('Cleaning up socket listener');
      socket.off("getMessage", handleMessage);
    };
  }, [socket]);

  return (
    <div className="chat">
      <div className="messages">
        <h1>Messages</h1>
        {chatsState?.map((c) => (
          <div
            className="message"
            key={c.id}
            style={{
              backgroundColor:
                c.seenBy.includes(currentUser.id) || chat?.id === c.id
                  ? "white"
                  : "#fecd514e",
            }}
            onClick={() => handleOpenChat(c.id, c.receiver)}
          >
            <img src={c.receiver.avatar || "/noavatar.jpg"} alt="" />
            <span>{c.receiver.username}</span>
            <p>{c.lastMessage}</p>
          </div>
        ))}
      </div>
      {chat && (
        <div className="chatBox">
          <div className="top">
            <div className="user">
              <img src={chat.receiver.avatar || "noavatar.jpg"} alt="" />
              {chat.receiver.username}
            </div>
            <span className="close" onClick={() => setChat(null)}>
              X
            </span>
          </div>
          <div className="center">
            {chat.Message.map((message) => (
              <div
                className="chatMessage"
                style={{
                  alignSelf:
                    message.senderId === currentUser.id
                      ? "flex-end"
                      : "flex-start",
                  textAlign:
                    message.senderId === currentUser.id ? "right" : "left",
                }}
                key={message.id}
              >
                <p>{message.text}</p>
                <span>{format(message.createdAt)}</span>
              </div>
            ))}
            <div ref={messageEndRef}></div>
          </div>
          <form onSubmit={handleSubmit} className="bottom">
            <textarea name="text"></textarea>
            <button>Send</button>
          </form>
        </div>
      )}
    </div>
  );
}

export default Chat;
