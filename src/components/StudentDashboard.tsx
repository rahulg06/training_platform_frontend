import React, { useState, useEffect } from "react";
import { Enrollment, User } from "../types";
import { 
  Users, 
  Award, 
  TrendingUp, 
  Send, 
  CheckCircle, 
  AlertCircle, 
  ExternalLink, 
  Copy,
  Clock,
  ShieldCheck,
  ChevronRight,
  HelpCircle,
  FileSpreadsheet,
  Download
} from "lucide-react";

interface StudentDashboardProps {
  user: User;
  enrollments: Enrollment[];
  referralsNeeded: number;
  onSubmitTask: (enrollId: string, taskId: string, submittedText: string, submissionUrl: string) => Promise<any>;
  onRefreshEnrollments: () => void;
}

export default function StudentDashboard({
  user,
  enrollments,
  referralsNeeded,
  onSubmitTask,
  onRefreshEnrollments,
}: StudentDashboardProps) {
  const [activeEnrollmentId, setActiveEnrollmentId] = useState<string | null>(null);
  const [submissionUrl, setSubmissionUrl] = useState("");
  const [submissionNotes, setSubmissionNotes] = useState("");
  const [selectedTask, setSelectedTask] = useState<{ id: string; title: string } | null>(null);
  
  const [copySuccess, setCopySuccess] = useState(false);
  const [claimStatus, setClaimStatus] = useState<"none" | "success" | "pending">("none");
  const [submitting, setSubmitting] = useState(false);
  const [errorMess, setErrorMess] = useState("");
  const [successMess, setSuccessMess] = useState("");

  useEffect(() => {
    if (enrollments.length > 0 && !activeEnrollmentId) {
      setActiveEnrollmentId(enrollments[0].id);
    }
  }, [enrollments]);

  const activeEnrollment = enrollments.find(e => e.id === activeEnrollmentId);

  const handleCopyReferral = () => {
    const code = user.email; // Phone number or email acts as referral code
    navigator.clipboard.writeText(code);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleClaimRefund = () => {
    setClaimStatus("pending");
    setTimeout(() => {
      setClaimStatus("success");
    }, 1500);
  };

  const handleTaskFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEnrollmentId || !selectedTask) return;
    if (!submissionUrl.trim()) {
      setErrorMess("A valid Submission or GitHub Project URL is required to evaluate industry-grade assignments.");
      return;
    }

    setSubmitting(true);
    setErrorMess("");
    setSuccessMess("");

    try {
      await onSubmitTask(activeEnrollmentId, selectedTask.id, submissionNotes, submissionUrl);
      setSuccessMess(`Task "${selectedTask.title}" submitted successfully! Deltaclause team has been alerted for manual review.`);
      setSubmissionUrl("");
      setSubmissionNotes("");
      setSelectedTask(null);
      onRefreshEnrollments();
    } catch (err: any) {
      setErrorMess(err.message || "Failed to deliver code file submissions. Please retry.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-3 max-w-7xl mx-auto px-4 text-slate-800" id="student-workspace-grid">
      {/* Student stats and referral widgets */}
      <div className="space-y-6 lg:col-span-1 border-slate-100">
        {/* Profile Card */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 space-y-4 shadow-sm">
          <div>
            <span className="text-[10px] font-mono tracking-widest text-indigo-600 uppercase font-bold">
              Personal Workspace
            </span>
            <h2 className="text-xl font-extrabold text-slate-900 mt-1">{user.name}</h2>
            <p className="text-xs text-slate-500 font-sans mt-0.5">{user.email}</p>
          </div>

          <div className="grid grid-cols-2 gap-3.5 border-t border-slate-100 pt-4 text-xs font-mono">
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              <span className="text-slate-400 block uppercase text-[8px] tracking-wider font-bold">Verified Number</span>
              <span className="text-slate-700 font-bold block mt-0.5">{user.phone}</span>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 font-bold">
              <span className="text-slate-400 block uppercase text-[8px] tracking-wider">Reward Ledger</span>
              <span className="text-indigo-600 font-bold block mt-0.5">🪙 {user.rewardPoints} Pts</span>
            </div>
          </div>
        </div>

        {/* Dynamic Referral Program Tracking Page */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 space-y-5 shadow-sm">
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">Your Referral Engine</h3>
          </div>

          <p className="text-xs text-slate-500 font-sans leading-relaxed">
            Your registered email acts as your unique referral coupon. If a student enrolls using your coupon, they receive a discount and you receive credits!
          </p>

          <div className="space-y-2">
            <label className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-bold block">Your Coupon Code</label>
            <div className="flex rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
              <input
                type="text"
                readOnly
                value={user.email}
                className="w-full bg-transparent px-3 py-2 text-xs font-mono text-slate-705 outline-none select-all"
              />
              <button
                type="button"
                onClick={handleCopyReferral}
                className="bg-slate-200 hover:bg-slate-300 px-3 transition flex items-center justify-center text-slate-600 hover:text-slate-900"
                title="Copy Refer-Code"
              >
                {copySuccess ? "Copied!" : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          {/* Progress to refund metrics */}
          <div className="border-t border-slate-100 pt-4 space-y-3.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 font-sans">Active Referrals Completed</span>
              <span className="font-mono text-indigo-700 font-bold">{user.referralCount} / {referralsNeeded}</span>
            </div>

            {/* Simulated progress tracker */}
            <div className="h-2.5 w-full bg-slate-150 rounded-full border border-slate-200 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-indigo-505 to-indigo-600 rounded-full transition-all duration-500"
                style={{ width: `${Math.min((user.referralCount / referralsNeeded) * 100, 100)}%` }}
              ></div>
            </div>

            {user.referralCount >= referralsNeeded ? (
              <div className="rounded-2xl bg-indigo-50 p-3.5 border border-indigo-100 text-xs text-indigo-750 font-sans space-y-2.5">
                <span className="font-bold flex items-center gap-1 text-indigo-700">
                  🎉 Congratulations! Refund Eligible
                </span>
                <p className="text-[11px] text-slate-600 leading-snug">
                  You have successfully referred {user.referralCount} peers! Click below to request a complete fee refund back to your payment UPI handle.
                </p>
                {claimStatus === "none" && (
                  <button
                    onClick={handleClaimRefund}
                    className="w-full py-2 px-3 rounded-xl text-white bg-indigo-600 hover:bg-indigo-750 font-bold text-center text-xs transition active:scale-95 shadow-sm"
                  >
                    Claim 100% Fee Refund
                  </button>
                )}
                {claimStatus === "pending" && (
                  <div className="text-center font-mono py-1 text-slate-400 animate-pulse text-[11px]">
                    Validating referral chains...
                  </div>
                )}
                {claimStatus === "success" && (
                  <div className="bg-white border border-indigo-100 text-center py-2 rounded-xl text-emerald-600 font-semibold text-[11px] animate-fade-in">
                    Claim request registered! Our ledger is reviewing and refunding your active UPI wallet.
                  </div>
                )}
              </div>
            ) : (
              <div className="text-[11px] text-slate-450 font-sans italic">
                *Refer {referralsNeeded - user.referralCount} more peers to unlock 100% full fee reimbursement.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enrollments checking & code task center */}
      <div className="lg:col-span-2 space-y-6">
        {/* Toggle between multiple enrollments */}
        <div className="flex border-b border-slate-200 pb-px overflow-x-auto gap-4 scrollbar-none" id="student-course-tabs">
          {enrollments.map((en) => (
            <button
              key={en.id}
              onClick={() => {
                setActiveEnrollmentId(en.id);
                setSelectedTask(null);
                setSuccessMess("");
                setErrorMess("");
              }}
              className={`pb-3 text-sm font-bold border-b-2 whitespace-nowrap transition cursor-pointer ${
                activeEnrollmentId === en.id
                  ? "text-indigo-600 border-indigo-600"
                  : "text-slate-400 border-transparent hover:text-slate-600 hover:border-slate-300"
              }`}
            >
              {en.internshipName.split(" (")[0]}
            </button>
          ))}

          {enrollments.length === 0 && (
            <div className="text-slate-400 py-3 text-sm font-sans">
              Currently not enrolled in any programs. Choose a module from the catalog.
            </div>
          )}
        </div>

        {/* Selected Enrollment content block */}
        {activeEnrollment ? (
          <div className="space-y-6" id="dashboard-course-panel">
            {/* Status Header Area */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm animate-fade-in">
              <div>
                <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">Program Contract ID: {activeEnrollment.id}</span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">{activeEnrollment.internshipName}</h3>
                <span className="text-slate-500 text-xs font-sans mt-0.5 block flex items-center">
                  <Clock className="h-3.5 w-3.5 text-slate-400 mr-1.5" />
                  Duration: {activeEnrollment.duration} Program • Enrolled on {new Date(activeEnrollment.enrolledAt).toLocaleDateString()}
                </span>
              </div>

              {/* Verified Status Banner */}
              <div>
                {activeEnrollment.status === "pending" && (
                  <span className="inline-flex items-center space-x-1.5 rounded-full bg-amber-50 border border-amber-100 px-3.5 py-1 text-xs text-amber-700 font-semibold">
                    <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
                    <span>Reviewing UPI Proof</span>
                  </span>
                )}
                {activeEnrollment.status === "approved" && (
                  <span className="inline-flex items-center space-x-1.5 rounded-full bg-indigo-50 border border-indigo-100 px-3.5 py-1 text-xs text-indigo-750 font-bold">
                    <CheckCircle className="h-4 w-4 text-indigo-600" />
                    <span>Payment Verified & Active</span>
                  </span>
                )}
                {activeEnrollment.status === "rejected" && (
                  <span className="inline-flex items-center space-x-1.5 rounded-full bg-rose-50 border border-rose-100 px-3.5 py-1 text-xs text-rose-700 font-bold">
                    <AlertCircle className="h-4 w-4 text-rose-500" />
                    <span>Rejected Payload</span>
                  </span>
                )}
              </div>
            </div>

            {/* Conditional Content depending on payment review status */}
            {activeEnrollment.status === "pending" && (
              <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center space-y-4 font-sans shadow-sm">
                <div className="mx-auto h-12 w-12 rounded-full bg-amber-50 flex items-center justify-center border border-amber-100 text-amber-600">
                  <Clock className="h-6 w-6" />
                </div>
                <div className="max-w-md mx-auto space-y-2">
                  <h4 className="text-base font-bold text-slate-900">Manual Verification in Progress</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    We have received your uploaded UPI transaction ID (<span className="font-mono text-slate-705 font-bold">{activeEnrollment.paymentTxId}</span>).
                    Our administration team is checking the ledger. Once confirmed, your training materials, task milestones, and SFTP pdf kit will be unlocked and emailed to you.
                  </p>
                </div>
              </div>
            )}

            {activeEnrollment.status === "rejected" && (
              <div className="rounded-3xl border border-rose-100 bg-rose-50 p-8 text-center space-y-4 font-sans animate-fade-in shadow-sm">
                <div className="mx-auto h-12 w-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
                  <AlertCircle className="h-6 w-6" />
                </div>
                <div className="max-w-md mx-auto space-y-2">
                  <h4 className="text-base font-bold text-rose-800">Verification Failed</h4>
                  <p className="text-xs text-rose-700 leading-relaxed">
                    Your enrollment request has been declined because we were unable to match the UPI Transaction Reference ID in our banking panel.
                    Please register again with a genuine payment receipt screenshot.
                  </p>
                </div>
              </div>
            )}

            {activeEnrollment.status === "approved" && (
              <div className="space-y-6" id="active-tasks-workspace">
                {/* Visual completion card banner if they graduated */}
                {activeEnrollment.certificateId && (
                  <div className="rounded-3xl border border-indigo-200 bg-indigo-50/50 p-6 flex flex-col sm:flex-row items-center justify-between gap-4 animate-bounce-subtle shadow-sm">
                    <div className="space-y-1 text-center sm:text-left">
                      <span className="text-[10px] font-mono uppercase text-indigo-700 font-bold tracking-widest block">
                        Graduate Credential Awarded
                      </span>
                      <h4 className="text-lg font-extrabold text-slate-950">
                        Deltaclause Certified Developer
                      </h4>
                      <p className="text-xs text-slate-600 font-sans font-medium">
                        Task sheet completed successfully. Credentials synced and secured.
                      </p>
                    </div>

                    <div className="flex flex-col items-center gap-2">
                      <div className="font-mono bg-white text-indigo-700 border border-indigo-150 text-[11px] font-bold px-3 py-1.5 rounded-2xl text-center min-w-[120px] shadow-sm">
                        ID: {activeEnrollment.certificateId}
                      </div>
                      <span className="text-[10px] text-indigo-700 font-bold flex items-center">
                        <ShieldCheck className="h-3 w-3 mr-1 text-indigo-600" /> Verified Status
                      </span>
                    </div>
                  </div>
                )}

                {/* Submissions pipeline index and active evaluation */}
                <div className="grid gap-6 md:grid-cols-5">
                  {/* Task list Column */}
                  <div className="space-y-2 md:col-span-2">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold block mb-1">
                      Task Sheets Schedule
                    </span>
                    <div className="space-y-2.5">
                      {activeEnrollment.tasks.map((task, idx) => {
                        return (
                          <button
                            key={task.taskId}
                            onClick={() => {
                              setSelectedTask({ id: task.taskId, title: task.taskTitle });
                              setSuccessMess("");
                              setErrorMess("");
                            }}
                            className={`w-full p-3.5 rounded-2xl border text-left transition flex items-start space-x-2.5 cursor-pointer shadow-sm ${
                              selectedTask?.id === task.taskId
                                ? "bg-indigo-50/50 border-indigo-200 text-slate-900 font-semibold"
                                : "bg-white border-slate-205 hover:border-slate-300 text-slate-705"
                            }`}
                          >
                            <span className="font-mono text-xs text-slate-400 mt-0.5">{idx + 1}.</span>
                            <div className="flex-grow space-y-1 min-w-0">
                              <span className="text-xs font-bold block truncate leading-tight">
                                {task.taskTitle.split(": ")[1] || task.taskTitle}
                              </span>
                              
                              {/* Status Indicator inside tab item */}
                              {task.status === "pending" && task.submittedAt && (
                                <span className="text-[9px] uppercase font-mono bg-amber-50 border border-amber-100 text-amber-700 font-bold px-1.5 py-0.5 rounded-lg">
                                  Under Review
                                </span>
                              )}
                              {task.status === "approved" && (
                                <span className="text-[9px] uppercase font-mono bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold px-1.5 py-0.5 rounded-lg">
                                  Approved
                                </span>
                              )}
                              {task.status === "needs_work" && (
                                <span className="text-[9px] uppercase font-mono bg-rose-50 border border-rose-100 text-rose-700 font-bold px-1.5 py-0.5 rounded-lg font-bold">
                                  Needs Work
                                </span>
                              )}
                              {task.status === "pending" && !task.submittedAt && (
                                <span className="text-[9px] uppercase font-mono bg-slate-50 text-slate-400 px-1.5 py-0.5 rounded-lg border border-slate-100">
                                  Not Submitted
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Task Sheet Submission workspace Detail Column */}
                  <div className="md:col-span-3 space-y-4">
                    {selectedTask ? (
                      <div className="rounded-3xl border border-slate-205 bg-white p-5 space-y-5 animate-fade-in shadow-sm" id="task-detail-pane">
                        {/* Task Title Header */}
                        <div>
                          <span className="text-[9px] uppercase font-mono text-slate-400 font-bold block">Active Milestone Sheet</span>
                          <h4 className="text-base font-bold text-slate-900 mt-1 leading-snug">{selectedTask.title}</h4>
                        </div>

                        {/* Current Status and Admin feedback block */}
                        {(() => {
                          const matchingTask = activeEnrollment.tasks.find(t => t.taskId === selectedTask.id);
                          if (!matchingTask) return null;

                          return (
                            <div className="space-y-4 text-xs">
                              {/* Status specific notes */}
                              {matchingTask.status === "approved" && (
                                <div className="rounded-2xl bg-indigo-50 border border-indigo-100 p-4 font-sans text-xs space-y-2 text-indigo-750">
                                  <span className="font-bold text-indigo-700 flex items-center">
                                    <CheckCircle className="h-4 w-4 mr-1.5 text-indigo-600" />
                                    Task Approved & Released
                                  </span>
                                  {matchingTask.feedback && (
                                    <p className="italic text-slate-600 bg-white p-3 rounded-xl border border-slate-200 mt-2">
                                      " {matchingTask.feedback} "
                                    </p>
                                  )}
                                  <div className="text-[10px] text-slate-400 font-mono pt-1">
                                    Submitted code verified on {new Date(matchingTask.submittedAt).toLocaleString()}
                                  </div>
                                </div>
                              )}

                              {matchingTask.status === "needs_work" && (
                                <div className="rounded-2xl bg-rose-50 border border-rose-100 p-4 font-sans text-xs space-y-2 text-rose-750">
                                  <span className="font-bold text-rose-700 flex items-center">
                                    <AlertCircle className="h-4 w-4 mr-1.5 text-rose-600" />
                                    Revisions Requested
                                  </span>
                                  {matchingTask.feedback && (
                                    <p className="italic text-rose-800 bg-white p-3 rounded-xl border border-rose-150 mt-2">
                                      " {matchingTask.feedback} "
                                    </p>
                                  )}
                                  <p className="text-[11px] text-slate-400 leading-relaxed font-bold">
                                    Please modify your architecture repository according to the comments above, and file a resubmission.
                                  </p>
                                </div>
                              )}

                              {matchingTask.status === "pending" && matchingTask.submittedAt && (
                                <div className="rounded-2xl bg-slate-50 border border-slate-150 p-4 font-sans text-xs space-y-2 text-slate-600 leading-relaxed">
                                  <span className="font-bold text-amber-600 flex items-center">
                                    <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse mr-1.5"></span>
                                    Pending Admin Sign-off
                                  </span>
                                  <p>
                                    Your project submission is loaded and currently queued in the manual evaluator cycle.
                                  </p>
                                  <div className="text-[10px] text-slate-400 font-mono">
                                    Transaction URL: <a href={matchingTask.submissionUrl} target="_blank" rel="noreferrer" className="text-indigo-600 font-bold underline truncate block">{matchingTask.submissionUrl}</a>
                                  </div>
                                </div>
                              )}

                              {/* Interactive Submission Form */}
                              {(!matchingTask.submittedAt || matchingTask.status === "needs_work") && (
                                <form onSubmit={handleTaskFormSubmit} className="space-y-4">
                                  {errorMess && (
                                    <div className="text-xs text-rose-650 bg-rose-50 border border-rose-100 p-2.5 rounded-xl font-bold">
                                      {errorMess}
                                    </div>
                                  )}

                                  <div className="space-y-1.5 text-xs">
                                    <label className="text-slate-600 font-bold block">
                                      GitHub Repository or Deployment URL
                                    </label>
                                    <input
                                      type="text"
                                      placeholder="https://github.com/yourusername/project-repository"
                                      value={submissionUrl}
                                      onChange={(e) => setSubmissionUrl(e.target.value)}
                                      className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-900 placeholder-slate-400 outline-none focus:border-indigo-500 font-mono"
                                      required
                                    />
                                  </div>

                                  <div className="space-y-1.5 text-xs">
                                    <label className="text-slate-600 font-bold block">
                                      Accomplishments / Implementation Notes (Optional)
                                    </label>
                                    <textarea
                                      rows={3}
                                      placeholder="Explain database filters, Docker layers, or responsive screens implemented..."
                                      value={submissionNotes}
                                      onChange={(e) => setSubmissionNotes(e.target.value)}
                                      className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-900 placeholder-slate-400 outline-none focus:border-indigo-505 font-sans"
                                    />
                                  </div>

                                  <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 text-xs transition active:scale-95 disabled:opacity-50 shadow-sm"
                                  >
                                    {submitting ? "Delivering code packages..." : "Submit Task Milestone"}
                                  </button>
                                </form>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    ) : (
                      <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center text-slate-400 font-sans text-xs shadow-sm">
                        <FileSpreadsheet className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                        Select a task milestone from the schedule menu to view step guidelines, view mentor feedback, or dispatch your code files.
                      </div>
                    )}

                    {successMess && (
                      <div className="rounded-2xl bg-indigo-50 border border-indigo-100 p-4 text-xs text-indigo-750 font-sans font-bold">
                        {successMess}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center text-slate-405 text-sm font-sans shadow-sm">
            Currently no enrolled internships matched your profile account. Select an internship training in the search view catalog.
          </div>
        )}
      </div>
    </div>
  );
}
