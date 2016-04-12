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
var objects = [];
var baseColor = 0x333333;
var intersectColor = 0x00D66B;
var clusterPos = [];
var prevY = 0;

graphTWidth = 0;


var mergedGraphs = [];

function init() {
  buildScene();
  loadFont();
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
  sprite.scale.set(1000, 1000, 1.0);
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
  pointLight = new THREE.PointLight(0xfffff, 1, 0);
  pointLight2 = new THREE.PointLight(0xfffff, 5, 0);
  pointLight3 = new THREE.PointLight(0xfffff, 5, 0);
  pointLight4 = new THREE.PointLight(0xfffff, 5, 0);
  renderer = new THREE.WebGLRenderer();

  axisHelper = new THREE.GridHelper(100000, 100);
  sphere = new THREE.SphereGeometry(10, 16, 8);

  var light = new THREE.AmbientLight(0x404040); // soft white light

  pointLight.add(new THREE.Mesh(sphere,
    new THREE.MeshBasicMaterial({
      color: 0xff0040
    })));
  pointLight2.add(new THREE.Mesh(sphere,
    new THREE.MeshBasicMaterial({
      color: 0xff0040
    })));
  pointLight3.add(new THREE.Mesh(sphere,
    new THREE.MeshBasicMaterial({
      color: 0xff0040
    })));
  pointLight4.add(new THREE.Mesh(sphere,
    new THREE.MeshBasicMaterial({
      color: 0xff0040
    })));

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0xBBBBBB);
  document.body.appendChild(renderer.domElement);
  renderer.domElement.addEventListener('mousemove', onDocumentMouseMove, false);
  raycaster = new THREE.Raycaster();





  //scene.add(hemLight);
  axisHelper.rotation.x = -Math.PI / 2;
  //scene.add( axisHelper );

  camera.position.z = 3000;
  camera.position.y = 0;
  camera.position.x = -4000;
  camera.rotation.x = 0;
  camera.rotation.y = 100;
  camera.rotation.z = -Math.PI / 2;
  camera.up.set(0, 0, 1);
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  //controls = new THREE.FirstPersonControls(camera, renderer.domElement);

  pointLight.position.set(300, 100, 0);
  pointLight2.position.set(-300, 100, 0);
  pointLight3.position.set(0, 100, 300);
  pointLight4.position.set(0, 100, -300);


  scene.add(camera);
  scene.add(hemLight);
  scene.add(pointLight);
  scene.add(pointLight2);
  scene.add(pointLight3);
  scene.add(pointLight4);
  scene.add(light);
}

