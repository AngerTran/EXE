import '../models/commerce_models.dart';
import '../models/common_models.dart';
import 'api_client.dart';

class OrdersService {
  OrdersService(this._client);

  final ApiClient _client;

  Future<PagedResponse<Order>> fetchMyOrders({
    int page = 1,
    int pageSize = 20,
  }) =>
      _client.get(
        '/orders?page=$page&pageSize=$pageSize',
        parser: (d) => PagedResponse.fromJson(
          d as Map<String, dynamic>,
          Order.fromJson,
        ),
      );

  Future<OrdersSummary> fetchSummary() => _client.get(
        '/orders/me/summary',
        parser: (d) => OrdersSummary.fromJson(d as Map<String, dynamic>),
      );

  Future<Order> fetchOrderById(String id) => _client.get(
        '/orders/$id',
        parser: (d) => Order.fromJson(d as Map<String, dynamic>),
      );

  Future<Order> createSubscriptionOrder(String planId) => _client.post(
        '/orders/subscription',
        data: {'planId': planId, 'paymentMethod': 'bank'},
        parser: (d) => Order.fromJson(d as Map<String, dynamic>),
      );

  Future<Order> createAssetOrder({List<String>? assetIds}) => _client.post(
        '/orders/assets',
        data: {'assetIds': ?assetIds},
        parser: (d) => Order.fromJson(d as Map<String, dynamic>),
      );

  Future<Order> createCreditPackOrder(String packId) => _client.post(
        '/orders/credit-packs',
        data: {'packId': packId, 'paymentMethod': 'bank'},
        parser: (d) => Order.fromJson(d as Map<String, dynamic>),
      );

  Future<Order> reportBankTransfer(String orderId) => _client.post(
        '/orders/$orderId/report-transfer',
        parser: (d) => Order.fromJson(d as Map<String, dynamic>),
      );
}
