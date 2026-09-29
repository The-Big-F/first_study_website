/**
 * The Corner Brew & Books - Web Application Logic
 * Adapted from Python Course Project (Assignment.py)
 * 
 * Features:
 * - Dynamic product catalog (Drinks, Food, Books from menus.json)
 * - Category tabs & real-time search
 * - Interactive shopping cart with quantity editing
 * - Subtotal, discount, and final total calculation
 * - Staff portal with authentication (credentials from employees.json)
 * - Discount management (preset chips & custom percentage)
 * - Thermal receipt modal on checkout
 */

// ========================================================
// 1. DATA STORE (from menus.json & employees.json)
// ========================================================
const STORE_DATA = {
    Drinks: [
        ["Espresso", 2.50, "Rich and bold single shot of concentrated coffee"],
        ["Americano", 3.00, "Espresso diluted with hot water for a smooth brew"],
        ["Cappuccino", 4.00, "Equal parts espresso, steamed milk, and airy foam"],
        ["Latte", 4.25, "Smooth espresso balanced with plenty of steamed milk"],
        ["Cold Brew", 4.50, "Slow-steeped in cold water for a crisp, low-acidity flavor"]
    ],
    Food: [
        ["Blueberry Muffin", 3.25, "Freshly baked muffin packed with juicy wild blueberries"],
        ["Butter Croissant", 3.00, "Flaky, golden, and layered with rich French butter"],
        ["Chocolate Chip Cookie", 2.50, "Soft-baked cookie loaded with semi-sweet chocolate chunks"],
        ["Avocado Toast", 6.50, "Mashed seasoned avocado on sourdough bread"],
        ["Bagel with Cream Cheese", 3.75, "Toasted plain bagel served with a thick spread of cream cheese"]
    ],
    Books: [
        ["The Great Gatsby (Fiction)", 10.99, "F. Scott Fitzgerald's classic tale of wealth, love, and the Jazz Age"],
        ["To Kill a Mockingbird (Fiction)", 12.50, "Harper Lee's Pulitzer Prize-winning story of justice in the American South"],
        ["Atomic Habits (Non-Fiction)", 16.00, "James Clear's practical guide to building good habits and breaking bad ones"],
        ["Sapiens: A Brief History (Non-Fiction)", 18.50, "Yuval Noah Harari's exploration of humankind's evolution"],
        ["Dune (Sci-Fi)", 14.99, "Frank Herbert's epic masterpiece of politics on Arrakis"],
        ["Project Hail Mary (Sci-Fi)", 15.25, "Andy Weir's thrilling survival journey of a lone astronaut"]
    ]
};

// Staff credentials from employees.json
const EMPLOYEES = {
    "admin": "coffee123",
    "barista_bob": "espresso2026",
    "manager_alice": "beansPass!"
};

// Staff display names and titles
const STAFF_PROFILES = {
    "admin": { name: "System Admin", role: "Administrator" },
    "barista_bob": { name: "Bob Jenkins", role: "Head Barista" },
    "manager_alice": { name: "Alice Vance", role: "Store Manager" }
};

// Category Icons
const CATEGORY_ICONS = {
    Drinks: "☕",
    Food: "🥐",
    Books: "📚"
};

// ========================================================
// 2. APPLICATION STATE
// ========================================================
const state = {
    activeCategory: "All",
    searchQuery: "",
    activeDiscount: 0.0, // Discount in percent (e.g. 15 for 15%)
    cart: {}, // Format: { "Latte": { name: "Latte", price: 4.25, quantity: 2, category: "Drinks" } }
    currentStaffUser: null // Username if logged in
};

// ========================================================
// 3. DOM ELEMENTS
// ========================================================
const catalogGrid = document.getElementById("catalog-grid");
const emptyResults = document.getElementById("empty-results");
const searchInput = document.getElementById("search-input");
const searchClearBtn = document.getElementById("search-clear-btn");
const resetFilterBtn = document.getElementById("reset-filter-btn");
const categoryTabs = document.querySelectorAll(".category-tabs .tab-btn");

