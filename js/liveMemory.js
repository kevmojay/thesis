'use strict'

var scene,
    renderer,
    pointLight,
    controls,
    camera,
    time,
    timeNow,
    date,
    updateTime,
    count,
    graphYPoint,
    graphXPoint,
    prevGraphYPoint,
    prevGraphXPoint,
    ran,
    prevRan,
    g_memPts,
    spritey;


    function makeTextSprite( message, parameters )
    {
    	if ( parameters === undefined ) parameters = {};

    	var fontface = parameters.hasOwnProperty("fontface") ?
    		parameters["fontface"] : "Arial";

    	var fontsize = parameters.hasOwnProperty("fontsize") ?
    		parameters["fontsize"] : 18;

    	var borderThickness = parameters.hasOwnProperty("borderThickness") ?
    		parameters["borderThickness"] : 4;

    	var borderColor = parameters.hasOwnProperty("borderColor") ?
    		parameters["borderColor"] : { r:0, g:0, b:0, a:1.0 };

    	var backgroundColor = parameters.hasOwnProperty("backgroundColor") ?
    		parameters["backgroundColor"] : { r:255, g:255, b:255, a:1.0 };

    	//var spriteAlignment = THREE.SpriteAlignment.topLeft;

    	var canvas = document.createElement('canvas');
    	var context = canvas.getContext('2d');
    	context.font = "Bold " + fontsize + "px " + fontface;

    	// get size data (height depends only on font size)
    	var metrics = context.measureText( message );
    	var textWidth = metrics.width;

    	// background color
    	context.fillStyle   = "rgba(" + backgroundColor.r + "," + backgroundColor.g + ","
    								  + backgroundColor.b + "," + backgroundColor.a + ")";
    	// border color
    	context.strokeStyle = "rgba(" + borderColor.r + "," + borderColor.g + ","
    								  + borderColor.b + "," + borderColor.a + ")";

    	context.lineWidth = borderThickness;
    //	roundRect(context, borderThickness/2, borderThickness/2, textWidth + borderThickness, fontsize * 1.4 + borderThickness, 6);
    	// 1.4 is extra height factor for text below baseline: g,j,p,q.

    	// text color
    	context.fillStyle = "rgba(0, 0, 0, 1.0)";

    	context.fillText( message, borderThickness, fontsize + borderThickness);

    	// canvas contents will be used for a texture
    	var texture = new THREE.Texture(canvas)
    	texture.needsUpdate = true;

    	var spriteMaterial = new THREE.SpriteMaterial(
    		{ color: 0x666666, map: texture} );
    	var sprite = new THREE.Sprite( spriteMaterial );
    	sprite.scale.set(100,50,1.0);
    	return sprite;
    }


function init(){
  date = new Date();
  updateTime = 3;
  graphYPoint = 0;
 time = date.getTime();
  buildScene();
  initGraph();
  updateGraph();
  setInterval(function(){  getMem(); updateGraph(false); }, 1000);
  render();

}

function buildScene() {
  var hemLight,
      axisHelper,
      sphere;

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 100, 2000 );
  pointLight = new THREE.HemisphereLight(0x00000, 10000000, 1000, new THREE.Vector3(100,300,100));
  hemLight = new THREE.HemisphereLight(0x66666, 0x666666, 100000000);
  renderer = new THREE.WebGLRenderer();
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  axisHelper = new THREE.GridHelper( 100000, 100 );
  sphere = new THREE.SphereGeometry( 0.5, 16, 8 );

  renderer.setSize( window.innerWidth, window.innerHeight );
  renderer.setClearColor( 0xBBBBBBB);
  document.body.appendChild( renderer.domElement );

  pointLight.add( new THREE.Mesh( sphere, new THREE.MeshBasicMaterial( { color: 0xff0040 } ) ) );
  spritey = makeTextSprite( Math.floor(graphYPoint).toString()+'%',
  		{ fontsize: 24, borderColor: {r:255, g:0, b:0, a:1.0}, backgroundColor: {r:255, g:100, b:100, a:0.8} } );
  	spritey.position.set(graphXPoint+50,graphYPoint,0);
  	scene.add( spritey );
  scene.add( axisHelper );
  scene.add(hemLight);
  scene.add(pointLight);

  camera.position.z = 200;
  camera.position.y = 100;
  camera.position.x = 100;
  camera.rotation.x = 0;
  camera.rotation.y = -100;
}

function getMem(){
  $.getJSON( "http://107.170.193.27:4567/results/test/cpu_usage", function( json ) {
    prevRan = ran;
    var v = json.check.output;
    var arr = v.split(": ");
    console.log(arr);
    var arr2 = arr[1].split("%");
        console.log(arr2);
    graphYPoint = arr2[0];
    return;
   });

//graphYPoint = Math.random() * 100;
return;
}

