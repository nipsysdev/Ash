# Ash - Peer-to-Peer Field Coordination (PoC / WIP)

Ash is a mapping and communication app powered by P2P networks. It is designed for activists and protesters, or anyone who cares about privacy and decentralized software.\
It helps people share information about physical threats, safe zones, meeting points or any other type of geolocated data. It also includes instant text messaging.

The app is inspired by Organic Maps/OsmAnd for offline map functionality and Waze for sharing geolocated information with others.

## Demo video

https://github.com/user-attachments/assets/86eb1da6-2caf-46d4-87a2-b85196cb5a12

## How It Works

Ash doesn't come with map data or harcoded backend urls. Instead of operating with a centralized backend, it uses a decentralized peer-to-peer network named Waku for sending and receiving messages. It also uses Arti, the implementation of Tor in Rust, for downloading map data served by hidden services.

### What is missing
- Remove the last two http calls made by MapLibreGL to Github. They retrieve fonts and icons for the map.\
I need to migrate them to the hidden service.
- Display user position.
- Fix QRCode scanning.
- Encrypt Waku messages in the group channel so only group members can read and reply.
- Improve the way of communication between the app and the X number of servers listening in. Currently anyone subscribed to the right channel can read the waku messages. Also anyone can reply.\
I need to add encryption and a way to ensure that the response is correct.
- Need a way to have only the servers with the right dta to be able to reply.\
Servers might not have the data that the user want. Being able to serve data from all localities of the world means storing 600+ gigabytes. (Which is what my service is currently doing)
- Find a way to make Waku requests happen over Tor (SOCKS5 proxy?).
- Continue with implementing the app features.

## Peer-to-Peer Backend Components

- [localitysrv](https://github.com/nipsysdev/localitysrv) - A Rust HTTP server that runs on localhost and as a Tor hidden service.\
It enables the search of countries and localities. As well as downloading PMTiles map data
- [localitysrv-waku](https://github.com/nipsysdev/localitysrv-waku) - A Node.js service for bridging Waku messages to localitysrv over localhost.\
It is a workaround until Waku communication is implemented in localitysrv.

## Technology

Built with:
- Tauri (Rust)
- React (TypeScript)
- Waku for peer-to-peer messaging
- Arti (Rust Tor) for accessing hidden services
- Protomaps, MapLibre GL and OpenStreetMap for map features

The UI uses [@nipsysdev/lsd-react](https://github.com/nipsysdev/lsd-react), a library built on top of shadcn and Radix UI.

## Current Features

- Search countries and localities through Waku
- Download maps through Tor for offline use
- Switch between different downloaded areas
- Create, join, and manage groups
- Message with group members
- Share map markers between group members

## Use cases
### Share Critical Information
Users can share information about threats, safe zones locations, and rendezvous points through map markers.

### Navigate Offline
Users can navigate with pre-downloaded maps, eliminating dependency on internet connectivity during operations.

### Communicate Securely
The app provides censorship resistant communication through peer-to-peer messaging without relying on centralized infrastructure.

### Coordinate Actions
Users can coordinate actions without relying on centralized infrastructure, making it resilient to shutdowns.\
(not internet shutdowns though, mesh network?)

## How resilience, security, and usability are achieved

### Decentralized Architecture

The application uses a peer-to-peer message-based backend for all coordination, making it impossible for governments to shut down by targeting central servers.

### Offline map
Maps are downloaded as PMTiles files and stored locally, enabling full offline functionality. This means users can continue accessing the map even without network access, critical in situations where governments cut internet connectivity.

### Tor Anonymity Layer

All map downloads occur anonymously through Tor over its anonymous onion service using the arti-client implementation.

### Guided Onboarding Process

First-time users go through a structured setup that initializes both networks before allowing the download of the map data.

### Automatic Network Management

Users don't need to manually manage Tor or Waku connections. The system automatically handles bootstrapping, circuit creation, peer discovery, and reconnection. Health status is displayed through reactive UI elements that update in real-time.

## Getting Started

### Prerequisites

- Node.js
- Rust and Cargo
- pnpm
- Android SDK (optional, it runs on desktop too)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/nipsysdev/ash.git
   cd ash
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Run the development server:
   ```bash
   pnpm tauri dev
   or
   pnpm tauri android dev
   ```

### Building APKs

```bash
cargo tauri android build --apk
cargo tauri android build --apk --debug
```

## License

Licensed under GNU GPL v3+
