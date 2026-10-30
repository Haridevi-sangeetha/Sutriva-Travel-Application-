import 'package:flutter/material.dart';
import '../constants/app_colors.dart';
import 'responsive_layout.dart';

class SutrivaFooter extends StatelessWidget {
  const SutrivaFooter({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    bool isMobile = ResponsiveLayout.isMobile(context);

    return Container(
      color: Colors.white,
      padding: EdgeInsets.symmetric(
        horizontal: isMobile ? 20 : 60,
        vertical: 24,
      ),
      child: Column(
        children: [
          const Divider(color: AppColors.border),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              // Brand Logo
              Row(
                children: const [
                  Icon(Icons.flight_takeoff_rounded, color: AppColors.primary, size: 20),
                  SizedBox(width: 8),
                  Text(
                    'Sutriva',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: AppColors.primary,
                    ),
                  ),
                ],
              ),

              // Links
              if (!isMobile)
                Row(
                  children: [
                    _buildFooterLink('About Us'),
                    _buildFooterLink('Help'),
                    _buildFooterLink('Privacy'),
                    _buildFooterLink('Terms'),
                  ],
                ),

              // Social Icons
              Row(
                children: [
                  _buildSocialIcon(Icons.facebook),
                  _buildSocialIcon(Icons.camera_alt),
                  _buildSocialIcon(Icons.video_library),
                  _buildSocialIcon(Icons.close),
                  _buildSocialIcon(Icons.business),
                ],
              ),
            ],
          ),
          if (isMobile) ...[
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                _buildFooterLink('About Us'),
                _buildFooterLink('Help'),
                _buildFooterLink('Privacy'),
                _buildFooterLink('Terms'),
              ],
            ),
          ]
        ],
      ),
    );
  }

  Widget _buildFooterLink(String title) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 12),
      child: InkWell(
        onTap: () {},
        child: Text(
          title,
          style: const TextStyle(
            fontSize: 12,
            color: AppColors.textMuted,
            fontWeight: FontWeight.w500,
          ),
        ),
      ),
    );
  }

  Widget _buildSocialIcon(IconData icon) {
    return Container(
      margin: const EdgeInsets.only(left: 8),
      padding: const EdgeInsets.all(6),
      decoration: BoxDecoration(
        color: AppColors.background,
        shape: BoxShape.circle,
      ),
      child: Icon(icon, size: 16, color: AppColors.textDark),
    );
  }
}
