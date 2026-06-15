const express = require('express');
const router = express.Router();
const financeController = require('../controllers/financeController');
const { authenticateJWT } = require('../middleware/auth');

// Apply authentication to all finance routes
router.use(authenticateJWT);

// Expenses
router.get('/expenses', financeController.getExpenses);
router.post('/expenses', financeController.createExpense);
router.delete('/expenses/:id', financeController.deleteExpense);

// Invoices
router.get('/invoices', financeController.getInvoices);
router.post('/invoices', financeController.createInvoice);
router.put('/invoices/:id', financeController.updateInvoice);
router.delete('/invoices/:id', financeController.deleteInvoice);

// Finance aggregated reports
router.get('/summary', financeController.getFinanceSummary);
router.get('/termins', financeController.getFinanceTermins);
router.get('/outstanding', financeController.getFinanceOutstanding);
router.get('/retensi', financeController.getFinanceRetensi);
router.get('/cashflow', financeController.getFinanceCashflow);
router.get('/pajak', financeController.getFinancePajak);
router.patch('/termins/:terminId/status', financeController.updateFinanceTerminStatus);

module.exports = router;

