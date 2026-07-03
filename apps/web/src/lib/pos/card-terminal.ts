/**
 * Card machine (payment terminal) abstraction.
 *
 * The POS talks to a `CardTerminal` driver, never to hardware directly. This
 * keeps the checkout flow identical whether you're on the built-in simulator
 * or a real terminal (Yoco, SumUp, Ingenico, Nexo/cloud terminal API, etc.).
 *
 * To integrate a real machine, implement `CardTerminal` against the vendor SDK
 * or cloud API and swap `getTerminal()` below. Everything else stays the same.
 */

export type TerminalStage =
  | "idle"
  | "connecting"
  | "present_card" // waiting for tap / insert / swipe
  | "reading"
  | "authorizing"
  | "approved"
  | "declined"
  | "cancelled"
  | "error";

export interface TerminalUpdate {
  stage: TerminalStage;
  message: string;
}

export interface TerminalResult {
  approved: boolean;
  stage: TerminalStage;
  authCode?: string;
  cardScheme?: string; // VISA, MASTERCARD, …
  maskedPan?: string; // **** **** **** 1234
  reference?: string;
  message: string;
}

export interface ChargeRequest {
  amount: number; // major units (e.g. Rands)
  currency?: string; // ZAR
  reference?: string;
}

export interface CardTerminal {
  readonly name: string;
  /** Run a purchase; `onUpdate` streams UI-friendly stage changes. */
  charge(req: ChargeRequest, onUpdate: (u: TerminalUpdate) => void): Promise<TerminalResult>;
  /** Cancel an in-flight charge (customer/cashier abort). */
  cancel(): void;
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const SCHEMES = ["VISA", "MASTERCARD", "AMEX"];

/**
 * Simulated terminal used in demo mode. Mimics a real tap-to-pay flow with
 * realistic timing. Amounts ending in `.13` are forced to decline so you can
 * test the declined path.
 */
class SimulatedCardTerminal implements CardTerminal {
  readonly name = "Simulated Terminal";
  private cancelled = false;

  cancel() {
    this.cancelled = true;
  }

  async charge(req: ChargeRequest, onUpdate: (u: TerminalUpdate) => void): Promise<TerminalResult> {
    this.cancelled = false;

    const step = async (stage: TerminalStage, message: string, ms: number): Promise<boolean> => {
      onUpdate({ stage, message });
      await wait(ms);
      return !this.cancelled;
    };

    if (!(await step("connecting", "Connecting to terminal…", 700))) return this.abort();
    if (!(await step("present_card", "Tap, insert or swipe card", 2200))) return this.abort();
    if (!(await step("reading", "Reading card…", 900))) return this.abort();
    if (!(await step("authorizing", "Authorising payment…", 1400))) return this.abort();

    const declined = Math.abs(req.amount * 100 - Math.round(req.amount * 100)) < 0.001 &&
      Math.round(req.amount * 100) % 100 === 13; // amount ending in .13

    if (declined) {
      onUpdate({ stage: "declined", message: "Declined by issuer" });
      return {
        approved: false,
        stage: "declined",
        message: "Card declined. Please try another card.",
        reference: req.reference,
      };
    }

    const scheme = SCHEMES[Math.floor(Math.random() * SCHEMES.length)]!;
    const authCode = Math.random().toString(36).slice(2, 8).toUpperCase();
    const pan = `**** **** **** ${Math.floor(1000 + Math.random() * 9000)}`;
    onUpdate({ stage: "approved", message: "Approved" });
    return {
      approved: true,
      stage: "approved",
      authCode,
      cardScheme: scheme,
      maskedPan: pan,
      reference: req.reference,
      message: `Approved · ${scheme} ${pan}`,
    };
  }

  private abort(): TerminalResult {
    return { approved: false, stage: "cancelled", message: "Payment cancelled" };
  }
}

let terminal: CardTerminal | null = null;

/**
 * Returns the active card terminal. Replace the constructed driver here to
 * connect a real machine (behind an env flag, feature flag, or device config).
 */
export function getTerminal(): CardTerminal {
  terminal ??= new SimulatedCardTerminal();
  return terminal;
}
