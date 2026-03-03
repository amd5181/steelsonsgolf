import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Home, Users, BarChart2, BookOpen, Settings, UserCog, Trophy, LogIn } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/tooltip';
import { useAuth } from '../App';
import { useState } from 'react';
import ProfileModal from './ProfileModal';
import AuthModal from './AuthModal';

const NAV_ITEMS = [
  { path: '/home',        icon: Home,     label: 'Home',        shortLabel: null },
  { path: '/teams',       icon: Users,    label: 'My Teams',    shortLabel: 'Teams' },
  { path: '/leaderboard', icon: BarChart2, label: 'Leaderboard', shortLabel: 'Scores' },
  { path: '/legacy',      icon: Trophy,   label: 'Legacy',      shortLabel: 'Legacy' },
  { path: '/rules',       icon: BookOpen, label: 'Rules',       shortLabel: 'Rules' },
];

export default function Layout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [profileOpen, setProfileOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  const allItems = user?.is_admin
    ? [...NAV_ITEMS, { path: '/admin', icon: Settings, label: 'Admin', shortLabel: 'Admin' }]
    : NAV_ITEMS;

  return (
    <TooltipProvider delayDuration={200}>
      <div className="min-h-dvh bg-background pt-16">

        <header className="fixed top-0 left-0 right-0 z-50 glass shadow-sm h-16 flex items-center px-3 min-[860px]:px-6" data-testid="top-nav">

          {/* Logo — always navigates home */}
          <div className="flex items-center gap-2 cursor-pointer flex-shrink-0" onClick={() => navigate('/home')}>
            <img
              src="https://res.cloudinary.com/dsvpfi9te/image/upload/v1771700941/ChatGPT_Image_Feb_21_2026_02_07_41_PM_kzc10a.png"
              alt="Steel Sons Golf"
              className="h-8 w-8 min-[860px]:h-10 min-[860px]:w-10 object-contain"
            />
            {/* Hide tagline below 860px — logo is enough */}
            <div className="hidden min-[860px]:flex flex-col leading-none">
              <span className="text-[10px] font-bold text-[#1B4332] tracking-wider">BLAST FURNACE</span>
              <span className="text-[10px] font-bold text-[#1B4332] tracking-wider">OF CHAMPIONS</span>
            </div>
          </div>

          {/* ── Desktop nav (860px+): icon + label, horizontal ── */}
          <nav className="hidden min-[860px]:flex items-center gap-0.5 ml-auto">
            {allItems.map(item => {
              const active = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  data-testid={`nav-${item.label.toLowerCase().replace(/\s/g, '-')}`}
                  onClick={() => navigate(item.path)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all ${
                    active ? 'bg-[#1B4332] text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <item.icon className={`w-4 h-4 flex-shrink-0 ${active ? 'stroke-[2.5]' : ''}`} />
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              );
            })}

            <div className="w-px h-5 bg-slate-200 mx-1" />

            {user ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button data-testid="nav-profile" onClick={() => setProfileOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-all">
                    <UserCog className="w-4 h-4" />
                    <span className="text-sm font-medium">{user.name?.split(' ')[0]}</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent>Profile & Log Out</TooltipContent>
              </Tooltip>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button data-testid="nav-signin" onClick={() => setAuthOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#1B4332] text-white hover:bg-[#2D6A4F] transition-all">
                    <LogIn className="w-4 h-4" />
                    <span className="text-sm font-medium">Sign In</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent>Sign In / Create Account</TooltipContent>
              </Tooltip>
            )}
          </nav>

          {/* ── Mobile nav (<860px): icon + tiny label, no Home (logo = home) ── */}
          <nav className="flex min-[860px]:hidden items-center ml-auto">
            {allItems.filter(item => item.path !== '/home').map(item => {
              const active = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  data-testid={`nav-${item.label.toLowerCase().replace(/\s/g, '-')}`}
                  onClick={() => navigate(item.path)}
                  className={`flex flex-col items-center justify-center gap-0.5 px-2.5 py-1.5 rounded-xl transition-all ${
                    active ? 'bg-[#1B4332] text-white' : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  <item.icon className={`w-4 h-4 flex-shrink-0 ${active ? 'stroke-[2.5]' : ''}`} />
                  <span className="text-[9px] font-semibold leading-none">{item.shortLabel}</span>
                </button>
              );
            })}

            <div className="w-px h-5 bg-slate-200 mx-1" />

            {user ? (
              <button data-testid="nav-profile" onClick={() => setProfileOpen(true)}
                className="flex flex-col items-center justify-center gap-0.5 px-2.5 py-1.5 rounded-xl text-slate-500 hover:bg-slate-100 transition-all">
                <UserCog className="w-4 h-4" />
                <span className="text-[9px] font-semibold leading-none">Profile</span>
              </button>
            ) : (
              <button data-testid="nav-signin" onClick={() => setAuthOpen(true)}
                className="flex flex-col items-center justify-center gap-0.5 px-2.5 py-1.5 rounded-xl bg-[#1B4332] text-white hover:bg-[#2D6A4F] transition-all">
                <LogIn className="w-4 h-4" />
                <span className="text-[9px] font-semibold leading-none">Sign In</span>
              </button>
            )}
          </nav>
        </header>

        <main>
          <Outlet />
        </main>
      </div>

      {user && <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} />}
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </TooltipProvider>
  );
}