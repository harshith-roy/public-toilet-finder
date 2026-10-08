# 🚻 Public Toilet Finder & Maintenance System

> **Smart City Solution — Find. Report. Maintain. Improve.**

A full-stack Smart City platform that helps citizens discover nearby public toilets, view facility information, navigate to them, submit maintenance complaints, and review facilities — while providing authorities with a centralized dashboard to monitor, manage, and resolve reported issues.

Built with **React, TypeScript, Tailwind CSS, Leaflet, Supabase, and PostgreSQL**.

---

## 🌐 Live Demo

### 🚀 Production Application
**https://public-toilet-finder-three.vercel.app**

### 📦 Source Code
**https://github.com/harshith-roy/public-toilet-finder**

---

# 🎯 Problem Statement

Finding a nearby public toilet is often difficult, especially when citizens do not know:

- Where the nearest facility is
- Whether it is currently accessible
- Whether basic facilities are available
- Whether the facility is clean or well maintained
- How to report a damaged or unhygienic facility
- Whether previously reported issues were actually resolved

At the same time, authorities need a centralized way to:

- Monitor public toilet complaints
- Identify frequently reported facilities
- Track complaint status
- Prioritize maintenance
- Understand operational trends

The **Public Toilet Finder & Maintenance System** addresses both sides of this problem through a single digital platform.

---

# 💡 Our Solution

The platform provides two major experiences:

## 👤 Citizen

Citizens can:

- Create an account and sign in
- Automatically detect their location
- Discover nearby public toilets
- Search and filter facilities
- Change the search radius
- View toilet details
- See facility availability/features
- Navigate to a selected toilet
- Submit maintenance complaints
- Track their complaints
- Review public toilets
- Reopen or confirm resolved complaints where applicable

## 🏢 Authority

Authorized personnel can:

- Access an authority-only dashboard
- View reported complaints
- Search and filter complaints
- Filter by complaint category
- Filter by status
- Inspect complaint details
- Update complaint status
- Add resolution/maintenance notes
- Monitor unresolved complaints
- View operational analytics
- Monitor recent complaint activity
- Identify frequently reported facilities

---

# ✨ Key Features

## 🗺️ 1. Real-Time Nearby Toilet Discovery

The application uses browser geolocation to determine the citizen's current position.

Nearby toilets are retrieved from the real Supabase database using a PostgreSQL RPC function:

```text
get_nearby_toilets(user_lat, user_lng, radius_km)
