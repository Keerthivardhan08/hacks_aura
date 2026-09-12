"use client";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import Editor from "@monaco-editor/react";
import HackathonChat from "@/components/HackathonChat";
import CallManager from "@/components/CallManager";
import { Video, Mic, X, Share2, Play } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FlameArrowLeft } from "@/components/icons";

interface DsaProblem {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  starter_code: string;
}

const VideoPlayer = ({ stream }: { stream: MediaStream | null | undefined }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  if (!stream) return null;
  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted={true}
      className="absolute inset-0 w-full h-full object-cover rounded-lg"
    />
  );
};

export default function DsaPage() {
  const [problem, setProblem] = useState<DsaProblem | null>(null);
  const [code, setCode] = useState("// Loading...");
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [output, setOutput] = useState("");
  
  // Timer State
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  useEffect(() => {
    let interval: any;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };
  
  // Call State
  const callManagerRef = useRef<any>(null);
  const [callState, setCallState] = useState({
    isCallActive: false,
    activeSpeakers: [] as number[],
    error: null as string | null
  });

  const router = useRouter();

  useEffect(() => {
    const fetchUserAndProblem = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      
      setCurrentUserId(user.id);

      // Check Admin
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single();
        
      if (!roleData || roleData.role !== 'admin') {
        router.push("/dashboard");
        return;
      }

      // Fetch today's problem
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from("dsa_problems")
        .select("*")
        .eq("date", today)
        .single();
        
      if (!error && data) {
        setProblem(data);
        setCode(data.starter_code || "// Write your code here");
      }
    };
    fetchUserAndProblem();
  }, []);

  const handleRunCode = () => {
    setOutput("Running...\n");
    setTimeout(() => {
      setOutput("Success! All test cases passed.\nRuntime: 45ms");
    }, 1500);
  };

  const handleStartCall = async (options: { video: boolean; audio: boolean; screen: boolean }) => {
    try {
      if (!callManagerRef.current) return;
      await callManagerRef.current.startCall(options);
      setCallState(prev => ({ ...prev, isCallActive: true, error: null }));
    } catch (err: any) {
      setCallState(prev => ({ ...prev, error: err.message || "Failed to start call" }));
    }
  };

  const handleEndCall = () => {
    if (callManagerRef.current) {
      callManagerRef.current.endCall();
      setCallState(prev => ({ 
        ...prev, 
        isCallActive: false, 
        error: null 
      }));
    }
  };

  if (!problem) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
        <p>Loading today's problem...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col">
      {/* Hidden CallManager */}
      <CallManager 
        ref={callManagerRef}
        teamId={9999} // Use a generic teamId for the global DSA room
        isInitiator={false}
        onActiveSpeakersChange={(speakers) => setCallState(prev => ({ ...prev, activeSpeakers: speakers }))}
      />
      
      <header className="border-b border-gray-800 bg-gray-900/95 p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors">
            <FlameArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-bold text-white">Daily Problem: {problem.title}</h1>
          <span className={`px-2 py-1 rounded text-xs font-bold ${
            problem.difficulty === 'Easy' ? 'bg-green-500/20 text-green-400' :
            problem.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
            'bg-red-500/20 text-red-400'
          }`}>
            {problem.difficulty}
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-1.5 mr-2">
            <span className="font-mono text-lg font-bold text-blue-400">{formatTime(timer)}</span>
            <button 
              onClick={() => setIsTimerRunning(!isTimerRunning)}
              className="text-xs font-medium text-gray-400 hover:text-white px-2 py-1 bg-gray-700 rounded"
            >
              {isTimerRunning ? 'Pause' : 'Start'}
            </button>
            <button 
              onClick={() => { setTimer(0); setIsTimerRunning(false); }}
              className="text-xs font-medium text-gray-400 hover:text-white px-2 py-1 bg-gray-700 rounded"
            >
              Reset
            </button>
          </div>

          {!callState.isCallActive ? (
            <button onClick={() => handleStartCall({ video: true, audio: true, screen: false })} className="flex items-center gap-2 px-4 py-2 bg-green-600/20 hover:bg-green-600/30 text-green-400 rounded-lg text-sm font-medium">
              <Video className="h-4 w-4" /> Pair Program
            </button>
          ) : (
            <button onClick={handleEndCall} className="flex items-center gap-2 px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg text-sm font-medium">
              <X className="h-4 w-4" /> End Call
            </button>
          )}
          
          <button onClick={handleRunCode} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
            <Play className="h-4 w-4" /> Run Code
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: Description, Solutions & Chat */}
        <div className="w-[350px] flex flex-col border-r border-gray-800 bg-gray-900/50">
          <div className="p-6 flex-1 overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">{problem.title}</h2>
            <div className="prose prose-invert max-w-none text-gray-300">
              <p>{problem.description}</p>
            </div>
            
            <div className="mt-8 border-t border-gray-800 pt-6">
              <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">Admin Solutions</h3>
              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50 text-sm text-gray-400">
                <p>No previous solutions submitted yet.</p>
              </div>
            </div>
          </div>
          <div className="h-[400px] border-t border-gray-800">
            {/* The DSA global chat room */}
            <HackathonChat roomId="dsa_daily_global" currentUserId={currentUserId} />
          </div>
        </div>

        {/* Center Panel: Code Editor & Output */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1">
            <Editor
              height="100%"
              defaultLanguage="javascript"
              theme="vs-dark"
              value={code}
              onChange={(val) => setCode(val || "")}
              options={{
                minimap: { enabled: false },
                fontSize: 16,
                padding: { top: 16 }
              }}
            />
          </div>
          <div className="h-48 border-t border-gray-800 bg-[#1e1e1e] p-4 font-mono text-sm">
            <div className="text-gray-400 mb-2 border-b border-gray-700 pb-2">Output Console</div>
            <pre className="text-green-400 whitespace-pre-wrap">{output}</pre>
          </div>
        </div>
        
        {/* Right Panel: Video Calls (conditionally rendered) */}
        {callState.isCallActive && (
          <div className="w-[300px] border-l border-gray-800 bg-gray-900/50 p-4 flex flex-col gap-4 overflow-y-auto">
            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Pair Programming</h3>
            {Array.from({ length: 4 }, (_, i) => i + 1).map((position) => {
              const speakerId = callState.activeSpeakers[position - 1];
              const stream = speakerId 
                ? (speakerId === 1 
                    ? callManagerRef.current?.getLocalStream() 
                    : callManagerRef.current?.getRemoteStream(speakerId))
                : null;

              if (!speakerId) return null; // Only show active speakers in sidebar

              return (
                <div key={position} className="aspect-video bg-gray-800 rounded-lg overflow-hidden relative border border-gray-700">
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                    {stream && <VideoPlayer stream={stream} />}
                  </div>
                  <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded text-xs text-white">
                    User {speakerId}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
