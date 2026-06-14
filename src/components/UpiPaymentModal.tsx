import React, { useState } from "react";
import { Internship, User } from "../types";
import { 
  X, 
  Upload, 
  Coins, 
  Info, 
  FileCheck, 
  QrCode, 
  ShieldCheck, 
  AlertCircle 
} from "lucide-react";

interface UpiPaymentModalProps {
  internship: Internship;
  user: User;
  onClose: () => void;
  onSubmitEnrollment: (data: {
    internshipId: string;
    paymentTxId: string;
    paymentScreenshot: string;
    referralCodeUsed?: string;
    isPointsUsed: boolean;
  }) => Promise<any>;
}

export default function UpiPaymentModal({
  internship,
  user,
  onClose,
  onSubmitEnrollment,
}: UpiPaymentModalProps) {
  const [txId, setTxId] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [usePoints, setUsePoints] = useState(false);
  const [screenshotBase64, setScreenshotBase64] = useState("");
  const [screenshotName, setScreenshotName] = useState("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [success, setSuccess] = useState(false);

  // Points conversion: 1 Pt = 1 INR
  const pointsAvailable = user.rewardPoints;
  const maxDiscount = Math.min(pointsAvailable, internship.price);
  const finalPrice = usePoints ? internship.price - maxDiscount : internship.price;

  // File drag-and-drop helper
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setErrorMessage("Screenshot file size is too large (maximum allowed is 2MB for storage performance).");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setScreenshotBase64(reader.result as string);
      setScreenshotName(file.name);
      setErrorMessage("");
    };
    reader.onerror = () => {
      setErrorMessage("Failed to read the file proof. Please retry.");
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setErrorMessage("Screenshot file size is too large (maximum allowed is 2MB for stability).");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setScreenshotBase64(reader.result as string);
      setScreenshotName(file.name);
      setErrorMessage("");
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!txId.trim()) {
      setErrorMessage("UPI Transaction reference number is required.");
      return;
    }

    // Standard 12 digit UPI transaction audit
    if (txId.length < 8) {
      setErrorMessage("Please enter a valid Transaction Ref Number (typically 8 to 12 digits).");
      return;
    }

    if (!screenshotBase64) {
      setErrorMessage("Please upload or drag a screenshot of your UPI payment receipt to proceed.");
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmitEnrollment({
        internshipId: internship.id,
        paymentTxId: txId.trim(),
        paymentScreenshot: screenshotBase64,
        referralCodeUsed: referralCode.trim() || undefined,
        isPointsUsed: usePoints
      });
      setSuccess(true);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error || err.message || "Failed to submit enrollment credentials.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm" id="payment-modal-backdrop">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl animate-scale-up" id="payment-modal-content">
        
        {/* Header and Close */}
        <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
          <div>
            <span className="text-[10px] font-mono uppercase text-zinc-500">Secure UPI Portal</span>
            <h3 className="text-base font-extrabold text-white mt-0.5">Enrollment Payment Review</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-900 hover:text-white transition"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {success ? (
          <div className="py-8 text-center space-y-4 font-sans animate-fade-in" id="payment-success-layout">
            <div className="mx-auto h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-400">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div className="space-y-2">
              <h4 className="text-lg font-bold text-white">Verification Data Logged!</h4>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
                Your UPI proof and transaction token have been delivered successfully to Deltaclause auditors.
              </p>
              <p className="text-xs text-zinc-500">
                You can now monitor enrollment status inside your **Student Portal** tab immediately. Welcome aboard!
              </p>
            </div>
            <button
              onClick={onClose}
              className="mt-4 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 font-bold px-5 py-2 text-xs transition active:scale-95"
            >
              Close Workstation Window
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-3 text-xs">
            {errorMessage && (
              <div className="rounded-lg bg-rose-500/5 border border-rose-500/20 p-2.5 text-rose-400 flex items-start space-x-2 animate-fade-in">
                <AlertCircle className="h-4.5 w-4.5 shrink-0 text-rose-500" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Selected training name & duration */}
            <div className="rounded-lg bg-zinc-900/60 p-3.5 border border-zinc-900 flex justify-between items-center">
              <div>
                <span className="text-[10px] uppercase font-mono text-zinc-500 block">Internship Selected</span>
                <span className="font-bold text-white text-xs">{internship.name.split(" (")[0]}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-mono text-zinc-500 block">Duration</span>
                <span className="font-semibold text-zinc-300 font-mono text-xs">{internship.duration}</span>
              </div>
            </div>

            {/* Reward calculation block */}
            {pointsAvailable > 0 && (
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 flex justify-between items-center">
                <div className="space-y-0.5 flex-grow pr-4">
                  <div className="text-emerald-400 font-bold flex items-center font-mono">
                    <Coins className="h-4 w-4 mr-1" />
                    <span>Redeem Reward Balance</span>
                  </div>
                  <p className="text-[10px] text-zinc-400 leading-snug">
                    Redeem your 🪙 {pointsAvailable} Pts to get up to ₹{maxDiscount} off this program!
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer select-none shrink-0">
                  <input
                    type="checkbox"
                    checked={usePoints}
                    onChange={(e) => setUsePoints(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-zinc-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-zinc-400 peer-checked:after:bg-zinc-950 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-400"></div>
                </label>
              </div>
            )}

            {/* Pricing Summary and QR directions */}
            <div className="grid sm:grid-cols-2 gap-4 items-center">
              {/* QR representation */}
              <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-white text-zinc-950">
                <QrCode className="h-28 w-28 text-zinc-950" />
                <span className="text-[9px] uppercase font-mono tracking-widest text-zinc-500 font-bold mt-1 block">
                  deltaclause@upi
                </span>
                <span className="text-[8px] font-sans text-emerald-600 font-bold mt-0.5">
                  Verify Merchant: Deltaclause Ltd.
                </span>
              </div>

              {/* Instructions text */}
              <div className="space-y-2 text-zinc-300 font-sans leading-relaxed text-[11px]">
                <p>
                  <strong>QR Scan Instructions:</strong>
                </p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Scan the QR code with any active UPI app (GPay, PhonePe, Paytm).</li>
                  <li>Transfer the exact amount listed below securely.</li>
                  <li>Copy the <strong>12-Digit transaction Ref ID</strong> and take a screenshot of success.</li>
                </ol>

                <div className="border-t border-zinc-900 pt-2 font-mono flex justify-between text-xs mt-1">
                  <span className="text-zinc-500">Total Due:</span>
                  <span className="font-extrabold text-white text-sm">₹{finalPrice}</span>
                </div>
              </div>
            </div>

            {/* Inputs Form fields */}
            <div className="grid sm:grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <label className="text-zinc-400 block font-semibold">
                  Transaction ID / UPI Ref ID
                </label>
                <input
                  type="text"
                  placeholder="Ex: Ref 123456789"
                  value={txId}
                  onChange={(e) => setTxId(e.target.value)}
                  className="w-full rounded border border-zinc-800 bg-zinc-900 p-2 text-white font-mono placeholder-zinc-500 outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-zinc-400 block font-semibold">
                  Referral Code (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Referrer Email or Phone"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value)}
                  className="w-full rounded border border-zinc-800 bg-zinc-900 p-2 text-white font-sans placeholder-zinc-500 outline-none"
                />
              </div>
            </div>

            {/* Screenshot file upload drag area */}
            <div className="space-y-1.5">
              <label className="text-zinc-400 block font-semibold">Upload Payment Screen Proof</label>
              
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className="border border-dashed border-zinc-800 bg-zinc-900/40 rounded-lg p-4 text-center hover:border-zinc-700 transition cursor-pointer relative"
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  id="screenshot-file-input"
                />
                
                {screenshotBase64 ? (
                  <div className="flex items-center justify-center space-x-2 text-emerald-400 font-mono font-semibold" id="screenshot-proof-display">
                    <FileCheck className="h-5 w-5 text-emerald-400 shrink-0" />
                    <span className="truncate max-w-xs text-xs">{screenshotName || "image_proof.png"}</span>
                  </div>
                ) : (
                  <div className="space-y-1 flex flex-col items-center">
                    <Upload className="h-5 w-5 text-zinc-500" />
                    <span className="text-zinc-400 block">Drag & drop or <span className="underline text-emerald-400">click to upload</span> proof file</span>
                    <span className="text-[10px] text-zinc-650 block">PNG, JPG formats (Max file size 2MB)</span>
                  </div>
                )}
              </div>
            </div>

            {/* Submission Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 font-bold py-2.5 text-xs transition active:scale-95 disabled:opacity-50"
              id="btn-bill-checkout-submit"
            >
              {isSubmitting ? "Delivering receipt payload..." : "Initiate Verification"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
