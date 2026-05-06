import { useState } from 'react';
import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import { 
  Home, BookOpen, Target, Trophy, Settings, 
  Users, Shield, LogOut, Menu, Bell, User,
  ChevronRight, LayoutDashboard, Database, Activity, Upload
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { supabase } from '../../lib/supabase';
import { AIChatButton } from '../ai/AIChatButton';
import { AIChatPanel } from '../ai/AIChatPanel';

// ─── Sidebar ──────────────────────────────────────────────────────────────────
export const Sidebar = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const { profile } = useAuthStore();
  const role = profile?.role || 'student';

  const menuItems: any = {
    student: [
      { name: 'Dashboard', path: '/dashboard', icon: Home },
      { name: 'Learning', path: '/learning', icon: BookOpen },
      { name: 'Quiz', path: '/quiz', icon: Target },
      { name: 'Tryout', path: '/tryout', icon: Trophy },
    ],
    teacher: [
      { name: 'Dashboard', path: '/teacher', icon: LayoutDashboard },
      { name: 'Classes', path: '/teacher/classes', icon: Users },
      { name: 'Quizzes', path: '/teacher/quizzes', icon: BookOpen },
    ],
    admin: [
      { name: 'Dashboard', path: '/admin', icon: Shield },
      { name: 'Upload JSON', path: '/admin/upload', icon: Database },
      { name: 'Users', path: '/admin/users', icon: Users },
    ],
    super_admin: [
      { name: 'Overview', path: '/super-admin', icon: Shield },
      { name: 'Upload Curriculum', path: '/super-admin/upload', icon: Upload },
      { name: 'System', path: '/super-admin/settings', icon: Settings },
      { name: 'Audit Logs', path: '/super-admin/audit', icon: Activity },
      { name: 'User Control', path: '/super-admin/users', icon: Users },
    ]
  };

  const currentMenu = menuItems[role] || menuItems.student;

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden" onClick={onClose} />
      )}
      
      <aside className={`fixed top-0 left-0 bottom-0 w-64 bg-indigo-700 text-white z-50 transition-transform duration-300 transform lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="h-16 flex items-center px-6 border-b border-indigo-600/50">
            <span className="text-xl font-black tracking-tight flex items-center gap-2">
              <BookOpen className="text-amber-400" /> LMS<span className="text-amber-400">PRO</span>
            </span>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {currentMenu.map((item: any) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => window.innerWidth < 1024 && onClose()}
                className={({ isActive }) => `
                  flex items-center gap-3 px-4 py-3 rounded-xl transition-all
                  ${isActive ? 'bg-white/10 text-white font-bold' : 'text-indigo-100 hover:bg-white/5 hover:text-white'}
                `}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.name}</span>
                {window.location.pathname === item.path && <ChevronRight className="w-4 h-4 ml-auto" />}
              </NavLink>
            ))}
          </nav>

          <div className="p-4 border-t border-indigo-600/50">
            <div className="bg-indigo-800/50 rounded-xl p-4 mb-4">
              <p className="text-[10px] text-indigo-300 uppercase font-bold tracking-widest mb-1">XP Points</p>
              <div className="flex items-center justify-between font-bold">
                <span>{profile?.total_xp || 0}</span>
                <Trophy className="w-4 h-4 text-amber-400" />
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

// ─── Header ───────────────────────────────────────────────────────────────────
export const Header = ({ onMenuClick }: { onMenuClick: () => void }) => {
  const { profile, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Supabase signout error:', err);
    } finally {
      logout();
      navigate('/login', { replace: true });
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 px-4 sm:px-8 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button onClick={onMenuClick} className="lg:hidden p-2 hover:bg-slate-100 rounded-lg text-slate-500">
          <Menu className="w-6 h-6" />
        </button>
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest hidden sm:block">
          {window.location.pathname.split('/').pop()?.replace('-', ' ') || 'Overview'}
        </h2>
      </div>

      <div className="flex items-center gap-4">
        <button className="p-2 text-slate-400 hover:text-primary transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
        </button>
        
        <div className="h-8 w-px bg-slate-200 mx-2" />

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-slate-900 leading-tight">{profile?.full_name}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{profile?.role}</p>
          </div>
          <div 
            onClick={() => navigate('/profile')}
            className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold border-2 border-white shadow-sm overflow-hidden cursor-pointer hover:ring-2 hover:ring-indigo-500 transition-all"
          >
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              profile?.full_name?.charAt(0) || <User className="w-5 h-5" />
            )}
          </div>
          <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-rose-500 transition-colors">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};

// ─── DashboardLayout ──────────────────────────────────────────────────────────
export const DashboardLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { profile } = useAuthStore();
  const role = profile?.role || 'student';

  const menuItems: any = {
    student: [
      { name: 'Dashboard', path: '/dashboard', icon: Home },
      { name: 'Learning', path: '/learning', icon: BookOpen },
      { name: 'Quiz', path: '/quiz', icon: Target },
      { name: 'Tryout', path: '/tryout', icon: Trophy },
    ],
    teacher: [
      { name: 'Dashboard', path: '/teacher', icon: LayoutDashboard },
      { name: 'Classes', path: '/teacher/classes', icon: Users },
      { name: 'Quizzes', path: '/teacher/quizzes', icon: BookOpen },
    ],
    admin: [
      { name: 'Dashboard', path: '/admin', icon: Shield },
      { name: 'Upload JSON', path: '/admin/upload', icon: Database },
      { name: 'Users', path: '/admin/users', icon: Users },
    ],
    super_admin: [
      { name: 'Overview', path: '/super-admin', icon: Shield },
      { name: 'Upload Curriculum', path: '/super-admin/upload', icon: Upload },
      { name: 'System', path: '/super-admin/settings', icon: Settings },
      { name: 'Audit Logs', path: '/super-admin/audit', icon: Activity },
      { name: 'User Control', path: '/super-admin/users', icon: Users },
    ]
  };

  const currentMenu = menuItems[role] || menuItems.student;

  return (
    <div className="min-h-screen bg-slate-50 flex pb-20 lg:pb-0"> {/* Added pb-20 for mobile bottom nav */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="flex-1 flex flex-col lg:pl-64">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />
        <main className="flex-1 p-4 sm:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Outlet />
        </main>
      </div>

      {/* AI Tutor Integration */}
      <AIChatButton />
      <AIChatPanel />

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-40 flex justify-around items-center px-2 pt-2 pb-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        {currentMenu.slice(0, 5).map((item: any) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `
              flex flex-col items-center justify-center w-full py-2 gap-1 rounded-xl transition-all
              ${isActive ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}
            `}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-[10px] font-bold tracking-tight">{item.name}</span>
          </NavLink>
        ))}
      </div>
    </div>
  );
};
