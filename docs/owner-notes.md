# FreshMart — Shop Owner Portal Documentation

**Project:** FreshMart (React Native Expo Mobile Grocery App + Node/Express + MongoDB)  
**Course:** IT3060 Milestone 03 — Human-Computer Interaction (HCI) Assignment  
**Role Scope:** Shop Owner Portal Implementation  

---

## 1. Screen & CRUD Operations Matrix

| Screen | CRUD Operations | HTTP Method & API Endpoint | Files Changed / Added |
| :--- | :--- | :--- | :--- |
| **Owner Signup** (`14_owner-signup`) | **Create:** Register shop owner account<br>**Read:** Check duplicate email conflict (409) | `POST /api/auth/register` | `frontend/src/screens/auth/RegisterScreen.js`<br>`backend/src/controllers/authController.js` |
| **Owner Login** (`13_owner-login`) | **Read/Auth:** Authenticate credentials against MongoDB<br>**Delete:** Destroy JWT session & clear `AsyncStorage` | `POST /api/auth/login`<br>`GET /api/auth/me` | `frontend/src/screens/auth/LoginScreen.js`<br>`frontend/src/context/AuthContext.js`<br>`backend/src/controllers/authController.js` |
| **Dashboard** (`15_owner-dashboard`) | **Read:** Fetch real today revenue, pending count, active count, recent orders, weekly sales bar chart<br>**Create:** Quick Action "+ New Product" adds catalog item | `GET /api/owner/dashboard`<br>`POST /api/owner/products` | `frontend/src/screens/owner/OwnerDashboardScreen.js`<br>`backend/src/controllers/ownerController.js` |
| **Manage Slots** (Quick Action) | **Create:** Add new delivery or pickup slot<br>**Read:** Fetch slots by date and type<br>**Update:** Modify slot capacity and hours<br>**Delete:** Remove time slot | `GET /api/owner/slots`<br>`POST /api/owner/slots`<br>`PUT /api/owner/slots/:id`<br>`DELETE /api/owner/slots/:id` | `frontend/src/screens/owner/OwnerManageSlotsScreen.js`<br>`backend/src/controllers/ownerController.js` |
| **Incoming Orders** (`16_incoming-orders`) | **Read:** Filter orders by `New`, `Preparing`, and `Done` tabs<br>**Update:** Accept order (transitions to preparation)<br>**Update/Delete:** Reject / cancel order (frees booked slot)<br>**Read:** View order details breakdown modal | `GET /api/owner/orders`<br>`PATCH /api/owner/orders/:id/accept`<br>`PATCH /api/owner/orders/:id/reject` | `frontend/src/screens/owner/OwnerIncomingOrdersScreen.js`<br>`backend/src/controllers/ownerController.js` |
| **Order Preparation** (`17_order-prep`) | **Read:** Load order items checklist and packed items<br>**Update:** Check/uncheck packed item (updates % progress)<br>**Update:** "Mark Ready for Delivery" updates status to `packed` | `GET /api/owner/orders/:id/prep`<br>`PATCH /api/owner/orders/:id/prep`<br>`POST /api/owner/orders/:id/ready` | `frontend/src/screens/owner/OwnerOrderPrepScreen.js`<br>`backend/src/models/OrderPrep.js`<br>`backend/src/controllers/ownerController.js` |
| **Handed Over Success** (`done order prep`) | **Read:** View rider pickup confirmation, customer card, and rider details ("Nimal Silva picked up 09:41") | `GET /api/owner/orders/:id/prep` | `frontend/src/screens/owner/OwnerOrderPrepScreen.js` |
| **Inventory Stock** (`18_inventory-stock`) | **Read:** Search and filter by `All Items`, `Low Stock`, `Out of Stock`<br>**Create:** "+ Add New Product" modal<br>**Update:** "Edit" price, stock quantity, and low threshold<br>**Delete:** Remove product from catalog | `GET /api/owner/products`<br>`POST /api/owner/products`<br>`PUT /api/owner/products/:id`<br>`DELETE /api/owner/products/:id` | `frontend/src/screens/owner/OwnerInventoryScreen.js`<br>`backend/src/controllers/ownerController.js` |
| **Owner Profile / Settings** (`12_profile 3`) | **Read:** Owner profile, verification badge, and business stats<br>**Update:** Edit name and phone; change password<br>**Delete:** Logout of owner portal | `GET /api/owner/profile-stats`<br>`PUT /api/profile`<br>`PUT /api/profile/password` | `frontend/src/screens/owner/OwnerProfileScreen.js`<br>`frontend/src/navigation/OwnerTabs.js` |

---

## 2. Design Deviations from Screenshots & Rationale

1. **Integrated Modal Flows for Quick Actions & Edits:**
   - *Screenshot Context:* In the static design, "+ New Product" on the Dashboard and "Edit" on the Inventory screen exist as static buttons.
   - *Implementation:* Built as modal bottom sheets with full validation, activity indicators, and cancellation triggers. This avoids deep navigation stack resets and keeps the shop owner focused on their workflow.
2. **Dynamic Transition from Order Prep to Handed Over Screen:**
   - *Screenshot Context:* `17_order-preparation 1` and `done order prep` are drawn as two separate static artboards.
   - *Implementation:* Implemented within `OwnerOrderPrepScreen.js` as an animated state machine. When the owner confirms the checklist and taps "✓ Mark Ready for Delivery", the screen updates the MongoDB database and transitions directly into the concentric celebration rings hero state with rider handover confirmation.
