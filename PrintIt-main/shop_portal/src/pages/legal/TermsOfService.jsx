import React from 'react';
import { Link } from 'react-router-dom';

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-background text-on-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-surface-container border border-outline-variant/30 rounded-2xl p-6 sm:p-10 shadow-xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-outline-variant/20 pb-6 mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider">
              <span className="material-symbols-outlined text-sm">gavel</span>
              <span>Binding Legal Agreement</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-on-surface mt-2 font-display-lg tracking-tight">
              Terms of Service
            </h1>
            <p className="text-xs text-on-surface-variant mt-1.5 font-label-md flex flex-wrap items-center gap-2">
              <span className="font-semibold text-primary">Version 2.4.0 (Latest Release)</span>
              <span>•</span>
              <span>Effective Date: October 2, 2026</span>
              <span>•</span>
              <span>Covers Document Printing &amp; Stationery Marketplace</span>
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

        {/* Feature Badges */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="p-4 rounded-xl bg-surface-container-highest/60 border border-outline-variant/30 flex items-start gap-3">
            <span className="material-symbols-outlined text-primary text-2xl mt-0.5">percent</span>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface">Zero Platform Fee</h3>
              <p className="text-xs text-on-surface-variant mt-1">
                Transparent vendor rates with 0% platform surcharge and no hidden checkout markups.
              </p>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-surface-container-highest/60 border border-outline-variant/30 flex items-start gap-3">
            <span className="material-symbols-outlined text-primary text-2xl mt-0.5">currency_exchange</span>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface">Instant Wallet Refund</h3>
              <p className="text-xs text-on-surface-variant mt-1">
                100% automated refund on unprinted queued orders and uncollected stationery items.
              </p>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-surface-container-highest/60 border border-outline-variant/30 flex items-start gap-3">
            <span className="material-symbols-outlined text-primary text-2xl mt-0.5">verified</span>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface">Reprint Guarantee</h3>
              <p className="text-xs text-on-surface-variant mt-1">
                Equipment misprints resolved via in-app tickets with prompt vendor reprints or wallet refunds.
              </p>
            </div>
          </div>
        </div>

        {/* Legal Clauses */}
        <div className="space-y-8 text-sm text-on-surface-variant leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-on-surface mb-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-primary/10 text-primary inline-flex items-center justify-center text-xs font-bold">1</span>
              <span>Acceptance of Terms</span>
            </h2>
            <p>
              By accessing, browsing, registering for, or using the <strong>PrintIt</strong> platform (&quot;PrintIt&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;the Platform&quot;), whether as an individual customer placing print or stationery orders, an affiliated partner operating a commercial print shop, or an administrator, you agree to be bound by these Terms of Service (&quot;Terms&quot;) and our Privacy Policy. If you do not agree to these Terms, you must immediately discontinue use of the platform.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-on-surface mb-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-primary/10 text-primary inline-flex items-center justify-center text-xs font-bold">2</span>
              <span>Platform Role &amp; Multi-Service Scope</span>
            </h2>
            <p>
              PrintIt operates a digital marketplace and print orchestration engine linking consumers directly with independent local printing and stationery vendors. PrintIt acts as a digital intermediary facilitating:
            </p>
            <ul className="list-disc list-inside space-y-1.5 ml-2 mt-2">
              <li>
                <strong>Custom Document Printing:</strong> Multi-format file uploads (PDF, DOC/DOCX, PPT/PPTX, XLS/XLSX, TXT, PNG, JPG) with custom configurations including Black &amp; White, Full Color, paper sizes (A4, A3, B5, Letter, Legal), Single-Sided or Duplex printing, custom page ranges, and finishing options (Staple, Spiral Binding, Softcover, Hardcover).
              </li>
              <li>
                <strong>Order Modalities:</strong> Express Counter Pickup, Scheduled Pickup time slots, and Walk-in orders via the shopkeeper portal.
              </li>
              <li>
                <strong>Stationery &amp; Supplies Marketplace:</strong> Purchase of physical notebooks, pens, printing supplies, and custom branded stationery via the PrintIt Store.
              </li>
              <li>
                <strong>Real-Time Live Queue:</strong> Server-Sent Events (SSE) and push notification monitoring of order fulfillment states.
              </li>
              <li>
                <strong>Payment &amp; Wallet Infrastructure:</strong> Integrated payment gateway, in-app digital wallet ledger, and settlement engine.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-on-surface mb-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-primary/10 text-primary inline-flex items-center justify-center text-xs font-bold">3</span>
              <span>Transparent Pricing, Zero Platform Fee &amp; Payments</span>
            </h2>
            <p>
              We believe in 100% price transparency with zero unexpected costs:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-2 mt-2">
              <li>
                <strong>Dynamic Pricing Matrix:</strong> Print quotations are calculated server-side based strictly on the rate card configured by the individual print shop you select (per-page B&amp;W rate, color rate, paper size multiplier, duplexing discounts, and binding charges).
              </li>
              <li>
                <strong>Zero Platform Fee:</strong> In our latest release, PrintIt charges <strong>0% platform fee</strong> to customers on print orders. The price you see is the exact amount charged by the vendor.
              </li>
              <li>
                <strong>Payment Methods:</strong> Orders may be settled via Razorpay (UPI, Credit/Debit cards, Net Banking), your PrintIt Digital Wallet, or &quot;Pay at Shop&quot; (Cash on Delivery / in-person cash settlement).
              </li>
              <li>
                <strong>In-App Wallet:</strong> Wallet top-ups are non-transferable between accounts and are dedicated to platform services. Wallet credits issued from refunds can be applied instantly toward future orders without expiration.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-on-surface mb-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-primary/10 text-primary inline-flex items-center justify-center text-xs font-bold">4</span>
              <span>In-Store Collection, Verification &amp; Unclaimed Items</span>
            </h2>
            <p>
              To eliminate shipping carbon footprint and package delays, PrintIt operates on an in-person physical store pickup model:
            </p>
            <ul className="list-disc list-inside space-y-1.5 ml-2 mt-2">
              <li>
                <strong>Order Handover Verification:</strong> Customers must provide their order ID or unique 4-digit pickup PIN to the shopkeeper at the counter to verify and collect their order.
              </li>
              <li>
                <strong>Order Lifecycle States:</strong> Orders progress through deterministic states: <code>queued</code> ➔ <code>processing</code> ➔ <code>ready</code> ➔ <code>collected</code> (or <code>cancelled</code>).
              </li>
              <li>
                <strong>7-Day Unclaimed Document Policy:</strong> Because physical paper, toner, and shelf storage are limited resources, printed orders left uncollected for more than seven (7) calendar days may be safely recycled or shredded by the vendor shopkeeper without liability for refund.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-on-surface mb-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-primary/10 text-primary inline-flex items-center justify-center text-xs font-bold">5</span>
              <span>Cancellation &amp; Refund Policy</span>
            </h2>
            <p>
              Our automated state machine handles cancellations fairly based on material consumption:
            </p>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-4 rounded-xl bg-surface-container-highest/60 border border-outline-variant/30">
                <div className="text-xs font-bold text-primary uppercase tracking-wider">Queued Print Orders</div>
                <p className="text-xs text-on-surface-variant mt-1.5 leading-normal">
                  While an order is in <code>queued</code> status (prior to shop acceptance), you may cancel at any time. A <strong>100% full refund is instantly credited</strong> to your PrintIt wallet ledger.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-surface-container-highest/60 border border-outline-variant/30">
                <div className="text-xs font-bold text-error uppercase tracking-wider">Processing &amp; Ready Orders</div>
                <p className="text-xs text-on-surface-variant mt-1.5 leading-normal">
                  Once the vendor marks the job as <code>processing</code> or <code>ready</code>, physical paper and toner have already been irreversibly consumed. Custom print orders in progress <strong>cannot be cancelled or refunded</strong>, except for verified vendor misprints.
                </p>
              </div>
            </div>
            <p className="text-xs text-on-surface-variant mt-2">
              <strong>Stationery Store Orders:</strong> Physical retail items from the PrintIt Store can be cancelled at any point prior to physical collection at the store, triggering an instant wallet refund and automatic stock replenishment.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-on-surface mb-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-primary/10 text-primary inline-flex items-center justify-center text-xs font-bold">6</span>
              <span>Print Quality, Misprint Handling &amp; Dispute Redressal</span>
            </h2>
            <p>
              Print shops in the PrintIt network operate as independent businesses. We enforce strict fulfillment benchmarks:
            </p>
            <ul className="list-disc list-inside space-y-1.5 ml-2 mt-2">
              <li>
                <strong>Vendor Equipment Misprints:</strong> If your print job suffers from illegible print, toner banding/streaks, page truncation, incorrect paper size, or incorrect binding caused by vendor equipment faults, you can open a dispute within 24 hours of collection via the in-app Support Center (<code>/support</code>) by uploading clear photos of the defect.
              </li>
              <li>
                <strong>Resolution:</strong> Upon verification, platform administrators will authorize an instant wallet refund or coordinate a free, priority vendor reprint.
              </li>
              <li>
                <strong>Customer Source Document Errors:</strong> PrintIt and partner vendors are not liable for typographical errors, formatting glitches, low resolution/pixelation, or margins present in customer-submitted original source files.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-on-surface mb-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-primary/10 text-primary inline-flex items-center justify-center text-xs font-bold">7</span>
              <span>User Responsibilities &amp; Acceptable Use Policy</span>
            </h2>
            <p>
              You represent and warrant that you hold all necessary copyrights, intellectual property licenses, or authorizations to reproduce any materials you upload. You agree never to upload or attempt to print:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2 mt-2">
              <li>Infringing copyrighted textbooks, proprietary courseware, or pirated publications without explicit license.</li>
              <li>Defamatory, extortionary, sexually explicit, obscene, or threatening content.</li>
              <li>Counterfeit currency, forged government certificates, falsified identity cards, or fraudulent documents.</li>
              <li>Files containing viruses, Trojan horses, ransomware, or scripts intended to disrupt platform systems.</li>
            </ul>
            <p className="mt-2 text-xs text-error font-medium">
              Uploading unlawful or harmful content will result in immediate permanent account termination, forfeiture of pending orders, and reporting to relevant law enforcement agencies.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-on-surface mb-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-primary/10 text-primary inline-flex items-center justify-center text-xs font-bold">8</span>
              <span>Document Confidentiality &amp; Auto-Purge Protocol</span>
            </h2>
            <p>
              To protect customer privacy and confidential business documents, PrintIt enforces automated storage lifecycle rules:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2 mt-2">
              <li>
                <strong>Standard Orders:</strong> Underlying cloud files are permanently and automatically deleted <strong>12 hours</strong> after the order is marked collected or cancelled.
              </li>
              <li>
                <strong>Secure Print Mode:</strong> Files are purged <strong>immediately upon collection</strong> at the shop counter, or after 15 minutes if cancelled.
              </li>
              <li>
                Partner vendors are contractually bound to treat customer documents as confidential and are prohibited from retaining, copying, or distributing customer files outside the immediate printing workflow.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-on-surface mb-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-primary/10 text-primary inline-flex items-center justify-center text-xs font-bold">9</span>
              <span>Partner Vendor Obligations</span>
            </h2>
            <p>
              Print shop partners agree to maintain truthful pricing matrices, uphold posted operating hours, fulfill orders using commercial printing standards, and promptly fulfill and hand over completed orders upon counter verification. Failure to maintain service level standards may result in shop delisting or payout suspension.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-on-surface mb-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-primary/10 text-primary inline-flex items-center justify-center text-xs font-bold">10</span>
              <span>Limitation of Liability</span>
            </h2>
            <p>
              To the fullest extent permitted by applicable law, PrintIt acts solely as an intermediary technology platform. PrintIt shall not be liable for indirect, incidental, punitive, or consequential damages resulting from shop machinery delays, store closures, or user file flaws. PrintIt&apos;s total aggregate liability for any claim arising under these Terms shall never exceed the total amount paid by you for the specific order in question.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-on-surface mb-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-primary/10 text-primary inline-flex items-center justify-center text-xs font-bold">11</span>
              <span>Governing Law &amp; Jurisdiction</span>
            </h2>
            <p>
              These Terms of Service are governed by and construed in accordance with the laws of the Republic of India. Any disputes or claims arising out of or related to these Terms or platform transactions shall be subject to the exclusive jurisdiction of the competent courts in Maharashtra, India.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-on-surface mb-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-primary/10 text-primary inline-flex items-center justify-center text-xs font-bold">12</span>
              <span>Contact &amp; Customer Support</span>
            </h2>
            <p>
              For legal notices, policy inquiries, or support assistance, please contact us:
            </p>
            <div className="mt-3 p-4 rounded-xl bg-surface-container-highest/60 border border-outline-variant/30 text-xs space-y-1">
              <div><strong>PrintIt Legal &amp; Compliance Team</strong></div>
              <div><strong>Email:</strong> <a href="mailto:support@printit.com" className="text-primary underline">support@printit.com</a></div>
              <div><strong>Support Desk:</strong> Raise an inquiry ticket through the in-app Support Center (<code>/support</code>)</div>
              <div><strong>Location:</strong> Maharashtra, Republic of India</div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
