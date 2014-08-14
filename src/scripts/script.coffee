UNKNOWN_SIL_URL = "http://i.imgur.com/BsxSrpW.gif"
OVERLAY_BRAND_URL = "/public/images/stopis_avatar_overlay.png"
$loaders = $('.loading')

LOGGED = false

dataURItoBlob = (dataURI, mime) ->

  # convert base64 to raw binary data held in a string
  # doesn't handle URLEncoded DataURIs
  byteString = window.atob dataURI

  # separate out the mime component

  # write the bytes of the string to an ArrayBuffer
  #var ab = new ArrayBuffer(byteString.length);
  ia = new Uint8Array byteString.length
  i = 0

  while i < byteString.length
    ia[i] = byteString.charCodeAt(i)
    i++

  # write the ArrayBuffer to a blob, and you're done
  new Blob [ia], type: mime

onEverythingLoaded = (canvas, avatarImage, overlayImage) ->
  return if !canvas
  ctx = canvas.getContext("2d")
  return if !ctx
  $canvas = $(canvas)
  canvasWidth = $canvas.width()
  canvasHeight = $canvas.height()
  canvas.width = canvasWidth
  canvas.height = canvasHeight
  ctx.save()
  ctx.clearRect 0, 0, canvasWidth, canvasHeight
  ctx.imageSmoothingEnabled = true
  ctx.drawImage avatarImage, 0, 0, avatarImage.width, avatarImage.height, 0, 0, canvasWidth, canvasHeight
  ctx.fillStyle = "rgba(234, 6, 17, .75)"
  ctx.fillRect 0, 0, canvasWidth, canvasHeight
  ctx.drawImage overlayImage, 0, 0, overlayImage.width, overlayImage.height, 0, 0, canvasWidth, canvasHeight
  ctx.restore()
  console.log 'Canvas rendering', this, ctx

swapToImage = (canvas) ->
  $canvas = $(canvas)
  mimeType = 'image/png'
  imageData = canvas.toDataURL mimeType

  image = new Image
  image.src = imageData
  $('.fallback_img').removeClass('hidden').append image

initCanvas = ->
  avatarImage = new Image()
  avatarImage.crossOrigin = "anonymous"
  avatarImage.src = UNKNOWN_SIL_URL
  overlayImage = new Image()
  overlayImage.src = OVERLAY_BRAND_URL
  imagesLoader = new imagesLoaded([avatarImage, overlayImage])
  imagesLoader.on 'done', (instance) ->
    console.log 'Canvas Image unkown loaded ok', instance
    onEverythingLoaded($('#profile_canvas')[0], avatarImage, overlayImage)

facebookStatusChangeCallback = (response) ->
  console.log "statusChangeCallback", response

  if response.status is "connected"
    if LOGGED
      FB.logout()
      return
    LOGGED = 1
    $loaders.removeClass('hidden')
    facebookConnected()
  else if response.status is "not_authorized"
    # The person is logged into Facebook, but not your app.
  else
    # The person is not logged into Facebook, so we're not sure if
    # they are logged into this app or not.

