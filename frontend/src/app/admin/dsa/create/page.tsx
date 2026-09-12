"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { AlertCircle, Code, Calendar } from "lucide-react";

export default function CreateDsaProblemPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    difficulty: "Easy",
    starter_code: "// Write your code here",
    date: ""
  });

  useEffect(() => {
    const checkAdmin = async () => {
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
      }
    };
    checkAdmin();
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const { error: insertError } = await supabase
        .from("dsa_problems")
        .insert({
          title: formData.title,
          description: formData.description,
          difficulty: formData.difficulty,
          starter_code: formData.starter_code,
          date: formData.date
        });

      if (insertError) throw insertError;

      setSuccess("DSA Problem successfully scheduled!");
      setFormData({
        title: "",
        description: "",
        difficulty: "Easy",
        starter_code: "// Write your code here",
        date: ""
      });
    } catch (err: any) {
      setError(err.message || "Failed to schedule DSA problem");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-gray-800/50 p-8 rounded-2xl border border-gray-700/50 shadow-xl backdrop-blur">
          <div className="mb-8 border-b border-gray-700/50 pb-6 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-green-500 bg-clip-text text-transparent flex items-center gap-3">
                <Code className="h-8 w-8 text-blue-400" />
                Schedule DSA Problem
              </h1>
              <p className="text-gray-400 mt-2">Add a new daily coding challenge for the community.</p>
            </div>
            <button 
              onClick={() => router.push("/dashboard")}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Back
            </button>
          </div>

          {error && (
            <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 shrink-0" />
              <p className="text-sm text-red-300 font-medium">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 bg-green-500/10 border border-green-500/30 rounded-lg p-4 flex items-start gap-3">
              <div className="h-5 w-5 rounded-full bg-green-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-green-400 text-xs font-bold">✓</span>
              </div>
              <p className="text-sm text-green-300 font-medium">{success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">Problem Title</label>
                <input
                  type="text"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 text-white"
                  placeholder="e.g. Two Sum"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  Scheduled Date
                </label>
                <input
                  type="date"
                  name="date"
                  required
                  value={formData.date}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 text-white"
                />
                <p className="text-xs text-gray-500 mt-1">This is the date the problem will appear on the /dsa page.</p>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">Difficulty</label>
                <select
                  name="difficulty"
                  value={formData.difficulty}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 text-white"
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">Problem Description (Markdown supported)</label>
                <textarea
                  name="description"
                  required
                  rows={6}
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 text-white font-mono text-sm"
                  placeholder="Given an array of integers nums and an integer target..."
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">Starter Code</label>
                <textarea
                  name="starter_code"
                  required
                  rows={6}
                  value={formData.starter_code}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 text-green-400 font-mono text-sm"
                />
              </div>
            </div>

            <div className="pt-6 border-t border-gray-700/50">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-6 bg-gradient-to-r from-blue-500 to-green-500 text-white rounded-xl font-bold text-lg hover:from-blue-600 hover:to-green-600 transition-all shadow-lg shadow-green-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Scheduling..." : "Schedule Problem"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
