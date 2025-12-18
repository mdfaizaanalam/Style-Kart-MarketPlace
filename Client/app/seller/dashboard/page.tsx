'use client';

import SellerDashboard from '@/components/Seller/SellerDashboard';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const page = () => {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if seller is authenticated
    const token = localStorage.getItem('sellerToken');
    const sellerData = localStorage.getItem('sellerData');

    // Allow access if a valid token exists OR if sellerData exists (dummy/local seller)
    if (!token && !sellerData) {
      router.push('/seller/login');
    } else {
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <SellerDashboard />
    </div>
  );
};

export default page;