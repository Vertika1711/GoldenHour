/* =========================================================================
   Golden Hour — mock data (owner: Member A)
   FROZEN after setup: only Member A edits this file.
   Read this data through window.Store, not directly, except AREAS and
   CATEGORIES, which are fine to read for menus and filters.
   ========================================================================= */

/* Neighbourhoods in Delhi. Store.getArea() returns one of these.
   The first one (Connaught Place) is the default. */
window.AREAS = [
  { id: 'connaught-place', name: 'Connaught Place', lat: 28.6315, lng: 77.2167 },
  { id: 'hauz-khas',       name: 'Hauz Khas',       lat: 28.5494, lng: 77.2001 },
  { id: 'lajpat-nagar',    name: 'Lajpat Nagar',    lat: 28.5677, lng: 77.2433 },
  { id: 'karol-bagh',      name: 'Karol Bagh',      lat: 28.6519, lng: 77.1909 },
  { id: 'rajouri-garden',  name: 'Rajouri Garden',  lat: 28.6415, lng: 77.1209 }
];

/* Shops (invented names, not real brands). type matches a category id. */
window.STORES = [
  { id: 's1',  name: 'Khameer Bakehouse',       type: 'bakery',  lat: 28.6338, lng: 77.2045, address: 'Gole Market, New Delhi',              rating: 4.6 },
  { id: 's2',  name: 'Chulha Chowk Kitchen',    type: 'meals',   lat: 28.6418, lng: 77.1838, address: 'Pusa Road, Rajinder Nagar',           rating: 4.4 },
  { id: 's3',  name: 'Hari Bhari Grocers',      type: 'grocery', lat: 28.5738, lng: 77.2312, address: 'Defence Colony Market, Defence Colony', rating: 4.3 },
  { id: 's4',  name: 'Chashni Sweet House',     type: 'sweets',  lat: 28.6432, lng: 77.1098, address: 'Tagore Garden Market, Tagore Garden',  rating: 4.7 },
  { id: 's5',  name: 'Idli Gali Café',          type: 'cafe',    lat: 28.5592, lng: 77.2069, address: 'Green Park Main Market, Green Park',  rating: 4.5 },
  { id: 's6',  name: 'Crumb Lane Patisserie',   type: 'bakery',  lat: 28.5486, lng: 77.2338, address: 'M-Block Market, Greater Kailash I',   rating: 4.8 },
  { id: 's7',  name: 'Tandoor Tales Kitchen',   type: 'meals',   lat: 28.6578, lng: 77.1428, address: 'Main Road, Moti Nagar',               rating: 4.2 },
  { id: 's8',  name: 'Taaza Tokri Grocers',     type: 'grocery', lat: 28.6292, lng: 77.2335, address: 'Bengali Market, Mandi House',         rating: 4.1 },
  { id: 's9',  name: 'Purani Rasoi Halwai',     type: 'sweets',  lat: 28.6458, lng: 77.1702, address: 'East Patel Nagar Market, Patel Nagar', rating: 4.6 },
  { id: 's10', name: 'Sunday Brew Café',        type: 'cafe',    lat: 28.5536, lng: 77.1942, address: 'Hauz Khas Village, Hauz Khas',        rating: 4.3 }
];

