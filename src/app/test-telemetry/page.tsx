"use client"
import { useState, useEffect, useRef } from "react"
import { ShieldAlert, Zap, Send, Activity, Thermometer, Droplets, Battery, MapPin } from "lucide-react"
import Script from "next/script"
import { api } from "@/services/api"
import ModernDropdown from "@/components/ModernDropdown"

export default function TestTelemetryPage() {
  const [devices, setDevices] = useState<any[]>([])
  const [deviceId, setDeviceId] = useState("")
  const [apiKey, setApiKey] = useState("")
  const [temp, setTemp] = useState(25)
  const [hum, setHum] = useState(50)
  const [shockX, setShockX] = useState(0)
  const [shockY, setShockY] = useState(0)
  const [shockZ, setShockZ] = useState(9.8)
  const [vibration, setVibration] = useState(0)
  const [tilt, setTilt] = useState(0)
  const [flags, setFlags] = useState<string[]>([])
  const [lat, setLat] = useState<number | "">("")
  const [lon, setLon] = useState<number | "">("")
  const [response, setResponse] = useState<string>("")
  const [loading, setLoading] = useState(false)

  const [leafletLoaded, setLeafletLoaded] = useState(false)
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markerRef = useRef<any>(null)

  // Fetch available devices using API service
  useEffect(() => {
    api.get("/devices")
      .then(data => {
        if (Array.isArray(data)) {
          setDevices(data)
        }
      })
      .catch(error => {
        console.error("Failed to fetch devices:", error)
      })
  }, [])

  const handleDeviceChange = (selectedDeviceId: string) => {
    setDeviceId(selectedDeviceId);
    // Auto-fill the API key when a device is selected
    const selectedDevice = devices.find(d => d.device_id === selectedDeviceId);
    if (selectedDevice?.api_key) {
      setApiKey(selectedDevice.api_key);
    } else {
      setApiKey("");
    }
  }

  // Initialize Leaflet Map
  useEffect(() => {
    if (!leafletLoaded || !mapRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    if (!mapInstanceRef.current) {
      // Default to Sri Lanka (center of CargoSafe operations)
      const map = L.map(mapRef.current).setView([7.8731, 80.7718], 7);
      mapInstanceRef.current = map;

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 20
      }).addTo(map);

      map.on('click', (e: any) => {
        const selectedLat = parseFloat(e.latlng.lat.toFixed(6));
        const selectedLon = parseFloat(e.latlng.lng.toFixed(6));
        setLat(selectedLat);
        setLon(selectedLon);

        if (markerRef.current) {
          markerRef.current.setLatLng(e.latlng);
        } else {
          markerRef.current = L.marker(e.latlng).addTo(map);
        }
      });
    }
  }, [leafletLoaded]);

  async function handleSend() {
    setLoading(true)
    try {
      const payload = {
        device_id: deviceId,
        api_key: apiKey,
        timestamp: new Date().toISOString(),
        temp: temp,
        hum: hum,
        shock_x: shockX,
        shock_y: shockY,
        shock_z: shockZ,
        vibration: vibration,
        tilt: tilt,
        flags: flags.length > 0 ? flags : undefined,
        ...(lat !== "" && { lat: Number(lat) }),
        ...(lon !== "" && { lon: Number(lon) }),
      }

      const res = await fetch("/api/telemetry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      setResponse(JSON.stringify(data, null, 2))
    } catch (error: any) {
      setResponse(JSON.stringify({ error: error.message }, null, 2))
    } finally {
      setLoading(false)
    }
  }

  // Threshold colors
  const getTempColor = (val: number) => val > 35 ? "text-coral border-coral" : val > 30 ? "text-amber border-amber" : "text-neon border-neon"
  const getHumColor = (val: number) => val > 80 ? "text-amber border-amber" : "text-neon border-neon"
  const getShockColor = (val: number) => Math.abs(val) > 15 ? "text-amber border-amber" : "text-teal border-teal"
  const getVibrationColor = (val: number) => val > 1.0 ? "text-coral border-coral" : val > 0.5 ? "text-amber border-amber" : "text-violet border-violet"
  const getTiltColor = (val: number) => val > 45 ? "text-coral border-coral" : val > 30 ? "text-amber border-amber" : "text-amber border-amber"

  const availableFlags = ["TEMP_HI", "TEMP_LO", "HUM_HI", "HUM_LO", "SHOCK", "VIBRATION", "TILT"]
  
  const toggleFlag = (flag: string) => {
    setFlags(prev => prev.includes(flag) ? prev.filter(f => f !== flag) : [...prev, flag])
  }

  return (
    <div className="min-h-screen bg-base text-txt-primary font-body relative overflow-x-hidden p-4 py-12">
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css" />
      <Script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js" strategy="afterInteractive" onLoad={() => setLeafletLoaded(true)} />

      {/* Background Atmosphere */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`, backgroundSize: "52px 52px" }} />
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,#1a6fff_0%,#0a3a8a_60%,transparent_100%)] blur-[110px] opacity-[0.18] animate-orb-drift" />
      </div>

      <div className="relative z-10 w-full max-w-3xl mx-auto">
        <div className="mb-8 text-center animate-fade-up">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-neon to-teal p-0.5 shadow-glow mb-4">
            <div className="w-full h-full bg-base rounded-2xl flex items-center justify-center">
              <Activity className="w-8 h-8 text-transparent bg-clip-text bg-gradient-to-br from-neon to-teal" />
            </div>
          </div>
          <h1 className="font-display text-4xl font-extrabold tracking-tight mb-2">IoT Telemetry Simulator</h1>
          <p className="text-txt-secondary max-w-md mx-auto">
            Manually dispatch sensor payloads to validate Firebase triggers, offline queues, and real-time alerts.
          </p>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-edge bg-surface backdrop-blur-2xl shadow-card transition-all duration-300 animate-fade-up" style={{ animationDelay: "0.1s" }}>
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-neon/40 to-transparent" />

          <div className="p-6 sm:p-8 space-y-8">

            {/* Device Credentials */}
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-txt-secondary uppercase tracking-wider flex items-center gap-2">
                <ShieldAlert className="w-4 h-4" /> Device Credentials
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ModernDropdown
                  options={[
                    { value: "", label: "Select a device..." },
                    ...devices.map(d => ({
                      value: d.device_id,
                      label: d.device_id,
                      badge: d.label || undefined,
                    }))
                  ]}
                  value={deviceId}
                  onChange={handleDeviceChange}
                  placeholder="Select a device..."
                  label="Device"
                />
                <div className="relative group">
                  <input
                    type="text"
                    placeholder="API Key (auto-filled on device select)"
                    value={apiKey}
                    onChange={e => setApiKey(e.target.value)}
                    readOnly={!!apiKey && devices.some(d => d.device_id === deviceId)}
                    className="w-full px-4 py-3 rounded-xl border border-edge bg-black/40 text-txt-primary font-mono text-xs placeholder:text-txt-muted outline-none transition-all focus:border-neon focus:bg-neon/[0.05] focus:ring-2 focus:ring-neon/15 hover:border-white/15"
                  />
                  {apiKey && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-teal font-semibold">AUTO</span>
                  )}
                </div>
              </div>
            </div>

            <hr className="border-edge" />

            {/* Sensor Data */}
            <div className="space-y-6">
              <h2 className="text-sm font-bold text-txt-secondary uppercase tracking-wider flex items-center gap-2">
                <Zap className="w-4 h-4" /> Sensor Payload
              </h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm font-medium"><Thermometer className="w-4 h-4 text-neon" /> Temperature (°C)</label>
                  <span className={`text-xs font-mono px-2 py-0.5 rounded-md border ${getTempColor(temp)} bg-white/[0.03]`}>{temp}°C</span>
                </div>
                <input type="range" min="-20" max="60" step="0.5" value={temp} onChange={e => setTemp(parseFloat(e.target.value))} className="w-full accent-neon" />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm font-medium"><Droplets className="w-4 h-4 text-teal" /> Humidity (%)</label>
                  <span className={`text-xs font-mono px-2 py-0.5 rounded-md border ${getHumColor(hum)} bg-white/[0.03]`}>{hum}%</span>
                </div>
                <input type="range" min="0" max="100" step="1" value={hum} onChange={e => setHum(parseFloat(e.target.value))} className="w-full accent-teal" />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm font-medium"><Activity className="w-4 h-4 text-amber" /> Shock X (m/s²)</label>
                  <span className={`text-xs font-mono px-2 py-0.5 rounded-md border ${getShockColor(shockX)} bg-white/[0.03]`}>{shockX.toFixed(1)}</span>
                </div>
                <input type="range" min="-30" max="30" step="0.5" value={shockX} onChange={e => setShockX(parseFloat(e.target.value))} className="w-full accent-amber" />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm font-medium"><Activity className="w-4 h-4 text-amber" /> Shock Y (m/s²)</label>
                  <span className={`text-xs font-mono px-2 py-0.5 rounded-md border ${getShockColor(shockY)} bg-white/[0.03]`}>{shockY.toFixed(1)}</span>
                </div>
                <input type="range" min="-30" max="30" step="0.5" value={shockY} onChange={e => setShockY(parseFloat(e.target.value))} className="w-full accent-amber" />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm font-medium"><Activity className="w-4 h-4 text-amber" /> Shock Z (m/s²)</label>
                  <span className={`text-xs font-mono px-2 py-0.5 rounded-md border ${getShockColor(shockZ)} bg-white/[0.03]`}>{shockZ.toFixed(1)}</span>
                </div>
                <input type="range" min="-30" max="30" step="0.5" value={shockZ} onChange={e => setShockZ(parseFloat(e.target.value))} className="w-full accent-amber" />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm font-medium"><Activity className="w-4 h-4 text-violet" /> Vibration</label>
                  <span className={`text-xs font-mono px-2 py-0.5 rounded-md border ${getVibrationColor(vibration)} bg-white/[0.03]`}>{vibration.toFixed(2)}</span>
                </div>
                <input type="range" min="0" max="2" step="0.01" value={vibration} onChange={e => setVibration(parseFloat(e.target.value))} className="w-full accent-violet" />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm font-medium"><Activity className="w-4 h-4 text-amber" /> Tilt (°)</label>
                  <span className={`text-xs font-mono px-2 py-0.5 rounded-md border ${getTiltColor(tilt)} bg-white/[0.03]`}>{tilt.toFixed(1)}°</span>
                </div>
                <input type="range" min="0" max="90" step="0.5" value={tilt} onChange={e => setTilt(parseFloat(e.target.value))} className="w-full accent-amber" />
              </div>
            </div>

            <hr className="border-edge" />

            {/* Device Flags */}
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-txt-secondary uppercase tracking-wider flex items-center gap-2">
                <ShieldAlert className="w-4 h-4" /> Device Flags
              </h2>
              <div className="flex flex-wrap gap-2">
                {availableFlags.map(flag => (
                  <button
                    key={flag}
                    onClick={() => toggleFlag(flag)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors border ${
                      flags.includes(flag)
                        ? "bg-neon/20 text-neon border-neon"
                        : "bg-surface text-txt-muted border-edge hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    {flag}
                  </button>
                ))}
              </div>
            </div>

            <hr className="border-edge" />

            {/* GPS Location (Visual Map) */}
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-txt-secondary uppercase tracking-wider flex items-center gap-2 justify-between">
                <span className="flex items-center gap-2"><MapPin className="w-4 h-4" /> Visual GPS Selection</span>
                <span className="text-xs font-normal text-txt-muted">Click map to set location</span>
              </h2>

              <div className="h-64 bg-black/40 rounded-xl border border-edge relative overflow-hidden flex flex-col items-center justify-center">
                <div ref={mapRef} className="absolute inset-0 z-0 cursor-crosshair"></div>
                {!leafletLoaded && (
                  <div className="z-10 flex flex-col items-center justify-center text-txt-muted">
                    <Activity className="w-6 h-6 mb-2 animate-spin text-neon" />
                    <span className="text-sm">Loading visual map...</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                <input type="number" placeholder="Latitude" value={lat} readOnly
                  className="w-full px-4 py-3 rounded-xl border border-edge bg-black/40 text-txt-primary font-body text-sm placeholder:text-txt-muted outline-none cursor-not-allowed opacity-70" />
                <input type="number" placeholder="Longitude" value={lon} readOnly
                  className="w-full px-4 py-3 rounded-xl border border-edge bg-black/40 text-txt-primary font-body text-sm placeholder:text-txt-muted outline-none cursor-not-allowed opacity-70" />
              </div>
            </div>

            <button
              onClick={handleSend}
              disabled={loading || !deviceId || !apiKey}
              className="relative group w-full inline-flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-neon to-teal rounded-xl font-body font-bold text-white text-base shadow-neon-btn transition-all duration-300 hover:-translate-y-0.5 hover:shadow-neon-btn-hover active:translate-y-0 active:shadow-neon-btn disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {loading ? <Activity className="w-5 h-5 animate-spin" /> : <><Send className="w-5 h-5 transition-transform group-hover:translate-x-1" /> Dispatch Payload</>}
            </button>

            {response && (
              <div className="mt-6 animate-fade-in">
                <h3 className="text-xs font-bold text-txt-secondary uppercase tracking-wider mb-2">API Response</h3>
                <pre className="bg-black/40 p-4 rounded-xl border border-edge text-xs font-mono text-txt-secondary overflow-x-auto whitespace-pre-wrap">
                  {response}
                </pre>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}
