import React, { useState } from 'react';
import { Table, TableHeader, TableRow, TableCell, TableHead } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Search, Plus, UploadCloud, RefreshCw, IndianRupee } from 'lucide-react';

export const ExpenseList = () => {
  const [isPanelOpen, setPanelOpen] = useState(false);

  const summary = [
    { title: 'Drafts', value: '2', amount: '₹14,500' },
    { title: 'Pending', value: '1', amount: '₹8,400' },
    { title: 'Approved', value: '4', amount: '₹42,300' },
  ];

  const DUMMY_EXPENSES = [
    { id: 1, desc: 'Client Dinner at Taj', date: '2023-10-25', category: 'Meals', amount: 8400, original: '8400 INR', status: 'Pending' },
    { id: 2, desc: 'Flight to London', date: '2023-10-20', category: 'Travel', amount: 42300, original: '400 GBP', status: 'Approved' },
    { id: 3, desc: 'AWS Hosting', date: '2023-11-01', category: 'Software', amount: 14500, original: '175 USD', status: 'Draft' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {summary.map((card, idx) => (
          <div key={idx} className="bg-surface border border-border rounded-xl p-5 hover:shadow-soft transition-all">
            <h3 className="text-sm font-medium text-text-secondary mb-1">{card.title}</h3>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-text-primary">{card.value}</span>
              <span className="text-sm font-medium text-primary">{card.amount}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <Input icon={Search} placeholder="Search expenses..." className="max-w-md" />
        <Button onClick={() => setPanelOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Expense
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Description</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <tbody>
          {DUMMY_EXPENSES.map((expense) => (
            <TableRow key={expense.id} className="group cursor-pointer">
              <TableCell>
                <span className="font-medium text-text-primary group-hover:text-primary transition-colors">{expense.desc}</span>
              </TableCell>
              <TableCell>
                <span className="text-text-secondary text-sm">{expense.date}</span>
              </TableCell>
              <TableCell>
                <span className="bg-gray-100 text-text-secondary px-2 py-1 rounded text-xs">{expense.category}</span>
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="text-text-primary font-medium">₹{expense.amount.toLocaleString()}</span>
                  <span className="text-text-secondary text-xs">{expense.original}</span>
                </div>
              </TableCell>
              <TableCell>
                <Badge status={expense.status}>{expense.status}</Badge>
              </TableCell>
            </TableRow>
          ))}
        </tbody>
      </Table>

      <Modal isOpen={isPanelOpen} onClose={() => setPanelOpen(false)} title="New Expense" type="slide">
        <div className="space-y-6 flex flex-col h-full">
          <div className="flex-1 space-y-6">
            <div className="border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors cursor-pointer group">
              <div className="h-12 w-12 rounded-full bg-primary-light text-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <UploadCloud className="h-6 w-6" />
              </div>
              <h4 className="text-sm font-semibold text-text-primary mb-1">Upload Receipt</h4>
              <p className="text-xs text-text-secondary">Drag and drop or click to browse</p>
              
              <div className="mt-4 flex items-center text-xs text-primary bg-primary-light px-3 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                <RefreshCw className="h-3 w-3 mr-1 animate-spin-slow" />
                OCR Auto-fill Ready
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Description</label>
                <Input placeholder="e.g. Client Dinner" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Date</label>
                  <Input type="date" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Category</label>
                  <select className="w-full rounded-xl border border-border bg-surface px-4 py-2 outline-none focus:border-primary focus:ring-2 focus:ring-primary-light text-text-primary h-10">
                    <option>Meals</option>
                    <option>Travel</option>
                    <option>Software</option>
                    <option>Office</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Amount</label>
                  <Input placeholder="0.00" type="number" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Currency</label>
                  <select className="w-full rounded-xl border border-border bg-surface px-4 py-2 outline-none focus:border-primary focus:ring-2 focus:ring-primary-light text-text-primary h-10">
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
              </div>
              
              <div className="bg-primary-light/30 rounded-lg p-3 flex items-center justify-between">
                <span className="text-sm text-text-secondary flex items-center">
                  <IndianRupee className="h-4 w-4 mr-1 text-primary" /> Converted Amount
                </span>
                <span className="font-semibold text-primary">≈ ₹0.00</span>
              </div>
            </div>
          </div>
          
          <div className="pt-6 border-t border-border flex justify-between gap-3 shrink-0">
            <Button variant="ghost" onClick={() => setPanelOpen(false)}>Save Draft</Button>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setPanelOpen(false)}>Cancel</Button>
              <Button onClick={() => setPanelOpen(false)}>Submit</Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};
