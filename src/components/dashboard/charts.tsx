'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const COLORS = ['#1d6ff1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'];

export function TrendChart({ data }: { data: { date: string; count: number }[] }) {
  return (
    <div className="card p-4">
      <div className="text-sm font-semibold text-ink mb-3">Appointment Trend (7 days)</div>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--line))" />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'rgb(var(--ink-muted))' }} />
          <YAxis tick={{ fontSize: 11, fill: 'rgb(var(--ink-muted))' }} allowDecimals={false} />
          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
          <Line type="monotone" dataKey="count" stroke="#1d6ff1" strokeWidth={2.5} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DoctorBreakdownChart({
  data,
}: {
  data: { name: string; count: number }[];
}) {
  return (
    <div className="card p-4">
      <div className="text-sm font-semibold text-ink mb-3">Today by Doctor</div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
          <XAxis type="number" tick={{ fontSize: 11, fill: 'rgb(var(--ink-muted))' }} allowDecimals={false} />
          <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 11, fill: 'rgb(var(--ink-muted))' }} />
          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
          <Bar dataKey="count" fill="#1d6ff1" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DepartmentPie({ data }: { data: { name: string; doctors: number }[] }) {
  return (
    <div className="card p-4">
      <div className="text-sm font-semibold text-ink mb-3">Department Coverage</div>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie data={data} dataKey="doctors" nameKey="name" outerRadius={80} innerRadius={45}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
