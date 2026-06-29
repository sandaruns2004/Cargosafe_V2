"use client"
import Navbar from "@/components/Navbar";
import TelemetryChart from "@/components/TelemetryChart";
import {
  Smartphone, Signal, SignalLow, Key, ArrowLeft,
  Thermometer, Droplets, Battery, Navigation2, MapPin, Clock,
  Copy, Check, AlertTriangle, Bell, CheckCircle2, Download,
  Activity, Settings2, Save
} from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/services/api";
import Link from "next/link";

export default function DeviceDetail() {
  const params = useParams();
  const router = useRouter();
  const [device, setDevice] = useState<any>(null);
  const [telemetry, setTelemetry] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [configSaving, setConfigSaving] = useState(false);
  const [editedConfig, setEditedConfig] = useState<any>(null);

  const deviceId = params.id as string;

  const load = useCallback(async () => {
    try {
      const [dev, telRes, allAlerts] = await Promise.all([
        api.get(`/devices/${deviceId}`),
        api.get(`/devices/${deviceId}/telemetry?limit=50`),
        api.get("/alerts"),
      ]);
      setDevice(dev);
      if (!editedConfig && dev.config) {
        setEditedConfig(dev.config);
      }
      setTelemetry(telRes.records || []);
      // Filter alerts for this device only
      setAlerts(allAlerts.filter((a: any) => a.device_id === deviceId));
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes("not found")) {
        router.push("/devices");
      }
    } finally {
      setLoading(false);
    }
  }, [deviceId, router]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 30_000);
    return () => clearInterval(interval);
  }, [load]);

  const latest = telemetry.length > 0 ? telemetry[0] : null;
  const latestShockMagnitude = latest && latest.shock_x !== undefined && latest.shock_y !== undefined && latest.shock_z !== undefined && latest.shock_x !== null
    ? Math.sqrt(latest.shock_x * latest.shock_x + latest.shock_y * latest.shock_y + latest.shock_z * latest.shock_z)
    : null;
  const unresolvedAlerts = alerts.filter((a) => !a.resolved);

  async function resolveAlert(id: string) {
    try {
      await api.patch(`/alerts/${id}/resolve`, {});
      setAlerts(alerts.map((a) => (a.id === id ? { ...a, resolved: true } : a)));
    } catch (err: any) {
      console.error(err);
    }
  }

  async function saveConfig() {
    if (!editedConfig) return;
    setConfigSaving(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/devices/${deviceId}/config`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(editedConfig)
      });
      if (res.ok) {
        const updatedConfig = await res.json();
        setDevice({ ...device, config: updatedConfig });
        setEditedConfig(updatedConfig);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setConfigSaving(false);
    }
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-48 bg-surface rounded-xl" />
            <div className="h-48 bg-surface rounded-2xl" />
            <div className="h-80 bg-surface rounded-2xl" />
          </div>
        </main>
      </>
    );
  }

  if (!device) {
    return (
      <>
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-20">
            <Smartphone className="w-16 h-16 text-txt-muted mx-auto mb-4 opacity-50" />
            <h2 className="text-xl font-bold text-txt-primary mb-2">Device Not Found</h2>
            <Link href="/devices" className="text-neon hover:text-white transition-colors text-sm">← Back to Devices</Link>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back + Header */}
        <div className="mb-8">
          <Link href="/devices" className="inline-flex items-center gap-1.5 text-sm text-txt-secondary hover:text-neon transition-colors mb-4">
            <ArrowLeft className="w-4 h-4" /> Back to Devices
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-neon/10 text-neon flex items-center justify-center">
                <Smartphone className="w-7 h-7" />
              </div>
              <div>
                <h1 className="font-display text-3xl font-extrabold text-txt-primary">{device.device_id}</h1>
                <p className="text-txt-secondary mt-0.5">{device.label || "No label assigned"}</p>
              </div>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                device.status === "online"
                  ? "bg-teal/10 text-teal border border-teal/20"
                  : "bg-txt-muted/10 text-txt-secondary border border-edge"
              }`}
            >
              {device.status === "online" ? <Signal className="w-3.5 h-3.5" /> : <SignalLow className="w-3.5 h-3.5" />}
              {device.status}
            </span>
          </div>
        </div>

        {/* Top row: Live Readings + Device Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Live Sensor Readings */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {/* Temperature */}
              <div className="rounded-2xl border border-edge bg-surface backdrop-blur-xl p-5 animate-fade-up">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
                  latest?.temp > 35 ? "bg-coral/10 text-coral" :
                  latest?.temp > 30 ? "bg-amber/10 text-amber" :
                  "bg-coral/10 text-coral"
                }`}>
                  <Thermometer className="w-5 h-5" />
                </div>
                <p className="font-display text-2xl font-extrabold text-txt-primary leading-none">
                  {latest?.temp !== undefined && latest?.temp !== null ? `${latest.temp}°C` : "—"}
                </p>
                <p className="text-xs text-txt-secondary mt-1 uppercase tracking-wide">Temperature</p>
                {latest?.temp > 35 && <p className="text-[10px] text-coral font-semibold mt-1">⚠ CRITICAL</p>}
                {latest?.temp > 30 && latest?.temp <= 35 && <p className="text-[10px] text-amber font-semibold mt-1">⚠ WARNING</p>}
              </div>

              {/* Humidity */}
              <div className="rounded-2xl border border-edge bg-surface backdrop-blur-xl p-5 animate-fade-up" style={{ animationDelay: "0.1s" }}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
                  latest?.hum > 80 ? "bg-amber/10 text-amber" : "bg-neon/10 text-neon"
                }`}>
                  <Droplets className="w-5 h-5" />
                </div>
                <p className="font-display text-2xl font-extrabold text-txt-primary leading-none">
                  {latest?.hum !== undefined && latest?.hum !== null ? `${latest.hum}%` : "—"}
                </p>
                <p className="text-xs text-txt-secondary mt-1 uppercase tracking-wide">Humidity</p>
                {latest?.hum > 80 && <p className="text-[10px] text-amber font-semibold mt-1">⚠ HIGH</p>}
              </div>

              {/* Shock */}
              <div className="rounded-2xl border border-edge bg-surface backdrop-blur-xl p-5 animate-fade-up" style={{ animationDelay: "0.2s" }}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
                  latestShockMagnitude !== null && latestShockMagnitude > 20 ? "bg-coral/10 text-coral" : 
                  latestShockMagnitude !== null && latestShockMagnitude > 15 ? "bg-amber/10 text-amber" :
                  "bg-teal/10 text-teal"
                }`}>
                  <Navigation2 className="w-5 h-5" />
                </div>
                <p className="font-display text-2xl font-extrabold text-txt-primary leading-none">
                  {latestShockMagnitude !== null ? `${latestShockMagnitude.toFixed(1)}` : "—"}
                </p>
                <p className="text-xs text-txt-secondary mt-1 uppercase tracking-wide">Shock (m/s²)</p>
                {latestShockMagnitude !== null && latestShockMagnitude > 20 && <p className="text-[10px] text-coral font-semibold mt-1">⚠ CRITICAL</p>}
                {latestShockMagnitude !== null && latestShockMagnitude > 15 && latestShockMagnitude <= 20 && <p className="text-[10px] text-amber font-semibold mt-1">⚠ WARNING</p>}
              </div>

              {/* GPS */}
              <div className="rounded-2xl border border-edge bg-surface backdrop-blur-xl p-5 animate-fade-up" style={{ animationDelay: "0.3s" }}>
                <div className="w-10 h-10 rounded-xl bg-violet/10 text-violet flex items-center justify-center mb-3">
                  <MapPin className="w-5 h-5" />
                </div>
                {latest?.lat && latest?.lon ? (
                  <>
                    <p className="font-mono text-sm font-bold text-txt-primary leading-tight">
                      {Number(latest.lat).toFixed(4)}
                    </p>
                    <p className="font-mono text-sm font-bold text-txt-primary leading-tight">
                      {Number(latest.lon).toFixed(4)}
                    </p>
                  </>
                ) : (
                  <p className="font-display text-2xl font-extrabold text-txt-primary leading-none">—</p>
                )}
                <p className="text-xs text-txt-secondary mt-1 uppercase tracking-wide">GPS</p>
              </div>

              {/* Vibration */}
              <div className="rounded-2xl border border-edge bg-surface backdrop-blur-xl p-5 animate-fade-up" style={{ animationDelay: "0.4s" }}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
                  latest?.vibration !== undefined && latest.vibration > 1.0 ? "bg-coral/10 text-coral" :
                  latest?.vibration !== undefined && latest.vibration > 0.5 ? "bg-amber/10 text-amber" :
                  "bg-violet/10 text-violet"
                }`}>
                  <Activity className="w-5 h-5" />
                </div>
                <p className="font-display text-2xl font-extrabold text-txt-primary leading-none">
                  {latest?.vibration !== undefined && latest?.vibration !== null ? `${Number(latest.vibration).toFixed(2)}` : "—"}
                </p>
                <p className="text-xs text-txt-secondary mt-1 uppercase tracking-wide">Vibration</p>
                {latest?.vibration > 1.0 && <p className="text-[10px] text-coral font-semibold mt-1">⚠ CRITICAL</p>}
                {latest?.vibration > 0.5 && latest?.vibration <= 1.0 && <p className="text-[10px] text-amber font-semibold mt-1">⚠ WARNING</p>}
              </div>

              {/* Tilt */}
              <div className="rounded-2xl border border-edge bg-surface backdrop-blur-xl p-5 animate-fade-up" style={{ animationDelay: "0.5s" }}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
                  latest?.tilt !== undefined && latest.tilt > 45 ? "bg-coral/10 text-coral" :
                  latest?.tilt !== undefined && latest.tilt > 30 ? "bg-amber/10 text-amber" :
                  "bg-amber/10 text-amber"
                }`}>
                  <Activity className="w-5 h-5" />
                </div>
                <p className="font-display text-2xl font-extrabold text-txt-primary leading-none">
                  {latest?.tilt !== undefined && latest?.tilt !== null ? `${Number(latest.tilt).toFixed(1)}°` : "—"}
                </p>
                <p className="text-xs text-txt-secondary mt-1 uppercase tracking-wide">Tilt (°)</p>
                {latest?.tilt > 45 && <p className="text-[10px] text-coral font-semibold mt-1">⚠ CRITICAL</p>}
                {latest?.tilt > 30 && latest?.tilt <= 45 && <p className="text-[10px] text-amber font-semibold mt-1">⚠ WARNING</p>}
              </div>

              {/* Flags */}
              <div className="rounded-2xl border border-edge bg-surface backdrop-blur-xl p-5 animate-fade-up col-span-2 sm:col-span-3" style={{ animationDelay: "0.6s" }}>
                <h3 className="text-xs font-bold text-txt-secondary uppercase tracking-wider mb-3">Active Device Flags</h3>
                <div className="flex flex-wrap gap-2">
                  {latest?.flags && latest.flags.length > 0 ? (
                    latest.flags.map((flag: string) => (
                      <span key={flag} className="px-3 py-1 rounded-full bg-neon/10 text-neon border border-neon/20 text-xs font-bold">
                        {flag}
                      </span>
                    ))
                  ) : (
                    <span className="text-txt-muted text-sm italic">No active flags.</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Device Info Card */}
          <div className="rounded-2xl border border-edge bg-surface backdrop-blur-xl p-6 animate-fade-up" style={{ animationDelay: "0.2s" }}>
            <h2 className="font-display font-bold text-lg text-txt-primary mb-4 flex items-center gap-2">
              <Key className="w-4 h-4 text-amber" /> Device Info
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-txt-secondary">Device ID</span>
                <span className="font-mono text-txt-primary text-xs bg-black/30 px-2 py-0.5 rounded">{device.device_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-txt-secondary">Firestore ID</span>
                <span className="font-mono text-txt-muted text-[10px]">{device.id?.slice(0, 12)}...</span>
              </div>
              {device.last_seen && (
                <div className="flex justify-between">
                  <span className="text-txt-secondary">Last Seen</span>
                  <span className="text-txt-primary text-xs">{new Date(device.last_seen).toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-txt-secondary">Created</span>
                <span className="text-txt-primary text-xs">{new Date(device.created_at).toLocaleDateString()}</span>
              </div>

              {/* API Key */}
              <div className="mt-4 p-3 rounded-xl bg-black/30 border border-edge">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-amber uppercase tracking-wider">API Key</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(device.api_key);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="text-txt-muted hover:text-txt-primary transition-colors"
                    title="Copy API key"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-teal" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="font-mono text-[10px] text-txt-secondary break-all">{device.api_key}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Telemetry Chart */}
        <div className="rounded-2xl border border-edge bg-surface backdrop-blur-xl overflow-hidden mb-8 animate-fade-up" style={{ animationDelay: '0.4s' }}>
          <div className="px-6 py-5 border-b border-edge flex items-center gap-2">
            <Clock className="w-5 h-5 text-neon" />
            <h2 className="font-display font-bold text-lg text-txt-primary">Telemetry History</h2>
            <div className="ml-auto flex items-center gap-3">
              <span className="text-xs text-txt-muted">Last {telemetry.length} readings</span>
              {telemetry.length > 0 && (
                <button
                  onClick={async () => {
                    const token = localStorage.getItem("token");
                    const res = await fetch(`/api/devices/${deviceId}/telemetry/export?limit=200`, {
                      headers: { Authorization: `Bearer ${token}` },
                    });
                    if (!res.ok) return;
                    const blob = await res.blob();
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `${device.device_id}_telemetry.csv`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-edge text-xs font-medium text-teal hover:bg-teal/10 hover:border-teal/30 transition-all"
                  title="Export as CSV"
                >
                  <Download className="w-3.5 h-3.5" /> Export CSV
                </button>
              )}
            </div>
          </div>
          <div className="p-6">
            <TelemetryChart data={telemetry} showShock={true} height={320} />
          </div>
        </div>

        {/* Configuration Panel */}
        {device.config && editedConfig && (
          <div className="rounded-2xl border border-edge bg-surface backdrop-blur-xl overflow-hidden mb-8 animate-fade-up" style={{ animationDelay: '0.45s' }}>
            <div className="px-6 py-5 border-b border-edge flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-neon" />
                <h2 className="font-display font-bold text-lg text-txt-primary">Device Configuration</h2>
              </div>
              <button
                onClick={saveConfig}
                disabled={configSaving}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-neon text-black font-bold text-sm hover:bg-neon/90 transition-all disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {configSaving ? "Saving..." : "Save Config"}
              </button>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              <div className="space-y-1">
                <label className="text-xs text-txt-secondary uppercase tracking-wider">Sampling Rate (sec)</label>
                <input
                  type="number"
                  value={editedConfig.sampling_rate_seconds}
                  onChange={(e) => setEditedConfig({ ...editedConfig, sampling_rate_seconds: Number(e.target.value) })}
                  className="w-full bg-black/30 border border-edge rounded-lg px-3 py-2 text-sm focus:border-neon focus:ring-1 focus:ring-neon outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-txt-secondary uppercase tracking-wider">Shock Thresh (m/s²)</label>
                <input
                  type="number"
                  value={editedConfig.shock_threshold}
                  onChange={(e) => setEditedConfig({ ...editedConfig, shock_threshold: Number(e.target.value) })}
                  className="w-full bg-black/30 border border-edge rounded-lg px-3 py-2 text-sm focus:border-neon focus:ring-1 focus:ring-neon outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-txt-secondary uppercase tracking-wider">Vibration Thresh</label>
                <input
                  type="number"
                  step="0.1"
                  value={editedConfig.vibration_threshold}
                  onChange={(e) => setEditedConfig({ ...editedConfig, vibration_threshold: Number(e.target.value) })}
                  className="w-full bg-black/30 border border-edge rounded-lg px-3 py-2 text-sm focus:border-neon focus:ring-1 focus:ring-neon outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-txt-secondary uppercase tracking-wider">Tilt Thresh (°)</label>
                <input
                  type="number"
                  value={editedConfig.tilt_threshold}
                  onChange={(e) => setEditedConfig({ ...editedConfig, tilt_threshold: Number(e.target.value) })}
                  className="w-full bg-black/30 border border-edge rounded-lg px-3 py-2 text-sm focus:border-neon focus:ring-1 focus:ring-neon outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-txt-secondary uppercase tracking-wider">Temp High (°C)</label>
                <input
                  type="number"
                  value={editedConfig.temp_threshold_high}
                  onChange={(e) => setEditedConfig({ ...editedConfig, temp_threshold_high: Number(e.target.value) })}
                  className="w-full bg-black/30 border border-edge rounded-lg px-3 py-2 text-sm focus:border-neon focus:ring-1 focus:ring-neon outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-txt-secondary uppercase tracking-wider">Hum High (%)</label>
                <input
                  type="number"
                  value={editedConfig.hum_threshold_high}
                  onChange={(e) => setEditedConfig({ ...editedConfig, hum_threshold_high: Number(e.target.value) })}
                  className="w-full bg-black/30 border border-edge rounded-lg px-3 py-2 text-sm focus:border-neon focus:ring-1 focus:ring-neon outline-none"
                />
              </div>
              <div className="space-y-1 md:col-span-2 flex items-center pt-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editedConfig.gps_enabled}
                    onChange={(e) => setEditedConfig({ ...editedConfig, gps_enabled: e.target.checked })}
                    className="w-5 h-5 accent-neon rounded border-edge"
                  />
                  <span className="text-sm font-medium">Enable GPS Tracking</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Device Alerts */}
        <div className="rounded-2xl border border-edge bg-surface backdrop-blur-xl overflow-hidden animate-fade-up" style={{ animationDelay: '0.5s' }}>
          <div className="px-6 py-5 border-b border-edge flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-amber" />
              <h2 className="font-display font-bold text-lg text-txt-primary">Device Alerts</h2>
              {unresolvedAlerts.length > 0 && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-coral/10 text-coral border border-coral/20">
                  {unresolvedAlerts.length} active
                </span>
              )}
            </div>
          </div>
          <div className="divide-y divide-white/[0.03]">
            {alerts.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <CheckCircle2 className="w-10 h-10 text-teal/40 mx-auto mb-3" />
                <p className="text-txt-secondary text-sm">No alerts for this device</p>
              </div>
            ) : (
              alerts.slice(0, 10).map((alert) => (
                <div key={alert.id} className={`px-6 py-4 flex items-center justify-between hover:bg-surface-hover transition-colors ${alert.resolved ? "opacity-50" : ""}`}>
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      alert.level === "critical"
                        ? "bg-coral/10 text-coral border border-coral/20"
                        : "bg-amber/10 text-amber border border-amber/20"
                    }`}>
                      {alert.level === "critical" ? <AlertTriangle className="w-3 h-3" /> : <Bell className="w-3 h-3" />}
                      {alert.level}
                    </span>
                    <div>
                      <p className="text-sm text-txt-primary font-medium">{alert.message}</p>
                      <p className="text-xs text-txt-muted mt-0.5">{new Date(alert.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                  {!alert.resolved ? (
                    <button
                      onClick={() => resolveAlert(alert.id)}
                      className="px-3 py-1.5 rounded-lg border border-edge text-xs font-medium text-teal hover:bg-teal/10 hover:border-teal/30 transition-all"
                    >
                      Resolve
                    </button>
                  ) : (
                    <span className="text-xs text-txt-muted flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Resolved
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </>
  );
}
