import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import LandingHero from "./components/LandingHero";
import StudentDashboard from "./components/StudentDashboard";
import AdminDashboard from "./components/AdminDashboard";
import UpiPaymentModal from "./components/UpiPaymentModal";
import { User, Internship, Enrollment, EmailLog, PlatformStats, Certificate } from "./types";
import { 
  Terminal, 
  ShieldCheck, 
  Briefcase, 
  CheckCircle2, 
  UserPlus, 
  Key, 
  Activity, 
  AlertCircle,
  Copy,
  FolderLock
} from "lucide-react";

export default function App() {
  // Authentication & Configuration State
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem("deltaclause_jwt_token"));
  const [activeTab, setActiveTab] = useState<string>("explore");

  // Core Platform catalogs and transaction matrices
  const [internships, setInternships] = useState<Internship[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [platformStats, setPlatformStats] = useState<PlatformStats>({
    totalStudents: 0,
    totalEnrollments: 0,
    pendingEnrollments: 0,
    totalEarnings: 0,
    certificateCount: 0
  });
  const [referralsLimit, setReferralsLimit] = useState<number>(3);

  // Modal displays toggle triggers
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authTab, setAuthTab] = useState<"login" | "register">("login");
  const [checkoutTarget, setCheckoutTarget] = useState<Internship | null>(null);

  // Authentication Input fields
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regReferral, setRegReferral] = useState("");

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState("");

  // Bootstrap data on mount
  useEffect(() => {
    fetchInternships();
    fetchConfigReferrals();
    
    if (token) {
      validateSession();
    }
  }, [token]);

  // If user state is loaded, load subsequent logs based on authorization depth
  useEffect(() => {
    if (user) {
      if (user.role === "admin") {
        fetchAdminData();
      } else {
        fetchStudentData();
      }
    }
  }, [user]);

  const validateSession = async () => {
    try {
      const res = await fetch("/api/auth/me", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        logout();
      }
    } catch {
      logout();
    }
  };

  const logout = () => {
    localStorage.removeItem("deltaclause_jwt_token");
    setToken(null);
    setUser(null);
    setEnrollments([]);
    setEmailLogs([]);
    setActiveTab("explore");
  };

  const fetchConfigReferrals = async () => {
    try {
      const res = await fetch("/api/config/referrals");
      if (res.ok) {
        const data = await res.json();
        setReferralsLimit(data.referralsNeededForRefund);
      }
    } catch (err) {
      console.error("Could not fetch referrals boundary config.", err);
    }
  };

  const fetchInternships = async () => {
    try {
      const res = await fetch("/api/internships");
      if (res.ok) {
        const list = await res.json();
        setInternships(list);
      }
    } catch (err) {
      console.error("Error retrieving programs catalog.", err);
    }
  };

  const fetchStudentData = async () => {
    try {
      const res = await fetch("/api/enrollments/my", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const list = await res.json();
        setEnrollments(list);
      }
    } catch {
      console.error("Failed to query student registers.");
    }
  };

  const fetchAdminData = async () => {
    try {
      // Parallelize admin statistics pulls
      const [enrollRes, emailsRes, statsRes] = await Promise.all([
        fetch("/api/admin/enrollments", { headers: { "Authorization": `Bearer ${token}` } }),
        fetch("/api/admin/emails-sent", { headers: { "Authorization": `Bearer ${token}` } }),
        fetch("/api/admin/stats", { headers: { "Authorization": `Bearer ${token}` } })
      ]);

      if (enrollRes.ok) {
        const list = await enrollRes.json();
        setEnrollments(list);
      }
      if (emailsRes.ok) {
        const logs = await emailsRes.json();
        setEmailLogs(logs);
      }
      if (statsRes.ok) {
        const s = await statsRes.json();
        setPlatformStats(s);
      }
    } catch {
      console.error("Platform logs extraction failure.");
    }
  };

  // AUTH HANDLERS
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthSuccess("");

    if (!regName.trim() || !regEmail.trim() || !regPhone.trim() || !regPassword.trim()) {
      setAuthError("All standard registration fields are mandatory.");
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: regName,
          email: regEmail,
          phone: regPhone,
          password: regPassword,
          referralCode: regReferral
        })
      });

      const data = await res.json();
      if (res.ok) {
        setAuthSuccess("Account successfully generated! Portal token initiated.");
        localStorage.setItem("deltaclause_jwt_token", data.accessToken);
        setToken(data.accessToken);
        setUser(data.user);
        
        // Reset Inputs
        setRegName("");
        setRegEmail("");
        setRegPhone("");
        setRegPassword("");
        setRegReferral("");
        
        setTimeout(() => {
          setAuthModalOpen(false);
          setActiveTab("student-dashboard");
        }, 1000);
      } else {
        setAuthError(data.error || "Register failed. Validate property fields.");
      }
    } catch {
      setAuthError("Auth transmission cut off. Please retry.");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthSuccess("");

    if (!loginEmail.trim() || !loginPassword.trim()) {
      setAuthError("Please input verified credentials.");
      return;
    }

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });

      const data = await res.json();
      if (res.ok) {
        setAuthSuccess("Authentication granted! Securing portal nodes...");
        localStorage.setItem("deltaclause_jwt_token", data.accessToken);
        setToken(data.accessToken);
        setUser(data.user);

        // Reset inputs
        setLoginEmail("");
        setLoginPassword("");

        setTimeout(() => {
          setAuthModalOpen(false);
          if (data.user.role === "admin") {
            setActiveTab("admin-dashboard");
          } else {
            setActiveTab("student-dashboard");
          }
        }, 1000);
      } else {
        setAuthError(data.error || "Access Denied. If admin evaluation is intended: admin/admin@deltaclause.com pass 'deltaclause_admin_hash' OR rahulguptaendless@gmail.com pass 'rahul123'.");
      }
    } catch {
      setAuthError("Auth transmission cut off. Please retry.");
    }
  };

  // PORTAL TRIGGERS AND ACTIONS
  const handleOpenCheckout = (internship: Internship) => {
    if (!user) {
      setAuthTab("login");
      setAuthModalOpen(true);
      setAuthError("Please log in or register to initiate secure UPI payment checkout vectors.");
      return;
    }
    setCheckoutTarget(internship);
  };

  // Performs public certificate lookup registry checking
  const handlePublicCertificateVerify = async (id: string): Promise<Certificate | null> => {
    try {
      const res = await fetch(`/api/certificates/verify/${id}`);
      if (res.ok) {
        const data = await res.json();
        return data.certificate;
      }
    } catch (err) {
      console.error(err);
    }
    return null;
  };

  // Submit UPI checkout proof
  const handleCheckoutSubmission = async (data: {
    internshipId: string;
    paymentTxId: string;
    paymentScreenshot: string;
    referralCodeUsed?: string;
    isPointsUsed: boolean;
  }) => {
    const res = await fetch("/api/enrollments/apply", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || "Checkout validation failed.");
    }

    // Refresh profile count & stats if points were deducted
    validateSession();
    fetchStudentData();
    return res.json();
  };

  // Student: task milestone deliverable upload
  const handleStudentSubmitTask = async (
    enrollId: string,
    taskId: string,
    submittedText: string,
    submissionUrl: string
  ) => {
    const res = await fetch(`/api/enrollments/${enrollId}/submit-task`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ taskId, submittedText, submissionUrl })
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || "Error transmitting repository target.");
    }

    fetchStudentData();
    return res.json();
  };

  // ADMIN ACTION HANDLERS
  const handleAdminVerifyPayment = async (enrollmentId: string, action: "approve" | "reject") => {
    const res = await fetch(`/api/admin/enrollments/${enrollmentId}/verify-payment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ action })
    });

    if (res.ok) {
      fetchAdminData();
    }
  };

  const handleAdminReviewTask = async (
    enrollmentId: string,
    taskId: string,
    status: "approved" | "needs_work",
    feedback: string
  ) => {
    const res = await fetch(`/api/admin/enrollments/${enrollmentId}/review-task`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ taskId, status, feedback })
    });

    if (res.ok) {
      fetchAdminData();
    }
  };

  const handleAdminCreateInternship = async (data: Partial<Internship>) => {
    const res = await fetch("/api/internships", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });

    if (res.ok) {
      fetchInternships();
      fetchAdminData();
    }
  };

  const handleAdminUpdateInternship = async (id: string, data: Partial<Internship>) => {
    const res = await fetch(`/api/internships/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });

    if (res.ok) {
      fetchInternships();
      fetchAdminData();
    }
  };

  const handleAdminDeleteInternship = async (id: string) => {
    const res = await fetch(`/api/internships/${id}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (res.ok) {
      fetchInternships();
      fetchAdminData();
    }
  };

  const handleAdminUpdateReferralLimit = async (limit: number) => {
    const res = await fetch("/api/config/referrals", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ referralsNeededForRefund: limit })
    });

    if (res.ok) {
      fetchConfigReferrals();
    }
  };

  return (
    <div className="bg-slate-50 text-slate-800 min-h-screen font-sans flex flex-col justify-between selection:bg-indigo-600 selection:text-white">
      {/* Master Top Navigation bar */}
      <Navbar
        user={user}
        onLogout={logout}
        onOpenAuth={() => {
          setAuthError("");
          setAuthSuccess("");
          setAuthTab("login");
          setAuthModalOpen(true);
        }}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Container Stage */}
      <main className="flex-grow max-w-7xl w-full mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {activeTab === "explore" && (
          <LandingHero
            internships={internships}
            onApply={handleOpenCheckout}
            onVerify={handlePublicCertificateVerify}
            userEmail={user?.email}
          />
        )}

        {activeTab === "verify" && (
          <div className="max-w-xl mx-auto py-12">
            <LandingHero
              internships={[]}
              onApply={() => {}}
              onVerify={handlePublicCertificateVerify}
            />
          </div>
        )}

        {activeTab === "student-dashboard" && user && (
          <StudentDashboard
            user={user}
            enrollments={enrollments}
            referralsNeeded={referralsLimit}
            onSubmitTask={handleStudentSubmitTask}
            onRefreshEnrollments={fetchStudentData}
          />
        )}

        {activeTab === "admin-dashboard" && user && user.role === "admin" && (
          <AdminDashboard
            internships={internships}
            enrollments={enrollments}
            emailLogs={emailLogs}
            stats={platformStats}
            onVerifyPayment={handleAdminVerifyPayment}
            onReviewTask={handleAdminReviewTask}
            onCreateInternship={handleAdminCreateInternship}
            onUpdateInternship={handleAdminUpdateInternship}
            onDeleteInternship={handleAdminDeleteInternship}
            onUpdateReferralLimit={handleAdminUpdateReferralLimit}
            referralsLimit={referralsLimit}
          />
        )}
      </main>

      {/* FOOTER BAR */}
      <footer className="border-t border-slate-200 bg-white py-8 text-xs text-slate-500 font-sans" id="site-footer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="space-y-1">
            <span className="font-bold text-slate-900">Deltaclause Inc.</span>
            <p>Monolithic Project Training Pipeline © 2026. All Rights Reserved.</p>
          </div>

          <div className="flex flex-wrap gap-4 text-slate-400">
            <a href="#trainings-catalog" className="hover:text-indigo-600 transition" onClick={() => setActiveTab("explore")}>Trainings</a>
            <a href="#certificate-v-section" className="hover:text-indigo-600 transition" onClick={() => setActiveTab("explore")}>Verifications</a>
            <span>•</span>
            <p className="font-mono text-[10px] text-slate-400">HTTPS Secure Node Integration</p>
          </div>
        </div>
      </footer>

      {/* AUTH MODAL DIALOG DRAWER */}
      {authModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" id="auth-modal-overlay">
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-scale-up text-slate-800">
            
            {/* Tab Swappers */}
            <div className="flex border-b border-slate-100 pb-3 justify-between items-center">
              <div className="flex space-x-4">
                <button
                  onClick={() => {
                    setAuthTab("login");
                    setAuthError("");
                  }}
                  className={`pb-1 text-sm font-bold border-b-2 transition ${
                    authTab === "login" ? "text-indigo-600 border-indigo-600" : "text-slate-400 border-transparent hover:text-slate-600"
                  }`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    setAuthTab("register");
                    setAuthError("");
                  }}
                  className={`pb-1 text-sm font-bold border-b-2 transition ${
                    authTab === "register" ? "text-indigo-600 border-indigo-600" : "text-slate-400 border-transparent hover:text-slate-600"
                  }`}
                >
                  Generate Account
                </button>
              </div>

              <button
                onClick={() => setAuthModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition rounded p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Error Indicators */}
            {authError && (
              <div className="mt-4 rounded-lg bg-rose-50 border border-rose-100 p-2.5 text-rose-600 text-xs flex items-start space-x-2 animate-fade-in" id="auth-error-block">
                <AlertCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                <span>{authError}</span>
              </div>
            )}

            {authSuccess && (
              <div className="mt-4 rounded-lg bg-emerald-50 border border-emerald-100 p-2.5 text-emerald-600 text-xs flex items-start space-x-2 animate-fade-in" id="auth-success-block">
                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-500" />
                <span>{authSuccess}</span>
              </div>
            )}

            {/* LOGIN INPUTS */}
            {authTab === "login" && (
              <form onSubmit={handleLogin} className="mt-4 space-y-4 text-xs font-sans">
                <div className="space-y-1">
                  <label className="text-slate-600 block font-semibold">Verify Work Email</label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full rounded border border-slate-200 bg-slate-50 p-2.5 text-slate-900 placeholder-slate-400 outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between">
                    <label className="text-slate-600 font-semibold block">Password</label>
                    <span className="text-[10px] text-slate-400 select-none">Mock verification system active</span>
                  </div>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full rounded border border-slate-200 bg-slate-50 p-2.5 text-slate-900 placeholder-slate-400 outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 text-xs transition active:scale-95"
                  id="btn-login-submit"
                >
                  Verify Access Clearance
                </button>

                {/* Quick Dev Admin autofill credentials trigger */}
                <div className="rounded bg-slate-50 p-3 border border-slate-150 flex justify-between items-center mt-2">
                  <div className="space-y-0.5">
                    <span className="text-[9px] uppercase font-mono tracking-wider font-bold text-slate-400 block">Fast Admin Review Access</span>
                    <span className="font-mono text-[10px] text-indigo-600 block">rahulguptaendless@gmail.com</span>
                    <span className="font-mono text-[10px] text-slate-500 block">Password: rahul123</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setLoginEmail("rahulguptaendless@gmail.com");
                      setLoginPassword("rahul123");
                      setAuthError("");
                    }}
                    className="rounded bg-white border border-slate-200 hover:bg-slate-50 px-2 py-1 text-[9px] font-mono text-slate-600 transition"
                  >
                    Load Credentials
                  </button>
                </div>
              </form>
            )}

            {/* REGISTER INPUTS */}
            {authTab === "register" && (
              <form onSubmit={handleRegister} className="mt-4 space-y-4 text-xs font-sans">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-slate-600 block font-semibold">Human Name</label>
                    <input
                      type="text"
                      placeholder="Aarav Sharma"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      className="w-full rounded border border-slate-200 bg-slate-50 p-2.5 text-slate-900 placeholder-slate-400 outline-none focus:border-indigo-500"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-600 block font-semibold">Phone Number</label>
                    <input
                      type="text"
                      placeholder="9876543210"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      className="w-full rounded border border-slate-200 bg-slate-50 p-2.5 text-slate-900 placeholder-slate-400 outline-none focus:border-indigo-500"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-600 block font-semibold">Corporate Email</label>
                  <input
                    type="email"
                    placeholder="you@domain.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full rounded border border-slate-200 bg-slate-50 p-2.5 text-slate-900 placeholder-slate-400 outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-600 block font-semibold">Secret Key Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full rounded border border-slate-200 bg-slate-50 p-2.5 text-slate-900 placeholder-slate-400 outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                {/* Referral input block */}
                <div className="space-y-1.5 border-t border-slate-100 pt-3">
                  <div className="flex justify-between items-center">
                    <label className="text-slate-600 font-semibold block">Referral coupon (Optional)</label>
                    <span className="text-[9px] text-indigo-600 font-bold block">Unlocks 150 points instantly!</span>
                  </div>
                  <input
                    type="text"
                    placeholder="Enter friend's email address or phone"
                    value={regReferral}
                    onChange={(e) => setRegReferral(e.target.value)}
                    className="w-full rounded border border-slate-200 bg-slate-50 p-2 text-slate-900 placeholder-slate-400 outline-none focus:border-indigo-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 text-xs transition active:scale-95"
                  id="btn-register-submit"
                >
                  Generate Developer Identity
                </button>
              </form>
            )}

          </div>
        </div>
      )}

      {/* UPI CHECKOUT MODAL COVER */}
      {checkoutTarget && user && (
        <UpiPaymentModal
          internship={checkoutTarget}
          user={user}
          onClose={() => setCheckoutTarget(null)}
          onSubmitEnrollment={handleCheckoutSubmission}
        />
      )}
    </div>
  );
}

// Custom Close icon representation
function X({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  );
}