3. **Real-Time Stock Threshold Calculation:**
   - *Screenshot Context:* Status pills such as `● Low Stock • 3 left` and `● Out of Stock • 0 left` are shown statically.
   - *Implementation:* The backend dynamically computes `isOutOfStock` (`stock <= 0`) and `isLowStock` (`stock <= lowStockThreshold`), so when the owner edits a product's stock from 0 to 15, the badge automatically recalculates and shifts from red to green in real time.
4. **Dynamic Calendar & Date Formatting:**
   - *Screenshot Context:* The dashboard shows "Saturday, 14 Mar".
   - *Implementation:* Formatted dynamically using `toLocaleDateString` to match the user's current date and time while preserving the visual hierarchy and typography.

---

## 3. 15 Functional Test Cases for Owner CRUD Features

| ID | Screen | Steps to Reproduce | Expected Result | Linked Requirement |
| :--- | :--- | :--- | :--- | :--- |
| **TC-OWN-01** | Owner Signup | 1. Open app and choose "Shop Owner".<br>2. Tap "Sign up".<br>3. Enter valid name, 9-digit phone, email, matching passwords.<br>4. Tap "Register Shop". | Account is created in MongoDB with `role: 'owner'`. JWT token stored in AsyncStorage. User navigated to Owner Dashboard. | Owner Signup: Account Creation |
| **TC-OWN-02** | Owner Signup | 1. Enter mismatched passwords in password and confirm password fields.<br>2. Tap "Register Shop". | Form validation prevents submission with error "Passwords do not match." No API request sent. | Owner Signup: Form Validation |
| **TC-OWN-03** | Owner Login | 1. Enter `owner@freshmart.lk` and `owner123`.<br>2. Tap "Sign In to Dashboard". | Authenticates successfully (HTTP 200). JWT token persisted in AsyncStorage. Owner Dashboard loaded. | Owner Login: Authentication |
| **TC-OWN-04** | Owner Login | 1. Enter customer email `kamal.perera@gmail.com` with valid customer password into Owner Login.<br>2. Tap "Sign In". | Access rejected with HTTP 403: "This account is registered as a customer. Please use the correct login." | Owner Login: Role Protection |
| **TC-OWN-05** | Dashboard | 1. Log in as owner.<br>2. Observe top stat cards and weekly sales section. | Revenue displays "Rs. 12,450" (or live DB revenue) with "+14.2%". Pending orders count and weekly sales bar chart render accurately. | Dashboard: Real Stats Read |
| **TC-OWN-06** | Dashboard | 1. On Dashboard, tap "+ New Product".<br>2. Enter "Fresh Gotukola", "Vegetables", price "120", stock "15".<br>3. Tap "Create Product". | HTTP 201 received. Success alert shown. Product appears in inventory. | Dashboard: Quick Action Create Product |
| **TC-OWN-07** | Manage Slots | 1. On Dashboard, tap "Manage Slots".<br>2. Tap "+" icon.<br>3. Enter Date, Start Time "08:00 AM", End Time "09:00 AM", Capacity "10".<br>4. Tap "Create Slot". | HTTP 201 created. New slot appears in the list with "Available" status badge. | Manage Slots: Create Slot |
| **TC-OWN-08** | Manage Slots | 1. Locate an existing slot card.<br>2. Tap pencil icon.<br>3. Change Max Capacity to 15.<br>4. Tap "Update Slot". | HTTP 200 received. Slot capacity updates to 15. | Manage Slots: Update Slot |
| **TC-OWN-09** | Manage Slots | 1. Locate a slot.<br>2. Tap trash icon.<br>3. Confirm "Delete". | HTTP 200 received. Slot is permanently removed from the database and disappears from the screen. | Manage Slots: Delete Slot |
| **TC-OWN-10** | Incoming Orders | 1. Navigate to "Orders" tab.<br>2. Select "New" tab.<br>3. Observe order cards (e.g. Order #8402).<br>4. Tap "View". | Full order details modal opens showing customer name, phone number, delivery address, item list, and total amount. | Incoming Orders: Read & Details |
| **TC-OWN-11** | Incoming Orders | 1. In "New" tab, find an order and tap "Accept".<br>2. Select "Start Prep Checklist". | Order is accepted in MongoDB. App navigates directly to Order Prep checklist screen. | Incoming Orders: Accept Workflow |
| **TC-OWN-12** | Incoming Orders | 1. In "New" tab, find an order and tap the "X" reject button.<br>2. Confirm "Reject Order". | Order status updated to `cancelled`. Booked slot capacity is released. Order moves to Done tab. | Incoming Orders: Reject / Cancel |
| **TC-OWN-13** | Order Prep | 1. On Order Prep checklist, tap item checkboxes one by one.<br>2. Observe bottom progress bar. | Checkboxes show green checkmark, item titles strike through, packed count increments, and progress bar updates from 0% to 100%. | Order Prep: Interactive Checklist |
| **TC-OWN-14** | Order Prep | 1. Tap "✓ Mark Ready for Delivery".<br>2. Confirm handover prompt. | Order status in database updates to `packed`. Screen transitions to "Handed over to delivery" celebration hero showing rider "Nimal Silva picked up 09:41". | Order Prep: Ready & Handover |
| **TC-OWN-15** | Inventory Stock | 1. Navigate to "Products" tab.<br>2. Tap "● Low Stock (X)" pill.<br>3. Tap "Edit" on a product.<br>4. Change stock from 3 to 25.<br>5. Tap "Save Changes". | Stock status immediately recalculates from "Low Stock" to "In Stock • 25 available" with green indicator dot. | Inventory Stock: Filter & Update Stock |
