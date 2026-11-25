import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface ProgressChartEntry {
  date: string;
  score: number;
  sessions: number;
  pitchHz: number;
}

interface ProgressChartsProps {
  data: ProgressChartEntry[];
  cardClassName: string;
}

export function ProgressCharts({ data, cardClassName }: ProgressChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className={cardClassName}>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-xl font-black">Accuracy & Vocal Pitch Trend</h3>
            <p className="text-xs text-slate-500">Pronunciation score (%) and fundamental vocal pitch (F₀ Hz)</p>
          </div>
          <div className="flex items-center gap-3 text-xs font-bold">
            <div className="flex items-center gap-1.5 text-indigo-600">
              <div className="w-3 h-3 rounded-full bg-indigo-500" />
              Score %
            </div>
            <div className="flex items-center gap-1.5 text-emerald-600">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              Pitch (Hz)
            </div>
          </div>
        </div>
        <div className="h-[300px] w-full">
          <ResponsiveContainer
            width="100%"
            height="100%"
            minWidth={0}
            minHeight={300}
            initialDimension={{ width: 300, height: 300 }}
          >
            <ComposedChart data={data}>
              <defs>
                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 600 }}
                dy={10}
              />
              <YAxis
                yAxisId="score"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#6366f1', fontWeight: 600 }}
                domain={[0, 100]}
                unit="%"
              />
              <YAxis
                yAxisId="pitch"
                orientation="right"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#10b981', fontWeight: 600 }}
                domain={[100, 350]}
                unit="Hz"
              />
              <Tooltip
                contentStyle={{
                  borderRadius: '16px',
                  border: 'none',
                  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                  fontWeight: 'bold',
                }}
              />
              <Area
                yAxisId="score"
                type="monotone"
                dataKey="score"
                name="Accuracy Score"
                stroke="#6366f1"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorScore)"
              />
              <Line
                yAxisId="pitch"
                type="monotone"
                dataKey="pitchHz"
                name="Vocal Pitch (F₀)"
                stroke="#10b981"
                strokeWidth={3.5}
                dot={{ r: 4, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
                activeDot={{ r: 7, fill: '#059669' }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className={cardClassName}>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-xl font-black">Daily Sessions</h3>
            <p className="text-xs text-slate-500">Practice consistency across recent days</p>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
            <div className="w-3 h-3 rounded-full bg-secondary" />
            Count
          </div>
        </div>
        <div className="h-[300px] w-full">
          <ResponsiveContainer
            width="100%"
            height="100%"
            minWidth={0}
            minHeight={300}
            initialDimension={{ width: 300, height: 300 }}
          >
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 600 }}
                dy={10}
              />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 600 }} />
              <Tooltip
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{
                  borderRadius: '16px',
                  border: 'none',
                  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                  fontWeight: 'bold',
                }}
              />
              <Bar dataKey="sessions" fill="#f43f5e" radius={[6, 6, 0, 0]} barSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
