# Leaps

A collaborative trip planning application that helps users coordinate trips with friends, manage travel and lodging arrangements, and make group decisions efficiently.


## Getting Started

### Prerequisites
- Node.js: Download and install from nodejs.org
- PostgreSQL: Download and install from postgresql.org

### Database Setup
Start PostgreSQL service:

##### For Mac:
   ```
   brew services start postgresql
   createdb leapsdb
   ```

##### For Windows:
    psql -U postgres
    REATE DATABASE leapsdb;
    \q



### Backend Setup (Server)
Navigate to the server directory and install dependencies:

    npm install
Create a .env file in the server directory with:

    PORT=3000
    // For Mac
    DATABASE_URL=postgresql://[username]@localhost:5432/leapsdb
    
    // For Windows
    DATABASE_URL=postgresql://postgres:[password]@localhost:5432/leapsdb


### Start the server:
    npm run dev

The server will run on http://localhost:3000.

### Frontend Setup (Client)
Navigate to the client directory and install dependencies:

    npm install
Start the React development server:

    npm start
The frontend will run on http://localhost:3001.
