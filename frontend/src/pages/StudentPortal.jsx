import React, { useState, useRef } from 'react';
import { 
  QrCode, Award, Calendar, Clock, MapPin, Building, Phone, 
  Mail, CheckCircle, Ticket, Camera, Upload, Trash2, Edit3, 
  X, Check, ShieldCheck, User 
} from 'lucide-react';
import { api } from '../services/api';

export default function StudentPortal({ currentUser, onUpdateUser, registrations, events, onShowTicket, onShowCert, onOpenEvent }) {
  const eventsMap = new Map(events.map(e => [e.id, e]));
  const fileInputRef = useRef(null);

  const [uploading, setUploading] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });
  
  // Edit Profile Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState(currentUser?.full_name || '');
  const [editPhone, setEditPhone] = useState(currentUser?.phone || '');
  const [editHostel, setEditHostel] = useState(currentUser?.hostel || '');
  const [editDept, setEditDept] = useState(currentUser?.department || 'Computer Science & Engineering');
  const [editYear, setEditYear] = useState(currentUser?.year || 'E3');
  const [savingProfile, setSavingProfile] = useState(false);

  // Compress & convert file to Base64
  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setStatusMsg({ type: 'error', text: 'Please select a valid image file (JPG, PNG, or WebP).' });
      return;
    }

    setUploading(true);
    setStatusMsg({ type: 'info', text: 'Optimizing and uploading photo...' });

    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onload = async () => {
        // High quality Canvas compressor: max 450x450 square
        const canvas = document.createElement('canvas');
        const MAX_DIM = 450;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_DIM) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.88);

        try {
          const res = await api.updateUserProfile(currentUser.id, { avatar_url: compressedBase64 });
          if (res.user && onUpdateUser) {
            onUpdateUser(res.user);
          }
          setStatusMsg({ type: 'success', text: 'Profile photo updated successfully!' });
          setTimeout(() => setStatusMsg({ type: '', text: '' }), 4000);
        } catch (err) {
          setStatusMsg({ type: 'error', text: err.message || 'Failed to save photo.' });
        } finally {
          setUploading(false);
        }
      };
      img.src = readerEvent.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleResetAvatar = async () => {
    if (!confirm('Revert to default university avatar?')) return;
    setUploading(true);
    try {
      const defaultAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(currentUser.full_name || 'RGUKT')}`;
      const res = await api.updateUserProfile(currentUser.id, { avatar_url: defaultAvatar });
      if (res.user && onUpdateUser) {
        onUpdateUser(res.user);
      }
      setStatusMsg({ type: 'success', text: 'Reverted to default avatar.' });
      setTimeout(() => setStatusMsg({ type: '', text: '' }), 3000);
    } catch (err) {
      setStatusMsg({ type: 'error', text: 'Failed to reset avatar.' });
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await api.updateUserProfile(currentUser.id, {
        full_name: editName,
        phone: editPhone,
        hostel: editHostel,
        department: editDept,
        year: editYear
      });
      if (res.user && onUpdateUser) {
        onUpdateUser(res.user);
      }
      setShowEditModal(false);
      setStatusMsg({ type: 'success', text: 'Profile details saved to database.' });
      setTimeout(() => setStatusMsg({ type: '', text: '' }), 3000);
    } catch (err) {
      alert(err.message || 'Update failed');
    } finally {
      setSavingProfile(false);
    }
  };

  const isRealPhoto = currentUser?.avatar_url && !currentUser.avatar_url.includes('dicebear.com');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">
      
      {/* Toast Notification */}
      {statusMsg.text && (
        <div className={`mb-6 p-4 rounded-2xl flex items-center justify-between text-xs font-semibold shadow-xl border animate-fade-in ${
          statusMsg.type === 'error' ? 'bg-red-500/20 text-red-300 border-red-500/40' :
          statusMsg.type === 'success' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
          'bg-blue-500/20 text-blue-300 border-blue-500/40'
        }`}>
          <div className="flex items-center gap-2">
            {statusMsg.type === 'success' ? <Check className="w-4 h-4 text-emerald-400" /> : <ShieldCheck className="w-4 h-4" />}
            <span>{statusMsg.text}</span>
          </div>
          <button onClick={() => setStatusMsg({ type: '', text: '' })} className="hover:opacity-75">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Student Profile Summary Card */}
      <div className="p-6 rounded-3xl glass-panel border border-slate-700/60 shadow-xl mb-8 relative overflow-hidden">
        
        {/* Subtle decorative glow */}
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
          
          {/* REAL PROFILE PHOTO UPLOADER */}
          <div className="relative group shrink-0">
            <div className="w-28 h-28 rounded-3xl overflow-hidden border-2 border-blue-500 bg-slate-900 shadow-2xl relative">
              <img
                src={currentUser?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser?.full_name}`}
                className="w-full h-full object-cover"
                alt="Profile"
              />
              {uploading && (
                <div className="absolute inset-0 bg-slate-950/80 flex items-center justify-center text-[10px] font-bold text-cyan-300">
                  Uploading...
                </div>
              )}
            </div>

            {/* Camera Floating Action Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-2 -right-2 p-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/40 transition-transform active:scale-95 flex items-center justify-center border-2 border-slate-950"
              title="Upload your real photo from device"
            >
              <Camera className="w-4 h-4" />
            </button>

            {/* Hidden file input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handlePhotoSelect}
              accept="image/png, image/jpeg, image/jpg, image/webp"
              className="hidden"
            />
          </div>

          {/* Profile Identity Details */}
          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-heading">{currentUser?.full_name}</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                {currentUser?.rgukt_id || 'STUDENT'}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                {currentUser?.department || 'Engineering'} ({currentUser?.year || 'E3'})
              </span>
            </div>

            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              Rajiv Gandhi University of Knowledge Technologies • IIIT RK Valley, Idupulapaya
            </p>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-3 text-xs text-slate-300">
              <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-blue-400" />{currentUser?.email}</span>
              <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-emerald-400" />{currentUser?.phone || 'Not Provided'}</span>
              <span className="flex items-center gap-1.5"><Building className="w-3.5 h-3.5 text-purple-400" />{currentUser?.hostel || 'Hostel Campus'}</span>
            </div>

            {/* Photo Action Pill Bar */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-4 pt-3 border-t border-slate-800/80">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 rounded-xl text-[11px] font-bold bg-slate-800 hover:bg-slate-700 text-blue-400 hover:text-white border border-slate-700 transition-colors flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5 text-blue-400" /> Upload Real Photo
              </button>

              {isRealPhoto && (
                <button
                  onClick={handleResetAvatar}
                  className="px-2.5 py-1.5 rounded-xl text-[11px] font-semibold text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors flex items-center gap-1"
                  title="Remove photo & use default avatar"
                >
                  <Trash2 className="w-3 h-3" /> Reset
                </button>
              )}

              <button
                onClick={() => {
                  setEditName(currentUser?.full_name || '');
                  setEditPhone(currentUser?.phone || '');
                  setEditHostel(currentUser?.hostel || '');
                  setEditDept(currentUser?.department || 'Computer Science & Engineering');
                  setEditYear(currentUser?.year || 'E3');
                  setShowEditModal(true);
                }}
                className="px-3 py-1.5 rounded-xl text-[11px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors flex items-center gap-1.5"
              >
                <Edit3 className="w-3.5 h-3.5 text-slate-400" /> Edit Profile Details
              </button>
            </div>
          </div>

          {/* Quick Stats Block */}
          <div className="flex md:flex-col gap-3 shrink-0">
            <div className="bg-slate-900/90 rounded-2xl px-5 py-3 border border-slate-800 text-center min-w-[110px] shadow-md">
              <div className="text-3xl font-extrabold text-blue-400 font-heading">{registrations.length}</div>
              <div className="text-[11px] text-slate-400 font-medium mt-0.5">Registered</div>
            </div>
            <div className="bg-slate-900/90 rounded-2xl px-5 py-3 border border-slate-800 text-center min-w-[110px] shadow-md">
              <div className="text-3xl font-extrabold text-emerald-400 font-heading">
                {registrations.filter(r => r.check_in_status === 'checked_in').length}
              </div>
              <div className="text-[11px] text-slate-400 font-medium mt-0.5">Attended</div>
            </div>
          </div>

        </div>
      </div>

      {/* Events Heading */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold font-heading text-white">My Registered Campus Events</h2>
          <p className="text-xs text-slate-400">Digital Entry Passes with QR Scanning and Verified E-Certificates</p>
        </div>
      </div>

      {/* Registrations List */}
      {registrations.length === 0 ? (
        <div className="p-12 text-center rounded-3xl glass-panel border border-slate-800 shadow-xl">
          <Ticket className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white">No Registered Events Yet</h3>
          <p className="text-xs text-slate-400 mt-1">Explore upcoming college events and register to receive your personal entry pass.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {registrations.map(reg => {
            const evt = eventsMap.get(reg.event_id) || {
              title: 'Campus Event',
              start_date: new Date().toISOString(),
              venue_name: 'Campus Venue',
              category: 'General',
              image_url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800'
            };
            const isCheckedIn = reg.check_in_status === 'checked_in';

            return (
              <div key={reg.id} className="glass-panel rounded-2xl overflow-hidden border border-slate-700/60 hover:border-blue-500/40 transition-all flex flex-col md:flex-row shadow-lg">
                <div className="md:w-56 h-40 md:h-auto relative overflow-hidden bg-slate-900">
                  <img src={evt.image_url} alt={evt.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent" />
                  <span className="absolute top-3 left-3 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-900/80 backdrop-blur-md text-blue-300 border border-blue-500/30">
                    {evt.category}
                  </span>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-medium text-slate-400">Ticket: #{reg.ticket_code}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          reg.payment_status === 'paid' 
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                            : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                        }`}>
                          {reg.payment_status === 'paid' ? `Paid ₹${reg.payment_amount}` : 'Free Pass'}
                        </span>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        isCheckedIn ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      }`}>
                        {isCheckedIn ? '✓ Verified & Attended' : 'Confirmed Entry Pass'}
                      </span>
                    </div>

                    <h3 
                      onClick={() => onOpenEvent(evt.id)}
                      className="text-xl font-bold text-white mt-1.5 font-heading hover:text-blue-400 transition-colors cursor-pointer"
                    >
                      {evt.title}
                    </h3>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 mt-2">
                      <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-blue-400" />{new Date(evt.start_date).toLocaleDateString()}</span>
                      <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-amber-400" />{new Date(evt.start_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-cyan-400" />{evt.venue_name}</span>
                    </div>

                    <div className="mt-3 text-xs text-slate-400 bg-slate-800/60 p-2.5 rounded-lg border border-slate-700/40">
                      <span className="text-slate-300 font-medium">Team Format:</span> {reg.team_name} ({reg.team_members})
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 mt-4 pt-3 border-t border-slate-800">
                    <button
                      onClick={() => onShowTicket(reg, evt)}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md shadow-blue-600/20 transition-all flex items-center gap-1.5"
                    >
                      <QrCode className="w-4 h-4" /> View QR E-Ticket
                    </button>
                    <button
                      onClick={() => onShowCert(reg, evt)}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 transition-all flex items-center gap-1.5"
                    >
                      <Award className="w-4 h-4 text-amber-400" /> E-Certificate
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* EDIT PROFILE MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-md glass-panel rounded-3xl border border-slate-700 overflow-hidden shadow-2xl p-6 my-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-white font-heading">Edit Profile Details</h3>
                <p className="text-xs text-slate-400">Update your academic & contact information</p>
              </div>
              <button onClick={() => setShowEditModal(false)} className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-blue-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Department</label>
                  <select
                    value={editDept}
                    onChange={e => setEditDept(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-900 border border-slate-700 text-slate-100"
                  >
                    <option value="Computer Science & Engineering">CSE</option>
                    <option value="Electronics & Comm Engineering">ECE</option>
                    <option value="Mechanical Engineering">Mechanical</option>
                    <option value="Civil Engineering">Civil</option>
                    <option value="Chemical Engineering">Chemical</option>
                    <option value="Metallurgical Engineering">MME</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Academic Year</label>
                  <select
                    value={editYear}
                    onChange={e => setEditYear(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-900 border border-slate-700 text-slate-100"
                  >
                    <option value="E1">E1 (1st Year)</option>
                    <option value="E2">E2 (2nd Year)</option>
                    <option value="E3">E3 (3rd Year)</option>
                    <option value="E4">E4 (Final Year)</option>
                    <option value="PUC">PUC</option>
                    <option value="Faculty">Faculty</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="e.g. 9848012345"
                    value={editPhone}
                    onChange={e => setEditPhone(e.target.value)}
                    maxLength={10}
                    className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-900 border border-slate-700 text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Hostel Room</label>
                  <input
                    type="text"
                    placeholder="e.g. BH-2, Room 314"
                    value={editHostel}
                    onChange={e => setEditHostel(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-900 border border-slate-700 text-slate-100"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/25 transition-all flex items-center gap-1.5"
                >
                  {savingProfile ? 'Saving...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
