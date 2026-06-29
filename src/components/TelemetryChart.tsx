"use client";
import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface TelemetryPoint {
  timestamp: string;
  temp?: number;
  hum?: number;
  shock_x?: number;
  shock_y?: number;
  shock_z?: number;
  shock_magnitude?: number;
  vibration?: number;
  tilt?: number;
}

interface TelemetryChartProps {
  data: TelemetryPoint[];
  showShock?: boolean;
  height?: number;
}

function formatTime(ts: string) {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function TelemetryChart({
  data,
  showShock = true,
  height = 280,
}: TelemetryChartProps) {
  const [hiddenLines, setHiddenLines] = useState<Record<string, boolean>>({});

  const toggleLine = (dataKey: string) => {
    setHiddenLines((prev) => ({
      ...prev,
      [dataKey]: !prev[dataKey],
    }));
  };

  // Data comes newest-first from the API; reverse for chart (oldest → newest)
  const chartData = [...data].reverse().map((d) => {
    let shockMag = null;
    if (d.shock_magnitude !== undefined && d.shock_magnitude !== null) {
      shockMag = d.shock_magnitude;
    } else if (d.shock_x !== undefined && d.shock_y !== undefined && d.shock_z !== undefined && d.shock_x !== null && d.shock_y !== null && d.shock_z !== null) {
      shockMag = Math.sqrt(d.shock_x * d.shock_x + d.shock_y * d.shock_y + d.shock_z * d.shock_z);
    }
    return {
      time: formatTime(d.timestamp),
      temp: d.temp ?? null,
      hum: d.hum ?? null,
      shock: shockMag,
      vibration: d.vibration ?? null,
      tilt: d.tilt ?? null,
    };
  });

  if (chartData.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-txt-muted text-sm"
        style={{ height }}
      >
        No telemetry data available
      </div>
    );
  }

  return (
    <div style={{ height, minHeight: height, minWidth: 0 }} className="w-full">
      <ResponsiveContainer width="100%" height={height} debounce={1}>
        <LineChart
          data={chartData}
          margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.05)"
            vertical={false}
          />
          <XAxis
            dataKey="time"
            stroke="#8a9bc0"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            stroke="#8a9bc0"
            fontSize={11}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#0d1525",
              borderColor: "rgba(255,255,255,0.1)",
              borderRadius: "12px",
              color: "#f0f4ff",
              fontSize: "12px",
            }}
            itemStyle={{ color: "#f0f4ff" }}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: "11px", paddingTop: "8px", cursor: "pointer" }}
            onClick={(e: any) => {
              if (e && typeof e.dataKey === "string") {
                toggleLine(e.dataKey);
              }
            }}
          />
          <Line
            type="monotone"
            dataKey="temp"
            stroke="#ff4d6d"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 5, fill: "#ff4d6d", strokeWidth: 0 }}
            name="Temp (°C)"
            connectNulls
            hide={hiddenLines["temp"]}
          />
          <Line
            type="monotone"
            dataKey="hum"
            stroke="#1a6fff"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 5, fill: "#1a6fff", strokeWidth: 0 }}
            name="Hum (%)"
            connectNulls
            hide={hiddenLines["hum"]}
          />
          {showShock && (
            <Line
              type="monotone"
              dataKey="shock"
              stroke="#00c9a7"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5, fill: "#00c9a7", strokeWidth: 0 }}
              name="Shock (m/s²)"
              connectNulls
              hide={hiddenLines["shock"]}
            />
          )}
          <Line
            type="monotone"
            dataKey="vibration"
            stroke="#8b5cf6"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 5, fill: "#8b5cf6", strokeWidth: 0 }}
            name="Vibration"
            connectNulls
            hide={hiddenLines["vibration"]}
          />
          <Line
            type="monotone"
            dataKey="tilt"
            stroke="#f59e0b"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 5, fill: "#f59e0b", strokeWidth: 0 }}
            name="Tilt (°)"
            connectNulls
            hide={hiddenLines["tilt"]}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