// Cart Elements
const cartDrawer = document.getElementById("cart-drawer");
const cartOverlay = document.getElementById("cart-overlay");
const cartToggleBtn = document.getElementById("cart-toggle-btn");
const floatingCartBtn = document.getElementById("floating-cart-btn");
const closeCartBtn = document.getElementById("close-cart-btn");
const cartItemsContainer = document.getElementById("cart-items-container");
const cartCountBadge = document.getElementById("cart-count-badge");
const floatingCartBadge = document.getElementById("floating-cart-badge");
const cartItemsCountText = document.getElementById("cart-items-count-text");
const cartSubtotalEl = document.getElementById("cart-subtotal");
const cartDiscountRow = document.getElementById("cart-discount-row");
const discountLabelEl = document.getElementById("discount-label");
const cartDiscountValEl = document.getElementById("cart-discount-val");
const cartTotalEl = document.getElementById("cart-total");
const checkoutBtn = document.getElementById("checkout-btn");
const clearCartBtn = document.getElementById("clear-cart-btn");

// Discount & Promo Banners
const discountBanner = document.getElementById("discount-banner");
const discountBannerText = document.getElementById("discount-banner-text");

// Staff Modal Elements
const staffDialog = document.getElementById("staff-dialog");
const staffPortalBtn = document.getElementById("staff-portal-btn");
const closeStaffDialogBtn = document.getElementById("close-staff-dialog-btn");
const staffBtnLabel = document.getElementById("staff-btn-label");
const staffLoginView = document.getElementById("staff-login-view");
const staffDashboardView = document.getElementById("staff-dashboard-view");
const staffLoginForm = document.getElementById("staff-login-form");
const staffUsernameInput = document.getElementById("staff-username");
const staffPasswordInput = document.getElementById("staff-password");
const staffLoginError = document.getElementById("staff-login-error");
const staffGreeting = document.getElementById("staff-greeting");
const activeDiscountDisplay = document.getElementById("active-discount-display");
const customDiscountInput = document.getElementById("custom-discount-input");
const applyCustomDiscountBtn = document.getElementById("apply-custom-discount-btn");
const resetDiscountBtn = document.getElementById("reset-discount-btn");
const staffLogoutBtn = document.getElementById("staff-logout-btn");

// Receipt Modal Elements
const receiptDialog = document.getElementById("receipt-dialog");
const receiptItemsTbody = document.getElementById("receipt-items-tbody");
const receiptSubtotalEl = document.getElementById("receipt-subtotal");
const receiptDiscountRow = document.getElementById("receipt-discount-row");
const receiptDiscountLabel = document.getElementById("receipt-discount-label");
const receiptDiscountVal = document.getElementById("receipt-discount-val");
const receiptTotalEl = document.getElementById("receipt-total");
const receiptOrderId = document.getElementById("receipt-order-id");
const receiptTimestamp = document.getElementById("receipt-timestamp");
const receiptPrintBtn = document.getElementById("receipt-print-btn");
const receiptDoneBtn = document.getElementById("receipt-done-btn");

// Toast Container
const toastContainer = document.getElementById("toast-container");

// ========================================================
// 4. RENDERING FUNCTIONS
// ========================================================

/**
 * Get all catalog items flattened into an array of objects
 */
function getAllItems() {
    const items = [];
    for (const [category, list] of Object.entries(STORE_DATA)) {
        list.forEach(([name, price, desc]) => {
            items.push({ category, name, price, desc });
        });
    }
    return items;
}

/**
 * Filter and render catalog product cards
 */
