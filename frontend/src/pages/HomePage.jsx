import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '../App';
import { Calendar, Users, Clock, Loader2, Trophy } from 'lucide-react';
import { Badge } from '../components/ui/badge';

const SLOT_NAMES = ['Masters', 'PGA Championship', 'U.S. Open', 'The Open'];

// Helpers for clean display
function formatDate(dateStr) {
  if (!dateStr) return 'TBD';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDeadline(dateStr) {
  if (!dateStr) return 'TBD';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' +
         d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export default function HomePage() {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get(`${API}/tournaments`)
      .then(r => setTournaments(Array.isArray(r.data) ? r.data : []))
      .catch(err => console.error("Data Load Error:", err))
      .finally(() => setLoading(false));
  }, []);

  // Map the 4 slots to real data or placeholders
  const allSlots = [1, 2, 3, 4].map(slot => {
    const t = tournaments?.find(x => x.slot === slot);
    return t || { slot, name: SLOT_NAMES[slot - 1], status: 'upcoming', team_count: 0 };
  });

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-slate-50">
      <Loader2 className="w-8 h-8 text-[#1B4332] animate-spin" />
    </div>
  );

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto min-h-screen">
      <div className="mb-10 flex items-end justify-between">
        <div>
          <h1 className="font-heading font-black text-4xl text-[#0F172A] tracking-tighter uppercase">
            The Majors
          </h1>
          <p className="text-slate-400 font-medium uppercase text-xs tracking-widest mt-1">
            2026 Fantasy Season
          </p>
        </div>
        <Trophy className="w-10 h-10 text-[#1B4332] hidden sm:block opacity-20" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {allSlots.map((t) => (
          <div 
            key={t.slot} 
            onClick={() => t.id && navigate('/teams')}
            className={`bg-white rounded-2xl border border-slate-100 shadow-sm p-6 transition-all relative overflow-hidden group 
              ${t.id ? 'hover:shadow-xl hover:border-[#1B4332]/30 cursor-pointer hover:-translate-y-1' : 'opacity-70 grayscale-[0.5]'}`}
          >
            {/* Design Accents */}
            <div className={`absolute top-0 left-0 w-full h-1.5 ${t.status === 'prices_set' ? 'bg-[#1B4332]' : 'bg-slate-200'}`} />
            
            <div className="flex justify-between items-start mb-6">
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Major {t.slot}</span>
                <h2 className="font-heading font-bold text-2xl text-[#0F172A] mt-1 group-hover:text-[#1B4332]">
                  {t.name}
                </h2>
              </div>
              <Badge className={`px-3 py-1 text-xs font-bold uppercase ${
                t.status === 'prices_set' ? 'bg-[#1B4332] text-white' : 'bg-slate-100 text-slate-400'
              }`}>
                {t.status === 'prices_set' ? 'Entries Open' : 'Coming Soon'}
              </Badge>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-[#2D6A4F]" />
                </div>
                <span>{t.start_date ? formatDate(t.start_date) : 'Schedule TBD'}</span>
              </div>

              <div className="flex items-center gap-3 text-sm text-slate-600">
                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-amber-500" />
                </div>
                <span>Deadline: <b className="text-slate-900">{t.deadline ? formatDeadline(t.deadline) : 'TBD'}</b></span>
              </div>

              <div className="flex items-center gap-3 text-sm text-slate-600">
                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center">
                  <Users className="w-4 h-4 text-[#1B4332]" />
                </div>
                <span><b className="text-slate-900">{t.team_count || 0}</b> Teams Active</span>
              </div>
            </div>

            {t.id && (
              <div className="mt-6 pt-4 border-t border-slate-50 flex items-center text-[#1B4332] font-bold text-xs uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity">
                Manage your team →
              </div>
            )}
          </div>
        ))}
      </div>

      <footer className="mt-20 text-center">
        <p className="text-slate-300 text-[10px] font-bold uppercase tracking-[0.2em]">
          Majors Fantasy Golf League • 2026
        </p>
      </footer>
    </div>
  );
}