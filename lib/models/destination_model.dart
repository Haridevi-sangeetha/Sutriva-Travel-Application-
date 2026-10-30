class Destination {
  final String id;
  final String name;
  final String subtitle;
  final String imageUrl;
  final String price;
  final double rating;
  final String category;

  Destination({
    required this.id,
    required this.name,
    required this.subtitle,
    required this.imageUrl,
    required this.price,
    required this.rating,
    required this.category,
  });
}

final List<Destination> sampleDestinations = [
  Destination(
    id: '1',
    name: 'Singapore',
    subtitle: 'City of the Future',
    imageUrl: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800&q=80',
    price: '\$799',
    rating: 4.9,
    category: 'City & Culture',
  ),
  Destination(
    id: '2',
    name: 'Dubai',
    subtitle: 'Land of Gold',
    imageUrl: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80',
    price: '\$950',
    rating: 4.8,
    category: 'Luxury & Adventure',
  ),
  Destination(
    id: '3',
    name: 'Bali',
    subtitle: 'Island of Gods',
    imageUrl: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=80',
    price: '\$650',
    rating: 4.9,
    category: 'Tropical & Beach',
  ),
  Destination(
    id: '4',
    name: 'Kerala',
    subtitle: 'God\'s Own Country',
    imageUrl: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800&q=80',
    price: '\$450',
    rating: 4.7,
    category: 'Nature & Backwaters',
  ),
  Destination(
    id: '5',
    name: 'Switzerland',
    subtitle: 'Nature\'s Paradise',
    imageUrl: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?w=800&q=80',
    price: '\$1,200',
    rating: 5.0,
    category: 'Mountains & Lakes',
  ),
];
