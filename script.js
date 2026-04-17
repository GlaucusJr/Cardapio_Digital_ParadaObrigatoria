// CONFIG
const PHONE = '5561982040129';

// FRETE POR BAIRRO
const bairros = {
  "Pad-DF": 17,
  "Lamarao": 14,
  "Alfavile": 10,
  "Marajo": 15,
  "Capao Seco": 5
};

// STATE
let cart = JSON.parse(localStorage.getItem('cart')) || {};
let selectedPayment = '';

// FORMATAR ID
function formatId(name) {
  return name.replace(/\s+/g, '-');
}

// TOAST
function showToast(message, type = 'error') {
  const toast = document.getElementById('toast');

  if (!toast) return;

  toast.innerText = message;

  // 🔥 remove hidden
  toast.classList.remove('hidden');

  // limpa classes antigas
  toast.classList.remove('success', 'error');

  // adiciona novas
  toast.classList.add('show', type);

  setTimeout(() => {
    toast.classList.remove('show');

    // 🔥 volta o hidden depois de sumir
    setTimeout(() => {
      toast.classList.add('hidden');
    }, 300);

  }, 2500);
}

// CARREGAR BAIRROS
function loadBairros() {
  const select = document.getElementById('bairroSelect');
  if (!select) return;

  select.innerHTML = `<option value="">Selecione seu bairro</option>`;

  Object.entries(bairros).forEach(([nome, valor]) => {
    const option = document.createElement('option');
    option.value = nome;
    option.textContent = `${nome} (R$ ${valor})`;
    select.appendChild(option);
  });

  // 🔥 evita duplicação de evento
  select.onchange = updateCart;
}

// PEGAR FRETE
function getFrete() {
  const select = document.getElementById('bairroSelect');
  if (!select || !select.value) return 0;

  return bairros[select.value] || 0;
}

function getTempoEntrega(bairro) {
  const tempos = {
    "Pad-DF": "30-40 min",
    "Lamarao": "35-50 min",
    "Alfavile": "40-60 min",
    "Marajo": "45-65 min",
    "Capao Seco": "20-30 min"
  };

  return tempos[bairro] || "30-50 min";
}

// ADICIONAR ITEM
function updateItem(name, price, change) {
  if (!cart[name]) cart[name] = { price, qty: 0 };

  cart[name].qty += change;

  if (cart[name].qty <= 0) delete cart[name];

  const el = document.getElementById(`qty-${formatId(name)}`);
  if (el) el.innerText = cart[name]?.qty || 0;

  saveCart();
  updateCart();

  // 🔥 feedback visual
  if (change > 0) {
    showToast(`${name} adicionado 🛒`, 'success');
  }
}

// SALVAR
function saveCart() {
  localStorage.setItem('cart', JSON.stringify(cart));
}

// ATUALIZAR CARRINHO
function updateCart() {
  let total = 0;
  const frete = getFrete();

  const items = Object.entries(cart).map(([item, { price, qty }]) => {
    const subtotal = price * qty;
    total += subtotal;

    return `
      <div class="cart-item">
        <span>${qty}x - ${item}</span>
        <span>R$ ${subtotal.toFixed(2)}</span>
      </div>
    `;
  }).join('');

  document.getElementById('cartItems').innerHTML =
    items || 'Seu carrinho está vazio';

  // 🔥 ATUALIZA FRETE VISUAL
  const freteEl = document.getElementById('freteValue');
  if (freteEl) {
    freteEl.innerText = frete > 0 ? `R$ ${frete.toFixed(2)}` : 'a consultar';
  }

  // 🔥 TOTAL LIMPO (como você queria)
  document.getElementById('total').innerText =
    `R$ ${(total + frete).toFixed(2)}`;
}

// MODAL
function openModal() {
  if (Object.keys(cart).length === 0) {
    showToast('Adicione itens ao carrinho');
    return;
  }

  if (!isOpen()) {
    showToast('Estamos fechados no momento 😢');
    return;
  }

  // 🔥 MOSTRA OVERLAY
  document.getElementById('overlay')?.classList.remove('hidden');

  // 🔥 MOSTRA MODAL
  document.getElementById('modal').classList.remove('hidden');

  // mantém seus steps
  document.getElementById('stepPayment').classList.remove('hidden');
  document.getElementById('stepAddress').classList.add('hidden');
}

function closeModal() {
  document.getElementById('modal').classList.add('hidden');

  // 🔥 ESCONDE OVERLAY
  document.getElementById('overlay')?.classList.add('hidden');
}

// SCROLL CATEGORIA
function scrollToCat(id) {
  const element = document.getElementById(id);
  if (!element) return;

  const offset = 120;
  const y = element.getBoundingClientRect().top + window.scrollY - offset;

  window.scrollTo({
    top: y,
    behavior: 'smooth'
  });
}

