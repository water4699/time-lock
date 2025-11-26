# Encrypted Study Schedule

A fully encrypted study schedule tracking system built with FHEVM (Fully Homomorphic Encryption Virtual Machine) on Ethereum. This application allows users to record their daily study goals and progress with complete privacy - all data is encrypted on-chain and can only be decrypted by the user.

## Features

- **Fully Encrypted Data**: All study schedule data (target goals, completed goals, priority) is encrypted using FHEVM
- **On-Chain Calculations**: Completion rate and average priority are calculated on-chain while data remains encrypted
- **User Privacy**: Only the data owner can decrypt and view their own study progress
- **RainbowKit Integration**: Modern wallet connection using RainbowKit
- **Local Development**: Full support for local Hardhat network development

## Business Logic

The system tracks:
- **Target Goals**: Number of study goals for the day (encrypted)
- **Completed Goals**: Number of completed goals (encrypted)
- **Priority**: Priority level (1-3) for each goal (encrypted)

Calculations performed on encrypted data:
- **Completion Rate**: (Completed / Target × 100) - calculated while encrypted
- **Average Priority**: Average of all priority values - calculated while encrypted

## Tech Stack

- **Smart Contracts**: Solidity 0.8.27 with FHEVM
- **Frontend**: Next.js 15, React 19, TypeScript
- **Wallet**: RainbowKit with MetaMask support
- **Encryption**: FHEVM (Zama's Fully Homomorphic Encryption)
- **Testing**: Hardhat, Chai, Mocha

## Getting Started

### Prerequisites

- Node.js >= 20
- npm >= 7.0.0
- Hardhat node running on localhost:8545

### Configuration

The project is pre-configured with your credentials:

- **Infura API Key**: `b18fb7e6ca7045ac83c41157ab93f990` (for Sepolia testnet)
- **WalletConnect Project ID**: `ef3325a718834a2b1b4134d3f520933d` (for RainbowKit)
- **Private Key**: Configured for contract deployment on Sepolia

These values are already set in the configuration files. For security, consider using environment variables in production.

### Installation

1. Install dependencies:
```bash
npm install
```

2. Install frontend dependencies:
```bash
cd frontend
npm install
```

### Local Development

1. Start Hardhat node with FHEVM:
```bash
npx hardhat node
```

2. Deploy contracts:
```bash
npx hardhat deploy --network localhost
```

3. Generate ABI files for frontend:
```bash
cd frontend
npm run genabi
```

4. Start frontend development server:
```bash
cd frontend
npm run dev
```

The application will be available at `http://localhost:3000`

### Testing

Run local tests:
```bash
npm test
```

Run Sepolia testnet tests:
```bash
npm run test:sepolia
```

## Project Structure

```
time-lock/
├── contracts/           # Smart contracts
│   └── StudySchedule.sol
├── deploy/              # Deployment scripts
├── test/                # Test files
├── frontend/            # Next.js frontend
│   ├── app/            # Next.js app directory
│   ├── components/     # React components
│   ├── hooks/          # Custom React hooks
│   ├── fhevm/          # FHEVM integration
│   └── public/         # Static assets
└── types/              # TypeScript types (generated)
```

## Usage

1. **Connect Wallet**: Click the "Connect Wallet" button in the top right corner
2. **Submit Schedule**: Enter your study goals for a specific date
   - Select a date
   - Enter target goals (number of goals)
   - Enter completed goals
   - Set priority (1-3)
   - Click "Submit Schedule"
3. **View Schedule**: Click "Refresh Schedule" to load encrypted data
4. **Decrypt**: Click "Decrypt Schedule" to view your decrypted progress

## Encryption/Decryption Process

### Encryption (Submitting Data)
- Requires MetaMask transaction (writes to blockchain)
- Data is encrypted before submission
- Gas cost: 0 on local network, normal on testnet/mainnet

### Decryption (Viewing Data)
- Requires MetaMask signature (EIP-712, not a transaction)
- Decryption happens locally in the browser
- No gas cost
- Signature is cached for 365 days

## License

MIT

