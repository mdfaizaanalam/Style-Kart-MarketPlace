'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SellerLogin() {
    const router = useRouter();
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        storename: '',
        description: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // ✅ Get backend URL from environment
    const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3500';

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // ✅ Log the request details
            console.log('[SellerLogin] Form submitted:', {
                isLogin,
                email: formData.email
            });

            // ✅ Determine endpoint
            const endpoint = isLogin ? '/api/seller/login' : '/api/seller/register';
            const url = `${API_URL}${endpoint}`;

            console.log('[SellerLogin] Request URL:', url);
            console.log('[SellerLogin] Request method: POST');

            // ✅ Prepare payload
            const payload = isLogin
                ? {
                    email: formData.email,
                    password: formData.password
                }
                : {
                    name: formData.name,
                    email: formData.email,
                    password: formData.password,
                    storename: formData.storename,
                    description: formData.description
                };

            console.log('[SellerLogin] Payload:', payload);

            // ✅ Make API request
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            console.log('[SellerLogin] Response status:', response.status);

            // ✅ Parse response
            const data = await response.json();

            console.log('[SellerLogin] Response data:', data);

            // ✅ Check for errors
            if (!response.ok) {
                const errorMsg = data.error || data.details || 'Authentication failed';
                console.error('[SellerLogin] Error response:', errorMsg);
                throw new Error(errorMsg);
            }

            // ✅ Success - Store token and seller data
            console.log('[SellerLogin] Success! Storing data and redirecting...');

            localStorage.setItem('sellerToken', data.token);
            localStorage.setItem(
                'sellerData',
                JSON.stringify({
                    seller_id: data.seller.seller_id,
                    name: data.seller.name,
                    storename: data.seller.storename,
                    verified: data.seller.verified || false
                })
            );

            console.log('[SellerLogin] Data stored successfully');
            console.log('[SellerLogin] Redirecting to /seller/dashboard');

            router.push('/seller/dashboard');

        } catch (err: any) {
            console.error('[SellerLogin] Error caught:', err);
            const errorMessage = err.message || 'An error occurred. Please try again.';
            console.error('[SellerLogin] Error message:', errorMessage);
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const useDummySeller = () => {
        console.log('[SellerLogin] Using dummy seller');
        const dummy = {
            seller_id: 'DUMMY_SELLER',
            name: 'Dummy Seller',
            storename: 'Demo Store',
            verified: false
        };
        localStorage.setItem('sellerData', JSON.stringify(dummy));
        router.push('/seller/dashboard');
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4">
            <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
                <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">
                    {isLogin ? 'Seller Login' : 'Seller Registration'}
                </h2>

                {/* ✅ Error message display */}
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                        <p className="font-semibold">Error:</p>
                        <p>{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* ✅ Registration form fields */}
                    {!isLogin && (
                        <>
                            <div>
                                <label className="block text-gray-700 font-medium mb-2">
                                    Full Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                                    required
                                    placeholder="John Doe"
                                />
                            </div>

                            <div>
                                <label className="block text-gray-700 font-medium mb-2">
                                    Store Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="storename"
                                    value={formData.storename}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                                    required
                                    placeholder="My Awesome Store"
                                />
                            </div>

                            <div>
                                <label className="block text-gray-700 font-medium mb-2">
                                    Store Description
                                </label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                                    rows={3}
                                    placeholder="Tell us about your store..."
                                />
                            </div>
                        </>
                    )}

                    {/* ✅ Email field (common for both login and register) */}
                    <div>
                        <label className="block text-gray-700 font-medium mb-2">
                            Email <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                            required
                            placeholder="seller@example.com"
                        />
                    </div>

                    {/* ✅ Password field (common for both login and register) */}
                    <div>
                        <label className="block text-gray-700 font-medium mb-2">
                            Password <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                            required
                            placeholder="••••••••"
                            minLength={8}
                        />
                    </div>

                    {/* ✅ Submit button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center">
                                <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
                                Loading...
                            </span>
                        ) : (
                            isLogin ? 'Login' : 'Register'
                        )}
                    </button>
                </form>

                {/* ✅ Toggle between login and register */}
                <p className="text-center mt-6 text-gray-600">
                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                    <button
                        onClick={() => {
                            setIsLogin(!isLogin);
                            setError('');
                            setFormData({
                                name: '',
                                email: '',
                                password: '',
                                storename: '',
                                description: ''
                            });
                        }}
                        className="text-blue-600 font-medium hover:underline transition"
                    >
                        {isLogin ? 'Register' : 'Login'}
                    </button>
                </p>

                {/* ✅ Dummy seller button for development */}
                {/* {isLogin && (
                    <div className="text-center mt-4 pt-4 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={useDummySeller}
                            className="text-sm text-gray-600 hover:text-gray-800 hover:underline transition"
                        >
                            Use Dummy Seller (dev only)
                        </button>
                    </div>
                )} */}


            </div>
        </div>
    );
}