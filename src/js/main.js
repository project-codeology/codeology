
var wireframe = false;
var movement = true;
var delta = 0,deltaX = 0
var rendertime = 0
var groups = []
var container, stats;
var difference = 0;
var views, scene, renderer;
var mesh, light;
var mouseX = 0, mouseY = 0;
var windowWidth, windowHeight;
var selected = -1;
var rolledover = -1;
var views = [];
var topGlobal = 0;
var introPlayed = false;
var preloader;
var headerHeight = 0;

var viewsNum = 9;
if (MOBILE_VERSION) {
    viewsNum = 2;
}
var newWidth;


$(document).ready(function () {
    init();
});

function init() {

    $.ajaxSetup({cache: true});

    FastClick.attach(document.body);

    if (!Detector.webgl) {
        noWebGL();
        return;
    }

    prepareInput();

    setupHistory();
    setupScene();
    initPostprocessing();
    resizePostprocessing();
    bugGlobals();
    setupUI();
    updateUI();
    bindUI();
    animate();

    //preload("featured");
}

function noWebGL() {
    window.location.href = "/error";
}

window.addEventListener("load",function() {
  setTimeout(function(){
    window.scrollTo(0, 1); // Hide the address bar!
  }, 0);
});