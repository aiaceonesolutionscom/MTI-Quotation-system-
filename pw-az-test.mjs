import { chromium } from "playwright";

const BASE = "https://quotation.hawksnfox.com";
const USER_EMAIL = "user@mti.com";
const USER_PASS = "Usermit@12345";
const TEMP_PASS = "TempMti@12345";

let totalPass = 0;
let totalFail = 0;
const consoleErrors = [];
const pageErrors = [];

function isErrBody(body) {
  const t = (body || "").toLowerCase();
  return t.includes("could not be found") || t.includes("this page could not be found") || t.includes("application error");
}
function openCombo(page, label) {
  return page.locator("button").filter({ hasText: label }).first().click();
}
async function chooseOption(page, text) {
  const input = page.locator(`[cmdk-input]`).last();
  await input.fill(text);
  await page.waitForTimeout(300);
  const item = page.locator(`[cmdk-item]`).filter({ hasText: text }).last();
  await item.click();
  await page.waitForTimeout(300);
}
async function confirmDialog(page, buttonText) {
  await page.locator(`[role="alertdialog"] button`).filter({ hasText: buttonText }).first().click();
  await page.waitForTimeout(2500);
}
function step(name, ok, extra = "") {
  const tag = ok ? "PASS" : "FAIL";
  if (ok) totalPass++;
  else totalFail++;
  console.log(`  [${tag}] ${name}${extra ? " " + extra : ""}`);
}
async function expectUrl(page, re, waitMs = 15000) {
  try {
    await page.waitForURL(re, { timeout: waitMs });
    return true;
  } catch {
    return page.url().match(re) !== null;
  }
}
async function checkBackLink(page, label, expectedList) {
  const link = page.locator(`a:has-text("${label}")`).first();
  if (!(await link.count())) {
    console.log(`      [diag] no link "${label}" on ${page.url()}`);
    return false;
  }
  const from = page.url();
  const href = (await link.getAttribute("href")) || "";
  await link.click();
  const okNav = await page.waitForURL((u) => u.pathname === expectedList, { timeout: 10000 }).then(() => true).catch(() => false);
  await page.waitForTimeout(500);
  const now = page.url().replace(/\/+$/, "");
  if (!okNav && now !== expectedList) console.log(`      [diag] click "${label}" href=${href} from ${from}; now=${now}`);
  return href.startsWith(expectedList) && okNav;
}
async function pageDiag(tag) {
  const t = await page.locator("body").innerText().catch(() => "");
  console.log(`      [diag] ${tag} url=${page.url()} body=${t.slice(0, 120).replace(/\n/g, " ")}`);
}
async function login(page, email, pass) {
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(pass);
  await page.locator('button[type="submit"]').click();
  const ok = await expectUrl(page, /\/dashboard/, 20000);
  await page.waitForTimeout(1200);
  return ok && (await page.locator("body").innerText()).includes("Dashboard");
}
async function changePassword(page, currentPass, newPass) {
  await page.goto(`${BASE}/profile`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForTimeout(1200);
  await page.locator("#currentPassword").fill(currentPass);
  await page.locator("#newPassword").fill(newPass);
  await page.locator("#confirmPassword").fill(newPass);
  await page.locator('button[type="submit"]').click();
  const toastOk = await page.getByText("Password changed.", { exact: false }).waitFor({ timeout: 6000 }).then(() => true).catch(() => false);
  await page.waitForTimeout(500);
  return toastOk;
}
async function deleteViaDetailDialog(page, detailUrl, backUrl, nameContains) {
  await page.goto(detailUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForTimeout(1200);
  const body = await page.locator("body").innerText().catch(() => "");
  if (isErrBody(body)) return false;
  const delBtn = page.locator("button").filter({ hasText: "Delete" }).first();
  if (!(await delBtn.count())) return false;
  await delBtn.click();
  await page.waitForTimeout(500);
  await page.locator(`[role="alertdialog"] button`).filter({ hasText: /Delete|Confirm/ }).first().click();
  await page.waitForTimeout(2500);
  return page.url().includes(backUrl);
}

async function cleanupListRecords(page, listBase, key) {
  for (let i = 0; i < 8; i++) {
    await page.goto(`${BASE}${listBase}?q=${encodeURIComponent(key)}`, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForTimeout(1000);
    const row = page.locator(`tr:has-text("${key}")`).first();
    if ((await row.count()) === 0) break;
    const eye = row.locator("a").first();
    if (!(await eye.count())) break;
    const detailUrl = (await eye.getAttribute("href")) || "";
    if (!detailUrl) break;
    await deleteViaDetailDialog(page, `${BASE}${detailUrl}`, listBase, key);
  }
}

async function testAll() {
try {
  // ============ STEP 1: LOGIN + PASSWORD CHANGE ============
  console.log("=== STEP 1: LOGIN + PASSWORD CHANGE (user@mti.com) ===");
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text()); });
  page.on("pageerror", (e) => pageErrors.push(String(e)));

  step("login user@mti.com / Usermit@12345", await login(page, USER_EMAIL, USER_PASS));

  step("change password -> TempMti@12345", await changePassword(page, USER_PASS, TEMP_PASS));
  await ctx.clearCookies();
  step("login with NEW password TempMti@12345", await login(page, USER_EMAIL, TEMP_PASS));
  step("change password back -> Usermit@12345", await changePassword(page, TEMP_PASS, USER_PASS));
  await ctx.clearCookies();
  step("login again with restored Usermit@12345", await login(page, USER_EMAIL, USER_PASS));

  await cleanupListRecords(page, "/customers", "TestCo");
  await cleanupListRecords(page, "/products", "TestProduct");

  // ============ STEP 2: CATEGORY ADD/DELETE ============
  console.log("=== STEP 2: CATEGORY ADD/DELETE ===");
  async function deleteMasterRows(namePart) {
    await page.goto(`${BASE}/masters/categories`, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForTimeout(1000);
    for (let i = 0; i < 10; i++) {
      const rows = page.locator(`tr:has-text("${namePart}")`);
      if ((await rows.count()) === 0) break;
      const btn = rows.first().locator("button.text-destructive");
      if (!(await btn.count())) break;
      await btn.click();
      await page.waitForTimeout(500);
      await page.locator(`[role="alertdialog"] button`).filter({ hasText: /Delete|Confirm/ }).first().click();
      await page.waitForTimeout(2000);
    }
  }
  await deleteMasterRows("TestCat");
  const catName = `TestCat ${Date.now()}`;
  await page.goto(`${BASE}/masters/categories`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForTimeout(1200);
  await page.locator("button").filter({ hasText: "Add Category" }).click();
  await page.waitForTimeout(400);
  await page.locator("#master-name").fill(catName);
  await page.locator('[role="dialog"] button[type="submit"]').click();
  await page.waitForTimeout(2000);
  let body = await page.locator("body").innerText().catch(() => "");
  step(`category create "${catName}"`, body.includes(catName) && !isErrBody(body));

  const catRow = page.locator(`tr:has-text("${catName}")`).first();
  step(`category row visible`, (await catRow.count()) === 1);
  await catRow.locator("button.text-destructive").click();
  await page.waitForTimeout(500);
  await page.locator(`[role="alertdialog"] button`).filter({ hasText: /Delete|Confirm/ }).first().click();
  await page.waitForTimeout(2000);
  body = await page.locator("body").innerText().catch(() => "");
  step(`category delete "${catName}"`, !body.includes(catName));

  // ============ STEP 3: CUSTOMER ADD/EDIT ============
  console.log("=== STEP 3: CUSTOMER ADD/EDIT ===");
  const coName = `TestCo ${Date.now()}`;
  await page.goto(`${BASE}/customers/new`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForTimeout(1200);
  step(`customer new back link`, await checkBackLink(page, "Back to Customers", "/customers"));
  await page.goto(`${BASE}/customers/new`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForTimeout(1000);
  await page.locator("#companyName").fill(coName);
  await page.locator("#city").fill("Karachi");
  await page.locator("#country").fill("Pakistan");
  await page.locator('button[type="submit"]').click();
  const custOk = await page.waitForURL(/\/customers\/[a-z0-9]{20,}$/, { timeout: 20000 }).then(() => true).catch(() => false);
  const custUrl = page.url();
  step(`customer create "${coName}" -> ${custUrl}`, custOk && /\/customers\/[a-z0-9]{20,}$/.test(custUrl));

  await page.waitForTimeout(1000);
  step(`customer view back link`, await checkBackLink(page, "Back to Customers", "/customers"));
  await page.goto(custUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForTimeout(1500);
  let cuEdit = page.locator("button").filter({ hasText: "Edit" }).first();
  let cuEditOk = true;
  try {
    await cuEdit.click({ timeout: 10000 });
  } catch {
    await page.goto(custUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForTimeout(1500);
    cuEdit = page.locator("button").filter({ hasText: "Edit" }).first();
    try {
      await cuEdit.click({ timeout: 10000 });
    } catch {
      cuEditOk = false;
    }
  }
  step(`customer open edit page`, cuEditOk);
  await page.waitForTimeout(1200);
  step(`customer edit page back link`, await checkBackLink(page, "Back to Customers", "/customers"));
  const custId = custUrl.split("/").pop();
  await page.goto(`${BASE}/customers/${custId}/edit`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForTimeout(1200);
  await page.locator("#companyName").fill(`${coName} (EDITED)`);
  await page.locator('button[type="submit"]').click();
  await page.waitForTimeout(2000);
  step(`customer edit -> "${coName} (EDITED)"`, page.url().includes("/customers/") && (await page.locator("body").innerText().catch(() => "")).includes("(EDITED)"));

  // ============ STEP 4: PRODUCT ADD/EDIT ============
  console.log("=== STEP 4: PRODUCT ADD/EDIT ===");
  const prodName = `TestProduct ${Date.now()}`;
  await page.goto(`${BASE}/products/new`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForTimeout(1200);
  step(`product new back link`, await checkBackLink(page, "Back to Products", "/products"));
  await page.goto(`${BASE}/products/new`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForTimeout(1000);
  await page.locator("#name").fill(prodName);
  await openCombo(page, "Select category");
  await chooseOption(page, "Valve");
  await page.locator('button[type="submit"]').click();
  const prodOk = await page.waitForURL(/\/products\/[a-z0-9]{20,}$/, { timeout: 20000 }).then(() => true).catch(() => false);
  const prodUrl = page.url();
  step(`product create "${prodName}" -> ${prodUrl}`, prodOk && /\/products\/[a-z0-9]{20,}$/.test(prodUrl));

  await page.waitForTimeout(1200);
  step(`product view back link`, await checkBackLink(page, "Back to Products", "/products"));
  await page.goto(prodUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForTimeout(1200);
  const editBtn = page.locator("a").filter({ hasText: "Edit" }).first();
  const editHref = (await editBtn.getAttribute("href")) || "";
  step(`product Edit button href -> /edit`, editHref.includes("/edit"), `(${editHref})`);
  const prodId = prodUrl.split("/").pop();
  await page.goto(`${BASE}/products/${prodId}/edit`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForTimeout(1200);
  step(`product edit page back link`, await checkBackLink(page, "Back to Products", "/products"));
  await page.goto(`${BASE}/products/${prodId}/edit`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForTimeout(1000);
  await page.locator("#name").fill(`${prodName} EDITED`);
  await page.locator('button[type="submit"]').click();
  await page.waitForTimeout(2500);
  step(`product edit -> "${prodName} EDITED"`, page.url().includes("/products/") && (await page.locator("body").innerText().catch(() => "")).includes("EDITED"));

  // ============ STEP 5: QUOTATION CREATE/EDIT/PDF/DUPLICATE/DELETE ============
  console.log("=== STEP 5: QUOTATION CREATE/EDIT/PDF/DUPLICATE/DELETE ===");
  await page.goto(`${BASE}/quotations/new`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForTimeout(1500);
  step(`quotation new back link`, await checkBackLink(page, "Back to Quotations", "/quotations"));
  await page.goto(`${BASE}/quotations/new`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForTimeout(1500);
  await openCombo(page, "Select customer");
  await chooseOption(page, `${coName} (EDITED)`);
  await page.locator("button").filter({ hasText: "Add Item" }).click();
  await page.waitForTimeout(800);
  await page.locator("button").filter({ hasText: "Select product" }).first().click();
  await page.waitForTimeout(800);
  await chooseOption(page, "Butterfly Valve");
  await page.waitForTimeout(1000);
  await openCombo(page, "Select size / range / UOM");
  await page.waitForTimeout(600);
  await page.locator(`[cmdk-item]`).first().click();
  await page.waitForTimeout(800);
  await page.locator('input[name="items.0.quantity"]').fill("2");
  await page.waitForTimeout(500);
  const qCustBtns = await page.locator("button").filter({ hasText: `${coName}` }).count();
  const qProdBtns = await page.locator("button").filter({ hasText: "Butterfly Valve" }).count();
  const qQty = await page.locator('input[name="items.0.quantity"]').inputValue().catch(() => "");
  console.log(`      [diag] before save custBtns=${qCustBtns} prodBtns=${qProdBtns} qty=${qQty}`);
  await page.locator('button[type="submit"]').click();
  const qOk = await page.waitForURL(/\/quotations\/[a-z0-9]{20,}$/, { timeout: 25000 }).then(() => true).catch(() => false);
  if (!qOk) {
    await page.waitForTimeout(1500);
    const errs = await page.locator("p.text-destructive").allTextContents().catch(() => []);
    console.log(`      [diag] save stay; validation errors: ${JSON.stringify(errs)}`);
  }
  const qUrl = page.url();
  step(`quotation create (DRAFT) -> ${qUrl}`, qOk && /\/quotations\/[a-z0-9]{20,}$/.test(qUrl));

  await page.waitForTimeout(1500);
  body = await page.locator("body").innerText().catch(() => "");
  const qNumMatch = body.match(/MTI20\d{3}/);
  step(`quotation number shown (${qNumMatch?.[0] ?? "MISSING"})`, !!qNumMatch && body.includes("Draft"));
  step(`quotation view back link`, await checkBackLink(page, "Back to Quotations", "/quotations"));

  const pdfResp = await ctx.request.get(`${BASE}/api/quotations/${qUrl.split("/").pop()}/pdf`, { timeout: 45000 });
  const pdfBuf = await pdfResp.body();
  const pdfType = pdfResp.headers()["content-type"] || "";
  step(`quotation PDF generation (status=${pdfResp.status()} size=${pdfBuf.length})`, pdfResp.status() === 200 && pdfType.includes("application/pdf") && pdfBuf.length > 10000 && pdfBuf.slice(0, 4).toString() === "%PDF");

  await page.goto(`${qUrl}/edit`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForTimeout(1500);
  step(`quotation edit page back link`, await checkBackLink(page, "Back to Quotations", "/quotations"));
  await page.goto(`${qUrl}/edit`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForTimeout(2000);
  await page.locator('input[name="items.0.quantity"]').fill("3");
  await page.locator('button[type="submit"]').click();
  await page.waitForTimeout(2000);
  step(`quotation edit (qty 2->3)`, page.url().includes(`/quotations/${qUrl.split("/").pop()}`));

  await page.waitForTimeout(1200);
  await page.locator("button").filter({ hasText: "Duplicate" }).first().click();
  await page.waitForTimeout(600);
  await page.locator(`[role="alertdialog"] button`).filter({ hasText: "Duplicate" }).first().click();
  await page.waitForTimeout(3000);
  const dupUrl = page.url();
  step(`quotation duplicate As New -> ${dupUrl}`, /\/quotations\/[a-z0-9]{20,}$/.test(dupUrl) && dupUrl !== qUrl);

  await page.waitForTimeout(1200);
  step(`duplicate view back link`, await checkBackLink(page, "Back to Quotations", "/quotations"));
  step(`quotation delete (dup)`, await deleteViaDetailDialog(page, dupUrl, "/quotations", ""));
  step(`quotation delete (original)`, await deleteViaDetailDialog(page, qUrl, "/quotations", ""));

  // ============ STEP 6: DELETE CUSTOMER + PRODUCT ============
  console.log("=== STEP 6: DELETE CUSTOMER + PRODUCT ===");
  step(`customer delete`, await deleteViaDetailDialog(page, custUrl, "/customers", ""));
  step(`product delete`, await deleteViaDetailDialog(page, prodUrl, "/products", ""));

  // ============ STEP 7: OTHER PAGES REACHABILITY ============
  console.log("=== STEP 7: OTHER PAGES REACHABILITY ===");
  for (const p of ["/masters/categories", "/masters/uom", "/settings/company", "/settings/quotation", "/settings/tax"]) {
    await page.goto(`${BASE}${p}`, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForTimeout(1000);
    page.locator("body").innerText().then((t) => step(`page ${p}`, !isErrBody(t) && !t.trim().startsWith("Application error")));
  }
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForTimeout(1000);
  const loginBody = await page.locator("body").innerText().catch(() => "");
  step(`forgot-password hint removed from login`, !loginBody.includes("Ask a Super Admin"));

  await page.goto(`${BASE}/customers/new`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForTimeout(1000);
  step(`back link present on others new pages`, (await page.locator("a").filter({ hasText: "Back to Customers" }).count()) === 1);

  console.log("");
  console.log("########## A-Z TEST RESULT ##########");
  console.log(`  TOTAL PASS: ${totalPass}`);
  console.log(`  TOTAL FAIL: ${totalFail}`);
  console.log(`  Console errors: ${consoleErrors.length}`);
  consoleErrors.forEach((e) => console.log("    - " + String(e).slice(0, 200)));
  console.log(`  Page errors: ${pageErrors.length}`);
  pageErrors.forEach((e) => console.log("    - " + String(e).slice(0, 200)));
  await ctx.close();
} finally {
  await browser.close();
}
}

const browser = await chromium.launch({ headless: true });
await testAll();
process.exit(totalFail === 0 ? 0 : 1);