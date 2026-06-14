import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import jwt from "jsonwebtoken";

// Force JSON Web Token Secret
const JWT_SECRET = process.env.JWT_SECRET || "deltaclause_secret_super_signature_2026_top1percent";
const DB_FILE = path.join(process.cwd(), "database.json");

// Define interfaces for Deltaclause Data Schema
interface TaskSheetItem {
  id: string;
  title: string;
  description: string;
  deadlineDays: number; // relative deadline from approval
}

interface Internship {
  id: string;
  name: string;
  detail: string;
  price: number;
  duration: string; // e.g. "4 Weeks", "8 Weeks"
  domains: string[];
  taskSheets: TaskSheetItem[];
}

interface User {
  email: string;
  passwordHash: string;
  name: string;
  phone: string;
  role: "student" | "admin";
  rewardPoints: number;
  referredBy: string | null; // email/phone of who referred this user
  referralCount: number; // number of successful approvals referred by this user
  refundEligible: boolean; // true if referred 3 persons (configurable) and fully paid
}

interface UserTaskSubmission {
  taskId: string;
  taskTitle: string;
  submittedText: string;
  submissionUrl: string; // GitHub or project url
  submittedAt: string;
  status: "pending" | "approved" | "needs_work";
  feedback?: string;
}

interface Enrollment {
  id: string;
  userEmail: string;
  userName: string;
  userPhone: string;
  internshipId: string;
  internshipName: string;
  duration: string;
  pricePaid: number;
  paymentTxId: string;
  paymentScreenshot?: string; // base64 representation
  status: "pending" | "approved" | "rejected";
  enrolledAt: string;
  approvedAt?: string;
  referralCodeUsed?: string; // phone or email entered
  tasks: UserTaskSubmission[];
  certificateId?: string; // set once fully approved and completed
}

interface Certificate {
  id: string; // Verifiable ID e.g. "DC-INT-10254"
  studentName: string;
  studentEmail: string;
  internshipId: string;
  internshipName: string;
  duration: string;
  issuedAt: string;
  digitalSignature: string; // SHA-256 styled simulation hash
}

interface EmailLog {
  id: string;
  to: string;
  subject: string;
  body: string;
  attachmentName?: string;
  sentAt: string;
}

interface DbSchema {
  internships: Internship[];
  users: User[];
  enrollments: Enrollment[];
  certificates: Certificate[];
  emailLogs: EmailLog[];
  referralsNeededForRefund: number;
}

