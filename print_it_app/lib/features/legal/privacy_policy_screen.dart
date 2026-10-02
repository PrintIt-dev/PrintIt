import 'package:flutter/material.dart';
import '../../shared/widgets/ambient_background.dart';
import '../../shared/widgets/glass_container.dart';

class PrivacyPolicyScreen extends StatelessWidget {
  const PrivacyPolicyScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: const Text('Privacy Policy', style: TextStyle(fontWeight: FontWeight.bold)),
        centerTitle: true,
      ),
      body: Stack(
        children: [
          const AmbientBackground(),
          SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(20.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  GlassContainer(
                    padding: const EdgeInsets.all(24.0),
                    borderRadius: 20,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Icon(Icons.shield_outlined, color: theme.colorScheme.primary, size: 28),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Print It Privacy Policy',
                                    style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
                                  ),
                                  Text(
                                    'Version 2.4.0 (Latest) • Effective Date: October 2, 2026',
                                    style: TextStyle(color: theme.colorScheme.onSurface.withValues(alpha: 0.6), fontSize: 12),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 20),
                        _buildLegalNotice(
                          context,
                          'DPDP Act 2023 Compliant: This policy details real technical data practices, automated storage purge daemons, and personal data rights implemented in Print It.',
                        ),
                        const SizedBox(height: 20),
                        _buildSection(
                          context,
                          '1. Information We Collect',
                          '• Account Information: Name, email address, mobile phone number, encrypted password hash (Bcrypt), and Firebase UID for Google OAuth.\n'
                          '• Document Files & Media: Multi-format uploads including PDF, Microsoft Word (.doc, .docx), PowerPoint (.ppt, .pptx), Excel (.xls, .xlsx), plain text (.txt), and high-resolution images (.png, .jpg, .jpeg) converted automatically to PDF for exact 1:1 printing.\n'
                          '• Order & Print Specifications: Color mode (B&W or Full Color), paper sizes (A4, A3, B5, Letter, Legal), print sides (Single or Duplex), custom page ranges, binding types (Staple, Spiral, Softcover), copies, and print mode (Standard or Secure).\n'
                          '• Marketplace Orders: Stationery and retail supplies selections, item quantities, and order fulfillment states.\n'
                          '• Financial & Payment Data: Razorpay payment order IDs, signatures, in-app wallet balance ledger, and Pay at Shop records. Raw credit/debit card numbers or net banking credentials are never collected or stored on our servers.\n'
                          '• Location Data: Device latitude and longitude coordinates submitted with permission during shop discovery, used strictly to compute real-time distance to nearby print stores without continuous location tracking.\n'
                          '• Device & Diagnostic Data: Firebase Cloud Messaging (FCM) push tokens for instantaneous order status alerts, network IP address, and technical logs for error prevention.',
                        ),
                        _buildSection(
                          context,
                          '2. How We Use Information',
                          'We use the collected information strictly for:\n'
                          '• Parsing document page counts and calculating server-side verified pricing with zero platform fee.\n'
                          '• Dispatching print orders and specifications to your chosen partner print shop.\n'
                          '• Processing payments, managing your in-app wallet, and issuing instant cancellation refunds.\n'
                          '• Streaming real-time queue progress via Server-Sent Events (SSE) and FCM push alerts.\n'
                          '• Generating secure 4-digit pickup PINs and encrypted QR codes for in-store physical collection.\n'
                          '• Customer support, misprint review, and dispute resolution.',
                        ),
                        _buildSection(
                          context,
                          '3. Document Retention & Auto-Purge',
                          'To protect your privacy and document confidentiality, all uploaded print files are encrypted in transit (TLS 1.3) and stored in secure Google Cloud / Firebase Storage buckets with automated multi-tier deletion protocols:\n\n'
                          '• Secure Print Mode: Uploaded files are immediately and permanently erased from cloud storage the moment your order is marked collected at the shop counter. Uncollected, cancelled, or failed secure orders are permanently destroyed within 15 minutes by our 1-minute automated cron daemon.\n\n'
                          '• Standard Print Mode: Files are permanently deleted 12 hours after order collection or cancellation by our automated background cleanup job running every 30 minutes.\n\n'
                          '• Irreversible Removal: Once purged, document storage endpoints return HTTP 410 Gone; erased files cannot be recovered by customers, shopkeepers, or system administrators.',
                        ),
                        _buildSection(
                          context,
                          '4. Zero Ad-Tracking & Local Storage',
                          'Print It enforces a strict zero-commercial-tracking policy. We do not use third-party advertising pixels, tracking cookies, or profiling cookies. We strictly utilize essential secure device storage and HTML5 localStorage for JWT authentication tokens and session preferences.',
                        ),
                        _buildSection(
                          context,
                          '5. Third-Party Service Providers',
                          'We integrate only verified third-party infrastructure for core operations:\n'
                          '• Razorpay: Secure PCI-DSS Level 1 compliant online payment gateway (UPI, cards, net banking).\n'
                          '• Google Cloud & Firebase: Encrypted cloud object storage, user authentication, and real-time FCM push notifications.\n'
                          '• Partner Print Shops: Document data is shared strictly on a temporary basis with the specific vendor shop selected by you for fulfillment. Vendors are contractually forbidden from downloading, saving, or disseminating customer files outside the print workflow.',
                        ),
                        _buildSection(
                          context,
                          '6. User Rights & Account Deletion',
                          'Under the Digital Personal Data Protection (DPDP) Act 2023, you have the right to access, inspect, download, and permanently delete your account data. You can trigger one-click permanent account deletion directly within Profile Settings. Deletion permanently erases your credentials, contact data, profile, and active session tokens. Non-personal transaction ledger entries are archived in an anonymized state solely to satisfy statutory accounting requirements.',
                        ),
                        _buildSection(
                          context,
                          '7. Contact & Privacy Inquiries',
                          'For privacy-related questions, data access requests, or grievance redressal, contact our Data Protection Team at:\nEmail: support@printit.com\nOr raise a ticket in the in-app Support Center.\nJurisdiction: Maharashtra, Republic of India.',
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSection(BuildContext context, String title, String content) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.only(bottom: 20.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: theme.textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.bold,
              color: theme.colorScheme.primary,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            content,
            style: theme.textTheme.bodyMedium?.copyWith(
              color: theme.colorScheme.onSurface.withValues(alpha: 0.85),
              height: 1.5,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLegalNotice(BuildContext context, String text) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.amber.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.amber.withValues(alpha: 0.3)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.info_outline, color: Colors.amber, size: 20),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              text,
              style: const TextStyle(fontSize: 12, color: Colors.amber, height: 1.4),
            ),
          ),
        ],
      ),
    );
  }
}
