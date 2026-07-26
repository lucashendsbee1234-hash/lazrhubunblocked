import React, { useState, useEffect, useMemo } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Eye,
  Gamepad2,
  Clock,
  Activity,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Search,
  Globe,
  Monitor,
  Share2,
  DollarSign,
  Printer,
  FileSpreadsheet,
  FileJson,
  Star,
  EyeOff,
  Bell,
  RefreshCw,
  SlidersHorizontal,
  Flame,
  Radio,
  Layers,
  ArrowUpRight,
  Shield,
  Zap,
  ExternalLink,
  Edit3,
  PieChart as PieIcon,
  BarChart3,
  Inbox,
} from 'lucide-react';
import { subscribeToRealAnalyticsData } from '../utils/analyticsTracker';

export const AnalyticsDashboard = ({
  games = [],
  categories = [],
  currentUser,
  onOpenGame,
  onEditGame,
  onToggleFeatured,
  onDeleteGame,
}) => {
  // ----------------------------------------------------
  // Real Analytics State (Connected to Firestore)
  // ----------------------------------------------------
  const [realtimeData, setRealtimeData] = useState({
    analyticsEvents: [],
    activeSessions: [],
    adminLogs: [],
    searchEvents: [],
  });

  const [timeRange, setTimeRange] = useState('7d'); // '24h', '7d', '30d', '90d', '1y', 'all'
  const [chartType, setChartType] = useState('area'); // 'area', 'bar', 'line'
  const [searchFilter, setSearchFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  
  const [healthScanProgress, setHealthScanProgress] = useState(null);
  const [healthScanResults, setHealthScanResults] = useState({});
  const [isScanning, setIsScanning] = useState(false);
  const [exportNotice, setExportNotice] = useState('');
  const [showCustomizer, setShowCustomizer] = useState(false);

  // Widget Customization Visibility State
  const [widgetVisibility, setWidgetVisibility] = useState({
    kpis: true,
    alerts: true,
    traffic: true,
    topGames: true,
    categories: true,
    realtime: true,
    search: true,
    health: true,
    visitors: true,
    geo: true,
    devices: true,
    referrals: true,
    revenue: false,
    adminLog: true,
  });

  // ----------------------------------------------------
  // Subscribe to Real Firestore Telemetry
  // ----------------------------------------------------
  useEffect(() => {
    const unsubscribe = subscribeToRealAnalyticsData((data) => {
      setRealtimeData(data);
    });
    return () => unsubscribe();
  }, []);

  // ----------------------------------------------------
  // Time-Filtered Real Events Processing
  // ----------------------------------------------------
  const timeFilteredEvents = useMemo(() => {
    const events = realtimeData.analyticsEvents || [];
    if (events.length === 0) return [];

    const now = Date.now();
    let durationMs = Infinity;

    if (timeRange === '24h') durationMs = 24 * 60 * 60 * 1000;
    else if (timeRange === '7d') durationMs = 7 * 24 * 60 * 60 * 1000;
    else if (timeRange === '30d') durationMs = 30 * 24 * 60 * 60 * 1000;
    else if (timeRange === '90d') durationMs = 90 * 24 * 60 * 60 * 1000;
    else if (timeRange === '1y') durationMs = 365 * 24 * 60 * 60 * 1000;

    if (durationMs === Infinity) return events;

    return events.filter((ev) => {
      if (!ev.timestamp) return false;
      const evTime = new Date(ev.timestamp).getTime();
      return now - evTime <= durationMs;
    });
  }, [realtimeData.analyticsEvents, timeRange]);

  // Real Metric Calculations
  const realPageViews = useMemo(() => {
    return timeFilteredEvents.filter((e) => e.type === 'page_view').length;
  }, [timeFilteredEvents]);

  const realUniqueVisitors = useMemo(() => {
    const sessionSet = new Set();
    timeFilteredEvents.forEach((e) => {
      if (e.sessionId) sessionSet.add(e.sessionId);
    });
    return sessionSet.size;
  }, [timeFilteredEvents]);

  const realGameLaunchesCount = useMemo(() => {
    return timeFilteredEvents.filter((e) => e.type === 'game_launch').length;
  }, [timeFilteredEvents]);

  const totalCatalogPlays = useMemo(() => {
    return games.reduce((acc, g) => acc + (g.plays || 0), 0);
  }, [games]);

  const liveVisitorsCount = useMemo(() => {
    const twoMinsAgo = Date.now() - 2 * 60 * 1000;
    const active = (realtimeData.activeSessions || []).filter((s) => {
      if (!s.lastActive) return false;
      return new Date(s.lastActive).getTime() >= twoMinsAgo;
    });
    return active.length;
  }, [realtimeData.activeSessions]);

  const featuredCount = useMemo(() => games.filter((g) => g.isFeatured).length, [games]);
  const activeCount = useMemo(() => games.filter((g) => !g.isHidden).length, [games]);
  const hiddenCount = useMemo(() => games.filter((g) => g.isHidden).length, [games]);

  // ----------------------------------------------------
  // Generate REAL Time-Series Traffic Chart Data
  // ----------------------------------------------------
  const trafficData = useMemo(() => {
    if (timeRange === '24h') {
      const buckets = Array.from({ length: 24 }).map((_, i) => ({
        name: `${i}:00`,
        hour: i,
        Visits: 0,
        'Unique Visitors': 0,
        'Game Plays': 0,
        sessionSet: new Set(),
      }));

      timeFilteredEvents.forEach((e) => {
        if (!e.timestamp) return;
        const d = new Date(e.timestamp);
        const hr = d.getHours();
        if (buckets[hr]) {
          if (e.type === 'page_view') buckets[hr].Visits += 1;
          if (e.type === 'game_launch') buckets[hr]['Game Plays'] += 1;
          if (e.sessionId) buckets[hr].sessionSet.add(e.sessionId);
        }
      });

      return buckets.map((b) => ({
        name: b.name,
        Visits: b.Visits,
        'Unique Visitors': b.sessionSet.size,
        'Game Plays': b['Game Plays'],
      }));
    } else {
      // Days-based buckets
      const numDays = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
      const dayBucketsMap = {};
      const now = new Date();

      for (let i = numDays - 1; i >= 0; i--) {
        const dateObj = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const key = dateObj.toISOString().split('T')[0];
        const label = `${dateObj.getMonth() + 1}/${dateObj.getDate()}`;
        dayBucketsMap[key] = { name: label, Visits: 0, 'Game Plays': 0, sessionSet: new Set() };
      }

      timeFilteredEvents.forEach((e) => {
        const key = e.date || (e.timestamp ? new Date(e.timestamp).toISOString().split('T')[0] : null);
        if (key && dayBucketsMap[key]) {
          if (e.type === 'page_view') dayBucketsMap[key].Visits += 1;
          if (e.type === 'game_launch') dayBucketsMap[key]['Game Plays'] += 1;
          if (e.sessionId) dayBucketsMap[key].sessionSet.add(e.sessionId);
        }
      });

      return Object.values(dayBucketsMap).map((b) => ({
        name: b.name,
        Visits: b.Visits,
        'Unique Visitors': b.sessionSet.size,
        'Game Plays': b['Game Plays'],
      }));
    }
  }, [timeFilteredEvents, timeRange]);

  const hasTrafficChartData = useMemo(() => {
    return trafficData.some((b) => b.Visits > 0 || b['Game Plays'] > 0);
  }, [trafficData]);

  // ----------------------------------------------------
  // REAL Category Distribution
  // ----------------------------------------------------
  const categoryStats = useMemo(() => {
    const map = {};
    games.forEach((g) => {
      const cat = g.category || 'Arcade';
      if (!map[cat]) map[cat] = { count: 0, plays: 0 };
      map[cat].count += 1;
      map[cat].plays += g.plays || 0;
    });

    const totalPlaysCount = totalCatalogPlays || 1;
    return Object.entries(map)
      .map(([name, data]) => ({
        name,
        count: data.count,
        plays: data.plays,
        percentage: totalCatalogPlays > 0 ? ((data.plays / totalPlaysCount) * 100).toFixed(1) : '0',
      }))
      .sort((a, b) => b.plays - a.plays);
  }, [games, totalCatalogPlays]);

  const PIE_COLORS = ['#a855f7', '#6366f1', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#14b8a6'];

  // ----------------------------------------------------
  // REAL Top Games Processing
  // ----------------------------------------------------
  const topGamesProcessed = useMemo(() => {
    return [...games]
      .filter((g) => {
        if (categoryFilter !== 'All' && g.category !== categoryFilter) return false;
        if (searchFilter.trim()) {
          const q = searchFilter.toLowerCase();
          return (
            g.title.toLowerCase().includes(q) ||
            g.category.toLowerCase().includes(q) ||
            g.id.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => (b.plays || 0) - (a.plays || 0));
  }, [games, categoryFilter, searchFilter]);

  // ----------------------------------------------------
  // REAL Game Health Scanner
  // ----------------------------------------------------
  const handleRunHealthScan = async () => {
    setIsScanning(true);
    setHealthScanProgress(0);

    const results = {};
    const total = games.length;

    if (total === 0) {
      setIsScanning(false);
      setHealthScanProgress(100);
      return;
    }

    for (let i = 0; i < total; i++) {
      const g = games[i];
      const url = g.iframeUrl || '';
      const isHttps = url.startsWith('https://');
      const hasThumb = Boolean(g.thumbnailUrl && g.thumbnailUrl.startsWith('http'));

      let status = 'healthy';
      let issues = [];

      if (!isHttps) {
        status = 'warning';
        issues.push('Non-HTTPS iFrame link');
      }
      if (!hasThumb) {
        status = 'warning';
        issues.push('Missing/invalid thumbnail URL');
      }

      // Check iframe reachability via fetch
      let responseMs = '—';
      if (url.startsWith('http')) {
        const start = performance.now();
        try {
          const res = await fetch(url, { method: 'HEAD', mode: 'no-cors' });
          const elapsed = Math.round(performance.now() - start);
          responseMs = `${elapsed}ms`;
        } catch {
          // If fetch fails completely, mark warning or offline
          responseMs = 'N/A';
          status = 'warning';
          issues.push('CORS / Load restricted');
        }
      }

      results[g.id] = {
        status,
        issues,
        isHttps,
        hasThumb,
        responseTime: responseMs,
        lastScanned: new Date().toLocaleTimeString(),
      };

      setHealthScanProgress(Math.round(((i + 1) / total) * 100));
    }

    setHealthScanResults(results);
    setIsScanning(false);
  };

  useEffect(() => {
    if (games.length > 0 && Object.keys(healthScanResults).length === 0) {
      handleRunHealthScan();
    }
  }, [games]);

  // ----------------------------------------------------
  // REAL Search Analytics
  // ----------------------------------------------------
  const searchAnalytics = useMemo(() => {
    const events = realtimeData.searchEvents || [];
    if (events.length === 0) return { topQueries: [], zeroResultQueries: [], totalSearches: 0 };

    const queryCounts = {};
    const zeroResultCounts = {};

    events.forEach((e) => {
      const q = (e.query || '').trim().toLowerCase();
      if (!q) return;
      queryCounts[q] = (queryCounts[q] || 0) + 1;
      if (e.resultCount === 0) {
        zeroResultCounts[q] = (zeroResultCounts[q] || 0) + 1;
      }
    });

    const topQueries = Object.entries(queryCounts)
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    const zeroResultQueries = Object.entries(zeroResultCounts)
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    return {
      topQueries,
      zeroResultQueries,
      totalSearches: events.length,
    };
  }, [realtimeData.searchEvents]);

  // ----------------------------------------------------
  // REAL Geographic & Device & Referral Breakdown
  // ----------------------------------------------------
  const geoBreakdown = useMemo(() => {
    const events = realtimeData.analyticsEvents || [];
    if (events.length === 0) return [];

    const countryMap = {};
    events.forEach((e) => {
      const c = e.country || 'Unknown Region';
      countryMap[c] = (countryMap[c] || 0) + 1;
    });

    const total = events.length || 1;
    return Object.entries(countryMap)
      .map(([country, count]) => ({
        country,
        count,
        percentage: ((count / total) * 100).toFixed(1),
      }))
      .sort((a, b) => b.count - a.count);
  }, [realtimeData.analyticsEvents]);

  const deviceBreakdown = useMemo(() => {
    const events = realtimeData.analyticsEvents || [];
    if (events.length === 0) return { Desktop: 0, Mobile: 0, Tablet: 0 };

    const map = { Desktop: 0, Mobile: 0, Tablet: 0 };
    events.forEach((e) => {
      const dev = e.deviceType || 'Desktop';
      if (map[dev] !== undefined) map[dev] += 1;
      else map['Desktop'] += 1;
    });

    const total = events.length || 1;
    return {
      Desktop: Math.round((map.Desktop / total) * 100),
      Mobile: Math.round((map.Mobile / total) * 100),
      Tablet: Math.round((map.Tablet / total) * 100),
    };
  }, [realtimeData.analyticsEvents]);

  const referralBreakdown = useMemo(() => {
    const events = realtimeData.analyticsEvents || [];
    if (events.length === 0) return [];

    const map = {};
    events.forEach((e) => {
      const ref = e.referrer || 'Direct';
      map[ref] = (map[ref] || 0) + 1;
    });

    const total = events.length || 1;
    return Object.entries(map)
      .map(([source, count]) => ({
        source,
        count,
        percentage: ((count / total) * 100).toFixed(1),
      }))
      .sort((a, b) => b.count - a.count);
  }, [realtimeData.analyticsEvents]);

  // ----------------------------------------------------
  // REAL Activity Feed (Combined Analytics + Admin Logs)
  // ----------------------------------------------------
  const realActivityStream = useMemo(() => {
    const events = (realtimeData.analyticsEvents || []).map((e) => ({
      id: e.id || `ev_${Math.random()}`,
      text: e.type === 'page_view'
        ? `Visitor (${e.deviceType || 'Device'}) visited LAZRHUB`
        : e.type === 'game_launch'
        ? `Visitor launched "${e.gameTitle || 'Game'}"`
        : e.type === 'search'
        ? `Visitor searched for "${e.query || ''}"`
        : e.type === 'admin_action'
        ? `Admin (${e.adminEmail || 'Admin'}) performed: ${e.action}`
        : `User event: ${e.type}`,
      time: e.timestamp ? new Date(e.timestamp).toLocaleTimeString() : 'Recently',
      timestamp: e.timestamp ? new Date(e.timestamp).getTime() : 0,
      type: e.type,
    }));

    const logs = (realtimeData.adminLogs || []).map((l) => ({
      id: l.id || `log_${Math.random()}`,
      text: `Admin (${l.adminEmail || 'Admin'}): ${l.action} - ${l.target || ''}`,
      time: l.timestamp ? new Date(l.timestamp).toLocaleTimeString() : 'Recently',
      timestamp: l.timestamp ? new Date(l.timestamp).getTime() : 0,
      type: 'admin',
    }));

    return [...events, ...logs]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 15);
  }, [realtimeData.analyticsEvents, realtimeData.adminLogs]);

  // ----------------------------------------------------
  // Export Data Handlers
  // ----------------------------------------------------
  const handleExportCSV = (type = 'games') => {
    let csvContent = '';
    let filename = `lazrhub_analytics_${type}_${Date.now()}.csv`;

    if (type === 'games') {
      csvContent = 'Rank,ID,Title,Category,Plays,Rating,IsFeatured,IsHidden\n';
      games.forEach((g, idx) => {
        csvContent += `"${idx + 1}","${g.id}","${(g.title || '').replace(/"/g, '""')}","${g.category}",${g.plays || 0},${g.rating || 0},${g.isFeatured ? 'Yes' : 'No'},${g.isHidden ? 'Yes' : 'No'}\n`;
      });
    } else if (type === 'traffic') {
      csvContent = 'Period,Visits,Unique Visitors,Game Plays\n';
      trafficData.forEach((row) => {
        csvContent += `"${row.name}",${row.Visits},${row['Unique Visitors']},${row['Game Plays']}\n`;
      });
    } else if (type === 'categories') {
      csvContent = 'Category,Number of Games,Total Plays,Percentage\n';
      categoryStats.forEach((c) => {
        csvContent += `"${c.name}",${c.count},${c.plays},${c.percentage}%\n`;
      });
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setExportNotice(`Exported ${filename}`);
    setTimeout(() => setExportNotice(''), 3000);
  };

  const handleExportJSON = () => {
    const data = {
      timestamp: new Date().toISOString(),
      summary: {
        totalGames: games.length,
        totalCatalogPlays,
        realPageViews,
        realUniqueVisitors,
        realGameLaunchesCount,
        liveVisitorsCount,
      },
      trafficData,
      categoryStats,
      games: games.map((g) => ({
        id: g.id,
        title: g.title,
        category: g.category,
        plays: g.plays,
        rating: g.rating,
      })),
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', dataStr);
    link.setAttribute('download', `lazrhub_real_analytics_${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    link.remove();

    setExportNotice('Exported real analytics JSON payload!');
    setTimeout(() => setExportNotice(''), 3000);
  };

  const handlePrintReport = () => {
    window.print();
  };

  // KPI Cards Array (Values strictly derived from real events or database)
  const kpiCardsData = [
    {
      title: 'Total Website Visits',
      value: realPageViews > 0 ? realPageViews.toLocaleString() : '0',
      statusMsg: realPageViews === 0 ? 'No visitor data available.' : 'Collected live',
      icon: Eye,
      color: 'from-purple-600/20 to-indigo-600/20 text-purple-400 border-purple-500/30',
    },
    {
      title: 'Unique Visitors',
      value: realUniqueVisitors > 0 ? realUniqueVisitors.toLocaleString() : '0',
      statusMsg: realUniqueVisitors === 0 ? 'No visitor data available.' : 'Unique session IDs',
      icon: Users,
      color: 'from-indigo-600/20 to-blue-600/20 text-indigo-400 border-indigo-500/30',
    },
    {
      title: 'Total Game Plays',
      value: totalCatalogPlays > 0 ? totalCatalogPlays.toLocaleString() : '0',
      statusMsg: totalCatalogPlays === 0 ? 'No games have been played yet.' : 'Real game launches',
      icon: Gamepad2,
      color: 'from-fuchsia-600/20 to-purple-600/20 text-fuchsia-400 border-fuchsia-500/30',
    },
    {
      title: 'Live Visitors',
      value: liveVisitorsCount > 0 ? liveVisitorsCount.toString() : '0',
      statusMsg: liveVisitorsCount === 0 ? 'Waiting for real traffic...' : 'Active right now',
      isLive: liveVisitorsCount > 0,
      icon: Radio,
      color: 'from-emerald-950/80 to-teal-950/80 text-emerald-400 border-emerald-500/60 shadow-lg shadow-emerald-950/50',
    },
    {
      title: 'Active Games',
      value: activeCount.toString(),
      statusMsg: `${games.length} total in catalog`,
      icon: CheckCircle2,
      color: 'from-emerald-600/20 to-green-600/20 text-emerald-300 border-emerald-500/30',
    },
    {
      title: 'Featured Games',
      value: featuredCount.toString(),
      statusMsg: 'Hero banner spotlight',
      icon: Star,
      color: 'from-amber-600/20 to-yellow-600/20 text-amber-300 border-amber-500/30',
    },
  ];

  return (
    <div className="space-y-6 text-slate-100 animate-fadeIn">
      {/* Top Header Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 rounded-3xl bg-slate-950/90 border border-purple-900/50 shadow-xl backdrop-blur-xl">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
              <BarChart3 className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-black text-white tracking-tight">LAZRHUB Real Analytics Dashboard</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-black uppercase flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>100% REAL DATA</span>
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Displaying strictly real-time telemetry stored in Firestore. No simulated, estimated, or placeholder statistics.
          </p>
        </div>

        {/* Toolbar Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowCustomizer(!showCustomizer)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all border ${
              showCustomizer
                ? 'bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-600/30'
                : 'bg-slate-900 hover:bg-slate-800 text-purple-300 border-purple-900/40'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Customize View</span>
          </button>

          <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-xl border border-purple-900/40">
            <button
              onClick={() => handleExportCSV('games')}
              className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-slate-300 hover:text-white hover:bg-slate-800 flex items-center space-x-1 transition-colors"
              title="Export Games CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>CSV</span>
            </button>

            <button
              onClick={handleExportJSON}
              className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-slate-300 hover:text-white hover:bg-slate-800 flex items-center space-x-1 transition-colors"
              title="Export Analytics JSON"
            >
              <FileJson className="w-3.5 h-3.5 text-indigo-400" />
              <span>JSON</span>
            </button>

            <button
              onClick={handlePrintReport}
              className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-slate-300 hover:text-white hover:bg-slate-800 flex items-center space-x-1 transition-colors"
              title="Print Report"
            >
              <Printer className="w-3.5 h-3.5 text-purple-400" />
              <span>PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Export Notice */}
      {exportNotice && (
        <div className="bg-emerald-600/90 text-white text-xs font-extrabold px-4 py-2.5 rounded-2xl flex items-center justify-center space-x-2 animate-fadeIn shadow-lg">
          <CheckCircle2 className="w-4 h-4 text-white" />
          <span>{exportNotice}</span>
        </div>
      )}

      {/* Widget Customizer Toggle */}
      {showCustomizer && (
        <div className="p-4 rounded-3xl bg-slate-950 border border-purple-500/50 space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h4 className="text-xs font-black text-purple-300 uppercase tracking-wider flex items-center space-x-2">
              <SlidersHorizontal className="w-4 h-4 text-purple-400" />
              <span>Toggle Widget Visibility</span>
            </h4>
            <button
              onClick={() => setShowCustomizer(false)}
              className="text-xs text-slate-400 hover:text-white font-bold"
            >
              Done
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 pt-1">
            {Object.keys(widgetVisibility).map((key) => (
              <button
                key={key}
                onClick={() =>
                  setWidgetVisibility((prev) => ({ ...prev, [key]: !prev[key] }))
                }
                className={`p-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all border ${
                  widgetVisibility[key]
                    ? 'bg-purple-900/40 text-purple-200 border-purple-500/60'
                    : 'bg-slate-900 text-slate-500 border-slate-800'
                }`}
              >
                <span className="truncate uppercase text-[10px]">{key}</span>
                <span className={`w-3.5 h-3.5 rounded-md flex items-center justify-center text-[10px] ${widgetVisibility[key] ? 'bg-purple-500 text-white' : 'bg-slate-800'}`}>
                  {widgetVisibility[key] ? '✓' : ''}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 1: REAL KPI CARDS */}
      {widgetVisibility.kpis && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {kpiCardsData.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div
                key={idx}
                className={`p-4 rounded-2xl bg-gradient-to-br ${card.color} bg-slate-900/80 border hover:border-purple-500/50 transition-all shadow-lg flex flex-col justify-between space-y-2`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    {card.title}
                  </span>
                  <div className="p-1.5 rounded-xl bg-slate-950/60 shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                </div>

                <div>
                  <div className="text-2xl font-black text-white tracking-tight flex items-center space-x-1.5">
                    <span>{card.value}</span>
                    {card.isLive && (
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium block mt-1">
                    {card.statusMsg}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SECTION 2: REAL TRAFFIC TIME-SERIES CHART */}
      {widgetVisibility.traffic && (
        <div className="p-6 rounded-3xl bg-slate-950/90 border border-purple-900/50 shadow-2xl space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-purple-900/30">
            <div>
              <h3 className="text-base font-black text-white flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-purple-400" />
                <span>Real Traffic & Game Launches</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Actual website visits and game launches recorded in database over time.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center p-1 bg-slate-900 rounded-xl border border-purple-900/40">
                {['24h', '7d', '30d', '90d', '1y', 'all'].map((r) => (
                  <button
                    key={r}
                    onClick={() => setTimeRange(r)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold uppercase transition-all ${
                      timeRange === r
                        ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>

              <div className="flex items-center p-1 bg-slate-900 rounded-xl border border-purple-900/40">
                <button
                  onClick={() => setChartType('area')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${chartType === 'area' ? 'bg-purple-900/60 text-purple-300' : 'text-slate-400'}`}
                >
                  Area
                </button>
                <button
                  onClick={() => setChartType('bar')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${chartType === 'bar' ? 'bg-purple-900/60 text-purple-300' : 'text-slate-400'}`}
                >
                  Bar
                </button>
                <button
                  onClick={() => setChartType('line')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${chartType === 'line' ? 'bg-purple-900/60 text-purple-300' : 'text-slate-400'}`}
                >
                  Line
                </button>
              </div>
            </div>
          </div>

          {/* Render Recharts with Real Data */}
          <div className="h-72 w-full pt-2 relative">
            {!hasTrafficChartData && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm rounded-2xl p-4 text-center">
                <Inbox className="w-10 h-10 text-purple-400 mb-2 opacity-60" />
                <h4 className="text-sm font-bold text-white">No analytics data has been collected yet.</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                  Waiting for real user activity. Open games or browse pages to begin recording live telemetry.
                </p>
              </div>
            )}

            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'area' ? (
                <AreaChart data={trafficData}>
                  <defs>
                    <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a855f7" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorPlays" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#6366f1',
                      borderRadius: '16px',
                      color: '#f8fafc',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', color: '#cbd5e1' }} />
                  <Area type="monotone" dataKey="Visits" stroke="#a855f7" fillOpacity={1} fill="url(#colorVisits)" />
                  <Area type="monotone" dataKey="Game Plays" stroke="#6366f1" fillOpacity={1} fill="url(#colorPlays)" />
                </AreaChart>
              ) : chartType === 'bar' ? (
                <BarChart data={trafficData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#6366f1',
                      borderRadius: '16px',
                      color: '#f8fafc',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', color: '#cbd5e1' }} />
                  <Bar dataKey="Visits" fill="#a855f7" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="Game Plays" fill="#6366f1" radius={[6, 6, 0, 0]} />
                </BarChart>
              ) : (
                <LineChart data={trafficData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#6366f1',
                      borderRadius: '16px',
                      color: '#f8fafc',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', color: '#cbd5e1' }} />
                  <Line type="monotone" dataKey="Visits" stroke="#a855f7" strokeWidth={3} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="Game Plays" stroke="#6366f1" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* TWO COLUMN GRID: LIVE ACTIVITY STREAM & CATEGORY PIE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Real Live Activity Feed */}
        {widgetVisibility.realtime && (
          <div className="p-6 rounded-3xl bg-slate-950/90 border border-purple-900/50 shadow-2xl flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-purple-900/30">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                <h3 className="text-sm font-black text-white uppercase tracking-wider">Live Activity Stream</h3>
              </div>
              <span className="text-[10px] font-mono text-purple-300 bg-purple-950 px-2.5 py-1 rounded-full border border-purple-500/30">
                {realActivityStream.length} Recorded Events
              </span>
            </div>

            <div className="space-y-2.5 overflow-y-auto max-h-72 pr-1 custom-scrollbar">
              {realActivityStream.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs font-bold space-y-1">
                  <p>Waiting for real traffic...</p>
                  <p className="text-[11px] text-slate-500 font-normal">No activity recorded yet in database.</p>
                </div>
              ) : (
                realActivityStream.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-3 rounded-2xl bg-slate-900/80 border border-purple-900/30 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <span className="p-1.5 rounded-xl bg-purple-600/20 text-purple-300 shrink-0">
                        {ev.type === 'game_launch' ? (
                          <Gamepad2 className="w-3.5 h-3.5" />
                        ) : ev.type === 'search' ? (
                          <Search className="w-3.5 h-3.5 text-indigo-400" />
                        ) : (
                          <Shield className="w-3.5 h-3.5 text-emerald-400" />
                        )}
                      </span>
                      <span className="text-slate-200 font-medium truncate">{ev.text}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono shrink-0 ml-2">{ev.time}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Popular Categories Pie */}
        {widgetVisibility.categories && (
          <div className="p-6 rounded-3xl bg-slate-950/90 border border-purple-900/50 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-purple-900/30">
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center space-x-2">
                <PieIcon className="w-4 h-4 text-purple-400" />
                <span>Category Distribution</span>
              </h3>
              <span className="text-xs text-slate-400 font-bold">{categoryStats.length} Categories</span>
            </div>

            {totalCatalogPlays === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs font-bold">
                No games have been played yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryStats}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="plays"
                      >
                        {categoryStats.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          borderColor: '#6366f1',
                          borderRadius: '12px',
                          fontSize: '11px',
                          color: '#fff',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {categoryStats.map((cat, idx) => (
                    <div key={cat.name} className="p-2 rounded-xl bg-slate-900/60 border border-slate-800 text-xs flex items-center justify-between">
                      <div className="flex items-center space-x-2 min-w-0">
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                        ></span>
                        <span className="font-bold text-slate-200 truncate">{cat.name}</span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-black text-purple-300">{cat.plays.toLocaleString()}</span>
                        <span className="text-[10px] text-slate-500 block">{cat.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* SECTION: REAL GAME IFRAME HEALTH SCANNER */}
      {widgetVisibility.health && (
        <div className="p-6 rounded-3xl bg-slate-950/90 border border-purple-900/50 shadow-2xl space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-purple-900/30">
            <div>
              <h3 className="text-base font-black text-white flex items-center space-x-2">
                <Shield className="w-5 h-5 text-emerald-400" />
                <span>Automated iFrame & Protocol Scanner</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Performs actual HTTP reachability, HTTPS protocol checks, and thumbnail verification.
              </p>
            </div>

            <button
              onClick={handleRunHealthScan}
              disabled={isScanning}
              className={`px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center space-x-2 transition-all shadow-lg ${
                isScanning
                  ? 'bg-purple-900/50 text-purple-300 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
              <span>{isScanning ? 'Scanning Catalog...' : 'Scan All Games Now'}</span>
            </button>
          </div>

          {/* Progress Bar */}
          {healthScanProgress !== null && healthScanProgress < 100 && (
            <div className="space-y-1.5 animate-fadeIn">
              <div className="flex items-center justify-between text-xs font-bold text-purple-300">
                <span>Testing game endpoints...</span>
                <span>{healthScanProgress}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden p-0.5 border border-purple-900/40">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-purple-600 to-emerald-400 transition-all duration-150"
                  style={{ width: `${healthScanProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Health Summary Chips */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span className="text-xs font-extrabold text-emerald-200">Healthy Games</span>
              </div>
              <span className="text-base font-black text-emerald-400">
                {Object.values(healthScanResults).filter((r) => r.status === 'healthy').length}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-500/40 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <span className="text-xs font-extrabold text-amber-200">Warnings</span>
              </div>
              <span className="text-base font-black text-amber-400">
                {Object.values(healthScanResults).filter((r) => r.status === 'warning').length}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-red-950/40 border border-red-500/40 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <XCircle className="w-5 h-5 text-red-400" />
                <span className="text-xs font-extrabold text-red-200">Offline / Restricted</span>
              </div>
              <span className="text-base font-black text-red-400">
                {Object.values(healthScanResults).filter((r) => r.status === 'offline').length}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* SECTION: TOP GAMES MATRIX */}
      {widgetVisibility.topGames && (
        <div className="p-6 rounded-3xl bg-slate-950/90 border border-purple-900/50 shadow-2xl space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-purple-900/30">
            <div>
              <h3 className="text-base font-black text-white flex items-center space-x-2">
                <Gamepad2 className="w-5 h-5 text-purple-400" />
                <span>Games Leaderboard & Performance Matrix</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Sorted by actual plays recorded in Firestore database.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-48">
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Filter games..."
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-purple-900/40 text-xs text-white focus:outline-none"
                />
              </div>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-900 border border-purple-900/40 text-xs font-bold text-slate-200 focus:outline-none"
              >
                <option value="All">All Categories</option>
                {categories.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs text-slate-300">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] font-black uppercase text-purple-300 tracking-wider">
                  <th className="py-3 px-3">#</th>
                  <th className="py-3 px-3">Game Title</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Actual Plays</th>
                  <th className="py-3 px-3">Rating</th>
                  <th className="py-3 px-3">Health Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900">
                {topGamesProcessed.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-slate-400 font-bold">
                      No games match the selected filters.
                    </td>
                  </tr>
                ) : (
                  topGamesProcessed.slice(0, 15).map((game, idx) => {
                    const health = healthScanResults[game.id] || { status: 'healthy', responseTime: '—' };
                    return (
                      <tr key={game.id} className="hover:bg-purple-950/20 transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-slate-500">{idx + 1}</td>
                        <td className="py-3 px-3">
                          <div className="flex items-center space-x-3">
                            <img
                              src={game.thumbnailUrl}
                              alt={game.title}
                              className="w-9 h-9 rounded-xl object-cover shrink-0 border border-slate-800"
                            />
                            <div className="min-w-0">
                              <div className="flex items-center space-x-1.5">
                                <span className="font-bold text-white truncate max-w-xs">{game.title}</span>
                                {game.isFeatured && (
                                  <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[9px] font-black uppercase">
                                    HERO
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-500 font-mono block">ID: {game.id}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 font-medium text-slate-300">{game.category}</td>
                        <td className="py-3 px-3 font-black text-purple-300">
                          {(game.plays || 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-3 font-bold text-amber-400">
                          ⭐ {game.rating ? game.rating.toFixed(1) : '0.0'}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                              health.status === 'healthy'
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                                : 'bg-amber-950 text-amber-400 border border-amber-500/30'
                            }`}
                          >
                            <span>{health.status}</span>
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end space-x-1">
                            <button
                              onClick={() => onOpenGame && onOpenGame(game)}
                              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-purple-300 transition-colors"
                              title="Play Game Preview"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => onEditGame && onEditGame(game)}
                              className="p-1.5 rounded-lg bg-purple-900/40 hover:bg-purple-800/60 text-purple-300 transition-colors"
                              title="Edit Game"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => onToggleFeatured && onToggleFeatured(game.id)}
                              className={`p-1.5 rounded-lg transition-colors ${
                                game.isFeatured ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-900 text-slate-500 hover:text-slate-300'
                              }`}
                              title="Toggle Featured"
                            >
                              <Star className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION: REAL SEARCH ANALYTICS */}
      {widgetVisibility.search && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-5 rounded-3xl bg-slate-950/90 border border-purple-900/50 space-y-3">
            <h4 className="text-xs font-black text-purple-300 uppercase tracking-wider flex items-center space-x-2">
              <Search className="w-4 h-4 text-purple-400" />
              <span>Most Searched Game Queries</span>
            </h4>
            {searchAnalytics.topQueries.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 font-bold">No search data available.</p>
            ) : (
              <div className="space-y-2">
                {searchAnalytics.topQueries.map((s, i) => (
                  <div key={i} className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800 text-xs flex items-center justify-between">
                    <span className="font-bold text-white">"{s.query}"</span>
                    <span className="text-purple-300 font-black">{s.count} searches</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-5 rounded-3xl bg-slate-950/90 border border-purple-900/50 space-y-3">
            <h4 className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Searches With Zero Results</span>
            </h4>
            {searchAnalytics.zeroResultQueries.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 font-bold">No search data available.</p>
            ) : (
              <div className="space-y-2">
                {searchAnalytics.zeroResultQueries.map((s, i) => (
                  <div key={i} className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800 text-xs flex items-center justify-between">
                    <span className="font-bold text-slate-200">"{s.query}"</span>
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-black text-[10px]">
                      {s.count} requests
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION: REAL GEOGRAPHIC & DEVICE & REFERRALS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {widgetVisibility.geo && (
          <div className="p-5 rounded-3xl bg-slate-950/90 border border-purple-900/50 space-y-3">
            <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center space-x-2">
              <Globe className="w-4 h-4 text-purple-400" />
              <span>Geography & Regions</span>
            </h4>
            {geoBreakdown.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 font-bold">No visitor data available.</p>
            ) : (
              <div className="space-y-2">
                {geoBreakdown.map((c, i) => (
                  <div key={i} className="p-2 rounded-xl bg-slate-900/60 border border-slate-800 text-xs flex items-center justify-between">
                    <span className="font-bold text-slate-200">{c.country}</span>
                    <div className="text-right">
                      <span className="font-black text-purple-300">{c.count}</span>
                      <span className="text-[10px] text-slate-500 block">{c.percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {widgetVisibility.devices && (
          <div className="p-5 rounded-3xl bg-slate-950/90 border border-purple-900/50 space-y-3">
            <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center space-x-2">
              <Monitor className="w-4 h-4 text-indigo-400" />
              <span>Device Distribution</span>
            </h4>
            {realPageViews === 0 ? (
              <p className="text-xs text-slate-400 py-4 font-bold">No visitor data available.</p>
            ) : (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-300">Desktop</span>
                    <span className="text-purple-300">{deviceBreakdown.Desktop}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden">
                    <div className="h-full bg-purple-500 rounded-full" style={{ width: `${deviceBreakdown.Desktop}%` }}></div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-300">Mobile Phone</span>
                    <span className="text-indigo-300">{deviceBreakdown.Mobile}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${deviceBreakdown.Mobile}%` }}></div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-300">Tablet</span>
                    <span className="text-pink-300">{deviceBreakdown.Tablet}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden">
                    <div className="h-full bg-pink-500 rounded-full" style={{ width: `${deviceBreakdown.Tablet}%` }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {widgetVisibility.referrals && (
          <div className="p-5 rounded-3xl bg-slate-950/90 border border-purple-900/50 space-y-3">
            <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center space-x-2">
              <Share2 className="w-4 h-4 text-emerald-400" />
              <span>Traffic Referral Sources</span>
            </h4>
            {referralBreakdown.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 font-bold">No visitor data available.</p>
            ) : (
              <div className="space-y-2">
                {referralBreakdown.map((ref, i) => (
                  <div key={i} className="p-2 rounded-xl bg-slate-900/60 border border-slate-800 text-xs flex items-center justify-between">
                    <span className="font-bold text-slate-200">{ref.source}</span>
                    <div className="text-right">
                      <span className="font-black text-emerald-400">{ref.percentage}%</span>
                      <span className="text-[10px] text-slate-500 block">{ref.count} views</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* SECTION: ADMIN ACTIVITY AUDIT LOG */}
      {widgetVisibility.adminLog && (
        <div className="p-6 rounded-3xl bg-slate-950/90 border border-purple-900/50 shadow-2xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-purple-900/30">
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center space-x-2">
              <Shield className="w-4 h-4 text-purple-400" />
              <span>Admin Activity & Security Audit Log</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">Logged as {currentUser?.email || 'Admin'}</span>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
            {(realtimeData.adminLogs || []).length === 0 ? (
              <p className="text-xs text-slate-400 py-4 font-bold">No admin actions recorded yet.</p>
            ) : (
              (realtimeData.adminLogs || []).map((log, i) => (
                <div key={log.id || i} className="p-3 rounded-2xl bg-slate-900/70 border border-slate-800 text-xs flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="px-2 py-0.5 rounded bg-purple-900/60 text-purple-300 font-extrabold text-[10px] uppercase shrink-0">
                      {log.action}
                    </span>
                    <span className="font-medium text-slate-200">{log.target}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-slate-400 font-mono text-[10px] block">{log.adminEmail}</span>
                    <span className="text-slate-500 font-mono text-[10px] block">{log.timestamp ? new Date(log.timestamp).toLocaleString() : ''}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
