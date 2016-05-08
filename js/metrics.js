'use strict'
var scene,
  camera,
  hemLight,
  renderer,
  controls,
  points,
  octree,
  spritey,
  parentMesh,
  graphTWidth,
  raycaster,
  font;

var mouse = {
  x: 0,
  y: 0
};
var intersected;
var finalCubeObjects = [];
var baseColor = 0x333333;
var intersectColor = 0x00D66B;
var clusterPos = [];
var prevY = 0;

graphTWidth = 0;


var mergedGraphs = [];

function init() {
  buildScene();
  render();
  update();
}



function addControls() {
  var checkbox = document.createElement('input');
  checkbox.type = "checkbox";
  checkbox.name = "name";
  checkbox.value = "value";
  checkbox.id = "id";
  checkbox.onclick = "buildGraphTest()";

  var label = document.createElement('label')
  label.htmlFor = "id";
  label.appendChild(document.createTextNode('text for label after checkbox'));

  var container = document.getElementById('options');
  container.appendChild(checkbox);
  container.appendChild(label);
}

//Creates text sprite to append to end of graph
function makeTextSprite(message, parameters, scale) {
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
  sprite.scale.set(scale, scale, 1.0);
  return sprite;
}

function buildScene() {
  var axisHelper,
    pointLight,
    pointLight2,
    pointLight3,
    pointLight4,
    sphere;

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 999999999999);
  hemLight = new THREE.HemisphereLight(0xFFFFFF, 0xFFFFFF, .5);

  pointLight = new THREE.PointLight(0xfffff, 8.5, 0);
  pointLight2 = new THREE.PointLight(0xfffff,8.5, 0);
  pointLight3 = new THREE.PointLight(0xfffff, 8.5, 0);
  pointLight4 = new THREE.PointLight(0xfffff, 8.5, 0);
  renderer = new THREE.WebGLRenderer();

  axisHelper = new THREE.GridHelper(100000, 100);
  sphere = new THREE.SphereGeometry(100, 160, 80);

  // var light = new THREE.AmbientLight(0x404040); // soft white light
  // //
  // pointLight.add(new THREE.Mesh(sphere,
  //   new THREE.MeshBasicMaterial({
  //     color: 0x222345
  //   })));
  // pointLight2.add(new THREE.Mesh(sphere,
  //   new THREE.MeshBasicMaterial({
  //     color: 0xff0040
  //   })));
  // pointLight3.add(new THREE.Mesh(sphere,
  //   new THREE.MeshBasicMaterial({
  //     color: 0x880040
  //   })));
  // pointLight4.add(new THREE.Mesh(sphere,
  //   new THREE.MeshBasicMaterial({
  //     color: 0xaa0040
  //   })));

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0xBBBBBB);
  document.body.appendChild(renderer.domElement);
  renderer.domElement.addEventListener('mousemove', onDocumentMouseMove, false);
  raycaster = new THREE.Raycaster();

  camera.position.z = 3000;
  camera.position.y = 0;
  camera.position.x = -4000;
  camera.rotation.x = 0;
  camera.rotation.y = 1000;
  camera.rotation.z = -Math.PI / 2;
  camera.up.set(0, 0, 1);
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  //controls = new THREE.FirstPersonControls(camera, renderer.domElement);

  pointLight.position.set(0, 100, 0);
  pointLight2.position.set(50000, 10000, 0);
  pointLight3.position.set(50000, -10000, 0);
  pointLight4.position.set(100000, 100, 0);


  scene.add(camera);
  scene.add(hemLight);
 scene.add(pointLight);
  // scene.add(pointLight2);
  // scene.add(pointLight3);
  scene.add(pointLight4);
//  scene.add(light);
}

function createGrid(opts) {
  var line;
  var config = opts || {
    height: 500,
    width: 500,
    linesHeight: 10,
    linesWidth: 10,
    color: 0xDD006C
  };

  var material = new THREE.LineBasicMaterial({
    color: config.color,
    opacity: 0.2
  });

  var gridObject = new THREE.Object3D(),
    gridGeo = new THREE.Geometry(),
    stepw = 2 * config.width / config.linesWidth,
    steph = 2 * config.height / config.linesHeight;

  //width
  for (var i = -config.width; i <= config.width; i += stepw) {
    gridGeo.vertices.push(new THREE.Vector3(-config.height, i, 0));
    gridGeo.vertices.push(new THREE.Vector3(config.height, i, 0));

  }
  //height
  for (var i = -config.height; i <= config.height; i += steph) {
    gridGeo.vertices.push(new THREE.Vector3(i, -config.width, 0));
    gridGeo.vertices.push(new THREE.Vector3(i, config.width, 0));
  }

  line = new THREE.Line(gridGeo, material, THREE.LinePieces);
  gridObject.add(line);

  return gridObject;
}

