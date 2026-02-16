import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '../App';
import { Calendar, Users, Clock, Loader2, ExternalLink, Newspaper } from 'lucide-react';
import { Badge } from '../components/ui/badge';

// --- CONFIG & HELPERS ---
const SLOT_NAMES = ['Masters', 'PGA Championship', 'U.S. Open', 'The Open'];

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

// Logic for the 8am/8pm Eastern Time Refresh
function shouldRefreshNews() {
  const lastUpdate = localStorage.getItem('golf_news_timestamp');
  if (!lastUpdate) return true;

  const now = new Date();
  const last = new Date(parseInt(lastUpdate));
  
  // Convert current time to Eastern Time hours (roughly)
  const etOffset = -5; // Default ET. Adjust to -4 for DST if precision is vital.
  const currentHourET = (now.getUTCHours() + etOffset + 24) % 24;
  
  // Define update milestones: 8 (8am) and 20 (8pm)
  const milestones = [8, 20];
  
  // Find the most recent milestone that has passed
  const lastMilestonePassed = milestones.reverse().find(m => currentHourET >= m) || 0;
  
  // If the last update happened before the most recent milestone passed, refresh!
  const milestoneDate = new Date(now);
  milestoneDate.setHours(lastMilestonePassed, 0, 0, 0);
  
  return last < milestoneDate;
}

async function fetchESPNNews() {
  try {
    const res = await axios.get('https://site.api.espn.com/apis/site/v2/sports/golf/news');
    const articles = res.data.articles.slice(0, 4).map(item => ({
      headline: item.headline,
      summary: item.description,
      source: 'ESPN',
      url: item.links.web.href,
      date: new Date(item.published).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }));

    // Cache with timestamp
    localStorage.setItem('golf_news_data', JSON.stringify(articles));
    localStorage.setItem('golf_news_timestamp', Date.now().toString());
    
    return articles;
  } catch (err) {
    console.error("ESPN News Error:", err);
    return [];
  }
}

// --- COMPONENT ---
export default function HomePage() {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [news, setNews] = useState([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const navigate = useNavigate();

  // 1. Fetch Tournaments
  useEffect(() => {
    axios.get(`${API}/tournaments`)
      .then(r => setTournaments(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // 2. Controlled News Fetch (8am / 8pm ET)
  useEffect(() => {
    if (!shouldRefreshNews()) {
      const cached = localStorage.getItem('golf_news_data');
      if (cached) {
        setNews(JSON.parse(cached));
        setNewsLoading(false);
        return;
      }
    }

    fetchESPNNews().then(data => {
      setNews(data);
      setNewsLoading(false);
    });
  }, []);

  const allSlots = [1, 2, 3, 4].map(slot => {
    const t = tournaments.find(x => x.slot === slot);
    return t || { slot, name: SLOT_NAMES[slot - 1], status: 'setup', team_count: 0, start_date: '', end_date: '', deadline: '' };
  });

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <Loader2 className="w-8 h-8 text-[#1B4332] animate-spin" />
    </div>
  );

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h1 className="font-heading font-extrabold text-4xl text-[#0F172A] tracking-tight">THE MAJORS</h1>
        <p className="text-slate-500 mt-1">Four tournaments. One Champion.</p>
      </div>

      {/* Tournament Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
        {allSlots.map((t) => (
          <div key={t.slot} onClick={() => t.id && navigate('/teams')}
            className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 hover:shadow-lg transition-all cursor-pointer group relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-[#1B4332]" />
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Major {t.slot}</span>
                <h2 className="font-heading font-bold text-xl group-hover:text-[#1B4332]">{t.name}</h2>
              </div>
              <Badge className={t.status === 'prices_set' ? 'bg-emerald-500' : 'bg-slate-200 text-slate-600'}>
                {t.status === 'prices_set' ? 'Open' : 'Upcoming'}
              </Badge>
            </div>
            <div className="space-y-2 text-sm text-slate-500">
              <div className="flex items-center gap-2"><Calendar className="w-4 h-4" /> {formatDate(t.start_date)}</div>
              <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-amber-500" /> Deadline: <b>{formatDeadline(t.deadline)}</b></div>
              <div className="flex items-center gap-2"><Users className="w-4 h-4" /> {t.team_count} teams entered</div>
            </div>
          </div>
        ))}
      </div>

      {/* ESPN News Section */}
      <div className="pt-6 border-t border-slate-100">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Newspaper className="w-5 h-5 text-[#1B4332]" />
            <h2 className="font-heading font-bold text-xl uppercase tracking-tight">ESPN News</h2>
          </div>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Updated 2x Daily</span>
        </div>

        {newsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="h-24 bg-slate-50 rounded-xl animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {news.map((article, i) => (
              <a key={i} href={article.url} target="_blank" rel="noopener noreferrer"
                className="group flex flex-col bg-slate-50/50 rounded-xl p-4 border border-transparent hover:border-[#1B4332]/20 hover:bg-white hover:shadow-md transition-all">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-black text-[#1B4332]">{article.source}</span>
                  <span className="text-[10px] text-slate-400 font-bold">{article.date}</span>
                </div>
                <h3 className="font-bold text-sm leading-snug text-[#0F172A] group-hover:underline mb-1">
                  {article.headline}
                </h3>
                <p className="text-xs text-slate-500 line-clamp-2">{article.summary}</p>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}