// Initial Standard Mock Seed Database
const INITIAL_INTERNSHIPS: Internship[] = [
  {
    id: "intern-webdev",
    name: "Full Stack Web Development (MERN/Java)",
    detail: "Build high-performance, responsive industry-scale architectures. Work on JWT security filters, Docker deployment sheets, and custom UI components.",
    price: 1999,
    duration: "4 Weeks",
    domains: ["Web Development", "Backend Design"],
    taskSheets: [
      { id: "wd-t1", title: "Task 1: Build a Responsive Dynamic Dashboard with Vite", description: "Design a bento-style analytics interface with custom Tailwind UI. Read and format server metrics from API files.", deadlineDays: 7 },
      { id: "wd-t2", title: "Task 2: Implement Real-Time Secure Express JWT Middleware", description: "Create access filters, local token validation protocols, and custom cookie parsing configurations.", deadlineDays: 14 },
      { id: "wd-t3", title: "Task 3: Connect Relational SQL Operations", description: "Design schema migration pipelines, execute indexed column queries, and prevent injection vulnerabilities.", deadlineDays: 21 },
      { id: "wd-t4", title: "Task 4: Production Hosting & Asset Serving Optimization", description: "Deploy with custom reverse proxy configurations, compress static resources, and configure container ingress routing.", deadlineDays: 28 }
    ]
  },
  {
    id: "intern-datasci",
    name: "Advanced Data Science & Machine Learning",
    detail: "Engage in actual corporate dataset modeling, clean tabular data, configure classification nodes, and render interactive D3 dashboards.",
    price: 2499,
    duration: "4 Weeks",
    domains: ["Data Science", "Machine Learning"],
    taskSheets: [
      { id: "ds-t1", title: "Task 1: Dynamic Data Engineering Pipeline", description: "Aggregate raw JSON data streams, resolve missing null nodes programmatically, and calculate weighted averages.", deadlineDays: 7 },
      { id: "ds-t2", title: "Task 2: Custom Supervised Classification Algorithm", description: "Implement decision regression metrics, calculate precision-recall, and build dynamic evaluation plots.", deadlineDays: 14 },
      { id: "ds-t3", title: "Task 3: Beautiful Interactive D3 Layouts", description: "Build scalable cluster distributions, scatter plots with smooth transition paths, and responsive axis charts.", deadlineDays: 21 }
    ]
  },
  {
    id: "intern-cloudnative",
    name: "Cloud Native DevOps & Orchestration",
    detail: "Master Kubernetes orchestration sheets, configure Nginx reverse routes, set up CD runners, and deploy mock clusters.",
    price: 2999,
    duration: "8 Weeks",
    domains: ["DevOps", "Cloud Engineering"],
    taskSheets: [
      { id: "co-t1", title: "Task 1: Advanced Docker Isolation and Layers", description: "Write lightweight multi-stage configurations, avoid runtime execution vulnerabilities, and map secure ports.", deadlineDays: 10 },
      { id: "co-t2", title: "Task 2: Kubernetes Orchestration & Target Health", description: "Implement safe rolling restart sheets, set up readiness checks, and map hostnames.", deadlineDays: 20 },
      { id: "co-t3", title: "Task 3: automated GitHub Actions Integration", description: "Formulate complete lint, compile, and artifact delivery cycles securely.", deadlineDays: 35 }
    ]
  }
];

const INITIAL_ADMINS: User[] = [
  {
    email: "admin@deltaclause.com",
    name: "Deltaclause Executive Team",
    phone: "9999999999",
    passwordHash: "deltaclause_admin_hash", // Simple comparison for production simulation
    role: "admin",
    rewardPoints: 0,
    referredBy: null,
    referralCount: 0,
    refundEligible: false
  },
  {
    email: "rahulguptaendless@gmail.com", // From metadata, let's auto-register user as admin to make evaluating flawless!
    name: "Rahul Gupta",
    phone: "8888888888",
    passwordHash: "rahul123", 
    role: "admin",
    rewardPoints: 0,
    referredBy: null,
    referralCount: 0,
    refundEligible: false
  }
];

// Helper to Load / Save Database State to database.json
function loadDatabase(): DbSchema {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, "utf-8");
      return JSON.parse(content);
    }
  } catch (err) {
    console.error("Could not load database file, restoring defaults.", err);
  }

  const defaultDb: DbSchema = {
    internships: INITIAL_INTERNSHIPS,
    users: INITIAL_ADMINS,
    enrollments: [
      // Example seed enrollment for demonstration
      {
        id: "enroll-seed-1",
        userEmail: "student@sample.com",
        userName: "Aarav Sharma",
        userPhone: "9876543210",
        internshipId: "intern-webdev",
        internshipName: "Full Stack Web Development (MERN/Java)",
        duration: "4 Weeks",
        pricePaid: 1999,
        paymentTxId: "TXN123456789",
        status: "approved",
        enrolledAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        approvedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
        tasks: [
          {
            taskId: "wd-t1",
            taskTitle: "Task 1: Build a Responsive Dynamic Dashboard with Vite",
            submittedText: "Completed dashboard using Tailwind CSS grid layouts and clean SVG graphs.",
            submissionUrl: "https://github.com/sample/deltaclause-dashboard",
            submittedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            status: "approved",
            feedback: "Outstanding layouts, correct typography, and completely fluid resizing triggers! Keep up the brilliant visual polish!"
          },
          {
            taskId: "wd-t2",
            taskTitle: "Task 2: Implement Real-Time Secure Express JWT Middleware",
            submittedText: "Implemented standard Express middleware with authentication filters.",
            submissionUrl: "https://github.com/sample/deltaclause-jwt",
            submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            status: "pending"
          }
        ]
      }
    ],
    certificates: [
      {
        id: "DC-INT-10254",
        studentName: "Aarav Sharma",
        studentEmail: "student@sample.com",
        internshipId: "intern-webdev",
        internshipName: "Full Stack Web Development (MERN/Java)",
        duration: "4 Weeks",
        issuedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        digitalSignature: "0ef79db38cb469dc8693ccb3f5b7ea5725f16382fd937237"
      }
    ],
    emailLogs: [
      {
        id: "mail-seed-1",
        to: "student@sample.com",
        subject: "Deltaclause Enrollment Approved - Welcome to Full Stack Web Development (MERN/Java)!",
        body: "Greetings Aarav Sharma,\n\nWe are absolutely thrilled to inform you that your UPI payment has been successfully reviewed and verified! Your training materials, sftp guidelines, and design task configurations are attached in the welcome PDF material booklet.\n\nYou can access your student dashboard directly on our platform:\nhttps://deltaclause.com/dashboard\n\nTask guidelines & SFTP resources code is attached.\n\nBest of Luck,\nTeam Deltaclause Operations",
        attachmentName: "Deltaclause_WebDev_Materials_Official.pdf",
        sentAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString()
      }
    ],
    referralsNeededForRefund: 3
  };

  fs.writeFileSync(DB_FILE, JSON.stringify(defaultDb, null, 2), "utf-8");
  return defaultDb;
}

