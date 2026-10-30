import 'package:flutter/material.dart';
import '../constants/app_colors.dart';

class QuizDialog extends StatefulWidget {
  const QuizDialog({Key? key}) : super(key: key);

  @override
  State<QuizDialog> createState() => _QuizDialogState();
}

class _QuizDialogState extends State<QuizDialog> {
  int currentStep = 0;
  String? selectedVibe;
  String? selectedBudget;
  String? selectedCompanion;

  final List<String> vibes = ['Tropical Beach 🏝️', 'City & Skyscrapers 🏙️', 'Mountain & Snow 🏔️', 'Heritage & History 🏛️'];
  final List<String> budgets = ['Budget Friendly 🪙', 'Comfort Standard 🎒', 'Luxury & Premium 👑'];
  final List<String> companions = ['Solo Explorer 🚶‍♂️', 'Couples Getaway 💕', 'Family & Kids 👨‍👩‍👧‍👦', 'Friends Group 👥'];

  @override
  Widget build(BuildContext context) {
    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      child: Container(
        width: 460,
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: const BoxDecoration(
                        color: AppColors.primaryLight,
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.explore_rounded, color: AppColors.primary, size: 20),
                    ),
                    const SizedBox(width: 10),
                    const Text(
                      'Sutriva Travel Quiz',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: AppColors.textDark,
                      ),
                    ),
                  ],
                ),
                IconButton(
                  icon: const Icon(Icons.close, color: AppColors.textMuted),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
            const SizedBox(height: 12),
            LinearProgressIndicator(
              value: (currentStep + 1) / 3,
              backgroundColor: AppColors.border,
              color: AppColors.primary,
              minHeight: 6,
              borderRadius: BorderRadius.circular(4),
            ),
            const SizedBox(height: 20),

            if (currentStep == 0) ...[
              const Text(
                'What is your ideal holiday vibe?',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.textDark),
              ),
              const SizedBox(height: 12),
              ...vibes.map((vibe) => _buildOptionTile(vibe, selectedVibe == vibe, () {
                    setState(() => selectedVibe = vibe);
                  })),
            ] else if (currentStep == 1) ...[
              const Text(
                'What is your travel budget range?',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.textDark),
              ),
              const SizedBox(height: 12),
              ...budgets.map((b) => _buildOptionTile(b, selectedBudget == b, () {
                    setState(() => selectedBudget = b);
                  })),
            ] else if (currentStep == 2) ...[
              const Text(
                'Who are you traveling with?',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.textDark),
              ),
              const SizedBox(height: 12),
              ...companions.map((c) => _buildOptionTile(c, selectedCompanion == c, () {
                    setState(() => selectedCompanion = c);
                  })),
            ] else ...[
              // Recommendation Result
              Center(
                child: Column(
                  children: [
                    const Icon(Icons.stars_rounded, size: 50, color: Colors.amber),
                    const SizedBox(height: 10),
                    const Text(
                      'Match Found: Bali, Indonesia! 🏝️',
                      style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AppColors.primaryDark),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'Based on your vibe ($selectedVibe) and preference, Bali is your ideal destination with 98% match!',
                      style: const TextStyle(fontSize: 13, color: AppColors.textMuted),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 20),
                    ElevatedButton(
                      onPressed: () => Navigator.pop(context),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                      ),
                      child: const Text('View Bali Packages', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                    )
                  ],
                ),
              )
            ],

            if (currentStep < 3) ...[
              const SizedBox(height: 20),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  if (currentStep > 0)
                    TextButton(
                      onPressed: () => setState(() => currentStep--),
                      child: const Text('Back', style: TextStyle(color: AppColors.textMuted)),
                    )
                  else
                    const SizedBox.shrink(),
                  ElevatedButton(
                    onPressed: () {
                      if (currentStep == 0 && selectedVibe == null) return;
                      if (currentStep == 1 && selectedBudget == null) return;
                      if (currentStep == 2 && selectedCompanion == null) return;
                      setState(() => currentStep++);
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    ),
                    child: Text(currentStep == 2 ? 'See Results' : 'Next', style: const TextStyle(color: Colors.white)),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildOptionTile(String text, bool isSelected, VoidCallback onTap) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          decoration: BoxDecoration(
            color: isSelected ? AppColors.primaryLight : AppColors.background,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: isSelected ? AppColors.primary : AppColors.border,
              width: isSelected ? 2 : 1,
            ),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                text,
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                  color: isSelected ? AppColors.primaryDark : AppColors.textDark,
                ),
              ),
              if (isSelected) const Icon(Icons.check_circle, color: AppColors.primary, size: 20),
            ],
          ),
        ),
      ),
    );
  }
}
