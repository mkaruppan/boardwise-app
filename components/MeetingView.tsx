import React, { useState, useEffect } from 'react';
import { Meeting, AgendaItem, VoteType, User, UserRole, MeetingStatus } from '../types';
import { Shield, Lock, Users, FileText, Gavel, AlertTriangle, CheckCircle2, ChevronRight, ChevronLeft, Download, Video, MicOff, AlertCircle, StopCircle, Sparkles, FileSignature, Printer, ChevronDown, Clock, User as UserIcon, MinusCircle, Eye, Check, X, Edit, ExternalLink } from 'lucide-react';
import { checkComplianceAI, generatePostMeetingDocs } from '../services/geminiService';
import Logo from './Logo';

interface MeetingViewProps {
  meeting: Meeting;
  currentUser: User;
  users: User[]; // Full user list needed for weighted voting calculation
  onLeave: () => void;
  onLog: (action: string, details: string, userOverride?: User) => void;
}

const NavBtn = ({ icon: Icon, label, active, onClick }: any) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center space-x-3 px-6 py-3 text-sm font-medium transition-colors border-l-4 ${
      active
        ? 'text-brand-900 bg-white border-brand-accent shadow-sm'
        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100 border-transparent'
    }`}
  >
    <Icon className="w-5 h-5" />
    <span className="hidden md:inline">{label}</span>
  </button>
);

const MeetingView: React.FC<MeetingViewProps> = ({ meeting, currentUser, users, onLeave, onLog }) => {
  const [activeTab, setActiveTab] = useState<'agenda' | 'pack' | 'vote' | 'vault'>('agenda');
  const [isInCamera, setIsInCamera] = useState(false);
  const [governanceAlert, setGovernanceAlert] = useState<string | null>(null);
  const [activeVote, setActiveVote] = useState<{ id: string, question: string, votes: Record<string, VoteType> } | null>(null);
  const [expandedAgendaIds, setExpandedAgendaIds] = useState<Set<string>>(new Set());
  
  // Location State
  const [location, setLocation] = useState(meeting.location || 'Online');
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [tempLocation, setTempLocation] = useState(location);
  
  // Compliance State
  const [hasDeclaredInterests, setHasDeclaredInterests] = useState(false);
  const [interestNote, setInterestNote] = useState("");

  // Post Meeting State
  const [isMeetingClosed, setIsMeetingClosed] = useState(false);
  const [isGeneratingDocs, setIsGeneratingDocs] = useState(false);
  const [generatedDocs, setGeneratedDocs] = useState<{ summary: string; resolutions: string; actions: string } | null>(null);

  // Helper to check if location is a link
  const isLink = (str: string) => str.startsWith('http://') || str.startsWith('https://');

  // Attendance Tracking
  useEffect(() => {
    const startTime = Date.now();
    onLog('MEETING_ATTENDANCE', `Joined meeting: ${meeting.title}`, currentUser);

    return () => {
      const durationSeconds = Math.round((Date.now() - startTime) / 1000);
      const minutes = Math.floor(durationSeconds / 60);
      const seconds = durationSeconds % 60;
      onLog('MEETING_ATTENDANCE', `Left meeting: ${meeting.title}. Duration: ${minutes}m ${seconds}s`, currentUser);
    };
  }, []);

  // Simulated AI Monitoring Effect
  useEffect(() => {
    if (!hasDeclaredInterests || isMeetingClosed) return;

    const interval = setInterval(async () => {
      // Simulate grabbing a snippet of "conversation"
      const snippets = [
        "We need to discuss the dividend declaration.",
        "Has the social and ethics committee reviewed this?",
        "I'm concerned about the conflict of interest here.",
        "Moving on to the B-BBEE strategy review."
      ];
      const randomSnippet = snippets[Math.floor(Math.random() * snippets.length)];
      
      const alert = await checkComplianceAI(meeting.agenda, randomSnippet);
      if (alert !== "Governance checks passed.") {
        setGovernanceAlert(alert);
        // Auto-dismiss after 10s
        setTimeout(() => setGovernanceAlert(null), 10000);
      }
    }, 20000);

    return () => clearInterval(interval);
  }, [meeting.agenda, hasDeclaredInterests, isMeetingClosed]);

  const toggleInCamera = () => {
    if (!isInCamera) {
      if (confirm("WARNING: You are entering 'In-Camera' mode.\n\n• Recording will be encrypted.\n• Non-Executive members may be excluded based on policy.\n• Transcript moves to the Secure Vault.")) {
        setIsInCamera(true);
        setActiveTab('vault');
      }
    } else {
      setIsInCamera(false);
      setActiveTab('agenda');
    }
  };

  const startVote = () => {
    setActiveVote({
      id: Date.now().toString(),
      question: "Resolution 1: Approve Q2 Financial Statements",
      votes: {}
    });
  };

  const castVote = (type: VoteType) => {
    if (activeVote) {
      setActiveVote({
        ...activeVote,
        votes: { ...activeVote.votes, [currentUser.id]: type }
      });
    }
  };

  const getVoteCounts = () => {
    if (!activeVote) return { for: 0, against: 0, abstain: 0 };
    
    let counts = { for: 0, against: 0, abstain: 0 };
    
    Object.entries(activeVote.votes).forEach(([userId, voteType]) => {
      // Calculate weighting: Executives get 2 votes, others get 1
      const voter = users.find(u => u.id === userId);
      const weight = voter?.role === UserRole.EXECUTIVE ? 2 : 1;
      
      if (voteType === VoteType.FOR) counts.for += weight;
      if (voteType === VoteType.AGAINST) counts.against += weight;
      if (voteType === VoteType.ABSTAIN) counts.abstain += weight;
    });

    return counts;
  };

  const getMaxPossibleVotes = () => {
      // Calculates total possible weighted score if everyone voted
      return users.reduce((acc, u) => {
          // Secretaries don't vote
          if (u.role === UserRole.SECRETARY) return acc;
          const weight = u.role === UserRole.EXECUTIVE ? 2 : 1;
          return acc + weight;
      }, 0);
  };

  const handleConfirmDeclaration = () => {
    onLog(
      'COMPLIANCE_DECLARATION', 
      `Section 75 Declaration confirmed. Disclosure Notes: ${interestNote || 'None provided.'}`, 
      currentUser
    );
    setHasDeclaredInterests(true);
  };

  const handleCloseMeeting = () => {
    if (confirm("Are you sure you want to close this meeting? This will stop recording and trigger minutes generation.")) {
        setIsMeetingClosed(true);
        onLog('MEETING_CLOSED', `Meeting formally closed by ${currentUser.name}`, currentUser);
    }
  };

  const handleGenerateDocs = async () => {
      setIsGeneratingDocs(true);
      
      const counts = getVoteCounts();
      const voteSummary = activeVote 
        ? `Vote on '${activeVote.question}': ${counts.for} For, ${counts.against} Against (Weighted).` 
        : "No formal votes recorded.";

      const docs = await generatePostMeetingDocs(meeting.title, meeting.agenda, voteSummary);
      setGeneratedDocs(docs);
      setIsGeneratingDocs(false);
      onLog('DOCS_GENERATED', 'Minutes and Resolutions generated via AI', currentUser);
  };

  const downloadResolutions = () => {
    if (!generatedDocs) return;
    
    const content = `BOARDWISE SA - OFFICIAL MINUTES & RESOLUTIONS\n` +
      `MEETING: ${meeting.title}\n` +
      `DATE: ${new Date().toLocaleDateString()}\n\n` +
      `================================================\n` +
      `EXECUTIVE SUMMARY\n` +
      `================================================\n` +
      `${generatedDocs.summary}\n\n` +
      `================================================\n` +
      `FORMAL RESOLUTIONS\n` +
      `================================================\n` +
      `${generatedDocs.resolutions}\n\n` +
      `================================================\n` +
      `ACTION ITEMS\n` +
      `================================================\n` +
      `${generatedDocs.actions}\n\n\n` +
      `--------------------------------------\n` +
      `Signed: (Chairperson)       Date: _____`;
      
    const element = document.createElement("a");
    const file = new Blob([content], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `Minutes_${meeting.title.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(element); 
    element.click();
    document.body.removeChild(element);
    
    onLog('DOC_DOWNLOAD', 'Downloaded official minutes and resolutions', currentUser);
  };

  const toggleAgendaItem = (id: string) => {
    const newSet = new Set(expandedAgendaIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedAgendaIds(newSet);
  };

  // --- Sub-Render Functions ---

  const renderAgenda = () => (
    <div className="space-y-4 animate-in fade-in">
        <h2 className={`text-lg font-bold mb-4 ${isInCamera ? 'text-white' : 'text-slate-800'}`}>Meeting Agenda</h2>
        {meeting.agenda.map((item, index) => (
            <div key={item.id} className={`${isInCamera ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} border rounded-lg overflow-hidden`}>
                <button 
                    onClick={() => toggleAgendaItem(item.id)}
                    className={`w-full flex items-center justify-between p-4 ${isInCamera ? 'hover:bg-slate-700' : 'hover:bg-slate-50'} transition-colors`}
                >
                    <div className="flex items-center space-x-4">
                        <span className="text-slate-400 font-mono text-sm">{index + 1}.</span>
                        <div className="text-left">
                            <h3 className={`font-semibold ${isInCamera ? 'text-slate-200' : 'text-slate-900'}`}>{item.title}</h3>
                            <p className="text-xs text-slate-500">Presenter: {item.presenter} • {item.durationMinutes} min</p>
                        </div>
                    </div>
                    {expandedAgendaIds.has(item.id) ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronRight className="w-5 h-5 text-slate-400" />}
                </button>
                {expandedAgendaIds.has(item.id) && (
                    <div className={`p-4 border-t ${isInCamera ? 'border-slate-700 bg-slate-900/50' : 'border-slate-100 bg-slate-50'}`}>
                        {item.isComplianceCheck && (
                            <div className="mb-3 flex items-center space-x-2 text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1.5 rounded w-fit">
                                <AlertCircle className="w-4 h-4" />
                                <span>Statutory Compliance Item</span>
                            </div>
                        )}
                        <div className="space-y-2">
                            {item.documents.map((doc, i) => (
                                <div key={i} className="flex items-center text-sm text-slate-500">
                                    <FileText className="w-4 h-4 mr-2" />
                                    {doc}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        ))}
    </div>
  );

  const renderPack = () => (
    <div className="space-y-4 animate-in fade-in">
        <h2 className={`text-lg font-bold mb-4 ${isInCamera ? 'text-white' : 'text-slate-800'}`}>Board Pack</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {meeting.agenda.flatMap(a => a.documents).map((doc, i) => (
                <div key={i} className={`p-4 rounded-lg border ${isInCamera ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} flex justify-between items-center`}>
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-slate-100 rounded text-slate-600">
                            <FileText className="w-5 h-5" />
                        </div>
                        <span className={`text-sm font-medium ${isInCamera ? 'text-slate-200' : 'text-slate-700'}`}>{doc}</span>
                    </div>
                    <button className="text-brand-900 hover:text-brand-accent">
                        <Download className="w-4 h-4" />
                    </button>
                </div>
            ))}
        </div>
    </div>
  );

  const renderVote = () => {
    const counts = getVoteCounts();
    const totalPossible = getMaxPossibleVotes();

    return (
    <div className="animate-in fade-in">
        <h2 className={`text-lg font-bold mb-4 ${isInCamera ? 'text-white' : 'text-slate-800'}`}>Governance Voting</h2>
        
        {!activeVote ? (
            <div className={`text-center py-12 border-2 border-dashed rounded-lg ${isInCamera ? 'border-slate-700' : 'border-slate-300'}`}>
                <Gavel className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h3 className={`text-lg font-medium ${isInCamera ? 'text-slate-300' : 'text-slate-600'}`}>No Active Resolutions</h3>
                <p className="text-slate-500 text-sm mb-6">Waiting for the Chairperson to table a motion.</p>
                {(currentUser.role === UserRole.CHAIRPERSON || currentUser.role === UserRole.SECRETARY) && (
                    <button 
                        onClick={startVote}
                        className="bg-brand-900 text-white px-6 py-2 rounded-lg font-bold hover:bg-brand-800 transition-colors"
                    >
                        Table Resolution
                    </button>
                )}
            </div>
        ) : (
            <div className={`rounded-xl p-6 ${isInCamera ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <span className="text-xs font-bold text-brand-accent uppercase tracking-wider">Live Vote In Progress</span>
                        <h3 className={`text-xl font-bold mt-1 ${isInCamera ? 'text-white' : 'text-slate-900'}`}>{activeVote.question}</h3>
                        <p className="text-xs text-slate-400 mt-1">* Executive votes carry 2x weight.</p>
                    </div>
                    <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
                    </div>
                </div>

                {/* Results Bar */}
                <div className="mb-8">
                     <div className="flex h-4 rounded-full overflow-hidden bg-slate-100 mb-2">
                         <div style={{ width: `${(counts.for / totalPossible) * 100}%` }} className="bg-green-500 transition-all duration-500"></div>
                         <div style={{ width: `${(counts.against / totalPossible) * 100}%` }} className="bg-red-500 transition-all duration-500"></div>
                         <div style={{ width: `${(counts.abstain / totalPossible) * 100}%` }} className="bg-slate-400 transition-all duration-500"></div>
                     </div>
                     <div className="flex justify-between text-xs text-slate-500">
                         <span>For: {counts.for}</span>
                         <span>Against: {counts.against}</span>
                         <span>Abstain: {counts.abstain}</span>
                     </div>
                </div>

                {currentUser.role !== UserRole.SECRETARY ? (
                    <div className="grid grid-cols-3 gap-4">
                        <button 
                            onClick={() => castVote(VoteType.FOR)}
                            className={`py-4 rounded-lg border-2 font-bold transition-all ${activeVote.votes[currentUser.id] === VoteType.FOR ? 'border-green-500 bg-green-50 text-green-700' : 'border-slate-200 text-slate-600 hover:border-green-200'}`}
                        >
                            FOR
                        </button>
                        <button 
                            onClick={() => castVote(VoteType.AGAINST)}
                            className={`py-4 rounded-lg border-2 font-bold transition-all ${activeVote.votes[currentUser.id] === VoteType.AGAINST ? 'border-red-500 bg-red-50 text-red-700' : 'border-slate-200 text-slate-600 hover:border-red-200'}`}
                        >
                            AGAINST
                        </button>
                        <button 
                            onClick={() => castVote(VoteType.ABSTAIN)}
                            className={`py-4 rounded-lg border-2 font-bold transition-all ${activeVote.votes[currentUser.id] === VoteType.ABSTAIN ? 'border-slate-500 bg-slate-50 text-slate-700' : 'border-slate-200 text-slate-600 hover:border-slate-400'}`}
                        >
                            ABSTAIN
                        </button>
                    </div>
                ) : (
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-center">
                        <div className="flex justify-center mb-2">
                            <Shield className="w-8 h-8 text-slate-400" />
                        </div>
                        <h4 className="font-bold text-slate-700">Voting Restricted</h4>
                        <p className="text-sm text-slate-500 mt-1">
                            As Company Secretary, you do not have voting rights on board resolutions. Please record the weighted outcome.
                        </p>
                    </div>
                )}
            </div>
        )}
    </div>
  )};

  const renderVault = () => (
    <div className="animate-in fade-in h-full">
        <h2 className={`text-lg font-bold mb-4 ${isInCamera ? 'text-white' : 'text-slate-800'}`}>Secure Vault</h2>
        {!isInCamera ? (
             <div className="flex flex-col items-center justify-center h-64 text-center">
                 <Lock className="w-16 h-16 text-slate-300 mb-4" />
                 <h3 className="text-lg font-medium text-slate-600">Vault Locked</h3>
                 <p className="text-slate-400 max-w-sm">Secure transcripts and notes are only accessible when the meeting is in 'In-Camera' mode.</p>
             </div>
        ) : (
             <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 h-[400px] flex flex-col">
                 <div className="flex items-center space-x-2 text-red-400 mb-4 text-xs font-mono border-b border-slate-700 pb-2">
                     <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                     <span>ENCRYPTED_STREAM_ACTIVE // AES-256</span>
                 </div>
                 <div className="flex-1 font-mono text-sm text-green-400/80 overflow-y-auto space-y-2 p-2 bg-black/20 rounded">
                     <p>[14:02:12] CHAIR: Proceeding to sensitive item 4.1.</p>
                     <p>[14:02:45] CEO: The acquisition target has responded to the LOI.</p>
                     <p>[14:03:10] SYSTEM: Non-executive director access verified.</p>
                     <p className="animate-pulse">_</p>
                 </div>
             </div>
        )}
    </div>
  );

  // --- Main Render ---

  // 1. Section 75 Compliance Modal (Bypassed for Secretary)
  if (!hasDeclaredInterests && currentUser.role !== UserRole.SECRETARY) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/95 flex items-center justify-center p-4 backdrop-blur-sm">
        <div className="bg-white max-w-lg w-full rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
          <div className="bg-brand-900 p-6 text-white flex items-center space-x-4">
            <div className="bg-brand-accent/20 p-3 rounded-full">
              <Shield className="w-8 h-8 text-brand-accent" />
            </div>
            <div>
               <h2 className="text-xl font-bold">Compliance Check</h2>
               <p className="text-brand-accent text-sm font-medium">Companies Act 71 of 2008 • Section 75</p>
            </div>
          </div>
          <div className="p-8">
            <div className="flex items-start space-x-3 mb-6 bg-blue-50 p-4 rounded-lg border border-blue-100">
               <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
               <p className="text-sm text-blue-800 leading-relaxed">
                 Before accessing the board pack, you must declare any personal financial interests in today's agenda items. Failure to disclose is a criminal offence under the Act.
               </p>
            </div>

            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Declaration Notes (Optional)
            </label>
            <textarea 
              value={interestNote}
              onChange={(e) => setInterestNote(e.target.value)}
              className="w-full border border-slate-300 rounded-md p-3 text-sm focus:ring-2 focus:ring-brand-900 focus:border-transparent min-h-[100px]"
              placeholder="e.g., I hold shares in TechSol (Pty) Ltd (Item 4.1)"
            />
            
            <div className="mt-8 space-y-3">
              <button 
                onClick={handleConfirmDeclaration}
                className="w-full bg-brand-900 hover:bg-brand-800 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center shadow-lg"
              >
                <CheckCircle2 className="w-5 h-5 mr-2" />
                I Confirm My Declaration
              </button>
              <button 
                onClick={onLeave}
                className="w-full bg-transparent hover:bg-slate-100 text-slate-500 font-medium py-3 rounded-lg transition-colors"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
          <div className="bg-slate-50 p-4 text-center border-t border-slate-100">
             <p className="text-xs text-slate-400">Your declaration will be timestamped and cryptographically signed.</p>
          </div>
        </div>
      </div>
    );
  }

  // 2. CLOSED MEETING VIEW (POST-MEETING ADMIN)
  if (isMeetingClosed) {
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center p-6 md:p-10">
            <div className="max-w-4xl w-full space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                     <button onClick={onLeave} className="text-slate-500 hover:text-slate-800 font-medium flex items-center">
                        <ChevronLeft className="w-5 h-5 mr-1" /> Back to Dashboard
                     </button>
                     <div className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold uppercase flex items-center">
                        <StopCircle className="w-3 h-3 mr-2" /> Meeting Closed
                     </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
                    <div className="bg-brand-900 p-8 text-white">
                        <div className="flex justify-between items-start">
                             <div>
                                <h1 className="text-2xl font-bold mb-2">Post-Meeting Administration</h1>
                                <p className="text-slate-300 text-sm">Automated Minute Generation & Resolution Drafting</p>
                             </div>
                             <div className="p-3 bg-white/10 rounded-lg">
                                <FileSignature className="w-8 h-8 text-brand-accent" />
                             </div>
                        </div>
                    </div>

                    <div className="p-8">
                        {!generatedDocs ? (
                            <div className="text-center py-12">
                                <Sparkles className="w-12 h-12 text-brand-accent mx-auto mb-4" />
                                <h3 className="text-lg font-bold text-slate-800 mb-2">Ready to Draft Minutes?</h3>
                                <p className="text-slate-500 mb-6 max-w-md mx-auto">
                                    Our AI will analyze the transcript, voting records, and agenda to draft the formal minutes, summaries, and action items for the Minute Book.
                                </p>
                                <button 
                                    onClick={handleGenerateDocs}
                                    disabled={isGeneratingDocs}
                                    className="bg-brand-900 text-white px-8 py-3 rounded-lg font-bold shadow-md hover:bg-brand-800 transition-all flex items-center mx-auto"
                                >
                                    {isGeneratingDocs ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                                            Generating Documents...
                                        </>
                                    ) : (
                                        <>Generate Minutes & Resolutions</>
                                    )}
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                                {/* Resolutions Section */}
                                <div className="border-2 border-slate-200 rounded-lg p-8 bg-slate-50 font-serif">
                                    <div className="text-center border-b border-slate-300 pb-4 mb-6">
                                        <h2 className="text-xl font-bold text-slate-900 uppercase tracking-widest">Boardwise SA (Pty) Ltd</h2>
                                        <p className="text-xs text-slate-500 mt-1">Registration No: 2024/000000/07</p>
                                        <h3 className="text-lg font-semibold mt-4">WRITTEN RESOLUTIONS OF DIRECTORS</h3>
                                    </div>
                                    <div className="prose prose-slate max-w-none text-sm leading-relaxed text-slate-800">
                                        <p className="whitespace-pre-wrap">{generatedDocs.resolutions}</p>
                                    </div>
                                    <div className="mt-8 pt-8 border-t border-slate-300 flex justify-between items-end">
                                        <div>
                                            <div className="h-px w-48 bg-slate-400 mb-2"></div>
                                            <p className="text-xs uppercase text-slate-500">Chairperson Signature</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs italic text-slate-400">Generated via Secure Portal</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Executive Summary */}
                                    <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                                        <h4 className="font-bold text-slate-800 flex items-center mb-4">
                                            <FileText className="w-4 h-4 mr-2 text-brand-accent" />
                                            Executive Summary
                                        </h4>
                                        <p className="text-sm text-slate-600 leading-relaxed">
                                            {generatedDocs.summary}
                                        </p>
                                    </div>

                                    {/* Action Items */}
                                    <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                                        <h4 className="font-bold text-slate-800 flex items-center mb-4">
                                            <CheckCircle2 className="w-4 h-4 mr-2 text-green-600" />
                                            Action Items
                                        </h4>
                                        <div className="space-y-2 text-sm text-slate-600">
                                           {generatedDocs.actions.split('\n').map((action, i) => (
                                                <div key={i} className="flex items-start">
                                                    <div className="w-1.5 h-1.5 bg-brand-900 rounded-full mt-1.5 mr-2 flex-shrink-0"></div>
                                                    <span>{action.replace(/^- /, '')}</span>
                                                </div>
                                           ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end space-x-4 pt-4">
                                     <button 
                                        onClick={downloadResolutions}
                                        className="flex items-center space-x-2 px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
                                     >
                                        <Download className="w-4 h-4" />
                                        <span>Download Full Pack</span>
                                     </button>
                                     <button 
                                        onClick={onLeave}
                                        className="flex items-center space-x-2 px-6 py-2 bg-brand-900 text-white rounded-lg hover:bg-brand-800 shadow-md transition-colors"
                                     >
                                        <span>Return to Dashboard</span>
                                     </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
      );
  }

  // 3. MAIN MEETING INTERFACE (LIVE)
  return (
    <div className={`min-h-screen flex flex-col ${isInCamera ? 'bg-slate-900' : 'bg-slate-50'} transition-colors duration-500`}>
      {/* Top Bar */}
      <header className={`${isInCamera ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} border-b px-6 py-4 flex items-center justify-between shadow-sm transition-colors duration-500`}>
          <div className="flex items-center space-x-4">
              <div className={`p-2 rounded-lg ${isInCamera ? 'bg-red-900/30' : 'bg-brand-900'}`}>
                  {isInCamera ? <Shield className="w-6 h-6 text-red-500" /> : <Logo className="w-8 h-8" />}
              </div>
              <div>
                  <h1 className={`text-xl font-bold ${isInCamera ? 'text-white' : 'text-slate-900'}`}>{meeting.title}</h1>
                  <div className="flex items-center space-x-2 text-xs">
                      <span className={`px-2 py-0.5 rounded font-bold uppercase ${isInCamera ? 'bg-red-500/20 text-red-400' : 'bg-green-100 text-green-700'}`}>
                          {isInCamera ? 'IN CAMERA' : 'LIVE'}
                      </span>
                      
                      {/* Location Display/Edit */}
                      <div className="flex items-center h-6">
                        {isEditingLocation ? (
                            <div className="flex items-center bg-white rounded border border-slate-300 overflow-hidden shadow-sm ml-2">
                                <input 
                                    type="text" 
                                    value={tempLocation}
                                    onChange={(e) => setTempLocation(e.target.value)}
                                    className="px-2 py-0.5 text-xs text-slate-800 outline-none w-64" // Wider input
                                    placeholder="Location or Meeting URL"
                                    autoFocus
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            setLocation(tempLocation);
                                            setIsEditingLocation(false);
                                            onLog('LOCATION_UPDATE', `Meeting location changed to: ${tempLocation}`, currentUser);
                                        } else if (e.key === 'Escape') {
                                            setTempLocation(location);
                                            setIsEditingLocation(false);
                                        }
                                    }}
                                />
                                <button 
                                    onClick={() => { 
                                        setLocation(tempLocation); 
                                        setIsEditingLocation(false); 
                                        onLog('LOCATION_UPDATE', `Meeting location changed to: ${tempLocation}`, currentUser); 
                                    }} 
                                    className="p-1 hover:bg-green-50 text-green-600 border-l border-slate-100"
                                >
                                    <Check className="w-3 h-3" />
                                </button>
                                <button 
                                    onClick={() => { 
                                        setTempLocation(location); 
                                        setIsEditingLocation(false); 
                                    }} 
                                    className="p-1 hover:bg-red-50 text-red-600 border-l border-slate-100"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center group ml-1">
                                {isLink(location) ? (
                                    <a 
                                        href={location} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className={`flex items-center hover:underline ${isInCamera ? 'text-brand-accent' : 'text-blue-600'}`}
                                        title={location}
                                    >
                                        <Video className="w-3 h-3 mr-1" />
                                        <span className="truncate max-w-[200px]">Join Video Meeting</span>
                                        <ExternalLink className="w-3 h-3 ml-1" />
                                    </a>
                                ) : (
                                    <span className={`${isInCamera ? 'text-slate-400' : 'text-slate-500'} flex items-center`}>
                                        {location}
                                    </span>
                                )}
                                {(currentUser.role === UserRole.CHAIRPERSON || currentUser.role === UserRole.SECRETARY) && (
                                    <button 
                                        onClick={() => { setTempLocation(location); setIsEditingLocation(true); }}
                                        className={`ml-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-slate-200 ${isInCamera ? 'text-slate-500 hover:text-slate-900' : 'text-slate-400 hover:text-slate-700'}`}
                                        title="Edit Location"
                                    >
                                        <Edit className="w-3 h-3" />
                                    </button>
                                )}
                            </div>
                        )}
                      </div>
                  </div>
              </div>
          </div>

          <div className="flex items-center space-x-4">
               {/* In Camera Toggle */}
               <button 
                  onClick={toggleInCamera}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-full border transition-all ${
                      isInCamera 
                      ? 'bg-red-600 border-red-500 text-white shadow-[0_0_15px_rgba(220,38,38,0.5)]' 
                      : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
                  }`}
               >
                  {isInCamera ? <Lock className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
                  <span className="text-sm font-bold">{isInCamera ? 'SECURE SESSION ACTIVE' : 'Enter In-Camera'}</span>
               </button>

               <div className="h-8 w-px bg-slate-200 mx-2"></div>

               <button 
                  onClick={onLeave}
                  className={`text-sm font-medium ${isInCamera ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}
               >
                  Leave
               </button>
          </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar */}
          <nav className={`w-64 border-r flex flex-col ${isInCamera ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} transition-colors duration-500`}>
              <div className="p-4 space-y-2">
                  <NavBtn icon={FileText} label="Agenda" active={activeTab === 'agenda'} onClick={() => setActiveTab('agenda')} />
                  <NavBtn icon={Users} label="Board Pack" active={activeTab === 'pack'} onClick={() => setActiveTab('pack')} />
                  <NavBtn icon={Gavel} label="Voting" active={activeTab === 'vote'} onClick={() => setActiveTab('vote')} />
                  <NavBtn icon={Lock} label="Secure Vault" active={activeTab === 'vault'} onClick={() => setActiveTab('vault')} />
              </div>
              
              <div className="mt-auto p-4 border-t border-slate-200/10">
                  <div className={`rounded-lg p-4 ${isInCamera ? 'bg-slate-700/50' : 'bg-slate-50'} border border-transparent`}>
                      <div className="flex items-center justify-between mb-2">
                          <span className={`text-xs font-bold uppercase ${isInCamera ? 'text-slate-400' : 'text-slate-500'}`}>Governance Monitor</span>
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      </div>
                      <div className="text-xs text-slate-500 space-y-1">
                          <div className="flex justify-between">
                              <span>Quorum:</span>
                              <span className="font-bold text-green-600">Met (6/6)</span>
                          </div>
                          <div className="flex justify-between">
                              <span>Conflicts:</span>
                              <span className="font-bold text-green-600">Declared</span>
                          </div>
                      </div>
                  </div>
              </div>
          </nav>

          {/* Center Content */}
          <main className="flex-1 overflow-y-auto p-6 md:p-10 relative">
             {governanceAlert && (
                 <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-600 text-white px-6 py-3 rounded-full shadow-lg flex items-center space-x-3 z-50 animate-in slide-in-from-top-4 fade-in">
                     <AlertTriangle className="w-5 h-5" />
                     <span className="font-bold text-sm">{governanceAlert}</span>
                 </div>
             )}

             {/* Tab Content Rendering */}
             <div className="max-w-4xl mx-auto">
                 {activeTab === 'agenda' && renderAgenda()}
                 {activeTab === 'pack' && renderPack()}
                 {activeTab === 'vote' && renderVote()}
                 {activeTab === 'vault' && renderVault()}
             </div>
          </main>

          {/* Right Sidebar - Controls */}
          <aside className={`w-72 border-l p-6 ${isInCamera ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} hidden lg:block`}>
              {/* Meeting Control Actions */}
              <div className="space-y-6">
                 <div>
                    <h3 className={`text-sm font-bold uppercase tracking-wider mb-4 ${isInCamera ? 'text-slate-400' : 'text-slate-500'}`}>Meeting Controls</h3>
                    <div className="space-y-3">
                         {(currentUser.role === UserRole.SECRETARY || currentUser.role === UserRole.CHAIRPERSON) && (
                            <button 
                                onClick={handleCloseMeeting}
                                className="w-full flex items-center justify-center space-x-2 bg-red-100 text-red-700 py-3 rounded-lg font-bold hover:bg-red-200 transition-colors"
                            >
                                <StopCircle className="w-4 h-4" />
                                <span>Close Meeting</span>
                            </button>
                         )}
                         <button className="w-full flex items-center justify-center space-x-2 bg-slate-100 text-slate-700 py-3 rounded-lg font-medium hover:bg-slate-200 transition-colors">
                            <MicOff className="w-4 h-4" />
                            <span>Mute All</span>
                         </button>
                    </div>
                 </div>

                 <div className="pt-6 border-t border-slate-200/10">
                     <h3 className={`text-sm font-bold uppercase tracking-wider mb-4 ${isInCamera ? 'text-slate-400' : 'text-slate-500'}`}>Attendees</h3>
                     <div className="space-y-3">
                         {/* Mock Attendees List */}
                         {['Thabo M. (Chair)', 'Sarah V. (CEO)', 'Sipho N.', 'Priya P. (Sec)'].map((name, i) => (
                             <div key={i} className="flex items-center justify-between">
                                 <div className="flex items-center space-x-2">
                                     <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                                         {name.split(' ')[0][0]}{name.split(' ')[1][0]}
                                     </div>
                                     <span className={`text-sm font-medium ${isInCamera ? 'text-slate-300' : 'text-slate-700'}`}>{name}</span>
                                 </div>
                                 <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                             </div>
                         ))}
                     </div>
                 </div>
              </div>
          </aside>
      </div>
    </div>
  );
};

export default MeetingView;