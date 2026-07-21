const mysql = require('mysql2/promise');
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'rootpassword',
  database: process.env.DB_NAME || 'nmo_db',
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
  waitForConnections: true,
  connectionLimit: 5,
});

const CATS = [
  { slug: 'electronics', type: 'product', listing_type: 'sell' },
  { slug: 'fashion', type: 'product', listing_type: 'sell' },
  { slug: 'furniture', type: 'product', listing_type: 'sell' },
  { slug: 'beauty-health', type: 'product', listing_type: 'sell' },
  { slug: 'books', type: 'product', listing_type: 'sell' },
  { slug: 'handcraft', type: 'product', listing_type: 'sell' },
  { slug: 'houses-apartments', type: 'rental_property', listing_type: 'rent' },
  { slug: 'offices', type: 'rental_property', listing_type: 'rent' },
  { slug: 'cars', type: 'rental_vehicle', listing_type: 'sell' },
  { slug: 'motorcycles', type: 'rental_vehicle', listing_type: 'sell' },
  { slug: 'transport-services', type: 'service', listing_type: 'sell' },
  { slug: 'technician-services', type: 'service', listing_type: 'sell' },
  { slug: 'mechanical-services', type: 'service', listing_type: 'sell' },
  { slug: 'gardening-services', type: 'service', listing_type: 'sell' },
  { slug: 'arts-tourism', type: 'service', listing_type: 'sell' },
  { slug: 'jobs-abasare', type: 'service', listing_type: 'sell' },
  { slug: 'food-beverage', type: 'product', listing_type: 'sell' },
  { slug: 'clothing', type: 'product', listing_type: 'sell' },
  { slug: 'construction', type: 'service', listing_type: 'sell' },
  { slug: 'health', type: 'service', listing_type: 'sell' },
  { slug: 'education', type: 'service', listing_type: 'sell' },
  { slug: 'farmer-product', type: 'product', listing_type: 'sell' },
  { slug: 'supply-chain', type: 'service', listing_type: 'sell' },
  // rental versions of the 7 new categories
  { slug: 'food-beverage', type: 'product', listing_type: 'rent' },
  { slug: 'clothing', type: 'product', listing_type: 'rent' },
  { slug: 'construction', type: 'service', listing_type: 'rent' },
  { slug: 'health', type: 'service', listing_type: 'rent' },
  { slug: 'education', type: 'service', listing_type: 'rent' },
  { slug: 'farmer-product', type: 'product', listing_type: 'rent' },
  { slug: 'supply-chain', type: 'service', listing_type: 'rent' },
];

const LOCS = ['Kigali','Kicukiro','Remera','Nyarutarama','Kimironko','Gisozi','Kacyiru','Kanombe','Niboye','Gikondo','Nyamirambo','Kimihurura','Butare','Muhanga','Rubavu','Musanze','Rusizi','Nyagatare'];

const PRICE_RANGES = {
  'electronics': [15000, 2500000],
  'fashion': [5000, 800000],
  'furniture': [20000, 1500000],
  'beauty-health': [3000, 200000],
  'books': [2000, 80000],
  'handcraft': [5000, 150000],
  'houses-apartments': [100000, 5000000],
  'offices': [50000, 3000000],
  'cars': [3000000, 60000000],
  'motorcycles': [300000, 5000000],
  'transport-services': [5000, 500000],
  'technician-services': [5000, 300000],
  'mechanical-services': [5000, 200000],
  'gardening-services': [3000, 100000],
  'arts-tourism': [10000, 500000],
  'jobs-abasare': [50000, 1000000],
  'food-beverage': [1000, 50000],
  'clothing': [3000, 150000],
  'construction': [50000, 5000000],
  'health': [5000, 300000],
  'education': [10000, 500000],
  'farmer-product': [2000, 200000],
  'supply-chain': [50000, 2000000],
};

const RENT_PRICE_RANGES = {
  'food-beverage': [5000, 150000],
  'clothing': [15000, 250000],
  'construction': [100000, 1000000],
  'health': [15000, 200000],
  'education': [50000, 500000],
  'farmer-product': [50000, 500000],
  'supply-chain': [100000, 800000],
};

