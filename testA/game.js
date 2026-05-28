/**
 * Multiplayer Horror Narrative Game
 * Main JavaScript Entry Point
 * 
 * This file contains the core game architecture and initialization logic
 * for the browser-based multiplayer horror game.
 */

// ============================================
// GAME CONFIGURATION
// ============================================
const GameConfig = {
    // Player settings
    MAX_PLAYERS: 50,
    P2P_THRESHOLD: 10,  // Switch to Node.js server above this count
    NPC_COUNT_PER_SCENE: 10,
    
    // Network settings
    NETWORK: {
        MODE_P2P: 'p2p',
        MODE_SERVER: 'server',
        PEERJS_CONFIG: {
            debug: 2,
            config: {
                iceServers: [
                    { url: 'stun:stun.l.google.com:19302' },
                    { url: 'stun:stun.services.mozilla.com' }
                ]
            }
        },
        SOCKET_IO_URL: 'ws://localhost:3000'
    },
    
    // Timer settings (in seconds)
    TIMERS: {
        BUS_DEPARTURE: 60,
        RESEARCHER_PREP: 10,
        JUNGLE_ESCAPE: 180,  // 3 minutes
        SHIP_DEFENSE: 180    // 3 minutes
    },
    
    // Vehicle settings
    VEHICLES: {
        BUS_COUNT_CH1: 3,
        TRUCK_COUNT_CH2: 5,
        POLICE_VEHICLE_COUNT: 5,
        SPEED_LIMITS: {
            bus: 50,
            truck: 40,
            policeCar: 60
        }
    },
    
    // Chapter configuration
    CHAPTERS: {
        SURVIVORS: 1,
        INVESTIGATION: 2,
        CLIMAX: 3
    },
    
    // Roles
    ROLES: {
        SURVIVOR: 'survivor',
        RESEARCHER: 'researcher',
        POLICE: 'police'
    }
};

// ============================================
// GAME STATE MANAGEMENT
// ============================================
class GameState {
    constructor() {
        this.currentChapter = 1;
        this.currentScene = 1;
        this.players = new Map();
        this.npcs = [];
        this.items = [];
        this.vehicles = [];
        this.localPlayer = null;
        this.networkMode = GameConfig.NETWORK.MODE_P2P;
        this.isHost = false;
        this.spectators = [];
    }
    
    addPlayer(playerId, playerData) {
        this.players.set(playerId, {
            id: playerId,
            role: playerData.role,
            position: playerData.position || { x: 0, y: 0, z: 0 },
            health: 100,
            inventory: [],
            isAlive: true,
            vehicleId: null
        });
    }
    
    removePlayer(playerId) {
        this.players.delete(playerId);
    }
    
    getPlayer(playerId) {
        return this.players.get(playerId);
    }
    
    setLocalPlayer(playerId) {
        this.localPlayer = playerId;
    }
    
    updatePlayerPosition(playerId, position) {
        const player = this.players.get(playerId);
        if (player) {
            player.position = position;
        }
    }
    
    playerDie(playerId) {
        const player = this.players.get(playerId);
        if (player) {
            player.isAlive = false;
            player.health = 0;
            // Convert to spectator or ghost NPC
            this.convertToSpectator(playerId);
        }
    }
    
    convertToSpectator(playerId) {
        const player = this.players.get(playerId);
        if (player && !this.spectators.includes(playerId)) {
            this.spectators.push(playerId);
            console.log(`Player ${playerId} is now a spectator`);
        }
    }
    
    advanceChapter() {
        this.currentChapter++;
        this.currentScene = 1;
        console.log(`Advanced to Chapter ${this.currentChapter}`);
    }
    
    advanceScene() {
        this.currentScene++;
        console.log(`Advanced to Scene ${this.currentScene}`);
    }
}

// ============================================
// NETWORK MANAGER
// ============================================
class NetworkManager {
    constructor(gameState) {
        this.gameState = gameState;
        this.peer = null;
        this.connections = [];
        this.socket = null;
        this.mode = GameConfig.NETWORK.MODE_P2P;
    }
    
