import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '../App';
import { Calendar, Users, Clock, ChevronRight, Loader2, MapPin, Play, Tv } from 'lucide-react';
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
  2: { course: 'Aronimink Golf Club', location: 'Newtown Square, PA' },
  3: { course: 'Shinnecock Hills Golf Club', location: 'Southampton, NY' },
  4: { course: 'Royal Birkdale', location: 'Southport, England' },
};

const SLOT_1_GIF = 'https://res.cloudinary.com/dsvpfi9te/image/upload/v1772325267/MicrosoftTeams-video_lcv2jg.gif';

const SLOT_VIDEOS = {
  2: 'https://res.cloudinary.com/dsvpfi9te/video/upload/v1772307415/MicrosoftTeams-video_1_ntghow.mp4',
  3: 'https://res.cloudinary.com/dsvpfi9te/video/upload/v1772307409/MicrosoftTeams-video_3_ajregd.mp4',
  4: 'https://res.cloudinary.com/dsvpfi9te/video/upload/v1772307415/MicrosoftTeams-video_2_hfd5sd.mp4',
};

function getActiveSlot(allSlots) {
  const withDeadlines = allSlots.filter(t => t.deadline);
  if (withDeadlines.length === 0) return 1;
  const now = new Date();
  const upcoming = withDeadlines.filter(t => new Date(t.deadline) > now);
  if (upcoming.length > 0) {
    upcoming.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
    return upcoming[0].slot;
  }
  withDeadlines.sort((a, b) => new Date(b.deadline) - new Date(a.deadline));
  return withDeadlines[0].slot;
}