function renderCatalog() {
    const allItems = getAllItems();
    const query = state.searchQuery.toLowerCase().trim();

    const filtered = allItems.filter(item => {
        const matchesCategory = state.activeCategory === "All" || item.category === state.activeCategory;
        const matchesSearch = !query || 
            item.name.toLowerCase().includes(query) || 
            item.desc.toLowerCase().includes(query) ||
            item.category.toLowerCase().includes(query);

        return matchesCategory && matchesSearch;
    });

    if (filtered.length === 0) {
        catalogGrid.innerHTML = "";
        emptyResults.classList.remove("hidden");
        return;
    }

    emptyResults.classList.add("hidden");
    catalogGrid.innerHTML = filtered.map(item => {
        const icon = CATEGORY_ICONS[item.category] || "✨";
        const catClass = item.category.toLowerCase();
        const priceFormatted = `$${item.price.toFixed(2)}`;

        return `
            <article class="product-card" data-name="${escapeHtml(item.name)}">
                <div class="product-top">
                    <div class="product-badge-row">
                        <span class="category-tag ${catClass}">${item.category}</span>
                        <span class="item-icon" aria-hidden="true">${icon}</span>
                    </div>
                    <h3 class="product-title">${escapeHtml(item.name)}</h3>
                    <p class="product-desc">${escapeHtml(item.desc)}</p>
                </div>
                <div class="product-bottom">
                    <span class="product-price">${priceFormatted}</span>
                    <button type="button" class="add-to-cart-btn" data-name="${escapeHtml(item.name)}" aria-label="Add ${escapeHtml(item.name)} to cart">
                        <span>+ Add</span>
                    </button>
                </div>
            </article>
        `;
    }).join("");

    // Attach click events to "Add to Cart" buttons
    catalogGrid.querySelectorAll(".add-to-cart-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const itemName = btn.getAttribute("data-name");
            const itemObj = allItems.find(i => i.name === itemName);
            if (itemObj) {
                addToCart(itemObj);

                // Quick visual click feedback
                btn.classList.add("added-anim");
                const originalHtml = btn.innerHTML;
                btn.innerHTML = `<span>✓ Added</span>`;
                setTimeout(() => {
                    btn.classList.remove("added-anim");
                    btn.innerHTML = originalHtml;
                }, 750);
            }
        });
    });
}

/**
 * Calculate totals matching Assignment.py logic
 */
function calculateTotals() {
    let subtotal = 0.0;
    let totalItemsCount = 0;

    for (const itemName in state.cart) {
        const item = state.cart[itemName];
        subtotal += item.price * item.quantity;
        totalItemsCount += item.quantity;
    }

    subtotal = Math.round(subtotal * 100) / 100;
    const discountAmount = Math.round(subtotal * (state.activeDiscount / 100.0) * 100) / 100;
    let finalTotal = Math.round((subtotal - discountAmount) * 100) / 100;

    if (finalTotal < 0) {
        finalTotal = 0.0;
    }

    return {
        subtotal,
        discountAmount,
        finalTotal,
        totalItemsCount
    };
}

/**
 * Render shopping cart contents and update totals
 */
