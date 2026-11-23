const supabaseUrl = 'https://twagbjmijgpykardyeud.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3YWdiam1pamdweWthcmR5ZXVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTUzODU4MTksImV4cCI6MjExMDk2MTgxOX0.CgO3ZgL7WWoF1Mby6IEcU1D_JatgUvjMRvOHkWVGRmM';
const _supabase = supabase.createClient(supabaseUrl, supabaseKey);

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
  setTimeout(() => toast.classList.remove('show'), 2200);
}

// Cargar productos desde Supabase y dibujarlos en sus categorías
async function cargarCatalogoDesdeDB() {
  const { data: productos, error } = await _supabase
    .from('productos')
    .select('*')
    .order('id', { ascending: true });

  if (error) {
    console.error('Error cargando productos:', error);
    return;
  }

  // Si aún no hay productos en Supabase, conserva los fijos del HTML
  if (!productos || productos.length === 0) return;

  const etiquetas = {
    superior: 'PRENDA SUPERIOR',
    inferior: 'PRENDA INFERIOR',
    calzado: 'CALZADO'
  };

  // Vaciar solo las categorías que tengan productos registrados en Supabase
  const categoriasConDatos = [...new Set(productos.map(p => p.categoria))];
  categoriasConDatos.forEach(cat => {
    const grid = document.getElementById(`grid-${cat}`);
    if (grid) grid.innerHTML = '';
  });

  productos.forEach(prod => {
    const grid = document.getElementById(`grid-${prod.categoria}`);
    if (!grid) return;

    const article = document.createElement('article');
    article.className = 'product';
    article.dataset.category = prod.categoria;
    article.innerHTML = `
      <img src="${prod.imagen}" alt="${prod.nombre}">
      <small>${etiquetas[prod.categoria] || 'SANTORINO'}</small>
      <h3>${prod.nombre}</h3>
      <p class="price">${money(prod.precio)} USD</p>
      <button class="add">Agregar al carrito</button>
    `;
    grid.appendChild(article);
  });
}

// Delegación de eventos para botones "Agregar al carrito"
document.addEventListener('click', event => {
  if (!event.target.classList.contains('add')) return;

  const card = event.target.closest('.product');
  const title = card.querySelector('h3').textContent.trim();
  const priceText = card.querySelector('.price').textContent;
  const price = Number(priceText.replace(/[^0-9.]/g, ''));
  const image = card.querySelector('img').getAttribute('src');

  const key = `${title}|${price}|${image}`;
  const existing = cart.find(item => item.key === key);

  if (existing) {
    existing.qty++;
  } else {
    cart.push({ key, name: title, price, image, qty: 1 });
  }

  renderCart();
  notify(`${title} agregado al carrito`);
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
        if (item.qty <= 0) cart.splice(index, 1);
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

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  document.getElementById('cartSubtotal').textContent = money(total);
  document.getElementById('cartCount').textContent = cart.reduce((sum, item) => sum + item.qty, 0);
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
  button.addEventListener('click', () => closeModal(button.dataset.close));
});

document.querySelectorAll('.overlay').forEach(overlay => {
  overlay.addEventListener('click', event => {
    if (event.target === overlay) overlay.classList.remove('open');
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
    name.textContent = `${item.name} × ${item.qty}`;

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

// Guardar el pedido confirmado en la tabla "pedidos" de Supabase
document.getElementById('confirmOrder').addEventListener('click', async () => {
  const totalPedido = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const resumenTexto = cart.map(item => `${item.name} (x${item.qty})`).join(', ');

  const { error } = await _supabase
    .from('pedidos')
    .insert([
      {
        cliente: 'Cliente Web Demo',
        detalle: resumenTexto,
        total: totalPedido
      }
    ]);

  if (error) {
    console.error('Error al guardar pedido:', error);
    notify('Error al registrar el pedido en la base de datos');
    return;
  }

  cart.length = 0;
  renderCart();
  closeModal('checkoutModal');
  notify('¡Pedido guardado en Supabase con éxito!');
});

document.querySelectorAll('.filter').forEach(filter => {
  filter.addEventListener('click', () => {
    document.querySelectorAll('.filter').forEach(item => item.classList.remove('active'));
    filter.classList.add('active');

    const category = filter.dataset.filter;
    document.querySelectorAll('.full-catalog .product').forEach(card => {
      card.style.display =
        category === 'todos' || card.dataset.category === category ? '' : 'none';
    });
  });
});

const menuToggle = document.getElementById('menuToggle');
const navigation = document.getElementById('navigation');

menuToggle.addEventListener('click', () => navigation.classList.toggle('open'));

navigation.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => navigation.classList.remove('open'));
});

renderCart();
cargarCatalogoDesdeDB();