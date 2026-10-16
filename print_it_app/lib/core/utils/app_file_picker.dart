import 'package:file_picker/file_picker.dart';

/// Cross-platform file picker helper that delegates to native FilePicker on mobile/desktop
/// and to robust direct DOM FileUploadInputElement on Flutter Web, completely eliminating
/// the spurious 1-second focus cancellation bug present in FilePickerWeb.
Future<List<PlatformFile>?> pickAppFiles({
  bool allowMultiple = true,
  List<String>? allowedExtensions,
}) async {
  final result = await FilePicker.platform.pickFiles(
    type: allowedExtensions != null && allowedExtensions.isNotEmpty
        ? FileType.custom
        : FileType.any,
    allowedExtensions: allowedExtensions,
    allowMultiple: allowMultiple,
    withData: true,
  );
  return result?.files;
}
