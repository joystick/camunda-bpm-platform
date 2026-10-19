import { chromium } from 'playwright';

const BASE_URL = process.env.CAMUNDA_BASE_URL ?? 'http://localhost:8080';

(async () => {
  const browser = await chromium.launch();

  // Test 1: Form login admin sees all sections
  console.log('=== Test 1: Form login admin - all sections visible ===');
  const ctx1 = await browser.newContext();
  const page1 = await ctx1.newPage();
  await page1.goto(`${BASE_URL}/login`);
  await page1.fill('input[name="username"]', 'hello');
  await page1.fill('input[name="password"]', 'hello123');
  await page1.click('button[type="submit"]');
  await page1.waitForURL('**/*', {timeout: 5000});

  await page1.goto(`${BASE_URL}/camunda/app/admin/default/#/`, {
    waitUntil: 'networkidle',
    timeout: 15000
  });
  await page1.waitForTimeout(3000);

  const usersSection = await page1.locator('a[href="#/users"]').count();
  const groupsSection = await page1.locator('a[href="#/groups"]').count();
  const tenantsSection = await page1.locator('a[href="#/tenants"]').count();
  const authSection = await page1.locator('a[href*="#/authorization"]').count();
  const systemSection = await page1.locator('a[href*="#/system"]').count();

  console.log(`  Users visible: ${usersSection > 0}`);
  console.log(`  Groups visible: ${groupsSection > 0}`);
  console.log(`  Tenants visible: ${tenantsSection > 0}`);
  console.log(`  Authorizations visible: ${authSection > 0}`);
  console.log(`  System visible: ${systemSection > 0}`);

  // Check nav links
  const usersNav = await page1.locator('a[href="#/users"]').count();
  const groupsNav = await page1.locator('a[href="#/groups"]').count();
  const tenantsNav = await page1.locator('a[href="#/tenants"]').count();
  console.log(`  Users nav: ${usersNav > 0}`);
  console.log(`  Groups nav: ${groupsNav > 0}`);
  console.log(`  Tenants nav: ${tenantsNav > 0}`);
  await ctx1.close();

  // Test 2: Auth info endpoint
  console.log('\n=== Test 2: Auth info endpoint ===');
  const ctx2 = await browser.newContext();
  const page2 = await ctx2.newPage();
  await page2.goto(`${BASE_URL}/login`);
  await page2.fill('input[name="username"]', 'hello');
  await page2.fill('input[name="password"]', 'hello123');
  await page2.click('button[type="submit"]');
  await page2.waitForURL('**/*', {timeout: 5000});

  const response = await page2.goto(
    `${BASE_URL}/api/oidc/auth-info`,
    {timeout: 5000}
  );
  const body = await response?.text();
  console.log(`  Status: ${response?.status()}`);
  console.log(`  Body: ${body}`);
  await ctx2.close();

  await browser.close();
  console.log('\n=== All OIDC admin restriction tests complete ===');
})();
