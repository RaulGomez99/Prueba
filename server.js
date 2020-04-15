const express = require('express');
const app = express();
const {google} = require('googleapis');
app.use(express.json());
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth2').Strategy;
app.use(passport.initialize());
app.use(passport.session());


const GOOGLE_CLIENT_ID = "166086701855-5h7ni5q9u1dfb4p0u5a014opfq037v34.apps.googleusercontent.com";
const GOOGLE_CLIENT_SECRET = '1eKtEmyTSuCRuZk14VIaE7Im';

const fetch = require('node-fetch');
const Bluebird = require('bluebird');
fetch.Promise = Bluebird;


app.use(express.static('public'));
app.listen(3000, ()=>{console.log("App escuchando en el 3000")});

passport.serializeUser((user,done)=>{
    done(null,user)
})

passport.use(new GoogleStrategy({
        clientID:GOOGLE_CLIENT_ID,
        clientSecret:GOOGLE_CLIENT_SECRET,
        callbackURL:"/auth/google/callback",
        proxy:true,
    },(accessToken, refreshToken, profile,done)=>{
        console.log(accessToken);
        console.log(profile)
        const user = {
            userId:profile.id,
            username:profile.displayName,
            picture:profile._json.picture,
            name:profile.givenName,
            secondName: profile.familyName,
            email:profile.email,
            token: accessToken,
            refreshToken
        }
        done(null,user)
    })
)

app.get('/auth/google',passport.authenticate('google',{
    scope:[
        'profile',
        'email',
        'https://www.googleapis.com/auth/admin.directory.group.member.readonly',
        'https://www.googleapis.com/auth/admin.directory.user',
        'https://www.googleapis.com/auth/admin.directory.customer.readonly',
        'https://apps-apis.google.com/a/feeds/emailsettings/2.0/',
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.settings.basic',
        'https://www.googleapis.com/auth/gmail'
    ]
}))

app.get("/auth/google/callback",passport.authenticate('google'),async(req,res)=>{
    const oauth2Client = new google.auth.OAuth2(
        GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, "/auth/google/callback");
    oauth2Client.setCredentials({
        access_token: req.user.token,
        refresh_token: req.user.refreshToken
    })
    listUsers(oauth2Client, res);
})

function datos(user){
    return  `<h1>Logueado con google con la cuenta: ${user.userId}</h1>`+
            `<p>${user.username}</p>`+
            `<p>${user.email}</p>`+
            `<img src=${user.picture}>`
}

function listUsers(auth, resp) {
  // const gmail = google.gmail({version:'v1',auth});
  // gmail.users.settings.sendAs.update({
  //   userId: 'me',
  //   sendAsEmail: 'gomezlopezraul1999x@gmail.com',
  //   fields: 'signature',
  //   resource: {
  //       signature: '<div dir="ltr">Hello there</div>'  
  //       }    
  //   }, function (err, respu) {
  //       if(err){
  //         console.log(err);
  //         resp.send(err);
  //       } else {
  //         console.log(respu);
  //         resp.send(respu)
  //       }
  //   });
    const service = google.admin({version: 'directory_v1', auth});
    service.users.list({
      customer: 'my_customer',
      maxResults: 10,
      //orderBy: 'email',
    }, (err, res) => {
      if (err) return console.error('The API returned an error:', err.message);
  
      const users = res.data.users;
      const gmail = google.gmail({version:'v1',auth});
      users.forEach(async user=>{
        gmail.users.settings.sendAs.list({userId:user.id}).then(respuesta=>{
          console.log(respuesta);
        })
      })
      let plantilla='';
      users.forEach(user=>{
        plantilla+=`<p>${user.name.givenName} con email ${user.emails[1].address} telefono${user.recoveryPhone}</p>`
      })
      resp.send(plantilla);
    });
  }