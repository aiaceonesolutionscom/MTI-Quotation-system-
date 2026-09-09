import { chromium } from "playwright";
import pg from "pg";
import process from "node:process";

process.loadEnvFile(".env");
const { Client } = pg;

const BASE = "http://localhost:3001";
const PASS = [];
const FAIL = [];
const check = (name, ok, extra = "") => {
  (ok ? PASS : FAIL).push(`${ok ? "PASS" : "FAIL"} | ${name}${extra ? " | " + extra : ""}`);
  console.log(`${ok ? "PASS" : "FAIL"} | ${name}${extra ? " | " + extra : ""}`);
};

const db = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
const q = async (sql, ...params) => (await db.query(sql, params)).rows;
const count1 = async (sql, ...params) => Number((await q(sql, ...params))[0].c);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const pageErrors = [];
const consoleErrors = [];
const httpBad = [];
page.on("pageerror", (e) => pageErrors.push(String(e)));
page.on("console", (m) => {
  if (m.type() === "error") consoleErrors.push(String(m.text()));
});
page.on("response", (r) => {
  if (r.status() >= 400 && !r.url().includes("/api/quotations/") && !r.url().endsWith(".map")) httpBad.push(`${r.status()} ${r.url().replace(BASE, "")}`);
});

async function goto(path, opts = {}) {
  const r = await page.goto(BASE + path, { waitUntil: "networkidle", ...opts });
  return r;
}
async function pickOption(placeholderOrText, optionText, opts = {}) {
  const trigger = page.locator("button[data-slot='popover-trigger'], button[data-slot='combobox-trigger']");
  const anyTrigger = page
    .locator("button")
    .filter({ hasText: placeholderOrText })
    .first();
  await anyTrigger.click();
  await page.waitForTimeout(250);
  const option = page.locator('[role="option"], [data-slot="command-item"]').filter({ hasText: optionText }).first();
  await option.click({ timeout: 8000 });
  await page.waitForTimeout(300);
}
async function pickFirstOption(placeholderText) {
  const trigger = page.locator("button").filter({ hasText: placeholderText }).first();
  await trigger.click();
  await page.waitForTimeout(250);
  await page.locator('[role="option"], [data-slot="command-item"]').first().click({ timeout: 8000 });
  await page.waitForTimeout(400);
}
async function pickSelect(triggerHasText, optionText) {
  const trigger = page.locator("[data-slot='select-trigger']").filter({ hasText: triggerHasText }).first();
  await trigger.click();
  await page.waitForTimeout(250);
  const option = page.locator('[role="option"], [data-slot="select-item"]').filter({ hasText: optionText }).first();
  await option.click({ timeout: 8000 });
  await page.waitForTimeout(300);
}

