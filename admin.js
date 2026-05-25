(function () {
  var login = document.getElementById("admin-login");
  var dashboard = document.getElementById("dashboard");
  var productDialog = document.getElementById("product-form-dialog");
  var customerDialog = document.getElementById("customer-form-dialog");
  var orderDialog = document.getElementById("order-detail-dialog");
  var supportDialog = document.getElementById("support-reset-dialog");
  var confirmDialog = document.getElementById("admin-confirm-dialog");
  var taxonomyModal = document.getElementById("taxonomy-modal");
  var productImage = "";
  var customerAddressDraft = [];
  var pendingConfirm = null;
  var filters = { productCategory: "", productSearch: "", orderStatus: "", orderSearch: "", customerSearch: "" };
  var panelTitles = {
    overview: "Resumo",
    products: "Produtos",
    orders: "Pedidos",
    customers: "Clientes",
    support: "Suporte",
    settings: "Configuracoes"
  };

  function escapeHtml(text) {
    return String(text).replace(/[&<>"']/g, function (char) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char];
    });
  }

  function setAlert(id, message, type) {
    var alert = document.getElementById(id);
    alert.textContent = message || "";
    alert.className = "modal-alert" + (type ? " " + type : "");
    alert.hidden = !message;
  }

  function formatDate(value) {
    return new Date(value).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
  }

  function uniqueValues(values) {
    return values.filter(function (value, index, list) { return value && list.indexOf(value) === index; }).sort();
  }

  function productCategories(product) {
    return product.categories || [product.category];
  }

  function stateOptions(selected) {
    return '<option value="">Selecione</option>' + window.TS_BRAZIL_STATES.map(function (state) {
      return '<option value="' + state[0] + '"' + (state[0] === selected ? " selected" : "") + ">" + state[0] + " - " + state[1] + "</option>";
    }).join("");
  }

  function populateStateSelects() {
    document.querySelectorAll(".state-select").forEach(function (select) {
      var current = select.value;
      select.innerHTML = stateOptions(current);
    });
  }

  function syncTaxonomies() {
    var products = TSStore.getProducts();
    var brands = uniqueValues(TSStore.getBrands().concat(products.map(function (product) { return product.brand; })));
    var categories = uniqueValues(TSStore.getCategories().concat(products.reduce(function (all, product) { return all.concat(productCategories(product)); }, [])));
    TSStore.saveBrands(brands);
    TSStore.saveCategories(categories);
  }

  function enterDashboard() {
    login.hidden = true;
    dashboard.hidden = false;
    document.getElementById("admin-date").textContent = new Date().toLocaleDateString("pt-BR", {
      weekday: "long", day: "numeric", month: "long"
    });
    syncTaxonomies();
    renderAll();
  }

  function showPanel(panel) {
    document.querySelectorAll(".admin-nav button").forEach(function (button) {
      button.classList.toggle("active", button.dataset.panel === panel);
    });
    document.querySelectorAll("[data-panel-content]").forEach(function (section) {
      section.classList.toggle("active", section.dataset.panelContent === panel);
    });
    document.getElementById("panel-title").textContent = panelTitles[panel];
    if (panel === "settings") fillSettings();
  }

  function renderMetrics() {
    var products = TSStore.getProducts();
    var orders = TSStore.getOrders();
    var activeOrders = orders.filter(function (order) { return !order.deletedAt; });
    var countedOrders = activeOrders.filter(function (order) { return order.status !== "Cancelado"; });
    var customers = TSStore.getCustomers();
    document.getElementById("metrics").innerHTML = [
      ["Produtos publicados", products.filter(function (p) { return p.active; }).length],
      ["Pedidos novos", activeOrders.filter(function (order) { return order.status === "Novo"; }).length],
      ["Pedidos registrados", countedOrders.length],
      ["Clientes", customers.filter(function (customer) { return !customer.deletedAt; }).length],
      ["Suporte pendente", TSStore.getPasswordRequests().filter(function (request) { return request.status === "Pendente"; }).length]
    ].map(function (metric) {
      return '<article class="metric"><span>' + metric[0] + '</span><strong>' + metric[1] + "</strong></article>";
    }).join("");
  }

  function renderRecentOrders() {
    var orders = TSStore.getOrders().filter(function (order) { return !order.deletedAt; }).slice(0, 4);
    var element = document.getElementById("recent-orders");
    if (!orders.length) {
      element.innerHTML = '<p class="empty-state">Os novos pedidos da loja aparecerao aqui.</p>';
      return;
    }
    element.innerHTML = orders.map(function (order) {
      return '<button class="recent-row recent-order-button" type="button" data-recent-order="' + escapeHtml(order.id) +
        '"><div><strong>' + escapeHtml(order.id) + " - " +
        escapeHtml(order.customer.name) + '</strong><p>' + formatDate(order.date) + " | " +
        order.items.length + ' item(ns)</p></div><span class="badge">' + escapeHtml(order.status) + "</span></button>";
    }).join("");
  }

  function renderProductFilters() {
    var select = document.getElementById("product-category-filter");
    var options = ['<option value="">Todas as categorias</option>'].concat(TSStore.getCategories().map(function (category) {
      return '<option' + (filters.productCategory === category ? " selected" : "") + ">" + escapeHtml(category) + "</option>";
    }));
    select.innerHTML = options.join("");
  }

  function renderProducts() {
    renderProductFilters();
    var query = filters.productSearch.toLowerCase();
    var products = TSStore.getProducts().filter(function (product) {
      var matchesCategory = !filters.productCategory || productCategories(product).indexOf(filters.productCategory) !== -1;
      var matchesQuery = !query || (product.name + " " + product.brand).toLowerCase().indexOf(query) !== -1;
      return matchesCategory && matchesQuery;
    });
    var table = document.getElementById("products-table");
    if (!products.length) {
      table.innerHTML = '<tr><td colspan="5"><p class="empty-state">Nenhum produto encontrado.</p></td></tr>';
      return;
    }
    table.innerHTML = products.map(function (product) {
      return "<tr><td><div class=\"table-product\"><img src=\"" + escapeHtml(product.image) + "\" alt=\"\"><div><strong>" +
        escapeHtml(product.name) + "</strong><small>" + escapeHtml(product.brand) + " | " +
        escapeHtml(productCategories(product).join(", ")) + "</small></div></div></td><td>" + TSStore.money(product.price) +
        "</td><td>" + escapeHtml(product.sizes.join(", ")) + '</td><td><span class="badge ' +
        (product.active ? "active" : "") + '">' + (product.active ? "Publicado" : "Oculto") +
        '</span></td><td><button class="action-button" data-edit="' + escapeHtml(product.id) +
        '">Editar</button><button class="action-button danger" data-delete="' + escapeHtml(product.id) +
        '">Excluir</button></td></tr>';
    }).join("");
  }

  function renderOrders() {
    var query = filters.orderSearch.toLowerCase();
    var orders = TSStore.getOrders().filter(function (order) {
      var customerName = order.customer && order.customer.name ? order.customer.name : "";
      var matchesStatus = !filters.orderStatus || order.status === filters.orderStatus;
      var matchesQuery = !query || (order.id + " " + customerName).toLowerCase().indexOf(query) !== -1;
      return !order.deletedAt && matchesStatus && matchesQuery;
    });
    var table = document.getElementById("orders-table");
    if (!orders.length) {
      table.innerHTML = '<tr><td colspan="5"><p class="empty-state">Nenhum pedido encontrado.</p></td></tr>';
      return;
    }
    table.innerHTML = orders.map(function (order) {
      var itemLabel = order.items.map(function (item) { return item.name + " (" + item.size + ")"; }).join(", ");
      return '<tr><td><button class="order-link" data-view-order="' + escapeHtml(order.id) + '"><strong>' +
        escapeHtml(order.id) + "</strong></button><br><small>" + formatDate(order.date) +
        "</small></td><td>" + escapeHtml(order.customer.name) + "<br><small>" +
        escapeHtml(order.customer.phone || "") + "</small></td><td>" + escapeHtml(itemLabel) + "</td><td>" +
        escapeHtml(order.customer.delivery) + '<br><small>' + escapeHtml(order.customer.city) +
        '</small></td><td><select class="order-status" data-order-status="' + escapeHtml(order.id) + '">' +
        ["Novo", "Em atendimento", "Enviado", "Concluido", "Cancelado"].map(function (status) {
          return '<option' + (status === order.status ? " selected" : "") + ">" + status + "</option>";
        }).join("") + '</select><button class="action-button order-view" data-view-order="' + escapeHtml(order.id) +
        '">Ver detalhes</button></td></tr>';
    }).join("");
  }

  function renderOrderHistory() {
    var table = document.getElementById("order-history-table");
    var orders = TSStore.getOrders();
    if (!orders.length) {
      table.innerHTML = '<tr><td colspan="5"><p class="empty-state">Nenhum pedido registrado.</p></td></tr>';
      return;
    }
    table.innerHTML = orders.map(function (order) {
      var state = order.deletedAt ? "Excluido" : order.status;
      return '<tr><td><strong>' + escapeHtml(order.id) + '</strong></td><td>' + escapeHtml(order.customer.name) +
        '</td><td>' + formatDate(order.date) + '</td><td><span class="badge ' +
        (!order.deletedAt && order.status === "Concluido" ? "active" : "") + '">' + escapeHtml(state) +
        '</span></td><td><button class="action-button" data-history-order="' + escapeHtml(order.id) +
        '">Ver dados</button></td></tr>';
    }).join("");
  }

  function renderCustomers() {
    var query = filters.customerSearch.toLowerCase();
    var customers = TSStore.getCustomers().filter(function (customer) {
      return !customer.deletedAt && (!query || (customer.name + " " + customer.login + " " + customer.phone).toLowerCase().indexOf(query) !== -1);
    });
    var table = document.getElementById("customers-table");
    if (!customers.length) {
      table.innerHTML = '<tr><td colspan="5"><p class="empty-state">Nenhum cliente cadastrado.</p></td></tr>';
      return;
    }
    table.innerHTML = customers.map(function (customer) {
      return '<tr><td><strong>' + escapeHtml(customer.name) + '</strong><br><small>' +
        customer.addresses.length + ' endereco(s)</small></td><td>' + escapeHtml(customer.login) +
        '</td><td>' + escapeHtml(customer.phone) + '</td><td><span class="badge ' +
        (customer.active !== false ? "active" : "") + '">' + (customer.active !== false ? "Ativo" : "Inativo") +
        '</span></td><td><button class="action-button" data-edit-customer="' + customer.id +
        '">Editar</button><button class="action-button danger" data-delete-customer="' + customer.id +
        '">Excluir</button></td></tr>';
    }).join("");
  }

  function renderCustomerHistory() {
    var customers = TSStore.getCustomers().filter(function (customer) { return customer.deletedAt; });
    var table = document.getElementById("customer-history-table");
    if (!customers.length) {
      table.innerHTML = '<tr><td colspan="4"><p class="empty-state">Nenhum cliente excluido.</p></td></tr>';
      return;
    }
    table.innerHTML = customers.map(function (customer) {
      return '<tr><td><strong>' + escapeHtml(customer.name) + '</strong></td><td>' + escapeHtml(customer.login) +
        '</td><td>' + escapeHtml(formatDate(customer.deletedAt)) + '</td><td><button class="action-button" data-restore-customer="' +
        escapeHtml(customer.id) + '">Restaurar conta</button></td></tr>';
    }).join("");
  }

  function renderSupport() {
    var requests = TSStore.getPasswordRequests();
    var table = document.getElementById("support-table");
    if (!requests.length) {
      table.innerHTML = '<tr><td colspan="5"><p class="empty-state">Nenhuma solicitacao de senha.</p></td></tr>';
      return;
    }
    table.innerHTML = requests.map(function (request) {
      return '<tr><td><strong>' + escapeHtml(request.id) + '</strong><br><small>' + formatDate(request.date) +
        '</small></td><td>' + escapeHtml(request.customerName) + '</td><td>' + escapeHtml(request.identifier) +
        '</td><td><span class="badge ' + (request.status === "Resolvido" ? "active" : "") + '">' +
        escapeHtml(request.status) + '</span></td><td>' + (request.status === "Pendente" ?
        '<button class="action-button" data-reset-request="' + request.id + '">Alterar senha</button>' : "-") + "</td></tr>";
    }).join("");
  }

  function fillSettings() {
    var settings = TSStore.getSettings();
    var form = document.getElementById("settings-form");
    form.elements.storeName.value = settings.storeName;
    form.elements.instagram.value = settings.instagram;
    form.elements.whatsapp.value = settings.whatsapp;
    form.elements.shippingText.value = settings.shippingText;
    form.elements.newPassword.value = "";
  }

  function renderAll() {
    renderMetrics();
    renderRecentOrders();
    renderProducts();
    renderOrders();
    renderOrderHistory();
    renderCustomers();
    renderCustomerHistory();
    renderSupport();
    fillSettings();
  }

  function fillSelect(select, values, selected) {
    select.innerHTML = values.map(function (value) {
      return '<option' + (value === selected ? " selected" : "") + ">" + escapeHtml(value) + "</option>";
    }).join("");
  }

  function fillMultiSelect(select, values, selected) {
    var selections = selected || [];
    select.innerHTML = values.map(function (value) {
      return '<option' + (selections.indexOf(value) !== -1 ? " selected" : "") + ">" + escapeHtml(value) + "</option>";
    }).join("");
  }

  function renderImagePreview(image) {
    var preview = document.getElementById("product-image-preview");
    preview.innerHTML = image ? '<img src="' + escapeHtml(image) + '" alt="Previa do produto">' : "<span>Nenhuma imagem selecionada</span>";
  }

  function openProductForm(product) {
    var form = document.getElementById("product-form");
    form.reset();
    fillSelect(form.elements.brand, TSStore.getBrands(), product && product.brand);
    fillMultiSelect(form.elements.categories, TSStore.getCategories(), product && productCategories(product));
    form.elements.id.value = product ? product.id : "";
    productImage = product ? product.image : "";
    renderImagePreview(productImage);
    setAlert("product-form-alert", "");
    document.getElementById("product-form-title").textContent = product ? "Editar produto" : "Novo produto";
    if (product) {
      form.elements.name.value = product.name;
      form.elements.price.value = product.price === null ? "" : product.price;
      form.elements.sizes.value = product.sizes.join(", ");
      form.elements.description.value = product.description;
      form.elements.featured.checked = product.featured;
      form.elements.active.checked = product.active;
    }
    productDialog.showModal();
  }

  function openTaxonomyModal(type) {
    var isBrand = type === "brand";
    var form = document.getElementById("taxonomy-form");
    form.reset();
    form.elements.type.value = type;
    document.getElementById("taxonomy-title").textContent = isBrand ? "Adicionar marca" : "Adicionar categoria";
    document.getElementById("taxonomy-label").firstChild.textContent = isBrand ? "Nome da marca" : "Nome da categoria";
    setAlert("taxonomy-alert", "");
    taxonomyModal.showModal();
    form.elements.value.focus();
  }

  function addTaxonomy(type, rawValue) {
    var isBrand = type === "brand";
    var form = document.getElementById("product-form");
    var value = rawValue;
    if (!value || !value.trim()) return;
    value = value.trim();
    var values = isBrand ? TSStore.getBrands() : TSStore.getCategories();
    if (values.indexOf(value) === -1) values.push(value);
    values = uniqueValues(values);
    if (isBrand) TSStore.saveBrands(values); else TSStore.saveCategories(values);
    if (isBrand) fillSelect(form.elements.brand, values, value);
    else fillMultiSelect(form.elements.categories, values, (Array.from(form.elements.categories.selectedOptions).map(function (option) { return option.value; })).concat([value]));
    renderProductFilters();
    setAlert("product-form-alert", (isBrand ? "Marca" : "Categoria") + " adicionada.", "success");
    taxonomyModal.close();
  }

  function openCustomerForm(customer) {
    var form = document.getElementById("customer-form");
    form.reset();
    form.elements.id.value = customer ? customer.id : "";
    customerAddressDraft = customer ? JSON.parse(JSON.stringify(customer.addresses || [])) : [];
    document.getElementById("customer-form-title").textContent = customer ? "Editar cliente" : "Novo cliente";
    setAlert("customer-form-alert", "");
    if (customer) {
      form.elements.name.value = customer.name;
      form.elements.login.value = customer.login;
      form.elements.phone.value = customer.phone;
      form.elements.active.checked = customer.active !== false;
    }
    document.getElementById("admin-address-fields").hidden = true;
    renderAdminAddressList();
    customerDialog.showModal();
  }

  function addressText(address) {
    return address.label + " - " + address.street + ", " + address.number + " - " + address.city + "/" + address.state;
  }

  function renderAdminAddressList() {
    document.getElementById("admin-address-list").innerHTML = customerAddressDraft.length ? customerAddressDraft.map(function (address) {
      return '<article class="saved-address"><span>' + escapeHtml(addressText(address)) +
        '</span><button type="button" class="text-button" data-edit-admin-address="' + address.id + '">Editar</button></article>';
    }).join("") : '<p class="muted">Nenhum endereco cadastrado.</p>';
  }

  function fillAdminAddress(address) {
    var form = document.getElementById("customer-form");
    document.getElementById("admin-address-fields").hidden = false;
    form.elements.addressId.value = address ? address.id : "";
    form.elements.addressLabel.value = address ? address.label : "";
    form.elements.street.value = address ? address.street : "";
    form.elements.number.value = address ? address.number : "";
    form.elements.complement.value = address ? address.complement : "";
    form.elements.neighborhood.value = address ? address.neighborhood : "";
    form.elements.zip.value = address ? address.zip : "";
    form.elements.addressCity.value = address ? address.city : "";
    form.elements.state.value = address ? address.state : "";
  }

  function readAdminAddress() {
    var form = document.getElementById("customer-form");
    return {
      id: form.elements.addressId.value || "END" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 7).toUpperCase(),
      label: form.elements.addressLabel.value.trim(), street: form.elements.street.value.trim(), number: form.elements.number.value.trim(),
      complement: form.elements.complement.value.trim(), neighborhood: form.elements.neighborhood.value.trim(), zip: form.elements.zip.value.trim(),
      city: form.elements.addressCity.value.trim(), state: form.elements.state.value
    };
  }

  function openOrderDetails(order) {
    var address = order.customer.address;
    var total = TSStore.orderTotal(order.items);
    var customer = TSStore.getCustomers().find(function (item) { return item.id === order.customer.id; });
    var addresses = customer && customer.addresses.length ? customer.addresses : (address ? [address] : []);
    var productOptions = TSStore.getProducts().filter(function (product) { return product.active; }).map(function (product) {
      return '<option value="' + escapeHtml(product.id) + '">' + escapeHtml(product.name) + '</option>';
    }).join("");
    var editableItems = order.items.map(function (item, index) {
      return '<div class="order-edit-item" data-order-item="' + index + '"><label>Item<input name="itemName" value="' +
        escapeHtml(item.name) + '" readonly data-price="' + escapeHtml(item.price === null ? "" : item.price) + '" data-size="' +
        escapeHtml(item.size || "") + '"></label><label>Qtd.<input type="number" name="itemQuantity" min="1" value="' +
        item.quantity + '"></label><button class="action-button danger" type="button" data-remove-order-item>Remover</button></div>';
    }).join("");
    var management = order.deletedAt ?
      '<section><h3>Pedido excluido</h3><p>Este pedido foi excluido em ' + escapeHtml(formatDate(order.deletedAt)) +
      ' e permanece disponivel no historico para consulta.</p></section>' :
      '<section><h3>Editar pedido</h3><form id="order-edit-form" class="compact-form">' +
      '<input type="hidden" name="orderId" value="' + escapeHtml(order.id) + '">' +
      '<label>Status<select name="status">' + ["Novo", "Em atendimento", "Enviado", "Concluido", "Cancelado"].map(function (status) {
        return '<option' + (status === order.status ? " selected" : "") + ">" + status + "</option>";
      }).join("") + '</select></label><label>Entrega<select name="delivery"><option' +
      (order.customer.delivery === "Entrega em Ijui e regiao" ? " selected" : "") + '>Entrega em Ijui e regiao</option><option' +
      (order.customer.delivery === "Envio para outra cidade" ? " selected" : "") + '>Envio para outra cidade</option></select></label>' +
      '<label>Endereco<select name="addressId">' + addresses.map(function (item) {
        return '<option value="' + item.id + '"' + (address && address.id === item.id ? " selected" : "") + ">" + escapeHtml(addressText(item)) + "</option>";
      }).join("") + '</select></label><h3>Itens do pedido</h3><div class="order-edit-items" id="order-edit-items">' +
      editableItems + '</div><div class="select-action"><select id="order-product-add"><option value="">Adicionar produto...</option>' +
      productOptions + '</select><button class="mini-button" type="button" data-add-order-item>+</button></div><label>Observacoes<textarea name="notes" rows="2">' +
      escapeHtml(order.customer.notes || "") + '</textarea></label><div class="modal-alert" id="order-form-alert" hidden></div>' +
      '<button class="button button-primary button-block" type="submit">Salvar pedido</button>' +
      '<button class="button button-ghost button-block" type="button" data-delete-order="' + escapeHtml(order.id) +
      '">Excluir pedido</button></form></section>';
    document.getElementById("order-detail-content").innerHTML =
      '<p class="eyebrow">PEDIDO ' + escapeHtml(order.id) + '</p><h2>Detalhes do pedido</h2>' +
      '<div class="order-summary"><span><small>Status</small><strong>' + escapeHtml(order.status) +
      '</strong></span><span><small>Data</small><strong>' + escapeHtml(formatDate(order.date)) +
      '</strong></span><span><small>Total</small><strong>' + (total === null ? "Sob consulta" : TSStore.money(total)) +
      '</strong></span></div>' +
      '<div class="order-detail-grid"><section><h3>Cliente</h3><p><strong>' + escapeHtml(order.customer.name) +
      '</strong><br>Login: ' + escapeHtml(order.customer.login || "-") + '<br>WhatsApp: ' +
      escapeHtml(order.customer.phone || "-") + '<br>Cadastro: ' + escapeHtml(order.customer.id || "-") +
      '</p></section>' + management + '</div>' +
      '<h3 class="detail-subtitle">Itens</h3><div class="order-items">' +
      order.items.map(function (item) {
        return '<div><span>' + escapeHtml(item.name) + ' | tam. ' + escapeHtml(item.size) + ' | qtd. ' + item.quantity +
          '</span><strong>' + TSStore.money(item.price) + '</strong></div>';
      }).join("") + '</div><p class="order-notes"><strong>Observacoes:</strong> ' +
      escapeHtml(order.customer.notes || "Nenhuma") + '</p>';
    if (!orderDialog.open) orderDialog.showModal();
  }

  function askConfirmation(title, message, action) {
    document.getElementById("confirm-title").textContent = title;
    document.getElementById("confirm-message").textContent = message;
    pendingConfirm = action;
    confirmDialog.showModal();
  }

  document.getElementById("login-form").addEventListener("submit", function (event) {
    event.preventDefault();
    var data = new FormData(event.target);
    var settings = TSStore.getSettings();
    if (data.get("username") === settings.adminUser && data.get("password") === settings.adminPassword) {
      TSStore.setSession(true);
      enterDashboard();
      return;
    }
    setAlert("admin-login-alert", "Usuario ou senha incorretos.", "error");
  });
  document.getElementById("reset-access").addEventListener("click", function () {
    TSStore.resetAdminAccess();
    setAlert("admin-login-alert", "Acesso restaurado: admin / topshoes2026", "success");
  });
  document.querySelector(".admin-nav").addEventListener("click", function (event) {
    if (event.target.dataset.panel) showPanel(event.target.dataset.panel);
  });
  document.querySelector("[data-open-panel]").addEventListener("click", function (event) {
    showPanel(event.target.dataset.openPanel);
  });
  document.getElementById("recent-orders").addEventListener("click", function (event) {
    var trigger = event.target.closest("[data-recent-order]");
    if (!trigger) return;
    openOrderDetails(TSStore.getOrders().find(function (order) { return order.id === trigger.dataset.recentOrder; }));
  });
  document.getElementById("logout").addEventListener("click", function () {
    TSStore.setSession(false);
    dashboard.hidden = true;
    login.hidden = false;
  });

  document.getElementById("product-category-filter").addEventListener("change", function (event) {
    filters.productCategory = event.target.value;
    renderProducts();
  });
  document.getElementById("product-search-filter").addEventListener("input", function (event) {
    filters.productSearch = event.target.value.trim();
    renderProducts();
  });
  document.getElementById("order-status-filter").addEventListener("change", function (event) {
    filters.orderStatus = event.target.value;
    renderOrders();
  });
  document.getElementById("order-search-filter").addEventListener("input", function (event) {
    filters.orderSearch = event.target.value.trim();
    renderOrders();
  });
  document.getElementById("customer-search-filter").addEventListener("input", function (event) {
    filters.customerSearch = event.target.value.trim();
    renderCustomers();
  });

  document.getElementById("new-product").addEventListener("click", function () { openProductForm(null); });
  document.querySelector("[data-close-product-form]").addEventListener("click", function () { productDialog.close(); });
  document.getElementById("add-brand").addEventListener("click", function () { openTaxonomyModal("brand"); });
  document.getElementById("add-category").addEventListener("click", function () { openTaxonomyModal("category"); });
  document.querySelector("[data-close-taxonomy]").addEventListener("click", function () { taxonomyModal.close(); });
  document.getElementById("taxonomy-form").addEventListener("submit", function (event) {
    event.preventDefault();
    var data = new FormData(event.target);
    addTaxonomy(data.get("type"), data.get("value"));
  });
  document.getElementById("product-form").elements.imageFile.addEventListener("change", function (event) {
    var file = event.target.files[0];
    if (!file) return;
    if (!file.type.match(/^image\/(png|jpeg|webp)$/)) {
      setAlert("product-form-alert", "Selecione uma imagem JPG, PNG ou WEBP.", "error");
      event.target.value = "";
      return;
    }
    var reader = new FileReader();
    reader.addEventListener("load", function () {
      productImage = reader.result;
      renderImagePreview(productImage);
    });
    reader.readAsDataURL(file);
  });
  document.getElementById("products-table").addEventListener("click", function (event) {
    var products = TSStore.getProducts();
    if (event.target.dataset.edit) {
      openProductForm(products.find(function (product) { return product.id === event.target.dataset.edit; }));
    }
    if (event.target.dataset.delete) {
      askConfirmation("Excluir produto", "Excluir este produto da loja?", function () {
        TSStore.saveProducts(products.filter(function (product) { return product.id !== event.target.dataset.delete; }));
        renderAll();
      });
    }
  });
  document.getElementById("product-form").addEventListener("submit", function (event) {
    event.preventDefault();
    if (!productImage) {
      setAlert("product-form-alert", "Carregue uma imagem para o produto.", "error");
      return;
    }
    var form = event.target;
    var data = new FormData(form);
    var categories = Array.from(form.elements.categories.selectedOptions).map(function (option) { return option.value; });
    if (!categories.length) {
      setAlert("product-form-alert", "Selecione ao menos uma categoria.", "error");
      return;
    }
    var products = TSStore.getProducts();
    var id = data.get("id") || data.get("name").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + Date.now().toString().slice(-4);
    var product = {
      id: id,
      name: data.get("name").trim(),
      brand: data.get("brand"),
      categories: categories,
      price: data.get("price") === "" ? null : Number(data.get("price")),
      sizes: data.get("sizes").split(",").map(function (size) { return size.trim(); }).filter(Boolean),
      image: productImage,
      description: data.get("description").trim(),
      featured: data.get("featured") === "on",
      active: data.get("active") === "on"
    };
    var index = products.findIndex(function (item) { return item.id === id; });
    if (index === -1) products.unshift(product); else products[index] = product;
    TSStore.saveProducts(products);
    renderAll();
    productDialog.close();
  });

  document.getElementById("orders-table").addEventListener("change", function (event) {
    if (!event.target.dataset.orderStatus) return;
    var orders = TSStore.getOrders();
    var order = orders.find(function (item) { return item.id === event.target.dataset.orderStatus; });
    order.status = event.target.value;
    TSStore.saveOrders(orders);
    renderMetrics();
    renderRecentOrders();
    renderOrders();
  });
  document.getElementById("orders-table").addEventListener("click", function (event) {
    var trigger = event.target.closest("[data-view-order]");
    if (!trigger) return;
    openOrderDetails(TSStore.getOrders().find(function (order) { return order.id === trigger.dataset.viewOrder; }));
  });
  document.getElementById("order-history-table").addEventListener("click", function (event) {
    if (!event.target.dataset.historyOrder) return;
    openOrderDetails(TSStore.getOrders().find(function (order) { return order.id === event.target.dataset.historyOrder; }));
  });
  document.querySelector("[data-close-order-detail]").addEventListener("click", function () { orderDialog.close(); });
  document.getElementById("order-detail-content").addEventListener("click", function (event) {
    if (event.target.dataset.addOrderItem !== undefined) {
      var select = document.getElementById("order-product-add");
      var product = TSStore.getProducts().find(function (item) { return item.id === select.value; });
      if (!product) return;
      var container = document.getElementById("order-edit-items");
      var row = document.createElement("div");
      row.className = "order-edit-item";
      row.innerHTML = '<label>Item<input name="itemName" value="' + escapeHtml(product.name) + '" readonly data-price="' +
        escapeHtml(product.price === null ? "" : product.price) + '" data-size="' + escapeHtml(product.sizes[0] || "") +
        '"></label><label>Qtd.<input type="number" name="itemQuantity" min="1" value="1"></label>' +
        '<button class="action-button danger" type="button" data-remove-order-item>Remover</button>';
      container.appendChild(row);
      select.value = "";
      return;
    }
    if (event.target.dataset.removeOrderItem !== undefined) {
      event.target.closest(".order-edit-item").remove();
      return;
    }
    if (!event.target.dataset.deleteOrder) return;
    var order = TSStore.getOrders().find(function (item) { return item.id === event.target.dataset.deleteOrder; });
    askConfirmation("Excluir pedido", "O pedido saira da lista ativa, mas continuara disponivel no historico.", function () {
      order.deletedAt = new Date().toISOString();
      TSStore.saveOrder(order);
      orderDialog.close();
      renderAll();
    });
  });
  document.getElementById("order-detail-content").addEventListener("submit", function (event) {
    if (event.target.id !== "order-edit-form") return;
    event.preventDefault();
    var data = new FormData(event.target);
    var order = TSStore.getOrders().find(function (item) { return item.id === data.get("orderId"); });
    var customer = TSStore.getCustomers().find(function (item) { return item.id === order.customer.id; });
    var address = customer && customer.addresses.find(function (item) { return item.id === data.get("addressId"); });
    order.status = data.get("status");
    order.customer.delivery = data.get("delivery");
    order.customer.notes = data.get("notes");
    order.items = Array.from(event.target.querySelectorAll(".order-edit-item")).map(function (row) {
      var name = row.querySelector('[name="itemName"]');
      return {
        name: name.value,
        price: name.dataset.price === "" ? null : Number(name.dataset.price),
        size: name.dataset.size,
        quantity: Number(row.querySelector('[name="itemQuantity"]').value)
      };
    }).filter(function (item) { return item.quantity > 0; });
    if (!order.items.length) {
      setAlert("order-form-alert", "O pedido deve possuir ao menos um item.", "error");
      return;
    }
    if (address) {
      order.customer.address = address;
      order.customer.city = address.city + " - " + address.state;
    }
    TSStore.saveOrder(order);
    renderAll();
    openOrderDetails(order);
    setAlert("order-form-alert", "Pedido atualizado.", "success");
  });

  document.getElementById("new-customer").addEventListener("click", function () { openCustomerForm(null); });
  document.querySelector("[data-close-customer-form]").addEventListener("click", function () { customerDialog.close(); });
  document.getElementById("add-admin-address").addEventListener("click", function () { fillAdminAddress(null); });
  document.getElementById("admin-address-list").addEventListener("click", function (event) {
    if (!event.target.dataset.editAdminAddress) return;
    fillAdminAddress(customerAddressDraft.find(function (item) { return item.id === event.target.dataset.editAdminAddress; }));
  });
  document.getElementById("save-admin-address").addEventListener("click", function () {
    var address = readAdminAddress();
    if (!address.label || !address.street || !address.number || !address.neighborhood || !address.city || !address.state) {
      setAlert("customer-form-alert", "Preencha os campos obrigatorios do endereco.", "error");
      return;
    }
    var index = customerAddressDraft.findIndex(function (item) { return item.id === address.id; });
    if (index === -1) customerAddressDraft.push(address); else customerAddressDraft[index] = address;
    document.getElementById("admin-address-fields").hidden = true;
    renderAdminAddressList();
    setAlert("customer-form-alert", "Endereco salvo no cadastro.", "success");
  });
  document.getElementById("customers-table").addEventListener("click", function (event) {
    var customers = TSStore.getCustomers();
    if (event.target.dataset.editCustomer) {
      openCustomerForm(customers.find(function (customer) { return customer.id === event.target.dataset.editCustomer; }));
    }
    if (event.target.dataset.deleteCustomer) {
      askConfirmation("Excluir cliente", "Excluir este cliente? Os pedidos anteriores serao mantidos.", function () {
        var customer = customers.find(function (item) { return item.id === event.target.dataset.deleteCustomer; });
        customer.deletedAt = new Date().toISOString();
        customer.active = false;
        TSStore.saveCustomer(customer);
        renderAll();
      });
    }
  });
  document.getElementById("customer-history-table").addEventListener("click", function (event) {
    if (!event.target.dataset.restoreCustomer) return;
    var customer = TSStore.getCustomers().find(function (item) { return item.id === event.target.dataset.restoreCustomer; });
    delete customer.deletedAt;
    customer.active = true;
    TSStore.saveCustomer(customer);
    renderAll();
  });
  document.getElementById("customer-form").addEventListener("submit", function (event) {
    event.preventDefault();
    var form = event.target;
    var data = new FormData(form);
    var existing = TSStore.getCustomers().find(function (customer) { return customer.id === data.get("id"); });
    if (!existing && !data.get("password")) {
      setAlert("customer-form-alert", "Defina uma senha para o novo cliente.", "error");
      return;
    }
    var duplicate = TSStore.getCustomers().find(function (customer) {
      return customer.login.toLowerCase() === data.get("login").trim().toLowerCase() && customer.id !== data.get("id");
    });
    if (duplicate) {
      setAlert("customer-form-alert", "Este login ja esta cadastrado.", "error");
      return;
    }
    var customer = {
      id: existing ? existing.id : "CLI" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 7).toUpperCase(),
      name: data.get("name").trim(),
      login: data.get("login").trim().toLowerCase(),
      password: data.get("password") || existing.password,
      phone: data.get("phone").trim(),
      addresses: customerAddressDraft,
      active: data.get("active") === "on",
      createdAt: existing ? existing.createdAt : new Date().toISOString()
    };
    TSStore.saveCustomer(customer);
    renderAll();
    setAlert("customer-form-alert", "Cliente salvo.", "success");
  });

  document.getElementById("support-table").addEventListener("click", function (event) {
    if (!event.target.dataset.resetRequest) return;
    var request = TSStore.getPasswordRequests().find(function (item) { return item.id === event.target.dataset.resetRequest; });
    var form = document.getElementById("support-reset-form");
    form.reset();
    form.elements.requestId.value = request.id;
    document.getElementById("support-customer-label").textContent = "Cliente: " + request.customerName + " | Informado: " + request.identifier;
    setAlert("support-form-alert", "");
    supportDialog.showModal();
  });
  document.querySelector("[data-close-support-reset]").addEventListener("click", function () { supportDialog.close(); });
  document.getElementById("support-reset-form").addEventListener("submit", function (event) {
    event.preventDefault();
    var data = new FormData(event.target);
    if (!TSStore.resolvePasswordReset(data.get("requestId"), data.get("password"))) {
      setAlert("support-form-alert", "Nao foi possivel atualizar a senha.", "error");
      return;
    }
    setAlert("support-form-alert", "Senha do cliente atualizada.", "success");
    renderAll();
  });

  document.getElementById("settings-form").addEventListener("submit", function (event) {
    event.preventDefault();
    var form = event.target;
    var data = new FormData(form);
    var settings = TSStore.getSettings();
    settings.storeName = data.get("storeName").trim();
    settings.instagram = data.get("instagram").trim();
    settings.whatsapp = data.get("whatsapp").replace(/\D/g, "");
    settings.shippingText = data.get("shippingText").trim();
    if (data.get("newPassword")) settings.adminPassword = data.get("newPassword");
    TSStore.saveSettings(settings);
    form.elements.newPassword.value = "";
    setAlert("settings-alert", "Configuracoes salvas.", "success");
  });
  document.getElementById("cancel-confirm").addEventListener("click", function () {
    pendingConfirm = null;
    confirmDialog.close();
  });
  document.getElementById("accept-confirm").addEventListener("click", function () {
    if (pendingConfirm) pendingConfirm();
    pendingConfirm = null;
    confirmDialog.close();
  });

  if (TSStore.hasSession()) enterDashboard();
  populateStateSelects();
}());
