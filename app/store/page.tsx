'use client'

import { useGame, Lichen, OwnedLichen } from '../context/GameContext'
import Link from 'next/link'
import { useState, useEffect } from 'react'

export default function StorePage() {
  const { glucose, availableLichens, setAvailableLichens, buyLichen, buySubstrate } = useGame()

  const [allLichens, setAllLichens] = useState<Lichen[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Tab styles
  const tabBase =
    "relative inline-flex items-center justify-center gap-2 px-7 py-3 rounded-2xl font-extrabold text-lg transition-all select-none overflow-hidden"

  const tabInactive =
    "text-stone-900 bg-white/90 border border-white/60 shadow-[0_10px_0_rgba(0,0,0,0.22)] " +
    "hover:bg-white hover:shadow-[0_14px_0_rgba(0,0,0,0.22)] " +
    "active:translate-y-1 active:shadow-[0_6px_0_rgba(0,0,0,0.22)]"

  const tabActiveStore =
    "text-white bg-gradient-to-b from-emerald-400 to-emerald-700 border border-emerald-200/40 " +
    "shadow-[0_14px_35px_rgba(16,185,129,0.25)]"

  // Fetch lichens from iNaturalist API
  useEffect(() => {
    fetchLichens()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchLichens = async () => {
    try {
      setLoading(true)

      const allLichensData: any[] = []
      const perPage = 200
      let page = 1
      let hasMore = true

      while (hasMore && page <= 10) {
        const response = await fetch(
          'https://api.inaturalist.org/v1/observations/species_counts?' +
            'taxon_id=54743&' +
            'place_id=14&' +
            'lat=33.5&lng=-117.7&radius=200&' +
            `per_page=${perPage}&` +
            `page=${page}&` +
            'order=asc&' +
            'order_by=count'
        )

        if (!response.ok) {
          throw new Error('Failed to fetch lichen data')
        }

        const data = await response.json()

        if (data.results && data.results.length > 0) {
          allLichensData.push(...data.results)

          if (data.results.length < perPage) {
            hasMore = false
          } else {
            page++
          }
        } else {
          hasMore = false
        }
      }

      console.log(`Fetched ${allLichensData.length} lichen species from Southern California`)

      const getSubstratePreference = (scientificName: string): ('rock' | 'wood')[] => {
        const name = scientificName.toLowerCase()

        if (name.includes('ramalina') || name.includes('usnea') || name.includes('evernia')) {
          return ['wood']
        }

        if (
          name.includes('flavoparmelia') ||
          name.includes('xanthoria') ||
          name.includes('caloplaca') ||
          name.includes('lecanora') ||
          name.includes('aspicilia')
        ) {
          return ['rock']
        }

        if (
          name.includes('candelaria') ||
          name.includes('physcia') ||
          name.includes('phaeophyscia') ||
          name.includes('acarospora')
        ) {
          return ['rock', 'wood']
        }

        return ['rock']
      }

      const lichenData: Lichen[] = allLichensData.map((result: any) => {
        const observations = result.count

        return {
          id: result.taxon.id,
          name: result.taxon.preferred_common_name || result.taxon.name,
          scientificName: result.taxon.name,
          observations: observations,
          imageUrl: result.taxon.default_photo?.medium_url || null,
          glucosePerSecond: Math.max(0.01, observations / 100),
          substrates: getSubstratePreference(result.taxon.name),
        }
      })

      lichenData.sort((a, b) => a.observations - b.observations)

      setAllLichens(lichenData)

      if (availableLichens.length === 0) {
        const ownedLichens: OwnedLichen[] = lichenData.map(l => ({
          ...l,
          ownedCount: 0,
        }))
        setAvailableLichens(ownedLichens)
      }

      setLoading(false)
    } catch (err) {
      console.error('Error fetching lichens:', err)
      setError('Failed to load lichen data. Please refresh the page.')
      setLoading(false)
    }
  }

  const handleBuyLichen = (lichen: Lichen) => {
    const success = buyLichen(lichen.id, lichen.observations)
    if (!success) {
      alert('Not enough glucose!')
    }
  }

  const handleBuySubstrate = (type: 'manzanita' | 'oak') => {
    const success = buySubstrate(type, 100)
    if (!success) {
      alert('Not enough glucose! (Need 100)')
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-green-900 to-green-700 p-8 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="text-2xl animate-pulse mb-4">🔬 Loading ALL Southern California lichens...</div>
          <p className="text-green-200 text-sm">This may take a moment as we fetch all species from iNaturalist</p>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-green-900 to-green-700 p-8 flex items-center justify-center">
        <div className="text-white text-xl bg-red-900 p-6 rounded-lg">
          <p>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 bg-white text-red-900 px-6 py-2 rounded font-bold"
          >
            Retry
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-900 to-green-700 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">🦠 Southern California Lichen Empire</h1>
          <p className="text-green-200 text-sm md:text-base">
            Real lichens from iNaturalist • Observation counts = glucose value
          </p>
        </div>

        {/* Navigation */}
        <div className="flex justify-center gap-3 mb-6">
          <Link href="/" className={`${tabBase} ${tabInactive}`}>
            <span className="text-xl">🦠</span>
            <span>Terrarium</span>
            <div className="absolute inset-0 bg-gradient-to-b from-white/35 to-transparent opacity-70 pointer-events-none" />
          </Link>

          <div className={`${tabBase} ${tabActiveStore}`}>
            <span className="text-xl">🛒</span>
            <span>Store</span>
            <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
          </div>
        </div>

        {/* Glucose Display */}
        <div className="bg-white rounded-xl p-6 mb-6 shadow-xl">
          <div className="text-center">
            <p className="text-gray-600 text-sm uppercase tracking-wide">Glucose</p>
            <p className="text-5xl md:text-6xl font-bold text-green-600">{Math.floor(glucose).toLocaleString()}</p>
          </div>
        </div>

        {/* Substrates Section */}
        <div className="bg-white rounded-xl p-6 mb-6 shadow-xl">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">Substrates</h2>
          <p className="text-gray-600 text-sm mb-6">
            Buy branches to place in your terrarium. Wood-loving lichens need these!
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Manzanita Branch */}
            <div className="border-2 border-green-500 bg-green-50 rounded-xl p-4">
              <h3 className="font-bold text-lg mb-2">🌿 Manzanita Branch</h3>
              <p className="text-sm text-gray-600 mb-2">Small branch (3×3 cells)</p>
              <p className="text-sm text-gray-600 mb-3">Good for wood-loving lichens</p>
              <button
                onClick={() => handleBuySubstrate('manzanita')}
                disabled={glucose < 100}
                className={`w-full px-4 py-3 rounded-xl font-bold transition-all ${
                  glucose >= 100
                    ? 'bg-green-500 hover:bg-green-600 text-white active:scale-95'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {glucose >= 100 ? '🛒 Buy for 100 glucose' : '🔒 Need 100 glucose'}
              </button>
            </div>

            {/* Coast Live Oak Branch */}
            <div className="border-2 border-green-500 bg-green-50 rounded-xl p-4">
              <h3 className="font-bold text-lg mb-2">🌳 Coast Live Oak Branch</h3>
              <p className="text-sm text-gray-600 mb-2">Large branch (5×5 cells)</p>
              <p className="text-sm text-gray-600 mb-3">More space for lichens!</p>
              <button
                onClick={() => handleBuySubstrate('oak')}
                disabled={glucose < 100}
                className={`w-full px-4 py-3 rounded-xl font-bold transition-all ${
                  glucose >= 100
                    ? 'bg-green-500 hover:bg-green-600 text-white active:scale-95'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {glucose >= 100 ? '🛒 Buy for 100 glucose' : '🔒 Need 100 glucose'}
              </button>
            </div>
          </div>
        </div>

        {/* Lichen Shop */}
        <div className="bg-white rounded-xl p-6 shadow-xl">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">Lichen Shop</h2>
          <p className="text-gray-600 text-sm mb-6">
            Each lichen costs its observation count in glucose. Generates glucose based on real iNaturalist data!
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto pr-2">
            {allLichens.map((lichen) => {
              const cost = lichen.observations
              const canAfford = glucose >= cost
              const owned = availableLichens.find(l => l.id === lichen.id)?.ownedCount || 0

              return (
                <div
                  key={lichen.id}
                  className={`border-2 rounded-xl p-4 transition-all ${
                    canAfford ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-gray-50'
                  }`}
                >
                  {/* Lichen Image */}
                  {lichen.imageUrl && (
                    <div className="mb-3 rounded-lg overflow-hidden bg-gray-200 h-32 flex items-center justify-center">
                      <img
                        src={lichen.imageUrl}
                        alt={lichen.name}
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                  )}

                  {/* Lichen Info */}
                  <div className="mb-3">
                    <h3 className="font-bold text-lg text-gray-800 line-clamp-1">{lichen.name}</h3>
                    <p className="text-xs text-gray-500 italic line-clamp-1 mb-2">{lichen.scientificName}</p>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>💰 Cost: {cost.toLocaleString()} glucose</p>
                      <p>⚡ Generates: {lichen.glucosePerSecond.toFixed(2)}/sec</p>
                      <p>📊 Observations: {lichen.observations.toLocaleString()}</p>
                      {owned > 0 && (
                        <p className="text-green-600 font-semibold">✅ Owned: {owned}</p>
                      )}
                    </div>
                  </div>

                  {/* Buy Button */}
                  <button
                    onClick={() => handleBuyLichen(lichen)}
                    disabled={!canAfford}
                    className={`w-full px-4 py-3 rounded-xl font-bold transition-all ${
                      canAfford
                        ? 'bg-green-500 hover:bg-green-600 text-white active:scale-95'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {canAfford ? '🛒 Buy' : '🔒 Locked'}
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        {/* Info Footer */}
        <div className="mt-6 text-center text-green-100 text-sm">
          <p className="mb-2 text-base font-semibold">🦠 {allLichens.length} unique lichen species available</p>
          <p>
            Data from{' '}
            <a
              href="https://www.inaturalist.org/projects/lichens-of-southern-california"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-white"
            >
              iNaturalist - Lichens of Southern California
            </a>
          </p>
          <p className="mt-1">Observation counts represent real community science data 🔬</p>
        </div>
      </div>
    </main>
  )
}
