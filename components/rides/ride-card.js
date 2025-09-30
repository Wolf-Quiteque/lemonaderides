// components/rides/ride-card.js
'use client';
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card.js';
import { Button } from '../ui/button.js';
import { MapPin, Clock, User, Car } from 'lucide-react';
import { format } from 'date-fns';

export function RideCard({ ride, onAction, showActions = true }) {
  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-blue-100 text-blue-800',
    rejected: 'bg-red-100 text-red-800',
    assigned: 'bg-purple-100 text-purple-800',
    in_progress: 'bg-green-100 text-green-800',
    completed: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  const handleAction = (action) => {
    if (onAction) onAction(action, ride);
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-3">
          <CardTitle className="text-lg flex items-center gap-2 min-w-0">
            <MapPin className="h-5 w-5 text-blue-500 shrink-0" />
            <span className="truncate">{ride.pickup_address}</span>
            <span className="text-gray-400 shrink-0">→</span>
            <span className="truncate">{ride.dropoff_address}</span>
          </CardTitle>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[ride.status]}`}>
            {String(ride.status || '').replace('_', ' ')}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {ride.scheduled_for ? format(new Date(ride.scheduled_for), 'MMM dd, yyyy HH:mm') : '—'}
          </div>
          <div className="flex items-center gap-1">
            <User className="h-4 w-4" />
            {ride.seats_required} seat{ride.seats_required > 1 ? 's' : ''}
          </div>
          {ride.driver_id && (
            <div className="flex items-center gap-1">
              <Car className="h-4 w-4" />
              Driver assigned
            </div>
          )}
        </div>

        {ride.notes && (
          <p className="text-sm text-gray-600">{ride.notes}</p>
        )}

        {showActions && onAction && (
          <div className="flex gap-2 pt-2">
            {ride.status === 'pending' && (
              <Button variant="secondary" size="sm" onClick={() => handleAction('edit')}>
                Edit
              </Button>
            )}
            {ride.status === 'pending' && (
              <Button variant="destructive" size="sm" onClick={() => handleAction('cancel')}>
                Cancel
              </Button>
            )}
            {ride.status === 'assigned' && (
              <Button size="sm" onClick={() => handleAction('track')}>
                Track Ride
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

