import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '../App';
import { Calendar, Users, Clock, ChevronRight, Loader2, MapPin, Trophy } from 'lucide-react';
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
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/New_York' }) + ' – ' +
      d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' }) + ' ET';
  } catch { return 'TBD'; }
}

function getStatusBadge(status, deadline, end_date) {
  const now = new Date();

  // Date-based completion takes priority over DB status
  if (end_date) {
    const dayAfterEnd = new Date(end_date);
    dayAfterEnd.setDate(dayAfterEnd.getDate() + 1);
    if (now >= dayAfterEnd) return { text: 'Completed', cls: 'bg-slate-500 text-white' };
  } else if (status === 'completed') {
    // No end_date available, fall back to DB flag
    return { text: 'Completed', cls: 'bg-slate-500 text-white' };
  }

  // Prices not set yet → Coming Soon (ignores any stale DB completed/loaded status)
  if (status !== 'prices_set') {
    return { text: 'Coming Soon', cls: 'bg-slate-300 text-slate-700' };
  }

  // Prices set: open until deadline, then in progress until end
  if (deadline && now > new Date(deadline)) {
    return { text: 'In Progress', cls: 'bg-blue-500 text-white' };
  }
  return { text: 'Open', cls: 'bg-emerald-500 text-white' };
}

const SLOT_NAMES = ['Masters', 'PGA Championship', 'U.S. Open', 'The Open'];

const SLOT_VENUES = {
  1: { course: 'Augusta National Golf Club', location: 'Augusta, GA' },
  2: { course: 'Aronimink Golf Club', location: 'Newtown Square, PA' },
  3: { course: 'Shinnecock Hills Golf Club', location: 'Southampton, NY' },
  4: { course: 'Royal Birkdale', location: 'Southport, England' },
};

const SLOT_VIDEOS = {
  1: 'https://res.cloudinary.com/dsvpfi9te/video/upload/v1772420808/MicrosoftTeams-video_lcv2jg.mp4',
  2: 'https://res.cloudinary.com/dsvpfi9te/video/upload/v1772420777/MicrosoftTeams-video_3_ajregd.mp4',
  3: 'https://res.cloudinary.com/dsvpfi9te/video/upload/v1772420862/MicrosoftTeams-video_1_ntghow.mp4',
  4: 'https://res.cloudinary.com/dsvpfi9te/video/upload/v1772420879/MicrosoftTeams-video_2_hfd5sd.mp4',
};

// Derive a Cloudinary first-frame JPEG poster from any video URL.
// e.g. .../video/upload/v.../file.mp4 → .../video/upload/so_0/v.../file.jpg
function getVideoPoster(url) {
  return url.replace('/video/upload/', '/video/upload/so_0/').replace('.mp4', '.jpg');
}

function getActiveSlot(allSlots) {
  const withDeadlines = allSlots.filter(t => t.deadline);
  if (withDeadlines.length === 0) return 1;
  const now = new Date();
  withDeadlines.sort((a, b) => Math.abs(new Date(a.deadline) - now) - Math.abs(new Date(b.deadline) - now));
  return withDeadlines[0].slot;
}

