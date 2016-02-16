var state = 0;
var rotateStart = new THREE.Vector2();
var rotateEnd = new THREE.Vector2();

var dollyStart = new THREE.Vector2();
var dollyEnd = new THREE.Vector2();
var dollyDelta = new THREE.Vector2();

var cameraDistance = 650;

var touching = false;

function onMouseClick(event) {
    if (event.target.target != '_blank' && $(event.target).attr('href') != "#") {
        $('.js-share.is-active').eq(0).trigger('click');
        $('.js-toggle-info.is-active').eq(0).trigger('click');
        $('.js-toggle-download.is-active').eq(0).trigger('click');
        $('.js-toggle-braintree.is-active').eq(0).trigger('click');

        if (rolledover != -1) {
            if (selected == -1 && (rolledover < globalDB.length) && viewsNum == 9) {
                selected = rolledover;
                showCreature();
            } else {
                showGrid();
            }
        }
    }
}

function onMouseWheel(event) {
    if ($(event.target).closest('.has-scroll').length <= 0) {
        event.preventDefault();
        event.stopPropagation();

        if (event.wheelDelta !== undefined) {
            selectedZoom -= event.wheelDelta / 10;
        } else {
            selectedZoom -= event.detail / 10 * 20;
        }
        if (selectedZoom < ZOOM_IN_MIN)
            selectedZoom = ZOOM_IN_MIN;
        if (selectedZoom > ZOOM_IN_MAX)
            selectedZoom = ZOOM_IN_MAX;
        if (selected != -1)
            return;

        delta = 0;

        if (event.wheelDelta !== undefined) { // WebKit / Opera / Explorer 9

            delta = event.wheelDelta;

        } else if (event.detail !== undefined) { // Firefox

            delta = -event.detail * 20;

        }

        if (window.devicePixelRatio)
            delta *= window.devicePixelRatio;

        delta /= 5000;
    }

}

function touchstart(event) {
    touching = !$(event.target).closest('.header').length && !$(event.target).closest('.popup').length;
    if (!!touching) {
        switch (event.touches.length) {
            case 1:
                state = 1;
                rotateStart.set(event.touches[ 0 ].pageX, event.touches[ 0 ].pageY);
                break;
            case 2:
                state = 2;
                var dx = event.touches[ 0 ].pageX - event.touches[ 1 ].pageX;
                var dy = event.touches[ 0 ].pageY - event.touches[ 1 ].pageY;
                var distance = Math.sqrt(dx * dx + dy * dy);
                dollyStart.set(0, distance);
                break;
            case 3:
                break;
            default:
                state = 0;
        }
    }

}

function touchmove(event) {
    if (!!touching) {
        event.preventDefault();
        event.stopPropagation();
        switch (event.touches.length) {
            case 1:
                if (state !== 1)
                    return;
                rotateEnd.set(event.touches[ 0 ].pageX, event.touches[ 0 ].pageY);
                delta = -(rotateStart.y - rotateEnd.y) / 500;
                deltaX = (rotateStart.x - rotateEnd.x) / 500;
                rotateStart.set(event.touches[ 0 ].pageX, event.touches[ 0 ].pageY);
                if (selected != -1)
                    delta = -delta;
                break;
            case 2:
                if (state !== 2)
                    return;
                var dx = event.touches[ 0 ].pageX - event.touches[ 1 ].pageX;
                var dy = event.touches[ 0 ].pageY - event.touches[ 1 ].pageY;
                var distance = Math.sqrt(dx * dx + dy * dy);
                dollyEnd.set(0, distance);
                dollyDelta.subVectors(dollyEnd, dollyStart);
                if (dollyDelta.y > 0) {
                    cameraDistance -= dollyDelta.y * cameraDistance / 100;
                } else if (dollyDelta.y < 0) {
                    cameraDistance -= dollyDelta.y * cameraDistance / 100;
                }
                if (cameraDistance < ZOOM_IN_MIN)
                    cameraDistance = ZOOM_IN_MIN;
                if (cameraDistance > ZOOM_IN_MAX)
                    cameraDistance = ZOOM_IN_MAX;
                dollyStart.copy(dollyEnd);
                break;
            case 3:
                break;
            default:
                state = 0;
        }
    }

}

function touchend( ) {
    state = 0;
}

function checkKey(e) {
    var keynum;
    if (window.event) { // IE					
        keynum = e.keyCode;
    } else
    if (e.which) { // Netscape/Firefox/Opera					
        keynum = e.which;
    }
    var k = String.fromCharCode(keynum).toLowerCase();
    if (Number(k) == k) {
        asciiMode = Number(k);
        asciiShader.enabled = true;
        uniforms[ 'mode' ].value = Number(k);
    }
    if (keynum == '192') {
        asciiShader.enabled = !asciiShader.enabled;
    }
    if (keynum == '191') {
        geoms = shuffle(geoms)
        var tempTopGlobal = topGlobal;
        topGlobal = 100;
        render(false)
        topGlobal = tempTopGlobal;

    }
    if (keynum == '38')
        prevSuggestion();
    else if (keynum == '40')
        nextSuggestion();
}

function onDocumentMouseMove(event) {
    mouseX = (event.clientX - windowWidth / 2) / windowWidth;
    mouseY = ((event.clientY - headerHeight) - windowHeight / 2) / windowHeight;
}

function onWindowResize() {
    updateSize();
    resizePostprocessing();
}