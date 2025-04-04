const { expect } = require('@playwright/test');

class BasePage {
  constructor(page) {
    this.page = page;
    this.usernameInput = page.locator('input[name="username"]');
    this.passwordInput = page.locator('input[name="password"]');
    this.loginButton = page.getByRole('button', { name: 'Log In' });
    this.logoutLink = page.getByRole('link', { name: 'Log Out' });
  }

  async navigateTo(url) {
    await this.page.goto(url);
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