function FeaturedBanner({ t, navigate }) {
  const badge = getStatusBadge(t.status, t.deadline);
  const venue = SLOT_VENUES[t.slot];

  return (
    <div
      className="relative rounded-2xl overflow-hidden cursor-pointer group mb-5"
      style={{ minHeight: '300px' }}
      data-testid={`tournament-card-${t.slot}`}
      onClick={() => t.id ? navigate('/teams') : null}
    >
      {/* Background media */}
      <div className="absolute inset-0">
        {t.slot === 1 ? (
          <img
            src={SLOT_1_GIF}
            alt=""
            className="w-full h-full object-cover"
            style={{ filter: 'saturate(1.5)' }}
          />
        ) : SLOT_VIDEOS[t.slot] ? (
          <video
            autoPlay muted loop playsInline
            className="w-full h-full object-cover"
            style={{ filter: 'saturate(1.5)' }}
          >
            <source src={SLOT_VIDEOS[t.slot]} type="video/mp4" />
          </video>
        ) : (
          <div className="w-full h-full bg-[#1B4332]" />
        )}
        {/* Multi-stop gradient overlay: opaque at bottom, semi-transparent at top */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a1f15]/95 via-[#1B4332]/75 to-[#1B4332]/40" />
      </div>

      {/* Content */}
      <div className="relative z-10 p-6 md:p-10 flex flex-col" style={{ minHeight: '300px' }}>
        {/* Top: label + badge */}
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold tracking-[0.2em] text-emerald-300 uppercase">
            Featured Tournament
          </span>
          <Badge className={badge.cls + ' text-xs font-bold'}>{badge.text}</Badge>
        </div>

        {/* Bottom: main info */}
        <div className="mt-auto pt-10">
          <h2 className="font-heading font-extrabold text-4xl md:text-5xl text-white mb-2 leading-tight">
            {t.name}
          </h2>
          <div className="flex items-center gap-1.5 text-emerald-300 mb-5">
            <MapPin className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm font-medium">{venue.course}</span>
            <span className="text-emerald-500">·</span>
            <span className="text-sm text-emerald-400">{venue.location}</span>
          </div>

          <div className="flex flex-wrap items-end justify-between gap-5">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-white/80 text-sm">
                <Calendar className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>{formatDate(t.start_date)} – {formatDate(t.end_date)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm flex-wrap">
                <Clock className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span className="text-white/70">Deadline:</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-amber-500/20 border border-amber-400/40 text-amber-300 font-bold text-xs">
                  {formatDeadline(t.deadline)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-white/60 text-sm">
                <Users className="w-4 h-4 flex-shrink-0" />
                <span><strong className="text-white/90 font-numbers">{t.team_count}</strong> teams entered</span>
              </div>
            </div>

            {t.id && t.has_prices && (
              <button className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all duration-200 group-hover:scale-[1.03] shadow-lg shadow-amber-900/30">
                Build Your Team <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SmallCard({ t, navigate }) {
  const badge = getStatusBadge(t.status, t.deadline);
  const venue = SLOT_VENUES[t.slot];

  return (
    <div
      className="bg-white rounded-xl border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_24px_rgba(27,67,50,0.12)] transition-all duration-300 overflow-hidden group cursor-pointer"
      data-testid={`tournament-card-${t.slot}`}
      onClick={() => t.id ? navigate('/teams') : null}
    >
      <div className="h-1.5 bg-gradient-to-r from-[#1B4332] to-[#2D6A4F]" />
      <div className="p-5">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-heading font-bold text-lg text-[#0F172A] leading-tight">{t.name}</h3>
          <Badge className={badge.cls + ' text-xs font-bold ml-2 flex-shrink-0'}>{badge.text}</Badge>
        </div>

        <div className="flex items-start gap-1.5 mb-3">
          <MapPin className="w-3.5 h-3.5 text-[#2D6A4F] mt-0.5 flex-shrink-0" />
          <div className="text-xs leading-snug">
            <span className="font-semibold text-[#0F172A]">{venue.course}</span>
            <span className="text-slate-400"> · </span>
            <span className="text-slate-500">{venue.location}</span>
          </div>
        </div>

        <div className="space-y-1.5 text-xs">
          <div className="flex items-center gap-2 text-slate-500">
            <Calendar className="w-3.5 h-3.5 text-[#2D6A4F]" />
            <span>{formatDate(t.start_date)} – {formatDate(t.end_date)}</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Clock className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
            <span className="text-slate-500">Deadline:</span>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-800 font-bold text-[10px]">
              {formatDeadline(t.deadline)}
            </span>
          </div>
          <div className="flex items-center gap-2 text-slate-500">
            <Users className="w-3.5 h-3.5 text-[#1B4332]" />
            <span><strong className="text-[#0F172A] font-numbers">{t.team_count}</strong> teams entered</span>
          </div>
        </div>

        {t.id && t.has_prices && (
          <div className="mt-3">
            <span className="inline-flex items-center gap-1 bg-amber-500 text-white px-2.5 py-1 rounded-lg text-xs font-bold group-hover:bg-amber-600 group-hover:translate-x-0.5 transition-all duration-200">
              Build Your Team <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function GolfChannelCard() {
  return (
    <a
      href="https://tvpass.org/channel/golf-channel-usa"
      target="_blank"
      rel="noopener noreferrer"
      className="relative rounded-xl overflow-hidden flex flex-col items-center justify-center group cursor-pointer"
      style={{ minHeight: '160px', background: 'linear-gradient(135deg, #0a1f15 0%, #1B4332 60%, #2D6A4F 100%)' }}
    >
      {/* Subtle animated glow ring on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: 'radial-gradient(ellipse at center, rgba(45,106,79,0.4) 0%, transparent 70%)' }} />

      <div className="relative z-10 flex flex-col items-center gap-3 p-6 text-center">
        <div className="w-14 h-14 rounded-full bg-white/10 border border-white/20 flex items-center justify-center group-hover:bg-white/20 transition-colors duration-200">
          <Play className="w-6 h-6 text-white ml-0.5" fill="white" />
        </div>
        <div>
          <div className="flex items-center justify-center gap-2 mb-0.5">
            <Tv className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[10px] font-bold tracking-widest text-emerald-400 uppercase">Live</span>
          </div>
          <p className="font-heading font-bold text-xl text-white">Golf Channel</p>
          <p className="text-emerald-300 text-xs mt-0.5">Watch live coverage</p>
        </div>
      </div>
    </a>
  );
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
  const featured = allSlots.find(t => t.slot === activeSlot);
  const others = allSlots.filter(t => t.slot !== activeSlot);

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <Loader2 className="w-8 h-8 text-[#1B4332] animate-spin" />
    </div>
  );

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto animate-fade-in-up" data-testid="tournament-grid">
      <div className="mb-5">
        <h1 className="font-heading font-extrabold text-3xl sm:text-4xl text-[#0F172A] tracking-tight" data-testid="home-title">
          THE MAJORS
        </h1>
        <p className="text-slate-500 text-sm mt-1">Four tournaments. Infinite glory.</p>
      </div>

      {/* Featured banner */}
      <FeaturedBanner t={featured} navigate={navigate} />

      {/* 3 small cards + Golf Channel in a 2×2 grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 stagger">
        {others.map(t => <SmallCard key={t.slot} t={t} navigate={navigate} />)}
        <GolfChannelCard />
      </div>
    </div>
  );
}
