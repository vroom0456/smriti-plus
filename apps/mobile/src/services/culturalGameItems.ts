/**
 * SMRITI+ — Cultural Regional Game Items Catalog
 *
 * Real authentic photographic artifacts from North Eastern & Indian heritage:
 * - Tea Leaves (Assam tea gardens)
 * - Bamboo Basket (traditional cane craftsmanship)
 * - Gamosa (iconic red & white woven textile)
 * - River Fish (Brahmaputra fresh catch)
 * - Red Apple (hillside fresh fruit)
 * - Brass Diya (handcrafted oil lamp)
 * - Clay Pot (traditional earthenware matka)
 * - Marigold (festive sacred flower)
 * - Lotus (sacred pond bloom)
 *
 * Used across Memory Match, Pattern Recognition, Attention, and Memory Recall
 * to replace generic emojis with culturally grounded, dementia-friendly imagery.
 */

export interface CulturalItem {
  id: string;
  label: string;
  sublabel: string;
  image: any;
  category: 'artifact' | 'nature' | 'heritage' | 'daily';
}

export const CULTURAL_GAME_ITEMS: CulturalItem[] = [
  {
    id: 'tea_leaves',
    label: 'Tea Leaves',
    sublabel: 'Assam Garden Pick',
    image: require('../../assets/game_items/tea_leaves.jpg'),
    category: 'nature',
  },
  {
    id: 'bamboo_basket',
    label: 'Bamboo Basket',
    sublabel: 'Traditional Khang',
    image: require('../../assets/game_items/bamboo_basket.jpg'),
    category: 'artifact',
  },
  {
    id: 'gamosa',
    label: 'Gamosa',
    sublabel: 'Woven Heritage',
    image: require('../../assets/game_items/gamosa.jpg'),
    category: 'heritage',
  },
  {
    id: 'river_fish',
    label: 'River Fish',
    sublabel: 'Brahmaputra Catch',
    image: require('../../assets/game_items/river_fish.jpg'),
    category: 'nature',
  },
  {
    id: 'red_apple',
    label: 'Red Apple',
    sublabel: 'Fresh Hill Orchard',
    image: require('../../assets/game_items/apple.jpg'),
    category: 'daily',
  },
  {
    id: 'brass_diya',
    label: 'Brass Diya',
    sublabel: 'Sacred Oil Lamp',
    image: require('../../assets/game_items/brass_diya.jpg'),
    category: 'heritage',
  },
  {
    id: 'clay_pot',
    label: 'Clay Pot',
    sublabel: 'Village Handcraft',
    image: require('../../assets/game_items/clay_pot.jpg'),
    category: 'artifact',
  },
  {
    id: 'marigold',
    label: 'Marigold',
    sublabel: 'Auspicious Flower',
    image: require('../../assets/game_items/marigold.jpg'),
    category: 'nature',
  },
  {
    id: 'lotus_flower',
    label: 'Lotus',
    sublabel: 'Sacred Bloom',
    image: require('../../assets/game_items/lotus_flower.jpg'),
    category: 'nature',
  },
];
