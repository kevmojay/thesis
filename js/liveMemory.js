'use strict'

//Temporary rederer stats for dev
var rendererStats = new THREEx.RendererStats();

var scene,
  renderer,
  pointLight,
  controls,
  camera,
  count,
  graphYPoint,
  graphXPoint,
  prevGraphYPoint,
  prevGraphXPoint,
  ran,
  prevRan,
  g_memPts,
  memGraph,
  spritey;



//Creates text sprite to append to end of graph
function makeTextSprite(message, parameters) {
  if (parameters === undefined) parameters = {};

  var fontface = parameters.hasOwnProperty("fontface") ?
    parameters["fontface"] : "Arial";

  var fontsize = parameters.hasOwnProperty("fontsize") ?
    parameters["fontsize"] : 18;

  var borderThickness = parameters.hasOwnProperty("borderThickness") ?
    parameters["borderThickness"] : 4;

  var borderColor = parameters.hasOwnProperty("borderColor") ?
    parameters["borderColor"] : {
      r: 0,
      g: 0,
      b: 0,
      a: 1.0
    };

  var backgroundColor = parameters.hasOwnProperty("backgroundColor") ?
    parameters["backgroundColor"] : {
      r: 255,
      g: 255,
      b: 255,
      a: 1.0
    };

  //var spriteAlignment = THREE.SpriteAlignment.topLeft;

  var canvas = document.createElement('canvas');
  var context = canvas.getContext('2d');
  context.font = "Bold " + fontsize + "px " + fontface;

  // get size data (height depends only on font size)
  var metrics = context.measureText(message);
  var textWidth = metrics.width;

  // background color
  context.fillStyle = "rgba(" + backgroundColor.r + "," + backgroundColor.g + "," + backgroundColor.b + "," + backgroundColor.a + ")";
  // border color
  context.strokeStyle = "rgba(" + borderColor.r + "," + borderColor.g + "," + borderColor.b + "," + borderColor.a + ")";

  context.lineWidth = borderThickness;
  //roundRect(context, borderThickness/2, borderThickness/2, textWidth + borderThickness, fontsize * 1.4 + borderThickness, 6);
  // 1.4 is extra height factor for text below baseline: g,j,p,q.

  // text color
  context.fillStyle = "rgba(0, 0, 0, 1.0)";

  context.fillText(message, borderThickness, fontsize + borderThickness);

  // canvas contents will be used for a texture
  var texture = new THREE.Texture(canvas)
  texture.needsUpdate = true;

  var spriteMaterial = new THREE.SpriteMaterial({
    color: 0x666666,
    map: texture
  });
  var sprite = new THREE.Sprite(spriteMaterial);
  sprite.scale.set(100, 50, 1.0);
  return sprite;
}

//Driver for application and inital setup
function init() {

  rendererStats.domElement.style.position = 'absolute';
  rendererStats.domElement.style.left = '0px';
  rendererStats.domElement.style.bottom = '0px';
  document.body.appendChild(rendererStats.domElement);

  graphYPoint = 0;
  buildScene();
  initGraph();
  updateGraph();
  setInterval(function() {
    getMem();
    updateGraph();
  }, 1000);
  render();
}

//Builds the initial scene
function buildScene() {
  var hemLight,
    axisHelper,
    spotLight,
    sphere;

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 9999999999);
  pointLight = new THREE.PointLight(0xfffff, 1, 300);
  hemLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 1);
  renderer = new THREE.WebGLRenderer();
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  axisHelper = new THREE.GridHelper(100000, 100);
  sphere = new THREE.SphereGeometry(10, 16, 8);

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0xBBBBBBB);
  document.body.appendChild(renderer.domElement);

  pointLight.add(new THREE.Mesh(sphere,
    new THREE.MeshBasicMaterial({
      color: 0xff0040
    })));

  spritey = makeTextSprite(Math.floor(graphYPoint).toString() + '%', {
    fontsize: 24,
    borderColor: {
      r: 255,
      g: 0,
      b: 0,
      a: 1.0
    },
    backgroundColor: {
      r: 255,
      g: 100,
      b: 100,
      a: 0.8
    }
  });

  spritey.position.set(graphXPoint + 50, graphYPoint, 0);
  scene.add(spritey);
  scene.add(axisHelper);
  scene.add(hemLight);

  camera.position.z = 200;
  camera.position.y = 100;
  camera.position.x = 100;
  camera.rotation.x = 0;
  camera.rotation.y = -100;

  //Adds a pointlight to the camera so the light is always relative to where
  //the camera is
  scene.add(camera);
  camera.add(pointLight);
}

//Retrieves the memory from API
function getMem() {

  $.getJSON("http://107.170.193.27:4567/results/thesis/CPU", function(json) {
    prevRan = ran;
    var v = json.check.output;
    var arr = v.split(": ");
    console.log(arr);
    var arr2 = arr[1].split("%");
    console.log(arr2[0]);
    graphYPoint = Number(arr2[0]);
    return;
  });


  //  graphYPoint = Math.random() * 100;
  return;
}


function initGraph() {
  graphXPoint = 0;
  prevGraphXPoint = 0;
  count = 0;
  ran = Math.random() * 100;
  prevRan = 0;
  g_memPts = [
    []
  ];
}


function updateGraph(temp) {
  var sizeOfArr,
    prevXPt,
    memShape,
    memExtrudeSettings,
    memExtrude,
    numToRemove;

  //Removes the previous graph. Prevents graphs from stacking on top of e/o
  scene.remove(memGraph);

  //Set distance between points
  graphXPoint += 50;

  //Generates all verticies for graph
  g_memPts.push([graphXPoint, graphYPoint]);

  memShape = new THREE.Shape();
  memShape.moveTo(1, 1);

  //Adds all points to the shape
  for (let i = 0; i < g_memPts.length; i++) {
    memShape.lineTo(g_memPts[i][0], g_memPts[i][1]);
  }

  //This point brings the point to the floor
  memShape.lineTo(graphXPoint, 0);

  memExtrudeSettings = {
    amount: 8,
    bevelEnabled: true,
    bevelSegments: 2,
    steps: 2,
    bevelSize: 1,
    bevelThickness: 10
  };
  memExtrude = new THREE.ExtrudeGeometry(memShape, memExtrudeSettings);

  memGraph = new THREE.Mesh(memExtrude,
    new THREE.MeshPhongMaterial({
      side: THREE.DoubleSide,
      color: 0x008080,
      wireframe: false
    })
  );

  //updates camera to move along with the graph
  camera.position.x = camera.position.x + 50;

  //scene.remove( spritey );

  spritey = makeTextSprite(Math.floor(graphYPoint).toString() + '%', {
    fontsize: 24,
    borderColor: {
      r: 255,
      g: 0,
      b: 0,
      a: 1.0
    },
    backgroundColor: {
      r: 255,
      g: 100,
      b: 100,
      a: 0.8
    }
  });
  spritey.position.set(graphXPoint + 50, graphYPoint, 0);

  scene.add(spritey);
  scene.add(memGraph);
}

var render = function() {
  rendererStats.update(renderer);
  requestAnimationFrame(render);

  renderer.render(scene, camera);

}