function getMem(server, metric, scale, cluster) {

  var p1 = new Promise(
    function(resolve, reject) {
      $.getJSON("http://107.170.193.27:8080/api/" + metric + "/client/" + server, function(json) {
        points = json;
        resolve(points);
      });
    }
  );

  p1.then(function() {
    console.log('ran');
    buildGraph2(scale, cluster, server, metric);

  });
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

function loadFont() {
  var loader = new THREE.FontLoader();
  loader.load('fonts/helvetikar_regular.typeface.js', function(response) {
    font = response;
    console.log(font);
    //refreshText();
  });
}

var graph = {
  graph: [],
  mergedCubesAll: [],
  init: function(server, metric, scale, cluster) {
    this.buildInitObjs();
    this.buildData(server, metric, scale, cluster);

  },
  buildInitObjs: function() {
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
    this.points.map(function(i) {
      that.curTimeStamp = i.time;
      that.curDay = that.curTimeStamp.split('T');
      that.curHour = that.curDay[1].split(':');
      that.curHour = that.curHour[0];
      that.curDay = that.curDay[0];

      if (that.curHour != that.hourStamp) {
        that.hourStamp = that.curHour;
        that.posX += 100;
        that.posY = 0;
      }

      if (that.curDay != that.dayStamp) {
        that.dayStamp = that.curDay;
        that.posX += 500;
        that.posY = 0;
      }

      that.posZ = i.value * 10 * scale;
      that.boxGeometry = new THREE.BoxGeometry(50, 50, that.posZ, 1, 1);

      for (var m = 0; m < that.boxGeometry.faces.length; m++) {
        that.face = that.boxGeometry.faces[m];
        that.face.color.setRGB((that.posZ / 10) * .01, 1 - ((that.posZ / 10) * .01), 0);
      }

      that.cube = new THREE.Mesh(that.boxGeometry, that.planeMaterial);
      that.cid = that.cube.id;

      that.cube.position.x = that.posX;
      that.cube.position.y = that.posY;
      that.cube.position.z = that.posZ / 2;

      that.cube.updateMatrix();
      that.cube.geometry.colorsNeedUpdate = true;

      that.cube.timeStamp = i.time;

      that.mergedCubes.merge(that.cube.geometry, that.cube.matrix);


      /*  planeGeometry.vertices[i].z = Math.floor((Math.random() * 100));

        var time = points[i].time;
        time = time.split('T');

        spritey = makeTextSprite( time[1],
          { fontsize: 50,
            borderColor: {r:255, g:0, b:0, a:1.0},
            backgroundColor: {r:255, g:100, b:100, a:0.8}
          } );
        spritey.position.set(planeGeometry.vertices[i].x,planeGeometry.vertices[i].y,posZ+100);
        //scene.add( spritey );
        */
      that.posY += 100;
    });

    this.mergedCubes = that.mergedCubes;
    this.mergedCubesCenter = this.mergedCubes.center();
    //  that.textParams.size = 500;
    //  this.parentMesh = new THREE.Mesh(this.mergedCubes, this.planeMaterial);

        this.parentMesh.finalPosY = 0 + (this.graph.length*10000);
      this.parentMesh.position.y = this.parentMesh.finalPosY;


    this.parentMesh.position.z = (this.parentMesh.geometry.boundingBox.max.z+Math.abs(this.parentMesh.geometry.boundingBox.min.z))/2;
    scene.add(this.parentMesh);
    this.mergedCubesAll.push(this.mergedCubes);
    this.parentMesh.server = server;
    this.parentMesh.metric = metric;
    this.parentMesh.scale2 = scale;
    this.parentMesh.cluster = cluster;
    this.parentMesh.firstRun = 0;

    this.graph.push(this.parentMesh);


    this.liveUpdate(server, metric, scale, cluster);
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
        console.log('hour');
        graph.hourStamp = curHour;
        posX += 100;
        posY = true;
      }

      if (curDay != graph.dayStamp) {
        console.log('day');
        graph.dayStamp = curDay;
        posX += 500;
        posY = true;
      }
      //  scene.remove(that.graph[i]);

      var planeMaterial = new THREE.MeshLambertMaterial({
        color: 0xffffff,
        vertexColors: THREE.VertexColors
      });

      var boxGeometry = new THREE.BoxGeometry(50, 50, output[1] * 10 * graph.scale2, 1, 1);
      var cube = new THREE.Mesh(boxGeometry, planeMaterial);
      for (var m = 0; m < boxGeometry.faces.length; m++) {
        var face = boxGeometry.faces[m];
        face.color.setRGB((output[1]) * .01, 1 - (output[1]* .01), 0);
      }


    //  var first = that.mergedCubesAll[i];

      graph.updateMatrix();
      var geoLen = graph.geometry.vertices.length;
      console.log(graph.geometry.vertices[geoLen - 1]);
      if(posY == true){
        cube.position.y = 0;
      }
      else{
        console.log(graph);
        if(graph.firstRun == 0) {
          console.log('asdasdasdasdasd');
          cube.position.y = graph.geometry.vertices[geoLen - 1].y + 100 + graph.position.y;
        }
        else{
          cube.position.y = graph.geometry.vertices[geoLen - 1].y + 100;
        }
        console.log(cube.position.y);
      }
console.log(posX);
      cube.position.x = graph.geometry.vertices[geoLen - 1].x + 25 + posX;
      cube.position.z = (output[1] * 10 * graph.scale2)/2;

      console.log(graph.geometry);
      //cube.position.z = that.graph[i].geometry.vertices[geoLen-1].z/2;

      cube.updateMatrix();
      //  scene.add(cube);
      graph.geometry.dynamic = true;
      graph.geometry.merge(cube.geometry, cube.matrix);
      graph.geometry.mergeVertices();
      scene.add(cube);
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
        // console.log('second');
        // scene.remove(that.graph[i]);
        // that.graph[i].geometry.dispose();
        // //  scene.remove(that.graph[i]);
        //
        // var planeMaterial = new THREE.MeshLambertMaterial({
        //   color: 0xffffff,
        //   vertexColors: THREE.VertexColors
        // });
        // var boxGeometry = new THREE.BoxGeometry(50, 50, Math.random() * 10000, 1, 1);
        // var cube = new THREE.Mesh(boxGeometry, planeMaterial);
        //
        // cube.material.color = new THREE.Color(1, 0, 0);
        // var first = that.mergedCubesAll[i];
        //
        // that.graph[i].updateMatrix();
        // var geoLen = that.graph[i].geometry.vertices.length;
        // console.log(that.graph[i].geometry.vertices[geoLen - 1]);
        // cube.position.y = that.graph[i].geometry.vertices[geoLen - 1].y + 100;
        // cube.position.x = that.graph[i].geometry.vertices[geoLen - 1].x + 25;
        // //cube.position.z = that.graph[i].geometry.vertices[geoLen-1].z/2;
        //
        // cube.updateMatrix();
        // //  scene.add(cube);
        // that.graph[i].geometry.dynamic = true;
        // scene.add(cube);
        // //  scene.remove(cube);
        // that.graph[i].geometry.merge(cube.geometry, cube.matrix);
        // that.graph[i].geometry.mergeVertices();
        // that.graph[i].geometry.verticesNeedUpdate = true;
        // that.graph[i].geometry.elementsNeedUpdate = true;
        // that.graph[i].geometry.morphTargetsNeedUpdate = true;
        // that.graph[i].geometry.uvsNeedUpdate = true;
        // that.graph[i].geometry.normalsNeedUpdate = true;
        // that.graph[i].geometry.colorsNeedUpdate = true;
        // that.graph[i].geometry.tangentsNeedUpdate = true;
        // that.graph[i].geometry.groupsNeedUpdate = true;
        //
        // console.log(that.graph[i].geometry);
        // // console.log(that.graph[i].geometry);
        // that.graph[i].geometry = that.graph[i].geometry;
        // scene.add(that.graph[i]);
      });


    }

    //  that.parentMesh.position.y = that.parentMesh.position.y+30000;
    //
    // that.boxGeometry = new THREE.BoxGeometry(50, 50, Math.random() * 100, 1, 1);
    // that.cube = new THREE.Mesh(that.boxGeometry, that.planeMaterial);
    //
    // that.cube.posY = Math.random() *100;
    //       that.cube.updateMatrix();
    // that.mergedCubes.merge(that.cube.geometry, that.cube.matrix);

    //  scene.remove(that.parentMesh);




  }
};

