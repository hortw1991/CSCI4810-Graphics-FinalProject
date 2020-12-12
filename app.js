"use strict";

import * as THREE from 'https://unpkg.com/three@0.120.0/build/three.module.js';


let container;      	        // keeping here for easy access
let scene, camera, renderer;    // Three.js rendering basics.
let ray;                        // A yellow "ray" from the barrel of the gun.
let rayVector;                  // The gun and the ray point from (0,0,0) towards this vector

let player, target, head;       //player model
let torch;                      //torch model (set as a single torch first)
let headBBoxHelper, headBBox;
let walls = [];                 //used for checking wall collisions

let collision = 0;
let cameraControls;
let overview = false;
let mousePos;

/**
 *  Creates the bouncing balls and the translucent cube in which the balls bounce,
 *  and adds them to the scene.  A light that shines from the direction of the
 *  camera's view is also bundled with the camera and added to the scene.
 */


function createWorld()
{
    renderer.setClearColor( 0 );  // black background
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(20, window.innerWidth/window.innerHeight, 1, 1000);

    /* Add the camera and a light to the scene, linked into one object. */
    let light = new THREE.DirectionalLight();
    light.position.set( 0, 0, 1);

    // camera.add(light);
    scene.add(new THREE.DirectionalLight(0x808080));

    let ground = new THREE.Mesh(
        new THREE.PlaneGeometry(200, 200),
        new THREE.MeshLambertMaterial({
            color: "white",
            map: makeTexture("resources/spookyGround.png")
        })
    );

    ground.rotation.x = -Math.PI/2;
    ground.position.y = -1;
    scene.add(ground);

    player = playerCreation();
    torch = torchCreation();

    /* Attach camera to a new 3D mesh to track the player */
    target = new THREE.Object3D;  // Could be used to track/follow the player 

    // Camera distance controls
    camera.position.set(0, 5, 80);
    camera.rotation.x = -Math.PI/10; //camera looks down a bit
    camera.lookAt( 0, 3, 0 );
    head.add(target);
    head.add(camera);
  
    /* Setup head BBOx for collision detection.  Will likely need addition boxes for smaller objects unless floating. */
    headBBoxHelper = new THREE.BoxHelper(head, 'white');
    scene.add(headBBoxHelper)
    headBBox = new THREE.Box3().setFromObject(headBBoxHelper);

    createOuterWalls();
    drawCanvas()


    
    const loader = new THREE.CubeTextureLoader();
    const texture = loader.load([
        'resources/skybox/posx.jpg',
        'resources/skybox/negx.jpg',
        'resources/skybox/posy.jpg',
        'resources/skybox/negy.jpg',
        'resources/skybox/posz.jpg',
        'resources/skybox/negz.jpg',
    ]);
    scene.background = texture;
    

} // end createWorld


function drawCanvas()
{
    // const lineMaterial = new THREE.LineBasicMaterial( {color: "orange"});
    // const points = [];
    // points.push( new THREE.Vector3( -100, -1, - ));
    // // points.push( new THREE.Vector3( 0, -1, 0 ));
    // points.push( new THREE.Vector3( 100, -1, 100 ));
    // const lineGeometry = new THREE.BufferGeometry().setFromPoints ( points );

    // const line = new THREE.Line( lineGeometry, lineMaterial );
    // scene.add(line);

    const vertices = [];

for ( let i = 0; i < 10000; i ++ ) {

	const x = THREE.MathUtils.randFloatSpread( 2000 );
	const y = THREE.MathUtils.randFloatSpread( 5 );
	const z = THREE.MathUtils.randFloatSpread( 2000 );

	vertices.push( x, y, z );

}

const geometry = new THREE.BufferGeometry();
geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( vertices, 3 ) );

const material = new THREE.PointsMaterial( { color: 0x888888 } );

const points = new THREE.Points( geometry, material );

scene.add( points );

}


function getCanvas()
{
  const borderSize = 2;
  const ctx = document.createElement('canvas').getContext('2d');
  const font =  `${4}px bold sans-serif`;
  ctx.font = font;
  // measure how long the name will be
  const doubleBorderSize = borderSize * 2;
  const width = 4;
  const height = 4;
  ctx.canvas.width = width;
  ctx.canvas.height = height;
 
  // need to set font again after resizing canvas
  ctx.font = font;
  ctx.textBaseline = 'top';
 
  ctx.fillStyle = 'blue';
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = 'white';
  ctx.fillText(borderSize, borderSize, borderSize);
 
  return ctx.canvas;
}



/**
 * Adds a boundary wall around the outside
 */
