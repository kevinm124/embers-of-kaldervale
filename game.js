/**
 * Embers of Kaldervale - an incremental survival game
 * Plain JavaScript, no build step
 */

// ============================================
// GAME STATE
// ============================================
const GameState = {
    // Time and weather
    time: 0, // Game ticks
    day: 1, // Day counter
    dayNightCycle: 'dawn', // the clock starts at dawn of day 1
    weather: 'clear',
    
    // Hearth: state is one of Hearth.states (cold, embers, low, steady, blazing)
    hearthState: 'cold',
    hearthHeat: 0,
    
    // Resources
    resources: {
        wood: 0,
        food: 0,
        hide: 0,
        cloth: 0,
        iron: 0,
        coal: 0,
        steel: 0
    },
    
    // Buildings
    buildings: {
        snare: 0,
        sledge: 0,
        shelter: 0,
        huntingCamp: 0,
        waystation: 0,
        loom: 0,
        rootCellar: 0,
        forge: 0,
        smelter: 0,
        arsenal: 0,
        mill: 0,        // New: Increases food production
        mapRoom: 0,     // New: Unlocks tech upgrades
        commonHall: 0   // Increases happiness
    },
    
    // Crafted items
    items: {
        lantern: 0,
        canteen: 0,
        rations: 0,
        hideCoat: 0,
        ironSpear: 0,
        steelSabre: 0
    },
    
    // Population
    population: 0,
    maxPopulation: 0,
    workers: {
        woodcutter: 0,
        hunter: 0,
        snarer: 0,
        farmer: 0,
        weaver: 0,
        prospector: 0,
        collier: 0,
        smelterHand: 0,
        guard: 0,
        healer: 0,
        merchant: 0
    },
    
    // Village state
    village: {
        happiness: 50,
        defense: 0,
        foodConsumption: 0.1,
        lastAttack: 0,
        buildings: {
            well: 0,
            tavern: 0,
            temple: 0,
            barracks: 0,
            market: 0,
            watchtower: 0
        }
    },
    
    // Player stats
    player: {
        health: 100,
        maxHealth: 100,
        warmth: 50,
        location: 'room',
        mapPosition: { x: 20, y: 20 },
        exploredTiles: new Set(),
        // Combat stats
        attack: 5,
        defense: 2,
        criticalChance: 0.05,
        dodgeChance: 0.05
    },
    
    // Combat state
    combat: {
        active: false,
        enemy: null,
        turn: 'player',
        log: []
    },
    
    // Unlocks
    unlocks: {
        forest: false,
        crafting: false,
        buildings: false,
        map: false,
        village: false,
        iron: false,
        coal: false,
        steel: false,
        combat: false
    },
    
    // Settings
    settings: {
        notifications: true,
        autoSave: true
    },

    // Seed for the world map, saved so the map is the same after a reload
    worldSeed: null,

    // Story progress
    story: {
        seen: [],     // ids of story beats already shown
        journal: [],  // ids of journal pages found
        ended: false
    }
};

// ============================================
// GAME CONFIGURATION
// ============================================
const Config = {
    tickRate: 100, // ms per tick
    hearthDrainRate: 0.1,   // heat lost per tick = 1/s, so a full hearth lasts ~100s in clear weather
    hearthLogHeat: 15,      // heat added per log
    maxHearthHeat: 100,
    hearthRekindleCost: 5,  // wood to rekindle a cold hearth (the very first kindling is free)
    hearthRekindleHeat: 20,
    smeltCost: { iron: 2, coal: 1 }, // Smelter: makes 1 steel
    smeltCooldown: 4000, // ms
    chopWoodCooldown: 2000, // ms
    snareCheckInterval: 30000, // ms
    dayNightCycleDuration: 60000, // ms per cycle
    
    // Resource costs
    costs: {
        snare: { wood: 10 },
        sledge: { wood: 30 },
        shelter: { wood: 50, hide: 10 },
        huntingCamp: { wood: 100, hide: 50 },
        waystation: { wood: 75, hide: 25 },
        loom: { wood: 50, cloth: 10 },
        rootCellar: { wood: 50, hide: 20 },
        forge: { wood: 100, iron: 25 },
        smelter: { wood: 150, iron: 50 },
        arsenal: { wood: 100, steel: 25 },
        mill: { wood: 80, iron: 10 },           // New: Boosts food production
        mapRoom: { wood: 120, cloth: 20 },      // New: Unlocks tech
        commonHall: { wood: 100, hide: 30, cloth: 10 }, // Happiness boost
        
        lantern: { wood: 1, cloth: 1 },
        canteen: { hide: 5 },
        rations: { food: 5, wood: 1 },
        hideCoat: { hide: 20, cloth: 5 },
        ironSpear: { iron: 20, wood: 5 },
        steelSabre: { steel: 20, wood: 5 },
        compass: { iron: 10, cloth: 5 },        // New: Improves exploration
        map: { cloth: 10, iron: 5 }             // New: Reveals map
    },
    
    // Building production rates
    production: {
        snare: { food: 0.5, hide: 0.2 },
        sledge: { multiplier: 1.5 },
        shelter: { population: 1 },
        huntingCamp: { hunterCapacity: 2 },
        loom: { cloth: 0.1 },
        rootCellar: { rationsBonus: 1.5 },
        mill: { foodBonus: 1.5 },               // New
        mapRoom: { researchSpeed: 1.0 },        // New
        commonHall: { happinessBonus: 10 }
    }
};

// ============================================
// NARRATIVE SYSTEM
// ============================================
const Narratives = {
    intro: [
        "Snow, then nothing. The last thing you remember is the sled rope snapping and the white swallowing the lantern ahead.",
        "You wake on the floorboards of an empty cabin, your cartographer's satchel still strapped across your chest. The hearth holds only grey ash.",
        "Your fingers have stopped hurting, which is worse than if they still did. You need heat, now."
    ],
    
    hearthLit: [
        "The kindling catches. Orange light crawls up the log walls.",
        "Heat reaches your face. Feeling comes back into your fingers, painfully.",
        "The hearth takes hold. Shadows of old snowshoes and rope sway on the walls."
    ],
    
    hearthBlazing: [
        "The hearth blazes. Meltwater drips from your coat onto the floor.",
        "The heat pushes the frost back from the window.",
        "For the first time since the storm, you feel safe."
    ],
    
    hearthLow: [
        "The hearth is burning low. The cold leans on the door.",
        "Only a few embers glow now. It needs feeding.",
        "The light shrinks back toward the hearthstones."
    ],
    
    hearthCold: [
        "The last ember dies. The cold comes in through every crack at once.",
        "The hearth is cold. Your breath hangs in the dark.",
        "Without the hearth, the cabin creaks under the weight of the snow."
    ],
    
    forestDiscovered: [
        "Through the frosted window you can see pines standing shoulder to shoulder, bent under snow.",
        "Dead branches stick out of the drifts at the treeline. Enough to keep a hearth going.",
        "A deer trail leads from the door into the pines. There will be wood out there."
    ],
    
    villageFounded: [
        "There are enough of you now to call this place a settlement.",
        "Axes ring in the pines. Someone has started singing while they work.",
        "The cabin is no longer a shelter. It is the middle of something."
    ],
    
    weather: {
        clear: [
            "The sun breaks through the clouds, warming your face.",
            "A beautiful clear sky stretches above.",
            "The weather is pleasant. A good day to be outside."
        ],
        cloudy: [
            "Grey clouds drift lazily across the sky.",
            "The sky is overcast, casting a muted light.",
            "Clouds gather, threatening rain."
        ],
        rain: [
            "Rain patters against the roof. The hearth hisses softly.",
            "A steady rain falls, making the world feel smaller.",
            "Water drips through the cracks in the roof."
        ],
        storm: [
            "Thunder crashes overhead! The hearth gutters wildly.",
            "Lightning turns the frosted window white for an instant.",
            "The storm rages outside. You're glad to be sheltered."
        ],
        snow: [
            "Snow falls silently, blanketing the world in white.",
            "The cold seeps in despite the hearth.",
            "A layer of frost forms on the window."
        ],
        fog: [
            "A thick fog rolls in, obscuring the world outside.",
            "You can barely see past the window.",
            "The fog makes everything feel eerie and quiet."
        ],
        wind: [
            "The wind howls outside, rattling the shutters.",
            "Gusts of wind push against the cabin walls.",
            "A strong wind whips through the trees."
        ]
    }
};

// ============================================
// UTILITY FUNCTIONS
// ============================================
const Utils = {
    // Random number between min and max
    random(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    
    // Random element from array
    randomChoice(array) {
        return array[Math.floor(Math.random() * array.length)];
    },
    
    // Clamp value between min and max
    clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    },
    
    // Format number with commas
    formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    },
    
    // Deep clone object
    deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    },
    
    // Check if player can afford cost
    canAfford(costs) {
        for (let resource in costs) {
            if (GameState.resources[resource] < costs[resource]) {
                return false;
            }
        }
        return true;
    },
    
    // Deduct resources
    deductResources(costs) {
        for (let resource in costs) {
            GameState.resources[resource] -= costs[resource];
        }
    },
    
    // Add resources
    addResources(resources) {
        for (let resource in resources) {
            GameState.resources[resource] += resources[resource];
            this.revealResource(resource);
        }
    },
    
    // Reveal resource UI
    revealResource(resource) {
        const container = document.getElementById(`${resource}-container`);
        if (container) {
            container.classList.remove('hidden');
        }
    }
};

