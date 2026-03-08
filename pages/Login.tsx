
import React, { useState, useEffect } from 'react';
import { User as UserIcon, Lock, LogIn, Eye, EyeOff } from 'lucide-react';
import Papa from 'papaparse';
import { User } from '../types';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [cachedUsers, setCachedUsers] = useState<any[] | null>(null);

  useEffect(() => {
    const lastUsername = localStorage.getItem('last_username');
    if (lastUsername) {
      setUsername(lastUsername);
    }

    // Pre-fetch user data to speed up login
    const prefetchData = async () => {
      try {
        const response = await fetch('https://docs.google.com/spreadsheets/d/e/2PACX-1vQjao6HTaaJ0FLRLRxxnDuQh8c4mwKaZp7O20AQ4-RK1_DYjgtIbxjF74cz_BayfpgE06d_PLr8Tj-J/pub?gid=0&single=true&output=csv');
        const csvText = await response.text();
        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            setCachedUsers(results.data as any[]);
          }
        });
      } catch (err) {
        console.error("Pre-fetch failed:", err);
      }
    };
    prefetchData();
  }, []);

  const processLogin = (users: any[]) => {
    const foundUser = users.find(
      (u) => u.Username === username && u.Password === password
    );

    if (foundUser) {
      onLogin({
        id: foundUser.Username,
        name: foundUser.nama,
        nip: foundUser.NIP,
        role: foundUser.Role as 'Guru',
        avatar: foundUser.avatar,
        school: foundUser.Sekolah,
        employmentStatus: foundUser.Status
      });
    } else {
      setError('Username atau password salah');
    }
    setIsLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    localStorage.setItem('last_username', username);

    // Use cached data if available
    if (cachedUsers) {
      processLogin(cachedUsers);
      return;
    }
    
    try {
      const response = await fetch('https://docs.google.com/spreadsheets/d/e/2PACX-1vQjao6HTaaJ0FLRLRxxnDuQh8c4mwKaZp7O20AQ4-RK1_DYjgtIbxjF74cz_BayfpgE06d_PLr8Tj-J/pub?gid=0&single=true&output=csv');
      const csvText = await response.text();
      
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const users = results.data as any[];
          setCachedUsers(users);
          processLogin(users);
        },
        error: (error: any) => {
          console.error("Error parsing CSV:", error);
          setError('Terjadi kesalahan saat membaca data pengguna');
          setIsLoading(false);
        }
      });
    } catch (err) {
      console.error("Error fetching CSV:", err);
      setError('Gagal memuat data pengguna');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col px-6 py-12 justify-center bg-slate-950 relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-indigo-600/20 rounded-full blur-[80px]" />
      <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-purple-600/20 rounded-full blur-[80px]" />

      <div className="text-center mb-10 z-10">
        <div className="w-32 h-32 mx-auto mb-6 flex items-center justify-center overflow-hidden transition-all duration-300">
            <img 
              src="https://iili.io/qIxRN6b.png" 
              alt="Logo SMPN 1" 
              className="w-full h-full object-contain drop-shadow-[0_0_20px_rgba(79,70,229,0.4)]" 
              referrerPolicy="no-referrer"
            />
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">E-Absensi Guru</h1>
        <p className="text-slate-400 text-sm mt-2">SMPN 1</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 z-10">
        {error && (
          <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-sm text-center">
            {error}
          </div>
        )}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <UserIcon size={18} className="text-slate-500" />
          </div>
          <input
            type="text"
            className="w-full pl-11 pr-4 py-4 bg-slate-900/50 border border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all text-white placeholder-slate-500"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>

        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Lock size={18} className="text-slate-500" />
          </div>
          <input
            type={showPassword ? "text" : "password"}
            className="w-full pl-11 pr-12 py-4 bg-slate-900/50 border border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all text-white placeholder-slate-500"
            placeholder="Kata Sandi"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-indigo-400 transition-colors"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-4 text-white font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 mt-2 bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <LogIn size={18} />
              Masuk
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default Login;
