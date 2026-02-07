import React, { useState } from 'react';
import { Meeting, ActionItem, User, MeetingStatus, UserRole, RepositoryDoc } from '../types';
import ActionTracker from './ActionTracker';
import { Calendar, Video, RefreshCw, PlusCircle, Check, Loader2, MessageSquare, Mail, Zap, Send, TrendingUp, AlertOctagon, UserCheck, FileCheck, CheckCircle2, FileText, LogOut, Edit, Lock, AlertTriangle, UserMinus, ShieldAlert, Snowflake, Unlock, FolderOpen, ListChecks, FileSearch, UserCog, Archive, Key } from 'lucide-react';
import { planNextMeetingStrategy } from '../services/geminiService';
import { PAST_MINUTES_MOCK, LATEST_PACK_CONTENT } from '../constants';

interface DashboardProps {
  user: User;
  users: User[]; // Full user list to calculate approvals
  meetings: Meeting[];
  actions: ActionItem[];
  pendingUsers: User[]; // Users waiting for approval OR termination OR password reset
  documents: RepositoryDoc[];
  onJoinMeeting: (meeting: Meeting) => void;
  onSimulateMessage: (type: 'whatsapp' | 'email', senderName: string, message: string) => void;
  onSendReminders: () => void;
  onApproveUser: (pendingUserId: string) => void;
  onEditPending: (user: User) => void;
  onInitiateTermination: (userId: string, reason: string) => void;
  onVoteTermination: (userId: string) => void;
  onToggleFreeze: (userId: string) => void;
  onManageProfile: () => void;
  onViewAuditLogs: () => void;
  onViewCalendar: () => void;
  onViewRepository: () => void;
  onLogout: () => void;
  onRequestEditAction: (actionId: string, updates: Partial<ActionItem>) => void;
  onApproveEditAction: (actionId: string) => void;
  onAddAction: (action: Partial<ActionItem>) => void;
  onRequestPasswordReset: (userId: string, reason: string) => void;
  onApprovePasswordReset: (userId: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  user, users, meetings, actions, pendingUsers, documents,
  onJoinMeeting, onSimulateMessage, onSendReminders, 
  onApproveUser, onEditPending, onInitiateTermination, onVoteTermination, onToggleFreeze, onManageProfile,
  onViewAuditLogs, onViewCalendar, onViewRepository, onLogout, onRequestEditAction, onApproveEditAction, onAddAction,
  onRequestPasswordReset, onApprovePasswordReset
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiStrategy, setAiStrategy] = useState<{ suggestedAgenda: string[]; actionAudit: string } | null>(null);

  const isSecretary = user.role === UserRole.SECRETARY;
  const isChair = user.role === UserRole.CHAIRPERSON;
  const isDirector = user.role !== UserRole.SECRETARY;
  
  // Restrict AI Planner to Secretary and Executives only
  const showAiPlanner = user.role === UserRole.SECRETARY || user.role === UserRole.EXECUTIVE;
  
  // Hide Live Omni-Channel Simulation for Non-Executives
  const showLiveSimulation = user.role !== UserRole.NON_EXECUTIVE;

  const terminatedUsers = users.filter(u => u.status === 'TERMINATED');

  // Filter for actual items needing attention in the Gateway
  const governanceQueue = pendingUsers.filter(u => 
      u.status === 'PENDING_APPROVAL' || 
      u.status === 'PENDING_TERMINATION' || 
      !!u.passwordResetRequest
  );

  const handleGenerateAgenda = async () => {
    setIsGenerating(true);

    const latestPack = documents
        .filter(d => d.type === 'PACK')
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

    const packContext = latestPack 
        ? `LATEST BOARD PACK (${latestPack.title}):\n${LATEST_PACK_CONTENT}` 
        : `PREVIOUS MINUTES:\n${PAST_MINUTES_MOCK}`;

    const actionsContext = actions.map(a => `[${a.status}] ${a.task} (Owner: ${a.owner}, Due: ${a.deadline})`).join('; ');
    
    const combinedContext = latestPack 
      ? `${packContext}\n\n(Note: Also consider past minutes if relevant: ${PAST_MINUTES_MOCK.substring(0, 200)}...)`
      : packContext;

    const result = await planNextMeetingStrategy(combinedContext, actionsContext);
    setAiStrategy(result);
    setIsGenerating(false);
  };