try {
  await db.connect();

  // ---------- BASE DATA ----------
  const c0 = {
    customers: await count1("SELECT count(*)::int c FROM customers"),
    products: await count1("SELECT count(*)::int c FROM products"),
    quotations: await count1("SELECT count(*)::int c FROM quotations"),
    categories: await count1("SELECT count(*)::int c FROM categories"),
    uoms: await count1("SELECT count(*)::int c FROM uoms"),
    sizes: await count1("SELECT count(*)::int c FROM sizes"),
    ranges: await count1("SELECT count(*)::int c FROM range_types"),
  };
  console.log("BASE COUNTS:", JSON.stringify(c0));

  const custId = (await q("SELECT id FROM customers ORDER BY \"createdAt\" LIMIT 1"))[0]?.id ?? "";
  const prodId = (await q("SELECT id FROM products ORDER BY \"createdAt\" LIMIT 1"))[0]?.id ?? "";
  const quotId =
    (await q("SELECT id FROM quotations ORDER BY \"createdAt\" DESC LIMIT 1"))[0]?.id ?? "";
  const sizeCatName = (await q(
    "SELECT c.name FROM categories c JOIN sizes s ON s.\"categoryId\" = c.id GROUP BY c.name ORDER BY count(*) DESC LIMIT 1"
  ))[0]?.name ?? "";

  async function pickCategory() {
    const trigger = page.locator("button").filter({ hasText: "Select category" }).first();
    await trigger.click();
    await page.waitForTimeout(300);
    await page.locator('[role="option"], [data-slot="command-item"]').filter({ hasText: sizeCatName }).first().click({ timeout: 8000 });
    await page.waitForTimeout(1200);
  }

  // ---------- LOGIN ----------
  await goto("/login");
  await page.fill("#email", "superadmin@mti.com");
  await page.fill("#password", "SuperAdmin@123");
  await Promise.all([page.waitForURL("**/dashboard**"), page.click('button[type="submit"]')]);
  await page.waitForLoadState("networkidle");
  check("Login", page.url().includes("/dashboard"));

  // ---------- ROUTE SWEEP ----------
  const routes = [
    "/dashboard",
    "/products",
    "/products/new",
    prodId ? `/products/${prodId}/edit` : "/products",
    "/customers",
    "/customers/new",
    custId ? `/customers/${custId}/edit` : "/customers",
    "/quotations",
    "/quotations/new",
    quotId ? `/quotations/${quotId}` : "/quotations",
    quotId ? `/quotations/${quotId}/edit` : "/quotations",
    "/masters/categories",
    "/masters/uom",
    "/settings/company",
    "/settings/quotation",
    "/settings/tax",
    "/profile",
  ];
  for (const r of routes) {
    const res = await goto(r);
    check(`Route ${r}`, res.status() === 200, `status=${res.status()}`);
  }

  // ---------- DASHBOARD UI ----------
  await goto("/dashboard");
  await page.waitForTimeout(800);
  check("Dashboard stat cards", (await page.getByText("Total Quotations").count()) > 0);
  check("Dashboard New Quotation btn", (await page.getByText("New Quotation").count()) > 0);
  check("Dashboard Add Product btn", (await page.getByText("Add Product").count()) > 0);
  check("Dashboard Add Customer btn", (await page.getByText("Add Customer").count()) > 0);
  check("Dashboard View Quotation History btn", (await page.getByText("View Quotation History").count()) > 0);

  // ---------- PRODUCTS LIST UI ----------
  await goto("/products");
  await page.waitForTimeout(600);
  check("Products search box", (await page.locator('input[placeholder="Search products…"]').count()) > 0);
  const pt = await page.evaluate(() => Array.from(document.querySelectorAll("[data-slot='select-trigger']")).map((x) => String(x.innerText).trim()).filter(Boolean));
  check("Products All Categories dropdown", pt.includes("All Categories"));
  check("Products All Status dropdown", pt.includes("All Status"));
  check("Products table", (await page.locator("table").count()) > 0);
  check("Products new btn", (await page.getByText("Add Product").count()) > 0);

  // ---------- CUSTOMERS LIST UI ----------
  await goto("/customers");
  await page.waitForTimeout(600);
  check("Customers search box", (await page.locator('input[placeholder="Search customers…"]').count()) > 0);
  const ct = await page.evaluate(() => Array.from(document.querySelectorAll("[data-slot='select-trigger']")).map((x) => String(x.innerText).trim()).filter(Boolean));
  check("Customers All Status dropdown", ct.includes("All Status"));
  check("Customers table", (await page.locator("table").count()) > 0);
  check("Customers new btn", (await page.getByText("Add Customer").count()) > 0);

  // ---------- QUOTATIONS LIST UI ----------
  await goto("/quotations");
  await page.waitForTimeout(600);
  check("Quotations search box", (await page.locator('input[placeholder="Quotation #…"]').count()) > 0);
  check("Quotations Start Date field", (await page.locator('input[aria-label="Start Date (MM/DD/YYYY)"]').count()) === 1);
  check("Quotations End Date field", (await page.locator('input[aria-label="End Date (MM/DD/YYYY)"]').count()) === 1);
  const qt = await page.evaluate(() => Array.from(document.querySelectorAll("[data-slot='select-trigger']")).map((x) => String(x.innerText).trim()).filter(Boolean));
  check("Quotations All Status dropdown", qt.includes("All Status"));
  for (const quick of ["Today", "This Week", "This Month", "Expired", "Expiring Soon", "Active"]) {
    check(`Quotations quick filter ${quick}`, (await page.getByText(quick, { exact: true }).count()) > 0);
  }
  check("Quotations New btn", (await page.getByText("New Quotation").count()) > 0);

  // ---------- MASTERS UI ----------
  await goto("/masters/categories");
  await page.waitForTimeout(600);
  check("Categories search box", (await page.locator('input[placeholder="Search categories…"]').count()) > 0);
  check("Categories table", (await page.locator("table").count()) > 0);
  check("Categories Add btn", (await page.getByText("Add Category").count()) > 0);
  check("Categories Sizes & Ranges btn", (await page.getByText("Sizes & Ranges").count()) > 0);

  await goto("/masters/uom");
  await page.waitForTimeout(600);
  check("UOM search box", (await page.locator('input[placeholder="Search UOM/UOC…"]').count()) > 0);
  check("UOM table", (await page.locator("table").count()) > 0);

  // ---------- SETTINGS UI ----------
  for (const [path, label] of [
    ["/settings/company", "Company Settings"],
    ["/settings/quotation", "Quotation Settings"],
    ["/settings/tax", "Tax Settings"],
  ]) {
    await goto(path);
    await page.waitForTimeout(500);
    check(`Settings page ${path} loads`, (await page.locator("form").count()) > 0 || (await page.locator("button[type='submit']").count()) > 0);
  }

  // ---------- PROFILE UI ----------
  await goto("/profile");
  await page.waitForTimeout(500);
  check("Profile page loads", (await page.locator("form").count()) > 0);

  // ================= POSITIVE CREATE FLOWS =================
  // P1: Create customer
  await goto("/customers/new");
  const custName = `A-Z Test Customer ${Date.now()}`;
  await page.fill("#companyName", custName);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2500);
  const custCreated = (await count1("SELECT count(*)::int c FROM customers WHERE \"companyName\"=$1", custName)) === 1;
  check("Create customer (positive)", custCreated);

  // P2: Create category via dialog
  await goto("/masters/categories");
  const catName = `A-Z Cat ${Date.now()}`;
  await page.locator("[data-slot='dialog-trigger']").first().click();
  await page.waitForTimeout(300);
  await page.fill("#master-name", catName);
  await page.click('[data-slot="dialog-content"] button[type="submit"]');
  await page.waitForTimeout(2000);
  check("Create category via dialog (positive)", (await count1("SELECT count(*)::int c FROM categories WHERE name=$1", catName)) === 1);

  // P3: Create UOM via dialog
  await goto("/masters/uom");
  const uomName = `A-Z UOM ${Date.now()}`;
  await page.locator("[data-slot='dialog-trigger']").first().click();
  await page.waitForTimeout(300);
  await page.fill("#master-name", uomName);
  await page.click('[data-slot="dialog-content"] button[type="submit"]');
  await page.waitForTimeout(2000);
  check("Create UOM via dialog (positive)", (await count1("SELECT count(*)::int c FROM uoms WHERE name=$1", uomName)) === 1);

  // P4: Create product with a rate
  await goto("/products/new");
  const prodName = `A-Z Test Product ${Date.now()}`;
  await page.fill("#name", prodName);
  await pickCategory();
  await page.waitForTimeout(1200);
  await page.locator('form#product-form button', { hasText: "Add Rate" }).click();
  await page.waitForTimeout(400);
  await pickFirstOption("Size");
  await page.waitForTimeout(300);
  await pickFirstOption("Range");
  await pickFirstOption("UOM");
  await page.fill('input[name="rates.0.rate"]', "1234.56");
  await page.click('button[type="submit"][form="product-form"], form#product-form button[type="submit"]');
  await page.waitForTimeout(2500);
  const prodCreated = (await count1("SELECT count(*)::int c FROM products WHERE name=$1", prodName)) === 1;
  check("Create product with rate (positive)", prodCreated);

  // P5: Create quotation (full happy path)
  await goto("/quotations");
  await page.locator("a[href='/quotations/new']").first().click();
  await page.waitForURL("**/quotations/new**");
  await page.waitForTimeout(800);
  await pickFirstOption("Select customer");
  await page.waitForTimeout(300);
  await page.getByText("Add Item", { exact: true }).click();
  await page.waitForTimeout(500);
  await pickFirstOption("Select product");
  await page.waitForTimeout(1500);
  await pickFirstOption("Select size / range / UOM");
  await page.fill('input[name="items.0.quantity"]', "3");
  await page.click('button[type="submit"]');
  let savedId = "";
  try {
    await page.waitForURL(/\/quotations\/(?!new)[a-zA-Z0-9]+\/?$/, { timeout: 15000 });
    savedId = page.url().split("/").pop().split("?")[0];
  } catch {}
  check("Quotation Save Draft redirects", !!savedId, `id=${savedId}`);
  if (savedId) {
    await page.waitForTimeout(1500);
    const body = await page.evaluate(() => document.body.innerText);
    check("Quotation view Grand Total", body.includes("Grand Total"));
    const qtyStored = (await q("SELECT quantity::int qty FROM quotation_items WHERE \"quotationId\"=$1 ORDER BY \"sortOrder\" LIMIT 1", savedId))[0];
    check("Quotation qty stored as int 3", qtyStored?.qty === 3, String(qtyStored?.qty));
    const pdfStatus = await page.evaluate((id) => fetch(`/api/quotations/${id}/pdf`).then((r) => ({ s: r.status, ct: r.headers.get("content-type") })), savedId);
    check("Quotation PDF api 200", pdfStatus.s === 200 && (pdfStatus.ct || "").includes("pdf"));
    // status changer
    await pickSelect("Draft", "Generated");
    await page.waitForTimeout(1500);
    const newStatus = (await q("SELECT status FROM quotations WHERE id=$1", savedId))[0]?.status;
    check("Quotation status change to GENERATED", newStatus === "GENERATED", newStatus);
  }

  // ================= NEGATIVE TESTS =================
  const checkUnchanged = async (label, table, before) => {
    const after = await count1(`SELECT count(*)::int c FROM ${table}`);
    check(label, after === before, `before=${before} after=${after}`);
  };

  // N1: decimal quantity
  {
    const before = c0.quotations + 1;
    await goto("/quotations/new");
    await page.waitForTimeout(600);
    await pickFirstOption("Select customer");
    await page.getByText("Add Item", { exact: true }).click();
    await pickFirstOption("Select product");
    await page.waitForTimeout(1500);
    await pickFirstOption("Select size / range / UOM");
    await page.fill('input[name="items.0.quantity"]', "2.5");
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1500);
    const body = await page.evaluate(() => document.body.innerText);
    check("NEG qty decimal blocked + message", body.includes("whole number"));
    check("NEG qty decimal stays on form", page.url().includes("/quotations/new"));
    check("NEG qty decimal NOT stored", (await count1("SELECT count(*)::int c FROM quotations")) === before, `exp=${before}`);
  }

  // N2: negative quantity
  {
    const before = await count1("SELECT count(*)::int c FROM quotations");
    await goto("/quotations/new");
    await page.waitForTimeout(600);
    await pickFirstOption("Select customer");
    await page.getByText("Add Item", { exact: true }).click();
    await pickFirstOption("Select product");
    await page.waitForTimeout(1500);
    await pickFirstOption("Select size / range / UOM");
    await page.fill('input[name="items.0.quantity"]', "-3");
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1500);
    const body = await page.evaluate(() => document.body.innerText);
    check("NEG qty -3 blocked + message", body.includes("whole number"));
    check("NEG qty -3 NOT stored", (await count1("SELECT count(*)::int c FROM quotations")) === before);
  }

  // N3: negative rate override
  {
    const before = await count1("SELECT count(*)::int c FROM quotations");
    await goto("/quotations/new");
    await page.waitForTimeout(600);
    await pickFirstOption("Select customer");
    await page.getByText("Add Item", { exact: true }).click();
    await pickFirstOption("Select product");
    await page.waitForTimeout(1500);
    await pickFirstOption("Select size / range / UOM");
    await page.click('label[for="override-0"]');
    await page.fill('input[name="items.0.finalRate"]', "-5");
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1500);
    const body = await page.evaluate(() => document.body.innerText);
    check("NEG rate -5 blocked + message", body.includes("zero or greater"));
    check("NEG rate -5 NOT stored", (await count1("SELECT count(*)::int c FROM quotations")) === before);
  }

  // N4: negative discount
  {
    const before = await count1("SELECT count(*)::int c FROM quotations");
    await goto("/quotations/new");
    await page.waitForTimeout(600);
    await pickSelect("NONE", "Fixed Amount");
    await page.fill("#discountValue", "-50");
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1500);
    const body = await page.evaluate(() => document.body.innerText);
    check("NEG discount -50 blocked + message", body.includes("Too small: expected number to be >=0"));
    check("NEG discount -50 NOT stored", (await count1("SELECT count(*)::int c FROM quotations")) === before);
  }

  // N5: GST > 100
  {
    const before = await count1("SELECT count(*)::int c FROM quotations");
    await goto("/quotations/new");
    await page.waitForTimeout(600);
    await page.fill("#gstPercent", "150");
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1500);
    const body = await page.evaluate(() => document.body.innerText);
    check("NEG GST 150 blocked + message", body.includes("Too big: expected number to be <=100"));
    check("NEG GST 150 NOT stored", (await count1("SELECT count(*)::int c FROM quotations")) === before);
  }

  // N6: empty customer name
  {
    const before = await count1("SELECT count(*)::int c FROM customers");
    await goto("/customers/new");
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
    const body = await page.evaluate(() => document.body.innerText);
    check("NEG empty customer blocked + msg", body.includes("Company name is required"));
    check("NEG empty customer NOT stored", (await count1("SELECT count(*)::int c FROM customers")) === before);
  }

  // N7: empty product name
  {
    await goto("/products/new");
    await page.click('button[type="submit"][form="product-form"], form#product-form button[type="submit"]');
    await page.waitForTimeout(1000);
    const body = await page.evaluate(() => document.body.innerText);
    check("NEG empty product blocked + msg", body.includes("Product name is required"));
  }

  // N8: negative rate on product
  {
    const before = await count1("SELECT count(*)::int c FROM products");
    await goto("/products/new");
    await page.fill("#name", "NEG Product " + Date.now());
    await pickCategory();
    await page.waitForTimeout(1000);
await page.locator('form#product-form button', { hasText: "Add Rate" }).click();
    await page.waitForTimeout(300);
    await page.fill('input[name="rates.0.rate"]', "-10");
    await page.click('button[type="submit"][form="product-form"], form#product-form button[type="submit"]');
    await page.waitForTimeout(1500);
    const body = await page.evaluate(() => document.body.innerText);
    check("NEG product rate -10 blocked + msg", body.includes("zero or greater"));
    check("NEG product rate -10 NOT stored", (await count1("SELECT count(*)::int c FROM products")) === before);
  }

  // N9: empty category name
  {
    const before = await count1("SELECT count(*)::int c FROM categories");
    await goto("/masters/categories");
    await page.locator("[data-slot='dialog-trigger']").first().click();
    await page.waitForTimeout(300);
    await page.click('[data-slot="dialog-content"] button[type="submit"]');
    await page.waitForTimeout(800);
    const body = await page.evaluate(() => document.body.innerText);
    check("NEG empty category blocked + msg", body.includes("Name is required"));
    check("NEG empty category NOT stored", (await count1("SELECT count(*)::int c FROM categories")) === before);
  }

  // N10: empty UOM name
  {
    const before = await count1("SELECT count(*)::int c FROM uoms");
    await goto("/masters/uom");
    await page.locator("[data-slot='dialog-trigger']").first().click();
    await page.waitForTimeout(300);
    await page.click('[data-slot="dialog-content"] button[type="submit"]');
    await page.waitForTimeout(800);
    const body = await page.evaluate(() => document.body.innerText);
    check("NEG empty UOM blocked + msg", body.includes("Name is required"));
    check("NEG empty UOM NOT stored", (await count1("SELECT count(*)::int c FROM uoms")) === before);
  }

  // ---------- REPORT ----------
  console.log("\n=== REPORT ===");
  console.log(`PASS: ${PASS.length}  FAIL: ${FAIL.length}`);
  if (pageErrors.length) console.log("\nPAGE ERRORS:", JSON.stringify(pageErrors.slice(0, 3), null, 1));
  if (consoleErrors.length) console.log("\nCONSOLE ERRORS:", JSON.stringify(consoleErrors.slice(0, 5), null, 1));
  if (httpBad.length) console.log("\nHTTP >=400:", JSON.stringify(httpBad.slice(0, 10), null, 1));
} catch (err) {
  console.error("\nAUDIT CRASHED:", err);
  console.log("FINAL PASS", PASS.length, "FAIL", FAIL.length);
} finally {
  await browser.close();
  await db.end();
}
