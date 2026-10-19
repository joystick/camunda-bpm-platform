import { chromium, webkit, type Browser } from 'playwright';

async function testOAuthFlow(browserType: string, launchFn: () => Promise<Browser>) {
  console.log(`\n=== ${browserType} ===`);
  const browser = await launchFn();
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await context.newPage();

  const redirects: string[] = [];
  page.on('response', (resp) => {
    if ([301, 302, 303, 307, 308].includes(resp.status())) {
      redirects.push(`${resp.status()} ${resp.url()} → ${resp.headers()['location'] || '?'}`);
    }
  });

  // Test 1: Visit root /
  console.log('\n[Test 1] GET https://bpmn.fs-holding.com/');
  await page.goto('https://bpmn.fs-holding.com/', { waitUntil: 'networkidle', timeout: 15000 });
  console.log(`  Final URL: ${page.url()}`);
  console.log(`  Redirects: ${redirects.length > 0 ? '\n    ' + redirects.join('\n    ') : 'none'}`);
  console.log(`  Title: ${await page.title()}`);
  const hasGoogleLink = await page.locator('a:has-text("Google")').count();
  console.log(`  Has "Google" login link: ${hasGoogleLink > 0}`);
  redirects.length = 0;

  // Test 2: Visit /login directly
  console.log('\n[Test 2] GET https://bpmn.fs-holding.com/login');
  await page.goto('https://bpmn.fs-holding.com/login', { waitUntil: 'networkidle', timeout: 15000 });
  console.log(`  Final URL: ${page.url()}`);
  console.log(`  Redirects: ${redirects.length > 0 ? '\n    ' + redirects.join('\n    ') : 'none'}`);
  const hasGoogleLink2 = await page.locator('a:has-text("Google")').count();
  console.log(`  Has "Google" login link: ${hasGoogleLink2 > 0}`);
  redirects.length = 0;

  // Test 3: Visit /camunda/app/welcome/default/
  console.log('\n[Test 3] GET https://bpmn.fs-holding.com/camunda/app/welcome/default/');
  await page.goto('https://bpmn.fs-holding.com/camunda/app/welcome/default/', { waitUntil: 'networkidle', timeout: 15000 });
  console.log(`  Final URL: ${page.url()}`);
  console.log(`  Redirects: ${redirects.length > 0 ? '\n    ' + redirects.join('\n    ') : 'none'}`);
  const hasGoogleLink3 = await page.locator('a:has-text("Google")').count();
  console.log(`  Has "Google" login link: ${hasGoogleLink3 > 0}`);
  redirects.length = 0;

  // Test 4: REST API without auth should 401 (nginx basic auth)
  console.log('\n[Test 4] GET https://bpmn.fs-holding.com/engine-rest/engine (no auth)');
  const resp4 = await page.goto('https://bpmn.fs-holding.com/engine-rest/engine', { waitUntil: 'networkidle', timeout: 15000 });
  console.log(`  Status: ${resp4?.status()}`);
  redirects.length = 0;

  // Test 5: REST API with basic auth should 200
  console.log('\n[Test 5] GET https://bpmn.fs-holding.com/engine-rest/engine (basic auth)');
  const authContext = await browser.newContext({
    ignoreHTTPSErrors: true,
    httpCredentials: { username: process.env.CAMUNDA_USER ?? 'hello', password: process.env.CAMUNDA_PASS ?? 'test' },
  });
  const authPage = await authContext.newPage();
  const resp5 = await authPage.goto('https://bpmn.fs-holding.com/engine-rest/engine', { waitUntil: 'networkidle', timeout: 15000 });
  console.log(`  Status: ${resp5?.status()}`);
  const body = await authPage.textContent('body');
  console.log(`  Body: ${body?.substring(0, 100)}`);

  await browser.close();
}

(async () => {
  await testOAuthFlow('Chromium', () => chromium.launch());
  await testOAuthFlow('WebKit', () => webkit.launch());
  console.log('\n=== All tests complete ===');
})();
