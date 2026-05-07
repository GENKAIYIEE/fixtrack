'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';

interface AdminActionCardProps {
  request: any;
  onRefresh: () => void;
}

export default function AdminActionCard({ request, onRefresh }: AdminActionCardProps) {
  const [priority, setPriority] = useState(request.priorityLevel || 'NORMAL');
  const [adminNotes, setAdminNotes] = useState(request.adminNotes || '');
  const [isUpdating, setIsUpdating] = useState(false);

  // Technician assignment state
  const [showTechSelector, setShowTechSelector] = useState(false);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [selectedTechId, setSelectedTechId] = useState<string | null>(null);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'reject' | 'cancel' | null>(null);
  const [modalReason, setModalReason] = useState('');

  const priorities = ['LOW', 'NORMAL', 'HIGH', 'URGENT'];

  const getPriorityColor = (p: string) => {
    switch (p) {
      case 'URGENT': return 'text-error';
      case 'HIGH': return 'text-orange-500';
      case 'NORMAL': return 'text-secondary';
      case 'LOW': return 'text-outline';
      default: return 'text-outline';
    }
  };

  const handlePriorityChange = async (newPriority: string) => {
    setPriority(newPriority);
    setIsUpdating(true);
    try {
      await fetch(`/api/admin/requests/${request.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'updatePriority', priorityLevel: newPriority }),
      });
      onRefresh();
    } catch (error) {
      console.error('Failed to update priority', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const fetchTechnicians = async () => {
    try {
      const res = await fetch('/api/users?role=TECHNICIAN&status=ACTIVE');
      if (res.ok) {
        const data = await res.json();
        setTechnicians(data.users || data);
      }
    } catch (error) {
      console.error('Failed to fetch technicians', error);
    }
  };

  const handleTechChangeClick = () => {
    setShowTechSelector(!showTechSelector);
    if (!showTechSelector && technicians.length === 0) {
      fetchTechnicians();
    }
  };

  const confirmAssignment = async () => {
    if (!selectedTechId) return;
    setIsUpdating(true);
    try {
      await fetch(`/api/admin/requests/${request.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'assign', technicianId: selectedTechId }),
      });
      setShowTechSelector(false);
      onRefresh();
    } catch (error) {
      console.error('Failed to assign technician', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleApprove = async () => {
    setIsUpdating(true);
    try {
      await fetch(`/api/admin/requests/${request.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'approve', 
          priorityLevel: priority, 
          adminNotes,
          assignedToId: selectedTechId || request.assignedToId
        }),
      });
      onRefresh();
    } catch (error) {
      console.error('Failed to approve request', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const openModal = (type: 'reject' | 'cancel') => {
    setModalType(type);
    setModalReason('');
    setModalOpen(true);
  };

  const confirmModalAction = async () => {
    if (modalReason.length < 20 || !modalType) return;
    setIsUpdating(true);
    try {
      await fetch(`/api/admin/requests/${request.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: modalType, 
          [`${modalType}Reason`]: modalReason 
        }),
      });
      setModalOpen(false);
      onRefresh();
    } catch (error) {
      console.error(`Failed to ${modalType} request`, error);
    } finally {
      setIsUpdating(false);
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const reasonChips = [
    "Duplicate Report",
    "Insufficient Information",
    "Out of Scope",
    "Already Being Handled",
    "Invalid Location"
  ];

  return (
    <div className="bg-surface rounded-xl overflow-hidden border border-outline-variant shadow-sm border-t-4 border-t-error sticky top-24">
      <div className="p-6">
        <h3 className="text-lg font-bold text-on-surface mb-6">Admin Actions</h3>

        {/* Priority Selector */}
        <div className="mb-6">
          <p className="text-sm text-on-surface-variant font-medium mb-2">Priority Level</p>
          <div className="flex bg-surface-container-low rounded-lg p-1">
            {priorities.map((p) => (
              <button
                key={p}
                onClick={() => handlePriorityChange(p)}
                disabled={isUpdating}
                className={`flex-1 text-xs font-bold py-2 rounded-md transition-all ${
                  priority === p 
                    ? `bg-white shadow-sm ${getPriorityColor(p)}` 
                    : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Assignment Section */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm text-on-surface-variant font-medium">Assigned Technician</p>
            <button 
              onClick={handleTechChangeClick}
              className="text-primary text-sm font-medium hover:underline"
            >
              Change
            </button>
          </div>
          
          {request.assignee ? (
            <div className="flex items-center gap-3 p-3 bg-surface-container-low rounded-lg border border-outline-variant">
              <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-xs overflow-hidden relative">
                {request.assignee.avatarUrl ? (
                  <Image src={request.assignee.avatarUrl} alt="Avatar" fill className="object-cover" />
                ) : (
                  getInitials(request.assignee.firstName, request.assignee.lastName)
                )}
              </div>
              <div>
                <p className="text-sm font-bold text-on-surface">
                  {request.assignee.firstName} {request.assignee.lastName}
                </p>
                <p className="text-xs text-on-surface-variant">{request.assignee.specialization}</p>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-surface-container-low rounded-lg border border-outline-variant text-sm text-on-surface-variant italic">
              Unassigned
            </div>
          )}

          {/* Tech Selector Dropdown */}
          {showTechSelector && (
            <div className="mt-2 bg-surface border border-outline-variant rounded-lg p-3 shadow-md max-h-64 overflow-y-auto">
              {technicians.length === 0 ? (
                <p className="text-sm text-center text-on-surface-variant py-2">Loading technicians...</p>
              ) : (
                <div className="space-y-2">
                  {technicians.map((tech) => (
                    <div 
                      key={tech.id}
                      onClick={() => setSelectedTechId(tech.id)}
                      className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer border ${
                        selectedTechId === tech.id ? 'bg-primary-container border-primary text-on-primary-container' : 'border-transparent hover:bg-surface-container text-on-surface'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-surface-container-highest text-on-surface flex items-center justify-center font-bold text-xs overflow-hidden relative">
                        {tech.avatarUrl ? (
                           <Image src={tech.avatarUrl} alt="Avatar" fill className="object-cover" />
                        ) : (
                          getInitials(tech.firstName, tech.lastName)
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold">{tech.firstName} {tech.lastName}</p>
                        <p className="text-xs opacity-80">{tech.specialization}</p>
                      </div>
                      {/* Workload Count - dummy for now if not provided */}
                      <span className="text-xs font-bold px-2 py-1 bg-surface-container rounded-full">
                        {tech._count?.assignedRequests || 0} tasks
                      </span>
                    </div>
                  ))}
                  {selectedTechId && (
                    <button 
                      onClick={confirmAssignment}
                      disabled={isUpdating}
                      className="w-full mt-2 py-2 bg-primary text-on-primary text-sm font-bold rounded-full hover:bg-primary/90 transition-colors"
                    >
                      Confirm Assignment
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Admin Notes */}
        <div className="mb-6">
          <p className="text-sm text-on-surface-variant font-medium mb-2">Admin Notes</p>
          <textarea
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            placeholder="Add internal notes (not visible to requester)..."
            className="w-full bg-surface-container-low border border-outline-variant rounded-lg p-3 text-sm text-on-surface h-24 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Action Buttons */}
        {request.status === 'PENDING' && (
          <div className="space-y-3">
            <button
              onClick={handleApprove}
              disabled={isUpdating}
              className="w-full flex items-center justify-center gap-2 py-3 bg-[#10B981] text-white font-bold rounded-full hover:opacity-90 transition-opacity"
            >
              <span className="material-symbols-outlined">check_circle</span>
              Approve Action Plan
            </button>
            <button
              onClick={() => openModal('reject')}
              disabled={isUpdating}
              className="w-full flex items-center justify-center gap-2 py-3 bg-error text-white font-bold rounded-full hover:opacity-90 transition-opacity"
            >
              <span className="material-symbols-outlined">cancel</span>
              Reject Request
            </button>
            <button
              onClick={() => openModal('cancel')}
              disabled={isUpdating}
              className="w-full flex items-center justify-center gap-2 py-3 bg-surface-container text-on-surface font-bold rounded-full hover:opacity-90 transition-opacity"
            >
              Cancel / Put on Hold
            </button>
          </div>
        )}

        {request.status === 'ONGOING' && (
          <button
            onClick={() => openModal('cancel')}
            disabled={isUpdating}
            className="w-full flex items-center justify-center gap-2 py-3 bg-surface-container text-on-surface font-bold rounded-full hover:opacity-90 transition-opacity"
          >
            Cancel / Put on Hold
          </button>
        )}

        {request.status === 'COMPLETED' && (
          <div className="p-4 bg-primary-container text-on-primary-container text-center font-bold rounded-lg">
            This request has been resolved
          </div>
        )}

        {(request.status === 'REJECTED' || request.status === 'CANCELLED') && (
          <div className="p-4 bg-surface-container text-on-surface-variant text-center font-bold rounded-lg">
            This request has been closed
          </div>
        )}
      </div>

      {/* Inline Reject/Cancel Modal */}
      {/* // TODO: Replace with Screen 23 dedicated modal component when built */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-surface p-6 rounded-xl w-full max-w-md shadow-lg">
            <h2 className="text-xl font-bold text-on-surface mb-2">
              {modalType === 'reject' ? 'Reject Request' : 'Cancel Request'}
            </h2>
            <p className="text-sm text-on-surface-variant mb-4">
              REQ-{request.requestCode}
            </p>

            <p className="text-sm font-medium text-on-surface mb-2">Reason (minimum 20 characters)</p>
            <textarea
              value={modalReason}
              onChange={(e) => setModalReason(e.target.value)}
              className="w-full bg-surface-container-low border border-outline-variant rounded-lg p-3 text-sm text-on-surface h-32 focus:outline-none focus:border-primary mb-3"
              placeholder="Provide a detailed reason..."
            />
            <div className="text-xs text-on-surface-variant mb-4 text-right">
              {modalReason.length}/20 chars
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              {reasonChips.map((chip) => (
                <button
                  key={chip}
                  onClick={() => setModalReason(chip)}
                  className="px-3 py-1 bg-surface-container text-on-surface text-xs rounded-full hover:bg-surface-container-high transition-colors"
                >
                  {chip}
                </button>
              ))}
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 font-bold text-on-surface-variant hover:bg-surface-container rounded-full transition-colors"
              >
                Go Back
              </button>
              <button
                onClick={confirmModalAction}
                disabled={modalReason.length < 20 || isUpdating}
                className="px-4 py-2 font-bold bg-error text-white rounded-full hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirm {modalType === 'reject' ? 'Rejection' : 'Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