function setControlsTarget(cluster) {
  var goTo = clusterPos[0];

  camera.position.y = goTo.position.x;

}


var graph = {
  graph: [],
  mergedCubesAll: [],
  init: function(server, metric, scale, cluster) {


    this.buildInitObjs();
    this.buildData(server, metric, scale, cluster);


  },
  buildInitObjs: function() {
    this.opts = {
    lines: 13 // The number of lines to draw
  , length: 28 // The length of each line
  , width: 14 // The line thickness
  , radius: 42 // The radius of the inner circle
  , scale: 1 // Scales overall size of the spinner
  , corners: 1 // Corner roundness (0..1)
  , color: '#000' // #rgb or #rrggbb or array of colors
  , opacity: 0.25 // Opacity of the lines
  , rotate: 0 // The rotation offset
  , direction: 1 // 1: clockwise, -1: counterclockwise
  , speed: 1 // Rounds per second
  , trail: 60 // Afterglow percentage
  , fps: 20 // Frames per second when using setTimeout() as a fallback for CSS
  , zIndex: 2e9 // The z-index (defaults to 2000000000)
  , className: 'spinner' // The CSS class to assign to the spinner
  , top: '50%' // Top position relative to parent
  , left: '50%' // Left position relative to parent
  , shadow: false // Whether to render a shadow
  , hwaccel: false // Whether to use hardware acceleration
  , position: 'absolute' // Element positioning
  }
  this.target = document.getElementById('spin')
  this.spinner = new Spinner(this.opts).spin(this.target);

    this.mergedCubes = new THREE.Geometry();
    this.planeMaterial = new THREE.MeshLambertMaterial({
      color: 0xffffff,
      shading: THREE.SmoothShading,
      vertexColors: THREE.VertexColors
    });
    this.planeGeometry = new THREE.PlaneGeometry(6000, 6000, 50, 50);
    this.mergedCubes.dynamic = true;
    this.parentMesh = new THREE.Mesh(this.mergedCubes, this.planeMaterial);
    this.parentMesh.name = 'kev';
    this.parentMesh.geometry.dynamic = true;
    this.parentMesh.geometry.verticesNeedUpdate = true;
    this.posZ = 0;
    this.posX = 0;
    this.posY = 0;
    this.size = 100;
    this.cubeObjects = [];

  },
  buildData: function(server, metric, scale, cluster) {
    var that = this;
    this.p1 = new Promise(
      function(resolve, reject) {
        $.getJSON("http://107.170.193.27:8080/api/" + metric + "/client/" + server, function(json) {
          that.points = json;
          resolve(that.points);
        });
      }
    );

    this.p1.then(function(result) {
      graph.buildGraph(server, metric, scale, cluster);
    });
  },
  buildGraph: function(server, metric, scale, cluster) {
    var that = this;
    var spritey = makeTextSprite(server, {
      fontsize: 50,
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
    }, 3000);
    spritey.position.set(that.posX, that.posY+((that.graph.length*10000)), 2000);
    spritey.updateMatrix();
    scene.add(spritey);


    var spritey = makeTextSprite(metric, {
      fontsize: 50,
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
    }, 3000);
    spritey.position.set(that.posX, that.posY+((that.graph.length*10000)), 1000);
    spritey.updateMatrix();
    scene.add(spritey);
    console.log('points ' + this.points.length);
    that.firstRun = true;
    this.points.map(function(i) {
      that.curTimeStamp = i.time;
      that.curDay = that.curTimeStamp.split('T');
      that.curHour = that.curDay[1].split(':');
      that.curHour = that.curHour[0];
      that.curDay = that.curDay[0];
      if(that.firstRun == true){
        that.hourStamp = that.curHour;
          var printHour = parseInt(that.curHour);
        var spritey = makeTextSprite(printHour, {
          fontsize: 50,
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
        }, 250);
        spritey.position.set(that.posX+600, that.posY-(2000-(that.graph.length*10000)), 0);
        spritey.updateMatrix();
        scene.add(spritey);
        that.firstRun = false;
      }


      if (that.curDay != that.dayStamp) {
        that.dayStamp = that.curDay;
        that.posX += 500;
        that.posY = 0;

        var spritey = makeTextSprite(that.dayStamp, {
          fontsize: 50,
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
        }, 350);
        spritey.position.set(that.posX+100, that.posY+(2000+(that.graph.length*10000)), 0);
        spritey.updateMatrix();
        scene.add(spritey);
      }

      if (that.curHour != that.hourStamp) {

        var printHour = parseInt(that.curHour);
        that.hourStamp = that.curHour;

        that.posX += 100;
        that.posY = 0;
        var spritey = makeTextSprite(printHour, {
          fontsize: 50,
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
        }, 250);
        spritey.position.set(that.posX+100, that.posY-(2000-(that.graph.length*10000)), 0);
        spritey.updateMatrix();
        scene.add(spritey);
      }



      that.posZ = i.value * 10 * scale;
      that.boxGeometry = new THREE.BoxGeometry(50, 50, that.posZ, 1, 1);
      that.boxGeometry.dynamic = true;
      for (var m = 0; m < that.boxGeometry.faces.length; m++) {
        that.face = that.boxGeometry.faces[m];
        that.face.color.setRGB((that.posZ / 10) * .01, 1 - ((that.posZ / 10) * .01), 0);
      }

      that.cube = new THREE.Mesh(that.boxGeometry, that.planeMaterial);
      that.cid = that.cube.id;

      that.cube.position.x = that.posX;
      that.cube.position.y = that.posY;
      that.cube.position.z = that.posZ / 2;

      that.cube.metricValue = i.value;
      that.cube.updateMatrix();



      that.cube.geometry.colorsNeedUpdate = true;

      that.cube.timeStamp = i.time;
      that.cube.dynamic = true;
      that.cubeObjects.push(that.cube);

      that.mergedCubes.merge(that.cube.geometry, that.cube.matrix);

      that.posY += 100;
    });

    this.cubeObjects = that.cubeObjects;
    this.mergedCubes = that.mergedCubes;
    this.mergedCubesCenter = this.mergedCubes.center();

    this.parentMesh.finalPosY = 0 + (this.graph.length*10000);
    this.oldPMY = this.parentMesh.position.y - this.parentMesh.finalPosY
    this.parentMesh.position.y = this.parentMesh.finalPosY;


    this.oldPMZ = this.parentMesh.position.z - (this.parentMesh.geometry.boundingBox.max.z+Math.abs(this.parentMesh.geometry.boundingBox.min.z))/2;
    this.oldPMX = this.parentMesh.position.x =(this.parentMesh.geometry.boundingBox.max.x+Math.abs(this.parentMesh.geometry.boundingBox.min.x))/2+500;
    this.parentMesh.position.z = (this.parentMesh.geometry.boundingBox.max.z+Math.abs(this.parentMesh.geometry.boundingBox.min.z))/2;
    this.parentMesh.position.x = (this.parentMesh.geometry.boundingBox.max.x+Math.abs(this.parentMesh.geometry.boundingBox.min.x))/2+500;

    scene.add(this.parentMesh);
    this.mergedCubesAll.push(this.mergedCubes);
    this.parentMesh.server = server;
    this.parentMesh.metric = metric;
    this.parentMesh.scale2 = scale;
    this.parentMesh.cluster = cluster;
    this.parentMesh.firstRun = 0;



    var that = this;

    this.cubeObjects.map(function(cube){
       cube.position.y += that.parentMesh.position.y-1750;
       //cube.position.x -= 90;
       //cube.position.z += that.oldPMZ;
       cube.verticesNeedUpdate = true;
       cube.elementsNeedUpdate = true;
       cube.morphTargetsNeedUpdate = true;
       cube.uvsNeedUpdate = true;
       cube.normalsNeedUpdate = true;
       cube.colorsNeedUpdate = true;
       cube.tangentsNeedUpdate = true;
       finalCubeObjects.push(cube);
       scene.add(cube);

    });
    var that = this;
    setTimeout(function(){
      that.cubeObjects.map(function(cube){
        scene.remove(cube);
      });
   },1);

    this.graph.push(this.parentMesh);
    this.liveUpdate(server, metric, scale, cluster);
    this.spinner.stop();
  },
  liveUpdate: function(server, metric, scale, cluster) {

    this.intervalID = setInterval(
      (function(self) {
        return function() {
          self.updateGraph();
        }
      })(this),
      30000
    );
  },
  liveMetric: function(graph) {
    if(graph.metric == 'response'){
      graph.metric = 'metric_curl';
    }
    if(graph.metric == 'memory'){
      graph.metric = 'ram';
    }

    return $.getJSON("http://107.170.193.27:4567/results/" + graph.server + "/" + graph.metric).then(function(json) {
      var d = new Date();

      var output = json.check.output.split('fin');

      var posX = 0;
      var posY = false;

      var curHour = d.getHours();
      var curDay = d.getDay();

      if (curHour != graph.hourStamp) {
        graph.hourStamp = curHour;
        posX += 100;
        posY = false;
      }

      if (curDay != graph.dayStamp) {
        graph.dayStamp = curDay;
        posX += 500;
        posY = true;
      }
      //  scene.remove(that.graph[i]);

      var planeMaterial = new THREE.MeshPhongMaterial({
        color: 0xffffff,
        vertexColors: THREE.VertexColors
      });

      var boxGeometry = new THREE.BoxGeometry(50, 50, output[1] * 10 * graph.scale2, 1, 1);
      //output[1] * 10 * graph.scale2
      var cube = new THREE.Mesh(boxGeometry, planeMaterial);
      for (var m = 0; m < boxGeometry.faces.length; m++) {
        var face = boxGeometry.faces[m];
        face.color.setRGB((output[1]) * .01, 1 - (output[1]* .01), 0);
      }


    //  var first = that.mergedCubesAll[i];

      graph.updateMatrix();
      var geoLen = graph.geometry.vertices.length;
      if(posY == true){
        cube.position.y = 0;
      }
      else{
        if(graph.firstRun == 0) {
          //console.log(graph.geometry.vertices[geoLen - 1].y);
          cube.position.y = graph.geometry.vertices[geoLen - 1].y + 100 + graph.position.y;
        }
        else{
          cube.position.y = graph.geometry.vertices[geoLen - 1].y + 100;
        }
      }

      if(graph.firstRun == 0){
        cube.position.x = graph.geometry.vertices[geoLen - 1].x + 25 + posX + (graph.geometry.boundingBox.max.x+Math.abs(graph.geometry.boundingBox.min.x))/2+500;
      }
      else {
        cube.position.x = graph.geometry.vertices[geoLen - 1].x + 25 + posX;
      }

      cube.position.z = (output[1] * 10 * graph.scale2)/2;


      //cube.position.z = that.graph[i].geometry.vertices[geoLen-1].z/2;

      cube.updateMatrix();
      graph.geometry.dynamic = true;
      graph.geometry.merge(cube.geometry, cube.matrix);
      graph.geometry.mergeVertices();
      scene.add(cube);
      cube.metricValue = output[1];
      finalCubeObjects.push(cube);
      graph.firstRun = 1;
      return json;
    });
  },
  updateGraph: function() {
    var that = this;

    for (var i = 0; i < that.graph.length; i++) {
      var d = new Date();

      that.graph[i].hourStamp = d.getHours();
      that.graph[i].dayStamp = d.getDay();
      that.liveMetric(that.graph[i]).always(function(result){
      });
    }
  }
};

