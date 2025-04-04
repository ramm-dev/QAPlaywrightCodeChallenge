// @ts-check
const { chromium } = require('@playwright/test');
const { faker } = require('@faker-js/faker');
const fs = require('fs');
const path = require('path');

async function globalSetup() {
  // Create test-data directory if it doesn't exist
  const testDataDir = path.join(__dirname, 'test-data');
  if (!fs.existsSync(testDataDir)) {
    fs.mkdirSync(testDataDir, { recursive: true });
  }

  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Navigate and register
    await page.goto('https://parabank.parasoft.com/parabank/index.htm');
    await page.getByRole('link', { name: 'Register' }).click();
    
    const userData = {
      username: faker.internet.userName(),
      password: faker.internet.password(),
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      address: faker.location.streetAddress(),
      city: faker.location.city(),
      state: faker.location.state(),
      zipCode: faker.location.zipCode('#####'),
      phone: faker.phone.number('###-###-####'),
      ssn: faker.string.numeric(9)
    };

    // Fill form
    await page.locator('input[name="customer.firstName"]').fill(userData.firstName);
    await page.locator('input[name="customer.lastName"]').fill(userData.lastName);
    await page.locator('input[name="customer.address.street"]').fill(userData.address);
    await page.locator('input[name="customer.address.city"]').fill(userData.city);
    await page.locator('input[name="customer.address.state"]').fill(userData.state);
    await page.locator('input[name="customer.address.zipCode"]').fill(userData.zipCode);
    await page.locator('input[name="customer.phoneNumber"]').fill(userData.phone);
    await page.locator('input[name="customer.ssn"]').fill(userData.ssn);
    await page.locator('input[name="customer.username"]').fill(userData.username);
    await page.locator('input[name="customer.password"]').fill(userData.password);
    await page.locator('input[name="repeatedPassword"]').fill(userData.password);
    
    await page.getByRole('button', { name: 'Register' }).click();
    await page.waitForLoadState('networkidle');

    // Save auth state
    await page.context().storageState({ path: 'auth.json' });

    // Save credentials
    fs.writeFileSync(
      path.join(testDataDir, 'user-credentials.json'),
      JSON.stringify({
        username: userData.username,
        password: userData.password,
        firstName: userData.firstName,
        lastName: userData.lastName
      }, null, 2)
    );
    
    console.log('Setup complete:', userData.username);
  } catch (error) {
    console.error('Setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

module.exports = globalSetup; 