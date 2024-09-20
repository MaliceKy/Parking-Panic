import { playerData, moveCar, rotateCar, updatePlayerCSS, toggleHeadlights } from './movement.js';
import { checkCollisions, registerObstacle } from './collision.js';
import { scaleGame } from './scaling.js';

$(function () {
    // Car Vars
    const player = $('#car');
    const headlights = $('#headlights');

    // Obstacle Vars
    const coneHitbox = $('#cone-hitbox');
    const cone = $('#cone-obstacle');
    const dumpsterHitbox = $('#dumpster-hitbox');
    const dumpster = $('#dumpster-obstacle');


    // Register obstacles
    registerObstacle(coneHitbox, cone);
    registerObstacle(dumpsterHitbox, dumpster);

    // Key states
    const keys = {
        w: false,
        s: false,
        a: false,
        d: false
    };

    // Handle key presses
    $(document).on('keydown', handleKeyDown);
    $(document).on('keyup', handleKeyUp);

    // Call scaleGame initially
    scaleGame();

    // Main update loop
    setInterval(updatePlayer, 10);

    // Set initial state: Turn headlights off
    headlights.hide();


    function updatePlayer() {
        moveCar(keys);
        rotateCar(keys);
        updatePlayerCSS(player);
        const collision = checkCollisions(playerData);
        updateCollisionVisual(collision);
        scaleGame();
    }

    function updateCollisionVisual(collision) {
        $('#car-hitbox').css('background-color', collision ? 'rgba(0, 255, 0, 0.3)' : 'transparent');
    }

    // Handle key down
    function handleKeyDown(e) {
        if (keys.hasOwnProperty(e.key.toLowerCase())) {
            keys[e.key.toLowerCase()] = true;
        }

        if (e.key.toLowerCase() === 'h') {
            toggleHeadlights($('#headlights'));
        }
    }

    // Handle key up
    function handleKeyUp(e) {
        if (keys.hasOwnProperty(e.key.toLowerCase())) {
            keys[e.key.toLowerCase()] = false;
        }
    }
});