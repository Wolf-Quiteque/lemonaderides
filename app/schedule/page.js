'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import LocationPicker from '../../components/maps/location-picker';
import SearchBox from '../../components/maps/search-box';
import { MobileLayout } from '../../components/layout/mobile-layout.js';
import { Button } from '../../components/ui/button.js';
import { Card, CardContent } from '../../components/ui/card.js';

export default function ScheduleRide() {
  const [formData, setFormData] = useState({
    pickup: '',
    dropoff: '',
    date: '',
    time: '',
    passengers: 1
  });
  const [pickupCoordinates, setPickupCoordinates] = useState(null);
  const [dropoffCoordinates, setDropoffCoordinates] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeLocation, setActiveLocation] = useState('pickup');
  const router = useRouter();
  

  const handleLocationSelect = async (coords) => {
    const response = await fetch(
      `https://api.opencagedata.com/geocode/v1/json?q=${coords.lat}+${coords.lng}&key=${process.env.NEXT_PUBLIC_OPENCAGE_API_KEY}`
    );
    const data = await response.json();
    const address = data.results[0]?.formatted || 'Unknown location';

    if (activeLocation === 'pickup') {
      setFormData({ ...formData, pickup: address });
      setPickupCoordinates([coords.lng, coords.lat]);
    } else {
      setFormData({ ...formData, dropoff: address });
      setDropoffCoordinates([coords.lng, coords.lat]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('rides')
        .insert([{
          passenger_id: user.id,
          pickup_address: formData.pickup,
          dropoff_address: formData.dropoff,
          pickup_lat: pickupCoordinates[1],
          pickup_lng: pickupCoordinates[0],
          dropoff_lat: dropoffCoordinates[1],
          dropoff_lng: dropoffCoordinates[0],
          scheduled_for: `${formData.date}T${formData.time}`,
          seats_required: formData.passengers,
          status: 'pending'
        }]);

      if (error) throw error;

      alert('Ride scheduled successfully!');
      router.push('/dashboard');

    } catch (error) {
      console.error('Error:', error);
      alert('Failed to schedule ride');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MobileLayout>
      <div className="space-y-4">
        <h1 className="text-xl font-semibold">Schedule a Ride</h1>

        <Card>
          <CardContent className="space-y-4 p-4">
            <div onClick={() => setActiveLocation('pickup')}>
              <label className="block mb-2 text-sm font-medium">Pickup Location</label>
              <SearchBox
                onSelect={({ name, coordinates }) => {
                  setFormData({ ...formData, pickup: name });
                  setPickupCoordinates(coordinates);
                }}
                placeholder="Enter pickup address"
              />
            </div>

            <div onClick={() => setActiveLocation('dropoff')}>
              <label className="block mb-2 text-sm font-medium">Dropoff Location</label>
              <SearchBox
                onSelect={({ name, coordinates }) => {
                  setFormData({ ...formData, dropoff: name });
                  setDropoffCoordinates(coordinates);
                }}
                placeholder="Enter dropoff address"
              />
            </div>

            <LocationPicker
              onLocationSelect={handleLocationSelect}
              initialCoordinates={ activeLocation === 'pickup' ? pickupCoordinates : dropoffCoordinates }
            />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 text-sm font-medium">Date</label>
                <input
                  type="date"
                  required
                  className="w-full p-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium">Time</label>
                <input
                  type="time"
                  required
                  className="w-full p-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium">Passengers</label>
              <select
                className="w-full p-3 bg-background border border-border rounded-lg"
                value={formData.passengers}
                onChange={(e) => setFormData({ ...formData, passengers: parseInt(e.target.value) })}
              >
                {[1, 2, 3, 4].map((num) => (
                  <option key={num} value={num}>{num}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Button type="submit" onClick={handleSubmit} disabled={loading} className="w-full">
                {loading ? 'Scheduling...' : 'Schedule Ride'}
              </Button>
              <Button type="button" variant="secondary" className="w-full" onClick={() => router.push('/dashboard')}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </MobileLayout>
  );
}
