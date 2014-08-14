(function() {
  var $loaders, LOGGED, OVERLAY_BRAND_URL, UNKNOWN_SIL_URL, dataURItoBlob, facebookConnected, facebookStatusChangeCallback, initCanvas, onEverythingLoaded, swapToImage, twitterLoggedCallback;

  UNKNOWN_SIL_URL = "http://i.imgur.com/BsxSrpW.gif";

  OVERLAY_BRAND_URL = "/public/images/stopis_avatar_overlay.png";

  $loaders = $('.loading');

  LOGGED = false;

  dataURItoBlob = function(dataURI, mime) {
    var byteString, i, ia;
    byteString = window.atob(dataURI);
    ia = new Uint8Array(byteString.length);
    i = 0;
    while (i < byteString.length) {
      ia[i] = byteString.charCodeAt(i);
      i++;
    }
    return new Blob([ia], {
      type: mime
    });
  };

  onEverythingLoaded = function(canvas, avatarImage, overlayImage) {
    var $canvas, canvasHeight, canvasWidth, ctx;
    if (!canvas) {
      return;
    }
    ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }
    $canvas = $(canvas);
    canvasWidth = $canvas.width();
    canvasHeight = $canvas.height();
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    ctx.save();
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(avatarImage, 0, 0, avatarImage.width, avatarImage.height, 0, 0, canvasWidth, canvasHeight);
    ctx.fillStyle = "rgba(234, 6, 17, .75)";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    ctx.drawImage(overlayImage, 0, 0, overlayImage.width, overlayImage.height, 0, 0, canvasWidth, canvasHeight);
    ctx.restore();
    return console.log('Canvas rendering', this, ctx);
  };

  swapToImage = function(canvas) {
    var $canvas, image, imageData, mimeType;
    $canvas = $(canvas);
    mimeType = 'image/png';
    imageData = canvas.toDataURL(mimeType);
    image = new Image;
    image.src = imageData;
    return $('.fallback_img').removeClass('hidden').append(image);
  };

  initCanvas = function() {
    var avatarImage, imagesLoader, overlayImage;
    avatarImage = new Image();
    avatarImage.crossOrigin = "anonymous";
    avatarImage.src = UNKNOWN_SIL_URL;
    overlayImage = new Image();
    overlayImage.src = OVERLAY_BRAND_URL;
    imagesLoader = new imagesLoaded([avatarImage, overlayImage]);
    return imagesLoader.on('done', function(instance) {
      console.log('Canvas Image unkown loaded ok', instance);
      return onEverythingLoaded($('#profile_canvas')[0], avatarImage, overlayImage);
    });
  };

  facebookStatusChangeCallback = function(response) {
    console.log("statusChangeCallback", response);
    if (response.status === "connected") {
      if (LOGGED) {
        FB.logout();
        return;
      }
      LOGGED = 1;
      $loaders.removeClass('hidden');
      return facebookConnected();
    } else if (response.status === "not_authorized") {

    } else {

    }
  };

  twitterLoggedCallback = function(r) {
    console.log('Connected to twitter', r);
    return hello.api(r.network + ':/me', function(p) {
      var avatarPicURL, picAjax, picAjaxParams;
      console.log('Twitter profile is back!', p);
      if (!(p != null ? p.profile_image_url : void 0)) {
        return;
      }
      $loaders.removeClass('hidden');
      avatarPicURL = p.profile_image_url.replace('_normal', '');
      picAjaxParams = {
        url: avatarPicURL
      };
      picAjax = $.ajax({
        url: "https://sender.blockspring.com/api_v1/blocks/1422740194bcb80db36ebc0dabbc55d0?api_key=c7ec96c268e41780753eda8ea0410ce0",
        type: "POST",
        data: picAjaxParams,
        crossDomain: true
      });
      picAjax.fail(function(err) {
        console.log('Twitter ajax pic error', err);
        $loaders.addClass('hidden');
        return alert("We couldn't get your Twitter profile pic. Try facebook or contact us help@stopis.org. Error 194.");
      });
      return picAjax.done(function(res) {
        var avatarImage, imagesLoader, overlayImage;
        console.log('Twitter ajax response ok', res);
        if (!(res != null ? res.results : void 0)) {
          return;
        }
        avatarImage = new Image();
        avatarImage.crossOrigin = "anonymous";
        avatarImage.src = res.results;
        overlayImage = new Image();
        overlayImage.src = OVERLAY_BRAND_URL;
        imagesLoader = new imagesLoaded([avatarImage, overlayImage]);
        imagesLoader.on('always', function() {
          return $loaders.addClass('hidden');
        });
        imagesLoader.on('fail', function(error) {
          console.log('Twitter pics loading error', error);
          return alert("We couldn't get your Twitter profile pic. Try facebook or contact us help@stopis.org. Error 195.");
        });
        return imagesLoader.on('done', function(instance) {
          var $canvas, e;
          console.log('Twitter Images loaded ok', instance);
          $('.pic').removeClass('unknown').css('background-image', "url(" + avatarPicURL + ")");
          $canvas = $('#profile_canvas');
          $canvas.width(512);
          $canvas.height(512);
          onEverythingLoaded($canvas[0], avatarImage, overlayImage);
          $('.tmp-pics').addClass('hidden');
          $('.download').removeClass('hidden');
          swapToImage($canvas[0]);
          try {
            ga('send', 'event', 'app', 'picture_created', 'tw');
          } catch (_error) {
            e = _error;
            console.log('Analytics failed in tw picture creation', e);
          }
          return;
          $('.tmp-pics').addClass('hidden');
          $('.setpic').removeClass('hidden');
          return $('.setpic .btn').click(function(ev) {
            var helloParams, imageData, mimeType;
            console.log('Twitter set as profile picture clicked');
            ev.preventDefault();
            if (!$canvas || !$canvas[0]) {
              return;
            }
            mimeType = 'image/jpeg';
            imageData = $canvas[0].toDataURL(mimeType, 0.65);
            helloParams = {
              include_entities: "true",
              image: imageData.replace(/^data:image\/(png|jpg|jpeg);base64,/, '')
            };
            console.log('Twitter helloparams', {
              h: helloParams
            });
            return hello('twitter').api("me/avatar", "post", helloParams, function(res) {
              return console.log('Twitter pic posted response', res, helloParams);
            });
          });
        });
      });
    });
  };

  facebookConnected = function() {
    console.log("Welcome!  Fetching your information.... ");
    $loaders.removeClass('hidden');
    return FB.api("/me/picture?width=512&height=512", function(response) {
      var avatarImage, avatarPicURL, imagesLoader, overlayImage;
      if (response.data.is_silouette) {
        alert('No profile picture found.');
        return;
      }
      avatarPicURL = response.data.url;
      avatarImage = new Image();
      avatarImage.crossOrigin = "anonymous";
      avatarImage.src = avatarPicURL;
      overlayImage = new Image();
      overlayImage.src = OVERLAY_BRAND_URL;
      imagesLoader = new imagesLoaded([avatarImage, overlayImage]);
      imagesLoader.on('always', function() {
        return $loaders.addClass('hidden');
      });
      imagesLoader.on('error', function(error) {
        console.log('Facebook pics loading error', error);
        return alert("We couldn't get your Facebook profile pic. Try twitter or contact us help@stopis.org / @STOPISORG");
      });
      imagesLoader.on('done', function(instance) {
        var $canvas, e;
        console.log('Facebook Images loaded ok', instance);
        $('.pic').removeClass('unknown').css('background-image', "url(" + avatarPicURL + ")");
        $canvas = $('#profile_canvas');
        $canvas.width(512);
        $canvas.height(512);
        onEverythingLoaded($canvas[0], avatarImage, overlayImage);
        $('.tmp-pics').addClass('hidden');
        $('.download').removeClass('hidden');
        swapToImage($canvas[0]);
        try {
          ga('send', 'event', 'app', 'picture_created', 'fb');
        } catch (_error) {
          e = _error;
          console.log('Analytics failed in fb picture creation', e);
        }
        return;
        $('.tmp-pics').addClass('hidden');
        $('.setpic').removeClass('hidden');
        return $('.setpic .btn').click(function(ev) {
          var access_token, blob, form, imageData, mimeType, uploadParams, win;
          ev.preventDefault();
          if (!$canvas || !$canvas[0]) {
            return;
          }
          mimeType = 'image/png';
          imageData = $canvas[0].toDataURL(mimeType);
          imageData = imageData.replace(/^data:image\/(png|jpg);base64,/, '');
          try {
            blob = dataURItoBlob(imageData, mimeType);
          } catch (_error) {
            e = _error;
            console.log('blob failed', e);
          }
          access_token = FB.getAuthResponse()['accessToken'];
          console.log('binary ', imageData, blob);
          if (!blob) {
            return;
          }
          form = new FormData();
          form.append("access_token", access_token);
          form.append("source", blob);
          form.append("message", '#STOPIS http://STOPIS.org');
          win = open("about:blank", "_blank", "width=1, height= 1, left=" + screenLeft + ", top=" + screenTop);
          if (!win) {
            return;
          }
          win.document.write("<strong>Loading...</strong>");
          $.ajax({
            url: "https://graph.facebook.com/me/photos?access_token=" + access_token,
            type: "POST",
            data: form,
            processData: false,
            contentType: false,
            cache: false,
            success: function(data) {
              var h, left, makeProfileURL, picid, top, w;
              console.log("Facebook ajax success ", data);
              try {
                ga('send', 'event', 'app', 'picture_uploaded', 'fb');
              } catch (_error) {
                e = _error;
                console.log('Analytics failed in facebook picture posted', e);
              }
              if (!win) {
                return;
              }
              picid = data.id;
              makeProfileURL = "https://m.facebook.com/photo.php?fbid=" + picid + "&prof";
              w = 330;
              h = 600;
              left = (($(window).width()) / 2) + screenLeft - (w / 2);
              top = ($(document.body).height() / 2) + screenTop - (h / 2);
              win.resizeTo(w, h);
              win.moveTo(left, top);
              return win.location = makeProfileURL;
            },
            error: function(shr, status, data) {
              console.log("Facebook ajax error ", data + " Status ", shr.status);
              alert('We are sorry. Facebook returned an error. Please report it on github.com/stopis. #11');
              return win.close();
            }
          });
          uploadParams = {
            message: '#STOPIS stopis.org',
            source: imageData
          };
          return FB.api("/me/photos", 'post', uploadParams, function(response) {
            return console.log('Upload Response', response);
          });
        });
      });
      return console.log("Successful login ", avatarPicURL);
    });
  };

  window.fbAsyncInit = function() {
    FB.init({
      appId: "313186485472622",
      cookie: true,
      xfbml: true,
      version: "v2.0"
    });
    return FB.getLoginStatus(function(response) {
      return facebookStatusChangeCallback(response);
    });
  };

  (function(d, s, id) {
    var fjs, js;
    js = void 0;
    fjs = d.getElementsByTagName(s)[0];
    if (d.getElementById(id)) {
      return;
    }
    js = d.createElement(s);
    js.id = id;
    js.src = "//connect.facebook.net/en_US/sdk.js";
    return fjs.parentNode.insertBefore(js, fjs);
  })(document, "script", "facebook-jssdk");

  hello.on('auth.login', function(r) {
    if (LOGGED) {
      hello('twitter').logout();
      return;
    }
    LOGGED = 1;
    return twitterLoggedCallback(r);
  });

  hello.init({
    twitter: '9mc19rYyrkYD8arSeoDjX5QHi'
  }, {
    redirect_uri: '/',
    oauth_proxy: 'https://auth-server.herokuapp.com/proxy'
  });

  initCanvas();

  $('.tw').click(function(ev) {
    console.log('twitter clicked');
    return hello.login('twitter');
  });

  $('.fb').click(function(ev) {
    console.log('facebook clicked');
    FB.login(facebookStatusChangeCallback, {
      scope: 'public_profile,publish_actions'
    });
    return {
      auth_type: 'reauthenticate'
    };
  });

  $('.share_fb').click(function(ev) {
    ev.preventDefault();
    return FB.ui({
      method: 'feed',
      link: location.toString(),
      name: '#STOPIS',
      caption: 'Change your avatar. Stop the genocide. Save lives.',
      description: "In 2014 the Islamic State is expanding fast. Killing those who don't convert to Islam. This is not a political problem, it's a problem of everyone and this innocent people need your help. Change your profile picture now, stop the horrific genocide.",
      picture: "https://pbs.twimg.com/profile_images/499414418594070528/HZbwJbMj.png",
      message: ''
    });
  });

}).call(this);
