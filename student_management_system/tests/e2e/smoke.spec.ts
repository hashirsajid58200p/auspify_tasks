import { test, expect } from "@playwright/test";

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || "admin@studentms.internal";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || "AdminStrongPass123!";

test.describe("Student Management System Smoke Test", () => {
  test("admin logs in, creates a class, adds a student, edits it, searches for it, deletes it", async ({
    page,
  }) => {
    // 1. Admin logs in
    await page.goto("/login");
    await expect(page).toHaveTitle(/Student Management System/i);

    await page.fill("input#email", ADMIN_EMAIL);
    await page.fill("input#password", ADMIN_PASSWORD);
    await page.click('button[type="submit"]');

    // Expect redirect to dashboard
    await page.waitForURL("**/dashboard", { timeout: 15000 });
    await expect(page.locator("h1")).toContainText(/Institutional Dashboard/i);

    // 2. Navigate to Classes and create a class
    await page.goto("/classes");
    await expect(page.locator("h1")).toContainText(/Classes/i);

    await page.click('button:has-text("Add Class")');
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    const className = `Grade 11 - Smoke ${Date.now()}`;
    await page.fill("input#className", className);
    await page.fill("input#gradeLevel", "Grade 11");
    await page.fill("input#capacity", "28");
    await page.fill("input#homeroomTeacher", "Dr. Smoke Test");

    await page.click('button:has-text("Create Class")');
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
    await expect(page.getByRole("cell", { name: className, exact: true })).toBeVisible({
      timeout: 10000,
    });

    // 3. Navigate to Students and enroll a student in that class
    await page.goto("/students");
    await expect(page.locator("h1")).toContainText(/Students/i);

    await page.click('button:has-text("Add Student")');
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    const studentUniqueSuffix = Date.now().toString().slice(-4);
    const testStudentId = `STU-E2E-${studentUniqueSuffix}`;

    await page.fill("input#studentId", testStudentId);

    // Select the newly created class
    const classSelect = page.locator("select#classId");
    await classSelect.selectOption({ label: `${className} (Grade 11)` });

    await page.fill("input#firstName", "Avery");
    await page.fill("input#lastName", "Testington");
    await page.fill("input#dob", "2009-03-15");
    await page.selectOption("select#gender", "FEMALE");
    await page.fill("input#guardianName", "Patricia Testington");
    await page.fill("input#guardianPhone", "+1-555-4321");
    await page.fill("input#guardianEmail", "patricia@fictional.internal");

    await page.click('button:has-text("Register Student")');
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();

    // 4. Search for the student
    const searchInput = page.locator('input[placeholder="Search ID or name..."]');
    await searchInput.fill(testStudentId);
    await page.waitForTimeout(600); // Debounce / query refresh

    await expect(page.getByRole("cell", { name: testStudentId, exact: true })).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByRole("link", { name: "Avery Testington" })).toBeVisible();

    // 5. Open student detail page
    await page.getByRole("link", { name: "Avery Testington" }).click();
    await page.waitForURL(/\/students\/[a-f0-9]+/, { timeout: 10000 });

    // Verify sensitive PII is displayed on detail page
    await expect(page.getByText("Patricia Testington")).toBeVisible();
    await expect(page.getByText("+1-555-4321")).toBeVisible();
    await expect(page.getByText("patricia@fictional.internal")).toBeVisible();

    // 6. Edit the student profile
    await page.click('button:has-text("Edit Profile")');
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    await page.fill("input#firstName", "Avril");
    await page.click('button:has-text("Save Changes")');
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();

    // Verify name updated on detail view
    await expect(page.locator("h1")).toContainText(/Avril Testington/i);

    // 7. Delete the student with typed confirmation
    await page.getByRole("button", { name: "Delete" }).click();
    await expect(page.locator('[role="alertdialog"]')).toBeVisible();

    const confirmInput = page.locator("input#confirmationInput");
    await confirmInput.fill(testStudentId);

    await page.getByRole("button", { name: "Permanently Delete" }).click();
    await expect(page.locator('[role="alertdialog"]')).not.toBeVisible();

    // Verify redirect back to student directory
    await page.waitForURL("**/students", { timeout: 10000 });

    // Verify student is gone
    await searchInput.fill(testStudentId);
    await page.waitForTimeout(600);
    await expect(page.locator("text=No students found")).toBeVisible();

    // 8. Clean up created class
    await page.goto("/classes");
    await expect(page.getByRole("cell", { name: className, exact: true })).toBeVisible();

    await page.click(`button[aria-label="Delete ${className}"]`);
    await expect(page.locator('[role="alertdialog"]')).toBeVisible();
    await page.click('button:has-text("Delete Class")');
    await expect(page.locator('[role="alertdialog"]')).not.toBeVisible();
    await expect(page.getByRole("cell", { name: className, exact: true })).not.toBeVisible({
      timeout: 10000,
    });
  });
});
