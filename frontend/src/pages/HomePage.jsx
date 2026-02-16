import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '../App';
import { Calendar, Users, Clock, Loader2, ExternalLink, Newspaper } from 'lucide-react';
import { Badge } from '../components/ui/badge';

// --- HELPERS ---

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
    if (deadline && new Date() > new Date(deadline)) return { text: 'Locked', cls: 'bg-amber-500 text-white' };
    return { text: 'Open', cls: 'bg-emerald-500 text-white' };
  }
  return { text: 'Coming Soon', cls: 'bg-slate-300 text-slate-700' };
}

// FIX: This solves the &amp; and &#8217; issues manually
function cleanText(text) {
  if (!text) return "";
  const doc = new DOMParser().parseFromString(text, 'text/html');
  const decoded = doc.documentElement.textContent;
  return decoded.replace(/<[^>]+>/g, '').trim();
}

const SLOT_NAMES = ['Masters', 'PGA Championship', 'U.S. Open', 'The Open'];

async function fetchGolfNews() {
  try {
    // Specifically targeting the actual NEWS feed for the big February 2026 tour stories
    const rssUrl = 'https://golf.com/news/feed/';
    const r = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`);
    const data = await r.json();

    if (data.status !== 'ok') throw new Error('Feed unavailable');

    return data.items.slice(0, 5).map(item => ({
      headline: cleanText(item.title),
      summary: item.description ? cleanText(item.description).slice(0, 120) + '...' : 'Latest tour coverage.',
      source: 'GOLF.com',
      url: item.link,
      date: new Date(item.pubDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }));
  } catch (err) {
    return [{
      headline: "PGA & LIV Tour Updates",
      summary: "Visit GOLF.com directly for the latest from Pebble Beach and LIV Adelaide.",
      source: "GOLF.com",
      url: "https://golf.com/news/",
      date: "LIVE"
    }];
  }
}

// --- COMPONENT ---

export default function HomePage() {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [news, setNews] = useState([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get(`${API}/tournaments`)
      .then(r => setTournaments(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const cached = sessionStorage.getItem('golf_news_v5_clean');
    if (cached) {
      setNews(JSON.parse(cached));
      setNewsLoading(false);
    } else {
      fetchGolfNews().then(articles => {
        setNews(articles);
        sessionStorage.setItem('golf_news_v5_clean', JSON.stringify(articles));
        setNewsLoading(false);
      });
    }
  }, []);

  const allSlots = [1, 2, 3, 4].map(slot => {
    const t = tournaments.find(x => x.slot === slot);
    return t || { slot, name: SLOT_NAMES[slot - 1], status: 'setup', team_count: 0, start_date: '', end_date: '', deadline: '' };
  });

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <Loader2 className="w-8 h-8 text-[#1B4332] animate-spin" />
    </div>
  );

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="font-heading font-extrabold text-4xl text-[#0F172A]">THE MAJORS</h1>
        <p className="text-slate-500">2026 Season • Four tournaments. Infinite glory.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
        {allSlots.map((t) => {
          const badge = getStatusBadge(t.status, t.deadline);
          return (
            <div key={t.slot} onClick={() => t.id && navigate('/teams')}
              className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 hover:shadow-lg transition-all cursor-pointer group">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Major {t.slot}</span>
                  <h2 className="font-heading font-bold text-xl group-hover:text-[#1B4332]">{t.name}</h2>
                </div>
                <Badge className={badge.cls}>{badge.text}</Badge>
              </div>
              <div className="space-y-2 text-sm text-slate-500">
                <div className="flex items-center gap-2"><Calendar className="w-4 h-4" /> {formatDate(t.start_date)} - {formatDate(t.end_date)}</div>
                <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-amber-500" /> Deadline: <b>{formatDeadline(t.deadline)}</b></div>
                <div className="flex items-center gap-2"><Users className="w-4 h-4" /> {t.team_count} teams entered</div>
              </div>
            </div>
          );
        })}
      </div>

      <div>
        <div className="flex items-center gap-2 mb-4">
          <Newspaper className="w-5 h-5 text-[#1B4332]" />
          <h2 className="font-heading font-bold text-xl">LATEST GOLF NEWS</h2>
        </div>

        {newsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-pulse">
            <div className="h-28 bg-slate-100 rounded-xl" /><div className="h-28 bg-slate-100 rounded-xl" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {news.map((article, i) => (
              <a key={i} href={article.url} target="_blank" rel="noopener noreferrer"
                className="bg-white rounded-xl border border-slate-100 p-4 hover:shadow-md hover:-translate-y-1 transition-all group block">
                <div className="flex justify-between text-[10px] font-bold text-[#2D6A4F] mb-1">
                  <span>{article.source}</span>
                  <span className="text-slate-400">{article.date}</span>
                </div>
                <h3 className="font-bold text-sm leading-snug mb-1 group-hover:text-[#1B4332]">{article.headline}</h3>
                <p className="text-xs text-slate-500">{article.summary}</p>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}