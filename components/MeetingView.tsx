import React, { useState, useEffect } from 'react';
import { Meeting, AgendaItem, VoteType, User, UserRole, MeetingStatus } from '../types.ts';
import { Shield, Lock, Users, FileText, Gavel, AlertTriangle, CheckCircle2, ChevronRight, ChevronLeft, Download, Video, MicOff, AlertCircle, StopCircle, Sparkles, FileSignature, Printer, ChevronDown, Clock, User as UserIcon, MinusCircle, Eye, Check, X, Edit, ExternalLink } from 'lucide-react';
import { checkComplianceAI, generatePostMeetingDocs } from '../services/geminiService.ts';
import Logo from './Logo.tsx';

interface MeetingViewProps {
  meeting: Meeting;
  currentUser: User;
  users: User[];
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
  const [location, setLocation] = useState(meeting.location || 'Online');
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [tempLocation, setTempLocation] = useState(location);
  const [hasDeclaredInterests, setHasDeclaredInterests] = useState(false);
  const [interestNote, setInterestNote] = useState("");
  const [isMeetingClosed, setIsMeetingClosed] = useState(false);
  const [isGeneratingDocs, setIsGeneratingDocs] = useState(false);
  const [generatedDocs, setGeneratedDocs] = useState<{ summary: string; resolutions: string; actions: string } | null>(null);

  const isLink = (str: string) => str.startsWith('http://') || str.startsWith('https://');

  useEffect(() => {
    const startTime = Date.now();
    onLog('MEETING_ATTENDANCE', `Joined meeting: ${meeting.title}`, currentUser);

    return () => {
      const durationSeconds = Math.round((Date.now() - startTime) / 1000);
      onLog('MEETING_ATTENDANCE', `Left meeting: ${meeting.title}. Duration: ${Math.floor(durationSeconds/60)}m ${durationSeconds%60}s`, currentUser);
    };
  }, []);