    async initialize(isHost) {
        this.gameState.isHost = isHost;
        
        // Check player count to determine network mode
        if (this.gameState.players.size > GameConfig.P2P_THRESHOLD) {
            this.mode = GameConfig.NETWORK.MODE_SERVER;
            return this.initializeServerMode();
        } else {
            this.mode = GameConfig.NETWORK.MODE_P2P;
            return this.initializeP2PMode(isHost);
        }
    }
    
    async initializeP2PMode(isHost) {
        console.log('Initializing P2P mode with Peer.js');
        
        return new Promise((resolve, reject) => {
            // Dynamically load Peer.js
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/peerjs@1.4.7/dist/peerjs.min.js';
            script.onload = () => {
                try {
                    if (isHost) {
                        this.peer = new Peer();
                        this.peer.on('open', (id) => {
                            console.log('My peer ID is: ' + id);
                            this.gameState.setLocalPlayer(id);
                            resolve(id);
                        });
                        
                        this.peer.on('connection', (conn) => {
                            this.handleConnection(conn);
                        });
                    } else {
                        // Client connects to host
                        const hostId = prompt('Enter host peer ID:');
                        if (hostId) {
                            this.peer = new Peer();
                            this.peer.on('open', () => {
                                const conn = this.peer.connect(hostId);
                                this.handleConnection(conn);
                                this.gameState.setLocalPlayer(this.peer.id);
                                resolve(this.peer.id);
                            });
                        }
                    }
                } catch (error) {
                    reject(error);
                }
            };
            script.onerror = () => reject(new Error('Failed to load Peer.js'));
            document.head.appendChild(script);
        });
    }
    
    async initializeServerMode() {
        console.log('Initializing Server mode with Socket.io');
        
        return new Promise((resolve, reject) => {
            // Dynamically load Socket.io
            const script = document.createElement('script');
            script.src = 'https://cdn.socket.io/4.5.4/socket.io.min.js';
            script.onload = () => {
                try {
                    this.socket = io(GameConfig.NETWORK.SOCKET_IO_URL);
                    
                    this.socket.on('connect', () => {
                        console.log('Connected to server:', this.socket.id);
                        this.gameState.setLocalPlayer(this.socket.id);
                        resolve(this.socket.id);
                    });
                    
                    this.socket.on('player-joined', (data) => {
                        this.gameState.addPlayer(data.playerId, data.playerData);
                        this.broadcastGameState();
                    });
                    
                    this.socket.on('player-left', (playerId) => {
                        this.gameState.removePlayer(playerId);
                    });
                    
                    this.socket.on('game-state-update', (state) => {
                        this.updateGameState(state);
                    });
                    
                    this.socket.on('player-died', (playerId) => {
                        this.gameState.playerDie(playerId);
                    });
                } catch (error) {
                    reject(error);
                }
            };
            script.onerror = () => reject(new Error('Failed to load Socket.io'));
            document.head.appendChild(script);
        });
    }
    
    handleConnection(conn) {
        this.connections.push(conn);
        
        conn.on('open', () => {
            console.log('Connected to: ' + conn.peer);
            this.gameState.addPlayer(conn.peer, { role: 'survivor' });
        });
        
        conn.on('data', (data) => {
            this.handleData(data, conn);
        });
        
        conn.on('close', () => {
            console.log('Connection closed: ' + conn.peer);
            this.connections = this.connections.filter(c => c !== conn);
            this.gameState.removePlayer(conn.peer);
        });
    }
    
    handleData(data, conn) {
        switch (data.type) {
            case 'PLAYER_POSITION':
                this.gameState.updatePlayerPosition(data.playerId, data.position);
                break;
            case 'PLAYER_ACTION':
                this.handlePlayerAction(data.action, conn.peer);
                break;
            case 'CHAT_MESSAGE':
                this.displayChatMessage(data.message, data.playerId);
                break;
        }
        
        // Broadcast to other peers if host
        if (this.gameState.isHost) {
            this.connections.forEach(connection => {
                if (connection !== conn) {
                    connection.send(data);
                }
            });
        }
    }
    
    handlePlayerAction(action, playerId) {
        console.log(`Player ${playerId} performed action:`, action);
        
        if (action.type === 'INTERACT') {
            // Handle interaction logic
        } else if (action.type === 'PICKUP_ITEM') {
            // Handle item pickup
        } else if (action.type === 'ENTER_VEHICLE') {
            this.handleVehicleEntry(playerId, action.vehicleId);
        }
    }
    
