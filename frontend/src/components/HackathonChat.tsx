"use client";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Send } from "lucide-react";

interface Message {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
}

export default function HackathonChat({ roomId, currentUserId }: { roomId: string, currentUserId?: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fetch initial messages
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("room_id", roomId)
        .order("created_at", { ascending: true });
      if (!error && data) setMessages(data);
    };
    fetchMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel(`chat_${roomId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `room_id=eq.${roomId}` },
        (payload) => {
          const newRealMsg = payload.new as Message;
          setMessages((prev) => {
            // Check if we already have this message (optimistic UI)
            // Or if we already have a message with exact same content sent in the last 2 seconds
            const isDuplicate = prev.some(m => 
              m.id === newRealMsg.id || 
              (m.content === newRealMsg.content && m.user_id === newRealMsg.user_id && new Date(newRealMsg.created_at).getTime() - new Date(m.created_at).getTime() < 5000)
            );
            
            if (isDuplicate) {
              // Replace the optimistic temp message with the real one
              return prev.map(m => (m.content === newRealMsg.content && m.user_id === newRealMsg.user_id) ? newRealMsg : m);
            }
            return [...prev, newRealMsg];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    if (!currentUserId) {
      alert("Error: You are not logged in or user ID is missing.");
      return;
    }

    const messageContent = newMessage;
    setNewMessage("");

    // Optimistic UI update
    const tempId = `temp-${Date.now()}`;
    const newMsg: Message = {
      id: tempId,
      content: messageContent,
      user_id: currentUserId,
      created_at: new Date().toISOString()
    };
    
    setMessages((prev) => [...prev, newMsg]);

    const { error } = await supabase.from("messages").insert([
      { room_id: roomId, user_id: currentUserId, content: messageContent }
    ]);
    
    if (error) {
      console.error("Failed to send message:", error);
      alert(`Database Error: ${error.message}. Did you forget to run the SQL script?`);
      // Remove the optimistic message if it failed
      setMessages((prev) => prev.filter(m => m.id !== tempId));
      return;
    }

    // AI Mentor Check
    if (messageContent.toLowerCase().startsWith("@mentor")) {
      try {
        const aiPrompt = messageContent.replace(/@mentor/i, "").trim();
        const res = await fetch("/api/mentor", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: aiPrompt })
        });
        
        if (res.ok) {
          const data = await res.json();
          // Insert the AI's response as a special message
          await supabase.from("messages").insert([
            { 
              room_id: roomId, 
              user_id: currentUserId, 
              content: `🤖 AI Mentor: ${data.text}` 
            }
          ]);
        }
      } catch (err) {
        console.error("AI Mentor error:", err);
      }
    }
  };

  return (
    <div className="flex flex-col h-[500px] bg-gray-800/50 rounded-xl border border-gray-700/50 overflow-hidden">
      <div className="p-4 border-b border-gray-700/50 bg-gray-900/50">
        <h3 className="font-semibold text-white">Live Chat</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const isAI = msg.content.startsWith("🤖 AI Mentor:");
          const displayContent = isAI ? msg.content.replace("🤖 AI Mentor:", "").trim() : msg.content;
          // Even though the current user sent the AI message trigger, we want AI responses to appear on the left as a different persona
          const isMe = msg.user_id === currentUserId && !isAI;

          return (
            <div 
              key={msg.id} 
              className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
            >
              {isAI && (
                <div className="flex items-center gap-2 mb-1">
                  <div className="h-6 w-6 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-xs">
                    🤖
                  </div>
                  <span className="text-xs font-bold text-emerald-400">AI Mentor</span>
                </div>
              )}
              <div className={`px-4 py-2 rounded-lg max-w-[80%] ${
                isMe ? 'bg-blue-600 text-white' : 
                isAI ? 'bg-emerald-900/50 border border-emerald-500/30 text-emerald-100' : 
                'bg-gray-700 text-gray-200'
              }`}>
                <p className="text-sm whitespace-pre-wrap">{displayContent}</p>
              </div>
              <span className="text-xs text-gray-500 mt-1">
                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="p-3 bg-gray-900/50 border-t border-gray-700/50 flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
          disabled={!currentUserId}
        />
        <button
          type="submit"
          disabled={!newMessage.trim() || !currentUserId}
          className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="h-5 w-5" />
        </button>
      </form>
    </div>
  );
}
