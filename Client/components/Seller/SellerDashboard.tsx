'use client';

import React, { useState, useEffect } from 'react';
import { X, Package, TrendingUp, DollarSign, ShoppingCart, Eye, Edit, Trash2, Plus, BarChart3, Users, Star, AlertCircle, Check } from 'lucide-react';
import Footer from "../Footer";
// Add these imports after your existing imports
import {
  PieChart,
  Pie,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3500";

interface OrderItem {
  productid: string;
  title: string;
  price: number;
  discount: number;
  quantity: number;
  imglink: string;
}

interface SellerOrder {
  orderid: number;
  userid: number;
  totalprice: string | number;  // ← Allow both string and number
  status: string;
  payment_method: string;
  payment_status: string;
  order_date: string;
  delivered_date: string | null;
  cancelled_date: string | null;
  cancellation_reason: string | null;
  username: string;
  user_email: string;
  user_phone: string;
  products: OrderItem[];
}

interface CancelRequest {
  request_id: number;
  order_id: number;
  request_type: string;
  reason: string;
  comments: string;
  request_date: string;
  status: string;
  request_status: string;
  orderid: number;
  totalprice: number;
  order_status: string;
  username: string;
  user_email: string;
  products: OrderItem[];
}

interface ReturnRequest {
  request_id?: number;      // Add optional for compatibility
  requestid?: number;        // Keep for backward compatibility
  order_id?: number;         // Add snake_case version
  orderid?: number;          // Keep camelCase version
  product_id?: number;       // Add snake_case
  productid?: number;        // Keep camelCase
  reason: string;
  comments?: string;
  status?: string;           // Keep as optional
  request_status?: string;   // Add snake_case version
  requeststatus?: string;    // Keep camelCase version
  request_date?: string;     // Add snake_case
  requestdate?: string;      // Keep camelCase
  totalprice?: number;
  orderstatus?: string;
  username?: string;
  user_email?: string;       // Add snake_case
  useremail?: string;        // Keep camelCase
  product_title?: string;    // Add snake_case
  producttitle?: string;     // Keep camelCase
  product_price?: number;    // Add snake_case
  productprice?: number;     // Keep camelCase
  product_image?: string;    // Add snake_case
  productimage?: string;     // Keep camelCase
}



interface Seller {
  seller_id: string | number;
  name: string;
  storename: string;
  verified: boolean;
}

interface Product {
  productid: string;
  title: string;
  description?: string;
  price: number;
  discount: number;
  stock: number;
  category?: string;
  imglink?: string;
  tags?: string;
  product_group?: string;
  seller_name?: string;
  storename?: string;
  sold?: number;
}

interface Stats {
  totalProducts: number;
  inStock: number;
  outOfStock: number;
  totalRevenue: string;
  totalOrders: number;
  avgRating: number;
}

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  color: 'blue' | 'green' | 'purple' | 'yellow';
}

