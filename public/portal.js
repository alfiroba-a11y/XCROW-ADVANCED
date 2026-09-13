(() => {
  const stkStyle = document.createElement('style'); stkStyle.textContent = '#stk-approval-flow{align-items:center;background:#0f172ae6;display:flex;inset:0;justify-content:center;position:fixed;z-index:10000}.stk-card{background:#1e293b;border:1px solid #334155;border-radius:14px;box-shadow:0 25px 60px #0008;color:#fff;max-width:390px;padding:32px 30px;text-align:center;width:calc(100vw - 32px)}.stk-card h2{font-size:21px;margin:17px 0 8px}.stk-card p{color:#cbd5e1;margin:0 0 13px}.stk-card>b{color:#2dd4bf;display:block;font-size:12px}.stk-card small{color:#a5b4fc;display:block;font-family:monospace;font-size:10px;margin:10px 0 22px;overflow-wrap:anywhere}.stk-brand{color:#93c5fd;font-size:10px;font-weight:800;letter-spacing:.12em}.stk-rings{align-items:center;border:2px solid #2dd4bf;border-radius:50%;display:flex;height:74px;justify-content:center;margin:auto;position:relative;width:74px}.stk-rings:before,.stk-rings:after{border:1px solid #38bdf855;border-radius:50%;content:"";inset:8px;position:absolute}.stk-rings:after{inset:18px}.stk-rings span{color:#2dd4bf;font-size:22px}.stk-rings.approved{background:#15803d;border-color:#86efac}.stk-state{background:#3b82f6;border-radius:7px;font-size:16px;font-weight:800;margin:0 auto 12px;padding:15px;width:100%}.stk-close{background:transparent;border:0;color:#94a3b8;font-size:23px;position:absolute;right:calc(50% - 172px);top:calc(50% - 198px)}.stk-resend{background:transparent;color:#bfdbfe!important;border-color:#64748b!important}'; document.head.append(stkStyle);
  const token = () => localStorage.getItem('xcrow_token');
  const api = async (path, options = {}) => {
    let response;
    try { response = await fetch(path, { ...options, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}`, ...(options.headers || {}) } }); }
    catch { throw new Error('XCROW could not reach the service. Check your connection and retry.'); }
    const data = response.headers.get('content-type')?.includes('application/json') ? await response.json().catch(() => null) : null;
    if (!response.ok) throw new Error(data?.error || 'XCROW could not complete that request. Please retry.');
    return data;
  };
  const safe = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
  const money = deal => `${Number(deal.fee?.buyerTotal || deal.amount || 0).toLocaleString()} ${safe(deal.currency)}`;
  const notice = text => { const box = document.createElement('div'); box.textContent = text; Object.assign(box.style, { position:'fixed', top:'18px', right:'18px', zIndex:9999, background:'#12213a', color:'#fff', padding:'12px 15px', borderRadius:'8px' }); document.body.append(box); setTimeout(() => box.remove(), 3500); };

  async function renderAdmin() {
    // The structured operations dashboard in admin-dashboard.js owns this view.
    // Leaving this old renderer active caused both dashboards to overwrite each
    // other, producing intermittent failed-load and missing-control states.
    return;
    const panel = document.querySelector('#admin-view');
    if (!panel || panel.dataset.portalLoading) return;
    panel.dataset.portalLoading = '1';
    try {
      const data = await api('/api/admin/portal');
      panel.dataset.portalLoading = '';
      panel.dataset.portalReady = '1';
      panel.innerHTML = `<span class="tag">XCROW OPERATIONS</span><h2>Full site oversight</h2>
        <div style="display:grid;grid-template-columns:repeat(4,minmax(120px,1fr));gap:10px;margin-bottom:22px">
          <div class="fee-preview"><b>${data.counts.members}</b><br><small>Registered members</small></div><div class="fee-preview"><b>${data.counts.escrows}</b><br><small>All escrows</small></div><div class="fee-preview"><b>${data.counts.active}</b><br><small>Active / review</small></div><div class="fee-preview"><b>${data.counts.trc20Pending}</b><br><small>TRC20 pending</small></div>
        </div>
        <section class="admin-list"><h3>TRC20 confirmations awaiting you</h3>${data.trc20Pending.length ? data.trc20Pending.map(deal => `<div class="invite-box"><b>${safe(deal.code)} · ${safe(deal.title)}</b><p>${money(deal)} · ${safe(deal.status)}</p><p>${deal.parties.map(p => `${safe(p.name)} — ${safe(p.email)}`).join('<br>')}</p><input data-tx="${deal._id}" placeholder="Transaction hash / reference"><button class="button" data-confirm="${deal._id}">Mark funded ✓</button></div>`).join('') : '<p class="detail-meta">No TRC20 payments are waiting for confirmation.</p>'}</section>
        <section class="admin-list"><h3>All escrow activity</h3><input id="admin-filter" placeholder="Search code, title, status, member or email" style="width:100%;padding:10px;margin-bottom:10px;border:1px solid #dce3ed;border-radius:6px"><div id="admin-deals"></div></section>
        <section class="admin-list"><h3>Registered members</h3><div style="max-height:260px;overflow:auto">${data.members.map(member => `<p style="margin:6px 0"><b>${safe(member.name)}</b> · ${safe(member.email)} <small>joined ${new Date(member.joinedAt).toLocaleDateString()}</small></p>`).join('') || '<p>No members yet.</p>'}</div></section>
        <section class="admin-list"><h3>Recent administrator actions</h3>${data.actions.map(action => `<p><b>${safe(action.action)}</b> · ${safe(action.note || '')} <small>${new Date(action.createdAt).toLocaleString()}</small></p>`).join('') || '<p>No actions yet.</p>'}</section>`;
      const dealList = panel.querySelector('#admin-deals');
      const drawDeals = query => { const filtered = data.escrows.filter(deal => JSON.stringify(deal).toLowerCase().includes(query.toLowerCase())); dealList.innerHTML = filtered.map(deal => `<div class="invite-box"><b>${safe(deal.code)} · ${safe(deal.title)}</b><p>${money(deal)} · <span class="status">${safe(deal.status)}</span></p><p>${safe(deal.description || '')}</p><p>${deal.parties.map(p => `${safe(p.name)} (${safe(p.role)}) · ${safe(p.email)}`).join('<br>')}</p>${deal.currency === 'USDT' && !['Funded','Release processing','Completed'].includes(deal.status) ? `<input data-crypto-hash="${deal._id}" placeholder="TRC20 transaction hash"><button class="button" data-crypto-confirm="${deal._id}">Mark crypto funded</button>` : ''}${deal.status === 'Release processing' ? `<button class="button" data-complete="${deal._id}">Complete escrow ✓</button>` : ''}<button class="copy" data-support="${deal._id}">Join as XCROW Support</button> <button class="copy" data-dispute="${deal._id}">Open dispute review</button> <button class="button" data-chat="${deal._id}">Open chat</button></div>`).join('') || '<p>No escrows match.</p>'; bindDealButtons(); };
      const bindDealButtons = () => {
        panel.querySelectorAll('[data-complete]').forEach(button => button.onclick = async () => { try { await api(`/api/admin/deals/${button.dataset.complete}/complete`, { method:'POST' }); notice('Escrow completed. Participants were notified.'); panel.dataset.portalReady = ''; renderAdmin(); } catch (error) { notice(error.message); } });
        panel.querySelectorAll('[data-crypto-confirm]').forEach(button => button.onclick = async () => { const transactionHash = panel.querySelector(`[data-crypto-hash="${button.dataset.cryptoConfirm}"]`).value; try { await api(`/api/admin/deals/${button.dataset.cryptoConfirm}/mark-crypto-funded`, { method:'POST', body:JSON.stringify({ transactionHash }) }); notice('Crypto payment marked funded and participants notified.'); renderAdmin(); } catch (error) { notice(error.message); } });
        panel.querySelectorAll('[data-support]').forEach(button => button.onclick = async () => { try { await api(`/api/admin/deals/${button.dataset.support}/support`, { method:'POST' }); notice('Support joined the escrow. Participants were notified in chat.'); renderAdmin(); } catch (error) { notice(error.message); } });
        panel.querySelectorAll('[data-dispute]').forEach(button => button.onclick = async () => { const note = prompt('Optional dispute note for the participants:') ?? ''; try { await api(`/api/admin/deals/${button.dataset.dispute}/dispute`, { method:'POST', body:JSON.stringify({ note }) }); notice('Dispute review opened and recorded.'); renderAdmin(); } catch (error) { notice(error.message); } });
        panel.querySelectorAll('[data-chat]').forEach(button => button.onclick = () => openChat(button.dataset.chat, data.escrows.find(deal => deal._id === button.dataset.chat))); 
      };
      panel.querySelector('#admin-filter').oninput = event => drawDeals(event.target.value);
      panel.querySelectorAll('[data-confirm]').forEach(button => button.onclick = async () => { const transactionHash = panel.querySelector(`[data-tx="${button.dataset.confirm}"]`).value; try { await api(`/api/admin/deals/${button.dataset.confirm}/confirm-trc20`, { method:'POST', body:JSON.stringify({ transactionHash }) }); notice('Payment marked funded. The escrow has updated.'); renderAdmin(); } catch (error) { notice(error.message); } });
      drawDeals('');
    } catch (error) { panel.dataset.portalLoading = ''; }
  }
  async function openChat(id, deal) {
    try {
      if (!deal.parties.some(p => p.name === 'XCROW Support')) await api(`/api/admin/deals/${id}/support`, { method:'POST' });
      const messages = await api(`/api/deals/${id}/messages`);
      const dialog = document.createElement('dialog');
      dialog.innerHTML = `<form class="modal" style="width:min(620px,calc(100vw - 28px))"><button class="close" type="button">×</button><span class="tag">XCROW SUPPORT · ${safe(deal.code)}</span><h2>${safe(deal.title)}</h2><div style="max-height:340px;overflow:auto;border:1px solid #dce3ed;padding:10px;border-radius:6px">${messages.map(message => `<p><b>${safe(message.senderName)}</b><br>${safe(message.body)}<br><small>${new Date(message.createdAt).toLocaleString()}</small></p>`).join('') || '<p>No messages yet.</p>'}</div><textarea name="body" required placeholder="Write as XCROW Support" style="width:100%;margin:12px 0;padding:10px"></textarea><button class="button">Send as XCROW Support</button></form>`;
      document.body.append(dialog); dialog.showModal(); dialog.querySelector('.close').onclick = () => dialog.close(); dialog.querySelector('form').onsubmit = async event => { event.preventDefault(); try { await api(`/api/deals/${id}/messages`, { method:'POST', body:JSON.stringify({ body:new FormData(event.currentTarget).get('body') }) }); dialog.close(); notice('Support message sent to the escrow chat.'); } catch (error) { notice(error.message); } };
    } catch (error) { notice(error.message); }
  }
  function addTrcRequest() {
    const detail = document.querySelector('#deal-view .deal-detail'); const tag = document.querySelector('#deal-view .tag');
    if (!detail || !tag || detail.querySelector('#portal-trc-request') || !detail.textContent.includes('USDT · TRC20 deposit') || !detail.textContent.includes('Ready to deposit')) return;
    const code = tag.textContent.match(/[A-Z]{5}/)?.[0]; if (!code) return;
    const button = document.createElement('button'); button.id = 'portal-trc-request'; button.className = 'button'; button.textContent = 'I have sent USDT — request confirmation'; button.onclick = async () => { try { await api(`/api/deals/code/${code}/usdt-pending`, { method:'POST' }); notice('TRC20 confirmation request sent to XCROW Support.'); location.reload(); } catch (error) { notice(error.message); } }; detail.querySelector('.usdt-payment')?.after(button);
  }
  function addLiveSupport() {
    if (!document.querySelector('#app') || document.querySelector('#live-support')) return;
    const button = document.createElement('button'); button.id = 'live-support'; button.className = 'button'; button.innerHTML = '<img src="/support-bot.svg" alt="" style="width:20px;height:20px;vertical-align:middle;margin-right:7px">Live support'; Object.assign(button.style, { position:'fixed', right:'18px', bottom:'18px', zIndex:90 }); document.body.append(button);
    button.onclick = async () => { try { const existing = await api('/api/support/ticket'); const dialog = document.createElement('dialog'); dialog.innerHTML = `<form class="modal"><button class="close" type="button">×</button><span class="tag">XCROW HELP DESK</span><h2>Live human support</h2><p>Message the XCROW Support team directly. Replies arrive here automatically while this conversation is open.</p><div id="support-conversation" style="max-height:230px;overflow:auto">${existing?.messages?.map(message => `<p><b>${safe(message.sender)}</b><br>${safe(message.body)}</p>`).join('') || '<p>No messages yet. Send a message to start.</p>'}</div><textarea name="body" required placeholder="Describe your issue" style="width:100%;margin:10px 0;padding:10px"></textarea><button class="button">Send to XCROW Support</button></form>`; document.body.append(dialog); dialog.showModal(); const refresh = async () => { try { const ticket = await api('/api/support/ticket'); const area = dialog.querySelector('#support-conversation'); if (ticket && area) area.innerHTML = ticket.messages.map(message => `<p><b>${safe(message.sender)}</b><br>${safe(message.body)}<br><small>${new Date(message.at).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</small></p>`).join(''); } catch {} }; const timer = setInterval(refresh, 2000); dialog.querySelector('.close').onclick = () => { clearInterval(timer); dialog.close(); }; dialog.querySelector('form').onsubmit = async event => { event.preventDefault(); try { await api('/api/support/ticket', { method:'POST', body:JSON.stringify({ body:new FormData(event.currentTarget).get('body') }) }); event.currentTarget.elements.body.value = ''; await refresh(); } catch (error) { notice(error.message); } }; } catch (error) { notice(error.message); } };
  }
  async function verifySessionAndName() {
    const stored = localStorage.getItem('xcrow_token');
    if (!stored || window.__xcrowSessionChecked) return;
    window.__xcrowSessionChecked = true;
    try {
      const response = await fetch('/api/auth/me', { headers: { Authorization:`Bearer ${stored}` } });
      const data = response.headers.get('content-type')?.includes('application/json') ? await response.json().catch(() => null) : null;
      if (response.status === 401) { localStorage.removeItem('xcrow_token'); localStorage.removeItem('xcrow_user'); location.assign('/'); return; }
      if (!response.ok || !data?.user?.id) return;
      localStorage.setItem('xcrow_user', JSON.stringify(data.user));
      if (window.xcrowState) { window.xcrowState.user = data.user; document.querySelector('#side-name') && (document.querySelector('#side-name').textContent = data.user.name); }
      const heading = document.querySelector('#history-view h2'); if (heading) heading.textContent = `Welcome, ${data.user.name}`;
    } catch { /* keep the session if the service is temporarily unavailable */ }
  }
  function renameWallet() {
    document.querySelectorAll('.side').forEach(item => { if (item.dataset.view === 'settings') item.textContent = '◈ Wallet'; });
    const setup = document.querySelector('.setup-card'); if (setup) { const label = setup.querySelector('b'); const action = setup.querySelector('button'); if (label) label.textContent = 'Configure Wallet first ◈'; if (action) action.textContent = 'Open Wallet'; }
    const settings = document.querySelector('#settings-view'); if (settings?.textContent) { const tag = settings.querySelector('.tag'); const heading = settings.querySelector('h2'); if (tag) tag.textContent = 'WALLET'; if (heading) heading.textContent = 'Configure Wallet'; }
  }
  function customizeReceiptButton() {
    const receipt = document.querySelector('.receipt[data-receipt]'); if (!receipt || receipt.dataset.customized) return;
    receipt.dataset.customized = '1'; receipt.textContent = 'Download official receipt ↓'; receipt.style.cssText = 'display:inline-flex;align-items:center;background:#11213d;border:0;border-radius:7px;color:#fff;cursor:pointer;font-size:12px;font-weight:700;margin:14px 0;padding:11px 14px;text-decoration:none;';
    receipt.setAttribute('title', 'Download your XCROW payment or release receipt');
  }
  function correctAdminLoginCopy() {
    const note = document.querySelector('.admin-login-note');
    if (note) { note.textContent = 'Use the administrator email in Render ADMIN_EMAILS and the private ADMIN_PASSWORD set in Render.'; const signup = document.querySelector('#login [data-switch="signup"]'); if (signup?.closest('p')) signup.closest('p').hidden = true; }
  }
  function secureAdminForm() {
    const form = document.querySelector('#login .auth-form');
    if (!form || form.dataset.adminSecure || location.hash !== '#admin') return;
    form.dataset.adminSecure = '1'; form.onsubmit = async event => { event.preventDefault(); const message = form.querySelector('.message'); message.textContent = 'Signing in securely…'; message.style.color = '#15803d'; try { const data = await api('/api/auth/admin-login', { method:'POST', body:JSON.stringify(Object.fromEntries(new FormData(form))) }); localStorage.setItem('xcrow_token', data.token); localStorage.setItem('xcrow_user', JSON.stringify(data.user)); location.reload(); } catch (error) { message.textContent = error.message; message.style.color = '#b91c1c'; } };
  }
  function showStkApprovalFlow() {
    const current = window.xcrowState?.deals?.find(deal => deal._id === window.xcrowState?.active);
    const payment = current?.payments?.at(-1);
    const currentRole = current?.parties?.find(party => String(party.user) === String(window.xcrowState?.user?.id))?.role;
    if (!current || current.currency !== 'KES' || currentRole !== current.depositRole || !payment || payment.method !== 'KES_STK' || payment.status !== 'pending') return;
    const flowKey = `xcrow-stk-flow-${payment.reference}`;
    if (sessionStorage.getItem(`${flowKey}-dismissed`) || document.querySelector('#stk-approval-flow')) return;
    const modal = document.createElement('div'); modal.id = 'stk-approval-flow'; modal.innerHTML = `<div class="stk-card"><button type="button" class="stk-close" aria-label="Close">×</button><div class="stk-rings"><span>◉</span></div><div class="stk-brand">XCROW SECURE PAYMENT</div><h2>STK prompt sent</h2><p>Approve the M-Pesa prompt on your phone.</p><b>Checking your XCROW payment securely…</b><small>Reference: ${safe(payment.reference)}</small><div class="stk-state">Awaiting approval</div><button type="button" class="copy stk-resend">Resend prompt</button></div>`; document.body.append(modal);
    const close = () => { sessionStorage.setItem(`${flowKey}-dismissed`, '1'); modal.remove(); };
    modal.querySelector('.stk-close').onclick = close;
    modal.querySelector('.stk-resend').onclick = async event => { try { event.currentTarget.disabled = true; event.currentTarget.textContent = 'Sending…'; await api(`/api/deals/${current._id}/resend-stk`, { method:'POST' }); event.currentTarget.textContent = 'Prompt resent ✓'; } catch (error) { event.currentTarget.disabled = false; event.currentTarget.textContent = error.message; } };
    const poll = setInterval(async () => { try { const latest = await api('/api/deals'); const next = latest.find(deal => deal._id === current._id); if (!next) return; window.xcrowState.deals = latest; const nextPayment = next.payments?.find(item => item.reference === payment.reference) || next.payments?.at(-1); if (nextPayment?.status === 'paid' || next.status === 'Funded') { clearInterval(poll); modal.querySelector('.stk-rings').classList.add('approved'); modal.querySelector('h2').textContent = 'Payment confirmed'; modal.querySelector('p').textContent = 'XCROW has confirmed your M-Pesa payment.'; modal.querySelector('.stk-state').textContent = 'Escrow funded ✓'; modal.querySelector('.stk-resend').remove(); setTimeout(close, 2500); } } catch {} }, 3000);
    modal.addEventListener('DOMNodeRemoved', () => clearInterval(poll), { once:true });
  }
  async function promptForMpesaBeforeDeposit(event) {
    const button = event.target.closest('#deposit'); if (!button || button.dataset.walletChecked) return; event.preventDefault(); event.stopImmediatePropagation(); button.dataset.walletChecked = '1'; const deal = window.xcrowState?.deals?.find(item => item._id === window.xcrowState?.active);
    try { const account = await api('/api/profile'); if (account.profile?.mpesaNumber) return startCheckout(deal); const dialog = document.createElement('dialog'); dialog.innerHTML = `<form class="modal"><button class="close" type="button">×</button><span class="tag">SET UP WALLET</span><h2>Add M-Pesa number</h2><p>XCROW will send this escrow's STK prompt to this number and save it in your Wallet for future deposits.</p><label>M-Pesa number<input name="mpesaNumber" inputmode="tel" placeholder="0712345678" required></label><button class="button full">Save and send prompt</button><small class="message"></small></form>`; document.body.append(dialog); dialog.showModal(); dialog.querySelector('.close').onclick = () => dialog.close(); dialog.querySelector('form').onsubmit = async submit => { submit.preventDefault(); const form = submit.currentTarget; try { const number = new FormData(form).get('mpesaNumber'); await api('/api/profile', { method:'PUT', body:JSON.stringify({ profile:{ mpesaNumber:number, trc20Address:account.profile?.trc20Address || '', binanceId:account.profile?.binanceId || '' } }) }); dialog.close(); await startCheckout(deal); } catch (error) { form.querySelector('.message').textContent = error.message; } }; } catch (error) { notice(error.message); }
  }
  async function addProfileEditor() {
    const form = document.querySelector('#profile-form'); if (!form || form.dataset.accountEditor) return; form.dataset.accountEditor = '1';
    try { const account = await api('/api/profile'); const editor = document.createElement('form'); editor.className = 'deal-form'; editor.style.marginBottom = '15px'; editor.innerHTML = `<span class="tag">PROFILE</span><h3 style="margin:8px 0">Your account</h3><label>Registered name<input name="name" value="${safe(account.name)}" required></label><label>Email address<input value="${safe(account.email)}" disabled></label><p class="detail-meta">Your Gmail is locked and cannot be changed.</p><button class="copy">Save name</button><small class="message"></small>`; form.before(editor); editor.onsubmit = async event => { event.preventDefault(); try { const updated = await api('/api/profile/account', { method:'PUT', body:JSON.stringify({ name:new FormData(editor).get('name') }) }); window.xcrowState.user.name = updated.name; localStorage.setItem('xcrow_user', JSON.stringify(window.xcrowState.user)); const side = document.querySelector('#side-name'); if (side) side.textContent = updated.name; editor.querySelector('.message').textContent = 'Name saved.'; editor.querySelector('.message').style.color = '#15803d'; } catch (error) { editor.querySelector('.message').textContent = error.message; editor.querySelector('.message').style.color = '#b91c1c'; } }; } catch { form.dataset.accountEditor = ''; }
  }
  function addEscrowAnimation() {
    const hero = document.querySelector('.hero'); if (!hero || document.querySelector('#escrow-motion')) return;
    const animation = document.createElement('section'); animation.id = 'escrow-motion'; animation.innerHTML = '<div><span class="tag">A LIVE ESCROW FLOW</span><h2>Protected from agreement to release.</h2><p>Every stage stays visible to the people in the deal room.</p></div><div class="motion-stage"><div class="motion-person buyer">Buyer</div><div class="motion-lock">🔒<small>XCROW</small></div><div class="motion-person seller">Seller</div><i class="motion-pulse one"></i><i class="motion-pulse two"></i><div class="motion-caption">Funds protected until release</div></div>'; hero.after(animation);
    const style = document.createElement('style'); style.textContent = '#escrow-motion{align-items:center;background:#fff;display:grid;gap:35px;grid-template-columns:1fr 1fr;padding:58px max(22px,10vw)}#escrow-motion h2{font-size:31px;letter-spacing:-1px;margin:8px 0}#escrow-motion p{color:#64748b;line-height:1.7}.motion-stage{align-items:center;background:linear-gradient(135deg,#eff6ff,#f8fafc);border:1px solid #dce3ed;border-radius:16px;display:flex;height:240px;justify-content:space-around;overflow:hidden;position:relative}.motion-person{background:#fff;border:1px solid #bfdbfe;border-radius:50%;box-shadow:0 8px 24px #2563eb20;color:#1e40af;font-size:12px;font-weight:800;padding:30px 14px;z-index:2}.motion-lock{align-items:center;background:#11213d;border:6px solid #38bdf8;border-radius:50%;box-shadow:0 0 0 12px #38bdf826;display:flex;flex-direction:column;font-size:36px;height:92px;justify-content:center;width:92px;z-index:2;animation:lockFloat 2.7s ease-in-out infinite}.motion-lock small{color:#fff;font-size:9px;font-weight:800;margin-top:2px}.motion-pulse{background:#2563eb;border-radius:50%;height:9px;left:22%;position:absolute;top:49%;width:9px;animation:moveFunds 3.3s ease-in-out infinite}.motion-pulse.two{animation-delay:1.65s}.motion-caption{bottom:20px;color:#2563eb;font-size:11px;font-weight:800;left:0;position:absolute;text-align:center;width:100%}@keyframes moveFunds{0%{left:24%;opacity:0}12%{opacity:1}75%{opacity:1}100%{left:74%;opacity:0}}@keyframes lockFloat{50%{transform:translateY(-9px) rotate(3deg)}}@media(max-width:700px){#escrow-motion{grid-template-columns:1fr;padding:43px 24px}.motion-stage{height:190px}}'; document.head.append(style);
  }
  async function addAdminTickets() {
    // Live-support inbox is rendered by the structured administrator dashboard.
    return;
    const panel = document.querySelector('#admin-view[data-portal-ready]'); if (!panel || panel.querySelector('#admin-tickets')) return;
    try { const tickets = await api('/api/admin/support-tickets'); const section = document.createElement('section'); section.id = 'admin-tickets'; section.className = 'admin-list'; section.innerHTML = `<h3>Live support inbox</h3>${tickets.map(ticket => `<div class="invite-box"><b>${safe(ticket.userName)} · ${safe(ticket.email)}</b><p>${ticket.messages.map(message => `<b>${safe(message.sender)}:</b> ${safe(message.body)}`).join('<br>')}</p><textarea data-ticket="${ticket._id}" placeholder="Reply as XCROW Support"></textarea><button class="button" data-reply="${ticket._id}">Reply</button></div>`).join('') || '<p>No support messages yet.</p>'}`; panel.append(section); section.querySelectorAll('[data-reply]').forEach(button => button.onclick = async () => { try { const body = section.querySelector(`[data-ticket="${button.dataset.reply}"]`).value; await api(`/api/admin/support-tickets/${button.dataset.reply}/reply`, { method:'POST', body:JSON.stringify({ body }) }); notice('Support reply sent.'); section.remove(); addAdminTickets(); } catch (error) { notice(error.message); } }); } catch {};
  }
  async function refreshEscrowConversation() {
    const chat = document.querySelector('#chat'); const tag = document.querySelector('#deal-view .tag'); if (!chat || !tag || document.activeElement?.closest('#chat-form')) return;
    const code = tag.textContent.match(/[A-Z]{5}/)?.[0]; if (!code) return;
    try { const messages = await api(`/api/deals/code/${code}/messages`); const signature = messages.map(message => `${message._id}:${message.updatedAt}`).join('|'); if (chat.dataset.signature === signature) return; chat.dataset.signature = signature; chat.innerHTML = messages.length ? messages.map(message => `<p><b>${safe(message.senderName)}</b><span>${safe(message.body)}</span><small>${new Date(message.createdAt).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</small></p>`).join('') : '<small>No messages yet. Start the conversation.</small>'; chat.scrollTop = chat.scrollHeight; } catch {};
  }
  verifySessionAndName(); addEscrowAnimation(); secureAdminForm();
  document.addEventListener('click', promptForMpesaBeforeDeposit, true);
  setInterval(() => { if (location.hash === '#admin') { if (!document.querySelector('#admin-view')?.dataset.portalReady) renderAdmin(); addAdminTickets(); } addTrcRequest(); addLiveSupport(); renameWallet(); customizeReceiptButton(); correctAdminLoginCopy(); secureAdminForm(); showStkApprovalFlow(); addProfileEditor(); }, 500);
  setInterval(refreshEscrowConversation, 2000);
  setInterval(() => { const inbox = document.querySelector('#admin-tickets'); if (inbox && !inbox.contains(document.activeElement)) { inbox.remove(); addAdminTickets(); } }, 3000);
})();
