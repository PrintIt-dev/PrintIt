import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import OfflineBanner from '../components/ui/OfflineBanner';
import ThemeToggle from '../components/ui/ThemeToggle';

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { name: 'Dashboard & Sales', path: '/dashboard', icon: 'dashboard', end: true },
    { name: 'Add Shop', path: '/dashboard/shops/add', icon: 'add_business' },
    { name: 'Master Catalog', path: '/dashboard/catalog', icon: 'menu_book' },
    { name: 'Payouts & Ledger', path: '/dashboard/payouts', icon: 'account_balance_wallet' },
    { name: 'Support Tickets', path: '/dashboard/support', icon: 'support_agent' },
    { name: 'Compliance', path: '/dashboard/legal', icon: 'policy' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = (name) => {
    if (!name) return 'SA';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background text-on-background font-body-md">
      <OfflineBanner />

      {/* Top Navigation Bar */}
      <header className="h-16 px-4 sm:px-6 lg:px-8 bg-surface/85 backdrop-blur-md border-b border-outline-variant/30 sticky top-0 z-40 flex items-center justify-between shrink-0 shadow-xs">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/dashboard')}>
            <img src="/logo_cropped.png" alt="PrintIt Logo" className="w-8 h-8 object-contain rounded-lg shadow-xs" />
            <span className="font-bold text-lg text-primary tracking-tight">
              PrintIt
            </span>
          </div>
          <span className="hidden sm:inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
            Admin
          </span>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden xl:flex items-center gap-1.5 bg-surface-container-high/60 p-1 rounded-2xl border border-outline-variant/25">
          {navItems.map(item => (
            <NavLink 
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) => `flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                isActive 
                  ? 'bg-primary text-on-primary shadow-xs font-bold' 
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-variant'
              }`}
            >
              <span className="material-symbols-outlined text-[17px]">{item.icon}</span>
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>

        {/* User & Controls */}
        <div className="flex items-center gap-3">
          <ThemeToggle />

          {/* Admin Avatar Profile */}
          <div className="hidden sm:flex items-center gap-2.5 pl-3 border-l border-outline-variant/30">
            <div className="w-8 h-8 rounded-full bg-primary/15 text-primary border border-primary/30 flex items-center justify-center font-bold text-xs font-mono shadow-xs">
              {getInitials(user?.full_name)}
            </div>
            <div className="text-left hidden md:block">
              <p className="text-xs font-bold text-on-surface leading-tight">{user?.full_name || 'System Admin'}</p>
              <p className="text-[10px] text-on-surface-variant leading-none mt-0.5">Administrator</p>
            </div>
          </div>

          {/* Logout Button */}
          <button 
            onClick={handleLogout}
            title="Log out of admin session"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-rose-500 hover:text-rose-600 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">logout</span>
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Main Page Content */}
      <main className="flex-1 overflow-y-auto bg-background">
        <Outlet />
      </main>

      {/* Mobile & Tablet Bottom Navigation Bar */}
      <footer className="xl:hidden flex items-center justify-around px-2 py-2 bg-surface/95 backdrop-blur-md border-t border-outline-variant/30 overflow-x-auto shrink-0 shadow-lg">
        {navItems.map(item => (
          <NavLink 
            key={item.path}
            to={item.path}
            end={item.end}
            className={({ isActive }) => `flex flex-col items-center justify-center px-3 py-1 rounded-xl transition-all font-semibold ${
              isActive 
                ? 'text-primary font-bold' 
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
            <span className="text-[10px] mt-0.5 whitespace-nowrap">{item.name}</span>
          </NavLink>
        ))}
      </footer>
    </div>
  );
};

export default DashboardLayout;