function FeaturedBanner({ t, navigate }) {
  const badge = getStatusBadge(t.status, t.deadline, t.end_date);
  const venue = SLOT_VENUES[t.slot];

  return (
    <div
      className="relative rounded-2xl overflow-hidden cursor-pointer group mb-5"
      style={{ minHeight: '420px' }}
      data-testid={`tournament-card-${t.slot}`}
      onClick={() => t.id ? navigate('/teams') : null}
    >
      {/* Background media */}
      <div className="absolute inset-0">
        {SLOT_VIDEOS[t.slot] ? (
          <video
            autoPlay muted loop playsInline
            preload="auto"
            poster={getVideoPoster(SLOT_VIDEOS[t.slot])}
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
      <div className="relative z-10 p-6 md:p-10 flex flex-col" style={{ minHeight: '420px' }}>
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

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-white/80 text-base md:text-lg">
              <Calendar className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <span>{formatDate(t.start_date)} – {formatDate(t.end_date)}</span>
            </div>
            <div className="flex items-center gap-2 text-base md:text-lg flex-wrap">
              <Clock className="w-5 h-5 text-amber-400 flex-shrink-0" />
              <span className="text-white/70">Deadline:</span>
              <span className="inline-flex items-center px-3 py-1 rounded-md bg-amber-500/20 border border-amber-400/40 text-amber-300 font-bold text-sm md:text-base">
                {formatDeadline(t.deadline)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-white/60 text-base md:text-lg">
              <Users className="w-5 h-5 flex-shrink-0" />
              <span><strong className="text-white/90 font-numbers">{t.team_count}</strong> teams entered</span>
            </div>

            {t.id && t.has_prices && (
              <div className="pt-2">
                <button className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all duration-200 group-hover:scale-[1.03] shadow-lg shadow-amber-900/30">
                  Build Your Team <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SmallCard({ t, navigate }) {
  const badge = getStatusBadge(t.status, t.deadline, t.end_date);
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

      </div>
    </div>
  );
}

function RecentWinnersCard({ recentTournament }) {
  const PLACE_STYLES = [
    { dot: 'bg-yellow-400 text-yellow-900', label: '1st', row: 'bg-white/10 border-white/20' },
    { dot: 'bg-slate-300 text-slate-700',   label: '2nd', row: 'bg-white/5  border-white/10' },
    { dot: 'bg-amber-500 text-amber-900',   label: '3rd', row: 'bg-white/5  border-white/10' },
  ];

  return (
    <div
      className="relative rounded-xl overflow-hidden flex flex-col"
      style={{ minHeight: '160px', background: 'linear-gradient(135deg, #0a1f15 0%, #1B4332 60%, #2D6A4F 100%)' }}
    >
      <div className="p-5 flex flex-col h-full">
        <div className="flex items-center gap-2 mb-3">
          <Trophy className="w-4 h-4 text-yellow-400" />
          <span className="text-[10px] font-bold tracking-[0.2em] text-emerald-300 uppercase">Most Recent Winners</span>
        </div>

        {recentTournament ? (
          <>
            <p className="font-heading font-bold text-white text-base leading-tight mb-3">
              {recentTournament.name}
              <span className="text-emerald-400 font-normal text-sm ml-2">{recentTournament.year}</span>
            </p>
            <div className="space-y-2">
              {recentTournament.winners.slice(0, 3).map((name, i) => (
                <div key={i} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border ${PLACE_STYLES[i].row}`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 ${PLACE_STYLES[i].dot}`}>
                    {i + 1}
                  </span>
                  <span className={`font-semibold text-sm flex-1 ${i === 0 ? 'text-white' : 'text-white/80'}`}>{name}</span>
                  <span className="text-xs text-white/40">{PLACE_STYLES[i].label}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="text-white/50 text-sm mt-auto">No results yet</p>
        )}
      </div>
    </div>
  );
}

export default function HomePage() {
  const [tournaments, setTournaments] = useState([]);
  const [recentTournament, setRecentTournament] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      axios.get(`${API}/tournaments`).then(r => setTournaments(r.data)).catch(() => {}),
      axios.get(`${API}/history`).then(r => {
        const history = r.data;
        if (history?.length && history[0].tournaments?.length) {
          setRecentTournament({ ...history[0].tournaments[0], year: history[0].year });
        }
      }).catch(() => {}),
    ]).finally(() => setLoading(false));
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
      {/* Featured banner */}
      <FeaturedBanner t={featured} navigate={navigate} />

      {/* 3 small cards + Recent Winners in a 2×2 grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 stagger">
        {others.map(t => <SmallCard key={t.slot} t={t} navigate={navigate} />)}
        <RecentWinnersCard recentTournament={recentTournament} />
      </div>
    </div>
  );
}
