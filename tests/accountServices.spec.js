// @ts-check
const { test, expect, request } = require('@playwright/test');
const { faker } = require('@faker-js/faker');
const fs = require('fs');
const path = require('path');
const { fillPayeeInformation, getAccountId, captureAccountData } = require('../utils/accountServicesUtil');
const OpenAccountPage = require('../pages/OpenAccountPage');
const NavigationMenu = require('../pages/NavigationMenu');
const AccountsOverviewPage = require('../pages/AccountsOverviewPage');
const TransferFundsPage = require('../pages/TransferFundsPage');
const BillPayPage = require('../pages/BillPayPage');
const AccountDataService = require('../services/AccountDataService');
const config = require('../utils/config-loader');
const LoginPage = require('../pages/LoginPage');

// Load credentials for verification
const userCredentialsPath = path.join(__dirname, '../test-data/user-credentials.json');
const userCredentials = fs.existsSync(userCredentialsPath) 
  ? JSON.parse(fs.readFileSync(userCredentialsPath, 'utf8'))
  : { username: 'john', password: 'demo' };
let menuData;
let openAccountPage;
let accountsOverviewPage;

test.beforeAll(async () => {
  const dataPath = path.join(__dirname, '../test-data/navigation-menu.json');
  menuData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
});

test.beforeEach(async ({ page }) => {
  await page.goto(`${config.baseUrl}/parabank/index.htm`);
  openAccountPage = new OpenAccountPage(page);
  accountsOverviewPage = new AccountsOverviewPage(page);
});

test('Verify the account creation functionality for savings account', async ({ page }) => {
  await openAccountPage.navigateTo(config.baseUrl);
  await openAccountPage.verifyLoggedIn();
  
  // Get initial balance
  await accountsOverviewPage.navigateToOverview();
  const initialBalance = await accountsOverviewPage.getTotalBalance();
  
  // Open new savings account
  await page.getByRole('link', { name: 'Open New Account' }).click();
  await openAccountPage.selectAccountType('1');  // Savings
  await openAccountPage.selectFromAccount(0);    
  await openAccountPage.clickOpenAccount();
  const newAccountId = await openAccountPage.getNewAccountId();
  
  // Verify in accounts overview
  await accountsOverviewPage.navigateToOverview();
  await accountsOverviewPage.verifyAccountId(newAccountId);
  await accountsOverviewPage.verifyBalance(initialBalance);
});

test('Verify transfer funds functionality', async ({ page }) => {
  // Get initial balance
  await accountsOverviewPage.navigateToOverview();
  const initialBalance = await accountsOverviewPage.getTotalBalance();
  
  // Perform transfer
  const transferFunds = new TransferFundsPage(page);
  await transferFunds.navigateToTransferFunds();
  await transferFunds.performTransfer(100);
  
  // Verify transfer success
  const successMessage = page.locator('#rightPanel');
  await expect(successMessage).toContainText('Transfer Complete!');
  
  // Verify balance remains same (internal transfer)
  await accountsOverviewPage.navigateToOverview();
  await accountsOverviewPage.verifyBalance(initialBalance);
});

test('Verify bill pay functionality', async ({ page }) => {
  // Get initial balance
  await accountsOverviewPage.navigateToOverview();
  const initialBalance = await accountsOverviewPage.getTotalBalance();
  const paymentAmount = 100;
  
  // Perform bill pay
  const billPay = new BillPayPage(page);
  await billPay.navigateToBillPay();
  const payeeName = faker.person.fullName();
  await billPay.fillPayeeInformation(payeeName);
  await billPay.fillPaymentDetails(paymentAmount);
  await billPay.submitPayment();
  
  // Verify payment success
  await billPay.verifyPaymentSuccess(payeeName, paymentAmount);
  
  // Verify balance is reduced by payment amount
  await accountsOverviewPage.navigateToOverview();
  const expectedBalance = initialBalance - paymentAmount;
  await accountsOverviewPage.verifyBalance(expectedBalance);
});

test('Verify navigation menu functionality', async ({ page }) => {
  const navigationMenu = new NavigationMenu(page);
  const baseUrl = config.baseUrl;
  
  await navigationMenu.navigateTo(baseUrl);

  for (const menu of menuData.menuTests) {
    await navigationMenu.clickMenuItem(menu.name);
    
    // Handle external links (products and locations)
    if (menu.name === 'products' || menu.name === 'locations') {
      await page.waitForURL(/parasoft\.com/); // Wait for external site
      await page.waitForLoadState('domcontentloaded');
      await navigationMenu.navigateTo(baseUrl); // Return to ParaBank
    } else {
      await navigationMenu.verifyCurrentUrl(menu.urlPath);
      await navigationMenu.clickMenuItem('home');
    }
  }
});

test('Validate Transactions through API', async ({ request }) => {
  const accountService = new AccountDataService();
  const accountId = accountService.getAccountId();

  const requestUrl = `${config.apiBaseUrl}/bank/accounts/${accountService.getAccountId()}/transactions/amount/100`;
  console.log(`Request URL: ${requestUrl}`);

  //Get the response
  const response = await request.get(
    `${config.apiBaseUrl}/bank/accounts/${accountService.getAccountId()}/transactions/amount/100`
  );

  console.log(`Response status: ${response.status()}`);
  const responseBody = await response.text();
  console.log(`Response body: ${responseBody}`);

  expect(response.status()).toBe(200);
  //Parse the response body
  const responseData = await response.json();
  const transaction = responseData[0];
  
  //Verify the transaction details
  expect(transaction.accountId).toBe(parseInt(accountId));
  expect(transaction.type).toBe('Credit');
  expect(transaction.amount).toBe(100.00);
  expect(transaction.description).toBe('Funds Transfer Received');
});
