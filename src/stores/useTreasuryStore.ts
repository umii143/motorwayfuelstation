import { create } from 'zustand';
import { CashAccount, TreasuryTransaction, OwnerDrawing, CashReconciliation, CashAccountType } from '../types';
import { withBusinessScope } from '../lib/businessScope';
import { db } from '../data/db';

interface TreasuryState {
  cashAccounts: CashAccount[];
  treasuryTransactions: TreasuryTransaction[];
  ownerDrawings: OwnerDrawing[];
  reconciliations: CashReconciliation[];

  loadTreasuryData: (stationId: string) => void;

  handleAddCashAccount: (account: CashAccount, orgId: string, stationId: string) => void;
  handleUpdateCashAccount: (updatedAccount: CashAccount, stationId: string) => void;
  
  transferFunds: (sourceId: string, destId: string, amount: number, description: string, user: string, orgId: string, stationId: string) => void;
  recordOwnerDrawing: (sourceId: string, amount: number, description: string, user: string, orgId: string, stationId: string) => void;
  recordReconciliation: (accountId: string, expected: number, physical: number, notes: string, user: string, shiftId: string | undefined, orgId: string, stationId: string) => void;
  recordTransaction: (transaction: TreasuryTransaction, orgId: string, stationId: string) => void;
}

