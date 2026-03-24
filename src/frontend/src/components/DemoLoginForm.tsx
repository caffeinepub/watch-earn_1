import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Loader2, TestTube2 } from "lucide-react";
import { useState } from "react";
import { attemptDemoLogin } from "../utils/demoMode";

interface DemoLoginFormProps {
  onSuccess: () => void;
}

export function DemoLoginForm({ onSuccess }: DemoLoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const ok = await attemptDemoLogin(email, password);
      if (ok) {
        onSuccess();
      } else {
        setError("Invalid demo credentials");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleLogin} className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <TestTube2
          className="w-4 h-4"
          style={{ color: "oklch(0.83 0.16 87)" }}
        />
        <span
          className="text-xs font-semibold"
          style={{ color: "oklch(0.83 0.16 87)" }}
        >
          Demo / Test Account
        </span>
      </div>

      <input
        type="email"
        placeholder="Demo email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="w-full rounded-xl px-4 py-2.5 text-sm bg-white/5 border border-white/10 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-yellow-500/50"
      />

      <div className="relative">
        <input
          type={showPass ? "text" : "password"}
          placeholder="Demo password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full rounded-xl px-4 py-2.5 pr-10 text-sm bg-white/5 border border-white/10 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-yellow-500/50"
        />
        <button
          type="button"
          onClick={() => setShowPass((p) => !p)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        >
          {showPass ? (
            <EyeOff className="w-4 h-4" />
          ) : (
            <Eye className="w-4 h-4" />
          )}
        </button>
      </div>

      {error && <p className="text-red-400 text-xs">{error}</p>}

      <Button
        type="submit"
        disabled={loading}
        className="w-full h-10 rounded-full text-sm font-bold"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.55 0.15 87), oklch(0.45 0.13 82))",
          color: "oklch(0.95 0.01 87)",
          border: "none",
        }}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Verifying...
          </span>
        ) : (
          "Login as Demo"
        )}
      </Button>
    </form>
  );
}
