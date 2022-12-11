const app = require( "express" )();
const server = require( "http" ).Server( app );
const bodyParser = require( "body-parser" );
const Datastore = require( "nedb" );
//const Realm = require("realm");
const async = require( "async" );
const fileUpload = require('express-fileupload');
const multer = require("multer");
const fs = require('fs');
let Categories = require("./categories");
const { doesNotMatch } = require("assert");
var Readable = require('stream').Readable;
const BSON = require('bson')

// const Realm = require("realm")
// //onst InventorySchema = require("./datastore/Inventory")

// const realmApp = new Realm.App({ id: "fahud-final-0-mbtmd" });
// process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

const InventorySchema = {
    name: 'Inventory',
    properties: {
      _id: 'objectId',
      _partitionKey: 'string?',
      name: 'string',
      barcode:'int', 
      price:"int",
      category:"int",
      brand:"string",
      stock:"int",
      itemId:"int",
      quantity:"int",
      expirydate: 'string'
    },
    primaryKey: '_id',
  };

var stream = new Readable;
stream.setEncoding('UTF8');




const storage = multer.diskStorage({
    destination: process.env.APPDATA+'/POS/uploads',
    filename: function(req, file, callback){
        callback(null, Date.now() + '.jpg'); // 
    }

});

const excelStorage = multer.diskStorage({
    destination: './public/uploads',
    filename: function(req, file, callback){
        callback(null, Date.now() + '.xlsx'); // 
    }

});



let upload = multer({storage: storage});
let excelUpload = multer({storage: excelStorage});

//app.use(bodyParser.json());
app.use(bodyParser.json({limit:1024*1024*20, type:'application/json'}));
app.use(bodyParser.urlencoded({extended:true,limit:1024*1024*20,type:'application/x-www-form-urlencoding' }));



module.exports = app;

 
let inventoryDB = new Datastore( {
    filename: process.env.APPDATA+"/POS/server/databases/inventory.db",
    autoload: true
} );


inventoryDB.ensureIndex({ fieldName: '_id', unique: true });

 
app.get( "/", function ( req, res ) {

    res.send( "Inventory API" );
} );



app.get( "/product/:productId", function ( req, res ) {
  if ( !req.params.productId ) {
      res.status( 500 ).send( "ID field is required." );
  } else {
      inventoryDB.findOne( {
          barcode: parseInt(req.params.productId)
      }, function ( err, product ) {
          res.send( product );
      } );
  }
} );




app.get( "/products/all", function ( req, res ) {    
  inventoryDB.find( {}, function ( err, docs ) {
    res.send( docs );
  });
});



app.get( "/products", function ( req, res ) {    
    inventoryDB.find( {}).limit(10).exec(function ( err, docs ) {
      res.send( docs );
     // console.log(docs)
    });
  });

  app.get( "/products/:categoryId", function ( req, res ) {    
  //  console.log(parseInt(req.params.categoryId))
    inventoryDB.find({category: req.params.categoryId}, function ( err, products ) {
        if ( err ) console.log(err)
        else res.send( products );
     //   console.log(products)

    });
  });





app.post("/product/import",  function(req, res){

  let products = req.body;
  inventoryDB.insert(products, function (err, newDocs) {
      if ( err ) res.status( 500 ).send( err );
      else res.sendStatus( 200 );
    });

})



 app.get("/search/:searchQuery", (request, response) => {
  let inputReceived = request.params.searchQuery;
  let searchRegex = '^'+inputReceived;
  //console.log("input Received: ", inputReceived);

  inventoryDB.find(
    { name: { $regex: new RegExp(searchRegex.toLowerCase(), "i") } },
    
    (err, data) => {
      if (err) {
        console.log(err);
        response.end();
        return;
      }
    
      // console.log(data);
      response.send(data);
    }
  );
});

app.post( "/product/sku", function ( req, res ) {
    var request = req.body;
    inventoryDB.findOne( {
            barcode: parseInt(request.skuCode)
    }, function ( err, product ) {
         res.send( product );
    } );
} );


app.post( "/product/fileupload", excelUpload.single('imagename'), function ( req, res ) {
    
    let image = '';
  
    if(req.body.img != "") {
        image = req.body.img;        
    }

    if(req.file) {
        image = req.file.filename;  
    }
 
    res.send(image);
    
    if(req.body.remove == 1) {
        const path = './resources/app/public/uploads/product_image/'+ req.body.img;
        try {
          fs.unlinkSync(path)
        } catch(err) {
          console.error(err)
        }

        if(!req.file) {
            image = '';
        }
    }
    
});




