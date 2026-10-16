import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:file_picker/file_picker.dart';
import 'package:print_it_app/features/orders/order_provider.dart';

void main() {
  group('Pricing and Sheet Calculation Tests', () {
    late ProviderContainer container;

    setUp(() {
      container = ProviderContainer();
    });

    tearDown(() {
      container.dispose();
    });

    test('4-page document: single sided vs back-to-back calculation', () {
      final notifier = container.read(orderProvider.notifier);
      notifier.setPrices(2.0, 10.0, [
        {'color': 'bw', 'size': 'A4', 'sides': 'single', 'price_per_page': 2.0},
        {'color': 'bw', 'size': 'A4', 'sides': 'double', 'price_per_page': 3.0},
      ]);

      final dummyFile = PlatformFile(name: 'test.pdf', size: 100);
      notifier.setFiles([
        FileEntry(file: dummyFile, pages: 4, colorMode: 'B&W', sides: 'single', copies: 1),
      ]);

      // Single sided: 4 sheets, 4 pages, subtotal 4 * 2.0 = 8.0
      var state = container.read(orderProvider);
      expect(state.totalSheets, 4);
      expect(state.totalPagesCount, 4);
      expect(state.subtotal, 8.0);

      // Switch to Back-to-Back
      notifier.setSides('double');
      state = container.read(orderProvider);
      // Double sided: 2 sheets, 4 pages, subtotal 2 * 3.0 = 6.0
      expect(state.totalSheets, 2);
      expect(state.totalPagesCount, 4);
      expect(state.subtotal, 6.0);
    });

    test('3-page document: single sided vs back-to-back calculation', () {
      final notifier = container.read(orderProvider.notifier);
      notifier.setPrices(2.0, 10.0, [
        {'color': 'bw', 'size': 'A4', 'sides': 'single', 'price_per_page': 2.0},
        {'color': 'bw', 'size': 'A4', 'sides': 'double', 'price_per_page': 3.0},
      ]);

      final dummyFile = PlatformFile(name: 'test.pdf', size: 100);
      notifier.setFiles([
        FileEntry(file: dummyFile, pages: 3, colorMode: 'B&W', sides: 'single', copies: 1),
      ]);

      // Single sided: 3 sheets, 3 pages, subtotal 3 * 2.0 = 6.0
      var state = container.read(orderProvider);
      expect(state.totalSheets, 3);
      expect(state.totalPagesCount, 3);
      expect(state.subtotal, 6.0);

      // Switch to Back-to-Back: 1 double sheet (3.0) + 1 single sheet (2.0) = 5.0
      notifier.setSides('double');
      state = container.read(orderProvider);
      expect(state.totalSheets, 2);
      expect(state.totalPagesCount, 3);
      expect(state.subtotal, 5.0);
    });

    test('1-page document: single sided vs back-to-back calculation', () {
      final notifier = container.read(orderProvider.notifier);
      notifier.setPrices(2.0, 10.0, [
        {'color': 'bw', 'size': 'A4', 'sides': 'single', 'price_per_page': 2.0},
        {'color': 'bw', 'size': 'A4', 'sides': 'double', 'price_per_page': 3.0},
      ]);

      final dummyFile = PlatformFile(name: 'test.pdf', size: 100);
      notifier.setFiles([
        FileEntry(file: dummyFile, pages: 1, colorMode: 'B&W', sides: 'single', copies: 1),
      ]);

      var state = container.read(orderProvider);
      expect(state.totalSheets, 1);
      expect(state.totalPagesCount, 1);
      expect(state.subtotal, 2.0);

      // Back-to-Back on 1 page remains 1 sheet and 2.0
      notifier.setSides('double');
      state = container.read(orderProvider);
      expect(state.totalSheets, 1);
      expect(state.totalPagesCount, 1);
      expect(state.subtotal, 2.0);
    });

    test('Fallback pricing when no double-sided rule is specified (1.5x fallback)', () {
      final notifier = container.read(orderProvider.notifier);
      notifier.setPrices(2.0, 10.0, []); // Empty rules

      final dummyFile = PlatformFile(name: 'test.pdf', size: 100);
      notifier.setFiles([
        FileEntry(file: dummyFile, pages: 4, colorMode: 'B&W', sides: 'single', copies: 1),
      ]);

      // Single sided: 4 * 2.0 = 8.0
      var state = container.read(orderProvider);
      expect(state.totalSheets, 4);
      expect(state.subtotal, 8.0);

      // Double sided: 2 sheets * (2.0 * 1.5) = 2 * 3.0 = 6.0
      notifier.setSides('double');
      state = container.read(orderProvider);
      expect(state.totalSheets, 2);
      expect(state.subtotal, 6.0);
    });

    test('Duplex with Pages Per Sheet (2-up): 4-page PDF adapts to 1 sheet', () {
      final notifier = container.read(orderProvider.notifier);
      notifier.setPrices(2.0, 10.0, [
        {'color': 'bw', 'size': 'A4', 'sides': 'single', 'price_per_page': 2.0},
        {'color': 'bw', 'size': 'A4', 'sides': 'double', 'price_per_page': 3.0},
      ]);

      final dummyFile = PlatformFile(name: 'test4.pdf', size: 100);
      notifier.setFiles([
        FileEntry(file: dummyFile, pages: 4, colorMode: 'B&W', sides: 'single', copies: 1),
      ]);

      // Set 2 pages per sheet (2-up)
      notifier.setPagesPerPaper(2);
      var state = container.read(orderProvider);
      // Single sided 2-up: 4 pages / 2 = 2 printed sides -> 2 physical sheets, subtotal = 2 * 2.0 = 4.0
      expect(state.totalSheets, 2);
      expect(state.totalPagesCount, 4); // actual document pages
      expect(state.totalPrintedSides, 2);
      expect(state.subtotal, 4.0);

      // Now switch to Duplex (double-sided): 2 printed sides fit on front & back of 1 sheet!
      notifier.setSides('double');
      state = container.read(orderProvider);
      // Duplex 2-up: 1 physical sheet, 4 document pages, subtotal 1 * 3.0 = 3.0
      expect(state.totalSheets, 1);
      expect(state.totalPagesCount, 4);
      expect(state.totalPrintedSides, 2);
      expect(state.subtotal, 3.0);
    });

    test('Two documents with different pagesPerPaper in duplex', () {
      final notifier = container.read(orderProvider.notifier);
      notifier.setPrices(2.0, 10.0, [
        {'color': 'bw', 'size': 'A4', 'sides': 'single', 'price_per_page': 2.0},
        {'color': 'bw', 'size': 'A4', 'sides': 'double', 'price_per_page': 3.0},
      ]);

      final doc1 = PlatformFile(name: 'document1.pdf', size: 100);
      final doc2 = PlatformFile(name: 'document2.pdf', size: 100);
      notifier.setFiles([
        FileEntry(file: doc1, pages: 4, colorMode: 'B&W', sides: 'double', pagesPerPaper: 2, copies: 1),
        FileEntry(file: doc2, pages: 4, colorMode: 'B&W', sides: 'double', pagesPerPaper: 4, copies: 1),
      ]);

      // Doc 1: 4 pages / 2 = 2 sides -> 1 sheet (double) -> cost 3.0
      // Doc 2: 4 pages / 4 = 1 side -> 1 sheet (single side) -> cost 2.0
      // Total sheets = 1 + 1 = 2 sheets.
      // Total pages count = 4 + 4 = 8 pages.
      // Total printed sides = 2 + 1 = 3 sides.
      // Subtotal = 3.0 + 2.0 = 5.0.
      final state = container.read(orderProvider);
      expect(state.totalSheets, 2);
      expect(state.totalPagesCount, 8);
      expect(state.totalPrintedSides, 3);
      expect(state.subtotal, 5.0);
    });

    test('Independent document grid modification via setFilePagesPerPaper', () {
      final notifier = container.read(orderProvider.notifier);
      notifier.setPrices(2.0, 10.0, [
        {'color': 'bw', 'size': 'A4', 'sides': 'single', 'price_per_page': 2.0},
        {'color': 'bw', 'size': 'A4', 'sides': 'double', 'price_per_page': 3.0},
      ]);

      final doc1 = PlatformFile(name: 'document1.pdf', size: 100);
      final doc2 = PlatformFile(name: 'document2.pdf', size: 100);
      notifier.setFiles([
        FileEntry(file: doc1, pages: 4, colorMode: 'B&W', sides: 'double', pagesPerPaper: 1, copies: 1),
        FileEntry(file: doc2, pages: 4, colorMode: 'B&W', sides: 'double', pagesPerPaper: 1, copies: 1),
      ]);

      // Change Doc 1 to 2-up, Doc 2 to 4-up
      notifier.setFilePagesPerPaper(0, 2);
      notifier.setFilePagesPerPaper(1, 4);

      final state = container.read(orderProvider);
      expect(state.files[0].pagesPerPaper, 2);
      expect(state.files[1].pagesPerPaper, 4);
      expect(state.totalSheets, 2);
      expect(state.totalPagesCount, 8);
      expect(state.totalPrintedSides, 3);
      expect(state.subtotal, 5.0);
    });
  });
}
