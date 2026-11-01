/** Redux state and API operations for vendor openings and manager reviews. */
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/Axios/AxiosInstance";

const message = (error, fallback) => error.response?.data?.message || error.message || fallback;

export const fetchVendorOpenings = createAsyncThunk("hiring/fetchVendorOpenings", async ({ page = 1, limit = 20 } = {}, { rejectWithValue }) => {
  try { return (await axiosInstance.get("/vendor/openings", { params: { page, limit } })).data; }
  catch (error) { return rejectWithValue(message(error, "Could not load openings")); }
});

export const fetchManagerOpenings = createAsyncThunk("hiring/fetchManagerOpenings", async ({ page = 1, limit = 20 } = {}, { rejectWithValue }) => {
  try { return (await axiosInstance.get("/hiring-manager/openings", { params: { page, limit } })).data; }
  catch (error) { return rejectWithValue(message(error, "Could not load hiring openings")); }
});

export const createManagerOpening = createAsyncThunk("hiring/createManagerOpening", async (opening, { rejectWithValue }) => {
  try { return (await axiosInstance.post("/hiring-manager/openings", opening)).data; }
  catch (error) { return rejectWithValue(message(error, "Could not create the opening")); }
});

export const deleteManagerOpening = createAsyncThunk("hiring/deleteManagerOpening", async (openingId, { rejectWithValue }) => {
  try {
    await axiosInstance.delete(`/hiring-manager/openings/${encodeURIComponent(openingId)}`);
    return openingId;
  } catch (error) { return rejectWithValue(message(error, "Could not delete this opening")); }
});

export const fetchOpeningProfiles = createAsyncThunk("hiring/fetchOpeningProfiles", async ({ openingId, page = 1, limit = 20 }, { rejectWithValue }) => {
  try { return { openingId, page, ...(await axiosInstance.get(`/hiring-manager/openings/${encodeURIComponent(openingId)}/profiles`, { params: { page, limit } })).data }; }
  catch (error) { return rejectWithValue(message(error, "Could not load submitted profiles")); }
});

export const reviewProfile = createAsyncThunk("hiring/reviewProfile", async ({ profileId, decision }, { rejectWithValue }) => {
  try {
    await axiosInstance.post(`/hiring-manager/profiles/${profileId}/${decision}`);
    return { profileId, decision };
  } catch (error) { return rejectWithValue(message(error, "Could not update this profile")); }
});

const initialState = {
  vendorOpenings: [],
  vendorOpeningsPagination: null,
  managerOpenings: [],
  managerOpeningsPagination: null,
  profilesByOpening: {},
  profilesPaginationByOpening: {},
  isLoading: false,
  isSubmitting: false,
  error: null,
};
const hiringSlice = createSlice({
  name: "hiring", initialState,
  reducers: {
    clearHiringError: (state) => { state.error = null; },
    resetHiring: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchVendorOpenings.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(fetchVendorOpenings.fulfilled, (state, action) => { state.isLoading = false; state.vendorOpenings = action.payload.data || []; state.vendorOpeningsPagination = action.payload.pagination || null; })
      .addCase(fetchVendorOpenings.rejected, (state, action) => { state.isLoading = false; state.error = action.payload; })
      .addCase(fetchManagerOpenings.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(fetchManagerOpenings.fulfilled, (state, action) => { state.isLoading = false; state.managerOpenings = action.payload.data || []; state.managerOpeningsPagination = action.payload.pagination || null; })
      .addCase(fetchManagerOpenings.rejected, (state, action) => { state.isLoading = false; state.error = action.payload; })
      .addCase(createManagerOpening.pending, (state) => { state.isSubmitting = true; state.error = null; })
      .addCase(createManagerOpening.fulfilled, (state, action) => {
        state.isSubmitting = false;
        const created = action.payload.data;
        state.managerOpenings.unshift(created);
      })
      .addCase(createManagerOpening.rejected, (state, action) => { state.isSubmitting = false; state.error = action.payload; })
      .addCase(deleteManagerOpening.pending, (state) => { state.isSubmitting = true; state.error = null; })
      .addCase(deleteManagerOpening.fulfilled, (state, action) => {
        state.isSubmitting = false;
        state.managerOpenings = state.managerOpenings.filter((opening) => opening.id !== action.payload);
        const profileKeyPrefix = `${action.payload}:`;
        Object.keys(state.profilesByOpening).forEach((key) => {
          if (key.startsWith(profileKeyPrefix)) delete state.profilesByOpening[key];
        });
        Object.keys(state.profilesPaginationByOpening).forEach((key) => {
          if (key.startsWith(profileKeyPrefix)) delete state.profilesPaginationByOpening[key];
        });
      })
      .addCase(deleteManagerOpening.rejected, (state, action) => { state.isSubmitting = false; state.error = action.payload; })
      .addCase(fetchOpeningProfiles.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(fetchOpeningProfiles.fulfilled, (state, action) => {
        state.isLoading = false;
        const key = `${action.payload.openingId}:${action.payload.page}`;
        state.profilesByOpening[key] = action.payload.data || [];
        state.profilesPaginationByOpening[key] = action.payload.pagination || null;
      })
      .addCase(fetchOpeningProfiles.rejected, (state, action) => { state.isLoading = false; state.error = action.payload; })
      .addCase(reviewProfile.pending, (state) => { state.isSubmitting = true; state.error = null; })
      .addCase(reviewProfile.fulfilled, (state, action) => {
        state.isSubmitting = false;
        Object.values(state.profilesByOpening).forEach((profiles) => {
          const profile = profiles.find((item) => item.id === action.payload.profileId);
          if (profile) profile.status = action.payload.decision === "shortlist" ? "SHORTLISTED" : "REJECTED";
        });
      })
      .addCase(reviewProfile.rejected, (state, action) => { state.isSubmitting = false; state.error = action.payload; });
  },
});

export const { clearHiringError, resetHiring } = hiringSlice.actions;
export const selectHiringLoading = (state) => state.hiring.isLoading;
export const selectHiringError = (state) => state.hiring.error;
export default hiringSlice.reducer;
