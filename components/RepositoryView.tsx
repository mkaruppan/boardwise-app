import React, { useState, useRef } from 'react';
import { User, UserRole, RepositoryDoc, DocType } from '../types';
import { FolderOpen, FileText, Download, Upload, ChevronLeft, Search, Filter, ShieldCheck, Briefcase, Trash2, CheckCircle2, X } from 'lucide-react';

interface RepositoryViewProps {
  documents: RepositoryDoc[];
  user: User;
  onBack: () => void;
  onUpload: (doc: RepositoryDoc) => void;
  onDeleteRequest?: (doc: RepositoryDoc) => void;
  onDeleteApprove?: (doc: RepositoryDoc) => void;
}

const RepositoryView: React.FC<RepositoryViewProps> = ({ documents, user, onBack, onUpload, onDeleteRequest, onDeleteApprove }) => {
  const [activeTab, setActiveTab] = useState<DocType | 'ALL'>('ALL');
  const [showUpload, setShowUpload] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    type: 'PACK' as DocType,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isSecretary = user.role === UserRole.SECRETARY;

  const filteredDocs = documents.filter(doc => activeTab === 'ALL' || doc.type === activeTab);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      // Auto-fill title if empty
      if (!uploadForm.title) {
        setUploadForm(prev => ({ ...prev, title: file.name.split('.')[0] }));
      }
    }
  };

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
        alert("Please select a document to upload.");
        return;
    }

    const fileSizeMB = (selectedFile.size / (1024 * 1024)).toFixed(1);

    onUpload({
      id: `d_${Date.now()}`,
      title: uploadForm.title,
      type: uploadForm.type,
      date: new Date().toISOString(),
      size: `${fileSizeMB} MB`,
      uploadedBy: user.name
    });
    
    // Reset Form
    setShowUpload(false);
    setUploadForm({ title: '', type: 'PACK' });
    setSelectedFile(null);
  };

  const closeUploadModal = () => {
      setShowUpload(false);
      setUploadForm({ title: '', type: 'PACK' });
      setSelectedFile(null);
  };

  const getIconForType = (type: DocType) => {
    switch(type) {
      case 'MINUTES': return <FileText className="w-5 h-5 text-blue-500" />;
      case 'PACK': return <Briefcase className="w-5 h-5 text-brand-gold" />;
      case 'POLICY': return <ShieldCheck className="w-5 h-5 text-green-600" />;
      default: return <FileText className="w-5 h-5 text-slate-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <button onClick={onBack} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
              <ChevronLeft className="w-5 h-5 text-slate-600" />
            </button>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <FolderOpen className="w-6 h-6 text-brand-gold" />
              Document Repository
            </h1>
          </div>
          
          {isSecretary && (
            <button 
              onClick={() => setShowUpload(true)}
              className="flex items-center space-x-2 bg-brand-900 text-white px-4 py-2 rounded-lg hover:bg-brand-800 transition-colors shadow-md"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Document</span>
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex space-x-1 bg-white p-1 rounded-lg border border-slate-200 w-fit">
            {['ALL', 'PACK', 'MINUTES', 'POLICY', 'FINANCIALS'].map((tab) => (
                <button
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                        activeTab === tab 
                        ? 'bg-slate-100 text-slate-900 shadow-sm' 
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                    {tab === 'ALL' ? 'All Documents' : tab.charAt(0) + tab.slice(1).toLowerCase().replace('_', ' ')}
                </button>
            ))}
        </div>

        {/* Document List */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4 font-semibold text-slate-700 uppercase text-xs tracking-wider">Document Name</th>
                            <th className="px-6 py-4 font-semibold text-slate-700 uppercase text-xs tracking-wider">Type</th>
                            <th className="px-6 py-4 font-semibold text-slate-700 uppercase text-xs tracking-wider">Date Added</th>
                            <th className="px-6 py-4 font-semibold text-slate-700 uppercase text-xs tracking-wider">Uploaded By</th>
                            <th className="px-6 py-4 font-semibold text-slate-700 uppercase text-xs tracking-wider text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredDocs.map(doc => {
                            const isPendingDeletion = !!doc.pendingDeletion;
                            const hasMyApproval = isPendingDeletion && doc.pendingDeletion?.approvals.includes(user.id);
                            const iRequested = isPendingDeletion && doc.pendingDeletion?.requestedBy === user.id;

                            return (
                            <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center space-x-3">
                                        <div className="p-2 bg-slate-100 rounded">
                                            {getIconForType(doc.type)}
                                        </div>
                                        <div>
                                            <span className="font-medium text-slate-800">{doc.title}</span>
                                            {isPendingDeletion && (
                                                <div className="flex items-center mt-1">
                                                    <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold uppercase">
                                                        Deletion Pending ({doc.pendingDeletion?.approvals.length}/1 Approved)
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="px-2 py-1 rounded text-xs font-bold bg-slate-100 text-slate-600">
                                        {doc.type}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-slate-500">
                                    {new Date(doc.date).toLocaleDateString('en-ZA')}
                                </td>
                                <td className="px-6 py-4 text-slate-500">
                                    {doc.uploadedBy}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end space-x-2">
                                        <button className="text-brand-900 hover:text-brand-gold transition-colors p-2 hover:bg-slate-100 rounded-full" title="Download">
                                            <Download className="w-4 h-4" />
                                        </button>

                                        {/* Deletion Workflow */}
                                        {isSecretary && !isPendingDeletion && (
                                            <button 
                                                onClick={() => onDeleteRequest && onDeleteRequest(doc)}
                                                className="text-slate-400 hover:text-red-600 transition-colors p-2 hover:bg-red-50 rounded-full" 
                                                title="Request Deletion"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}

                                        {isPendingDeletion && !iRequested && !hasMyApproval && (
                                            <button 
                                                onClick={() => onDeleteApprove && onDeleteApprove(doc)}
                                                className="flex items-center space-x-1 bg-red-600 hover:bg-red-700 text-white text-xs px-2 py-1.5 rounded shadow-sm transition-colors" 
                                                title="Approve Deletion"
                                            >
                                                <CheckCircle2 className="w-3 h-3" />
                                                <span>Approve</span>
                                            </button>
                                        )}

                                         {isPendingDeletion && hasMyApproval && (
                                            <span className="text-xs text-green-600 font-bold px-2">Approved</span>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        )})}
                    </tbody>
                </table>
            </div>
        </div>

        {/* Upload Modal */}
        {showUpload && (
            <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in">
                    <div className="bg-brand-900 p-4 text-white flex justify-between items-center">
                        <h3 className="font-bold">Upload to Repository</h3>
                        <button onClick={closeUploadModal} className="text-white/60 hover:text-white">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <form onSubmit={handleUpload} className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Document Title</label>
                            <input 
                                required
                                type="text"
                                value={uploadForm.title}
                                onChange={e => setUploadForm({...uploadForm, title: e.target.value})}
                                className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-brand-900"
                                placeholder="e.g. Q3 Board Pack Final"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Document Category</label>
                            <select 
                                value={uploadForm.type}
                                onChange={e => setUploadForm({...uploadForm, type: e.target.value as DocType})}
                                className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-brand-900"
                            >
                                <option value="PACK">Board Pack</option>
                                <option value="MINUTES">Minutes</option>
                                <option value="POLICY">Governance Policy</option>
                                <option value="FINANCIALS">Financial Statements</option>
                            </select>
                        </div>
                        
                        <div 
                            onClick={() => fileInputRef.current?.click()}
                            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${selectedFile ? 'border-green-400 bg-green-50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'}`}
                        >
                            <Upload className={`w-8 h-8 mx-auto mb-2 ${selectedFile ? 'text-green-500' : 'text-slate-400'}`} />
                            <p className="text-sm text-slate-600 font-medium">{selectedFile ? selectedFile.name : 'Click to select file'}</p>
                            <p className="text-xs text-slate-400">{selectedFile ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB` : 'PDF, XLSX, DOCX (Max 50MB)'}</p>
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                className="hidden" 
                                onChange={handleFileSelect}
                            />
                        </div>

                        <div className="pt-4 flex justify-end space-x-2">
                            <button type="button" onClick={closeUploadModal} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded">Cancel</button>
                            <button 
                                type="submit" 
                                disabled={!selectedFile}
                                className="px-4 py-2 bg-brand-900 text-white rounded font-medium hover:bg-brand-800 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Secure Upload
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default RepositoryView;