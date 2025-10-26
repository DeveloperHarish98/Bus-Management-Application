import api from './api';
import logger from '../utils/logger';

const BASE_URL = '/buses';
export const busService = {
  _seatDetailsCache: {},
  createBus: async (busData) => {
    try {
      const response = await api.post(BASE_URL, busData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  updateBus: async (busData) => {
    try {
      if (!busData || !busData.id) {
        throw new Error('Bus ID is required for update');
      }
      
      const response = await api.put(`${BASE_URL}`, busData);
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Error updating bus';
      throw new Error(errorMessage);
    }
  },

  deleteBus: async (id) => {
    try {
      const response = await api.delete(`${BASE_URL}/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getAllBuses: async () => {
    try {
      const response = await api.get(BASE_URL, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      // Validate response structure
      if (!response || !response.data) {
        throw new Error('Invalid response from server: No data received');
      }
      
      return response;
    } catch (error) {
      const enhancedError = new Error(error.message || 'Failed to fetch buses');
      enhancedError.details = {
        message: error.message,
        status: error.response?.status,
        url: error.config?.url,
        method: error.config?.method,
        responseData: error.response?.data
      };
      throw enhancedError;
    }
  },

  getBusById: async (id) => {
    try {
      const response = await api.get(`/buses/id/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  updateBusStatus: async (busId, isActive) => {
    try {
      const response = await api.patch(`${BASE_URL}/${busId}/status`, { isActive });
      return response.data;
    } catch (error) {
      console.error('Error updating bus status:', error);
      throw error;
    }
  },

  // Search buses
  searchBuses: async (searchParams) => {
    try {
      const formatDate = (date) => {
        if (!date) return null;
        
        if (typeof date === 'string' && (date.includes('/') || date.includes('-'))) {
          const [day, month, year] = date.split(/[/-]/);
          
          if (day && month && year) {
            const paddedDay = day.padStart(2, '0');
            const paddedMonth = month.padStart(2, '0');
            return `${paddedDay}-${paddedMonth}-${year}`;
          }
        }
        
        const d = new Date(date);
        if (isNaN(d.getTime())) {
          throw new Error('Invalid date format. Expected format: dd-MM-yyyy');
        }
        
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}-${month}-${year}`;
      };

      const formattedDate = formatDate(searchParams.journeyDate || searchParams.travelDate);
      
      if (!formattedDate) {
        throw new Error('Journey date is required');
      }
      
      // Validate the formatted date
      const dateRegex = /^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-\d{4}$/;
      if (!dateRegex.test(formattedDate)) {
        throw new Error('Invalid date format. Please use dd-MM-yyyy format');
      }

      // Prepare request data
      const requestData = {
        source: searchParams.source || searchParams.origin,
        destination: searchParams.destination,
        journeyDate: formattedDate
      };
      
      const response = await api.post(`${BASE_URL}/search`, requestData);
      
      return response.data.data || [];
    } catch (error) {
      console.error('Error searching buses:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        config: error.config
      });
      throw error;
    }
  },

  // Extract unique sources from bus list
  extractSourcesFromBuses: (response) => {
    try {
      const buses = response?.data?.data || response?.data || response;
      
      if (!Array.isArray(buses)) return [];
      
      return [...new Set(buses
        .map(bus => bus.source)
        .filter(source => source && source.trim() !== '')
      )];
    } catch (error) {
      console.error('Error extracting sources:', error);
      return [];
    }
  },

  // Extract unique destinations from bus list
  extractDestinationsFromBuses: (response) => {
    try {
      const buses = response?.data?.data || response?.data || response;
      
      if (!Array.isArray(buses)) return [];
      
      return [...new Set(buses
        .map(bus => bus.destination)
        .filter(destination => destination && destination.trim() !== '')
      )];
    } catch (error) {
      console.error('Error extracting destinations:', error);
      return [];
    }
  },

  // Get all sources dynamically from buses
  getAllSources: async () => {
    try {
      const response = await api.get(`${BASE_URL}/routes`);
      const sources = response.data?.data?.sources || [];
      return sources.length > 0 ? sources : [];
    } catch (error) {
      console.error('Error getting sources:', error);
      return [];
    }
  },

  // Get all destinations dynamically from buses
  getAllDestinations: async () => {
    try {
      const response = await api.get(`${BASE_URL}/routes`);
      const destinations = response.data?.data?.destinations || [];
      return destinations.length > 0 ? destinations : [];
    } catch (error) {
      console.error('Error getting destinations:', error);
      return [];
    }
  },

  // Find buses by source and destination
  findBusesBySourceAndDestination: async (source, destination) => {
    // Trim and validate inputs
    const trimmedSource = source ? source.trim() : '';
    const trimmedDestination = destination ? destination.trim() : '';

    // Validate inputs
    if (!trimmedSource || !trimmedDestination) {
      console.warn('Source and destination must be non-empty strings');
      return [];
    }

    try {
      const response = await api.get(`${BASE_URL}/findBySourceAndDestination`, {
        params: { source: trimmedSource, destination: trimmedDestination }
      });
      return response.data.data || [];
    } catch (error) {
      console.error('Error finding buses:', error);
      if (error.response?.status === 404) {
        console.warn('No buses found for the given source and destination');
      }
      return [];
    }
  },

  // Extract sources and destinations from buses
  extractRoutesFromBuses: (buses) => {
    const sources = [...new Set(buses.map(bus => bus.source).filter(Boolean))];
    const destinations = [...new Set(buses.map(bus => bus.destination).filter(Boolean))];
    return { sources, destinations };
  },

  // Get sources and destinations dynamically
  getAvailableRoutes: async () => {
    try {
      logger.debug('Fetching available routes');
      const response = await api.get('/routes');
      
      let sources = [];
      let destinations = [];
      
      if (response.data && response.data.data) {
        
        sources = response.data.data.sources || [];
        destinations = response.data.data.destinations || [];
      } else if (response.data) {
        // If data is at the root level
        sources = response.data.sources || [];
        destinations = response.data.destinations || [];
      }

      if (sources.length === 0 || destinations.length === 0) {
        logger.warn('No routes found in the system, using default routes');
        sources = ['Raipur', 'Bhilai', 'Durg', 'Bilaspur', 'Jagdalpur'];
        destinations = ['Puri', 'Bhubaneswar', 'Cuttack', 'Sambalpur', 'Rourkela'];
      }
      
      return { sources, destinations };
    } catch (error) {
      logger.error('Error getting routes. Using default routes instead.');
      return { 
        sources: ['Raipur', 'Bhilai', 'Durg', 'Bilaspur', 'Jagdalpur'], 
        destinations: ['Puri', 'Bhubaneswar', 'Cuttack', 'Sambalpur', 'Rourkela'] 
      };
    }
  },

  // Get comprehensive route details
  getRouteDetails: () => {
    return api.get('/routes');
  },

  // Get available bus dates for a specific route
  getAvailableDates: async (source, destination) => {
    try {
      // Validate inputs
      if (!source || !destination) {
        logger.warn('Source and destination are required');
        return [];
      }

      const response = await api.get('/buses');

      // Handle different possible response formats
      const busData = response.data || [];
      
      // Ensure busData is an array and has a map method
      if (!Array.isArray(busData)) {
        logger.warn('Unexpected response format for bus data');
        return [];
      }

      // Filter buses that match the exact source and destination
      const matchingBuses = busData.filter(bus => 
        bus.source?.toLowerCase() === source.toLowerCase() && 
        bus.destination?.toLowerCase() === destination.toLowerCase()
      );

      // Extract unique dates from matching bus data
      const dates = [...new Set(matchingBuses
        .filter(bus => bus.departureTime)
        .map(bus => new Date(bus.departureTime).toISOString().split('T')[0])
      )];

      logger.debug(`Found ${dates.length} available dates for route ${source} to ${destination}`);

      return dates;
    } catch (error) {
      logger.error('Error getting available dates');
      return [];
    }
  },

  // Get tickets for a specific bus
  getBusTickets(busNumber) {
    return api.get(`/listofTickets/${busNumber}`);
  },

  // Batch processing for multiple bus seat details
  async getMultipleSeatDetails(busNumbers) {
    try {
      if (!Array.isArray(busNumbers) || busNumbers.length === 0) {
        throw new Error('Array of bus numbers is required');
      }

      // Filter out already cached results
      const uncachedBusNumbers = busNumbers.filter(busNumber => 
        !this._seatDetailsCache[busNumber] || 
        (Date.now() - (this._seatDetailsCache[busNumber]?.timestamp || 0)) > 60000 // 1 minute cache
      );

      // If all results are cached, return them
      if (uncachedBusNumbers.length === 0) {
        return busNumbers.map(busNumber => this._seatDetailsCache[busNumber].data);
      }

      // Fetch all uncached bus seat details in parallel
      const fetchPromises = uncachedBusNumbers.map(busNumber => 
        api.get(`/buses/seatDetails/${busNumber}`)
          .then(response => {
            // Debug logging removed
            return {
              busNumber,
              data: response.data?.data || response.data,
              status: 'success',
              rawResponse: response.data  // Keep raw response for debugging
            };
          })
          .catch(error => ({
            busNumber,
            error: error.response?.data || { message: error.message },
            status: 'error'
          }))
      );

      // Wait for all requests to complete
      const results = await Promise.all(fetchPromises);

      // Process and cache results
      results.forEach(result => {
        if (result.status === 'success') {
          const seatData = this._processSeatDetails(result.busNumber, result.data);
          this._seatDetailsCache[result.busNumber] = {
            data: seatData,
            timestamp: Date.now()
          };
        }
        // If there's an error, we'll handle it in the final mapping
      });

      // Return results in the same order as requested
      return busNumbers.map(busNumber => 
        this._seatDetailsCache[busNumber]?.data || {
          seats: [],
          busNumber,
          totalSeats: 0,
          availableSeats: 0,
          bookedSeats: 0,
          error: { message: 'Failed to fetch seat details' }
        }
      );
    } catch (error) {
      console.error('Error in getMultipleSeatDetails:', error);
      return busNumbers.map(busNumber => ({
        seats: [],
        busNumber,
        totalSeats: 0,
        availableSeats: 0,
        bookedSeats: 0,
        error: { message: error.message }
      }));
    }
  },

  // Process seat details from API response
  async _processSeatDetails(busNumber, responseData) {
    // Debug logging removed
    
    try {
      // If no response data provided, throw error
      if (!responseData) {
        throw new Error('No response data provided');
      }
      
      // If we have a data property in the response, use that
      if (responseData.data) {
        // Debug logging removed
        responseData = responseData.data;
        // Debug logging removed
      }
      
      // Helper function to calculate seat counts from seats array
      const calculateSeatCounts = (seats) => {
        if (!Array.isArray(seats)) {
          return { totalSeats: 0, availableSeats: 0, bookedSeats: 0 };
        }
        
        const totalSeats = seats.length;
        const availableSeats = seats.filter(seat => 
          seat && seat.status && seat.status.toUpperCase() === 'AVAILABLE'
        ).length;
        
        const bookedSeats = seats.filter(seat => 
          seat && seat.status && [
            'BOOKED', 
            'PAYMENT_DONE', 
            'PAYMENT_PENDING',
            'PAID'
          ].includes(seat.status.toUpperCase())
        ).length;
        
        return { totalSeats, availableSeats, bookedSeats };
      };
      
      // Case 1: Response is an array of seats
      if (Array.isArray(responseData)) {
        const { totalSeats, availableSeats, bookedSeats } = calculateSeatCounts(responseData);
        // Debug logging removed
        
        return {
          seats: responseData,
          busNumber,
          totalSeats,
          availableSeats,
          bookedSeats
        };
      }
      
      // Case 2: Response has a seats array
      if (Array.isArray(responseData.seats)) {
        const { totalSeats, availableSeats, bookedSeats } = calculateSeatCounts(responseData.seats);
        // Debug logging removed
        
        return {
          seats: responseData.seats,
          busNumber: responseData.busNumber || busNumber,
          totalSeats,
          availableSeats,
          bookedSeats
        };
      }
      
      // Case 3: Response has direct seat count properties
      if (responseData.availableSeats !== undefined || responseData.bookedSeats !== undefined) {
        return {
          seats: responseData.seats || [],
          busNumber: responseData.busNumber || busNumber,
          totalSeats: responseData.totalSeats || (responseData.seats ? responseData.seats.length : 0),
          availableSeats: responseData.availableSeats || 0,
          bookedSeats: responseData.bookedSeats || 0
        };
      }
      
      // If we get here, the data format is not recognized
      throw new Error('Invalid seat data format');
      
    } catch (error) {
      console.error(`[ERROR] Error processing seat details for ${busNumber}:`, error);
      return {
        seats: [],
        busNumber,
        totalSeats: 0,
        availableSeats: 0,
        bookedSeats: 0,
        error: error.message
      };
    }
  },

  // Get seat details for a single bus (uses batch processing internally)
  async getSeatDetails(busNumber) {
    try {
      if (!busNumber) {
        throw new Error('Bus number is required');
      }

      // Use batch processing even for single bus
      const [result] = await this.getMultipleSeatDetails([busNumber]);
      return result;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[API] Error in getSeatDetails:', {
          message: error.message,
          status: error.response?.status,
          url: error.config?.url
        });
      }
      
      // Return default values on error
      return {
        seats: [],
        busNumber,
        totalSeats: 0, 
        availableSeats: 0,
        bookedSeats: 0,
        error: {
          message: error.response?.data?.message || 'Failed to fetch seat details',
          status: error.response?.status || 0
        }
      };
    }
  },

  // Deprecated: kept for backward compatibility
  findBuses({ source, destination }) {
    return this.findBusesBySourceAndDestination(source, destination);
  },

  // Deprecated methods from previous implementation
  findByRoute(params) {
    return this.searchBuses(params);
  }
};
