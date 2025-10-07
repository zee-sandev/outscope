import { orpcClient } from './orpc-client'

async function main() {
  console.log('🚀 Testing oRPC Client...\n')

  try {
    // Test 1: List planets
    console.log('📋 Fetching planets list...')
    const planets = await orpcClient.planet.list({
      page: 0,
      pageSize: 10,
      search: '',
    })
    console.log('✅ Planets:', JSON.stringify(planets, null, 2))
    console.log()

    // Test 2: Create a planet (if implemented)
    console.log('🌍 Creating a new planet...')
    try {
      const newPlanet = await orpcClient.planet.create({
        name: 'Mars',
        type: 'terrestrial',
        hasLife: false,
      })
      console.log('✅ Created planet:', JSON.stringify(newPlanet, null, 2))
    } catch (error: any) {
      console.log('⚠️  Create not implemented yet:', error.message)
    }
    console.log()

    // Test 3: Get a specific planet (if implemented)
    console.log('🔍 Fetching specific planet...')
    try {
      const planet = await orpcClient.planet.get({
        id: '1',
      })
      console.log('✅ Planet:', JSON.stringify(planet, null, 2))
    } catch (error: any) {
      console.log('⚠️  Get not implemented yet:', error.message)
    }
    console.log()

    console.log('🎉 All tests completed!')
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

main()
