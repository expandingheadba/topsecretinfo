'use client'

import { useState } from 'react'
import { useAccount } from 'wagmi'
import { ethers } from 'ethers'
import { getSigner } from '@/lib/provider'

interface CreateStudyProps {
  contractAddress: string
  contractABI: string[]
  relayerInstance: any
}

export default function CreateStudy({ contractAddress, contractABI, relayerInstance }: CreateStudyProps) {
  const { address } = useAccount()
  const [studyName, setStudyName] = useState('')
  const [description, setDescription] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [createdStudyId, setCreatedStudyId] = useState<number | null>(null)

  const handleCreate = async () => {
    if (!studyName.trim() || !description.trim() || !address) {
      alert('Please fill in all fields and connect wallet')
      return
    }

    try {
      setIsCreating(true)
      const signer = await getSigner()
      const contract = new ethers.Contract(contractAddress, contractABI, signer)

      const tx = await contract.createStudy(studyName, description)
      const receipt = await tx.wait()

      const event = receipt?.logs.find((log: any) => {
        try {
          const parsed = contract.interface.parseLog(log)
          return parsed?.name === 'StudyCreated'
        } catch {
          return false
        }
      })

      if (event) {
        const parsed = contract.interface.parseLog(event)
        const studyId = parsed?.args.studyId
        setCreatedStudyId(Number(studyId))
        setStudyName('')
        setDescription('')
        alert(`Study created successfully! Study ID: ${studyId}`)
      }
    } catch (err: any) {
      console.error('Failed to create study:', err)
      alert('Failed to create study: ' + (err.message || 'Unknown error'))
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-green-300 mb-6 font-mono tracking-wider">
        👽 CREATE NEW CLASSIFIED MISSION 👽
      </h2>
      
      {createdStudyId !== null && (
        <div className="mb-6 p-4 bg-green-900 border-4 border-green-400 rounded-lg">
          <p className="text-green-300 font-mono">
            ✅ MISSION CREATED! CLASSIFIED ID: <strong className="text-green-400">{createdStudyId}</strong>
          </p>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-green-300 mb-2 font-mono">
            MISSION CODE NAME *
          </label>
          <input
            type="text"
            value={studyName}
            onChange={(e) => setStudyName(e.target.value)}
            placeholder="e.g., PROJECT BLUE BOOK"
            className="w-full px-4 py-2 border-2 border-green-400 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-green-300 text-green-100 bg-green-900 font-mono"
            disabled={isCreating}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-green-300 mb-2 font-mono">
            CLASSIFIED DESCRIPTION *
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the classified purpose of this mission..."
            rows={4}
            className="w-full px-4 py-2 border-2 border-green-400 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-green-300 text-green-100 bg-green-900 resize-none font-mono"
            disabled={isCreating}
          />
        </div>

        <button
          onClick={handleCreate}
          disabled={isCreating || !studyName.trim() || !description.trim()}
          className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-mono border-2 border-green-400"
        >
          {isCreating ? '🔐 ENCRYPTING MISSION...' : '🚀 LAUNCH CLASSIFIED MISSION'}
        </button>

        <div className="mt-6 p-4 bg-green-900 border-2 border-green-400 rounded-lg">
          <p className="text-sm text-green-300 font-mono">
            <strong>⚠️ WARNING:</strong> After creating a mission, you can submit encrypted data to it. 
            All data will be encrypted using alien technology (FHE) before being stored on the blockchain.
          </p>
        </div>
      </div>
    </div>
  )
}
