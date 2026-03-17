# Avaria Academy Learning Management System

## Overview
The Avaria Academy Learning Management System (LMS) is designed to facilitate the management of trainees, batches, attendance, and assessments in an educational environment. This system aims to streamline the learning process and enhance the educational experience for both trainees and instructors.

## Features
- **Trainee Management**: Manage trainee information, including registration and progress tracking.
- **Batch Management**: Organize trainees into batches for structured learning.
- **Attendance Tracking**: Monitor attendance for each trainee in their respective batches.
- **Assessment Management**: Create and manage assessments to evaluate trainee performance.

## Getting Started

### Prerequisites
- Node.js (version 14 or higher)
- npm (Node Package Manager)

### Installation
1. Clone the repository:
   ```
   git clone <repository-url>
   ```
2. Navigate to the project directory:
   ```
   cd avaria-academy-lms
   ```
3. Install the dependencies:
   ```
   npm install
   ```

### Database Setup
1. Configure your database connection in the `prisma/schema.prisma` file.
2. Run the following command to generate the database:
   ```
   npx prisma migrate dev --name init
   ```

### Running the Application
To start the application, run:
```
npm start
```

### API Documentation
Refer to the `src/routes/index.ts` file for the API endpoints and their usage.

## Contributing
Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

## License
This project is licensed under the MIT License. See the LICENSE file for details.