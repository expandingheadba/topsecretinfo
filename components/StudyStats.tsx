'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { ethers } from 'ethers'

interface StudyStatsProps {
  contractAddress: string
  contractABI: string[]
  selectedStudyId: number | null
  onStudySelect: (studyId: number | null) => void
}

interface Study {
  id: number
  name: string
  description: string
  dataCount: number
  isActive: boolean
}

interface Stats {
  totalRecords: number
  minValue: number
  maxValue: number
  lastUpdated: number
}

export default function StudyStats({ 
  contractAddress, 
  contractABI, 
  selectedStudyId,
  onStudySelect 
}: StudyStatsProps) {
  const { address } = useAccount()
  const [studies, setStudies] = useState<Study[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingStats, setIsLoadingStats] = useState(false)

  useEffect(() => {
    loadStudies()
  }, [address])

  useEffect(() => {
    if (selectedStudyId !== null) {
      loadStats(selectedStudyId)
    }
  }, [selectedStudyId])

  const loadStudies = async () => {
    if (!address) return
    
    try {
      setIsLoading(true)
      const provider = new ethers.BrowserProvider(window.ethereum!)
      const contract = new ethers.Contract(contractAddress, contractABI, provider)
      
      const studyCount = await contract.studyCounter()
      const studyList: Study[] = []

      for (let i = 0; i < Number(studyCount); i++) {
        try {
          const study = await contract.getStudy(i)
          studyList.push({
            id: i,
            name: study.studyName,
            description: study.description,
            dataCount: Number(study.dataCount),
            isActive: study.isActive
          })
        } catch (err) {
          console.error(`Error loading study ${i}:`, err)
        }
      }

      setStudies(studyList)
    } catch (err) {
      console.error('Failed to load studies:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const loadStats = async (studyId: number) => {
    if (!address) return
    
    try {
      setIsLoadingStats(true)
      const provider = new ethers.BrowserProvider(window.ethereum!)
      const contract = new ethers.Contract(contractAddress, contractABI, provider)
      
      const studyStats = await contract.getStudyStats(studyId)
      
      setStats({
        totalRecords: Number(studyStats.totalRecords),
        minValue: Number(studyStats.minValue) / 100,
        maxValue: Number(studyStats.maxValue) / 100,
        lastUpdated: Number(studyStats.lastUpdated)
      })
    } catch (err) {
      console.error('Failed to load stats:', err)
      setStats(null)
    } finally {
      setIsLoadingStats(false)
    }
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString()
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-green-300 mb-6 font-mono tracking-wider">
        📡 ALIEN STATISTICS 📡
      </h2>

      <div className="mb-6">
        <label className="block text-sm font-medium text-green-300 mb-2 font-mono">
          SELECT CLASSIFIED MISSION
        </label>
        {isLoading ? (
          <p className="text-green-400 font-mono">Loading classified files...</p>
        ) : studies.length === 0 ? (
          <p className="text-green-400 font-mono">No missions available</p>
        ) : (
          <select
            value={selectedStudyId ?? ''}
            onChange={(e) => onStudySelect(e.target.value ? Number(e.target.value) : null)}
            className="w-full px-4 py-2 border-2 border-green-400 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-green-300 text-green-100 bg-green-900 font-mono"
          >
            <option value="">-- SELECT CLASSIFIED MISSION --</option>
            {studies.map((study) => (
              <option key={study.id} value={study.id}>
                {study.name} ({study.dataCount} encrypted records)
              </option>
            ))}
          </select>
        )}
      </div>

      {selectedStudyId !== null && (
        <div>
          {isLoadingStats ? (
            <div className="text-center py-12">
              <p className="text-green-400 font-mono">Loading alien statistics...</p>
            </div>
          ) : stats ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-green-800 to-green-900 p-6 rounded-lg border-4 border-green-400">
                  <div className="text-3xl font-bold text-green-300 mb-2 font-mono">
                    {stats.totalRecords}
                  </div>
                  <div className="text-green-400 font-medium font-mono">ENCRYPTED RECORDS</div>
                </div>

                <div className="bg-gradient-to-br from-green-700 to-green-800 p-6 rounded-lg border-4 border-green-400">
                  <div className="text-3xl font-bold text-green-300 mb-2 font-mono">
                    {stats.minValue.toFixed(2)}
                  </div>
                  <div className="text-green-400 font-medium font-mono">MINIMUM VALUE</div>
                </div>

                <div className="bg-gradient-to-br from-green-600 to-green-700 p-6 rounded-lg border-4 border-green-400">
                  <div className="text-3xl font-bold text-green-300 mb-2 font-mono">
                    {stats.maxValue.toFixed(2)}
                  </div>
                  <div className="text-green-400 font-medium font-mono">MAXIMUM VALUE</div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-green-900 border-2 border-green-400 rounded-lg">
                <p className="text-sm text-green-300 font-mono">
                  <strong>LAST UPDATED:</strong> {formatDate(stats.lastUpdated)}
                </p>
              </div>

              <div className="mt-6 p-6 bg-green-800 border-4 border-green-400 rounded-lg">
                <h3 className="font-semibold text-green-300 mb-2 font-mono">🔒 CLASSIFIED NOTICE</h3>
                <p className="text-sm text-green-400 font-mono">
                  The statistics shown above are computed from encrypted data using alien technology (FHE). 
                  Individual values are never revealed - only aggregated statistics are visible. 
                  The encrypted sum is stored on-chain but cannot be decrypted without the proper keys. Aliens cannot access it.
                </p>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-green-400 font-mono">No statistics available for this mission</p>
            </div>
          )}
        </div>
      )}

      {selectedStudyId === null && (
        <div className="text-center py-12">
          <p className="text-green-400 font-mono">Please select a mission to view alien statistics</p>
        </div>
      )}
    </div>
  )
}
