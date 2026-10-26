import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

const DataContext = createContext(null);

export const DataProvider = ({ children }) => {
  const { user } = useAuth();

  const [listings, setListings] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [reports, setReports] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [impactMetrics, setImpactMetrics] = useState({
    verifiedRescuedKg: 0,
    estimatedRescuedKg: 0,
    totalRescuedKg: 0,
    mealsRedistributed: 0,
    co2EquivalentSavedKg: 0,
    participatingDonors: 14,
    recipientOrganizations: 9,
    monthlyTrend: [
      { month: 'May', rescuedKg: 120 },
      { month: 'Jun', rescuedKg: 240 },
      { month: 'Jul', rescuedKg: 380 },
      { month: 'Aug', rescuedKg: 560 },
      { month: 'Sep', rescuedKg: 820 },
      { month: 'Oct', rescuedKg: 1140 }
    ],
    categoryBreakdown: [
      { name: 'Cooked Meals', value: 45, color: '#10b981' },
      { name: 'Bakery & Bread', value: 25, color: '#f59e0b' },
      { name: 'Fresh Produce', value: 18, color: '#059669' },
      { name: 'Dairy & Chilled', value: 12, color: '#0284c7' }
    ],
    operations: { successfulDeliveries: 0, cancellationRatePercentage: 0 }
  });
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Fetch public listings & platform analytics from database
  const refreshPublicData = useCallback(async () => {
    try {
      const [listingsRes, analyticsRes] = await Promise.all([
        api.getListings().catch(() => null),
        api.getAnalytics().catch(() => null)
      ]);

      if (listingsRes?.data?.listings) {
        setListings(listingsRes.data.listings);
      }

      if (analyticsRes?.data?.summary) {
        setImpactMetrics(prev => ({
          ...prev,
          ...analyticsRes.data.summary,
          participatingDonors: analyticsRes.data.participation?.activeDonorsCount ?? prev.participatingDonors,
          recipientOrganizations: analyticsRes.data.participation?.activeRecipientsCount ?? prev.recipientOrganizations,
          operations: analyticsRes.data.operations || prev.operations,
          monthlyTrend: (analyticsRes.data.trends && analyticsRes.data.trends.length > 0)
            ? analyticsRes.data.trends.map(t => ({ month: t.period, rescuedKg: t.rescuedKg }))
            : prev.monthlyTrend,
          categoryBreakdown: prev.categoryBreakdown
        }));
      }
    } catch (err) {
      console.warn('[DataContext] Error fetching public data:', err.message);
    }
  }, []);

  // 2. Fetch authenticated user data based on role
  const refreshUserData = useCallback(async () => {
    if (!user) return;

    try {
      if (user.role === 'donor') {
        const [donorReservations, donorListings] = await Promise.all([
          api.getDonorReservations().catch(() => null),
          api.getMyListings().catch(() => null)
        ]);
        if (donorReservations?.data?.reservations) {
          setReservations(donorReservations.data.reservations);
        }
        if (donorListings?.data?.listings) {
          // Merge donor's listings with marketplace
          setListings(prev => {
            const donorItems = donorListings.data.listings;
            const otherItems = prev.filter(p => !donorItems.some(d => d._id === p._id));
            return [...donorItems, ...otherItems];
          });
        }
      } else if (user.role === 'recipient') {
        const recipReservations = await api.getMyReservations().catch(() => null);
        if (recipReservations?.data?.reservations) {
          setReservations(recipReservations.data.reservations);
        }
      } else if (user.role === 'volunteer') {
        const [boardRes, myTasksRes] = await Promise.all([
          api.getTaskBoard().catch(() => null),
          api.getMyTasks().catch(() => null)
        ]);
        const boardTasks = boardRes?.data?.tasks || [];
        const myTasks = myTasksRes?.data?.tasks || [];
        setTasks([...myTasks, ...boardTasks.filter(b => !myTasks.some(m => m._id === b._id))]);
      } else if (user.role === 'admin') {
        const [adminReports, adminLogs, orgQueue] = await Promise.all([
          api.getAdminReports().catch(() => null),
          api.getAuditLogs().catch(() => null),
          api.getOrgVerificationQueue().catch(() => null)
        ]);
        if (adminReports?.data?.reports) setReports(adminReports.data.reports);
        if (adminLogs?.data?.logs) setAuditLogs(adminLogs.data.logs);
        if (orgQueue?.data?.organizations) setOrganizations(orgQueue.data.organizations);
      }
    } catch (err) {
      console.warn('[DataContext] Error refreshing user-specific data:', err.message);
    }
  }, [user]);

  useEffect(() => {
    setLoading(true);
    Promise.all([refreshPublicData(), refreshUserData()]).finally(() => {
      setLoading(false);
    });
  }, [refreshPublicData, refreshUserData]);

  // --- Real Operations & Mutations ---

  // 1. Post Food Listing
  const addListing = async (listingData) => {
    try {
      const res = await api.createListing({
        title: listingData.title,
        description: listingData.description,
        category: listingData.category,
        quantity: Number(listingData.quantity),
        unit: listingData.unit,
        pickupWindow: {
          startTime: listingData.pickupStart || new Date().toISOString(),
          endTime: listingData.pickupEnd || new Date(Date.now() + 6 * 3600 * 1000).toISOString()
        },
        storageRequirements: listingData.storageRequirements || 'ambient',
        allergens: listingData.allergens || [],
        dietaryInfo: listingData.dietaryInfo || [],
        images: listingData.images && listingData.images.length > 0
          ? listingData.images.map(img => (typeof img === 'string' ? { url: img } : img))
          : [{ url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80' }],
        address: {
          street: listingData.address || 'Commercial Road',
          city: listingData.city || 'Mumbai',
          state: listingData.state || 'Maharashtra',
          postalCode: '400050'
        },
        location: {
          type: 'Point',
          coordinates: [listingData.lng || 72.8295, listingData.lat || 19.0596]
        },
        requiresVolunteer: Boolean(listingData.requiresVolunteer)
      });

      if (res?.data?.listing) {
        setListings(prev => [res.data.listing, ...prev]);
        return res.data.listing;
      }
    } catch (err) {
      console.error('[DataContext] addListing error:', err);
      throw err;
    }
  };

  // 2. Delete Food Listing
  const deleteListing = async (id) => {
    try {
      await api.deleteListing(id);
      setListings(prev => prev.filter(l => (l._id || l.id) !== id));
    } catch (err) {
      console.error('[DataContext] deleteListing error:', err);
      throw err;
    }
  };

  // 3. Create Reservation
  const createReservation = async ({ listingId, quantityReserved, notes }) => {
    try {
      const idempotencyKey = `req_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      const res = await api.createReservation(
        {
          listingId,
          quantityReserved: Number(quantityReserved),
          recipientNotes: notes || ''
        },
        idempotencyKey
      );

      if (res?.data?.reservation) {
        setReservations(prev => [res.data.reservation, ...prev]);
        // Refresh listings to update remaining inventory
        await refreshPublicData();
        return res.data.reservation;
      }
    } catch (err) {
      console.error('[DataContext] createReservation error:', err);
      throw err;
    }
  };

  // 4. Approve Inbound Claim
  const approveReservation = async (reservationId, donorNotes = '') => {
    try {
      const res = await api.approveReservation(reservationId, donorNotes);
      if (res?.data?.reservation) {
        setReservations(prev => prev.map(r => (r._id || r.id) === reservationId ? res.data.reservation : r));
        await refreshUserData();
        return res.data.reservation;
      }
    } catch (err) {
      console.error('[DataContext] approveReservation error:', err);
      throw err;
    }
  };

  // 5. Cancel or Reject Reservation
  const cancelOrRejectReservation = async (reservationId, isRejection = false, reason = '') => {
    try {
      let res;
      if (isRejection) {
        res = await api.rejectReservation(reservationId, reason);
      } else {
        res = await api.cancelReservation(reservationId, reason);
      }

      if (res?.data?.reservation) {
        setReservations(prev => prev.map(r => (r._id || r.id) === reservationId ? res.data.reservation : r));
        await refreshPublicData();
        return res.data.reservation;
      }
    } catch (err) {
      console.error('[DataContext] cancelOrRejectReservation error:', err);
      throw err;
    }
  };

  // 6. Volunteer Claims Task
  const claimTask = async (taskId) => {
    try {
      const res = await api.claimTask(taskId);
      if (res?.data?.task) {
        setTasks(prev => prev.map(t => (t._id || t.id) === taskId ? res.data.task : t));
        return res.data.task;
      }
    } catch (err) {
      console.error('[DataContext] claimTask error:', err);
      throw err;
    }
  };

  // 7. Advance Task State (Pickup / Delivery Verification)
  const advanceTaskState = async (taskId, newStatus, verificationCode = '', extra = {}) => {
    try {
      const res = await api.updateTaskStatus(taskId, newStatus, verificationCode, extra);
      if (res?.data?.task) {
        setTasks(prev => prev.map(t => (t._id || t.id) === taskId ? res.data.task : t));
        // Refresh analytics and reservations upon completion
        if (newStatus === 'delivered') {
          await Promise.all([refreshPublicData(), refreshUserData()]);
        }
        return res.data.task;
      }
    } catch (err) {
      console.error('[DataContext] advanceTaskState error:', err);
      throw err;
    }
  };

  // 8. Submit Incident Report
  const submitReport = async (reportData) => {
    try {
      const res = await api.submitReport(reportData);
      if (res?.data?.report) {
        setReports(prev => [res.data.report, ...prev]);
        return res.data.report;
      }
    } catch (err) {
      console.error('[DataContext] submitReport error:', err);
      throw err;
    }
  };

  // 9. Resolve Report (Admin)
  const resolveReport = async (reportId, status, adminNotes) => {
    try {
      const res = await api.resolveReport(reportId, status, adminNotes);
      if (res?.data?.report) {
        setReports(prev => prev.map(r => (r._id || r.id) === reportId ? res.data.report : r));
        return res.data.report;
      }
    } catch (err) {
      console.error('[DataContext] resolveReport error:', err);
      throw err;
    }
  };

  // 10. Organization Verification
  const verifyOrganization = async (orgId, status, reviewNotes) => {
    try {
      const res = await api.reviewOrgVerification(orgId, status, reviewNotes);
      if (res?.data?.organization) {
        setOrganizations(prev => prev.map(o => (o._id || o.id) === orgId ? res.data.organization : o));
        return res.data.organization;
      }
    } catch (err) {
      console.error('[DataContext] verifyOrganization error:', err);
      throw err;
    }
  };

  // Notification helpers
  const markNotificationRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <DataContext.Provider
      value={{
        listings,
        reservations,
        tasks,
        organizations,
        reports,
        auditLogs,
        impactMetrics,
        notifications,
        loading,
        refreshPublicData,
        refreshUserData,
        addListing,
        deleteListing,
        createReservation,
        approveReservation,
        cancelOrRejectReservation,
        claimTask,
        advanceTaskState,
        submitReport,
        resolveReport,
        verifyOrganization,
        markNotificationRead,
        markAllNotificationsRead
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
