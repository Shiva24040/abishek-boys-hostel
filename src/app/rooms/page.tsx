'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BedDouble,
  Plus,
  Trash2,
  Edit,
  UserPlus,
  CheckCircle2,
  Users,
  Search,
  Filter,
  Check,
  AlertCircle,
  Phone,
  Info,
} from 'lucide-react';
import Badge from '@/components/common/Badge';
import Modal from '@/components/common/Modal';
import { formatCurrency, formatDate } from '@/lib/formatters';

export default function RoomsPage() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [floorFilter, setFloorFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [unassignedStudents, setUnassignedStudents] = useState<any[]>([]);

  // Modals
  const [addRoomModal, setAddRoomModal] = useState(false);
  const [assignBedModal, setAssignBedModal] = useState<{ isOpen: boolean; bed: any | null; room: any | null }>({
    isOpen: false,
    bed: null,
    room: null,
  });
  const [releaseBedModal, setReleaseBedModal] = useState<{ isOpen: boolean; bed: any | null }>({
    isOpen: false,
    bed: null,
  });
  const [deleteRoomModal, setDeleteRoomModal] = useState<{ isOpen: boolean; room: any | null }>({
    isOpen: false,
    room: null,
  });

  // Forms
  const [roomForm, setRoomForm] = useState({
    roomNumber: '',
    floor: 1,
    totalBeds: 4,
    roomType: 'Standard Non-AC',
    amenities: 'Ceiling Fan, Study Desks, Lockers, Attached Washroom, Wi-Fi',
    notes: '',
  });

  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    fetchRooms();
    fetchStudents();
  }, [floorFilter]);

  const fetchRooms = async () => {
    setLoading(true);
    try {
      let url = `/api/rooms?floor=${floorFilter}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setRooms(data.rooms);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await fetch('/api/students');
      const data = await res.json();
      if (data.success) {
        // Students who are unassigned or active
        setUnassignedStudents(data.students.filter((s: any) => s.status !== 'LEFT'));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setActionError(null);
    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(roomForm),
      });
      const data = await res.json();
      if (data.success) {
        setAddRoomModal(false);
        setRoomForm({
          roomNumber: '',
          floor: 1,
          totalBeds: 4,
          roomType: 'Standard Non-AC',
          amenities: 'Ceiling Fan, Study Desks, Lockers, Attached Washroom, Wi-Fi',
          notes: '',
        });
        fetchRooms();
      } else {
        setActionError(data.error || 'Failed to create room');
      }
    } catch (e) {
      console.error(e);
      setActionError('Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignBed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignBedModal.bed || !selectedStudentId) return;
    setSubmitting(true);
    setActionError(null);
    try {
      const res = await fetch('/api/beds/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: selectedStudentId,
          bedId: assignBedModal.bed.id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAssignBedModal({ isOpen: false, bed: null, room: null });
        setSelectedStudentId('');
        fetchRooms();
      } else {
        setActionError(data.error || 'Failed to assign bed');
      }
    } catch (e) {
      console.error(e);
      setActionError('Failed to assign bed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReleaseBed = async () => {
    if (!releaseBedModal.bed) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/beds/release', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bedId: releaseBedModal.bed.id }),
      });
      const data = await res.json();
      if (data.success) {
        setReleaseBedModal({ isOpen: false, bed: null });
        fetchRooms();
      } else {
        alert(data.error || 'Failed to release bed');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRoom = async () => {
    if (!deleteRoomModal.room) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/rooms/${deleteRoomModal.room.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setDeleteRoomModal({ isOpen: false, room: null });
        fetchRooms();
      } else {
        alert(data.error || 'Cannot delete room with active residents');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  // Stats
  const totalRooms = rooms.length;
  const totalBeds = rooms.reduce((acc, r) => acc + r.totalBeds, 0);
  const occupiedBeds = rooms.reduce((acc, r) => acc + r.occupiedCount, 0);
  const availableBeds = totalBeds - occupiedBeds;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Rooms & Bed Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure rooms, visually monitor bed layouts, and allocate beds to registered students.
          </p>
        </div>

        <button
          onClick={() => {
            setActionError(null);
            setAddRoomModal(true);
          }}
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-blue-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Room</span>
        </button>
      </div>

      {/* Summary Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="text-[11px] font-bold text-slate-400 uppercase">Configured Rooms</div>
          <div className="text-2xl font-black text-slate-800 mt-1">{totalRooms}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="text-[11px] font-bold text-slate-400 uppercase">Total Beds</div>
          <div className="text-2xl font-black text-slate-800 mt-1">{totalBeds}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="text-[11px] font-bold text-indigo-500 uppercase">Occupied Beds</div>
          <div className="text-2xl font-black text-indigo-700 mt-1">{occupiedBeds}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="text-[11px] font-bold text-emerald-500 uppercase">Available Beds</div>
          <div className="text-2xl font-black text-emerald-700 mt-1">{availableBeds}</div>
        </div>
      </div>

      {/* Filters and Floor Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-sm">
        {/* Floor Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
          {['ALL', '1', '2', '3'].map((fl) => (
            <button
              key={fl}
              onClick={() => setFloorFilter(fl)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                floorFilter === fl
                  ? 'bg-navy-950 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {fl === 'ALL' ? 'All Floors' : `Floor ${fl}`}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search room number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchRooms()}
            className="w-full sm:w-60 pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Rooms Visual Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs">Loading room diagrams...</div>
      ) : rooms.length === 0 ? (
        <div className="p-12 bg-white rounded-3xl border border-slate-200 text-center">
          <BedDouble className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-700">No rooms found</p>
          <p className="text-xs text-slate-400 mt-1">Try adjusting filters or add a new room.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6">
          {rooms.map((room) => {
            const isFull = room.availableCount === 0;

            return (
              <div
                key={room.id}
                className="bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md transition overflow-hidden flex flex-col justify-between"
              >
                {/* Room Card Header */}
                <div className="p-5 border-b border-slate-100 bg-slate-50/60 flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-2.5">
                      <span className="text-xl font-black text-slate-800">
                        Room {room.roomNumber}
                      </span>
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-700">
                        Floor {room.floor}
                      </span>
                      <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                        {room.roomType}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">{room.amenities}</p>
                  </div>

                  {/* Actions & Occupancy Badge */}
                  <div className="flex items-center space-x-2">
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                        isFull
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      {room.occupiedCount} / {room.totalBeds} Occupied
                    </span>
                    {room.occupiedCount === 0 && (
                      <button
                        onClick={() => setDeleteRoomModal({ isOpen: true, room })}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Delete Room"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Visual Bed Layout as requested in Section 3 & 27 */}
                <div className="p-5 flex-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center justify-between">
                    <span>Visual Bed Layout</span>
                    <span className="text-slate-400 font-normal">
                      {room.availableCount} bed{room.availableCount === 1 ? '' : 's'} available
                    </span>
                  </div>

                  {/* Bed Grid (2 columns) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {room.beds.map((bed: any) => {
                      const isOccupied = bed.isOccupied;

                      return (
                        <div
                          key={bed.id}
                          className={`p-3.5 rounded-2xl border transition-all ${
                            isOccupied
                              ? 'bg-slate-50 border-slate-200/90 shadow-sm'
                              : 'bg-emerald-50/40 border-dashed border-emerald-300 hover:border-emerald-400'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span className="text-lg">🛏️</span>
                              <span className="font-bold text-xs text-slate-800">
                                {bed.bedNumber}
                              </span>
                            </div>

                            <Badge status={isOccupied ? 'OCCUPIED' : 'AVAILABLE'} size="sm" />
                          </div>

                          {/* Student Details or Assign button */}
                          <div className="mt-2.5 pt-2 border-t border-slate-100">
                            {isOccupied && bed.student ? (
                              <div className="space-y-1">
                                <Link
                                  href={`/students/${bed.student.id}`}
                                  className="text-xs font-bold text-slate-800 hover:text-blue-600 transition block truncate"
                                >
                                  {bed.student.fullName}
                                </Link>
                                <div className="flex items-center justify-between text-[10px] text-slate-500">
                                  <span>{bed.student.studentId}</span>
                                  <Badge status={bed.student.latestPaymentStatus || 'PENDING'} size="sm" />
                                </div>
                                <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1">
                                  <span>Joined: {formatDate(bed.student.joiningDate)}</span>
                                  <button
                                    onClick={() => setReleaseBedModal({ isOpen: true, bed })}
                                    className="text-rose-600 hover:text-rose-800 font-bold hover:underline"
                                    title="Vacate Bed"
                                  >
                                    Vacate
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] text-emerald-700 font-medium">
                                  Ready for resident
                                </span>
                                <button
                                  onClick={() => {
                                    setActionError(null);
                                    setAssignBedModal({ isOpen: true, bed, room });
                                  }}
                                  className="inline-flex items-center space-x-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold transition shadow-sm"
                                >
                                  <UserPlus className="w-3 h-3" />
                                  <span>Assign</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Card Footer */}
                <div className="px-5 py-3 bg-slate-50/50 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between items-center">
                  <span>Standard Monthly Rent: {formatCurrency(5000)} / bed</span>
                  <span className="font-semibold text-slate-700">Capacity: {room.totalBeds} Students</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Room Modal */}
      <Modal
        isOpen={addRoomModal}
        onClose={() => setAddRoomModal(false)}
        title="Add New Hostel Room"
        subtitle="Configure room details and bed capacity. Beds will be auto-generated."
      >
        <form onSubmit={handleCreateRoom} className="space-y-4">
          {actionError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold">
              {actionError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Room Number *</label>
              <input
                type="text"
                required
                placeholder="e.g. 105 or 303"
                value={roomForm.roomNumber}
                onChange={(e) => setRoomForm({ ...roomForm, roomNumber: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Floor *</label>
              <select
                value={roomForm.floor}
                onChange={(e) => setRoomForm({ ...roomForm, floor: parseInt(e.target.value, 10) })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value={1}>Floor 1</option>
                <option value={2}>Floor 2</option>
                <option value={3}>Floor 3</option>
                <option value={4}>Floor 4</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Number of Beds (Capacity) *
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  min={1}
                  max={50}
                  required
                  value={roomForm.totalBeds}
                  onChange={(e) => setRoomForm({ ...roomForm, totalBeds: parseInt(e.target.value, 10) || 1 })}
                  className="w-20 px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 font-bold text-slate-800"
                />
                <select
                  value={roomForm.totalBeds}
                  onChange={(e) => setRoomForm({ ...roomForm, totalBeds: parseInt(e.target.value, 10) })}
                  className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value={1}>1 Bed (Single)</option>
                  <option value={2}>2 Beds (Double)</option>
                  <option value={3}>3 Beds (Triple)</option>
                  <option value={4}>4 Beds (Standard)</option>
                  <option value={6}>6 Beds (Dormitory)</option>
                  <option value={8}>8 Beds (Large Dorm)</option>
                  <option value={10}>10 Beds (Hall)</option>
                  <option value={12}>12 Beds (Large Hall)</option>
                  <option value={16}>16 Beds (Mega Hall)</option>
                  <option value={20}>20 Beds (20-Bed Dormitory)</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Room Category</label>
              <select
                value={roomForm.roomType}
                onChange={(e) => setRoomForm({ ...roomForm, roomType: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="Standard Non-AC">Standard Non-AC</option>
                <option value="Deluxe Non-AC">Deluxe Non-AC (Balcony)</option>
                <option value="Premium AC">Premium Split AC</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Amenities Included</label>
            <input
              type="text"
              value={roomForm.amenities}
              onChange={(e) => setRoomForm({ ...roomForm, amenities: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Internal Notes</label>
            <textarea
              rows={2}
              value={roomForm.notes}
              onChange={(e) => setRoomForm({ ...roomForm, notes: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Near staircase, renovated in August"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-3">
            <button
              type="button"
              onClick={() => setAddRoomModal(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md disabled:opacity-50"
            >
              {submitting ? 'Creating Room...' : 'Create Room & Generate Beds'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Assign Bed Modal */}
      <Modal
        isOpen={assignBedModal.isOpen}
        onClose={() => setAssignBedModal({ isOpen: false, bed: null, room: null })}
        title={`Assign Bed to Resident`}
        subtitle={`Room ${assignBedModal.room?.roomNumber} • ${assignBedModal.bed?.bedNumber}`}
      >
        <form onSubmit={handleAssignBed} className="space-y-4">
          {actionError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold">
              {actionError}
            </div>
          )}

          <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-900">
            <strong>Important Rule:</strong> Each bed can belong to strictly one student. Assigning an existing student will transfer them to this bed.
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Select Resident to Assign *
            </label>
            <select
              required
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">-- Choose a student --</option>
              {unassignedStudents.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.fullName} ({s.studentId}) - Current:{' '}
                  {s.roomNumber ? `Room ${s.roomNumber}` : 'Unassigned'}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end space-x-2 pt-3">
            <button
              type="button"
              onClick={() => setAssignBedModal({ isOpen: false, bed: null, room: null })}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !selectedStudentId}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md disabled:opacity-50"
            >
              {submitting ? 'Assigning...' : 'Confirm Bed Assignment'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Release Bed Modal */}
      <Modal
        isOpen={releaseBedModal.isOpen}
        onClose={() => setReleaseBedModal({ isOpen: false, bed: null })}
        title="Release & Vacate Bed"
        subtitle="Free this bed so it becomes available for new residents"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            Are you sure you want to vacate{' '}
            <strong className="text-slate-800">{releaseBedModal.bed?.bedNumber}</strong>?
            {releaseBedModal.bed?.student && (
              <span>
                {' '}
                Resident <strong className="text-slate-800">{releaseBedModal.bed.student.fullName}</strong> will be marked as having left the bed, and all their payment ledger records will be permanently preserved.
              </span>
            )}
          </p>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setReleaseBedModal({ isOpen: false, bed: null })}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              onClick={handleReleaseBed}
              disabled={submitting}
              className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md"
            >
              {submitting ? 'Vacating...' : 'Yes, Vacate Bed'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Room Modal */}
      <Modal
        isOpen={deleteRoomModal.isOpen}
        onClose={() => setDeleteRoomModal({ isOpen: false, room: null })}
        title="Delete Room"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            Are you sure you want to delete Room{' '}
            <strong className="text-slate-800">{deleteRoomModal.room?.roomNumber}</strong>?
            This will also remove its associated beds.
          </p>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setDeleteRoomModal({ isOpen: false, room: null })}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteRoom}
              disabled={submitting}
              className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md"
            >
              {submitting ? 'Deleting...' : 'Delete Room'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
