const BasePage = require('./BasePage');
const { expect } = require('@playwright/test');

class OpenAccountPage extends BasePage {
  constructor(page) {
    super(page);
    this.accountTypeDropdown = page.locator('#type');
    this.fromAccountDropdown = page.locator('#fromAccountId');
    this.openAccountButton = page.locator('input.button:has-text("Open New Account")');
    this.newAccountId = page.locator('a#newAccountId');
  }

  async selectAccountType(type) {
    await this.accountTypeDropdown.selectOption(type);
    // await this.page.waitForTimeout(500);
  }

  async selectFromAccount(index = 0) {
    await this.fromAccountDropdown.waitFor();
    await this.fromAccountDropdown.selectOption({ index });
  }

  async clickOpenAccount() {
    await this.openAccountButton.click();
    await this.newAccountId.waitFor({ timeout: 10000 });
  }

  async getNewAccountId() {
    return await this.newAccountId.innerText();
  }
}

module.exports = OpenAccountPage; 