import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { createTicket } from '../services/bookingService';
import logger from '../utils/logger';
import api, { 
  searchBuses as searchBusesApi
} from '../services/api';
import { formatJourneyDate, validateBookingData, formatSeatNumbers } from '../utils/dateUtils';

// Action types
export const ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_SEARCH_PARAMS: 'SET_SEARCH_PARAMS',
  SET_AVAILABLE_BUSES: 'SET_AVAILABLE_BUSES',
  SELECT_BUS: 'SELECT_BUS',
  SET_SELECTED_SEATS: 'SET_SELECTED_SEATS',
  SET_PASSENGERS: 'SET_PASSENGERS',
  CONFIRM_BOOKING: 'CONFIRM_BOOKING',
  SET_BOOKINGS: 'SET_BOOKINGS',
  ADD_BOOKING: 'ADD_BOOKING',
  SET_BOOKING_DETAILS: 'SET_BOOKING_DETAILS',
  SET_CURRENT_STEP: 'SET_CURRENT_STEP',
  SET_BOOKINGS_LOADING: 'SET_BOOKINGS_LOADING',
  SET_BOOKINGS_ERROR: 'SET_BOOKINGS_ERROR',
  RESET_BOOKING: 'RESET_BOOKING',
};

const BusBookingContext = createContext();

const initialState = {
  // Search Parameters
  searchParams: {
    source: '',
    destination: '',
    journeyDate: null,
  },
  
  // Available Routes
  routes: {
    sources: [],
    destinations: []
  },
  
  // Booking Process State
  currentStep: 1, // 1: Search, 2: Select Bus, 3: Passenger Details, 4: Confirmation
  
  // Bus Selection
  availableBuses: [],
  selectedBus: null,
  selectedSeats: [],
  
  // Passenger Information
  passengers: [
    { name: '', age: '', gender: 'MALE', phoneNumber: '' }
  ],
  
  // Booking Details
  bookingDetails: null,
  bookings: [],
  
  // UI State
  loading: false,
  error: null,
  routesLoading: false,
  routesError: null,
  bookingsLoading: false,
  bookingsError: null
};

function bookingReducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
      
    case 'SET_ERROR':
      return { ...state, error: action.payload };

    case 'SET_ROUTES_LOADING':
      return { ...state, routesLoading: action.payload };

    case 'SET_ROUTES_ERROR':
      return { ...state, routesError: action.payload };

    case 'SET_ROUTES':
      return { 
        ...state, 
        routes: {
          sources: action.payload.sources || [],
          destinations: action.payload.destinations || []
        },
        routesLoading: false
      };
      
    case 'SET_SEARCH_PARAMS':
      return { ...state, searchParams: { ...state.searchParams, ...action.payload } };
      
    case 'SET_AVAILABLE_BUSES':
      return { ...state, availableBuses: action.payload };
      
    case 'SET_SELECTED_BUS':
      return { ...state, selectedBus: action.payload };
      
    case 'SET_SELECTED_SEATS':
      return {
        ...state,
        selectedSeats: action.payload.seats,
        currentStep: action.payload.step !== undefined ? action.payload.step : state.currentStep,
      };
      
    case ACTIONS.SET_PASSENGERS:
      return { ...state, passengers: action.payload };
      
    case ACTIONS.SET_BOOKING_DETAILS:
      return { ...state, bookingDetails: action.payload };
      
    case ACTIONS.SET_BOOKINGS_LOADING:
      return { ...state, bookingsLoading: action.payload };
      
    case ACTIONS.SET_BOOKINGS_ERROR:
      return { ...state, bookingsError: action.payload };
      
    case ACTIONS.SET_BOOKINGS:
      return { ...state, bookings: action.payload };
      
    case ACTIONS.SET_CURRENT_STEP:
      return { ...state, currentStep: action.payload };
      
    case ACTIONS.RESET_BOOKING:
      return {
        ...state,
        selectedBus: null,
        bookingDetails: null,
        currentStep: 1
      };
      
    default:
      return state;
  }
}