  const getApprovalProgress = (approvals: string[]) => {
    const approverUsers = users.filter(u => approvals.includes(u.id));
    const directors = approverUsers.filter(u => u.role !== UserRole.SECRETARY).length;
    const secretary = approverUsers.some(u => u.role === UserRole.SECRETARY);
    return { directors, secretary };
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h1 className="text-3xl font-bold text-brand-900">Welcome, {user.name.split(' ')[0]}</h1>
            <p className="text-slate-500 mt-1">Boardwise SA • {user.role.replace('_', ' ')} Portal</p>
        </div>
        <div className="flex flex-wrap gap-2">
            <button 
                onClick={onViewRepository}
                className="flex items-center px-4 py-2 bg-white border border-slate-300 rounded-md text-slate-700 hover:bg-slate-50 font-medium shadow-sm transition-colors"
            >
                <FolderOpen className="w-4 h-4 mr-2 text-slate-500" />
                <span>Documents</span>
            </button>
            <button 
                onClick={onViewCalendar}
                className="flex items-center px-4 py-2 bg-white border border-slate-300 rounded-md text-slate-700 hover:bg-slate-50 font-medium shadow-sm"
            >
                <Calendar className="w-4 h-4 mr-2 text-slate-500" />
                <span>Calendar</span>
            </button>
            <button 
                onClick={onManageProfile}
                className="flex items-center px-4 py-2 bg-white border border-slate-300 rounded-md text-slate-700 hover:bg-slate-50 font-medium shadow-sm transition-colors"
            >
                <UserCog className="w-4 h-4 mr-2 text-slate-500" />
                <span>Profile</span>
            </button>
            <button 
                onClick={onViewAuditLogs}
                className="flex items-center px-4 py-2 bg-white border border-slate-300 rounded-md text-slate-700 hover:bg-slate-50 font-medium shadow-sm transition-colors"
            >
                <FileText className="w-4 h-4 mr-2 text-slate-500" />
                <span>Audit Log</span>
            </button>
            <button 
                onClick={onLogout}
                className="flex items-center px-4 py-2 bg-red-50 border border-red-100 rounded-md text-red-700 hover:bg-red-100 font-medium shadow-sm transition-colors"
            >
                <LogOut className="w-4 h-4 mr-2" />
                <span>Sign Out</span>
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Col: Meetings & Governance */}
        <div className="lg:col-span-1 space-y-6">
            
