import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();

  // Test 1: Login page has both form and Google link
  console.log('=== Test 1: Login page ===');
  const page1 = await browser.newPage();
  await page1.goto('http://localhost:8080/login', { waitUntil: 'networkidle' });
  const hasForm = await page1.locator('input[name="username"]').count();
  const hasPassword = await page1.locator('input[name="password"]').count();
  const hasGoogle = await page1.locator('a:has-text("Google")').count();
  console.log(`  Username field: ${hasForm > 0}`);
  console.log(`  Password field: ${hasPassword > 0}`);
  console.log(`  Google link: ${hasGoogle > 0}`);
  await page1.close();

  // Test 2: Form login with correct credentials
  console.log('\n=== Test 2: Form login (correct) ===');
  const ctx2 = await browser.newContext();
  const page2 = await ctx2.newPage();
  await page2.goto('http://localhost:8080/login');
  await page2.fill('input[name="username"]', 'hello');
  await page2.fill('input[name="password"]', 'hello123');
  await page2.click('button[type="submit"]');
  await page2.waitForURL('**/*', { timeout: 5000 });
  console.log(`  Final URL: ${page2.url()}`);
  const isError = page2.url().includes('error');
  console.log(`  Login success: ${!isError}`);

  // Navigate to welcome page
  if (!isError) {
    await page2.goto('http://localhost:8080/camunda/app/welcome/default/', { waitUntil: 'networkidle', timeout: 10000 });
    console.log(`  Welcome URL: ${page2.url()}`);
    const hasCockpit = await page2.locator('text=Cockpit').count();
    const hasAdmin = await page2.locator('text=Admin').count();
    console.log(`  Cockpit visible: ${hasCockpit > 0}`);
    console.log(`  Admin visible: ${hasAdmin > 0}`);
  }
  await ctx2.close();

  // Test 3: Form login with wrong credentials
  console.log('\n=== Test 3: Form login (wrong password) ===');
  const ctx3 = await browser.newContext();
  const page3 = await ctx3.newPage();
  await page3.goto('http://localhost:8080/login');
  await page3.fill('input[name="username"]', 'hello');
  await page3.fill('input[name="password"]', 'wrongpassword');
  await page3.click('button[type="submit"]');
  await page3.waitForURL('**/*', { timeout: 5000 });
  console.log(`  Final URL: ${page3.url()}`);
  console.log(`  Login rejected: ${page3.url().includes('error')}`);
  await ctx3.close();

  // Test 4: Google OAuth redirect (clean session, no Google cookies)
  console.log('\n=== Test 4: Google OAuth redirect ===');
  const ctx4 = await browser.newContext();
  const page4 = await ctx4.newPage();
  await page4.goto('http://localhost:8080/login');
  const googleLink = page4.locator('a:has-text("Google")');
  const href = await googleLink.getAttribute('href');
  console.log(`  Google link href: ${href}`);
  await ctx4.close();

  await browser.close();
  console.log('\n=== All dual-auth tests complete ===');
})();
