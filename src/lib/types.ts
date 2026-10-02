export type UserRole = 'ADMIN' | 'WARDEN' | 'STUDENT';

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  studentId?: string;
  avatar?: string;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  isActive?: boolean;
}

export interface BedWithStudent {
  id: string;
  bedNumber: string;
  roomId: string;
  isOccupied: boolean;
  student?: {
    id: string;
    studentId: string;
    fullName: string;
    phone: string;
    joiningDate: string;
    monthlyFee: number;
    status: string;
    latestPaymentStatus?: 'PAID' | 'PENDING' | 'PARTIALLY_PAID' | 'OVERDUE';
  } | null;
}

export interface RoomWithBeds {
  id: string;
  roomNumber: string;
  floor: number;
  totalBeds: number;
  roomType: string;
  amenities: string;
  notes?: string | null;
  occupiedCount: number;
  availableCount: number;
  beds: BedWithStudent[];
}

export interface StudentListItem {
  id: string;
  studentId: string;
  fullName: string;
  phone: string;
  email?: string | null;
  parentName: string;
  parentPhone: string;
  collegeName: string;
  course: string;
  year: string;
  roomNumber?: string | null;
  roomId?: string | null;
  bedNumber?: string | null;
  bedId?: string | null;
  joiningDate: string;
  leavingDate?: string | null;
  address: string;
  emergencyContact: string;
  profilePhoto?: string | null;
  status: 'ACTIVE' | 'NOTICE_PERIOD' | 'LEFT';
  monthlyFee: number;
  securityDeposit: number;
  latestPayment?: {
    month: string;
    amount: number;
    status: 'PAID' | 'PENDING' | 'PARTIALLY_PAID' | 'OVERDUE';
    dueDate: string;
  } | null;
}

export interface PaymentItem {
  id: string;
  studentId: string;
  studentName: string;
  studentCode: string;
  roomNumber: string;
  bedNumber: string;
  month: string;
  monthIndex: number;
  year: number;
  amount: number;
  amountPaid: number;
  dueDate: string;
  paymentDate?: string | null;
  status: 'PAID' | 'PENDING' | 'PARTIALLY_PAID' | 'OVERDUE';
  paymentMethod?: 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'OTHER' | null;
  transactionId?: string | null;
  remarks?: string | null;
  receipt?: {
    id: string;
    fileUrl: string;
    fileName: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    paymentDate: string;
  } | null;
}

export interface ComplaintItem {
  id: string;
  studentId?: string | null;
  studentName: string;
  roomNumber: string;
  title: string;
  description: string;
  category: 'FAN' | 'LIGHT' | 'WATER' | 'BED' | 'BATHROOM' | 'WIFI' | 'OTHER';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  resolutionNotes?: string | null;
  createdAt: string;
  resolvedAt?: string | null;
}

export interface AnnouncementItem {
  id: string;
  title: string;
  content: string;
  category: 'FEE' | 'MAINTENANCE' | 'HOLIDAY' | 'EVENT' | 'RULE' | 'GENERAL';
  priority: 'NORMAL' | 'IMPORTANT' | 'URGENT';
  isActive: boolean;
  postedBy: string;
  createdAt: string;
}

export interface VisitorItem {
  id: string;
  visitorName: string;
  phone: string;
  studentId?: string | null;
  studentName: string;
  roomNumber: string;
  visitDate: string;
  entryTime: string;
  exitTime?: string | null;
  purpose: string;
}

export interface ExpenseItem {
  id: string;
  title: string;
  category: 'ELECTRICITY' | 'WATER' | 'FOOD' | 'MAINTENANCE' | 'INTERNET' | 'CLEANING' | 'SALARIES' | 'OTHER';
  amount: number;
  date: string;
  description?: string | null;
  recordedBy: string;
}

export interface MealMenuItem {
  id: string;
  dayOfWeek: string;
  breakfast: string;
  lunch: string;
  snacks: string;
  dinner: string;
  isSpecialDay: boolean;
  notes?: string | null;
}

export interface HostelSettingItem {
  id: string;
  hostelName: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
  defaultMonthlyFee: number;
  feeDueDay: number;
  currency: string;
  upiId: string;
  bankAccount: string;
  rulesText: string;
}
