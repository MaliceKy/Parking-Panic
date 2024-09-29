import { playerData, moveCar, rotateCar, stopCar, resetCar, checkContainmentButtons, updatePlayerCSS, toggleHeadlights } from './movement.js';
import { obstacles, checkCollisions, registerObstacle, updateScale } from './collision.js';
import { startTimer, stopTimer, resetTimer, saveTime } from './timer.js';
import { updateSpot, checkParkingCompletion, revertParkingSpot} from './randomspot.js';

$(function () {
    // Scaling functionality
    const $scaleWindow = $('#scroll-window');
    const $controls = $('#controls')
    let unscaledSize = 1000;
    let headerHeight = 150;

    // Initial resize
    resize();

    //Choose parking spot
    //updateSpot();

    // Game Vars
    let gameState = 'start';
    let lives = 0;

    // Car Vars
    const player = $('#car');
    const headlights = $('#headlights');

    // Obstacle Vars
    const coneHitboxes = $('.cone-hitbox');
    const cones = $('.cone-obstacle');
    const dumpsterHitboxes = $('.dumpster-hitbox');
    const dumpsters = $('.dumpster-obstacle');

    cones.each(function (index) {
        registerObstacle(coneHitboxes.eq(index), cones.eq(index));
    });

    dumpsters.each(function (index) {
        registerObstacle(dumpsterHitboxes.eq(index), dumpsters.eq(index));
    });

    // Key states
    const keys = {
        w: false,
        s: false,
        a: false,
        d: false,
        ArrowUp: false,
        ArrowDown: false,
        ArrowLeft: false,
        ArrowRight: false
    };

    // Handle key presses
    $(document).on('keydown', handleKeyDown);
    $(document).on('keyup', handleKeyUp);

    // Main update loop
    setInterval(updatePlayer, 10);

    // Set initial state: Turn headlights off
    headlights.hide();

    // Resizes the game window when the browser window is resized.
    function resize() {
        let width = window.innerWidth;
        let height = window.innerHeight - headerHeight;
        let newSize = Math.min(width, height);
        let scale = newSize / unscaledSize;

        $scaleWindow.css('transform', `scale(${scale})`);
        $scaleWindow.css('margin-left', (width - newSize) / 2 + "px");

        $controls.css('transform', `scale(${scale * 1.3})`);
        // $controls.css('margin-left', (width - newSize) / 2 + "px");

        // Update the scale in collision.js
        updateScale(scale);
    }

    // Add resize event listener
    window.addEventListener("resize", resize);  // Resize game window on resize event

    // Updates player movement, collision checks, parking completion, and visual updates every 10 milliseconds.
    function updatePlayer() {
        moveCar(keys, startTimer);
        rotateCar(keys);
        updatePlayerCSS(player);

        //Check if car is in the chose parking spot
        const correctSpot = checkParkingCompletion();
        if(correctSpot){
            /*resetGame("win");
            revertParkingSpot();
            stopTimer();
            resetTimer();
            revertParkingSpot();
            updateSpot();
            startTimer();*/ //Remove comments if you want the old "you lose back"
            showWinEndScreen();
        }

        // Collisions
        const collision = checkCollisions(playerData);
        if (collision) {
            resetCar(gameState);
            removeLife();
        }

        // Containment
        const chosenMode = checkContainmentButtons();
        if (chosenMode && gameState == "start") {
            startGame(chosenMode); 
        }

        updateCollisionVisual(collision);
    }

    // Updates the visual effect for collisions, changing the color of the car hitbox on collision.
    function updateCollisionVisual(collision) {
        $('#car-hitbox').css('background-color', collision ? 'rgba(0, 255, 0, 0.3)' : 'transparent');
    }

    // Starts the game, initializes obstacles, resets the car and lives, and updates the UI.
    function startGame(mode) {
        stopCar();
        gameState = mode;
        startTimer();

        $(".cone-obstacle, .dumpster-obstacle, .car-obstacle, .game-life").remove();
        $("#game-mode").text(mode.replace("-", " "));

        let numObstacles = 2;
        if (gameState == "hard-mode") {
            numObstacles = 3;
        }

        setTimeout(function () {
            $("#start-buttons").hide();
            $("#game-buttons").show();
            $("#lives-counter").show();

            resetCar(gameState);
            resetLives();

            for (let i = 0; i < numObstacles; i++) {
                const random1 = Math.floor(Math.random() * (850 - 150 + 1)) + 150;
                const random2 = Math.floor(Math.random() * (850 - 150 + 1)) + 150;
                createObstacle("cone", random1, random2);
            }

            for (let i = 0; i < numObstacles; i++) {
                const random1 = Math.floor(Math.random() * (800 - 150 + 1)) + 150;
                const random2 = Math.floor(Math.random() * (800 - 150 + 1)) + 150;
                createObstacle("dumpster", random1, random2);
            }

            for (let i = 0; i < numObstacles; i++) {
                const random1 = Math.floor(Math.random() * (800 - 150 + 1)) + 150;
                const random2 = Math.floor(Math.random() * (800 - 150 + 1)) + 150;
                createObstacle("car", random1, random2);
            }
        }, 700);

        if (mode == "easy-mode") {
            $("#easy-mode-button").css("background-color", "darkgreen");
        } else if (mode == "hard-mode") {
            $("#hard-mode-button").css("background-color", "darkred");
        }
        revertParkingSpot();
        updateSpot();
        startTimer();
        saveTime();
    }

    // Resets player lives based on the selected game mode.
    function resetLives() {
        if (gameState == "easy-mode") {
            lives = 5;
        } else if (gameState == "hard-mode") {
            // Less lives, faster, more obstacles
            lives = 3;
            playerData.maxForwardSpeed = 3;
            playerData.maxReverseSpeed = 2;
            playerData.rotationSpeed = 2.5;
        }
        for (let i = 0; i < lives; i++) {
            const life = document.createElement("div");
            life.classList.add("game-life");

            // Create an image element
            const lifeImg = document.createElement("img");
            lifeImg.src = "../img/hud/wrench-screwdriver.png";
            lifeImg.alt = "Life"; // Alt text for accessibility
            lifeImg.width = 40; // Adjust the size if needed

            // Append the image to the life div
            life.appendChild(lifeImg);
            $("#lives-counter").append(life);
        }
    }

    // Removes one life after a collision, and if all lives are lost, shows the losing screen.
    function removeLife() {
        if (gameState != "start") {
            let livesElements = $(".game-life");
            livesElements[lives - 1].remove();
            lives -= 1;
            if (lives == 0)  showLoseEndScreen();
        }
    }

    /*
    function resetGame(result) {
        if (result == "win") {
            displayMessage("You Win!", "green", "white");
        } else if (result == "lose") {
            displayMessage("You Lose!", "red", "white");
        }
        stopTimer();
        resetTimer();
        revertParkingSpot();
        startGame(gameState);
    }
    

    function displayMessage(message, bg, text) {
        $("#message").show();
        $("#message").text(message);
        $("#message").css({
            "background-color": bg,
            "color": text
        });
        setTimeout(function () {
            $("#message").hide();
        }, 900);
    }
    */

    // Creates a visual obstacle at random positions on the game screen.
    function createObstacle(type, x, y) {
        if (["dumpster", "cone", "car"].includes(type)) {
            const html = `<div class="${type}-obstacle" style="top: ${x}px; left: ${x}px;">
            <img class="${type}-img" src="img/obstacles/${type}.png" alt="${type}">
            <div class="${type}-hitbox"></div>
            </div>`
            $("#scroll-window").append(html);

            const obstacleClass = $(`.${type}-obstacle`);
            const obstacleHitboxes = $(`.${type}-hitbox`);

            const index = obstacleClass.length - 1;
            registerObstacle(obstacleHitboxes.eq(index), obstacleClass.eq(index));
        }
    }

    // Handle key down
    function handleKeyDown(e) {
        const key = e.key.toLowerCase();

        if (keys.hasOwnProperty(key) || keys.hasOwnProperty(e.code)) {
            keys[key] = true;
            keys[e.code] = true;
        }

        if (key === 'h') {
            toggleHeadlights($('#headlights'));
        }
    }

    // Handle key up
    function handleKeyUp(e) {
        const key = e.key.toLowerCase();

        if (keys.hasOwnProperty(key) || keys.hasOwnProperty(e.code)) {
            keys[key] = false;
            keys[e.code] = false;
        }
    }

    //Shows a congrats screen to user with their completion time as well as the ability to exit or play agin
    function showWinEndScreen(){
        stopTimer();
        const popUp = document.getElementById("endscreen-popup");
        popUp.style.visibility= "visible"; //shows it
        const congrats = document.getElementById("congrats");
        congrats.style.visibility= "visible";
        const totalTime = saveTime();
        const userTime = document.getElementById("userTime");
        userTime.style.visibility="visible";
        const userText = "You took "+ totalTime + " Seconds to Pass."
        userTime.textContent = userText;
    }
    
    //Shows a losing message to the user
    function showLoseEndScreen(){
        stopTimer();
        const popUp = document.getElementById("endscreen-popup");
        popUp.style.visibility= "visible"; //shows it
        const lost = document.getElementById("lost");
        lost.style.visibility= "visible";
        const lostMsg = document.getElementById("lostMsg");
        lostMsg.style.visibility= "visible";
    }

    //Hides the end of round popup
    function hideEndPopUp(){
        const popUp = document.getElementById("endscreen-popup");
        popUp.style.visibility="hidden";
        //win pop up values
        const congrats = document.getElementById("congrats");
        congrats.style.visibility= "hidden";
        const userTime = document.getElementById("userTime");
        userTime.style.visibility="hidden";
        //lost pop up values
        const lost = document.getElementById("lost");
        lost.style.visibility= "hidden";
        const lostMsg = document.getElementById("lostMsg");
        lostMsg.style.visibility= "hidden";
    }

    //Play again button on popup
    $("#play-again").on("click", function () {
        startGame(gameState);
        hideEndPopUp();
        resetTimer();
    });

    //Exit button on popup
    $("#exit").on("click", function () {
        gameState = 'start';

        $("#Subtitle").text("Group 8: Aman Singh, Julia O'Neill, Kyle Malice, Solenn Gacon, Suhas Bolledula");

        $("#lives-counter").hide();
        $("#game-buttons").hide();
        $(".cone-obstacle, .dumpster-obstacle, .car-obstacle, .game-life").remove();

        $("#start-buttons").show();
        $("#easy-mode-button").css("background-color", "green");
        $("#hard-mode-button").css("background-color", "red");
        startTimer();
        hideEndPopUp();
        stopTimer();
        revertParkingSpot();
        resetCar(gameState);
        resetTimer();
    });


    $("#exit-game-button").on("click", function () {
        gameState = 'start';

        $("#Subtitle").text("Group 8: Aman Singh, Julia O'Neill, Kyle Malice, Solenn Gacon, Suhas Bolledula");

        $("#lives-counter").hide();
        $("#game-buttons").hide();
        $(".cone-obstacle, .dumpster-obstacle, .car-obstacle, .game-life").remove();

        $("#start-buttons").show();
        $("#easy-mode-button").css("background-color", "green");
        $("#hard-mode-button").css("background-color", "red");
        revertParkingSpot();
        stopTimer();
        resetTimer();
        resetCar(gameState);
    });
});