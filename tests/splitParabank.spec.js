// @ts-check
const { test, expect } = require('@playwright/test');
const { faker } = require('@faker-js/faker');
const fs = require('fs');
const path = require('path');
const { fillPayeeInformation, getAccountId, captureAccountData } = require('../utils/parabank-utils');
const OpenAccountPage = require('../pages/OpenAccountPage');
const NavigationMenu = require('../pages/NavigationMenu');
const AccountsOverviewPage = require('../pages/AccountsOverviewPage');
const TransferFundsPage = require('../pages/TransferFundsPage');
const BillPayPage = require('../pages/BillPayPage');
const AccountDataService = require('../services/AccountDataService');

// Load credentials for verification
const userCredentialsPath = path.join(__dirname, '../test-data/user-credentials.json');
const userCredentials = fs.existsSync(userCredentialsPath) 
  ? JSON.parse(fs.readFileSync(userCredentialsPath, 'utf8'))
  : { username: 'john', password: 'demo' };
let menuData;

test.beforeAll(async () => {
  const dataPath = path.join(__dirname, '../test-data/navigation-menu.json');
  menuData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
});

test.beforeEach(async ({ page }) => {
  await page.goto('https://parabank.parasoft.com/parabank/index.htm');
});

test('Verify the account balance after creating savings account', async ({ page }) => {
  const openAccountPage = new OpenAccountPage(page);
  const accountsOverviewPage = new AccountsOverviewPage(page);
  
  await openAccountPage.navigateTo('https://parabank.parasoft.com/');
  await openAccountPage.verifyLoggedIn();
  
  // Get initial balance
  await accountsOverviewPage.navigateToOverview();
  // await captureAccountData(page);
  const initialBalance = await accountsOverviewPage.getTotalBalance();
  
  // Open new savings account
  await page.getByRole('link', { name: 'Open New Account' }).click();
  await openAccountPage.selectAccountType('1');  // Savings
  await openAccountPage.selectFromAccount(0);    // First available account
  await openAccountPage.clickOpenAccount();
  const newAccountId = await openAccountPage.getNewAccountId();
  
  // Verify in accounts overview
  await accountsOverviewPage.navigateToOverview();
  await accountsOverviewPage.verifyAccountId(newAccountId);
  await accountsOverviewPage.verifyBalance(initialBalance);
});

test('Verify transfer funds functionality', async ({ page }) => {
  const accountsOverview = new AccountsOverviewPage(page);
  const transferFunds = new TransferFundsPage(page);
  
  // Get initial balance
  await accountsOverview.navigateToOverview();
  const initialBalance = await accountsOverview.getTotalBalance();
  
  // Perform transfer
  await transferFunds.navigateToTransferFunds();
  await transferFunds.performTransfer(100);
  
  // Verify transfer success
  const successMessage = page.locator('#rightPanel');
  await expect(successMessage).toContainText('Transfer Complete!');
  
  // Verify balance remains same (internal transfer)
  await accountsOverview.navigateToOverview();
  await accountsOverview.verifyBalance(initialBalance);
});

test('Verify the account balance after paying the bill', async ({ page }) => {
  const accountsOverview = new AccountsOverviewPage(page);
  const billPay = new BillPayPage(page);
  
  // Get initial balance
  await accountsOverview.navigateToOverview();
  const initialBalance = await accountsOverview.getTotalBalance();
  const paymentAmount = 100;
  
  // Perform bill pay
  await billPay.navigateToBillPay();
  const payeeName = faker.person.fullName();
  await billPay.fillPayeeInformation(payeeName);
  await billPay.fillPaymentDetails(paymentAmount);
  await billPay.submitPayment();
  
  // Verify payment success
  await billPay.verifyPaymentSuccess(payeeName, paymentAmount);
  
  // Verify balance is reduced by payment amount
  await accountsOverview.navigateToOverview();
  const expectedBalance = initialBalance - paymentAmount;
  await accountsOverview.verifyBalance(expectedBalance);
});

test.skip('Verify navigation menu functionality', async ({ page }) => {
  const navigationMenu = new NavigationMenu(page);
  const baseUrl = 'https://parabank.parasoft.com';
  
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

test.skip('Verify bill pay functionality', async ({ page }) => {
  const accountsOverview = new AccountsOverviewPage(page);
  const billPay = new BillPayPage(page);
  
  // Get initial balance
  await accountsOverview.navigateToOverview();
  const initialBalance = await accountsOverview.getTotalBalance();
  
  // Perform bill pay
  await billPay.navigateToBillPay();
  const payeeName = faker.person.fullName();
  await billPay.fillPayeeInformation(payeeName);
  await billPay.fillPaymentDetails(100);
  await billPay.submitPayment();
  
  // Verify payment success
  await billPay.verifyPaymentSuccess(payeeName, 100);
  
  // Verify balance is reduced
  await accountsOverview.navigateToOverview();
  await accountsOverview.verifyBalance(initialBalance - 100);
});

test('API Test Validate Transactions', async ({}) => {
  const accountService = new AccountDataService();
  const apiContext = await request.newContext();
  
  const response = await apiContext.get(
    `https://parabank.parasoft.com/parabank/services_proxy/bank/accounts/${accountService.getAccountId()}/transactions/amount/50`
  );

  expect(response.status()).toBe(200);

  const responseData = await response.json();
  const transaction = responseData[0];
  
  // Convert accountId to number for comparison
  expect(transaction.accountId).toBe(parseInt(accountService.getAccountId()));
  expect(transaction.type).toBe('DEBIT');
  expect(transaction.amount).toBe(50.00);
  expect(transaction.description).toBe('Funds Transfer Sent');
});
