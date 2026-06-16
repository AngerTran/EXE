import 'package:flutter/material.dart';

import '../config/app_assets.dart';
import '../core/theme/app_colors.dart';

/// Site-wide subtle background (matches web `site-background.png`).
class SiteBackground extends StatelessWidget {
  const SiteBackground({super.key, required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: const BoxDecoration(
        color: AppColors.background,
        image: DecorationImage(
          image: AssetImage(AppAssets.siteBackground),
          fit: BoxFit.cover,
          opacity: 0.22,
        ),
      ),
      child: child,
    );
  }
}

/// Auth screens hero + dark scrim for readable forms.
class AuthHeroBackground extends StatelessWidget {
  const AuthHeroBackground({super.key, required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Stack(
      fit: StackFit.expand,
      children: [
        const DecoratedBox(
          decoration: BoxDecoration(
            image: DecorationImage(
              image: AssetImage(AppAssets.authHero),
              fit: BoxFit.cover,
              alignment: Alignment.center,
            ),
          ),
        ),
        DecoratedBox(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [
                AppColors.background.withValues(alpha: 0.72),
                AppColors.background.withValues(alpha: 0.92),
                AppColors.background.withValues(alpha: 0.98),
              ],
            ),
          ),
        ),
        child,
      ],
    );
  }
}
