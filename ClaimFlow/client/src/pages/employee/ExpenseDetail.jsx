import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle2, XCircle, Clock, FileText, User, Calendar, Tag, DollarSign } from 'lucide-react';
import api from '../../lib/api';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';

const ACTION_LABELS = {
  submitted: { label: 'Submitted', color: 'bg-blue-500' },
  manager_approved: { label: 'Manager Approved', color: 'bg-green-500' },
  manager_rejected: { label: 'Manager Rejected', color: 'bg-red-500' },
  step_approved: { label: 'Approved', color: 'bg-green-500' },
  step_rejected: { label: 'Rejected', color: 'bg-red-500' },
  auto_approved: { label: 'Auto-Approved', color: 'bg-purple-500' },
  final_approved: { label: 'Final Approved', color: 'bg-green-600' },
  final_rejected: { label: 'Final Rejected', color: 'bg-red-600' },
};

export const ExpenseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: expense, isLoading, error } = useQuery({
    queryKey: ['expense', id],
    queryFn: () => api.get(`/expenses/${id}`).then(r => r.data),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !expense) {
    return (
      <div className="text-center py-16">
        <p className="text-text-secondary">Expense not found.</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-primary text-sm hover:underline">Go back</button>
      </div>
    );
  }

  const statusMap = {
    pending: 'pending',
    approved: 'approved',
    rejected: 'rejected',
    draft: 'draft',
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-text-secondary">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-text-primary">{expense.description}</h2>
          <p className="text-sm text-text-secondary">{expense.category} · {expense.expense_date}</p>
        </div>
        <Badge status={statusMap[expense.status]}>{expense.status}</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Expense Info Card */}
          <div className="bg-surface border border-border rounded-xl p-6 space-y-4">
            <h3 className="font-semibold text-text-primary text-sm uppercase tracking-wide text-text-secondary">Expense Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                  <DollarSign className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-text-secondary">Amount</p>
                  <p className="font-semibold text-text-primary">{expense.amount} {expense.currency}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-9 w-9 bg-purple-50 rounded-lg flex items-center justify-center shrink-0">
                  <Tag className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-text-secondary">Category</p>
                  <p className="font-semibold text-text-primary">{expense.category}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-9 w-9 bg-green-50 rounded-lg flex items-center justify-center shrink-0">
                  <Calendar className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-text-secondary">Date</p>
                  <p className="font-semibold text-text-primary">{expense.expense_date}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-9 w-9 bg-amber-50 rounded-lg flex items-center justify-center shrink-0">
                  <User className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-text-secondary">Submitted By</p>
                  <p className="font-semibold text-text-primary">{expense.employee_name}</p>
                </div>
              </div>
            </div>

            {expense.receipt_url && (
              <a href={expense.receipt_url} target="_blank" rel="noreferrer"
                className="flex items-center gap-2 text-primary text-sm hover:underline mt-2">
                <FileText className="h-4 w-4" /> View Receipt
              </a>
            )}
          </div>

          {/* Chain Steps */}
          {expense.chainSteps?.length > 0 && (
            <div className="bg-surface border border-border rounded-xl p-6">
              <h3 className="font-semibold text-text-primary mb-4 text-sm uppercase tracking-wide text-text-secondary">Approval Chain</h3>
              <div className="space-y-3">
                {expense.is_at_manager_stage && (
                  <div className="flex items-center gap-3">
                    <div className="h-7 w-7 rounded-full bg-amber-100 border-2 border-amber-400 ring-4 ring-amber-50 flex items-center justify-center">
                      <Clock className="h-3.5 w-3.5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">Manager Pre-Approval</p>
                      <p className="text-xs text-text-secondary">Waiting for direct manager</p>
                    </div>
                  </div>
                )}
                {expense.chainSteps.map((step, i) => {
                  const stepDone = expense.current_step_index > step.step_order;
                  const stepCurrent = expense.current_step_index === step.step_order;
                  return (
                    <div key={step.id} className="flex items-center gap-3">
                      <div className={`h-7 w-7 rounded-full flex items-center justify-center border-2 shrink-0 ${
                        stepDone
                          ? 'bg-green-100 border-green-500'
                          : stepCurrent
                          ? 'bg-amber-100 border-amber-400 ring-4 ring-amber-50'
                          : 'bg-gray-100 border-gray-300'
                      }`}>
                        {stepDone
                          ? <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                          : stepCurrent
                          ? <Clock className="h-3.5 w-3.5 text-amber-600" />
                          : <span className="text-xs text-gray-400 font-bold">{i + 1}</span>
                        }
                      </div>
                      <div>
                        <p className="text-sm font-medium text-text-primary">{step.step_label || `Step ${step.step_order}`}</p>
                        <p className="text-xs text-text-secondary">{step.approver_name}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right: Approval Timeline */}
        <div className="bg-surface border border-border rounded-xl p-6">
          <h3 className="font-semibold text-text-primary mb-4 text-sm uppercase tracking-wide text-text-secondary">Activity Log</h3>
          <div className="relative">
            <div className="absolute left-3.5 top-0 bottom-0 w-px bg-border" />
            <div className="space-y-5">
              {expense.approvalLog?.map((log, i) => {
                const meta = ACTION_LABELS[log.action] || { label: log.action, color: 'bg-gray-400' };
                return (
                  <div key={log.id} className="relative flex gap-4 pl-9">
                    <div className={`absolute left-0 h-7 w-7 rounded-full ${meta.color} flex items-center justify-center ring-2 ring-white`}>
                      {log.action.includes('approved') ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                      ) : log.action.includes('rejected') ? (
                        <XCircle className="h-3.5 w-3.5 text-white" />
                      ) : (
                        <Clock className="h-3.5 w-3.5 text-white" />
                      )}
                    </div>
                    <div className="flex-1 pb-1">
                      <p className="text-sm font-medium text-text-primary">{meta.label}</p>
                      <p className="text-xs text-text-secondary">{log.actor_name} · {log.step_label}</p>
                      {log.comment && (
                        <p className="text-xs bg-gray-50 border border-border rounded-lg px-3 py-2 mt-1 text-text-secondary italic">
                          "{log.comment}"
                        </p>
                      )}
                      <p className="text-xs text-text-secondary mt-0.5">
                        {new Date(log.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
