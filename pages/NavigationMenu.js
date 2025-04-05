const BasePage = require('./BasePage');
const { expect } = require('@playwright/test');
const config = require('../utils/config-loader');

class NavigationMenu extends BasePage {
  constructor(page) {
    super(page);
    const headerPanel = page.locator('#headerPanel');
    this.menuItems = {
      home: page.getByRole('link', { name: 'home', exact: true }),
      aboutUs: headerPanel.getByRole('link', { name: 'About Us' }),
      services: headerPanel.getByRole('link', { name: 'Services' }),
      products: headerPanel.getByRole('link', { name: 'Products' }),
      locations: headerPanel.getByRole('link', { name: 'Locations' }),
      adminPage: headerPanel.getByRole('link', { name: 'Admin Page' }),
      contact: page.getByRole('link', { name: 'contact', exact: true })
    };
    this.baseUrl = config.baseUrl || 'https://parabank.parasoft.com';
  }

  async clickMenuItem(menuName) {
    await this.menuItems[menuName].click();
    await this.page.waitForLoadState('networkidle');
  }

  async verifyCurrentUrl(expectedPath) {
    const currentUrl = this.page.url();
    expect(currentUrl).toContain(expectedPath);
  }
}

module.exports = NavigationMenu; 