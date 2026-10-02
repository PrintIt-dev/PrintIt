import 'package:flutter/material.dart';
import '../../shared/widgets/ambient_background.dart';
import '../../shared/widgets/glass_container.dart';

class TermsScreen extends StatelessWidget {
  const TermsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: const Text('Terms of Service', style: TextStyle(fontWeight: FontWeight.bold)),
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
                            Icon(Icons.description_outlined, color: theme.colorScheme.primary, size: 28),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Terms of Service',
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
                          'Binding Agreement: These terms govern the use of the Print It platform for custom document printing and the stationery marketplace. Applicable across mobile and web.',
                        ),
                        const SizedBox(height: 20),
                        _buildSection(
                          context,
                          '1. Service Overview',
                          'Print It is a technology marketplace and print orchestration platform connecting customers with partner print shops and stationery retailers. Services include:\n'
                          '• Custom Document Printing: Multi-format uploads (PDF, Word, Excel, PowerPoint, Text, Images), paper sizes (A4, A3, B5, Letter, Legal), B&W or Full Color, Single or Duplex printing, and finishing options (Staple, Spiral Binding, Softcover).\n'
                          '• Delivery & Pickup Modes: Express Pickup, Scheduled Time Slots, and Walk-in counter orders.\n'
                          '• Stationery Marketplace: In-store supplies, office stationery, and custom merchandise from verified vendors.\n'
                          '• Real-Time Live Queue: Live order state monitoring (Queued ➔ Processing ➔ Ready ➔ Collected).',
                        ),
                        _buildSection(
                          context,
                          '2. User Responsibilities & Acceptable Content',
                          'By uploading documents to Print It, you affirm that:\n'
                          '• You hold the copyright, license, or legal authorization to reproduce the uploaded materials.\n'
                          '• Your documents do not contain unlawful, harassing, defamatory, counterfeit, obscene, or fraudulent content.\n'
                          '• You will not use the platform to transmit malware, viruses, automated scraping bots, or compromise platform infrastructure.\n'
                          'Violations result in immediate account termination and reporting to legal authorities.',
                        ),
                        _buildSection(
                          context,
                          '3. Physical Pickup & Verification',
                          '• All print orders are fulfilled strictly via in-store physical pickup at the selected partner shop to guarantee immediate handover and eliminate shipping delays.\n'
                          '• Orders must be claimed at the shop counter by presenting your unique Pickup QR code or 4-digit pickup PIN.\n'
                          '• 7-Day Unclaimed Policy: Orders printed and not collected within 7 calendar days may be safely recycled or shredded by the shopkeeper to protect physical shelf space, without entitlement to refund.',
                        ),
                        _buildSection(
                          context,
                          '4. Payments, Zero Platform Fee & In-App Wallet',
                          '• Transparent Pricing: Print prices are computed server-side from the vendor\'s dynamic rate matrix. Print It charges 0% platform fee to customers on print jobs.\n'
                          '• Payment Modes: Secure payments via Razorpay (UPI, Credit/Debit Cards, Net Banking), Print It digital wallet, or Pay at Shop (Cash on Delivery).\n'
                          '• In-App Wallet: Wallet credits from top-ups or refunds are non-transferable and can be redeemed toward any platform service without expiration.',
                        ),
                        _buildSection(
                          context,
                          '5. Cancellation & Refund Policy',
                          '• Queued Print Orders: Orders in "Queued" status can be cancelled at any time before shop acceptance for an instant 100% wallet refund.\n'
                          '• Processing & Ready Orders: Once an order is marked "Processing" or "Ready", physical paper and toner have already been irreversibly consumed. In-progress or completed print orders cannot be cancelled or refunded, except for verified vendor misprints.\n'
                          '• Stationery Product Orders: Retail store purchases can be cancelled any time prior to physical collection for an instant wallet refund with automatic stock restoration.',
                        ),
                        _buildSection(
                          context,
                          '6. Print Quality & Misprint Dispute Redressal',
                          '• Equipment Misprints: In the event of printer banding, illegible text, incorrect paper size, or binding defects caused by vendor machinery, submit a dispute with clear photos via the in-app Support Center within 24 hours of collection.\n'
                          '• Resolution: Validated equipment defects receive an instant wallet credit or a free vendor priority reprint.\n'
                          '• Source File Glitches: Print It and partner shops are not liable for typography errors, formatting flaws, or low-resolution pixelation in customer-supplied original files.',
                        ),
                        _buildSection(
                          context,
                          '7. Document Confidentiality & Auto-Purge',
                          '• Secure Print Mode: Uploaded document files are deleted immediately and permanently from cloud storage upon counter collection, or after 15 minutes if cancelled.\n'
                          '• Standard Print Mode: Files are permanently purged 12 hours after order collection or cancellation.\n'
                          '• Partner shops are contractually prohibited from copying, retaining, or sharing customer files outside the authorized print job.',
                        ),
                        _buildSection(
                          context,
                          '8. Limitation of Liability & Governing Law',
                          'Print It operates as an intermediary technology provider. To the maximum extent permitted by law, Print It\'s total aggregate liability for any order is strictly limited to the amount paid for that specific transaction. These terms are governed by the laws of the Republic of India, and subject to the exclusive jurisdiction of the competent courts in Maharashtra, India.',
                        ),
                        _buildSection(
                          context,
                          '9. Contact Information',
                          'For questions regarding these terms or dispute assistance, contact us at:\nEmail: support@printit.com\nSupport Center: In-app Help & Support desk.',
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
