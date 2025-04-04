// @ts-check
const { faker } = require('@faker-js/faker');
const fs = require('fs');
const path = require('path');

/**
 * Fill payee information in the bill pay form
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} [payeeName] - Optional custom payee name (generates random if not provided)
 * @returns {Promise<string>} The payee name used
 */
async function fillPayeeInformation(page, payeeName = null) {
  // Generate or use provided payee name
  const name = payeeName || faker.person.fullName();
  
  // Fill in the payee information
  await page.locator('input[name="payee.name"]').fill(name);
  await page.locator('input[name="payee.address.street"]').fill(faker.location.streetAddress());
  await page.locator('input[name="payee.address.city"]').fill(faker.location.city());
  await page.locator('input[name="payee.address.state"]').fill(faker.location.state());
  await page.locator('input[name="payee.address.zipCode"]').fill(faker.location.zipCode('#####'));
  await page.locator('input[name="payee.phoneNumber"]').fill(faker.phone.number('###-###-####'));
  
  return name;
}

/**
 * Get account data from the JSON file
 * @returns {Object} The account data
 */
function getAccountData() {
  const accountBalanceFilePath = path.join(__dirname, '../test-data/accountBalance.json');
  return JSON.parse(fs.readFileSync(accountBalanceFilePath, 'utf8'));
}

/**
 * Save data to a JSON file
 * @param {string} filename - Name of the file
 * @param {Object} data - Data to save
 */
function saveToJsonFile(filename, data) {
  const filePath = path.join(__dirname, '../test-data', filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

/**
 * Get account ID from the account data
 * @param {number} [index=0] - Index of the account to get
 * @returns {string} The account ID
 */
function getAccountId(index = 0) {
  const accountData = getAccountData();
  return accountData[0].id.toString();
}

async function captureAccountData(page) {
  // Wait for and capture API response
  const accountsResponse = await page.waitForResponse(response => 
    response.url().includes('/parabank/services_proxy/bank/customers') && 
    response.status() === 200
  );
  
  // Save response to accountBalance.json
  const accountsData = await accountsResponse.json();
  const testDataDir = path.join(__dirname, '../test-data');
  if (!fs.existsSync(testDataDir)) {
    fs.mkdirSync(testDataDir, { recursive: true });
  }
  fs.writeFileSync(
    path.join(testDataDir, 'accountBalance.json'),
    JSON.stringify(accountsData, null, 2)
  );

  return accountsData;
}

module.exports = {
  fillPayeeInformation,
  getAccountData,
  getAccountId,
  saveToJsonFile,
  captureAccountData
}; 