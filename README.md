# 3D Print Queue Application

This project is a web application designed to manage 3D print requests for multiple users. It allows users to authenticate, submit print requests, and view the current print queue in real time. The application enforces a limit of 5 active print requests per user to ensure fair access to the printing resources.

## Features

- User authentication (login and registration)
- Submission of print requests
- Real-time display of the print queue
- Limit of 5 active requests per user

## Technologies Used

- React for the client-side application
- Node.js and Express for the server-side application
- TypeScript for type safety
- Docker for containerization

## Setup Instructions

1. Clone the repository:
   ```
   git clone <repository-url>
   cd 3d-print-queue
   ```

2. Build and run the application using Docker:
   ```
   docker-compose up --build
   ```

3. Access the application in your web browser at `http://localhost:3000`.

## Usage

- Register a new account or log in with an existing account.
- Use the request form to submit new print requests.
- View the print queue to see the status of your requests and others.

## Contributing

Feel free to submit issues or pull requests for improvements and bug fixes.

## License

This project is licensed under the MIT License.