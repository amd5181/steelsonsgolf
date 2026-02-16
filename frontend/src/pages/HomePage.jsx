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

// Improved fetcher: Targets official sites and handles errors gracefully
async function fetchGolfNews() {
  try {
    // Search specifically for official PGA and LIV domains for diversity
    const query = encodeURIComponent('site:pgatour.com OR site:livgolf.com');
    const rssUrl = `https://news.google.com/rss/search?q=${query}&hl=en-US&gl=US&ceid=US:en`;
    
    const r = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`);
    const data = await r.json();

    if (data.status !== 'ok') throw new Error('News feed unavailable');

    return data.items.slice(0, 5).map(item => ({
      headline: item.title.split(' - ')[0], // Removes " - Source Name" from headline
      summary: "Latest official update from the professional tours.",
      source: item.author || item.source?.name || 'Pro Golf',
      url: item.link,
      date: new Date(item.pubDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }));
  } catch (err) {
    console.error("Golf News Error:", err);
    return [
      {
        headline: "PGA Tour: Latest News",
        summary: "Check the latest leaderboards and stories from the PGA Tour.",
        source: "PGA",
        url: "https://www.pgatour.com/news",
        date: "Live"
      },
      {
        headline: "LIV Golf: Latest News",
        summary: "The latest team standings and individual news from LIV.",
        source: "LIV",
        url: "https://www.livgolf.com/news",
        date: "Live"
      }
    ];
  }
}

export default function HomePage() {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [news, setNews] = useState([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const navigate = useNavigate();

  // Tournament Fetch
  useEffect(() => {
    axios.get(`${API}/tournaments`)
      .then(r => setTournaments(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // News Fetch with Session Caching
  useEffect(() => {
    const cached = sessionStorage.getItem('golf_news_cache');
    if (cached) {
      setNews(JSON.parse(cached));
      setNewsLoading(false);
    } else {
      fetchGolfNews()
        .then(articles => {
          setNews(articles);
          sessionStorage.setItem('golf_news_cache', JSON.stringify(articles));
        })
        .catch(() => setNews([]))
        .finally(() => setNewsLoading(false));
    }
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
      <div className="mb-6">
        <h1 className="font-heading font-extrabold text-3xl sm:text-4xl text-[#0F172A] tracking-tight">
          THE MAJORS
        </h1>
        <p className="text-slate-500 text-sm mt-1">Four tournaments. Infinite glory.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10 stagger">
        {allSlots.map((t) => {
          const badge = getStatusBadge(t.status, t.deadline);
          return (
            <div key={t.slot}
              className="bg-white rounded-xl border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_24px_rgba(27,67,50,0.12)] transition-all duration-300 overflow-hidden group cursor-pointer"
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
              </div>
            </div>
          );
        })}
      </div>

      <div>
        <div className="flex items-center gap-2 mb-4">
          <Newspaper className="w-5 h-5 text-[#1B4332]" />
          <h2 className="font-heading font-bold text-xl text-[#0F172A] tracking-tight">GOLF NEWS</h2>
        </div>

        {newsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[1,2,3,4].map(i => (
              <div key={i} className="bg-white rounded-xl border border-slate-100 p-4 animate-pulse">
                <div className="h-4 bg-slate-100 rounded w-3/4 mb-2" />
                <div className="h-3 bg-slate-100 rounded w-full mb-1" />
              </div>
            ))}
          </div>
        ) : news.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-100 p-6 text-center">
            <p className="text-slate-400 text-sm">Couldn't load news right now.</p>
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