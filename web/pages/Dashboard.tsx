import React, { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { getBalanceSummary } from '../services/api';
import { BalanceSummary } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { THEMES } from '../constants';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

export const Dashboard = () => {
  const [summary, setSummary] = useState<BalanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const { style, mode } = useTheme();

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await getBalanceSummary();
        setSummary(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, []);

  if (loading) return <div className="p-8">Loading stats...</div>;

  const chartData = [
    { name: 'Owed To You', value: summary?.totalOwedToYou || 0, color: '#10b981' }, // emerald-500
    { name: 'You Owe', value: summary?.totalYouOwe || 0, color: '#ef4444' }, // red-500
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="flex flex-col items-center justify-center text-center">
          <div className="p-4 rounded-full bg-emerald-100 text-emerald-600 mb-4">
             <TrendingUp size={32} />
          </div>
          <p className="opacity-70 font-medium">Owed to You</p>
          <h2 className="text-3xl font-extrabold text-emerald-500">
            ${summary?.totalOwedToYou.toFixed(2)}
          </h2>
        </Card>

        <Card className="flex flex-col items-center justify-center text-center">
          <div className="p-4 rounded-full bg-red-100 text-red-600 mb-4">
             <TrendingDown size={32} />
          </div>
          <p className="opacity-70 font-medium">You Owe</p>
          <h2 className="text-3xl font-extrabold text-red-500">
            ${summary?.totalYouOwe.toFixed(2)}
          </h2>
        </Card>

        <Card className="flex flex-col items-center justify-center text-center">
          <div className="p-4 rounded-full bg-blue-100 text-blue-600 mb-4">
             <DollarSign size={32} />
          </div>
          <p className="opacity-70 font-medium">Net Balance</p>
          <h2 className={`text-3xl font-extrabold ${summary && summary.netBalance >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
            ${summary?.netBalance.toFixed(2)}
          </h2>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Balance Overview">
          <div className="h-[300px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: mode === 'dark' ? '#fff' : '#000' }} 
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fill: mode === 'dark' ? '#fff' : '#000' }} 
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: mode === 'dark' ? '#333' : '#fff',
                    borderRadius: style === THEMES.GLASSMORPHISM ? '12px' : '0px',
                    border: 'none',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                  cursor={{fill: 'transparent'}}
                />
                <Bar dataKey="value" radius={style === THEMES.GLASSMORPHISM ? [8, 8, 0, 0] : 0} barSize={60}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke={style === THEMES.NEOBRUTALISM ? 'black' : 'none'} strokeWidth={2} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        
        <Card title="Recent Activity">
           <div className="flex flex-col items-center justify-center h-[300px] opacity-50">
             <p>No recent activity data available in summary view.</p>
             <p className="text-sm">Check specific groups for details.</p>
           </div>
        </Card>
      </div>
    </div>
  );
};