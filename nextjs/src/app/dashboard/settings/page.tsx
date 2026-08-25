"use client";

import { useState } from "react";
import { Terminal, KeyRound, AlertTriangle, CheckCircle2 } from "lucide-react";

export default function SettingsPage() {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<{ type: 'idle' | 'loading' | 'success' | 'error', message?: string }>({ type: 'idle' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setStatus({ type: 'error', message: 'Mật khẩu xác nhận không khớp' });
      return;
    }
    
    if (newPassword.length < 6) {
      setStatus({ type: 'error', message: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
      return;
    }

    setStatus({ type: 'loading' });

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldPassword, newPassword }),
      });

      const data = await res.json();

      if (data.success) {
        setStatus({ type: 'success', message: 'Đổi mật khẩu thành công!' });
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setStatus({ type: 'error', message: data.error || 'Đã xảy ra lỗi' });
      }
    } catch (err) {
      setStatus({ type: 'error', message: 'Lỗi kết nối máy chủ' });
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="rounded-xl border border-neon-green/30 bg-terminal-bg shadow-[0_0_15px_rgba(57,255,20,0.1)] overflow-hidden">
        
          <div className="flex items-center justify-between px-4 py-2 border-b border-neon-green/30 bg-black/40">
          <div className="flex space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-500 opacity-80"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500 opacity-80"></div>
            <div className="w-3 h-3 rounded-full bg-green-500 opacity-80 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
          </div>
          <div className="text-xs text-neon-green/70 font-mono flex items-center">
            <Terminal size={12} className="mr-1" />
            settings.sh
          </div>
          <button 
            type="button"
            onClick={() => window.history.back()}
            className="text-xs text-gray-400 hover:text-white font-mono flex items-center"
          >
            [TRỞ VỀ]
          </button>
        </div>

        <div className="p-8">
          <div className="flex items-center space-x-3 border-b border-neon-green/20 pb-4 mb-6">
            <KeyRound size={28} className="text-neon-green" />
            <h2 className="text-xl font-mono font-bold text-white">ĐỔI MẬT KHẨU</h2>
          </div>

          {status.type === 'error' && (
            <div className="mb-6 bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-4 rounded flex items-center font-mono">
              <AlertTriangle size={18} className="mr-2 flex-shrink-0" />
              {status.message}
            </div>
          )}

          {status.type === 'success' && (
            <div className="mb-6 bg-neon-green/10 border border-neon-green/50 text-neon-green text-sm p-4 rounded flex items-center font-mono">
              <CheckCircle2 size={18} className="mr-2 flex-shrink-0" />
              {status.message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5 font-mono">
            <div>
              <label className="block text-neon-green text-sm mb-1">MẬT KHẨU HIỆN TẠI</label>
              <input 
                type="password" 
                required
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="w-full bg-black/50 border border-white/20 rounded p-2.5 text-white focus:outline-none focus:border-neon-green transition-colors"
                placeholder="••••••••"
              />
            </div>
            
            <div>
              <label className="block text-neon-green text-sm mb-1">MẬT KHẨU MỚI</label>
              <input 
                type="password" 
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-black/50 border border-white/20 rounded p-2.5 text-white focus:outline-none focus:border-neon-green transition-colors"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block text-neon-green text-sm mb-1">XÁC NHẬN MẬT KHẨU MỚI</label>
              <input 
                type="password" 
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-black/50 border border-white/20 rounded p-2.5 text-white focus:outline-none focus:border-neon-green transition-colors"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={status.type === 'loading'}
              className="mt-6 w-full bg-neon-green/10 hover:bg-neon-green text-neon-green hover:text-black py-3 rounded border border-neon-green transition-all font-bold disabled:opacity-50"
            >
              {status.type === 'loading' ? "ĐANG XỬ LÝ..." : "CẬP NHẬT MẬT KHẨU"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