function createOuterWalls()
{
    // Overview for testing purposes
    changeCamera();
    // Material that the rest are cloned off of
    let g = new THREE.BoxGeometry(40, 20, 1);
    let m = new THREE.MeshBasicMaterial( {color: 0x00ff00} )
    let c1 = new THREE.Mesh(g, m);
    c1.position.z = -20;
    scene.add(c1);
    walls.push(c1);

    // Clone all boundaries off that boundary
    let northBoundary = c1.clone();
    northBoundary.position.z = -100;
    northBoundary.scale.x = 5;
    northBoundary.scale.y = 1;
    northBoundary.scale.z = 1;
    scene.add(northBoundary);
    walls.push(northBoundary);

    let southBoundary = northBoundary.clone();
    southBoundary.position.z = 100;
    scene.add(southBoundary);
    walls.push(southBoundary);

    let eastBoundary = northBoundary.clone();
    eastBoundary.position.x = 100;
    eastBoundary.position.z = 0;
    eastBoundary.rotateY(Math.PI/2);
    scene.add(eastBoundary);
    walls.push(eastBoundary);

    let westBoundary = eastBoundary.clone();
    westBoundary.position.x = -100;
    scene.add(westBoundary);
    walls.push(westBoundary)
}


/**
 * This is the function used to create the player model
 */
function playerCreation()
{
    //player head
    const headWidth = 2;
    const headHeight = 2;
    const headDepth = 2;
    const headGeometry = new THREE.BoxGeometry( headWidth, headHeight, headDepth);

    const headMaterial = new THREE.MeshPhongMaterial ( {color: 0xDB1E62} );

    head = new THREE.Mesh(headGeometry, headMaterial);
    scene.add(head);
    head.position.y = 7;

    //player body
    const bodyWidth = 3;
    const bodyHeight = 4;
    const bodyDepth = 1;

    const bodyGeometry = new THREE.BoxGeometry( bodyWidth, bodyHeight, bodyDepth );
    const bodyMaterial = new THREE.MeshPhongMaterial ( {color: 0xDB1E62} );

    let body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    head.add(body);
    body.position.y = -3;

    //arms
    const armWidth = 1;
    const armHeight = 4;
    const armDepth = 1;

    let armGeometry = new THREE.BoxGeometry( armWidth, armHeight, armDepth );
    let armMaterial = new THREE.MeshPhongMaterial ( {color: 0xDB1E62} );

    let armLeft = new THREE.Mesh(armGeometry, armMaterial);
    let armRight = new THREE.Mesh(armGeometry, armMaterial);

    body.add(armLeft);
    armLeft.position.x = -1.5;
    body.add(armRight);
    armRight.position.x = 1.5;

    //legs
    const legWidth = 1.3;
    const legHeight = 4;
    const legDepth = 1;

    let legGeometry = new THREE.BoxGeometry( legWidth, legHeight, legDepth );
    let legMaterial = new THREE.MeshPhongMaterial ( {color: 0xDB1E62} );

    let legLeft = new THREE.Mesh(legGeometry, legMaterial);
    let legRight = new THREE.Mesh(legGeometry, legMaterial);

    body.add(legLeft);
    legLeft.position.y = -3;
    legLeft.position.x = 0.75;

    body.add(legRight);
    legRight.position.y = -3;
    legRight.position.x = -0.75;

}//end of playerCreation

function torchCreation()
{
    const handleWidth = 0.5;
    const handleHeight = 3.5;
    const handleDepth = 0.5;

    const handleGeometry = new THREE.BoxGeometry( handleWidth, handleHeight, handleDepth);
    const handleMaterial = new THREE.MeshPhongMaterial ( {color: 0x6F4E16} );

    let handle = new THREE.Mesh(handleGeometry, handleMaterial);

    scene.add(handle);
    handle.position.z = 10;

    const cubeWidth = 1;
    const cubeHeight = 1;
    const cubeDepth = 1;

    const flameGeometry = new THREE.BoxGeometry( cubeWidth, cubeHeight, cubeDepth);
    const flameRedMaterial = glowRedShader();

    let flameRed = new THREE.Mesh(flameGeometry, flameRedMaterial);
    handle.add(flameRed);

    const flameYellMaterial = glowYellowShader();
    let flameYell = new THREE.Mesh(flameGeometry, flameYellMaterial);
    handle.add(flameYell);

    flameYell.position.y = 1.75;
    flameYell.rotation.y = 3*(Math.PI)/2;
    flameYell.rotation.x = Math.sin(2);
    flameYell.rotation.z = -Math.sin(2);
    flameRed.position.y = 1.75;

}

