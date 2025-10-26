# 🚌 Bus Management System

Bus Managment System
![Bus Management System view](Bus%20Menegment%20System%20View.png)


## 📝 Project Overview
A Spring Boot web application for managing bus transportation, providing efficient ticket booking, user management, and bus tracking services.

## 🛠 Technology Stack
### Backend
- **Language**: Java 17
- **Framework**: Spring Boot 3.3.10
- **ORM**: Spring Data JPA
- **Database**: MySQL
- **Additional Libraries**:
  - Lombok (Reduces boilerplate code)
  - Spring AI (OpenAI integration)
  - Spring DevTools

## 🚀 Key Features
### User Management
- User registration
- Profile management
- Phone number-based authentication
- Email-based authentication
- Find user by phone number & Email
- Crud operations for user

### Bus Management
- Bus information tracking
- Route and schedule management
- Unique bus number tracking
- Crud operations for bus

### Ticket Booking
- Ticket reservation system
- Bus-specific ticket tracking
- Seat management
- Crud operations for ticket

## 📦 Project Structure

src/main/java/springboot/busmanagementsystem/
├── controller/      # REST API endpoints
│   
├── model/           # Database entities
│  
├── repository/      # JPA repositories
│   
├── service/         # Business logic
│   
├── exception/       # Custom exceptions
├── dto/             # Data Transfer Objects
└── util/            # Utility classes


## 🌐 API Endpoints - Total APIs: 22

#### User APIs (8 Endpoints)
- POST /users\: Create new user
- GET /users\: List users
- GET /users/{id}\: Retrieve user details
- PUT /users/{id}\: Update user information
- DELETE /users/{id}\: Delete user
- POST /users/verifyByEmail\: Verify user by email
- POST /users/verifyByPhone\: Verify user by phone
- POST /users/findByPhoneNumber\: Find user by phone number

#### Bus APIs (10 Endpoints)
- POST /buses\: Add new bus
- GET /buses\: List all buses
- GET /buses/{id}\: Get bus details
- PUT /buses/{id}\: Update bus information
- DELETE /buses/{id}\: Delete bus
- POST /buses/findByRoute\: Find buses by route
- POST /buses/findByBusNumber\: Find bus by bus number
- GET /buses/findBySeats/{seats}\: Find buses by seat count
- POST /buses/findByDepartureTime\: Find buses by departure time
- GET /buses/listofTickets/{busNumber}\: List tickets for a bus

#### Ticket APIs (4 Endpoints)
- POST /tickets\: Book a ticket
- GET /tickets\: List tickets
- GET /tickets/{id}\: Get ticket details
- DELETE /tickets/{id}\: Cancel ticket

## 🔧 Setup and Configuration
### Prerequisites
- Java 17
- Maven
- MySQL Database

### Database Configuration
Configure in application.properties\:
- spring.datasource.url=jdbc:mysql://localhost:3306/busmanagementsystem
- spring.datasource.username=your_username
- spring.datasource.password=your_password
- spring.jpa.hibernate.ddl-auto=update

### Running the Application
1. Clone the repository
2. Configure MySQL database
3. Run \mvn clean install\
4. Start the application: \mvn spring-boot:run\

## 🐛 Error Handling
Custom exceptions for various scenarios:
- UserNotFoundException\
- TicketNotFoundException\
- BusNotFoundException\

## 🤝 Contributing
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License
- Personal Project

## 📞 Contact
1. Name - __**Harish Dubey**__
2. Reach me through mail - harishdubey98r@gmail.com
3. Workfolio - https://harishdubeyofficial.netlify.app/
