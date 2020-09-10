/* 
------------------------------
------- INPUT SECTION -------- 
------------------------------
*/

/**
 * This class binds key listeners to the window and updates the controller in attached player body.
 * 
 * @typedef InputHandler
 */
class InputHandler {
	key_code_mappings = {
		button: {
			32: {key: 'space', state: 'action_1'}
		},
		axis: {
			68: {key: 'right', state: 'move_x', mod: 1},
			65: {key: 'left', state: 'move_x', mod: -1},
			87: {key: 'up', state: 'move_y', mod: -1},
			83: {key: 'down', state: 'move_y', mod: 1}
		}
	};
	player = null;

    /**
     * Constructs the InputHandler class
     * @constructor
     * @param {Player} player The player
     */
	constructor(player) {
		this.player = player;

		// bind event listeners
		window.addEventListener("keydown", (event) => this.keydown(event), false);
		window.addEventListener("keyup", (event) => this.keyup(event), false);
	}

	/**
	 * This is called every time a keydown event is thrown on the window.
	 * 
	 * @param {Object} event The keydown event
	 */
	keydown(event) {
		this.player.raw_input[event.keyCode] = true;
	}

	/**
	 * This is called every time a keyup event is thrown on the window.
	 * 
	 * @param {Object} event The keyup event
	 */
	keyup(event) {
		delete this.player.raw_input[event.keyCode];
	}

    //Reset controller inputs
	resetController() {
		// reset all buttons to false
		for (let mapping of Object.values(this.key_code_mappings.button)) {
			this.player.controller[mapping.state] = false;
		}

		// reset all axis to zero
		for (let mapping of Object.values(this.key_code_mappings.axis)) {
			this.player.controller[mapping.state] = 0;
		}
	}

    //Poll for controller inputs
	pollController() {
		this.resetController();

		// poll all bound buttons
		for (let [key_code, mapping] of Object.entries(this.key_code_mappings.button)) {
			if (this.player.raw_input[key_code] === true) {
				this.player.controller[mapping.state] = true;
			}
		}

		// poll all bound axis
		for (let [key_code, mapping] of Object.entries(this.key_code_mappings.axis)) {
			if (this.player.raw_input[key_code] === true) {
				this.player.controller[mapping.state] += mapping.mod;
			}
		}
	}
}

/* 
------------------------------
------- BODY SECTION  -------- 
------------------------------
*/

/**
 * Represents a basic physics body in the world. It has all of the necessary information to be
 * rendered, checked for collision, updated, and removed.
 * 
 * @typedef Body
 */
class Body {
	position = {x: 0, y: 0};
	velocity = {x: 0, y: 0};
	size = {width: 10, height: 10};
	health = 100;

	/**
	 * Creates a new body with all of the default attributes
     * @constructor
	 */
	constructor() {
		// generate and assign the next body id
		this.id = running_id++;
		// add to the entity map
		entities[this.id] = this;
	}

	/**
     * Returns an object with two properties, width and height. The passed width and height
	 * are equal to half ot the width and height of this body.
	 * @returns {Object} The object
	 */
	get half_size() {
		return {
			width: this.size.width / 2,
			height: this.size.height / 2
		};
	}

	/**
	 * @returns {Boolean} true if health is less than or equal to zero, false otherwise.
	 */
	isDead() {
		return this.health <= 0;
	}

	/**
	 * Updates the position of this body using the set velocity.
	 * 
	 * @param {Number} delta_time Seconds since last update
	 */
	update(delta_time) {
		// move body
		this.position.x += delta_time * this.velocity.x;
		this.position.y += delta_time * this.velocity.y;
	}

	/**
	 * This function draws a green line in the direction of the body's velocity. The length of this
	 * line is equal to a tenth of the length of the real velocity
	 * 
	 * @param {CanvasRenderingContext2D} graphics The current graphics context.
	 */
	draw(graphics) {
		graphics.strokeStyle = '#00FF00';
		graphics.beginPath();
		graphics.moveTo(this.position.x, this.position.y);
		graphics.lineTo(this.position.x + this.velocity.x / 10, this.position.y + this.velocity.y / 10);
		graphics.stroke();
	}

	/**
	 * Marks this body to be removed at the end of the update loop
	 */
	remove() {
		queued_entities_for_removal.push(this.id);
	}
}

/**
 * Represents an player body. Extends a Body by handling input binding and controller management.
 * 
 * @typedef Player
 */
class Player extends Body {
	// this controller object is updated by the bound input_handler
	controller = {
		move_x: 0,
		move_y: 0,
		action_1: false
	};
	raw_input = {};
	speed = 150;
    input_handler = null;

