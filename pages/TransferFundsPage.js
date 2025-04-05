const BasePage = require('./BasePage');
const { expect } = require('@playwright/test');

class TransferFundsPage extends BasePage {
  constructor(page) {
    super(page);
    this.transferFundsLink = page.getByRole('link', { name: 'Transfer Funds' });
    this.amountInput = page.locator('#amount');
    this.fromAccountSelect = page.locator('#fromAccountId');
    this.toAccountSelect = page.locator('#toAccountId');
    this.transferButton = page.getByRole('button', { name: 'Transfer' });
  }

  async navigateToTransferFunds() {
    await this.transferFundsLink.click();
    await this.page.waitForLoadState('networkidle');
    // Wait for the form to be ready
    await expect(this.fromAccountSelect).toBeVisible();
    await expect(this.toAccountSelect).toBeVisible();
  }

  async getFirstAccountId() {
    await this.navigateToTransferFunds();
    const firstOption = await this.fromAccountSelect.locator('option:nth-child(1)');
    return await firstOption.getAttribute('value');
  }

  async getSecondAccountId() {
    await this.navigateToTransferFunds();
    const secondOption = await this.fromAccountSelect.locator('option:nth-child(2)');
    return await secondOption.getAttribute('value');
  }

  async performTransfer(amount) {
    await this.amountInput.fill(amount.toString());
    
    // Select the accounts and click transfer
    const fromValue = await this.fromAccountSelect.locator('option:nth-child(2)').getAttribute('value');
    const toValue = await this.fromAccountSelect.locator('option:nth-child(1)').getAttribute('value');
    await this.fromAccountSelect.selectOption(fromValue);
    await this.transferButton.click();
    await this.page.waitForLoadState('networkidle');
    
    // Verify transfer success message
    const successMessage = this.page.locator('#rightPanel');
    await expect(successMessage).toContainText('Transfer Complete!');
  }
}

module.exports = TransferFundsPage; 