# Southern California Lichen Empire - Setup Instructions

## File Structure

You need to create the following file structure in your Next.js project:

```
lichen-idle-game/
├── app/
│   ├── context/
│   │   └── GameContext.tsx          (NEW)
│   ├── store/
│   │   └── page.tsx                 (NEW)
│   ├── layout.tsx                   (REPLACE)
│   └── page.tsx                     (REPLACE - this is the main terrarium)
├── package.json
└── ...
```

## Step-by-Step Setup

### 1. Create the context folder and GameContext.tsx

```bash
mkdir -p app/context
```

Copy `GameContext.tsx` to `app/context/GameContext.tsx`

### 2. Create the store folder and store page

```bash
mkdir -p app/store
```

Copy `page-store.tsx` to `app/store/page.tsx`

### 3. Replace the main page

Copy `page-main.tsx` to `app/page.tsx` (this replaces your current page)

### 4. Update the layout

Copy `layout.tsx` to `app/layout.tsx` (this wraps everything with GameProvider)

## Game Mechanics

### Starting the Game
- You start with **1 glucose**
- You have a **rock substrate** (20×20 grid) as your default terrain
- **Humidity starts at 0%** (no rain yet)

### Main Page (Terrarium)
- **Top-down view** of your lichen terrarium
- **Grid system** (20×20 cells) where you place lichens
- **Humidity bar** that shows current moisture level
- **Miracle button** - triggers rain for 100 glucose

### Store Page
- Buy **substrates** (branches):
  - Manzanita Branch (3×3 cells) - 100 glucose
  - Coast Live Oak Branch (5×5 cells) - 100 glucose
- Buy **lichens** - cost = observation count from iNaturalist
- Each lichen shows:
  - Substrate compatibility (rock 🪨, wood 🌳, or both)
  - Glucose generation rate
  - How many you own

### Gameplay Loop

1. **Buy your first lichen** (look for one with 1 observation = 1 glucose)
2. **Place it on the rock** in the terrarium
3. **Trigger rain** (100 glucose) to:
   - Restore humidity to 100%
   - Multiply all lichens ×2
   - Start glucose generation
4. **Humidity drains** over 60 seconds
   - Lichens produce glucose based on current humidity
   - At 0% humidity, glucose production stops
5. **Buy more lichens and branches** as you accumulate glucose
6. **Stack branches** to preserve humidity longer (upcoming feature)

### Lichen Placement Rules
- Lichens must be placed on compatible substrates
- Placing on an occupied cell **kills the previous lichen**
- This is the only way to "move" lichens
- Each lichen shows its multiplier (×1, ×2, ×4, etc.)

### Substrate Preferences (Examples)
- **Rock only**: Green Shield (Flavoparmelia), Sunburst (Xanthoria)
- **Wood only**: Lace Lichen (Ramalina), Beard Lichen (Usnea)
- **Both**: Golden Dust (Candelaria), some Physcia species

## Key Features

### ✅ Implemented
- Glucose economy
- Real iNaturalist data for 500+ lichen species
- Substrate system (rock, manzanita, oak)
- Lichen placement on grid
- Humidity system
- Rain/Miracle mechanic
- Lichen multiplication (×2 each rain)
- Glucose generation tied to humidity
- LocalStorage save/load
- Navigation between terrarium and store

### 🔄 Future Enhancements
- Branch stacking for humidity preservation
- Better substrate placement (drag and drop)
- Visual improvements
- More realistic lichen spread mechanics
- Achievement system
- Prestige/reset mechanics

## Troubleshooting

### If lichens don't load:
1. Check browser console for errors
2. Make sure you have internet connection (needs iNaturalist API)
3. Try refreshing the page

### If game state is lost:
- Game saves to localStorage automatically
- Clear browser data will reset the game
- Use browser's localStorage inspector to check saved state

### If you can't place lichens:
1. Make sure you've bought the lichen in the store
2. Check substrate compatibility (rock vs wood)
3. Select the lichen from your inventory first

## Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the terrarium.

Navigate to [http://localhost:3000/store](http://localhost:3000/store) for the store.

## Data Sources

All lichen data comes from the [iNaturalist API](https://api.inaturalist.org/v1/docs/), specifically:
- Southern California lichens (radius around lat 33.5, lng -117.7)
- Observation counts are real community science data
- Photos from iNaturalist community

## Credits

Built with:
- Next.js 15
- React 19
- Tailwind CSS
- iNaturalist API