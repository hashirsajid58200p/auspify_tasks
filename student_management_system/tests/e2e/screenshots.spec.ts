import { test } from "@playwright/test";
import path from "path";
import fs from "fs";

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || "admin@studentms.internal";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || "AdminStrongPass123!";

const SCREENSHOT_DIR = path.resolve(process.cwd(), "docs/screenshots");

test.beforeAll(() => {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }
});

test("capture desktop and mobile screenshots of all main screens", async ({ browser }) => {
  // 1. Desktop Screenshots (1440x900)
  const desktopContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const desktopPage = await desktopContext.newPage();

  // Login Page (Desktop)
  await desktopPage.goto("/login");
  await desktopPage.waitForLoadState("networkidle");
  await desktopPage.screenshot({
    path: path.join(SCREENSHOT_DIR, "01-login-desktop.png"),
    fullPage: true,
  });

  // Perform Login
  await desktopPage.fill("input#email", ADMIN_EMAIL);
  await desktopPage.fill("input#password", ADMIN_PASSWORD);
  await desktopPage.click('button[type="submit"]');
  await desktopPage.waitForURL("**/dashboard");
  await desktopPage.waitForLoadState("networkidle");
  await desktopPage.waitForTimeout(500);

  // Dashboard (Desktop)
  await desktopPage.screenshot({
    path: path.join(SCREENSHOT_DIR, "02-dashboard-desktop.png"),
    fullPage: true,
  });

  // Classes Page (Desktop)
  await desktopPage.goto("/classes");
  await desktopPage.waitForLoadState("networkidle");
  await desktopPage.waitForTimeout(500);
  await desktopPage.screenshot({
    path: path.join(SCREENSHOT_DIR, "03-classes-desktop.png"),
    fullPage: true,
  });

  // Students Directory (Desktop)
  await desktopPage.goto("/students");
  await desktopPage.waitForLoadState("networkidle");
  await desktopPage.waitForTimeout(500);
  await desktopPage.screenshot({
    path: path.join(SCREENSHOT_DIR, "04-students-list-desktop.png"),
    fullPage: true,
  });

  // Student Detail Page (Desktop)
  const firstStudentLink = desktopPage.locator('a[href^="/students/"]').first();
  await firstStudentLink.click();
  await desktopPage.waitForURL(/\/students\/[a-f0-9]+/);
  await desktopPage.waitForLoadState("networkidle");
  await desktopPage.waitForTimeout(500);
  await desktopPage.screenshot({
    path: path.join(SCREENSHOT_DIR, "05-student-detail-desktop.png"),
    fullPage: true,
  });

  // Staff Management (Desktop)
  await desktopPage.goto("/admin/staff");
  await desktopPage.waitForLoadState("networkidle");
  await desktopPage.waitForTimeout(500);
  await desktopPage.screenshot({
    path: path.join(SCREENSHOT_DIR, "06-staff-management-desktop.png"),
    fullPage: true,
  });

  // Settings Page (Desktop)
  await desktopPage.goto("/settings");
  await desktopPage.waitForLoadState("networkidle");
  await desktopPage.waitForTimeout(500);
  await desktopPage.screenshot({
    path: path.join(SCREENSHOT_DIR, "07-settings-desktop.png"),
    fullPage: true,
  });

  await desktopContext.close();

  // 2. Mobile Screenshots (390x844 - iPhone 14 style)
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
  });
  const mobilePage = await mobileContext.newPage();

  // Login Page (Mobile)
  await mobilePage.goto("/login");
  await mobilePage.waitForLoadState("networkidle");
  await mobilePage.screenshot({
    path: path.join(SCREENSHOT_DIR, "01-login-mobile.png"),
  });

  // Perform Login
  await mobilePage.fill("input#email", ADMIN_EMAIL);
  await mobilePage.fill("input#password", ADMIN_PASSWORD);
  await mobilePage.click('button[type="submit"]');
  await mobilePage.waitForURL("**/dashboard");
  await mobilePage.waitForLoadState("networkidle");
  await mobilePage.waitForTimeout(500);

  // Dashboard (Mobile)
  await mobilePage.screenshot({
    path: path.join(SCREENSHOT_DIR, "02-dashboard-mobile.png"),
  });

  // Classes Page (Mobile)
  await mobilePage.goto("/classes");
  await mobilePage.waitForLoadState("networkidle");
  await mobilePage.waitForTimeout(500);
  await mobilePage.screenshot({
    path: path.join(SCREENSHOT_DIR, "03-classes-mobile.png"),
  });

  // Students Directory (Mobile)
  await mobilePage.goto("/students");
  await mobilePage.waitForLoadState("networkidle");
  await mobilePage.waitForTimeout(500);
  await mobilePage.screenshot({
    path: path.join(SCREENSHOT_DIR, "04-students-list-mobile.png"),
  });

  // Student Detail Page (Mobile)
  const mobileStudentLink = mobilePage.locator('a[href^="/students/"]:visible').first();
  await mobileStudentLink.click();
  await mobilePage.waitForURL(/\/students\/[a-f0-9]+/);
  await mobilePage.waitForLoadState("networkidle");
  await mobilePage.waitForTimeout(500);
  await mobilePage.screenshot({
    path: path.join(SCREENSHOT_DIR, "05-student-detail-mobile.png"),
  });

  // Staff Management (Mobile)
  await mobilePage.goto("/admin/staff");
  await mobilePage.waitForLoadState("networkidle");
  await mobilePage.waitForTimeout(500);
  await mobilePage.screenshot({
    path: path.join(SCREENSHOT_DIR, "06-staff-management-mobile.png"),
  });

  // Settings Page (Mobile)
  await mobilePage.goto("/settings");
  await mobilePage.waitForLoadState("networkidle");
  await mobilePage.waitForTimeout(500);
  await mobilePage.screenshot({
    path: path.join(SCREENSHOT_DIR, "07-settings-mobile.png"),
  });

  await mobileContext.close();
});
