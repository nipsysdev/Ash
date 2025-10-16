# Ash - Peer-to-Peer Field Coordination

The goal of Ash is to be a secure and privacy perserving mapping and communication application designed for activists and protest movements, or anyone caring about their privacy and the use of decentralised software.

Developed using Tauri (Rust), React (Typescript), a custom UI library based on LSD, Tor, Waku.

Map features developed using software and/or data from Protomaps, MapLibre GL and OpenstreetMap.

## Current State: Proof of Concept / Work In Progress
In it's current here are the features of the Ash Android app:
- Search country and localities through Waku
- Maps are downloaded as PMTiles files during setup through Tor
- Map data is stored locally and rendered using MapLibre GL
- Users can switch between different downloaded areas as needed
- Group creation/invite/joining
- Message communication with group members
- Map marker sharing between group members



https://github.com/user-attachments/assets/86eb1da6-2caf-46d4-87a2-b85196cb5a12



## How it works
Ash doesn't come with map data, and it doesn't come with a backend url neither.

Ash relies on a decentralised and p2p message-based backend to search and fetch for data to download.\
The country and locality search occurs on Waku: Messages are published in channels where they will be picked up and replied by compatible software listening in.\
Each locality data retrieved by Ash through Waku, includes a direct link to download the map data which are under the form of PMTiles, a single-file archive format for pyramids of tiled data made using Protomaps.

### The decentralised backend software
- [localitysrv](https://github.com/nipsysdev/localitysrv) - A Rust HTTP server configured to run both on localhost and as a Tor hidden service. It is also made to automatically generate the localities pmtiles map data from a remote or local planet pmtiles file.
- [localitysrv-waku](https://github.com/nipsysdev/localitysrv-waku) - A service made as a workaround for not being able to use the Waku Rust bindings with localitysrv. This is a simple Node software listen and reply to messages sent in the channels that Ash use. It redirects the request to localitysrv over TCP on localhost.

## The Vision

The goal is to create a platform for activists and protesters to:

- **Share critical information** about threats, safe zones locations, and rendezvous points
- **Navigate offline** with pre-downloaded maps
- **Communicate securely** through peer-to-peer messaging
- **Coordinate actions** without relying on centralized infrastructure

Think of it as a Waze for activists - a tool that helps people navigate and share information in risky situations, but with a strong focus on privacy, security, and offline map functionality.

## Using the app

### First-Time Setup

When users first open Ash, they're guided through a simple onboarding process:

1. **Introduction**: A welcome screen explaining the app's purpose
2. **Network Setup**: Connection to the Waku peer-to-peer network
3. **Location Selection**: Choosing which areas to download maps for
4. **Map Download**: Fetching offline map data for selected locations

### Main Application

After setup, users have access to:

- **Interactive Map**: A full-screen map showing their selected area
- **Group Management**: Creating, joining, and managing coordination groups
- **Secure Chat**: Encrypted messaging within groups
- **Location Sharing**: Marking points of interest on the map

## Getting Started

### Prerequisites

Check out mise.toml for the exact versions used for development.

- Node.js
- Rust and Cargo
- pnpm
- Android SDK (optional, it runs on desktop even if not intended platform)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/ash.git
   cd ash
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Run the development server:
   ```bash
   pnpm tauri dev
   ```

### Building for Production

```bash
pnpm build
pnpm tauri build
```

## Contributing

Ash is open-source software licensed under the GPL-3.0-or-later license. We welcome contributions from developers who share our commitment to privacy, security, and supporting activist movements.

Please see our contributing guidelines for more information on how to get involved.

## Security Considerations

While Ash is designed with security in mind, no software can guarantee complete safety. Users should:

- Be aware of their physical security when using the app
- Understand that digital security is just one part of overall safety
- Keep their devices updated and secure
- Be cautious about sharing sensitive information

## Support

For technical support, feature requests, or to report issues, please visit our GitHub repository.

---

*"Ash - Your path through the fire"*