            {/* Governance Gateway */}
            {governanceQueue.length > 0 && (
                <div className="bg-white p-4 rounded-lg shadow-sm border border-brand-900/10 bg-gradient-to-b from-blue-50/50">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                            <UserCheck className="w-4 h-4 text-blue-600" />
                            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Governance Gateway</span>
                        </div>
                        <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">Action Req.</span>
                    </div>
                    <div className="space-y-3">
                        {governanceQueue.map(pUser => {
                            const isTermination = pUser.status === 'PENDING_TERMINATION';
                            const isPasswordReset = !!pUser.passwordResetRequest;
                            
                            let approvalList: string[] = [];
                            if (isTermination) approvalList = pUser.terminationApprovals || [];
                            else if (isPasswordReset) approvalList = pUser.passwordResetRequest?.approvals || [];
                            else approvalList = pUser.approvals;

                            const hasVoted = approvalList.includes(user.id);
                            const progress = getApprovalProgress(approvalList);
                            const hasDocs = pUser.documents?.certifiedId && pUser.documents?.proofOfResidence && pUser.documents?.cv;
                            
                            let borderColor = 'border-slate-200';
                            let bgColor = 'bg-white';
                            if (isTermination) { borderColor = 'border-red-200'; bgColor = 'bg-red-50'; }
                            if (isPasswordReset) { borderColor = 'border-orange-200'; bgColor = 'bg-orange-50'; }

                            // Protocol check for Reset: Requested by X, must be approved by a Director who is NOT X.
                            const canApproveReset = isPasswordReset && isDirector && (pUser.passwordResetRequest?.requestedBy !== user.id);

                            return (
                                <div key={pUser.id} className={`bg-white border rounded-md p-3 ${borderColor} ${bgColor}`}>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-sm font-bold text-slate-800 flex items-center gap-1">
                                                {pUser.name}
                                                {isTermination && <span className="text-[10px] bg-red-100 text-red-600 px-1 rounded">TERMINATION</span>}
                                                {isPasswordReset && <span className="text-[10px] bg-orange-100 text-orange-600 px-1 rounded">PWD RESET</span>}
                                            </p>
                                            <p className="text-xs text-slate-500">{pUser.role.replace('_', ' ')}</p>
                                        </div>
                                        {!isTermination && !isPasswordReset && (
                                            <div className="flex space-x-1">
                                                {pUser.documents?.certifiedId && <FileCheck className="w-3 h-3 text-green-500" title="Certified ID" />}
                                                {pUser.documents?.proofOfResidence && <FileCheck className="w-3 h-3 text-green-500" title="Proof of Res" />}
                                                {pUser.documents?.cv && <FileCheck className="w-3 h-3 text-green-500" title="CV" />}
                                            </div>
                                        )}
                                    </div>

                                    {isTermination && pUser.terminationReason && (
                                        <div className="mt-2 p-2 bg-red-100/50 border border-red-200 rounded text-xs text-red-800">
                                            <span className="font-bold uppercase block mb-0.5">Termination Reason:</span> 
                                            <span className="italic">"{pUser.terminationReason}"</span>
                                        </div>
                                    )}
                                    {isPasswordReset && pUser.passwordResetRequest?.reason && (
                                        <div className="mt-2 p-2 bg-orange-100/50 border border-orange-200 rounded text-xs text-orange-800">
                                            <span className="font-bold uppercase block mb-0.5">Reset Reason:</span> 
                                            <span className="italic">"{pUser.passwordResetRequest.reason}"</span>
                                        </div>
                                    )}
                                    
                                    {!hasDocs && !isTermination && !isPasswordReset && (
                                         <div className="mt-2 text-[10px] text-red-500 font-bold bg-red-50 p-1 rounded flex items-center">
                                            <AlertTriangle className="w-3 h-3 mr-1" />
                                            FICA Documents Missing
                                         </div>
                                    )}

                                    <div className="mt-3 flex flex-col space-y-2">
                                        <div className="flex items-center justify-between text-xs text-slate-500">
                                            {isPasswordReset ? (
                                                <span className={approvalList.length >= 1 ? 'text-green-600 font-bold' : ''}>
                                                    Protocol: {approvalList.length}/1 Director
                                                </span>
                                            ) : (
                                                <>
                                                    <span className={progress.directors >= 2 ? 'text-green-600 font-bold' : ''}>
                                                        Directors: {progress.directors}/2
                                                    </span>
                                                    <span className={progress.secretary ? 'text-green-600 font-bold' : ''}>
                                                        Secretary: {progress.secretary ? 'Signed' : 'Pending'}
                                                    </span>
                                                </>
                                            )}
                                        </div>

                                        <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                                            {isSecretary && !isTermination && !isPasswordReset && (
                                                <button 
                                                    onClick={() => onEditPending(pUser)}
                                                    className="text-xs bg-slate-100 text-slate-600 px-2 py-1.5 rounded hover:bg-slate-200 transition-colors font-medium flex items-center"
                                                    title="Edit Application"
                                                >
                                                    <Edit className="w-3 h-3" />
                                                </button>
                                            )}

                                            {hasVoted ? (
                                                <span className="flex items-center text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded">
                                                    <CheckCircle2 className="w-3 h-3 mr-1" /> Voted
                                                </span>
                                            ) : (
                                                <button 
                                                    onClick={() => {
                                                        if (isTermination) onVoteTermination(pUser.id);
                                                        else if (isPasswordReset) onApprovePasswordReset(pUser.id);
                                                        else onApproveUser(pUser.id);
                                                    }}
                                                    disabled={
                                                        (!isTermination && !isPasswordReset && !hasDocs) || 
                                                        (isPasswordReset && !canApproveReset)
                                                    } 
                                                    className={`text-xs px-3 py-1.5 rounded transition-colors font-medium text-white
                                                        ${((!isTermination && !isPasswordReset && !hasDocs) || (isPasswordReset && !canApproveReset)) ? 'bg-slate-300 cursor-not-allowed' : 
                                                          isTermination ? 'bg-red-600 hover:bg-red-700' : 
                                                          isPasswordReset ? 'bg-orange-500 hover:bg-orange-600' :
                                                          'bg-brand-900 hover:bg-brand-800'}
                                                    `}
                                                >
                                                    {isTermination ? 'Vote to Terminate' : 
                                                     isPasswordReset ? 'Authorize Reset' :
                                                     isSecretary && progress.directors >= 2 ? 'Final Sign-off' : 'Approve'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
            
            {/* Board Registry */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
                 <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                    <div className="flex items-center space-x-2">
                        <UserCheck className="w-4 h-4 text-slate-600" />
                        <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Board Registry</span>
                    </div>
                </div>
                <div className="space-y-2">
                    {users.filter(u => u.status === 'ACTIVE' || u.status === 'FROZEN').map(activeUser => {
                         const isFrozen = activeUser.status === 'FROZEN';
                         const isMe = activeUser.id === user.id;
                         return (
                            <div key={activeUser.id} className={`flex items-center justify-between p-2 rounded group ${isFrozen ? 'bg-cyan-50 border border-cyan-100' : 'hover:bg-slate-50'}`}>
                                 <div className="flex items-center space-x-2">
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${isFrozen ? 'bg-cyan-200 text-cyan-800' : 'bg-slate-200 text-slate-600'}`}>
                                        {isFrozen ? <Snowflake className="w-3 h-3" /> : activeUser.initials}
                                    </div>
                                    <div>
                                        <p className={`text-xs font-bold ${isFrozen ? 'text-cyan-800' : 'text-slate-700'}`}>{activeUser.name}{isMe && ' (You)'}</p>
                                        <p className="text-[10px] text-slate-500">{isFrozen ? 'FROZEN ACCOUNT' : activeUser.role.replace('_', ' ')}</p>
                                    </div>
                                 </div>
                                 
                                 <div className="flex items-center">
                                    {isSecretary && (
                                        <button
                                            onClick={() => onEditPending(activeUser)}
                                            className="text-xs p-1 rounded transition-all mr-1 text-slate-400 hover:text-brand-900 hover:bg-slate-100"
                                            title="Edit Profile"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                    )}

                                    {isSecretary && !isMe && (
                                        <button
                                            onClick={() => onToggleFreeze(activeUser.id)}
                                            className={`text-xs p-1 rounded transition-all mr-1 ${
                                                isFrozen 
                                                ? 'text-green-500 hover:bg-green-50' 
                                                : 'text-cyan-500 hover:bg-cyan-50'
                                            }`}
                                            title={isFrozen ? "Unfreeze Account" : "Freeze Account"}
                                        >
                                            {isFrozen ? <Unlock className="w-4 h-4" /> : <Snowflake className="w-4 h-4" />}
                                        </button>
                                    )}

                                    {isSecretary && !isFrozen && !isMe && (
                                        <button
                                            onClick={() => {
                                                if (confirm(`Initiate governed password reset for ${activeUser.name}? Requires Director approval.`)) {
                                                    const reason = prompt("Enter formal reason for reset:");
                                                    if (reason) onRequestPasswordReset(activeUser.id, reason);
                                                }
                                            }}
                                            className="text-xs p-1 rounded transition-all mr-1 text-slate-400 hover:text-orange-500 hover:bg-orange-50"
                                            title="Governance Reset"
                                        >
                                            <Key className="w-4 h-4" />
                                        </button>
                                    )}

                                    {(isChair || isSecretary) && !isMe && !isFrozen && (
                                        <button 
                                            onClick={() => {
                                                if (confirm(`Initiate termination for ${activeUser.name}?`)) {
                                                    const reason = prompt("Enter formal reason for removal:");
                                                    if (reason && reason.trim()) onInitiateTermination(activeUser.id, reason);
                                                }
                                            }}
                                            className="text-xs text-red-400 hover:text-red-600 p-1 hover:bg-red-50 rounded transition-all"
                                            title="Initiate Removal"
                                        >
                                            <UserMinus className="w-4 h-4" />
                                        </button>
                                    )}
                                 </div>
                            </div>
                        );
                    })}
                </div>
            </div>

             {/* Archived Directors */}
            {terminatedUsers.length > 0 && (
                <div className="bg-slate-50 p-4 rounded-lg shadow-inner border border-slate-200">
                    <div className="flex items-center justify-between mb-3 border-b border-slate-200 pb-2">
                        <div className="flex items-center space-x-2">
                            <Archive className="w-4 h-4 text-slate-500" />
                            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Archived Records</span>
                        </div>
                    </div>
                    <div className="space-y-2">
                        {terminatedUsers.map(archivedUser => (
                            <div key={archivedUser.id} className="flex items-center justify-between p-2 rounded bg-white border border-slate-100 opacity-75">
                                <div className="flex items-center space-x-2">
                                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold bg-slate-100 text-slate-400">
                                        {archivedUser.initials}
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-500 line-through">{archivedUser.name}</p>
                                        <p className="text-[10px] text-slate-400 italic">Terminated: {archivedUser.terminationReason || 'No reason'}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <h2 className="text-lg font-bold text-slate-800 flex items-center pt-2">
                Meetings
                <span className="ml-2 bg-brand-accent/20 text-brand-900 text-xs px-2 py-0.5 rounded-full">{meetings.length}</span>
            </h2>
            
            <div className="space-y-4">
                {meetings.slice(0, 3).map(meeting => (
                    <div key={meeting.id} className="bg-white p-5 rounded-lg shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-3">
                            <div className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-1 rounded uppercase">
                                {new Date(meeting.date).toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' })}
                            </div>
                            <span className={`text-xs font-bold px-2 py-1 rounded ${
                                meeting.status === MeetingStatus.LIVE ? 'bg-green-100 text-green-700 animate-pulse' : 'bg-slate-100 text-slate-500'
                            }`}>
                                {meeting.status}
                            </span>
                        </div>
                        <h3 className="font-bold text-slate-900 mb-1">{meeting.title}</h3>
                        <p className="text-sm text-slate-500 mb-4">{meeting.location}</p>
                        
                        {meeting.status === MeetingStatus.LIVE ? (
                            <button 
                                onClick={() => onJoinMeeting(meeting)}
                                className="w-full flex items-center justify-center space-x-2 bg-brand-900 text-white py-2 rounded-md font-semibold hover:bg-brand-800"
                            >
                                <Video className="w-4 h-4" />
                                <span>Join Now</span>
                            </button>
                        ) : (
                            <button onClick={onViewCalendar} className="w-full py-2 border border-slate-300 text-slate-600 rounded-md text-sm font-medium hover:bg-slate-50">
                                View Details
                            </button>
                        )}
                    </div>
                ))}
            </div>

            {showAiPlanner && (
            <div className="bg-gradient-to-br from-brand-900 to-brand-800 p-5 rounded-lg text-white shadow-lg">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <h3 className="font-bold text-lg">AI Strategy Planner</h3>
                        <p className="text-xs text-brand-accent/80">Governance Engine</p>
                    </div>
                    <div className="p-2 bg-white/10 rounded-lg">
                        <Zap className="w-5 h-5 text-brand-accent" />
                    </div>
                </div>
                <button 
                    onClick={handleGenerateAgenda}
                    disabled={isGenerating}
                    className="w-full bg-white text-brand-900 py-2.5 rounded font-bold hover:bg-slate-100 transition-colors flex items-center justify-center space-x-2 shadow-sm"
                >
                    {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <ListChecks className="w-4 h-4" />}
                    <span>{isGenerating ? 'Analyzing...' : 'Generate Strategy'}</span>
                </button>
                {aiStrategy && (
                     <div className="mt-4 bg-white/10 rounded p-3 text-xs">
                        <strong className="block text-brand-accent mb-1 uppercase tracking-wide">Action Audit:</strong>
                        <p className="text-slate-300 leading-relaxed">{aiStrategy.actionAudit}</p>
                     </div>
                )}
            </div>
            )}
        </div>

        <div className="lg:col-span-2">
            <ActionTracker 
              actions={actions} 
              user={user} 
              users={users}
              onRequestEdit={onRequestEditAction} 
              onApproveEdit={onApproveEditAction} 
              onAddAction={onAddAction}
            />
            
            {showLiveSimulation && (
                <div className="mt-8 bg-slate-100 border border-slate-200 rounded-lg p-6">
                    <div className="flex items-center space-x-2 mb-4 text-slate-700">
                        <Zap className="w-5 h-5" />
                        <h3 className="font-bold">Live Integration Simulation</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <button 
                            onClick={() => onSimulateMessage('whatsapp', 'Sarah Van Der Merwe', 'Acquisition pack review complete. Secure link uploaded.')}
                            className="flex items-center justify-center space-x-2 bg-green-600 text-white px-4 py-3 rounded hover:bg-green-700 shadow-sm"
                        >
                            <MessageSquare className="w-4 h-4" />
                            <span>WhatsApp Simulation</span>
                        </button>
                        <button 
                            onClick={() => onSimulateMessage('email', 'Sipho Nkosi', 'RE: SENS draft is approved. Proceed to distribution.')}
                            className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-3 rounded hover:bg-blue-700 shadow-sm"
                        >
                            <Mail className="w-4 h-4" />
                            <span>Email Simulation</span>
                        </button>
                        <button 
                            onClick={onSendReminders}
                            className="flex items-center justify-center space-x-2 bg-slate-800 text-white px-4 py-3 rounded hover:bg-slate-900 shadow-sm"
                        >
                            <Send className="w-4 h-4" />
                            <span>Global Reminders</span>
                        </button>
                    </div>
                </div>
            )}
        </div>

      </div>
    </div>
  );
};

export default Dashboard;