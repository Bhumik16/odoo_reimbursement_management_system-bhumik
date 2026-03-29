import React, { useState } from 'react';
import { Table, TableHeader, TableRow, TableCell, TableHead } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Search, Filter, MessageSquare, CheckCircle, XCircle, FileText } from 'lucide-react';

const DUMMY_QUEUE = [
  { id: 1, employee: 'Alice Johnson', category: 'Flights', amount: 450, currency: 'USD', inINR: '37,350', status: 'Pending Approval', date: '2023-10-24', receipt: true },
  { id: 2, employee: 'Charlie Brown', category: 'Meals', amount: 80, currency: 'EUR', inINR: '7,200', status: 'Pending Approval', date: '2023-10-25', receipt: true },
  { id: 3, employee: 'David Smith', category: 'Office Supplies', amount: 3500, currency: 'INR', inINR: '3,500', status: 'Pending Approval', date: '2023-10-26', receipt: false },
];

export const ApprovalQueue = () => {
  const [expandedId, setExpandedId] = useState(null);
  const [items, setItems] = useState(DUMMY_QUEUE);

  const handleAction = (id, action) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, status: action === 'approve' ? 'Approved' : 'Rejected' } : item
    ));
    setExpandedId(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div className="flex gap-3 max-w-md w-full">
          <Input icon={Search} placeholder="Search employee or category..." className="w-[300px]" />
          <Button variant="secondary" className="px-3">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Employee</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <tbody>
          {items.map((item) => (
            <React.Fragment key={item.id}>
              <TableRow 
                expandable 
                onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                className={item.status !== 'Pending Approval' ? 'opacity-50 pointer-events-none' : ''}
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar name={item.employee} size="md" />
                    <span className="font-medium text-text-primary">{item.employee}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-text-secondary">{item.category}</span>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-primary font-bold">₹{item.inINR}</span>
                    <span className="text-xs text-text-secondary">{item.amount} {item.currency}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge status={item.status === 'Approved' ? 'approved' : item.status === 'Rejected' ? 'rejected' : 'pending'}>
                    {item.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {item.status === 'Pending Approval' ? (
                    <div className="flex items-center justify-end gap-2" onClick={e => e.stopPropagation()}>
                       <Button size="icon" variant="ghost" className="text-error hover:bg-red-50" onClick={() => handleAction(item.id, 'reject')}>
                         <XCircle className="h-5 w-5" />
                       </Button>
                       <Button size="icon" variant="primary" className="bg-success hover:bg-green-600" onClick={() => handleAction(item.id, 'approve')}>
                         <CheckCircle className="h-5 w-5" />
                       </Button>
                    </div>
                  ) : (
                    <span className="text-sm text-text-secondary italic">Completed</span>
                  )}
                </TableCell>
              </TableRow>

              {expandedId === item.id && (
                <tr className="bg-gray-50 border-b border-border">
                  <td colSpan={5} className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <h4 className="text-sm font-semibold text-text-primary mb-3">Expense Details</h4>
                        <div className="bg-surface border border-border rounded-xl p-4 space-y-3">
                          <div className="flex justify-between text-sm">
                            <span className="text-text-secondary">Date</span>
                            <span className="font-medium text-text-primary">{item.date}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-text-secondary">Receipt</span>
                            {item.receipt ? (
                              <a href="#" className="flex items-center text-primary hover:underline">
                                <FileText className="h-4 w-4 mr-1" /> View Receipt
                              </a>
                            ) : (
                              <span className="text-text-secondary italic">No receipt attached</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="text-sm font-semibold text-text-primary mb-3">Approval Timeline</h4>
                        <div className="space-y-4 bg-surface border border-border p-4 rounded-xl">
                          <div className="flex gap-3">
                            <div className="flex flex-col items-center">
                              <div className="w-2 h-2 rounded-full bg-success"></div>
                              <div className="w-0.5 h-full bg-border my-1"></div>
                            </div>
                            <div className="pb-2">
                              <p className="text-sm font-medium">Submitted by {item.employee}</p>
                              <p className="text-xs text-text-secondary">{item.date}</p>
                            </div>
                          </div>
                          <div className="flex gap-3">
                            <div className="flex flex-col items-center">
                              <div className="w-2 h-2 rounded-full bg-amber-500 ring-4 ring-amber-100"></div>
                            </div>
                            <div>
                              <p className="text-sm font-medium">Pending Manager Approval</p>
                              <p className="text-xs text-text-secondary">Waiting for you</p>
                            </div>
                          </div>
                        </div>

                        <div>
                           <Input placeholder="Add a comment (optional)..." icon={MessageSquare} />
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </Table>
    </div>
  );
};