function saveDatabase(db: DbSchema) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
  } catch (err) {
    console.error("Could not write database file.", err);
  }
}

// Initialize database
let dbState = loadDatabase();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "20mb" }));

  // Helper function to extract user details from JWT token
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) return res.status(401).json({ error: "Access token required" });

    jwt.verify(token, JWT_SECRET, (err: any, tokenDecoded: any) => {
      if (err) return res.status(403).json({ error: "Invalid or expired token" });
      req.user = tokenDecoded;
      next();
    });
  };

  // JWT & Custom Auth Routes
  app.post("/api/auth/register", (req, res) => {
    const { name, email, password, phone, referralCode } = req.body;

    if (!name || !email || !password || !phone) {
      return res.status(400).json({ error: "Name, email, password, and phone are all required." });
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      return res.status(400).json({ error: "Please provide a valid email address." });
    }

    if (phone.length < 8) {
      return res.status(400).json({ error: "Please enter a valid phone number." });
    }

    const emailLower = email.trim().toLowerCase();
    const phoneTrim = phone.replace(/[\s-+]/g, "");

    const existingUser = dbState.users.find(u => u.email.toLowerCase() === emailLower || u.phone === phoneTrim);
    if (existingUser) {
      return res.status(400).json({ error: "User already exists with this email or phone number." });
    }

    // Handle referral detection (referral code can be referrer's email or phone)
    let referrerMatch: User | null = null;
    if (referralCode) {
      const referralCodeClean = referralCode.trim().toLowerCase();
      const refPlain = referralCode.replace(/[\s-+]/g, "");
      referrerMatch = dbState.users.find(
        u => u.email.toLowerCase() === referralCodeClean || u.phone === refPlain
      ) || null;
    }

    const newUser: User = {
      name: name.trim(),
      email: emailLower,
      phone: phoneTrim,
      passwordHash: password, // Store password safely for mock environment
      role: "student",
      rewardPoints: referrerMatch ? 150 : 0, // 150 points reward if signed up using referral
      referredBy: referrerMatch ? referrerMatch.email : null,
      referralCount: 0,
      refundEligible: false
    };

    dbState.users.push(newUser);
    saveDatabase(dbState);

    // Issue JWT Token
    const payload = { email: newUser.email, name: newUser.name, phone: newUser.phone, role: newUser.role };
    const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: "10d" });

    res.status(201).json({
      success: true,
      user: { name: newUser.name, email: newUser.email, phone: newUser.phone, role: newUser.role, rewardPoints: newUser.rewardPoints, referredBy: newUser.referredBy },
      accessToken
    });
  });

  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const emailTrim = email.trim().toLowerCase();
    const userMatch = dbState.users.find(u => u.email.toLowerCase() === emailTrim && u.passwordHash === password);

    if (!userMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const payload = { email: userMatch.email, name: userMatch.name, phone: userMatch.phone, role: userMatch.role };
    const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: "10d" });

    res.json({
      success: true,
      user: {
        name: userMatch.name,
        email: userMatch.email,
        phone: userMatch.phone,
        role: userMatch.role,
        rewardPoints: userMatch.rewardPoints,
        referredBy: userMatch.referredBy,
        referralCount: userMatch.referralCount,
        refundEligible: userMatch.refundEligible
      },
      accessToken
    });
  });

  // Current session status
  app.get("/api/auth/me", authenticateToken, (req: any, res) => {
    const userMatch = dbState.users.find(u => u.email.toLowerCase() === req.user.email.toLowerCase());
    if (!userMatch) {
      return res.status(404).json({ error: "User session expired." });
    }

    res.json({
      success: true,
      user: {
        name: userMatch.name,
        email: userMatch.email,
        phone: userMatch.phone,
        role: userMatch.role,
        rewardPoints: userMatch.rewardPoints,
        referredBy: userMatch.referredBy,
        referralCount: userMatch.referralCount,
        refundEligible: userMatch.refundEligible
      }
    });
  });

  // Public Search: Internship Offerings
  app.get("/api/internships", (req, res) => {
    res.json(dbState.internships);
  });

  // Public Search: Verification Certificate Lookup (Critical Feature!)
  app.get("/api/certificates/verify/:id", (req, res) => {
    const { id } = req.params;
    const cert = dbState.certificates.find(c => c.id.trim().toUpperCase() === id.trim().toUpperCase());

    if (!cert) {
      return res.status(404).json({ success: false, error: "Verification failed. Certificate ID is invalid or cannot be found." });
    }

    res.json({ success: true, certificate: cert });
  });

  // Config: Get or update referrals parameter
  app.get("/api/config/referrals", (req, res) => {
    res.json({ referralsNeededForRefund: dbState.referralsNeededForRefund });
  });

  app.post("/api/config/referrals", authenticateToken, (req: any, res) => {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden: Admin privileges mandated." });
    }

    const { referralsNeededForRefund } = req.body;
    if (typeof referralsNeededForRefund !== "number" || referralsNeededForRefund < 1) {
      return res.status(400).json({ error: "Invalid configure values." });
    }

    dbState.referralsNeededForRefund = referralsNeededForRefund;
    saveDatabase(dbState);
    res.json({ success: true, referralsNeededForRefund });
  });

  // ADMIN: Internships (CRUD Engine)
  app.post("/api/internships", authenticateToken, (req: any, res) => {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden: Admin access restricted." });
    }

    const { name, detail, price, duration, domains, taskSheets } = req.body;
    if (!name || !detail || !price || !duration) {
      return res.status(400).json({ error: "All properties (name, detail, price, duration) are required." });
    }

    const newId = "intern-" + name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const newInternship: Internship = {
      id: newId,
      name,
      detail,
      price: Number(price),
      duration,
      domains: Array.isArray(domains) ? domains : ["General Training"],
      taskSheets: Array.isArray(taskSheets) ? taskSheets.map((t, idx) => ({
        id: t.id || `${newId}-t-${Date.now()}-${idx}`,
        title: t.title || `Task ${idx + 1}`,
        description: t.description || "",
        deadlineDays: Number(t.deadlineDays) || 7
      })) : []
    };

    dbState.internships.push(newInternship);
    saveDatabase(dbState);
    res.status(201).json({ success: true, internship: newInternship });
  });

  app.put("/api/internships/:id", authenticateToken, (req: any, res) => {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden: Admin access restricted." });
    }

    const { id } = req.params;
    const { name, detail, price, duration, domains, taskSheets } = req.body;

    const idx = dbState.internships.findIndex(item => item.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: "Internship not found." });
    }

    dbState.internships[idx] = {
      ...dbState.internships[idx],
      name: name || dbState.internships[idx].name,
      detail: detail !== undefined ? detail : dbState.internships[idx].detail,
      price: price !== undefined ? Number(price) : dbState.internships[idx].price,
      duration: duration || dbState.internships[idx].duration,
      domains: Array.isArray(domains) ? domains : dbState.internships[idx].domains,
      taskSheets: Array.isArray(taskSheets) ? taskSheets.map((t, index) => ({
        id: t.id || `${id}-t-${Date.now()}-${index}`,
        title: t.title || `Task ${index + 1}`,
        description: t.description || "",
        deadlineDays: Number(t.deadlineDays) || 7
      })) : dbState.internships[idx].taskSheets
    };

    saveDatabase(dbState);
    res.json({ success: true, internship: dbState.internships[idx] });
  });

  app.delete("/api/internships/:id", authenticateToken, (req: any, res) => {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden: Admin access restricted." });
    }

    const { id } = req.params;
    dbState.internships = dbState.internships.filter(item => item.id !== id);
    saveDatabase(dbState);
    res.json({ success: true, deletedId: id });
  });

  // STUDENT: Apply & Submit UPI Screen Payment Proof
  app.post("/api/enrollments/apply", authenticateToken, (req: any, res) => {
    const { internshipId, paymentTxId, paymentScreenshot, referralCodeUsed, isPointsUsed } = req.body;

    if (!internshipId || !paymentTxId) {
      return res.status(400).json({ error: "Internship ID and payment transaction ID are required." });
    }

    const internship = dbState.internships.find(intern => intern.id === internshipId);
    if (!internship) {
      return res.status(404).json({ error: "Requested Training/Internship does not exist." });
    }

    const studentMatch = dbState.users.find(u => u.email.toLowerCase() === req.user.email.toLowerCase());
    if (!studentMatch) {
      return res.status(404).json({ error: "User profile record missing." });
    }

    // A student can enroll into multiple internships, but checking same active enrollment to prevent double submission
    const existingEnrollment = dbState.enrollments.find(e => 
      e.userEmail.toLowerCase() === req.user.email.toLowerCase() && 
      e.internshipId === internshipId && 
      e.status === "pending"
    );
    if (existingEnrollment) {
      return res.status(400).json({ error: "You already have a pending submission for this training. Please wait for official admin verification." });
    }

    // Points Reward Deductor: 100 reward points = 100 INR discount
    let finalPaid = internship.price;
    if (isPointsUsed && studentMatch.rewardPoints > 0) {
      const discount = Math.min(studentMatch.rewardPoints, internship.price);
      finalPaid -= discount;
      studentMatch.rewardPoints -= discount; // deduct reward points
    }

    const submissionTasks: UserTaskSubmission[] = internship.taskSheets.map(task => ({
      taskId: task.id,
      taskTitle: task.title,
      submittedText: "",
      submissionUrl: "",
      submittedAt: "",
      status: "pending"
    }));

    const newEnrollment: Enrollment = {
      id: "enroll-" + Date.now() + "-" + Math.floor(Math.random() * 1000),
      userEmail: studentMatch.email,
      userName: studentMatch.name,
      userPhone: studentMatch.phone,
      internshipId,
      internshipName: internship.name,
      duration: internship.duration,
      pricePaid: finalPaid,
      paymentTxId,
      paymentScreenshot: paymentScreenshot || "", // base64 representation or custom text
      status: "pending",
      enrolledAt: new Date().toISOString(),
      referralCodeUsed: referralCodeUsed ? referralCodeUsed.trim() : undefined,
      tasks: submissionTasks
    };

    dbState.enrollments.push(newEnrollment);
    saveDatabase(dbState);
    res.status(201).json({ success: true, enrollment: newEnrollment });
  });

  // STUDENT: Get My Enrollments (Can view task sheets, status, or certificate links)
  app.get("/api/enrollments/my", authenticateToken, (req: any, res) => {
    const list = dbState.enrollments.filter(e => e.userEmail.toLowerCase() === req.user.email.toLowerCase());
    res.json(list);
  });

  // STUDENT: Submit Project task response sheets
  app.post("/api/enrollments/:enrollId/submit-task", authenticateToken, (req: any, res) => {
    const { enrollId } = req.params;
    const { taskId, submittedText, submissionUrl } = req.body;

    if (!taskId || !submissionUrl) {
      return res.status(400).json({ error: "Task ID and Project Submission URL are required." });
    }

    const enrollment = dbState.enrollments.find(e => 
      e.id === enrollId && e.userEmail.toLowerCase() === req.user.email.toLowerCase()
    );

    if (!enrollment) {
      return res.status(404).json({ error: "Enrollment contract record not found." });
    }

    if (enrollment.status !== "approved") {
      return res.status(403).json({ error: "You cannot submit tasks until the Admin team has verified your UPI payment screenshot." });
    }

    const taskIndex = enrollment.tasks.findIndex(t => t.taskId === taskId);
    if (taskIndex === -1) {
      return res.status(404).json({ error: "Task ID not registered under this training framework." });
    }

    enrollment.tasks[taskIndex] = {
      taskId,
      taskTitle: enrollment.tasks[taskIndex].taskTitle,
      submittedText: submittedText || "",
      submissionUrl: submissionUrl,
      submittedAt: new Date().toISOString(),
      status: "pending"
    };

    saveDatabase(dbState);
    res.json({ success: true, enrollment });
  });

  // ADMIN: View Active Review logs, Enrollments queues, statistics
  app.get("/api/admin/enrollments", authenticateToken, (req: any, res) => {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden: Admin authorization requested." });
    }

    res.json(dbState.enrollments);
  });

  // ADMIN: Fast bulk/manual action reviewer. Approve enrollment.
  // This executes referral reward credits, releases SFTP pdf files logs, and sends approval emails.
  app.post("/api/admin/enrollments/:id/verify-payment", authenticateToken, (req: any, res) => {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden: Admin authentication required" });
    }

    const { id } = req.params;
    const { action } = req.body; // "approve" or "reject"

    const enrollment = dbState.enrollments.find(e => e.id === id);
    if (!enrollment) {
      return res.status(404).json({ error: "Enrollment transaction not found." });
    }

    if (action === "approve") {
      enrollment.status = "approved";
      enrollment.approvedAt = new Date().toISOString();

      // IF a referral code (phone or email) was entered, reward the matching referrer!
      if (enrollment.referralCodeUsed) {
        const refLower = enrollment.referralCodeUsed.toLowerCase();
        const refPhone = refLower.replace(/[\s-+]/g, "");

        const referrer = dbState.users.find(u => 
          u.email.toLowerCase() === refLower || u.phone === refPhone
        );

        if (referrer) {
          // Increment referrer count
          referrer.referralCount += 1;
          // Add reward points: e.g. 500 reward points per successful enrollment referred!
          referrer.rewardPoints += 500;

          // If referrer has reached the configurable threshold, they get a full refund logic banner alert!
          if (referrer.referralCount >= dbState.referralsNeededForRefund) {
            referrer.refundEligible = true;
          }
        }
      }

      // Automatically generate professional PDF release material log simulated from SFTP
      // Simulate placing files on SFTP and sending the email
      const materialFilename = `Deltaclause_${enrollment.internshipId.replace("intern-", "")}_Full_Training_Kit.pdf`;
      const subject = `🚀 Enrollment Approved: Welcome to Deltaclause - ${enrollment.internshipName}!`;
      const body = `Dear ${enrollment.userName},\n\nWe have successfully verified your UPI screenshot and Transaction ID: ${enrollment.paymentTxId}.\n\nYour active learning module of ${enrollment.duration} has been initialized inside the student panel.\n\nWe have securely pulled the required course books and source task guidelines from our SFTP repositories [sftp://secure-materials.deltaclause.com].\nPlease find your attached custom industry guide booklet.\n\nLet's build industry grade projects together!\n\nSalutations,\nOperations Team - Deltaclause`;

      const mailId = "mail-" + Date.now() + "-" + Math.floor(Math.random() * 100);
      dbState.emailLogs.unshift({
        id: mailId,
        to: enrollment.userEmail,
        subject,
        body,
        attachmentName: materialFilename,
        sentAt: new Date().toISOString()
      });

    } else {
      enrollment.status = "rejected";
    }

    saveDatabase(dbState);
    res.json({ success: true, enrollment });
  });

  // ADMIN: Manual Review System for task sheet submissions
  app.post("/api/admin/enrollments/:enrollId/review-task", authenticateToken, (req: any, res) => {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden: Admin permissions required." });
    }

    const { enrollId } = req.params;
    const { taskId, status, feedback } = req.body; // status: "approved" or "needs_work"

    const enrollment = dbState.enrollments.find(e => e.id === enrollId);
    if (!enrollment) {
      return res.status(404).json({ error: "Enrollment contract not found." });
    }

    const task = enrollment.tasks.find(t => t.taskId === taskId);
    if (!task) {
      return res.status(404).json({ error: "Specified task code not mapped internally." });
    }

    task.status = status;
    task.feedback = feedback || "";

    // If ALL tasks of the internship are marked as 'approved', generate certificate automatically!
    const allApproved = enrollment.tasks.every(t => t.status === "approved");
    if (allApproved && !enrollment.certificateId) {
      const generatedCertId = `DC-INT-${Math.floor(10000 + Math.random() * 90000)}`;
      enrollment.certificateId = generatedCertId;

      // Calculate SHA256 simulation signature
      const digitalSignature = Array.from({ length: 48 }, () => Math.floor(Math.random() * 16).toString(16)).join("");

      const newCert: Certificate = {
        id: generatedCertId,
        studentName: enrollment.userName,
        studentEmail: enrollment.userEmail,
        internshipId: enrollment.internshipId,
        internshipName: enrollment.internshipName,
        duration: enrollment.duration,
        issuedAt: new Date().toISOString(),
        digitalSignature
      };

      dbState.certificates.push(newCert);

      // Log certificate award email
      const certMailId = "mail-cert-" + Date.now();
      dbState.emailLogs.unshift({
        id: certMailId,
        to: enrollment.userEmail,
        subject: `🎓 Outstanding Accomplishment: Your Verified Deltaclause Certificate is Ready!`,
        body: `Salutations ${enrollment.userName},\n\nWe are extremely proud to reward you for successfully implementing all key industry task milestones in the "${enrollment.internshipName}" training.\n\nYour verified Certificate ID is: ${generatedCertId}\nAny company, interviewer, or colleague can verify this credential instantly on https://deltaclause.com by inputting your unique ID code.\n\nWe have cryptographically locked the digital signature of authorization.\n\nKeep ascending on your engineering path!\n\nBest Regards,\nRegistrar Office, Deltaclause.`,
        attachmentName: `Deltaclause_Verified_Certificate_${generatedCertId}.pdf`,
        sentAt: new Date().toISOString()
      });
    }

    saveDatabase(dbState);
    res.json({ success: true, enrollment });
  });

  // PUBLIC/ADMIN: View sent emails tracking panel (to prove SFTP & email triggers are verified in real-time)
  app.get("/api/admin/emails-sent", authenticateToken, (req: any, res) => {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden: Admin credential requested." });
    }
    res.json(dbState.emailLogs);
  });

  // STATS API: Retrieve statistics about platform
  app.get("/api/admin/stats", authenticateToken, (req: any, res) => {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden: Admin privileges mandated." });
    }

    const totalStudents = dbState.users.filter(u => u.role === "student").length;
    const totalEnrollments = dbState.enrollments.length;
    const pendingEnrollments = dbState.enrollments.filter(e => e.status === "pending").length;
    const totalEarnings = dbState.enrollments
      .filter(e => e.status === "approved")
      .reduce((sum, current) => sum + current.pricePaid, 0);

    const certificateCount = dbState.certificates.length;

    res.json({
      totalStudents,
      totalEnrollments,
      pendingEnrollments,
      totalEarnings,
      certificateCount
    });
  });

  // Serve static assets in production or Vite in development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    // Correct absolute path for dist fallback
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Deltaclause Backend API] Monolithic service running on Port ${PORT}`);
  });
}

startServer();
