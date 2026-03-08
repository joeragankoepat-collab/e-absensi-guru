
import React, { useState, useEffect, useRef, useMemo } from 'react';
import Papa from 'papaparse';
import { LogIn, LogOut, Coffee, GraduationCap, MapPin, Clock, Camera, Check, X, RefreshCw, Fingerprint, FileText, Calendar as CalendarIcon, Image as ImageIcon, AlertCircle, ShieldCheck, Navigation } from 'lucide-react';
import Header from '../components/Header';
import { User } from '../types';

interface HomeProps { user: User; }

// School coordinates for SMPN 1
const SCHOOL_LAT = -6.096767830183668;
const SCHOOL_LNG = 106.1559807364539;
const ALLOWED_RADIUS_METERS = 50; 

const SUBJECTS = [
  "PAI", "PKN", "B. INDONESIA", "B. INGGRIS", "IPA", "IPS", 
  "PJOK", "SBD", "TIK", "MATEMATIKA", "KASERANGAN", "BTQ", "PRAKARYA", "BP/BK"
];

const Home: React.FC<HomeProps> = ({ user }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [status, setStatus] = useState<'IDLE' | 'PRESENT' | 'OUT'>('IDLE');
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showRekapModal, setShowRekapModal] = useState(false);
  const [rekapData, setRekapData] = useState<any[]>([]);
  const [isLoadingRekap, setIsLoadingRekap] = useState(false);

  const fetchRekapData = async () => {
    setIsLoadingRekap(true);
    try {
      const ABSENSI_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQjao6HTaaJ0FLRLRxxnDuQh8c4mwKaZp7O20AQ4-RK1_DYjgtIbxjF74cz_BayfpgE06d_PLr8Tj-J/pub?gid=878143918&single=true&output=csv';
      const IZIN_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQjao6HTaaJ0FLRLRxxnDuQh8c4mwKaZp7O20AQ4-RK1_DYjgtIbxjF74cz_BayfpgE06d_PLr8Tj-J/pub?gid=2019367649&single=true&output=csv';
      
      const [absensiResponse, izinResponse] = await Promise.all([
        fetch(ABSENSI_CSV_URL),
        fetch(IZIN_CSV_URL)
      ]);
      
      const absensiCsvText = await absensiResponse.text();
      const izinCsvText = await izinResponse.text();
      
      const absensiData = Papa.parse(absensiCsvText, { header: true, skipEmptyLines: true }).data;
      const izinData = Papa.parse(izinCsvText, { header: true, skipEmptyLines: true }).data;
      
      const today = new Date();
      const dd = String(today.getDate()).padStart(2, '0');
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const yyyy = today.getFullYear();
      const todayStr = `${dd}/${mm}/${yyyy}`; // Format: DD/MM/YYYY
      
      const userMap = new Map();
      
      // Process Absensi
      if (absensiData) {
        absensiData.forEach((row: any) => {
          const rowDate = row.tanggal || row.Tanggal;
          
          if (rowDate === todayStr) {
            const nip = row.nip || row.NIP;
            const nama = row.nama || row.Nama;
            const tipe = row.tipe || row.Tipe || row['Tipe (In/Out)'];
            const jam = row.jam || row.Jam;
            
            if (!userMap.has(nip)) {
              userMap.set(nip, { name: nama, nip: nip, timeIn: "--:--", timeOut: "--:--", status: "HADIR" });
            }
            const userData = userMap.get(nip);
            if (tipe === 'IN' || tipe === 'Masuk') {
                if (userData.timeIn === "--:--") userData.timeIn = jam;
            }
            if (tipe === 'OUT' || tipe === 'Pulang') userData.timeOut = jam;
          }
        });
      }
      
      // Process Izin
      if (izinData) {
        izinData.forEach((row: any) => {
          const tanggalMulai = row.tanggalMulai || row.TanggalMulai || row.Mulai;
          const tanggalSelesai = row.tanggalSelesai || row.TanggalSelesai || row.Selesai;
          
          if (!tanggalMulai || !tanggalSelesai) return;
          
          const todayDate = new Date();
          todayDate.setHours(0,0,0,0);
          
          let start = new Date(tanggalMulai);
          let end = new Date(tanggalSelesai);
          
          if (typeof tanggalMulai === 'string' && tanggalMulai.includes('-') && tanggalMulai.split('-')[0].length === 4) {
             const [y, m, d] = tanggalMulai.split('-');
             start = new Date(Number(y), Number(m)-1, Number(d));
          }
          if (typeof tanggalSelesai === 'string' && tanggalSelesai.includes('-') && tanggalSelesai.split('-')[0].length === 4) {
             const [y, m, d] = tanggalSelesai.split('-');
             end = new Date(Number(y), Number(m)-1, Number(d));
          }
          
          if (todayDate >= start && todayDate <= end) {
             const nip = row.nip || row.NIP;
             const nama = row.nama || row.Nama;
             const jenisIzin = row.jenisIzin || row.JenisIzin || row.jenis_izin || row['Tipe Izin'];
             
             if (!userMap.has(nip)) {
               userMap.set(nip, { name: nama, nip: nip, timeIn: "--:--", timeOut: "--:--", status: jenisIzin ? jenisIzin.toUpperCase() : "IZIN" });
             } else {
               userMap.get(nip).status = jenisIzin ? jenisIzin.toUpperCase() : "IZIN";
             }
          }
        });
      }
      
      setRekapData(Array.from(userMap.values()));
    } catch (error) {
      console.error("Error fetching rekap:", error);
    } finally {
      setIsLoadingRekap(false);
    }
  };

  const downloadRekapCSV = () => {
    if (rekapData.length === 0) return;
    
    let csvContent = "NIP,Nama,Jam Masuk,Jam Pulang,Status\n";
    rekapData.forEach(row => {
      csvContent += `${row.nip},"${row.name}",${row.timeIn},${row.timeOut},${row.status}\n`;
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `rekap_harian_${new Date().toLocaleDateString('id-ID').replace(/\//g, '-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [leaveType, setLeaveType] = useState<'Izin' | 'Sakit' | 'Dinas'>('Izin');
  const [leaveStartDate, setLeaveStartDate] = useState('');
  const [leaveEndDate, setLeaveEndDate] = useState('');
  const [leaveReason, setLeaveReason] = useState('');
  const [leaveAttachment, setLeaveAttachment] = useState<string | null>(null);

  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [attendanceType, setAttendanceType] = useState<'IN' | 'OUT' | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const roomOptions = [
    'VII - A', 'VII - B', 'VII - C', 'VII - D', 'VII - E', 'VII - F', 'VII - G',
    'VIII - A', 'VIII - B', 'VIII - C', 'VIII - D', 'VIII - E', 'VIII - F', 'VIII - G',
    'IX - A', 'IX - B', 'IX - C', 'IX - D', 'IX - E', 'IX - F', 'IX - G'
  ];

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const isPulangDisabled = status !== 'PRESENT';

  // Haversine formula to calculate distance in meters
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // in metres
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('id-ID', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('id-ID', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const clearErrors = () => setErrors({});

  const openAttendanceModal = (type: 'IN' | 'OUT') => {
    setAttendanceType(type);
    setShowAttendanceModal(true);
    setPhoto(null);
    clearErrors();
    getLocation();
    startCamera();
  };

  const closeAttendanceModal = () => {
    setShowAttendanceModal(false);
    stopCamera();
    setAttendanceType(null);
    setPhoto(null);
    setDistance(null);
    setLocation(null);
    clearErrors();
  };

  const closeLeaveModal = () => {
    setShowLeaveModal(false);
    clearErrors();
  };

  const getLocation = () => {
    setGpsLoading(true);
    setErrors(prev => {
        const next = {...prev};
        delete next.location;
        return next;
    });
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setLocation(coords);
          const dist = calculateDistance(coords.lat, coords.lng, SCHOOL_LAT, SCHOOL_LNG);
          setDistance(dist);
          
          if (dist > ALLOWED_RADIUS_METERS) {
            setErrors(prev => ({...prev, location: `Anda berada di luar radius sekolah (${Math.round(dist)}m). Maksimal radius: ${ALLOWED_RADIUS_METERS}m.`}));
          }

          setGpsLoading(false);
        },
        (error) => {
          console.error("Error getting location", error);
          setGpsLoading(false);
          setErrors(prev => ({...prev, location: "Gagal mendapatkan koordinat GPS. Pastikan izin lokasi aktif."}));
        },
        { enableHighAccuracy: true }
      );
    }
  };

  const startCamera = async () => {
    try {
      setIsCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          aspectRatio: { ideal: 3/4 },
          width: { ideal: 1200 },
          height: { ideal: 1600 }
        }, 
        audio: false 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera", err);
      setIsCameraActive(false);
      setErrors(prev => ({...prev, photo: "Kamera tidak dapat diakses."}));
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const vWidth = video.videoWidth;
      const vHeight = video.videoHeight;
      const targetAspect = 3 / 4;
      
      canvas.width = 600;
      canvas.height = 800;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const currentAspect = vWidth / vHeight;
        let sWidth, sHeight, sx, sy;

        if (currentAspect > targetAspect) {
          sHeight = vHeight;
          sWidth = vHeight * targetAspect;
          sx = (vWidth - sWidth) / 2;
          sy = 0;
        } else {
          sWidth = vWidth;
          sHeight = vWidth / targetAspect;
          sx = 0;
          sy = (vHeight - sHeight) / 2;
        }

        ctx.drawImage(video, sx, sy, sWidth, sHeight, 0, 0, 600, 800);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        setPhoto(dataUrl);
        setErrors(prev => {
            const next = {...prev};
            delete next.photo;
            return next;
        });
        stopCamera();
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
          setErrors(prev => ({...prev, attachment: "File terlalu besar (Maks 5MB)."}));
          return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setLeaveAttachment(reader.result as string);
        setErrors(prev => {
            const next = {...prev};
            delete next.attachment;
            return next;
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitAttendance = async () => {
    const newErrors: Record<string, string> = {};
    if (!photo) newErrors.photo = "Wajib mengambil foto selfie sebagai bukti kehadiran.";
    if (!location) newErrors.location = "Wajib mengaktifkan GPS untuk mencatat lokasi presensi.";
    if (distance !== null && distance > ALLOWED_RADIUS_METERS) {
        newErrors.location = `Gagal! Jarak Anda (${Math.round(distance)}m) terlalu jauh dari sekolah.`;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    const typeLabel = attendanceType === 'IN' ? 'Masuk' : 'Pulang';
    
    // Prepare data for Google Apps Script
    const now = new Date();
    const tanggal = now.toLocaleDateString('id-ID', { year: 'numeric', month: '2-digit', day: '2-digit' });
    const jam = formatTime(now);
    const koordinat = location ? `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}` : '';
    
    const payload = {
      tanggal: tanggal,
      jam: jam,
      nip: user.nip,
      nama: user.name,
      tipe: typeLabel,
      koordinat: koordinat,
      jarak: distance ? Math.round(distance) : 0,
      photoBase64: photo
    };

    try {
      const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwPdDtvxZDgsHcTgRJHjJEIdaxF5Mc9L1Lp77Sl8Zn9Kolh48JRQLfl-r7XoJEH79C4FA/exec';
      
      await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(payload)
      });

      if (attendanceType === 'IN') {
        setStatus('PRESENT');
      } else {
        setStatus('OUT');
      }
      
      if (location) {
          alert(`Presensi ${typeLabel} Berhasil!\n\nNama: ${user.name}\nNIP: ${user.nip}\nWaktu: ${jam}\nLokasi: ${koordinat}\nJarak: ${Math.round(distance || 0)}m`);
      }
      closeAttendanceModal();
    } catch (error) {
      console.error("Error submitting attendance:", error);
      alert("Terjadi kesalahan saat mengirim data presensi. Silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const [isSubmittingLeave, setIsSubmittingLeave] = useState(false);

  const handleSubmitLeave = async () => {
    const newErrors: Record<string, string> = {};
    
    if (!leaveStartDate) newErrors.leaveStartDate = "Pilih tanggal mulai.";
    if (!leaveEndDate) newErrors.leaveEndDate = "Pilih tanggal selesai.";
    if (leaveStartDate && leaveEndDate && leaveEndDate < leaveStartDate) {
        newErrors.leaveEndDate = "Tanggal selesai tidak boleh mendahului tanggal mulai.";
    }
    if (!leaveReason || leaveReason.trim().length < 10) {
        newErrors.leaveReason = "Keterangan minimal 10 karakter.";
    }

    if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
    }

    setIsSubmittingLeave(true);
    
    const now = new Date();
    const timestamp = now.toLocaleDateString('id-ID', { year: 'numeric', month: '2-digit', day: '2-digit' }) + ' ' + formatTime(now);
    
    const payload = {
      type: 'leave',
      timestamp: timestamp,
      nip: user.nip,
      nama: user.name,
      jenisIzin: leaveType,
      tanggalMulai: leaveStartDate,
      tanggalSelesai: leaveEndDate,
      alasan: leaveReason,
      photoBase64: leaveAttachment || ''
    };

    try {
      const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwPdDtvxZDgsHcTgRJHjJEIdaxF5Mc9L1Lp77Sl8Zn9Kolh48JRQLfl-r7XoJEH79C4FA/exec';
      
      await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(payload)
      });

      alert(`Pengajuan ${leaveType} Berhasil Dikirim!\n\nTanggal: ${leaveStartDate} s/d ${leaveEndDate}\nAlasan: ${leaveReason}`);
      setShowLeaveModal(false);
      setLeaveReason('');
      setLeaveStartDate('');
      setLeaveEndDate('');
      setLeaveAttachment(null);
      clearErrors();
    } catch (error) {
      console.error("Error submitting leave:", error);
      alert("Terjadi kesalahan saat mengirim pengajuan. Silakan coba lagi.");
    } finally {
      setIsSubmittingLeave(false);
    }
  };

  const ErrorMsg = ({ name }: { name: string }) => errors[name] ? (
    <p className="text-[10px] text-red-500 font-bold mt-1 flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
      <AlertCircle size={10} /> {errors[name]}
    </p>
  ) : null;

  return (
    <div className="flex-1 pb-24 overflow-y-auto">
      <Header title="Dashboard" />
      
      <div className="px-6 mb-6">
        <div className="p-6 rounded-2xl glass overflow-hidden relative border-indigo-500/20">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <LogOut size={100} className="rotate-180" />
          </div>
          <h2 className="text-slate-400 text-sm font-medium">Halo, selamat pagi!</h2>
          <p className="text-xl font-bold text-white mt-1 truncate">{user.name}</p>
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <div className="flex items-center gap-2 text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
                <span className="text-[10px] font-semibold uppercase">{user.role}</span>
            </div>
            <div className="text-[10px] font-mono text-slate-500 bg-slate-800/50 px-3 py-1 rounded-full border border-white/5">
                NIP: {user.nip}
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 mb-10 text-center">
        <div className="inline-block px-8 py-6 bg-slate-900/40 rounded-3xl border border-white/5 shadow-inner">
            <div className="text-4xl font-mono font-bold tracking-tighter text-indigo-400 mb-1">
                {formatTime(currentTime)}
            </div>
            <div className="text-slate-400 text-sm font-medium">
                {formatDate(currentTime)}
            </div>
        </div>
      </div>

      <div className="px-6 grid grid-cols-2 gap-4">
        <button 
            onClick={() => openAttendanceModal('IN')}
            disabled={status !== 'IDLE'}
            className="flex flex-col items-center justify-center gap-3 p-5 rounded-3xl bg-emerald-600/10 border border-emerald-500/20 hover:bg-emerald-600/20 transition-all disabled:opacity-50 disabled:grayscale group"
        >
            <div className="p-3 bg-emerald-500 rounded-2xl shadow-lg shadow-emerald-500/20 group-active:scale-95 transition-transform">
                <LogIn className="text-white" size={24} />
            </div>
            <span className="text-white font-bold text-xs">Absen Masuk</span>
        </button>

        <button 
            onClick={() => openAttendanceModal('OUT')}
            disabled={isPulangDisabled}
            className="flex flex-col items-center justify-center gap-2 p-5 rounded-3xl bg-indigo-600/10 border border-indigo-500/20 hover:bg-indigo-600/20 transition-all disabled:opacity-50 disabled:grayscale group relative overflow-hidden"
        >
            <div className="p-3 bg-indigo-500 rounded-2xl shadow-lg shadow-indigo-500/20 group-active:scale-95 transition-transform">
                <LogOut className="text-white" size={24} />
            </div>
            <span className="text-white font-bold text-xs">Absen Pulang</span>
        </button>

        <button 
            onClick={() => {
                clearErrors();
                setShowLeaveModal(true);
            }}
            className="flex flex-col items-center justify-center gap-3 p-5 rounded-3xl bg-blue-600/10 border border-blue-500/20 hover:bg-blue-600/20 transition-all group"
        >
            <div className="p-3 bg-blue-500 rounded-2xl shadow-lg shadow-blue-500/20 group-active:scale-95 transition-transform">
                <Coffee className="text-white" size={24} />
            </div>
            <span className="text-white font-bold text-xs">Ijin / Sakit</span>
        </button>

        <button 
            onClick={() => {
                setShowRekapModal(true);
                fetchRekapData();
            }}
            className="flex flex-col items-center justify-center gap-3 p-5 rounded-3xl bg-amber-600/10 border border-amber-500/20 hover:bg-amber-600/20 transition-all group"
        >
            <div className="p-3 bg-amber-500 rounded-2xl shadow-lg shadow-amber-500/20 group-active:scale-95 transition-transform">
                <FileText className="text-white" size={24} />
            </div>
            <span className="text-white font-bold text-xs">Rekap Harian</span>
        </button>
      </div>

      {showAttendanceModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center px-4 py-6 overflow-y-auto">
          <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md" onClick={closeAttendanceModal} />
          <div className="relative w-full max-w-md bg-slate-900 rounded-[2.5rem] p-6 border border-white/10 shadow-2xl animate-in fade-in zoom-in duration-300 my-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Absen {attendanceType === 'IN' ? 'Masuk' : 'Pulang'}</h3>
              <button onClick={closeAttendanceModal} className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"><X size={20}/></button>
            </div>

            <div className="space-y-4">
              <div className="space-y-3">
                <div className="relative">
                  <label className="text-[10px] text-indigo-400 uppercase font-bold absolute -top-2 left-4 bg-slate-900 px-2 z-10 tracking-widest">Identitas Pegawai</label>
                  <div className="w-full flex items-center justify-between p-4 bg-slate-800/40 border border-white/10 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-400">
                        <ShieldCheck size={24} />
                      </div>
                      <div>
                        <span className="text-sm text-white font-bold block">{user.name}</span>
                        <span className="text-[11px] text-slate-400 font-mono font-medium block">NIP: {user.nip}</span>
                      </div>
                    </div>
                    {distance !== null && (
                        <div className={`px-3 py-1.5 rounded-xl border flex flex-col items-end ${distance <= ALLOWED_RADIUS_METERS ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                            <span className="text-[9px] text-slate-500 uppercase font-bold">Jarak</span>
                            <span className={`text-xs font-black ${distance <= ALLOWED_RADIUS_METERS ? 'text-emerald-500' : 'text-red-500'}`}>
                                {Math.round(distance)}m
                            </span>
                        </div>
                    )}
                  </div>
                </div>
              </div>

              <div className={`p-4 rounded-2xl border transition-colors flex items-center justify-between ${errors.location ? 'bg-red-500/5 border-red-500/40' : 'bg-indigo-500/5 border-indigo-500/20'}`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${location ? (distance !== null && distance <= ALLOWED_RADIUS_METERS ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-500') : 'bg-slate-700 text-slate-500'}`}>
                    <Navigation size={18} className={location ? '' : 'animate-pulse'} />
                  </div>
                  <div className="flex-1">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Live GPS Location</span>
                    <span className="text-xs text-white font-mono block truncate max-w-[180px]">
                      {gpsLoading ? 'Melacak Posisi...' : location ? `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}` : 'Gagal melacak'}
                    </span>
                    <ErrorMsg name="location" />
                  </div>
                </div>
                <button onClick={getLocation} className="p-2 text-indigo-400 hover:text-indigo-300 transition-colors">
                  <RefreshCw size={18} className={gpsLoading ? 'animate-spin' : ''}/>
                </button>
              </div>

              <div className={`relative aspect-[3/4] w-full max-w-[280px] mx-auto bg-slate-950 rounded-[2rem] overflow-hidden border-2 shadow-2xl transition-colors ${errors.photo ? 'border-red-500/50' : 'border-indigo-500/30'}`}>
                {photo ? (
                  <>
                    <img src={photo || undefined} alt="Selfie preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-emerald-500/10 pointer-events-none" />
                    <div className="absolute top-4 left-4 bg-emerald-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1 shadow-lg">
                      <Check size={12} /> BERHASIL DIAMBIL
                    </div>
                    <button 
                      onClick={() => { setPhoto(null); startCamera(); }}
                      className="absolute bottom-6 left-1/2 -translate-x-1/2 p-4 bg-white/10 backdrop-blur-md text-white rounded-full border border-white/20 shadow-lg active:scale-90 transition-transform"
                    >
                      <RefreshCw size={24} />
                    </button>
                  </>
                ) : (
                  <>
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
                    <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1 border border-white/10">
                      <Camera size={12} className="text-indigo-400" /> MODE POTRAIT
                    </div>
                    {isCameraActive && (
                      <button onClick={capturePhoto} className="absolute bottom-6 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full bg-white p-1 border-4 border-slate-900 shadow-2xl active:scale-90 transition-transform flex items-center justify-center">
                        <div className="w-full h-full bg-slate-100 rounded-full border border-slate-300" />
                      </button>
                    )}
                  </>
                )}
                <canvas ref={canvasRef} className="hidden" />
              </div>
              <div className="text-center"><ErrorMsg name="photo" /></div>

              <button 
                onClick={handleSubmitAttendance}
                disabled={(distance !== null && distance > ALLOWED_RADIUS_METERS) || isSubmitting}
                className={`w-full py-5 text-white font-bold rounded-2xl shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-2 ${(distance !== null && distance > ALLOWED_RADIUS_METERS) || isSubmitting ? 'bg-slate-700 cursor-not-allowed opacity-60' : 'bg-indigo-600 shadow-indigo-600/30 hover:bg-indigo-700'}`}
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Check size={20} />
                )}
                {isSubmitting ? 'Mengirim Data...' : (distance !== null && distance > ALLOWED_RADIUS_METERS ? 'Di luar Jangkauan Sekolah' : 'Kirim Laporan Presensi')}
              </button>
            </div>
          </div>
        </div>
      )}

      {showLeaveModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center px-4 py-6 overflow-y-auto">
            <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md" onClick={closeLeaveModal} />
            <div className="relative w-full max-w-md bg-slate-900 rounded-[2rem] p-6 border border-white/10 shadow-2xl animate-in zoom-in duration-300 my-auto">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-white flex items-center gap-3">
                        <div className="p-2 bg-blue-500 rounded-lg"><Coffee size={20} className="text-white"/></div>
                        Pengajuan Izin
                    </h3>
                    <button onClick={closeLeaveModal} className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white"><X size={20}/></button>
                </div>
                
                <div className="space-y-5">
                    {/* Teacher Identity Block */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-slate-800/50 rounded-xl border border-white/5">
                            <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1 tracking-wider">Identitas Guru</span>
                            <span className="text-xs text-white font-medium truncate block">{user.name}</span>
                        </div>
                        <div className="p-3 bg-slate-800/50 rounded-xl border border-white/5">
                            <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1 tracking-wider">NIP (Verified)</span>
                            <span className="text-xs text-indigo-400 font-mono font-bold block">{user.nip}</span>
                        </div>
                    </div>

                    <div className="flex bg-slate-800/50 p-1 rounded-xl border border-white/5">
                        {(['Izin', 'Sakit', 'Dinas'] as const).map((type) => (
                            <button
                                key={type}
                                onClick={() => setLeaveType(type)}
                                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${leaveType === type ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                {type}
                            </button>
                        ))}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5 px-1">
                               <CalendarIcon size={12}/> Tgl Mulai
                            </label>
                            <input 
                                type="date" 
                                value={leaveStartDate}
                                onChange={(e) => {
                                    setLeaveStartDate(e.target.value);
                                    setErrors(prev => ({...prev, leaveStartDate: "", leaveEndDate: ""}));
                                }}
                                className={`w-full p-4 bg-slate-800 border rounded-xl text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500/50 ${errors.leaveStartDate ? 'border-red-500' : 'border-slate-700'}`} 
                            />
                            <ErrorMsg name="leaveStartDate" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5 px-1">
                               <CalendarIcon size={12}/> Tgl Selesai
                            </label>
                            <input 
                                type="date" 
                                value={leaveEndDate}
                                onChange={(e) => {
                                    setLeaveEndDate(e.target.value);
                                    setErrors(prev => ({...prev, leaveEndDate: ""}));
                                }}
                                className={`w-full p-4 bg-slate-800 border rounded-xl text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500/50 ${errors.leaveEndDate ? 'border-red-500' : 'border-slate-700'}`} 
                            />
                            <ErrorMsg name="leaveEndDate" />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider px-1">Keterangan / Alasan</label>
                        <textarea 
                            value={leaveReason}
                            onChange={(e) => {
                                setLeaveReason(e.target.value);
                                if (e.target.value.trim().length >= 10) {
                                    setErrors(prev => ({...prev, leaveReason: ""}));
                                }
                            }}
                            placeholder="Tuliskan detail pengajuan izin..."
                            className={`w-full p-4 bg-slate-800/50 border rounded-xl text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500/50 h-28 resize-none ${errors.leaveReason ? 'border-red-500' : 'border-white/10'}`}
                        />
                        <ErrorMsg name="leaveReason" />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider px-1">Lampiran (Optional)</label>
                        <div 
                            onClick={() => fileInputRef.current?.click()}
                            className={`w-full border-2 border-dashed rounded-2xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-white/5 transition-all group ${errors.attachment ? 'border-red-500' : 'border-white/10'}`}
                        >
                            {leaveAttachment ? (
                                <div className="relative w-full aspect-video rounded-xl overflow-hidden">
                                    <img src={leaveAttachment || undefined} alt="Attachment" className="w-full h-full object-cover" />
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); setLeaveAttachment(null); }}
                                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full shadow-lg"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div className="p-3 bg-slate-800 rounded-full text-slate-500 group-hover:text-indigo-400 transition-colors">
                                        <ImageIcon size={24} />
                                    </div>
                                    <span className="text-[10px] text-slate-500 font-medium">Klik untuk pilih foto dari galeri</span>
                                </>
                            )}
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                className="hidden" 
                                accept="image/*" 
                                onChange={handleFileUpload}
                            />
                        </div>
                        <ErrorMsg name="attachment" />
                    </div>

                    <button 
                        onClick={handleSubmitLeave}
                        disabled={isSubmittingLeave}
                        className={`w-full py-5 text-white font-bold rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 ${isSubmittingLeave ? 'bg-slate-700 cursor-not-allowed opacity-60' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20 active:scale-[0.98]'}`}
                    >
                        {isSubmittingLeave ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Check size={20} />
                        )}
                        {isSubmittingLeave ? 'Mengirim...' : 'Kirim Pengajuan'}
                    </button>
                </div>
            </div>
        </div>
      )}

      {showRekapModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center px-4 py-6 overflow-y-auto">
            <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md" onClick={() => setShowRekapModal(false)} />
            <div className="relative w-full max-w-md bg-slate-900 rounded-[2rem] p-6 border border-white/10 shadow-2xl animate-in zoom-in duration-300 my-auto">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-medium text-white flex items-center gap-3">
                        <div className="p-2 bg-amber-500 rounded-lg"><FileText size={20} className="text-white"/></div>
                        Rekap Harian
                    </h3>
                    <button onClick={() => setShowRekapModal(false)} className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white"><X size={20}/></button>
                </div>

                <div className="space-y-6">
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                        {isLoadingRekap ? (
                            <div className="flex flex-col items-center justify-center py-10 gap-3">
                                <div className="w-8 h-8 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
                                <p className="text-slate-400 text-sm">Mengambil data rekap...</p>
                            </div>
                        ) : rekapData.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 gap-3">
                                <div className="p-4 bg-slate-800 rounded-full text-slate-500">
                                    <FileText size={32} />
                                </div>
                                <p className="text-slate-400 text-sm">Belum ada data absensi hari ini.</p>
                            </div>
                        ) : (
                            rekapData.map((item, i) => (
                                <div key={i} className="p-5 bg-slate-800/40 rounded-[2rem] border border-white/5 space-y-4 relative overflow-hidden group">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500/40" />
                                    <div className="flex justify-between items-start">
                                        <div className="pl-1">
                                            <h5 className="text-sm font-medium text-white leading-tight">{item.name}</h5>
                                            <p className="text-[10px] font-mono text-slate-500 mt-1 uppercase tracking-wider">NIP: {item.nip}</p>
                                        </div>
                                        <span className={`text-[9px] font-medium px-3 py-1 rounded-full ${item.status === 'HADIR' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'}`}>
                                            {item.status}
                                        </span>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-2 p-4 bg-slate-950/50 rounded-2xl border border-white/5">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-500">
                                                <Clock size={16} />
                                            </div>
                                            <div>
                                                <span className="text-[8px] text-slate-500 uppercase font-medium block tracking-widest">Masuk</span>
                                                <span className="text-sm text-white font-mono font-medium">{item.timeIn}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 border-l border-white/5 pl-4">
                                            <div className="p-2.5 bg-indigo-500/10 rounded-xl text-indigo-500">
                                                <Clock size={16} />
                                            </div>
                                            <div>
                                                <span className="text-[8px] text-slate-500 uppercase font-medium block tracking-widest">Pulang</span>
                                                <span className="text-sm text-white font-mono font-medium">{item.timeOut}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <button 
                        onClick={() => setShowRekapModal(false)}
                        className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-2xl transition-all shadow-lg active:scale-95"
                    >
                        Tutup
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default Home;
