const Realm = require("realm")
//onst InventorySchema = require("./datastore/Inventory")
const BSON = require('bson')
const realmApp = new Realm.App({ id: "africom-pos-orjix" });
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

const InventorySchema = {
  name: 'Inventory',
  properties: {
    _id: 'objectId',
    _partition: 'string?',
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
async function run() {

  await realmApp.logIn(new Realm.Credentials.anonymous());

  //To sync changes in the background we create a OpenRealmBehaviorConfiguration object and set its type to "openImmediately".
  const OpenRealmBehaviorConfiguration = {
     type: "openImmediately",
  };
  // When you open a synced realm, the SDK automatically
  // creates the realm on the device (if it didn't exist already) and
  // syncs pending remote changes as well as any unsynced changes made
  // to the realm on the device.
  const realm = await Realm.open({
    schema: [InventorySchema],
    sync: {
      user: realmApp.currentUser,
      partitionValue: "myPartition",
      // The behavior to use when this is the first time opening a realm.
      newRealmFileBehavior: OpenRealmBehaviorConfiguration,
      // The behavior to use when a realm file already exists locally,
      // i.e. you have previously opened the realm.
      existingRealmFileBehavior: OpenRealmBehaviorConfiguration,

    },
  });
  // The myPartition realm is now synced to the device. You can
  // access it through the `realm` object returned by `Realm.open()`
  realm.write(() => {
    const newTask = realm.create("Inventory", {
      _id: new BSON.ObjectID(),
      _partition: "fahudPOS",
      name: 'White flower',
      barcode:1668994733567, 
      price: 25000,
      category:16788337,
      brand:"Cadbury",
      stock:1,
      itemId:0,
      quantity:15,
      expirydate: '12-12-2022'
    });
  });

  const syncSession = realm.syncSession;

  // Pause synchronization
syncSession.pause();
// Later, resume synchronization
syncSession.resume();
  // Query realm for all instances of the "Task" type.
const inventories = realm.objects("Inventory");

syncSession.addProgressNotification(
  "upload",
  "reportIndefinitely",
  (transferred, transferable) => {
    console.log(`${transferred} bytes has been transferred`);
    console.log(
      `There are ${transferable} total transferable bytes, including the ones that have already been transferred`
    );
  }
);

// remember to unregister the progress notifications
syncSession.removeProgressNotification((transferred, transferable) => {
  console.log(`There was ${transferable} total transferable bytes`);
  console.log(`${transferred} bytes were transferred`);
});
console.log('operation successful, number of items' +inventories.length + JSON.stringify(inventories));

}
run().catch(err => {
  console.error("Failed to open realm:", err)
});




