import React, { useEffect, useRef, useState } from 'react'
import { CheckIcon, ShoppingCartIcon, CreditCardIcon, BanknotesIcon, XCircleIcon, ArrowPathIcon, ClockIcon } from '@heroicons/react/24/outline';
import formatDate from '@/app/api/dateConvert';
import { ordersHandler } from '@/app/api/orders';
import Link from 'next/link';
import Loading from '../Loading';
import { useRouter } from 'next/navigation';
import NotLoggedin from './NotLoggedin';
import NoOrders from './NoOrders';
import axios from 'axios';


interface orderDataflow {
    orderid: number;
    totalamount: number;
    status: string;
    orderstatus: string;
    createdat: string;
    delivered_date: string;
    cancelled_date: string;
    title: string;
    imglink: string;
    imgalt: string;
    description: string;
    discount: number;
    order_code: string;
    productid: string
    paymentmethod: string;
    paymentstatus: string;
}

const getNormalizedStatus = (order: orderDataflow): string => {
    return (order.orderstatus || order.status || '').toLowerCase().trim();
};

const getDynamicPaymentStatus = (order: orderDataflow): string => {
    const status = getNormalizedStatus(order);
    const paymentMethod = order.paymentmethod?.toLowerCase() || '';

    if (paymentMethod === 'card') {
        if (status === 'delivered') return 'Payment Successful';
        if (status === 'cancelled') return 'Payment Refunded';
        if (status === 'return_requested' || status === 'returned') return 'Payment Refunded';
        return 'Payment Successful';
    }

    if (paymentMethod === 'payment on delivery') {
        if (status === 'delivered') return 'Payment Received';
        if (status === 'cancelled') return 'Payment Cancelled';
        if (status === 'return_requested' || status === 'returned') return 'Payment Cancelled';
        return 'Payment Pending';
    }

    return order.paymentstatus || 'Unknown';  // ✅ Fixed - use paymentstatus instead of status
};


const getPaymentIcon = (order: orderDataflow) => {
    const status = getNormalizedStatus(order);
    const paymentMethod = order.paymentmethod?.toLowerCase() || '';

    if (paymentMethod === 'card') {
        if (status === 'delivered') {
            return <CheckIcon className="w-4 h-4 text-green-600" />;
        }
        if (status === 'cancelled' || status === 'return_requested' || status === 'returned') {
            return <ArrowPathIcon className="w-4 h-4 text-blue-600" />;
        }
        return <CheckIcon className="w-4 h-4 text-green-600" />;
    }

    if (paymentMethod === 'payment on delivery') {
        if (status === 'delivered') {
            return <CheckIcon className="w-4 h-4 text-green-600" />;
        }
        if (status === 'cancelled' || status === 'return_requested' || status === 'returned') {
            return <XCircleIcon className="w-4 h-4 text-red-600" />;
        }
        return <ClockIcon className="w-4 h-4 text-yellow-600" />;
    }

    return <ClockIcon className="w-4 h-4 text-gray-600" />;
};

const getPaymentBadgeClass = (order: orderDataflow): string => {
    const status = getNormalizedStatus(order);
    const paymentMethod = order.paymentmethod?.toLowerCase() || '';

    if (paymentMethod === 'card') {
        if (status === 'delivered') return 'bg-green-50 text-green-700 border-green-200';
        if (status === 'cancelled' || status === 'return_requested' || status === 'returned') {
            return 'bg-blue-50 text-blue-700 border-blue-200';
        }
        return 'bg-green-50 text-green-700 border-green-200';
    }

    if (paymentMethod === 'payment on delivery') {
        if (status === 'delivered') return 'bg-green-50 text-green-700 border-green-200';
        if (status === 'cancelled' || status === 'return_requested' || status === 'returned') {
            return 'bg-red-50 text-red-700 border-red-200';
        }
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    }

    return 'bg-gray-50 text-gray-700 border-gray-200';
};

