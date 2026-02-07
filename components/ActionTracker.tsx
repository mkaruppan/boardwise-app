import React, { useState, useMemo } from 'react';
import { ActionItem, ActionStatus, User, UserRole } from '../types';
import { MessageSquare, Mail, Users, CheckCircle, Clock, AlertCircle, Filter, X, Edit, CheckCircle2, Plus } from 'lucide-react';

interface ActionTrackerProps {
  actions: ActionItem[];
  user: User;
  users: User[];
  onRequestEdit: (id: string, updates: Partial<ActionItem>) => void;
  onApproveEdit: (id: string) => void;
  onAddAction: (action: Partial<ActionItem>) => void;
}

const ActionTracker: React.FC<ActionTrackerProps> = ({ actions, user, users, onRequestEdit, onApproveEdit, onAddAction }) => {
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [ownerFilter, setOwnerFilter] = useState<string>('ALL');
  const [deadlineFilter, setDeadlineFilter] = useState<string>('ALL');
  
  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<ActionItem>>({});

  // Add Action State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newActionForm, setNewActionForm] = useState({
    task: '',
    owner: '',
    deadline: ''
  });

  const isSecretary = user.role === UserRole.SECRETARY;

  // Extract unique owners for the filter dropdown
  const uniqueOwners = useMemo(() => {
    return Array.from(new Set(actions.map(a => a.owner))).sort();
  }, [actions]);

  // Filtering Logic
  const filteredActions = useMemo(() => {
    return actions.filter(action => {
      // 1. Status Filter
      if (statusFilter !== 'ALL' && action.status !== statusFilter) {
        return false;
      }

      // 2. Owner Filter
      if (ownerFilter !== 'ALL' && action.owner !== ownerFilter) {
        return false;
      }

      // 3. Deadline Filter (Time-based logic)
      if (deadlineFilter !== 'ALL') {
        const now = new Date();
        const deadlineDate = new Date(action.deadline);
        // Reset time parts for accurate day comparison
        now.setHours(0, 0, 0, 0);
        deadlineDate.setHours(0, 0, 0, 0);

        if (deadlineFilter === 'OVERDUE') {
           // Show if date is past AND not completed
           return deadlineDate < now && action.status !== ActionStatus.COMPLETED;
        }
        
        if (deadlineFilter === 'THIS_WEEK') {
           const nextWeek = new Date(now);
           nextWeek.setDate(now.getDate() + 7);
           return deadlineDate >= now && deadlineDate <= nextWeek;
        }

        if (deadlineFilter === 'THIS_MONTH') {
           const nextMonth = new Date(now);
           nextMonth.setDate(now.getDate() + 30);
           return deadlineDate >= now && deadlineDate <= nextMonth;
        }
      }

      return true;
    });
  }, [actions, statusFilter, ownerFilter, deadlineFilter]);

  const clearFilters = () => {
    setStatusFilter('ALL');
    setOwnerFilter('ALL');
    setDeadlineFilter('ALL');
  };

  const handleEditClick = (action: ActionItem) => {
    setEditingId(action.id);
    setEditForm({
      task: action.task,
      owner: action.owner,
      deadline: action.deadline,
      status: action.status
    });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      onRequestEdit(editingId, editForm);
      setEditingId(null);
      setEditForm({});
    }
  };

  const handleAddSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onAddAction({
          task: newActionForm.task,
          owner: newActionForm.owner,
          deadline: newActionForm.deadline
      });
      setShowAddModal(false);
      setNewActionForm({ task: '', owner: '', deadline: '' });
  };

  const hasActiveFilters = statusFilter !== 'ALL' || ownerFilter !== 'ALL' || deadlineFilter !== 'ALL';

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'WhatsApp': return <MessageSquare className="w-4 h-4 text-green-500" />;
      case 'Email': return <Mail className="w-4 h-4 text-blue-500" />;
      default: return <Users className="w-4 h-4 text-slate-500" />;
    }
  };

  const getStatusBadge = (status: ActionStatus) => {
    switch (status) {
      case ActionStatus.COMPLETED:
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1"/> Done</span>;
      case ActionStatus.IN_PROGRESS:
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"><Clock className="w-3 h-3 mr-1"/> Active</span>;
      case ActionStatus.OVERDUE:
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800"><AlertCircle className="w-3 h-3 mr-1"/> Overdue</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600">Pending</span>;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden relative">
      {/* Header & Toolbar */}
      <div className="p-4 border-b border-slate-200 bg-slate-50 space-y-4 md:space-y-0 md:flex md:justify-between md:items-center">
        <div className="flex items-center justify-between">
            <div>
                <h3 className="font-bold text-slate-800">Action Tracker</h3>
                <span className="text-xs text-slate-500">Live Sync Enabled</span>
            </div>
             {/* Mobile Clear Button */}
             {hasActiveFilters && (
                <button onClick={clearFilters} className="md:hidden text-xs text-brand-900 font-medium flex items-center">
                    <X className="w-3 h-3 mr-1" /> Clear
                </button>
            )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 items-center">
            {isSecretary && (
                <button 
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center bg-brand-900 text-white text-xs px-3 py-1.5 rounded shadow-sm hover:bg-brand-800 transition-colors mr-2"
                >
                    <Plus className="w-3 h-3 mr-1" />
                    Add Action
                </button>
            )}

            <div className="flex items-center space-x-1 bg-white border border-slate-200 rounded px-2 py-1">
                <Filter className="w-3 h-3 text-slate-400" />
                <select 
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="text-xs font-medium text-slate-700 bg-transparent border-none outline-none cursor-pointer focus:ring-0"
                >
                    <option value="ALL">All Statuses</option>
                    <option value={ActionStatus.PENDING}>Pending</option>
                    <option value={ActionStatus.IN_PROGRESS}>In Progress</option>
                    <option value={ActionStatus.COMPLETED}>Completed</option>
                    <option value={ActionStatus.OVERDUE}>Overdue</option>
                </select>
            </div>

            <div className="flex items-center space-x-1 bg-white border border-slate-200 rounded px-2 py-1">
                <Users className="w-3 h-3 text-slate-400" />
                <select 
                    value={ownerFilter}
                    onChange={(e) => setOwnerFilter(e.target.value)}
                    className="text-xs font-medium text-slate-700 bg-transparent border-none outline-none cursor-pointer focus:ring-0 max-w-[100px]"
                >
                    <option value="ALL">All Owners</option>
                    {uniqueOwners.map(owner => (
                        <option key={owner} value={owner}>{owner}</option>
                    ))}
                </select>
            </div>

            <div className="flex items-center space-x-1 bg-white border border-slate-200 rounded px-2 py-1">
                <Clock className="w-3 h-3 text-slate-400" />
                <select 
                    value={deadlineFilter}
                    onChange={(e) => setDeadlineFilter(e.target.value)}
                    className="text-xs font-medium text-slate-700 bg-transparent border-none outline-none cursor-pointer focus:ring-0"
                >
                    <option value="ALL">All Deadlines</option>
                    <option value="OVERDUE">Overdue (Incomplete)</option>
                    <option value="THIS_WEEK">Due This Week</option>
                    <option value="THIS_MONTH">Due This Month</option>
                </select>
            </div>

            {hasActiveFilters && (
                <button 
                    onClick={clearFilters}
                    className="hidden md:flex items-center justify-center p-1 rounded-full hover:bg-slate-200 text-slate-500 transition-colors"
                    title="Clear Filters"
                >
                    <X className="w-4 h-4" />
                </button>
            )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
            <tr>
              <th className="px-4 py-3 font-medium">Task</th>
              <th className="px-4 py-3 font-medium">Owner</th>
              <th className="px-4 py-3 font-medium">Deadline</th>
              <th className="px-4 py-3 font-medium">Source</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Latest Update</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredActions.length > 0 ? (
                filteredActions.map((action) => {
                  const isPending = !!action.pendingEdit;
                  const canApprove = isPending && action.pendingEdit?.requestedBy !== user.id && !action.pendingEdit?.approvals.includes(user.id);
                  const myRequest = isPending && action.pendingEdit?.requestedBy === user.id;

                  return (
                    <tr key={action.id} className={`border-b last:border-0 ${isPending ? 'bg-orange-50' : 'hover:bg-slate-50'}`}>
                        <td className="px-4 py-3 font-medium text-slate-900">
                           {action.task}
                           {isPending && (
                             <div className="mt-1 text-[10px] text-orange-600 font-bold bg-orange-100 w-fit px-1.5 py-0.5 rounded">
                               UPDATE PENDING
                               {action.pendingEdit?.newStatus && <span>: Status {action.pendingEdit.newStatus}</span>}
                             </div>
                           )}
                        </td>
                        <td className="px-4 py-3 text-slate-600">{action.owner}</td>
                        <td className="px-4 py-3 text-slate-600 font-mono text-xs">{action.deadline}</td>
                        <td className="px-4 py-3">
                        <div className="flex items-center space-x-2 text-slate-600" title={`Source: ${action.source}`}>
                            {getSourceIcon(action.source)}
                            <span className="text-xs">{action.source}</span>
                        </div>
                        </td>
                        <td className="px-4 py-3">{getStatusBadge(action.status)}</td>
                        <td className="px-4 py-3 text-xs text-slate-500 italic max-w-xs truncate">{action.lastUpdate || '-'}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                             {/* Secretary Edit Button */}
                             {isSecretary && !isPending && (
                               <button 
                                 onClick={() => handleEditClick(action)}
                                 className="text-slate-400 hover:text-brand-900 p-1 hover:bg-slate-100 rounded transition-colors"
                                 title="Edit Action"
                               >
                                 <Edit className="w-4 h-4" />
                               </button>
                             )}

                             {/* Approval Button */}
                             {canApprove && (
                               <button 
                                 onClick={() => onApproveEdit(action.id)}
                                 className="flex items-center space-x-1 bg-brand-900 text-white text-xs px-2 py-1 rounded shadow-sm hover:bg-brand-800 transition-colors"
                                 title="Approve Change"
                               >
                                 <CheckCircle2 className="w-3 h-3" />
                                 <span>Approve</span>
                               </button>
                             )}

                             {isPending && !canApprove && !myRequest && (
                               <span className="text-[10px] text-slate-400 italic">Voted</span>
                             )}
                             
                             {myRequest && (
                               <span className="text-[10px] text-orange-500 italic">Reviewing...</span>
                             )}
                          </div>
                        </td>
                    </tr>
                )})
            ) : (
                <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500 italic">
                        No actions found matching your filters.
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {editingId && (
        <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-10 flex items-center justify-center p-4">
           <div className="bg-white border border-slate-200 shadow-xl rounded-lg p-6 max-w-sm w-full animate-in fade-in zoom-in">
              <h3 className="font-bold text-slate-800 mb-4">Request Update</h3>
              <form onSubmit={handleSaveEdit} className="space-y-4">
                 <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Task Description</label>
                    <input 
                      type="text" 
                      value={editForm.task}
                      onChange={e => setEditForm({...editForm, task: e.target.value})}
                      className="w-full border border-slate-300 rounded p-2 text-sm"
                    />
                 </div>
                 <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Status</label>
                    <select 
                      value={editForm.status}
                      onChange={e => setEditForm({...editForm, status: e.target.value as ActionStatus})}
                      className="w-full border border-slate-300 rounded p-2 text-sm"
                    >
                      <option value={ActionStatus.PENDING}>Pending</option>
                      <option value={ActionStatus.IN_PROGRESS}>In Progress</option>
                      <option value={ActionStatus.COMPLETED}>Completed</option>
                      <option value={ActionStatus.OVERDUE}>Overdue</option>
                    </select>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Owner</label>
                        <input 
                          type="text" 
                          value={editForm.owner}
                          onChange={e => setEditForm({...editForm, owner: e.target.value})}
                          className="w-full border border-slate-300 rounded p-2 text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Deadline</label>
                        <input 
                          type="date" 
                          value={editForm.deadline}
                          onChange={e => setEditForm({...editForm, deadline: e.target.value})}
                          className="w-full border border-slate-300 rounded p-2 text-sm"
                        />
                    </div>
                 </div>
                 <div className="flex justify-end space-x-2 pt-2">
                    <button 
                      type="button" 
                      onClick={() => { setEditingId(null); setEditForm({}); }}
                      className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="px-3 py-1.5 text-sm bg-brand-900 text-white hover:bg-brand-800 rounded font-medium"
                    >
                      Request Approval
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* Add Action Modal */}
      {showAddModal && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-20 flex items-center justify-center p-4">
             <div className="bg-white border border-slate-200 shadow-xl rounded-lg p-6 max-w-sm w-full animate-in fade-in zoom-in">
                 <h3 className="font-bold text-slate-800 mb-4">New Action Item</h3>
                 <form onSubmit={handleAddSubmit} className="space-y-4">
                     <div>
                         <label className="block text-xs font-semibold text-slate-500 mb-1">Task Description</label>
                         <input 
                             type="text" 
                             required
                             value={newActionForm.task}
                             onChange={e => setNewActionForm({...newActionForm, task: e.target.value})}
                             className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-1 focus:ring-brand-900"
                             placeholder="e.g. Review Q3 Audit Findings"
                         />
                     </div>
                     <div>
                         <label className="block text-xs font-semibold text-slate-500 mb-1">Assign To</label>
                         <select 
                             required
                             value={newActionForm.owner}
                             onChange={e => setNewActionForm({...newActionForm, owner: e.target.value})}
                             className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-1 focus:ring-brand-900"
                         >
                             <option value="">Select Director...</option>
                             {users.filter(u => u.status === 'ACTIVE').map(u => (
                                 <option key={u.id} value={u.name}>{u.name} ({u.role.replace('_', ' ')})</option>
                             ))}
                         </select>
                     </div>
                     <div>
                         <label className="block text-xs font-semibold text-slate-500 mb-1">Deadline</label>
                         <input 
                             type="date" 
                             required
                             value={newActionForm.deadline}
                             onChange={e => setNewActionForm({...newActionForm, deadline: e.target.value})}
                             className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-1 focus:ring-brand-900"
                         />
                     </div>
                     
                     <div className="flex justify-end space-x-2 pt-2">
                         <button 
                             type="button" 
                             onClick={() => setShowAddModal(false)}
                             className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded"
                         >
                             Cancel
                         </button>
                         <button 
                             type="submit" 
                             className="px-3 py-1.5 text-sm bg-brand-900 text-white hover:bg-brand-800 rounded font-medium"
                         >
                             Assign Task
                         </button>
                     </div>
                 </form>
             </div>
          </div>
      )}

    </div>
  );
};

export default ActionTracker;