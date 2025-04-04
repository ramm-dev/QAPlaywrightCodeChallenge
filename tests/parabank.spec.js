// @ts-check
const { test, expect, request } = require('@playwright/test');
const { faker } = require('@faker-js/faker');
const fs = require('fs');
const path = require('path');
const { fillPayeeInformation, getAccountData, getAccountId, saveToJsonFile } = require('../utils/parabank-utils');
const OpenAccountPage = require('../pages/OpenAccountPage');
const NavigationMenu = require('../pages/NavigationMenu');
const AccountsOverviewPage = require('../pages/AccountsOverviewPage');
const TransferFundsPage = require('../pages/TransferFundsPage');
const BillPayPage = require('../pages/BillPayPage');

// Load user credentials
const userCredentialsPath = path.join(__dirname, '../test-data/user-credentials.json');
const userCredentials = fs.existsSync(userCredentialsPath) 
  ? JSON.parse(fs.readFileSync(userCredentialsPath, 'utf8'))
  : { firstName: 'User', lastName: 'Name' };

test('ParaBank account operations', async ({ page }) => {
  // Start with the user already logged in thanks to storageState
  await page.goto('https://parabank.parasoft.com/');
  
  // Verify we're logged in
  await expect(page.locator('#leftPanel')).toContainText(`Welcome ${userCredentials.firstName} ${userCredentials.lastName}`);
  
  // Continue with account operations
  // 4. Click on 'Accounts Overview' link from the menu
  await page.getByRole('link', { name: 'Accounts Overview' }).click();
  
  // Wait for the accounts data to load
  await page.waitForSelector('#accountTable');
  
  // 5. Capture API response and store it
  // Set up listener for API responses
  const accountsResponse = await page.waitForResponse(response => 
    response.url().includes('/parabank/services_proxy/bank/customers') && 
    response.status() === 200
  );
  
  // Get the response body as JSON
  const accountsData = await accountsResponse.json();
  
  // Create directory if it doesn't exist
  const dirPath = path.join(__dirname, '../results');
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  
  // Save the response to a file
  fs.writeFileSync(
    path.join(dirPath, 'accountBalance.json'), 
    JSON.stringify(accountsData, null, 2)
  );
  
  // 6. Click on 'Open New Account' link from the menu
  await page.getByRole('link', { name: 'Open New Account' }).click();
  
  
  // 7. Select account type as 'Savings'
  await page.locator('#type').selectOption('1'); // '1' is typically the value for Savings
  
  // Select the source account using the ID from accountBalance.json
  await page.waitForSelector('#fromAccountId select:not(:empty)');
  await page.waitForTimeout(500);
  

  // await expect(page.locator('input[value="Open New Account"]')).toBeVisible({ timeout: 20000 });
  // await expect(page.locator('input[value="Open New Account"]')).toBeEnabled({ timeout: 20000 });
  await page.locator('input.button:has-text("Open New Account")').click();
  await page.waitForSelector('a#newAccountId',{timeout:10000});
  const textResult = await page.locator('a#newAccountId').allInnerTexts();
  await page.getByRole('link', { name: 'Accounts Overview' }).click();
  await page.waitForLoadState('networkidle',{timeout:10000});
  await expect(page.locator("//tbody/tr[2]/td[1]")).toContainText(textResult);

  // Read and parse the JSON file
const accountBalanceFilePath = path.join(__dirname, '../results/accountBalance.json');
const accountData = JSON.parse(fs.readFileSync(accountBalanceFilePath, 'utf8'));
const expectedBalance = accountData[0].balance;

// Assert that the UI contains the expected balance
await expect(page.locator("//tbody/tr[3]/td[2]")).toContainText(expectedBalance.toString());

  //await expect(page.locator("//tbody/tr[2]/td[2]")).toContainText();

  // 10. Click on the Transfer Funds link
  await page.getByRole('link', { name: 'Transfer Funds' }).click();
  await page.waitForSelector('#amount', { state: 'visible' });

  // 11. Enter the amount as '50'
  await page.locator('#amount').fill('50');

  // 12. Select the second option from the "From account" dropdown
  // First, wait for the dropdown to be populated
  // await page.waitForFunction(() => {
  //   const select = document.querySelector('#fromAccountId');
  //   return select && select.options.length > 0;
  // });
  await page.locator('#fromAccountId').selectOption({ index: 0 }); // Select the second option


  // Select the destination account (the newly created account)
  await page.locator('#toAccountId').selectOption({ index: 1 });
  // await page.locator('#toAccountId').selectOption(textResult[0]);


  // 13. Click on the Transfer button
  await page.locator('input[value="Transfer"]').click();

  // Wait for the transfer to complete
  await page.waitForSelector('h1.title:has-text("Transfer Complete!")', { timeout: 10000 });

  // Verify the transfer was successful
  await expect(page.locator('#rightPanel')).toContainText('$50.00 has been transferred');

  await page.getByRole('link', { name: 'Accounts Overview' }).click();
  await page.waitForLoadState('networkidle',{timeout:10000});

  // Read and parse the JSON file


// Assert that the UI contains the expected balance ***********
await expect(page.locator("//tbody/tr[3]/td[2]")).toContainText(expectedBalance.toString());


  // 14. Click on Bill Pay
  await page.getByRole('link', { name: 'Bill Pay' }).click();
  await page.waitForSelector('input[name="payee.name"]', { state: 'visible' });

  // 15. Enter the payee information using the utility function
  const payeeName = await fillPayeeInformation(page);

  // 16. Enter the account number to transfer as '1001'
  await page.locator('input[name="payee.accountNumber"]').fill('1001');
  await page.locator('input[name="verifyAccount"]').fill('1001');

  // 17. Enter the amount as 100
  await page.locator('input[name="amount"]').fill('100');

  // Select the account to pay from (use the first account)
  await page.locator('select[name="fromAccountId"]').selectOption({ index: 0 });

  await page.waitForTimeout(500);

  // Click the Send Payment button
  await page.locator('input[value="Send Payment"]').click();

  // Wait for the payment to complete
  await page.waitForSelector('h1.title:has-text("Bill Payment Complete")', { timeout: 10000 });

  // Verify the payment was successful
  await expect(page.locator('#rightPanel')).toContainText(`Bill Payment to ${payeeName} in the amount of $100.00`);

  // 18. Go back to Accounts Overview and verify the balance
  await page.getByRole('link', { name: 'Accounts Overview' }).click();
  await page.waitForLoadState('networkidle', { timeout: 10000 });

  // Calculate the expected balance (original balance - 100)
  const originalBalance = parseFloat(accountData[0].balance);
  const expectedUpdatedBalance = originalBalance - 100;

  await expect(page.locator("//tbody/tr[3]/td[2]")).toContainText(expectedUpdatedBalance.toString());

}); 

test('Validate Transactions', async ({}) => {
  // The auth.json is already being used thanks to the config
  const accountNumber = getAccountId();
  const apiContext = await request.newContext();
  const response = await apiContext.get(`https://parabank.parasoft.com/parabank/services_proxy/bank/accounts/${accountNumber}/transactions/amount/50`);

  console.log(`Response status: ${response.status()}`);
  const responseBody = await response.text();
  console.log(`Response body: ${responseBody}`);
  
  // Save the response to a file
  if (response.ok()) {
    try {
      const jsonBody = JSON.parse(responseBody);
      saveToJsonFile('transactions-response.json', jsonBody);
    } catch (e) {
      console.log('Response is not valid JSON');
    }
  }
});
