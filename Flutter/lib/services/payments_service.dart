import '../models/commerce_models.dart';
import 'api_client.dart';

class PaymentsService {
  PaymentsService(this._client);

  final ApiClient _client;

  Future<BankTransferInfo> fetchBankTransferInfo({
    int? amountVnd,
    String? transferMemo,
  }) {
    final q = <String>[];
    if (amountVnd != null && amountVnd > 0) q.add('amountVnd=$amountVnd');
    if (transferMemo != null && transferMemo.isNotEmpty) {
      q.add('transferMemo=${Uri.encodeComponent(transferMemo)}');
    }
    final qs = q.isEmpty ? '' : '?${q.join('&')}';
    return _client.get(
      '/payments/bank-transfer-info$qs',
      parser: (d) => BankTransferInfo.fromJson(d as Map<String, dynamic>),
    );
  }
}
