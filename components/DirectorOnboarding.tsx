import React, { useState, useRef } from 'react';
import { UserRole, User } from '../types';
import { Shield, Upload, Check, ChevronLeft, FileCheck, Info, Save, Paperclip, FileText, Camera, User as UserIcon, X } from 'lucide-react';

interface DirectorOnboardingProps {
  onBack: () => void;
  onSubmit: (data: any) => void;
  initialData?: User | null;
}

const DirectorOnboarding: React.FC<DirectorOnboardingProps> = ({ onBack, onSubmit, initialData }) => {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    email: initialData?.email || '',
    role: initialData?.role || UserRole.NON_EXECUTIVE,
  });

  const [profilePhoto, setProfilePhoto] = useState<string | null>(initialData?.avatar || null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [files, setFiles] = useState({
    id: initialData?.documents?.certifiedId || false,
    residence: initialData?.documents?.proofOfResidence || false,
    cv: initialData?.documents?.cv || false
  });

  const [fileNames, setFileNames] = useState({
    id: '',
    residence: '',
    cv: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const idInputRef = useRef<HTMLInputElement>(null);
  const resInputRef = useRef<HTMLInputElement>(null);
  const cvInputRef = useRef<HTMLInputElement>(null);

  const ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'];
  const ACCEPT_STRING = ".pdf,.doc,.docx,.jpg,.jpeg,.png";

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
          alert("Image too large. Please select a file smaller than 5MB.");
          return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: keyof typeof files) => {
    const file = e.target.files?.[0];
    if (file) {
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext && ALLOWED_EXTENSIONS.includes(ext)) {
        setFiles(prev => ({ ...prev, [type]: true }));
        setFileNames(prev => ({ ...prev, [type]: file.name }));
      } else {
        alert("Invalid file type. Allowed formats: PDF, DOC, DOCX, JPG, PNG.");
      }
    }
  };

  const triggerUpload = (ref: React.RefObject<HTMLInputElement | null>) => {
    ref.current?.click();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!files.id || !files.residence || !files.cv) {
      alert("Please upload all mandatory FICA documents.");
      return;
    }
    
    setIsSubmitting(true);
    setTimeout(() => {
      onSubmit({
        ...formData,
        avatar: profilePhoto,
        documents: { 
          certifiedId: files.id, 
          proofOfResidence: files.residence, 
          cv: files.cv 
        }
      });
    }, 1500);
  };

  const isEditing = !!initialData;

  const getFileLabel = (type: keyof typeof files, defaultText: string) => {
    if (fileNames[type]) return fileNames[type];
    if (files[type] && isEditing) return "✓ Existing document on file";
    return defaultText;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
        
        {/* Header */}
        <div className="bg-brand-900 p-6 flex items-center justify-between">
            <div className="flex items-center space-x-3">
                <button onClick={onBack} className="text-white/70 hover:text-white transition-colors">
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <div>
                    <h1 className="text-xl font-bold text-white">{isEditing ? 'Edit Profile' : 'Director Onboarding'}</h1>
                    <p className="text-brand-gold text-xs font-medium tracking-wide">FICA & KING IV COMPLIANCE</p>
                </div>
            </div>
            <Shield className="w-8 h-8 text-white/20" />
        </div>

        <div className="p-8">
            {/* Profile Photo Upload */}
            <div className="flex flex-col items-center mb-8">
                <div className="relative group">
                    <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-slate-100 bg-slate-200 flex items-center justify-center">
                        {profilePhoto ? (
                            <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <UserIcon className="w-12 h-12 text-slate-400" />
                        )}
                    </div>
                    <button 
                        type="button"
                        onClick={() => photoInputRef.current?.click()}
                        className="absolute bottom-0 right-0 p-2 bg-brand-900 text-white rounded-full hover:bg-brand-800 transition-colors shadow-lg border-2 border-white"
                        title="Upload Photo"
                    >
                        <Camera className="w-4 h-4" />
                    </button>
                    {profilePhoto && (
                        <button 
                            type="button"
                            onClick={() => { setProfilePhoto(null); if(photoInputRef.current) photoInputRef.current.value = ''; }}
                            className="absolute top-0 right-0 p-1 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors shadow-sm -mr-2 -mt-2"
                            title="Remove Photo"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    )}
                </div>
                <input 
                    type="file" 
                    ref={photoInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handlePhotoChange} 
                />
                <p className="text-xs text-slate-400 mt-2">Upload Profile Photo (Optional)</p>
            </div>

            <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-lg flex items-start space-x-3">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-800">
                    <strong>Board Approval Protocol:</strong> Per the Memorandum of Incorporation, your profile will remain in a <em>Pending</em> state until approved by at least 2 existing board members.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Personal Details */}
                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b pb-2">Director Profile</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Full Legal Name</label>
                            <input 
                                required
                                type="text" 
                                value={formData.name}
                                onChange={e => setFormData({...formData, name: e.target.value})}
                                className="w-full border border-slate-300 rounded-md p-2.5 text-sm focus:ring-2 focus:ring-brand-900 focus:border-transparent"
                                placeholder="e.g. James Mwangi"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Official Email</label>
                            <input 
                                required
                                type="email" 
                                value={formData.email}
                                onChange={e => setFormData({...formData, email: e.target.value})}
                                className="w-full border border-slate-300 rounded-md p-2.5 text-sm focus:ring-2 focus:ring-brand-900 focus:border-transparent"
                                placeholder="james@boardwise.co.za"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Proposed Role</label>
                        <select 
                            value={formData.role}
                            onChange={e => setFormData({...formData, role: e.target.value as UserRole})}
                            className="w-full border border-slate-300 rounded-md p-2.5 text-sm focus:ring-2 focus:ring-brand-900 focus:border-transparent"
                        >
                            <option value={UserRole.NON_EXECUTIVE}>Non-Executive Director</option>
                            <option value={UserRole.EXECUTIVE}>Executive Director</option>
                            <option value={UserRole.CHAIRPERSON}>Chairperson</option>
                            <option value={UserRole.SECRETARY}>Company Secretary</option>
                        </select>
                    </div>
                </div>

                {/* Document Uploads */}
                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b pb-2">Compliance Documents (Certified)</h3>
                    <p className="text-xs text-slate-500 mb-2">Allowed formats: .pdf, .docx, .doc, .jpg, .png</p>
                    
                    <div className="grid grid-cols-1 gap-3">
                        {/* ID Upload */}
                        <div className={`border-2 border-dashed rounded-lg p-4 flex items-center justify-between transition-colors ${files.id ? 'bg-green-50 border-green-200' : 'hover:bg-slate-50 border-slate-300'}`}>
                            <div className="flex items-center space-x-3">
                                <div className={`p-2 rounded-full ${files.id ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-500'}`}>
                                    {files.id ? <Check className="w-5 h-5" /> : <FileCheck className="w-5 h-5" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-slate-800">Certified ID / Passport</p>
                                    <p className="text-xs text-slate-500 truncate">{getFileLabel('id', 'Must be certified within last 3 months')}</p>
                                </div>
                            </div>
                            <input type="file" ref={idInputRef} className="hidden" accept={ACCEPT_STRING} onChange={(e) => handleFileChange(e, 'id')} />
                            <button 
                                type="button"
                                onClick={() => triggerUpload(idInputRef)}
                                className={`text-xs font-bold px-3 py-1.5 rounded transition-colors ${files.id ? 'bg-white text-green-700 border border-green-200 shadow-sm' : 'bg-slate-800 text-white hover:bg-slate-700'}`}
                            >
                                {files.id && !fileNames.id && isEditing ? 'Replace' : files.id ? 'Change' : 'Select File'}
                            </button>
                        </div>

                        {/* Residence Upload */}
                        <div className={`border-2 border-dashed rounded-lg p-4 flex items-center justify-between transition-colors ${files.residence ? 'bg-green-50 border-green-200' : 'hover:bg-slate-50 border-slate-300'}`}>
                            <div className="flex items-center space-x-3">
                                <div className={`p-2 rounded-full ${files.residence ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-500'}`}>
                                    {files.residence ? <Check className="w-5 h-5" /> : <FileCheck className="w-5 h-5" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-slate-800">Proof of Residence</p>
                                    <p className="text-xs text-slate-500 truncate">{getFileLabel('residence', 'Utility bill not older than 3 months')}</p>
                                </div>
                            </div>
                            <input type="file" ref={resInputRef} className="hidden" accept={ACCEPT_STRING} onChange={(e) => handleFileChange(e, 'residence')} />
                            <button 
                                type="button"
                                onClick={() => triggerUpload(resInputRef)}
                                className={`text-xs font-bold px-3 py-1.5 rounded transition-colors ${files.residence ? 'bg-white text-green-700 border border-green-200 shadow-sm' : 'bg-slate-800 text-white hover:bg-slate-700'}`}
                            >
                                {files.residence && !fileNames.residence && isEditing ? 'Replace' : files.residence ? 'Change' : 'Select File'}
                            </button>
                        </div>

                        {/* CV Upload */}
                        <div className={`border-2 border-dashed rounded-lg p-4 flex items-center justify-between transition-colors ${files.cv ? 'bg-green-50 border-green-200' : 'hover:bg-slate-50 border-slate-300'}`}>
                            <div className="flex items-center space-x-3">
                                <div className={`p-2 rounded-full ${files.cv ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-500'}`}>
                                    {files.cv ? <Check className="w-5 h-5" /> : <FileCheck className="w-5 h-5" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-slate-800">Curriculum Vitae</p>
                                    <p className="text-xs text-slate-500 truncate">{getFileLabel('cv', 'Detailed governance experience')}</p>
                                </div>
                            </div>
                            <input type="file" ref={cvInputRef} className="hidden" accept={ACCEPT_STRING} onChange={(e) => handleFileChange(e, 'cv')} />
                            <button 
                                type="button"
                                onClick={() => triggerUpload(cvInputRef)}
                                className={`text-xs font-bold px-3 py-1.5 rounded transition-colors ${files.cv ? 'bg-white text-green-700 border border-green-200 shadow-sm' : 'bg-slate-800 text-white hover:bg-slate-700'}`}
                            >
                                {files.cv && !fileNames.cv && isEditing ? 'Replace' : files.cv ? 'Change' : 'Select File'}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="pt-4">
                    <button 
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-brand-900 hover:bg-brand-800 text-white font-bold py-4 rounded-lg shadow-lg flex items-center justify-center transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? (
                            <span>Submitting Protocol...</span>
                        ) : (
                            <>
                                {isEditing ? <Save className="w-5 h-5 mr-2" /> : <Upload className="w-5 h-5 mr-2" />}
                                <span>{isEditing ? 'Update Application' : 'Submit for Board Approval'}</span>
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
      </div>
    </div>
  );
};

export default DirectorOnboarding;