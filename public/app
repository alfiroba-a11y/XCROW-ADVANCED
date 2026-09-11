const dialogs = document.querySelectorAll('dialog');
document.querySelectorAll('[data-open]').forEach(button => button.addEventListener('click', () => document.getElementById(button.dataset.open).showModal()));
dialogs.forEach(dialog => dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); }));
const observer = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('in'); }), { threshold: .15 });
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
document.querySelectorAll('.solution').forEach(item => item.addEventListener('click', () => { document.querySelector('.solution.active').classList.remove('active'); item.classList.add('active'); }));
document.getElementById('checkout').addEventListener('click', async () => {
  const amount = document.getElementById('amount').value;
  const message = document.getElementById('form-message');
  const [tokenSymbol, network] = document.getElementById('asset').value.split('|');
  if (!amount || Number(amount) <= 0) return message.textContent = 'Add a valid transaction amount first.';
  message.textContent = 'Creating your protected payment request…';
  try {
    const response = await fetch('/api/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount, settlementCurrency: document.getElementById('currency').value, tokenSymbol, network }) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.setup || result.error);
    window.location.assign(result.checkoutUrl);
  } catch (error) { message.textContent = error.message; }
});
