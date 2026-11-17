/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CafeProvider, useCafe } from './context/CafeContext';
import { Navbar } from './components/common/Navbar';
import { DemoSetupModal } from './components/common/DemoSetupModal';
import { CustomerView } from './components/CustomerView/CustomerView';
import { KitchenView } from './components/KitchenView/KitchenView';
import { AdminView } from './components/AdminView/AdminView';

const MainApp: React.FC = () => {
  const { activeView } = useCafe();

  return (
    <div className="min-h-screen bg-amber-50/40 text-slate-900 font-sans-body">
      <Navbar />
      <DemoSetupModal />

      <main>
        {activeView === 'customer' && <CustomerView />}
        {activeView === 'kitchen' && <KitchenView />}
        {activeView === 'admin' && <AdminView />}
      </main>
    </div>
  );
};

export default function App() {
  return (
    <CafeProvider>
      <MainApp />
    </CafeProvider>
  );
}
