const cart = [];

const money = value =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2
  }).format(value);

const toast = document.getElementById('toast');

function notify(message) {
  toast.textContent = message;
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
  }, 2200);
}

function getProduct(button) {
  const card = button.closest('.product');

  const title = card.querySelector('h3').textContent.trim();

  const priceText = card.querySelector('.price').textContent;

  const price = Number(priceText.replace(/[^0-9.]/g, ''));

  const image = card.querySelector('img').getAttribute('src');

  return {
    key: title + '|' + price + '|' + image,
    name: title,
    price: price,
    image: image,
    qty: 1
  };
}


document.querySelectorAll('.add').forEach(button => {

  button.addEventListener('click', () => {

    const product = getProduct(button);

    const existing = cart.find(item => item.key === product.key);

    if (existing) {
      existing.qty++;
    } else {
      cart.push(product);
    }

    renderCart();

    notify(product.name + ' agregado al carrito');

  });

});


function renderCart() {

  const container = document.getElementById('cartItems');

  container.innerHTML = '';

  if (!cart.length) {

    container.innerHTML =
      '<p class="note">Tu carrito está vacío. Explora el catálogo para agregar productos.</p>';

  } else {

    cart.forEach((item, index) => {

      const row = document.createElement('div');

      row.className = 'cart-row';

      const img = document.createElement('img');

      img.src = item.image;

      img.alt = item.name;

      const info = document.createElement('div');

      const title = document.createElement('h4');

      title.textContent = item.name;

      const price = document.createElement('p');

      price.textContent = money(item.price);

      const quantity = document.createElement('div');

      quantity.className = 'quantity';

      const minus = document.createElement('button');

      minus.textContent = '−';

      minus.onclick = () => {

        item.qty--;

        if (item.qty <= 0) {
          cart.splice(index, 1);
        }

        renderCart();

      };

      const qty = document.createElement('span');

      qty.textContent = item.qty;

      const plus = document.createElement('button');

      plus.textContent = '+';

      plus.onclick = () => {

        item.qty++;

        renderCart();

      };

      quantity.append(minus, qty, plus);

      info.append(title, price, quantity);

      const remove = document.createElement('button');

      remove.className = 'remove';

      remove.textContent = 'Eliminar';

      remove.onclick = () => {

        cart.splice(index, 1);

        renderCart();

      };

      row.append(img, info, remove);

      container.append(row);

    });

  }

  const total = cart.reduce(
    (sum, item) => sum + item.price * item.qty,
    0
  );

  document.getElementById('cartSubtotal').textContent = money(total);

  document.getElementById('cartCount').textContent =
    cart.reduce((sum, item) => sum + item.qty, 0);

}


function openModal(id) {

  document.getElementById(id).classList.add('open');

}

function closeModal(id) {

  document.getElementById(id).classList.remove('open');

}

document.getElementById('openCart').addEventListener('click', () => {

  renderCart();

  openModal('cartModal');

});

document.querySelectorAll('[data-close]').forEach(button => {

  button.addEventListener('click', () => {

    closeModal(button.dataset.close);

  });

});

document.querySelectorAll('.overlay').forEach(overlay => {

  overlay.addEventListener('click', event => {

    if (event.target === overlay) {
      overlay.classList.remove('open');
    }

  });

});


document.getElementById('checkoutButton').addEventListener('click', () => {

  if (!cart.length) {

    notify('Agrega al menos un producto antes de continuar');

    return;

  }

  const summary = document.getElementById('checkoutSummary');

  summary.innerHTML = '';

  cart.forEach(item => {

    const line = document.createElement('div');

    line.className = 'summary-line';

    const name = document.createElement('span');

    name.textContent = item.name + ' × ' + item.qty;

    const price = document.createElement('strong');

    price.textContent = money(item.price * item.qty);

    line.append(name, price);

    summary.append(line);

  });

  document.getElementById('checkoutTotal').textContent = money(
    cart.reduce((sum, item) => sum + item.price * item.qty, 0)
  );

  closeModal('cartModal');

  openModal('checkoutModal');

});



document.getElementById('confirmOrder').addEventListener('click', () => {

  cart.length = 0;

  renderCart();

  closeModal('checkoutModal');

  notify('Pedido de demostración confirmado');

});


document.querySelectorAll('.filter').forEach(filter => {

  filter.addEventListener('click', () => {

    document.querySelectorAll('.filter').forEach(item => {

      item.classList.remove('active');

    });

    filter.classList.add('active');

    const category = filter.dataset.filter;

    document.querySelectorAll('.full-catalog .product').forEach(card => {

      card.style.display =
        category === 'todos' || card.dataset.category === category
          ? ''
          : 'none';

    });

  });

});


const menuToggle = document.getElementById('menuToggle');

const navigation = document.getElementById('navigation');

menuToggle.addEventListener('click', () => {

  navigation.classList.toggle('open');

});

navigation.querySelectorAll('a').forEach(link => {

  link.addEventListener('click', () => {

    navigation.classList.remove('open');

  });

});


renderCart();