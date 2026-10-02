import React from 'react';
import { Link } from 'react-router-dom';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background text-on-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-surface-container border border-outline-variant/30 rounded-2xl p-6 sm:p-10 shadow-xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-outline-variant/20 pb-6 mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider">
              <span className="material-symbols-outlined text-sm">shield</span>
              <span>DPDP Act 2023 Compliant</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-on-surface mt-2 font-display-lg tracking-tight">
              Privacy Policy
            </h1>
            <p className="text-xs text-on-surface-variant mt-1.5 font-label-md flex flex-wrap items-center gap-2">
              <span className="font-semibold text-primary">Version 2.4.0 (Latest Release)</span>
              <span>•</span>
              <span>Effective Date: October 2, 2026</span>
              <span>•</span>
              <span>Applicable across Web & Mobile</span>
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

        {/* Executive Summary Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="p-4 rounded-xl bg-surface-container-highest/60 border border-outline-variant/30 flex items-start gap-3">
            <span className="material-symbols-outlined text-primary text-2xl mt-0.5">auto_delete</span>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface">Auto-Purge Protocol</h3>
              <p className="text-xs text-on-surface-variant mt-1">
                Completed files are permanently destroyed in 12 hours. Secure Print mode purges immediately upon collection.
              </p>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-surface-container-highest/60 border border-outline-variant/30 flex items-start gap-3">
            <span className="material-symbols-outlined text-primary text-2xl mt-0.5">lock_person</span>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface">Zero Data Brokering</h3>
              <p className="text-xs text-on-surface-variant mt-1">
                Zero third-party advertising cookies or tracking pixels. Only essential JWT tokens in secure localStorage.
              </p>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-surface-container-highest/60 border border-outline-variant/30 flex items-start gap-3">
            <span className="material-symbols-outlined text-primary text-2xl mt-0.5">person_remove</span>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface">Right to Be Forgotten</h3>
              <p className="text-xs text-on-surface-variant mt-1">
                One-click full account and profile anonymization available in account settings per DPDP Act standards.
              </p>
            </div>
          </div>
        </div>

        {/* Main Content Sections */}
        <div className="space-y-8 text-sm text-on-surface-variant leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-on-surface mb-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-primary/10 text-primary inline-flex items-center justify-center text-xs font-bold">1</span>
              <span>Overview & Scope</span>
            </h2>
            <p>
              This Privacy Policy details how <strong>PrintIt</strong> (&quot;PrintIt&quot;, &quot;we&quot;, &quot;our&quot;, or &quot;the Platform&quot;) collects, processes, secures, retains, and removes customer, shopkeeper, and visitor personal data and uploaded digital documents. This policy applies across the entire PrintIt ecosystem: the Customer Mobile App (Flutter), Customer Web Portal, Shopkeeper Partner Portal, Platform Admin Console, and REST API services.
            </p>
            <p className="mt-2">
              We operate in strict adherence to applicable Indian and international data protection standards, including the <strong>Digital Personal Data Protection (DPDP) Act 2023</strong> and the Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-on-surface mb-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-primary/10 text-primary inline-flex items-center justify-center text-xs font-bold">2</span>
              <span>Information We Collect</span>
            </h2>
            <p>
              We collect information necessary to process your print orders, manage your live shop queues, and provide transparent platform services:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-2 mt-2">
              <li>
                <strong>Account Credentials:</strong> Full name, verified email address, mobile telephone number, and cryptographically salted password hashes (Bcrypt, 10 salt rounds).
              </li>
              <li>
                <strong>Single Sign-On (Google Authentication):</strong> Google account identifier (Firebase UID), display name, and avatar URL when logging in via Google OAuth.
              </li>
              <li>
                <strong>Uploaded Document Files:</strong> Customer files submitted for printing across all supported formats, including PDF, Microsoft Office documents (Word .doc/.docx, PowerPoint .ppt/.pptx, Excel .xls/.xlsx), plain text (.txt), and high-resolution images (.png, .jpg, .jpeg). Automated PDF rendering conversions are stored temporarily alongside source files strictly for print execution.
              </li>
              <li>
                <strong>Print Job Configuration Specifications:</strong> Color mode (Black &amp; White vs Full Color), paper sizes (A4, A3, B5, Letter, Legal), print sides (Single-Sided vs Double-Sided / Duplex), page orientation, custom page selection ranges, copies count, finishing options (Spiral Binding, Stapling, Softcover/Hardcover), and Print Mode (Standard or Secure).
              </li>
              <li>
                <strong>Marketplace &amp; Stationery Orders:</strong> Order items, quantities, SKU identifiers, order totals, and fulfillment timestamps for retail stationery products purchased through the PrintIt Store.
              </li>
              <li>
                <strong>Payment &amp; Financial Ledger:</strong> Razorpay transaction IDs, payment intent signatures, in-app digital wallet ledger records, and bank/UPI payout details (for shopkeepers only). <em>We never capture, store, or process raw credit/debit card numbers or bank credentials on our application servers.</em>
              </li>
              <li>
                <strong>Geolocation Data:</strong> Device latitude and longitude coordinates submitted with your explicit consent during shop discovery, used strictly for real-time mathematical distance calculation to nearby print shops. We never record continuous location trails or background movement.
              </li>
              <li>
                <strong>Device &amp; Telemetry:</strong> Firebase Cloud Messaging (FCM) push tokens for instantaneous order status alerts, network IP address, and technical error logs for cybersecurity and service integrity.
              </li>
              <li>
                <strong>Customer Support Data:</strong> Support tickets, dispute narratives, and photo evidence submitted for misprints or billing reviews.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-on-surface mb-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-primary/10 text-primary inline-flex items-center justify-center text-xs font-bold">3</span>
              <span>Document Storage &amp; Automated Multi-Tier Deletion Protocol</span>
            </h2>
            <p>
              Your document files and private intellectual property receive top-tier cloud security. Documents uploaded to PrintIt are encrypted in transit using TLS 1.3 and encrypted at rest on secure Google Cloud Storage / Firebase Storage buckets with restricted, time-limited signed URLs.
            </p>
            <div className="mt-4 p-5 rounded-2xl bg-surface-container-highest/60 border border-primary/20 space-y-3">
              <div className="flex items-center gap-2 text-primary font-bold">
                <span className="material-symbols-outlined">schedule</span>
                <span>Active Automated Cleanup Schedule</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="bg-surface-container p-3.5 rounded-xl border border-outline-variant/30">
                  <div className="text-xs font-bold text-primary uppercase tracking-wider">Secure Print Mode</div>
                  <p className="text-xs text-on-surface-variant mt-1 leading-normal">
                    Designed for highly sensitive documents. Uploaded files are <strong>immediately and permanently wiped</strong> from cloud storage the moment the shopkeeper marks the order collected at the counter. Expired or cancelled secure orders are permanently destroyed within 15 minutes via our 1-minute automated cron daemon.
                  </p>
                </div>
                <div className="bg-surface-container p-3.5 rounded-xl border border-outline-variant/30">
                  <div className="text-xs font-bold text-primary uppercase tracking-wider">Standard Print Mode</div>
                  <p className="text-xs text-on-surface-variant mt-1 leading-normal">
                    Files are permanently deleted <strong>12 hours</strong> after the order has been collected or cancelled. An automated background cleanup worker executes every 30 minutes to permanently un-link and purge underlying storage objects.
                  </p>
                </div>
              </div>
              <p className="text-xs text-on-surface-variant italic pt-1">
                Once files are deleted, file storage endpoints return an irreversible HTTP 410 Gone status. Neither shopkeepers nor PrintIt staff can retrieve erased documents.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-on-surface mb-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-primary/10 text-primary inline-flex items-center justify-center text-xs font-bold">4</span>
              <span>How We Use Your Information</span>
            </h2>
            <p>We process collected data exclusively for legitimate operational purposes:</p>
            <ul className="list-disc list-inside space-y-1.5 ml-2 mt-2">
              <li>Parsing uploaded documents to count pages and calculate server-verified pricing without discrepancies.</li>
              <li>Dispatching print jobs and specifications to your chosen partner print shop.</li>
              <li>Streaming real-time order queue progress via Server-Sent Events (SSE) and FCM push alerts.</li>
              <li>Processing online checkouts, in-app wallet deductions, and automated instant cancellation refunds.</li>
              <li>Generating 4-digit pickup PINs and order reference identifiers for secure in-person handover.</li>
              <li>Facilitating customer support inquiries, reprint requests, and dispute investigations.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-on-surface mb-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-primary/10 text-primary inline-flex items-center justify-center text-xs font-bold">5</span>
              <span>Zero-Tracking &amp; Local Storage</span>
            </h2>
            <p>
              PrintIt is committed to zero commercial ad tracking. We do not deploy third-party advertising cookies, cross-site trackers, or profiling pixels. We strictly utilize modern HTML5 <code>localStorage</code> solely for:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2 mt-2">
              <li>Persisting your encrypted JSON Web Token (JWT) session to keep you authenticated.</li>
              <li>Storing user role and active shop affiliation IDs.</li>
              <li>Retaining your explicit cookie and privacy preference selections.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-on-surface mb-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-primary/10 text-primary inline-flex items-center justify-center text-xs font-bold">6</span>
              <span>Third-Party Service Providers</span>
            </h2>
            <p>
              We integrate with industry-leading cloud service providers under data processing contracts that restrict usage solely to platform operations:
            </p>
            <ul className="list-disc list-inside space-y-1.5 ml-2 mt-2">
              <li><strong>Google Cloud Platform &amp; Firebase (Google LLC):</strong> Cloud storage buckets, single sign-on authentication, and Firebase Cloud Messaging (FCM).</li>
              <li><strong>Razorpay Software Private Limited:</strong> PCI-DSS Level 1 compliant payment gateway capturing UPI, credit/debit card, and net banking transactions.</li>
              <li><strong>Independent Partner Print Shops:</strong> Verified local print stores receive strictly temporary, scoped access to documents and instructions solely to print your job. Partners are contractually and legally prohibited from copying, retaining, or sharing your documents.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-on-surface mb-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-primary/10 text-primary inline-flex items-center justify-center text-xs font-bold">7</span>
              <span>User Rights &amp; Permanent Account Deletion</span>
            </h2>
            <p>
              Under the DPDP Act 2023, you have full sovereignty over your personal data:
            </p>
            <ul className="list-disc list-inside space-y-1.5 ml-2 mt-2">
              <li><strong>Right of Access &amp; Correction:</strong> Review profile details, order histories, and wallet ledgers, or correct errors via in-app settings.</li>
              <li><strong>Right to Erasure (Account Deletion):</strong> You may permanently delete your account at any time directly through the app or partner portal settings (<code>DELETE /api/auth/account</code>). Deletion irreversibly purges your personal credentials, contact numbers, authentication tokens, and profile data. Non-personal transaction metadata is preserved in an anonymized format strictly to satisfy statutory accounting and tax compliance.</li>
              <li><strong>Right to Grievance Redressal:</strong> Raise inquiries or escalate privacy concerns directly to our Data Protection team.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-on-surface mb-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-primary/10 text-primary inline-flex items-center justify-center text-xs font-bold">8</span>
              <span>Cybersecurity &amp; Safeguards</span>
            </h2>
            <p>
              We employ defense-in-depth security measures to protect your documents:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2 mt-2">
              <li>End-to-end TLS 1.3 transport encryption.</li>
              <li>AES-256 encryption at rest for cloud object storage.</li>
              <li>Secret order cancellation tokens (<code>cancel_token</code>) preventing unauthorized guest order tampering.</li>
              <li>HMAC SHA-256 cryptographic verification on all financial webhooks.</li>
              <li>Strict API rate-limiting to prevent brute force and denial-of-service attacks.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-on-surface mb-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-primary/10 text-primary inline-flex items-center justify-center text-xs font-bold">9</span>
              <span>Contact Us &amp; Grievance Officer</span>
            </h2>
            <p>
              If you have any questions, concerns, or requests regarding this Privacy Policy or your personal information, please reach out to our dedicated Grievance Officer:
            </p>
            <div className="mt-3 p-4 rounded-xl bg-surface-container-highest/60 border border-outline-variant/30 text-xs space-y-1">
              <div><strong>Grievance Officer:</strong> PrintIt Privacy &amp; Data Protection Team</div>
              <div><strong>Email:</strong> <a href="mailto:support@printit.com" className="text-primary underline">support@printit.com</a></div>
              <div><strong>In-App Support:</strong> Navigate to Support Center in the customer app or partner dashboard</div>
              <div><strong>Jurisdiction:</strong> Maharashtra, Republic of India</div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
