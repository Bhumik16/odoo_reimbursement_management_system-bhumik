import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Clock, XCircle, IndianRupee, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';

export const ManagerDashboard = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const { data: pending = [], isLoading } = useQuery({
    queryKey: ['manager-queue'],
    queryFn: () => api.get('/expenses?status=pending').then(r => r.data),
  });

  const { data: stats } = useQuery({
    queryKey: ['expense-stats'],
    queryFn: () => api.get('/expenses/stats/summary').then(r => r.data),
  });

  const cards = [
    { label: 'Pending Your Action', value: pending.length, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
    { label: 'Approved This Month', value: stats?.approved || 0, icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-50' },
    { label: 'Rejected', value: stats?.rejected || 0, icon: XCircle, color: 'text-red-500', bg: 'bg-red-50' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h2 className="text-xl font-bold text-text-primary">Good morning, {user?.name} 👋</h2>
        <p className="text-text-secondary text-sm mt-1">
          {pending.length > 0
            ? `You have ${pending.length} expense${pending.length > 1 ? 's' : ''} waiting for your approval.`
            : 'All caught up! No pending approvals.'}
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card, i) => (
          <div key={i} className="bg-surface rounded-xl border border-border p-6 flex items-center gap-4 hover:shadow-soft transition-all">
            <div className={`h-12 w-12 rounded-full ${card.bg} ${card.color} flex items-center justify-center shrink-0`}>
              <card.icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">{card.value}</p>
              <p className="text-sm text-text-secondary">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Pending Queue Preview */}
      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="font-semibold text-text-primary">Pending Approvals</h3>
          <button onClick={() => navigate('/manager/approvals')} className="text-sm text-primary hover:text-primary-hover font-medium flex items-center gap-1 transition-colors">
            View all <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-text-secondary">Loading…</div>
        ) : pending.length === 0 ? (
          <div className="p-8 text-center">
            <CheckCircle2 className="h-10 w-10 text-success mx-auto mb-3 opacity-50" />
            <p className="text-text-secondary text-sm">No pending approvals. You're all caught up!</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {pending.slice(0, 5).map((expense) => (
              <div
                key={expense.id}
                onClick={() => navigate(`/manager/approvals`)}
                className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <Avatar name={expense.employee_name} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-text-primary truncate">{expense.employee_name}</p>
                  <p className="text-xs text-text-secondary">{expense.category} · {expense.expense_date}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-text-primary">{expense.amount} {expense.currency}</p>
                  <Badge status="pending">Pending</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