function modular(server, metric, scale, cluster) {
  graph.init(server, metric, scale, cluster);
}

function wrapGrid() {
  var bb = new THREE.Box3().setFromObject(parentMesh);
  graphTWidth = graphTWidth + bb.max.x - bb.min.x;
  var gridOpts = {
    height: bb.max.x + 100,
    width: 500,
    linesHeight: 10,
    linesWidth: 10,
    color: 0x0000ff
  };
  var gridMain = new THREE.Object3D;
  var gridX = createGrid(gridOpts);
  gridX.rotation.x = -Math.PI / 2;
  // gridX.position.y = planeGeometry.parameters.width/2+100;
  gridX.position.y = bb.max.y + 100;
  gridX.position.z = 500;
  gridMain.add(gridX);
  gridOpts.color = 0xFF0000;
  gridOpts.width = bb.max.y + 100;
  gridOpts.height = 500;
  var gridY = createGrid(gridOpts);
  gridY.rotation.y = -Math.PI / 2;
  gridY.position.x = bb.max.y + 100;
  gridY.position.z = 500;
  gridMain.add(gridY);
  gridOpts.color = 0x00ff00;
  gridOpts.width = bb.max.x + 100;
  gridOpts.height = bb.max.y + 100;
  var gridZ = createGrid(gridOpts);
  gridMain.add(gridZ);
  //scene.add(gridMain);
}

var render = function() {
  requestAnimationFrame(render);
  renderer.render(scene, camera);
  //octree.update();
}

function onDocumentMouseMove(event) {

  event.preventDefault();
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  var octreeObjects;
  var numObjects;
  var numFaces = 0;
  var intersections;

  intersections = raycaster.intersectObjects(finalCubeObjects);
  numObjects = finalCubeObjects.length;
  //  numFaces = totalFaces;

  if (intersections.length > 0) {
    if (intersected != intersections[0].object) {
      intersected = intersections[0].object;
      scene.remove(spritey);

      spritey = makeTextSprite(intersected.metricValue, {
        fontsize: 50,
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
      }, 200);
      spritey.position.set(intersected.position.x, intersected.position.y-50, intersected.position.z * 2);
      scene.add(spritey);
    }
    document.body.style.cursor = 'pointer';
  } else if (intersected) {
    scene.remove(spritey);
    intersected = null;
    document.body.style.cursor = 'auto';
  }
}

function update() {

}
