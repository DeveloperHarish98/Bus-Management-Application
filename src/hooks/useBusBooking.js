import { useState, useCallback } from 'react';
import { userService } from '../services/userService';
import { busService } from '../services/busService';
import { createTicket } from '../services/bookingService';
import { formatJourneyDate, validateBookingData, formatSeatNumbers } from '../utils/dateUtils';

export const useBusBooking = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [routes, setRoutes] = useState({ sources: [], destinations: [] });
  const [availableBuses, setAvailableBuses] = useState([]);
  const [selectedBus, setSelectedBus] = useState(null);
  const [seatDetails, setSeatDetails] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [bookingDetails, setBookingDetails] = useState(null);

  // Fetch user data
  const loadUser = useCallback(async (userId = 1) => {
    try {
      setLoading(true);
      // Using userService to get user data
      const response = await userService.getCurrentUser();
      // Handle both response formats: direct object or response.data
      const userData = response?.data || response;
      setUser(userData);
      return userData;
    } catch (err) {
      setError('Failed to load user data');
      console.error('Error loading user:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch available routes
  const loadRoutes = useCallback(async () => {
    try {
      setLoading(true);
      const response = await busService.getAvailableRoutes();
      
      if (response && response.data) {
        const { sources = [], destinations = [] } = response.data;
        setRoutes({ 
          sources: [...new Set(sources.filter(Boolean))].sort(),
          destinations: [...new Set(destinations.filter(Boolean))].sort()
        });
        return { sources, destinations };
      }
      throw new Error('Invalid response format');
    } catch (err) {
      setError('Failed to load routes');
      console.error('Error loading routes:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Search for buses
  const searchAvailableBuses = useCallback(async (searchParams) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await busService.busFindWithFilteration({
        source: searchParams.source,
        destination: searchParams.destination,
        journeyDate: searchParams.journeyDate
      });
      
      const buses = Array.isArray(response?.data) ? response.data : [];
      
      const processedBuses = buses.map(bus => ({
        ...bus,
        availableSeats: typeof bus.availableSeats === 'number' 
          ? bus.availableSeats 
          : (bus.totalSeats || 40) - (bus.bookedSeats || 0)
      }));
      
      setAvailableBuses(processedBuses);
      return processedBuses;
    } catch (err) {
      console.error('Error searching buses:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to search for buses';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch seat details for a specific bus
  const loadSeatDetails = useCallback(async (busNumber) => {
    try {
      setLoading(true);
      setSelectedSeats([]); // Reset selected seats when loading new bus
      const response = await busService.getSeatsByBusNumber(busNumber);
      setSeatDetails(response.data || []);
      return response.data || [];
    } catch (err) {
      setError('Failed to load seat details');
      console.error('Error loading seat details:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle seat selection
  const toggleSeatSelection = useCallback((seat) => {
    setSelectedSeats(prev => {
      const isSelected = prev.some(s => s.seatNumber === seat.seatNumber);
      if (isSelected) {
        return prev.filter(s => s.seatNumber !== seat.seatNumber);
      } else {
        return [...prev, seat];
      }
    });
  }, []);

  // Book selected seats
  const bookSelectedSeats = useCallback(async (bookingData) => {
    try {
      setLoading(true);
      setError(null);

      // Get user from local storage
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const userPhoneNumber = user.phoneNumber || '+919999999992';
      
      if (!userPhoneNumber) {
        throw new Error('User phone number not found. Please log in again.');
      }

      // Validate booking data
      const validation = validateBookingData({
        ...bookingData,
        selectedSeats
      });

      if (!validation.isValid) {
        throw new Error(validation.message);
      }

      // Format the booking request according to backend DTO
      const formattedSeats = selectedSeats.map(seat => seat.seatNumber.toString());
      const journeyDate = bookingData.journeyDate || new Date().toISOString();
      
      // Prepare passengers data with proper defaults
      const passengers = (bookingData.passengers || selectedSeats || []).map((passenger, index) => {
        // If passenger is a seat object from selectedSeats, format it
        const seatData = typeof passenger === 'object' && passenger.seatNumber ? {
          name: passenger.passengerName || `Passenger ${index + 1}`,
          age: 25, // Default age if not provided
          gender: 'MALE', // Default gender
          seatNumber: passenger.seatNumber,
          phoneNumber: passenger.phoneNumber // Use user's phone number as default
        } : {
          // If it's a passenger object from the form
          ...passenger,
          name: passenger?.name || `Passenger ${index + 1}`,
          age: parseInt(passenger?.age, 10) || 25,
          gender: (passenger?.gender || 'MALE').toUpperCase(),
          phoneNumber: passenger?.phoneNumber || phoneNumber,
          seatNumber: passenger?.seatNumber || selectedSeats[index]?.seatNumber
        };
        
        return seatData;
      });
      
      const bookingRequest = {
        profileUserPhone: userPhoneNumber,
        busNumber: selectedBus?.busNumber || bookingData.busNumber,
        journeyDate: journeyDate, // Will be formatted by the service
        source: (bookingData.source || selectedBus?.source || '').trim(),
        destination: (bookingData.destination || selectedBus?.destination || '').trim(),
        passengers: passengers.map(p => ({
          name: p.name,
          age: p.age,
          gender: p.gender,
          phoneNumber: p.phoneNumber,
          seatNumber: p.seatNumber
        }))
      };

      //console.log('Sending booking request:', JSON.stringify(bookingRequest, null, 2));
      
      const response = await createTicket(bookingRequest);
      
      if (response) {
        setBookingDetails(response);
        // Clear selections after successful booking
        setSelectedSeats([]);
        setSelectedBus(null);
      }
      
      return response;
    } catch (err) {
      console.error('Error booking tickets:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        config: err.config
      });
      
      let errorMessage = 'Failed to book tickets. Please try again.';
      if (err.response?.status === 400) {
        errorMessage = 'Invalid booking data. Please check your information and try again.';
      } else if (err.response?.status === 401) {
        errorMessage = 'Session expired. Please log in again.';
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [selectedBus, selectedSeats]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Clear selections
  const clearSelections = useCallback(() => {
    setSelectedSeats([]);
    setSelectedBus(null);
    setSeatDetails([]);
  }, []);

  return {
    loading,
    error,
    user,
    routes,
    availableBuses,
    selectedBus,
    setSelectedBus,
    seatDetails,
    selectedSeats,
    bookingDetails,
    loadUser,
    loadRoutes,
    searchAvailableBuses,
    loadSeatDetails,
    toggleSeatSelection,
    bookSelectedSeats,
    clearError,
    clearSelections
  };
};

export default useBusBooking;