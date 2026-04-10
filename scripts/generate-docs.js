/**
 * Umoor Sehat — Admin Portal Walkthrough PDF
 */

const puppeteer = require("puppeteer");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

const BASE    = "http://localhost:3000";
const OUT_DIR = path.join(__dirname, "../docs");
const PDF_PATH = path.join(OUT_DIR, "Umoor-Sehat-Admin-Walkthrough.pdf");

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const NAVY = "#1a2744";
const GOLD = "#cf9b00";
const GRAY = "#6b7280";

// ── Screenshot helper ─────────────────────────────────────────────────────────
async function shoot(page, filename, waitMs = 1800) {
  await new Promise((r) => setTimeout(r, waitMs));
  const fpath = path.join(OUT_DIR, filename);
  await page.screenshot({ path: fpath, fullPage: false, type: "png" });
  console.log(`  ✓ ${filename}`);
  return fpath;
}

// ── Main ──────────────────────────────────────────────────────────────────────
(async () => {
  console.log("Launching browser…");
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    defaultViewport: { width: 1280, height: 820 },
  });
  const page = await browser.newPage();
  const shots = [];

  // ── 1. LOGIN PAGE ──────────────────────────────────────────────────────────
  console.log("\n── Capturing login page");
  await page.goto(`${BASE}/sehat/login`, { waitUntil: "networkidle2" });
  shots.push({
    title: "Step 1 — Login",
    desc:  "Open the Umoor Sehat admin portal at /sehat/login. Enter the credentials:\n\n  Username: admin\n  Password: admin\n\nThen click Sign In to access the dashboard.",
    img:   await shoot(page, "s01-login.png"),
  });

  // ── 2. DO THE LOGIN ────────────────────────────────────────────────────────
  await page.type('input[type="text"]',     "admin");
  await page.type('input[type="password"]', "admin");
  await page.click('button[type="submit"]');
  await new Promise((r) => setTimeout(r, 2500));

  // ── 3. DASHBOARD ──────────────────────────────────────────────────────────
  console.log("── Capturing dashboard");
  shots.push({
    title: "Step 2 — Admin Dashboard",
    desc:  "After login the dashboard shows:\n\n  • Live token counters for each category (Ortho, Examination, Physio, Dental, Other) — these increment as patients are added.\n  • Total patients registered for the camp.\n  • A menu card to open the Ashara Ohabat Special Medical Camp.\n\nUse the Logout button in the top-right to end the session.",
    img:   await shoot(page, "s02-dashboard.png"),
  });

  // ── 4. CAMP PAGE — empty ───────────────────────────────────────────────────
  console.log("── Capturing camp page");
  await page.goto(`${BASE}/sehat/admin/camp`, { waitUntil: "networkidle2" });
  shots.push({
    title: "Step 3 — Medical Camp — Patient List",
    desc:  "The Medical Camp page lists all registered patients in a table showing:\n  Name, ITS Number, Age, Contact, and Assigned Tokens.\n\nClick 'Add Patient' to register a new patient. The blue 'Record' button opens their Health Screening Card.",
    img:   await shoot(page, "s03-camp-list.png"),
  });

  // ── 5. CLICK ADD PATIENT ───────────────────────────────────────────────────
  console.log("── Capturing add patient step 1");
  await page.click('button:has-text("Add Patient")').catch(async () => {
    // Fallback: find by text content
    await page.evaluate(() => {
      const btns = [...document.querySelectorAll("button")];
      const btn  = btns.find((b) => b.textContent?.includes("Add Patient"));
      btn?.click();
    });
  });
  await new Promise((r) => setTimeout(r, 800));
  shots.push({
    title: "Step 4 — Add Patient (Step 1: Patient Details)",
    desc:  "A 2-step form appears.\n\nStep 1 — Enter patient details:\n  • Full Name\n  • ITS Number (8-digit)\n  • Age\n  • Contact Number\n\nClick 'Next: Assign Tokens →' to proceed to token assignment.",
    img:   await shoot(page, "s04-add-patient-step1.png", 600),
  });

  // Fill step 1
  const inputs = await page.$$("input");
  // name
  await inputs[0]?.type("Hasan Kanchwala");
  await inputs[1]?.type("30346325");
  await inputs[2]?.type("29");
  await inputs[3]?.type("8962408191");

  // Click Next
  await page.evaluate(() => {
    const btns = [...document.querySelectorAll("button")];
    const btn  = btns.find((b) => b.textContent?.includes("Next"));
    btn?.click();
  });
  await new Promise((r) => setTimeout(r, 800));

  // ── 6. STEP 2 — TOKEN ASSIGNMENT ──────────────────────────────────────────
  console.log("── Capturing token assignment");
  shots.push({
    title: "Step 5 — Add Patient (Step 2: Assign Tokens)",
    desc:  "Step 2 — Select which checkup categories the patient needs.\n\nFor each selected category, the system previews the next token number that will be assigned (e.g. '→ Token #1'). Token numbers are auto-incremented per category — each category has its own independent counter.\n\nClick 'Save & Open Record' to save and open the patient's Health Screening Card.",
    img:   await shoot(page, "s05-add-patient-step2.png", 600),
  });

  // Select ortho + dental
  await page.evaluate(() => {
    const btns = [...document.querySelectorAll("button[aria-label]")];
    const ortho  = btns.find((b) => b.getAttribute("aria-label") === "Toggle Ortho");
    const dental = btns.find((b) => b.getAttribute("aria-label") === "Toggle Dental");
    ortho?.click();
    dental?.click();
  });
  await new Promise((r) => setTimeout(r, 500));
  shots.push({
    title: "Step 5b — Tokens Selected (preview)",
    desc:  "With Ortho and Dental selected, the system shows a preview of the token numbers that will be assigned on save. The token numbers shown are live — if another patient was already added to that category, the next available number is shown.",
    img:   await shoot(page, "s05b-tokens-selected.png", 500),
  });

  // Save
  await page.evaluate(() => {
    const btns = [...document.querySelectorAll("button")];
    const btn  = btns.find((b) => b.textContent?.includes("Save & Open Record"));
    btn?.click();
  });
  await new Promise((r) => setTimeout(r, 3000));

  // ── 7. HEALTH SCREENING CARD ───────────────────────────────────────────────
  console.log("── Capturing health screening card");
  shots.push({
    title: "Step 6 — Health Screening Card (Page 1)",
    desc:  "After saving, the patient's Health Screening Card opens automatically. This is the A4 medical record with the official letterhead (3 logos).\n\nThe card shows:\n  • Patient details (Name, ITS, Age, Contact) top-left\n  • Assigned tokens with numbers top-right\n  • Clinical Measurements row: ECG, BP, Pulse, SpO2, BSL, BMI\n  • One shared Doctor Name + Signature for all vitals\n  • Dental Remarks block (full width)\n  • Ortho Remarks block (full width)\n\nDoctors fill in values at the camp. All fields are editable.",
    img:   await shoot(page, "s06-health-card.png"),
  });

  // Scroll down a bit to show remarks area
  await page.evaluate(() => window.scrollBy(0, 300));
  shots.push({
    title: "Step 6b — Health Screening Card (Remarks Area)",
    desc:  "Below the vitals, the card has two full-width remark boxes:\n\n  • Dental Remarks — text area for dental observations + dental doctor name & signature line\n  • Ortho Remarks — text area for ortho observations + ortho doctor name & signature line\n\nClick Save to store all entered values in the database.",
    img:   await shoot(page, "s06b-remarks.png", 600),
  });

  // Fill in some sample vitals to show a filled card
  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise((r) => setTimeout(r, 400));

  // Fill vitals via inputs
  const allInputs = await page.$$("input");
  const vals = ["72 bpm", "120/80", "78", "98%", "95", "170", "68", "23.5", "Dr. Ahmed Khan"];
  for (let i = 0; i < Math.min(vals.length, allInputs.length); i++) {
    await allInputs[i]?.click({ clickCount: 3 });
    await allInputs[i]?.type(vals[i]);
  }
  // Fill dental remarks
  const textareas = await page.$$("textarea");
  if (textareas[0]) { await textareas[0].click(); await textareas[0].type("No cavities. Mild plaque buildup on lower molars. Advised scaling."); }
  if (textareas[1]) { await textareas[1].click(); await textareas[1].type("Mild lower back pain. Advised physiotherapy. No fractures detected."); }

  // Screenshot filled card
  shots.push({
    title: "Step 6c — Health Screening Card (Filled Example)",
    desc:  "Example of a filled Health Screening Card with vitals and remarks entered by doctors at the camp.\n\nAll values are typed directly into the fields. The card updates live — click Save at any time to store the data in the database.",
    img:   await shoot(page, "s06c-filled-card.png"),
  });

  // ── PRINT PREVIEW — emulate print media ────────────────────────────────────
  console.log("── Capturing print preview");
  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise((r) => setTimeout(r, 300));

  // Emulate print CSS
  await page.emulateMediaType("print");
  await new Promise((r) => setTimeout(r, 800));

  shots.push({
    title: "Step 7 — Print Preview (A4 Layout)",
    desc:  "When printing, all UI chrome (header, buttons, navigation) is hidden. Only the A4 letterhead content prints.\n\nThe printed card contains:\n  • 3 official logos + letterhead at top\n  • Patient details & token assignments\n  • Clinical measurements table\n  • Shared doctor signature\n  • Dental Remarks box\n  • Ortho Remarks box\n  • Footer: 'Jamaat Khadki, Pune — Umoor Sehat | Confidential'\n\nTo print: click 'Print Page 1 Only' → in the browser print dialog, set Margins to None and uncheck Headers and Footers.",
    img:   await shoot(page, "s07-print-preview.png"),
  });

  // Switch back to screen
  await page.emulateMediaType("screen");
  await new Promise((r) => setTimeout(r, 300));

  // ── 8. PRINT BUTTONS ──────────────────────────────────────────────────────
  console.log("── Capturing print options");
  shots.push({
    title: "Step 8 — Print Options",
    desc:  "Three action buttons appear above the card:\n\n  [Save] — Saves all values to the database.\n  [Print Page 1 Only] — Prints the main Health Screening Card only.\n  [Print Both Pages] — Also prints a second page for Additional Remarks / Follow-up Notes.\n\nTip: In the Chrome print dialog, set Margins → None and uncheck Headers & Footers for a clean A4 print with no browser URL or page numbers.",
    img:   await shoot(page, "s08-print-buttons.png", 500),
  });

  // ── 9. BACK TO CAMP — QUEUE BOARD ─────────────────────────────────────────
  console.log("── Capturing queue board");
  await page.goto(`${BASE}/sehat/admin/camp`, { waitUntil: "networkidle2" });
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  shots.push({
    title: "Step 9 — Live Queue Board",
    desc:  "Below the patient list, the Live Queue Board shows 5 columns — one per category.\n\nEach patient appears under their assigned category with their token number. Staff can:\n  • Click a patient row to mark them as done → name gets strikethrough + green tick\n  • Click again to unmark\n  • The board auto-refreshes every 10 seconds\n  • Done count shown per column (e.g. '1/3')",
    img:   await shoot(page, "s08-queue-board.png"),
  });

  // ── 10. QUEUE BOARD — RESET BUTTONS ───────────────────────────────────────
  console.log("── Capturing reset buttons");
  await page.evaluate(() => {
    const el = document.querySelector(".mt-10");
    el?.scrollIntoView({ behavior: "instant" });
  });
  shots.push({
    title: "Step 10 — Reset Controls",
    desc:  "Two reset buttons are available on the queue board header:\n\n  [Reset Queue] — Clears all done/strikethrough marks. Use this at the start of a new session or shift.\n  [Reset Tokens] — Resets all 5 token counters back to 0. Next patient added will get Token #1 again.\n\nBoth buttons ask for confirmation before resetting.",
    img:   await shoot(page, "s09-reset-buttons.png", 600),
  });

  await browser.close();

  // ── BUILD PDF ──────────────────────────────────────────────────────────────
  console.log("\nBuilding PDF…");

  const doc = new PDFDocument({ size: "A4", margin: 0, autoFirstPage: false });
  const stream = fs.createWriteStream(PDF_PATH);
  doc.pipe(stream);

  const PW = 595.28;
  const PH = 841.89;

  // ── COVER ──────────────────────────────────────────────────────────────────
  doc.addPage();
  doc.rect(0, 0, PW, PH).fill(NAVY);
  doc.rect(0, 0, PW, 6).fill(GOLD);
  doc.rect(0, PH - 6, PW, 6).fill(GOLD);

  // Bismillah
  doc.fontSize(9).fillColor("rgba(255,255,255,0.15)").font("Helvetica")
    .text("بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ", 0, 90, { align: "center", width: PW });

  // Title
  doc.fontSize(10).fillColor(GOLD).font("Helvetica").text(
    "DAWAT-E-HADIYAH | JAMAAT KHADKI, PUNE", 0, 180, { align: "center", width: PW, characterSpacing: 1.5 }
  );
  doc.fontSize(32).fillColor("white").font("Helvetica-Bold")
    .text("Umoor Sehat", 0, 205, { align: "center", width: PW });
  doc.fontSize(18).fillColor(GOLD).font("Helvetica")
    .text("Admin Portal", 0, 247, { align: "center", width: PW });

  doc.moveTo(180, 285).lineTo(415, 285).strokeColor(GOLD).lineWidth(1).stroke();

  doc.fontSize(12).fillColor("rgba(255,255,255,0.7)").font("Helvetica")
    .text("Ashara Ohabat 1448H — Special Medical Camp", 0, 298, { align: "center", width: PW });

  // Steps list
  const steps = [
    "Login to the Sehat Admin Portal",
    "Dashboard — Live Token Counters",
    "Medical Camp — Patient List",
    "Add Patient — 2-Step Form",
    "Token Assignment (Auto-numbered)",
    "Health Screening Card (A4 Letterhead)",
    "Save & Print Options",
    "Live Queue Board — Mark Patients Done",
    "Reset Queue & Token Controls",
  ];

  doc.fontSize(10).fillColor(GOLD).font("Helvetica-Bold").text("Walkthrough Contents:", 200, 345);
  let sy = 368;
  for (let i = 0; i < steps.length; i++) {
    doc.fontSize(9.5).fillColor("rgba(255,255,255,0.72)").font("Helvetica")
      .text(`${i + 1}.  ${steps[i]}`, 200, sy);
    sy += 17;
  }

  // Footer
  doc.fontSize(8).fillColor("rgba(255,255,255,0.35)").font("Helvetica")
    .text(
      `Generated ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}   ·   Admin Login: admin / admin   ·   localhost:3000/sehat/login`,
      0, PH - 30, { align: "center", width: PW }
    );

  // ── CONTENT PAGES ──────────────────────────────────────────────────────────
  for (let i = 0; i < shots.length; i++) {
    const s = shots[i];
    doc.addPage();

    // Gold top bar
    doc.rect(0, 0, PW, 5).fill(GOLD);

    // Header bar
    doc.rect(0, 5, PW, 32).fill(NAVY);
    doc.fontSize(9).fillColor(GOLD).font("Helvetica-Bold").text(
      "UMOOR SEHAT — ADMIN PORTAL WALKTHROUGH",
      40, 14, { width: PW - 80 }
    );
    doc.fontSize(9).fillColor("rgba(255,255,255,0.5)").font("Helvetica").text(
      `${i + 1} / ${shots.length}`,
      0, 14, { align: "right", width: PW - 40 }
    );

    let y = 48;

    // Step title
    doc.fontSize(15).fillColor(NAVY).font("Helvetica-Bold")
      .text(s.title, 40, y, { width: PW - 80 });
    y += doc.heightOfString(s.title, { fontSize: 15, width: PW - 80 }) + 4;

    // Gold rule
    doc.moveTo(40, y).lineTo(PW - 40, y).strokeColor(GOLD).lineWidth(0.8).stroke();
    y += 9;

    // Description
    doc.fontSize(9.5).fillColor(GRAY).font("Helvetica")
      .text(s.desc, 40, y, { width: PW - 80, lineGap: 1.5 });
    y += doc.heightOfString(s.desc, { fontSize: 9.5, width: PW - 80, lineGap: 1.5 }) + 12;

    // Screenshot
    if (s.img && fs.existsSync(s.img)) {
      const availH = PH - y - 35;
      const availW = PW - 80;
      doc.image(s.img, 40, y, { fit: [availW, Math.min(availH, 440)], align: "center" });
      // thin border
      doc.rect(40, y, availW, Math.min(availH, 440)).strokeColor("#e5e7eb").lineWidth(0.4).stroke();
    }

    // Footer rule + page text
    doc.moveTo(40, PH - 24).lineTo(PW - 40, PH - 24).strokeColor("#e5e7eb").lineWidth(0.4).stroke();
    doc.fontSize(7.5).fillColor("#9ca3af").font("Helvetica")
      .text("Jamaat Khadki, Pune — Umoor Sehat Admin Portal", 40, PH - 18, { width: PW - 80 });
    doc.fontSize(7.5).fillColor("#9ca3af").font("Helvetica")
      .text(`Page ${i + 2}`, 0, PH - 18, { align: "right", width: PW - 40 });
  }

  doc.end();
  await new Promise((res, rej) => { stream.on("finish", res); stream.on("error", rej); });
  console.log(`\n✓ PDF → ${PDF_PATH}`);
})();
