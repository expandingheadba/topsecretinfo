import hre from 'hardhat'
const { ethers } = hre

async function main() {
  const signers = await ethers.getSigners()
  if (signers.length === 0) {
    throw new Error('No signers available. Check PRIVATE_KEY in .env.local')
  }
  const deployer = signers[0]

  console.log('Deploying HealthDataAggregation contract...')
  console.log('Deployer:', deployer.address)

  const HealthDataAggregation = await ethers.getContractFactory('HealthDataAggregation')
  const healthData = await HealthDataAggregation.deploy()

  await healthData.waitForDeployment()

  const address = await healthData.getAddress()
  console.log('HealthDataAggregation deployed to:', address)
  console.log('\nAdd this to your .env.local:')
  console.log(`NEXT_PUBLIC_HEALTH_CONTRACT_ADDRESS=${address}`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