    handleVehicleEntry(playerId, vehicleId) {
        const player = this.gameState.getPlayer(playerId);
        const vehicle = this.gameState.vehicles.find(v => v.id === vehicleId);
        
        if (player && vehicle) {
            player.vehicleId = vehicleId;
            // Parent player to vehicle's local coordinate space
            console.log(`Player ${playerId} entered vehicle ${vehicleId}`);
        }
    }
    
    broadcastGameState() {
        const state = {
            players: Array.from(this.gameState.players.values()),
            chapter: this.gameState.currentChapter,
            scene: this.gameState.currentScene
        };
        
        if (this.mode === GameConfig.NETWORK.MODE_P2P) {
            this.connections.forEach(conn => {
                conn.send({ type: 'GAME_STATE', state: state });
            });
        } else if (this.socket) {
            this.socket.emit('game-state-update', state);
        }
    }
    
    sendPlayerPosition(position) {
        const data = {
            type: 'PLAYER_POSITION',
            playerId: this.gameState.localPlayer,
            position: position
        };
        
        if (this.mode === GameConfig.NETWORK.MODE_P2P) {
            this.connections.forEach(conn => {
                conn.send(data);
            });
        } else if (this.socket) {
            this.socket.emit('player-position', data);
        }
    }
    
    disconnect() {
        if (this.peer) {
            this.peer.destroy();
        }
        if (this.socket) {
            this.socket.disconnect();
        }
        this.connections = [];
    }
}

// ============================================
// INVENTORY SYSTEM
// ============================================
class InventorySystem {
    constructor(gridSize = { width: 8, height: 4 }) {
        this.gridSize = gridSize;
        this.grid = this.createEmptyGrid();
        this.equippedBag = null;
        this.bonusGrid = null;
    }
    
    createEmptyGrid() {
        const grid = [];
        for (let y = 0; y < this.gridSize.height; y++) {
            grid[y] = [];
            for (let x = 0; x < this.gridSize.width; x++) {
                grid[y][x] = null;
            }
        }
        return grid;
    }
    
    addItem(item, x, y) {
        if (this.isValidPosition(x, y) && this.isSlotEmpty(x, y)) {
            this.grid[y][x] = item;
            return true;
        }
        return false;
    }
    
    removeItem(x, y) {
        if (this.isValidPosition(x, y)) {
            const item = this.grid[y][x];
            this.grid[y][x] = null;
            return item;
        }
        return null;
    }
    
    moveItem(fromX, fromY, toX, toY) {
        if (!this.isValidPosition(fromX, fromY) || !this.isValidPosition(toX, toY)) {
            return false;
        }
        
        const item = this.grid[fromY][fromX];
        if (!item) return false;
        
        // Check if destination is empty or can stack
        if (this.isSlotEmpty(toX, toY)) {
            this.grid[toY][toX] = item;
            this.grid[fromY][fromX] = null;
            return true;
        }
        
        return false;
    }
    
    isValidPosition(x, y) {
        return x >= 0 && x < this.gridSize.width && 
               y >= 0 && y < this.gridSize.height;
    }
    
    isSlotEmpty(x, y) {
        return this.grid[y][x] === null;
    }
    
    equipBag(bag) {
        if (!this.equippedBag) {
            this.equippedBag = bag;
            this.bonusGrid = this.createEmptyGrid();
            return true;
        }
        return false;
    }
    
    unequipBag() {
        const bag = this.equippedBag;
        this.equippedBag = null;
        this.bonusGrid = null;
        return bag;
    }
    
    getTotalSlots() {
        let total = this.gridSize.width * this.gridSize.height;
        if (this.bonusGrid) {
            total += this.gridSize.width * this.gridSize.height;
        }
        return total;
    }
    
