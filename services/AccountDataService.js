const fs = require('fs');
const path = require('path');

class AccountDataService {
  constructor() {
    this.accountBalancePath = path.join(__dirname, '../test-data/accountBalance.json');
  }

  getAccountId() {
    const accountData = JSON.parse(fs.readFileSync(this.accountBalancePath, 'utf8'));
    return accountData[1].id;
  }
}

module.exports = AccountDataService; 