function renderCart() {
    const { subtotal, discountAmount, finalTotal, totalItemsCount } = calculateTotals();

    // Update Badges
    cartCountBadge.textContent = totalItemsCount;
    floatingCartBadge.textContent = totalItemsCount;
    cartItemsCountText.textContent = `${totalItemsCount} ${totalItemsCount === 1 ? 'item' : 'items'}`;

    // Update Totals
    cartSubtotalEl.textContent = `$${subtotal.toFixed(2)}`;
    cartTotalEl.textContent = `$${finalTotal.toFixed(2)}`;

    // Discount line display
    if (state.activeDiscount > 0) {
        cartDiscountRow.classList.remove("hidden");
        discountLabelEl.textContent = `Staff Discount (${state.activeDiscount}%)`;
        cartDiscountValEl.textContent = `-$${discountAmount.toFixed(2)}`;
    } else {
        cartDiscountRow.classList.add("hidden");
    }

    // Enable/Disable action buttons
    const hasItems = totalItemsCount > 0;
    checkoutBtn.disabled = !hasItems;
    clearCartBtn.disabled = !hasItems;

    // Render cart items list
    const cartKeys = Object.keys(state.cart);
    if (cartKeys.length === 0) {
        cartItemsContainer.innerHTML = `
            <div class="cart-empty-message">
                <span class="cart-empty-icon">☕</span>
                <p>Your order is empty.</p>
                <p class="text-muted" style="font-size: 0.8rem; margin-top: 4px;">Pick a warm drink, fresh pastry, or a book from the catalog!</p>
            </div>
        `;
        return;
    }

    cartItemsContainer.innerHTML = cartKeys.map(itemName => {
        const item = state.cart[itemName];
        const itemRowTotal = (item.price * item.quantity).toFixed(2);

        return `
            <div class="cart-item" data-name="${escapeHtml(item.name)}">
                <div class="cart-item-info">
                    <span class="cart-item-name">${escapeHtml(item.name)}</span>
                    <span class="cart-item-unit-price">$${item.price.toFixed(2)} each</span>
                </div>

                <div class="cart-item-controls">
                    <button type="button" class="qty-btn btn-minus" data-name="${escapeHtml(item.name)}" aria-label="Decrease quantity">&minus;</button>
                    <span class="qty-value">${item.quantity}</span>
                    <button type="button" class="qty-btn btn-plus" data-name="${escapeHtml(item.name)}" aria-label="Increase quantity">&plus;</button>
                </div>

                <div class="cart-item-right">
                    <span class="cart-item-total">$${itemRowTotal}</span>
                    <button type="button" class="remove-item-btn" data-name="${escapeHtml(item.name)}" title="Remove item" aria-label="Remove ${escapeHtml(item.name)}">&times;</button>
                </div>
            </div>
        `;
    }).join("");

    // Attach listeners for quantity adjustments
    cartItemsContainer.querySelectorAll(".btn-minus").forEach(btn => {
        btn.addEventListener("click", () => updateCartQty(btn.getAttribute("data-name"), -1));
    });

    cartItemsContainer.querySelectorAll(".btn-plus").forEach(btn => {
        btn.addEventListener("click", () => updateCartQty(btn.getAttribute("data-name"), 1));
    });

    cartItemsContainer.querySelectorAll(".remove-item-btn").forEach(btn => {
        btn.addEventListener("click", () => removeFromCart(btn.getAttribute("data-name")));
    });
}

/**
 * Update discount banner in main UI
 */
function updateDiscountBanner() {
    if (state.activeDiscount > 0) {
        discountBanner.classList.remove("hidden");
        discountBannerText.textContent = `Staff discount applied: ${state.activeDiscount}% OFF your entire order!`;
    } else {
        discountBanner.classList.add("hidden");
    }
}

// ========================================================
// 5. CART ACTIONS
// ========================================================

function addToCart(item) {
    if (state.cart[item.name]) {
        state.cart[item.name].quantity += 1;
    } else {
        state.cart[item.name] = {
            name: item.name,
            price: item.price,
            category: item.category,
            quantity: 1
        };
    }

    renderCart();
    showToast(`Added 1x ${item.name} to cart`);
}

function updateCartQty(itemName, delta) {
    if (!state.cart[itemName]) return;

    state.cart[itemName].quantity += delta;
    if (state.cart[itemName].quantity <= 0) {
        delete state.cart[itemName];
        showToast(`Removed ${itemName} from cart`);
    }

    renderCart();
}

function removeFromCart(itemName) {
    if (state.cart[itemName]) {
        delete state.cart[itemName];
        renderCart();
        showToast(`Removed ${itemName} from cart`);
    }
}

function clearCart() {
    if (Object.keys(state.cart).length === 0) return;
    if (confirm("Are you sure you want to clear your current order?")) {
        state.cart = {};
        renderCart();
        showToast("Your cart has been cleared");
    }
}

