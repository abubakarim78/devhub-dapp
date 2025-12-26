// Script to store upgrade info after publishing
// Run this after publishing: node store-upgrade-info.js

const upgradeInfo = {
  packageId: '0x43096e49e837fdf621305180a32f20c8ce8526583dbd363d05aeb852cb3693cb',
  devhubObjectId: '0x0a1ebcf69ed9ef0ca70d7f28d5169a73df2b68fb6eba763fe5cf8ddad3ffdf40',
  upgradeCapId: '0x44537dc5782da090b1981af922dbddc8ef1a3c4213066f28864e78b430cd6d36',
  adminCapId: '0xa14a2741802f825ed07bcceb59a9b9085ce4ae81d3faf2927f6861e6eefd532c',
};

console.log('Store these IDs in your frontend constants.ts file:');
console.log(JSON.stringify(upgradeInfo, null, 2));
console.log('\nThese IDs have been extracted from your publish transaction.');
