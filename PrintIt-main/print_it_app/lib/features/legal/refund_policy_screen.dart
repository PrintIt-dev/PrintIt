import 'package:flutter/material.dart';
import '../../shared/widgets/ambient_background.dart';
import '../../shared/widgets/glass_container.dart';

class RefundPolicyScreen extends StatelessWidget {
  const RefundPolicyScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: const Text('Refund & Cancellation', style: TextStyle(fontWeight: FontWeight.bold)),
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
                            Icon(Icons.currency_rupee, color: theme.colorScheme.primary, size: 28),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Refund & Cancellation Policy',
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
                          'Instant Atomic Refunds: 100% full refund on eligible cancellations credited instantly to your in-app wallet ledger with 0% platform fee.',
                        ),
                        const SizedBox(height: 20),
                        _buildSection(
                          context,
                          '1. Order Cancellation Window',
                          '• Queued Print Orders: You may cancel your print order at any time while its status remains "Queued" (prior to shopkeeper acceptance). A 100% full refund is instantly credited to your Print It digital wallet ledger. Guest orders can also be cancelled securely using the unique secret cancellation token provided during checkout.\n\n'
                          '• Processing & Ready Orders: Once the vendor accepts the job and updates status to "Processing" or "Ready", physical paper (A4, A3, B5), toner, and binding materials have already been irreversibly consumed. Custom print orders in progress or completed cannot be cancelled or refunded, except for verified vendor misprints.\n\n'
                          '• Stationery & Store Products: Uncollected stationery items (notebooks, pens, office supplies) can be cancelled at any time prior to physical collection at the shop, triggering an instant wallet refund and automatic inventory stock restoration.',
                        ),
                        _buildSection(
                          context,
                          '2. Failed Prints & Vendor Rejections',
                          'If a partner print shop is unable to fulfill an order due to printer hardware breakdown, power outages, paper stock shortages, or corrupted unrenderable source files, the shopkeeper marks the job rejected/cancelled in their dashboard. 100% of the transaction amount is instantly and automatically credited back to your in-app wallet balance, accompanied by an instant push alert so you can choose another nearby print shop immediately.',
                        ),
                        _buildSection(
                          context,
                          '3. Physical Pickup Inspection & Quality Issues',
                          'Customers must inspect printed documents at the partner shop during physical pickup:\n'
                          '• On-the-Spot Reprint: If print defects (e.g. illegible streaks, smudged ink, missing pages, wrong binding, or incorrect paper size) differ from your order specifications, notify the shopkeeper at the counter for an immediate reprint at no extra cost.\n'
                          '• Support Dispute Window: If an agreeable solution is not reached at the counter, raise an in-app support ticket via Help & Support within 24 hours of pickup with photo evidence. Verified vendor defects receive a 100% wallet credit refund or coordinated priority reprint.\n'
                          '• Source Document Errors: Print It and partner shops are not liable for typographical errors, formatting glitches, or low-resolution pixelation in customer-supplied original files.',
                        ),
                        _buildSection(
                          context,
                          '4. Refund Processing Method',
                          '• Instant Atomic Wallet Credit: All validated refunds are credited directly to your Print It in-app Wallet ledger in real time using atomic database transactions preventing race conditions.\n'
                          '• Zero Deduction: Thanks to our 0% platform fee model, 100% of the funds are refunded without convenience fees or gateway surcharges.\n'
                          '• Pay at Shop: Orders placed with Pay at Shop (Cash on Delivery) that are cancelled relieve the customer of all payment obligation.\n'
                          '• Wallet funds do not expire and can be applied toward any future print order or stationery purchase across any partner shop.',
                        ),
                        _buildSection(
                          context,
                          '5. Store Fulfillment & 7-Day Unclaimed Policy',
                          'All orders placed on Print It are fulfilled via in-person physical store pickup (Express Pickup, Scheduled Pickup, or Walk-in). Orders printed and left uncollected after 7 calendar days may be safely recycled or shredded by the vendor to maintain shop storage, without entitlement to refund.',
                        ),
                        _buildSection(
                          context,
                          '6. Support & Disputes',
                          'For questions or dispute assistance, visit the Help & Support section in the app or reach us at support@printit.com.\nJurisdiction: Maharashtra, Republic of India.',
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
