/** Redux-backed access to hiring workflow state and API actions. */
import { useCallback, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  clearHiringError, fetchManagerOpenings, fetchOpeningProfiles, fetchVendorOpenings,
  createManagerOpening, resetHiring, reviewProfile, selectHiringError, selectHiringLoading,
} from "@/redux/features/Hiring/hiringSlice";

export default function useHiring() {
  const dispatch = useDispatch();
  const fetched = useRef({ vendor: false, manager: false });
  const isLoading = useSelector(selectHiringLoading);
  const error = useSelector(selectHiringError);
  const vendorOpenings = useSelector((state) => state.hiring.vendorOpenings);
  const managerOpenings = useSelector((state) => state.hiring.managerOpenings);
  const profilesByOpening = useSelector((state) => state.hiring.profilesByOpening);
  const isSubmitting = useSelector((state) => state.hiring.isSubmitting);

  const loadVendorOpenings = useCallback(async (forceRefresh = false) => {
    if (fetched.current.vendor && !forceRefresh) return;
    try { await dispatch(fetchVendorOpenings()).unwrap(); fetched.current.vendor = true; } catch {}
  }, [dispatch]);
  const loadManagerOpenings = useCallback(async (forceRefresh = false) => {
    if (fetched.current.manager && !forceRefresh) return;
    try { await dispatch(fetchManagerOpenings()).unwrap(); fetched.current.manager = true; } catch {}
  }, [dispatch]);
  const loadProfiles = useCallback((openingId) => dispatch(fetchOpeningProfiles(openingId)), [dispatch]);
  const handleReview = useCallback((profileId, decision) => dispatch(reviewProfile({ profileId, decision })), [dispatch]);
  const handleCreateOpening = useCallback((opening) => dispatch(createManagerOpening(opening)), [dispatch]);
  const handleClearError = useCallback(() => dispatch(clearHiringError()), [dispatch]);
  const handleResetHiring = useCallback(() => { fetched.current = { vendor: false, manager: false }; dispatch(resetHiring()); }, [dispatch]);

  return { vendorOpenings, managerOpenings, profilesByOpening, isLoading, isSubmitting, error,
    loadVendorOpenings, loadManagerOpenings, loadProfiles, handleReview, handleCreateOpening, handleClearError, handleResetHiring };
}
