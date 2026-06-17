import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';

/// Logo Google 4 màu — cùng SVG với FE `Auth.tsx` GoogleIcon.
class GoogleIcon extends StatelessWidget {
  const GoogleIcon({super.key, this.size = 20});

  final double size;

  @override
  Widget build(BuildContext context) {
    return SvgPicture.asset(
      'assets/images/google-g.svg',
      width: size,
      height: size,
      semanticsLabel: 'Google',
    );
  }
}
