import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { getSupabaseClient } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    // Retry transient errors to avoid brief failure flashes
    const attemptSignIn = async (attempt = 1) => {
      const supabase = getSupabaseClient();
      if (!supabase) return { message: 'Supabase not initialized' };

      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (!error) return null;

      const msg = (error?.message || "").toString().toLowerCase();
      const isTransient = msg.includes("timeout") || msg.includes("network") || msg.includes("500");
      if (isTransient && attempt < 3) {
        await new Promise((res) => setTimeout(res, 200 * attempt));
        return attemptSignIn(attempt + 1);
      }
      return error;
    };

    const finalError = await attemptSignIn();
    if (finalError) {
      toast.error("Login failed");
    } else {
      navigate("/admin");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6">Admin Login</h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <Label>Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <Label>Password</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <Button type="submit" className="w-full">Login</Button>
        </form>
      </Card>
    </div>
  );
};

export default AdminLogin;
