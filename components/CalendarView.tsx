import React, { useState } from 'react';
import { Meeting, User, UserRole, MeetingStatus } from '../types';
import { Calendar, Clock, MapPin, Plus, ChevronLeft, Mail, CheckCircle, Video, Edit } from 'lucide-react';

interface CalendarViewProps {
  meetings: Meeting[];
  user: User;
  onBack: () => void;
  onSchedule: (meeting: Partial<Meeting>) => void;
  onJoin: (meeting: Meeting) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ meetings, user, onBack, onSchedule, onJoin }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    time: '',
    location: '',
  });

  const isSecretary = user.role === UserRole.SECRETARY;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dateTime = new Date(`${formData.date}T${formData.time}`).toISOString();
    
    onSchedule({
      id: editingId || undefined,
      title: formData.title,
      date: dateTime,
      location: formData.location,
      status: MeetingStatus.SCHEDULED,
      agenda: [] // Init with empty agenda for new meetings
    });
    
    setShowModal(false);
    setEditingId(null);
    setFormData({ title: '', date: '', time: '', location: '' });
  };

  const handleEdit = (meeting: Meeting) => {
      const dateObj = new Date(meeting.date);
      setEditingId(meeting.id);
      setFormData({
          title: meeting.title,
          date: dateObj.toISOString().split('T')[0],
          time: dateObj.toTimeString().slice(0, 5),
          location: meeting.location
      });
      setShowModal(true);
  };

  const handleOpenNew = () => {
      setEditingId(null);
      setFormData({ title: '', date: '', time: '', location: '' });
      setShowModal(true);
  };

  const upcomingMeetings = meetings
    .filter(m => new Date(m.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const pastMeetings = meetings
    .filter(m => new Date(m.date) < new Date())
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

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
              <Calendar className="w-6 h-6 text-brand-gold" />
              Board Calendar
            </h1>
          </div>
          
          {isSecretary && (
            <button 
              onClick={handleOpenNew}
              className="flex items-center space-x-2 bg-brand-900 text-white px-4 py-2 rounded-lg hover:bg-brand-800 transition-colors shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule Meeting</span>
            </button>
          )}
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Main List */}
            <div className="md:col-span-2 space-y-4">
                <h2 className="text-lg font-bold text-slate-700 uppercase tracking-wide">Upcoming Events</h2>
                {upcomingMeetings.length === 0 ? (
                    <div className="bg-white p-8 rounded-lg shadow-sm border border-slate-200 text-center text-slate-500 italic">
                        No upcoming meetings scheduled.
                    </div>
                ) : (
                    upcomingMeetings.map(meeting => (
                        <div key={meeting.id} className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center hover:shadow-md transition-shadow group relative">
                            <div>
                                <div className="flex items-center space-x-3 mb-1">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                        meeting.status === MeetingStatus.LIVE ? 'bg-green-100 text-green-700 animate-pulse' : 'bg-blue-50 text-blue-700'
                                    }`}>
                                        {meeting.status}
                                    </span>
                                    <span className="text-sm text-slate-500 flex items-center">
                                        <Clock className="w-3 h-3 mr-1" />
                                        {new Date(meeting.date).toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <h3 className="text-xl font-bold text-slate-800">{meeting.title}</h3>
                                <p className="text-sm text-slate-500 mt-1 flex items-center">
                                    <MapPin className="w-3 h-3 mr-1" />
                                    {meeting.location}
                                </p>
                            </div>
                            <div className="mt-4 md:mt-0 flex flex-col items-end gap-2">
                                {meeting.status === MeetingStatus.LIVE ? (
                                    <button 
                                        onClick={() => onJoin(meeting)}
                                        className="flex items-center space-x-2 bg-green-600 text-white px-6 py-2 rounded-md font-bold hover:bg-green-700 transition-colors shadow-sm"
                                    >
                                        <Video className="w-4 h-4" />
                                        <span>Join Live</span>
                                    </button>
                                ) : (
                                    <div className="flex items-center space-x-2">
                                        {isSecretary && (
                                            <button 
                                                onClick={() => handleEdit(meeting)}
                                                className="flex items-center text-sm text-slate-500 hover:text-brand-900 bg-slate-50 px-3 py-1 rounded border border-slate-100 hover:border-brand-200 transition-colors"
                                            >
                                                <Edit className="w-3 h-3 mr-2" />
                                                Edit
                                            </button>
                                        )}
                                        <div className="flex items-center text-sm text-slate-400 bg-slate-50 px-3 py-1 rounded border border-slate-100 cursor-default">
                                            <Mail className="w-3 h-3 mr-2" />
                                            <span>Invites Sent</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}

                {pastMeetings.length > 0 && (
                    <div className="pt-8">
                        <h2 className="text-lg font-bold text-slate-400 uppercase tracking-wide mb-4">Past Meetings</h2>
                        <div className="space-y-3 opacity-70">
                            {pastMeetings.map(meeting => (
                                <div key={meeting.id} className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex justify-between items-center">
                                    <div>
                                        <h4 className="font-semibold text-slate-700">{meeting.title}</h4>
                                        <p className="text-xs text-slate-500">{new Date(meeting.date).toLocaleDateString('en-ZA')}</p>
                                    </div>
                                    <span className="text-xs font-bold bg-slate-200 text-slate-600 px-2 py-1 rounded">CLOSED</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Sidebar Info */}
            <div className="space-y-6">
                <div className="bg-gradient-to-br from-brand-900 to-brand-800 text-white p-6 rounded-xl shadow-lg">
                    <h3 className="font-bold text-lg mb-2">Automated Notifications</h3>
                    <p className="text-sm text-slate-300 leading-relaxed mb-4">
                        Scheduling a meeting automatically triggers:
                    </p>
                    <ul className="space-y-2 text-sm">
                        <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-brand-gold" /> Calendar Invites (.ics)</li>
                        <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-brand-gold" /> Secure Pack Links</li>
                        <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-brand-gold" /> WhatsApp Reminders</li>
                    </ul>
                </div>
            </div>
        </div>

        {/* Modal */}
        {showModal && (
            <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in">
                    <div className="bg-brand-900 p-4 text-white flex justify-between items-center">
                        <h3 className="font-bold">{editingId ? 'Edit Meeting Details' : 'Schedule Board Meeting'}</h3>
                        <button onClick={() => setShowModal(false)} className="text-white/60 hover:text-white">&times;</button>
                    </div>
                    <form onSubmit={handleSubmit} className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Meeting Title</label>
                            <input 
                                required
                                type="text"
                                value={formData.title}
                                onChange={e => setFormData({...formData, title: e.target.value})}
                                className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-brand-900"
                                placeholder="e.g., Q3 Strategy Session"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Date</label>
                                <input 
                                    required
                                    type="date"
                                    value={formData.date}
                                    onChange={e => setFormData({...formData, date: e.target.value})}
                                    className="w-full border border-slate-300 rounded p-2 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Time</label>
                                <input 
                                    required
                                    type="time"
                                    value={formData.time}
                                    onChange={e => setFormData({...formData, time: e.target.value})}
                                    className="w-full border border-slate-300 rounded p-2 text-sm"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Location / Link</label>
                            <input 
                                required
                                type="text"
                                value={formData.location}
                                onChange={e => setFormData({...formData, location: e.target.value})}
                                className="w-full border border-slate-300 rounded p-2 text-sm"
                                placeholder="e.g., Boardroom 1 / MS Teams"
                            />
                        </div>
                        <div className="pt-4 flex justify-end space-x-2">
                            <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded">Cancel</button>
                            <button type="submit" className="px-4 py-2 bg-brand-900 text-white rounded font-medium hover:bg-brand-800">
                                {editingId ? 'Save Changes' : 'Schedule & Notify'}
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

export default CalendarView;