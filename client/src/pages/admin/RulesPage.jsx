import React from 'react';

import { Button } from '../../components/ui/Button';
import { Plus, GripVertical } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';

export const RulesPage = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium text-text-primary">Workflow Rules</h2>
          <p className="text-sm text-text-secondary">Configure how expenses are routed for approval.</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Rule
        </Button>
      </div>

      <div className="space-y-4">
        {[
          { id: 1, name: 'Travel Expenses > $500', approvers: ['Direct Manager', 'Finance Dept'], type: 'Sequential' },
          { id: 2, name: 'Office Supplies < $50', approvers: ['Auto-Approve'], type: 'Automatic' },
          { id: 3, name: 'Any Expense > $5000', approvers: ['Direct Manager', 'VP', 'CFO'], type: 'Sequential' }
        ].map((rule) => (
          <div key={rule.id} className="bg-surface border border-border rounded-xl p-5 flex items-center gap-4 hover:shadow-soft transition-shadow">
            <div className="text-text-secondary cursor-grab active:cursor-grabbing hover:bg-gray-50 p-2 rounded-lg">
              <GripVertical className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="font-semibold text-text-primary">{rule.name}</h3>
                <Badge status={rule.type === 'Automatic' ? 'approved' : 'default'}>{rule.type}</Badge>
              </div>
              <div className="flex items-center gap-2">
                {rule.approvers.map((approver, idx) => (
                  <React.Fragment key={idx}>
                    <span className="text-sm bg-gray-100 px-2 py-1 rounded-md text-text-secondary">{approver}</span>
                    {idx < rule.approvers.length - 1 && <span className="text-text-secondary text-xs">→</span>}
                  </React.Fragment>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-6">
              <label className="flex items-center cursor-pointer">
                <div className="relative">
                  <input type="checkbox" className="sr-only" defaultChecked />
                  <div className="block bg-primary w-10 h-6 rounded-full"></div>
                  <div className="dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition transform translate-x-4"></div>
                </div>
                <div className="ml-3 text-sm font-medium text-text-primary">Active</div>
              </label>
              <Button variant="secondary" size="sm">Edit</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
