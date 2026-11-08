import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from "recharts";

const data = [
  { month:"Jan", revenue:420000 }, { month:"Feb", revenue:380000 },
  { month:"Mar", revenue:550000 }, { month:"Apr", revenue:490000 },
  { month:"May", revenue:620000 }, { month:"Jun", revenue:710000 },
  { month:"Jul", revenue:680000 }, { month:"Aug", revenue:750000 },
  { month:"Sep", revenue:820000 }, { month:"Oct", revenue:890000 },
  { month:"Nov", revenue:960000 }, { month:"Dec", revenue:1100000 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="glass rounded-xl p-3 border border-sky-500/20">
        <p className="text-xs text-slate-400">{label}</p>
        <p className="text-sm font-semibold text-sky-300">
          ₹{(payload[0].value/1000).toFixed(0)}K
        </p>
      </div>
    );
  }
  return null;
};

export function RevenueChart() {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="font-semibold text-white">Revenue Trend</h2>
          <p className="text-xs text-slate-400">Monthly airport revenue</p>
        </div>
        <span className="text-xs bg-green-500/20 text-green-400 px-3 py-1 rounded-full">
          ▲ 18% YoY
        </span>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#38bdf8" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}   />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1a2540" />
          <XAxis dataKey="month" tick={{ fill:"#64748b", fontSize:11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill:"#64748b", fontSize:11 }} axisLine={false} tickLine={false}
            tickFormatter={v => `₹${v/1000}K`} />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey="revenue"
            stroke="#38bdf8" strokeWidth={2}
            fill="url(#rev)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}