// ============================================
// UI MANAGER
// ============================================
const UI = {
    // Initialize UI
    init() {
        this.cacheElements();
        this.bindEvents();
        this.updateAll();
    },
    
    // Cache DOM elements
    cacheElements() {
        this.elements = {
            // Header
            locationTitle: document.getElementById('location-title'),
            timeIcon: document.getElementById('time-icon'),
            timeText: document.getElementById('time-text'),
            
            // Hearth
            hearthVisual: document.getElementById('hearth-visual'),
            hearthIcon: document.getElementById('hearth-icon'),
            hearthStatus: document.getElementById('hearth-status-text'),
            tendHearthBtn: document.getElementById('tend-hearth-btn'),
            
            // Narrative
            narrativeLog: document.getElementById('narrative-log'),
            narrativePanel: document.getElementById('narrative-scroll'),
            
            // Actions
            actionsList: document.getElementById('actions-list'),
            
            // Resources
            woodCount: document.getElementById('wood-count'),
            foodCount: document.getElementById('food-count'),
            hideCount: document.getElementById('hide-count'),
            clothCount: document.getElementById('cloth-count'),
            ironCount: document.getElementById('iron-count'),
            coalCount: document.getElementById('coal-count'),
            steelCount: document.getElementById('steel-count'),
            
            // Panels
            craftingPanel: document.getElementById('crafting-panel'),
            craftingList: document.getElementById('crafting-list'),
            buildingsPanel: document.getElementById('buildings-panel'),
            buildingsList: document.getElementById('buildings-list'),
            upgradesPanel: document.getElementById('upgrades-panel'),
            
            // Population Panel
            populationPanel: document.getElementById('population-panel'),
            populationCount: document.getElementById('population-count'),
            idleCount: document.getElementById('idle-count'),
            assignWorkersBtn: document.getElementById('assign-workers-btn'),
            
            // Worker Assignment Submenu
            workerAssignmentPanel: document.getElementById('worker-assignment-panel'),
            workerAssignmentList: document.getElementById('worker-assignment-list'),
            availableWorkers: document.getElementById('available-workers'),
            closeWorkerAssignmentBtn: document.getElementById('close-worker-assignment-btn'),
            
            // Map
            worldMap: document.getElementById('world-map'),
            mapCanvas: document.getElementById('map-canvas'),
            mapCoordinates: document.getElementById('map-coordinates'),
            mapBtn: document.getElementById('map-btn'),
            closeMapBtn: document.getElementById('close-map-btn'),
            
            // Footer
            saveBtn: document.getElementById('save-btn'),
            resetBtn: document.getElementById('reset-btn')
        };
    },
    
    // Bind event listeners
    bindEvents() {
        // Hearth button
        this.elements.tendHearthBtn.addEventListener('click', () => Hearth.tend());
        
        // Map buttons
        this.elements.mapBtn.addEventListener('click', () => WorldMap.toggle());
        this.elements.closeMapBtn.addEventListener('click', () => WorldMap.toggle());

        // Journal buttons
        document.getElementById('journal-btn')?.addEventListener('click', () => this.toggleJournal());
        document.getElementById('close-journal-btn')?.addEventListener('click', () => this.toggleJournal());

        // Save/Reset buttons
        this.elements.saveBtn.addEventListener('click', () => SaveSystem.save());
        this.elements.resetBtn.addEventListener('click', () => SaveSystem.reset());
        
        // Worker assignment buttons
        this.elements.assignWorkersBtn?.addEventListener('click', () => this.toggleWorkerAssignment());
        this.elements.closeWorkerAssignmentBtn?.addEventListener('click', () => this.toggleWorkerAssignment());
        
        // Combat buttons
        document.getElementById('combat-attack-btn')?.addEventListener('click', () => Combat.attack());
        document.getElementById('combat-defend-btn')?.addEventListener('click', () => Combat.defend());
        document.getElementById('combat-flee-btn')?.addEventListener('click', () => Combat.flee());
        document.getElementById('combat-item-btn')?.addEventListener('click', () => Combat.useItem('rations'));
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (!document.getElementById('combat-panel').classList.contains('hidden')) {
                    // Can't escape combat with ESC
                    return;
                }
                if (!document.getElementById('world-map').classList.contains('hidden')) {
                    WorldMap.toggle();
                }
                if (!document.getElementById('worker-assignment-panel').classList.contains('hidden')) {
                    this.toggleWorkerAssignment();
                }
                if (!document.getElementById('journal-panel').classList.contains('hidden')) {
                    this.toggleJournal();
                }
            }
        });
    },

    toggleJournal() {
        const panel = document.getElementById('journal-panel');
        panel.classList.toggle('hidden');
        if (!panel.classList.contains('hidden')) this.updateJournal();
    },

    // Show the Journal button once a page is found, and list pages in story order
    updateJournal() {
        const found = GameState.story.journal;
        document.getElementById('journal-btn')?.classList.toggle('hidden', found.length === 0);

        const container = document.getElementById('journal-pages');
        if (!container) return;
        container.innerHTML = '';

        Story.journalPages.forEach(page => {
            if (!found.includes(page.id)) return;
            const div = document.createElement('div');
            div.className = 'journal-page';
            const title = document.createElement('h4');
            title.textContent = page.title;
            const text = document.createElement('p');
            text.textContent = page.text;
            div.append(title, text);
            container.appendChild(div);
        });

        const missing = Story.journalPages.length - found.length;
        if (missing > 0) {
            const note = document.createElement('p');
            note.className = 'journal-missing';
            note.textContent = `${missing} page${missing > 1 ? 's are' : ' is'} still missing.`;
            container.appendChild(note);
        }
    },
    
    // Update all UI elements
    updateAll() {
        this.updateResources();
        this.updateHearth();
        this.updateTime();
        this.updateWeather();
        this.updateActions();
        this.updateCrafting();
        this.updateBuildings();
        this.updatePopulation();
        this.updateVillage();
    },
    
    // Update resource display
    updateResources() {
        this.elements.woodCount.textContent = Utils.formatNumber(Math.floor(GameState.resources.wood));
        this.elements.foodCount.textContent = Utils.formatNumber(Math.floor(GameState.resources.food));
        this.elements.hideCount.textContent = Utils.formatNumber(Math.floor(GameState.resources.hide));
        this.elements.clothCount.textContent = Utils.formatNumber(Math.floor(GameState.resources.cloth));
        this.elements.ironCount.textContent = Utils.formatNumber(Math.floor(GameState.resources.iron));
        this.elements.coalCount.textContent = Utils.formatNumber(Math.floor(GameState.resources.coal));
        this.elements.steelCount.textContent = Utils.formatNumber(Math.floor(GameState.resources.steel));
        
        // Update production rates display
        this.updateProductionRates();
    },
    
    // Update production rates display (per second)
    updateProductionRates() {
        const rates = Village.calculateProductionRates();
        
        const resourceRateElements = {
            wood: document.getElementById('wood-rate'),
            food: document.getElementById('food-rate'),
            hide: document.getElementById('hide-rate'),
            cloth: document.getElementById('cloth-rate'),
            iron: document.getElementById('iron-rate'),
            coal: document.getElementById('coal-rate'),
            steel: document.getElementById('steel-rate')
        };
        
        for (let resource in resourceRateElements) {
            const el = resourceRateElements[resource];
            if (el) {
                const rate = rates[resource] || 0;
                if (Math.abs(rate) >= 0.005) {
                    // Show negative rates too (food eaten, inputs used up), in red
                    const digits = Math.abs(rate) < 0.1 ? 2 : 1;
                    el.textContent = `${rate > 0 ? '+' : ''}${rate.toFixed(digits)}/s`;
                    el.classList.toggle('negative', rate < 0);
                    el.style.display = 'inline';
                } else {
                    el.style.display = 'none';
                }
            }
        }
    },
    
    // Update hearth display
    updateHearth() {
        const state = Hearth.stateFor(GameState.hearthHeat);
        const visual = this.elements.hearthVisual;

        visual.classList.remove('glow-hot', 'glow-warm');
        if (state.glow) visual.classList.add(`glow-${state.glow}`);
        this.elements.hearthIcon.style.opacity = String(state.icon);
        this.elements.hearthStatus.textContent = state.label;

        const lit = Hearth.isLit();
        const kindleCost = GameState.unlocks.forest ? Config.hearthRekindleCost : 0;
        this.elements.tendHearthBtn.textContent = lit
            ? 'Feed the Hearth'
            : (kindleCost ? `Kindle the Hearth (${kindleCost} wood)` : 'Kindle the Hearth');
        this.elements.tendHearthBtn.disabled = GameState.resources.wood < (lit ? 1 : kindleCost);
    },

    // Update time display
    updateTime() {
        const time = GameState.dayNightCycle;
        const icons = {
            dawn: '🌅',
            day: '☀️',
            dusk: '🌆',
            night: '🌙'
        };
        
        this.elements.timeIcon.textContent = icons[time] || '🌙';
        this.elements.timeText.textContent = `Day ${GameState.day} - ${time.charAt(0).toUpperCase() + time.slice(1)}`;
    },
    
    // Update weather display
    updateWeather() {
        const weather = Weather.getCurrent();
        const weatherIcon = document.getElementById('weather-icon');
        const weatherText = document.getElementById('weather-text');
        const weatherTemp = document.getElementById('weather-temp');
        const weatherDesc = document.getElementById('weather-desc');
        
        if (weatherIcon) weatherIcon.textContent = weather.icon;
        if (weatherText) weatherText.textContent = weather.name;
        if (weatherTemp) weatherTemp.textContent = Weather.getTemperatureDesc();
        if (weatherDesc) weatherDesc.textContent = weather.description;
        
        // Apply weather visual effects to the page
        this.applyWeatherVisuals(GameState.weather);
    },
    
    // Apply weather visual effects
    applyWeatherVisuals(weatherType) {
        const body = document.body;
        
        // Remove all weather classes
        body.classList.remove('weather-clear', 'weather-cloudy', 'weather-rain', 'weather-storm', 'weather-snow', 'weather-fog', 'weather-wind');
        
        // Add current weather class
        body.classList.add(`weather-${weatherType}`);
    },
    
    // Track last action state to avoid unnecessary rebuilds
    lastActionState: null,
    
    // Update actions panel
    updateActions() {
        // Create a state signature to check if actions changed
        const currentState = {
            forest: GameState.unlocks.forest,
            snare: GameState.buildings.snare,
            huntingCamp: GameState.buildings.huntingCamp,
            smelter: GameState.buildings.smelter
        };

        // Only rebuild if state changed
        if (this.lastActionState &&
            this.lastActionState.forest === currentState.forest &&
            this.lastActionState.snare === currentState.snare &&
            this.lastActionState.huntingCamp === currentState.huntingCamp &&
            this.lastActionState.smelter === currentState.smelter) {
            return; // No changes, don't rebuild
        }
        
        this.lastActionState = currentState;
        
        const actionsList = this.elements.actionsList;
        actionsList.innerHTML = '';
        
        // Chop Wood action (available once the hearth has been kindled)
        if (GameState.unlocks.forest) {
            const chopBtn = document.createElement('button');
            chopBtn.className = 'action-btn';
            chopBtn.id = 'chop-wood-btn';
            chopBtn.textContent = 'Chop Wood';
            chopBtn.addEventListener('click', () => Actions.chopWood());
            actionsList.appendChild(chopBtn);
        }
        
        // Check Snares action
        if (GameState.buildings.snare > 0) {
            const snareBtn = document.createElement('button');
            snareBtn.className = 'action-btn';
            snareBtn.id = 'check-snares-btn';
            snareBtn.textContent = `Check Snares (${GameState.buildings.snare})`;
            snareBtn.addEventListener('click', () => Actions.checkSnares());
            actionsList.appendChild(snareBtn);
        }
        
        // Hunt action
        if (GameState.buildings.huntingCamp > 0) {
            const huntBtn = document.createElement('button');
            huntBtn.className = 'action-btn';
            huntBtn.id = 'hunt-btn';
            huntBtn.textContent = 'Hunt';
            huntBtn.addEventListener('click', () => Actions.hunt());
            actionsList.appendChild(huntBtn);
        }
        
        // Explore action (new)
        if (GameState.unlocks.forest) {
            const exploreBtn = document.createElement('button');
            exploreBtn.className = 'action-btn';
            exploreBtn.id = 'explore-btn';
            exploreBtn.textContent = 'Explore';
            exploreBtn.addEventListener('click', () => Actions.explore());
            actionsList.appendChild(exploreBtn);
        }
        
        // Search for Iron action (available after forest is unlocked)
        if (GameState.unlocks.forest) {
            const searchIronBtn = document.createElement('button');
            searchIronBtn.className = 'action-btn';
            searchIronBtn.id = 'search-iron-btn';
            searchIronBtn.textContent = 'Search for Iron';
            searchIronBtn.addEventListener('click', () => Actions.searchIron());
            actionsList.appendChild(searchIronBtn);
        }

        // Smelt Steel action (the Smelter turns iron + coal into steel)
        if (GameState.buildings.smelter > 0) {
            const smeltBtn = document.createElement('button');
            smeltBtn.className = 'action-btn';
            smeltBtn.id = 'smelt-steel-btn';
            smeltBtn.textContent = `Smelt Steel (${Config.smeltCost.iron} iron, ${Config.smeltCost.coal} coal)`;
            smeltBtn.addEventListener('click', () => Actions.smeltSteel());
            actionsList.appendChild(smeltBtn);
        }
    },
    
    // Update crafting panel
    updateCrafting() {
        const craftingList = this.elements.craftingList;
        craftingList.innerHTML = '';
        
        const recipes = [
            { id: 'lantern', name: 'Lantern', costs: Config.costs.lantern, unlockCheck: () => GameState.resources.cloth > 0 },
            { id: 'canteen', name: 'Canteen', costs: Config.costs.canteen, unlockCheck: () => GameState.resources.hide > 0 },
            { id: 'rations', name: 'Trail Rations', costs: Config.costs.rations, unlockCheck: () => GameState.resources.food >= 5 },
            { id: 'hideCoat', name: 'Hide Coat', costs: Config.costs.hideCoat, unlockCheck: () => GameState.buildings.loom > 0 },
            { id: 'ironSpear', name: 'Iron Spear', costs: Config.costs.ironSpear, unlockCheck: () => GameState.buildings.forge > 0 && GameState.resources.iron > 0 },
            { id: 'steelSabre', name: 'Steel Sabre', costs: Config.costs.steelSabre, unlockCheck: () => GameState.buildings.arsenal > 0 && GameState.resources.steel > 0 }
        ];
        
        let hasUnlockedRecipes = false;
        
        recipes.forEach(recipe => {
            // Check if recipe should be shown (only show if unlocked)
            if (!recipe.unlockCheck || !recipe.unlockCheck()) return;
            
            hasUnlockedRecipes = true;
            const canAfford = Utils.canAfford(recipe.costs);
            const itemCount = GameState.items[recipe.id] || 0;
            
            const item = document.createElement('div');
            item.className = `craft-item ${canAfford ? '' : 'disabled'}`;
            item.innerHTML = `
                <div class="item-name">${recipe.name}</div>
                <div class="item-cost">${this.formatCosts(recipe.costs)}</div>
                ${itemCount > 0 ? `<span class="item-count">Owned: ${itemCount}</span>` : ''}
            `;
            
            if (canAfford) {
                item.addEventListener('click', () => Crafting.craft(recipe.id));
            }
            
            craftingList.appendChild(item);
        });
        
        // Only show panel if there are unlocked recipes
        if (hasUnlockedRecipes) {
            this.elements.craftingPanel.classList.remove('hidden');
        } else {
            this.elements.craftingPanel.classList.add('hidden');
        }
    },
    
    // Update buildings panel
    updateBuildings() {
        const buildingsList = this.elements.buildingsList;
        buildingsList.innerHTML = '';
        
        const buildings = [
            { id: 'snare', name: 'Snare', costs: Config.costs.snare, unlockCheck: () => GameState.unlocks.buildings },
            { id: 'sledge', name: 'Sledge', costs: Config.costs.sledge, max: 1, unlockCheck: () => GameState.unlocks.buildings },
            { id: 'shelter', name: 'Shelter', costs: Config.costs.shelter, unlockCheck: () => GameState.unlocks.buildings },
            { id: 'huntingCamp', name: 'Hunting Camp', costs: Config.costs.huntingCamp, unlockCheck: () => GameState.buildings.shelter > 0 },
            { id: 'waystation', name: 'Waystation', costs: Config.costs.waystation, max: 1, unlockCheck: () => GameState.buildings.shelter > 0 },
            { id: 'loom', name: 'Loom', costs: Config.costs.loom, max: 1, unlockCheck: () => GameState.buildings.shelter > 0 },
            { id: 'rootCellar', name: 'Root Cellar', costs: Config.costs.rootCellar, max: 1, unlockCheck: () => GameState.buildings.shelter > 0 },
            { id: 'mill', name: 'Mill', costs: Config.costs.mill, max: 1, unlockCheck: () => GameState.buildings.rootCellar > 0, desc: '+50% food production' },
            { id: 'forge', name: 'Forge', costs: Config.costs.forge, max: 1, unlockCheck: () => GameState.buildings.shelter > 0 },
            { id: 'mapRoom', name: 'Map Room', costs: Config.costs.mapRoom, max: 1, unlockCheck: () => GameState.buildings.forge > 0, desc: 'Unlocks upgrades' },
            { id: 'commonHall', name: 'Common Hall', costs: Config.costs.commonHall, max: 1, unlockCheck: () => GameState.buildings.shelter > 2, desc: '+10 happiness' },
            { id: 'smelter', name: 'Smelter', costs: Config.costs.smelter, max: 1, unlockCheck: () => GameState.buildings.forge > 0 },
            { id: 'arsenal', name: 'Arsenal', costs: Config.costs.arsenal, max: 1, unlockCheck: () => GameState.buildings.smelter > 0 }
        ];
        
        let hasUnlockedBuildings = false;
        
        buildings.forEach(building => {
            // Check if building should be shown
            const isUnlocked = !building.unlockCheck || building.unlockCheck();
            if (!isUnlocked) return;
            
            hasUnlockedBuildings = true;
            const canAfford = Utils.canAfford(building.costs);
            const count = GameState.buildings[building.id];
            const atMax = building.max && count >= building.max;
            
            const item = document.createElement('div');
            item.className = `building-item ${canAfford && !atMax ? '' : 'disabled'}`;
            item.innerHTML = `
                <div class="item-name">${building.name} ${count > 0 ? `(${count}${building.max ? '/' + building.max : ''})` : ''}</div>
                <div class="item-cost">${this.formatCosts(building.costs)}</div>
            `;
            
            if (canAfford && !atMax) {
                item.addEventListener('click', () => Buildings.build(building.id));
            }
            
            buildingsList.appendChild(item);
        });
        
        // Only show panel if there are unlocked buildings
        if (hasUnlockedBuildings) {
            this.elements.buildingsPanel.classList.remove('hidden');
        } else {
            this.elements.buildingsPanel.classList.add('hidden');
        }
    },
    
    // Format costs for display
    formatCosts(costs) {
        return Object.entries(costs)
            .map(([resource, amount]) => `${amount} ${resource}`)
            .join(', ');
    },
    
    // Add narrative entry
    addNarrative(text, type = 'normal') {
        const entry = document.createElement('p');
        entry.className = `narrative-entry ${type}`;
        entry.textContent = text;
        
        this.elements.narrativeLog.appendChild(entry);
        
        // Auto-scroll to the newest entry
        const panel = this.elements.narrativePanel;
        panel.scrollTop = panel.scrollHeight;

        // Keep only the last 120 entries
        while (this.elements.narrativeLog.children.length > 120) {
            this.elements.narrativeLog.removeChild(this.elements.narrativeLog.firstChild);
        }
    },
    
    // Show notification
    notify(message) {
        if (!GameState.settings.notifications) return;
        
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    },
    
    // Show combat panel
    showCombatPanel() {
        const panel = document.getElementById('combat-panel');
        if (panel) panel.classList.remove('hidden');
    },
    
    // Hide combat panel
    hideCombatPanel() {
        const panel = document.getElementById('combat-panel');
        if (panel) panel.classList.add('hidden');
    },
    
    // Update combat UI
    updateCombat() {
        if (!GameState.combat.active) return;
        
        const enemy = GameState.combat.enemy;
        const player = GameState.player;
        
        // Update enemy info
        const enemyName = document.getElementById('combat-enemy-name');
        const enemyHealth = document.getElementById('combat-enemy-health');
        const enemyHealthBar = document.getElementById('combat-enemy-health-bar');
        
        if (enemyName) enemyName.textContent = enemy.name;
        if (enemyHealth) enemyHealth.textContent = `${Math.max(0, enemy.health)}/${enemy.maxHealth}`;
        if (enemyHealthBar) {
            const healthPercent = (enemy.health / enemy.maxHealth) * 100;
            enemyHealthBar.style.width = `${healthPercent}%`;
        }
        
        // Update player info
        const playerHealth = document.getElementById('combat-player-health');
        const playerHealthBar = document.getElementById('combat-player-health-bar');
        
        if (playerHealth) playerHealth.textContent = `${Math.max(0, player.health)}/${player.maxHealth}`;
        if (playerHealthBar) {
            const healthPercent = (player.health / player.maxHealth) * 100;
            playerHealthBar.style.width = `${healthPercent}%`;
        }
        
        // Update turn indicator
        const turnIndicator = document.getElementById('combat-turn');
        if (turnIndicator) {
            turnIndicator.textContent = GameState.combat.turn === 'player' ? 'Your Turn' : 'Enemy Turn';
        }
        
        // Enable/disable buttons based on turn
        const attackBtn = document.getElementById('combat-attack-btn');
        const defendBtn = document.getElementById('combat-defend-btn');
        const fleeBtn = document.getElementById('combat-flee-btn');
        const itemBtn = document.getElementById('combat-item-btn');
        
        const isPlayerTurn = GameState.combat.turn === 'player';
        if (attackBtn) attackBtn.disabled = !isPlayerTurn;
        if (defendBtn) defendBtn.disabled = !isPlayerTurn;
        if (fleeBtn) fleeBtn.disabled = !isPlayerTurn;
        if (itemBtn) itemBtn.disabled = !isPlayerTurn || GameState.items.rations <= 0;
    },
    
    // Update combat log
    updateCombatLog() {
        const logContainer = document.getElementById('combat-log');
        if (!logContainer) return;
        
        logContainer.innerHTML = GameState.combat.log
            .map(msg => `<p class="combat-log-entry">${msg}</p>`)
            .join('');
        
        logContainer.scrollTop = logContainer.scrollHeight;
    },
    
    // Update village panel
    updateVillage() {
        const panel = document.getElementById('village-panel');
        if (!panel) return;
        panel.classList.toggle('hidden', !GameState.unlocks.village);

        // Update population display
        const popDisplay = document.getElementById('village-population');
        if (popDisplay) {
            popDisplay.textContent = `${GameState.population}/${GameState.maxPopulation || Village.getMaxPopulation()}`;
        }
        
        // Update happiness display
        const happyDisplay = document.getElementById('village-happiness');
        if (happyDisplay) {
            happyDisplay.textContent = Math.floor(GameState.village.happiness);
        }
        
        // Update defense display
        const defenseDisplay = document.getElementById('village-defense');
        if (defenseDisplay) {
            defenseDisplay.textContent = GameState.village.defense + (GameState.workers.guard * 5);
        }
        
        // Update village buildings list
        this.updateVillageBuildings();
    },
    
    // Update worker assignment list
    updateWorkerList() {
        const container = document.getElementById('worker-list');
        if (!container) return;
        
        container.innerHTML = '';
        
        const idleVillagers = Village.getIdleVillagers();
        
        // Show idle villagers
        const idleDiv = document.createElement('div');
        idleDiv.className = 'worker-item';
        idleDiv.innerHTML = `<span class="worker-name">Idle Villagers</span><span class="worker-count">${idleVillagers}</span>`;
        container.appendChild(idleDiv);
        
        // Show each worker type
        for (let type in Village.workerTypes) {
            const def = Village.workerTypes[type];
            const count = GameState.workers[type];
            
            if (count > 0 || Village.canAssignWorker(type)) {
                const div = document.createElement('div');
                div.className = 'worker-item';
                div.innerHTML = `
                    <span class="worker-name">${def.name}</span>
                    <span class="worker-count">${count}</span>
                    <div class="worker-controls">
                        <button class="worker-btn" onclick="Village.removeWorker('${type}')" ${count <= 0 ? 'disabled' : ''}>-</button>
                        <button class="worker-btn" onclick="Village.assignWorker('${type}')" ${!Village.canAssignWorker(type) ? 'disabled' : ''}>+</button>
                    </div>
                `;
                container.appendChild(div);
            }
        }
    },
    
    // Update village buildings list
    updateVillageBuildings() {
        const container = document.getElementById('village-buildings-list');
        if (!container) return;
        
        container.innerHTML = '';
        
        // Only show if village is unlocked
        if (!GameState.unlocks.village) {
            container.parentElement.classList.add('hidden');
            return;
        }
        
        container.parentElement.classList.remove('hidden');
        
        for (let buildingId in Village.villageBuildings) {
            const building = Village.villageBuildings[buildingId];
            const count = GameState.village.buildings[buildingId];
            const atMax = building.max && count >= building.max;
            const canAfford = Utils.canAfford(building.cost);
            
            // Always shown (greyed out when unaffordable) so players can plan ahead
            {
                const div = document.createElement('div');
                div.className = `building-item ${canAfford && !atMax ? '' : 'disabled'}`;
                div.innerHTML = `
                    <div class="item-name">${building.name} ${count > 0 ? `(${count}/${building.max || '∞'})` : ''}</div>
                    <div class="item-cost">${Object.entries(building.cost).map(([r, a]) => `${a} ${r}`).join(', ')}</div>
                `;
                
                if (canAfford && !atMax) {
                    div.addEventListener('click', () => Village.buildVillageBuilding(buildingId));
                }
                
                container.appendChild(div);
            }
        }
    },
    
    // Update population panel (shows once a shelter is built)
    updatePopulation() {
        const panel = this.elements.populationPanel;
        if (!panel) return;
        
        // Show panel once a shelter exists
        if (GameState.buildings.shelter > 0) {
            panel.classList.remove('hidden');
            
            const maxPop = Village.getMaxPopulation();
            const idle = Village.getIdleVillagers();
            
            if (this.elements.populationCount) {
                this.elements.populationCount.textContent = `${GameState.population}/${maxPop}`;
            }
            if (this.elements.idleCount) {
                this.elements.idleCount.textContent = idle;
            }
        } else {
            panel.classList.add('hidden');
        }
    },
    
    // Toggle worker assignment submenu
    toggleWorkerAssignment() {
        const panel = this.elements.workerAssignmentPanel;
        if (!panel) return;
        
        panel.classList.toggle('hidden');
        
        if (!panel.classList.contains('hidden')) {
            this.updateWorkerAssignmentList();
        }
    },
    
    // Update worker assignment list
    updateWorkerAssignmentList() {
        const container = this.elements.workerAssignmentList;
        if (!container) return;
        
        container.innerHTML = '';
        
        const idleVillagers = Village.getIdleVillagers();
        
        // Update available workers count
        if (this.elements.availableWorkers) {
            this.elements.availableWorkers.textContent = idleVillagers;
        }
        
        // Create list of worker types
        for (let type in Village.workerTypes) {
            const def = Village.workerTypes[type];
            const count = GameState.workers[type];
            const canAssign = Village.canAssignWorker(type);
            const canRemove = count > 0;
            
            // Check if requirements are met
            let requirementsMet = true;
            let requirementText = '';
            
            for (let req in def.requires) {
                if (req === 'shelter' && GameState.buildings.shelter <= 0) {
                    requirementsMet = false;
                    requirementText = 'Requires Shelter';
                }
                if (req === 'huntingCamp' && GameState.buildings.huntingCamp <= 0) {
                    requirementsMet = false;
                    requirementText = 'Requires Hunting Camp';
                }
                if (req === 'forge' && GameState.buildings.forge <= 0) {
                    requirementsMet = false;
                    requirementText = 'Requires Forge';
                }
                if (req === 'loom' && GameState.buildings.loom <= 0) {
                    requirementsMet = false;
                    requirementText = 'Requires Loom';
                }
                if (req === 'rootCellar' && GameState.buildings.rootCellar <= 0) {
                    requirementsMet = false;
                    requirementText = 'Requires Root Cellar';
                }
                if (req === 'smelter' && GameState.buildings.smelter <= 0) {
                    requirementsMet = false;
                    requirementText = 'Requires Smelter';
                }
                if (req === 'arsenal' && GameState.buildings.arsenal <= 0) {
                    requirementsMet = false;
                    requirementText = 'Requires Arsenal';
                }
                if (req === 'barracks' && GameState.village.buildings.barracks <= 0) {
                    requirementsMet = false;
                    requirementText = 'Requires Barracks';
                }
                if (req === 'temple' && GameState.village.buildings.temple <= 0) {
                    requirementsMet = false;
                    requirementText = 'Requires Temple';
                }
                if (req === 'market' && GameState.village.buildings.market <= 0) {
                    requirementsMet = false;
                    requirementText = 'Requires Market';
                }
                if (typeof def.requires[req] === 'number') {
                    if (GameState.buildings[req] < def.requires[req]) {
                        requirementsMet = false;
                        requirementText = `Requires ${def.requires[req]} ${req}(s)`;
                    }
                }
            }
            
            const div = document.createElement('div');
            div.className = `worker-assignment-item ${requirementsMet ? '' : 'locked'}`;
            
            // Build production info
            let productionInfo = '';
            if (def.production && Object.keys(def.production).length > 0) {
                productionInfo = Object.entries(def.production)
                    .map(([r, a]) => `+${a}/tick ${r}`)
                    .join(', ');
            }
            if (def.defense) {
                productionInfo += ` Defense +${def.defense}`;
            }
            if (def.happinessBonus) {
                productionInfo += ` Happiness +${def.happinessBonus}`;
            }
            
            div.innerHTML = `
                <div class="worker-info">
                    <span class="worker-name">${def.name}</span>
                    <span class="worker-desc">${def.description}</span>
                    <span class="worker-production">${productionInfo}</span>
                    ${!requirementsMet ? `<span class="worker-req">${requirementText}</span>` : ''}
                </div>
                <div class="worker-controls">
                    <span class="worker-count">${count}</span>
                    <button class="worker-btn remove-btn" data-type="${type}" ${!canRemove ? 'disabled' : ''}>-</button>
                    <button class="worker-btn add-btn" data-type="${type}" ${!canAssign || idleVillagers <= 0 ? 'disabled' : ''}>+</button>
                </div>
            `;
            
            // Bind button events
            const removeBtn = div.querySelector('.remove-btn');
            const addBtn = div.querySelector('.add-btn');
            
            removeBtn.addEventListener('click', () => {
                Village.removeWorker(type);
                this.updateWorkerAssignmentList();
                this.updatePopulation();
            });
            
            addBtn.addEventListener('click', () => {
                Village.assignWorker(type);
                this.updateWorkerAssignmentList();
                this.updatePopulation();
            });
            
            container.appendChild(div);
        }
    }
};

