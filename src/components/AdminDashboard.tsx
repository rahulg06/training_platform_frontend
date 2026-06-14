import React, { useState, useEffect } from "react";
import { Internship, Enrollment, EmailLog, PlatformStats, TaskSheetItem } from "../types";
import { 
  Users, 
  Award, 
  DollarSign, 
  Check, 
  X, 
  Trash2, 
  Edit, 
  Plus, 
  ChevronRight, 
  Mail, 
  Clock, 
  Settings,
  CloudLightning,
  ExternalLink,
  BookOpen
} from "lucide-react";

interface AdminDashboardProps {
  internships: Internship[];
  enrollments: Enrollment[];
  emailLogs: EmailLog[];
  stats: PlatformStats;
  onVerifyPayment: (enrollmentId: string, action: "approve" | "reject") => Promise<any>;
  onReviewTask: (enrollmentId: string, taskId: string, status: "approved" | "needs_work", feedback: string) => Promise<any>;
  onCreateInternship: (data: Partial<Internship>) => Promise<any>;
  onUpdateInternship: (id: string, data: Partial<Internship>) => Promise<any>;
  onDeleteInternship: (id: string) => Promise<any>;
  onUpdateReferralLimit: (limit: number) => Promise<any>;
  referralsLimit: number;
}

export default function AdminDashboard({
  internships,
  enrollments,
  emailLogs,
  stats,
  onVerifyPayment,
  onReviewTask,
  onCreateInternship,
  onUpdateInternship,
  onDeleteInternship,
  onUpdateReferralLimit,
  referralsLimit,
}: AdminDashboardProps) {
  const [activeSubTab, setActiveSubTab] = useState<"payments" | "tasks" | "courses" | "config" | "emails">("payments");
  
  // States for Internship Form
  const [isEditingCourse, setIsEditingCourse] = useState<boolean>(false);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [courseName, setCourseName] = useState("");
  const [courseDetail, setCourseDetail] = useState("");
  const [coursePrice, setCoursePrice] = useState<number>(1999);
  const [courseDuration, setCourseDuration] = useState("4 Weeks");
  const [courseDomain, setCourseDomain] = useState("Web Development");
  const [courseTasks, setCourseTasks] = useState<Partial<TaskSheetItem>[]>([
    { title: "Task 1: Setup Architecture Node", description: "Design foundational project structure.", deadlineDays: 7 }
  ]);

  // States for grading
  const [gradingEnrollId, setGradingEnrollId] = useState<string | null>(null);
  const [gradingTaskId, setGradingTaskId] = useState<string | null>(null);
  const [gradingFeedback, setGradingFeedback] = useState("");
  const [gradingActionDone, setGradingActionDone] = useState("");

  // States for config
  const [refThreshold, setRefThreshold] = useState<number>(referralsLimit);

  useEffect(() => {
    setRefThreshold(referralsLimit);
  }, [referralsLimit]);

  // Filters pending payments
  const pendingPayments = enrollments.filter(e => e.status === "pending");

  // Filters pending tasks inside approved enrollments
  const pendingTasks: { enrollment: Enrollment; task: any }[] = [];
  enrollments.forEach(enroll => {
    if (enroll.status === "approved") {
      enroll.tasks.forEach(task => {
        if (task.status === "pending" && task.submittedAt) {
          pendingTasks.push({ enrollment: enroll, task });
        }
      });
    }
  });

  const handleAddFormTask = () => {
    setCourseTasks([...courseTasks, { 
      title: `Task ${courseTasks.length + 1}: `, 
      description: "", 
      deadlineDays: 7 
    }]);
  };

  const handleRemoveFormTask = (idx: number) => {
    setCourseTasks(courseTasks.filter((_, i) => i !== idx));
  };

  const handleTaskFieldChange = (idx: number, field: keyof TaskSheetItem, val: any) => {
    const updated = [...courseTasks];
    updated[idx] = { ...updated[idx], [field]: val };
    setCourseTasks(updated);
  };

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseName.trim() || !courseDetail.trim()) return;

    const payload = {
      name: courseName.trim(),
      detail: courseDetail.trim(),
      price: Number(coursePrice),
      duration: courseDuration,
      domains: [courseDomain],
      taskSheets: courseTasks as TaskSheetItem[]
    };

    try {
      if (editingCourseId) {
        await onUpdateInternship(editingCourseId, payload);
      } else {
        await onCreateInternship(payload);
      }
      // Reset
      setIsEditingCourse(false);
      setEditingCourseId(null);
      setCourseName("");
      setCourseDetail("");
      setCourseTasks([{ title: "Task 1: Setup Architecture Node", description: "", deadlineDays: 7 }]);
    } catch (err) {
      alert("Error saving program config.");
    }
  };

  const handleStartEditCourse = (item: Internship) => {
    setEditingCourseId(item.id);
    setCourseName(item.name);
    setCourseDetail(item.detail);
    setCoursePrice(item.price);
    setCourseDuration(item.duration);
    setCourseDomain(item.domains[0] || "General Training");
    setCourseTasks(item.taskSheets);
    setIsEditingCourse(true);
  };

  const handleStartCreateCourse = () => {
    setEditingCourseId(null);
    setCourseName("");
    setCourseDetail("");
    setCoursePrice(1999);
    setCourseDuration("4 Weeks");
    setCourseDomain("Web Development");
    setCourseTasks([
      { title: "Task 1: Responsive Layout Deployment", description: "Deliver responsive layout styles.", deadlineDays: 7 },
      { title: "Task 2: Database Operations Setup", description: "Design structural database indexing.", deadlineDays: 14 }
    ]);
    setIsEditingCourse(true);
  };

  const handleReviewAction = async (enrollId: string, taskId: string, action: "approved" | "needs_work") => {
    try {
      await onReviewTask(enrollId, taskId, action, gradingFeedback);
      setGradingEnrollId(null);
      setGradingTaskId(null);
      setGradingFeedback("");
      setGradingActionDone(`Task marked as ${action} successfully!`);
      setTimeout(() => setGradingActionDone(""), 3000);
    } catch {
      alert("Error filing grading sheets.");
    }
  };

  const handleSaveConfigLimit = async () => {
    try {
      await onUpdateReferralLimit(refThreshold);
      alert("Referral program threshold updated successfully on server database.");
    } catch {
      alert("Failed to sync new limits.");
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4" id="admin-workspace">
      {/* Dynamic Statistics widgets */}
      <section className="grid gap-5 grid-cols-2 lg:grid-cols-4 animate-fade-in" id="stats-grid">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm font-sans">
          <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider font-mono">Earnings</span>
          <span className="text-2xl font-black mt-1 block text-slate-900">₹{stats.totalEarnings}</span>
          <div className="text-[10px] text-slate-500 mt-2.5 flex items-center bg-slate-50 border border-slate-100 rounded-lg p-1 px-1.5 font-mono">
            <DollarSign className="h-3 w-3 text-emerald-500 mr-1" />
            <span>Aggregate Net Payments</span>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm font-sans">
          <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider font-mono">Pending Reviews</span>
          <span className="text-2xl font-black mt-1 block text-amber-650">{pendingPayments.length} Enrolls</span>
          <div className="text-[10px] text-slate-505 mt-2.5 flex items-center bg-amber-50 border border-amber-100/50 rounded-lg p-1 px-1.5 font-mono">
            <Clock className="h-3 w-3 text-amber-500 mr-1" />
            <span>UPI Screenshot Queues</span>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm font-sans">
          <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider font-mono">Tasks Queued</span>
          <span className="text-2xl font-black mt-1 block text-indigo-700">{pendingTasks.length} Projects</span>
          <div className="text-[10px] text-slate-505 mt-2.5 flex items-center bg-indigo-50 border border-indigo-100 rounded-lg p-1 px-1.5 font-mono">
            <BookOpen className="h-3 w-3 text-indigo-500 mr-1" />
            <span>Submitted Tasks Pipeline</span>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm font-sans">
          <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider font-mono">Credentials Issued</span>
          <span className="text-2xl font-black mt-1 block text-emerald-600">{stats.certificateCount} Verified</span>
          <div className="text-[10px] text-zinc-502 mt-2.5 flex items-center bg-emerald-50 border border-emerald-100 rounded-lg p-1 px-1.5 font-mono">
            <Award className="h-3 w-3 text-emerald-500 mr-1" />
            <span>Digital Certificates Synced</span>
          </div>
        </div>
      </section>

      {/* Navigation Subtabs */}
      <section className="border-b border-slate-200 pb-px flex overflow-x-auto gap-4 scrollbar-none">
        <button
          onClick={() => setActiveSubTab("payments")}
          className={`pb-3 text-sm font-bold border-b-2 whitespace-nowrap transition cursor-pointer flex items-center space-x-1.5 ${
            activeSubTab === "payments" ? "text-indigo-600 border-indigo-600" : "text-slate-400 border-transparent hover:text-slate-650"
          }`}
        >
          <span>Payment reviews</span>
          {pendingPayments.length > 0 && (
            <span className="bg-amber-100 text-amber-700 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
              {pendingPayments.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab("tasks")}
          className={`pb-3 text-sm font-bold border-b-2 whitespace-nowrap transition cursor-pointer flex items-center space-x-1.5 ${
            activeSubTab === "tasks" ? "text-indigo-600 border-indigo-600" : "text-slate-400 border-transparent hover:text-slate-650"
          }`}
        >
          <span>Project Submissions</span>
          {pendingTasks.length > 0 && (
            <span className="bg-indigo-100 text-indigo-705 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
              {pendingTasks.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab("courses")}
          className={`pb-3 text-sm font-bold border-b-2 whitespace-nowrap transition cursor-pointer flex items-center space-x-1.5 ${
            activeSubTab === "courses" ? "text-indigo-600 border-indigo-600" : "text-slate-400 border-transparent hover:text-slate-650"
          }`}
        >
          <span>Trainings Editor</span>
        </button>

        <button
          onClick={() => setActiveSubTab("config")}
          className={`pb-3 text-sm font-bold border-b-2 whitespace-nowrap transition cursor-pointer flex items-center space-x-1.5 ${
            activeSubTab === "config" ? "text-indigo-600 border-indigo-600" : "text-slate-400 border-transparent hover:text-slate-650"
          }`}
        >
          <span>Campaign Settings</span>
        </button>

        <button
          onClick={() => setActiveSubTab("emails")}
          className={`pb-3 text-sm font-bold border-b-2 whitespace-nowrap transition cursor-pointer flex items-center space-x-1.5 ${
            activeSubTab === "emails" ? "text-indigo-600 border-indigo-600" : "text-slate-400 border-transparent hover:text-slate-650"
          }`}
        >
          <span>SFTP / Outbox Logs</span>
        </button>
      </section>

      {/* Selected Action Panel */}
      <section className="bg-white/50 rounded-3xl" id="admin-detail-stage">
        
        {/* TAB 1: UPI PAYMENT REVIEWS */}
        {activeSubTab === "payments" && (
          <div className="space-y-6">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-slate-900">Manual UPI Payment Review Queue</h3>
                <p className="text-xs text-slate-400 font-sans mt-0.5 font-medium">Verify credentials and confirm enrollment requests safely.</p>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {pendingPayments.map((p) => (
                <div key={p.id} className="rounded-3xl border border-slate-200 bg-white p-5 flex flex-col lg:flex-row justify-between items-start gap-5 shadow-sm">
                  <div className="space-y-3.5 flex-grow">
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-mono bg-indigo-50 border border-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-lg font-bold">
                        {p.internshipName.split(" (")[0]}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 font-bold">Tx: {p.id}</span>
                    </div>

                    <div className="grid sm:grid-cols-3 gap-4 text-xs font-sans text-slate-600">
                      <div>
                        <span className="text-slate-400 font-bold block text-[10px] uppercase font-mono mb-1">Student Identity</span>
                        <span className="font-bold text-slate-900">{p.userName}</span>
                        <span className="text-slate-500 text-[11px] block">{p.userEmail}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-bold block text-[10px] uppercase font-mono mb-1">Transaction Reference ID</span>
                        <span className="font-mono text-indigo-650 font-bold text-sm bg-indigo-50/50 px-2 py-0.5 border border-indigo-100/50 rounded-lg">{p.paymentTxId}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-bold block text-[10px] uppercase font-mono mb-1">Paid Amount (INR)</span>
                        <span className="font-extrabold text-slate-900 text-sm">₹{p.pricePaid}</span>
                        {p.referralCodeUsed && (
                          <span className="text-[10px] text-amber-600 font-mono block font-bold">Code: {p.referralCodeUsed}</span>
                        )}
                      </div>
                    </div>

                    {/* UPI SCREENSHOT PREVIEW BASE64 */}
                    {p.paymentScreenshot && (
                      <div className="space-y-2">
                        <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-bold block">UPI Proof Screenshot</span>
                        <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-200 max-w-sm overflow-hidden flex items-center justify-center">
                          {p.paymentScreenshot.startsWith("data:image") ? (
                            <img 
                              src={p.paymentScreenshot} 
                              alt="UPI Screenshot Proof" 
                              className="max-h-52 object-contain rounded-xl border border-slate-200"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="text-xs text-slate-500 font-mono italic p-4 text-center bg-white rounded-xl border border-slate-200 w-full">
                              📄 {p.paymentScreenshot || "Custom PDF document metadata received"}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex sm:flex-col gap-2 w-full lg:w-auto shrink-0 justify-end">
                    <button
                      onClick={() => onVerifyPayment(p.id, "approve")}
                      className="flex-grow sm:flex-none inline-flex items-center justify-center space-x-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2.5 text-xs transition active:scale-95 shadow-sm"
                    >
                      <Check className="h-4 w-4" />
                      <span>Approve & Dispatch</span>
                    </button>
                    <button
                      onClick={() => onVerifyPayment(p.id, "reject")}
                      className="flex-grow sm:flex-none inline-flex items-center justify-center space-x-1.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50 text-slate-600 hover:text-slate-800 px-4 py-2.5 text-xs transition active:scale-95 shadow-sm font-semibold"
                    >
                      <X className="h-4 w-4" />
                      <span>Decline</span>
                    </button>
                  </div>
                </div>
              ))}

              {pendingPayments.length === 0 && (
                <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center text-slate-400 text-sm font-sans shadow-sm">
                  The manual UPI payment screenshot review inbox is empty. Excellent work!
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: TASKS GRADING WORKSPACE */}
        {activeSubTab === "tasks" && (
          <div className="space-y-6">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">Manual Project Grading Hub</h3>
              <p className="text-xs text-slate-400 font-sans mt-0.5 font-medium">Examine pull request URLs and file formal digital evaluation feedback.</p>
            </div>

            <div className="p-6 space-y-4">
              {gradingActionDone && (
                <div className="rounded-2xl bg-indigo-55 bg-indigo-50 text-indigo-750 font-sans border border-indigo-150 p-4 text-xs font-bold">
                  {gradingActionDone}
                </div>
              )}

              {pendingTasks.map(({ enrollment, task }) => (
                <div key={`${enrollment.id}-${task.taskId}`} className="rounded-3xl border border-slate-200 bg-white p-5 space-y-4 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-2.5 gap-2">
                    <div>
                      <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">Student Submission</span>
                      <h4 className="text-sm font-bold text-slate-900 mt-0.5">{enrollment.userName} ({enrollment.userEmail})</h4>
                    </div>
                    <div className="text-[10px] font-mono text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100 font-bold">
                      {enrollment.internshipName.split(" (")[0]}
                    </div>
                  </div>

                  <div className="space-y-3.5 text-xs font-sans">
                    <div>
                      <span className="text-slate-400 block uppercase text-[9px] tracking-wider font-mono font-bold">Assigned Milestones</span>
                      <p className="font-bold text-slate-900 mt-0.5">{task.taskTitle}</p>
                    </div>

                    {task.submittedText && (
                      <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-150 italic text-slate-650 font-medium">
                        " {task.submittedText} "
                      </div>
                    )}

                    <div className="flex items-center text-xs">
                      <span className="text-slate-400 shrink-0 uppercase text-[9px] tracking-wider font-mono font-bold mr-2">Deliverables Code:</span>
                      <a 
                        href={task.submissionUrl} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="inline-flex items-center space-x-1 font-mono text-indigo-600 hover:text-indigo-700 hover:underline font-bold bg-indigo-50/50 border border-indigo-100/50 px-2.5 py-1 rounded-lg"
                      >
                        <span>Examine Repository Files</span>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>

                    {/* Live Grading interface */}
                    <div className="border-t border-slate-100 pt-4 space-y-3">
                      <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-bold block">Grading & Review Comments</span>
                      
                      {gradingEnrollId === enrollment.id && gradingTaskId === task.taskId ? (
                        <div className="space-y-3">
                          <textarea
                            rows={2}
                            placeholder="Write comprehensive developer review comments or point out refactoring bugs..."
                            value={gradingFeedback}
                            onChange={(e) => setGradingFeedback(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-900 placeholder-slate-450 outline-none focus:border-indigo-500 font-sans"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleReviewAction(enrollment.id, task.taskId, "approved")}
                              className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 text-xs transition active:scale-95 shadow-sm cursor-pointer"
                            >
                              Sign Off & Recalculate Modules
                            </button>
                            <button
                              onClick={() => handleReviewAction(enrollment.id, task.taskId, "needs_work")}
                              className="rounded-xl border border-slate-200 bg-slate-50 text-slate-600 font-bold px-4 py-2 text-xs transition hover:text-slate-800 shadow-sm cursor-pointer"
                            >
                              Request Code Revision
                            </button>
                            <button
                              onClick={() => {
                                setGradingEnrollId(null);
                                setGradingTaskId(null);
                              }}
                              className="text-xs text-slate-400 hover:text-slate-600 px-2 font-bold cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setGradingEnrollId(enrollment.id);
                            setGradingTaskId(task.taskId);
                            setGradingFeedback("Phenomenal file handling! The architecture matches enterprise standards correctly.");
                          }}
                          className="rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-150 px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-850 transition shadow-sm cursor-pointer"
                        >
                          Assess Pull Request
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {pendingTasks.length === 0 && (
                <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center text-slate-400 text-sm font-sans shadow-sm">
                  No active student code submissions require grading. All clear!
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: COURSE CRUD CATALOG CREATOR */}
        {activeSubTab === "courses" && (
          <div className="space-y-6">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-slate-900">Active Training Catalog Admin</h3>
                <p className="text-xs text-slate-400 font-sans mt-0.5 font-medium">Configure, update, or remove active domain training templates.</p>
              </div>

              {!isEditingCourse && (
                <button
                  type="button"
                  onClick={handleStartCreateCourse}
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-xs font-bold text-white transition active:scale-95 flex items-center space-x-1.5 shadow-sm cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create Program</span>
                </button>
              )}
            </div>

            <div className="p-6 space-y-6">
              {/* INTERNSHIP CRUD FORM (Overlay simulator) */}
              {isEditingCourse && (
                <form onSubmit={handleSaveCourse} className="rounded-3xl border border-slate-200 bg-white p-6 space-y-5 shadow-sm animate-fade-in">
                  <span className="text-[10px] uppercase font-mono tracking-widest font-bold text-indigo-705 block border-b border-slate-100 pb-2">
                    {editingCourseId ? `Update Course Config: ${editingCourseId}` : "Configure New Industry Training"}
                  </span>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5 text-xs">
                      <label className="text-slate-650 font-bold block">Program Title</label>
                      <input
                        type="text"
                        placeholder="Ex: Cyber Security Architecture & Penetration testing"
                        value={courseName}
                        onChange={(e) => setCourseName(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-900 placeholder-slate-400 outline-none focus:border-indigo-500 font-sans"
                        required
                      />
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <label className="text-slate-650 font-bold block">Primary Domain</label>
                      <select
                        value={courseDomain}
                        onChange={(e) => setCourseDomain(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-900 outline-none focus:border-indigo-500 font-bold"
                      >
                        <option value="Web Development">Web Development</option>
                        <option value="Data Science">Data Science</option>
                        <option value="DevOps & Cloud">DevOps & Cloud</option>
                        <option value="Cyber Security">Cyber Security</option>
                        <option value="Java Development">Java Development</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <label className="text-slate-650 font-bold block">Domain Overview / Curriculum Outline</label>
                    <textarea
                      rows={2}
                      placeholder="Discuss container registries, system isolation, relational SQL triggers..."
                      value={courseDetail}
                      onChange={(e) => setCourseDetail(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-900 placeholder-slate-400 outline-none focus:border-indigo-500 font-sans"
                      required
                    />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5 text-xs">
                      <label className="text-slate-650 font-bold block">Price (INR)</label>
                      <input
                        type="number"
                        placeholder="1999"
                        value={coursePrice}
                        onChange={(e) => setCoursePrice(Number(e.target.value))}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-900 placeholder-slate-400 outline-none focus:border-indigo-500 font-mono"
                        required
                      />
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <label className="text-slate-650 font-bold block">Duration Timeframe</label>
                      <select
                        value={courseDuration}
                        onChange={(e) => setCourseDuration(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-900 focus:border-indigo-505 font-bold outline-none"
                      >
                        <option value="4 Weeks">4 Weeks Program</option>
                        <option value="8 Weeks">8 Weeks Program</option>
                        <option value="12 Weeks">12 Weeks Program</option>
                      </select>
                    </div>
                  </div>

                  {/* Task sheet row editor */}
                  <div className="space-y-3.5 border-t border-slate-100 pt-4">
                    <div className="flex justify-between items-center text-xs pb-1">
                      <label className="text-slate-500 font-bold uppercase tracking-wider block">Task Milestone list</label>
                      <button
                        type="button"
                        onClick={handleAddFormTask}
                        className="bg-indigo-50 hover:bg-indigo-100 border border-indigo-150 text-[10px] text-indigo-700 px-2.5 py-1 rounded-lg font-bold transition cursor-pointer"
                      >
                        Add Task Milestone Row
                      </button>
                    </div>

                    <div className="space-y-3">
                      {courseTasks.map((t, idx) => (
                        <div key={idx} className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 space-y-2.5 relative">
                          <button
                            type="button"
                            onClick={() => handleRemoveFormTask(idx)}
                            className="absolute right-3 top-3 text-rose-500 hover:text-rose-605"
                            title="Remove Task"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>

                          <div className="grid sm:grid-cols-4 gap-3">
                            <div className="sm:col-span-3 text-xs space-y-1">
                              <span className="text-[10px] text-slate-400 font-bold font-mono">Milestone Title {idx + 1}</span>
                              <input
                                type="text"
                                placeholder="Task Title, Ex: Task 1: Responsive Grid Setup"
                                value={t.title || ""}
                                onChange={(e) => handleTaskFieldChange(idx, "title", e.target.value)}
                                className="w-full bg-white border border-slate-200 p-2 rounded-xl text-xs text-slate-900 outline-none focus:border-indigo-400"
                                required
                              />
                            </div>
                            <div className="text-xs space-y-1">
                              <span className="text-[10px] text-slate-400 font-bold font-mono">Target Days</span>
                              <input
                                type="number"
                                placeholder="7"
                                value={t.deadlineDays || 7}
                                onChange={(e) => handleTaskFieldChange(idx, "deadlineDays", Number(e.target.value))}
                                className="w-full bg-white border border-slate-200 p-2 rounded-xl text-xs text-slate-900 outline-none focus:border-indigo-400 text-center font-mono"
                                required
                              />
                            </div>
                          </div>

                          <div className="text-xs space-y-1">
                            <span className="text-[10px] text-slate-400 font-bold font-mono">Task Instructions description</span>
                            <textarea
                              rows={2}
                              placeholder="Write key code steps expected for valid deployment evaluations..."
                              value={t.description || ""}
                              onChange={(e) => handleTaskFieldChange(idx, "description", e.target.value)}
                              className="w-full bg-white border border-slate-200 p-2 rounded-xl text-xs text-slate-900 outline-none focus:border-indigo-405 font-sans"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 text-xs transition active:scale-95 shadow-sm cursor-pointer"
                    >
                      Save Configuration
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingCourse(false);
                        setEditingCourseId(null);
                      }}
                      className="rounded-xl border border-slate-200 bg-slate-50 text-slate-650 hover:text-slate-800 px-4 py-2 text-xs transition shadow-sm font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {/* Course templates listing grid with delete action */}
              <div className="grid gap-4 sm:grid-cols-2" id="admin-courses-listing">
                {internships.map((course) => (
                  <div key={course.id} className="rounded-3xl border border-slate-200 bg-white p-5 space-y-3 flex flex-col justify-between shadow-sm">
                    <div>
                      <div className="flex justify-between items-start">
                        <span className="text-[9px] font-mono text-indigo-700 bg-indigo-50 border border-indigo-100/50 px-2 py-0.5 rounded font-bold uppercase">{course.domains[0]}</span>
                        <span className="text-xs font-extrabold text-slate-900 font-mono">₹{course.price}</span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 mt-1.5 leading-snug">{course.name}</h4>
                      <p className="text-xs text-slate-500 font-sans mt-1.5 leading-relaxed line-clamp-3">
                        {course.detail}
                      </p>
                    </div>

                    <div className="border-t border-slate-100 pt-3 flex justify-between items-center mt-3">
                      <span className="text-[10px] text-slate-400 font-bold font-mono">{course.taskSheets.length} Milestones</span>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleStartEditCourse(course)}
                          className="bg-slate-50 hover:bg-slate-100 border border-slate-200 p-1.5 rounded-lg text-slate-450 hover:text-indigo-600 transition"
                          title="Edit Program"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm("Are you absolutely sure you want to delete this course template?")) {
                              onDeleteInternship(course.id);
                            }
                          }}
                          className="bg-rose-50 hover:bg-rose-100 border border-rose-150 p-1.5 rounded-lg text-rose-500 hover:text-rose-600 transition"
                          title="Delete Template"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: CONFIG REGISTRY/REFERRALS SETUP */}
        {activeSubTab === "config" && (
          <div className="space-y-6">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">Advanced Platform Settings</h3>
              <p className="text-xs text-slate-400 font-sans mt-0.5 font-medium font-semibold">Edit active rules, refund threshold boundaries, and pricing limits.</p>
            </div>

            <div className="p-6 max-w-lg space-y-6">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 space-y-4 shadow-sm">
                <div className="flex items-center space-x-2 border-b border-slate-100 pb-2.5">
                  <Settings className="h-4 w-4 text-indigo-650" />
                  <span className="text-sm font-bold text-slate-900">Referral Discount Ledger rule</span>
                </div>

                <div className="space-y-2 text-xs">
                  <label className="text-slate-650 font-bold block">
                    Referrals Requested to unlock 100% Fee Refund
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={15}
                    value={refThreshold}
                    onChange={(e) => setRefThreshold(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-900 font-mono font-bold outline-none focus:border-indigo-400"
                  />
                  <p className="text-[11px] text-slate-500 leading-relaxed font-sans pt-1 font-medium">
                    When a student successfully recruits this number of peers who also submit approved UPI payments, their ledger allows them to claim a full fee refund coupon!
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleSaveConfigLimit}
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 text-xs font-bold transition shadow-sm cursor-pointer"
                >
                  Save Limit Config
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: AUTOMATED MAIL & SFTP TRACKER */}
        {activeSubTab === "emails" && (
          <div className="space-y-6">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-slate-900">Outbound SFTP PDF Log Monitor</h3>
                <p className="text-xs text-slate-400 font-sans mt-0.5 font-medium">Real-time simulation audit displaying dynamic files triggered via corporate SFTP nodes during student validations.</p>
              </div>
              <div className="text-[10px] font-mono text-slate-400 font-bold italic flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-lg">
                <CloudLightning className="h-3 w-3 text-indigo-600" />
                <span>Monolithic Engine Active</span>
              </div>
            </div>

            <div className="p-6 space-y-4 animate-fade-in" id="outgoing-logs-list">
              {emailLogs.map((log) => (
                <div key={log.id} className="rounded-3xl border border-slate-200 bg-white p-5 space-y-3.5 text-xs shadow-sm">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2.5 text-slate-500">
                    <span className="font-bold text-indigo-700 flex items-center">
                      <Mail className="h-3.5 w-3.5 mr-1.5 text-indigo-600" />
                      Recipient: {log.to}
                    </span>
                    <span className="font-mono text-[10px] text-slate-400 font-bold">
                      {new Date(log.sentAt).toLocaleTimeString()}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-slate-400 block font-bold text-[10px] uppercase font-mono">Subject</span>
                    <p className="font-bold text-slate-900">{log.subject}</p>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-150 font-mono text-slate-650 text-[11px] whitespace-pre-wrap leading-relaxed">
                    {log.body}
                  </div>

                  {log.attachmentName && (
                    <div className="inline-flex items-center space-x-2 rounded-lg bg-indigo-50 border border-indigo-100 px-2.5 py-1 text-[11px] font-bold text-indigo-700">
                      <span>📄 SFTP Material: {log.attachmentName}</span>
                    </div>
                  )}
                </div>
              ))}

              {emailLogs.length === 0 && (
                <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center text-slate-400 text-sm font-sans shadow-sm">
                  No outbound email triggers logged yet. Try verifying a payment screenshot above!
                </div>
              )}
            </div>
          </div>
        )}

      </section>
    </div>
  );
}
