'use client';
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card.js';
import { Button } from '../ui/button.js';
import { MapPin, Clock, User, Car } from 'lucide-react';
import { format } from 'date-fns';

export function RideCard({ ride, onAction, showActions = true, viewAs = 'passenger' }) {
  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-200 dark:text-yellow-900',
    approved: 'bg-blue-100 text-blue-800 dark:bg-blue-200 dark:text-blue-900',
    rejected: 'bg-red-100 text-red-800 dark:bg-red-200 dark:text-red-900',
    assigned: 'bg-purple-100 text-purple-800 dark:bg-purple-200 dark:text-purple-900',
    in_progress: 'bg-green-100 text-green-800 dark:bg-green-200 dark:text-green-900',
    completed: 'bg-gray-100 text-gray-800 dark:bg-gray-200 dark:text-gray-900',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-200 dark:text-red-900',
  };

  const handleAction = (action) => {
    if (onAction) onAction(action, ride);
  };

  console.log(ride);

  return (
    <Card className="hover:shadow-lg transition-shadow bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
      <CardHeader className="pb-3 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
        <div className="flex justify-between items-start gap-4 min-w-0">
          <CardTitle className="text-lg flex gap-2 min-w-0 text-gray-900 dark:text-gray-100 flex-1">
            <MapPin className="h-5 w-5 text-blue-500 shrink-0 mt-1" />
            <div className="flex flex-col min-w-0">
              <span className="truncate font-medium">{ride.origin}</span>
              <span className="text-sm text-gray-500 truncate dark:text-gray-400">{ride.destination}</span>
            </div>
          </CardTitle>
          <span className={`px-2 py-1 rounded-full text-xs font-medium shrink-0 ${statusColors[ride.status] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100'}`}>
            {String(ride.status || '').replace('_', ' ')}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
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
          <p className="text-sm text-gray-600 dark:text-gray-300">{ride.notes}</p>
        )}

        {showActions && onAction && (
          <div className="flex gap-2 pt-2">
            {viewAs === 'passenger' && ride.status === 'pending' && (
              <>
                <Button variant="secondary" size="sm" onClick={() => handleAction('edit')}>
                  Edit
                </Button>
                <Button variant="destructive" size="sm" onClick={() => handleAction('cancel')}>
                  Cancel
                </Button>
              </>
            )}
            {viewAs === 'passenger' && ride.status === 'assigned' && (
              <Button size="sm" onClick={() => handleAction('track')}>
                Track Ride
              </Button>
            )}
            {viewAs === 'driver' && ride.status === 'pending' && (
              <Button size="sm" onClick={() => handleAction('accept')}>
                Accept Ride
              </Button>
            )}
            {viewAs === 'driver' && ride.status === 'assigned' && (
              <Button size="sm" variant="success" onClick={() => handleAction('start')}>
                Start Ride
              </Button>
            )}
            {viewAs === 'driver' && ride.status === 'in_progress' && (
              <Button size="sm" variant="destructive" onClick={() => handleAction('end')}>
                End Ride
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