const TITLE_PREFIXES = {
  'electronics': ['Premium','Latest','High-End','Professional','Top Quality','Brand New','Original','Genuine'],
  'fashion': ['Designer','Luxury','Premium','Classic','Elegant','Trendy','Vintage','Stylish'],
  'furniture': ['Modern','Solid','Luxury','Handcrafted','Contemporary','Classic','Elegant','Comfortable'],
  'beauty-health': ['Professional','Organic','Premium','Natural','Luxury','Essential','Pro-Grade','Clinical'],
  'books': ['Bestseller','Award-Winning','Classic','New','Collector','Signed','Hardcover','Illustrated'],
  'handcraft': ['Handwoven','Traditional','Authentic','Artisan','Handmade','Unique','Cultural','Decorative'],
  'houses-apartments': ['Luxury','Spacious','Modern','Cozy','Stunning','Beautiful','Newly Built','Fully Furnished'],
  'offices': ['Modern','Executive','Professional','Spacious','Prime','Premium','Well-Equipped','Central'],
  'cars': ['2023','2022','2021','2020','2019','Latest Model','Brand New','Well-Maintained'],
  'motorcycles': ['2023','2022','Brand New','Latest','Well-Maintained','Sport','Cruiser','Electric'],
  'transport-services': ['Professional','Reliable','Express','Premium','Same-Day','24/7','Fast','Safe'],
  'technician-services': ['Professional','Expert','Certified','Same-Day','Emergency','24/7','Reliable','Fast'],
  'mechanical-services': ['Professional','Expert','Certified','Express','Same-Day','Full','Complete','Emergency'],
  'gardening-services': ['Professional','Expert','Complete','Seasonal','Full-Service','Premium','Eco-Friendly','Regular'],
  'arts-tourism': ['Guided','Exclusive','Premium','Cultural','Adventure','Luxury','Scenic','Weekend'],
  'jobs-abasare': ['Urgent','Full-Time','Part-Time','Experienced','Senior','Junior','Entry-Level','Skilled'],
  'food-beverage': ['Fresh','Organic','Premium','Natural','Artisan','Homemade','Imported','Local'],
  'clothing': ['Designer','Premium','Casual','Formal','Trendy','Classic','Sport','Luxury'],
  'construction': ['Professional','Heavy-Duty','Industrial','Premium','Certified','Quality','Durable','Safety'],
  'health': ['Medical-Grade','Clinical','Premium','Professional','Therapeutic','Wellness','Pharmaceutical','Certified'],
  'education': ['Professional','Expert','Certified','Comprehensive','Intensive','Beginner','Advanced','Online'],
  'farmer-product': ['Fresh','Organic','Premium','Natural','Farm-Fresh','Locally-Grown','Seasonal','High-Grade'],
  'supply-chain': ['Bulk','Wholesale','Industrial','Commercial','Logistics','Supply','Distribution','Freight'],
};

const RENT_PREFIXES = {
  'food-beverage': ['Rent','Hire','Weekly','Monthly','Event','Short-Term','Long-Term','Catering'],
  'clothing': ['Rent','Hire','Formal','Wedding','Party','Traditional','Occasion','Designer'],
  'construction': ['Rent','Short-Term','Long-Term','Project','Job-Site','Industrial','Heavy-Duty','Commercial'],
  'health': ['Rent','Short-Term','Long-Term','Recovery','Mobility','Home Care','Medical','Therapeutic'],
  'education': ['Rent','Semester','Short-Term','Academic','Classroom','Training','Workshop','Study'],
  'farmer-product': ['Rent','Seasonal','Short-Term','Long-Term','Agricultural','Farm','Harvest','Field'],
  'supply-chain': ['Rent','Short-Term','Long-Term','Industrial','Warehouse','Logistics','Commercial','Bulk'],
};

