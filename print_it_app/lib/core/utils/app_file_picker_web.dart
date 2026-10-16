// ignore_for_file: avoid_web_libraries_in_flutter, deprecated_member_use

import 'dart:async';
import 'dart:html' as html;
import 'dart:typed_data';
import 'package:file_picker/file_picker.dart';

/// Direct, rock-solid Web file picker.
/// Bypasses `file_picker`'s flawed `window.addEventListener('focus')` 1-second timeout
/// which causes first-time file selections on Windows/Chrome to be prematurely cancelled.
Future<List<PlatformFile>?> pickAppFiles({
  bool allowMultiple = true,
  List<String>? allowedExtensions,
}) async {
  final completer = Completer<List<PlatformFile>?>();

  final input = html.FileUploadInputElement();
  input.multiple = allowMultiple;
  if (allowedExtensions != null && allowedExtensions.isNotEmpty) {
    input.accept = allowedExtensions.map((e) => '.$e').join(',');
  }

  input.style.display = 'none';
  html.document.body?.children.add(input);

  void cleanup() {
    input.remove();
  }

  input.onChange.listen((event) async {
    final files = input.files;
    if (files == null || files.isEmpty) {
      cleanup();
      if (!completer.isCompleted) completer.complete(null);
      return;
    }

    final pickedFiles = <PlatformFile>[];
    for (var i = 0; i < files.length; i++) {
      final file = files[i];
      final reader = html.FileReader();
      final fileCompleter = Completer<Uint8List?>();

      reader.onLoadEnd.listen((e) {
        final res = reader.result;
        if (res is Uint8List) {
          fileCompleter.complete(res);
        } else if (res is ByteBuffer) {
          fileCompleter.complete(res.asUint8List());
        } else {
          fileCompleter.complete(null);
        }
      });

      reader.onError.listen((e) {
        fileCompleter.complete(null);
      });

      reader.readAsArrayBuffer(file);
      final bytes = await fileCompleter.future;

      pickedFiles.add(PlatformFile(
        name: file.name,
        size: file.size,
        bytes: bytes,
      ));
    }

    cleanup();
    if (!completer.isCompleted) {
      completer.complete(pickedFiles);
    }
  });

  input.addEventListener('cancel', (event) {
    cleanup();
    if (!completer.isCompleted) {
      completer.complete(null);
    }
  });

  // Directly trigger the file picker dialog synchronously with user gesture
  input.click();

  return completer.future;
}