// ============================================
// HEARTH SYSTEM
// ============================================
// The hearth has a heat value (0-100). Heat drains every tick (faster in bad
// weather); feeding it a log adds heat. Its state is derived from the heat.
const Hearth = {
    states: [
        // from the hottest down; first match wins
        { id: 'blazing', minHeat: 80, label: 'The hearth is blazing.', glow: 'hot', icon: 1 },
        { id: 'steady', minHeat: 50, label: 'The hearth burns steadily.', glow: 'hot', icon: 1 },
        { id: 'low', minHeat: 20, label: 'The hearth is burning low.', glow: 'warm', icon: 0.7 },
        { id: 'embers', minHeat: 0.01, label: 'Only embers are left.', glow: '', icon: 0.4 },
        { id: 'cold', minHeat: -Infinity, label: 'The hearth is cold.', glow: '', icon: 0.2 }
    ],
    busy: false,
    feedDelay: 3000, // ms between feeding the hearth

    init() {
        this.update();
    },

    isLit() {
        return GameState.hearthState !== 'cold';
    },

    // Kindle a cold hearth, or feed a lit one with a log
    tend() {
        if (this.busy) return;

        if (!this.isLit()) {
            // The very first kindling is free (you start with no wood).
            // Rekindling later costs wood, so letting the hearth die never beats feeding it.
            if (!GameState.unlocks.forest) {
                GameState.hearthHeat = 50;
            } else {
                if (GameState.resources.wood < Config.hearthRekindleCost) {
                    UI.notify(`You need ${Config.hearthRekindleCost} wood to rekindle the hearth.`);
                    return;
                }
                GameState.resources.wood -= Config.hearthRekindleCost;
                GameState.hearthHeat = Config.hearthRekindleHeat;
            }
            UI.addNarrative(Utils.randomChoice(Narratives.hearthLit), 'success');
            this.onFirstKindle();
        } else {
            if (GameState.resources.wood < 1) return;
            GameState.resources.wood -= 1;
            GameState.hearthHeat = Math.min(GameState.hearthHeat + Config.hearthLogHeat, Config.maxHearthHeat);
            UI.addNarrative('You lay another log on the hearth.');
        }

        this.refreshState();

        this.busy = true;
        const btn = UI.elements.tendHearthBtn;
        btn.classList.add('cooldown');
        btn.style.setProperty('--cooldown-time', `${this.feedDelay}ms`);
        setTimeout(() => {
            this.busy = false;
            btn.classList.remove('cooldown');
        }, this.feedDelay);

        UI.updateAll();
    },

    stateFor(heat) {
        return this.states.find(s => heat >= s.minHeat);
    },

    refreshState() {
        const before = GameState.hearthState;
        GameState.hearthState = this.stateFor(GameState.hearthHeat).id;
        const after = GameState.hearthState;
        if (before === after) return;

        if (after === 'blazing') UI.addNarrative(Utils.randomChoice(Narratives.hearthBlazing));
        if (after === 'embers' && before === 'low') UI.addNarrative(Utils.randomChoice(Narratives.hearthLow), 'warning');
        if (after === 'cold') UI.addNarrative(Utils.randomChoice(Narratives.hearthCold), 'warning');
    },

    // Tick update: heat drains, faster in bad weather
    update() {
        if (this.isLit()) {
            GameState.hearthHeat = Math.max(0, GameState.hearthHeat - Config.hearthDrainRate * Weather.getEffect('hearthDrainMod'));
            this.refreshState();
        }
        UI.updateHearth();
    },

    onFirstKindle() {
        if (!GameState.unlocks.forest) {
            GameState.unlocks.forest = true;
            setTimeout(() => {
                UI.addNarrative(Utils.randomChoice(Narratives.forestDiscovered));
                UI.notify('You can now chop wood!');
                UI.updateActions();
            }, 3000);
        }
        GameState.unlocks.crafting = true;
        GameState.unlocks.buildings = true;
    }
};

