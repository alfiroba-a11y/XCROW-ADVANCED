(() => {
  const token = () => localStorage.getItem('xcrow_token');
  const api = async (path, options = {}) => {
    const response = await fetch(path, { ...options, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}`, ...(options.headers || {}) } });
    const data = response.headers.get('content-type')?.includes('application/json') ? await response.json() : null;
    if (!response.ok) throw new Error(data?.error || 'Request failed.');
    return data;
  };
  const safe = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
  const money = deal => `${Number(deal.fee?.buyerTotal || deal.amount || 0).toLocaleString()} ${safe(deal.currency)}`;
  const notice = text => { const box = document.createElement('div'); box.textContent = text; Object.assign(box.style, { position:'fixed', top:'18px', right:'18px', zIndex:9999, background:'#12213a', color:'#fff', padding:'12px 15px', borderRadius:'8px' }); document.body.append(box); setTimeout(() => box.remove(), 3500); };

  async function renderAdmin() {
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
      const data = await response.json();
      if (!response.ok || !data?.user?.id) throw new Error();
      localStorage.setItem('xcrow_user', JSON.stringify(data.user));
      if (window.xcrowState) { window.xcrowState.user = data.user; document.querySelector('#side-name') && (document.querySelector('#side-name').textContent = data.user.name); }
      const heading = document.querySelector('#history-view h2'); if (heading) heading.textContent = `Welcome, ${data.user.name}`;
    } catch { localStorage.removeItem('xcrow_token'); localStorage.removeItem('xcrow_user'); location.assign('/'); }
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
  async function addAdminTickets() {
    const panel = document.querySelector('#admin-view[data-portal-ready]'); if (!panel || panel.querySelector('#admin-tickets')) return;
    try { const tickets = await api('/api/admin/support-tickets'); const section = document.createElement('section'); section.id = 'admin-tickets'; section.className = 'admin-list'; section.innerHTML = `<h3>Live support inbox</h3>${tickets.map(ticket => `<div class="invite-box"><b>${safe(ticket.userName)} · ${safe(ticket.email)}</b><p>${ticket.messages.map(message => `<b>${safe(message.sender)}:</b> ${safe(message.body)}`).join('<br>')}</p><textarea data-ticket="${ticket._id}" placeholder="Reply as XCROW Support"></textarea><button class="button" data-reply="${ticket._id}">Reply</button></div>`).join('') || '<p>No support messages yet.</p>'}`; panel.append(section); section.querySelectorAll('[data-reply]').forEach(button => button.onclick = async () => { try { const body = section.querySelector(`[data-ticket="${button.dataset.reply}"]`).value; await api(`/api/admin/support-tickets/${button.dataset.reply}/reply`, { method:'POST', body:JSON.stringify({ body }) }); notice('Support reply sent.'); section.remove(); addAdminTickets(); } catch (error) { notice(error.message); } }); } catch {};
  }
  async function refreshEscrowConversation() {
    const chat = document.querySelector('#chat'); const tag = document.querySelector('#deal-view .tag'); if (!chat || !tag || document.activeElement?.closest('#chat-form')) return;
    const code = tag.textContent.match(/[A-Z]{5}/)?.[0]; if (!code) return;
    try { const messages = await api(`/api/deals/code/${code}/messages`); const signature = messages.map(message => `${message._id}:${message.updatedAt}`).join('|'); if (chat.dataset.signature === signature) return; chat.dataset.signature = signature; chat.innerHTML = messages.length ? messages.map(message => `<p><b>${safe(message.senderName)}</b><span>${safe(message.body)}</span><small>${new Date(message.createdAt).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</small></p>`).join('') : '<small>No messages yet. Start the conversation.</small>'; chat.scrollTop = chat.scrollHeight; } catch {};
  }
  verifySessionAndName();
  setInterval(() => { if (location.hash === '#admin') { if (!document.querySelector('#admin-view')?.dataset.portalReady) renderAdmin(); addAdminTickets(); } addTrcRequest(); addLiveSupport(); renameWallet(); customizeReceiptButton(); }, 500);
  setInterval(refreshEscrowConversation, 2000);
  setInterval(() => { const inbox = document.querySelector('#admin-tickets'); if (inbox && !inbox.contains(document.activeElement)) { inbox.remove(); addAdminTickets(); } }, 3000);
})();
