const express = require('express');
const app = express();
const http = require('http').Server(app);

//communiquer avec la db via le serveur : utiliser mongoose
const mongoose = require('mongoose');

//connecter les clients entre eux via le serveur
const io = require('socket.io')(http);
const port = process.env.PORT || 3000;

//Se connecter à mongoDB via mongoose
//lien fourni par mongodb pour s'y connecter : le mettre en gitignore
const uri = "mongodb+srv://matth:matth@cluster0-024cv.mongodb.net/test?retryWrites=true&w=majority";
mongoose.connect(uri, {useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
//envoyer à un autre fichier:
//module.exports = ... 

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log("connection ok");//s'affiche si on est connecté à la DB
});

//body-parser (va trier les infos intéressantes): 
const bodyParser = require('body-parser');
//parse les app json
app.use(bodyParser.json());
//parse les app urlencoded
app.use(bodyParser.urlencoded({extended: false}));

//serveur
app.get('/', function(req, res){
  res.sendFile(__dirname + '/login.html');//le serveur app renvoit à la page login.html
});

//Création du modèle de message pour la DB via mongoose
const channel_1 = mongoose.model ("channel_1", {
  message: String
});

//Utilisation des sockets pour récupérer et distribuer l'info
io.on('connection', function(socket){
    //indique sur le terminal si un client se connecte ou se déconnecte
    console.log('a user connected');
    //envoie les messages stockés ds la DB au client qui se connecte
    channel_1.find({}, 'message', function(err, messages){//récupère ds DB
      if (err) return console.error(err);
      messages.map(message => {//casser l'objet en autant qu'il y a de messages
        console.log(message.message);//n'afficher que le message, pas l'ID ou les clés
        io.emit("chat message", message.message);//envoie aux clients via socket
      });
    });
    socket.on('disconnect', function(){
        console.log('user disconnected');
    });
    socket.on('chat message', function(msg){
      //affiche sur le terminal ce que note et envoie le client
      console.log('message: ' + msg);

      //envoyer un message à tt le monde, y compris l'expéditeur
      io.emit('chat message', msg);

      //envoyer message à la DB
      //indiquer que le message doit correspondre au model channel_1
      var message = new channel_1({message: msg});
      //Sauvegarder le message dans la DB channel_1
      message.save(function(err, msg) {
        if(err) return console.error(err);
        console.log("sent successfully");
      })
    });
});

//pour se créer un profil

//récupérer l'info sur la page suscribe.html
app.post('/sign_up', function(req,res){ 
  var name = req.body.name; 
  var pass = req.body.password; 

  var data = { 
      "name": name, 
      "password":pass, 
  }

const details = mongoose.model ("details", {
  name: String,
  password: String
});

  //pour envoyer l'info à la DB
const users = new details({name: name, password: pass});
//Sauvegarder le message dans la DB
users.save(function(err, msg) {
  if(err) return console.error(err);
  console.log("sent successfully");    
}); 
        
  return res.redirect('/chat');//dire où aller en cas de succès
});
app.get("/chat", (req,res)=> {//définir où trouver la route "/chat"
  res.sendFile(__dirname + '/index.html');//le serveur app renvoit à la page index.html
});

app.get('/',function(req,res){ 
res.set({ 
  'Access-control-Allow-Origin': '*'
  }); 
return res.redirect('/suscribe.html');
});
app.get("/suscribe", (req,res)=> {//définir où trouver la route "/chat"
  res.sendFile(__dirname + '/suscribe.html');//le serveur app renvoit à la page index.html
});


//pour se connecter:

//récupérer les infos sur la page login
app.post('/login', function(req,res){ 
  var name = req.body.name; 
  var pass = req.body.password;
  console.log(name + " " + pass);

  users.findOne({name: name}, function(err, Names){//récupère ds DB
    if (err) return console.error(err);
      console.log(Names);
  });

});


http.listen(port, function(){
  console.log('listening on *:' + port);
});

