import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '../App';
import { Calendar, Users, Clock, ChevronRight, Loader2, MapPin, Trophy, BookOpen, Flag, Wind, Zap } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent } from '../components/ui/dialog';

function formatDate(dateStr) {
  if (!dateStr) return 'TBD';
  try { return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
  catch { return 'TBD'; }
}

function formatDeadline(dateStr) {
  if (!dateStr) return 'TBD';
  try {
    const d = new Date(dateStr);
    const date = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/New_York' });
    const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' });
    return `${date} – ${time} ET`;
  } catch { return 'TBD'; }
}

function getStatusBadge(status, deadline, end_date) {
  const now = new Date();

  if (end_date) {
    const dayAfterEnd = new Date(end_date);
    dayAfterEnd.setDate(dayAfterEnd.getDate() + 1);
    if (now >= dayAfterEnd) return { text: 'Completed', cls: 'bg-slate-700 text-slate-300', style: { background: '#1e293b', color: '#94a3b8' } };
  } else if (status === 'completed') {
    return { text: 'Completed', cls: 'bg-slate-700 text-slate-300', style: { background: '#1e293b', color: '#94a3b8' } };
  }

  if (status !== 'prices_set') {
    return { text: 'Coming Soon', cls: 'bg-slate-200 text-slate-600', style: { background: 'rgba(255,255,255,0.18)', color: 'rgba(255,255,255,0.75)', border: '1px solid rgba(255,255,255,0.25)' } };
  }

  if (deadline && now > new Date(deadline)) {
    return { text: 'In Progress', cls: 'bg-yellow-400 text-yellow-900', style: { background: '#facc15', color: '#713f12' } };
  }
  return { text: 'Open', cls: 'bg-emerald-500 text-white', style: { background: '#22c55e', color: '#fff' } };
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

// ─── Per-major lore data ───────────────────────────────────────────────────
const TOURNAMENT_LORE = {
  1: {
    tagline: 'A tradition unlike any other.',
    headerGradient: 'linear-gradient(135deg, #0a2a14 0%, #1B4332 55%, #2D6A4F 100%)',
    champions: [
      { year: 2025, name: 'Rory McIlroy' },
      { year: 2024, name: 'Scottie Scheffler' },
      { year: 2023, name: 'Jon Rahm' },
      { year: 2022, name: 'Scottie Scheffler' },
      { year: 2021, name: 'Hideki Matsuyama' },
    ],
    course: { par: 72, yards: '7,510', est: 1932, note: 'Amen Corner (holes 11–13) decides the Masters every year.' },
    weather: { temp: '65–75°F', desc: 'Mild & blooming', note: 'Azaleas peak early in the week. Afternoon storms can arrive fast after the cut.' },
    facts: [
      'The only major played at the same course every single year.',
      'Past champions keep the green jacket at Augusta — it never fully leaves.',
      'Tuesday night is the Champions Dinner, menu chosen by the reigning champion.',
      'Tiger Woods has won 5 Masters — more than any player in history.',
    ],
  },
  2: {
    tagline: 'No amateurs. No excuses.',
    headerGradient: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 55%, #1d4ed8 100%)',
    champions: [
      { year: 2025, name: 'Scottie Scheffler' },
      { year: 2024, name: 'Xander Schauffele' },
      { year: 2023, name: 'Brooks Koepka' },
      { year: 2022, name: 'Justin Thomas' },
      { year: 2021, name: 'Phil Mickelson' },
    ],
    course: { par: 70, yards: '7,320', est: 1928, note: 'Tree-lined, tight fairways and small greens that punish imprecision.' },
    weather: { temp: '68–78°F', desc: 'Warm & humid', note: 'Pennsylvania in May — comfortable mornings, afternoon thunderstorms possible.' },
    facts: [
      'The Wanamaker Trophy is the largest trophy in professional golf.',
      'Phil Mickelson won in 2021 at age 50 — the oldest major champion ever.',
      'Unlike the other majors, the PGA Championship fields zero amateurs.',
      'Jack Nicklaus holds the record with 5 PGA Championship titles.',
    ],
  },
  3: {
    tagline: 'The toughest test in golf.',
    headerGradient: 'linear-gradient(135deg, #1a0505 0%, #7f1d1d 55%, #b91c1c 100%)',
    champions: [
      { year: 2025, name: 'JJ Spaun' },
      { year: 2024, name: 'Bryson DeChambeau' },
      { year: 2023, name: 'Wyndham Clark' },
      { year: 2022, name: 'Matt Fitzpatrick' },
      { year: 2004, name: 'Retief Goosen', note: 'Last at Shinnecock' },
    ],
    course: { par: 70, yards: '7,445', est: 1891, note: 'Shinnecock Hills — penal rough, blind shots, and greens that slope away.' },
    weather: { temp: '75–85°F', desc: 'Hot & breezy', note: 'June on Long Island. Ocean wind off Peconic Bay shifts club selection constantly.' },
    facts: [
      'The USGA sets up courses to make even par feel like a birdie barrage.',
      'Even par regularly wins or contends. It is that hard.',
      'Shinnecock Hills hosted in 1896 — among the very first US Opens ever played.',
      'The US Open plays the back nine in reverse order on the final day.',
    ],
  },
  4: {
    tagline: 'The original. The Claret Jug.',
    headerGradient: 'linear-gradient(135deg, #0a0f1e 0%, #1e2a4a 55%, #334155 100%)',
    champions: [
      { year: 2025, name: 'Scottie Scheffler' },
      { year: 2024, name: 'Xander Schauffele' },
      { year: 2023, name: 'Brian Harman' },
      { year: 2022, name: 'Cameron Smith' },
      { year: 1998, name: "Mark O'Meara", note: 'Last at Birkdale' },
    ],
    course: { par: 70, yards: '7,156', est: 1889, note: 'Dunes, pot bunkers, and relentless Irish Sea wind off the coast.' },
    weather: { temp: '55–68°F', desc: 'Breezy & overcast', note: 'July at Birkdale means coastal wind is the 15th club in every bag. Bring a layer.' },
    facts: [
      "Golf's oldest major, first played at Prestwick in 1860.",
      'The winner lifts the Claret Jug — arguably the most iconic trophy in sport.',
      'Links golf has no trees. Wind alone shapes strategy for all 72 holes.',
      "Royal Birkdale's closing stretch is some of the most dramatic in championship golf.",
    ],
  },
};

// ─── Lore Modal ───────────────────────────────────────────────────────────
function TournamentLoreModal({ slot, onClose }) {
  const lore = TOURNAMENT_LORE[slot];
  const name = SLOT_NAMES[(slot ?? 1) - 1];
  const venue = SLOT_VENUES[slot];
  if (!lore) return null;

  return (
    <Dialog open={!!slot} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent
        className="sm:max-w-md p-0 overflow-hidden flex flex-col gap-0 top-[3%] translate-y-0 sm:top-[50%] sm:translate-y-[-50%] [&>button:last-child]:text-white [&>button:last-child]:opacity-80 [&>button:last-child]:hover:opacity-100 [&>button:last-child]:rounded-full [&>button:last-child]:bg-black/30 [&>button:last-child]:p-1"
        style={{ maxHeight: 'calc(100dvh - 2rem)' }}
      >

        {/* Header */}
        <div className="flex-shrink-0 px-6 py-6 relative" style={{ background: lore.headerGradient }}>
          <p className="text-[10px] font-bold tracking-[0.22em] uppercase mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Tournament History
          </p>
          <h2 className="font-heading font-extrabold text-2xl uppercase leading-tight text-white">{name}</h2>
          <p className="text-sm mt-1 italic" style={{ color: 'rgba(255,255,255,0.55)' }}>{lore.tagline}</p>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-5 py-5 space-y-5 bg-white">

          {/* Champions */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="w-3.5 h-3.5 text-yellow-500" />
              <span className="text-[10px] font-bold tracking-[0.18em] text-slate-400 uppercase">Recent Champions</span>
            </div>
            <div className="space-y-1.5">
              {lore.champions.map((c, i) => (
                <div key={i} className={`flex items-center gap-3 px-3 py-2 rounded-lg ${i === 0 ? 'bg-yellow-50 border border-yellow-200' : 'bg-slate-50'}`}>
                  <span className={`text-xs font-bold font-numbers w-10 flex-shrink-0 ${i === 0 ? 'text-yellow-600' : 'text-slate-400'}`}>{c.year}</span>
                  <span className={`flex-1 text-sm font-semibold ${i === 0 ? 'text-yellow-900' : 'text-slate-700'}`}>{c.name}</span>
                  {c.note && <span className="text-[9px] text-slate-400 italic flex-shrink-0">{c.note}</span>}
                  {i === 0 && <Trophy className="w-3 h-3 text-yellow-400 flex-shrink-0" />}
                </div>
              ))}
            </div>
          </section>

          {/* Course DNA */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Flag className="w-3.5 h-3.5 text-[#2D6A4F]" />
              <span className="text-[10px] font-bold tracking-[0.18em] text-slate-400 uppercase">The Course</span>
            </div>
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="font-semibold text-sm text-[#0F172A] mb-3">{venue.course}</p>
              <div className="flex gap-6 mb-3">
                <div className="text-center">
                  <div className="font-numbers font-extrabold text-xl text-[#1B4332] leading-none">{lore.course.yards}</div>
                  <div className="text-[9px] text-slate-400 uppercase tracking-wider mt-0.5">Yards</div>
                </div>
                <div className="w-px bg-slate-200 self-stretch" />
                <div className="text-center">
                  <div className="font-numbers font-extrabold text-xl text-[#1B4332] leading-none">{lore.course.par}</div>
                  <div className="text-[9px] text-slate-400 uppercase tracking-wider mt-0.5">Par</div>
                </div>
                <div className="w-px bg-slate-200 self-stretch" />
                <div className="text-center">
                  <div className="font-numbers font-extrabold text-xl text-[#1B4332] leading-none">{lore.course.est}</div>
                  <div className="text-[9px] text-slate-400 uppercase tracking-wider mt-0.5">Est.</div>
                </div>
              </div>
              <p className="text-xs text-slate-500 border-t border-slate-200 pt-3 leading-relaxed">{lore.course.note}</p>
            </div>
          </section>

          {/* Weather */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Wind className="w-3.5 h-3.5 text-sky-500" />
              <span className="text-[10px] font-bold tracking-[0.18em] text-slate-400 uppercase">Expect</span>
            </div>
            <div className="bg-sky-50 border border-sky-100 rounded-xl p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-sky-500/80 mb-2">{venue.location}</p>
              <div className="flex items-baseline gap-2.5 mb-1.5">
                <span className="font-numbers font-bold text-lg text-sky-700 leading-none">{lore.weather.temp}</span>
                <span className="text-sm text-sky-600 font-medium">{lore.weather.desc}</span>
              </div>
              <p className="text-xs text-sky-600/80 leading-relaxed">{lore.weather.note}</p>
            </div>
          </section>

          {/* Fun Facts */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-[10px] font-bold tracking-[0.18em] text-slate-400 uppercase">Did You Know?</span>
            </div>
            <div className="space-y-2.5">
              {lore.facts.map((f, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0 mt-1.5" />
                  <p className="text-xs text-slate-600 leading-relaxed">{f}</p>
                </div>
              ))}
            </div>
          </section>

          <div className="h-1" />
        </div>
      </DialogContent>
    </Dialog>
  );
}

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

// ─── LIME accent color used throughout the featured banner ───
const LIME = '#C8FF00';

function FeaturedBanner({ t, navigate, onLoreClick }) {
  const badge = getStatusBadge(t.status, t.deadline, t.end_date);
  const venue = SLOT_VENUES[t.slot];
  const deadlinePassed = t.deadline && new Date() > new Date(t.deadline);
  const destination = deadlinePassed ? '/leaderboard' : '/teams';

  return (
    <div
      className="relative rounded-2xl overflow-hidden mb-5"
      style={{ minHeight: '420px' }}
      data-testid={`tournament-card-${t.slot}`}
    >
      {/* Background media */}
      <div className="absolute inset-0">
        {SLOT_VIDEOS[t.slot] ? (
          <video
            autoPlay muted loop playsInline
            preload="auto"
            poster={getVideoPoster(SLOT_VIDEOS[t.slot])}
            className="w-full h-full object-cover"
          >
            <source src={SLOT_VIDEOS[t.slot]} type="video/mp4" />
          </video>
        ) : (
          <div className="w-full h-full bg-[#0a1a0a]" />
        )}
        {/* Lightened overlay */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.28) 0%, rgba(0,0,0,0.52) 100%)' }} />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col px-6 md:px-10 py-7 md:py-9" style={{ minHeight: '420px' }}>

        {/* ── Label + status badge ── */}
        <div className="flex items-center gap-2.5 mb-5">
          <span className="text-xs font-bold tracking-[0.25em] uppercase" style={{ color: LIME }}>
            Featured Tournament
          </span>
          <Badge className="text-xs font-bold px-2.5 py-0.5" style={badge.style}>
            {badge.text}
          </Badge>
        </div>

        {/* Tournament name */}
        <h2
          className="font-heading font-extrabold leading-none uppercase mb-2"
          style={{ fontSize: 'clamp(2.6rem, 6vw, 4rem)', color: '#ffffff', letterSpacing: '-0.01em' }}
        >
          {t.name}
        </h2>

        {/* Venue */}
        <div className="flex items-center gap-1.5 mb-6">
          <MapPin className="w-4 h-4 flex-shrink-0" style={{ color: LIME }} />
          <span className="text-white text-sm">{venue.course}</span>
          <span className="text-white/40 mx-0.5">·</span>
          <span className="text-white/80 text-sm">{venue.location}</span>
        </div>

        {/* ── Stats row ── */}
        <div className="flex items-stretch gap-0 mb-5" style={{ maxWidth: '340px' }}>
          <div className="flex flex-col">
            <span
              className="font-extrabold leading-none"
              style={{ fontSize: '1.6rem', color: LIME, fontVariantNumeric: 'tabular-nums' }}
            >
              {t.team_count}
            </span>
            <span className="text-white text-sm mt-1">Teams Entered</span>
          </div>
          <div className="mx-6 w-px self-stretch" style={{ background: 'rgba(255,255,255,0.2)' }} />
          <div className="flex flex-col">
            <span
              className="font-extrabold leading-none"
              style={{ fontSize: '1.6rem', color: '#ffffff', fontVariantNumeric: 'tabular-nums' }}
            >
              {t.golfer_count ?? '—'}
            </span>
            <span className="text-white text-sm mt-1">Golfers in Field</span>
          </div>
        </div>

        {/* Divider — matches width of stats row */}
        <div className="mb-5" style={{ maxWidth: '220px', borderTop: '1px solid rgba(255,255,255,0.18)' }} />

        {/* ── Dates + Deadline (no background band) ── */}
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 mb-5">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-bold tracking-[0.18em] uppercase" style={{ color: LIME }}>
              Tournament Dates
            </span>
            <div className="flex items-center gap-1.5 text-white text-sm font-semibold">
              <Calendar className="w-4 h-4 flex-shrink-0" style={{ color: LIME }} />
              <span>{formatDate(t.start_date)} – {formatDate(t.end_date)}</span>
            </div>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-bold tracking-[0.18em] uppercase" style={{ color: LIME }}>
              Entry Deadline
            </span>
            <div className="flex items-center gap-1.5 text-white text-sm font-semibold">
              <Clock className="w-4 h-4 flex-shrink-0" style={{ color: LIME }} />
              <span>{formatDeadline(t.deadline)}</span>
            </div>
          </div>
        </div>

        {/* ── CTA Button ── */}
        {t.id && t.has_prices && (
          <div>
            <button
              onClick={() => navigate(destination)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg font-bold text-xs transition-all duration-200 hover:scale-105 hover:bg-white hover:text-[#1B4332] active:scale-95"
              style={{
                background: '#D4FF3A',
                color: '#0a1a00',
                letterSpacing: '0.02em',
                boxShadow: `0 0 20px ${LIME}44`,
              }}
            >
              {deadlinePassed ? 'View Leaderboard' : 'Build Your Team'} <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* History button — discreet, bottom-right */}
      <button
        onClick={() => onLoreClick(t.slot)}
        className="absolute bottom-5 right-5 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:bg-white/20 active:scale-95"
        style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)', color: 'rgba(255,255,255,0.65)', border: '1px solid rgba(255,255,255,0.18)' }}
      >
        <BookOpen className="w-3.5 h-3.5" />
        Info
      </button>
    </div>
  );
}

function SmallCard({ t, onLoreClick }) {
  const badge = getStatusBadge(t.status, t.deadline, t.end_date);
  const venue = SLOT_VENUES[t.slot];

  return (
    <div
      className="bg-white rounded-xl border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition-all duration-300 overflow-hidden group"
      data-testid={`tournament-card-${t.slot}`}
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

        {/* History button */}
        <div className="flex justify-end mt-3 pt-3 border-t border-slate-100">
          <button
            onClick={() => onLoreClick(t.slot)}
            className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-[#1B4332] transition-colors"
          >
            <BookOpen className="w-3 h-3" />
            Info
          </button>
        </div>
      </div>
    </div>
  );
}

function RecentWinnersCard({ recentChampions }) {
  return (
    <div
      className="relative rounded-xl overflow-hidden flex flex-col"
      style={{ minHeight: '160px', background: 'linear-gradient(135deg, #0a1f15 0%, #1B4332 60%, #2D6A4F 100%)' }}
    >
      <div className="p-5 flex flex-col h-full">
        <div className="flex items-center gap-2 mb-3">
          <Trophy className="w-4 h-4 text-yellow-400" />
          <span className="text-[10px] font-bold tracking-[0.2em] text-emerald-300 uppercase">Champions</span>
        </div>

        {recentChampions?.length ? (
          <div className="space-y-2">
            {recentChampions.map((entry, i) => (
              <div key={i} className="flex items-center gap-2.5 px-3 py-2 rounded-lg border bg-white/5 border-white/10">
                <span className="font-numbers text-xs font-bold flex-shrink-0 w-8 text-yellow-400">{entry.year}</span>
                <span className="text-white/60 text-xs flex-shrink-0 hidden sm:block">{entry.name}</span>
                <span className="text-white/60 text-xs flex-shrink-0 sm:hidden truncate max-w-[60px]">{entry.name}</span>
                <span className="font-semibold text-sm flex-1 text-right text-white/80">{entry.champion}</span>
                <Trophy className="w-3 h-3 text-yellow-400 flex-shrink-0" />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-white/50 text-sm mt-auto">No results yet</p>
        )}
      </div>
    </div>
  );
}

export default function HomePage() {
  const [tournaments, setTournaments] = useState([]);
  const [recentChampions, setRecentChampions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loreSlot, setLoreSlot] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      axios.get(`${API}/tournaments`).then(r => setTournaments(r.data)).catch(() => {}),
      axios.get(`${API}/history`).then(r => {
        const history = r.data;
        if (history?.length) {
          const allEvents = [];
          for (const yearEntry of history) {
            for (const t of (yearEntry.tournaments || [])) {
              allEvents.push({ year: yearEntry.year, name: t.name, champion: t.winners?.[0] ?? '—' });
            }
          }
          setRecentChampions(allEvents.slice(0, 4));
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
      {/* Logo header */}
      <div className="flex items-center gap-3 mb-5">
        <img
          src="https://res.cloudinary.com/dsvpfi9te/image/upload/v1771700941/ChatGPT_Image_Feb_21_2026_02_07_41_PM_kzc10a.png"
          alt="Steel Sons Golf"
          className="h-14 w-14 object-contain flex-shrink-0"
        />
        <div className="flex flex-col leading-none">
          <span className="text-[11px] font-bold text-slate-400 tracking-[0.2em] uppercase">Steel Sons Golf</span>
          <span className="text-xl font-extrabold text-[#1B4332] tracking-tight leading-tight whitespace-nowrap">Blast Furnace of Champions</span>
        </div>
      </div>

      {/* Featured banner */}
      <FeaturedBanner t={featured} navigate={navigate} onLoreClick={setLoreSlot} />

      {/* 3 small cards + Recent Winners in a 2×2 grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 stagger">
        {others.map(t => <SmallCard key={t.slot} t={t} onLoreClick={setLoreSlot} />)}
        <RecentWinnersCard recentChampions={recentChampions} />
      </div>

      {/* Tournament lore modal */}
      <TournamentLoreModal slot={loreSlot} onClose={() => setLoreSlot(null)} />
    </div>
  );
}
