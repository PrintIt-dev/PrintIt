import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../core/api';

const DashboardOverview = () => {
  const [shops, setShops] = useState([]);
  const [platform, setPlatform] = useState({ today: { orders: 0, completed: 0, revenue: 0 }, allTime: { orders: 0, completed: 0, revenue: 0 } });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [lastUpdated, setLastUpdated] = useState(null);
  const navigate = useNavigate();

  const fetchDailySales = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/admin/payouts/daily-sales');
      const data = res.data;
      setShops(data.shops || []);
      setPlatform(data.platform || { today: { orders: 0, completed: 0, revenue: 0 }, allTime: { orders: 0, completed: 0, revenue: 0 } });
      setLastUpdated(new Date());
    } catch (err) {
      console.warn('Failed to fetch daily sales, trying fallback:', err);
      // Fallback: try loading from public shops at least
      try {
        const publicRes = await api.get('/public/shops');
        const publicShops = publicRes.data?.shops || publicRes.data || [];
        setShops(publicShops.map(s => ({
          shop_id: s.shop_id,
          name: s.name,
          shop_code: s.shop_code,
          is_open: s.is_open,
          address: s.address,
          price_bw: s.price_bw,
          price_color: s.price_color,
          owner_name: s.owner_name || 'Partner',
          owner_phone: s.phone || 'N/A',
          today: { orders: 0, completed: 0, queued: 0, cancelled: 0, revenue: 0 },
          allTime: { orders: 0, completed: 0, revenue: 0 },
        })));
        setLastUpdated(new Date());
      } catch (fallbackErr) {
        console.warn('Fallback also failed:', fallbackErr);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDailySales();
  }, []);

  // Filtered shops
  const filteredShops = shops.filter((shop) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      shop.name?.toLowerCase().includes(query) ||
      (shop.shop_code && shop.shop_code.toLowerCase().includes(query)) ||
      (shop.owner_phone && shop.owner_phone.includes(query)) ||
      (shop.address && shop.address.toLowerCase().includes(query));

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'open' && shop.is_open) ||
      (statusFilter === 'closed' && !shop.is_open);

    return matchesSearch && matchesStatus;
  });

  const activeShopsCount = shops.filter(s => s.is_open).length;

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-primary text-2xl">dashboard</span>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-on-surface">Daily Sales Dashboard</h1>
          </div>
          <p className="text-xs sm:text-sm text-on-surface-variant">
            Today's orders completed by each shop — all payments are Cash-on-Delivery (COD).
            {lastUpdated && (
              <span className="ml-2 text-on-surface-variant/60">
                Updated {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchDailySales}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-surface-container-high hover:bg-surface-variant text-on-surface border border-outline-variant/40 transition-colors shadow-xs"
          >
            <span className={`material-symbols-outlined text-[16px] ${isLoading ? 'animate-spin' : ''}`}>refresh</span>
            <span>Refresh</span>
          </button>

          <button
            onClick={() => navigate('/dashboard/shops/add')}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-primary hover:bg-primary/90 text-on-primary shadow-sm transition-all hover:-translate-y-0.5"
          >
            <span className="material-symbols-outlined text-[18px]">add_business</span>
            <span>Onboard New Shop</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Today's Orders */}
        <div className="bg-surface-container border border-outline-variant/30 p-5 rounded-2xl shadow-xs space-y-2 hover:border-primary/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Today's Orders</span>
            <span className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center material-symbols-outlined text-[20px]">
              receipt_long
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold font-mono text-primary">
            {platform.today.orders}
          </p>
          <div className="flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="text-on-surface-variant">{platform.today.completed} collected</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span className="text-on-surface-variant">{platform.today.orders - platform.today.completed} in queue</span>
            </span>
          </div>
        </div>

        {/* Today's Revenue (COD) */}
        <div className="bg-surface-container border border-outline-variant/30 p-5 rounded-2xl shadow-xs space-y-2 hover:border-primary/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Today's Revenue (COD)</span>
            <span className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center material-symbols-outlined text-[20px]">
              payments
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold font-mono text-emerald-500">
            ₹{platform.today.revenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-on-surface-variant">Cash collected at counter today</p>
        </div>

        {/* Active Print Shops */}
        <div className="bg-surface-container border border-outline-variant/30 p-5 rounded-2xl shadow-xs space-y-2 hover:border-primary/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Active Print Shops</span>
            <span className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center material-symbols-outlined text-[20px]">
              storefront
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold font-mono text-on-surface">
            {activeShopsCount} <span className="text-sm font-normal text-on-surface-variant">/ {shops.length} total</span>
          </p>
          <div className="flex items-center gap-2 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="text-on-surface-variant">{activeShopsCount} online & accepting orders</span>
          </div>
        </div>

        {/* All-Time Stats */}
        <div className="bg-surface-container border border-outline-variant/30 p-5 rounded-2xl shadow-xs space-y-2 hover:border-primary/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">All-Time Orders</span>
            <span className="w-8 h-8 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center material-symbols-outlined text-[20px]">
              trending_up
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold font-mono text-on-surface">
            {platform.allTime.orders}
          </p>
          <p className="text-[11px] text-on-surface-variant">
            {platform.allTime.completed} completed &middot; ₹{platform.allTime.revenue.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} total
          </p>
        </div>
      </div>

      {/* Main Section: Shop-wise Daily Sales Breakdown */}
      <div className="bg-surface-container border border-outline-variant/30 rounded-2xl shadow-xs overflow-hidden">
        {/* Table Filters & Toolbar */}
        <div className="p-4 sm:p-5 border-b border-outline-variant/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">analytics</span>
              <span>Shop-wise Daily Sales</span>
            </h2>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Orders received and completed today per shop — COD-based revenue
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            {/* Search Box */}
            <div className="relative min-w-[240px]">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
                search
              </span>
              <input
                type="text"
                placeholder="Search by shop, code, phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-surface-container-high border border-outline-variant/40 rounded-xl pl-9 pr-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            {/* Status Filter */}
            <div className="flex bg-surface-container-high p-1 rounded-xl border border-outline-variant/30">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                  statusFilter === 'all'
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter('open')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                  statusFilter === 'open'
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Open
              </button>
              <button
                onClick={() => setStatusFilter('closed')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                  statusFilter === 'closed'
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Closed
              </button>
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-12 text-center text-on-surface-variant space-y-2">
              <span className="material-symbols-outlined animate-spin text-3xl text-primary">autorenew</span>
              <p className="text-xs">Loading daily sales data...</p>
            </div>
          ) : filteredShops.length === 0 ? (
            <div className="p-12 text-center text-on-surface-variant space-y-2">
              <span className="material-symbols-outlined text-4xl opacity-40">storefront</span>
              <p className="text-sm font-semibold">No print shops match your filter criteria.</p>
              <p className="text-xs opacity-75">Try clearing the search query or status filter.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-surface-container-high/60 border-b border-outline-variant/30 text-[11px] uppercase tracking-wider text-on-surface-variant font-bold">
                  <th className="p-4">Shop Details</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-center">
                    <div className="flex flex-col items-center">
                      <span>Today's</span>
                      <span>Orders</span>
                    </div>
                  </th>
                  <th className="p-4 text-center">
                    <div className="flex flex-col items-center">
                      <span>Completed</span>
                      <span>(Collected)</span>
                    </div>
                  </th>
                  <th className="p-4 text-center">
                    <div className="flex flex-col items-center">
                      <span>In</span>
                      <span>Queue</span>
                    </div>
                  </th>
                  <th className="p-4 text-right">Today's Revenue</th>
                  <th className="p-4 text-right">All-Time Orders</th>
                  <th className="p-4 text-right">All-Time Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {filteredShops.map((shop) => {
                  const today = shop.today || { orders: 0, completed: 0, queued: 0, cancelled: 0, revenue: 0 };
                  const allTime = shop.allTime || { orders: 0, completed: 0, revenue: 0 };
                  const completionRate = today.orders > 0 ? Math.round((today.completed / today.orders) * 100) : 0;

                  return (
                    <tr key={shop.shop_id} className="hover:bg-surface-bright/50 transition-colors">
                      {/* Shop Details */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold border border-primary/20">
                            <span className="material-symbols-outlined text-xl">store</span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-on-surface text-sm">{shop.name}</span>
                              {shop.shop_code && (
                                <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-surface-container-high text-primary border border-primary/25">
                                  {shop.shop_code}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-on-surface-variant mt-0.5">
                              {shop.owner_name} &middot; {shop.address || 'Campus Location'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                            shop.is_open
                              ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30'
                              : 'bg-rose-500/15 text-rose-500 border-rose-500/30'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${shop.is_open ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                          <span>{shop.is_open ? 'Open' : 'Closed'}</span>
                        </span>
                      </td>

                      {/* Today's Orders */}
                      <td className="p-4 text-center">
                        <div className="flex flex-col items-center">
                          <span className={`font-mono font-bold text-lg ${today.orders > 0 ? 'text-primary' : 'text-on-surface-variant/50'}`}>
                            {today.orders}
                          </span>
                          {today.cancelled > 0 && (
                            <span className="text-[10px] text-rose-400 font-medium">{today.cancelled} cancelled</span>
                          )}
                        </div>
                      </td>

                      {/* Completed (Collected) */}
                      <td className="p-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className={`font-mono font-bold text-lg ${today.completed > 0 ? 'text-emerald-500' : 'text-on-surface-variant/50'}`}>
                            {today.completed}
                          </span>
                          {today.orders > 0 && (
                            <div className="w-16 h-1.5 rounded-full bg-surface-container-high overflow-hidden">
                              <div
                                className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                                style={{ width: `${completionRate}%` }}
                              ></div>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* In Queue */}
                      <td className="p-4 text-center">
                        <span className={`font-mono font-bold text-lg ${(today.queued || 0) > 0 ? 'text-amber-400' : 'text-on-surface-variant/50'}`}>
                          {today.queued || 0}
                        </span>
                      </td>

                      {/* Today's Revenue */}
                      <td className="p-4 text-right">
                        <span className={`font-mono font-bold text-sm ${today.revenue > 0 ? 'text-emerald-500' : 'text-on-surface-variant/40'}`}>
                          ₹{today.revenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <p className="text-[10px] text-on-surface-variant/60 mt-0.5">COD</p>
                      </td>

                      {/* All-Time Orders */}
                      <td className="p-4 text-right">
                        <span className="font-mono font-bold text-sm text-on-surface">
                          {allTime.orders}
                        </span>
                        <p className="text-[10px] text-on-surface-variant/60 mt-0.5">
                          {allTime.completed} collected
                        </p>
                      </td>

                      {/* All-Time Revenue */}
                      <td className="p-4 text-right">
                        <span className="font-mono text-xs text-on-surface-variant">
                          ₹{allTime.revenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* Table footer with totals */}
              <tfoot>
                <tr className="bg-surface-container-high/40 border-t-2 border-outline-variant/40 text-xs font-bold">
                  <td className="p-4 text-on-surface" colSpan={2}>
                    <span className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-[16px]">functions</span>
                      Platform Totals
                    </span>
                  </td>
                  <td className="p-4 text-center font-mono text-primary text-lg">{platform.today.orders}</td>
                  <td className="p-4 text-center font-mono text-emerald-500 text-lg">{platform.today.completed}</td>
                  <td className="p-4 text-center font-mono text-amber-400 text-lg">{platform.today.orders - platform.today.completed}</td>
                  <td className="p-4 text-right font-mono text-emerald-500">
                    ₹{platform.today.revenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="p-4 text-right font-mono text-on-surface">{platform.allTime.orders}</td>
                  <td className="p-4 text-right font-mono text-on-surface-variant">
                    ₹{platform.allTime.revenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          onClick={() => navigate('/dashboard/payouts')}
          className="bg-surface-container border border-outline-variant/30 p-4 rounded-2xl shadow-xs hover:border-primary/40 transition-colors text-left group"
        >
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center material-symbols-outlined text-xl group-hover:scale-110 transition-transform">
              account_balance
            </span>
            <div>
              <p className="font-bold text-sm text-on-surface">Payout Queue</p>
              <p className="text-[11px] text-on-surface-variant">Review withdrawals & settlements</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => navigate('/dashboard/catalog')}
          className="bg-surface-container border border-outline-variant/30 p-4 rounded-2xl shadow-xs hover:border-primary/40 transition-colors text-left group"
        >
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center material-symbols-outlined text-xl group-hover:scale-110 transition-transform">
              menu_book
            </span>
            <div>
              <p className="font-bold text-sm text-on-surface">Product Catalog</p>
              <p className="text-[11px] text-on-surface-variant">Manage master books & manuals</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => navigate('/dashboard/support')}
          className="bg-surface-container border border-outline-variant/30 p-4 rounded-2xl shadow-xs hover:border-primary/40 transition-colors text-left group"
        >
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center material-symbols-outlined text-xl group-hover:scale-110 transition-transform">
              support_agent
            </span>
            <div>
              <p className="font-bold text-sm text-on-surface">Support Tickets</p>
              <p className="text-[11px] text-on-surface-variant">View and resolve customer issues</p>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
};

export default DashboardOverview;
