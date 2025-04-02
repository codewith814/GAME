// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Get canvas and context
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const messageBox = document.getElementById('messageBox');

    // Mobile controls
    const leftButton = document.getElementById('leftButton');
    const rightButton = document.getElementById('rightButton');
    const startButton = document.getElementById('startButton');

    // Detect if device is mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    // Adjust canvas size for mobile
    function resizeCanvas() {
        const container = canvas.parentElement;
        const containerWidth = container.clientWidth;
        const scale = containerWidth / 800;
        
        if (containerWidth < 800) {
            canvas.style.width = containerWidth + 'px';
            canvas.style.height = (600 * scale) + 'px';
        } else {
            canvas.style.width = '800px';
            canvas.style.height = '600px';
        }
    }

    // Call resize on load and window resize
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Game states
    const GAME_STATES = {
        INTRO: 'intro',
        PLAYING: 'playing',
        COMPLIMENT: 'compliment',
        MAZE: 'maze',
        GAME_OVER: 'game_over'
    };

    // Compliments array
    const COMPLIMENTS = [
        "Zindagi seems rukhi sukhi ...cause you're not my pookie 🥺",
        "You sweet like mithai...izazat ho toh can i hold your kalaiii 🤭",
        "Swiping is no more fun cause you are my dil ki dhadkan 💖",
        "Your smile brightens up even the darkest days! 🌟",
        "You're the most amazing friend anyone could ask for! 🎀"
    ];

    // Balloon class
    class Balloon {
        constructor() {
            this.colors = ['#FF69B4', '#9370DB', '#FFB6C1', '#FFC0CB', '#FF1493'];
            this.reset();
        }

        reset() {
            this.x = Math.random() * (canvas.width - 40) + 20;
            this.y = canvas.height + 30;
            this.speed = 2 + Math.random() * 2;
            this.size = 25 + Math.random() * 15;
            this.color = this.colors[Math.floor(Math.random() * this.colors.length)];
            this.collected = false;
        }

        update() {
            if (!this.collected) {
                this.y -= this.speed;
                if (this.y < -this.size) {
                    this.reset();
                }
            }
        }

        draw() {
            if (!this.collected) {
                // Draw balloon
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fillStyle = this.color;
                ctx.fill();
                ctx.strokeStyle = 'white';
                ctx.lineWidth = 2;
                ctx.stroke();

                // Draw string
                ctx.beginPath();
                ctx.moveTo(this.x, this.y + this.size);
                ctx.lineTo(this.x, this.y + this.size + 20);
                ctx.strokeStyle = 'white';
                ctx.stroke();
            }
        }
    }

    // Maze class for treasure hunt
    class MazeGame {
        constructor(canvas, ctx) {
            this.canvas = canvas;
            this.ctx = ctx;
            this.cellSize = 40;
            this.playerPos = { x: 1, y: 1 };
            this.treasurePos = { x: 13, y: 13 };
            this.playerRotation = 0;
            this.dancingFrame = 0;
            this.obstacles = [];
            this.hints = [
                "Koi mil gaya... treasure ka raasta! 😄",
                "Arey waah! Sahi direction mein jaa rahe ho! 🎯",
                "Thoda aur... bas thoda aur! 🌟",
                "Hot and cold khel rahe ho kya? You're getting warmer! 🔥"
            ];
            this.currentHint = "";
            this.hintTimer = 0;
            this.touchStartX = 0;
            this.touchStartY = 0;
            this.isTouching = false;
            
            // Funny obstacles with animations
            this.obstacles = [
                { x: 5, y: 5, type: 'dancing_dholak', frame: 0 },
                { x: 8, y: 3, type: 'spinning_samosa', rotation: 0 },
                { x: 3, y: 8, type: 'jumping_jalebi', height: 0 },
                { x: 10, y: 7, type: 'bouncing_balloon', scale: 1 }
            ];

            this.maze = this.generateMaze(15, 15);
            this.collectibles = this.generateCollectibles();
            
            // Mobile control elements
            this.setupMobileControls();
        }

        setupMobileControls() {
            // Add mobile control buttons for maze
            const mobileControls = document.querySelector('.mobile-controls');
            if (!mobileControls) return;

            // Clear existing controls
            mobileControls.innerHTML = '';

            // Create direction pad container
            const dpadContainer = document.createElement('div');
            dpadContainer.style.display = 'grid';
            dpadContainer.style.gridTemplateColumns = 'repeat(3, 60px)';
            dpadContainer.style.gap = '5px';
            dpadContainer.style.justifyContent = 'center';
            dpadContainer.style.marginTop = '20px';

            // Create direction buttons
            const directions = [
                { id: 'upButton', text: '↑', x: 1, y: 0 },
                { id: 'leftButton', text: '←', x: 0, y: 1 },
                { id: 'downButton', text: '↓', x: 1, y: 2 },
                { id: 'rightButton', text: '→', x: 2, y: 1 }
            ];

            // Create 9 grid cells (3x3)
            for (let i = 0; i < 9; i++) {
                const cell = document.createElement('div');
                cell.style.width = '60px';
                cell.style.height = '60px';
                
                // Find if this cell should be a button
                const direction = directions.find(d => d.x === (i % 3) && d.y === Math.floor(i / 3));
                
                if (direction) {
                    cell.className = 'control-button';
                    cell.id = direction.id;
                    cell.textContent = direction.text;
                    
                    // Add touch events
                    cell.addEventListener('touchstart', (e) => {
                        e.preventDefault();
                        this.handleDirectionButton(direction.id);
                    });
                }
                
                dpadContainer.appendChild(cell);
            }

            mobileControls.appendChild(dpadContainer);
        }

        handleDirectionButton(buttonId) {
            let dx = 0, dy = 0;
            switch(buttonId) {
                case 'leftButton': dx = -1; break;
                case 'rightButton': dx = 1; break;
                case 'upButton': dy = -1; break;
                case 'downButton': dy = 1; break;
            }
            return this.move(dx, dy);
        }

        // Add touch controls for maze
        addTouchListeners() {
            this.canvas.addEventListener('touchstart', (e) => {
                e.preventDefault();
                const touch = e.touches[0];
                this.touchStartX = touch.clientX;
                this.touchStartY = touch.clientY;
                this.isTouching = true;
            });

            this.canvas.addEventListener('touchmove', (e) => {
                if (!this.isTouching) return;
                e.preventDefault();
                
                const touch = e.touches[0];
                const dx = touch.clientX - this.touchStartX;
                const dy = touch.clientY - this.touchStartY;
                
                // Require minimum movement to trigger direction
                if (Math.abs(dx) > 30 || Math.abs(dy) > 30) {
                    if (Math.abs(dx) > Math.abs(dy)) {
                        // Horizontal movement
                        this.move(dx > 0 ? 1 : -1, 0);
                    } else {
                        // Vertical movement
                        this.move(0, dy > 0 ? 1 : -1);
                    }
                    
                    // Update start position for next move
                    this.touchStartX = touch.clientX;
                    this.touchStartY = touch.clientY;
                }
            });

            this.canvas.addEventListener('touchend', () => {
                this.isTouching = false;
            });
        }

        generateMaze(width, height) {
            // Simple maze generation
            let maze = Array(height).fill().map(() => Array(width).fill(1));
            
            // Create paths
            for (let y = 1; y < height - 1; y += 2) {
                for (let x = 1; x < width - 1; x += 2) {
                    maze[y][x] = 0;
                    if (x + 2 < width) maze[y][x + 1] = 0;
                    if (y + 2 < height) maze[y + 1][x] = 0;
                }
            }
            
            // Create some random paths
            for (let i = 0; i < 10; i++) {
                let x = Math.floor(Math.random() * (width - 2)) + 1;
                let y = Math.floor(Math.random() * (height - 2)) + 1;
                maze[y][x] = 0;
            }

            return maze;
        }

        generateCollectibles() {
            return [
                { x: 4, y: 4, type: 'ladoo', collected: false },
                { x: 12, y: 3, type: 'gulab_jamun', collected: false },
                { x: 3, y: 12, type: 'barfi', collected: false }
            ];
        }

        drawObstacle(obstacle) {
            const x = obstacle.x * this.cellSize;
            const y = obstacle.y * this.cellSize;

            switch(obstacle.type) {
                case 'dancing_dholak':
                    // Animated dholak that bounces
                    this.ctx.save();
                    this.ctx.translate(x + this.cellSize/2, y + this.cellSize/2 + Math.sin(obstacle.frame) * 5);
                    this.ctx.rotate(Math.sin(obstacle.frame * 0.5) * 0.2);
                    this.ctx.fillStyle = '#8B4513';
                    this.ctx.fillRect(-15, -20, 30, 40);
                    this.ctx.fillStyle = '#D2691E';
                    this.ctx.beginPath();
                    this.ctx.ellipse(0, -20, 15, 5, 0, 0, Math.PI * 2);
                    this.ctx.fill();
                    this.ctx.beginPath();
                    this.ctx.ellipse(0, 20, 15, 5, 0, 0, Math.PI * 2);
                    this.ctx.fill();
                    obstacle.frame += 0.1;
                    this.ctx.restore();
                    break;

                case 'spinning_samosa':
                    // Spinning samosa with trail effect
                    this.ctx.save();
                    this.ctx.translate(x + this.cellSize/2, y + this.cellSize/2);
                    this.ctx.rotate(obstacle.rotation);
                    for(let i = 0; i < 3; i++) {
                        this.ctx.rotate(obstacle.rotation - i * 0.2);
                        this.ctx.globalAlpha = 1 - i * 0.2;
                        this.ctx.beginPath();
                        this.ctx.moveTo(-15, 10);
                        this.ctx.lineTo(15, 10);
                        this.ctx.lineTo(0, -20);
                        this.ctx.fillStyle = '#FFD700';
                        this.ctx.fill();
                    }
                    obstacle.rotation += 0.05;
                    this.ctx.restore();
                    break;

                case 'jumping_jalebi':
                    // Jumping jalebi with squish effect
                    this.ctx.save();
                    this.ctx.translate(x + this.cellSize/2, y + this.cellSize/2 + obstacle.height);
                    const squish = 1 - Math.abs(obstacle.height) / 20;
                    this.ctx.scale(1/squish, squish);
                    this.ctx.beginPath();
                    this.ctx.arc(0, 0, 15, 0, Math.PI * 2);
                    this.ctx.strokeStyle = '#FFA500';
                    this.ctx.lineWidth = 5;
                    this.ctx.stroke();
                    obstacle.height = Math.sin(Date.now() / 500) * 10;
                    this.ctx.restore();
                    break;

                case 'bouncing_balloon':
                    // Bouncing balloon with face
                    this.ctx.save();
                    this.ctx.translate(x + this.cellSize/2, y + this.cellSize/2);
                    this.ctx.scale(obstacle.scale, obstacle.scale);
                    this.ctx.beginPath();
                    this.ctx.arc(0, 0, 15, 0, Math.PI * 2);
                    this.ctx.fillStyle = '#FF69B4';
                    this.ctx.fill();
                    // Draw face
                    this.ctx.fillStyle = 'black';
                    this.ctx.beginPath();
                    this.ctx.arc(-5, -5, 2, 0, Math.PI * 2);
                    this.ctx.arc(5, -5, 2, 0, Math.PI * 2);
                    this.ctx.fill();
                    this.ctx.beginPath();
                    this.ctx.arc(0, 2, 5, 0, Math.PI);
                    this.ctx.stroke();
                    obstacle.scale = 1 + Math.sin(Date.now() / 400) * 0.2;
                    this.ctx.restore();
                    break;
            }
        }

        drawCollectible(item) {
            if (item.collected) return;

            const x = item.x * this.cellSize;
            const y = item.y * this.cellSize;
            
            this.ctx.save();
            this.ctx.translate(x + this.cellSize/2, y + this.cellSize/2);
            
            switch(item.type) {
                case 'ladoo':
                    this.ctx.beginPath();
                    this.ctx.arc(0, 0, 10, 0, Math.PI * 2);
                    this.ctx.fillStyle = '#FFD700';
                    this.ctx.fill();
                    this.ctx.strokeStyle = '#FFA500';
                    this.ctx.stroke();
                    break;
                    
                case 'gulab_jamun':
                    this.ctx.beginPath();
                    this.ctx.arc(0, 0, 8, 0, Math.PI * 2);
                    this.ctx.fillStyle = '#8B4513';
                    this.ctx.fill();
                    // Syrup drip effect
                    this.ctx.beginPath();
                    this.ctx.moveTo(-5, 8);
                    this.ctx.quadraticCurveTo(0, 15 + Math.sin(Date.now()/500) * 3, 5, 8);
                    this.ctx.strokeStyle = 'rgba(139, 69, 19, 0.5)';
                    this.ctx.stroke();
                    break;
                    
                case 'barfi':
                    this.ctx.save();
                    this.ctx.rotate(Math.PI/4);
                    this.ctx.fillStyle = '#FFFFFF';
                    this.ctx.fillRect(-8, -8, 16, 16);
                    // Sparkle effect
                    if (Math.random() > 0.7) {
                        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                        this.ctx.beginPath();
                        this.ctx.arc(Math.random() * 16 - 8, Math.random() * 16 - 8, 1, 0, Math.PI * 2);
                        this.ctx.fill();
                    }
                    this.ctx.restore();
                    break;
            }
            
            this.ctx.restore();
        }

        drawPlayer() {
            const x = this.playerPos.x * this.cellSize;
            const y = this.playerPos.y * this.cellSize;
            
            this.ctx.save();
            this.ctx.translate(x + this.cellSize/2, y + this.cellSize/2);
            this.ctx.rotate(this.playerRotation);
            
            // Dancing animation
            const bounce = Math.sin(this.dancingFrame) * 3;
            this.ctx.translate(0, bounce);
            
            // Draw player body
            this.ctx.fillStyle = '#FF69B4';
            this.ctx.beginPath();
            this.ctx.arc(0, 0, 15, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Draw party hat
            this.ctx.beginPath();
            this.ctx.moveTo(-10, -5);
            this.ctx.lineTo(0, -25);
            this.ctx.lineTo(10, -5);
            this.ctx.fillStyle = '#FFD700';
            this.ctx.fill();
            
            // Draw face
            this.ctx.fillStyle = 'white';
            this.ctx.beginPath();
            this.ctx.arc(-5, -5, 3, 0, Math.PI * 2);
            this.ctx.arc(5, -5, 3, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Draw smile
            this.ctx.beginPath();
            this.ctx.arc(0, 5, 5, 0, Math.PI);
            this.ctx.strokeStyle = 'white';
            this.ctx.stroke();
            
            this.ctx.restore();
            
            this.dancingFrame += 0.1;
        }

        showHint() {
            if (this.hintTimer <= 0) {
                this.currentHint = this.hints[Math.floor(Math.random() * this.hints.length)];
                this.hintTimer = 120; // Show hint for 2 seconds
            }
            
            if (this.hintTimer > 0) {
                this.ctx.save();
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                this.ctx.fillRect(0, this.canvas.height - 60, this.canvas.width, 60);
                
                this.ctx.font = '20px Arial';
                this.ctx.fillStyle = 'white';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(this.currentHint, this.canvas.width/2, this.canvas.height - 30);
                
                this.ctx.restore();
                this.hintTimer--;
            }
        }

        draw() {
            // Draw maze
            for (let y = 0; y < this.maze.length; y++) {
                for (let x = 0; x < this.maze[y].length; x++) {
                    if (this.maze[y][x] === 1) {
                        this.ctx.fillStyle = '#8B4513';
                        this.ctx.fillRect(x * this.cellSize, y * this.cellSize, this.cellSize, this.cellSize);
                        
                        // Add texture to walls
                        this.ctx.strokeStyle = '#A0522D';
                        this.ctx.lineWidth = 2;
                        this.ctx.beginPath();
                        this.ctx.moveTo(x * this.cellSize, y * this.cellSize);
                        this.ctx.lineTo(x * this.cellSize + this.cellSize, y * this.cellSize + this.cellSize);
                        this.ctx.stroke();
                    }
                }
            }

            // Draw collectibles
            this.collectibles.forEach(item => this.drawCollectible(item));
            
            // Draw obstacles
            this.obstacles.forEach(obstacle => this.drawObstacle(obstacle));
            
            // Draw player
            this.drawPlayer();
            
            // Show hint
            this.showHint();
        }

        move(dx, dy) {
            const newX = this.playerPos.x + dx;
            const newY = this.playerPos.y + dy;
            
            if (newX >= 0 && newX < this.maze[0].length &&
                newY >= 0 && newY < this.maze.length &&
                this.maze[newY][newX] === 0) {
                
                this.playerPos.x = newX;
                this.playerPos.y = newY;
                this.playerRotation = Math.atan2(dy, dx);
                
                // Check collectibles
                this.collectibles.forEach(item => {
                    if (!item.collected && item.x === newX && item.y === newY) {
                        item.collected = true;
                        this.currentHint = "Waah! " + item.type.replace('_', ' ') + " mil gaya! 🎉";
                        this.hintTimer = 120;
                    }
                });
                
                // Check if reached treasure
                if (newX === this.treasurePos.x && newY === this.treasurePos.y) {
                    return true;
                }
            }
            return false;
        }
    }

    // Game class
    class Game {
        constructor() {
            this.state = GAME_STATES.INTRO;
            this.playerX = canvas.width / 2;
            this.playerY = canvas.height - 100;
            this.score = 0;
            this.balloons = Array(5).fill().map(() => new Balloon());
            this.balloonsCollected = 0;
            this.targetBalloons = 15;
            this.complimentTimer = 0;
            this.currentCompliment = '';
            this.complimentAlpha = 0;
            this.mazeGame = null;
            this.gameWon = false;
            
            // Initialize game
            this.init();
        }

        init() {
            // Add keyboard controls
            document.addEventListener('keydown', (e) => this.handleInput(e));
            
            // Add touch controls
            if (isMobile) {
                // Start button
                startButton.addEventListener('click', () => {
                    if (this.state === GAME_STATES.INTRO) {
                        this.state = GAME_STATES.PLAYING;
                        this.showMessage("Tap the arrows to move and catch balloons!");
                    }
                });

                // Movement buttons
                let leftInterval, rightInterval;
                const moveSpeed = 15;

                // Left button touch events
                leftButton.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    if (this.state === GAME_STATES.PLAYING) {
                        clearInterval(leftInterval);
                        leftInterval = setInterval(() => {
                            this.playerX = Math.max(50, this.playerX - moveSpeed);
                        }, 33);
                    }
                });

                leftButton.addEventListener('touchend', () => {
                    clearInterval(leftInterval);
                });

                // Right button touch events
                rightButton.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    if (this.state === GAME_STATES.PLAYING) {
                        clearInterval(rightInterval);
                        rightInterval = setInterval(() => {
                            this.playerX = Math.min(canvas.width - 50, this.playerX + moveSpeed);
                        }, 33);
                    }
                });

                rightButton.addEventListener('touchend', () => {
                    clearInterval(rightInterval);
                });
            }
            
            // Show welcome message
            this.showMessage("🎮 Welcome to the Birthday Adventure! 🎂<br>" + 
                           (isMobile ? "Tap Start to begin!" : "Press SPACE to start!"));
            
            // Start game loop
            this.animate();
        }

        handleInput(e) {
            if (this.state === GAME_STATES.INTRO && e.code === 'Space') {
                this.state = GAME_STATES.PLAYING;
                this.showMessage("Use LEFT and RIGHT arrow keys to move and catch balloons!");
            } else if (this.state === GAME_STATES.PLAYING) {
                if (e.code === 'ArrowLeft') {
                    this.playerX = Math.max(50, this.playerX - 15);
                } else if (e.code === 'ArrowRight') {
                    this.playerX = Math.min(canvas.width - 50, this.playerX + 15);
                }
            } else if (this.state === GAME_STATES.GAME_OVER && e.code === 'Space') {
                this.resetGame();
            } else if (this.state === GAME_STATES.MAZE) {
                let dx = 0, dy = 0;
                switch(e.code) {
                    case 'ArrowLeft': dx = -1; break;
                    case 'ArrowRight': dx = 1; break;
                    case 'ArrowUp': dy = -1; break;
                    case 'ArrowDown': dy = 1; break;
                }
                if (dx !== 0 || dy !== 0) {
                    if (this.mazeGame.move(dx, dy)) {
                        this.state = GAME_STATES.GAME_OVER;
                        this.gameWon = true;
                        this.showMessage("🎉 Happiest Birthday Madam Ji! You found the treasure! 🎂");
                    }
                }
            }
        }

        resetGame() {
            this.state = GAME_STATES.PLAYING;
            this.score = 0;
            this.balloonsCollected = 0;
            this.balloons.forEach(balloon => balloon.reset());
            this.showMessage("Game restarted! Catch those balloons!");
        }

        showMessage(text) {
            messageBox.innerHTML = text;
        }

        drawCharacter(x, y, isPlayer) {
            ctx.save();
            
            // Draw body
            ctx.beginPath();
            ctx.arc(x, y, 40, 0, Math.PI * 2);
            ctx.fillStyle = '#FF69B4';
            ctx.fill();
            
            // Draw face
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(x - 15, y - 10, 8, 0, Math.PI * 2);
            ctx.arc(x + 15, y - 10, 8, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw smile
            ctx.beginPath();
            ctx.arc(x, y + 10, 20, 0, Math.PI);
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 3;
            ctx.stroke();

            // Draw birthday hat
            ctx.beginPath();
            ctx.moveTo(x - 20, y - 40);
            ctx.lineTo(x + 20, y - 40);
            ctx.lineTo(x, y - 70);
            ctx.fillStyle = '#FFD700';
            ctx.fill();
            
            ctx.restore();
        }

        showCompliment() {
            this.state = GAME_STATES.COMPLIMENT;
            this.currentCompliment = COMPLIMENTS[Math.floor(Math.random() * COMPLIMENTS.length)];
            this.complimentTimer = 0;
            this.complimentAlpha = 0;
            
            // Resume game after compliment
            setTimeout(() => {
                this.state = GAME_STATES.PLAYING;
            }, 3000);
        }

        checkCollisions() {
            this.balloons.forEach(balloon => {
                if (!balloon.collected) {
                    const dx = this.playerX - balloon.x;
                    const dy = this.playerY - balloon.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < 60) {
                        balloon.collected = true;
                        this.score++;
                        this.balloonsCollected++;
                        
                        // Show compliment every 4 points
                        if (this.score % 4 === 0) {
                            this.showCompliment();
                        }

                        // Start maze game after collecting all balloons
                        if (this.balloonsCollected >= this.targetBalloons) {
                            this.state = GAME_STATES.MAZE;
                            this.mazeGame = new MazeGame(canvas, ctx);
                            this.showMessage("🎮 Bhool Bhulaiya Time! Find the birthday treasure! 🎁");
                        }

                        balloon.reset();
                    }
                }
            });
        }

        drawBackground() {
            // Create gradient background
            const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
            gradient.addColorStop(0, '#ff69b4');
            gradient.addColorStop(1, '#9370db');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Add sparkles
            for (let i = 0; i < 50; i++) {
                const x = Math.random() * canvas.width;
                const y = Math.random() * canvas.height;
                const size = Math.random() * 2;
                ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.5})`;
                ctx.beginPath();
                ctx.arc(x, y, size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        drawCompliment() {
            if (this.state === GAME_STATES.COMPLIMENT) {
                this.complimentTimer++;
                
                // Fade in/out effect
                if (this.complimentTimer < 30) {
                    this.complimentAlpha = this.complimentTimer / 30;
                } else if (this.complimentTimer > 90) {
                    this.complimentAlpha = Math.max(0, 1 - (this.complimentTimer - 90) / 30);
                } else {
                    this.complimentAlpha = 1;
                }

                // Draw semi-transparent overlay
                ctx.fillStyle = `rgba(0, 0, 0, ${this.complimentAlpha * 0.3})`;
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // Draw text with glowing effect
                const text = this.currentCompliment;
                const x = canvas.width / 2;
                const y = canvas.height / 2;

                // Draw glow effect
                ctx.save();
                ctx.shadowBlur = 15;
                ctx.shadowColor = 'rgba(255, 182, 193, 0.8)';
                ctx.fillStyle = `rgba(255, 255, 255, ${this.complimentAlpha})`;
                ctx.font = 'bold 28px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(text, x, y);
                ctx.restore();

                // Draw floating hearts
                for (let i = 0; i < 5; i++) {
                    const angle = (this.complimentTimer * 0.05) + (i * Math.PI * 0.4);
                    const heartX = x + Math.cos(angle) * 150;
                    const heartY = y + Math.sin(angle) * 80;
                    const scale = 0.5 + Math.sin(this.complimentTimer * 0.1 + i) * 0.2;
                    
                    ctx.save();
                    ctx.translate(heartX, heartY);
                    ctx.scale(scale, scale);
                    ctx.fillStyle = `rgba(255, 105, 180, ${this.complimentAlpha * 0.8})`;
                    this.drawHeart(0, 0, 15);
                    ctx.restore();
                }
            }
        }

        drawHeart(x, y, size) {
            ctx.beginPath();
            ctx.moveTo(x, y + size / 4);
            ctx.quadraticCurveTo(x, y, x + size / 4, y);
            ctx.quadraticCurveTo(x + size / 2, y, x + size / 2, y + size / 4);
            ctx.quadraticCurveTo(x + size / 2, y, x + size * 3/4, y);
            ctx.quadraticCurveTo(x + size, y, x + size, y + size / 4);
            ctx.quadraticCurveTo(x + size, y + size / 2, x + size / 2, y + size);
            ctx.quadraticCurveTo(x, y + size / 2, x, y + size / 4);
            ctx.fill();
        }

        animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            this.drawBackground();

            switch(this.state) {
                case GAME_STATES.INTRO:
                    this.drawCharacter(this.playerX, this.playerY, true);
                    break;

                case GAME_STATES.PLAYING:
                case GAME_STATES.COMPLIMENT:
                    // Update and draw balloons
                    this.balloons.forEach(balloon => {
                        balloon.update();
                        balloon.draw();
                    });

                    // Draw player
                    this.drawCharacter(this.playerX, this.playerY, true);
                    
                    // Check collisions
                    this.checkCollisions();

                    // Draw score
                    ctx.fillStyle = 'white';
                    ctx.font = 'bold 24px Arial';
                    ctx.textAlign = 'left';
                    ctx.fillText(`Balloons: ${this.balloonsCollected}/${this.targetBalloons}`, 20, 40);

                    if (this.state === GAME_STATES.COMPLIMENT) {
                        this.drawCompliment();
                    }
                    break;

                case GAME_STATES.MAZE:
                    if (this.mazeGame) {
                        this.mazeGame.draw();
                    }
                    break;

                case GAME_STATES.GAME_OVER:
                    if (this.gameWon) {
                        // Draw celebration background
                        const time = Date.now() / 1000;
                        
                        // Draw colorful confetti
                        for (let i = 0; i < 50; i++) {
                            const x = (Math.sin(time * 2 + i) * 0.5 + 0.5) * canvas.width;
                            const y = ((time * 100 + i * 50) % canvas.height);
                            const size = 5 + Math.sin(time + i) * 2;
                            const hue = (time * 50 + i * 20) % 360;
                            
                            ctx.save();
                            ctx.translate(x, y);
                            ctx.rotate(time * 2 + i);
                            ctx.fillStyle = `hsla(${hue}, 100%, 60%, 0.8)`;
                            ctx.fillRect(-size/2, -size/2, size, size);
                            ctx.restore();
                        }

                        // Draw sparkles
                        for (let i = 0; i < 20; i++) {
                            const angle = time * 2 + i * Math.PI * 0.1;
                            const radius = 100 + Math.sin(time * 3 + i) * 50;
                            const x = canvas.width/2 + Math.cos(angle) * radius;
                            const y = canvas.height/2 + Math.sin(angle) * radius;
                            
                            ctx.beginPath();
                            ctx.arc(x, y, 2, 0, Math.PI * 2);
                            ctx.fillStyle = `rgba(255, 215, 0, ${0.7 + Math.sin(time * 5 + i) * 0.3})`;
                            ctx.fill();
                        }

                        // Draw pulsing text with shadow
                        const scale = 1 + Math.sin(time * 3) * 0.1;
                        ctx.save();
                        ctx.translate(canvas.width/2, canvas.height/2);
                        ctx.scale(scale, scale);
                        
                        // Text shadow
                        ctx.shadowBlur = 20;
                        ctx.shadowColor = 'rgba(255, 105, 180, 0.8)';
                        
                        ctx.font = 'bold 48px Arial';
                        ctx.textAlign = 'center';
                        ctx.fillStyle = '#FF69B4';
                        ctx.fillText('Happiest Birthday Madam Ji!', 0, 0);
                        
                        ctx.font = '24px Arial';
                        ctx.fillStyle = '#FFF';
                        ctx.fillText('🎉 You found the birthday treasure! 🎂', 0, 50);
                        
                        ctx.restore();

                        // Draw rotating hearts
                        for (let i = 0; i < 8; i++) {
                            const heartAngle = time * 2 + i * Math.PI * 0.25;
                            const heartX = canvas.width/2 + Math.cos(heartAngle) * 200;
                            const heartY = canvas.height/2 + Math.sin(heartAngle) * 150;
                            
                            ctx.save();
                            ctx.translate(heartX, heartY);
                            ctx.rotate(heartAngle);
                            ctx.fillStyle = `rgba(255, 105, 180, ${0.7 + Math.sin(time * 3 + i) * 0.3})`;
                            this.drawHeart(0, 0, 20);
                            ctx.restore();
                        }
                    }
                    break;
            }

            requestAnimationFrame(() => this.animate());
        }
    }

    // Initialize the game
    const game = new Game();
}); 