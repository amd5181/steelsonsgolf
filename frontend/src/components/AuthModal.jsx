import { useState } from 'react';
import { toast } from 'sonner';
import axios from 'axios';
import { API, useAuth } from '../App';
import { Dialog, DialogContent } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { LogIn, UserPlus } from 'lucide-react';

export default function AuthModal({ open, onClose, onSuccess, defaultMode = 'login' }) {
  const [mode, setMode] = useState(defaultMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const reset = () => { setName(''); setEmail(''); setLoading(false); };
  const handleClose = () => { reset(); onClose(); };

  const handleLogin = async () => {
    if (!email.trim()) { toast.error('Enter your email'); return; }
    setLoading(true);
    try {
      const { data } = await axios.post(`${API}/auth/login`, { email: email.trim() });
      login(data);
      toast.success(`Welcome back, ${data.name}!`);
      reset();
      onSuccess?.(data);
      onClose();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Email not found. Please register.');
    } finally { setLoading(false); }
  };

  const handleRegister = async () => {
    if (!name.trim()) { toast.error('Enter your name'); return; }
    if (!email.trim()) { toast.error('Enter your email'); return; }
    setLoading(true);
    try {
      const { data } = await axios.post(`${API}/auth/register`, { name: name.trim(), email: email.trim() });
      login(data);
      toast.success(`Welcome to Steel Sons Golf, ${data.name}!`);
      reset();
      onSuccess?.(data);
      onClose();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="sm:max-w-sm p-0 overflow-hidden rounded-2xl" onOpenAutoFocus={e => e.preventDefault()}>
        {/* Header */}
        <div className="bg-gradient-to-br from-[#1B4332] to-[#081C15] px-6 pt-6 pb-5 text-center">
          <img
            src="https://res.cloudinary.com/dsvpfi9te/image/upload/v1771700941/ChatGPT_Image_Feb_21_2026_02_07_41_PM_kzc10a.png"
            alt="Steel Sons Golf"
            className="w-14 h-14 mx-auto mb-2 object-contain"
          />
          <h2 className="font-heading font-extrabold text-xl text-white tracking-tight">STEEL SONS GOLF</h2>
          <p className="text-[#CCFF00] text-xs font-bold tracking-wider mt-0.5">BLAST FURNACE OF CHAMPIONS</p>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4">
          {/* Tab switcher */}
          <div className="flex bg-slate-100 rounded-lg p-1 gap-1">
            <button onClick={() => setMode('login')}
              className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${mode === 'login' ? 'bg-[#1B4332] text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              <LogIn className="w-4 h-4 inline mr-1.5 -mt-0.5" />Sign In
            </button>
            <button onClick={() => setMode('register')}
              className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${mode === 'register' ? 'bg-[#1B4332] text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              <UserPlus className="w-4 h-4 inline mr-1.5 -mt-0.5" />Create Account
            </button>
          </div>

          <div className="space-y-3">
            {mode === 'register' && (
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Full Name</label>
                <Input value={name} onChange={e => setName(e.target.value)}
                  placeholder="John Smith" className="h-11 bg-slate-50 border-slate-200" />
              </div>
            )}
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Email</label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (mode === 'login' ? handleLogin() : handleRegister())}
                placeholder="john@example.com" className="h-11 bg-slate-50 border-slate-200" />
            </div>
          </div>

          <Button onClick={mode === 'login' ? handleLogin : handleRegister} disabled={loading}
            className="w-full h-12 bg-[#1B4332] hover:bg-[#2D6A4F] text-white font-bold uppercase tracking-wider rounded-xl">
            {loading ? 'Loading...' : mode === 'login' ? 'Sign In' : 'Create Account & Save'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
