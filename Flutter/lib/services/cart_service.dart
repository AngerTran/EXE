import '../models/commerce_models.dart';
import 'api_client.dart';

class CartService {
  CartService(this._client);

  final ApiClient _client;

  Future<Cart> fetchCart() => _client.get(
        '/cart',
        parser: (d) => Cart.fromJson(d as Map<String, dynamic>),
      );

  Future<CartItem> addItem(String assetId, {int quantity = 1}) =>
      _client.post(
        '/cart/items',
        data: {'assetId': assetId, 'quantity': quantity},
        parser: (d) => CartItem.fromJson(d as Map<String, dynamic>),
      );

  Future<CartItem> updateItem(String id, int quantity) => _client.patch(
        '/cart/items/$id',
        data: {'quantity': quantity},
        parser: (d) => CartItem.fromJson(d as Map<String, dynamic>),
      );

  Future<void> removeItem(String id) =>
      _client.delete<void>('/cart/items/$id');

  Future<void> clearCart() => _client.delete<void>('/cart');
}