	/**
	 * Creates a new player with the default attributes.
     * @constructor
	 */
	constructor() {
		super();

		// bind the input handler to this object
		this.input_handler = new InputHandler(this);

		// we always want our new players to be at this location
		this.position = {
			x: config.canvas_size.width / 2,
			y: config.canvas_size.height - 100
		};
	}

	/**
	 * Draws the player as a triangle centered on the player's location.
	 * 
	 * @param {CanvasRenderingContext2D} graphics The current graphics context.
	 */
	draw(graphics) {
		graphics.strokeStyle = '#000000';
		graphics.beginPath();
		graphics.moveTo(
			this.position.x,
			this.position.y - this.half_size.height
		);
		graphics.lineTo(
			this.position.x + this.half_size.width,
			this.position.y + this.half_size.height
		);
		graphics.lineTo(
			this.position.x - this.half_size.width,
			this.position.y + this.half_size.height
		);
		graphics.lineTo(
			this.position.x,
			this.position.y - this.half_size.height
		);
		graphics.stroke();

		// draw velocity lines
		//super.draw(graphics);
	}

	/**
	 * Updates the player given the state of the player's controller.
	 * 
	 * @param {Number} delta_time Time in seconds since last update call.
	 */
	update(delta_time) {

        //Change player velocity based on controller input
        if(this.controller.move_x && this.controller.move_y) {
            this.velocity.x = this.controller.move_x * this.speed / Math.sqrt(2);
            this.velocity.y = this.controller.move_y * this.speed / Math.sqrt(2);
        }
        else {
            this.velocity.x = this.controller.move_x * this.speed;
            this.velocity.y = this.controller.move_y * this.speed;
        }
        
		// update position
		super.update(delta_time);

		// clip to screen
		this.position.x = Math.min(Math.max(0, this.position.x), config.canvas_size.width);
		this.position.y = Math.min(Math.max(0, this.position.y), config.canvas_size.height);
	}
}

/**
 * Represents an enemy body. Extends a Body by handling spawn location and image.
 * 
 * @typedef Enemy
 */
class Enemy extends Body {
    speed = 100;

    /**
	 * Creates a new enemy with the default attributes.
     * @constructor
	 */
	constructor() {
		super();

        //Set position above canvas, at random x value
		this.position = {
            x: config.canvas_size.width * Math.random(),
            y: -this.half_size.height
        };
        this.velocity.y = this.speed;

        //Track number of enemies spawned
        if(!player.isDead()) {
            enemies_spawned++;
        }
        
	}

	/**
	 * Draws the enemy as an upside down triangle
	 * 
	 * @param {CanvasRenderingContext2D} graphics The current graphics context.
	 */
	draw(graphics) {
		graphics.strokeStyle = '#000000';
		graphics.beginPath();
		graphics.moveTo(
			this.position.x,
			this.position.y + this.half_size.height
		);
		graphics.lineTo(
			this.position.x + this.half_size.width,
			this.position.y - this.half_size.height
		);
		graphics.lineTo(
			this.position.x - this.half_size.width,
			this.position.y - this.half_size.height
		);
		graphics.lineTo(
			this.position.x,
			this.position.y + this.half_size.height
		);
		graphics.stroke();

		// draw velocity lines
		//super.draw(graphics);
	}
}

/**
 * Represents a projectile. Extends a Body by handling spawn location and image.
 * 
 * @typedef Projectile
 */
class Projectile extends Body {
    speed = -200;

    /**
	 * Creates a new projectile with the default attributes.
     * @constructor
	 */
	constructor() {
		super();

        //Start projectile above player, at player's x coordinate
		this.position = {
            x: player.position.x,
            y: player.position.y - player.size.height
        };
        this.velocity.y = this.speed;
        this.size = player.half_size;
	}

	/**
	 * Draws the projectile as a small square
	 * 
	 * @param {CanvasRenderingContext2D} graphics The current graphics context.
	 */
	draw(graphics) {
		graphics.strokeStyle = '#000000';
		graphics.beginPath();
		graphics.moveTo(
			this.position.x - this.half_size.width,
			this.position.y - this.half_size.height
		);
		graphics.lineTo(
			this.position.x + this.half_size.width,
			this.position.y - this.half_size.height
		);
		graphics.lineTo(
			this.position.x + this.half_size.width,
			this.position.y + this.half_size.height
		);
		graphics.lineTo(
			this.position.x - this.half_size.width,
			this.position.y + this.half_size.height
        );
        graphics.lineTo(
			this.position.x - this.half_size.width,
			this.position.y - this.half_size.height
		);
		graphics.stroke();

		// draw velocity lines
		//super.draw(graphics);
	}
}