function glowRedShader()
{
    let     vShader = document.getElementById('vGlow').innerHTML;
    let     fShader = document.getElementById('fGlow').innerHTML;
    let     itemMaterial = new THREE.ShaderMaterial({
        uniforms:
            {

                "c": {type: "f", value: 1.0},
                "p": {type: "f", value: 1.4},
                glowColor:{type: "c", value: new THREE.Color(0xF35A31)},
                vVector:{type: "v3", value: camera.position},

            },

        vertexShader:   vShader,
        fragmentShader: fShader,
        side: THREE.FrontSide,
        blending: THREE.AdditiveBlending,
        transparent: true,

    });

    return itemMaterial;

}

function glowYellowShader()
{
    let     vShader = document.getElementById('vGlow').innerHTML;
    let     fShader = document.getElementById('fGlow').innerHTML;
    let     itemMaterial = new THREE.ShaderMaterial({
        uniforms:
            {

                "c": {type: "f", value: 1.0},
                "p": {type: "f", value: 1.4},
                glowColor:{type: "c", value: new THREE.Color(0xE2EF17)},
                vVector:{type: "v3", value: camera.position},

            },

        vertexShader:   vShader,
        fragmentShader: fShader,
        side: THREE.FrontSide,
        blending: THREE.AdditiveBlending,
        transparent: true,

    });

    return itemMaterial;

}
/**
 * Checks for collisions against the walls of the maze.
 */
function checkWallCollisions(x, y, z)
{
    headBBoxHelper.update();
    headBBox.setFromObject(headBBoxHelper);

    for (let i = 0; i < walls.length; i++)
    {
        // console.log(walls[i]);
        let wallBBoxHelper = new THREE.BoxHelper(walls[i], 'red');
        scene.add(wallBBoxHelper);
        // let wallBBox = new THREE.Box3();
        // wallBBox.setFromObject(wallBBoxHelper);
        head.updateMatrixWorld();
        walls[i].updateMatrixWorld();

        let headPos = head.geometry.boundingBox.clone();
        headPos.applyMatrix4(head.matrixWorld);
        headPos.applyMatrix4(new THREE.Matrix4().makeTranslation(x,y,z))

        let wallPos = walls[i].geometry.boundingBox.clone();
        wallPos.applyMatrix4(walls[i].matrixWorld);

        if (headPos.intersectsBox(wallPos))
        {
            /**
             * set up so if you run into anything the torch collection goes up
             *  needs to be set up for the torch system.
             * **/
            collision++;
            return true;
        }
        scene.remove(wallBBoxHelper);
        // return false;

        // console.log(headBBox.intersectsBox(wallBBox))
    }

    return false;
}  // checkWallCollisions


/**
 *  When an animation is in progress, this function is called just before rendering each
 *  frame of the animation.
 */
function updateForFrame()
{
    let time = clock.getElapsedTime(); // time, in seconds, since clock was created
    let timeFloor = Math.floor(time); //for testing timer going up
    let timeCeiling = Math.ceil(time); //for the count down

    /**
     * For this section this is where we are going transfer
     * time left in the game/progression to the player
     * so that they can see a count down
     **/

    document.getElementById("timeLeft").innerHTML = "" + timeFloor;
    document.getElementById("collected").innerHTML = "" + collision;
}


/**
 *  Render the scene.  This is called for each frame of the animation, after updating
 *  the position and velocity data of the balls.
 */
function render()
{
    renderer.render(scene, camera);
}


/**
 *  Creates and returns a Texture object that will read its image from the
 *  specified URL. If the second parameter is provided, the texture will be
 *  applied to the material when the
 */
function makeTexture( imageURL, material )
{
    function callback()
    {
        if (material) {
            material.map = texture;
            material.needsUpdate = true;
        }
        // not necessary to call render() since the scene is continually updating.
    }
    let loader = new THREE.TextureLoader();
    let texture = loader.load(imageURL, callback);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat = new THREE.Vector2(10,10);
    texture.anisotropy = renderer.getMaxAnisotropy();
    return texture;
}


function changeCamera() 
{
    if (overview)
    {
        overview = false;
        camera.position.set(0, 5, 80);
        camera.rotation.x = -Math.PI/10; //camera looks down a bit
        camera.lookAt( 0, 3, 0 )
    }
    else
    {
        overview = true;
        camera.position.set(0, 600, 0);
        camera.lookAt(0, 0, 0);
    }
}


//----------------------------- mouse and key support -------------------------------

