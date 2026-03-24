// یہ بیک اینڈ پر pages کی list ہوگی
export const PAGES = [
  // Dashboard Pages
  { 
    id: 'admin-dashboard', 
    name: 'Admin Dashboard', 
    path: '/Admin-Dashboard-overall',
    category: 'dashboard'
  },
  { 
    id: 'role-dashboard', 
    name: 'Role Dashboard', 
    path: '/Role-dashboard',
    category: 'dashboard'
  },
  
  // Customer Pages
  { 
    id: 'add-customer', 
    name: 'Add Customer', 
    path: '/Admin-Add-customer',
    category: 'customers'
  },
  { 
    id: 'all-customers', 
    name: 'All Customers', 
    path: '/admin-all-customer',
    category: 'customers'
  },
  { 
    id: 'role-add-customer', 
    name: 'Role Add Customer', 
    path: '/Role-Add-Customer',
    category: 'customers'
  },
  { 
    id: 'role-customers', 
    name: 'Role Customers', 
    path: '/role-customers',
    category: 'customers'
  },
  { 
    id: 'customer-detail', 
    name: 'Customer Detail', 
    path: '/Customer-Detail/:id',
    category: 'customers'
  },
  
  // Order Pages
  { 
    id: 'all-orders', 
    name: 'All Orders', 
    path: '/All-Orders',
    category: 'orders'
  },
  { 
    id: 'role-orders', 
    name: 'Role Orders', 
    path: '/role-orders',
    category: 'orders'
  },
  { 
    id: 'customer-orders', 
    name: 'Customer Orders', 
    path: '/customer-orders/:id',
    category: 'orders'
  },
  
  // Labor Pages
  { 
    id: 'add-labor', 
    name: 'Add Labor', 
    path: '/Add-Labor',
    category: 'labor'
  },
  { 
    id: 'all-labor', 
    name: 'All Labor', 
    path: '/All-Labor',
    category: 'labor'
  },
  { 
    id: 'role-add-labor', 
    name: 'Role Add Labor', 
    path: '/role-add-labor',
    category: 'labor'
  },
  { 
    id: 'role-labor', 
    name: 'Role Labor', 
    path: '/role-labor',
    category: 'labor'
  },
  { 
    id: 'edit-labor', 
    name: 'Edit Labor', 
    path: '/edit-labor/:id',
    category: 'labor'
  },
  { 
    id: 'worker-details', 
    name: 'Worker Details', 
    path: '/Worker-Details-Page/:id',
    category: 'labor'
  },
  
  // Attendance Pages
  { 
    id: 'attendance', 
    name: 'Attendance', 
    path: '/Attendance-Page',
    category: 'attendance'
  },
  { 
    id: 'role-attendance', 
    name: 'Role Attendance', 
    path: '/role-attendance',
    category: 'attendance'
  },
  
  // Quotation Pages
  { 
    id: 'quotation-customer', 
    name: 'Quotation Customer', 
    path: '/QuotationCustomer',
    category: 'quotations'
  },
  { 
    id: 'all-quotations', 
    name: 'All Quotations', 
    path: '/all-Quotation',
    category: 'quotations'
  },
  
  // Material Pages
  { 
    id: 'admin-material', 
    name: 'Admin Material', 
    path: '/Admin-Material',
    category: 'material'
  },
  
  // Payment & Expense Pages
  { 
    id: 'admin-payment', 
    name: 'Admin Payment', 
    path: '/Admin-Payment',
    category: 'financial'
  },
  { 
    id: 'admin-expenses', 
    name: 'Admin Expenses', 
    path: '/admin-expenses',
    category: 'financial'
  },
  { 
    id: 'payments', 
    name: 'Payments', 
    path: '/payments',
    category: 'financial'
  },
  { 
    id: 'expenses', 
    name: 'Expenses', 
    path: '/expenses',
    category: 'financial'
  },
  
  // Settings Pages
  { 
    id: 'roles-management', 
    name: 'Role Management', 
    path: '/add-roles',
    category: 'settings'
  },
  { 
    id: 'profile', 
    name: 'Profile', 
    path: '/Admin-Profile-custoize',
    category: 'settings'
  },
  { 
    id: 'account-settings', 
    name: 'Account Settings', 
    path: '/Admin-Account-Settings',
    category: 'settings'
  },
  { 
    id: 'theme-settings', 
    name: 'Theme Settings', 
    path: '/Theme-Settings',
    category: 'settings'
  },
  { 
    id: 'profile-settings', 
    name: 'Profile Settings', 
    path: '/profile-settings',
    category: 'settings'
  },
  { 
    id: 'theme', 
    name: 'Theme', 
    path: '/theme',
    category: 'settings'
  },
  { 
    id: 'settings', 
    name: 'Settings', 
    path: '/settings',
    category: 'settings'
  }
];

// بیک اینڈ پر بھی categories
export const PAGE_CATEGORIES = {
  dashboard: {
    name: 'Dashboard',
    pages: ['admin-dashboard', 'role-dashboard']
  },
  customers: {
    name: 'Customer Management',
    pages: ['add-customer', 'all-customers', 'role-add-customer', 'role-customers', 'customer-detail']
  },
  orders: {
    name: 'Order Management',
    pages: ['all-orders', 'role-orders', 'customer-orders']
  },
  labor: {
    name: 'Labor Management',
    pages: ['add-labor', 'all-labor', 'role-add-labor', 'role-labor', 'edit-labor', 'worker-details']
  },
  attendance: {
    name: 'Attendance',
    pages: ['attendance', 'role-attendance']
  },
  quotations: {
    name: 'Quotations',
    pages: ['quotation-customer', 'all-quotations']
  },
  material: {
    name: 'Material',
    pages: ['admin-material']
  },
  financial: {
    name: 'Financial',
    pages: ['admin-payment', 'admin-expenses', 'payments', 'expenses']
  },
  settings: {
    name: 'Settings',
    pages: ['roles-management', 'profile', 'account-settings', 'theme-settings', 'profile-settings', 'theme', 'settings']
  }
};

// Helper function
export const getPageById = (pageId) => {
  return PAGES.find(page => page.id === pageId);
};