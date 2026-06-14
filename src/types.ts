export interface TaskSheetItem {
  id: string;
  title: string;
  description: string;
  deadlineDays: number;
}

export interface Internship {
  id: string;
  name: string;
  detail: string;
  price: number;
  duration: string;
  domains: string[];
  taskSheets: TaskSheetItem[];
}

export interface User {
  email: string;
  name: string;
  phone: string;
  role: "student" | "admin";
  rewardPoints: number;
  referredBy: string | null;
  referralCount: number;
  refundEligible: boolean;
}

export interface UserTaskSubmission {
  taskId: string;
  taskTitle: string;
  submittedText: string;
  submissionUrl: string;
  submittedAt: string;
  status: "pending" | "approved" | "needs_work";
  feedback?: string;
}

export interface Enrollment {
  id: string;
  userEmail: string;
  userName: string;
  userPhone: string;
  internshipId: string;
  internshipName: string;
  duration: string;
  pricePaid: number;
  paymentTxId: string;
  paymentScreenshot?: string;
  status: "pending" | "approved" | "rejected";
  enrolledAt: string;
  approvedAt?: string;
  referralCodeUsed?: string;
  tasks: UserTaskSubmission[];
  certificateId?: string;
}

export interface Certificate {
  id: string;
  studentName: string;
  studentEmail: string;
  internshipId: string;
  internshipName: string;
  duration: string;
  issuedAt: string;
  digitalSignature: string;
}

export interface EmailLog {
  id: string;
  to: string;
  subject: string;
  body: string;
  attachmentName?: string;
  sentAt: string;
}

export interface PlatformStats {
  totalStudents: number;
  totalEnrollments: number;
  pendingEnrollments: number;
  totalEarnings: number;
  certificateCount: number;
}
