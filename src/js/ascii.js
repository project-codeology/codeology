var alphabetTexture;
var fontWidth = 10;
var fontHeight = 14;
var uniforms;
var alphabetCanvas;
var dpr = 1;
var charNum = 128;
var renderWindow = {width: window.innerWidth, height: window.innerHeight};
var asciiMode = 0;

function initPostprocessing() {

    var image = new Image(), texture = new THREE.Texture(image);
    var hash = document.createElement("canvas");
    hash.style.opacity = 0;
    image.onload = function () {
        texture.needsUpdate = true;
    };
    image.src = hash.toDataURL();

    var alphabetImage = new Image();
    alphabetCanvas = document.createElement('canvas');
    alphabetCanvas.setAttribute("id", "alphabetCanvas");

    alphabetTexture = new THREE.Texture(alphabetCanvas);
    alphabetTexture.needsUpdate = true;
    alphabetTexture.minFilter = THREE.NearestFilter;

    updateAlphabet();

    asciiShader.scene = new THREE.Scene();
    asciiShader.camera = new THREE.OrthographicCamera(renderWindow.width / -2, renderWindow.width / 2, renderWindow.height / 2, renderWindow.height / -2, -10000, 10000);
    asciiShader.camera.position.z = 100;

    var pars = {minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBFormat};
    asciiShader.rtTextureDepth = new THREE.WebGLRenderTarget(renderWindow.width, renderWindow.height, pars);
    asciiShader.rtTextureColor = new THREE.WebGLRenderTarget(renderWindow.width, renderWindow.height, pars);
    asciiShader.quad = new THREE.Mesh(new THREE.PlaneBufferGeometry(1, 1), null);
    asciiShader.quad.position.z = -500;
    asciiShader.scene.add(asciiShader.quad);
}

function updateAlphabet(string) {
    if (!string || string === "")
        string = '.\'`^",:;Il!i~+_-?][}{1)(/tfjrxnuvczmwqpdbkhaoXYUJCLQ0OZ#MW&8%B@$';
    alphabetCanvas.width = charNum * fontWidth * dpr;
    alphabetCanvas.height = fontHeight * dpr;
    var ctx = alphabetCanvas.getContext("2d");
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, alphabetCanvas.width, alphabetCanvas.height);
    ctx.fillStyle = "#FFFFFF";
    ctx.shadowColor = '#FFFFFF';
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.shadowBlur = 3 * dpr;
    ctx.font = fontHeight * 1.0 * dpr + "px BTMono";
    ctx.scale(1, -1);
    ctx.textAlign = 'center';
    for (var i = 0; i < charNum; i++) {
        var id = Math.floor(string.length * (1 - (i + 1) / (charNum)));
        var letter = string.substr(id, 1);
        for (var j = 0; j < 3; j++) {
            ctx.fillText(letter, (0.5 + i * fontWidth + fontWidth / 2 - 0.5) * dpr, -2.5 * dpr);
        }
    }
    alphabetTexture.needsUpdate = true;
    //document.body.appendChild(alphabetCanvas);

    console.log(
            " " + "\n" +
            " ▄████▄  ▒█████ ▒█████▄▓█████ ▒█████  ██▓    ▒█████   ▄███▓██   ██▓" + "\n" +
            "▒██▀ ▀█ ▒██▒  ██▒██▀ ██▓█   ▀▒██▒  ██▓██▒   ▒██▒  ██▒██▒ ▀█▒██  ██▒" + "\n" +
            "▒▓█    ▄▒██░  ██4██   █▒███  ▒██░  ██▒██3   ▒██░  ██▒██░▄▄▄░▒██ ██░" + "\n" +
            "▒▓▓▄ ▄██▒██   ██░██▄ ▄█▒▓█  ▄▒██   ██▒██░   ▒██   ██░▓█  ██▓6 ▐██▓░" + "\n" +
            "▒ ▓███▀ ░ ████▓▒░████▓░░▒████░ ████▓▒░██████░ ████▓▒░▒▓███▀▒░ ██▒▓░" + "\n" +
            "8 ░▒ ▒  ░ ▒░▒░▒░ ▒9▓  ▒░░ ▒░ ░ ▒░▒░▒░2 ▒░▓  ░ ▒░▒░▒░ ░▒   ▒  ██▒▒▒ " + "\n" +
            "  ░  ▒    7 ▒ ▒░ ░ ▒  ▒ ░ ░  ░ ░ ▒ ▒░░ ░ ▒  ░ ░ ▒ ▒░  ░   0▓██ ░▒░ " + "\n" +
            "  ░     ░ ░ ░ ▒  ░ ░  ░   ░1 ░ ░ ░ ▒   ? ░  ░ ░ 5 ▒ ░ ░   ░▒ ▒ ░░  " + "\n" +
            "  ░   ~     ░ ░    ░      ░  ░   ░ ░     ░  ░   ░ ░       ░░ ░     " + "\n" +
            "                 ░                                         ░ ░     "
            )
}

function resizePostprocessing() {
    if (!asciiShader.camera)
        return;
    renderer.setSize(windowWidth, windowHeight);
    renderer.domElement.style.position = "absolute";
    renderer.domElement.style.top = headerHeight + "px";

    renderWindow = {width: windowWidth, height: windowHeight};

    asciiShader.camera.left = renderWindow.width / -2;
    asciiShader.camera.right = renderWindow.width / 2;
    asciiShader.camera.top = renderWindow.height / 2;
    asciiShader.camera.bottom = renderWindow.height / -2;
    asciiShader.camera.updateProjectionMatrix();

    asciiShader.quad.scale.x = renderWindow.width;
    asciiShader.quad.scale.y = renderWindow.height;

    var pars = {minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBFormat};
    asciiShader.rtTextureColor = new THREE.WebGLRenderTarget(renderWindow.width, renderWindow.height, pars);
    asciiShader.material = new THREE.ShaderMaterial({
        uniforms: {
            inputTexture: {type: 't', value: asciiShader.rtTextureColor},
            asciiTexture: {type: 't', value: alphabetTexture},
            hashTexture: {type: 't', value: THREE.ImageUtils.loadTexture("/dist/images/fontHash.png")}, //
            mode: {type: 'f', value: asciiMode},
            numChars: {type: 'f', value: charNum},
            rx: {type: 'f', value: renderWindow.width},
            ry: {type: 'f', value: renderWindow.height},
            charMapSize: {type: 'f', value: charNum * fontWidth},
            fontSize: {type: 'v2', value: new THREE.Vector2(fontWidth, fontHeight)}

        },
        vertexShader: document.getElementById('vertexShader').textContent,
        fragmentShader: document.getElementById('fragmentShader').textContent,
        side: THREE.DoubleSide
    });

    uniforms = asciiShader.material.uniforms;

    var material = new THREE.ShaderMaterial({
        fragmentShader: asciiShader.material.fragmentShader,
        vertexShader: asciiShader.material.vertexShader,
        uniforms: uniforms
    });

    asciiShader.quad.material = material;
}