    getOccupiedSlots() {
        let occupied = 0;
        for (let y = 0; y < this.gridSize.height; y++) {
            for (let x = 0; x < this.gridSize.width; x++) {
                if (this.grid[y][x]) occupied++;
            }
        }
        if (this.bonusGrid) {
            for (let y = 0; y < this.gridSize.height; y++) {
                for (let x = 0; x < this.gridSize.width; x++) {
                    if (this.bonusGrid[y][x]) occupied++;
                }
            }
        }
        return occupied;
    }
}

// ============================================
// VEHICLE SYSTEM
// ============================================
class VehicleSystem {
    constructor() {
        this.vehicles = [];
        this.seatPositions = new Map();
    }
    
    createVehicle(id, type, capacity, boundingBox) {
        const vehicle = {
            id: id,
            type: type,
            capacity: capacity,
            boundingBox: boundingBox,
            position: { x: 0, y: 0, z: 0 },
            rotation: 0,
            speed: 0,
            driver: null,
            passengers: [],
            health: 100
        };
        
        this.vehicles.push(vehicle);
        this.initializeSeats(vehicle);
        return vehicle;
    }
    
    initializeSeats(vehicle) {
        const seats = [];
        for (let i = 0; i < vehicle.capacity; i++) {
            seats.push({
                index: i,
                occupied: false,
                playerId: null,
                localPosition: this.calculateSeatPosition(vehicle, i)
            });
        }
        this.seatPositions.set(vehicle.id, seats);
    }
    
    calculateSeatPosition(vehicle, seatIndex) {
        // Calculate seat positions relative to vehicle center
        // This ensures players move with the vehicle
        const row = Math.floor(seatIndex / 2);
        const col = seatIndex % 2;
        
        return {
            x: (col - 0.5) * 1.5,  // Left or right side
            y: 0.5,                 // Seat height
            z: -row * 1.2          // Rows from front to back
        };
    }
    
    enterVehicle(playerId, vehicleId, seatIndex) {
        const vehicle = this.vehicles.find(v => v.id === vehicleId);
        const seats = this.seatPositions.get(vehicleId);
        
        if (!vehicle || !seats || !seats[seatIndex]) {
            return false;
        }
        
        const seat = seats[seatIndex];
        if (seat.occupied) {
            return false;
        }
        
        seat.occupied = true;
        seat.playerId = playerId;
        
        if (seatIndex === 0) {
            vehicle.driver = playerId;
        } else {
            vehicle.passengers.push(playerId);
        }
        
        // Update player state
        const player = gameState.getPlayer(playerId);
        if (player) {
            player.vehicleId = vehicleId;
            // Player position is now relative to vehicle
            player.localPosition = seat.localPosition;
        }
        
        return true;
    }
    
    exitVehicle(playerId, vehicleId) {
        const vehicle = this.vehicles.find(v => v.id === vehicleId);
        const seats = this.seatPositions.get(vehicleId);
        
        if (!vehicle || !seats) {
            return false;
        }
        
        // Find and vacate the seat
        for (let i = 0; i < seats.length; i++) {
            if (seats[i].playerId === playerId) {
                seats[i].occupied = false;
                seats[i].playerId = null;
                
                if (i === 0) {
                    vehicle.driver = null;
                } else {
                    vehicle.passengers = vehicle.passengers.filter(p => p !== playerId);
                }
                
                break;
            }
        }
        
        // Update player state
        const player = gameState.getPlayer(playerId);
        if (player) {
            player.vehicleId = null;
            player.localPosition = null;
        }
        
        return true;
    }
    
    updateVehiclePosition(vehicleId, newPosition, newRotation) {
        const vehicle = this.vehicles.find(v => v.id === vehicleId);
        if (!vehicle) return;
        
        const oldPosition = { ...vehicle.position };
        vehicle.position = newPosition;
        vehicle.rotation = newRotation;
        
        // Update all passengers' world positions
        const seats = this.seatPositions.get(vehicleId);
        if (seats) {
            seats.forEach(seat => {
                if (seat.occupied && seat.playerId) {
                    const player = gameState.getPlayer(seat.playerId);
                    if (player) {
                        // Transform local position to world position
                        player.position = this.transformLocalToWorld(
                            seat.localPosition,
                            oldPosition,
                            newPosition,
                            vehicle.rotation
                        );
                    }
                }
            });
        }
    }
    
