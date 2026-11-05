export const sampleCategories = [
  { id: "home", name: "Home", slug: "home", description: "Thoughtful home essentials." },
  { id: "accessories", name: "Accessories", slug: "accessories", description: "Everyday accessories." },
  { id: "beauty", name: "Beauty", slug: "beauty", description: "Considered daily rituals." },
];

export const sampleProducts = [
  {
    id: "sample-vase", category: sampleCategories[0], name: "The Everyday Ceramic Vase",
    slug: "the-everyday-ceramic-vase", description: "A sculptural stoneware vase with a soft matte glaze, made for fresh stems or a quiet shelf.",
    price: "42.00", image_url: "https://images.unsplash.com/photo-1578500494198-246f612d3b3d?auto=format&fit=crop&w=900&q=85",
    rating: "4.9", stock: 25, featured: true,
  },
  {
    id: "sample-tote", category: sampleCategories[1], name: "Canvas Weekend Tote",
    slug: "canvas-weekend-tote", description: "A sturdy, roomy carryall in heavyweight cotton canvas. Built for market mornings and long weekends.",
    price: "36.00", image_url: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=900&q=85",
    rating: "4.8", stock: 25, featured: true,
  },
  {
    id: "sample-throw", category: sampleCategories[0], name: "Soft Knit Throw",
    slug: "soft-knit-throw", description: "A generous, brushed-cotton throw in a calming natural weave. Your new favorite layer for the sofa.",
    price: "68.00", image_url: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=900&q=85",
    rating: "4.9", stock: 25, featured: true,
  },
  {
    id: "sample-wash", category: sampleCategories[2], name: "Botanical Hand Wash",
    slug: "botanical-hand-wash", description: "A gentle, plant-derived cleanser with a bright citrus and cedarwood scent. Refillable glass bottle.",
    price: "24.00", image_url: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=900&q=85",
    rating: "4.7", stock: 25, featured: false,
  },
  {
    id: "sample-wallet", category: sampleCategories[1], name: "Everyday Leather Wallet",
    slug: "everyday-leather-wallet", description: "Minimal, responsibly sourced leather with space for the essentials and a little room to grow.",
    price: "54.00", image_url: "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=900&q=85",
    rating: "4.8", stock: 25, featured: false,
  },
  {
    id: "sample-mug", category: sampleCategories[0], name: "Sunday Morning Mug",
    slug: "sunday-morning-mug", description: "A hand-finished ceramic mug that feels good to hold. Each one has its own subtle character.",
    price: "28.00", image_url: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=900&q=85",
    rating: "5.0", stock: 25, featured: false,
  },
  {
    id: "sample-oil", category: sampleCategories[2], name: "Daily Ritual Face Oil",
    slug: "daily-ritual-face-oil", description: "A lightweight blend of nourishing botanicals for a simple, replenishing evening routine.",
    price: "32.00", image_url: "https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?auto=format&fit=crop&w=900&q=85",
    rating: "4.7", stock: 25, featured: false,
  },
  {
    id: "sample-earrings", category: sampleCategories[1], name: "Sculpted Brass Earrings",
    slug: "sculpted-brass-earrings", description: "Lightweight, sculptural hoops with a warm brushed finish. Designed to wear from day to night.",
    price: "48.00", image_url: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=900&q=85",
    rating: "4.9", stock: 25, featured: false,
  },
];
