"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import axios from "axios";

const ReturnRequest: React.FC = () => {
  const searchParams = useSearchParams();
  const router = useRouter();

  const orderIDFromURL = searchParams.get("orderID");
  const productIDFromURL = searchParams.get("productID");
  const typeFromURL = searchParams.get("type"); // 'return' or 'cancel'

  const [step, setStep] = useState(1);
  const [orderId, setOrderId] = useState("");
  const [eligible, setEligible] = useState<boolean | null>(null);
  const [eligibilityMessage, setEligibilityMessage] = useState("");
  const [returnDeadline, setReturnDeadline] = useState("");
  const [requestType, setRequestType] = useState<"return" | "cancel">("return");
  const [reason, setReason] = useState("");
  const [comments, setComments] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Auto fill orderID but DON'T auto-check
  useEffect(() => {
    if (orderIDFromURL) {
      setOrderId(orderIDFromURL);
      if (typeFromURL === "return" || typeFromURL === "cancel") {
        setRequestType(typeFromURL as "return" | "cancel");
      }
    }
  }, [orderIDFromURL, typeFromURL]);

  const handleEligibilityCheck = async () => {
    if (!orderId || !productIDFromURL) {
      alert("Order ID or Product ID missing!");
      return;
    }

    setIsLoading(true);

    try {
      const res = await axios.get(
        `http://localhost:3500/api/orders/${orderId}/eligibility`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("[Eligibility Response]:", res.data);

      setEligible(res.data.eligible);
      
      // ✅ FIX: Set requestType from backend response
      if (res.data.type) {
        setRequestType(res.data.type); // 'return' or 'cancel'
      }

      if (res.data.eligible) {
        // Calculate deadline (7 days from now - backend should provide this)
        if (res.data.deadline) {
          const deadline = new Date(res.data.deadline);
          setReturnDeadline(
            deadline.toLocaleDateString("en-US", {
              month: "2-digit",
              day: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })
          );
        } else {
          const deadline = new Date();
          deadline.setDate(deadline.getDate() + 7);
          setReturnDeadline(
            deadline.toLocaleDateString("en-US", {
              month: "2-digit",
              day: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })
          );
        }

        // ✅ FIX: Set message based on type
        if (res.data.type === "return") {
          setEligibilityMessage("Order is eligible for return");
        } else if (res.data.type === "cancel") {
          setEligibilityMessage("Order is eligible for cancellation");
        }
      } else {
        setEligibilityMessage(
          res.data.reason || "This order is not eligible."
        );
      }
    } catch (err: any) {
      console.error("[Eligibility Check Error]:", err.response?.data || err.message);
      setEligible(false);
      setEligibilityMessage(
        err.response?.data?.reason ||
        err.response?.data?.error ||
        "Failed to check eligibility. Please try again."
      );
    }

    setIsLoading(false);
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    if (!reason) {
      alert("Please select a reason");
      return;
    }

    setIsLoading(true);

    try {
      let endpoint = "";

      if (requestType === "return") {
        endpoint = `http://localhost:3500/api/orders/${orderId}/return-request`;
      } else {
        endpoint = `http://localhost:3500/api/cancel`;
      }

      console.log("[Submitting to]:", endpoint);

      const payload =
        requestType === "cancel"
          ? {
            orderId: orderId,
            reason: reason,
            message: comments,
          }
          : {
            reason: reason,
            comments: comments,
          };

      const res = await axios.post(endpoint, payload, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          "Content-Type": "application/json",
        },
      });

      console.log("[Submit Response]:", res.data);

      if (res.status === 200 || res.data.success || res.data.message) {
        setStep(3);
      } else {
        alert("Failed to submit request. Please try again.");
      }
    } catch (err: any) {
      console.error("[Submit Error]:", err.response?.data || err.message);
      alert(
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Error submitting request. Please try again."
      );
    }

    setIsLoading(false);
  };

  const returnReasons = [
    "Wrong product delivered",
    "Damaged product",
    "No longer needed",
    "Product arrived late",
    "Missing parts",
    "Poor quality",
    "Changed mind",
    "Better price elsewhere",
    "Ordered by mistake",
    "Incompatible item",
    "Wrong size/color",
    "Other",
  ];

  const cancelReasons = [
    "Changed my mind",
    "Found a better price",
    "Ordered by mistake",
    "Delivery took too long",
    "Other",
  ];

  const reasonsList = requestType === "cancel" ? cancelReasons : returnReasons;

  return (
    <div className="min-h-screen py-6">
      <div className="container mx-auto px-4" style={{ maxWidth: "750px" }}>
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900">
            {/* ✅ FIX: Dynamic header based on type */}
            {requestType === "return" ? "Return & Refund" : "Cancel Order"}
          </h1>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-10">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-10 h-10 flex items-center justify-center rounded-full text-white font-semibold ${
                  step >= s ? "bg-blue-600" : "bg-gray-300"
                }`}
              >
                {s}
              </div>
              {s !== 3 && (
                <div
                  className={`w-24 h-1 ${
                    step > s ? "bg-blue-600" : "bg-gray-300"
                  }`}
                ></div>
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Manual Eligibility Check */}
        {step === 1 && (
          <div className="bg-white shadow-md rounded-xl p-8 border border-gray-200">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-50 text-blue-600">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 6h18M3 14h6" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                Verify your order
              </h2>
            </div>

            {/* Order ID input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Order ID
              </label>
              <input
                type="text"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="Eg: 116137998"
                className="w-full border border-gray-300 p-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter the Order ID shown in your orders page
              </p>
            </div>

            {/* Check button */}
            <button
              onClick={handleEligibilityCheck}
              disabled={isLoading || !orderId}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                  Checking eligibility
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Check eligibility
                </>
              )}
            </button>

            {/* Eligible state */}
            {!isLoading && eligible === true && (
              <div className="mt-6">
                <div className="flex gap-3 bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="text-green-600">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>

                  <div>
                    {/* ✅ FIX: Dynamic message based on requestType */}
                    <p className="font-medium text-green-800">
                      Eligible for {requestType === "return" ? "return" : "cancellation"}
                    </p>
                    {returnDeadline && (
                      <p className="text-sm text-green-700 mt-1">
                        Complete before {returnDeadline}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => setStep(2)}
                  className="w-full mt-5 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition"
                >
                  Continue
                </button>
              </div>
            )}

            {/* Not eligible */}
            {!isLoading && eligible === false && (
              <div className="mt-6 flex gap-3 bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="text-red-500">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM9 5h2v6H9V5zm0 8h2v2H9v-2z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <p className="text-red-700 font-medium">{eligibilityMessage}</p>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Return/Cancel Form */}
        {step === 2 && eligible && (
          <div className="bg-white shadow-lg rounded-lg p-8 mb-8">
            {/* ✅ FIX: Dynamic Eligibility Banner */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <svg
                  className="w-6 h-6 text-green-600 mt-0.5 mr-3 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  {/* ✅ FIX: Show correct text based on requestType */}
                  <p className="font-semibold text-green-800">
                    Order is eligible for {requestType === "return" ? "return" : "cancellation"}
                  </p>
                  {returnDeadline && (
                    <p className="text-sm text-green-700 mt-1">
                      {requestType === "return" ? "Return" : "Cancellation"} Deadline: {returnDeadline}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Product ID Field */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product ID
                </label>
                <input
                  type="text"
                  value={productIDFromURL || ""}
                  readOnly
                  placeholder="Enter product ID"
                  className="w-full border border-gray-300 p-3 rounded-lg bg-gray-50 text-gray-700"
                />
              </div>

              {/* Quantity Field */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity
                </label>
                <input
                  type="number"
                  value="1"
                  readOnly
                  className="w-full border border-gray-300 p-3 rounded-lg bg-gray-50 text-gray-700"
                />
              </div>

              {/* Reason Dropdown */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {/* ✅ FIX: Dynamic label */}
                  Reason for {requestType === "return" ? "Return" : "Cancellation"}
                </label>
                <select
                  className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                >
                  <option value="">Select a reason</option>
                  {reasonsList.map((r, i) => (
                    <option key={i} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              {/* Additional Comments */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Comments (Optional)
                </label>
                <textarea
                  className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Provide more details about your request..."
                  rows={4}
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                ></textarea>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || !reason}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {/* ✅ FIX: Dynamic button text */}
                {isLoading ? "Submitting..." : `Submit ${requestType === "return" ? "Return" : "Cancellation"}`}
              </button>
            </form>
          </div>
        )}

        {/* Step 3: Success Message */}
        {step === 3 && (
          <div className="bg-white shadow-lg rounded-lg p-8 text-center mb-8">
            <div className="mb-6">
              <svg
                className="w-20 h-20 text-green-500 mx-auto"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-green-700 mb-4">
              {requestType === "return"
                ? "Return Request Submitted!"
                : "Order Cancelled Successfully!"}
            </h2>
            <p className="text-gray-600 text-lg mb-8">
              We will process your request shortly. You'll receive an email confirmation.
            </p>

            <button
              onClick={() => router.push("/orders")}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
            >
              View My Orders
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReturnRequest;
