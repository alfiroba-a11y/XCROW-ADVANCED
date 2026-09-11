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
      const drawDeals = query => { const filtered = data.escrows.filter(deal => JSON.stringify(deal).toLowerCase().includes(query.toLowerCase())); dealList.innerHTML = filtered.map(deal => `<div class="invite-box"><b>${safe(deal.code)} · ${safe(deal.title)}</b><p>${money(deal)} · <span class="status">${safe(deal.status)}</span></p><p>${safe(deal.description || '')}</p><p>${deal.parties.map(p => `${safe(p.name)} (${safe(p.role)}) · ${safe(p.email)}`).join('<br>')}</p>${deal.currency === 'USDT' && deal.status !== 'Funded' ? `<input data-crypto-hash="${deal._id}" placeholder="TRC20 transaction hash"><button class="button" data-crypto-confirm="${deal._id}">Mark crypto funded</button>` : ''}<button class="copy" data-support="${deal._id}">Join as XCROW Support</button> <button class="copy" data-dispute="${deal._id}">Open dispute review</button> <button class="button" data-chat="${deal._id}">Open chat</button></div>`).join('') || '<p>No escrows match.</p>'; bindDealButtons(); };
      const bindDealButtons = () => {
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
    button.onclick = async () => { try { const existing = await api('/api/support/ticket'); const dialog = document.createElement('dialog'); dialog.innerHTML = `<form class="modal"><button class="close" type="button">×</button><span class="tag">XCROW HELP DESK</span><h2>Live support</h2><p>Automated help: For KES, use your saved M-Pesa number. For USDT, send only TRC20. For account-specific help, send a message below and XCROW Support will reply here.</p><div style="max-height:230px;overflow:auto">${existing?.messages?.map(message => `<p><b>${safe(message.sender)}</b><br>${safe(message.body)}</p>`).join('') || '<p>No previous messages.</p>'}</div><textarea name="body" required placeholder="Describe your issue" style="width:100%;margin:10px 0;padding:10px"></textarea><button class="button">Send to XCROW Support</button></form>`; document.body.append(dialog); dialog.showModal(); dialog.querySelector('.close').onclick = () => dialog.close(); dialog.querySelector('form').onsubmit = async event => { event.preventDefault(); try { await api('/api/support/ticket', { method:'POST', body:JSON.stringify({ body:new FormData(event.currentTarget).get('body') }) }); dialog.close(); notice('Your message was sent to XCROW Support.'); } catch (error) { notice(error.message); } }; } catch (error) { notice(error.message); } };
  }
  async function addAdminTickets() {
    const panel = document.querySelector('#admin-view[data-portal-ready]'); if (!panel || panel.querySelector('#admin-tickets')) return;
    try { const tickets = await api('/api/admin/support-tickets'); const section = document.createElement('section'); section.id = 'admin-tickets'; section.className = 'admin-list'; section.innerHTML = `<h3>Live support inbox</h3>${tickets.map(ticket => `<div class="invite-box"><b>${safe(ticket.userName)} · ${safe(ticket.email)}</b><p>${ticket.messages.map(message => `<b>${safe(message.sender)}:</b> ${safe(message.body)}`).join('<br>')}</p><textarea data-ticket="${ticket._id}" placeholder="Reply as XCROW Support"></textarea><button class="button" data-reply="${ticket._id}">Reply</button></div>`).join('') || '<p>No support messages yet.</p>'}`; panel.append(section); section.querySelectorAll('[data-reply]').forEach(button => button.onclick = async () => { try { const body = section.querySelector(`[data-ticket="${button.dataset.reply}"]`).value; await api(`/api/admin/support-tickets/${button.dataset.reply}/reply`, { method:'POST', body:JSON.stringify({ body }) }); notice('Support reply sent.'); section.remove(); addAdminTickets(); } catch (error) { notice(error.message); } }); } catch {};
  }
  setInterval(() => { if (location.hash === '#admin') { if (!document.querySelector('#admin-view')?.dataset.portalReady) renderAdmin(); addAdminTickets(); } addTrcRequest(); addLiveSupport(); }, 500);
})();
