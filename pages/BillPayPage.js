const BasePage = require('./BasePage');
const { expect } = require('@playwright/test');
const { faker } = require('@faker-js/faker');

class BillPayPage extends BasePage {
  constructor(page) {
    super(page);
    this.billPayLink = page.locator('#leftPanel').getByRole('link', { name: 'Bill Pay' });
    this.payeeNameInput = page.locator('input[name="payee.name"]');
    this.addressInput = page.locator('input[name="payee.address.street"]');
    this.cityInput = page.locator('input[name="payee.address.city"]');
    this.stateInput = page.locator('input[name="payee.address.state"]');
    this.zipCodeInput = page.locator('input[name="payee.address.zipCode"]');
    this.phoneInput = page.locator('input[name="payee.phoneNumber"]');
    this.accountInput = page.locator('input[name="payee.accountNumber"]');
    this.verifyAccountInput = page.locator('input[name="verifyAccount"]');
    this.amountInput = page.locator('input[name="amount"]');
    this.fromAccountSelect = page.locator('select[name="fromAccountId"]');
    this.sendPaymentButton = page.getByRole('button', { name: 'Send Payment' });
  }

  async navigateToBillPay() {
    await this.billPayLink.click();
    await this.page.waitForLoadState('networkidle');
    await expect(this.payeeNameInput).toBeVisible();
  }

  async fillPayeeInformation(payeeName) {
    // Fill in payee details with faker data
    await this.payeeNameInput.fill(payeeName);
    await this.addressInput.type(faker.location.streetAddress(), { delay: 100 });
    await this.cityInput.type(faker.location.city(), { delay: 100 });
    await this.stateInput.type(faker.location.state(), { delay: 100 });
    await this.zipCodeInput.type(faker.location.zipCode('#####'), { delay: 100 });
    await this.phoneInput.fill(faker.phone.number('###-###-####'));
    
    // Generate and fill account number
    const accountNumber = faker.string.numeric(10);
    await this.accountInput.fill(accountNumber);
    await this.verifyAccountInput.fill(accountNumber);
    
    return payeeName;
  }

  async fillPaymentDetails(amount) {
    await this.amountInput.fill(amount.toString());
    const fromAccountId = await this.fromAccountSelect.locator('option:nth-child(1)').getAttribute('value');
    await this.fromAccountSelect.selectOption(fromAccountId);
  }

  async submitPayment() {
    await this.sendPaymentButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async verifyPaymentSuccess(payeeName, amount) {
    const successMessage = this.page.locator('#rightPanel');
    await expect(successMessage).toContainText('Bill Payment Complete');
    await expect(successMessage).toContainText(payeeName);
    await expect(successMessage).toContainText(`$${amount.toFixed(2)}`);
  }
}

module.exports = BillPayPage; 