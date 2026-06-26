/**
 * Core Operational Logic Engine — The Brownie Bar (Multi-Item Cart Edition)
 */
document.addEventListener('DOMContentLoaded', () => {
    // 1. Maintain and Sync Visual Cart Components
    updateCartCountUI();

    // 2. Global Event Delegation for Product Additions
    initializeAddToCartListeners();

    // 3. Render Cart Matrix inside Menu/Checkout Elements if present
    if (document.getElementById('cartDropdownContainer') || document.getElementById('checkoutCartTable')) {
        renderCartInterface();
    }

    // 4. Handle Persistent Global Form Submission to SheetDB
    handleCartCheckoutSubmission();

    // 5. Individual Product Pages Live Estimator Trigger (Add to Cart Context)
    if (document.getElementById('livePreviewBox')) {
        initializeLiveReceipt();
    }

    // 6. Review Board Stars & Submission Event Triggers
    if (document.getElementById('reviewForm')) {
        initializeReviewBoard();
    }

    // 7. Automated Menu Sheet Day Checks
    const day = new Date().getDay();
    updateMenuAvailability(day);

    // 8. Invoice Processing Success Trigger Sequence
    if (document.getElementById('loadingSkeleton')) {
        simulateCheckoutProcess();
    }

    // 9. Apply Page Themes & Layout Listeners
    const uniqueFlavorNode = document.body.getAttribute('data-flavor');
    if (uniqueFlavorNode) {
        applyDynamicThematicAccents(uniqueFlavorNode);
    }

    // 10. Initialize Scroll Back-to-Top Tracker
    initializeScrollBackTracker();

    updateFundingProgress(19.00);
});

/**
 * Global Cart State Data Utilities
 */
function getCartState() {
    return JSON.parse(localStorage.getItem('bb_shopping_cart')) || [];
}

function saveCartState(cart) {
    localStorage.setItem('bb_shopping_cart', JSON.stringify(cart));
    updateCartCountUI();
}

function updateCartCountUI() {
    const cart = getCartState();
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const countBadge = document.getElementById('cartCounterBadge');
    if (countBadge) {
        countBadge.innerText = totalItems;
        countBadge.style.display = totalItems > 0 ? 'inline-block' : 'none';
    }
}

/**
 * Product Event Handling Matrix
 */
function initializeAddToCartListeners() {
    const addBtn = document.getElementById('addToCartBtn');
    if (!addBtn) return;

    addBtn.addEventListener('click', () => {
        const flavor = document.body.getAttribute('data-flavor') || "original";
        const basePrice = parseFloat(document.body.getAttribute('data-price')) || 3.50;
        const qtyInput = document.getElementById('quantityInput');
        const sizeSelect = document.getElementById('sizeInput');

        if (!qtyInput || !sizeSelect) return;

        const qty = parseInt(qtyInput.value) || 1;
        const premium = parseFloat(sizeSelect.value) || 0.00;
        const sizeText = sizeSelect.options[sizeSelect.selectedIndex].text.split(' (')[0];
        const unitPrice = basePrice + premium;

        const cart = getCartState();

        // Check if an item matching this specific specification exists
        const matchIndex = cart.findIndex(item => item.flavor === flavor && item.size === sizeText);

        if (matchIndex > -1) {
            cart[matchIndex].quantity += qty;
        } else {
            cart.push({
                flavor: flavor,
                size: sizeText,
                quantity: qty,
                unitPrice: unitPrice
            });
        }

        saveCartState(cart);

        // Provide visual click feedback on the action button
        const originalText = addBtn.innerText;
        addBtn.innerText = "✨ Added to Cart!";
        addBtn.style.background = "#2e7d32";
        setTimeout(() => {
            addBtn.innerText = originalText;
            addBtn.style.background = "";
        }, 1500);
    });
}

/**
 * Dynamic Interface Rendering Core
 */
