'use client';

import { useEffect, useState } from 'react';
import RequestItem from '@/components/user/RequestItem';
import Link from 'next/link';

type Request = {
  id: string;
  requestCode: string;
  title: string;
  issueType: string;
  building: string;
  roomNumber: string;
  status: string;
  priorityLevel: string;
  urgencyLevel: string;
  photoUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export default function UserRequestsPage() {
  const [requests, setRequests] = useState<Request[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/user/requests')
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to fetch requests');
        }
        return response.json();
      })
      .then((data) => {
        setRequests(data.requests);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setIsLoading(false);
      });
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-container-lowest flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <span className="material-symbols-outlined" style={{ fontSize: '36px' }}>
            hourglass_bottom
          </span>
          <p className="font-label-md text-label-md text-on-surface">Loading your requests...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-surface-container-lowest flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="material-symbols-outlined text-error" style={{ fontSize: '36px' }}>
            error
          </span>
          <p className="font-label-md text-label-md text-on-surface">Failed to load requests: {error}</p>
          <Link
            href="/user/requests/new"
            className="mt-4 bg-secondary text-on-secondary px-6 py-3 rounded-lg font-label-md text-label-md hover:bg-primary transition-colors"
          >
            <span className="material-symbols-outlined mr-2" style={{ fontVariationSettings: "'FILL' 1" }}>
              add_circle
            </span>
            Submit New Request
          </Link>
        </div>
      </div>
    );
  }

  if (!requests || requests.length === 0) {
    return (
      <div className="min-h-screen bg-surface-container-lowest flex flex-col items-center justify-center py-12">
        <span className="material-symbols-outlined text-outline" style={{ fontSize: '48px' }}>
          assignment
        </span>
        <p className="font-h2 text-h2 text-on-surface-variant font-semibold">
          No requests yet
        </p>
        <p className="font-body-sm text-body-sm text-outline text-sm max-w-md text-center">
          You haven't submitted any requests yet. Click the button below to create your first maintenance request.
        </p>
        <Link
          href="/user/requests/new"
          className="mt-6 bg-secondary text-on-secondary px-6 py-3 rounded-lg font-label-md text-label-md hover:bg-primary transition-colors"
        >
          <span className="material-symbols-outlined mr-2" style={{ fontVariationSettings: "'FILL' 1" }}>
            add_circle
          </span>
          Submit New Request
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-container-lowest">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="font-h1 text-h1 text-on-surface flex items-center gap-3 text-3xl font-bold">
            <span
              className="material-symbols-outlined text-primary"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              assignment
            </span>
            My Requests
          </h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-2">
            View and track all your submitted maintenance requests.
          </p>
        </div>

        {/* Requests Grid */}
        <div className="grid gap-6">
          {/* Mobile: 1 column, Tablet: 2 columns, Desktop: 3 columns */}
          <div className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {requests.map((request) => (
              <RequestItem key={request.id} request={request} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}