// ============================================
// ACTIONS SYSTEM
// ============================================
const Actions = {
    cooldowns: {},
    
    // Gather wood
    chopWood() {
        if (this.cooldowns.chopWood) return;
        
        const baseAmount = Utils.random(3, 7);
        const cartMultiplier = GameState.buildings.sledge > 0 ? Config.production.sledge.multiplier : 1;
        const weatherMultiplier = Weather.getEffect('gatherMod');
        const amount = Math.floor(baseAmount * cartMultiplier * weatherMultiplier);
        
        GameState.resources.wood += amount;
        
        // Random events while gathering
        if (Math.random() < 0.08) {
            const events = [
                "You find some cloth tangled in the brush.",
                "A startled hare bolts, leaving a scrap of hide snagged on a thorn.",
                "You discover an old iron nail among the fallen branches."
            ];
            UI.addNarrative(Utils.randomChoice(events));
            
            if (Math.random() < 0.25) {
                GameState.resources.cloth += 1;
                Utils.revealResource('cloth');
            }
            if (Math.random() < 0.15) {
                GameState.resources.hide += 1;
                Utils.revealResource('hide');
            }
        }
        
        UI.addNarrative(`You chop ${amount} wood.`);
        
        // Set cooldown
        this.cooldowns.chopWood = true;
        const btn = document.getElementById('chop-wood-btn');
        if (btn) {
            btn.classList.add('cooldown');
            btn.style.setProperty('--cooldown-time', `${Config.chopWoodCooldown}ms`);
        }
        
        setTimeout(() => {
            this.cooldowns.chopWood = false;
            if (btn) btn.classList.remove('cooldown');
        }, Config.chopWoodCooldown);
        
        UI.updateAll();
    },
    
    // Check snares
    checkSnares() {
        if (this.cooldowns.checkSnares) return;
        
        const snareCount = GameState.buildings.snare;
        const snareMod = Weather.getEffect('snareMod');
        let foodGained = 0;
        let hideGained = 0;
        
        for (let i = 0; i < snareCount; i++) {
            if (Math.random() < 0.4 * snareMod) {
                foodGained += Utils.random(1, 3);
                if (Math.random() < 0.3) {
                    hideGained += Utils.random(1, 2);
                }
            }
        }
        
        if (foodGained > 0 || hideGained > 0) {
            GameState.resources.food += foodGained;
            GameState.resources.hide += hideGained;
            Utils.revealResource('hide');
            
            let message = 'You check the snares: ';
            const gains = [];
            if (foodGained > 0) gains.push(`${foodGained} food`);
            if (hideGained > 0) gains.push(`${hideGained} hide`);
            message += gains.join(', ') + '.';
            
            UI.addNarrative(message);
        } else {
            UI.addNarrative('The snares are empty.');
        }
        
        // Set cooldown
        this.cooldowns.checkSnares = true;
        const btn = document.getElementById('check-snares-btn');
        if (btn) {
            btn.classList.add('cooldown');
            btn.style.setProperty('--cooldown-time', `${Config.snareCheckInterval}ms`);
        }
        
        setTimeout(() => {
            this.cooldowns.checkSnares = false;
            if (btn) btn.classList.remove('cooldown');
        }, Config.snareCheckInterval);
        
        UI.updateAll();
    },
    
    // Hunt
    hunt() {
        if (this.cooldowns.hunt) return;
        
        const huntMod = Weather.getEffect('huntMod');
        
        // Chance to encounter enemy while hunting (modified by weather)
        if (Math.random() < 0.25 * huntMod) {
            const enemyId = Combat.getRandomEnemy(2);
            UI.addNarrative('You encounter a dangerous creature while hunting!');
            Combat.start(enemyId);
            return;
        }
        
        const hasBlade = GameState.items.ironSpear > 0 || GameState.items.steelSabre > 0;
        const baseSuccessChance = hasBlade ? 0.7 : 0.5;
        const successChance = baseSuccessChance * huntMod;
        
        if (Math.random() < successChance) {
            const foodAmount = Utils.random(5, 15);
            const hideAmount = Utils.random(2, 8);
            
            GameState.resources.food += foodAmount;
            GameState.resources.hide += hideAmount;
            Utils.revealResource('hide');
            
            UI.addNarrative(`The hunt was successful! You return with ${foodAmount} food and ${hideAmount} hide.`);
        } else {
            UI.addNarrative('The hunt was unsuccessful. The prey escaped into the forest.');
        }
        
        
        // Set cooldown
        this.cooldowns.hunt = true;
        const btn = document.getElementById('hunt-btn');
        if (btn) {
            btn.classList.add('cooldown');
            btn.style.setProperty('--cooldown-time', '5000ms');
        }
        
        setTimeout(() => {
            this.cooldowns.hunt = false;
            if (btn) btn.classList.remove('cooldown');
        }, 5000);
        
        UI.updateAll();
    },
    
    // Explore the woods - brings back random items
    explore() {
        if (this.cooldowns.explore) return;
        
        const exploreMod = Weather.getEffect('gatherMod');
        
        // Chance to encounter enemy while exploring
        if (Math.random() < 0.2 * exploreMod) {
            const enemyId = Combat.getRandomEnemy(2);
            UI.addNarrative('You encounter something dangerous in the woods!');
            Combat.start(enemyId);
            return;
        }
        
        // Random items that can be found
        const possibleFinds = [
            { resource: 'wood', min: 2, max: 8, weight: 30 },
            { resource: 'food', min: 1, max: 5, weight: 25 },
            { resource: 'hide', min: 1, max: 3, weight: 18 },
            { resource: 'cloth', min: 1, max: 2, weight: 10 },
            { resource: 'iron', min: 1, max: 2, weight: 8 },
            { resource: 'coal', min: 1, max: 2, weight: 5 },
            { resource: 'steel', min: 1, max: 1, weight: 2 }
        ];
        
        // Weighted random selection
        const totalWeight = possibleFinds.reduce((sum, item) => sum + item.weight, 0);
        let random = Math.random() * totalWeight;
        let selectedFind = possibleFinds[0];
        
        for (let item of possibleFinds) {
            random -= item.weight;
            if (random <= 0) {
                selectedFind = item;
                break;
            }
        }
        
        // Calculate amount
        let amount = Utils.random(selectedFind.min, selectedFind.max);
        amount = Math.floor(amount * exploreMod);
        
        // Apply the find
        GameState.resources[selectedFind.resource] += amount;
        Utils.revealResource(selectedFind.resource);
        
        // Random narrative for the exploration
        const narratives = [
            `You explore the woods and find ${amount} ${selectedFind.resource}!`,
            `While wandering through the forest, you discover ${amount} ${selectedFind.resource}.`,
            `Your exploration yields ${amount} ${selectedFind.resource}.`,
            `Hidden in the underbrush, you find ${amount} ${selectedFind.resource}.`,
            `After searching the woods, you return with ${amount} ${selectedFind.resource}.`
        ];
        
        UI.addNarrative(Utils.randomChoice(narratives));
        
        // Small chance to find something extra
        if (Math.random() < 0.15) {
            const bonusResource = Utils.randomChoice(['wood', 'food', 'hide']);
            const bonusAmount = Utils.random(1, 3);
            GameState.resources[bonusResource] += bonusAmount;
            Utils.revealResource(bonusResource);
            UI.addNarrative(`You also found ${bonusAmount} ${bonusResource}!`);
        }
        
        // Set cooldown (10 seconds)
        this.cooldowns.explore = true;
        const btn = document.getElementById('explore-btn');
        if (btn) {
            btn.classList.add('cooldown');
            btn.style.setProperty('--cooldown-time', '10000ms');
        }
        
        setTimeout(() => {
            this.cooldowns.explore = false;
            if (btn) btn.classList.remove('cooldown');
        }, 10000);
        
        UI.updateAll();
    },
    
    // Smelt steel at the Smelter: iron + coal -> 1 steel
    smeltSteel() {
        if (this.cooldowns.smeltSteel) return;
        if (GameState.buildings.smelter <= 0) return;

        if (!Utils.canAfford(Config.smeltCost)) {
            UI.notify(`Smelting needs ${Config.smeltCost.iron} iron and ${Config.smeltCost.coal} coal.`);
            return;
        }

        Utils.deductResources(Config.smeltCost);
        GameState.resources.steel += 1;
        Utils.revealResource('steel');
        UI.addNarrative('The furnace roars. A bar of steel cools on the anvil.', 'success');

        this.cooldowns.smeltSteel = true;
        const btn = document.getElementById('smelt-steel-btn');
        if (btn) {
            btn.classList.add('cooldown');
            btn.style.setProperty('--cooldown-time', `${Config.smeltCooldown}ms`);
        }
        setTimeout(() => {
            this.cooldowns.smeltSteel = false;
            document.getElementById('smelt-steel-btn')?.classList.remove('cooldown');
        }, Config.smeltCooldown);

        UI.updateAll();
    },

    // Search for iron specifically (slower, more balanced)
    searchIron() {
        if (this.cooldowns.searchIron) return;
        
        const exploreMod = Weather.getEffect('gatherMod');
        
        // Chance to encounter enemy while searching
        if (Math.random() < 0.1) {
            const enemyId = Combat.getRandomEnemy(1);
            UI.addNarrative('While searching for iron, you encounter a hostile creature!');
            Combat.start(enemyId);
            return;
        }
        
        // Base chance to find iron (30% base, modified by weather)
        const findChance = 0.3 * exploreMod;
        
        if (Math.random() < findChance) {
            const ironAmount = Utils.random(1, 3);
            GameState.resources.iron += ironAmount;
            Utils.revealResource('iron');
            
            const narratives = [
                `You search the rocky outcrops and find ${ironAmount} iron ore!`,
                `After digging through some rubble, you uncover ${ironAmount} iron!`,
                `Your search pays off! You found ${ironAmount} iron ore.`,
                `In a small crevice, you discover ${ironAmount} iron ore!`
            ];
            UI.addNarrative(Utils.randomChoice(narratives), 'success');
            
            // Small chance to also find coal
            if (Math.random() < 0.15) {
                const coalAmount = Utils.random(1, 2);
                GameState.resources.coal += coalAmount;
                Utils.revealResource('coal');
                UI.addNarrative(`You also found ${coalAmount} coal nearby!`, 'success');
            }
        } else {
            const failNarratives = [
                "You search but find no iron in this area.",
                "The rocks here yield nothing useful.",
                "Your search comes up empty. Try another spot.",
                "You spend time digging but find nothing of value."
            ];
            UI.addNarrative(Utils.randomChoice(failNarratives));
            
            // Consolation prize - small chance to find something else
            if (Math.random() < 0.2) {
                const bonusResource = Utils.randomChoice(['wood', 'food']);
                const bonusAmount = Utils.random(1, 2);
                GameState.resources[bonusResource] += bonusAmount;
                Utils.revealResource(bonusResource);
                UI.addNarrative(`At least you found ${bonusAmount} ${bonusResource} while searching.`);
            }
        }
        
        // Set cooldown (15 seconds - longer to prevent spam)
        this.cooldowns.searchIron = true;
        const btn = document.getElementById('search-iron-btn');
        if (btn) {
            btn.classList.add('cooldown');
            btn.style.setProperty('--cooldown-time', '15000ms');
        }
        
        setTimeout(() => {
            this.cooldowns.searchIron = false;
            if (btn) btn.classList.remove('cooldown');
        }, 15000);
        
        UI.updateAll();
    }
};

// ============================================
// CRAFTING SYSTEM
// ============================================
const Crafting = {
    craft(itemId) {
        const recipes = {
            lantern: Config.costs.lantern,
            canteen: Config.costs.canteen,
            rations: Config.costs.rations,
            hideCoat: Config.costs.hideCoat,
            ironSpear: Config.costs.ironSpear,
            steelSabre: Config.costs.steelSabre
        };
        
        const costs = recipes[itemId];
        if (!costs || !Utils.canAfford(costs)) return;
        
        Utils.deductResources(costs);
        GameState.items[itemId] = (GameState.items[itemId] || 0) + 1;
        
        UI.addNarrative(this.messages[itemId] || 'You finish crafting.');
        if (itemId === 'lantern') Story.check(); // a lantern opens up the valley map
        UI.updateAll();
    },

    messages: {
        lantern: 'You fit a wick into a tin lantern. Now you can see where you are going.',
        canteen: 'You stitch a canteen from hide. It will keep water from freezing, for a while.',
        rations: 'You pack a bundle of trail rations.',
        hideCoat: 'You sew a heavy hide coat. The wind barely gets through.',
        ironSpear: 'You hammer out an iron spearhead and bind it to an ash shaft.',
        steelSabre: 'You draw a steel sabre from the quench. It rings when you test the edge.'
    }
};

// ============================================
// BUILDINGS SYSTEM
// ============================================
const Buildings = {
    build(buildingId) {
        const costs = Config.costs[buildingId];
        if (!costs || !Utils.canAfford(costs)) return;
        
        Utils.deductResources(costs);
        GameState.buildings[buildingId] = (GameState.buildings[buildingId] || 0) + 1;
        
        UI.addNarrative(`You built a ${buildingId.replace(/([A-Z])/g, ' $1').toLowerCase()}.`);
        
        // Handle building effects
        this.handleEffects(buildingId);
        
        // Update actions in case new actions are unlocked
        UI.updateActions();
        UI.updateAll();
    },
    
    handleEffects(buildingId) {
        switch (buildingId) {
            case 'shelter':
                // Show population panel when first shelter is built
                document.getElementById('population-panel')?.classList.remove('hidden');
                // Raise the population cap BEFORE anyone arrives, otherwise the
                // new shelter's space isn't counted yet and nobody can move in.
                Village.updatePopulation();
                // A new shelter immediately brings a villager
                Village.villagerArrives();
                // Additional villagers arrive over time (simulated)
                setTimeout(() => {
                    if (GameState.population < GameState.maxPopulation) {
                        Village.villagerArrives();
                    }
                }, 5000);
                UI.updatePopulation();
                break;
            case 'forge':
                GameState.unlocks.iron = true;
                Utils.revealResource('iron');
                UI.addNarrative('The forge is ready. Prospectors can now be assigned.');
                break;
            case 'smelter':
                GameState.unlocks.steel = true;
                Utils.revealResource('steel');
                Utils.revealResource('coal');
                UI.addNarrative('The smelter roars to life. Smelt iron and coal into steel, or assign Smelter Hands.');
                break;
            case 'huntingCamp':
                UI.addNarrative('The hunting camp is set up. Hunters can now be assigned.');
                break;
            case 'loom':
                UI.addNarrative('The loom is strung. Weavers can now turn hides into cloth.');
                break;
            case 'rootCellar':
                UI.addNarrative('The root cellar is dug. Farmers can now store a harvest.');
                break;
            case 'arsenal':
                UI.addNarrative('The arsenal is complete. Steel sabres can now be forged.');
                break;
        }
    }
};

