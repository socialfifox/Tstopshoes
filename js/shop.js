(function () {
  var state = { category: "Todos", search: "" };
  var grid = document.getElementById("product-grid");
  var filters = document.getElementById("category-filters");
  var cartDrawer = document.getElementById("cart-drawer");
  var overlay = document.getElementById("drawer-overlay");
  var productDialog = document.getElementById("product-dialog");
  var checkoutDialog = document.getElementById("checkout-dialog");
  var successDialog = document.getElementById("success-dialog");
  var accountDialog = document.getElementById("account-dialog");
  var accountOrderDialog = document.getElementById("account-order-dialog");
  var passwordResetDialog = document.getElementById("password-reset-dialog");
  var customerAuth = document.getElementById("customer-auth");
  var customerSigned = document.getElementById("customer-signed");
  var checkoutForm = document.getElementById("checkout-form");
  var accountForm = document.getElementById("account-form");

  function escapeHtml(text) {
    return String(text || "").replace(/[&<>"']/g, function (char) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char];
    });
  }

  function setAlert(id, message, type) {
    var alert = document.getElementById(id);
    alert.textContent = message || "";
    alert.className = "modal-alert" + (type ? " " + type : "");
    alert.hidden = !message;
  }

  function activeProducts() {
    return TSStore.getProducts().filter(function (product) { return product.active; });
  }

  function productCategories(product) {
    return product.categories || [product.category];
  }

  function populateStateSelects() {
    document.querySelectorAll(".state-select").forEach(function (select) {
      var selected = select.value;
      select.innerHTML = '<option value="">Selecione</option>' + window.TS_BRAZIL_STATES.map(function (state) {
        return '<option value="' + state[0] + '">' + state[0] + " - " + state[1] + "</option>";
      }).join("");
      select.value = selected;
    });
  }

  function renderFilters() {
    var categories = ["Todos"].concat(activeProducts().reduce(function (all, product) {
      return all.concat(productCategories(product));
    }, []).filter(function (item, index, all) {
      return all.indexOf(item) === index;
    }));
    filters.innerHTML = categories.map(function (category) {
      return '<button class="filter-pill ' + (state.category === category ? "active" : "") + '" type="button" data-category="' +
        escapeHtml(category) + '">' + escapeHtml(category) + "</button>";
    }).join("");
  }

  function renderProducts() {
    var query = state.search.toLowerCase();
    var products = activeProducts().filter(function (product) {
      return (state.category === "Todos" || productCategories(product).indexOf(state.category) !== -1) &&
        (product.name + " " + product.brand + " " + productCategories(product).join(" ")).toLowerCase().indexOf(query) !== -1;
    });
    grid.innerHTML = products.length ? products.map(function (product) {
      return '<article class="product-card" tabindex="0" data-product-id="' + escapeHtml(product.id) + '">' +
        '<div class="product-image"><img src="' + escapeHtml(product.image) + '" alt="' + escapeHtml(product.name) + '">' +
        (product.featured ? '<span class="product-tag">Destaque</span>' : "") + "</div>" +
        '<div class="product-info"><p class="product-meta"><span>' + escapeHtml(product.brand) + '</span><span>' +
        escapeHtml(productCategories(product).join(" / ")) + '</span></p><h3>' + escapeHtml(product.name) + '</h3>' +
        '<p class="product-price">' + TSStore.money(product.price) + "</p></div></article>";
    }).join("") : '<p class="empty-state">Nenhum modelo encontrado para esta busca.</p>';
  }

  function openProduct(id) {
    var product = activeProducts().find(function (item) { return item.id === id; });
    if (!product) return;
    document.getElementById("product-detail").innerHTML =
      '<div class="detail-grid"><img src="' + escapeHtml(product.image) + '" alt="' + escapeHtml(product.name) + '">' +
      '<form class="detail-copy"><p class="eyebrow">' + escapeHtml(product.brand) + " | " +
      escapeHtml(productCategories(product).join(" / ")) + '</p><h2>' + escapeHtml(product.name) + '</h2><strong>' +
      TSStore.money(product.price) + '</strong><p class="description">' + escapeHtml(product.description) + '</p>' +
      '<span class="field-label">Escolha o tamanho</span><div class="size-list">' +
      product.sizes.map(function (size, index) {
        return '<label class="size-choice"><input type="radio" name="size" value="' + escapeHtml(size) + '"' +
          (index === 0 ? " checked" : "") + '><span>' + escapeHtml(size) + "</span></label>";
      }).join("") + '</div><input type="hidden" name="productId" value="' + escapeHtml(product.id) + '">' +
      '<button class="button button-primary button-block" type="submit">Adicionar a sacola</button></form></div>';
    productDialog.showModal();
  }

  function renderCart() {
    var cart = TSStore.getCart();
    document.getElementById("cart-count").textContent = cart.reduce(function (total, item) { return total + item.quantity; }, 0);
    document.getElementById("cart-items").innerHTML = cart.length ? cart.map(function (item, index) {
      return '<article class="cart-item"><img src="' + escapeHtml(item.image) + '" alt="">' +
        '<div><h3>' + escapeHtml(item.name) + '</h3><p>Tamanho ' + escapeHtml(item.size) + '<br>' +
        TSStore.money(item.price) + '</p><div class="quantity-controls">' +
        '<button type="button" data-quantity-index="' + index + '" data-change="-1" aria-label="Diminuir quantidade">-</button>' +
        '<span>' + item.quantity + '</span><button type="button" data-quantity-index="' + index +
        '" data-change="1" aria-label="Aumentar quantidade">+</button></div></div>' +
        '<button type="button" class="remove-item" data-remove-index="' + index + '" aria-label="Remover">&times;</button></article>';
    }).join("") : '<p class="empty-state">Sua sacola esta vazia.</p>';
    var total = TSStore.orderTotal(cart);
    document.getElementById("cart-total").textContent = total === null ? "Sob consulta" : TSStore.money(total);
    document.getElementById("begin-checkout").disabled = !cart.length;
  }

  function openCart() {
    renderCart();
    cartDrawer.classList.add("open");
    cartDrawer.setAttribute("aria-hidden", "false");
    overlay.hidden = false;
  }

  function closeCart() {
    cartDrawer.classList.remove("open");
    cartDrawer.setAttribute("aria-hidden", "true");
    overlay.hidden = true;
  }

  function addToCart(productId, size) {
    var product = activeProducts().find(function (item) { return item.id === productId; });
    var cart = TSStore.getCart();
    var match = cart.find(function (item) { return item.id === productId && item.size === size; });
    if (match) match.quantity += 1;
    else cart.push({ id: product.id, name: product.name, size: size, price: product.price, image: product.image, quantity: 1 });
    TSStore.saveCart(cart);
    productDialog.close();
    openCart();
  }

  function showAuthView(view) {
    document.querySelectorAll("[data-auth-view]").forEach(function (button) {
      button.classList.toggle("active", button.dataset.authView === view);
    });
    document.getElementById("customer-login-form").hidden = view !== "login";
    document.getElementById("customer-register-form").hidden = view !== "register";
  }

  function addressText(address) {
    return address.label + " - " + address.street + ", " + address.number + " - " + address.city + "/" + address.state;
  }

  function getAddressFields(form) {
    return {
      id: form.elements.addressId && form.elements.addressId.value || "",
      label: form.elements.addressLabel.value.trim(),
      street: form.elements.street.value.trim(),
      number: form.elements.number.value.trim(),
      complement: form.elements.complement.value.trim(),
      neighborhood: form.elements.neighborhood.value.trim(),
      zip: form.elements.zip.value.trim(),
      city: form.elements.addressCity.value.trim(),
      state: form.elements.state.value.trim()
    };
  }

  function validAddress(address) {
    return address.label && address.street && address.number && address.neighborhood && address.city && address.state;
  }

  function clearAddressFields(form) {
    ["addressId", "addressLabel", "street", "number", "complement", "neighborhood", "zip", "addressCity", "state"].forEach(function (name) {
      if (form.elements[name]) form.elements[name].value = "";
    });
  }

  function renderCheckoutAddresses(customer) {
    var select = document.getElementById("checkout-address-select");
    var wrap = document.getElementById("address-select-wrap");
    var fields = document.getElementById("checkout-address-fields");
    if (!customer.addresses.length) {
      wrap.hidden = true;
      fields.hidden = false;
      setAlert("checkout-alert", "Cadastre um endereco para receber seu pedido.", "info");
      return;
    }
    wrap.hidden = false;
    select.innerHTML = customer.addresses.map(function (address) {
      return '<option value="' + address.id + '">' + escapeHtml(addressText(address)) + "</option>";
    }).join("");
    fields.hidden = true;
  }

  function renderCheckoutCustomer() {
    var customer = TSStore.currentCustomer();
    customerAuth.hidden = !!customer;
    customerSigned.hidden = !customer;
    checkoutForm.hidden = !customer;
    if (!customer) {
      showAuthView("login");
      return;
    }
    document.getElementById("customer-name").textContent = customer.name;
    checkoutForm.elements.phone.value = customer.phone;
    renderCheckoutAddresses(customer);
  }

  function renderAccount() {
    var customer = TSStore.currentCustomer();
    document.getElementById("account-guest").hidden = !!customer;
    document.getElementById("account-tabs").hidden = !customer;
    accountForm.hidden = !customer;
    document.getElementById("account-orders").hidden = true;
    if (!customer) return;
    accountForm.elements.name.value = customer.name;
    accountForm.elements.login.value = customer.login;
    accountForm.elements.phone.value = customer.phone;
    accountForm.elements.password.value = "";
    accountForm.elements.currentPassword.value = "";
    var list = document.getElementById("account-address-list");
    list.innerHTML = customer.addresses.length ? customer.addresses.map(function (address) {
      return '<article class="saved-address"><span>' + escapeHtml(addressText(address)) +
        '</span><button class="text-button" type="button" data-edit-address="' + address.id + '">Editar</button></article>';
    }).join("") : '<p class="muted">Nenhum endereco cadastrado.</p>';
    showAccountView("profile");
    renderAccountOrders(customer);
  }

  function showAccountView(view) {
    document.querySelectorAll("[data-account-view]").forEach(function (button) {
      button.classList.toggle("active", button.dataset.accountView === view);
    });
    accountForm.hidden = view !== "profile";
    document.getElementById("account-orders").hidden = view !== "orders";
  }

  function customerOrders(customer) {
    return TSStore.getOrders().filter(function (order) {
      return order.customer && order.customer.id === customer.id;
    });
  }

  function renderAccountOrders(customer) {
    var orders = customerOrders(customer);
    document.getElementById("account-orders-list").innerHTML = orders.length ? orders.map(function (order) {
      return '<article class="account-order-card"><strong>' + escapeHtml(order.id) + '</strong><p class="muted">' +
        new Date(order.date).toLocaleDateString("pt-BR") + ' | ' + escapeHtml(order.deletedAt ? "Excluido" : order.status) +
        ' | ' + escapeHtml(TSStore.money(TSStore.orderTotal(order.items))) +
        '</p><button class="text-button" type="button" data-account-order="' + escapeHtml(order.id) +
        '">Ver detalhes</button></article>';
    }).join("") : '<p class="empty-state">Voce ainda nao possui pedidos registrados.</p>';
  }

  function openAccountOrder(order) {
    var address = order.customer.address;
    document.getElementById("account-order-detail").innerHTML =
      '<p class="eyebrow">PEDIDO ' + escapeHtml(order.id) + '</p><h2>Detalhes do pedido</h2>' +
      '<div class="order-summary"><span><small>Status</small><strong>' + escapeHtml(order.deletedAt ? "Excluido" : order.status) +
      '</strong></span><span><small>Data</small><strong>' + escapeHtml(new Date(order.date).toLocaleDateString("pt-BR")) +
      '</strong></span><span><small>Total</small><strong>' + escapeHtml(TSStore.money(TSStore.orderTotal(order.items))) +
      '</strong></span></div><h3 class="detail-subtitle">Itens</h3><div class="order-items">' +
      order.items.map(function (item) {
        return '<div><span>' + escapeHtml(item.name) + ' | tam. ' + escapeHtml(item.size || "-") +
          ' | qtd. ' + item.quantity + '</span><strong>' + escapeHtml(TSStore.money(item.price)) + '</strong></div>';
      }).join("") + '</div><h3 class="detail-subtitle">Entrega</h3><p class="order-notes">' +
      escapeHtml(address ? addressText(address) : order.customer.city || "-") + '<br>' +
      escapeHtml(order.customer.delivery || "") + '</p>';
    accountOrderDialog.showModal();
  }

  function fillAccountAddress(address) {
    document.getElementById("account-address-fields").hidden = false;
    accountForm.elements.addressId.value = address ? address.id : "";
    accountForm.elements.addressLabel.value = address ? address.label : "";
    accountForm.elements.street.value = address ? address.street : "";
    accountForm.elements.number.value = address ? address.number : "";
    accountForm.elements.complement.value = address ? address.complement : "";
    accountForm.elements.neighborhood.value = address ? address.neighborhood : "";
    accountForm.elements.zip.value = address ? address.zip : "";
    accountForm.elements.addressCity.value = address ? address.city : "";
    accountForm.elements.state.value = address ? address.state : "";
  }

  filters.addEventListener("click", function (event) {
    if (!event.target.dataset.category) return;
    state.category = event.target.dataset.category;
    renderFilters();
    renderProducts();
  });
  document.getElementById("product-search").addEventListener("input", function (event) {
    state.search = event.target.value.trim();
    renderProducts();
  });
  grid.addEventListener("click", function (event) {
    var card = event.target.closest("[data-product-id]");
    if (card) openProduct(card.dataset.productId);
  });
  grid.addEventListener("keydown", function (event) {
    var card = event.target.closest("[data-product-id]");
    if (card && (event.key === "Enter" || event.key === " ")) openProduct(card.dataset.productId);
  });
  document.getElementById("product-detail").addEventListener("submit", function (event) {
    event.preventDefault();
    var data = new FormData(event.target);
    addToCart(data.get("productId"), data.get("size"));
  });
  document.querySelector("[data-close-dialog]").addEventListener("click", function () { productDialog.close(); });
  document.getElementById("open-cart").addEventListener("click", openCart);
  document.getElementById("close-cart").addEventListener("click", closeCart);
  overlay.addEventListener("click", closeCart);
  document.getElementById("cart-items").addEventListener("click", function (event) {
    var cart = TSStore.getCart();
    if (typeof event.target.dataset.removeIndex !== "undefined") cart.splice(Number(event.target.dataset.removeIndex), 1);
    else if (typeof event.target.dataset.quantityIndex !== "undefined") {
      var index = Number(event.target.dataset.quantityIndex);
      cart[index].quantity += Number(event.target.dataset.change);
      if (cart[index].quantity <= 0) cart.splice(index, 1);
    } else return;
    TSStore.saveCart(cart);
    renderCart();
  });
  document.getElementById("begin-checkout").addEventListener("click", function () {
    if (!TSStore.getCart().length) return;
    closeCart();
    setAlert("checkout-login-alert", "");
    setAlert("checkout-register-alert", "");
    setAlert("checkout-alert", "");
    renderCheckoutCustomer();
    checkoutDialog.showModal();
  });
  document.querySelector("[data-close-checkout]").addEventListener("click", function () { checkoutDialog.close(); });
  document.querySelectorAll("[data-close-success]").forEach(function (button) {
    button.addEventListener("click", function () { successDialog.close(); });
  });
  document.querySelector(".auth-tabs").addEventListener("click", function (event) {
    if (event.target.dataset.authView) showAuthView(event.target.dataset.authView);
  });
  document.getElementById("customer-login-form").addEventListener("submit", function (event) {
    event.preventDefault();
    var data = new FormData(event.target);
    var customer = TSStore.authenticateCustomer(data.get("login"), data.get("password"));
    if (!customer) {
      setAlert("checkout-login-alert", "Conta de cliente nao encontrada ou senha incorreta.", "error");
      return;
    }
    TSStore.setCustomerSession(customer);
    setAlert("checkout-login-alert", "");
    renderCheckoutCustomer();
  });
  document.getElementById("customer-register-form").addEventListener("submit", function (event) {
    event.preventDefault();
    var result = TSStore.createCustomer(Object.fromEntries(new FormData(event.target).entries()));
    if (result.error) {
      setAlert("checkout-register-alert", result.error, "error");
      return;
    }
    TSStore.setCustomerSession(result.customer);
    setAlert("checkout-register-alert", "");
    event.target.reset();
    renderCheckoutCustomer();
  });
  document.getElementById("customer-logout").addEventListener("click", function () {
    TSStore.setCustomerSession(null);
    checkoutForm.reset();
    renderCheckoutCustomer();
  });
  document.getElementById("new-checkout-address").addEventListener("click", function () {
    clearAddressFields(checkoutForm);
    document.getElementById("checkout-address-fields").hidden = false;
  });
  document.getElementById("save-checkout-address").addEventListener("click", function () {
    var customer = TSStore.currentCustomer();
    var address = getAddressFields(checkoutForm);
    if (!validAddress(address)) {
      setAlert("checkout-alert", "Preencha identificacao, rua, numero, bairro, cidade e estado.", "error");
      return;
    }
    var saved = TSStore.addCustomerAddress(customer, address);
    setAlert("checkout-alert", "Endereco cadastrado para a entrega.", "success");
    renderCheckoutAddresses(TSStore.currentCustomer());
    document.getElementById("checkout-address-select").value = saved.id;
  });
  checkoutForm.addEventListener("submit", function (event) {
    event.preventDefault();
    var customer = TSStore.currentCustomer();
    if (!customer) {
      renderCheckoutCustomer();
      return;
    }
    var address = customer.addresses.find(function (item) { return item.id === checkoutForm.elements.addressId.value; });
    if (!address) {
      setAlert("checkout-alert", "Selecione ou cadastre um endereco de entrega.", "error");
      return;
    }
    var fields = Object.fromEntries(new FormData(event.target).entries());
    customer.phone = fields.phone.trim();
    TSStore.saveCustomer(customer);
    var order = TSStore.createOrder({
      id: customer.id, name: customer.name, login: customer.login, phone: customer.phone,
      delivery: fields.delivery, notes: fields.notes, address: address, city: address.city + " - " + address.state
    }, TSStore.getCart());
    TSStore.saveCart([]);
    renderCart();
    checkoutDialog.close();
    event.target.reset();
    document.getElementById("success-message").textContent =
      "Seu pedido " + order.id + " foi salvo com sucesso. A TS Top Shoes fara o acompanhamento dos dados informados.";
    successDialog.showModal();
  });

  document.getElementById("open-account").addEventListener("click", function () {
    setAlert("account-login-alert", "");
    setAlert("account-alert", "");
    document.getElementById("account-address-fields").hidden = true;
    renderAccount();
    accountDialog.showModal();
  });
  document.querySelector("[data-close-account]").addEventListener("click", function () { accountDialog.close(); });
  document.querySelector("[data-close-account-order]").addEventListener("click", function () { accountOrderDialog.close(); });
  document.getElementById("account-tabs").addEventListener("click", function (event) {
    if (event.target.dataset.accountView) showAccountView(event.target.dataset.accountView);
  });
  document.getElementById("account-orders-list").addEventListener("click", function (event) {
    if (!event.target.dataset.accountOrder) return;
    var order = customerOrders(TSStore.currentCustomer()).find(function (item) { return item.id === event.target.dataset.accountOrder; });
    if (order) openAccountOrder(order);
  });
  document.getElementById("account-login-form").addEventListener("submit", function (event) {
    event.preventDefault();
    var data = new FormData(event.target);
    var customer = TSStore.authenticateCustomer(data.get("login"), data.get("password"));
    if (!customer) {
      setAlert("account-login-alert", "Conta de cliente nao encontrada ou senha incorreta.", "error");
      return;
    }
    TSStore.setCustomerSession(customer);
    setAlert("account-login-alert", "");
    renderAccount();
  });
  document.getElementById("account-logout").addEventListener("click", function () {
    TSStore.setCustomerSession(null);
    accountDialog.close();
  });
  document.getElementById("add-account-address").addEventListener("click", function () { fillAccountAddress(null); });
  document.getElementById("account-address-list").addEventListener("click", function (event) {
    if (!event.target.dataset.editAddress) return;
    var customer = TSStore.currentCustomer();
    fillAccountAddress(customer.addresses.find(function (address) { return address.id === event.target.dataset.editAddress; }));
  });
  document.getElementById("save-account-address").addEventListener("click", function () {
    var customer = TSStore.currentCustomer();
    var address = getAddressFields(accountForm);
    if (!validAddress(address)) {
      setAlert("account-alert", "Preencha os campos obrigatorios do endereco.", "error");
      return;
    }
    TSStore.addCustomerAddress(customer, address);
    setAlert("account-alert", "Endereco salvo.", "success");
    document.getElementById("account-address-fields").hidden = true;
    renderAccount();
  });
  accountForm.addEventListener("submit", function (event) {
    event.preventDefault();
    var customer = TSStore.currentCustomer();
    var data = new FormData(event.target);
    var login = data.get("login").trim().toLowerCase();
    if (TSStore.getCustomers().some(function (item) { return item.id !== customer.id && item.login === login; })) {
      setAlert("account-alert", "Este login ja esta cadastrado.", "error");
      return;
    }
    customer.name = data.get("name").trim();
    customer.login = login;
    customer.phone = data.get("phone").trim();
    if (data.get("password")) {
      if (data.get("currentPassword") !== customer.password) {
        setAlert("account-alert", "Digite sua senha atual corretamente para definir uma nova senha.", "error");
        return;
      }
      customer.password = data.get("password");
    }
    TSStore.saveCustomer(customer);
    accountDialog.close();
  });

  document.querySelectorAll("[data-open-password-reset]").forEach(function (button) {
    button.addEventListener("click", function () {
      setAlert("password-reset-alert", "");
      document.getElementById("password-reset-form").reset();
      passwordResetDialog.showModal();
    });
  });
  document.querySelector("[data-close-password-reset]").addEventListener("click", function () { passwordResetDialog.close(); });
  document.getElementById("password-reset-form").addEventListener("submit", function (event) {
    event.preventDefault();
    var identifier = new FormData(event.target).get("identifier");
    var result = TSStore.requestPasswordReset(identifier);
    if (result.error) {
      setAlert("password-reset-alert", result.error, "error");
      return;
    }
    setAlert("password-reset-alert", "Solicitacao enviada ao administrador. Aguarde a atualizacao da sua senha.", "success");
  });

  populateStateSelects();
  renderFilters();
  renderProducts();
  renderCart();
}());
