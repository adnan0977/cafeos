import React, { useEffect, useState } from 'react';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { LoginPortal } from './components/auth/LoginPortal';
import { BillerPortal } from './components/biller/BillerPortal';
import { AccessDeniedView } from './components/common/AccessDeniedView';
import { GlobalSearchModal } from './components/common/GlobalSearchModal';
import { KOTPrintModal } from './components/common/KOTPrintModal';
import { Navbar } from './components/common/Navbar';
import { OfflineSyncModal } from './components/common/OfflineSyncModal';
import { CatalogSyncModal } from './components/common/CatalogSyncModal';
import { ShiftModal } from './components/common/ShiftModal';
import { ThermalReceiptModal } from './components/common/ThermalReceiptModal';
import { RiderPortal } from './components/delivery/RiderPortal';
import { InventoryPortal } from './components/inventory/InventoryPortal';
import { KitchenDisplayPortal } from './components/kds/KitchenDisplayPortal';
import { POSPortal } from './components/pos/POSPortal';
import { ReportsPortal } from './components/reports/ReportsPortal';
import { SOPPortal } from './components/sop/SOPPortal';
import { CustomerDigitalMenu } from './components/customer/CustomerDigitalMenu';
import { WindowsCashierApp } from './components/cashier/WindowsCashierApp';
import { AuthProvider, useAuth } from './context/AuthContext';
import { RestaurantProvider, useRestaurant } from './context/RestaurantContext';
import { ThemeProvider } from './context/ThemeContext';
import { UserRole } from './types';

const getDefaultTabForRole = (role?: UserRole): string => {
  switch (role) {
    case 'super_admin':
    case 'admin':
      return 'admin';
    case 'cashier':
      return 'windows_cashier';
    case 'biller':
      return 'windows_cashier';
    case 'kitchen_staff':
      return 'kds';
    case 'inventory_staff':
      return 'inventory';
    case 'delivery_rider':
      return 'rider';
    case 'employee':
      return 'sop';
    default:
      return 'login';
  }
};

const MainLayout: React.FC = () => {
  const { currentUser, canAccessModule } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam) return tabParam;
    }
    return currentUser ? getDefaultTabForRole(currentUser.role) : 'login';
  });
  const { setIsSearchModalOpen, menuItems, categories, createOrder, settings } = useRestaurant();

  // If user logs out, switch to login view
  useEffect(() => {
    if (!currentUser && currentTab !== 'login') {
      setCurrentTab('login');
    }
  }, [currentUser]);

  // Global hotkeys (Ctrl+K / Cmd+K for search)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setIsSearchModalOpen]);

  // Role permissions checker for active tab
  const canAccessPortal = (tabId: string): boolean => {
    return canAccessModule(tabId);
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-white">
      {/* Top Universal Navbar (hidden in dedicated Windows Cashier Terminal mode) */}
      {currentTab !== 'windows_cashier' && (
        <Navbar currentTab={currentTab} setCurrentTab={setCurrentTab} />
      )}

      {/* Main Active View Area with Role Route Guards */}
      <main className="flex-1 flex flex-col">
        {currentTab === 'windows_cashier' && (
          <WindowsCashierApp onNavigateTab={(tab) => setCurrentTab(tab)} />
        )}

        {currentTab === 'login' && <LoginPortal onSuccessNavigate={(tab) => setCurrentTab(tab)} />}

        {currentTab === 'admin' &&
          (canAccessPortal('admin') ? (
            <AdminDashboard onNavigatePortal={(tab) => setCurrentTab(tab)} />
          ) : (
            <AccessDeniedView
              currentPortalName="Admin Dashboard & Financial Management"
              requiredRoleLabel="Store Manager or Super Admin"
              requiredRoles={['super_admin', 'admin']}
              onNavigate={(tab) => setCurrentTab(tab)}
            />
          ))}

        {currentTab === 'reports' &&
          (canAccessPortal('reports') || canAccessPortal('admin') ? (
            <ReportsPortal />
          ) : (
            <AccessDeniedView
              currentPortalName="Restaurant Reports & Analytics"
              requiredRoleLabel="Store Manager or Super Admin"
              requiredRoles={['super_admin', 'admin']}
              onNavigate={(tab) => setCurrentTab(tab)}
            />
          ))}

        {currentTab === 'pos' &&
          (canAccessPortal('pos') ? (
            <POSPortal onNavigateTab={(tab) => setCurrentTab(tab)} />
          ) : (
            <AccessDeniedView
              currentPortalName="POS Terminal"
              requiredRoleLabel="POS Cashier, Biller, or Manager"
              requiredRoles={['super_admin', 'admin', 'cashier', 'biller']}
              onNavigate={(tab) => setCurrentTab(tab)}
            />
          ))}

        {currentTab === 'kds' &&
          (canAccessPortal('kds') ? (
            <KitchenDisplayPortal />
          ) : (
            <AccessDeniedView
              currentPortalName="Kitchen Display System (KDS)"
              requiredRoleLabel="Kitchen Chef / Line Cook or Manager"
              requiredRoles={['super_admin', 'admin', 'kitchen_staff']}
              onNavigate={(tab) => setCurrentTab(tab)}
            />
          ))}

        {currentTab === 'biller' &&
          (canAccessPortal('biller') ? (
            <BillerPortal />
          ) : (
            <AccessDeniedView
              currentPortalName="Billing Counter"
              requiredRoleLabel="Biller, Cashier, or Manager"
              requiredRoles={['super_admin', 'admin', 'biller', 'cashier']}
              onNavigate={(tab) => setCurrentTab(tab)}
            />
          ))}

        {currentTab === 'inventory' &&
          (canAccessPortal('inventory') ? (
            <InventoryPortal />
          ) : (
            <AccessDeniedView
              currentPortalName="Inventory & Store Management"
              requiredRoleLabel="Inventory Staff, Storekeeper, or Manager"
              requiredRoles={['super_admin', 'admin', 'inventory_staff']}
              onNavigate={(tab) => setCurrentTab(tab)}
            />
          ))}

        {currentTab === 'rider' &&
          (canAccessPortal('rider') ? (
            <RiderPortal />
          ) : (
            <AccessDeniedView
              currentPortalName="Rider Delivery Dispatch"
              requiredRoleLabel="Delivery Rider or Dispatcher"
              requiredRoles={['super_admin', 'admin', 'delivery_rider']}
              onNavigate={(tab) => setCurrentTab(tab)}
            />
          ))}

        {currentTab === 'sop' && <SOPPortal />}

        {currentTab === 'customer_menu' && (
          <CustomerDigitalMenu
            menuItems={menuItems}
            categories={categories}
            currencySymbol={settings.currencySymbol}
            onPlaceOrder={createOrder}
            tableNumber="Table 4"
          />
        )}
      </main>

      {/* Global Application Modals */}
      <ThermalReceiptModal />
      <KOTPrintModal />
      <GlobalSearchModal onNavigateTab={(tab) => setCurrentTab(tab)} />
      <ShiftModal />
      <OfflineSyncModal />
      <CatalogSyncModal />
    </div>
  );
};

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RestaurantProvider>
          <MainLayout />
        </RestaurantProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
