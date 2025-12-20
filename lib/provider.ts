import { ethers } from 'ethers'

export async function getSigner() {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('MetaMask not found')
  }

  const provider = new ethers.BrowserProvider(window.ethereum)
  const signer = await provider.getSigner()
  return signer
}

