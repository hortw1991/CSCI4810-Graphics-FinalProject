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

let cameraControls;

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

    // Camera distance controls
    camera.position.set(0, 20, 80);
    camera.rotation.x = -Math.PI/10; //camera looks down a bit
    // camera.add(light);
    scene.add(new THREE.DirectionalLight(0x808080));

    let ground = new THREE.Mesh(
        new THREE.PlaneGeometry(200, 200),
        new THREE.MeshLambertMaterial({
            color: "white",
            map: makeTexture("resources/wall-grey.jpg")
        })
    );

    ground.rotation.x = -Math.PI/2;
    ground.position.y = -1;
    scene.add(ground);

    player = playerCreation();
    torch = torchCreation();

    /* Attach camera to a new 3D mesh to track the player */
    target = new THREE.Object3D;
    head.add(target);
    head.add(camera);
    
    /* Setup head BBOx for collision detection.  Will likely need addition boxes for smaller objects unless floating. */
    headBBoxHelper = new THREE.BoxHelper(head, 'white');
    scene.add(headBBoxHelper)
    headBBox = new THREE.Box3().setFromObject(headBBoxHelper);

    /* TEST CODE */
    let g = new THREE.BoxGeometry(40, 40, 20);
    let m = new THREE.MeshBasicMaterial( {color: 0x00ff00} )
    let c = new THREE.Mesh(g, m);
    c.position.z = -20;
    scene.add(c);
    walls.push(c);

    {
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
    }

} // end createWorld


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
            return true;
        }
        return false;

        // console.log(headBBox.intersectsBox(wallBBox))
    }

}  // checkWallCollisions


/**
 *  When an animation is in progress, this function is called just before rendering each
 *  frame of the animation.
 */
function updateForFrame()
{
    let time = clock.getElapsedTime(); // time, in seconds, since clock was created
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


//----------------------------- mouse and key support -------------------------------
function doMouseDown(evt)
{
    let fn = "[doMouseDown]: ";
    console.log( fn );

    let x = evt.clientX;
    let y = evt.clientY;
    console.log("Clicked mouse at " + x + "," + y);
}


function doMouseMove(evt)
{
    let fn = "[doMouseMove]: ";
    console.log( fn );
/*
    let x = evt.clientX;
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

    window.addEventListener( 'resize', doResize );  // Set up handler for resize event
    document.addEventListener("keydown",doKeyDown);
    window.addEventListener(    "mousedown",doMouseDown );
    window.addEventListener(    "mousemove",doMouseMove );

    createWorld();

    clock = new THREE.Clock(); // For keeping time during the animation.


    requestAnimationFrame(doFrame);  // Start the animation.

}

init()

