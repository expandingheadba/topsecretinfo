'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { ethers } from 'ethers'

interface StudyListProps {
  contractAddress: string
  contractABI: string[]
  onStudySelect: (studyId: number | null) => void
}

interface Study {
  id: number
  name: string
  description: string
  creator: string
  createdAt: number
  dataCount: number
  isActive: boolean
}

export default function StudyList({ contractAddress, contractABI, onStudySelect }: StudyListProps) {
  const { address } = useAccount()
  const [studies, setStudies] = useState<Study[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadStudies()
    const interval = setInterval(loadStudies, 10000)
    return () => clearInterval(interval)
  }, [address])

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
            creator: study.creator,
            createdAt: Number(study.createdAt),
            dataCount: Number(study.dataCount),
            isActive: study.isActive
          })
        } catch (err) {
          console.error(`Error loading study ${i}:`, err)
        }
      }

      studyList.sort((a, b) => b.createdAt - a.createdAt)
      setStudies(studyList)
    } catch (err) {
      console.error('Failed to load studies:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString()
  }

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-green-300 font-mono tracking-wider">🛸 CLASSIFIED FILES 🛸</h2>
        <button
          onClick={loadStudies}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-mono border-2 border-green-400"
        >
          🔄 REFRESH
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-green-400 font-mono">Loading classified files...</p>
        </div>
      ) : studies.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-green-300 text-lg mb-4 font-mono">No classified files found</p>
          <p className="text-green-400 font-mono">Create your first mission to get started!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {studies.map((study) => (
            <div
              key={study.id}
              className={`p-6 border-4 rounded-lg transition-all cursor-pointer ${
                study.isActive
                  ? 'border-green-400 hover:border-green-300 bg-green-900'
                  : 'border-green-700 bg-green-950 opacity-60'
              }`}
              onClick={() => study.isActive && onStudySelect(study.id)}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-semibold text-green-300 font-mono">{study.name}</h3>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold font-mono ${
                    study.isActive
                      ? 'bg-green-600 text-green-100 border-2 border-green-400'
                      : 'bg-green-800 text-green-400'
                  }`}
                >
                  {study.isActive ? 'ACTIVE' : 'INACTIVE'}
                </span>
              </div>
              <p className="text-green-400 mb-4 font-mono text-sm">{study.description}</p>
              <div className="flex justify-between items-center text-sm text-green-300 font-mono">
                <div className="flex gap-4">
                  <span>📊 {study.dataCount} encrypted records</span>
                  <span>👤 {truncateAddress(study.creator)}</span>
                  <span>📅 {formatDate(study.createdAt)}</span>
                </div>
                {study.isActive && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onStudySelect(study.id)
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-mono border-2 border-green-400"
                  >
                    VIEW CLASSIFIED
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
