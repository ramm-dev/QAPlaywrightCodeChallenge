const { expect } = require('@playwright/test');
const config = require('../utils/config-loader');

class BasePage {
  constructor(page) {
    this.page = page;
    this.usernameInput = page.locator('input[name="username"]');
    this.passwordInput = page.locator('input[name="password"]');
    this.loginButton = page.getByRole('button', { name: 'Log In' });
    this.logoutLink = page.getByRole('link', { name: 'Log Out' });
    this.baseUrl = config.baseUrl || 'https://parabank.parasoft.com';
  }

  async navigateTo(url) {
    await this.page.goto(url);
  }

  async navigateToBase() {
    await this.page.goto(this.baseUrl);
  }

  async login(username, password) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async verifyLoggedIn() {
    await this.page.waitForSelector('#leftPanel p.smallText', { state: 'visible', timeout: 10000 });
    await expect(this.page.locator('#leftPanel p.smallText')).toContainText('Welcome');
  }
}

module.exports = BasePage; 