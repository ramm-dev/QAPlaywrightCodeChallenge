const fs = require('fs');
const path = require('path');

class AccountDataService {
  constructor() {
    this.testDataDir = path.join(__dirname, '../test-data');
    this.accountBalancePath = path.join(this.testDataDir, 'accountBalance.json');
  }

  getAccountData() {
    return JSON.parse(fs.readFileSync(this.accountBalancePath, 'utf8'));
  }

  getAccountId() {
    const accountData = this.getAccountData();
    return accountData[0].accountId;
  }

  getBalance() {
    const accountData = this.getAccountData();
    return accountData[0].balance;
  }
}

module.exports = AccountDataService; 