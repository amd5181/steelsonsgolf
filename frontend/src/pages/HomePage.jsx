import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '../App';
import { Calendar, Users, Clock, ChevronRight, Loader2, ExternalLink, Newspaper } from 'lucide-react';
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

// Fetch golf news from Yahoo Sports RSS via rss2json proxy (no API key needed)
async function fetchGolfNews() {
  const rssUrl = encodeURIComponent('https://sports.yahoo.com/golf/news/rss.xml');
  const r = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${rssUrl}&count=5`);
  const data = await r.json();
  if (data.status !== 'ok') throw new Error('RSS fetch failed');
  return data.items.map(item => ({
    headline: item.title,
    summary: item.description
      ? item.description.replace(/<[^>]+>/g, '').slice(0, 120).trim() + '...'
      : '',
    source: 'Yahoo Sports Golf',
    url: item.link,
    date: item.pubDate
      ? new Date(item.pubDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : '',
  }));
}

export default function HomePage() {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [news, setNews] = useState([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get(`${API}/tournaments`).then(r => setTournaments(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchGolfNews()
      .then(articles => setNews(articles))
      .catch(() => setNews([]))
      .finally(() => setNewsLoading(false));
  }, []);

  const allSlots = [1, 2, 3, 4].map(slot => {
    const t = tournaments.find(x => x.slot === slot);
    return t || { slot, name: SLOT_NAMES[slot - 1], status: 'setup', team_count: 0, golfer_count: 0, start_date: '', end_date: '', deadline: '' };
  });

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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10 stagger" data-testid="tournament-grid">
        {allSlots.map((t) => {
          const badge = getStatusBadge(t.status, t.deadline);
          return (
            <div key={t.slot}
              className="bg-white rounded-xl border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_24px_rgba(27,67,50,0.12)] transition-all duration-300 overflow-hidden group cursor-pointer"
              data-testid={`tournament-card-${t.slot}`}
              onClick={() => t.id ? navigate('/teams') : null}
            >
              <div className="h-2 bg-gradient-to-r from-[#1B4332] to-[#2D6A4F]" />
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="font-heading font-bold text-xs text-slate-400 uppercase tracking-widest">Major {t.slot}</span>
                    <h2 className="font-heading font-bold text-xl text-[#0F172A] mt-0.5">{t.name}</h2>
                  </div>
                  <Badge className={badge.cls + ' text-xs font-bold'}>{badge.text}</Badge>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Calendar className="w-4 h-4 text-[#2D6A4F]" />
                    <span>{formatDate(t.start_date)} - {formatDate(t.end_date)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500">
                    <Clock className="w-4 h-4 text-amber-500" />
                    <span>Deadline: <strong className="text-[#0F172A]">{formatDeadline(t.deadline)}</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500">
                    <Users className="w-4 h-4 text-[#1B4332]" />
                    <span><strong className="text-[#0F172A] font-numbers">{t.team_count}</strong> teams entered</span>
                  </div>
                </div>
                {t.id && t.has_prices && (
                  <div className="mt-4 flex items-center text-[#1B4332] text-sm font-bold group-hover:translate-x-1 transition-transform">
                    Build Your Team <ChevronRight className="w-4 h-4 ml-1" />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Golf News */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Newspaper className="w-5 h-5 text-[#1B4332]" />
          <h2 className="font-heading font-bold text-xl text-[#0F172A] tracking-tight">GOLF NEWS</h2>
          <span className="text-xs text-slate-400 font-medium ml-1">· updated each visit</span>
        </div>

        {newsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[1,2,3,4].map(i => (
              <div key={i} className="bg-white rounded-xl border border-slate-100 p-4 animate-pulse">
                <div className="h-4 bg-slate-100 rounded w-3/4 mb-2" />
                <div className="h-3 bg-slate-100 rounded w-full mb-1" />
                <div className="h-3 bg-slate-100 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : news.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-100 p-6 text-center">
            <p className="text-slate-400 text-sm">Couldn't load news right now. Check back soon.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {news.map((article, i) => (
              <a
                key={i}
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 hover:shadow-md hover:border-[#1B4332]/20 transition-all group block"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-[10px] font-bold text-[#2D6A4F] uppercase tracking-wider">{article.source}</span>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <span className="text-[10px] text-slate-400">{article.date}</span>
                    <ExternalLink className="w-3 h-3 text-slate-300 group-hover:text-[#1B4332] transition-colors" />
                  </div>
                </div>
                <h3 className="font-bold text-sm text-[#0F172A] leading-snug mb-1 group-hover:text-[#1B4332] transition-colors">
                  {article.headline}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">{article.summary}</p>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