  useEffect(() => {
    if (!hasDeclaredInterests || isMeetingClosed) return;
    const interval = setInterval(async () => {
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
        setTimeout(() => setGovernanceAlert(null), 10000);
      }
    }, 20000);
    return () => clearInterval(interval);
  }, [meeting.agenda, hasDeclaredInterests, isMeetingClosed]);

  const toggleInCamera = () => {
    if (!isInCamera) {
      if (confirm("WARNING: You are entering 'In-Camera' mode.")) {
        setIsInCamera(true);
        setActiveTab('vault');
      }
    } else {
      setIsInCamera(false);
      setActiveTab('agenda');
    }
  };

  const startVote = () => setActiveVote({ id: Date.now().toString(), question: "Resolution 1: Approve Q2 Financial Statements", votes: {} });
  const castVote = (type: VoteType) => activeVote && setActiveVote({ ...activeVote, votes: { ...activeVote.votes, [currentUser.id]: type } });
  
  const getVoteCounts = () => {
    if (!activeVote) return { for: 0, against: 0, abstain: 0 };
    let counts = { for: 0, against: 0, abstain: 0 };
    Object.entries(activeVote.votes).forEach(([userId, voteType]) => {
      const voter = users.find(u => u.id === userId);
      const weight = voter?.role === UserRole.EXECUTIVE ? 2 : 1;
      if (voteType === VoteType.FOR) counts.for += weight;
      else if (voteType === VoteType.AGAINST) counts.against += weight;
      else if (voteType === VoteType.ABSTAIN) counts.abstain += weight;
    });
    return counts;
  };

  const getMaxPossibleVotes = () => users.reduce((acc, u) => u.role === UserRole.SECRETARY ? acc : acc + (u.role === UserRole.EXECUTIVE ? 2 : 1), 0);

  const handleConfirmDeclaration = () => {
    onLog('COMPLIANCE_DECLARATION', `Section 75 Declaration confirmed. Notes: ${interestNote || 'None'}`, currentUser);
    setHasDeclaredInterests(true);
  };

  const handleCloseMeeting = () => {
    if (confirm("Are you sure you want to close this meeting?")) {
        setIsMeetingClosed(true);
        onLog('MEETING_CLOSED', `Meeting formally closed`, currentUser);
    }
  };

  const handleGenerateDocs = async () => {
      setIsGeneratingDocs(true);
      const counts = getVoteCounts();
      const docs = await generatePostMeetingDocs(meeting.title, meeting.agenda, activeVote ? `Vote result: ${counts.for} For` : "No votes");
      setGeneratedDocs(docs);
      setIsGeneratingDocs(false);
  };

  const downloadResolutions = () => {
    if (!generatedDocs) return;
    const content = `MEETING: ${meeting.title}\nSUMMARY: ${generatedDocs.summary}\nRESOLUTIONS: ${generatedDocs.resolutions}\nACTIONS: ${generatedDocs.actions}`;
    const element = document.createElement("a");
    element.href = URL.createObjectURL(new Blob([content], {type: 'text/plain'}));
    element.download = `Minutes_${meeting.title.replace(/\s+/g, '_')}.txt`;
    element.click();
  };

  const toggleAgendaItem = (id: string) => {
    const newSet = new Set(expandedAgendaIds);
    if (newSet.has(id)) newSet.delete(id); else newSet.add(id);
    setExpandedAgendaIds(newSet);
  };

  const renderAgenda = () => (
    <div className="space-y-4 animate-in fade-in">
        <h2 className={`text-lg font-bold mb-4 ${isInCamera ? 'text-white' : 'text-slate-800'}`}>Meeting Agenda</h2>
        {meeting.agenda.map((item, index) => (
            <div key={item.id} className={`${isInCamera ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} border rounded-lg overflow-hidden`}>
                <button onClick={() => toggleAgendaItem(item.id)} className={`w-full flex items-center justify-between p-4 ${isInCamera ? 'hover:bg-slate-700' : 'hover:bg-slate-50'} transition-colors`}>
                    <div className="flex items-center space-x-4">
                        <span className="text-slate-400 font-mono text-sm">{index + 1}.</span>
                        <div className="text-left">
                            <h3 className={`font-semibold ${isInCamera ? 'text-slate-200' : 'text-slate-900'}`}>{item.title}</h3>
                            <p className="text-xs text-slate-500">{item.presenter} • {item.durationMinutes} min</p>
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
                        <FileText className="w-5 h-5 text-slate-600" />
                        <span className={`text-sm font-medium ${isInCamera ? 'text-slate-200' : 'text-slate-700'}`}>{doc}</span>
                    </div>
                    <Download className="w-4 h-4 text-brand-900 cursor-pointer" />
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
                <button onClick={startVote} className="bg-brand-900 text-white px-6 py-2 rounded-lg font-bold">Table Resolution</button>
            </div>
        ) : (
            <div className={`rounded-xl p-6 ${isInCamera ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
                <h3 className={`text-xl font-bold ${isInCamera ? 'text-white' : 'text-slate-900'}`}>{activeVote.question}</h3>
                <div className="grid grid-cols-3 gap-4 mt-8">
                    <button onClick={() => castVote(VoteType.FOR)} className={`py-4 rounded-lg border-2 font-bold ${activeVote.votes[currentUser.id] === VoteType.FOR ? 'border-green-500 bg-green-50' : 'border-slate-200'}`}>FOR</button>
                    <button onClick={() => castVote(VoteType.AGAINST)} className={`py-4 rounded-lg border-2 font-bold ${activeVote.votes[currentUser.id] === VoteType.AGAINST ? 'border-red-500 bg-red-50' : 'border-slate-200'}`}>AGAINST</button>
                    <button onClick={() => castVote(VoteType.ABSTAIN)} className={`py-4 rounded-lg border-2 font-bold ${activeVote.votes[currentUser.id] === VoteType.ABSTAIN ? 'border-slate-500 bg-slate-50' : 'border-slate-200'}`}>ABSTAIN</button>
                </div>
            </div>
        )}
    </div>
  )};

  const renderVault = () => (
    <div className="animate-in fade-in h-full">
        <h2 className={`text-lg font-bold mb-4 ${isInCamera ? 'text-white' : 'text-slate-800'}`}>Secure Vault</h2>
        {!isInCamera ? <div className="h-64 flex flex-col items-center justify-center text-slate-400"><Lock className="w-16 h-16 mb-4" />Vault Locked</div> : <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 h-64 font-mono text-green-400 text-sm overflow-y-auto">[ENCRYPTED SESSION ACTIVE]</div>}
    </div>
  );

  if (!hasDeclaredInterests && currentUser.role !== UserRole.SECRETARY) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/95 flex items-center justify-center p-4">
        <div className="bg-white max-w-lg w-full rounded-xl p-8">
          <h2 className="text-xl font-bold mb-4">Section 75 Declaration</h2>
          <textarea value={interestNote} onChange={(e) => setInterestNote(e.target.value)} className="w-full border p-3 rounded h-32 mb-6" placeholder="Declare any financial interests..."/>
          <button onClick={handleConfirmDeclaration} className="w-full bg-brand-900 text-white font-bold py-3 rounded">I Confirm My Declaration</button>
        </div>
      </div>
    );
  }

  if (isMeetingClosed) {
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center p-10">
            <div className="max-w-4xl w-full bg-white rounded-xl shadow-lg p-8">
                <button onClick={handleGenerateDocs} className="bg-brand-900 text-white px-8 py-3 rounded-lg font-bold mb-8">Generate Minutes & Resolutions</button>
                {generatedDocs && (
                    <div className="font-serif border p-8 bg-slate-50">
                        <pre className="whitespace-pre-wrap">{generatedDocs.resolutions}</pre>
                        <button onClick={downloadResolutions} className="mt-8 bg-brand-900 text-white px-4 py-2 rounded">Download Minutes</button>
                    </div>
                )}
            </div>
        </div>
      );
  }

  return (
    <div className={`min-h-screen flex flex-col ${isInCamera ? 'bg-slate-900' : 'bg-slate-50'}`}>
      <header className={`${isInCamera ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} border-b px-6 py-4 flex items-center justify-between`}>
          <div className="flex items-center space-x-4">
              <Logo className="w-8 h-8" />
              <h1 className={`text-xl font-bold ${isInCamera ? 'text-white' : 'text-slate-900'}`}>{meeting.title}</h1>
          </div>
          <button onClick={toggleInCamera} className={`px-4 py-2 rounded-full border ${isInCamera ? 'bg-red-600 text-white' : 'bg-white text-slate-600'}`}>{isInCamera ? 'IN CAMERA' : 'Enter In-Camera'}</button>
          <button onClick={onLeave} className="text-slate-600">Leave</button>
      </header>
      <div className="flex-1 flex">
          <nav className={`w-64 border-r ${isInCamera ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
              <NavBtn icon={FileText} label="Agenda" active={activeTab === 'agenda'} onClick={() => setActiveTab('agenda')} />
              <NavBtn icon={Users} label="Board Pack" active={activeTab === 'pack'} onClick={() => setActiveTab('pack')} />
              <NavBtn icon={Gavel} label="Voting" active={activeTab === 'vote'} onClick={() => setActiveTab('vote')} />
              <NavBtn icon={Lock} label="Secure Vault" active={activeTab === 'vault'} onClick={() => setActiveTab('vault')} />
          </nav>
          <main className="flex-1 p-10">
              {activeTab === 'agenda' && renderAgenda()}
              {activeTab === 'pack' && renderPack()}
              {activeTab === 'vote' && renderVote()}
              {activeTab === 'vault' && renderVault()}
          </main>
      </div>
    </div>
  );
};

export default MeetingView;