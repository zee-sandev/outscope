import { orpcClient } from './orpc-client.js'

async function main() {
  console.log('🚀 Testing oRPC Client...\n')

  try {
    // Test 1: List planets
    console.log('📋 Fetching planets list...')
    const planets = await orpcClient.planet.list({
      page: 1,
      pageSize: 10,
      search: '',
    })
    console.log('✅ Planets:', JSON.stringify(planets, null, 2))
    console.log()

    // Test 2: Create a planet (if implemented)
    console.log('🌍 Creating a new planet...')
    let planetId: string | undefined
    try {
      const newPlanet = await orpcClient.planet.create({
        name: `Mars-${Date.now()}`,
        type: 'terrestrial',
        hasLife: false,
      })
      planetId = newPlanet?.id
      console.log('✅ Created planet:', JSON.stringify(newPlanet, null, 2))
    } catch (error: any) {
      console.log('⚠️  Create not implemented yet:', error.message)
    }
    console.log()

    // Test 3: Get a specific planet (if implemented)
    console.log('🔍 Fetching specific planet...')
    try {
      const planet = await orpcClient.planet.get({
        id: planetId!,
      })
      console.log('✅ Planet:', JSON.stringify(planet, null, 2))
    } catch (error: any) {
      console.log('⚠️  Get not implemented yet:', error.message)
    }
    console.log()

    // Test 4: Get current user
    console.log('🔍 Fetching current user...')
    const user = await orpcClient.user.getCurrentUser({})
    console.log('✅ User:', JSON.stringify(user, null, 2))
    console.log()

    console.log('🎉 All tests completed!')
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

main()