// ========================================================
// 6. STAFF PORTAL & AUTHENTICATION
// ========================================================

function openStaffModal() {
    if (state.currentStaffUser) {
        renderStaffDashboard();
    } else {
        staffLoginView.classList.remove("hidden");
        staffDashboardView.classList.add("hidden");
        staffLoginForm.reset();
        staffLoginError.classList.add("hidden");
    }
    staffDialog.showModal();
}

function closeStaffModal() {
    staffDialog.close();
}

function handleStaffLogin(e) {
    e.preventDefault();
    const user = staffUsernameInput.value.trim();
    const pass = staffPasswordInput.value.trim();

    if (EMPLOYEES[user] && EMPLOYEES[user] === pass) {
        state.currentStaffUser = user;
        staffLoginError.classList.add("hidden");
        staffBtnLabel.textContent = `Staff: ${user}`;
        renderStaffDashboard();
        showToast(`Welcome back, ${user}!`);
    } else {
        staffLoginError.classList.remove("hidden");
    }
}

function renderStaffDashboard() {
    staffLoginView.classList.add("hidden");
    staffDashboardView.classList.remove("hidden");

    const profile = STAFF_PROFILES[state.currentStaffUser] || { name: state.currentStaffUser, role: "Staff" };
    staffGreeting.textContent = `Welcome, ${profile.name} (${profile.role})!`;

    activeDiscountDisplay.textContent = `${state.activeDiscount}%`;
    customDiscountInput.value = state.activeDiscount > 0 ? state.activeDiscount : "";

    // Highlight active preset chip if matching
    document.querySelectorAll(".quick-discounts .btn-chip").forEach(chip => {
        const val = parseFloat(chip.getAttribute("data-discount"));
        if (val === state.activeDiscount) {
            chip.classList.add("active");
        } else {
            chip.classList.remove("active");
        }
    });
}

function setDiscount(percentage) {
    const valid = Math.min(100, Math.max(0, parseFloat(percentage) || 0));
    state.activeDiscount = valid;
    renderStaffDashboard();
    renderCart();
    updateDiscountBanner();
    showToast(`Order discount set to ${valid}%`);
}

function handleLogout() {
    state.currentStaffUser = null;
    staffBtnLabel.textContent = "Staff Portal";
    staffLoginView.classList.remove("hidden");
    staffDashboardView.classList.add("hidden");
    staffLoginForm.reset();
    showToast("Signed out from Staff Portal");
}

// ========================================================
// 7. CHECKOUT & THERMAL RECEIPT
// ========================================================

function handleCheckout() {
    const { subtotal, discountAmount, finalTotal, totalItemsCount } = calculateTotals();
    if (totalItemsCount === 0) return;

    // Generate random order ID
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    receiptOrderId.textContent = `ORDER #CB-${randomNum}`;

    // Timestamp
    const now = new Date();
    const dateFormatted = now.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
    const timeFormatted = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });
    receiptTimestamp.textContent = `${dateFormatted} • ${timeFormatted}`;

    // Itemized table
    receiptItemsTbody.innerHTML = Object.keys(state.cart).map(itemName => {
        const item = state.cart[itemName];
        const lineTotal = (item.price * item.quantity).toFixed(2);
        return `
            <tr>
                <td>${escapeHtml(item.name)}</td>
                <td class="text-center">${item.quantity}</td>
                <td class="text-right">$${lineTotal}</td>
            </tr>
        `;
    }).join("");

    // Totals
    receiptSubtotalEl.textContent = `$${subtotal.toFixed(2)}`;
    if (state.activeDiscount > 0) {
        receiptDiscountRow.classList.remove("hidden");
        receiptDiscountLabel.textContent = `Staff Discount (${state.activeDiscount}%):`;
        receiptDiscountVal.textContent = `-$${discountAmount.toFixed(2)}`;
    } else {
        receiptDiscountRow.classList.add("hidden");
    }
    receiptTotalEl.textContent = `$${finalTotal.toFixed(2)}`;

    // Show Dialog
    receiptDialog.showModal();
}

