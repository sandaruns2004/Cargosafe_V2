"use client"
import { Package, Mail, Lock, User, Building } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/services/api";

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        const res = await api.post("/auth/login", { email, password });
        localStorage.setItem("token", res.access_token);
        router.push("/dashboard");
      } else {
        await api.post("/auth/register", { name, email, password, company_name: company });
        const res = await api.post("/auth/login", { email, password });
        localStorage.setItem("token", res.access_token);
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md relative overflow-hidden rounded-2xl border border-edge bg-surface backdrop-blur-2xl shadow-card animate-fade-up">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-neon/40 to-transparent" />
        
        <div className="p-8">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-neon to-teal flex items-center justify-center shadow-glow mb-4">
              <Package className="w-8 h-8 text-white" />
            </div>
            <h1 className="font-display text-3xl font-extrabold text-txt-primary">CargoSafe</h1>
            <p className="text-txt-secondary mt-1">Fleet Intelligence Platform</p>
          </div>

          <div className="flex bg-black/20 rounded-xl p-1 mb-6">
            <button onClick={() => setIsLogin(true)} className={`flex-1 py-2 rounded-lg font-medium text-sm transition-colors ${isLogin ? 'bg-neon/20 text-neon' : 'text-txt-secondary hover:text-txt-primary'}`}>Sign In</button>
            <button onClick={() => setIsLogin(false)} className={`flex-1 py-2 rounded-lg font-medium text-sm transition-colors ${!isLogin ? 'bg-neon/20 text-neon' : 'text-txt-secondary hover:text-txt-primary'}`}>Register</button>
          </div>

          {error && <div className="mb-4 p-3 bg-coral/10 border border-coral/20 rounded-xl text-coral text-sm text-center">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div className="relative group">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-txt-muted transition-colors group-focus-within:text-neon">
                    <User className="w-4 h-4" />
                  </span>
                  <input type="text" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} required className="w-full pl-11 pr-4 py-3 rounded-xl border border-edge bg-white/[0.03] text-txt-primary font-body text-sm placeholder:text-txt-muted outline-none transition-all duration-300 focus:border-edge-accent focus:bg-neon/[0.05] focus:ring-2 focus:ring-neon/15 hover:border-white/15" />
                </div>
                <div className="relative group">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-txt-muted transition-colors group-focus-within:text-neon">
                    <Building className="w-4 h-4" />
                  </span>
                  <input type="text" placeholder="Company Name (Optional)" value={company} onChange={e => setCompany(e.target.value)} className="w-full pl-11 pr-4 py-3 rounded-xl border border-edge bg-white/[0.03] text-txt-primary font-body text-sm placeholder:text-txt-muted outline-none transition-all duration-300 focus:border-edge-accent focus:bg-neon/[0.05] focus:ring-2 focus:ring-neon/15 hover:border-white/15" />
                </div>
              </>
            )}
            <div className="relative group">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-txt-muted transition-colors group-focus-within:text-neon">
                <Mail className="w-4 h-4" />
              </span>
              <input type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} required className="w-full pl-11 pr-4 py-3 rounded-xl border border-edge bg-white/[0.03] text-txt-primary font-body text-sm placeholder:text-txt-muted outline-none transition-all duration-300 focus:border-edge-accent focus:bg-neon/[0.05] focus:ring-2 focus:ring-neon/15 hover:border-white/15" />
            </div>
            <div className="relative group">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-txt-muted transition-colors group-focus-within:text-neon">
                <Lock className="w-4 h-4" />
              </span>
              <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full pl-11 pr-4 py-3 rounded-xl border border-edge bg-white/[0.03] text-txt-primary font-body text-sm placeholder:text-txt-muted outline-none transition-all duration-300 focus:border-edge-accent focus:bg-neon/[0.05] focus:ring-2 focus:ring-neon/15 hover:border-white/15" />
            </div>

            <button type="submit" disabled={loading} className="w-full relative group inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-neon to-teal rounded-xl font-body font-semibold text-white text-sm shadow-neon-btn transition-all duration-300 hover:-translate-y-0.5 hover:shadow-neon-btn-hover mt-6 disabled:opacity-50">
              <span>{loading ? "Please wait..." : isLogin ? "Sign In" : "Register"}</span>
            </button>
          </form>
        </div>
        <div className="px-8 py-4 bg-black/20 text-center text-xs text-txt-muted border-t border-edge">
          Secured · End-to-end encrypted
        </div>
      </div>
    </div>
  );
}
