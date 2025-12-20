'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import CreateStudy from './CreateStudy'
import SubmitData from './SubmitData'
import StudyList from './StudyList'
import StudyStats from './StudyStats'

const HEALTH_CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_HEALTH_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000').trim()

const HEALTH_ABI = [
  'function createStudy(string memory _studyName, string memory _description) external returns (uint256)',
  'function submitData(uint256 _studyId, bytes32 _encryptedValue, bytes calldata _attestation, uint256 _minValue, uint256 _maxValue) external',
  'function getStudy(uint256 _studyId) external view returns (string memory studyName, string memory description, address creator, uint256 createdAt, bool isActive, uint256 dataCount)',
  'function getStudyStats(uint256 _studyId) external view returns (uint256 totalRecords, bytes32 encryptedSum, uint256 minValue, uint256 maxValue, uint256 lastUpdated)',
  'function getDataCount(uint256 _studyId) external view returns (uint256)',
  'function studyCounter() external view returns (uint256)',
  'event StudyCreated(uint256 indexed studyId, address indexed creator, string studyName)',
  'event DataSubmitted(uint256 indexed studyId, address indexed submitter, bytes32 encryptedValue)',
]

export default function HealthDataApp() {
  const { address, isConnected } = useAccount()
  const [relayerInstance, setRelayerInstance] = useState<any>(null)
  const [relayerError, setRelayerError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'create' | 'submit' | 'studies' | 'stats'>('studies')
  const [selectedStudyId, setSelectedStudyId] = useState<number | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      initRelayer()
    }
  }, [])

  const initRelayer = async () => {
    try {
      setRelayerError(null)
      const relayerModule = await import('@zama-fhe/relayer-sdk/web')
      
      const initPromise = relayerModule.initSDK()
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('SDK initialization timeout')), 10000)
      )
      
      const sdkInitialized = await Promise.race([initPromise, timeoutPromise]) as boolean
      
      if (!sdkInitialized) {
        throw new Error('SDK init failed')
      }
      
      const instancePromise = relayerModule.createInstance(relayerModule.SepoliaConfig)
      const instanceTimeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Instance creation timeout')), 10000)
      )
      
      const instance = await Promise.race([instancePromise, instanceTimeoutPromise])
      setRelayerInstance(instance)
    } catch (err: any) {
      console.error('Relayer init failed:', err)
      setRelayerError(err.message || 'Failed to initialize relayer')
    }
  }

  const switchToSepolia = async () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        const chainId = await window.ethereum.request({ method: 'eth_chainId' })
        if (chainId !== '0xaa36a7') {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0xaa36a7' }],
          })
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      } catch (err) {
        console.error('Failed to switch to Sepolia:', err)
      }
    }
  }

  useEffect(() => {
    if (isConnected) {
      switchToSepolia()
    }
  }, [isConnected])

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-900 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 text-6xl">🛸</div>
        <div className="absolute top-20 right-20 text-4xl">👽</div>
        <div className="absolute bottom-20 left-1/4 text-5xl">🔺</div>
        <div className="absolute bottom-10 right-1/3 text-3xl">👾</div>
      </div>
      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="bg-green-950 border-4 border-green-400 rounded-lg shadow-2xl p-6 mb-6 relative">
          <div className="absolute top-2 left-2 text-green-400 text-xs font-mono">CLASSIFIED</div>
          <div className="absolute top-2 right-2 text-green-400 text-xs font-mono">TOP SECRET</div>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-green-300 mb-2 font-mono tracking-wider">
                🛸 TOP SECRET ENCRYPTED INFO 🛸
              </h1>
              <p className="text-green-400 font-mono">
                CLASSIFIED DATA AGGREGATION - ALIEN TECHNOLOGY DETECTED
              </p>
            </div>
            <ConnectButton />
          </div>
        </div>

        <div className="bg-green-950 border-4 border-green-400 rounded-lg shadow-2xl mb-6">
          <div className="flex border-b-2 border-green-400">
            <button
              onClick={() => setActiveTab('studies')}
              className={`px-6 py-4 font-semibold font-mono transition-colors ${
                activeTab === 'studies'
                  ? 'text-green-300 border-b-4 border-green-400 bg-green-900'
                  : 'text-green-500 hover:text-green-300 hover:bg-green-900'
              }`}
            >
              🛸 CLASSIFIED FILES
            </button>
            <button
              onClick={() => setActiveTab('create')}
              className={`px-6 py-4 font-semibold font-mono transition-colors ${
                activeTab === 'create'
                  ? 'text-green-300 border-b-4 border-green-400 bg-green-900'
                  : 'text-green-500 hover:text-green-300 hover:bg-green-900'
              }`}
            >
              👽 NEW MISSION
            </button>
            <button
              onClick={() => setActiveTab('submit')}
              className={`px-6 py-4 font-semibold font-mono transition-colors ${
                activeTab === 'submit'
                  ? 'text-green-300 border-b-4 border-green-400 bg-green-900'
                  : 'text-green-500 hover:text-green-300 hover:bg-green-900'
              }`}
            >
              🔐 ENCRYPT DATA
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`px-6 py-4 font-semibold font-mono transition-colors ${
                activeTab === 'stats'
                  ? 'text-green-300 border-b-4 border-green-400 bg-green-900'
                  : 'text-green-500 hover:text-green-300 hover:bg-green-900'
              }`}
            >
              📡 ALIEN STATS
            </button>
          </div>
        </div>

        <div className="bg-green-950 border-4 border-green-400 rounded-lg shadow-2xl p-6 relative">
          <div className="absolute top-2 left-2 text-green-400 text-xs font-mono opacity-50">EYES ONLY</div>
          <div className="absolute top-2 right-2 text-green-400 text-xs font-mono opacity-50">RESTRICTED</div>
          {!isConnected ? (
            <div className="text-center py-12">
              <p className="text-xl text-green-300 mb-4 font-mono">
                ⚠️ AUTHORIZATION REQUIRED ⚠️
              </p>
              <p className="text-green-400 mb-4 font-mono text-sm">
                Connect wallet to access classified data
              </p>
              <ConnectButton />
            </div>
          ) : !relayerInstance ? (
            <div className="text-center py-12">
              {relayerError ? (
                <div>
                  <p className="text-xl text-red-400 mb-4 font-mono">
                    🚨 ALIEN INTERFERENCE DETECTED 🚨
                  </p>
                  <p className="text-green-400 mb-4 font-mono text-sm">{relayerError}</p>
                  <button
                    onClick={initRelayer}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-mono border-2 border-green-400"
                  >
                    🔄 RETRY CONNECTION
                  </button>
                </div>
              ) : (
                <div>
                  <p className="text-xl text-green-300 mb-4 font-mono">
                    🔐 INITIALIZING ALIEN TECHNOLOGY...
                  </p>
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400 mx-auto"></div>
                  <p className="text-green-400 mt-4 font-mono text-sm">Do not look directly at the screen</p>
                </div>
              )}
            </div>
          ) : (
            <>
              {activeTab === 'create' && (
                <CreateStudy
                  contractAddress={HEALTH_CONTRACT_ADDRESS}
                  contractABI={HEALTH_ABI}
                  relayerInstance={relayerInstance}
                />
              )}
              {activeTab === 'submit' && (
                <SubmitData
                  contractAddress={HEALTH_CONTRACT_ADDRESS}
                  contractABI={HEALTH_ABI}
                  relayerInstance={relayerInstance}
                  selectedStudyId={selectedStudyId}
                  onStudySelect={setSelectedStudyId}
                />
              )}
              {activeTab === 'studies' && (
                <StudyList
                  contractAddress={HEALTH_CONTRACT_ADDRESS}
                  contractABI={HEALTH_ABI}
                  onStudySelect={setSelectedStudyId}
                />
              )}
              {activeTab === 'stats' && (
                <StudyStats
                  contractAddress={HEALTH_CONTRACT_ADDRESS}
                  contractABI={HEALTH_ABI}
                  selectedStudyId={selectedStudyId}
                  onStudySelect={setSelectedStudyId}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