const Order = () => {
    const router = useRouter();
    const loggedIn = useRef(true);
    const found = useRef(false);
    const dataVar = useRef<orderDataflow[]>([])
    const data = dataVar.current;
    const [loading, setLoading] = useState(true);

    async function orderData() {
        const temp_data = await ordersHandler();
        switch (temp_data.status) {
            case 200:
                if (temp_data.data.data != undefined) {
                    dataVar.current = temp_data.data.data;
                    found.current = true;
                }
                setLoading(false);
                break;
            case 250:
                loggedIn.current = false;
                setLoading(false);
                break;
            default:
                setLoading(false);
                break;
        }
    }
    useEffect(() => {
        orderData();
    }, [])

    const handleReturnCancel = async (orderId: number, productId: string) => {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                alert("You must be logged in to perform this action.");
                return;
            }

            const response = await axios.get(
                `http://localhost:3500/api/orders/${orderId}/eligibility`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = response.data;

            if (data.eligible) {
                router.push(
                    `/return-request?orderID=${orderId}&productID=${productId}&type=${data.type}`
                );
            } else {
                alert(
                    `This order is not eligible for return or cancellation. Reason: ${data.reason}`
                );
            }
        } catch (error: any) {
            console.error("Error checking eligibility:", error.response?.data || error.message);
            alert("Failed to check eligibility. Please try again.");
        }
    };

    const getExpectedDeliveryDate = (createdAt: string) => {
        if (!createdAt) return '-';
        const startDate = new Date(createdAt);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 7);
        return formatDate(endDate.toISOString());
    };

    const getOrderStatus = (order: orderDataflow): string => {
        const normalizedStatus = (order.orderstatus || order.status || '').toLowerCase();
        return normalizedStatus;
    };

    const getStatusDate = (order: orderDataflow, status: string): string => {
        if (status === 'delivered' && order.delivered_date) {
            return formatDate(order.delivered_date);
        }
        if (status === 'cancelled' && order.cancelled_date) {
            return formatDate(order.cancelled_date);
        }
        return formatDate(order.createdat);
    };

    const getStatusMessage = (order: orderDataflow) => {
        const status = getOrderStatus(order);

        if (status === 'delivered') {
            return `Delivered on ${getStatusDate(order, 'delivered')}`;
        }
        if (status === 'cancelled') {
            return `Order Cancelled on ${getStatusDate(order, 'cancelled')}`;
        }
        if (status === 'return_requested') {
            return `Return Requested on ${formatDate(order.createdat)}`;
        }
        if (status === 'returned') {
            return `Order Returned on ${order.delivered_date ? formatDate(order.delivered_date) : formatDate(order.createdat)}`;
        }

        return `Order Confirmed - Expected delivery by ${getExpectedDeliveryDate(order.createdat)}`;
    };


    const getStatusIcon = (order: orderDataflow) => {
        const status = getOrderStatus(order);
        if (status === 'delivered') {
            return <div className='rounded-full w-6 h-6 flex items-center justify-center text-white bg-green-400'><CheckIcon className="w-4 h-4" /></div>;
        }
        return <div className='rounded-full w-6 h-6 flex items-center justify-center text-white bg-yellow-400'><ShoppingCartIcon className="w-4 h-4" /></div>;
    };

    const getPaymentMethodDisplay = (method: string): string => {
        const normalized = method.toLowerCase();
        if (normalized === 'card') return 'Card';
        if (normalized === 'payment on delivery') return 'COD';
        return method;
    };

    const getPaymentMethodIcon = (method: string) => {
        const normalized = method.toLowerCase();
        if (normalized === 'card') {
            return <CreditCardIcon className="w-4 h-4" />;
        }
        return <BanknotesIcon className="w-4 h-4" />;
    };

    return (
        <div className='flex flex-col gap-10 min-h-screen overflow-x-hidden'>
            <section className='border-t-[1px]'></section>
            <section className='w-[95%] mx-auto flex flex-col gap-2'>
                <p className='font-semibold text-5xl text-gray-900'>Order History</p>
                <p className='text-gray-600 text-base'>Check the status of recent orders, manage returns, and discover similar products.</p>
            </section>
            <section className='flex gap-6 flex-col mb-10 relative'>
                {(loggedIn.current && !loading && data.length === 0) && <NoOrders />}
                {(!loggedIn.current && !loading) && <NotLoggedin />}
                {loading && <div className='h-[300px]'></div>}
                {loading && <div className='absolute left-0 right-0 z-50'><Loading /></div>}
                {data.map((order, index) => (
                    <section key={index} className='w-full min-w-0 mx-auto rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow duration-200'>
                        <div className='p-6'>
                            {/* Header Section - Enhanced Spacing */}
                            <div className='flex flex-wrap gap-6 justify-between items-start pb-5 border-b border-gray-200'>
                                <div className='grid grid-cols-2 md:grid-cols-4 gap-6 flex-1'>
                                    {/* Order Number */}
                                    <div className='flex flex-col gap-1.5'>
                                        <p className='text-xs font-semibold text-gray-500 uppercase tracking-wide'>Order Number</p>
                                        <p className='text-sm font-semibold text-gray-900'>{order.order_code}{order.orderid}</p>
                                    </div>

                                    {/* Date Placed */}
                                    <div className='flex flex-col gap-1.5'>
                                        <p className='text-xs font-semibold text-gray-500 uppercase tracking-wide'>Date Placed</p>
                                        <p className='text-sm font-medium text-gray-700'>{formatDate(order.createdat)}</p>
                                    </div>

                                    {/* Total Amount */}
                                    <div className='flex flex-col gap-1.5'>
                                        <p className='text-xs font-semibold text-gray-500 uppercase tracking-wide'>Total Amount</p>
                                        <p className='text-sm font-bold text-gray-900'>${order.totalamount}</p>
                                    </div>

                                    {/* Payment Method */}
                                    <div className='flex flex-col gap-1.5'>
                                        <p className='text-xs font-semibold text-gray-500 uppercase tracking-wide'>Payment Method</p>
                                        <div className='flex items-center gap-1.5'>
                                            {getPaymentMethodIcon(order.paymentmethod)}
                                            <span className='text-sm font-medium text-gray-700'>
                                                {getPaymentMethodDisplay(order.paymentmethod)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Payment Status - Full Width on Mobile */}
                                    <div className='flex flex-col gap-2 col-span-2 md:col-span-4'>
                                        <p className='text-xs font-semibold text-gray-500 uppercase tracking-wide'>Payment Status</p>
                                        <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium w-fit ${getPaymentBadgeClass(order)}`}>
                                            {getPaymentIcon(order)}
                                            <span>{getDynamicPaymentStatus(order)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className='flex gap-3 flex-wrap'>
                                    <button
                                        onClick={() => router.push(`/order-detail/${order.orderid}`)}
                                        className='px-5 py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium text-sm hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-sm hover:shadow-md'
                                    >
                                        View Order
                                    </button>
                                    <button className='px-5 py-2.5 rounded-lg border-2 border-gray-300 bg-white text-gray-700 font-medium text-sm hover:bg-gray-50 hover:border-gray-400 transition-all duration-200'>
                                        Order Invoice
                                    </button>
                                </div>
                            </div>

                            {/* Product Section */}
                            <div className='flex gap-6 py-5 border-b border-gray-200'>
                                <div className='flex-shrink-0'>
                                    <Link href={`/product/${order.productid}`}>
                                        <img
                                            className='rounded-xl w-32 h-32 object-cover cursor-pointer hover:scale-105 transition-transform duration-200 shadow-sm'
                                            alt={order.imgalt}
                                            src={order.imglink}
                                        />
                                    </Link>
                                </div>
                                <div className='flex flex-col gap-3 flex-1'>
                                    <div className='flex justify-between items-start gap-4'>
                                        <Link href={`/product/${order.productid}`}>
                                            <h3 className='font-semibold text-base text-gray-900 cursor-pointer hover:text-purple-600 transition-colors'>{order.title}</h3>
                                        </Link>
                                        <span className='font-bold text-lg text-gray-900 whitespace-nowrap'>${order.discount}</span>
                                    </div>
                                    <p className='text-sm text-gray-600 line-clamp-2'>{order.description}</p>
                                </div>
                            </div>

                            {/* Footer Section */}
                            <div className='flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pt-5'>
                                <div className='flex items-center gap-3'>
                                    {getStatusIcon(order)}
                                    <p className='text-sm font-medium text-gray-700'>{getStatusMessage(order)}</p>
                                </div>

                                <div className='flex items-center gap-3'>
                                    <Link href={`/product/${order.productid}`}>
                                        <button className='px-4 py-2 text-sm font-medium text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors'>
                                            View Product
                                        </button>
                                    </Link>
                                    <button className='px-4 py-2 text-sm font-medium text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors'>
                                        Buy Again
                                    </button>
                                    {(() => {
                                        const status = getNormalizedStatus(order);
                                        const canShowReturnCancel = ![
                                            "cancelled",
                                            "return_requested",
                                            "returned"
                                        ].includes(status);

                                        if (!canShowReturnCancel) return null;

                                        return (
                                            <button
                                                className='px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors border border-red-200'
                                                onClick={() => handleReturnCancel(order.orderid, order.productid)}
                                            >
                                                Return / Cancel
                                            </button>
                                        );
                                    })()}
                                </div>
                            </div>
                        </div>
                    </section>
                ))}
            </section>
        </div>
    )
}

export default Order;