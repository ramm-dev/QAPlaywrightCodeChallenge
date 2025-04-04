// @ts-check
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

test.describe('ParaBank API Tests', () => {
  let accountId;
  let customerId;
  let baseUrl = 'https://parabank.parasoft.com';

  test.beforeAll(async () => {
    // Try to load account data from the file created by UI tests
    try {
      const accountBalanceFilePath = path.join(__dirname, '../results/accountBalance.json');
      if (fs.existsSync(accountBalanceFilePath)) {
        const accountData = JSON.parse(fs.readFileSync(accountBalanceFilePath, 'utf8'));
        if (accountData.accounts && accountData.accounts.length > 0) {
          accountId = accountData.accounts[0].id;
          customerId = accountData.id;
          console.log(`Using account ID: ${accountId} and customer ID: ${customerId} from file`);
        }
      }
    } catch (error) {
      console.error('Error loading account data:', error);
    }
  });

  test('Get transactions by amount with exact URL format', async ({ request }) => {
    // Skip test if no account ID is available
    test.skip(!accountId, 'No account ID available');

    // Create a transaction first to ensure we have data
    const createTransactionResponse = await request.post(`${baseUrl}/parabank/services_proxy/bank/transfer`, {
      form: {
        fromAccountId: accountId,
        toAccountId: accountId, // Transfer to same account for simplicity
        amount: '50.00'
      }
    });
    
    expect(createTransactionResponse.ok()).toBeTruthy();
    
    // Wait a moment for the transaction to be processed
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Get transactions by amount using the exact URL format from the request
    const response = await request.get(
      `${baseUrl}/parabank/services_proxy/bank/accounts/${accountId}/transactions/amount/50?timeout=30000`
    );
    
    expect(response.ok()).toBeTruthy();
    
    // Parse the response
    const responseBody = await response.json();
    console.log('Transactions by amount response:', JSON.stringify(responseBody, null, 2));
    
    // Validate the response structure
    expect(Array.isArray(responseBody)).toBeTruthy();
    
    if (responseBody.length > 0) {
      // Validate transaction properties
      const transaction = responseBody[0];
      expect(transaction).toHaveProperty('id');
      expect(transaction).toHaveProperty('accountId');
      expect(transaction).toHaveProperty('type');
      expect(transaction).toHaveProperty('amount');
      
      // Validate the amount is correct (50.00)
      expect(parseFloat(transaction.amount)).toBeCloseTo(50.00, 2);
      
      // Save the transaction details to a file
      const dirPath = path.join(__dirname, '../results');
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
      
      fs.writeFileSync(
        path.join(dirPath, 'transaction-by-amount.json'),
        JSON.stringify(responseBody, null, 2)
      );
    } else {
      console.log('No transactions found with amount 50.00');
    }
  });

  test('Get transactions by amount with different values', async ({ request }) => {
    // Skip test if no account ID is available
    test.skip(!accountId, 'No account ID available');
    
    // Test with multiple amount values
    const amountsToTest = [25, 50, 100];
    
    for (const amount of amountsToTest) {
      console.log(`Testing transactions with amount: ${amount}`);
      
      // Get transactions by amount
      const response = await request.get(
        `${baseUrl}/parabank/services_proxy/bank/accounts/${accountId}/transactions/amount/${amount}?timeout=30000`
      );
      
      expect(response.ok()).toBeTruthy();
      
      // Parse the response
      const responseBody = await response.json();
      console.log(`Found ${responseBody.length} transactions with amount ${amount}`);
      
      // Validate the response structure
      expect(Array.isArray(responseBody)).toBeTruthy();
      
      // For each transaction found, validate its properties
      responseBody.forEach(transaction => {
        expect(transaction).toHaveProperty('id');
        expect(transaction).toHaveProperty('accountId');
        expect(transaction).toHaveProperty('type');
        expect(transaction).toHaveProperty('amount');
        
        // Validate the amount is correct
        expect(parseFloat(transaction.amount)).toBeCloseTo(amount, 2);
      });
    }
  });

  test('Get transactions by date range', async ({ request }) => {
    // Skip test if no account ID is available
    test.skip(!accountId, 'No account ID available');
    
    // Get current date and date from 30 days ago
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    // Format dates as MM-DD-YYYY
    const formatDate = (date) => {
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const year = date.getFullYear();
      return `${month}-${day}-${year}`;
    };
    
    const fromDate = formatDate(thirtyDaysAgo);
    const toDate = formatDate(today);
    
    // Get transactions by date range
    const response = await request.get(
      `${baseUrl}/parabank/services_proxy/bank/accounts/${accountId}/transactions/fromDate/${fromDate}/toDate/${toDate}?timeout=30000`
    );
    
    expect(response.ok()).toBeTruthy();
    
    // Parse the response
    const responseBody = await response.json();
    console.log('Transactions by date range response:', JSON.stringify(responseBody, null, 2));
    
    // Validate the response structure
    expect(Array.isArray(responseBody)).toBeTruthy();
    
    // Save the transactions to a file for reference
    const dirPath = path.join(__dirname, '../results');
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    
    fs.writeFileSync(
      path.join(dirPath, 'transactions.json'),
      JSON.stringify(responseBody, null, 2)
    );
  });

  test('Get account details', async ({ request }) => {
    // Skip test if no account ID is available
    test.skip(!accountId, 'No account ID available');
    
    // Get account details
    const response = await request.get(
      `${baseUrl}/parabank/services_proxy/bank/accounts/${accountId}?timeout=30000`
    );
    
    expect(response.ok()).toBeTruthy();
    
    // Parse the response
    const responseBody = await response.json();
    console.log('Account details response:', JSON.stringify(responseBody, null, 2));
    
    // Validate the response structure
    expect(responseBody).toHaveProperty('id');
    expect(responseBody).toHaveProperty('customerId');
    expect(responseBody).toHaveProperty('balance');
    expect(responseBody).toHaveProperty('type');
    
    // Validate the account ID matches
    expect(responseBody.id).toBe(parseInt(accountId));
  });
}); 