// ============================================
// WORLD MAP SYSTEM
// ============================================
const WorldMap = {
    size: 40,      // 40x40 grid
    tileSize: 10,
    home: { x: 20, y: 20 },
    revealRadius: 1,

    // Tile types
    tiles: {
        0: { name: 'unexplored', color: '#111' },
        1: { name: 'forest', color: '#1a4d1a' },
        2: { name: 'village', color: '#8b7355' },
        3: { name: 'cabin', color: '#c8843a' },
        4: { name: 'glass cave', color: '#3a3346' },
        5: { name: 'iron', color: '#708090' },
        6: { name: 'coal', color: '#2a2a2a' },
        7: { name: 'ruins', color: '#7a6a55' },
        8: { name: 'frozen lake', color: '#1a3d5c', blocked: true },
        9: { name: 'the nest', color: '#cfe8ff' }
    },

    worldData: [],
    lairPos: null,
    ruinsPos: [],

    init() {
        if (typeof GameState.worldSeed !== 'number') {
            GameState.worldSeed = Math.floor(Math.random() * 2 ** 31);
        }
        this.generateWorld(GameState.worldSeed);

        // The cabin and its surroundings are always known
        this.reveal(this.home.x, this.home.y);
        this.reveal(GameState.player.mapPosition.x, GameState.player.mapPosition.y);

        // Movement: on-screen buttons and keyboard (only while the map is open)
        document.querySelectorAll('[data-move]').forEach(btn => {
            btn.addEventListener('click', () => {
                const [dx, dy] = btn.dataset.move.split(',').map(Number);
                this.move(dx, dy);
            });
        });
        document.getElementById('map-home-btn')?.addEventListener('click', () => this.returnHome());

        document.addEventListener('keydown', (e) => {
            if (!this.isOpen()) return;
            const dirs = {
                ArrowUp: [0, -1], w: [0, -1], W: [0, -1],
                ArrowDown: [0, 1], s: [0, 1], S: [0, 1],
                ArrowLeft: [-1, 0], a: [-1, 0], A: [-1, 0],
                ArrowRight: [1, 0], d: [1, 0], D: [1, 0]
            };
            const dir = dirs[e.key];
            if (dir) {
                e.preventDefault();
                this.move(dir[0], dir[1]);
            }
        });
    },

    // Small seeded random generator (mulberry32) so the same seed builds the same valley
    seededRandom(seed) {
        let a = seed >>> 0;
        return () => {
            a = (a + 0x6D2B79F5) >>> 0;
            let t = a;
            t = Math.imul(t ^ (t >>> 15), t | 1);
            t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    },

    generateWorld(seed) {
        const rand = this.seededRandom(seed);
        const randInt = (min, max) => Math.floor(rand() * (max - min + 1)) + min;
        const nearHome = (x, y) => Math.abs(x - this.home.x) <= 2 && Math.abs(y - this.home.y) <= 2;

        this.worldData = [];
        for (let y = 0; y < this.size; y++) {
            this.worldData[y] = [];
            for (let x = 0; x < this.size; x++) {
                let tileType = 1; // forest
                const roll = rand();
                if (!nearHome(x, y)) {
                    if (roll < 0.025) tileType = 8;       // frozen lake
                    else if (roll < 0.045) tileType = 5;  // iron
                    else if (roll < 0.06) tileType = 6;   // coal
                }
                this.worldData[y][x] = tileType;
            }
        }

        // Cabin
        this.worldData[this.home.y][this.home.x] = 3;

        // Ruins: four, in the north of the valley
        this.ruinsPos = [];
        while (this.ruinsPos.length < 4) {
            const x = randInt(4, 35), y = randInt(2, 12);
            if (this.worldData[y][x] === 7) continue;
            this.worldData[y][x] = 7;
            this.ruinsPos.push({ x, y });
        }

        // Glass caves: in the east
        for (let i = 0; i < 6; i++) {
            this.worldData[randInt(5, 35)][randInt(26, 37)] = 4;
        }

        // The nest: far east
        const lx = randInt(35, 38), ly = randInt(14, 26);
        this.worldData[ly][lx] = 9;
        this.lairPos = { x: lx, y: ly };
    },

    isOpen() {
        const map = document.getElementById('world-map');
        return map && !map.classList.contains('hidden');
    },

    toggle() {
        if (GameState.combat.active) return;
        const map = document.getElementById('world-map');
        map.classList.toggle('hidden');

        if (!map.classList.contains('hidden')) {
            this.render();
        }
    },

    close() {
        document.getElementById('world-map')?.classList.add('hidden');
    },

    unlock() {
        if (GameState.unlocks.map) return;
        GameState.unlocks.map = true;
        UI.elements.mapBtn.classList.remove('hidden');
        UI.notify('You can now explore the valley!');
    },

    reveal(cx, cy) {
        for (let dy = -this.revealRadius; dy <= this.revealRadius; dy++) {
            for (let dx = -this.revealRadius; dx <= this.revealRadius; dx++) {
                const x = cx + dx, y = cy + dy;
                if (x >= 0 && y >= 0 && x < this.size && y < this.size) {
                    GameState.player.exploredTiles.add(`${x},${y}`);
                }
            }
        }
    },

    render() {
        const canvas = document.getElementById('map-canvas');
        const ctx = canvas.getContext('2d');
        const ts = this.tileSize;

        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        for (let y = 0; y < this.size; y++) {
            for (let x = 0; x < this.size; x++) {
                const tile = this.tiles[this.worldData[y][x]];
                ctx.fillStyle = GameState.player.exploredTiles.has(`${x},${y}`) ? tile.color : '#111';
                ctx.fillRect(x * ts, y * ts, ts - 1, ts - 1);
            }
        }

        // Places marked on the old map above the hearth (outlined until visited)
        if (GameState.story.seen.includes('map_unlocked')) {
            ctx.lineWidth = 1;
            ctx.strokeStyle = 'rgba(200, 132, 58, 0.8)';
            this.ruinsPos.forEach(p => ctx.strokeRect(p.x * ts + 0.5, p.y * ts + 0.5, ts - 2, ts - 2));
            ctx.strokeStyle = 'rgba(207, 232, 255, 0.9)';
            ctx.strokeRect(this.lairPos.x * ts + 0.5, this.lairPos.y * ts + 0.5, ts - 2, ts - 2);
        }

        // Player
        const px = GameState.player.mapPosition.x;
        const py = GameState.player.mapPosition.y;
        ctx.fillStyle = '#ff6b35';
        ctx.beginPath();
        ctx.arc(px * ts + ts / 2, py * ts + ts / 2, 4, 0, Math.PI * 2);
        ctx.fill();

        const tileName = this.tiles[this.worldData[py][px]].name;
        document.getElementById('map-coordinates').textContent =
            `Position: (${px - this.home.x}, ${this.home.y - py}) · ${tileName}`;
    },

    move(dx, dy) {
        if (GameState.combat.active || !this.isOpen()) return;

        const newX = Utils.clamp(GameState.player.mapPosition.x + dx, 0, this.size - 1);
        const newY = Utils.clamp(GameState.player.mapPosition.y + dy, 0, this.size - 1);
        const tileType = this.worldData[newY][newX];

        if (this.tiles[tileType].blocked) {
            UI.addNarrative('The ice groans under your weight. You turn back.');
            this.reveal(newX, newY);
            this.render();
            return;
        }
        if (newX === GameState.player.mapPosition.x && newY === GameState.player.mapPosition.y) return;

        GameState.player.mapPosition.x = newX;
        GameState.player.mapPosition.y = newY;
        this.reveal(newX, newY);

        this.handleTileEvent(tileType, newX, newY);
        this.render();
    },

    returnHome() {
        if (GameState.combat.active) return;
        GameState.player.mapPosition = { ...this.home };
        UI.addNarrative('You follow your own tracks back to the cabin.');
        this.render();
    },

    // Danger grows with distance from the cabin; caves are worse
    dangerLevel(x, y, tileType) {
        const dist = Math.max(Math.abs(x - this.home.x), Math.abs(y - this.home.y));
        let level = dist < 6 ? 1 : dist < 12 ? 2 : 3;
        if (tileType === 4) level++;
        return Math.min(level, 4);
    },

    handleTileEvent(tileType, x, y) {
        const key = `${x},${y}`;

        // Special places first (no random ambush on top of them)
        if (tileType === 9) {
            Story.enterNest();
            return;
        }
        if (tileType === 7) {
            Story.searchRuins(key);
            return;
        }
        if (tileType === 3) {
            UI.addNarrative('Home. The hearth smoke rises straight up in the still air.');
            return;
        }

        // Random ambush, more likely far from home
        const danger = this.dangerLevel(x, y, tileType);
        if (Math.random() < 0.04 + danger * 0.02) {
            UI.addNarrative('Something moves between the trees!', 'warning');
            Combat.start(Combat.getRandomEnemy(danger));
            return;
        }

        switch (tileType) {
            case 5: // Iron
                if (Math.random() < 0.3) {
                    const iron = Utils.random(1, 5);
                    GameState.resources.iron += iron;
                    Utils.revealResource('iron');
                    UI.addNarrative(`You chip ${iron} iron ore out of a frozen outcrop.`);
                }
                break;
            case 6: // Coal
                if (Math.random() < 0.3) {
                    const coal = Utils.random(1, 5);
                    GameState.resources.coal += coal;
                    Utils.revealResource('coal');
                    UI.addNarrative(`A seam of coal shows black through the snow. You take ${coal}.`);
                }
                break;
            case 4: // Glass cave
                UI.addNarrative('The cave walls are black glass. Your lantern light shivers across them.');
                if (Math.random() < 0.4) {
                    UI.addNarrative('Something unfolds itself from the dark!', 'warning');
                    Combat.start(Combat.getRandomEnemy(danger));
                }
                break;
        }
        UI.updateResources();
    }
};

// ============================================
// TIME SYSTEM
// ============================================
const Time = {
    ticksPerPhase: 600, // 600 ticks = 60 seconds per phase (dawn, day, dusk, night)

    update() {
        // Derived from the saved game clock so the time of day survives a reload
        const cyclePosition = Math.floor((GameState.time + 1) / this.ticksPerPhase) % 4;
        const cycles = ['dawn', 'day', 'dusk', 'night'];
        const previousCycle = GameState.dayNightCycle;
        GameState.dayNightCycle = cycles[cyclePosition];
        
        // Increment day counter when a new day starts (dawn)
        if (previousCycle === 'night' && GameState.dayNightCycle === 'dawn') {
            GameState.day++;
            UI.addNarrative(`Day ${GameState.day} begins.`, 'success');
        }
        
        UI.updateTime();
    }
};

// ============================================
// WEATHER SYSTEM
// ============================================
const Weather = {
    // Weather types with their properties
    types: {
        clear: {
            name: 'Clear',
            icon: '☀️',
            description: 'A clear day, perfect for gathering resources.',
            effects: {
                hearthDrainMod: 1.0,
                gatherMod: 1.0,
                happinessMod: 0,
                huntMod: 1.0,
                snareMod: 1.0
            }
        },
        cloudy: {
            name: 'Cloudy',
            icon: '☁️',
            description: 'Grey clouds fill the sky.',
            effects: {
                hearthDrainMod: 1.0,
                gatherMod: 1.0,
                happinessMod: -2,
                huntMod: 1.0,
                snareMod: 1.0
            }
        },
        rain: {
            name: 'Rain',
            icon: '🌧️',
            description: 'Rain falls steadily, making the hearth harder to keep lit.',
            effects: {
                hearthDrainMod: 1.5,
                gatherMod: 0.8,
                happinessMod: -5,
                huntMod: 0.7,
                snareMod: 1.2 // Animals more active in rain
            }
        },
        storm: {
            name: 'Storm',
            icon: '⛈️',
            description: 'A fierce storm rages outside! The hearth struggles to stay lit.',
            effects: {
                hearthDrainMod: 2.0,
                gatherMod: 0.5,
                happinessMod: -10,
                huntMod: 0.3,
                snareMod: 0.5
            }
        },
        snow: {
            name: 'Snow',
            icon: '❄️',
            description: 'Snow falls gently, blanketing the world in white.',
            effects: {
                hearthDrainMod: 1.3,
                gatherMod: 0.7,
                happinessMod: -3,
                huntMod: 0.6,
                snareMod: 0.8
            }
        },
        fog: {
            name: 'Fog',
            icon: '🌫️',
            description: 'A thick fog obscures vision.',
            effects: {
                hearthDrainMod: 1.0,
                gatherMod: 0.9,
                happinessMod: -3,
                huntMod: 0.5,
                snareMod: 1.0
            }
        },
        wind: {
            name: 'Windy',
            icon: '💨',
            description: 'Strong winds howl outside.',
            effects: {
                hearthDrainMod: 1.4,
                gatherMod: 0.9,
                happinessMod: -4,
                huntMod: 0.8,
                snareMod: 0.9
            }
        }
    },
    
    // Weather transition chances
    transitionChances: {
        clear: { cloudy: 0.3, rain: 0.1, storm: 0.02, snow: 0.05, fog: 0.1, wind: 0.15 },
        cloudy: { clear: 0.2, rain: 0.25, storm: 0.05, snow: 0.1, fog: 0.15, wind: 0.1 },
        rain: { clear: 0.1, cloudy: 0.3, storm: 0.15, snow: 0.02, fog: 0.1, wind: 0.1 },
        storm: { clear: 0.05, cloudy: 0.2, rain: 0.4, wind: 0.2 },
        snow: { clear: 0.1, cloudy: 0.3, fog: 0.15, wind: 0.1 },
        fog: { clear: 0.2, cloudy: 0.3, rain: 0.1, snow: 0.05 },
        wind: { clear: 0.25, cloudy: 0.2, storm: 0.1, rain: 0.1 }
    },
    
    // Weather duration tracking
    currentDuration: 0,
    minDuration: 300,  // Minimum ticks before weather can change (30 seconds)
    maxDuration: 1200, // Maximum ticks for any weather (2 minutes)
    
    // Temperature system
    temperature: 50, // 0 = freezing, 100 = scorching
    temperatureRange: {
        clear: { min: 40, max: 80 },
        cloudy: { min: 35, max: 70 },
        rain: { min: 30, max: 60 },
        storm: { min: 25, max: 55 },
        snow: { min: 0, max: 35 },
        fog: { min: 30, max: 60 },
        wind: { min: 20, max: 65 }
    },
    
    // Get current weather data
    getCurrent() {
        return this.types[GameState.weather] || this.types.clear;
    },
    
    // Get weather effect modifier
    getEffect(effectName) {
        const weather = this.getCurrent();
        return weather.effects[effectName] || 1.0;
    },
    
    // Update weather (called each tick)
    update() {
        this.currentDuration++;
        
        // Check if weather should change
        if (this.currentDuration >= this.minDuration) {
            const changeChance = this.getChangeChance();
            
            if (Math.random() < changeChance) {
                this.changeWeather();
            }
        }
        
        // Update temperature
        this.updateTemperature();
        
        // Apply weather effects
        this.applyEffects();
    },
    
    // Calculate chance for weather to change
    getChangeChance() {
        const baseChance = 0.005;  // Reduced from 0.01
        const durationBonus = (this.currentDuration - this.minDuration) / this.maxDuration * 0.03;
        return baseChance + durationBonus;
    },
    
    // Change to a new weather type
    changeWeather() {
        const currentWeather = GameState.weather;
        const transitions = this.transitionChances[currentWeather] || {};
        
        // Build weighted list of possible new weather
        const options = [];
        
        // Add chance to stay same
        options.push({ weather: currentWeather, weight: 0.3 });
        
        // Add transition options
        for (let newWeather in transitions) {
            // Day/night modifiers
            let weight = transitions[newWeather];
            
            if (GameState.dayNightCycle === 'night') {
                // More storms and fog at night
                if (newWeather === 'storm') weight *= 1.5;
                if (newWeather === 'fog') weight *= 1.3;
            }
            
            // Season modifiers (based on time)
            const seasonPhase = (GameState.time % 6000) / 6000; // Simulated seasons
            if (seasonPhase < 0.25 || seasonPhase > 0.75) {
                // "Winter" - more snow
                if (newWeather === 'snow') weight *= 2;
                if (newWeather === 'rain') weight *= 0.5;
            } else {
                // "Summer" - more clear days
                if (newWeather === 'clear') weight *= 1.5;
                if (newWeather === 'snow') weight *= 0.3;
            }
            
            options.push({ weather: newWeather, weight: weight });
        }
        
        // Select new weather
        const newWeather = this.weightedRandom(options);
        
        if (newWeather !== currentWeather) {
            this.setWeather(newWeather);
        }
    },
    
    // Weighted random selection
    weightedRandom(options) {
        const totalWeight = options.reduce((sum, opt) => sum + opt.weight, 0);
        let random = Math.random() * totalWeight;
        
        for (let opt of options) {
            random -= opt.weight;
            if (random <= 0) {
                return opt.weather;
            }
        }
        
        return options[0].weather;
    },
    
    // Set specific weather type
    setWeather(weatherType) {
        if (!this.types[weatherType]) return;
        
        const oldWeather = GameState.weather;
        GameState.weather = weatherType;
        this.currentDuration = 0;
        
        // Narrative for weather change - use expanded narratives if available
        if (oldWeather !== weatherType) {
            if (Narratives.weather && Narratives.weather[weatherType]) {
                UI.addNarrative(Utils.randomChoice(Narratives.weather[weatherType]));
            } else {
                const messages = {
                    clear: 'The skies clear up.',
                    cloudy: 'Clouds gather overhead.',
                    rain: 'Rain begins to fall.',
                    storm: 'A storm breaks out!',
                    snow: 'Snow starts falling.',
                    fog: 'A thick fog rolls in.',
                    wind: 'The wind picks up.'
                };
                UI.addNarrative(messages[weatherType] || 'The weather changes.');
            }
        }
        
        UI.updateWeather();
    },
    
    // Update temperature based on weather and time
    updateTemperature() {
        const weatherType = GameState.weather;
        const range = this.temperatureRange[weatherType] || { min: 30, max: 70 };
        
        // Target temperature based on weather
        let targetTemp = (range.min + range.max) / 2;
        
        // Day/night modifier
        if (GameState.dayNightCycle === 'night') {
            targetTemp -= 10;
        } else if (GameState.dayNightCycle === 'day') {
            targetTemp += 10;
        }
        
        // Gradually adjust temperature
        const diff = targetTemp - this.temperature;
        this.temperature += diff * 0.05;
        this.temperature = Utils.clamp(this.temperature, 0, 100);
    },
    
    // Apply weather effects to game systems
    applyEffects() {
        // Hearth drain modifier is applied in Hearth.update()
        // Gathering modifier is applied in Actions.chopWood()
        // Happiness modifier is applied in Village.updateHappiness()
        
        // Random weather events
        this.checkWeatherEvents();
    },
    
    // Check for weather-related events
    checkWeatherEvents() {
        const weather = GameState.weather;
        
        // Storm events
        if (weather === 'storm') {
            if (Math.random() < 0.002) {
                if (GameState.buildings.shelter > 0) {
                    UI.addNarrative('Lightning strikes nearby! The villagers huddle in fear.', 'warning');
                    GameState.village.happiness -= 2;
                } else {
                    UI.addNarrative('Lightning illuminates the dark sky.', 'warning');
                }
            }
            
            // Chance to damage buildings
            if (Math.random() < 0.001 && GameState.buildings.snare > 0) {
                GameState.buildings.snare = Math.max(0, GameState.buildings.snare - 1);
                UI.addNarrative('A storm buried one of your snares!', 'warning');
            }
        }
        
        // Snow events
        if (weather === 'snow') {
            if (Math.random() < 0.001) {
                UI.addNarrative('The snow is piling up. It\'s getting colder.');
            }
        }
        
        // Fog events
        if (weather === 'fog') {
            if (Math.random() < 0.002 && GameState.population > 0) {
                UI.addNarrative('A villager got lost in the fog but found their way back.');
            }
        }
        
        // Wind events
        if (weather === 'wind') {
            if (Math.random() < 0.002) {
                const woodLost = Math.min(GameState.resources.wood, Utils.random(1, 3));
                if (woodLost > 0) {
                    GameState.resources.wood -= woodLost;
                    UI.addNarrative(`The wind scattered ${woodLost} of your gathered wood.`, 'warning');
                }
            }
        }
        
        // Rain benefits
        if (weather === 'rain' && Math.random() < 0.003) {
            UI.addNarrative('The rain washes away the grime. You feel refreshed.');
            GameState.village.happiness += 1;
        }
        
        // Clear day benefits
        if (weather === 'clear' && GameState.dayNightCycle === 'day') {
            if (Math.random() < 0.002) {
                GameState.village.happiness += 1;
            }
        }
    },
    
    // Get temperature description
    getTemperatureDesc() {
        if (this.temperature < 15) return 'Freezing';
        if (this.temperature < 30) return 'Cold';
        if (this.temperature < 45) return 'Chilly';
        if (this.temperature < 55) return 'Moderate';
        if (this.temperature < 70) return 'Warm';
        if (this.temperature < 85) return 'Hot';
        return 'Scorching';
    },
    
    // Get warmth warning for player
    getWarmthWarning() {
        if (this.temperature < 20 && GameState.hearthState === 'cold') {
            return 'You are freezing! Kindle the hearth!';
        }
        if (this.temperature < 30 && GameState.hearthState !== 'blazing') {
            return 'It\'s cold. You should keep the hearth burning.';
        }
        return null;
    },
    
    // Force weather change (for events)
    forceWeather(weatherType) {
        if (this.types[weatherType]) {
            this.setWeather(weatherType);
        }
    }
};

// ============================================
// SAVE SYSTEM
// ============================================
const SaveSystem = {
    saveKey: 'embersOfKaldervale_save',
    legacySaveKeys: ['forgottenCabin_save'], // saves from before the rename
    version: 2,

    // Upgrade saves from version 1 (old building, item, worker and resource names)
    migrate(data) {
        if ((data.version || 1) >= 2) return data;

        const renameKeys = (obj, map) => {
            if (!obj) return;
            for (const [oldKey, newKey] of Object.entries(map)) {
                if (oldKey in obj) {
                    obj[newKey] = (obj[newKey] || 0) + obj[oldKey];
                    delete obj[oldKey];
                }
            }
        };
        renameKeys(data.buildings, {
            trap: 'snare', cart: 'sledge', hut: 'shelter', lodge: 'huntingCamp',
            tradingPost: 'waystation', tannery: 'loom', smokehouse: 'rootCellar',
            workshop: 'forge', steelworks: 'smelter', armoury: 'arsenal',
            library: 'mapRoom', tavern: 'commonHall'
        });
        renameKeys(data.items, {
            torch: 'lantern', waterskin: 'canteen', curedMeat: 'rations',
            leatherArmour: 'hideCoat', ironSword: 'ironSpear', steelSword: 'steelSabre'
        });
        renameKeys(data.workers, {
            gatherer: 'woodcutter', trapper: 'snarer', ironsmith: 'prospector',
            coalminer: 'collier', steelworker: 'smelterHand', tailor: 'weaver'
        });
        renameKeys(data.resources, { fur: 'hide' });
        if (typeof data.fireHealth === 'number') data.hearthHeat = data.fireHealth;

        data.version = 2;
        return data;
    },

    // silent = true for autosaves, so the "Game saved!" toast only shows on manual saves
    save(silent = false) {
        const saveData = {
            resources: GameState.resources,
            buildings: GameState.buildings,
            items: GameState.items,
            hearthState: GameState.hearthState,
            hearthHeat: GameState.hearthHeat,
            unlocks: GameState.unlocks,
            population: GameState.population,
            workers: GameState.workers,
            village: GameState.village,
            player: {
                ...GameState.player,
                exploredTiles: Array.from(GameState.player.exploredTiles)
            },
            // Clock, weather and world (previously lost on every reload)
            time: GameState.time,
            day: GameState.day,
            dayNightCycle: GameState.dayNightCycle,
            weather: GameState.weather,
            weatherDuration: Weather.currentDuration,
            temperature: Weather.temperature,
            worldSeed: GameState.worldSeed,
            story: GameState.story,
            version: this.version,
            timestamp: Date.now()
        };

        try {
            localStorage.setItem(this.saveKey, JSON.stringify(saveData));
        } catch (e) {
            console.error('Failed to save:', e);
            if (!silent) UI.notify('Could not save the game (storage unavailable).');
            return;
        }
        if (!silent) UI.notify('Game saved!');
    },
    
    load() {
        let saveData = null;
        try {
            saveData = localStorage.getItem(this.saveKey)
                ?? this.legacySaveKeys.map(k => localStorage.getItem(k)).find(Boolean)
                ?? null;
        } catch (e) {
            return false; // storage unavailable (private mode etc.): start a new game
        }
        if (!saveData) return false;
        
        try {
            const data = this.migrate(JSON.parse(saveData));

            // Restore state
            Object.assign(GameState.resources, data.resources);
            Object.assign(GameState.buildings, data.buildings);
            Object.assign(GameState.items, data.items);
            GameState.hearthHeat = data.hearthHeat || 0;
            GameState.hearthState = Hearth.stateFor(GameState.hearthHeat).id;
            Object.assign(GameState.unlocks, data.unlocks);
            GameState.population = data.population || 0;
            
            // Restore workers
            if (data.workers) {
                Object.assign(GameState.workers, data.workers);
            }
            
            // Restore village state
            if (data.village) {
                Object.assign(GameState.village, data.village);
            }
            
            if (data.player) {
                GameState.player = {
                    ...GameState.player,
                    ...data.player,
                    exploredTiles: new Set(data.player.exploredTiles || [])
                };
            }

            // Clock and weather (older saves don't have these; keep the defaults)
            if (typeof data.time === 'number') GameState.time = data.time;
            if (typeof data.day === 'number') GameState.day = data.day;
            if (data.dayNightCycle) GameState.dayNightCycle = data.dayNightCycle;
            if (data.weather && Weather.types[data.weather]) GameState.weather = data.weather;
            if (typeof data.weatherDuration === 'number') Weather.currentDuration = data.weatherDuration;
            if (typeof data.temperature === 'number') Weather.temperature = data.temperature;
            if (typeof data.worldSeed === 'number') GameState.worldSeed = data.worldSeed;
            if (data.story) {
                Object.assign(GameState.story, data.story);
            }

            // Older saves stored the raid timer but not the clock, which left
            // lastAttack far ahead of time and disabled raids. Pull it back.
            if (GameState.village.lastAttack > GameState.time) {
                GameState.village.lastAttack = GameState.time;
            }

            // Calculate offline progress
            this.calculateOfflineProgress(data.timestamp);
            
            UI.addNarrative('Game loaded.', 'success');
            return true;
        } catch (e) {
            console.error('Failed to load save:', e);
            return false;
        }
    },
    
    // Calculate resources gained while away (Cookie Clicker style)
    calculateOfflineProgress(savedTimestamp) {
        const now = Date.now();
        const timePassed = now - savedTimestamp; // milliseconds
        const ticksPassed = Math.floor(timePassed / Config.tickRate);
        
        if (ticksPassed <= 0) return;
        
        // Calculate resources from workers
        const resourcesGained = {};
        let totalWorkers = 0;
        
        for (let type in GameState.workers) {
            const count = GameState.workers[type];
            if (count <= 0) continue;
            
            totalWorkers += count;
            const workerDef = Village.workerTypes[type];
            if (!workerDef || !workerDef.production) continue;

            // Input-limited workers can only use what was in stock when you left
            const efficiency = Village.inputEfficiency(workerDef, count, ticksPassed);
            if (workerDef.consumes) {
                for (let input in workerDef.consumes) {
                    GameState.resources[input] -= workerDef.consumes[input] * count * ticksPassed * efficiency;
                }
            }

            for (let resource in workerDef.production) {
                let amount = workerDef.production[resource] * count * ticksPassed * efficiency;

                // Apply weather modifier (use average of 1.0 for offline)
                if (type === 'woodcutter' || type === 'hunter' || type === 'snarer' || type === 'farmer') {
                    amount *= 1.0; // Normal weather for offline
                }
                
                resourcesGained[resource] = (resourcesGained[resource] || 0) + amount;
            }
        }
        
        // Apply resources
        if (Object.keys(resourcesGained).length > 0) {
            for (let resource in resourcesGained) {
                const amount = Math.floor(resourcesGained[resource]);
                if (amount > 0) {
                    GameState.resources[resource] += amount;
                    Utils.revealResource(resource);
                }
            }
            
            // Format time away message
            const timeAway = this.formatTimeAway(timePassed);
            const gainMessages = Object.entries(resourcesGained)
                .filter(([r, a]) => Math.floor(a) > 0)
                .map(([r, a]) => `${Math.floor(a)} ${r}`)
                .join(', ');
            
            if (gainMessages) {
                setTimeout(() => {
                    UI.addNarrative(`While you were away for ${timeAway}, your workers gathered: ${gainMessages}.`, 'success');
                }, 1500);
            }
        }
        
        // Consume food while away
        const foodConsumption = GameState.population * GameState.village.foodConsumption * ticksPassed * 0.1;
        const foodAfterConsumption = GameState.resources.food - foodConsumption;
        GameState.resources.food = Math.max(0, foodAfterConsumption);
        
        // Check for starvation while away
        if (foodAfterConsumption < 0 && GameState.population > 0) {
            const starvedVillagers = Math.min(GameState.population, Math.ceil(Math.abs(foodAfterConsumption) / 10));
            GameState.population -= starvedVillagers;
            
            // Remove from workers if needed
            if (starvedVillagers > 0) {
                let toRemove = starvedVillagers;
                for (let type in GameState.workers) {
                    if (toRemove <= 0) break;
                    while (GameState.workers[type] > 0 && toRemove > 0) {
                        GameState.workers[type]--;
                        toRemove--;
                    }
                }
                setTimeout(() => {
                    UI.addNarrative(`While you were away, ${starvedVillagers} villager(s) left due to starvation.`, 'warning');
                }, 2000);
            }
        }
        
        // Update population tracking
        Village.updatePopulation();
    },
    
    // Format time away in readable format
    formatTimeAway(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) {
            return `${days} day${days > 1 ? 's' : ''}`;
        } else if (hours > 0) {
            return `${hours} hour${hours > 1 ? 's' : ''}`;
        } else if (minutes > 0) {
            return `${minutes} minute${minutes > 1 ? 's' : ''}`;
        } else {
            return `${seconds} second${seconds > 1 ? 's' : ''}`;
        }
    },
    
    reset() {
        if (confirm('Are you sure you want to reset the game? All progress will be lost.')) {
            this.resetting = true; // stop the pagehide save from writing the old game back
            [this.saveKey, ...this.legacySaveKeys].forEach(k => localStorage.removeItem(k));
            location.reload();
        }
    }
};

