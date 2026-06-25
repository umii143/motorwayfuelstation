import { useEffect } from 'react';
import { eventBus, EOC_EVENTS } from './eventBus';
import { useCustomerStore } from '../../stores/useCustomerStore';
import { useFinancialStore } from '../../stores/useFinancialStore';
import { useSupplierStore } from '../../stores/useSupplierStore';
import { logger } from '../../lib/logger';

export function EOCEventSubscriber() {
  useEffect(() => {
    logger.info('[EOC Subscriber] Mounting EOC Event Listeners');

    // Credit Sale Created
    const unsubCreditSale = eventBus.on(EOC_EVENTS.CREDIT_SALE_CREATED, async (event) => {
      logger.info(`[EOC Subscriber] Handling CREDIT_SALE_CREATED for ${event.payload.payload.customerId}`);
      const payload = event.payload.payload;
      const customerStore = useCustomerStore.getState();
      const customer = customerStore.customers.find(c => c.id === payload.customerId);
      if (customer) {
        // Customer bought fuel on credit -> their balance increases (they owe us more)
        const updatedCustomer = { ...customer, balance: customer.balance + payload.amount };
        await customerStore.handleUpdateCustomer(updatedCustomer);
      }
    });

    // Recovery Received
    const unsubRecovery = eventBus.on(EOC_EVENTS.RECOVERY_RECEIVED, async (event) => {
      logger.info(`[EOC Subscriber] Handling RECOVERY_RECEIVED for ${event.payload.payload.customerId}`);
      const payload = event.payload.payload;
      const customerStore = useCustomerStore.getState();
      const customer = customerStore.customers.find(c => c.id === payload.customerId);
      if (customer) {
        // Customer paid us -> their balance decreases
        const updatedCustomer = { ...customer, balance: customer.balance - payload.amount };
        await customerStore.handleUpdateCustomer(updatedCustomer);
      }
    });

    // Bank Deposit
    const unsubBankDeposit = eventBus.on(EOC_EVENTS.BANK_DEPOSIT, async (event) => {
      logger.info(`[EOC Subscriber] Handling BANK_DEPOSIT for ${event.payload.payload.bankAccountId}`);
      const payload = event.payload.payload;
      const financialStore = useFinancialStore.getState();
      const bank = financialStore.banks.find(b => b.id === payload.bankAccountId);
      if (bank) {
        const updatedBanks = financialStore.banks.map(b => 
          b.id === bank.id ? { ...b, balance: b.balance + payload.amount } : b
        );
        await financialStore.handleUpdateBanks(updatedBanks);
      }
    });

    // Expense Posted
    const unsubExpense = eventBus.on(EOC_EVENTS.EXPENSE_POSTED, async (event) => {
      logger.info(`[EOC Subscriber] Handling EXPENSE_POSTED from ${event.payload.payload.paidFrom}`);
      const payload = event.payload.payload;
      if (payload.paidFrom === 'bank' && payload.bankAccountId) {
        const financialStore = useFinancialStore.getState();
        const bank = financialStore.banks.find(b => b.id === payload.bankAccountId);
        if (bank) {
          const updatedBanks = financialStore.banks.map(b => 
            b.id === bank.id ? { ...b, balance: b.balance - payload.amount } : b
          );
          await financialStore.handleUpdateBanks(updatedBanks);
        }
      }
    });

    // Digital Payment
    const unsubDigitalPayment = eventBus.on(EOC_EVENTS.DIGITAL_PAYMENT, async (event) => {
      logger.info(`[EOC Subscriber] Handling DIGITAL_PAYMENT`);
      const payload = event.payload.payload;
      const financialStore = useFinancialStore.getState();
      // Need to find the digital account by method or mapping if we had the account ID
      // However, shift wizard doesn't explicitly pass digitalAccountId in processDigitalPayment yet, 
      // but if it's needed we can map it.
    });

    // Supplier Payment
    const unsubSupplierPayment = eventBus.on(EOC_EVENTS.SUPPLIER_PAYMENT, async (event) => {
      logger.info(`[EOC Subscriber] Handling SUPPLIER_PAYMENT for ${event.payload.payload.supplierId}`);
      const payload = event.payload.payload;
      const supplierStore = useSupplierStore.getState();
      const supplier = supplierStore.suppliers.find(s => s.id === payload.supplierId);
      if (supplier) {
        // We paid supplier -> balance we owe decreases
        const updatedSupplier = { ...supplier, balance: supplier.balance - payload.amount };
        await supplierStore.handleUpdateSupplier(updatedSupplier);
      }

      // If paid from bank, decrease bank balance
      if (payload.mode === 'transfer' && payload.bankAccountId) {
        const financialStore = useFinancialStore.getState();
        const bank = financialStore.banks.find(b => b.id === payload.bankAccountId);
        if (bank) {
          const updatedBanks = financialStore.banks.map(b => 
            b.id === bank.id ? { ...b, balance: b.balance - payload.amount } : b
          );
          await financialStore.handleUpdateBanks(updatedBanks);
        }
      }
    });

    return () => {
      logger.info('[EOC Subscriber] Unmounting EOC Event Listeners');
      unsubCreditSale();
      unsubRecovery();
      unsubBankDeposit();
      unsubExpense();
      unsubDigitalPayment();
      unsubSupplierPayment();
    };
  }, []);

  return null;
}
