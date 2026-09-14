"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Lock } from "lucide-react";
import { usePathname } from "next/navigation";

export default function MaintenanceGuard({ children }: { children: React.ReactNode }) {
  const [isAllowed, setIsAllowed] = useState<boolean | null>(null);
  const pathname = usePathname();
  
  // Set this to false when you want to open the site to the public again!
  const IS_SITE_CLOSED = true; 

  useEffect(() => {
    // Always allow the login/signup pages so admins can actually log in!
    if (pathname === '/login' || pathname === '/signup' || !IS_SITE_CLOSED) {
      setIsAllowed(true);
      return;
    }

    const checkAccess = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsAllowed(false);
        return;
      }
      
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single();
        
      if (roleData && roleData.role === 'admin') {
        setIsAllowed(true); // Admins bypass the lock
      } else {
        setIsAllowed(false);
      }
    };
    
    checkAccess();
  }, [pathname]);

  if (isAllowed === null) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (isAllowed === false && IS_SITE_CLOSED && pathname !== '/login' && pathname !== '/signup') {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-center px-4">
        <Lock className="w-16 h-16 text-purple-500 mb-6" />
        <h1 className="text-4xl font-bold text-white mb-4">Site Officially Closed</h1>
        <p className="text-xl text-gray-400 max-w-lg mb-8">
          HackAura is currently closed for maintenance or the event has ended. 
          Thank you for participating!
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
