const BasePage = require('./BasePage');
const { expect } = require('@playwright/test');

class LoginPage extends BasePage {
  constructor(page) {
    super(page);
    this.usernameInput = page.locator('input[name="username"]');
    this.passwordInput = page.locator('input[name="password"]');
    this.loginButton = page.getByRole('button', { name: 'Log In' });
    this.logoutLink = page.getByRole('link', { name: 'Log Out' });
  }

  async login(username, password) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
    await this.page.waitForSelector('#leftPanel', { timeout: 10000 });
  }

  async logout() {
    await this.logoutLink.click();
    await this.page.waitForLoadState('networkidle');
  }

  async verifyLoginSuccess() {
    await expect(this.page.locator('#leftPanel')).toBeVisible();
  }

  async verifyLogoutSuccess() {
    await expect(this.loginButton).toBeVisible();
  }
}

module.exports = LoginPage; 