// ============================================
// EVENT SYSTEM
// ============================================
const Events = {
    // Random events that can occur
    randomEvents: [
        {
            condition: () => GameState.hearthState === 'steady' && Math.random() < 0.003,
            action: () => {
                UI.addNarrative('A traveler knocks at the door, seeking warmth.');
                if (GameState.buildings.shelter > 0 && GameState.population < GameState.maxPopulation) {
                    UI.addNarrative('They decide to stay and join your growing village.');
                    Village.villagerArrives();
                }
            }
        },
        {
            condition: () => GameState.resources.wood > 50 && Math.random() < 0.001,
            action: () => {
                const stolen = Math.floor(GameState.resources.wood * 0.1);
                GameState.resources.wood -= stolen;
                UI.addNarrative(`Thieves stole ${stolen} wood during the night!`, 'warning');
            }
        },
        {
            condition: () => GameState.population > 0 && Math.random() < 0.001,
            action: () => {
                UI.addNarrative('A villager has a dream about treasure in the nearby ruins.');
            }
        },
        {
            condition: () => GameState.dayNightCycle === 'night' && GameState.hearthState === 'cold' && Math.random() < 0.005,
            action: () => {
                UI.addNarrative('Something scratches at the walls. You feel watched.', 'warning');
            }
        },
        {
            condition: () => GameState.dayNightCycle === 'day' && GameState.weather === 'clear' && Math.random() < 0.001,
            action: () => {
                const found = Utils.random(3, 8);
                GameState.resources.food += found;
                UI.addNarrative(`Foragers found ${found} berries in the forest!`, 'success');
            }
        },
        {
            condition: () => GameState.population > 3 && Math.random() < 0.001,
            action: () => {
                UI.addNarrative('The villagers are celebrating! Happiness increases.');
                GameState.village.happiness = Math.min(100, GameState.village.happiness + 10);
            }
        },
        {
            condition: () => GameState.resources.food > 100 && GameState.population > 0 && Math.random() < 0.001,
            action: () => {
                UI.addNarrative('A feast is held! The village morale is high.');
                GameState.village.happiness = Math.min(100, GameState.village.happiness + 5);
                GameState.resources.food -= 20;
            }
        },
        {
            condition: () => GameState.dayNightCycle === 'dawn' && Math.random() < 0.001,
            action: () => {
                UI.addNarrative('The dawn brings a sense of hope. A new day begins.');
            }
        },
        {
            condition: () => GameState.buildings.huntingCamp > 0 && Math.random() < 0.001,
            action: () => {
                const hide = Utils.random(2, 5);
                GameState.resources.hide += hide;
                Utils.revealResource('hide');
                UI.addNarrative(`Hunters returned with ${hide} hide from their morning hunt.`, 'success');
            }
        },
        {
            condition: () => GameState.population > 5 && GameState.village.happiness < 30 && Math.random() < 0.002,
            action: () => {
                UI.addNarrative('The villagers are unhappy. Something should be done.', 'warning');
            }
        },
        {
            condition: () => GameState.day % 10 === 0 && GameState.dayNightCycle === 'dawn' && Math.random() < 0.05,
            action: () => {
                UI.addNarrative(`A milestone! The village has survived for ${GameState.day} days.`, 'success');
                GameState.village.happiness = Math.min(100, GameState.village.happiness + 15);
            }
        },
        // Rare event to find iron (very low chance)
        {
            condition: () => GameState.buildings.huntingCamp > 0 && GameState.workers.hunter > 0 && Math.random() < 0.001,
            action: () => {
                const iron = Utils.random(1, 2);
                GameState.resources.iron += iron;
                Utils.revealResource('iron');
                UI.addNarrative(`A hunter discovered ${iron} iron ore in an abandoned mine!`, 'success');
            }
        }
    ],
    
    check() {
        this.randomEvents.forEach(event => {
            if (event.condition()) {
                event.action();
            }
        });
    }
};

// ============================================
// COMBAT SYSTEM
// ============================================
const Combat = {
    // Enemy definitions
    enemies: {
        wolf: {
            name: 'Wolf',
            health: 30,
            maxHealth: 30,
            attack: 8,
            defense: 2,
            xpReward: 10,
            loot: [
                { item: 'food', chance: 0.8, min: 2, max: 5 },
                { item: 'hide', chance: 0.5, min: 1, max: 3 }
            ]
        },
        bandit: {
            name: 'Bandit',
            health: 40,
            maxHealth: 40,
            attack: 12,
            defense: 5,
            xpReward: 20,
            loot: [
                { item: 'food', chance: 0.6, min: 3, max: 8 },
                { item: 'cloth', chance: 0.4, min: 1, max: 3 },
                { item: 'iron', chance: 0.2, min: 1, max: 2 }
            ]
        },
        bear: {
            name: 'Bear',
            health: 80,
            maxHealth: 80,
            attack: 20,
            defense: 8,
            xpReward: 50,
            loot: [
                { item: 'food', chance: 1, min: 10, max: 20 },
                { item: 'hide', chance: 0.9, min: 5, max: 10 }
            ]
        },
        skeleton: {
            name: 'Skeleton',
            health: 25,
            maxHealth: 25,
            attack: 10,
            defense: 3,
            xpReward: 15,
            loot: [
                { item: 'iron', chance: 0.3, min: 1, max: 3 }
            ]
        },
        frostWraith: {
            name: 'Frost Wraith',
            health: 50,
            maxHealth: 50,
            attack: 15,
            defense: 0,
            xpReward: 30,
            loot: [
                { item: 'cloth', chance: 0.5, min: 2, max: 5 }
            ]
        },
        rimewyrm: {
            name: 'The Rimewyrm',
            health: 150,
            maxHealth: 150,
            attack: 18,
            defense: 8,
            xpReward: 200,
            loot: [
                { item: 'steel', chance: 1, min: 10, max: 20 },
                { item: 'iron', chance: 1, min: 20, max: 40 }
            ]
        }
    },
    
    // Start combat with an enemy
    start(enemyId) {
        const enemyTemplate = this.enemies[enemyId];
        if (!enemyTemplate) return false;
        if (GameState.combat.active) return false; // never start a second fight on top of one
        
        // Create enemy instance
        GameState.combat.enemy = {
            ...enemyTemplate,
            health: enemyTemplate.maxHealth,
            id: enemyId
        };
        GameState.combat.active = true;
        GameState.combat.turn = 'player';
        GameState.combat.log = [];
        
        GameState.unlocks.combat = true;
        
        UI.addNarrative(`A ${enemyTemplate.name} appears!`, 'warning');
        this.addLog(`Combat started with ${enemyTemplate.name}!`);
        
        UI.showCombatPanel();
        UI.updateCombat();
        
        return true;
    },
    
    // Player attack
    attack() {
        if (!GameState.combat.active || GameState.combat.turn !== 'player') return;
        
        const player = GameState.player;
        const enemy = GameState.combat.enemy;
        
        // Calculate damage
        let damage = player.attack;
        
        // Weapon bonus
        if (GameState.items.ironSpear > 0) damage += 5;
        if (GameState.items.steelSabre > 0) damage += 10;
        
        // Critical hit
        const isCritical = Math.random() < player.criticalChance;
        if (isCritical) {
            damage *= 2;
            this.addLog(`Critical hit!`);
        }
        
        // Apply defense
        damage = Math.max(1, damage - enemy.defense);
        
        // Deal damage
        enemy.health -= damage;
        this.addLog(`You deal ${damage} damage to ${enemy.name}!`);
        
        // Check if enemy defeated
        if (enemy.health <= 0) {
            this.victory();
            return;
        }
        
        // Enemy turn
        GameState.combat.turn = 'enemy';
        UI.updateCombat();
        setTimeout(() => this.enemyTurn(), 1000);
    },
    
    // Player defends (reduces incoming damage)
    defend() {
        if (!GameState.combat.active || GameState.combat.turn !== 'player') return;
        
        const player = GameState.player;
        
        // Defense bonus for this turn
        player.defending = true;
        this.addLog('You brace for impact!');
        
        // Enemy turn
        GameState.combat.turn = 'enemy';
        UI.updateCombat();
        setTimeout(() => this.enemyTurn(), 1000);
    },
    
    // Player attempts to flee
    flee() {
        if (!GameState.combat.active || GameState.combat.turn !== 'player') return;
        
        const fleeChance = 0.4;
        
        if (Math.random() < fleeChance) {
            this.addLog('You successfully fled!');
            UI.addNarrative('You escaped from combat!', 'success');
            this.end();
        } else {
            this.addLog('Failed to flee!');
            GameState.combat.turn = 'enemy';
            UI.updateCombat();
            setTimeout(() => this.enemyTurn(), 1000);
        }
    },
    
    // Use item in combat
    useItem(itemId) {
        if (!GameState.combat.active || GameState.combat.turn !== 'player') return;
        
        switch (itemId) {
            case 'rations':
                if (GameState.items.rations > 0) {
                    GameState.items.rations--;
                    const heal = 20;
                    GameState.player.health = Math.min(
                        GameState.player.health + heal,
                        GameState.player.maxHealth
                    );
                    this.addLog(`You ate trail rations and restored ${heal} health!`);
                }
                break;
        }
        
        // Enemy turn
        GameState.combat.turn = 'enemy';
        UI.updateCombat();
        setTimeout(() => this.enemyTurn(), 1000);
    },
    
    // Enemy turn
    enemyTurn() {
        if (!GameState.combat.active) return;
        
        const player = GameState.player;
        const enemy = GameState.combat.enemy;
        
        // Calculate damage
        let damage = enemy.attack;
        
        // Armour reduction
        if (GameState.items.hideCoat > 0) damage -= 5;
        
        // Defense from defending action
        if (player.defending) {
            damage *= 0.5;
            player.defending = false;
        }
        
        // Player defense stat
        damage = Math.max(1, damage - player.defense);
        
        // Dodge chance
        const dodged = Math.random() < player.dodgeChance;
        if (dodged) {
            this.addLog(`You dodged the ${enemy.name}'s attack!`);
        } else {
            player.health -= damage;
            this.addLog(`${enemy.name} deals ${damage} damage to you!`);
            
            // Check if player defeated
            if (player.health <= 0) {
                this.defeat();
                return;
            }
        }
        
        // Back to player turn
        GameState.combat.turn = 'player';
        UI.updateCombat();
    },
    
    // Victory
    victory() {
        const enemy = GameState.combat.enemy;
        
        this.addLog(`You defeated the ${enemy.name}!`);
        UI.addNarrative(`You defeated the ${enemy.name}!`, 'success');
        
        // Award loot
        enemy.loot.forEach(loot => {
            if (Math.random() < loot.chance) {
                const amount = Utils.random(loot.min, loot.max);
                GameState.resources[loot.item] += amount;
                Utils.revealResource(loot.item);
                this.addLog(`Obtained ${amount} ${loot.item}!`);
                UI.addNarrative(`You found ${amount} ${loot.item}.`);
            }
        });

        const wasBoss = enemy.id === 'rimewyrm';
        this.end();
        if (wasBoss) Story.ending();
    },
    
    // Defeat
    defeat() {
        const enemy = GameState.combat.enemy;
        
        this.addLog(`You were defeated by the ${enemy.name}...`);
        UI.addNarrative(`You were defeated by the ${enemy.name}...`, 'warning');
        
        // Lose some resources
        const woodLost = Math.floor(GameState.resources.wood * 0.3);
        const foodLost = Math.floor(GameState.resources.food * 0.3);
        GameState.resources.wood -= woodLost;
        GameState.resources.food -= foodLost;
        
        // Restore some health
        GameState.player.health = Math.floor(GameState.player.maxHealth * 0.3);

        // Wake up back at the cabin
        if (GameState.player.mapPosition.x !== WorldMap.home.x || GameState.player.mapPosition.y !== WorldMap.home.y) {
            GameState.player.mapPosition = { ...WorldMap.home };
            WorldMap.close();
            UI.addNarrative('Someone drags you back to the cabin through the snow. You wake by the hearth.');
        }

        this.end();
    },
    
    // End combat
    end() {
        GameState.combat.active = false;
        GameState.combat.enemy = null;
        GameState.combat.turn = 'player';
        
        UI.hideCombatPanel();
        UI.updateAll();
    },
    
    // Add to combat log
    addLog(message) {
        GameState.combat.log.push(message);
        if (GameState.combat.log.length > 20) {
            GameState.combat.log.shift();
        }
        UI.updateCombatLog();
    },
    
    // Get random enemy based on location/danger level
    getRandomEnemy(dangerLevel = 1) {
        const enemyPool = [];
        
        if (dangerLevel === 1) {
            enemyPool.push('wolf', 'skeleton');
        } else if (dangerLevel === 2) {
            enemyPool.push('wolf', 'bandit', 'skeleton');
        } else if (dangerLevel === 3) {
            enemyPool.push('bandit', 'bear', 'frostWraith');
        } else {
            // The Rimewyrm is unique: it only fights you at its nest
            enemyPool.push('bear', 'frostWraith', 'bandit');
        }
        
        return Utils.randomChoice(enemyPool);
    }
};

