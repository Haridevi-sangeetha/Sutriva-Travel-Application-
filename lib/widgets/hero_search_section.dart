import 'package:flutter/material.dart';
import '../constants/app_colors.dart';
import 'responsive_layout.dart';

class HeroSearchSection extends StatefulWidget {
  final Function(Map<String, String>) onSearch;
  final Function(String) onCategoryChanged;

  const HeroSearchSection({
    Key? key,
    required this.onSearch,
    required this.onCategoryChanged,
  }) : super(key: key);

  @override
  State<HeroSearchSection> createState() => _HeroSearchSectionState();
}

class _HeroSearchSectionState extends State<HeroSearchSection> {
  String selectedCategory = 'Transport';
  String fromCity = 'Chennai (MAA)';
  String toCity = 'Singapore (SIN)';
  String dates = '12 Jul 2025 - 20 Jul 2025';
  String travelers = '2 Adults';
  String transportMedium = 'Flights / All Modes';

  @override
  Widget build(BuildContext context) {
    bool isMobile = ResponsiveLayout.isMobile(context);

    return Stack(
      children: [
        // Hero Background Banner
        Container(
          height: isMobile ? 320 : 380,
          width: double.infinity,
          decoration: const BoxDecoration(
            image: DecorationImage(
              image: AssetImage('assets/images/sutriva_hero_bg.jpg'),
              fit: BoxFit.cover,
            ),
          ),
          child: Container(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  Colors.black.withOpacity(0.35),
                  Colors.black.withOpacity(0.15),
                  Colors.white.withOpacity(0.9),
                ],
              ),
            ),
            padding: EdgeInsets.symmetric(
              horizontal: isMobile ? 20 : 60,
              vertical: 30,
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Tagline badge
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.9),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: const [
                      Icon(Icons.flight, size: 14, color: AppColors.primary),
                      SizedBox(width: 6),
                      Text(
                        'More than just bookings',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: AppColors.primaryDark,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  'Plan. Compare. Travel.',
                  style: TextStyle(
                    fontSize: isMobile ? 28 : 42,
                    fontWeight: FontWeight.extrabold,
                    color: Colors.white,
                    letterSpacing: -0.5,
                    shadows: const [
                      Shadow(
                        color: Colors.black45,
                        blurRadius: 10,
                      )
                    ],
                  ),
                ),
                const SizedBox(height: 8),
                SizedBox(
                  width: isMobile ? double.infinity : 600,
                  child: Text(
                    'Find the best deals on transport, accommodation, food, activities and complete trip packages — all in one place.',
                    style: TextStyle(
                      fontSize: isMobile ? 13 : 16,
                      color: Colors.white.withOpacity(0.95),
                      height: 1.4,
                      fontWeight: FontWeight.w400,
                      shadows: const [
                        Shadow(color: Colors.black38, blurRadius: 6),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),

        // Floating Search & Category Card Overlay
        Container(
          margin: EdgeInsets.only(
            top: isMobile ? 210 : 250,
            left: isMobile ? 12 : 50,
            right: isMobile ? 12 : 50,
          ),
          padding: EdgeInsets.all(isMobile ? 16 : 24),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(24),
            boxShadow: const [
              BoxShadow(
                color: Color(0x1A000000),
                blurRadius: 25,
                offset: Offset(0, 10),
              )
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Search Input Controls
              if (!isMobile)
                Row(
                  children: [
                    Expanded(child: _buildSearchField(Icons.location_on, 'From', fromCity, (v) => setState(() => fromCity = v))),
                    const SizedBox(width: 12),
                    Expanded(child: _buildSearchField(Icons.pin_drop, 'To', toCity, (v) => setState(() => toCity = v))),
                    const SizedBox(width: 12),
                    Expanded(child: _buildSearchField(Icons.calendar_month, 'Dates', dates, (v) => setState(() => dates = v))),
                    const SizedBox(width: 12),
                    Expanded(child: _buildSearchField(Icons.people, 'Travelers', travelers, (v) => setState(() => travelers = v))),
                    const SizedBox(width: 12),
                    Expanded(child: _buildSearchField(Icons.flight_takeoff, 'Transport Medium', transportMedium, (v) => setState(() => transportMedium = v))),
                    const SizedBox(width: 16),
                    ElevatedButton.icon(
                      onPressed: () {
                        widget.onSearch({
                          'from': fromCity,
                          'to': toCity,
                          'dates': dates,
                          'travelers': travelers,
                          'category': selectedCategory,
                        });
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 22),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                        elevation: 4,
                      ),
                      icon: const Icon(Icons.search, color: Colors.white, size: 22),
                      label: const Text(
                        'Search',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                    ),
                  ],
                )
              else
                Column(
                  children: [
                    _buildSearchField(Icons.location_on, 'From', fromCity, (v) => setState(() => fromCity = v)),
                    const SizedBox(height: 10),
                    _buildSearchField(Icons.pin_drop, 'To', toCity, (v) => setState(() => toCity = v)),
                    const SizedBox(height: 10),
                    Row(
                      children: [
                        Expanded(child: _buildSearchField(Icons.calendar_month, 'Dates', dates, (v) => setState(() => dates = v))),
                        const SizedBox(width: 10),
                        Expanded(child: _buildSearchField(Icons.people, 'Travelers', travelers, (v) => setState(() => travelers = v))),
                      ],
                    ),
                    const SizedBox(height: 14),
                    SizedBox(
                      width: double.infinity,
                      height: 48,
                      child: ElevatedButton.icon(
                        onPressed: () {
                          widget.onSearch({
                            'from': fromCity,
                            'to': toCity,
                            'dates': dates,
                            'travelers': travelers,
                            'category': selectedCategory,
                          });
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14),
                          ),
                        ),
                        icon: const Icon(Icons.search, color: Colors.white),
                        label: const Text(
                          'Search Deals',
                          style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Colors.white),
                        ),
                      ),
                    ),
                  ],
                ),

              const SizedBox(height: 20),
              const Divider(color: AppColors.border),
              const SizedBox(height: 14),

              // Category Cards Tabs Row
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: [
                    _buildCategoryTile(
                      'Transport',
                      'Flights, Trains, Buses, Cars',
                      Icons.directions_car_rounded,
                      const Color(0xFF1B64F2),
                    ),
                    const SizedBox(width: 12),
                    _buildCategoryTile(
                      'Accommodation',
                      'Hotels, Hostels, PG, Dorms',
                      Icons.hotel_rounded,
                      const Color(0xFF9C27B0),
                    ),
                    const SizedBox(width: 12),
                    _buildCategoryTile(
                      'Food',
                      'Veg & Non-Veg, Restaurants',
                      Icons.restaurant_rounded,
                      const Color(0xFFFF9800),
                    ),
                    const SizedBox(width: 12),
                    _buildCategoryTile(
                      'Activities',
                      'Sightseeing, Adventure, Tours',
                      Icons.landscape_rounded,
                      const Color(0xFF4CAF50),
                    ),
                    const SizedBox(width: 12),
                    _buildCategoryTile(
                      'Complete Trip',
                      'Pre-planned Packages',
                      Icons.card_giftcard_rounded,
                      const Color(0xFFE91E63),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildSearchField(
    IconData icon,
    String label,
    String value,
    Function(String) onChanged,
  ) {
    List<String> options = [];
    if (label == 'From') {
      options = ['Chennai (MAA)', 'Mumbai (BOM)', 'Delhi (DEL)', 'Bengaluru (BLR)', 'Hyderabad (HYD)'];
    } else if (label == 'To') {
      options = ['Singapore (SIN)', 'Dubai (DXB)', 'Bali (DPS)', 'Bangkok (BKK)', 'London (LHR)'];
    } else if (label == 'Transport Medium' || label == 'Transport') {
      options = ['All Modes', 'Flights', 'Trains', 'Buses', 'Car Rentals', 'Ferries & Cruise'];
    } else if (label == 'Travelers') {
      options = ['1 Adult', '2 Adults', '2 Adults, 1 Child', 'Family Group (4+)'];
    } else if (label == 'Dates') {
      options = ['12 Jul - 20 Jul 2025', '01 Aug - 10 Aug 2025', '15 Sep - 22 Sep 2025'];
    }

    return InkWell(
      onTap: () {
        if (label == 'Travelers') {
          int tempAdults = 2;
          int tempChildren = 0;
          int tempInfants = 0;
          showModalBottomSheet(
            context: context,
            shape: const RoundedRectangleBorder(
              borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
            ),
            builder: (ctx) => StatefulBuilder(
              builder: (context, setModalState) {
                void updateVal() {
                  List<String> p = [];
                  if (tempAdults == 1 && tempChildren == 0 && tempInfants == 0) {
                    p.add('1 Adult');
                  } else {
                    p.add('$tempAdults Adults');
                    if (tempChildren > 0) p.add('$tempChildren ${tempChildren == 1 ? 'Child' : 'Children'}');
                    if (tempInfants > 0) p.add('$tempInfants ${tempInfants == 1 ? 'Infant' : 'Infants'}');
                  }
                  onChanged(p.join(', '));
                }

                Widget buildCounterRow(String name, String sub, int count, VoidCallback onDec, VoidCallback onInc) {
                  return Padding(
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(name, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppColors.textDark)),
                            Text(sub, style: const TextStyle(fontSize: 11, color: AppColors.textMuted)),
                          ],
                        ),
                        Row(
                          children: [
                            IconButton(
                              onPressed: onDec,
                              icon: const Icon(Icons.remove_circle_outline),
                              color: AppColors.primary,
                            ),
                            Text('$count', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                            IconButton(
                              onPressed: onInc,
                              icon: const Icon(Icons.add_circle_outline),
                              color: AppColors.primary,
                            ),
                          ],
                        ),
                      ],
                    ),
                  );
                }

                return Container(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Select Travelers', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.textDark)),
                      const SizedBox(height: 16),
                      buildCounterRow('Adults', 'Ages 12+', tempAdults, () {
                        if (tempAdults > 1) {
                          setModalState(() => tempAdults--);
                          updateVal();
                        }
                      }, () {
                        if (tempAdults + tempChildren + tempInfants < 9) {
                          setModalState(() => tempAdults++);
                          updateVal();
                        }
                      }),
                      buildCounterRow('Children', 'Ages 2-11', tempChildren, () {
                        if (tempChildren > 0) {
                          setModalState(() => tempChildren--);
                          updateVal();
                        }
                      }, () {
                        if (tempAdults + tempChildren + tempInfants < 9) {
                          setModalState(() => tempChildren++);
                          updateVal();
                        }
                      }),
                      buildCounterRow('Infants', 'Under 2 yrs', tempInfants, () {
                        if (tempInfants > 0) {
                          setModalState(() => tempInfants--);
                          updateVal();
                        }
                      }, () {
                        if (tempAdults + tempChildren + tempInfants < 9) {
                          setModalState(() => tempInfants++);
                          updateVal();
                        }
                      }),
                      const SizedBox(height: 16),
                      SizedBox(
                        width: double.infinity,
                        height: 46,
                        child: ElevatedButton(
                          onPressed: () => Navigator.pop(ctx),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.primary,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                          child: const Text('Done', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                        ),
                      )
                    ],
                  ),
                );
              },
            ),
          );
        } else if (label == 'Dates') {
          showDateRangePicker(
            context: context,
            firstDate: DateTime.now(),
            lastDate: DateTime.now().add(const Duration(days: 365)),
            initialDateRange: DateTimeRange(
              start: DateTime.now().add(const Duration(days: 7)),
              end: DateTime.now().add(const Duration(days: 14)),
            ),
          ).then((range) {
            if (range != null) {
              String startStr = "${range.start.day} ${_getMonthName(range.start.month)} ${range.start.year}";
              String endStr = "${range.end.day} ${_getMonthName(range.end.month)} ${range.end.year}";
              onChanged("$startStr - $endStr");
            }
          });
        } else if (options.isNotEmpty) {
          showModalBottomSheet(
            context: context,
            shape: const RoundedRectangleBorder(
              borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
            ),
            builder: (ctx) => Container(
              padding: const EdgeInsets.all(20),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Select $label', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.primaryDark)),
                  const SizedBox(height: 12),
                  ...options.map((opt) => ListTile(
                    leading: Icon(opt == value ? Icons.check_circle : Icons.circle_outlined, color: AppColors.primary),
                    title: Text(opt, style: TextStyle(fontWeight: opt == value ? FontWeight.bold : FontWeight.normal)),
                    onTap: () {
                      onChanged(opt);
                      Navigator.pop(ctx);
                    },
                  )).toList(),
                ],
              ),
            ),
          );
        }
      },
                  title: Text(opt, style: const TextStyle(fontWeight: FontWeight.w600)),
                  onTap: () {
                    onChanged(opt);
                    Navigator.pop(ctx);
                  },
                )),
              ],
            ),
          ),
        );
      },
      borderRadius: BorderRadius.circular(14),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: AppColors.background,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.border),
        ),
        child: Row(
          children: [
            Icon(icon, size: 20, color: AppColors.primary),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    label,
                    style: const TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w600,
                      color: AppColors.textMuted,
                    ),
                  ),
                  Text(
                    value,
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.bold,
                      color: AppColors.textDark,
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
            const Icon(Icons.keyboard_arrow_down, size: 18, color: AppColors.textMuted),
          ],
        ),
      ),
    );
  }

  Widget _buildCategoryTile(
    String title,
    String subtitle,
    IconData icon,
    Color color,
  ) {
    bool isSelected = selectedCategory == title;
    return InkWell(
      onTap: () {
        setState(() {
          selectedCategory = title;
        });
        widget.onCategoryChanged(title);
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: isSelected ? color.withOpacity(0.08) : Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isSelected ? color : AppColors.border,
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: color.withOpacity(0.12),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: color, size: 22),
            ),
            const SizedBox(width: 12),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: isSelected ? color : AppColors.textDark,
                  ),
                ),
                Text(
                  subtitle,
                  style: const TextStyle(
                    fontSize: 10,
                    color: AppColors.textMuted,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  String _getMonthName(int month) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[month - 1];
  }
}
