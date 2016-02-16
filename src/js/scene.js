var camera, view, controls = [];
var selectedZoom = ZOOM_IN;
var deviceControlsEnabled = false;
var nextRenderScreenshot = {enabled: false};
var i, ii, min, max, newid;
var backgroundRocks, thisLoop;
var skipFPSCheck = false
var filterStrength = 2, dis = 300, spd = 5, animSpd = 5;
var frameTime = 80, lastLoop = new Date, slowCount = 0, tempPosition = new THREE.Vector3();

function setupScene() {

    container = document.getElementById('container');

    // multiple views
    for (ii = 0; ii < viewsNum; ii++) {
        var view = {};
        camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 10000);
        view.camera = camera;
        view.width = 0;
        view.height = 0;
        view.left = 0;
        view.top = 0;
        view.topDiff = 0;
        if (!MOBILE_VERSION) {
            view.relativeDiff = -Math.floor(ii / 3) * 0.5;
        } else {
            view.relativeDiff = -ii - 1;
        }
        view.id = ii;
        view.i = ii;

        controls.push(new THREE.DeviceOrientationControls(camera, true));
        views.push(view);
    }

    // scene setup
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0, 0, 10000);

    scene.add(new THREE.AmbientLight(0x444444));

    light = new THREE.SpotLight(0xffffff, 2);
    light.position.set(0, 500, 2000);

    scene.add(light);

    // background rocks
    var greymat = new THREE.MeshBasicMaterial({color: 0x444444,
        side: THREE.DoubleSide});

    for (var i = 0; i < 1; i++) {
        var geometry = new THREE.Geometry();

        for (var j = 0; j < 30; j++) {
            var pregeom;
            if (j % 2 === 0)
                pregeom = new THREE.BoxGeometry(600, 600, 600);//
            if (j % 2 == 1)
                pregeom = new THREE.TetrahedronGeometry(600, 0);
            //change_uvs( pregeom, 1/zoom1, 1/zoom2, Math.floor(Math.random()*zoom1), Math.floor(Math.random()*zoom2) );
            var submesh = new THREE.Mesh(pregeom);
            submesh.scale.x = submesh.scale.y = submesh.scale.z = 0.2 + Math.random() * 1;
            submesh.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
            while (submesh.position.distanceTo(scene.position) < 2000) {
                submesh.position.x = (Math.random() - 0.5) * 6000;
                submesh.position.y = (Math.random() - 0.5) * 6000;
                submesh.position.z = (Math.random() - 0.5) * 6000;
            }
            submesh.updateMatrix();
            geometry.merge(pregeom, submesh.matrix);
        }
    }

    backgroundRocks = new THREE.Mesh(geometry, greymat);
    TweenMax.from(backgroundRocks.scale, 3, {delay: 1.5, x: 4, y: 4, z: 4});
    scene.add(backgroundRocks);

    // core
    renderer = new THREE.WebGLRenderer({antialias: false, alpha: false});
    //renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight - headerHeight);
    renderer.domElement.style.position = "absolute";
    renderer.domElement.style.top = headerHeight + "px";
    container.appendChild(renderer.domElement);
    
    // events
    document.body.addEventListener('mousemove', onDocumentMouseMove, false);
    renderer.domElement.addEventListener('click', onMouseClick, false);
    $('.desc').on('click', onMouseClick);

    $(window).bind('mousewheel', function (event) {
        onMouseWheel(event.originalEvent);
    });
    $(window).bind('DOMMouseScroll', function (event) {
        onMouseWheel(event.originalEvent);
    });

    document.body.addEventListener('touchstart', touchstart, false);
    document.body.addEventListener('touchend', touchend, false);
    document.body.addEventListener('touchmove', touchmove, false);

    window.addEventListener('resize', onWindowResize, false);
    window.addEventListener('deviceorientation', initControls, false);

    document.onkeydown = checkKey;

    onWindowResize();

    lastLoop = new Date;
}

function initControls(event) {
    if (event.alpha) {
        window.removeEventListener('deviceorientation', initControls, false);
        deviceControlsEnabled = true;
        controls.connect();
        controls.update();
    }
}


function updateSize() {
    if (windowWidth != window.innerWidth || windowHeight != window.innerHeight - headerHeight) {
        windowWidth = window.innerWidth;
        windowHeight = window.innerHeight - headerHeight;
        renderer.setSize(windowWidth, windowHeight);
    }

}

function animate() {
    // fps check
    if (timer <= 20) {
        lastLoop = new Date();
    }
    if (timer > 20 && timer < 2000) {
        var thisFrameTime = (thisLoop = new Date()) - lastLoop;
        if (thisFrameTime < 10000) {
            frameTime += (thisFrameTime - frameTime) / filterStrength;
            lastLoop = thisLoop;

            fps = (1000 / frameTime);
            if (fps < MIN_FPS && !skipFPSCheck) {
                slowCount++;
                if (slowCount > 10) {
                    noWebGL();
                    return;
                }
            } else {
                slowCount = 0;
            }
        }
    }

    for (var i = 0; i < globalDB.length; i++) {
        updateBug(globalDB[i], i);
    }
    render();
    requestAnimationFrame(animate);
}