    transformLocalToWorld(localPos, oldWorldPos, newWorldPos, rotation) {
        // Simple transformation (can be enhanced with proper matrix math)
        const deltaX = newWorldPos.x - oldWorldPos.x;
        const deltaZ = newWorldPos.z - oldWorldPos.z;
        
        return {
            x: localPos.x + newWorldPos.x,
            y: localPos.y + newWorldPos.y,
            z: localPos.z + newWorldPos.z
        };
    }
    
    damageVehicle(vehicleId, amount) {
        const vehicle = this.vehicles.find(v => v.id === vehicleId);
        if (vehicle) {
            vehicle.health -= amount;
            if (vehicle.health <= 0) {
                this.destroyVehicle(vehicleId);
                return true; // Vehicle destroyed
            }
        }
        return false;
    }
    
    destroyVehicle(vehicleId) {
        const index = this.vehicles.findIndex(v => v.id === vehicleId);
        if (index !== -1) {
            // Force all passengers to exit
            const seats = this.seatPositions.get(vehicleId);
            if (seats) {
                seats.forEach(seat => {
                    if (seat.occupied && seat.playerId) {
                        this.exitVehicle(seat.playerId, vehicleId);
                    }
                });
            }
            
            this.vehicles.splice(index, 1);
            this.seatPositions.delete(vehicleId);
        }
    }
}

// ============================================
// NPC SYSTEM (Fake AI)
// ============================================
class NPCSystem {
    constructor() {
        this.npcs = [];
        this.behaviorTrees = new Map();
    }
    
    spawnNPC(id, type, position, behavior) {
        const npc = {
            id: id,
            type: type,
            position: position,
            behavior: behavior,
            state: 'idle',
            target: null,
            animationFrame: 0
        };
        
        this.npcs.push(npc);
        this.createBehaviorTree(npc);
        return npc;
    }
    
    createBehaviorTree(npc) {
        // Simple behavior tree implementation
        const tree = {
            root: this.createSequence([
                this.createCondition(() => npc.state !== 'dead'),
                this.createSelector([
                    this.createPriority('combat', () => this.checkThreat(npc)),
                    this.createPriority('patrol', () => this.patrol(npc)),
                    this.createPriority('idle', () => this.idle(npc))
                ])
            ])
        };
        
        this.behaviorTrees.set(npc.id, tree);
    }
    
    createSequence(children) {
        return { type: 'sequence', children };
    }
    
    createSelector(children) {
        return { type: 'selector', children };
    }
    
    createPriority(name, action) {
        return { type: 'priority', name, action };
    }
    
    createCondition(predicate) {
        return { type: 'condition', predicate };
    }
    
    updateNPCs(deltaTime) {
        this.npcs.forEach(npc => {
            const tree = this.behaviorTrees.get(npc.id);
            if (tree) {
                this.executeBehaviorTree(tree, npc, deltaTime);
            }
        });
    }
    
    executeBehaviorTree(node, npc, deltaTime) {
        switch (node.type) {
            case 'sequence':
                for (let child of node.children) {
                    if (!this.executeBehaviorTree(child, npc, deltaTime)) {
                        return false;
                    }
                }
                return true;
                
            case 'selector':
                for (let child of node.children) {
                    if (this.executeBehaviorTree(child, npc, deltaTime)) {
                        return true;
                    }
                }
                return false;
                
            case 'condition':
                return node.predicate();
                
            case 'priority':
                if (node.action()) {
                    return true;
                }
                return false;
        }
    }
    
    checkThreat(npc) {
        // Check for nearby players
        return false;
    }
    
    patrol(npc) {
        // Move along patrol path
        npc.state = 'patrolling';
        return true;
    }
    
    idle(npc) {
        // Stand still or perform idle animation
        npc.state = 'idle';
        return true;
    }
    
    spawnSceneNPCs(sceneId, count) {
        // Spawn NPCs for current scene
        for (let i = 0; i < count; i++) {
            this.spawnNPC(
                `npc_${sceneId}_${i}`,
                'civilian',
                { x: Math.random() * 100, y: 0, z: Math.random() * 100 },
                'patrol'
            );
        }
    }
}

