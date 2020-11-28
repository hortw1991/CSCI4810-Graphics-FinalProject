"use strict";

let container;      	        // keeping here for easy access
let scene, camera, renderer;    // Three.js rendering basics.
let gun;                        // The gun, which can be "aimed" by the mouse.
let gunbase;                    // The cylinder at the base of the gun; the gun is a child of this cylinder.
let ray;                        // A yellow "ray" from the barrel of the gun.
let rayVector;                  // The gun and the ray point from (0,0,0) towards this vector
                                //        (in the local coordinate system of the gunbase).
let gunRotateY = 0;             // Amount by which gun is rotated around the y-axis
                                //    (carrying the camera with it).

/**
 *  Creates the bouncing balls and the translucent cube in which the balls bounce,
 *  and adds them to the scene.  A light that shines from the direction of the
 *  camera's view is also bundled with the camera and added to the scene.
 */
function createWorld()
{
    renderer.setClearColor( 0 );  // black background
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45, window.innerWidth/window.innerHeight, 1, 1000);

    /* Add the camera and a light to the scene, linked into one object. */
    let light = new THREE.DirectionalLight();
    light.position.set( 0, 0, 1);
    camera.position.set(0, 40, 100);
    camera.rotation.x = -Math.PI/9; //camera looks down a bit
    camera.add(light);
    scene.add(new THREE.DirectionalLight(0x808080));

    let ground = new THREE.Mesh(
        new THREE.PlaneGeometry(100, 100),
        new THREE.MeshLambertMaterial({
            color: "white",
            map: makeTexture("resources/wall-grey.jpg")
        })
    );
    ground.rotation.x = -Math.PI/2;
    ground.position.y = -1;
    scene.add(ground);

    let gunmat = new THREE.MeshLambertMaterial({
        color: 0xaaaaff
    });
    gun = new THREE.Mesh(new THREE.SphereGeometry(1.5,16,8),gunmat);
    let barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.3,0.7,5,16), gunmat);
    barrel.position.y = 2.5;
    gun.add(barrel);
    gunbase = new THREE.Mesh(new THREE.CylinderGeometry(3,3,0.5,32), gunmat);

    let linegeom = new THREE.Geometry();
    linegeom.vertices.push(new THREE.Vector3(0,0,0));
    linegeom.vertices.push(new THREE.Vector3(0,100,0));
    ray = new THREE.Line( linegeom, new THREE.LineBasicMaterial({
        color: 0xffaa00,
        linewidth: 3
    }));

    gunbase.add(ray);
    gunbase.add(camera);
    gunbase.add(gun);
    scene.add(gunbase);

} // end createWorld


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

    let x = evt.clientX;
    let y = evt.clientY;
    // mouse was moved to (x,y)
    let rotZ = 5*Math.PI/6 * (window.innerWidth/2 - x)/window.innerWidth;
    let rotX = 5*Math.PI/6 * (y - window.innerHeight/2)/window.innerHeight;
    gun.rotation.set(rotX,0,rotZ);
    let rcMatrix = new THREE.Matrix4(); // The matrix representing the gun rotation,
                                        //    so we can apply it to the ray direction.
    rcMatrix.makeRotationFromEuler(gun.rotation); // Get the rotation, as a matrix.
    rayVector = new THREE.Vector3(0,1,0);  // Untransformed rayVector
    rayVector.applyMatrix4(rcMatrix);  // Apply the rotation matrix
    ray.geometry.vertices[1].set(rayVector.x*100,rayVector.y*100,rayVector.z*100);
    ray.geometry.verticesNeedUpdate = true;
}

function doKeyDown( event )
{
    let fn = "[doKeyDown]: ";
    console.log( fn + "Key pressed with code " + event.key );
    // https://www.cambiaresearch.com/articles/15/javascript-char-codes-key-codes

    const code = event.key;
    // console.log("Key pressed with code " + code);
    let rot = 0;
    if( code === 'a' || code === 'ArrowLeft' )           // 'a' and 'left arrow'
    {
        rot = 0.02;
    }
    else if( code === 'd' || code === 'ArrowRight' )     // 'd' and 'right arrow'
    {
        rot = -0.02;
    }
    if( event.shiftKey )                                  // 'shift'
        rot *= 5;
    if( rot !== 0 )
    {
        gunRotateY += rot;
        gunbase.rotation.y = gunRotateY;
        event.stopPropagation();          // *** MH
    }
}

//--------------------------- animation support -----------------------------------

let clock;  // Keeps track of elapsed time of animation.

function doFrame()
{
    updateForFrame();
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

