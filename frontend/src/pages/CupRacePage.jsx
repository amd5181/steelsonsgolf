import { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '../App';
import { Loader2, ChevronDown, ChevronUp, Flag, Trophy } from 'lucide-react';

const SHORT_NAMES = {
  'Masters': 'Masters',
  'PGA Championship': 'PGA',
  'U.S. Open': 'US Open',
  'The Open': 'The Open',
};

function abbrev(name) {
  return SHORT_NAMES[name] || name;
}

function RankBadge({ rank }) {
  const cls =
    rank === 1 ? 'bg-yellow-100 text-yellow-700' :
    rank === 2 ? 'bg-slate-100 text-slate-600' :
    rank === 3 ? 'bg-amber-100 text-amber-700' :
    'bg-slate-50 text-slate-400';
  return (
    <div className={`w-7 h-7 rounded-full flex items-center justify-center font-numbers font-bold text-xs flex-shrink-0 ${cls}`}>
      {rank}
    </div>
  );
}


function ExpandedDetail({ tournaments, slotScores, slotTeams }) {
  return (
    <div className="border-t border-slate-100 bg-slate-50/60 px-3 py-3">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {tournaments.map(t => {
          const slot = t.slot;
          const score = slotScores[slot] || 0;
          const golfers = slotTeams[slot] || [];
          const participated = score > 0 || golfers.some(g => g.total_points > 0);
          return (
            <div key={slot} className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              <div className="px-2.5 py-1.5 bg-slate-100 flex items-center justify-between gap-1">
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider truncate">{abbrev(t.name)}</span>
                <span className={`font-numbers font-bold text-xs flex-shrink-0 ${score > 0 ? 'text-[#1B4332]' : 'text-slate-400'}`}>
                  {score > 0 ? score.toFixed(1) : '—'}
                </span>
              </div>
              {participated && golfers.length > 0 ? (
                <div className="divide-y divide-slate-50">
                  {golfers.map((g, i) => (
                    <div key={i} className="flex items-center px-2.5 py-1 text-[11px]">
                      <span className={`w-8 font-numbers font-bold flex-shrink-0 ${g.is_cut || g.is_wd ? 'text-red-400' : 'text-slate-400'}`}>
                        {g.is_wd ? 'WD' : g.is_cut ? 'CUT' : (g.position || '-')}
                      </span>
                      <span className="flex-1 text-[#0F172A] truncate">{g.name}</span>
                      <span className="font-numbers font-bold text-[#1B4332] flex-shrink-0 ml-1">
                        {typeof g.total_points === 'number' ? g.total_points.toFixed(1) : '0'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-2.5 py-3 text-[11px] text-slate-400 italic text-center">Did not play</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function CupRacePage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    axios.get(`${API}/cup-race`)
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggleExpand = (uid) => setExpanded(prev => ({ ...prev, [uid]: !prev[uid] }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 text-[#1B4332] animate-spin" />
      </div>
    );
  }

  const tournaments = data?.tournaments || [];
  const standings = data?.standings || [];
  const podium = standings.slice(0, 3);

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <h1 className="font-heading font-extrabold text-3xl sm:text-4xl text-[#0F172A] tracking-tight flex items-center gap-2">
          <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSaIMjhRx0qfnkqlYeFvo7Z5g5EWnZDuiRJgw&s" alt="Hills Dept. Store" className="h-16 object-contain" />
          CUP
        </h1>
      </div>

      <p className="text-xs text-slate-400 mb-6">Sponsored by Hills Dept. Store — Hills is where the toys are.</p>

      <p className="text-sm text-slate-500 mb-6">
        Season-long standings based on each manager's top team points per major. All four majors are now complete, so the final standings are locked in.
      </p>

      {podium.length > 0 && (
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="rounded-full bg-[#1B4332]/10 p-2">
              <Trophy className="w-4 h-4 text-[#1B4332]" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-sm uppercase tracking-[0.2em] text-[#1B4332]">Final Podium</h2>
              <p className="text-[11px] text-slate-500">Top 3 finishers after all four majors</p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {podium.map((entry, index) => {
              const isGold = index === 0;
              const isSilver = index === 1;
              const isBronze = index === 2;
              const cardClass = isGold
                ? 'border-[#D4AF37] bg-gradient-to-br from-[#FFF8D9] to-[#FDE68A]'
                : isSilver
                  ? 'border-slate-300 bg-gradient-to-br from-slate-50 to-slate-100'
                  : 'border-[#B87333] bg-gradient-to-br from-[#FFF2E8] to-[#FCD7B0]';
              const rankLabel = isGold ? '1st' : isSilver ? '2nd' : '3rd';
              const rankBadgeClass = isGold
                ? 'bg-[#D4AF37] text-[#5B3A00]'
                : isSilver
                  ? 'bg-slate-300 text-slate-700'
                  : 'bg-[#B87333] text-white';

              return (
                <div key={entry.user_id} className={`rounded-xl border p-4 shadow-sm ${cardClass}`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-700">{rankLabel}</span>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-black font-numbers ${rankBadgeClass}`}>
                      {index + 1}
                    </div>
                  </div>
                  <p className="font-heading font-bold text-lg text-[#0F172A] truncate">{entry.user_name}</p>
                  <div className="mt-3 rounded-lg bg-white/70 px-3 py-2">
                    <p className="font-numbers font-extrabold text-2xl text-[#1B4332]">{entry.total_points.toFixed(1)}</p>
                    <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">points</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {standings.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
          <Flag className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-400 text-lg font-medium">No standings yet</p>
          <p className="text-slate-400 text-sm mt-1">Standings will appear after the first tournament.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#1B4332]/20 shadow-sm overflow-hidden">
          {/* Header row */}
          <div className="flex items-center px-4 py-2 bg-gradient-to-r from-[#1B4332] to-[#2D6A4F] text-white text-[10px] font-bold uppercase tracking-wider">
            <div className="w-7 flex-shrink-0 mr-3" />
            <span className="flex-1">Manager</span>
            {tournaments.map(t => (
              <span key={t.slot} className="w-16 text-right flex-shrink-0 hidden sm:block text-white/70">
                {abbrev(t.name)}
              </span>
            ))}
            <span className="w-16 text-right flex-shrink-0 text-[#CCFF00]">Total</span>
            <span className="w-6 flex-shrink-0" />
          </div>

          {/* Standing rows */}
          {standings.map(s => (
            <div key={s.user_id} className="border-b border-slate-100 last:border-0">
              <button
                className="w-full flex items-center px-4 py-3 hover:bg-slate-50 transition-colors text-left"
                onClick={() => toggleExpand(s.user_id)}
              >
                <div className="mr-3 flex-shrink-0">
                  <RankBadge rank={s.rank} />
                </div>
                <span className="flex-1 font-semibold text-sm text-[#0F172A] truncate">{s.user_name}</span>
                {tournaments.map(t => {
                  const pts = s.slot_scores[t.slot] || 0;
                  return (
                    <span key={t.slot} className={`w-16 text-right font-numbers text-xs flex-shrink-0 hidden sm:block ${pts > 0 ? 'text-slate-600' : 'text-slate-300'}`}>
                      {pts > 0 ? pts.toFixed(1) : '—'}
                    </span>
                  );
                })}
                <span className="w-16 text-right font-numbers font-bold text-sm text-[#1B4332] flex-shrink-0">
                  {s.total_points.toFixed(1)}
                </span>
                <span className="w-6 flex-shrink-0 flex justify-end text-slate-400">
                  {expanded[s.user_id] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </span>
              </button>

              {expanded[s.user_id] && (
                <ExpandedDetail
                  tournaments={tournaments}
                  slotScores={s.slot_scores}
                  slotTeams={s.slot_teams}
                />
              )}
            </div>
          ))}
        </div>
      )}

      <div className="h-20" />
    </div>
  );
}
