"use client"
import Navbar from "@/components/Navbar";
import { Plus, Search, Box, ArrowRight, X, ExternalLink, QrCode, Trash2, Copy, Check, TrendingUp, PackageCheck, XCircle, Clock } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { api } from "@/services/api";
import { QRCodeSVG } from "qrcode.react";
import Link from "next/link";

/** Shipment status config — label, colors */
const STATUS_OPTIONS = [
  {
    value: "pending",
    label: "Pending",
    className: "bg-amber/10 text-amber border-amber/20",
  },
  {
    value: "in_transit",
    label: "In Transit",
    className: "bg-neon/10 text-neon border-neon/20",
  },
  {
    value: "delivered",
    label: "Delivered",
    className: "bg-teal/10 text-teal border-teal/20",
  },
  {
    value: "cancelled",
    label: "Cancelled",
    className: "bg-coral/10 text-coral border-coral/20",
  },
] as const;

type StatusValue = (typeof STATUS_OPTIONS)[number]["value"];

function getStatusStyle(value: string) {
  return STATUS_OPTIONS.find((s) => s.value === value) ?? STATUS_OPTIONS[0];
}

export default function Shipments() {
  const [shipments, setShipments] = useState<any[]>([]);
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newDesc, setNewDesc] = useState("");
  const [newOrigin, setNewOrigin] = useState("");
  const [newDest, setNewDest] = useState("");
  const [newDevId, setNewDevId] = useState("");

  const [qrModalData, setQrModalData] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadShipments = useCallback(async () => {
    try {
      const data = await api.get("/shipments");
      setShipments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadDevices = useCallback(async () => {
    try {
      const data = await api.get("/devices");
      setDevices(data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    loadShipments();
    loadDevices();
  }, [loadShipments, loadDevices]);

  /**
   * Available devices = devices not currently assigned to an active (non-delivered/non-cancelled) shipment.
   * This prevents two active shipments sharing the same tracker.
   */
  const availableDevices = devices.filter((device) => {
    const activeShipment = shipments.find(
      (s) =>
        s.device_id === device.device_id &&
        s.status !== "delivered" &&
        s.status !== "cancelled"
    );
    return !activeShipment;
  });

  function openAddModal() {
    setNewDesc("");
    setNewOrigin("");
    setNewDest("");
    setNewDevId("");
    setIsAddModalOpen(true);
  }

  function closeAddModal() {
    setIsAddModalOpen(false);
  }

  async function handleAddShipment(e: React.FormEvent) {
    e.preventDefault();
    if (newDesc && newOrigin && newDest) {
      try {
        await api.post("/shipments", {
          description: newDesc,
          origin: newOrigin,
          destination: newDest,
          device_id: newDevId || null,
        });
        closeAddModal();
        loadShipments();
      } catch (err: any) {
        alert(err.message || "Failed to create shipment");
      }
    }
  }

  async function deleteShipment(id: string) {
    if (confirm("Are you sure you want to delete this shipment?")) {
      try {
        await api.delete(`/shipments/${id}`);
        loadShipments();
      } catch (err: any) {
        alert(err.message || "Failed to delete shipment");
      }
    }
  }

  async function handleStatusChange(shipmentId: string, newStatus: StatusValue) {
    setUpdatingId(shipmentId);
    try {
      await api.patch(`/shipments/${shipmentId}`, { status: newStatus });
      setShipments((prev) =>
        prev.map((s) => (s.id === shipmentId ? { ...s, status: newStatus } : s))
      );
    } catch (err: any) {
      alert(err.message || "Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <>
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl font-extrabold text-txt-primary">Shipments</h1>
            <p className="text-txt-secondary mt-1">Track and manage active routes</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-neon to-teal rounded-xl font-body font-semibold text-white text-sm shadow-neon-btn transition-all duration-300 hover:-translate-y-0.5 hover:shadow-neon-btn-hover"
            >
              <Plus className="w-4 h-4" /> New Shipment
            </button>
          </div>
        </div>

        {/* ─── Analytics Summary Bar ─── */}
        {!loading && shipments.length > 0 && (() => {
          const total = shipments.length;
          const pending = shipments.filter((s: any) => s.status === "pending").length;
          const inTransit = shipments.filter((s: any) => s.status === "in_transit").length;
          const delivered = shipments.filter((s: any) => s.status === "delivered").length;
          const cancelled = shipments.filter((s: any) => s.status === "cancelled").length;

          const summaryStats = [
            { label: "Total", value: total, icon: Box, color: "neon", pct: null },
            { label: "Pending", value: pending, icon: Clock, color: "amber", pct: Math.round((pending / total) * 100) },
            { label: "In Transit", value: inTransit, icon: TrendingUp, color: "neon", pct: Math.round((inTransit / total) * 100) },
            { label: "Delivered", value: delivered, icon: PackageCheck, color: "teal", pct: Math.round((delivered / total) * 100) },
            { label: "Cancelled", value: cancelled, icon: XCircle, color: "coral", pct: Math.round((cancelled / total) * 100) },
          ];

          return (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
              {summaryStats.map((stat, i) => (
                <div
                  key={stat.label}
                  className="relative overflow-hidden rounded-2xl border border-edge bg-surface backdrop-blur-xl p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/15 group animate-fade-up"
                  style={{ animationDelay: `${i * 0.07}s` }}
                >
                  <div className={`absolute -bottom-4 -right-3 w-14 h-14 rounded-full bg-${stat.color}/15 blur-2xl transition-transform group-hover:scale-125`} />
                  <div className="flex items-center justify-between mb-2">
                    <div className={`w-8 h-8 rounded-lg bg-${stat.color}/10 text-${stat.color} flex items-center justify-center`}>
                      <stat.icon className="w-4 h-4" />
                    </div>
                    {stat.pct !== null && (
                      <span className={`text-[10px] font-bold text-${stat.color} bg-${stat.color}/10 px-1.5 py-0.5 rounded-md`}>
                        {stat.pct}%
                      </span>
                    )}
                  </div>
                  <p className="font-display text-2xl font-extrabold text-txt-primary leading-none">{stat.value}</p>
                  <p className="text-[10px] font-medium text-txt-secondary mt-1 uppercase tracking-wider">{stat.label}</p>

                  {/* Mini progress bar */}
                  {stat.pct !== null && (
                    <div className="mt-2 h-1 rounded-full bg-edge overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-${stat.color} transition-all duration-700`}
                        style={{ width: `${stat.pct}%` }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          );
        })()}

        <div className="rounded-2xl border border-edge bg-surface backdrop-blur-xl overflow-hidden shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-edge bg-black/20">
                  <th className="px-6 py-4 text-xs font-semibold text-txt-secondary uppercase tracking-wider">Tracking Code</th>
                  <th className="px-6 py-4 text-xs font-semibold text-txt-secondary uppercase tracking-wider">Description</th>
                  <th className="px-6 py-4 text-xs font-semibold text-txt-secondary uppercase tracking-wider">Route</th>
                  <th className="px-6 py-4 text-xs font-semibold text-txt-secondary uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-semibold text-txt-secondary uppercase tracking-wider">Created</th>
                  <th className="px-6 py-4 text-xs font-semibold text-txt-secondary uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center">
                      <div className="animate-pulse h-4 bg-surface rounded w-1/2 mx-auto" />
                    </td>
                  </tr>
                ) : shipments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-txt-secondary">
                      No shipments found. Click &ldquo;New Shipment&rdquo; to create one.
                    </td>
                  </tr>
                ) : (
                  shipments.map((shipment) => {
                    const statusStyle = getStatusStyle(shipment.status);
                    return (
                      <tr key={shipment.id} className="hover:bg-surface-hover transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2 font-mono text-sm text-txt-primary">
                            <Box className="w-4 h-4 text-neon" />
                            {shipment.tracking_code}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-medium text-txt-primary">{shipment.description}</p>
                          <p className="text-xs text-txt-secondary mt-0.5">
                            Device: {shipment.device_id || "Unassigned"}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-sm text-txt-primary">
                            <span className="truncate max-w-[100px]">{shipment.origin}</span>
                            <ArrowRight className="w-3 h-3 text-txt-muted flex-shrink-0" />
                            <span className="truncate max-w-[100px]">{shipment.destination}</span>
                          </div>
                        </td>

                        {/* ─── Colored Status Dropdown ─── */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="relative inline-block">
                            <select
                              value={shipment.status}
                              disabled={updatingId === shipment.id}
                              onChange={(e) =>
                                handleStatusChange(shipment.id, e.target.value as StatusValue)
                              }
                              className={`appearance-none cursor-pointer pl-3 pr-7 py-1 rounded-full text-xs font-semibold tracking-wide border transition-all focus:outline-none focus:ring-1 focus:ring-white/20 disabled:opacity-50 ${statusStyle.className}`}
                            >
                              {STATUS_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value} className="bg-base text-txt-primary">
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                            {/* Chevron icon overlay */}
                            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 opacity-60">
                              <svg width="10" height="6" viewBox="0 0 10 6" fill="currentColor">
                                <path d="M0 0l5 6 5-6H0z" />
                              </svg>
                            </span>
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-sm text-txt-secondary">
                          {new Date(shipment.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/track/${shipment.tracking_code}`}
                              target="_blank"
                              className="p-2 text-txt-secondary hover:text-neon hover:bg-neon/10 rounded-lg transition-colors"
                              title="Open Tracking Page"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Link>
                            <button
                              onClick={() =>
                                setQrModalData(`${window.location.origin}/track/${shipment.tracking_code}`)
                              }
                              className="p-2 text-txt-secondary hover:text-teal hover:bg-teal/10 rounded-lg transition-colors"
                              title="Show QR Code"
                            >
                              <QrCode className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(
                                  `${window.location.origin}/track/${shipment.tracking_code}`
                                );
                                setCopiedId(shipment.id);
                                setTimeout(() => setCopiedId(null), 2000);
                              }}
                              className="p-2 text-txt-secondary hover:text-txt-primary hover:bg-white/10 rounded-lg transition-colors"
                              title="Copy Tracking Link"
                            >
                              {copiedId === shipment.id ? (
                                <Check className="w-4 h-4 text-teal" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={() => deleteShipment(shipment.id)}
                              className="p-2 text-txt-secondary hover:text-coral hover:bg-coral/10 rounded-lg transition-colors"
                              title="Delete Shipment"
                            >
                              <Trash2 className="w-4 h-4" />
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
      </main>

      {/* ─── Add Shipment Modal — click backdrop to close ─── */}
      {isAddModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={closeAddModal}          // close on backdrop click
        >
          <div
            className="bg-surface border border-edge rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-fade-up"
            onClick={(e) => e.stopPropagation()} // prevent bubble
          >
            <div className="flex justify-between items-center p-6 border-b border-edge bg-black/20">
              <h3 className="font-display text-xl font-bold text-txt-primary">Create New Shipment</h3>
              <button onClick={closeAddModal} className="text-txt-secondary hover:text-txt-primary transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddShipment} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-txt-secondary mb-1">Description</label>
                  <input
                    type="text"
                    required
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    className="w-full bg-black/30 border border-edge rounded-xl px-4 py-2.5 text-txt-primary focus:outline-none focus:border-neon focus:ring-1 focus:ring-neon transition-all"
                    placeholder="e.g. Medical Supplies"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-txt-secondary mb-1">Origin</label>
                    <input
                      type="text"
                      required
                      value={newOrigin}
                      onChange={(e) => setNewOrigin(e.target.value)}
                      className="w-full bg-black/30 border border-edge rounded-xl px-4 py-2.5 text-txt-primary focus:outline-none focus:border-neon focus:ring-1 focus:ring-neon transition-all"
                      placeholder="e.g. Colombo"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-txt-secondary mb-1">Destination</label>
                    <input
                      type="text"
                      required
                      value={newDest}
                      onChange={(e) => setNewDest(e.target.value)}
                      className="w-full bg-black/30 border border-edge rounded-xl px-4 py-2.5 text-txt-primary focus:outline-none focus:border-neon focus:ring-1 focus:ring-neon transition-all"
                      placeholder="e.g. Kandy"
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-sm font-medium text-txt-secondary">Device (Optional)</label>
                    {availableDevices.length === 0 && devices.length > 0 && (
                      <span className="text-xs text-amber">All devices are in use</span>
                    )}
                  </div>
                  <select
                    value={newDevId}
                    onChange={(e) => setNewDevId(e.target.value)}
                    className="w-full bg-black/30 border border-edge rounded-xl px-4 py-2.5 text-txt-primary focus:outline-none focus:border-neon focus:ring-1 focus:ring-neon transition-all appearance-none"
                  >
                    <option value="" className="bg-base text-txt-primary">No device assigned</option>
                    {availableDevices.map((d) => (
                      <option key={d.id} value={d.device_id} className="bg-base text-txt-primary">
                        {d.device_id}{d.label ? ` — ${d.label}` : ""}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1.5 text-xs text-txt-muted">
                    Only shows devices not assigned to active shipments.
                  </p>
                </div>
              </div>
              <div className="mt-8 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeAddModal}
                  className="px-5 py-2.5 rounded-xl font-medium text-txt-secondary hover:text-txt-primary hover:bg-white/5 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-neon to-teal rounded-xl font-semibold text-white shadow-neon-btn hover:shadow-neon-btn-hover transition-all"
                >
                  Create Shipment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── QR Code Modal — click backdrop to close ─── */}
      {qrModalData && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setQrModalData(null)}  // close on backdrop click
        >
          <div
            className="bg-surface border border-edge rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-fade-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-6 border-b border-edge bg-black/20">
              <h3 className="font-display text-xl font-bold text-txt-primary">Tracking QR Code</h3>
              <button
                onClick={() => setQrModalData(null)}
                className="text-txt-secondary hover:text-txt-primary transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-8 flex flex-col items-center">
              <div className="bg-white p-4 rounded-xl mb-6">
                <QRCodeSVG value={qrModalData} size={200} />
              </div>
              <p className="text-center text-sm text-txt-secondary break-all">{qrModalData}</p>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(qrModalData);
                  alert("Copied to clipboard!");
                }}
                className="mt-6 px-5 py-2.5 bg-white/5 border border-edge rounded-xl font-medium text-txt-primary hover:bg-white/10 transition-all w-full"
              >
                Copy Link
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
