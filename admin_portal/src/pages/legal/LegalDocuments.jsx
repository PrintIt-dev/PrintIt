import React from 'react';

const LegalDocuments = () => {
  return (
    <div className="p-6 md:p-10 space-y-8 max-w-5xl mx-auto">
      <div>
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-2">
          <span>Compliance &amp; Governance v2.4.0</span>
        </div>
        <h1 className="text-2xl font-bold text-on-surface">Platform Compliance &amp; Legal Standards</h1>
        <p className="text-sm text-on-surface-variant mt-1">
          Review live platform legal disclosures, automated storage purge protocols, DPDP Act 2023 governance, and regulatory dispute standards.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Privacy & Data Lifecycle */}
        <div className="p-6 rounded-2xl bg-surface-container border border-outline-variant/30 space-y-3">
          <div className="flex items-center gap-3 text-primary">
            <span className="material-symbols-outlined text-2xl">policy</span>
            <h2 className="text-lg font-bold">Privacy &amp; Document Purge</h2>
          </div>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            Multi-tier automated cleanup: Standard orders are permanently purged from cloud storage 12 hours after completion (every 30 mins). Secure Print orders are purged immediately upon counter collection (or 15 mins post-cancellation). Full DPDP Act 2023 compliance with one-click account deletion.
          </p>
          <div className="pt-2 text-xs font-mono text-primary">
            Status: Dual-Tier Cron (1-min Secure / 30-min Standard firebaseCleanup.js)
          </div>
        </div>

        {/* Card 2: Refund & Cancellation State Machine */}
        <div className="p-6 rounded-2xl bg-surface-container border border-outline-variant/30 space-y-3">
          <div className="flex items-center gap-3 text-primary">
            <span className="material-symbols-outlined text-2xl">currency_exchange</span>
            <h2 className="text-lg font-bold">Refund &amp; Cancellation Rules</h2>
          </div>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            Print orders in <code>queued</code> status qualify for 100% automated instant wallet refund upon cancellation. Orders in <code>processing</code> or <code>ready</code> cannot be cancelled due to custom paper consumption. Stationery store items can be cancelled prior to physical collection with instant stock replenishment.
          </p>
          <div className="pt-2 text-xs font-mono text-primary">
            Rule: Queued (Instant Wallet Credit) | Processing (Locked) | Store (Instant Stock Restock)
          </div>
        </div>

        {/* Card 3: Security & Payment Isolation */}
        <div className="p-6 rounded-2xl bg-surface-container border border-outline-variant/30 space-y-3">
          <div className="flex items-center gap-3 text-primary">
            <span className="material-symbols-outlined text-2xl">security</span>
            <h2 className="text-lg font-bold">Pricing, Payments &amp; Security</h2>
          </div>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            Transparent pricing with 0% platform fee. Razorpay PCI-DSS Level 1 hosted capture with HMAC SHA-256 webhook validation. Raw card data is never processed or retained on PrintIt application servers. Atomic PostgreSQL transactions prevent wallet double-spending.
          </p>
          <div className="pt-2 text-xs font-mono text-primary">
            Standard: 0% Platform Fee • HMAC SHA-256 • Atomic PostgreSQL Wallet
          </div>
        </div>

        {/* Card 4: Store Pickup & QR Verification */}
        <div className="p-6 rounded-2xl bg-surface-container border border-outline-variant/30 space-y-3">
          <div className="flex items-center gap-3 text-primary">
            <span className="material-symbols-outlined text-2xl">qr_code_scanner</span>
            <h2 className="text-lg font-bold">In-Store Fulfillment &amp; 7-Day Policy</h2>
          </div>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            All customer purchases are completed via physical in-store collection at vendor locations. Order handover requires scanning or entering the customer&apos;s unique 4-digit verification code. Orders uncollected after 7 calendar days are eligible for vendor recycling.
          </p>
          <div className="pt-2 text-xs font-mono text-primary">
            Fulfillment: In-Person Pickup • 4-Digit PIN / QR Code • 7-Day Unclaimed Shredding
          </div>
        </div>
      </div>
    </div>
  );
};

export default LegalDocuments;
