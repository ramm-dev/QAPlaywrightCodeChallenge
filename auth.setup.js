import { test as setup } from '@playwright/test';

setup('authenticate', async ({ page }) => {
  await page.goto('https://parabank.parasoft.com/parabank/index.htm');
  await page.getByLabel('Username').fill(userCredentials.username);
  await page.getByLabel('Password').fill(userCredentials.password);
  await page.getByRole('button', { name: 'Log In' }).click();
  
  // Save signed-in state
  await page.context().storageState({ path: './test-data/auth.json' });
}); 