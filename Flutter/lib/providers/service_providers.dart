import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/auth_models.dart';
import '../models/billing_models.dart';
import '../models/common_models.dart';
import '../utils/auth_errors.dart';
import '../services/ai_service.dart';
import '../services/api_client.dart';
import '../services/asset_service.dart';
import '../services/auth_service.dart';
import '../services/bookmarks_service.dart';
import '../services/cart_service.dart';
import '../services/contact_service.dart';
import '../services/credit_pack_service.dart';
import '../services/lookup_service.dart';
import '../services/orders_service.dart';
import '../services/payments_service.dart';
import '../services/reviews_service.dart';
import '../services/supabase_oauth_service.dart';
import '../models/commerce_models.dart';

final authServiceProvider = FutureProvider<AuthService>((ref) async {
  final client = await ref.watch(apiClientProvider.future);
  return AuthService(client);
});

final supabaseOAuthServiceProvider =
    FutureProvider<SupabaseOAuthService>((ref) async {
  final auth = await ref.watch(authServiceProvider.future);
  return SupabaseOAuthService(auth);
});

final assetServiceProvider = FutureProvider<AssetService>((ref) async {
  final client = await ref.watch(apiClientProvider.future);
  return AssetService(client);
});

final aiServiceProvider = FutureProvider<AiService>((ref) async {
  final client = await ref.watch(apiClientProvider.future);
  return AiService(client);
});

final lookupServiceProvider = FutureProvider<LookupService>((ref) async {
  final client = await ref.watch(apiClientProvider.future);
  return LookupService(client);
});

final walletServiceProvider = FutureProvider<WalletService>((ref) async {
  final client = await ref.watch(apiClientProvider.future);
  return WalletService(client);
});

final subscriptionServiceProvider =
    FutureProvider<SubscriptionService>((ref) async {
  final client = await ref.watch(apiClientProvider.future);
  return SubscriptionService(client);
});

final userAssetServiceProvider = FutureProvider<UserAssetService>((ref) async {
  final client = await ref.watch(apiClientProvider.future);
  return UserAssetService(client);
});

final cartServiceProvider = FutureProvider<CartService>((ref) async {
  final client = await ref.watch(apiClientProvider.future);
  return CartService(client);
});

final ordersServiceProvider = FutureProvider<OrdersService>((ref) async {
  final client = await ref.watch(apiClientProvider.future);
  return OrdersService(client);
});

final paymentsServiceProvider = FutureProvider<PaymentsService>((ref) async {
  final client = await ref.watch(apiClientProvider.future);
  return PaymentsService(client);
});

final bookmarksServiceProvider = FutureProvider<BookmarksService>((ref) async {
  final client = await ref.watch(apiClientProvider.future);
  return BookmarksService(client);
});

final reviewsServiceProvider = FutureProvider<ReviewsService>((ref) async {
  final client = await ref.watch(apiClientProvider.future);
  return ReviewsService(client);
});

final contactServiceProvider = FutureProvider<ContactService>((ref) async {
  final client = await ref.watch(apiClientProvider.future);
  return ContactService(client);
});

final creditPackServiceProvider = FutureProvider<CreditPackService>((ref) async {
  final client = await ref.watch(apiClientProvider.future);
  return CreditPackService(client);
});

final customerSubscriptionServiceProvider =
    FutureProvider<CustomerSubscriptionService>((ref) async {
  final client = await ref.watch(apiClientProvider.future);
  return CustomerSubscriptionService(client);
});

class CartNotifier extends StateNotifier<AsyncValue<Cart>> {
  CartNotifier(this._ref) : super(const AsyncValue.loading()) {
    refresh();
  }

  final Ref _ref;