function render(fast) {
    rendertime -= mouseX / 80;

    updateSize();
    if (nextRenderScreenshot.enabled) {
        windowWidth = nextRenderScreenshot.width;
        windowHeight = nextRenderScreenshot.height;
        renderer.setSize(windowWidth, windowHeight);
        resizePostprocessing();
    }

    for (i = 0; i < viewsNum; i++) {
        if (groups[i])
            groups[i].visible = false;
    }

    topGlobal -= delta;

    min = 0;
    if (topGlobal < min)
        topGlobal -= (topGlobal - min) / 5;

    max = Math.floor(((globalDB.length / viewsNum * 3 / 2) - 1) * 2) / 2 + 0.5;
    if (globalDB.length % 3 === 0 && !MOBILE_VERSION)
        max -= 0.5;
    if (topGlobal > max) {
        topGlobal -= (topGlobal - max) / 5;
    }
    if (globalDB.length <= 6)
        topGlobal = min;

    renderer.clear();
    for (ii = 0; ii < viewsNum; ++ii) {

        view = views[ii];
        camera = view.camera;

        if (groups[ii] && !rolloverMesh) {
            groups[ii].visible = true;
        }
        if (i > 0 && groups[ii - 1])
            groups[ii - 1].visible = false;

        view.topDiff = 0;
        dis = topGlobal + view.relativeDiff;
        if (!MOBILE_VERSION) {
            while ((dis) > 0.5) {
                view.topDiff -= 1.5;
                dis -= 1.5;
            }
        } else {
            while ((dis) > 0) {
                view.topDiff -= 2;
                dis -= 2;
            }
        }
        newid = view.i + Math.floor(-view.topDiff / 1.5 * viewsNum);
        if (view.id != newid) {
            view.id = newid;
            TweenMax.delayedCall(view.i / 100, prepare, [view.id, view.i]);
        }

        if (!MOBILE_VERSION) {
            newWidth = {width: 0.333, height: 0.5, left: 0.333 * (ii % 3), top: topGlobal + view.topDiff + view.relativeDiff};
        } else {
            newWidth = {width: 1, height: 1, left: 0, top: topGlobal + view.topDiff + view.relativeDiff};
        }
        if (!loading) {
            backgroundRocks.material.color.setHSL(0.5 + Math.sin(ii), 0.10, 0.25);
        } else {
            backgroundRocks.material.color.setRGB(0, 0, 0);
        }
        light.color.setHSL(Math.sin(ii * 123.2) / 2 + 0.5, 1, 0.8);

        // renderer sizes
        if (aboutOpen) {
            if (ii === 0) {
                newWidth.width = 0.6;
                newWidth.height = 1;
                newWidth.left = 0.4;
                newWidth.top = -1;
            } else {
                newWidth.width = 0;
                if (ii % 3 == 1)
                    newWidth.width = 1;
                newWidth.height = 0;
                if (ii % 3 === 0 || ii % 3 == 2)
                    newWidth.height = 1;
                newWidth.left = 0;
                if (ii % 3 == 2)
                    newWidth.left = 1;
                newWidth.top = 1;
            }
        } else if (selected != -1) {
            if (selected == view.id) {
                newWidth.width = 1;
                newWidth.height = 1;
                newWidth.left = 0;
                newWidth.top = -1;
            } else {
                newWidth.width = 0;
                if (ii % 3 == 1)
                    newWidth.width = 1;
                newWidth.height = 0;
                if (ii % 3 === 0 || ii % 3 == 2)
                    newWidth.height = 1;
                newWidth.left = 0;
                if (ii % 3 == 2)
                    newWidth.left = 1;
                newWidth.top = 1;

            }
        }

        animSpd = 5;
        if (MOBILE_VERSION || nextRenderScreenshot.enabled || fast) {
            animSpd = 1;
        }
        
        // animate views
        view.width -= (view.width - newWidth.width) / animSpd;
        view.height -= (view.height - newWidth.height) / animSpd;
        view.left -= (view.left - newWidth.left) / animSpd;
        view.top -= (view.top - newWidth.top) / animSpd;
        if (view.height < 0.55) {
            view.top = newWidth.top;
        }

        // rollovers
        if (!MOBILE_VERSION) {
            $('#desc' + ii).css({
                'top': parseInt(-view.top * windowHeight + headerHeight, 10),
                'left': view.left * windowWidth,
                'width': view.width * windowWidth,
                'height': view.height * windowHeight
            });
        } else {
            $('#desc' + ii).css({
                'top': parseInt((-view.top - 1) * windowHeight + headerHeight, 10),
                'left': view.left * windowWidth,
                'width': view.width * windowWidth,
                'height': view.height * windowHeight
            });
        }

        // animate camera
        dis = 300;
        tempPosition = new THREE.Vector3();
        if (!MOBILE_VERSION && (view.id == selected || (-view.top < 0.5 + mouseY && -view.top + view.height > 0.5 + mouseY && view.left < 0.5 + mouseX && view.left + view.width > 0.5 + mouseX))) {
            if (view.id == selected)
                dis = selectedZoom;
            tempPosition.x = -Math.sin(ii + -mouseX * 5 + rendertime) * dis;
            tempPosition.y = -Math.sin(-mouseY * 2) * dis;
            tempPosition.z = -Math.cos(ii + -mouseX * 5 + rendertime) * dis;

            rolledover = view.id;
        } else {
            dis = 500;
            tempPosition.x = -Math.sin(ii + mouseX * 0 + rendertime) * dis;
            tempPosition.y = -Math.sin(mouseY * 0) * dis;
            tempPosition.z = -Math.cos(ii + mouseX * 0 + rendertime) * dis;
        }
        if (!deviceControlsEnabled) {
            camera.position.x -= (camera.position.x - tempPosition.x) / animSpd;
            camera.position.y -= (camera.position.y - tempPosition.y) / animSpd;
            camera.position.z -= (camera.position.z - tempPosition.z) / animSpd;
        } else {
            controls[ii].update();

            camera.position.set(0, 0, 0)
            camera.translateZ(cameraDistance);
        }
        if (nextRenderScreenshot.enabled) {
            if (nextRenderScreenshot.type == "wallpaper") {
                dis = ZOOM_IN_MIN + Math.random() * (ZOOM_IN_MAX - ZOOM_IN_MIN);
                camera.rotation.set(Math.random() * Math.PI * 2, Math.random() * Math.PI * 2, Math.random() * Math.PI * 2);
                camera.position.set(0, 0, 0);
                camera.translateZ(dis);
            } else if (nextRenderScreenshot.type == "gif") {
                dis = (ZOOM_IN_MIN + ZOOM_IN_MAX) / 2;
                camera.rotation.set(0, Math.PI * 2 * nextRenderScreenshot.id / nextRenderScreenshot.num, 0);
                camera.position.set(0, 0, 0);
                camera.translateZ(dis);
            } else if (nextRenderScreenshot.type == "thumbnail") {
                dis = ZOOM_IN_MIN;
                camera.rotation.set(-.1, .1, 0);
                camera.position.set(0, 0, 0);
                camera.translateZ(dis);
            }
        }
        camera.lookAt((scene.position));

        light.position.x = camera.position.x + 100;
        light.position.y = camera.position.y + 100;
        light.position.z = camera.position.z;

        //and render

        var left = Math.floor(windowWidth * view.left);
        var bottom = Math.floor((windowHeight) * (view.top + (view.height)));
        var width = Math.floor(windowWidth * view.width);
        var height = Math.floor(windowHeight * view.height);
        if (view.width > 0.1 && view.height > 0.1 && view.id < globalDB.length) {
            renderer.setViewport(left, bottom, width, height);
            renderer.setScissor(left, bottom, width, height);
            renderer.enableScissorTest(true);

            camera.aspect = width / height;
            camera.updateProjectionMatrix();

            if (asciiShader.enabled) {
                renderer.render(scene, camera, asciiShader.rtTextureColor, true);
            } else {
                renderer.render(scene, camera);
            }
        }
    }

    // postprocessing
    if (asciiShader.enabled) {
        var size = (0.2 + 0.8 * windowHeight / 600 / 4) * 1.5;
        if (size < .5)
            size = .5;
        //if (window.devicePixelRatio)
        //    size /= window.devicePixelRatio
        if (selected != -1 && !MOBILE_VERSION) {
            size *= 1.3;
        }
        if (nextRenderScreenshot.enabled) {
            size *= 0.8;
            if (nextRenderScreenshot.type == "gif") {
                size *= 1.2;
            }
            if (nextRenderScreenshot.type == "thumbnail") {
                size *= 1.5;
            }
        }
        if (MOBILE_VERSION) {
            size *= 1.5;
        }
        uniforms[ 'fontSize'].value = new THREE.Vector2(Math.floor(size * fontWidth), Math.floor(size * fontHeight));
        uniforms[ 'charMapSize'].value = charNum * Math.floor(fontWidth * size);

        renderer.setViewport(0, 0, windowWidth, windowHeight);
        renderer.setScissor(0, 0, windowWidth, windowHeight);
        renderer.render(asciiShader.scene, asciiShader.camera);

        renderer.render(scene, camera, asciiShader.rtTextureColor, true);
    }
    
    // and screenshots
    if (nextRenderScreenshot.enabled) {
        screenshotCompose();
        if (nextRenderScreenshot.type == "thumbnail") {
            nextRenderScreenshot = {enabled: false};
        } else if (nextRenderScreenshot.type == "wallpaper") {
            if (nextRenderScreenshot.id <= nextRenderScreenshot.num - 2) {
                nextRenderScreenshot.id++;
                render(true);
            } else {
                nextRenderScreenshot = {enabled: false};
            }
        } else if (nextRenderScreenshot.type == "gif") {
            if (nextRenderScreenshot.id <= nextRenderScreenshot.num - 2) {
                nextRenderScreenshot.id++;
                render(true);
            } else {
                nextRenderScreenshot = {enabled: false};
            }
        } else {
            nextRenderScreenshot = {enabled: false};
        }

        onWindowResize();
        render(true);
    }
    delta -= delta / 15;
}