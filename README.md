# 🎫 Vantage Voyage

> **Event Hospitality Management Platform** - A comprehensive solution for managing corporate events, conferences, and large-scale gatherings with intelligent guest management, real-time monitoring, and seamless coordination.

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Express](https://img.shields.io/badge/Express.js-000000?style=flat&logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat&logo=supabase&logoColor=white)](https://supabase.com/)

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Quick Start](#-quick-start)
- [Architecture](#-architecture)
- [User Roles](#-user-roles)
- [Documentation](#-documentation)
- [Screenshots](#-screenshots)
- [License](#-license)

---

## ✨ Features

### 🎯 For Event Organizers (Agents/Clients)

- **📊 Smart Guest Management**
  - Bulk import via Excel/CSV
  - Manual guest addition with detailed forms
  - Auto-removal on RSVP decline
  - Unique secure access links per guest
  
- **🔔 Real-time Capacity Monitoring**
  - Animated bell notifications
  - Room vs guest capacity warnings (Critical/Warning/Over-capacity alerts)
  - Live dashboard updates
  
- **📅 Event Scheduling**
  - Create custom event itineraries
  - Demo event seeder for testing
  - Capacity management per event
  
- **✅ Request Approval Workflow**
  - Review guest requests before payment
  - Approve/Reject with notes
  - Pre-payment validation gate
  - Badge notifications for pending reviews
  
- **📥 Comprehensive Reporting**
  - One-click Excel report download
  - 6-sheet detailed export:
    - Event Summary
    - Guest List
    - Hotel Bookings
    - Labels & Perks
    - Requests
    - Extended Guest Details

- **🏷️ Labels & Perks System**
  - Create guest categories (VIP, Family, Staff)
  - Assign perks to labels
  - Flexible permission management

### 🎫 For Guests

- **💌 RSVP Management**
  - Accept/Decline invitations
  - Add family members
  - Auto-removal on decline
  
- **📆 Conflict-Aware Event Registration**
  - View event schedule
  - Register for optional events
  - Real-time conflict detection (time overlap warnings)
  - Visual conflict indicators with specific event details
  
- **✈️ Travel Management**
  - Input flight/train details
  - Seat preferences
  - Meal preferences
  - Self-managed or agent-managed options
  
- **🌴 Bleisure Extensions**
  - Early check-in dates
  - Late check-out dates
  - Extended stay management
  
- **🏨 Room Upgrade Requests**
  - 2-page upgrade flow
  - Date selection
  - Submit to approval workflow
  
- **🎩 Concierge Services**
  - Special service requests
  - Custom requirements
  
- **🆔 Document Vault**
  - Upload ID/passport
  - Secure document storage
  
- **⏰ Priority Waitlist**
  - Tiered priority (VIP > Family > General)
  - Auto-notification system
  - Animated bell indicators

---

## 💻 Tech Stack

### Frontend
- **React 18** with TypeScript
- **Wouter** for routing
- **shadcn/ui** component library
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **React Query** (@tanstack/react-query) for state management
- **Zod** for validation
- **date-fns** for date handling
- **XLSX** for Excel import/export

### Backend
- **Express.js** with TypeScript
- **Drizzle ORM** for database queries
- **PostgreSQL** via Supabase
- **bcryptjs** for password hashing
- **express-session** for authentication
- **Zod** for API validation

### Database & Services
- **Supabase** (PostgreSQL + Authentication + Storage)
- **Vite** for build tooling

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- PostgreSQL database (or Supabase account)
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/Harissh-lab/Vantage-Voyage.git
cd Vantage-Voyage

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# Run database migrations
npm run db:push

# Start development server
npm run dev
```

The application will be available at `http://localhost:5000`

### Environment Variables

Create a `.env` file with the following:

```env
# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Database
DATABASE_URL=your_postgresql_connection_string

# Session Secret
SESSION_SECRET=your_random_secret_key
```

See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for detailed setup instructions.

---

## 🏗️ Architecture

```
Vantage-Voyage/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Utilities (Excel parser, reports)
│   │   └── pages/         # Page components
│   │       ├── auth/      # Authentication pages
│   │       └── guest/     # Guest portal pages
│   └── index.html
├── server/                 # Express backend
│   ├── routes.ts          # API routes
│   ├── guest-routes.ts    # Guest portal API
│   ├── storage.ts         # Database operations
│   └── supabase.ts        # Supabase client
├── shared/                 # Shared code
│   ├── schema.ts          # Database schema
│   └── routes.ts          # API route definitions
├── migrations/            # Database migrations
└── supabase/              # Supabase migrations
```

---

## 👥 User Roles

### 🎯 Travel Agent
- Create and manage multiple events
- Import/manage guest lists
- Configure event settings
- Monitor all activities across events
- Download comprehensive reports

### 👤 Event Host/Client
- View their event details
- Review and approve guest requests
- Make payments (after approval)
- Download event reports
- Monitor capacity alerts

### ✈️ Guest
- Access via unique token link (no login required)
- Manage RSVP and family members
- Register for events with conflict detection
- Submit travel preferences
- Request room upgrades and services
- Upload documents to ID vault
- Join waitlist with priority tiers

---

## 📚 Documentation

Comprehensive guides are available in the repository:

- **[QUICKSTART.md](./QUICKSTART.md)** - Get started in 5 minutes
- **[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)** - Database configuration
- **[GUEST_PORTAL_GUIDE.md](./GUEST_PORTAL_GUIDE.md)** - Guest features overview
- **[AGENT_GUEST_LINK_GUIDE.md](./AGENT_GUEST_LINK_GUIDE.md)** - Guest link management
- **[PRESENTATION_GUIDE.md](./PRESENTATION_GUIDE.md)** - PPT presentation resources

---

## 📸 Screenshots

### Agent/Client Dashboard
![Event Dashboard](https://via.placeholder.com/800x400/4A90E2/FFFFFF?text=Event+Dashboard)

### Guest Portal
![Guest Portal](https://via.placeholder.com/800x400/50C878/FFFFFF?text=Guest+Portal)

### Capacity Alerts
![Capacity Alert](https://via.placeholder.com/800x400/FF6B6B/FFFFFF?text=Capacity+Alert)

### Approval Workflow
![Approval Review](https://via.placeholder.com/800x400/FFD700/000000?text=Approval+%26+Payment)

---

## 🎯 Key Workflows

### 1. Event Creation Flow
```
Agent Sign In → Create Event → Event Setup (Hotel/Travel) → Import Guests → Generate Links
```

### 2. Guest Experience Flow
```
Click Access Link → RSVP → Add Travel Details → Register for Events → Submit Requests
```

### 3. Request Approval Flow
```
Guest Submits Request → Appears in Dashboard → Agent Reviews → Approve/Reject → Payment
```

### 4. Conflict Detection Flow
```
Guest Views Schedule → Attempts Registration → System Checks Overlaps → Shows Warning or Allows
```

---

## 🔒 Security Features

- ✅ Password hashing with bcrypt
- ✅ Token-based guest authentication
- ✅ Session management for agents/clients
- ✅ Role-based access control
- ✅ Secure document storage via Supabase
- ✅ Input validation with Zod
- ✅ SQL injection prevention via ORM

---

## 🚧 Future Enhancements

- [ ] Payment gateway integration (Stripe/PayPal)
- [ ] Email notifications for guests
- [ ] SMS notifications
- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Calendar sync (Google Calendar, Outlook)
- [ ] QR code check-in system
- [ ] Real-time chat support

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Harissh**
- GitHub: [@Harissh-lab](https://github.com/Harissh-lab)

---

## 🙏 Acknowledgments

- Built with [Replit](https://replit.com)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide](https://lucide.dev/)
- Database powered by [Supabase](https://supabase.com/)

---

## 📊 Project Stats

- **71 Files Changed**
- **13,903+ Lines of Code**
- **6 Database Tables**
- **40+ API Endpoints**
- **20+ React Pages**
- **15+ Custom Hooks**

---

<div align="center">
  
**⭐ Star this repo if you find it helpful!**

Made with ❤️ for event organizers worldwide

</div>
