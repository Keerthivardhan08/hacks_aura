"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { AlertCircle, Calendar, Link as LinkIcon, Users, Trophy } from "lucide-react";

export default function CreateHackathonPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("You must be logged in to create a hackathon");
      }

      // Convert comma-separated strings to arrays
      const themesArray = formData.themes.split(",").map(t => t.trim()).filter(Boolean);
      const tracksArray = formData.tracks.split(",").map(t => t.trim()).filter(Boolean);
      const prizesArray = formData.prizes.split(",").map(t => t.trim()).filter(Boolean);

      const { data, error: insertError } = await supabase
        .from("hackathons")
        .insert({
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
        .select()
        .single();

      if (insertError) throw insertError;

      router.push(`/hackathon/${data.id}`);
    } catch (err: any) {
      setError(err.message || "Failed to create hackathon");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-gray-800/50 p-8 rounded-2xl border border-gray-700/50 shadow-xl backdrop-blur">
          <div className="mb-8 border-b border-gray-700/50 pb-6">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Create New Hackathon
            </h1>
            <p className="text-gray-400 mt-2">Fill in the details to host your hackathon on the platform.</p>
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
                  placeholder="e.g. Global AI Hackathon 2026"
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
                  placeholder="Describe your hackathon..."
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
                  placeholder="Company or Organization"
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
                  placeholder="https://..."
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
                  placeholder="e.g. AI, Web3, FinTech"
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
                  placeholder="e.g. Beginner, Advanced, Sponsor Challenge"
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
                  placeholder="e.g. $5000 First Place, $2000 Second Place"
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
                {loading ? "Creating Hackathon..." : "Create Hackathon"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
