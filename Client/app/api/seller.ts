"use server"
import axios from 'axios';

const url = process.env.BACKEND_URL || "http://localhost:3500";

// Get all orders for seller
export async function getSellerOrders(sellerId: string, token: string) {
  try {
    const response = await axios.get(`${url}/api/seller/orders/${sellerId}`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return { status: response.status, data: response.data };
  } catch (error: any) {
    console.error('Error fetching seller orders:', error);
    return { status: error.response?.status || 500, error: error.message };
  }
}

// Get cancel requests
export async function getCancelRequests(sellerId: string, token: string) {
  try {
    const response = await axios.get(`${url}/api/seller/cancel-requests/${sellerId}`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return { status: response.status, data: response.data };
  } catch (error: any) {
    return { status: error.response?.status || 500, error: error.message };
  }
}

// Get return requests
export async function getReturnRequests(sellerId: string, token: string) {
  try {
    const response = await axios.get(`${url}/api/seller/return-requests/${sellerId}`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return { status: response.status, data: response.data };
  } catch (error: any) {
    return { status: error.response?.status || 500, error: error.message };
  }
}

// Mark order as delivered (seller action)
export async function markOrderAsDelivered(orderId: number, sellerId: string, token: string) {
  try {
    const response = await axios.put(
      `${url}/api/seller/orders/${orderId}/mark-delivered`,
      { sellerId },
      {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return { status: response.status, data: response.data };
  } catch (error: any) {
    return { status: error.response?.status || 500, error: error.message };
  }
}

// Update cancel request status
export async function updateCancelRequest(requestId: number, status: 'approved' | 'rejected', sellerId: string, token: string) {
  try {
    const response = await axios.put(
      `${url}/api/seller/cancel-requests/${requestId}`,
      { status, sellerId },
      {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return { status: response.status, data: response.data };
  } catch (error: any) {
    return { status: error.response?.status || 500, error: error.message };
  }
}

// Update return request status
export async function updateReturnRequest(requestId: number, status: string, token: string) {
  try {
    const response = await axios.put(
      `${url}/api/seller/return-requests/${requestId}`,
      { status },
      {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return { status: response.status, data: response.data };
  } catch (error: any) {
    return { status: error.response?.status || 500, error: error.message };
  }
}