function modular(server, metric, scale, cluster) {
  graph.init(server, metric, scale, cluster);
}

function buildGraph2(scale, cluster, server, metric) {

  var planeMaterial,
    planeGeometry,
    box,
    point,
    face,
    numberOfSides,
    vertexIndex,
    mergedCubes,
    color,
    curTimeStamp,
    dayStamp,
    curDay,
    curHour,
    hourStamp,
    textGeometry,
    textParams;

  var boxGeometry;
  var posZ = 0;
  var posX = 0;
  var posY = 0;
  var size = 100;


  mergedCubes = new THREE.Geometry();

  planeMaterial = new THREE.MeshLambertMaterial({
    color: 0xffffff,
    shading: THREE.SmoothShading,
    vertexColors: THREE.VertexColors
  });
  planeGeometry = new THREE.PlaneGeometry(6000, 6000, 50, 50);

  parentMesh = new THREE.Mesh(mergedCubes, planeMaterial);
  textParams = {
    font: font,
    size: 500,
    height: 10
  }

  console.log('number of data points ' + points.length);
  var start = new Date().getTime();
  var counts = 0;
  points.map(function(i) {
    curTimeStamp = i.time;
    curDay = curTimeStamp.split('T');
    curHour = curDay[1].split(':');
    curHour = curHour[0];
    curDay = curDay[0];

    if (curHour != hourStamp) {
      hourStamp = curHour;
      posX += 100;
      posY = 0;

      spritey = makeTextSprite(hourStamp, {
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
      });
      spritey.position.set(posX - 10, posY - 500, 0);
      spritey.updateMatrix();
      scene.add(spritey);
    }
    if (curDay != dayStamp) {
      dayStamp = curDay;
      posX += 500;
      posY = 0;
    }

    posZ = i.value * 10 * scale;
    boxGeometry = new THREE.BoxGeometry(50, 50, posZ, 1, 1);

    for (var m = 0; m < boxGeometry.faces.length; m++) {
      counts++;
      face = boxGeometry.faces[m];
      face.color.setRGB((posZ / 10) * .01, 1 - ((posZ / 10) * .01), 0);
    }

    var cube = new THREE.Mesh(boxGeometry, planeMaterial);
    var cid = cube.id;

    cube.position.x = posX;
    cube.position.y = posY;
    cube.position.z = posZ / 2;

    cube.updateMatrix();
    cube.geometry.colorsNeedUpdate = true;

    cube.timeStamp = i.time;
    cube.scaleSize = scale;

    objects.push(cube);

    mergedCubes.merge(cube.geometry, cube.matrix);


    /*  planeGeometry.vertices[i].z = Math.floor((Math.random() * 100));

      var time = points[i].time;
      time = time.split('T');

      spritey = makeTextSprite( time[1],
        { fontsize: 50,
          borderColor: {r:255, g:0, b:0, a:1.0},
          backgroundColor: {r:255, g:100, b:100, a:0.8}
        } );
      spritey.position.set(planeGeometry.vertices[i].x,planeGeometry.vertices[i].y,posZ+100);
      //scene.add( spritey );
      */
    posY += 100;
  });
  var mergedCubesCenter = mergedCubes.center();
  textParams.size = 500;

  textGeometry = new THREE.TextGeometry(server + ' ' + metric, textParams);

  for (var m = 0; m < textGeometry.faces.length; m++) {
    counts++;
    face = textGeometry.faces[m];
    face.color.setRGB(0, 0, 0);
  }

  var textMesh1 = new THREE.Mesh(textGeometry, planeMaterial);

  textMesh1.position.x = mergedCubesCenter.x;
  textMesh1.position.y = mergedCubesCenter.y;
  textMesh1.position.z = posZ / 2 + 1000;
  textMesh1.rotation.x = Math.PI / 2;
  textMesh1.rotation.y = Math.PI / 2;
  textMesh1.updateMatrix();
  mergedCubes.merge(textMesh1.geometry, textMesh1.matrix);

  var end = new Date().getTime();
  var time = end - start;
  console.log('Execution time: ' + time);

  parentMesh.position.y = cluster * 30000;
  parentMesh.position.y = prevY + 10000;
  prevY = parentMesh.position.y;
  clusterPos.push(parentMesh);
  scene.add(parentMesh);
  console.log(parentMesh);
  textMesh1 = {};
  mergedCubes = {};
  parentMesh = {};
  objects = [];
}

function wrapGrid() {
  var bb = new THREE.Box3().setFromObject(parentMesh);
  graphTWidth = graphTWidth + bb.max.x - bb.min.x;
  console.log(graphTWidth);
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

  intersections = raycaster.intersectObjects(objects);
  numObjects = objects.length;
  //  numFaces = totalFaces;

  if (intersections.length > 0) {
    if (intersected != intersections[0].object) {
      intersected = intersections[0].object;
      scene.remove(spritey);

      var time = intersected.timeStamp;
      time = time.split('T');
      console.log(intersected.scaleSize);
      spritey = makeTextSprite(time[0] + "/n" + time[1], {
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
      });
      spritey.position.set(intersected.position.x, intersected.position.y, intersected.position.z * 2);
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
