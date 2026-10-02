import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/api/api_client.dart';
import 'store_models.dart';
import 'store_cart_provider.dart';
import 'store_product_detail_screen.dart';
import '../auth/auth_provider.dart';

class StoreCartSheet extends ConsumerStatefulWidget {
  const StoreCartSheet({super.key});

  @override
  ConsumerState<StoreCartSheet> createState() => _StoreCartSheetState();
}

class _StoreCartSheetState extends ConsumerState<StoreCartSheet> {
  bool _isPlacingOrder = false;
  Map<String, dynamic>? _placedOrder;
  String? _checkoutError;

  static const Color emerald = Color(0xFF10B981);

  Future<void> _handleCheckout(StoreCartState cartState) async {
    if (cartState.isEmpty || cartState.shop == null) return;

    setState(() {
      _isPlacingOrder = true;
      _checkoutError = null;
    });

    try {
      final api = ref.read(apiProvider);
      final authUser = ref.read(authProvider).user;
      final guestEmail = authUser?['email']?.toString() ?? 'guest@printit.store';
      final guestPhone = authUser?['phone']?.toString() ?? 'Counter Pickup';

      final payload = {
        'shop_id': cartState.shop!.shopId,
        'items': cartState.items.map((i) => i.toJson()).toList(),
        'payment_method': 'COD',
        'guest_email': guestEmail,
        'guest_phone': guestPhone,
        'payment_details': {
          'channel': 'cash_on_delivery',
        },
      };

      final res = await api.post('/store/orders', data: payload);

      if (res.statusCode == 201 && (res.data['success'] == true || res.data['order'] != null)) {
        final orderData = (res.data['order'] ?? res.data) as Map<String, dynamic>;

        // Clear cart
        ref.read(storeCartProvider.notifier).clearCart();

        if (mounted) {
          setState(() {
            _placedOrder = orderData;
            _checkoutError = null;
            _isPlacingOrder = false;
          });
        }
      } else {
        throw Exception(res.data['error'] ?? 'Order checkout failed');
      }
    } catch (e) {
      if (mounted) {
        final errMsg = e.toString().replaceAll('Exception: ', '');
        setState(() {
          _checkoutError = errMsg;
          _isPlacingOrder = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: Colors.redAccent,
            content: Text(errMsg),
          ),
        );
      }
    } finally {
      if (mounted && _placedOrder == null) {
        setState(() => _isPlacingOrder = false);
      }
    }
  }

