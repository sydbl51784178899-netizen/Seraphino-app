const firebaseConfig = {
    apiKey: "AIzaSyA_-3X3vfdR2QhPOngXNf7ZDs79agvHSgY",
    authDomain: "seraphino-store.firebaseapp.com",
    databaseURL: "https://seraphino-store-default-rtdb.firebaseio.com",
    projectId: "seraphino-store",
    storageBucket: "seraphino-store.firebasestorage.app",
    messagingSenderId: "13316318031",
    appId: "1:13316318031:web:a1a4ba774f2dffd619db3a"
};

firebase.initializeApp(firebaseConfig);
const database = firebase.database();

document.addEventListener('DOMContentLoaded', function () {

    function getOrCreateDeviceId() {
        let deviceId = localStorage.getItem('seraphino_device_id');
        if (!deviceId) {
            deviceId = 'DEV_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('seraphino_device_id', deviceId);
        }
        return deviceId;
    }

    const MY_DEVICE_ID = getOrCreateDeviceId();

    const DEFAULT_MENU = [
        { id: 1, name: "كوكتيل سيرافينو الملوك", category: "cocktails", price: 30000, desc: "طبقات من العصائر الطبيعية مع قطع الفواكه والمكسرات والقشطة", img: "https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=500", available: true },
        { id: 2, name: "كوكتيل إمبراطور موز وحليب", category: "cocktails", price: 25000, desc: "قطع موز طازجة مع حليب مكثف ومكسرات فاخرة", img: "https://images.unsplash.com/photo-1546173159-315724a31696?w=500", available: true },
        { id: 3, name: "كوكتيل استوائي", category: "cocktails", price: 22000, desc: "مانجو، فراولة، مع قطع الأناناس الطازجة", img: "https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=500", available: true },
        { id: 4, name: "بوظة عربية دق اليد", category: "icecream", price: 20000, desc: "بوظة حليب بالمستكة والفستق الحلبي الفاخر", img: "https://images.unsplash.com/photo-1570197788417-0e82375c9371?w=500", available: true },
        { id: 5, name: "صحن قشطية بالعسل", category: "icecream", price: 28000, desc: "قشطة بلدية طازجة مع العسل الطبيعي والمكسرات", img: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=500", available: true },
        { id: 6, name: "عصير برتقال طبيعي", category: "juices", price: 15000, desc: "برتقال معصور طازج بدون إضافة سكر", img: "https://images.unsplash.com/photo-1613478223719-2ab802602423?w=500", available: true },
        { id: 7, name: "عصير ليمون بالنعناع", category: "juices", price: 14000, desc: "منعش جداً مع أوراق النعناع وقطع الثلج", img: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500", available: true },
        { id: 8, name: "سلطة فواكه الكبرى", category: "salads", price: 35000, desc: "تشكيلة واسعة من فواكه الموسم مع القشطة والعسل", img: "https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?w=500", available: true }
    ];

    function getLiveMenu() {
        let saved = localStorage.getItem('seraphino_db_menu');
        if (!saved) {
            localStorage.setItem('seraphino_db_menu', JSON.stringify(DEFAULT_MENU));
            return DEFAULT_MENU;
        }
        return JSON.parse(saved);
    }

    let cart = {};
    let selectedBranch = "فرع العزيزية";
    let selectedTable = "1";
    let isFirstOrderForThisDevice = true;
    let WATER_PRICE = 5000;

    let myDeviceSpending = parseInt(localStorage.getItem(`seraphino_spending_${MY_DEVICE_ID}`)) || 0;
    let currentUserSpins = parseInt(localStorage.getItem(`seraphino_spins_${MY_DEVICE_ID}`)) || 0;
    let isSpinning = false;

    const startOrderBtn = document.getElementById('start-order-btn');
    if (startOrderBtn) {
        startOrderBtn.onclick = function () {
            const branchSelect = document.getElementById('branch-select');
            const tableInput = document.getElementById('table-input');
            selectedBranch = branchSelect ? branchSelect.value : "فرع العزيزية";
            selectedTable = (tableInput && tableInput.value.trim()) ? tableInput.value.trim() : "1";

            document.getElementById('selected-branch-display').textContent = selectedBranch;
            document.getElementById('selected-table-display').textContent = selectedTable;
            document.getElementById('cart-table-num').textContent = selectedTable;
            document.getElementById('table-selection-modal').classList.remove('active');
            document.getElementById('session-info-bar').classList.remove('hidden');
            renderMenu('all');
        };
    }

    const urlParams = new URLSearchParams(window.location.search);
    const branchParam = urlParams.get('branch');
    const tableParam = urlParams.get('table');
    if (branchParam && tableParam) {
        selectedBranch = branchParam;
        selectedTable = tableParam;
        document.getElementById('selected-branch-display').textContent = selectedBranch;
        document.getElementById('selected-table-display').textContent = selectedTable;
        document.getElementById('cart-table-num').textContent = selectedTable;
        document.getElementById('table-selection-modal').classList.remove('active');
        document.getElementById('session-info-bar').classList.remove('hidden');
    }

    const cartFloatingBar = document.getElementById('cart-floating-bar');
    if (cartFloatingBar) {
        cartFloatingBar.onclick = function () { document.getElementById('cart-modal').classList.add('active'); };
    }

    const closeCartBtn = document.getElementById('close-cart-modal-btn');
    if (closeCartBtn) {
        closeCartBtn.onclick = function () { document.getElementById('cart-modal').classList.remove('active'); };
    }

    const changeTableBtn = document.getElementById('change-table-btn');
    if (changeTableBtn) {
        changeTableBtn.onclick = function () { document.getElementById('table-selection-modal').classList.add('active'); };
    }

    function checkRouletteSystemStatus() {
        let enabled = localStorage.getItem('seraphino_roulette_enabled') !== 'false';
        const section = document.getElementById('roulette-section-container');
        if (section) section.style.display = enabled ? 'block' : 'none';
    }

    function renderMenu(categoryFilter) {
        const menuGrid = document.getElementById('menu-grid');
        if (!menuGrid) return;
        menuGrid.innerHTML = '';
        let menu = getLiveMenu();

        const filteredItems = (!categoryFilter || categoryFilter === 'all')
            ? menu.filter(item => item.available)
            : menu.filter(item => item.category === categoryFilter && item.available);

        filteredItems.forEach(item => {
            const qty = cart[item.id] || 0;
            const card = document.createElement('div');
            card.className = 'menu-card';
            card.innerHTML = `
                <div class="card-img-wrap"><img src="${item.img}" alt="${item.name}"></div>
                <div class="card-body">
                    <div>
                        <h3 class="card-title">${item.name}</h3>
                        <p class="card-desc">${item.desc}</p>
                    </div>
                    <div class="card-footer">
                        <span class="card-price">${item.price.toLocaleString()} ل.س</span>
                        <div class="quantity-control">
                            <button class="btn-qty btn-minus" data-id="${item.id}">-</button>
                            <span id="qty-val-${item.id}">${qty}</span>
                            <button class="btn-qty btn-plus" data-id="${item.id}">+</button>
                        </div>
                    </div>
                </div>
            `;
            menuGrid.appendChild(card);
        });

        document.querySelectorAll('.btn-minus').forEach(btn => {
            btn.onclick = function () { updateQty(this.dataset.id, -1); };
        });
        document.querySelectorAll('.btn-plus').forEach(btn => {
            btn.onclick = function () { updateQty(this.dataset.id, 1); };
        });
    }

    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.onclick = function () {
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            renderMenu(this.dataset.category);
        };
    });

    function updateQty(id, change) {
        if (!cart[id]) cart[id] = 0;
        cart[id] += change;
        if (cart[id] <= 0) delete cart[id];
        const qtyEl = document.getElementById(`qty-val-${id}`);
        if (qtyEl) qtyEl.textContent = cart[id] || 0;
        calculateTotal();
    }

    function calculateTotal() {
        let menu = getLiveMenu();
        let totalItems = 0;
        let totalPrice = 0;

        for (const [id, qty] of Object.entries(cart)) {
            const product = menu.find(p => p.id == id);
            if (product && product.available) {
                totalItems += qty;
                totalPrice += product.price * qty;
            }
        }

        const waterChk = document.getElementById('water-checkbox');
        let isWater = isFirstOrderForThisDevice ? true : (waterChk ? waterChk.checked : false);
        if (isWater) totalPrice += WATER_PRICE;

        document.getElementById('cart-total-count').textContent = totalItems;
        document.getElementById('cart-total-price').textContent = totalPrice.toLocaleString() + ' ل.س';
        document.getElementById('final-price-display').textContent = totalPrice.toLocaleString() + ' ل.س';
        renderCartItems();
    }

    function renderCartItems() {
        const cartItemsList = document.getElementById('cart-items-list');
        if (!cartItemsList) return;
        cartItemsList.innerHTML = '';
        let menu = getLiveMenu();
        const entries = Object.entries(cart);

        if (entries.length === 0) {
            cartItemsList.innerHTML = '<p style="text-align:center; color:#888;">السلة فارغة حالياً</p>';
            return;
        }

        entries.forEach(([id, qty]) => {
            const product = menu.find(p => p.id == id);
            if (product) {
                const row = document.createElement('div');
                row.className = 'cart-item-row';
                row.innerHTML = `<span>${product.name} (x${qty})</span><span>${(product.price * qty).toLocaleString()} ل.س</span>`;
                cartItemsList.appendChild(row);
            }
        });
    }

    function updateDeviceSpendingUI() {
        document.getElementById('my-spending-total').innerText = myDeviceSpending.toLocaleString() + ' ل.س';
        let needed = 100000 - (myDeviceSpending % 100000);
        document.getElementById('spending-progress-val').innerText = needed.toLocaleString() + ' ل.س للفرصة القادمة';
        document.getElementById('spin-btn-count').innerText = currentUserSpins;
    }

    const sendOrderBtn = document.getElementById('send-order-btn');
    if (sendOrderBtn) {
        sendOrderBtn.onclick = function () {
            const fullNameInput = document.getElementById('customer-fullname-input');
            const fullName = fullNameInput ? fullNameInput.value.trim() : "";

            if (!fullName || fullName.split(' ').length < 3) {
                alert("يرجى إدخال الاسم الثلاثي الكامل للعميل!");
                return;
            }

            let menu = getLiveMenu();
            let cartEntries = Object.entries(cart);
            const waterChk = document.getElementById('water-checkbox');
            let isWater = isFirstOrderForThisDevice ? true : (waterChk ? waterChk.checked : false);

            if (cartEntries.length === 0 && !isWater) {
                alert("السلة فارغة!");
                return;
            }

            const orderItems = [];
            for (const [id, qty] of cartEntries) {
                const product = menu.find(p => p.id == id);
                if (product && product.available) {
                    orderItems.push({ name: product.name, quantity: qty, price: product.price });
                }
            }

            let total = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            if (isWater) total += WATER_PRICE;

            const orderId = Date.now();
            const orderData = {
                id: orderId,
                deviceId: MY_DEVICE_ID,
                customerName: fullName,
                table: selectedTable || "1",
                branch: selectedBranch || "فرع العزيزية",
                items: orderItems,
                water: isWater,
                total: total,
                status: 'PENDING',
                time: new Date().toLocaleTimeString('ar-SY', { hour: '2-digit', minute: '2-digit' }),
                timestamp: Date.now()
            };

            // إرسال الطلب إلى Firebase Realtime Database
            database.ref('orders/' + orderId).set(orderData)
                .then(() => { console.log('تم إرسال الطلب لسحابة Firebase بنجاح'); })
                .catch((error) => { console.error('خطأ في إرسال الطلب:', error); });

            let oldSpins = Math.floor(myDeviceSpending / 100000);
            myDeviceSpending += total;
            let newSpins = Math.floor(myDeviceSpending / 100000);
            let spinsEarned = newSpins - oldSpins;
            currentUserSpins += spinsEarned;

            let existingOrders = JSON.parse(localStorage.getItem('seraphino_orders')) || [];
            existingOrders.push(orderData);
            localStorage.setItem('seraphino_orders', JSON.stringify(existingOrders));

            localStorage.setItem(`seraphino_spending_${MY_DEVICE_ID}`, myDeviceSpending);
            localStorage.setItem(`seraphino_spins_${MY_DEVICE_ID}`, currentUserSpins);

            updateDeviceSpendingUI();

            isFirstOrderForThisDevice = false;
            const waterLabel = document.getElementById('water-label-text');
            if (waterLabel) waterLabel.innerText = "قارورة ماء معدنية كبيرة (+ 5,000 ل.س)";

            cart = {};
            calculateTotal();
            renderMenu('all');
            document.getElementById('cart-modal').classList.remove('active');

            document.getElementById('success-spins-count').innerText = spinsEarned;
            document.getElementById('success-modal').classList.add('active');
        };
    }

    const closeSuccessBtn = document.getElementById('close-success-btn');
    if (closeSuccessBtn) {
        closeSuccessBtn.onclick = function () { document.getElementById('success-modal').classList.remove('active'); };
    }

    const spinWheelBtn = document.getElementById('spin-wheel-btn');
    if (spinWheelBtn) {
        spinWheelBtn.onclick = function () {
            if (currentUserSpins <= 0) {
                alert("يلزمك طلب بقيمة 100,000 ل.س لجهازك للحصول على محاولة تدوير!");
                return;
            }
            if (isSpinning) return;
            isSpinning = true;
            currentUserSpins--;
            localStorage.setItem(`seraphino_spins_${MY_DEVICE_ID}`, currentUserSpins);
            updateDeviceSpendingUI();

            const sectors = [
                { title: 'طلبك مجاناً 💎', val: 'FREE', tier: 'masi', deg: 12 },
                { title: 'حظ أوفر! 😅', val: 'NONE', tier: 'none', deg: 38 },
                { title: 'خصم 10% 💎', val: '10%', tier: 'masi', deg: 64 },
                { title: 'حظ أوفر! 😅', val: 'NONE', tier: 'none', deg: 90 },
                { title: 'خصم 5% 💎', val: '5%', tier: 'masi', deg: 115 },
                { title: 'حظ أوفر! 😅', val: 'NONE', tier: 'none', deg: 141 },
                { title: 'خصم 4% 🥇', val: '4%', tier: 'dahabi', deg: 167 },
                { title: 'حظ أوفر! 😅', val: 'NONE', tier: 'none', deg: 192 },
                { title: 'خصم 3% 🥇', val: '3%', tier: 'dahabi', deg: 218 },
                { title: 'حظ أوفر! 😅', val: 'NONE', tier: 'none', deg: 244 },
                { title: 'خصم 2% 🪵', val: '2%', tier: 'khashabi', deg: 270 },
                { title: 'حظ أوفر! 😅', val: 'NONE', tier: 'none', deg: 295 },
                { title: 'خصم 1% 🪵', val: '1%', tier: 'khashabi', deg: 321 },
                { title: 'حظ أوفر! 😅', val: 'NONE', tier: 'none', deg: 347 }
            ];

            let chosenSector = sectors[Math.floor(Math.random() * sectors.length)];
            const wheel = document.getElementById('roulette-wheel');
            wheel.style.transform = `rotate(${1440 + (360 - chosenSector.deg)}deg)`;

            setTimeout(() => {
                isSpinning = false;
                showCouponResult(chosenSector);
            }, 4000);
        };
    }

    function showCouponResult(res) {
        const modal = document.getElementById('coupon-result-modal');
        const body = document.getElementById('coupon-modal-body');
        const fullNameInput = document.getElementById('customer-fullname-input');
        const fullName = (fullNameInput && fullNameInput.value.trim()) ? fullNameInput.value.trim() : "عميل سيرافينو";

        if (res.val === 'NONE') {
            body.innerHTML = `
                <h3 style="color:#e74c3c;">😅 حظ أوفر!</h3>
                <p style="margin:10px 0;">معوضة والمحاولة القادمة أفضل بالتأكيد!</p>
                <button onclick="document.getElementById('coupon-result-modal').classList.remove('active')" class="btn-primary">حسناً</button>
            `;
        } else {
            body.innerHTML = `
                <div class="coupon-card ${res.tier}">
                    <h3>🎉 مبارك! ${res.title}</h3>
                    <p style="margin:6px 0;">العميل: <strong>${fullName}</strong></p>
                    <small>طاولة: ${selectedTable} | ${selectedBranch}</small>
                </div>
                <button onclick="document.getElementById('coupon-result-modal').classList.remove('active')" class="btn-primary" style="margin-top:15px;">إغلاق وحفظ البطاقة</button>
            `;

            let coupons = JSON.parse(localStorage.getItem('seraphino_coupons')) || [];
            coupons.push({
                id: Date.now(),
                deviceId: MY_DEVICE_ID,
                customerName: fullName,
                branch: selectedBranch,
                table: selectedTable,
                prize: res.title,
                val: res.val,
                tier: res.tier,
                used: false,
                timestamp: Date.now()
            });
            localStorage.setItem('seraphino_coupons', JSON.stringify(coupons));
            renderMyCoupons();
        }
        modal.classList.add('active');
    }

    function renderMyCoupons() {
        const list = document.getElementById('my-coupons-list');
        if (!list) return;
        let coupons = JSON.parse(localStorage.getItem('seraphino_coupons')) || [];
        let myActiveCoupons = coupons.filter(c => c.deviceId === MY_DEVICE_ID && !c.used);

        if (myActiveCoupons.length === 0) {
            list.innerHTML = '<small style="color:#777;">لا توجد بطاقات نشطة لهذا الجهاز حالياً.</small>';
            return;
        }

        list.innerHTML = myActiveCoupons.map(c => `
            <div class="coupon-card ${c.tier}">
                <strong>${c.prize}</strong><br>
                <small>${c.customerName}</small><br>
                <small>طاولة ${c.table}</small>
            </div>
        `).join('');
    }

    const submitReviewBtn = document.getElementById('submit-review-btn');
    if (submitReviewBtn) {
        submitReviewBtn.onclick = function () {
            const stars = document.getElementById('review-stars').value;
            const text = document.getElementById('review-text').value.trim();
            const fullNameInput = document.getElementById('customer-fullname-input');
            const name = (fullNameInput && fullNameInput.value.trim()) ? fullNameInput.value.trim() : "زبون سيرافينو";

            if (!text) { alert("يرجى كتابة التقييم أولاً!"); return; }

            let reviews = JSON.parse(localStorage.getItem('seraphino_reviews')) || [];
            reviews.push({ id: Date.now(), name, stars, text, approved: false, time: new Date().toLocaleDateString('ar-SY') });
            localStorage.setItem('seraphino_reviews', JSON.stringify(reviews));
            alert("سيتم إضافته قريباً بعد مراجعة الإدارة!");
            document.getElementById('review-text').value = '';
        };
    }

    function renderPublicReviews() {
        const list = document.getElementById('public-reviews-list');
        if (!list) return;
        let reviews = JSON.parse(localStorage.getItem('seraphino_reviews')) || [];
        let approvedReviews = reviews.filter(r => r.approved);

        if (approvedReviews.length === 0) {
            list.innerHTML = '<small style="color:#888;">لا توجد تقييمات معروضة حالياً.</small>';
            return;
        }

        list.innerHTML = approvedReviews.map(r => `
            <div style="background:#f9f9f9; padding:8px; border-radius:6px; margin-bottom:6px; font-size:0.85rem;">
                <strong>${r.name}</strong> (${r.stars} ⭐)
                <p style="margin:2px 0; color:#555;">"${r.text}"</p>
            </div>
        `).join('');
    }

    checkRouletteSystemStatus();
    updateDeviceSpendingUI();
    calculateTotal();
    renderMenu('all');
    renderMyCoupons();
    renderPublicReviews();
});