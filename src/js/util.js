var canvas, context, totalGifFrames, buffer, gif, pixels;

function setupHistory() {
    if (!HISTORY_ENABLED)
        return;
    var State = History.getState();
    var url = State.url.split("://")[1];
    if (State.hash == "/?skipTest") {
        skipFPSCheck = true;
        url = '/featured';
    }
    var urlArr = url.split("/");

    if (urlArr[3]) // if featured project
        preload('featured', urlArr[3]);//preload(urlArr[2], urlArr[3]);

    else if (urlArr[2]) // if project
        preload(urlArr[1], urlArr[2]);

    else if (urlArr[1] && urlArr[1] !== 'featured') { // if author
        preload(urlArr[1]);
        if (MOBILE_VERSION)
            selected = 0;
    } else {
        preload('featured');
        selected = Math.floor(Math.random() * 6);
        if (MOBILE_VERSION)
            selected = 0;
    }

    History.Adapter.bind(window, 'statechange', function () {
        var State = History.getState();
    });

    ArraySeed = {random: new Math.seedrandom('marpi')};
}


function screenshot(type) {
    if (type === null)
        type = "thumbnail";
    if (!asciiShader.enabled && type == "thumbnail")
        return;

    if (selected === -1)
        return;

    var num = 1;

    var windowWidth = 1200;
    var windowHeight = 630;

    if (type == "wallpaper") {
        windowWidth = window.screen.availWidth;
        windowHeight = window.screen.availHeight;
        if (window.devicePixelRatio) {
            windowWidth *= window.devicePixelRatio;
            windowHeight *= window.devicePixelRatio;
        }
        if (windowWidth >= 1920) {
            windowWidth = 1920;
            windowHeight = 1080;
        }
        num = 6;
    }
    if (type == "gif") {
        canvas = document.createElement('canvas');
        canvas.width = 300;
        canvas.height = 300;

        context = canvas.getContext('2d');

        totalGifFrames = 120;

        buffer = new Uint8Array(canvas.width * canvas.height * totalGifFrames * 5);
        gif = new GifWriter(buffer, canvas.width, canvas.height, {loop: 0});

        pixels = new Uint8Array(canvas.width * canvas.height);

        windowWidth = canvas.width;
        windowHeight = canvas.height;
        num = totalGifFrames;
    }

    nextRenderScreenshot = {enabled: true, width: windowWidth, height: windowHeight, type: type, id: 0, num: num};

    render();

}


function addFrame() {
    context.drawImage(renderer.domElement, 0, 0);
    var data = context.getImageData(0, 0, canvas.width, canvas.height).data;
    var palette = [];
    for (var j = 0, k = 0, jl = data.length; j < jl; j += 4, k++) {
        var r = Math.floor(data[ j + 0 ] * 0.02) * 50;
        var g = Math.floor(data[ j + 1 ] * 0.02) * 50;
        var b = Math.floor(data[ j + 2 ] * 0.02) * 50;
        var color = r << 16 | g << 8 | b << 0;
        var index = palette.indexOf(color);
        if (index === -1) {
            pixels[ k ] = palette.length;
            palette.push(color);
        } else {
            pixels[ k ] = index;
        }
    }

    var powof2 = 1;
    while (powof2 < palette.length)
        powof2 <<= 1;
    palette.length = powof2;

    while (palette.length > 256) {
        var palette2 = [];

        for (var i = 0; i < palette.length; i = i + 2) {
            palette2.push(palette[i]);
        }
        palette = palette2;
    }
    gif.addFrame(0, 0, canvas.width, canvas.height, pixels, {palette: new Uint32Array(palette), delay: 5});

}


function finish() {

    var string = '';
    for (var i = 0, l = gif.end(); i < l; i++) {
        string += String.fromCharCode(buffer[ i ]);
    }
    // force browser download
    var link = document.createElement('a');
    link.download = "gif-" + user + "-" + repo + "-" + nextRenderScreenshot.id+".gif";
    link.href = 'data:image/gif;base64,' + btoa(string);
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    link.remove();
}


function screenshotCompose() {
    var data = renderer.domElement.toDataURL('image/jpg');

    var url0 = currentLocation.split("/");
    if (url0[0] == 'featured' && url0[2])
    {
        user = url0[1];
        repo = url0[2];
    } else
    if (url0[0] == 'featured')
    {
        user = '';
        repo = url0[1];
    } else
    {
        user = url0[0];
        repo = url0[1];
    }

    if (nextRenderScreenshot.type == "thumbnail") {
        var windowWidth = 1200;
        var windowHeight = 630;
        canvas = document.createElement('canvas');
        canvas.width = windowWidth;
        canvas.height = windowHeight;

        context = canvas.getContext('2d');
        context.drawImage(renderer.domElement, 0, 0);

        context.fillStyle = "#FFFFFF";
        context.shadowColor = '#000000';
        context.shadowOffsetX = 0;
        context.shadowOffsetY = 0;
        context.shadowBlur = 3 * dpr;
        context.textAlign = 'right';
        context.font = 40 + "px BTMono";
        context.fillText(globalDB[selected].username, windowWidth - 50, windowHeight - 80);
        context.font = 20 + "px BTMono";
        context.fillText(globalDB[selected].project, windowWidth - 50, windowHeight - 50);
        data = canvas.toDataURL("image/jpg");

        var output = data.replace(/^data:image\/(png|jpg);base64,/, "");
        //window.open(data, "test");
        var url = SERVER + "api/og?action=set&user=" + user + "&repo=" + repo + "&format=json";
        $.post(url, {screen: output, user: user}, function (data) {
            //console.log(data);
        });

    } else if (nextRenderScreenshot.type == "wallpaper") {
        var filename = "wallpaper-" + user + "-" + repo + "-" + nextRenderScreenshot.id;
        $("#wallpaper" + nextRenderScreenshot.id).attr("src", data).closest('a').attr('href', data).attr('download', filename);
    } else if (nextRenderScreenshot.type == "gif") {
        if (nextRenderScreenshot.id < nextRenderScreenshot.num - 1) {
            addFrame();
        } else {
            finish();
        }
    }
}


function compare(a, b) {
    if (a.updated_at < b.updated_at)
        return 1;
    if (a.updated_at > b.updated_at)
        return -1;
    return 0;
}


function shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;

    while (0 !== currentIndex) {

        randomIndex = Math.floor(ArraySeed.random() * currentIndex);
        currentIndex -= 1;

        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
}


function toggleFullScreen() {
    if (!document.fullscreenElement && !document.mozFullScreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement) {  // current working methods
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen();
        } else if (document.documentElement.msRequestFullscreen) {
            document.documentElement.msRequestFullscreen();
        } else if (document.documentElement.mozRequestFullScreen) {
            document.documentElement.mozRequestFullScreen();
        } else if (document.documentElement.webkitRequestFullscreen) {
            document.documentElement.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
        }
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        }
    }
}

function isPageHidden() {
    return document.hidden || document.msHidden || document.webkitHidden || document.mozHidden;
}

window.mobilecheck = function () {
    var check = false;
    (function (a) {
        if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4)))
            check = true;
    })(navigator.userAgent || navigator.vendor || window.opera);
    return check;
};


window.mobileAndTabletcheck = function () {
    var check = false;
    (function (a) {
        if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4)))
            check = true;
    })(navigator.userAgent || navigator.vendor || window.opera);
    return check;
};