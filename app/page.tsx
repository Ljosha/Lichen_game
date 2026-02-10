'use client'

import { useGame } from './context/GameContext'
import Link from 'next/link'
import { useMemo, useState } from 'react'

export default function TerrariumPage() {
  const {
    glucose,
    humidity,
    realHumidity,
    location,
    weatherLoading,
    substrates,
    placedLichens,
    availableLichens,
    placeLichen,
    triggerRain,
  } = useGame()

  const [selectedLichenId, setSelectedLichenId] = useState<number | null>(null)
  const [message, setMessage] = useState<string>('')

  // Grid size (20x20 cells)
  const GRID_SIZE = 20
  const CELL_SIZE = 30 // pixels

  // Tab styles
  const tabBase =
    "relative inline-flex items-center justify-center gap-2 px-7 py-3 rounded-2xl font-extrabold text-lg transition-all select-none overflow-hidden"

  const tabInactive =
    "text-stone-900 bg-white/90 border border-white/60 shadow-[0_10px_0_rgba(0,0,0,0.22)] " +
    "hover:bg-white hover:shadow-[0_14px_0_rgba(0,0,0,0.22)] " +
    "active:translate-y-1 active:shadow-[0_6px_0_rgba(0,0,0,0.22)]"

  const tabActiveTerrarium =
    "text-white bg-gradient-to-b from-amber-400 to-amber-700 border border-amber-200/40 " +
    "shadow-[0_14px_35px_rgba(251,191,36,0.25)]"

  // Calculate production rates
  const baseGlucosePerSecondAt100 = useMemo(() => {
    return placedLichens.reduce((sum, placed) => {
      const lichen = availableLichens.find(l => l.id === placed.lichenId)
      if (!lichen) return sum
      return sum + (lichen.glucosePerSecond * placed.multiplier)
    }, 0)
  }, [placedLichens, availableLichens])

  const effectiveGlucosePerSecond = useMemo(() => {
    const h = Math.max(0, Math.min(100, humidity))
    return baseGlucosePerSecondAt100 * (h / 100)
  }, [baseGlucosePerSecondAt100, humidity])

  // Handle cell click to place lichen
  const handleCellClick = (x: number, y: number) => {
    if (selectedLichenId === null) {
      setMessage('Select a lichen from your inventory first!')
      setTimeout(() => setMessage(''), 3000)
      return
    }

    const substrate = substrates.find(s =>
      x >= s.x && x < s.x + s.width &&
      y >= s.y && y < s.y + s.height
    )

    if (!substrate) {
      setMessage('No substrate at this position!')
      setTimeout(() => setMessage(''), 3000)
      return
    }

    const success = placeLichen(selectedLichenId, x, y, substrate.id)
    if (success) {
      setMessage('Lichen placed!')
      setTimeout(() => setMessage(''), 2000)
    } else {
      setMessage('Cannot place lichen here! Check substrate compatibility.')
      setTimeout(() => setMessage(''), 3000)
    }
  }

  // Handle rain button
  const handleRain = () => {
    const success = triggerRain()
    if (success) {
      setMessage('Rain activated! Humidity maxed and lichens multiplying!')
      setTimeout(() => setMessage(''), 3500)
    } else {
      setMessage('Not enough glucose! Need 100')
      setTimeout(() => setMessage(''), 3000)
    }
  }

  // Get lichen at position
  const getLichenAtPosition = (x: number, y: number) => {
    return placedLichens.find(p => p.x === x && p.y === y)
  }

  // Get substrate at position
  const getSubstrateAtPosition = (x: number, y: number) => {
    return substrates.find(s =>
      x >= s.x && x < s.x + s.width &&
      y >= s.y && y < s.y + s.height
    )
  }

  // Available lichens to place
  const placeableLichens = availableLichens.filter(l => l.ownedCount > 0)

  return (
    <main className="min-h-screen bg-gradient-to-b from-amber-900 to-amber-700 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-4">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">🦠 Lichen Terrarium</h1>
          <p className="text-amber-200 text-sm">
            {weatherLoading ? 'Loading weather...' : `Real-time weather: ${location}`}
          </p>
        </div>

        {/* Navigation */}
        <div className="flex justify-center gap-3 mb-6">
          <div className={`${tabBase} ${tabActiveTerrarium}`}>
            <span className="text-xl">🦠</span>
            <span>Terrarium</span>
            <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
          </div>

          <Link href="/store" className={`${tabBase} ${tabInactive}`}>
            <span className="text-xl">🛒</span>
            <span>Store</span>
            <div className="absolute inset-0 bg-gradient-to-b from-white/35 to-transparent opacity-70 pointer-events-none" />
          </Link>
        </div>

        {/* Stats Bar */}
        <div className="bg-white rounded-2xl p-4 mb-4 shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Glucose */}
            <div className="text-center rounded-xl bg-stone-50 p-3">
              <p className="text-gray-600 text-sm uppercase tracking-wide">Glucose</p>
              <p className="text-3xl font-bold text-green-600">
                {Math.floor(glucose).toLocaleString()}
              </p>
            </div>

            {/* Glucose/sec */}
            <div className="text-center rounded-xl bg-stone-50 p-3">
              <p className="text-gray-600 text-sm uppercase tracking-wide">Glucose / sec</p>
              <p className="text-3xl font-bold text-stone-900">
                {effectiveGlucosePerSecond.toFixed(2)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                (At 100%: {baseGlucosePerSecondAt100.toFixed(2)}/sec)
              </p>
            </div>

            {/* Humidity */}
            <div className="text-center rounded-xl bg-stone-50 p-3">
              <p className="text-gray-600 text-sm uppercase tracking-wide">Humidity</p>
              <div className="mt-2">
                <div className="bg-gray-200 rounded-full h-6 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      humidity > realHumidity ? 'bg-blue-600' : 'bg-blue-500'
                    }`}
                    style={{ width: `${Math.max(0, Math.min(100, humidity))}%` }}
                  />
                </div>
                <p className="text-sm text-gray-700 mt-1">
                  {Math.floor(humidity)}%
                  {humidity > realHumidity && (
                    <span className="text-blue-700 font-semibold"> (Boosted)</span>
                  )}
                </p>
                <p className="text-xs text-gray-500">Real: {Math.floor(realHumidity)}%</p>
              </div>
            </div>

            {/* Rain Button */}
            <div className="text-center rounded-xl bg-stone-50 p-3">
              <p className="text-gray-600 text-sm uppercase tracking-wide">Miracle</p>
              <button
                onClick={handleRain}
                disabled={glucose < 100}
                className={`mt-2 w-full px-5 py-2.5 rounded-xl font-bold transition-all ${
                  glucose >= 100
                    ? 'bg-blue-600 hover:bg-blue-700 text-white active:scale-[0.98]'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                🌧️ Rain (100g)
              </button>
              <p className="text-xs text-gray-500 mt-1">
                100% humidity + multiply
              </p>
            </div>
          </div>

          {/* Message */}
          {message && (
            <div className="mt-4 text-center text-sm font-semibold text-blue-700">
              {message}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Terrarium Grid */}
          <div className="lg:col-span-3 bg-stone-900/80 backdrop-blur rounded-2xl p-4 shadow-xl border border-white/10">
            <h2 className="text-white text-xl font-bold mb-3">Terrarium (Top-Down View)</h2>
            <div
              className="inline-block rounded-xl overflow-hidden"
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${GRID_SIZE}, ${CELL_SIZE}px)`,
                gridTemplateRows: `repeat(${GRID_SIZE}, ${CELL_SIZE}px)`,
                gap: '1px',
                backgroundColor: '#78716c'
              }}
            >
              {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, index) => {
                const x = index % GRID_SIZE
                const y = Math.floor(index / GRID_SIZE)
                const placedLichen = getLichenAtPosition(x, y)
                const substrate = getSubstrateAtPosition(x, y)
                const lichen = placedLichen
                  ? availableLichens.find(l => l.id === placedLichen.lichenId)
                  : null

                let bgColor = '#57534e'
                if (substrate) {
                  if (substrate.type === 'manzanita') bgColor = '#92400e'
                  else if (substrate.type === 'oak') bgColor = '#78350f'
                }

                return (
                  <div
                    key={index}
                    onClick={() => handleCellClick(x, y)}
                    className="cursor-pointer hover:opacity-85 transition relative"
                    style={{
                      width: CELL_SIZE,
                      height: CELL_SIZE,
                      backgroundColor: bgColor,
                      backgroundImage: lichen?.imageUrl ? `url(${lichen.imageUrl})` : 'none',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      border: '1px solid rgba(0,0,0,0.25)'
                    }}
                  >
                    {placedLichen && (
                      <div className="absolute bottom-0 right-0 bg-black bg-opacity-70 text-white text-xs px-1 rounded-tl">
                        ×{placedLichen.multiplier}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Legend */}
            <div className="mt-4 text-white text-sm">
              <p className="font-bold mb-2">Substrate Colors:</p>
              <div className="flex gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-stone-700 rounded border border-white/50"></div>
                  <span>Rock</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded border border-white/50" style={{ backgroundColor: '#92400e' }}></div>
                  <span>Manzanita</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded border border-white/50" style={{ backgroundColor: '#78350f' }}></div>
                  <span>Oak</span>
                </div>
              </div>
            </div>
          </div>

          {/* Inventory Sidebar */}
          <div className="bg-white rounded-2xl p-4 shadow-xl">
            <h2 className="text-xl font-bold mb-2 text-center">📦 Inventory</h2>
            <p className="text-xs text-gray-500 text-center mb-3">
              Select a lichen, then click the grid to place it
            </p>

            {placeableLichens.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400 text-sm mb-4">No lichens in inventory</p>
                <Link
                  href="/store"
                  className="inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl font-bold text-sm transition active:scale-[0.98]"
                >
                  🛒 <span>Visit Store</span>
                </Link>
              </div>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                {placeableLichens.map(lichen => (
                  <button
                    key={lichen.id}
                    onClick={() => setSelectedLichenId(lichen.id)}
                    className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
                      selectedLichenId === lichen.id
                        ? 'border-green-600 bg-green-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {lichen.imageUrl && (
                        <img
                          src={lichen.imageUrl}
                          alt={lichen.name}
                          className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate text-gray-900">{lichen.name}</p>
                        <p className="text-xs text-gray-500 italic truncate">{lichen.scientificName}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded font-semibold">
                            × {lichen.ownedCount}
                          </span>
                          <span className="text-xs text-gray-500">
                            {lichen.substrates.includes('rock') && '🪨'}
                            {lichen.substrates.includes('wood') && '🌳'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {selectedLichenId && placeableLichens.length > 0 && (
              <div className="mt-3 p-3 bg-green-100 border-2 border-green-300 rounded-xl text-sm text-center">
                <p className="font-semibold text-green-900">Ready to place!</p>
                <p className="text-xs text-green-800 mt-1">Click any cell on the grid</p>
              </div>
            )}

            {/* Stats */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-600 mb-1">
                <span className="font-semibold">Placed lichens:</span> {placedLichens.length}
              </p>
              <p className="text-xs text-gray-600">
                <span className="font-semibold">In inventory:</span>{' '}
                {placeableLichens.reduce((sum, l) => sum + l.ownedCount, 0)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
