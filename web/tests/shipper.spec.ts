import { test, expect } from '@playwright/test';

test.describe('Shipper Portal E2E Tests', () => {

  test('Bids Exchange & AI Matching - Accept Bid', async ({ page }) => {
    await page.addInitScript(() => window.localStorage.setItem('E2E_TEST', 'true'));
    
    // Mock the API response to provide an open load
    await page.route('**/api/**', route => route.fulfill({ 
      status: 200, 
      json: { 
        loads: [{ id: '123', status: 'POSTED', origin: 'Djibouti', destination: 'Addis', title: 'Test Cargo', bids: [] }] 
      } 
    }));
    
    // Navigate to Bids tab
    await page.goto('/shipper/bids');
    
    // Wait for the loads to fetch and render
    await page.waitForTimeout(1000);
    
    // Check if there's an open load with mock AI bids
    const openLoadText = page.getByText(/active bids received/i).first();
    await expect(openLoadText).toBeVisible();

    // Click the chevron to expand the first open load
    await openLoadText.click();

    // Expect the AI Shortlist to appear
    await expect(page.getByText('AI Shortlist')).toBeVisible();

    // Find the Accept & Lock Escrow button and click it
    const acceptBtn = page.getByRole('button', { name: 'Accept & Lock Escrow' }).first();
    await expect(acceptBtn).toBeEnabled();
    
    // Handle the window alert automatically
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('Bid accepted');
      await dialog.accept();
    });

    await acceptBtn.click();

    // Check if it redirects to telematics
    await expect(page).toHaveURL(/\/shipper\/telematics/);
  });

  test('Contract Rates CRUD & Divergence', async ({ page }) => {
    await page.addInitScript(() => window.localStorage.setItem('E2E_TEST', 'true'));
    
    // Mock the API response
    await page.route('**/api/**', route => route.fulfill({ 
      status: 200, 
      json: { 
        success: true,
        contracts: [{ id: 'contract-123', lockedRate: 100000, currentSpotRate: 118000, validUntil: '2026-12-31', companyName: 'Test Carrier', origin: 'Origin', destination: 'Dest', status: 'ACTIVE' }]
      } 
    }));
    
    // Navigate to Contract Rates tab
    await page.goto('/shipper/contract_rates');
    
    // Wait for fetch
    await page.waitForTimeout(1000);
    
    // Click New Contract Rate button
    await page.getByRole('button', { name: '+ New Contract Rate' }).click();

    // Fill out the modal form
    await page.getByPlaceholder('e.g. 550e8400-e29b-41d4-a716-446655440000').fill('123e4567-e89b-12d3-a456-426614174000');
    // Using a locked rate of 100,000 (which will calculate current spot as 118,000, leading to an 18% divergence -> REVIEW REQUIRED)
    // Actually the mock divergence is always 18% based on `const currentSpot = Number(contract.lockedRate) * 1.18;` in the frontend logic.
    // So any rate will trigger REVIEW REQUIRED if the frontend logic hasn't changed.
    await page.locator('input[type="number"]').fill('100000');
    
    const dialogPromise = page.waitForEvent('dialog');
    await page.getByRole('button', { name: 'Create Contract Rate' }).click();
    const dialog = await dialogPromise;
    expect(dialog.message()).toContain('Contract created');
    await dialog.accept();

    // Verify divergence badge
    await expect(page.getByText('REVIEW REQUIRED').first()).toBeVisible();
  });

  test('Digital Customs Vault & SHA-256 Upload', async ({ page }) => {
    await page.addInitScript(() => window.localStorage.setItem('E2E_TEST', 'true'));
    
    // Mock the API response
    await page.route('**/api/**', route => route.fulfill({ 
      status: 200, 
      json: { 
        success: true,
        shipment: { id: 'SHP-123' },
        documents: [{ invoiceUrl: '/test-invoice.pdf', packingListUrl: '/test-packing.pdf' }]
      } 
    }));

    await page.goto('/shipper/customs');
    await page.waitForTimeout(1000);

    // Open upload modal
    await page.getByRole('button', { name: 'Upload Document' }).click();

    // Create dummy PDF files in memory for testing
    const dummyBuffer = Buffer.from('dummy content');

    // Attach files
    // Find inputs by their labels
    const invoiceInput = page.locator('label:has-text("Commercial Invoice (PDF)") + input');
    await invoiceInput.setInputFiles({
      name: 'invoice.pdf',
      mimeType: 'application/pdf',
      buffer: dummyBuffer
    });

    const packingInput = page.locator('label:has-text("Packing List (PDF)") + input');
    await packingInput.setInputFiles({
      name: 'packing.pdf',
      mimeType: 'application/pdf',
      buffer: dummyBuffer
    });

    const blInput = page.locator('label:has-text("Bill of Lading (PDF)") + input');
    await blInput.setInputFiles({
      name: 'bol.pdf',
      mimeType: 'application/pdf',
      buffer: dummyBuffer
    });

    const cooInput = page.locator('label:has-text("Certificate of Origin (PDF)") + input');
    await cooInput.setInputFiles({
      name: 'coo.pdf',
      mimeType: 'application/pdf',
      buffer: dummyBuffer
    });

    // Wait for files to be ready, then submit
    const uploadBtn = page.getByRole('button', { name: 'Upload & Generate SHA-256 Hash' });
    await expect(uploadBtn).toBeEnabled();

    const uploadDialogPromise = page.waitForEvent('dialog');
    await uploadBtn.click();
    const uploadDialog = await uploadDialogPromise;
    expect(uploadDialog.message()).toContain('uploaded successfully');
    await uploadDialog.accept();

    // Check for success status in the table
    // Since there are two rows (invoice and packing), we check if "Uploaded — Hash Verified" appears twice
    const verifiedStatuses = page.getByText('Uploaded — Hash Verified');
    await expect(verifiedStatuses).toHaveCount(4);
  });

});
