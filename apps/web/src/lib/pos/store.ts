"use client";

import { create } from "zustand";

export const VAT_RATE = 0.15; // South African VAT, prices are VAT-inclusive.

export type PaymentMethod = "CASH" | "CARD" | "WALLET" | "LOYALTY" | "PAYROLL";

export interface CartLine {
  id: string;
  label: string;
  unitPrice: number;
  qty: number;
  kind: "retail" | "meal";
}

export interface Customer {
  id: string;
  name: string;
  employeeNumber: string;
  walletBalance: number;
  loyaltyPoints: number;
}

export interface Payment {
  method: PaymentMethod;
  amount: number;
  authCode?: string;
  cardScheme?: string;
  maskedPan?: string;
}

export interface Sale {
  id: string;
  receiptNumber: string;
  at: string;
  lines: CartLine[];
  subtotal: number;
  discount: number;
  vat: number;
  total: number;
  payments: Payment[];
  change: number;
  customer: Customer | null;
  cashier: string;
}

export interface Shift {
  id: string;
  openedAt: string;
  openingFloat: number;
  sales: Sale[];
}

export interface HeldSale {
  id: string;
  at: string;
  lines: CartLine[];
  customer: Customer | null;
}

export interface Totals {
  count: number;
  subtotal: number;
  discount: number;
  vat: number;
  total: number;
}

const round = (n: number) => Math.round(n * 100) / 100;

export function computeTotals(cart: CartLine[], discount: number): Totals {
  const subtotal = round(cart.reduce((s, l) => s + l.unitPrice * l.qty, 0));
  const total = round(Math.max(0, subtotal - discount));
  const vat = round((total * VAT_RATE) / (1 + VAT_RATE));
  const count = cart.reduce((s, l) => s + l.qty, 0);
  return { count, subtotal, discount: round(discount), vat, total };
}

const rid = (p: string) => `${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`.toUpperCase();

interface PosState {
  shift: Shift | null;
  cart: CartLine[];
  customer: Customer | null;
  discount: number;
  held: HeldSale[];
  lastSale: Sale | null;

  openShift: (openingFloat: number) => void;
  closeShift: () => void;

  addItem: (item: Omit<CartLine, "qty">) => void;
  inc: (id: string) => void;
  dec: (id: string) => void;
  removeLine: (id: string) => void;
  setDiscount: (amount: number) => void;
  clearCart: () => void;

  setCustomer: (c: Customer | null) => void;

  hold: () => void;
  recall: (id: string) => void;
  deleteHeld: (id: string) => void;

  completeSale: (payments: Payment[], change: number, cashier: string) => Sale | null;
  clearLastSale: () => void;
}

export const usePos = create<PosState>((set, get) => ({
  shift: null,
  cart: [],
  customer: null,
  discount: 0,
  held: [],
  lastSale: null,

  openShift: (openingFloat) =>
    set({ shift: { id: rid("SH"), openedAt: new Date().toISOString(), openingFloat, sales: [] } }),

  closeShift: () => set({ shift: null, cart: [], customer: null, discount: 0, held: [] }),

  addItem: (item) =>
    set((s) => {
      const existing = s.cart.find((l) => l.id === item.id);
      if (existing) {
        return { cart: s.cart.map((l) => (l.id === item.id ? { ...l, qty: l.qty + 1 } : l)) };
      }
      return { cart: [...s.cart, { ...item, qty: 1 }] };
    }),

  inc: (id) => set((s) => ({ cart: s.cart.map((l) => (l.id === id ? { ...l, qty: l.qty + 1 } : l)) })),
  dec: (id) =>
    set((s) => ({
      cart: s.cart.map((l) => (l.id === id ? { ...l, qty: l.qty - 1 } : l)).filter((l) => l.qty > 0),
    })),
  removeLine: (id) => set((s) => ({ cart: s.cart.filter((l) => l.id !== id) })),
  setDiscount: (amount) => set({ discount: Math.max(0, amount) }),
  clearCart: () => set({ cart: [], discount: 0, customer: null }),

  setCustomer: (customer) => set({ customer }),

  hold: () =>
    set((s) => {
      if (s.cart.length === 0) return {};
      return {
        held: [...s.held, { id: rid("HOLD"), at: new Date().toISOString(), lines: s.cart, customer: s.customer }],
        cart: [],
        customer: null,
        discount: 0,
      };
    }),
  recall: (id) =>
    set((s) => {
      const h = s.held.find((x) => x.id === id);
      if (!h) return {};
      return { cart: h.lines, customer: h.customer, held: s.held.filter((x) => x.id !== id) };
    }),
  deleteHeld: (id) => set((s) => ({ held: s.held.filter((x) => x.id !== id) })),

  completeSale: (payments, change, cashier) => {
    const s = get();
    if (s.cart.length === 0 || !s.shift) return null;
    const t = computeTotals(s.cart, s.discount);
    const sale: Sale = {
      id: rid("SALE"),
      receiptNumber: rid("RC"),
      at: new Date().toISOString(),
      lines: s.cart,
      subtotal: t.subtotal,
      discount: t.discount,
      vat: t.vat,
      total: t.total,
      payments,
      change,
      customer: s.customer,
      cashier,
    };
    set({
      shift: { ...s.shift, sales: [...s.shift.sales, sale] },
      cart: [],
      customer: null,
      discount: 0,
      lastSale: sale,
    });
    return sale;
  },
  clearLastSale: () => set({ lastSale: null }),
}));
