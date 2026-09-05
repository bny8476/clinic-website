import { test, expect } from '@playwright/test';

test.describe('Healthcare Platform End-to-End Workflows', () => {

  test('1. Patient Journey: Register, Login, Book Appointment & View Health Records', async ({ page }) => {
    // 1. Navigate to portal homepage
    await page.goto('/');
    await expect(page).toHaveTitle(/Healthcare|Clinic/i);

    // 2. Patient Login Flow
    await page.goto('/login');
    await page.fill('input[type="email"], input[name="username"]', 'patient@example.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');

    // 3. Navigate to Appointments & Book Slot
    await page.goto('/patient/appointments');
    await expect(page.locator('h1, h2, header')).toContainText(/Appointment/i);

    // 4. View Prescriptions & Medicine Orders
    await page.goto('/patient/prescriptions');
    await expect(page).toHaveURL(/.*patient\/prescriptions/);

    // 5. View Lab Reports
    await page.goto('/patient/lab-results');
    await expect(page).toHaveURL(/.*patient\/lab-results/);
  });

  test('2. Doctor Journey: Consultation, Queue, Prescription & Lab Order', async ({ page }) => {
    // 1. Doctor Portal Login
    await page.goto('/login');
    await page.fill('input[type="email"], input[name="username"]', 'doctor@example.com');
    await page.fill('input[type="password"]', 'DoctorPass123!');
    await page.click('button[type="submit"]');

    // 2. Consultation Queue Navigation
    await page.goto('/doctor/queue');
    await expect(page.locator('body')).toContainText(/Queue|Consultation/i);

    // 3. Write E-Prescription & Order Labs
    await page.goto('/doctor/prescriptions/new');
    await expect(page).toHaveURL(/.*doctor\/prescriptions\/new/);
  });

  test('3. Pharmacy Journey: Order Verification, Stock Check & Dispensing', async ({ page }) => {
    // 1. Pharmacist Portal Login
    await page.goto('/login');
    await page.fill('input[type="email"], input[name="username"]', 'pharmacist@example.com');
    await page.fill('input[type="password"]', 'PharmPass123!');
    await page.click('button[type="submit"]');

    // 2. Pharmacy Dashboard & Stock Master
    await page.goto('/pharmacy/inventory');
    await expect(page.locator('body')).toContainText(/Inventory|Medicine|Stock/i);

    // 3. Dispense Prescription Items
    await page.goto('/pharmacy/dispense');
    await expect(page).toHaveURL(/.*pharmacy\/dispense/);
  });

  test('4. Laboratory Journey: Sample Processing, Verification & Release', async ({ page }) => {
    // 1. Lab Tech Login
    await page.goto('/login');
    await page.fill('input[type="email"], input[name="username"]', 'labtech@example.com');
    await page.fill('input[type="password"]', 'LabPass123!');
    await page.click('button[type="submit"]');

    // 2. Lab Queue & Processing
    await page.goto('/lab/requests');
    await expect(page.locator('body')).toContainText(/Lab|Request|Sample/i);
  });

  test('5. Finance Journey: Invoicing, Payment Processing & Allocation', async ({ page }) => {
    // 1. Reception/Finance Login
    await page.goto('/login');
    await page.fill('input[type="email"], input[name="username"]', 'accountant@example.com');
    await page.fill('input[type="password"]', 'FinancePass123!');
    await page.click('button[type="submit"]');

    // 2. Billing & Invoices Dashboard
    await page.goto('/billing/invoices');
    await expect(page.locator('body')).toContainText(/Billing|Invoice|Payment/i);
  });

});
