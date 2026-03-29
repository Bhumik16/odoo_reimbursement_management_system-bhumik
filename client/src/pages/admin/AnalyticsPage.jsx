import React from 'react';
import { IndianRupee, PieChart, TrendingUp, CheckCircle2, Clock } from 'lucide-react';

export const AnalyticsPage = () => {
  const cards = [
    { title: 'Total Expenses', value: '₹12,45,000', icon: IndianRupee, color: 'text-blue-500', bg: 'bg-blue-50' },
    { title: 'Pending Approval', value: '84', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
    { title: 'Approved This Month', value: '₹8,20,000', icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-50' },
    { title: 'Approval Rate', value: '94.2%', icon: TrendingUp, color: 'text-purple-500', bg: 'bg-purple-50' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, idx) => (
          <div key={idx} className="bg-surface rounded-xl border border-border p-6 flex flex-col items-center justify-center text-center hover:shadow-soft transition-all cursor-pointer">
            <div className={`h-12 w-12 rounded-full ${card.bg} ${card.color} flex items-center justify-center mb-4`}>
              <card.icon className="h-6 w-6" />
            </div>
            <h3 className="text-text-secondary text-sm font-medium mb-1">{card.title}</h3>
            <p className="text-3xl font-bold text-text-primary">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface p-6 rounded-xl border border-border h-[400px] flex flex-col">
          <h3 className="text-lg font-medium text-text-primary mb-6">Expenses by Category</h3>
          <div className="flex-1 flex items-center justify-center">
            <div className="relative w-64 h-64">
              {/* Fake Pie Chart placeholder visually styled via UI */}
              <div className="absolute inset-0 rounded-full border-[32px] border-primary"></div>
              <div className="absolute inset-0 rounded-full border-[32px] border-amber-400 border-t-transparent border-l-transparent transform rotate-45"></div>
              <div className="absolute inset-0 rounded-full border-[32px] border-green-500 border-b-transparent border-t-transparent border-l-transparent transform -rotate-[20deg]"></div>
            </div>
          </div>
        </div>

        <div className="bg-surface p-6 rounded-xl border border-border h-[400px] flex flex-col">
          <h3 className="text-lg font-medium text-text-primary mb-6">Monthly Trend</h3>
          <div className="flex-1 flex items-end justify-between gap-2">
            {/* Fake Bar Chart */}
            {[40, 65, 45, 80, 55, 90, 75, 100].map((height, i) => (
              <div key={i} className="w-full bg-primary-light rounded-t-lg relative group transition-all duration-300 hover:bg-primary" style={{ height: `${height}%` }}>
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                  ₹{height * 12}k
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