function renderCartInterface() {
    const cart = getCartState();
    const tableBody = document.getElementById('checkoutCartTable');
    const totalDisplay = document.getElementById('cartSummaryTotal');
    const taxDisplay = document.getElementById('cartSummaryTax');
    const subtotalDisplay = document.getElementById('cartSummarySubtotal');

    if (tableBody) tableBody.innerHTML = '';
    let globalTotal = 0;

    if (cart.length === 0) {
        if (tableBody) {
            tableBody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:20px; color:#888;">Your cart is currently baking up empty!</td></tr>`;
        }
        if (totalDisplay) totalDisplay.innerText = "$0.00";
        if (taxDisplay) taxDisplay.innerText = "$0.00";
        if (subtotalDisplay) subtotalDisplay.innerText = "$0.00";
        return;
    }

    cart.forEach((item, index) => {
        const itemLineTotal = item.unitPrice * item.quantity;
        globalTotal += itemLineTotal;

        if (tableBody) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td style="padding:10px; border-bottom:1px solid #eee;">
                    <strong style="text-transform:capitalize;">${item.flavor} Product</strong><br>
                    <small style="color:#666;">Size: ${item.size}</small>
                </td>
                <td style="padding:10px; border-bottom:1px solid #eee; text-align:center;">
                    <input type="number" value="${item.quantity}" min="1" style="width:50px; text-align:center;" data-index="${index}" class="cart-qty-mod">
                </td>
                <td style="padding:10px; border-bottom:1px solid #eee; text-align:right;">$${item.unitPrice.toFixed(2)}</td>
                <td style="padding:10px; border-bottom:1px solid #eee; text-align:right; font-weight:bold;">
                    $${itemLineTotal.toFixed(2)}
                    <button class="cart-del-btn" data-index="${index}" style="background:none; border:none; color:red; margin-left:10px; cursor:pointer;">✕</button>
                </td>
            `;
            tableBody.appendChild(row);
        }
    });

    // Compute Australian GST Inclusive Pricing Scheme
    const calculatedSubtotal = (globalTotal / 110) * 100;
    const calculatedTax = globalTotal - calculatedSubtotal;

    if (totalDisplay) totalDisplay.innerText = `$${globalTotal.toFixed(2)}`;
    if (taxDisplay) taxDisplay.innerText = `$${calculatedTax.toFixed(2)}`;
    if (subtotalDisplay) subtotalDisplay.innerText = `$${calculatedSubtotal.toFixed(2)}`;

    // Attach Interactive Modification Event Watchers
    document.querySelectorAll('.cart-qty-mod').forEach(input => {
        input.addEventListener('change', (e) => {
            const idx = parseInt(e.target.getAttribute('data-index'));
            const newQty = parseInt(e.target.value) || 1;
            const updatedCart = getCartState();
            updatedCart[idx].quantity = newQty;
            saveCartState(updatedCart);
            renderCartInterface();
        });
    });

    document.querySelectorAll('.cart-del-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const idx = parseInt(e.target.getAttribute('data-index'));
            const updatedCart = getCartState();
            updatedCart.splice(idx, 1);
            saveCartState(updatedCart);
            renderCartInterface();
        });
    });
}

/**
 * Handle Global Multi-Item Checkouts Outbound Routing to SheetDB
 */
function handleCartCheckoutSubmission() {
    const checkoutForm = document.getElementById('globalCartCheckoutForm');
    if (!checkoutForm) return;

    checkoutForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const cart = getCartState();
        if (cart.length === 0) {
            alert("Your shopping cart is empty. Please add items before checking out!");
            return;
        }

        const selectedEmail = document.getElementById('emailInput').value;
        const pickupDayText = document.getElementById('pickupDay').value;

        // Generate a single grouped master reference id block
        const timestamp = Date.now().toString();
        const uniqueCluster = timestamp.slice(-5);
        const generatedOrderId = `BB-${uniqueCluster}-CART`;

        // Collate item properties for presentation arrays
        const summaryFlavors = cart.map(i => `${i.quantity}x ${i.flavor}`).join(', ');
        const summarySizes = cart.map(i => i.size).join(', ');
        const absoluteQuantity = cart.reduce((sum, i) => sum + i.quantity, 0);
        const overallPrice = cart.reduce((sum, i) => sum + (i.unitPrice * i.quantity), 0);

        // Retain specific invoice indicators for local layout handling downstream
        localStorage.setItem('userEmail', selectedEmail);
        localStorage.setItem('pickupDay', pickupDayText);
        localStorage.setItem('masterOrderId', generatedOrderId);
        localStorage.setItem('cachedCartSnapshot', JSON.stringify(cart));

        const sheetPayload = {
            data: [
                {
                    "Order ID": generatedOrderId,
                    "Customer Email": selectedEmail,
                    "Flavor": summaryFlavors,
                    "Size": summarySizes,
                    "Quantity": absoluteQuantity,
                    "Express Day & Break": pickupDayText,
                    "Total Price": `$${overallPrice.toFixed(2)}`,
                    "Paid? (Yes/No)": "No"
                }
            ]
        };

        fetch('https://sheetdb.io/api/v1/4e8q9suswemae', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(sheetPayload)
        })
            .then(response => response.json())
            .then(data => {
                console.log('SheetDB Multi-Item Sync Complete:', data);
                // Clear checkout context state cleanly
                localStorage.removeItem('bb_shopping_cart');
                window.location.href = 'checkout-success.html';
            })
            .catch(error => {
                console.error('SheetDB Sync Error:', error);
                window.location.href = 'checkout-success.html';
            });
    });
}

/**
 * Live Single Product Preview Box Calculations
 */
function initializeLiveReceipt() {
    const qtyInput = document.getElementById('quantityInput');
    const sizeInput = document.getElementById('sizeInput');

    if (!qtyInput || !sizeInput) return;

    const updateCalculations = () => {
        const basePrice = parseFloat(document.body.getAttribute('data-price')) || 3.50;
        const premium = parseFloat(sizeInput.value) || 0.00;
        const qty = parseInt(qtyInput.value) || 1;

        const total = (basePrice + premium) * qty;
        const subtotal = (total / 110) * 100;
        const tax = total - subtotal;

        const formatter = new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' });

        document.getElementById('liveSubtotal').innerText = formatter.format(subtotal);
        document.getElementById('liveTax').innerText = formatter.format(tax);
        document.getElementById('liveTotal').innerText = formatter.format(total);
    };

    qtyInput.addEventListener('input', updateCalculations);
    qtyInput.addEventListener('change', updateCalculations);
    sizeInput.addEventListener('change', updateCalculations);

    updateCalculations();
}

/**
 * Interactive Star Rating Core Logic
 */
function initializeReviewBoard() {
    const form = document.getElementById('reviewForm');
    const container = document.getElementById('reviewContainer');
    if (!form || !container) return;

    const stars = document.querySelectorAll('.star-node');
    const hiddenInput = document.getElementById('reviewStars');
    let lockedRating = 5;

    const highlightStars = (rating) => {
        stars.forEach(star => {
            const starValue = parseInt(star.getAttribute('data-value'));
            if (starValue <= rating) {
                star.classList.add('active-star');
            } else {
                star.classList.remove('active-star');
            }
        });
    };

    highlightStars(lockedRating);

    stars.forEach(star => {
        star.addEventListener('mouseenter', () => highlightStars(parseInt(star.getAttribute('data-value'))));
        star.addEventListener('mouseover', () => highlightStars(parseInt(star.getAttribute('data-value'))));
        star.addEventListener('mouseleave', () => highlightStars(lockedRating));
        star.addEventListener('mouseout', () => highlightStars(lockedRating));

        star.addEventListener('click', () => {
            lockedRating = parseInt(star.getAttribute('data-value'));
            if (hiddenInput) hiddenInput.value = lockedRating;
            highlightStars(lockedRating);
        });
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = document.getElementById('reviewText').value;
        const visualStars = "⭐".repeat(lockedRating);

        const reviewBlock = document.createElement('div');
        reviewBlock.style.borderBottom = "1px solid #f2ede6";
        reviewBlock.style.paddingBottom = "8px";
        reviewBlock.innerHTML = `<strong style="color: var(--accent);">${visualStars} Anonymous Customer</strong><p style="margin: 4px 0 0 0; font-size: 0.9rem;">${text}</p>`;

        container.prepend(reviewBlock);

        form.reset();
        lockedRating = 5;
        if (hiddenInput) hiddenInput.value = 5;
        highlightStars(5);
    });
}

/**
 * Invoicing and Invoice Generator Logic Sequence
 */
function simulateCheckoutProcess() {
    setTimeout(() => {
        const skeleton = document.getElementById('loadingSkeleton');
        const content = document.getElementById('successContent');

        const subtotalTarget = document.getElementById('calcSubtotal');
        const taxTarget = document.getElementById('calcTax');
        const totalTarget = document.getElementById('calcTotal');
        const emailTarget = document.getElementById('invoiceEmail');
        const orderIdTarget = document.getElementById('orderIdText');
        const reservationTarget = document.getElementById('invoicePickup');
        const detailedSummaryBody = document.getElementById('invoiceItemsSummaryList');

        if (skeleton && content) {
            const cachedCart = JSON.parse(localStorage.getItem('cachedCartSnapshot')) || [];
            const generatedOrderId = localStorage.getItem('masterOrderId') || "BB-UNKNOWN-CART";

            if (orderIdTarget) orderIdTarget.innerText = generatedOrderId;

            let finalBillValue = 0;
            if (detailedSummaryBody) detailedSummaryBody.innerHTML = '';

            cachedCart.forEach(item => {
                const rowTotal = item.unitPrice * item.quantity;
                finalBillValue += rowTotal;

                if (detailedSummaryBody) {
                    const li = document.createElement('li');
                    li.style.display = 'flex';
                    li.style.justifyContent = 'space-between';
                    li.style.fontSize = '0.9rem';
                    li.style.marginBottom = '4px';
                    li.innerHTML = `<span style="text-transform:capitalize;">${item.quantity}x ${item.flavor} (${item.size})</span><span>$${rowTotal.toFixed(2)}</span>`;
                    detailedSummaryBody.appendChild(li);
                }
            });

            const subtotalValue = (finalBillValue / 110) * 100;
            const taxValue = finalBillValue - subtotalValue;
            const formatter = new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' });

            if (subtotalTarget) subtotalTarget.innerText = formatter.format(subtotalValue);
            if (taxTarget) taxTarget.innerText = `${formatter.format(taxValue)} (10% GST Inc.)`;
            if (totalTarget) totalTarget.innerText = formatter.format(finalBillValue);
            if (emailTarget) emailTarget.innerText = localStorage.getItem('userEmail') || 'customer@outlook.com';
            if (reservationTarget) reservationTarget.innerText = localStorage.getItem('pickupDay') || 'Selected Stall Day';

            skeleton.style.display = 'none';
            content.style.display = 'block';

            initializeClipboardLink();
            initializePrintHandler();
            initializeChangeCalculator(finalBillValue);
        }
    }, 1200);
}

/**
 * Cash Counter assistant calculator
 */
function initializeChangeCalculator(finalBillValue) {
    const calcBtn = document.getElementById('calcChangeBtn');
    const input = document.getElementById('cashTendered');
    const display = document.getElementById('changeDueDisplay');

    if (!calcBtn || !input || !display) return;

    calcBtn.addEventListener('click', () => {
        const tendered = parseFloat(input.value) || 0;
        if (tendered < finalBillValue) {
            display.innerText = `⚠️ Short by $${(finalBillValue - tendered).toFixed(2)}`;
            display.style.color = "red";
        } else {
            display.innerText = `💵 Give Change: $${(tendered - finalBillValue).toFixed(2)}`;
            display.style.color = "green";
        }
    });
}

/**
 * Menu Day Check Routine Matrix
 */
function updateMenuAvailability(day) {
    const originalTag = document.getElementById('tagOriginal');
    const caramelTag = document.getElementById('tagCaramel');
    const nutellaTag = document.getElementById('tagNutella');

    if (originalTag) originalTag.innerText = "Pre-order Open";
    if (caramelTag) caramelTag.innerText = "Pre-order Open";
    if (nutellaTag) nutellaTag.innerText = "Pre-order Open";

    if (day === 1) { if (originalTag) originalTag.innerText = "Available Today"; }
    else if (day === 2) { if (caramelTag) caramelTag.innerText = "Available Today"; }
    else if (day === 3) { if (nutellaTag) nutellaTag.innerText = "Available Today"; }
}

/**
 * Page Theme Accent Coloring Modifiers
 */
function applyDynamicThematicAccents(flavor) {
    const rootProperties = document.documentElement.style;
    switch (flavor) {
        case 'caramel':
            rootProperties.setProperty('--secondary', '#FFF9E6');
            rootProperties.setProperty('--primary', '#6E473B');
            break;
        case 'nutella':
            rootProperties.setProperty('--secondary', '#F0E6DF');
            rootProperties.setProperty('--primary', '#56352F');
            break;
        case 'original':
            rootProperties.setProperty('--secondary', '#F5E6D3');
            break;
    }
}

/**
 * Top Position Scroll Tracker Button Handler
 */
function initializeScrollBackTracker() {
    const backBtn = document.getElementById('backToTop');
    if (!backBtn) return;
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) { backBtn.classList.add('visible'); }
        else { backBtn.classList.remove('visible'); }
    });
}

/**
 * Clipboard & Print Handlers
 */
function initializeClipboardLink() {
    const copyBtn = document.getElementById('copyIdBtn');
    const textNode = document.getElementById('orderIdText');
    if (!copyBtn || !textNode) return;
    copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(textNode.innerText).then(() => {
            const originalContent = copyBtn.innerHTML;
            copyBtn.innerHTML = `✅ Saved!`;
            copyBtn.style.background = '#e8f5e9';
            setTimeout(() => {
                copyBtn.innerHTML = originalContent;
                copyBtn.style.background = '#eee';
            }, 2000);
        });
    });
}

function initializePrintHandler() {
    const printBtn = document.getElementById('printInvoiceBtn');
    if (printBtn) { printBtn.addEventListener('click', () => window.print()); }
}

/**
 * Progress Matrix Tracker Engine
 */
function updateFundingProgress(totalRevenue) {
    const progressBar = document.getElementById('fundingProgressBar');
    const progressText = document.getElementById('fundingProgressText');
    if (!progressBar || !progressText) return;

    const milestones = [
        { limit: 20, msg: "🎉 $20 Capital Repaid! We are officially in the green!" },
        { limit: 100, msg: "🚀 $100 Smashed! The Brownie Bar is heating up!" },
        { limit: 250, msg: "👑 $250 Reached! Pure profit maximization mode unlocked!" },
        { limit: 500, msg: "🔥 $500! We're going to need a bigger mixing bowl!" },
        { limit: 1000, msg: "💎 $1,000 Milestone! Legendary Baker Status Achieved!" },
        { limit: 1500, msg: "🌟 $1,500! Term 3 Bake Sale History is being written!" },
        { limit: 2000, msg: "🏆 $2,000 ULTIMATE GOAL CLEARED! The Ultimate $20 Boss Empire!" }
    ];

    let currentMessage = "📈 Baking our way to the first $20 repayment goal...";
    let targetGoal = 20;

    for (let i = 0; i < milestones.length; i++) {
        if (totalRevenue >= milestones[i].limit) {
            currentMessage = milestones[i].msg;
            targetGoal = milestones[i + 1] ? milestones[i + 1].limit : 2000;
        }
    }

    let fillPercentage = (totalRevenue / targetGoal) * 100;
    if (fillPercentage > 100) fillPercentage = 100;
    progressBar.style.width = `${fillPercentage}%`;
    progressText.innerText = `${currentMessage} (Live: $${totalRevenue.toFixed(2)})`;
}