function finalizeOrder() {
    // Reset cart and active discount per assignment rule
    state.cart = {};
    state.activeDiscount = 0.0;
    updateDiscountBanner();
    renderCart();

    receiptDialog.close();
    showToast("Order completed! Thank you for your visit ☕");
}

// ========================================================
// 8. TOAST NOTIFICATION UTILITY
// ========================================================
function showToast(message) {
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;
    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.classList.add("toast-out");
        toast.addEventListener("animationend", () => {
            toast.remove();
        });
    }, 2400);
}

// Utility to escape HTML strings safely
function escapeHtml(str) {
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// ========================================================
// 9. EVENT LISTENERS SETUP
// ========================================================

// Category Tabs
categoryTabs.forEach(btn => {
    btn.addEventListener("click", () => {
        categoryTabs.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        state.activeCategory = btn.getAttribute("data-category");
        renderCatalog();
    });
});

// Search input
searchInput.addEventListener("input", (e) => {
    state.searchQuery = e.target.value;
    const parent = searchInput.parentElement;
    if (state.searchQuery.length > 0) {
        parent.classList.add("has-text");
    } else {
        parent.classList.remove("has-text");
    }
    renderCatalog();
});

searchClearBtn.addEventListener("click", () => {
    searchInput.value = "";
    state.searchQuery = "";
    searchInput.parentElement.classList.remove("has-text");
    renderCatalog();
    searchInput.focus();
});

resetFilterBtn.addEventListener("click", () => {
    searchInput.value = "";
    state.searchQuery = "";
    searchInput.parentElement.classList.remove("has-text");
    categoryTabs.forEach(b => b.classList.remove("active"));
    categoryTabs[0].classList.add("active");
    state.activeCategory = "All";
    renderCatalog();
});

// Cart Drawer open/close for mobile & small screens
function toggleCartDrawer() {
    cartDrawer.classList.toggle("open");
    cartOverlay.classList.toggle("open");
}

cartToggleBtn.addEventListener("click", toggleCartDrawer);
floatingCartBtn.addEventListener("click", toggleCartDrawer);
closeCartBtn.addEventListener("click", toggleCartDrawer);
cartOverlay.addEventListener("click", toggleCartDrawer);

// Cart actions
checkoutBtn.addEventListener("click", handleCheckout);
clearCartBtn.addEventListener("click", clearCart);

// Staff Portal Events
staffPortalBtn.addEventListener("click", openStaffModal);
closeStaffDialogBtn.addEventListener("click", closeStaffModal);
staffLoginForm.addEventListener("submit", handleStaffLogin);
staffLogoutBtn.addEventListener("click", handleLogout);

// Discount buttons
document.querySelectorAll(".quick-discounts .btn-chip").forEach(chip => {
    chip.addEventListener("click", () => {
        const discountVal = parseFloat(chip.getAttribute("data-discount"));
        setDiscount(discountVal);
    });
});

applyCustomDiscountBtn.addEventListener("click", () => {
    const val = parseFloat(customDiscountInput.value);
    if (!isNaN(val)) {
        setDiscount(val);
    }
});

resetDiscountBtn.addEventListener("click", () => {
    setDiscount(0);
});

// Close dialogs when clicking backdrop
staffDialog.addEventListener("click", (e) => {
    if (e.target === staffDialog) staffDialog.close();
});

receiptDialog.addEventListener("click", (e) => {
    if (e.target === receiptDialog) receiptDialog.close();
});

// Receipt actions
receiptPrintBtn.addEventListener("click", () => {
    window.print();
});

receiptDoneBtn.addEventListener("click", finalizeOrder);

// ========================================================
// 10. INITIALIZATION
// ========================================================
document.addEventListener("DOMContentLoaded", () => {
    renderCatalog();
    renderCart();
    updateDiscountBanner();
});
