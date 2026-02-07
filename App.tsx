import React, { useState } from 'react';
import Login from './components/Login.tsx';
import Dashboard from './components/Dashboard.tsx';
import MeetingView from './components/MeetingView.tsx';
import DirectorOnboarding from './components/DirectorOnboarding.tsx';
import AuditLogView from './components/AuditLogView.tsx';
import CalendarView from './components/CalendarView.tsx';
import RepositoryView from './components/RepositoryView.tsx';
import { User, Meeting, ActionItem, ActionStatus, AuditLogEntry, UserRole, RepositoryDoc, MeetingStatus } from './types.ts';
import { MOCK_ACTIONS, INITIAL_MEETINGS, MOCK_USERS, MOCK_DOCUMENTS } from './constants.ts';
import { MessageSquare, Mail, CheckCircle, UserCheck, AlertTriangle, UserMinus, Snowflake, CalendarCheck, Trash2, Edit, PlusCircle, Key, Lock } from 'lucide-react';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeMeeting, setActiveMeeting] = useState<Meeting | null>(null);
  const [meetings, setMeetings] = useState<Meeting[]>(INITIAL_MEETINGS);
  const [actions, setActions] = useState<ActionItem[]>(MOCK_ACTIONS);
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [repositoryDocs, setRepositoryDocs] = useState<RepositoryDoc[]>(MOCK_DOCUMENTS);
  const [view, setView] = useState<'LOGIN' | 'ONBOARDING' | 'AUDIT_LOG' | 'CALENDAR' | 'REPOSITORY'>('LOGIN');
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [toast, setToast] = useState<{icon: any, title: string, message: string, color: string} | null>(null);

  const addLog = (action: string, details: string, userOverride?: User) => {
    const userToLog = userOverride || currentUser;
    if (!userToLog) return;

    const newLog: AuditLogEntry = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      userId: userToLog.id,
      userName: userToLog.name,
      action: action,
      details: details,
      ipHash: Math.random().toString(36).substring(7).toUpperCase()
    };
    setAuditLogs(prev => [...prev, newLog]);
  };

  const showToast = (icon: any, title: string, message: string, color: string) => {
    setToast({ icon, title, message, color });
    setTimeout(() => setToast(null), 4000);
  };

  const handleLogin = (user: User) => {
    if (user.status === 'TERMINATED') {
      showToast(AlertTriangle, 'Access Denied', 'This account has been archived and access revoked.', 'bg-red-600');
      return;
    }
    if (user.status === 'FROZEN') {
      showToast(Snowflake, 'Account Frozen', 'This profile has been temporarily suspended by the Secretary.', 'bg-cyan-600');
      return;
    }
    if (user.status === 'PENDING_APPROVAL') {
      showToast(AlertTriangle, 'Pending Approval', 'Your registration is awaiting board approval and final sign-off.', 'bg-orange-600');
      return;
    }
    setCurrentUser(user);
    addLog('USER_LOGIN', `Successful authentication via simulated 2FA`, user);
    setView('LOGIN'); 
  };

  const handleLogout = () => {
    if (currentUser) {
      addLog('USER_LOGOUT', 'User initiated sign out');
    }
    setCurrentUser(null);
    setView('LOGIN');
  };

  const handleForgotPassword = (email: string) => {
     const target = users.find(u => u.email?.toLowerCase() === email.toLowerCase());
     if (target) {
         addLog('PWD_RESET_REQ', `Self-service password reset requested via email.`, target);
         showToast(Mail, 'Link Sent', `Password reset instructions sent to ${email}`, 'bg-blue-600');
     } else {
         showToast(Mail, 'Link Sent', `Password reset instructions sent to ${email}`, 'bg-blue-600');
     }
  };

  const handleRequestPasswordReset = (targetUserId: string, reason: string) => {
    if (!currentUser || currentUser.role !== UserRole.SECRETARY) {
        showToast(AlertTriangle, 'Permission Denied', 'Only the Secretary can initiate a manual password reset.', 'bg-red-600');
        return;
    }

    if (currentUser.id === targetUserId) {
        showToast(AlertTriangle, 'Action Restricted', 'Please use the standard self-service reset for your own account.', 'bg-slate-700');
        return;
    }

    setUsers(prev => prev.map(u => {
        if (u.id === targetUserId) {
            return {
                ...u,
                passwordResetRequest: {
                    requestedBy: currentUser.id,
                    reason: reason,
                    approvals: [],
                    newTempPassword: Math.random().toString(36).slice(-8).toUpperCase()
                }
            };
        }
        return u;
    }));

    const targetUser = users.find(u => u.id === targetUserId);
    addLog('PWD_CHANGE_INIT', `Secretary initiated password reset for ${targetUser?.name}. Reason: ${reason}`, currentUser);
    showToast(Key, 'Request Initiated', 'Governance workflow active. Requires 1 Director approval.', 'bg-orange-600');
  };

  const handleApprovePasswordReset = (targetUserId: string) => {
      if (!currentUser) return;
      
      const targetUser = users.find(u => u.id === targetUserId);
      if (!targetUser || !targetUser.passwordResetRequest) return;

      if (currentUser.id === targetUser.passwordResetRequest.requestedBy) {
          showToast(AlertTriangle, 'Conflict of Interest', 'Requesters cannot approve their own governance motions.', 'bg-red-600');
          return;
      }

      const isDirector = currentUser.role !== UserRole.SECRETARY;
      if (!isDirector) {
          showToast(AlertTriangle, 'Insufficient Authority', 'Password resets must be approved by a Director or the Chairperson.', 'bg-red-600');
          return;
      }

      setUsers(prev => prev.map(u => {
          if (u.id === targetUserId && u.passwordResetRequest) {
             const approvals = [...u.passwordResetRequest.approvals, currentUser.id];
             if (approvals.length >= 1) {
                 addLog('PWD_CHANGE_FINAL', `Password reset finalized for ${u.name}. Approved by ${currentUser.name}.`, currentUser);
                 showToast(Lock, 'Password Finalized', `Access restored for ${u.name}. Credentials dispatched.`, 'bg-green-600');
                 return { ...u, passwordResetRequest: undefined }; 
             } else {
                 addLog('PWD_CHANGE_VOTE', `Voted to approve password reset for ${u.name}`, currentUser);
                 showToast(CheckCircle, 'Approval Recorded', 'Waiting for protocol finalization.', 'bg-blue-600');
                 return { ...u, passwordResetRequest: { ...u.passwordResetRequest, approvals } };
             }
          }
          return u;
      }));
  };

  const handleJoinMeeting = (meeting: Meeting) => {
    setActiveMeeting(meeting);
  };

  const handleLeaveMeeting = () => {
    setActiveMeeting(null);
  };

  const handleScheduleMeeting = (meetingData: Partial<Meeting>) => {
    if (meetingData.id) {
        setMeetings(meetings.map(m => m.id === meetingData.id ? { ...m, ...meetingData } as Meeting : m));
        addLog('MEETING_UPDATE', `Updated meeting details: ${meetingData.title}`, currentUser!);
        showToast(CalendarCheck, 'Meeting Updated', 'Calendar event has been revised.', 'bg-blue-600');
    } else {
        const newMeeting: Meeting = {
            id: `m_${Date.now()}`,
            title: meetingData.title || 'Untitled Meeting',
            date: meetingData.date || new Date().toISOString(),
            location: meetingData.location || 'Online',
            status: meetingData.status || MeetingStatus.SCHEDULED,
            agenda: [],
            complianceScore: 100
        };
        setMeetings(prev => [...prev, newMeeting]);
        addLog('MEETING_SCHEDULE', `Scheduled new meeting: ${newMeeting.title}`, currentUser!);
        showToast(CalendarCheck, 'Invitations Sent', `Meeting scheduled and notifications dispatched.`, 'bg-brand-900');
    }
  };

  const handleUploadDoc = (doc: RepositoryDoc) => {
    setRepositoryDocs(prev => [doc, ...prev]);
    addLog('DOC_UPLOAD', `Uploaded document: ${doc.title} (${doc.type})`, currentUser!);
    showToast(CheckCircle, 'Upload Successful', `${doc.title} has been added to the secure ledger.`, 'bg-green-600');
  };

  const handleDeleteRequest = (doc: RepositoryDoc) => {
    setRepositoryDocs(prev => prev.map(d => 
        d.id === doc.id 
        ? { ...d, pendingDeletion: { requestedBy: currentUser!.id, approvals: [] } }
        : d
    ));
    addLog('DOC_DELETE_REQ', `Requested deletion for: ${doc.title}`, currentUser!);
    showToast(Trash2, 'Deletion Requested', 'Approval required from 1 additional member to finalize.', 'bg-orange-600');
  };

  const handleDeleteApprove = (doc: RepositoryDoc) => {
    const updatedDocs = repositoryDocs.map(d => {
        if (d.id === doc.id && d.pendingDeletion) {
            const approvals = [...d.pendingDeletion.approvals, currentUser!.id];
            if (approvals.length >= 1) {
                return null; 
            }
            return { ...d, pendingDeletion: { ...d.pendingDeletion, approvals } };
        }
        return d;
    });

    const filteredDocs = updatedDocs.filter(d => d !== null) as RepositoryDoc[];
    
    if (filteredDocs.length < repositoryDocs.length) {
        setRepositoryDocs(filteredDocs);
        addLog('DOC_DELETE_FINAL', `Permanently deleted document: ${doc.title}`, currentUser!);
        showToast(Trash2, 'Document Deleted', 'Permanently removed from the repository.', 'bg-red-600');
    } else {
        setRepositoryDocs(filteredDocs);
        addLog('DOC_DELETE_VOTE', `Voted to delete document: ${doc.title}`, currentUser!);
        showToast(CheckCircle, 'Approval Recorded', 'Deletion vote recorded.', 'bg-blue-600');
    }
  };

  const handleAddAction = (newActionData: Partial<ActionItem>) => {
    if (!currentUser) return;
    
    const newAction: ActionItem = {
        id: `a_${Date.now()}`,
        task: newActionData.task || 'Untitled Task',
        owner: newActionData.owner || 'Unassigned',
        deadline: newActionData.deadline || new Date().toISOString().split('T')[0],
        status: ActionStatus.PENDING,
        source: 'Meeting', 
        lastUpdate: 'Assigned by Secretary'
    };

    setActions(prev => [newAction, ...prev]);
    addLog('ACTION_CREATE', `Assigned new action to ${newAction.owner}: ${newAction.task}`, currentUser);
    showToast(PlusCircle, 'Action Assigned', `Task assigned to ${newAction.owner}.`, 'bg-brand-900');
  };

  const handleRequestEditAction = (actionId: string, updates: Partial<ActionItem>) => {
    if (!currentUser) return;
    setActions(prev => prev.map(a => 
      a.id === actionId 
      ? { 
          ...a, 
          pendingEdit: {
            requestedBy: currentUser.id,
            approvals: [],
            newStatus: updates.status,
            newTask: updates.task,
            newDeadline: updates.deadline,
            newOwner: updates.owner
          } 
        } 
      : a
    ));
    addLog('ACTION_EDIT_REQ', `Requested update for action item.`, currentUser);
    showToast(Edit, 'Update Requested', 'Approval required from 1 additional member.', 'bg-orange-600');
  };

  const handleApproveEditAction = (actionId: string) => {
    if (!currentUser) return;
    
    let applied = false;
    
    setActions(prev => prev.map(a => {
      if (a.id === actionId && a.pendingEdit) {
         const approvals = [...a.pendingEdit.approvals];
         if (!approvals.includes(currentUser.id)) {
            approvals.push(currentUser.id);
         }

         if (approvals.length >= 1) {
             applied = true;
             return {
                 ...a,
                 status: a.pendingEdit.newStatus || a.status,
                 task: a.pendingEdit.newTask || a.task,
                 deadline: a.pendingEdit.newDeadline || a.deadline,
                 owner: a.pendingEdit.newOwner || a.owner,
                 pendingEdit: undefined,
                 lastUpdate: `Manual update approved by ${currentUser.name}`
             };
         } else {
             return { ...a, pendingEdit: { ...a.pendingEdit, approvals } };
         }
      }
      return a;
    }));

    if (applied) {
        addLog('ACTION_EDIT_FINAL', `Applied updates to action item.`, currentUser);
        showToast(CheckCircle, 'Action Updated', 'The changes have been applied successfully.', 'bg-green-600');
    } else {
        addLog('ACTION_EDIT_VOTE', `Approved update for action item.`, currentUser);
        showToast(CheckCircle, 'Approval Recorded', 'Waiting for protocol finalization.', 'bg-blue-600');
    }
  };

  const handleSimulateMessage = (type: 'whatsapp' | 'email', senderName: string, message: string) => {
    let actionUpdated = false;
    const newActions = actions.map(action => {
      if (action.owner.includes(senderName)) {
        actionUpdated = true;
        const isCompletion = message.toLowerCase().includes('complete') || message.toLowerCase().includes('done');
        return {
          ...action,
          status: isCompletion ? ActionStatus.COMPLETED : ActionStatus.IN_PROGRESS,
          lastUpdate: `${type === 'whatsapp' ? 'WhatsApp' : 'Email'}: "${message}"`,
          source: type === 'whatsapp' ? 'WhatsApp' : 'Email'
        } as ActionItem;
      }
      return action;
    });

    if (actionUpdated) {
      setActions(newActions);
      if (type === 'whatsapp') {
        showToast(MessageSquare, 'New WhatsApp Message', `From ${senderName}: "${message}"`, 'bg-green-600');
      } else {
        showToast(Mail, 'New Email Reply', `From ${senderName}: "${message}"`, 'bg-blue-600');
      }
    }
  };

  const handleSendReminders = () => {
    showToast(CheckCircle, 'Automated Reminders Sent', 'Pending action owners notified via secure gateway.', 'bg-brand-900');
    addLog('SYSTEM_ACTION', 'Triggered automated deadline reminders');
  };

  const handleOnboardingSubmit = (data: any) => {
      const avatarUrl = data.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name)}&background=random`;

      if (editingUser) {
          const updatedUsers = users.map(u => u.id === editingUser.id ? {
              ...u,
              name: data.name,
              role: data.role,
              email: data.email,
              documents: data.documents,
              initials: data.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase(),
              avatar: avatarUrl
          } : u);

          setUsers(updatedUsers);
          
          if (currentUser && currentUser.id === editingUser.id) {
            const updatedCurrent = updatedUsers.find(u => u.id === currentUser.id);
            if (updatedCurrent) setCurrentUser(updatedCurrent);
          }
          
          addLog('PROFILE_UPDATE', `Updated profile details for user: ${data.name}`, currentUser || editingUser);
          setEditingUser(null);
          showToast(CheckCircle, 'Profile Updated', 'Profile details have been updated successfully.', 'bg-blue-600');
      } else {
          const newUser: User = {
              id: `u_${Date.now()}`,
              name: data.name,
              role: data.role,
              email: data.email,
              status: 'PENDING_APPROVAL',
              approvals: [],
              terminationApprovals: [],
              documents: data.documents,
              initials: data.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase(),
              avatar: avatarUrl
          };
          setUsers([...users, newUser]);
          addLog('PROFILE_CREATE', `New director registration: ${newUser.name}`, newUser);
          showToast(CheckCircle, 'Profile Submitted', 'Awaiting Director approval and Secretary sign-off.', 'bg-brand-900');
      }
      setView('LOGIN');
  };

  const handleEditPending = (user: User) => {
      setEditingUser(user);
      setView('ONBOARDING');
  };
  
  const handleManageProfile = () => {
    if (currentUser) {
      setEditingUser(currentUser);
      setView('ONBOARDING');
    }
  };

  const handleRegister = () => {
      setEditingUser(null);
      setView('ONBOARDING');
  };

  const handleToggleFreeze = (targetUserId: string) => {
    if (!currentUser || currentUser.role !== UserRole.SECRETARY) {
      showToast(AlertTriangle, 'Permission Denied', 'Only the Company Secretary can freeze/unfreeze profiles.', 'bg-red-600');
      return;
    }

    setUsers(users.map(u => {
      if (u.id === targetUserId) {
        const isFrozen = u.status === 'FROZEN';
        const newStatus = isFrozen ? 'ACTIVE' : 'FROZEN';
        
        addLog(
          isFrozen ? 'USER_UNFREEZE' : 'USER_FREEZE', 
          `${isFrozen ? 'Unfrozen' : 'Frozen'} account for ${u.name}`, 
          currentUser
        );
        
        showToast(
          Snowflake, 
          isFrozen ? 'Account Restored' : 'Account Frozen', 
          `${u.name} has been ${isFrozen ? 'reactivated' : 'temporarily locked'}.`, 
          isFrozen ? 'bg-green-600' : 'bg-cyan-600'
        );
        
        return { ...u, status: newStatus };
      }
      return u;
    }));
  };

  const getApprovalCounts = (approvals: string[]) => {
    const approvers = users.filter(u => approvals.includes(u.id));
    const directorCount = approvers.filter(u => u.role !== UserRole.SECRETARY).length;
    const hasSecretary = approvers.some(u => u.role === UserRole.SECRETARY);
    return { directorCount, hasSecretary };
  };

  const handleApproveUser = (targetUserId: string) => {
    if (!currentUser) return;

    const targetUser = users.find(u => u.id === targetUserId);
    if (!targetUser) return;

    if (!targetUser.documents?.certifiedId || !targetUser.documents?.proofOfResidence || !targetUser.documents?.cv) {
        showToast(AlertTriangle, 'Compliance Alert', 'Mandatory FICA documents are missing.', 'bg-red-600');
        return;
    }

    const { directorCount } = getApprovalCounts(targetUser.approvals);
    const isSecretary = currentUser.role === UserRole.SECRETARY;

    if (isSecretary && directorCount < 2) {
        showToast(AlertTriangle, 'Protocol Violation', 'Secretary can only sign-off after 2 Director approvals.', 'bg-orange-600');
        return;
    }

    setUsers(users.map(u => {
        if (u.id === targetUserId) {
            const updatedApprovals = [...u.approvals, currentUser.id];
            const newCounts = getApprovalCounts(updatedApprovals);
            let newStatus = u.status;
            
            if (newCounts.directorCount >= 2 && newCounts.hasSecretary) {
                newStatus = 'ACTIVE';
                showToast(UserCheck, 'Director Activated', `${u.name} now has full board access.`, 'bg-green-600');
                addLog('USER_APPROVAL_FINAL', `Secretary Final Sign-off: Activated user ${u.name}`, currentUser);
            } else {
                showToast(CheckCircle, 'Approval Recorded', `Protocol progress: ${newCounts.directorCount}/2 Directors.`, 'bg-blue-600');
                addLog('USER_APPROVAL_VOTE', `Voted to approve user ${u.name}`, currentUser);
            }

            return { ...u, approvals: updatedApprovals, status: newStatus };
        }
        return u;
    }));
  };

  const handleInitiateTermination = (targetUserId: string, reason: string) => {
      if (!currentUser || (currentUser.role !== UserRole.CHAIRPERSON && currentUser.role !== UserRole.SECRETARY)) {
          return; 
      }
      setUsers(users.map(u => u.id === targetUserId ? { 
        ...u, 
        status: 'PENDING_TERMINATION', 
        terminationApprovals: [currentUser.id],
        terminationReason: reason
      } : u));
      const targetName = users.find(u => u.id === targetUserId)?.name;
      addLog('TERMINATION_INIT', `Initiated termination proceedings for ${targetName}.`, currentUser);
      showToast(UserMinus, 'Proceedings Initiated', 'Termination vote is now open in Governance Gateway.', 'bg-red-600');
  };

  const handleVoteTermination = (targetUserId: string) => {
      if (!currentUser) return;
      const targetUser = users.find(u => u.id === targetUserId);
      if (!targetUser) return;

      const currentTermApprovals = targetUser.terminationApprovals || [];
      const { directorCount } = getApprovalCounts(currentTermApprovals);
      const isSecretary = currentUser.role === UserRole.SECRETARY;

      if (isSecretary && directorCount < 2) {
        showToast(AlertTriangle, 'Protocol Violation', 'Secretary can only finalize termination after 2 Director votes.', 'bg-orange-600');
        return;
      }

      setUsers(users.map(u => {
        if (u.id === targetUserId) {
            const updatedTermApprovals = [...(u.terminationApprovals || []), currentUser.id];
            const newCounts = getApprovalCounts(updatedTermApprovals);
            let newStatus = u.status;

            if (newCounts.directorCount >= 2 && newCounts.hasSecretary) {
                newStatus = 'TERMINATED';
                showToast(UserMinus, 'Director Archived', `${u.name} has been formally terminated.`, 'bg-red-800');
                addLog('USER_TERMINATION_FINAL', `Secretary Final Sign-off: Terminated user ${u.name}`, currentUser);
            } else {
                showToast(CheckCircle, 'Termination Vote Recorded', `Waiting for final sign-off.`, 'bg-orange-600');
                addLog('USER_TERMINATION_VOTE', `Voted to terminate user ${u.name}`, currentUser);
            }

            return { ...u, terminationApprovals: updatedTermApprovals, status: newStatus };
        }
        return u;
      }));
  };

  if (view === 'ONBOARDING') {
      return (
          <DirectorOnboarding 
            onBack={() => setView('LOGIN')} 
            onSubmit={handleOnboardingSubmit}
            initialData={editingUser}
          />
      );
  }

  if (!currentUser) {
    return (
        <Login 
            users={users} 
            onLogin={handleLogin} 
            onRegister={handleRegister}
            onForgotPassword={handleForgotPassword}
        />
    );
  }

  if (activeMeeting) {
    return (
      <MeetingView 
        meeting={activeMeeting} 
        currentUser={currentUser}
        users={users}
        onLeave={handleLeaveMeeting} 
        onLog={addLog}
      />
    );
  }

  if (view === 'AUDIT_LOG') {
    const visibleLogs = currentUser?.role === UserRole.SECRETARY 
      ? auditLogs 
      : auditLogs.filter(log => log.userId === currentUser?.id);

    return (
      <AuditLogView 
        logs={visibleLogs}
        onBack={() => setView('LOGIN')} 
      />
    );
  }

  if (view === 'CALENDAR') {
    return (
      <CalendarView 
        meetings={meetings}
        user={currentUser}
        onBack={() => setView('LOGIN')}
        onSchedule={handleScheduleMeeting}
        onJoin={handleJoinMeeting}
      />
    );
  }

  if (view === 'REPOSITORY') {
    return (
      <RepositoryView 
        documents={repositoryDocs}
        user={currentUser}
        onBack={() => setView('LOGIN')}
        onUpload={handleUploadDoc}
        onDeleteRequest={handleDeleteRequest}
        onDeleteApprove={handleDeleteApprove}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 relative">
      <Dashboard 
        user={currentUser} 
        users={users}
        meetings={meetings} 
        actions={actions} 
        pendingUsers={users}
        documents={repositoryDocs}
        onJoinMeeting={handleJoinMeeting}
        onSimulateMessage={handleSimulateMessage}
        onSendReminders={handleSendReminders}
        onApproveUser={handleApproveUser}
        onEditPending={handleEditPending}
        onInitiateTermination={handleInitiateTermination}
        onVoteTermination={handleVoteTermination}
        onToggleFreeze={handleToggleFreeze}
        onManageProfile={handleManageProfile}
        onViewAuditLogs={() => setView('AUDIT_LOG')}
        onViewCalendar={() => setView('CALENDAR')}
        onViewRepository={() => setView('REPOSITORY')}
        onLogout={handleLogout}
        onRequestEditAction={handleRequestEditAction}
        onApproveEditAction={handleApproveEditAction}
        onAddAction={handleAddAction}
        onRequestPasswordReset={handleRequestPasswordReset}
        onApprovePasswordReset={handleApprovePasswordReset}
      />

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
          <div className={`${toast.color} text-white p-4 rounded-lg shadow-xl flex items-start space-x-3 max-w-sm`}>
            <div className="p-1 bg-white/20 rounded">
              <toast.icon className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm">{toast.title}</h4>
              <p className="text-xs text-white/90 mt-1">{toast.message}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;