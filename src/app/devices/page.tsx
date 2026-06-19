"use client"
import Navbar from "@/components/Navbar";
import { Plus, Smartphone, Signal, SignalLow, Key, Trash2, X, Search, Copy, Check, RefreshCw, ArrowRight } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { api } from "@/services/api";
import Link from "next/link";

/** Generate a suggested device code that doesn't clash with existing ones */
function suggestDeviceId(existing: string[]): string {
  const prefixes = ["CS", "TRK", "SNS", "DEV", "IOT"];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  let attempt = "";
  do {
    const num = Math.floor(1000 + Math.random() * 9000); // 4-digit number
    attempt = `${prefix}-${num}`;
  } while (existing.includes(attempt));
  return attempt;
}

export default function Devices() {
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newDeviceId, setNewDeviceId] = useState("");
  const [newDeviceLabel, setNewDeviceLabel] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadDevices = useCallback(async () => {
    try {
      const data = await api.get("/devices");
      setDevices(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDevices();
  }, [loadDevices]);

  /** Open modal and pre-fill a unique suggested device ID */
  function openAddModal() {
    const existingIds = devices.map((d) => d.device_id);
    setNewDeviceId(suggestDeviceId(existingIds));
    setNewDeviceLabel("");
    setIsAddModalOpen(true);
  }

  function closeModal() {
    setIsAddModalOpen(false);
    setNewDeviceId("");
    setNewDeviceLabel("");
  }

  async function handleAddDevice(e: React.FormEvent) {
    e.preventDefault();
    if (newDeviceId) {
      try {
        await api.post("/devices", { device_id: newDeviceId, label: newDeviceLabel });
        closeModal();
        loadDevices();
      } catch (err: any) {
        alert(err.message || "Failed to add device");
      }
    }
  }

  async function deleteDevice(id: string) {
    if (confirm("Are you sure you want to delete this device?")) {
      try {
        await api.delete(`/devices/${id}`);
        loadDevices();
      } catch (err: any) {
        alert(err.message || "Failed to delete device");
      }
    }
  }

  const filtered = devices.filter(
    (d) =>
      d.device_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.label && d.label.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <>
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl font-extrabold text-txt-primary">Devices</h1>
            <p className="text-txt-secondary mt-1">Manage your IoT tracking hardware</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-txt-muted" />
              <input
                type="text"
                placeholder="Search devices..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2.5 rounded-xl border border-edge bg-surface text-sm text-txt-primary focus:outline-none focus:border-neon focus:ring-1 focus:ring-neon transition-all"
              />
            </div>
            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-neon to-teal rounded-xl font-body font-semibold text-white text-sm shadow-neon-btn transition-all duration-300 hover:-translate-y-0.5 hover:shadow-neon-btn-hover"
            >
              <Plus className="w-4 h-4" /> Add Device
            </button>
          </div>
        </div>

        {loading ? (
          <div className="animate-pulse grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-surface rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((device, i) => (
              <div
                key={device.id}
                className="relative overflow-hidden rounded-2xl border border-edge bg-surface backdrop-blur-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:border-white/15 shadow-card group animate-fade-up"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-neon/10 text-neon flex items-center justify-center">
                      <Smartphone className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-txt-primary text-lg">{device.device_id}</h3>
                      <p className="text-sm text-txt-secondary">{device.label || "No Label"}</p>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide ${
                      device.status === "online"
                        ? "bg-teal/10 text-teal border border-teal/20"
                        : "bg-txt-muted/10 text-txt-secondary border border-edge"
                    }`}
                  >
                    {device.status === "online" ? <Signal className="w-3 h-3" /> : <SignalLow className="w-3 h-3" />}
                    {device.status}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-black/30 border border-edge flex items-center gap-3 mb-4">
                  <Key className="w-4 h-4 text-amber flex-shrink-0" />
                  <div className="flex-1 font-mono text-xs text-txt-secondary truncate">{device.api_key}</div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(device.api_key);
                      setCopiedId(device.id);
                      setTimeout(() => setCopiedId(null), 2000);
                    }}
                    className="p-1.5 text-txt-muted hover:text-txt-primary hover:bg-white/10 rounded-md transition-all"
                    title="Copy API Key"
                  >
                    {copiedId === device.id ? <Check className="w-4 h-4 text-teal" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                <div className="flex items-center justify-between mt-4">
                  <p className="text-xs text-txt-muted">Added {new Date(device.created_at).toLocaleDateString()}</p>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/devices/${device.id}`}
                      className="inline-flex items-center gap-1 text-xs font-medium text-neon hover:text-white transition-colors"
                    >
                      Details <ArrowRight className="w-3 h-3" />
                    </Link>
                    <button
                      onClick={() => deleteDevice(device.id)}
                      className="p-2 text-txt-secondary hover:text-coral hover:bg-coral/10 rounded-lg transition-colors"
                      title="Delete device"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {filtered.length === 0 && !loading && (
              <div className="col-span-full py-12 text-center text-txt-secondary">
                {searchQuery ? `No devices match "${searchQuery}"` : 'No devices registered. Click "Add Device" to get started.'}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Add Device Modal — click backdrop to close */}
      {isAddModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={closeModal}          // ← close when clicking outside
        >
          <div
            className="bg-surface border border-edge rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-fade-up"
            onClick={(e) => e.stopPropagation()} // ← prevent bubble from closing
          >
            <div className="flex justify-between items-center p-6 border-b border-edge bg-black/20">
              <h3 className="font-display text-xl font-bold text-txt-primary">Add New Device</h3>
              <button onClick={closeModal} className="text-txt-secondary hover:text-txt-primary transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddDevice} className="p-6">
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-sm font-medium text-txt-secondary">Device ID</label>
                    <button
                      type="button"
                      onClick={() => setNewDeviceId(suggestDeviceId(devices.map((d) => d.device_id)))}
                      className="inline-flex items-center gap-1 text-xs text-neon hover:text-white transition-colors"
                      title="Generate a new suggestion"
                    >
                      <RefreshCw className="w-3 h-3" /> Regenerate
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={newDeviceId}
                    onChange={(e) => setNewDeviceId(e.target.value)}
                    className="w-full bg-black/30 border border-edge rounded-xl px-4 py-2.5 text-txt-primary font-mono focus:outline-none focus:border-neon focus:ring-1 focus:ring-neon transition-all"
                    placeholder="e.g. CS-1042"
                  />
                  <p className="mt-1.5 text-xs text-txt-muted">
                    Auto-suggested unique code — edit freely before adding.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-txt-secondary mb-1">Label (Optional)</label>
                  <input
                    type="text"
                    value={newDeviceLabel}
                    onChange={(e) => setNewDeviceLabel(e.target.value)}
                    className="w-full bg-black/30 border border-edge rounded-xl px-4 py-2.5 text-txt-primary focus:outline-none focus:border-neon focus:ring-1 focus:ring-neon transition-all"
                    placeholder="e.g. Truck 12 Sensor"
                  />
                </div>
              </div>
              <div className="mt-8 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-5 py-2.5 rounded-xl font-medium text-txt-secondary hover:text-txt-primary hover:bg-white/5 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-neon to-teal rounded-xl font-semibold text-white shadow-neon-btn hover:shadow-neon-btn-hover transition-all"
                >
                  Add Device
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
