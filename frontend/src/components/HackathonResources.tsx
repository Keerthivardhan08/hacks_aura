"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { FileText, Link as LinkIcon, Upload, Trash2, ExternalLink } from "lucide-react";

interface Resource {
  id: string;
  title: string;
  url: string;
  type: string;
  created_at: string;
}

export default function HackathonResources({ hackathonId, currentUserId }: { hackathonId: string, currentUserId?: string }) {
  const [resources, setResources] = useState<Resource[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchResources();
  }, [hackathonId]);

  const fetchResources = async () => {
    const { data, error } = await supabase
      .from("resources")
      .select("*")
      .eq("hackathon_id", hackathonId)
      .order("created_at", { ascending: false });
    if (!error && data) setResources(data);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !currentUserId) return;
    const file = e.target.files[0];
    setIsUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${hackathonId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('hackathon-files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('hackathon-files')
        .getPublicUrl(filePath);

      let type = 'other';
      if (fileExt === 'pdf') type = 'pdf';
      if (['ppt', 'pptx'].includes(fileExt || '')) type = 'ppt';
      if (['doc', 'docx'].includes(fileExt || '')) type = 'doc';

      await supabase.from("resources").insert([
        {
          hackathon_id: hackathonId,
          title: file.name,
          url: publicUrlData.publicUrl,
          type: type,
          uploaded_by: currentUserId
        }
      ]);

      fetchResources();
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Failed to upload file");
    } finally {
      setIsUploading(false);
      // Reset input
      e.target.value = '';
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this resource?")) return;
    await supabase.from("resources").delete().eq("id", id);
    fetchResources();
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'link': return <LinkIcon className="h-5 w-5 text-blue-400" />;
      default: return <FileText className="h-5 w-5 text-purple-400" />;
    }
  };

  return (
    <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 overflow-hidden mt-6">
      <div className="p-4 border-b border-gray-700/50 bg-gray-900/50 flex justify-between items-center">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <FileText className="h-4 w-4" /> Resources & Documents
        </h3>
        
        {currentUserId && (
          <label className="cursor-pointer flex items-center gap-2 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg transition-colors text-sm font-medium">
            <Upload className="h-4 w-4" />
            {isUploading ? "Uploading..." : "Upload File"}
            <input 
              type="file" 
              className="hidden" 
              onChange={handleFileUpload}
              disabled={isUploading}
            />
          </label>
        )}
      </div>
      
      <div className="p-4">
        {resources.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">No resources uploaded yet.</p>
        ) : (
          <div className="space-y-3">
            {resources.map((res) => (
              <div key={res.id} className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg group">
                <div className="flex items-center gap-3">
                  {getIcon(res.type)}
                  <a href={res.url} target="_blank" rel="noopener noreferrer" className="text-gray-200 hover:text-blue-400 hover:underline transition-colors">
                    {res.title}
                  </a>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <a href={res.url} target="_blank" rel="noopener noreferrer" className="p-1.5 text-gray-400 hover:text-white rounded bg-gray-800">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                  {currentUserId && (
                    <button onClick={() => handleDelete(res.id)} className="p-1.5 text-gray-400 hover:text-red-400 rounded bg-gray-800">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
