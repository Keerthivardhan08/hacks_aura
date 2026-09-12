"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Shield, Clock, AlertTriangle, CheckCircle, Flame, Users, Calendar, Video } from "lucide-react";
import CallManager from "@/components/CallManager";
import HackathonChat from "@/components/HackathonChat";
import { FlameArrowLeft } from "@/components/icons";

export default function AdminHubPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"general" | "dsa" | "hackathons">("general");
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [sessionTime, setSessionTime] = useState(0); // in seconds
  
  // Call State for General Meetings
  const callManagerRef = useRef<any>(null);
  const [callState, setCallState] = useState({
    isCallActive: false,
    activeSpeakers: [] as number[],
    error: null as string | null
  });

  useEffect(() => {
    const checkAdminAndTrackTime = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setCurrentUserId(user.id);
      
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single();
      
      if (!roleData || roleData.role !== 'admin') {
        router.push("/dashboard");
        return;
      }
    };
    
    checkAdminAndTrackTime();

    // Mock session tracker
    const startTime = localStorage.getItem("adminSessionStart");
    if (!startTime) {
      localStorage.setItem("adminSessionStart", Date.now().toString());
    } else {
      const elapsed = Math.floor((Date.now() - parseInt(startTime)) / 1000);
      setSessionTime(elapsed);
    }

    const interval = setInterval(() => {
      setSessionTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [router]);

  const handleStartCall = async () => {
    try {
      if (!callManagerRef.current) return;
      await callManagerRef.current.startCall({ video: true, audio: true, screen: false });
      setCallState(prev => ({ ...prev, isCallActive: true, error: null }));
    } catch (err: any) {
      setCallState(prev => ({ ...prev, error: err.message || "Failed to start call" }));
    }
  };

  const handleEndCall = () => {
    if (callManagerRef.current) {
      callManagerRef.current.endCall();
      setCallState(prev => ({ ...prev, isCallActive: false, error: null }));
    }
  };

  const getLoginMessage = () => {
    const minutes = Math.floor(sessionTime / 60);
    if (minutes < 30) {
      return { 
        text: `You have only been logged in for ${minutes} minutes. Please be consistent! You need 30 minutes minimum.`,
        type: 'warning',
        icon: <AlertTriangle className="h-5 w-5 text-yellow-400" />
      };
    }
    return { 
      text: "Great job! You have met your 30-minute daily requirement.",
      type: 'success',
      icon: <CheckCircle className="h-5 w-5 text-green-400" />
    };
  };

  const status = getLoginMessage();

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col">
      <CallManager 
        ref={callManagerRef}
        teamId={777} // Dedicated Admin Meeting Room
        isInitiator={false}
        onActiveSpeakersChange={(speakers) => setCallState(prev => ({ ...prev, activeSpeakers: speakers }))}
      />

      <header className="border-b border-gray-800 bg-gray-900/95 p-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors">
            <FlameArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-purple-500" />
            <h1 className="text-xl font-bold text-white">Admin Command Center</h1>
          </div>
        </div>
        
        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${status.type === 'warning' ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-green-500/10 border-green-500/30'}`}>
          {status.icon}
          <span className={`text-sm font-medium ${status.type === 'warning' ? 'text-yellow-300' : 'text-green-300'}`}>
            Session: {Math.floor(sessionTime / 60)}m {sessionTime % 60}s
          </span>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Nav */}
        <div className="w-64 border-r border-gray-800 bg-gray-900/50 p-4 flex flex-col gap-2">
          <button 
            onClick={() => setActiveTab("general")}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${activeTab === 'general' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-gray-800'}`}
          >
            <Users className="h-5 w-5" />
            General Meetings
          </button>
          <button 
            onClick={() => setActiveTab("dsa")}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${activeTab === 'dsa' ? 'bg-green-600 text-white' : 'text-gray-400 hover:bg-gray-800'}`}
          >
            <Flame className="h-5 w-5" />
            DSA Daily
          </button>
          <button 
            onClick={() => setActiveTab("hackathons")}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${activeTab === 'hackathons' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800'}`}
          >
            <Calendar className="h-5 w-5" />
            Hackathons
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-5xl mx-auto">
            
            {/* Reporting Banner */}
            <div className={`mb-8 p-4 rounded-xl border flex items-start gap-4 ${status.type === 'warning' ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-green-500/10 border-green-500/30'}`}>
              <div className="mt-0.5">{status.icon}</div>
              <div>
                <h3 className={`font-semibold ${status.type === 'warning' ? 'text-yellow-400' : 'text-green-400'}`}>
                  Admin Activity Report
                </h3>
                <p className={`text-sm mt-1 ${status.type === 'warning' ? 'text-yellow-300/80' : 'text-green-300/80'}`}>
                  {status.text}
                </p>
              </div>
            </div>

            {/* General Tab */}
            {activeTab === "general" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Admin Meeting Room</h2>
                  {!callState.isCallActive ? (
                    <button onClick={handleStartCall} className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium shadow-lg shadow-purple-500/20">
                      <Video className="h-5 w-5" /> Start Admin Meeting
                    </button>
                  ) : (
                    <button onClick={handleEndCall} className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium shadow-lg shadow-red-500/20">
                      End Meeting
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[500px]">
                  <div className="lg:col-span-2 bg-gray-800/50 rounded-xl border border-gray-700 p-4">
                    {callState.isCallActive ? (
                      <div className="grid grid-cols-2 gap-4 h-full">
                        {/* Video feeds would render here natively if we abstracted VideoPlayer */}
                        <div className="bg-gray-900 rounded-lg flex items-center justify-center border border-purple-500/30 relative">
                           <div className="absolute top-2 right-2 flex items-center gap-2 text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded">
                             <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" /> Live
                           </div>
                           <span className="text-gray-500">Video Feed Active</span>
                        </div>
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-gray-500">
                        <Video className="h-16 w-16 mb-4 opacity-20" />
                        <p>No active meetings.</p>
                      </div>
                    )}
                  </div>
                  <div className="lg:col-span-1 h-full">
                    <HackathonChat roomId="admin_general_hq" currentUserId={currentUserId} />
                  </div>
                </div>
              </div>
            )}

            {/* DSA Tab */}
            {activeTab === "dsa" && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">DSA Management</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
                    <h3 className="text-lg font-semibold mb-2">Schedule Problem</h3>
                    <p className="text-sm text-gray-400 mb-4">Add new problems to the daily rotation.</p>
                    <Link href="/admin/dsa/create" className="inline-block px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium">
                      Create Problem
                    </Link>
                  </div>
                  <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
                    <h3 className="text-lg font-semibold mb-2">View Live DSA Page</h3>
                    <p className="text-sm text-gray-400 mb-4">Jump into today's problem and assist users.</p>
                    <Link href="/dsa" className="inline-block px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium">
                      Go to Daily DSA
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Hackathons Tab */}
            {activeTab === "hackathons" && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Hackathon Management</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
                    <h3 className="text-lg font-semibold mb-2">Host New Hackathon</h3>
                    <p className="text-sm text-gray-400 mb-4">Set up a new event for the community.</p>
                    <Link href="/admin/hackathon/create" className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium">
                      Create Hackathon
                    </Link>
                  </div>
                  <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
                    <h3 className="text-lg font-semibold mb-2">Manage Access</h3>
                    <p className="text-sm text-gray-400 mb-4">Go to the dashboard to select a hackathon to edit.</p>
                    <Link href="/dashboard" className="inline-block px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium">
                      View All Hackathons
                    </Link>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
