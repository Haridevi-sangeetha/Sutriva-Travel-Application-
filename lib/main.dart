import 'package:flutter/material.dart';
import 'constants/app_colors.dart';
import 'models/destination_model.dart';
import 'widgets/responsive_layout.dart';
import 'widgets/sutriva_navbar.dart';
import 'widgets/hero_search_section.dart';
import 'widgets/why_sutriva_bar.dart';
import 'widgets/popular_destinations_grid.dart';
import 'widgets/quiz_banner.dart';
import 'widgets/sutriva_footer.dart';
import 'widgets/quiz_dialog.dart';

void main() {
  runApp(const SutrivaApp());
}

class SutrivaApp extends StatelessWidget {
  const SutrivaApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Sutriva - Plan. Compare. Travel.',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        primaryColor: AppColors.primary,
        scaffoldBackgroundColor: AppColors.background,
        colorScheme: ColorScheme.fromSeed(
          seedColor: AppColors.primary,
          primary: AppColors.primary,
          background: AppColors.background,
        ),
        fontFamily: 'Roboto',
      ),
      home: const SutrivaHomePage(),
    );
  }
}

class SutrivaHomePage extends StatefulWidget {
  const SutrivaHomePage({Key? key}) : super(key: key);

  @override
  State<SutrivaHomePage> createState() => _SutrivaHomePageState();
}

class _SutrivaHomePageState extends State<SutrivaHomePage> {
  String activeTab = 'Home';
  String currentCategory = 'Transport';

  void _showQuizModal(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => const QuizDialog(),
    );
  }

  void _showDestinationDetails(BuildContext context, Destination dest) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) => Container(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  dest.name,
                  style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: AppColors.textDark),
                ),
                IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(context)),
              ],
            ),
            Text(dest.subtitle, style: const TextStyle(fontSize: 14, color: AppColors.textMuted)),
            const SizedBox(height: 16),
            ClipRRect(
              borderRadius: BorderRadius.circular(16),
              child: Image.network(dest.imageUrl, height: 200, width: double.infinity, fit: BoxFit.cover),
            ),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Starting From', style: TextStyle(fontSize: 12, color: AppColors.textMuted)),
                    Text(dest.price, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: AppColors.primary)),
                  ],
                ),
                ElevatedButton(
                  onPressed: () {
                    Navigator.pop(context);
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('Booking flow started for ${dest.name}!')),
                    );
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                  child: const Text('Book Package', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    bool isMobile = ResponsiveLayout.isMobile(context);

    return Scaffold(
      appBar: SutrivaNavbar(
        activeTab: activeTab,
        onNavSelected: (tab) {
          setState(() {
            activeTab = tab;
          });
        },
      ),
      drawer: isMobile
          ? Drawer(
              child: Column(
                children: [
                  UserAccountsDrawerHeader(
                    accountName: const Text('Hi, Traveler', style: TextStyle(fontWeight: FontWeight.bold)),
                    accountEmail: const Text('traveler@sutriva.com'),
                    currentAccountPicture: const CircleAvatar(
                      backgroundColor: Colors.white,
                      child: Icon(Icons.person, color: AppColors.primary, size: 30),
                    ),
                    decoration: const BoxDecoration(color: AppColors.primary),
                  ),
                  _buildDrawerItem(Icons.home_rounded, 'Home'),
                  _buildDrawerItem(Icons.directions_car_rounded, 'Transport'),
                  _buildDrawerItem(Icons.hotel_rounded, 'Accommodation'),
                  _buildDrawerItem(Icons.restaurant_rounded, 'Food'),
                  _buildDrawerItem(Icons.landscape_rounded, 'Activities'),
                  _buildDrawerItem(Icons.card_giftcard_rounded, 'Packages'),
                ],
              ),
            )
          : null,
      body: SingleChildScrollView(
        child: Column(
          children: [
            // Hero Banner & Search Section
            HeroSearchSection(
              onSearch: (searchData) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text('Searching ${searchData['category']} from ${searchData['from']} to ${searchData['to']}...'),
                    backgroundColor: AppColors.primary,
                  ),
                );
              },
              onCategoryChanged: (cat) {
                setState(() {
                  currentCategory = cat;
                });
              },
            ),

            // Why Sutriva Feature Bar
            const WhySutrivaBar(),

            // Popular Destinations Grid
            PopularDestinationsGrid(
              onDestinationSelected: (dest) => _showDestinationDetails(context, dest),
              onOfferClicked: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Showing Special Hotel Offers! 🏨')),
                );
              },
            ),

            // Interactive Travel Quiz CTA Banner
            QuizBanner(
              onStartQuiz: () => _showQuizModal(context),
            ),

            // Sutriva Footer
            const SutrivaFooter(),
          ],
        ),
      ),
    );
  }

  Widget _buildDrawerItem(IconData icon, String title) {
    bool isSelected = activeTab == title;
    return ListTile(
      leading: Icon(icon, color: isSelected ? AppColors.primary : AppColors.textMuted),
      title: Text(
        title,
        style: TextStyle(
          color: isSelected ? AppColors.primary : AppColors.textDark,
          fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
        ),
      ),
      onTap: () {
        setState(() {
          activeTab = title;
        });
        Navigator.pop(context);
      },
    );
  }
}
