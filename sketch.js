function setup() {
  createCanvas(400, 400);
}

function draw() {
  background(220);
}
// Global variables
let player;
let clouds = [];
let fallingObjects = [];
let powerUps = [];
let scrollY = 0;
let gravity = 0.5;
let jumpSpeed = 10;
let gameState = "playing";
let score = 0;
let powerUpActive = false;
let powerUpTimer = 0;
let input;
let submitButton;
let scoreSubmitted = false;
let initialWorldY = 500;
let minWorldY = initialWorldY;

function setup() {
  // Initialize canvas
  createCanvas(400, 600);
  
  // Initialize player object
  player = {
    worldX: 185,           // Center horizontally (400 / 2 - 30 / 2)
    worldY: 500,           // Starting position above initial cloud
    vx: 0,                 // Horizontal velocity
    vy: 0,                 // Vertical velocity
    width: 30,             // Player width
    height: 50,            // Player height
    isOnCloud: true        // Player starts on a cloud
  };
  
  // Generate initial clouds
  let currentY = 550;      // First cloud near bottom of screen
  while (currentY > -1000) {
    let x = random(0, width - 100); // Random x position for cloud
    let y = currentY - random(50, 150); // Random vertical spacing
    clouds.push({worldX: x, worldY: y, width: 100, height: 20});
    // Occasionally add power-ups on clouds
    if (random() < 0.1) { // 10% chance
      let puX = x + random(0, 80); // Within the cloud
      let puY = y - 20; // On top of the cloud
      powerUps.push({worldX: puX, worldY: puY, width: 20, height: 20, type: "rocket"});
    }
    currentY = y;
  }
  
  // Set initial scroll position
  scrollY = 0; // Starts at 0, will adjust continuously
  
  // Create input field and submit button for leaderboard
  input = createInput();
  input.position(100, 300);
  input.size(200, 20);
  input.attribute('maxlength', '3');
  input.hide();
  
  submitButton = createButton('Submit');
  submitButton.position(150, 350);
  submitButton.size(100, 30);
  submitButton.hide();
  
  // Set up submit button action
  submitButton.mousePressed(() => {
    if (gameState === "gameover" && !scoreSubmitted) {
      let name = input.value().trim().toUpperCase();
      if (name === "") name = "Anonymous";
      addScore(name, score);
      scoreSubmitted = true;
      input.hide();
      submitButton.hide();
    }
  });
}

function draw() {
  if (gameState === "playing") {
    // Draw sky background
    background(135, 206, 235); // Light blue
    
    // Update player position
    player.worldX += player.vx;
    player.worldY += player.vy;
    
    // Apply gravity if not on a cloud
    if (!player.isOnCloud) {
      player.vy += gravity;
    }
    
    // Continuous scrolling to keep player in view
    let screenY = player.worldY - scrollY;
    if (screenY < height / 2) {
      scrollY = player.worldY - height / 2;
    }
    
    // Check collisions with clouds
    for (let cloud of clouds) {
      if (
        player.vy > 0 && // Player is falling
        player.worldY < cloud.worldY && // Player's top is above cloud's top
        player.worldY + player.height > cloud.worldY && // Player's bottom crosses cloud's top
        player.worldX + player.width > cloud.worldX && // Player overlaps cloud horizontally
        player.worldX < cloud.worldX + cloud.width
      ) {
        player.worldY = cloud.worldY - player.height; // Land on cloud
        player.vy = 0; // Stop falling
        player.isOnCloud = true;
      }
    }
    
    // Keep player within horizontal bounds
    player.worldX = constrain(player.worldX, 0, width - player.width);
    
    // Update minWorldY if player reaches a new height
    if (player.worldY < minWorldY) {
      minWorldY = player.worldY;
    }
    // Calculate score based on height
    score = floor((initialWorldY - minWorldY) / 10);
    
    // Find the highest cloud (smallest worldY)
    let minCloudY = min(clouds.map(c => c.worldY));
    
    // Generate new clouds if player approaches highest cloud
    if (player.worldY < minCloudY - 150) {
      let newY = minCloudY - random(50, 150 - floor(score / 20)); // Increase difficulty
      let newX = random(0, width - 100);
      clouds.push({worldX: newX, worldY: newY, width: 100, height: 20});
      // Occasionally add power-ups on new clouds
      if (random() < 0.1) {
        let puX = newX + random(0, 80);
        let puY = newY - 20;
        powerUps.push({worldX: puX, worldY: puY, width: 20, height: 20, type: "rocket"});
      }
    }
    
    // Remove clouds that are too far below the screen
    clouds = clouds.filter(c => c.worldY <= scrollY + height + 100);
    
    // Spawn falling objects if score >= 70
    if (score >= 70 && random() < 0.01) { // Adjust spawn rate
      let x = random(0, width - 20);
      let y = scrollY - 50; // Start above the screen
      let speed = 5 + floor(score / 10); // Increase speed with score
      fallingObjects.push({worldX: x, worldY: y, width: 20, height: 20, speed: speed});
    }
    
    // Update and draw falling objects
    for (let obj of fallingObjects) {
      obj.worldY += obj.speed;
      drawFallingObject(obj.worldX, obj.worldY - scrollY, obj.width, obj.height);
      // Check collision with player
      if (
        player.worldX < obj.worldX + obj.width &&
        player.worldX + player.width > obj.worldX &&
        player.worldY < obj.worldY + obj.height &&
        player.worldY + player.height > obj.worldY
      ) {
        gameState = "gameover";
      }
    }
    
    // Remove falling objects that are off-screen
    fallingObjects = fallingObjects.filter(obj => obj.worldY < scrollY + height + 50);
    
    // Draw all clouds with scroll offset
    for (let cloud of clouds) {
      drawCloud(cloud.worldX, cloud.worldY - scrollY, cloud.width, cloud.height);
    }
    
    // Draw power-ups
    for (let pu of powerUps) {
      drawPowerUp(pu.worldX, pu.worldY - scrollY, pu.width, pu.height);
      // Check if player collects power-up
      if (
        player.worldX < pu.worldX + pu.width &&
        player.worldX + player.width > pu.worldX &&
        player.worldY < pu.worldY + pu.height &&
        player.worldY + player.height > pu.worldY
      ) {
        if (pu.type === "rocket") {
          jumpSpeed = 15; // Increase jump speed
          powerUpActive = true;
          powerUpTimer = 5000; // 5 seconds
        }
        // Remove collected power-up
        powerUps = powerUps.filter(p => p !== pu);
      }
    }
    
    // Draw player with scroll offset
    drawPlayer(player.worldX, player.worldY - scrollY);
    
    // Display current score
    textAlign(LEFT);
    textSize(16);
    fill(0);
    text("Score: " + score, 10, 20);
    
    // Check for game over (player falls below screen)
    if (player.worldY - scrollY > height + 50) {
      gameState = "gameover";
    }
    
    // Handle power-up timer
    if (powerUpActive) {
      powerUpTimer -= deltaTime;
      if (powerUpTimer <= 0) {
        jumpSpeed = 10; // Reset jump speed
        powerUpActive = false;
      }
    }
  } else {
    // Game over screen
    textAlign(CENTER);
    textSize(32);
    fill(0);
    text("Game Over", width / 2, height / 2 - 50);
    textSize(24);
    text("Your score: " + score, width / 2, height / 2);
    if (!scoreSubmitted) {
      input.show();
      submitButton.show();
      input.elt.focus(); // Set focus to input field
      input.value('');   // Clear input field
      textSize(18);
      text("Enter your initials:", width / 2, 280);
    } else {
      drawLeaderboard();
    }
  }
}

