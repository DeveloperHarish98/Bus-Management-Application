export { default as api } from './api';
export { AuthProvider, useAuth } from './authService';
export { busService } from './busService';
export * as bookingService from './bookingService';
export * as ticketService from './ticketService';
export { userService } from './userService';
export const services = {
  api: require('./api').default,
  auth: require('./authService'),
  bus: require('./busService').busService,
  booking: require('./bookingService'),
  ticket: require('./ticketService'),
  user: require('./userService').userService
};

const allServices = {
  api: require('./api').default,
  auth: require('./authService'),
  bus: require('./busService').busService,
  booking: require('./bookingService'),
  ticket: require('./ticketService'),
  user: require('./userService').userService
};

export default allServices;
