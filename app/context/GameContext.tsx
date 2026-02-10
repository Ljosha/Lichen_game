'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

// Types
export interface Lichen {
  id: number
  name: string
  scientificName: string
  observations: number
  imageUrl: string | null
  glucosePerSecond: number
  substrates: ('rock' | 'wood')[] // What this lichen can grow on
}

export interface OwnedLichen extends Lichen {
  ownedCount: number // How many you've bought
}

export interface PlacedLichen {
  lichenId: number
  x: number // Grid position
  y: number
  substrateId: string // Which substrate it's on
  multiplier: number // How many times it's multiplied
}

export interface Substrate {
  id: string
  type: 'rock' | 'manzanita' | 'oak'
  x: number
  y: number
  width: number
  height: number
  stackLevel: number // For stacked branches
}

interface GameContextType {
  // Resources
  glucose: number
  setGlucose: React.Dispatch<React.SetStateAction<number>>
  
  // Lichens
  availableLichens: OwnedLichen[]
  setAvailableLichens: React.Dispatch<React.SetStateAction<OwnedLichen[]>>
  placedLichens: PlacedLichen[]
  setPlacedLichens: React.Dispatch<React.SetStateAction<PlacedLichen[]>>
  
  // Substrates
  substrates: Substrate[]
  setSubstrates: React.Dispatch<React.SetStateAction<Substrate[]>>
  
  // Environment
  humidity: number
  setHumidity: React.Dispatch<React.SetStateAction<number>>
  realHumidity: number // Real-world humidity from weather API
  location: string
  weatherLoading: boolean
  
  // Actions
  buyLichen: (lichenId: number, cost: number) => boolean
  buySubstrate: (type: 'manzanita' | 'oak', cost: number) => boolean
  placeLichen: (lichenId: number, x: number, y: number, substrateId: string) => boolean
  triggerRain: () => boolean
}

const GameContext = createContext<GameContextType | undefined>(undefined)

