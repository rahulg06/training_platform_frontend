import React, { useState } from "react";
import { Internship, Certificate } from "../types";
import { 
  Award, 
  BookOpen, 
  Clock, 
  Search, 
  CheckCircle, 
  ShieldCheck, 
  Share2, 
  ArrowRight, 
  Coins, 
  Check, 
  ChevronRight,
  Info
} from "lucide-react";

interface LandingHeroProps {
  internships: Internship[];
  onApply: (internship: Internship) => void;
  onVerify: (id: string) => Promise<Certificate | null>;
  userEmail?: string;
}

export default function LandingHero({
  internships,
  onApply,
  onVerify,
  userEmail,
}: LandingHeroProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [certSearchId, setCertSearchId] = useState("");
  const [certResult, setCertResult] = useState<Certificate | null>(null);
  const [certError, setCertError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState<string>("All Domains");

  // Get unique list of domains
  const allDomains = ["All Domains", ...Array.from(new Set(internships.flatMap(i => i.domains)))];

  // Filters internships based on domain and search term
  const filteredInternships = internships.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.detail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDomain = selectedDomain === "All Domains" || item.domains.includes(selectedDomain);
    return matchesSearch && matchesDomain;
  });

  const handleCertificateVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!certSearchId.trim()) return;

    setIsVerifying(true);
    setCertError("");
    setCertResult(null);

    try {
      const res = await onVerify(certSearchId.trim());
      if (res) {
        setCertResult(res);
      } else {
        setCertError("Verification Failed. The entered Certificate ID was not found registered within our Deltaclause cryptographical database.");
      }
    } catch {
      setCertError("Unexpected response. Please confirm connection structure and retry.");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="space-y-16 py-8" id="landing-hero-container text-slate-800">
      {/* Visual Hero Intro Block */}
      <section className="relative overflow-hidden text-center max-w-5xl mx-auto px-4 sm:px-6">
        {/* Glow Background effect */}
        <div className="absolute -top-12 left-1/2 -z-10 h-72 w-72 -translate-x-1/2 rounded-full bg-indigo-500/10 blur-[90px]" />
        
        <div className="inline-flex items-center space-x-2 rounded-full border border-indigo-200 bg-indigo-50 px-3.5 py-1 text-xs font-semibold text-indigo-700 font-mono mb-6">
          <ShieldCheck className="h-4 w-4 text-indigo-600" />
          <span>Verified Skill Credentials Platform</span>
        </div>

        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-6xl max-w-4xl mx-auto leading-none">
          Deploy Your Career Code with <span className="bg-gradient-to-r from-indigo-650 to-indigo-500 bg-clip-text text-transparent">Deltaclause</span>
        </h1>
        
        <p className="mt-6 text-lg text-slate-600 max-w-2xl mx-auto font-sans leading-relaxed">
          Master production-ready web platforms and pipelines on your own timeline. Complete modular industry task sheets, receive custom team grading, and unlock verifiable digital credentials.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <a
            href="#trainings-catalog"
            className="rounded-xl bg-indigo-600 hover:bg-indigo-700 px-6 py-3.5 text-sm font-bold text-white transition active:scale-95 shadow-lg shadow-indigo-100 flex items-center space-x-2"
          >
            <span>Browse Field Programs</span>
            <ArrowRight className="h-4 w-4" />
          </a>
          <a
            href="#certificate-v-section"
            className="rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 hover:border-slate-300 hover:text-indigo-600 transition active:scale-95 shadow-sm"
          >
            Verify Credential ID
          </a>
        </div>
      </section>

      {/* Grid Features overview */}
      <section className="grid gap-6 md:grid-cols-3 max-w-7xl mx-auto px-4" id="features">
        <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm hover:shadow-md transition duration-300">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 mb-4 border border-purple-100">
            <BookOpen className="h-5 w-5" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Task Sheet Blueprint</h3>
          <p className="mt-2 text-sm text-slate-500 font-sans leading-relaxed">
            Get exact, step-by-step enterprise task lists for configuring architectures. Implement code on your own schedule with open-internet access.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm hover:shadow-md transition duration-300">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 mb-4 border border-indigo-100">
            <CheckCircle className="h-5 w-5" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Manual Team Grading</h3>
          <p className="mt-2 text-sm text-slate-500 font-sans leading-relaxed">
            Submit task URLs. Our seasoned staff reviews your files line-by-line, providing written feedback or requesting revisions to mirror true developer PR reviews.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm hover:shadow-md transition duration-300">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600 mb-4 border border-teal-100">
            <Award className="h-5 w-5" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Verifiable Credentials</h3>
          <p className="mt-2 text-sm text-slate-500 font-sans leading-relaxed">
            Every issued certificate carries a custom unique ID key. Anyone can crossvalidate the recipient name, domain, and signature parameters live on our home routing nodes.
          </p>
        </div>
      </section>

      {/* Public Certificate Verification Tool Section */}
      <section id="certificate-v-section" className="max-w-4xl mx-auto px-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 relative shadow-sm">
          <div className="absolute right-6 top-6 opacity-5 hidden sm:block">
            <Award className="h-28 w-28 text-indigo-600" />
          </div>

          <div className="max-w-xl">
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 flex items-center space-x-2">
              <ShieldCheck className="h-6 w-6 text-indigo-600" />
              <span>Deltaclause Validations Center</span>
            </h2>
            <p className="mt-2 text-sm text-slate-500 font-sans">
              Enter a certificate ID below to query our unified registry system. Instantly audits student name, validation hash, and internship metrics.
            </p>
          </div>

          <form onSubmit={handleCertificateVerify} className="mt-6 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-grow">
              <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Ex: DC-INT-10254"
                value={certSearchId}
                onChange={(e) => setCertSearchId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-550 font-mono transition"
                id="cert-verify-input"
              />
            </div>
            <button
              type="submit"
              disabled={isVerifying}
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-3 text-sm transition disabled:opacity-50 active:scale-95 whitespace-nowrap"
              id="btn-verify-submit"
            >
              {isVerifying ? "Verifying..." : "Query Registry"}
            </button>
          </form>

          {/* Verification Results Panel */}
          {certResult && (
            <div className="mt-6 rounded-2xl border border-indigo-100 bg-indigo-50/40 p-5 animate-fade-in" id="certificate-result-success">
              <div className="flex items-start space-x-3.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
                  <Check className="h-5 w-5" />
                </div>
                <div className="space-y-3 flex-grow text-slate-800">
                  <div>
                    <span className="text-[10px] uppercase tracking-widest text-indigo-700 font-mono font-bold block">
                      Status: Cryptographically Verified
                    </span>
                    <h4 className="text-lg font-bold text-slate-950 mt-1">
                      {certResult.studentName}
                    </h4>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs font-sans text-slate-700">
                    <div>
                      <span className="text-slate-400 block">Domain / Internship</span>
                      <span className="font-semibold text-slate-900">{certResult.internshipName}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Duration Completed</span>
                      <span className="font-semibold text-slate-900">{certResult.duration} Program</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Issued Official Date</span>
                      <span className="font-semibold text-slate-900">
                        {new Date(certResult.issuedAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Unique ID Node</span>
                      <span className="font-mono text-indigo-700 font-semibold">{certResult.id}</span>
                    </div>
                  </div>

                  <div className="border-t border-indigo-100 pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="text-[10px] font-mono text-slate-400">
                      Signature Code: <span className="text-slate-600">{certResult.digitalSignature}</span>
                    </div>
                    <div className="inline-flex items-center space-x-1 justify-end">
                      <ShieldCheck className="h-4 w-4 text-indigo-600" />
                      <span className="text-[10px] font-semibold text-slate-500">Secure Deltaclause Sign Key</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {certError && (
            <div className="mt-6 rounded-xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-600 flex items-start space-x-2 animate-fade-in" id="certificate-result-error">
              <Info className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
              <span>{certError}</span>
            </div>
          )}
        </div>
      </section>

      {/* Referrals & Refund Dynamic Showcase */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 shadow-sm">
          <div className="absolute top-0 right-0 p-8 text-7xl opacity-5">🪙</div>
          <div className="grid gap-8 lg:grid-cols-2 items-start">
            <div className="space-y-4">
              <div className="inline-flex items-center space-x-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 border border-indigo-100">
                <Coins className="h-3.5 w-3.5" />
                <span>100% Refund Referral Campaign</span>
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 leading-tight">
                Get Certified, Code for <span className="text-indigo-600">Free</span>
              </h2>
              <p className="text-sm text-slate-500 font-sans leading-relaxed">
                We believe exceptional developers pull others up. Every registered student gets a personal referral link representing their email or phone number.
              </p>
              
              <ul className="space-y-3.5 text-xs text-slate-600 font-sans" id="referral-bullets">
                <li className="flex items-center space-x-2.5">
                  <div className="h-4 w-4 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-105">
                    <Check className="h-3 w-3" />
                  </div>
                  <span>Friends register with your code & get <strong>150 reward points instantly</strong>.</span>
                </li>
                <li className="flex items-center space-x-2.5">
                  <div className="h-4 w-4 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-105">
                    <Check className="h-3 w-3" />
                  </div>
                  <span>You get <strong>500 reward points (500 INR value)</strong> when their payments are verified.</span>
                </li>
                <li className="flex items-center space-x-2.5">
                  <div className="h-4 w-4 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-105">
                    <Check className="h-3 w-3" />
                  </div>
                  <span>If <strong>3 persons</strong> enroll with your referral code, you qualify for a <strong>Full Fee Refund</strong>!</span>
                </li>
              </ul>
            </div>

            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 space-y-4 min-w-0">
              <span className="text-[10px] uppercase font-mono tracking-widest text-slate-400 font-bold block">Live Simulator Panel</span>
              <div className="space-y-3.5">
                <div className="flex flex-col gap-2 border-b border-slate-100 pb-3 text-sm text-slate-800">
                  <span className="font-semibold">Your Referral Coupon</span>
                  <div className="font-mono text-indigo-600 font-bold bg-white px-2.5 py-1 rounded-lg border border-slate-200 text-xs break-all max-w-full">
                    {userEmail || "Not Logged In"}
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-650 font-medium">
                  <span>Referred Students Enrolled</span>
                  <span className="font-bold text-slate-850">0 / 3 (Required)</span>
                </div>
                {/* Visual Referral progress tracker */}
                <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-600 rounded-full transition" style={{ width: "2%" }}></div>
                </div>
                <p className="text-[11px] text-slate-400 italic font-mono leading-normal">
                  *Configurable on Dashboard. Rewards reduce upcoming domain checkout amounts at checkout!
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Domain Catalog Page List Section */}
      <section id="trainings-catalog" className="max-w-7xl mx-auto px-4 mt-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-slate-200 pb-6 gap-4">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Selected Industry Training Catalog
            </h2>
            <p className="mt-1 text-sm text-slate-500 font-sans">
              Choose your module block, complete the hands-on project sheets, and graduate with certified status.
            </p>
          </div>

          <div className="flex items-center space-x-2 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Filter by keyword..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-indigo-500 transition"
              id="catalog-search"
            />
          </div>
        </div>

        {/* Domain Filter Buttons */}
        <div className="flex flex-wrap gap-2.5 mt-6" id="domain-filters">
          {allDomains.map((domain) => (
            <button
              key={domain}
              onClick={() => setSelectedDomain(domain)}
              className={`px-4 py-2 text-xs font-bold rounded-xl border transition ${
                selectedDomain === domain
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                  : "bg-white text-slate-600 border-slate-200 hover:text-slate-900 hover:border-slate-300"
              }`}
            >
              {domain}
            </button>
          ))}
        </div>

        {/* Dynamic Card Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mt-8" id="catalog-grid">
          {filteredInternships.map((item) => (
            <div
              key={item.id}
              className="rounded-3xl border border-slate-200 bg-white flex flex-col justify-between overflow-hidden group hover:border-slate-300 hover:shadow-md transition duration-300"
              id={`intern-card-${item.id}`}
            >
              <div className="p-6 space-y-4">
                {/* Header domains and duration */}
                <div className="flex items-center justify-between">
                  {/* Domain tag */}
                  <span className="inline-flex items-center rounded-lg bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-500 border border-slate-100">
                    {item.domains[0]}
                  </span>

                  {/* Duration tracker */}
                  <span className="text-xs text-slate-550 flex items-center space-x-1 font-mono font-medium">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    <span>{item.duration}</span>
                  </span>
                </div>

                <h3 className="text-lg font-extrabold text-slate-900 group-hover:text-indigo-600 transition leading-snug">
                  {item.name}
                </h3>

                <p className="text-sm text-slate-500 font-sans leading-relaxed">
                  {item.detail}
                </p>

                {/* Task Checklist Indicator */}
                <div className="border-t border-slate-100 pt-4 space-y-2">
                  <span className="text-xs font-bold text-slate-450 uppercase tracking-wider font-mono">
                    Task Milestone Sheets:
                  </span>
                  <div className="space-y-1.5">
                    {item.taskSheets.map((task, idx) => (
                      <div key={task.id} className="flex items-center text-xs text-slate-500 space-x-1.5">
                        <ChevronRight className="h-3 w-3 text-indigo-500 shrink-0" />
                        <span className="truncate">{task.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Apply & Pricing Block */}
              <div className="border-t border-slate-100 bg-slate-50/50 px-6 py-4 flex items-center justify-between">
                <div className="font-mono">
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-bold">Investment</span>
                  <span className="text-xl font-extrabold text-slate-900">₹{item.price}</span>
                </div>

                <button
                  onClick={() => onApply(item)}
                  className="rounded-xl bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white border border-indigo-100/60 px-4 py-2 text-xs font-extrabold transition active:scale-95 shadow-sm"
                >
                  Apply & Enroll
                </button>
              </div>
            </div>
          ))}

          {filteredInternships.length === 0 && (
            <div className="col-span-full rounded-2xl border border-dashed border-slate-200 p-12 text-center text-slate-400">
              No matching programs or industry trainings found. Filter your search terms.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
