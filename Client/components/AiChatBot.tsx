'use client';
import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { XMarkIcon, ChatBubbleOvalLeftEllipsisIcon } from "@heroicons/react/24/solid";

interface ChatMessage {
  sender: "user" | "bot";
  message: string;
}

export default function AiChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () =>
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });

  useEffect(scrollToBottom, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = { sender: "user", message: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const response = await axios.post("http://localhost:3500/api/ai-chat", {
        message: userMsg.message,
      });

      const botMsg: ChatMessage = {
        sender: "bot",
        message: response.data.reply,
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        { sender: "bot", message: "Sorry, something went wrong." },
      ]);
    }

    setLoading(false);
  };

  return (
    <>
      {/* Floating Button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 bg-blue-600 hover:bg-blue-700 w-16 h-16 rounded-full flex items-center justify-center shadow-xl transition"
        >
          <ChatBubbleOvalLeftEllipsisIcon className="w-8 text-white" />
        </button>
      )}

      {/* Chat Window */}
      {open && (
        <div className="fixed bottom-5 right-5 w-[360px] h-[520px] bg-white shadow-2xl rounded-2xl flex flex-col z-50 border">

          {/* Header */}
          <div className="bg-blue-600 text-white p-4 rounded-t-2xl flex justify-between items-center">
            <div className="flex items-center gap-2">
              <img
                src="https://cdn-icons-png.flaticon.com/512/4712/4712100.png"
                className="w-7 h-7"
                alt="bot"
              />
              <span className="font-semibold">StyleKart AI Support</span>
            </div>
            <XMarkIcon
              className="w-6 cursor-pointer"
              onClick={() => setOpen(false)}
            />
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-gray-50">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${
                  msg.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`px-3 py-2 rounded-xl max-w-[75%] ${
                    msg.sender === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-900"
                  }`}
                >
                  {msg.message}
                </div>
              </div>
            ))}

            {loading && <p className="text-gray-400">Typing...</p>}

            <div ref={chatEndRef}></div>
          </div>

          {/* Input */}
          <div className="p-3 flex gap-2 border-t">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              className="flex-1 px-3 py-2 border rounded-xl"
              placeholder="Ask something..."
            />
            <button
              onClick={sendMessage}
              className="bg-blue-600 px-4 text-white rounded-xl hover:bg-blue-700"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}
