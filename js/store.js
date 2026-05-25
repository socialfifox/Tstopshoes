(function () {
  var keys = {
    products: "ts-products",
    cart: "ts-cart",
    orders: "ts-orders",
    settings: "ts-settings",
    session: "ts-admin-session",
    brands: "ts-brands",
    categories: "ts-categories",
    customers: "ts-customers",
    customerSession: "ts-customer-session",
    passwordRequests: "ts-password-requests"
  };

  function copy(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function read(key, fallback) {
    var saved = localStorage.getItem(key);
    if (!saved) {
      localStorage.setItem(key, JSON.stringify(fallback));
      return copy(fallback);
    }
    try {
      return JSON.parse(saved);
    } catch (error) {
      localStorage.setItem(key, JSON.stringify(fallback));
      return copy(fallback);
    }
  }

  function write(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
    return value;
  }

  function uid(prefix) {
    return prefix + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 7).toUpperCase();
  }

  function money(value) {
    if (value === null || value === "" || typeof value === "undefined") {
      return "Consulte";
    }
    return Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  function getProducts() {
    return read(keys.products, window.TS_DEFAULT_PRODUCTS).map(function (product) {
      product.categories = product.categories || (product.category ? [product.category] : []);
      product.category = product.categories[0] || "";
      return product;
    });
  }

  function saveProducts(products) {
    products.forEach(function (product) {
      product.categories = product.categories || (product.category ? [product.category] : []);
      product.category = product.categories[0] || "";
    });
    return write(keys.products, products);
  }

  function getCart() {
    return read(keys.cart, []);
  }

  function saveCart(cart) {
    return write(keys.cart, cart);
  }

  function getOrders() {
    return read(keys.orders, []);
  }

  function saveOrders(orders) {
    return write(keys.orders, orders);
  }

  function saveOrder(order) {
    var orders = getOrders();
    var index = orders.findIndex(function (item) { return item.id === order.id; });
    if (index !== -1) orders[index] = order;
    saveOrders(orders);
    return order;
  }

  function getBrands() {
    return read(keys.brands, window.TS_DEFAULT_BRANDS);
  }

  function saveBrands(brands) {
    return write(keys.brands, brands);
  }

  function getCategories() {
    return read(keys.categories, window.TS_DEFAULT_CATEGORIES);
  }

  function saveCategories(categories) {
    return write(keys.categories, categories);
  }

  function getCustomers() {
    return read(keys.customers, window.TS_DEFAULT_CUSTOMERS).map(function (customer) {
      customer.addresses = customer.addresses || [];
      return customer;
    });
  }

  function saveCustomers(customers) {
    return write(keys.customers, customers);
  }

  function saveCustomer(customer) {
    customer.addresses = customer.addresses || [];
    var customers = getCustomers();
    var index = customers.findIndex(function (item) { return item.id === customer.id; });
    if (index === -1) customers.unshift(customer); else customers[index] = customer;
    saveCustomers(customers);
    return customer;
  }

  function currentCustomer() {
    var id = sessionStorage.getItem(keys.customerSession);
    return getCustomers().find(function (customer) { return customer.id === id && customer.active !== false; }) || null;
  }

  function addCustomerAddress(customer, fields) {
    var address = {
      id: fields.id || uid("END"),
      label: fields.label.trim(),
      street: fields.street.trim(),
      number: fields.number.trim(),
      complement: fields.complement.trim(),
      neighborhood: fields.neighborhood.trim(),
      zip: fields.zip.trim(),
      city: fields.city.trim(),
      state: fields.state.trim().toUpperCase()
    };
    customer.addresses = customer.addresses || [];
    var index = customer.addresses.findIndex(function (item) { return item.id === address.id; });
    if (index === -1) customer.addresses.push(address); else customer.addresses[index] = address;
    saveCustomer(customer);
    return address;
  }

  function getSettings() {
    var settings = read(keys.settings, window.TS_DEFAULT_SETTINGS);
    return Object.assign({}, window.TS_DEFAULT_SETTINGS, settings);
  }

  function saveSettings(settings) {
    return write(keys.settings, settings);
  }

  function getPasswordRequests() {
    return read(keys.passwordRequests, window.TS_DEFAULT_PASSWORD_REQUESTS);
  }

  function savePasswordRequests(requests) {
    return write(keys.passwordRequests, requests);
  }

  function createOrder(customer, cart) {
    var orders = getOrders();
    var order = {
      id: uid("TS"),
      date: new Date().toISOString(),
      customer: customer,
      items: cart,
      status: "Novo"
    };
    orders.unshift(order);
    saveOrders(orders);
    return order;
  }

  function orderTotal(items) {
    var allPriced = items.length && items.every(function (item) { return item.price !== null && item.price !== ""; });
    if (!allPriced) return null;
    return items.reduce(function (total, item) { return total + Number(item.price) * item.quantity; }, 0);
  }

  window.TSStore = {
    money: money,
    getProducts: getProducts,
    saveProducts: saveProducts,
    getCart: getCart,
    saveCart: saveCart,
    getOrders: getOrders,
    saveOrders: saveOrders,
    saveOrder: saveOrder,
    getBrands: getBrands,
    saveBrands: saveBrands,
    getCategories: getCategories,
    saveCategories: saveCategories,
    getCustomers: getCustomers,
    saveCustomers: saveCustomers,
    saveCustomer: saveCustomer,
    addCustomerAddress: addCustomerAddress,
    getSettings: getSettings,
    saveSettings: saveSettings,
    getPasswordRequests: getPasswordRequests,
    savePasswordRequests: savePasswordRequests,
    resetAdminAccess: function () {
      var settings = getSettings();
      settings.adminUser = window.TS_DEFAULT_SETTINGS.adminUser;
      settings.adminPassword = window.TS_DEFAULT_SETTINGS.adminPassword;
      saveSettings(settings);
      sessionStorage.removeItem(keys.session);
    },
    createOrder: createOrder,
    orderTotal: orderTotal,
    setSession: function (active) { sessionStorage.setItem(keys.session, active ? "1" : "0"); },
    hasSession: function () { return sessionStorage.getItem(keys.session) === "1"; },
    createCustomer: function (fields) {
      var customers = getCustomers();
      var login = fields.login.trim().toLowerCase();
      if (customers.some(function (customer) { return customer.login.toLowerCase() === login; })) {
        return { error: "Este login ja esta cadastrado." };
      }
      var customer = {
        id: uid("CLI"),
        name: fields.name.trim(),
        login: login,
        password: fields.password,
        phone: fields.phone.trim(),
        addresses: [],
        active: true,
        createdAt: new Date().toISOString()
      };
      customers.unshift(customer);
      saveCustomers(customers);
      return { customer: customer };
    },
    authenticateCustomer: function (login, password) {
      var user = login.trim().toLowerCase();
      return getCustomers().find(function (customer) {
        return customer.login.toLowerCase() === user && customer.password === password && customer.active !== false;
      }) || null;
    },
    requestPasswordReset: function (identifier) {
      var value = identifier.trim().toLowerCase();
      var phone = value.replace(/\D/g, "");
      var customer = getCustomers().find(function (item) {
        return item.active !== false && !item.deletedAt &&
          (item.login.toLowerCase() === value || (phone && item.phone.replace(/\D/g, "") === phone));
      });
      if (!customer) return { error: "Nenhuma conta foi localizada com o dado informado." };
      var requests = getPasswordRequests();
      var pending = requests.find(function (item) { return item.customerId === customer.id && item.status === "Pendente"; });
      if (pending) return { request: pending };
      var request = { id: uid("SUP"), customerId: customer.id, customerName: customer.name, identifier: identifier.trim(), date: new Date().toISOString(), status: "Pendente" };
      requests.unshift(request);
      savePasswordRequests(requests);
      return { request: request };
    },
    resolvePasswordReset: function (requestId, password) {
      var requests = getPasswordRequests();
      var request = requests.find(function (item) { return item.id === requestId; });
      if (!request) return false;
      var customer = getCustomers().find(function (item) { return item.id === request.customerId; });
      if (!customer) return false;
      customer.password = password;
      saveCustomer(customer);
      request.status = "Resolvido";
      request.resolvedAt = new Date().toISOString();
      savePasswordRequests(requests);
      return true;
    },
    setCustomerSession: function (customer) {
      if (customer) sessionStorage.setItem(keys.customerSession, customer.id);
      else sessionStorage.removeItem(keys.customerSession);
    },
    currentCustomer: currentCustomer
  };
}());
