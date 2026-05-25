(function () {
  window.TS_DEFAULT_SETTINGS = {
    storeName: "TS Top Shoes",
    instagram: "https://www.instagram.com/tstop_shoes/",
    whatsapp: "",
    shippingText: "Entregamos em Ijui e regiao e enviamos para todo Brasil.",
    adminUser: "admin",
    adminPassword: "topshoes2026"
  };

  window.TS_DEFAULT_BRANDS = ["Adidas", "Mizuno", "New Balance", "Nike"];
  window.TS_DEFAULT_CATEGORIES = ["Casual", "Corrida", "Performance"];
  window.TS_DEFAULT_CUSTOMERS = [];
  window.TS_DEFAULT_PASSWORD_REQUESTS = [];
  window.TS_BRAZIL_STATES = [
    ["AC", "Acre"], ["AL", "Alagoas"], ["AP", "Amapa"], ["AM", "Amazonas"],
    ["BA", "Bahia"], ["CE", "Ceara"], ["DF", "Distrito Federal"], ["ES", "Espirito Santo"],
    ["GO", "Goias"], ["MA", "Maranhao"], ["MT", "Mato Grosso"], ["MS", "Mato Grosso do Sul"],
    ["MG", "Minas Gerais"], ["PA", "Para"], ["PB", "Paraiba"], ["PR", "Parana"],
    ["PE", "Pernambuco"], ["PI", "Piaui"], ["RJ", "Rio de Janeiro"], ["RN", "Rio Grande do Norte"],
    ["RS", "Rio Grande do Sul"], ["RO", "Rondonia"], ["RR", "Roraima"], ["SC", "Santa Catarina"],
    ["SP", "Sao Paulo"], ["SE", "Sergipe"], ["TO", "Tocantins"]
  ];

  window.TS_DEFAULT_PRODUCTS = [
    {
      id: "new-balance-9060",
      name: "New Balance 9060",
      brand: "New Balance",
      category: "Casual",
      price: null,
      sizes: ["34", "35", "36", "37", "38", "39"],
      image: "assets/products/instagram-product-3.jpg",
      description: "Modelo 9060 em tons claros e vinho, divulgado no catalogo da loja.",
      featured: true,
      active: true
    },
    {
      id: "mizuno-pro-12-refletivo",
      name: "Mizuno Pro 12 Refletivo Premium",
      brand: "Mizuno",
      category: "Performance",
      price: null,
      sizes: ["42", "43"],
      image: "assets/products/instagram-product-2.jpg",
      description: "Linha premium refletiva em branco, com solado de amortecimento.",
      featured: true,
      active: true
    },
    {
      id: "adidas-running",
      name: "Adidas Running Premium",
      brand: "Adidas",
      category: "Corrida",
      price: null,
      sizes: ["38", "39", "40", "41", "42", "43"],
      image: "assets/products/instagram-product-4.webp",
      description: "Tenis para corrida e caminhada, com cabedal respiravel e solado macio.",
      featured: false,
      active: true
    },
    {
      id: "nike-tn-vapor-max",
      name: "Nike TN Vapor Max",
      brand: "Nike",
      category: "Casual",
      price: null,
      sizes: ["38", "39", "40", "41", "42", "43"],
      image: "assets/products/instagram-product-5.webp",
      description: "Modelo preto com visual urbano e conforto para o dia a dia.",
      featured: true,
      active: true
    },
    {
      id: "adidas-adizero",
      name: "Adidas Adizero",
      brand: "Adidas",
      category: "Corrida",
      price: null,
      sizes: ["34", "35", "36", "37", "38", "39"],
      image: "assets/products/instagram-product-6.webp",
      description: "Leve e indicada para corrida e caminhada, em azul marinho e rosa.",
      featured: false,
      active: true
    },
    {
      id: "mizuno-refletivo-camaleao",
      name: "Mizuno Refletivo Camaleao",
      brand: "Mizuno",
      category: "Performance",
      price: null,
      sizes: ["38", "39", "40", "41", "42", "43"],
      image: "assets/products/instagram-product-7.jpg",
      description: "Linha premium com acabamento refletivo, conforme divulgado no Instagram.",
      featured: false,
      active: true
    }
  ];
}());
