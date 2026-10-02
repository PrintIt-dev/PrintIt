import React from 'react';
import { Link } from 'react-router-dom';

const RefundCancellationPolicy = () => {
  return (
    <div className="min-h-screen bg-background text-on-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-surface-container border border-outline-variant/30 rounded-2xl p-6 sm:p-10 shadow-xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-outline-variant/20 pb-6 mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider">
              <span className="material-symbols-outlined text-sm">currency_exchange</span>
              <span>Consumer Protection Guarantee</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-on-surface mt-2 font-display-lg tracking-tight">
              Refund &amp; Cancellation Policy
            </h1>
            <p className="text-xs text-on-surface-variant mt-1.5 font-label-md flex flex-wrap items-center gap-2">
              <span className="font-semibold text-primary">Version 2.4.0 (Latest Release)</span>
              <span>•</span>
              <span>Effective Date: October 2, 2026</span>
              <span>•</span>
              <span>Covers Custom Prints &amp; Stationery Store</span>
            </p>
          </div>
          <Link
            to="/"
            className="self-start sm:self-auto px-4 py-2 rounded-xl bg-surface-container-highest border border-outline-variant text-xs font-semibold text-on-surface hover:bg-surface-variant transition-colors inline-flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            <span>Back to Home</span>
          </Link>
        </div>

        {/* Highlight Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="p-4 rounded-xl bg-surface-container-highest/60 border border-outline-variant/30 flex items-start gap-3">
            <span className="material-symbols-outlined text-primary text-2xl mt-0.5">bolt</span>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface">Instant Wallet Refund</h3>
              <p className="text-xs text-on-surface-variant mt-1">
                100% automated refund credited to your digital wallet the moment a queued order is cancelled.
              </p>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-surface-container-highest/60 border border-outline-variant/30 flex items-start gap-3">
            <span className="material-symbols-outlined text-primary text-2xl mt-0.5">money_off</span>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface">Zero Cancellation Fee</h3>
              <p className="text-xs text-on-surface-variant mt-1">
                No penalty, deduction, or gateway surcharge on valid queued print or store cancellations.
              </p>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-surface-container-highest/60 border border-outline-variant/30 flex items-start gap-3">
            <span className="material-symbols-outlined text-primary text-2xl mt-0.5">published_with_changes</span>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface">Misprint Redressal</h3>
              <p className="text-xs text-on-surface-variant mt-1">
                24-hour dispute window for machine banding, ink defects, or wrong sizes with free reprint or full credit.
              </p>
            </div>
          </div>
        </div>

        {/* Content Sections */}
        <div className="space-y-8 text-sm text-on-surface-variant leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-on-surface mb-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-primary/10 text-primary inline-flex items-center justify-center text-xs font-bold">1</span>
              <span>Order State Machine &amp; Cancellation Windows</span>
            </h2>
            <p>
              Print orders are processed through a deterministic sequential state engine. Cancellation eligibility depends strictly on physical material consumption:
            </p>
            <div className="my-4 p-4 rounded-xl bg-surface-container-highest/60 border border-outline-variant/30 font-label-md text-xs text-on-surface flex flex-wrap items-center justify-between gap-2">
              <span className="font-bold text-primary">QUEUED</span>
              <span>➔</span>
              <span className="font-bold text-amber-500">PROCESSING</span>
              <span>➔</span>
              <span className="font-bold text-blue-500">READY FOR PICKUP</span>
              <span>➔</span>
              <span className="font-bold text-emerald-500">COLLECTED</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <div className="p-4 rounded-xl bg-surface-container-highest/40 border border-emerald-500/30">
                <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Cancellations Allowed (Status: Queued)</div>
                <p className="text-xs text-on-surface-variant mt-1.5 leading-normal">
                  While an order remains in <code>queued</code> status awaiting shopkeeper acceptance, you can cancel instantly with one tap. Guest orders can also be cancelled using the secure <code>cancel_token</code> provided during checkout.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-surface-container-highest/40 border border-error/30">
                <div className="text-xs font-bold text-error uppercase tracking-wider">Cancellations Locked (Status: Processing / Ready)</div>
                <p className="text-xs text-on-surface-variant mt-1.5 leading-normal">
                  Once the vendor accepts the job and changes status to <code>processing</code> or <code>ready</code>, custom paper (A4, A3, B5), toner, and binding materials are irreversibly consumed. Custom print orders in progress cannot be cancelled or refunded, except in verified equipment misprints.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-on-surface mb-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-primary/10 text-primary inline-flex items-center justify-center text-xs font-bold">2</span>
              <span>Automated Atomic Refund Processing</span>
            </h2>
            <p>
              When an eligible cancellation is triggered in the <code>queued</code> status or initiated by a vendor decline:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-2 mt-2">
              <li>
                <strong>Instant Wallet Credit:</strong> 100% of the total transaction amount is credited directly back to your in-app PrintIt Wallet ledger within milliseconds using atomic PostgreSQL database transactions (<code>SELECT FOR UPDATE</code>) to guarantee zero balance discrepancies.
              </li>
              <li>
                <strong>Zero Fee Deductions:</strong> With PrintIt&apos;s transparent 0% platform fee policy, you receive every single rupee back without convenience deductions, payment gateway fees, or cancellation surcharges.
              </li>
              <li>
                <strong>Pay at Shop (COD):</strong> For orders placed with the Pay at Shop option, cancellation instantly relieves you of any payment liability and cancels the pending counter invoice.
              </li>
              <li>
                <strong>No Expiration on Wallet Balance:</strong> Refunded wallet funds remain in your account indefinitely and can be applied toward any future document printing or stationery purchase across any partner shop.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-on-surface mb-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-primary/10 text-primary inline-flex items-center justify-center text-xs font-bold">3</span>
              <span>Shopkeeper Rejections &amp; Machine Outages</span>
            </h2>
            <p>
              If a partner print shop is unable to fulfill an order due to printer hardware breakdown, power outages, temporary paper stock shortages (A4, A3, B5), or corrupt unrenderable source files:
            </p>
            <ul className="list-disc list-inside space-y-1.5 ml-2 mt-2">
              <li>The vendor shopkeeper marks the order as rejected or cancelled in their live queue dashboard.</li>
              <li>A 100% automated instant refund is immediately credited to your in-app wallet balance.</li>
              <li>You receive an instant push notification and audio alert explaining the shop status, enabling you to immediately route your print job to another nearby print shop.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-on-surface mb-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-primary/10 text-primary inline-flex items-center justify-center text-xs font-bold">4</span>
              <span>Stationery &amp; Marketplace Product Orders</span>
            </h2>
            <p>
              For physical merchandise, office supplies, notebooks, pens, and manuals purchased via the PrintIt Store (<code>/store</code>):
            </p>
            <ul className="list-disc list-inside space-y-1.5 ml-2 mt-2">
              <li>
                <strong>Pre-Pickup Cancellation:</strong> You can cancel any stationery order at any time before collecting it at the store. The system automatically restores product inventory (<code>stock_count</code>) and issues a 100% instant wallet refund.
              </li>
              <li>
                <strong>Post-Pickup Inspection:</strong> Customers must inspect physical stationery at pickup. Returns or replacements after counter collection are accepted within 48 hours solely for defective bindings, damaged covers, or mismatched items.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-on-surface mb-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-primary/10 text-primary inline-flex items-center justify-center text-xs font-bold">5</span>
              <span>Defective Prints &amp; Misprint Guarantee</span>
            </h2>
            <p>
              We guarantee commercial-grade printing fidelity:
            </p>
            <ul className="list-disc list-inside space-y-1.5 ml-2 mt-2">
              <li>
                <strong>Counter Resolution:</strong> If you observe toner streaks, smeared ink, truncated margins, or incorrect binding upon physical pickup, inform the shopkeeper immediately for an on-the-spot reprint at no extra charge.
              </li>
              <li>
                <strong>Support Center Dispute Window:</strong> If an agreeable solution is not reached at the counter, raise a ticket via the in-app <strong>Support Center</strong> (<code>/support</code>) within 24 hours of collection, attaching clear photos of the misprint.
              </li>
              <li>
                <strong>Remedy:</strong> Verified equipment or vendor defects qualify for a full wallet refund or coordinated priority re-run.
              </li>
              <li>
                <strong>Source Document Responsibility:</strong> PrintIt and partner vendors are not liable for typographical errors, low image resolution, or formatting flaws present within customer-submitted original files.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-on-surface mb-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-primary/10 text-primary inline-flex items-center justify-center text-xs font-bold">6</span>
              <span>In-Person Store Fulfillment &amp; 7-Day Unclaimed Policy</span>
            </h2>
            <p>
              All orders placed on PrintIt are designated exclusively for in-person physical store collection at your selected partner shop (Express Pickup, Scheduled Pickup, or Walk-in). PrintIt does not operate third-party courier delivery.
            </p>
            <p className="mt-2 text-xs text-on-surface-variant">
              <strong>7-Day Retention:</strong> Completed orders must be collected within seven (7) calendar days of notification. Orders left uncollected past 7 days may be recycled or securely shredded by the shopkeeper to protect physical shelf space, without refund entitlement.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-on-surface mb-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-primary/10 text-primary inline-flex items-center justify-center text-xs font-bold">7</span>
              <span>Support &amp; Dispute Inquiries</span>
            </h2>
            <p>
              For questions regarding cancellation status, wallet refunds, or dispute reviews, please contact our support team:
            </p>
            <div className="mt-3 p-4 rounded-xl bg-surface-container-highest/60 border border-outline-variant/30 text-xs space-y-1">
              <div><strong>PrintIt Dispute &amp; Escalation Desk</strong></div>
              <div><strong>Email:</strong> <a href="mailto:support@printit.com" className="text-primary underline">support@printit.com</a></div>
              <div><strong>In-App Support:</strong> Open Support Center in your app or portal</div>
              <div><strong>Jurisdiction:</strong> Maharashtra, Republic of India</div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default RefundCancellationPolicy;