twitterLoggedCallback = (r) ->
  console.log 'Connected to twitter', r
  hello.api r.network+':/me', (p) ->
    console.log 'Twitter profile is back!', p

    return unless p?.profile_image_url


    $loaders.removeClass('hidden')

    avatarPicURL = p.profile_image_url.replace '_normal', ''

    picAjaxParams =
      url: avatarPicURL
    picAjax = $.ajax
      url: "https://sender.blockspring.com/api_v1/blocks/1422740194bcb80db36ebc0dabbc55d0?api_key=c7ec96c268e41780753eda8ea0410ce0"
      type: "POST"
      data: picAjaxParams
      crossDomain: true
    picAjax.fail (err) ->
      console.log 'Twitter ajax pic error', err
      $loaders.addClass('hidden')
      alert "We couldn't get your Twitter profile pic. Try facebook or contact us help@stopis.org. Error 194."
    picAjax.done (res) ->
      console.log 'Twitter ajax response ok', res

      return unless res?.results

      avatarImage = new Image()
      avatarImage.crossOrigin = "anonymous"
      avatarImage.src = res.results
      overlayImage = new Image()
      overlayImage.src = OVERLAY_BRAND_URL
      imagesLoader = new imagesLoaded([avatarImage, overlayImage])
      imagesLoader.on 'always', ->
        $loaders.addClass('hidden')
      imagesLoader.on 'fail', (error) ->
        console.log 'Twitter pics loading error', error
        alert "We couldn't get your Twitter profile pic. Try facebook or contact us help@stopis.org. Error 195."
      imagesLoader.on 'done', (instance) ->
        console.log 'Twitter Images loaded ok', instance
        $('.pic').removeClass('unknown').css 'background-image', "url(#{avatarPicURL})"
        $canvas = $('#profile_canvas')
        $canvas.width(512)
        $canvas.height(512)

        onEverythingLoaded $canvas[0], avatarImage, overlayImage

        $('.tmp-pics').addClass('hidden')
        $('.download').removeClass('hidden')

        swapToImage $canvas[0]

        try
          ga('send', 'event', 'app', 'picture_created', 'tw')
        catch e
          console.log 'Analytics failed in tw picture creation', e

        # We haven't figured a way yet to upload pic directly.
        # The code below works but the canvas/pic size has to be
        # <= 100px sq. This limit seems to be due the base64
        # being sent over the URI to the proxy.
        return

        $('.tmp-pics').addClass('hidden')
        $('.setpic').removeClass('hidden')

        $('.setpic .btn').click (ev) ->
          console.log 'Twitter set as profile picture clicked'

          ev.preventDefault()

          return if !$canvas || !$canvas[0]

          mimeType = 'image/jpeg'
          imageData = $canvas[0].toDataURL mimeType, 0.65

          helloParams =
            include_entities: "true"
            image: imageData.replace /^data:image\/(png|jpg|jpeg);base64,/, ''
            #suppress_response_codes: false
          console.log 'Twitter helloparams', {h: helloParams}
          hello('twitter').api "me/avatar", "post", helloParams, (res) ->
            console.log 'Twitter pic posted response', res, helloParams



