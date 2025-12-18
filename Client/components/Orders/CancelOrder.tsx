import React, { useState } from 'react';
import axios from 'axios';

interface CancelOrderProps {
  orderId: number;
  onClose: () => void;
}

const CancelOrder: React.FC<CancelOrderProps> = ({ orderId, onClose }) => {
  const [reason, setReason] = useState('');
  const [comments, setComments] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const cancellationReasons = [
    "Changed my mind",
    "Found a better price",
    "Ordered by mistake",
    "Delivery took too long",
    "Other"
  ];

  // ✅ FIXED: Proper cancel request handler
  const handleCancel = async () => {
    if (!reason) {
      setError('Please select a reason for cancellation.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      console.log('Sending cancel request to:', 'http://localhost:3500/api/cancel');
      console.log('Request data:', { orderId, reason, message: comments });

      const response = await axios.post(
        'http://localhost:3500/api/cancel',
        {
          orderId: orderId.toString(),
          reason: reason,
          message: comments || ''
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Cancel response:', response.data);
      alert('Order cancelled successfully!');
      onClose(); // This will trigger refresh in parent
    } catch (err: any) {
      console.error('Cancel order error:', err);
      
      if (err.response) {
        console.error('Error response:', err.response.data);
        setError(err.response.data.message || 'Failed to cancel order. Please try again.');
      } else if (err.request) {
        console.error('No response received:', err.request);
        setError('No response from server. Please check if the backend is running.');
      } else {
        console.error('Error setting up request:', err.message);
        setError(`Error: ${err.message}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
      <div className='bg-white p-8 rounded-lg w-11/12 md:w-1/3'>
        <h2 className='text-2xl font-bold mb-4'>Cancel Order</h2>
        <p className='mb-4'>Please let us know why you're cancelling.</p>

        <div className='mt-4'>
          <label htmlFor='reason' className='block mb-2 font-medium'>
            Reason for cancellation:
          </label>
          <select
            id='reason'
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className='w-full p-2 border rounded bg-white'
            disabled={isSubmitting}
          >
            <option value="" disabled>Select a reason</option>
            {cancellationReasons.map(r => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        <div className='mt-4'>
          <label htmlFor='comments' className='block mb-2 font-medium'>
            Additional comments (optional):
          </label>
          <textarea
            id='comments'
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            className='w-full p-2 border rounded'
            placeholder='Please provide more details...'
            disabled={isSubmitting}
          />
        </div>

        {error && <p className='text-red-500 mt-2 text-sm'>{error}</p>}

        <div className='mt-6 flex justify-end gap-4'>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className='bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed'
          >
            Close
          </button>

          <button
            onClick={handleCancel}
            disabled={isSubmitting}
            className='bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {isSubmitting ? 'Cancelling...' : 'Confirm Cancellation'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CancelOrder;