export const useTreasuryStore = create<TreasuryState>((set, get) => ({
  cashAccounts: [],
  treasuryTransactions: [],
  ownerDrawings: [],
  reconciliations: [],

  loadTreasuryData: (stationId) => {
    set({
      cashAccounts: db.getCashAccounts(stationId),
      treasuryTransactions: db.getTreasuryTransactions(stationId),
      ownerDrawings: db.getOwnerDrawings(stationId),
      reconciliations: db.getCashReconciliations(stationId),
    });
  },

  handleAddCashAccount: (account, orgId, stationId) => {
    const finalAcc = withBusinessScope(account, orgId, stationId);
    finalAcc.createdAt = Date.now();
    finalAcc.updatedAt = Date.now();

    const current = db.getCashAccounts(stationId);
    const updated = [...current, finalAcc];
    db.saveCashAccounts(stationId, updated);
    
    set({ cashAccounts: updated });
  },

  handleUpdateCashAccount: (updatedAccount, stationId) => {
    updatedAccount.updatedAt = Date.now();
    const current = db.getCashAccounts(stationId);
    const updated = current.map((a) => (a.id === updatedAccount.id ? updatedAccount : a));
    db.saveCashAccounts(stationId, updated);
    
    set({ cashAccounts: updated });
  },

  transferFunds: (sourceId, destId, amount, description, user, orgId, stationId) => {
    const currentAccounts = db.getCashAccounts(stationId);
    const currentTxns = db.getTreasuryTransactions(stationId);
    
    const sourceAcc = currentAccounts.find(a => a.id === sourceId);
    const destAcc = currentAccounts.find(a => a.id === destId);
    if (!sourceAcc || !destAcc) throw new Error("Invalid accounts");

    const txn: TreasuryTransaction = withBusinessScope({
      id: `trx_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      date: new Date().toISOString(),
      sourceAccountId: sourceId,
      sourceAccountType: sourceAcc.type,
      destinationAccountId: destId,
      destinationAccountType: destAcc.type,
      amount,
      type: 'transfer',
      description,
      performedBy: user,
      status: 'completed'
    }, orgId, stationId);

    txn.createdAt = Date.now();
    txn.updatedAt = Date.now();

    const updatedSource = { ...sourceAcc, balance: sourceAcc.balance - amount, updatedAt: Date.now() };
    const updatedDest = { ...destAcc, balance: destAcc.balance + amount, updatedAt: Date.now() };

    const newAccounts = currentAccounts.map(a => 
      a.id === sourceId ? updatedSource : 
      a.id === destId ? updatedDest : a
    );
    const newTxns = [...currentTxns, txn];

    db.saveCashAccounts(stationId, newAccounts);
    db.saveTreasuryTransactions(stationId, newTxns);

    set({
      cashAccounts: newAccounts,
      treasuryTransactions: newTxns
    });
  },

  recordOwnerDrawing: (sourceId, amount, description, user, orgId, stationId) => {
    const currentAccounts = db.getCashAccounts(stationId);
    const currentTxns = db.getTreasuryTransactions(stationId);
    const currentDrawings = db.getOwnerDrawings(stationId);

    const sourceAcc = currentAccounts.find(a => a.id === sourceId);
    if (!sourceAcc) throw new Error("Invalid source account");

    const drawing: OwnerDrawing = withBusinessScope({
      id: `dwg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      date: new Date().toISOString(),
      amount,
      sourceAccountId: sourceId,
      sourceAccountType: sourceAcc.type,
      description,
      withdrawnBy: user,
    }, orgId, stationId);

    drawing.createdAt = Date.now();
    drawing.updatedAt = Date.now();

    const txn: TreasuryTransaction = withBusinessScope({
      id: `trx_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      date: new Date().toISOString(),
      sourceAccountId: sourceId,
      sourceAccountType: sourceAcc.type,
      amount,
      type: 'withdrawal',
      description: `Owner Drawing: ${description}`,
      performedBy: user,
      referenceId: drawing.id,
      status: 'completed'
    }, orgId, stationId);

    txn.createdAt = Date.now();
    txn.updatedAt = Date.now();

    const updatedSource = { ...sourceAcc, balance: sourceAcc.balance - amount, updatedAt: Date.now() };
    const newAccounts = currentAccounts.map(a => a.id === sourceId ? updatedSource : a);
    const newTxns = [...currentTxns, txn];
    const newDrawings = [...currentDrawings, drawing];

    db.saveCashAccounts(stationId, newAccounts);
    db.saveTreasuryTransactions(stationId, newTxns);
    db.saveOwnerDrawings(stationId, newDrawings);

    set({
      cashAccounts: newAccounts,
      treasuryTransactions: newTxns,
      ownerDrawings: newDrawings
    });
  },

  recordReconciliation: (accountId, expected, physical, notes, user, shiftId, orgId, stationId) => {
    const currentAccounts = db.getCashAccounts(stationId);
    const currentTxns = db.getTreasuryTransactions(stationId);
    const currentRecs = db.getCashReconciliations(stationId);

    const acc = currentAccounts.find(a => a.id === accountId);
    if (!acc) throw new Error("Invalid account for reconciliation");

    const variance = physical - expected;

    const rec: CashReconciliation = withBusinessScope({
      id: `rec_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      date: new Date().toISOString(),
      accountId,
      shiftId,
      expectedCash: expected,
      physicalCash: physical,
      variance,
      notes,
      reconciledBy: user
    }, orgId, stationId);

    rec.createdAt = Date.now();
    rec.updatedAt = Date.now();

    let txn: TreasuryTransaction | null = null;
    if (variance !== 0) {
      txn = withBusinessScope({
        id: `trx_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        date: new Date().toISOString(),
        [variance > 0 ? 'destinationAccountId' : 'sourceAccountId']: accountId,
        [variance > 0 ? 'destinationAccountType' : 'sourceAccountType']: acc.type,
        amount: Math.abs(variance),
        type: 'adjustment',
        description: `Cash Variance Adjustment: ${variance > 0 ? 'Overage' : 'Shortage'} - ${notes}`,
        performedBy: user,
        referenceId: rec.id,
        status: 'completed'
      }, orgId, stationId);
      txn.createdAt = Date.now();
      txn.updatedAt = Date.now();
    }

    const updatedAcc = { ...acc, balance: physical, updatedAt: Date.now() }; // Correct balance to physical
    const newAccounts = currentAccounts.map(a => a.id === accountId ? updatedAcc : a);
    const newTxns = txn ? [...currentTxns, txn] : currentTxns;
    const newRecs = [...currentRecs, rec];

    db.saveCashAccounts(stationId, newAccounts);
    if (txn) db.saveTreasuryTransactions(stationId, newTxns);
    db.saveCashReconciliations(stationId, newRecs);

    set({
      cashAccounts: newAccounts,
      reconciliations: newRecs,
      treasuryTransactions: newTxns
    });
  },

  recordTransaction: (transaction, orgId, stationId) => {
    const finalTxn = withBusinessScope(transaction, orgId, stationId);
    finalTxn.createdAt = Date.now();
    finalTxn.updatedAt = Date.now();
    
    const currentAccounts = db.getCashAccounts(stationId);
    const currentTxns = db.getTreasuryTransactions(stationId);
    let updatedAccounts = [...currentAccounts];
    let dirty = false;

    if (finalTxn.sourceAccountId && finalTxn.status === 'completed') {
      const src = updatedAccounts.find(a => a.id === finalTxn.sourceAccountId);
      if (src) {
        src.balance -= finalTxn.amount;
        src.updatedAt = Date.now();
        dirty = true;
      }
    }
    
    if (finalTxn.destinationAccountId && finalTxn.status === 'completed') {
      const dest = updatedAccounts.find(a => a.id === finalTxn.destinationAccountId);
      if (dest) {
        dest.balance += finalTxn.amount;
        dest.updatedAt = Date.now();
        dirty = true;
      }
    }

    const newTxns = [...currentTxns, finalTxn];
    db.saveTreasuryTransactions(stationId, newTxns);
    
    if (dirty) {
      db.saveCashAccounts(stationId, updatedAccounts);
    }

    set({
      treasuryTransactions: newTxns,
      cashAccounts: dirty ? updatedAccounts : currentAccounts
    });
  }
}));
