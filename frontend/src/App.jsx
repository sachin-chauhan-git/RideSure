import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { RiderView } from './components/RiderView';
import { DriverView } from './components/DriverView';
import { AdminView } from './components/AdminView';
import { AuthModal } from './components/AuthModal';
import { WalletModal } from './components/WalletModal';

const MainContent = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('rider');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [walletUpdated, setWalletUpdated] = useState(0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenWallet={() => setIsWalletOpen(true)}
        walletUpdated={walletUpdated}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6">
        {activeTab === 'rider' && <RiderView user={user} onOpenWallet={() => setIsWalletOpen(true)} />}
        {activeTab === 'driver' && <DriverView user={user} />}
        {activeTab === 'admin' && <AdminView />}
      </main>

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      <WalletModal
        isOpen={isWalletOpen}
        onClose={() => setIsWalletOpen(false)}
        onBalanceUpdate={() => setWalletUpdated((prev) => prev + 1)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainContent />
    </AuthProvider>
  );
}