// SCROLL NAV (🔥 corrigido)
function scrollNav(amount) {
  const nav = document.getElementById('navScroll');
  if (!nav) return;

  nav.scrollBy({
    left: amount,
    behavior: 'smooth'
  });
}

// PAGAMENTO
function selectPayment(method, btn) {
  selectedPayment = method;

  document.querySelectorAll('#stepPayment button')
    .forEach(b => b.classList.remove('active'));

  btn.classList.add('active');

  document.getElementById('stepAddress').classList.remove('hidden');

  const trocoContainer = document.getElementById('trocoContainer');

  if (method === 'Dinheiro') {
    trocoContainer.classList.remove('hidden');
  } else {
    trocoContainer.classList.add('hidden');
  }
}

// FINALIZAR
function finalizarPedido() {
  const address = document.getElementById('modalAddress').value.trim();
  const name = document.getElementById('customerName').value.trim();
  const troco = document.getElementById('troco')?.value;
  const bairro = document.getElementById('bairroSelect')?.value;

  // 🔒 VALIDAÇÕES
  if (Object.keys(cart).length === 0) {
    showToast('Carrinho vazio');
    return;
  }

  if (!bairro) {
    showToast('Selecione seu bairro');
    return;
  }

  if (!name) {
    showToast('Informe seu nome e sobrenome');
    return;
  }

  if (!selectedPayment || !address) {
    showToast('Preencha tudo');
    return;
  }

  if (selectedPayment === 'Dinheiro' && !troco) {
    showToast('Informe o valor para troco');
    return;
  }

  let total = 0;
  let itens = '';

  Object.entries(cart).forEach(([item, { price, qty }]) => {
    const subtotal = price * qty;
    total += subtotal;

    itens += `➡ ${qty}x - ${item} - R$ ${subtotal.toFixed(2)}\n`;
  });

  const frete = getFrete();
  const tempo = getTempoEntrega(bairro);

  // MENSAGEM
  const message =
    `📋 *NOVO PEDIDO*\n\n` +
    `📦 *Itens:*\n${itens}\n` +
    `💳 *Pagamento:* ${selectedPayment}\n` +
    (selectedPayment === 'Dinheiro'
      ? `💰 Troco para: R$ ${troco}\n`
      : '') +
    `\n🚚 *Frete:* R$ ${frete.toFixed(2)}\n` +
    `⏱ *Tempo estimado:* ${tempo}\n` +
    `🗺 *Bairro:* ${bairro}\n` +
    `📍 *Endereço:* ${address}\n\n` +
    `💵 *Total:* R$ ${(total + frete).toFixed(2)}\n` +
    `👤 *Nome:* ${name}`;

  const encodedMessage = encodeURIComponent(message);

  const urlApp = `whatsapp://send?phone=${PHONE}&text=${encodedMessage}`;
  const urlWeb = `https://wa.me/${PHONE}?text=${encodedMessage}`;

  // REDIRECIONA
  window.location.href = urlApp;

  setTimeout(() => {
    window.location.href = urlWeb;

    // RESET
    cart = {};
    selectedPayment = '';
    localStorage.removeItem('cart');

    document.getElementById('customerName').value = '';
    document.getElementById('modalAddress').value = '';

    if (document.getElementById('troco')) {
      document.getElementById('troco').value = '';
    }

    const select = document.getElementById('bairroSelect');
    if (select) select.value = '';

    closeModal();
    updateCart();

    document.querySelectorAll('[id^="qty-"]')
      .forEach(el => el.innerText = '0');

  }, 2000);
}

// STATUS LOJA
function isOpen() {
  const hour = new Date().getHours();
  return hour >= 17 && hour <= 23; // 🔥 corrigido
}

const status = document.getElementById('storeStatus');
if (status) {
  if (isOpen()) {
    status.innerText = '🟢 Aberto agora';
    status.style.color = 'lightgreen';
  } else {
    status.innerText = '🔴 Fechado agora';
    status.style.color = 'red';
  }
}

// NAV OVERFLOW
function checkNavOverflow() {
  const nav = document.getElementById('navScroll');
  const left = document.querySelector('.nav-arrow.left');
  const right = document.querySelector('.nav-arrow.right');

  if (!nav) return;

  if (nav.scrollWidth > nav.clientWidth) {
    left.style.display = 'flex';
    right.style.display = 'flex';
    nav.style.justifyContent = 'flex-start';
  } else {
    left.style.display = 'none';
    right.style.display = 'none';
    nav.style.justifyContent = 'center';
  }
}

// INIT
window.addEventListener('load', () => {
  loadBairros();
  checkNavOverflow();
  updateCart();

  // RESTAURA QTD
  Object.entries(cart).forEach(([item, { qty }]) => {
    const el = document.getElementById(`qty-${formatId(item)}`);
    if (el) el.innerText = qty;
  });
});

window.addEventListener('resize', checkNavOverflow);
document.getElementById('overlay')?.addEventListener('click', closeModal);