export const BusBookingProvider = ({ children }) => {
  const [state, dispatch] = useReducer(bookingReducer, initialState);
  const { user } = useAuth();

  // Cache for routes data
  const routesCache = React.useRef({
    data: null,
    timestamp: 0,
    loading: false,
    error: null
  });

  // Cache TTL (5 minutes)
  const CACHE_TTL = 5 * 60 * 1000;

  // Fetch available routes with caching
  const fetchRoutes = useCallback(async (forceRefresh = false) => {
    const now = Date.now();
    const cached = routesCache.current;
    
    // Return cached data if it's still valid and not forcing refresh
    if (!forceRefresh && cached.data && now - cached.timestamp < CACHE_TTL) {
      if (process.env.NODE_ENV === 'development') {
        //console.log('[BusBooking] Using cached routes data');
      }
      return cached.data;
    }
    
    // If already loading, return the current promise
    if (cached.loading) {
      if (process.env.NODE_ENV === 'development') {
        //console.log('[BusBooking] Routes fetch already in progress');
      }
      return cached.promise;
    }
    
    try {
      cached.loading = true;
      dispatch({ type: 'SET_ROUTES_LOADING', payload: true });
      
      if (process.env.NODE_ENV === 'development') {
        //console.log('[BusBooking] Fetching routes from API');
      }
      
      // Create a promise and store it in the cache
      cached.promise = (async () => {
        try {
          const response = await api.get('/buses/routes');
          
          if (response.data) {
            const routesData = response.data.data || response.data;
            
            // Update the cache
            cached.data = routesData;
            cached.timestamp = Date.now();
            cached.error = null;
            
            // Update the state
            dispatch({ 
              type: 'SET_ROUTES', 
              payload: {
                sources: routesData.sources || [],
                destinations: routesData.destinations || []
              } 
            });
          }
          
          return cached.data;
        } catch (error) {
          cached.error = error;
          
          if (process.env.NODE_ENV === 'development') {
            console.error('[BusBooking] Error in fetchRoutes:', {
              message: error.message,
              status: error.response?.status,
              url: error.config?.url
            });
          }
          
          const errorMessage = error.response?.data?.message || 'Failed to load routes';
          dispatch({ type: 'SET_ROUTES_ERROR', payload: errorMessage });
          throw error;
        } finally {
          cached.loading = false;
          delete cached.promise;
          dispatch({ type: 'SET_ROUTES_LOADING', payload: false });
        }
      })();
      
      return await cached.promise;
    } catch (error) {
      // This catch is for errors in setting up the promise
      cached.loading = false;
      dispatch({ type: 'SET_ROUTES_LOADING', payload: false });
      throw error;
    }
  }, [dispatch, CACHE_TTL]);

  // Load routes on component mount with debounce
  useEffect(() => {
    let isMounted = true;
    let timeoutId;
    
    const loadInitialData = async () => {
      try {
        await fetchRoutes();
      } catch (error) {
        if (isMounted && process.env.NODE_ENV === 'development') {
          console.error('[BusBooking] Failed to load initial data:', error.message);
        }
      }
    };
    
    // Add a small delay to prevent rapid successive calls
    timeoutId = setTimeout(loadInitialData, 100);
    
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [fetchRoutes]);
  
  // Memoize the fetchBookings function with useCallback
  const fetchBookings = useCallback(async (phoneNumber) => {
    if (!phoneNumber?.trim()) {
      dispatch({ type: 'SET_BOOKINGS', payload: [] });
      return [];
    }
    
    try {
      dispatch({ type: 'SET_BOOKINGS_LOADING', payload: true });
      
      // Clean and format the phone number
      const cleanPhone = phoneNumber.replace(/\D/g, '');
      const formattedPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
      
      // Don't log the phone number
      logger.debug('Fetching user bookings');
      
      // Use the api instance directly
      const response = await api.get(`/tickets/my-bookings?phoneNumber=${formattedPhone}`);
      
      const bookingsData = Array.isArray(response.data) 
        ? response.data 
        : response.data?.data || [];
        
      dispatch({ type: 'SET_BOOKINGS', payload: bookingsData });
      return bookingsData;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch bookings';
      dispatch({ type: 'SET_BOOKINGS_ERROR', payload: errorMessage });
      throw error;
    } finally {
      dispatch({ type: 'SET_BOOKINGS_LOADING', payload: false });
    }
  }, []);
  
  // Fetch bookings when user changes
  useEffect(() => {
    // Skip if no phone number or if we're already loading
    if (!user?.phoneNumber) {
      dispatch({ type: 'SET_BOOKINGS', payload: [] });
      return;
    }
    
    const controller = new AbortController();
    const { signal } = controller;
    
    const loadBookings = async () => {
      try {
        await fetchBookings(user.phoneNumber);
      } catch (error) {
        if (error.name !== 'AbortError' && process.env.NODE_ENV === 'development') {
          console.error('Error in loadBookings:', error);
        }
      }
    };
    
    // Add a small delay to prevent rapid successive calls
    const timer = setTimeout(() => {
      if (!signal.aborted) {
        loadBookings();
      }
    }, 100);
    
    // Cleanup function
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [user?.phoneNumber, fetchBookings]);
  
  // Search for buses based on criteria
  const searchBuses = useCallback(async (searchParams) => {
    // Check for required parameters, accepting both 'date' and 'journeyDate' as valid date parameters
    const dateValue = searchParams?.date || searchParams?.journeyDate;
    if (!searchParams?.source || !searchParams?.destination || !dateValue) {
      throw new Error('Source, destination, and date are required');
    }
    
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      // Prepare the search payload with only the expected fields
      const searchPayload = {
        source: searchParams.source,
        destination: searchParams.destination,
        journeyDate: dateValue // Use the date value (could be from date or journeyDate)
        // Removed 'seats' parameter as it's not expected by the backend
      };
      
      // Log the search parameters for debugging
      if (process.env.NODE_ENV === 'development') {
        //console.log('[BusBookingContext] Searching buses with params:', searchPayload);
      }
      
      const response = await searchBusesApi(searchPayload);
      
      // Handle different response formats
      const buses = Array.isArray(response?.data) ? response.data : 
                   response?.data?.data ? response.data.data : [];
      
      if (process.env.NODE_ENV === 'development') {
        //console.log(`[BusBookingContext] Found ${buses.length} buses`);
      }
      
      // Update search params in state
      dispatch({ 
        type: 'SET_SEARCH_PARAMS', 
        payload: {
          source: searchParams.source,
          destination: searchParams.destination,
          date: dateValue
        } 
      });
      
      dispatch({ type: 'SET_AVAILABLE_BUSES', payload: buses });
      return buses;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to search buses';
      //console.error('[BusBookingContext] Search buses error:', errorMessage, error);
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw new Error(errorMessage);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);
  
  // Select a bus
  const selectBus = useCallback((bus) => {
    if (!bus?.busNumber) {
      //console.error('No bus number in selectBus:', bus);
      return Promise.reject(new Error('Invalid bus data'));
    }
    
    //console.log('Selecting bus:', bus.busNumber);
    dispatch({ type: 'SET_SELECTED_BUS', payload: bus });
    return Promise.resolve(bus);
  }, []);
  
  // Select seats and optionally update the current step
  const selectSeats = useCallback(async (seats, step) => {
    dispatch({ 
      type: 'SET_SELECTED_SEATS', 
      payload: { seats, step } 
    });
  }, []);
  
  // Update passenger details
  const updatePassengerDetails = useCallback((passengers) => {
    if (!Array.isArray(passengers)) {
      //console.error('Expected passengers to be an array, got:', passengers);
      return Promise.reject(new Error('Invalid passengers data'));
    }
    
    //console.log('Updating passenger details:', passengers);
    dispatch({ type: 'SET_PASSENGERS', payload: passengers });
    return Promise.resolve(passengers);
  }, []);
  
  // Track if a booking is in progress to prevent duplicate submissions
  const isBookingInProgress = useRef(false);

  // Create booking API call - This is the ONLY place where createTicket should be called
  const createBookingApi = useCallback(async (bookingData) => {
    if (isBookingInProgress.current) {
      //console.log('[Booking] Booking already in progress, ignoring duplicate request');
      return;
    }

    isBookingInProgress.current = true;
    
    try {
      //console.log('[Booking] Processing booking request:', bookingData);
      
      if (!bookingData) {
        throw new Error('No booking data provided');
      }
      
      // Get the bus number from either direct property or nested bus object
      const busNumber = bookingData.busNumber || (bookingData.bus?.busNumber || state.selectedBus?.busNumber);
      if (!busNumber) {
        throw new Error('Bus number is required');
      }

      // Get the current user's phone number
      const userPhone = state.user?.phone || '';
      
      // Format the request payload according to backend DTO
      const requestData = {
        profileUserPhone: userPhone,
        busNumber: busNumber,
        journeyDate: bookingData.journeyDate || state.journeyDate,
        source: (bookingData.source || state.source || '').trim(),
        destination: (bookingData.destination || state.destination || '').trim(),
        passengers: (bookingData.passengers || state.passengers || []).map(passenger => ({
          seatNumber: passenger.seatNumber || passenger.seat,
          passengerName: passenger.name || passenger.passengerName || 'Passenger',
          age: passenger.age || '',
          gender: (passenger.gender || 'MALE').toUpperCase(),
          phoneNumber: passenger.phoneNumber || passenger.phone || userPhone || ''
        })),
        totalFare: bookingData.totalFare || 0
      };
      
      // Validate required fields
      if (!requestData.journeyDate || !requestData.source || !requestData.destination) {
        throw new Error('Missing required booking information');
      }
      
      if (!requestData.passengers || requestData.passengers.length === 0) {
        throw new Error('At least one passenger is required');
      }
      
      //console.log('[Booking] Sending booking to server:', requestData);
      
      // Make the API call to create the booking
      const response = await createTicket(requestData);
      
      if (!response || !response.data) {
        throw new Error('Invalid response from server');
      }
      
      //console.log('[Booking] Booking created successfully:', response.data);
      
      // Create the booking object for our state
      const newBooking = {
        id: response.data.bookingId || `booking-${Date.now()}`,
        pnr: response.data.pnr || `PNR${Math.floor(100000 + Math.random() * 900000)}`,
        bus: state.selectedBus || bookingData.bus,
        journeyDate: requestData.journeyDate,
        source: requestData.source,
        destination: requestData.destination,
        passengers: requestData.passengers,
        totalFare: requestData.totalFare,
        bookingDate: new Date().toISOString(),
        status: 'CONFIRMED',
        seats: requestData.passengers.map(p => p.seatNumber)
      };
      
      // Update the state with the new booking
      dispatch({ 
        type: ACTIONS.ADD_BOOKING, 
        payload: newBooking 
      });
      
      // Clear selected seats
      dispatch({ 
        type: ACTIONS.SET_SELECTED_SEATS, 
        payload: { seats: [], step: 3 } 
      });
      
      return newBooking;
      
    } catch (error) {
      console.error('[Booking] Error creating booking:', error);
      
      // Handle specific error cases with more user-friendly messages
      if (error.response) {
        if (error.response.status === 409) {
          error.message = error.response.data?.message || 'One or more seats are no longer available. Please select different seats.';
          
          // If seats are already booked, update the seat status in our state
          if (error.response.data?.unavailableSeats?.length) {
            // Update the seat status in the bus details
            // This will trigger a re-render with updated seat status
            const updatedBus = {
              ...state.selectedBus,
              seats: state.selectedBus?.seats?.map(seat => 
                error.response.data.unavailableSeats.includes(seat.seatNumber)
                  ? { ...seat, status: 'BOOKED' }
                  : seat
              )
            };
            dispatch({ type: ACTIONS.SELECT_BUS, payload: updatedBus });
          }
          
        } else if (error.response.status === 400) {
          error.message = error.response.data?.message || 'Invalid booking data. Please check your details and try again.';
        } else if (error.response.status === 404) {
          error.message = 'Bus not found. Please try selecting a different bus.';
        } else if (error.response.status >= 500) {
          error.message = 'Server error. Please try again later.';
        }
      } else if (error.request) {
        // The request was made but no response was received
        error.message = 'Unable to connect to the server. Please check your internet connection.';
      }
      
      throw error;
    } finally {
      // Always reset the booking in progress flag
      isBookingInProgress.current = false;
    }
  }, [state.user?.phone, state.selectedBus, state.journeyDate, state.source, state.destination, state.passengers]);
  
  // Track if a booking is in progress to prevent duplicate submissions

  // Confirm booking
  const confirmBooking = useCallback(async (bookingData) => {
    // Prevent multiple concurrent booking attempts
    if (isBookingInProgress.current) {
      //console.log('[Booking] Booking already in progress, ignoring duplicate request');
      return { status: 'already_in_progress', message: 'A booking is already in progress' };
    }

    isBookingInProgress.current = true;
    
    try {
      //console.log('[Booking] Starting booking confirmation');
      
      // Update booking status to PROCESSING
      dispatch({ type: ACTIONS.SET_BOOKING_STATUS, payload: 'PROCESSING' });
      
      // Create the booking payload with fallbacks to state
      const bookingPayload = {
        ...bookingData,
        busNumber: bookingData.busNumber || state.selectedBus?.busNumber,
        journeyDate: bookingData.journeyDate || state.journeyDate,
        source: bookingData.source || state.source,
        destination: bookingData.destination || state.destination,
        passengers: bookingData.passengers || state.passengers || []
      };

      //console.log('[Booking] Sending booking request:', bookingPayload);
      
      // Call the API to create the booking
      let response;
      try {
        response = await createBookingApi(bookingPayload);
      } catch (apiError) {
        console.error('[Booking] Error from createBookingApi:', apiError);
        throw apiError; // Re-throw to be caught by the outer catch
      }
      
      if (!response || !response.data) {
        console.error('[Booking] Invalid response from createBookingApi:', response);
        throw new Error('Invalid response from server. Please try again.');
      }
      
      //console.log('[Booking] Booking created successfully:', response.data);
      
      // Create the booking object from the response
      const newBooking = {
        id: response.data.bookingId || `booking-${Date.now()}`,
        pnr: response.data.pnr || `PNR${Math.floor(100000 + Math.random() * 900000)}`,
        bus: state.selectedBus || bookingData.bus,
        journeyDate: bookingPayload.journeyDate,
        source: bookingPayload.source,
        destination: bookingPayload.destination,
        passengers: bookingPayload.passengers,
        totalFare: bookingPayload.totalFare,
        bookingDate: new Date().toISOString(),
        status: 'CONFIRMED',
        seats: bookingPayload.passengers.map(p => p.seatNumber),
        ticketIds: response.data.ticketIds || [],
        ticketNumbers: response.data.ticketNumbers || []
      };

      // Update the state with the new booking
      dispatch({
        type: ACTIONS.SET_CURRENT_BOOKING,
        payload: newBooking
      });
      
      // Add to bookings list
      dispatch({
        type: ACTIONS.ADD_BOOKING,
        payload: newBooking
      });
      
      // Clear selected seats
      dispatch({
        type: ACTIONS.SET_SELECTED_SEATS,
        payload: { seats: [], step: 3 }
      });
      
      // Reset booking status
      dispatch({
        type: ACTIONS.SET_SELECTED_SEATS, 
        payload: { seats: [], step: 3 } 
      });
      
      // Return the booking data for the component to use
      return newBooking;
      
    } catch (error) {
      console.error('[Booking] Error confirming booking:', error);
      
      // Update booking status to FAILED
      dispatch({ 
        type: ACTIONS.SET_BOOKING_STATUS, 
        payload: 'FAILED' 
      });
      
      // Re-throw the error to be handled by the UI
      throw error;
    } finally {
      // Always reset the booking in progress flag
      isBookingInProgress.current = false;
    }
  }, [
    state.journeyDate, 
    state.source, 
    state.destination, 
    state.passengers,
    state.selectedBus,
    createBookingApi
  ]);
  

  // Fetch user's bookings
  const fetchMyBookings = useCallback(async (phoneNumber) => {
    // Skip if no phone number
    if (!phoneNumber) return;
    
    let didCancel = false;
    
    try {
      // Only set loading if we're not already loading
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Clean and format the phone number
      const cleanPhone = phoneNumber.replace(/\D/g, '');
      const formattedPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
      
      // Use the api instance directly
      const response = await api.get(`/tickets/my-bookings?phoneNumber=${formattedPhone}`);
      
      // Don't update state if the request was cancelled
      if (!didCancel) {
        const bookingsData = Array.isArray(response.data) 
          ? response.data 
          : response.data?.data || [];
        
        dispatch({ type: 'SET_BOOKINGS', payload: bookingsData });
        return bookingsData;
      }
    } catch (error) {
      if (!didCancel) {
        const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch bookings';
        console.error('Fetch bookings error:', errorMessage, error);
        dispatch({ 
          type: 'SET_ERROR', 
          payload: errorMessage
        });
      }
      throw error;
    } finally {
      if (!didCancel) {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    }
  }, []);
  
  // Fetch bookings when user changes
  useEffect(() => {
    let isMounted = true;
    
    const loadBookings = async () => {
      if (user?.phoneNumber) {
        try {
          await fetchMyBookings(user.phoneNumber);
        } catch (error) {
          if (isMounted) {
            console.error('Error loading bookings:', error);
          }
        }
      } else {
        // Clear bookings if user logs out
        dispatch({ type: 'SET_BOOKINGS', payload: [] });
      }
    };
    
    loadBookings();
    
    return () => {
      isMounted = false;
    };
  }, [user?.phoneNumber, fetchMyBookings]);

  // Setup cleanup on unmount
  useEffect(() => {
    return () => {
      // Any cleanup logic if needed when component unmounts
    };
  }, []);
  
  // Reset booking state
  const resetBooking = useCallback(() => {
    dispatch({ type: 'RESET_BOOKING' });
  }, []);

  // Create a new booking
  const createBooking = useCallback(async (bookingData) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Get the current user from context or local storage
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (!user.phoneNumber) {
        throw new Error('User phone number not found. Please log in again.');
      }

      // Validate booking data
      const validation = validateBookingData({
        ...bookingData,
        selectedSeats: bookingData.selectedSeats || state.selectedSeats
      });

      if (!validation.isValid) {
        throw new Error(validation.message);
      }

      // Format seat numbers
      const seatNumbers = formatSeatNumbers(bookingData.selectedSeats || state.selectedSeats);

      // Prepare the booking request payload with exact field names and structure
      const bookingRequest = {
        profileUserPhone: user.phoneNumber,
        busNumber: state.selectedBus?.busNumber,
        journeyDate: formatJourneyDate(bookingData.journeyDate || new Date().toISOString()),
        source: (bookingData.source || state.selectedBus?.source || '').trim(),
        destination: (bookingData.destination || state.selectedBus?.destination || '').trim(),
        seatNumbers: seatNumbers,
        passengers: (bookingData.passengers || state.passengers || []).map(passenger => ({
          name: (passenger.passengerName || passenger.name || '').trim(),
          age: parseInt(passenger.age, 10) || 0,
          gender: (passenger.gender || 'MALE').toUpperCase(),
          phoneNumber: passenger.phoneNumber || passenger.phone || ''
        }))
      };

      //console.log('Sending booking request:', bookingRequest);

      // Make the API call
      const response = await fetch('http://localhost:8080/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${user.token || ''}`
        },
        body: JSON.stringify(bookingRequest)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const responseData = await response.json();
      //console.log('Booking response:', responseData);
      
      // Update the state with the new booking
      dispatch({ 
        type: 'SET_BOOKING_DETAILS', 
        payload: responseData 
      });
      
      // Reset selections after successful booking
      dispatch({ type: 'RESET_BOOKING' });
      
      return responseData;
    } catch (error) {
      console.error('[BusBookingContext] Error in bookSelectedSeats:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        stack: error.stack
      });
      
      let errorMessage = error.response?.data?.message || error.message || 'Failed to book seats';
      
      // Provide more specific error messages
      if (error.response?.status === 400) {
        errorMessage = 'Invalid booking data. Please check your information and try again.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Session expired. Please log in again.';
      } else if (error.response?.status === 409) {
        errorMessage = 'One or more seats are no longer available. Please select different seats.';
      }
      
      dispatch({ 
        type: 'SET_ERROR', 
        payload: errorMessage 
      });
      
      // Create a new error with the enhanced message
      const apiError = new Error(errorMessage);
      apiError.status = error.response?.status || 500;
      apiError.response = error.response?.data;
      throw apiError;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [
    state.selectedBus,
    state.passengers,
    state.selectedSeats
  ]);

  // Memoize the context value to prevent unnecessary renders
  const contextValue = React.useMemo(() => ({
    // State
    ...state,
    
    // Actions
    fetchRoutes,
    searchBuses,
    selectBus,
    selectSeats,
    updatePassengerDetails,
    confirmBooking,
    createBooking,
    resetBooking,
    fetchBookings,
    clearError: () => dispatch({ type: 'SET_ERROR', payload: null }),
    // Alias for fetchBookings for backward compatibility
    fetchUserBookings: fetchBookings,
    // Alias for dispatch SET_ERROR action
    setError: (error) => dispatch({ type: 'SET_ERROR', payload: error })
  }), [
    state,
    fetchRoutes,
    searchBuses,
    selectBus,
    selectSeats,
    updatePassengerDetails,
    confirmBooking,
    createBooking,
    resetBooking,
    fetchBookings
  ]);

  return (
    <BusBookingContext.Provider value={contextValue}>
      {children}
    </BusBookingContext.Provider>
  );
};

// ...
const useBusBookingSafe = () => {
  // Call useContext at the top level
  const context = useContext(BusBookingContext);
  
  // Log the component stack for debugging
  const componentStack = React.useMemo(() => {
    try {
      return new Error().stack;
    } catch (e) {
      return '';
    }
  }, []);
  
  // Handle the case when used outside provider
  if (!context) {
    const errorMsg = 'useBusBooking must be used within a BusBookingProvider';
    console.warn(errorMsg, { componentStack });
    
    // Return a mock implementation if used outside provider
    return {
      loading: false,
      error: errorMsg,
      searchParams: { source: '', destination: '', journeyDate: null },
      availableBuses: [],
      selectedBus: null,
      seatDetails: [],
      selectedSeats: [],
      searchBuses: () => console.warn('searchBuses called outside provider'),
      selectBus: () => console.warn('selectBus called outside provider'),
      selectSeats: () => console.warn('selectSeats called outside provider'),
      bookSelectedSeats: async () => {
        console.warn('bookSelectedSeats called outside provider');
        return { success: false, message: 'Not in a valid context' };
      },
      updatePassenger: () => console.warn('updatePassenger called outside provider'),
      addPassenger: () => console.warn('addPassenger called outside provider'),
      removePassenger: () => console.warn('removePassenger called outside provider'),
      setCurrentStep: () => console.warn('setCurrentStep called outside provider'),
      clearError: () => {},
      clearSelections: () => {}
    };
  }
  
  return context;
};

// Export the hook as both useBusBooking and useBusBookingContext for backward compatibility
export const useBusBooking = () => {
  const context = useBusBookingSafe();
  
  // Memoize the wrapped context to prevent recreating it on every render
  return React.useMemo(() => {
    // In production, just return the context directly
    if (process.env.NODE_ENV !== 'development') {
      return context;
    }
    
    // In development, wrap functions with logging
    const wrappedContext = {};
    
    // Wrap all functions with logging
    Object.entries(context).forEach(([key, value]) => {
      if (typeof value === 'function') {
        wrappedContext[key] = (...args) => {
          console.debug(`[useBusBooking] ${key} called with:`, ...args);
          try {
            const result = value.apply(context, args);
            if (result && typeof result.then === 'function') {
              return result.catch(error => {
                console.error(`[useBusBooking] Error in ${key}:`, error);
                throw error;
              });
            }
            return result;
          } catch (error) {
            console.error(`[useBusBooking] Error in ${key}:`, error);
            throw error;
          }
        };
      } else {
        wrappedContext[key] = value;
      }
    });
    
    return wrappedContext;
  }, [context]); // Only recreate when context changes
};

// For backward compatibility
export const useBusBookingContext = useBusBooking;

export default BusBookingContext;