export function GameProvider({ children }: { children: ReactNode }) {
  // Load from localStorage on mount
  const [glucose, setGlucose] = useState(1)
  const [availableLichens, setAvailableLichens] = useState<OwnedLichen[]>([])
  const [placedLichens, setPlacedLichens] = useState<PlacedLichen[]>([])
  const [substrates, setSubstrates] = useState<Substrate[]>([
    // Default rock substrate (the main terrain)
    {
      id: 'rock-main',
      type: 'rock',
      x: 0,
      y: 0,
      width: 20,
      height: 20,
      stackLevel: 0
    }
  ])
  const [humidity, setHumidity] = useState(0)
  const [realHumidity, setRealHumidity] = useState(0)
  const [location, setLocation] = useState('Unknown')
  const [weatherLoading, setWeatherLoading] = useState(true)

  // Fetch real-time weather data
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        // Get user's location
        if ('geolocation' in navigator) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const lat = position.coords.latitude
              const lon = position.coords.longitude
              
              // Fetch weather from Open-Meteo API (no key required!)
              const weatherResponse = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=relative_humidity_2m,temperature_2m&timezone=auto`
              )
              const weatherData = await weatherResponse.json()
              
              const currentHumidity = weatherData.current.relative_humidity_2m
              setRealHumidity(currentHumidity)
              setHumidity(currentHumidity)
              setLocation(`${lat.toFixed(2)}°, ${lon.toFixed(2)}°`)
              setWeatherLoading(false)
            },
            (error) => {
              console.error('Geolocation error:', error)
              // Default to Los Angeles if location denied
              fetchDefaultWeather()
            }
          )
        } else {
          fetchDefaultWeather()
        }
      } catch (error) {
        console.error('Weather fetch error:', error)
        fetchDefaultWeather()
      }
    }

    const fetchDefaultWeather = async () => {
      try {
        // Default to Los Angeles
        const weatherResponse = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=34.05&longitude=-118.24&current=relative_humidity_2m,temperature_2m&timezone=auto`
        )
        const weatherData = await weatherResponse.json()
        const currentHumidity = weatherData.current.relative_humidity_2m
        setRealHumidity(currentHumidity)
        setHumidity(currentHumidity)
        setLocation('Los Angeles, CA')
        setWeatherLoading(false)
      } catch (error) {
        console.error('Default weather fetch error:', error)
        setRealHumidity(50)
        setHumidity(50)
        setLocation('Unknown')
        setWeatherLoading(false)
      }
    }

    fetchWeather()
    
    // Refresh weather every 10 minutes
    const interval = setInterval(fetchWeather, 10 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  // Load game state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('lichenGameState')
    if (saved) {
      try {
        const state = JSON.parse(saved)
        setGlucose(state.glucose || 1)
        setAvailableLichens(state.availableLichens || [])
        setPlacedLichens(state.placedLichens || [])
        setSubstrates(state.substrates || substrates)
      } catch (e) {
        console.error('Failed to load game state:', e)
      }
    }
  }, [])

  // Save game state to localStorage
  useEffect(() => {
    const state = {
      glucose,
      availableLichens,
      placedLichens,
      substrates
    }
    localStorage.setItem('lichenGameState', JSON.stringify(state))
  }, [glucose, availableLichens, placedLichens, substrates])

  // Glucose generation based on real-world humidity and placed lichens
  useEffect(() => {
    if (humidity <= 0 || placedLichens.length === 0) return

    const interval = setInterval(() => {
      let totalGlucose = 0

      placedLichens.forEach(placed => {
        const lichen = availableLichens.find(l => l.id === placed.lichenId)
        if (lichen) {
          // Glucose = base rate * multiplier * humidity percentage
          const glucosePerTick = (lichen.glucosePerSecond / 10) * placed.multiplier * (humidity / 100)
          totalGlucose += glucosePerTick
        }
      })

      setGlucose(prev => prev + totalGlucose)
    }, 100) // Update every 100ms

    return () => clearInterval(interval)
  }, [humidity, placedLichens, availableLichens])

  // Buy a lichen
  const buyLichen = (lichenId: number, cost: number): boolean => {
    if (glucose < cost) return false

    setGlucose(prev => prev - cost)
    setAvailableLichens(prev => {
      const existing = prev.find(l => l.id === lichenId)
      if (existing) {
        return prev.map(l =>
          l.id === lichenId ? { ...l, ownedCount: l.ownedCount + 1 } : l
        )
      }
      return prev
    })
    return true
  }

  // Buy a substrate (branch)
  const buySubstrate = (type: 'manzanita' | 'oak', cost: number): boolean => {
    if (glucose < cost) return false

    setGlucose(prev => prev - cost)

    const id = `${type}-${Date.now()}`
    const width = type === 'manzanita' ? 3 : 5
    const height = type === 'manzanita' ? 3 : 5

    // Find a place to put it (basic: next to existing)
    const x = 2 + Math.floor(Math.random() * 12)
    const y = 2 + Math.floor(Math.random() * 12)

    setSubstrates(prev => [
      ...prev,
      {
        id,
        type,
        x,
        y,
        width,
        height,
        stackLevel: 0
      }
    ])

    return true
  }

  // Place lichen on a substrate
  const placeLichen = (lichenId: number, x: number, y: number, substrateId: string): boolean => {
    const owned = availableLichens.find(l => l.id === lichenId)
    if (!owned || owned.ownedCount <= 0) return false

    // Decrease inventory count
    setAvailableLichens(prev =>
      prev.map(l =>
        l.id === lichenId ? { ...l, ownedCount: l.ownedCount - 1 } : l
      )
    )

    // Add placed lichen
    setPlacedLichens(prev => [
      ...prev,
      {
        lichenId,
        x,
        y,
        substrateId,
        multiplier: 1
      }
    ])

    return true
  }

  // Trigger rain (Miracle) - temporarily boost humidity
  const triggerRain = (): boolean => {
    const cost = 100
    if (glucose < cost) return false

    setGlucose(prev => prev - cost)
    
    // Boost humidity to 100% temporarily
    setHumidity(100)
    
    // Multiply lichens (×2 soredia spread)
    setPlacedLichens(prev =>
      prev.map(lichen => ({
        ...lichen,
        multiplier: lichen.multiplier * 2
      }))
    )

    // Return to real humidity after 60 seconds
    setTimeout(() => {
      setHumidity(realHumidity)
    }, 60000)

    return true
  }

  return (
    <GameContext.Provider
      value={{
        glucose,
        setGlucose,
        availableLichens,
        setAvailableLichens,
        placedLichens,
        setPlacedLichens,
        substrates,
        setSubstrates,
        humidity,
        setHumidity,
        realHumidity,
        location,
        weatherLoading,
        buyLichen,
        buySubstrate,
        placeLichen,
        triggerRain
      }}
    >
      {children}
    </GameContext.Provider>
  )
}

export function useGame() {
  const context = useContext(GameContext)
  if (!context) {
    throw new Error('useGame must be used within GameProvider')
  }
  return context
}