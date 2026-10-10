import { createClient } from "@/lib/supabase/server";

export type AppUser = {
  id: string;
  email: string | null;
  fullName: string | null;
  role: "ADMIN" | "MANAGER" | "VIEWER";
};

export async function getCurrentUser(): Promise<AppUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .maybeSingle();

  const role = (profile?.role as AppUser["role"] | undefined) ?? "VIEWER";

  return {
    id: user.id,
    email: user.email ?? null,
    fullName: (profile?.full_name as string | null) ?? null,
    role,
  };
}
