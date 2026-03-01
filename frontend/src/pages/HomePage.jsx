import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '../App';
import { Calendar, Users, Clock, ChevronRight, Loader2, MapPin } from 'lucide-react';
import { Badge } from '../components/ui/badge';

function formatDate(dateStr) {
  if (!dateStr) return 'TBD';
  try { return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
  catch { return 'TBD'; }
}

function formatDeadline(dateStr) {
  if (!dateStr) return 'TBD';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' +
      d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  } catch { return 'TBD'; }
}

function getStatusBadge(status, deadline) {
  if (status === 'completed') return { text: 'Completed', cls: 'bg-slate-500 text-white' };
  if (status === 'prices_set') {
    if (deadline) { try { if (new Date() > new Date(deadline)) return { text: 'Locked', cls: 'bg-amber-500 text-white' }; } catch {} }
    return { text: 'Open', cls: 'bg-emerald-500 text-white' };
  }
  if (status === 'golfers_loaded') return { text: 'Setting Up', cls: 'bg-blue-500 text-white' };
  return { text: 'Coming Soon', cls: 'bg-slate-300 text-slate-700' };
}

const SLOT_NAMES = ['Masters', 'PGA Championship', 'U.S. Open', 'The Open'];

const SLOT_VENUES = {
  1: { course: 'Augusta National Golf Club', location: 'Augusta, GA' },
  2: { course: 'Quail Hollow Club', location: 'Charlotte, NC' },
  3: { course: 'Oakmont Country Club', location: 'Oakmont, PA' },
  4: { course: 'Royal Portrush', location: 'Portrush, N. Ireland' },
};

const SLOT_1_GIF = 'https://res.cloudinary.com/dsvpfi9te/image/upload/v1772325267/MicrosoftTeams-video_lcv2jg.gif';

const SLOT_VIDEOS = {
  2: 'https://res.cloudinary.com/dsvpfi9te/video/upload/v1772307415/MicrosoftTeams-video_1_ntghow.mp4',
  3: 'https://res.cloudinary.com/dsvpfi9te/video/upload/v1772307409/MicrosoftTeams-video_3_ajregd.mp4',
  4: 'https://res.cloudinary.com/dsvpfi9te/video/upload/v1772307415/MicrosoftTeams-video_2_hfd5sd.mp4',
};

function getStillFrameUrl(videoUrl) {
  return videoUrl
    .replace('/video/upload/', '/video/upload/so_0/')
    .replace('.mp4', '.jpg');
}

function getGifFirstFrameUrl() {
  return SLOT_1_GIF
    .replace('/image/upload/', '/image/upload/pg_1/')
    .replace('.gif', '.jpg');
}

function getActiveSlot(allSlots) {
  const withDeadlines = allSlots.filter(t => t.deadline);
  if (withDeadlines.length === 0) return 1;

  const now = new Date();
  const upcoming = withDeadlines.filter(t => new Date(t.deadline) > now);

  if (upcoming.length > 0) {
    upcoming.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
    return upcoming[0].slot;
  }

  // All deadlines passed — use the most recently passed one
  withDeadlines.sort((a, b) => new Date(b.deadline) - new Date(a.deadline));
  return withDeadlines[0].slot;
}

export default function HomePage() {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get(`${API}/tournaments`).then(r => setTournaments(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const allSlots = [1, 2, 3, 4].map(slot => {
    const t = tournaments.find(x => x.slot === slot);
    return t || { slot, name: SLOT_NAMES[slot - 1], status: 'setup', team_count: 0, golfer_count: 0, start_date: '', end_date: '', deadline: '' };
  });

  const activeSlot = getActiveSlot(allSlots);

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <Loader2 className="w-8 h-8 text-[#1B4332] animate-spin" />
    </div>
  );

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto animate-fade-in-up">
      {/* Tournaments */}
      <div className="mb-6">
        <h1 className="font-heading font-extrabold text-3xl sm:text-4xl text-[#0F172A] tracking-tight" data-testid="home-title">
          THE MAJORS
        </h1>
        <p className="text-slate-500 text-sm mt-1">Four tournaments. Infinite glory.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10 mt-4 stagger" data-testid="tournament-grid">
        {allSlots.map((t) => {
          const badge = getStatusBadge(t.status, t.deadline);
          return (
            <div key={t.slot}
              className="relative bg-white rounded-xl border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_24px_rgba(27,67,50,0.12)] transition-all duration-300 overflow-hidden group cursor-pointer"
              data-testid={`tournament-card-${t.slot}`}
              onClick={() => t.id ? navigate('/teams') : null}
            >
              {/* Watermark media — animated for nearest deadline, still frame for others */}
              <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                {t.slot === 1 ? (
                  <img
                    src={activeSlot === 1 ? SLOT_1_GIF : getGifFirstFrameUrl()}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{ filter: 'saturate(1.8)' }}
                  />
                ) : activeSlot === t.slot ? (
                  <video
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{ filter: 'saturate(1.8)' }}
                  >
                    <source src={SLOT_VIDEOS[t.slot]} type="video/mp4" />
                  </video>
                ) : (
                  <img
                    src={getStillFrameUrl(SLOT_VIDEOS[t.slot])}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{ filter: 'saturate(1.8)' }}
                  />
                )}
                <div className="absolute inset-0 bg-white/[0.84]" />
              </div>
              <div className="relative z-10">
              <div className="h-2 bg-gradient-to-r from-[#1B4332] to-[#2D6A4F]" />
              <div className="p-5 md:p-6">
                <div className="flex items-start justify-between mb-3">
                  <h2 className="font-heading font-bold text-xl text-[#0F172A]">{t.name}</h2>
                  <Badge className={badge.cls + ' text-xs font-bold ml-3 flex-shrink-0'}>{badge.text}</Badge>
                </div>

                {/* Venue */}
                <div className="flex items-start gap-2 mb-4">
                  <MapPin className="w-4 h-4 text-[#2D6A4F] mt-0.5 flex-shrink-0" />
                  <div className="text-sm leading-snug">
                    <span className="font-semibold text-[#0F172A]">{SLOT_VENUES[t.slot].course}</span>
                    <span className="text-slate-400"> · </span>
                    <span className="text-slate-500">{SLOT_VENUES[t.slot].location}</span>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Calendar className="w-4 h-4 text-[#2D6A4F]" />
                    <span>{formatDate(t.start_date)} – {formatDate(t.end_date)}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Clock className="w-4 h-4 text-amber-500 flex-shrink-0" />
                    <span className="text-slate-500">Deadline:</span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 font-bold text-xs">
                      {formatDeadline(t.deadline)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500">
                    <Users className="w-4 h-4 text-[#1B4332]" />
                    <span><strong className="text-[#0F172A] font-numbers">{t.team_count}</strong> teams entered</span>
                  </div>
                </div>

                {t.id && t.has_prices && (
                  <div className="mt-4">
                    <span className="inline-flex items-center gap-1 bg-amber-500 text-white px-3 py-1.5 rounded-lg text-sm font-bold group-hover:bg-amber-600 group-hover:translate-x-0.5 transition-all duration-200">
                      Build Your Team <ChevronRight className="w-4 h-4" />
                    </span>
                  </div>
                )}
              </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
