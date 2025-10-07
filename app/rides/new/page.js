'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MobileLayout } from '../../../components/layout/mobile-layout.js';
import { supabase } from '../../../lib/supabase';

export default function NewRide() {
  const [step, setStep] = useState(1); // 1: locations, 2: details
  const [formData, setFormData] = useState({
    pickup: '',
    dropoff: '',
    date: '',
    time: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const minDate = tomorrow.toISOString().split('T')[0];
    setFormData(prev => ({ ...prev, date: minDate }));
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Continue to details when both locations are provided
  const handleContinue = () => {
    if (formData.pickup && formData.dropoff) {
      setStep(2);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('rides')
        .insert([
          {
            requester_id: user?.id,
            origin: formData.pickup,
            destination: formData.dropoff,
            scheduled_for: formData.date && formData.time ? `${formData.date}T${formData.time}` : null,
            seats_requested: 1,
            notes: formData.notes || null,
            status: 'pending',
          },
        ]);
      if (error) throw error;
      router.push('/rides');
    } catch (err) {
      console.log(err);
      alert('Failed to schedule ride');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MobileLayout>
      <div className="fixed inset-0 flex flex-col bg-white dark:bg-gray-900 overflow-hidden">
        {/* Header - Fixed */}
        <div className="flex-none bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 z-20">
          <div className="px-4 py-3 flex items-center justify-between" style={{ marginTop: '50px' }}>
            <button
              onClick={() => step === 2 ? setStep(1) : router.push('/dashboard')}
              className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
            >
              <svg className="w-6 h-6 text-gray-700 dark:text-gray-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex-1 text-center">
              <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {step === 1 ? 'Select Locations' : 'Ride Details'}
              </h1>
            </div>
            <div className="w-10"></div>
          </div>
          
          {/* Progress indicator */}
          <div className="flex px-4 pb-3">
            <div className={`h-1 flex-1 rounded-full transition-all duration-300 ${step >= 1 ? 'bg-blue-600 dark:bg-blue-400' : 'bg-gray-200 dark:bg-gray-700'}`}></div>
            <div className="w-2"></div>
            <div className={`h-1 flex-1 rounded-full transition-all duration-300 ${step >= 2 ? 'bg-blue-600 dark:bg-blue-400' : 'bg-gray-200 dark:bg-gray-700'}`}></div>
          </div>
        </div>

        {/* Content Area - Scrollable */}
        <div className="flex-1 relative overflow-hidden">
          {/* Step 1: Location Selection */}
          <div className={`absolute inset-0 flex flex-col transition-transform duration-300 ${step === 1 ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className="flex-1 bg-white dark:bg-gray-900 p-4 space-y-4">
              <div>
                <label htmlFor="pickup" className="block text-sm font-medium text-gray-700 dark:text-gray-200">Pickup Location</label>
                <textarea
                  id="pickup"
                  name="pickup"
                  rows="3"
                  className="mt-1 block w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  placeholder="Enter pickup address"
                  value={formData.pickup}
                  onChange={handleInputChange}
                ></textarea>
              </div>
              <div>
                <label htmlFor="dropoff" className="block text-sm font-medium text-gray-700 dark:text-gray-200">Drop-off Location</label>
                <textarea
                  id="dropoff"
                  name="dropoff"
                  rows="3"
                  className="mt-1 block w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  placeholder="Enter drop-off address"
                  value={formData.dropoff}
                  onChange={handleInputChange}
                ></textarea>
              </div>
              <button
                onClick={handleContinue}
                disabled={!formData.pickup || !formData.dropoff}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-semibold rounded-xl transition-colors shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Continue to Details
              </button>
            </div>

            {/* Map removed in this plan version; UI remains clean and focused on inputs */}
          </div>

          {/* Step 2: Ride Details */}
          <div className={`absolute inset-0 flex flex-col transition-transform duration-300 ${step === 2 ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="flex-1 overflow-y-auto">
              <div className="p-4 space-y-4">
                {/* Route Summary */}
                <div className="bg-gray-50 rounded-xl p-4 space-y-3 dark:bg-gray-800 dark:border dark:border-gray-700">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-green-600 text-sm">📍</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 mb-1 dark:text-gray-300">Pickup</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{formData.pickup}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-red-600 text-sm">🏁</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 mb-1 dark:text-gray-300">Dropoff</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{formData.dropoff}</p>
                    </div>
                  </div>
                </div>

                {/* Date & Time */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">When do you need this ride?</label>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="date"
                      required
                      min={new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0]}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:focus:ring-blue-300 dark:text-white"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    />
                    <input
                      type="time"
                      required
                      min="06:30"
                      max="17:00"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:focus:ring-blue-300 dark:text-white"
                      value={formData.time}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-200">Special instructions (Optional)</label>
                  <textarea
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Any special requests or notes..."
                  />
                </div>

                {/* Submit Button - Fixed at bottom */}
                <div className="flex-none bg-white border-t border-gray-200 p-4 space-y-2 dark:bg-gray-900 dark:border-gray-800">
                  <button
                    onClick={handleSubmit}
                    disabled={loading || !formData.date || !formData.time}
                    className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors shadow-lg dark:bg-blue-500 dark:hover:bg-blue-600"
                  >
                    {loading ? 'Scheduling...' : 'Schedule Ride'}
                  </button>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </MobileLayout>
  );
}