const RENT_BASES = {
  'food-beverage': ['Juice Machine','Coffee Maker','Catering Equipment','Cooler Box','Popcorn Machine','Ice Maker','Food Warmer','Beverage Dispenser','BBQ Grill','Party Tent','Chafing Dish','Glass Set','Blender','Mixer Stand','Deep Fryer','Hot Plate','Steamer','Dinner Set','Cutlery Pack','Serving Tray'],
  'clothing': ['Wedding Gown','Tuxedo Suit','Traditional Outfit','Bridesmaid Dress','Evening Gown','Cultural Attire','Graduation Gown','Costume Set','Suit Jacket','Kaftan Royal','Party Dress','Office Wear','Dance Costume','Corset Top','Boubou Gown','Kente Stole','Agbada Set','Uniform Set','Gown Evening','Waistcoat'],
  'construction': ['Concrete Mixer','Scaffolding Set','Power Trowel','Jack Hammer','Plate Compactor','Dump Truck','Excavator','Bulldozer','Crane Mobile','Forklift','Welding Machine','Generator','Air Compressor','Vibrator','Water Pump','Compaction Roller','Trencher','Chainsaw','Drill Hammer','Grinder Floor'],
  'health': ['Wheelchair','Hospital Bed','Crutch Pair','Walker Rollator','Oxygen Concentrator','Nebulizer','Patient Lift','Commode Chair','Shower Chair','Walking Cane','Suction Machine','CPAP Machine','Infusion Pump','Mattress Foam','Knee Scooter','Bedside Table','IV Stand','Pillow Wedge','Transfer Board','Trapeze Bar'],
  'education': ['Textbook Set','Lab Equipment Kit','Projector HD','Microscope Set','Laptop Bundle','Whiteboard Mobile','Calculator Set','Science Kit','Camera Tripod','Audio PA System','Desk Chair','Tablet Set','Printer Bundle','Smartboard Interactive','Microphone Set','Speaker Pair','Study Carrel','Easel Stand','Map Set','Globe Digital'],
  'farmer-product': ['Tractor','Disc Plow','Irrigation Pump','Sprayer Boom','Harvester','Cultivator','Milking Machine','Egg Incubator','Feed Grinder','Water Tank 500L','Fence Kit','Chicken Coop','Greenhouse Kit','Crop Dryer','Silo Bag','Chaff Cutter','Hay Baler','Generator Farm','Water Pump Diesel','Chipper Machine'],
  'supply-chain': ['Forklift Electric','Pallet Jack','Warehouse Space','Cargo Van','Shipping Container','Conveyor Belt','Stretch Wrapper','Dock Leveler','Reach Truck','Order Picker','Hand Truck','Platform Scale','Boom Lift','Scissor Lift','Racking System','Dolly Heavy Duty','Crate Plastic','Roll Cage','Loading Ramp','Sorting Table'],
};

const TITLE_BASES = {
  'electronics': ['iPhone 15 Pro Max','Samsung Galaxy S24','MacBook Pro M3','Sony WH-1000XM5','Dell XPS 15','iPad Pro 12.9','LG OLED TV','Canon EOS R6','Apple Watch S9','JBL Speaker','Samsung Monitor','Nintendo Switch','Bose Earbuds','HP Printer','GoPro Hero 12','PS5 Console','Xbox Series X','DJI Mini 4 Pro','Logitech Mouse','Anker Power Bank','Galaxy Tab S9','ASUS ROG Laptop','AirPods Pro 2','Sony A7 IV Camera','Samsung QLED TV'],
  'fashion': ['Silk Evening Gown','Leather Handbag','Designer Belt','Nike Air Max 270','Ralph Lauren Shirt','Necklace Set','Armani Suit','Ultraboost 23','Ray-Ban Sunglasses','Watch Collection','501 Classic Jeans','Silk Scarf','Trench Coat','Designer Sneakers','Nylon Backpack','Polo Shirt Set','Tailored Blazer','Midi Dress','Designer Bag','Leather Jacket'],
  'food-beverage': ['Fresh Maize Flour','Organic Honey Jar','Artisan Bread Loaf','Coffee Beans Pack','Milk Fresh Farm','Fruit Juice Mix','Groundnut Paste','Cassava Flour','Tea Leaves Premium','Vegetable Oil','Rice Local Grown','Sorghum Flour','Beans Mixed Pack','Fresh Tomatoes','Onions Sack','Irish Potatoes','Sweet Potatoes','Yams Fresh','Pineapple Fresh','Mangoes Ripe'],
  'clothing': ['Ankara Dress','Dashiki Shirt','Kente Scarf','Traditional Gown','Boubou Outfit','Suit Custom Tailored','African Print Shirt','Kaftan Robe','Wedding Gown','Children Set','School Uniform','Office Blazer','Polo Shirt','Denim Jeans','T-Shirt Cotton','Blouse Top','Skirt Pencil','Chiffon Dress','Jumpsuit Elegant','Cardigan Knit'],
  'construction': ['Cement 50kg Bag','Steel Rebars','Roofing Sheets','Red Bricks','PVC Pipes','Electrical Wires','Paint Bucket 20L','Tiles Ceramic','Plumbing Fittings','Door Panel Wood','Window Frame Aluminium','Floor Tiles','Gravel Aggregate','Sand Truck Load','Concrete Mixer','Scaffolding Set','Safety Helmet','Tool Box Kit','Wheelbarrow','Ladder Extension'],
  'health': ['Blood Pressure Monitor','First Aid Kit','Surgical Mask Box','Thermometer Digital','Glucose Test Strips','Vitamin C Supplement','Pain Relief Gel','Antiseptic Solution','Bandage Roll','Stethoscope','Nebulizer Machine','Crutch Pair','Wheelchair','Oxygen Concentrator','Dental Care Kit','Eye Drops','Allergy Medicine','Multivitamin Pack','Protein Powder','Hand Sanitizer'],
  'education': ['Mathematics Textbook','Science Lab Kit','French Course Book','English Grammar Guide','Story Book Set','Children Dictionary','Map of Rwanda Globe','Physics Experiment Kit','Chemistry Set','Biology Charts','Computer Programming Book','Business Studies','History Text','Accounting Guide','Art Supplies Kit','Musical Instrument Set','Online Course Access','Exam Prep Pack','Stationery Bundle','Whiteboard Set'],
  'farmer-product': ['Fresh Tomatoes','Organic Onions','Irish Potatoes Bag','Cassava Bundle','Sweet Potatoes','Beans Grade A','Maize Grain Sack','Rice Paddy','Fresh Milk 5L','Banana Bunch','Cabbage Fresh','Sukuma Wiki','Eggs Tray 30','Fresh Chicken','Goat Young','Cow Calf','Piglets Pair','Honey Pure','Mushroom Kit','Coffee Cherry'],
  'supply-chain': ['Pallet Jack Manual','Warehouse Shelving','Shipping Container','Forklift Battery','Cargo Straps','Packing Boxes Bulk','Plastic Pallets','Stretch Wrap Roll','Label Printer','Barcode Scanner','Weight Scale','Conveyor Belt','Sorting Trolley','Safety Vest','Hard Hat Pack','Logistics Software','GPS Tracker','Truck Tarp','Loading Ramp','Chain Hoist']
};

