'use strict';
const CATEGORY_NAMES = {all:'كل الأصناف',main:'الأطباق الرئيسية',salad:'السلطات',healthy:'الأكل الصحي',app:'المقبلات'};
const STORAGE_KEY='zad-wa-melh-cart-v1';
const $ = (id) => document.getElementById(id);
const itemMap = Object.fromEntries(MENU.map(x => [x.id,x]));
const money=(value)=>Number(value||0).toFixed(2)+' د.أ';
const safe=(value)=>String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let filter='all',term='',shown=12,cart=[],toastTimer;
try{const saved=JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]');if(Array.isArray(saved)){cart=saved.filter(x=>itemMap[x.id]&&Number.isInteger(x.size)&&itemMap[x.id].sizes[x.size]&&Number.isInteger(x.qty)&&x.qty>0&&x.qty<=99)}}catch(e){cart=[]}
function store(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(cart))}catch(e){}}
function toast(message){$('toast').textContent=message;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),2900)}
function normal(str){return String(str||'').normalize('NFKD').replace(/[\u064B-\u065F]/g,'').replace(/أ|إ|آ/g,'ا').replace(/ة/g,'ه').replace(/ى/g,'ي').toLowerCase()}
function dishCard(dish){
  const first=dish.sizes[0].price;
  const priced=dish.sizes.some(x=>x.price!==null);
  const priceText=priced?`<span class="dish-price" data-card-price>${money(first)}</span>`:`<span class="price-on-request" data-card-price>السعر عند الاستفسار</span>`;
  const sizes=dish.sizes.map((s,i)=>`<option value="${i}">${safe(s.name)}${s.price!==null?' — '+money(s.price):''}</option>`).join('');
  const desc=safe(dish.description||'لم تُحدّد مكونات هذا الصنف؛ يرجى الاستفسار من المطعم.');
  return `<article class="dish-card" data-dish-id="${dish.id}">
    <div class="dish-image"><img loading="lazy" decoding="async" src="${dish.image}" alt="${safe(dish.name)}" />${dish.featured?'<span class="dish-badge">من أطباقنا المميزة ✦</span>':''}<span class="dish-category">${CATEGORY_NAMES[dish.category]}</span></div>
    <div class="dish-info"><h4 class="dish-title">${safe(dish.name)}</h4><p class="dish-desc">${desc}</p>
    <div class="dish-price-row"><span class="price-label">${priced?'السعر':'الأسعار'}</span>${priceText}</div>
    <div class="menu-card-footer"><div class="size-select-wrap"><label for="size-${dish.id}">الحجم:</label><select class="size-select" id="size-${dish.id}" aria-label="اختر حجم ${safe(dish.name)}">${sizes}</select></div>
    <button class="add-button" type="button" data-add="${dish.id}"><span class="plus">＋</span>${priced?'إضافة للطلب':'أضف للاستفسار'}</button></div></div>
  </article>`
}
function visibleMenu(){return MENU.filter(d=>(filter==='all'||d.category===filter)&&normal(d.name+' '+(d.description||'')+' '+CATEGORY_NAMES[d.category]).includes(normal(term)))}
function renderMenu(){
 const results=visibleMenu();$('currentCategory').innerHTML=safe(CATEGORY_NAMES[filter])+' <span class="menu-flourish">✦</span>';
 $('resultCount').textContent=results.length+' صنف';$('menuGrid').innerHTML=results.slice(0,shown).map(dishCard).join('');
 $('noResults').hidden=results.length!==0;$('showMore').hidden=results.length<=shown;
 $('showMore').textContent=`عرض المزيد (${results.length-shown} متبقي) ↓`;
}
function setFilter(value){filter=value;shown=12;document.querySelectorAll('.filter-btn').forEach(b=>{const sel=b.dataset.filter===value;b.classList.toggle('selected',sel);b.setAttribute('aria-pressed',String(sel))});renderMenu()}
// قائمة أقسام واضحة وقابلة للاستخدام على الهواتف الصغيرة.
const mobileToggle=$('menuToggle'),mainNav=$('mainNav');
function closeMobileNav(){mainNav.classList.remove('nav-visible');mobileToggle.setAttribute('aria-expanded','false');mobileToggle.setAttribute('aria-label','فتح قائمة الأقسام');}
mobileToggle.addEventListener('click',()=>{const open=!mainNav.classList.contains('nav-visible');mainNav.classList.toggle('nav-visible',open);mobileToggle.setAttribute('aria-expanded',String(open));mobileToggle.setAttribute('aria-label',open?'إغلاق قائمة الأقسام':'فتح قائمة الأقسام');});
mainNav.addEventListener('click',e=>{if(e.target.closest('a'))closeMobileNav()});
document.addEventListener('click',e=>{if(!e.target.closest('.nav-wrap'))closeMobileNav()});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMobileNav()});
window.addEventListener('resize',()=>{if(window.innerWidth>760)closeMobileNav()});
$('categoryTabs').addEventListener('click',e=>{const b=e.target.closest('[data-filter]');if(b)setFilter(b.dataset.filter)});
$('menuSearch').addEventListener('input',e=>{term=e.target.value;shown=12;renderMenu()});
$('resetFilter').addEventListener('click',()=>{term='';$('menuSearch').value='';setFilter('all')});
$('showMore').addEventListener('click',()=>{shown+=12;renderMenu()});
$('menuGrid').addEventListener('change',e=>{if(!e.target.matches('.size-select'))return;const card=e.target.closest('.dish-card'),d=itemMap[card.dataset.dishId],s=d.sizes[Number(e.target.value)],el=card.querySelector('[data-card-price]');el.textContent=s.price===null?'السعر عند الاستفسار':money(s.price)});
$('menuGrid').addEventListener('click',e=>{const b=e.target.closest('[data-add]');if(!b)return;const card=b.closest('.dish-card');addItem(b.dataset.add,Number(card.querySelector('select').value))});
function addItem(id,size){const existing=cart.find(i=>i.id===id&&i.size===size);if(existing){existing.qty=Math.min(99,existing.qty+1)}else cart.push({id,size,qty:1});store();renderCart();toast('أضفنا '+itemMap[id].name+' لطلباتك ✓')}
function changeQty(id,size,delta){let x=cart.find(i=>i.id===id&&i.size===size);if(!x)return;x.qty+=delta;if(x.qty<=0)cart=cart.filter(i=>i!==x);x.qty=Math.min(99,x.qty);store();renderCart()}
function cartInfo(){let quantity=0,total=0,missing=false;for(const row of cart){const d=itemMap[row.id],s=d.sizes[row.size];quantity+=row.qty;if(s.price===null)missing=true;else total+=s.price*row.qty}return{quantity,total,missing}}
function renderCart(){const {quantity,total,missing}=cartInfo();$('cartCount').textContent=quantity;$('drawerCount').textContent=`(${quantity})`;$('mobileCount').textContent=quantity;$('cartTotal').textContent=money(total);$('mobileCartTotal').textContent=money(total);$('priceNote').textContent=missing?'المجموع لا يشمل الأصناف التي تحتاج تأكيد سعرها ولا رسوم التوصيل.':'المجموع لا يشمل التوصيل، ويتم تأكيد السعر النهائي مع المطعم.';
 $('shareOrder').disabled=cart.length===0;$('copyOrder').disabled=cart.length===0;
 if(!cart.length){$('cartItems').innerHTML='<div class="cart-empty"><span class="empty-graphic">❦</span><h3>سلتك لسه فاضية</h3><p>اختار الأكلات اللي بتحبها ورح تلاقيها هون.</p></div>';return}
 $('cartItems').innerHTML=cart.map(x=>{const d=itemMap[x.id],s=d.sizes[x.size];return `<div class="cart-item"><img src="${d.image}" alt="${safe(d.name)}" loading="lazy"><div class="cart-item-info"><h3>${safe(d.name)}</h3><p>${safe(s.name)}</p><strong>${s.price===null?'السعر عند الاستفسار':money(s.price*x.qty)}</strong></div><div class="cart-qty"><button type="button" aria-label="إزالة واحد من ${safe(d.name)}" data-qty="-1" data-id="${d.id}" data-size="${x.size}">−</button><span>${x.qty}</span><button type="button" aria-label="إضافة واحد من ${safe(d.name)}" data-qty="1" data-id="${d.id}" data-size="${x.size}">+</button></div></div>`}).join('')
}
$('cartItems').addEventListener('click',e=>{let b=e.target.closest('[data-qty]');if(b)changeQty(b.dataset.id,Number(b.dataset.size),Number(b.dataset.qty))});
let lastFocus=null;
function openCart(){lastFocus=document.activeElement;$('drawerOverlay').hidden=false;$('cartDrawer').classList.add('open');$('cartDrawer').setAttribute('aria-hidden','false');document.body.style.overflow='hidden';$('cartClose').focus()}
function closeCart(){$('cartDrawer').classList.remove('open');$('cartDrawer').setAttribute('aria-hidden','true');$('drawerOverlay').hidden=true;document.body.style.overflow='';if(lastFocus&&typeof lastFocus.focus==='function')lastFocus.focus()}
['cartOpen','heroCart','footerCart','mobileCart'].forEach(id=>$(id).addEventListener('click',openCart));
$('cartClose').addEventListener('click',closeCart);$('drawerOverlay').addEventListener('click',closeCart);document.addEventListener('keydown',e=>{if(e.key==='Escape'&&$('cartDrawer').classList.contains('open'))closeCart()});
function orderText(){const info=cartInfo();const list=cart.map((x,i)=>{const d=itemMap[x.id],s=d.sizes[x.size];return `${i+1}. ${d.name} — ${s.name} × ${x.qty} — ${s.price===null?'السعر عند الاستفسار':money(s.price*x.qty)}`}).join('\n');const name=$('clientName').value.trim(),area=$('clientArea').value.trim(),notes=$('clientNotes').value.trim();return `مرحباً زاد وملح! حاب أستفسر عن الطلب التالي:\n\n${list}\n\nالمجموع المبدئي للأصناف المسعّرة: ${money(info.total)}${info.missing?'\n* يوجد أصناف تحتاج تأكيد السعر':''}\n* التوصيل غير مشمول بالمجموع.\n${name?'الاسم: '+name+'\n':''}${area?'المنطقة: '+area+'\n':''}${notes?'ملاحظات: '+notes+'\n':''}\nيرجى تأكيد التوفر والسعر والتوصيل. شكراً!`}
function numberConfigured(){return String(window.RESTAURANT_WHATSAPP||'').replace(/\D/g,'')}
async function copyText(value){try{if(navigator.clipboard&&window.isSecureContext){await navigator.clipboard.writeText(value);return true}}catch(e){}const el=document.createElement('textarea');el.value=value;el.style.position='fixed';el.style.top='-10000px';document.body.append(el);el.select();let ok=false;try{ok=document.execCommand('copy')}catch(e){}el.remove();return ok}
async function shareText(value){const number=numberConfigured();if(number){window.open('https://wa.me/'+number+'?text='+encodeURIComponent(value),'_blank','noopener,noreferrer');return}if(navigator.share){try{await navigator.share({title:'طلب من زاد وملح',text:value});toast('تم فتح خيارات مشاركة الطلب');return}catch(e){if(e.name==='AbortError')return}}const ok=await copyText(value);toast(ok?'تم نسخ الطلب! افتح واتساب وأرسله للمطعم.':'تعذّر النسخ التلقائي، رجاءً حاول ثانية.');}
$('copyOrder').addEventListener('click',async()=>{if(!cart.length)return;toast(await copyText(orderText())?'تم نسخ تفاصيل طلبك ✓':'تعذّر نسخ الطلب')});
$('shareOrder').addEventListener('click',()=>{if(cart.length)shareText(orderText())});
document.querySelectorAll('[data-plan]').forEach(btn=>btn.addEventListener('click',()=>shareText('مرحباً زاد وملح! حاب أستفسر عن '+btn.dataset.plan+'. ممكن تفاصيل الاشتراك والتوصيل والتوفر؟')));
document.querySelectorAll('[data-filter-jump]').forEach(btn=>btn.addEventListener('click',()=>{setFilter(btn.dataset.filterJump);$('menu').scrollIntoView({behavior:'smooth'})}));
$('year').textContent=new Date().getFullYear();renderMenu();renderCart();