/* Food categories, in display order. svg is a decorative illustration. */
window.CATEGORIES = [
  {
    id: 'bakery', label: 'Bakery', tint: '#FDF1CC',
    svg: '<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false"><rect x="6" y="48" width="52" height="5" rx="2.5" fill="#6B1F45"/><path d="M10 44c0-13 10-22 22-22s22 9 22 22z" fill="#F4B400"/><path d="M21 30l4 10M31 27l2 13M41 30l-2 10" stroke="#6B1F45" stroke-width="3" stroke-linecap="round" opacity=".45"/></svg>'
  },
  {
    id: 'meals', label: 'Meals', tint: '#FBE4DF',
    svg: '<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false"><path d="M24 20c-3-3 3-6 0-10M32 20c-3-3 3-6 0-10M40 20c-3-3 3-6 0-10" stroke="#D6452B" stroke-width="3" stroke-linecap="round" fill="none"/><path d="M8 30h48c0 13-10 22-24 22S8 43 8 30z" fill="#6B1F45"/><ellipse cx="32" cy="30" rx="24" ry="5" fill="#F4B400"/></svg>'
  },
  {
    id: 'grocery', label: 'Grocery', tint: '#DDF1E9',
    svg: '<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false"><circle cx="24" cy="24" r="9" fill="#D6452B"/><path d="M38 10c7 2 9 9 7 16-7-2-9-9-7-16z" fill="#12946A"/><path d="M30 14c4 1 6 5 5 9-4-1-6-5-5-9z" fill="#12946A"/><path d="M8 30h48l-6 22H14z" fill="#6B1F45"/><path d="M22 36v10M32 36v10M42 36v10" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" opacity=".45"/></svg>'
  },
  {
    id: 'sweets', label: 'Sweets', tint: '#F2E0E9',
    svg: '<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false"><rect x="6" y="50" width="52" height="5" rx="2.5" fill="#6B1F45"/><circle cx="21" cy="40" r="10" fill="#F4B400"/><circle cx="43" cy="40" r="10" fill="#F4B400"/><circle cx="32" cy="23" r="10" fill="#F4B400"/><g fill="#6B1F45" opacity=".35"><circle cx="18" cy="37" r="1.6"/><circle cx="24" cy="43" r="1.6"/><circle cx="40" cy="37" r="1.6"/><circle cx="46" cy="43" r="1.6"/><circle cx="29" cy="20" r="1.6"/><circle cx="35" cy="26" r="1.6"/></g></svg>'
  },
  {
    id: 'cafe', label: 'Café', tint: '#EDE7EA',
    svg: '<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false"><path d="M24 18c-2-3 2-5 0-8M32 18c-2-3 2-5 0-8" stroke="#F4B400" stroke-width="3" stroke-linecap="round" fill="none"/><path d="M44 30h4a6 6 0 0 1 0 12h-4" fill="none" stroke="#6B1F45" stroke-width="4"/><path d="M12 24h32v14a14 14 0 0 1-14 14h-4a14 14 0 0 1-14-14z" fill="#6B1F45"/><rect x="8" y="54" width="42" height="4" rx="2" fill="#F4B400"/></svg>'
  }
];

/* Seed listings. All times are minutes relative to "now" when the demo is
   seeded (Store turns them into real timestamps):
   cookedAgoMin      made this many minutes ago
   pickupFromMin     pickup opens (negative = already open)
   pickupToMin       pickup closes
   goodTillAfterMin  best eaten before */
