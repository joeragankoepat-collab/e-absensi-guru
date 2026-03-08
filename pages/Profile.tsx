
import React, { useState } from 'react';
import { User as UserIcon, LogOut, IdCard, BadgeCheck, Briefcase, School, AlertTriangle } from 'lucide-react';
import Header from '../components/Header';
import { User } from '../types';

interface ProfileProps {
  user: User;
  onLogout: () => void;
}

const Profile: React.FC<ProfileProps> = ({ user, onLogout }) => {
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const infoItems = [
    { 
      icon: <IdCard size={18} className="text-indigo-400" />, 
      label: 'NIP', 
      value: user.nip 
    },
    { 
      icon: <BadgeCheck size={18} className="text-emerald-400" />, 
      label: 'Status Pegawai', 
      value: user.employmentStatus 
    },
    { 
      icon: <Briefcase size={18} className="text-amber-400" />, 
      label: 'Jabatan', 
      value: user.role 
    },
    { 
      icon: <School size={18} className="text-blue-400" />, 
      label: 'Unit Kerja', 
      value: user.school 
    },
  ];

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    // Menutup modal dan memanggil fungsi logout
    setShowLogoutModal(false);
    onLogout();
  };

  return (
    <div className="flex-1 pb-24 overflow-y-auto relative">
      <Header title="Profil Saya" />

      <div className="flex flex-col items-center pt-8 pb-6 px-6 relative z-10">
        <div className="relative">
          <div className="w-28 h-28 rounded-full p-1 bg-gradient-to-tr from-indigo-500 to-purple-500 shadow-xl shadow-indigo-500/20">
            <img 
              src={user.avatar || undefined} 
              alt={user.name} 
              className="w-full h-full rounded-full object-cover border-4 border-slate-950"
            />
          </div>
          <div className="absolute bottom-1 right-1 w-7 h-7 bg-indigo-600 rounded-full border-2 border-slate-950 flex items-center justify-center text-white shadow-lg">
            <UserIcon size={14} />
          </div>
        </div>
        <h2 className="mt-5 text-xl font-bold text-white text-center">{user.name}</h2>
        <div className="mt-1 flex items-center gap-1.5 text-slate-500">
           <span className="text-xs font-medium uppercase tracking-wider">{user.role}</span>
        </div>
      </div>

      <div className="px-6 mb-8 relative z-10">
        <div className="bg-slate-900/50 border border-white/5 rounded-[2rem] p-5 shadow-inner">
          <h3 className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mb-4 px-2">Data Kepegawaian</h3>
          <div className="space-y-4">
            {infoItems.map((item, idx) => (
              <div key={idx} className="flex items-start gap-4 p-1">
                <div className="mt-0.5 p-2 bg-slate-800 rounded-xl">
                  {item.icon}
                </div>
                <div className="flex-1 border-b border-white/5 pb-3">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tight block mb-0.5">{item.label}</span>
                  <span className="text-sm text-slate-200 font-semibold">{item.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="px-6 space-y-4 relative z-20">
        <div className="pt-2">
          <button 
            type="button"
            onClick={handleLogoutClick}
            className="w-full flex items-center justify-center gap-2 p-4 bg-red-600/10 border border-red-600/20 text-red-500 font-bold rounded-2xl hover:bg-red-600/20 active:scale-[0.98] transition-all cursor-pointer shadow-lg group"
          >
            <LogOut size={20} className="group-hover:scale-110 transition-transform" />
            Keluar dari Aplikasi
          </button>
        </div>
      </div>

      <div className="mt-12 text-center text-slate-600 text-[9px] uppercase tracking-widest pb-8 relative z-10">
        Sistem Informasi Kepegawaian v2.1.0<br/>SMPN 1
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div 
            className="fixed inset-0 bg-slate-950/90 backdrop-blur-md transition-opacity" 
            onClick={() => setShowLogoutModal(false)} 
          />
          <div className="relative w-full max-w-xs bg-slate-900 rounded-3xl p-6 border border-white/10 shadow-2xl animate-in zoom-in duration-200">
            <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500 border border-red-500/20">
                <AlertTriangle size={24} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2 text-center">Konfirmasi Keluar</h3>
            <p className="text-slate-400 text-xs text-center mb-6 leading-relaxed">
              Apakah Anda yakin ingin mengakhiri sesi ini? Anda harus login kembali untuk mengakses aplikasi.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setShowLogoutModal(false)}
                className="py-3 px-4 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-700 hover:text-white transition-colors"
              >
                Batal
              </button>
              <button 
                onClick={confirmLogout}
                className="py-3 px-4 rounded-xl bg-red-600 text-white font-bold text-xs hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20 flex items-center justify-center gap-2"
              >
                <LogOut size={14} />
                Ya, Keluar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
