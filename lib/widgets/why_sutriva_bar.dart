import 'package:flutter/material.dart';
import '../constants/app_colors.dart';
import 'responsive_layout.dart';

class WhySutrivaBar extends StatelessWidget {
  const WhySutrivaBar({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    bool isMobile = ResponsiveLayout.isMobile(context);

    final tools = [
      {'title': 'Budget Tracker', 'sub': 'Track your trip expenses in real time.', 'icon': Icons.account_balance_wallet_rounded, 'color': const Color(0xFF10B981)},
      {'title': 'Smart Itinerary', 'sub': 'Get a day-wise plan based on your interests.', 'icon': Icons.calendar_month_rounded, 'color': const Color(0xFFE91E63)},
      {'title': 'Trip Cost Calculator', 'sub': 'Know your total trip cost before you book.', 'icon': Icons.calculate_rounded, 'color': const Color(0xFF1877F2)},
      {'title': 'EMI Planner', 'sub': 'Make your dream trip easier to finance.', 'icon': Icons.credit_card_rounded, 'color': const Color(0xFFFF6B35)},
      {'title': 'Price Alert', 'sub': 'Get notified when prices drop.', 'icon': Icons.notifications_active_rounded, 'color': const Color(0xFFEF4444)},
      {'title': 'Split Expenses', 'sub': 'Share costs with your travel buddies.', 'icon': Icons.group_rounded, 'color': const Color(0xFF14B8A6)},
      {'title': 'Explore Map', 'sub': 'Live route & destination map.', 'icon': Icons.map_rounded, 'color': const Color(0xFF1877F2)},
      {'title': 'Packing Checklist', 'sub': 'Never forget essentials again.', 'icon': Icons.assignment_turned_in_rounded, 'color': const Color(0xFFD97706)},
      {'title': 'Travel Documents', 'sub': 'Keep all your important docs in one place.', 'icon': Icons.folder_open_rounded, 'color': const Color(0xFFA855F7)},
      {'title': 'Live Trip Tracker', 'sub': 'Track your journey in real time.', 'icon': Icons.location_on_rounded, 'color': const Color(0xFF059669)},
      {'title': 'AI Trip Planner', 'sub': 'Let AI create the perfect trip for you.', 'icon': Icons.memory_rounded, 'color': const Color(0xFF8B5CF6)},
    ];

    return Container(
      margin: EdgeInsets.symmetric(
        horizontal: isMobile ? 12 : 50,
        vertical: 20,
      ),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0A0B2341),
            blurRadius: 20,
            offset: Offset(0, 4),
          )
        ],
      ),
      child: isMobile
          ? Column(
              children: [
                _buildLeftBanner(),
                const SizedBox(height: 16),
                ListView.separated(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: tools.length,
                  separatorBuilder: (c, i) => const SizedBox(height: 10),
                  itemBuilder: (c, i) => _buildToolCard(tools[i]),
                ),
              ],
            )
          : Row(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                _buildLeftBanner(),
                const SizedBox(width: 20),
                Expanded(
                  child: GridView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 5,
                      childAspectRatio: 2.2,
                      crossAxisSpacing: 10,
                      mainAxisSpacing: 10,
                    ),
                    itemCount: tools.length,
                    itemBuilder: (context, index) {
                      return _buildToolCard(tools[index]);
                    },
                  ),
                ),
              ],
            ),
    );
  }

  Widget _buildLeftBanner() {
    return Container(
      width: 220,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFFE8F3FF), Color(0xFFDBEAFE)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFC7D2FE)),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: const [
          Text(
            'Plan Smarter\nwith Sutriva ✈️',
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: Color(0xFF1877F2),
              height: 1.15,
            ),
          ),
          SizedBox(height: 10),
          Text(
            'Powerful tools to make your travel planning easier, better and stress-free.',
            style: TextStyle(
              fontSize: 12,
              color: Color(0xFF475569),
              height: 1.4,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildToolCard(Map<String, dynamic> tool) {
    Color color = tool['color'] as Color;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Row(
        children: [
          Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              color: color.withOpacity(0.12),
              shape: BoxShape.circle,
            ),
            child: Icon(tool['icon'] as IconData, size: 16, color: color),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  tool['title'] as String,
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF0F172A),
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                Text(
                  tool['sub'] as String,
                  style: const TextStyle(
                    fontSize: 9.5,
                    color: Color(0xFF64748B),
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          Icon(Icons.chevron_right, size: 14, color: color),
        ],
      ),
    );
  }
}
