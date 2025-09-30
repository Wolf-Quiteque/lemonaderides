'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MobileLayout } from '../../../components/layout/mobile-layout.js';
import UnifiedSearch from '../../../components/maps/unified-search';
import DualLocationMap from '../../../components/maps/dual-location-map';
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
  const [pickupCoordinates, setPickupCoordinates] = useState(null);
  const [dropoffCoordinates, setDropoffCoordinates] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeLocation, setActiveLocation] = useState('pickup');
  const [userLocation, setUserLocation] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const minDate = tomorrow.toISOString().split('T')[0];
    setFormData(prev => ({ ...prev, date: minDate }));
  }, []);

  // Get user location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const coords = [position.coords.latitude, position.coords.longitude];

          if (coords[0] < -18.04 || coords[0] > -4.38 || coords[1] < 11.64 || coords[1] > 24.08) {
            return;
          }

          setUserLocation(coords);

          try {
            const response = await fetch(
              `https://api.opencagedata.com/geocode/v1/json?q=${coords[0]}+${coords[1]}&key=${process.env.NEXT_PUBLIC_OPENCAGE_API_KEY}&bounds=-18.04,11.64,-4.38,24.08`
            );
            const data = await response.json();
            const address = data.results[0]?.formatted || 'Current location';

            setFormData(prev => ({ ...prev, pickup: address }));
            // Store as [lat, lon]
            setPickupCoordinates(coords);
          } catch (error) {
            setFormData(prev => ({ ...prev, pickup: 'Current location' }));
            setPickupCoordinates(coords);
          }
        },
        (error) => console.log('Error getting user location:', error)
      );
    }
  }, []);

  const handleUnifiedLocationSelect = (locationData) => {
    const { name, coordinates, mode } = locationData;
    
    console.log('Location selected:', { name, coordinates, mode });

    // coordinates come as [lat, lon]
    if (mode === 'pickup') {
      setFormData(prev => ({ ...prev, pickup: name }));
      setPickupCoordinates(coordinates); // Already [lat, lon]
    } else {
      setFormData(prev => ({ ...prev, dropoff: name }));
      setDropoffCoordinates(coordinates); // Already [lat, lon]
    }
  };

  const handleMapClick = async (coords) => {
    try {
      if (coords.lat < -18.04 || coords.lat > -4.38 || coords.lng < 11.64 || coords.lng > 24.08) {
        return;
      }

      const response = await fetch(
        `https://api.opencagedata.com/geocode/v1/json?q=${coords.lat}+${coords.lng}&key=${process.env.NEXT_PUBLIC_OPENCAGE_API_KEY}&bounds=-18.04,11.64,-4.38,24.08`
      );
      const data = await response.json();
      const address = data.results[0]?.formatted || 'Selected location';

      if (activeLocation === 'pickup') {
        setFormData(prev => ({ ...prev, pickup: address }));
        setPickupCoordinates([coords.lat, coords.lng]); // Store as [lat, lon]
      } else {
        setFormData(prev => ({ ...prev, dropoff: address }));
        setDropoffCoordinates([coords.lat, coords.lng]); // Store as [lat, lon]
      }
    } catch (error) {
      console.error('Error getting address:', error);
    }
  };

  const handleContinue = () => {
    if (pickupCoordinates && dropoffCoordinates) {
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
            passenger_id: user.id,
            pickup_address: formData.pickup,
            dropoff_address: formData.dropoff,
            pickup_lat: pickupCoordinates[0], // lat
            pickup_lng: pickupCoordinates[1], // lon
            dropoff_lat: dropoffCoordinates[0], // lat
            dropoff_lng: dropoffCoordinates[1], // lon
            scheduled_for: `${formData.date}T${formData.time}`,
            seats_required: 1,
            notes: formData.notes || null,
            status: 'pending',
          },
        ]);
      if (error) throw error;
      router.push('/rides');
    } catch (err) {
      alert('Failed to schedule ride');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MobileLayout>
      <div className="fixed inset-0 flex flex-col bg-white overflow-hidden">
        {/* Header - Fixed */}
        <div className="flex-none bg-white border-b border-gray-200 z-20">
          <div className="px-4 py-3 flex items-center justify-between" style={{ marginTop:"50px"}}>
            <button
              onClick={() => step === 2 ? setStep(1) : router.push('/dashboard')}
              className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex-1 text-center">
              <h1 className="text-lg font-semibold text-gray-900">
                {step === 1 ? 'Select Locations' : 'Ride Details'}
              </h1>
            </div>
            <div className="w-10"></div>
          </div>
          
          {/* Progress indicator */}
          <div className="flex px-4 pb-3">
            <div className={`h-1 flex-1 rounded-full transition-all duration-300 ${step >= 1 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
            <div className="w-2"></div>
            <div className={`h-1 flex-1 rounded-full transition-all duration-300 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
          </div>
        </div>

        {/* Content Area - Scrollable */}
        <div className="flex-1 relative overflow-hidden">
          {/* Step 1: Location Selection */}
          <div
            className={`absolute inset-0 flex flex-col transition-transform duration-300 ${
              step === 1 ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            {/* Search Box - Fixed at top */}
            <div className="flex-none bg-white px-4 py-4 border-b border-gray-100 z-10">
              <UnifiedSearch
                activeMode={activeLocation}
                onModeChange={setActiveLocation}
                onLocationSelect={handleUnifiedLocationSelect}
                pickupLocation={formData.pickup}
                dropoffLocation={formData.dropoff}
              />
            </div>
      {pickupCoordinates && dropoffCoordinates && (
              <div className="flex-none bg-white border-t border-gray-200 p-4">
                <button 
                  onClick={handleContinue}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors shadow-lg"
                >
                  Continue to Details
                </button>
              </div>
            )}
            {/* Map - Takes remaining space */}
            <div className="flex-1 relative">
              <DualLocationMap
                pickupCoordinates={pickupCoordinates} // Pass [lat, lon]
                dropoffCoordinates={dropoffCoordinates} // Pass [lat, lon]
                onMapClick={handleMapClick}
                interactive={true}
                showRoute={pickupCoordinates && dropoffCoordinates}
                className="w-full h-full"
              />
            </div>

            {/* Continue Button - Fixed at bottom */}
      
          </div>

          {/* Step 2: Ride Details */}
          <div
            className={`absolute inset-0 flex flex-col transition-transform duration-300 ${
              step === 2 ? 'translate-x-0' : 'translate-x-full'
            }`}
          >
            {/* Details Form - Scrollable */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-4 space-y-4">
                {/* Route Summary */}
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-green-600 text-sm">📍</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 mb-1">Pickup</p>
                      <p className="text-sm font-medium text-gray-900 truncate">{formData.pickup}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-red-600 text-sm">🏁</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 mb-1">Dropoff</p>
                      <p className="text-sm font-medium text-gray-900 truncate">{formData.dropoff}</p>
                    </div>
                  </div>
                </div>

                {/* Date & Time */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">When do you need this ride?</label>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="date"
                      required
                      min={new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0]}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    />
                    <input
                      type="time"
                      required
                      min="06:30"
                      max="17:00"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={formData.time}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Special instructions (Optional)</label>
                  <textarea
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Any special requests or notes..."
                  />
                </div>
  {/* Submit Button - Fixed at bottom */}
            <div className="flex-none bg-white border-t border-gray-200 p-4 space-y-2">
              <button
                onClick={handleSubmit}
                disabled={loading || !formData.date || !formData.time}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-semibold rounded-xl transition-colors shadow-lg"
              >
                {loading ? 'Scheduling...' : 'Schedule Ride'}
              </button>
            </div>
                {/* Mini Map Preview */}
                <div className="rounded-xl overflow-hidden">
                  <DualLocationMap
                    pickupCoordinates={pickupCoordinates}
                    dropoffCoordinates={dropoffCoordinates}
                    interactive={false}
                    showRoute={true}
                    className="w-full h-48"
                  />
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </MobileLayout>
  );
}
