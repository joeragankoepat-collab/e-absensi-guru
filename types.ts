
export interface User {
  id: string;
  name: string;
  nip: string;
  role: 'Guru';
  avatar: string;
  school: string;
  employmentStatus: string;
}

export type AttendanceStatus = 'present' | 'absent' | 'sick' | 'permission' | 'teaching';

export interface DailyAttendance {
  id: string;
  name: string;
  nip: string;
  timeIn: string | null;
  timeOut: string | null;
  status: 'HADIR' | 'IZIN' | 'SAKIT' | 'BELUM HADIR';
}

export interface TeachingActivity {
  id: string;
  name: string;
  subject: string;
  className: string;
  timeRange: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}
