"use client"
import Navbar from "@/components/Navbar";
import { AlertTriangle, CheckCircle2, Bell, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "@/services/api";

export default function Alerts() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("active");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadAlerts();
  }, []);

  async function loadAlerts() {
    try {
      const data = await api.get("/alerts");
      setAlerts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function resolveAlert(id: string) {
    try {
      await api.patch(`/alerts/${id}/resolve`, {});
      setAlerts(alerts.map(a => a.id === id ? { ...a, resolved: true } : a));
    } catch (err: any) {
      alert(err.message || "Failed to resolve alert");
    }
  }

  const counts = {
    active: alerts.filter(a => !a.resolved).length,
    critical: alerts.filter(a => !a.resolved && a.level === 'critical').length,
    warning: alerts.filter(a => !a.resolved && a.level === 'warning').length,
    resolved: alerts.filter(a => a.resolved).length,
  };

  const filteredAlerts = alerts.filter(a => {
    if (searchQuery && !a.message.toLowerCase().includes(searchQuery.toLowerCase()) && !a.device_id.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (filter === "active") return !a.resolved;
    if (filter === "critical") return !a.resolved && a.level === 'critical';
    if (filter === "warning") return !a.resolved && a.level === 'warning';
    if (filter === "resolved") return a.resolved;
    return true;
  });

  return (
    <>
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl font-extrabold text-txt-primary">Alerts</h1>
            <p className="text-txt-secondary mt-1">System warnings and critical events</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex bg-black/20 rounded-xl p-1 overflow-x-auto max-w-full">
              <button onClick={() => setFilter("active")} className={`whitespace-nowrap px-4 py-2 rounded-lg font-medium text-sm transition-colors ${filter === "active" ? 'bg-surface text-txt-primary shadow-sm' : 'text-txt-secondary hover:text-txt-primary'}`}>Active ({counts.active})</button>
              <button onClick={() => setFilter("critical")} className={`whitespace-nowrap px-4 py-2 rounded-lg font-medium text-sm transition-colors ${filter === "critical" ? 'bg-coral/20 text-coral shadow-sm' : 'text-txt-secondary hover:text-coral'}`}>Critical ({counts.critical})</button>
              <button onClick={() => setFilter("warning")} className={`whitespace-nowrap px-4 py-2 rounded-lg font-medium text-sm transition-colors ${filter === "warning" ? 'bg-amber/20 text-amber shadow-sm' : 'text-txt-secondary hover:text-amber'}`}>Warning ({counts.warning})</button>
              <button onClick={() => setFilter("resolved")} className={`whitespace-nowrap px-4 py-2 rounded-lg font-medium text-sm transition-colors ${filter === "resolved" ? 'bg-surface text-txt-primary shadow-sm' : 'text-txt-secondary hover:text-txt-primary'}`}>Resolved ({counts.resolved})</button>
            </div>
            <div className="relative w-full sm:w-auto">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-txt-muted" />
              <input 
                type="text" 
                placeholder="Search alerts..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-64 pl-9 pr-4 py-2.5 rounded-xl border border-edge bg-surface text-sm text-txt-primary focus:outline-none focus:border-neon focus:ring-1 focus:ring-neon transition-all"
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-edge bg-surface backdrop-blur-xl overflow-hidden shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-edge bg-black/20">
                  <th className="px-6 py-4 text-xs font-semibold text-txt-secondary uppercase tracking-wider">Level</th>
                  <th className="px-6 py-4 text-xs font-semibold text-txt-secondary uppercase tracking-wider">Type</th>
                  <th className="px-6 py-4 text-xs font-semibold text-txt-secondary uppercase tracking-wider">Message</th>
                  <th className="px-6 py-4 text-xs font-semibold text-txt-secondary uppercase tracking-wider">Device</th>
                  <th className="px-6 py-4 text-xs font-semibold text-txt-secondary uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-xs font-semibold text-txt-secondary uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {loading ? (
                  <tr><td colSpan={6} className="px-6 py-8 text-center"><div className="animate-pulse h-4 bg-surface rounded w-1/2 mx-auto"></div></td></tr>
                ) : filteredAlerts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <Bell className="w-12 h-12 text-txt-muted mx-auto mb-4 opacity-50" />
                      <p className="text-txt-secondary font-medium">No alerts found</p>
                    </td>
                  </tr>
                ) : filteredAlerts.map((alert, i) => (
                  <tr key={alert.id} className={`hover:bg-surface-hover transition-colors animate-fade-up ${alert.resolved ? 'opacity-50' : ''}`} style={{ animationDelay: `${i * 0.05}s` }}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide ${alert.level === 'critical' ? 'bg-coral/10 text-coral border border-coral/20' : 'bg-amber/10 text-amber border border-amber/20'}`}>
                        {alert.level === 'critical' ? <AlertTriangle className="w-3 h-3" /> : <Bell className="w-3 h-3" />}
                        {alert.level === 'critical' ? 'CRITICAL' : 'WARNING'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-txt-primary capitalize">
                      {alert.type || 'System'}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-txt-primary truncate max-w-[250px]" title={alert.message}>{alert.message}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-mono text-xs text-txt-secondary">{alert.device_id}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-txt-secondary">
                      {new Date(alert.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {!alert.resolved ? (
                        <button onClick={() => resolveAlert(alert.id)} className="inline-flex items-center gap-2 px-5 py-2 rounded-xl border border-edge bg-surface text-teal font-body font-medium text-sm transition-all duration-300 hover:text-teal hover:border-teal/30 hover:bg-teal/10">
                          Resolve
                        </button>
                      ) : (
                        <span className="inline-flex items-center justify-end gap-1.5 text-xs font-semibold text-txt-muted w-full">
                          <CheckCircle2 className="w-4 h-4" /> Resolved
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </>
  );
}
