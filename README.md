# Guestify - Online Platform Management System (OPMS)

A comprehensive platform management system for Hosts, Guests, and Admins built with React, Firebase, and modern web technologies.

## 🚀 Project Overview

Guestify is a full-featured OPMS that enables:
- **Hosts** to manage listings, bookings, calendars, and payments
- **Guests** to browse, book, and manage their travel experiences
- **Admins** to oversee the platform with analytics, reports, and policy management

## 📋 Features

### Host Features
- Account registration (Email/SMS)
- Listing management (Home, Experience, Service)
- Rate, discount, and promo management
- Image uploads and location mapping
- Draft saving and favorites
- Dashboard with analytics
- Payment processing
- Calendar availability management
- Messaging system
- Points & Rewards

### Guest Features
- Account registration (Email/SMS)
- Browse listings by category
- Advanced search and filters
- Booking management
- Wishlist functionality
- Messaging system
- Points & Rewards
- Recommendations based on history

### Admin Features
- Service fee management
- Dashboard analytics
- Policy & Compliance management
- Report generation
- Payment review and confirmation

## 🛠️ Tech Stack

- **Frontend**: React 19.2.0
- **Backend**: Firebase (Firestore, Authentication, Storage)
- **Routing**: React Router DOM 6.26.2
- **UI Libraries**: React Icons, React Toastify
- **Date Management**: React DatePicker, date-fns
- **Charts**: Recharts
- **Testing**: React Testing Library, Jest

## 📦 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Firebase account

### Step 1: Install Dependencies

```bash
cd my-react-app
npm install
```

### Step 2: Environment Variables

Create a `.env` file in the `my-react-app` directory:

```env
# Firebase Configuration
REACT_APP_FIREBASE_API_KEY=your_api_key_here
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_FIREBASE_MEASUREMENT_ID=your_measurement_id

# App Configuration
REACT_APP_API_URL=http://localhost:3001
REACT_APP_ENV=development
```

**Note**: You'll configure Firebase in Step 2. For now, you can use placeholder values.

### Step 3: Run the Development Server

```bash
npm start
```

The app will open at `http://localhost:3000`

### Step 4: Build for Production

```bash
npm run build
```

### Step 5: Run Tests

```bash
npm test
```

To run tests with coverage:

```bash
npm test -- --coverage --watchAll=false
```

## 📁 Project Structure

See [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) for detailed folder structure.

## 🎨 Design System

The project uses a modern, minimalist design system with:
- **Primary Color**: Indigo (#6366F1)
- **Secondary Color**: Emerald (#10B981)
- **Accent Color**: Amber (#F59E0B)
- **Typography**: Inter (body), Poppins (headings)
- **Responsive Breakpoints**: Mobile-first approach

See `src/styles/theme.js` for complete design tokens.

## 🔐 Security Notes

- Never commit `.env` file to version control
- Keep Firebase API keys secure
- Use Firebase Security Rules for Firestore and Storage
- Implement proper authentication checks

## 📝 Development Steps

This project is being developed step-by-step:

1. ✅ **Step 1: Project Setup** (Current)
2. ⏳ **Step 2: Firebase Configuration**
3. ⏳ **Step 3: Authentication System**
4. ⏳ **Step 4: Database Schema Design**
5. ⏳ **Step 5: UI/UX Foundation**
6. ⏳ **Step 6: Host Features**
7. ⏳ **Step 7: Guest Features**
8. ⏳ **Step 8: Admin Features**
9. ⏳ **Step 9: Payment Integration**
10. ⏳ **Step 10: Testing & Documentation**

## 🧪 Testing

The project aims for **85%+ test coverage**. Tests are organized in:
- `src/__tests__/components/` - Component tests
- `src/__tests__/services/` - Service tests
- `src/__tests__/utils/` - Utility tests

## 📚 Documentation

- **User Manual**: Will be created in Step 10
- **API Documentation**: Will be created in Step 10
- **Developer Guide**: See PROJECT_STRUCTURE.md

## 🤝 Contributing

This is a step-by-step development project. Each step requires approval before proceeding.

## 📄 License

ISC

## 👥 Authors

IT305 Project Team

---

**Current Status**: Step 1 Complete ✅
**Next Step**: Firebase Configuration
