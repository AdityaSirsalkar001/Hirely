/** Redux-backed access to hiring workflow state and API actions. */
import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  clearHiringError, fetchManagerOpenings, fetchOpeningProfiles, fetchVendorOpenings,
  createManagerOpening, deleteManagerOpening, resetHiring, reviewProfile, selectHiringError, selectHiringLoading,
} from "@/redux/features/Hiring/hiringSlice";

export default function useHiring() {
  const dispatch = useDispatch();
  const isLoading = useSelector(selectHiringLoading);
  const error = useSelector(selectHiringError);
  const vendorOpenings = useSelector((state) => state.hiring.vendorOpenings);
  const vendorOpeningsPagination = useSelector((state) => state.hiring.vendorOpeningsPagination);
  const managerOpenings = useSelector((state) => state.hiring.managerOpenings);
  const managerOpeningsPagination = useSelector((state) => state.hiring.managerOpeningsPagination);
  const profilesByOpening = useSelector((state) => state.hiring.profilesByOpening);
  const profilesPaginationByOpening = useSelector((state) => state.hiring.profilesPaginationByOpening);
  const isSubmitting = useSelector((state) => state.hiring.isSubmitting);

  const loadVendorOpenings = useCallback((page = 1, limit = 20) =>
    dispatch(fetchVendorOpenings({ page, limit })), [dispatch]);
  const loadManagerOpenings = useCallback((page = 1, limit = 20) =>
    dispatch(fetchManagerOpenings({ page, limit })), [dispatch]);
  const loadProfiles = useCallback((openingId, page = 1, limit = 20) =>
    dispatch(fetchOpeningProfiles({ openingId, page, limit })), [dispatch]);
  const handleReview = useCallback((profileId, decision) => dispatch(reviewProfile({ profileId, decision })), [dispatch]);
  const handleCreateOpening = useCallback((opening) => dispatch(createManagerOpening(opening)), [dispatch]);
  const handleDeleteOpening = useCallback((openingId) => dispatch(deleteManagerOpening(openingId)), [dispatch]);
  const handleClearError = useCallback(() => dispatch(clearHiringError()), [dispatch]);
  const handleResetHiring = useCallback(() => { dispatch(resetHiring()); }, [dispatch]);

  return { vendorOpenings, vendorOpeningsPagination, managerOpenings, managerOpeningsPagination,
    profilesByOpening, profilesPaginationByOpening, isLoading, isSubmitting, error,
    loadVendorOpenings, loadManagerOpenings, loadProfiles, handleReview, handleCreateOpening, handleDeleteOpening, handleClearError, handleResetHiring };
}