function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

function pick(arr) { return arr[rand(0, arr.length - 1)]; }

function makeDesc(slug, title) {
  const lines = {
    'houses-apartments': 'Beautiful property in a prime location. Spacious rooms, modern finishes, ample parking, 24/7 security. Close to schools, hospitals, and shopping centers. Ideal for families or professionals.',
    'cars': 'Well-maintained vehicle with full service history. Clean interior and exterior. Fuel-efficient and reliable. Perfect for daily commute or long distance travel. Available for inspection.',
    'motorcycles': 'Excellent condition motorcycle. Well maintained, low mileage, fuel efficient. Ideal for city commuting. All documents ready for transfer.',
    'food-beverage': 'Fresh and high quality food product. Sourced locally, handled with care. Perfect for household or commercial use. Best before date clearly marked.',
    'clothing': 'High quality garment, comfortable fit and stylish design. Available in various sizes. Perfect for casual and formal occasions.',
    'construction': 'Top quality construction material. Meets industry standards. Suitable for residential and commercial projects. Bulk pricing available.',
    'health': 'Certified health and medical product. Sterile packaging, genuine item. Essential for healthcare facilities and home use.',
    'education': 'Comprehensive educational resource. Suitable for students and professionals. Well-organized content with practical exercises.',
    'farmer-product': 'Farm-fresh produce straight from the field. Naturally grown, no chemicals. Harvested at peak ripeness for best quality.',
    'supply-chain': 'Commercial grade supply chain equipment. Durable and reliable. Ideal for warehouses, logistics centers, and industrial use.',
  };
  return lines[slug] || 'High quality item in excellent condition. Genuine product with fair pricing. Available for viewing and inspection. Contact for more details.';
}

