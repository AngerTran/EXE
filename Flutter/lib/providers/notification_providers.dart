import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../config/notification_storage.dart';
import '../core/router/app_router.dart';
import '../core/theme/app_colors.dart';
import '../core/utils/notification_routes.dart';
import '../models/notification_models.dart';
import '../services/api_client.dart';
import '../services/notifications_service.dart';
import 'service_providers.dart';

final rootScaffoldMessengerKey = GlobalKey<ScaffoldMessengerState>();

class NotificationListState {
  const NotificationListState({
    this.items = const [],
    this.unreadCount = 0,
    this.isLoading = false,
    this.alertsEnabled = true,
  });

  final List<AppNotification> items;
  final int unreadCount;
  final bool isLoading;
  final bool alertsEnabled;

  NotificationListState copyWith({
    List<AppNotification>? items,
    int? unreadCount,
    bool? isLoading,
    bool? alertsEnabled,
  }) =>
      NotificationListState(
        items: items ?? this.items,
        unreadCount: unreadCount ?? this.unreadCount,
        isLoading: isLoading ?? this.isLoading,
        alertsEnabled: alertsEnabled ?? this.alertsEnabled,
      );
}

class NotificationNotifier extends StateNotifier<NotificationListState> {
  NotificationNotifier(this._ref) : super(const NotificationListState()) {
    unawaited(_bootstrap());
  }

  final Ref _ref;
  Timer? _pollTimer;
  int _lastBannerUnread = 0;
  bool _bannerInitialized = false;

  Future<void> _bootstrap() async {
    final prefs = await SharedPreferences.getInstance();
    final enabled =
        prefs.getBool(NotificationStorage.alertsEnabled) ?? true;
    state = state.copyWith(alertsEnabled: enabled);

    if (_ref.read(authProvider).isLoggedIn) {
      startPolling();
    }
  }

  void startPolling() {
    if (_pollTimer != null) return;
    unawaited(refresh(showLoader: state.items.isEmpty));
    _pollTimer = Timer.periodic(const Duration(seconds: 30), (_) {
      unawaited(refresh());
    });
  }

  void stopPolling() {
    _pollTimer?.cancel();
    _pollTimer = null;
    _bannerInitialized = false;
    _lastBannerUnread = 0;
    state = state.copyWith(items: [], unreadCount: 0, isLoading: false);
  }

  Future<void> setAlertsEnabled(bool enabled) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(NotificationStorage.alertsEnabled, enabled);
    state = state.copyWith(alertsEnabled: enabled);
    if (enabled && _ref.read(authProvider).isLoggedIn) {
      await refresh();
    }
  }

  Future<void> refresh({bool showLoader = false}) async {
    if (!_ref.read(authProvider).isLoggedIn) return;

    if (showLoader) {
      state = state.copyWith(isLoading: true);
    }

    try {
      final svc = await _ref.read(notificationsServiceProvider.future);
      final page = await svc.fetchNotifications(page: 1, pageSize: 50);
      final unread = await svc.fetchUnreadCount();
      final items = page.data;

      state = state.copyWith(
        items: items,
        unreadCount: unread,
        isLoading: false,
      );

      _maybeShowNewAlertBanner(items, unread);
    } catch (_) {
      state = state.copyWith(isLoading: false);
    }
  }

  void _maybeShowNewAlertBanner(List<AppNotification> items, int unread) {
    if (!state.alertsEnabled || unread <= 0) {
      _bannerInitialized = true;
      _lastBannerUnread = unread;
      return;
    }

    if (!_bannerInitialized) {
      _bannerInitialized = true;
      _lastBannerUnread = unread;
      return;
    }

    if (unread <= _lastBannerUnread) {
      _lastBannerUnread = unread;
      return;
    }

    _lastBannerUnread = unread;
    AppNotification? newest;
    for (final n in items) {
      if (!n.read) {
        newest = n;
        break;
      }
    }
    newest ??= items.isNotEmpty ? items.first : null;
    if (newest == null) return;

    final captured = newest;
    final messenger = rootScaffoldMessengerKey.currentState;
    messenger?.clearSnackBars();
    messenger?.showSnackBar(
      SnackBar(
        content: Text(captured.title),
        duration: const Duration(seconds: 4),
        behavior: SnackBarBehavior.floating,
        backgroundColor: AppColors.card,
        action: SnackBarAction(
          label: 'Xem',
          textColor: AppColors.primary,
          onPressed: () {
            unawaited(markRead(captured.id));
            final ctx = rootNavigatorKey.currentContext;
            final route = flutterRouteForNotificationAction(captured.actionUrl);
            if (ctx != null && route != null) {
              GoRouter.of(ctx).go(route);
            }
          },
        ),
      ),
    );
  }

  Future<void> markRead(String id) async {
    try {
      final svc = await _ref.read(notificationsServiceProvider.future);
      await svc.markRead(id);
    } catch (_) {}

    final items = state.items
        .map((n) => n.id == id ? _copyRead(n) : n)
        .toList(growable: false);
    final unread = items.where((n) => !n.read).length;
    state = state.copyWith(items: items, unreadCount: unread);
    _lastBannerUnread = unread;
  }

  Future<void> markAllRead() async {
    try {
      final svc = await _ref.read(notificationsServiceProvider.future);
      await svc.markAllRead();
    } catch (_) {}

    final items =
        state.items.map(_copyRead).toList(growable: false);
    state = state.copyWith(items: items, unreadCount: 0);
    _lastBannerUnread = 0;
  }

  Future<void> clearAll() async {
    try {
      final svc = await _ref.read(notificationsServiceProvider.future);
      await svc.deleteAll();
    } catch (_) {}

    state = state.copyWith(items: [], unreadCount: 0);
    _lastBannerUnread = 0;
  }

  AppNotification _copyRead(AppNotification n) => AppNotification(
        id: n.id,
        type: n.type,
        category: n.category,
        title: n.title,
        description: n.description,
        actionUrl: n.actionUrl,
        referenceType: n.referenceType,
        referenceId: n.referenceId,
        read: true,
        createdAt: n.createdAt,
      );

  @override
  void dispose() {
    _pollTimer?.cancel();
    super.dispose();
  }
}

final notificationsServiceProvider =
    FutureProvider<NotificationsService>((ref) async {
  final client = await ref.watch(apiClientProvider.future);
  return NotificationsService(client);
});

final notificationProvider =
    StateNotifierProvider<NotificationNotifier, NotificationListState>((ref) {
  final notifier = NotificationNotifier(ref);

  ref.listen(authProvider, (prev, next) {
    if (next.isLoggedIn && prev?.isLoggedIn != true) {
      notifier.startPolling();
    } else if (!next.isLoggedIn && prev?.isLoggedIn == true) {
      notifier.stopPolling();
    }
  });

  ref.onDispose(notifier.dispose);
  return notifier;
});
