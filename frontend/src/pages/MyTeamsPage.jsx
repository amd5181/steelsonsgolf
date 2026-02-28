import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import axios from 'axios';
import { API, useAuth } from '../App';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { ScrollArea } from '../components/ui/scroll-area';
import { Search, Minus, Trash2, Save, DollarSign, Loader2, AlertTriangle, Lock, LogIn } from 'lucide-react';
import AuthModal from '../components/AuthModal';
import PaymentBanner from '../components/PaymentBanner';

const BUDGET = 1000000;
const fmt = (n) => '$' + (n || 0).toLocaleString();
const isLocked = (dl) => { if (!dl) return false; try { return new Date() > new Date(dl); } catch { return false; } };


// Select tournament with closest upcoming deadline
function getDefaultTournamentSlot(tournaments) {
  if (!tournaments || tournaments.length === 0) return null;
  const now = new Date();

  let closest = null;
  let closestDiff = Infinity;

  tournaments.forEach(t => {
    if (!t.deadline) return;
    try {
      const deadline = new Date(t.deadline);
      const diff = Math.abs(deadline - now);
      if (diff < closestDiff) {
        closestDiff = diff;
        closest = t;
      }
    } catch (e) {}
  });

  return closest ? closest.slot : (tournaments.length > 0 ? tournaments[0].slot : null);
}

const EMPTY_TEAM = [null, null, null, null, null];

