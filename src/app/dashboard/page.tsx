"use client"
import Navbar from "@/components/Navbar";
import TelemetryChart from "@/components/TelemetryChart";
import { Smartphone, Package, Bell, AlertTriangle, ArrowRight, BarChart3, Map } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { api } from "@/services/api";
import Link from "next/link";

export default function Dashboard() {
  const [data, setData] = useState<any>({ devices: [], shipments: [], alerts: [] });
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [telemetry, setTelemetry] = useState<any[]>([]);
  const [chartDevice, setChartDevice] = useState<string>("");

  const load = useCallback(async () => {
    try {
      const [devices, shipments, alerts] = await Promise.all([
        api.get("/devices"),
        api.get("/shipments"),
        api.get("/alerts")
      ]);
      setData({ devices, shipments, alerts });
      setLastUpdated(new Date());

      // Auto-select the first device with telemetry for the chart
      if (devices.length > 0 && !chartDevice) {
        const firstDeviceId = devices[0].id;
        setChartDevice(firstDeviceId);
        loadTelemetry(firstDeviceId);
      } else if (chartDevice) {
        loadTelemetry(chartDevice);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [chartDevice]);

  async function loadTelemetry(deviceId: string) {
    try {
      const res = await api.get(`/devices/${deviceId}/telemetry?limit=30`);
      setTelemetry(res.records || []);
    } catch (err) {
      console.error("Failed to load telemetry:", err);
      setTelemetry([]);
    }
  }

  function handleDeviceChange(deviceId: string) {
    setChartDevice(deviceId);
    loadTelemetry(deviceId);
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 30_000);
    return () => clearInterval(interval);
  }, [load]);

  const criticalAlerts = data.alerts.filter((a: any) => a.level === "critical" && !a.resolved).length;
  const activeAlerts = data.alerts.filter((a: any) => !a.resolved).length;

  const stats = [
    { label: "Total Devices", value: data.devices.length.toString(), icon: Smartphone, color: "neon", href: "/devices" },
    { label: "Active Shipments", value: data.shipments.filter((s: any) => s.status !== "delivered").length.toString(), icon: Package, color: "teal", href: "/shipments" },
    { label: "Alerts (Active)", value: activeAlerts.toString(), icon: Bell, color: "amber", href: "/alerts" },
    { label: "Critical", value: criticalAlerts.toString(), icon: AlertTriangle, color: "coral", href: "/alerts" },
  ];

  return (
    <>
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <h1 className="font-display text-3xl font-extrabold text-txt-primary">Dashboard</h1>
            <p className="text-txt-secondary mt-1">Real-time fleet overview</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/map"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-edge bg-surface text-sm font-medium text-txt-secondary hover:text-txt-primary hover:border-white/15 transition-all"
            >
              <Map className="w-4 h-4" /> Fleet Map
            </Link>
            {lastUpdated && (
              <p className="text-xs text-txt-muted">
                Auto-refreshes every 30s &middot; Last updated: {lastUpdated.toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>

        {loading ? (
          <div className="animate-pulse flex space-x-4">
            <div className="flex-1 space-y-6 py-1">
              <div className="h-24 bg-surface rounded-2xl"></div>
              <div className="h-64 bg-surface rounded-2xl"></div>
            </div>
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {stats.map((stat, i) => (
                <Link
                  key={i}
                  href={stat.href}
                  className="relative overflow-hidden rounded-2xl border border-edge bg-surface backdrop-blur-xl p-5 transition-all duration-300 hover:-translate-y-1 hover:border-white/15 group animate-fade-up block"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <div className={`absolute -bottom-6 -right-4 w-20 h-20 rounded-full bg-${stat.color}/15 blur-2xl transition-transform group-hover:scale-125`} />
                  <div className={`w-11 h-11 rounded-xl bg-${stat.color}/10 text-${stat.color} flex items-center justify-center mb-3`}>
                    <stat.icon className="w-5 h-5" />
                  </div>
                  <p className="font-display text-3xl font-extrabold text-txt-primary leading-none">{stat.value}</p>
                  <p className="text-xs font-medium text-txt-secondary mt-1.5 tracking-wide uppercase">{stat.label}</p>
                </Link>
              ))}
            </div>

            {/* Telemetry Chart */}
            <div className="rounded-2xl border border-edge bg-surface backdrop-blur-xl overflow-hidden mb-8 animate-fade-up" style={{ animationDelay: '0.4s' }}>
              <div className="px-6 py-5 border-b border-edge flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-neon" />
                  <h2 className="font-display font-bold text-lg text-txt-primary">Telemetry Overview</h2>
                </div>
                {data.devices.length > 0 && (
                  <select
                    value={chartDevice}
                    onChange={(e) => handleDeviceChange(e.target.value)}
                    className="bg-black/40 border border-edge rounded-xl px-3 py-2 text-sm text-txt-primary focus:outline-none focus:border-neon focus:ring-1 focus:ring-neon transition-all cursor-pointer"
                  >
                    {data.devices.map((d: any) => (
                      <option key={d.id} value={d.id}>
                        {d.device_id}{d.label ? ` — ${d.label}` : ""}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div className="p-6">
                <TelemetryChart data={telemetry} showShock={true} height={300} />
              </div>
            </div>

            {/* Panels */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Shipments */}
              <div className="rounded-2xl border border-edge bg-surface backdrop-blur-xl flex flex-col overflow-hidden animate-fade-up" style={{ animationDelay: '0.5s' }}>
                <div className="px-6 py-5 border-b border-edge flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-teal" />
                    <h2 className="font-display font-bold text-lg text-txt-primary">Recent Shipments</h2>
                  </div>
                  <Link href="/shipments" className="text-sm font-medium text-neon hover:text-white transition-colors flex items-center gap-1">
                    View all <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
                <div className="divide-y divide-white/[0.03]">
                  {data.shipments.slice(0, 3).map((shipment: any) => (
                    <div key={shipment.id} className="px-6 py-4 hover:bg-surface-hover transition-colors flex items-center justify-between">
                      <div>
                        <p className="font-medium text-txt-primary">{shipment.description}</p>
                        <p className="text-xs text-txt-secondary mt-1">ID: {shipment.tracking_code} • {new Date(shipment.created_at).toLocaleDateString()}</p>
                      </div>
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[0.7rem] font-semibold uppercase tracking-wider ${
                        shipment.status === "delivered" ? "bg-teal/10 text-teal border border-teal/20" :
                        shipment.status === "in_transit" ? "bg-neon/10 text-neon border border-neon/20" :
                        shipment.status === "cancelled" ? "bg-coral/10 text-coral border border-coral/20" :
                        "bg-amber/10 text-amber border border-amber/20"
                      }`}>
                        {shipment.status?.replace("_", " ")}
                      </span>
                    </div>
                  ))}
                  {data.shipments.length === 0 && <div className="px-6 py-8 text-center text-txt-secondary">No recent shipments</div>}
                </div>
              </div>

              {/* Active Alerts */}
              <div className="rounded-2xl border border-edge bg-surface backdrop-blur-xl flex flex-col overflow-hidden animate-fade-up" style={{ animationDelay: '0.6s' }}>
                <div className="px-6 py-5 border-b border-edge flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-amber" />
                    <h2 className="font-display font-bold text-lg text-txt-primary">Active Alerts</h2>
                  </div>
                  <Link href="/alerts" className="text-sm font-medium text-neon hover:text-white transition-colors flex items-center gap-1">
                    View all <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
                <div className="divide-y divide-white/[0.03]">
                  {data.alerts.filter((a:any) => !a.resolved).slice(0, 3).map((alert: any) => (
                    <div key={alert.id} className="px-6 py-4 hover:bg-surface-hover transition-colors flex items-center justify-between">
                      <div>
                        <p className="font-medium text-txt-primary">{alert.message}</p>
                        <p className="text-xs text-txt-secondary mt-1">Type: {alert.type} • {new Date(alert.created_at).toLocaleTimeString()}</p>
                      </div>
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[0.7rem] font-semibold uppercase tracking-wider ${alert.level === 'critical' ? 'bg-coral/10 text-coral border-coral/20' : 'bg-amber/10 text-amber border-amber/20'}`}>
                        {alert.level}
                      </span>
                    </div>
                  ))}
                  {data.alerts.filter((a:any) => !a.resolved).length === 0 && <div className="px-6 py-8 text-center text-txt-secondary">No active alerts</div>}
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </>
  );
}
