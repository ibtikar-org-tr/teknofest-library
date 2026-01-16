import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, User, Sparkles } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import botAvatar from "@assets/generated_images/teknofest_chatbot_avatar.png";

type Message = {
  id: string;
  role: "user" | "bot";
  content: string;
};

export default function Chatbot() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { 
      id: "1", 
      role: "bot", 
      content: "Hello! I'm TeknoBot. I can help you with competition rules, dates, or technical questions. How can I assist you today?" 
    }
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");

    // Simulate bot response
    setTimeout(() => {
      const botMsg: Message = { 
        id: (Date.now() + 1).toString(), 
        role: "bot", 
        content: "That's a great question! While I'm a demo bot, in the real application I would search the competition database to find that answer for you. For now, try checking the Resources page for the rulebooks!" 
      };
      setMessages(prev => [...prev, botMsg]);
    }, 1000);
  };

  return (
    <div className="h-screen bg-background flex flex-col font-sans overflow-hidden">
      <Navbar />
      
      <div className="flex-grow pt-20 flex container mx-auto p-4 md:p-6 gap-6 h-full">
        {/* Sidebar Info - Hidden on mobile */}
        <div className="hidden lg:flex flex-col w-80 shrink-0 gap-6">
          <div className="bg-card border border-border rounded-xl p-6 text-center">
            <div className="w-24 h-24 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center relative">
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full"></div>
              <img src={botAvatar} alt="TeknoBot" className="w-full h-full object-contain p-2 relative z-10" />
            </div>
            <h2 className="text-2xl font-bold font-display">TeknoBot</h2>
            <p className="text-muted-foreground mt-2 text-sm">
              Your AI Assistant for all things Teknofest. Powered by advanced LLMs.
            </p>
          </div>

          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Suggested Topics
            </h3>
            <div className="flex flex-wrap gap-2">
              {["Deadline extensions", "Drone specifications", "Team registration", "Prize distribution", "Venue location"].map(tag => (
                <button 
                  key={tag}
                  onClick={() => setInput(tag)}
                  className="text-xs bg-secondary hover:bg-primary hover:text-white transition-colors px-3 py-1.5 rounded-full"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Chat Interface */}
        <div className="flex-grow flex flex-col bg-card border border-border rounded-2xl shadow-xl overflow-hidden relative">
            {/* Chat Header (Mobile only) */}
            <div className="lg:hidden p-4 border-b border-border flex items-center gap-3 bg-muted/30">
                <Bot className="w-8 h-8 p-1.5 bg-primary text-white rounded-lg" />
                <div>
                    <h3 className="font-bold">TeknoBot</h3>
                    <p className="text-xs text-green-500 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                        Online
                    </p>
                </div>
            </div>

          {/* Messages Area */}
          <ScrollArea className="flex-1 p-4 md:p-6">
            <div className="space-y-6">
              {messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`flex gap-4 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                >
                  <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center ${msg.role === "user" ? "bg-secondary" : "bg-primary/10"}`}>
                    {msg.role === "user" ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5 text-primary" />}
                  </div>
                  
                  <div 
                    className={`max-w-[80%] rounded-2xl p-4 ${
                      msg.role === "user" 
                        ? "bg-primary text-primary-foreground rounded-tr-none" 
                        : "bg-secondary text-secondary-foreground rounded-tl-none"
                    }`}
                  >
                    <p className="text-sm md:text-base leading-relaxed">{msg.content}</p>
                  </div>
                </div>
              ))}
              <div ref={scrollRef} />
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="p-4 border-t border-border bg-background/50 backdrop-blur-sm">
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSend(); }}
              className="flex gap-2"
            >
              <Input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about competitions, rules, or dates..."
                className="flex-1 h-12 bg-background border-input focus:border-primary/50 rounded-xl"
              />
              <Button type="submit" size="icon" className="h-12 w-12 rounded-xl shrink-0">
                <Send className="w-5 h-5" />
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
