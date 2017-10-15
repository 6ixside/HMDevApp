var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://HMDEVSITE:savetimedomarketing@cluster0-shard-00-00-m1njp.mongodb.net:27017,cluster0-shard-00-01-m1njp.mongodb.net:27017,cluster0-shard-00-02-m1njp.mongodb.net:27017/test?ssl=true&replicaSet=Cluster0-shard-0&authSource=admin";

MongoClient.connect(url, function(err, db) {
  if (err) throw err;
  db.listCollections().toArray(function(err, collInfos){
  	console.log(collInfos)
  });

 /* db.collection("starwarscharacterdata").find({}).toArray(function(err, result){
  	console.log(result);

  })*/

  
  


  db.close();
});