app.post( "/product", upload.single('imagename'), function ( req, res ) {

    let image = '';
  
    if(req.body.img != "") {
        image = req.body.img;        
    }

    if(req.file) {
        image = req.file.filename;  
    }
 

    if(req.body.remove == 1) {
        const path = './resources/app/public/uploads/product_image/'+ req.body.img;
        try {
          fs.unlinkSync(path)
        } catch(err) {
          console.error(err)
        }

        if(!req.file) {
            image = '';
        }
    }
    

    let Product = {
        _id: req.body._id,
        barcode: parseInt(req.body.barcode),
        price: parseInt(req.body.price),
        itemId: req.body.itemId,
        discount: req.body.discount==""? 0: req.body.discount,
        category: req.body.category,
        quantity: req.body.quantity == "" ? 0 : req.body.quantity,
        name: req.body.name,
        expiredate: req.body.expiredate,
        brand: req.body.brand==''? "":req.body.brand,
        stock: req.body.stock == "on" ? 0 : 1,    
        img: image        
    }
  //  console.log('this is the new product'+JSON.stringify(Product))
if(req.body.savetype =='new'){
    Product._id = new BSON.ObjectID()+Math.floor(Date.now() / 1000);
//console.log('this is the new items id' + Product._id)
    if(req.body.barcode == "") { 
        Product.barcode= Math.floor(Date.now() / 1000);
        inventoryDB.insert( Product, function ( err, product ) {
            if ( err ) res.status( 500 ).send( err );
            else res.send( product );
        });
            }else{
                inventoryDB.insert( Product, function ( err, product ) {
                    if ( err ) res.status( 500 ).send( err );
                    else res.send( product );
                });
            }
    }else { 
        inventoryDB.update({
            _id: req.body._id
        }, Product, {}, function (
            err,
            numReplaced,
            product
        ) {
            if ( err ) res.status( 500 ).send( err );
            else res.sendStatus( 200 );
        } );

    }

});

 
app.delete( "/product/:productId", function ( req, res ) {
    inventoryDB.remove( {
        _id: parseInt(req.params.productId)
    }, function ( err, numRemoved ) {
        if ( err ) res.status( 500 ).send( err );
        else res.sendStatus( 200 );
    } );
} );

 

app.post( "/product/sku", function ( req, res ) {
    var request = req.body;
    inventoryDB.findOne( {
            _id: parseInt(request.skuCode)
    }, function ( err, product ) {
         res.send( product );
    } );
} );

app.post("/delete/all", function(req, res){
  inventoryDB.remove( {}, { multi: true },function(err){
       if(err) res.status(500).send(err);
      else{
         res.sendStatus(200);
      }
     }); 
  });

// app.post("/delete/all", function(req, res){
//     async function run() {

//         await realmApp.logIn(new Realm.Credentials.anonymous());
      
//         //To sync changes in the background we create a OpenRealmBehaviorConfiguration object and set its type to "openImmediately".
//         const OpenRealmBehaviorConfiguration = {
//            type: "openImmediately",
//         };
//         // When you open a synced realm, the SDK automatically
//         // creates the realm on the device (if it didn't exist already) and
//         // syncs pending remote changes as well as any unsynced changes made
//         // to the realm on the device.
//         const realm = await Realm.open({
//           schema: [InventorySchema],
//           sync: {
//             user: realmApp.currentUser,
//             partitionValue: "myPartition",
//             // The behavior to use when this is the first time opening a realm.
//             newRealmFileBehavior: OpenRealmBehaviorConfiguration,
//             // The behavior to use when a realm file already exists locally,
//             // i.e. you have previously opened the realm.
//             existingRealmFileBehavior: OpenRealmBehaviorConfiguration,
      
//           },
//         });
//         // The myPartition realm is now synced to the device. You can
//         // access it through the `realm` object returned by `Realm.open()`
//         realm.write(() => {
//             // Delete all instances of Cat from the realm.
//             realm.delete(realm.objects("Inventory"));
//           });
      
//         const syncSession = realm.syncSession;
      
//         // Pause synchronization
//       syncSession.pause();
//       // Later, resume synchronization
//       syncSession.resume();
//         // Query realm for all instances of the "Task" type.
//       const inventories = realm.objects("Inventory");
    
//       console.log('operation successful, number of items' +inventories.length + JSON.stringify(inventories));
      
//       }
//       run().catch(err => {
//         console.error("Failed to open realm:", err)
//       });


//   });
  




app.decrementInventory = function ( products ) {

    async.eachSeries( products, function ( transactionProduct, callback ) {
        inventoryDB.findOne( {
            _id: parseInt(transactionProduct.id)
        }, function (
            err,
            product
        ) {
    
            if ( !product || !product.quantity ) {
                callback();
            } else {
                let updatedQuantity =
                    parseInt( product.quantity) -
                    parseInt( transactionProduct.quantity );

                inventoryDB.update( {
                        _id: parseInt(product._id)
                    }, {
                        $set: {
                            quantity: updatedQuantity
                        }
                    }, {},
                    callback
                );
            }
        } );
    } );
};