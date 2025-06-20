
import { MazeCellType, Direction, MazeData } from './types';
import { MAZE_ROWS, MAZE_COLS, ROBOT_CONFIGURATIONS, ROBOT_MIN_DISTANCE_FROM_PLAYER_START } from './constants'; // Assuming these are the full dimensions

interface MazeCreationResult {
    grid: MazeCellType[][];
    startPosition: { x: number; y: number };
    exitPosition: { x: number; y: number };
}

export const generateRandomMaze = (rows: number, cols: number): MazeCreationResult => {
    // Initialize grid with all walls
    const grid: MazeCellType[][] = Array(rows).fill(null).map(() => Array(cols).fill(MazeCellType.WALL));
    const stack: { x: number; y: number }[] = [];

    // Choose a random starting cell for carving, must be odd to ensure walls between cells
    const startX = Math.floor(Math.random() * Math.floor(cols / 2)) * 2 + 1;
    const startY = Math.floor(Math.random() * Math.floor(rows / 2)) * 2 + 1;

    grid[startY][startX] = MazeCellType.PATH;
    stack.push({ x: startX, y: startY });

    const gameStartPosition = { x: startX, y: startY };
    let maxDistance = 0;
    let gameExitPosition = { x: startX, y: startY };

    const directions = [
        { x: 0, y: -2, wallX: 0, wallY: -1 }, // Up
        { x: 2, y: 0, wallX: 1, wallY: 0 },  // Right
        { x: 0, y: 2, wallX: 0, wallY: 1 },  // Down
        { x: -2, y: 0, wallX: -1, wallY: 0 }  // Left
    ];

    while (stack.length > 0) {
        const current = stack[stack.length - 1]; // Peek

        // Calculate distance from actual game start for exit placement
        const distanceFromStart = Math.sqrt(Math.pow(current.x - gameStartPosition.x, 2) + Math.pow(current.y - gameStartPosition.y, 2));
        if (distanceFromStart > maxDistance) {
            maxDistance = distanceFromStart;
            gameExitPosition = { x: current.x, y: current.y };
        }

        const neighbors = [];
        // Shuffle directions for randomness
        directions.sort(() => Math.random() - 0.5);

        for (const dir of directions) {
            const nextX = current.x + dir.x;
            const nextY = current.y + dir.y;
            const wallX = current.x + dir.wallX;
            const wallY = current.y + dir.wallY;

            // Check bounds and if the next cell is a wall (unvisited)
            if (nextX > 0 && nextX < cols - 1 && nextY > 0 && nextY < rows - 1 && grid[nextY][nextX] === MazeCellType.WALL) {
                neighbors.push({ nextX, nextY, wallX, wallY });
            }
        }

        if (neighbors.length > 0) {
            const chosenNeighbor = neighbors[0]; // Pick the first (randomized)
            grid[chosenNeighbor.wallY][chosenNeighbor.wallX] = MazeCellType.PATH; // Carve wall
            grid[chosenNeighbor.nextY][chosenNeighbor.nextX] = MazeCellType.PATH; // Mark next cell as path
            stack.push({ x: chosenNeighbor.nextX, y: chosenNeighbor.nextY });
        } else {
            stack.pop(); // Backtrack
        }
    }

    // Ensure start and exit are marked on the grid
    grid[gameStartPosition.y][gameStartPosition.x] = MazeCellType.START;
    grid[gameExitPosition.y][gameExitPosition.x] = MazeCellType.EXIT;
    
    // Ensure outer border is always wall, even if generator touches it (it shouldn't with >0 <cols-1 checks)
    for (let r = 0; r < rows; r++) {
        grid[r][0] = MazeCellType.WALL;
        grid[r][cols - 1] = MazeCellType.WALL;
    }
    for (let c = 0; c < cols; c++) {
        grid[0][c] = MazeCellType.WALL;
        grid[rows - 1][c] = MazeCellType.WALL;
    }


    return { grid, startPosition: gameStartPosition, exitPosition: gameExitPosition };
};

export const populateEnemyStartPositions = (
    mazeGrid: MazeCellType[][],
    playerStartPos: { x: number; y: number },
    numEnemies: number,
    minDistance: number
): { x: number; y: number }[] => {
    const validPositions: { x: number; y: number }[] = [];
    for (let r = 1; r < MAZE_ROWS - 1; r++) {
        for (let c = 1; c < MAZE_COLS - 1; c++) {
            if (mazeGrid[r][c] === MazeCellType.PATH) {
                const distToPlayer = Math.abs(c - playerStartPos.x) + Math.abs(r - playerStartPos.y);
                if (distToPlayer >= minDistance) {
                    validPositions.push({ x: c, y: r });
                }
            }
        }
    }

    validPositions.sort(() => Math.random() - 0.5); // Shuffle
    return validPositions.slice(0, numEnemies);
};

export const generateFullMazeData = (): MazeData => {
    const { grid, startPosition, exitPosition } = generateRandomMaze(MAZE_ROWS, MAZE_COLS);
    const enemyStartPositions = populateEnemyStartPositions(grid, startPosition, ROBOT_CONFIGURATIONS.length, ROBOT_MIN_DISTANCE_FROM_PLAYER_START);
    return { grid, startPosition, exitPosition, enemyStartPositions };
};
