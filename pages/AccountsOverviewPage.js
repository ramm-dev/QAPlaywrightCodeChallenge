const BasePage = require('./BasePage');
const { expect } = require('@playwright/test');
const { captureAccountData } = require('../utils/parabank-utils');

class AccountsOverviewPage extends BasePage {
  constructor(page) {
    super(page);
    this.accountsOverviewLink = page.getByRole('link', { name: 'Accounts Overview' });
    this.accountTable = page.locator('#accountTable');
    this.totalBalance = page.locator('#accountTable tr:last-child td:nth-child(2)');
  }

  async navigateToOverview() {
    await this.accountsOverviewLink.click();
    await captureAccountData(this.page);
    await this.page.waitForLoadState('networkidle');
    await this.accountTable.waitFor({ state: 'visible' });
  }

  async getTotalBalance() {
    await this.totalBalance.waitFor({ state: 'visible' });
    const balanceText = await this.totalBalance.textContent();
    return parseFloat(balanceText.replace(/[^0-9.-]+/g, ''));
  }

  async verifyAccountId(accountId) {
    const accountCell = this.page.locator(`a:text("${accountId}")`);
    await expect(accountCell).toBeVisible();
  }

  async verifyBalance(expectedBalance) {
    const actualBalance = await this.getTotalBalance();
    expect(actualBalance).toBeCloseTo(expectedBalance, 2);
  }
}

module.exports = AccountsOverviewPage; 