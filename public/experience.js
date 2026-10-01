(() => {
  try {
    const home = document.querySelector('main');
    if (!home || document.querySelector('#xcrow-experience')) return;
    const improvements = [
      ['01','Start-ready guide','A short pre-deposit checklist helps participants confirm the amount, fee, and payment method.'],
      ['02','Status language','Plain labels explain whether a deal is waiting, ready, funded, under review, or closed.'],
      ['03','Deal snapshot','The deal code, amount, currency, and creation time stay together in the escrow room.'],
      ['04','Share tools','Copy or share a concise deal summary when you need to coordinate with the other party.'],
      ['05','Mobile-first controls','Core navigation and deal actions remain available on smaller screens.'],
      ['06','Saved wallet details','M-Pesa and receiving-wallet details can be stored and edited from Wallet settings.'],
      ['07','Fee visibility','See the calculated amount, payer choice, and seller proceeds before you create the deal.'],
      ['08','Network guardrail','USDT escrow screens remind participants to use the TRC20 network only.'],
      ['09','Receipt record','Confirmed payments have a downloadable XCROW transaction receipt.'],
      ['10','Timeline view','A five-step progress line makes the next action easy to identify.'],
      ['11','Code protection','Five-letter escrow codes keep parties in one shared deal room.'],
      ['12','Role clarity','Buyer, seller, and optional third-party roles are displayed in each deal.'],
      ['13','In-room chat','Keep transaction communication with the people in the same escrow.'],
      ['14','Support invite','Either party can add XCROW Support to an active escrow when help is needed.'],
      ['15','Appeal access','Settled deals offer an appeal route that brings in support for review.'],
      ['16','Settlement closure','Released and refunded sessions become read-only to preserve the completed record.'],
      ['17','Inactivity safety','Unused setup sessions close after one hour, limiting abandoned deal rooms.'],
      ['18','Feedback loop','Buyer and seller can rate a closed released or refunded escrow experience.'],
      ['19','Live refresh','Open deal rooms refresh their status so participants can see confirmed changes.'],
      ['20','Human help','XCROW Support is available through live support and xcrowsupport@gmail.com.']
    ];
    const section = document.createElement('section');
    section.id = 'xcrow-experience';
    section.innerHTML = `<div class="xp-intro"><span>XCROW EXPERIENCE</span><h2>Designed for confidence at every click.</h2><p>Twenty practical touches that make an escrow easier to understand, manage, and complete—without getting in the way of the transaction.</p><button type="button" id="xp-open-guide">Open start guide</button></div><div class="xp-grid">${improvements.map(([number,title,text]) => `<article><small>${number}</small><h3>${title}</h3><p>${text}</p></article>`).join('')}</div>`;
    const style = document.createElement('style');
    style.textContent = '#xcrow-experience{background:#0e2343;color:#fff;padding:72px max(22px,10vw)}#xcrow-experience .xp-intro{display:grid;gap:18px;grid-template-columns:1fr auto;align-items:end;margin-bottom:30px}#xcrow-experience .xp-intro span{color:#8fd3ff;font-size:10px;font-weight:800;letter-spacing:.13em}#xcrow-experience h2{font-size:clamp(31px,4.2vw,51px);letter-spacing:-1.8px;line-height:1.05;margin:8px 0}#xcrow-experience .xp-intro p{color:#c4d5e9;line-height:1.7;max-width:650px}#xp-open-guide{background:#fff;border:0;border-radius:7px;color:#12213a;font-size:12px;font-weight:800;padding:12px 15px;white-space:nowrap}.xp-grid{display:grid;gap:11px;grid-template-columns:repeat(4,1fr)}.xp-grid article{background:#17365f;border:1px solid #2f5788;border-radius:11px;min-height:164px;padding:17px}.xp-grid small{color:#7dd3fc;font-family:monospace;font-size:10px}.xp-grid h3{font-size:13px;margin:13px 0 7px}.xp-grid p{color:#c7d8eb;font-size:11px;line-height:1.6;margin:0}@media(max-width:820px){.xp-grid{grid-template-columns:1fr 1fr}#xcrow-experience .xp-intro{grid-template-columns:1fr}#xp-open-guide{justify-self:start}}@media(max-width:470px){#xcrow-experience{padding:48px 22px}.xp-grid{grid-template-columns:1fr}.xp-grid article{min-height:auto}}';
    document.head.append(style);
    const anchor = document.querySelector('#platform-details') || document.querySelector('.cta');
    anchor?.after(section);
    section.querySelector('#xp-open-guide').onclick = () => {
      const dialog = document.createElement('dialog');
      dialog.innerHTML = '<div style="background:#fff;border-radius:12px;max-width:470px;padding:25px;position:relative;width:calc(100vw - 28px)"><button type="button" aria-label="Close" style="background:transparent;border:0;color:#64748b;font-size:24px;position:absolute;right:12px;top:7px">×</button><span style="color:#2563eb;font-size:10px;font-weight:800;letter-spacing:.12em">XCROW START GUIDE</span><h2 style="font-size:27px;letter-spacing:-1px;margin:10px 0">Before you create an escrow</h2><ol style="color:#475569;font-size:13px;line-height:1.8;padding-left:20px"><li>Agree on the goods or service, amount, and who pays the fee.</li><li>Choose KES or USDT on TRC20 only.</li><li>Save the payment details you need in Wallet.</li><li>Create one deal and share its five-letter code with the other party.</li><li>Confirm readiness together before the selected payer deposits.</li></ol></div>';
      document.body.append(dialog); dialog.showModal(); const close = () => { dialog.close(); dialog.remove(); }; dialog.querySelector('button').onclick = close; dialog.addEventListener('cancel', close, { once:true });
    };
  } catch (error) { console.warn('XCROW experience layer unavailable; core escrow functions remain active.', error); }
})();
