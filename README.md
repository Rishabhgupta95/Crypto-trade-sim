# Crypto Exchange - React Vite App

A modern cryptocurrency exchange application built with React and Vite, featuring authentication, portfolio tracking, and real-time crypto data.

## Features

- 🔐 **Authentication**: Login and Sign-up pages with user credential storage
- 📊 **Dashboard**: Dynamic portfolio overview with real-time crypto prices and holdings
- 💰 **Crypto List**: Browse 100+ cryptocurrencies with real-time prices from CoinGecko API
- 📈 **Positions**: View and manage active trading positions with live P&L calculations
- 👤 **Profile**: User profile management showing logged-in user information
- 🔄 **Real-time Data**: Automatic data refresh every 30-60 seconds
- 🎨 **Modern UI**: Beautiful glassmorphism design with smooth animations

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:5173`

## Project Structure

```
src/
├── components/
│   ├── BottomNav.jsx       # Bottom navigation component
│   └── BottomNav.css
├── pages/
│   ├── Login.jsx           # Login page
│   ├── SignIn.jsx          # Sign-up page
│   ├── Dashboard.jsx       # Dashboard page (dynamic with API)
│   ├── CryptoList.jsx      # Cryptocurrency list page (dynamic with API)
│   ├── Position.jsx        # Positions page (dynamic with API)
│   └── Profile.jsx          # Profile page
├── services/
│   └── cryptoApi.js         # CoinGecko API integration
├── App.jsx                  # Main app component with routing
└── main.jsx                 # Entry point

```

## Navigation

The app includes a bottom navigation bar with 4 tabs:
- **Dashboard** 📊 - Portfolio overview
- **Crypto** 💰 - List of all cryptocurrencies
- **Position** 📈 - Active trading positions
- **Profile** 👤 - User profile and settings

## Authentication

- Login credentials: Any email and password will work (demo mode)
- User email and name are stored in localStorage and displayed in the profile
- Authentication state is stored in localStorage
- Protected routes redirect to login if not authenticated

## API Integration

- **CoinGecko API**: Free tier API for cryptocurrency data (no API key required)
- Real-time prices, market cap, and 24h change data
- Automatic data refresh:
  - Dashboard: Every 30 seconds
  - Crypto List: Every 60 seconds
  - Positions: Every 30 seconds
- Loading states and error handling included

## Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Technologies Used

- React 19
- Vite 7
- React Router DOM 7
- CoinGecko API (free tier)
- Modern CSS with glassmorphism effects

## API Details

The app uses the CoinGecko API (https://www.coingecko.com/en/api) which provides:
- Real-time cryptocurrency prices
- Market capitalization data
- 24-hour price change percentages
- No API key required for basic usage
- Rate limits: 10-50 calls/minute (free tier)

## Environment Variables

Create a `.env` file at the project root with the following (optional) values:

````bash
VITE_COINGECKO_API_KEY=CG-your-demo-or-pro-key
````

CoinGecko recently introduced stricter rate limiting. Providing a key significantly improves reliability; without one, the app will fall back to cached values when the free tier is throttled.
