import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import axios from 'axios';
import { API, useAuth } from '../App';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { ScrollArea } from '../components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Search, Download, DollarSign, Trash2, Loader2, Users, CheckCircle, ClipboardPaste, FileSpreadsheet, Calendar, Eye, Pencil, X, Mail, Upload, Link2, AlertTriangle, Plus, BarChart2, Zap } from 'lucide-react';

const fmt = (n) => '$' + (n || 0).toLocaleString();

function StatsModal({ open, tournament, teams, onClose }) {
  if (!open || !teams.length) return null;

  const totalTeams = teams.length;

  // Player ownership
  const ownershipMap = {};
  teams.forEach(team => team.golfers.forEach(g => {
    ownershipMap[g.name] = (ownershipMap[g.name] || 0) + 1;
  }));
  const ownership = Object.entries(ownershipMap)
    .map(([name, count]) => ({ name, pct: Math.round((count / totalTeams) * 100) }))
    .sort((a, b) => b.pct - a.pct);

  // Budget
  const withCosts = teams.map(t => ({
    ...t,
    total: t.total_cost || t.golfers.reduce((s, g) => s + (g.price || 0), 0),
  })).sort((a, b) => a.total - b.total);
  const cheapest = withCosts[0];
  const avgCost = Math.round(withCosts.reduce((s, t) => s + t.total, 0) / totalTeams);

  const contrarian = ownership.filter(p => p.pct > 0 && p.pct <= 15);

  // Left on the board — most expensive players with 0 selections
  // Rank all golfers by price so we can show their field ranking (e.g. #5, #10)
  const rankedField = [...(tournament?.golfers || [])]
    .filter(g => g.price)
    .sort((a, b) => (b.price || 0) - (a.price || 0));
  const fieldRankMap = {};
  rankedField.forEach((g, i) => { fieldRankMap[g.name] = i + 1; });

  const leftOnBoard = rankedField
    .filter(g => !ownershipMap[g.name])
    .slice(0, 5);

  return (
    <Dialog open={open} onOpenChange={o => { if (!o) onClose(); }}>
      <DialogContent
        className="sm:max-w-md p-0 overflow-hidden flex flex-col gap-0 top-[3%] translate-y-0 sm:top-[50%] sm:translate-y-[-50%] [&>button:last-child]:text-white/90 [&>button:last-child]:opacity-90 [&>button:last-child]:rounded-full [&>button:last-child]:bg-black/25 [&>button:last-child]:p-1"
        style={{ maxHeight: 'calc(100dvh - 2rem)' }}
      >
        {/* Header */}
        <div className="flex-shrink-0 px-6 py-5" style={{ background: 'linear-gradient(135deg, #0a2a14 0%, #1B4332 55%, #2D6A4F 100%)' }}>
          <p className="text-[10px] font-bold tracking-[0.22em] uppercase mb-1 text-white/50">Field Breakdown</p>
          <h2 className="font-heading font-extrabold text-2xl uppercase leading-tight text-white">{tournament?.name}</h2>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-5 space-y-5 bg-white">

          {/* Summary */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: totalTeams, label: 'Teams' },
              { value: ownership.length, label: 'Unique Picks' },
              { value: fmt(avgCost), label: 'Avg Salary', small: true },
            ].map(({ value, label, small }) => (
              <div key={label} className="bg-slate-50 rounded-xl p-3 text-center">
                <div className={`font-numbers font-extrabold text-[#1B4332] leading-none ${small ? 'text-base mt-1' : 'text-2xl'}`}>{value}</div>
                <div className="text-[9px] text-slate-400 uppercase tracking-wider mt-1">{label}</div>
              </div>
            ))}
          </div>

          {/* Ownership bars */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-3.5 h-3.5 text-[#2D6A4F]" />
              <span className="text-[10px] font-bold tracking-[0.18em] text-slate-400 uppercase">Most Selected</span>
            </div>
            <div className="space-y-2.5">
              {ownership.slice(0, 8).map((p, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <span className="text-xs text-slate-700 truncate flex-shrink-0" style={{ width: '9rem' }}>{p.name}</span>
                  <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div className="h-full rounded-full bg-[#1B4332]" style={{ width: `${p.pct}%` }} />
                  </div>
                  <span className="text-xs font-bold font-numbers text-[#1B4332] w-9 text-right flex-shrink-0">{p.pct}%</span>
                </div>
              ))}
            </div>
          </section>

          {/* Contrarian picks */}
          {contrarian.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-[10px] font-bold tracking-[0.18em] text-slate-400 uppercase">Flying Under the Radar</span>
                <span className="text-[9px] text-slate-300 ml-0.5">≤15%</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {contrarian.slice(0, 8).map((p, i) => (
                  <span key={i} className="px-2 py-1 bg-amber-50 border border-amber-100 rounded-lg text-xs text-amber-800">
                    {p.name} <span className="font-bold">{p.pct}%</span>
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Thinnest wallet */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-[10px] font-bold tracking-[0.18em] text-slate-400 uppercase">Thinnest Wallet</span>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs font-semibold text-[#0F172A]">💸 {cheapest.user_name} #{cheapest.team_number}</p>
                <span className="font-numbers font-bold text-sm text-[#1B4332]">{fmt(cheapest.total)}</span>
              </div>
              <div className="space-y-1">
                {cheapest.golfers.map((g, i) => (
                  <div key={i} className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-600">{g.name}</span>
                    <span className="font-numbers text-slate-400">{fmt(g.price)}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Left on the board */}
          {leftOnBoard.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                <span className="text-[10px] font-bold tracking-[0.18em] text-slate-400 uppercase">Left on the Board</span>
                <span className="text-[9px] text-slate-300 ml-0.5">0% ownership</span>
              </div>
              <div className="space-y-1.5">
                {leftOnBoard.map((g, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2 bg-rose-50 border border-rose-100 rounded-lg">
                    <div className="flex items-center gap-2.5">
                      <span className="text-[10px] font-bold text-rose-300 w-4">#{fieldRankMap[g.name]}</span>
                      <span className="text-sm font-medium text-slate-700">{g.name}</span>
                    </div>
                    <span className="font-numbers font-bold text-sm text-rose-500">{fmt(g.price)}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          <div className="h-1" />
        </div>
      </DialogContent>
    </Dialog>
  );
}

function toEasternInput(isoStr) {
  if (!isoStr) return '';
  return new Date(isoStr)
    .toLocaleString('sv-SE', { timeZone: 'America/New_York' })
    .slice(0, 16)
    .replace(' ', 'T');
}

function easternInputToISO(val) {
  if (!val) return '';
  const [date, time = '00:00'] = val.split('T');
  for (const offset of ['-04:00', '-05:00']) {
    const d = new Date(`${date}T${time}:00${offset}`);
    const back = d.toLocaleString('sv-SE', { timeZone: 'America/New_York' })
      .slice(0, 16).replace(' ', 'T');
    if (back === `${date}T${time}`) return d.toISOString();
  }
  return new Date(`${date}T${time}:00-05:00`).toISOString();
}

export default function AdminPage() {
  const { user } = useAuth();
  const [tournaments, setTournaments] = useState([]);
  const [espnEvents, setEspnEvents] = useState([]);
  const [searchYear, setSearchYear] = useState('2026');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [oddsDialog, setOddsDialog] = useState({ open: false, slot: null });
  const [oddsText, setOddsText] = useState('');
  const [teamsDialog, setTeamsDialog] = useState({ open: false, tournament: null, teams: [] });
  const [editingTeam, setEditingTeam] = useState(null);
  const [editGolfers, setEditGolfers] = useState([]);

  // Stats dialog
  const [statsDialog, setStatsDialog] = useState({ open: false, tournament: null, teams: [] });

  // Upload players dialog
  const [uploadDialog, setUploadDialog] = useState({ open: false, slot: null });
  const [uploadText, setUploadText] = useState('');

  // ESPN Sync dialog
  const [syncDialog, setSyncDialog] = useState({ open: false, slot: null });
  const [syncMatched, setSyncMatched] = useState([]);
  const [syncUnmatchedSite, setSyncUnmatchedSite] = useState([]);
  const [syncUnmatchedEspn, setSyncUnmatchedEspn] = useState([]);
  const [syncRemovals, setSyncRemovals] = useState(new Set());
  const [syncEspnAdds, setSyncEspnAdds] = useState({});  // { espn_id: price_string }

  const fetchTournaments = async () => {
    try {
      const r = await axios.get(`${API}/admin/tournaments?user_id=${user.id}`);
      setTournaments(r.data);
    } catch {}
  };

  useEffect(() => { fetchTournaments().finally(() => setLoading(false)); }, []);

  const searchEspn = async () => {
    setActionLoading(p => ({ ...p, search: true }));
    try {
      const r = await axios.post(`${API}/admin/espn-search?user_id=${user.id}&year=${searchYear}`);
      setEspnEvents(r.data.events || []);
      toast.success(`Found ${r.data.events?.length || 0} events`);
    } catch (e) { toast.error(e.response?.data?.detail || 'Search failed'); }
    finally { setActionLoading(p => ({ ...p, search: false })); }
  };

  const handleEventSelect = (slot, espnId) => {
    const ev = espnEvents.find(e => e.espn_id === espnId);
    updateTournament(slot, {
      espn_event_id: espnId,
      start_date: ev?.date || '',
      end_date: ev?.end_date || ''
    });
  };

  const updateTournament = async (slot, data) => {
    try {
      await axios.put(`${API}/admin/tournaments/${slot}?user_id=${user.id}`, data);
      await fetchTournaments();
    } catch (e) { toast.error(e.response?.data?.detail || 'Update failed'); }
  };

  const fetchGolfers = async (slot) => {
    setActionLoading(p => ({ ...p, [`golfers_${slot}`]: true }));
    try {
      await axios.post(`${API}/admin/fetch-golfers/${slot}?user_id=${user.id}`);
      await fetchTournaments();
      toast.success('Golfers loaded from ESPN!');
    } catch (e) { toast.error(e.response?.data?.detail || 'Failed to fetch golfers'); }
    finally { setActionLoading(p => ({ ...p, [`golfers_${slot}`]: false })); }
  };

  const submitUpload = async () => {
    if (!uploadText.trim()) { toast.error('Paste player data first'); return; }
    setActionLoading(p => ({ ...p, [`upload_${uploadDialog.slot}`]: true }));
    try {
      await axios.post(`${API}/admin/upload-players/${uploadDialog.slot}?user_id=${user.id}`, { players_text: uploadText });
      await fetchTournaments();
      toast.success('Players uploaded!');
      setUploadDialog({ open: false, slot: null });
      setUploadText('');
    } catch (e) { toast.error(e.response?.data?.detail || 'Upload failed'); }
    finally { setActionLoading(p => ({ ...p, [`upload_${uploadDialog.slot}`]: false })); }
  };

  const startSync = async (slot) => {
    setActionLoading(p => ({ ...p, [`sync_${slot}`]: true }));
    try {
      const r = await axios.post(`${API}/admin/espn-sync/${slot}?user_id=${user.id}`);
      setSyncMatched(r.data.matched || []);
      setSyncUnmatchedSite(r.data.unmatched_site || []);
      setSyncUnmatchedEspn(r.data.unmatched_espn || []);
      setSyncRemovals(new Set());
      setSyncEspnAdds({});
      setSyncDialog({ open: true, slot });
    } catch (e) { toast.error(e.response?.data?.detail || 'Sync failed'); }
    finally { setActionLoading(p => ({ ...p, [`sync_${slot}`]: false })); }
  };

  const unmatchPair = (match) => {
    setSyncMatched(prev => prev.filter(m => m.site_name !== match.site_name));
    setSyncUnmatchedSite(prev => [...prev, { name: match.site_name, price: match.price }]);
    setSyncUnmatchedEspn(prev => [...prev, { espn_id: match.espn_id, name: match.espn_name }]);
  };

  const linkSitePlayer = (siteName, sitePrice, espnId) => {
    const espnPlayer = syncUnmatchedEspn.find(e => e.espn_id === espnId);
    if (!espnPlayer) return;
    setSyncMatched(prev => [...prev, { site_name: siteName, espn_id: espnId, espn_name: espnPlayer.name, price: sitePrice, confidence: 'manual' }]);
    setSyncUnmatchedSite(prev => prev.filter(s => s.name !== siteName));
    setSyncUnmatchedEspn(prev => prev.filter(e => e.espn_id !== espnId));
    setSyncRemovals(prev => { const n = new Set(prev); n.delete(siteName); return n; });
  };

  const toggleRemoval = (siteName) => {
    setSyncRemovals(prev => {
      const n = new Set(prev);
      if (n.has(siteName)) n.delete(siteName); else n.add(siteName);
      return n;
    });
  };

  const toggleEspnAdd = (espnId) => {
    setSyncEspnAdds(prev => {
      const n = { ...prev };
      if (espnId in n) delete n[espnId]; else n[espnId] = '';
      return n;
    });
  };

  const confirmSync = async () => {
    const slot = syncDialog.slot;
    setActionLoading(p => ({ ...p, confirmSync: true }));
    try {
      const add_from_espn = Object.entries(syncEspnAdds)
        .filter(([, price]) => price && parseInt(price) > 0)
        .map(([espn_id, price]) => {
          const ep = syncUnmatchedEspn.find(e => e.espn_id === espn_id) ||
                     { espn_id, name: '' };
          return { espn_id, espn_name: ep.name, price: parseInt(price) };
        });
      const r = await axios.post(`${API}/admin/espn-sync/${slot}/confirm?user_id=${user.id}`, {
        matched: syncMatched.map(m => ({ site_name: m.site_name, espn_id: m.espn_id, espn_name: m.espn_name })),
        add_from_espn,
        remove_from_site: Array.from(syncRemovals),
      });
      await fetchTournaments();
      const affected = r.data.affected_teams || [];
      if (affected.length > 0) {
        toast.warning(`Sync complete — ${affected.length} team(s) have removed players. Check those teams.`);
      } else {
        toast.success(`Sync complete! ${r.data.golfers_count} players linked to ESPN.`);
      }
      setSyncDialog({ open: false, slot: null });
    } catch (e) { toast.error(e.response?.data?.detail || 'Confirm failed'); }
    finally { setActionLoading(p => ({ ...p, confirmSync: false })); }
  };

  const submitOdds = async () => {
    if (!oddsText.trim()) { toast.error('Paste odds data first'); return; }
    setActionLoading(p => ({ ...p, [`odds_${oddsDialog.slot}`]: true }));
    try {
      await axios.post(`${API}/admin/fetch-odds/${oddsDialog.slot}?user_id=${user.id}`, { odds_text: oddsText });
      await fetchTournaments();
      toast.success('Odds imported & prices set!');
      setOddsDialog({ open: false, slot: null });
      setOddsText('');
    } catch (e) { toast.error(e.response?.data?.detail || 'Import failed'); }
    finally { setActionLoading(p => ({ ...p, [`odds_${oddsDialog.slot}`]: false })); }
  };

  const setDefaultPrices = async (slot) => {
    setActionLoading(p => ({ ...p, [`prices_${slot}`]: true }));
    try {
      await axios.post(`${API}/admin/set-default-prices/${slot}?user_id=${user.id}`);
      await fetchTournaments();
      toast.success('Default prices set!');
    } catch (e) { toast.error(e.response?.data?.detail || 'Failed'); }
    finally { setActionLoading(p => ({ ...p, [`prices_${slot}`]: false })); }
  };

  const resetTournament = async (slot) => {
    if (!window.confirm('Reset this tournament? All teams, scores, and data will be deleted.')) return;
    setActionLoading(p => ({ ...p, [`reset_${slot}`]: true }));
    try {
      await axios.delete(`${API}/admin/tournaments/${slot}?user_id=${user.id}`);
      await fetchTournaments();
      toast.success('Tournament reset!');
    } catch (e) { toast.error(e.response?.data?.detail || 'Reset failed'); }
    finally { setActionLoading(p => ({ ...p, [`reset_${slot}`]: false })); }
  };

  const viewTeams = async (tournament) => {
    if (!tournament.id) { toast.error('Tournament not set up yet'); return; }
    setActionLoading(p => ({ ...p, [`teams_${tournament.slot}`]: true }));
    try {
      const r = await axios.get(`${API}/admin/teams/${tournament.id}?user_id=${user.id}`);
      setTeamsDialog({ open: true, tournament: r.data.tournament, teams: r.data.teams });
    } catch (e) { toast.error(e.response?.data?.detail || 'Failed to load teams'); }
    finally { setActionLoading(p => ({ ...p, [`teams_${tournament.slot}`]: false })); }
  };

  const viewStats = async (tournament) => {
    if (!tournament.id) { toast.error('Tournament not set up yet'); return; }
    setActionLoading(p => ({ ...p, [`stats_${tournament.slot}`]: true }));
    try {
      const r = await axios.get(`${API}/admin/teams/${tournament.id}?user_id=${user.id}`);
      setStatsDialog({ open: true, tournament: r.data.tournament, teams: r.data.teams });
    } catch (e) { toast.error(e.response?.data?.detail || 'Failed to load stats'); }
    finally { setActionLoading(p => ({ ...p, [`stats_${tournament.slot}`]: false })); }
  };

  const startEditTeam = (team) => {
    setEditingTeam(team);
    setEditGolfers([...team.golfers]);
  };

  const removeGolferFromEdit = (idx) => {
    const newGolfers = [...editGolfers];
    newGolfers.splice(idx, 1);
    setEditGolfers(newGolfers);
  };

  const addGolferToEdit = (golfer) => {
    if (editGolfers.length >= 5) { toast.error('Team is full'); return; }
    if (editGolfers.some(g => g.name === golfer.name)) { toast.error('Already on team'); return; }
    setEditGolfers([...editGolfers, golfer]);
  };

  const saveEditedTeam = async () => {
    if (editGolfers.length !== 5) { toast.error('Must have exactly 5 golfers'); return; }
    setActionLoading(p => ({ ...p, saveEdit: true }));
    try {
      await axios.put(`${API}/admin/teams/${editingTeam.id}?user_id=${user.id}`, { golfers: editGolfers });
      toast.success('Team updated!');
      const r = await axios.get(`${API}/admin/teams/${teamsDialog.tournament.id}?user_id=${user.id}`);
      setTeamsDialog(p => ({ ...p, teams: r.data.teams }));
      setEditingTeam(null);
      setEditGolfers([]);
    } catch (e) { toast.error(e.response?.data?.detail || 'Update failed'); }
    finally { setActionLoading(p => ({ ...p, saveEdit: false })); }
  };

  const deleteTeam = async (teamId) => {
    if (!window.confirm('Delete this team?')) return;
    try {
      await axios.delete(`${API}/admin/teams/${teamId}?user_id=${user.id}`);
      toast.success('Team deleted!');
      const r = await axios.get(`${API}/admin/teams/${teamsDialog.tournament.id}?user_id=${user.id}`);
      setTeamsDialog(p => ({ ...p, teams: r.data.teams }));
    } catch (e) { toast.error(e.response?.data?.detail || 'Delete failed'); }
  };

  const exportEmails = () => {
    const seen = new Set();
    const emails = teamsDialog.teams
      .map(t => t.user_email)
      .filter(e => e && !seen.has(e) && seen.add(e));
    if (emails.length === 0) { toast.error('No emails found'); return; }
    const csv = 'Email\n' + emails.join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${teamsDialog.tournament?.name || 'tournament'}-emails.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${emails.length} emails`);
  };

  const togglePaid = async (teamId, currentPaid) => {
    try {
      const r = await axios.patch(`${API}/admin/teams/${teamId}/paid?user_id=${user.id}&paid=${!currentPaid}`);
      setTeamsDialog(p => ({
        ...p,
        teams: p.teams.map(t => t.id === teamId ? { ...t, paid: r.data.paid } : t)
      }));
    } catch (e) { toast.error('Failed to update payment status'); }
  };

  const allSlots = [1, 2, 3, 4].map(slot => {
    const t = tournaments.find(x => x.slot === slot);
    return t || { slot, name: '', status: 'setup', golfers: [] };
  });

  const needsEspnSync = (t) =>
    t.golfers?.length > 0 && t.espn_event_id &&
    t.golfers.some(g => !g.espn_id);

  const activePlayerNames = new Set(teamsDialog.tournament?.golfers?.map(g => g.name) || []);

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><Loader2 className="w-8 h-8 text-[#1B4332] animate-spin" /></div>;

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto animate-fade-in-up" data-testid="admin-page">
      <div className="mb-6">
        <h1 className="font-heading font-extrabold text-3xl sm:text-4xl text-[#0F172A] tracking-tight">ADMIN</h1>
      </div>

      {/* ESPN Event Search */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 mb-6" data-testid="espn-search-panel">
        <h3 className="font-heading font-bold text-sm text-[#0F172A] uppercase tracking-wider mb-3">
          <Search className="w-4 h-4 inline mr-1.5" />Search ESPN Events
        </h3>
        <div className="flex gap-2 flex-wrap">
          <Input data-testid="espn-search-year" value={searchYear} onChange={e => setSearchYear(e.target.value)}
            placeholder="Year" className="w-24 h-9" />
          <Button onClick={searchEspn} disabled={actionLoading.search} data-testid="espn-search-btn"
            className="h-9 bg-[#1B4332] text-white hover:bg-[#2D6A4F]">
            {actionLoading.search ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Search className="w-4 h-4 mr-1" />Search</>}
          </Button>
          {espnEvents.length > 0 && <Badge variant="outline" className="text-xs">{espnEvents.length} events found</Badge>}
        </div>
      </div>

      {/* Tournament Slots */}
      <div className="space-y-4 stagger">
        {allSlots.map(t => (
          <div key={t.slot} className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden animate-fade-in-up"
            data-testid={`admin-slot-${t.slot}`}>
            <div className="bg-gradient-to-r from-[#1B4332] to-[#2D6A4F] px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-white font-heading font-bold text-sm uppercase tracking-wider">Major {t.slot}</span>
                {t.status === 'prices_set' && <Badge className="bg-[#CCFF00] text-[#0F172A] text-[10px]"><CheckCircle className="w-3 h-3 mr-0.5" />Ready</Badge>}
                {t.status === 'golfers_loaded' && <Badge className="bg-blue-400 text-white text-[10px]">Golfers Loaded</Badge>}
                {needsEspnSync(t) && <Badge className="bg-amber-400 text-amber-900 text-[10px]"><AlertTriangle className="w-3 h-3 mr-0.5" />Needs ESPN Sync</Badge>}
              </div>
              <div className="flex items-center gap-2">
                {t.id && (
                  <>
                    <Button size="sm" variant="ghost" onClick={() => viewTeams(t)}
                      disabled={actionLoading[`teams_${t.slot}`]}
                      className="h-7 px-2 text-white/80 hover:text-white hover:bg-white/10" data-testid={`view-teams-${t.slot}`}>
                      {actionLoading[`teams_${t.slot}`] ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Eye className="w-3.5 h-3.5 mr-1" />Teams</>}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => viewStats(t)}
                      disabled={actionLoading[`stats_${t.slot}`]}
                      title="Field stats"
                      className="h-7 w-7 p-0 text-white/80 hover:text-white hover:bg-white/10" data-testid={`view-stats-${t.slot}`}>
                      {actionLoading[`stats_${t.slot}`] ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BarChart2 className="w-3.5 h-3.5" />}
                    </Button>
                  </>
                )}
                <button onClick={() => resetTournament(t.slot)}
                  disabled={actionLoading[`reset_${t.slot}`]}
                  className="text-white/50 hover:text-white transition-colors disabled:opacity-30" data-testid={`reset-slot-${t.slot}`}>
                  {actionLoading[`reset_${t.slot}`] ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Tournament Name</label>
                <Input data-testid={`slot-name-${t.slot}`} defaultValue={t.name}
                  onBlur={e => { if (e.target.value !== t.name) updateTournament(t.slot, { name: e.target.value }); }}
                  placeholder="e.g., Masters 2026" className="h-9" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">ESPN Event</label>
                <div className="flex gap-2 flex-wrap">
                  {espnEvents.length > 0 ? (
                    <Select value={t.espn_event_id || ''} onValueChange={val => handleEventSelect(t.slot, val)}>
                      <SelectTrigger className="h-9 flex-1 min-w-[200px]" data-testid={`espn-select-${t.slot}`}>
                        <SelectValue placeholder="Select ESPN event..." />
                      </SelectTrigger>
                      <SelectContent>
                        {espnEvents.map(ev => (
                          <SelectItem key={ev.espn_id} value={ev.espn_id}>
                            {ev.name} ({ev.status?.replace('STATUS_', '')})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input data-testid={`espn-id-${t.slot}`} defaultValue={t.espn_event_id || ''}
                      onBlur={e => updateTournament(t.slot, { espn_event_id: e.target.value })}
                      placeholder="Search ESPN events above first" className="h-9 flex-1" />
                  )}
                </div>
                {/* Load Field row */}
                <div className="flex gap-2 flex-wrap mt-2">
                  <Button onClick={() => fetchGolfers(t.slot)} disabled={!t.espn_event_id || actionLoading[`golfers_${t.slot}`]}
                    data-testid={`fetch-golfers-${t.slot}`}
                    className="h-9 bg-[#2D6A4F] text-white hover:bg-[#1B4332]">
                    {actionLoading[`golfers_${t.slot}`] ? <Loader2 className="w-4 h-4 animate-spin" /> :
                      <><Download className="w-4 h-4 mr-1" />Fetch from ESPN</>}
                  </Button>
                  <Button onClick={() => { setUploadDialog({ open: true, slot: t.slot }); setUploadText(''); }}
                    variant="outline" data-testid={`upload-players-${t.slot}`} className="h-9">
                    <Upload className="w-4 h-4 mr-1" />Upload Players
                  </Button>
                  {needsEspnSync(t) && (
                    <Button onClick={() => startSync(t.slot)} disabled={actionLoading[`sync_${t.slot}`]}
                      data-testid={`sync-espn-${t.slot}`}
                      className="h-9 bg-amber-500 text-white hover:bg-amber-600">
                      {actionLoading[`sync_${t.slot}`] ? <Loader2 className="w-4 h-4 animate-spin" /> :
                        <><Link2 className="w-4 h-4 mr-1" />Sync to ESPN</>}
                    </Button>
                  )}
                </div>
              </div>
              {/* Pricing */}
              {t.golfers?.length > 0 && (
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Pricing</label>
                  <div className="flex gap-2 flex-wrap">
                    <Button onClick={() => { setOddsDialog({ open: true, slot: t.slot }); setOddsText(''); }}
                      disabled={!t.golfers?.length} data-testid={`paste-odds-${t.slot}`}
                      className="h-9 bg-[#1B4332] text-white hover:bg-[#2D6A4F]">
                      <ClipboardPaste className="w-4 h-4 mr-1" />Paste Odds
                    </Button>
                    <Button onClick={() => setDefaultPrices(t.slot)} variant="outline" disabled={!t.golfers?.length || actionLoading[`prices_${t.slot}`]}
                      data-testid={`default-prices-${t.slot}`} className="h-9">
                      {actionLoading[`prices_${t.slot}`] ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Auto-Price'}
                    </Button>
                    <Button onClick={() => {
                      window.open(`${API}/admin/export-csv/${t.slot}?user_id=${user.id}`, '_blank');
                    }} variant="outline" disabled={!t.golfers?.length}
                      data-testid={`export-csv-${t.slot}`} className="h-9">
                      <FileSpreadsheet className="w-4 h-4 mr-1" />CSV
                    </Button>
                  </div>
                </div>
              )}
              {/* Entry Deadline */}
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  <Calendar className="w-3 h-3 inline mr-1" />Entry Deadline (ET)
                </label>
                <Input
                  type="datetime-local"
                  data-testid={`deadline-${t.slot}`}
                  defaultValue={toEasternInput(t.deadline)}
                  onBlur={e => {
                    const val = e.target.value;
                    if (val) {
                      const isoDate = easternInputToISO(val);
                      if (isoDate !== t.deadline) {
                        updateTournament(t.slot, { deadline: isoDate });
                        toast.success('Deadline updated');
                      }
                    }
                  }}
                  className="h-9 max-w-xs"
                />
                {t.deadline && (
                  <p className="text-xs text-slate-400 mt-1">
                    Current: {new Date(t.deadline).toLocaleString('en-US', {
                      timeZone: 'America/New_York',
                      month: 'short', day: 'numeric', year: 'numeric',
                      hour: 'numeric', minute: '2-digit'
                    })} ET
                  </p>
                )}
              </div>
              {t.golfers?.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t.golfers.length} Golfers</span>
                    {t.golfers[0]?.price && <Badge variant="outline" className="text-[10px]">Prices Set</Badge>}
                    {needsEspnSync(t) && (
                      <Badge variant="outline" className="text-[10px] border-amber-300 text-amber-600">
                        {t.golfers.filter(g => !g.espn_id).length} without ESPN link
                      </Badge>
                    )}
                  </div>
                  <ScrollArea className="h-40">
                    <div className="divide-y divide-slate-50">
                      {t.golfers.slice(0, 50).map((g, i) => (
                        <div key={i} className="flex items-center py-1.5 text-xs px-1">
                          <span className="w-6 font-numbers font-bold text-slate-300">{i + 1}</span>
                          <span className="flex-1 text-slate-700">{g.name}</span>
                          {!g.espn_id && <span className="text-[10px] text-amber-400 mr-2">no ESPN</span>}
                          {g.price && <span className="font-numbers font-bold text-[#2D6A4F]">{fmt(g.price)}</span>}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Upload Players Dialog */}
      <Dialog open={uploadDialog.open} onOpenChange={(open) => { if (!open) setUploadDialog({ open: false, slot: null }); }}>
        <DialogContent className="sm:max-w-lg" data-testid="upload-dialog">
          <DialogHeader>
            <DialogTitle className="font-heading font-bold text-xl">Upload Players & Prices</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-slate-500">
              Paste one player per line. Use name + price format — commas, tabs, or spaces work.
              This replaces any existing player list for this slot.
            </p>
            <p className="text-xs text-slate-400">
              Formats: <code className="bg-slate-100 px-1 rounded">Scottie Scheffler, 300000</code> or{' '}
              <code className="bg-slate-100 px-1 rounded">Scottie Scheffler $300,000</code>
            </p>
            <textarea
              data-testid="upload-textarea"
              value={uploadText}
              onChange={e => setUploadText(e.target.value)}
              placeholder={"Scottie Scheffler, 300000\nRory McIlroy, 250000\nJon Rahm, 200000\n..."}
              className="w-full h-56 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20 focus:border-[#1B4332] resize-none font-mono"
            />
            <Button
              data-testid="upload-submit"
              onClick={submitUpload}
              disabled={actionLoading[`upload_${uploadDialog.slot}`]}
              className="w-full h-10 bg-[#1B4332] text-white hover:bg-[#2D6A4F] font-bold">
              {actionLoading[`upload_${uploadDialog.slot}`] ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-1" />}
              Upload Players
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ESPN Sync Review Dialog */}
      <Dialog open={syncDialog.open} onOpenChange={(open) => { if (!open) setSyncDialog({ open: false, slot: null }); }}>
        <DialogContent className="sm:max-w-2xl h-[90vh] flex flex-col" data-testid="sync-dialog">
          <DialogHeader>
            <DialogTitle className="font-heading font-bold text-xl flex items-center gap-2">
              <Link2 className="w-5 h-5" />Sync to ESPN
            </DialogTitle>
            <p className="text-sm text-slate-500 mt-1">
              Review matches, link unmatched players manually, then confirm.
            </p>
          </DialogHeader>
          <ScrollArea className="flex-1 min-h-0 pr-1">
            <div className="space-y-5 pb-4">

              {/* Matched Players */}
              {syncMatched.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                    Matched ({syncMatched.length})
                  </h4>
                  <div className="space-y-1">
                    {syncMatched.map((m, i) => (
                      <div key={i} className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2 text-xs">
                        <div className="flex-1 min-w-0">
                          <span className="text-slate-700 font-medium">{m.site_name}</span>
                          <span className="text-slate-400 mx-1.5">→</span>
                          <span className="text-[#1B4332] font-medium">{m.espn_name}</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {m.confidence === 'high' && <Badge className="bg-emerald-100 text-emerald-700 text-[10px] px-1.5">exact</Badge>}
                          {m.confidence === 'medium' && <Badge className="bg-amber-100 text-amber-700 text-[10px] px-1.5">⚠ review</Badge>}
                          {m.confidence === 'manual' && <Badge className="bg-blue-100 text-blue-700 text-[10px] px-1.5">manual</Badge>}
                          <button onClick={() => unmatchPair(m)} className="text-slate-300 hover:text-red-400 transition-colors" title="Unmatch">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Unmatched Site Players */}
              {syncUnmatchedSite.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                    Unmatched — Your Players ({syncUnmatchedSite.length})
                  </h4>
                  <div className="space-y-2">
                    {syncUnmatchedSite.map((sp, i) => {
                      const isRemoved = syncRemovals.has(sp.name);
                      return (
                        <div key={i} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs border ${isRemoved ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-100'}`}>
                          <div className="w-32 shrink-0">
                            <span className={`font-medium ${isRemoved ? 'line-through text-slate-400' : 'text-slate-700'}`}>{sp.name}</span>
                            {sp.price && <span className="block text-slate-400 font-numbers">{fmt(sp.price)}</span>}
                          </div>
                          <div className="flex-1 flex items-center gap-2">
                            {!isRemoved ? (
                              <>
                                <Select onValueChange={val => linkSitePlayer(sp.name, sp.price, val)}>
                                  <SelectTrigger className="h-7 text-xs flex-1">
                                    <SelectValue placeholder="Link to ESPN player..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {syncUnmatchedEspn.map(ep => (
                                      <SelectItem key={ep.espn_id} value={ep.espn_id}>{ep.name}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <button onClick={() => toggleRemoval(sp.name)}
                                  className="shrink-0 text-xs text-red-400 hover:text-red-600 underline whitespace-nowrap">
                                  Remove
                                </button>
                              </>
                            ) : (
                              <>
                                <span className="flex-1 text-xs text-red-500 italic">Will be removed from field</span>
                                <button onClick={() => toggleRemoval(sp.name)}
                                  className="shrink-0 text-xs text-slate-400 hover:text-slate-600 underline">
                                  Undo
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Unmatched ESPN Players */}
              {syncUnmatchedEspn.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5 text-blue-500" />
                    ESPN Players Not in Your Field ({syncUnmatchedEspn.length})
                  </h4>
                  <div className="space-y-1">
                    {syncUnmatchedEspn.map((ep, i) => {
                      const isAdding = ep.espn_id in syncEspnAdds;
                      return (
                        <div key={i} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs border ${isAdding ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-100'}`}>
                          <span className="flex-1 text-slate-700">{ep.name}</span>
                          {isAdding && (
                            <div className="flex items-center gap-1 shrink-0">
                              <span className="text-slate-400">$</span>
                              <Input
                                type="number"
                                placeholder="Price"
                                value={syncEspnAdds[ep.espn_id]}
                                onChange={e => setSyncEspnAdds(prev => ({ ...prev, [ep.espn_id]: e.target.value }))}
                                className="h-6 w-24 text-xs px-2"
                              />
                            </div>
                          )}
                          <button
                            onClick={() => toggleEspnAdd(ep.espn_id)}
                            className={`shrink-0 text-xs underline ${isAdding ? 'text-blue-500 hover:text-blue-700' : 'text-slate-400 hover:text-slate-600'}`}>
                            {isAdding ? 'Cancel' : 'Add to field'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {syncMatched.length === 0 && syncUnmatchedSite.length === 0 && syncUnmatchedEspn.length === 0 && (
                <div className="text-center py-8 text-slate-400">
                  <CheckCircle className="w-10 h-10 mx-auto mb-2 text-emerald-400" />
                  <p className="text-sm">All players matched!</p>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Summary + Confirm */}
          <div className="pt-3 border-t border-slate-100 space-y-2">
            {syncUnmatchedSite.filter(s => !syncRemovals.has(s.name)).length > 0 && (
              <p className="text-xs text-amber-600 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                {syncUnmatchedSite.filter(s => !syncRemovals.has(s.name)).length} player(s) will remain without an ESPN link — their scores won't update live.
              </p>
            )}
            <Button onClick={confirmSync} disabled={actionLoading.confirmSync}
              data-testid="sync-confirm-btn"
              className="w-full h-10 bg-[#1B4332] text-white hover:bg-[#2D6A4F] font-bold">
              {actionLoading.confirmSync ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Link2 className="w-4 h-4 mr-1" />}
              Confirm Sync ({syncMatched.length} matched
              {Object.values(syncEspnAdds).filter(p => p && parseInt(p) > 0).length > 0 &&
                `, +${Object.values(syncEspnAdds).filter(p => p && parseInt(p) > 0).length} added`}
              {syncRemovals.size > 0 && `, ${syncRemovals.size} removed`})
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Odds Import Dialog */}
      <Dialog open={oddsDialog.open} onOpenChange={(open) => { if (!open) setOddsDialog({ open: false, slot: null }); }}>
        <DialogContent className="sm:max-w-lg" data-testid="odds-dialog">
          <DialogHeader>
            <DialogTitle className="font-heading font-bold text-xl">Import Odds</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-slate-500">Go to FanDuel, DraftKings, or any sportsbook. Copy the golfer names and their tournament winner odds. Paste below.</p>
            <p className="text-xs text-slate-400">Supported formats: <code className="bg-slate-100 px-1 rounded">Name +450</code> or <code className="bg-slate-100 px-1 rounded">Name, +450</code> or <code className="bg-slate-100 px-1 rounded">Name{'\t'}4.50</code></p>
            <textarea data-testid="odds-textarea" value={oddsText} onChange={e => setOddsText(e.target.value)}
              placeholder={"Scottie Scheffler +450\nRory McIlroy +800\nJon Rahm +1200\n..."}
              className="w-full h-48 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20 focus:border-[#1B4332] resize-none" />
            <Button data-testid="odds-submit" onClick={submitOdds} disabled={actionLoading[`odds_${oddsDialog.slot}`]}
              className="w-full h-10 bg-[#1B4332] text-white hover:bg-[#2D6A4F] font-bold">
              {actionLoading[`odds_${oddsDialog.slot}`] ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <DollarSign className="w-4 h-4 mr-1" />}
              Import & Set Prices
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Teams Dialog */}
      <Dialog open={teamsDialog.open} onOpenChange={(open) => { if (!open) { setTeamsDialog({ open: false, tournament: null, teams: [] }); setEditingTeam(null); setEditGolfers([]); } }}>
        <DialogContent className="sm:max-w-2xl h-[85vh] flex flex-col" data-testid="teams-dialog">
          <DialogHeader>
            <div className="flex items-center justify-between pr-8">
              <DialogTitle className="font-heading font-bold text-xl">
                {teamsDialog.tournament?.name} - Teams ({teamsDialog.teams.length})
              </DialogTitle>
              {!editingTeam && teamsDialog.teams.length > 0 && (
                <Button size="sm" variant="outline" onClick={exportEmails}
                  className="h-8 px-3 text-xs font-bold flex items-center gap-1.5 border-[#1B4332] text-[#1B4332] hover:bg-[#1B4332] hover:text-white">
                  <Mail className="w-3.5 h-3.5" />Export Emails
                </Button>
              )}
            </div>
          </DialogHeader>

          {editingTeam ? (
            <div className="flex-1 overflow-auto">
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-sm">Editing: {editingTeam.user_name} #{editingTeam.team_number}</h4>
                  <Button size="sm" variant="ghost" onClick={() => { setEditingTeam(null); setEditGolfers([]); }}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className="bg-slate-50 rounded-lg p-3 space-y-2 mb-4">
                  <p className="text-xs text-slate-500 font-semibold uppercase">Current Team ({editGolfers.length}/5)</p>
                  {editGolfers.map((g, i) => (
                    <div key={i} className="flex items-center justify-between bg-white rounded px-2 py-1">
                      <span className="text-sm">{g.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-numbers text-[#2D6A4F]">{fmt(g.price)}</span>
                        <button onClick={() => removeGolferFromEdit(i)} className="text-red-400 hover:text-red-600">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {editGolfers.length < 5 && (
                    <p className="text-xs text-slate-400 italic">Select {5 - editGolfers.length} more golfer(s) below</p>
                  )}
                </div>
                <p className="text-xs text-slate-500 font-semibold uppercase mb-2">Available Golfers</p>
                <ScrollArea className="h-48">
                  <div className="space-y-1">
                    {teamsDialog.tournament?.golfers?.filter(g => g.price).map((g, i) => {
                      const onTeam = editGolfers.some(eg => eg.name === g.name);
                      return (
                        <div key={i} className={`flex items-center justify-between px-2 py-1 rounded ${onTeam ? 'bg-green-50' : 'hover:bg-slate-50'}`}>
                          <span className={`text-sm ${onTeam ? 'text-green-700 font-medium' : ''}`}>{g.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-numbers text-[#2D6A4F]">{fmt(g.price)}</span>
                            {!onTeam && (
                              <Button size="sm" variant="ghost" className="h-6 px-2" onClick={() => addGolferToEdit(g)}>
                                Add
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
                <Button onClick={saveEditedTeam} disabled={editGolfers.length !== 5 || actionLoading.saveEdit}
                  className="w-full mt-4 bg-[#1B4332] text-white hover:bg-[#2D6A4F]">
                  {actionLoading.saveEdit ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Save Changes
                </Button>
              </div>
            </div>
          ) : (
            <ScrollArea className="flex-1 min-h-0">
              {teamsDialog.teams.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <Users className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p>No teams entered yet</p>
                </div>
              ) : (
                <div className="space-y-3 pr-2">
                  {teamsDialog.teams.map(team => (
                    <div key={team.id} className="bg-slate-50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <span className="font-bold text-sm text-[#0F172A]">{team.user_name} #{team.team_number}</span>
                          <span className="text-xs text-slate-400 ml-2">{team.user_email}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => togglePaid(team.id, team.paid)}
                            className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold border transition-colors ${
                              team.paid
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                : 'bg-red-50 text-red-500 border-red-200 hover:bg-red-100'
                            }`}
                            title={team.paid ? 'Mark as unpaid' : 'Mark as paid'}
                          >
                            {team.paid ? '✓ Paid' : '✗ Unpaid'}
                          </button>
                          <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => startEditTeam(team)} data-testid={`edit-team-${team.id}`}>
                            <Pencil className="w-3.5 h-3.5 mr-1" />Edit
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 px-2 text-red-500 hover:text-red-700" onClick={() => deleteTeam(team.id)} data-testid={`delete-team-${team.id}`}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-1">
                        {team.golfers.map((g, i) => {
                          const isOut = activePlayerNames.size > 0 && !activePlayerNames.has(g.name);
                          return (
                            <div key={i} className="flex items-center text-xs">
                              <span className="w-5 text-slate-400">{i + 1}.</span>
                              <span className={`flex-1 ${isOut ? 'font-bold text-red-600' : 'text-slate-700'}`}>
                                {g.name}
                                {isOut && <span className="ml-1.5 text-xs font-normal text-red-500">· Not in field</span>}
                              </span>
                              <span className="font-numbers text-[#2D6A4F]">{fmt(g.price)}</span>
                            </div>
                          );
                        })}
                      </div>
                      <div className="mt-2 pt-2 border-t border-slate-200 flex justify-between text-xs">
                        <span className="text-slate-400">Total Cost:</span>
                        <span className="font-numbers font-bold text-[#1B4332]">{fmt(team.total_cost)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {/* Field Stats Modal */}
      <StatsModal
        open={statsDialog.open}
        tournament={statsDialog.tournament}
        teams={statsDialog.teams}
        onClose={() => setStatsDialog({ open: false, tournament: null, teams: [] })}
      />
    </div>
  );
}
