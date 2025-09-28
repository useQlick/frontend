import { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import { ArrowLeft, TrendingUp, Clock, Users, DollarSign, Wallet, User, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usePrivy } from '@privy-io/react-auth';
import { ethers } from 'ethers';

// Extend window object for ethereum provider
declare global {
  interface Window {
    ethereum?: any;
  }
}

// Qlick Contract Configuration
const QLICK_CONFIG = {
  RPC_URL: 'https://sepolia.unichain.org',
  
  // Core V4 addresses on Unichain Sepolia
  POOL_MANAGER: '0x00B036B58a818B1BC34d502D3fE730Db729e62AC',
  POSITION_MANAGER: '0xf969Aee60879C54bAAed9F3eD26147Db216Fd664',
  V4_ROUTER: '0x9cD2b0a732dd5e023a5539921e0FD1c30E198Dba',
  PERMIT2: '0x000000000022D473030F116dDEE9F6B43aC78BA3',
  
  // Qlick contracts
  QUANTUM_MARKET_MANAGER: '0xBf945e3f549ceb6cA4907161679f148F48af09cC',
  QUANTUM_MARKET_HOOK: '0x19A4a8ddCBB74B33e410CE2E27833e8c42FC80c0',
  QLICK_ORCHESTRATOR: '0x641eCbB155b8589120005dE67e7aBF524034EA5B',
  
  // Pool parameters
  FEE: 3000,
  TICK_SPACING: 60,
  SQRT_PRICE_X96: '79228162514264337593543950336',
  TICK_LOWER: -120,
  TICK_UPPER: 120,
  LIQUIDITY_DESIRED: ethers.parseEther('100'),
  AMOUNT_0_MAX: ethers.parseEther('100'),
  AMOUNT_1_MAX: ethers.parseEther('100'),
  
  // Token amounts
  MINT_AMOUNT: ethers.parseEther('1000000'),
  SWAP_AMOUNT: ethers.parseEther('1'),
  
  // Market parameters
  MIN_DEPOSIT: 0,
  MARKET_TITLE: 'Quantum Market Demo'
};

// Contract ABIs
const ORCHESTRATOR_ABI = [
  'function deployTokens(uint256 mintAmount)',
  'function createPoolAndAddLiquidity(address hook, uint24 fee, int24 tickSpacing, uint160 sqrtPriceX96, uint128 liquidityDesired)',
  'function createPoolAndAddLiquidity(address hook, uint24 fee, int24 tickSpacing, uint160 sqrtPriceX96, int24 tickLower, int24 tickUpper, uint128 liquidityDesired, uint256 amount0Max, uint256 amount1Max)',
  'function swapOnPool(bool zeroForOne, uint256 amountIn)',
  'function createMarket(address qm, address marketToken, address resolver, uint256 minDeposit, uint256 deadline, string title)',
  'function token0() view returns (address)',
  'function lastMarketId() view returns (uint256)',
  'function lastPoolKey() view returns (tuple(address currency0, address currency1, uint24 fee, int24 tickSpacing, address hooks))'
];

const QUANTUM_MARKET_MANAGER_ABI = [
  'function createDecision(string metadata) returns (uint256)',
  'function createProposal(uint256 decisionId, bytes32 proposalId, string metadata, tuple(address currency0, address currency1, uint24 fee, int24 tickSpacing, address hooks) poolKey)',
  'function settle(uint256 decisionId, bytes32 winningProposalId)',
  'function setFactory(address f)',
  'function acceptProposal(uint256 marketId, uint256 proposalId)',
  'function resolveMarket(uint256 marketId, bool yesOrNo)',
  'function redeemRewards(uint256 marketId, address user)',
  'function nextProposalId() view returns (uint256)',
  'function nextDecisionId() view returns (uint256)',
  'function createMarket(address creator, address marketToken, address resolver, uint256 minDeposit, uint256 deadline, string title) returns (uint256)',
  'function depositToMarket(address depositor, uint256 marketId, uint256 amount)',
  'function createProposalForMarket(uint256 marketId, address creator, address vUSD, address yesToken, address noToken, bytes data) returns (uint256)',
  'function setProposalPools(uint256 proposalId, tuple(address currency0, address currency1, uint24 fee, int24 tickSpacing, address hooks) yesKey, tuple(address currency0, address currency1, uint24 fee, int24 tickSpacing, address hooks) noKey)',
  'function markets(uint256) view returns (uint256 id, uint256 createdAt, uint256 minDeposit, uint256 deadline, address creator, address marketToken, address resolver, uint8 status, string title)',
  'function proposals(uint256) view returns (uint256 id, uint256 marketId, uint256 createdAt, address creator, tuple(address vUSD, address yesToken, address noToken) tokens, tuple(address currency0, address currency1, uint24 fee, int24 tickSpacing, address hooks) yesPoolKey, tuple(address currency0, address currency1, uint24 fee, int24 tickSpacing, address hooks) noPoolKey, bytes data)',
  'function decisions(uint256) view returns (string metadata, bool settled, bytes32 winningProposalId, bytes32[] proposals)',
  'function proposalInfo(bytes32) view returns (uint256 decisionId, string metadata, tuple(address currency0, address currency1, uint24 fee, int24 tickSpacing, address hooks) poolKey, bool exists)',
  'function deposits(uint256, address) view returns (uint256)',
  'function acceptedProposal() view returns (uint256)',
  'function factory() view returns (address)',
  'event DecisionCreated(uint256 indexed decisionId, string metadata)',
  'event MarketCreated(uint256 indexed marketId, uint256 createdAt, address creator, string title)',
  'event ProposalCreated(uint256 indexed decisionId, bytes32 indexed proposalId, tuple(address currency0, address currency1, uint24 fee, int24 tickSpacing, address hooks) poolKey)'
];

// Market status enum matching contract
enum MarketStatus {
  OPEN = 0,
  PROPOSAL_ACCEPTED = 1,
  TIMEOUT = 2,
  RESOLVED_YES = 3,
  RESOLVED_NO = 4
}

interface ContractMarket {
  id: number;
  createdAt: number;
  minDeposit: bigint;
  deadline: number;
  creator: string;
  marketToken: string;
  resolver: string;
  status: MarketStatus;
  title: string;
}

interface Proposal {
  id: string;
  decisionId: number;
  metadata: string;
  poolKey: {
    currency0: string;
    currency1: string;
    fee: number;
    tickSpacing: number;
    hooks: string;
  };
  exists: boolean;
}

interface Market {
  id: string;
  title: string;
  description: string;
  yesPrice: number;
  noPrice: number;
  volume: string;
  participants: number;
  endDate: string;
  category: string;
  status: 'active' | 'settled' | 'pending';
  contractData?: ContractMarket;
  proposalId?: number;
  decisionId?: number;
  proposals?: Proposal[];
  winningProposalId?: string;
}

interface Position {
  marketId: string;
  side: 'yes' | 'no';
  shares: number;
  avgPrice: number;
  currentValue: number;
  pnl: number;
}

export const MarketPage = (): JSX.Element => {
  const navigate = useNavigate();
  const { login, logout, authenticated, user, ready } = usePrivy();
  const [activeTab, setActiveTab] = useState<'markets' | 'positions' | 'script'>('markets');
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  const [tradeAmount, setTradeAmount] = useState<string>('');
  const [tradeSide, setTradeSide] = useState<'yes' | 'no'>('yes');
  const [isExecutingScript, setIsExecutingScript] = useState(false);
  const [scriptOutput, setScriptOutput] = useState<string[]>([]);
  const [walletBalance, setWalletBalance] = useState<string>('0');
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [orchestratorContract, setOrchestratorContract] = useState<ethers.Contract | null>(null);
  const [quantumMarketContract, setQuantumMarketContract] = useState<ethers.Contract | null>(null);
  const [realMarkets, setRealMarkets] = useState<Market[]>([]);
  const [isLoadingMarkets, setIsLoadingMarkets] = useState(false);
  const [realPositions, setRealPositions] = useState<Position[]>([]);
  const [isLoadingPositions, setIsLoadingPositions] = useState(false);

  // Mock data for demonstration
  const [markets] = useState<Market[]>([
    {
      id: '1',
      title: 'Will Bitcoin reach $100k by end of 2024?',
      description: 'Market resolves YES if Bitcoin (BTC) reaches or exceeds $100,000 USD on any major exchange before January 1, 2025.',
      yesPrice: 0.65,
      noPrice: 0.35,
      volume: '$2.4M',
      participants: 1247,
      endDate: '2024-12-31',
      category: 'Crypto',
      status: 'active'
    },
    {
      id: '2',
      title: 'Ethereum 2.0 staking rewards above 5%?',
      description: 'Will Ethereum 2.0 staking rewards exceed 5% APY for at least 30 consecutive days in 2024?',
      yesPrice: 0.42,
      noPrice: 0.58,
      volume: '$890K',
      participants: 623,
      endDate: '2024-12-31',
      category: 'Crypto',
      status: 'active'
    },
    {
      id: '3',
      title: 'Apple to announce VR headset successor?',
      description: 'Will Apple announce a successor to the Vision Pro VR headset before June 2025?',
      yesPrice: 0.73,
      noPrice: 0.27,
      volume: '$1.8M',
      participants: 892,
      endDate: '2025-06-30',
      category: 'Tech',
      status: 'active'
    }
  ]);

  const [positions] = useState<Position[]>([
    {
      marketId: '1',
      side: 'yes',
      shares: 100,
      avgPrice: 0.60,
      currentValue: 65,
      pnl: 5
    },
    {
      marketId: '2',
      side: 'no',
      shares: 50,
      avgPrice: 0.55,
      currentValue: 29,
      pnl: -0.5
    }
  ]);

  // Function to fetch proposals for a decision
  const fetchProposalsForDecision = async (_decisionId: number, proposalIds: string[]): Promise<Proposal[]> => {
    if (!quantumMarketContract || proposalIds.length === 0) return [];
    
    const proposals: Proposal[] = [];
    
    for (const proposalId of proposalIds) {
      try {
        const proposalData = await quantumMarketContract.proposalInfo(proposalId);
        
        if (proposalData.exists) {
          proposals.push({
            id: proposalId,
            decisionId: Number(proposalData.decisionId),
            metadata: proposalData.metadata || `Proposal ${proposalId.slice(0, 8)}...`,
            poolKey: {
              currency0: proposalData.poolKey.currency0,
              currency1: proposalData.poolKey.currency1,
              fee: Number(proposalData.poolKey.fee),
              tickSpacing: Number(proposalData.poolKey.tickSpacing),
              hooks: proposalData.poolKey.hooks
            },
            exists: proposalData.exists
          });
        }
      } catch (error) {
        console.log(`Failed to fetch proposal ${proposalId}:`, error);
      }
    }
    
    return proposals;
  };

  // Function to fetch real markets from blockchain
  const fetchRealMarkets = async () => {
    if (!quantumMarketContract || !provider) return;
    
    setIsLoadingMarkets(true);
    try {
      const markets: Market[] = [];
      
      // Get the latest decision ID to know how many decisions/markets exist
      const nextDecisionId = await quantumMarketContract.nextDecisionId();
      const marketCount = Number(nextDecisionId);
      
      console.log(`Fetching markets/decisions. Next ID: ${marketCount}`);
      
      // Fetch each market/decision (starting from 1 as IDs are 1-indexed)
      // Check a few extra IDs beyond nextDecisionId to be safe in case of contract quirks
      const maxIdToCheck = Math.max(marketCount + 2, 10); // Check at least 10 IDs or nextId + 2
      
      for (let i = 1; i <= maxIdToCheck; i++) {
        console.log(`Checking ID ${i}...`);
        
        try {
          let market: Market | null = null;
          
          // Try to get decision data first (since script demo creates decisions)
          try {
            const decisionData = await quantumMarketContract.decisions(i);
            console.log(`Decision ${i} data:`, decisionData);
            
            // Check if decision exists (has metadata)
            if (decisionData && decisionData.metadata && decisionData.metadata.trim() !== '') {
              console.log(`Found decision ${i}: ${decisionData.metadata}`);
              console.log(`Decision ${i} proposals:`, decisionData.proposals);
              
              // Fetch proposals for this decision
              const proposals = await fetchProposalsForDecision(i, decisionData.proposals || []);
              console.log(`Fetched ${proposals.length} proposals for decision ${i}:`, proposals);
              
              market = {
                id: i.toString(),
                title: decisionData.metadata || `Decision #${i}`,
                description: `Quantum decision with ${proposals.length} proposal${proposals.length !== 1 ? 's' : ''} (ID: ${i})`,
                yesPrice: 0.5,
                noPrice: 0.5,
                volume: '0',
                participants: proposals.length,
                endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                category: 'Decision',
                status: decisionData.settled ? 'settled' : 'active',
                decisionId: i,
                proposals: proposals,
                winningProposalId: decisionData.winningProposalId || undefined
              };
            }
          } catch (decisionError) {
            console.log(`No decision found for ID ${i}:`, decisionError);
          }
          
          // If no decision found, try to get market data (from createMarket)
          if (!market) {
            try {
              const marketData = await quantumMarketContract.markets(i);
              console.log(`Market ${i} data:`, marketData);
              
              if (marketData && marketData.id && Number(marketData.id) > 0) {
                console.log(`Found market ${i}: ${marketData.title}`);
                
                const contractMarket: ContractMarket = {
                  id: Number(marketData.id),
                  createdAt: Number(marketData.createdAt),
                  minDeposit: marketData.minDeposit,
                  deadline: Number(marketData.deadline),
                  creator: marketData.creator,
                  marketToken: marketData.marketToken,
                  resolver: marketData.resolver,
                  status: Number(marketData.status) as MarketStatus,
                  title: marketData.title
                };

                market = {
                  id: i.toString(),
                  title: contractMarket.title || `Market #${i}`,
                  description: `On-chain quantum market created by ${contractMarket.creator.slice(0, 6)}...${contractMarket.creator.slice(-4)}`,
                  yesPrice: 0.5,
                  noPrice: 0.5,
                  volume: '0',
                  participants: 0,
                  endDate: new Date(contractMarket.deadline * 1000).toISOString().split('T')[0],
                  category: 'Market',
                  status: contractMarket.status === MarketStatus.OPEN ? 'active' : 
                         contractMarket.status === MarketStatus.RESOLVED_YES || contractMarket.status === MarketStatus.RESOLVED_NO ? 'settled' : 'pending',
                  contractData: contractMarket,
                  decisionId: i
                };
              }
            } catch (marketError) {
              console.log(`No market found for ID ${i}:`, marketError);
            }
          }
          
          if (market) {
            console.log(`Adding market/decision to list:`, market);
            markets.push(market);
          } else {
            console.log(`No market or decision found for ID ${i}`);
          }
        } catch (error) {
          console.log(`Error fetching market/decision ${i}:`, error);
        }
      }
      
      console.log(`Total markets/decisions found: ${markets.length}`, markets);
      setRealMarkets(markets);
    } catch (error) {
      console.error('Failed to fetch markets:', error);
    }
    setIsLoadingMarkets(false);
  };

  // Function to create a proposal for a decision (anyone can call this!)
  const createProposalForDecision = async (decisionId: number, proposalMetadata: string) => {
    if (!orchestratorContract || !quantumMarketContract || !user?.wallet?.address) {
      throw new Error('Contracts not initialized or wallet not connected');
    }

    try {
      // Simplified approach: Just register the proposal without creating a new pool
      // We'll reuse the existing pool from the script demo or create a dummy pool key
      
      // Step 1: Check if we have existing tokens, if not deploy them
      let poolKey;
      try {
        // Try to get the last pool key (from script demo or previous proposals)
        const poolKeyResult = await orchestratorContract.lastPoolKey();
        
        // Check if we have a valid pool key
        if (poolKeyResult[0] && poolKeyResult[0] !== ethers.ZeroAddress) {
          poolKey = {
            currency0: poolKeyResult[0],
            currency1: poolKeyResult[1], 
            fee: poolKeyResult[2],
            tickSpacing: poolKeyResult[3],
            hooks: poolKeyResult[4]
          };
          console.log('Reusing existing pool key:', poolKey);
        } else {
          throw new Error('No existing pool found');
        }
      } catch (error) {
        console.log('No existing pool found, creating new one...');
        
        // Deploy tokens if needed
        let token0Address;
        try {
          token0Address = await orchestratorContract.token0();
          if (!token0Address || token0Address === ethers.ZeroAddress) {
            throw new Error('No tokens deployed');
          }
        } catch (error) {
          console.log('Deploying tokens...');
          const deployTx = await orchestratorContract.deployTokens(QLICK_CONFIG.MINT_AMOUNT);
          await deployTx.wait();
          token0Address = await orchestratorContract.token0();
        }

        // Try to create pool (may fail if pool already exists, which is ok)
        try {
          const createPoolTx = await orchestratorContract['createPoolAndAddLiquidity(address,uint24,int24,uint160,int24,int24,uint128,uint256,uint256)'](
            QLICK_CONFIG.QUANTUM_MARKET_HOOK,
            QLICK_CONFIG.FEE,
            QLICK_CONFIG.TICK_SPACING,
            QLICK_CONFIG.SQRT_PRICE_X96,
            QLICK_CONFIG.TICK_LOWER,
            QLICK_CONFIG.TICK_UPPER,
            QLICK_CONFIG.LIQUIDITY_DESIRED,
            QLICK_CONFIG.AMOUNT_0_MAX,
            QLICK_CONFIG.AMOUNT_1_MAX
          );
          await createPoolTx.wait();
          console.log('Successfully created new pool');
        } catch (poolError) {
          console.log('Pool creation failed (may already exist):', poolError);
          // Continue anyway - we'll try to get the pool key
        }

        // Get the pool key
        const poolKeyResult = await orchestratorContract.lastPoolKey();
        poolKey = {
          currency0: poolKeyResult[0],
          currency1: poolKeyResult[1], 
          fee: poolKeyResult[2],
          tickSpacing: poolKeyResult[3],
          hooks: poolKeyResult[4]
        };
      }

      // Step 2: Create unique proposal ID
      const timestamp = Math.floor(Date.now() / 1000);
      const proposalId = ethers.keccak256(ethers.toUtf8Bytes(`proposal-${decisionId}-${timestamp}-${user.wallet.address}`));
      
      // Step 3: Register the proposal with the decision
      console.log('Registering proposal with decision...');
      console.log('Decision ID:', decisionId);
      console.log('Proposal ID:', proposalId);
      console.log('Metadata:', proposalMetadata);
      console.log('Pool Key:', poolKey);
      
      const createProposalTx = await quantumMarketContract.createProposal(
        decisionId,
        proposalId,
        proposalMetadata,
        poolKey
      );
      await createProposalTx.wait();

      console.log(`Successfully created proposal ${proposalId} for decision ${decisionId}`);
      return { proposalId, poolKey };
    } catch (error) {
      console.error('Failed to create proposal:', error);
      
      // Add more specific error handling
      if (error instanceof Error) {
        if (error.message.includes('0x7983c051')) {
          throw new Error('Pool creation failed - this might be due to pool already existing or invalid parameters');
        } else if (error.message.includes('settled')) {
          throw new Error('Cannot add proposals to a settled decision');
        } else if (error.message.includes('exists')) {
          throw new Error('A proposal with this ID already exists - please try again');
        } else if (error.message.includes('no hook')) {
          throw new Error('Pool must have a hook - invalid pool configuration');
        }
      }
      
      throw error;
    }
  };

  // Function to create a proposal for a market
  const createProposalForMarket = async (marketId: number) => {
    if (!orchestratorContract || !quantumMarketContract || !user?.wallet?.address) {
      throw new Error('Contracts not initialized or wallet not connected');
    }

    try {
      // First, deploy tokens for this market if needed
      const deployTokensTx = await orchestratorContract.deployTokens(QLICK_CONFIG.MINT_AMOUNT);
      await deployTokensTx.wait();

      // Create pool and add liquidity
      const createPoolTx = await orchestratorContract['createPoolAndAddLiquidity(address,uint24,int24,uint160,uint128)'](
        QLICK_CONFIG.QUANTUM_MARKET_HOOK,
        QLICK_CONFIG.FEE,
        QLICK_CONFIG.TICK_SPACING,
        QLICK_CONFIG.SQRT_PRICE_X96,
        QLICK_CONFIG.LIQUIDITY_DESIRED
      );
      await createPoolTx.wait();

      // Get the pool key
      const poolKeyResult = await orchestratorContract.lastPoolKey();
      const poolKey = {
        currency0: poolKeyResult[0],
        currency1: poolKeyResult[1], 
        fee: poolKeyResult[2],
        tickSpacing: poolKeyResult[3],
        hooks: poolKeyResult[4]
      };

      // Create proposal ID
      const timestamp = Math.floor(Date.now() / 1000);
      const proposalId = ethers.keccak256(ethers.toUtf8Bytes(`market-${marketId}-proposal-${timestamp}`));
      
      // Create the proposal
      const createProposalTx = await quantumMarketContract.createProposal(
        marketId,
        proposalId,
        `Proposal for Market ${marketId}`,
        poolKey
      );
      await createProposalTx.wait();

      return { proposalId, poolKey };
    } catch (error) {
      console.error('Failed to create proposal:', error);
      throw error;
    }
  };

  // Function to fetch user positions from blockchain
  const fetchUserPositions = async () => {
    if (!quantumMarketContract || !user?.wallet?.address) return [];
    
    try {
      const positions: Position[] = [];
      
      // Get user's deposits across all markets
      const nextDecisionId = await quantumMarketContract.nextDecisionId();
      const marketCount = Number(nextDecisionId);
      
      for (let i = 1; i < marketCount; i++) {
        try {
          const deposit = await quantumMarketContract.deposits(i, user.wallet.address);
          if (deposit > 0) {
            const marketData = await quantumMarketContract.markets(i);
            if (marketData.id && Number(marketData.id) > 0) {
              positions.push({
                marketId: i.toString(),
                side: 'yes', // Default - would need to track actual positions
                shares: Number(ethers.formatEther(deposit)),
                avgPrice: 1.0, // Would need to calculate from trades
                currentValue: Number(ethers.formatEther(deposit)),
                pnl: 0 // Would need to calculate based on current market prices
              });
            }
          }
        } catch (error) {
          console.log(`No position found for market ${i}`);
        }
      }
      
      return positions;
    } catch (error) {
      console.error('Failed to fetch user positions:', error);
      return [];
    }
  };

  // Function to resolve a market
  const resolveMarket = async (marketId: number, outcome: boolean) => {
    if (!quantumMarketContract) {
      throw new Error('Contract not initialized');
    }

    try {
      const tx = await quantumMarketContract.resolveMarket(marketId, outcome);
      await tx.wait();
      
      // Refresh markets after resolution
      await fetchRealMarkets();
      
      return tx;
    } catch (error) {
      console.error('Failed to resolve market:', error);
      throw error;
    }
  };

  // Function to create a new market (using the same approach as script demo)
  const createNewMarket = async (title: string, deadline: number, minDeposit: string = '0') => {
    if (!orchestratorContract || !quantumMarketContract || !user?.wallet?.address) {
      throw new Error('Contracts not initialized or wallet not connected');
    }

    try {
      // Method 1: Try using the orchestrator's createMarket (if factory is properly set)
      try {
        // First, ensure we have tokens deployed
        let token0Address;
        try {
          token0Address = await orchestratorContract.token0();
          if (!token0Address || token0Address === ethers.ZeroAddress) {
            throw new Error('No tokens deployed');
          }
        } catch (error) {
          // Deploy tokens if they don't exist
          console.log('Deploying tokens first...');
          const deployTx = await orchestratorContract.deployTokens(QLICK_CONFIG.MINT_AMOUNT);
          await deployTx.wait();
          token0Address = await orchestratorContract.token0();
        }

        // Check if factory is set, but don't try to set it here (let orchestrator handle it)
        const currentFactory = await quantumMarketContract.factory();
        console.log('Current factory:', currentFactory);
        console.log('Orchestrator address:', orchestratorContract.target);
        
        const tx = await orchestratorContract.createMarket(
          quantumMarketContract.target,
          token0Address, // Use the deployed token as market token
          user.wallet.address, // User as resolver for demo
          ethers.parseEther(minDeposit || '0'),
          deadline,
          title
        );
        
        await tx.wait();
        
        // Refresh markets after creation
        await fetchRealMarkets();
        
        return tx;
      } catch (orchestratorError) {
        console.log('Orchestrator createMarket failed, trying direct approach:', orchestratorError);
        
        // Method 2: Use createDecision directly (like script demo) and create a market-like structure
        const decisionMetadata = `${title} (Created: ${new Date().toLocaleString()})`;
        
        const createDecisionTx = await quantumMarketContract.createDecision(decisionMetadata);
        const receipt = await createDecisionTx.wait();
        
        // Parse decision ID from events
        let decisionId;
        const decisionCreatedEvent = receipt.logs.find((log: any) => {
          try {
            const parsed = quantumMarketContract.interface.parseLog(log);
            return parsed && parsed.name === 'DecisionCreated';
          } catch {
            return false;
          }
        });
        
        if (decisionCreatedEvent) {
          const parsed = quantumMarketContract.interface.parseLog(decisionCreatedEvent);
          if (parsed) {
            decisionId = parsed.args.decisionId;
          } else {
            const nextId = await quantumMarketContract.nextDecisionId();
            decisionId = Number(nextId) - 1;
          }
        } else {
          const nextId = await quantumMarketContract.nextDecisionId();
          decisionId = Number(nextId) - 1;
        }
        
        console.log('Created decision with ID:', decisionId);
        
        // Refresh markets after creation
        await fetchRealMarkets();
        
        return createDecisionTx;
      }
    } catch (error) {
      console.error('Failed to create market:', error);
      throw error;
    }
  };

  // Initialize provider and fetch wallet balance
  useEffect(() => {
    const initializeWallet = async () => {
      if (authenticated && user?.wallet?.address && window.ethereum) {
        try {
          const ethProvider = new ethers.BrowserProvider(window.ethereum);
          setProvider(ethProvider);
          
          // Get signer for contract interactions
          const signer = await ethProvider.getSigner();
          
          // Initialize contract instances
          const orchestrator = new ethers.Contract(
            QLICK_CONFIG.QLICK_ORCHESTRATOR,
            ORCHESTRATOR_ABI,
            signer
          );
          
          const quantumMarket = new ethers.Contract(
            QLICK_CONFIG.QUANTUM_MARKET_MANAGER,
            QUANTUM_MARKET_MANAGER_ABI,
            signer
          );
          
          setOrchestratorContract(orchestrator);
          setQuantumMarketContract(quantumMarket);
          
          // Fetch wallet balance
          const balance = await ethProvider.getBalance(user.wallet.address);
          setWalletBalance(ethers.formatEther(balance));
        } catch (error) {
          console.error('Failed to initialize wallet:', error);
          setWalletBalance('0');
          setOrchestratorContract(null);
          setQuantumMarketContract(null);
        }
      } else {
        setProvider(null);
        setWalletBalance('0');
        setOrchestratorContract(null);
        setQuantumMarketContract(null);
      }
    };

    initializeWallet();
  }, [authenticated, user?.wallet?.address]);

  // Fetch real markets when contracts are ready
  useEffect(() => {
    if (quantumMarketContract && provider) {
      fetchRealMarkets();
    }
  }, [quantumMarketContract, provider]);

  // Fetch user positions when contracts and user are ready
  useEffect(() => {
    const loadPositions = async () => {
      if (quantumMarketContract && user?.wallet?.address) {
        setIsLoadingPositions(true);
        const positions = await fetchUserPositions();
        setRealPositions(positions);
        setIsLoadingPositions(false);
      }
    };
    
    loadPositions();
  }, [quantumMarketContract, user?.wallet?.address]);

  // Helper function to add script output with delay
  const addScriptOutput = (message: string, delay: number = 800) => {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        setScriptOutput(prev => [...prev, message]);
        resolve();
      }, delay);
    });
  };

  // Helper function to wait for transaction
  const waitForTransaction = async (tx: any, description: string) => {
    await addScriptOutput(`📝 ${description}`, 500);
    await addScriptOutput(`🔗 Transaction hash: ${tx.hash}`, 300);
    await addScriptOutput('⏳ Waiting for confirmation...', 500);
    
    const receipt = await tx.wait();
    await addScriptOutput(`✅ Confirmed in block ${receipt.blockNumber}`, 500);
    await addScriptOutput(`⛽ Gas used: ${receipt.gasUsed.toString()}`, 300);
    
    return receipt;
  };

  // Execute real Qlick script with actual contract calls
  const executeQlickScript = async (flowType: 'basic' | 'extended') => {
    if (!authenticated || !user?.wallet?.address || !provider || !orchestratorContract || !quantumMarketContract) {
      setScriptOutput(['❌ Error: Wallet not connected or contracts not initialized. Please connect your wallet first.']);
      return;
    }

    setIsExecutingScript(true);
    setScriptOutput([]);
    
    try {
      const walletAddress = user.wallet.address;
      
      await addScriptOutput('🚀 Starting Qlick Quantum Markets Flow...', 500);
      await addScriptOutput(`🔍 Connected to wallet: ${walletAddress}`, 300);
      await addScriptOutput(`💰 Wallet balance: ${parseFloat(walletBalance).toFixed(4)} ETH`, 300);
      await addScriptOutput('🌐 Connected to Unichain Sepolia network', 300);
      await addScriptOutput('', 200);

      if (flowType === 'basic') {
        await runBasicQuantumFlow();
      } else {
        await runExtendedQuantumFlow();
      }
      
    } catch (error) {
      console.error('Script execution error:', error);
      await addScriptOutput('', 200);
      await addScriptOutput(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`, 500);
      
      // Add helpful error context
      if (error instanceof Error) {
        if (error.message.includes('user rejected')) {
          await addScriptOutput('💡 Transaction was rejected by user', 300);
        } else if (error.message.includes('insufficient funds')) {
          await addScriptOutput('💡 Insufficient funds for transaction', 300);
        } else if (error.message.includes('network')) {
          await addScriptOutput('💡 Network connection issue - please try again', 300);
        }
      }
    }
    
    setIsExecutingScript(false);
  };

  // Basic quantum market flow with real contract calls
  const runBasicQuantumFlow = async () => {
    try {
      // Step 1: Deploy fresh tokens
      await addScriptOutput('Step 1: Deploying fresh tokens...', 500);
      const deployTokensTx = await orchestratorContract!.deployTokens(QLICK_CONFIG.MINT_AMOUNT);
      await waitForTransaction(deployTokensTx, 'Deploying fresh demo tokens');
      await addScriptOutput('', 200);

      // Step 2: Create fresh pool + add liquidity
      await addScriptOutput('Step 2: Creating fresh pool and adding liquidity...', 500);
      
      try {
        // Try 5-parameter version first
        await addScriptOutput('📝 Trying 5-parameter pool creation...', 300);
        const createPoolTx = await orchestratorContract!['createPoolAndAddLiquidity(address,uint24,int24,uint160,uint128)'](
          QLICK_CONFIG.QUANTUM_MARKET_HOOK,
          QLICK_CONFIG.FEE,
          QLICK_CONFIG.TICK_SPACING,
          QLICK_CONFIG.SQRT_PRICE_X96,
          QLICK_CONFIG.LIQUIDITY_DESIRED
        );
        await waitForTransaction(createPoolTx, 'Creating fresh pool and adding liquidity (5 params)');
      } catch (error) {
        await addScriptOutput('⚠️ 5-parameter version failed, trying 9-parameter version...', 500);
        try {
          const createPoolTx = await orchestratorContract!['createPoolAndAddLiquidity(address,uint24,int24,uint160,int24,int24,uint128,uint256,uint256)'](
            QLICK_CONFIG.QUANTUM_MARKET_HOOK,
            QLICK_CONFIG.FEE,
            QLICK_CONFIG.TICK_SPACING,
            QLICK_CONFIG.SQRT_PRICE_X96,
            QLICK_CONFIG.TICK_LOWER,
            QLICK_CONFIG.TICK_UPPER,
            QLICK_CONFIG.LIQUIDITY_DESIRED,
            QLICK_CONFIG.AMOUNT_0_MAX,
            QLICK_CONFIG.AMOUNT_1_MAX
          );
          await waitForTransaction(createPoolTx, 'Creating fresh pool and adding liquidity (9 params)');
        } catch (error2) {
          throw new Error('Failed to create pool - both methods failed');
        }
      }
      await addScriptOutput('', 200);

      // Step 3: Create fresh decision
      await addScriptOutput('Step 3: Creating fresh quantum decision...', 500);
      const timestamp = Math.floor(Date.now() / 1000);
      const decisionMetadata = `Quantum Demo Decision ${timestamp}`;
      
      const createDecisionTx = await quantumMarketContract!.createDecision(decisionMetadata);
      const receipt = await waitForTransaction(createDecisionTx, 'Creating fresh quantum decision');
      
      // Parse decision ID from events
      let decisionId;
      const decisionCreatedEvent = receipt.logs.find((log: any) => {
        try {
          const parsed = quantumMarketContract!.interface.parseLog(log);
          return parsed && parsed.name === 'DecisionCreated';
        } catch {
          return false;
        }
      });
      
      if (decisionCreatedEvent) {
        const parsed = quantumMarketContract!.interface.parseLog(decisionCreatedEvent);
        if (parsed) {
          decisionId = parsed.args.decisionId;
          await addScriptOutput(`✅ Created quantum decision with ID: ${decisionId}`, 500);
        } else {
          const nextId = await quantumMarketContract!.nextDecisionId();
          decisionId = Number(nextId) - 1;
          await addScriptOutput(`📋 Using calculated decision ID: ${decisionId}`, 500);
        }
      } else {
        const nextId = await quantumMarketContract!.nextDecisionId();
        decisionId = Number(nextId) - 1;
        await addScriptOutput(`📋 Using calculated decision ID: ${decisionId}`, 500);
      }
      await addScriptOutput('', 200);

      // Step 4: Create proposal to register pool
      await addScriptOutput('Step 4: Creating quantum proposal...', 500);
      const poolKeyResult = await orchestratorContract!.lastPoolKey();
      const poolKey = {
        currency0: poolKeyResult[0],
        currency1: poolKeyResult[1], 
        fee: poolKeyResult[2],
        tickSpacing: poolKeyResult[3],
        hooks: poolKeyResult[4]
      };
      
      const proposalId = ethers.keccak256(ethers.toUtf8Bytes(`quantum-proposal-${timestamp}`));
      const createProposalTx = await quantumMarketContract!.createProposal(
        decisionId,
        proposalId,
        `Quantum Demo Proposal ${timestamp}`,
        poolKey
      );
      await waitForTransaction(createProposalTx, 'Creating quantum proposal and registering pool');
      await addScriptOutput('', 200);

      // Step 5: Trade on the proposal
      await addScriptOutput('Step 5: Trading on quantum proposal...', 500);
      const swapTx = await orchestratorContract!.swapOnPool(true, QLICK_CONFIG.SWAP_AMOUNT);
      await waitForTransaction(swapTx, 'Executing swap on quantum pool');
      await addScriptOutput('', 200);

      // Step 6: Settle decision
      await addScriptOutput('Step 6: Settling quantum decision...', 500);
      await addScriptOutput(`🏆 Winning proposal ID: ${proposalId}`, 300);
      const settleTx = await quantumMarketContract!.settle(decisionId, proposalId);
      await waitForTransaction(settleTx, 'Settling quantum decision with winning proposal');
      await addScriptOutput('', 200);

      // Success summary
      await addScriptOutput('🎉 Quantum Market Flow completed successfully!', 800);
      await addScriptOutput(`📊 Decision ID: ${decisionId}`, 300);
      await addScriptOutput(`🔗 Proposal ID: ${proposalId}`, 300);
      await addScriptOutput(`💼 Your wallet: ${user?.wallet?.address}`, 300);

    } catch (error) {
      throw error;
    }
  };

  // Extended quantum market flow
  const runExtendedQuantumFlow = async () => {
    try {
      // Step 1: Set factory
      await addScriptOutput('Step 1: Setting quantum factory...', 500);
      try {
        const setFactoryTx = await quantumMarketContract!.setFactory(QLICK_CONFIG.QLICK_ORCHESTRATOR);
        await waitForTransaction(setFactoryTx, 'Setting orchestrator as quantum factory');
      } catch (error) {
        if (error instanceof Error && error.message.includes('set')) {
          await addScriptOutput('⚠️ Factory already set, continuing...', 300);
        } else {
          throw error;
        }
      }
      await addScriptOutput('', 200);

      const timestamp = Math.floor(Date.now() / 1000);
      const decisions = [];

      // Create 3 quantum markets
      for (let i = 1; i <= 3; i++) {
        await addScriptOutput(`=== Creating Quantum Market ${i} ===`, 500);
        
        // Deploy tokens
        await addScriptOutput(`Step ${i}.1: Deploying tokens for quantum market ${i}...`, 300);
        const deployTokensTx = await orchestratorContract!.deployTokens(QLICK_CONFIG.MINT_AMOUNT);
        await waitForTransaction(deployTokensTx, `Deploying tokens for quantum market ${i}`);

        // Create pool
        await addScriptOutput(`Step ${i}.2: Creating pool for quantum market ${i}...`, 300);
        try {
          const createPoolTx = await orchestratorContract!['createPoolAndAddLiquidity(address,uint24,int24,uint160,uint128)'](
            QLICK_CONFIG.QUANTUM_MARKET_HOOK,
            QLICK_CONFIG.FEE,
            QLICK_CONFIG.TICK_SPACING,
            QLICK_CONFIG.SQRT_PRICE_X96,
            QLICK_CONFIG.LIQUIDITY_DESIRED
          );
          await waitForTransaction(createPoolTx, `Creating pool for quantum market ${i}`);
        } catch (error) {
          await addScriptOutput(`⚠️ Pool creation failed for market ${i}, continuing...`, 300);
        }

        // Create decision
        await addScriptOutput(`Step ${i}.3: Creating quantum decision for market ${i}...`, 300);
        const decisionMetadata = `Extended Quantum Market ${i} Decision ${timestamp}`;
        const createDecisionTx = await quantumMarketContract!.createDecision(decisionMetadata);
        const receipt = await waitForTransaction(createDecisionTx, `Creating quantum decision for market ${i}`);
        
        // Get decision ID
        const decisionCreatedEvent = receipt.logs.find((log: any) => {
          try {
            const parsed = quantumMarketContract!.interface.parseLog(log);
            return parsed && parsed.name === 'DecisionCreated';
          } catch {
            return false;
          }
        });
        
        let decisionId;
        if (decisionCreatedEvent) {
          const parsed = quantumMarketContract!.interface.parseLog(decisionCreatedEvent);
          decisionId = parsed ? parsed.args.decisionId : await quantumMarketContract!.nextDecisionId() - 1;
        } else {
          decisionId = await quantumMarketContract!.nextDecisionId() - 1;
        }
        
        await addScriptOutput(`✅ Created quantum decision ${i} with ID: ${decisionId}`, 300);

        // Create proposal
        const poolKeyResult = await orchestratorContract!.lastPoolKey();
        const poolKey = {
          currency0: poolKeyResult[0],
          currency1: poolKeyResult[1], 
          fee: poolKeyResult[2],
          tickSpacing: poolKeyResult[3],
          hooks: poolKeyResult[4]
        };
        
        const proposalId = ethers.keccak256(ethers.toUtf8Bytes(`extended-quantum-proposal-${i}-${timestamp}`));
        const createProposalTx = await quantumMarketContract!.createProposal(
          decisionId,
          proposalId,
          `Extended Quantum Market ${i} Proposal ${timestamp}`,
          poolKey
        );
        await waitForTransaction(createProposalTx, `Creating quantum proposal for market ${i}`);

        decisions.push({ id: decisionId, proposalId });
        await addScriptOutput('', 200);
      }

      // Trade on pools
      await addScriptOutput('Step 5: Trading on quantum pools...', 500);
      try {
        const swapTx = await orchestratorContract!.swapOnPool(true, QLICK_CONFIG.SWAP_AMOUNT);
        await waitForTransaction(swapTx, 'Executing demo swap on quantum pools');
      } catch (error) {
        await addScriptOutput('⚠️ Trading step skipped due to pool registration timing', 300);
      }
      await addScriptOutput('', 200);

      // Settle all decisions
      await addScriptOutput('Step 6: Settling all quantum decisions...', 500);
      for (let i = 0; i < decisions.length; i++) {
        const decision = decisions[i];
        await addScriptOutput(`Settling quantum decision ${i + 1} (ID: ${decision.id})...`, 300);
        const settleTx = await quantumMarketContract!.settle(decision.id, decision.proposalId);
        await waitForTransaction(settleTx, `Settling quantum decision ${i + 1}`);
      }
      await addScriptOutput('', 200);

      // Success summary
      await addScriptOutput('🎉 Extended Quantum Market Flow completed successfully!', 800);
      await addScriptOutput(`📊 Created ${decisions.length} quantum decisions`, 300);
      await addScriptOutput(`🔗 All quantum markets settled`, 300);
      await addScriptOutput(`💼 Your wallet: ${user?.wallet?.address}`, 300);

    } catch (error) {
      throw error;
    }
  };

  const formatPrice = (price: number) => `$${price.toFixed(2)}`;
  const formatPercentage = (price: number) => `${(price * 100).toFixed(0)}%`;

  const AddProposalButton = ({ decisionId, onProposalCreated }: { decisionId: number; onProposalCreated: () => void }) => {
    const [isCreating, setIsCreating] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [proposalTitle, setProposalTitle] = useState('');

    const handleCreate = async () => {
      if (!proposalTitle.trim()) return;

      setIsCreating(true);
      try {
        await createProposalForDecision(decisionId, proposalTitle.trim());
        setProposalTitle('');
        setShowForm(false);
        onProposalCreated();
        alert('Proposal created successfully!');
      } catch (error) {
        console.error('Failed to create proposal:', error);
        let errorMessage = 'Failed to create proposal. ';

        if (error instanceof Error) {
          if (error.message.includes('settled')) {
            errorMessage += 'This decision has already been settled.';
          } else if (error.message.includes('exists')) {
            errorMessage += 'A proposal with this ID already exists.';
          } else if (error.message.includes('user rejected')) {
            errorMessage += 'Transaction was rejected.';
          } else {
            errorMessage += error.message;
          }
        }

        alert(errorMessage + ' Please try again.');
      }
      setIsCreating(false);
    };

    if (showForm) {
      return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-[31px] p-6 border border-black/10 w-full max-w-md shadow-lg">
            <h3 className="text-black font-semibold text-lg mb-4 font-['Instrument_Serif']">Add Proposal to Decision #{decisionId}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-black text-sm mb-2 font-['Instrument_Sans'] font-medium">Proposal Title/Description</label>
                <input
                  type="text"
                  value={proposalTitle}
                  onChange={(e) => setProposalTitle(e.target.value)}
                  className="w-full bg-black/5 border border-black/20 rounded-[16px] px-4 py-3 text-black focus:border-[#64C967] focus:outline-none font-['Instrument_Sans']"
                  placeholder="Describe your proposed solution..."
                />
              </div>
              <div className="mb-4 p-3 bg-[#64C967]/10 border border-[#64C967]/30 rounded-[16px]">
                <p className="text-black/80 text-sm font-['Instrument_Sans']">
                  💡 <strong>Anyone can propose!</strong> Your proposal will reuse existing pools for trading.
                </p>
              </div>

              {/* Debug info */}
              <div className="mb-4 p-3 bg-black/5 rounded-[16px] border border-black/10 text-xs text-black/60 font-['Instrument_Sans']">
                <div>Decision ID: {decisionId}</div>
                <div>Your Address: {user?.wallet?.address}</div>
                <div>Contracts Ready: {orchestratorContract && quantumMarketContract ? 'Yes' : 'No'}</div>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={handleCreate}
                  disabled={isCreating || !proposalTitle.trim() || !authenticated}
                  className="flex-1 bg-[#64C967] hover:bg-[#64C967]/90 text-black disabled:bg-black/20 disabled:text-black/50 font-['Instrument_Sans'] font-bold rounded-[31px]"
                >
                  {isCreating ? 'Creating...' : 'Add Proposal'}
                </Button>
                <Button
                  onClick={() => setShowForm(false)}
                  variant="outline"
                  className="flex-1 border-black/20 text-black hover:bg-black/5 font-['Instrument_Sans'] rounded-[31px]"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <Button
        onClick={() => setShowForm(true)}
        disabled={!authenticated}
        size="sm"
        className="bg-[#64C967] hover:bg-[#64C967]/90 text-black disabled:bg-black/20 disabled:text-black/50 font-['Instrument_Sans'] font-bold rounded-[31px]"
      >
        Add Proposal
      </Button>
    );
  };

  const CreateMarketButton = ({ onMarketCreated }: { onMarketCreated: () => void }) => {
    const [isCreating, setIsCreating] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [title, setTitle] = useState('');
    const [deadline, setDeadline] = useState('');

    const handleCreate = async () => {
      if (!title.trim() || !deadline) return;

      setIsCreating(true);
      try {
        const deadlineTimestamp = Math.floor(new Date(deadline).getTime() / 1000);

        // Validate deadline is in the future
        if (deadlineTimestamp <= Math.floor(Date.now() / 1000)) {
          alert('Deadline must be in the future');
          setIsCreating(false);
          return;
        }

        await createNewMarket(title.trim(), deadlineTimestamp);
        setTitle('');
        setDeadline('');
        setShowForm(false);
        onMarketCreated();
        alert('Market created successfully!');
      } catch (error) {
        console.error('Failed to create market:', error);
        let errorMessage = 'Failed to create market. ';

        if (error instanceof Error) {
          if (error.message.includes('factory')) {
            errorMessage += 'Factory not set properly. ';
          } else if (error.message.includes('tokens')) {
            errorMessage += 'Token deployment failed. ';
          } else if (error.message.includes('user rejected')) {
            errorMessage += 'Transaction was rejected.';
          } else {
            errorMessage += error.message;
          }
        }

        alert(errorMessage + ' Please try again.');
      }
      setIsCreating(false);
    };

    if (showForm) {
      return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-[31px] p-6 border border-black/10 w-full max-w-md shadow-lg">
            <h3 className="text-black font-semibold text-lg mb-4 font-['Instrument_Serif']">Create New Market</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-black text-sm mb-2 font-['Instrument_Sans'] font-medium">Market Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-black/5 border border-black/20 rounded-[16px] px-4 py-3 text-black focus:border-[#64C967] focus:outline-none font-['Instrument_Sans']"
                  placeholder="Enter market question..."
                />
              </div>
              <div>
                <label className="block text-black text-sm mb-2 font-['Instrument_Sans'] font-medium">Deadline</label>
                <input
                  type="datetime-local"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full bg-black/5 border border-black/20 rounded-[16px] px-4 py-3 text-black focus:border-[#64C967] focus:outline-none font-['Instrument_Sans']"
                />
              </div>
              <div className="mb-4 p-3 bg-black/5 rounded-[16px] border border-black/10 text-xs text-black/60 font-['Instrument_Sans']">
                <div>Orchestrator: {QLICK_CONFIG.QLICK_ORCHESTRATOR}</div>
                <div>Market Manager: {QLICK_CONFIG.QUANTUM_MARKET_MANAGER}</div>
                <div>Connected: {authenticated ? 'Yes' : 'No'}</div>
                <div>Wallet: {user?.wallet?.address ? `${user.wallet.address.slice(0, 6)}...${user.wallet.address.slice(-4)}` : 'None'}</div>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={handleCreate}
                  disabled={isCreating || !title.trim() || !deadline || !authenticated}
                  className="flex-1 bg-[#64C967] hover:bg-[#64C967]/90 text-black disabled:bg-black/20 disabled:text-black/50 font-['Instrument_Sans'] font-bold rounded-[31px]"
                >
                  {isCreating ? 'Creating...' : 'Create Market'}
                </Button>
                <Button
                  onClick={() => setShowForm(false)}
                  variant="outline"
                  className="flex-1 border-black/20 text-black hover:bg-black/5 font-['Instrument_Sans'] rounded-[31px]"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <Button
        onClick={() => setShowForm(true)}
        disabled={!authenticated || !quantumMarketContract}
        size="sm"
        className="bg-[#64C967] hover:bg-[#64C967]/90 text-black disabled:bg-black/20 disabled:text-black/50 font-['Instrument_Sans'] font-bold rounded-[31px]"
      >
        Create Market
      </Button>
    );
  };

  const ProposalCard = ({ proposal, isWinner = false }: { proposal: Proposal; isWinner?: boolean }) => (
    <div className={`bg-black/5 rounded-[16px] p-4 border ${isWinner ? 'border-[#64C967] bg-[#64C967]/10' : 'border-black/10'}`}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-black font-medium text-sm font-['Instrument_Sans']">{proposal.metadata}</h4>
            {isWinner && (
              <span className="inline-block px-2 py-1 bg-[#64C967] text-black text-xs rounded-[12px] font-['Instrument_Sans'] font-medium">
                WINNER
              </span>
            )}
          </div>
          <div className="text-xs text-black/60 space-y-1 font-['Instrument_Sans']">
            <div>Proposal ID: {proposal.id.slice(0, 10)}...{proposal.id.slice(-6)}</div>
            <div>Pool Fee: {proposal.poolKey.fee / 10000}%</div>
            <div>Tick Spacing: {proposal.poolKey.tickSpacing}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="bg-[#64C967]/20 border border-[#64C967]/30 rounded-[12px] p-2 text-center">
          <div className="text-black font-bold text-sm font-['Instrument_Sans']">Pool Active</div>
          <div className="text-black/70 text-xs font-['Instrument_Sans']">Trade Available</div>
        </div>
        <div className="bg-black/10 border border-black/20 rounded-[12px] p-2 text-center">
          <div className="text-black font-bold text-sm font-['Instrument_Sans']">0.5</div>
          <div className="text-black/70 text-xs font-['Instrument_Sans']">Price</div>
        </div>
      </div>
    </div>
  );

  const MarketCard = ({ market, isReal = false }: { market: Market; isReal?: boolean }) => {
    const [showProposals, setShowProposals] = useState(false);

    return (
    <div
      className="bg-white rounded-[31px] p-6 border border-black/10 hover:border-black/20 transition-colors cursor-pointer shadow-lg"
      onClick={() => setSelectedMarket(market)}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-black font-semibold text-lg font-['Instrument_Serif']">{market.title}</h3>
            {isReal && (
              <span className="inline-block px-3 py-1 bg-[#64C967] text-black text-xs rounded-[16px] font-['Instrument_Sans'] font-medium">
                ON-CHAIN
              </span>
            )}
          </div>
          <p className="text-black/70 text-sm mb-3 line-clamp-2 font-['Instrument_Sans']">{market.description}</p>
          <div className="flex items-center gap-4 text-sm text-black/60 font-['Instrument_Sans']">
            <span className="flex items-center gap-1">
              <DollarSign className="w-4 h-4" />
              {market.volume}
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              {market.participants}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {new Date(market.endDate).toLocaleDateString()}
            </span>
            {isReal && market.contractData && (
              <span className="flex items-center gap-1">
                <span className="text-xs">ID:</span>
                <span className="font-mono text-xs">{market.contractData.id}</span>
              </span>
            )}
          </div>
          {isReal && market.contractData && (
            <div className="mt-2 text-xs text-black/50 font-['Instrument_Sans']">
              <span>Creator: {market.contractData.creator.slice(0, 6)}...{market.contractData.creator.slice(-4)}</span>
              <span className="ml-4">Min Deposit: {ethers.formatEther(market.contractData.minDeposit)} ETH</span>
              <span className="ml-4">Status: {MarketStatus[market.contractData.status]}</span>
            </div>
          )}
        </div>
        <div className="ml-4">
          <span className="inline-block px-3 py-1 bg-black/10 text-black text-xs rounded-[16px] font-['Instrument_Sans'] font-medium">
            {market.category}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#64C967]/20 border border-[#64C967]/30 rounded-[16px] p-3 text-center">
          <div className="text-black font-bold text-lg font-['Instrument_Sans']">{formatPercentage(market.yesPrice)}</div>
          <div className="text-black/70 text-sm font-['Instrument_Sans']">YES</div>
        </div>
        <div className="bg-black/10 border border-black/20 rounded-[16px] p-3 text-center">
          <div className="text-black font-bold text-lg font-['Instrument_Sans']">{formatPercentage(market.noPrice)}</div>
          <div className="text-black/70 text-sm font-['Instrument_Sans']">NO</div>
        </div>
      </div>

      {/* Add Proposal Section for Decisions without proposals */}
      {market.category === 'Decision' && market.status === 'active' && market.decisionId && (!market.proposals || market.proposals.length === 0) && (
        <div className="mt-4 border-t border-black/10 pt-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-black font-medium text-sm font-['Instrument_Sans']">No Proposals Yet</h4>
              <p className="text-black/60 text-xs font-['Instrument_Sans']">Be the first to propose a solution!</p>
            </div>
            <div onClick={(e) => e.stopPropagation()}>
              <AddProposalButton
                decisionId={market.decisionId}
                onProposalCreated={fetchRealMarkets}
              />
            </div>
          </div>
        </div>
      )}

      {/* Proposals Section for Decisions */}
      {market.proposals && market.proposals.length > 0 && (
        <div className="mt-4 border-t border-black/10 pt-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-black font-medium text-sm font-['Instrument_Sans']">
              Proposals ({market.proposals.length})
            </h4>
            <div className="flex items-center gap-2">
              {market.status === 'active' && market.decisionId && (
                <div onClick={(e) => e.stopPropagation()}>
                  <AddProposalButton
                    decisionId={market.decisionId}
                    onProposalCreated={fetchRealMarkets}
                  />
                </div>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowProposals(!showProposals);
                }}
                className="text-[#64C967] hover:text-[#64C967]/80 text-xs font-['Instrument_Sans'] font-medium"
              >
                {showProposals ? 'Hide' : 'Show'} Proposals
              </button>
            </div>
          </div>

          {showProposals && (
            <div className="space-y-2">
              {market.proposals.map((proposal) => (
                <ProposalCard
                  key={proposal.id}
                  proposal={proposal}
                  isWinner={market.winningProposalId === proposal.id}
                />
              ))}
            </div>
          )}

          {!showProposals && (
            <div className="text-xs text-black/60 font-['Instrument_Sans']">
              Click "Show Proposals" to see {market.proposals.length} proposal{market.proposals.length !== 1 ? 's' : ''} for this decision
            </div>
          )}
        </div>
      )}
    </div>
  );
  };

  const TradingInterface = ({ market }: { market: Market }) => {
    const [isTrading, setIsTrading] = useState(false);
    const [isCreatingProposal, setIsCreatingProposal] = useState(false);
    const [isResolving, setIsResolving] = useState(false);

    const handleTrade = async () => {
      if (!tradeAmount || parseFloat(tradeAmount) <= 0) return;

      setIsTrading(true);
      try {
        if (market.contractData) {
          // Handle real market trading - need to create proposal first if none exists
          console.log('Trading on real market:', market.contractData.id, tradeSide, tradeAmount);
          alert(`Real trading requires a proposal to be created first. Use "Create Proposal" button below.`);
        } else {
          // Handle mock market trading
          console.log('Trading on mock market:', market.id, tradeSide, tradeAmount);
          alert(`Mock trade: ${tradeAmount} USD on ${tradeSide.toUpperCase()} for "${market.title}"`);
        }
      } catch (error) {
        console.error('Trading failed:', error);
        alert('Trading failed. Please try again.');
      }
      setIsTrading(false);
    };

    const handleCreateProposal = async () => {
      if (!market.contractData) return;

      setIsCreatingProposal(true);
      try {
        await createProposalForMarket(market.contractData.id);
        alert('Proposal created successfully! You can now trade on this market.');
        await fetchRealMarkets(); // Refresh to show updated market
      } catch (error) {
        console.error('Failed to create proposal:', error);
        alert('Failed to create proposal. Please try again.');
      }
      setIsCreatingProposal(false);
    };

    const handleResolve = async (outcome: boolean) => {
      if (!market.contractData) return;

      setIsResolving(true);
      try {
        await resolveMarket(market.contractData.id, outcome);
        alert(`Market resolved as ${outcome ? 'YES' : 'NO'}!`);
      } catch (error) {
        console.error('Failed to resolve market:', error);
        alert('Failed to resolve market. Please try again.');
      }
      setIsResolving(false);
    };

    return (
    <div className="bg-white rounded-[31px] p-6 border border-black/10 shadow-lg">
      <h3 className="text-black font-semibold text-xl mb-4 font-['Instrument_Serif']">{market.title}</h3>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <button
          className={`p-4 rounded-[16px] border transition-colors font-['Instrument_Sans'] ${
            tradeSide === 'yes'
              ? 'bg-[#64C967] border-[#64C967] text-black'
              : 'bg-black/5 border-black/20 text-black/70 hover:border-black/30'
          }`}
          onClick={() => setTradeSide('yes')}
        >
          <div className="text-2xl font-bold">{formatPercentage(market.yesPrice)}</div>
          <div className="text-sm">YES</div>
        </button>
        <button
          className={`p-4 rounded-[16px] border transition-colors font-['Instrument_Sans'] ${
            tradeSide === 'no'
              ? 'bg-black border-black text-white'
              : 'bg-black/5 border-black/20 text-black/70 hover:border-black/30'
          }`}
          onClick={() => setTradeSide('no')}
        >
          <div className="text-2xl font-bold">{formatPercentage(market.noPrice)}</div>
          <div className="text-sm">NO</div>
        </button>
      </div>

      <div className="mb-4">
        <label className="block text-black text-sm mb-2 font-['Instrument_Sans'] font-medium">Amount (USD)</label>
        <input
          type="number"
          value={tradeAmount}
          onChange={(e) => setTradeAmount(e.target.value)}
          className="w-full bg-black/5 border border-black/20 rounded-[16px] px-4 py-3 text-black focus:border-[#64C967] focus:outline-none font-['Instrument_Sans']"
          placeholder="Enter amount..."
        />
      </div>

      <div className="flex gap-3">
        {!authenticated ? (
          <Button
            onClick={login}
            className="flex-1 bg-[#64C967] hover:bg-[#64C967]/90 text-black font-['Instrument_Sans'] font-bold rounded-[31px]"
          >
            <Wallet className="w-4 h-4 mr-2" />
            Connect Wallet to Trade
          </Button>
        ) : (
          <Button
            onClick={handleTrade}
            disabled={!tradeAmount || parseFloat(tradeAmount) <= 0 || isTrading}
            className="flex-1 bg-black hover:bg-black/80 text-white disabled:bg-black/50 disabled:cursor-not-allowed font-['Instrument_Sans'] font-bold rounded-[31px]"
          >
            {isTrading ? 'Trading...' : `Buy ${tradeSide.toUpperCase()} Shares`}
          </Button>
        )}
        <Button
          variant="outline"
          className="flex-1 border-black/20 text-black hover:bg-black/5 font-['Instrument_Sans'] rounded-[31px]"
          onClick={() => setSelectedMarket(null)}
        >
          Cancel
        </Button>
      </div>

      {/* Real Market Actions */}
      {market.contractData && authenticated && (
        <div className="mt-6 space-y-3">
          <h4 className="text-sm font-medium text-black font-['Instrument_Sans']">Market Actions</h4>
          <div className="grid grid-cols-1 gap-2">
            <Button
              onClick={handleCreateProposal}
              disabled={isCreatingProposal || market.contractData.status !== MarketStatus.OPEN}
              className="bg-[#64C967] hover:bg-[#64C967]/90 text-black disabled:bg-black/20 disabled:text-black/50 font-['Instrument_Sans'] font-bold rounded-[31px]"
            >
              {isCreatingProposal ? 'Creating...' : 'Create Proposal'}
            </Button>

            {market.contractData.status === MarketStatus.PROPOSAL_ACCEPTED && (
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => handleResolve(true)}
                  disabled={isResolving}
                  className="bg-[#64C967] hover:bg-[#64C967]/90 text-black disabled:bg-black/20 disabled:text-black/50 font-['Instrument_Sans'] font-bold rounded-[31px]"
                >
                  {isResolving ? 'Resolving...' : 'Resolve YES'}
                </Button>
                <Button
                  onClick={() => handleResolve(false)}
                  disabled={isResolving}
                  className="bg-black hover:bg-black/80 text-white disabled:bg-black/20 disabled:text-black/50 font-['Instrument_Sans'] font-bold rounded-[31px]"
                >
                  {isResolving ? 'Resolving...' : 'Resolve NO'}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Market Info for Real Markets */}
      {market.contractData && (
        <div className="mt-4 p-3 bg-black/5 rounded-[16px] border border-black/10">
          <h4 className="text-sm font-medium text-black mb-2 font-['Instrument_Sans']">Contract Details</h4>
          <div className="space-y-1 text-xs text-black/60 font-['Instrument_Sans']">
            <div>Market ID: {market.contractData.id}</div>
            <div>Creator: {market.contractData.creator.slice(0, 10)}...{market.contractData.creator.slice(-6)}</div>
            <div>Status: {MarketStatus[market.contractData.status]}</div>
            <div>Min Deposit: {ethers.formatEther(market.contractData.minDeposit)} ETH</div>
            <div>Deadline: {new Date(market.contractData.deadline * 1000).toLocaleString()}</div>
          </div>
        </div>
      )}
    </div>
  );
  };

  const ScriptInterface = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-[31px] p-6 border border-black/10 shadow-lg">
        <h3 className="text-black font-semibold text-xl mb-4 font-['Instrument_Serif']">Qlick Script Execution</h3>
        <p className="text-black/70 mb-4 font-['Instrument_Sans']">
          Execute the Qlick smart contract script to create quantum markets, deploy tokens,
          add liquidity, and demonstrate the full market lifecycle on Unichain Sepolia.
        </p>

        {/* Wallet Status */}
        <div className="mb-6 p-4 bg-black/5 rounded-[16px] border border-black/10">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h4 className="text-black font-medium mb-2 font-['Instrument_Sans']">Wallet Status</h4>
              {authenticated && user?.wallet?.address ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="text-sm text-[#64C967] font-['Instrument_Sans'] font-medium">✅ Connected</div>
                    <div className="text-xs text-black/60 font-['Instrument_Sans']">Unichain Sepolia</div>
                  </div>
                  <div className="text-xs text-black bg-white p-2 rounded-[12px] border border-black/10 font-['Instrument_Sans']">
                    {user.wallet.address}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-sm font-['Instrument_Sans']">
                      <span className="text-black/60">Balance: </span>
                      <span className="text-black font-medium">{parseFloat(walletBalance).toFixed(4)} ETH</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {provider && (
                        <div className="text-xs text-[#64C967] font-['Instrument_Sans'] font-medium">
                          🔗 Provider Ready
                        </div>
                      )}
                      {orchestratorContract && quantumMarketContract && (
                        <div className="text-xs text-black font-['Instrument_Sans'] font-medium">
                          ⚛️ Quantum Contracts Ready
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-sm text-black/70 font-['Instrument_Sans']">⚠️ Wallet not connected</div>
                  <div className="text-xs text-black/60 font-['Instrument_Sans']">Connect your wallet to execute scripts</div>
                </div>
              )}
            </div>
            {!authenticated && (
              <Button
                onClick={login}
                size="sm"
                className="bg-[#64C967] hover:bg-[#64C967]/90 text-black font-['Instrument_Sans'] font-bold rounded-[31px]"
              >
                <Wallet className="w-4 h-4 mr-2" />
                Connect Wallet
              </Button>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Button
            onClick={() => executeQlickScript('basic')}
            disabled={isExecutingScript || !authenticated || !user?.wallet?.address || !provider || !orchestratorContract || !quantumMarketContract}
            className="bg-[#64C967] hover:bg-[#64C967]/90 text-black p-4 h-auto flex flex-col items-start disabled:bg-black/20 disabled:text-black/50 disabled:cursor-not-allowed font-['Instrument_Sans'] font-bold rounded-[31px]"
          >
            <div className="font-semibold mb-1">
              Basic Quantum Flow {!authenticated && '🔒'}
            </div>
            <div className="text-sm opacity-80 text-left">
              {!authenticated
                ? 'Connect wallet to execute quantum script'
                : 'Deploy tokens → Create quantum pool → Create decision → Trade → Settle'
              }
            </div>
          </Button>

          <Button
            onClick={() => executeQlickScript('extended')}
            disabled={isExecutingScript || !authenticated || !user?.wallet?.address || !provider || !orchestratorContract || !quantumMarketContract}
            className="bg-black hover:bg-black/80 text-white p-4 h-auto flex flex-col items-start disabled:bg-black/20 disabled:text-black/50 disabled:cursor-not-allowed font-['Instrument_Sans'] font-bold rounded-[31px]"
          >
            <div className="font-semibold mb-1">
              Extended Quantum Flow {!authenticated && '🔒'}
            </div>
            <div className="text-sm opacity-80 text-left">
              {!authenticated
                ? 'Connect wallet to execute quantum script'
                : 'Create multiple quantum markets → Trade across pools → Settle all decisions'
              }
            </div>
          </Button>
        </div>

        {(scriptOutput.length > 0 || isExecutingScript) && (
          <div className="bg-black rounded-[16px] p-4 border border-black/10">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-[#64C967] text-sm font-['Instrument_Sans'] font-medium">Script Output</h4>
              {isExecutingScript && (
                <div className="flex items-center gap-2 text-[#64C967] text-sm font-['Instrument_Sans']">
                  <div className="animate-spin w-4 h-4 border-2 border-[#64C967] border-t-transparent rounded-full"></div>
                  Executing...
                </div>
              )}
            </div>
            <div className="text-sm space-y-1 max-h-64 overflow-y-auto font-['Instrument_Sans']">
              {scriptOutput.map((line, index) => (
                <div
                  key={index}
                  className={`${
                    line.includes('✅') ? 'text-[#64C967]' :
                    line.includes('⚠️') ? 'text-black/70' :
                    line.includes('🚀') || line.includes('===') ? 'text-black' :
                    'text-black/80'
                  }`}
                >
                  {line}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-[31px] p-6 border border-black/10 shadow-lg">
        <h4 className="text-black font-semibold text-lg mb-4 font-['Instrument_Serif']">Quantum Markets Configuration</h4>
        <div className="mb-4 p-3 bg-[#64C967]/10 border border-[#64C967]/30 rounded-[16px]">
          <p className="text-black/80 text-sm font-['Instrument_Sans']">
            ⚛️ <strong>Quantum Markets</strong> enable efficient evaluation of multiple proposals for each decision,
            solving the capital efficiency problem of traditional prediction markets.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h5 className="text-black font-medium mb-2 font-['Instrument_Sans']">Network</h5>
            <p className="text-black/70 font-['Instrument_Sans']">Unichain Sepolia</p>
            <p className="text-black/60 text-xs font-['Instrument_Sans']">https://sepolia.unichain.org</p>
          </div>
          <div>
            <h5 className="text-black font-medium mb-2 font-['Instrument_Sans']">Quantum Contracts</h5>
            <p className="text-black/70 text-xs font-['Instrument_Sans']">Orchestrator: {QLICK_CONFIG.QLICK_ORCHESTRATOR.slice(0, 10)}...</p>
            <p className="text-black/70 text-xs font-['Instrument_Sans']">Market Manager: {QLICK_CONFIG.QUANTUM_MARKET_MANAGER.slice(0, 10)}...</p>
            <p className="text-black/70 text-xs font-['Instrument_Sans']">Quantum Hook: {QLICK_CONFIG.QUANTUM_MARKET_HOOK.slice(0, 10)}...</p>
          </div>
          <div>
            <h5 className="text-black font-medium mb-2 font-['Instrument_Sans']">Pool Parameters</h5>
            <p className="text-black/70 font-['Instrument_Sans']">Fee: {QLICK_CONFIG.FEE} (0.3%)</p>
            <p className="text-black/70 font-['Instrument_Sans']">Liquidity: {ethers.formatEther(QLICK_CONFIG.LIQUIDITY_DESIRED)} ETH</p>
            <p className="text-black/70 font-['Instrument_Sans']">Tick Spacing: {QLICK_CONFIG.TICK_SPACING}</p>
          </div>
          <div>
            <h5 className="text-black font-medium mb-2 font-['Instrument_Sans']">Market Settings</h5>
            <p className="text-black/70 font-['Instrument_Sans']">Title: {QLICK_CONFIG.MARKET_TITLE}</p>
            <p className="text-black/70 font-['Instrument_Sans']">Min Deposit: {QLICK_CONFIG.MIN_DEPOSIT} ETH</p>
            <p className="text-black/70 font-['Instrument_Sans']">Swap Amount: {ethers.formatEther(QLICK_CONFIG.SWAP_AMOUNT)} ETH</p>
          </div>
        </div>
        <div className="mt-4 p-3 bg-black/5 rounded-[16px] border border-black/10">
          <p className="text-black/70 text-xs font-['Instrument_Sans']">
            📚 Learn more about Quantum Markets:
            <a
              href="https://www.paradigm.xyz/2025/06/quantum-markets"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#64C967] hover:text-[#64C967]/80 underline ml-1 font-medium"
            >
              Paradigm Research Paper
            </a>
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-[#64C967] min-h-screen text-black">
      {/* Header */}
      <header className="border-b border-black/20 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="text-black/70 hover:text-black font-['Instrument_Sans']"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
            <div className="flex items-center gap-2">
              <img
                className="w-8 h-8"
                alt="Logo"
                src="/logo(2).svg"
              />
              <h1 className="text-xl font-bold font-['Instrument_Serif']">Qlick Markets</h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-black rounded-full"></div>
              <span className="text-black/70 font-['Instrument_Sans']">Unichain Sepolia</span>
            </div>

            {/* Wallet Connection */}
            <div className="flex items-center gap-3">
              {!ready ? (
                <Button disabled size="sm" className="bg-black/20 text-black font-['Instrument_Sans'] rounded-[31px]">
                  <span className="text-xs">Loading...</span>
                </Button>
              ) : !authenticated ? (
                <Button
                  onClick={login}
                  size="sm"
                  className="bg-black hover:bg-black/80 text-white font-['Instrument_Sans'] rounded-[31px]"
                >
                  <Wallet className="w-4 h-4 mr-2" />
                  <span className="text-xs">Connect Wallet</span>
                </Button>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs text-black/70 font-['Instrument_Sans']">Connected</div>
                    <div className="text-xs text-black font-['Instrument_Sans']">
                      {user?.wallet?.address ?
                        `${user.wallet.address.slice(0, 6)}...${user.wallet.address.slice(-4)}` :
                        user?.email?.address || 'Account'
                      }
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {user?.wallet?.address && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(`https://sepolia.uniscan.xyz/address/${user.wallet?.address}`, '_blank')}
                        className="text-black/70 hover:text-black p-2"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={logout}
                      className="text-black/70 hover:text-black p-2"
                    >
                      <User className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="border-b border-black/20">
        <div className="max-w-7xl mx-auto px-6">
          <nav className="flex gap-8">
            {[
              { id: 'markets', label: 'Markets', icon: TrendingUp },
              { id: 'positions', label: 'My Positions', icon: DollarSign },
              { id: 'script', label: 'Script Demo', icon: Clock }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`flex items-center gap-2 py-4 px-2 border-b-2 transition-colors font-['Instrument_Sans'] ${
                  activeTab === id
                    ? 'border-black text-black'
                    : 'border-transparent text-black/70 hover:text-black'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'markets' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold font-['Instrument_Serif'] text-black">Markets</h2>
                <div className="flex gap-2">
                  <Button
                    onClick={() => fetchRealMarkets()}
                    disabled={isLoadingMarkets || !quantumMarketContract}
                    size="sm"
                    variant="outline"
                    className="border-black/20 text-black hover:bg-black/5 font-['Instrument_Sans'] rounded-[31px]"
                  >
                    {isLoadingMarkets ? 'Loading...' : 'Refresh'}
                  </Button>
                  <CreateMarketButton onMarketCreated={fetchRealMarkets} />
                </div>
              </div>
              
              {/* Debug Info */}
              {authenticated && quantumMarketContract && (
                <div className="mb-6 p-4 bg-black/5 rounded-[16px] border border-black/10">
                  <h3 className="text-sm font-medium text-black mb-2 font-['Instrument_Sans']">Debug Info</h3>
                  <div className="text-xs text-black/60 space-y-1 font-['Instrument_Sans']">
                    <div>Contract: {quantumMarketContract.target.toString()}</div>
                    <div>Connected: {authenticated ? 'Yes' : 'No'}</div>
                    <div>Real Markets Found: {realMarkets.length}</div>
                    <div>Loading: {isLoadingMarkets ? 'Yes' : 'No'}</div>
                    <div className="flex gap-2 mt-2">
                      <Button
                        onClick={async () => {
                          if (quantumMarketContract) {
                            try {
                              const nextId = await quantumMarketContract.nextDecisionId();
                              console.log('Next Decision ID:', nextId);
                              alert(`Next Decision ID: ${nextId}`);
                            } catch (error) {
                              console.error('Error getting nextDecisionId:', error);
                              alert('Error getting nextDecisionId - check console');
                            }
                          }
                        }}
                        size="sm"
                        className="bg-black hover:bg-black/80 text-white text-xs font-['Instrument_Sans'] font-bold rounded-[31px]"
                      >
                        Check Next ID
                      </Button>

                      <Button
                        onClick={async () => {
                          if (quantumMarketContract) {
                            const testIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
                            const results = [];

                            for (const id of testIds) {
                              try {
                                const decision = await quantumMarketContract.decisions(id);
                                if (decision.metadata && decision.metadata.trim() !== '') {
                                  results.push(`ID ${id}: ${decision.metadata.substring(0, 50)}...`);
                                } else {
                                  results.push(`ID ${id}: Empty/No metadata`);
                                }
                              } catch (error) {
                                results.push(`ID ${id}: Error - ${error}`);
                              }
                            }

                            console.log('Decision scan results:', results);
                            alert(`Found decisions:\n${results.join('\n')}`);
                          }
                        }}
                        size="sm"
                        className="bg-[#64C967] hover:bg-[#64C967]/90 text-black text-xs font-['Instrument_Sans'] font-bold rounded-[31px]"
                      >
                        Scan Decisions
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Real Markets Section */}
              {realMarkets.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-black mb-4 flex items-center gap-2 font-['Instrument_Sans']">
                    <div className="w-2 h-2 bg-[#64C967] rounded-full"></div>
                    On-Chain Quantum Markets ({realMarkets.length})
                  </h3>
                  <div className="space-y-4">
                    {realMarkets.map(market => (
                      <MarketCard key={`real-${market.id}`} market={market} isReal={true} />
                    ))}
                  </div>
                </div>
              )}

              {/* Mock Markets Section */}
              <div>
                <h3 className="text-lg font-semibold text-black mb-4 flex items-center gap-2 font-['Instrument_Sans']">
                  <div className="w-2 h-2 bg-black rounded-full"></div>
                  Demo Markets ({markets.length})
                </h3>
              <div className="space-y-4">
                {markets.map(market => (
                    <MarketCard key={`mock-${market.id}`} market={market} isReal={false} />
                ))}
              </div>
              </div>
              
              {isLoadingMarkets && (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin w-8 h-8 border-2 border-[#64C967] border-t-transparent rounded-full"></div>
                  <span className="ml-3 text-black/60 font-['Instrument_Sans']">Loading markets...</span>
                </div>
              )}
            </div>

            <div className="lg:col-span-1">
              {selectedMarket ? (
                <TradingInterface market={selectedMarket} />
              ) : (
                <div className="bg-white rounded-[31px] p-6 border border-black/10 text-center shadow-lg">
                  <TrendingUp className="w-12 h-12 text-black/40 mx-auto mb-4" />
                  <h3 className="text-black/70 font-medium mb-2 font-['Instrument_Sans']">Select a Market</h3>
                  <p className="text-black/60 text-sm font-['Instrument_Sans']">
                    Click on any market to start trading
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'positions' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold font-['Instrument_Serif'] text-black">My Positions</h2>
              <Button
                onClick={async () => {
                  setIsLoadingPositions(true);
                  const positions = await fetchUserPositions();
                  setRealPositions(positions);
                  setIsLoadingPositions(false);
                }}
                disabled={isLoadingPositions || !quantumMarketContract || !user?.wallet?.address}
                size="sm"
                variant="outline"
                className="border-black/20 text-black hover:bg-black/5 font-['Instrument_Sans'] rounded-[31px]"
              >
                {isLoadingPositions ? 'Loading...' : 'Refresh'}
              </Button>
            </div>
            
            {/* Real Positions Section */}
            {realPositions.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-black mb-4 flex items-center gap-2 font-['Instrument_Sans']">
                  <div className="w-2 h-2 bg-[#64C967] rounded-full"></div>
                  On-Chain Positions ({realPositions.length})
                </h3>
                <div className="space-y-4">
                  {realPositions.map((position, index) => {
                    const market = realMarkets.find(m => m.id === position.marketId) ||
                                   { title: `Market #${position.marketId}`, contractData: { id: Number(position.marketId) } };
                    return (
                      <div key={`real-${index}`} className="bg-white rounded-[31px] p-6 border border-black/10 shadow-lg">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-black font-semibold font-['Instrument_Serif']">{market.title}</h3>
                              <span className="inline-block px-3 py-1 bg-[#64C967] text-black text-xs rounded-[16px] font-['Instrument_Sans'] font-medium">
                                ON-CHAIN
                              </span>
                            </div>
                            <div className="flex items-center gap-4 mt-2 text-sm font-['Instrument_Sans']">
                              <span className={`px-2 py-1 rounded-[12px] text-xs font-medium ${
                                position.side === 'yes'
                                  ? 'bg-[#64C967] text-black'
                                  : 'bg-black text-white'
                              }`}>
                                {position.side.toUpperCase()}
                              </span>
                              <span className="text-black/60">{position.shares.toFixed(4)} ETH deposited</span>
                              <span className="text-black/60">Avg: {formatPrice(position.avgPrice)}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-black font-semibold font-['Instrument_Sans']">{formatPrice(position.currentValue)}</div>
                            <div className={`text-sm font-['Instrument_Sans'] ${position.pnl >= 0 ? 'text-[#64C967]' : 'text-black/70'}`}>
                              {position.pnl >= 0 ? '+' : ''}{formatPrice(position.pnl)}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Mock Positions Section */}
            {positions.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-black mb-4 flex items-center gap-2 font-['Instrument_Sans']">
                  <div className="w-2 h-2 bg-black rounded-full"></div>
                  Demo Positions ({positions.length})
                </h3>
            <div className="space-y-4">
              {positions.map((position, index) => {
                const market = markets.find(m => m.id === position.marketId);
                return (
                      <div key={`mock-${index}`} className="bg-white rounded-[31px] p-6 border border-black/10 shadow-lg">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-black font-semibold font-['Instrument_Serif']">{market?.title}</h3>
                        <div className="flex items-center gap-4 mt-2 text-sm font-['Instrument_Sans']">
                          <span className={`px-2 py-1 rounded-[12px] text-xs font-medium ${
                            position.side === 'yes'
                              ? 'bg-[#64C967] text-black'
                              : 'bg-black text-white'
                          }`}>
                            {position.side.toUpperCase()}
                          </span>
                          <span className="text-black/60">{position.shares} shares</span>
                          <span className="text-black/60">Avg: {formatPrice(position.avgPrice)}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-black font-semibold font-['Instrument_Sans']">{formatPrice(position.currentValue)}</div>
                        <div className={`text-sm font-['Instrument_Sans'] ${position.pnl >= 0 ? 'text-[#64C967]' : 'text-black/70'}`}>
                          {position.pnl >= 0 ? '+' : ''}{formatPrice(position.pnl)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
              </div>
            )}
            
            {/* No positions message */}
            {realPositions.length === 0 && positions.length === 0 && !isLoadingPositions && (
              <div className="bg-white rounded-[31px] p-8 border border-black/10 text-center shadow-lg">
                <DollarSign className="w-12 h-12 text-black/40 mx-auto mb-4" />
                <h3 className="text-black/70 font-medium mb-2 font-['Instrument_Sans']">No Positions Found</h3>
                <p className="text-black/60 text-sm font-['Instrument_Sans']">
                  {!authenticated
                    ? 'Connect your wallet to view your positions'
                    : 'You haven\'t taken any positions yet. Start trading to see your positions here.'
                  }
                </p>
              </div>
            )}

            {isLoadingPositions && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin w-8 h-8 border-2 border-[#64C967] border-t-transparent rounded-full"></div>
                <span className="ml-3 text-black/60 font-['Instrument_Sans']">Loading positions...</span>
              </div>
            )}
          </div>
        )}

        {activeTab === 'script' && <ScriptInterface />}
      </main>
    </div>
  );
};
