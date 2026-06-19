"use client"
import Navbar from "@/components/Navbar";
import { MapPin, Smartphone, Signal, SignalLow, ArrowRight, RefreshCw } from "lucide-react";
import { useEffect, useState, useRef, useCallback } from "react";
import { api } from "@/services/api";
import Script from "next/script";
import Link from "next/link";

const SRI_LANKA: [number, number] = [7.8731, 80.7718];
const POLL_INTERVAL = 30_000;

export default function FleetMap() {
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<any>(null);

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  const loadDevices = useCallback(async () => {
    try {
      const devs = await api.get("/devices");

      // For each device, try to get latest telemetry for location
      const enriched = await Promise.all(
        devs.map(async (d: any) => {
          try {
            const tel = await api.get(`/devices/${d.id}/telemetry?limit=1`);
            const latest = tel.records?.[0] || null;
            return { ...d, latest };
          } catch {
            return { ...d, latest: null };
          }
        })
      );

      setDevices(enriched);
      setLastUpdated(new Date());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDevices();
    const interval = setInterval(loadDevices, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [loadDevices]);

  // Initialize map
  useEffect(() => {
    if (!leafletLoaded || !mapRef.current || mapInstanceRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    const map = L.map(mapRef.current).setView(SRI_LANKA, 7);
    mapInstanceRef.current = map;

    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: "abcd",
      maxZoom: 20,
    }).addTo(map);
  }, [leafletLoaded]);

  // Update markers when data changes
  useEffect(() => {
    if (!leafletLoaded || !mapInstanceRef.current) return;
    const L = (window as any).L;
    if (!L) return;
    const map = mapInstanceRef.current;

    // Clear old markers
    markersRef.current.forEach((m) => map.removeLayer(m));
    markersRef.current = [];

    const validDevices = devices.filter(
      (d) => d.latest?.lat && d.latest?.lon
    );

    validDevices.forEach((device) => {
      const isOnline = device.status === "online";
      let shockMagnitude: number | null = null;
      if (device.latest?.shock_x !== undefined && device.latest?.shock_y !== undefined && device.latest?.shock_z !== undefined && device.latest?.shock_x !== null) {
        shockMagnitude = Math.sqrt(device.latest.shock_x ** 2 + device.latest.shock_y ** 2 + device.latest.shock_z ** 2);
      }
      const hasAlert = device.latest?.temp > 35 || (shockMagnitude !== null && shockMagnitude > 20);

      const color = hasAlert ? "#ff4d6d" : isOnline ? "#00c9a7" : "#8a9bc0";

      const icon = L.divIcon({
        className: "custom-div-icon",
        html: `<div style="position:relative;width:28px;height:28px;">
          <div style="position:absolute;inset:0;background:${color};border-radius:50%;opacity:0.25;${isOnline ? 'animation:cs-map-pulse 2s infinite;' : ''}"></div>
          <div style="position:absolute;top:6px;left:6px;width:16px;height:16px;background:${color};border-radius:50%;border:2px solid #0d1527;"></div>
          <style>
            @keyframes cs-map-pulse {
              0%   { box-shadow: 0 0 0 0 ${color}99; transform: scale(1); }
              70%  { box-shadow: 0 0 0 12px ${color}00; transform: scale(1.15); }
              100% { box-shadow: 0 0 0 0 ${color}00; transform: scale(1); }
            }
          </style>
        </div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L.marker([device.latest.lat, device.latest.lon], { icon })
        .addTo(map)
        .on("click", () => setSelectedDevice(device));

      marker.bindTooltip(
        `<b>${device.device_id}</b>${device.label ? `<br>${device.label}` : ""}<br><span style="color:${color};font-weight:bold;text-transform:uppercase;font-size:10px;">${device.status}</span>`,
        {
          className: "custom-tooltip",
          direction: "top",
          offset: [0, -16],
        }
      );

      markersRef.current.push(marker);
    });

    // Fit bounds if there are markers
    if (validDevices.length > 1) {
      const bounds = L.latLngBounds(
        validDevices.map((d: any) => [d.latest.lat, d.latest.lon])
      );
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 14 });
    } else if (validDevices.length === 1) {
      map.setView([validDevices[0].latest.lat, validDevices[0].latest.lon], 13);
    }
  }, [leafletLoaded, devices]);

  const onlineCount = devices.filter((d) => d.status === "online").length;
  const withGPS = devices.filter((d) => d.latest?.lat && d.latest?.lon).length;

  return (
    <>
      <Navbar />
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css"
      />
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"
        strategy="afterInteractive"
        onLoad={() => setLeafletLoaded(true)}
      />

      <style jsx global>{`
        .custom-tooltip {
          background: #0d1527 !important;
          border: 1px solid rgba(255,255,255,0.1) !important;
          border-radius: 10px !important;
          padding: 8px 12px !important;
          color: #f0f4ff !important;
          font-family: Inter, sans-serif !important;
          font-size: 12px !important;
          box-shadow: 0 8px 32px rgba(0,0,0,0.4) !important;
        }
        .custom-tooltip::before {
          border-top-color: rgba(255,255,255,0.1) !important;
        }
      `}</style>

      <main className="flex-1 flex flex-col h-[calc(100vh-64px)]">
        {/* Top Bar */}
        <div className="px-4 sm:px-6 lg:px-8 py-4 border-b border-edge bg-base/85 backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 z-10">
          <div>
            <h1 className="font-display text-2xl font-extrabold text-txt-primary flex items-center gap-2">
              <MapPin className="w-6 h-6 text-neon" /> Fleet Map
            </h1>
            <p className="text-sm text-txt-secondary mt-0.5">
              {devices.length} devices · {onlineCount} online · {withGPS} with GPS
            </p>
          </div>
          <div className="flex items-center gap-3">
            {lastUpdated && (
              <span className="text-xs text-txt-muted flex items-center gap-1">
                <RefreshCw className="w-3 h-3" /> {lastUpdated.toLocaleTimeString()} · auto-refreshes
              </span>
            )}
            {/* Legend */}
            <div className="hidden sm:flex items-center gap-3 text-xs text-txt-secondary">
              <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-teal" />Online</span>
              <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-[#8a9bc0]" />Offline</span>
              <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-coral" />Alert</span>
            </div>
          </div>
        </div>

        {/* Map Container */}
        <div className="flex-1 relative">
          <div ref={mapRef} className="absolute inset-0 z-0" />

          {!leafletLoaded && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-base">
              <div className="flex flex-col items-center gap-3 text-txt-muted">
                <MapPin className="w-10 h-10 animate-bounce" />
                <p className="text-sm font-medium">Loading fleet map...</p>
              </div>
            </div>
          )}

          {loading && leafletLoaded && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[400] bg-surface border border-edge rounded-full px-4 py-2 text-xs text-txt-secondary font-medium shadow-card backdrop-blur-xl flex items-center gap-2">
              <div className="w-3 h-3 border-2 border-neon border-t-transparent rounded-full animate-spin" />
              Loading devices...
            </div>
          )}

          {/* Selected Device Sidebar */}
          {selectedDevice && (
            <div className="absolute top-4 right-4 z-[500] w-80 max-w-[calc(100vw-2rem)] rounded-2xl border border-edge bg-surface backdrop-blur-2xl shadow-2xl overflow-hidden animate-fade-up">
              <div className="p-5 border-b border-edge bg-black/20">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-neon/10 text-neon flex items-center justify-center">
                      <Smartphone className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-txt-primary">{selectedDevice.device_id}</h3>
                      <p className="text-xs text-txt-secondary">{selectedDevice.label || "No label"}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedDevice(null)}
                    className="text-txt-muted hover:text-txt-primary transition-colors text-lg leading-none"
                  >
                    ×
                  </button>
                </div>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    selectedDevice.status === "online"
                      ? "bg-teal/10 text-teal border border-teal/20"
                      : "bg-txt-muted/10 text-txt-secondary border border-edge"
                  }`}
                >
                  {selectedDevice.status === "online" ? <Signal className="w-3 h-3" /> : <SignalLow className="w-3 h-3" />}
                  {selectedDevice.status}
                </span>
              </div>

              {selectedDevice.latest && (
                <div className="p-5 grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-black/30 rounded-xl p-3 text-center">
                    <p className="text-xs text-txt-muted mb-1">🌡 Temp</p>
                    <p className={`font-bold ${selectedDevice.latest.temp > 35 ? 'text-coral' : selectedDevice.latest.temp > 30 ? 'text-amber' : 'text-txt-primary'}`}>
                      {selectedDevice.latest.temp}°C
                    </p>
                  </div>
                  <div className="bg-black/30 rounded-xl p-3 text-center">
                    <p className="text-xs text-txt-muted mb-1">💧 Humidity</p>
                    <p className={`font-bold ${selectedDevice.latest.hum > 80 ? 'text-amber' : 'text-txt-primary'}`}>
                      {selectedDevice.latest.hum}%
                    </p>
                  </div>
                  <div className="bg-black/30 rounded-xl p-3 text-center">
                    <p className="text-xs text-txt-muted mb-1">⚡ Shock</p>
                    <p className={`font-bold ${
                      selectedDevice.latest.shock_x !== undefined && selectedDevice.latest.shock_x !== null &&
                      Math.sqrt(selectedDevice.latest.shock_x**2 + selectedDevice.latest.shock_y**2 + selectedDevice.latest.shock_z**2) > 20 
                        ? 'text-coral' : 'text-txt-primary'
                    }`}>
                      {selectedDevice.latest.shock_x !== undefined && selectedDevice.latest.shock_x !== null
                        ? `${Math.sqrt(selectedDevice.latest.shock_x**2 + selectedDevice.latest.shock_y**2 + selectedDevice.latest.shock_z**2).toFixed(1)} m/s²`
                        : '—'}
                    </p>
                  </div>
                  <div className="bg-black/30 rounded-xl p-3 text-center">
                    <p className="text-xs text-txt-muted mb-1">📍 GPS</p>
                    <p className="font-mono text-[10px] text-txt-primary leading-tight">
                      {Number(selectedDevice.latest.lat).toFixed(3)}, {Number(selectedDevice.latest.lon).toFixed(3)}
                    </p>
                  </div>
                </div>
              )}

              <div className="px-5 pb-5">
                <Link
                  href={`/devices/${selectedDevice.id}`}
                  className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-gradient-to-r from-neon to-teal rounded-xl font-semibold text-white text-sm shadow-neon-btn hover:shadow-neon-btn-hover hover:-translate-y-0.5 transition-all"
                >
                  View Full Details <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}

          {/* No GPS data overlay */}
          {!loading && leafletLoaded && withGPS === 0 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[400] bg-surface border border-edge rounded-full px-5 py-2.5 text-xs text-txt-muted font-medium shadow-card backdrop-blur-xl">
              No devices with GPS data — send telemetry with coordinates to see markers
            </div>
          )}
        </div>
      </main>
    </>
  );
}
