'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { ethers } from 'ethers'
import { getSigner } from '@/lib/provider'

interface SubmitDataProps {
  contractAddress: string
  contractABI: string[]
  relayerInstance: any
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

export default function SubmitData({ 
  contractAddress, 
  contractABI, 
  relayerInstance,
  selectedStudyId,
  onStudySelect 
}: SubmitDataProps) {
  const { address } = useAccount()
  const [studies, setStudies] = useState<Study[]>([])
  const [healthValue, setHealthValue] = useState('')
  const [dataType, setDataType] = useState<'temperature' | 'pressure' | 'heartrate' | 'custom'>('temperature')
  const [customType, setCustomType] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingStudies, setIsLoadingStudies] = useState(true)

  useEffect(() => {
    loadStudies()
  }, [address])

  const loadStudies = async () => {
    if (!address) return
    
    try {
      setIsLoadingStudies(true)
      const provider = new ethers.BrowserProvider(window.ethereum!)
      const contract = new ethers.Contract(contractAddress, contractABI, provider)
      
      const studyCount = await contract.studyCounter()
      const studyList: Study[] = []

      for (let i = 0; i < Number(studyCount); i++) {
        try {
          const study = await contract.getStudy(i)
          if (study.isActive) {
            studyList.push({
              id: i,
              name: study.studyName,
              description: study.description,
              dataCount: Number(study.dataCount),
              isActive: study.isActive
            })
          }
        } catch (err) {
          console.error(`Error loading study ${i}:`, err)
        }
      }

      setStudies(studyList)
    } catch (err) {
      console.error('Failed to load studies:', err)
    } finally {
      setIsLoadingStudies(false)
    }
  }

  const handleSubmit = async () => {
    if (!selectedStudyId && selectedStudyId !== 0) {
      alert('Please select a study')
      return
    }

    const value = parseFloat(healthValue)
    if (isNaN(value) || value < 0) {
      alert('Please enter a valid positive number')
      return
    }

    if (!relayerInstance || !address) {
      alert('Relayer not initialized or wallet not connected')
      return
    }

    try {
      setIsSubmitting(true)

      const inputBuilder = relayerInstance.createEncryptedInput(contractAddress, address)
      inputBuilder.add32(Math.round(value * 100))
      const encryptedInput = await Promise.race([
        inputBuilder.encrypt(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Encryption timeout')), 30000)
        )
      ]) as any

      if (!encryptedInput?.handles || encryptedInput.handles.length === 0) {
        throw new Error('Encryption failed')
      }

      const encryptedHandle = encryptedInput.handles[0]
      const attestation = encryptedInput.inputProof

      const minValue = Math.round(value * 100)
      const maxValue = Math.round(value * 100)

      const signer = await getSigner()
      const contract = new ethers.Contract(contractAddress, contractABI, signer)
      
      await contract.submitData(
        selectedStudyId,
        encryptedHandle,
        attestation,
        minValue,
        maxValue
      )

      alert('Health data submitted successfully!')
      setHealthValue('')
      await loadStudies()
    } catch (err: any) {
      console.error('Failed to submit data:', err)
      alert('Failed to submit data: ' + (err.message || 'Unknown error'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-green-300 mb-6 font-mono tracking-wider">
        🔐 ENCRYPT CLASSIFIED DATA 🔐
      </h2>

      <div className="mb-6">
        <label className="block text-sm font-medium text-green-300 mb-2 font-mono">
          SELECT MISSION *
        </label>
        {isLoadingStudies ? (
          <p className="text-green-400 font-mono">Loading classified files...</p>
        ) : studies.length === 0 ? (
          <p className="text-green-400 font-mono">No active missions. Create one first!</p>
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
        <>
          <div className="mb-4">
            <label className="block text-sm font-medium text-green-300 mb-2 font-mono">
              DATA TYPE
            </label>
            <select
              value={dataType}
              onChange={(e) => setDataType(e.target.value as any)}
              className="w-full px-4 py-2 border-2 border-green-400 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-green-300 text-green-100 bg-green-900 font-mono"
              disabled={isSubmitting}
            >
              <option value="temperature">🌡️ Temperature (°C)</option>
              <option value="pressure">💓 Blood Pressure (mmHg)</option>
              <option value="heartrate">❤️ Heart Rate (bpm)</option>
              <option value="custom">👽 Custom (Alien Data)</option>
            </select>
          </div>

          {dataType === 'custom' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-green-300 mb-2 font-mono">
                ALIEN DATA TYPE NAME
              </label>
              <input
                type="text"
                value={customType}
                onChange={(e) => setCustomType(e.target.value)}
                placeholder="e.g., Alien DNA Sample"
                className="w-full px-4 py-2 border-2 border-green-400 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-green-300 text-green-100 bg-green-900 font-mono"
                disabled={isSubmitting}
              />
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-medium text-green-300 mb-2 font-mono">
              CLASSIFIED VALUE *
            </label>
            <input
              type="number"
              step="0.01"
              value={healthValue}
              onChange={(e) => setHealthValue(e.target.value)}
              placeholder={
                dataType === 'temperature' ? 'e.g., 36.6' :
                dataType === 'pressure' ? 'e.g., 120' :
                dataType === 'heartrate' ? 'e.g., 72' :
                'Enter classified value'
              }
              className="w-full px-4 py-2 border-2 border-green-400 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-green-300 text-green-100 bg-green-900 font-mono"
              disabled={isSubmitting}
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !healthValue || selectedStudyId === null}
            className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-mono border-2 border-green-400"
          >
            {isSubmitting ? '🔐 ENCRYPTING WITH ALIEN TECH...' : '🚀 SUBMIT ENCRYPTED DATA'}
          </button>

          <div className="mt-6 p-4 bg-green-900 border-2 border-green-400 rounded-lg">
            <p className="text-sm text-green-300 font-mono">
              <strong>⚠️ CLASSIFIED:</strong> Your data will be encrypted using alien technology (FHE) 
              before being sent to the blockchain. Only aggregated statistics will be visible, never individual values. Aliens cannot decrypt it.
            </p>
          </div>
        </>
      )}
    </div>
  )
}
