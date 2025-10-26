/**
 * Data Transfer Object for Bus Summary
 * Provides a lightweight representation of bus information
 * without including the full seat list
 */
class BusSummaryDTO {
    constructor(bus) {
        this.id = bus.id;
        this.busNumber = bus.busNumber;
        this.busName = bus.busName;
        this.routeFrom = bus.routeFrom;
        this.routeTo = bus.routeTo;
        this.departureTime = bus.departureTime;
        this.arrivalTime = bus.arrivalTime;
        this.totalSeats = bus.totalSeats;
        this.availableSeats = bus.availableSeats;
        this.fare = bus.fare;
        this.busType = bus.busType;
        this.status = bus.status;
    }

    /**
     * Checks if the bus has available seats
     * @returns {boolean} True if seats are available, false otherwise
     */
    hasAvailableSeats() {
        return this.availableSeats > 0;
    }

    /**
     * Calculates the percentage of available seats
     * @returns {number} Percentage of available seats
     */
    getAvailableSeatsPercentage() {
        return this.totalSeats > 0 
            ? Math.round((this.availableSeats / this.totalSeats) * 100) 
            : 0;
    }

    /**
     * Provides a formatted string representation of the bus route
     * @returns {string} Formatted route description
     */
    getRouteDescription() {
        return `${this.routeFrom} → ${this.routeTo}`;
    }

    /**
     * Static method to convert a bus object to BusSummaryDTO
     * @param {Object} bus - The original bus object
     * @returns {BusSummaryDTO} A summary DTO of the bus
     */
    static fromBus(bus) {
        return new BusSummaryDTO(bus);
    }

    /**
     * Converts an array of bus objects to BusSummaryDTO instances
     * @param {Array} buses - Array of bus objects
     * @returns {Array} Array of BusSummaryDTO instances
     */
    static fromBuses(buses) {
        return buses.map(bus => BusSummaryDTO.fromBus(bus));
    }
}

export default BusSummaryDTO;
