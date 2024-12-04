"use client";

import { useEffect, useState } from "react";

// ** import ui components
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// ** import lib
import { useSession } from "@/lib/auth-client";

interface UserProfile {
  id: string;
  name: string;
  image?: string | null | undefined;
  email: string;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const Header = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isHydrated, setIsHydrated] = useState(false); // Track hydration state
  const { data, isPending, error } = useSession(); // Use the useSession hook

  useEffect(() => {
    setIsHydrated(true); // Mark hydrated as true when client-side rendering starts
  }, []);

  useEffect(() => {
    if (data?.session?.id) {
      setProfile(data.user);
    } else {
      setProfile(null);
    }
  }, [data]);

  // Return nothing or fallback if hydration hasn't completed
  if (!isHydrated) return null;

  return (
    <header className="flex items-center justify-between w-full px-4 py-2 bg-white border-b border-gray-200">
      <h1 className="text-lg font-semibold text-gray-800">My App</h1>
      <Separator orientation="vertical" className="h-6 mx-4" />
      {isPending ? (
        <div className="text-gray-500">Loading... ⌛</div>
      ) : error ? (
        <div className="text-red-500">Error loading profile</div>
      ) : profile ? (
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-gray-800">
            {profile.name || "User"}
          </span>
          <Avatar>
            <AvatarImage
              src={profile.image?.replace("=s96-c", "") || ""}
              alt={profile.name || "User Profile"}
            />
            <AvatarFallback>{profile.name?.[0] || "U"}</AvatarFallback>
          </Avatar>
        </div>
      ) : (
        <span className="text-sm text-gray-500">Please log in</span>
      )}
    </header>
  );
};
