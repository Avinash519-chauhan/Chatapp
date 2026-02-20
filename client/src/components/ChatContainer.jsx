import React, { useContext, useEffect, useRef, useState } from "react";
import assets from "../assets/assets";
import { formateMessageTime } from "../lib/utils";
import { ChatContext } from "../../context/ChatContext";
import { AuthContext } from "../../context/AuthContext";
import { toast } from "react-hot-toast";

const ChatContainer = () => {
  const { messages, selectedUser, setSelectedUser, sendMessage, getMessages } =
    useContext(ChatContext);

  const { authUser, onlineUsers } = useContext(AuthContext);

  const scrollEnd = useRef();

  const [input, setInput] = useState("");
  const [showAIOptions, setShowAIOptions] = useState(false);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    await sendMessage({ text: input.trim() });
    setInput("");
  };

  const handleSendImage = async (e) => {
    const file = e.target.files[0];

    if (!file || !file.type.startsWith("image/")) {
      toast.error("Select a valid image file");
      return;
    }

    const reader = new FileReader();

    reader.onloadend = async () => {
      await sendMessage({ image: reader.result });
      e.target.value = "";
    };

    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (selectedUser) {
      getMessages(selectedUser._id);
    }
  }, [selectedUser]);

  useEffect(() => {
    if (scrollEnd.current) {
      scrollEnd.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // AI Part

  const handleAIImage = async () => {
    try {
      setShowAIOptions(false);

      const res = await fetch("http://localhost:5000/api/messages/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: "Generate a friendly chat related image",
        }),
      });

      const data = await res.json();

      if (data.imageUrl) {
        await sendMessage({ image: data.imageUrl });
      }
    } catch (error) {
      toast.error("AI image generation failed");
    }
  };

  const handleAIQuickReply = async () => {
    try {
      setShowAIOptions(false);

      const res = await fetch(
        "http://localhost:5000/api/messages/quick-reply",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lastMessage: messages?.length
              ? messages[messages.length - 1]?.text
              : "Hello",
          }),
        },
      );

      const data = await res.json();

      if (data.reply) {
        setInput(data.reply);
      }
    } catch (error) {
      toast.error("AI quick reply failed");
    }
  };

  const handleAIEndChat = async () => {
    setShowAIOptions(false);

    await sendMessage({
      text: "Sorry they are Busy now.😊Talk again Latter.",
    });

    setSelectedUser(null);
  };

  // =======================

  return selectedUser ? (
    <div className="h-full overflow-scroll relative backdrop-blur-lg">
      {/* HEADER */}
      <div className="flex items-center gap-3 py-3 mx-4 border-b border-stone-500">
        <img
          src={selectedUser.profilePic || assets.avatar_icon}
          alt=""
          className="w-8 rounded-full"
        />

        <p className="flex-1 text-lg text-white flex items-center gap-2">
          {selectedUser.fullName}
          {onlineUsers.includes(selectedUser._id) && (
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
          )}
        </p>

        <img
          onClick={() => setSelectedUser(null)}
          src={assets.arrow_icon}
          alt=""
          className="md:hidden max-w-7 cursor-pointer"
        />

        <img src={assets.help_icon} alt="" className="max-md:hidden max-w-5" />
      </div>

      <div className="flex flex-col h-[calc(100%-120px)] overflow-y-scroll p-3">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex items-end gap-2 ${
              msg.senderId === authUser._id ? "justify-end" : "flex-row"
            }`}
          >
            {msg.image ? (
              <img
                src={msg.image}
                alt=""
                className="max-w-[230px] border border-blue-700 rounded-lg mb-6"
              />
            ) : (
              <p
                className={`p-2 max-w-[230px] text-sm rounded-lg mb-6 whitespace-pre-wrap brack-words
                  ${
                    msg.senderId === authUser._id
                      ? "bg-violet-700 rounded-br-none"
                      : "bg-blue-700 rounded-bl-none"
                  } text-white`}
              >
                {msg.text}
              </p>
            )}

            <div className="text-center text-xs">
              <img
                src={
                  msg.senderId === authUser._id
                    ? authUser?.profilePic || assets.avatar_icon
                    : selectedUser?.profilePic || assets.avatar_icon
                }
                alt=""
                className="w-7 rounded-full"
              />
              <p className="text-gray-400">
                {formateMessageTime(msg.createdAt)}
              </p>
            </div>
          </div>
        ))}
        <div ref={scrollEnd}></div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 flex items-center gap-3 p-3">
        <div className="relative flex-1 flex items-center bg-gray-100/12 px-3 rounded-full">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage(e)}
            type="text"
            placeholder="Send a message"
            className="flex-1 text-sm p-3 bg-transparent outline-none text-white placeholder-gray-400"
          />

          <input
            onChange={handleSendImage}
            type="file"
            id="image"
            accept="image/png, image/jpeg"
            hidden
          />

          <label htmlFor="image">
            <img
              src={assets.gallery_icon}
              alt=""
              className="w-5 mr-2 cursor-pointer"
            />
          </label>

          {/* AI button and dropdown */}
          <button
            onClick={() => setShowAIOptions(!showAIOptions)}
            className="text-white border rounded-md font-medium px-2 py-1 cursor-pointer"
          >
            AI
          </button>

          {showAIOptions && (
            <div className="absolute bottom-12 right-0 bg-gray-800 text-white rounded-lg shadow-lg w-44 z-50">
              <p
                onClick={handleAIImage}
                className="px-3 py-2 hover:bg-gray-700 cursor-pointer"
              >
                🖼 Generate Image
              </p>
              <p
                onClick={handleAIQuickReply}
                className="px-3 py-2 hover:bg-gray-700 cursor-pointer"
              >
                ⚡ Quick Reply
              </p>
              <p
                onClick={handleAIEndChat}
                className="px-3 py-2 hover:bg-gray-700 cursor-pointer"
              >
                👋 End Chat
              </p>
            </div>
          )}
        </div>

        <img
          onClick={handleSendMessage}
          src={assets.send_button}
          alt=""
          className="w-7 cursor-pointer"
        />
      </div>
    </div>
  ) : (
    <div className="flex flex-col items-center justify-center gap-2 text-gray-500 bg-white/10 max-md:hidden">
      <img
        src="https://img.freepik.com/premium-vector/chat-app-logo-design-template-can-be-used-icon-chat-application-logo_605910-1724.jpg"
        alt=""
        className="max-w-50"
      />
      <p className="text-lg font-medium text-white">Chat anytime, anywhere</p>
    </div>
  );
};

export default ChatContainer;