async function main() {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    let [[seller]] = await conn.query("SELECT id, coins FROM users WHERE role = 'seller' LIMIT 1");
    if (!seller) {
      const bcrypt = require('bcryptjs');
      const hash = await bcrypt.hash('seller123', 10);
      const [r] = await conn.query("INSERT INTO users (name, email, phone, password_hash, coins, role, is_verified) VALUES ('Demo Seller','seller@demo.com','+250788100100',?,1000000,'seller',1)", [hash]);
      seller = { id: r.insertId };
    } else {
      await conn.query('UPDATE users SET coins = 1000000 WHERE id = ?', [seller.id]);
    }
    console.log('Using seller ID:', seller.id);

    const [catRows] = await conn.query('SELECT id, slug FROM categories');
    const catMap = {};
    catRows.forEach(c => { catMap[c.slug] = c.id; });

    let totalListings = 0;
    let totalImages = 0;

    for (const cat of CATS) {
      const catId = catMap[cat.slug];
      if (!catId) { console.log('  Skipping', cat.slug, '- no category ID'); continue; }
      console.log('Seeding', cat.slug, '...');

      const isRent = cat.listing_type === 'rent';
      const prefixes = isRent ? (RENT_PREFIXES[cat.slug] || ['Rent']) : (TITLE_PREFIXES[cat.slug] || ['Premium']);
      const bases = isRent ? (RENT_BASES[cat.slug] || [cat.slug.replace('-',' ') + ' Rental']) : (TITLE_BASES[cat.slug] || [cat.slug.replace('-',' ')]);
      const [priceMin, priceMax] = isRent ? (RENT_PRICE_RANGES[cat.slug] || [5000, 100000]) : (PRICE_RANGES[cat.slug] || [10000, 100000]);
      const count = 50;

      for (let i = 0; i < count; i++) {
        const title = pick(prefixes) + ' ' + pick(bases) + ' #' + (i + 1);
        const price = rand(priceMin, priceMax);
        const location = pick(LOCS);
        const priceType = (cat.type === 'rental_property' || cat.listing_type === 'rent') ? pick(['per_month','per_day']) : 'fixed';
        const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ');
        const listingType = cat.listing_type;
        const featured = i < 3 ? 1 : 0;

        const [lr] = await conn.query(
          'INSERT INTO listings (user_id, category_id, title, description, price, price_type, location, listing_type, is_featured, expires_at, status, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,NOW())',
          [seller.id, catId, title, makeDesc(cat.slug, title), price, priceType, location, listingType, featured, expiresAt, 'active']
        );
        totalListings++;
        const lid = lr.insertId;

        const imgCount = rand(3, 6);
        for (let j = 0; j < imgCount; j++) {
          const seed = 'nmo-' + cat.slug + '-' + lid + '-' + j;
          const imgUrl = 'https://picsum.photos/seed/' + seed + '/800/600';
          await conn.query(
            'INSERT INTO listing_images (listing_id, image_url, is_primary) VALUES (?,?,?)',
            [lid, imgUrl, j === 0 ? 1 : 0]
          );
          totalImages++;
        }
      }
    }

    // auction listings (50 distributed across categories)
    console.log('Seeding auction listings ...');
    const auctionSlugs = Object.keys(catMap).filter(s => s !== 'houses-apartments' && s !== 'offices');
    const auctionPrefixes = ['Live Auction','Reserve','Rare','Collector','No Reserve','Premium','High-End','Exclusive'];
    const auctionBases = ['Antique Vase','Diamond Ring','Gold Watch','Art Collection','Vintage Car','Rare Book','Designer Bag','Collector Wine','Bronze Sculpture','Persian Rug','Crystal Chandelier','Limited Print','Coin Collection','Vintage Guitar','Signed Jersey','First Edition','Luxury Yacht','Diamond Necklace','Classic Camera','Retro Bicycle'];
    for (let i = 0; i < 50; i++) {
      const slug = pick(auctionSlugs);
      const catId = catMap[slug];
      if (!catId) continue;
      const title = pick(auctionPrefixes) + ' ' + pick(auctionBases) + ' #' + (i + 1);
      const price = rand(50000, 10000000);
      const location = pick(LOCS);
      const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ');
      const [lr] = await conn.query(
        'INSERT INTO listings (user_id, category_id, title, description, price, price_type, location, listing_type, is_featured, expires_at, status, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,NOW())',
        [seller.id, catId, title, 'Premium item available at auction. Place your bid now. Auction ends in 14 days. Highest bidder wins.', price, 'fixed', location, 'auction', 0, expiresAt, 'active']
      );
      totalListings++;
      const lid = lr.insertId;
      const imgCount = rand(4, 7);
      for (let j = 0; j < imgCount; j++) {
        await conn.query(
          'INSERT INTO listing_images (listing_id, image_url, is_primary) VALUES (?,?,?)',
          [lid, 'https://picsum.photos/seed/auction-' + lid + '-' + j + '/800/600', j === 0 ? 1 : 0]
        );
        totalImages++;
      }
    }

    await conn.commit();
    console.log('Done! Inserted', totalListings, 'listings and', totalImages, 'images.');
  } catch (err) {
    await conn.rollback();
    console.error('Error:', err);
  } finally {
    conn.release();
    await pool.end();
  }
}

main();