window.SEED_LISTINGS = [
  { id: 'l1',  storeId: 's1',  name: 'Butter croissants (box of 4)',   category: 'bakery',  veg: true,  mrp: 300, price: 140, qty: 6,  qtyLeft: 4, kgPerUnit: 0.25, allergens: ['gluten', 'dairy'],         desc: 'Flaky all-butter croissants baked this morning. Warm them for 3 minutes and they taste just baked.', cookedAgoMin: 300,  pickupFromMin: -30, pickupToMin: 25,  goodTillAfterMin: 600 },
  { id: 'l2',  storeId: 's1',  name: 'Chicken patties (pack of 4)',    category: 'bakery',  veg: false, mrp: 140, price: 65,  qty: 8,  qtyLeft: 6, kgPerUnit: 0.3,  allergens: ['gluten', 'dairy'],         desc: 'Puff pastry patties filled with spiced chicken mince. Reheat in an oven or pan for a crisp crust.', cookedAgoMin: 420,  pickupFromMin: -60, pickupToMin: 150, goodTillAfterMin: 600 },
  { id: 'l3',  storeId: 's2',  name: 'Rajma chawal',                   category: 'meals',   veg: true,  mrp: 160, price: 80,  qty: 10, qtyLeft: 7, kgPerUnit: 0.45, allergens: [],                          desc: 'Slow-cooked Jammu-style rajma with steamed basmati rice, onion and lemon on the side.', cookedAgoMin: 120,  pickupFromMin: -20, pickupToMin: 40,  goodTillAfterMin: 240 },
  { id: 'l4',  storeId: 's2',  name: 'Butter chicken with jeera rice', category: 'meals',   veg: false, mrp: 280, price: 140, qty: 6,  qtyLeft: 3, kgPerUnit: 0.55, allergens: ['dairy', 'nuts'],           desc: 'Tandoori chicken in a creamy tomato and cashew gravy, with cumin rice.', cookedAgoMin: 90,   pickupFromMin: -15, pickupToMin: 20,  goodTillAfterMin: 210 },
  { id: 'l5',  storeId: 's3',  name: 'Seasonal vegetable bag (2 kg)',  category: 'grocery', veg: true,  mrp: 180, price: 85,  qty: 5,  qtyLeft: 5, kgPerUnit: 2,    allergens: [],                          desc: 'A mixed bag of tomatoes, gobhi, gajar, matar and greens that are a little less than perfect-looking.', cookedAgoMin: 1440, pickupFromMin: 0,   pickupToMin: 180, goodTillAfterMin: 2880 },
  { id: 'l6',  storeId: 's3',  name: 'Ripe bananas (1 dozen)',         category: 'grocery', veg: true,  mrp: 70,  price: 35,  qty: 10, qtyLeft: 8, kgPerUnit: 1.2,  allergens: [],                          desc: 'Sweet, spotty bananas. Perfect for shakes or banana bread.', cookedAgoMin: 2880, pickupFromMin: -30, pickupToMin: 160, goodTillAfterMin: 1440 },
  { id: 'l7',  storeId: 's4',  name: 'Jalebi (500 g)',                 category: 'sweets',  veg: true,  mrp: 220, price: 110, qty: 6,  qtyLeft: 4, kgPerUnit: 0.5,  allergens: ['gluten'],                  desc: 'Crisp desi ghee jalebi soaked in saffron syrup. Best eaten today; warm it for a minute.', cookedAgoMin: 180,  pickupFromMin: -60, pickupToMin: 120, goodTillAfterMin: 480 },
  { id: 'l8',  storeId: 's4',  name: 'Kaju katli (250 g)',             category: 'sweets',  veg: true,  mrp: 300, price: 170, qty: 4,  qtyLeft: 2, kgPerUnit: 0.25, allergens: ['nuts'],                    desc: 'Cashew fudge diamonds with silver leaf. The last few boxes of the day.', cookedAgoMin: 1440, pickupFromMin: -60, pickupToMin: 170, goodTillAfterMin: 4320 },
  { id: 'l9',  storeId: 's5',  name: 'Idli vada with filter coffee',   category: 'cafe',    veg: true,  mrp: 150, price: 75,  qty: 8,  qtyLeft: 5, kgPerUnit: 0.45, allergens: ['dairy'],                   desc: 'Two idlis and one medu vada with coconut chutney and sambar, plus a filter coffee.', cookedAgoMin: 180,  pickupFromMin: -30, pickupToMin: 28,  goodTillAfterMin: 150 },
  { id: 'l10', storeId: 's5',  name: 'Masala dosa',                    category: 'cafe',    veg: true,  mrp: 140, price: 70,  qty: 9,  qtyLeft: 9, kgPerUnit: 0.3,  allergens: [],                          desc: 'Crisp dosa with potato masala, packed with chutney and sambar on the side.', cookedAgoMin: 60,   pickupFromMin: 0,   pickupToMin: 140, goodTillAfterMin: 150 },
  { id: 'l11', storeId: 's6',  name: 'Sourdough boule',                category: 'bakery',  veg: true,  mrp: 260, price: 120, qty: 5,  qtyLeft: 3, kgPerUnit: 0.6,  allergens: ['gluten'],                  desc: 'Naturally leavened loaf with a crackly crust. Keeps well for two days.', cookedAgoMin: 360,  pickupFromMin: -20, pickupToMin: 165, goodTillAfterMin: 1440 },
  { id: 'l12', storeId: 's6',  name: 'Eggless chocolate brownies (6)', category: 'bakery',  veg: true,  mrp: 340, price: 150, qty: 4,  qtyLeft: 0, kgPerUnit: 0.4,  allergens: ['gluten', 'dairy'],         desc: 'Fudgy dark chocolate brownies, no eggs.', cookedAgoMin: 480,  pickupFromMin: 10,  pickupToMin: 180, goodTillAfterMin: 2880 },
  { id: 'l13', storeId: 's7',  name: 'Chicken tikka roll',             category: 'meals',   veg: false, mrp: 180, price: 90,  qty: 8,  qtyLeft: 2, kgPerUnit: 0.25, allergens: ['gluten', 'dairy'],         desc: 'Charred chicken tikka, onions and mint chutney rolled in a flaky paratha.', cookedAgoMin: 150,  pickupFromMin: -10, pickupToMin: 30,  goodTillAfterMin: 300 },
  { id: 'l14', storeId: 's7',  name: 'Paneer tikka roll',              category: 'meals',   veg: true,  mrp: 160, price: 80,  qty: 8,  qtyLeft: 6, kgPerUnit: 0.25, allergens: ['gluten', 'dairy'],         desc: 'Smoky paneer tikka with onions and green chutney in a soft roomali roti.', cookedAgoMin: 150,  pickupFromMin: 0,   pickupToMin: 130, goodTillAfterMin: 300 },
  { id: 'l15', storeId: 's8',  name: 'Fresh paneer (200 g)',           category: 'grocery', veg: true,  mrp: 100, price: 60,  qty: 6,  qtyLeft: 4, kgPerUnit: 0.2,  allergens: ['dairy'],                   desc: 'Soft malai paneer made this morning. Keep refrigerated.', cookedAgoMin: 720,  pickupFromMin: -30, pickupToMin: 150, goodTillAfterMin: 1440 },
  { id: 'l16', storeId: 's8',  name: 'Leafy greens bundle',            category: 'grocery', veg: true,  mrp: 60,  price: 25,  qty: 6,  qtyLeft: 3, kgPerUnit: 0.5,  allergens: [],                          desc: 'Palak, methi and bathua. Cook today for the best taste.', cookedAgoMin: 600,  pickupFromMin: -30, pickupToMin: 15,  goodTillAfterMin: 720 },
  { id: 'l17', storeId: 's9',  name: 'Gulab jamun (6 pieces)',         category: 'sweets',  veg: true,  mrp: 150, price: 75,  qty: 6,  qtyLeft: 5, kgPerUnit: 0.3,  allergens: ['dairy', 'gluten'],         desc: 'Soft khoya dumplings in cardamom syrup.', cookedAgoMin: 360,  pickupFromMin: -20, pickupToMin: 120, goodTillAfterMin: 2880 },
  { id: 'l18', storeId: 's9',  name: 'Chole bhature (2 plates)',       category: 'meals',   veg: true,  mrp: 240, price: 120, qty: 5,  qtyLeft: 5, kgPerUnit: 0.45, allergens: ['gluten', 'dairy'],         desc: 'Spicy Pindi chole with two fluffy bhature each, pickled onions and achaar.', cookedAgoMin: 60,   pickupFromMin: 15,  pickupToMin: 175, goodTillAfterMin: 240 },
  { id: 'l19', storeId: 's10', name: 'Chicken pesto sandwich',         category: 'cafe',    veg: false, mrp: 260, price: 120, qty: 6,  qtyLeft: 4, kgPerUnit: 0.3,  allergens: ['gluten', 'dairy', 'nuts'], desc: 'Grilled chicken, basil pesto and mozzarella on toasted focaccia.', cookedAgoMin: 200,  pickupFromMin: -40, pickupToMin: 22,  goodTillAfterMin: 300 },
  { id: 'l20', storeId: 's10', name: 'Penne arrabbiata',               category: 'cafe',    veg: true,  mrp: 320, price: 150, qty: 6,  qtyLeft: 6, kgPerUnit: 0.4,  allergens: ['gluten'],                  desc: 'Penne in a spicy tomato, garlic and chilli sauce. Reheat with a splash of water.', cookedAgoMin: 120,  pickupFromMin: -20, pickupToMin: 160, goodTillAfterMin: 300 },
  { id: 'l21', storeId: 's2',  name: 'Aloo paratha (2) with curd',     category: 'meals',   veg: true,  mrp: 150, price: 70,  qty: 5,  qtyLeft: 5, kgPerUnit: 0.4,  allergens: ['gluten', 'dairy'],         desc: 'Stuffed potato parathas with white butter, curd and pickle.', cookedAgoMin: 100,  pickupFromMin: 30,  pickupToMin: 150, goodTillAfterMin: 300 }
];