const StatCard: React.FC<StatCardProps> = ({ icon, title, value, color }) => {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    yellow: 'bg-yellow-100 text-yellow-600',
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

export default function EnhancedSellerDashboard() {
  const [seller, setSeller] = useState<Seller | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [marketplaceProducts, setMarketplaceProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showProductDetail, setShowProductDetail] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [viewMode, setViewMode] = useState<'myProducts' | 'marketplace'>('myProducts');

  const [newProduct, setNewProduct] = useState({
    title: '',
    description: '',
    price: '',
    discount: '0',
    stock: '',
    category: '',
    imgLink: '',
    tags: '',
    productGroup: '',
  });

  const [stats, setStats] = useState<Stats>({
    totalProducts: 0,
    inStock: 0,
    outOfStock: 0,
    totalRevenue: '0.00',
    totalOrders: 0,
    avgRating: 0,
  });

  const [orders, setOrders] = useState<SellerOrder[]>([]);
  const [cancelRequests, setCancelRequests] = useState<CancelRequest[]>([]);
  const [returnRequests, setReturnRequests] = useState<ReturnRequest[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);


  // 1) Load seller + initial stats/products once
  useEffect(() => {
    const sellerData = localStorage.getItem('sellerData');
    if (sellerData) {
      try {
        const parsed = JSON.parse(sellerData);
        setSeller(parsed);
        fetchDashboardStats();           // already there
        fetchSellerProducts(parsed.seller_id);
      } catch (err) {
        console.error('Failed to parse seller data', err);
        window.location.href = '/seller/login';
      }
    } else {
      window.location.href = '/seller/login';
    }
  }, []);

  // 2) Load full orders/cancel/return when Orders tab is active
  useEffect(() => {
    if (seller && activeTab === 'orders') {
      fetchSellerOrders();
      fetchCancelRequests();
      fetchReturnRequests();
    }
  }, [seller, activeTab]);

  // 3) Load fresh data when Analytics tab is active
  useEffect(() => {
    if (!seller) return;

    if (activeTab === 'analytics') {
      fetchSellerOrders();
      fetchReturnRequests();
      fetchCancelRequests();
      fetchDashboardStats();
    }
  }, [activeTab, seller]);



  const fetchSellerProducts = async (sellerId: string | number) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('sellerToken');
      const res = await fetch(`${API_URL}/api/seller/products/${sellerId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) throw new Error('Failed to fetch products');

      const data = await res.json();
      setProducts(data);
      calculateStats(data);
    } catch (err) {
      console.error('Failed to fetch products:', err);
      setProducts([]);
      calculateStats([]);
    } finally {
      setLoading(false);
    }
  };


  const fetchMarketplaceProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/sitedata/all-products`);
      if (!res.ok) throw new Error('Failed to fetch marketplace products');
      const result = await res.json();
      setMarketplaceProducts(result.data || []);
    } catch (err) {
      console.error('Failed to fetch marketplace:', err);
      setMarketplaceProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSellerOrders = async () => {
    if (!seller) return;
    setOrdersLoading(true);
    try {
      const token = localStorage.getItem('sellerToken');
      if (!token) throw new Error('No token found');

      const response = await fetch(`${API_URL}/api/seller/orders/${seller.seller_id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to fetch orders');
      const data = await response.json();
      setOrders(data.orders || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  };

  const fetchCancelRequests = async () => {
    if (!seller) return;
    try {
      const token = localStorage.getItem('sellerToken');
      if (!token) throw new Error('No token found');

      const response = await fetch(`${API_URL}/api/seller/cancel-requests/${seller.seller_id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to fetch cancel requests');
      const data = await response.json();
      setCancelRequests(data.cancelRequests || []);
    } catch (error) {
      console.error('Error fetching cancel requests:', error);
      setCancelRequests([]);
    }
  };

  const fetchReturnRequests = async () => {
    if (!seller) return;

    try {
      const token = localStorage.getItem('sellerToken');
      if (!token) throw new Error('No token found');

      const response = await fetch(`${API_URL}/api/seller/return-requests/${seller.seller_id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Failed to fetch return requests');

      const data = await response.json();
      console.log('[FRONTEND] Return Requests Response:', data); // Add this
      console.log('[FRONTEND] Return Requests Count:', data.returnRequests?.length); // Add this

      setReturnRequests(data.returnRequests || []);
    } catch (error) {
      console.error('Error fetching return requests:', error);
      setReturnRequests([]);
    }
  };


  const fetchDashboardStats = async () => {
    if (!seller) return;

    try {
      const token = localStorage.getItem('sellerToken');
      if (!token) throw new Error('No token found');

      const response = await fetch(`${API_URL}/api/seller/dashboard/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to fetch stats');

      const data = await response.json();

      setStats({
        totalProducts: data.totalProducts || 0,
        inStock: data.totalProducts || 0, // Assuming most are in stock
        outOfStock: 0,
        totalRevenue: data.totalRevenue?.toFixed(2) || '0.00',
        totalOrders: data.totalOrders || 0,
        avgRating: 4.5
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };


  const handleMarkAsDelivered = async (orderId: number) => {
    if (!confirm('Mark this order as delivered?')) return;

    try {
      const token = localStorage.getItem('sellerToken');
      const response = await fetch(`${API_URL}/api/seller/orders/${orderId}/mark-delivered`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sellerId: seller?.seller_id })
      });

      if (response.ok) {
        alert('Order marked as delivered!');
        fetchSellerOrders();
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to mark as delivered');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred');
    }
  };

  const handleCancelRequest = async (requestId: number, action: 'approved' | 'rejected') => {
    if (!confirm(`${action === 'approved' ? 'Approve' : 'Reject'} this cancellation request?`)) return;

    try {
      const token = localStorage.getItem('sellerToken');
      const response = await fetch(`${API_URL}/api/seller/cancel-requests/${requestId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: action, sellerId: seller?.seller_id })
      });

      if (response.ok) {
        alert(`Cancellation request ${action}!`);
        fetchCancelRequests();
        fetchSellerOrders();
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to update request');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred');
    }
  };

  const handleReturnRequest = async (requestId: number, action: string) => {
    if (!confirm(`Set return request status to ${action}?`)) return;

    try {
      const token = localStorage.getItem('sellerToken');
      const response = await fetch(`${API_URL}/api/seller/return-requests/${requestId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: action,
          sellerId: seller?.seller_id
        }),
      });

      if (response.ok) {
        alert(`Return request ${action.toLowerCase()}!`);

        // Refresh all data to show updated status
        fetchReturnRequests();
        fetchSellerOrders();

        // If approved, the backend should update order status to "Returned"
        // Make sure your backend does this automatically
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to update request');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred');
    }
  };

  const handleApproveReturn = async (orderId: number) => {
    if (!confirm('Approve this return request and process refund?')) return;

    try {
      const token = localStorage.getItem('sellerToken');

      // Update order status directly since return_requests table is empty
      const response = await fetch(`${API_URL}/api/seller/orders/${orderId}/approve-return`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sellerId: seller?.seller_id
        }),
      });

      if (response.ok) {
        alert('Return approved successfully! Refund will be processed.');
        fetchSellerOrders(); // Refresh orders
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to approve return');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred');
    }
  };






  const calculateStats = (productList: Product[]) => {
    const inStock = productList.filter(p => p.stock > 0).length;
    const outOfStock = productList.filter(p => p.stock === 0).length;
    const totalRevenue = productList.reduce((sum, p) => sum + ((p.price - (p.discount || 0)) * (p.sold || 0)), 0);

    setStats({
      totalProducts: productList.length,
      inStock,
      outOfStock,
      totalRevenue: totalRevenue.toFixed(2),
      totalOrders: productList.reduce((sum, p) => sum + (p.sold || 0), 0),
      avgRating: 4.5,
    });
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seller) {
      alert('Please login as a seller');
      return;
    }

    try {
      const token = localStorage.getItem('sellerToken');
      const response = await fetch(`${API_URL}/api/seller/product/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          sellerId: seller.seller_id,
          title: newProduct.title,
          description: newProduct.description,
          price: parseFloat(newProduct.price),
          discount: parseFloat(newProduct.discount),
          stock: parseInt(newProduct.stock, 10),
          imgLink: newProduct.imgLink,
          category: newProduct.category,
          tags: newProduct.tags,
          productGroup: newProduct.productGroup || newProduct.title,
        }),
      });

      if (response.ok) {
        setShowAddForm(false);
        setNewProduct({
          title: '',
          description: '',
          price: '',
          discount: '0',
          stock: '',
          category: '',
          imgLink: '',
          tags: '',
          productGroup: '',
        });
        fetchSellerProducts(seller.seller_id);
        alert('Product added successfully!');
      } else {
        const resBody = await response.json().catch(() => ({}));
        alert(resBody?.error || 'Failed to add product');
      }
    } catch (err) {
      console.error('Failed to add product', err);
      alert('An error occurred. Please try again.');
    }
  };

  const handleRemoveProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to remove this product?')) return;

    try {
      const token = localStorage.getItem('sellerToken');
      const response = await fetch(`${API_URL}/api/seller/product/remove`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId, sellerId: seller?.seller_id }),
      });

      if (response.ok) {
        fetchSellerProducts(seller!.seller_id);
        alert('Product removed successfully!');
      } else {
        const resBody = await response.json().catch(() => ({}));
        alert(resBody.error || 'Failed to remove product');
      }
    } catch (err) {
      console.error('Failed to remove product', err);
      alert('An error occurred. Please try again.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('sellerToken');
    localStorage.removeItem('sellerData');
    window.location.href = '/seller/login';
  };

  const openProductDetail = (product: Product) => {
    setSelectedProduct(product);
    setShowProductDetail(true);
  };

  const toggleViewMode = () => {
    if (viewMode === 'myProducts') {
      setViewMode('marketplace');
      fetchMarketplaceProducts();
    } else {
      setViewMode('myProducts');
      if (seller) fetchSellerProducts(seller.seller_id);
    }
  };

  if (loading && !seller) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const displayProducts = viewMode === 'myProducts' ? products : marketplaceProducts;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Package className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{seller?.storename || 'Seller Dashboard'}</h1>
                <p className="text-sm text-gray-500">{seller?.name}</p>
              </div>
              {seller?.verified && (
                <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full flex items-center gap-1">
                  <Check className="w-4 h-4" />
                  Verified
                </span>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowAddForm(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Product
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b sticky top-[73px] z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {['overview', 'products', 'analytics', 'orders'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition ${activeTab === tab
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Grid - 4 Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                icon={<Package className="w-8 h-8" />}
                title="Total Products"
                value={products.length}
                color="blue"
              />
              <StatCard
                icon={<ShoppingCart className="w-8 h-8" />}
                title="Total Orders"
                value={orders.length}
                color="green"
              />
              <StatCard
                icon={<DollarSign className="w-8 h-8" />}
                title="Revenue"
                value={`$${orders.reduce((sum, order) => sum + parseFloat(order.totalprice as string || '0'), 0).toFixed(2)}`}
                color="purple"
              />
              <StatCard
                icon={<Star className="w-8 h-8" />}
                title="Avg Rating"
                value={stats.avgRating}
                color="yellow"
              />
            </div>

            {/* Main Analytics Grid - LEFT: Charts, RIGHT: Stock & Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
              {/* LEFT COLUMN - Charts */}
              <div className="space-y-6">
                {/* Order Status Distribution - Donut Chart */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900">Order Status Distribution</h3>
                    <div className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-semibold rounded-full">
                      Live Data
                    </div>
                  </div>
                  <div className="h-80">
                    {orders.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              {
                                name: 'Confirmed',
                                value: orders.filter(o => o.status.toLowerCase().replace(/[\s_-]+/g, '') === 'confirmed').length,
                                fill: '#3B82F6',
                                icon: '📦'
                              },
                              {
                                name: 'Delivered',
                                value: orders.filter(o => o.status.toLowerCase().replace(/[\s_-]+/g, '') === 'delivered').length,
                                fill: '#10B981',
                                icon: '✓'
                              },
                              {
                                name: 'Cancelled',
                                value: orders.filter(o => o.status.toLowerCase().replace(/[\s_-]+/g, '') === 'cancelled').length,
                                fill: '#EF4444',
                                icon: '✗'
                              },
                              {
                                name: 'Return Requested',
                                value: orders.filter(o => o.status.toLowerCase().replace(/[\s_-]+/g, '') === 'returnrequested').length,
                                fill: '#F59E0B',
                                icon: '↩'
                              },
                              {
                                name: 'Returned',
                                value: orders.filter(o => o.status.toLowerCase().replace(/[\s_-]+/g, '') === 'returned').length,
                                fill: '#8B5CF6',
                                icon: '✅'
                              }
                            ].filter(item => item.value > 0)}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={110}
                            paddingAngle={2}
                            dataKey="value"
                            label={(entry: any) => `${entry.value}`}
                            labelLine={false}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'white',
                              border: '1px solid #E5E7EB',
                              borderRadius: '8px',
                              padding: '8px 12px'
                            }}
                          />
                          <Legend
                            verticalAlign="bottom"
                            height={36}
                            iconType="circle"
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-gray-400">
                        <div className="text-center">
                          <ShoppingCart className="w-16 h-16 mx-auto mb-3 opacity-20" />
                          <p className="text-sm font-medium">No orders yet</p>
                          <p className="text-xs mt-1">Start selling to see analytics</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Revenue Trend - Area Chart */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900">Revenue & Orders Trend</h3>
                    <div className="flex items-center gap-4 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                        <span className="text-gray-600">Revenue</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span className="text-gray-600">Orders</span>
                      </div>
                    </div>
                  </div>
                  <div className="h-72">
                    {orders.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={(() => {
                            const monthlyData: { [key: string]: { revenue: number; count: number } } = {};
                            orders.forEach(order => {
                              const date = new Date(order.order_date);
                              const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                              if (!monthlyData[monthKey]) {
                                monthlyData[monthKey] = { revenue: 0, count: 0 };
                              }
                              monthlyData[monthKey].revenue += parseFloat(order.totalprice as string || '0');
                              monthlyData[monthKey].count += 1;
                            });
                            return Object.keys(monthlyData)
                              .sort()
                              .slice(-6)
                              .map(month => ({
                                month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short' }),
                                revenue: Number(monthlyData[month].revenue.toFixed(2)),
                                orders: monthlyData[month].count
                              }));
                          })()}
                          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8} />
                              <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                              <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                          <XAxis
                            dataKey="month"
                            stroke="#9CA3AF"
                            style={{ fontSize: '12px' }}
                          />
                          <YAxis
                            yAxisId="left"
                            stroke="#9CA3AF"
                            style={{ fontSize: '12px' }}
                          />
                          <YAxis
                            yAxisId="right"
                            orientation="right"
                            stroke="#9CA3AF"
                            style={{ fontSize: '12px' }}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'white',
                              border: '1px solid #E5E7EB',
                              borderRadius: '8px',
                              padding: '8px 12px'
                            }}
                          />
                          <Area
                            yAxisId="left"
                            type="monotone"
                            dataKey="revenue"
                            stroke="#8B5CF6"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorRevenue)"
                          />
                          <Area
                            yAxisId="right"
                            type="monotone"
                            dataKey="orders"
                            stroke="#10B981"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorOrders)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-gray-400">
                        <div className="text-center">
                          <TrendingUp className="w-16 h-16 mx-auto mb-3 opacity-20" />
                          <p className="text-sm font-medium">No data available</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN - Stock Status & Quick Actions */}
              <div className="space-y-6">
                {/* Stock Status with Visual Bars */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Stock Status</h3>
                  <div className="space-y-4">
                    {/* In Stock */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-600">In Stock</span>
                        <span className="text-sm font-bold text-green-600">
                          {products.filter(p => p.stock > 0).length} items
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-3">
                        <div
                          className="bg-gradient-to-r from-green-400 to-green-600 h-3 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                          style={{
                            width: `${products.length > 0
                              ? (products.filter(p => p.stock > 0).length / products.length) * 100
                              : 0
                              }%`
                          }}
                        >
                          <span className="text-[10px] font-bold text-white">
                            {products.length > 0
                              ? Math.round((products.filter(p => p.stock > 0).length / products.length) * 100)
                              : 0}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Out of Stock */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-600">Out of Stock</span>
                        <span className="text-sm font-bold text-red-600">
                          {products.filter(p => p.stock === 0).length} items
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-3">
                        <div
                          className="bg-gradient-to-r from-red-400 to-red-600 h-3 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                          style={{
                            width: `${products.length > 0
                              ? (products.filter(p => p.stock === 0).length / products.length) * 100
                              : 0
                              }%`
                          }}
                        >
                          <span className="text-[10px] font-bold text-white">
                            {products.length > 0
                              ? Math.round((products.filter(p => p.stock === 0).length / products.length) * 100)
                              : 0}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Low Stock Alert */}
                    <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-amber-900">Low Stock Alert</p>
                          <p className="text-xs text-amber-700 mt-1">
                            {products.filter(p => p.stock > 0 && p.stock < 10).length} products need restocking
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setShowAddForm(true)}
                      className="group p-4 border-2 border-dashed border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all text-center"
                    >
                      <Plus className="w-6 h-6 mx-auto mb-2 text-gray-400 group-hover:text-blue-500 transition" />
                      <span className="text-xs font-semibold text-gray-600 group-hover:text-blue-600">Add Product</span>
                    </button>

                    <button
                      onClick={() => setActiveTab('products')}
                      className="group p-4 border-2 border-dashed border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all text-center"
                    >
                      <Eye className="w-6 h-6 mx-auto mb-2 text-gray-400 group-hover:text-blue-500 transition" />
                      <span className="text-xs font-semibold text-gray-600 group-hover:text-blue-600">View All</span>
                    </button>

                    <button
                      onClick={toggleViewMode}
                      className="group p-4 border-2 border-dashed border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all text-center"
                    >
                      <BarChart3 className="w-6 h-6 mx-auto mb-2 text-gray-400 group-hover:text-blue-500 transition" />
                      <span className="text-xs font-semibold text-gray-600 group-hover:text-blue-600">Marketplace</span>
                    </button>

                    <button
                      onClick={() => setActiveTab('analytics')}
                      className="group p-4 border-2 border-dashed border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all text-center"
                    >
                      <TrendingUp className="w-6 h-6 mx-auto mb-2 text-gray-400 group-hover:text-blue-500 transition" />
                      <span className="text-xs font-semibold text-gray-600 group-hover:text-blue-600">Analytics</span>
                    </button>
                  </div>
                </div>

                {/* Performance Metrics */}
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
                  <h3 className="text-lg font-bold mb-4">Performance Metrics</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center pb-3 border-b border-blue-400">
                      <span className="text-sm opacity-90">Success Rate</span>
                      <span className="text-xl font-bold">
                        {orders.length > 0
                          ? Math.round((orders.filter(o => o.status.toLowerCase() === 'delivered').length / orders.length) * 100)
                          : 0}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b border-blue-400">
                      <span className="text-sm opacity-90">Avg Order Value</span>
                      <span className="text-xl font-bold">
                        ${orders.length > 0
                          ? (orders.reduce((sum, order) => sum + parseFloat(order.totalprice as string || '0'), 0) / orders.length).toFixed(2)
                          : '0.00'
                        }
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm opacity-90">Return Rate</span>
                      <span className="text-xl font-bold">
                        {orders.length > 0
                          ? Math.round((orders.filter(o => {
                            const status = o.status.toLowerCase().replace(/[\s_-]+/g, '');
                            return status === 'returned' || status === 'returnrequested';
                          }).length / orders.length) * 100)
                          : 0}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Status Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border-l-4 border-blue-500">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">📦</span>
                  <span className="text-xs font-semibold text-blue-600 bg-white px-2 py-1 rounded-full">
                    New
                  </span>
                </div>
                <p className="text-sm text-blue-600 font-medium mb-1">Confirmed</p>
                <p className="text-2xl font-bold text-blue-700">
                  {orders.filter(o => o.status.toLowerCase().replace(/[\s_-]+/g, '') === 'confirmed').length}
                </p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border-l-4 border-green-500">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">✓</span>
                  <span className="text-xs font-semibold text-green-600 bg-white px-2 py-1 rounded-full">
                    Done
                  </span>
                </div>
                <p className="text-sm text-green-600 font-medium mb-1">Delivered</p>
                <p className="text-2xl font-bold text-green-700">
                  {orders.filter(o => o.status.toLowerCase().replace(/[\s_-]+/g, '') === 'delivered').length}
                </p>
              </div>

              <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 border-l-4 border-red-500">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">✗</span>
                  <span className="text-xs font-semibold text-red-600 bg-white px-2 py-1 rounded-full">
                    Lost
                  </span>
                </div>
                <p className="text-sm text-red-600 font-medium mb-1">Cancelled</p>
                <p className="text-2xl font-bold text-red-700">
                  {orders.filter(o => o.status.toLowerCase().replace(/[\s_-]+/g, '') === 'cancelled').length}
                </p>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border-l-4 border-orange-500">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">↩</span>
                  <span className="text-xs font-semibold text-orange-600 bg-white px-2 py-1 rounded-full">
                    Pending
                  </span>
                </div>
                <p className="text-sm text-orange-600 font-medium mb-1">Returns</p>
                <p className="text-2xl font-bold text-orange-700">
                  {orders.filter(o => o.status.toLowerCase().replace(/[\s_-]+/g, '') === 'returnrequested').length}
                </p>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border-l-4 border-purple-500">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">✅</span>
                  <span className="text-xs font-semibold text-purple-600 bg-white px-2 py-1 rounded-full">
                    Refunded
                  </span>
                </div>
                <p className="text-sm text-purple-600 font-medium mb-1">Returned</p>
                <p className="text-2xl font-bold text-purple-700">
                  {orders.filter(o => o.status.toLowerCase().replace(/[\s_-]+/g, '') === 'returned').length}
                </p>
              </div>

              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border-l-4 border-gray-500">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">📊</span>
                  <span className="text-xs font-semibold text-gray-600 bg-white px-2 py-1 rounded-full">
                    All
                  </span>
                </div>
                <p className="text-sm text-gray-600 font-medium mb-1">Total</p>
                <p className="text-2xl font-bold text-gray-700">
                  {orders.length}
                </p>
              </div>
            </div>

            {/* Recent Products Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-900">Recent Products</h3>
                  <button
                    onClick={() => setActiveTab('products')}
                    className="text-sm text-blue-600 hover:text-blue-700 font-semibold"
                  >
                    View All →
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Product</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Price</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Stock</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {products.slice(0, 5).map((product) => (
                      <tr key={product.productid} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-12 w-12 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                              {product.imglink ? (
                                <img className="h-12 w-12 object-cover" src={product.imglink} alt="" />
                              ) : (
                                <div className="h-12 w-12 flex items-center justify-center">
                                  <Package className="w-6 h-6 text-gray-400" />
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-semibold text-gray-900">
                                {product.title.substring(0, 40)}{product.title.length > 40 ? '...' : ''}
                              </div>
                              <div className="text-xs text-gray-500">ID: {product.productid}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-gray-900">${product.price}</div>
                          {product.discount > 0 && (
                            <div className="text-xs text-red-500">{product.discount}% OFF</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">{product.stock}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full ${product.stock > 10
                                ? 'bg-green-100 text-green-800'
                                : product.stock > 0
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                          >
                            {product.stock > 10 ? 'In Stock' : product.stock > 0 ? 'Low Stock' : 'Out of Stock'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => openProductDetail(product)}
                            className="text-blue-600 hover:text-blue-900 mr-4 font-medium"
                          >
                            <Eye className="w-4 h-4 inline mr-1" />
                            View
                          </button>
                          <button
                            onClick={() => handleRemoveProduct(product.productid)}
                            className="text-red-600 hover:text-red-900 font-medium"
                          >
                            <Trash2 className="w-4 h-4 inline mr-1" />
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">
                {viewMode === 'myProducts' ? 'My Products' : 'Marketplace (All Products)'}
              </h2>
              <div className="flex gap-3">
                <button
                  onClick={toggleViewMode}
                  className={`px-4 py-2 rounded-lg transition ${viewMode === 'marketplace'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                >
                  {viewMode === 'myProducts' ? 'View Marketplace' : 'View My Products'}
                </button>
                {viewMode === 'myProducts' && (
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    + Add New Product
                  </button>
                )}
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading products...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {displayProducts.map((product) => (
                  <div
                    key={product.productid}
                    className="bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden"
                  >
                    <div
                      className="h-48 bg-gray-200 flex items-center justify-center cursor-pointer overflow-hidden"
                      onClick={() => openProductDetail(product)}
                    >
                      {product.imglink ? (
                        <img src={product.imglink} alt={product.title} className="h-full w-full object-cover hover:scale-105 transition-transform" />
                      ) : (
                        <Package className="w-16 h-16 text-gray-400" />
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-lg line-clamp-2 mb-2 min-h-[56px]">{product.title}</h3>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-green-600 font-bold text-xl">${product.price}</span>
                        {product.discount > 0 && <span className="text-red-500 text-sm">{product.discount}% OFF</span>}
                      </div>
                      <p className={`text-sm mb-3 ${product.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        Stock: {product.stock}
                      </p>
                      {viewMode === 'marketplace' && product.seller_name && (
                        <p className="text-xs text-gray-500 mb-3">Seller: {product.seller_name}</p>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={() => openProductDetail(product)}
                          className="flex-1 bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition flex items-center justify-center gap-1"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </button>
                        {viewMode === 'myProducts' && (
                          <button
                            onClick={() => handleRemoveProduct(product.productid)}
                            className="flex-1 bg-red-500 text-white py-2 rounded hover:bg-red-600 transition flex items-center justify-center gap-1"
                          >
                            <Trash2 className="w-4 h-4" />
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {displayProducts.length === 0 && !loading && (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <Package className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No products</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {viewMode === 'myProducts'
                    ? 'Get started by adding a new product.'
                    : 'No products available in marketplace.'}
                </p>
                {viewMode === 'myProducts' && (
                  <div className="mt-6">
                    <button
                      onClick={() => setShowAddForm(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      + Add Product
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold mb-6">Analytics Dashboard</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Sales Overview */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Sales Overview</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Revenue</span>
                    <span className="text-2xl font-bold text-green-600">
                      ${orders.reduce((sum, order) => sum + parseFloat(order.totalprice as string || '0'), 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Orders</span>
                    <span className="text-2xl font-bold text-blue-600">{orders.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Average Order Value</span>
                    <span className="text-2xl font-bold text-purple-600">
                      ${orders.length > 0
                        ? (orders.reduce((sum, order) => sum + parseFloat(order.totalprice as string || '0'), 0) / orders.length).toFixed(2)
                        : '0.00'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Confirmed Orders</span>
                    <span className="text-2xl font-bold text-green-600">
                      {orders.filter(o => o.status.toLowerCase() === 'confirmed').length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Delivered Orders</span>
                    <span className="text-2xl font-bold text-blue-600">
                      {orders.filter(o => o.status.toLowerCase() === 'delivered').length}
                    </span>
                  </div>
                </div>
              </div>

              {/* Product Performance */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Product Performance</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Best Seller</span>
                    <span className="text-sm font-medium text-gray-900">
                      {products.length > 0 ? products[0].title.substring(0, 20) + '...' : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Avg Rating</span>
                    <span className="text-2xl font-bold text-yellow-600">{stats.avgRating} ⭐</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Products Listed</span>
                    <span className="text-2xl font-bold text-blue-600">{stats.totalProducts}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Return Requests</span>
                    <span className="text-2xl font-bold text-orange-600">
                      {
                        orders.filter(o => {
                          const status = o.status.toLowerCase().replace(/[\s_-]+/g, '');
                          return status === 'returnrequested' || status === 'returned';
                        }).length
                      }
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Cancel Requests</span>
                    <span className="text-2xl font-bold text-red-600">
                      {
                        orders.filter(o => {
                          const status = o.status.toLowerCase().replace(/[\s_-]+/g, '');
                          return status === 'cancelled';
                        }).length
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Performing Products */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Top Performing Products</h3>
              <div className="space-y-3">
                {products.slice(0, 5).map((product, index) => (
                  <div key={product.productid} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
                      <img
                        src={product.imglink || 'https://via.placeholder.com/40'}
                        alt={product.title}
                        className="w-10 h-10 rounded object-cover"
                      />
                      <span className="font-medium text-gray-900">{product.title.substring(0, 30)}...</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Price</p>
                      <p className="font-bold text-gray-900">${product.price}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Orders Management</h2>
              <button
                onClick={() => {
                  fetchSellerOrders();
                  fetchCancelRequests();
                  fetchReturnRequests();
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>

            {/* Orders Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Total Orders</h3>
                <p className="text-3xl font-bold text-blue-600">{orders.length}</p>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Active Orders</h3>
                <p className="text-3xl font-bold text-green-600">
                  {orders.filter(o =>
                    o.status.toLowerCase() !== 'delivered' &&
                    o.status.toLowerCase() !== 'cancelled' &&
                    o.status.toLowerCase() !== 'return requested'
                  ).length}
                </p>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Cancel Requests</h3>
                <p className="text-3xl font-bold text-yellow-600">
                  {(() => {
                    // Count pending cancel requests
                    const pendingCancels = cancelRequests.filter(r => {
                      const status = (r.request_status || r.status || '').toLowerCase();
                      return status === 'pending';
                    }).length;

                    // Count cancelled orders
                    const cancelledOrders = orders.filter(o =>
                      o.status.toLowerCase().replace(/[\s_-]+/g, '') === 'cancelled'
                    ).length;

                    return pendingCancels + cancelledOrders;
                  })()}
                </p>

              </div>

              {/* RETURN REQUESTS STAT CARD - USES ORDER STATUS */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Return Requests</h3>
                <p className="text-3xl font-bold text-orange-600">
                  {orders.filter(o => {
                    const status = o.status.toLowerCase().replace(/[\s_-]+/g, '');
                    return status === 'returnrequested' || status === 'returned';
                  }).length}
                </p>
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-orange-600">
                    ⏳ Pending: {orders.filter(o => {
                      const status = o.status.toLowerCase().replace(/[\s_-]+/g, '');
                      return status === 'returnrequested';
                    }).length}
                  </p>
                  <p className="text-xs text-purple-600">
                    ✅ Approved: {orders.filter(o => {
                      const status = o.status.toLowerCase().replace(/[\s_-]+/g, '');
                      return status === 'returned';
                    }).length}
                  </p>
                </div>
              </div>






            </div>


            {/* All Orders Table */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold">All Orders</h3>
              </div>
              {ordersLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading orders...</p>
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-gray-500">No orders found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Products</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {orders.map((order) => (
                        <tr key={order.orderid} className="hover:bg-gray-50 transition">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-semibold text-gray-900">#{order.orderid}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm">
                              <div className="font-medium text-gray-900">{order.username}</div>
                              <div className="text-gray-500">{order.user_email}</div>
                              <div className="text-gray-500">{order.user_phone}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-2 max-w-xs">
                              {order.products.slice(0, 2).map((product, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                  <img
                                    src={product.imglink}
                                    alt={product.title}
                                    className="w-10 h-10 rounded object-cover flex-shrink-0"
                                  />
                                  <div className="text-xs flex-1 min-w-0">
                                    <div className="font-medium truncate">{product.title}</div>
                                    <div className="text-gray-500">Qty: {product.quantity} × ${product.price}</div>
                                  </div>
                                </div>
                              ))}
                              {order.products.length > 2 && (
                                <div className="text-xs text-gray-500">
                                  +{order.products.length - 2} more items
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-bold text-gray-900">${parseFloat(order.totalprice as string).toFixed(2)}</span>
                          </td>

                          {/* STATUS COLUMN - ENHANCED */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-3 py-1.5 inline-flex text-xs leading-5 font-semibold rounded-full ${(() => {
                              const normalizedStatus = order.status.toLowerCase().replace(/[\s_-]+/g, '');
                              if (normalizedStatus === 'delivered') return 'bg-green-100 text-green-800';
                              if (normalizedStatus === 'confirmed') return 'bg-blue-100 text-blue-800';
                              if (normalizedStatus === 'cancelled') return 'bg-red-100 text-red-800';
                              if (normalizedStatus === 'returned') return 'bg-purple-100 text-purple-800';
                              if (normalizedStatus === 'returnrequested') return 'bg-orange-100 text-orange-800';
                              return 'bg-yellow-100 text-yellow-800';
                            })()
                              }`}>
                              {(() => {
                                const normalizedStatus = order.status.toLowerCase().replace(/[\s_-]+/g, '');
                                if (normalizedStatus === 'delivered') return '✓ Order Delivered';
                                if (normalizedStatus === 'confirmed') return '📦 Order Confirmed';
                                if (normalizedStatus === 'cancelled') return '✗ Order Cancelled';
                                if (normalizedStatus === 'returned') return '✅ Order Returned';
                                if (normalizedStatus === 'returnrequested') return '↩ Return Requested';
                                return order.status;
                              })()}
                            </span>
                          </td>



                          {/* PAYMENT STATUS COLUMN - COMPLETE WORKFLOW */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-xs">
                              <div className="font-medium text-gray-900 capitalize">
                                {order.payment_method || 'N/A'}
                              </div>
                              <div className={`mt-1 font-semibold ${(() => {
                                const normalizedStatus = order.status.toLowerCase().replace(/[\s_-]+/g, '');
                                if (normalizedStatus === 'cancelled' || normalizedStatus === 'returned') return 'text-red-600';
                                if (normalizedStatus === 'delivered') return 'text-green-600';
                                if (normalizedStatus === 'returnrequested') return 'text-orange-600';
                                return 'text-gray-500';
                              })()
                                }`}>
                                {(() => {
                                  const normalizedStatus = order.status.toLowerCase().replace(/[\s_-]+/g, '');
                                  const paymentMethod = (order.payment_method || '').toLowerCase();
                                  const isOnlinePayment = paymentMethod === 'card' || paymentMethod.includes('online') || paymentMethod.includes('upi');

                                  // Order Cancelled
                                  if (normalizedStatus === 'cancelled') {
                                    if (isOnlinePayment) {
                                      return '💳 Payment Refunded';
                                    } else {
                                      return '✗ Order Cancelled';
                                    }
                                  }

                                  // Order Returned (Return Completed Successfully)
                                  if (normalizedStatus === 'returned') {
                                    if (isOnlinePayment) {
                                      return '✅ Payment Refunded';
                                    } else {
                                      return '✅ Return Completed';
                                    }
                                  }

                                  // Return Requested (In Progress)
                                  if (normalizedStatus === 'returnrequested') {
                                    if (isOnlinePayment) {
                                      return '⏳ Refund Pending';
                                    } else {
                                      return '⏳ Return in Progress';
                                    }
                                  }

                                  // Delivered
                                  if (normalizedStatus === 'delivered') {
                                    return '✓ Payment Completed';
                                  }

                                  // Confirmed
                                  if (normalizedStatus === 'confirmed') {
                                    return order.payment_status || '📦 Confirmed';
                                  }

                                  // Default
                                  return order.payment_status || 'Pending';
                                })()}
                              </div>
                            </div>
                          </td>






                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex flex-col">
                              {/* Always show order date */}
                              <span className="text-xs text-gray-400">Order Date</span>
                              <span className="font-medium">
                                {new Date(order.order_date).toLocaleDateString()}
                              </span>

                              {(() => {
                                const normalizedStatus = order.status
                                  .toLowerCase()
                                  .replace(/[\s_-]+/g, '');

                                // Delivered date
                                if (normalizedStatus === 'delivered' && order.delivered_date) {
                                  return (
                                    <>
                                      <span className="text-xs text-green-600 mt-1">Delivered:</span>
                                      <span className="text-green-600 font-medium">
                                        {new Date(order.delivered_date).toLocaleDateString()}
                                      </span>
                                    </>
                                  );
                                }

                                // Cancelled date
                                if (normalizedStatus === 'cancelled' && order.cancelled_date) {
                                  return (
                                    <>
                                      <span className="text-xs text-red-600 mt-1">Cancelled:</span>
                                      <span className="text-red-600 font-medium">
                                        {new Date(order.cancelled_date).toLocaleDateString()}
                                      </span>
                                    </>
                                  );
                                }

                                // Returned / return approved date
                                if (normalizedStatus === 'returned' && order.delivered_date) {
                                  return (
                                    <>
                                      <span className="text-xs text-purple-600 mt-1">Approved:</span>
                                      <span className="text-purple-600 font-medium">
                                        {new Date(order.delivered_date).toLocaleDateString()}
                                      </span>
                                    </>
                                  );
                                }

                                // Return requested (show request date if you later store one)
                                // currently only orderdate exists, so nothing extra
                                return null;
                              })()}
                            </div>
                          </td>


                          {/* ACTIONS COLUMN - SHOWS BUTTON FOR RETURN REQUESTED STATUS */}
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {(() => {
                              const normalizedStatus = order.status.toLowerCase().replace(/[\s_-]+/g, '');

                              // 🟠 SHOW APPROVE RETURN BUTTON for all "Return Requested" orders
                              if (normalizedStatus === 'returnrequested') {
                                return (
                                  <button
                                    onClick={() => handleApproveReturn(order.orderid)}
                                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition"
                                  >
                                    <Check className="w-3 h-3 mr-1" />
                                    Approve Return
                                  </button>
                                );
                              }

                              // ✅ Show status badges
                              if (normalizedStatus === 'delivered') {
                                return (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    ✓ Delivered
                                  </span>
                                );
                              } else if (normalizedStatus === 'cancelled') {
                                return (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                    ✗ Cancelled
                                  </span>
                                );
                              } else if (normalizedStatus === 'returned') {
                                return (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                    ✅ Returned
                                  </span>
                                );
                              }

                              // 🟢 Show "Mark Delivered" for confirmed/pending orders
                              return (
                                <button
                                  onClick={() => handleMarkAsDelivered(order.orderid)}
                                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition"
                                >
                                  <Check className="w-3 h-3 mr-1" />
                                  Mark Delivered
                                </button>
                              );
                            })()}
                          </td>









                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* CANCELLATION REQUESTS SECTION - FIXED */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold">Cancellation Requests</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Pending: {cancelRequests.filter(r => {
                    const status = (r.request_status || r.status || '').toLowerCase();
                    return status === 'pending';
                  }).length} |
                  Cancelled: {orders.filter(o => o.status.toLowerCase().replace(/[\s_-]+/g, '') === 'cancelled').length}
                </p>

              </div>

              <div className="p-6">
                {/* Check BOTH cancelRequests and cancelled orders */}
                {cancelRequests.length === 0 && orders.filter(o => o.status.toLowerCase().replace(/[\s_-]+/g, '') === 'cancelled').length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No cancellation requests or cancelled orders</p>
                ) : (
                  <>
                    {/* Pending Cancel Requests from cancel_requests table */}
                    {cancelRequests.length > 0 && (
                      <div className="space-y-4 mb-6">
                        <h4 className="font-semibold text-gray-700 border-b pb-2">📋 Pending Cancel Requests</h4>
                        {cancelRequests.map((request) => (
                          <div key={request.request_id} className="border border-orange-200 rounded-lg p-4 hover:shadow-md transition bg-orange-50">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <p className="font-semibold text-gray-900">Order #{request.order_id}</p>
                                <p className="text-sm text-gray-600">{request.username} - {request.user_email}</p>
                                <p className="text-xs text-gray-500">Total: ${Number(request.totalprice).toFixed(2)}</p>
                                <p className="text-xs text-gray-500">
                                  {(() => {
                                    const raw =
                                      request.request_date ||
                                      request.request_date;

                                    const d = raw ? new Date(raw) : null;
                                    return `Requested: ${d && !isNaN(d.getTime()) ? d.toLocaleDateString() : 'N/A'
                                      }`;
                                  })()}
                                </p>

                              </div>
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${request.request_status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                request.request_status === 'Approved' ? 'bg-green-100 text-green-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                {request.request_status}
                              </span>
                            </div>

                            <div className="bg-white p-3 rounded mb-3">
                              <p className="text-sm"><strong>Reason:</strong> {request.reason}</p>
                              {request.comments && <p className="text-sm mt-1"><strong>Comments:</strong> {request.comments}</p>}
                            </div>

                            {(request.request_status === 'Pending' || request.request_status === 'pending') && (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleCancelRequest(request.request_id, 'approved')}
                                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium"
                                >
                                  ✓ Approve
                                </button>
                                <button
                                  onClick={() => handleCancelRequest(request.request_id, 'rejected')}
                                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-medium"
                                >
                                  ✗ Reject
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Already Cancelled Orders */}
                    {orders.filter(o => o.status.toLowerCase().replace(/[\s_-]+/g, '') === 'cancelled').length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-700 mb-3 border-b pb-2">❌ Cancelled Orders</h4>
                        <div className="space-y-2">
                          {orders
                            .filter(o => o.status.toLowerCase().replace(/[\s_-]+/g, '') === 'cancelled')
                            .map((order) => (
                              <div key={order.orderid} className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                <div className="flex justify-between items-center">
                                  <div>
                                    <p className="font-semibold text-gray-900">Order #{order.orderid}</p>
                                    <p className="text-sm text-gray-600">{order.username}</p>
                                    <p className="text-xs text-gray-500">
                                      Cancelled: {order.cancelled_date ? new Date(order.cancelled_date).toLocaleDateString() : 'N/A'}
                                    </p>
                                    {order.cancellation_reason && (
                                      <p className="text-xs text-gray-700 mt-1">
                                        <strong>Reason:</strong> {order.cancellation_reason}
                                      </p>
                                    )}
                                  </div>
                                  <span className="text-red-600 font-bold">
                                    ${Number(order.totalprice).toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>




            {/* RETURN REQUESTS SECTION - USES ORDER STATUS */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold">Return Requests</h3>
                <p className="text-sm text-gray-500 mt-1">
                  ⏳ Pending: {orders.filter(o => {
                    const status = o.status.toLowerCase().replace(/[\s_-]+/g, '');
                    return status === 'returnrequested';
                  }).length} |
                  ✅ Approved: {orders.filter(o => {
                    const status = o.status.toLowerCase().replace(/[\s_-]+/g, '');
                    return status === 'returned';
                  }).length}
                </p>
              </div>

              <div className="p-6">
                {orders.filter(o => {
                  const status = o.status.toLowerCase().replace(/[\s_-]+/g, '');
                  return status === 'returnrequested' || status === 'returned';
                }).length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No return requests</p>
                ) : (
                  <div className="space-y-6">
                    {/* ⏳ PENDING RETURNS */}
                    {orders.filter(o => {
                      const status = o.status.toLowerCase().replace(/[\s_-]+/g, '');
                      return status === 'returnrequested';
                    }).length > 0 && (
                        <div>
                          <h4 className="font-semibold text-gray-700 border-b pb-2 mb-3">
                            ⏳ Pending Return Requests ({orders.filter(o => {
                              const status = o.status.toLowerCase().replace(/[\s_-]+/g, '');
                              return status === 'returnrequested';
                            }).length})
                          </h4>
                          <div className="space-y-3">
                            {orders
                              .filter(o => {
                                const status = o.status.toLowerCase().replace(/[\s_-]+/g, '');
                                return status === 'returnrequested';
                              })
                              .map((order) => (
                                <div
                                  key={order.orderid}
                                  className="border border-orange-200 rounded-lg p-4 bg-orange-50 hover:shadow-md transition"
                                >
                                  <div className="flex justify-between items-start mb-3">
                                    <div>
                                      <p className="font-semibold text-gray-900">Order #{order.orderid}</p>
                                      <p className="text-sm text-gray-600">{order.username} - {order.user_email}</p>
                                      <p className="text-xs text-gray-500">
                                        {(() => {
                                          const raw = order.order_date;
                                          const d = raw ? new Date(raw) : null;
                                          const orderStr =
                                            d && !isNaN(d.getTime()) ? d.toLocaleDateString() : 'N/A';
                                          return `Order Date: ${orderStr}`;
                                        })()}
                                      </p>

                                    </div>
                                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 whitespace-nowrap">
                                      ⏳ Pending
                                    </span>
                                  </div>

                                  {/* Products List */}
                                  <div className="mb-3 bg-white p-3 rounded">
                                    <p className="text-sm font-medium text-gray-700 mb-2">Products:</p>
                                    {order.products && order.products.length > 0 ? (
                                      <div className="space-y-1">
                                        {order.products.map((product: any, idx: number) => (
                                          <div key={idx} className="flex items-center gap-2">
                                            <img
                                              src={product.imglink || 'https://via.placeholder.com/40'}
                                              alt={product.title}
                                              className="w-10 h-10 rounded object-cover"
                                            />
                                            <div className="text-xs">
                                              <p className="font-medium">{product.title}</p>
                                              <p className="text-gray-500">Qty: {product.quantity} × ${product.price}</p>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <p className="text-xs text-gray-500">No product details available</p>
                                    )}
                                  </div>

                                  {/* Actions */}
                                  <div className="flex items-center justify-between">
                                    <span className="font-bold text-orange-600">
                                      Total: ${Number(order.totalprice).toFixed(2)}
                                    </span>
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => handleApproveReturn(order.orderid)}
                                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium inline-flex items-center gap-1"
                                      >
                                        <Check className="w-4 h-4" />
                                        Approve Return
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}

                    {/* ✅ APPROVED RETURNS */}
                    {orders.filter(o => {
                      const status = o.status.toLowerCase().replace(/[\s_-]+/g, '');
                      return status === 'returned';
                    }).length > 0 && (
                        <div>
                          <h4 className="font-semibold text-gray-700 border-b pb-2 mb-3">
                            ✅ Approved Returns ({orders.filter(o => {
                              const status = o.status.toLowerCase().replace(/[\s_-]+/g, '');
                              return status === 'returned';
                            }).length})
                          </h4>
                          <div className="space-y-2">
                            {orders
                              .filter(o => {
                                const status = o.status.toLowerCase().replace(/[\s_-]+/g, '');
                                return status === 'returned';
                              })
                              .map((order) => (
                                <div
                                  key={order.orderid}
                                  className="p-4 bg-purple-50 border border-purple-200 rounded-lg"
                                >
                                  <div className="flex justify-between items-center">
                                    <div>
                                      <p className="font-semibold text-gray-900">Order #{order.orderid}</p>
                                      <p className="text-sm text-gray-600">{order.username}</p>
                                      <p className="text-xs text-gray-500">
                                        {(() => {
                                          const orderDateRaw = order.order_date;
                                          const approvedRaw =
                                            order.delivered_date ||  // when you approved / completed return
                                            order.cancelled_date;    // fallback if ever stored here

                                          const orderDate = orderDateRaw ? new Date(orderDateRaw) : null;
                                          const approvedDate = approvedRaw ? new Date(approvedRaw) : null;

                                          const orderStr =
                                            orderDate && !isNaN(orderDate.getTime())
                                              ? orderDate.toLocaleDateString()
                                              : 'N/A';

                                          const approvedStr =
                                            approvedDate && !isNaN(approvedDate.getTime())
                                              ? approvedDate.toLocaleDateString()
                                              : 'N/A';

                                          return `Order Date: ${orderStr}   Approved: ${approvedStr}`;
                                        })()}
                                      </p>


                                      <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded text-xs font-semibold bg-purple-200 text-purple-800">
                                        ✅ Return Completed
                                      </span>
                                    </div>
                                    <div className="text-right">
                                      <span className="font-bold text-purple-600">
                                        ${Number(order.totalprice).toFixed(2)}
                                      </span>
                                      <p className="text-xs text-green-600 mt-1">
                                        ✓ Refund Processed
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                  </div>
                )}
              </div>
            </div>



          </div>
        )}

      </div>

      {/* Add Product Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-6 z-10">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Add New Product</h2>
                <button onClick={() => setShowAddForm(false)} className="text-gray-500 hover:text-gray-700">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleAddProduct} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Product Title *</label>
                <input
                  type="text"
                  value={newProduct.title}
                  onChange={(e) => setNewProduct({ ...newProduct, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  placeholder="Enter product name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Describe your product"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Price ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    placeholder="0.00"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Discount (%)</label>
                  <input
                    type="number"
                    step="1"
                    value={newProduct.discount}
                    onChange={(e) => setNewProduct({ ...newProduct, discount: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0"
                    min="0"
                    max="100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Stock *</label>
                  <input
                    type="number"
                    value={newProduct.stock}
                    onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    placeholder="0"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <input
                    type="text"
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Electronics, Fashion, etc."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Image URL</label>
                <input
                  type="url"
                  value={newProduct.imgLink}
                  onChange={(e) => setNewProduct({ ...newProduct, imgLink: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={newProduct.tags}
                  onChange={(e) => setNewProduct({ ...newProduct, tags: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="tag1, tag2, tag3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Product Group (optional)</label>
                <input
                  type="text"
                  value={newProduct.productGroup}
                  onChange={(e) => setNewProduct({ ...newProduct, productGroup: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Leave empty to use product title"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  Add Product
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Product Detail Modal */}
      {showProductDetail && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-6 z-10">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Product Details</h2>
                <button onClick={() => setShowProductDetail(false)} className="text-gray-500 hover:text-gray-700">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Product Image */}
                <div className="bg-gray-100 rounded-lg overflow-hidden h-80 flex items-center justify-center">
                  {selectedProduct.imglink ? (
                    <img
                      src={selectedProduct.imglink}
                      alt={selectedProduct.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Package className="w-24 h-24 text-gray-400" />
                  )}
                </div>

                {/* Product Info */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{selectedProduct.title}</h3>
                    {selectedProduct.description && (
                      <p className="text-gray-600">{selectedProduct.description}</p>
                    )}
                  </div>

                  <div className="border-t pt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Price</p>
                        <p className="text-2xl font-bold text-green-600">${selectedProduct.price}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Discount</p>
                        <p className="text-2xl font-bold text-red-600">{selectedProduct.discount}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Stock</p>
                        <p className={`text-2xl font-bold ${selectedProduct.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {selectedProduct.stock}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Final Price</p>
                        <p className="text-2xl font-bold text-purple-600">
                          ${(selectedProduct.price - (selectedProduct.discount || 0)).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4 space-y-2">
                    {selectedProduct.category && (
                      <div>
                        <span className="text-sm text-gray-500">Category: </span>
                        <span className="font-medium">{selectedProduct.category}</span>
                      </div>
                    )}
                    {selectedProduct.product_group && (
                      <div>
                        <span className="text-sm text-gray-500">Product Group: </span>
                        <span className="font-medium">{selectedProduct.product_group}</span>
                      </div>
                    )}
                    {selectedProduct.tags && (
                      <div>
                        <span className="text-sm text-gray-500">Tags: </span>
                        <span className="font-medium">{selectedProduct.tags}</span>
                      </div>
                    )}
                    {selectedProduct.seller_name && (
                      <div>
                        <span className="text-sm text-gray-500">Seller: </span>
                        <span className="font-medium">{selectedProduct.seller_name}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-sm text-gray-500">Product ID: </span>
                      <span className="font-mono text-sm">{selectedProduct.productid}</span>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex items-center gap-2">
                      {selectedProduct.stock > 0 ? (
                        <>
                          <Check className="w-5 h-5 text-green-600" />
                          <span className="text-green-600 font-semibold">In Stock - Ready to Ship</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-5 h-5 text-red-600" />
                          <span className="text-red-600 font-semibold">Out of Stock</span>
                        </>
                      )}
                    </div>
                  </div>

                  {viewMode === 'myProducts' && (
                    <div className="pt-4 flex gap-3">
                      <button
                        onClick={() => {
                          setShowProductDetail(false);
                          // Future: Add edit functionality
                        }}
                        className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-medium flex items-center justify-center gap-2"
                      >
                        <Edit className="w-4 h-4" />
                        Edit Product
                      </button>
                      <button
                        onClick={() => {
                          handleRemoveProduct(selectedProduct.productid);
                          setShowProductDetail(false);
                        }}
                        className="flex-1 bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition font-medium flex items-center justify-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete Product
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}