// ============================================
// VILLAGE MANAGEMENT SYSTEM
// ============================================
const Village = {
    // Worker definitions
    workerTypes: {
        woodcutter: {
            name: 'Woodcutter',
            description: 'Chops wood automatically',
            production: { wood: 0.05 },
            requires: { shelter: true }
        },
        hunter: {
            name: 'Hunter',
            description: 'Hunts for food and hides',
            production: { food: 0.04, hide: 0.02 },
            requires: { huntingCamp: true }
        },
        snarer: {
            name: 'Snare Setter',
            description: 'Catches small game',
            production: { food: 0.03, hide: 0.02 },
            requires: { snare: 3 }
        },
        farmer: {
            name: 'Farmer',
            description: 'Grows food crops',
            production: { food: 0.05 },
            requires: { rootCellar: true }
        },
        weaver: {
            name: 'Weaver',
            description: 'Weaves cloth from hides',
            production: { cloth: 0.02 },
            requires: { loom: true }
        },
        prospector: {
            name: 'Prospector',
            description: 'Digs iron ore out of the hills',
            production: { iron: 0.01 },
            requires: { forge: true }
        },
        collier: {
            name: 'Collier',
            description: 'Mines coal from deposits',
            production: { coal: 0.015 },
            requires: { smelter: true }
        },
        smelterHand: {
            name: 'Smelter Hand',
            description: 'Smelts 2 iron + 1 coal into 1 steel',
            production: { steel: 0.005 },
            consumes: { iron: 0.01, coal: 0.005 },
            requires: { smelter: true }
        },
        guard: {
            name: 'Guard',
            description: 'Protects the village',
            production: {},
            defense: 5,
            requires: { barracks: true }
        },
        healer: {
            name: 'Healer',
            description: 'Tends to the sick, boosts happiness',
            production: {},
            happinessBonus: 2,
            requires: { temple: true }
        },
        merchant: {
            name: 'Merchant',
            description: 'Generates coins over time',
            production: {},
            goldBonus: 0.5,
            requires: { market: true }
        }
    },
    
    // Village buildings
    villageBuildings: {
        well: {
            name: 'Well',
            cost: { wood: 30, iron: 5 },
            description: 'Provides water, increases happiness',
            effect: { happiness: 10 },
            max: 1
        },
        tavern: {
            name: 'Tavern',
            cost: { wood: 80, hide: 20, cloth: 10 },
            description: 'Travelers rest here, increases happiness',
            effect: { happiness: 20, visitorChance: 0.1 },
            max: 1
        },
        temple: {
            name: 'Temple',
            cost: { wood: 100, cloth: 30, iron: 20 },
            description: 'Spiritual center, increases happiness',
            effect: { happiness: 25 },
            max: 1
        },
        barracks: {
            name: 'Barracks',
            cost: { wood: 120, iron: 40, steel: 10 },
            description: 'Allows training guards',
            effect: { allowsGuards: true },
            max: 1
        },
        market: {
            name: 'Market',
            cost: { wood: 60, cloth: 20 },
            description: 'Enables trading with merchants',
            effect: { trading: true },
            max: 1
        },
        watchtower: {
            name: 'Watchtower',
            cost: { wood: 50, iron: 10 },
            description: 'Warns of attacks, increases defense',
            effect: { defense: 10 },
            max: 3
        }
    },
    
    // Assign worker
    assignWorker(type) {
        if (!this.canAssignWorker(type)) return false;
        
        GameState.workers[type]++;
        this.updatePopulation();
        UI.addNarrative(`A villager is now working as a ${this.workerTypes[type].name}.`);
        UI.updateVillage();
        return true;
    },
    
    // Remove worker
    removeWorker(type) {
        if (GameState.workers[type] <= 0) return false;
        
        GameState.workers[type]--;
        this.updatePopulation();
        UI.addNarrative(`A ${this.workerTypes[type].name} returned to idle.`);
        UI.updateVillage();
        return true;
    },
    
    // Check if worker can be assigned
    canAssignWorker(type) {
        const workerDef = this.workerTypes[type];
        const idleVillagers = this.getIdleVillagers();
        
        if (idleVillagers <= 0) return false;
        
        // Check requirements
        for (let req in workerDef.requires) {
            if (req === 'shelter' && GameState.buildings.shelter <= 0) return false;
            if (req === 'huntingCamp' && GameState.buildings.huntingCamp <= 0) return false;
            if (req === 'forge' && GameState.buildings.forge <= 0) return false;
            if (req === 'loom' && GameState.buildings.loom <= 0) return false;
            if (req === 'rootCellar' && GameState.buildings.rootCellar <= 0) return false;
            if (req === 'smelter' && GameState.buildings.smelter <= 0) return false;
            if (req === 'arsenal' && GameState.buildings.arsenal <= 0) return false;
            if (req === 'barracks' && GameState.village.buildings.barracks <= 0) return false;
            if (req === 'temple' && GameState.village.buildings.temple <= 0) return false;
            if (req === 'market' && GameState.village.buildings.market <= 0) return false;
            if (typeof workerDef.requires[req] === 'number') {
                if (GameState.buildings[req] < workerDef.requires[req]) return false;
            }
        }
        
        return true;
    },
    
    // Get idle villagers
    getIdleVillagers() {
        const totalWorkers = Object.values(GameState.workers).reduce((a, b) => a + b, 0);
        return GameState.population - totalWorkers;
    },
    
    // Get max population
    getMaxPopulation() {
        return GameState.buildings.shelter * 2;
    },
    
    // Update population tracking
    updatePopulation() {
        GameState.maxPopulation = this.getMaxPopulation();
    },
    
    // Track accumulated resources for logging
    accumulatedResources: {},
    lastLogTime: Date.now(), // Initialize to current time
    logInterval: 120000, // Log every 120 seconds (2 minutes) - reduced spam
    
    // Process worker production (called each tick)
    processWorkers() {
        let hasWorkers = false;
        let totalWorkers = 0;
        
        for (let type in GameState.workers) {
            const count = GameState.workers[type];
            if (count <= 0) continue;
            
            hasWorkers = true;
            totalWorkers += count;
            const workerDef = this.workerTypes[type];
            if (!workerDef) continue;
            
            // Workers with inputs (e.g. steel workers) only produce as much as
            // their inputs allow, and use those inputs up.
            const efficiency = this.inputEfficiency(workerDef, count, 1);
            if (workerDef.consumes) {
                for (let input in workerDef.consumes) {
                    GameState.resources[input] -= workerDef.consumes[input] * count * efficiency;
                }
            }

            // Process resource production
            if (workerDef.production) {
                for (let resource in workerDef.production) {
                    let amount = workerDef.production[resource] * count * efficiency;
                    
                    // Apply weather modifier for outdoor workers
                    if (type === 'woodcutter' || type === 'hunter' || type === 'snarer' || type === 'farmer') {
                        amount *= Weather.getEffect('gatherMod');
                    }
                    
                    GameState.resources[resource] += amount;
                    
                    // Track for logging
                    this.accumulatedResources[resource] = (this.accumulatedResources[resource] || 0) + amount;
                    
                    // Reveal resources when produced
                    if (amount > 0) {
                        Utils.revealResource(resource);
                    }
                }
            }
            
            // Process special bonuses
            if (workerDef.happinessBonus) {
                GameState.village.happiness += workerDef.happinessBonus * count * 0.01;
            }
        }
        
        // Consume food
        const foodConsumption = GameState.population * GameState.village.foodConsumption;
        GameState.resources.food -= foodConsumption * 0.1; // Per tick
        
        // Check for starvation
        if (GameState.resources.food < 0) {
            GameState.resources.food = 0;
            GameState.village.happiness -= 1;
            if (Math.random() < 0.01) {
                this.villagerLeaves('starvation');
            }
        }
        
        // Clamp happiness
        GameState.village.happiness = Utils.clamp(GameState.village.happiness, 0, 100);
        
        // Log accumulated resources periodically
        this.logAccumulatedResources();
    },
    
    // Fraction (0..1) of full output a worker group can reach over `ticks` ticks,
    // limited by the inputs in stock. Workers without inputs always return 1.
    inputEfficiency(workerDef, count, ticks) {
        if (!workerDef.consumes || count <= 0) return 1;
        let efficiency = 1;
        for (let input in workerDef.consumes) {
            const needed = workerDef.consumes[input] * count * ticks;
            if (needed > 0) {
                efficiency = Math.min(efficiency, Math.max(0, GameState.resources[input]) / needed);
            }
        }
        return Utils.clamp(efficiency, 0, 1);
    },

    // Calculate production rates per second
    calculateProductionRates() {
        const rates = {};
        const ticksPerSecond = 1000 / Config.tickRate; // 10 ticks per second
        
        for (let type in GameState.workers) {
            const count = GameState.workers[type];
            if (count <= 0) continue;
            
            const workerDef = this.workerTypes[type];
            if (!workerDef || !workerDef.production) continue;

            const efficiency = this.inputEfficiency(workerDef, count, 1);
            if (workerDef.consumes) {
                for (let input in workerDef.consumes) {
                    rates[input] = (rates[input] || 0) - workerDef.consumes[input] * count * ticksPerSecond * efficiency;
                }
            }

            for (let resource in workerDef.production) {
                let rate = workerDef.production[resource] * count * ticksPerSecond * efficiency;
                
                // Apply weather modifier for outdoor workers
                if (type === 'woodcutter' || type === 'hunter' || type === 'snarer' || type === 'farmer') {
                    rate *= Weather.getEffect('gatherMod');
                }
                
                rates[resource] = (rates[resource] || 0) + rate;
            }
        }
        
        // Subtract food consumption
        const foodConsumptionRate = GameState.population * GameState.village.foodConsumption * ticksPerSecond * 0.1;
        rates.food = (rates.food || 0) - foodConsumptionRate;
        
        return rates;
    },
    
    // Log what workers have gathered
    logAccumulatedResources() {
        const now = Date.now();
        if (now - this.lastLogTime < this.logInterval) return;
        
        this.lastLogTime = now;
        
        // Check if there's anything to report
        if (Object.keys(this.accumulatedResources).length === 0) return;
        
        // Build log message
        const messages = [];
        for (let resource in this.accumulatedResources) {
            const amount = Math.floor(this.accumulatedResources[resource]);
            if (amount > 0) {
                messages.push(`${amount} ${resource}`);
            }
        }
        
        // Clear accumulated resources
        this.accumulatedResources = {};
        
        // Log if there's something to report
        if (messages.length > 0) {
            UI.addNarrative(`Workers brought you: ${messages.join(', ')}.`, 'success');
        }
    },
    
    // Villager arrives
    villagerArrives() {
        if (GameState.population >= GameState.maxPopulation) return;
        
        GameState.population++;
        GameState.village.happiness += 2;
        UI.addNarrative('A stranger arrives at the village seeking shelter.', 'success');
        this.checkVillageUnlock();
        UI.updatePopulation();
        UI.updateVillage();
    },

    // The village is founded once two people live here, however they arrived
    checkVillageUnlock() {
        if (GameState.unlocks.village || GameState.population < 2) return;

        GameState.unlocks.village = true;
        document.getElementById('village-panel')?.classList.remove('hidden');
        UI.addNarrative(Utils.randomChoice(Narratives.villageFounded), 'success');
    },
    
    // Villager leaves
    villagerLeaves(reason = 'unhappy') {
        if (GameState.population <= 0) return;
        
        // Remove from idle or workers
        const idle = this.getIdleVillagers();
        if (idle > 0) {
            GameState.population--;
        } else {
            // Remove from a random worker type
            const workerTypes = Object.keys(GameState.workers).filter(w => GameState.workers[w] > 0);
            if (workerTypes.length > 0) {
                const type = Utils.randomChoice(workerTypes);
                GameState.workers[type]--;
                GameState.population--;
            }
        }
        
        const messages = {
            starvation: 'A villager has left due to starvation!',
            unhappy: 'An unhappy villager has left the village.',
            attack: 'A villager was killed in the attack!'
        };
        
        UI.addNarrative(messages[reason] || 'A villager has left.', 'warning');
        UI.updateVillage();
    },
    
    // Build village building
    buildVillageBuilding(buildingId) {
        const building = this.villageBuildings[buildingId];
        if (!building) return false;
        
        const currentCount = GameState.village.buildings[buildingId];
        if (building.max && currentCount >= building.max) return false;
        if (!Utils.canAfford(building.cost)) return false;
        
        Utils.deductResources(building.cost);
        GameState.village.buildings[buildingId]++;
        
        // Apply effects
        if (building.effect.happiness) {
            GameState.village.happiness += building.effect.happiness;
        }
        if (building.effect.defense) {
            GameState.village.defense += building.effect.defense;
        }
        
        UI.addNarrative(`Built a ${building.name}!`, 'success');
        UI.updateVillage();
        return true;
    },
    
    // Update village happiness
    updateHappiness() {
        let happiness = 50;
        
        // Hearth bonus
        if (GameState.hearthState === 'steady' || GameState.hearthState === 'blazing') {
            happiness += 10;
        } else if (GameState.hearthState === 'cold') {
            happiness -= 10;
        }
        
        // Weather effects on happiness
        happiness += Weather.getEffect('happinessMod');
        
        // Temperature effects
        if (Weather.temperature < 20) {
            happiness -= 5; // Too cold
        } else if (Weather.temperature > 85) {
            happiness -= 5; // Too hot
        }
        
        // Building bonuses
        for (let buildingId in GameState.village.buildings) {
            const count = GameState.village.buildings[buildingId];
            if (count > 0) {
                const building = this.villageBuildings[buildingId];
                if (building.effect.happiness) {
                    happiness += building.effect.happiness * count;
                }
            }
        }
        
        // Food penalty
        if (GameState.resources.food < 10) {
            happiness -= 15;
        }
        
        // Population density penalty
        const density = GameState.population / Math.max(1, GameState.maxPopulation);
        if (density > 0.9) {
            happiness -= 10;
        }
        
        GameState.village.happiness = Utils.clamp(happiness, 0, 100);
    },
    
    // Village raid event
    checkRaid() {
        if (GameState.population <= 0) return;
        
        const timeSinceLastAttack = GameState.time - GameState.village.lastAttack;
        const raidChance = 0.001 + (GameState.population * 0.0001);
        
        if (timeSinceLastAttack < 1000) return; // Cooldown
        if (Math.random() > raidChance) return;
        
        // Calculate attack strength
        const attackStrength = Utils.random(10, 30) + (GameState.population * 2);
        const defense = GameState.village.defense + (GameState.workers.guard * 5);
        
        if (defense >= attackStrength) {
            UI.addNarrative('The village guards repelled a raid attempt!', 'success');
        } else {
            const damage = attackStrength - defense;
            const resourcesLost = {
                wood: Math.min(GameState.resources.wood, Math.floor(damage * 0.5)),
                food: Math.min(GameState.resources.food, Math.floor(damage * 0.3))
            };
            
            GameState.resources.wood -= resourcesLost.wood;
            GameState.resources.food -= resourcesLost.food;
            
            // Possible villager death
            if (Math.random() < 0.3) {
                this.villagerLeaves('attack');
            }
            
            UI.addNarrative(`The village was raided! Lost ${resourcesLost.wood} wood and ${resourcesLost.food} food.`, 'warning');
        }
        
        GameState.village.lastAttack = GameState.time;
    },
    
    // Random visitor event
    checkVisitor() {
        if (GameState.population >= GameState.maxPopulation) return;
        
        let visitorChance = 0.002;
        
        // Tavern bonus
        if (GameState.village.buildings.tavern > 0) {
            visitorChance += 0.005;
        }
        
        // Happiness bonus
        if (GameState.village.happiness > 70) {
            visitorChance += 0.003;
        }
        
        if (Math.random() < visitorChance) {
            this.villagerArrives();
        }
    }
};