export default function MyTeamsPage() {
  const { user } = useAuth();
  const [tournaments, setTournaments] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [tournament, setTournament] = useState(null);
  const [userTeams, setUserTeams] = useState([]);
  const [team1, setTeam1] = useState([...EMPTY_TEAM]);
  const [team2, setTeam2] = useState([...EMPTY_TEAM]);
  const [savedTeam1, setSavedTeam1] = useState([...EMPTY_TEAM]);
  const [savedTeam2, setSavedTeam2] = useState([...EMPTY_TEAM]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTeam, setActiveTeam] = useState(1);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');

  useEffect(() => {
    axios.get(`${API}/tournaments`).then(r => {
      setTournaments(r.data);
      const defaultSlot = getDefaultTournamentSlot(r.data);
      if (defaultSlot) setSelectedSlot(defaultSlot);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedSlot) return;
    const t = tournaments.find(x => x.slot === selectedSlot);
    // Reset teams when switching tournaments
    setTeam1([...EMPTY_TEAM]);
    setTeam2([...EMPTY_TEAM]);
    setSavedTeam1([...EMPTY_TEAM]);
    setSavedTeam2([...EMPTY_TEAM]);
    if (!t?.id) { setTournament(null); return; }
    axios.get(`${API}/tournaments/${t.id}`).then(r => setTournament(r.data)).catch(() => setTournament(null));
    if (user) {
      axios.get(`${API}/teams/user/${user.id}`).then(r => {
        setUserTeams(r.data);
        const t1 = r.data.find(x => x.tournament_id === t.id && x.team_number === 1);
        const t2 = r.data.find(x => x.tournament_id === t.id && x.team_number === 2);
        const t1State = t1 ? [...t1.golfers, ...Array(5 - t1.golfers.length).fill(null)] : [...EMPTY_TEAM];
        const t2State = t2 ? [...t2.golfers, ...Array(5 - t2.golfers.length).fill(null)] : [...EMPTY_TEAM];
        setTeam1(t1State);
        setTeam2(t2State);
        setSavedTeam1([...t1State]);
        setSavedTeam2([...t2State]);
      }).catch(() => {});
    }
  }, [selectedSlot, tournaments, user]);

  const golferMap = useMemo(() => {
    if (!tournament?.golfers) return {};
    const map = {};
    tournament.golfers.forEach((g, i) => { map[g.name] = { ...g, world_ranking: g.world_ranking || i + 1 }; });
    return map;
  }, [tournament]);

  const golfers = useMemo(() => {
    if (!tournament?.golfers) return [];
    let list = tournament.golfers.filter(g => g.price);
    if (search) list = list.filter(g => g.name.toLowerCase().includes(search.toLowerCase()));
    return list.sort((a, b) => (b.price || 0) - (a.price || 0));
  }, [tournament, search]);

  const team1Cost = team1.reduce((s, g) => s + (g?.price || 0), 0);
  const team2Cost = team2.reduce((s, g) => s + (g?.price || 0), 0);
  const locked = isLocked(tournament?.deadline);

  const currentTeam = activeTeam === 1 ? team1 : team2;
  const currentCost = activeTeam === 1 ? team1Cost : team2Cost;
  const setCurrentTeam = activeTeam === 1 ? setTeam1 : setTeam2;
  const currentFull = currentTeam.filter(Boolean).length >= 5;
  const remaining = BUDGET - currentCost;

  // Detect pending (unsaved) changes by comparing name arrays
  const teamsEqual = (a, b) => a.every((g, i) => g?.name === b[i]?.name);
  const hasPendingChanges = !teamsEqual(team1, savedTeam1) || !teamsEqual(team2, savedTeam2);

  const addGolfer = (golfer) => {
    if (locked) { toast.error('Teams are locked!'); return false; }
    const team = [...currentTeam];
    if (team.some(g => g?.name === golfer.name)) { toast.error('Already on this team'); return false; }
    const slot = team.findIndex(g => g === null);
    if (slot === -1) { toast.error('Team is full'); return false; }
    team[slot] = { name: golfer.name, espn_id: golfer.espn_id, price: golfer.price, world_ranking: golfer.world_ranking };
    setCurrentTeam(team);
    return true;
  };

  const removeGolfer = (idx) => {
    if (locked) return;
    const team = [...currentTeam];
    team[idx] = null;
    const filled = team.filter(Boolean);
    setCurrentTeam([...filled, ...Array(5 - filled.length).fill(null)]);
  };

  const removeGolferByName = (name) => {
    if (locked) return;
    const team = [...currentTeam];
    const idx = team.findIndex(g => g?.name === name);
    if (idx === -1) return;
    team[idx] = null;
    const filled = team.filter(Boolean);
    setCurrentTeam([...filled, ...Array(5 - filled.length).fill(null)]);
  };

  const clearTeam = () => { if (!locked) setCurrentTeam([...EMPTY_TEAM]); };

  // Saves both Team 1 and Team 2 at once
  const saveTeams = async () => {
    if (!user) { setAuthMode('login'); setAuthOpen(true); return; }
    const filled1 = team1.filter(Boolean);
    const filled2 = team2.filter(Boolean);
    if ((filled1.length > 0 && filled1.length !== 5) || (filled2.length > 0 && filled2.length !== 5)) {
      toast.error('Each team needs exactly 5 golfers (or leave it empty)');
      return;
    }
    if (team1Cost > BUDGET || team2Cost > BUDGET) {
      toast.error('One or more teams are over budget!');
      return;
    }
    setSaving(true);
    try {
      const existing1 = userTeams.find(t => t.tournament_id === tournament.id && t.team_number === 1);
      const existing2 = userTeams.find(t => t.tournament_id === tournament.id && t.team_number === 2);

      if (filled1.length === 0 && existing1) {
        await axios.delete(`${API}/teams/${existing1.id}?user_id=${user.id}`);
      } else if (filled1.length === 5) {
        await axios.post(`${API}/teams`, { user_id: user.id, tournament_id: tournament.id, team_number: 1, golfers: filled1 });
      }

      if (filled2.length === 0 && existing2) {
        await axios.delete(`${API}/teams/${existing2.id}?user_id=${user.id}`);
      } else if (filled2.length === 5) {
        await axios.post(`${API}/teams`, { user_id: user.id, tournament_id: tournament.id, team_number: 2, golfers: filled2 });
      }

      toast.success('Teams saved!');
      const newTeams = (await axios.get(`${API}/teams/user/${user.id}`)).data;
      setUserTeams(newTeams);
      setSavedTeam1([...team1]);
      setSavedTeam2([...team2]);
    } catch (e) { toast.error(e.response?.data?.detail || 'Save failed'); }
    finally { setSaving(false); }
  };

  // After auth succeeds, reload teams for the now-logged-in user
  const handleAuthSuccess = async (loggedInUser) => {
    if (!tournament?.id) return;
    try {
      const r = await axios.get(`${API}/teams/user/${loggedInUser.id}`);
      setUserTeams(r.data);
      const t1 = r.data.find(x => x.tournament_id === tournament.id && x.team_number === 1);
      const t2 = r.data.find(x => x.tournament_id === tournament.id && x.team_number === 2);
      const t1State = t1 ? [...t1.golfers, ...Array(5 - t1.golfers.length).fill(null)] : [...EMPTY_TEAM];
      const t2State = t2 ? [...t2.golfers, ...Array(5 - t2.golfers.length).fill(null)] : [...EMPTY_TEAM];
      if (t1) { setTeam1(t1State); setSavedTeam1([...t1State]); }
      if (t2) { setTeam2(t2State); setSavedTeam2([...t2State]); }
    } catch {}
  };

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><Loader2 className="w-8 h-8 text-[#1B4332] animate-spin" /></div>;

  const over = currentCost > BUDGET;
  const pct = Math.min((currentCost / BUDGET) * 100, 100);

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto animate-fade-in-up" data-testid="my-teams-page">
      <h1 className="font-heading font-extrabold text-3xl sm:text-4xl text-[#0F172A] tracking-tight mb-4">MY TEAMS</h1>

      {/* Guest banner */}
      {!user && (
        <div className="bg-[#1B4332]/5 border border-[#1B4332]/20 rounded-xl p-4 mb-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1">
            <p className="text-sm font-bold text-[#1B4332]">Build your team — no account needed</p>
            <p className="text-xs text-slate-500 mt-0.5">Sign in or create a free account to save your picks and compete.</p>
          </div>
          <button onClick={() => { setAuthMode('login'); setAuthOpen(true); }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1B4332] text-white text-xs font-bold hover:bg-[#2D6A4F] transition-colors flex-shrink-0">
            <LogIn className="w-3.5 h-3.5" />Sign In / Create Account
          </button>
        </div>
      )}

      <div className="mb-4">
        <PaymentBanner compact={true} />
      </div>

      {/* Tournament Selector */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4" data-testid="tournament-selector">
        {tournaments.map(t => (
          <button key={t.slot} onClick={() => setSelectedSlot(t.slot)} data-testid={`select-tournament-${t.slot}`}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              selectedSlot === t.slot ? 'bg-[#1B4332] text-white shadow-lg' : 'bg-white border border-slate-200 text-slate-600 hover:border-[#1B4332]/30'
            }`}>
            {t.name}
          </button>
        ))}
      </div>

      {!tournament || !tournament.golfers?.some(g => g.price) ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center" data-testid="no-golfers-message">
          <p className="text-slate-400 text-lg font-medium">Golfers Not Available</p>
          <p className="text-slate-400 text-sm mt-1">Please come back later when the field and prices have been set.</p>
        </div>
      ) : (
        <>
          {locked && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-700 text-sm font-medium mb-4">
              <Lock className="w-4 h-4" /> Teams are locked. Deadline has passed.
            </div>
          )}

          <div className="mb-4">
            <div className="flex items-center gap-2 bg-slate-100 rounded-xl p-1 w-fit">
              <button onClick={() => setActiveTeam(1)} data-testid="toggle-team-1"
                className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTeam === 1 ? 'bg-[#1B4332] text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                Team 1
              </button>
              <button onClick={() => setActiveTeam(2)} data-testid="toggle-team-2"
                className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTeam === 2 ? 'bg-[#2D6A4F] text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                Team 2
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* Team Panel */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden" data-testid={`team-${activeTeam}-panel`}>
              <div className={`px-4 py-3 flex items-center justify-between ${activeTeam === 1 ? 'bg-gradient-to-r from-[#1B4332] to-[#2D6A4F]' : 'bg-gradient-to-r from-[#2D6A4F] to-[#1B4332]'}`}>
                <span className="text-white font-heading font-bold text-sm uppercase tracking-wider">
                  {user ? `${user.name}'s` : 'Your'} Team {activeTeam}
                </span>
                {!locked && <button onClick={clearTeam} className="text-white/60 hover:text-white" data-testid={`clear-team-${activeTeam}`}><Trash2 className="w-4 h-4" /></button>}
              </div>

              <div className="divide-y divide-slate-50">
                {currentTeam.map((g, i) => (
                  <div key={i} className="flex items-center px-4 py-3 min-h-[52px]" data-testid={`team-${activeTeam}-slot-${i}`}>
                    <span className="w-6 text-sm font-bold text-slate-400 font-numbers">{i + 1}</span>
                    {g ? (
                      <>
                        <span className="w-10 text-xs font-bold text-slate-500 font-numbers">#{golferMap[g.name]?.world_ranking || g.world_ranking || '?'}</span>
                        <span className="flex-1 text-sm font-medium text-[#0F172A] truncate">{g.name}</span>
                        <span className="text-xs font-bold font-numbers text-[#2D6A4F] ml-2 mr-3">{fmt(g.price)}</span>
                        {!locked && <button onClick={() => removeGolfer(i)} className="text-red-400 hover:text-red-600" data-testid={`remove-golfer-${activeTeam}-${i}`}><Minus className="w-4 h-4" /></button>}
                      </>
                    ) : (
                      <span className="flex-1 text-sm text-slate-300 italic">Empty slot</span>
                    )}
                  </div>
                ))}
              </div>

              {/* Budget bar + Save button inline */}
              <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between text-xs font-semibold mb-1.5">
                    <span className={over ? 'text-red-500' : 'text-slate-500'}><DollarSign className="w-3.5 h-3.5 inline" />{fmt(currentCost)} / {fmt(BUDGET)}</span>
                    <span className={over ? 'text-red-500 font-bold' : 'text-[#1B4332] font-bold'}>
                      {over ? <><AlertTriangle className="w-3.5 h-3.5 inline mr-0.5" />OVER {fmt(currentCost - BUDGET)}</> : `${fmt(remaining)} left`}
                    </span>
                  </div>
                  <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full budget-bar ${over ? 'bg-red-500' : 'bg-[#1B4332]'}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>

                {!locked && (
                  <button
                    onClick={saveTeams}
                    disabled={saving}
                    data-testid="save-teams"
                    className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold transition-all ${
                      saving
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        : hasPendingChanges
                        ? 'bg-yellow-400 text-yellow-900 shadow-md animate-pulse'
                        : 'bg-[#1B4332] text-white hover:bg-[#2D6A4F]'
                    }`}
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>Save</span>
                  </button>
                )}
              </div>
            </div>

            {/* Golfer List */}
            <div className="bg-white rounded-xl border border-[#1B4332]/25 shadow-sm overflow-hidden">
              {/* Themed header accent */}
              <div className="px-4 py-2.5 bg-gradient-to-r from-[#1B4332]/10 to-[#2D6A4F]/5 border-b border-[#1B4332]/15">
                <span className="font-heading font-bold text-sm text-[#1B4332] uppercase tracking-wider">Select Golfers</span>
              </div>
              <div className="p-3 border-b border-slate-100 flex items-center gap-2">
                <Search className="w-4 h-4 text-slate-400" />
                <Input data-testid="golfer-search" value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search golfers..." className="h-9 border-0 shadow-none focus-visible:ring-0 text-sm" />
                <Badge variant="outline" className="text-xs whitespace-nowrap">{golfers.length}</Badge>
              </div>
              <ScrollArea className="h-[450px] lg:h-[500px]">
                <div className="divide-y divide-slate-50">
                  {golfers.map((g, i) => {
                    const onT1 = team1.some(t => t?.name === g.name);
                    const onT2 = team2.some(t => t?.name === g.name);
                    const onCurrentTeam = currentTeam.some(t => t?.name === g.name);
                    const wouldExceedBudget = !onCurrentTeam && (currentCost + (g.price || 0) > BUDGET);
                    const cantAdd = !onCurrentTeam && (currentFull || wouldExceedBudget);
                    return (
                      <div key={g.espn_id || i}
                        className={`flex items-center px-3 py-2.5 transition-colors ${onCurrentTeam ? 'bg-green-50' : cantAdd ? 'opacity-40' : 'hover:bg-slate-50'}`}
                        data-testid={`golfer-row-${i}`}>
                        <span className="w-9 text-xs font-bold text-slate-600 font-numbers">#{g.world_ranking || i+1}</span>
                        <div className="flex-1 min-w-0 mr-2">
                          <span className="text-sm font-medium text-[#0F172A] block truncate">{g.name}</span>
                          <span className={`text-xs font-bold font-numbers ${wouldExceedBudget ? 'text-red-400' : 'text-[#2D6A4F]'}`}>
                            {fmt(g.price)}{wouldExceedBudget && <span className="font-normal ml-1">· over budget</span>}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {onT1 && <span className="text-[9px] font-bold bg-[#1B4332] text-white rounded px-1.5 py-0.5">T1</span>}
                          {onT2 && <span className="text-[9px] font-bold bg-[#2D6A4F] text-white rounded px-1.5 py-0.5">T2</span>}
                          {!locked && onCurrentTeam && (
                            <button onClick={() => removeGolferByName(g.name)} data-testid={`remove-from-list-${i}`}
                              className="h-8 px-3 rounded-md bg-red-50 text-red-500 hover:bg-red-100 text-xs font-bold flex items-center gap-1 transition-colors">
                              <Minus className="w-3 h-3" />Remove
                            </button>
                          )}
                          {!locked && !onCurrentTeam && (
                            <Button size="sm" onClick={() => addGolfer(g)} disabled={cantAdd}
                              data-testid={`add-golfer-${i}`}
                              className={`h-8 px-4 ${activeTeam === 1 ? 'bg-[#1B4332] hover:bg-[#2D6A4F]' : 'bg-[#2D6A4F] hover:bg-[#1B4332]'} text-white text-xs font-bold disabled:opacity-30`}>
                              Add
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          </div>
        </>
      )}

      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        onSuccess={handleAuthSuccess}
        defaultMode={authMode}
      />
    </div>
  );
}