function initGraph(){
  graphXPoint = 0;
  prevGraphXPoint = 0;
  count = 0;
  ran = Math.random() * 100;
  prevRan = 0;
  g_memPts = [];
  g_memPts.push( new THREE.Vector2 ( 0, 0) );
  g_memPts.push( new THREE.Vector2 ( 0, 0) );
}

function updateGraph(temp){
  var sizeOfArr,
      prevXPt,
      memShape,
    //  memGeo
      memGraph,
      memExtrudeSettings,
      memExtrude,
      numToRemove;

graphXPoint += 50;
  if(temp == true){
    numToRemove = 2;
  }
  else{
    numToRemove = 0;
  }

  ran = Math.random() * 100;
  sizeOfArr = g_memPts.length;
  prevXPt = g_memPts[Math.round((sizeOfArr - 1) / 2)].x;

  g_memPts.splice(sizeOfArr/2, numToRemove, new THREE.Vector2(graphXPoint, 0), new THREE.Vector2(graphXPoint, graphYPoint));
   //g_memPts.splice(sizeOfArr/2, 0, new THREE.Vector2(Number(prevXPt)+50, 0), new THREE.Vector2(Number(prevXPt)+50, (Math.random() * 100)));

   memShape = new THREE.Shape( g_memPts );
   //memGeo = new THREE.ShapeGeometry( memShape );
   memExtrudeSettings = { amount: 8, bevelEnabled: true, bevelSegments: 2, steps: 2, bevelSize: 1, bevelThickness: 10 };
   memExtrude= new THREE.ExtrudeGeometry( memShape, memExtrudeSettings );

   memGraph = new THREE.Mesh(memExtrude, new THREE.MeshPhongMaterial( {color: 0x000000, wireframe: false}));
camera.position.x = camera.position.x + 50;
scene.remove( spritey );
spritey = makeTextSprite( Math.floor(graphYPoint).toString()+'%',
		{ fontsize: 24, borderColor: {r:255, g:0, b:0, a:1.0}, backgroundColor: {r:255, g:100, b:100, a:0.8} } );
	spritey.position.set(graphXPoint+50,graphYPoint,0);
	scene.add( spritey );
    scene.add(memGraph);
}

function animMemGraph(pt){
  var sizeOfArr = g_memPts.length;

  var prevXPt = g_memPts[Math.round((sizeOfArr - 1) / 2)].x;

 g_memPts.splice(sizeOfArr/2, 2, new THREE.Vector2(graphAnim, 0), new THREE.Vector2(graphAnim, pt));
   //g_memPts.splice(sizeOfArr/2, 0, new THREE.Vector2(Number(prevXPt)+50, 0), new THREE.Vector2(Number(prevXPt)+50, (Math.random() * 100)));

   //for( var i = 0; i < g_memPts.length; i ++ ) g_memPts[ i ].multiplyScalar( 0.25 );
   memShape = new THREE.Shape( g_memPts );
   geometry = new THREE.ShapeGeometry( memShape );
   //var mesh = new THREE.Mesh( geometry, new THREE.MeshLambertMaterial( {color: 0xFF0000, wireframe: true} ) );
   extrudeSettings = { amount: 8, bevelEnabled: true, bevelSegments: 2, steps: 2, bevelSize: 1, bevelThickness: 10 };
   extrude= new THREE.ExtrudeGeometry( memShape, extrudeSettings );

   memGraph = new THREE.Mesh(extrude, new THREE.MeshPhongMaterial( {color: 0x000000, wireframe: false}));

   //camera.position.x = camera.position.x + 50;
}



var render = function() {
requestAnimationFrame( render );
  /*
  date = new Date();
  timeNow = date.getTime();


  requestAnimationFrame( render );
  var timePercentage = (timeNow - time)/(updateTime*1000);
console.log(timePercentage);
  graphXPoint = prevGraphXPoint+(timePercentage*(prevGraphXPoint+500-prevGraphXPoint));

  graphYPoint = prevRan+(timePercentage*(ran-prevRan));
  //graphYPoint = prevRan;

  updateGraph(true);


  camera.position.x = prevGraphXPoint+(timePercentage*(prevGraphXPoint+500-prevGraphXPoint));

  if(timeNow-time >= updateTime*1000){
    console.log('second');
    date = new Date();
    time = date.getTime();
    prevGraphXPoint = graphXPoint;
    console.log(graphYPoint);
    getMem();
    updateGraph(false);
  }*/
	renderer.render(scene, camera);

//  controls.update();
}