  Widget _buildOrderConfirmationView(ThemeData theme, bool isDark, Map<String, dynamic> order) {
    final orderNum = order['order_number']?.toString() ??
        (order['order_id'] != null ? '#${order['order_id'].toString().substring(0, 8).toUpperCase()}' : '#STORE-ORD');
    final totalAmount = double.tryParse(order['total_amount']?.toString() ?? '') ?? 0.0;
    final shopName = order['shop_name']?.toString() ?? 'the counter';

    return Container(
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.88,
      ),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF0F172A) : Colors.white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Drag handle
          Center(
            child: Container(
              margin: const EdgeInsets.only(bottom: 16),
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: isDark ? Colors.white24 : Colors.black12,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),

          // Success Icon with ring
          Container(
            width: 72,
            height: 72,
            decoration: BoxDecoration(
              color: emerald.withValues(alpha: 0.15),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.check_circle_rounded, color: emerald, size: 44),
          ),
          const SizedBox(height: 16),
          const Text(
            'Order Placed Successfully!',
            style: TextStyle(fontWeight: FontWeight.w900, fontSize: 20),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 6),
          Text(
            'Your items are reserved at $shopName. Pay cash upon counter collection.',
            style: TextStyle(fontSize: 13, color: isDark ? Colors.white60 : Colors.black54),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 20),

          // Order Reference Box
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: theme.colorScheme.primary.withValues(alpha: 0.08),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: theme.colorScheme.primary.withValues(alpha: 0.2)),
            ),
            child: Column(
              children: [
                const Text(
                  'ORDER REFERENCE NUMBER',
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 1.2,
                    color: Colors.grey,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  orderNum,
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w900,
                    color: theme.colorScheme.primary,
                  ),
                ),
                const Divider(height: 20),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Payment Method', style: TextStyle(fontSize: 12, color: Colors.grey)),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: emerald.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: const Text('Cash on Delivery (COD)', style: TextStyle(color: emerald, fontWeight: FontWeight.bold, fontSize: 11)),
                    ),
                  ],
                ),
                if (totalAmount > 0) ...[
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Payable at Counter', style: TextStyle(fontSize: 12, color: Colors.grey)),
                      Text(
                        '₹${totalAmount.toStringAsFixed(2)}',
                        style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: theme.colorScheme.primary),
                      ),
                    ],
                  ),
                ],
              ],
            ),
          ),

          const SizedBox(height: 24),

          // Primary Action: View My Store Orders
          SizedBox(
            width: double.infinity,
            child: FilledButton(
              style: FilledButton.styleFrom(
                backgroundColor: theme.colorScheme.primary,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              ),
              onPressed: () {
                Navigator.of(context).pop();
                context.push('/store/orders');
              },
              child: const Text(
                'View My Store Orders',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
              ),
            ),
          ),
          const SizedBox(height: 10),

          // Secondary Action: Done / Keep Browsing
          SizedBox(
            width: double.infinity,
            child: OutlinedButton(
              style: OutlinedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              ),
              onPressed: () => Navigator.of(context).pop(),
              child: const Text(
                'Continue Shopping',
                style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
              ),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final cartState = ref.watch(storeCartProvider);

    if (_placedOrder != null) {
      return _buildOrderConfirmationView(theme, isDark, _placedOrder!);
    }

    return Container(
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.88,
      ),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF0F172A) : Colors.white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
      ),
      child: Column(
        children: [
          // Drag handle
          Center(
            child: Container(
              margin: const EdgeInsets.only(top: 12, bottom: 8),
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: isDark ? Colors.white24 : Colors.black12,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),

          // Header with Shop info & Clear
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 8, 20, 12),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Text(
                            cartState.shop?.shopName ?? 'Store Cart',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: isDark ? Colors.white : Colors.black87,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          if (cartState.shop?.shopCode != null) ...[
                            const SizedBox(width: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(
                                color: theme.colorScheme.primary.withValues(alpha: 0.15),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                cartState.shop!.shopCode!,
                                style: TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                  color: theme.colorScheme.primary,
                                ),
                              ),
                            ),
                          ],
                        ],
                      ),
                      if (cartState.shop?.address != null)
                        Text(
                          cartState.shop!.address!,
                          style: TextStyle(
                            fontSize: 11,
                            color: isDark ? Colors.white54 : Colors.black54,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                    ],
                  ),
                ),
                if (cartState.isNotEmpty)
                  TextButton.icon(
                    onPressed: () {
                      ref.read(storeCartProvider.notifier).clearCart();
                      Navigator.of(context).pop();
                    },
                    icon: const Icon(Icons.delete_sweep_rounded, size: 16, color: Colors.redAccent),
                    label: const Text('Clear', style: TextStyle(color: Colors.redAccent, fontSize: 12)),
                  ),
              ],
            ),
          ),

          const Divider(height: 1),

          // Content body
          Expanded(
            child: cartState.isEmpty
                ? Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.shopping_bag_outlined, size: 56, color: isDark ? Colors.white24 : Colors.black26),
                        const SizedBox(height: 12),
                        Text(
                          'Your store cart is empty',
                          style: TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.bold,
                            color: isDark ? Colors.white70 : Colors.black87,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Add books or manuals from campus shops',
                          style: TextStyle(fontSize: 12, color: isDark ? Colors.white38 : Colors.black45),
                        ),
                      ],
                    ),
                  )
                : ListView(
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                    children: [
                      // Cart Items List
                      ...cartState.items.map((item) {
                        return Container(
                          margin: const EdgeInsets.only(bottom: 12),
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: isDark ? Colors.white.withValues(alpha: 0.04) : Colors.black.withValues(alpha: 0.03),
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child: Row(
                            children: [
                              Container(
                                width: 44,
                                height: 56,
                                decoration: BoxDecoration(
                                  color: isDark ? Colors.white10 : Colors.black12,
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: item.coverPhotoUrl != null && item.coverPhotoUrl!.isNotEmpty
                                    ? ClipRRect(
                                        borderRadius: BorderRadius.circular(8),
                                        child: Image.network(
                                          item.coverPhotoUrl!,
                                          fit: BoxFit.cover,
                                          errorBuilder: (_, _, _) => const Icon(Icons.book, size: 24, color: Colors.grey),
                                        ),
                                      )
                                    : const Icon(Icons.book, size: 24, color: Colors.grey),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      item.title,
                                      style: TextStyle(
                                        fontSize: 13,
                                        fontWeight: FontWeight.bold,
                                        color: isDark ? Colors.white : Colors.black87,
                                      ),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                    const SizedBox(height: 2),
                                    Text(
                                      '₹${item.unitPrice.toStringAsFixed(0)} each',
                                      style: TextStyle(
                                        fontSize: 11,
                                        color: isDark ? Colors.white54 : Colors.black54,
                                      ),
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      '₹${item.totalPrice.toStringAsFixed(0)}',
                                      style: TextStyle(
                                        fontSize: 14,
                                        fontWeight: FontWeight.w900,
                                        color: theme.colorScheme.primary,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              // Quantity Controls
                              Row(
                                children: [
                                  IconButton(
                                    icon: const Icon(Icons.remove_circle_outline, size: 20),
                                    color: isDark ? Colors.white70 : Colors.black87,
                                    onPressed: () {
                                      ref.read(storeCartProvider.notifier).decrementQuantity(item.inventoryId);
                                    },
                                  ),
                                  Text(
                                    '${item.quantity}',
                                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                                  ),
                                  IconButton(
                                    icon: const Icon(Icons.add_circle_outline, size: 20),
                                    color: theme.colorScheme.primary,
                                    onPressed: item.quantity < item.maxStock
                                        ? () {
                                            ref.read(storeCartProvider.notifier).incrementQuantity(item.inventoryId);
                                          }
                                        : null,
                                  ),
                                ],
                              ),
                            ],
                          ),
                        );
                      }),

                      // Cross-Selling Inside Cart: "More in stock at this shop"
                      if (cartState.shop != null)
                        _buildCartRecommendations(cartState.shop!.shopId, cartState, isDark, theme),

                      const SizedBox(height: 16),

                      // Pickup Mode Selector
                      Text(
                        'COLLECTION PREFERENCE',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 0.8,
                          color: isDark ? Colors.white54 : Colors.black54,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          Expanded(
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                              decoration: BoxDecoration(
                                color: theme.colorScheme.primary.withValues(alpha: 0.12),
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(
                                  color: theme.colorScheme.primary.withValues(alpha: 0.5),
                                  width: 1.0,
                                ),
                              ),
                              child: Row(
                                children: [
                                  Icon(Icons.storefront_rounded, size: 18, color: theme.colorScheme.primary),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: Text(
                                      'Counter Pickup',
                                      style: TextStyle(
                                        fontSize: 12,
                                        fontWeight: FontWeight.bold,
                                        color: isDark ? Colors.white : Colors.black87,
                                      ),
                                    ),
                                  ),
                                  Icon(Icons.check_circle_rounded, size: 16, color: theme.colorScheme.primary),
                                ],
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                              decoration: BoxDecoration(
                                color: isDark ? Colors.white.withValues(alpha: 0.03) : const Color(0xFFF8FAFC),
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(color: Colors.grey.withValues(alpha: 0.2)),
                              ),
                              child: const Row(
                                children: [
                                  Icon(Icons.schedule_rounded, size: 18, color: Colors.grey),
                                  SizedBox(width: 8),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          'Schedule',
                                          style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey),
                                        ),
                                        Text(
                                          'Coming Soon',
                                          style: TextStyle(fontSize: 9, color: Colors.amber, fontWeight: FontWeight.w600),
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),

                      const SizedBox(height: 16),

                      // Payment Method Selector (COD Only for Store Orders)
                      Text(
                        'PAYMENT METHOD',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 0.8,
                          color: isDark ? Colors.white54 : Colors.black54,
                        ),
                      ),
                      const SizedBox(height: 8),

                      // COD Option
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: theme.colorScheme.primary.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(
                            color: theme.colorScheme.primary.withValues(alpha: 0.6),
                            width: 1.0,
                          ),
                        ),
                        child: Row(
                          children: [
                            Icon(
                              Icons.payments_outlined,
                              color: theme.colorScheme.primary,
                              size: 22,
                            ),
                            const SizedBox(width: 12),
                            const Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Cash on Delivery (COD)',
                                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                                  ),
                                  Text(
                                    'Pay in cash upon counter collection at the shop',
                                    style: TextStyle(fontSize: 11, color: Colors.grey),
                                  ),
                                ],
                              ),
                            ),
                            Icon(
                              Icons.check_circle_rounded,
                              color: theme.colorScheme.primary,
                              size: 22,
                            ),
                          ],
                        ),
                      ),

                      const SizedBox(height: 16),

                      // Bill Summary
                      Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: isDark ? Colors.white.withValues(alpha: 0.03) : Colors.black.withValues(alpha: 0.02),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Column(
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Text('Items Subtotal', style: TextStyle(fontSize: 12, color: Colors.grey)),
                                Text('₹${cartState.subtotal.toStringAsFixed(2)}', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                              ],
                            ),
                            const SizedBox(height: 6),
                            const Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text('In-Store Counter Pickup', style: TextStyle(fontSize: 12, color: Colors.grey)),
                                Text('FREE', style: TextStyle(fontSize: 12, color: emerald, fontWeight: FontWeight.bold)),
                              ],
                            ),
                            const Padding(
                              padding: EdgeInsets.symmetric(vertical: 8.0),
                              child: Divider(height: 1),
                            ),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Text('Payable at Pickup (COD)', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                                Text(
                                  '₹${cartState.grandTotal.toStringAsFixed(2)}',
                                  style: TextStyle(
                                    fontSize: 18,
                                    fontWeight: FontWeight.w900,
                                    color: theme.colorScheme.primary,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
          ),

          if (_checkoutError != null)
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 8),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                decoration: BoxDecoration(
                  color: Colors.redAccent.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.redAccent.withValues(alpha: 0.4)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.error_outline_rounded, color: Colors.redAccent, size: 20),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        _checkoutError!,
                        style: const TextStyle(color: Colors.redAccent, fontSize: 12, fontWeight: FontWeight.w600),
                      ),
                    ),
                  ],
                ),
              ),
            ),

          // Bottom Checkout Button
          if (cartState.isNotEmpty)
            Padding(
              padding: EdgeInsets.fromLTRB(20, 12, 20, MediaQuery.of(context).viewInsets.bottom + 20),
              child: SizedBox(
                width: double.infinity,
                child: FilledButton(
                  style: FilledButton.styleFrom(
                    backgroundColor: theme.colorScheme.primary,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                  onPressed: _isPlacingOrder
                      ? null
                      : () => _handleCheckout(cartState),
                  child: _isPlacingOrder
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                        )
                      : Text(
                          'Place Store Order (COD) • ₹${cartState.grandTotal.toStringAsFixed(0)}',
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                        ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildCartRecommendations(
    String shopId,
    StoreCartState cartState,
    bool isDark,
    ThemeData theme,
  ) {
    final recommendationsAsync = ref.watch(shopRecommendationsProvider(shopId));

    return recommendationsAsync.when(
      loading: () => const SizedBox.shrink(),
      error: (_, _) => const SizedBox.shrink(),
      data: (items) {
        // Exclude items already in cart
        final existingProductIds = cartState.items.map((i) => i.productId).toSet();
        final unadded = items.where((it) => !existingProductIds.contains(it['product_id'])).toList();
        if (unadded.isEmpty) return const SizedBox.shrink();

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 12),
            Row(
              children: [
                Icon(Icons.add_shopping_cart_rounded, size: 16, color: theme.colorScheme.primary),
                const SizedBox(width: 6),
                Text(
                  'Add more from ${cartState.shop?.shopName ?? "this shop"}',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: isDark ? Colors.white70 : Colors.black87,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            SizedBox(
              height: 100,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: unadded.length,
                separatorBuilder: (_, _) => const SizedBox(width: 8),
                itemBuilder: (context, index) {
                  final it = unadded[index];
                  final price = double.tryParse(it['price']?.toString() ?? '0') ?? 0.0;
                  final stock = int.tryParse(it['stock_count']?.toString() ?? '0') ?? 0;

                  return Container(
                    width: 140,
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: isDark ? Colors.white.withValues(alpha: 0.04) : Colors.black.withValues(alpha: 0.03),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          it['title'] ?? 'Title',
                          style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: isDark ? Colors.white : Colors.black87),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              '₹${price.toStringAsFixed(0)}',
                              style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: theme.colorScheme.primary),
                            ),
                            GestureDetector(
                              onTap: () {
                                final item = StoreCartItem(
                                  productId: it['product_id'],
                                  inventoryId: it['inventory_id'],
                                  title: it['title'],
                                  category: it['category'] ?? 'Other',
                                  unitPrice: price,
                                  quantity: 1,
                                  maxStock: stock,
                                );
                                ref.read(storeCartProvider.notifier).addToCart(
                                  shop: cartState.shop!,
                                  item: item,
                                );
                              },
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                                decoration: BoxDecoration(
                                  color: theme.colorScheme.primary,
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: const Text('+ Add', style: TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold)),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),
          ],
        );
      },
    );
  }
}
