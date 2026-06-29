"use client"
import { MapPin, Thermometer, Droplets, Clock, Package, Navigation2, Activity, RefreshCw, Wifi } from "lucide-react";
import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import Script from "next/script";

const SRI_LANKA = [7.8731, 80.7718] as [number, number];
const POLL_INTERVAL_MS = 15_000; // Re-fetch telemetry every 15 seconds

export default function PublicTracking() {
  const params = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const pathLayerRef = useRef<any>(null);
  const markerLayerRef = useRef<any>(null);

  // ── Fetch tracking data (called on mount + every 15s) ──────────────────
  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/track/${params.code}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.detail || "Tracking code not found");
      setData(json);
      setLastUpdated(new Date());
      setError("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [params.code]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchData]);

  // ── Initialize map once Leaflet script is ready ────────────────────────
  useEffect(() => {
    if (!leafletLoaded || !mapRef.current) return;
    const L = (window as any).L;
    if (!L || mapInstanceRef.current) return;  // already initialized

    const map = L.map(mapRef.current).setView(SRI_LANKA, 7);
    mapInstanceRef.current = map;

    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: "abcd",
      maxZoom: 20,
    }).addTo(map);
  }, [leafletLoaded]);

  // ── Update map layers whenever data changes ────────────────────────────
  useEffect(() => {
    if (!leafletLoaded || !data || !mapInstanceRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    const map = mapInstanceRef.current;

    // Remove old path and marker layers before redrawing
    if (pathLayerRef.current) {
      map.removeLayer(pathLayerRef.current);
      pathLayerRef.current = null;
    }
    if (markerLayerRef.current) {
      map.removeLayer(markerLayerRef.current);
      markerLayerRef.current = null;
    }

    // Draw GPS path (oldest → newest)
    if (data.path && data.path.length > 0) {
      const latlngs = data.path.map((p: any) => [p.lat, p.lon]);
      const polyline = L.polyline(latlngs, {
        color: "#00c9a7",
        dashArray: "5, 10",
        weight: 3,
        opacity: 0.8,
      }).addTo(map);
      pathLayerRef.current = polyline;

      // Fit bounds only on first load (not on every poll — avoids annoying jumps)
      if (data.path.length > 1) {
        map.fitBounds(polyline.getBounds(), { padding: [40, 40], maxZoom: 16 });
      }
    }

    // Pulsing dot for current location
    if (data.location) {
      const pulseIcon = L.divIcon({
        className: "custom-div-icon",
        html: `<div style="position:relative;width:20px;height:20px;">
          <div style="position:absolute;inset:0;background:#1a6fff;border-radius:50%;animation:cs-pulse 2s infinite;"></div>
          <div style="position:absolute;top:4px;left:4px;width:12px;height:12px;background:#1a6fff;border-radius:50%;border:2px solid #fff;"></div>
          <style>
            @keyframes cs-pulse {
              0%   { box-shadow: 0 0 0 0 rgba(26,111,255,0.6); }
              70%  { box-shadow: 0 0 0 14px rgba(26,111,255,0); }
              100% { box-shadow: 0 0 0 0 rgba(26,111,255,0); }
            }
          </style>
        </div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });
      const marker = L.marker([data.location.lat, data.location.lon], { icon: pulseIcon })
        .bindPopup(
          `<b>Last seen</b><br>${data.last_update ? new Date(data.last_update).toLocaleString() : "Unknown"}<br>` +
          `${data.temp !== null ? `🌡 ${data.temp}°C` : ""}` +
          `${data.hum !== null ? `  💧 ${data.hum}%` : ""}`
        )
        .addTo(map);
      markerLayerRef.current = marker;

      // Only snap to marker if no path (i.e. single point)
      if (!data.path || data.path.length <= 1) {
        map.setView([data.location.lat, data.location.lon], 13);
      }
    } else if (!data.path || data.path.length === 0) {
      // No telemetry yet — stay on Sri Lanka view
      map.setView(SRI_LANKA, 7);
    }
  }, [leafletLoaded, data]);

  // ── Status color helper ────────────────────────────────────────────────
  const statusColors: Record<string, string> = {
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    in_transit: "bg-blue-50 text-blue-700 border-blue-200",
    delivered: "bg-emerald-50 text-emerald-700 border-emerald-200",
    cancelled: "bg-red-50 text-red-700 border-red-200",
  };
  const statusColor = data ? (statusColors[data.status] ?? "bg-gray-100 text-gray-700 border-gray-200") : "";

  let shockMagnitude: number | null = data?.shock_magnitude ?? null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-gray-500">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm">Loading tracking information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <Package className="w-16 h-16 text-gray-300 mb-4" />
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Shipment Not Found</h1>
        <p className="text-gray-500 text-center">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 font-sans selection:bg-blue-200">
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css" />
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"
        strategy="afterInteractive"
        onLoad={() => setLeafletLoaded(true)}
      />

      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight">CargoSafe</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-sm font-medium text-gray-500">
              Tracking: <span className="font-mono text-gray-900 ml-1 bg-gray-100 px-2 py-1 rounded">{data.tracking_code}</span>
            </div>
            {/* Live polling indicator */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
              <Wifi className="w-3.5 h-3.5" />
              Live
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column: map + sensor cards */}
        <div className="lg:col-span-2 space-y-6">

          {/* Map card */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold">{data.description}</h1>
                  <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                    <span className="font-medium text-gray-900">{data.origin}</span>
                    <Navigation2 className="w-3.5 h-3.5 text-gray-400" />
                    <span className="font-medium text-gray-900">{data.destination}</span>
                  </div>
                </div>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${statusColor}`}>
                  {data.status?.replace("_", " ")}
                </span>
              </div>
            </div>

            {/* Leaflet map */}
            <div className="bg-gray-100 h-[380px] relative overflow-hidden">
              <div ref={mapRef} className="absolute inset-0 z-0" />
              {!leafletLoaded && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-gray-400">
                  <MapPin className="w-10 h-10 text-gray-300 mb-3 animate-bounce" />
                  <p className="font-medium text-sm">Loading map...</p>
                </div>
              )}
              {leafletLoaded && (!data.location && (!data.path || data.path.length === 0)) && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-[400] bg-white/90 backdrop-blur-sm border border-gray-200 rounded-full px-4 py-1.5 text-xs text-gray-500 font-medium shadow-sm">
                  No GPS data yet — waiting for device telemetry
                </div>
              )}
            </div>

            {/* Map legend + last-updated */}
            <div className="bg-white px-6 py-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 font-medium">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#1a6fff]" />Current Location</span>
                <span className="flex items-center gap-1.5"><div className="w-4 h-0.5 border-t-2 border-dashed border-[#00c9a7]" />Travel Path</span>
              </div>
              {lastUpdated && (
                <span className="flex items-center gap-1 text-gray-400">
                  <RefreshCw className="w-3 h-3" />
                  Updated {lastUpdated.toLocaleTimeString()} · auto-refreshes every 15s
                </span>
              )}
            </div>
          </div>

          {/* Sensor cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {/* Temperature */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex items-start gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                data.temp !== null && data.temp > 35
                  ? "bg-red-50 text-red-500"
                  : data.temp !== null && data.temp > 30
                  ? "bg-orange-50 text-orange-500"
                  : "bg-orange-50 text-orange-400"
              }`}>
                <Thermometer className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Temperature</p>
                <p className="text-2xl font-bold text-gray-900">
                  {data.temp !== null ? `${data.temp}°C` : "—"}
                </p>
                {data.temp !== null && data.temp > 35 && (
                  <p className="text-xs text-red-500 font-medium mt-1">⚠ Critical</p>
                )}
                {data.temp !== null && data.temp > 30 && data.temp <= 35 && (
                  <p className="text-xs text-orange-500 font-medium mt-1">⚠ Warning</p>
                )}
              </div>
            </div>

            {/* Humidity */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex items-start gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                data.hum !== null && data.hum > 80
                  ? "bg-amber-50 text-amber-500"
                  : "bg-blue-50 text-blue-400"
              }`}>
                <Droplets className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Humidity</p>
                <p className="text-2xl font-bold text-gray-900">
                  {data.hum !== null ? `${data.hum}%` : "—"}
                </p>
                {data.hum !== null && data.hum > 80 && (
                  <p className="text-xs text-amber-500 font-medium mt-1">⚠ High</p>
                )}
              </div>
            </div>

            {/* Shock */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex items-start gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                shockMagnitude !== null && shockMagnitude > 20
                  ? "bg-red-50 text-red-500"
                  : shockMagnitude !== null && shockMagnitude > 15
                  ? "bg-orange-50 text-orange-500"
                  : "bg-green-50 text-green-500"
              }`}>
                <Navigation2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Shock</p>
                <p className="text-2xl font-bold text-gray-900">
                  {shockMagnitude !== null ? `${shockMagnitude.toFixed(1)}` : "—"}
                </p>
                {shockMagnitude !== null && shockMagnitude > 20 && (
                  <p className="text-xs text-red-500 font-medium mt-1">⚠ Critical</p>
                )}
                {shockMagnitude !== null && shockMagnitude > 15 && shockMagnitude <= 20 && (
                  <p className="text-xs text-orange-500 font-medium mt-1">⚠ Warning</p>
                )}
              </div>
            </div>

            {/* Vibration */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex items-start gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                data.vibration !== null && data.vibration !== undefined && data.vibration > 1.0
                  ? "bg-red-50 text-red-500"
                  : data.vibration !== null && data.vibration !== undefined && data.vibration > 0.5
                  ? "bg-orange-50 text-orange-500"
                  : "bg-purple-50 text-purple-500"
              }`}>
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Vibration</p>
                <p className="text-2xl font-bold text-gray-900">
                  {data.vibration !== null && data.vibration !== undefined ? `${data.vibration.toFixed(2)}` : "—"}
                </p>
                {data.vibration !== null && data.vibration !== undefined && data.vibration > 1.0 && (
                  <p className="text-xs text-red-500 font-medium mt-1">⚠ Critical</p>
                )}
                {data.vibration !== null && data.vibration !== undefined && data.vibration > 0.5 && data.vibration <= 1.0 && (
                  <p className="text-xs text-orange-500 font-medium mt-1">⚠ Warning</p>
                )}
              </div>
            </div>

            {/* Tilt */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex items-start gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                data.tilt !== null && data.tilt !== undefined && data.tilt > 45
                  ? "bg-red-50 text-red-500"
                  : data.tilt !== null && data.tilt !== undefined && data.tilt > 30
                  ? "bg-orange-50 text-orange-500"
                  : "bg-orange-50 text-orange-400"
              }`}>
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Tilt</p>
                <p className="text-2xl font-bold text-gray-900">
                  {data.tilt !== null && data.tilt !== undefined ? `${data.tilt.toFixed(1)}°` : "—"}
                </p>
                {data.tilt !== null && data.tilt !== undefined && data.tilt > 45 && (
                  <p className="text-xs text-red-500 font-medium mt-1">⚠ Critical</p>
                )}
                {data.tilt !== null && data.tilt !== undefined && data.tilt > 30 && data.tilt <= 45 && (
                  <p className="text-xs text-orange-500 font-medium mt-1">⚠ Warning</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right column: shipment info + transit history */}
        <div className="space-y-6">

          {/* Shipment details */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-gray-400" /> Shipment Details
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Tracking Code</span>
                <span className="font-mono font-medium text-gray-900 text-xs bg-gray-100 px-2 py-0.5 rounded">{data.tracking_code}</span>
              </div>
              {data.device_id && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Device</span>
                  <span className="font-mono font-medium text-gray-900 text-xs bg-gray-100 px-2 py-0.5 rounded">{data.device_id}</span>
                </div>
              )}
              {data.location && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Coordinates</span>
                  <span className="font-mono text-xs text-gray-600">
                    {data.location.lat.toFixed(4)}, {data.location.lon.toFixed(4)}
                  </span>
                </div>
              )}
              {data.last_update && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Last Signal</span>
                  <span className="text-gray-700 text-xs">{new Date(data.last_update).toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Transit History */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h2 className="font-bold text-lg mb-6 flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-400" /> Transit History
            </h2>
            <div className="relative border-l-2 border-gray-100 ml-3 space-y-6">
              {data.path?.slice(0, 8).map((point: any, i: number) => (
                <div key={i} className="relative pl-6">
                  <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-white border-2 border-blue-500" />
                  <p className="font-medium text-sm text-gray-900 mb-0.5">
                    {i === 0 ? "📍 Latest Location" : "Location Update"}
                  </p>
                  <p className="text-xs text-gray-500">{new Date(point.timestamp).toLocaleString()}</p>
                  {point.temp !== undefined && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      🌡 {point.temp}°C · 💧 {point.hum}% {point.shock_magnitude !== null ? `· ⚡ ${point.shock_magnitude.toFixed(1)}` : ""}
                    </p>
                  )}
                </div>
              ))}
              {(!data.path || data.path.length === 0) && (
                <div className="relative pl-6">
                  <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-white border-2 border-gray-300" />
                  <p className="font-medium text-sm text-gray-900 mb-0.5">Shipment Created</p>
                  <p className="text-xs text-gray-500">{data.last_update ? new Date(data.last_update).toLocaleString() : "Just now"}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
