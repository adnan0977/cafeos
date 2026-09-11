import { Category, MenuItem } from '../types';

export interface SubcategoryGroup {
  id: string;
  name: string;
  icon: string;
  items: MenuItem[];
}

/**
 * Intelligently groups menu items into sub-categories for sticky headers and quick scanning.
 * Supports consolidated beverage categorization ('Hot' vs 'Cold', Frappes, Mojitos, Shakes),
 * food sub-specialties (Signatures, Spicy, Cheesy, Classics), and multi-level groupings.
 */
export function groupMenuItemsBySubcategory(
  items: MenuItem[],
  selectedCategory: string,
  categories: Category[]
): SubcategoryGroup[] {
  if (!items || items.length === 0) return [];

  // 1. ALL MENU: Group by parent Category
  if (selectedCategory === 'all') {
    const catMap = new Map<string, { category: Category; items: MenuItem[] }>();
    categories.forEach((cat) => {
      catMap.set(cat.id, { category: cat, items: [] });
    });

    const uncategorized: MenuItem[] = [];

    items.forEach((item) => {
      const entry = catMap.get(item.categoryId);
      if (entry) {
        entry.items.push(item);
      } else {
        uncategorized.push(item);
      }
    });

    const groups: SubcategoryGroup[] = [];

    categories.forEach((cat) => {
      const entry = catMap.get(cat.id);
      if (entry && entry.items.length > 0) {
        groups.push({
          id: cat.id,
          name: cat.name,
          icon: cat.icon || '🍽️',
          items: entry.items,
        });
      }
    });

    if (uncategorized.length > 0) {
      groups.push({
        id: 'other',
        name: 'Other Specialties',
        icon: '✨',
        items: uncategorized,
      });
    }

    return groups;
  }

  // 2. CONSOLIDATED BEVERAGES OR BEVERAGE CATEGORIES (Hot vs Cold & Subtypes)
  const isBeverageCategory =
    selectedCategory === 'beverages' ||
    ['cat-cold-coffee', 'cat-hot', 'cat-mojito', 'cat-shakes', 'cat-ice-tea'].includes(selectedCategory);

  if (isBeverageCategory) {
    const hotItems: MenuItem[] = [];
    const coldCoffeeItems: MenuItem[] = [];
    const mojitoItems: MenuItem[] = [];
    const shakeItems: MenuItem[] = [];
    const iceTeaItems: MenuItem[] = [];
    const otherColdItems: MenuItem[] = [];

    items.forEach((item) => {
      const name = item.name.toLowerCase();
      const cat = item.categoryId;

      const isHot =
        cat === 'cat-hot' ||
        name.includes('hot coffee') ||
        name.includes('hot chocolate') ||
        name.includes('espresso') ||
        name.includes('cappuccino') ||
        name.includes('latte') ||
        name.includes('cocoa') ||
        (name.includes('tea') && !name.includes('ice'));

      if (isHot) {
        hotItems.push(item);
      } else if (cat === 'cat-cold-coffee' || name.includes('cold coffee') || name.includes('frappe')) {
        coldCoffeeItems.push(item);
      } else if (cat === 'cat-mojito' || name.includes('mojito') || name.includes('cooler') || name.includes('curacao')) {
        mojitoItems.push(item);
      } else if (cat === 'cat-shakes' || name.includes('shake') || name.includes('smoothie')) {
        shakeItems.push(item);
      } else if (cat === 'cat-ice-tea' || name.includes('ice tea') || name.includes('iced tea')) {
        iceTeaItems.push(item);
      } else {
        otherColdItems.push(item);
      }
    });

    const groups: SubcategoryGroup[] = [];

    // When browsing specifically cat-hot
    if (selectedCategory === 'cat-hot') {
      const coffees = hotItems.filter((i) => !i.name.toLowerCase().includes('chocolate') && !i.name.toLowerCase().includes('cocoa'));
      const chocolates = hotItems.filter((i) => i.name.toLowerCase().includes('chocolate') || i.name.toLowerCase().includes('cocoa'));
      if (coffees.length > 0) groups.push({ id: 'hot-coffee', name: 'Freshly Brewed Hot Coffees', icon: '☕', items: coffees });
      if (chocolates.length > 0) groups.push({ id: 'hot-chocolate', name: 'Velvety Hot Chocolate & Warm Sips', icon: '🍫', items: chocolates });
      if (groups.length > 0) return groups;
    }

    // When browsing specifically cat-cold-coffee
    if (selectedCategory === 'cat-cold-coffee') {
      const classic = coldCoffeeItems.filter((i) => !i.name.toLowerCase().includes('chocolate') && !i.name.toLowerCase().includes('strong'));
      const chocolateAndStrong = coldCoffeeItems.filter((i) => i.name.toLowerCase().includes('chocolate') || i.name.toLowerCase().includes('strong'));
      if (classic.length > 0) groups.push({ id: 'cold-classic', name: 'Signature Chilled Cold Coffees', icon: '🧋', items: classic });
      if (chocolateAndStrong.length > 0) groups.push({ id: 'cold-choco-strong', name: 'Belgian Chocolate & Bold Frappes', icon: '🍫', items: chocolateAndStrong });
      if (groups.length > 0) return groups;
    }

    if (hotItems.length > 0) {
      groups.push({
        id: 'hot-beverages',
        name: 'Hot Beverages (Coffee & Hot Cocoa)',
        icon: '☕',
        items: hotItems,
      });
    }

    if (coldCoffeeItems.length > 0) {
      groups.push({
        id: 'cold-coffee',
        name: 'Chilled Cold Coffees & Frappes',
        icon: '🧋',
        items: coldCoffeeItems,
      });
    }

    if (mojitoItems.length > 0) {
      groups.push({
        id: 'mojitos',
        name: 'Sparkling Mojitos & Refreshers',
        icon: '🍹',
        items: mojitoItems,
      });
    }

    if (shakeItems.length > 0) {
      groups.push({
        id: 'shakes',
        name: 'Thick Milk Shakes & Blends',
        icon: '🥤',
        items: shakeItems,
      });
    }

    if (iceTeaItems.length > 0) {
      groups.push({
        id: 'ice-tea',
        name: 'Chilled Fruit Ice Teas',
        icon: '🧃',
        items: iceTeaItems,
      });
    }

    if (otherColdItems.length > 0) {
      groups.push({
        id: 'other-cold',
        name: 'Chilled Coolers & Beverages',
        icon: '🧊',
        items: otherColdItems,
      });
    }

    if (groups.length > 0) return groups;
  }

  // 3. BURGERS
  if (selectedCategory === 'cat-burger') {
    const signature: MenuItem[] = [];
    const spicy: MenuItem[] = [];
    const cheesy: MenuItem[] = [];
    const classic: MenuItem[] = [];

    items.forEach((item) => {
      const name = item.name.toLowerCase();
      if (
        item.isFeatured ||
        name.includes('king') ||
        name.includes('maharaja') ||
        name.includes('whopper') ||
        name.includes('double')
      ) {
        signature.push(item);
      } else if (
        name.includes('spicy') ||
        name.includes('bbq') ||
        name.includes('korean') ||
        name.includes('peri') ||
        name.includes('salsa')
      ) {
        spicy.push(item);
      } else if (name.includes('cheese') || name.includes('crispy') || name.includes('paneer')) {
        cheesy.push(item);
      } else {
        classic.push(item);
      }
    });

    const groups: SubcategoryGroup[] = [];
    if (signature.length > 0) groups.push({ id: 'bgr-sig', name: 'Signature & Best Sellers', icon: '👑', items: signature });
    if (spicy.length > 0) groups.push({ id: 'bgr-spicy', name: 'Spicy & Korean Specials', icon: '🌶️', items: spicy });
    if (cheesy.length > 0) groups.push({ id: 'bgr-cheese', name: 'Cheesy & Gourmet Patties', icon: '🧀', items: cheesy });
    if (classic.length > 0) groups.push({ id: 'bgr-classic', name: 'Classic Value Burgers', icon: '🍔', items: classic });
    return groups;
  }

  // 4. PIZZA
  if (selectedCategory === 'cat-pizza') {
    const burst: MenuItem[] = [];
    const paneer: MenuItem[] = [];
    const classic: MenuItem[] = [];

    items.forEach((item) => {
      const name = item.name.toLowerCase();
      if (name.includes('burst') || name.includes('overloaded') || name.includes('gourmet') || name.includes('double cheese')) {
        burst.push(item);
      } else if (name.includes('paneer') || name.includes('spicy') || name.includes('makhani') || name.includes('mexican')) {
        paneer.push(item);
      } else {
        classic.push(item);
      }
    });

    const groups: SubcategoryGroup[] = [];
    if (burst.length > 0) groups.push({ id: 'piz-burst', name: 'Cheese Burst & Gourmet Pizzas', icon: '🧀', items: burst });
    if (paneer.length > 0) groups.push({ id: 'piz-paneer', name: 'Spicy Paneer & Masala Pan', icon: '🌶️', items: paneer });
    if (classic.length > 0) groups.push({ id: 'piz-classic', name: 'Classic Pan Pizzas', icon: '🍕', items: classic });
    return groups;
  }

  // 5. MOMOS
  if (selectedCategory === 'cat-momos') {
    const steamed: MenuItem[] = [];
    const fried: MenuItem[] = [];
    const gravy: MenuItem[] = [];

    items.forEach((item) => {
      const name = item.name.toLowerCase();
      if (name.includes('gravy') || name.includes('baked') || name.includes('cheese') || name.includes('kulhad')) {
        gravy.push(item);
      } else if (name.includes('fried') || name.includes('kurkure') || name.includes('crispy')) {
        fried.push(item);
      } else {
        steamed.push(item);
      }
    });

    const groups: SubcategoryGroup[] = [];
    if (steamed.length > 0) groups.push({ id: 'momo-steam', name: 'Steamed Classic Momos', icon: '♨️', items: steamed });
    if (fried.length > 0) groups.push({ id: 'momo-fried', name: 'Crispy Fried & Kurkure Momos', icon: '🔥', items: fried });
    if (gravy.length > 0) groups.push({ id: 'momo-gravy', name: 'Gravy & Cheesy Baked Momos', icon: '🧀', items: gravy });
    return groups;
  }

  // 6. FRIES
  if (selectedCategory === 'cat-fries') {
    const classic: MenuItem[] = [];
    const periperi: MenuItem[] = [];
    const loaded: MenuItem[] = [];

    items.forEach((item) => {
      const name = item.name.toLowerCase();
      if (name.includes('cheesy') || name.includes('loaded') || name.includes('makhani') || name.includes('injector')) {
        loaded.push(item);
      } else if (name.includes('peri') || name.includes('spicy') || name.includes('masala')) {
        periperi.push(item);
      } else {
        classic.push(item);
      }
    });

    const groups: SubcategoryGroup[] = [];
    if (classic.length > 0) groups.push({ id: 'fry-classic', name: 'Classic Golden Fries', icon: '🍟', items: classic });
    if (periperi.length > 0) groups.push({ id: 'fry-peri', name: 'Peri-Peri & Spiced Crisps', icon: '🌶️', items: periperi });
    if (loaded.length > 0) groups.push({ id: 'fry-loaded', name: 'Loaded & Cheesy Melts', icon: '🧀', items: loaded });
    return groups;
  }

  // 7. SANDWICHES & TOASTIES
  if (selectedCategory === 'cat-sandwiches' || selectedCategory === 'cat-toastie') {
    const cheese: MenuItem[] = [];
    const spicy: MenuItem[] = [];
    const club: MenuItem[] = [];

    items.forEach((item) => {
      const name = item.name.toLowerCase();
      if (name.includes('cheese') || name.includes('blast') || name.includes('melt')) {
        cheese.push(item);
      } else if (name.includes('korean') || name.includes('peri') || name.includes('paneer') || name.includes('spicy')) {
        spicy.push(item);
      } else {
        club.push(item);
      }
    });

    const groups: SubcategoryGroup[] = [];
    if (cheese.length > 0) groups.push({ id: 'sw-cheese', name: 'Gourmet Grilled Cheese', icon: '🧀', items: cheese });
    if (spicy.length > 0) groups.push({ id: 'sw-spicy', name: 'Spicy Korean & Paneer Specials', icon: '🌶️', items: spicy });
    if (club.length > 0) groups.push({ id: 'sw-club', name: 'Classic Club & Veggie Toasties', icon: '🥪', items: club });
    return groups;
  }

  // 8. PASTA
  if (selectedCategory === 'cat-pasta') {
    const alfredo: MenuItem[] = [];
    const arrabbiata: MenuItem[] = [];
    const fusion: MenuItem[] = [];

    items.forEach((item) => {
      const name = item.name.toLowerCase();
      if (name.includes('alfredo') || name.includes('white') || name.includes('cheese')) {
        alfredo.push(item);
      } else if (name.includes('arrabbiata') || name.includes('red') || name.includes('spicy')) {
        arrabbiata.push(item);
      } else {
        fusion.push(item);
      }
    });

    const groups: SubcategoryGroup[] = [];
    if (alfredo.length > 0) groups.push({ id: 'pst-alfredo', name: 'Creamy Alfredo White Sauce', icon: '⚪', items: alfredo });
    if (arrabbiata.length > 0) groups.push({ id: 'pst-arrabbiata', name: 'Spicy Arrabbiata Red Sauce', icon: '🔴', items: arrabbiata });
    if (fusion.length > 0) groups.push({ id: 'pst-fusion', name: 'Pink Ala Rosey & Fusion Sauces', icon: '🌸', items: fusion });
    return groups;
  }

  // 9. MAGGI
  if (selectedCategory === 'cat-maggi') {
    const classic: MenuItem[] = [];
    const cheesy: MenuItem[] = [];
    const spicy: MenuItem[] = [];

    items.forEach((item) => {
      const name = item.name.toLowerCase();
      if (name.includes('cheese') || name.includes('butter')) {
        cheesy.push(item);
      } else if (name.includes('chatori') || name.includes('passion') || name.includes('spicy') || name.includes('peri')) {
        spicy.push(item);
      } else {
        classic.push(item);
      }
    });

    const groups: SubcategoryGroup[] = [];
    if (classic.length > 0) groups.push({ id: 'mag-classic', name: 'Double Masala Classics', icon: '🍜', items: classic });
    if (cheesy.length > 0) groups.push({ id: 'mag-cheese', name: 'Cheesy & Butter Tossed Maggi', icon: '🧀', items: cheesy });
    if (spicy.length > 0) groups.push({ id: 'mag-spicy', name: 'Chatakedaar Spicy Specials', icon: '🌶️', items: spicy });
    return groups;
  }

  // 10. COMBOS & MEAL DEALS
  if (selectedCategory === 'cat-combos') {
    const single: MenuItem[] = [];
    const group: MenuItem[] = [];

    items.forEach((item) => {
      const name = item.name.toLowerCase();
      if (name.includes('party') || name.includes('celebration') || name.includes('family') || name.includes('box')) {
        group.push(item);
      } else {
        single.push(item);
      }
    });

    const groups: SubcategoryGroup[] = [];
    if (single.length > 0) groups.push({ id: 'cmb-single', name: 'Value Meal Combos for 1', icon: '🍱', items: single });
    if (group.length > 0) groups.push({ id: 'cmb-group', name: 'Party & Celebration Packs', icon: '🎉', items: group });
    return groups;
  }

  // 11. GENERAL CATEGORY FALLBACK: Check popular vs regular
  const popular: MenuItem[] = [];
  const regular: MenuItem[] = [];

  items.forEach((item) => {
    if (item.isPopular || item.isFeatured) {
      popular.push(item);
    } else {
      regular.push(item);
    }
  });

  if (popular.length > 0 && regular.length > 0) {
    return [
      { id: 'gen-popular', name: 'Popular & Chef Picks', icon: '⭐', items: popular },
      { id: 'gen-regular', name: 'All Selections', icon: '📋', items: regular },
    ];
  }

  const currentCat = categories.find((c) => c.id === selectedCategory);
  return [
    {
      id: selectedCategory,
      name: currentCat ? currentCat.name : 'Menu Items',
      icon: currentCat?.icon || '🍽️',
      items,
    },
  ];
}
