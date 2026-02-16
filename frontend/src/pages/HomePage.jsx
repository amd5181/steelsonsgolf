import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '../App';
import { Calendar, Users, Clock, Loader2, Newspaper } from 'lucide-react';
import { Badge } from '../components/ui/badge';

const SLOT_NAMES = ['Masters', 'PGA Championship', 'U.S. Open', 'The Open'];

// --- TIME LOGIC: 8am/8pm ET Refresh ---
function shouldRefreshNews() {
  const lastUpdate = localStorage.getItem('golf_news_timestamp');
  const cachedData = localStorage.getItem('golf_news_data');
  if (!lastUpdate || !cachedData) return true;

  const now = new Date();
  const last = new Date(parseInt(lastUpdate));
  const currentHourET = (now.getUTCHours() - 5 + 24) % 24; 
  
  const milestones = [8, 20];
  const lastMilestone = [...milestones].reverse().find(h => currentHourET >= h) || 0;

  const milestoneDate = new Date(now);
  milestoneDate.setHours(lastMilestone, 0, 0, 0);

  return last < milestoneDate;
}

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

  // 2. Fetch ESPN News (Now with CORS Proxy)
  useEffect(() => {
    const getNews = async () => {
      try {
        if (!shouldRefreshNews()) {
          const cached = localStorage.getItem('golf_news_data');
          if (cached) {
            setNews(JSON.parse(cached));
            setNewsLoading(false);
            return;
          }
        }

        // USING A PROXY to bypass browser blocks
        const proxy = "https://api.allorigins.win/get?url=";
        const target = encodeURIComponent("https://site.api.espn.com/apis/site/v2/sports/golf/news");
        
        const response = await fetch(proxy + target);
        const json = await response.json();
        const data = JSON.parse(json.contents); // AllOrigins wraps the result in 'contents'

        const articles = data.articles.slice(0, 4).map(item => ({
          headline: item.headline,
          summary: item.description,
          url: item.links?.web?.href || 'https://www.espn.com/golf/',
          date: new Date(item.published).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        }));

        setNews(articles);
        localStorage.setItem('golf_news_data', JSON.stringify(articles));
        localStorage.setItem('golf_news_timestamp', Date.now().toString());
      } catch (err) {
        console.error("News Fetch Failed:", err);
        // If everything fails, show the last cached news instead of a blank screen
        const lastResort = localStorage.getItem('golf_news_data');
        if (lastResort) setNews(JSON.parse(lastResort));
      } finally {
        setNewsLoading(false);
      }
    };

    getNews();
  }, []);

  const allSlots = [1, 2, 3, 4].map(slot => {
    const t = tournaments.find(x => x.slot === slot);
    return t || { slot, name: SLOT_NAMES[slot - 1], status: 'upcoming', team_count: 0, start_date: '', end_date: '', deadline: '' };
  });

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <Loader2 className="w-8 h-8 text-[#1B4332] animate-spin" />
    </div>
  );

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="font-heading font-extrabold text-4xl text-[#0F172A] tracking-tight">THE MAJORS</h1>
        <p className="text-slate-500 mt-1">Four tournaments. One Champion.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
        {allSlots.map((t) => (
          <div key={t.slot} onClick={() => t.id && navigate('/teams')}
            className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 hover:shadow-lg transition-all cursor-pointer group">
            <div className="flex justify-between items-start mb-4">
              <h2 className="font-heading font-bold text-xl group-hover:text-[#1B4332]">{t.name}</h2>
              <Badge className={t.status === 'prices_set' ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600'}>
                {t.status === 'prices_set' ? 'Open' : 'Upcoming'}
              </Badge>
            </div>
            <div className="space-y-2 text-sm text-slate-500">
              <div className="flex items-center gap-2"><Calendar className="w-4 h-4" /> {new Date(t.start_date).toLocaleDateString()}</div>
              <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-amber-500" /> Deadline: <b>{formatDeadline(t.deadline)}</b></div>
              <div className="flex items-center gap-2"><Users className="w-4 h-4" /> {t.team_count} teams</div>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-6 border-t border-slate-100">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Newspaper className="w-5 h-5 text-[#1B4332]" />
            <h2 className="font-heading font-bold text-xl uppercase">ESPN Top Stories</h2>
          </div>
          <span className="text-[10px] text-slate-400 font-bold">Refreshes 8AM/8PM ET</span>
        </div>

        {newsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1,2].map(i => <div key={i} className="h-24 bg-slate-50 rounded-xl animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {news.length > 0 ? news.map((article, i) => (
              <a key={i} href={article.url} target="_blank" rel="noopener noreferrer"
                className="bg-slate-50/50 rounded-xl p-4 border border-transparent hover:border-[#1B4332]/20 hover:bg-white hover:shadow-md transition-all group">
                <div className="flex justify-between text-[10px] font-bold text-[#1B4332] mb-1">
                  <span>ESPN GOLF</span>
                  <span className="text-slate-400">{article.date}</span>
                </div>
                <h3 className="font-bold text-sm leading-snug group-hover:underline">{article.headline}</h3>
                <p className="text-xs text-slate-500 line-clamp-2 mt-1">{article.summary}</p>
              </a>
            )) : (
              <p className="text-slate-400 text-sm">Headlines briefly unavailable. Visit ESPN.com for the latest.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}