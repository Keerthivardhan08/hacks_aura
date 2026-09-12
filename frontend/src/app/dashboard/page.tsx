"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { Calendar, Plus, Trophy, Users } from "lucide-react";
import { NotificationBell } from "@/components/NotificationBell";
import { useRouter } from "next/navigation";

interface Hackathon {
  id: string;
  name: string;
  description: string;
  submission_deadline: string;
  status: string;
}

export default function Dashboard() {
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchHackathons = async () => {
      try {
        const { data, error } = await supabase
          .from("hackathons")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;
        setHackathons(data || []);
      } catch (err) {
        console.error("Failed to load hackathons:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHackathons();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <header className="border-b border-gray-800 bg-gray-900/95 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              HackAura
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <Link 
              href="/dsa"
              className="text-gray-300 hover:text-white font-medium px-4 py-2 bg-gray-800 rounded-lg transition-colors"
            >
              Daily DSA
            </Link>
            <Link 
              href="/admin/hackathon/create"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg transition-colors font-medium"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Create Hackathon</span>
            </Link>
            <NotificationBell />
            <button 
              onClick={handleLogout}
              className="text-sm text-gray-400 hover:text-red-400 ml-4"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col gap-8">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">Explore Hackathons</h2>
            <p className="text-gray-400">Discover and join upcoming hackathons from around the world.</p>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
            </div>
          ) : hackathons.length === 0 ? (
            <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-12 text-center">
              <Trophy className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-300 mb-2">No hackathons yet</h3>
              <p className="text-gray-500 mb-6">Be the first to create one!</p>
              <Link 
                href="/admin/hackathon/create"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
              >
                <Plus className="h-5 w-5" />
                Create Hackathon
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {hackathons.map((hackathon) => (
                <Link 
                  href={`/hackathon/${hackathon.id}`}
                  key={hackathon.id}
                  className="group bg-gray-800/50 border border-gray-700/50 rounded-xl overflow-hidden hover:border-purple-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10"
                >
                  <div className="h-32 bg-gradient-to-br from-blue-900/40 to-purple-900/40 border-b border-gray-700/50 relative">
                    <div className="absolute top-4 right-4 px-3 py-1 bg-gray-900/80 backdrop-blur rounded-full text-xs font-medium border border-gray-700 text-green-400">
                      {hackathon.status ? hackathon.status.toUpperCase() : "UPCOMING"}
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-400 transition-colors">
                      {hackathon.name}
                    </h3>
                    <p className="text-gray-400 text-sm line-clamp-2 mb-4">
                      {hackathon.description}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(hackathon.submission_deadline).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Users className="h-4 w-4" />
                        <span>Join</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
