import 'package:flutter/material.dart';
import '../constants/app_colors.dart';
import 'responsive_layout.dart';

class SutrivaNavbar extends StatelessWidget implements PreferredSizeWidget {
  final Function(String) onNavSelected;
  final String activeTab;

  const SutrivaNavbar({
    Key? key,
    required this.onNavSelected,
    required this.activeTab,
  }) : super(key: key);

  @override
  Size get preferredSize => const Size.fromHeight(70);

  @override
  Widget build(BuildContext context) {
    bool isMobile = ResponsiveLayout.isMobile(context);

    return Container(
      height: 70,
      decoration: const BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Color(0x0A000000),
            blurRadius: 10,
            offset: Offset(0, 2),
          )
        ],
      ),
      padding: EdgeInsets.symmetric(horizontal: isMobile ? 16 : 40),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          // Brand Logo + Tagline
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: AppColors.primaryLight,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(
                  Icons.flight_takeoff_rounded,
                  color: AppColors.primary,
                  size: 26,
                ),
              ),
              const SizedBox(width: 10),
              Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Sutriva',
                    style: TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                      color: AppColors.primary,
                      letterSpacing: -0.5,
                    ),
                  ),
                  if (!isMobile)
                    const Text(
                      'Your Journey, Our Priority',
                      style: TextStyle(
                        fontSize: 10,
                        color: AppColors.textMuted,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                ],
              ),
            ],
          ),

          // Desktop Nav Links
          if (!isMobile)
            Row(
              children: [
                _buildNavItem(Icons.home_rounded, 'Home'),
                _buildNavItem(Icons.directions_car_rounded, 'Transport'),
                _buildNavItem(Icons.hotel_rounded, 'Accommodation'),
                _buildNavItem(Icons.restaurant_rounded, 'Food'),
                _buildNavItem(Icons.landscape_rounded, 'Activities'),
                _buildNavItem(Icons.card_giftcard_rounded, 'Packages'),
              ],
            ),

          // User Profile Pill / Mobile Menu Icon
          if (!isMobile)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              decoration: BoxDecoration(
                color: Colors.grey.shade100,
                borderRadius: BorderRadius.circular(25),
                border: Border.all(color: Colors.grey.shade300),
              ),
              child: Row(
                children: const [
                  CircleAvatar(
                    radius: 12,
                    backgroundColor: AppColors.primary,
                    child: Icon(Icons.person, size: 14, color: Colors.white),
                  ),
                  SizedBox(width: 8),
                  Text(
                    'Hi, Traveler',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: AppColors.textDark,
                    ),
                  ),
                  SizedBox(width: 4),
                  Icon(Icons.keyboard_arrow_down, size: 18, color: AppColors.textMuted),
                ],
              ),
            )
          else
            IconButton(
              icon: const Icon(Icons.menu_rounded, size: 28, color: AppColors.textDark),
              onPressed: () {
                Scaffold.of(context).openDrawer();
              },
            )
        ],
      ),
    );
  }

  Widget _buildNavItem(IconData icon, String label) {
    bool isActive = activeTab == label;
    return InkWell(
      onTap: () => onNavSelected(label),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        margin: const EdgeInsets.symmetric(horizontal: 2),
        decoration: BoxDecoration(
          color: isActive ? AppColors.primaryLight : Colors.transparent,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Row(
          children: [
            Icon(
              icon,
              size: 18,
              color: isActive ? AppColors.primary : AppColors.textMuted,
            ),
            const SizedBox(width: 6),
            Text(
              label,
              style: TextStyle(
                fontSize: 13,
                fontWeight: isActive ? FontWeight.w700 : FontWeight.w500,
                color: isActive ? AppColors.primary : AppColors.textDark,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