/* 
------------------------------
------ CONFIG SECTION -------- 
------------------------------
*/

const config = {
	graphics: {
		// set to false if you are not using a high resolution monitor
		is_hi_dpi: true
	},
	canvas_size: {
		width: 300,
		height: 500
	},
	update_rate: {
		fps: 60,
		seconds: null
	}
};

config.update_rate.seconds = 1 / config.update_rate.fps;

// grab the html span
const game_state = document.getElementById('game_state');

// grab the html canvas
const game_canvas = document.getElementById('game_canvas');
game_canvas.style.width = `${config.canvas_size.width}px`;
game_canvas.style.height = `${config.canvas_size.height}px`;

const graphics = game_canvas.getContext('2d');

// for monitors with a higher dpi
if (config.graphics.is_hi_dpi) {
	game_canvas.width = 2 * config.canvas_size.width;
	game_canvas.height = 2 * config.canvas_size.height;
	graphics.scale(2, 2);
} else {
	game_canvas.width = config.canvas_size.width;
	game_canvas.height = config.canvas_size.height;
	graphics.scale(1, 1);
}

/* 
------------------------------
------- MAIN SECTION  -------- 
------------------------------
*/

/** @type {Number} last frame time in seconds */
var last_time = null;

/** @type {Number} A counter representing the number of update calls */
var loop_count = 0;

/** @type {Number} A counter that is used to assign bodies a unique identifier */
var running_id = 0;

/** @type {Object<Number, Body>} This is a map of body ids to body instances */
var entities = null;

/** @type {Array<Number>} This is an array of body ids to remove at the end of the update */
var queued_entities_for_removal = null;

/** @type {Player} The active player */
var player = null;

/** @type {Object<Number, Function>} Spawn enemies above canvas, despawn if they reach the bottom */
var enemy_spawner = null;

/** @type {Object<Function>} Handle collisions between entities */
var collision_handler = null;

/** @type {Object<Number, Function>} Fire projectiles */
var combat_handler = null;

/** @type {Number} The current game score */
var score = 0;

/** @type {Number} The number of enemies that have spawned  */
var enemies_spawned = 0;

/** @type {Number} The number oF enemies that were hit by a projectile */
var enemies_hit = 0;

/** @type {Number} The number of seconds the player has been alive */
var seconds_alive = 0;

/**
 * This function updates the state of the world given a delta time.
 * 
 * @param {Number} delta_time Time since last update in seconds.
 */
function update(delta_time) {
    //Track how long the player was alive
    if(!player.isDead()) {
        seconds_alive += delta_time;
    }
    
	// poll input
	player.input_handler.pollController();

	// move entities
	Object.values(entities).forEach(entity => {
		entity.update(delta_time);
	});

    // detect and handle collision events
    collision_handler.update(delta_time);

	// remove enemies
	queued_entities_for_removal.forEach(id => {
		delete entities[id];
	})
	queued_entities_for_removal = [];

    // spawn enemies
    enemy_spawner.update(delta_time);
    
    //Fire projectiles
    combat_handler.update(delta_time);

	// allow the player to restart when dead
	if (player.isDead() && player.controller.action_1) {
		start();
	}
}

/**
 * This function draws the state of the world to the canvas.
 * 
 * @param {CanvasRenderingContext2D} graphics The current graphics context.
 */
function draw(graphics) {
	// default font config
    graphics.font = "10px Arial";


	// draw background (this clears the screen for the next frame)
	graphics.fillStyle = '#FFFFFF';
	graphics.fillRect(0, 0, config.canvas_size.width, config.canvas_size.height);

	// for loop over every eneity and draw them
	Object.values(entities).forEach(entity => {
		entity.draw(graphics);
    });

    //Print stats
    graphics.fillStyle = "black";
    graphics.textAlign = "left";
    graphics.fillText("Health", 0, 10);
    graphics.fillText(player.health, 0, 20);

    graphics.fillText("Enemies hit", 0, config.canvas_size.height - 10);
    graphics.fillText(enemies_hit, 0, config.canvas_size.height);

    graphics.textAlign = "center";
    graphics.fillText("Time", config.canvas_size.width / 2, 10);
    graphics.fillText(Math.floor(seconds_alive), config.canvas_size.width / 2, 20);

    graphics.textAlign = "right";
    graphics.fillText("Score", config.canvas_size.width, 10);
    graphics.fillText(30 * enemies_hit + Math.floor(seconds_alive), config.canvas_size.width, 20);

    graphics.fillText("Enemies spawned", config.canvas_size.width, config.canvas_size.height - 10);
    graphics.fillText(enemies_spawned, config.canvas_size.width, config.canvas_size.height);

	// game over screen
	if (player.isDead()) {

        graphics.textAlign = "center";
		graphics.font = "30px Arial";
		graphics.fillText('Game Over', config.canvas_size.width / 2, config.canvas_size.height / 2);

        graphics.font = "12px Arial";
        graphics.fillText('Press space to restart', config.canvas_size.width / 2, 18 + config.canvas_size.height / 2);
	}
}