function keyPressed() {
  if (gameState === "playing") {
    // Horizontal movement
    if (keyCode === LEFT_ARROW) {
      player.vx = -5;
    } else if (keyCode === RIGHT_ARROW) {
      player.vx = 5;
    }
    // Jump only when on a cloud
    else if (keyCode === UP_ARROW && player.isOnCloud) {
      player.vy = -jumpSpeed;
      player.isOnCloud = false;
    }
  }
}

function keyReleased() {
  if (gameState === "playing") {
    // Stop horizontal movement
    if (keyCode === LEFT_ARROW || keyCode === RIGHT_ARROW) {
      player.vx = 0;
    }
  }
}

function drawPlayer(x, y) {
  // Draw a simple red rectangle for the player
  fill(255, 0, 0);
  rect(x, y, player.width, player.height);
}

function drawCloud(x, y, w, h) {
  // Draw cloud using overlapping white ellipses
  fill(255);
  noStroke();
  ellipse(x + w / 4, y, w / 2, h);
  ellipse(x + w / 2, y, w, h);
  ellipse(x + 3 * w / 4, y, w / 2, h);
}

function drawFallingObject(x, y, w, h) {
  // Draw falling object as a black square
  fill(0);
  rect(x, y, w, h);
}

function drawPowerUp(x, y, w, h) {
  // Draw power-up as a green square
  fill(0, 255, 0);
  rect(x, y, w, h);
}

// Leaderboard functions
function loadLeaderboard() {
  try {
    let lb = JSON.parse(localStorage.getItem('leaderboard'));
    if (!Array.isArray(lb)) {
      return [];
    }
    return lb;
  } catch (e) {
    return [];
  }
}

function saveLeaderboard(lb) {
  localStorage.setItem('leaderboard', JSON.stringify(lb));
}

function addScore(name, score) {
  let lb = loadLeaderboard();
  lb.push({name: name, score: score});
  lb.sort((a, b) => b.score - a.score);
  lb = lb.slice(0, 3); // Keep only top 3 scores
  saveLeaderboard(lb);
}

function drawLeaderboard() {
  let lb = loadLeaderboard();
  textAlign(CENTER);
  textSize(24);
  fill(0);
  text("Top Scores:", width / 2, 400);
  textSize(18);
  let y = 430;
  for (let i = 0; i < lb.length; i++) {
    text((i+1) + ". " + lb[i].name + " - " + lb[i].score, width / 2, y);
    y += 20;
  }
}