// Prints mouse click locations in the top down view
function doMouseDown(event)
{
    let vector = new THREE.Vector3();
    vector.set(
        (event.clientX / window.innerWidth) * 2 - 1,
        - (event.clientY / window.innerHeight) * 2 + 1,
        0
    );
    vector.unproject(camera);
    console.log(vector);
}


function doMouseMove(evt)
{
/*
    let fn = "[doMouseMove]: ";
    console.log( fn )    let x = evt.clientX;
    let y = evt.clientY;
    // mouse was moved to (x,y)
    let rotZ = 5*Math.PI/6 * (window.innerWidth/2 - x)/window.innerWidth;
    let rotX = 5*Math.PI/6 * (y - window.innerHeight/2)/window.innerHeight;
    let rcMatrix = new THREE.Matrix4(); // The matrix representing the gun rotation,
    rayVector = new THREE.Vector3(0,1,0);  // Untransformed rayVector
    rayVector.applyMatrix4(rcMatrix);  // Apply the rotation matrix
    ray.geometry.vertices[1].set(rayVector.x*100,rayVector.y*100,rayVector.z*100);
    ray.geometry.verticesNeedUpdate = true;
*/
}


function doKeyDown( event )
{
    // let fn = "[doKeyDown]: ";
    // console.log( fn + "Key pressed with code " + event.key );
    // https://www.cambiaresearch.com/articles/15/javascript-char-codes-key-codes

    //this will be for movement of player model
    const code = event.key;
    // console.log("Key pressed with code " + code);
    let rot = 0.1;
    if( code === 'a' || code === 'ArrowLeft' )           // 'a' and 'left arrow'
    {
        head.rotateY(Math.PI/25);
        headBBoxHelper.update();
    }
    else if( code === 'd' || code === 'ArrowRight' )     // 'd' and 'right arrow'
    {
        head.rotateY(-Math.PI/25);
        headBBoxHelper.update();
    }
    /* These alter how close you can get to the maze */
    else if (code == 'w' || code == 'ArrowUp')
    {
        if (checkWallCollisions(0, 0, -1.5) || checkWallCollisions(1, 0, 0) || checkWallCollisions(-1, 0, 0))
        {
            for (let i = 0 ; i < 20; i++)
            {
                head.translateZ(0.25);
            }
        }
        else 
        {
            head.translateZ(-1);
        }
    }
    else if (code == 'q')
    {
        if (checkWallCollisions(0, 0, -2.5) || checkWallCollisions(1, 0, 0) || checkWallCollisions(-1, 0, 0))
        {
            for (let i = 0 ; i < 20; i++)
            {
                head.translateZ(0.25);
            }
        }
        else 
        {
            head.translateZ(-2);
        }
    }
    else if (code == '=')
    {
        changeCamera();
    }
    // else if (code == 's' || code == 'ArrowDown')
    // {    
    //     if (checkWallCollisions(-4))
    //     {
    //         head.translateZ(-2);
    //         console.log('Cannot move backwards')
    //     }
    //     else 
    //     {
    //         head.translateZ(1);
    //     }
    // }

}

//--------------------------- animation support -----------------------------------

let clock;  // Keeps track of elapsed time of animation.

function doFrame()
{
    updateForFrame();
    // checkWallCollisions();
    render();
    requestAnimationFrame(doFrame);
}

//----------------------- respond to window resizing -------------------------------

/* When the window is resized, we need to adjust the aspect ratio of the camera.
 * We also need to reset the size of the canvas that used by the renderer to
 * match the new size of the window.
 */
function doResize()
{
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix(); // Need to call this for the change in aspect to take effect.
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function createRenderer()
{
    //renderer = new THREE.WebGLRenderer();
    renderer = new THREE.WebGLRenderer( { antialias: true } );
    // we set this according to the div container.
    renderer.setSize( container.clientWidth, container.clientHeight );
    renderer.setClearColor( 0x000000, 1.0 );
    container.appendChild( renderer.domElement );  // adding 'canvas; to container here
    // render, or 'create a still image', of the scene
}

//----------------------------------------------------------------------------------

/**
 *  This init() function is called when by the onload event when the document has loaded.
 */
function init()
{
    container = document.querySelector('#scene-container');

    // Create & Install Renderer ---------------------------------------
    createRenderer();
    mousePos = new THREE.Vector2();


    window.addEventListener( 'resize', doResize );  // Set up handler for resize event
    document.addEventListener("keydown",doKeyDown);
    window.addEventListener(    "mousedown",doMouseDown );
    window.addEventListener(    "mousemove",doMouseMove );

    createWorld();

    clock = new THREE.Clock(); // For keeping time during the animation.


    requestAnimationFrame(doFrame);  // Start the animation.

}

init()