facebookConnected = ->
  console.log "Welcome!  Fetching your information.... "
  $loaders.removeClass('hidden')
  FB.api "/me/picture?width=512&height=512", (response) ->

    if response.data.is_silouette
      alert('No profile picture found.')
      return

    avatarPicURL = response.data.url
    avatarImage = new Image()
    avatarImage.crossOrigin = "anonymous"
    avatarImage.src = avatarPicURL
    overlayImage = new Image()
    overlayImage.src = OVERLAY_BRAND_URL
    imagesLoader = new imagesLoaded([avatarImage, overlayImage])
    imagesLoader.on 'always', ->
      $loaders.addClass('hidden')
    imagesLoader.on 'error', (error) ->
      console.log 'Facebook pics loading error', error
      alert "We couldn't get your Facebook profile pic. Try twitter or contact us help@stopis.org / @STOPISORG"
    imagesLoader.on 'done', (instance) ->
      console.log 'Facebook Images loaded ok', instance
      $('.pic').removeClass('unknown').css 'background-image', "url(#{avatarPicURL})"
      $canvas = $('#profile_canvas')
      $canvas.width(512)
      $canvas.height(512)

      onEverythingLoaded $canvas[0], avatarImage, overlayImage

      # TODO This is temporary while facebook give us publishing permissions.
      # May take days, and we can't wait for them. So many might die in-between
      # :(
      $('.tmp-pics').addClass('hidden')
      $('.download').removeClass('hidden')

      swapToImage $canvas[0]

      try
        ga('send', 'event', 'app', 'picture_created', 'fb')
      catch e
        console.log 'Analytics failed in fb picture creation', e

      return
      $('.tmp-pics').addClass('hidden')
      $('.setpic').removeClass('hidden')

      $('.setpic .btn').click (ev) ->

        ev.preventDefault()

        return if !$canvas || !$canvas[0]

        mimeType = 'image/png'
        imageData = $canvas[0].toDataURL mimeType
        #imageData = imageData.replace '=', ''
        imageData = imageData.replace /^data:image\/(png|jpg);base64,/, ''
        try
          blob = dataURItoBlob imageData, mimeType
        catch e
          console.log 'blob failed', e
        access_token = FB.getAuthResponse()['accessToken']

        console.log 'binary ', imageData, blob
        return if !blob
        form = new FormData()
        form.append "access_token", access_token
        form.append "source", blob #"%7B#{blob}%7D"
        form.append "message",'#STOPIS http://STOPIS.org'

        win = open("about:blank", "_blank", "width=1, height= 1, left=#{screenLeft}, top=#{screenTop}")
        return if !win
        win.document.write("<strong>Loading...</strong>")

        $.ajax
          url:"https://graph.facebook.com/me/photos?access_token=#{access_token}"
          type: "POST"
          data: form
          processData: false
          contentType: false
          cache: false
          success: (data) ->
            console.log "Facebook ajax success ", data

            try
              ga('send', 'event', 'app', 'picture_uploaded', 'fb')
            catch e
              console.log 'Analytics failed in facebook picture posted', e

            return if !win
            picid = data.id
            makeProfileURL = "https://m.facebook.com/photo.php?fbid=#{picid}&prof"

            w = 330
            h = 600
            left = (($(window).width())/2)+screenLeft-(w/2)
            top = ($(document.body).height()/2)+screenTop-(h/2)
            win.resizeTo w, h
            win.moveTo left, top
            win.location = makeProfileURL

          error: (shr,status,data) ->
            console.log "Facebook ajax error ", data + " Status ", shr.status
            alert 'We are sorry. Facebook returned an error. Please report it on github.com/stopis. #11'
            win.close()

        uploadParams =
          message: '#STOPIS stopis.org'
          source: imageData
        FB.api "/me/photos", 'post', uploadParams, (response) ->
          console.log 'Upload Response', response

    console.log "Successful login ", avatarPicURL


# FACEBOOK SETUP
window.fbAsyncInit = ->
  FB.init
    appId: "313186485472622"
    cookie: true
    xfbml: true
    version: "v2.0"

  FB.getLoginStatus (response) ->
    facebookStatusChangeCallback response

((d, s, id) ->
  js = undefined
  fjs = d.getElementsByTagName(s)[0]
  return  if d.getElementById(id)
  js = d.createElement(s)
  js.id = id
  js.src = "//connect.facebook.net/en_US/sdk.js"
  fjs.parentNode.insertBefore js, fjs
) document, "script", "facebook-jssdk"



# TWITTER SETUP
hello.on 'auth.login', (r) ->
  if LOGGED
    hello('twitter').logout()
    return
  LOGGED = 1
  twitterLoggedCallback(r)


hello.init \
  { twitter: '9mc19rYyrkYD8arSeoDjX5QHi' }, \
  { redirect_uri: '/', \
    oauth_proxy: 'https://auth-server.herokuapp.com/proxy' }


# CANVAS SETUP
initCanvas()

# UI CALLBACKS
$('.tw').click (ev) ->
  console.log 'twitter clicked'
  hello.login 'twitter'

$('.fb').click (ev) ->
  console.log 'facebook clicked'
  FB.login \
    facebookStatusChangeCallback, \
    scope: 'public_profile,publish_actions'
    auth_type: 'reauthenticate'

$('.share_fb').click (ev) ->
  ev.preventDefault()
  FB.ui
    method: 'feed'
    link: location.toString()
    name: '#STOPIS'
    caption: 'Change your avatar. Stop the genocide. Save lives.'
    description: "In 2014 the Islamic State is expanding fast. Killing those who don't convert to Islam. This is not a political problem, it's a problem of everyone and this innocent people need your help. Change your profile picture now, stop the horrific genocide."
    picture: "https://pbs.twimg.com/profile_images/499414418594070528/HZbwJbMj.png"
    message: ''