// ============================================
// TRADING ECONOMY SYSTEM
// ============================================
const Trading = {
    // Trade rates (buy/sell)
    rates: {
        wood: { buy: 1, sell: 0.5 },
        food: { buy: 2, sell: 1 },
        hide: { buy: 3, sell: 1.5 },
        cloth: { buy: 4, sell: 2 },
        iron: { buy: 5, sell: 2.5 },
        coal: { buy: 4, sell: 2 },
        steel: { buy: 10, sell: 5 }
    },
    
    // Currency
    currency: {
        coins: 0,
        gems: 0
    },
    
    // Merchant inventory
    merchantInventory: {},
    
    // Generate merchant inventory
    generateMerchantInventory() {
        this.merchantInventory = {};
        
        const items = ['wood', 'food', 'hide', 'cloth', 'iron', 'coal', 'steel'];
        const numItems = Utils.random(3, 6);
        
        for (let i = 0; i < numItems; i++) {
            const item = Utils.randomChoice(items);
            const amount = Utils.random(5, 30);
            this.merchantInventory[item] = (this.merchantInventory[item] || 0) + amount;
        }
    },
    
    // Buy from merchant
    buy(resource, amount) {
        if (!this.merchantInventory[resource] || this.merchantInventory[resource] < amount) {
            UI.addNarrative('The merchant doesn\'t have that much to sell.');
            return false;
        }
        
        const cost = Math.ceil(this.rates[resource].buy * amount);
        if (this.currency.coins < cost) {
            UI.addNarrative(`You need ${cost} coins to buy ${amount} ${resource}.`);
            return false;
        }
        
        this.currency.coins -= cost;
        this.merchantInventory[resource] -= amount;
        GameState.resources[resource] += amount;
        Utils.revealResource(resource);
        
        UI.addNarrative(`Bought ${amount} ${resource} for ${cost} coins.`);
        UI.updateTrading();
        return true;
    },
    
    // Sell to merchant
    sell(resource, amount) {
        if (GameState.resources[resource] < amount) {
            UI.addNarrative(`You don't have ${amount} ${resource} to sell.`);
            return false;
        }
        
        const payment = Math.floor(this.rates[resource].sell * amount);
        GameState.resources[resource] -= amount;
        this.currency.coins += payment;
        
        UI.addNarrative(`Sold ${amount} ${resource} for ${payment} coins.`);
        UI.updateTrading();
        return true;
    },
    
    // Check if merchant visits
    checkMerchantVisit() {
        if (!GameState.village.buildings.market) return;
        
        const visitChance = 0.002;
        
        if (Math.random() < visitChance) {
            this.merchantArrives();
        }
    },
    
    // Merchant arrives
    merchantArrives() {
        this.generateMerchantInventory();
        GameState.unlocks.merchant = true;
        UI.addNarrative('A merchant has arrived at the market!', 'success');
        UI.showTradingPanel();
        UI.updateTrading();
    },
    
    // Get trade amount options
    getTradeOptions(maxAmount) {
        const options = [];
        let amount = 1;
        while (amount <= maxAmount) {
            options.push(amount);
            amount *= 2;
            if (amount > 10 && amount < 50) amount = 10;
            if (amount > 50) amount = Math.min(amount, maxAmount);
        }
        return [...new Set(options)].sort((a, b) => a - b);
    }
};

// ============================================
// STORY SYSTEM
// ============================================
// The story of Kaldervale: a cartographer, separated from their expedition
// in a blizzard, shelters in an abandoned cabin in a valley that has been
// locked in winter for forty years. Beats unlock as the settlement grows;
// journal pages left by the last mapper of the valley are found along the way.
const Story = {
    // Pages from the journal of Ilsa Marrow, who mapped the valley forty years ago
    journalPages: [
        { id: 'p1', title: 'Day 1',
          text: 'The pass closed behind us in a single night. The guides say it is early for snow. It is the first week of summer.' },
        { id: 'p2', title: 'Day 19',
          text: 'I built a forge under the floor to mend our sledges. The others have stopped talking about going home. I keep mapping. Someone should know what this place looks like.' },
        { id: 'p3', title: 'Day 40',
          text: 'Ruins in the north: a town older than any record I carry. Every door faces east, toward the glass caves. Every door was barred from the inside.' },
        { id: 'p4', title: 'Day 52',
          text: 'The cold does not come on the wind. It comes ahead of it, from the east. Lars went to look and came back with frost in his lungs. He said the cold was breathing.' },
        { id: 'p5', title: 'Day 61',
          text: 'A wyrm, white as old ice, coiled on a bed of black glass. While it sleeps, the valley stays frozen. Iron cracks against its hide. It will take steel.' },
        { id: 'p6', title: 'The last page',
          text: 'I am leaving my map above the hearth for whoever comes next. Keep the fire lit. Make this place a home. Then go east, and finish what I could not.' }
    ],

    // Milestones: shown once, in order of when their condition first becomes true
    beats: [
        {
            id: 'first_light',
            when: () => GameState.hearthState !== 'cold',
            lines: [
                'Pinned above the hearth is a hand-drawn map of a valley. Across the top, in careful ink: KALDERVALE.',
                'Under the name, a single line: "If you are reading this, keep the fire lit."'
            ]
        },
        {
            id: 'first_wood',
            when: () => GameState.resources.wood >= 15,
            lines: [
                'Your own footprints lead from the treeline to the door, already half filled with snow. There are no others.',
                'The expedition did not follow you. Nobody is coming.'
            ]
        },
        {
            id: 'first_snare',
            when: () => GameState.buildings.snare > 0,
            lines: ['While setting the snare you find a tin box frozen into the roots of a pine. Inside is a bundle of journal pages, signed I. Marrow.'],
            page: 'p1'
        },
        {
            id: 'first_villager',
            when: () => GameState.population >= 1,
            lines: [
                'A woman in a torn caravan coat stumbles out of the snow toward your smoke. Her name is Brenna. Her wagon went into a ravine three days ago.',
                '"Nobody leaves Kaldervale in winter," she says, holding her hands to the hearth. "And it is always winter here."'
            ]
        },
        {
            id: 'settlement',
            when: () => GameState.unlocks.village,
            lines: ['Smoke rises from more than one chimney now. Lost hunters and stranded traders keep finding their way to your light.']
        },
        {
            id: 'forge',
            when: () => GameState.buildings.forge > 0,
            lines: ['Digging the forge pit, you hit an older one. Its anvil is stamped with a compass rose: the same mark drawn on the map above your hearth.'],
            page: 'p2'
        },
        {
            id: 'map_unlocked',
            when: () => GameState.unlocks.map,
            lines: [
                'By lantern light you study the old map properly for the first time.',
                'Ilsa Marrow marked four ruins in the north, caves of black glass in the east, and one spot at the far eastern edge she labelled only "the nest".'
            ]
        },
        {
            id: 'smelter',
            when: () => GameState.buildings.smelter > 0,
            lines: ['Brenna watches the smelter glow. "Steel won\'t keep the cold out," she says. "But it might cut out whatever is bringing it."']
        },
        {
            id: 'first_hearth_out',
            when: () => GameState.unlocks.forest && GameState.hearthState === 'cold',
            lines: ['As the hearth goes cold, frost creeps across the window in long, thin lines, like fingers feeling for a way in.'],
            type: 'warning'
        }
    ],

    check() {
        // The map unlocks once you have a lantern to explore with (older saves included)
        if (!GameState.unlocks.map && GameState.items.lantern > 0) {
            WorldMap.unlock();
        }

        for (const beat of this.beats) {
            if (GameState.story.seen.includes(beat.id)) continue;
            if (!beat.when()) continue;

            GameState.story.seen.push(beat.id);
            beat.lines.forEach((line, i) => {
                setTimeout(() => UI.addNarrative(line, beat.type || 'story'), i * 1500);
            });
            if (beat.page) {
                setTimeout(() => this.findPage(beat.page), beat.lines.length * 1500);
            }
            break; // one beat at a time, so they don't pile up
        }
    },

    findPage(pageId) {
        if (GameState.story.journal.includes(pageId)) return;
        const page = this.journalPages.find(p => p.id === pageId);
        if (!page) return;

        GameState.story.journal.push(pageId);
        UI.addNarrative(`Journal page found: "${page.title}". ${page.text}`, 'journal');
        UI.notify('A journal page was added to your Journal.');
        UI.updateJournal();
    },

    // Each ruin holds a page of the journal (pages 3-6, in order) and some salvage
    searchRuins(key) {
        GameState.story.ruinsSearched = GameState.story.ruinsSearched || [];
        if (GameState.story.ruinsSearched.includes(key)) {
            UI.addNarrative('You have already searched these ruins. Snow is filling your old tracks.');
            return;
        }
        GameState.story.ruinsSearched.push(key);

        UI.addNarrative('Broken walls stick out of the drifts. Every doorway faces east.');
        const cloth = Utils.random(2, 5), iron = Utils.random(1, 3);
        GameState.resources.cloth += cloth;
        GameState.resources.iron += iron;
        Utils.revealResource('cloth');
        Utils.revealResource('iron');
        UI.addNarrative(`You salvage ${cloth} cloth and ${iron} iron from the ruins.`);

        const nextPage = ['p3', 'p4', 'p5', 'p6'].find(id => !GameState.story.journal.includes(id));
        if (nextPage) this.findPage(nextPage);
        UI.updateResources();
    },

    // The final confrontation
    enterNest() {
        if (GameState.story.ended) {
            UI.addNarrative('Meltwater runs over the black glass where the Rimewyrm once slept.');
            return;
        }
        UI.addNarrative('The air turns to needles. On a bed of black glass lies a coiled shape, white as old ice. It opens one eye.', 'warning');

        if (GameState.items.steelSabre <= 0) {
            UI.addNarrative('Your iron would shatter against that hide. You back away before it fully wakes. You need steel.', 'warning');
            GameState.player.mapPosition.x -= 1;
            WorldMap.render();
            return;
        }

        setTimeout(() => Combat.start('rimewyrm'), 1200);
    },

    ending() {
        if (GameState.story.ended) return;
        GameState.story.ended = true;

        const lines = [
            'The Rimewyrm shudders and goes still. The cold drains out of the wind.',
            'Back at the cabin, water drips from the eaves for the first time in forty years.',
            'By morning the southern pass is open. Some of the settlers leave. Most of them stay.',
            'Above the hearth, under Ilsa Marrow\'s careful ink, you add one more line: "Kaldervale. Inhabited."',
            'THE END. Thank you for playing Embers of Kaldervale. (You can keep playing.)'
        ];
        lines.forEach((line, i) => setTimeout(() => UI.addNarrative(line, 'story'), 1000 + i * 2000));
        setTimeout(() => {
            Weather.forceWeather('clear');
            SaveSystem.save(true);
        }, 1000 + lines.length * 2000);
    }
};

// ============================================
// GAME LOOP
// ============================================
const Game = {
    init() {
        // Initialize UI
        UI.init();
        
        // Try to load save
        const loaded = SaveSystem.load();
        
        // Initialize systems
        Hearth.init();
        WorldMap.init();
        
        // Initialize weather display
        UI.updateWeather();
        
        // Show intro if new game
        if (!loaded) {
            Narratives.intro.forEach((text, i) => {
                setTimeout(() => UI.addNarrative(text), i * 1000);
            });
        }
        
        // Reveal resources that are already unlocked
        if (GameState.resources.hide > 0) Utils.revealResource('hide');
        if (GameState.resources.cloth > 0) Utils.revealResource('cloth');
        if (GameState.resources.iron > 0) Utils.revealResource('iron');
        if (GameState.resources.coal > 0) Utils.revealResource('coal');
        if (GameState.resources.steel > 0) Utils.revealResource('steel');

        // Restore unlocked UI from a save
        if (GameState.unlocks.map) UI.elements.mapBtn.classList.remove('hidden');
        Village.updatePopulation();
        Village.checkVillageUnlock(); // older saves could have 2+ villagers without the village unlocked
        UI.updateJournal();

        // Update UI
        UI.updateAll();
        
        // Start game loop
        this.startLoop();
        
        // Auto-save every 30 seconds
        setInterval(() => {
            if (GameState.settings.autoSave) {
                SaveSystem.save(true);
            }
        }, 30000);

        // Save when the tab is hidden or closed, so up to 30s of progress isn't lost
        const saveOnLeave = () => {
            if (GameState.settings.autoSave && !SaveSystem.resetting) SaveSystem.save(true);
        };
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') saveOnLeave();
        });
        window.addEventListener('pagehide', saveOnLeave);
    },
    
    startLoop() {
        this.gameLoop = setInterval(() => {
            // Update time
            Time.update();
            
            // Update weather
            Weather.update();
            
            // Update hearth
            Hearth.update();
            
            // Process village workers (gathering, production)
            Village.processWorkers();
            
            // Check for village events (visitors, raids)
            Village.checkVisitor();
            Village.checkRaid();
            
            // Update village happiness periodically
            if (GameState.time % 100 === 0) {
                Village.updateHappiness();
            }
            
            // Check random events
            Events.check();

            // Story beats and slow healing by the hearth (once per second)
            if (GameState.time % 10 === 0) {
                Story.check();
                const p = GameState.player;
                if (!GameState.combat.active && GameState.hearthState !== 'cold' && p.health < p.maxHealth) {
                    p.health = Math.min(p.maxHealth, p.health + 1);
                }
            }
            
            // Update resources display (every tick for smooth numbers)
            UI.updateResources();
            
            // Note: Actions only update when state changes (handled by updateActions check)
            // Population and village update when state changes
            
            GameState.time++;
        }, Config.tickRate);
    },
    
    stop() {
        if (this.gameLoop) {
            clearInterval(this.gameLoop);
        }
    }
};

// ============================================
// START GAME
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    Game.init();
});