// ============================================
// TIMER SYSTEM
// ============================================
class TimerSystem {
    constructor() {
        this.timers = new Map();
        this.callbacks = new Map();
    }
    
    startTimer(name, duration, onComplete, onTick = null) {
        this.stopTimer(name);
        
        const timer = {
            name: name,
            startTime: Date.now(),
            duration: duration * 1000, // Convert to milliseconds
            remaining: duration * 1000,
            paused: false
        };
        
        this.timers.set(name, timer);
        this.callbacks.set(name, { onComplete, onTick });
        
        return timer;
    }
    
    stopTimer(name) {
        this.timers.delete(name);
        this.callbacks.delete(name);
    }
    
    pauseTimer(name) {
        const timer = this.timers.get(name);
        if (timer && !timer.paused) {
            timer.remaining -= Date.now() - timer.startTime;
            timer.paused = true;
        }
    }
    
    resumeTimer(name) {
        const timer = this.timers.get(name);
        if (timer && timer.paused) {
            timer.startTime = Date.now();
            timer.paused = false;
        }
    }
    
    update() {
        const now = Date.now();
        
        for (let [name, timer] of this.timers) {
            if (timer.paused) continue;
            
            timer.remaining = timer.duration - (now - timer.startTime);
            
            const callback = this.callbacks.get(name);
            if (callback && callback.onTick) {
                callback.onTick(timer.remaining / 1000);
            }
            
            if (timer.remaining <= 0) {
                this.stopTimer(name);
                if (callback && callback.onComplete) {
                    callback.onComplete();
                }
            }
        }
    }
    
    getRemainingTime(name) {
        const timer = this.timers.get(name);
        if (timer) {
            return timer.remaining / 1000;
        }
        return 0;
    }
}

// ============================================
// MAIN GAME CLASS
// ============================================
class HorrorGame {
    constructor() {
        this.gameState = new GameState();
        this.networkManager = new NetworkManager(this.gameState);
        this.inventorySystem = new InventorySystem();
        this.vehicleSystem = new VehicleSystem();
        this.npcSystem = new NPCSystem();
        this.timerSystem = new TimerSystem();
        this.isRunning = false;
        this.lastFrameTime = 0;
    }
    
    async initialize(isHost = true) {
        console.log('🎮 Initializing Horror Game...');
        
        try {
            await this.networkManager.initialize(isHost);
            console.log('✅ Network initialized');
            
            this.setupInputHandlers();
            this.setupScene();
            
            this.isRunning = true;
            this.lastFrameTime = performance.now();
            this.gameLoop();
            
            console.log('✅ Game initialized successfully!');
        } catch (error) {
            console.error('❌ Initialization failed:', error);
        }
    }
    