/**
 * This is the main driver of the game. This is called by the window requestAnimationFrame event.
 * This function calls the update and draw methods at static intervals. That means regardless of
 * how much time passed since the last time this function was called by the window the delta time
 * passed to the draw and update functions will be stable.
 * 
 * @param {Number} curr_time Current time in milliseconds
 */
function loop(curr_time) {
	// convert time to seconds
	curr_time /= 1000;

	// edge case on first loop
	if (last_time == null) {
		last_time = curr_time;
	}

	var delta_time = curr_time - last_time;

	// this allows us to make stable steps in our update functions
	while (delta_time > config.update_rate.seconds) {
		update(config.update_rate.seconds);
		draw(graphics);

		delta_time -= config.update_rate.seconds;
		last_time = curr_time;
		loop_count++;

		game_state.innerHTML = `loop count ${loop_count}`;
	}

	window.requestAnimationFrame(loop);
}

//Start a new game
function start() {

    //Initialize variables
    score = 0;
    enemies_spawned = 0;
    enemies_hit = 0;
    seconds_alive = 0;
	entities = [];
	queued_entities_for_removal = [];
	player = new Player();
    
    //Spawn and despawn enemies
	enemy_spawner = {
        cooldown: 0,

        /**
         * Update the spawner
         * @param {Number} delta_time Time since last update
         */
        update: function(delta_time) {

            //Spawn new enemies at regular intervals
            if(this.cooldown <= 0) {
                enemy = new Enemy(); 
                this.cooldown = 0.5;
            }
            else {
                this.cooldown -= delta_time;
            }

            //Remove enemies that move below canvas
            Object.values(entities).forEach(entity => {
                if(entity.position.y > config.canvas_size.height + entity.half_size.height && entity instanceof Enemy) {

                    entity.remove();
                    if(player.health > 0) {
                        player.health -= 10;
                    }                
                }
            });
        }
    }
    
    //Handle collisions between entities
	collision_handler = {

        //Update handler
        update: function() {

            Object.values(entities).forEach(entity1 => {
                Object.values(entities).forEach(entity2 => {

                    if(entity1 !== entity2) {

                        //Make rectangles to check for collision
                        rect1 = {
                            x: entity1.position.x,
                            y: entity1.position.y,
                            width: entity1.size.width,
                            height: entity1.size.height
                        };

                        rect2 = {
                            x: entity2.position.x,
                            y: entity2.position.y,
                            width: entity2.size.width,
                            height: entity2.size.height
                        };

                        //If collision, reduce player health or remove other entities
                        if (rect1.x < rect2.x + rect2.width &&
                            rect1.x + rect1.width > rect2.x &&
                            rect1.y < rect2.y + rect2.height &&
                            rect1.y + rect1.height > rect2.y) {
                            
                            if(entity1 instanceof Player) {

                                if(player.health > 0) {

                                    player.health -= 20;
                                    if(player.health < 0) {
                                        player.health = 0;
                                    }
                                } 
                            }
                            else if(entity1 instanceof Projectile && entity2 instanceof Enemy && !player.isDead()) {
                                enemies_hit++;
                                entity1.remove();
                            }
                            else {
                                entity1.remove();
                            }
                            
                        }
                    }
                });
            });
        }
    }

    //Fire projectiles and despawn them if they don't hit anything
    combat_handler = {
        cooldown: 0,

        /**
         * Update combat handler
         * @param {Number} delta_time Time since the last update
         */
        update: function(delta_time) {

            //Limit the firing rate
            if(this.cooldown <= 0) {

                if(player.controller.action_1) {
                    projectile = new Projectile();
                    this.cooldown = 0.3;
                }
                
            }
            else {
                this.cooldown -= delta_time;
            }

            //Remove projectiles that move above canvas
            Object.values(entities).forEach(entity => {
                if(entity.position.y < -entity.half_size.height && entity instanceof Projectile) {
                    entity.remove();
                }
            });
        }
    }
}

// start the game
start();

// start the loop
window.requestAnimationFrame(loop);