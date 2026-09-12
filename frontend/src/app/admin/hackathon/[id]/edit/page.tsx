"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useParams } from "next/navigation";
import { AlertCircle, Calendar, Link as LinkIcon, Users, Trophy } from "lucide-react";

export default function EditHackathonPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    organizer: "",
    website: "",
    submission_deadline: "",
    themes: "",
    tracks: "",
    prizes: "",
    status: "upcoming"
  });

  useEffect(() => {
    const fetchHackathonAndCheckAdmin = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push("/login");
          return;
        }
        
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .single();
        
        if (!roleData || roleData.role !== 'admin') {
          router.push("/dashboard");
          return;
        }

        const { data, error } = await supabase
          .from("hackathons")
          .select("*")
          .eq("id", params.id)
          .single();

        if (error) throw error;

        // Format datetime for the input field (remove the Z and milliseconds)
        let formattedDeadline = "";
        if (data.submission_deadline) {
            const date = new Date(data.submission_deadline);
            // format: YYYY-MM-DDThh:mm
            formattedDeadline = date.toISOString().slice(0, 16);
        }

        setFormData({
          name: data.name || "",
          description: data.description || "",
          organizer: data.organizer || "",
          website: data.website || "",
          submission_deadline: formattedDeadline,
          themes: (data.themes || []).join(", "),
          tracks: (data.tracks || []).join(", "),
          prizes: (data.prizes || []).join(", "),
          status: data.status || "upcoming"
        });
      } catch (err: any) {
        setError("Failed to load hackathon details.");
      } finally {
        setFetching(false);
      }
    };
    
    fetchHackathonAndCheckAdmin();
  }, [params.id, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const themesArray = formData.themes.split(",").map(t => t.trim()).filter(Boolean);
      const tracksArray = formData.tracks.split(",").map(t => t.trim()).filter(Boolean);
      const prizesArray = formData.prizes.split(",").map(t => t.trim()).filter(Boolean);

      const { error: updateError } = await supabase
        .from("hackathons")
        .update({
          name: formData.name,
          description: formData.description,
          organizer: formData.organizer,
          website: formData.website,
          submission_deadline: new Date(formData.submission_deadline).toISOString(),
          themes: themesArray,
          tracks: tracksArray,
          prizes: prizesArray,
          status: formData.status
        })
        .eq("id", params.id);

      if (updateError) throw updateError;

      router.push(`/hackathon/${params.id}`);
    } catch (err: any) {
      setError(err.message || "Failed to update hackathon");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="min-h-screen bg-gray-900 flex justify-center items-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-gray-800/50 p-8 rounded-2xl border border-gray-700/50 shadow-xl backdrop-blur">
          <div className="mb-8 border-b border-gray-700/50 pb-6 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                Edit Hackathon
              </h1>
              <p className="text-gray-400 mt-2">Update the details for your hackathon.</p>
            </div>
            <button 
              onClick={() => router.push(`/hackathon/${params.id}`)}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>

          {error && (
            <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 shrink-0" />
              <p className="text-sm text-red-300 font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">Hackathon Name</label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 text-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                <textarea
                  name="description"
                  required
                  rows={4}
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-400" />
                  Organizer Name
                </label>
                <input
                  type="text"
                  name="organizer"
                  required
                  value={formData.organizer}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                  <LinkIcon className="w-4 h-4 text-gray-400" />
                  Official Website
                </label>
                <input
                  type="url"
                  name="website"
                  required
                  value={formData.website}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 text-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  Submission Deadline
                </label>
                <input
                  type="datetime-local"
                  name="submission_deadline"
                  required
                  value={formData.submission_deadline}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 text-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">Themes (comma-separated)</label>
                <input
                  type="text"
                  name="themes"
                  required
                  value={formData.themes}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 text-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">Tracks (comma-separated)</label>
                <input
                  type="text"
                  name="tracks"
                  required
                  value={formData.tracks}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 text-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-yellow-400" />
                  Prizes (comma-separated amounts/descriptions)
                </label>
                <input
                  type="text"
                  name="prizes"
                  required
                  value={formData.prizes}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 text-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 text-white"
                >
                  <option value="upcoming">Upcoming</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-700/50">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-bold text-lg hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Saving Changes..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