    setupInputHandlers() {
        // Right-click interaction
        document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.handleInteraction();
        });
        
        // Keyboard input
        document.addEventListener('keydown', (e) => {
            this.handleKeyDown(e);
        });
        
        // Mouse movement
        document.addEventListener('mousemove', (e) => {
            this.handleMouseMove(e);
        });
    }
    
    handleInteraction() {
        console.log('Interaction triggered');
        // Raycast to find interactable objects
        // Pick up items, enter vehicles, etc.
    }
    
    handleKeyDown(e) {
        switch (e.key.toLowerCase()) {
            case 'e':
                this.handleInteraction();
                break;
            case 'i':
                this.toggleInventory();
                break;
            case 'escape':
                this.toggleMenu();
                break;
        }
    }
    
    handleMouseMove(e) {
        // Handle camera rotation
        if (this.isRunning) {
            // Update camera based on mouse movement
        }
    }
    
    setupScene() {
        // Initialize current chapter and scene
        const chapter = this.gameState.currentChapter;
        const scene = this.gameState.currentScene;
        
        console.log(`Setting up Chapter ${chapter}, Scene ${scene}`);
        
        // Spawn NPCs for current scene
        this.npcSystem.spawnSceneNPCs(scene, GameConfig.NPC_COUNT_PER_SCENE);
        
        // Setup scene-specific elements
        this.setupSceneElements(chapter, scene);
    }
    
    setupSceneElements(chapter, scene) {
        // Chapter 1: Survivors
        if (chapter === 1) {
            if (scene === 1) {
                // Gutenberg Departure - Create buses
                for (let i = 0; i < GameConfig.VEHICLES.BUS_COUNT_CH1; i++) {
                    this.vehicleSystem.createVehicle(
                        `bus_${i}`,
                        'bus',
                        20,
                        { width: 3, height: 4, length: 12 }
                    );
                }
                // Start departure timer
                this.timerSystem.startTimer(
                    'bus_departure',
                    GameConfig.TIMERS.BUS_DEPARTURE,
                    () => this.departBus(),
                    (remaining) => console.log(`Bus departs in ${Math.ceil(remaining)}s`)
                );
            }
        }
        
        // Chapter 2: Investigation
        else if (chapter === 2) {
            if (scene === 1) {
                // Researcher Prep - Create trucks
                for (let i = 0; i < GameConfig.VEHICLES.TRUCK_COUNT_CH2; i++) {
                    this.vehicleSystem.createVehicle(
                        `truck_${i}`,
                        'truck',
                        10,
                        { width: 2.5, height: 3, length: 8 }
                    );
                }
            }
        }
        
        // Chapter 3: Climax
        else if (chapter === 3) {
            if (scene === 2) {
                // Jungle Escape - Start survival timer
                this.timerSystem.startTimer(
                    'jungle_escape',
                    GameConfig.TIMERS.JUNGLE_ESCAPE,
                    () => this.endJungleEscape(),
                    (remaining) => console.log(`Escape time: ${Math.ceil(remaining)}s`)
                );
            } else if (scene === 3) {
                // Ship Defense - Start defense timer
                this.timerSystem.startTimer(
                    'ship_defense',
                    GameConfig.TIMERS.SHIP_DEFENSE,
                    () => this.endShipDefense(),
                    (remaining) => console.log(`Defense time: ${Math.ceil(remaining)}s`)
                );
            }
        }
    }
    
    departBus() {
        console.log('🚌 Bus departing!');
        // Teleport unseated players to random seats
        // Start bus movement
        this.gameState.advanceScene();
    }
    
    endJungleEscape() {
        console.log('⏰ Jungle escape time ended!');
        // Check which players escaped
        this.gameState.advanceScene();
    }
    
    endShipDefense() {
        console.log('🛡️ Ship defense complete!');
        // Transition to final scene
        this.gameState.advanceScene();
    }
    
    toggleInventory() {
        console.log('🎒 Toggling inventory UI');
        // Show/hide inventory interface
    }
    
    toggleMenu() {
        console.log('⏸️ Toggling pause menu');
        // Show/hide pause menu
    }
    
    gameLoop() {
        if (!this.isRunning) return;
        
        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastFrameTime) / 1000;
        this.lastFrameTime = currentTime;
        
        this.update(deltaTime);
        this.render();
        
        requestAnimationFrame(() => this.gameLoop());
    }
    
    update(deltaTime) {
        // Update timers
        this.timerSystem.update();
        
        // Update NPCs
        this.npcSystem.updateNPCs(deltaTime);
        
        // Update network state
        if (this.gameState.localPlayer) {
            const player = this.gameState.getPlayer(this.gameState.localPlayer);
            if (player && player.position) {
                this.networkManager.sendPlayerPosition(player.position);
            }
        }
        
        // Broadcast game state if host
        if (this.gameState.isHost) {
            this.networkManager.broadcastGameState();
        }
    }
    
    render() {
        // Render game frame
        // This would integrate with Three.js or Phaser
    }
    
    shutdown() {
        this.isRunning = false;
        this.networkManager.disconnect();
        console.log('👋 Game shutdown complete');
    }
}

// ============================================
// INITIALIZATION
// ============================================
let game = null;

window.addEventListener('load', () => {
    console.log('🎮 Multiplayer Horror Narrative Game Loading...');
    
    // Create game instance
    game = new HorrorGame();
    
    // Expose to window for debugging
    window.game = game;
    window.GameConfig = GameConfig;
    
    // Auto-start as host for testing
    // In production, show lobby creation/join UI
    game.initialize(true).then(() => {
        console.log('🎮 Game ready! Use window.game to access game instance.');
    });
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { HorrorGame, GameConfig, GameState };
}