  Future<void> refresh() async {
    final auth = _ref.read(authProvider);
    if (!auth.isLoggedIn) {
      state = AsyncValue.data(Cart(items: [], subtotalVnd: 0, itemCount: 0));
      return;
    }
    state = const AsyncValue.loading();
    try {
      final cart = await _ref.read(cartServiceProvider.future);
      final data = await cart.fetchCart();
      state = AsyncValue.data(data);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  Future<String?> addItem(String assetId) async {
    try {
      final cart = await _ref.read(cartServiceProvider.future);
      await cart.addItem(assetId);
      await refresh();
      return null;
    } catch (e) {
      return e.toString();
    }
  }

  Future<String?> removeItem(String itemId) async {
    try {
      final cart = await _ref.read(cartServiceProvider.future);
      await cart.removeItem(itemId);
      await refresh();
      return null;
    } catch (e) {
      return e.toString();
    }
  }
}

final cartProvider =
    StateNotifierProvider<CartNotifier, AsyncValue<Cart>>(
        CartNotifier.new);

final bookmarkIdsProvider = FutureProvider<Set<String>>((ref) async {
  final auth = ref.watch(authProvider);
  if (!auth.isLoggedIn) return {};
  final svc = await ref.watch(bookmarksServiceProvider.future);
  final items = await svc.fetchBookmarks();
  return items.map((a) => a.id).toSet();
});

final userAssetsListProvider = FutureProvider<List<UserAssetItem>>((ref) async {
  final auth = ref.watch(authProvider);
  if (!auth.isLoggedIn) return [];
  final service = await ref.watch(userAssetServiceProvider.future);
  return service.fetchUserAssets();
});

class AuthState {
  const AuthState({
    this.user,
    this.isLoading = false,
    this.isBootstrapping = true,
    this.error,
  });

  final AppUser? user;
  final bool isLoading;
  final bool isBootstrapping;
  final String? error;

  bool get isLoggedIn => user != null;

  AuthState copyWith({
    AppUser? user,
    bool? isLoading,
    bool? isBootstrapping,
    String? error,
    bool clearUser = false,
    bool clearError = false,
  }) =>
      AuthState(
        user: clearUser ? null : (user ?? this.user),
        isLoading: isLoading ?? this.isLoading,
        isBootstrapping: isBootstrapping ?? this.isBootstrapping,
        error: clearError ? null : (error ?? this.error),
      );
}

class AuthNotifier extends StateNotifier<AuthState> {
  AuthNotifier(this._ref) : super(const AuthState()) {
    _bootstrap();
  }

  final Ref _ref;

  /// Mirror FE `applySession` — lưu token BE rồi hydrate user từ `/auth/me`.
  Future<AppUser> _applySession(
    String accessToken, {
    String? refreshToken,
    bool rememberMe = true,
  }) async {
    final client = await _ref.read(apiClientProvider.future);
    await client.setTokens(
      accessToken: accessToken,
      refreshToken: refreshToken,
      rememberMe: rememberMe,
    );
    final auth = await _ref.read(authServiceProvider.future);
    final me = await auth.fetchMe();
    final user = AppUser.fromMe(me);
    state = state.copyWith(
      user: user,
      isBootstrapping: false,
      isLoading: false,
      clearError: true,
    );
    return user;
  }

  Future<void> _bootstrap() async {
    try {
      final client = await _ref.read(apiClientProvider.future);
      await client.enforceRememberMePolicy();
      if (client.accessToken == null || client.accessToken!.isEmpty) {
        state = const AuthState(isBootstrapping: false);
        return;
      }
      await refreshUser(silent: true);
    } catch (_) {
      state = const AuthState(isBootstrapping: false);
    }
  }

  Future<void> refreshUser({bool silent = false}) async {
    if (!silent) {
      state = state.copyWith(isLoading: true, clearError: true);
    }
    try {
      final auth = await _ref.read(authServiceProvider.future);
      final me = await auth.fetchMe();
      state = state.copyWith(
        user: AppUser.fromMe(me),
        isBootstrapping: false,
        isLoading: false,
        clearError: true,
      );
    } catch (e) {
      final client = await _ref.read(apiClientProvider.future);
      await client.clearTokens();
      state = AuthState(
        error: silent ? null : authErrorMessage(e, 'Phiên đăng nhập hết hạn'),
        isBootstrapping: false,
      );
    }
  }

  Future<String?> login(
    String email,
    String password, {
    bool rememberMe = true,
  }) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final auth = await _ref.read(authServiceProvider.future);
      final session = await auth.login(
        email,
        password,
        rememberMe: rememberMe,
      );
      if (session.accessToken == null) {
        state = state.copyWith(isLoading: false);
        return 'Đăng nhập thất bại — không nhận được token';
      }
      await _applySession(
        session.accessToken!,
        refreshToken: session.refreshToken,
        rememberMe: rememberMe,
      );
      _ref.read(cartProvider.notifier).refresh();
      return null;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: authErrorMessage(e));
      return authErrorMessage(e, 'Đăng nhập thất bại');
    }
  }

  Future<String?> register(String email, String password, String name) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final auth = await _ref.read(authServiceProvider.future);
      final session = await auth.register(email, password, name);
      if (session.requiresEmailConfirmation == true ||
          session.accessToken == null) {
        state = state.copyWith(isLoading: false);
        return 'Đăng ký thành công — vui lòng xác nhận email trong hộp thư rồi đăng nhập.';
      }
      await _applySession(
        session.accessToken!,
        refreshToken: session.refreshToken,
      );
      _ref.read(cartProvider.notifier).refresh();
      return null;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: authErrorMessage(e));
      return authErrorMessage(e, 'Đăng ký thất bại');
    }
  }

  Future<String?> forgotPassword(String email) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final auth = await _ref.read(authServiceProvider.future);
      await auth.forgotPassword(email);
      state = state.copyWith(isLoading: false);
      return null;
    } catch (e) {
      state = state.copyWith(isLoading: false);
      return authErrorMessage(e, 'Gửi email thất bại');
    }
  }

  Future<String?> resetPassword(String accessToken, String password) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final auth = await _ref.read(authServiceProvider.future);
      await auth.resetPassword(accessToken, password);
      state = state.copyWith(isLoading: false);
      return null;
    } catch (e) {
      state = state.copyWith(isLoading: false);
      return authErrorMessage(e, 'Đặt lại mật khẩu thất bại');
    }
  }

  Future<String?> loginWithGoogle() async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final oauth = await _ref.read(supabaseOAuthServiceProvider.future);
      final tokens = await oauth.startGoogleSignIn();
      if (tokens != null) {
        await _applySession(
          tokens.accessToken,
          refreshToken: tokens.refreshToken,
          rememberMe: true,
        );
        await oauth.signOutLocal();
        _ref.read(cartProvider.notifier).refresh();
        state = state.copyWith(isLoading: false);
        return null;
      }
      state = state.copyWith(isLoading: false);
      return null;
    } catch (e) {
      state = state.copyWith(isLoading: false);
      return authErrorMessage(e, 'Không mở được Google Sign-In');
    }
  }

  Future<String?> completeOAuth(Uri uri) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final oauth = await _ref.read(supabaseOAuthServiceProvider.future);
      final tokens = await oauth.completeOAuthUri(uri);
      await _applySession(
        tokens.accessToken,
        refreshToken: tokens.refreshToken,
        rememberMe: true,
      );
      await oauth.signOutLocal();
      _ref.read(cartProvider.notifier).refresh();
      state = state.copyWith(isLoading: false, clearError: true);
      return null;
    } catch (e) {
      final client = await _ref.read(apiClientProvider.future);
      await client.clearTokens();
      final msg = e is ApiException
          ? authErrorMessage(e, 'Đăng nhập Google thất bại')
          : oauthErrorMessage(e);
      state = AuthState(
        error: msg,
        isBootstrapping: false,
      );
      return msg;
    }
  }

  Future<String?> updateProfileName(String name) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final auth = await _ref.read(authServiceProvider.future);
      final me = await auth.updateProfile(name: name.trim());
      state = state.copyWith(
        user: AppUser.fromMe(me),
        isBootstrapping: false,
        isLoading: false,
        clearError: true,
      );
      return null;
    } catch (e) {
      state = state.copyWith(isLoading: false);
      return authErrorMessage(e, 'Cập nhật thất bại');
    }
  }

  Future<String?> uploadAvatar({
    required String fileName,
    required String contentType,
    required List<int> bytes,
  }) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final auth = await _ref.read(authServiceProvider.future);
      final me = await auth.uploadAvatar(
        fileName: fileName,
        contentType: contentType,
        fileSizeBytes: bytes.length,
        bytes: bytes,
      );
      state = state.copyWith(
        user: AppUser.fromMe(me),
        isBootstrapping: false,
        isLoading: false,
        clearError: true,
      );
      return null;
    } catch (e) {
      state = state.copyWith(isLoading: false);
      return authErrorMessage(e, 'Upload avatar thất bại');
    }
  }

  Future<void> logout() async {
    try {
      final oauth = await _ref.read(supabaseOAuthServiceProvider.future);
      await oauth.signOutLocal();
    } catch (_) {}
    try {
      final auth = await _ref.read(authServiceProvider.future);
      await auth.logout();
    } catch (_) {}
    state = const AuthState(isBootstrapping: false);
    _ref.read(cartProvider.notifier).refresh();
  }
}

final authProvider =
    StateNotifierProvider<AuthNotifier, AuthState>((ref) => AuthNotifier(ref));
